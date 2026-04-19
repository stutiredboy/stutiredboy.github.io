## ADDED Requirements

### Requirement: Article meta row shows view count

文章页的 meta 行（`themes/stuhouse/templates/includes/article_meta.html` 渲染）MUST 在"阅读时长"之后、"标签"之前新增一个 span，显示 `👁 N 次阅读`，其中 N 是 `seed[slug] + realtimePV`。span 初始 MUST 带 `hidden` 属性或 `display:none`；JS 取到数据后才展示。

#### Scenario: 数据加载成功

- **WHEN** 文章页加载完成，`views.js` 对 `/v/<slug>` 请求返回 `{"pv": 7}`，且 `seed["<slug>"] = 300`
- **THEN** 页面显示"👁 307 次阅读"且 span 可见

#### Scenario: Seed 中无该 slug

- **WHEN** `view-seeds.json` 未收录该 slug，Worker 返回 `{"pv": 2}`
- **THEN** 显示"👁 2 次阅读"

#### Scenario: Worker 请求失败

- **WHEN** fetch 抛错或返回非 200
- **THEN** span 保持隐藏，不显示占位符

### Requirement: Site-wide stats in footer

页脚（`themes/stuhouse/templates/includes/footer.html` 渲染）MUST 新增一行容器，格式为 `本站累计阅读 <span id="site-pv"></span> 次 · 访客 <span id="site-uv"></span> 人`。span 初始隐藏，JS 成功拉取后整行可见。整行在任何页面（首页/文章页/归档/标签/作者/静态页）加载时都触发一次 `GET /v/site`。

#### Scenario: 任一页面加载触发计数

- **WHEN** 读者访问首页
- **THEN** `views.js` 发出一次 `GET /v/site`，拿到 `{pv, uv}` 后填入两个 span 并显示整行

#### Scenario: 文章页同时触发文章计数和站点计数

- **WHEN** 读者访问 `/posts/2012-11-30/install-bind-mysql-dlz.html`
- **THEN** 发出两个 fetch 请求：`GET /v/install-bind-mysql-dlz` 与 `GET /v/site`，彼此独立失败不影响对方

#### Scenario: Worker 不可达时隐藏整行

- **WHEN** fetch `/v/site` 失败
- **THEN** 页脚不显示"本站累计阅读 ..."整行

### Requirement: Seed overlay logic

前端 MUST 从 `/theme/data/view-seeds.json` 加载一次性 seed 数据（JSON 对象 `{slug: int}`），在文章页展示时以 `display = (seed[slug] || 0) + realtime_pv` 合并。seed 数据 MUST 在主题静态资源中随构建产出；MUST NOT 通过后端写入 KV。

#### Scenario: Seeds 文件存在且包含 slug

- **WHEN** `view-seeds.json` 含 `{"install-bind-mysql-dlz": 2450}`，worker 返回 `{"pv": 3}`
- **THEN** 显示 2453

#### Scenario: Seeds 文件存在但不含 slug

- **WHEN** `view-seeds.json` 不含当前 slug
- **THEN** seed 视为 0，显示 worker 原始 pv

#### Scenario: Seeds 文件加载失败

- **WHEN** `/theme/data/view-seeds.json` 返回 404 或网络错误
- **THEN** seed 视为 0，worker pv 仍独立展示；整体行为不 break

### Requirement: Number formatting

所有展示的计数 MUST 使用英文逗号千分位（如 `12,345`）。计数 MUST 渲染为整数，零小数位。

#### Scenario: 四位数以上

- **WHEN** 计数值为 12345
- **THEN** 显示 `12,345`

#### Scenario: 三位数以内

- **WHEN** 计数值为 42
- **THEN** 显示 `42`

### Requirement: Graceful degradation without JS

当浏览器禁用 JS 或脚本加载失败时，文章 meta 行 MUST 看起来和接入前完全一致（不显示 "👁" 图标、不显示任何占位数字、不产生空隙或错位），页脚同理。这意味着展示元素 MUST 在模板层初始隐藏，由 JS 负责揭示。

#### Scenario: JS 禁用

- **WHEN** 用户浏览器禁用 JavaScript
- **THEN** 页面上不出现任何与阅读量相关的文本或占位

#### Scenario: views.js 加载失败（404）

- **WHEN** `views.js` 请求 404
- **THEN** 同上，页面静默不显示计数元素

### Requirement: Local development no-op

本地 `pelican --listen` 环境下 Worker 不可达是已知现象，前端 MUST 在这种场景下静默（浏览器 console 可输出 warning 但**不**在页面上显示错误提示）。

#### Scenario: 本地开发预览

- **WHEN** 作者用 `pelican --listen` 本地预览文章
- **THEN** 文章正文正常渲染，meta 行无阅读数，页脚无统计；console 可见一条 warning
