#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""第二批：把 article-* 與 about.html 剩下的 emoji 圖示槽位換成品牌圓 icon。

第一批（12 個 ichiban-*.html，57 處）已完成，見 .github/swap_emoji.py。
這批處理剩下的 14 檔 55 處。

⚠️ 兩個不用 icon、改用文字徽章的例外：
- 國旗 🇯🇵🇹🇼🇺🇸：Windows Chrome 只會顯示 JP/TW/US 兩個字母，跨平台最不受控；
  而且國旗畫成橘黑就失去辨識意義。直接做成品牌橘的字母徽章最誠實。
- 產品線代號 🅱️🆄🅲（BX/UX/CX）：本來就是字母，畫成圖反而讀不出來。

⚠️ inline img 一定要帶 display:inline-block——全域有 img{display:block}。

用法：swap_emoji2.py [--apply]   預設 dry-run
"""
import glob, io, os, re, sys

SITE = "/Users/hohomacmini/goshoot/site/"
IMG = ('<img src="/assets/brand/icon/%s.jpg" alt="" style="display:inline-block;'
       'width:.95em;height:.95em;border-radius:50%%;vertical-align:-.12em;object-fit:cover">')
TXT = ('<b style="font:800 .62em/1 Poppins,sans-serif;color:#FF5A2D;'
       'letter-spacing:.04em;vertical-align:.12em">%s</b>')

ICON = {
 "🎯": "target", "🔍": "magnifier", "✅": "check", "⚙️": "gear", "💥": "burst",
 "🏁": "flag", "🏬": "store", "🧩": "puzzle", "⚡": "bolt", "🎣": "launcher",
 "🏟️": "stadium", "🟦": "parts", "📛": "badge", "⚔️": "attack", "🛡️": "defense",
 "⏳": "stamina", "⚖️": "balance", "💨": "dash", "🧑‍💼": "person", "🤝": "handshake",
 "📦": "parcel", "↩️": "refund", "🏤": "post", "🥇": "medalgold", "🥈": "medalsilver",
 "📈": "chart", "🎫": "ticket", "📱": "phone", "⏰": "clock",
 # 三顆機體名（鮫鯊狂鱗／暴龍咆哮／惡魔勇氣）與 Spin Finish、一顆陀螺，都用陀螺 icon
 "🦈": "spintop", "🦖": "spintop", "😈": "spintop", "🌀": "spintop",
}
TEXT = {"🇯🇵": "JP", "🇹🇼": "TW", "🇺🇸": "US", "🅱️": "BX", "🆄": "UX", "🅲": "CX"}

def main():
    apply_ = "--apply" in sys.argv
    os.chdir(SITE)
    missing = sorted({n for n in ICON.values()
                      if not os.path.exists("assets/brand/icon/%s.jpg" % n)})
    if missing:
        sys.exit("缺 icon 檔，先生圖：%s" % ", ".join(missing))

    tot_i = tot_t = 0
    for fn in sorted(glob.glob("*.html")):
        if fn.startswith("ichiban-"):
            continue                      # 第一批已處理
        t = io.open(fn, encoding="utf-8").read()
        orig, ni, nt = t, 0, 0
        for emo, name in ICON.items():
            pat = '<span class="e">%s</span>' % emo
            c = t.count(pat)
            if c:
                t = t.replace(pat, '<span class="e">%s</span>' % (IMG % name)); ni += c
        for emo, label in TEXT.items():
            pat = '<span class="e">%s</span>' % emo
            c = t.count(pat)
            if c:
                t = t.replace(pat, '<span class="e">%s</span>' % (TXT % label)); nt += c
        if t != orig:
            tot_i += ni; tot_t += nt
            print("  %-42s icon %2d  文字徽章 %d" % (fn, ni, nt))
            if apply_:
                io.open(fn, "w", encoding="utf-8").write(t)

    left = sum(len(re.findall(r'<span class="e">[^<]', io.open(f, encoding="utf-8").read()))
               for f in glob.glob("*.html"))
    print("\n共 icon %d 處、文字徽章 %d 處%s。" % (tot_i, tot_t, "已換" if apply_ else "可換（dry-run）"))
    if apply_:
        print("全站仍含純文字 emoji 的 .e 槽位：%d 個" % left)

if __name__ == "__main__":
    main()
