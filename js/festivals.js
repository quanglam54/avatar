/* 🎉 SỰ KIỆN THEO DỊP — tự bật theo ngày thật (giờ Việt Nam):
 *  👩‍🏫 Ngày Nhà giáo 20/11 (1–21/11): tặng hoa thầy cô ở Trường học → 💌 thiệp tri ân → đổi quà
 *  🎄 Giáng sinh (1/12–1/1): hộp quà rơi khắp các khu, ông già Noel + cây thông ở Quảng trường → 🍭 kẹo gậy → đổi quà
 *  🧧 Tết Nguyên Đán (15 ngày trước → mùng 10): ông đồ cho chữ + lì xì mỗi ngày, cây đào cây mai, câu đối → 🧧 phong bao → đổi quà
 * Thử sự kiện: thêm ?fest=teacher | xmas | tet vào địa chỉ trang. */
const FEST = (() => {
  const S = () => AV.S;
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const today = () => new Date().toDateString();
  const TET = { 2026: '2026-02-17', 2027: '2027-02-06', 2028: '2028-01-26', 2029: '2029-02-13', 2030: '2030-02-03' };
  function current(d = new Date()) {
    const o = new URLSearchParams(location.search).get('fest');
    if (o) return EV[o] ? o : null;
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    for (const yy of [y, y + 1]) { const t = TET[yy]; if (!t) continue; const diff = (d - new Date(t + 'T00:00:00')) / 864e5; if (diff >= -15 && diff <= 10) return 'tet'; }
    if (m === 11 && day <= 21) return 'teacher';
    if (m === 12 || (m === 1 && day === 1)) return 'xmas';
    return null;
  }
  const W = (id) => () => { if (typeof WARDROBE === 'undefined') return false; return WARDROBE.give(id); };
  const G = (k) => () => (typeof GARDEN !== 'undefined' && GARDEN.addDeco ? GARDEN.addDeco(k, 1) : false);
  const EV = {
    teacher: {
      name: 'Ngày Nhà giáo Việt Nam 20/11', icon: '👩‍🏫', col: '#e64980', token: ['fe_card', 'Thiệp tri ân', '💌'],
      how: 'Mua 💐 hoa bó ở Chợ hoa Quảng Bá (Hồ Tây) rồi mang tới <b>💐 Bàn tri ân</b> ở 🏫 Trường học tặng thầy cô: mỗi bó được <b>2 💌</b>. Mỗi ngày còn được viết 1 thiệp miễn phí. Gom thiệp đổi quà bên dưới.',
      shop: [[3, '💰 30.000 xu', () => { AV.earn(30000, 20); return true; }], [6, '👗 Áo dài trắng nữ sinh', W('aodai_white')], [6, '🤵 Bộ vest xanh navy', W('suit_navy')], [10, '🌼 Chậu mai vàng (trang trí vườn)', G('mai')]],
    },
    xmas: {
      name: 'Giáng sinh an lành', icon: '🎄', col: '#2b8a3e', token: ['fe_cane', 'Kẹo gậy Noel', '🍭'],
      how: 'Hộp quà 🎁 rơi ngẫu nhiên ở các khu ngoài trời — thấy là nhặt! Mỗi ngày ghé <b>🎅 Ông già Noel</b> ở ⛲ Quảng trường nhận quà. Gom 🍭 kẹo gậy đổi quà bên dưới.',
      shop: [[4, '💰 40.000 xu', () => { AV.earn(40000, 20); return true; }], [8, '🧶 Áo len Noel', W('sweater_noel')], [8, '🧥 Áo phao siêu ấm', W('puffer')], [12, '🌲 Cây thông (trang trí vườn)', G('pine')]],
    },
    tet: {
      name: 'Tết Nguyên Đán', icon: '🧧', col: '#c92a2a', token: ['fe_lixi', 'Phong bao lì xì', '🧧'],
      how: 'Mỗi ngày ghé <b>🖌️ Ông đồ</b> ở ⛲ Quảng trường xin chữ đầu năm và nhận lì xì may mắn. Gom 🧧 phong bao đổi quà bên dưới. Đêm giao thừa ra 🌅 Hồ Tây xem pháo hoa!',
      shop: [[3, '💰 88.888 xu', () => { AV.earn(88888, 30); return true; }], [6, '👘 Áo dài đỏ du xuân', W('aodai_red')], [6, '🥻 Áo dài nam gấm', W('aodai_m')], [8, '🌸 Cây đào Nhật Tân (trang trí vườn)', G('dao_tet')]],
    },
  };
  Object.values(EV).forEach((e) => { const [id, n, ic] = e.token; if (DATA.ITEMS && !DATA.ITEMS[id]) DATA.ITEMS[id] = { name: n, icon: ic, sell: 0 }; });
  const tok = () => { const e = EV[current()]; return e ? (S().inv[e.token[0]] || 0) : 0; };
  const give = (n) => { const e = EV[current()]; if (e) AV.addItem(e.token[0], n); };
  const day = () => { const s = S(); s.fest = s.fest || {}; if (s.fest.day !== today()) s.fest = { day: today() }; return s.fest; };

  /* ---------- bảng sự kiện ---------- */
  function panel() {
    const k = current(), e = EV[k];
    if (!e) return UI.toast('Hiện chưa có sự kiện — sự kiện tiếp theo: 20/11, Giáng sinh, Tết 🎉');
    const p = UI.panel(`${e.icon} ${e.name}`, '', { wide: true });
    const render = () => {
      const have = tok();
      p.body.innerHTML = `<div class="coins-line">${e.token[2]} Bạn đang có <b>${have}</b> ${e.token[1]}</div><p>${e.how}</p>
        <div class="shop-list">${e.shop.map(([n, label], i) => `<div class="shop-row"><span class="ic">🎁</span><div class="info"><b>${label}</b><small>Cần ${n} ${e.token[2]}</small></div><button class="btn small" data-x="${i}" ${have >= n ? '' : 'disabled'}>Đổi</button></div>`).join('')}</div>
        <p class="muted small-note">Quà quần áo vào 👗 Đồ của tôi / 🎒 Đồ đã mua · cây cảnh vào kho đồ Vườn Nhà.</p>`;
      p.body.querySelectorAll('[data-x]').forEach((b) => b.onclick = () => {
        const [n, label, fn] = e.shop[+b.dataset.x];
        if (tok() < n) return;
        if (fn() === false) return UI.toast('Bạn có món này rồi 😊');
        S().inv[e.token[0]] -= n; AV.markChanged(); UI.toast(`🎁 Đã đổi ${label}!`, 4000); render();
      });
    };
    render();
  }

  /* ---------- hoạt động ---------- */
  const GIFT_IDS = () => Object.keys(DATA.ITEMS).filter((id) => DATA.ITEMS[id].gift || id === 'bouquet');
  function teacherDesk() {
    if (current() !== 'teacher') return;
    const d = day(), gifts = GIFT_IDS().filter((id) => (S().inv[id] || 0) > 0);
    const p = UI.panel('💐 Bàn tri ân thầy cô', `<p>Nhân ngày 20/11, gửi lời cảm ơn tới các thầy cô đã dạy dỗ mình 💗</p>
      <div class="shop-list">
        <div class="shop-row"><span class="ic">✍️</span><div class="info"><b>Viết thiệp chúc mừng</b><small>Mỗi ngày 1 lần · +1 💌</small></div><button class="btn small" data-w ${d.card ? 'disabled' : ''}>${d.card ? 'Đã viết' : 'Viết'}</button></div>
        ${gifts.map((id) => `<div class="shop-row"><span class="ic">${DATA.ITEMS[id].icon}</span><div class="info"><b>Tặng ${DATA.ITEMS[id].name}</b><small>Đang có ${S().inv[id]} · +2 💌 · còn ${3 - (d.flowers || 0)} lượt hôm nay</small></div><button class="btn small" data-g="${id}" ${(d.flowers || 0) >= 3 ? 'disabled' : ''}>Tặng</button></div>`).join('') || '<p class="muted">Chưa có hoa — mua 💐 hoa bó ở Chợ hoa Quảng Bá (Hồ Tây).</p>'}
      </div>
      <div class="row-end"><button class="btn ghost" data-shop>🎁 Đổi quà (${tok()} 💌)</button></div>`);
    const wb = p.body.querySelector('[data-w]'); if (wb) wb.onclick = () => { d.card = 1; give(1); AV.earn(0, 10); UI.toast('✍️ "Chúc thầy cô luôn mạnh khoẻ, hạnh phúc!" — +1 💌'); p.close(); teacherDesk(); };
    p.body.querySelectorAll('[data-g]').forEach((b) => b.onclick = () => { if ((d.flowers || 0) >= 3 || !(S().inv[b.dataset.g] > 0)) return; S().inv[b.dataset.g]--; d.flowers = (d.flowers || 0) + 1; give(2); const c = 200 + Math.floor(Math.random() * 800); AV.earn(c, 20); AV.sayMine('💐 Em chúc cô ạ!'); UI.toast(`💐 Cô giáo cảm động lắm! +2 💌, +${c} xu`, 4000); p.close(); teacherDesk(); });
    p.body.querySelector('[data-shop]').onclick = () => { p.close(); panel(); };
  }
  function santa() {
    if (current() !== 'xmas') return;
    const d = day();
    if (!d.santa) { d.santa = 1; give(3); AV.earn(1000, 20); AV.sayMine('🎅 Ho ho ho!'); UI.toast('🎅 Ông già Noel tặng bạn 3 🍭 kẹo gậy và 1.000 xu! Merry Christmas!', 5000); AV.markChanged(); }
    panel();
  }
  const WORDS = ['Phúc', 'Lộc', 'Thọ', 'An', 'Khang', 'Tâm', 'Nhẫn', 'Đức', 'Tài', 'Phát'];
  function ongDo() {
    if (current() !== 'tet') return;
    const d = day();
    if (!d.lixi) {
      d.lixi = 1;
      const w = WORDS[Math.floor(Math.random() * WORDS.length)], c = [8888, 18888, 28888, 68888, 88888][Math.random() < 0.05 ? 4 : Math.floor(Math.random() * 4)];
      give(2); AV.earn(c, 30); AV.markChanged();
      UI.panel('🖌️ Ông đồ cho chữ', `<div style="text-align:center"><div style="display:inline-block;background:#c92a2a;color:#ffd43b;font:900 64px serif;padding:18px 34px;border-radius:12px;border:4px solid #ffd43b">${w}</div>
        <p>Ông đồ tặng bạn chữ <b>“${w}”</b> đầu năm 🧧</p><p>Lì xì may mắn: <b>+${fmt(c)} xu</b> · +2 🧧</p></div>`);
      return;
    }
    panel();
  }

  /* ---------- 🎁 hộp quà Giáng sinh rơi ở khu ngoài trời ---------- */
  let giftAt = 0;
  function dropGifts() {
    if (current() !== 'xmas' || !AV.currentMap || !AV.dropPickup || (AV.mapIndoor && AV.mapIndoor())) return;
    if (Date.now() - giftAt < 150e3) return;
    const pk = AV.pickups ? AV.pickups() : [];
    if (pk.filter((p) => p.feGift).length >= 3) return;
    giftAt = Date.now();
    const P = AV.player;
    for (let tries = 0; tries < 30; tries++) {
      const x = P.x + (Math.random() - 0.5) * 1200, y = P.y + (Math.random() - 0.5) * 400;
      if (x < 60 || x > (AV.mapW ? AV.mapW() - 60 : 2000) || AV.blocked(x, y)) continue;
      AV.dropPickup(x, y, '🎁', () => { give(1); const c = 50 + Math.floor(Math.random() * 250); AV.earn(c, 5); UI.toast(`🎁 Mở hộp quà: +1 🍭 kẹo gậy, +${c} xu`, 2500); }, { feGift: 1, big: true });
      break;
    }
  }

  /* ---------- trang trí bản đồ (chỉ hiện khi đúng dịp) ---------- */
  const circ = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  function xmasTree(c, x, y, t) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y, 90, 16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6b4423'; c.fillRect(x - 12, y - 40, 24, 40);
    [[0, 150, 70], [-50, 120, 52], [-100, 90, 36], [-145, 60, 22]].forEach(([dy, w, h]) => { const yy = y - 40 + dy * 0.9 - 10; c.fillStyle = '#1e7a34'; c.beginPath(); c.moveTo(x - w / 2 - 30, yy); c.lineTo(x + w / 2 + 30, yy); c.lineTo(x, yy - h * 1.6); c.closePath(); c.fill(); });
    for (let k = 0; k < 26; k++) { const a = k * 2.4, r = 10 + (k % 13) * 6, xx = x + Math.cos(a) * r * 0.9, yy = y - 60 - (k % 13) * 13; const on = Math.sin(t * 3 + k) > 0; circ(c, xx, yy, 4, on ? ['#ff6b6b', '#ffd43b', '#74c0fc', '#f783ac'][k % 4] : '#495057'); }
    c.fillStyle = '#ffd43b'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 7 : 16; c.lineTo(x + Math.cos(a) * r, y - 225 + Math.sin(a) * r); } c.closePath(); c.fill();
    ['#e03131', '#1c7ed6', '#f08c00'].forEach((col, i) => { c.fillStyle = col; c.fillRect(x - 70 + i * 50, y - 22, 34, 26); c.fillStyle = '#fff'; c.fillRect(x - 55 + i * 50, y - 22, 4, 26); });
  }
  function peach(c, x, y, col) {
    c.fillStyle = '#b5651d'; c.fillRect(x - 30, y - 30, 60, 30);
    c.strokeStyle = '#4a2c17'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y - 30); c.lineTo(x - 40, y - 120); c.moveTo(x, y - 40); c.lineTo(x + 46, y - 130); c.moveTo(x, y - 50); c.lineTo(x + 4, y - 160); c.stroke();
    for (let k = 0; k < 60; k++) { const a = k * 2.4, d = 14 + (k % 9) * 7; circ(c, x + Math.cos(a) * d, y - 120 + Math.sin(a) * d * 0.55, 4, col); }
  }
  function bunting(c, w, y, t, kind) {
    c.strokeStyle = 'rgba(80,40,20,.7)'; c.lineWidth = 1.5; c.beginPath(); for (let x = 0; x <= w; x += 20) c.lineTo(x, y + Math.sin(x / 160 * Math.PI) ** 2 * 22); c.stroke();
    for (let x = 40; x < w; x += 80) {
      const yy = y + Math.sin(x / 160 * Math.PI) ** 2 * 22;
      if (kind === 'tet') { c.fillStyle = '#e03131'; c.beginPath(); c.ellipse(x, yy + 16, 10, 13, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ffd43b'; c.fillRect(x - 3, yy + 28, 6, 8); }
      else if (kind === 'xmas') { circ(c, x, yy + 6, 5, Math.sin(t * 3 + x) > 0 ? ['#ff6b6b', '#69db7c', '#ffd43b', '#74c0fc'][(x / 80 | 0) % 4] : '#495057'); }
      else { for (let p = 0; p < 5; p++) circ(c, x + Math.cos(p * 1.256) * 5, yy + 10 + Math.sin(p * 1.256) * 5, 4, ['#f783ac', '#fff', '#ffd43b'][(x / 80 | 0) % 3]); }
    }
  }
  function decorate(m) {
    if (m.indoor || m.solemn) return;
    const on = (k) => current() === k;
    // dây trang trí dọc đường chân trời
    m.objects.push({ y: m.hz + 40, draw: (c, t) => { const k = current(); if (k) bunting(c, m.w, m.hz + 24, t, k); }, bb: [0, m.hz, m.w, m.hz + 70] });
    if (m.id === 'town') {
      const X = 1700, Y = 640, OX = 1480, OY = 770;
      m.objects.push({ y: Y, bb: [X - 110, Y - 250, X + 110, Y + 10], draw: (c, t) => { if (on('xmas')) xmasTree(c, X, Y, t); else if (on('tet')) peach(c, X, Y, '#ff8fab'); } });
      m.objects.push({ y: OY, bb: [OX - 110, OY - 200, OX + 110, OY + 10], draw: (c, t) => {
        if (on('xmas')) { c.font = '64px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('🎅', OX, OY); c.font = '40px system-ui, "Segoe UI Emoji"'; c.fillText('🛷', OX + 70, OY); c.fillStyle = '#fff'; c.beginPath(); c.roundRect(OX - 70, OY - 112, 140, 24, 8); c.fill(); c.fillStyle = '#c92a2a'; c.font = '900 12px "Be Vietnam Pro", system-ui'; c.textBaseline = 'middle'; c.fillText('🎁 ÔNG GIÀ NOEL', OX, OY - 100); }
        else if (on('tet')) { c.fillStyle = '#8a5a32'; c.fillRect(OX - 70, OY - 40, 140, 40); c.fillStyle = '#c92a2a'; c.fillRect(OX - 80, OY - 150, 22, 110); c.fillRect(OX + 58, OY - 150, 22, 110); c.fillStyle = '#ffd43b'; c.font = '900 13px serif'; c.textAlign = 'center'; ['Phúc', 'Lộc'].forEach((w, i) => { c.save(); c.translate(i ? OX + 69 : OX - 69, OY - 95); c.fillText(w, 0, 0); c.restore(); }); c.font = '56px system-ui, "Segoe UI Emoji"'; c.textBaseline = 'alphabetic'; c.fillText('👴', OX, OY - 30); c.fillStyle = '#fff8e1'; c.beginPath(); c.roundRect(OX - 66, OY - 176, 132, 24, 8); c.fill(); c.fillStyle = '#c92a2a'; c.font = '900 12px "Be Vietnam Pro", system-ui'; c.textBaseline = 'middle'; c.fillText('🖌️ ÔNG ĐỒ CHO CHỮ', OX, OY - 164); }
      } });
      m.inter.push({ x: OX - 80, y: OY - 170, w: 160, h: 170, ax: OX, ay: OY + 30, name: '🎅 Ông già Noel / 🖌️ Ông đồ', when: () => on('xmas') || on('tet'), use: () => (on('xmas') ? santa() : ongDo()), arrow: { x: OX, y: OY - 190, text: 'Sự kiện' } });
      m.colliders.push({ x: OX - 70, y: OY - 30, w: 140, h: 30, when: () => on('xmas') || on('tet') }, { x: X - 40, y: Y - 30, w: 80, h: 30, when: () => on('xmas') || on('tet') });
    }
    if (m.id === 'school') {
      const X = 1240, Y = 790;
      m.objects.push({ y: Y, bb: [X - 120, Y - 200, X + 120, Y + 10], draw: (c) => {
        if (!on('teacher')) return;
        c.fillStyle = '#e64980'; c.beginPath(); c.roundRect(X - 110, Y - 190, 220, 50, 10); c.fill(); c.fillStyle = '#fff'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TRI ÂN THẦY CÔ 20/11', X, Y - 172); c.font = '800 11px "Be Vietnam Pro", system-ui'; c.fillText('💐 Tặng hoa · viết thiệp', X, Y - 152);
        c.fillStyle = '#6b4423'; c.fillRect(X - 104, Y - 140, 8, 140); c.fillRect(X + 96, Y - 140, 8, 140);
        c.fillStyle = '#fff3bf'; c.fillRect(X - 80, Y - 50, 160, 50); c.fillStyle = '#f08c00'; c.fillRect(X - 80, Y - 54, 160, 6);
        c.font = '30px system-ui, "Segoe UI Emoji"'; c.textBaseline = 'alphabetic'; c.fillText('💐💌🌹', X, Y - 58);
      } });
      m.inter.push({ x: X - 110, y: Y - 190, w: 220, h: 190, ax: X, ay: Y + 30, name: '💐 Bàn tri ân thầy cô (20/11)', when: () => on('teacher'), use: teacherDesk, arrow: { x: X, y: Y - 205, text: 'Tri ân 20/11' } });
      m.colliders.push({ x: X - 80, y: Y - 40, w: 160, h: 40, when: () => on('teacher') });
    }
  }

  /* ---------- nút sự kiện trên màn hình ---------- */
  let btn = null, lastK = undefined;
  function tick() {
    const k = current();
    if (k !== lastK) {
      lastK = k;
      if (!btn) { btn = document.createElement('button'); btn.className = 'av-btn sq fe-btn'; btn.onclick = panel; const host = document.querySelector('.hud-more'); if (host) host.appendChild(btn); else document.body.appendChild(btn); }
      btn.style.display = k ? '' : 'none';
      if (k) { btn.textContent = EV[k].icon; btn.title = EV[k].name; }
      if (k && S() && S().festHello !== k + today()) { S().festHello = k + today(); setTimeout(() => UI.toast(`${EV[k].icon} Sự kiện ${EV[k].name} đang diễn ra! Bấm nút ${EV[k].icon} bên trái để xem`, 6000), 9000); }
    }
    dropGifts();
  }
  function init() { setInterval(tick, 3000); tick(); }
  return { init, current, decorate, panel, EV };
})();
