Title: 配置Bind使用MySQL dlz模式
Date: 2013-09-09 16:18:00
Tags: bind
Slug: install-bind-mysql-dlz
Author: 老树

** 安装MySQL/Bind with dlz **

略过，bind dlz安装，只需在编译的时候增加 `--with-dlz-mysql` 选项即可。

** 创建 MySQL 数据库 **

根据自己的需求创建即可，如使用如下命令创建一个名为 `dns` 的数据库：

    CREATE DATABASE dns DEFAULT CHARSET UTF8;

使用 `use dns` 切换进 `dns` 数据库后，使用如下命令创建一张 `dns_records` 表：

    CREATE TABLE `dns_records` (
    `zone` varchar(255) NOT NULL,
    `host` varchar(255) NOT NULL,
    `type` varchar(12) NOT NULL,
    `data` varchar(255) NOT NULL,
    `ttl` int(11) DEFAULT '600',
    `id` int(11) NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (`id`),
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    
这里以域 `example.com` 为例，说明如上字段意义，假设我需要有一条 `www.example.com` 的记录指向 `1.1.1.1` 这个IP，应该增加哪些内容：

zone:
    
    域，这里指 example.com
    
host:

    主机名（名字），这里为 www
    
type:

    记录类型，这里为A
    
data:
    
    域名资源数据，这里为IP地址 1.1.1.1
    
ttl:

    域名TTL，为任意整数（建议不要低于120，即2分钟）
    
将该数据库授权给某用户（后续bind-dlz配置需要用到）：

    grant select on dns.* to dns@localhost identified by 'dns';
    
用户名为 `dns` ，密码也为 `dns` ，只允许本地主机 `localhost` 访问，并只给予了 `select` 权限。

** Bind-dlz配置 **

这里只涉及dlz的配置，其它named.conf的配置不涉及

    dlz "your custom description" {
        database "mysql
            {host=localhost dbname=dns user=dns pass=dns}
            {select zone from dns_records where zone = '$zone$'}
            {select ttl, type, data from dns_records where host = '$record$' and zone='$zone$'}";
    };
    
your custom description:

    管理员自行添加的描述
    
配置完成。
