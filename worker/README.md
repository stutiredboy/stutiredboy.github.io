# blog-views Worker

Cloudflare Worker + KV 实现的博客浏览量计数服务。详见 `openspec/changes/archive/<date>-add-article-view-counts/` 下的 design.md 与 specs/。

## 端点

- `GET /v/<slug>` → `{"pv": n}` 文章 PV 自增
- `GET /v/site`   → `{"pv": n, "uv": m}` 整站 PV/UV 自增
- Cron（UTC 00:05 每日）→ 昨日 UV 归档

## 首次部署

```bash
cd worker
npm install
wrangler login
wrangler kv namespace create VIEWS              # 记录 id
wrangler kv namespace create VIEWS --preview    # 记录 preview_id
# 把两个 id 填进 wrangler.toml 的 [[kv_namespaces]] 段

openssl rand -hex 32 | wrangler secret put SALT_SECRET   # 粘贴生成的随机串

wrangler deploy
```

## 本地开发

```bash
cp .dev.vars.example .dev.vars   # 或手动创建，写一行：SALT_SECRET="localdev"
wrangler dev
curl http://localhost:8787/v/test-slug
curl http://localhost:8787/v/site
```

## 自定义域

```toml
# wrangler.toml
[[routes]]
pattern = "views.chenxiaosheng.com/*"
zone_name = "chenxiaosheng.com"
```

前置：在 CF DNS 页面为 `views` 子域加一条 A 或 AAAA 记录（值任意，orange cloud on），Worker 路由会接管。

## KV key 布局

| Key                          | 类型   | 说明                              |
|------------------------------|--------|-----------------------------------|
| `pv:<slug>`                  | uint   | 文章 PV 累计                      |
| `site:pv`                    | uint   | 整站 PV 累计                      |
| `site:uv`                    | uint   | 整站 UV 历史归档累计（昨日及之前）|
| `uv_today:<YYYYMMDD>:<hash>` | "1"    | 当日某 IP 访问过的标记（TTL 48h）|

`uv_today:<date>:*` 在每日 cron 里被统计数量累加到 `site:uv` 后删除。

## 常见操作

**重置某篇文章计数**：

```bash
wrangler kv key put --binding=VIEWS "pv:<slug>" "0"
```

**手动触发归档任务**（调试 cron）：

```bash
wrangler dev --test-scheduled
curl "http://localhost:8787/cdn-cgi/handler/scheduled"
```

**轮换 SALT_SECRET**：

```bash
openssl rand -hex 32 | wrangler secret put SALT_SECRET
# 轮换后当日 UV 哈希命名空间重算，短期 UV 会偏高（可接受）
```

## 成本

CF 免费档：Worker 100k req/day、KV 1k write/day + 100k read/day。按单篇文章计数 1 write + 站点计数 2 write，单日访客上限约 300。超出会返回 429，前端已配置静默降级。
