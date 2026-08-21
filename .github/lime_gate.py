#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""VI v2 配色驗收 gate：圖裡不得出現螢光黃綠（lime，已隨 VI v2 退役）。

判準：HSV hue 55–110°、飽和度 > 0.35、亮度 > 0.25。

⚠️ 2026-08-22 踩雷：原本先 thumbnail(300,300) 再統計，結果 art-ux20.jpg 這種
「細閃電線條全綠」的圖會被縮圖平均掉，量出 0.000% 直接 PASS——但目檢是滿版綠。
**一律用全解析度統計，並同時看絕對像素數**：細線的佔比天生很低，
只看百分比會漏判，所以佔比與絕對數任一超標就 FAIL。

⚠️ **這支只是初篩，不能取代目檢。** 已知盲點：白／灰底上的細螢光綠線條
（例 art-ux20.jpg 的閃電）經 JPEG 色度次取樣後，像素會被鄰近白色稀釋成低飽和的
橄欖綠，統計上完全測不出來，但人眼一看就是滿版螢光綠。
**流程一律是「gate 初篩 → 人工看圖確認」，不要只信數字。**

**適用範圍＝品牌插圖／主視覺**（`assets/hero-*.jpg`、`assets/news/art-*.jpg`、`gd-*.jpg`、
`db-hero.jpg`）。⛔ 不要拿去掃 `assets/news/news-1~4.jpg`——那是自動新聞流程從新聞網站抓下來的
**真實照片**，畫面裡的綠色是被拍的東西本身，不是品牌配色違規。

用法：lime_gate.py <圖檔...>   任一張不合格則 exit 1
"""
import colorsys, sys
from collections import Counter
from PIL import Image

PCT_MAX = 0.05      # 一般 lime 佔比上限（%）
ABS_MAX = 400       # 一般 lime 絕對像素數上限
NEON_MAX = 60       # 「亮而飽和」的螢光綠上限——這種即使只有幾百 px 也會視覺主導
                    # （art-ux20.jpg 就是白灰底配整圈螢光綠閃電，總佔比才 0.046%）

fail = False
for path in sys.argv[1:]:
    im = Image.open(path).convert("RGB")   # 不縮圖
    px = im.tobytes()
    total = im.width * im.height
    hits, neon = Counter(), Counter()
    for i in range(0, len(px), 3):
        r, g, b = px[i], px[i+1], px[i+2]
        if g <= r or g <= b:               # 快篩：綠不是最大分量就跳過
            continue
        h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
        if 55/360 <= h <= 110/360 and s > 0.35 and v > 0.25:
            hits[(r, g, b)] += 1
            if s > 0.45 and v > 0.55:
                neon[(r, g, b)] += 1
    n, nn = sum(hits.values()), sum(neon.values())
    pct = n * 100.0 / total
    ok = pct < PCT_MAX and n < ABS_MAX and nn < NEON_MAX
    fail |= not ok
    sample = ("  最常見 " + " ".join("#%02X%02X%02X" % c for c, _ in hits.most_common(3))) if hits else ""
    print("%-4s lime %7.4f%%  %6d px（螢光 %5d）  %-22s%s"
          % ("PASS" if ok else "FAIL", pct, n, nn, path.split('/')[-1], sample))
sys.exit(1 if fail else 0)
