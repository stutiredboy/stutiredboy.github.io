#!/usr/bin/env python
# -*- coding: utf-8 -*- #
from __future__ import unicode_literals

import os
import sys

sys.path.append(os.curdir)
from pelicanconf import *

SITEURL = 'https://www.chenxiaosheng.com'
RELATIVE_URLS = False

FEED_ALL_ATOM = 'feeds/all.atom.xml'
CATEGORY_FEED_ATOM = 'feeds/${slug}.atom.xml'

DELETE_OUTPUT_DIRECTORY = True

SOCIAL = (('weibo', 'http://weibo.com/stutiredboy'),
          ('facebook', 'https://www.facebook.com/stutiredboy'),
          ('twitter', 'https://twitter.com/stutiredboy'),
          ('github', 'https://github.com/stutiredboy'),
          ('rss', '%s/feeds/all.atom.xml' % SITEURL),
          )
