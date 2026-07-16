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
      '#kdb-toast .x{opacity:.6;font-size:15px}';
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.id = 'kdb-controls';

    if (!isHome) {
      var home = document.createElement('a');
      home.className = 'kdb-btn';
      home.href = './';
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

  /* ---------- 초기화 ---------- */
  applyTheme();
  function init() {
    injectUI();
    if (!isHome) {
      recordRecent();
      savePosLoop();
      offerResume();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
