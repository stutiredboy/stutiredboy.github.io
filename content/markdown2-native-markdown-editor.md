Title: 我只是想打开一个 Markdown 文件看一眼——于是 vibe coding 了一个编辑器
Date: 2026-06-06 15:00:00
Tags: markdown, macos, swift, swiftui, vibe-coding, ai
Slug: markdown2-native-markdown-editor
Author: 小生说大声讲
Summary: 我的需求小到有点可笑：在 macOS 上随手双击打开一个 Markdown 文件看一眼，能顺手改两笔就更好。可挑遍主流编辑器，要么收费、要么是 Electron 套壳的庞然大物、要么年久失修、要么三天两头更新就崩。索性用 SwiftUI + AppKit 自己 vibe coding 了一个原生轻量的 Markdown2，本文记录这趟从"挑不到"到"自己造"的心路，以及途中那些有意思的坑。

## 一个小到可笑的需求

先说清楚我到底想要什么，因为这决定了后面所有的取舍：

> 我只是想在 macOS 上**随手打开一个 Markdown 文件看一眼**，如果能顺便改两笔就更好——仅此而已。

我不需要笔记库（vault）、不需要双向链接、不需要标签系统、不需要文件树、不需要发布到博客的一键流程、不需要 30 个主题。这些功能不是不好，而是它们都在解决"管理大量笔记"的问题，而我的问题是"**此刻**打开**这一个**文件"。

这个需求小到，理论上应该有一大把现成软件能完美满足。但真当我一个个试过去，发现没有一个让我舒服的。

## 我试过的那些编辑器，以及为什么都不行

把候选者摊开，按我最在意的几个维度排一张表：

<table style="width: 100%;">
    <tr>
        <th>编辑器</th>
        <th>实现方式</th>
        <th>价格</th>
        <th>维护状态</th>
        <th>我的槽点</th>
    </tr>
    <tr>
        <td><strong>Typora</strong></td>
        <td>Electron / CEF</td>
        <td>付费</td>
        <td>活跃</td>
        <td>体验确实是标杆，但收费 + Electron 套壳，进程动辄几百 MB</td>
    </tr>
    <tr>
        <td><strong>MacDown</strong></td>
        <td>原生 WebView</td>
        <td>免费开源</td>
        <td>年久失修</td>
        <td>老牌良心货，但更新近乎停滞，对新语法支持滞后</td>
    </tr>
    <tr>
        <td><strong>MacDown3000</strong></td>
        <td>MacDown 衍生</td>
        <td>免费</td>
        <td>不稳定</td>
        <td>每次跟着更新就容易"罢工"，可靠性堪忧</td>
    </tr>
    <tr>
        <td><strong>Mark Text</strong></td>
        <td>Electron</td>
        <td>免费开源</td>
        <td>基本停更</td>
        <td>曾经很惊艳，如今 issue 堆积、长期没有新版</td>
    </tr>
    <tr>
        <td><strong>Obsidian</strong></td>
        <td>Electron</td>
        <td>个人免费</td>
        <td>活跃</td>
        <td>强大但"重"，是知识库工具，为"打开一个文件"杀鸡用牛刀</td>
    </tr>
    <tr>
        <td><strong>iA Writer</strong></td>
        <td>原生</td>
        <td>付费</td>
        <td>活跃</td>
        <td>原生、极简、很优雅，但要付费，且偏纯写作</td>
    </tr>
    <tr>
        <td><strong>Marked 2</strong></td>
        <td>原生</td>
        <td>付费</td>
        <td>活跃</td>
        <td>只读预览器，不能编辑，定位和我的需求错位</td>
    </tr>
    <tr>
        <td><strong>VS Code</strong></td>
        <td>Electron</td>
        <td>免费</td>
        <td>活跃</td>
        <td>它是 IDE，为看一个 md 启动整个编辑器，心理负担太大</td>
    </tr>
</table>

把这张表看下来，会发现它们恰好踩满了我的四条雷区：

1. **要么收费**——Typora、iA Writer、Marked 2，体验好但要掏钱，而我的需求廉价到不值得为它付费；
2. **要么是 Electron 套壳**——Mark Text、Obsidian、VS Code，随便开一个进程就吃掉几百 MB 内存，启动还有可感知的延迟，跟"随手看一眼"的轻快感背道而驰；
3. **要么年久失修**——MacDown 这样的老牌开源货，代码还在，但维护近乎停摆，新语法跟不上；
4. **要么不稳定**——MacDown 衍生出来的 MacDown3000，我用得最闹心，常常一更新就不能好好工作。

最让我难受的是第 2 条。Markdown 这种纯文本格式，本应是最轻量的东西，结果主流方案却普遍建立在一整个浏览器内核之上。为了渲染几段文字和代码块，背一个 Chromium，怎么想都不对劲。

## 那就自己写一个吧

既然挑不到，那就自己造。正好赶上 AI 辅助编程（大家戏称 "vibe coding"）已经足够顺手，我决定亲自下场，做一个完全贴合自己需求的编辑器。给它起名 **Markdown2**——"Markdown Editor **Too**"，一个不太正经的双关：既是"另一个 Markdown 编辑器"，也是"我也想要一个 Markdown 编辑器"。

立项时我给自己定了几条死规矩，全部是对前面四条雷区的正面回应：

- **原生，不用 Electron**——用 SwiftUI + AppKit，做成真正的 macOS app，启动快、内存小；
- **轻量，专注阅读/编辑**——单窗口，只有"编写"和"阅读"两种模式，不做文件管理、不做笔记库；
- **离线，不依赖网络**——公式、图表的渲染资源全部内置打包，断网照样工作；
- **开源免费**——MIT 协议，自己用得放心，也省得有人重蹈我"挑不到"的覆辙。

技术栈选 Swift 而不是继续套 Electron，理由很直接：我想要的就是"原生的轻"。文本编辑这件事，AppKit 的 `NSTextView` 经过几十年打磨，底子比任何 Web 富文本都扎实；外层用 SwiftUI 搭界面和状态管理，写起来又足够现代。两者配合，正好是"原生底座 + 现代外壳"。

整个项目用 Swift Package Manager 组织，拆成三层：

- `MD2Core`——纯逻辑层，Markdown 解析、渲染成 HTML、大纲提取、语法高亮、文档统计，不碰 UI，方便写单元测试；
- `MD2AppSupport`——承载启动激活这类与 AppKit 生命周期强相关的辅助逻辑；
- `MD2App`——SwiftUI/AppKit 的应用层，窗口、编辑器、预览、设置都在这。

逻辑和界面分层之后，核心的解析渲染能力是可以脱离 GUI 单独测试的，这让"vibe coding"产出的代码不至于变成一团没法验证的浆糊。

## 途中那些有意思的坑

vibe coding 不是把需求丢给 AI 就万事大吉，真正花时间的，永远是那些"看起来该工作却不工作"的细节。挑两个印象最深的讲讲。

### 坑一：`swift run` 启动后，窗口躲到了别人后面

开发阶段我习惯用 `swift run Markdown2` 直接跑。结果发现一个诡异现象：app 进程确实起来了，但**窗口总是藏在当前 app 的后面**，前台焦点还赖在终端/编辑器上，等于这 app 没法正常用。

排查下来，根因有点意思：SwiftPM 跑出来的是一个**裸的 Mach-O 可执行文件**，而不是被 LaunchServices 管理的 `.app` bundle。macOS 对"裸进程"和"正经 app"的窗口前台化待遇是不一样的——从裸进程里直接调 AppKit 的激活 API，并不足以可靠地把窗口抢到最前面。

解决办法是加了一段"直接启动引导"（direct-launch bootstrap）：当 Markdown2 发现自己不是在 `.app` 里运行时，就在 `.build` 目录下临时合成一个 `Markdown2.app`，再通过 `NSWorkspace` 带激活地把这个 bundle 打开，然后原始的裸进程退出。被 bundle 拉起来的那个进程会跳过引导逻辑，正常进入主流程。后来又发现 SwiftUI 的 `WindowGroup` 在这条特殊启动路径下，偶尔会进了 `applicationDidFinishLaunching` 却没真正建出可用的初始窗口，于是干脆在 `AppDelegate` 里**显式创建主 `NSWindow`**，把 SwiftUI 的 `ContentView` 塞进去托管，再加上几次延迟激活重试兜底。

这个坑我专门写了回归测试，验证激活策略提升、窗口层级排序、以及对"迟到窗口"的延迟重试。它很典型地说明了一件事：**AI 能飞快写出主干，但操作系统层面的边角行为，还是得人去抠**。

### 坑二：公式和图表，到底要不要联网

很多 Markdown 编辑器渲染数学公式和图表时，是去 CDN 拉 KaTeX/Mermaid 这些前端库的。但这跟我"断网也能看"的原则冲突——很多时候我打开一个 md，恰恰是在没网或不想联网的场景。

于是我把渲染资源全部**内置打包进 app**：

- **数学公式**用内置的 [KaTeX](https://katex.org/)，行内 `$...$` 和独占一行的 `$$...$$` 都支持，还带上了 mhchem 扩展，能写化学式 `\ce{H2SO4}`；
- **图表**支持 `mermaid`、`flow`（[flowchart.js](https://flowchart.js.org/)）和 `sequence`（[js-sequence-diagrams](https://bramp.github.io/js-sequence-diagrams/)），引擎全部离线内置。

代价是 app 体积大了一点，但换来"任何时候、任何网络环境下打开都一致"，我觉得非常值。顺带一提，这两块功能我是用 spec-driven 的方式做的——先写 proposal/design/spec，再让 AI 照着实现，archive 里至今留着 `add-math-support` 和 `add-diagram-rendering` 两个变更记录。给 vibe coding 套上一层规格约束，产出的可控性明显高很多。

## 现在的 Markdown2 长什么样

迭代到现在，它已经能覆盖我日常的全部需求：

- **单窗口、双模式**：一个主界面，`Esc` 从编辑切到预览，预览里 `Cmd+双击` 切回编辑，手不离键；
- **多窗口**：每个文档独立开窗，从 Finder 双击打开时会复用那些还没动过的空白窗口，不会越开越乱；
- **大纲侧栏**：按标题自动生成，长文档导航很顺；
- **自动保存 + 关闭确认**：已保存的文档防抖自动保存，有未保存改动时关窗/退出会提示；
- **状态栏**：字数、字符数、行数、预计阅读时间一眼可见；
- **够用的 Markdown 渲染**：标题、强调、链接、图片、引用、各类列表、GFM 表格、带语法高亮的围栏代码（Python/Go/Rust/Swift 等十来种语言）、YAML front matter、`[TOC]`，外加前面说的离线公式与图表；
- **文件类型关联**：打包后把 `.md`/`.markdown` 注册给自己，双击直达。

它**不做**的事同样清晰：脚注、PDF/DOCX 导出、图片上传拖拽、打字机模式、主题管理、笔记库——这些都不在"随手打开看一眼"的射程内，我刻意没碰。约束自己不做什么，往往比堆功能更难，但这恰恰是我对那些"功能太复杂"的编辑器最大的不满，不能自己又掉进同一个坑。

## 一点心路体会

回头看这趟，从"挑不到一个趁手的 Markdown 编辑器"到"两天攒出一个自己用着舒服的原生 app"，最大的感受有两条。

一是 **AI 把"自己造一个轮子"的门槛拉得很低了**。放在以前，为了这么个小需求去啃 AppKit、SwiftUI、KaTeX 内嵌，光是查文档就能劝退我；现在 vibe coding 让我能把精力集中在"我到底想要什么、哪里还不对"上，而不是卡在 API 细节里。

二是 **AI 替代不了"品味"和"较真"**。它能秒出一个能跑的版本，但"窗口为什么躲到后面"这种坑、"要不要联网渲染"这种取舍、"克制住不加哪些功能"这种判断，依然得人来定。工具越强，"想清楚自己要什么"反而越值钱。

代码已经开源在 GitHub（[stutiredboy/Markdown2](https://github.com/stutiredboy/Markdown2)），MIT 协议。如果你也和我一样，只是想随手打开一个 Markdown 文件看一眼，欢迎试试，也欢迎拍砖。
