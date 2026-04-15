Title: Django multiple select option with title
Date: 2013-09-09 15:02:00
Tags: python, django
Slug: django-multiple-select-option-with-title
Author: 老树

```python
from django import forms
from django.utils.encoding import force_unicode
from django.utils.html import escape, conditional_escape

class SelectMultipleWithTitle(forms.SelectMultiple):
    """ multiple select optihon with title """
    def render_option(self, selected_choices, option_value, option_label):
        option_value = force_unicode(option_value)
        selected_html = (option_value in selected_choices) and u' selected="selected"' or ''
        return u'<option value="%s"%s title="%s">%s</option>' % (
            escape(option_value), selected_html,
            conditional_escape(force_unicode(option_label)),
            conditional_escape(force_unicode(option_label)))
```
