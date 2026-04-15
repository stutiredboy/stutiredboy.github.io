Title: pelican增加自定义jinja template filters
Date: 2013-09-11 19:46:00
Tags: python, pelican, jinja
Slug: pelican-custom-jinja-filters
Author: 老树

pelican官方文档没有显式的指明应该如何自定义jinja template filters.

在制作标签云的时候，不想写复杂的javascript，更不想又import一份javascript进来，所以决定自己搞一个比较简单的标签云

pelican默认的tag排序比较简单，为了能有比较“云”的感觉，决定对tag加个随机排序

查了Jinja的文档，没有随机排序的filter。由于我使用了`virtualenv`，所以最简单粗暴的解决方案是直接修改了Jinja的源码，添加了随机排序的功能

不过对于稍微有些“洁癖”的好，这样改后，心理上非常难受，决定到pelican社区，看看是否有幸添加个patch

当然，更幸运的是在`github`找到了此commit:

    https://github.com/getpelican/pelican/pull/96

原来有个`JINJA_FILTERS`的设置，那一切就好办了, 增加自定义模块`jinja_filters.py`

```python
import random

def shuffle( value ):
    """ Jinja template filter for shuffling list/tuple """
    if not isinstance( value, list
            ) and not isinstance( value, tuple ):
        return value
    random.shuffle( value )
    return value
```

在`pelican`配置文件里填加:

```python
from jinja_filters import shuffle

JINJA_FILTERS = { 'shuffle' : shuffle }
```

尝试重新编译生成html文件，顺利完成。

