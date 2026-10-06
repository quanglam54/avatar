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
    c.fillStyle = '#c8874a'; c.beginPath(); c.roundRect(-82, -42, 60, 28, 6); c.fill();
    c.font = '20px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(['🍉', '🍙', '🧃'][k % 3], -66, -30); c.fillText(['🍗', '🍓', '🥪'][k % 3], -38, -30);
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

  /* ---------- Bàn BBQ có bếp nướng than ở giữa ---------- */
  function stool(c, x, y) {
    c.fillStyle = '#8a5a3c'; c.fillRect(x - 3, y - 18, 6, 18);
    c.fillStyle = '#c92a2a'; c.beginPath(); c.ellipse(x, y - 20, 16, 7, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.ellipse(x - 4, y - 22, 6, 2, 0, 0, Math.PI * 2); c.fill();
  }
  function bbqTable(c, x, y, t) {
    [-45, 45].forEach((dx) => stool(c, x + dx, y - 44));
    c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(x, y + 4, 92, 16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6b4226'; c.fillRect(x - 70, y - 26, 10, 30); c.fillRect(x + 60, y - 26, 10, 30);
    c.fillStyle = '#a0703c'; c.beginPath(); c.roundRect(x - 84, y - 60, 168, 40, 8); c.fill();
    c.fillStyle = '#7a4a26'; c.fillRect(x - 84, y - 24, 168, 8);
    c.fillStyle = 'rgba(255,255,255,.12)'; for (let k = 0; k < 4; k++) c.fillRect(x - 80, y - 56 + k * 9, 160, 2);
    // bếp than tròn giữa bàn
    c.fillStyle = '#343a40'; c.beginPath(); c.ellipse(x, y - 42, 30, 13, 0, 0, Math.PI * 2); c.fill();
    const glow = 0.6 + 0.4 * Math.sin(t * 5);
    c.fillStyle = `rgba(255,${90 + glow * 60},40,1)`; c.beginPath(); c.ellipse(x, y - 43, 24, 9, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#adb5bd'; c.lineWidth = 1.6;
    for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(x + k * 7, y - 51); c.lineTo(x + k * 7, y - 35); c.stroke(); }
    // thịt, xiên đang nướng
    [[-12, -45, '#b5651d'], [4, -42, '#c0763b'], [14, -46, '#a0522d']].forEach(([dx, dy, col]) => { c.fillStyle = col; c.beginPath(); c.roundRect(x + dx - 6, y + dy - 3, 12, 6, 2); c.fill(); });
    c.strokeStyle = '#e9c46a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 20, y - 38); c.lineTo(x + 22, y - 50); c.stroke();
    // đĩa, ly, rau
    [[-62, '🥬'], [62, '🥤']].forEach(([dx, ic]) => { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x + dx, y - 42, 13, 6, 0, 0, Math.PI * 2); c.fill(); c.font = '14px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ic, x + dx, y - 46); });
    // khói bay lên
    for (let k = 0; k < 4; k++) { const ph = (t * 0.5 + k / 4) % 1; c.fillStyle = `rgba(230,230,230,${0.45 * (1 - ph)})`; c.beginPath(); c.arc(x + Math.sin(t * 2 + k) * 8, y - 56 - ph * 60, 6 + ph * 10, 0, Math.PI * 2); c.fill(); }
  }
  function bbqStoolsFront(c, x, y) { [-45, 45].forEach((dx) => stool(c, x + dx, y + 22)); }

  /* ---------- Trong nhà vệ sinh ---------- */
  const STALLS = [[200, 'nam'], [340, 'nam'], [480, 'nam'], [920, 'nu'], [1060, 'nu'], [1200, 'nu']];
  let inStall = -1;
  function wcFloor(g, W, H) {
    g.fillStyle = '#e9ecef'; g.fillRect(0, 0, W, H);
    // tường trên: nam xanh, nữ hồng
    g.fillStyle = '#d0ebff'; g.fillRect(40, 20, 640, 260); g.fillStyle = '#ffdeeb'; g.fillRect(720, 20, 640, 260);
    for (let x = 40; x < 1360; x += 40) for (let y = 20; y < 280; y += 40) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.strokeRect(x, y, 40, 40); }
    // sàn gạch ô vuông
    for (let x = 40; x < 1360; x += 60) for (let y = 280; y < 860; y += 60) { g.fillStyle = (x / 60 + y / 60) % 2 < 1 ? '#f8f9fa' : '#dee2e6'; g.fillRect(x, y, 60, 60); }
    // vách ngăn nam / nữ
    g.fillStyle = '#868e96'; g.fillRect(680, 20, 40, 620);
    // sảnh rửa tay chung phía dưới
    g.fillStyle = 'rgba(255,236,153,.25)'; g.fillRect(40, 640, 1320, 220);
    g.fillStyle = '#343a40'; g.fillRect(0, 860, W, 40); g.fillRect(0, 0, 40, H); g.fillRect(W - 40, 0, 40, H);
  }
  function wcSign(c, x, y, nu) {
    c.fillStyle = nu ? '#e64980' : '#1971c2'; c.beginPath(); c.roundRect(x - 90, y - 30, 180, 60, 14); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
    c.font = '900 26px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    c.fillText(nu ? '🚺 NỮ' : '🚹 NAM', x, y + 1);
  }
  function wcStall(c, x, i) {
    const nu = STALLS[i][1] === 'nu', busy = inStall === i;
    c.fillStyle = '#ced4da'; c.fillRect(x - 64, 120, 8, 260); c.fillRect(x + 56, 120, 8, 260);
    c.fillStyle = nu ? '#f783ac' : '#4dabf7'; c.beginPath(); c.roundRect(x - 54, 130, 108, 245, 6); c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x - 46, 140, 20, 225);
    c.fillStyle = '#adb5bd'; c.beginPath(); c.arc(x + 38, 260, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = busy ? '#e03131' : '#2f9e44'; c.beginPath(); c.roundRect(x + 24, 230, 28, 12, 4); c.fill();
    c.font = '800 12px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    c.fillText(busy ? 'CÓ NGƯỜI' : 'TRỐNG', x, 160);
    c.font = '900 22px system-ui'; c.fillText(nu ? '🚺' : '🚹', x, 200);
  }
  function wcSink(c, x, y) {
    c.fillStyle = '#adb5bd'; c.fillRect(x - 4, y - 50, 8, 50);
    c.fillStyle = '#f8f9fa'; c.beginPath(); c.roundRect(x - 50, y - 74, 100, 30, 10); c.fill(); c.strokeStyle = '#ced4da'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#74c0fc'; c.beginPath(); c.ellipse(x, y - 62, 32, 8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#868e96'; c.fillRect(x - 3, y - 92, 6, 20); c.fillRect(x - 3, y - 92, 16, 5);
    // gương
    c.fillStyle = '#ced4da'; c.beginPath(); c.roundRect(x - 40, y - 190, 80, 90, 10); c.fill();
    const g = c.createLinearGradient(x - 34, y - 184, x + 34, y - 106); g.addColorStop(0, '#e7f5ff'); g.addColorStop(1, '#a5d8ff');
    c.fillStyle = g; c.beginPath(); c.roundRect(x - 34, y - 184, 68, 78, 8); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(x - 24, y - 178); c.lineTo(x - 10, y - 178); c.lineTo(x - 30, y - 140); c.lineTo(x - 30, y - 160); c.closePath(); c.fill();
  }
  /** Vào buồng: nhân vật khuất sau cửa vài giây */
  function useStall(i) {
    const P = AV.player;
    if (inStall >= 0 || !P) return;
    inStall = i;
    P.x = STALLS[i][0]; P.y = 400; P.hidden = true; P.target = null; P.path = [];
    UI.toast('🚽 Đang đi vệ sinh…', 2500);
    setTimeout(() => { inStall = -1; P.hidden = false; P.y = 420; toilet(); }, 3000);
  }
  function washHands() {
    UI.toast('🧼 Rửa tay sạch sẽ! ✨', 2500);
    if (AV.player) AV.showBubble && AV.showBubble(AV.player, '🫧 Thơm tay rồi~');
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

  return { POOL, LAKE, DOCK, bbqTable, bbqStoolsFront, wcFloor, wcStall, wcSink, wcSign, useStall, washHands, STALLS, sakura, tent, campfire, picnic, wc, pool, umbrella, lake, boat, boatFront, sleep, toilet, row, inPool, get rowing() { return rowing; } };
})();
