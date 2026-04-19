Title: 用 Cloudflare Worker + KV 给静态博客加一个浏览量计数
Date: 2026-04-19 23:00:00
Tags: cloudflare, serverless, pelican, blog
Slug: pageview-counter-with-cf-worker-kv
Author: 小生说大声讲
Summary: 上一篇刚写完换主题的事，这篇继续给博客加一个浏览量计数。静态站托管在 GitHub Pages 上本来没法做这件事，用 Cloudflare Worker + KV 绕出来。顺带记一下为什么没选不蒜子 / GoatCounter，以及前端「seed 叠加」这个让老文章不从零起算的小机制。

上一篇换主题写完的时候，心里还有一个未了的念头：新主题把 Google Analytics 那坨早就停服的 UA 代码删了之后，整站就零统计了。写的时候没想太多，但上线一两天之后，每次点开自己的博客都有一种「在给空气写字」的感觉 —— 到底还有没有人看，哪篇被多读几遍，完全没有信号。

于是今晚继续折腾，给每篇文章加一个浏览量，顺带在页脚放一个整站 PV / UV。效果本身没什么稀奇，技术栈和取舍倒值得说一下。

## 静态站做计数的几种路子

博客源码在 `source` 分支，CI 构建后推到 `gh-pages`，GitHub Pages 托管。这个架构的好处是零运维、免费；坏处是 **没有访问日志**，GitHub 只在 Traffic API 里给 14 天的 top paths，而且要 OAuth 认证，前端根本用不了。

所以任何「在线计数」都得外挂。我考虑过的选项按接入门槛排列大概是这几类：

| 方案 | 接入 | 数据归属 | 可控性 |
|---|---|---|---|
| 不蒜子 | 粘两行 script | 第三方 | 几乎无 |
| GoatCounter 云版 | 注册、粘 script | 第三方 | 有仪表板和 API |
| Umami / Plausible 自托管 | 要一台 VPS | 自己 | 完全 |
| Cloudflare Worker + KV | 写个 Worker | 自己 | 完全 |

这四类都想过。

**不蒜子** 是中文博客圈最常见的选择，粘两行 JS 就能在页面上显示数字。但它不支持写入初始值、不暴露 API，偶尔还会抽风（`busuanzi.ibruce.info` 服务不稳是老问题了）。更关键的是：刚删完一大票第三方脚本（GA、AdSense、Disqus）的新主题，再挂一个外链，心理上拧巴。

**GoatCounter** 其实是符合我审美的选择 —— 开源、隐私友好、有 API、能自建也能用云版。唯一拿不准的是国内访问 `goatcounter.com` 的稳定性，以及把读者数据托管给第三方（哪怕它是隐私友好的）仍然是「托管」。

**自托管 Umami / Plausible** 需要一台 VPS 常驻。对一个每月也写不了一两篇的博客，养一台 VPS 就为了这个，是过度消费。

**Cloudflare Worker + KV** 最终胜出。几个原因：

- 我本来就是 CF 用户（域名 DNS 在 CF），账号、DNS 都是现成的
- Worker 免费档 100k 请求/天、KV 1k 写/天 + 100k 读/天，对个人博客是绰绰有余的天花板
- 边缘节点在国内延迟一般不差
- Worker 是一张多用途底牌 —— 未来要做外链跳转计数、RSS 订阅数统计、简单的 webhook 都能复用同一套基础设施

唯一的缺点是要自己写代码、自己部署。但需求简单到几十行 TS 就能搞定，还换不来过度工程的烦恼。

## 先用 OpenSpec 把事情说清楚

跟上次换主题一样，动手之前我先让 Claude 用 OpenSpec 写了一份变更提案：

```
openspec/changes/add-article-view-counts/
├── proposal.md   # 为什么、要改什么、不改什么
├── design.md     # 技术决策与取舍
├── specs/        # 可测试的规范（分三个 capability）
└── tasks.md      # 38 条分步任务
```

好处和上次一样 —— 边界清晰。比如 `design.md` 里写死了几个关键决策：

- 计数口径 **粗放全算**：不按 IP 去重，不识别爬虫。我的需求是「大致知道哪些文章有人读」，不是给广告主看的精确数字
- 不做 time series：KV 里只存当前累计值。要趋势数据直接看 CF Dashboard 自带的请求图即可
- UV 用 `sha256(IP + 当日日期 + salt)` 去重：每日盐轮换，不能反推原 IP，GDPR 友好
- **seed 在前端叠加**：这是整个方案最值得单独讲的一点

## seed 前端叠加：让老文章不从零起算

启用新计数有个心理坎：所有老文章（最早是 2013 年）都会从 0 开始。十三年前写的博文显示「0 次阅读」，哪怕它本来就没几个人读过，视觉上也很刺眼。

最直接的办法是在 KV 里预填一个初始值，让 `pv:<slug>` 从比如 3000 起算。但这样做有个恶心的地方：哪天想调整初始值（比如觉得这篇估高了），要从当前值里减掉旧 seed 再加新 seed，很容易算错。

我最终用的办法是 **把 seed 放在前端**：

```json
// themes/stuhouse/static/data/view-seeds.json
{
  "install-bind-mysql-dlz":    3900,
  "debian-add-cnnic-ca":       3900,
  "pelican-custom-jinja-filters": 3900,
  "postgraduate":               300,
  "peril-of-laziness-lost":       0
}
```

前端展示时：

```javascript
display = (seeds[slug] || 0) + realtime_pv_from_worker
```

这样做的好处有三点：

1. **seed 在 git 历史里**。想调整某篇文章的初始值，就是一次普通的 JSON 编辑 + commit，审计友好
2. **数据层与展示层解耦**。以后后端换成 GoatCounter / 自建服务，seed 逻辑一行不用改
3. **新文章自动 seed = 0**。JSON 里没这个 slug 就当 0，无需特殊处理

seed 数值本身来自一个简单的脚本 `scripts/generate_view_seeds.py`，公式是 `max(评论数 × 120, 年数 × 300)`。因为没导 Disqus 数据（懒得等那封导出邮件），实际跑的是纯年份兜底 —— 2013 年老文显示 3900 次阅读，2025 年新文显示 300 次，2026 年刚发的新文显示 0。不精确，但读起来自然。

## Worker 侧：两个端点、几行代码

核心逻辑在 `worker/src/index.ts`，就两个路由：

```typescript
// GET /v/<slug> → 单篇文章 PV 自增并返回
async function handleSlug(slug: string, env: Env) {
    const key = `pv:${slug}`;
    const cur = parseInt((await env.VIEWS.get(key)) || "0", 10);
    await env.VIEWS.put(key, String(cur + 1));
    return json({ pv: cur + 1 });
}

// GET /v/site → 整站 PV + UV
async function handleSite(request: Request, env: Env) {
    const ip = request.headers.get("CF-Connecting-IP") || "0.0.0.0";
    const today = ymd(new Date());

    // 站点 PV：粗放自增
    const sitePv = parseInt((await env.VIEWS.get("site:pv")) || "0", 10) + 1;
    await env.VIEWS.put("site:pv", String(sitePv));

    // 当日 UV：hash(ip + date + salt) 作 key 去重
    const hash = await sha256Hex(`${ip}|${today}|${env.SALT_SECRET}`);
    await env.VIEWS.put(`uv_today:${today}:${hash}`, "1", {
        expirationTtl: 60 * 60 * 48,
    });

    // 当日 UV size + 历史归档累计
    const todayCount = await countPrefix(env, `uv_today:${today}:`);
    const siteUvTotal = parseInt((await env.VIEWS.get("site:uv")) || "0", 10);
    return json({ pv: sitePv, uv: siteUvTotal + todayCount });
}
```

两件事值得注意。

**KV 没有 atomic increment**。上面的 `get → +1 → put` 在并发写入时理论上会丢计数。但这是个人博客，真并发极低，丢一两次也无所谓 —— 这正是「粗放口径」的含义。如果哪天真撞上高并发，再迁 Durable Object 就是，当下不过度设计。

**UV 归档用 cron 做**。每天 UTC 00:05 触发一次 `scheduled` 事件，列出昨日所有 `uv_today:<date>:*` key 的数量累加到 `site:uv`，然后把这些 key 删掉。这样 `uv_today:*` 只保留今天一天的数据，不会无限膨胀。

## 部署踩坑：custom_domain 的首次 deploy

整个部署靠 wrangler CLI 完成。`wrangler.toml` 填好 KV namespace id、secret 绑定、cron 触发器之后，一条 `wrangler deploy` 就能上线。但第一次配 custom_domain 时，我走了个小弯路。

原计划（也是 `tasks.md` 里最初写的）是老路子：先在 CF DNS 面板手工加一条 `views.chenxiaosheng.com` 的 A/AAAA 占位记录（任意 IP，重点是 Proxy 状态 orange cloud on），然后在 CF Dashboard 配置 Workers Routes 规则。

后来发现 wrangler 现在有更优雅的写法：

```toml
[[routes]]
pattern = "views.chenxiaosheng.com"
custom_domain = true
```

加上 `custom_domain = true` 这一行，`wrangler deploy` 会自动：

1. 给这个子域创建 DNS 记录
2. 向 CF 申请 edge 证书
3. 把 Worker 绑到该 hostname

一条命令搞定 DNS + 证书 + 路由三件事，比老路子干净得多。

有个小注意点：首次 `wrangler deploy` 之前需要先 `wrangler secret put SALT_SECRET`，但 put secret 时会触发一次占位 deploy。如果 `wrangler.toml` 里已经有 `custom_domain` 配置而 DNS 还没就绪，会报错。保险做法是先把 `[[routes]]` 段注释掉，完成 secret put 和首次 deploy（会部署到 `*.workers.dev`），再取消注释重新 deploy 启用 custom domain。我踩过一次之后把这个顺序写进了 `tasks.md`。

## 前端：不到 50 行

前端逻辑全在 `themes/stuhouse/static/js/views.js`。页面加载后做两件事：

```javascript
function showSiteStats() {
    fetch(WORKER_BASE + '/v/site').then(r => r.json()).then(data => {
        document.getElementById('site-pv').textContent = fmt(data.pv);
        document.getElementById('site-uv').textContent = fmt(data.uv);
        document.getElementById('site-stats-wrap').hidden = false;
    }).catch(() => {/* 静默 */});
}

function showArticlePv() {
    const slug = document.body.dataset.slug;
    if (!slug) return; // 非文章页跳过
    Promise.all([
        fetch(SEEDS_URL).then(r => r.json()).catch(() => ({})),
        fetch(WORKER_BASE + '/v/' + slug).then(r => r.json()).catch(() => null),
    ]).then(([seeds, pvData]) => {
        if (!pvData) return;
        const total = (seeds[slug] || 0) + pvData.pv;
        document.getElementById('article-pv').textContent = fmt(total);
        document.getElementById('article-pv-wrap').hidden = false;
    });
}
```

几个刻意的设计：

- 所有展示元素初始是 `hidden` 的，JS fetch 成功才 reveal。失败就保持隐藏 —— 禁用 JS 的读者看到的页面和接入前完全一致，不会出现占位符或半成品
- 两个 fetch 彼此独立，一个失败不影响另一个
- 数字用 `Intl.NumberFormat('en-US').format()` 加千分位，这行代码比 polyfill 轻多了
- 文章页由 `<body data-slug="...">` 带出 slug；非文章页（归档、标签）body 上没这个属性，JS 直接跳过

加上 CSS 小样式和一个眼睛图标的 inline SVG，前端总共改动不到 50 行。

## 跑起来之后的样子

上线之后，页脚多了一行：

```
本站累计阅读 1 次 · 访客 1 人
```

点开最早那篇 2013 年的《配置 Bind 使用 MySQL dlz 模式》，meta 行变成：

```
📅 2013-09-09 · 约 3 分钟阅读 · 👁 3,901 次阅读
```

seed 3900 加上我刚刷的 1 次。整体效果自然，没有违和感。

观察几个刻度：

- **KV 免费额度**：单次页面加载触发 1-2 次 fetch，按每日 100 个访客估算，一天产生约 200 次 write，远低于 1000/天的上限
- **延迟**：Worker 冷启动毫秒级，国内访问通过 CF 边缘节点基本感知不到
- **CF Dashboard**：免费账户自带的 Analytics 已经能看请求量、错误率、cron 触发记录，不需要额外仪表盘

## 写在后面

整套方案从 OpenSpec 提案到上线，节奏大致是：晚上跟 Claude 对了一轮选型、起草了 proposal 和 tasks，之后花了一个下午跑完 38 条任务里的 36 条（剩两条是明天早上验证 cron 和 UV 归档用的）。工作量其实不大，但过程里有两个体会想记一下。

**seed 叠加这个 pattern 值得收藏**。它把「初始化数据」这个一次性需求，从数据层（KV）挪到了展示层（前端 JSON），代价是每次渲染多读一个文件，换来的是可审计、可解耦、可迁移。同样的思路可以用在评论数迁移、积分系统初始化、任何「旧数据 + 新增量」的场景里。

**CF Worker 作为静态站的「副引擎」很好使**。它不改变「源码 + 静态输出」的主流程，却能把那些需要「一点点动态能力」的需求接住 —— 计数、跳转、短链、webhook、简单的 API 代理，都是十几行代码的事。很多人把「加动态能力」和「离开静态站」划等号，其实没必要。

至于今晚之前那个「在给空气写字」的感觉，暂时还没消失 —— 刚上线，KV 里真实数据也就一两条。但架构至少支持知道答案了，剩下的就交给时间。
