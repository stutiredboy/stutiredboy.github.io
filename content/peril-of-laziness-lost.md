Title: LLM 让程序员的编程美德“懒惰”更显重要了
Date: 2026-04-15 21:30:00
Tags: ai, llm, programming
Slug: peril-of-laziness-lost
Author: 小生说大声讲
Summary: Bryan Cantrill 在最新博文中指出，LLM 天生缺乏程序员的核心美德——懒惰。懒惰驱使程序员构建精炼的抽象，而 LLM 不受时间约束，只会让系统越来越臃肿。本文以半翻译半解读的形式梳理这篇文章的核心观点。

> 本文基于 Bryan Cantrill 的博文 [The Peril of Laziness Lost](https://bcantrill.dtrace.org/2026/04/12/the-peril-of-laziness-lost/) 进行半翻译半解读。

最近读到 Bryan Cantrill 的一篇博文，标题叫 *The Peril of Laziness Lost*（「懒惰」丧失之险）。Cantrill 是 DTrace 的共同作者、Sun Microsystems 前工程师、Oxide Computer 的联合创始人，在系统编程领域是教父级的人物。这篇文章从 Larry Wall 提出的「程序员三大美德」出发，讨论了 LLM 对软件工程的深层影响。读完之后觉得切中要害，值得展开聊聊。

## 程序员的三大美德

Larry Wall 在经典著作 *Programming Perl*（业界称为「骆驼书」）中提出了程序员的三大美德：**懒惰（Laziness）、急躁（Impatience）和傲慢（Hubris）**。

原文引用如下：

> If we're going to talk about good software design, we have to talk about Laziness, Impatience, and Hubris, the basis of good software design. We've all fallen into the trap of using cut-and-paste when we should have defined a higher-level abstraction, if only just a loop or subroutine.

这三个词乍听像是贬义，但 Larry Wall 赋予了它们完全不同的含义。其中「懒惰」最为深刻：它不是说程序员偷懒不干活，而是说好的程序员会因为「懒得重复做同一件事」，从而被驱动着去构建更高层次的抽象，让系统变得尽可能简洁。

Cantrill 对此的理解是：**懒惰驱使我们把系统做到尽可能简单（但不能过于简单）——去开发强大的抽象，从而让更多的事情变得更容易。**

## 懒惰的悖论：偷懒需要付出大量努力

这里有一个精妙的悖论：**要做到「懒」，其实需要非常努力。**

当程序员看似在「摸鱼」——躺在吊床上发呆、盯着天花板想问题——实际上是在反复推敲问题的本质。这种「吊床驱动开发」（hammock-driven development）是真正的智力劳动。程序员愿意在当下花费大量时间去打磨抽象，是因为在优化「未来的自己」的时间。当这个计算做对了，效果是辉煌的：好的抽象不仅服务于自己，还惠及所有后来者。

换句话说，**程序员的懒惰让软件更容易编写，让系统更容易组合，让更多人能写出更多好的软件。**

## Brogrammer 文化：虚假的勤奋

然而，过去二十年软件行业的扩张带来了一种不那么健康的文化。现代抽象带来的巨大生产力催生了一种对「虚假勤奋」的推崇——Cantrill 称之为 brogrammer 文化。在这种文化里，「吊床上的深度思考」被「crushing code」的鸡血叙事取代。人们不再关心抽象是否优雅，而是关心写了多少行代码、提了多少个 PR、一天搞定了几个 feature。

## LLM：给 Brogrammer 注射类固醇

LLM 的出现，在这堆干柴上劈了一道闪电。

Cantrill 的原话是：LLM 就像 brogrammer 群体的合成代谢类固醇（anabolic steroids）。无论一个人对软件开发持什么态度，LLM 都能放大这种态度的力量。于是那些本来就痴迷于「产出量」的人，现在更加不可收拾了。

他举了一个例子：Y Combinator 总裁 Garry Tan 在社交媒体上炫耀自己一天写了 37,000 行代码，还说「仍在加速」。

![37k a day bro](/static/peril-of-laziness-lost/37k-a-day-bro.webp)

Cantrill 不动声色地补了一句作为对比：**整个 DTrace 项目的代码量大约也就六万行左右。**

用行数衡量软件的价值，就好比用重量衡量文学作品的质量。这个谬误即便是初学者也看得出来。

## Garry Tan 的「作品」被拆解

至于 Tan 用如此疯狂的速度构建的产物——一个「newsletter-blog-thingy」——波兰工程师 Gregorein 对其做了一次拆解。结果既意料之中，又令人捧腹：

- 单次页面加载就包含了多个测试框架（test harnesses）
- 混入了 Rails 的 Hello World 应用
- 藏了一个文本编辑器
- 同一个 logo 出现了八个不同版本，其中一个的文件大小为 0 字节

Cantrill 指出，问题不在于这些具体的 bug（它们都可以修复），甚至不在于有人认为这种方法论代表了软件工程的未来（虽然这确实很烦人）。

**真正的问题是：LLM 天生缺乏「懒惰」这一美德。**

## 核心论点：LLM 不懂懒惰

这是整篇文章最精华的部分。

对 LLM 而言，工作是零成本的。LLM 不会觉得需要为自己（或任何人）的未来时间做优化。它会毫不犹豫地往一个越来越高的垃圾蛋糕上继续堆料。如果不加约束，LLM 只会让系统变得更大，而不是更好——也许能满足某些扭曲的虚荣指标，但代价是所有真正重要的东西。

这恰恰凸显了人类的「懒惰」有多关键：**正因为我们的时间有限，才迫使我们去开发精炼的抽象。** 我们不愿意把自己宝贵的（人类的！）时间浪费在笨拙抽象带来的后果上。最好的工程总是源于约束，而时间的约束限制了我们愿意承受的系统认知负荷。这才是驱动我们把系统做得更简单的力量，尽管系统本身的复杂性是内在的。

LLM 不受时间约束，也不承受认知负荷，因此不能指望它们主动去追求简洁。

## LLM 仍然是重要的工具

Cantrill 并没有否定 LLM 的价值。他明确说：LLM 是软件工程的非凡工具——但归根结底，它只是工具。

正确的使用方式是：

- 用 LLM 处理程序员「非美德性的懒惰」——比如帮助清理技术债务这类棘手但缺乏动力去做的事
- 用 LLM 提升工程严谨性
- 但这一切必须服务于程序员自身的「美德性懒惰」：产出更简洁、更强大的系统，不仅服务于当下的自己，也服务于未来一代又一代的软件工程师

## 个人感想

读完这篇文章，最大的感触是 Cantrill 精准地指出了 LLM 时代的核心矛盾：**工具变强了，但使用工具的判断力并没有跟着变强。**

LLM 让「写代码」的边际成本趋近于零，但「思考应该写什么代码」的成本一点都没降低。如果把 LLM 当成代码的自动生成器来追求产出量，最终只会得到一个体积庞大但内在混乱的系统。真正应该做的，是把 LLM 节省下来的时间投入到更深层的思考中去——去琢磨更好的抽象、更简洁的设计。

Larry Wall 几十年前提出的「懒惰是美德」，在 LLM 时代反而变得更加重要了。

## 参考

- Bryan Cantrill, [The Peril of Laziness Lost](https://bcantrill.dtrace.org/2026/04/12/the-peril-of-laziness-lost/), 2026-04-12
- Larry Wall, *Programming Perl* (The Camel Book)
