Title: 记一次 TiDB 时区设置异常问题排查
Date: 2019-10-12 22:27:00
Tags: dm,mysql,tidb,pingcap
Slug: tidb-time_zone-settings
Summary: 两个配置一模一样的 TiDB 集群，在执行 `SELECT NOW();` 操作的时候出现了不一样的结果，A 集群的时间与系统时间一致，B 集群的时间比系统时间少了 8 小时。OS、TiDB 配置是统一管理的，究竟是什么原因导致的呢？


收到同事的反馈，两个配置一模一样的 TiDB 集群，在执行 `SELECT NOW();` 操作的时候出现了不一样的结果，A 集群的时间与系统时间一致，B 集群的时间比系统时间少了 8 小时。

![请在这里输入图片描述](/static/20191012150952.png)

由于我们的 OS、TiDB 配置是统一管理的，所以我并不怀疑是因为两个集群当前配置不一样导致的。第一反应肯定是因为在 TiDB 启动之前用了错误的时区（UTC），然后 TiDB 引用了错误的时区导致的这个时间问题。根据常规经验，重启一下 TiDB 进程问题应该能解决。

然而这一次失望了，重启 TiDB 之后，并没有发生什么变化。跟同事要了服务器信息，直接登录到机器上看一下吧。以下是整体的排查过程。

### 先确认是不是，再查为什么

首先还是确认是不是有这个问题（再研究为什么），根据[官方文档](https://pingcap.com/docs-cn/v3.0/how-to/configure/time-zone/#%E6%97%B6%E5%8C%BA%E6%94%AF%E6%8C%81)，检查了 `time_zone` 信息，并没有发现异常，有问题的集群和没问题的集群配置也是完全一样的。

```
mysql> SELECT @@global.time_zone, @@session.time_zone;
+--------------------+---------------------+
| @@global.time_zone | @@session.time_zone |
+--------------------+---------------------+
| SYSTEM             | SYSTEM              |
+--------------------+---------------------+
1 row in set (0.01 sec)

mysql> SHOW GLOBAL VARIABLES LIKE '%time_zone';
+------------------+--------+
| Variable_name    | Value  |
+------------------+--------+
| system_time_zone | CST    |
| time_zone        | SYSTEM |
+------------------+--------+
2 rows in set (0.00 sec)

mysql>
```
虽然这里没有发现明显问题，但我们还是发现了一个疑点：我们的服务器，不可能会有 `CST` 这个时区设置（我们用的是 HKT），但 `CST` 这个很明显不是问题的原因。

### 日志是一定要看的

几乎可以这么说，日志就是为了排查问题而诞生的，任何不能马上判断的问题，都应该去翻一下日志，对服务的健康情况进行判断。因为是时区相关的问题，所以直接对 TiDB 的日志做了一个 `fgrep -i timezone tidb.log` 的操作，没想到真的发现了错误日志，毫无波折，就是这么惊喜。（TiDB 日志打印出来是完整一行的，以下内容我稍微格式化了一下，转化为真正的换行）：

```
[019/10/09 16:21:42.111 +08:00] [ERROR] [time.go:81] ["locate timezone files failed"] [] [stack="github.com/pingcap/tidb/util/timeutil.InferSystemTZ
/home/jenkins/workspace/release_tidb_3.0/go/src/github.com/pingcap/tidb/util/timeutil/time.go:81
github.com/pingcap/tidb/session.writeSystemTZ
/home/jenkins/workspace/release_tidb_3.0/go/src/github.com/pingcap/tidb/session/bootstrap.go:786
github.com/pingcap/tidb/session.doDMLWorks
/home/jenkins/workspace/release_tidb_3.0/go/src/github.com/pingcap/tidb/session/bootstrap.go:935
github.com/pingcap/tidb/session.bootstrap
/home/jenkins/workspace/release_tidb_3.0/go/src/github.com/pingcap/tidb/session/bootstrap.go:290
github.com/pingcap/tidb/session.runInBootstrapSession
/home/jenkins/workspace/release_tidb_3.0/go/src/github.com/pingcap/tidb/session/session.go:1541
github.com/pingcap/tidb/session.BootstrapSession
/home/jenkins/workspace/release_tidb_3.0/go/src/github.com/pingcap/tidb/session/session.go:1460
main.createStoreAndDomain
/home/jenkins/workspace/release_tidb_3.0/go/src/github.com/pingcap/tidb/tidb-server/main.go:205
main.main
/home/jenkins/workspace/release_tidb_3.0/go/src/github.com/pingcap/tidb/tidb-server/main.go:171
runtime.main
/usr/local/go/src/runtime/proc.go:200"]
```
几乎可以直接肯定是因为这个报错导致的问题了，但还是需要靠撸代码来证明一下的。

### 撸代码

根据上述的错误日志，可以知道最终实际执行出错的函数在 `util/timeutil/time.go` 的 `InferSystemTZ` 函数里，我们来看下这个函数做了什么：

```go
// InferSystemTZ reads system timezone from `TZ`, the path of the soft link of `/etc/localtime`. If both of them are failed, system timezone will be set to `UTC`.
// It is exported because we need to use it during bootstap stage. And it should be only used at that stage.
func InferSystemTZ() string {
  // consult $TZ to find the time zone to use.
  // no $TZ means use the system default /etc/localtime.
  // $TZ="" means use UTC.
  // $TZ="foo" means use /usr/share/zoneinfo/foo.
  tz, ok := syscall.Getenv("TZ")
  switch {
  case !ok:
    path, err1 := filepath.EvalSymlinks("/etc/localtime")
    if err1 == nil {
      name, err2 := inferTZNameFromFileName(path)
      if err2 == nil {
        return name
      }
      logutil.Logger(context.Background()).Error("infer timezone failed", zap.Error(err2))
    }
    logutil.Logger(context.Background()).Error("locate timezone files failed", zap.Error(err1))
  case tz != "" && tz != "UTC":
    for _, source := range zoneSources {
      if _, err := os.Stat(source + tz); err == nil {
        return tz
      }
    }
  }
  return "UTC"
}
```
可以看到，TiDB 设置时区的逻辑是首先获取操作系统的 TZ 变量，再从 `/etc/localtime` 的实际软链地址提取，最后 fallback 为 UTC。这个逻辑还是与[官方文档](https://pingcap.com/docs-cn/v3.0/how-to/configure/time-zone/#%E6%97%B6%E5%8C%BA%E6%94%AF%E6%8C%81)的描述一致的。但是我们的机器上肯定是有 `/etc/localtime` 文件的，文件肯定也是正确的，为什么会失败呢？再来看一下上述代码里最终分析  `/etc/localtime` 的函数 `inferTZNameFromFileName` 都做了什么？

```go
// inferTZNameFromFileName gets IANA timezone name from zoneinfo path.
// TODO: It will be refined later. This is just a quick fix.
func inferTZNameFromFileName(path string) (string, error) {
  // phase1 only support read /etc/localtime which is a softlink to zoneinfo file
  substr := "zoneinfo"
  // macOs MoJave changes the sofe link of /etc/localtime from
  // "/var/db/timezone/tz/2018e.1.0/zoneinfo/Asia/Shanghai"
  // to "/usr/share/zoneinfo.default/Asia/Shanghai"
  substrMojave := "zoneinfo.default"

  if idx := strings.Index(path, substrMojave); idx != -1 {
    return string(path[idx+len(substrMojave)+1:]), nil
  }

  if idx := strings.Index(path, substr); idx != -1 {
    return string(path[idx+len(substr)+1:]), nil
  }
  return "", fmt.Errorf("path %s is not supported", path)
}
```
代码的注释里明确写了**只支持 /etc/localtime 为软链接**，代码的逻辑也是通过截取 `/etc/localtime` 软链指向的具体文件路径来获得时区信息。看一下我们服务器上的这个文件：

```
$ ls -alh /etc/localtime
-rw-r--r-- 1 root root 1.2K 10月 12 10:11 /etc/localtime
```
果然是一个文件而不是一个软链接。这下又带来了两个疑问：

1. 如果我改成软链再重启 TiDB 能不能解决问题呢？实践证明，不能解决。这里不再赘述。
2. 函数逻辑很明确是 fallback 了 UTC，根据 `SELECT NOW();` 早了 8 小时也可以确认是 UTC，可为什么 `system_time_zone` 是 CST 呢？

#### 看到的（CST）和实际的（UTC）不一样？

TiDB 在拿不到正确的时区，回落至 UTC 时，最终 UTC 是怎么设置的呢？我们再来看一下上面的错误日志：

```
github.com/pingcap/tidb/session.writeSystemTZ
/home/jenkins/workspace/release_tidb_3.0/go/src/github.com/pingcap/tidb/session/bootstrap.go:786
```
在 `session/bootstrap.go` 我们找到：

```go
// writeSystemTZ writes system timezone info into mysql.tidb
func writeSystemTZ(s Session) {
  sql := fmt.Sprintf(`INSERT HIGH_PRIORITY INTO %s.%s VALUES ("%s", "%s", "TiDB Global System Timezone.") ON DUPLICATE KEY UPDATE VARIABLE_VALUE="%s"`,
    mysql.SystemDB, mysql.TiDBTable, tidbSystemTZ, timeutil.InferSystemTZ(), timeutil.InferSystemTZ())
  mustExecute(s, sql)
}
```
TiDB 首次启动时，拿到时区信息后，将时区信息写到了 mysql.SystemDB.mysql.TiDBTable，也就是 mysql.tidb，其中 `VARIABLE_NAME` 为 `tidbSystemTZ`，也即 `system_tz`

```go
  // The variable name in mysql.tidb table and it will be used when we want to know
  // system timezone.
  tidbSystemTZ = "system_tz"
```
继续直接登录机器看一下这张参数的内容在两个集群中有什么不一样： 

![请在这里输入图片描述](/static/20191012164104.png)
  
 可以看到，确实是设置了 UTC，那么也可以非常明确是由于这个值引起的了。经过测试，可以通过如下两种方式解决：

1. 更新 mysql.tidb 中 system_tz 为正确的时区，如我们这里为 HKT，并重启 tidb-server 进程后，问题可以得到解决。
2. 根据[官方文档](https://pingcap.com/docs-cn/v3.0/how-to/configure/time-zone/#%E6%97%B6%E5%8C%BA%E6%94%AF%E6%8C%81)设置 `time_zone` 变量，问题可以得到解决。如果有需要，可以把 `system_tz` 也修改了，tidb-server 不会自行进行调整：

    ![请在这里输入图片描述](/static/20191012165413.png)

### 为什么

到这里，我们可以很明确 TiDB 参数这里导致时间不对的情况了。但是还有几个疑问还没有得到解决：

1. 为什么同样的配置，有一个集群是正常的，一个集群又用了 UTC 呢？

    这个情况主要是因为我们的机器有一个初始化的过程，在没有完成初始化的时候，`/etc/localtime` 确实是一个软链接，并且指向了 `/usr/share/zoneinfo/Asia/Hong_Kong`，当我们的 tidb-server 进程在这个文件被修改之前启动时，会使用正确的时区。但同时，我们在机器上部署了 puppet 进行统一的配置管理，puppet 会做一个类似 `cp /usr/share/zoneinfo/Asia/Hong_Kong /etc/localtime` 的操作，将 `/etc/localtime` 替换为一个文件，这个时候，tidb-server 无法正确分析时区信息，导致 fall back 至 UTC。简单示意如下：
    ![请在这里输入图片描述](/static/20191012172800.png)

2. 为什么 `SELECT @@global.time_zone, @@session.time_zone;` 看到的是 CST，但不管是我们的机器还是 TiDB 配置文件都没有引用 CST 这个时区，CST 从哪里来的？

    属于 tidb-server 的默认行为，tidb-server 初次启动时，会默认设置为 CST。可以参考 `session/bootstrap.go` 和 `sessionctx/variable/sysvar.go` 这里不再展开。
    
3. `system_tz`、`@@global.time_zone`、`@@sessio.time_zone` 的关系是什么？`system_tz` 和 `time_zone` 两者的生效逻辑是怎样的？

    * `@@session.time_zone` 在新建连接时，值主要依赖于 `@@global.time_zone`，session 值等同于 global，默认都为 SYSTEM，即 `system_tz` 值；
    * 如果单独修改了 `@@session.time_zone` ，则当前连接的 time_zone 以 session 设置为准；
    * tidb-server 在每次启动的时候会从 mysql.tidb 加载 `system_tz` 值，并设置系统时区。这也是为什么我们在更新了 `system_tz ` 并重启 tidb-server 后，可以获取到正确时间的原因；

    tidb-server 启动时通过 mysql.tidb 设置系统时区的相关代码可以在 `session/session.go` 找到：
    
```go
// loadSystemTZ loads systemTZ from mysql.tidb
func loadSystemTZ(se *session) (string, error) {
  sql := `select variable_value from mysql.tidb where variable_name = 'system_tz'`
  rss, errLoad := se.Execute(context.Background(), sql)
  if errLoad != nil {
    return "", errLoad
  }
  // the record of mysql.tidb under where condition: variable_name = "system_tz" should shall only be one.
  defer func() {
    if err := rss[0].Close(); err != nil {
      logutil.Logger(context.Background()).Error("close result set error", zap.Error(err))
    }
  }()
  req := rss[0].NewChunk()
  if err := rss[0].Next(context.Background(), req); err != nil {
    return "", err
  }
  return req.GetRow(0).GetString(0), nil
}
  
// BootstrapSession runs the first time when the TiDB server start.
func BootstrapSession(store kv.Storage) (*domain.Domain, error) {
```
    

### 小结

1. 其实还蛮普通的一个问题，只是之前碰到比较多的情况是在环境初始化没完成时就启动服务，导致服务出现状况。这次 TiDB 这里刚好反过来，环境初始化未操作之前反而是正常的，初始化之后异常了；
2. 问题的线索其实完完整整的保存在了日志中，流程是否有可以优化的空间有待考证商榷，但日志在排查问题的时候是一定要首先关注的；
3. `/etc/localtime` 直接使用文件不是一个合理的方式，TZ 环境变量的优先级也高于 `/etc/localtime`。这个可以参考 [man 文档](http://man7.org/linux/man-pages/man5/localtime.5.html)：
    
    ```
    Because the timezone identifier is extracted from the symlink target 
    name of /etc/localtime, this file may not be a normal file or
    hardlink.
    ```
    
