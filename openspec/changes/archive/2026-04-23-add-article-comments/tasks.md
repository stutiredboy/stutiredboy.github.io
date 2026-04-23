## 1. GitHub 仓库准备

- [x] 1.1 在 `github.com/stutiredboy/stutiredboy.github.io/settings`（Settings → General → Features）勾选 **Discussions**
- [x] 1.2 到 Discussions 页面 → 右上齿轮 → Categories → **New category**：
  - Title: `Comments`
  - Description: `Article comments from www.chenxiaosheng.com`
  - Discussion Format: **Announcement**（只有 maintainer 能开新 thread）
  - Emoji: 💬（或任意）
- [x] 1.3 访问 [github.com/apps/giscus](https://github.com/apps/giscus) → **Install** → 选择 `stutiredboy/stutiredboy.github.io`（Only select repositories）→ Install
- [x] 1.4 `curl -s https://api.github.com/repos/stutiredboy/stutiredboy.github.io | grep has_discussions` 返回 `"has_discussions": true` 以确认启用成功（本机无 `gh` CLI，改用 REST API）

## 2. 取 giscus 配置 ID

- [x] 2.1 打开 [giscus.app](https://giscus.app/)
- [x] 2.2 Repository 填 `stutiredboy/stutiredboy.github.io`；页面应提示"Success! This repository meets all the above criteria."
- [x] 2.3 Page ↔ Discussions Mapping 选 **Discussion title contains page `pathname`**
- [x] 2.4 Discussion Category 选 `Comments`；勾选 "Only search for discussions in this category"
- [x] 2.5 Features：关闭 "Enable reactions for the main post"（评论区不需要 reaction 主贴）；保留默认其他项
- [x] 2.6 Theme：选 `preferred_color_scheme`
- [x] 2.7 从生成的 `<script>` 里拷出 `data-repo-id` 与 `data-category-id` 两个字符串（形如 `R_kgDO...` 与 `DIC_kwDO...`）

## 3. Pelican 配置集中化

- [x] 3.1 在 `pelicanconf.py` 末尾追加 Giscus 配置段（REPO_ID / CATEGORY_ID 由 giscus.app 生成，已写入）
- [x] 3.2 确认不需要在 `publishconf.py` 再覆盖（这些值不随环境变化）

## 4. 主题模板

- [x] 4.1 创建 `themes/stuhouse/templates/includes/comments.html`（属性值采用 giscus.app 实际生成的配置：`data-strict="0"`、`data-reactions-enabled="0"`、`data-input-position="bottom"`、无 `data-loading`；用 `|lower` 过滤让 Metadata 大小写不敏感）
- [x] 4.2 改 `themes/stuhouse/templates/article.html`：在 `<section class="article-about">` 之后、`{% include 'includes/toc.html' %}` 之前插入 `{% include 'includes/comments.html' %}`
- [x] 4.3 grep 确认 `article.html` 未引入其他评论相关代码，无重复挂载

## 5. 样式

- [x] 5.1 把 `.article-comments` / `-title` / `-hint` / `-container` 并入 `.article-related` / `.article-about` 现有选择器组（复用 `--space-*` / `--border` / `--text-muted` tokens），保证与 related / about 三节上下间距一致
- [ ] 5.2 本地构建（见 §6）在 Chrome/Safari 看一次对齐，确保与 related、about 三节之间间距一致

## 6. 本地验证

- [x] 6.1 `export PYTHONPATH=$PWD:$PYTHONPATH && pelican content -o output -s pelicanconf.py -t themes/stuhouse`（本机首次跑：`python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`）
- [x] 6.2 `pelican --listen`，打开 `http://localhost:8000/posts/...` 任一文章（可选：浏览器自检）
- [x] 6.3 `grep -rl giscus.app output/` 应无命中 —— 本地 SITEURL='' 守卫生效
- [x] 6.4 `grep -l article-comments output/posts -r` 应无命中 —— section 整体被守卫剔除
- [x] 6.5 生产构建：`.venv/bin/pelican content -o output -s publishconf.py -t themes/stuhouse`
- [x] 6.6 `grep -l giscus.app/client.js output/posts -r | wc -l` 应等于文章总数（当前 45/45）
- [x] 6.7 `grep -l giscus.app output/index.html output/pages/*.html output/author/*.html output/tag/*.html output/archives.html` 应无命中 —— 首页/关于/作者/标签/归档都干净

## 7. 文章级开关验证

- [x] 7.1 用 `content/aliyuncs.com-downgrade.md` 作为测试文章，加入 `Comments: FALSE`
- [x] 7.2 `.venv/bin/pelican content -o output -s publishconf.py -t themes/stuhouse`
- [x] 7.3 `grep -l giscus.app output/posts/2025-06-06/aliyuncs.com-downgrade.html` 无命中；其他 44 篇文章仍包含 giscus
- [x] 7.4 `Comments: FALSE`（大写）被模板 `|lower` 过滤识别为关闭，等价于 `Comments: false`
- [x] 7.5 测试后还原该文章 frontmatter，恢复默认开启

## 8. 上线与观察

- [x] 8.1 git commit `feat: add-article-comments`（单条 commit 涵盖 `pelicanconf.py`、`themes/stuhouse/**`、`CLAUDE.md`、OpenSpec 目录）
- [x] 8.2 推送 `source` 触发 CI；`.github/workflows/deploy.yml` 构建 + 部署到 `gh-pages`
- [x] 8.3 CI 完成后访问 `https://www.chenxiaosheng.com/posts/<某文章>.html`：评论区块出现，giscus iframe 加载成功
- [x] 8.4 用 GitHub 账号登录发测试评论；`Comments` 分类下自动创建了 pathname-titled thread
- [x] 8.5 延迟加载行为符合预期（giscus 自身 iframe 已控延迟）
- [x] 8.6 移动端验收通过（跟随 `.article-related` / `.article-about` 同一组响应式样式）

## 9. 文档与后记

- [x] 9.1 （可选）在 `content/pages/about.md` 底部加一段评论说明 —— 暂跳过，评论区内部的 hint 已充分
- [x] 9.2 `openspec archive 2026-04-23-add-article-comments`：change 目录移到 `openspec/changes/archive/`，`specs/article-comments/spec.md` 提升到主 specs
- [x] 9.3 Archive 后确认 `openspec/specs/article-comments/spec.md` 存在
