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
.ht-scene{position:relative;flex:1;overflow:hidden}.ht-scene canvas{position:absolute;inset:0;width:100%;height:100%}
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
    v.innerHTML = `<div class="arc-bar"><b>${AUR ? '🌌 Đài ngắm cực quang' : '🌇 Ngắm hoàng hôn Hồ Tây'}</b><span>${AUR ? 'Ngước nhìn dải sáng nhảy múa trên bầu trời tuyết' : 'Nắng chiều vàng cam trên mặt hồ'}</span><button class="tv-x" data-close>✕ Thoát</button></div>
      <div class="ht-scene"><canvas></canvas><div class="ht-tools">${AUR ? '<button data-col>🎨 Đổi màu cực quang</button><button data-lan>🏮 Bật/tắt đèn</button>' : '<button data-time>🌗 Đổi giờ</button>'}<button data-snap>📸 Chụp ảnh</button></div></div>`;
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
    tb('[data-snap]', () => { cv.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = AUR ? 'cuc-quang-ho-tay.png' : 'hoang-hon-ho-tay.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }); UI.toast('📸 Đã chụp ảnh — ảnh được tải về máy!'); });
    const key = AUR ? 'htAurora' : 'htSunset', day = new Date().toDateString();
    if (S()[key] !== day) { S()[key] = day; AV.earn(0, 20); UI.toast(`${AUR ? '🌌' : '🌇'} Lần đầu ngắm hôm nay: +20 XP · đẹp quá trời!`, 4000); }
    const look = S().look || {};
    function frame(now) {
      if (!cv.isConnected) return;
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000, r = box.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), W = r.width, H = r.height;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (AUR) aurora(W, H, t); else sunset(W, H, t);
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
    setPal();
    raf = requestAnimationFrame(frame);
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
    col(m, 0, LAKE - 30, 2580, 32); col(m, 2760, LAKE - 30, W - 2760, 32); col(m, 0, 0, 2580, LAKE - 28); col(m, 2760, 0, W - 2760, LAKE - 28);
    col(m, 2580, 0, 180, 555);
    inter(m, { x: 2580, y: 520, w: 180, h: 130, ax: 2670, ay: 640, name: '🦢 Bến vịt đạp Hồ Tây', use: () => { AV.sayMine('🦢 Đạp vịt ngắm hồ thôi!'); UI.toast('🦢 Vịt đạp đang đông khách — đứng ngắm hồ và chờ show pháo hoa nhé!', 3500); }, arrow: { x: 2670, y: 500, text: 'Vịt đạp' } });
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

    npc(m, 'Chú chạy bộ', { skin: '#e3a979', hair: 'short', hairColor: '#212529', shirt: '#1c7ed6', shirtStyle: 'plain', pants: '#212529', hat: 'cap' }, { l: 200, t: 790, r: 4200, b: 840 }, 1200, 810);
    npc(m, 'Cô ngắm hồ', { skin: '#ffe0c4', hair: 'long', hairColor: '#2b2b33', shirt: '#f8f9fa', shirtStyle: 'plain', pants: '#495057', hat: 'flower' }, { l: 2900, t: 790, r: 3300, b: 840 }, 3000, 820);
    npc(m, 'Bác đạp xe', { skin: '#e3a979', hair: 'bald', hairColor: '#adb5bd', shirt: '#2f9e44', shirtStyle: 'plain', pants: '#343a40', hat: 'nonla' }, { l: 400, t: 790, r: 2000, b: 840 }, 700, 820);
    street(m, 2600);
    void paintStreet;
    m.spawn = { x: 2650, y: 875 };
    m.bounds = { l: 20, t: 560, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  function init() { ensureOverlay(); requestAnimationFrame(loop); }
  return { init, buildMap, scene, showInfo };
})();
