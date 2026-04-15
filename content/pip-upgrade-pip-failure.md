Title: pip 升级 pip 失败
Date: 2016-05-19 12:11:00
Tags: python, pip
Slug: pip_upgrade_pip_failure
Author: 老树

今天在使用 python pip 安装一个 python 包的时候，一直提示：

```
# pip install --upgrade pip
Requirement already up-to-date: pip in /usr/local/lib/python2.7/dist-packages
You are using pip version 8.1.1, however version 8.1.2 is available.
You should consider upgrading via the 'pip install --upgrade pip' command.
```

尝试按说明执行 `pip install --upgrade pip` ，没有任何报错，但一直升级不成功，百思不得解，
在查看 `man pip` 的时候，找到如下选项：

```
-v, --verbose
    Give more output. Option is additive, and can be used up to 3 times.
```

尝试执行 `pip install --upgrade pip -vvv` 终于有更多提示：

```
1 location(s) to search for versions of pip:
* http://example.url/simple/pip/
Getting page http://example.url/simple/pip/
Starting new HTTP connection (1): example.url
"GET /simple/pip/ HTTP/1.1" 403 247
Could not fetch URL http://example.url/simple/pip/: 403 Client Error: Forbidden for url: http://example.url/simple/pip/ - skipping
Installed version (8.1.2) is most up-to-date (past versions: none)
Requirement already up-to-date: pip in /usr/local/lib/python2.7/dist-packages/pip-8.1.2-py2.7.egg
Cleaning up...
```

这时才发现，原来在我的 `~/.pip/pip.conf` 配置文件里，`index-url` 使用了一个已经废弃的地址，删除文件后重新升级，一切恢复正常。

这么重要的 debug 信息，pip 默认竟然不输出，继续百思不得其解。:-)
