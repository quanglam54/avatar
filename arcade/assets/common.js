/* Góc Game — dữ liệu chung: danh sách game, tên người chơi, điểm số, modal, toast */
(function () {
  const GAMES = [
    {
      id: 'snake', title: 'Rắn Săn Mồi', icon: '🐍', cat: 'arcade', c1: '#22c55e', c2: '#0ea5e9', unit: 'điểm',
      desc: 'Ăn táo, dài ra, càng lúc càng nhanh. Đừng cắn vào đuôi!',
      howto: ['Phím mũi tên / WASD để đổi hướng', 'Điện thoại: vuốt trên màn chơi', 'Space để tạm dừng', 'Mỗi quả táo +10 điểm'],
    },
    {
      id: '2048', title: '2048', icon: '🔢', cat: 'puzzle', c1: '#f59e0b', c2: '#ef4444', unit: 'điểm',
      desc: 'Gộp các ô cùng số để tạo ra ô 2048 huyền thoại.',
      howto: ['Phím mũi tên / WASD để trượt', 'Điện thoại: vuốt lên/xuống/trái/phải', 'Hai ô cùng số chạm nhau sẽ gộp lại', 'Hết nước đi là thua'],
    },
    {
      id: 'flappy', title: 'Flappy Bird', icon: '🐤', cat: 'arcade', c1: '#38bdf8', c2: '#a78bfa', unit: 'ống',
      desc: 'Chạm để vỗ cánh, luồn qua khe ống. Nghe dễ mà khó!',
      howto: ['Click / chạm / Space để vỗ cánh', 'Mỗi ống vượt qua +1 điểm', 'Chạm ống hoặc mặt đất là thua'],
    },
    {
      id: 'tetris', title: 'Xếp Gạch', icon: '🧱', cat: 'arcade', c1: '#8b5cf6', c2: '#ec4899', unit: 'điểm',
      desc: 'Xếp khối kín hàng để phá. Tốc độ tăng theo cấp độ.',
      howto: ['← → di chuyển, ↑ xoay', '↓ rơi nhanh, Space thả thẳng', 'P để tạm dừng', 'Phá nhiều hàng một lúc được nhiều điểm hơn'],
    },
    {
      id: 'memory', title: 'Lật Hình', icon: '🃏', cat: 'brain', c1: '#ec4899', c2: '#f97316', unit: 'điểm',
      desc: 'Lật thẻ, nhớ vị trí và ghép đủ 8 cặp càng nhanh càng tốt.',
      howto: ['Lật 2 thẻ mỗi lượt', 'Giống nhau thì giữ, khác thì úp lại', 'Ít lượt + ít thời gian = điểm cao'],
    },
    {
      id: 'minesweeper', title: 'Dò Mìn', icon: '💣', cat: 'puzzle', c1: '#64748b', c2: '#14b8a6', unit: 'giây', lower: true,
      desc: 'Mở hết ô an toàn trên bàn 10×10 có 15 quả mìn.',
      howto: ['Click để mở ô, chuột phải để cắm cờ', 'Điện thoại: bật chế độ 🚩 hoặc nhấn giữ', 'Số trên ô = số mìn xung quanh', 'Thời gian càng ngắn càng xếp hạng cao'],
    },
    {
      id: 'keobo', title: 'Kéo Bò', icon: '🐄', cat: 'arcade', c1: '#e03131', c2: '#f59f00', unit: 'điểm',
      desc: 'Bấm thật nhanh để kéo bò về vạch đích trước các cao bồi khác!',
      howto: ['Bấm nút KÉO! hoặc phím Space thật nhanh', 'Bấm liên tục được COMBO kéo mạnh hơn', 'Bò vùng vẫy kéo ngược lại, đừng dừng tay', 'Về nhất thì sang màn khó hơn'],
    },
    {
      id: 'goldminer', title: 'Đào Vàng', icon: '⛏️', cat: 'arcade', c1: '#f59f00', c2: '#8a4b22', unit: 'điểm',
      desc: 'Thả móc câu gắp vàng, kim cương. Đủ điểm mục tiêu để qua màn!',
      howto: ['Móc câu tự lắc qua lại', 'Click / chạm / Space để thả móc', 'Vàng to nhiều điểm nhưng kéo chậm, đá thì ít điểm', 'Đủ điểm mục tiêu trước khi hết giờ để qua màn'],
    },
    {
      id: 'pikachu', title: 'Pikachu', icon: '⚡', cat: 'puzzle', c1: '#facc15', c2: '#f97316', unit: 'điểm',
      desc: 'Nối thú cổ điển: nối 2 hình giống nhau, đường nối không quá 2 lần rẽ.',
      howto: ['Chọn 2 hình giống nhau để nối', 'Đường nối tối đa 3 đoạn (2 lần rẽ), không cắt qua hình khác', 'Nối liên tiếp nhanh được cộng combo', 'Có 3 lần gợi ý 💡 và 3 lần đảo 🔀', 'Hết giờ là kết thúc'],
    },
  ];

  const CATS = { arcade: 'Hành động', puzzle: 'Giải đố', brain: 'Trí nhớ' };

  const memory = {};
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? (key in memory ? memory[key] : fallback) : JSON.parse(raw);
    } catch (e) {
      return key in memory ? memory[key] : fallback;
    }
  }
  function save(key, value) {
    memory[key] = value;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* bỏ qua */ }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const game = (id) => GAMES.find((g) => g.id === id);
  const getName = () => load('gh_name', '');
  const setName = (n) => save('gh_name', n);
  const better = (g, a, b) => (g.lower ? a < b : a > b);

  function fmt(g, score) {
    if (score == null) return '—';
    if (g.unit === 'giây') return score.toFixed(1) + 's';
    return Number(score).toLocaleString('vi-VN');
  }

  /** Điểm cao nhất của một người trong một game */
  function best(id, name = getName()) {
    const g = game(id);
    const list = (load('gh_scores', {})[id] || []).filter((s) => s.name === name);
    if (!list.length) return null;
    return list.reduce((b, s) => (better(g, s.score, b) ? s.score : b), list[0].score);
  }

  /** Bảng xếp hạng: mỗi người chỉ lấy điểm tốt nhất */
  function top(id, n = 10) {
    const g = game(id);
    const byName = {};
    for (const s of load('gh_scores', {})[id] || []) {
      if (!byName[s.name] || better(g, s.score, byName[s.name].score)) byName[s.name] = s;
    }
    return Object.values(byName)
      .sort((a, b) => (g.lower ? a.score - b.score : b.score - a.score))
      .slice(0, n);
  }

  function submit(id, score) {
    const g = game(id);
    const name = getName() || 'Khách';
    const prev = best(id, name);
    const all = load('gh_scores', {});
    const list = all[id] || [];
    list.push({ name, score, at: Date.now() });
    list.sort((a, b) => (g.lower ? a.score - b.score : b.score - a.score));
    all[id] = list.slice(0, 200);
    save('gh_scores', all);

    const plays = load('gh_plays', {});
    plays[name] = (plays[name] || 0) + 1;
    save('gh_plays', plays);

    const isBest = prev == null || better(g, score, prev);
    const rank = top(id, 999).findIndex((s) => s.name === name) + 1;
    if (document.getElementById('side')) renderSide(id);
    return { isBest, rank, prev };
  }

  function playsOf(name = getName()) {
    return load('gh_plays', {})[name] || 0;
  }

  /* ---------- UI helpers ---------- */
  function toast(msg, ms = 2600) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  const RANDOM_NAMES = ['Mèo Ú', 'Cáo Lém', 'Gấu Trúc', 'Rồng Con', 'Sóc Nhí', 'Cú Mèo', 'Hổ Con', 'Thỏ Ngọc', 'Cá Heo', 'Ong Vàng'];

  function askName(required, onDone) {
    const current = getName();
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `
      <form class="modal" autocomplete="off">
        <h3>${current ? 'Đổi tên người chơi' : 'Chào bạn! 👋'}</h3>
        <p>Nhập tên để lưu điểm và lên bảng xếp hạng.</p>
        <input class="field" name="n" maxlength="20" placeholder="Tên của bạn" value="${esc(current)}">
        <div class="err"></div>
        <div class="modal-actions">
          <button type="button" class="btn ghost small" data-rand>🎲 Tên ngẫu nhiên</button>
          ${required && !current ? '' : '<button type="button" class="btn ghost small" data-cancel>Huỷ</button>'}
          <button class="btn small">Lưu</button>
        </div>
      </form>`;
    document.body.appendChild(back);
    const input = back.querySelector('input');
    const err = back.querySelector('.err');
    setTimeout(() => input.focus(), 30);

    const close = () => back.remove();
    back.querySelector('[data-rand]').onclick = () => {
      input.value = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)] + ' ' + Math.floor(Math.random() * 90 + 10);
      input.focus();
    };
    const cancel = back.querySelector('[data-cancel]');
    if (cancel) cancel.onclick = close;
    back.addEventListener('mousedown', (e) => { if (e.target === back && cancel) close(); });
    back.querySelector('form').onsubmit = (e) => {
      e.preventDefault();
      const v = input.value.trim().replace(/\s+/g, ' ');
      if (v.length < 2) { err.textContent = 'Tên cần ít nhất 2 ký tự.'; return; }
      setName(v);
      close();
      toast('Xin chào, ' + v + '!');
      onDone && onDone(v);
    };
  }

  /* ---------- Theme ---------- */
  function applyTheme() {
    const t = load('gh_theme', null) || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', t);
    return t;
  }
  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    save('gh_theme', next);
    applyTheme();
  }
  applyTheme();

  /* ---------- Game page ---------- */
  function lbHtml(id, n = 10) {
    const g = game(id);
    const list = top(id, n);
    if (!list.length) return '<div class="lb-empty">Chưa có ai chơi. Bạn là người đầu tiên!</div>';
    const medals = ['🥇', '🥈', '🥉'];
    const me = getName();
    return '<ol class="lb-list">' + list.map((s, i) => `
      <li class="${s.name === me ? 'me' : ''}">
        <span class="lb-rank">${medals[i] || i + 1}</span>
        <span class="lb-name">${esc(s.name)}</span>
        <span class="lb-score">${fmt(g, s.score)}</span>
      </li>`).join('') + '</ol>';
  }

  function renderSide(id) {
    const g = game(id);
    const side = document.getElementById('side');
    const name = getName() || 'Khách';
    const b = best(id);
    if (side) {
      side.innerHTML = `
        <div class="panel">
          <div class="me-row">
            <div class="avatar">${esc(name.charAt(0).toUpperCase())}</div>
            <div style="flex:1;min-width:0"><b>${esc(name)}</b><small>Kỷ lục: <span class="badge-best">${fmt(g, b)}</span></small></div>
            <button class="icon-btn" data-rename title="Đổi tên">✏️</button>
          </div>
        </div>
        <div class="panel"><h4>🏆 Bảng xếp hạng</h4>${lbHtml(id)}</div>
        <div class="panel"><h4>Cách chơi</h4><ul class="howto">${g.howto.map((h) => `<li>${h}</li>`).join('')}</ul></div>`;
      side.querySelector('[data-rename]').onclick = () => askName(false, () => renderSide(id));
    }
    document.querySelectorAll('[data-best]').forEach((el) => { el.textContent = fmt(g, b); });
    const chip = document.querySelector('#ghName span');
    if (chip) chip.textContent = name;
  }

  function initGame(id) {
    const g = game(id);
    document.title = g.title + ' · Góc Game';
    const bar = document.createElement('header');
    bar.className = 'topbar';
    bar.innerHTML = `
      <a class="back" href="#" data-exit>✕ Thoát</a>
      <div class="gtitle"><span class="gicon" style="background:linear-gradient(135deg,${g.c1},${g.c2})">${g.icon}</span><span>${g.title}</span></div>
      <button class="icon-btn" data-theme-toggle title="Đổi giao diện">🌓</button>
      <button class="chip" id="ghName">👤 <span></span></button>`;
    document.body.prepend(bar);
    bar.querySelector('[data-theme-toggle]').onclick = toggleTheme;
    bar.querySelector('[data-exit]').onclick = (e) => { e.preventDefault(); parent.postMessage({ type: 'arcade-close' }, '*'); };
    bar.querySelector('#ghName').onclick = () => askName(false, () => renderSide(id));
    renderSide(id);
    save('gh_recent', id);
    if (!getName()) setName('Khách');
    return g;
  }

  /** Hiện lớp phủ trên khu vực chơi. Trả về hàm để đóng. */
  function overlay(area, html, buttonText, onButton) {
    area.querySelectorAll('.overlay').forEach((o) => o.remove());
    const o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = `<div>${html}${buttonText ? `<button class="btn">${buttonText}</button>` : ''}</div>`;
    area.appendChild(o);
    const close = () => o.remove();
    if (buttonText) {
      o.querySelector('.btn').onclick = (e) => { e.stopPropagation(); close(); onButton && onButton(); };
    }
    return close;
  }

  /** Lớp phủ kết thúc ván chung cho mọi game */
  function gameOver(area, id, score, { title = 'Kết thúc!', note = '', win = false } = {}, onAgain) {
    const g = game(id);
    const r = submit(id, score);
    // báo điểm về game Avatar để nhận thưởng xu
    try { parent.postMessage({ type: 'arcade-score', game: id, score }, '*'); } catch (e) { /* bỏ qua */ }
    const msg = r.isBest
      ? (r.prev == null ? '🎉 Kỷ lục đầu tiên của bạn!' : '🔥 Kỷ lục mới!')
      : 'Kỷ lục của bạn: ' + fmt(g, best(id));
    overlay(area, `
      <h2>${win ? '🏆 ' : ''}${title}</h2>
      <div class="big">${fmt(g, score)}${g.unit !== 'giây' && g.unit !== 'điểm' ? ' <small style="font-size:18px">' + g.unit + '</small>' : ''}</div>
      <p>${msg}<br>Hạng #${r.rank} trên bảng xếp hạng${note ? '<br>' + note : ''}</p>`, 'Chơi lại', onAgain);
  }

  /** Bắt cử chỉ vuốt */
  function onSwipe(el, cb) {
    let sx = 0, sy = 0, active = false;
    el.addEventListener('touchstart', (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; active = true; }, { passive: true });
    el.addEventListener('touchmove', (e) => { if (active) e.preventDefault(); }, { passive: false });
    el.addEventListener('touchend', (e) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) cb(dx > 0 ? 'right' : 'left');
      else cb(dy > 0 ? 'down' : 'up');
    });
  }

  window.GH = {
    GAMES, CATS, game, getName, setName, best, top, submit, fmt, esc, playsOf, load, save,
    toast, askName, toggleTheme, initGame, renderSide, overlay, gameOver, onSwipe, lbHtml,
  };
})();
