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

  /* ---------- Máy bay: nhìn từ trên cao xuống toàn thành phố ---------- */
  const P = 260, BLK = 196;                                   // ô phố (nhà + đường)
  const hash = (i, j, n) => { let h = (i * 374761393 + j * 668265263 + n * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const riverX = (y) => 520 + Math.sin(y / 900) * 380;        // sông uốn lượn dọc đường bay
  const ROOF = ['#e9ecef', '#ffd8a8', '#d0bfff', '#a5d8ff', '#ffc9c9', '#b2f2bb', '#ced4da', '#fff3bf'];
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16); const f = (v) => Math.round(v * k); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
  function cityView(c, t, alt, scroll) {
    const n = night(), k = 1.7 - alt * 1.05;                  // càng cao nhìn càng rộng
    const cx = W / 2, cy = H / 2;
    const toS = (wx, wy) => [cx + wx * k, cy + (wy - scroll) * k];
    c.fillStyle = n > 0.5 ? '#2b3036' : '#c9c3b5'; c.fillRect(0, 0, W, H); // màu đường phố
    const halfW = W / 2 / k + P, halfH = H / 2 / k + P;
    const i0 = Math.floor(-halfW / P), i1 = Math.ceil(halfW / P), j0 = Math.floor((scroll - halfH) / P), j1 = Math.ceil((scroll + halfH) / P);
    // vạch kẻ đường
    c.strokeStyle = n > 0.5 ? 'rgba(255,212,59,.35)' : 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(1, 2 * k); c.setLineDash([10 * k, 10 * k]);
    for (let i = i0; i <= i1; i++) { const [x] = toS(i * P - (P - BLK) / 2, 0); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let j = j0; j <= j1; j++) { const [, y] = toS(0, j * P - (P - BLK) / 2); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.setLineDash([]);
    if (n > 0.5) {                                                            // đèn đường ban đêm ở các ngã tư
      c.fillStyle = 'rgba(255,200,90,.35)';
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const [x, y] = toS(i * P - (P - BLK) / 2, j * P - (P - BLK) / 2); c.beginPath(); c.arc(x, y, 16 * k, 0, Math.PI * 2); c.fill(); }
    }
    // xe chạy trên đường
    for (let i = i0; i <= i1; i++) for (let q = 0; q < 2; q++) {
      const lane = i * P - (P - BLK) / 2 + (q ? 9 : -9), sp = (q ? 1 : -1) * (90 + hash(i, q, 7) * 80);
      const base = Math.floor((scroll - 1500) / 3000) * 3000;
      for (let m = 0; m < 3; m++) {
        const wy = ((hash(i, m, q) * 3000 + t * sp) % 3000 + 3000) % 3000 + base;
        for (const yy of [wy, wy + 3000]) {
          const [x, y] = toS(lane, yy);
          if (y < -20 || y > H + 20) continue;
          c.fillStyle = ['#e03131', '#1c7ed6', '#fab005', '#f8f9fa'][(i + m) & 3]; c.fillRect(x - 3 * k, y - 6 * k, 6 * k, 12 * k);
        }
      }
    }
    // sông
    c.lineCap = 'round'; c.strokeStyle = n > 0.5 ? '#1c3d5a' : '#4dabf7'; c.lineWidth = 150 * k; c.beginPath();
    for (let wy = scroll - halfH, f = true; wy <= scroll + halfH; wy += 40, f = false) { const [x, y] = toS(riverX(wy), wy); if (f) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke(); c.lineCap = 'butt';
    const blocks = [];
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const bx = i * P, by = j * P;
      if (Math.abs(bx + BLK / 2 - riverX(by + BLK / 2)) < 190) {            // ô sát sông: cầu bắc qua
        const [x1, y1] = toS(riverX(by - 32) - 120, by - 42); c.fillStyle = '#868e96'; c.fillRect(x1, y1, 240 * k, 22 * k); continue;
      }
      const r = hash(i, j, 1);
      const [sx, sy] = toS(bx, by);
      if (r < 0.14) {                                                         // công viên
        c.fillStyle = n > 0.5 ? '#1f3d26' : '#69db7c'; c.fillRect(sx, sy, BLK * k, BLK * k);
        for (let q = 0; q < 7; q++) { c.fillStyle = n > 0.5 ? '#174020' : '#2f9e44'; c.beginPath(); c.arc(sx + (20 + hash(i, j, q + 3) * 156) * k, sy + (20 + hash(j, i, q + 5) * 156) * k, 14 * k, 0, Math.PI * 2); c.fill(); }
        continue;
      }
      if (r < 0.2) {                                                          // sân bóng
        c.fillStyle = '#40c057'; c.fillRect(sx, sy, BLK * k, BLK * k); c.strokeStyle = '#fff'; c.lineWidth = 2 * k; c.strokeRect(sx + 20 * k, sy + 30 * k, 156 * k, 136 * k);
        c.beginPath(); c.arc(sx + 98 * k, sy + 98 * k, 22 * k, 0, Math.PI * 2); c.stroke(); continue;
      }
      c.fillStyle = n > 0.5 ? '#3b3f45' : '#dee2e6'; c.fillRect(sx, sy, BLK * k, BLK * k); // vỉa hè
      const tall = r > 0.86, cnt = tall ? 1 : 2 + Math.floor(hash(i, j, 2) * 3);
      for (let q = 0; q < cnt; q++) {
        const w = tall ? 120 : 60 + hash(i, j, q + 10) * 30, d = tall ? 120 : 60 + hash(i, j, q + 20) * 30;
        const ox = tall ? 38 : (q % 2) * 98 + 8 + hash(i, j, q + 30) * (90 - w), oy = tall ? 38 : Math.floor(q / 2) * 98 + 8 + hash(i, j, q + 40) * (90 - d);
        blocks.push({ x: bx + ox, y: by + oy, w, d, h: tall ? 170 + hash(i, j, 50) * 110 : 30 + hash(i, j, q + 60) * 110, col: ROOF[Math.floor(hash(i, j, q + 70) * ROOF.length)], tall });
      }
    }
    // nhà nổi khối 3D: mái lệch ra xa tâm nhìn theo chiều cao (càng cao càng gần máy bay)
    blocks.sort((a, b) => a.h - b.h);
    const per = 0.0008 / (0.45 + alt * 0.55);
    for (const b of blocks) {
      const [x, y] = toS(b.x, b.y), w = b.w * k, d = b.d * k;
      if (x > W + 200 || y > H + 200 || x + w < -200 || y + d < -200) continue;
      const ox = (x + w / 2 - cx) * b.h * per, oy = (y + d / 2 - cy) * b.h * per;
      const base = [[x, y], [x + w, y], [x + w, y + d], [x, y + d]], top = base.map(([px, py]) => [px + ox, py + oy]);
      for (let e = 0; e < 4; e++) {
        const a = base[e], bb = base[(e + 1) % 4];
        c.fillStyle = shade(b.col, e % 2 ? 0.62 : 0.75);
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(bb[0], bb[1]); c.lineTo(top[(e + 1) % 4][0], top[(e + 1) % 4][1]); c.lineTo(top[e][0], top[e][1]); c.fill();
      }
      c.fillStyle = n > 0.5 ? shade(b.col, 0.45) : b.col; c.fillRect(top[0][0], top[0][1], w, d);
      if (b.tall) {                                                           // toà cao tầng: bãi đáp trực thăng trên mái
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2 * k; c.beginPath(); c.arc(top[0][0] + w / 2, top[0][1] + d / 2, 26 * k, 0, Math.PI * 2); c.stroke();
        c.fillStyle = '#fff'; c.font = `900 ${Math.max(8, 26 * k)}px system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', top[0][0] + w / 2, top[0][1] + d / 2);
      } else { c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(top[0][0] + w * 0.2, top[0][1] + d * 0.2, w * 0.25, d * 0.25); }
      if (n > 0.5) for (let q = 0; q < 3; q++) { c.fillStyle = 'rgba(255,224,102,.85)'; c.fillRect(top[0][0] + (q + 0.5) * w / 3.5, top[0][1] + d * 0.6, 3 * k, 3 * k); }
    }
  }
  function planeShape(c) {
    c.beginPath(); c.ellipse(0, 20, 22, 125, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(0, -20); c.lineTo(-150, 30); c.lineTo(-150, 48); c.lineTo(0, 22); c.lineTo(150, 48); c.lineTo(150, 30); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(0, 95); c.lineTo(-55, 128); c.lineTo(-55, 138); c.lineTo(0, 120); c.lineTo(55, 138); c.lineTo(55, 128); c.closePath(); c.fill();
  }
  function topPlane(c, x, y, s, t) {
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(Math.sin(t * 0.7) * 0.06);
    c.fillStyle = '#ced4da'; c.beginPath(); c.moveTo(0, -20); c.lineTo(-150, 30); c.lineTo(-150, 48); c.lineTo(0, 22); c.lineTo(150, 48); c.lineTo(150, 30); c.closePath(); c.fill(); // cánh chính
    c.fillStyle = '#868e96'; [-80, 80].forEach((ex) => { c.beginPath(); c.roundRect(ex - 9, 6, 18, 34, 7); c.fill(); });
    c.fillStyle = '#1c7ed6'; c.beginPath(); c.moveTo(0, 95); c.lineTo(-55, 128); c.lineTo(-55, 138); c.lineTo(0, 120); c.lineTo(55, 138); c.lineTo(55, 128); c.closePath(); c.fill(); // cánh đuôi
    const g = c.createLinearGradient(-22, 0, 22, 0); g.addColorStop(0, '#dee2e6'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#dee2e6');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 20, 22, 125, 0, 0, Math.PI * 2); c.fill();             // thân
    // chữ QUANG LÂM chạy dọc thân máy bay
    c.save(); c.rotate(-Math.PI / 2);
    c.font = '900 19px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 3; c.strokeStyle = '#fff'; c.strokeText('QUANG LÂM', -18, 0);
    c.fillStyle = '#1c7ed6'; c.fillText('QUANG LÂM', -18, 0);
    c.fillStyle = '#e03131'; c.fillRect(-78, 11, 120, 3);
    c.restore();
    // chữ trên hai cánh
    c.font = '900 12px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1c7ed6';
    c.fillText('QL', -105, 32); c.fillText('QL', 105, 32);
    c.fillStyle = '#1b2f48'; c.beginPath(); c.ellipse(0, -88, 12, 14, 0, Math.PI, 0); c.fill();          // buồng lái
    // đèn nháy đầu cánh
    if (Math.floor(t * 2) % 2) { c.fillStyle = '#ff6b6b'; c.beginPath(); c.arc(-150, 40, 6, 0, Math.PI * 2); c.fill(); c.fillStyle = '#69db7c'; c.beginPath(); c.arc(150, 40, 6, 0, Math.PI * 2); c.fill(); }
    c.restore();
  }
  function fly(dest, label) {
    let scroll = 0, last = 0;
    const ap = DATA.airportOf(dest);
    open(`✈️ QuangLam Air · ${label} · hạ cánh ${ap.code} ${ap.name.replace('Sân bay quốc tế ', '')}`, 14, (c, t, u) => {
      const alt = u < 0.18 ? Math.sin((u / 0.18) * Math.PI / 2) : u > 0.82 ? Math.sin(((1 - u) / 0.18) * Math.PI / 2) : 1;
      scroll -= (t - last) * (260 + alt * 420); last = t;              // bay về phía trên màn hình
      cityView(c, t, alt, scroll);
      if (alt < 0.9) {                                                     // đường băng sân bay lúc cất / hạ cánh
        const k = 1.7 - alt * 1.05, rw = 150 * k, a = 1 - alt / 0.9;
        c.globalAlpha = Math.min(1, a * 1.4);
        c.fillStyle = '#3d4148'; c.fillRect(W / 2 - rw / 2, 0, rw, H);
        c.fillStyle = '#f8f9fa';
        const off = ((-scroll * k) % (90 * k) + 90 * k) % (90 * k);
        for (let y = -90 * k + off; y < H; y += 90 * k) c.fillRect(W / 2 - 3 * k, y, 6 * k, 45 * k);
        for (const sx of [-1, 1]) { c.fillRect(W / 2 + sx * (rw / 2 - 8 * k) - 2 * k, 0, 4 * k, H); for (let y = off; y < H; y += 60 * k) { c.fillStyle = '#ffd43b'; c.beginPath(); c.arc(W / 2 + sx * (rw / 2 + 6 * k), y, 3 * k, 0, Math.PI * 2); c.fill(); c.fillStyle = '#f8f9fa'; } }
        c.globalAlpha = 1;
      }
      c.fillStyle = `rgba(${night() > 0.5 ? '20,30,60' : '200,225,255'},${0.08 + alt * 0.22})`; c.fillRect(0, 0, W, H); // khí quyển mờ khi lên cao
      const ps = Math.min(W, H) / 900 * (1.25 - alt * 0.3);
      // bóng máy bay trên mặt đất (càng cao càng xa, càng nhỏ)
      c.save(); c.globalAlpha = 0.25 * (1 - alt * 0.6); c.fillStyle = '#000';
      c.translate(W / 2 + 40 + alt * 160, H * 0.56 + 30 + alt * 140); c.scale(ps * (1 - alt * 0.4), ps * (1 - alt * 0.4)); planeShape(c); c.restore();
      topPlane(c, W / 2, H * 0.56, ps, t);
      // mây lướt qua bên dưới máy bay
      if (alt > 0.4) for (let i = 0; i < 7; i++) {
        const y = ((i * 260 + t * 520) % (H + 500)) - 250, x = (hash(i, 3, 9) * 1.2 - 0.1) * W;
        cloud(c, x, y, 60 + hash(i, 4, 9) * 50, 0.55 * (alt - 0.4) / 0.6);
      }
      c.fillStyle = 'rgba(27,47,72,.8)'; c.beginPath(); c.roundRect(14, H - 110, 200, 40, 12); c.fill();
      c.fillStyle = '#ffd43b'; c.font = '900 16px "Be Vietnam Pro", system-ui'; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText(`🛫 Độ cao ${Math.round(alt * 3200).toLocaleString('vi-VN')} m`, 24, H - 90);
    }, () => AV.landAt(dest));
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
