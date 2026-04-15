Title: sshd无法使用secureFX传输文件
Date: 2013-09-24 15:58:00
Tags: sftp,secureFX,sshd
Slug: sshd-sftp-securefx

某同学表示，某些机器无法使用`secureFX`进行文件传输。

正常情况下：

    i RECV : AUTH_SUCCESS
    i RECV : Server Sftp Version: 3
    i SEND : RealPath(raw) .
    i Resolved RealPath: /home/demo
    i SEND : OpenDir /home/demo

    
而无法传输文件的服务器则是如下日志：

    i RECV : AUTH_SUCCESS
    i Changing state from STATE_CONNECTION to   STATE_TRANSPORT_STOPPING.
    i Changing state from STATE_TRANSPORT_STOPPING to STATE_CLOSING.
    i Changing state from STATE_CLOSING to STATE_CLOSED.

    
查看`/etc/ssh/sshd_config`配置，发现缺少`sftp`的相关配置，在该配置文件中增加：

    Subsystem   sftp    /usr/libexec/openssh/sftp-server
    
然后重启sshd服务，问题解决。
