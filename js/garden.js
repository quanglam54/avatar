/* 🌳 VƯỜN NHÀ · TIỆM BÁNH · BẾN SÔNG — bản đồ riêng của mỗi người (đi từ Trang Trại Mở Rộng hoặc phố trước nông trại).
 *  🌳 mua cây giống ở Vườn ươm rồi TỰ CHỌN CHỖ TRỒNG cây ăn quả to; tưới cho mau lớn; cây lớn rồi cứ chín là hái
 *  🎨 tự trang trí vườn: mua đồ, đặt / dời / lật / cất kho (nút 🎨 Trang trí vườn)
 *  🧁 tiệm bánh: 8 loại máy, hơn 30 loại bánh, mỗi máy xếp hàng nhiều mẻ
 *  ⛵ sông + bến thuyền: nhận đơn giao hàng, cho thuyền chở đi giao, thuyền về thì nhận xu
 * Dữ liệu lưu ở S.garden. */
const GARDEN = (() => {
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const now = () => Date.now();
  const S = () => AV.S;
  const G = () => {
    const s = S(); s.garden = s.garden || {}; const g = s.garden;
    g.trees = g.trees || []; g.deco = g.deco || []; g.inv = g.inv || {}; g.saps = g.saps || {}; g.mach = g.mach || {};
    g.boats = g.boats || [{ k: 'sampan', trip: null }]; g.orders = g.orders || []; g.seq = g.seq || 1;
    return g;
  };
  const inv = () => S().inv;
  const has = (need) => Object.entries(need).every(([id, n]) => (inv()[id] || 0) >= n);
  const take = (need) => Object.entries(need).forEach(([id, n]) => { inv()[id] -= n; });
  const give = (id, n) => AV.addItem(id, n);
  const icon = (id) => (DATA.ITEMS[id] ? DATA.ITEMS[id].icon : '❓');
  const nm = (id) => (DATA.ITEMS[id] ? DATA.ITEMS[id].name : id);
  const changed = () => AV.markChanged && AV.markChanged();
  const dur = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 3600 ? `${Math.floor(s / 3600)}h${String(Math.floor(s / 60) % 60).padStart(2, '0')}` : s >= 60 ? `${Math.floor(s / 60)}p${String(s % 60).padStart(2, '0')}` : `${s}s`; };
  const needTxt = (need) => Object.entries(need).map(([id, n]) => `<span class="${(inv()[id] || 0) >= n ? '' : 'gd-miss'}">${n} ${icon(id)}</span>`).join(' + ');
  const em = (c, s, x, y, size) => { c.font = `${size}px system-ui, "Segoe UI Emoji", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(s, x, y); };
  const srand = (seed) => { let a = (seed * 9301 + 49297) % 233280; return () => (a = (a * 9301 + 49297) % 233280) / 233280; };
  const ell = (c, x, y, rx, ry, col) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
  const circ = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  const rr = (c, x, y, w, h, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
  const txt = (c, s, x, y, size, col, w = 900) => { c.fillStyle = col; c.font = `${w} ${size}px "Be Vietnam Pro", system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };

  /* ================= vật phẩm mới ================= */
  const reg = (id, name, ic, sell, sub) => { if (!DATA.ITEMS[id]) DATA.ITEMS[id] = { name, icon: ic, sell, ...(sub ? { sub } : {}) }; };
  reg('pear', 'Lê', '🍐', 18); reg('cherry', 'Anh đào', '🍒', 24); reg('coconut', 'Dừa', '🥥', 35);
  reg('lychee', 'Vải thiều', '🍒', 150); reg('durian', 'Sầu riêng', '🍈', 420); reg('jackfruit', 'Mít', '🟢', 180);
  reg('flour', 'Bột mì', '🥣', 18); reg('butter', 'Bơ sữa', '🧈', 60); reg('bread', 'Bánh mì', '🥖', 48);
  reg('sugar', 'Đường', '🧊', 5); reg('cocoa', 'Bột cacao', '🟫', 10); reg('sticky_rice', 'Gạo nếp', '🍙', 8);
  reg('starch', 'Bột năng', '🥛', 15, '🍠'); reg('corn_flour', 'Bột ngô', '🥣', 22, '🌽');

  /* ================= 🌳 cây ăn quả to ================= */
  const TREES = {
    orange: { name: 'Cây cam', fruit: 'orange', price: 2000, grow: 30, cycle: 25, yield: 10, leaf: '#2f9e44', fc: '#fd7e14', fr: 'round', xp: 6 },
    apple: { name: 'Cây táo', fruit: 'apple', price: 2500, grow: 40, cycle: 30, yield: 10, leaf: '#37b24d', fc: '#e03131', fr: 'apple', xp: 7 },
    pear: { name: 'Cây lê', fruit: 'pear', price: 3500, grow: 50, cycle: 35, yield: 10, leaf: '#40c057', fc: '#c0eb75', fr: 'pear', xp: 8 },
    mango: { name: 'Cây xoài', fruit: 'mango', price: 4000, grow: 60, cycle: 40, yield: 9, leaf: '#2b8a3e', fc: '#fcc419', fr: 'mango', xp: 9 },
    peach: { name: 'Cây đào', fruit: 'peach', price: 5000, grow: 70, cycle: 45, yield: 9, leaf: '#51cf66', fc: '#ff8fab', fr: 'round', blossom: '#ffc9e3', xp: 10 },
    cherry: { name: 'Cây anh đào', fruit: 'cherry', price: 7000, grow: 90, cycle: 50, yield: 14, leaf: '#69db7c', fc: '#c92a2a', fr: 'cherry', blossom: '#fcc2d7', xp: 12 },
    coconut: { name: 'Cây dừa', fruit: 'coconut', price: 9000, grow: 120, cycle: 70, yield: 6, leaf: '#5c940d', fc: '#8a5a32', fr: 'palm', xp: 14 },
    lychee: { name: 'Cây vải thiều', fruit: 'lychee', price: 25000, grow: 150, cycle: 120, yield: 4, leaf: '#2b8a3e', fc: '#e8384f', fr: 'lychee', xp: 20 },
    jackfruit: { name: 'Cây mít', fruit: 'jackfruit', price: 30000, grow: 180, cycle: 150, yield: 3, leaf: '#1e7a34', fc: '#94d82d', fr: 'jack', xp: 24 },
    durian: { name: 'Cây sầu riêng', fruit: 'durian', price: 60000, grow: 240, cycle: 240, yield: 3, leaf: '#2f6b2f', fc: '#a9c23f', fr: 'durian', xp: 35 },
  };
  /** cộng dồn thời gian đã lớn (tưới nước: lớn nhanh ×1.5 trong 30 phút) */
  function grow(t) {
    const n = now(), u = t.u || n, el = Math.max(0, n - u), wet = Math.max(0, Math.min(n, t.wet || 0) - u);
    t.g = (t.g || 0) + el + Math.min(el, wet) * 0.5; t.u = n;
    return t;
  }
  function tstate(t) {
    grow(t);
    const T = TREES[t.k], gm = T.grow * 60e3, cm = T.cycle * 60e3, p = Math.min(1, t.g / gm), mature = t.g >= gm;
    const fp = mature ? Math.min(1, (t.g - Math.max(gm, t.h || 0)) / cm) : 0;
    const left = !mature ? (gm - t.g) : (1 - fp) * cm;
    const wet = (t.wet || 0) > now();
    return { T, p, mature, fp, ripe: mature && fp >= 1, scale: mature ? 1 : 0.32 + 0.68 * p, left: left / (wet ? 1.5 : 1), wet };
  }
  function useTree(t) {
    const st = tstate(t);
    if (st.ripe) {
      if (!AV.useEnergy(1)) return;
      const big = Math.random() < 0.08, n = st.T.yield * (big ? 2 : 1);
      t.h = t.g; t.n = (t.n || 0) + 1;
      give(st.T.fruit, n);
      AV.floatText(`+${n} ${icon(st.T.fruit)}${big ? ' ✨ mùa bội thu!' : ''}`, t.x, t.y - 200, big ? '#ffd43b' : undefined);
      AV.earn(0, st.T.xp); AV.quest('harvest', n);
      changed(); return;
    }
    if (!st.wet) {
      if (!AV.useEnergy(1)) return;
      t.wet = now() + 30 * 60e3; AV.sayMine('💧 Tưới cây nào~'); AV.floatText('💧 Lớn nhanh ×1.5 trong 30 phút', t.x, t.y - 180, '#74c0fc'); changed(); return;
    }
    UI.toast(`${st.T.name}: ${st.mature ? `đang ra quả, còn ${dur(st.left)} nữa chín` : `đang lớn ${Math.floor(st.p * 100)}%, còn ${dur(st.left)} nữa ra quả`} · 💧 đã tưới`, 3500);
  }
  const treeInd = (t) => { const st = tstate(t); if (st.ripe) return icon(st.T.fruit); if (!st.wet) return '💧'; return null; };

  /* ---------- vẽ cây ---------- */
  function fruit(c, kind, x, y, r, col, ripe) {
    if (kind === 'cherry') { c.strokeStyle = '#2b8a3e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - r * 0.6, y); c.quadraticCurveTo(x, y - r * 2.2, x + r * 0.2, y - r * 2.4); c.moveTo(x + r * 0.7, y + r * 0.2); c.quadraticCurveTo(x + r * 0.4, y - r * 1.8, x + r * 0.2, y - r * 2.4); c.stroke(); circ(c, x - r * 0.6, y, r * 0.8, col); circ(c, x + r * 0.7, y + r * 0.2, r * 0.8, col); circ(c, x - r * 0.85, y - r * 0.25, r * 0.25, 'rgba(255,255,255,.6)'); return; }
    if (kind === 'pear') { c.fillStyle = col; c.beginPath(); c.arc(x, y + r * 0.35, r, 0, Math.PI * 2); c.arc(x, y - r * 0.5, r * 0.62, 0, Math.PI * 2); c.fill(); }
    else if (kind === 'mango') { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r * 0.8, r * 1.15, 0.35, 0, Math.PI * 2); c.fill(); }
    else if (kind === 'jack') { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, r * 1.1, r * 1.6, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(0,0,0,.12)'; for (let k = 0; k < 8; k++) circ(c, x - r * 0.6 + (k % 3) * r * 0.6, y - r + Math.floor(k / 3) * r * 0.8, r * 0.14, 'rgba(60,80,0,.35)'); }
    else if (kind === 'durian') { c.fillStyle = '#6b7f1a'; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 1.35); c.lineTo(x + Math.cos(a + 0.25) * r * 0.9, y + Math.sin(a + 0.25) * r * 0.9); c.lineTo(x + Math.cos(a - 0.25) * r * 0.9, y + Math.sin(a - 0.25) * r * 0.9); c.fill(); } circ(c, x, y, r, col); }
    else circ(c, x, y, r, col);
    if (kind === 'lychee') { c.fillStyle = 'rgba(120,0,20,.35)'; for (let k = 0; k < 5; k++) circ(c, x - r * 0.5 + (k % 3) * r * 0.5, y - r * 0.4 + Math.floor(k / 3) * r * 0.6, r * 0.13, 'rgba(120,0,20,.35)'); }
    if (kind === 'apple' || kind === 'pear') { c.strokeStyle = '#5c3a1e'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y - r * (kind === 'pear' ? 1.05 : 0.8)); c.lineTo(x + r * 0.15, y - r * (kind === 'pear' ? 1.5 : 1.3)); c.stroke(); if (ripe) ell(c, x + r * 0.45, y - r * (kind === 'pear' ? 1.4 : 1.1), r * 0.35, r * 0.16, '#40c057'); }
    circ(c, x - r * 0.35, y - r * 0.35, r * 0.28, 'rgba(255,255,255,.45)');
  }
  const mix = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
  function drawTree(c, t, tm) {
    const st = tstate(t), T = st.T, s = st.scale, x = t.x, y = t.y;
    ell(c, x, y + 2, 20 + 50 * s, 6 + 8 * s, 'rgba(0,0,0,.16)');
    if (st.p < 0.12) {
      ell(c, x, y - 2, 30, 10, '#8a5a32'); ell(c, x, y - 4, 24, 7, '#a0703f');
      c.fillStyle = '#c99a5b'; c.fillRect(x + 12, y - 52, 4, 50);
      c.strokeStyle = '#2b8a3e'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x, y - 36); c.stroke();
      ell(c, x - 10, y - 34, 12, 6, '#51cf66'); ell(c, x + 9, y - 40, 12, 6, '#40c057'); ell(c, x, y - 46, 8, 10, '#69db7c');
      if (st.wet) [[-20, 4], [16, 6], [-4, 9]].forEach(([dx, dy]) => circ(c, x + dx, y + dy, 3, '#74c0fc'));
      return;
    }
    if (st.wet) [[-34, 6], [28, 8], [-8, 12], [44, 2]].forEach(([dx, dy]) => circ(c, x + dx * s, y + dy, 3.5, '#74c0fc'));
    if (T.fr === 'palm') return drawPalm(c, t, st, tm);
    const tall = T.fr === 'jack' || T.fr === 'durian';
    const th = (tall ? 150 : 110) * s, tw = 12 + 22 * s, R = (tall ? 112 : 125) * s;
    // thân + rễ
    c.fillStyle = '#7a4a24';
    c.beginPath(); c.moveTo(x - tw * 0.75, y); c.quadraticCurveTo(x - tw * 0.35, y - th * 0.5, x - tw * 0.38, y - th - 10); c.lineTo(x + tw * 0.38, y - th - 10); c.quadraticCurveTo(x + tw * 0.35, y - th * 0.5, x + tw * 0.75, y); c.closePath(); c.fill();
    c.fillStyle = '#5c3416'; c.beginPath(); c.moveTo(x + tw * 0.1, y); c.quadraticCurveTo(x + tw * 0.25, y - th * 0.5, x + tw * 0.2, y - th - 10); c.lineTo(x + tw * 0.38, y - th - 10); c.quadraticCurveTo(x + tw * 0.35, y - th * 0.5, x + tw * 0.75, y); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x - tw * 0.2, y - th * k / 4); c.lineTo(x + tw * 0.05, y - th * k / 4 - 8); c.stroke(); }
    [[-1, 1], [1, 1]].forEach(([d]) => { c.fillStyle = '#6b4423'; c.beginPath(); c.moveTo(x + d * tw * 0.5, y - 10); c.quadraticCurveTo(x + d * tw * 1.1, y - 2, x + d * tw * 1.4, y + 2); c.lineTo(x + d * tw * 0.4, y + 2); c.closePath(); c.fill(); });
    // nhánh
    c.strokeStyle = '#7a4a24'; c.lineWidth = 8 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y - th * 0.85); c.lineTo(x - R * 0.45, y - th - R * 0.15); c.moveTo(x, y - th * 0.8); c.lineTo(x + R * 0.5, y - th - R * 0.1); c.stroke();
    // tán lá
    const cx = x, cy = y - th - R * 0.42;
    const B = [[0, -0.42, 0.6], [-0.58, -0.1, 0.5], [0.58, -0.1, 0.5], [-0.32, 0.26, 0.52], [0.32, 0.26, 0.52], [0, 0.02, 0.62], [-0.8, 0.18, 0.34], [0.8, 0.18, 0.34]];
    const dark = mix(T.leaf, '#000000', 0.3), light = mix(T.leaf, '#ffffff', 0.25);
    B.forEach(([dx, dy, r]) => circ(c, cx + dx * R, cy + dy * R + 8, r * R, dark));
    B.forEach(([dx, dy, r]) => circ(c, cx + dx * R, cy + dy * R, r * R, T.leaf));
    [[-0.2, -0.55, 0.32], [-0.62, -0.2, 0.22], [0.28, -0.3, 0.2]].forEach(([dx, dy, r]) => circ(c, cx + dx * R, cy + dy * R, r * R, light));
    const rnd = srand((t.id || 1) * 37 + 11);
    if (T.blossom && !st.ripe) for (let k = 0; k < 26 * s; k++) { const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 0.85; circ(c, cx + Math.cos(a) * d * R, cy + Math.sin(a) * d * R * 0.8, 4 * s + 1, T.blossom); }
    if (st.mature) {
      const N = tall ? 5 : T.fr === 'cherry' ? 12 : 13, fr = srand((t.id || 1) * 97 + 5);
      const sz = (tall ? 15 : T.fr === 'cherry' ? 6 : 9) * (0.45 + 0.55 * st.fp);
      const col = st.fp >= 1 ? T.fc : mix('#94d82d', T.fc, Math.max(0, st.fp - 0.3) / 0.7 * 0.8);
      for (let k = 0; k < N; k++) {
        let fx, fy;
        if (tall) { fx = x + (k % 2 ? 1 : -1) * (tw * 0.5 + sz * 0.6); fy = y - th * (0.35 + 0.13 * k); if (k === 4) { fx = cx + R * 0.3; fy = cy + R * 0.4; } }
        else { const a = fr() * Math.PI * 2, d = 0.25 + fr() * 0.62; fx = cx + Math.cos(a) * d * R; fy = cy + Math.sin(a) * d * R * 0.75 + R * 0.08; }
        fruit(c, T.fr, fx, fy, sz, col, st.ripe);
      }
      if (st.ripe) for (let k = 0; k < 4; k++) { const a = tm * 2 + k * 1.6; circ(c, cx + Math.cos(a) * R * 0.6, cy + Math.sin(a * 1.3) * R * 0.4, 2.5 + Math.sin(tm * 6 + k), 'rgba(255,255,210,.95)'); }
    }
  }
  function drawPalm(c, t, st, tm) {
    const s = st.scale, x = t.x, y = t.y, H = 260 * s, lean = 40 * s;
    for (let k = 0; k < 12; k++) {
      const a = k / 12, b = (k + 1) / 12;
      const x1 = x + lean * a * a, y1 = y - H * a, x2 = x + lean * b * b, y2 = y - H * b, w = (16 - 6 * a) * (0.6 + 0.4 * s);
      c.fillStyle = k % 2 ? '#8a5a32' : '#a0703f'; c.beginPath(); c.moveTo(x1 - w, y1); c.lineTo(x2 - w * 0.95, y2); c.lineTo(x2 + w * 0.95, y2); c.lineTo(x1 + w, y1); c.closePath(); c.fill();
    }
    const tx = x + lean, ty = y - H;
    for (let k = 0; k < 8; k++) {
      const a = -Math.PI / 2 + (k - 3.5) * 0.42 + Math.sin(tm * 1.2 + k) * 0.03, L = (95 + (k % 2) * 25) * s;
      const ex = tx + Math.cos(a) * L * 1.2, ey = ty + Math.sin(a) * L * 0.5 + L * 0.55;
      c.strokeStyle = '#2b8a3e'; c.lineWidth = 3; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(a) * L * 0.7, ty + Math.sin(a) * L * 0.9 - 20 * s, ex, ey); c.stroke();
      c.fillStyle = k % 2 ? '#5c940d' : '#74b816';
      for (let j = 1; j <= 7; j++) { const q = j / 8, px = tx + (ex - tx) * q, py = ty + (ey - ty) * q - Math.sin(q * Math.PI) * 26 * s; c.beginPath(); c.ellipse(px, py + 6 * s, 15 * s * (1 - q * 0.4), 5 * s, a + 1.2, 0, Math.PI * 2); c.fill(); }
    }
    if (st.mature) { const n = Math.round(3 + 3 * st.fp); for (let k = 0; k < n; k++) { const col = st.fp >= 1 ? '#8a5a32' : '#82c91e'; circ(c, tx - 16 + (k % 3) * 15, ty + 10 + Math.floor(k / 3) * 13, 9 * (0.6 + 0.4 * st.fp), col); circ(c, tx - 19 + (k % 3) * 15, ty + 7 + Math.floor(k / 3) * 13, 3, 'rgba(255,255,255,.3)'); } }
    if (st.ripe) for (let k = 0; k < 3; k++) circ(c, tx + Math.cos(tm * 2 + k * 2) * 50, ty + Math.sin(tm * 2.4 + k) * 30, 2.5, 'rgba(255,255,210,.95)');
  }

  /* ================= 🎨 đồ trang trí ================= */
  const flipX = (c, x, f, fn) => { if (!f) return fn(); c.save(); c.translate(x, 0); c.scale(-1, 1); c.translate(-x, 0); fn(); c.restore(); };
  const bush = (c, x, y, col) => { ell(c, x, y + 1, 36, 9, 'rgba(0,0,0,.15)'); [[-18, -14, 18], [16, -14, 18], [0, -24, 20], [0, -10, 22]].forEach(([dx, dy, r]) => circ(c, x + dx, y + dy, r, '#2f9e44')); circ(c, x - 6, y - 30, 9, '#51cf66'); const r = srand(Math.round(x * 7 + y)); for (let k = 0; k < 9; k++) { const fx = x - 26 + r() * 52, fy = y - 38 + r() * 30; for (let p = 0; p < 5; p++) circ(c, fx + Math.cos(p * 1.256) * 3.5, fy + Math.sin(p * 1.256) * 3.5, 3, col); circ(c, fx, fy, 2, '#fff3bf'); } };
  const DECO = {
    fence_wood: { name: 'Hàng rào gỗ', icon: '🪵', price: 300, box: { l: -68, t: -62, w: 136, h: 68 }, col: [124, 10], draw: (c, x, y) => { c.fillStyle = '#8a5a32'; [-60, 0, 60].forEach((dx) => { c.fillRect(x + dx - 6, y - 54, 12, 54); c.beginPath(); c.moveTo(x + dx - 6, y - 54); c.lineTo(x + dx, y - 62); c.lineTo(x + dx + 6, y - 54); c.fill(); }); c.fillStyle = '#a0703f'; c.fillRect(x - 66, y - 44, 132, 9); c.fillRect(x - 66, y - 22, 132, 9); } },
    fence_white: { name: 'Hàng rào trắng', icon: '🤍', price: 400, box: { l: -68, t: -62, w: 136, h: 68 }, col: [124, 10], draw: (c, x, y) => { c.fillStyle = '#f1f3f5'; c.fillRect(x - 66, y - 40, 132, 7); c.fillRect(x - 66, y - 18, 132, 7); for (let k = 0; k < 7; k++) { const px = x - 60 + k * 20; c.fillStyle = '#fff'; c.fillRect(px - 5, y - 52, 10, 52); c.beginPath(); c.moveTo(px - 5, y - 52); c.lineTo(px, y - 60); c.lineTo(px + 5, y - 52); c.fill(); c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(px + 2, y - 52, 3, 52); } } },
    hedge: { name: 'Bờ rào cây xanh', icon: '🌳', price: 600, box: { l: -70, t: -60, w: 140, h: 66 }, col: [126, 14], draw: (c, x, y) => { ell(c, x, y + 1, 68, 9, 'rgba(0,0,0,.15)'); rr(c, x - 66, y - 52, 132, 52, 18, '#2b8a3e'); rr(c, x - 62, y - 56, 124, 40, 16, '#40c057'); for (let k = 0; k < 10; k++) circ(c, x - 54 + k * 12, y - 50 + (k % 2) * 6, 6, '#51cf66'); } },
    flowers_r: { name: 'Bụi hoa hồng', icon: '🌹', price: 250, box: { l: -42, t: -56, w: 84, h: 60 }, draw: (c, x, y) => bush(c, x, y, '#ff6b6b') },
    flowers_y: { name: 'Bụi hoa vàng', icon: '🌼', price: 250, box: { l: -42, t: -56, w: 84, h: 60 }, draw: (c, x, y) => bush(c, x, y, '#ffd43b') },
    flowers_p: { name: 'Bụi hoa hồng phấn', icon: '🌸', price: 250, box: { l: -42, t: -56, w: 84, h: 60 }, draw: (c, x, y) => bush(c, x, y, '#f783ac') },
    flowers_v: { name: 'Bụi hoa tím', icon: '💜', price: 250, box: { l: -42, t: -56, w: 84, h: 60 }, draw: (c, x, y) => bush(c, x, y, '#b197fc') },
    tulips: { name: 'Luống tulip', icon: '🌷', price: 500, box: { l: -66, t: -62, w: 132, h: 68 }, draw: (c, x, y) => { rr(c, x - 64, y - 14, 128, 16, 8, '#8a5a32'); ['#ff6b6b', '#ffd43b', '#f783ac', '#ff922b', '#da77f2', '#ff6b6b'].forEach((col, k) => { const fx = x - 52 + k * 21; c.strokeStyle = '#2f9e44'; c.lineWidth = 3; c.beginPath(); c.moveTo(fx, y - 10); c.lineTo(fx, y - 40); c.stroke(); ell(c, fx - 5, y - 24, 6, 3, '#40c057'); c.fillStyle = col; c.beginPath(); c.moveTo(fx - 8, y - 52); c.lineTo(fx - 8, y - 40); c.quadraticCurveTo(fx, y - 34, fx + 8, y - 40); c.lineTo(fx + 8, y - 52); c.lineTo(fx + 4, y - 46); c.lineTo(fx, y - 54); c.lineTo(fx - 4, y - 46); c.closePath(); c.fill(); }); } },
    sunflower: { name: 'Khóm hướng dương', icon: '🌻', price: 350, box: { l: -46, t: -130, w: 92, h: 134 }, draw: (c, x, y, t) => { [[-24, 100], [4, 122], [28, 92]].forEach(([dx, h], k) => { const fx = x + dx, fy = y - h; c.strokeStyle = '#2f9e44'; c.lineWidth = 4; c.beginPath(); c.moveTo(fx, y); c.lineTo(fx, fy); c.stroke(); ell(c, fx + 9, y - h * 0.5, 11, 5, '#40c057'); for (let p = 0; p < 12; p++) { const a = p / 12 * Math.PI * 2 + Math.sin(t + k) * 0.05; c.fillStyle = '#fcc419'; c.beginPath(); c.ellipse(fx + Math.cos(a) * 13, fy + Math.sin(a) * 13, 8, 4, a, 0, Math.PI * 2); c.fill(); } circ(c, fx, fy, 10, '#5c3a1e'); circ(c, fx - 3, fy - 3, 3, '#8a5a32'); }); }, anim: true },
    pot: { name: 'Chậu cây cảnh', icon: '🪴', price: 400, box: { l: -34, t: -78, w: 68, h: 82 }, col: [40, 10], draw: (c, x, y) => { c.fillStyle = '#d9480f'; c.beginPath(); c.moveTo(x - 22, y - 34); c.lineTo(x + 22, y - 34); c.lineTo(x + 16, y); c.lineTo(x - 16, y); c.closePath(); c.fill(); rr(c, x - 25, y - 40, 50, 9, 3, '#e8590c'); [[-12, -60, 14], [10, -62, 15], [0, -74, 14], [-4, -52, 12]].forEach(([dx, dy, r]) => circ(c, x + dx, y + dy, r, '#37b24d')); circ(c, x - 6, y - 72, 6, '#69db7c'); } },
    bonsai: { name: 'Chậu bonsai', icon: '🎍', price: 1500, box: { l: -52, t: -92, w: 104, h: 96 }, col: [70, 12], draw: (c, x, y) => { rr(c, x - 44, y - 22, 88, 22, 6, '#1864ab'); rr(c, x - 48, y - 26, 96, 8, 4, '#1c7ed6'); c.strokeStyle = '#5c3a1e'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y - 24); c.quadraticCurveTo(x - 24, y - 44, x + 4, y - 58); c.quadraticCurveTo(x + 26, y - 66, x + 10, y - 76); c.stroke(); [[-26, -66, 20, 9], [24, -60, 22, 9], [6, -84, 22, 10]].forEach(([dx, dy, rx, ry]) => { ell(c, x + dx, y + dy + 3, rx, ry, '#2b8a3e'); ell(c, x + dx, y + dy, rx * 0.9, ry * 0.8, '#40c057'); }); } },
    stones: { name: 'Đá lát lối đi', icon: '🪨', price: 150, flat: true, box: { l: -50, t: -26, w: 100, h: 34 }, draw: (c, x, y) => { [[-30, -8, 18, 9], [4, -14, 16, 8], [30, -6, 17, 9], [-8, 2, 14, 6]].forEach(([dx, dy, rx, ry]) => { ell(c, x + dx, y + dy + 2, rx, ry, '#868e96'); ell(c, x + dx, y + dy, rx, ry, '#ced4da'); ell(c, x + dx - 4, y + dy - 2, rx * 0.5, ry * 0.4, 'rgba(255,255,255,.4)'); }); } },
    brick: { name: 'Gạch lát đỏ', icon: '🧱', price: 200, flat: true, box: { l: -52, t: -30, w: 104, h: 38 }, draw: (c, x, y) => { for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const bx = x - 50 + k * 25 + (r % 2) * 12, by = y - 26 + r * 10; if (bx > x + 40) continue; rr(c, bx, by, 23, 8, 2, r % 2 ? '#c2410c' : '#d9480f'); } } },
    carpet: { name: 'Thảm cỏ hoa', icon: '🌼', price: 300, flat: true, box: { l: -64, t: -30, w: 128, h: 38 }, draw: (c, x, y) => { ell(c, x, y - 10, 62, 20, '#8ce99a'); const r = srand(Math.round(x + y * 3)); for (let k = 0; k < 18; k++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); circ(c, x + Math.cos(a) * d * 54, y - 10 + Math.sin(a) * d * 16, 3, ['#fff', '#ffd43b', '#ff8fab', '#b197fc'][k % 4]); } } },
    pond: { name: 'Hồ cá Koi', icon: '🐟', price: 5000, flat: true, box: { l: -120, t: -96, w: 240, h: 102 }, colR: [-104, -84, 208, 74], anim: true, draw: (c, x, y, t) => { const cy = y - 44; ell(c, x, cy, 116, 50, '#868e96'); ell(c, x, cy, 104, 42, '#1c7ed6'); ell(c, x, cy - 4, 96, 34, '#339af0'); ['#ff922b', '#f8f9fa', '#e03131'].forEach((col, k) => { const a = t * (0.6 + k * 0.2) + k * 2.1, fx = x + Math.cos(a) * 60, fy = cy + Math.sin(a) * 18; c.save(); c.translate(fx, fy); c.rotate(a + Math.PI / 2); ell(c, 0, 0, 10, 4.5, col); c.fillStyle = col; c.beginPath(); c.moveTo(-9, 0); c.lineTo(-17, -5); c.lineTo(-17, 5); c.fill(); c.restore(); }); ell(c, x + 50, cy + 12, 14, 6, '#40c057'); circ(c, x + 54, cy + 9, 4, '#ff8fab'); ell(c, x - 60, cy - 10, 11, 5, '#40c057'); for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; ell(c, x + Math.cos(a) * 110, cy + Math.sin(a) * 46, 12, 7, k % 2 ? '#adb5bd' : '#ced4da'); } } },
    fountain: { name: 'Đài phun nước', icon: '⛲', price: 8000, box: { l: -92, t: -150, w: 184, h: 156 }, col: [150, 40], anim: true, draw: (c, x, y, t) => { ell(c, x, y - 18, 86, 26, '#adb5bd'); ell(c, x, y - 24, 78, 22, '#4dabf7'); rr(c, x - 86, y - 24, 172, 20, 10, '#ced4da'); ell(c, x, y - 26, 72, 18, '#74c0fc'); rr(c, x - 10, y - 90, 20, 68, 4, '#ced4da'); ell(c, x, y - 90, 40, 12, '#adb5bd'); ell(c, x, y - 93, 34, 9, '#74c0fc'); rr(c, x - 6, y - 128, 12, 38, 4, '#dee2e6'); circ(c, x, y - 132, 8, '#e9ecef'); c.strokeStyle = 'rgba(165,216,255,.9)'; c.lineWidth = 3; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + t, ex = x + Math.cos(a) * 34; c.beginPath(); c.moveTo(x, y - 136); c.quadraticCurveTo((x + ex) / 2, y - 160, ex, y - 94); c.stroke(); } for (let k = 0; k < 6; k++) { const ph = (t * 1.5 + k / 6) % 1; circ(c, x + Math.cos(k) * (40 + ph * 30), y - 90 + ph * 64, 2.5, 'rgba(255,255,255,.8)'); } } },
    bench: { name: 'Ghế gỗ', icon: '🪑', price: 800, box: { l: -62, t: -64, w: 124, h: 70 }, col: [110, 14], draw: (c, x, y) => { c.fillStyle = '#5c3a1e'; [[-48, 0], [42, 0]].forEach(([dx]) => c.fillRect(x + dx, y - 28, 7, 28)); rr(c, x - 58, y - 34, 116, 10, 3, '#a0703f'); rr(c, x - 56, y - 60, 112, 9, 3, '#8a5a32'); rr(c, x - 56, y - 48, 112, 9, 3, '#8a5a32'); c.fillStyle = '#5c3a1e'; c.fillRect(x - 50, y - 60, 6, 30); c.fillRect(x + 44, y - 60, 6, 30); } },
    swing: { name: 'Xích đu', icon: '🎠', price: 3000, box: { l: -82, t: -160, w: 164, h: 166 }, col: [20, 8], anim: true, draw: (c, x, y, t) => { c.strokeStyle = '#8a5a32'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 70, y); c.lineTo(x - 50, y - 150); c.lineTo(x - 30, y); c.moveTo(x + 70, y); c.lineTo(x + 50, y - 150); c.lineTo(x + 30, y); c.stroke(); c.lineWidth = 10; c.beginPath(); c.moveTo(x - 58, y - 148); c.lineTo(x + 58, y - 148); c.stroke(); const a = Math.sin(t * 1.6) * 0.3; c.save(); c.translate(x, y - 148); c.rotate(a); c.strokeStyle = '#495057'; c.lineWidth = 2; c.beginPath(); c.moveTo(-22, 0); c.lineTo(-22, 110); c.moveTo(22, 0); c.lineTo(22, 110); c.stroke(); rr(c, -28, 106, 56, 10, 3, '#e03131'); c.restore(); } },
    lamp: { name: 'Đèn vườn', icon: '🏮', price: 700, box: { l: -24, t: -130, w: 48, h: 134 }, col: [16, 8], light: true, draw: (c, x, y) => { rr(c, x - 12, y - 8, 24, 8, 3, '#343a40'); c.fillStyle = '#495057'; c.fillRect(x - 3, y - 104, 6, 98); c.fillStyle = '#343a40'; c.beginPath(); c.moveTo(x - 18, y - 104); c.lineTo(x + 18, y - 104); c.lineTo(x + 10, y - 124); c.lineTo(x - 10, y - 124); c.fill(); rr(c, x - 13, y - 104, 26, 24, 4, '#ffe066'); circ(c, x, y - 92, 7, '#fff9db'); c.fillStyle = '#343a40'; c.fillRect(x - 15, y - 82, 30, 4); } },
    lantern: { name: 'Đèn lồng đỏ', icon: '🏮', price: 600, box: { l: -34, t: -126, w: 68, h: 130 }, col: [12, 8], light: true, anim: true, draw: (c, x, y, t) => { c.fillStyle = '#5c3a1e'; c.fillRect(x - 3, y - 118, 6, 118); c.fillRect(x - 3, y - 118, 30, 5); const sw = Math.sin(t * 1.8) * 3; c.strokeStyle = '#5c3a1e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 24, y - 113); c.lineTo(x + 24 + sw, y - 100); c.stroke(); ell(c, x + 24 + sw, y - 82, 16, 20, '#e03131'); c.strokeStyle = '#c92a2a'; c.lineWidth = 1; for (let k = -1; k <= 1; k++) { c.beginPath(); c.ellipse(x + 24 + sw, y - 82, Math.abs(k) * 9 + 3, 20, 0, 0, Math.PI * 2); c.stroke(); } rr(c, x + 17 + sw, y - 104, 14, 5, 2, '#fcc419'); rr(c, x + 17 + sw, y - 63, 14, 5, 2, '#fcc419'); c.strokeStyle = '#fcc419'; c.beginPath(); c.moveTo(x + 24 + sw, y - 58); c.lineTo(x + 24 + sw, y - 46); c.stroke(); } },
    gnome: { name: 'Chú lùn giữ vườn', icon: '🧙', price: 1200, box: { l: -30, t: -82, w: 60, h: 86 }, draw: (c, x, y) => { ell(c, x, y, 22, 6, 'rgba(0,0,0,.2)'); rr(c, x - 16, y - 34, 32, 32, 10, '#1c7ed6'); rr(c, x - 14, y - 8, 12, 8, 3, '#5c3a1e'); rr(c, x + 2, y - 8, 12, 8, 3, '#5c3a1e'); circ(c, x, y - 44, 13, '#ffd8b0'); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 13, y - 44); c.quadraticCurveTo(x, y - 8, x + 13, y - 44); c.closePath(); c.fill(); circ(c, x, y - 42, 4, '#ff8787'); c.fillStyle = '#e03131'; c.beginPath(); c.moveTo(x - 15, y - 50); c.lineTo(x + 15, y - 50); c.lineTo(x + 4, y - 82); c.closePath(); c.fill(); circ(c, x - 5, y - 49, 2, '#212529'); circ(c, x + 5, y - 49, 2, '#212529'); } },
    mushroom: { name: 'Cụm nấm', icon: '🍄', price: 300, box: { l: -36, t: -50, w: 72, h: 54 }, draw: (c, x, y) => { [[-16, 0, 1], [14, 2, 0.75], [0, 4, 0.55]].forEach(([dx, dy, k]) => { rr(c, x + dx - 6 * k, y + dy - 26 * k, 12 * k, 26 * k, 4, '#fff4e6'); c.fillStyle = '#e03131'; c.beginPath(); c.ellipse(x + dx, y + dy - 26 * k, 20 * k, 15 * k, 0, Math.PI, 0); c.fill(); [[-8, -8], [6, -12], [0, -4]].forEach(([px, py]) => circ(c, x + dx + px * k, y + dy - 26 * k + py * k, 3 * k, '#fff')); }); } },
    rock: { name: 'Hòn non bộ', icon: '🗿', price: 900, box: { l: -54, t: -96, w: 108, h: 100 }, col: [84, 16], draw: (c, x, y) => { c.fillStyle = '#868e96'; c.beginPath(); c.moveTo(x - 50, y); c.lineTo(x - 34, y - 46); c.lineTo(x - 14, y - 86); c.lineTo(x + 6, y - 52); c.lineTo(x + 24, y - 70); c.lineTo(x + 48, y); c.closePath(); c.fill(); c.fillStyle = '#adb5bd'; c.beginPath(); c.moveTo(x - 34, y - 46); c.lineTo(x - 14, y - 86); c.lineTo(x - 6, y - 40); c.closePath(); c.fill(); ell(c, x + 18, y - 72, 14, 7, '#2f9e44'); ell(c, x - 16, y - 88, 10, 6, '#40c057'); c.fillStyle = '#5c3a1e'; c.fillRect(x - 2, y - 30, 8, 6); c.fillStyle = '#c92a2a'; c.fillRect(x - 4, y - 38, 12, 8); } },
    mailbox: { name: 'Hộp thư', icon: '📮', price: 500, box: { l: -26, t: -92, w: 52, h: 96 }, col: [12, 8], draw: (c, x, y) => { c.fillStyle = '#8a5a32'; c.fillRect(x - 4, y - 58, 8, 58); rr(c, x - 22, y - 86, 44, 30, 12, '#e03131'); rr(c, x - 22, y - 70, 44, 14, 2, '#c92a2a'); c.fillStyle = '#ffd43b'; c.fillRect(x + 18, y - 100, 3, 24); c.fillRect(x + 18, y - 100, 12, 8); } },
    birdhouse: { name: 'Nhà chim', icon: '🐦', price: 900, box: { l: -34, t: -138, w: 68, h: 142 }, col: [12, 8], anim: true, draw: (c, x, y, t) => { c.fillStyle = '#8a5a32'; c.fillRect(x - 4, y - 84, 8, 84); rr(c, x - 22, y - 116, 44, 36, 4, '#ffd8a8'); c.fillStyle = '#c92a2a'; c.beginPath(); c.moveTo(x - 28, y - 112); c.lineTo(x, y - 136); c.lineTo(x + 28, y - 112); c.closePath(); c.fill(); circ(c, x, y - 100, 7, '#5c3a1e'); c.fillStyle = '#5c3a1e'; c.fillRect(x - 10, y - 88, 20, 3); if (Math.sin(t * 0.7) > 0) { const hx = x + 12, hy = y - 92 - Math.abs(Math.sin(t * 6)) * 3; ell(c, hx, hy, 8, 6, '#4dabf7'); circ(c, hx + 6, hy - 5, 4, '#4dabf7'); c.fillStyle = '#fcc419'; c.beginPath(); c.moveTo(hx + 9, hy - 6); c.lineTo(hx + 15, hy - 4); c.lineTo(hx + 9, hy - 3); c.fill(); } } },
    windmill: { name: 'Cối xay gió mini', icon: '🌬️', price: 4000, box: { l: -60, t: -160, w: 120, h: 166 }, col: [40, 12], anim: true, draw: (c, x, y, t) => { c.save(); c.translate(x, y); c.scale(0.56, 0.56); c.translate(-x, -y); ART.windmill(c, x, y, t); c.restore(); } },
    scarecrow: { name: 'Bù nhìn', icon: '🎃', price: 1000, box: { l: -62, t: -134, w: 124, h: 140 }, col: [14, 8], anim: true, draw: (c, x, y, t) => ART.scarecrow(c, x, y, t) },
    arch: { name: 'Cổng hoa', icon: '💐', price: 2500, box: { l: -78, t: -168, w: 156, h: 172 }, draw: (c, x, y) => { c.strokeStyle = '#f8f9fa'; c.lineWidth = 8; c.beginPath(); c.moveTo(x - 62, y); c.lineTo(x - 62, y - 100); c.arc(x, y - 100, 62, Math.PI, 0); c.lineTo(x + 62, y); c.stroke(); const r = srand(Math.round(x + y)); for (let k = 0; k < 34; k++) { const q = k / 33, a = Math.PI + q * Math.PI; let px, py; if (q < 0.25) { px = x - 62; py = y - q * 4 * 100; } else if (q > 0.75) { px = x + 62; py = y - (1 - q) * 4 * 100; } else { const b = Math.PI + (q - 0.25) * 2 * Math.PI; px = x + Math.cos(b) * 62; py = y - 100 + Math.sin(b) * 62; } void a; circ(c, px + (r() - 0.5) * 12, py + (r() - 0.5) * 10, 7, '#40c057'); if (k % 2) circ(c, px + (r() - 0.5) * 12, py + (r() - 0.5) * 10, 5, ['#ff8fab', '#ffd43b', '#fff', '#ff6b6b'][k % 4]); } } },
    picnic: { name: 'Bàn picnic', icon: '🧺', price: 1500, box: { l: -74, t: -86, w: 148, h: 92 }, col: [130, 30], draw: (c, x, y) => { rr(c, x - 70, y - 22, 140, 9, 3, '#8a5a32'); c.fillStyle = '#5c3a1e'; c.fillRect(x - 60, y - 14, 6, 14); c.fillRect(x + 54, y - 14, 6, 14); c.fillRect(x - 40, y - 52, 7, 34); c.fillRect(x + 33, y - 52, 7, 34); rr(c, x - 56, y - 60, 112, 12, 3, '#fff'); for (let k = 0; k < 7; k++) c.fillStyle = '#e03131', c.fillRect(x - 56 + k * 16, y - 60, 8, 6), c.fillRect(x - 48 + k * 16, y - 54, 8, 6); em(c, '🧺', x - 20, y - 62, 24); em(c, '🍉', x + 22, y - 62, 20); } },
    umbrella: { name: 'Ô che nắng', icon: '⛱️', price: 1200, box: { l: -74, t: -150, w: 148, h: 156 }, col: [24, 10], draw: (c, x, y) => { c.fillStyle = '#868e96'; c.fillRect(x - 2, y - 130, 4, 130); ell(c, x, y - 40, 34, 9, '#f8f9fa'); c.fillStyle = '#adb5bd'; c.fillRect(x - 2, y - 40, 4, 40); for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#fff' : '#fa5252'; c.beginPath(); c.moveTo(x, y - 146); c.lineTo(x - 70 + k * 17.5, y - 108 + Math.abs(k - 3.5) * 1.5); c.lineTo(x - 70 + (k + 1) * 17.5, y - 108 + Math.abs(k - 2.5) * 1.5); c.closePath(); c.fill(); } } },
    wheelbarrow: { name: 'Xe cút kít hoa', icon: '🛒', price: 700, box: { l: -56, t: -66, w: 112, h: 70 }, draw: (c, x, y) => { c.strokeStyle = '#5c3a1e'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 10, y - 22); c.lineTo(x + 52, y - 40); c.stroke(); c.fillStyle = '#1c7ed6'; c.beginPath(); c.moveTo(x - 46, y - 44); c.lineTo(x + 26, y - 44); c.lineTo(x + 14, y - 16); c.lineTo(x - 36, y - 16); c.closePath(); c.fill(); circ(c, x - 36, y - 10, 10, '#343a40'); circ(c, x - 36, y - 10, 4, '#adb5bd'); [[-30, '#ff6b6b'], [-14, '#ffd43b'], [2, '#f783ac'], [16, '#b197fc']].forEach(([dx, col]) => { circ(c, x + dx, y - 52, 9, '#40c057'); circ(c, x + dx, y - 56, 6, col); }); } },
    statue: { name: 'Tượng thiên thần', icon: '👼', price: 6000, box: { l: -46, t: -168, w: 92, h: 172 }, col: [60, 16], draw: (c, x, y) => { rr(c, x - 36, y - 40, 72, 40, 4, '#adb5bd'); rr(c, x - 42, y - 46, 84, 10, 3, '#ced4da'); c.fillStyle = '#e9ecef'; c.beginPath(); c.moveTo(x - 20, y - 46); c.lineTo(x - 14, y - 110); c.lineTo(x + 14, y - 110); c.lineTo(x + 20, y - 46); c.fill(); circ(c, x, y - 124, 15, '#e9ecef'); c.strokeStyle = '#f8f9fa'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y - 146, 14, 4, 0, 0, Math.PI * 2); c.stroke(); [-1, 1].forEach((d) => { c.fillStyle = '#f1f3f5'; c.beginPath(); c.moveTo(x + d * 12, y - 104); c.quadraticCurveTo(x + d * 52, y - 140, x + d * 44, y - 80); c.quadraticCurveTo(x + d * 30, y - 90, x + d * 12, y - 80); c.fill(); }); } },
    pine: { name: 'Cây thông', icon: '🌲', price: 1000, box: { l: -54, t: -176, w: 108, h: 180 }, col: [22, 10], draw: (c, x, y) => { ell(c, x, y + 1, 40, 9, 'rgba(0,0,0,.15)'); c.fillStyle = '#6b4423'; c.fillRect(x - 7, y - 28, 14, 28); [[0, 50, 46], [-34, 42, 38], [-64, 34, 30], [-92, 24, 22]].forEach(([dy, w, h]) => { c.fillStyle = '#1e7a34'; c.beginPath(); c.moveTo(x - w, y - 24 + dy * 0 - Math.abs(dy) * 0.95); c.lineTo(x + w, y - 24 - Math.abs(dy) * 0.95); c.lineTo(x, y - 24 - Math.abs(dy) * 0.95 - h * 1.5); c.closePath(); c.fill(); c.fillStyle = '#2b8a3e'; c.beginPath(); c.moveTo(x - w * 0.15, y - 24 - Math.abs(dy) * 0.95); c.lineTo(x + w, y - 24 - Math.abs(dy) * 0.95); c.lineTo(x, y - 24 - Math.abs(dy) * 0.95 - h * 1.5); c.closePath(); c.fill(); }); } },
    sakura: { name: 'Cây hoa anh đào', icon: '🌸', price: 3000, box: { l: -110, t: -230, w: 220, h: 236 }, col: [24, 10], anim: true, draw: (c, x, y, t) => { ell(c, x, y + 1, 80, 14, 'rgba(0,0,0,.15)'); c.fillStyle = '#5c3a1e'; c.beginPath(); c.moveTo(x - 14, y); c.quadraticCurveTo(x - 4, y - 70, x - 10, y - 120); c.lineTo(x + 10, y - 120); c.quadraticCurveTo(x + 6, y - 70, x + 14, y); c.fill(); [[0, -170, 62], [-58, -140, 46], [58, -140, 46], [-30, -118, 44], [32, -116, 44], [0, -138, 54]].forEach(([dx, dy, r]) => circ(c, x + dx, y + dy + 6, r, '#f06595')); [[0, -170, 62], [-58, -140, 46], [58, -140, 46], [-30, -118, 44], [32, -116, 44], [0, -138, 54]].forEach(([dx, dy, r]) => circ(c, x + dx, y + dy, r, '#faa2c1')); [[-20, -184, 26], [-62, -150, 18]].forEach(([dx, dy, r]) => circ(c, x + dx, y + dy, r, '#ffdeeb')); for (let k = 0; k < 6; k++) { const ph = (t * 0.25 + k / 6) % 1; ell(c, x - 80 + k * 30 + Math.sin(t * 2 + k) * 10, y - 110 + ph * 110, 4, 2.5, '#fcc2d7'); } } },
    bamboo: { name: 'Khóm tre', icon: '🎋', price: 800, box: { l: -50, t: -210, w: 100, h: 214 }, col: [40, 10], draw: (c, x, y) => { [[-24, 170], [-6, 200], [14, 184], [30, 150]].forEach(([dx, h]) => { c.fillStyle = '#82c91e'; c.fillRect(x + dx - 5, y - h, 10, h); c.fillStyle = '#5c940d'; for (let k = 30; k < h; k += 34) c.fillRect(x + dx - 6, y - k, 12, 3); for (let k = 50; k < h; k += 40) { c.fillStyle = '#40c057'; c.beginPath(); c.ellipse(x + dx + 16, y - k, 16, 4, -0.4, 0, Math.PI * 2); c.fill(); } }); } },
    well: { name: 'Giếng nước', icon: '🪣', price: 2500, box: { l: -64, t: -150, w: 128, h: 156 }, col: [110, 30], draw: (c, x, y) => { ell(c, x, y - 34, 52, 16, '#495057'); rr(c, x - 52, y - 36, 104, 36, 6, '#868e96'); for (let k = 0; k < 6; k++) rr(c, x - 50 + k * 17, y - 34 + (k % 2) * 16, 15, 14, 3, '#adb5bd'); ell(c, x, y - 36, 44, 12, '#1c7ed6'); c.fillStyle = '#6b4423'; c.fillRect(x - 46, y - 116, 8, 82); c.fillRect(x + 38, y - 116, 8, 82); c.fillStyle = '#c2410c'; c.beginPath(); c.moveTo(x - 62, y - 108); c.lineTo(x, y - 148); c.lineTo(x + 62, y - 108); c.closePath(); c.fill(); c.strokeStyle = '#5c3a1e'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 110); c.lineTo(x, y - 70); c.stroke(); rr(c, x - 9, y - 72, 18, 14, 3, '#8a5a32'); } },
    flag: { name: 'Cờ đỏ sao vàng', icon: '🇻🇳', price: 500, box: { l: -14, t: -170, w: 86, h: 174 }, col: [12, 8], anim: true, draw: (c, x, y, t) => { c.fillStyle = '#ced4da'; c.fillRect(x - 3, y - 166, 6, 166); circ(c, x, y - 168, 5, '#fcc419'); c.fillStyle = '#e03131'; c.beginPath(); c.moveTo(x + 3, y - 160); for (let k = 0; k <= 10; k++) c.lineTo(x + 3 + k * 6.6, y - 160 + Math.sin(t * 5 + k * 0.6) * 3); for (let k = 10; k >= 0; k--) c.lineTo(x + 3 + k * 6.6, y - 118 + Math.sin(t * 5 + k * 0.6) * 3); c.closePath(); c.fill(); const sx = x + 36, sy = y - 139 + Math.sin(t * 5 + 3) * 3; c.fillStyle = '#ffd43b'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 4.5 : 11; c.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } c.closePath(); c.fill(); } },
    sign: { name: 'Biển tên vườn', icon: '🪧', price: 300, box: { l: -74, t: -104, w: 148, h: 108 }, col: [12, 8], draw: (c, x, y) => { c.fillStyle = '#6b4423'; c.fillRect(x - 4, y - 60, 8, 60); rr(c, x - 70, y - 100, 140, 48, 10, '#8a5a32'); rr(c, x - 64, y - 94, 128, 36, 7, '#f3d9a4'); txt(c, '🌳 Vườn của', x, y - 85, 10, '#5c3a1e', 800); txt(c, String(AV.S.name || 'Bạn').slice(0, 16), x, y - 68, 14, '#2b8a3e'); } },
    pumpkins: { name: 'Đống bí ngô', icon: '🎃', price: 400, box: { l: -48, t: -50, w: 96, h: 54 }, draw: (c, x, y) => { [[-22, 0, 18], [20, 2, 16], [0, -14, 15]].forEach(([dx, dy, r]) => { ell(c, x + dx, y + dy - r * 0.7, r * 1.15, r * 0.85, '#e8590c'); c.strokeStyle = '#c2410c'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x + dx, y + dy - r * 0.7, r * 0.5, r * 0.85, 0, 0, Math.PI * 2); c.stroke(); c.fillStyle = '#2b8a3e'; c.fillRect(x + dx - 2, y + dy - r * 1.6, 4, 7); }); } },
    haystack: { name: 'Đống rơm', icon: '🌾', price: 350, box: { l: -54, t: -76, w: 108, h: 80 }, col: [90, 18], draw: (c, x, y) => { c.fillStyle = '#e8b923'; c.beginPath(); c.moveTo(x - 50, y); c.quadraticCurveTo(x - 50, y - 76, x, y - 74); c.quadraticCurveTo(x + 50, y - 76, x + 50, y); c.closePath(); c.fill(); c.strokeStyle = '#c99a17'; c.lineWidth = 2; for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(x - 40 + k * 10, y - 4); c.lineTo(x - 36 + k * 9, y - 50 - (k % 3) * 6); c.stroke(); } } },
    // 🌸 cây cảnh mua ở Chợ hoa Quảng Bá
    dao_tet: { name: 'Cây đào Nhật Tân', icon: '🌸', price: 6000, box: { l: -90, t: -200, w: 180, h: 206 }, col: [40, 14], anim: true, draw: (c, x, y, t) => { rr(c, x - 34, y - 34, 68, 34, 8, '#b5651d'); rr(c, x - 38, y - 40, 76, 10, 4, '#c97a2a'); c.strokeStyle = '#4a2c17'; c.lineCap = 'round'; [[0, -40, -40, -120, 7], [0, -60, 46, -130, 6], [-20, -90, -66, -150, 4], [24, -96, 20, -176, 4], [0, -50, 6, -168, 6]].forEach(([x1, y1, x2, y2, w]) => { c.lineWidth = w; c.beginPath(); c.moveTo(x + x1, y + y1); c.lineTo(x + x2, y + y2); c.stroke(); }); const r = srand(Math.round(x * 3 + y)); for (let k = 0; k < 60; k++) { const a = r() * Math.PI * 2, d = 20 + r() * 64; const fx = x + Math.cos(a) * d * 0.95, fy = y - 120 + Math.sin(a) * d * 0.55; for (let p = 0; p < 5; p++) circ(c, fx + Math.cos(p * 1.256) * 3.4, fy + Math.sin(p * 1.256) * 3.4, 2.8, k % 3 ? '#ff8fab' : '#f06595'); circ(c, fx, fy, 1.6, '#fff0f6'); } for (let k = 0; k < 4; k++) { const ph = (t * 0.3 + k / 4) % 1; circ(c, x - 60 + k * 36 + Math.sin(t + k) * 8, y - 120 + ph * 116, 2.5, '#fcc2d7'); } rr(c, x - 10, y - 160, 20, 26, 3, '#e03131'); c.fillStyle = '#ffd43b'; c.font = '900 10px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('福', x, y - 147); } },
    quat: { name: 'Cây quất Tứ Liên', icon: '🍊', price: 5000, box: { l: -70, t: -170, w: 140, h: 176 }, col: [40, 14], draw: (c, x, y) => { rr(c, x - 32, y - 34, 64, 34, 8, '#2f9e44'); rr(c, x - 36, y - 40, 72, 10, 4, '#37b24d'); c.fillStyle = '#5c3a1e'; c.fillRect(x - 4, y - 70, 8, 34); [[0, -120, 56], [-34, -96, 34], [34, -96, 34], [0, -86, 40]].forEach(([dx, dy, r2]) => circ(c, x + dx, y + dy, r2, '#2b8a3e')); [[-14, -140, 26], [20, -124, 20]].forEach(([dx, dy, r2]) => circ(c, x + dx, y + dy, r2, '#40c057')); const r = srand(Math.round(x + y * 7)); for (let k = 0; k < 34; k++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 52; circ(c, x + Math.cos(a) * d, y - 108 + Math.sin(a) * d * 0.75, 5, '#fd7e14'); circ(c, x + Math.cos(a) * d - 1.5, y - 109.5 + Math.sin(a) * d * 0.75, 1.6, '#ffd8a8'); } c.fillStyle = '#e03131'; c.fillRect(x + 22, y - 150, 14, 20); } },
    mai: { name: 'Chậu mai vàng', icon: '🌼', price: 5500, box: { l: -80, t: -170, w: 160, h: 176 }, col: [40, 14], draw: (c, x, y) => { rr(c, x - 34, y - 32, 68, 32, 6, '#1c7ed6'); rr(c, x - 38, y - 38, 76, 10, 4, '#339af0'); c.strokeStyle = '#3d2410'; c.lineCap = 'round'; [[0, -38, -30, -110, 6], [0, -50, 40, -120, 5], [-20, -84, -62, -140, 3], [20, -90, 24, -160, 3]].forEach(([x1, y1, x2, y2, w]) => { c.lineWidth = w; c.beginPath(); c.moveTo(x + x1, y + y1); c.lineTo(x + x2, y + y2); c.stroke(); }); const r = srand(Math.round(x * 5 + y)); for (let k = 0; k < 50; k++) { const a = r() * Math.PI * 2, d = 16 + r() * 56, fx = x + Math.cos(a) * d * 0.9, fy = y - 112 + Math.sin(a) * d * 0.5; for (let p = 0; p < 5; p++) circ(c, fx + Math.cos(p * 1.256) * 3.2, fy + Math.sin(p * 1.256) * 3.2, 2.7, '#fcc419'); circ(c, fx, fy, 1.5, '#e8590c'); } } },
    lan: { name: 'Lan hồ điệp', icon: '🪻', price: 3500, box: { l: -46, t: -120, w: 92, h: 126 }, col: [30, 10], draw: (c, x, y) => { rr(c, x - 24, y - 30, 48, 30, 8, '#f8f9fa'); c.strokeStyle = '#dee2e6'; c.lineWidth = 2; c.strokeRect(x - 24, y - 30, 48, 30); [[-14, -36, -30, -48], [14, -36, 30, -44]].forEach(([a, b, d, e]) => { c.fillStyle = '#2b8a3e'; c.beginPath(); c.ellipse(x + (a + d) / 2, y + (b + e) / 2, 16, 6, a < 0 ? 0.4 : -0.4, 0, Math.PI * 2); c.fill(); }); [-10, 6].forEach((dx, i) => { c.strokeStyle = '#5c940d'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + dx, y - 34); c.quadraticCurveTo(x + dx - 4, y - 90, x + dx + 26, y - 110 + i * 6); c.stroke(); for (let k = 0; k < 5; k++) { const fx = x + dx + k * 6, fy = y - 70 - k * 9 + i * 6; [[-5, 0], [5, 0], [0, -5], [-4, 5], [4, 5]].forEach(([px, py]) => circ(c, fx + px, fy + py, 4, i ? '#da77f2' : '#fcc2d7')); circ(c, fx, fy, 2, '#c2255c'); } }); } },
    cuc: { name: 'Chậu cúc vàng', icon: '🌼', price: 1200, box: { l: -42, t: -78, w: 84, h: 84 }, col: [32, 10], draw: (c, x, y) => { rr(c, x - 26, y - 28, 52, 28, 6, '#c2410c'); [[-14, -44], [12, -46], [0, -58], [-20, -58], [20, -60], [0, -40]].forEach(([dx, dy]) => circ(c, x + dx, y + dy, 13, '#2f9e44')); const r = srand(Math.round(x + y)); for (let k = 0; k < 12; k++) { const fx = x - 24 + r() * 48, fy = y - 72 + r() * 32; for (let p = 0; p < 8; p++) circ(c, fx + Math.cos(p * 0.785) * 4, fy + Math.sin(p * 0.785) * 4, 2.6, '#fcc419'); circ(c, fx, fy, 2.2, '#e67700'); } } },
  };
  const DECO_ORDER = Object.keys(DECO);

  /* ================= 🧁 tiệm bánh ================= */
  const R = (out, name, ic, sub, sell, need, t, xp) => ({ out, name, ic, sub, sell, need, t, xp: xp || Math.round(4 + t * 1.2) });
  const MACH = {
    mill: { name: 'Máy xay bột', icon: '⚙️', price: 5000, col: '#adb5bd', roof: '#495057', recipes: [
      R('flour', 'Bột mì', '🥣', null, 18, { wheat: 3 }, 2, 3), R('corn_flour', 'Bột ngô', '🥣', '🌽', 22, { corn: 2 }, 2, 3), R('starch', 'Bột năng', '🥛', '🍠', 15, { sweetpotato: 2 }, 3, 3)] },
    bread: { name: 'Lò bánh mì', icon: '🥖', price: 8000, col: '#e9c46a', roof: '#9c4221', recipes: [
      R('bread', 'Bánh mì', '🥖', null, 48, { flour: 2, egg: 1 }, 4), R('garlic_bread', 'Bánh mì bơ tỏi', '🥖', '🧄', 150, { flour: 2, butter: 1, garlic: 2 }, 6), R('croissant', 'Bánh sừng bò', '🥐', null, 190, { flour: 2, butter: 2, egg: 1 }, 8),
      R('banh_bao', 'Bánh bao nhân thịt', '🥟', null, 170, { flour: 2, pork: 1, egg: 1 }, 8), R('sandwich', 'Bánh sandwich', '🥪', null, 160, { bread: 1, tomato: 2, cabbage: 1, egg: 1 }, 3)] },
    cake: { name: 'Máy làm bánh kem', icon: '🎂', price: 20000, col: '#ffdeeb', roof: '#e64980', recipes: [
      R('cupcake', 'Bánh cupcake', '🧁', null, 150, { flour: 1, egg: 1, sugar: 1, butter: 1 }, 6), R('cake_straw', 'Bánh kem dâu', '🍰', null, 380, { flour: 2, egg: 2, milk: 2, sugar: 1, strawberry: 4 }, 12),
      R('cake_choco', 'Bánh kem socola', '🍫', '🍰', 400, { flour: 2, egg: 2, milk: 2, sugar: 1, cocoa: 2 }, 12), R('mousse_mango', 'Bánh mousse xoài', '🍰', '🥭', 320, { mango: 3, milk: 2, sugar: 1, egg: 1 }, 10),
      R('cake_bday', 'Bánh sinh nhật 3 tầng', '🎂', null, 1100, { flour: 4, egg: 4, milk: 3, sugar: 2, strawberry: 5, peach: 3 }, 25)] },
    cookie: { name: 'Máy bánh quy', icon: '🍪', price: 12000, col: '#ffe8cc', roof: '#d9480f', recipes: [
      R('cookie_butter', 'Bánh quy bơ', '🍪', null, 120, { flour: 1, butter: 1, sugar: 1 }, 4), R('cookie_choco', 'Cookie socola', '🍪', '🍫', 165, { flour: 1, butter: 1, sugar: 1, cocoa: 1 }, 5),
      R('cookie_peanut', 'Bánh quy lạc', '🍪', '🥜', 130, { flour: 1, peanut: 3, sugar: 1 }, 5), R('macaron', 'Bánh macaron', '🍬', '🍓', 220, { egg: 2, sugar: 2, strawberry: 2 }, 10)] },
    donut: { name: 'Máy chiên donut', icon: '🍩', price: 15000, col: '#fff3bf', roof: '#f08c00', recipes: [
      R('donut', 'Bánh donut', '🍩', null, 160, { flour: 2, egg: 1, sugar: 1, milk: 1 }, 5), R('donut_straw', 'Donut phủ dâu', '🍩', '🍓', 200, { flour: 2, egg: 1, sugar: 1, strawberry: 3 }, 6),
      R('churros', 'Bánh churros', '🥨', null, 150, { flour: 2, sugar: 1, butter: 1 }, 5), R('banh_chuoi', 'Bánh chuối chiên', '🍌', '🔥', 120, { banana: 3, flour: 1, sugar: 1 }, 4)] },
    pie: { name: 'Lò nướng pie & pizza', icon: '🥧', price: 25000, col: '#dee2e6', roof: '#343a40', recipes: [
      R('pie_apple', 'Bánh táo nướng', '🥧', '🍎', 290, { flour: 2, apple: 4, butter: 1, sugar: 1 }, 10), R('tart_peach', 'Bánh tart đào', '🥧', '🍑', 300, { flour: 2, peach: 3, butter: 1, egg: 1 }, 10),
      R('pie_cherry', 'Bánh pie anh đào', '🥧', '🍒', 380, { flour: 2, cherry: 5, butter: 1, sugar: 1 }, 12), R('pie_pear', 'Bánh lê nướng', '🥧', '🍐', 300, { flour: 2, pear: 4, butter: 1 }, 10),
      R('pizza', 'Pizza nấm', '🍕', null, 330, { flour: 2, tomato: 3, mushroom: 2, milk: 1 }, 12)] },
    waffle: { name: 'Máy waffle & crepe', icon: '🧇', price: 18000, col: '#fff9db', roof: '#e67700', recipes: [
      R('waffle', 'Bánh waffle', '🧇', null, 210, { flour: 2, egg: 2, milk: 1, butter: 1 }, 6), R('pancake', 'Bánh pancake', '🥞', null, 170, { flour: 2, egg: 1, milk: 2, sugar: 1 }, 5),
      R('crepe', 'Bánh crepe trái cây', '🥞', '🍓', 190, { flour: 1, egg: 1, milk: 1, orange: 2, strawberry: 2 }, 6), R('coconut_waffle', 'Bánh kẹp lá dứa nước cốt dừa', '🧇', '🥥', 240, { flour: 2, egg: 1, coconut: 1, sugar: 1 }, 7)] },
    viet: { name: 'Bếp bánh truyền thống', icon: '🥮', price: 30000, col: '#ffe066', roof: '#c92a2a', recipes: [
      R('flan', 'Bánh flan', '🍮', null, 160, { egg: 3, milk: 2, sugar: 1 }, 6), R('banh_bo', 'Bánh bò nước dừa', '🍥', null, 230, { starch: 2, coconut: 1, sugar: 1 }, 8),
      R('banh_da_lon', 'Bánh da lợn', '🍮', '🥥', 260, { starch: 2, coconut: 1, sugar: 1, peanut: 2 }, 10), R('mooncake', 'Bánh trung thu', '🥮', null, 360, { flour: 2, egg: 2, peanut: 2, sugar: 2 }, 15),
      R('banh_chung', 'Bánh chưng', '🟩', '🍃', 450, { sticky_rice: 3, pork: 1, peanut: 2 }, 20), R('banh_dua', 'Bánh dừa nướng', '🥥', '🔥', 260, { coconut: 2, egg: 1, sugar: 1, flour: 1 }, 9)] },
  };
  const MACH_KEYS = Object.keys(MACH);
  const BAKED = new Set();
  MACH_KEYS.forEach((k) => MACH[k].recipes.forEach((r) => { reg(r.out, r.name, r.ic, r.sell, r.sub); if (k !== 'mill') BAKED.add(r.out); }));
  const SHOP = [['flour', 40], ['sugar', 15], ['butter', 90], ['cocoa', 25], ['sticky_rice', 20], ['starch', 35], ['egg', 20], ['milk', 45]];
  const owned = (k) => !!G().mach[k];
  function machQ(k) {
    const m = G().mach[k]; if (!m) return null;
    m.q = m.q || []; m.slots = m.slots || 3;
    return m;
  }
  function buyMachine(k) {
    const M2 = MACH[k];
    UI.confirm(`Mua <b>${M2.icon} ${M2.name}</b> giá <b>${fmt(M2.price)} xu</b>?<br><small>Làm được: ${M2.recipes.map((r) => r.ic).join(' ')}</small>`, '🛒 Mua máy', () => {
      if (!AV.spend(M2.price)) return;
      G().mach[k] = { q: [], slots: 3 };
      AV.earn(0, 20); UI.toast(`🎉 Đã lắp ${M2.icon} ${M2.name}! Bấm vào máy để làm bánh`, 4000);
      changed(); rebuild();
    });
  }
  function collect(k, quiet) {
    const m = machQ(k); if (!m) return 0;
    let n = 0;
    while (m.q.length && m.q[0].e <= now()) {
      const j = m.q.shift(), r = MACH[k].recipes[j.r];
      if (!r) continue;
      give(r.out, j.n || 1); AV.earn(0, r.xp); n++;
      if (!quiet) AV.floatText(`+${j.n || 1} ${r.ic}`, AV.player ? AV.player.x : 0, AV.player ? AV.player.y - 110 - n * 18 : 0);
    }
    if (n) changed();
    return n;
  }
  function machinePanel(k) {
    const M2 = MACH[k];
    const p = UI.panel(`${M2.icon} ${M2.name}`, '', { wide: true });
    const render = () => {
      if (!p.el.isConnected) return;
      const m = machQ(k), t0 = now();
      const done = m.q.filter((j) => j.e <= t0).length;
      const queue = m.q.map((j) => { const r = M2.recipes[j.r], left = j.e - t0, d = j.e - j.s, run = j.s <= t0; return `<div class="gd-job ${left <= 0 ? 'ok' : ''}"><span>${r.ic}</span><i style="width:${left <= 0 ? 100 : run ? Math.max(3, (1 - left / d) * 100) : 0}%"></i><small>${left <= 0 ? '✅ Xong' : run ? dur(left) : '⏳ chờ'}</small></div>`; }).join('');
      const empty = Array(Math.max(0, m.slots - m.q.length)).fill('<div class="gd-job empty"><span>➕</span><small>trống</small></div>').join('');
      p.body.innerHTML = `<div class="gd-queue">${queue}${empty}</div>
        <div class="row-end" style="margin:6px 0 10px">${done ? `<button class="btn small" data-col>📦 Lấy ${done} mẻ đã xong</button>` : ''}${m.slots < 6 ? `<button class="btn small ghost" data-slot>➕ Thêm 1 khay (${fmt(m.slots * 4000)} xu)</button>` : ''}</div>
        <div class="shop-list">${M2.recipes.map((r, i) => `<div class="shop-row"><span class="ic">${r.ic}${r.sub ? `<sup>${r.sub}</sup>` : ''}</span><div class="info"><b>${r.name}</b><small>${needTxt(r.need)} · ⏱ ${r.t} phút · bán ${fmt(r.sell)} xu</small></div><button class="btn small" data-r="${i}" ${m.q.length < m.slots && has(r.need) ? '' : 'disabled'}>Làm</button></div>`).join('')}</div>
        <p class="muted small-note">Thiếu nguyên liệu? 🧺 Đường, bơ, bột cacao, gạo nếp… mua ở <b>quầy Tạp hoá</b> trong tiệm bánh. Bột mì / bột ngô / bột năng tự xay ở ⚙️ Máy xay bột. Bánh làm xong để giao đơn ⛵ ở bến sông, ăn hồi ⚡ hoặc bán.</p>`;
      const c = p.body.querySelector('[data-col]'); if (c) c.onclick = () => { collect(k); render(); };
      const sl = p.body.querySelector('[data-slot]'); if (sl) sl.onclick = () => { if (!AV.spend(m.slots * 4000)) return; m.slots++; changed(); render(); };
      p.body.querySelectorAll('[data-r]').forEach((b) => b.onclick = () => {
        const r = M2.recipes[+b.dataset.r];
        if (m.q.length >= m.slots || !has(r.need) || !AV.useEnergy(1)) return;
        take(r.need);
        const s = Math.max(now(), m.q.length ? m.q[m.q.length - 1].e : 0);
        m.q.push({ r: +b.dataset.r, s, e: s + r.t * 60e3, n: 1 }); m.last = +b.dataset.r; AV.quest('bake');
        changed(); render();
      });
    };
    render();
    const iv = setInterval(() => (p.el.isConnected ? render() : clearInterval(iv)), 1000);
  }
  const machInd = (k) => { const m = machQ(k); if (!m || !m.q.length) return owned(k) ? '💤' : null; const j = m.q[0], left = j.e - now(); if (left <= 0) return MACH[k].recipes[j.r].ic; return { p: 1 - left / (j.e - j.s), left: left / 1000 }; };
  function grocery() {
    const p = UI.panel('🧺 Quầy tạp hoá nguyên liệu', '', { wide: true });
    const render = () => {
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu</div><div class="shop-list">${SHOP.map(([id, price]) => `<div class="shop-row"><span class="ic">${icon(id)}</span><div class="info"><b>${nm(id)}</b><small>Đang có ${inv()[id] || 0} · ${fmt(price)} xu / cái</small></div><button class="btn small" data-b="${id}:1">+1</button><button class="btn small" data-b="${id}:10">+10 (${fmt(price * 10)})</button></div>`).join('')}</div>
        <p class="muted small-note">Trứng, sữa ở đây đắt hơn tự nuôi ở nông trại. Bột mì tự xay rẻ hơn nhiều!</p>`;
      p.body.querySelectorAll('[data-b]').forEach((b) => b.onclick = () => { const [id, n] = b.dataset.b.split(':'), pr = SHOP.find((x) => x[0] === id)[1] * +n; if (!AV.spend(pr)) return; give(id, +n); render(); });
    };
    render();
  }
  function recipeBook() {
    UI.panel('📖 Sổ công thức bánh', MACH_KEYS.map((k) => `<h4 style="margin:10px 0 4px">${MACH[k].icon} ${MACH[k].name} ${owned(k) ? '' : `<small class="muted">· chưa có (${fmt(MACH[k].price)} xu)</small>`}</h4>${MACH[k].recipes.map((r) => `<div class="shop-row"><span class="ic">${r.ic}</span><div class="info"><b>${r.name}</b><small>${needTxt(r.need)} · ${r.t} phút · bán ${fmt(r.sell)} xu</small></div></div>`).join('')}`).join(''), { wide: true });
  }

  /* ================= ⛵ bến sông + đơn giao hàng ================= */
  const BOATS = {
    sampan: { name: 'Thuyền nan', price: 0, speed: 1, bonus: 0 },
    wood: { name: 'Ghe gỗ mái chèo', price: 30000, speed: 1.35, bonus: 0.05 },
    motor: { name: 'Ca nô', price: 120000, speed: 1.9, bonus: 0.1 },
    yacht: { name: 'Du thuyền', price: 500000, speed: 2.6, bonus: 0.25 },
  };
  const BOAT_KEYS = Object.keys(BOATS);
  const MAX_BOATS = 3, ORDER_N = 5;
  const PLACES = ['🏘️ Làng chài Bãi Cháy', '🏯 Phố cổ Hội An', '🛶 Chợ nổi Cái Răng', '🏝️ Đảo Cát Bà', '🏔️ Bản Sa Pa', '🌆 Bến Nhà Rồng', '🏰 Kinh thành Huế', '⛩️ Làng hoa Sa Đéc', '🎪 Hội chợ Tràng An', '🏫 Trường mầm non Hoa Sen', '🎂 Tiệc sinh nhật bé Na', '💒 Đám cưới anh Tuấn', '☕ Quán cà phê Phố Cổ', '🏨 Khách sạn Bờ Hồ'];
  function makeOrder() {
    const g = G(), pool = ['egg', 'milk', 'wheat', 'corn', 'strawberry', 'tomato', 'carrot', 'orange', 'apple'];
    g.trees.forEach((t) => { const f = TREES[t.k] && TREES[t.k].fruit; if (f && !pool.includes(f)) pool.push(f); });
    const bakes = [];
    MACH_KEYS.forEach((k) => { if (owned(k)) MACH[k].recipes.forEach((r) => bakes.push(r.out)); });
    const need = {}, kinds = 1 + Math.floor(Math.random() * (bakes.length ? 3 : 2));
    for (let i = 0; i < kinds; i++) {
      const useBake = bakes.length && Math.random() < 0.65, id = useBake ? bakes[Math.floor(Math.random() * bakes.length)] : pool[Math.floor(Math.random() * pool.length)];
      if (!DATA.ITEMS[id]) continue;
      const sell = Math.max(5, DATA.ITEMS[id].sell);
      need[id] = (need[id] || 0) + Math.max(1, Math.round((useBake ? 1.5 : 40 / sell) * (1 + Math.random() * 2)));
    }
    if (!Object.keys(need).length) need.egg = 6;
    const val = Object.entries(need).reduce((s, [id, n]) => s + DATA.ITEMS[id].sell * n, 0);
    const rush = Math.random() < 0.22;
    return { id: g.seq++, who: PLACES[Math.floor(Math.random() * PLACES.length)], need, coins: Math.round((val * (rush ? 2.3 : 1.7) + 150) / 10) * 10, xp: 10 + Math.round(val / 15), min: Math.round(6 + Math.random() * 18), rush, exp: rush ? now() + 2 * 3600e3 : 0 };
  }
  function orders() {
    const g = G();
    while (g.orders.length < ORDER_N) g.orders.push(makeOrder());
    g.orders.forEach((o, i) => { if (o.cool && o.cool <= now()) g.orders[i] = makeOrder(); else if (!o.cool && o.exp && o.exp <= now()) g.orders[i] = { cool: now() + 60e3 }; });
    return g.orders;
  }
  const idleBoat = () => G().boats.findIndex((b) => !b.trip);
  function send(i, quiet) {
    const g = G(), o = orders()[i], bi = idleBoat();
    if (!o || o.cool) return false;
    if (bi < 0) return quiet ? false : UI.toast('⛵ Hết thuyền rảnh — chờ thuyền về hoặc mua thêm thuyền');
    if (!has(o.need)) return quiet ? false : UI.toast('Chưa đủ hàng để giao đơn này');
    take(o.need);
    const B = BOATS[g.boats[bi].k], d = Math.round(o.min * 60e3 / B.speed);
    g.boats[bi].trip = { o, s: now(), e: now() + d };
    g.orders[i] = { cool: now() + 3 * 60e3 };
    if (!quiet) { AV.sayMine('⛵ Lên đường nào!'); UI.toast(`⛵ ${B.name} chở hàng đi ${o.who} · ${dur(d)} nữa về`, 4000); }
    changed();
    return true;
  }
  function collectBoat(bi, quiet) {
    const g = G(), b = g.boats[bi];
    if (!b || !b.trip || b.trip.e > now()) return false;
    const B = BOATS[b.k], o = b.trip.o, coins = Math.round(o.coins * (1 + B.bonus));
    if (quiet) { S().coins += coins; AV.earn(0, o.xp); } else AV.earn(coins, o.xp);
    g.delivered = (g.delivered || 0) + 1; AV.quest('ship');
    if (!quiet) { AV.floatText(`⛵ +${fmt(coins)} xu`, AV.player ? AV.player.x : 0, AV.player ? AV.player.y - 130 : 0, '#ffd43b'); UI.toast(`💰 ${B.name} giao xong đơn cho ${o.who}: +${fmt(coins)} xu, +${o.xp} XP`, 4500); }
    if (Math.random() < 0.15) { const tip = ['sugar', 'cocoa', 'butter', 'sticky_rice'][Math.floor(Math.random() * 4)]; give(tip, 3); UI.toast(`🎁 Khách tặng thêm 3 ${icon(tip)} ${nm(tip)}!`, 3500); }
    b.trip = null; changed();
    return quiet ? coins : true;
  }

  /* ================= 🧑‍🌾 quản gia vườn (thuê giúp việc) ================= */
  const STAFF_LABELS = { water: '💧 tưới', harvest: '🧺 hái quả', bake: '🧁 lấy bánh', remake: '🔁 làm bánh', boat: '💰 nhận tiền thuyền', send: '⛵ gửi đơn' };
  const staffSt = () => { const g = G(); g.staff = g.staff || {}; return g.staff; };
  function staffWork() {
    if (typeof STAFF === 'undefined' || !AV.S) return;
    const st = staffSt(); if (!STAFF.active(st)) return;
    const g = G(), d = {}, add = (k, n = 1) => { d[k] = (d[k] || 0) + n; };
    g.trees.forEach((t) => {
      if (!TREES[t.k]) return;
      const s = tstate(t);
      if (s.ripe && STAFF.on(st, 'harvest')) { t.h = t.g; give(s.T.fruit, s.T.yield); add('harvest', s.T.yield); }
      else if (!s.ripe && !s.wet && STAFF.on(st, 'water')) { t.wet = now() + 30 * 60e3; add('water'); }
    });
    MACH_KEYS.forEach((k) => {
      if (!owned(k)) return;
      if (STAFF.on(st, 'bake')) add('bake', collect(k, true));
      const m = machQ(k);
      if (STAFF.on(st, 'remake') && m.last != null && m.q.length < m.slots) { const r = MACH[k].recipes[m.last]; if (r && has(r.need)) { take(r.need); const s0 = Math.max(now(), m.q.length ? m.q[m.q.length - 1].e : 0); m.q.push({ r: m.last, s: s0, e: s0 + r.t * 60e3, n: 1 }); add('remake'); } }
    });
    if (STAFF.on(st, 'boat')) g.boats.forEach((b, i) => { const c = collectBoat(i, true); if (c) add('boat', c); });
    if (st.opt && st.opt.send) orders().forEach((o, i) => { if (!o.cool && has(o.need) && idleBoat() >= 0 && send(i, true)) add('send'); });
    if (!Object.keys(d).length) return;
    const msg = STAFF.record(st, d, STAFF_LABELS);
    changed();
    if (AV.currentMap && AV.currentMap() === 'garden') UI.toast(`🧑‍🌾 Quản gia vườn: ${msg}`, 3500);
  }
  function staffPanel() {
    if (typeof STAFF === 'undefined') return;
    const st = staffSt(); if (!st.opt) st.opt = { send: false };
    STAFF.panel({ title: 'Thuê quản gia vườn', who: 'Quản gia vườn', icon: '🧑‍🌾', get: staffSt, labels: STAFF_LABELS,
      desc: 'Quản gia chăm vườn nhà giúp bạn: <b>tưới cây</b>, <b>hái quả chín</b> cất vào túi, <b>lấy bánh đã nướng xong</b>, <b>làm lại món bánh gần nhất</b> của từng máy (nếu đủ nguyên liệu trong túi), <b>nhận tiền thuyền giao hàng về</b>. Có thể bật thêm tự gửi đơn giao hàng khi đủ hàng.',
      jobs: [['water', '💧 Tưới cây ăn quả'], ['harvest', '🧺 Hái quả chín'], ['bake', '🧁 Lấy bánh đã xong'], ['remake', '🔁 Làm lại món bánh gần nhất'], ['boat', '💰 Nhận tiền thuyền về bến'], ['send', '⛵ Tự gửi đơn giao hàng khi đủ hàng']], onHire: staffWork });
  }
  function dockPanel(tab = 'orders') {
    const p = UI.panel('⛵ Bến thuyền giao hàng', '', { wide: true });
    const render = () => {
      if (!p.el.isConnected) return;
      const g = G(), list = orders(), t0 = now();
      const tabs = [['orders', '📦 Đơn hàng'], ['boats', `⛵ Thuyền (${g.boats.filter((b) => b.trip && b.trip.e <= t0).length ? '💰' : g.boats.length})`]];
      let html = `<div class="chips">${tabs.map(([k, n]) => `<button class="chip ${k === tab ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>`;
      if (tab === 'orders') {
        const idle = idleBoat() >= 0;
        html += `<p class="muted">Gom đủ hàng rồi bấm <b>Giao</b> — 1 thuyền rảnh sẽ chở đi. ${idle ? '' : '<b>⛵ Đang hết thuyền rảnh.</b>'} Đã giao ${g.delivered || 0} đơn.</p><div class="shop-list">${list.map((o, i) => o.cool
          ? `<div class="shop-row" style="opacity:.6"><span class="ic">⏳</span><div class="info"><b>Đơn mới sắp tới</b><small>còn ${dur(o.cool - t0)}</small></div></div>`
          : `<div class="shop-row ${has(o.need) ? 'quest ready' : ''}"><span class="ic">${o.rush ? '⚡' : '📦'}</span><div class="info"><b>${o.who}${o.rush ? ` · <span style="color:#e03131">GẤP · còn ${dur(o.exp - t0)}</span>` : ''}</b><small>Cần: ${needTxt(o.need)}</small><small>Thưởng 💰 ${fmt(o.coins)} xu · ⭐ ${o.xp} XP · đi ${o.min} phút (thuyền nan)</small></div><button class="btn small" data-send="${i}" ${has(o.need) && idle ? '' : 'disabled'}>⛵ Giao</button><button class="btn small ghost" data-skip="${i}" title="Bỏ đơn">✕</button></div>`).join('')}</div>`;
      } else {
        html += `<div class="shop-list">${g.boats.map((b, i) => { const B = BOATS[b.k], tr = b.trip; const st = !tr ? '⚓ Đang neo ở bến — rảnh' : tr.e <= t0 ? `✅ Đã giao xong cho ${tr.o.who}` : `🌊 Đang chở hàng đi ${tr.o.who} · còn ${dur(tr.e - t0)}`; const up = BOAT_KEYS.filter((k) => BOATS[k].price > B.price); return `<div class="shop-row ${tr && tr.e <= t0 ? 'quest ready' : ''}"><span class="ic">${b.k === 'yacht' ? '🛥️' : b.k === 'motor' ? '🚤' : '⛵'}</span><div class="info"><b>${B.name}</b><small>${st}</small><small>Tốc độ ×${B.speed}${B.bonus ? ` · thưởng +${Math.round(B.bonus * 100)}%` : ''}</small>${tr && tr.e > t0 ? `<div class="qbar"><i style="width:${(1 - (tr.e - t0) / (tr.e - tr.s)) * 100}%"></i></div>` : ''}</div>${tr && tr.e <= t0 ? `<button class="btn small" data-col="${i}">💰 Nhận</button>` : ''}${!tr && up.length ? `<button class="btn small ghost" data-up="${i}:${up[0]}">⬆️ ${BOATS[up[0]].name} (${fmt(BOATS[up[0]].price - B.price)})</button>` : ''}</div>`; }).join('')}</div>
          ${g.boats.length < MAX_BOATS ? `<div class="row-end"><button class="btn" data-buy>➕ Mua thêm thuyền nan (${fmt(15000 * g.boats.length)} xu)</button></div>` : '<p class="muted small-note">Bến chỉ neo được 3 thuyền — nâng cấp thuyền để chạy nhanh hơn, thưởng nhiều hơn.</p>'}`;
      }
      p.body.innerHTML = html;
      p.body.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      p.body.querySelectorAll('[data-send]').forEach((b) => b.onclick = () => { send(+b.dataset.send); render(); });
      p.body.querySelectorAll('[data-skip]').forEach((b) => b.onclick = () => { G().orders[+b.dataset.skip] = { cool: now() + 5 * 60e3 }; changed(); render(); });
      p.body.querySelectorAll('[data-col]').forEach((b) => b.onclick = () => { collectBoat(+b.dataset.col); render(); });
      p.body.querySelectorAll('[data-up]').forEach((b) => b.onclick = () => { const [i, k] = b.dataset.up.split(':'), bt = G().boats[+i], cost = BOATS[k].price - BOATS[bt.k].price; UI.confirm(`Nâng cấp lên <b>${BOATS[k].name}</b> giá <b>${fmt(cost)} xu</b>?`, '⬆️ Nâng cấp', () => { if (!AV.spend(cost)) return; bt.k = k; changed(); UI.toast(`⛵ Đã có ${BOATS[k].name}!`); render(); }); });
      const by = p.body.querySelector('[data-buy]'); if (by) by.onclick = () => { const cost = 15000 * G().boats.length; if (!AV.spend(cost)) return; G().boats.push({ k: 'sampan', trip: null }); changed(); UI.toast('⛵ Có thêm 1 thuyền nan!'); render(); };
    };
    render();
    const iv = setInterval(() => (p.el.isConnected ? render() : clearInterval(iv)), 1000);
  }

  /* ---------- vẽ thuyền ---------- */
  function drawBoat(c, x, y, k, t, dir, cargo, moving) {
    const bob = Math.sin(t * 2 + x * 0.01) * 2.5;
    c.save(); c.translate(x, y + bob); c.scale(dir, 1);
    if (moving) { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; for (let k2 = 0; k2 < 3; k2++) { c.beginPath(); c.moveTo(-70 - k2 * 22, 4 + k2 * 3); c.quadraticCurveTo(-90 - k2 * 22, 10 + k2 * 4, -110 - k2 * 22, 6); c.stroke(); } }
    ell(c, 0, 8, 80, 10, 'rgba(0,40,80,.25)');
    if (k === 'yacht') {
      c.fillStyle = '#f8f9fa'; c.beginPath(); c.moveTo(-90, -14); c.lineTo(96, -14); c.lineTo(70, 8); c.lineTo(-80, 8); c.closePath(); c.fill(); c.fillStyle = '#1c7ed6'; c.fillRect(-84, -4, 168, 5);
      rr(c, -60, -44, 110, 30, 8, '#fff'); c.fillStyle = '#74c0fc'; for (let i = 0; i < 5; i++) rr(c, -52 + i * 20, -38, 14, 11, 3, '#74c0fc'); rr(c, -40, -66, 64, 22, 6, '#f1f3f5'); c.fillStyle = '#1864ab'; c.fillRect(-34, -60, 52, 8);
      c.fillStyle = '#495057'; c.fillRect(10, -84, 3, 20); c.fillStyle = '#e03131'; c.beginPath(); c.moveTo(13, -84); c.lineTo(30, -79); c.lineTo(13, -74); c.fill();
    } else if (k === 'motor') {
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-70, -14); c.lineTo(80, -10); c.quadraticCurveTo(70, 6, 50, 8); c.lineTo(-64, 8); c.closePath(); c.fill(); c.fillStyle = '#e03131'; c.fillRect(-66, -4, 130, 5);
      c.fillStyle = 'rgba(116,192,252,.85)'; c.beginPath(); c.moveTo(-6, -14); c.lineTo(22, -34); c.lineTo(34, -12); c.closePath(); c.fill();
      rr(c, -80, -22, 14, 26, 3, '#343a40');
    } else if (k === 'wood') {
      c.fillStyle = '#6b4423'; c.beginPath(); c.moveTo(-88, -20); c.quadraticCurveTo(-60, 10, 0, 10); c.quadraticCurveTo(60, 10, 88, -20); c.lineTo(70, -12); c.lineTo(-70, -12); c.closePath(); c.fill();
      c.fillStyle = '#8a5a32'; c.fillRect(-72, -16, 144, 6); c.strokeStyle = '#3d2410'; c.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(-70, -6 + i * 3); c.lineTo(70, -6 + i * 3); c.stroke(); }
      c.fillStyle = '#c2410c'; c.beginPath(); c.moveTo(-40, -16); c.quadraticCurveTo(-10, -52, 22, -16); c.closePath(); c.fill(); c.fillStyle = '#5c3a1e'; c.fillRect(-40, -18, 62, 4);
    } else {
      c.fillStyle = '#8a5a32'; c.beginPath(); c.moveTo(-70, -16); c.quadraticCurveTo(-46, 8, 0, 8); c.quadraticCurveTo(46, 8, 70, -16); c.closePath(); c.fill();
      c.fillStyle = '#a0703f'; c.fillRect(-58, -16, 116, 5);
      // người chèo đội nón lá
      c.fillStyle = '#1c7ed6'; rr(c, 30, -44, 16, 28, 5, '#1c7ed6'); circ(c, 38, -50, 7, '#f1c27d'); c.fillStyle = '#e9d8a6'; c.beginPath(); c.moveTo(24, -50); c.lineTo(38, -66); c.lineTo(52, -50); c.closePath(); c.fill();
      c.strokeStyle = '#5c3a1e'; c.lineWidth = 3; c.beginPath(); c.moveTo(56, -46); c.lineTo(28 + Math.sin(t * 3) * 6, 14); c.stroke();
    }
    if (cargo) { const crates = k === 'sampan' ? 2 : 3; for (let i = 0; i < crates; i++) { rr(c, -46 + i * 24, (k === 'yacht' ? -60 : -34), 20, 18, 3, i % 2 ? '#e8b923' : '#c99a17'); c.strokeStyle = '#8a5a00'; c.lineWidth = 1; c.strokeRect(-46 + i * 24, (k === 'yacht' ? -60 : -34), 20, 18); } }
    c.restore();
  }

  /* ================= bản đồ ================= */
  const W = 3800, Hh = 1720, YARD = { l: 150, t: 450, r: 2380, b: 1165 }, RIVER = 1345, PIER = { l: 2560, r: 3320, b: 1410 };
  const SLOTS = [[2700, 1505], [2960, 1505], [3220, 1505]];
  const MPOS = { mill: [2640, 930], bread: [2940, 930], cake: [3240, 930], cookie: [3540, 930], donut: [2640, 1150], pie: [2940, 1150], waffle: [3240, 1150], viet: [3540, 1150] };
  let M = null, lastRef = null;
  const sprCache = new WeakMap();

  function boatPos(i, t) {
    const b = G().boats[i], [sx, sy] = SLOTS[i] || SLOTS[0];
    if (!b || !b.trip) return { x: sx, y: sy, dir: 1, vis: true, moving: false };
    const tr = b.trip, p = Math.min(1, (now() - tr.s) / Math.max(1, tr.e - tr.s));
    if (p >= 1) return { x: sx, y: sy, dir: 1, vis: true, moving: false };
    const lane = sy + 60;
    if (p < 0.3) { const q = p / 0.3, e = q * q; return { x: sx + (W + 260 - sx) * e, y: sy + (lane - sy) * Math.min(1, q * 3), dir: 1, vis: true, moving: true, cargo: true }; }
    if (p < 0.7) return { vis: false };
    const q = (p - 0.7) / 0.3, e = 1 - (1 - q) * (1 - q);
    return { x: -260 + (sx + 260) * e, y: lane + (sy - lane) * Math.max(0, q * 3 - 2), dir: 1, vis: true, moving: q < 0.98 };
  }

  function rebuild() {
    if (!M) return;
    const g = G(); lastRef = g;
    const objs = [], cols = [], ints = [], lights = [];
    g.trees.forEach((t) => {
      if (!TREES[t.k]) return;
      const st = tstate(t), s = st.scale;
      objs.push({ y: t.y, bb: [t.x - 170, t.y - 380, t.x + 170, t.y + 24], gd: t, draw: (c, tm) => FX.drawCached(c, t, (cc) => drawTree(cc, t, tm), t.x, t.y, { l: -165, t: -375, w: 330, h: 395 }, 600) });
      cols.push({ x: t.x - 14, y: t.y - 12, w: 28, h: 14 });
      ints.push({ x: t.x - 90, y: t.y - 60 - 230 * s, w: 180, h: 70 + 230 * s, ax: t.x, ay: t.y + 36, name: `${TREES[t.k].name} (tưới / hái quả)`, use: () => useTree(t), indicator: () => treeInd(t), ix: t.x, iy: t.y - 90 - 240 * s });
    });
    g.deco.forEach((d) => {
      const D = DECO[d.k]; if (!D) return;
      const box = D.box, bb = [d.x + box.l, d.y + box.t, d.x + box.l + box.w, d.y + box.t + box.h];
      const drawFn = (c, tm) => flipX(c, d.x, d.f, () => D.draw(c, d.x, d.y, tm || 0));
      const sig = `${d.x},${d.y},${d.f ? 1 : 0}`;
      let ce = sprCache.get(d);
      if (!D.anim && (!ce || ce.sig !== sig)) { ce = { sig, spr: FX.sprite((c) => drawFn(c, 0), d.x, d.y, box) }; sprCache.set(d, ce); }
      const spr = D.anim ? null : ce.spr;
      objs.push({ y: D.flat ? 1 : d.y, bb, gd: d, draw: D.anim ? (c, tm) => FX.drawCached(c, d, (cc) => drawFn(cc, tm), d.x, d.y, box, 80) : spr });
      if (D.col) cols.push({ x: d.x - D.col[0] / 2, y: d.y - D.col[1], w: D.col[0], h: D.col[1] });
      if (D.colR) cols.push({ x: d.x + D.colR[0], y: d.y + D.colR[1], w: D.colR[2], h: D.colR[3] });
      if (D.light) lights.push([d.x + (d.k === 'lantern' ? 24 * (d.f ? -1 : 1) : 0), d.y - (d.k === 'lantern' ? 82 : 96), 56]);
    });
    const tag = (a) => a.map((o) => { o._gd = 1; return o; });
    const keep = (a) => (a || []).filter((o) => !o._gd);
    M.objects = keep(M.objects).concat(tag(objs));
    M.colliders = keep(M.colliders).concat(tag(cols));
    M.inter = keep(M.inter).concat(tag(ints));
    M.lights = keep(M.lights).concat(tag(lights));
    if (typeof AV.resetNav === 'function') AV.resetNav('garden');
  }

  function buildMap(H) {
    const { base, ground, obj, sobj, aobj, col, inter, paintGrass, addTree, edges } = H;
    const m = base('garden', '🌳 Vườn Nhà · Tiệm Bánh · Bến Sông', W, Hh);
    m.private = true; m.lights = [];
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 404);
      // đất vườn tươi hơn
      g.fillStyle = 'rgba(120,200,90,.18)'; g.beginPath(); g.roundRect(YARD.l - 20, YARD.t - 10, YARD.r - YARD.l + 40, YARD.b - YARD.t + 30, 40); g.fill();
      // lối đi chính
      g.fillStyle = '#d6b98a'; g.fillRect(0, 1195, W, 74); g.fillStyle = 'rgba(0,0,0,.05)'; for (let x = 0; x < W; x += 40) g.fillRect(x, 1195, 20, 74);
      // sân lát trước tiệm bánh
      g.fillStyle = '#e9dcc4'; g.fillRect(2470, 690, W - 2470 - 30, 505);
      g.strokeStyle = 'rgba(0,0,0,.06)'; g.lineWidth = 2; for (let x = 2470; x < W - 30; x += 50) { g.beginPath(); g.moveTo(x, 690); g.lineTo(x, 1195); g.stroke(); } for (let y = 690; y < 1195; y += 50) { g.beginPath(); g.moveTo(2470, y); g.lineTo(W - 30, y); g.stroke(); }
      // bờ sông + nước
      g.fillStyle = '#a0703f'; g.fillRect(0, RIVER - 18, W, 22);
      const wg = g.createLinearGradient(0, RIVER, 0, Hh - 70); wg.addColorStop(0, '#1971c2'); wg.addColorStop(1, '#4dabf7'); g.fillStyle = wg; g.fillRect(0, RIVER, W, Hh - 70 - RIVER);
      g.fillStyle = 'rgba(255,255,255,.08)'; for (let k = 0; k < 60; k++) g.fillRect((k * 263) % W, RIVER + 20 + ((k * 97) % (Hh - 110 - RIVER)), 60, 3);
      g.fillStyle = '#a0703f'; g.fillRect(0, Hh - 74, W, 10); paintGrass2(g);
      // cầu tàu
      g.fillStyle = '#5c3a1e'; g.fillRect(PIER.l, RIVER - 14, PIER.r - PIER.l, PIER.b - RIVER + 22);
      g.fillStyle = '#a0703f'; for (let x = PIER.l; x < PIER.r; x += 22) g.fillRect(x + 1, RIVER - 14, 19, PIER.b - RIVER + 14);
    });
    function paintGrass2(g) { g.fillStyle = '#69b34c'; g.fillRect(0, Hh - 64, W, 64); g.fillStyle = 'rgba(0,0,0,.06)'; for (let k = 0; k < 120; k++) g.fillRect((k * 131) % W, Hh - 60 + (k * 7) % 50, 3, 9); }
    const lab = (t, x, y) => m.labels.push({ text: t, x, y });
    lab('🌳 Vườn Nhà Của Bạn — tự trồng cây, tự trang trí', 1260, 430);
    lab('🧁 Tiệm Bánh Ngọt', 3130, 430);
    lab('⛵ Bến Thuyền Giao Hàng', 2940, 1300);

    /* sóng nước động */
    obj(m, RIVER + 2, (c, t) => {
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
      for (let k = 0; k < 26; k++) { const x = ((k * 211 + t * 30) % (W + 200)) - 100, y = RIVER + 30 + ((k * 61) % (Hh - 150 - RIVER)); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 20, y - 5, x + 40, y); c.stroke(); }
      [[400, 1450], [1300, 1560], [2100, 1480]].forEach(([lx, ly], k) => { ell(c, lx, ly, 18, 7, '#40c057'); circ(c, lx + 6, ly - 3, 5, ['#ff8fab', '#fff', '#ffd43b'][k]); });
      for (let k = 0; k < 3; k++) { const x = 600 + k * 70 + Math.sin(t * 0.3) * 300, y = 1430 + k * 14; c.save(); c.translate(x, y); c.scale(Math.cos(t * 0.3) > 0 ? -1 : 1, 1); em(c, '🦆', 0, 0, 26); c.restore(); }
      const fj = (t * 0.6) % 4; if (fj < 0.5) { const q = fj / 0.5; em(c, '🐟', 1700 + q * 40, 1520 - Math.sin(q * Math.PI) * 40, 22); }
    }, [0, RIVER, W, Hh - 60]);
    /* bờ cỏ lau dưới cùng */
    sobj(m, 0, Hh - 40, (c) => { for (let x = 10; x < W; x += 26) { c.strokeStyle = '#5c940d'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, Hh - 40); c.quadraticCurveTo(x - 4, Hh - 70, x - 8, Hh - 92); c.moveTo(x + 6, Hh - 40); c.quadraticCurveTo(x + 8, Hh - 66, x + 14, Hh - 84); c.stroke(); if (x % 104 < 26) ell(c, x - 8, Hh - 96, 3, 9, '#8a5a32'); } }, { l: -10, t: -100, w: W + 20, h: 104 });
    [[300, Hh - 30, 'green'], [1100, Hh - 26, 'pink'], [1900, Hh - 30, 'fruit'], [3500, Hh - 28, 'green']].forEach(([x, y, v]) => addTree(m, x, y, v));

    /* thuyền: vẽ theo trạng thái chuyến đi */
    for (let i = 0; i < MAX_BOATS; i++) {
      obj(m, SLOTS[i][1] + 10, (c, t) => {
        const b = G().boats[i]; if (!b) return;
        const p = boatPos(i, t); if (!p.vis) return;
        drawBoat(c, p.x, p.y, b.k, t, p.dir, p.cargo, p.moving);
        // dây neo
        if (!p.moving && !(b.trip && b.trip.e > now())) { c.strokeStyle = '#5c3a1e'; c.lineWidth = 2; c.beginPath(); c.moveTo(p.x - 30, p.y - 14); c.quadraticCurveTo(p.x - 34, PIER.b + 10, p.x - 40, PIER.b - 4); c.stroke(); }
      });
      inter(m, { x: SLOTS[i][0] - 90, y: SLOTS[i][1] - 80, w: 180, h: 100, ax: SLOTS[i][0], ay: PIER.b - 10, name: 'Thuyền giao hàng', when: () => !!G().boats[i], use: () => { if (!collectBoat(i)) dockPanel(G().boats[i] && G().boats[i].trip ? 'boats' : 'orders'); }, indicator: () => { const b = G().boats[i]; if (!b || !b.trip) return null; const left = b.trip.e - now(); return left <= 0 ? '💰' : { p: 1 - left / (b.trip.e - b.trip.s), left: left / 1000 }; }, ix: SLOTS[i][0], iy: SLOTS[i][1] - 70 });
    }
    // cột neo trên cầu tàu
    sobj(m, 2940, PIER.b, (c) => { [2600, 2800, 3080, 3290].forEach((x) => { rr(c, x - 7, PIER.b - 26, 14, 26, 4, '#495057'); ell(c, x, PIER.b - 26, 8, 4, '#868e96'); }); }, { l: -360, t: -34, w: 740, h: 40 });

    /* bảng đơn hàng + quầy thuyền trên cầu tàu */
    sobj(m, 2650, 1395, (c) => {
      c.fillStyle = '#5c3a1e'; c.fillRect(2600, 1320, 8, 75); c.fillRect(2692, 1320, 8, 75);
      rr(c, 2580, 1240, 140, 96, 10, '#1864ab'); rr(c, 2588, 1248, 124, 80, 7, '#fff8e1');
      c.textAlign = 'center'; c.textBaseline = 'middle'; em(c, '📦', 2650, 1282, 26); txt(c, 'ĐƠN GIAO HÀNG', 2650, 1298, 12, '#1864ab'); txt(c, 'Gom hàng · thả thuyền', 2650, 1316, 9, '#5c3a1e', 800);
    }, { l: -80, t: -160, w: 160, h: 165 });
    col(m, 2595, 1385, 110, 10);
    inter(m, { x: 2580, y: 1240, w: 140, h: 150, ax: 2650, ay: 1405, name: 'Bảng đơn giao hàng bằng thuyền', use: () => dockPanel('orders'), arrow: { x: 2650, y: 1225, text: 'Đơn hàng' }, indicator: () => (orders().some((o) => !o.cool && has(o.need)) && idleBoat() >= 0 ? '📦' : null), ix: 2650, iy: 1236 });
    sobj(m, 3240, 1395, (c) => {
      c.fillStyle = '#5c3a1e'; c.fillRect(3236, 1300, 8, 95);
      rr(c, 3176, 1254, 128, 60, 10, '#0ca678'); txt(c, '⛵ THUYỀN', 3240, 1274, 15, '#fff'); txt(c, 'Mua · nâng cấp', 3240, 1296, 10, '#e6fcf5', 800);
    }, { l: -70, t: -146, w: 140, h: 150 });
    col(m, 3230, 1385, 20, 10);
    inter(m, { x: 3176, y: 1254, w: 128, h: 140, ax: 3240, ay: 1405, name: 'Quầy thuyền (mua / nâng cấp thuyền)', use: () => dockPanel('boats'), arrow: { x: 3240, y: 1240, text: 'Thuyền' } });
    // nước: chỉ đi được trên cầu tàu
    col(m, 0, RIVER - 4, PIER.l, Hh); col(m, PIER.r, RIVER - 4, W - PIER.r, Hh); col(m, PIER.l, PIER.b + 2, PIER.r - PIER.l, Hh);

    /* về trang trại + vườn ươm + trang trí */
    const board = (x, y, bg, l1, l2, ic) => sobj(m, x, y, (c) => { c.fillStyle = '#6b4423'; c.fillRect(x - 4, y - 70, 8, 70); rr(c, x - 72, y - 128, 144, 64, 10, bg); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; c.beginPath(); c.roundRect(x - 72, y - 128, 144, 64, 10); c.stroke(); em(c, ic, x - 46, y - 82, 26); txt(c, l1, x + 14, y - 106, 13, '#fff'); txt(c, l2, x + 14, y - 86, 10, '#fff', 800); }, { l: -80, t: -136, w: 160, h: 140 });
    board(130, 1330, '#2f9e44', '⬅ VỀ', 'Trang trại', '🚜'); col(m, 125, 1322, 12, 10);
    inter(m, { x: 58, y: 1200, w: 144, h: 130, ax: 130, ay: 1240, name: 'Về Trang Trại Mở Rộng', use: () => AV.teleport('ranch', false, 2780, 1455, '🚜 Về trang trại mở rộng…'), arrow: { x: 130, y: 1185, text: 'Trang trại' } });
    board(360, 1330, '#5c940d', 'VƯỜN ƯƠM', 'Mua cây giống', '🌱'); col(m, 355, 1322, 12, 10);
    inter(m, { x: 288, y: 1200, w: 144, h: 130, ax: 360, ay: 1240, name: 'Vườn ươm (mua cây giống, chọn chỗ trồng)', use: () => nursery(), arrow: { x: 360, y: 1185, text: 'Cây giống' } });
    board(590, 1330, '#e64980', 'TRANG TRÍ', 'Mua · sắp xếp đồ', '🎨'); col(m, 585, 1322, 12, 10);
    board(1060, 1330, '#1971c2', 'QUẢN GIA', 'Thuê giúp việc', '🧑‍🌾'); col(m, 1055, 1322, 12, 10);
    inter(m, { x: 988, y: 1200, w: 144, h: 130, ax: 1060, ay: 1240, name: 'Thuê quản gia vườn (tưới, hái, lấy bánh, nhận tiền thuyền)', use: () => staffPanel(), arrow: { x: 1060, y: 1185, text: 'Giúp việc' }, indicator: () => (typeof STAFF !== 'undefined' && STAFF.active(staffSt()) ? '🧑‍🌾' : null), ix: 1060, iy: 1196 });
    inter(m, { x: 518, y: 1200, w: 144, h: 130, ax: 590, ay: 1240, name: 'Trang trí vườn (mua đồ, đặt, dời)', use: () => setEdit(true), arrow: { x: 590, y: 1185, text: 'Trang trí' } });
    // máy làm bánh: lấy nhanh ở cửa hàng
    sobj(m, 830, 1330, (c) => { c.fillStyle = '#6b4423'; c.fillRect(826, 1260, 8, 70); rr(c, 760, 1205, 140, 60, 10, '#fab005'); em(c, '🧁', 790, 1250, 26); txt(c, 'TIỆM BÁNH ➜', 845, 1228, 12, '#5c3a1e'); txt(c, 'BẾN THUYỀN ➜', 845, 1248, 11, '#5c3a1e', 800); }, { l: -80, t: -130, w: 160, h: 134 });
    col(m, 825, 1322, 12, 10);

    /* 🧁 tiệm bánh: mặt tiền + tạp hoá + sổ công thức */
    const BX = 3130, BY = 690;
    sobj(m, BX, BY, (c) => {
      ell(c, BX, BY + 4, 600, 24, 'rgba(0,0,0,.15)');
      rr(c, BX - 570, BY - 220, 1140, 220, 6, '#fff0f6');
      c.fillStyle = 'rgba(230,73,128,.08)'; for (let x = BX - 570; x < BX + 570; x += 40) c.fillRect(x, BY - 220, 20, 220);
      // mái sọc
      for (let k = 0; k < 24; k++) { c.fillStyle = k % 2 ? '#fff' : '#f06595'; c.beginPath(); c.moveTo(BX - 590 + k * 49.2, BY - 222); c.lineTo(BX - 590 + (k + 1) * 49.2, BY - 222); c.lineTo(BX - 590 + (k + 1) * 49.2, BY - 186); c.quadraticCurveTo(BX - 590 + (k + 0.5) * 49.2, BY - 172, BX - 590 + k * 49.2, BY - 186); c.closePath(); c.fill(); }
      c.fillStyle = '#c2255c'; c.fillRect(BX - 590, BY - 250, 1180, 30);
      rr(c, BX - 210, BY - 300, 420, 64, 16, '#c2255c'); rr(c, BX - 200, BY - 292, 400, 48, 12, '#fff0f6');
      txt(c, '🧁 TIỆM BÁNH NGỌT 🍰', BX, BY - 268, 28, '#c2255c');
      // tủ kính
      [[-430, '🥐🍩🧁'], [270, '🎂🥧🍪']].forEach(([dx, items]) => { rr(c, BX + dx, BY - 150, 160, 120, 8, '#ffdeeb'); rr(c, BX + dx + 8, BY - 142, 144, 80, 6, 'rgba(208,235,255,.9)'); em(c, items, BX + dx + 80, BY - 82, 30); rr(c, BX + dx, BY - 54, 160, 10, 3, '#e64980'); });
      // cửa
      rr(c, BX - 70, BY - 160, 140, 160, 8, '#8a5a32'); rr(c, BX - 60, BY - 150, 56, 150, 4, 'rgba(208,235,255,.85)'); rr(c, BX + 4, BY - 150, 56, 150, 4, 'rgba(208,235,255,.85)');
      circ(c, BX - 10, BY - 76, 4, '#fcc419'); circ(c, BX + 10, BY - 76, 4, '#fcc419');
      rr(c, BX - 50, BY - 196, 100, 26, 8, '#fff'); txt(c, 'OPEN 🕘', BX, BY - 183, 13, '#2b8a3e');
      // bảng tạp hoá + sổ công thức
      rr(c, BX - 250, BY - 160, 150, 90, 8, '#2b8a3e'); txt(c, '🧺 TẠP HOÁ', BX - 175, BY - 138, 15, '#fff'); txt(c, 'Đường · bơ · cacao', BX - 175, BY - 114, 10, '#e6fcf5', 800); txt(c, 'Gạo nếp · trứng · sữa', BX - 175, BY - 98, 10, '#e6fcf5', 800);
      rr(c, BX + 100, BY - 160, 150, 90, 8, '#5f3dc4'); txt(c, '📖 CÔNG THỨC', BX + 175, BY - 138, 14, '#fff'); txt(c, '30+ loại bánh', BX + 175, BY - 112, 11, '#e5dbff', 800);
    }, { l: -600, t: -310, w: 1200, h: 320 });
    col(m, BX - 580, BY - 60, 1160, 56);
    inter(m, { x: BX - 255, y: BY - 165, w: 160, h: 165, ax: BX - 175, ay: BY + 40, name: 'Quầy tạp hoá nguyên liệu làm bánh', use: grocery, arrow: { x: BX - 175, y: BY - 180, text: 'Tạp hoá' } });
    inter(m, { x: BX + 95, y: BY - 165, w: 160, h: 165, ax: BX + 175, ay: BY + 40, name: 'Sổ công thức bánh', use: recipeBook });
    inter(m, { x: BX - 75, y: BY - 165, w: 150, h: 165, ax: BX, ay: BY + 40, name: 'Tiệm bánh (mua máy làm bánh)', use: shopMachines, arrow: { x: BX, y: BY - 320, text: 'Mua máy' } });

    /* 8 máy làm bánh */
    MACH_KEYS.forEach((k) => {
      const [x, y] = MPOS[k], M2 = MACH[k];
      const spr = FX.sprite((c) => machineArt(c, x, y, k), x, y, { l: -100, t: -180, w: 200, h: 188 });
      const lot = FX.sprite((c) => { c.fillStyle = '#6b4423'; c.fillRect(x - 3, y - 64, 6, 64); rr(c, x - 70, y - 118, 140, 60, 8, '#f3d9a4'); c.strokeStyle = '#8a5a32'; c.lineWidth = 3; c.beginPath(); c.roundRect(x - 70, y - 118, 140, 60, 8); c.stroke(); em(c, '🛒' + M2.icon, x, y - 86, 20); txt(c, M2.name, x, y - 74, 10, '#5c3a1e'); txt(c, fmt(M2.price) + ' xu', x, y - 62, 10, '#c92a2a'); }, x, y, { l: -80, t: -126, w: 160, h: 134 });
      m.objects.push({ y, bb: [x - 100, y - 180, x + 100, y + 10], draw: (c, t) => {
        if (!owned(k)) return lot(c);
        spr(c);
        const mq = machQ(k);
        if (mq && mq.q.length && mq.q[0].s <= now() && mq.q[0].e > now()) { for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; circ(c, x + 46 + Math.sin(t * 2 + i) * 6, y - 150 - ph * 50, 6 + ph * 8, `rgba(255,255,255,${0.7 - ph * 0.7})`); } }
      } });
      m.colliders.push({ x: x - 70, y: y - 34, w: 140, h: 34, when: () => owned(k) });
      inter(m, { x: x - 80, y: y - 150, w: 160, h: 150, ax: x, ay: y + 36, name: `${M2.icon} ${M2.name}`, use: () => (owned(k) ? (collect(k) ? null : machinePanel(k)) : buyMachine(k)), indicator: () => machInd(k), ix: x, iy: y - 160 });
    });
    sobj(m, 0, m.hz + 18, (c) => { ART.woodFence(c, 0, m.w, m.hz + 2); ART.tulips(c, 0, m.w, m.hz + 18); }, { l: -10, t: -70, w: m.w + 20, h: 74 });
    void aobj; void edges;
    m.spawn = { x: 330, y: 1235 };
    m.bounds = { l: 30, t: 410, r: W - 30, b: Hh - 30 };
    M = m;
    // khung chọn khi đang trang trí
    m.objects.push({ y: 1e6, draw: (c) => drawEditOverlay(c) });
    rebuild();
    return m;
  }
  function machineArt(c, x, y, k) {
    const M2 = MACH[k];
    ell(c, x, y + 2, 82, 14, 'rgba(0,0,0,.18)');
    rr(c, x - 72, y - 108, 144, 108, 12, M2.col);
    c.fillStyle = 'rgba(0,0,0,.07)'; c.fillRect(x - 72, y - 30, 144, 30);
    rr(c, x - 78, y - 122, 156, 20, 8, M2.roof);
    // ống khói / bộ phận riêng
    if (k === 'mill') { circ(c, x + 40, y - 140, 26, '#868e96'); circ(c, x + 40, y - 140, 8, '#495057'); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; c.strokeStyle = '#495057'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 40, y - 140); c.lineTo(x + 40 + Math.cos(a) * 24, y - 140 + Math.sin(a) * 24); c.stroke(); } }
    else if (k === 'bread' || k === 'pie') { rr(c, x + 30, y - 160, 22, 42, 3, k === 'bread' ? '#9c4221' : '#495057'); }
    else if (k === 'cake') { c.strokeStyle = '#e64980'; c.lineWidth = 6; c.beginPath(); c.moveTo(x + 30, y - 120); c.lineTo(x + 30, y - 160); c.lineTo(x - 10, y - 160); c.stroke(); rr(c, x - 22, y - 160, 24, 30, 6, '#f8f9fa'); }
    else if (k === 'viet') { ell(c, x + 34, y - 134, 26, 10, '#868e96'); rr(c, x + 10, y - 150, 48, 16, 4, '#adb5bd'); ell(c, x + 34, y - 152, 24, 8, '#ced4da'); }
    else if (k === 'donut') { ell(c, x + 34, y - 130, 26, 9, '#495057'); ell(c, x + 34, y - 132, 20, 6, '#e8b923'); }
    else if (k === 'waffle') { rr(c, x + 6, y - 150, 56, 28, 6, '#495057'); c.strokeStyle = '#adb5bd'; c.lineWidth = 1; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(x + 10 + i * 11, y - 148); c.lineTo(x + 10 + i * 11, y - 124); c.stroke(); } }
    else if (k === 'cookie') { rr(c, x - 60, y - 140, 120, 16, 6, '#495057'); for (let i = 0; i < 5; i++) circ(c, x - 46 + i * 23, y - 140, 6, '#c99a5b'); }
    // cửa kính + biểu tượng
    rr(c, x - 54, y - 92, 76, 56, 8, 'rgba(255,255,255,.85)');
    em(c, M2.icon, x - 16, y - 46, 38);
    // bảng điều khiển
    rr(c, x + 30, y - 92, 32, 56, 6, '#343a40'); circ(c, x + 46, y - 78, 6, '#69db7c'); circ(c, x + 46, y - 60, 5, '#ff6b6b'); rr(c, x + 36, y - 50, 20, 8, 2, '#74c0fc');
    rr(c, x - 66, y - 24, 132, 18, 6, 'rgba(255,255,255,.9)'); txt(c, M2.name.toUpperCase(), x, y - 15, 10, '#343a40');
  }
  function shopMachines() {
    const p = UI.panel('🧁 Máy làm bánh', '', { wide: true });
    const render = () => {
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu</div><div class="shop-list">${MACH_KEYS.map((k) => { const M2 = MACH[k]; return `<div class="shop-row"><span class="ic">${M2.icon}</span><div class="info"><b>${M2.name}</b><small>${M2.recipes.map((r) => `${r.ic} ${r.name}`).join(' · ')}</small></div>${owned(k) ? `<button class="btn small" data-open="${k}">Mở</button>` : `<button class="btn small" data-buy="${k}">${fmt(M2.price)} xu</button>`}</div>`; }).join('')}</div>`;
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { p.close(); buyMachine(b.dataset.buy); });
      p.body.querySelectorAll('[data-open]').forEach((b) => b.onclick = () => { p.close(); machinePanel(b.dataset.open); });
    };
    render();
  }

  /* ================= 🌱 vườn ươm ================= */
  function nursery() {
    const p = UI.panel('🌱 Vườn ươm cây ăn quả', '', { wide: true });
    const render = () => {
      const g = G();
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu · 🌳 Đang trồng ${g.trees.length} cây</div>
        <p class="muted">Mua cây giống rồi bấm <b>🌱 Trồng</b> và <b>chạm vào chỗ muốn trồng</b> trong vườn. Cây lớn dần thành cây to, sau đó cứ chín là hái — không cần trồng lại. 💧 Tưới nước: lớn nhanh ×1.5 trong 30 phút.</p>
        <div class="shop-list">${Object.entries(TREES).map(([k, T]) => `<div class="shop-row"><span class="ic">${icon(T.fruit)}</span><div class="info"><b>${T.name}</b><small>Lớn ${dur(T.grow * 60e3)} · ra ${T.yield} ${icon(T.fruit)} mỗi ${dur(T.cycle * 60e3)} · ${fmt(DATA.ITEMS[T.fruit].sell)} xu/quả</small>${g.saps[k] ? `<small>🌱 Đang có <b>${g.saps[k]}</b> cây giống</small>` : ''}</div><button class="btn small ghost" data-buy="${k}">${fmt(T.price)} xu</button>${g.saps[k] ? `<button class="btn small" data-plant="${k}">🌱 Trồng</button>` : ''}</div>`).join('')}</div>`;
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { const T = TREES[b.dataset.buy]; if (!AV.spend(T.price)) return; G().saps[b.dataset.buy] = (G().saps[b.dataset.buy] || 0) + 1; changed(); UI.toast(`🌱 Mua 1 cây giống ${T.name.toLowerCase()} — bấm 🌱 Trồng rồi chạm vào chỗ muốn trồng`); render(); });
      p.body.querySelectorAll('[data-plant]').forEach((b) => b.onclick = () => { p.close(); setEdit(true, 'tree:' + b.dataset.plant); });
    };
    render();
  }
  function decoShop() {
    const p = UI.panel('🎨 Cửa hàng đồ trang trí vườn', '', { wide: true });
    const render = () => {
      const g = G();
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu</div><div class="gd-shop">${DECO_ORDER.map((k) => { const D = DECO[k], n = g.inv[k] || 0, placed = g.deco.filter((d) => d.k === k).length; return `<div class="gd-it"><canvas data-pv="${k}" width="120" height="100"></canvas><b>${D.name}</b><small>${placed ? `Đã đặt ${placed}` : ''}${n ? ` · kho ${n}` : ''}</small><button class="btn small" data-buy="${k}">${fmt(D.price)} xu</button></div>`; }).join('')}</div>`;
      p.body.querySelectorAll('[data-pv]').forEach((cv) => { const D = DECO[cv.dataset.pv], cc = cv.getContext('2d'), sc = Math.min(1, 100 / D.box.w, 90 / D.box.h); cc.save(); cc.translate(60, 96); cc.scale(sc, sc); cc.translate(-(D.box.l + D.box.w / 2), -(D.box.t + D.box.h)); try { D.draw(cc, 0, 0, 0.6); } catch (e) { /* bỏ qua */ } cc.restore(); });
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { const k = b.dataset.buy; if (!AV.spend(DECO[k].price)) return; G().inv[k] = (G().inv[k] || 0) + 1; changed(); ED.hand = k; ED.sel = null; renderBar(); UI.toast(`🎨 Đã mua ${DECO[k].name} — chạm lên vườn để đặt`, 3000); render(); });
    };
    render();
  }

  /* ================= 🎨 chế độ trang trí ================= */
  const ED = { on: false, hand: null, sel: null, moving: false };
  const btn = document.createElement('button');
  btn.className = 'arrange-btn gd-toggle'; btn.textContent = '🎨 Trang trí vườn'; btn.style.display = 'none';
  btn.onclick = () => setEdit(!ED.on);
  const bar = document.createElement('div'); bar.className = 'gd-bar';
  if (document.body) { document.body.appendChild(btn); document.body.appendChild(bar); }
  else document.addEventListener('DOMContentLoaded', () => { document.body.appendChild(btn); document.body.appendChild(bar); });
  function setEdit(on, hand) {
    if (on && AV.currentMap && AV.currentMap() !== 'garden') return;
    ED.on = !!on; ED.hand = on ? (hand || null) : null; ED.sel = null; ED.moving = false;
    btn.classList.toggle('on', ED.on); btn.textContent = ED.on ? '✅ Xong trang trí' : '🎨 Trang trí vườn';
    bar.classList.toggle('show', ED.on);
    if (ED.on && AV.player) { AV.player.target = null; AV.player.path = []; AV.player.pending = null; }
    renderBar();
  }
  const itemName = (it) => (it.type === 'tree' ? TREES[it.o.k].name : DECO[it.o.k].name);
  function renderBar() {
    if (!ED.on) { bar.innerHTML = ''; return; }
    const g = G();
    const handName = ED.hand ? (ED.hand.startsWith('tree:') ? `🌱 ${TREES[ED.hand.slice(5)].name}` : `${DECO[ED.hand].icon} ${DECO[ED.hand].name}`) : null;
    const tip = ED.moving ? '✋ Chạm vào chỗ mới để dời tới' : handName ? `Chạm lên bãi cỏ để đặt <b>${handName}</b>` : ED.sel ? `Đã chọn <b>${itemName(ED.sel)}</b>` : 'Chọn đồ bên dưới rồi chạm lên vườn để đặt · chạm vào đồ đã đặt để dời / lật / cất';
    const chips = [
      ...Object.entries(g.saps).filter(([, n]) => n > 0).map(([k, n]) => `<button class="gd-chip ${ED.hand === 'tree:' + k ? 'on' : ''}" data-h="tree:${k}"><span>${icon(TREES[k].fruit)}</span><small>🌱${n}</small></button>`),
      ...DECO_ORDER.filter((k) => (g.inv[k] || 0) > 0).map((k) => `<button class="gd-chip ${ED.hand === k ? 'on' : ''}" data-h="${k}"><span>${DECO[k].icon}</span><small>×${g.inv[k]}</small></button>`),
    ];
    bar.innerHTML = `<div class="gd-tip">🎨 ${tip}</div>
      ${ED.sel ? `<div class="gd-acts"><button data-a="move">✋ Dời chỗ</button>${ED.sel.type === 'deco' ? '<button data-a="flip">↔ Lật</button><button data-a="store">📦 Cất kho</button>' : '<button data-a="cut">🪓 Chặt bỏ</button>'}<button data-a="none">✖ Bỏ chọn</button></div>` : ''}
      <div class="gd-chips">${chips.join('') || '<span class="gd-empty">Kho trống — bấm 🛒 Mua đồ</span>'}</div>
      <div class="gd-acts"><button data-a="shop">🛒 Mua đồ</button><button data-a="nursery">🌱 Cây giống</button><button data-a="ok" class="ok">✅ Xong</button></div>`;
    bar.querySelectorAll('[data-h]').forEach((b) => b.onclick = () => { ED.hand = ED.hand === b.dataset.h ? null : b.dataset.h; ED.sel = null; ED.moving = false; renderBar(); });
    bar.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => {
      const a = b.dataset.a, s = ED.sel;
      if (a === 'ok') return setEdit(false);
      if (a === 'shop') return decoShop();
      if (a === 'nursery') return nursery();
      if (a === 'none') { ED.sel = null; ED.moving = false; return renderBar(); }
      if (!s) return;
      if (a === 'move') { ED.moving = true; return renderBar(); }
      if (a === 'flip') { s.o.f = s.o.f ? 0 : 1; changed(); rebuild(); return renderBar(); }
      if (a === 'store') { const g2 = G(); g2.deco.splice(g2.deco.indexOf(s.o), 1); g2.inv[s.o.k] = (g2.inv[s.o.k] || 0) + 1; ED.sel = null; changed(); rebuild(); return renderBar(); }
      if (a === 'cut') UI.confirm(`Chặt bỏ <b>${TREES[s.o.k].name}</b>? Cây sẽ mất luôn (không hoàn tiền).`, '🪓 Chặt', () => { const g2 = G(); g2.trees.splice(g2.trees.indexOf(s.o), 1); ED.sel = null; changed(); rebuild(); renderBar(); });
    });
  }
  const itemBB = (it) => {
    if (it.type === 'tree') { const s = tstate(it.o).scale; return [it.o.x - 95, it.o.y - 70 - 260 * s, it.o.x + 95, it.o.y + 12]; }
    const b = DECO[it.o.k].box; return [it.o.x + b.l, it.o.y + b.t, it.o.x + b.l + b.w, it.o.y + b.t + b.h];
  };
  function pick(w) {
    const g = G(), all = [...g.trees.map((o) => ({ type: 'tree', o })), ...g.deco.map((o) => ({ type: 'deco', o }))];
    let best = null;
    all.forEach((it) => { const b = itemBB(it); if (w.x >= b[0] && w.x <= b[2] && w.y >= b[1] && w.y <= b[3]) { const sy = it.type === 'deco' && DECO[it.o.k].flat ? -1 : it.o.y; if (!best || sy > best.sy) best = { ...it, sy }; } });
    return best;
  }
  /** chỗ đặt có hợp lệ không (trong vườn, không đè cây / đồ có vật cản, không đè người) */
  function canPlace(kind, x, y, ignore) {
    if (x < YARD.l || x > YARD.r || y < YARD.t + 20 || y > YARD.b) return 'Chỉ đặt được trong khu vườn (bãi cỏ phía trên lối đi)';
    const g = G(), isTree = kind.startsWith('tree:'), solid = isTree || !!(DECO[kind] && (DECO[kind].col || DECO[kind].colR));
    if (AV.player && Math.hypot(AV.player.x - x, AV.player.y - y) < 36 && solid) return 'Bạn đang đứng ở đó — lùi ra một chút nhé';
    for (const t of g.trees) { if (t === ignore) continue; const d = Math.hypot(t.x - x, (t.y - y) * 1.6); if (d < (isTree ? 150 : solid ? 50 : 30)) return isTree ? 'Gần cây khác quá — cây to cần chỗ rộng' : 'Đè lên gốc cây mất rồi'; }
    if (solid) for (const d of g.deco) { if (d === ignore) continue; const D = DECO[d.k]; if (!(D.col || D.colR)) continue; if (Math.abs(d.x - x) < ((D.col ? D.col[0] : D.colR[2]) / 2 + 24) && Math.abs(d.y - y) < 26) return 'Đè lên đồ khác rồi'; }
    if (isTree && g.trees.length >= 40) return 'Vườn đã có 40 cây — chặt bớt để trồng thêm';
    if (!isTree && g.deco.length >= 250) return 'Vườn đã đặt quá nhiều đồ rồi';
    return null;
  }
  function tap(w) {
    if (!ED.on || !AV.currentMap || AV.currentMap() !== 'garden') return false;
    const g = G();
    const x = Math.round(w.x / 5) * 5, y = Math.round(w.y / 5) * 5;
    if (ED.moving && ED.sel) {
      const s = ED.sel, err = canPlace(s.type === 'tree' ? 'tree:' + s.o.k : s.o.k, x, y, s.o);
      if (err) { UI.toast('🚫 ' + err); return true; }
      s.o.x = x; s.o.y = y; ED.moving = false; changed(); rebuild(); renderBar(); return true;
    }
    if (ED.hand) {
      const err = canPlace(ED.hand, x, y);
      if (err) { UI.toast('🚫 ' + err); return true; }
      if (ED.hand.startsWith('tree:')) {
        const k = ED.hand.slice(5);
        if (!(g.saps[k] > 0)) { ED.hand = null; renderBar(); return true; }
        g.saps[k]--; g.trees.push({ id: g.seq++, k, x, y, g: 0, u: now(), wet: now() + 30 * 60e3 });
        AV.floatText(`🌱 Trồng ${TREES[k].name.toLowerCase()}!`, x, y - 60, '#8ce99a'); AV.earn(0, 5);
        if (!(g.saps[k] > 0)) ED.hand = null;
      } else {
        if (!(g.inv[ED.hand] > 0)) { ED.hand = null; renderBar(); return true; }
        g.inv[ED.hand]--; g.deco.push({ k: ED.hand, x, y, f: 0 });
        if (!(g.inv[ED.hand] > 0)) ED.hand = null;
      }
      changed(); rebuild(); renderBar(); return true;
    }
    ED.sel = pick(w); ED.moving = false; renderBar();
    return true;
  }
  function drawEditOverlay(c) {
    if (!ED.on) return;
    c.save();
    c.setLineDash([10, 8]); c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3;
    c.strokeRect(YARD.l, YARD.t + 20, YARD.r - YARD.l, YARD.b - YARD.t - 20);
    const g = G();
    [...g.trees.map((o) => ({ type: 'tree', o })), ...g.deco.map((o) => ({ type: 'deco', o }))].forEach((it) => {
      const b = itemBB(it), sel = ED.sel && ED.sel.o === it.o;
      c.setLineDash(sel ? [] : [6, 6]); c.lineWidth = sel ? 4 : 1.5; c.strokeStyle = sel ? '#ffd43b' : 'rgba(255,255,255,.55)';
      c.strokeRect(b[0], b[1], b[2] - b[0], b[3] - b[1]);
      if (sel) { c.fillStyle = 'rgba(255,212,59,.12)'; c.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); }
    });
    c.restore();
  }

  /* ================= vòng lặp nền ================= */
  let wasHere = false;
  /** lần đầu ghé vườn: tặng quà tân gia để thử trồng cây + trang trí ngay */
  function welcome() {
    const g = G();
    if (g.welcomed) return;
    g.welcomed = 1;
    g.saps.orange = (g.saps.orange || 0) + 1; g.saps.apple = (g.saps.apple || 0) + 1;
    [['fence_wood', 4], ['flowers_r', 2], ['flowers_y', 2], ['bench', 1], ['lamp', 1], ['stones', 3]].forEach(([k, n]) => { g.inv[k] = (g.inv[k] || 0) + n; });
    changed();
    UI.toast('🎁 Quà tân gia: 2 cây giống (🍊 cam, 🍎 táo) + hàng rào, bụi hoa, ghế, đèn, đá lát! Bấm 🎨 Trang trí vườn để trồng & bày biện', 8000);
  }
  function tick() {
    const here = AV.currentMap && AV.currentMap() === 'garden';
    if (here !== wasHere) { wasHere = here; btn.style.display = here && !(AV.visiting && AV.visiting()) ? 'block' : 'none'; if (!here && ED.on) setEdit(false); if (here) welcome(); }
    if (M && G() !== lastRef) rebuild();
    // cây lớn lên → chỗ bấm to dần: cập nhật lại mỗi 10 giây khi đang ở vườn
    if (here && !ED.on && (tick.n = (tick.n || 0) + 1) % 20 === 0) rebuild();
  }
  function init() {
    setInterval(tick, 500);
    setInterval(staffWork, 15000);
    // bánh ăn được → hồi năng lượng
    const base = AV.edibleEnergy;
    if (base && !base._gd) {
      AV.edibleEnergy = (id) => { const e = base(id); if (e) return e; if (BAKED.has(id)) return Math.min(60, Math.max(12, Math.round(DATA.ITEMS[id].sell / 7))); if (['pear', 'cherry', 'coconut'].includes(id)) return Math.min(25, Math.max(6, Math.round(DATA.ITEMS[id].sell * 0.4))); return 0; };
      AV.edibleEnergy._gd = 1;
    }
    if (!document.getElementById('gd-css')) {
      const st = document.createElement('style'); st.id = 'gd-css';
      st.textContent = `.gd-toggle{bottom:136px}
.gd-bar{position:fixed;left:50%;bottom:74px;transform:translateX(-50%);z-index:7;display:none;flex-direction:column;gap:6px;background:rgba(27,47,72,.94);color:#fff;padding:8px 10px;border-radius:14px;border:3px solid #fff;width:min(640px,calc(100% - 20px));font-weight:800;font-size:13px}
.gd-bar.show{display:flex}
.gd-tip{text-align:center;line-height:1.3}
.gd-acts{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.gd-acts button{border:0;border-radius:10px;padding:6px 10px;font:inherit;font-weight:900;cursor:pointer;background:#fff;color:#1b2f48}
.gd-acts button.ok{background:#69db7c}
.gd-chips{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 4px;scrollbar-width:thin}
.gd-chip{flex:none;display:flex;flex-direction:column;align-items:center;border:2px solid rgba(255,255,255,.5);border-radius:10px;background:rgba(255,255,255,.1);color:#fff;padding:3px 8px;cursor:pointer;font:inherit}
.gd-chip span{font-size:22px;line-height:1.1}.gd-chip small{font-size:11px}
.gd-chip.on{background:#ffd43b;color:#1b2f48;border-color:#fff}
.gd-empty{opacity:.75;padding:6px}
.gd-shop{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}
.gd-it{display:flex;flex-direction:column;align-items:center;gap:3px;border:1px solid var(--line,#ddd);border-radius:12px;padding:6px;text-align:center;background:rgba(255,255,255,.6)}
.gd-it canvas{width:120px;height:100px}.gd-it b{font-size:13px}.gd-it small{font-size:11px;min-height:14px;opacity:.75}
.gd-queue{display:flex;gap:6px;flex-wrap:wrap}
.gd-job{position:relative;width:64px;height:64px;border-radius:12px;background:#f1f3f5;border:2px solid #ced4da;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden}
.gd-job span{font-size:26px;z-index:1}.gd-job small{font-size:10px;font-weight:800;z-index:1}
.gd-job i{position:absolute;left:0;bottom:0;height:100%;background:rgba(105,219,124,.35)}
.gd-job.ok{border-color:#2f9e44;background:#d3f9d8}.gd-job.empty{opacity:.5;border-style:dashed}
.gd-miss{color:#e03131;font-weight:800}
.shop-row .ic sup{font-size:13px;margin-left:-6px}`;
      document.head.appendChild(st);
    }
  }
  /** món đồ trang trí mua ở nơi khác (vd. Chợ hoa) bỏ vào kho đồ vườn */
  function addDeco(k, n = 1) { if (!DECO[k]) return false; const g = G(); g.inv[k] = (g.inv[k] || 0) + n; changed(); return true; }
  return { init, buildMap, tap, setEdit, nursery, dockPanel, decoShop, staffPanel, addDeco, TREES, DECO, MACH };
})();
