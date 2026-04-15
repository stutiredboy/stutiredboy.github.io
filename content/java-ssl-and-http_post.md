Title: Java 发起Http Post请求
Date: 2014-02-19 17:16:00
Tags: java, ssl, http, post
Slug: java-ssl-and-http_post

对于一个 Java 小白，每完成一个新的功能，都表示相当不易，就连 Apache HttpClient 偶都表示没搞明白，
看起来好像不同版本还有不同的方法，没办法，还是借助于 Google，拼凑出了这一段代码，记录以备自己后用。

功能：使用 http post 方式访问某使用了 CNNIC 证书的站点（cnnic，唉，好多不信任）

```java
/*
 * Java POST Example
 */

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.ProtocolException;
import java.net.URL;
import java.net.URLEncoder;
import java.io.DataOutputStream;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.logging.Level;
import java.util.logging.Logger;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.security.KeyStore;


import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;

/**
 *
 * @author Greg （原链接：http://sigterm.sh/2009/10/simple-post-in-java/）
 */
public class SimpleHttpPost {

    /**
     * Pretend you're a script...
     */
    public static void main(String[] args) throws Exception {
        URL url = null;

        /* 加载CNNIC证书开始 */

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

        /* 加载CNNIC证书结束 */
        try {
            url = new URL("https://demo.site.url/uri/");
        } catch (MalformedURLException ex) {
            Logger.getLogger(SimpleHttpPost.class.getName()).log(Level.SEVERE, null, ex);
        }

        HttpsURLConnection urlConn = null;
        try {
            // URL connection channel.
            urlConn = (HttpsURLConnection) url.openConnection();
        } catch (IOException ex) {
            Logger.getLogger(SimpleHttpPost.class.getName()).log(Level.SEVERE, null, ex);
        }

        // Let the conn use SSL
        urlConn.setSSLSocketFactory(ssf);
        // Let the run-time system (RTS) know that we want input.
        urlConn.setDoInput (true);

        // Let the RTS know that we want to do output.
        urlConn.setDoOutput (true);

        // No caching, we want the real thing.
        urlConn.setUseCaches (false);

        try {
            urlConn.setRequestMethod("POST");
        } catch (ProtocolException ex) {
            Logger.getLogger(SimpleHttpPost.class.getName()).log(Level.SEVERE, null, ex);
        }

        try {
            urlConn.connect();
        } catch (IOException ex) {
            Logger.getLogger(SimpleHttpPost.class.getName()).log(Level.SEVERE, null, ex);
        }

        DataOutputStream output = null;
        BufferedReader input = null;

        try {
            output = new DataOutputStream(urlConn.getOutputStream());
        } catch (IOException ex) {
            Logger.getLogger(SimpleHttpPost.class.getName()).log(Level.SEVERE, null, ex);
        }

        // Specify the content type if needed.
        //urlConn.setRequestProperty("Content-Type",
        //  "application/x-www-form-urlencoded");

        // Construct the POST data.
        String content =
          "username=" + "randomuser" +
          "&password=" + "wrongmd5string";

        // Send the request data.
        try {
            output.writeBytes(content);
            output.flush();
            output.close();
        } catch (IOException ex) {
            Logger.getLogger(SimpleHttpPost.class.getName()).log(Level.SEVERE, null, ex);
        }

        // Get response data.
        String str = null;
        try {
            input = new BufferedReader(new InputStreamReader(urlConn.getInputStream()));
            while (null != ((str = input.readLine()))) {
                System.out.println(str);
            }
            input.close ();
        } catch (IOException ex) {
            Logger.getLogger(SimpleHttpPost.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
}
```
