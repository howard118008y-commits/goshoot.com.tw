#!/usr/bin/env python3
"""Go Shoot 官網每日 SEO 稽核（GitHub Actions 用）。

技術檢查（repo 內 *.html）＋ 線上健康（curl goshoot.com.tw）。
全綠 exit 0；發現任何問題 exit 1（→ workflow 亮紅、GitHub 寄信通知）。
純標準庫、無外部相依。修正交給手動 /daily-site-audit（有判斷、可審）。
"""
import glob
import json
import os
import re
import sys
import urllib.request

SKIP = {"index-v2.html", "index-classic.html", "screen.html",
        "googleea8aada33a914342.html", "brand-preview.html",
        # noindex 內部頁：scroll-bench 是效能測試台、scroll-preview 是訪客品牌開場體驗頁
        # （非 SEO 內容頁，架構鐵律見 memory: scroll-world-redesign——不進 sitemap、不稀釋站質）
        "scroll-bench.html", "scroll-preview.html"}
issues = []

NOINDEX_RE = re.compile(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\'][^"\']*noindex',
                        re.I)


def is_noindex(path: str) -> bool:
    """明著標 noindex 的頁不是 SEO 內容頁，別拿內容頁的尺去量它。

    2026-08-05：稽核連 8 天紅燈，22 個問題裡有 18 個是在罵三個內部預覽頁
    （goshoot-mobile / homepage-cover-preview / ichiban-story）沒有 canonical／og:image／
    JSON-LD，可是它們本來就 noindex、本來就不該進 sitemap。硬編 SKIP 清單治標——
    之後每加一個預覽頁就得再改一次腳本，忘了改就又是一串假警報。改成自動判讀。
    """
    try:
        return bool(NOINDEX_RE.search(open(path, encoding="utf-8").read()))
    except OSError:
        return False


noindexed = sorted(f for f in glob.glob("*.html")
                   if f not in SKIP and is_noindex(f))
if noindexed:
    # 一定要印出來：跳過的頁要看得見，否則真頁面誤標 noindex 會被靜默漏檢
    print("跳過 noindex 內部頁：" + "、".join(noindexed))

pages = sorted(f for f in glob.glob("*.html")
               if f not in SKIP and f not in noindexed)
for f in pages:
    s = open(f, encoding="utf-8").read()
    t = re.search(r"<title>(.*?)</title>", s)
    tl = len(t.group(1)) if t else 0
    d = re.search(r'name="description" content="(.*?)"', s)
    dl = len(d.group(1)) if d else 0
    if not t:
        issues.append(f + "：無 title")
    elif tl > 62:
        issues.append(f + f"：title 過長 {tl}")
    if not d:
        issues.append(f + "：無 description")
    elif dl > 160:
        issues.append(f + f"：description 過長 {dl}")
    for pat, lbl in [(r'rel="canonical"', "canonical"), (r"og:image", "og:image"),
                     (r'twitter:card', "twitter:card"), (r"application/ld\+json", "JSON-LD")]:
        if not re.search(pat, s, re.I):
            issues.append(f + "：缺 " + lbl)
    h1 = len(re.findall(r"<h1", s, re.I))
    if h1 != 1:
        issues.append(f + f"：h1={h1}（應為 1）")
    for img in re.findall(r"<img\b[^>]*>", s, re.I):
        if not re.search(r"\balt=", img, re.I):
            issues.append(f + "：img 缺 alt")
    for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        try:
            json.loads(m)
        except Exception as e:  # noqa: BLE001
            issues.append(f + "：JSON-LD 壞 " + str(e)[:40])

# sitemap / robots / llms 完整度
sm = open("sitemap.xml").read() if os.path.exists("sitemap.xml") else ""
for f in pages:
    if f != "index.html" and "/" + f not in sm:
        issues.append("sitemap 缺：" + f)
robots = open("robots.txt").read() if os.path.exists("robots.txt") else ""
for k in ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]:
    if k not in robots:
        issues.append("robots 缺 AI 爬蟲：" + k)
if not os.path.exists("llms.txt"):
    issues.append("缺 llms.txt")


def http_status(url: str) -> int:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "goshoot-audit"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:  # noqa: BLE001 - 連線失敗
        return 0


for path in ["/", "/sitemap.xml", "/robots.txt", "/llms.txt",
             "/ichiban.html", "/ichiban-beyblade.html"]:
    code = http_status("https://goshoot.com.tw" + path)
    if code != 200:
        issues.append(f"線上 {path} = {code}（應 200）")

print(f"稽核頁數 {len(pages)}、sitemap {sm.count('<loc>')} 筆")
if issues:
    print(f"❌ 發現 {len(issues)} 個問題：")
    for i in issues:
        print("  -", i)
    sys.exit(1)
print("✅ 全綠，0 問題")
