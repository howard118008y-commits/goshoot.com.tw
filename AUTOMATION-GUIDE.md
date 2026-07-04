# 雲端自動化指南（GitHub Actions）

把「定時要做的事」從你的電腦搬到 GitHub 雲端跑。時間到自動執行、**電腦關機也照跑**。
可直接複製到任何 repo。兩個範本在 [.github/templates/](.github/templates/)。

---

## 為什麼用雲端，不用本機排程（launchd / cron）

| | 本機 | GitHub Actions（雲端） |
|---|---|---|
| 電腦要開著 | 要 | **不用** |
| 權限雷 | 多（如 macOS 不讓排程存取 iCloud） | 幾乎沒有 |
| 費用 | 免費但不可靠 | 免費額度很夠 |
| 看紀錄 | 翻本機 log | 網頁 Actions 分頁一目了然 |
| 失敗通知 | 要自己寫 | **內建 email** |

---

## 一個排程 workflow 的骨架（五個部位）

檔案放 `.github/workflows/名字.yml`，push 上去就生效：

```yaml
name: 這個排程叫什麼
on:                          # ① 什麼時候跑
  schedule:
    - cron: '0 4 * * *'      #    UTC 時間！台灣要 -8（台灣中午 12:00 = 04）
  workflow_dispatch: {}       #    ＋這行 = 也能在網頁手動按 Run 測試
permissions:
  contents: write            # ② 要改/commit repo 就 write，只讀就 read
jobs:
  do-it:
    runs-on: ubuntu-latest   # ③ 借一台雲端 Linux
    steps:
      - uses: actions/checkout@v4   # ④ 把 repo 抓下來
      - run: python 做事.py          # ⑤ 做事
```

---

## 最重要的決策：純腳本 還是 叫 AI？

> **有明確規則 → 純腳本。需要判斷/挑選/寫東西 → 叫 Claude。**

### A. 純腳本（便宜、可靠、免金鑰）— 適合「檢查/監測」
沒事 `exit 0` 安靜通過；有問題 `exit 1` → **workflow 失敗、GitHub 自動 email 通知你**。
- 範本：[.github/templates/monitor-workflow.yml](.github/templates/monitor-workflow.yml)
- 真實例：[.github/workflows/daily-site-audit.yml](.github/workflows/daily-site-audit.yml) + [.github/audit.py](.github/audit.py)（每日檢查 41 頁 SEO＋線上健康）

### B. Claude 判斷型（要思考/創意）— 適合「挑內容、寫文案、看圖、改檔」
workflow 裡裝 Claude CLI，餵一個指令檔，讓它自主完成再自動 commit。需要 API 金鑰。
- 範本：[.github/templates/claude-task-workflow.yml](.github/templates/claude-task-workflow.yml)
- 真實例：[.github/workflows/update-beyblade-news.yml](.github/workflows/update-beyblade-news.yml) + [.github/beyblade-news-prompt.md](.github/beyblade-news-prompt.md)（每週挑新聞、下載封面圖、更新卡片）

### 再一條安全規則
會**自動改上線內容**的：
- **低風險**（換新聞卡）→ 可放手自動改。
- **高風險**（改 SEO、改程式）→ **寧可只「偵測＋通知」，修正留人工**。（所以每日稽核做成只通知、不自動改。）

---

## 關鍵機制（套別專案會用到）

1. **金鑰**：放 repo → Settings → Secrets and variables → Actions，程式用 `${{ secrets.名字 }}` 取。**絕不寫進程式碼**。
2. **失敗＝免費通知**：workflow `exit 1` 就會寄信給你。監測型讓它出事時失敗即可。
3. **自動存回 repo**：`permissions: contents: write` ＋ 最後 `git commit && git push`，用內建 `GITHUB_TOKEN`，免另設認證。（GitHub Pages 會因此自動重新部署。）
4. **時區**：cron 是 **UTC**，台灣 -8。台灣中午=`0 4`、台灣週一早上10點=`0 2 * * 1`。
5. **一定留 `workflow_dispatch`**：能在 Actions 分頁手動測，或 `gh workflow run "名字" -R 帳號/repo`。別等排程才發現壞掉。

---

## 踩雷提醒
- **別「本機排程 ＋ iCloud 檔案」**：macOS 不讓 launchd 存取 iCloud，會**默默失敗**。
- **排好 ≠ 有在跑**：一定要驗證（看退出碼／手動觸發一次），別以為註冊了就成功。

---

## 複製到新專案的 SOP
1. 想清楚：**多久跑一次**、**純腳本還是要 AI**、**要不要改 repo**。
2. 從 [.github/templates/](.github/templates/) 複製對應範本到 `.github/workflows/`，改 name、cron（換 UTC）、要跑的東西。
3. 純腳本 → 把腳本也放 repo；要 AI → 放指令 `.md` ＋ Secrets 加 `ANTHROPIC_API_KEY`。
4. push → Actions 分頁按 **Run workflow** 手動測一次 → 綠了才信任排程。
