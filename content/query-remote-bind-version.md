Title: 查询 dns server 使用的bind版本
Date: 2014-07-07 20:21:00
Tags: bind, dns, dig, named
Slug: query-remote-bind-version

其实命令很简单，但我发现我老记不住，所以做个记录吧（我总是把version.bind记成bind.version，orz）

     dig @${server} TXT CHAOS version.bind

${server}换成你想查询的dns服务器IP地址即可，如：

    dig @8.8.8.8 CHAOS TXT version.bind
    
其实通常情况下出于安全考虑，大多数我们是查询不到版本信息的（系统管理员禁用了）

bind 可以通过如下设置禁用版本号查询：

```
options {
    version none;
}
```

或者你可以将此值设置为某个固定字符串，如 "someone like you"
