/* goshoot-article.js — 長文閱讀強化：進度條 + 真實錨點目錄
   只在有 .article 的頁面啟動。加在 </body> 前：
     <script src="goshoot-article.js" defer></script>

   做三件事：
   1. 頂部閱讀進度條
   2. 掃出所有 h2，補上真實 id（Google sitelinks 需要真錨點，不是 JS 假錨點）
   3. 手機 = 右下浮動「目錄」＋底部彈出；桌機 = 左側固定目錄
   不改動任何既有內容。 */
(function () {
  'use strict';
  var article = document.querySelector('.article');
  if (!article || window.__gsArticle) return;
  window.__gsArticle = 1;

  function slug(s, i) {
    var t = String(s || '').trim().toLowerCase()
      .replace(/[\s\u3000]+/g, '-')
      .replace(/[^\w\u4e00-\u9fff-]/g, '');
    return t ? 'sec-' + t.slice(0, 40) : 'sec-' + (i + 1);
  }

  var heads = [].slice.call(article.querySelectorAll('h2'));

  // ── 進度條
  var prog = document.createElement('div');
  prog.className = 'gs-progress';
  prog.innerHTML = '<i></i>';
  prog.setAttribute('aria-hidden', 'true');
  document.body.appendChild(prog);
  var fill = prog.firstChild;

  // ── 目錄
  var sheet, links = [];
  if (heads.length >= 3) {
    heads.forEach(function (h, i) { if (!h.id) h.id = slug(h.textContent, i); });

    var isDesktop = window.matchMedia('(min-width:861px)').matches;

    if (isDesktop) {
      var aside = document.createElement('aside');
      aside.className = 'gs-toc-aside';
      aside.innerHTML = '<ol>' + heads.map(function (h) {
        return '<li><a href="#' + h.id + '">' + h.textContent + '</a></li>';
      }).join('') + '</ol>';
      // 用獨立包裹層放 aside+article，不要直接改 article.parentNode（那通常是
      // <body> 本身，直接下 flex 會把 nav/footer 等所有手足元素一起打橫）
      var flexWrap = document.createElement('div');
      flexWrap.className = 'gs-article-flex';
      flexWrap.style.display = 'flex';
      flexWrap.style.gap = '44px';
      flexWrap.style.alignItems = 'flex-start';
      article.parentNode.insertBefore(flexWrap, article);
      flexWrap.appendChild(aside);
      flexWrap.appendChild(article);
      links = [].slice.call(aside.querySelectorAll('a'));
    } else {
      var fab = document.createElement('button');
      fab.className = 'gs-toc-fab';
      fab.type = 'button';
      fab.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
        'stroke="#FF5A2D" stroke-width="2.4" stroke-linecap="round">' +
        '<path d="M4 6h16M4 12h10M4 18h13"></path></svg><span>目錄</span>';
      document.body.appendChild(fab);

      sheet = document.createElement('div');
      sheet.className = 'gs-toc-sheet';
      sheet.innerHTML = '<div class="gs-scrim"></div><nav><h4>本篇目錄</h4>' +
        heads.map(function (h) { return '<a href="#' + h.id + '">' + h.textContent + '</a>'; }).join('') +
        '</nav>';
      document.body.appendChild(sheet);
      links = [].slice.call(sheet.querySelectorAll('nav a'));

      var open = function () { sheet.setAttribute('open', ''); };
      var close = function () { sheet.removeAttribute('open'); };
      fab.addEventListener('click', open);
      sheet.querySelector('.gs-scrim').addEventListener('click', close);
      links.forEach(function (a) { a.addEventListener('click', close); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
  }

  // ── 捲動：進度 + 目前章節
  var ticking = false;
  function update() {
    ticking = false;
    var top = article.offsetTop;
    var span = article.offsetHeight - window.innerHeight;
    var p = span > 0 ? (window.pageYOffset - top) / span : 0;
    fill.style.width = Math.max(0, Math.min(1, p)) * 100 + '%';

    if (!links.length) return;
    var y = window.pageYOffset + 120, cur = 0;
    heads.forEach(function (h, i) { if (h.getBoundingClientRect().top + window.pageYOffset <= y) cur = i; });
    links.forEach(function (a, i) {
      if (i === cur) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
})();
