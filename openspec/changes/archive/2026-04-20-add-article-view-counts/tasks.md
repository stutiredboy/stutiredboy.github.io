## 1. Cloudflare 账户与工具准备

- [x] 1.1 在本机安装 wrangler：`npm install -g wrangler`（或 `brew install cloudflare-wrangler`），确认 `wrangler --version` 输出 ≥ 3.x
- [x] 1.2 登录 CF：`wrangler login`（浏览器完成 OAuth），登录后 `wrangler whoami` 应显示 CF 账户邮箱
- [x] 1.3 确认 `chenxiaosheng.com` 这个 zone 已在 CF 上、且 DNS 托管在 CF（Registrar 或 NS 指向 CF）
- [x] 1.4 如果主域当前通过 GitHub Pages 但未经 CF 代理（橙云 off），无需改动；Worker 将绑定到子域 `views.chenxiaosheng.com`，不影响主站

## 2. 创建 KV namespace

- [x] 2.1 在仓库根下新建目录 `worker/`
- [x] 2.2 `cd worker && wrangler kv namespace create VIEWS`，记录返回的 `id`（生产）
- [x] 2.3 `wrangler kv namespace create VIEWS --preview`，记录 `preview_id`（本地开发预览）
- [x] 2.4 把两个 id 写进 `worker/wrangler.toml` 的 `[[kv_namespaces]]` 段

## 3. Worker 代码与配置

- [x] 3.1 创建 `worker/wrangler.toml`：`name = "blog-views"`、`main = "src/index.ts"`、`compatibility_date`、`[[kv_namespaces]] binding = "VIEWS"` + 上面两个 id、`[triggers] crons = ["5 0 * * *"]`
- [x] 3.2 创建 `worker/src/index.ts`：
  - `GET /v/:slug` → slug 校验 `^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$`（兼容历史文章中的大写/点号/下划线 slug） → 读 `pv:<slug>`、+1、写回、返回 JSON；按 spec 设置 CORS 响应头
  - `GET /v/site` → `site:pv` 读-加-写；计算 `sha256(ip + YYYYMMDD + SALT)` → 如果不在 `uv_today:<YYYYMMDD>` set 中则加入；返回 `{pv, uv: site_uv_total + today_size}`
  - `scheduled` 事件处理器：归档 `uv_today:<yesterday>` → 累加到 `site:uv` → 删除 set；幂等
  - 其他路径 → 404
  - 所有 KV 失败路径返回 200 + 降级值（0），不返回 5xx
- [x] 3.3 `wrangler secret put SALT_SECRET`，粘贴一串 32 字节随机字符串（`openssl rand -hex 32` 生成）
- [x] 3.4 本地测试：`wrangler dev` 启动，curl `http://localhost:8787/v/test-slug` 和 `/v/site` 验证返回
- [x] 3.5 部署：`wrangler deploy`，记录输出里的 `*.workers.dev` 临时 URL，curl 验证

## 4. 自定义路由绑定

- [x] 4.1 在 CF Dashboard → DNS 中为 `views` 子域添加一条 AAAA 记录指向 `100::`（或用 A 记录 `192.0.2.1` 的"占位"，仅为让 Worker 路由生效），Proxy 状态：orange cloud on —— 改为 custom_domain 自动处理
- [x] 4.2 在 CF Dashboard → Workers Routes（或 `worker/wrangler.toml` 的 `routes` 段）添加：`views.chenxiaosheng.com/*` → `blog-views` Worker —— 改为 wrangler.toml 的 custom_domain = true
- [x] 4.3 curl `https://views.chenxiaosheng.com/v/test-slug` 和 `/v/site` 从公网验证，响应应包含 CORS 头
- [x] 4.4 验证 `OPTIONS` 或跨域 origin 不是 `https://www.chenxiaosheng.com` 时，响应不含 `Access-Control-Allow-Origin`

## 5. Seed 生成脚本

- [x] 5.1 登录 Disqus Admin → `chenxiaosheng` 站 → Community → 导出评论 XML，保存到 `scripts/disqus-export.xml`（该文件不入 git，`.gitignore` 添加）—— 跳过，采用纯年份兜底
- [x] 5.2 创建 `scripts/generate_view_seeds.py`：
  - 读取 `content/*.md`，从 frontmatter 提取 `Slug` 与 `Date` 年份
  - 若 `scripts/disqus-export.xml` 存在：解析 XML，按 `<thread><link>` 中的 slug 聚合评论数；否则发 warning 继续
  - 按设计 D8 的公式计算 seed，`round_to_50` / `round_to_100`
  - 读现有 `themes/stuhouse/static/data/view-seeds.json`（如存在），保留 `_overrides` 数组里列出的 slug 的值
  - 输出 JSON，key 按字母序，2 空格缩进，UTF-8，末尾换行
- [x] 5.3 运行 `python scripts/generate_view_seeds.py`，检查 `themes/stuhouse/static/data/view-seeds.json` 生成是否合理（人工 spot check 3-5 篇文章的 seed 值）
- [x] 5.4 对明显不合理的个别文章手工调整并加入 `_overrides` —— 跳过，当前值全盘接受

## 6. 主题前端接入

- [x] 6.1 创建 `themes/stuhouse/static/js/views.js`：
  - 顶部常量 `WORKER_BASE = 'https://views.chenxiaosheng.com'`
  - 页面加载时 `fetch(WORKER_BASE + '/v/site')` → 成功则填 `#site-pv` / `#site-uv` 并 show 整行
  - 若 `document.body.dataset.slug` 存在（文章页），并行 fetch `/theme/data/view-seeds.json` 和 `/v/<slug>`；Promise.allSettled 合并后 `display = (seed[slug] || 0) + pv` 填入 `#article-pv` 并 show
  - 所有数字用 `Intl.NumberFormat('en-US').format(n)` 格式化
  - 失败路径：保持元素隐藏，console.warn
- [x] 6.2 改 `themes/stuhouse/templates/base.html`：
  - `<body>` 加 `{% if article %}data-slug="{{ article.slug }}"{% endif %}`
  - 底部 `views.js` 引入，带 `defer`
- [x] 6.3 改 `themes/stuhouse/templates/includes/article_meta.html`：
  - 在"阅读时长" span 之后、"tags" 之前新增：
    ```html
    <span class="article-meta-item" id="article-pv-wrap" hidden>
      {% include 'includes/icons/eye.svg' %}
      <span id="article-pv"></span> 次阅读
    </span>
    ```
- [x] 6.4 创建 `themes/stuhouse/templates/includes/icons/eye.svg`（12-14 行内联 SVG，和现有 `calendar.svg` / `clock.svg` 一个尺寸）
- [x] 6.5 改 `themes/stuhouse/templates/includes/footer.html`：
  - 新增 `<p class="site-stats" id="site-stats-wrap" hidden>本站累计阅读 <span id="site-pv"></span> 次 · 访客 <span id="site-uv"></span> 人</p>`
- [x] 6.6 在 `themes/stuhouse/static/css/main.css` 为 `.site-stats` 加与页脚其他行一致的排版样式；为 `#article-pv-wrap` 复用 `.article-meta-item` 的样式

## 7. 本地构建与验收

- [x] 7.1 `export PYTHONPATH=$PWD:$PYTHONPATH && pelican content -o output -s pelicanconf.py -t themes/stuhouse`，确认构建无报错
- [x] 7.2 `pelican --listen`，浏览器打开 `http://localhost:8000`
  - 首页：页脚无"本站累计阅读..."行（因为 fetch 到 `views.chenxiaosheng.com` 会被 CORS 或 DNS 拒绝）—— 符合"本地静默"设计
  - 打开一篇文章：meta 行无"次阅读"项 —— 符合预期
  - Console 应有 warning，无 error
- [x] 7.3 验证 `output/theme/data/view-seeds.json` 被构建输出（`static/data/` 作为主题静态资源被 pelican 原样复制）
- [x] 7.4 验证 `output/theme/js/views.js` 存在且 `defer` 正确引入

## 8. 上线与观察

- [x] 8.1 git 提交所有改动，推送 `source` 分支触发 CI
- [x] 8.2 CI 完成后访问 `https://www.chenxiaosheng.com/`：DevTools Network 应见两次请求到 `views.chenxiaosheng.com/v/site`（首页）或 `/v/<slug> + /v/site`（文章页）；页脚和 meta 行应显示数字
- [x] 8.3 多刷 3-5 次，确认文章 PV 每次都 +1、整站 UV 不增（同 IP）、PV 每次 +1
- [x] 8.4 24h 后检查 CF Dashboard → Workers → blog-views：请求量 / 错误率 / KV ops 在预期范围；cron 在 UTC 00:05 成功触发
- [x] 8.5 验证跨日归档：次日早上检查 KV，`uv_today:<yesterday>` 已被删除、`site:uv` 累加了前一日 UV

## 9. 文档与后记

- [x] 9.1 `worker/README.md` 写清楚：部署命令、KV key 布局、如何手动重置某 slug 计数、如何调整 SALT_SECRET
- [x] 9.2 在 `content/pages/about.md` 底部加一小段"关于阅读量"的说明（可选，看作者意愿）：透明披露 seed 存在 —— 跳过
