Title: Linux系统上通知网关更新arp
Date: 2014-03-19 16:02:00
Tags: linux,arp
Slug: linux-arp-flush
Author: 老树

经常会有在线更换Linux服务器IP的操作，该操作带来的一个问题是: 我们已经执行了修改IP的操作，但由于网络上（网关）的ARP缓存暂未更新，导致在某一段时间内，该服务器会有网络不通的情况存在。

因此，我们需要在变更IP的同时，通知网关刷新ARP缓存。

首先清除本地ARP缓存:

    /bin/ip neigh flush dev eth0

其次向网关发送本机的ip/mac地址

    /usr/sbin/arping -v -c 2 -S 1.1.1.144 -s 00:17:a4:8d:0e:98 -p 1.1.1.1

1.1.1.144 为本机IP

00:17:a4:8d:0e:98 为本机MAC地址

1.1.1.1 为网关
