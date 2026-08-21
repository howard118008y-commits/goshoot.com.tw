#!/usr/bin/env python3
"""Go Shoot 官網每日 SEO 稽核（GitHub Actions 用）。

技術檢查（repo 內 *.html）＋ 線上健康（curl goshoot.com.tw）。
全綠 exit 0；發現任何問題 exit 1（→ workflow 亮紅、GitHub 寄信通知）。
純標準庫、無外部相依。修正交給手動 /daily-site-audit（有判斷、可審）。
"""
import datetime
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

# 過期日期偵測（2026-08-19 老闆指示：featured-drop 掛「7/15 起上架・敬請期待」
# 一個月沒人發現。抓「往前看的文案配上已過去的日期」——日期已過 GRACE 天仍寫
# 即將/敬請期待/起/開幕之類，就亮紅。回頭敘事（「已發售」）不在此列。）
TODAY = datetime.date.today()
GRACE = 14  # 過去這麼多天內不算過期，留檔期收尾餘裕
STALE_RE = re.compile(
    r"(\d{1,2})\s*[/月]\s*(\d{1,2})\s*日?\s*(?:起|開賣|上架|開幕|登場|開抽|開跑)"
    r"|(?:即將|預計|敬請期待|倒數)[^<，。]{0,20}?(\d{1,2})\s*[/月]\s*(\d{1,2})")


def stale_snippets(text: str):
    for m in STALE_RE.finditer(text):
        # 回頭敘事不算過期：「已於 7/30 起發售」「自 2026 年 7 月 31 日起已可」
        if re.search(r"[已自]", text[max(0, m.start() - 14):m.start()]):
            continue
        if "已" in text[m.end():m.end() + 8]:  # 「7/31 起已陸續開放」也是回頭敘事
            continue
        mo, dy = (m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4))
        try:
            d = datetime.date(TODAY.year, int(mo), int(dy))
        except ValueError:
            continue
        if (d - TODAY).days > 183:  # 半年後的日期視為去年檔期殘留
            d = d.replace(year=TODAY.year - 1)
        if (TODAY - d).days > GRACE:
            yield m.group(0).strip()


for f in pages:
    hits = list(stale_snippets(open(f, encoding="utf-8").read()))
    if hits:
        issues.append(f + "：過期日期文案「" + hits[0] + "」等 " + str(len(hits)) + " 處")

# sitemap / robots / llms 完整度
sm = open("sitemap.xml").read() if os.path.exists("sitemap.xml") else ""
# 2026-08-22：canonical 指向「別頁」的收斂頁本來就不該進 sitemap（Google 會忽略非自我 canonical 的
# sitemap 條目，還會互相矛盾）。只有自我 canonical 的頁才要求進 sitemap。
canonicalised_away = []
for f in pages:
    if f == "index.html":
        continue
    m = re.search(r'rel="canonical"\s+href="([^"]+)"', open(f, encoding="utf-8").read())
    if m and not m.group(1).rstrip("/").endswith("/" + f):
        canonicalised_away.append(f)
        continue
    if "/" + f not in sm:
        issues.append("sitemap 缺：" + f)
if canonicalised_away:
    print("跳過 canonical 收斂頁（指向別頁，刻意不進 sitemap）：" + "、".join(canonicalised_away))
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
