## ADDED Requirements

### Requirement: 文章底部渲染评论区块

每篇文章页（由 `themes/stuhouse/templates/article.html` 渲染）MUST 在 `.article-about` 之后、`includes/toc.html` 之前渲染一个 `<section class="article-comments">` 区块。该区块 MUST 包含一个 `<h2 class="article-comments-title">评论</h2>` 和一个承载 giscus `<script>` 标签的容器。`.article-comments` 区块的外观（上边框、间距、字号）MUST 与相邻的 `.article-related` / `.article-about` 保持一致。

#### Scenario: 普通文章页

- **WHEN** 访问 `/posts/2026-04-22/claude-vs-codex-beer-game-two-rounds.html`
- **THEN** 页面在"关于作者"卡片下方出现"评论"区块，并加载 giscus iframe

#### Scenario: 评论区位置稳定

- **WHEN** 文章带有或不带 "相关文章" section（取决于 `pelican_related` 输出）
- **THEN** 评论区始终紧跟在 "关于作者" 之后、TOC 之前，位置不因相关文章有无而漂移

### Requirement: Giscus 配置通过 Pelican 全局配置注入

Giscus 脚本的 `data-repo`、`data-repo-id`、`data-category`、`data-category-id`、`data-mapping`、`data-theme` 属性值 MUST 从 `pelicanconf.py` 的 `GISCUS_REPO` / `GISCUS_REPO_ID` / `GISCUS_CATEGORY` / `GISCUS_CATEGORY_ID` / `GISCUS_MAPPING` / `GISCUS_THEME` 变量读取。`data-mapping` MUST 固定为 `"pathname"`，保证文章与 Discussion thread 的绑定随 URL 而非随标题。模板 MUST NOT 在 `comments.html` 中硬编码仓库名、分类或 ID 值。

#### Scenario: 切换主题色

- **WHEN** 作者把 `pelicanconf.py` 中 `GISCUS_THEME` 从 `"preferred_color_scheme"` 改为 `"light"` 并重新构建
- **THEN** 产出的 HTML 中 `<script>` 的 `data-theme` 属性值为 `"light"`

#### Scenario: pathname 映射稳定性

- **WHEN** 文章标题从 "Claude vs Codex Beer Game" 改为 "Claude 与 Codex 啤酒游戏"，但 Slug 和 Date 未变
- **THEN** 评论仍挂在同一个 Discussion thread（pathname 未变）；若改 Slug 或 Date，则会在 Discussions 中创建新 thread，历史评论与新文章脱钩（已知代价）

### Requirement: 生产构建才渲染评论脚本

`comments.html` MUST 由顶层 `{% if SITEURL %}` 守卫。当 `SITEURL` 为空字符串（如 `pelicanconf.py` 本地预览模式）时，评论区块 MUST NOT 出现在 HTML 产物中；当 `SITEURL` 非空（如 `publishconf.py` 的生产构建）时，区块 MUST 正常渲染。

#### Scenario: 本地预览不渲染评论

- **WHEN** 作者执行 `pelican content -o output -s pelicanconf.py -t themes/stuhouse && pelican --listen`
- **THEN** 浏览器访问任一文章页不显示"评论"区块；HTML 源码中不出现 `giscus.app/client.js`

#### Scenario: 生产构建渲染评论

- **WHEN** CI 执行 `pelican content -o output -s publishconf.py -t themes/stuhouse`（或任何 `SITEURL` 非空的构建）
- **THEN** `output/posts/<date>/<slug>.html` 中包含 `<script src="https://giscus.app/client.js" ...>` 标签

### Requirement: 文章级关闭开关

Pelican 文章 Metadata 中出现 `Comments: false`（大小写不敏感）时，该篇文章 MUST NOT 渲染评论区块。未提供该字段或提供非 `false` 值时，MUST 正常渲染评论区块（即默认开启）。

#### Scenario: 显式关闭

- **WHEN** 文章 frontmatter 包含 `Comments: false`
- **THEN** 产出 HTML 中不出现 `.article-comments` section 与 giscus 脚本

#### Scenario: 未声明时默认开启

- **WHEN** 文章 frontmatter 未包含 `Comments` 字段
- **THEN** 产出 HTML 中包含 `.article-comments` section 与 giscus 脚本（前提：`SITEURL` 非空）

#### Scenario: Comments: true 显式开启

- **WHEN** 文章 frontmatter 包含 `Comments: true`
- **THEN** 行为与未声明一致 —— 渲染评论区块

### Requirement: 评论区仅出现在文章页

评论区块 MUST 仅在 Pelican 的文章模板 (`article.html`) 中被 include。页面模板 (`page.html`)、首页 (`index.html`)、归档 (`archives.html`)、标签 (`tag.html` / `tags.html`)、作者 (`author.html`)、分类 (`category.html`) 模板 MUST NOT 引用 `includes/comments.html`。

#### Scenario: About 页

- **WHEN** 读者访问 `/pages/about.html`
- **THEN** 页面不出现评论区块

#### Scenario: 标签聚合页

- **WHEN** 读者访问某个标签聚合页
- **THEN** 页面不出现评论区块

### Requirement: 评论加载失败不破坏文章阅读

Giscus 脚本加载失败（网络错误、浏览器屏蔽 giscus.app、iframe 被 adblock 拦截）时，文章正文、相关文章、作者卡片和 TOC MUST 保持正常显示与布局。`.article-comments` 容器在评论加载失败时可以为空或显示浏览器原生 iframe 错误，但 MUST NOT 阻塞其他区块。

#### Scenario: 读者屏蔽 giscus.app

- **WHEN** 读者用 uBlock Origin 添加 `||giscus.app^` 规则后访问文章
- **THEN** 文章正文、相关文章、TOC 正常；评论区标题仍显示，iframe 位置空白，无 JS 报错阻塞页面

#### Scenario: 浏览器禁用 JavaScript

- **WHEN** 读者禁用 JS
- **THEN** 文章正文完整可读；评论区标题可能保留但无 iframe 内容；页面布局不错位

### Requirement: 评论区对读者明示身份要求

`.article-comments` section 内 MUST 在 giscus iframe 上方包含一行 hint 文字，说明「评论使用 GitHub Discussions 承载；留言需要 GitHub 账号」或语义等价的说明，避免不熟悉 GitHub 的读者对登录入口感到困惑。

#### Scenario: Hint 文字存在

- **WHEN** 读者访问文章页
- **THEN** 评论区块标题之下、giscus iframe 之上显示一行说明文字

### Requirement: Giscus 脚本核心属性

注入的 `<script>` 标签 MUST 包含以下核心属性（值由 `pelicanconf.py` 配置）：`src="https://giscus.app/client.js"`、`data-repo`、`data-repo-id`、`data-category`、`data-category-id`、`data-mapping="pathname"`、`data-theme`、`data-lang="zh-CN"`、`crossorigin="anonymous"`、`async`。其他 giscus 属性（`data-strict`、`data-reactions-enabled`、`data-emit-metadata`、`data-input-position`、`data-loading` 等）为偏好项，可按 giscus.app 配置器输出直接保留或后续调整，SPEC 层不约束具体值。

#### Scenario: UI 语言

- **WHEN** 读者访问任一文章页
- **THEN** giscus iframe 内的按钮、占位符、提示文字显示为简体中文

#### Scenario: 核心属性完备

- **WHEN** 生产产物中出现 giscus `<script>` 标签
- **THEN** 上述核心属性全部存在且非空（`data-repo-id` / `data-category-id` 为 GitHub 分配的字符串 id，`data-mapping` 值恒为 `pathname`）
