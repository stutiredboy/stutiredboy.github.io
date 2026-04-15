Title: Debian系统添加全局根证书（CNNIC）
Date: 2013-09-08 12:25:00
Tags: debian
Slug: debian-add-cnnic-ca
Author: 老树
Summary: 鉴于CNNIC的证书默认被不信任，导致了应用在访问某些使用cnnic证书的ssl站点时，请求失败。本篇文章介绍了如何将CNNIC CA添加至Debian操作系统全局根证书。

鉴于CNNIC的证书默认被不信任，导致了应用在访问某些使用cnnic证书的ssl站点时，请求失败。

虽然我也不喜欢cnnic，但没办法，这是反抗不了的事情。

过程如下（需要root权限）：

> apt-get install ca-certificates #一般情况下应该是已经有安装的了

> mkdir -p /usr/share/ca-certificates/local #建立local目录是为了方便区分这是自己填加的证书，可以自定义，但一定要在/usr/share/ca-certificates目录下

> 将cnnic的证书复制至/usr/share/ca-certificates/local目录，请注意，证书的后缀必须修改为.crt

> dpkg-reconfigure ca-certificates #选中刚才添加的local/cnnic.crt证中，确定，即可
