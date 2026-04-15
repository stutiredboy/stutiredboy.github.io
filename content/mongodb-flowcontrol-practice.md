Title: MongoDB 4.2 流控 FlowControl 机制走读
Date: 2022-06-11 22:21:00
Tags: mongodb, flowcontrol
Slug: mongodb-flowcontrol-practice
Author: 老树
Summary: MongoDB 4.2 引入了一个「流量控制」的新特性。该流控机制旨在保持副本集多数提交延迟小于或等于配置的最大值。此最大延迟的默认值为 10 秒。一旦多数提交的复制延迟达到配置的最大值的阈值百分比，流控制机制就会开始限制主节点上的写入。


MongoDB 4.2 引入了一个「流量控制」的新特性。该流控机制旨在保持副本集多数提交延迟小于或等于配置的最大值。此最大延迟的默认值为 10 秒。一旦多数提交的复制延迟达到配置的最大值的阈值百分比，流控制机制就会开始限制主节点上的写入。

当该特性开启时，MongoDB 会在给定的周期内（目前实现是 1 秒），分配一定数量的「流控票据」，MongoDB 的数据库库写操作需要通过获取「流控票据」来获取全局 IX 锁。当此给定周期内的票据分发完比后，相关操作需要等待下一个周期（下一秒）的票据刷新分发。部份 MongoDB 内部操作可能会忽略该流控机制，以确保 MongoDB 的正常运行。

接下来我们从算法、配置、源码等几个方面结合来了解一下该流控制机制的实现（本文以 MongoDB 4.2.20 版本的文档及源码为参考）。

## 环境要求

1. 因为是 4.2 才引入的，所以要求 MongoDB 版本大于等于 4.2.0，并且 featureCompatibility 也要匹配相应的版本；
2. 流控机制只在可以接受写入的节点生效（通过指 replica sets 中的 primary 节点）；
3. 当然，流控开关也是要打开的，默认打开。可以通过 [enableFlowControl](https://www.mongodb.com/docs/v4.2/reference/parameters/#param.enableFlowControl) 进行开关；
4. Read Concern Majority 必须启用，可以参考 [replication.enableMajorityReadConcern](https://www.mongodb.com/docs/v4.2/reference/parameters/#param.enableFlowControl) 启用；

当以上机制不满足时（亦可理解为流控机制关闭时），MongoDB 总是返回默认的最大数量 `_kMaxTickets = 1000 * 1000 * 1000`。

## 流控机制

流控制机制允许每秒获取指定数量的全局 IX 锁。除明确规避流控机制的操作外，全局 IX 锁获取必须首先获取「流控票据」然后才能获取锁。当此给定周期内的票据分发完比后，相关操作需要等待下一个周期（下一秒）的票据刷新分发。MongoDB 通过一个独立的机制每秒刷新一次票数。

```cpp
// src/mongo/db/storage/flow_control.cpp

FlowControl::FlowControl(ServiceContext* service, repl::ReplicationCoordinator* replCoord)
    ...

    _jobAnchor = service->getPeriodicRunner()->makeJob(
        {"FlowControlRefresher",
         [this](Client* client) {
             FlowControlTicketholder::get(client->getServiceContext())->refreshTo(getNumTickets());
         },
         Seconds(1)});
    _jobAnchor.start();
}
```

每次/秒刷新 tickets 数量时，`getNumTickets` 将计算应该允许多少票据以解决 MongoDB 多数提交的滞后问题（复制延迟）。流控机制根据以下因素确定每个周期要补充多少票：

1. 当前多数提交的复制延迟大于配置的目标最大复制延迟；
2. Secondary 在上一周期应用了多少次操作；
3. 在上一周期中平均每次操作需要获取多少个 IX 锁；

### 触发流控时 ticket 数量计算

触发流控的 ticket 数量可以通过如下公式理解：

> base * k ^ ((lag - threshold)/threshold) * fudge factor

相关变量说明如下：

- base 为上一周期的操作数（也可以理解为操作数 * 平均每次操作获取的 IX 锁），通过采样获取；

- k 为 MongoDB 触发流控时节流的速率，默认值为 0.5，MongoDB 的可配置参数为 `flowControlDecayConstant`；

- lag 为当前多数提交延迟；

- threshold 为配置的可容忍最达延迟，请特别留意，该值分别由两个参数控制 `flowControlTargetLagSeconds` 与 `flowControlThresholdLagPercentage` 默认值分别为 10 和 0.5，可以理解为当多数提交延迟大于 5 秒时，即触发流控；

```c++
// src/mongo/db/storage/flow_control.cpp
  
std::uint64_t getThresholdLagMillis() {
    return static_cast<std::uint64_t>(1000.0 * 		       	          gFlowControlThresholdLagPercentage.load() *
                                      gFlowControlTargetLagSeconds.load());
}
```

- fudge 因子：比 1 略小的值，主要是为了控制当 lag 与 threshold 接近时，分配略低于 base 数量的票证。默认值为 0.95，可通过参数 `flowControlFudgeFactor` 进行配置，该值要求设置为大于 0， 小于 1，尽量接近 1；

公式的代码主体如下：

```c++
// src/mongo/db/storage/flow_control.cpp

int multiplyWithOverflowCheck(double term1, double term2, int maxValue) {
  ...
  double ret = term1 * term2;
  ...
  return static_cast<int>(ret);
}
...
int FlowControl::_calculateNewTicketsForLag(
  ...
    auto exponent = static_cast<double>(lagMillis - thresholdLagMillis) /
        static_cast<double>(thresholdLagMillis);
    invariant(exponent >= 0.0);

    const double reduce = pow(gFlowControlDecayConstant.load(), exponent);

    // The fudge factor, by default is 0.95. Keeping this value close to one reduces oscillations in
    // an environment where secondaries consistently process operations slower than the primary.
    double sustainerAppliedPenalty =
        sustainerAppliedCount * reduce * gFlowControlFudgeFactor.load();
    ...
    return multiplyWithOverflowCheck(locksPerOp, sustainerAppliedPenalty, _kMaxTickets);
  }
```

#### 采样方式

采样的频率和数量主要通过如下两个配置参数进行控制：

- `flowControlSamplePeriod` 这个参数的命名比较容易让人困惑，会容易误认为是时间，实际理解是每 N 次采样一次，N 即为 `flowControlSamplePeriod` 设置的值，值越小的精度越高，所以可能更容易触发流控导致业务降级；

```c++
// src/mongo/db/storage/flow_control.cpp
  
void FlowControl::sample(Timestamp timestamp, std::uint64_t opsApplied) {
    ...
    if (_numOpsSinceStartup - _lastSample <
        static_cast<std::size_t>(gFlowControlSamplePeriod.load())) {
        // Naively sample once every 1000 or so operations.
        return;
    }
```

- `flowControlMaxSamples`，内存中保存的样本数，默认值为 1000000， 每个样本数约为 24 bytes大小，保存 100000 样本数约需 24MB 内存；

采样在 oplog 相关的操作中进行，参考上述 sample 采样逻辑及下述代码，没有发现显式的采样开关，即**无论是否启用流控制，采样机制都会执行**。

```c++
//src/mongo/db/repl/local_oplog_info.cpp

std::vector<OplogSlot> LocalOplogInfo::getNextOpTimes(OperationContext* opCtx, std::size_t count) {
    ...
    // Provide a sample to FlowControl after the `oplogInfo.newOpMutex` is released.
    ON_BLOCK_EXIT([opCtx, &ts, count] {
        auto flowControl = FlowControl::get(opCtx);
        if (flowControl) {
            flowControl->sample(ts, count);
        }
    });
}
```



### 延迟正常（未触发流控）时 ticket 数量计算

当多数提交的延迟小于可容忍流控阈值的延迟百分比时（认为服务状态健康），直接将上一期间分配的 ticket 数量做为基数，并增加一个可配置的常量（票据加法），参数名称为 `flowControlTicketAdderConstant` 默认值为 1000。总和乘以另一个可配置的常量（票据乘数），最终的值为下期分配的新票数。该乘数配置参数名称为 `flowControlTicketMultiplierConstant` 默认值为 1.05，修改配置需要确保大于 1。

该算法主要是为了确保系统健康时，特别是初始使用了较少的 ticket 时，系统 ticket 数量可以快速得到提升。公式：`(lastTargetTicketsPermitted + flowControlTicketAdderConstant) * flowControlTicketMultiplierConstant`

```c++
// src/mongo/db/storage/flow_control.cpp

int FlowControl::getNumTickets(Date_t now) {
  ...
      if (isHealthy) {
        // The add/multiply technique is used to ensure ticket allocation can ramp up quickly,
        // particularly if there were very few tickets to begin with.
        ret = multiplyWithOverflowCheck(_lastTargetTicketsPermitted.load() +
                                            gFlowControlTicketAdderConstant.load(),
                                        gFlowControlTicketMultiplierConstant.load(),
                                        kMaxTickets);
        ...
      }
  ...
}
```

## 配置参数整理

| 配置参数                            | 说明                                                         |
| ----------------------------------- | ------------------------------------------------------------ |
| enableFlowControl                   | 流控开关 true/false，默认 true                               |
| flowControlTargetLagSeconds         | 可容忍的多数提交延迟，单位为秒，默认 10                      |
| flowControlThresholdLagPercentage   | 可容忍的多数提交延迟百分比，{ gte: 0.0, lte: 1.0 }，该值乘以 flowControlTargetLagSeconds 为实际可容忍的延迟 |
| flowControlMaxSamples               | 最大的保留样本数                                             |
| flowControlSamplePeriod             | 采样周期，注意不是指**时间**，指：N 次操作采样一次           |
| flowControlMinTicketsPerSecond      | 最小的 ticket 数量，默认 100。设置过小可能会导致系统需要**预热**，可以根据系统业务的情况适当调整 |
| flowControlDecayConstant            | MongoDB 触发流控时节流的速率，默认值为 0.5                   |
| flowControlFudgeFactor              | Fudge 因子，默认为 0.95，要求小于 1，但接近 1，**不建议调整** |
| flowControlTicketAdderConstant      | 健康状态时，ticket 加数，以快速增加健康状态时的 ticket 数量  |
| flowControlTicketMultiplierConstant | 健康状态时，ticket 乘数，以快速增加健康状态时的 ticket 数量  |

**需留意**，MongoDB 启动时，默认的 ticket 数量为 `_kMaxTickets = 1000 * 1000 * 1000` 即 10 亿，而不是 `flowControlMinTicketsPerSecond` 的值。通过如下命令可以查看当前的票据情况：

```
// MongoDB 刚启动时

tmongo40:PRIMARY> db.serverStatus()["flowControl"].targetRateLimit
1000000000

tmongo40:PRIMARY> db.serverStatus()["flowControl"]
{
	"enabled" : true,
	"targetRateLimit" : 1000000000,
	"timeAcquiringMicros" : NumberLong(76),
	"locksPerOp" : 0,
	"sustainerRate" : 0,
	"isLagged" : false,
	"isLaggedCount" : 0,
	"isLaggedTimeMicros" : NumberLong(0)
}

// 触发流控后

tmongo40:PRIMARY> db.serverStatus()["flowControl"]
{
	"enabled" : true,
	"targetRateLimit" : 2015,
	"timeAcquiringMicros" : NumberLong(12064),
	"locksPerOp" : 1,
	"sustainerRate" : 2196,
	"isLagged" : true,
	"isLaggedCount" : 1,
	"isLaggedTimeMicros" : NumberLong(0)
}
tmongo40:PRIMARY> db.serverStatus()["flowControl"]
{
	"enabled" : true,
	"targetRateLimit" : 1014,
	"timeAcquiringMicros" : NumberLong(38346),
	"locksPerOp" : 1,
	"sustainerRate" : 1924,
	"isLagged" : true,
	"isLaggedCount" : 1,
	"isLaggedTimeMicros" : NumberLong(0)
}
```

## 日志

触发限流时，可以在 MongoDB 的日志里找到 flowControl 相关的日志。

![image-20220609174333655](/static/mongodb-flowcontrol-log.png)

## 其他结论

1. 好的限流效果需要根据业务的情况持续调测相关参数，且 MongoDB 的限流算法主节点的处理能力受主节点影响，存在多种不确定因素（如网络），建议谨慎开启。或基于前述情况，建议降低流控敏感度，如放宽对大多数主从提交的延迟阈值容忍，仅在较极端情况下对 MongoDB 触发保护，避免过于敏感反而影响正常业务请求；
2. 根据某业务的线上表现来看，在 CPU、io 吞吐极低的情况下，MongoDB 默认的参数配置仍频繁的触发限流。因此建议仍如 1；

## 参考文档

1. enableFlowControl: https://www.mongodb.com/docs/v4.2/reference/parameters/#param.enableFlowControl
2. source code: https://github.com/mongodb/mongo/tree/r4.2.20
