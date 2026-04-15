Title: ssh client 通过 socks5 proxy 登录远程服务器
Date: 2013-12-20 12:20:00
Tags: ssh, proxy
Slug: ssh-through-socks-proxy

今天某同学需要登录某国家服务器（A），但从我朝过去网络延时非常大
发现从岛国过去的速度相当快，但因为岛国的服务器（B）不适合加该同学的帐号
因此做了一个 socks5 proxy ，然后本地 ssh client 通过该 proxy 登录A服务器

    ssh -o ProxyCommand='nc -x ${proxy_server}:${proxy_server_port} %h %p' xxx.xxx.xxx.xxx

如：

    ssh -o ProxyCommand='nc -x 127.0.0.1:7070 %h %p' 8.8.8.8
    
需要注意的是，nc需要使用 OpenBSD 版本，非 Linux 默认版本（该版本不支持）
通常，类 Debian 的衍生版本，都可以通过如下命令直接安装：

    apt-get install netcat-openbsd

非OpenBSD 可能报如下错误：

    /bin/nc: invalid option -- 'x'
