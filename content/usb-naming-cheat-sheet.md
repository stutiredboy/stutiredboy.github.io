Title: USB 命名混乱救命表：从 1.1 到 120Gbps
Date: 2026-04-26 12:00:00
Tags: usb, hardware, cheatsheet, thunderbolt
Slug: usb-naming-cheat-sheet
Author: 小生说大声讲
Summary: USB 标准命名乱到没朋友——同一个速率换了三个商标名，"SuperSpeed" 听起来比 "SuperSpeedPlus" 只慢一点点其实差两倍，USB 3.0/3.1/3.2 Gen 1 是同一个东西。在 Fabien Sanglard 的 USB Cheat Sheet 基础上补充了截至 2026.04 已经量产的 USB4 v2.0 / 80Gbps 部分，做成一张可以直接抄的对照表。

## 为什么需要这张表

USB 的命名乱到什么程度？看几个常踩的坑：

- **同一个速率，三个商标名**：USB 3.0、USB 3.1 Gen 1、USB 3.2 Gen 1 是**完全同一个东西**（5 Gbps）。你在淘宝看到三种叫法只是上架时机不同。
- **"SuperSpeed" 比 "SuperSpeedPlus" 慢一倍**：听起来就差一个 Plus，实际上一个 5 Gbps 一个 10 Gbps。
- **USB 3.2 Gen 2 和 USB 3.2 Gen 2x2 不是一回事**：后者是双 lane，速率翻倍到 20 Gbps。x2 这个后缀很多店铺不会写。
- **USB4 也不是只有一种**：有 USB4 20Gbps 和 USB4 40Gbps 两个档位，盒子上不写清楚就只能赌。
- **USB4 不等于 Thunderbolt 4，也不等于 USB-C**：USB-C 只是物理接口，Thunderbolt 是 Intel 的超集协议，USB4 是 USB-IF 的协议——三者经常被混着叫。

下面这张表就是用来在买线、选 dock、判断 NAS / 移动硬盘盒接口时**一眼对上号**的。

## 营销名 vs 技术名

<table style="width: 100%;">
    <tr>
        <th>营销名（Marketing Name）</th>
        <th>等价别名（Also Known As）</th>
        <th style="text-align:right;">信号速率</th>
        <th style="text-align:right;">理论带宽</th>
        <th style="text-align:right;">线芯</th>
        <th style="text-align:right;">线长上限</th>
    </tr>
    <tr>
        <td>USB 1.1</td>
        <td>Full Speed</td>
        <td style="text-align:right;">12 Mbps</td>
        <td style="text-align:right;">1.5 MiB/s</td>
        <td style="text-align:right;">4</td>
        <td style="text-align:right;">4 m</td>
    </tr>
    <tr>
        <td>USB 2.0</td>
        <td>Hi-Speed</td>
        <td style="text-align:right;">480 Mbps</td>
        <td style="text-align:right;">60 MiB/s</td>
        <td style="text-align:right;">4</td>
        <td style="text-align:right;">4 m</td>
    </tr>
    <tr>
        <td>SuperSpeed USB 5Gbps</td>
        <td>USB 3.0<br/>USB 3.1<br/>USB 3.2<br/>USB 3.1 Gen 1<br/>USB 3.2 Gen 1</td>
        <td style="text-align:right;">5 000 Mbps</td>
        <td style="text-align:right;">625 MiB/s</td>
        <td style="text-align:right;">8</td>
        <td style="text-align:right;">3 m</td>
    </tr>
    <tr>
        <td>SuperSpeedPlus USB 10Gbps</td>
        <td>USB 3.1<br/>USB 3.2<br/>USB 3.1 Gen 2<br/>USB 3.2 Gen 2</td>
        <td style="text-align:right;">10 000 Mbps</td>
        <td style="text-align:right;">1 250 MiB/s</td>
        <td style="text-align:right;">8</td>
        <td style="text-align:right;">2 m</td>
    </tr>
    <tr>
        <td>SuperSpeedPlus USB 20Gbps</td>
        <td>USB 3.2<br/>USB 3.2 Gen 2x2</td>
        <td style="text-align:right;">20 000 Mbps</td>
        <td style="text-align:right;">2 500 MiB/s</td>
        <td style="text-align:right;">12</td>
        <td style="text-align:right;">1 m</td>
    </tr>
    <tr>
        <td>USB4 20Gbps</td>
        <td>USB4 Gen 2×2<br/>USB4</td>
        <td style="text-align:right;">20 000 Mbps</td>
        <td style="text-align:right;">2 500 MiB/s</td>
        <td style="text-align:right;">12</td>
        <td style="text-align:right;">0.8 m</td>
    </tr>
    <tr>
        <td>USB4 40Gbps</td>
        <td>USB4 Gen 3×2<br/>USB4</td>
        <td style="text-align:right;">40 000 Mbps</td>
        <td style="text-align:right;">5 000 MiB/s</td>
        <td style="text-align:right;">12</td>
        <td style="text-align:right;">0.8 m</td>
    </tr>
    <tr style="background:#fff7d6;">
        <td><b>USB 80Gbps</b><br/><span style="font-size:0.9em;color:#666;">2026 补充</span></td>
        <td>USB4 v2.0<br/>USB4 Gen 4×2<br/>Thunderbolt 5（超集）</td>
        <td style="text-align:right;">80 000 Mbps</td>
        <td style="text-align:right;">10 000 MiB/s</td>
        <td style="text-align:right;">12</td>
        <td style="text-align:right;">1 m（被动）</td>
    </tr>
    <tr style="background:#fff7d6;">
        <td><b>USB 120Gbps</b><br/><span style="font-size:0.9em;color:#666;">2026 补充 / 非对称</span></td>
        <td>USB4 v2.0 Asymmetric<br/>Thunderbolt 5 Bandwidth Boost</td>
        <td style="text-align:right;">120/40 Gbps</td>
        <td style="text-align:right;">15 000 / 5 000 MiB/s</td>
        <td style="text-align:right;">12</td>
        <td style="text-align:right;">1 m（被动）</td>
    </tr>
</table>

> **看表姿势**：买线、买盒子的时候，先把店家写的字串去 "Also Known As" 这一列里搜，落到哪一行就是哪一行的速率。不要被 "SuperSpeed"、"USB 3.2"、"USB4" 这种笼统说法骗——它们对应着多个不同档位。

## Gen 命名约定：A x B 是什么意思

USB-IF 后来给 3.x 和 USB4 加的 `Gen A x B` 后缀，含义其实很规整：

<pre style="background:#f7f8fa;padding:1ch;border-radius:6px;">
USB Gen <span style="color:#0050d0;font-weight:bold;">A</span> x <span style="color:#c00;font-weight:bold;">B</span>

<span style="color:#0050d0;font-weight:bold;">A</span> = 第几代信号（决定每个 lane 的速率）
<span style="color:#c00;font-weight:bold;">B</span> = 用了几条 lane（双工对数）
</pre>

下面这张表把 3.2 / USB4 各代乘开后的实际速率算清楚：

<table style="width: 100%;">
    <tr>
        <th>名称</th>
        <th style="text-align:right;">单 lane 信号</th>
        <th style="text-align:right;">总信号速率<sup>a</sup></th>
        <th style="text-align:right;">编码</th>
        <th style="text-align:right;">去编码后<sup>b</sup></th>
        <th style="text-align:right;">理论带宽<sup>b</sup></th>
        <th style="text-align:right;">真实顺序读<sup>c</sup></th>
    </tr>
    <tr>
        <td>USB 3.2 Gen <span style="color:#0050d0;font-weight:bold;">1</span>x<span style="color:#c00;font-weight:bold;">1</span></td>
        <td style="text-align:right;">5 000 Mbps</td>
        <td style="text-align:right;">5 000 Mbps</td>
        <td style="text-align:right;">8b/10b</td>
        <td style="text-align:right;">4 000 Mbps</td>
        <td style="text-align:right;">500 MiB/s</td>
        <td style="text-align:right;">~400 MiB/s</td>
    </tr>
    <tr>
        <td>USB 3.2 Gen <span style="color:#0050d0;font-weight:bold;">1</span>x<span style="color:#c00;font-weight:bold;">2</span></td>
        <td style="text-align:right;">5 000 Mbps</td>
        <td style="text-align:right;">10 000 Mbps</td>
        <td style="text-align:right;">8b/10b</td>
        <td style="text-align:right;">8 000 Mbps</td>
        <td style="text-align:right;">1 000 MiB/s</td>
        <td style="text-align:right;">~800 MiB/s</td>
    </tr>
    <tr>
        <td>USB 3.2 Gen <span style="color:#0050d0;font-weight:bold;">2</span>x<span style="color:#c00;font-weight:bold;">1</span></td>
        <td style="text-align:right;">10 000 Mbps</td>
        <td style="text-align:right;">10 000 Mbps</td>
        <td style="text-align:right;">128b/132b</td>
        <td style="text-align:right;">9 696 Mbps</td>
        <td style="text-align:right;">1 212 MiB/s</td>
        <td style="text-align:right;">~780 MiB/s</td>
    </tr>
    <tr>
        <td>USB 3.2 Gen <span style="color:#0050d0;font-weight:bold;">2</span>x<span style="color:#c00;font-weight:bold;">2</span></td>
        <td style="text-align:right;">10 000 Mbps</td>
        <td style="text-align:right;">20 000 Mbps</td>
        <td style="text-align:right;">128b/132b</td>
        <td style="text-align:right;">19 392 Mbps</td>
        <td style="text-align:right;">2 424 MiB/s</td>
        <td style="text-align:right;">~1 600 MiB/s</td>
    </tr>
    <tr>
        <td>USB4 Gen <span style="color:#0050d0;font-weight:bold;">2</span>x<span style="color:#c00;font-weight:bold;">2</span></td>
        <td style="text-align:right;">10 000 Mbps</td>
        <td style="text-align:right;">20 000 Mbps</td>
        <td style="text-align:right;">128b/132b</td>
        <td style="text-align:right;">19 392 Mbps</td>
        <td style="text-align:right;">2 424 MiB/s</td>
        <td style="text-align:right;">~1 600 MiB/s</td>
    </tr>
    <tr>
        <td>USB4 Gen <span style="color:#0050d0;font-weight:bold;">3</span>x<span style="color:#c00;font-weight:bold;">2</span></td>
        <td style="text-align:right;">20 000 Mbps</td>
        <td style="text-align:right;">40 000 Mbps</td>
        <td style="text-align:right;">128b/132b</td>
        <td style="text-align:right;">38 787 Mbps</td>
        <td style="text-align:right;">4 848 MiB/s</td>
        <td style="text-align:right;">~2 700 MiB/s</td>
    </tr>
    <tr style="background:#fff7d6;">
        <td><b>USB4 Gen <span style="color:#0050d0;font-weight:bold;">4</span>x<span style="color:#c00;font-weight:bold;">2</span></b><br/><span style="font-size:0.9em;color:#666;">v2.0 / 2026 补充</span></td>
        <td style="text-align:right;">40 000 Mbps（PAM3）</td>
        <td style="text-align:right;">80 000 Mbps</td>
        <td style="text-align:right;">64b/66b</td>
        <td style="text-align:right;">77 575 Mbps</td>
        <td style="text-align:right;">9 696 MiB/s</td>
        <td style="text-align:right;">~6 000 MiB/s</td>
    </tr>
</table>

<p style="margin-top:1em;font-size:0.95em;">
<b>注</b>：多 lane 系统在发端做 lane striping，在收端做 lane bonding，用户看到的就是一个连续 stream。<br/>
<sup>a</sup> 厂商盒子上印的就是这一栏。<br/>
<sup>b</sup> 减掉编码开销后的有效速率。8b/10b 损失 20%，128b/132b 损失约 3%，64b/66b 损失约 3%。<br/>
<sup>c</sup> 实测顺序读速率（要扣掉协议层、文件系统、SSD 主控本身的瓶颈）。
</p>

理解了 `Gen A x B` 之后，再回头看商标名就清晰多了：所谓 "SuperSpeedPlus 20Gbps" 其实就是 Gen 2 信号 × 2 lane；所谓 "USB4 40Gbps" 其实就是 Gen 3 信号 × 2 lane。这套约定唯一的问题是 **USB-IF 自己又不在卖品名里写 Gen N×M**，反而强推 "USB 80Gbps" 这种以速率为名的新商标——表里第一栏就是这么来的。

## 线材：4 / 8 / 12 芯

USB 物理线最常见三档：

- **4 芯**：`PWR`、`GND`、`D+`、`D-`。一对差分信号，半双工一条 lane。
- **8 芯**：4 芯的基础上加 `RX+/RX-`、`TX+/TX-`。两条 lane，一上一下，全双工。
- **12 芯**：8 芯的基础上再加一组 `RX2+/RX2-`、`TX2+/TX2-`。四条 lane（两上两下），全双工。

> **一个 USB lane = 一对 ± 差分线**。所以 4 芯 = 1 个半双工 lane，8 芯 = 2 个 lane，12 芯 = 4 个 lane。USB 3.2 Gen 2x2、USB4、USB4 v2.0 这些 "x2" 的标准都是要 12 芯线才能跑满的。

## USB-A / USB-B 接口（4 芯 / 8 芯）

<table style="width:100%;">
    <tr>
        <th style="text-align:center;width:25%;">Type-A 4-wires</th>
        <th style="text-align:center;width:25%;">Type-A 8-wires</th>
        <th style="text-align:center;width:25%;">Type-B 4-wires</th>
        <th style="text-align:center;width:25%;">Type-B 8-wires</th>
    </tr>
    <tr>
        <td style="vertical-align:bottom;text-align:center;background:#fff;"><img loading="lazy" src="/static/usb-cheat-sheet/typea.svg" style="width:80%;height:auto;display:inline-block;margin:0 auto;"/></td>
        <td style="vertical-align:bottom;text-align:center;background:#fff;"><img loading="lazy" src="/static/usb-cheat-sheet/typea3.svg" style="width:80%;height:auto;display:inline-block;margin:0 auto;"/></td>
        <td style="vertical-align:bottom;text-align:center;background:#fff;"><img loading="lazy" src="/static/usb-cheat-sheet/typeb.svg" style="width:60%;height:auto;display:inline-block;margin:0 auto;"/></td>
        <td style="vertical-align:bottom;text-align:center;background:#fff;"><img loading="lazy" src="/static/usb-cheat-sheet/typeb3.svg" style="width:60%;height:auto;display:inline-block;margin:0 auto;"/></td>
    </tr>
</table>

8 芯版本的 Type-A 蓝色塑料舌片就是 USB 3.x 的标志——多出来的 5 个针脚塞在原来 4 个的下方/后方。USB-B 8 芯版本（也叫 USB 3.0 Type-B）则是直接在原本梯形上又叠了一块，所以看起来像一个驼背的小房子。

## USB-C 接口（12 芯）

只有 USB-C 有足够的引脚数支撑两个完整 lane。

<img loading="lazy" src="/static/usb-cheat-sheet/typec.svg" style="width:70%;height:auto;display:block;margin:1em auto;"/>

- **CC1 / CC2**：Configuration Channel。两端用来识别谁是 DFP（Downstream Facing Port，主机一侧）、谁是 UFP（Upstream Facing Port，设备一侧），同时也用来协商供电档位、切到 Alt Mode（DisplayPort、Thunderbolt、HDMI 等）。
- **SBU1 / SBU2**：Sideband Use。用作 DisplayPort 的 AUX 通道、热插拔检测（HPD）等辅助信号。

USB-C 真正强大的地方是这两组针脚——没有它们，USB 就是个纯数据口；有了它们，一根 C 线可以同时跑数据、视频、PD 供电，并且**正反盲插**。

## 充电规格 / PD 档位

<table style="width:100%;">
    <tr>
        <th style="text-align:center;">规范</th>
        <th style="text-align:center;">最大电压</th>
        <th style="text-align:center;">最大电流</th>
        <th style="text-align:center;">最大功率</th>
    </tr>
    <tr>
        <td style="text-align:center;">USB 2.0</td>
        <td style="text-align:center;">5 V</td>
        <td style="text-align:center;">500 mA</td>
        <td style="text-align:center;">2.5 W</td>
    </tr>
    <tr>
        <td style="text-align:center;">USB 3.0 / 3.1</td>
        <td style="text-align:center;">5 V</td>
        <td style="text-align:center;">900 mA</td>
        <td style="text-align:center;">4.5 W</td>
    </tr>
    <tr>
        <td style="text-align:center;">USB Battery Charging (BC) 1.2</td>
        <td style="text-align:center;">5 V</td>
        <td style="text-align:center;">1.5 A</td>
        <td style="text-align:center;">7.5 W</td>
    </tr>
    <tr>
        <td style="text-align:center;">USB-C Current Mode（非 PD）</td>
        <td style="text-align:center;">5 V</td>
        <td style="text-align:center;">3 A</td>
        <td style="text-align:center;">15 W</td>
    </tr>
    <tr>
        <td style="text-align:center;">USB-C / Power Delivery（PD 1/2）</td>
        <td style="text-align:center;">20 V</td>
        <td style="text-align:center;">5 A</td>
        <td style="text-align:center;">100 W</td>
    </tr>
    <tr>
        <td style="text-align:center;">USB-C PD 3.1 EPR（Extended Power Range）</td>
        <td style="text-align:center;">48 V</td>
        <td style="text-align:center;">5 A</td>
        <td style="text-align:center;">240 W</td>
    </tr>
</table>

要拉满 240 W，必须是支持 EPR 的线（线身上一般直接印 `EPR 240W`），并且两端 charger / 设备都支持 PD 3.1。普通 100 W 线直接插上去只会握手到 100 W 档位。

## 2026.04 补充：USB 80Gbps 已经量产

原文写于 2022 年，那会儿的天花板就是 USB4 40Gbps。**到 2026.04，新的 USB4 v2.0（USB-IF 现在统一叫 "USB 80Gbps"）已经过了 spec → silicon → 整机三道关，能在零售店里买到。**

技术上和老 USB4 的关键差别：

- **PAM3 信号**：每个 symbol 不再是 0/1 两态，而是 -1/0/+1 三态（每 symbol 携带 ~1.58 bit）。这是单 lane 速率从 20 Gbps 翻到 40 Gbps 的核心。
- **编码换成 64b/66b**：开销从 ~3% 略降。
- **对称模式 80 Gbps**：4 lane × 40 Gbps = 160 Gbit 信号，扣编码后约 ~9 700 MiB/s 理论值；实测顺序读目前在 6 GB/s 左右（被 NVMe 主控和 PCIe 拓扑限制住）。
- **非对称模式 120 / 40 Gbps**：3 lane 走一个方向、1 lane 走反方向。专门给 8K 显示、外置 GPU 这种"大头朝外"的场景。USB-IF 称这个档为 "USB 120Gbps"，Intel 在 Thunderbolt 5 里叫 "Bandwidth Boost"——同一回事。
- **接口仍然是 USB-C，引脚数还是 12**。线长上限稍微放宽到 1 m（被动铜线）；超过 1 m 一般要 active 线。

## 参考

- 原文：[Fabien Sanglard — USB Cheat Sheet](https://fabiensanglard.net/usbcheat/index.html)（2022-05）
- 规范文档（USB-IF 官方下载）：[USB Document Library](https://www.usb.org/documents)
  - USB 1.0（1996-01）/ USB 1.1（1998-09）/ USB 2.0（2000-04）
  - USB 3.0（2008-11）/ USB 3.1（2013-07）/ USB 3.2（2017-09）
  - USB4 v1.0（2019-08）/ **USB4 v2.0（2022-10）**
- USB Power Delivery 3.1 EPR：[USB-IF PD Spec](https://www.usb.org/document-library/usb-power-delivery)
- Thunderbolt 5 / Intel Barlow Ridge 控制器公开材料：[Intel Newsroom](https://www.intel.com/content/www/us/en/newsroom/news/thunderbolt-5-unveiled-next-generation-cable-pc-accessories.html)
