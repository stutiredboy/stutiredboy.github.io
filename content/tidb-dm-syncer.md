Title: TiDB DM 数据库同步 STEP BY STEP
Date: 2019-09-29 13:08:00
Tags: dm,mysql,tidb,syncer,pingcap
Slug: tidb-dm-syncer

前段时间，看到了一篇关于数据库选型的文章（MongoDB/TiDB/CockroachDB），忍不住感慨了一句，TiDB 一看就是大户人家，什么工具都可以有，什么工具都迭代得特别快，没有钱没有人，难以想像如何才能驱动得了。TiDB/TiKV/PD/Mydumper/Loader/Syncer/Data Migration/TiDB Lighting/Pump/Drainer ... 光是弄清楚这些组件是用来做什么的，感觉都可以评个高工了 :-)

随着 DM 1.0 GA 的 release，我们也开始考虑将 syncer 迁移至 DM。主要原因还是 syncer 已经太久没有更新了，否则 syncer 这种简易几乎无须部署的工具还是比较对我个人的胃口的，官方很喜欢把工具集群化（可能听起来厉害一点），DM 也是，那就按着最小目标（syncer）折腾一下吧。

DM 的架构文档可以参考[官方](https://pingcap.com/docs-cn/v3.0/reference/tools/data-migration/overview/#dm-架构)，整个集群有三个角色 dmctl/dm-master/dm-worker。

1. DM-master 负责管理和调度数据同步任务的各项操作。
2. DM-worker 负责执行具体的数据同步任务。
3. dmctl 是用来控制 DM 集群的命令行工具。

![Data Migration architecture](https://pingcap.com/images/docs-cn/dm-architecture.png)

官方也提供了基于 Ansible 的部署工具，如果你不是特别需要了解实际的部署过程，或者你的环境对 ansible 的亲和度比较好的话，可以参考[使用 DM-Ansible 部署 DM 集群](https://pingcap.com/docs-cn/v3.0/how-to/deploy/data-migration-with-ansible)。在这篇文章里，我们还是希望对于 DM 的部署有一定的了解，另外我们的小目标是实现类似 syncer 功能，因此，让我们 step by step 人肉部署吧。（好吧，吐槽一下，其实本人是很反感什么都要 ansible 再包一层的，无法直接通过文档了解工作方式，还非得去读 ansible 的相关部署文件）。

## 准备工作

1. 确认工作目录，假定这里为 `/home/dm`，并确保相关目录已经建立且具备读写权限：`mkdir -p /home/dm/log`；

2. 确保机器上已经具备相应的命令行工具，如：tar、wget、rsync 或 cp 等；

3. 下载 DM 二进制文件：

```shell
wget http://download.pingcap.org/dm-latest-linux-amd64.tar.gz
tar -zxvf dm-latest-linux-amd64.tar.gz
rsync -avz dm-latest-linux-amd64/bin/ /home/dm/bin/
```

4. 机器列表，这里我们主要熟悉部署过程，且不需要分库分表合并等功能，只实现 syncer 流程，因此 master 和 worker 均只部署在同一台同器：

   | 角色      | 地址           |
   | --------- | -------------- |
   | DM-master | 127.0.0.1:8261 |
   | DM-worker | 127.0.0.1:8262 |

## 配置文件

### dm-worker

```toml
# DM-worker Configuration: worker.toml
# MySQL Server ID, 注意不要和已有的 ID 冲突
server-id = 8262
# 可以理解为 worker 的唯一标识
source-id = "worker-8262"
worker-addr = "127.0.0.1:8262"
# 支持源为 mysql 或 mariadb
flavor = "mysql"
# 是否启用 GTID，开启前需要上游 MySQL 开启 GTID 功能
enable-gtid = true
# MySQL Master/Slave 发生切换时，是否修复 gtid
auto-fix-gtid = true
# 开始同步的位置，我这里使用 GTID，该值为 MySQL Master 上的 Executed_Gtid_Set 值
# relay-binlog-name = "binlog.000140"
relay-binlog-gtid = "2ea42e60-a157-11e9-8f2d-0ef02be0adee:1-3472558,34204ac9-a157-11e9-bc03-c6e9019f8073:1-2"
# charset of DSN of source mysql/mariadb instance
charset = ""
# worker 元数据存储目录，需要提前创建好
meta-dir = "/home/dm/meta/worker-8262"
# relay log 的本地存储目录，需要提前创建好
relay-dir = "/home/dm/relay/worker-8262"

# 源数据库，一个 worker 只能对应一个 MySQL 源
[from]
host            = "127.0.0.1"
user            = "dm"
# 该密码为使用 dmctl -encrypt ${你的原始密码} 加密后的字符串
password    = "vUYLfdtQlHLF6Kr4IHg8NkDjiPtVig6p"
port            = 3306

# relay log purge strategy
[purge]
interval            = 3600
expires             = 0
remain-space    = 15
```

配置不算特别复杂，需要留意的地方都在注释里进行说明了。其中 `source-id` 请记下来，接着配置 dm-master 需要用到。

再次提醒，MySQL 的密码配置需要使用 dmctl 进行加密处理。

### dm-master

```toml
# dm-master Configuration: master.toml
log-level       = "info"
log-file        = "/home/dm/log/dm-master.log"
master-addr = "127.0.0.1:8261"

[[deploy]]
source-id = "worker-8262"
dm-worker = "127.0.0.1:8262"
```

配置文件比较简单，基本上都不需要解释。其中 `[[deploy]]` 对应一个 worker，可以有多个 `[[deploy]]` 。目前了解到的，dm-worker 只能通过配置文件并重启 dm-master 进行加载，无法通过 dmctl 进行运行上填加。好在 dm-master 几乎随时都可以重启，所以也不是特别大的问题。

### dmctl

```toml
# dmctl Configuration: ctl.toml
master-addr = "127.0.0.1:8261"
```

dmctl 的配置就相当简单了，只需要指定 dm-master 地址。而 dmctl 也是我们与 dm-master 打交道的最直接工作。

## 集群启动

经过上述的配置（是不是没有想像中复杂），我们已经可以开启集群了：

1. 启动 master: bin/dm-master -config master.toml
2. 启动 worker: bin/dm-worker -config worker.toml

除了跟踪日志输出，确认进程是否正常启动。我们还可以借助 dmctl 来检查当前集群的情况，使用 `bin/dmctl -config ctl.toml` 连接集群，并通过 `query-status` 查询集群状态，返回如下（成功）：

```json
» query-status
{
    "result": true,
    "msg": "",
    "workers": [
        {
            "result": true,
            "worker": "127.0.0.1:8262",
            "msg": "no sub task started",
            "subTaskStatus": [
            ],
            "relayStatus": {
                "masterBinlog": "(binlog.000172, 234)",
                "masterBinlogGtid": "2ea42e60-a157-11e9-8f2d-0ef02be0adee:1-3472558,34204ac9-a157-11e9-bc03-c6e9019f8073:1-2",
                "relaySubDir": "2ea42e60-a157-11e9-8f2d-0ef02be0adee.000001",
                "relayBinlog": "(, 4)",
                "relayBinlogGtid": "34204ac9-a157-11e9-bc03-c6e9019f8073:1-2,2ea42e60-a157-11e9-8f2d-0ef02be0adee:1-3472558",
                "relayCatchUpMaster": true,
                "stage": "Running",
                "result": null
            },
            "sourceID": "worker-8262"
        }
    ]
}
»
```

这个时候，系统还没有配置任何同步任务，所以也可以看到显示的是：`no sub task started`。接下来，我们开始来配置一个最基础的同步任务。

## 配置并应用同步任务

### 创建任务配置文件

PingCAP 在任务配置这一块有比较完善的说明了[DM 任务配置文件介绍](https://pingcap.com/docs-cn/v3.0/reference/tools/data-migration/configure/task-configuration-file/)。这里我们以将源库为 `abc` 迁到目标库 `abc_dm` 为例子做简单说明：

```toml
---
name: test
task-mode: all
is-sharding: false
meta-schema: "dm_meta"
remove-meta: false
enable-heartbeat: false

target-database:
  host: "192.168.143.41"
  port: 3306
  user: "dm"
  password: "vUYLfdtQlHLF6Kr4IHg8NkDjiPtVig6p"

mysql-instances: # 源库及相关的同步规则配置
  -
    source-id: "worker-8262"

    meta:
      binlog-name: binlog.000140
      binlog-pos: 141868
    route-rules: ["user-route-rules-schema"]
    black-white-list: "instance"

routes:
  user-route-rules-schema:
    schema-pattern: "abc"
    target-schema: "abc_dm"

black-white-list:
  instance:
    do-dbs: ["abc"]
```

上面参数的说明都可以在官方文档找到，这里对几个重要的参数再做补充说明：

| 参数        | 说明                                                         |
| ----------- | ------------------------------------------------------------ |
| meta-schema | DM 会将该 task 对应的  meta 信息，如断点（checkpoint）存储至目标集存中的该数据库 |
| remove-meta | 通常我们希望在重启 worker/task 时可以从上次断点继续同步，需要设置为 false |
| password    | 需要使用 dmctl 加密                                          |
| source-id   | 理解为相应 dm worker 的 source-id                            |
| routes      | 可以在这里配置数据库表的改名规则，具体参考[官方文档](https://pingcap.com/docs-cn/v3.0/reference/tools/data-migration/configure/task-configuration-file/) |
| filters     | 这里没有用到，可以过滤相应的 binlog events，如 `drop table` 操作，具体参考[官方文档](https://pingcap.com/docs-cn/v3.0/reference/tools/data-migration/configure/task-configuration-file/) |

### 应用并启动同步任务

使用 `bin/dmctl -config ctl.toml` 登录 dm master，并执行 `start-task test.yaml` 即可，确认 `test.yaml` 文件在当前目录下，成功的话将收到如下返回：

```json
{
    "result": true,
    "msg": "",
    "workers": [
        {
            "result": true,
            "worker": "127.0.0.1:8262",
            "msg": ""
        }
    ]
}
```

这个时候再执行 `query-status` 可以看到相应的 dm worker 有了具体的 subTaskStatus 信息：

```json
            "subTaskStatus": [
                {
                    "name": "test",
                    "stage": "Paused",
                    "unit": "Sync",
                    "result": {
                        "isCanceled": false,
                        "errors": [
                        ],
                        "detail": null
                    },
                    "unresolvedDDLLockID": "",
                    "sync": {
                        "totalEvents": "0",
                        "totalTps": "0",
                        "recentTps": "0",
                        "masterBinlog": "(binlog.000176, 234)",
                        "masterBinlogGtid": "2ea42e60-a157-11e9-8f2d-0ef02be0adee:1-3472558,34204ac9-a157-11e9-bc03-c6e9019f8073:1-2",
                        "syncerBinlog": "(, 4)",
                        "syncerBinlogGtid": "",
                        "blockingDDLs": [
                        ],
                        "unresolvedGroups": [
                        ],
                        "synced": false
                    }
                }
            ],
```

这个时候我们通过 mysql 登录目标数据库，可以看到多了 `dm_meta` 和 `abc_dm` 两个数据库，其中 `dm_meta` 里面有两张表：

1. `test_loader_checkpoint` 其中 test 是任务的名称，这张表存储的是全量同步的 meta 信息；

```
            id: worker-8262
      filename: abc.t3.sql
     cp_schema: abc
      cp_table: t3
        offset: 156
       end_pos: 156
   create_time: 2019-09-29 12:03:59
   update_time: 2019-09-29 12:04:00
```



2. `test_syncer_checkpint` 其中 test 是任务的名称，这张表存储的是增量同步的 meta 信息；

```
            id: worker-8262
     cp_schema: abc
      cp_table: xxy
   binlog_name: binlog|000001.000176
    binlog_pos: 538
     is_global: 0
   create_time: 2019-09-29 12:11:25
   update_time: 2019-09-29 12:11:25
```



## 组件升级

### dm-master

dm-master 主要负责 dmctl 的通讯，维护任务及 Sharding DDL lock 信息，重启后会与 dm-worker 重启这些信息，所以除了影响 dmctl 短暂的使用，可以随时重启，升级也就比较简单了：下载新版本 -> 覆盖旧 binary -> 重启。

### dm-worker

dm-worker 在本地维护了 meta 信息，在下游（目标）数据库维护了断点（checkpoint）信息，升级也是按：下载新版本 -> 覆盖旧 binary -> 重启即可。唯一需要注意的有：

> 尽量避免在 sharding DDL 同步过程中重启 DM-worker。

当然，本身对数据的敬畏之心，即使没有 sharding，也不推荐在 DDL 的过程中重启 dm-worker。

### dmctl

命令行交互工具，直接升级即可：下载新版本 -> 覆盖旧 binary。

## 问题处理

1. dm-worker 挂了，并且本地的 meta 信息都丢失了怎么办？

   通常不需要担心，找回按原来的 worker.toml 再启动 worker 即可。其中配置文件中的 `relay-binlog-gtid` 或 `relay-binlog-name` 的位置信息可能在源数据库已经过期，可以从目标集群的 meta 库找回，或者直接从源数据库集群上使用一个相对靠前的位置信息替换即可。

   确认新的 worker 已经启动后，再次通过 dmctl 执行 `start-task test.yaml` 即可，task 的配置文件不需要修改，断点信息会从目标数据库中的 meta 库直接获取。

## 总结

官方的组件（概念）特别多，ansible 的包装让用户对相关组件的工作流程了解门槛大大提升。实际部署流程比想像中较为简单。从可靠性来看，还是比较推荐放弃 syncer（较长时间未更新了），并使用 dm 做为替代工具。
