#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 IP 一番賞頁「賞品類型」卡片裡的系統 emoji 換成品牌圓 icon。

為什麼要換：iOS 會把 emoji 渲成 Apple 彩色字符、Windows 又是另一套，跨平台完全不受控，
而且和 VI v2 的橘黑一點關係都沒有。同一批卡片裡的「最後賞」早就用品牌 icon 了，
這批只是把剩下的補齊。

⚠️ inline img 一定要帶 display:inline-block——全域有 img{display:block}，
   不帶就會把卡片版型撐爛（memory: vi-redesign-v2 記過這個雷）。

用法：swap_emoji.py [--apply]   預設 dry-run
"""
import glob, io, os, re, sys

SITE = "/Users/hohomacmini/goshoot/site/"
MAP = {
 "🧣": "towel", "📛": "badge", "🗿": "figure", "🎴": "shikishi", "🥤": "glass",
 "🧸": "plush", "🍽": "tableware", "📌": "charm", "🖼": "standee", "🌱": "sprout",
 "📊": "chart", "📅": "calendar",
}
IMG = ('<img src="/assets/brand/icon/%s.jpg" alt="" style="display:inline-block;'
       'width:.95em;height:.95em;border-radius:50%%;vertical-align:-.12em;object-fit:cover">')

def main():
    apply_ = "--apply" in sys.argv
    os.chdir(SITE)
    missing = [n for n in set(MAP.values())
               if not os.path.exists("assets/brand/icon/%s.jpg" % n)]
    if missing:
        sys.exit("缺 icon 檔，先生圖：%s" % ", ".join(sorted(missing)))

    total = 0
    for fn in sorted(glob.glob("ichiban-*.html")):
        t = io.open(fn, encoding="utf-8").read()
        orig, n = t, 0
        for emo, name in MAP.items():
            pat = '<span class="e">%s</span>' % emo
            c = t.count(pat)
            if c:
                t = t.replace(pat, '<span class="e">%s</span>' % (IMG % name))
                n += c
        if n:
            total += n
            print("  %-26s %2d 處" % (fn, n))
            if apply_ and t != orig:
                io.open(fn, "w", encoding="utf-8").write(t)

    left = 0
    for fn in sorted(glob.glob("ichiban-*.html")):
        left += len(re.findall(r'<span class="e">[^<]', io.open(fn, encoding="utf-8").read()))
    print("\n共 %d 處%s。" % (total, "已換" if apply_ else "可換（dry-run，加 --apply 才寫檔）"))
    if apply_:
        print("換完後 ichiban-*.html 仍含純文字 emoji 的 .e 槽位：%d 個" % left)

if __name__ == "__main__":
    main()
