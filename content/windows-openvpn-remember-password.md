Title: Windows OpenVPN GUI记住用户名和密码
Date: 2013-09-08 12:51:00
Tags: windows, openvpn
Slug: windows-openvpn-remember-password
Author: 老树
Summary: 日常工作中经常使用VPN，由于Server端要求进行用户名和密码校验，在第一次链接的时候，OpenVPN Client会弹出输入用户名和密码的窗口。 如果网络比较稳定的情况下，这个还没什么问题，网络不稳定的时候，每次弹开，都会弹出重新验证的窗口，加上我自己的密码比较长，不胜其烦

日常工作中经常使用VPN，由于Server端要求进行用户名和密码校验，在第一次链接的时候，OpenVPN Client会弹出输入用户名和密码的窗口。

如果网络比较稳定的情况下，这个还没什么问题，网络不稳定的时候，每次弹开，都会弹出重新验证的窗口，加上我自己的密码比较长，不胜其烦

我使用的版本（2.3.1），实际上已经支持保存密码的功能（旧版本可能需要重新编译），在ovpn配置文件里增加:

>auth-user-pass pass.txt

之后在ovpn配置文件所在目录建立一个pass.txt的文件，第一行为用户名，第二行为密码即可。

PS：这样对自己电脑的安全性要有足够的保证，否则密码泄露就得不偿失了。
