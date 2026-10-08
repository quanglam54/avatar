/* 📸 QUANG LÂM PHOTOBOOTH — quầy chụp ảnh ở Khu mua sắm.
 * 7.000 xu / lượt, trong lượt (20 phút) chụp thoải mái. Chụp chung với mọi người đang đứng gần quầy.
 * Phông nền + phụ kiện (mũ, kính, đồ cầm tay) phải THUÊ thêm cho từng lượt; khung ảnh miễn phí.
 * Phối đồ bằng tủ "✨ Đồ của tôi". Ảnh xong: tải về máy hoặc đăng ZenoGram. */
const BOOTH = (() => {
  const PRICE = 7000, SESSION_MIN = 20, NEAR = 520, MAX_PEOPLE = 6, K = 0.72;
  /** vị trí quầy (đặt cạnh quán trà đá ở nông trại) */
  let BX = 2285, BY = 1458, MAP = 'farm';
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 🎨 phông nền ---------- */
  const BACKDROPS = [
    { id: 'studio', name: 'Studio trắng', icon: '⬜', price: 0 },
    { id: 'pastel', name: 'Pastel kẹo ngọt', icon: '🍬', price: 1000 },
    { id: 'sakura', name: 'Hoa anh đào', icon: '🌸', price: 2000 },
    { id: 'beach', name: 'Biển hoàng hôn', icon: '🌅', price: 2500 },
    { id: 'neon', name: 'Sân khấu neon', icon: '🎤', price: 2500 },
    { id: 'love', name: 'Trái tim hồng', icon: '💗', price: 1500 },
    { id: 'noel', name: 'Giáng sinh tuyết', icon: '🎄', price: 2000 },
    { id: 'galaxy', name: 'Dải ngân hà', icon: '🌌', price: 3000 },
  ];
  /* ---------- 👑 phụ kiện thuê ---------- */
  const PROPS = [
    { id: 'crown', slot: 'hat', name: 'Vương miện', icon: '👑', price: 2000 },
    { id: 'tophat', slot: 'hat', name: 'Mũ ảo thuật', icon: '🎩', price: 1500 },
    { id: 'bow', slot: 'hat', name: 'Nơ đỏ', icon: '🎀', price: 800 },
    { id: 'flowers', slot: 'hat', name: 'Vòng hoa', icon: '🌸', price: 1200 },
    { id: 'party', slot: 'hat', name: 'Mũ sinh nhật', icon: '🥳', price: 1000 },
    { id: 'bunny', slot: 'hat', name: 'Tai thỏ', icon: '🐰', price: 1500 },
    { id: 'cat', slot: 'hat', name: 'Tai mèo', icon: '🐱', price: 1200 },
    { id: 'halo', slot: 'hat', name: 'Hào quang thiên thần', icon: '😇', price: 1000 },
    { id: 'shades', slot: 'eye', name: 'Kính râm', icon: '🕶️', price: 800 },
    { id: 'heart', slot: 'eye', name: 'Kính trái tim', icon: '💕', price: 1200 },
    { id: 'star', slot: 'eye', name: 'Kính ngôi sao', icon: '⭐', price: 1200 },
    { id: 'nerd', slot: 'eye', name: 'Kính cận tròn', icon: '🤓', price: 600 },
    { id: 'bouquet', slot: 'hand', name: 'Bó hoa', icon: '💐', price: 1500 },
    { id: 'rose', slot: 'hand', name: 'Hoa hồng', icon: '🌹', price: 800 },
    { id: 'balloon', slot: 'hand', name: 'Bóng bay', icon: '🎈', price: 800 },
    { id: 'teddy', slot: 'hand', name: 'Gấu bông', icon: '🧸', price: 1500 },
    { id: 'cake', slot: 'hand', name: 'Bánh kem', icon: '🎂', price: 1500 },
    { id: 'icecream', slot: 'hand', name: 'Kem ốc quế', icon: '🍦', price: 500 },
    { id: 'lovesign', slot: 'hand', name: 'Bảng LOVE', icon: '💌', price: 1000 },
    { id: 'mic', slot: 'hand', name: 'Micro', icon: '🎙️', price: 1000 },
  ];
  const FRAMES = [
    { id: 'pink', name: 'Hồng', bg: '#ffdeeb', ink: '#c2255c' },
    { id: 'white', name: 'Trắng', bg: '#ffffff', ink: '#495057' },
    { id: 'black', name: 'Phim đen', bg: '#1a1b1e', ink: '#f8f9fa' },
    { id: 'mint', name: 'Bạc hà', bg: '#d3f9d8', ink: '#2b8a3e' },
    { id: 'sky', name: 'Xanh trời', bg: '#d0ebff', ink: '#1864ab' },
  ];
  const SLOTS = [['hat', '👑 Mũ & cài tóc'], ['eye', '🕶️ Kính'], ['hand', '💐 Đồ cầm tay']];
  const POSE_STICKERS = ['✌️', '😘', '🤪', '💖', '✨', '😎'];

  /** lượt chụp hiện tại: { until, rent: Set(id), dress: { pid: { hat, eye, hand } }, bg, frame, layout, skip: Set(pid) } */
  let sess = null;
  const live = () => !!(sess && sess.until > Date.now());

  /* ================= 🏪 quầy chụp ngoài phố ================= */
  function drawKiosk(c, x, y) {
    c.save();
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 2, 92, 12, 0, 0, 7); c.fill();
    // thân quầy
    const g = c.createLinearGradient(x - 85, 0, x + 85, 0); g.addColorStop(0, '#9c36b5'); g.addColorStop(0.5, '#cc5de8'); g.addColorStop(1, '#9c36b5');
    c.fillStyle = g; c.beginPath(); c.roundRect(x - 85, y - 230, 170, 230, [14, 14, 4, 4]); c.fill();
    c.strokeStyle = '#2b1a10'; c.lineWidth = 3; c.stroke();
    // rèm đỏ
    c.fillStyle = '#c92a2a'; c.beginPath(); c.roundRect(x - 62, y - 168, 82, 166, 6); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 3;
    for (let k = 0; k < 5; k++) { const fx = x - 54 + k * 16; c.beginPath(); c.moveTo(fx, y - 164); c.quadraticCurveTo(fx + 5, y - 85, fx, y - 6); c.stroke(); }
    c.fillStyle = '#ffd43b'; c.fillRect(x - 64, y - 172, 86, 6);
    // màn hình + nút
    c.fillStyle = '#212529'; c.beginPath(); c.roundRect(x + 28, y - 160, 48, 62, 6); c.fill();
    const sg = c.createLinearGradient(0, y - 156, 0, y - 104); sg.addColorStop(0, '#74c0fc'); sg.addColorStop(1, '#f783ac');
    c.fillStyle = sg; c.fillRect(x + 32, y - 156, 40, 54);
    c.font = '20px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('📸', x + 52, y - 130);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x + 28, y - 90, 48, 30, 6); c.fill();
    c.fillStyle = '#c2255c'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.fillText('7K', x + 52, y - 80); c.font = '800 8px "Be Vietnam Pro", system-ui'; c.fillText('/LƯỢT', x + 52, y - 68);
    // biển hiệu có bóng đèn
    c.fillStyle = '#ffe3f1'; c.beginPath(); c.roundRect(x - 92, y - 290, 184, 62, 12); c.fill();
    c.strokeStyle = '#2b1a10'; c.lineWidth = 3; c.stroke();
    for (let k = 0; k < 12; k++) { c.fillStyle = k % 2 ? '#ffd43b' : '#fff9db'; c.beginPath(); c.arc(x - 82 + k * 15, y - 284, 3.2, 0, 7); c.fill(); c.beginPath(); c.arc(x - 82 + k * 15, y - 234, 3.2, 0, 7); c.fill(); }
    c.fillStyle = '#ae3ec9'; c.font = '900 15px "Be Vietnam Pro", system-ui'; c.fillText('QUANG LÂM', x, y - 268);
    c.fillStyle = '#e64980'; c.font = 'italic 900 19px "Be Vietnam Pro", system-ui'; c.fillText('Photobooth', x, y - 248);
    c.restore();
  }
  function addTo(m, h, x, y) {
    BX = x; BY = y + 30; MAP = m.id;
    h.sobj(m, x, y, (c) => { c.save(); c.translate(x, y); c.scale(K, K); c.translate(-x, -y); drawKiosk(c, x, y); c.restore(); }, { l: -100 * K, t: -300 * K, w: 200 * K, h: 312 * K });
    m.objects[m.objects.length - 1].b3d = { w: 170 * K, h: 230 * K, roof: '#9c36b5', wall: '#cc5de8' };
    h.col(m, x - 60 * K, y - 34, 120 * K, 32);
    h.inter(m, { x: x - 85 * K, y: y - 290 * K, w: 170 * K, h: 290 * K, ax: x, ay: y + 30, name: 'Quang Lâm Photobooth (7.000 xu/lượt, chụp thoải mái)', use: () => open(), arrow: { x, y: y - 300 * K, text: 'Photobooth' } });
  }

  /* ================= 🖼️ vẽ ảnh ================= */
  function people() {
    const me = { id: 'me', name: AV.S.name, look: AV.S.look };
    const others = (typeof NET !== 'undefined' ? NET.players() : []).filter((r) => !r.hidden && r.look && Math.hypot((r.rx ?? r.x) - BX, (r.ry ?? r.y) - BY) < NEAR)
      .map((r) => ({ id: 'p' + (r.id || r.name), name: r.name || 'Bạn', look: r.look }));
    return [me, ...others].slice(0, MAX_PEOPLE);
  }
  function backdrop(g, w, h, id, t) {
    const lin = (a, b, c3) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); if (c3) { gr.addColorStop(0.6, b); gr.addColorStop(1, c3); } else gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
    const emo = (ch, n, size, seed) => { g.font = `${size}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let k = 0; k < n; k++) { const a = Math.sin(k * 12.9898 + seed) * 43758.5453, r = a - Math.floor(a), b = Math.sin(k * 78.233 + seed) * 12345.678, r2 = b - Math.floor(b); g.globalAlpha = 0.55 + r2 * 0.4; g.fillText(ch, r * w, (r2 * h * 0.8 + t * 8 * (k % 3 + 1)) % (h * 0.85)); } g.globalAlpha = 1; };
    if (id === 'pastel') { lin('#ffdeeb', '#e5dbff', '#d0ebff'); emo('🍭', 7, 26, 1); emo('☁️', 5, 34, 2); }
    else if (id === 'sakura') { lin('#fff0f6', '#fcc2d7'); g.fillStyle = '#8c5e3c'; g.fillRect(w * 0.08, h * 0.15, 10, h * 0.7); g.fillRect(w * 0.88, h * 0.1, 10, h * 0.75); g.fillStyle = '#faa2c1'; for (const cx of [w * 0.08, w * 0.9]) for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(cx + Math.cos(k) * 40, h * 0.18 + Math.sin(k * 2) * 26, 34, 0, 7); g.fill(); } emo('🌸', 14, 18, 3); }
    else if (id === 'beach') { lin('#ff922b', '#ffc078', '#ffe8cc'); g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(w * 0.72, h * 0.42, 46, 0, 7); g.fill(); g.fillStyle = '#4dabf7'; g.fillRect(0, h * 0.5, w, h * 0.22); g.fillStyle = '#ffe8a1'; g.fillRect(0, h * 0.72, w, h); emo('🌴', 2, 70, 4); }
    else if (id === 'neon') { lin('#1b1035', '#3b0764'); for (let k = 0; k < 7; k++) { g.strokeStyle = ['#f06595', '#4dabf7', '#ffd43b', '#69db7c'][k % 4]; g.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3 + k); g.lineWidth = 10; g.beginPath(); g.moveTo(w / 2, -10); g.lineTo(k * w / 6, h); g.stroke(); } g.globalAlpha = 1; g.font = '900 34px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.shadowColor = '#f06595'; g.shadowBlur = 16; g.fillStyle = '#ffdeeb'; g.fillText('PARTY TIME', w / 2, h * 0.14); g.shadowBlur = 0; }
    else if (id === 'love') { lin('#ffc9e0', '#f783ac'); emo('💗', 16, 30, 5); g.font = '120px system-ui'; g.textAlign = 'center'; g.globalAlpha = 0.25; g.fillText('❤️', w / 2, h * 0.4); g.globalAlpha = 1; }
    else if (id === 'noel') { lin('#1c3d5a', '#2b6b8f', '#e7f5ff'); emo('❄️', 18, 18, 6); g.font = '90px system-ui'; g.textAlign = 'center'; g.fillText('🎄', w * 0.1, h * 0.55); g.fillText('🎁', w * 0.92, h * 0.68); }
    else if (id === 'galaxy') { const gr = g.createRadialGradient(w * 0.6, h * 0.35, 10, w * 0.5, h * 0.5, w * 0.8); gr.addColorStop(0, '#9775fa'); gr.addColorStop(0.5, '#3b2a7a'); gr.addColorStop(1, '#0b0920'); g.fillStyle = gr; g.fillRect(0, 0, w, h); emo('✦', 30, 10, 7); emo('🪐', 1, 50, 8); }
    else { lin('#ffffff', '#f1f3f5'); g.fillStyle = 'rgba(0,0,0,.05)'; g.beginPath(); g.ellipse(w / 2, h * 0.86, w * 0.42, 26, 0, 0, 7); g.fill(); }
  }
  /** phụ kiện vẽ theo vị trí đầu / mắt / tay (tỉ lệ k = chiều cao nhân vật / 100) */
  function drawProp(g, id, x, top, k, dir) {
    const p = PROPS.find((q) => q.id === id);
    if (!p) return;
    const emoji = (ch, px, py, size, rot = 0) => { g.save(); g.globalAlpha = 1; g.fillStyle = '#000'; g.shadowBlur = 0; g.translate(px, py); g.rotate(rot); g.font = `${size}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 0, 0); g.restore(); };
    const eyeY = top + 41 * k, hx = x + dir * 30 * k, hy = top + 68 * k;
    g.save();
    switch (id) {
      case 'crown': emoji('👑', x, top + 2 * k, 34 * k); break;
      case 'tophat': emoji('🎩', x, top - 4 * k, 40 * k); break;
      case 'bow': emoji('🎀', x + 16 * k, top + 6 * k, 22 * k, 0.3); break;
      case 'flowers': for (let i = -2; i <= 2; i++) emoji(i % 2 ? '🌼' : '🌸', x + i * 11 * k, top + 6 * k + Math.abs(i) * 3 * k, 15 * k); break;
      case 'party': { g.fillStyle = '#4dabf7'; g.beginPath(); g.moveTo(x - 13 * k, top + 6 * k); g.lineTo(x + 13 * k, top + 6 * k); g.lineTo(x + 3 * k, top - 30 * k); g.closePath(); g.fill(); g.strokeStyle = '#ffd43b'; g.lineWidth = 3 * k; g.beginPath(); g.moveTo(x - 8 * k, top - 4 * k); g.lineTo(x + 8 * k, top - 8 * k); g.stroke(); g.fillStyle = '#ff6b6b'; g.beginPath(); g.arc(x + 3 * k, top - 31 * k, 5 * k, 0, 7); g.fill(); break; }
      case 'bunny': case 'cat': {
        const col = id === 'bunny' ? '#fff' : '#343a40', inn = '#ffc9de';
        for (const s of [-1, 1]) {
          g.save(); g.translate(x + s * 14 * k, top + 8 * k); g.rotate(s * 0.25);
          g.fillStyle = col; g.strokeStyle = '#2b1a10'; g.lineWidth = 2 * k; g.beginPath();
          if (id === 'bunny') g.ellipse(0, -22 * k, 8 * k, 22 * k, 0, 0, 7); else { g.moveTo(-10 * k, 0); g.lineTo(0, -20 * k); g.lineTo(10 * k, 0); g.closePath(); }
          g.fill(); g.stroke();
          g.fillStyle = inn; g.beginPath(); if (id === 'bunny') g.ellipse(0, -22 * k, 4 * k, 15 * k, 0, 0, 7); else { g.moveTo(-5 * k, -2 * k); g.lineTo(0, -13 * k); g.lineTo(5 * k, -2 * k); g.closePath(); } g.fill();
          g.restore();
        }
        break;
      }
      case 'halo': g.strokeStyle = '#ffd43b'; g.shadowColor = '#fff3bf'; g.shadowBlur = 12; g.lineWidth = 5 * k; g.beginPath(); g.ellipse(x, top - 8 * k, 20 * k, 6 * k, 0, 0, 7); g.stroke(); break;
      case 'shades': { g.fillStyle = '#111'; for (const s of [-1, 1]) { g.beginPath(); g.roundRect(x + s * 11 * k - 9 * k, eyeY - 5 * k, 18 * k, 11 * k, 4 * k); g.fill(); } g.fillRect(x - 3 * k, eyeY - 3 * k, 6 * k, 2.5 * k); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - 17 * k, eyeY - 3 * k, 5 * k, 2 * k); break; }
      case 'heart': for (const s of [-1, 1]) emoji('❤️', x + s * 11 * k, eyeY, 19 * k); break;
      case 'star': for (const s of [-1, 1]) emoji('⭐', x + s * 11 * k, eyeY, 20 * k); break;
      case 'nerd': { g.strokeStyle = '#2b1a10'; g.lineWidth = 2.4 * k; for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * 11 * k, eyeY, 7.5 * k, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(x - 3.5 * k, eyeY); g.lineTo(x + 3.5 * k, eyeY); g.stroke(); break; }
      case 'balloon': { g.strokeStyle = '#495057'; g.lineWidth = 1.5 * k; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo(hx + dir * 14 * k, top - 10 * k, hx + dir * 6 * k, top - 34 * k); g.stroke(); emoji('🎈', hx + dir * 6 * k, top - 48 * k, 34 * k); break; }
      case 'lovesign': { g.fillStyle = '#c2255c'; g.fillRect(hx - 1.5 * k, hy - 4 * k, 3 * k, 30 * k); g.fillStyle = '#fff'; g.strokeStyle = '#c2255c'; g.lineWidth = 2.5 * k; g.beginPath(); g.roundRect(hx - 24 * k, hy - 28 * k, 48 * k, 24 * k, 5 * k); g.fill(); g.stroke(); g.fillStyle = '#e64980'; g.font = `900 ${12 * k}px "Be Vietnam Pro", system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LOVE ♥', hx, hy - 16 * k); break; }
      default: emoji(p.icon, hx, hy, (id === 'teddy' || id === 'cake' || id === 'bouquet' ? 30 : 24) * k, dir * 0.15);
    }
    g.restore();
  }
  /** 1 khung ảnh: phông + mọi người + phụ kiện + sticker theo dáng */
  function drawShot(g, w, h, list, pose, t) {
    backdrop(g, w, h, sess.bg, t);
    const n = list.length, k = Math.min(3.2, (h * 0.62) / 100, (w / Math.max(1, n)) / 62), base = h * 0.9;
    list.forEach((p, i) => {
      const x = w / 2 + (i - (n - 1) / 2) * Math.min(w / (n + 0.3), 70 * k);
      let dir = 1, dy = 0;
      if (pose === 1) dir = x < w / 2 ? 1 : -1;
      if (pose === 3) dy = -Math.abs(Math.sin(i * 1.7 + 1)) * 16 * k;
      if (pose === 2 && i % 2) dir = -1;
      const y = base + dy, top = y - 100 * k;
      try { ART.character(g, x, y, p.look, { scale: 1.18 * k, t: pose === 2 ? t + i : 0, dir, dance: pose === 2, hires: Math.min(4, Math.ceil(k * 1.2)) }); } catch (e) { /* bỏ qua */ }
      g.globalAlpha = 1; g.shadowBlur = 0;
      const d = (sess.dress[p.id]) || {};
      ['hat', 'eye', 'hand'].forEach((s) => { if (d[s]) drawProp(g, d[s], x, top, k, dir); });
      if (pose >= 1) { g.fillStyle = '#000'; g.font = `${18 * k}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(POSE_STICKERS[(pose * 3 + i) % POSE_STICKERS.length], x + 30 * k, top + 4 * k); }
    });
  }
  /** ảnh hoàn chỉnh có khung: layout 'one' (1 ảnh) | 'strip' (dải 4 ảnh) */
  function compose(list) {
    const fr = FRAMES.find((f) => f.id === sess.frame) || FRAMES[0], P = 26, FOOT = 74;
    const strip = sess.layout === 'strip', sw = strip ? 420 : 900, sh = strip ? 315 : 640, n = strip ? 4 : 1;
    const cv = document.createElement('canvas');
    cv.width = sw + P * 2; cv.height = P + n * (sh + (strip ? 16 : 0)) - (strip ? 16 : 0) + FOOT + P / 2;
    const g = cv.getContext('2d');
    g.fillStyle = fr.bg; g.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < n; i++) {
      const sc = document.createElement('canvas'); sc.width = sw; sc.height = sh;
      drawShot(sc.getContext('2d'), sw, sh, list, strip ? i : (sess.pose || 0), 0.4 + i);
      const y = P + i * (sh + 16);
      g.save(); g.beginPath(); g.roundRect(P, y, sw, sh, 10); g.clip(); g.drawImage(sc, P, y); g.restore();
    }
    const fy = cv.height - FOOT;
    g.fillStyle = fr.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `italic 900 ${strip ? 26 : 34}px "Be Vietnam Pro", system-ui`; g.fillText('📸 Quang Lâm Photobooth', cv.width / 2, fy + 22);
    g.font = `700 ${strip ? 13 : 16}px "Be Vietnam Pro", system-ui`;
    const d = new Date();
    g.fillText(`${list.map((p) => p.name).join(' · ').slice(0, 60)} — ${d.toLocaleDateString('vi-VN')}`, cv.width / 2, fy + 52);
    return cv;
  }

  /* ================= 🧑‍🎤 quầy chụp ================= */
  let panelRef = null, raf = 0;
  function open() {
    if (panelRef) return;
    const p = UI.panel('📸 Quang Lâm Photobooth', '', { wide: true, onClose: () => { cancelAnimationFrame(raf); panelRef = null; } });
    panelRef = p;
    if (!live()) return intro(p);
    studio(p);
  }
  function intro(p) {
    const ppl = people();
    p.body.innerHTML = `<div class="pb-intro"><div class="pb-hero">📸</div>
      <h3>Quang Lâm Photobooth</h3>
      <p>Chụp ảnh nhân vật cùng bạn bè · phối đồ · thuê phụ kiện xinh xắn.</p>
      <div class="pb-price"><b>${fmt(PRICE)} xu</b> / lượt · chụp <b>thoải mái</b> trong ${SESSION_MIN} phút</div>
      <p class="muted">Sẽ có mặt trong ảnh (đứng gần quầy): <b>${ppl.map((x) => esc(x.name)).join(', ')}</b>${ppl.length < 2 ? '<br>💡 Rủ bạn bè đứng cạnh quầy để chụp chung nhé!' : ''}</p>
      <p class="muted">🎨 Phông nền & 👑 phụ kiện thuê riêng từng món (500 – 3.000 xu) · 🖼️ khung ảnh miễn phí</p>
      <button class="btn" data-pay>💳 Trả ${fmt(PRICE)} xu & vào chụp</button></div>`;
    p.body.querySelector('[data-pay]').onclick = () => {
      if (!AV.spend(PRICE)) return UI.toast(`Cần ${fmt(PRICE)} xu để chụp 😢`);
      sess = { until: Date.now() + SESSION_MIN * 60000, rent: new Set(['studio']), dress: {}, bg: 'studio', frame: 'pink', layout: 'strip', pose: 0, skip: new Set() };
      UI.toast('📸 Chào mừng tới Quang Lâm Photobooth! Chụp thoải mái nhé ✨', 3500);
      studio(p);
    };
  }
  function studio(p) {
    let tab = 'bg', who = 'me';
    const list = () => people().filter((x) => !sess.skip.has(x.id));
    const render = () => {
      if (!live()) { sess = null; UI.toast('⌛ Hết lượt chụp rồi — trả thêm để chụp tiếp nhé'); return intro(p); }
      const all = people(), left = Math.max(0, sess.until - Date.now()), mm = Math.floor(left / 60000), ss = Math.floor(left / 1000) % 60;
      const items = tab === 'bg' ? BACKDROPS : tab === 'frame' ? FRAMES : PROPS.filter((x) => x.slot === tab);
      const d = sess.dress[who] || {};
      p.body.innerHTML = `<div class="pb-wrap">
        <div class="pb-left"><canvas class="pb-prev" width="640" height="480"></canvas><div class="pb-flash"></div><div class="pb-count"></div>
          <div class="pb-ppl">${all.map((x) => `<button class="${sess.skip.has(x.id) ? 'off' : ''} ${who === x.id ? 'sel' : ''}" data-who="${esc(x.id)}">${x.id === 'me' ? '🙋' : '🧑'} ${esc(x.name)}</button>`).join('')}</div>
          <small class="muted">Bấm tên để chọn người đeo phụ kiện · bấm lần nữa để ẩn/hiện người đó trong ảnh</small></div>
        <div class="pb-right">
          <div class="pb-time">⏳ Còn <b>${mm}:${String(ss).padStart(2, '0')}</b> · 💰 ${fmt(AV.S.coins)} xu</div>
          <div class="pb-tabs">${[['bg', '🎨 Phông'], ...SLOTS.map((s) => [s[0], s[1].split(' ')[0] + ' ' + s[1].split(' ')[1]]), ['frame', '🖼️ Khung']].map((t) => `<button class="${tab === t[0] ? 'on' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>
          <div class="pb-items">${tab === 'frame' ? items.map((f) => `<button class="pb-it ${sess.frame === f.id ? 'on' : ''}" data-frame="${f.id}"><span style="background:${f.bg};border:2px solid ${f.ink}" class="pb-sw"></span><b>${f.name}</b><small>Miễn phí</small></button>`).join('')
            : (tab !== 'bg' ? `<button class="pb-it ${!d[tab] ? 'on' : ''}" data-off="${tab}"><span>🚫</span><b>Không đeo</b><small>&nbsp;</small></button>` : '')
              + items.map((it) => { const has = it.price === 0 || sess.rent.has(it.id), on = tab === 'bg' ? sess.bg === it.id : d[tab] === it.id; return `<button class="pb-it ${on ? 'on' : ''} ${has ? '' : 'lock'}" data-item="${it.id}"><span>${it.icon}</span><b>${it.name}</b><small>${has ? (on ? 'Đang dùng' : 'Đã thuê ✓') : 'Thuê ' + fmt(it.price) + ' xu'}</small></button>`; }).join('')}</div>
          <div class="pb-opts"><span>Kiểu ảnh:</span><button class="${sess.layout === 'strip' ? 'on' : ''}" data-lay="strip">🎞️ Dải 4 tấm</button><button class="${sess.layout === 'one' ? 'on' : ''}" data-lay="one">🖼️ 1 tấm lớn</button></div>
          <div class="pb-acts"><button class="btn ghost" data-wear>👗 Phối đồ</button><button class="btn" data-shoot>📸 Chụp!</button></div>
        </div></div>`;
      p.body.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      p.body.querySelectorAll('[data-who]').forEach((b) => b.onclick = () => {
        const id = b.dataset.who;
        if (who === id) { if (sess.skip.has(id)) sess.skip.delete(id); else if (list().length > 1) sess.skip.add(id); else UI.toast('Ảnh phải có ít nhất 1 người'); }
        who = id; render();
      });
      p.body.querySelectorAll('[data-frame]').forEach((b) => b.onclick = () => { sess.frame = b.dataset.frame; render(); });
      p.body.querySelectorAll('[data-off]').forEach((b) => b.onclick = () => { const dd = sess.dress[who] || (sess.dress[who] = {}); delete dd[b.dataset.off]; render(); });
      p.body.querySelectorAll('[data-lay]').forEach((b) => b.onclick = () => { sess.layout = b.dataset.lay; render(); });
      p.body.querySelectorAll('[data-item]').forEach((b) => b.onclick = () => {
        const it = (tab === 'bg' ? BACKDROPS : PROPS).find((x) => x.id === b.dataset.item);
        const use = () => { if (tab === 'bg') sess.bg = it.id; else { const dd = sess.dress[who] || (sess.dress[who] = {}); dd[tab] = dd[tab] === it.id ? '' : it.id; } render(); };
        if (it.price === 0 || sess.rent.has(it.id)) return use();
        UI.confirm(`Thuê <b>${it.icon} ${it.name}</b> giá <b>${fmt(it.price)} xu</b> cho lượt chụp này?`, 'Thuê', () => {
          if (!AV.spend(it.price)) return UI.toast('Không đủ xu 😢');
          sess.rent.add(it.id); UI.toast(`✅ Đã thuê ${it.icon} ${it.name}`); use();
        });
      });
      p.body.querySelector('[data-wear]').onclick = () => { if (typeof WARDROBE !== 'undefined' && WARDROBE.mine) WARDROBE.mine(); };
      p.body.querySelector('[data-shoot]').onclick = () => shoot(p, render);
      loop(p);
    };
    render();
    clearInterval(p._tick); p._tick = setInterval(() => { if (!panelRef) return clearInterval(p._tick); const t = p.body.querySelector('.pb-time b'); if (t && sess) { const left = Math.max(0, sess.until - Date.now()); t.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`; if (!left) render(); } }, 1000);
    function loop(pp) {
      cancelAnimationFrame(raf);
      const cv = pp.body.querySelector('.pb-prev');
      if (!cv) return;
      const g = cv.getContext('2d');
      const frame = (now) => { if (!cv.isConnected || !sess) return; g.clearRect(0, 0, 640, 480); drawShot(g, 640, 480, list(), 0, now / 1000); raf = requestAnimationFrame(frame); };
      raf = requestAnimationFrame(frame);
    }
  }
  /** đếm ngược 3-2-1, đèn flash, chụp (dải 4 tấm thì nháy 4 lần) rồi hiện ảnh */
  async function shoot(p, back) {
    const btn = p.body.querySelector('[data-shoot]'); if (btn) btn.disabled = true;
    const cnt = p.body.querySelector('.pb-count'), fl = p.body.querySelector('.pb-flash');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const snaps = sess.layout === 'strip' ? 4 : 1;
    for (let s = 0; s < snaps; s++) {
      for (const n of [3, 2, 1]) { if (!cnt || !cnt.isConnected) return; cnt.textContent = n; cnt.classList.add('on'); await wait(s ? 450 : 750); }
      cnt.textContent = s < snaps - 1 ? `${s + 1}/${snaps}` : '📸'; fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on');
      if (typeof MUSIC !== 'undefined' && MUSIC.clack) MUSIC.clack();
      await wait(350);
    }
    cnt.classList.remove('on');
    const list = people().filter((x) => !sess.skip.has(x.id));
    const cv = compose(list);
    result(p, cv, back);
  }
  function result(p, cv, back) {
    cancelAnimationFrame(raf);
    const url = cv.toDataURL('image/png');
    p.body.innerHTML = `<div class="pb-result"><img src="${url}" alt="Ảnh photobooth"><div class="pb-acts">
      <button class="btn" data-dl>💾 Tải ảnh về máy</button><button class="btn ghost" data-gram>📲 Đăng ZenoGram</button><button class="btn ghost" data-again>🔁 Chụp tiếp</button></div>
      <small class="muted">Lượt chụp còn hiệu lực — chụp bao nhiêu tấm cũng được 😉</small></div>`;
    p.body.querySelector('[data-dl]').onclick = () => { const a = document.createElement('a'); a.href = url; a.download = `quanglam-photobooth-${Date.now()}.png`; document.body.appendChild(a); a.click(); a.remove(); };
    p.body.querySelector('[data-again]').onclick = () => studio(p);
    p.body.querySelector('[data-gram]').onclick = () => {
      if (typeof CHATIMG === 'undefined' || typeof PHONE === 'undefined') return UI.toast('Chưa đăng được lúc này');
      if (!PHONE.has()) return UI.toast('📱 Cần có điện thoại để đăng ZenoGram');
      cv.toBlob((blob) => {
        p.close();
        CHATIMG.pickAndSend(new File([blob], 'photobooth.jpg', { type: 'image/png' }), (u) => { PHONE.open(); setTimeout(() => PHONE.openApp('gram', u), 120); }, '📸 Ảnh Photobooth cho ZenoGram');
      }, 'image/png');
    };
    AV.sayMine('📸 Cheese~ ✌️');
  }

  /* giao diện */
  if (!document.getElementById('pb-css')) {
    const st = document.createElement('style'); st.id = 'pb-css';
    st.textContent = `
.pb-intro { display: grid; justify-items: center; text-align: center; gap: 6px; padding: 6px 4px; }
.pb-intro h3 { margin: 0; font-size: 22px; background: linear-gradient(90deg,#ae3ec9,#e64980); -webkit-background-clip: text; background-clip: text; color: transparent; font-style: italic; }
.pb-hero { font-size: 60px; } .pb-intro p { margin: 0; font-size: 13px; }
.pb-price { background: #fff0f6; border: 2px dashed #e64980; border-radius: 12px; padding: 8px 14px; color: #a61e4d; }
.pb-wrap { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 12px; }
.pb-left { position: relative; display: grid; gap: 6px; align-content: start; }
.pb-prev { width: 100%; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,.18); background: #fff; aspect-ratio: 4 / 3; }
.pb-flash { position: absolute; left: 0; top: 0; width: 100%; aspect-ratio: 4 / 3; border-radius: 12px; background: #fff; opacity: 0; pointer-events: none; }
.pb-flash.on { animation: pbFlash .45s ease-out; } @keyframes pbFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
.pb-count { position: absolute; left: 0; top: 0; width: 100%; aspect-ratio: 4 / 3; display: grid; place-items: center; font: 900 90px "Be Vietnam Pro", system-ui; color: #fff; text-shadow: 0 4px 18px rgba(0,0,0,.5); opacity: 0; pointer-events: none; }
.pb-count.on { opacity: 1; }
.pb-ppl { display: flex; flex-wrap: wrap; gap: 5px; } .pb-ppl button { border: 2px solid #e9ecef; background: #fff; border-radius: 999px; padding: 4px 10px; font: inherit; font-size: 12px; cursor: pointer; }
.pb-ppl button.sel { border-color: #e64980; background: #fff0f6; font-weight: 800; } .pb-ppl button.off { opacity: .45; text-decoration: line-through; }
.pb-right { display: grid; gap: 8px; align-content: start; min-width: 0; }
.pb-time { font-size: 13px; }
.pb-tabs { display: flex; gap: 4px; flex-wrap: wrap; } .pb-tabs button { border: 0; background: #f1f3f5; border-radius: 999px; padding: 5px 10px; font: inherit; font-size: 12px; cursor: pointer; } .pb-tabs button.on { background: #e64980; color: #fff; font-weight: 800; }
.pb-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 6px; max-height: 260px; overflow-y: auto; padding: 2px; }
.pb-it { border: 2px solid #e9ecef; background: #fff; border-radius: 12px; padding: 6px 4px; display: grid; justify-items: center; gap: 1px; font: inherit; cursor: pointer; }
.pb-it span { font-size: 26px; line-height: 1.1; } .pb-it b { font-size: 11px; } .pb-it small { font-size: 10px; color: #2b8a3e; font-weight: 700; }
.pb-it.lock small { color: #e8590c; } .pb-it.on { border-color: #e64980; background: #fff0f6; }
.pb-sw { width: 30px; height: 22px; border-radius: 5px; display: block; }
.pb-opts { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; font-size: 12px; } .pb-opts button { border: 2px solid #e9ecef; background: #fff; border-radius: 10px; padding: 4px 8px; font: inherit; font-size: 12px; cursor: pointer; } .pb-opts button.on { border-color: #ae3ec9; background: #f8f0fc; font-weight: 800; }
.pb-acts { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; } .pb-acts .btn { flex: 1; min-width: 120px; }
.pb-result { display: grid; justify-items: center; gap: 10px; } .pb-result img { max-width: 100%; max-height: 62vh; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,.25); }
@media (max-width: 720px) { .pb-wrap { grid-template-columns: 1fr; } .pb-items { max-height: 180px; } }
`;
    document.head.appendChild(st);
  }
  return { open, addTo, drawKiosk, PRICE };
})();
