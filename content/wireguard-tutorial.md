Title: WireGuard 浅显体验
Date: 2022-05-15 17:07:00
Tags: wireguard, vpn
Slug: wireguard-tutorial
Author: 老树
Summary: WireGuard® 是一个极其简单、快速且现代的 VPN，它利用了最先进的加密技术。目的是提供一种更快、更易配置、更精简的通用 VPN。最初是为 Linux 开发（并且已经合并至 Linux Kernel），底层是 VPN，现在支持 Windows、macOS、BSD、iOS、Android 等跨平台。目前还处于活跃的开发当中，但仍不失为一个简易友好，且性能、安全性和兼容性都很棒的 VPN 解决方案。


WireGuard® 是一个极其简单、快速且现代的 VPN，它利用了最先进的加密技术。目的是提供一种更快、更易配置、更精简的通用 VPN。最初是为 Linux 开发（并且已经合并至 Linux Kernel, >5.6），底层是 VPN，现在支持 Windows、macOS、BSD、iOS、Android 等跨平台。目前还处于活跃的开发当中，但仍不失为一个简易友好，且性能、安全性和兼容性都很棒的 VPN 解决方案。

Linus Torvalds 给予 WireGuard 很高的评价（work of art）：

> Can I just once again state my love for it and hope it gets merged soon? Maybe the code isn't perfect, but I've skimmed it, and compared to the horrors that are OpenVPN and IPSec, it's a work of art.

## 安装篇

具体的安装可参考 [Installation](https://www.wireguard.com/install/)，笔者使用的操作系统为 Debian bullseye，官方源已经自带，仅需要 root 用户 `apt-get install wireguard` 一条命令搞定。

## 配置篇

安装过程比较简单，没有打脸官方所宣传的简单，具体也可以参考官方文档 [QuickStart](https://www.wireguard.com/quickstart/)。

### 场景一：Peer-To-Peer，两台服务器可互通

笔者这里有两台机器，其中服务器 A 为腾讯云的机器，系统内看到的地址为内网地址，在腾讯云配置了公网 eip。

服务器 B 为一台公网的机器，有直接的公网 IP。（这里留下了一个坑点）

#### 生成 WireGuard 公私钥

以下命令需要在服务 A 和 服务器 B 执行：

```shell
# 生成私钥
wg genkey > wg.private
# 生成公钥
wg pubkey < wg.private > wg.pubkey
```

#### 生成 WireGuard 配置

分别在两台机器上创建 `/etc/wireguard/wg0.conf` 文件。

服务器 A 腾讯云机器配置如下：

```toml
[Interface]
ListenPort = 57259 # UDP 端口，根据自己的需要设定即可
Address = 172.16.1.1/24 # WireGuard 网络设备 IP 地址，这里使用 172.16.1.1
PrivateKey = uJj+x/... # 在这台服务器上生成的 wg.private 文件内容

[Peer]
PublicKey = W72b9l... # 在服务器 B 生成的 wg.pubkey 文件内容
AllowedIPs = 172.16.1.2/32 # 服务器 B WireGuard 网络设备 IP 地址，也可以开放 /24 网段
Endpoint = 108.xx.xx.xx:34101 # 服务器 B 的公网 IP 地址及 ListenPort
```

服务器 B 公网机器配置如下：

```toml
[Interface]
ListenPort = 34101 # UDP 端口，根据自己的需要设定即可
Address = 172.16.1.2/24 # WireGuard 网络设备 IP 地址，这里使用 172.16.1.2
PrivateKey = kETG3... # 在这台服务器上生成的 wg.private 文件内容

[Peer]
PublicKey = hTfx29g... # 在服务器 A 生成的 wg.pubkey 文件内容
AllowedIPs = 172.16.1.0/24 # 参考服务器 A，这里开放 /24 网段
Endpoint = 118.xx.xx.xx:57259 # 服务器 A 的公网 IP 地址及 ListenPort
```

之后分别在两台机器上使用命令 `wg-quick up wg0` 后隧道就建议好了，可以通过 ping 来检查。

到这里还比较顺利，确实非常简单。笔者就转移注意力去开展其他的工作了，过了几分钟回来发现**网络断开**了，从服务器 A 腾讯云机器单向无法 ping 通 B 服务器，此时从 B 服务器 ping A 服务器后网络恢复（第一个问题）。

为什么呢？

怀疑是腾讯云服务器系统内只能看到内网 IP 的问题，毕竟这里是通过网关转发，在我之前其他的网络试验中已经多次踩中这个坑。继续往下翻 [QuickStart](https://www.wireguard.com/quickstart/) 找到答案：

>  if a peer behind NAT or a firewall wishes to receive incoming packets, he must keep the NAT/firewall mapping valid, by periodically sending keepalive packets. This is called *persistent keepalives*. 

解法也比较简单，在上面两台机器的 wg0.conf 配置文件中的 `[Peer]` 部份分别加上 keepalive 相关的配置即可（默认是 0，也就是不开启，这里我们设置为 25 秒）：

> PersistentKeepalive = 25

### 场景二：能不能内网穿透呢？

再找了一台纯内网的服务器 C，该服务器可以访问外网，但外部网络无法访问该服务器。且不清楚该服务器 C 的外网出口 IP 是什么。

#### 配置内网服务器

参考场景一的内容进行 WireGuard 安装和配置，假设服务器 C 的 WiredGuard 设备地址设置为 172.16.1.3，则配置如下：

```toml
[Interface]
Address = 172.16.1.3/24
PrivateKey = aHebd...

[Peer]
PublicKey = hTfx29g...
AllowedIPs = 172.16.1.0/24
Endpoint = 118.xx.xx.xx:57259
PersistentKeepalive = 25 # 处于 NAT 环境的设备需要加上 keepalive 配置
```

**主要差异：** `ListenPort` 的配置取消了，因为这台机器纯内网，我们无法判定最终映射的公网 IP 和端口分别是什么。上述配置保存后，通过 `wg-quick up wg0` 启动设备即可。

在服务器 A 腾讯云的机器上 `/etc/wireguard/wg0.conf` 增加该服务器 C 的 peer 配置：

```toml
[Peer]
PublicKey = hESH+Md6... # 服务器 C 的 wg.pubkey 内容
AllowedIPs = 172.16.1.0/24
PersistentKeepalive = 25
```

**主要差异：** `Endpoint` 配置取消了，毕竟 A 不知道 C 用的会是哪个公网 IP 和端口。保存配置后，分别执行 `wg-quick down wg0` 和 `wg-quick up wg0` 即可。

本以为到这里已经完成配置了，结果第二个问题来了。两台服务器 ping 不通。再次检查配置确认无误，陷入深深的思考~

**解决办法**：网络不决问防火墙。想到这里因为服务器 C 是在内网，WireGuard 能互通的前提肯定是服务器 C 要先访问服务器 A 的 ListenPort，检查防火墙配置，服务器 A 的 57259 UDP 端口没有对外开放。通过以下命令开放 57259 端口访问：

> iptables -I INPUT 1 -p udp -m udp --dport 57259 -j ACCEPT

端口开放后，两台机器之间的互联果然正常了。

## 一些结论

1. 如果 wg 两端设备都有公网地址可达，分别配置 Address 和 ListenPort 后，两台机器隧道可以互通，通常无需特殊配置；
2. 如果设备位于防火墙或网关后面，需要打开 keepalive 配置；
3. 内网穿透时，做为网关的机器（公网那台）需要开放 ListenPort 的防火墙访问；
4. 根据需要，你可能需要打开设备的数据包转发（net.ipv4.ip_forward = 1）和网络地址转换功能（NAT/MASQUERADE），这里不展开；
