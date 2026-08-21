你在 GitHub Actions（Ubuntu Linux）環境，當前目錄是 goshoot.com.tw 網站 repo 根目錄。

任務：更新 `index.html` 首頁「戰鬥陀螺情報」區（`id="products"`）裡的 **4 張 `.newscard`**，換成最新的戰鬥陀螺 Beyblade X 新聞。**只修改檔案，不要執行 git commit 或 push（由後續 workflow 步驟處理）。**

鐵則：
- 一律用 WebSearch 找到的**真實文章**，嚴禁捏造新聞、標題、日期或圖片。
- 保持正好 4 張 `.newscard`；主題盡量多元（新品 / 限定 / 賽事 / 遊戲）。
- **絕不更動** `id="products"` 區塊頂部的 `.news-notice`「正版聲明」橫幅——那是固定內容，只換下方 4 張新聞卡。

步驟：
1. WebSearch 找 4 則最新、主題不同的 Beyblade X／戰鬥陀螺新聞。優先台灣中文來源：oneone宇宙（universe.oneone.com.tw）、NOWnews、4Gamers、巴哈姆特 GNN、U-ACG。盡量與卡片上目前的不同，保持新鮮。
2. 對每則文章 URL 取 og:image：
   ```
   curl -sL -m20 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605 Safari/605" "<文章URL>" | grep -ioE '<meta[^>]+property="og:image"[^>]*content="[^"]+"' | head -1
   ```
3. 逐一下載並用 ImageMagick 縮圖到 `assets/news/news-1.jpg` ~ `news-4.jpg`：
   ```
   curl -sL -m30 -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605 Safari/605" "<og:image網址>" -o /tmp/n1 && convert /tmp/n1 -resize 700x -quality 82 assets/news/news-1.jpg
   ```
   下載後**務必用 Read 工具逐一看圖，確認每張圖與它對應的新聞標題相符**（曾發生圖文錯置）。某站防盜連或抓不到圖，就換另一則新聞。
4. 更新 `index.html` 中 `<div class="news">` 內的 4 張 `.newscard`，每張改：
   - 外層 `<a>` 的 `href` = 文章連結
   - `<img>` 的 `src` 對應 `news-N.jpg`、`alt` = 標題
   - `.news-tag` 文字（新品／限定／賽事／遊戲）與外層 `.news-top` 的色 class（`nt-new` 珊瑚／`nt-ltd` 深／`nt-sky` 藍／`nt-game` 金）
   - `.news-title` = 一句標題、`.news-meta` = 一句重點、`.news-src` = 「來源 ・ 看詳情 →」
   - **⚠️ 同一支 `index.html` 內還有一組手機版新聞卡（`class="gsm-newscard"`，在 `<!-- ═══ 手機版完整站 ═══ -->` 之後），媒體查詢分流給手機使用者看，用的是同一批 `news-N.jpg` 圖檔。四張 `.gsm-newscard` 必須與桌機四張 `.newscard` 同步成相同的 href／alt／標題／重點／來源**（結構是 `<h3>` 標題、`.gsm-meta` 重點、`.gsm-src` 來源、`.gsm-ntag` 標籤）。**只更新桌機那組會造成手機版圖文不符**（2026-08-22 實際發生過：手機卡停在 7 月舊聞，圖卻已被換成新的）。
5. **偵測大熱點＋草擬社群貼文**（品牌加值）：評估這批新聞（或當前戰鬥陀螺話題）有沒有「破圈級大熱點」。判準：**名人／藝人涉入、病毒式話題、全國賽事冠軍、重大缺貨／搶購潮**等能吸引核心圈外一般人的新聞（一般新品/改版不算）。
   - **有熱點** → 在 repo 根目錄 `SOCIAL-DRAFTS.md` 的**最上方**（既有內容往下推、newest 在上）插入一段：
     - 標題行：`## YYYY-MM-DD ・〔熱點一句話〕`（日期用 `date +%F`）
     - 接著三則可直接複製的社群貼文草稿：**Threads / IG / FB 各一**，每則用 ``` 圍起來。
     - 口吻照 Go Shoot 品牌：溫暖、對新手友善；帶到「線上一番賞每抽必中抽正版」「中和門市可試打」「只賣正版拒絕盜版」；結尾附相關頁連結（有對應熱點文就連它，否則連 `article-beyblade-ichiban-guide.html` 或 `ichiban-beyblade.html`）。IG 版附 hashtag。
     - **禁**：暗示名人代言、用其肖像、賭博字眼（賭／穩賺／保證中大獎）。可參考檔內既有的博恩那段當格式範例。
   - **沒熱點** → 在 `SOCIAL-DRAFTS.md` 最上方插入一行：`## YYYY-MM-DD ・本週無特別熱點（維持常規新聞）`。
   - 只改 `SOCIAL-DRAFTS.md`，別動其他檔。
6. **更新「新品發售追蹤」區（`id="releases"`）**：這區追蹤三個品類的官方發售消息＋購買連結，每列是一個 `.rel`。
   - WebSearch 查證三類最新發售情報：
     a. **戰鬥陀螺**官方新品（查 `Beyblade X 新品 發售` / oneone宇宙／官方）
     b. **寶可夢一番賞**新彈（查 `寶可夢 一番賞 新彈 發售`）
     c. **皮克敏**一番賞／新品（查 `皮克敏 一番賞 新品`）
   - 維持 **5～7 列 `.rel`**，照發售日近→遠排序（已開賣的現行彈放「抽賞中」）。每列更新：
     - `.rel-date`：`<b>月/日或月份</b><span>年份或狀態</span>`
     - `.rel-tag` 品類 class：`rt-bey` 陀螺／`rt-pok` 寶可夢／`rt-pik` 皮克敏
     - `.rel-name` 品名、`.rel-sub` 一句重點（站內有對應情報頁就內連）
     - `.rel-st` 狀態 chip：`st-pre` 可預約代購／`st-soon` 即將發售・新品情報・情報公開。**⛔ 嚴禁任何庫存/銷售暗示字眼：「現貨」「熱賣」「熱銷」「熱抽中」「抽賞中」「開抽」一律不准寫**（門市庫存由老闆手動管理，本區只做情報）。
     - `.rel-cta` **連結一律連站內、文案一律中性**：只准「情報 →」「了解更多 →」兩種（用 `rel-cta alt` 樣式），連對應情報頁（陀螺→`article-beyblade-*.html` 或 `ichiban-beyblade.html`；寶可夢→`ichiban-pokemon.html`；皮克敏→`ichiban-pikmin.html`）；未上市品可用「預約代購 →」連 `#preorder`。**絕不外連購物網站，絕不寫「看現貨」「抽○○賞」類 CTA。**
   - 過期處理：發售日已過的列，狀態改「已上市」或移除換新情報。日期不確定就寫月份並標「情報公開」，**嚴禁捏造確切日期**。
   - **⚠️ 手機版同區同步**：`index.html` 手機版另有一組 `class="gsm-rel"`（`.gsm-rel-list` 內），欄位對應 `.gsm-date` / `.gsm-rtag`（`gsm-rt-bey`／`gsm-rt-pok`／`gsm-rt-pik`）/ `.gsm-name` / `.gsm-sub` / `.gsm-st`。**內容與狀態字樣必須與桌機 `.rel` 同步**，同樣適用上面的禁用字眼與過期處理規則。
   - **⛔ 絕對禁區：「主打預告」區塊（`id="featured-drop"` 與手機版 `id="gsm-featured-drop"`，HTML 註解標明「老闆手動管理」）整段不准讀改動刪**，它不屬於本任務範圍。
7. 完成後自我檢查：`index.html` 仍有正好 4 個 `class="newscard"` **與 4 個 `class="gsm-newscard"`**、1 個 `class="news-notice"`、5–7 個 `class="rel"` **與相同列數的 `class="gsm-rel"`**（含 `id="releases"` 區塊完整）；桌機與手機兩組的標題／連結逐張比對一致；4 張 news 圖片內容不重複。不要 commit，改完檔案即可結束。
