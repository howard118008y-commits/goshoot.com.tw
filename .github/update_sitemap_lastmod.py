#!/usr/bin/env python3
"""sitemap.xml 的 <lastmod> 以 git 最後 commit 日自動校時。

2026-08-19 老闆指示：lastmod 不再手動填。20 筆停在 6/30、實檔 8/14 改過，
Google 重抓訊號整批失真。本腳本由 GitHub Actions（sitemap-lastmod.yml）
在 push 與每週排程時跑；本機也可直接執行。
需要完整 git 歷史（Actions 要 fetch-depth: 0），shallow clone 會拿到錯日期。
"""
import re
import subprocess
import sys

SITEMAP = "sitemap.xml"
ORIGIN = "https://goshoot.com.tw"


def git_lastmod(path: str) -> str | None:
    out = subprocess.run(["git", "log", "-1", "--format=%cs", "--", path],
                         capture_output=True, text=True).stdout.strip()
    return out or None


def main() -> int:
    src = open(SITEMAP, encoding="utf-8").read()
    changed = []

    def repl(m: re.Match) -> str:
        loc, old = m.group(1), m.group(2)
        path = loc[len(ORIGIN):].lstrip("/") or "index.html"
        new = git_lastmod(path)
        if not new:
            print(f"⚠️ git 查不到 {path}，lastmod 保留 {old}")
            return m.group(0)
        if new != old:
            changed.append(f"{path}: {old} → {new}")
        return m.group(0).replace(f"<lastmod>{old}</lastmod>",
                                  f"<lastmod>{new}</lastmod>")

    updated = re.sub(r"<loc>(.*?)</loc><lastmod>(\d{4}-\d{2}-\d{2})</lastmod>",
                     repl, src)
    if changed:
        open(SITEMAP, "w", encoding="utf-8").write(updated)
        print(f"更新 {len(changed)} 筆：")
        for c in changed:
            print("  -", c)
    else:
        print("lastmod 全數同步，無需更新")
    return 0


if __name__ == "__main__":
    sys.exit(main())
