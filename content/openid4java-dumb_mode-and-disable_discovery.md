Title: OpenID4Java 使用dumb模式（stateless）并禁用 discovery
Date: 2013-12-25 12:20:00
Tags: openid, java
Slug: openid4java-dumb_mode-and-disable_discovery


使用无状态模式（dumb mode/stateless）发起 OpenID 认证请求：

```java
manager = new ConsumerManager();
manager.getRealmVerifier().setEnforceRpId(false);
// 强制manager使用无状态模式
manager.setMaxAssocAttempts(0);
```

禁用 discovery

```java
// 不要使用manager.discover构造discoveries
// List discoveries = manager.discover(userSuppliedString);
// 使用人肉构造discoveries
List discoveries = new ArrayList();
discoveries.add( new DiscoveryInformation( new URL("http//real.openid.server.url") ) );
```
