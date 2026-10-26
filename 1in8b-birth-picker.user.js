// ==UserScript==
// @name         1 trong 8 tỷ — Chọn nơi sinh
// @name:en      1in8b — Choose your birthplace
// @namespace    https://1in8b.life/
// @version      1.2.0
// @description  Tự chọn quốc gia nơi sinh thay vì quay ngẫu nhiên trên 1in8b.life
// @description:en  Pick your birth country instead of the random roll on 1in8b.life
// @homepageURL  https://github.com/Raiiito/1in8b-birth-picker
// @match        *://*.1in8b.life/*
// @run-at       document-idle
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Raiiito/1in8b-birth-picker/main/1in8b-birth-picker.user.js
// @downloadURL  https://raw.githubusercontent.com/Raiiito/1in8b-birth-picker/main/1in8b-birth-picker.user.js
// ==/UserScript==

(() => {
  'use strict';
  if (window.bornPicker) return; // đã chạy rồi (vd: vừa cài userscript vừa bấm bookmarklet)

  // Cố ý KHÔNG dùng tiền tố "one8b." — game dùng tiền tố đó để nhận biết lượt truy cập đầu tiên.
  const K = { iso: 'bornpicker.iso', lang: 'bornpicker.lang', skip: 'bornpicker.skipanim' };

  const LS = {
    get(k) { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
    set(k, v) { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch { /* bỏ qua */ } },
  };

  // ---- Ngôn ngữ giao diện của tool (vi / en) ------------------------------
  const T = {
    vi: {
      notConnected: '⚠ Nơi sinh: chưa kết nối',
      born: '🌍 Nơi sinh: ',
      random: '🌍 Nơi sinh: ngẫu nhiên',
      search: 'Tìm quốc gia… (vd: Việt Nam, VNM)',
      randomOpt: '🎲 Ngẫu nhiên (mặc định)',
      empty: 'Không tìm thấy quốc gia nào.',
      skip: 'Bỏ hoạt ảnh quay quốc gia',
      noteOff: 'Chưa móc được vào game. Hãy tải lại trang (Ctrl+F5).',
      noteOn: 'Áp dụng cho lần bấm "Bắt đầu" / "Sống lại" tiếp theo. Các nhân vật so sánh vẫn ngẫu nhiên.',
      noteRandom: 'Đang để ngẫu nhiên như game gốc.',
    },
    en: {
      notConnected: '⚠ Birthplace: not connected',
      born: '🌍 Born in: ',
      random: '🌍 Birthplace: random',
      search: 'Search country… (e.g. Vietnam, VNM)',
      randomOpt: '🎲 Random (default)',
      empty: 'No country found.',
      skip: 'Skip the country-roll animation',
      noteOff: 'Could not hook into the game. Reload the page (Ctrl+F5).',
      noteOn: 'Applies the next time you press "Start" / "Live again". Comparison characters stay random.',
      noteRandom: 'Random, like the original game.',
    },
  };

  const gameLang = () => (typeof window.LANG === 'string' ? window.LANG : '');
  let lang = LS.get(K.lang);
  if (lang !== 'vi' && lang !== 'en') lang = gameLang() === 'vi' ? 'vi' : 'en';
  const t = () => T[lang];

  let chosen = LS.get(K.iso);          // mã ISO3 (vd "VNM"); '' = ngẫu nhiên như game gốc
  let skipAnim = LS.get(K.skip) !== '0'; // mặc định BẬT: bỏ hoạt ảnh quay quốc gia
  let armed = false;                   // true khi startNewLife() đang chạy và nhân vật chính chưa được tạo
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

  // ---- Bỏ hoạt ảnh quay -----------------------------------------------------
  // Game đã có sẵn đường tắt cho "giảm chuyển động" (prefers-reduced-motion): nhảy thẳng tới quốc gia kết quả,
  // rồi gọi showCert sau 650 ms. Trong lúc startNewLife() chạy ta giả lập đường tắt đó và đặt độ trễ showCert = 0.
  function instantResult() {
    const mm = window.matchMedia;
    const st = window.setTimeout;
    window.matchMedia = function (q) {
      if (/prefers-reduced-motion/i.test(String(q))) {
        return {
          matches: true, media: String(q), onchange: null,
          addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
          dispatchEvent() { return false; },
        };
      }
      return mm ? mm.apply(window, arguments) : undefined;
    };
    window.setTimeout = function (fn, ms, ...rest) {
      const isCert = typeof showCert === 'function' && fn === showCert;
      return st.call(window, fn, isCert ? 0 : ms, ...rest);
    };
    return () => { window.matchMedia = mm; window.setTimeout = st; };
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
        const undo = skipAnim ? instantResult() : null;
        try { return origStart.apply(this, args); } finally { armed = false; if (undo) undo(); }
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

  // ---- Tên quốc gia -------------------------------------------------------
  // Mã ISO3 của game -> ISO2, để lấy tên nước theo ngôn ngữ bằng Intl.DisplayNames.
  const ISO2 = Object.fromEntries(('AFG:AF,AGO:AO,ARG:AR,AUS:AU,AUT:AT,AZE:AZ,BGD:BD,BLR:BY,BEL:BE,BEN:BJ,BOL:BO,BWA:BW,BRA:BR,BGR:BG,BFA:BF,BDI:BI,KHM:KH,CMR:CM,CAN:CA,CAF:CF,CHL:CL,CHN:CN,COL:CO,COG:CG,CRI:CR,CIV:CI,CUB:CU,CZE:CZ,COD:CD,DNK:DK,DOM:DO,ECU:EC,EGY:EG,SLV:SV,GNQ:GQ,ERI:ER,ETH:ET,FIN:FI,FRA:FR,GAB:GA,GMB:GM,GEO:GE,DEU:DE,GHA:GH,GRC:GR,GTM:GT,GIN:GN,GNB:GW,HTI:HT,HND:HN,HUN:HU,IND:IN,IDN:ID,IRN:IR,IRQ:IQ,IRL:IE,ISR:IL,ITA:IT,JAM:JM,JPN:JP,JOR:JO,KAZ:KZ,KEN:KE,KWT:KW,KGZ:KG,LAO:LA,LBN:LB,LSO:LS,LBR:LR,LBY:LY,MDG:MG,MWI:MW,MYS:MY,MLI:ML,MRT:MR,MEX:MX,MNG:MN,MAR:MA,MOZ:MZ,MMR:MM,NAM:NA,NPL:NP,NLD:NL,NZL:NZ,NIC:NI,NER:NE,NGA:NG,PRK:KP,NOR:NO,OMN:OM,PAK:PK,PSE:PS,PAN:PA,PNG:PG,PRY:PY,PER:PE,PHL:PH,POL:PL,PRT:PT,QAT:QA,ROU:RO,RUS:RU,RWA:RW,SAU:SA,SEN:SN,SRB:RS,SLE:SL,SGP:SG,SVK:SK,SOM:SO,ZAF:ZA,KOR:KR,SSD:SS,ESP:ES,LKA:LK,SDN:SD,SWE:SE,CHE:CH,SYR:SY,TWN:TW,TJK:TJ,TZA:TZ,THA:TH,TGO:TG,TUN:TN,TUR:TR,TKM:TM,UGA:UG,UKR:UA,ARE:AE,GBR:GB,USA:US,URY:UY,UZB:UZ,VEN:VE,VNM:VN,YEM:YE,ZMB:ZM,ZWE:ZW,HKG:HK,HRV:HR,BIH:BA,MDA:MD,ARM:AM,LTU:LT,SVN:SI,LVA:LV,MKD:MK,XKX:XK,BHR:BH,TTO:TT,TLS:TL,EST:EE,CYP:CY,MUS:MU,SWZ:SZ,DJI:DJ,FJI:FJ,COM:KM,GUY:GY,SLB:SB,BTN:BT,MAC:MO,LUX:LU,MNE:ME,SUR:SR,MLT:MT,MDV:MV,CPV:CV').split(',').map((p) => p.split(':')));

  const dn = {};
  function regionName(id, lg) {
    try {
      const code = ISO2[id];
      if (!code) return '';
      dn[lg] = dn[lg] || new Intl.DisplayNames([lg], { type: 'region' });
      const n = dn[lg].of(code);
      return n && n !== code ? n : '';
    } catch { return ''; }
  }
  const gameName = (c) => String((c && (c.ko || c.id)) || '').replace(/^the\s+/i, '');
  // Trùng ngôn ngữ với game thì dùng đúng tên trong game; khác thì lấy tên theo Intl (không có thì quay về tên game).
  const nameFor = (c, lg) => (lg === gameLang() ? gameName(c) : regionName(c.id, lg) || gameName(c));

  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

  function list() {
    const g = game();
    if (!g) return [];
    const other = lang === 'vi' ? 'en' : 'vi';
    return g.COUNTRIES
      .map((c) => ({ id: c.id, name: nameFor(c, lang), alt: nameFor(c, other) }))
      .sort((a, b) => a.name.localeCompare(b.name, lang));
  }

  function setChoice(iso) {
    const g = game();
    chosen = iso && g && g.CBY[iso] ? iso : '';
    LS.set(K.iso, chosen);
    refresh();
  }

  function setLang(l) {
    if (l !== 'vi' && l !== 'en') return;
    lang = l;
    LS.set(K.lang, l);
    applyTexts();
    refresh();
    if (panel && !panel.hidden) renderList();
  }

  function setSkip(on) {
    skipAnim = !!on;
    LS.set(K.skip, skipAnim ? '' : '0');
    if (skipBox) skipBox.checked = skipAnim;
  }

  // ---- Giao diện ------------------------------------------------------------
  let root, btn, panel, input, listEl, note, skipBox, skipText, langBtns;

  function applyTexts() {
    if (!root) return;
    input.placeholder = t().search;
    skipText.textContent = t().skip;
    for (const b of langBtns) b.classList.toggle('on', b.dataset.l === lang);
  }

  function refresh() {
    if (!btn) return;
    const g = game();
    const nm = chosen && g && g.CBY[chosen] ? nameFor(g.CBY[chosen], lang) : '';
    btn.textContent = !hooked ? t().notConnected : nm ? t().born + nm : t().random;
    btn.classList.toggle('on', !!nm);
    note.textContent = !hooked ? t().noteOff : nm ? t().noteOn : t().noteRandom;
  }

  function renderList() {
    const q = norm(input.value.trim());
    listEl.textContent = '';
    const rows = list().filter((x) => !q || norm(x.name).includes(q) || norm(x.alt).includes(q) || x.id.toLowerCase() === q);
    if (!q) rows.unshift({ id: '', name: t().randomOpt });
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
      e.textContent = t().empty;
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
      #bp-top{display:flex;gap:6px;align-items:center}
      #bp-q{all:unset;box-sizing:border-box;flex:1;min-width:0;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.18)}
      #bp-lang{display:flex;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,.18)}
      .bp-l{all:unset;box-sizing:border-box;cursor:pointer;padding:7px 9px;font-size:12px;font-weight:600;color:#bbb}
      .bp-l.on{background:rgba(78,161,255,.35);color:#fff}
      #bp-list{overflow:auto;display:flex;flex-direction:column;gap:2px;min-height:60px}
      .bp-item{all:unset;box-sizing:border-box;cursor:pointer;padding:7px 9px;border-radius:7px;color:#eee}
      .bp-item:hover{background:rgba(255,255,255,.12)}
      .bp-item.on{background:rgba(78,161,255,.25)}
      .bp-empty{padding:10px;opacity:.7}
      #bp-skip{display:flex;gap:8px;align-items:center;cursor:pointer;padding:2px;font-size:12px}
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

    const top = document.createElement('div');
    top.id = 'bp-top';
    input = document.createElement('input');
    input.id = 'bp-q';
    input.type = 'search';
    input.autocomplete = 'off';
    const langBox = document.createElement('div');
    langBox.id = 'bp-lang';
    langBtns = ['vi', 'en'].map((l) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bp-l';
      b.dataset.l = l;
      b.textContent = l.toUpperCase();
      b.addEventListener('click', () => setLang(l));
      langBox.appendChild(b);
      return b;
    });
    top.append(input, langBox);

    listEl = document.createElement('div');
    listEl.id = 'bp-list';

    const skipLabel = document.createElement('label');
    skipLabel.id = 'bp-skip';
    skipBox = document.createElement('input');
    skipBox.type = 'checkbox';
    skipBox.checked = skipAnim;
    skipBox.addEventListener('change', () => setSkip(skipBox.checked));
    skipText = document.createElement('span');
    skipLabel.append(skipBox, skipText);

    note = document.createElement('div');
    note.id = 'bp-note';

    panel.append(top, listEl, skipLabel, note);
    root.append(panel, btn);
    document.body.appendChild(root);

    btn.addEventListener('click', toggle);
    input.addEventListener('input', renderList);
    // Gõ trong ô tìm kiếm không được lọt xuống phím tắt của game.
    for (const ev of ['keydown', 'keyup', 'keypress']) {
      input.addEventListener(ev, (e) => { if (ev === 'keydown' && e.key === 'Escape') close(); e.stopPropagation(); });
    }
    document.addEventListener('click', (e) => { if (!root.contains(e.target)) close(); });
    applyTexts();
    refresh();
  }

  function boot() {
    buildUI();
    const attempt = () => { const ok = install(); refresh(); return ok; };
    if (!attempt()) {
      let n = 0;
      const timer = setInterval(() => { if (attempt() || ++n >= 60) clearInterval(timer); }, 500);
    }
  }

  // Dùng được từ console: bornPicker.set('VNM'), bornPicker.set(''), bornPicker.lang('en'), bornPicker.skipAnim(false)
  window.bornPicker = {
    set: setChoice,
    get: () => chosen,
    list,
    lang: setLang,
    skipAnim: setSkip,
    get hooked() { return hooked; },
  };

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
