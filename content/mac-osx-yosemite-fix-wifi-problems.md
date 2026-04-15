Title: Mac OSX Yosemite 10.10 WIFI 掉线修复
Date: 2014-11-17 14:35:00
Tags: mac, osx, yosemite, wifi
Slug: mac_osx_yosemite_fix_wifi_problems
Author: 老树

原先用的是 Mac Air 11，通过Time Machine迁移至 Mac Retina 13，最后升级成
Yosemite 10.10 的，系统已经用了一段时间的，最近才忽然出出WIFI掉线的问题。

而且此掉线比较奇怪，WIFI Connection正常，TCP/UDP/ICMP包均不正常，
并且我试过在ping/safari/ssh等均异常的情况下，我某正在下载内容的应用（genymotion），
却坚持到了最后，并成功下载完了近200M的内容，所以基本排除了无线路由的问题。

重启电脑无效，网上搜到这么一编文章：[别忙升级，苹果 Yosemite 频现 WiFi 断线综合症](http://www.oschina.net/news/56361/os-x-yosemite-wifi-fault)

虽然前面两种方法无效，但第三种方法还是给了我启示的，凭直接猜测应该是：

    /Library/Preferences/SystemConfiguration

这个目录，进行这个目录，果然看到一堆与wifi关键字的文件：

```
$ ls
NetworkInterfaces.plist             com.apple.smb.server.plist
com.apple.airport.preferences.plist com.apple.wifi.message-tracer.plist
com.apple.captive.probe.plist       preferences.plist
```

把这些文件删掉（我是先备份了一下的，建议你也这样做），重启Mac。
注意本次重启，是不会自动连上之前使用的wifi的，需要自己去点击连接一下，然后问题就解决了。

后来在网上看到 [Fix Wi-Fi Problems in OS X Yosemite](http://osxdaily.com/2014/10/25/fix-wi-fi-problems-os-x-yosemite/)
这编文章，其实只要删除：

```
com.apple.airport.preferences.plist
com.apple.network.identification.plist
com.apple.wifi.message-tracer.plist 
NetworkInterfaces.plist 
preferences.plist
```

这些文件就可以了，解释也很到位，比oschina那个靠谱多了。:-)

```
2014-11-18 昨天折腾完，今天收到Apple Store的更新提醒，10.10.1 fix了wifi这个问题了
```
