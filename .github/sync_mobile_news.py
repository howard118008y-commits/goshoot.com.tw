#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 index.html 桌機版 4 張 .newscard 的內容同步到手機版 4 張 .gsm-newscard。

為什麼需要這支：index.html 內同時放了桌機版與手機版（2026-08-02「手機版轉正」後
用媒體查詢分流），兩邊各有一組新聞卡，但共用同一批 assets/news/news-1~4.jpg。
自動新聞流程若只改桌機那組，手機使用者會看到「舊標題配新圖」的圖文不符
（2026-08-22 實際發生）。這支腳本讓同步變成確定性步驟，不依賴模型記得。

用法：python3 .github/sync_mobile_news.py [--check]
      --check 只檢查是否同步，不寫檔；不同步時 exit 1。
"""
import io, re, sys

PATH = "index.html"

DESK_RE = re.compile(
    r'<a class="newscard" href="(?P<href>[^"]*)"[^>]*>\s*'
    r'<div class="news-top [^"]*"><img src="(?P<img>[^"]*)" alt="(?P<alt>[^"]*)"[^>]*>'
    r'<span class="news-tag">(?P<tag>[^<]*)</span></div>\s*'
    r'<div class="news-body">\s*'
    r'<div class="news-title">(?P<title>.*?)</div>\s*'
    r'<div class="news-meta">(?P<meta>.*?)</div>\s*'
    r'<div class="news-src">(?P<src>.*?)</div>\s*'
    r'</div>\s*</a>', re.S)

MOB_RE = re.compile(
    r'<a class="gsm-newscard" href="[^"]*"[^>]*>\s*'
    r'<div class="gsm-top"><img src="[^"]*" alt="[^"]*"[^>]*>'
    r'<span class="gsm-ntag">[^<]*</span></div>\s*'
    r'<div class="gsm-body"><h3>.*?</h3><div class="gsm-meta">.*?</div>'
    r'<span class="gsm-src">.*?</span></div>\s*</a>', re.S)


def mobile_card(d):
    # 桌機來源寫「oneone宇宙 ・ 看詳情 →」，手機版慣例是「oneone宇宙・看詳情 →」
    src = re.sub(r'\s*・\s*看詳情\s*→\s*$', '', d['src']).strip()
    return (
        '<a class="gsm-newscard" href="%(href)s" target="_blank" rel="noopener">\n'
        '      <div class="gsm-top"><img src="%(img)s" alt="%(alt)s" loading="lazy">'
        '<span class="gsm-ntag">%(tag)s</span></div>\n'
        '      <div class="gsm-body"><h3>%(title)s</h3>'
        '<div class="gsm-meta">%(meta)s</div>'
        '<span class="gsm-src">%(src)s・看詳情 →</span></div>\n'
        '    </a>'
    ) % dict(href=d['href'], img=d['img'], alt=d['alt'], tag=d['tag'],
             title=d['title'].strip(), meta=d['meta'].strip(), src=src)


def main():
    check = '--check' in sys.argv
    t = io.open(PATH, encoding='utf-8').read()

    desk = [m.groupdict() for m in DESK_RE.finditer(t)]
    mob = list(MOB_RE.finditer(t))
    if len(desk) != 4:
        sys.exit("桌機 .newscard 解析到 %d 張，預期 4 張——版型可能改過，先修這支腳本" % len(desk))
    if len(mob) != 4:
        sys.exit("手機 .gsm-newscard 解析到 %d 張，預期 4 張——版型可能改過，先修這支腳本" % len(mob))

    out, last = [], 0
    for m, d in zip(mob, desk):
        out.append(t[last:m.start()]); out.append(mobile_card(d)); last = m.end()
    out.append(t[last:])
    new = ''.join(out)

    if new == t:
        print("已同步，無需變更"); return
    if check:
        sys.exit("手機版新聞卡與桌機版不同步（跑 python3 .github/sync_mobile_news.py 修正）")
    io.open(PATH, 'w', encoding='utf-8').write(new)
    print("已同步 4 張手機版新聞卡：")
    for d in desk:
        print("  - " + d['title'].strip())


if __name__ == '__main__':
    main()
