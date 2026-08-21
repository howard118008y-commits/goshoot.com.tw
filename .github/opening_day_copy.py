#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""開幕日（2026-08-25）官網文案切換。

背景：站上有一批措辭在開幕前正確、開幕後就變錯——「敬請期待」「整裝中」
「籌備中、尚未營運」「開幕後○○」「等不及開幕」「屆時公告」之類。
純粹陳述「2026 年 8 月 25 日開幕」的句子不算錯，本腳本刻意不動它們。

用法：
    python3 .github/opening_day_copy.py            # dry-run，只列出會改什麼
    python3 .github/opening_day_copy.py --apply    # 實際寫檔
    python3 .github/opening_day_copy.py --check    # 只掃殘留風險字眼

⚠️ 另有一批需要老闆拍板才能改的（實際營業時間等），列在 NEEDS_OWNER，
   本腳本不會自動改，只會印出來提醒。
"""
import io, os, sys

# (檔名, [(原文, 改成), ...])
RULES = [
 ("index.html", [
   ("<p>8/25 開幕・敬請期待。開幕後景品定期更新、不定期保夾活動。</p>",
    "<p>已開幕，24 小時營業。景品定期更新、不定期保夾活動。</p>"),
   ("<p>8/25 開幕・敬請期待</p>", "<p>已開幕・24 小時營業</p>"),
   ("。滿場娃娃機台整裝中，開幕後 24 小時營業、景品定期更新、不定期保夾活動——從人氣公仔、玩偶到限定景品都有。敬請期待。",
    "。滿場娃娃機台，24 小時營業、景品定期更新、不定期保夾活動——從人氣公仔、玩偶到限定景品都有。歡迎來逛。"),
   ("<span>開幕後場內主力，機台超多</span>", "<span>場內主力，機台超多</span>"),
   ("<span>開幕後景品定期換・不定期保夾</span>", "<span>景品定期換・不定期保夾</span>"),
   ("<b>8/25 開幕</b><span>2026 年 8 月 25 日</span>", "<b>已開幕</b><span>2026 年 8 月 25 日起</span>"),
   ("中和實體店・8/25 開幕", "中和實體店・已開幕"),
 ]),
 ("goshoot-mobile.html", [
   ("<p>8/25 開幕・敬請期待</p>", "<p>已開幕・24 小時營業</p>"),
   ("。滿場娃娃機台整裝中，開幕後 24 小時營業、景品定期更新、不定期保夾活動——從人氣公仔、玩偶到限定景品都有。敬請期待。",
    "。滿場娃娃機台，24 小時營業、景品定期更新、不定期保夾活動——從人氣公仔、玩偶到限定景品都有。歡迎來逛。"),
   ("<b>8/25 開幕</b><span>2026 年 8 月 25 日</span>", "<b>已開幕</b><span>2026 年 8 月 25 日起</span>"),
 ]),
 ("article-what-is-goshoot.html", [
   ("2026 年 8 月 25 日正式開幕，屆時提供 24 小時娃娃機與戰鬥陀螺對戰區，開幕前仍在籌備中。",
    "已於 2026 年 8 月 25 日正式開幕，提供 24 小時娃娃機與戰鬥陀螺對戰區。"),
   ("2026 年 8 月 25 日正式開幕，屆時有 24 小時娃娃機與戰鬥陀螺對戰區，開幕前仍在籌備中。",
    "已於 2026 年 8 月 25 日正式開幕，設有 24 小時娃娃機與戰鬥陀螺對戰區。"),
   ("門市開幕後可親自到中和店取貨，順便逛娃娃機、上賽場試打陀螺（門市籌備中、8/25 開幕）。",
    "可親自到中和門市取貨，順便逛娃娃機、上賽場試打陀螺（門市已開幕）。"),
   ("實體店<strong>2026 年 8 月 25 日正式開幕</strong>，開幕後規劃：娃娃機 24 小時營業、戰鬥陀螺對戰區 16:00–24:00。目前仍在籌備中，尚未營運。",
    "實體店已於<strong>2026 年 8 月 25 日正式開幕</strong>，營業內容：娃娃機 24 小時營業、戰鬥陀螺對戰區 16:00–24:00。"),
 ]),
 ("article-beyblade-how-to-play.html", [
   ("Go Shoot 中和門市 8/25 開幕，規劃有戰鬥陀螺對戰區（預計 16:00–24:00 開放）與不定時店內賽事，開幕後歡迎來現場開打。",
    "Go Shoot 中和門市已開幕，設有戰鬥陀螺對戰區（16:00–24:00 開放）與不定時店內賽事，歡迎來現場開打。"),
 ]),
 ("article-claw-machine-tips.html", [
   ("<strong>2026 年 8 月 25 日開幕</strong>。開幕後歡迎來現場練夾功。",
    "已於<strong>2026 年 8 月 25 日開幕</strong>。歡迎來現場練夾功。"),
 ]),
 ("article-claw-machine-terms.html", [
   ("等不及開幕想先玩？", "不想出門也能玩？"),
 ]),
 ("article-zhonghe-jingping-guide.html", [
   ("等不及開幕？", "想先在線上玩？"),
   ("中獎可宅配到府或開幕後到門市自取", "中獎可宅配到府或到門市自取"),
 ]),
 ("rental.html", [
   ("門市 2026 年 8 月 25 日開幕，現在開放預訂台位，開幕當天一起上機。",
    "門市已於 2026 年 8 月 25 日開幕，台位持續開放預訂，洽詢後即可進駐上機。"),
 ]),
]

# 需要老闆拍板才能改的（本腳本不動）
NEEDS_OWNER = [
 ("index.html / goshoot-mobile.html", "「營業時間　8/25 開幕，確切營業時間屆時公告」——需要老闆給實際營業時間才能改"),
 ("store.html", "hero「中和捷運站旁<br>8/25 開幕」與 meta description／JSON-LD 的開幕措辭，要不要改成「已開幕」"),
 ("五篇娃娃機文＋順遊文", "文末門市導購 H2「Go Shoot 中和 24H 娃娃機店，8/25 開幕」要不要改「已開幕」"),
 ("screen.html:109", "店內螢幕 API fallback 顯示「本月熱門商品 敬請期待」，開幕當天若 API 沒接上會被客人看到"),
 ("app（另一個 repo）", "frontend 的 OPENING_DATE 常數與 /store 倒數，開幕後的顯示要一併確認"),
]

# --check 用：開幕後不該再出現的字眼
RISKY = ["敬請期待", "整裝中", "籌備中", "尚未營運", "等不及開幕", "屆時公告",
         "屆時提供", "屆時有", "開幕後", "開幕前", "開幕當天一起上機"]


def main():
    apply_ = "--apply" in sys.argv
    if "--check" in sys.argv:
        import glob, re
        hits = 0
        for fn in sorted(glob.glob("*.html")):
            for i, line in enumerate(io.open(fn, encoding="utf-8"), 1):
                for w in RISKY:
                    if w in line:
                        print("%s:%d  含「%s」" % (fn, i, w)); hits += 1; break
        print("\n合計 %d 行含開幕後風險字眼" % hits)
        return

    total = 0
    for fn, pairs in RULES:
        if not os.path.exists(fn):
            print("!! 找不到 %s，跳過" % fn); continue
        t = io.open(fn, encoding="utf-8").read(); orig = t
        for old, new in pairs:
            n = t.count(old)
            if n == 0:
                print("!! %s 找不到（可能已改過或文案變動）：%s" % (fn, old[:40])); continue
            print("   %s ×%d  %s" % (fn, n, old[:46].replace("\n", "")))
            t = t.replace(old, new); total += n
        if apply_ and t != orig:
            io.open(fn, "w", encoding="utf-8").write(t); print("== 已寫入 %s" % fn)

    print("\n共 %d 處%s。" % (total, "已改" if apply_ else "可改（dry-run，加 --apply 才會寫檔）"))
    print("\n【需老闆拍板，本腳本不動】")
    for where, what in NEEDS_OWNER:
        print("  - %s：%s" % (where, what))
    print("\n改完記得：cd ~/goshoot/site && 指名檔案 git add → commit → fetch+rebase → push → curl 線上驗證")


if __name__ == "__main__":
    main()
