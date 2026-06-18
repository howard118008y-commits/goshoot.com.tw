# Go Shoot 戰鬥陀螺 ・ 官方網站

中和捷運站旁的戰鬥陀螺專賣店官網。靜態網站（HTML），可部署於 GitHub Pages + Cloudflare。

---

## 📁 檔案結構

```
goshoot_site/
├── index.html            首頁（Hero／三大賣點／賽場／商品／預購／攻略／品牌故事／來店）
├── events.html           賽事與會員制度（賽制／排行榜／Go 幣集點）
├── faq.html              常見問題（含 FAQPage 結構化資料）
├── guide.html            攻略首頁
├── guide-beginner.html   SEO 文｜新手入門
├── guide-tierlist.html   SEO 文｜天梯 Tier List（每月更新）
├── guide-mods.html       SEO 文｜改裝攻略
├── guide-daikou.html     SEO 文｜日本代購情報
├── style.css             全站樣式（品牌色／字型／元件）
├── sitemap.xml           給 Google 索引用
├── robots.txt            爬蟲規則
└── assets/
    ├── site.js           全站設定（LINE／蝦皮／表單／報名連結＋手機選單）★只改這支就能套用全站
    ├── favicon.png       網站圖示（180px）
    ├── favicon-32.png    小尺寸圖示
    ├── apple-touch-icon.png  iOS 加到主畫面圖示
    ├── og-cover.png      社群分享預覽圖（1200×630）
    ├── logo-coral.png    珊瑚底品牌圖示（商品區未放圖時的佔位）
    ├── logo-ink.png      墨黑底品牌圖示
    ├── wordmark-cream.png／wordmark-dark.png  完整字標（淺底／深底）
    ├── emblem-ink.svg／logo.svg  品牌圓徽（向量）
    └── photos/           商品照片放這裡（product-1.jpg ~ product-3.jpg）
```

品牌色：米白 `#FBF6EE`／墨黑 `#262329`／珊瑚 `#FF6A4D`／天青 `#8FCDE0`
字型：Poppins（拉丁）＋ Noto Sans TC（中文）

---

## ✅ 上線前替換清單

### 🔴 必換（缺了按鈕會沒反應）
打開 **`assets/site.js`**，把最上面 4 個連結填上去就好，全站所有按鈕會自動套用（留空白不會壞掉）：

```js
const GOSHOOT_LINKS = {
  line:   "",  // LINE 官方帳號加好友連結
  shopee: "",  // 蝦皮賣場連結
  form:   "",  // 預購表單連結（Tally／Google 表單）
  signup: ""   // 賽事報名連結
};
```

### 🟠 必填
- **營業時間 / 電話**：`index.html` 來店區兩處「（待填）」
- **商品照片**：把 3 張照片放進 `assets/photos/`，命名 `product-1.jpg`～`product-3.jpg` 即自動顯示（未放圖會顯示品牌圖示佔位）
- **預購表單**：`index.html` 預購區 `formbox` 內，可改成你的表單 `<iframe>`（程式碼有範例）

### ✅ 已完成
- **Google 地圖**：來店區已嵌入店址地圖（`新北市中和區景平路593號之1`）
- **Logo／favicon／OG 圖**：已套用真實品牌素材
- **手機選單**：全頁可正常開合

### 🟡 網域相關（買好網域後一次改）
把以下檔案中的 `https://goshoot.com.tw` 換成實際網址：
`sitemap.xml`、`robots.txt`、各頁的 `og:image`

### 🟢 內容維護
- `guide-tierlist.html`：每月更新天梯配置
- 賽事頁／海報數字（NT$50＝1 幣、報名費）可依實際調整

---

## 🚀 部署步驟（GitHub Pages + Cloudflare）

### ① 上傳到 GitHub
1. 新增 repo（例：`goshoot-site`，設 Public）
2. 把本資料夾**內的檔案**上傳到 repo 根目錄
   （是資料夾內容放根目錄，不要多包一層 `goshoot_site/`）

### ② 開啟 GitHub Pages
Settings → Pages → Source 選 `Deploy from a branch` → Branch `main` /`(root)` → 儲存
等 1–2 分鐘，先用 `https://你的帳號.github.io/goshoot-site/` 確認畫面正常。

### ③ 買網域
到 Gandi／Namecheap／GoDaddy 或 .tw 註冊商購買網域。
（建議先到「經濟部智慧財產局商標檢索」確認名稱未踩到他人商標，行銷上勿暗示官方授權。）

### ④ Cloudflare 接管 DNS
1. Cloudflare 加入網站，到註冊商把 Nameserver 改成 Cloudflare 提供的兩組
2. DNS 加紀錄：
   - 四筆 **A**（apex）→ `185.199.108.153` `185.199.109.153` `185.199.110.153` `185.199.111.153`
   - 一筆 **CNAME** `www` → `你的帳號.github.io`
3. SSL/TLS 模式設 **Full**

### ⑤ 綁定自訂網域 + HTTPS
1. GitHub Settings → Pages → Custom domain 填你的網域（會自動建立 `CNAME` 檔）
2. 勾選 **Enforce HTTPS**（憑證簽發需數分鐘到一小時）

### ⑥ 換掉網域佔位
網域確定後，把 `https://goshoot.com.tw` 全部換成實際網址並重新上傳。

### ⑦ 讓 Google 找到你
1. Google Search Console 加入網域，提交 `sitemap.xml`
2. Google 商家檔案的「網站」欄填上官網網址（商家×官網互相連結，在地 SEO 加成）
3. 用 LINE／FB 貼一次連結，確認 OG 預覽圖正常顯示

**上線順序速記**：上傳 → 開 Pages → 買網域 → Cloudflare DNS → 綁網域開 HTTPS → 換佔位 → 提交 sitemap。

---

© 2026 Go Shoot 戰鬥陀螺 ・ 新北市中和區景平路593號之1
