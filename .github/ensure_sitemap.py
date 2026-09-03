#!/usr/bin/env python3
"""把漏掉的 article-*.html 補進 sitemap.xml。

2026-09-03 起因：週五 SEO 文章機器人靠 Claude 照 prompt 自己改 sitemap，
8/28 那篇 article-claw-machine-rental.html 漏了，每日稽核連紅五天。
這支在機器人 commit 前跑，規則與 audit.py 一致：非 noindex、自我 canonical
的文章頁一律要在 sitemap 裡；缺的就補一行（lastmod 今天，之後由
update_sitemap_lastmod.py 校成 git commit 日）。本機也可直接執行。
"""
import datetime
import glob
import re
import sys

SITEMAP = "sitemap.xml"
ORIGIN = "https://goshoot.com.tw"
NOINDEX_RE = re.compile(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\'][^"\']*noindex', re.I)
CANON_RE = re.compile(r'rel="canonical"\s+href="([^"]+)"')


def wanted(path: str) -> bool:
    html = open(path, encoding="utf-8").read()
    if NOINDEX_RE.search(html):
        return False
    m = CANON_RE.search(html)
    if m and not m.group(1).rstrip("/").endswith("/" + path):
        return False  # canonical 指向別頁的收斂頁，刻意不進 sitemap
    return True


def main() -> int:
    sm = open(SITEMAP, encoding="utf-8").read()
    today = datetime.date.today().isoformat()
    missing = [f for f in sorted(glob.glob("article-*.html"))
               if wanted(f) and f"/{f}</loc>" not in sm]
    if not missing:
        print("sitemap 完整，無需補")
        return 0
    lines = "".join(
        f"  <url><loc>{ORIGIN}/{f}</loc><lastmod>{today}</lastmod>"
        f"<changefreq>weekly</changefreq><priority>0.7</priority></url>\n"
        for f in missing)
    if "</urlset>" not in sm:
        print("❌ sitemap.xml 找不到 </urlset>，不動檔案")
        return 1
    sm = sm.replace("</urlset>", lines + "</urlset>")
    open(SITEMAP, "w", encoding="utf-8").write(sm)
    print(f"補進 sitemap {len(missing)} 篇：")
    for f in missing:
        print("  +", f)
    return 0


if __name__ == "__main__":
    sys.exit(main())
