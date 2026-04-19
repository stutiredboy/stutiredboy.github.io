## Context

`2026-04-19-modernize-blog-theme` 迁移到新主题 `stuhouse` 时明确把 GA/AdSense/Disqus 全部移除，主题目前**无任何运行时统计**。博客是 Pelican 静态站，源码在 `source` 分支，`output/` 由 CI 构建后推送到 `gh-pages` 由 GitHub Pages 托管。GitHub Pages **不提供访问日志**，GitHub Traffic API 只给 14 天 top paths 且要求 OAuth，对公开前端不可用 —— 这意味着任何"在线计数"都必须外挂第三方或自建后端。

作者约束：
- 博客读者以中文为主，国内访问延迟是硬指标
- 不希望再引入不可控第三方 JS（不蒜子服务偶尔抽风；去 GA 不久又接一个黑盒分析心理上拧巴）
- 统计口径"粗放"优先级高于"准确"
- 老文章不能因新启用统计显得"零阅读"，需要 seed 初始值
- 前端改动要尽量收敛在 article meta 一行 + 页脚一行

## Goals / Non-Goals

**Goals:**

- 每篇文章的 meta 行显示一个可信的"N 次阅读"数字
- 页脚显示整站 PV + UV 两个数字
- 数据归属作者本人（可迁移、可导出、可删除）
- 国内读者访问延迟 ≤ 100ms p50
- 老文章（2012 起）通过 seed 机制有合理的初始值
- seed 与实时数据**前端相加**，数据层与 seed 层解耦 —— 以后换后端时 seed 不动
- 全套运行在 Cloudflare 免费档内

**Non-Goals:**

- UV 的高精度（不纠结"同一人不同设备"或"登录态"）
- 机器人/爬虫识别与剔除
- 按来源、设备、地域等多维度分析
- 仪表板 / 图表（CF Dashboard 自带的已够）
- 历史趋势持久化（只存当前累计数，不存 time series）
- SSR / 构建时烘焙 —— 保持运行时取数，避免触发 CI
- 热门文章排行榜、文章页"相关阅读量最高"等衍生功能

## Decisions

### D1: 计数后端选 Cloudflare Worker + KV，而非不蒜子 / GoatCounter / 自建 VPS

**选择**：CF Worker 处理请求，KV 存累计值。

**理由**：

| 选项 | 否决原因 |
|---|---|
| 不蒜子 | 服务稳定性差（历史多次故障）；不支持写入 seed；多一条对 `busuanzi.ibruce.info` 的外链，与刚删一堆外链的主题基调冲突 |
| GoatCounter 云版 | 国内访问延迟未知且不可控；免费档对个人够用但把数据托管给第三方 |
| Umami / Plausible 自托管 | 要一台 VPS，和静态站的"零运维"定位冲突 |
| CF Worker + KV | 免费档足够；边缘节点国内延迟良好；用户已有 CF 账号；KV 的 `seed:<slug>` key 可以直接塞初始值；未来可复用（外链跳转、RSS 订阅统计等） |

### D2: Seed 在**前端**而非**后端**叠加

**选择**：`view-seeds.json` 作为主题静态资源构建进站点，JS 运行时读取并做 `display = seed[slug] + realtime`。KV 中**不**预先写入 seed 值。

**理由**：

- **解耦数据层和展示层**：以后换后端时 seed 逻辑一行不改
- **seed 在 git 历史里**：想调整某篇文章的初始值，就是一次普通的 JSON 编辑 + commit，审计友好
- **新文章自动 `seed = 0`**：无需特殊处理，seeds.json 里没这个 slug 就当 0
- 代价：seed.json 会随主题一起打包进 CI 输出，老 CDN 缓存要等 pelican 下次构建才会失效 —— 对频次极低的 seed 调整完全可接受

**替代方案**：在 KV 初始化时 `wrangler kv:bulk put seeds.json`。被否决是因为 KV 最终值是 "seed + 增量" 合并后的单一数字，调整 seed 时要"减掉旧 seed 再加新 seed"，非常容易出错。

### D3: UV 口径用 "IP + 当日 salt" 哈希到 KV Set

**选择**：每次请求用 `sha256(CF-Connecting-IP + YYYYMMDD + SECRET)` 作为 key 写入一个当日 KV set；整站 UV 返回当日 set 的 size 累加历史归档值。

**理由**：

- 粗放够用；不需要 Cookie；GDPR 友好（哈希 + 每日轮换 salt，不能反推原 IP）
- 跨日归档策略：每天 UTC 00:00 触发 CF Cron trigger，把昨日 UV set 的 size 累加到 `site:uv` 总计 key，然后删除 set

**替代方案**：不做 UV，只显示 PV。被否决是因为用户明确要求页脚"PV + UV"两指标。

### D4: API 形态是 `GET` 自增而非 `POST`

**选择**：`GET /v/<slug>` 在一个请求里完成"自增 + 返回当前值"；`GET /v/site` 同理。

**理由**：

- 浏览器一次 `fetch` 拿到数字，前端逻辑最短
- 不需要 CORS preflight（简单请求）
- CF Worker 的计费和限流对 GET/POST 无差别
- 副作用放在 GET 违反 REST 严格定义，但前端页面上的 "pingback-on-view" 行业惯例（Google Analytics、Plausible、GoatCounter 的 pixel beacon 全部 GET），不刻意追求纯洁

### D5: KV 并发写入用 "读-改-写" + 容忍丢失

**选择**：Worker 中 `const cur = await kv.get(key) ?? 0; await kv.put(key, cur + 1)`，**不**加锁、不做 atomic counter。

**理由**：

- KV 没有 atomic increment 原语
- 个人博客流量下，同一 slug 真正并发写入的概率极低
- 即使偶尔丢一两次计数，对"粗放"口径完全可接受
- 替代方案（用 Durable Object 做 atomic counter）过度工程；把免费额度挤窄且要写额外代码

### D6: KV Key 布局

```
pv:<slug>            uint               文章 PV 累计
site:pv              uint               整站 PV 累计
site:uv              uint               整站 UV 历史归档累计（昨日及之前）
uv_today:<YYYYMMDD>  set<hash>          今日 UV 唯一哈希集合（跨日归档后清空）
salt:<YYYYMMDD>      bytes              今日盐（Worker 启动时生成并缓存）
```

### D7: Worker 路由绑定到独立子域 `views.chenxiaosheng.com`

**选择**：在 Cloudflare 上把 `views.chenxiaosheng.com/*` 绑定到 Worker。

**理由**：

- 主域 `chenxiaosheng.com` 走 GitHub Pages（CNAME 指向 `stutiredboy.github.io`），不能同时绑 Worker
- 用 `*.chenxiaosheng.com` 通配 CNAME 指向 CF，再把 `views.` 这一层给 Worker 处理，零冲突
- 替代方案"走 Cloudflare Pages 代理整个博客"在本提案范围外，且会改变发布流程

### D8: Seed 数值生成规则

**规则**（在 `scripts/generate_view_seeds.py` 中实现）：

```
seed = max(
    comments_count * 120,          # Disqus 有评论的文章：每条评论 ≈ 120 阅读
    years_since_publish * 300      # 年份兜底：每年累积约 300 次阅读
)
# 然后向最近 50 取整，避免数字过于"精确"导致像假的
seed = round(seed, -2) if seed > 1000 else round(seed / 50) * 50
```

**理由**：

- 评论数是留下来的唯一真实信号，值得最大化利用
- 年份兜底保证新主题上线时没有文章显示 "0 次阅读"
- 取整让数字看着是自然数而非构造值
- 系数在脚本里是常量，生成后 `view-seeds.json` 入 git，以后可以手工微调个别文章

### D9: 前端降级策略

- `views.js` 的 fetch 失败时 → meta 行的 "阅读数" span 保持 `hidden`（不显示占位）
- 纯 JS 关闭的读者（罕见）→ 同上，看不到计数但不影响阅读
- Worker 返回 5xx → 前端静默失败
- KV 读失败 → Worker 返回 `{pv: 0}` 而不是 500，避免前端显示 "—"

## Risks / Trade-offs

- **[丢计数] KV 无 atomic incr** → 小流量下丢失率 < 1%，可接受；真有并发量再迁 Durable Object
- **[seed 造假被读者察觉]** → 如果读者真的把"2012 年文章显示 2500 次阅读"当回事，也只能承认 seed 的存在；考虑是否在 about 页或 RSS footer 写一句说明
- **[CF 免费额度耗尽]** → 每个 view 触发 2 次 KV write（pv + site:pv）+ 可能 1 次 UV set 写。免费档 1000 写/天 → 约等于 500 访客/天的天花板。实际小站流量远低于此；超过时会触发 429，前端降级即可
- **[跨日 UV 归档任务漏跑]** → CF Cron trigger 失败会导致 `uv_today` 不清空，下一日继续累计；设计上容忍：当 `uv_today:YYYYMMDD` 跨了自然日还在被写，就当作那一天的 UV 被"拉长"，数字偏高但不致命
- **[攻击者刷计数]** → 粗放口径已经接受"数字可被刷"的前提；如果被持续恶意刷（极端情况），CF 免费的 rate limit + Bot Fight Mode 能兜底
- **[本地开发看不到计数]** → `pelican --listen` 环境下没有 Worker，前端 fetch 会 CORS/失败；前端降级逻辑已覆盖 —— 本地直接"看不到数字"，不阻塞写文章

## Migration Plan

**Rollout 顺序**：

1. 部署 Worker 到 CF（此时无流量调用，零影响）
2. 运行 `scripts/generate_view_seeds.py` 生成 seed，入 git
3. 前端模板改动（meta 行 + 页脚 + js），入 git
4. 一次构建 + 推送 `gh-pages`
5. 观察 CF Dashboard 1 天，确认 Worker 请求量和错误率正常

**Rollback**：

- 前端问题：revert 主题 commit，CI 自动重新部署
- Worker 问题：在 CF Dashboard 把路由解绑，前端自动降级到"不显示计数"；或 `wrangler delete`
- seed 问题：编辑 `view-seeds.json` 重新构建

**无数据迁移**：KV 从零开始，不需要预填。

## Open Questions

1. **是否在 about 页或页脚加一行小字声明"阅读量含初始估算"**？取决于作者对 seed 数字的态度，留给实施阶段决定
2. **是否把 `view-seeds.json` 也开放给读者下载（作为透明度声明）**？默认"是"，因为它本就在 `/theme/data/view-seeds.json` 可直链访问
3. **Worker 的 `SECRET` salt 存哪里**：`wrangler secret put SALT_SECRET` 一次性塞进 Worker env，还是用每日轮换？倾向于前者（简单）+ "salt 每日拼接 date" 已经有足够的每日区分度
