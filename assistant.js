/* 小Go AI 客服（官網版）：右下角浮動泡泡＋GoShoot 品牌造型聊天窗（與 app 一致）。
   後端 = 一番賞 Railway API /api/assistant/chat；連不上（含 CORS）時用內建 FAQ 降級回答。 */
(function () {
  "use strict";
  var API = "https://goshoot-ichiban-production.up.railway.app/api/assistant/chat";
  var APP = "https://goshoot-ichiban.vercel.app";
  var FACE = "assets/xiaogo-face.jpg";
  var QUICK = ["新手怎麼玩？", "怎麼儲值？", "機率公平嗎？", "退款規則", "門市在哪？"];
  var HELLO = "嗨，我是小Go！線上一番賞、門市、儲值、退款…有問題直接問我，24 小時在線。";
  var FAQ = [
    [["儲值", "加值", "充值", "go幣", "點數"], "儲值＝購買站內 Go 幣（1 Go 幣＝1 元），到 " + APP + "/topup 選金額即可；滿千加贈 5%、滿三千加贈 10%。未使用的儲值可申請退款。"],
    [["退款", "退貨", "取消", "退錢"], "已抽出的抽賞不能改抽或取消；實體獎品收到後 7 日內可退該獎品、瑕疵品 7 日內換新。請來信 goshoot593@gmail.com，詳見退款政策頁。"],
    [["機率", "公平", "作弊", "驗證"], "每套賞的賞級數量、剩餘與機率都公開，開獎用承諾與揭曉機制＋公開亂數，到 " + APP + "/verify 可以自己驗算。"],
    [["怎麼玩", "新手", "玩法", "怎麼抽", "教學"], "線上一番賞：Google 登入 → 儲值 Go 幣 → 選賞單抽賞，每抽必中、即時開獎。先玩免費試抽：" + APP + "/draw?demo=1"],
    [["門市", "地址", "店", "在哪"], "Go Shoot 門市在新北市中和區景平路593號之1，戰鬥陀螺商品與代購預購都在這裡。"],
    [["18", "年齡", "未成年", "幾歲"], "線上一番賞僅限年滿 18 歲使用，未滿 18 歲不得註冊會員。"],
    [["運費", "寄送", "出貨", "領取"], "抽中後在「我的獎品」申請寄送：超商店到店 45–60 元、郵局 70 元；會員卡等有運費折抵。"]
  ];
  var FAQ_DEFAULT = "這題小Go需要真人夥伴協助：請來信 goshoot593@gmail.com 或致電 0976-507-911。";

  var msgs = [];
  var busy = false;

  function faqAnswer(t) {
    var low = t.toLowerCase();
    for (var i = 0; i < FAQ.length; i++) {
      for (var j = 0; j < FAQ[i][0].length; j++) {
        if (low.indexOf(FAQ[i][0][j]) !== -1) return FAQ[i][1];
      }
    }
    return FAQ_DEFAULT;
  }

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function linkify(s) {
    return esc(s).replace(/(https?:\/\/[^\s，。；]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  /* 品牌造型：橘色系＋頂部探頭小Go 吉祥物臉＋兩側耳翼＋橘框（與 app GoShootAssistant 一致） */
  var css = ".gsa{position:fixed;right:18px;bottom:18px;z-index:2000;font-family:inherit}" +
    ".gsa-fab{width:56px;height:56px;padding:0;overflow:hidden;border-radius:50%;border:1px solid rgba(255,255,255,.22);background:#FF5A2D;color:#FBF6EE;font-size:20px;cursor:pointer;box-shadow:0 8px 30px rgba(255,90,45,.4),inset 0 1px 0 rgba(255,255,255,.3);transition:transform .15s ease}" +
    ".gsa-fab img{width:100%;height:100%;display:block}" +
    ".gsa-fab.is-open{background:rgba(30,30,35,.95)}" +
    ".gsa-fab:hover{transform:scale(1.06)}" +
    ".gsa-panel{position:absolute;right:0;bottom:70px;width:min(360px,calc(100vw - 36px));height:min(520px,calc(100vh - 130px));margin-top:24px;display:none;flex-direction:column;overflow:visible;border-radius:20px;background:rgba(18,18,21,.9);border:2px solid rgba(255,90,45,.55);backdrop-filter:blur(24px) saturate(170%);-webkit-backdrop-filter:blur(24px) saturate(170%);box-shadow:inset 0 1px 0 rgba(255,255,255,.10),0 0 0 4px rgba(255,90,45,.10),0 18px 60px rgba(0,0,0,.6)}" +
    ".gsa.open .gsa-panel{display:flex}" +
    ".gsa-crown{position:absolute;top:-38px;left:50%;transform:translateX(-50%);z-index:4;width:76px;height:76px;border-radius:50%;object-fit:cover;background:#141416;border:3px solid #FF5A2D;box-shadow:0 6px 22px rgba(255,90,45,.6)}" +
    ".gsa-head{position:relative;padding:44px 16px 12px;text-align:center;color:#ECECEA;font-size:15px;background:linear-gradient(180deg,rgba(255,90,45,.22),rgba(255,90,45,.03));border-radius:18px 18px 0 0;border-bottom:1px solid rgba(255,90,45,.28)}" +
    ".gsa-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#FF5A2D;animation:gsaPulse 1.4s ease-in-out infinite;vertical-align:middle;margin:0 4px}" +
    ".gsa-sub{color:#B4B4BB;font-size:12px}" +
    ".gsa-x{position:absolute;top:10px;right:12px;background:none;border:none;color:#B4B4BB;font-size:14px;cursor:pointer}" +
    ".gsa-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}" +
    ".gsa-msg{max-width:85%;padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.7;white-space:pre-wrap;word-break:break-word}" +
    ".gsa-msg.assistant{align-self:flex-start;background:rgba(255,255,255,.07);color:#ECECEA;border:1px solid rgba(255,255,255,.08);border-bottom-left-radius:4px}" +
    ".gsa-msg.assistant a{color:#FF5A2D;font-weight:700}" +
    ".gsa-msg.user{align-self:flex-end;background:rgba(255,90,45,.16);color:#FFF1EB;border:1px solid rgba(255,90,45,.25);border-bottom-right-radius:4px}" +
    ".gsa-quick{display:flex;gap:6px;padding:8px 12px 0;flex-wrap:wrap}" +
    ".gsa-quick button{font-size:11.5px;color:#B4B4BB;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:5px 10px;cursor:pointer}" +
    ".gsa-quick button:hover{color:#FF5A2D;border-color:rgba(255,90,45,.4)}" +
    ".gsa-input{display:flex;gap:8px;padding:12px}" +
    ".gsa-input input{flex:1;min-width:0;background:rgba(255,255,255,.06);color:#ECECEA;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:10px 12px;font-size:13.5px;outline:none}" +
    ".gsa-input input:focus{border-color:rgba(255,90,45,.45)}" +
    ".gsa-input button{background:linear-gradient(135deg,#FF5A2D,#E24A2C);color:#fff;font-weight:800;border:none;border-radius:12px;padding:0 16px;font-size:13.5px;cursor:pointer}" +
    "@keyframes gsaPulse{0%,100%{opacity:1}50%{opacity:.35}}" +
    "@media (max-width:480px){.gsa{right:12px;bottom:12px}.gsa-panel{bottom:64px;width:min(320px,calc(100vw - 24px));height:min(560px,68vh)}.gsa-body{padding:10px}.gsa-msg{font-size:13px}}";

  function build() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var root = document.createElement("div");
    root.className = "gsa";
    root.innerHTML =
      '<div class="gsa-panel" role="dialog" aria-label="小Go 智能客服">' +
      '<img class="gsa-crown" src="' + FACE + '" alt="">' +
      '<div class="gsa-head"><b>小Go</b><span class="gsa-dot"></span><span class="gsa-sub">智能客服・24 小時</span>' +
      '<button class="gsa-x" aria-label="關閉">✕</button></div>' +
      '<div class="gsa-body"></div>' +
      '<div class="gsa-quick"></div>' +
      '<div class="gsa-input"><input placeholder="問我賞況、儲值、退款…"><button>送出</button></div>' +
      "</div>" +
      '<button class="gsa-fab" aria-label="開啟小Go客服"><img src="' + FACE + '" alt="小Go"></button>';
    document.body.appendChild(root);

    var body = root.querySelector(".gsa-body");
    var input = root.querySelector(".gsa-input input");
    var fab = root.querySelector(".gsa-fab");

    function addMsg(role, text, asHtml) {
      var el = document.createElement("div");
      el.className = "gsa-msg " + role;
      if (asHtml) el.innerHTML = linkify(text); else el.textContent = text;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
      return el;
    }

    function send(text) {
      var q = (text || input.value).trim();
      if (!q || busy) return;
      input.value = "";
      input.focus();
      addMsg("user", q);
      msgs.push({ role: "user", content: q });
      busy = true;
      var typing = addMsg("assistant", "小Go 思考中…");
      var finish = function (reply) {
        typing.remove();
        addMsg("assistant", reply, true);
        msgs.push({ role: "assistant", content: reply });
        busy = false;
        input.focus();
      };
      fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs.slice(-10) })
      }).then(function (r) { return r.json(); })
        .then(function (d) { finish(d.reply || faqAnswer(q)); })
        .catch(function () { finish(faqAnswer(q)); });
    }

    var quick = root.querySelector(".gsa-quick");
    QUICK.forEach(function (qt) {
      var b = document.createElement("button");
      b.textContent = qt;
      b.onclick = function () { send(qt); };
      quick.appendChild(b);
    });

    fab.onclick = function () {
      root.classList.toggle("open");
      var isOpen = root.classList.contains("open");
      fab.classList.toggle("is-open", isOpen);
      fab.innerHTML = isOpen ? "✕" : '<img src="' + FACE + '" alt="小Go">';
      if (isOpen && !body.childElementCount) addMsg("assistant", HELLO);
    };
    root.querySelector(".gsa-x").onclick = function () { fab.onclick(); };
    root.querySelector(".gsa-input button").onclick = function () { send(); };
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.isComposing) send(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
