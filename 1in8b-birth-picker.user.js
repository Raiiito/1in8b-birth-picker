// @updateURL   https://raw.githubusercontent.com/Raiiito/1in8b-birth-picker/main/1in8b-birth-picker.user.js
// @downloadURL https://raw.githubusercontent.com/Raiiito/1in8b-birth-picker/main/1in8b-birth-picker.user.js
// ==UserScript==
// @name         1 trong 8 tỷ — Chọn nơi sinh
// @namespace    https://1in8b.life/
// @version      1.0.0
// @description  Tự chọn quốc gia nơi sinh thay vì quay ngẫu nhiên trên 1in8b.life
// @match        *://*.1in8b.life/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // Cố ý KHÔNG dùng tiền tố "one8b." — game dùng tiền tố đó để nhận biết lượt truy cập đầu tiên.
  const KEY = 'bornpicker.iso';

  const LS = {
    get() { try { return localStorage.getItem(KEY) || ''; } catch { return ''; } },
    set(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch { /* bỏ qua */ } },
  };

  let chosen = LS.get(); // mã ISO3 (vd "VNM"); '' = ngẫu nhiên như game gốc
  let armed = false;     // true khi startNewLife() đang chạy và nhân vật chính chưa được tạo
  let hooked = false;

  const classCodeFilled = () => {
    const el = document.querySelector('#classCode');
    return !!(el && String(el.value || '').replace(/\s/g, ''));
  };

  // Lấy các thứ cần dùng từ phạm vi toàn cục của game (script game là script thường, không phải module).
  function game() {
    try {
      if (typeof startNewLife !== 'function' || typeof newLife !== 'function') return null;
      if (typeof COUNTRIES === 'undefined' || typeof CBY === 'undefined') return null;
      return { COUNTRIES, CBY };
    } catch { return null; }
  }

  // ---- Móc vào game -------------------------------------------------------
  // Game tạo nhân vật bằng newLife(mode, pace, iso, opts): nếu iso khác rỗng thì dùng đúng quốc gia đó,
  // nếu null thì tự quay ngẫu nhiên. startNewLife() luôn truyền null → ta chèn iso vào đúng lần gọi đầu tiên.
  function install() {
    if (hooked) return true;
    const g = game();
    if (!g) return false;
    try {
      const origStart = startNewLife;
      const origNew = newLife;

      window.startNewLife = function (...args) {
        // Đang nhập mã lớp (chế độ giáo dục) thì không ép, để cả lớp vẫn ra cùng kết quả.
        armed = !!chosen && !classCodeFilled();
        try { return origStart.apply(this, args); } finally { armed = false; }
      };

      window.newLife = function (mode, pace, iso, opts) {
        if (armed) {
          armed = false; // chỉ ép nhân vật chính; các nhân vật so sánh (companions) vẫn ngẫu nhiên
          if (!iso && g.CBY[chosen]) iso = chosen;
        }
        return origNew.call(this, mode, pace, iso, opts);
      };

      hooked = startNewLife === window.startNewLife && newLife === window.newLife;
    } catch { hooked = false; }
    return hooked;
  }

  // ---- Danh sách quốc gia -------------------------------------------------
  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
  const nameOf = (c) => String((c && (c.ko || c.id)) || '').replace(/^the\s+/i, '');

  function list() {
    const g = game();
    if (!g) return [];
    return g.COUNTRIES
      .map((c) => ({ id: c.id, name: nameOf(c) }))
      .sort((a, b) => a.name.localeCompare(b.name, window.LANG || 'en'));
  }

  function setChoice(iso) {
    const g = game();
    chosen = iso && g && g.CBY[iso] ? iso : '';
    LS.set(chosen);
    refresh();
  }

  // ---- Giao diện ------------------------------------------------------------
  let root, btn, panel, input, listEl, note;

  function refresh() {
    if (!btn) return;
    const g = game();
    const nm = chosen && g && g.CBY[chosen] ? nameOf(g.CBY[chosen]) : '';
    btn.textContent = !hooked ? '⚠ Nơi sinh: chưa kết nối' : nm ? '🌍 Nơi sinh: ' + nm : '🌍 Nơi sinh: ngẫu nhiên';
    btn.classList.toggle('on', !!nm);
    note.textContent = !hooked
      ? 'Chưa móc được vào game. Hãy tải lại trang (Ctrl+F5).'
      : nm
        ? 'Áp dụng cho lần bấm "Bắt đầu" / "Sống lại" tiếp theo. Các nhân vật so sánh vẫn ngẫu nhiên.'
        : 'Đang để ngẫu nhiên như game gốc.';
  }

  function renderList() {
    const q = norm(input.value.trim());
    listEl.textContent = '';
    const rows = list().filter((x) => !q || norm(x.name).includes(q) || x.id.toLowerCase() === q);
    if (!q) rows.unshift({ id: '', name: '🎲 Ngẫu nhiên (mặc định)' });
    for (const r of rows) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bp-item' + (r.id === chosen ? ' on' : '');
      b.textContent = (r.id === chosen ? '✓ ' : '') + r.name;
      b.addEventListener('click', () => { setChoice(r.id); close(); });
      listEl.appendChild(b);
    }
    if (!rows.length) {
      const e = document.createElement('div');
      e.className = 'bp-empty';
      e.textContent = 'Không tìm thấy quốc gia nào.';
      listEl.appendChild(e);
    }
  }

  function open() {
    panel.hidden = false;
    input.value = '';
    renderList();
    refresh();
    input.focus();
  }
  function close() { if (panel) panel.hidden = true; }
  function toggle() { panel.hidden ? open() : close(); }

  function buildUI() {
    if (document.getElementById('bp-root')) return;

    const style = document.createElement('style');
    style.textContent = `
      #bp-root{position:fixed;left:12px;bottom:12px;z-index:2147483000;font:13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#eee}
      #bp-btn{all:unset;box-sizing:border-box;cursor:pointer;padding:8px 13px;border-radius:999px;background:rgba(24,24,28,.92);color:#eee;border:1px solid rgba(255,255,255,.22);box-shadow:0 2px 10px rgba(0,0,0,.35);white-space:nowrap}
      #bp-btn.on{border-color:#4ea1ff;background:rgba(20,48,84,.95)}
      #bp-btn:hover{filter:brightness(1.15)}
      #bp-panel{position:absolute;left:0;bottom:44px;width:min(320px,92vw);max-height:62vh;display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:14px;background:rgba(24,24,28,.97);border:1px solid rgba(255,255,255,.18);box-shadow:0 8px 28px rgba(0,0,0,.5)}
      #bp-panel[hidden]{display:none}
      #bp-q{all:unset;box-sizing:border-box;width:100%;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.18)}
      #bp-list{overflow:auto;display:flex;flex-direction:column;gap:2px;min-height:60px}
      .bp-item{all:unset;box-sizing:border-box;cursor:pointer;padding:7px 9px;border-radius:7px;color:#eee}
      .bp-item:hover{background:rgba(255,255,255,.12)}
      .bp-item.on{background:rgba(78,161,255,.25)}
      .bp-empty{padding:10px;opacity:.7}
      #bp-note{font-size:12px;opacity:.7;padding:0 2px}
    `;
    document.head.appendChild(style);

    root = document.createElement('div');
    root.id = 'bp-root';
    btn = document.createElement('button');
    btn.id = 'bp-btn';
    btn.type = 'button';
    panel = document.createElement('div');
    panel.id = 'bp-panel';
    panel.hidden = true;
    input = document.createElement('input');
    input.id = 'bp-q';
    input.type = 'search';
    input.placeholder = 'Tìm quốc gia… (vd: Việt Nam, VNM)';
    input.autocomplete = 'off';
    listEl = document.createElement('div');
    listEl.id = 'bp-list';
    note = document.createElement('div');
    note.id = 'bp-note';

    panel.append(input, listEl, note);
    root.append(panel, btn);
    document.body.appendChild(root);

    btn.addEventListener('click', toggle);
    input.addEventListener('input', renderList);
    // Gõ trong ô tìm kiếm không được lọt xuống phím tắt của game.
    for (const t of ['keydown', 'keyup', 'keypress']) {
      input.addEventListener(t, (e) => { if (t === 'keydown' && e.key === 'Escape') close(); e.stopPropagation(); });
    }
    document.addEventListener('click', (e) => { if (!root.contains(e.target)) close(); });
    refresh();
  }

  function boot() {
    buildUI();
    const attempt = () => { const ok = install(); refresh(); return ok; };
    if (!attempt()) {
      let n = 0;
      const t = setInterval(() => { if (attempt() || ++n >= 60) clearInterval(t); }, 500);
    }
  }

  // Dùng được từ console: bornPicker.set('VNM'), bornPicker.set(''), bornPicker.list()
  window.bornPicker = {
    set: setChoice,
    get: () => chosen,
    list,
    get hooked() { return hooked; },
  };

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
