Title: crontab 同时显式指定day of month和day of week的特殊说明
Date: 2014-05-09 13:31:00
Tags: crontab
Slug: cron-day-weekday-restricted

man 5 crontab:

```
           field         allowed values
           -----         --------------
           minute        0-59
           hour          0-23
           day of month  1-31
           month         1-12 (or names, see below)
           day of week   0-7 (0 or 7 is Sun, or use names)
```

> Note: The day of a command's execution can be specified by two fields -- day of month, and day of week.
> If both fields are restricted (ie, are not *), the command will be
> run when either field matches the current time.
> For example, ''30 4 1,15 * 5'' would cause a command to be run
> at 4:30 am on the 1st and 15th of each month, plus every Fri-day.

来自wikipedia的说明（[http://en.wikipedia.org/wiki/Crontab](http://en.wikipedia.org/wiki/Crontab)）：

```
While normally the job is executed when the time/date specification fields all match the current time and date,
there is one exception: if both "day of month" and "day of week" are restricted (not "*"),
then either the "day of month" field (3) or the "day of week" field (5) must match the current day.
```

以设置crontab： 11 14 27 3 3 为例，下面两个类型的时间都能满足该表达式：

1. 3月里的每一个周三
2. 3月27日
