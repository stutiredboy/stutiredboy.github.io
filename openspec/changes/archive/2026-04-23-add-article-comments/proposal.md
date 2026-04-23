## Why

`2026-04-19-modernize-blog-theme` 下线 Disqus 之后，文章页完全没有评论区。作者希望重新开口读者互动，但明确拒绝再引入第三方账号体系 + 重型 JS + 广告跟踪的老路。同时博客的发布基建本来就在 GitHub（仓库 + Actions + Pages），`stutiredboy/stutiredboy.github.io` 仓库天然就有 Discussions 能力 —— 把评论沉淀成 repo 自己的 Discussions，数据归属、反垃圾、身份验证都复用 GitHub，零新增基础设施。

选择 **giscus**：一段模板层的 `<script>` 就完成接入，主题前端代码不多于 20 行；历史评论随时可 export（就是 GraphQL 拉 Discussion）；停用时也只是把 include 删掉、Pelican 重新构建，读者层无残影。

## What Changes

- 新增主题模板 `themes/stuhouse/templates/includes/comments.html`：承载 giscus `<script>` 标签与配置属性
- 在 `themes/stuhouse/templates/article.html` 的 `.article-about` 之后、TOC 之前挂载 `comments.html` include
- `pelicanconf.py` 新增集中配置：`GISCUS_REPO = "stutiredboy/stutiredboy.github.io"`、`GISCUS_REPO_ID`、`GISCUS_CATEGORY = "Comments"`、`GISCUS_CATEGORY_ID`、`GISCUS_MAPPING = "pathname"`、`GISCUS_THEME`（light / dark / preferred_color_scheme 之一）
- 评论区仅在**生产构建**渲染：`comments.html` 用 `{% if SITEURL %}` 守卫，本地 `pelican --listen`（SITEURL=''）静默不渲染，避免本地预览污染真实 Discussions
- 支持文章级关闭：Metadata 可写 `Comments: false`，模板检查 `article.comments == 'false'` 时跳过渲染 —— 适用于置顶说明、存档类或作者不想开放讨论的帖子
- `themes/stuhouse/static/css/main.css` 新增 `.article-comments` 容器样式：与 `.article-related` / `.article-about` 保持同一视觉层级（上方分割线 + 标题 + 间距）
- `content/pages/about.md` 或页脚加一句"欢迎在文末评论（需要 GitHub 账号）" —— 可选，看作者意愿
- **不涉及**：`.github/workflows/deploy.yml`、URL 结构、任何文章 markdown、`view-counter-*` 三个现有 capability 的任何文件

## Capabilities

### New Capabilities

- `article-comments`: 基于 GitHub Discussions + giscus 的文章评论能力，包括挂载位置、映射策略、生产/本地行为差异、文章级开关、主题一致性与降级行为

### Modified Capabilities

（无 —— 此 change 纯新增能力）

## Impact

**Affected code:**

- 新增：`themes/stuhouse/templates/includes/comments.html`
- 修改：`themes/stuhouse/templates/article.html`（追加 include）
- 修改：`pelicanconf.py`（追加 GISCUS_* 配置）
- 修改：`themes/stuhouse/static/css/main.css`（追加 `.article-comments` 样式）
- 可选修改：`content/pages/about.md`（说明评论规则）

**External systems:**

- GitHub 仓库 `stutiredboy/stutiredboy.github.io`：
  - 开启 Discussions（Settings → Features）
  - 新建分类 "Comments"，格式选 "Announcement"（只有 maintainer 能开新 thread，读者只回复，giscus 会自动以 maintainer 身份开 thread）
  - 安装 [giscus GitHub App](https://github.com/apps/giscus) 并授权目标仓库

**Cost:**

- GitHub Discussions 免费、无上限；giscus 服务由社区维护，无账单
- 每篇文章首次访问时 giscus 创建一个 Discussion thread，常年累积 —— 公开 repo 无存储费

**Not affected:**

- Pelican 构建流程（只新增模板 include，构建时间增量可忽略）
- `view-counter-*` 三个 capability 的所有文件与路由
- CI workflow `.github/workflows/deploy.yml`
- URL 结构 `posts/{YYYY}-{MM}-{DD}/{slug}.html`
- 本地开发体验（本地不渲染评论区）
