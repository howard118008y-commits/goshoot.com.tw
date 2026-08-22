#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""開幕日（2026-08-25）官網文案切換。

背景：站上有一批措辭在開幕前正確、開幕後就變錯——「敬請期待」「整裝中」
「籌備中、尚未營運」「開幕後○○」「等不及開幕」「屆時○○」之類。
純粹陳述「2026 年 8 月 25 日開幕」的句子不算錯，本腳本刻意不動它們
（唯二例外：老闆 2026-08-22 拍板的 store.html 與六篇文末導購 H2，見下）。

用法：
    python3 .github/opening_day_copy.py            # dry-run，只列出會改什麼
    python3 .github/opening_day_copy.py --apply    # 實際寫檔
    python3 .github/opening_day_copy.py --check    # 只掃殘留風險字眼

2026-08-22 老闆拍板納入本腳本：
  1. store.html hero／meta description／twitter:title／JSON-LD 的「8/25 開幕」→「已開幕」
  2. 五篇娃娃機文＋順遊文的文末導購 H2「8/25 開幕」→「已開幕」
  3. 營業時間措辭統一為「24 小時營業・全年無休」（原「8/25 起 24 小時營業」）
  4. goshoot-mobile.html 已於 2026-08-22 刪檔（全站零連結、不在 sitemap），規則整塊移除
  5. screen.html 店內螢幕 fallback 已改成不過期措辭，不需開幕日切換

⚠️ 仍需老闆拍板的列在 NEEDS_OWNER，本腳本不會自動改，只會印出來提醒。
"""
import io, os, re, sys

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
   # 手機版店內賽事卡（原「8/25 開幕後開打」）
   ('<div class="gsm-d" style="color:#FFB2A0">8/25 開幕後開打</div>',
    '<div class="gsm-d" style="color:#FFB2A0">每週六・現場開打</div>'),
   # 老闆 2026-08-22 拍板：營業時間措辭
   ("8/25 起 24 小時營業", "24 小時營業・全年無休"),
 ]),
 ("store.html", [
   # 老闆 2026-08-22 拍板：store.html 全面改「已開幕」
   ("，2026/8/25 開幕。附店內實拍", "，已於 2026/8/25 開幕。附店內實拍"),
   ('content="Go Shoot 中和門市・8/25 開幕"', 'content="Go Shoot 中和門市・已開幕"'),
   ("、捷運中和站旁，2026 年 8 月 25 日開幕。", "、捷運中和站旁，已於 2026 年 8 月 25 日開幕。"),
   ('aria-label="Go Shoot 中和門市 8/25 開幕"', 'aria-label="Go Shoot 中和門市・已開幕"'),
   ("<h2>中和捷運站旁<br>8/25 開幕</h2>", "<h2>中和捷運站旁<br>已開幕</h2>"),
 ]),
 ("article-what-is-goshoot.html", [
   ("2026 年 8 月 25 日正式開幕，屆時提供 24 小時娃娃機與戰鬥陀螺對戰區，開幕前仍在籌備中。",
    "已於 2026 年 8 月 25 日正式開幕，提供 24 小時娃娃機與戰鬥陀螺對戰區。"),
   ("2026 年 8 月 25 日正式開幕，屆時有 24 小時娃娃機與戰鬥陀螺對戰區，開幕前仍在籌備中。",
    "已於 2026 年 8 月 25 日正式開幕，設有 24 小時娃娃機與戰鬥陀螺對戰區。"),
   ("門市開幕後可親自到中和店取貨，順便逛娃娃機、上賽場試打陀螺（門市籌備中、8/25 開幕）。",
    "可親自到中和門市取貨，順便逛娃娃機、上賽場試打陀螺（門市已開幕）。"),
   ("實體店<strong>2026 年 8 月 25 日正式開幕</strong>，開幕後規劃：娃娃機與戰鬥陀螺對戰區皆 24 小時營業。目前仍在籌備中，尚未營運。",
    "實體店已於<strong>2026 年 8 月 25 日正式開幕</strong>，娃娃機與戰鬥陀螺對戰區皆 24 小時營業。"),
   ("中和門市 8/25 開幕，屆時能來玩娃娃機、上賽場打陀螺",
    "中和門市已於 8/25 開幕，能來玩娃娃機、上賽場打陀螺"),
 ]),
 ("article-beyblade-how-to-play.html", [
   ("Go Shoot 中和門市 8/25 開幕，規劃有戰鬥陀螺對戰區（24 小時開放）與不定時店內賽事，開幕後歡迎來現場開打。",
    "Go Shoot 中和門市已開幕，設有戰鬥陀螺對戰區（24 小時開放）與不定時店內賽事，歡迎來現場開打。"),
   ("自取，開幕後還能到戰鬥陀螺對戰區當場試打。", "自取，也能順道到戰鬥陀螺對戰區當場試打。"),
 ]),
 ("article-beyblade-ux10-customize.html", [
   ("Go Shoot 中和門市 2026 年 8 月 25 日開幕後，到對戰賽場實打最快。",
    "Go Shoot 中和門市已開幕，到對戰賽場實打最快。"),
   ("Go Shoot 中和門市 8/25 開幕後，到對戰賽場實打最快。",
    "Go Shoot 中和門市已開幕，到對戰賽場實打最快。"),
   # --check 抓不到（「開幕</strong>後」被標籤切斷），但開幕後同樣讀起來像未來式
   ("<strong>Go Shoot 中和門市 8/25 開幕</strong>後，對戰賽場可實測配裝",
    "<strong>Go Shoot 中和門市已開幕</strong>，對戰賽場可實測配裝"),
 ]),
 ("article-beyblade-ux20-valkyrie.html", [
   ("建議等 Go Shoot 中和門市 8/25 開幕後先試打再入手。",
    "建議先到 Go Shoot 中和門市試打再入手。"),
 ]),
 ("article-claw-machine-tips.html", [
   ("<strong>2026 年 8 月 25 日開幕</strong>。開幕後歡迎來現場練夾功。",
    "已於<strong>2026 年 8 月 25 日開幕</strong>。歡迎來現場練夾功。"),
   ("2026 年 8 月 25 日開幕。開幕前可先玩線上一番賞，手機免下載、24 小時隨時抽、每抽必中。",
    "已於 2026 年 8 月 25 日開幕。不方便出門也能玩線上一番賞，手機免下載、24 小時隨時抽、每抽必中。"),
   ("2026 年 8 月 25 日開幕。開幕前可先玩線上一番賞。",
    "已於 2026 年 8 月 25 日開幕。不方便出門也能玩線上一番賞。"),
   ("Go Shoot 中和 24H 娃娃機店，8/25 開幕</h2>", "Go Shoot 中和 24H 娃娃機店，已開幕</h2>"),
 ]),
 ("article-claw-machine-terms.html", [
   ("等不及開幕想先玩？", "不想出門也能玩？"),
   ("來 Go Shoot 中和 24H 娃娃機店實際玩（8/25 開幕）</h2>",
    "來 Go Shoot 中和 24H 娃娃機店實際玩（已開幕）</h2>"),
 ]),
 ("article-korean-claw-machine.html", [
   ("Go Shoot 中和 24H 娃娃機店，8/25 開幕</h2>", "Go Shoot 中和 24H 娃娃機店，已開幕</h2>"),
 ]),
 ("article-unmanned-claw-machine-store.html", [
   ("Go Shoot 中和 24H 娃娃機店，8/25 開幕</h2>", "Go Shoot 中和 24H 娃娃機店，已開幕</h2>"),
 ]),
 ("article-claw-machine-rules.html", [
   ("Go Shoot 中和 24H 娃娃機店，8/25 開幕</h2>", "Go Shoot 中和 24H 娃娃機店，已開幕</h2>"),
 ]),
 ("article-zhonghe-jingping-guide.html", [
   ("等不及開幕？", "想先在線上玩？"),
   ("中獎可宅配到府或開幕後到門市自取", "中獎可宅配到府或到門市自取"),
   ("2026年8月25日開幕。開幕前可先玩線上一番賞，手機免下載、每抽必中。",
    "已於2026年8月25日開幕。不方便出門也能玩線上一番賞，手機免下載、每抽必中。"),
   ("2026 年 8 月 25 日開幕。開幕前可以先玩線上一番賞。",
    "已於 2026 年 8 月 25 日開幕。不方便出門也能玩線上一番賞。"),
   ("Go Shoot 中和門市，8/25 開幕</h2>", "Go Shoot 中和門市，已開幕</h2>"),
 ]),
 ("rental.html", [
   ("門市 2026 年 8 月 25 日開幕，現在開放預訂台位，開幕當天一起上機。",
    "門市已於 2026 年 8 月 25 日開幕，台位持續開放預訂，洽詢後即可進駐上機。"),
 ]),
]

# 需要老闆拍板才能改的（本腳本不動）
NEEDS_OWNER = [
 ("app（另一個 repo）", "frontend 的 OPENING_DATE 常數與 /store 倒數，開幕後的顯示要一併確認"),
]

# ── 2026-08-23 補：通用形 ────────────────────────────────────────────────
# 上面的 RULES 是逐句 exact 比對，只涵蓋 48 處；全站另有約 60 處同樣在開幕後
# 讀成未來式的寫法（「中和門市（8/25 開幕）自取」「即將開幕」「2026 年 8 月 25 日開幕」），
# 舊版 --check 的字串清單抓不到它們，跑完會回報 0 卻仍有殘留。以下用通用規則掃全站 *.html。
# ⚠️ 順序有意義：帶年份的先補「已於」，最後才輪到裸的「8/25 開幕」。
# ⚠️ index.html 的「中和門市 8/25 開幕・倒數 N 天」是 JS 即時計算（d<=0 自己會換句），
#    一律用 (?!・倒數) 排除，不要改成靜態文字。
GENERIC = [
 (re.compile(r"即將開幕"), "已開幕"),
 (re.compile(r"（8/25 開幕）"), "（已開幕）"),
 (re.compile(r"娃娃機 8/25 開幕"), "娃娃機・已開幕"),

]

BARE_RE = re.compile(r"(?<![0-9/]) ?8/25 開幕(?!・倒數)")  # 連前面空格一起吃，否則變「門市 已開幕」

DATE_RE = re.compile(r"2026\s*年\s*8\s*月\s*25\s*日開幕|2026/8/25 開幕")


def _has_yiyu(t, at):
    """看前 20 字（去掉 HTML 標籤）有沒有『已於』——避免重複加。"""
    return "已於" in re.sub(r"<[^>]+>", "", t[max(0, at - 20):at])


def add_yiyu(t):
    """「2026 年 8 月 25 日開幕」→「已於 2026 年 8 月 25 日開幕」。"""
    out, last, n = [], 0, 0
    for m in DATE_RE.finditer(t):
        out.append(t[last:m.start()])
        if _has_yiyu(t, m.start()):
            out.append(m.group(0))
        else:
            out.append("已於 " + m.group(0)); n += 1
        last = m.end()
    out.append(t[last:])
    return "".join(out), n


def sub_bare(t):
    """裸的「8/25 開幕」→「已開幕」；前面已經有「已於」的不動（否則變「已於已開幕」）。"""
    out, last, n = [], 0, 0
    for m in BARE_RE.finditer(t):
        out.append(t[last:m.start()])
        if "已於" in t[max(0, m.start() - 6):m.start()]:
            out.append(m.group(0))
        else:
            out.append("已開幕"); n += 1
        last = m.end()
    out.append(t[last:])
    return "".join(out), n


def run_generic(texts):
    """對 texts（檔名→內容，已套過 RULES）就地套通用規則。回傳處數。"""
    total = 0
    for fn in sorted(texts):
        t = texts[fn]; hits = 0
        for rx, new in GENERIC:
            t, n = rx.subn(new, t); hits += n
        t, n = sub_bare(t); hits += n
        t, n = add_yiyu(t); hits += n
        if hits:
            print("   [通用] %s ×%d" % (fn, hits)); total += hits
        texts[fn] = t
    return total


# --check 用：開幕後不該再出現的字眼（純字串）
RISKY = ["敬請期待", "整裝中", "籌備中", "尚未營運", "等不及開幕", "屆時",
         "開幕後", "開幕前", "開幕當天一起上機", "即將開幕"]
# --check 用：正規式（裸日期／裸 8/25，排除 JS 倒數與已補「已於」者）
RISKY_RE = []  # 裸 8/25 改用 BARE_RE 逐處判斷（見 do_check）


def do_check():
    import glob
    hits = 0
    for fn in sorted(glob.glob("*.html")):
        t = io.open(fn, encoding="utf-8").read()
        for i, line in enumerate(t.split("\n"), 1):
            hit = None
            for w in RISKY:
                if w in line:
                    hit = w; break
            if not hit:
                for label, rx in RISKY_RE:
                    if rx.search(line):
                        hit = label; break
            if not hit:
                for m in BARE_RE.finditer(line):
                    if "已於" not in line[max(0, m.start() - 6):m.start()]:
                        hit = "8/25 開幕"; break
            if not hit:
                for m in DATE_RE.finditer(line):
                    if not _has_yiyu(line, m.start()):
                        hit = "未加「已於」的開幕日期"; break
            if hit:
                print("%s:%d  含「%s」" % (fn, i, hit)); hits += 1
    print("\n合計 %d 行含開幕後風險字眼" % hits)
    return hits


def main():
    import glob
    apply_ = "--apply" in sys.argv
    if "--check" in sys.argv:
        sys.exit(1 if do_check() else 0)

    # ⚠️ 全部先讀進記憶體再依序套 RULES → 通用規則，最後才寫檔。
    #    這樣 dry-run 與 --apply 走的是同一條路，處數不會對不起來。
    texts = {fn: io.open(fn, encoding="utf-8").read() for fn in sorted(glob.glob("*.html"))}
    orig = dict(texts)

    total = 0
    for fn, pairs in RULES:
        if fn not in texts:
            print("!! 找不到 %s，跳過" % fn); continue
        t = texts[fn]
        for old, new in pairs:
            n = t.count(old)
            if n == 0:
                print("!! %s 找不到（可能已改過或文案變動）：%s" % (fn, old[:40])); continue
            print("   %s ×%d  %s" % (fn, n, old[:46].replace("\n", "")))
            t = t.replace(old, new); total += n
        texts[fn] = t

    print("\n--- 通用規則（全站 *.html）---")
    total += run_generic(texts)

    if apply_:
        for fn in sorted(texts):
            if texts[fn] != orig[fn]:
                io.open(fn, "w", encoding="utf-8").write(texts[fn]); print("== 已寫入 %s" % fn)

    print("\n共 %d 處%s。" % (total, "已改" if apply_ else "可改（dry-run，加 --apply 才會寫檔）"))
    print("\n【需老闆拍板，本腳本不動】")
    for where, what in NEEDS_OWNER:
        print("  - %s：%s" % (where, what))
    print("\n改完記得：cd ~/goshoot/site && 指名檔案 git add → commit → fetch+rebase → push → curl 線上驗證")


if __name__ == "__main__":
    main()
