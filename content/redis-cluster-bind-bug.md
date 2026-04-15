Title: 一次「安全」的变更将 redis cluster 送进了孤岛
Date: 2018-07-16 00:51:00
Tags: redis
Slug: redis-cluster-bind-bug
Author: 陈小生
Summary: 一次以为安全的，天衣无缝的升级，却将 redis cluster 集群送进了孤岛。对于这次故障，没有借口，我们不能也不该出现这样的失误！我们将认真复盘改进自动化运维技术和发布验证流程，敬畏每一行代码，敬畏每一份托付。

鉴于 redis 没有有效的鉴权方法（特别是 redis cluster），为了防止人为疏忽导致系统防火墙未被有效开启，我们决定对线上的 redis 增加显示监听内网 IP 配置：

> bind 127.0.0.1 ${本机内网 IP}

在我们看来，这是一个不可能出现问题的变更，因此也没有专门安排测试。事实证明，没有保持敬畏之心的我们还是太天真了！

线上配置发布后，重启 redis 服务，一切都很顺利，进程成功启动。然后，灾难开始降临，业务开始反馈 redis 缓存无法读写，查看 redis 日志，发现：

> Cluster state changed: fail

尝试通过 redis-cli 连接进行操作，连接没有问题，但当我们尝试执行 `get a` 操作时，集却群反馈错误：

> -CLUSTERDOWN The cluster is down

首要事件是保证服务可用，我们第一时间回退配置，重启后 redis 服务恢复正常。

### 问题回放

开启 Debug 模式，发现有大量的 createing socket: invalid argument 怀疑是 redis 拿了 bind 中的第一个 IP 为节点 IP，导致集群中所有节点的 IP 为 127.0.0.1，因此集群的通信出现问题（事后 review 代码确认跟第一个 IP 有关系，但不是导致所有节点的 IP 为 127.0.0.1）。

```
1616:M 02 Jul 11:02:25.407 # Cluster state changed: ok
......
13236:M 02 Jul 11:02:27.104 . Unable to connect to Cluster Node [10.x.x.x]:16379 -> creating socket: Invalid argument
13236:M 02 Jul 11:02:27.104 . Unable to connect to Cluster Node [10.x.x.x]:16379 -> creating socket: Invalid argument
......
1616:M 02 Jul 11:02:38.438 # Cluster state changed: fail
```

有了上面的怀疑之后，我们尝试修改 bind 的配置，将 127.0.0.1 放到后面，即：

> bind ${本机内网 IP} 127.0.0.1

重启集群发现问题果然没有出现，感觉自己好机智（进行源码分析后，发现自己还是想的太简单了）。

### 源码分析

redis 版本：3.2.11

1. 根据 `Cluster state changed: fail` 我们定位到，redis 是在 cluster.c 的 clusterUpdateState 函数里进行集群的状态判断：

    - 当节点状态为 CLUSTER_NODE_FAIL 或 CLUSTER_NODE_PFAIL 时，节点被标记为不可达；
    - 当不可达的 master 节点大于 quorum 时，集群被标记为不可用；

    ```c
        /* Compute the cluster size, that is the number of master nodes
         * serving at least a single slot.
         *
         * At the same time count the number of reachable masters having
         * at least one slot. */
        {
         ...
                    if ((node->flags & (CLUSTER_NODE_FAIL|CLUSTER_NODE_PFAIL)) == 0)
                        reachable_masters++;
         ...
        }
 
        /* If we are in a minority partition, change the cluster state
         * to FAIL. */
        {
            int needed_quorum = (server.cluster->size / 2) + 1;
 
            if (reachable_masters < needed_quorum) {
                new_state = CLUSTER_FAIL;
                among_minority_time = mstime();
            }
        }
 
        /* Log a state change */
        if (new_state != server.cluster->state) {
            ....
            /* Change the state and log the event. */
            serverLog(LL_WARNING,"Cluster state changed: %s",
                new_state == CLUSTER_OK ? "ok" : "fail");
            server.cluster->state = new_state;
            ...
        }
    ```

2. redis cluster 主要是通过 cluster.c 中的 clusterCron 定期判断收集集群的状态，也是在这个函数里我们发现了最主要的探测函数 `anetTcpNonBlockBindConnect` 及非常符合异常特征的参数名称 `NET_FIRST_BIND_ADDR`

    ```c
                fd = anetTcpNonBlockBindConnect(server.neterr, node->ip,
                    node->port+CLUSTER_PORT_INCR, NET_FIRST_BIND_ADDR);
                if (fd == -1) {
                    /* We got a synchronous error from connect before
                     * clusterSendPing() had a chance to be called.
                     * If node->ping_sent is zero, failure detection can't work,
                     * so we claim we actually sent a ping now (that will
                     * be really sent as soon as the link is obtained). */
                    if (node->ping_sent == 0) node->ping_sent = mstime();
                    serverLog(LL_DEBUG, "Unable to connect to "
                        "Cluster Node [%s]:%d -> %s", node->ip,
                        node->port+CLUSTER_PORT_INCR,
                        server.neterr);
                    continue;
                }
    ```

3. `anetTcpNonBlockBindConnect` 函数位于 anet.c 文件中，该函数调用了另一个函数 `anetTcpGenericConnect`，`NET_FIRST_BIND_ADDR` 在这里的实际作用为 source addr，问题原因已经呼之欲出了。我们再次定位 `anetTcpGenericConnect` 函数，找到以下内容：

    ```c
            if (source_addr) {
                int bound = 0;
                /* Using getaddrinfo saves us from self-determining IPv4 vs IPv6 */
                if ((rv = getaddrinfo(source_addr, NULL, &hints, &bservinfo)) != 0)
                {
                    anetSetError(err, "%s", gai_strerror(rv));
                    goto error;
                }
                for (b = bservinfo; b != NULL; b = b->ai_next) {
                    if (bind(s,b->ai_addr,b->ai_addrlen) != -1) {
                        bound = 1;
                        break;
                    }
                }
                freeaddrinfo(bservinfo);
                if (!bound) {
                   anetSetError(err, "bind: %s", strerror(errno));
                   goto error;
                }
            }
    ```

4. 通过以上内容，我们可以确认 redis cluster 在健康检测，建立 socket 连接时，尝试绑定了 socket 源地址，那么 `NET_FIRST_BIND_ADDR` 内容究竟是什么呢？这个我们在 server.h 文件中找到了答案，确实是 bind 配置中的第一个 IP，也就是我们这里的 127.0.0.1

    ```c
    /* Get the first bind addr or NULL */
    #define NET_FIRST_BIND_ADDR (server.bindaddr_count ? server.bindaddr[0] : NULL)
    ```

### 问题结论

1. redis cluster 在检测节点健康状态时，尝试与其它节点建立连接，但强制使用了 bind 配置中的第一个 IP 为建立 socket 的源地址
2. 以上案例，当配置了监听 127.0.0.1 时，redis cluster 将尝试使用本地地址 127.0.0.1 去和一个外部节点建立链接，因此失败了；
3. 基本的解决方法：使用 bind 配置时，确保将可进行通讯的 IP 放在第一个；
4. 有没有其它问题：如果这是一个新建的 cluster 集群，那么在使用 redis-trib.rb 进行初始化集群时，该配置将导致 redis-trib.rb 工具长期阻塞，无法成功执行；
5. 所有支持 cluster 的 redis 版本均受影响（包括 unstable 分支）；

### 其它

私以为强制使用 bind 第一个 IP 进行通讯的方法略有不妥，如果检测健康状态时一定需要指定源地址的话，兴许做出如下调整会有一定的优势：

- 当未初始化时（集群节点未明确 IP 地址），建立 socket 连接，不要指定源地址，由操作系统自行分配源地址即可；
- 当 redis cluster 初始化时，可以使用初始化时指定的节点 IP 做为源地址；
- redis 在 anet.c 文件里，其实还提供了 `anetTcpNonBlockBestEffortBindConnect` 函数，这个函数如果通过绑定源地址建立 socket 链接失败后，会再次尝试由系统分配源地址的方式（不绑定），健康检查函数换成这个也不失为一个好办法；

最（chao）后（xi）：对于这次故障，没有借口，我们不能也不该出现这样的失误！我们将认真复盘改进自动化运维技术和发布验证流程，敬畏每一行代码，敬畏每一份托付。

