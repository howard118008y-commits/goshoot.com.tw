/* goshoot-nav.js — 手機底部導覽列（自動注入，不用改任何頁面的 HTML）
   在每頁 </body> 前加：<script src="goshoot-nav.js" defer></script>
   桌機（≥861px）由 CSS 隱藏，不影響現有的頂部 nav 與 SEO 連結。 */
(function () {
  'use strict';
  if (window.__gsNav) return;
  window.__gsNav = 1;

  // 中央一番賞主鈕＋兩側各兩格（2026-08-02 改五格對稱＝大鈕正中，修「沒有置中」）。想改分組只要動這個陣列。
  var TABS = [
    { href: 'index.html', icon: null, label: '首頁', match: /^(index\.html)?$/ },
    { href: 'guide.html', icon: 'assets/brand/icon/spintop.jpg', label: '攻略',
      match: /^(guide|beyblade-|article-)/ },
    { cta: true, href: 'ichiban.html', label: '一番\u8CDE', sub: '馬上抽',
      match: /^ichiban/ },
    { href: 'events.html', icon: 'assets/brand/icon/trophy.jpg', label: '賽事',
      match: /^events/ },
    { href: 'about.html', icon: 'assets/brand/icon/target.jpg', label: '門市',
      match: /^(about|store|faq|terms|privacy|refund)/ }
  ];

  var EMBLEM = '<svg viewBox="0 0 512 512" width="24" height="24" aria-hidden="true" style="display:block">' +
    '<circle cx="256" cy="256" r="160" fill="none" stroke="currentColor" stroke-width="30"></circle>' +
    '<circle cx="256" cy="256" r="52" fill="currentColor"></circle></svg>';

  var page = (location.pathname.split('/').pop() || 'index.html');

  function build() {
    var bar = document.createElement('nav');
    bar.className = 'gs-tabbar';
    bar.setAttribute('aria-label', '主要導覽');

    TABS.forEach(function (t) {
      var a = document.createElement('a');
      a.href = t.href;
      var active = t.match.test(page.replace(/\.html$/, t.match.source.indexOf('\\.html') > -1 ? '.html' : ''));
      if (t.match.test(page)) active = true;

      if (t.cta) {
        a.className = 'gs-tab-cta';
        a.innerHTML = '<em>' + t.label.replace('\u8CDE', '<br>\u8CDE') + '</em><span>' + t.sub + '</span>';
        a.setAttribute('aria-label', '線上一番賞・馬上抽');
      } else {
        var icon = t.icon
          ? '<img src="' + t.icon + '" alt="" loading="lazy">'
          : '<span style="display:block;color:' + (active ? '#FF5A2D' : '#6A6A72') + '">' + EMBLEM + '</span>';
        a.innerHTML = icon + '<span>' + t.label + '</span>';
      }
      if (active && !t.cta) a.setAttribute('aria-current', 'page');
      bar.appendChild(a);
    });

    document.body.appendChild(bar);
    document.body.classList.add('gs-has-tabbar');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
