Title: Debian 指定内核启动
Date: 2022-05-07 12:59:00
Tags: debian,grub,kernel
Slug: debian-switch-kernel-boot
Author: 老树
Summary: 升级完内核发现有一些问题需要回退，但是因为不能直接接触机器终端，需要通过 grub 配置指定内核版本重新启动。</br><center>![](/static/debian-bullseye.png)</center>

升级完内核发现有一些问题需要回退，但是因为不能直接接触机器终端，需要通过 grub 配置指定内核版本重新启动。

操作系统：Debian 11

涉及文件：

1. /etc/default/grub
2. /boot/grub/grub.cfg

操作步骤：

1. 通过命令 `grep -e 'menuentry ' -e 'subm' /boot/grub/grub.cfg | awk -F'--' '{print $1}'` 找到需要启动的内核菜单名称：

    ![image-20220507113012323](/static/debian-grub-cfg.png)

    假设上图中的 `Debian GNU/Linux, with Linux 5.10.0-13-amd64` 是我们期望使用的内核，则需要引用图示 1 和 2 修改 `/etc/default/grub`。

2. 修改 `/etc/default/grub` 中的 `GRUB_DEFAULT=0` 为如下值：

    > GRUB_DEFAULT="Advanced options for Debian GNU/Linux>Debian GNU/Linux, with Linux 5.10.0-13-amd64"

3. 执行命令 `update-grub`，成功后重启即可。
