/* ✈️ Máy bay QuangLam Air (bay trên trời tới khu khác) + 🎡 Vòng quay nhìn kiểu 3D từ trong cabin */
const PLANE = (() => {
  let el = null, cv = null, ctx = null, raf = 0, W = 0, H = 0, D = 1;
  function ensure() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'fly3d';
    el.innerHTML = '<canvas></canvas><div class="f3-title"></div><button class="f3-skip">⏩ Bỏ qua</button>';
    document.body.appendChild(el);
    cv = el.querySelector('canvas'); ctx = cv.getContext('2d');
  }
  function size() {
    D = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
    cv.width = W * D; cv.height = H * D; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }
  function open(title, dur, drawFn, done) {
    ensure(); size();
    el.style.display = 'block';
    el.querySelector('.f3-title').textContent = title;
    const t0 = performance.now();
    let fin = false;
    const end = () => { if (fin) return; fin = true; cancelAnimationFrame(raf); el.style.display = 'none'; done(); };
    el.querySelector('.f3-skip').onclick = end;
    const loop = () => {
      const t = (performance.now() - t0) / 1000;
      ctx.setTransform(D, 0, 0, D, 0, 0);
      drawFn(ctx, t, Math.min(1, t / dur));
      if (t < dur) raf = requestAnimationFrame(loop); else end();
    };
    raf = requestAnimationFrame(loop);
    setTimeout(end, dur * 1000 + 1500); // không bao giờ kẹt kể cả khi tab ẩn
  }
  const night = () => (AV.nightFactor ? AV.nightFactor() : 0);
  function sky(c, top, bot) {
    const n = night(), g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, n > 0.5 ? '#0b1730' : top); g.addColorStop(1, n > 0.5 ? '#2b3a67' : bot);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (n > 0.5) { for (let i = 0; i < 80; i++) { c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect((i * 173) % W, (i * 97) % (H * 0.7), 2, 2); } }
  }
  function cloud(c, x, y, r, a = 0.9) {
    c.fillStyle = `rgba(255,255,255,${a})`;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.arc(x + r, y + r * 0.2, r * 0.8, 0, Math.PI * 2); c.arc(x - r, y + r * 0.25, r * 0.7, 0, Math.PI * 2); c.fill();
  }

  /* ---------- Máy bay ---------- */
  function drawPlane(c, x, y, t, look) {
    c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.3) * 0.03);
    // vệt khói
    for (let k = 0; k < 14; k++) { c.fillStyle = `rgba(255,255,255,${0.5 - k * 0.035})`; c.beginPath(); c.arc(-190 - k * 26, 6 + Math.sin(t * 3 + k) * 2, 12 + k * 1.5, 0, Math.PI * 2); c.fill(); }
    // cánh sau + đuôi
    c.fillStyle = '#1c7ed6'; c.beginPath(); c.moveTo(-150, -10); c.lineTo(-200, -90); c.lineTo(-165, -90); c.lineTo(-110, -12); c.closePath(); c.fill();
    c.fillStyle = '#adb5bd'; c.beginPath(); c.moveTo(-20, 18); c.lineTo(-90, 80); c.lineTo(-50, 80); c.lineTo(40, 18); c.closePath(); c.fill();
    // thân
    const g = c.createLinearGradient(0, -40, 0, 40); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ced4da');
    c.fillStyle = g; c.beginPath(); c.moveTo(-170, -14); c.quadraticCurveTo(-170, -40, -120, -40); c.lineTo(150, -40); c.quadraticCurveTo(215, -36, 225, 0); c.quadraticCurveTo(215, 34, 150, 36); c.lineTo(-120, 36); c.quadraticCurveTo(-170, 34, -170, 14); c.closePath(); c.fill();
    c.fillStyle = '#1c7ed6'; c.fillRect(-160, 14, 360, 9);
    c.fillStyle = '#e03131'; c.fillRect(-160, 23, 360, 4);
    c.fillStyle = '#1b2f48'; c.font = '900 15px "Be Vietnam Pro", system-ui'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('QUANGLAM AIR', -100, -26);
    // buồng lái
    c.fillStyle = '#1b2f48'; c.beginPath(); c.moveTo(178, -26); c.quadraticCurveTo(206, -22, 214, -6); c.lineTo(186, -6); c.closePath(); c.fill();
    // cửa sổ + hành khách (người chơi ngồi cửa sổ thứ 3)
    for (let k = 0; k < 9; k++) {
      const wx = -120 + k * 30;
      c.fillStyle = '#74c0fc'; c.beginPath(); c.roundRect(wx, -16, 18, 20, 7); c.fill();
      if (k === 2 && look) { c.save(); c.beginPath(); c.roundRect(wx, -16, 18, 20, 7); c.clip(); ART.character(c, wx + 9, 26, look, { scale: 0.42, t, dir: 1 }); c.restore(); }
    }
    // cánh chính + động cơ
    c.fillStyle = '#868e96'; c.beginPath(); c.moveTo(-10, 4); c.lineTo(-80, 90); c.lineTo(-30, 92); c.lineTo(70, 6); c.closePath(); c.fill();
    c.fillStyle = '#495057'; c.beginPath(); c.roundRect(-40, 52, 50, 20, 10); c.fill();
    c.restore();
  }
  function fly(dest, label) {
    const look = AV.S.look;
    open(`✈️ QuangLam Air · bay tới ${label}`, 13, (c, t, u) => {
      sky(c, '#4dabf7', '#d0ebff');
      if (night() < 0.5) { c.fillStyle = '#fff3bf'; c.beginPath(); c.arc(W * 0.82, H * 0.18, 46, 0, Math.PI * 2); c.fill(); }
      // mặt đất xa phía dưới: chỉ thấy lúc cất / hạ cánh
      const alt = u < 0.15 ? u / 0.15 : u > 0.85 ? (1 - u) / 0.15 : 1;
      const gy = H * (0.72 + alt * 0.5);
      c.fillStyle = '#69db7c'; c.fillRect(0, gy, W, H);
      for (let i = 0; i < 40; i++) { const bx = ((i * 97 - t * 160) % (W + 100) + W + 100) % (W + 100) - 50; c.fillStyle = ['#ff8787', '#74c0fc', '#ffd43b', '#e9ecef'][i % 4]; c.fillRect(bx, gy + 10 + (i % 4) * 14, 22, 12); }
      // mây 3 lớp trôi qua (gần nhanh, xa chậm)
      [[0.25, 30, 0.6], [0.55, 45, 0.8], [1, 70, 0.95]].forEach(([sp, r, a], L) => {
        for (let i = 0; i < 6; i++) { const x = ((i * 380 + L * 130 - t * 260 * sp) % (W + 400) + W + 400) % (W + 400) - 200; cloud(c, x, H * (0.2 + 0.12 * L) + Math.sin(i + L) * 60, r, a); }
      });
      // chim bay
      for (let i = 0; i < 4; i++) { const bx = ((W + 200 - (t * 90 + i * 260)) % (W + 300) + W + 300) % (W + 300) - 100, by = H * 0.3 + i * 30; c.strokeStyle = '#343a40'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx - 8, by); c.quadraticCurveTo(bx - 4, by - 6 * Math.abs(Math.sin(t * 8 + i)), bx, by); c.quadraticCurveTo(bx + 4, by - 6 * Math.abs(Math.sin(t * 8 + i)), bx + 8, by); c.stroke(); }
      const py = H * 0.48 + (1 - alt) * H * 0.18 + Math.sin(t * 1.5) * 6;
      drawPlane(c, W * 0.5, py, t, look);
    }, () => AV.teleport(dest, false, undefined, undefined, '🛬 Hạ cánh…'));
  }

  /* ---------- Vòng quay nhìn 3D ---------- */
  function ferris() {
    open('🎡 Vòng quay · ngắm thành phố từ trên cao', 16, (c, t, u) => {
      const a = u * Math.PI * 2, h = (1 - Math.cos(a)) / 2;           // độ cao 0 → 1 → 0
      const sway = Math.sin(t * 1.4) * 0.03;
      c.save(); c.translate(W / 2, H / 2); c.rotate(sway); c.translate(-W / 2, -H / 2);
      sky(c, '#74c0fc', '#e7f5ff');
      const hz = H * (0.62 - h * 0.3);                                   // càng lên cao càng nhìn thấy nhiều mặt đất bên dưới
      // núi + nhà cao tầng xa
      c.fillStyle = '#8ec5e8'; c.beginPath(); c.moveTo(-50, hz); for (let x = -50; x <= W + 50; x += 120) c.lineTo(x + 60, hz - 60 - ((x * 7) % 50)); c.lineTo(W + 50, hz); c.fill();
      for (let i = 0; i < 18; i++) { const bx = i * (W / 17), bh = 40 + ((i * 53) % 90); c.fillStyle = '#a5b8cc'; c.fillRect(bx, hz - bh, W / 22, bh); }
      // mặt đất phối cảnh (lưới hội tụ về chân trời)
      const gg = c.createLinearGradient(0, hz, 0, H); gg.addColorStop(0, '#9be38f'); gg.addColorStop(1, '#4caf50');
      c.fillStyle = gg; c.fillRect(0, hz, W, H - hz);
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.5;
      for (let k = -12; k <= 12; k++) { c.beginPath(); c.moveTo(W / 2 + k * 8, hz); c.lineTo(W / 2 + k * W * 0.18, H); c.stroke(); }
      for (let r = 1; r < 9; r++) { const y = hz + (H - hz) * Math.pow(r / 9, 2); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      // gian hàng khu giải trí nhỏ dần theo độ cao
      [[-0.3, '#ff6b6b'], [-0.1, '#ffd43b'], [0.12, '#4dabf7'], [0.32, '#b197fc']].forEach(([dx, col], i) => {
        const s = 1.2 - h * 0.8, x = W / 2 + dx * W * (1.4 - h), y = hz + (H - hz) * (0.35 + i * 0.12);
        c.fillStyle = col; c.fillRect(x - 40 * s, y - 50 * s, 80 * s, 50 * s);
        c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 48 * s, y - 50 * s); c.lineTo(x, y - 80 * s); c.lineTo(x + 48 * s, y - 50 * s); c.fill();
      });
      for (let i = 0; i < 4; i++) cloud(c, ((i * 330 + t * 20) % (W + 300)) - 150, H * 0.15 + i * 25 + h * 40, 34, 0.85);
      // nan hoa vòng quay quét qua trước mặt
      c.strokeStyle = 'rgba(80,80,90,.75)'; c.lineWidth = 10;
      for (let k = 0; k < 3; k++) { const ang = a * 1 + k * 2.1; c.beginPath(); c.moveTo(W / 2 + Math.cos(ang) * W, H * 1.4 + Math.sin(ang) * W); c.lineTo(W / 2, H * 1.4); c.stroke(); }
      c.restore();
      // khung cabin
      c.fillStyle = '#e03131'; c.fillRect(0, 0, W, 28); c.fillRect(0, H - 60, W, 60); c.fillRect(0, 0, 26, H); c.fillRect(W - 26, 0, 26, H);
      c.fillStyle = '#c92a2a'; c.fillRect(W / 2 - 8, 0, 16, H - 60);
      c.fillStyle = '#ffd43b'; c.font = '900 18px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(`Độ cao ${Math.round(h * 60)} m`, W / 2, H - 30);
    }, () => {});
  }
  return { fly, ferris };
})();
