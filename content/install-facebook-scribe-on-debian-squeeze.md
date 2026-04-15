Title: install Facebook scribe on Debian Squeeze
Date: 2013-09-08 13:03:00
Tags: debian, scribe
Slug: install-facebook-scribe-on-debian-squeeze
Author: 老树

系统: 

>Debian Squeeze 6.0 amd64

>thrift: 0.8.0

>hadoop: 0.20.2 cdh3 hadoop-0.20_0.20.2+923.142

>scribe: git current version

首先安装各种库，包括但不局限于:

>python-dev maven2 ant sun-java6-jre sun-java6-jdk bison flex gcc make autoconf libevent-dev libboost-all-dev git-core

之后:

>sudo update-alternatives --set java /usr/lib/jvm/java-6-sun/jre/bin/java #确保使用的不是openjdk

安装thrift:

>tar -zxvf thrift-0.8.0.tar.gz

>cd thrift-0.8.0

>./configure --prefix=/usr/local/thrift-0.8.0

>make

>sudo make install

安装fb303:

>cd thrift-0.8.0/contrib/fb303

>sh boostrap.sh

>./configure --prefix=/usr/local/fb303-0.8.0 --with-thriftpath=/usr/local/thrift-0.8.0 CPPFLAGS="-DHAVE_INTTYPES_H -DHAVE_NETINET_IN_H"

>make

>sudo make install

安装hadoop:

使用apache官方下载的版本编译各种不成功，其中一个错误（编译scribe时出现）:

>HdfsFile.cpp:255: error: ‘hdfsConnectNewInstance’ was not declared in this scope

ConnectNewInstance是在hadoop 0.21之后的版本才出现的，由于我这边hadoop的服务器是0.20.2，所以只能使用cloudarea版本

由于我在在编译时，cloudarea页面无法下载对应版本hadoop(或者跳转到apache页面)

只好使用如下方式进行下载，首先，修改/etc/apt/source.list，增加

>deb http://archive.cloudera.com/debian squeeze-cdh3u2 contrib

>deb-src http://archive.cloudera.com/debian squeeze-cdh3u2 contrib

然后使用apt-get source hadoop-0.20进行下载
 
>tar -zxvf hadoop-0.20.2.tar.gz

>mv hadoop-0.20.2 /usr/local

>cd /usr/local/hadoop-0.20.2

>sudo ant compile-c++-libhdfs -Dislibhdfs=true #由于cdh3/apache提供的hadoop包内的libhdfs库不一定能使用，重新编译c++的libhdfs库

安装scribe:

>git clone https://github.com/facebook/scribe.git

>cd scribe

>sh bootstrap.sh

>./configure --prefix=/usr/local/scribe-2.2 --with-fb303path=/usr/local/fb303-0.8.0 --with-thriftpath=/usr/local/thrift-0.8.0 --with-hadooppath=/usr/local/hadoop-0.20.2 --enable-hdfs CPPFLAGS="-DHAVE_NETDB_H=1 -fpermissive -DHAVE_INTTYPES_H -DHAVE_NETINET_IN_H -I/usr/local/hadoop-0.20.2/src/c++/libhdfs -I/usr/lib/jvm/java-6-sun-1.6.0.26/include -I/usr/lib/jvm/java-6-sun-1.6.0.26/include/linux" LDFLAGS="-L/usr/lib/jvm/java-6-sun-1.6.0.26/jre/lib/amd64 -L/usr/lib/jvm/java-6-sun-1.6.0.26/jre/lib/amd64/server -L/usr/local/hadoop-0.20.2/build/c++/Linux-amd64-64/lib"

>make

>sudo make install

其它配置:

由于我这里各软件包都是自定义安装路径，需要配置一下ld加载路径，编辑(增加) /etc/ld.so.conf.d/scribe.conf

>/usr/local/thrift-0.8.0/lib/

>/usr/local/hadoop-0.20.2/build/c++/Linux-amd64-64/lib/

>/usr/lib/jvm/java-6-sun-1.6.0.26/jre/lib/amd64/server/

保存退出后

>sudo ldconfig
