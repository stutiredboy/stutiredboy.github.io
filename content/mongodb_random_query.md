Title: MongoDB 随机查询获取一条或 N 条记录的方法
Date: 2018-05-24 12:14:13
Tags: mongodb
Slug: mongodb-random-query
Summary: MySQL 可以通过 `rand()` 配合 `limit` 获取随机的 N 条记录，那么在 MongoDB 上我们又该如何操作呢？

熟悉 MySQL 的同学应该都知道可以通过类似如下语句简单的获取一张表里随机的 N 条记录：

> SELECT * FROM table ORDER BY RAND() LIMIT N;

在 MongoDB 里应该如何操作呢？官方在 3.2 版本带来了直接的解决方案：

> $sample (aggregation)

具体应该如何操作，官方也给出了一个示例，假设 Collection users 有如下记录：

```
{ "_id" : 1, "name" : "dave123", "q1" : true, "q2" : true }
{ "_id" : 2, "name" : "dave2", "q1" : false, "q2" : false  }
{ "_id" : 3, "name" : "ahn", "q1" : true, "q2" : true  }
{ "_id" : 4, "name" : "li", "q1" : true, "q2" : false  }
{ "_id" : 5, "name" : "annT", "q1" : false, "q2" : true  }
{ "_id" : 6, "name" : "li", "q1" : true, "q2" : true  }
{ "_id" : 7, "name" : "ty", "q1" : false, "q2" : true  }
```

那么可以通过命令 `db.users.aggregate( [ { $sample: { size: N } } ] )` 获取随机的 N 条记录，如：

```
mongos> db.users.aggregate( [ { $sample: { size: 3 } } ] )
{ "_id" : 7, "name" : "ty", "q1" : false, "q2" : true }
{ "_id" : 4, "name" : "li", "q1" : true, "q2" : false }
{ "_id" : 1, "name" : "dave123", "q1" : true, "q2" : true }
mongos> db.users.aggregate( [ { $sample: { size: 3 } } ] )
{ "_id" : 7, "name" : "ty", "q1" : false, "q2" : true }
{ "_id" : 3, "name" : "ahn", "q1" : true, "q2" : true }
{ "_id" : 2, "name" : "dave2", "q1" : false, "q2" : false }
mongos>
```

$sample 会使用如下两种方式来获取随机的 N 条记录，具体使用哪种方式取决于如下条件：

1. $sample 处于聚合管道的第一阶段；
2. N 小于总文档数量的 5% ;
3. 集合（Collection）中的文档数量大于 100；

当以上 3 个条件都满足时，$sample 将通过伪随机的游标来获取记录。当任一条件不满足时，$sample 将进行集合扫描，并通过随机排序来选择相应的 N 条记录。

需要注意的是：

1. 当使用随机排序来获取记录时，排序操作会有 100 MB 的内存限制，具体可以参考 [$sort and Memory Restrictions](https://docs.mongodb.com/manual/reference/operator/aggregation/sort/#sort-memory-limit)；
2. $sample 有可能多次返回同一条记录（document）；
3. 尝试在一张十亿级的 Collection 上获取 1W 条随机记录，耗时约 2.5 秒，供参考；

参考文档：

1. https://docs.mongodb.com/manual/reference/operator/aggregation/sample/
2. https://jira.mongodb.org/browse/SERVER-533
