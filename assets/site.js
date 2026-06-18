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
