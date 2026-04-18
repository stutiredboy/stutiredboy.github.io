Title: Claude 在这个周末帮我翻新了博客
Date: 2026-04-19 20:30:00
Tags: claude, ai, pelican, blog
Slug: claude-refreshed-my-blog-this-weekend
Author: 小生说大声讲
Summary: 这个周末用 Claude Code + OpenSpec 把博客主题从 2014 年的 Bootstrap 3 换成了新写的 stuhouse（名字随意取的）。顺便回顾了一下不久前那次「双仓库合一」的发布流程改造。两次经历指向同一件事：AI 让我这种拖延了多年的懒人也愿意动手修基础设施了。

上一篇《LLM 让程序员的编程美德「懒惰」更显重要了》发完没几天，自己倒先干了一件极其「懒惰」的事 —— 周末两天把博客主题从 2014 年的 Bootstrap 3 一路翻修到新写的 stuhouse。

折腾完准备写这篇更新稿的时候，想起一年前那次「双仓库合一」也是 Claude 陪着做的。两次经历放在一起回看，心里有些话想讲。

## 背景：博客的技术债从哪来

这个博客从 Pelican 起步就没怎么动过骨架，细数下来积了一堆账：

- 主题 `pelican-bootstrap3` 基于 Bootstrap 3.1.1，2019 年已经 EOL
- FontAwesome 3 的 `icon-*` 前缀和后来加载的 FA 4.7 不兼容，图标基本不渲染
- 导航栏的 `.navbar-collapse` 没有汉堡按钮，移动端扩展菜单打不开
- 侧边栏被 `hidden-xs hidden-sm` 整体隐藏，手机读者看不到任何侧栏元素
- 还挂着一个 2023 年 7 月就停服的 Google Analytics UA 代码
- 存在 IE8 兼容分支（`respond.js`、`jXHR.js`、条件注释）
- `<html>` 缺 `lang` 属性，`DEFAULT_LANG='en'` 和中文内容自相矛盾

每次打开博客都在心里念叨一句「改一下吧」，然后关掉浏览器。积了好几年。

## 案例一：一年前那次「双仓库合一」

在讲主题之前，先倒回去讲一下更早的一次改造。

博客最早的源码放在 Bitbucket，GitHub 上的这个仓库 `stutiredboy.github.io` 只存构建产物。这种「源码 + 发布」分离的结构是早年从别人那抄来的，对当时的我来说是合理的：Bitbucket 支持免费私有仓库，GitHub Pages 又必须 public。

但维护起来很累：

1. 每次写完文章要先 push 到 Bitbucket，本地 `pelican content`，再去 GitHub 仓库 push 生成的 HTML
2. 两个仓库的 commit history 基本断裂，追溯改动很费劲
3. 源码仓库没有 CI，发布靠手工

2026 年 4 月中旬，我让 Claude 帮我把这个流程整合了：所有源文件迁到 GitHub 这个仓库的 `source` 分支，`gh-pages` 分支改由 GitHub Actions 自动构建 + force-push。

提交记录里那条 `Migrate Pelican blog source from bitbucket to single-repo structure` 就是这次改造的结果。合并后的工作流简单了不少：

- 改完文章 push 到 `source`
- Actions 自动跑 `pelican content`，推到 `gh-pages`
- 线上站就更新了

这次改造范围不大，但我自己拖了好几年没做。Claude 介入之后基本就是一个下午的事，包括 deploy workflow 的编排、`.gitignore` 的合并、`content/extra/CNAME` 怎么放都替我想明白了。

## 案例二：这个周末，换主题

这次范围大得多。

### 用 OpenSpec 先把事情说清楚

技术债那么一大堆，要是自己硬上，大概率会陷入「改一点发现另一个地方也得改」的泥潭。这次换主题之前，我先用 OpenSpec 的工作流写了一份变更提案：

```
openspec/changes/modernize-blog-theme/
├── proposal.md   # 为什么要改、改什么、不改什么
├── design.md     # 新主题的视觉和技术决策
└── tasks.md      # 分阶段任务清单
```

proposal 里最关键的是 Non-Goals 那一段，明确写了「不引入站内搜索、不引入新评论系统、不做 PWA、不保留旧主题做 A/B 切换」。有了这段边界声明，后面实现的时候就不会被无关想法拉偏。

### 新主题 stuhouse

新主题目录是 `themes/stuhouse`，整体思路：

- 单列居中，正文最大宽度约 720 px
- 极简顶栏：站名、归档、简介、RSS、明暗切换
- 桌面宽屏（≥ 1200 px）右侧有 sticky TOC，移动端折叠
- 彻底去掉侧边栏，标签云迁到独立的 `/tags.html`
- 中文系统字体栈（PingFang SC → HarmonyOS Sans SC → 微软雅黑 → system-ui），零字体请求
- 暗色模式跟随 `prefers-color-scheme` + 顶栏手动切换，localStorage 持久化
- 代码块基于 Nord 配色，浅色、深色两套，带一键复制按钮

技术栈清理得更彻底：Bootstrap 3、jQuery、FontAwesome、respond.js、jXHR.js 全删；图标改成内联 SVG；Google Analytics / Disqus / AdSense 相关代码一并下线。

### 一个中间的小坑

实现完跑本地预览的时候翻了车。按习惯启动 `pelican --listen`，浏览器打开 `http://127.0.0.1:8000`，样式完全不对。

开发者工具一看：

```
GET https://www.chenxiaosheng.com/theme/css/main.css
=> [FAILED] net::ERR_BLOCKED_BY_ORB
```

原因是 `pelicanconf.py` 里 `SITEURL = 'https://www.chenxiaosheng.com'` 直接写死成生产域名，本地生成的 HTML 里所有资源链接都指向线上，自然加载不到新主题的 CSS。

Pelican 社区的标准做法是拆分 dev/prod 两份配置：

- `pelicanconf.py`：`SITEURL = ''`，本地预览用，生成根相对 URL
- `publishconf.py`：继承 pelicanconf，覆盖 `SITEURL` 为真实域名，CI 构建用

顺带把 GitHub Actions workflow 的构建命令从 `-s pelicanconf.py` 换成 `-s publishconf.py`。再跑 `pelican --listen`，样式全部到位。

### 归档

最后把 `openspec/changes/modernize-blog-theme/` 迁到 `openspec/changes/archive/2026-04-19-modernize-blog-theme/`，这个变更就算完结了。tasks.md 里的每一项都对应真实的代码改动，想回溯某个决策随时能翻到上下文。

## 用 AI 修基础设施的一点体感

两次改造拉通一起看，有几点观察。

**AI 缩短了「想做」和「开动」之间的距离。** 双仓库合一这件事我拖了好几年，主题翻修拖得更久。之所以一直不动，是因为每次想起来都要估算「我得花多久」「会不会中途卡在某个坑里」。有了 Claude 之后，这个心理门槛明显降低：哪怕卡住，它能帮我很快试出方向，沉没成本低得多。

**但 AI 不会替我做判断。** OpenSpec 这种「先写提案再动手」的节奏，核心作用是逼我自己把事情想清楚 —— Non-Goals 该写哪些、视觉调性参考谁、侧边栏留不留。这些决策 Claude 给不了，它最多帮我把判断落成代码。

**「懒惰」这事，AI 和人的方向是反的。** 上一篇文章里引用了 Bryan Cantrill 的观点：LLM 不受时间约束，没有「为未来的自己省力」的动机，放任它会让系统越滚越大。我这次刻意在 proposal 里写死边界，就是给它上一道缰绳。最终 stuhouse 的代码量比旧主题少了一大截，就是这个约束的结果。

## 尾声

这篇文章本身是在新主题下写的。预览窗口里看过去，正文宽度、代码块配色、TOC 高亮、复制按钮都按预期工作。写博客这件事本来应该只关心文字本身，过去那些年花在「发布流程怎么跑通」「主题哪里又坏了」上的精力，现在终于可以还给写作本身了。

前阵子看到 tihu 写了一篇[用 Claude 重构博客](https://tihu.github.io/tihu-hugo-blog/posts/2026/2026-04-08-update/)的文章，里面有一句话印象深刻：「这么多年来，终于第一次真正意义上实现了用自然语义『一句话更新博客』」。我这次的体验没那么浪漫 —— 还是得自己写 proposal、自己验收、自己踩坑 —— 但方向是同一个：把注意力从基础设施的维护里释放出来。

下一篇，等下个周末再见。
