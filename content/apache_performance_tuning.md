Title: 记一次 Apache 性能调优
Date: 2017-03-23 09:44:00
Tags: apache
Slug: apache-performance-tuning
Summary: 每一次神优化背后都有一个很烧饼的设置（bug），刷一次负载下降 70%+ 的小目标。</br><img src="/static/apache_load.png">

手上有一组 web 服务，使用 apache 对外提供服务，其中apache 使用 worker 模式，这堆 web 服务器有以下一堆毛病：

1. apache 长期占用大量 CPU，负载长期居高不下。
2. 每天 rotate log 的指令不能被 apache 处理，通过 lsof 可以看到被删除的日志文件没有正确关闭。

通过监控、日志统计，发现 qps 并不高，单台机器 qps 为600 左右（机器为 16 核、32G 内存），一开始以为是我代码性能问题，各种查找高消耗节点，无果。再次对服务器的整体情况及 apache 文档进行审视。

通过阅读 [apache 官方文档](https://httpd.apache.org/docs/2.2/mod/mpm_common.html) 在 worker 这里最重要的三个设置参数有 `ServerLimit * ThreadsPerChild >= MaxClients` ，但我们服务器上的配置远大于 qps（理论上，实际并发数会小于 qps）。尝试调小以上参数以接近 qps 数值，服务器负载没有发生明显变化。

再次观察系统负载（top）发现，apache 进程的 pid 一直在产生变化，产生了新的怀疑，是不是因为「频繁的销毁、创建 apache 进程」导致的开销过大，造成 cpu 负载居高不下？

再次阅读文档，其中两个会导致进程销毁的设置分别为：

1. MaxRequestsPerChild

```
The MaxRequestsPerChild directive sets the limit on the number of requests that an individual child server process will handle. After MaxRequestsPerChild requests, the child process will die. If MaxRequestsPerChild is 0, then the process will never expire.
```
这个值，我们的设置是 0，所以不会是因为这个设置导致的。

2. MaxSpareThreads

```
For worker, the default is MaxSpareThreads 250. These MPMs deal with idle threads on a server-wide basis. If there are too many idle threads in the server then child processes are killed until the number of idle threads is less than this number.
```

我们原来的值设置为 75，怀疑是因为这个值设得太小了，尝试将此值调整至与 `MaxClients` 相等，重启 apache ，发现负载开始持续下降，`top 中 apache 进程 pid 几乎没有产生变化`，服务正常，qps没有明显下降（未导致服务不可用）。新的配置如：

```
<IfModule mpm_worker_module>
    StartServers          2
    ServerLimit          12
    MinSpareThreads      25
    MaxSpareThreads     768
    ThreadLimit         128
    ThreadsPerChild      64
    MaxClients          768
    MaxRequestsPerChild   0
</IfModule>
```

至此问题解决，附优化前后的负载对比图：

优化前：

<img src="/static/apache_before_tuning.png">

优化后：

<img src="/static/apache_after_tuning.png">
