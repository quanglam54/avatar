/* 🌸 Vườn Anh Đào: cắm trại (lều ngủ, lửa trại), khu ăn uống (BBQ, thảm picnic), tạp hoá, nhà vệ sinh, bể bơi, hồ chèo thuyền */
const CAMP = (() => {
  const POOL = { x: 1800, y: 560, w: 500, h: 230 };
  const LAKE = { x: 2960, y: 615, rx: 380, ry: 160 };
  const DOCK = { x: 2590, y: 790 };
  const SLEEP_MIN = 30, BOAT_PRICE = 20;
  const st = () => { const S = AV.S; S.camp = S.camp || {}; return S.camp; };

  /* ---------- Vẽ ---------- */
  function puff(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  /** Cây anh đào hồng */
  function sakura(c, x, y, k = 1, seed = 0) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(0, 2, 56, 12, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#6b3f2a'; c.lineWidth = 14; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -50, 6, -90); c.stroke();
    c.lineWidth = 7; c.beginPath(); c.moveTo(2, -60); c.lineTo(-34, -96); c.moveTo(4, -70); c.lineTo(38, -100); c.stroke();
    const cols = ['#ffc9de', '#ffb3cf', '#ffd6e5', '#ff9ec2'];
    [[0, -128, 44], [-40, -108, 36], [42, -110, 36], [-22, -150, 30], [24, -150, 30], [-56, -82, 24], [58, -84, 24]].forEach(([dx, dy, r], i) => puff(c, dx, dy, r, cols[(i + seed) % 4]));
    for (let i = 0; i < 18; i++) puff(c, Math.sin(i * 7 + seed) * 50, -110 + Math.cos(i * 3 + seed) * 40, 3, '#fff0f6');
    c.restore();
  }
  /** Lều cắm trại */
  function tent(c, x, y, col) {
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x, y + 2, 80, 14, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 76, y); c.lineTo(x, y - 110); c.lineTo(x + 76, y); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.moveTo(x, y - 110); c.lineTo(x + 76, y); c.lineTo(x + 20, y); c.closePath(); c.fill();
    c.fillStyle = '#3b2a1a'; c.beginPath(); c.moveTo(x - 26, y); c.lineTo(x, y - 66); c.lineTo(x + 26, y); c.closePath(); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 110); c.lineTo(x, y - 128); c.stroke();
    c.fillStyle = '#ffd43b'; c.beginPath(); c.moveTo(x, y - 128); c.lineTo(x + 18, y - 122); c.lineTo(x, y - 116); c.closePath(); c.fill();
  }
  /** Vạt lều phía trước (che người đang ngủ) */
  function tentFront(c, x, y, col, t) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 30, y); c.lineTo(x, y - 70); c.lineTo(x + 30, y); c.closePath(); c.fill();
    c.font = '900 18px system-ui'; c.textAlign = 'center'; c.fillStyle = '#4c6ef5';
    for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1; c.globalAlpha = 1 - ph; c.fillText('z', x + 20 + ph * 20, y - 90 - ph * 40 - k * 4); }
    c.globalAlpha = 1;
  }
  function campfire(c, x, y, t) {
    c.fillStyle = '#6b4226'; [[-26, 4, 0.4], [26, 4, -0.4]].forEach(([dx, dy, a]) => { c.save(); c.translate(x + dx * 0.5, y + dy); c.rotate(a); c.fillRect(-26, -5, 52, 10); c.restore(); });
    [-1, 1].forEach((s) => { c.fillStyle = '#8a5a3c'; c.beginPath(); c.roundRect(x + s * 90 - 34, y + 6, 68, 18, 8); c.fill(); });
    for (let k = 0; k < 3; k++) {
      const h = 34 + Math.sin(t * 9 + k * 2) * 8, w = 14 - k * 3;
      c.fillStyle = ['#ff922b', '#ffd43b', '#fff3bf'][k];
      c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.6, y - h * 0.6, x + Math.sin(t * 7) * 3, y - h + k * 6); c.quadraticCurveTo(x + w * 0.6, y - h * 0.6, x + w, y); c.closePath(); c.fill();
    }
    c.fillStyle = `rgba(255,170,60,${0.12 + 0.05 * Math.sin(t * 6)})`; c.beginPath(); c.arc(x, y - 14, 70, 0, Math.PI * 2); c.fill();
  }
  function picnic(c, x, y, k) {
    const col = ['#e03131', '#1c7ed6', '#2f9e44'][k % 3];
    c.save(); c.translate(x, y);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? '#fff' : col; c.fillRect(-90 + i * 30, -50 + j * 22, 30, 22); }
    c.fillStyle = '#c8874a'; c.beginPath(); c.roundRect(-30, -40, 60, 28, 6); c.fill();
    c.font = '20px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(['🍉', '🍙', '🧃'][k % 3], -14, -28); c.fillText(['🍗', '🍓', '🥪'][k % 3], 14, -28);
    c.restore();
  }
  function wc(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x, y + 3, 90, 14, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d0ebff'; c.fillRect(x - 80, y - 130, 160, 130);
    c.fillStyle = '#1971c2'; c.beginPath(); c.moveTo(x - 92, y - 128); c.lineTo(x, y - 170); c.lineTo(x + 92, y - 128); c.closePath(); c.fill();
    [[-38, '#4dabf7', '🚹'], [38, '#f783ac', '🚺']].forEach(([dx, col, ic]) => {
      c.fillStyle = col; c.beginPath(); c.roundRect(x + dx - 26, y - 92, 52, 92, [10, 10, 0, 0]); c.fill();
      c.font = '22px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ic, x + dx, y - 64);
    });
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - 34, y - 124, 68, 26, 6); c.fill();
    c.fillStyle = '#1971c2'; c.font = '900 16px "Be Vietnam Pro", system-ui'; c.fillText('WC', x, y - 111);
  }
  function pool(c, t) {
    const { x, y, w, h } = POOL;
    c.fillStyle = '#e9ecef'; c.beginPath(); c.roundRect(x - 26, y - 26, w + 52, h + 52, 22); c.fill();
    c.fillStyle = '#ced4da'; for (let i = 0; i < (w + 52) / 26; i++) c.fillRect(x - 26 + i * 26, y - 26, 2, h + 52);
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#74d4ff'); g.addColorStop(1, '#2fa8e8');
    c.fillStyle = g; c.beginPath(); c.roundRect(x, y, w, h, 14); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 2;
    for (let k = 0; k < 7; k++) { const yy = y + 20 + k * 30, off = Math.sin(t * 1.5 + k) * 10; c.beginPath(); c.moveTo(x + 20 + off, yy); c.quadraticCurveTo(x + w / 2, yy + 8, x + w - 20 + off, yy); c.stroke(); }
    c.strokeStyle = '#fff'; c.lineWidth = 4;
    [[x + 30, y - 4], [x + w - 30, y - 4]].forEach(([lx, ly]) => { c.beginPath(); c.moveTo(lx - 8, ly + 26); c.lineTo(lx - 8, ly - 18); c.moveTo(lx + 8, ly + 26); c.lineTo(lx + 8, ly - 18); for (let k = 0; k < 3; k++) { c.moveTo(lx - 8, ly + 18 - k * 12); c.lineTo(lx + 8, ly + 18 - k * 12); } c.stroke(); });
    // phao bơi trôi
    [[x + 150, y + 90, '#ff6b6b'], [x + 360, y + 150, '#ffd43b']].forEach(([px, py, col], k) => { const bx = px + Math.sin(t * 0.8 + k) * 14; c.strokeStyle = col; c.lineWidth = 10; c.beginPath(); c.ellipse(bx, py, 22, 12, 0, 0, Math.PI * 2); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 10; c.setLineDash([8, 12]); c.beginPath(); c.ellipse(bx, py, 22, 12, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); });
  }
  function umbrella(c, x, y, col) {
    c.fillStyle = '#868e96'; c.fillRect(x - 2, y - 90, 4, 90);
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 60, y - 80); c.quadraticCurveTo(x, y - 130, x + 60, y - 80); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 20, y - 80); c.quadraticCurveTo(x, y - 126, x + 20, y - 80); c.closePath(); c.fill();
    c.fillStyle = '#f8f9fa'; c.beginPath(); c.roundRect(x - 50, y - 18, 100, 16, 6); c.fill(); c.fillStyle = '#ced4da'; c.fillRect(x - 46, y - 2, 6, 6); c.fillRect(x + 40, y - 2, 6, 6);
  }
  function lake(c, t) {
    const { x, y, rx, ry } = LAKE;
    c.fillStyle = '#c3e6a6'; c.beginPath(); c.ellipse(x, y, rx + 22, ry + 16, 0, 0, Math.PI * 2); c.fill();
    const g = c.createRadialGradient(x, y, 20, x, y, rx); g.addColorStop(0, '#5ec8f0'); g.addColorStop(1, '#2b8fcf');
    c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2;
    for (let k = 0; k < 8; k++) { const px = x - 280 + k * 80 + Math.sin(t + k) * 10, py = y - 90 + (k % 3) * 70; c.beginPath(); c.moveTo(px - 18, py); c.quadraticCurveTo(px, py - 6, px + 18, py); c.stroke(); }
    [[x - 240, y + 40], [x + 200, y - 60], [x + 90, y + 110]].forEach(([px, py]) => { puff(c, px, py, 14, '#40c057'); puff(c, px + 6, py - 4, 4, '#ff8fb1'); });
    // cầu tàu
    c.fillStyle = '#a0703c'; c.fillRect(DOCK.x - 40, DOCK.y - 110, 80, 110);
    c.fillStyle = '#7a4a26'; for (let k = 0; k < 6; k++) c.fillRect(DOCK.x - 40, DOCK.y - 110 + k * 18, 80, 3);
    // thuyền neo sẵn
    boat(c, DOCK.x + 90, DOCK.y - 60, 0, '#ff8787', true);
    boat(c, DOCK.x + 170, DOCK.y - 100, 0, '#74c0fc', true);
  }
  /** Thuyền chèo (vẽ phần sau, rồi người, rồi mạn trước) */
  function boat(c, x, y, t, col = '#ff8787', whole = false) {
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x, y + 6, 62, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 60, y - 22); c.quadraticCurveTo(x, y + 14, x + 60, y - 22); c.lineTo(x + 48, y - 4); c.quadraticCurveTo(x, y + 8, x - 48, y - 4); c.closePath(); c.fill();
    if (whole) boatFront(c, x, y, t, col);
  }
  function boatFront(c, x, y, t, col = '#ff8787') {
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 62, y - 26); c.quadraticCurveTo(x, y + 4, x + 62, y - 26); c.quadraticCurveTo(x, y + 18, x - 62, y - 26); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 62, y - 26); c.quadraticCurveTo(x, y + 4, x + 62, y - 26); c.quadraticCurveTo(x, y - 2, x - 62, y - 26); c.fill();
    c.strokeStyle = '#8a5a3c'; c.lineWidth = 4; const a = Math.sin(t * 3) * 0.5;
    c.beginPath(); c.moveTo(x - 20, y - 30); c.lineTo(x - 70 - Math.cos(a) * 10, y + 4 + Math.sin(a) * 10); c.stroke();
    c.beginPath(); c.moveTo(x + 20, y - 30); c.lineTo(x + 70 + Math.cos(a) * 10, y + 4 + Math.sin(a) * 10); c.stroke();
  }

  /* ---------- Hoạt động ---------- */
  /** Ngủ trong lều (mỗi 30 phút được +25 XP) */
  function sleep(x, y, col) {
    const s = st();
    AV.startPose('tent', '⛺ Đang ngủ trong lều', { x, y: y - 6, dir: 1, sortY: y + 1, clipY: y - 400, front: (g, t) => tentFront(g, x, y, col, t), back: [x, y + 30] });
    if (Date.now() - (s.sleep || 0) > SLEEP_MIN * 60000) { s.sleep = Date.now(); AV.earn(0, 25); UI.toast('😴 Giấc ngủ ngon giữa vườn anh đào! +25 XP', 3500); AV.markChanged(); }
  }
  function toilet() {
    AV.S.belly = { v: 0, at: Date.now() };
    UI.toast('🚽 Đi vệ sinh xong, nhẹ cả người! Bụng trống rồi — ăn tiếp được rồi 😆', 3500);
    AV.markChanged();
  }
  /** Chèo thuyền một vòng quanh hồ */
  let rowing = false;
  function row() {
    const P = AV.player;
    if (rowing || !P) return;
    if (!AV.spend(BOAT_PRICE)) return;
    rowing = true; P.boat = true;
    UI.toast(`🚣 Thuê thuyền (${BOAT_PRICE} xu) — chèo một vòng quanh hồ!`);
    const pts = []; for (let k = 0; k <= 40; k++) { const a = Math.PI * 0.75 - (k / 40) * Math.PI * 2; pts.push([LAKE.x + Math.cos(a) * (LAKE.rx - 80), LAKE.y + 30 + Math.sin(a) * (LAKE.ry - 50)]); }
    const t0 = performance.now(), dur = 22000;
    const step = () => {
      const u = Math.min(1, (performance.now() - t0) / dur), f = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), r = f - i;
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      P.x = x0 + (x1 - x0) * r; P.y = y0 + (y1 - y0) * r; P.dir = x1 >= x0 ? 1 : -1; P.target = null; P.path = [];
      if (u < 1 && rowing) requestAnimationFrame(step);
      else {
        rowing = false; P.boat = false; P.x = DOCK.x; P.y = DOCK.y + 34;
        const s = st();
        if (Date.now() - (s.boat || 0) > 5 * 60000) { s.boat = Date.now(); AV.earn(0, 15); UI.toast('🚣 Chèo thuyền vui quá! +15 XP'); AV.markChanged(); } else UI.toast('🚣 Đã cập bến!');
      }
    };
    requestAnimationFrame(step);
  }
  const inPool = (x, y) => x > POOL.x + 6 && x < POOL.x + POOL.w - 6 && y > POOL.y + 14 && y < POOL.y + POOL.h;

  return { POOL, LAKE, DOCK, sakura, tent, campfire, picnic, wc, pool, umbrella, lake, boat, boatFront, sleep, toilet, row, inPool, get rowing() { return rowing; } };
})();
