# Tasks

## Phase 1: 脚手架

- [x] 新建 `themes/stuhouse/` 目录：`templates/`、`templates/includes/`、`templates/includes/icons/`、`static/css/`、`static/js/`
- [x] `pelicanconf.py`：新增 `THEME = 'themes/stuhouse'`（如未设置，由 CI 命令 `-t` 参数覆盖）、`DEFAULT_LANG = 'zh'`、清理 `DISQUS_SITENAME`、`GOOGLE_ANALYTICS`
- [x] `.github/workflows/deploy.yml`：`-t themes/stuhouse` 替换旧路径
- [x] 基础 `base.html`：`<html lang="zh-CN">`、`<meta name="description">`、`<link rel="canonical">`、OG meta、Twitter card、主题切换内联防闪烁脚本

## Phase 2: 模板

- [x] `templates/index.html` —— 文章列表（日期 + 标题 + 摘要），分页控件
- [x] `templates/article.html` —— 单文章页：标题 → 元信息 → 正文 → 相关阅读 → 关于我（简化版）
- [x] `templates/archives.html` —— 按年份分组（`{% for year, posts in ... %}`）
- [x] `templates/tag.html`、`templates/tags.html` —— 标签页，统一新主题样式
- [x] `templates/category.html`、`templates/author.html` —— 最小实现（当前未上菜单）
- [x] `templates/page.html` —— 静态页（about）沿用文章页排版
- [x] `templates/includes/article_meta.html` —— 日期 + 标签 + 预估阅读时间
- [x] `templates/includes/nav.html` —— 顶栏
- [x] `templates/includes/footer.html` —— 页脚，年份更新到 2026
- [x] `templates/includes/toc.html` —— TOC 容器（JS 填充）
- [x] `templates/includes/icons/` —— RSS、GitHub、Weibo、Twitter、Facebook、sun、moon、copy、check、calendar、tag

## Phase 3: 样式

- [x] `static/css/main.css`：CSS 变量层（颜色、字号、行高、间距、断点），`[data-theme="dark"]` 覆盖
- [x] 正文排版：h1-h4、p、ul/ol、blockquote、img、table、hr
- [x] 链接样式：低饱和度描边，hover 加粗下划线
- [x] 响应式断点：`<640px` 手机、`<1200px` 平板、`≥1200px` 桌面（TOC 出现）
- [x] 代码块 Nord 主题：`static/css/pygments-nord.css`（浅/深合并在同一文件，靠选择器切换），替换原 `pygments.css`
- [x] 内联 code 样式（非代码块）：浅底、等宽字体

## Phase 4: 交互

- [x] `static/js/main.js`：模块化三个函数
  - [x] `setupTheme()` —— 明暗切换 + `localStorage` 持久化 + 图标切换
  - [x] `setupToc()` —— 从 `.entry-content h2, h3` 生成 TOC + IntersectionObserver 高亮
  - [x] `setupCodeCopy()` —— 为每个 `pre.highlight` 注入复制按钮
- [x] `<head>` 内联脚本：读 `localStorage` 给 `<html>` 打 `data-theme`（防闪烁）

## Phase 5: 清理

- [x] 删 `themes/pelican-bootstrap3/` 整个目录
- [x] 删 `plugins/jinja_filters.py`（与根目录 `jinja_filters.py` 重复）
- [x] 检查 `pelicanconf.py` 中 `EXTRA_PATH_METADATA` 条目仍有效（`favicon.ico`、`CNAME`、`ads.txt`、`robots.txt`）
- [x] 确认 `content/extra/ads.txt` 是否还需要（原来配合 AdSense，现在 AdSense 下线；作者决定去留） — 暂保留，等作者决定
- [x] `content/static/` 下如有仅旧主题引用的资源（`avatar.gif`、`qrcode.jpg`），确认新主题是否仍引用，未引用则保留不动（文章可能引用） — `qrcode.jpg` 被 `mysql-large-seconds_behind_master.md` 引用；`avatar.gif` 无文章引用但保留

## Phase 6: 验证

- [x] 本地 `pip install -r requirements.txt`、`PYTHONPATH=$PWD pelican content -o output -s pelicanconf.py -t themes/stuhouse` 构建通过，无警告（41 篇 + 1 页，0.37s；残留警告来自内容本身的空 alt 与 docutils zh 本地化，与主题无关）
- [x] 抽样文章视觉走查（作者浏览器内亲验通过）
- [x] Chrome DevTools 移动端模拟：iPhone 13、iPad、Galaxy S20（作者亲验通过）
- [x] 明暗切换：跟系统 + 手动覆盖、刷新不闪烁（作者亲验通过）
- [x] 代码复制按钮：Chrome / Safari / Firefox 各试一次（作者亲验通过）
- [x] Lighthouse：性能 / 无障碍 / 最佳实践（作者亲验通过）
- [x] 归档页年份分组正确（输出的 `archives.html` 已按 2026 / 2025 / … 分组）
- [x] 确认所有原 URL（`posts/{date}/{slug}.html`）仍可访问，RSS `feeds/all.atom.xml` 仍正常（`output/posts/` 下各日期目录完整，`output/feeds/all.atom.xml` 已生成）
- [x] 在 `source` 分支推送前 `git diff --stat` 过一眼删除/新增文件清单（旧主题整目录 + `plugins/jinja_filters.py` 删除；新增 `themes/stuhouse/` + OpenSpec 文件；`pelicanconf.py` / `deploy.yml` 修改）

## Phase 7: 本地预览修复（验收期间发现）

- [x] `pelicanconf.py` `SITEURL` 置空，生成根相对资源 URL，`pelican --listen` 样式可加载
- [x] 新增 `publishconf.py`：继承 `pelicanconf`，覆盖 `SITEURL` 为生产域名、重建 `SOCIAL` RSS 链接，供 CI 使用
- [x] `.github/workflows/deploy.yml` CI 构建命令改用 `-s publishconf.py`
