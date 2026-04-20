## ADDED Requirements

### Requirement: Per-article PV endpoint

系统 SHALL 暴露 `GET https://views.chenxiaosheng.com/v/<slug>` 端点。收到请求时 MUST 对 KV key `pv:<slug>` 执行"读当前值 → 加 1 → 写回"，并在响应体中返回最新累计值（不含 seed）。响应 MUST 是 JSON `{"pv": <int>}`，状态码 200，`Content-Type: application/json`。响应头 MUST 包含 `Access-Control-Allow-Origin: https://www.chenxiaosheng.com` 以及 `Cache-Control: no-store`。

#### Scenario: 首次访问某篇文章

- **WHEN** 某浏览器请求 `GET /v/install-bind-mysql-dlz` 且 KV 中不存在 `pv:install-bind-mysql-dlz`
- **THEN** 系统向 KV 写入 `pv:install-bind-mysql-dlz = 1`，响应 `{"pv": 1}`

#### Scenario: 重复访问递增

- **WHEN** KV 中 `pv:foo = 42`，收到 `GET /v/foo`
- **THEN** 系统将 `pv:foo` 更新为 43，响应 `{"pv": 43}`

#### Scenario: Slug 含非法字符被拒

- **WHEN** 收到 `GET /v/../site` 或 slug 含 `/`、空格、路径穿越字符
- **THEN** 系统响应 400 且不触及 KV

#### Scenario: KV 读取失败时的降级

- **WHEN** KV `get` 抛出异常
- **THEN** 系统返回 `{"pv": 0}` 状态码 200（而非 5xx），让前端静默隐藏数字

### Requirement: Site-wide PV and UV endpoint

系统 SHALL 暴露 `GET https://views.chenxiaosheng.com/v/site` 端点。收到请求时 MUST 执行三件事：
1. 对 KV key `site:pv` 执行读-加-写，记为新 `site:pv`
2. 用 `sha256(CF-Connecting-IP || 当日 YYYYMMDD || SALT_SECRET)` 计算哈希，若该哈希未出现在 `uv_today:<YYYYMMDD>` set 中则写入
3. 返回 `{"pv": site_pv, "uv": site_uv_total + today_set_size}`，其中 `site_uv_total` 是 KV key `site:uv` 的值（昨日及之前归档 UV）

响应 MUST 是 JSON，状态码 200，并带 CORS 头同 `GET /v/<slug>`。

#### Scenario: 当日首个请求

- **WHEN** 今日 UTC 无任何请求，某 IP 访问 `GET /v/site`
- **THEN** `site:pv` 从 N 增至 N+1；`uv_today:<today>` set 写入一个哈希；响应 `uv` 等于 `site:uv + 1`

#### Scenario: 同一 IP 当日重复访问

- **WHEN** 同一 IP 已访问过 /v/site，再次访问
- **THEN** `site:pv` 再 +1，但 `uv_today` set 不新增条目，响应 `uv` 不变

#### Scenario: 不同 IP 当日首次访问

- **WHEN** IP A 已访问过，IP B 首次访问
- **THEN** `site:pv` +1，`uv_today` set 新增 1 条，响应 `uv` 比上一次高 1

### Requirement: Daily UV archival via scheduled trigger

系统 SHALL 配置一个 Cloudflare Cron Trigger，每天 UTC 00:05 执行归档任务：读取 `uv_today:<YESTERDAY>` 的 set size，累加到 `site:uv`，然后删除该 set。任务 MUST 幂等：重复运行同一日归档不能重复累加。

#### Scenario: 跨日正常归档

- **WHEN** UTC 00:05，`uv_today:20260419` set size = 87，`site:uv` = 1234
- **THEN** 任务后 `site:uv` = 1321，`uv_today:20260419` 被删除

#### Scenario: 归档任务重试不重复累加

- **WHEN** 归档任务已在 00:05 成功处理 2026-04-19，因某种原因 00:10 再次触发同一天归档
- **THEN** 第二次运行发现 `uv_today:20260419` 不存在，直接 no-op，`site:uv` 不变

### Requirement: Slug validation

系统 MUST 对路径中的 slug 做严格校验：首字符为 `[A-Za-z0-9]`，后续字符为 `[A-Za-z0-9._-]`，总长度 1-100。历史文章中存在含大写字母、点号、下划线的 slug（如 `how-to-top-up-U.S-AppleID-for-Chinese`、`mac_osx_iterm2_utf8_gbk_switch`、`aliyuncs.com-downgrade`），这些都 MUST 通过校验。不符合的请求 MUST 响应 400 且不写 KV。

#### Scenario: 合法 slug（kebab-case）

- **WHEN** 请求 `/v/debian-add-cnnic-ca`
- **THEN** 通过校验，进入计数流程

#### Scenario: 合法 slug（含大写、点号、下划线）

- **WHEN** 请求 `/v/how-to-top-up-U.S-AppleID-for-Chinese` 或 `/v/mac_osx_iterm2_utf8_gbk_switch` 或 `/v/aliyuncs.com-downgrade`
- **THEN** 通过校验，进入计数流程

#### Scenario: 含斜杠或路径穿越

- **WHEN** 请求 `/v/foo/bar` 或 `/v/../site` 或 `/v/.hidden`
- **THEN** 响应 400，KV 零写入

#### Scenario: 超长

- **WHEN** slug 长度 > 100
- **THEN** 响应 400

### Requirement: CORS restricted to production origin

系统 MUST 仅对 `Origin: https://www.chenxiaosheng.com` 返回 `Access-Control-Allow-Origin` 头；其他 Origin MUST 不返回该头（让浏览器阻止读取响应）。Worker 本身仍然处理请求以保持计数简单。

#### Scenario: 同站 Origin

- **WHEN** 请求头 `Origin: https://www.chenxiaosheng.com`
- **THEN** 响应 `Access-Control-Allow-Origin: https://www.chenxiaosheng.com`

#### Scenario: 第三方 Origin

- **WHEN** 请求头 `Origin: https://evil.example.com`
- **THEN** 响应不包含 `Access-Control-Allow-Origin` 头

### Requirement: Free-tier cost containment

系统 MUST 保证每次 `GET /v/<slug>` 最多产生 1 次 KV read + 1 次 KV write；每次 `GET /v/site` 最多 3 次 KV read + 2 次 KV write。设计 MUST 避免在请求路径上的循环或批量操作。

#### Scenario: 单次文章计数

- **WHEN** `GET /v/foo`
- **THEN** KV 操作总数 ≤ 2

#### Scenario: 单次站点计数

- **WHEN** `GET /v/site`
- **THEN** KV 操作总数 ≤ 5
