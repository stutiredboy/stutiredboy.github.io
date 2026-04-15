Title: Django Admin 使用 filter_horizontal 不生效
Date: 2013-09-23 15:25:00
Tags: django, python
Slug: django-filter_horizontal
Summary: Django 1.2.7 admin在使用ManyToManyField的时候，默认使用垂直`filter_vertical`方式进行显示与选择。此方式在选项比较多的时候，难以直观的看出哪些选项被选中，在尝试使用`filter_horizontal`进行显示的时候，我们碰到了一些问题。

考虑到Django 1.0.2 admin的功能实在太弱了，今天冒着大风险，将某系统的Django进行了升级（升级至Django 1.2.7）。

Django 1.2.7 admin在使用`ManyToManyField`的时候，默认使用垂直`filter_vertical`方式进行显示与选择。此方式在选项比较多的时候，难以直观的看出哪些选项被选中，如下图所示：

<img src="/static/django_filter_vertical.png">

决定使用更直观的方式，`filter_horizontal`，设置比较简单，只要在`admin.py`里对应的模块下，添加类似如下内容即可：
```python
filter_horizontal = ['example']
```

`filter_horizontal`显示方式如下图所示：

<img src="/static/django_filter_horizontal.png">

但是，当我设置了此选择后，发现出现了奇怪的问题，如下图：

<img src="/static/django_filter_nothing.png">

没有报错，但也没有出现设想中的选择框。经过研究，发现，原来是因为我对应的字段`ips`，在`models.py`里定义的时候，`verbose_name`使用了字符串，而不是`unicode`，如下：

```python
ips = models.ManyToManyField( IPData, verbose_name = "使用IP" )
```

调整为

```python
ips = models.ManyToManyField( IPData, verbose_name = u"使用IP" )
```

问题解决。使用`string`是因为我们这些是一些老旧的系统，新项目必须果断的抛弃`string`，拥抱`unicode`吧！
