Title: Mac OSX iTerm2 终端UTF-8和GBK编码自由切换
Date: 2013-10-29 16:43:00
Tags: mac, osx, iterm2
Slug: mac_osx_iterm2_utf8_gbk_switch
Author: 老树

老树使用的是Mac OSX系统，平时终端都是使用iTerm2替代默认的Terminal进行使用。

考虑到各种兼容性，个人一直使用的是UTF-8编码，但由于老树管理着大量服务器，并且可能使用的是GBK或者其它编码，经常由于终端环境编码的不同，导致登录服务器出现乱码，或者需要处理GBK文件时，要使用iconv进行多次编码转换，相当麻烦。

好在iTerm2使用了比较友好的Profile配置及切换方式，首先我的默认配置（Default Profile）使用了UTF-8编码：

<img src="/static/iterm2_default_profile.png" />

我另外建立了一个Profile，叫GBK：

<img src="/static/iterm2_gbk_profile.png" />

并编写了一个非常简单的切换脚本：

```shell
#!/bin/bash
# 使用GBK Profile
echo -e "\033]50;SetProfile=GBK\a"
# 环境编码切换为GBK
export LANG=zh_CN.GBK
export LC_ALL=zh_CN.GBK
# 更改当前 iTerm2 tab title
echo -ne "\033]0;"$@"\007"
$@
echo -ne "\033]0;"${PWD/#$HOME/~}"\007"
# GBK任务完成后，自动切换回默认编码（UTF-8）
echo -e "\033]50;SetProfile=Default\a"
export LANG=zh_CN.UTF-8
export LC_ALL=zh_CN.UTF-8
```

将以上内容保存为一个叫grun的文件，并赋予可执行权限，同时加到系统可执行目录（PATH）

当我需要登录一台GBK编码的服务器时，只需要

    grun ssh ${hostname}

即可
