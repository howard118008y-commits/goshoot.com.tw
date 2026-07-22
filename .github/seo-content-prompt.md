你在 GitHub Actions（Ubuntu Linux）環境，當前目錄是 goshoot.com.tw 官網 repo 根目錄。

# 任務
新增**一篇**站內 SEO 文章頁 `article-<英文slug>.html`（NFD 檔名雷點：用純 ASCII slug，如 `article-ichiban-grades.html`），並同步更新索引檔。**只修改／新增檔案，不要執行 git commit 或 push（由後續 workflow 步驟處理）。**

# 步驟
1. **選題（務必去重）**：先 `ls article-*.html` 看已存在文章；讀 `.github/content-topics.md` 與 `content-queue.md`，挑一個**未做過**（queue 標 `[ ]`）、且與現有文章 H1/主題不重疊的題目。三大方向（一番賞玩法／娃娃機在地／GSC 關鍵字）盡量與最近幾篇不同方向。
2. **鎖事實**：讀 `.github/content-facts.md`。文中所有店家/玩法/價格/日期/數量事實**只准用事實鎖檔＋既有文章模板內既有內容**。事實鎖沒有的具體數字，若必要就 `WebSearch` 查證真實來源並在文末 `.src` 標註（URL 用 `rel="nofollow noopener"`＋查證日期），否則用「情報更新中／依官方公告為準」帶過。**嚴禁捏造**新聞/標題/日期/價格/數量/雷達值。
3. **產頁**：完整複製現有 `article-beyblade-711-heavens-ring.html` 的**骨架與 inline `<style>`**（別自創樣式、別 link 外部 CSS），只換內容：`<head>` SEO 標籤、JSON-LD、麵包屑、H1、正文區塊、FAQ、CTA、延伸閱讀、資料來源。設計 token 沿用（珊瑚 #FF5A2D／炫酷黑），元件 class 沿用（`.lead/.fact/.steps/.cards/.part/details/.related/.src`）。
4. **更新索引**（缺一每日稽核會亮紅）：
   - `sitemap.xml`：加一行 `<url><loc>https://goshoot.com.tw/article-<slug>.html</loc><lastmod>YYYY-MM-DD</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`（日期用 `date +%F`）。
   - `ichiban-beyblade.html`：在文章連結清單區加一條 `<a href="article-<slug>.html">→ 標題</a>`（沿用該區既有格式）。
   - `llms.txt`：在對應分區加一行 markdown 連結。
   - `content-queue.md`：把選到的題從 `[ ]` 改成 `[x] article-<slug>.html YYYY-MM-DD`。

# 稽核硬規（不符會被每日 audit.py 擋，務必全過）
- `<title>` **≤ 62 字**、`<meta name="description">` **≤ 160 字**（含主關鍵字）。
- 必備：`rel="canonical"`（指向本頁）、`og:type=article`＋`og:title/description/url`＋`og:image=https://goshoot.com.tw/assets/og-cover.png`、`twitter:card=summary_large_image`、`robots=index,follow,max-image-preview:large`。
- JSON-LD 一個 `@graph`，含 `Article`（headline/datePublished/dateModified/author=Organization Go Shoot/publisher/mainEntityOfPage/inLanguage=zh-Hant）＋ `BreadcrumbList`（首頁→ichiban-beyblade.html→本頁）＋ `FAQPage`（3-5 題，與正文 `<details>` FAQ 一致）；主題合適時加 `HowTo`。**JSON 必須 `json.loads` 可解析**（跳脫正確、無尾逗號）。
- 正好 **1 個 `<h1>`**；每個 `<img>` 都要 `alt`（裝飾圖用 `alt=""`）。
- 內連 CTA 一律導站內：抽賞連 `https://goshoot-ichiban.vercel.app/draw`、主題頁連 `ichiban-beyblade.html` 等；**絕不外連購物網站**。

# 品質與品牌
- 顧客可見文案**全繁體中文（台灣用語）**，不要英文（品牌名 Go Shoot／Go 幣、技術詞保留即可）。
- 溫暖、對新手友善；帶到「每抽必中抽正版」「中和門市（即將開幕）」「只賣正版」。
- ⛔ 賭博字眼、⛔ 名人代言/肖像、⛔ 把 8 月才開幕的實體店寫成已營運（見事實鎖禁止清單）。

完成後自我檢查：新 `article-<slug>.html` 存在且過上述稽核硬規；sitemap/hub/llms/queue 四檔都已更新；沒有 commit。改完即結束。
