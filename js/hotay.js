/* 🌅 KHU HỒ TÂY — đường ven hồ, lan can xanh, hàng cây, hoàng hôn, chùa Trấn Quốc, vịt đạp, bánh tôm.
 *  🎆 Cứ 5 phút (theo đồng hồ, mọi người xem cùng lúc) có show DRONE xếp hình + PHÁO HOA trên mặt hồ
 *  🌌 Đài ngắm cực quang: màn hình ngắm bầu trời cực quang trên tuyết, cầm đèn lồng, chụp ảnh
 *  🌇 Ghế ngắm hoàng hôn Hồ Tây: cảnh hoàng hôn vàng cam trên mặt hồ, chụp ảnh */
const HOTAY = (() => {
  const PERIOD = 5 * 60e3, SHOW = 100e3;
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const S = () => AV.S;
  const showSec = () => { const n = Date.now() % PERIOD; return n < SHOW ? n / 1000 : -1; };
  const nextIn = () => PERIOD - (Date.now() % PERIOD);
  const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const here = () => AV.currentMap && AV.currentMap() === 'hotay';
  const circ = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  const rr = (c, x, y, w, h, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
  const txt = (c, s, x, y, size, col, w = 900) => { c.fillStyle = col; c.font = `${w} ${size}px "Be Vietnam Pro", system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
  const em = (c, s, x, y, size) => { c.font = `${size}px system-ui, "Segoe UI Emoji", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(s, x, y); };
  const isNight = () => { const h = new Date().getHours() + new Date().getMinutes() / 60; return h >= 18.5 || h < 5.5; };

  /* 🍤 quán bánh tôm Hồ Tây (dùng bảng ăn uống sẵn có) */
  if (DATA.STREET_FOOD && !DATA.STREET_FOOD.some((e) => e.id === 'sf_banhtom')) {
    DATA.STREET_FOOD.push({ id: 'sf_banhtom', name: 'Bánh Tôm Hồ Tây', logo: '🍤', umb: '#e8590c', signBg: '#e8590c', signFg: '#fff', items: ['🍤', '🍦'],
      menu: [{ id: 'banhtom', name: 'Đĩa bánh tôm Hồ Tây', icon: '🍤', price: 40, xp: 16 }, { id: 'kem_trangtien', name: 'Kem Tràng Tiền', icon: '🍦', price: 12, xp: 5 }, { id: 'tra_chanh', name: 'Trà chanh ven hồ', icon: '🍋', price: 10, xp: 4 }] });
  }

  /* ======================================================================
   * 🎆 SHOW DRONE + PHÁO HOA (vẽ trên 1 lớp canvas phủ bầu trời khi đang ở Hồ Tây)
   * ==================================================================== */
  const N = 260;
  const shapes = [];
  function textPts(str, size = 140) {
    const c = document.createElement('canvas'); c.width = 900; c.height = 220; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.font = `900 ${size}px "Be Vietnam Pro", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(str, 450, 115);
    const d = g.getImageData(0, 0, 900, 220).data, pts = [];
    for (let y = 0; y < 220; y += 5) for (let x = 0; x < 900; x += 5) if (d[(y * 900 + x) * 4 + 3] > 128) pts.push([x / 900, y / 220 * 0.45 + 0.28]);
    return pts;
  }
  const pick = (pts) => { const out = []; if (!pts.length) return out; for (let i = 0; i < N; i++) { const p = pts[Math.floor(i * pts.length / N) % pts.length]; out.push([p[0] + (Math.random() - 0.5) * 0.003, p[1] + (Math.random() - 0.5) * 0.003]); } return out; };
  function buildShapes() {
    if (shapes.length) return;
    const heart = [], lotus = [], flagP = [], star = [], globe = [];
    for (let i = 0; i < 400; i++) { const t = i / 400 * Math.PI * 2, x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); heart.push([0.5 + x / 50, 0.5 - y / 42]); if (i % 3 === 0) heart.push([0.5 + x / 50 * 0.6, 0.5 - y / 42 * 0.6]); }
    for (let k = 0; k < 7; k++) { const a0 = -Math.PI / 2 + (k - 3) * 0.42; for (let i = 0; i < 40; i++) { const s = i / 39, w = Math.sin(s * Math.PI) * 0.06; lotus.push([0.5 + Math.cos(a0) * s * 0.28 + Math.cos(a0 + Math.PI / 2) * w, 0.66 + Math.sin(a0) * s * 0.36 + Math.sin(a0 + Math.PI / 2) * w * 0.8]); lotus.push([0.5 + Math.cos(a0) * s * 0.28 - Math.cos(a0 + Math.PI / 2) * w, 0.66 + Math.sin(a0) * s * 0.36 - Math.sin(a0 + Math.PI / 2) * w * 0.8]); } }
    for (let y = 0; y < 14; y++) for (let x = 0; x < 22; x++) flagP.push([0.25 + x / 21 * 0.5, 0.3 + y / 13 * 0.4]);
    for (let i = 0; i < 300; i++) { const k = Math.floor(i / 30), a = -Math.PI / 2 + k * Math.PI / 5, b = -Math.PI / 2 + (k + 1) * Math.PI / 5, r1 = k % 2 ? 0.08 : 0.2, r2 = k % 2 ? 0.2 : 0.08, q = (i % 30) / 30; star.push([0.5 + (Math.cos(a) * r1 * (1 - q) + Math.cos(b) * r2 * q) * 1.0, 0.5 + (Math.sin(a) * r1 * (1 - q) + Math.sin(b) * r2 * q) * 1.6]); }
    for (let i = 0; i < 300; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()); globe.push([0.5 + Math.cos(a) * r * 0.42, 0.5 + Math.sin(a) * r * 0.32]); }
    const flagCol = (p) => { const dx = (p[0] - 0.5) / 0.5 * 2.2, dy = (p[1] - 0.5) / 0.4 * 1.4, a = Math.atan2(dy, dx), r = Math.hypot(dx, dy), k = Math.cos(5 * a) * 0.5 + 0.5; return r < 0.28 + 0.22 * k ? '#ffd43b' : '#ff2d2d'; };
    shapes.push(
      { pts: pick(globe), col: () => '#74c0fc', name: '✨' },
      { pts: pick(textPts('HỒ TÂY')), col: () => '#e7f5ff', name: 'HỒ TÂY' },
      { pts: pick(heart), col: () => '#ff6fae', name: '❤️' },
      { pts: pick(lotus), col: (p) => (p[1] > 0.6 ? '#ffc9e3' : '#ff8fc7'), name: '🪷 Hoa sen' },
      { pts: pick(flagP), col: flagCol, name: '🇻🇳' },
      { pts: pick(textPts('HÀ NỘI', 150)), col: () => '#ffe066', name: 'HÀ NỘI' },
      { pts: pick(star), col: () => '#ffd43b', name: '⭐' },
      { pts: pick(textPts('QL GAME', 130)), col: () => '#8ce99a', name: 'QL GAME' },
    );
  }
  let ov = null, og = null, fw = [], lastBurst = 0, lastSec = -1, warned = 0, chip = null;
  function ensureOverlay() {
    if (ov) return;
    ov = document.createElement('canvas'); ov.className = 'ht-sky'; document.body.appendChild(ov); og = ov.getContext('2d');
    chip = document.createElement('div'); chip.className = 'ht-chip'; document.body.appendChild(chip);
    chip.onclick = () => showInfo();
    const st = document.createElement('style');
    st.textContent = `.ht-sky{position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;display:none}
.ht-chip{position:fixed;left:50%;top:118px;transform:translateX(-50%);z-index:6;display:none;background:rgba(20,10,40,.78);color:#fff;border:2px solid #ffd43b;border-radius:999px;padding:5px 14px;font:800 13px "Be Vietnam Pro",system-ui;cursor:pointer;white-space:nowrap}
.ht-scene{position:relative;flex:1;overflow:hidden;touch-action:none}.ht-scene canvas{position:absolute;inset:0;width:100%;height:100%}
.ht-tools{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.ht-tools button{border:3px solid #fff;border-radius:14px;padding:8px 14px;font:900 14px "Be Vietnam Pro",system-ui;color:#1b2f48;background:linear-gradient(#fff,#d0ebff);cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.35)}`;
    document.head.appendChild(st);
  }
  function burst(x, y, big) {
    const kinds = ['peony', 'ring', 'willow', 'palm', 'heart'], k = kinds[Math.floor(Math.random() * kinds.length)];
    const cols = [['#ff6b6b', '#ffd43b'], ['#74c0fc', '#e7f5ff'], ['#da77f2', '#ffc9e3'], ['#69db7c', '#fff3bf'], ['#ffa94d', '#fff']][Math.floor(Math.random() * 5)];
    const n = big ? 160 : 110, sp = (big ? 1.25 : 0.95) * Math.max(0.8, Math.min(1.6, innerHeight / 700));
    for (let i = 0; i < n; i++) {
      let a = i / n * Math.PI * 2, v = (k === 'ring' ? 1 : 0.4 + Math.random() * 0.6) * sp;
      let vx = Math.cos(a) * v, vy = Math.sin(a) * v;
      if (k === 'heart') { const t = a, hx = 16 * Math.sin(t) ** 3, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); vx = hx / 17 * sp; vy = hy / 17 * sp; }
      fw.push({ x, y, vx: vx * 3.4, vy: vy * 3.4, life: k === 'willow' ? 2.8 : 2.0, age: 0, col: cols[i % 2], drag: k === 'willow' ? 0.972 : 0.962, g: k === 'willow' ? 0.05 : 0.035, px: x, py: y });
    fw.push({ flash: true, x, y, age: 0, life: 0.35 });
    }
  }
  function drawShow(W, H, s, dt) {
    const g = og, skyH = H * 0.62, dim = Math.min(1, s / 3, (SHOW / 1000 - s) / 3);
    const sk = g.createLinearGradient(0, 0, 0, skyH); sk.addColorStop(0, `rgba(5,8,30,${0.55 * dim})`); sk.addColorStop(1, `rgba(5,8,30,0)`);
    g.fillStyle = sk; g.fillRect(0, 0, W, skyH);
    buildShapes();
    const box = { x: W * 0.5 - Math.min(W * 0.42, skyH * 1.15), y: skyH * 0.05, w: Math.min(W * 0.84, skyH * 2.3), h: skyH * 0.82 };
    // drone: 0–72s, mỗi hình 9s (2.5s bay chuyển)
    if (s < 76) {
      const seg = 9, i = Math.min(shapes.length - 1, Math.floor(s / seg)), f = (s - i * seg) / 2.5, A = shapes[Math.max(0, i - 1)], B = shapes[i];
      const k = i === 0 ? Math.min(1, s / 4) : Math.min(1, f), ease = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      const out = s > 72 ? (s - 72) / 4 : 0;
      g.globalCompositeOperation = 'lighter';
      for (let d = 0; d < N; d++) {
        const p0 = i === 0 ? [d / N, 1.12] : A.pts[d], p1 = B.pts[d];
        let px = p0[0] + (p1[0] - p0[0]) * ease, py = p0[1] + (p1[1] - p0[1]) * ease;
        px += Math.sin(s * 2 + d) * 0.0015; py += Math.cos(s * 1.7 + d * 1.3) * 0.0015 + out * out * 0.9;
        const x = box.x + px * box.w, y = box.y + py * box.h, col = B.col(p1);
        g.globalAlpha = 0.25 * (1 - out); circ(g, x, y, 6, col);
        g.globalAlpha = 1 - out; circ(g, x, y, 2.2, col);
      }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    // pháo hoa: 70–100s, càng về cuối càng dày
    if (s > 70) {
      const rate = s > 92 ? 0.15 : 0.4;
      if (s - lastBurst > rate) { lastBurst = s; const x = W * (0.12 + Math.random() * 0.76), y = skyH * (0.12 + Math.random() * 0.45); fw.push({ x, y: skyH + 10, vx: 0, vy: 0, rocket: { tx: x, ty: y, t: 0 }, life: 0.7, age: 0 }); }
    } else lastBurst = s;
    g.globalCompositeOperation = 'lighter';
    for (let i = fw.length - 1; i >= 0; i--) {
      const p = fw[i]; p.age += dt;
      if (p.rocket) {
        const q = Math.min(1, p.age / p.life); p.y = skyH + 10 + (p.rocket.ty - skyH - 10) * (1 - (1 - q) ** 2);
        circ(g, p.x, p.y, 2.5, '#fff3bf'); g.globalAlpha = 0.4; circ(g, p.x, p.y + 10, 1.5, '#ffa94d'); g.globalAlpha = 1;
        if (q >= 1) { fw.splice(i, 1); burst(p.x, p.y, Math.random() < 0.4); }
        continue;
      }
      if (p.age > p.life) { fw.splice(i, 1); continue; }
      if (p.flash) { const a = 1 - p.age / p.life; g.globalAlpha = 0.25 * a; circ(g, p.x, p.y, 40, '#fff8e0'); g.globalAlpha = 0.5 * a; circ(g, p.x, p.y, 14, '#fff'); g.globalAlpha = 1; continue; }
      p.px = p.x; p.py = p.y;
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g * dt * 60; p.x += p.vx * dt * 60; p.y += p.vy * dt * 60;
      const a = Math.min(1, (1 - p.age / p.life) * 1.4);
      g.strokeStyle = p.col; g.globalAlpha = a * 0.7; g.lineWidth = 2.2; g.beginPath(); g.moveTo(p.px - (p.x - p.px) * 3, p.py - (p.y - p.py) * 3); g.lineTo(p.x, p.y); g.stroke();
      g.globalAlpha = a * 0.3; circ(g, p.x, p.y, 6, p.col); g.globalAlpha = a; circ(g, p.x, p.y, 2.4, p.age < 0.3 ? '#fff' : p.col);
      if (Math.random() < 0.02 * a) { g.globalAlpha = a; circ(g, p.x + (Math.random() - 0.5) * 10, p.y + (Math.random() - 0.5) * 10, 1.4, '#fff'); }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    // chữ nhỏ
    if (s < 72) { const i = Math.min(shapes.length - 1, Math.floor(s / 9)); g.globalAlpha = 0.8 * dim; txt(g, `🎆 Show drone Hồ Tây · ${shapes[i].name}`, W / 2, skyH + 6, 14, '#fff'); g.globalAlpha = 1; }
  }
  let lastT = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now;
    if (!ov) return;
    const on = here() && !(UI.arcadeOpen && UI.arcadeOpen()), s = showSec();
    chip.style.display = on ? 'block' : 'none';
    if (on) chip.textContent = s >= 0 ? '🎆 Show drone & pháo hoa đang diễn ra — ngẩng lên trời nhé!' : `🎆 Show drone & pháo hoa sau ${mmss(nextIn())}`;
    if (on && s < 0 && nextIn() < 30e3 && Date.now() - warned > 60e3) { warned = Date.now(); UI.toast('🎆 30 giây nữa show drone & pháo hoa Hồ Tây bắt đầu!', 4000); }
    if (on && s >= 0 && lastSec < 0 && typeof AV.earn === 'function') { const d = new Date().toDateString(); if (S().htShow !== d) { S().htShow = d; AV.earn(0, 15); UI.toast('🎆 Show bắt đầu! +15 XP (lần đầu xem hôm nay)', 4000); } }
    lastSec = on ? s : -1;
    if (!on || s < 0) { if (ov.style.display !== 'none') { ov.style.display = 'none'; fw = []; } return; }
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (ov.width !== Math.round(W * dpr) || ov.height !== Math.round(H * dpr)) { ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); }
    ov.style.display = 'block';
    og.setTransform(dpr, 0, 0, dpr, 0, 0); og.clearRect(0, 0, W, H);
    drawShow(W, H, s, dt);
  }
  function showInfo() {
    const s = showSec();
    UI.panel('🎆 Show drone & pháo hoa Hồ Tây', `<p>Cứ <b>5 phút</b> lại có 1 show trên bầu trời Hồ Tây: <b>260 drone</b> bay xếp thành chữ HỒ TÂY, trái tim, hoa sen, cờ đỏ sao vàng, chữ HÀ NỘI… rồi kết thúc bằng <b>pháo hoa</b> rực rỡ.</p>
      <p>Mọi người cùng xem một lúc (theo đồng hồ) — rủ bạn bè ra ven hồ ngồi xem nhé! Lần đầu xem mỗi ngày được +15 XP.</p>
      <p style="font-size:20px;text-align:center;font-weight:900">${s >= 0 ? '🎆 Đang diễn ra!' : `⏳ Show tiếp theo sau ${mmss(nextIn())}`}</p>`);
  }

  /* ======================================================================
   * 🌌 / 🌇 CẢNH NGẮM: cực quang trên tuyết · hoàng hôn Hồ Tây
   * ==================================================================== */
  function scene(kind) {
    const v = document.getElementById('arcadeView');
    const AUR = kind === 'aurora';
    const META = { aurora: ['🌌 Đài ngắm cực quang', 'Ngước nhìn dải sáng nhảy múa trên bầu trời tuyết'], sunset: ['🌇 Ngắm hoàng hôn Hồ Tây', 'Nắng chiều vàng cam trên mặt hồ'], night: ['🌃 Hồ Tây về đêm', 'Đèn thành phố lung linh trên mặt hồ'], lotus: ['🪷 Đầm sen Hồ Tây', 'Sáng sớm sương mù, sen hồng nở rộ'], pagoda: ['🛕 Chùa Trấn Quốc', 'Hoàng hôn tím hồng sau ngôi chùa cổ'] }[kind] || ['🌇 Hồ Tây', ''];
    v.innerHTML = `<div class="arc-bar"><b>${META[0]}</b><span>${META[1]}</span><button class="tv-x" data-close>✕ Thoát</button></div>
      <div class="ht-scene"><canvas></canvas><div class="ht-tools">${AUR ? '<button data-col>🎨 Đổi màu cực quang</button><button data-lan>🏮 Bật/tắt đèn</button>' : kind === 'sunset' ? '<button data-time>🌗 Đổi giờ</button>' : ''}<button data-snap>📸 Chụp ảnh</button></div></div>`;
    v.classList.add('show');
    const box = v.querySelector('.ht-scene'), cv = box.querySelector('canvas'), g = cv.getContext('2d');
    let raf = 0, t0 = performance.now(), palette = 0, lantern = true, late = 0;
    const off = document.createElement('canvas'), og2 = off.getContext('2d');
    const stars = Array.from({ length: 320 }, () => ({ x: Math.random(), y: Math.random() * 0.75, r: Math.random() * 1.4 + 0.3, p: Math.random() * 6 }));
    const PAL = [[['#3dff9e', '#7dffcb', '#b07cff']], [['#b07cff', '#ff7ad9', '#7dd3ff']], [['#3dff9e', '#ff7ad9', '#ffe066']]];
    const strip = (cols) => { const s = document.createElement('canvas'); s.width = 1; s.height = 256; const sg = s.getContext('2d'), gr = sg.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, cols[0] + '00'); gr.addColorStop(0.06, cols[0] + 'ee'); gr.addColorStop(0.35, cols[1] + '99'); gr.addColorStop(0.75, cols[2] + '44'); gr.addColorStop(1, cols[2] + '00'); sg.fillStyle = gr; sg.fillRect(0, 0, 1, 256); return s; };
    let strips = PAL[0][0].map(() => strip(PAL[0][0]));
    const setPal = () => { const c = PAL[palette][0]; strips = [strip(c), strip([c[1], c[0], c[2]]), strip([c[0], c[2], c[1]])]; };
    const close = () => { cancelAnimationFrame(raf); UI.closeArcade(); };
    v.querySelector('[data-close]').onclick = close;
    const tb = (sel, fn) => { const b = v.querySelector(sel); if (b) b.onclick = fn; };
    tb('[data-col]', () => { palette = (palette + 1) % PAL.length; setPal(); });
    tb('[data-lan]', () => { lantern = !lantern; });
    tb('[data-time]', () => { late = (late + 1) % 3; });
    tb('[data-snap]', () => { cv.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'ho-tay-' + kind + '.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }); UI.toast('📸 Đã chụp ảnh — ảnh được tải về máy!'); });
    const key = AUR ? 'htAurora' : kind === 'sunset' ? 'htSunset' : 'ht_' + kind, day = new Date().toDateString();
    if (S()[key] !== day) { S()[key] = day; AV.earn(0, 20); UI.toast(`${AUR ? '🌌' : '🌇'} Lần đầu ngắm hôm nay: +20 XP · đẹp quá trời!`, 4000); }
    const look = S().look || {};
    function frame(now) {
      if (!cv.isConnected) return;
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000, r = box.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), W = r.width, H = r.height;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (AUR) aurora(W, H, t); else ({ sunset, night, lotus, pagoda: pagodaView }[kind] || sunset)(W, H, t);
    }
    function aurora(W, H, t) {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#020716'); gr.addColorStop(0.55, '#0a2142'); gr.addColorStop(0.8, '#15365e'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      stars.forEach((s) => { g.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.5 + s.p)); circ(g, s.x * W, s.y * H, s.r, '#fff'); }); g.globalAlpha = 1;
      if ((t % 9) < 0.8) { const q = (t % 9) / 0.8, sx = W * 0.15 + q * W * 0.3, sy = H * 0.08 + q * H * 0.12; g.strokeStyle = `rgba(255,255,255,${1 - q})`; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx - 60, sy - 24); g.stroke(); }
      // cực quang: vẽ ở độ phân giải thấp rồi phóng to cho mềm như ảnh phơi sáng
      const ow = Math.max(160, Math.round(W / 4)), oh = Math.max(90, Math.round(H / 4));
      if (off.width !== ow) { off.width = ow; off.height = oh; }
      og2.clearRect(0, 0, ow, oh); og2.globalCompositeOperation = 'lighter';
      [[0.0, 0.5, 0.55, 1], [2.1, 0.36, 0.42, 0.75], [4.2, 0.62, 0.35, 0.55]].forEach(([ph, by, hh, al], ci) => {
        for (let x = -4; x < ow + 4; x += 1) {
          const u = x / ow, base = oh * (by + 0.12 * Math.sin(u * 5 + t * 0.35 + ph) + 0.05 * Math.sin(u * 13 - t * 0.6 + ph * 2) + (ci === 0 ? 0.18 * Math.sin(u * 2.2 + 0.6) : 0));
          const h = oh * hh * (0.6 + 0.4 * Math.sin(u * 7 + t * 0.5 + ph)), ray = 0.35 + 0.65 * Math.abs(Math.sin(u * 40 + t * 1.2 + ph) * Math.sin(u * 17 - t * 0.7));
          og2.globalAlpha = al * ray; og2.drawImage(strips[ci], 0, 0, 1, 256, x, base - h, 1.6, h);
        }
      });
      og2.globalCompositeOperation = 'source-over'; og2.globalAlpha = 1;
      g.imageSmoothingEnabled = true; g.globalCompositeOperation = 'lighter'; g.drawImage(off, 0, 0, W, H); g.globalAlpha = 0.5; g.drawImage(off, -8, -6, W + 16, H + 12); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      // rừng thông xa + đồi tuyết
      const hz = H * 0.8;
      g.fillStyle = '#04101e'; for (let x = 0; x < W; x += 14) { const h = 18 + 22 * Math.abs(Math.sin(x * 0.07)) + 10 * Math.sin(x * 0.013); g.beginPath(); g.moveTo(x - 9, hz); g.lineTo(x, hz - h); g.lineTo(x + 9, hz); g.fill(); }
      const sn = g.createLinearGradient(0, hz, 0, H); sn.addColorStop(0, '#9fb8d6'); sn.addColorStop(0.3, '#dfe9f5'); sn.addColorStop(1, '#f7fbff'); g.fillStyle = sn;
      g.beginPath(); g.moveTo(0, hz + 6); for (let x = 0; x <= W; x += 20) g.lineTo(x, hz + 4 + Math.sin(x * 0.012) * 10 + Math.sin(x * 0.05) * 3); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill();
      g.fillStyle = 'rgba(80,255,170,.08)'; g.fillRect(0, hz, W, H - hz);
      g.fillStyle = '#e9f1fb'; [[0.08, 0.93, 90, 40], [0.26, 0.96, 70, 30], [0.42, 0.92, 60, 26]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(W * x, H * y, rx, ry, 0, Math.PI, 0); g.fill(); });
      // nhân vật cầm đèn lồng
      const cx = W * 0.72, cy = H * 0.97, sc = Math.max(1.6, H / 300);
      const CH = 127 * sc, LX = cx - CH * 0.34, LY = cy - CH * 0.42;
      if (lantern) { const lx = LX, ly = LY, gl = g.createRadialGradient(lx, ly, 2, lx, ly, 160 * sc / 1.6); gl.addColorStop(0, 'rgba(255,214,120,.75)'); gl.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = gl; g.beginPath(); g.arc(lx, ly, 160 * sc / 1.6, 0, Math.PI * 2); g.fill(); }
      try { ART.character(g, cx, cy, look, { dir: -1, t: 0, scale: sc }); } catch (e) { /* bỏ qua */ }
      if (lantern) { const lx = LX, ly = LY, s2 = sc / 1.18; g.strokeStyle = '#495057'; g.lineWidth = 2 * s2; g.beginPath(); g.moveTo(lx, ly - 22 * s2); g.lineTo(lx + CH * 0.12, ly - 34 * s2); g.stroke(); rr(g, lx - 10 * s2, ly - 22 * s2, 20 * s2, 30 * s2, 4 * s2, '#343a40'); rr(g, lx - 7 * s2, ly - 18 * s2, 14 * s2, 22 * s2, 3 * s2, '#ffe8a3'); circ(g, lx, ly - 7 * s2, 4 * s2, '#fff'); }
      // tuyết rơi
      g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 70; i++) { const x = ((i * 137 + t * 18 * (1 + i % 3)) % W), y = ((i * 89 + t * 30 * (1 + i % 2)) % H); circ(g, x + Math.sin(t + i) * 6, y, 1.2 + (i % 3) * 0.6, 'rgba(255,255,255,.75)'); }
      txt(g, '✨ Đài ngắm cực quang · Hồ Tây ✨', W / 2, 26, 15, 'rgba(255,255,255,.75)', 800);
    }
    function sunset(W, H, t) {
      const P = [['#f3b37a', '#f6c08a', '#f9d29c', '#ffb36b'], ['#e8865a', '#f09a63', '#f7b77a', '#ff7b3a'], ['#2b2f5a', '#5b4a7a', '#c9706b', '#ffb36b']][late];
      const hz = H * 0.6, gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, P[0]); gr.addColorStop(0.6, P[1]); gr.addColorStop(1, P[2]); g.fillStyle = gr; g.fillRect(0, 0, W, hz + 2);
      const sx = W * 0.7, sy = H * (0.28 + late * 0.12), sr = Math.max(10, H * 0.022);
      const gl = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.35); gl.addColorStop(0, 'rgba(255,200,120,.75)'); gl.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, hz);
      g.strokeStyle = 'rgba(255,190,120,.35)'; g.lineWidth = H * 0.02; g.beginPath(); g.moveTo(W * 0.35, H * 0.05); g.lineTo(W * 1.05, H * 0.45); g.stroke();
      circ(g, sx, sy, sr * 1.6, 'rgba(255,230,180,.45)'); circ(g, sx, sy, sr, '#fff1d6'); circ(g, sx, sy, sr * 0.8, P[3]);
      // toà nhà xa trong sương
      g.fillStyle = late === 2 ? 'rgba(60,45,80,.75)' : 'rgba(150,100,90,.45)';
      for (let x = W * 0.45; x < W; x += 18) { const h = 10 + 26 * Math.abs(Math.sin(x * 0.031)) + (x % 7 === 0 ? 20 : 0); g.fillRect(x, hz - h, 15, h); }
      // mặt hồ + vệt nắng
      const wg = g.createLinearGradient(0, hz, 0, H); wg.addColorStop(0, P[2]); wg.addColorStop(1, P[1]); g.fillStyle = wg; g.fillRect(0, hz, W, H - hz);
      for (let i = 0; i < 40; i++) { const y = hz + 4 + i * (H - hz) / 40 * 0.6, w = (14 + i * 2.5) * (0.6 + 0.4 * Math.sin(t * 3 + i)); g.fillStyle = `rgba(255,${200 - i},${120 - i},${0.75 - i * 0.015})`; g.fillRect(sx - w / 2 + Math.sin(t * 2 + i) * 6, y, w, 2); }
      g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 30; i++) g.fillRect((i * 97 + t * 12) % W, hz + 20 + (i * 53) % (H - hz - 20), 26, 1.5);
      // vỉa hè + đường bên trái
      g.fillStyle = 'rgba(70,60,60,.85)'; g.beginPath(); g.moveTo(0, H * 0.7); g.lineTo(W * 0.42, H * 0.72); g.lineTo(W * 0.62, H); g.lineTo(0, H); g.closePath(); g.fill();
      g.fillStyle = 'rgba(120,105,100,.9)'; g.beginPath(); g.moveTo(W * 0.32, H * 0.715); g.lineTo(W * 0.46, H * 0.72); g.lineTo(W * 0.78, H); g.lineTo(W * 0.5, H); g.closePath(); g.fill();
      // lan can xanh hoa văn (phối cảnh)
      const rail = (u) => ({ x: W * 0.44 + u * W * 0.6, y: H * 0.72 + u * H * 0.22, s: 0.4 + u * 1.6 });
      g.strokeStyle = '#1e7a72'; g.lineCap = 'round';
      for (let i = 0; i < 30; i++) { const a = rail(i / 30), b = rail((i + 1) / 30), hh = 34 * a.s; g.lineWidth = 2.5 * a.s; g.beginPath(); g.moveTo(a.x, a.y - hh); g.lineTo(b.x, b.y - 34 * b.s); g.stroke(); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x, a.y - hh); g.stroke(); g.lineWidth = 1.6 * a.s; g.beginPath(); g.arc((a.x + b.x) / 2, a.y - hh * 0.45, hh * 0.32, 0, Math.PI * 2); g.stroke(); }
      // cây lớn + cột đèn (bóng tối ngược sáng)
      const dark = late === 2 ? '#14121c' : '#2a2a25';
      g.fillStyle = dark; g.fillRect(W * 0.38, H * 0.42, W * 0.012, H * 0.32);
      [[0.39, 0.3, 0.1], [0.33, 0.33, 0.08], [0.45, 0.34, 0.08], [0.36, 0.24, 0.07], [0.43, 0.25, 0.07], [0.39, 0.4, 0.09]].forEach(([x, y, r]) => circ(g, W * x, H * y, H * r * 1.4, dark));
      [[0.08, 0.28, 0.06], [0.12, 0.36, 0.08], [0.02, 0.4, 0.07], [0.18, 0.44, 0.06]].forEach(([x, y, r]) => circ(g, W * x, H * y, H * r * 1.3, dark));
      g.fillRect(W * 0.1, H * 0.42, W * 0.008, H * 0.3);
      g.strokeStyle = dark; g.lineWidth = 3; g.beginPath(); g.moveTo(W * 0.3, H * 0.75); g.lineTo(W * 0.3, H * 0.3); g.lineTo(W * 0.25, H * 0.27); g.stroke(); rr(g, W * 0.235, H * 0.262, W * 0.03, H * 0.014, 3, dark);
      if (late === 2) { circ(g, W * 0.25, H * 0.278, 4, '#ffe8a3'); }
      // xe máy dựng bên vỉa hè + người đạp xe
      g.fillStyle = dark; circ(g, W * 0.47, H * 0.84, H * 0.022, dark); circ(g, W * 0.53, H * 0.84, H * 0.022, dark); rr(g, W * 0.46, H * 0.79, W * 0.08, H * 0.035, 8, dark);
      const bx = (W * 0.1 + t * 30) % (W * 0.4);
      circ(g, bx, H * 0.78, H * 0.015, dark); circ(g, bx + H * 0.045, H * 0.78, H * 0.015, dark); rr(g, bx + H * 0.012, H * 0.715, H * 0.018, H * 0.05, 4, dark); circ(g, bx + H * 0.02, H * 0.7, H * 0.012, dark);
      // chim bay
      g.strokeStyle = dark; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const x = (W * 0.5 + i * 40 + t * 25) % W, y = H * 0.15 + i * 12 + Math.sin(t * 2 + i) * 4, w = 7 + Math.sin(t * 8 + i) * 2; g.beginPath(); g.moveTo(x - w, y - 3); g.quadraticCurveTo(x - w / 2, y - 6, x, y); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y - 3); g.stroke(); }
      // nhân vật đứng ngắm hồ
      try { ART.character(g, W * 0.62, H * 0.93, look, { dir: 1, t: 0, scale: Math.max(1.4, H / 340) }); } catch (e) { /* bỏ qua */ }
      txt(g, '🌇 Hồ Tây lúc hoàng hôn', W / 2, 26, 15, 'rgba(60,30,20,.7)', 800);
    }
    /* 🌃 Hồ Tây về đêm */
    function night(W, H, t) {
      const hz = H * 0.55, sk = g.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, '#040818'); sk.addColorStop(0.6, '#141a44'); sk.addColorStop(1, '#3a2c5c'); g.fillStyle = sk; g.fillRect(0, 0, W, hz + 1);
      stars.forEach((s) => { if (s.y > 0.5) return; g.globalAlpha = 0.3 + 0.6 * Math.abs(Math.sin(t + s.p)); circ(g, s.x * W, s.y * H * 0.9, s.r * 0.8, '#fff'); }); g.globalAlpha = 1;
      const mx = W * 0.8, my = H * 0.17, mr = H * 0.04, mg = g.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 5); mg.addColorStop(0, 'rgba(255,248,220,.5)'); mg.addColorStop(1, 'rgba(255,248,220,0)'); g.fillStyle = mg; g.fillRect(mx - mr * 5, my - mr * 5, mr * 10, mr * 10); circ(g, mx, my, mr, '#fff9e6');
      const wg = g.createLinearGradient(0, hz, 0, H); wg.addColorStop(0, '#1b1f45'); wg.addColorStop(1, '#0a0d24'); g.fillStyle = wg; g.fillRect(0, hz, W, H - hz);
      // toà nhà + đèn cửa sổ + phản chiếu
      let x = 0, k = 0;
      while (x < W) {
        const w = 18 + ((k * 37) % 40), h = H * (0.04 + ((k * 53) % 100) / 100 * 0.16) * (k % 9 === 0 ? 1.8 : 1);
        g.fillStyle = '#0d1026'; g.fillRect(x, hz - h, w, h);
        for (let yy = hz - h + 5; yy < hz - 4; yy += 8) for (let xx = x + 3; xx < x + w - 4; xx += 7) { if (((xx * 13 + yy * 7 + k) % 5) < 2) { const on = Math.sin(t * 0.5 + xx + yy) > -0.9; g.fillStyle = on ? ['#ffd98a', '#fff3c4', '#ffb86b'][(xx + yy) % 3] : '#1a1d38'; g.fillRect(xx, yy, 3, 4); if (on && (xx % 4 === 0)) { g.globalAlpha = 0.28; g.fillRect(xx - 1 + Math.sin(t * 2 + yy) * 2, hz + (hz - yy) * 0.9, 5, 2); g.globalAlpha = 1; } } }
        if (k % 9 === 0 && Math.sin(t * 3 + k) > 0) circ(g, x + w / 2, hz - h - 4, 2.5, '#ff4d4d');
        x += w + 4; k++;
      }
      for (let i = 0; i < 30; i++) { const y = hz + 6 + i * (H - hz) * 0.022, w = mr * (1.2 + i * 0.08) * (0.6 + 0.4 * Math.sin(t * 3 + i)); g.fillStyle = `rgba(255,248,220,${0.5 - i * 0.014})`; g.fillRect(mx - w / 2 + Math.sin(t * 2 + i) * 5, y, w, 2); }
      // vịt đạp có đèn
      [[0.3, 0.7, 1], [0.62, 0.66, -1]].forEach(([xx, yy, d], i) => { const sx = W * xx + Math.sin(t * 0.3 + i) * 40, sy = H * yy, s = H / 700; g.fillStyle = '#e9ecef'; g.beginPath(); g.ellipse(sx, sy, 34 * s, 13 * s, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#e9ecef'; g.lineWidth = 7 * s; g.beginPath(); g.moveTo(sx + d * 20 * s, sy - 6 * s); g.quadraticCurveTo(sx + d * 40 * s, sy - 30 * s, sx + d * 28 * s, sy - 44 * s); g.stroke(); for (let j = 0; j < 6; j++) circ(g, sx - 30 * s + j * 12 * s, sy - 16 * s, 2.2 * s, ['#ff6b6b', '#ffd43b', '#69db7c', '#74c0fc'][(j + Math.floor(t * 2)) % 4]); g.globalAlpha = 0.25; g.fillStyle = '#ffd43b'; g.fillRect(sx - 30 * s, sy + 12 * s, 60 * s, 2); g.globalAlpha = 1; });
      // lan can + đèn dây
      const ry = H * 0.82;
      g.fillStyle = '#16181f'; g.fillRect(0, ry, W, H - ry);
      g.strokeStyle = '#1e7a72'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, ry - 40); g.lineTo(W, ry - 40); g.moveTo(0, ry - 4); g.lineTo(W, ry - 4); g.stroke();
      for (let xx = 0; xx < W; xx += 44) { g.lineWidth = 4; g.beginPath(); g.moveTo(xx, ry); g.lineTo(xx, ry - 46); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(xx + 22, ry - 22, 11, 0, Math.PI * 2); g.stroke(); }
      [0.12, 0.45, 0.78].forEach((lx) => { const X = W * lx; g.fillStyle = '#2b2f3a'; g.fillRect(X - 3, ry - H * 0.32, 6, H * 0.32); const lg = g.createRadialGradient(X, ry - H * 0.32, 2, X, ry - H * 0.32, H * 0.2); lg.addColorStop(0, 'rgba(255,220,150,.6)'); lg.addColorStop(1, 'rgba(255,220,150,0)'); g.fillStyle = lg; g.beginPath(); g.arc(X, ry - H * 0.32, H * 0.2, 0, Math.PI * 2); g.fill(); circ(g, X, ry - H * 0.32, 7, '#fff3c4'); });
      g.strokeStyle = '#3a3a3a'; g.lineWidth = 1.5; g.beginPath(); for (let xx = 0; xx <= W; xx += 8) g.lineTo(xx, ry - H * 0.25 + Math.sin(xx / W * Math.PI * 6) ** 2 * 26); g.stroke();
      for (let xx = 10; xx < W; xx += 28) { const yy = ry - H * 0.25 + Math.sin(xx / W * Math.PI * 6) ** 2 * 26 + 5, on = Math.sin(t * 3 + xx * 0.1) > -0.3; g.globalAlpha = on ? 1 : 0.35; circ(g, xx, yy, 3.5, ['#ffd43b', '#ff8787', '#74c0fc', '#8ce99a'][(xx / 28 | 0) % 4]); } g.globalAlpha = 1;
      try { ART.character(g, W * 0.3, H * 0.97, look, { dir: 1, t: 0, scale: Math.max(1.4, H / 340) }); } catch (e) { /* bỏ qua */ }
      txt(g, '🌃 Hồ Tây về đêm', W / 2, 24, 15, 'rgba(255,255,255,.75)', 800);
    }
    /* 🪷 Đầm sen buổi sớm */
    const LEAVES = Array.from({ length: 46 }, (_, i) => { const r = ((i * 9301 + 49297) % 233280) / 233280, r2 = ((i * 4271 + 1237) % 9973) / 9973; return { x: r, y: 0.6 + r2 * 0.42, f: i % 3 === 0, b: i % 5 === 1, p: i }; }).sort((a, b) => a.y - b.y);
    function lotus(W, H, t) {
      const hz = H * 0.52, sk = g.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, '#cfe0f5'); sk.addColorStop(0.6, '#f7d3cf'); sk.addColorStop(1, '#fbe6d4'); g.fillStyle = sk; g.fillRect(0, 0, W, hz + 1);
      const sx = W * 0.24, sy = hz - H * 0.06, sg = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.3); sg.addColorStop(0, 'rgba(255,240,210,.9)'); sg.addColorStop(1, 'rgba(255,230,200,0)'); g.fillStyle = sg; g.fillRect(0, 0, W, hz); circ(g, sx, sy, H * 0.03, '#fff6e6');
      g.fillStyle = 'rgba(120,140,130,.45)'; for (let x = 0; x < W; x += 30) { const h = 18 + 18 * Math.abs(Math.sin(x * 0.02)); g.beginPath(); g.ellipse(x, hz - h * 0.4, 34, h * 0.55, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = 'rgba(140,90,90,.35)'; for (let k = 0; k < 9; k++) { const w = 20 - k * 1.6; g.fillRect(W * 0.72 - w / 2, hz - 12 - k * 9, w, 8); }
      const wg = g.createLinearGradient(0, hz, 0, H); wg.addColorStop(0, '#e6eef0'); wg.addColorStop(1, '#a9c6cc'); g.fillStyle = wg; g.fillRect(0, hz, W, H - hz);
      g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 40; i++) g.fillRect((i * 131 + t * 8) % W, hz + 8 + (i * 37) % (H - hz), 30, 1.5);
      g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 4; i++) g.fillRect(0, hz + i * 14 + Math.sin(t + i) * 4, W, 10);
      // thuyền gỗ + nhân vật giữa đầm
      const bx = W * 0.42 + Math.sin(t * 0.25) * 30, by = H * 0.78, s = H / 600;
      try { g.save(); g.beginPath(); g.rect(bx - 150 * s, by - 400 * s, 300 * s, 400 * s - 14 * s); g.clip(); ART.character(g, bx, by + 10 * s, look, { dir: 1, t: 0, scale: Math.max(1.3, H / 380) }); g.restore(); } catch (e) { g.restore(); }
      g.fillStyle = '#7a4a24'; g.beginPath(); g.moveTo(bx - 110 * s, by - 22 * s); g.quadraticCurveTo(bx, by + 16 * s, bx + 110 * s, by - 22 * s); g.lineTo(bx + 90 * s, by - 2 * s); g.quadraticCurveTo(bx, by + 22 * s, bx - 90 * s, by - 2 * s); g.closePath(); g.fill();
      g.fillStyle = '#5c3416'; g.fillRect(bx - 96 * s, by - 18 * s, 192 * s, 4 * s);
      // lá + hoa sen (xa nhỏ, gần to)
      LEAVES.forEach((L) => {
        const k = (L.y - 0.55) / 0.45, x = L.x * W + Math.sin(t * 0.8 + L.p) * 3 * k, y = L.y * H, r = (12 + 70 * k * k) * H / 700;
        if (Math.abs(x - bx) < 110 * s && Math.abs(y - by) < 30 * s) return;
        g.fillStyle = '#3d8a3a'; g.beginPath(); g.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#5cb04a'; g.beginPath(); g.ellipse(x, y - r * 0.06, r * 0.9, r * 0.34, 0, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(40,100,40,.5)'; g.lineWidth = 1; for (let j = 0; j < 8; j++) { const a = j / 8 * Math.PI * 2; g.beginPath(); g.moveTo(x, y - r * 0.06); g.lineTo(x + Math.cos(a) * r * 0.85, y - r * 0.06 + Math.sin(a) * r * 0.3); g.stroke(); }
        if (L.f || L.b) {
          const fx = x + r * 0.3, fy = y - r * 0.9 - 10 * k, fr = r * (L.b ? 0.22 : 0.42) + 3, sw = Math.sin(t * 1.2 + L.p) * 0.08;
          g.strokeStyle = '#4a8a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + r * 0.2, y); g.lineTo(fx, fy); g.stroke();
          g.save(); g.translate(fx, fy); g.rotate(sw);
          const pet = (a, w, h, col) => { g.save(); g.rotate(a); g.fillStyle = col; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-w, -h * 0.5, 0, -h); g.quadraticCurveTo(w, -h * 0.5, 0, 0); g.fill(); g.restore(); };
          if (L.b) pet(0, fr * 0.55, fr * 1.6, '#f783ac');
          else { [-1.1, 1.1, -0.6, 0.6].forEach((a) => pet(a, fr * 0.42, fr * 1.25, '#fcc2d7')); [-0.3, 0.3, 0].forEach((a) => pet(a, fr * 0.4, fr * 1.3, '#f783ac')); circ(g, 0, -fr * 0.25, fr * 0.22, '#ffd43b'); }
          g.restore();
        }
      });
      for (let i = 0; i < 2; i++) { const dx = W * (0.3 + 0.4 * i) + Math.sin(t * 1.3 + i * 3) * 80, dy = H * 0.58 + Math.cos(t * 1.7 + i) * 30; g.strokeStyle = '#3b5bdb'; g.lineWidth = 2; g.beginPath(); g.moveTo(dx - 9, dy); g.lineTo(dx + 9, dy); g.stroke(); g.fillStyle = 'rgba(200,220,255,.7)'; [-1, 1].forEach((d) => { g.beginPath(); g.ellipse(dx + d * 3, dy - 4, 7, 2.5, d * 0.4 + Math.sin(t * 30) * 0.3, 0, Math.PI * 2); g.fill(); }); }
      txt(g, '🪷 Đầm sen Hồ Tây buổi sớm', W / 2, 24, 15, 'rgba(80,50,60,.7)', 800);
    }
    /* 🛕 Chùa Trấn Quốc lúc hoàng hôn */
    function tower(x, base, s, a) {
      g.globalAlpha = a;
      for (let k = 0; k < 11; k++) { const w = (70 - k * 4.6) * s, y = base - k * 28 * s; g.fillStyle = '#9c4a32'; g.fillRect(x - w / 2, y - 22 * s, w, 22 * s); g.fillStyle = '#5c2416'; g.beginPath(); g.moveTo(x - w / 2 - 10 * s, y - 20 * s); g.lineTo(x + w / 2 + 10 * s, y - 20 * s); g.lineTo(x + w / 2 - 3 * s, y - 28 * s); g.lineTo(x - w / 2 + 3 * s, y - 28 * s); g.closePath(); g.fill(); g.fillStyle = '#e8c27a'; for (let i = -2; i <= 2; i++) g.fillRect(x + i * w / 6 - 1.5 * s, y - 15 * s, 3 * s, 7 * s); }
      g.fillStyle = '#e8b923'; g.beginPath(); g.arc(x, base - 11 * 28 * s - 8 * s, 7 * s, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
    }
    function pagodaView(W, H, t) {
      const hz = H * 0.62, sk = g.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, '#4b3f7a'); sk.addColorStop(0.5, '#d9798a'); sk.addColorStop(1, '#ffb36b'); g.fillStyle = sk; g.fillRect(0, 0, W, hz + 1);
      const sx = W * 0.68, sy = hz - H * 0.08, sg = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.35); sg.addColorStop(0, 'rgba(255,220,150,.85)'); sg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = sg; g.fillRect(0, 0, W, hz); circ(g, sx, sy, H * 0.035, '#fff0d0');
      const wg = g.createLinearGradient(0, hz, 0, H); wg.addColorStop(0, '#e89a6a'); wg.addColorStop(1, '#5a3a5a'); g.fillStyle = wg; g.fillRect(0, hz, W, H - hz);
      for (let i = 0; i < 26; i++) { const w = H * (0.04 + i * 0.006) * (0.6 + 0.4 * Math.sin(t * 3 + i)); g.fillStyle = `rgba(255,220,160,${0.55 - i * 0.018})`; g.fillRect(sx - w / 2 + Math.sin(t * 2 + i) * 5, hz + 5 + i * (H - hz) * 0.03, w, 2); }
      const s = H / 520, tx = W * 0.4;
      // đảo + cây + mái chùa
      g.fillStyle = '#2a1f2f'; g.beginPath(); g.ellipse(tx, hz + 2, W * 0.28, H * 0.03, 0, 0, Math.PI * 2); g.fill();
      [[-0.2, 40], [-0.13, 52], [0.12, 46], [0.2, 36], [-0.06, 30]].forEach(([dx, r]) => circ(g, tx + W * dx, hz - r * s * 0.6, r * s, '#2a2a33'));
      g.fillStyle = '#3a2228'; g.beginPath(); g.moveTo(tx + 60 * s, hz - 20 * s); g.lineTo(tx + 170 * s, hz - 20 * s); g.lineTo(tx + 150 * s, hz - 45 * s); g.lineTo(tx + 80 * s, hz - 45 * s); g.closePath(); g.fill(); g.fillRect(tx + 75 * s, hz - 20 * s, 85 * s, 20 * s);
      tower(tx, hz - 4, s, 1);
      // phản chiếu
      g.save(); g.translate(0, hz * 2 + 6); g.scale(1, -0.7); g.globalCompositeOperation = 'source-over'; tower(tx + Math.sin(t * 2) * 2, hz - 4, s, 0.28); g.restore();
      // chim
      g.strokeStyle = '#2a2033'; g.lineWidth = 1.6; for (let i = 0; i < 6; i++) { const x = (W * 0.1 + i * 50 + t * 22) % W, y = H * 0.2 + i * 10 + Math.sin(t * 2 + i) * 4, w = 8; g.beginPath(); g.moveTo(x - w, y - 3); g.quadraticCurveTo(x - w / 2, y - 6, x, y); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y - 3); g.stroke(); }
      // bờ đá + lan can phía trước, nhân vật
      g.fillStyle = '#2b2530'; g.fillRect(0, H * 0.86, W, H * 0.14);
      g.strokeStyle = '#1e5f5a'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, H * 0.86 - 34); g.lineTo(W, H * 0.86 - 34); g.stroke(); for (let x = 0; x < W; x += 50) { g.beginPath(); g.moveTo(x, H * 0.86); g.lineTo(x, H * 0.86 - 40); g.stroke(); }
      try { ART.character(g, W * 0.82, H * 0.98, look, { dir: -1, t: 0, scale: Math.max(1.4, H / 340) }); } catch (e) { /* bỏ qua */ }
      txt(g, '🛕 Chùa Trấn Quốc — ngôi chùa cổ nhất Hà Nội', W / 2, 24, 15, 'rgba(255,255,255,.8)', 800);
    }
    setPal();
    raf = requestAnimationFrame(frame);
  }

  /* ======================================================================
   * 🦢 ĐẠP VỊT THẬT: ngồi lên vịt, chạm vào mặt hồ để đạp tới đó
   * ==================================================================== */
  let riding = false, rideBtn = null, rideAt = 0;
  const DOCKP = { x: 2670, y: 630 };
  function startRide() {
    const P = AV.player;
    if (!P || riding) return;
    if (!AV.spend(20)) return;
    riding = true; rideAt = Date.now();
    P.x = DOCKP.x; P.y = 500; P.boat = 'swan'; P.target = null; P.path = []; P.pending = null;
    AV.resetNav('hotay');
    if (rideBtn) rideBtn.style.display = 'block';
    UI.toast('🦢 Thuê vịt đạp 20 xu — chạm vào mặt hồ để đạp tới đó! Bấm 🦢 Cập bến để lên bờ', 5000);
    AV.sayMine('🦢 Đạp đạp đạp~');
  }
  function endRide(quiet) {
    const P = AV.player;
    riding = false;
    if (rideBtn) rideBtn.style.display = 'none';
    if (!P) return;
    P.boat = false; P.target = null; P.path = []; P.pending = null;
    if (!quiet) { P.x = DOCKP.x; P.y = DOCKP.y; }
    AV.resetNav('hotay');
    if (!quiet && Date.now() - rideAt > 30e3) { const d = new Date().toDateString(); if (S().htSwan !== d) { S().htSwan = d; AV.earn(0, 20); UI.toast('🦢 Đạp vịt vòng hồ vui quá! +20 XP', 4000); } else UI.toast('🦢 Đã cập bến'); }
  }
  /** vẽ vịt: phần sau (trước người) và phần trước (đè lên chân người) */
  function swanBack(c, x, y, t) {
    const P = AV.player, d = P && P.dir < 0 ? -1 : 1;
    if (P && P.moving) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { const o = ((t * 2 + k / 3) % 1); c.globalAlpha = 1 - o; c.beginPath(); c.ellipse(x - d * (40 + o * 60), y + 4, 16 + o * 30, 4 + o * 4, 0, 0, Math.PI * 2); c.stroke(); } c.globalAlpha = 1; }
    c.fillStyle = 'rgba(30,80,120,.25)'; c.beginPath(); c.ellipse(x, y + 4, 74, 14, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f1f3f5'; c.beginPath(); c.ellipse(x, y - 18, 68, 26, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e9ecef'; c.beginPath(); c.moveTo(x - d * 52, y - 26); c.quadraticCurveTo(x - d * 86, y - 44, x - d * 74, y - 62); c.quadraticCurveTo(x - d * 60, y - 40, x - d * 40, y - 34); c.fill();
    c.fillStyle = '#1c7ed6'; c.beginPath(); c.roundRect(x - d * 22 - 16, y - 66, 32, 40, 8); c.fill();
  }
  function swanFront(c, x, y, t) {
    const P = AV.player, d = P && P.dir < 0 ? -1 : 1, bob = Math.sin(t * 3) * 1.5;
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y - 12 + bob, 70, 22, 0, 0, Math.PI); c.lineTo(x - 70, y - 26 + bob); c.quadraticCurveTo(x, y - 40 + bob, x + 70, y - 26 + bob); c.closePath(); c.fill();
    c.strokeStyle = '#dee2e6'; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x - d * (24 - k * 14), y - 16 + bob, 12, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); }
    c.strokeStyle = '#fff'; c.lineWidth = 15; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + d * 44, y - 24 + bob); c.quadraticCurveTo(x + d * 76, y - 56 + bob, x + d * 54, y - 98 + bob); c.stroke();
    c.strokeStyle = '#e9ecef'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + d * 50, y - 28 + bob); c.quadraticCurveTo(x + d * 78, y - 58 + bob, x + d * 60, y - 94 + bob); c.stroke();
    circ(c, x + d * 56, y - 104 + bob, 14, '#fff');
    c.fillStyle = '#ff922b'; c.beginPath(); c.moveTo(x + d * 66, y - 108 + bob); c.lineTo(x + d * 86, y - 100 + bob); c.lineTo(x + d * 66, y - 96 + bob); c.closePath(); c.fill();
    circ(c, x + d * 60, y - 108 + bob, 2.6, '#212529');
    c.fillStyle = '#e03131'; c.fillRect(x + d * 44 - 6, y - 82 + bob, 14, 5);
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y + 2, 76, 9, 0, 0, Math.PI); c.stroke();
  }

  /* ======================================================================
   * 🗺️ Bản đồ Hồ Tây
   * ==================================================================== */
  function buildMap(H) {
    const { base, ground, obj, sobj, aobj, col, inter, npc, paintGrass, paintStreet, addTree, addBench, addLamp, street } = H;
    const W = 4400, LAKE = 655;
    const m = base('hotay', 'Hồ Tây', W, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 512);
      const wg = g.createLinearGradient(0, m.hz, 0, LAKE); wg.addColorStop(0, '#f2b98a'); wg.addColorStop(0.25, '#d9a07a'); wg.addColorStop(1, '#6f8fa6'); g.fillStyle = wg; g.fillRect(0, m.hz, W, LAKE - m.hz);
      g.fillStyle = 'rgba(255,255,255,.12)'; for (let k = 0; k < 120; k++) g.fillRect((k * 311) % W, m.hz + 20 + (k * 47) % (LAKE - m.hz - 30), 40 + (k % 5) * 10, 2);
      // vỉa hè lát gạch đỏ + lối đi
      g.fillStyle = '#c7a89a'; g.fillRect(0, LAKE, W, 215); g.fillStyle = 'rgba(0,0,0,.06)'; for (let x = 0; x < W; x += 30) g.fillRect(x, LAKE, 2, 215); for (let y = LAKE; y < LAKE + 215; y += 30) g.fillRect(0, y, W, 2);
      paintStreet(g, m.w, 870, 1000);
      // cầu tàu vịt đạp
      g.fillStyle = '#6b4423'; g.fillRect(2580, 560, 180, 100); g.fillStyle = '#a0703f'; for (let x = 2584; x < 2760; x += 22) g.fillRect(x, 560, 18, 96);
    });
    /* bầu trời hoàng hôn + mặt trời + toà nhà phía xa (vẽ đè nền trời mặc định) */
    obj(m, 2, (c, t) => {
      const night = isNight(), sk = c.createLinearGradient(0, -900, 0, m.hz);
      if (night) { sk.addColorStop(0, '#0b1030'); sk.addColorStop(1, '#3b2f5a'); } else { sk.addColorStop(0, '#f6c79a'); sk.addColorStop(0.7, '#f4b583'); sk.addColorStop(1, '#f9d4a6'); }
      c.fillStyle = sk; c.fillRect(0, -900, W, m.hz + 900);
      if (!night) { const sx = 3100, sy = 190, gl = c.createRadialGradient(sx, sy, 0, sx, sy, 420); gl.addColorStop(0, 'rgba(255,215,150,.8)'); gl.addColorStop(1, 'rgba(255,190,120,0)'); c.fillStyle = gl; c.fillRect(sx - 420, sy - 420, 840, 840); circ(c, sx, sy, 26, '#fff1d6'); circ(c, sx, sy, 21, '#ff9a3c'); }
      else { circ(c, 3100, 150, 22, '#fff9db'); c.fillStyle = '#fff'; for (let k = 0; k < 80; k++) { c.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(t + k)); c.fillRect((k * 173) % W, -800 + (k * 97) % 1100, 2, 2); } c.globalAlpha = 1; }
      c.fillStyle = night ? 'rgba(30,25,50,.9)' : 'rgba(160,110,100,.5)';
      for (let x = 0; x < W; x += 26) { const h = 14 + 46 * Math.abs(Math.sin(x * 0.013)) + (x % 182 === 0 ? 60 : 0); c.fillRect(x, m.hz - h, 22, h); if (night) { c.fillStyle = 'rgba(255,214,120,.8)'; for (let k = 6; k < h - 4; k += 9) if ((x + k) % 3 === 0) c.fillRect(x + 6, m.hz - k, 3, 3); c.fillStyle = 'rgba(30,25,50,.9)'; } }
      // vệt nắng / ánh đèn trên mặt hồ
      for (let i = 0; i < 26; i++) { const w = 30 + i * 6 + Math.sin(t * 3 + i) * 10; c.fillStyle = night ? `rgba(255,214,140,${0.25 - i * 0.008})` : `rgba(255,220,150,${0.7 - i * 0.025})`; c.fillRect(3100 - w / 2 + Math.sin(t * 2 + i) * 8, m.hz + 8 + i * 11, w, 3); }
    }, [0, -900, W, LAKE]);
    /* chùa Trấn Quốc trên đảo nhỏ */
    sobj(m, 1400, 520, (c) => {
      c.fillStyle = '#5c7a3a'; c.beginPath(); c.ellipse(1400, 515, 230, 34, 0, 0, Math.PI * 2); c.fill();
      [[1260, 470, 'green'], [1540, 476, 'pink']].forEach(() => {});
      c.fillStyle = '#2f5a2a'; [[1240, 470, 50], [1290, 455, 42], [1530, 465, 48], [1575, 478, 36]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); });
      for (let k = 0; k < 11; k++) { const w = 70 - k * 4.5, y = 505 - k * 27; c.fillStyle = '#b5523b'; c.fillRect(1400 - w / 2, y - 22, w, 22); c.fillStyle = '#7a2f20'; c.beginPath(); c.moveTo(1400 - w / 2 - 10, y - 20); c.lineTo(1400 + w / 2 + 10, y - 20); c.lineTo(1400 + w / 2 - 4, y - 28); c.lineTo(1400 - w / 2 + 4, y - 28); c.closePath(); c.fill(); c.fillStyle = '#f3d27a'; for (let i = -2; i <= 2; i++) c.fillRect(1400 + i * (w / 6) - 2, y - 16, 4, 8); }
      c.fillStyle = '#e8b923'; c.beginPath(); c.arc(1400, 205, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff8e6'; c.beginPath(); c.roundRect(1330, 528, 140, 22, 6); c.fill(); c.fillStyle = '#7a2f20'; c.font = '900 12px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CHÙA TRẤN QUỐC', 1400, 539);
    }, { l: -240, t: -330, w: 480, h: 360 });
    /* vịt đạp trên hồ */
    obj(m, 600, (c, t) => {
      for (let k = 0; k < 5; k++) {
        const x = 1900 + ((k * 420 + t * (14 + k * 3)) % 2600), y = 470 + (k % 3) * 45 + Math.sin(t + k) * 4;
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x, y + 18, 46, 7, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = k % 2 ? '#fff' : '#ffd43b'; c.beginPath(); c.ellipse(x, y, 40, 18, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(x + 22, y - 6); c.quadraticCurveTo(x + 50, y - 30, x + 34, y - 52); c.lineTo(x + 26, y - 46); c.quadraticCurveTo(x + 36, y - 28, x + 16, y - 10); c.fill();
        c.fillStyle = '#ff922b'; c.beginPath(); c.moveTo(x + 34, y - 52); c.lineTo(x + 48, y - 48); c.lineTo(x + 34, y - 44); c.fill(); c.fillStyle = '#212529'; c.beginPath(); c.arc(x + 32, y - 49, 2.5, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#e03131'; c.fillRect(x - 24, y - 26, 30, 4);
      }
    }, [1800, 400, W, 620]);
    /* lan can xanh hoa văn dọc hồ */
    const railArt = (c, x0, x1) => {
      c.strokeStyle = '#1e7a72'; c.lineCap = 'round';
      c.lineWidth = 6; c.beginPath(); c.moveTo(x0, LAKE - 40); c.lineTo(x1, LAKE - 40); c.stroke();
      c.lineWidth = 4; c.beginPath(); c.moveTo(x0, LAKE - 6); c.lineTo(x1, LAKE - 6); c.stroke();
      for (let x = x0; x <= x1; x += 44) { c.lineWidth = 6; c.beginPath(); c.moveTo(x, LAKE); c.lineTo(x, LAKE - 46); c.stroke(); c.fillStyle = '#1e7a72'; c.beginPath(); c.arc(x, LAKE - 48, 5, 0, Math.PI * 2); c.fill(); if (x + 44 <= x1) { c.lineWidth = 3; c.beginPath(); c.arc(x + 22, LAKE - 23, 12, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(x + 6, LAKE - 8); c.quadraticCurveTo(x + 22, LAKE - 46, x + 38, LAKE - 8); c.stroke(); } }
    };
    [[0, 2580], [2760, W]].forEach(([a, b]) => { for (let x = a; x < b; x += 880) { const x0 = x, x1 = Math.min(b, x + 880); sobj(m, (x0 + x1) / 2, LAKE + 2, (c) => railArt(c, x0, x1), { l: -(x1 - x0) / 2 - 10, t: -60, w: x1 - x0 + 20, h: 64 }); } });
    const walk = () => !riding;
    [[0, LAKE - 30, 2580, 32], [2760, LAKE - 30, W - 2760, 32], [0, 0, 2580, LAKE - 28], [2760, 0, W - 2760, LAKE - 28], [2580, 0, 180, 555]].forEach(([x, y, w, h]) => m.colliders.push({ x, y, w, h, when: walk }));
    m.colliders.push({ x: 0, y: LAKE - 50, w: W, h: 600, when: () => riding }, { x: 1170, y: 488, w: 460, h: 50 });
    inter(m, { x: 2580, y: 520, w: 180, h: 130, ax: 2670, ay: 640, name: '🦢 Bến vịt đạp Hồ Tây (thuê 20 xu, ngồi vịt đạp quanh hồ)', use: () => (riding ? endRide() : startRide()), arrow: { x: 2670, y: 500, text: 'Vịt đạp' } });
    /* hàng cây lớn + đèn + ghế */
    for (let x = 160; x < W; x += 420) addTree(m, x, LAKE + 70, x % 840 === 160 ? 'green' : 'fruit');
    for (let x = 370; x < W; x += 840) { addLamp(m, x, LAKE + 60); (m.lights = m.lights || []).push([x - 24, LAKE - 52, 58], [x + 24, LAKE - 52, 58]); }
    [600, 1700, 3000, 4000].forEach((x) => addBench(m, x, LAKE + 40));
    m.labels.push({ text: '🌅 Hồ Tây', x: 2200, y: 380 }, { text: '🎆 Khán đài pháo hoa', x: 2200, y: 690 }, { text: '🌌 Đài ngắm cực quang', x: 3560, y: 690 }, { text: '🌇 Ghế ngắm hoàng hôn', x: 900, y: 690 });

    /* 🌇 ghế ngắm hoàng hôn */
    const SX = 900;
    sobj(m, SX, 760, (c) => {
      c.fillStyle = '#8a5a32'; c.fillRect(SX - 80, 728, 160, 12); c.fillRect(SX - 80, 700, 160, 10); c.fillStyle = '#5c3a1e'; c.fillRect(SX - 70, 740, 8, 20); c.fillRect(SX + 62, 740, 8, 20);
      c.fillStyle = '#ff922b'; c.beginPath(); c.roundRect(SX - 90, 640, 180, 48, 12); c.fill(); c.fillStyle = '#fff'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🌇 NGẮM HOÀNG HÔN', SX, 657); c.font = '800 10px "Be Vietnam Pro", system-ui'; c.fillText('Chạm để ngồi ngắm · chụp ảnh', SX, 676);
      c.fillStyle = '#6b4423'; c.fillRect(SX - 3, 688, 6, 14);
    }, { l: -100, t: -130, w: 200, h: 135 });
    col(m, SX - 80, 725, 160, 16);
    inter(m, { x: SX - 90, y: 640, w: 180, h: 120, ax: SX, ay: 790, name: 'Ghế ngắm hoàng hôn Hồ Tây', use: () => scene('sunset'), arrow: { x: SX, y: 620, text: 'Hoàng hôn' } });

    /* 🎆 khán đài pháo hoa + đồng hồ đếm ngược */
    const FX = 2200;
    sobj(m, FX, 790, (c) => {
      for (let r = 0; r < 3; r++) { c.fillStyle = ['#c92a2a', '#e03131', '#fa5252'][r]; c.fillRect(FX - 170 + r * 10, 760 - r * 18, 340 - r * 20, 18); }
      c.fillStyle = '#495057'; c.fillRect(FX - 6, 640, 12, 90);
    }, { l: -180, t: -160, w: 360, h: 170 });
    obj(m, 795, (c, t) => {
      const s = showSec();
      c.fillStyle = '#1b2f48'; c.beginPath(); c.roundRect(FX - 120, 600, 240, 70, 12); c.fill(); c.strokeStyle = '#ffd43b'; c.lineWidth = 4; c.stroke();
      c.fillStyle = '#ffd43b'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🎆 SHOW DRONE & PHÁO HOA', FX, 620);
      c.fillStyle = s >= 0 ? '#69db7c' : '#fff'; c.font = '900 22px "Be Vietnam Pro", system-ui'; c.fillText(s >= 0 ? `ĐANG DIỄN RA ${Math.floor(100 - s)}s` : mmss(nextIn()), FX, 648);
      if (s >= 0) for (let k = 0; k < 6; k++) { const a = t * 3 + k; c.fillStyle = ['#ff6b6b', '#ffd43b', '#74c0fc'][k % 3]; c.beginPath(); c.arc(FX - 110 + k * 44, 596 + Math.sin(a) * 4, 4, 0, Math.PI * 2); c.fill(); }
    }, [FX - 130, 590, FX + 130, 680]);
    col(m, FX - 170, 725, 340, 64);
    inter(m, { x: FX - 120, y: 600, w: 240, h: 190, ax: FX, ay: 815, name: 'Khán đài xem show drone & pháo hoa (5 phút / lần)', use: showInfo, arrow: { x: FX, y: 585, text: 'Pháo hoa' } });

    /* 🌌 đài ngắm cực quang: nhà mái vòm quan sát */
    const AX = 3560, AY = 800;
    aobj(m, AX, AY, (c, t) => {
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(AX, AY + 2, 160, 18, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#dee2e6'; c.fillRect(AX - 130, AY - 100, 260, 100); c.fillStyle = '#adb5bd'; c.fillRect(AX - 130, AY - 12, 260, 12);
      const dg = c.createLinearGradient(0, AY - 220, 0, AY - 100); dg.addColorStop(0, '#0a1a3a'); dg.addColorStop(1, '#16365e'); c.fillStyle = dg; c.beginPath(); c.arc(AX, AY - 100, 120, Math.PI, 0); c.fill();
      for (let k = 0; k < 3; k++) { c.strokeStyle = `rgba(${k === 1 ? '176,124,255' : '61,255,158'},${0.5 + 0.3 * Math.sin(t * 1.5 + k)})`; c.lineWidth = 8 - k * 2; c.beginPath(); for (let x = -100; x <= 100; x += 8) { const y = AY - 150 - k * 14 + Math.sin(x * 0.04 + t * 1.2 + k) * 10; if (Math.hypot(x, y - (AY - 100)) < 115) c.lineTo(AX + x, y); } c.stroke(); }
      for (let k = 0; k < 12; k++) { c.fillStyle = '#fff'; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + k); c.fillRect(AX - 90 + ((k * 37) % 180), AY - 200 + ((k * 23) % 80), 2, 2); } c.globalAlpha = 1;
      c.fillStyle = '#5c3a1e'; c.fillRect(AX - 24, AY - 70, 48, 70); c.fillStyle = '#ffe8a3'; c.fillRect(AX - 18, AY - 62, 36, 20);
      c.fillStyle = '#0b1e3d'; c.beginPath(); c.roundRect(AX - 115, AY - 96, 230, 22, 6); c.fill(); c.fillStyle = '#7dffcb'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🌌 ĐÀI NGẮM CỰC QUANG', AX, AY - 85);
    }, { l: -165, t: -230, w: 330, h: 236 });
    col(m, AX - 130, AY - 40, 260, 40);
    inter(m, { x: AX - 130, y: AY - 220, w: 260, h: 220, ax: AX, ay: AY + 30, name: 'Đài ngắm cực quang (vào ngắm, chụp ảnh)', use: () => scene('aurora'), arrow: { x: AX, y: AY - 240, text: 'Cực quang' } });

    /* 🍤 xe bánh tôm Hồ Tây */
    const BX2 = 1550, BY2 = 800;
    sobj(m, BX2, BY2, (c) => {
      c.fillStyle = '#8a5a32'; c.fillRect(BX2 - 60, BY2 - 60, 120, 46); c.fillStyle = '#212529'; [BX2 - 40, BX2 + 40].forEach((x) => { c.beginPath(); c.arc(x, BY2 - 10, 10, 0, Math.PI * 2); c.fill(); });
      c.fillStyle = 'rgba(210,240,255,.85)'; c.fillRect(BX2 - 50, BY2 - 92, 100, 32); em(c, '🍤🍤🍦', BX2, BY2 - 66, 20);
      c.fillStyle = '#495057'; c.fillRect(BX2 - 2, BY2 - 150, 4, 60);
      for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#fff' : '#e8590c'; c.beginPath(); c.moveTo(BX2, BY2 - 172); c.lineTo(BX2 - 84 + k * 28, BY2 - 138); c.lineTo(BX2 - 84 + (k + 1) * 28, BY2 - 138); c.closePath(); c.fill(); }
      c.fillStyle = '#e8590c'; c.beginPath(); c.roundRect(BX2 - 66, BY2 - 128, 132, 22, 7); c.fill(); c.fillStyle = '#fff'; c.font = '900 11px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BÁNH TÔM HỒ TÂY', BX2, BY2 - 117);
    }, { l: -100, t: -185, w: 200, h: 200 });
    col(m, BX2 - 60, BY2 - 30, 120, 24);
    inter(m, { x: BX2 - 70, y: BY2 - 170, w: 140, h: 170, ax: BX2, ay: BY2 + 26, name: 'Bánh Tôm Hồ Tây (ăn cho no, hồi ⚡)', use: () => UI.eateryPanel('sf_banhtom'), arrow: { x: BX2, y: BY2 - 190, text: 'Bánh tôm' } });

    /* 📷 các điểm ngắm cảnh đẹp */
    const viewSign = (x, l1, l2, bg, kind) => {
      sobj(m, x, 800, (c) => { c.fillStyle = '#5c3a1e'; c.fillRect(x - 4, 740, 8, 60); rr(c, x - 90, 690, 180, 58, 12, bg); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.roundRect(x - 90, 690, 180, 58, 12); c.stroke(); txt(c, l1, x, 710, 14, '#fff'); txt(c, l2, x, 730, 10, '#fff8e6', 800); }, { l: -100, t: -118, w: 200, h: 122 });
      col(m, x - 6, 792, 12, 8);
      inter(m, { x: x - 90, y: 690, w: 180, h: 110, ax: x, ay: 830, name: `📷 ${l1}`, use: () => scene(kind), arrow: { x, y: 675, text: 'Ngắm cảnh' } });
    };
    viewSign(380, '🪷 ĐẦM SEN', 'Sen hồng buổi sớm', '#e64980', 'lotus');
    viewSign(1250, '🛕 CHÙA TRẤN QUỐC', 'Hoàng hôn tím hồng', '#9c4a32', 'pagoda');
    viewSign(3100, '🌃 HỒ TÂY VỀ ĐÊM', 'Đèn phố lung linh', '#364fc7', 'night');
    // đám sen ven hồ
    obj(m, 560, (c, t) => { for (let k = 0; k < 26; k++) { const x = 60 + (k * 97) % 640, y = 570 + (k * 37) % 70, r = 10 + (k % 4) * 3; c.fillStyle = '#4c9a3a'; c.beginPath(); c.ellipse(x, y, r * 1.4, r * 0.55, 0, 0, Math.PI * 2); c.fill(); if (k % 3 === 0) { c.fillStyle = '#f783ac'; c.beginPath(); c.ellipse(x + 4, y - 10 + Math.sin(t + k) * 1.5, 5, 8, 0, 0, Math.PI * 2); c.fill(); } } }, [40, 540, 720, 650]);
    npc(m, 'Chú chạy bộ', { skin: '#e3a979', hair: 'short', hairColor: '#212529', shirt: '#1c7ed6', shirtStyle: 'plain', pants: '#212529', hat: 'cap' }, { l: 200, t: 790, r: 4200, b: 840 }, 1200, 810);
    npc(m, 'Cô ngắm hồ', { skin: '#ffe0c4', hair: 'long', hairColor: '#2b2b33', shirt: '#f8f9fa', shirtStyle: 'plain', pants: '#495057', hat: 'flower' }, { l: 2900, t: 790, r: 3300, b: 840 }, 3000, 820);
    npc(m, 'Bác đạp xe', { skin: '#e3a979', hair: 'bald', hairColor: '#adb5bd', shirt: '#2f9e44', shirtStyle: 'plain', pants: '#343a40', hat: 'nonla' }, { l: 400, t: 790, r: 2000, b: 840 }, 700, 820);
    street(m, 2600);
    m.objects = m.objects.filter((o) => o.y !== m.hz + 18); // bỏ hàng rào gỗ mặc định cắt ngang mặt hồ
    void paintStreet;
    m.spawn = { x: 2650, y: 875 };
    m.bounds = { l: 20, t: 365, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  function init() {
    ensureOverlay(); requestAnimationFrame(loop);
    rideBtn = document.createElement('button'); rideBtn.className = 'arrange-btn'; rideBtn.style.display = 'none'; rideBtn.style.bottom = '136px'; rideBtn.textContent = '🦢 Cập bến (lên bờ)'; rideBtn.onclick = () => endRide(); document.body.appendChild(rideBtn);
    setInterval(() => { if (riding && !here()) endRide(true); }, 400);
  }
  return { init, buildMap, scene, showInfo, swanBack, swanFront, startRide, endRide, riding: () => riding };
})();
