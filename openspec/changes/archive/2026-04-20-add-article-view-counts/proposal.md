## Why

`2026-04-19-modernize-blog-theme` 把旧 GA、AdSense、Disqus 全部下线，主题目前处于"零统计"状态。作者需要一个轻量信号来判断哪些文章仍在被读、偶尔有多少人读，同时希望在文章页面本身展示一个让读者看得到的"阅读数"。在 GA 的历史污点之后，重新开口要解决三件事：数据归自己、前端克制、老文章不要因为刚启用统计而显得"无人问津"。

## What Changes

- 新增 Cloudflare Worker + KV 作为计数后端：文章详情页触发 `GET /v/<slug>` 自增并返回该篇 PV；站点任意页触发 `GET /v/site` 自增并返回整站 PV/UV
- 新增主题静态资源 `themes/stuhouse/static/data/view-seeds.json`，存放每篇文章的初始值偏移 `{slug: offset}`
- 新增主题 JS 模块 `themes/stuhouse/static/js/views.js`：负责调 Worker、叠加 seed、格式化数字、容错降级
- 文章 meta 行（`includes/article_meta.html`）新增"👁 N 次阅读"一项，紧跟在"阅读时长"之后
- 页脚（`includes/footer.html`）新增"本站总阅读 N · 访客 N"一行
- 新增仓库目录 `worker/`：Worker 源码、`wrangler.toml`、README
- 新增一次性脚本 `scripts/generate_view_seeds.py`，基于 Disqus 评论数 × 系数 + 发表年份兜底生成 `view-seeds.json`
- 计数口径：**粗放全算**，不做 IP/Cookie 去重，不排机器人；UV 用 CF Worker 标准做法以 `CF-Connecting-IP` + 当日 salt 折算
- **不涉及**：`pelicanconf.py`、CI workflow、文章正文 markdown、URL 结构

## Capabilities

### New Capabilities

- `view-counter-backend`: Cloudflare Worker + KV 实现的 PV/UV 计数服务，暴露 `GET /v/<slug>` 与 `GET /v/site` 两个 HTTP 端点
- `view-counter-display`: 主题层对浏览量的呈现与 seed 叠加逻辑，包括文章 meta 行与页脚两处展示、加载失败时的降级、数字格式化
- `view-seed-generation`: 从 Disqus 历史评论和文章发表年份推导 `view-seeds.json` 初始值的一次性工具与规则

### Modified Capabilities

（无现存 spec，项目是 OpenSpec 的第一条新增规范流）

## Impact

**Affected code:**

- 新增：`worker/src/index.ts`, `worker/wrangler.toml`, `worker/README.md`
- 新增：`themes/stuhouse/static/data/view-seeds.json`
- 新增：`themes/stuhouse/static/js/views.js`
- 新增：`scripts/generate_view_seeds.py`
- 修改：`themes/stuhouse/templates/includes/article_meta.html`（追加 views 槽位）
- 修改：`themes/stuhouse/templates/includes/footer.html`（追加 site stats 槽位）
- 修改：`themes/stuhouse/templates/base.html`（引入 views.js，带 `defer`）

**External systems:**

- Cloudflare account（用户已有）：新建 Worker 一个、KV namespace 一个、自定义域路由（子域如 `views.chenxiaosheng.com` 或 `chenxiaosheng.com/v/*` 路径路由）

**Cost:**

- CF 免费档：Worker 100k req/day、KV 1k write/day + 100k read/day —— 对个人博客流量绰绰有余，不预计进入付费档

**Not affected:**

- `pelicanconf.py`（主题结构不变）
- `.github/workflows/deploy.yml`（构建流程不变）
- `content/` 下所有文章 markdown
- URL 结构 `posts/{YYYY}-{MM}-{DD}/{slug}.html`
