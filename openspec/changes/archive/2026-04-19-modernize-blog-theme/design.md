# Design

## 目录策略：新建 `themes/stuhouse/` 而非原地翻新

diff 更清晰（新文件=新增，旧文件=整目录删除），审查和回滚成本都低。旧主题历史通过 git 保留即可，不需要物理保留。`stuhouse` 取自作者 GitHub handle `stutiredboy`。

## CSS 技术选型：原生 CSS，零构建

布局只有单列 + 可选 TOC，CSS Grid/Flex 足够。所有颜色、字号、间距、断点通过 `:root` 上的 CSS 变量分发。暗色模式用 `[data-theme="dark"]` 覆盖变量。

不引入 Tailwind / PostCSS / Sass —— 博客源只在 GitHub Actions 跑 pelican，不想为主题样式增加 Node.js 构建依赖。

## 字体栈

**正文：**
```
-apple-system, BlinkMacSystemFont, "PingFang SC",
"HarmonyOS Sans SC", "Microsoft YaHei", "Segoe UI",
system-ui, sans-serif
```

**等宽：**
```
"JetBrains Mono", "SF Mono", Menlo, Consolas,
"Liberation Mono", monospace
```

完全走系统字体。macOS / iOS 命中 PingFang，Windows 命中雅黑，HarmonyOS/鸿蒙 命中 HarmonyOS Sans —— 每个平台都用本地最合适的字体，零网络字体请求。

## 排版参数（初版）

- 正文字号：17–18px，行高 1.75（中文长文偏大的行距更舒适）
- 正文最大宽度：`min(720px, 90vw)`
- H1 / H2 / H3 层级用字号 + 字重区分，不依赖边框
- 段落间距 > 行距，视觉节奏清晰

## 暗色模式

- 默认跟随 `prefers-color-scheme: dark`
- 顶栏放 ☀/🌙 切换按钮；点击后 `localStorage` 持久化为 `'light'` / `'dark'`，手动选择优先于系统
- **防闪烁**：切换脚本内联放在 `<head>` 最前（blocking），在 CSS 加载前就给 `<html>` 打上 `data-theme`

## TOC

- 由 JS 从文章 `<h2>`/`<h3>` 动态生成，不依赖 pelican 插件（Python markdown 已经给所有标题生成了 `id`，可直接利用）
- 桌面宽屏（`min-width: 1200px`）：`position: sticky`，贴在文章右侧；当前章节用 `IntersectionObserver` 高亮
- 移动端（`<1200px`）：不显示 TOC（避免折叠折腾），读者靠滚动阅读
- TOC 仅在标题数 ≥ 3 时渲染，短文不出现

## 代码块

- pygments 继续生成 `.highlight` 结构（pelican 的 markdown codehilite 扩展已经配置）
- 替换 `pygments.css` 为基于 **Nord** 的两套配色：
  - 浅色模式：`nord-light` 变体（背景偏 `#eceff4`）
  - 深色模式：`nord-dark`（背景 `#2e3440`）
- 通过 `[data-theme="dark"]` 切换 pygments 选择器的变量
- **一键复制**：JS 为每个 `pre.highlight` 注入按钮，使用 `navigator.clipboard.writeText`，无需 polyfill

## 图标

全部内联 SVG。在 `templates/includes/icons/` 放：
- `rss.svg`、`github.svg`、`weibo.svg`、`twitter.svg`、`facebook.svg`
- `sun.svg`、`moon.svg`（明暗切换）
- `copy.svg`、`check.svg`（代码块复制按钮反馈）
- `calendar.svg`、`tag.svg`（文章元信息）

每个 SVG 独立文件，在模板中 `{% include %}`。不再依赖 FontAwesome 的 35KB CSS 和字体文件。

## 静态资源加载策略

- **CSS**：单文件 `theme/css/main.css`（预期 < 15KB），普通 `<link>` 外链
- **JS**：`theme/js/main.js`（TOC + 复制 + 明暗切换），body 底部带 `defer`
- **暗色防闪烁**：仅这段内联在 `<head>`
- 全部资源走 pelican 的 `theme/` 路径本地加载，不再用 `cdn.staticfile.org`

## 兼容性底线

- 近两年的 Chrome / Safari / Firefox / Edge
- 移动端 iOS 14+ / Android 10+ 默认浏览器
- **不再兼容 IE** 以及任何没有 `IntersectionObserver` / `navigator.clipboard` 的浏览器（这些 API 2019+ 已全面可用）

## 评论与分析的处理

- Disqus 相关：`includes/comments.html` 清空或删除、`article.html` 不再 include、`pelicanconf.py` 的 `DISQUS_SITENAME` 删除
- GA UA 相关：`includes/ga.html` 删除、`pelicanconf.py` 的 `GOOGLE_ANALYTICS` 删除
- AdSense：`<script src="pagead2.googlesyndication.com/...">` 删除
- 如果未来想接 Plausible / Umami / Waline，留到独立 change 处理

## 相关阅读（related_posts）

保留 `pelican_related` 插件，保留文章末尾的「您可能还喜欢以下文章」区块，但重新样式化 —— 现在它是在「entry-content」里的一个 `<ul>`，新主题里改成独立的 section，与正文视觉分离。

## "关于我" 卡片

原 `article.html` 末尾的头像 + 文字 + 二维码三栏卡片，在新主题里简化为：

- 仅保留文字（一段自我介绍 + GitHub / Weibo / Twitter 链接）
- 二维码去掉（作者确认不看重）
- 头像可选保留（小尺寸，与文字并排）
