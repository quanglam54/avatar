/* ☁️ Đảo Trên Trời: bay lên bằng khinh khí cầu, Bến Mây, Vườn Mây Kẹo Bông (cây phát sáng, mây nhún),
   thác nước chảy ngược, câu cá trên mây, Đài Thiên Văn (sao băng ban đêm → ước nhận quà), tiệm đồ trời mây */
const SKY = (() => {
  const W = 3000, H = 1250;
  const TREES = [[2260, 640], [2450, 600], [2640, 650], [2350, 790], [2560, 800]];
  const FRUIT_MIN = 8;
  const FALLS = { x: 2020, top: 470, bottom: 1010 };
  const LAKE = { x: 680, y: 965, rx: 230, ry: 105 };
  const STAR_PERIOD = 150, STAR_WIN = 25;
  const night = () => (AV.nightFactor ? AV.nightFactor() : 0);
  const st = () => { const S = AV.S; S.sky = S.sky || { trees: {}, wish: -1, falls: 0 }; S.sky.trees = S.sky.trees || {}; return S.sky; };

  /* ---------- Nền: trời, mây, hòn đảo nổi ---------- */
  function puff(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  function paintGround(g) {
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#5fb4f2'); sky.addColorStop(0.55, '#a8dcff'); sky.addColorStop(1, '#dff3ff');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    // mây xa
    for (let i = 0; i < 26; i++) {
      const x = (i * 431) % W, y = 40 + ((i * 97) % 260), r = 30 + (i % 4) * 14;
      g.globalAlpha = 0.75; puff(g, x, y, r, '#fff'); puff(g, x + r, y + 6, r * 0.8, '#fff'); puff(g, x - r, y + 8, r * 0.7, '#fff'); g.globalAlpha = 1;
    }
    // bóng hòn đảo (phần đá treo lơ lửng bên dưới)
    g.fillStyle = '#8b6a4e';
    g.beginPath(); g.moveTo(140, 1090); g.quadraticCurveTo(W / 2, 1420, W - 140, 1090); g.closePath(); g.fill();
    g.fillStyle = '#6e523c';
    g.beginPath(); g.moveTo(500, 1110); g.quadraticCurveTo(W / 2, 1330, W - 500, 1110); g.closePath(); g.fill();
    // mặt đảo: cỏ pastel, viền mây bồng bềnh
    g.fillStyle = '#9fe08a'; g.beginPath(); g.roundRect(120, 360, W - 240, 760, 160); g.fill();
    const gg = g.createLinearGradient(0, 360, 0, 1120); gg.addColorStop(0, '#b6f0a0'); gg.addColorStop(1, '#86d37a');
    g.fillStyle = gg; g.beginPath(); g.roundRect(150, 380, W - 300, 720, 140); g.fill();
    for (let i = 0; i < 260; i++) { g.fillStyle = i % 3 ? 'rgba(255,255,255,.25)' : 'rgba(60,140,60,.18)'; g.fillRect(170 + ((i * 263) % (W - 340)), 400 + ((i * 131) % 680), 3, 6); }
    for (let x = 120; x <= W - 120; x += 70) { puff(g, x, 1105 + Math.sin(x) * 6, 46, '#fff'); puff(g, x + 30, 372 + Math.cos(x) * 5, 30, 'rgba(255,255,255,.9)'); }
    for (let y = 400; y <= 1080; y += 70) { puff(g, 128, y, 40, '#fff'); puff(g, W - 128, y, 40, '#fff'); }
    // lối đi mây trắng nối các khu
    g.fillStyle = 'rgba(255,255,255,.75)';
    g.beginPath(); g.roundRect(380, 760, W - 760, 70, 35); g.fill();
    g.beginPath(); g.roundRect(1440, 470, 120, 360, 50); g.fill();
    // hồ "khoảng trời bên dưới": nhìn xuống thấy thành phố nhỏ xíu
    g.save(); g.beginPath(); g.ellipse(LAKE.x, LAKE.y, LAKE.rx, LAKE.ry, 0, 0, Math.PI * 2); g.clip();
    const lg = g.createLinearGradient(0, LAKE.y - LAKE.ry, 0, LAKE.y + LAKE.ry); lg.addColorStop(0, '#9fd6ff'); lg.addColorStop(1, '#4e93d8');
    g.fillStyle = lg; g.fillRect(LAKE.x - LAKE.rx, LAKE.y - LAKE.ry, LAKE.rx * 2, LAKE.ry * 2);
    for (let i = 0; i < 18; i++) { const bx = LAKE.x - 170 + i * 20, bh = 10 + ((i * 7) % 24); g.fillStyle = i % 2 ? '#7aa7cf' : '#6893bd'; g.fillRect(bx, LAKE.y + 50 - bh, 14, bh); }
    g.fillStyle = 'rgba(255,255,255,.85)'; [[-120, -40], [60, -55], [150, 10]].forEach(([dx, dy]) => { puff(g, LAKE.x + dx, LAKE.y + dy, 18, '#fff'); puff(g, LAKE.x + dx + 18, LAKE.y + dy + 4, 13, '#fff'); });
    g.restore();
    g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.ellipse(LAKE.x, LAKE.y, LAKE.rx, LAKE.ry, 0, 0, Math.PI * 2); g.stroke();
    // hồ dưới chân thác
    g.fillStyle = '#7fd3ff'; g.beginPath(); g.ellipse(FALLS.x, FALLS.bottom, 120, 40, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#e7f8ff'; g.lineWidth = 6; g.stroke();
  }

  /* ---------- Vật trên đảo ---------- */
  /** Khinh khí cầu (bập bềnh) */
  function balloon(c, x, y, t) {
    const bob = Math.sin(t * 1.6) * 6;
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x, y + 2, 60, 12, 0, 0, Math.PI * 2); c.fill();
    const by = y - 30 + bob;
    c.strokeStyle = '#7a4a26'; c.lineWidth = 3;
    [[-34, -26], [34, 26], [-12, -8], [12, 8]].forEach(([a, b]) => { c.beginPath(); c.moveTo(x + a, by - 150); c.lineTo(x + b, by - 34); c.stroke(); });
    // giỏ mây tre
    c.fillStyle = '#b5793c'; c.beginPath(); c.roundRect(x - 34, by - 40, 68, 44, 8); c.fill();
    c.strokeStyle = '#8a5527'; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x - 34, by - 32 + k * 10); c.lineTo(x + 34, by - 32 + k * 10); c.stroke(); }
    c.fillStyle = '#7a4a26'; c.fillRect(x - 38, by - 44, 76, 8);
    // bóng khí sọc màu
    const cols = ['#ff6b6b', '#ffd43b', '#4dabf7', '#ff8fb1', '#69db7c'];
    c.save(); c.beginPath(); c.ellipse(x, by - 210, 92, 108, 0, 0, Math.PI * 2); c.clip();
    for (let k = 0; k < 6; k++) { c.fillStyle = cols[k % cols.length]; c.fillRect(x - 92 + k * 31, by - 320, 31, 230); }
    c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.ellipse(x - 34, by - 250, 26, 50, -0.3, 0, Math.PI * 2); c.fill();
    c.restore();
    c.fillStyle = '#e8590c'; c.beginPath(); c.moveTo(x - 40, by - 116); c.quadraticCurveTo(x, by - 92, x + 40, by - 116); c.lineTo(x + 26, by - 150); c.lineTo(x - 26, by - 150); c.closePath(); c.fill();
    c.fillStyle = '#ffd43b'; c.beginPath(); c.arc(x, by - 296, 9, 0, Math.PI * 2); c.fill();
  }
  function observatory(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x, y + 4, 130, 18, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e9ecef'; c.fillRect(x - 100, y - 190, 200, 190);
    c.fillStyle = '#ced4da'; for (let k = 0; k < 5; k++) c.fillRect(x - 100, y - 190 + k * 38, 200, 3);
    c.fillStyle = '#4c6ef5'; c.beginPath(); c.arc(x, y - 190, 104, Math.PI, 0); c.fill();
    c.fillStyle = '#364fc7'; c.fillRect(x - 14, y - 292, 28, 100);
    c.save(); c.translate(x + 10, y - 270); c.rotate(-0.6); c.fillStyle = '#adb5bd'; c.fillRect(-10, -70, 20, 80); c.fillStyle = '#495057'; c.fillRect(-12, -76, 24, 12); c.restore();
    c.fillStyle = '#ffd43b'; [[-60, -250], [55, -235], [-20, -280]].forEach(([dx, dy]) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3 : 8; c.lineTo(x + dx + Math.cos(a) * r, y + dy + Math.sin(a) * r); } c.fill(); });
    c.fillStyle = '#1c2f6b'; c.beginPath(); c.roundRect(x - 34, y - 90, 68, 90, [30, 30, 0, 0]); c.fill();
    c.fillStyle = '#ffd43b'; c.font = '900 18px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🔭', x, y - 52);
    c.fillStyle = '#364fc7'; c.beginPath(); c.roundRect(x - 92, y - 170, 184, 34, 8); c.fill();
    c.fillStyle = '#fff'; c.font = '900 17px "Be Vietnam Pro", system-ui'; c.fillText('ĐÀI THIÊN VĂN', x, y - 153);
  }
  function shop(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x, y + 4, 110, 16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f3f0ff'; c.beginPath(); c.roundRect(x - 95, y - 120, 190, 120, 14); c.fill();
    [[-80, -130, 36], [-30, -150, 46], [30, -150, 46], [80, -130, 36], [0, -170, 40]].forEach(([dx, dy, r]) => puff(c, x + dx, y + dy, r, '#fff'));
    c.fillStyle = '#b197fc'; c.beginPath(); c.roundRect(x - 80, y - 150, 160, 32, 10); c.fill();
    c.fillStyle = '#fff'; c.font = '900 16px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ĐỒ TRỜI MÂY', x, y - 134);
    c.fillStyle = '#d0bfff'; c.fillRect(x - 70, y - 100, 140, 70);
    c.font = '28px system-ui'; c.fillText('🪽', x - 42, y - 64); c.fillText('😇', x, y - 64); c.fillText('🌌', x + 42, y - 64);
    c.fillStyle = '#7048e8'; c.fillRect(x - 95, y - 26, 190, 26);
  }
  function board(c, x, y) {
    c.fillStyle = '#c8874a'; c.fillRect(x - 54, y - 110, 8, 110); c.fillRect(x + 46, y - 110, 8, 110);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - 70, y - 150, 140, 90, 12); c.fill();
    c.strokeStyle = '#74c0fc'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#1971c2'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('☁️ BẾN MÂY', x, y - 132); c.font = '700 11px "Be Vietnam Pro", system-ui'; c.fillStyle = '#495057';
    c.fillText('🌠 Đêm có sao băng', x, y - 110); c.fillText('🎣 Câu cá trên mây', x, y - 94); c.fillText('🌊 Thác chảy ngược', x, y - 78);
  }
  function glowTree(c, x, y, t, ripe) {
    c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(x, y + 2, 40, 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#c9a0dc'; c.fillRect(x - 7, y - 70, 14, 72);
    [[0, -110, 48], [-38, -88, 34], [38, -88, 34], [-20, -138, 30], [22, -136, 30]].forEach(([dx, dy, r], k) => puff(c, x + dx, y + dy, r, k % 2 ? '#ffc9f0' : '#e5b8ff'));
    if (ripe) [[-30, -100], [10, -120], [30, -90], [-8, -80], [-18, -130]].forEach(([dx, dy], k) => {
      const gl = 0.6 + 0.4 * Math.sin(t * 4 + k);
      c.fillStyle = `rgba(255,236,120,${0.35 * gl})`; c.beginPath(); c.arc(x + dx, y + dy, 13, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffe066'; c.beginPath(); c.arc(x + dx, y + dy, 6.5, 0, Math.PI * 2); c.fill();
    });
  }
  function bounceCloud(c, x, y, t) {
    const sq = 1 + Math.sin(t * 3) * 0.04;
    c.save(); c.translate(x, y); c.scale(1 / sq, sq);
    c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.ellipse(0, 6, 70, 14, 0, 0, Math.PI * 2); c.fill();
    [[-40, -20, 30], [0, -34, 40], [40, -20, 30], [-18, -12, 28], [20, -12, 28]].forEach(([dx, dy, r]) => puff(c, dx, dy, r, '#fff'));
    c.fillStyle = '#ff8fb1'; c.beginPath(); c.arc(-14, -26, 3, 0, Math.PI * 2); c.arc(14, -26, 3, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  /** Thác nước chảy NGƯỢC lên trời */
  function waterfall(c, t) {
    const { x, top, bottom } = FALLS;
    c.fillStyle = '#8b6a4e'; c.beginPath(); c.roundRect(x - 90, top - 40, 180, 60, 26); c.fill();
    [[-70, top - 40, 30], [0, top - 56, 40], [70, top - 40, 30]].forEach(([dx, dy, r]) => puff(c, x + dx, dy, r, '#fff'));
    const g = c.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, 'rgba(160,225,255,.95)'); g.addColorStop(1, 'rgba(90,190,250,.95)');
    c.fillStyle = g; c.fillRect(x - 50, top, 100, bottom - top - 20);
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3;
    for (let k = 0; k < 7; k++) { const off = ((t * 140 + k * 70) % (bottom - top)); const yy = bottom - 20 - off; c.beginPath(); c.moveTo(x - 40 + k * 13, yy); c.lineTo(x - 40 + k * 13, yy - 26); c.stroke(); }
    for (let k = 0; k < 6; k++) { const ph = (t * 0.8 + k / 6) % 1; puff(c, x - 50 + ((k * 37) % 100), top - ph * 90, 6 * (1 - ph), `rgba(255,255,255,${1 - ph})`); }
    c.fillStyle = '#1971c2'; c.font = '900 15px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.fillText('⬆ THÁC CHẢY NGƯỢC ⬆', x, bottom + 52);
  }

  /* ---------- Bầu trời động: cầu vồng khi mưa, cá voi ánh sáng + sao băng ban đêm ---------- */
  function starEvent() { const s = Date.now() / 1000; const id = Math.floor(s / STAR_PERIOD); return { id, active: night() > 0.5 && s - id * STAR_PERIOD < STAR_WIN, into: s - id * STAR_PERIOD }; }
  function skyFx(c, t) {
    const n = night();
    if (AV.rainLevel && AV.rainLevel() > 0.05) {
      ['#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'].forEach((col, k) => { c.strokeStyle = col; c.globalAlpha = 0.45; c.lineWidth = 14; c.beginPath(); c.arc(1500, 900, 1000 - k * 14, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); });
      c.globalAlpha = 1;
    }
    if (n > 0.5) {
      // cá voi ánh sáng bơi ngang trời
      const wx = ((t * 40) % (W + 600)) - 300, wy = 160 + Math.sin(t * 0.5) * 30;
      c.fillStyle = 'rgba(150,220,255,.55)'; c.beginPath(); c.ellipse(wx, wy, 120, 46, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(wx - 110, wy); c.lineTo(wx - 180, wy - 40 + Math.sin(t * 3) * 10); c.lineTo(wx - 170, wy + 30); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(wx + 70, wy - 10, 5, 0, Math.PI * 2); c.fill();
      for (let k = 0; k < 8; k++) { c.fillStyle = `rgba(255,255,200,${0.4 + 0.4 * Math.sin(t * 3 + k)})`; c.beginPath(); c.arc(wx - 60 + k * 18, wy + 10, 3, 0, Math.PI * 2); c.fill(); }
      // đom đóm sao
      for (let k = 0; k < 24; k++) { const fx = (k * 137) % W, fy = 420 + ((k * 71 + t * 20) % 680); c.fillStyle = `rgba(255,240,150,${0.5 + 0.5 * Math.sin(t * 2 + k)})`; c.beginPath(); c.arc(fx + Math.sin(t + k) * 20, fy, 3, 0, Math.PI * 2); c.fill(); }
      const ev = starEvent();
      if (ev.active) for (let k = 0; k < 4; k++) {
        const ph = ((t * 0.7 + k * 0.27) % 1), sx = 400 + k * 600 + ph * 500, sy = 40 + ph * 260;
        const g = c.createLinearGradient(sx - 160, sy - 90, sx, sy); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,250,200,.95)');
        c.strokeStyle = g; c.lineWidth = 4; c.beginPath(); c.moveTo(sx - 160, sy - 90); c.lineTo(sx, sy); c.stroke();
        puff(c, sx, sy, 5, '#fff9db');
      }
    }
  }

  /* ---------- Hoạt động ---------- */
  function treeState(i) { const at = st().trees[i] || 0, left = at + FRUIT_MIN * 60000 - Date.now(); return { ripe: left <= 0, left }; }
  function pickTree(i) {
    const s = treeState(i);
    if (!s.ripe) return UI.toast(`✨ Quả sao chưa chín, quay lại sau ${Math.ceil(s.left / 60000)} phút nhé`);
    const n = 2 + Math.floor(Math.random() * 2);
    st().trees[i] = Date.now();
    AV.addItemPublic('sky_fruit', n);
    UI.toast(`✨ Hái được ${n} Quả Sao Phát Sáng!`);
    AV.markChanged();
  }
  /** Ngồi phao trôi ngược lên đỉnh thác rồi trượt xuống */
  let riding = false;
  function rideFalls() {
    const P = AV.player;
    if (riding || !P) return;
    riding = true;
    const path = [[FALLS.x, FALLS.bottom + 30, 0], [FALLS.x, FALLS.top + 60, 2600], [FALLS.x + 70, FALLS.top + 80, 3000], [FALLS.x + 150, FALLS.bottom + 40, 3800]];
    const t0 = performance.now();
    UI.toast('🛟 Ngồi phao trôi NGƯỢC lên đỉnh thác…');
    const step = () => {
      const e = performance.now() - t0;
      let k = 1; while (k < path.length - 1 && e > path[k][2]) k++;
      const [x0, y0, a] = path[k - 1], [x1, y1, b] = path[k], u = Math.min(1, (e - a) / (b - a));
      P.x = x0 + (x1 - x0) * u; P.y = y0 + (y1 - y0) * u; P.target = null; P.path = [];
      if (k === 2 && u > 0.5 && !step.top) { step.top = true; UI.toast('🌊 Wheee! Trượt xuống nào!'); }
      if (e < path[path.length - 1][2]) requestAnimationFrame(step);
      else {
        riding = false;
        const s = st();
        if (Date.now() - (s.falls || 0) > 5 * 60000) { s.falls = Date.now(); AV.earn(0, 15); UI.toast('🌊 Vui quá! +15 XP'); AV.markChanged(); }
      }
    };
    requestAnimationFrame(step);
  }
  function wish() {
    const ev = starEvent(), s = st();
    if (!ev.active) return UI.toast(night() > 0.5 ? '🌌 Chưa có sao băng — đợi chút, cứ vài phút lại có mưa sao băng!' : '🌞 Sao băng chỉ xuất hiện vào ban đêm (19h–5h)');
    if (s.wish === ev.id) return UI.toast('🌠 Bạn đã ước với cơn mưa sao này rồi, đợi đợt sau nhé!');
    s.wish = ev.id;
    const r = Math.random();
    if (r < 0.5) { const n = 50 + Math.floor(Math.random() * 251); AV.S.coins += n; UI.toast(`🌠 Điều ước thành sự thật! +${n} xu`, 4000); }
    else if (r < 0.85) { AV.addItemPublic('sky_fruit', 3); UI.toast('🌠 Sao băng tặng bạn 3 ✨ Quả Sao Phát Sáng', 4000); }
    else { AV.addItemPublic('star_shard', 1); UI.toast('🌠 Hiếm! Nhận 1 💫 Mảnh Sao Băng (bán 300 xu)', 5000); }
    NET.sendSys(`🌠 ${AV.S.name} vừa ước dưới mưa sao băng ở Đảo Trên Trời`);
    AV.markChanged();
  }
  /** Nút "Ước" hiện khi đang có sao băng trên đảo */
  let wishBtn = null, lastActive = false;
  setInterval(() => {
    try {
      const on = AV.currentMap && AV.currentMap() === 'sky';
      const ev = starEvent(), show = on && ev.active && st().wish !== ev.id;
      if (!wishBtn) { wishBtn = document.createElement('button'); wishBtn.className = 'wish-btn'; wishBtn.textContent = '🌠 Ước điều ước!'; wishBtn.onclick = wish; document.body.appendChild(wishBtn); }
      wishBtn.style.display = show ? 'block' : 'none';
      if (on && ev.active && !lastActive) UI.toast('🌠 Mưa sao băng! Bấm "Ước điều ước" nhanh lên!', 4000);
      lastActive = on && ev.active;
    } catch (e) { /* chưa sẵn sàng */ }
  }, 700);

  /** Tiệm đồ trời mây */
  function shopPanel() {
    const S = AV.S;
    const items = [['acc', 'wings'], ['hat', 'halo'], ['acc', 'starcape']];
    const p = UI.panel('☁️ Tiệm Đồ Trời Mây', '', { wide: true });
    const render = () => {
      p.body.innerHTML = `<div class="coins-line">💰 ${S.coins.toLocaleString('vi-VN')} xu</div><div class="b-grid">${items.map(([kind, id]) => {
        const it = (kind === 'hat' ? DATA.HATS : DATA.ACCS).find((x) => x.id === id);
        const own = (S.owned[kind === 'hat' ? 'hats' : 'accs'] || []).includes(id), wearing = S.look[kind] === id;
        const btn = wearing ? '<button class="btn small ghost" disabled>Đang mặc</button>' : own ? `<button class="btn small" data-wear="${kind}:${id}">Mặc</button>` : `<button class="btn small" data-buy="${kind}:${id}">Mua · ${it.price}💰</button>`;
        return `<div class="b-card"><canvas data-pv="${kind}:${id}"></canvas><b>${it.name}</b>${btn}</div>`;
      }).join('')}</div><p class="muted small-note">Đồ trời mây hiện trên nhân vật 🎨 Tự phối đồ (chọn trong 👕 Tủ đồ).</p>`;
      p.body.querySelectorAll('[data-pv]').forEach((cv) => { const [k, id] = cv.dataset.pv.split(':'); UI.drawAvatar(cv, { ...S.look, avatar: 'custom', [k]: id }, { scale: 1.15 }); });
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { const [k, id] = b.dataset.buy.split(':'); AV.buyWear(k, id); AV.markChanged(); render(); });
      p.body.querySelectorAll('[data-wear]').forEach((b) => b.onclick = () => { const [k, id] = b.dataset.wear.split(':'); AV.wear(k, id); render(); });
    };
    render();
  }

  /** Bay khinh khí cầu lên đảo / xuống Quảng trường (có cảnh bay) */
  function fly(up) {
    let el = document.querySelector('.fly-view');
    if (!el) { el = document.createElement('div'); el.className = 'fly-view'; el.innerHTML = '<div class="fly-clouds"></div><div class="fly-balloon">🎈</div><b class="fly-text"></b>'; document.body.appendChild(el); }
    el.classList.toggle('down', !up);
    el.querySelector('.fly-text').textContent = up ? '☁️ Đang bay lên Đảo Trên Trời…' : '🏙️ Đang hạ cánh xuống Quảng trường…';
    el.style.display = 'block'; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
    setTimeout(() => { if (up) AV.teleport('sky', false, 1500, 700, '☁️ Đảo Trên Trời'); else AV.teleport('town', false, 1530, 540, '⛲ Quảng trường'); }, 1600);
    setTimeout(() => { el.style.display = 'none'; }, 2600);
  }

  return { W, H, TREES, FALLS, LAKE, paintGround, balloon, observatory, shop, board, glowTree, bounceCloud, waterfall, skyFx, treeState, pickTree, rideFalls, wish, shopPanel, fly, starEvent };
})();
