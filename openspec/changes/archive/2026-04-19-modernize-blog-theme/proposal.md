# Modernize Blog Theme

## Why

现用主题 `themes/pelican-bootstrap3` 基于 Bootstrap 3.1.1（2014 年），框架本身 2019 年已 EOL。实际表现上的技术债：

- FontAwesome 3 的 `icon-*` 前缀和加载的 FA 4.7 不兼容 —— 文章元信息、侧边栏的图标根本不渲染
- 导航栏 `.navbar-collapse` 没有汉堡按钮，移动端扩展菜单无法打开
- 侧边栏整体 `hidden-xs hidden-sm` —— 移动端读者看不到任何侧栏元素
- Google Analytics 加载的 UA `UA-30723232-1` 已于 2023 年 7 月停服，等于无分析
- AdSense / Disqus 最新评论 widget 在国内访问体验差，价值低
- IE8 兼容代码（`respond.js`、`jXHR.js`、`<!--[if lt IE 9]>` 分支）仍在加载
- `<html>` 缺 `lang` 属性、`DEFAULT_LANG='en'` 与中文内容矛盾
- 视觉调性停留在 Bootstrap 企业站，不适合以中文长文为主的技术博客阅读体验

侧边栏原本承载的元素（标签云、公众号二维码、Disqus 最新评论）已不再是核心价值点 —— 作者确认可以去掉。

## What Changes

新建主题目录 `themes/stuhouse`，替换 Bootstrap 骨架为单列读物向布局。旧主题目录 `themes/pelican-bootstrap3` 随 PR 一起删除（通过 git 历史保留）。

**整体结构**

- 单列居中，正文最大宽度约 720px
- 极简顶栏：站名 · 归档 · 简介 · RSS · 明暗切换
- 桌面宽屏 (≥ 1200px)：文章右侧 `sticky` TOC，当前章节高亮
- 移动端：TOC 折叠进正文顶部，或直接隐藏
- 彻底去侧边栏；标签云迁至独立的 `/tags.html`

**视觉**

- 调性参考 Julia Evans / Fabien Sanglard —— 克制但有人味
- 中文系统字体栈（PingFang SC → HarmonyOS Sans SC → 微软雅黑 → system-ui sans），零字体请求
- 暗色模式：跟随 `prefers-color-scheme` + 顶栏手动切换，`localStorage` 持久化
- 代码块基于 Nord 配色，浅/深模式各一套，带一键复制按钮

**技术栈清理**

- 移除 Bootstrap 3、jQuery、FontAwesome；图标改内联 SVG（仅需 RSS / GitHub / Weibo / Twitter / Facebook / 明暗切换图标）
- 移除 GA UA 脚本、AdSense 脚本、Disqus 评论及其 widget
- 移除 IE8 兼容分支：`respond.min.js`、`jXHR.js`、条件注释 jQuery
- 删除未引用资源：`github.js`、本地 `bootstrap.min.*`、`docs.min.css`、`includes/addthis.html`、`includes/page_comments.html`、`includes/comment_count.html`、`includes/github.html`
- 删除重复文件：`plugins/jinja_filters.py`（保留根目录那份）
- 所有 CSS/JS 走 pelican 的 `theme/` 路径本地加载，不再使用 `cdn.staticfile.org`

**标记与元信息修正**

- `<html lang="zh-CN">`
- `pelicanconf.py`：`DEFAULT_LANG='zh'`
- 补 meta description、canonical URL、OG 图片默认值、Twitter card
- 页脚版权年份更新到 2026

**其他页面**

- 首页：日期 + 标题 + 摘要的清爽列表，去掉 `more...` 按钮
- 归档页：按年份分组
- 标签/分类/作者页：统一新主题样式
- 静态页（`about.md`）：沿用文章页排版

## Non-Goals

- 站内搜索
- 评论系统（Disqus 下线，不引入 Giscus / Waline 等替代品）
- 多语言 / 国际化
- PWA / 离线阅读
- 文章封面图系统
- 新增分析统计（去 Google 化后保持零统计）
- 保留旧主题做 A/B 切换
- URL 结构变更（`ARTICLE_URL` 保持现有的 `posts/{date}/{slug}.html`）

## Impact

**Affected code:**

- 新增：`themes/stuhouse/`（完整主题）
- 删除：`themes/pelican-bootstrap3/`（完整主题）
- 修改：`pelicanconf.py`（主题路径、语言、清理废弃变量）
- 删除：`plugins/jinja_filters.py`（与根目录重复）
- 保留：`content/`（所有 markdown 文章）、`.github/workflows/deploy.yml`（构建命令无需改动）
