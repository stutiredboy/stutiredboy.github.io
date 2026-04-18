# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

Source for the Pelican-generated blog **"小生说大声讲"** (https://www.chenxiaosheng.com), authored in Chinese by 陈小生. This repo holds *only* the source; built HTML is published to the `gh-pages` branch by CI.

## Branch model

- `source` — working branch; all authoring and config edits land here.
- `gh-pages` — generated output, force-pushed orphan-style by `.github/workflows/deploy.yml`. Never edit by hand.
- `main` field in `gitStatus` shows `gh-pages` because that's the default publish branch — PRs should still target `source`.

## Build / preview

```bash
pip install -r requirements.txt                              # Pelican 4.9, pelican-related, pelican-sitemap, Markdown 3
export PYTHONPATH=$PWD:$PYTHONPATH                           # so pelicanconf can import jinja_filters
pelican content -o output -s pelicanconf.py -t themes/pelican-bootstrap3
pelican --listen                                             # local server on :8000 (optional)
```

There is no test suite, linter, or Makefile. CI (`.github/workflows/deploy.yml`) runs exactly the build command above on every push to `source` and deploys `output/` to `gh-pages` via `peaceiris/actions-gh-pages@v4`.

## Authoring a post

- Drop a Markdown file into `content/` (flat, not subfoldered). `content/pages/` is for standalone pages (currently only `about.md`).
- Required metadata block (used by the theme and by URL routing):
  ```
  Title: …
  Date: YYYY-MM-DD HH:MM:SS
  Tags: comma, separated
  Slug: kebab-case-slug
  Author: 小生说大声讲        # optional — falls back to AUTHOR in pelicanconf
  Summary: …                   # optional but recommended; surfaces on index pages
  ```
- URLs are pinned to `posts/{YYYY}-{MM}-{DD}/{slug}.html` (see `ARTICLE_URL` in `pelicanconf.py`). Changing the date or slug will break inbound links.
- Images and other assets go under `content/static/` (served from `/static/…`). Per-post image folders already exist for recent articles (e.g. `content/static/peril-of-laziness-lost/`).
- `content/extra/` holds files copied to the site root: `CNAME`, `favicon.ico`, `robots.txt`, `ads.txt`. Mappings are declared in `EXTRA_PATH_METADATA`.

## Pelican config notes

- `pelicanconf.py` prepends the repo root to `sys.path` so the top-level `jinja_filters.py` (exposes a `shuffle` Jinja filter) can be imported. The duplicate copy at `plugins/jinja_filters.py` is unused — the loaded plugins are `pelican_related`, `tag_cloud`, `sitemap` via `PLUGIN_PATHS = ["plugins"]`.
- `tag_cloud` is a **vendored** plugin (`plugins/tag_cloud.py`), not a pip install. `pelican_related` and `sitemap` come from pip (see `requirements.txt`).
- Theme is vendored under `themes/pelican-bootstrap3/` — edit templates there, not via a submodule.
- Disqus and Google Analytics IDs (`DISQUS_SITENAME`, `GOOGLE_ANALYTICS`) are hardcoded in `pelicanconf.py`.

## OpenSpec

`openspec/` is configured but unused (no specs, no active changes — only an empty `archive/` dir). The project adopts the spec-driven workflow via the `openspec-*` / `opsx:*` skills, but there are no existing specs to follow yet. If the user invokes an OpenSpec skill, treat this as a fresh project.
