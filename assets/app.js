/* ─── KnowledgeDB 공통 스크립트 (설계문서 4.4~4.5) ───
   전 페이지 공통: 테마(시스템/라이트/다크) 토글
   문서 페이지: ⌂ 홈 버튼, 읽던 위치 저장·복원, 최근 본 문서 기록 */
(function () {
  'use strict';

  var docId = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';
  var isHome = docId === 'index';

  /* ---------- 테마 ---------- */
  var THEME_KEY = 'kdb-theme';
  var MODES = ['system', 'light', 'dark'];
  var GLYPH = { system: '◐', light: '☀', dark: '☾' };
  var LABEL = { system: '시스템 설정 따름', light: '라이트 모드', dark: '다크 모드' };
  var themeBtn = null;

  function getMode() {
    try { var m = localStorage.getItem(THEME_KEY); return MODES.indexOf(m) >= 0 ? m : 'system'; }
    catch (e) { return 'system'; }
  }
  function isDark(mode) {
    return mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function applyTheme() {
    var mode = getMode();
    if (isDark(mode)) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    if (themeBtn) {
      themeBtn.textContent = GLYPH[mode];
      themeBtn.title = '테마: ' + LABEL[mode] + ' (탭하여 변경)';
    }
  }
  function cycleTheme() {
    var next = MODES[(MODES.indexOf(getMode()) + 1) % MODES.length];
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    applyTheme();
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
    if (getMode() === 'system') applyTheme();
  });

  /* ---------- UI 주입 ---------- */
  function injectUI() {
    var style = document.createElement('style');
    style.textContent =
      '#kdb-controls{position:fixed;left:12px;bottom:14px;z-index:1200;display:flex;flex-direction:column;gap:8px}' +
      '.kdb-btn{width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;' +
        'font-size:18px;background:var(--navy-900,#002C5F);color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.28);' +
        'text-decoration:none;-webkit-tap-highlight-color:transparent;font-family:inherit;opacity:.92}' +
      '.kdb-btn:active{transform:scale(.94)}' +
      '#kdb-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:72px;z-index:1300;' +
        'background:var(--navy-900,#002C5F);color:#fff;padding:11px 18px;border-radius:100px;font-size:13.5px;' +
        'border:none;cursor:pointer;display:flex;gap:10px;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.35);' +
        'font-family:inherit;white-space:nowrap;transition:opacity .3s}' +
      '#kdb-toast .x{opacity:.6;font-size:15px}' +
      '#kdb-find-btn{position:fixed;top:14px;right:14px;z-index:1200}' +
      '#kdb-find{position:fixed;top:10px;right:10px;z-index:1250;display:flex;align-items:center;gap:2px;' +
        'background:var(--bg-secondary,#fff);color:var(--text-primary,#1A1A1A);border:1px solid var(--border,#D5CFBF);' +
        'border-radius:100px;padding:6px 6px 6px 14px;box-shadow:0 6px 20px rgba(0,0,0,.25);max-width:calc(100vw - 20px)}' +
      '#kdb-find input{border:none;outline:none;background:transparent;color:inherit;font-family:inherit;font-size:14px;width:150px;min-width:50px;flex:1}' +
      '#kdb-find input::-webkit-search-cancel-button{-webkit-appearance:none}' +
      '#kdb-find .kdb-cnt{font-size:12px;color:var(--text-muted,#8A8A8A);white-space:nowrap;padding:0 4px;font-family:\'JetBrains Mono\',monospace}' +
      '#kdb-find .kdb-nav{width:30px;height:30px;border:none;border-radius:50%;background:transparent;color:var(--text-secondary,#555);' +
        'font-size:14px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;' +
        '-webkit-tap-highlight-color:transparent;font-family:inherit;padding:0}' +
      '#kdb-find .kdb-nav:active{background:var(--navy-100,#E8EEF7)}' +
      '@media(max-width:420px){#kdb-find input{width:100px}}' +
      '::highlight(kdb-find){background:#FFDE6B;color:#1A1A1A}' +
      '::highlight(kdb-find-cur){background:#E8962A;color:#fff}';
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.id = 'kdb-controls';

    if (!isHome) {
      var home = document.createElement('a');
      home.className = 'kdb-btn';
      home.href = '../'; /* 문서는 docs/ 아래, 홈은 사이트 루트 */
      home.title = '문서 목록으로';
      home.textContent = '⌂';
      wrap.appendChild(home);
    }

    themeBtn = document.createElement('button');
    themeBtn.className = 'kdb-btn';
    themeBtn.addEventListener('click', cycleTheme);
    wrap.appendChild(themeBtn);

    document.body.appendChild(wrap);
    applyTheme(); // 버튼 글리프 갱신
  }

  /* ---------- 읽던 위치 (문서 페이지만) ---------- */
  var POS_KEY = 'kdb-pos:' + docId;

  function savePosLoop() {
    var timer = null;
    window.addEventListener('scroll', function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        try {
          if (window.scrollY > 300) {
            localStorage.setItem(POS_KEY, JSON.stringify({ y: Math.round(window.scrollY), ts: Date.now() }));
          }
        } catch (e) {}
      }, 400);
    }, { passive: true });
  }

  function offerResume() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(POS_KEY)); } catch (e) {}
    if (!saved || !saved.y || saved.y < 800) return;

    var toast = document.createElement('button');
    toast.id = 'kdb-toast';
    toast.innerHTML = '▶ 이어서 읽기 <span class="x">✕</span>';
    var closer = toast.querySelector('.x');
    closer.addEventListener('click', function (e) { e.stopPropagation(); hide(); });
    toast.addEventListener('click', function () {
      window.scrollTo({ top: saved.y, behavior: 'smooth' });
      hide();
    });
    function hide() {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 350);
    }
    document.body.appendChild(toast);
    setTimeout(hide, 7000);
  }

  /* ---------- 최근 본 문서 기록 ---------- */
  function recordRecent() {
    try {
      var list = JSON.parse(localStorage.getItem('kdb-recent') || '[]');
      list = list.filter(function (r) { return r.id !== docId; });
      list.unshift({ id: docId, ts: Date.now() });
      localStorage.setItem('kdb-recent', JSON.stringify(list.slice(0, 10)));
    } catch (e) {}
  }

  /* ---------- 문서 내 찾기 (문서 페이지만, 우상단 🔍) ---------- */
  var HL_OK = typeof Highlight === 'function' && window.CSS && CSS.highlights;
  var FIND_MAX = 600;
  var find = { built: false, entries: [], text: '', ranges: [], cur: -1, btn: null, bar: null, input: null, cnt: null };

  function buildFindIndex() {
    /* body의 모든 텍스트 노드를 이어붙인 문자열 + 각 노드의 시작 오프셋.
       인라인 태그(<strong>, 코드 스팬 등)에 걸친 단어도 찾기 위해 노드 경계 없이 잇는다. */
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        return (!p || p.closest('script,style,noscript,#sidebar,[id^="kdb-"]'))
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var n, text = '';
    while ((n = walker.nextNode())) { find.entries.push({ node: n, start: text.length }); text += n.nodeValue; }
    find.text = text.toLowerCase();
    find.built = true;
  }

  function clearHighlights() {
    if (HL_OK) { CSS.highlights.delete('kdb-find'); CSS.highlights.delete('kdb-find-cur'); }
    else { try { getSelection().removeAllRanges(); } catch (e) {} }
  }

  function runFind(q) {
    find.ranges = []; find.cur = -1;
    clearHighlights();
    q = q.trim();
    if (q) {
      if (!find.built) buildFindIndex();
      /* 정규식 특수문자 이스케이프 후, 질의의 공백은 \s+로 — HTML 소스의 줄바꿈·들여쓰기를 넘어 매치 */
      var pattern = q.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      var re = new RegExp(pattern, 'g');
      var m, ei = 0;
      while ((m = re.exec(find.text)) !== null && find.ranges.length < FIND_MAX) {
        if (!m[0].length) break;
        while (ei < find.entries.length - 1 && find.entries[ei + 1].start <= m.index) ei++;
        var end = m.index + m[0].length, ej = ei;
        while (ej < find.entries.length - 1 && find.entries[ej + 1].start < end) ej++;
        var r = document.createRange();
        r.setStart(find.entries[ei].node, m.index - find.entries[ei].start);
        r.setEnd(find.entries[ej].node, end - find.entries[ej].start);
        find.ranges.push(r);
      }
      if (HL_OK && find.ranges.length) CSS.highlights.set('kdb-find', new Highlight(...find.ranges));
    }
    if (find.ranges.length) gotoMatch(0, true); else updateFindCount();
  }

  function updateFindCount() {
    var n = find.ranges.length;
    find.cnt.textContent = !find.input.value.trim() ? '' :
      n === 0 ? '0' : (find.cur + 1) + '/' + (n >= FIND_MAX ? FIND_MAX + '+' : n);
  }

  function gotoMatch(i, instant) {
    var n = find.ranges.length; if (!n) return;
    find.cur = ((i % n) + n) % n;
    var r = find.ranges[find.cur];
    var el = r.startContainer.parentElement, d;
    while (el && (d = el.closest('details'))) { d.open = true; el = d.parentElement; } /* 닫힌 아코디언 속이면 펼침 */
    if (HL_OK) CSS.highlights.set('kdb-find-cur', new Highlight(r));
    else { try { var s = getSelection(); s.removeAllRanges(); s.addRange(r.cloneRange()); } catch (e) {} }
    var rect = r.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top - window.innerHeight * 0.35, behavior: instant ? 'instant' : 'smooth' });
    updateFindCount();
  }

  function closeFind() {
    if (!find.bar) return;
    clearHighlights();
    find.ranges = []; find.cur = -1;
    find.bar.remove(); find.bar = find.input = find.cnt = null;
    find.btn.style.display = '';
  }

  function openFind() {
    if (find.bar) { find.input.focus(); return; }
    find.btn.style.display = 'none';
    var bar = document.createElement('div');
    bar.id = 'kdb-find';
    bar.innerHTML =
      '<input type="search" placeholder="문서 내 찾기" enterkeyhint="search" autocomplete="off" aria-label="문서 내 찾기">' +
      '<span class="kdb-cnt"></span>' +
      '<button class="kdb-nav" data-d="-1" title="이전 (Shift+Enter)">∧</button>' +
      '<button class="kdb-nav" data-d="1" title="다음 (Enter)">∨</button>' +
      '<button class="kdb-nav" data-x title="닫기 (Esc)">✕</button>';
    find.input = bar.querySelector('input');
    find.cnt = bar.querySelector('.kdb-cnt');
    var timer = null;
    find.input.addEventListener('input', function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { runFind(find.input.value); }, 150);
    });
    find.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); gotoMatch(find.cur + (e.shiftKey ? -1 : 1), false); }
      if (e.key === 'Escape') closeFind();
    });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-x')) { closeFind(); return; }
      gotoMatch(find.cur + Number(b.getAttribute('data-d')), false);
    });
    find.bar = bar;
    document.body.appendChild(bar);
    find.input.focus();
  }

  function injectFind() {
    var btn = document.createElement('button');
    btn.id = 'kdb-find-btn';
    btn.className = 'kdb-btn';
    btn.title = '문서 내 찾기';
    btn.textContent = '🔍';
    btn.addEventListener('click', openFind);
    find.btn = btn;
    document.body.appendChild(btn);
  }

  /* ---------- 초기화 ---------- */
  applyTheme();
  function init() {
    injectUI();
    if (!isHome) {
      recordRecent();
      savePosLoop();
      offerResume();
      injectFind();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
