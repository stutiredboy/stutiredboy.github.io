## ADDED Requirements

### Requirement: Seed generator script

仓库 MUST 包含一个一次性 Python 脚本 `scripts/generate_view_seeds.py`。运行后在 `themes/stuhouse/static/data/view-seeds.json` 写入 `{slug: int}` JSON 对象，覆盖 `content/*.md` 下所有已发表文章。脚本 MUST 幂等：同样输入产出同样输出；多次运行不追加噪音。

#### Scenario: 初次运行生成完整 seeds

- **WHEN** `content/` 下有 86 篇文章，Disqus 导出存在
- **THEN** 生成的 JSON 含 86 个 key，每个 key 对应一个正整数

#### Scenario: 重跑不变

- **WHEN** 同样的输入下脚本运行第二次
- **THEN** 生成的 JSON 字节级别不变（key 顺序稳定，数字不变）

#### Scenario: 新增一篇文章后重跑

- **WHEN** `content/` 新增一篇文章，Disqus 评论尚未产生，重跑脚本
- **THEN** JSON 新增一个 key，其值由"年份兜底"规则决定；其他 key 不变

### Requirement: Seed value formula

脚本 MUST 按以下公式为每篇文章计算 seed：

```
comment_based = disqus_comment_count * 120
year_based    = (current_year - publish_year) * 300
raw_seed      = max(comment_based, year_based)
seed          = round_to_50(raw_seed) if raw_seed <= 1000 else round_to_100(raw_seed)
```

其中：
- `disqus_comment_count` 来自脚本读取的 Disqus 导出 XML（无导出时视为 0）
- `publish_year` 来自文章 metadata 的 `Date:` 字段年份
- `current_year` 取脚本运行时年份
- `round_to_50(x) = round(x/50)*50`；`round_to_100(x) = round(x/100)*100`

#### Scenario: 老文章有多条评论

- **WHEN** 某 2014 年文章有 15 条 Disqus 评论，运行年 2026
- **THEN** `comment_based = 1800`, `year_based = 3600`, seed = 3600

#### Scenario: 新文章无评论

- **WHEN** 2026 年新文章，0 条评论
- **THEN** `comment_based = 0`, `year_based = 0`, seed = 0

#### Scenario: 中等年龄无评论

- **WHEN** 2019 年文章，0 条评论，运行年 2026
- **THEN** `year_based = 2100`, seed = 2100

#### Scenario: 结果向 50/100 取整

- **WHEN** 原始 seed 计算为 73
- **THEN** 最终 seed = 50（`round(73/50)*50`）

### Requirement: Disqus comment data loading

脚本 MUST 接受一个可选的 Disqus XML 导出文件路径（默认 `scripts/disqus-export.xml`），并解析出 `{slug: comment_count}` 映射。若文件不存在 MUST 打印一条警告并把所有评论数视为 0，继续生成 seed（纯年份兜底模式）。

#### Scenario: 导出文件存在

- **WHEN** `scripts/disqus-export.xml` 存在且合法
- **THEN** 脚本按 Disqus 导出格式（`<thread><link>...</link></thread>` + `<post>` 数量）统计每篇文章评论数

#### Scenario: 导出文件缺失

- **WHEN** 默认路径文件不存在
- **THEN** 脚本打印 `warning: Disqus export not found, using year-based fallback only`，继续运行，不报错

### Requirement: Seeds file location and format

脚本 MUST 输出到 `themes/stuhouse/static/data/view-seeds.json`（必要时创建目录）。输出 MUST 是 UTF-8 编码的 JSON 对象，key 按字母顺序排列，2 空格缩进，文件末尾一个换行。

#### Scenario: 格式规范

- **WHEN** 脚本运行完成
- **THEN** 输出文件第一行 `{`，key 按字母序，每个 key-value 一行，末行 `}`+ 换行

### Requirement: Manual seed overrides preserved

如果 `view-seeds.json` 中某个 slug 已有手工调整的值（通过在脚本生成后人工编辑），脚本再次运行时 MUST 保留手工值。实现方式 SHOULD 是在脚本中读取现有文件，对 `_overrides` key（若存在）里列出的 slug 不重新计算。

#### Scenario: 存在手工覆盖的 slug

- **WHEN** 已有 `view-seeds.json` 中包含 `"_overrides": ["some-post"]` 且 `"some-post": 9999`
- **THEN** 重跑脚本后 `"some-post"` 的值仍为 9999，其他 key 按公式重新计算

#### Scenario: 无覆盖时全量生成

- **WHEN** `_overrides` 数组为空或该 key 不存在
- **THEN** 所有 slug 按公式计算
