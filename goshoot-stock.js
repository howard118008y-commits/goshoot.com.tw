/* goshoot-stock.js — 一番賞即時剩餘籤數
   在 ichiban.html（與各 ichiban-*.html）</body> 前加：
     <script src="goshoot-stock.js" defer></script>

   資料來源優先序：
   1. <body data-gs-stock-src="https://goshoot-ichiban.vercel.app/api/stock">
      → 抽獎 app 直接輸出（最理想，真正即時）
   2. 同目錄的 ichiban-stock.json（手動或排程更新，也可用）
   都讀不到就完全不動 HTML，保留頁面原本寫死的數字 —— 不會開天窗。

   HTML 掛載點（都是選用，有哪個就渲染哪個）：
     <span data-gs-stock="left">57</span>        剩餘籤數
     <span data-gs-stock="total">80</span>       總籤數
     <div  data-gs-stock="bar"></div>            進度條（自動補 .gs-stock-bar）
     <div  data-gs-stock="grades"></div>         A〜G＋LAST 完整賞品表
     <span data-gs-stock="updated"></span>       最後同步時間
     <span data-gs-stock="hash"></span>          commit 承諾雜湊
   用 data-gs-set="套組ID" 指定要讀哪一個獎單，省略則取第一個。 */
(function () {
  'use strict';
  if (window.__gsStock) return;
  window.__gsStock = 1;

  var REMOTE = document.body.getAttribute('data-gs-stock-src');
  var LOCAL = 'ichiban-stock.json';

  function pct(a, b) { return b > 0 ? Math.round((a / b) * 1000) / 10 : 0; }

  function renderGrades(host, set) {
    if (!set.grades || !set.grades.length) return;
    host.className = (host.className + ' gs-grades').trim();
    host.innerHTML = set.grades.map(function (g) {
      var w = pct(g.left, g.total);
      var isLast = String(g.grade).toUpperCase() === 'LAST';
      return '<div class="gs-grade" data-grade="' + g.grade + '">' +
        '<b>' + g.grade + '</b>' +
        '<div class="gs-g-body">' +
          '<div class="gs-g-name">' + g.grade + ' 賞・' + g.name + '</div>' +
          '<div class="gs-g-meta">' +
            '<span><i style="width:' + w + '%"></i></span>' +
            '<span class="gs-g-left">剩 ' + g.left + ' / ' + g.total + '</span>' +
          '</div>' +
        '</div>' +
        '<span class="gs-g-pct">' + (isLast ? '保底' : (g.odds || w + '%')) + '</span>' +
      '</div>';
    }).join('');
  }

  function apply(data) {
    var sets = (data && data.sets) || [];
    if (!sets.length) return;

    document.querySelectorAll('[data-gs-stock]').forEach(function (el) {
      var wanted = el.getAttribute('data-gs-set');
      var set = wanted ? sets.filter(function (s) { return s.id === wanted; })[0] : sets[0];
      if (!set) return;
      var kind = el.getAttribute('data-gs-stock');

      if (kind === 'left') el.textContent = set.left;
      else if (kind === 'total') el.textContent = set.total;
      else if (kind === 'updated') el.textContent = data.updated || '';
      else if (kind === 'hash') el.textContent = set.commitHash || '';
      else if (kind === 'bar') {
        if (el.className.indexOf('gs-stock-bar') < 0) el.className = (el.className + ' gs-stock-bar').trim();
        el.innerHTML = '<i style="width:' + pct(set.left, set.total) + '%"></i>';
      } else if (kind === 'grades') renderGrades(el, set);
    });

    document.body.setAttribute('data-gs-stock-ready', '1');
  }

  function load(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  var chain = REMOTE ? load(REMOTE).catch(function () { return load(LOCAL); }) : load(LOCAL);
  chain.then(apply).catch(function () {
    /* 讀不到就保留頁面原本的靜態數字，不動任何 DOM */
  });
})();
