Title: 在 Mac 中对 iPhone 手机网络进行抓包的方法
Date: 2018-11-02 19:58:00
Tags: tcpdump,wireshark,ios,mac
Slug: capture-packet-from-ios-through-mac

1. 通过数据线连接 Mac 笔记本，并通过 itunes 查询手机的 UUID
![iphone uuid](/static/iphone_uuid.png)
2. Mac 提供了一个工具 rvictl （rvi=Remote Virtual Interface）可以为连上的 iphone 手机创建一个虚拟网络设备，不管手机用的是移动网络还是 WIFI，均可以通过该设备进行抓包。启动虚拟设备的命令如下：

    > rvictl -s ${uuid}

    如果成功启动，将返回：

    > Starting device xxxxxxxx [SUCCEEDED] with interface rvi0

    其中的 rvi0 即为可用于抓包的虚拟设备。

    如果操作失败，并返回 `bootstrap_look_up(): 1102` 错误，请通过如下命令启动服务，并重复 `rvictl -s ${uuid}` 的操作即可：

    > sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.rpmuxd.plist

3. 之后就可以通过 tcpdump 命令进行抓包了，如：

    > tcpdump -i rvi0 -s 0 -vvv dst host x.x.x.x -w test.pcap

4. 之后可以通过 wireshark 打开 test.pcap 进行查看。通常你可以使用 `brew cask install wireshark` 安装 wireshark.

#### 怎么通过 iTunes 往手机上安装 ipa 包？

旧版本的 iTunes，在设备信息里有个「应用」入口，并可以在这里安装 ipa 文件。这次顺便发现 iTunes 没有了这个入口，刚拿到 ipa 包时，有点不知道怎么办。原来，只要将将文件拖到 iTunes 对应的设备里，就会自动安装了。（拖到下面截图红色框框部份）

![iphone drop](/static/iphone_drop.png)
