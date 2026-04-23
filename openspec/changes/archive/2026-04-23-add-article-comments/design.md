## Context

博客是 Pelican 静态站，`source` 分支由 GitHub Actions 构建为 `gh-pages` 部署到 GitHub Pages，自定义域 `www.chenxiaosheng.com`。主题 `themes/stuhouse/` 是自研 Bootstrap-free 的极简主题，`2026-04-19-modernize-blog-theme` 刚把 GA、AdSense、Disqus 全部清理掉。

作者约束：

- 不要再引入第三方账号体系 + 重型 JS + 广告跟踪的老路
- 优先复用现有基建（GitHub / CF，本文件只涉及 GitHub 侧）
- 评论数据归作者本人，可导出、可迁移、可删除
- 读者门槛可以接受"需要 GitHub 账号" —— 博客读者偏技术向，本身与 GitHub 账号用户重合度高
- 视觉与 `stuhouse` 的 Nord 色系保持一致，不破坏文章页的阅读流

## Goals / Non-Goals

**Goals:**

- 每篇文章页底部有一块嵌入式评论区，读者用 GitHub 账号登录后可留言
- 评论数据沉淀在 `stutiredboy/stutiredboy.github.io` 的 Discussions 里，使用作者的 GitHub 审核/删除能力
- 主题前端改动收敛在一个 include + 一处 article.html 挂载点 + 少量 CSS
- 允许按文章粒度关闭评论
- 本地 `pelican --listen` 不触发 giscus（不污染真实 Discussions）
- 评论加载失败（读者屏蔽 giscus.app、网络抖动）时，文章主体阅读体验不受影响

**Non-Goals:**

- 匿名评论 / 邮箱评论 / 微博账号登录
- 评论数在文章列表页展示（像"N 条评论"角标）
- 首页/归档/标签页任何评论组件
- 移植历史 Disqus 评论到 Discussions（历史评论接受丢失）
- 评论 SEO（giscus 是 iframe，内容本来就不被爬虫收录，与 Disqus 同）
- 实时通知（作者订阅 Discussion 通知即可，不做站内）
- 评论审核工作流的自动化（用 GitHub Discussions 原生即可）

## Decisions

### D1: 评论方案选 giscus (GitHub Discussions) 而非 utterances / Disqus / Staticman

**选择**：giscus，映射到 GitHub Discussions。

**理由**：

| 选项 | 否决原因 |
|---|---|
| Disqus | 刚在 `modernize-blog-theme` 下线，带广告、跟踪、~500KB JS，与主题基调冲突 |
| utterances | 基于 GitHub Issues；Issues 本意是"可关闭的 bug 追踪"，用作评论载体语义不对；Discussions 语义更贴近论坛 |
| Staticman | 需要自建或 Heroku 部署服务；评论以 PR 形式回写触发 CI 重建，拖累发布流程 |
| Cusdis / Isso / Remark42 | 需要自托管 VPS，与静态站零运维定位冲突 |
| giscus | 只是一段 `<script>`；评论存在作者自己的 repo；GitHub App 由 @giscus-app 维护；读者用 GitHub 账号免注册；主脚本约 15 KB，iframe 懒加载 |

### D2: 映射用 `pathname` 而非 `og:title` / `specific`

**选择**：`data-mapping="pathname"`。

**理由**：

- `ARTICLE_URL = "posts/{date:%Y}-{date:%m}-{date:%d}/{slug}.html"` 在 CLAUDE.md 中明说"changing the date or slug will break inbound links"，等同于 pathname 是项目级不变量
- `og:title` 绑定 `<title>` 标签，改个标点就换 thread，历史评论丢失
- `specific` 需要手工为每篇文章在 frontmatter 写 `giscus-term`，与博客"扔 markdown 就发"的节奏不合

**代价**：如果哪天真要改 `ARTICLE_URL`，历史评论不会自动迁移。需要手动在 Discussions 里改 title 匹配新 pathname，或导出/重导入。接受。

### D3: 分类选 "Announcement" 格式

**选择**：新建 Discussions 分类 "Comments"，格式（format）设为 "Announcement"。

**理由**：

- "Announcement" 格式 = 只有 maintainer 能开新 thread
- giscus 在读者首次访问文章时，以安装了 App 的 maintainer 身份自动创建 thread，读者只能回复
- 避免读者恶意 / 误操作为非文章 pathname 开 thread 灌乱整个 repo

### D4: 评论组件只在生产构建渲染，用 `{% if SITEURL %}` 守卫

**选择**：`comments.html` 顶层包一层 `{% if SITEURL %}`。

**理由**：

- `pelicanconf.py` 的 `SITEURL = ''`（本地预览）；`publishconf.py` 覆写为 `https://www.chenxiaosheng.com`
- 本地如果渲染 giscus，`window.location.href` 会是 `http://localhost:8000/...`，giscus 会在 Discussions 里开 `localhost:8000` 开头的 thread，污染真数据
- `{% if SITEURL %}` 是一个一行守卫，比 `PELICAN_ENV` 之类的环境变量更贴合项目现状（Pelican 原生用 conf 文件区分环境）

**替代方案**：在 giscus 端配置允许的 origin。被否决是因为 giscus 没有"限制 pathname 前缀"选项，只能限主域，解决不了 `localhost` 这种边界。

### D5: 文章级开关用 Metadata `Comments: false`

**选择**：Pelican frontmatter 支持任意自定义字段，`article.comments` 即该值的字符串。模板里判空：`{% if article.comments != 'false' %}` 渲染，否则跳过。

**理由**：

- 默认"开"，少写一行；个别不想接受评论的文章显式写 `Comments: false`
- 字符串比较而非布尔，因为 Pelican metadata 默认全是 str（`True`/`False` 也会被转成 `'True'`）；明确比较 `'false'` 避免坑
- 置顶、纯公告、年末总结之类可以关评论

### D6: 视觉集成 — 与 `.article-related` / `.article-about` 同级

**选择**：HTML 结构：

```html
<section class="article-comments">
  <h2 class="article-comments-title">评论</h2>
  <div id="giscus-container"><!-- giscus script inserts here --></div>
</section>
```

CSS 复用 `.article-related` 已有的上边框 / 标题样式；区块之间保持与 related、about 相同的上下间距。

**理由**：

- 视觉连续 = 读者不觉得突兀；评论区是文章尾部而非独立页
- giscus 提供 `data-theme` 参数支持 `preferred_color_scheme`（跟系统）；可选 `noborder_light` / `noborder_dark`
- 不在 article.html 直接写 giscus 脚本，而是 include —— include 本身再用 `{% if SITEURL %}` 守卫，article.html 保持简洁

### D7: 配置集中在 `pelicanconf.py`

**选择**：`GISCUS_REPO`、`GISCUS_REPO_ID`、`GISCUS_CATEGORY`、`GISCUS_CATEGORY_ID`、`GISCUS_MAPPING`、`GISCUS_THEME` 都放 `pelicanconf.py`，`comments.html` 里用 `{{ GISCUS_REPO_ID }}` 等渲染。

**理由**：

- 以后要换 repo（如果博客迁到 organization）或换配色，只改一个地方
- Pelican 把 conf 里所有大写变量自动透传到模板上下文
- `GISCUS_REPO_ID` / `GISCUS_CATEGORY_ID` 是 giscus 配置器从 GitHub GraphQL 拿到的字符串，不是密钥，放 public repo 完全安全

### D8: 读者端不做懒加载

**选择**：giscus `<script>` 默认以 `async` 加载、底层 iframe 也自带延迟渲染；**不**再加 IntersectionObserver。

**理由**：

- giscus 主脚本 ~15 KB；iframe 的真正内容只在进入视口后才完整渲染
- IntersectionObserver 多写几十行 JS，省不了多少首字节
- 对个人博客流量体量，过度工程

### D9: 本地看不到评论的取舍

**选择**：本地 `pelican --listen` 不渲染评论区，也不显示占位提示。

**理由**：

- 预览时作者关注的是正文渲染和 meta，评论区视觉占位反而干扰
- 若作者真要调评论区样式，临时 `SITEURL=https://www.chenxiaosheng.com` 构建到 `output/` 再静态打开一篇文章即可；约定俗成，不需要额外机制
- 同 view-counts change 的本地降级思路一致

## Risks / Trade-offs

- **[读者门槛] GitHub 账号要求** → 中文读者里非开发者会被挡掉。兜底：在评论区上方加一行小字「不想用 GitHub 账号？可在微博 [@stutiredboy] 或邮件讨论」。愿意接受此代价，博客受众偏技术向
- **[giscus 服务下线] 第三方服务层仍存在** → giscus-app 是社区项目，有消失风险。评论数据**不**会丢（在 Discussions 里），只是加载失败；届时换一层壳（utterances / 自研 GraphQL 客户端）即可，Discussions 数据是纯净资产
- **[Discussions 被刷评论]** → 公开 repo 的 Discussions 可被任何 GitHub 账号回复。兜底：GitHub 原生可锁定 thread、删除评论、ban 用户；启用 [giscus 的 lazy 评论审核](https://giscus.app/) 选项（默认不开启，审核由作者人工在 GitHub 做）
- **[SEO 不收录]** → giscus iframe 内容搜索引擎抓不到。与 Disqus 行为相同，接受
- **[本地调样式不便]** → D9 已述，代价小
- **[GitHub API 限流]** → giscus 走的是它自己托管的代理，对读者来说无 rate limit 可见；作者自己推送评论数据无影响
- **[ARTICLE_URL 变更会断裂评论]** → D2 已明确代价，项目层面 URL 是硬不变量

## Migration Plan

**Rollout 顺序**：

1. GitHub 仓库侧准备：开 Discussions、建 "Comments" Announcement 分类、装 giscus App —— 只改一次，Dashboard 点击，无 git 产物
2. 在 [giscus.app](https://giscus.app/) 配置器中填仓库与分类，拷贝出的 `data-repo-id` / `data-category-id` 写入 `pelicanconf.py`
3. 创建 `themes/stuhouse/templates/includes/comments.html`，加 `{% if SITEURL %}` 守卫
4. 改 `article.html` 挂载 include；改 CSS；本地构建预览验证"本地不渲染"
5. 测试产物：用 `publishconf.py` 构建 `output/`，静态打开一篇 HTML 确认 `<script src="https://giscus.app/client.js">` 存在
6. 合并到 `source`，CI 自动部署；去生产页面验证一条真实评论走通

**Rollback**：

- 样式 / 挂载点问题：revert 主题 commit，CI 重新部署
- giscus 服务问题：把 `comments.html` 整体包一层 `{% if false %}` 或删 include 引用；CI 重建
- 配置错误（repo-id 填错）：giscus 前端会报错 "Discussion not found" —— 修 pelicanconf 重新构建
- 数据不满意：Discussions 里直接删 thread / 整个分类；不影响站点

**无数据迁移**：Discussions 从零开始；历史 Disqus 评论已在 `modernize-blog-theme` 决策中接受丢失。

## Open Questions

1. **`GISCUS_THEME` 定为 `preferred_color_scheme`（跟系统）还是固定 `light`？**
   - 主题当前 `main.css` 默认 light 为主，但 `pygments-nord.css` 里也有 dark 变量；倾向 `preferred_color_scheme`，与系统同步；留实施阶段看效果定
2. **是否在 about 页增补一行评论规则说明**？
   - 建议："评论使用 GitHub Discussions 承载；数据公开可见；不文明言论会被删除"。轻量一行即可，实施阶段决定
3. **Comments 分类建多少个？**
   - 只一个 "Comments" 够用；如果未来要区分"技术文评论 / 生活文评论"再拆。当前保持最简
4. **是否给文章 frontmatter 加 `CommentsLocked: true` 的"只读冻结"开关？**
   - giscus 本身支持 `data-reactions-enabled` 等细粒度，但读起来复杂。暂不做，需要的单篇文章直接 `Comments: false` 走关闭路径；如果某篇想保留历史评论展示但禁止新增，再回来设计
