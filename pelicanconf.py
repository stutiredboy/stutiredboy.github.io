#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

import datetime
import os
import sys

# 确保项目根目录在 Python 路径中（用于 jinja_filters 导入）
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jinja_filters import shuffle

JINJA_FILTERS = { 'shuffle' : shuffle }
PLUGIN_PATHS = ["plugins"]
PLUGINS = ['pelican_related', 'tag_cloud', 'sitemap']

THEME = 'themes/stuhouse'

AUTHOR = u'陈小生'
SITENAME = u'小生说大声讲'
SITEDESCRIPTION = u'记录和整理自己的经验，仅供自己参考。'
# 本地预览 (pelican --listen) 使用空 SITEURL 生成根相对 URL；生产构建由 publishconf.py 覆盖
SITEURL = ''

TIMEZONE = 'Asia/Hong_Kong'

DEFAULT_LANG = u'zh'
DEFAULT_DATE_FORMAT = "%Y-%m-%d %H:%M"

# Feed generation is usually not desired when developing
FEED_ALL_ATOM = 'feeds/all.atom.xml'
CATEGORY_FEED_ATOM = 'feeds/${slug}.atom.xml'
TRANSLATION_FEED_ATOM = None

MARKDOWN = {
    'extension_configs': {
        'markdown.extensions.codehilite': {'css_class': 'highlight'},
        'markdown.extensions.extra': {},
        'markdown.extensions.meta': {},
    },
    'output_format': 'html5',
    "lazy_ol": False,
}

# Blogroll
LINKS =  (('Pelican', 'http://getpelican.com/'),
          ('Python.org', 'http://python.org/'),
          ('Jinja2', 'http://jinja.pocoo.org/'),
          ('You can modify those links in your config file', '#'),)

# Social widget
SOCIAL = ( ('weibo', 'http://weibo.com/stutiredboy'),
            ('facebook', 'https://www.facebook.com/stutiredboy'),
            ('twitter', 'https://twitter.com/stutiredboy'),
            ('github', 'https://github.com/stutiredboy'),
            ('rss', '%s/feeds/all.atom.xml' % SITEURL ),
            )

SITEMAP = {
    'format': 'xml',
    'priorities': {
        'articles': 0.5,
        'indexes': 0.5,
        'pages': 0.5
    },
    'changefreqs': {
        'articles': 'monthly',
        'indexes': 'daily',
        'pages': 'monthly'
    }
}

DEFAULT_PAGINATION = 6
TAG_CLOUD_STEPS = 8

# Uncomment following line if you want document-relative URLs when developing
#RELATIVE_URLS = True
# 不在页面显示分类目录（有tag足够了）
DISPLAY_CATEGORIES_ON_MENU = False
# 文章URL
ARTICLE_URL = "posts/{date:%Y}-{date:%m}-{date:%d}/{slug}.html"
# 文章保存目录
ARTICLE_SAVE_AS = "posts/{date:%Y}-{date:%m}-{date:%d}/{slug}.html"

# 页面配置
PAGE_URL = "pages/{slug}.html"
PAGE_SAVE_AS = "pages/{slug}.html"
DISPLAY_PAGES_ON_MENU = False

# 静态文件路径 - 将 content/static/ 和 content/extra/ 复制到输出目录
STATIC_PATHS = ['static', 'extra']
EXTRA_PATH_METADATA = {
    'extra/favicon.ico': {'path': 'favicon.ico'},
    'extra/CNAME': {'path': 'CNAME'},
    'extra/ads.txt': {'path': 'ads.txt'},
    'extra/robots.txt': {'path': 'robots.txt'},
}

LAST_GENERATOR_TIME = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# 评论系统：giscus + GitHub Discussions
# 配置自 https://giscus.app/zh-CN 生成；仓库需已启用 Discussions 并安装 giscus App
GISCUS_REPO = "stutiredboy/stutiredboy.github.io"
GISCUS_REPO_ID = "MDEwOlJlcG9zaXRvcnkxMzAwODI4NQ=="
GISCUS_CATEGORY = "Comments"
GISCUS_CATEGORY_ID = "DIC_kwDOAMZ9nc4C7eK0"
GISCUS_MAPPING = "pathname"
GISCUS_THEME = "preferred_color_scheme"
