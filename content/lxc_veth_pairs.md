Title: LXC 如何找出容器对应的 veth 设备
Date: 2017-03-29 11:42:00
Tags: lxc
Slug: lxc-veth-pairs
Summary: LXC 使用 veth 模式时，如果宿主机上创建了很多容器，那么宿主上将存在大量的 vethXXXX 设备，肉眼难以直接确认每个虚拟容器使用的是哪个 veth 设备。

LXC 使用 veth 模式时，如果宿主机上创建了很多容器，那么宿主上将存在大量的 vethXXXX 设备，肉眼难以直接确认每个虚拟容器使用的是哪个 veth 设备。

在我的记忆中，方法比较复杂，且之前忘了记录下来，已经遗忘。今天重新尝试使用另一方法获取匹配信息，这里做下记录：

1. 虚拟机（容器）执行 `ethtool -S eth0` 拿到如 `peer_ifindex: 16`，其中 `eth0` 为在虚拟机（容器）内对应的设备名称；
2. 宿主机执行：`ip link show | grep '^16:'`，其中 `16` 为第一步拿到的 `peer_ifindex`，通过该命令拿到的 vethXXXX 即为虚拟机（容器）使用的设备。
