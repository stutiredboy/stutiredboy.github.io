Title: 可能是全网最全的 ulimit 配置说明了
Date: 2022-06-14 13:07:00
Tags: linux, ulimit
Slug: linux-ulimit
Author: 老树
Summary: ulimit 设置不当经常会引起各种各样的问题，比如很经典的 `too many open files`，网上也有很多文章讲解 ulimit 设置，如 [initscrip](https://linux.die.net/man/5/initscript) 设置、PAM、systemd 的配置等等。


ulimit 设置不当经常会引起各种各样的问题，比如很经典的 `too many open files`，网上也有很多文章讲解 ulimit 设置，如 [initscrip](https://linux.die.net/man/5/initscript) 设置、PAM、systemd 的配置等等。

由于 systemd 已经成为主流，本文以 Debian 11 bullseye 为环境理清正确的 ulimit 设置应该覆盖哪些配置。通常情况下这些配置在绝大多数 Linux 发行版会是通用的，并不局限于 Debian。

## systemd

systemd 主要涉及 /etc/systemd/system.conf 和 /etc/systemd/user.conf 两个文件，需要配置的内容是以样的，以 ulimit 中 `open files` 和 `max user processes` 为例，我们需要配置如下两项：

```
[Manager]
DefaultLimitNOFILE=1048567
DefaultLimitNPROC=65535
```

配置生效需要重启。但是这两个配置文件有什么区别呢？通过 `man systemd-system.conf` 了解到当以系统实例运行时，引用的是 system.conf ，当以用户实例运行时，引用的是 user.conf。不过系统环境中运行的都是系统实例，如果有兴趣的朋友可以通过 `systemctl edit/enable/start --user` 等操作自己注册个 user 实例看看。可以通过 `cat /proc/${pid}/limits` 进行确认。

结论：为了确保 ulimit 在 system 环境中生效，建议同时修改/etc/systemd/system.conf 和 /etc/systemd/user.conf 两个文件中的相关配置，并确保配置一致。

## PAM limits

很多伙伴会发现，即使完全配置了 system 相关的文件并重启生效后，通过 ssh 远程登录服务器，`ulimit -n` 一看，还是 1024，这可是个忧伤的故事，怎么破呢？

请检查 `/etc/ssh/sshd_config` 配置文件，看看是否有这一行：

> UsePAM yes

如果有，请将 `yes` 改成 `no` 之后重启 sshd 服务，再次登录后，你应该能发现 systemd ulimit 相关配置已经生效了。

但系统中 PAM 可是在相当多的地方用到了，所以这里我们需要再次修改 pam limit 相关配置，以确保系统中 ulimit 相关的配置一致。需要修改的文件为：/etc/security/limits.conf，请在文件里增加如下内容：

```
*	soft	nofile	1048567
*	hard	nofile	1048567
*	soft	nproc	65535
*	hard	nproc	65535
```

修改上述文件后，需要再确认一下以下文件（可能还有更多，但以下这些文件建议确认）：

- /etc/pam.d/su
- /etc/pam.d/sshd
- /etc/pam.d/login
- /etc/pam.d/cron

包含以下这行内容：

> session    required     pam_limits.so

请注意，前方高能：细心的小伙伴可能会发现这时通过 `su -` 切换成 root 后，再看 ulimit，又是没有生效的，怎么回事呢？ `man limits.conf` 可以找到答案：

> NOTE: group and wildcard limits are not applied to the root user. To set a limit for the root user, this field must contain the literal username root.

上述 /etc/security/limits.conf 配置中的通配符 "*" 对 root 用户不生效，我们需要继续在 /etc/security/limits.conf 中增加如下配置：

```
root	soft	nofile	1048567
root	hard	nofile	1048567
root	soft	nproc	65535
root	hard	nproc	65535
```

保存后，应该安逸了~

结论：pam 的 limit 设置也会影响  ulimit 相关设置，需要通过配置确保和 systemd 相关内容一致。坑点：通配符 "*" 对 root 用户不生效。

## 结论

1. system 的 ulimit 相关设置需要同时调整 /etc/systemd/system.conf 和 /etc/systemd/user.conf；
2. 除了 system 的配置，pam 相关的配置也需要同步调整，主要涉及 /etc/security/limits.conf 和 /etc/pam.d/ 目录下的相关文件；
3. /etc/security/limits.conf 中的通配符 "*" 对 root 用户不生效，root 用户相关配置需要显式指定；
4. 除了系统级别的配置，用户也可以在 /etc/profile 和 bashrc 等相关配置里显式的修改 ulimit，当你发现上述 3 项配置都没有生效的时候，请检查用户侧的设定，看看是否自己另外指定了；
