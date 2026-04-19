#!/usr/bin/env python3
"""
Generate view-seeds.json for the blog.

See openspec/changes/add-article-view-counts/specs/view-seed-generation/spec.md
for the full formula.

Usage:
    python scripts/generate_view_seeds.py
    python scripts/generate_view_seeds.py --disqus path/to/export.xml
"""

import argparse
import datetime
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = REPO_ROOT / "content"
OUTPUT_PATH = REPO_ROOT / "themes" / "stuhouse" / "static" / "data" / "view-seeds.json"
DEFAULT_DISQUS = REPO_ROOT / "scripts" / "disqus-export.xml"

COMMENT_MULTIPLIER = 120
YEAR_MULTIPLIER = 300
CURRENT_YEAR = datetime.date.today().year

SLUG_RE = re.compile(r"^Slug:\s*(.+?)\s*$", re.MULTILINE)
DATE_RE = re.compile(r"^Date:\s*(\d{4})-", re.MULTILINE)


def parse_article_frontmatter(md_path: Path) -> tuple[str | None, int | None]:
    """Return (slug, year) from a pelican markdown file."""
    try:
        text = md_path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None, None
    head = text[:2000]  # frontmatter is always at the top
    slug_m = SLUG_RE.search(head)
    date_m = DATE_RE.search(head)
    slug = slug_m.group(1) if slug_m else md_path.stem
    year = int(date_m.group(1)) if date_m else None
    return slug, year


def load_disqus_comments(xml_path: Path) -> dict[str, int]:
    """Parse Disqus export XML and return {slug: comment_count}.

    Disqus XML schema (simplified):
      <disqus>
        <thread dsq:id="...">
          <link>https://.../posts/YYYY-MM-DD/<slug>.html</link>
          ...
        </thread>
        <post dsq:id="...">
          <thread dsq:id="..."/>
          <isDeleted>false</isDeleted>
          <isSpam>false</isSpam>
        </post>
      </disqus>
    """
    if not xml_path.exists():
        print(
            f"warning: Disqus export not found at {xml_path}, "
            "using year-based fallback only",
            file=sys.stderr,
        )
        return {}

    try:
        tree = ET.parse(xml_path)
    except ET.ParseError as e:
        print(f"warning: failed to parse Disqus XML: {e}", file=sys.stderr)
        return {}

    root = tree.getroot()
    # Handle default namespace
    ns_match = re.match(r"\{([^}]+)\}", root.tag)
    ns = ns_match.group(1) if ns_match else ""
    def q(tag: str) -> str:
        return f"{{{ns}}}{tag}" if ns else tag

    # thread_id -> slug
    thread_to_slug: dict[str, str] = {}
    link_slug_re = re.compile(r"/posts/\d{4}-\d{2}-\d{2}/([a-z0-9][a-z0-9-]*)\.html")

    for thread in root.iter(q("thread")):
        link_el = thread.find(q("link"))
        if link_el is None or not link_el.text:
            continue
        m = link_slug_re.search(link_el.text)
        if not m:
            continue
        # thread's dsq:id
        dsq_id = None
        for attr, value in thread.attrib.items():
            if attr.endswith("}id") or attr == "id":
                dsq_id = value
                break
        if dsq_id:
            thread_to_slug[dsq_id] = m.group(1)

    # count non-deleted, non-spam posts per thread
    counts: dict[str, int] = {}
    for post in root.iter(q("post")):
        is_deleted = (post.findtext(q("isDeleted")) or "").lower() == "true"
        is_spam = (post.findtext(q("isSpam")) or "").lower() == "true"
        if is_deleted or is_spam:
            continue
        thread_el = post.find(q("thread"))
        if thread_el is None:
            continue
        thread_id = None
        for attr, value in thread_el.attrib.items():
            if attr.endswith("}id") or attr == "id":
                thread_id = value
                break
        if not thread_id:
            continue
        slug = thread_to_slug.get(thread_id)
        if not slug:
            continue
        counts[slug] = counts.get(slug, 0) + 1
    return counts


def round_seed(raw: int) -> int:
    if raw <= 0:
        return 0
    if raw <= 1000:
        return max(0, round(raw / 50) * 50)
    return round(raw / 100) * 100


def compute_seed(comments: int, year: int | None) -> int:
    year_based = (CURRENT_YEAR - year) * YEAR_MULTIPLIER if year else 0
    comment_based = comments * COMMENT_MULTIPLIER
    return round_seed(max(year_based, comment_based))


def load_existing_overrides(path: Path) -> tuple[set[str], dict[str, int]]:
    """Return (override_slugs, existing_values_for_overrides)."""
    if not path.exists():
        return set(), {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return set(), {}
    overrides = set(data.get("_overrides", []) or [])
    kept = {k: data[k] for k in overrides if k in data and isinstance(data[k], int)}
    return overrides, kept


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate view-seeds.json")
    parser.add_argument("--disqus", type=Path, default=DEFAULT_DISQUS)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()

    comments = load_disqus_comments(args.disqus)
    overrides, override_values = load_existing_overrides(args.output)

    seeds: dict[str, int] = {}
    scanned = 0
    for md in CONTENT_DIR.glob("*.md"):
        slug, year = parse_article_frontmatter(md)
        if not slug:
            continue
        scanned += 1
        if slug in overrides and slug in override_values:
            seeds[slug] = override_values[slug]
            continue
        seeds[slug] = compute_seed(comments.get(slug, 0), year)

    # Emit: _overrides first (if any), then all slugs alphabetically
    payload: dict = {}
    if overrides:
        payload["_overrides"] = sorted(overrides)
    for slug in sorted(seeds.keys()):
        payload[slug] = seeds[slug]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    non_zero = sum(1 for v in seeds.values() if v > 0)
    with_comments = sum(1 for s in seeds if s in comments and comments[s] > 0)
    print(f"Wrote {args.output.relative_to(REPO_ROOT)}")
    print(f"  articles scanned: {scanned}")
    print(f"  slugs with seed > 0: {non_zero}")
    print(f"  slugs with Disqus comments: {with_comments}")
    print(f"  manual overrides preserved: {len(override_values)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
