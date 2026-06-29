/* ===================================================================
   Go Shoot 全站設定
   ↓↓↓ 只要把下面 4 個連結換成你的實際網址，全站所有按鈕就會自動套用 ↓↓↓
   （留空白的會維持原樣、不會壞掉）
=================================================================== */
const GOSHOOT_LINKS = {
  line:   "",  // LINE 官方帳號加好友連結，例如 https://lin.ee/xxxxxxx
  shopee: "",  // 蝦皮賣場連結，例如 https://shopee.tw/your-shop
  form:   "",  // 預購表單連結（Tally / Google 表單）
  signup: ""   // 賽事報名連結
};

/* ===================================================================
   流量偵測（填 ID 即全站自動啟用，留空白不會載入、不會壞）
   ↓↓↓ 只要填這 2 個 ID，全站每一頁就開始記錄流量 ↓↓↓
=================================================================== */
const GOSHOOT_ANALYTICS = {
  ga4:     "G-77W711JZPL",  // Google Analytics 4 評估 ID，格式 G-XXXXXXXXXX（GA4 後台→管理→資料串流取得）
  clarity: "xejhlj6akt"   // Microsoft Clarity 專案 ID，10 碼小寫英數（clarity.microsoft.com 免費，建專案後取得）
};
/* =================================================================== */

(function () {
  function apply(selector, url) {
    if (!url) return;                       // 沒填就維持原樣
    document.querySelectorAll(selector).forEach(function (a) {
      a.setAttribute("href", url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    });
  }
  apply("[data-line]",   GOSHOOT_LINKS.line);
  apply("[data-shopee]", GOSHOOT_LINKS.shopee);
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
