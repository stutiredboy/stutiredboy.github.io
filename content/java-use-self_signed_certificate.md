Title: Java 使用自签证书访问https站点
Date: 2013-12-26 10:18:00
Tags: java, ssl
Slug: java-use-self_signed_certificate

最近被 Java 使用自签证书访问 https 的问题折腾得体无完肤，做为一名 Java 小白，
我也忍不住想感慨一下，不同 Java 程序员的水平差别真的好大，有些根本无法沟通，
都不知道他们怎么胜任日常的编码工作的=,=
同时做为一个 Java 黑，我觉得，好吧，更黑了。。

anyway，经过各种折腾，至少总结出了以下两种使用自签证书访问 https 站点的办法。

### 方法一

拿到相应的 https 站点证书后（好吧，我这里是cnnic.crt，顺便吐槽一下万恶的 cnnic 证书，各种不信任）：

    keytool -import -alias ${alias} -keystore ${JAVA_HOME}/jre/lib/security/cacerts -file ${path-to-certificate-file}

其中

    ${alias} 请替换为你想使用的名称，比如我这里是 CNNIC
    ${JAVA_HOME} 请替换为你自己的 JAVA_HOME 目录，比如我这里是 /usr/lib/jvm/java-6-openjdk
    ${path-to-certificate-file} 请替换为你的ca证书路径，比如我这里就是当前目录的 cnnic.crt

那么，我需要完整执行的命令就是：

    keytool -import -alias CNNIC -keystore /usr/lib/jvm/java-6-openjdk/jre/lib/security/cacerts -file cnnic.crt

如果 keytool 要求你输入密码，在你没有变更过的情况下，该值默认为英文 `changeit` 。

### 方法二

有些同学表示，他们的服务器不允许导入证书，或者他们是一个很大的集群，不适合每台都导入，那怎么办呢？
方法就是在每次访问的时候，程序自己加载相应的证书，但是在加载证书之前，你还是需要使用 keytool 工具将原ca转换成
Java 可以读取的证书格式，命令同方法一，只是 keystore 的位置你可以放在你的程序可以读取的任一路径，如我这里：

    keytool -import -alias CNNIC -keystore java.cnnic.cacert -file cnnic.crt

之后在你的 Java 程序里，使用 keystore 加载该证书，并附加该证书创建 https 请求即可。

从 Java 官方 docs 和 网上拼凑了小样例一枚，请君参照并自行完善：

```java
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.KeyStore;


import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;

public class LoadCert {
    public static void main(String[] args) throws Exception {

        X509TrustManager sunJSSEX509TrustManager;
        // 加载 Keytool 生成的证书文件
        char[] passphrase;
        String p = "changeit";
        passphrase = p.toCharArray();
        File file = new File("java.cnnic.cacert");
        System.out.println("Loading KeyStore " + file + "...");
        InputStream in = new FileInputStream(file);
        KeyStore ks = KeyStore.getInstance(KeyStore.getDefaultType());
        ks.load(in, passphrase);
        in.close();
        // 构造 javax.net.ssl.TrustManager 对象
        TrustManagerFactory tmf =
        TrustManagerFactory.getInstance("SunX509", "SunJSSE");
        tmf.init(ks);
        TrustManager tms [] = tmf.getTrustManagers();
        // 使用构造好的 TrustManager 访问相应的 https 站点
        SSLContext sslContext = SSLContext.getInstance("SSL", "SunJSSE");
        sslContext.init(null, tms, new java.security.SecureRandom());
        SSLSocketFactory ssf = sslContext.getSocketFactory();
        URL myURL = new URL("https://replace.to.your.site.real.url/");
        HttpsURLConnection httpsConn = (HttpsURLConnection) myURL.openConnection();
        httpsConn.setSSLSocketFactory(ssf);
        InputStreamReader insr = new InputStreamReader(httpsConn.getInputStream());
        int respInt = insr.read();
        while (respInt != -1) {
            System.out.print((char) respInt);
            respInt = insr.read();
        }
    }
}
```
