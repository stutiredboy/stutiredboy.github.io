Title: .claude/ 文件夹解剖
Date: 2026-03-23 19:36:59
Tags: claude, ai
Slug: anantomy-of-the-claude-folder

大多数团队都在某种程度上采用了 AI，但“使用 AI”与“从 AI 中获得可衡量的 ROI”之间的差距，比人们想象得更大。

**[Postman](https://fandf.co/3NR30kc)** 发布了一份成本节省分析，评估了六种常见的 API 开发工作流，并对比了“平台内置 AI”与“外部加挂 AI”在实际时间和成本上的差异。

![Image 1](/static/anatomy-of-the-claude-folder/image_1.png)

这是一篇简短、数据驱动的阅读材料，能帮助工程负责人判断：AI 原生工具究竟在哪些环节真正能撬动效率。

**[你可以在这里免费下载这份指南 →](https://fandf.co/3NR30kc)**

_感谢 Postman 今日赞助！_

Claude Code 的用户通常把 `.claude` 文件夹当成黑盒。知道它存在，也见过它出现在项目根目录里，但几乎没人真正打开看过，更别说理解里面每个文件的作用。

这是个被错过的机会。

`.claude` 文件夹其实是你在项目里“控制 Claude 行为”的中枢。

![Image 2](/static/anatomy-of-the-claude-folder/image_2.png)

它保存了你的指令、自定义命令、权限规则，甚至还有 Claude 跨会话的记忆。理解每个文件的位置和意义之后，你就可以让 Claude Code 完全按你团队的方式运行。

这篇文章会带你完整拆解这个文件夹，从你每天会用到的文件，到你只需设置一次就能忘记的部分。

在开始之前，有一点要先知道：实际上有两个 .claude 目录，而不是一个。

一个在项目里，另一个在你的 home 目录：

![Image 3](/static/anatomy-of-the-claude-folder/image_3.png)

项目级的文件夹保存团队配置。你会把它提交到 git，所有人都用同一套规则、同一组自定义命令、同一份权限策略。

全局的 `~/.claude/` 文件夹保存你的个人偏好和本机状态，比如会话历史和自动记忆。

这是整个系统里最关键的文件。你启动 Claude Code 会话时，它第一个读取的就是 `CLAUDE.md`。它会被直接加载进系统提示词，并贯穿整个对话。

说白了：你写在 `CLAUDE.md` 里的内容，Claude 就会遵守。

你告诉它“先写测试再写实现”，它就会这么做。你写“禁止用 console.log 做错误处理，要用自定义 logger 模块”，它每次都会遵循。

最常见的做法是在项目根目录放一个 `CLAUDE.md`。但你也可以在 `~/.claude/CLAUDE.md` 放一个全局偏好，甚至在子目录里放局部规则。Claude 会读取它们并自动合并。

多数人不是写得太多，就是写得太少。下面是合理的取舍。

##### 建议写：

*   构建、测试、Lint 命令（如 npm run test、make build 等）
*   关键架构决策（比如“我们使用 Turborepo 的 Monorepo”）
*   不显然的坑（比如“TypeScript 开启 strict，未使用变量会报错”）
*   导入约定、命名规范、错误处理风格
*   核心模块的文件与目录结构

##### 不建议写：

*   应该放在 Linter 或 Formatter 配置里的内容
*   已有文档、可以直接链接的完整说明
*   长篇大论的理论解释

把 `CLAUDE.md` 控制在 200 行以内。文件太长会消耗上下文，Claude 的指令遵循度反而会下降。

原文此处有一个“简短但有效”的示例（截图展示）。

大约 20 行，足以让 Claude 在这个代码库里高效工作，而不需要不断追问。

有时你的偏好只属于你本人，不适合全团队。比如你偏好某种测试框架，或者希望 Claude 打开文件时遵循某个固定模式。

在项目根目录创建 `CLAUDE.local.md`。Claude 会和主 `CLAUDE.md` 一起读取，但这个文件会自动被 gitignore，不会进入仓库。

![Image 4](/static/anatomy-of-the-claude-folder/image_4.png)

`CLAUDE.md` 适合单一项目。但一旦团队扩大，你很容易得到一个 300 行、没人维护、人人忽视的 `CLAUDE.md`。

`rules/` 文件夹就是为了解决这个问题。

`.claude/rules/` 里的每个 Markdown 文件都会和 `CLAUDE.md` 一起加载。你可以按主题拆分指令：

每个文件都更聚焦、更容易更新。负责 API 规范的人只改 `api-conventions.md`，负责测试标准的人改 `testing.md`，互不干扰。

真正的威力在“路径作用域规则”。在规则文件里加一个 YAML frontmatter，就可以让它只在匹配路径时生效：

比如它不会在编辑 React 组件时加载，而只在处理 `src/api/` 或 `src/handlers/` 时生效。没有 `paths` 的规则会在每次会话中无条件加载。

当 `CLAUDE.md` 开始变得臃肿时，这就是正确的拆分方式。

Claude Code 自带一些内置斜杠命令，比如 `/help` 和 `/compact`。`commands/` 文件夹允许你自定义命令。

你在 `.claude/commands/` 里放一个 Markdown 文件，它就会变成一个斜杠命令。

比如 `review.md` 会生成 `/project:review`，`fix-issue.md` 会生成 `/project:fix-issue`。文件名就是命令名。

![Image 5](/static/anatomy-of-the-claude-folder/image_5.png)

原文这里给了一个简单示例：创建 `.claude/commands/review.md`。

然后在 Claude Code 里运行 `/project:review`，它会自动把真实的 git diff 注入到提示词中。反引号里的 `!` 语法会运行 shell 命令并把输出嵌入。这就是命令真正有用的原因，而不只是“保存一段文本”。

如果你需要传参，可以用 `$ARGUMENTS`：

运行 `/project:fix-issue 234` 会把 issue 234 的内容直接送进提示词。

`.claude/commands/` 里的项目命令会提交到仓库，和团队共享。若想在所有项目通用，把命令放到 `~/.claude/commands/`，它会显示为 `/user:command-name`。

一个很实用的个人命令：每日站会助手、按你约定格式生成提交信息、或者快速安全扫描。

你已经了解命令。技能看起来很像，但触发方式完全不同。先看这张图的区别：

![Image 6](/static/anatomy-of-the-claude-folder/image_6.png)

技能是 Claude 可以自己调用的工作流，不需要你敲斜杠命令，只要当前任务匹配技能描述，它就会自动触发。命令是你手动触发，技能是它自动判断。

每个技能都在自己的子目录里，包含一个 `SKILL.md`：

`SKILL.md` 用 YAML frontmatter 描述“什么时候使用这个技能”。

当你说“帮我审这个 PR 的安全问题”，Claude 会读取描述，判断匹配，于是自动调用这个技能。你也可以显式调用，比如 `/security-review`。

和命令最大的区别：技能可以打包一堆辅助文件。上面提到的 `DETAILED_GUIDE.md` 就是和 `SKILL.md` 同目录的参考资料。命令只是单个文件，而技能是一整个包。

个人技能放在 `~/.claude/skills/` 下，跨项目通用。

当任务复杂到值得一个专门专家时，可以在 `.claude/agents/` 定义子代理。每个代理是一个 Markdown 文件，包含它自己的系统提示词、可用工具、以及模型偏好：

下面是一个 `code-reviewer.md` 的样子。

当 Claude 需要做代码审查时，它会在独立上下文里启动这个代理。代理完成工作后会压缩结论再汇报，这样你的主会话不会被几千 tokens 的中间过程撑爆。

`tools` 字段限制代理能做什么。安全审计只需要 Read、Grep、Glob，完全不该写文件。这个限制是刻意为之。

`model` 字段让你选择更便宜、更快的模型来做聚焦任务。Haiku 处理读操作够用，把 Sonnet/Opus 留给真正需要能力的地方。

个人代理放在 `~/.claude/agents/` 下，跨项目可用。

![Image 7](/static/anatomy-of-the-claude-folder/image_7.png)

`.claude` 里的 `settings.json` 控制 Claude 允许做什么、不允许做什么。它定义了哪些工具可以用、哪些文件能读，以及哪些命令需要先询问。

完整文件长这样（原文此处为截图）。

各部分的含义如下：

*   **`$schema`** 行开启 VS Code 或 Cursor 的自动补全与校验，务必保留。
*   **allow list**：允许 Claude 无需确认即可运行的命令。典型选择包括：
    *   `Bash(npm run *)` 或 `Bash(make *)`，让 Claude 能自由执行脚本
    *   `Bash(git *)`，用于只读 git 操作
    *   Read、Write、Edit、Glob、Grep 等文件操作
*   **deny list**：无条件禁止的命令。合理的 deny list 会阻止：
    *   破坏性命令，比如 `rm -rf`
    *   直接网络命令，比如 `curl`
    *   敏感文件，比如 `.env` 和 `secrets/`

不在 allow 或 deny 列表里的命令，Claude 会先询问再执行。这种“中间地带”是有意设计的：既有安全网，又不需要你预判所有命令。

另外你也可以用 `settings.local.json` 做个人覆盖。创建 `.claude/settings.local.json`，它会被自动 gitignore，不进入仓库。

你很少手动管理这个文件夹，但最好知道它们存在。

`~/.claude/CLAUDE.md` 会加载到每个 Claude Code 会话里，跨项目生效。适合放你的个人编码原则、偏好风格等。

`~/.claude/projects/` 保存项目的会话记录和自动记忆。Claude Code 会把它学到的命令、模式、架构信息自动存下来并跨会话保留。你可以用 `/memory` 浏览和编辑。

`~/.claude/commands/` 和 `~/.claude/skills/` 保存你的个人命令和技能，跨项目可用。

你通常不需要手动整理这些，但知道它们的存在很有用：当 Claude 看起来“记住”了你没明确说过的东西，或者你想清空某个项目的自动记忆、重新开始时，就知道该去哪。

最后把一切串起来：如果你从零开始，以下步骤非常实用。

Step 1. 在 Claude Code 里运行 `/init`，它会读取项目并生成一个初始 `CLAUDE.md`，然后你把它精简到关键点。

Step 2. 添加 `.claude/settings.json`，设置合适的 allow/deny 规则。至少允许运行命令，禁止读取 .env。

Step 3. 创建一两个最常用的命令，比如代码审查或修复 issue。

Step 4. 当 `CLAUDE.md` 变拥挤时，把指令拆到 `.claude/rules/`，并按路径做作用域。

Step 5. 在 `~/.claude/CLAUDE.md` 写入个人偏好，比如“先写类型再写实现”“更偏函数式而不是类”。

这对 95% 的项目已经够用了。技能和代理只在你有反复出现的复杂工作流、值得打包时再引入。

`.claude` 文件夹本质上是一套协议：告诉 Claude 你是谁、项目做什么、它需要遵守哪些规则。定义得越清晰，你纠正 Claude 的时间就越少，它做的有用工作就越多。

`CLAUDE.md` 是你杠杆最大的文件。先把它写对，其他都是优化。

从小做起，逐步精炼，把它当成项目里的基础设施：一旦搭好，每天都会持续带来收益。

感谢阅读！英文原文：https://blog.dailydoseofds.com/p/anatomy-of-the-claude-folder
