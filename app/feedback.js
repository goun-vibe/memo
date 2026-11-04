/**
 * 개발자에게 의견 보내기 — 소개 페이지와 웹 메모장 양쪽에서 함께 쓰는 위젯.
 *
 * 오른쪽 아래에 작은 버튼을 띄우고, 누르면 입력 창이 열린다.
 * 보낸 내용은 Web3Forms 를 거쳐 개발자 메일로 전달된다.
 * 받는 메일 주소는 이 파일에 들어 있지 않다(ACCESS_KEY 로만 연결된다).
 *
 * 맥 앱(Electron)에서는 띄우지 않는다.
 */
(function () {
  'use strict';

  var ACCESS_KEY = 'b0f52c19-864f-462d-b08d-a1259b645243';
  var ENDPOINT = 'https://api.web3forms.com/submit';
  var MAX_LEN = 3000;

  // 맥 앱에서는 electronAPI 가 있고 IS_WEB 이 없다 → 띄우지 않는다
  if (window.electronAPI && !window.IS_WEB) return;
  if (!ACCESS_KEY || ACCESS_KEY.indexOf('__') === 0) {
    console.warn('[feedback] 전송 키가 설정되지 않아 의견 보내기 버튼을 띄우지 않습니다.');
    return;
  }

  var STYLE = [
    '.fb-open{position:fixed;right:20px;bottom:20px;z-index:9998;display:flex;align-items:center;gap:7px;',
    'background:#1a1a1a;color:#fff;border:none;border-radius:999px;padding:11px 18px;font-size:14px;',
    'font-family:inherit;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.18);opacity:.82;transition:opacity .15s,transform .15s}',
    '.fb-open:hover{opacity:1;transform:translateY(-1px)}',
    '.fb-overlay{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.45);display:flex;',
    'align-items:center;justify-content:center;padding:20px}',
    '.fb-card{background:#fff;border-radius:14px;width:100%;max-width:460px;padding:26px 26px 22px;',
    'box-shadow:0 20px 50px rgba(0,0,0,.25);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",',
    '"Apple SD Gothic Neo","Malgun Gothic",Roboto,sans-serif;color:#1a1a1a;max-height:90vh;overflow-y:auto}',
    '.fb-card h2{font-size:19px;font-weight:700;margin:0 0 6px;line-height:1.4}',
    '.fb-card .fb-sub{font-size:13.5px;color:#6b7280;margin:0 0 18px;line-height:1.5}',
    '.fb-card label{display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:#374151}',
    '.fb-card textarea,.fb-card input[type=email]{width:100%;box-sizing:border-box;border:1px solid #e5e7eb;',
    'border-radius:8px;padding:10px 12px;font-size:14px;font-family:inherit;color:#1a1a1a;background:#fff;',
    'outline:none;line-height:1.6}',
    '.fb-card textarea{min-height:130px;resize:vertical;margin-bottom:4px}',
    '.fb-card textarea:focus,.fb-card input[type=email]:focus{border-color:#2563eb}',
    '.fb-count{font-size:12px;color:#9ca3af;text-align:right;margin-bottom:14px}',
    '.fb-field{margin-bottom:16px}',
    '.fb-note{font-size:12.5px;color:#9ca3af;line-height:1.5;margin:0 0 18px}',
    '.fb-row{display:flex;gap:8px;justify-content:flex-end;align-items:center}',
    '.fb-btn{border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;',
    'font-family:inherit;cursor:pointer}',
    '.fb-send{background:#2563eb;color:#fff}',
    '.fb-send:hover{background:#1d4ed8}',
    '.fb-send:disabled{background:#93b4f5;cursor:default}',
    '.fb-cancel{background:#f1f5f9;color:#475569}',
    '.fb-cancel:hover{background:#e2e8f0}',
    '.fb-msg{font-size:13.5px;margin-right:auto;line-height:1.5}',
    '.fb-msg.err{color:#dc2626}',
    '.fb-msg.ok{color:#059669}',
    '.fb-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}',
    '@media (max-width:640px){.fb-open{right:14px;bottom:14px;padding:10px 15px;font-size:13px}}',
  ].join('');

  var overlay = null;
  var lastFocused = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener('keydown', onKeydown);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
  }

  function open() {
    if (overlay) return;
    lastFocused = document.activeElement;

    overlay = el('div', 'fb-overlay');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '개발자에게 의견 보내기');

    var card = el('div', 'fb-card');
    card.appendChild(el('h2', null, '개발자에게 의견 보내기'));
    card.appendChild(el('p', 'fb-sub', '불편한 점, 바라는 기능, 버그 무엇이든 좋습니다. 짧게 적어주셔도 됩니다.'));

    var textWrap = el('div');
    var textLabel = el('label', null, '내용');
    textLabel.setAttribute('for', 'fb-text');
    var text = el('textarea');
    text.id = 'fb-text';
    text.maxLength = MAX_LEN;
    text.placeholder = '예: 메모를 폴더로 묶을 수 있으면 좋겠어요.';
    var count = el('div', 'fb-count', '0 / ' + MAX_LEN);
    text.addEventListener('input', function () {
      count.textContent = text.value.length + ' / ' + MAX_LEN;
    });
    textWrap.appendChild(textLabel);
    textWrap.appendChild(text);
    textWrap.appendChild(count);
    card.appendChild(textWrap);

    var mailWrap = el('div', 'fb-field');
    var mailLabel = el('label', null, '답장 받을 메일 (선택)');
    mailLabel.setAttribute('for', 'fb-mail');
    var mail = el('input');
    mail.type = 'email';
    mail.id = 'fb-mail';
    mail.placeholder = '적지 않으면 답장을 드릴 수 없습니다';
    mailWrap.appendChild(mailLabel);
    mailWrap.appendChild(mail);
    card.appendChild(mailWrap);

    // 봇 거르기용 숨은 칸 (사람은 비워 둔다)
    var hp = el('input', 'fb-hp');
    hp.type = 'text';
    hp.name = 'botcheck';
    hp.tabIndex = -1;
    hp.setAttribute('autocomplete', 'off');
    card.appendChild(hp);

    card.appendChild(el('p', 'fb-note',
      '쓰신 메모 내용은 함께 보내지지 않습니다. 보낸 내용과 함께 지금 보고 계신 페이지 주소와 브라우저 종류만 전달됩니다.'));

    var row = el('div', 'fb-row');
    var msg = el('div', 'fb-msg');
    var cancel = el('button', 'fb-btn fb-cancel', '취소');
    var send = el('button', 'fb-btn fb-send', '보내기');
    cancel.type = 'button';
    send.type = 'button';
    row.appendChild(msg);
    row.appendChild(cancel);
    row.appendChild(send);
    card.appendChild(row);

    cancel.addEventListener('click', close);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKeydown);

    send.addEventListener('click', function () {
      var body = text.value.trim();
      msg.className = 'fb-msg';
      if (!body) {
        msg.className = 'fb-msg err';
        msg.textContent = '내용을 적어주세요.';
        text.focus();
        return;
      }
      if (hp.value) { close(); return; } // 봇

      send.disabled = true;
      send.textContent = '보내는 중…';
      msg.textContent = '';

      var payload = {
        access_key: ACCESS_KEY,
        subject: 'MEMO 피드백',
        from_name: 'MEMO 사용자',
        message: body + '\n\n---\n페이지: ' + location.href + '\n브라우저: ' + navigator.userAgent,
        botcheck: '',
      };
      if (mail.value.trim()) {
        payload.replyto = mail.value.trim();
        payload.email = mail.value.trim();
      }

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (data) {
          if (data && data.success) {
            card.innerHTML = '';
            card.appendChild(el('h2', null, '보냈습니다'));
            card.appendChild(el('p', 'fb-sub', '의견 고맙습니다. 잘 읽어보겠습니다.'));
            var row2 = el('div', 'fb-row');
            var ok = el('button', 'fb-btn fb-send', '닫기');
            ok.type = 'button';
            ok.addEventListener('click', close);
            row2.appendChild(ok);
            card.appendChild(row2);
            ok.focus();
          } else {
            throw new Error((data && data.message) || '전송 실패');
          }
        })
        .catch(function () {
          send.disabled = false;
          send.textContent = '보내기';
          msg.className = 'fb-msg err';
          msg.textContent = '보내지 못했습니다. 잠시 뒤 다시 눌러주세요.';
        });
    });

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    text.focus();
  }

  function init() {
    var style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    var btn = el('button', 'fb-open');
    btn.type = 'button';
    btn.title = '개발자에게 의견 보내기';
    btn.appendChild(el('span', null, '✉'));
    btn.appendChild(el('span', null, '의견 보내기'));
    btn.addEventListener('click', open);
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
