/* ===================================================================
   Go Shoot 全站設定
   ↓↓↓ 只要把下面 3 個連結換成你的實際網址，全站所有按鈕就會自動套用 ↓↓↓
   （留空白的會維持原樣、不會壞掉）
=================================================================== */
const GOSHOOT_LINKS = {
  line:   "https://line.me/R/ti/p/@722xefvm",  // LINE 官方帳號 @722xefvm（2026-08-02 開通）
  ig:     "https://www.instagram.com/goshoot.tw/",  // IG @goshoot.tw（2026-09-04 定名；goshoot593 被佔）
  fb:     "https://www.facebook.com/profile.php?id=61593811152585",  // FB 粉專 Go Shoot 中和店（2026-09-04 建）
  threads:"https://www.threads.com/@goshoot.tw",  // Threads（跟 IG 同名）
  form:   "",  // 表單連結（Tally / Google 表單）
  signup: ""   // 賽事報名連結
};

/* ===================================================================
   流量偵測（填 ID 即全站自動啟用，留空白不會載入、不會壞）
   ↓↓↓ 只要填這 2 個 ID，全站每一頁就開始記錄流量 ↓↓↓
=================================================================== */
const GOSHOOT_ANALYTICS = {
  // ⚠️ 2026-08-13：舊 ID G-CKRYMNWMP6 已失效（gtag.js 回 404，官網數據整段沒進 GA4）。
  // 換 ID 前先驗 `curl -o /dev/null -w '%{http_code}' 'https://www.googletagmanager.com/gtag/js?id=<ID>'`
  // 必須是 200——注意連亂編的假 ID 也會回 200，只有被刪除的資源才回 404。
  ga4:     "G-L988KD8RPX",  // Google Analytics 4 評估 ID（GA4 後台→管理→資料串流取得）
  clarity: "xejhlj6akt"   // Microsoft Clarity 專案 ID，10 碼小寫英數（clarity.microsoft.com 免費，建專案後取得）
};
/* =================================================================== */

(function () {
  function apply(selector, url) {
    document.querySelectorAll(selector).forEach(function (a) {
      if (url) {
        a.setAttribute("href", url);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener");
        a.style.display = "";               // 有填就顯示
      } else {
        a.style.display = "none";           // 沒帳號就隱藏，避免死鈕（footer 有 email/tel 兜底）
      }
    });
  }
  apply("[data-line]",   GOSHOOT_LINKS.line);
  apply("[data-ig]",     GOSHOOT_LINKS.ig);
  apply("[data-fb]",     GOSHOOT_LINKS.fb);
  apply("[data-threads]",GOSHOOT_LINKS.threads);
  apply("[data-form]",   GOSHOOT_LINKS.form);
  apply("[data-signup]", GOSHOOT_LINKS.signup);

  // ── 流量偵測：Google Analytics 4 ──
  if (GOSHOOT_ANALYTICS.ga4) {
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + GOSHOOT_ANALYTICS.ga4;
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GOSHOOT_ANALYTICS.ga4);
  }

  // ── 流量偵測：Microsoft Clarity（熱圖 / 操作錄影）──
  if (GOSHOOT_ANALYTICS.clarity) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", GOSHOOT_ANALYTICS.clarity);
  }

  // 手機版漢堡選單開關
  var btn = document.querySelector(".menu-btn");
  var links = document.querySelector(".nav-links");
  if (btn && links) {
    btn.addEventListener("click", function () {
      links.classList.toggle("open");
    });
    // 點選單內任一連結後自動收起
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }
})();
