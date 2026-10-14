/* 🏟️ KHU THỂ THAO — sân cầu lông, bóng bàn, golf mini, bóng rổ, pickleball.
 * Mỗi sân là 1 mini game kiểu game Facebook (chạm / vuốt, ván ngắn) chạy trong khung #arcadeView.
 * Thắng được xu + XP (tối đa DAY_CAP xu/ngày từ thể thao), kỷ lục lưu ở S.sport. */
const SPORTS = (() => {
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const S = () => AV.S;
  const D = () => { const s = S(); s.sport = s.sport || {}; const d = s.sport; d.best = d.best || {}; d.wins = d.wins || {}; d.plays = d.plays || {}; return d; };
  const DAY_CAP = 3000, ENERGY = 3;
  const today = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, k) => a + (b - a) * k;
  const DIFFS = ['😊 Dễ', '😤 Vừa', '🔥 Khó'];
  const WIN_XU = [30, 60, 110], WIN_XP = [10, 16, 25];
  const FONT = (n, w = 900) => `${w} ${n}px "Be Vietnam Pro", system-ui, sans-serif`;
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const srand = (seed) => { let a = seed % 2147483647 || 1; return () => (a = (a * 16807) % 2147483647) / 2147483647; };

  /* ======================================================================
   * 🎥 CAMERA 3D — vẽ phối cảnh lên canvas 2D (dùng chung cho các sân)
   * Toạ độ sân (mét): x ngang (trái −, phải +), y cao, z dọc sân (0 = vạch cuối sân mình, xa dần)
   * ==================================================================== */
  function makeCam(o) {
    const cam = { x: 0, y: o.y, z: o.z, pitch: o.pitch, F: 800, W: 1280, H: 720, cy: o.cy || 0.42 };
    cam.set = (W, H) => { cam.W = W; cam.H = H; cam.F = H * (o.f || 1.2); };
    cam.p = (x, y, z) => {
      const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z, c = Math.cos(cam.pitch), s = Math.sin(cam.pitch);
      const Y = dy * c + dz * s, Z = Math.max(0.05, -dy * s + dz * c), k = cam.F / Z;
      return { x: cam.W / 2 + dx * k, y: cam.H * cam.cy - Y * k, k };
    };
    /** điểm trên màn hình → điểm trên mặt phẳng cao h */
    cam.ground = (sx, sy, h) => {
      const c = Math.cos(cam.pitch), s = Math.sin(cam.pitch), X = (sx - cam.W / 2) / cam.F, Y = (cam.H * cam.cy - sy) / cam.F;
      const dy = c * Y - s, dz = s * Y + c;
      if (dy > -0.02) return null;
      const t = (h - cam.y) / dy;
      return { x: cam.x + t * X, z: cam.z + t * dz };
    };
    cam.poly = (g, pts, fill) => { g.beginPath(); pts.forEach(([x, y, z], i) => { const p = cam.p(x, y, z); if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.closePath(); g.fillStyle = fill; g.fill(); };
    cam.line = (g, a, b, col, w) => { const p = cam.p(...a), q = cam.p(...b); g.strokeStyle = col; g.lineWidth = Math.max(1, w * (p.k + q.k) / 2); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); };
    return cam;
  }
  /** nhân vật nhìn từ phía sau (người chơi, gần camera) — vẽ theo màu áo / tóc của avatar */
  function backFigure(g, P, k, look, o = {}) {
    const s = k * 1.72 / 170;
    const skin = look.skin || '#f1c27d', hair = look.hairColor || '#3b2a20', shirt = look.shirt || '#4dabf7', pants = look.pants || '#343a40';
    const walk = o.moving ? Math.sin((o.t || 0) * 11) * 7 : 0;
    g.save(); g.translate(P.x, P.y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, (o.lift || 0), 34, 9, 0, 0, Math.PI * 2); g.fill();
    g.translate(0, -(o.lift || 0) * 0);
    const lift = o.air || 0; g.translate(0, -lift);
    // chân + giày
    [[-1, walk], [1, -walk]].forEach(([d, w]) => { rr(g, d * 11 - 8, -80 + Math.max(0, w), 16, 76 - Math.max(0, w), 7); g.fillStyle = pants; g.fill(); rr(g, d * 11 - 10, -10 + Math.max(0, w) * 0, 20, 11, 5); g.fillStyle = '#212529'; g.fill(); });
    // thân áo
    rr(g, -25, -138, 50, 66, 16); g.fillStyle = shirt; g.fill();
    g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(-2, -134, 4, 58);
    // tay trái buông + tay phải cầm vợt
    g.strokeStyle = skin; g.lineCap = 'round'; g.lineWidth = 11;
    g.beginPath(); g.moveTo(-22, -128); g.lineTo(-34, -96 + walk * 0.4); g.stroke();
    const sw = o.swing || 0, a = -1.25 + sw * 2.4, hx = 22 + Math.cos(a) * 34, hy = -128 + Math.sin(a) * 34;
    g.beginPath(); g.moveTo(22, -128); g.lineTo(hx, hy); g.stroke();
    if (o.racket !== false) {
      const ra = a - 0.15;
      g.save(); g.translate(hx, hy); g.rotate(ra + Math.PI / 2);
      g.strokeStyle = '#343a40'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -34); g.stroke();
      if (o.paddle) { rr(g, -12, -62, 24, 32, 9); g.fillStyle = o.color || '#f76707'; g.fill(); }
      else { g.strokeStyle = o.color || '#f76707'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -52, 12, 18, 0, 0, Math.PI * 2); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 0.8; for (let i = -9; i <= 9; i += 4.5) { g.beginPath(); g.moveTo(i, -68); g.lineTo(i, -36); g.stroke(); g.beginPath(); g.moveTo(-11, -52 + i * 1.4); g.lineTo(11, -52 + i * 1.4); g.stroke(); } }
      g.restore();
    }
    // cổ + đầu (nhìn từ sau: thấy tóc)
    rr(g, -7, -148, 14, 14, 5); g.fillStyle = skin; g.fill();
    g.fillStyle = skin; g.beginPath(); g.arc(-19, -160, 5, 0, Math.PI * 2); g.arc(19, -160, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = hair; g.beginPath(); g.arc(0, -164, 20, 0, Math.PI * 2); g.fill();
    if (look.hair === 'long' || look.hair === 'pigtails') { rr(g, -19, -166, 38, 44, 12); g.fill(); }
    if (look.hair === 'bun') { g.beginPath(); g.arc(0, -186, 9, 0, Math.PI * 2); g.fill(); }
    if (look.hat === 'cap') { g.fillStyle = '#e03131'; g.beginPath(); g.arc(0, -168, 20, Math.PI, 0); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(-6, -172, 8, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  /** nhân vật nhìn từ phía trước (đối thủ ở xa) */
  function frontFigure(g, cam, x, z, look, o) {
    const P = cam.p(x, o.air || 0, z), F = cam.p(x, 0, z);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(F.x, F.y, 0.35 * F.k, 0.1 * F.k, 0, 0, Math.PI * 2); g.fill();
    const sc = P.k * 1.7 / 127;
    try { ART.character(g, P.x, P.y, look, { dir: o.dir || 1, t: o.t || 0, moving: o.moving, scale: sc }); }
    catch (e) { g.fillStyle = look.shirt || '#f06595'; rr(g, P.x - 0.22 * P.k, P.y - 1.4 * P.k, 0.44 * P.k, 0.7 * P.k, 8); g.fill(); g.fillStyle = look.skin || '#ffe0c4'; g.beginPath(); g.arc(P.x, P.y - 1.55 * P.k, 0.16 * P.k, 0, Math.PI * 2); g.fill(); }
    // vợt bên tay phải (bên trái màn hình vì đối diện)
    const sw = o.swing > 0 ? Math.sin((1 - o.swing / 0.28) * Math.PI) : 0;
    const hx = x - 0.32, hy = (o.air || 0) + 1.0, hz = z - 0.05;
    const ang = 1.2 - sw * 1.6, ex = hx - Math.cos(ang) * 0.45, ey = hy + Math.sin(ang) * 0.45;
    const A = cam.p(hx, hy, hz), B = cam.p(ex, ey, hz);
    g.strokeStyle = '#343a40'; g.lineWidth = Math.max(1.5, 0.025 * A.k); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke();
    const C = cam.p(ex - Math.cos(ang) * 0.17, ey + Math.sin(ang) * 0.17, hz);
    if (o.paddle) { g.fillStyle = o.color || '#7048e8'; g.beginPath(); g.ellipse(C.x, C.y, 0.11 * C.k, 0.15 * C.k, -ang + Math.PI / 2, 0, Math.PI * 2); g.fill(); }
    else { g.strokeStyle = o.color || '#7048e8'; g.lineWidth = Math.max(1.5, 0.02 * C.k); g.beginPath(); g.ellipse(C.x, C.y, 0.12 * C.k, 0.17 * C.k, -ang + Math.PI / 2, 0, Math.PI * 2); g.stroke(); }
  }
  /** nhà thi đấu phía sau sân: tường, khán đài, đèn */
  function arena(g, cam, farZ, o) {
    const W = cam.W, H = cam.H, hz = cam.p(0, 0, 400).y;
    g.fillStyle = o.wall1; g.fillRect(0, 0, W, H);
    const fl = g.createLinearGradient(0, hz, 0, H); fl.addColorStop(0, o.floor1); fl.addColorStop(1, o.floor2); g.fillStyle = fl; g.fillRect(0, hz, W, H - hz);
    if (o.wood) { g.strokeStyle = 'rgba(90,50,20,.18)'; g.lineWidth = 1; for (let x = -30; x <= 30; x += 0.9) { const a = cam.p(x, 0, -3), b = cam.p(x, 0, 60); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); } }
    // tường cuối sân (đứng trên sàn ở farZ)
    const wt = cam.p(0, 9, farZ).y, wb = cam.p(0, 0, farZ).y;
    const wall = g.createLinearGradient(0, wt, 0, wb); wall.addColorStop(0, o.wall1); wall.addColorStop(1, o.wall2); g.fillStyle = wall; g.fillRect(0, Math.min(wt, 0), W, wb - Math.min(wt, 0));
    if (o.crowd) {
      const top = cam.p(0, 8, farZ).y, bot = cam.p(0, 1.2, farZ).y, rows = 7;
      for (let r = 0; r < rows; r++) { const y = top + (bot - top) * r / rows, sz = 5 + r * 1.2; for (let x = (r % 2) * 9; x < W; x += sz * 2.6) { g.fillStyle = ['#f8f9fa', '#ffd43b', '#ff8787', '#74c0fc', '#8ce99a', '#212529'][(x * 7 + r * 13) % 6 | 0]; g.globalAlpha = 0.55; g.beginPath(); g.arc(x, y, sz * 0.55, 0, Math.PI * 2); g.fill(); } }
      g.globalAlpha = 1;
      const by = cam.p(0, 1.0, farZ).y, bh = (cam.p(0, 0, farZ).y - by);
      for (let i = 0; i * 260 < W; i++) { g.fillStyle = ['#1c7ed6', '#e03131', '#2f9e44', '#f08c00'][i % 4]; g.fillRect(i * 260, by, 252, bh); g.fillStyle = '#fff'; g.font = `900 ${Math.max(10, bh * 0.5)}px "Be Vietnam Pro", system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.banner[i % o.banner.length], i * 260 + 126, by + bh / 2); }
    }
    if (o.wood && !o.crowd) { g.fillStyle = 'rgba(80,40,10,.18)'; for (let x = 0; x < W; x += 34) g.fillRect(x, Math.min(wt, 0), 3, wb - Math.min(wt, 0)); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(W * 0.08, wt + (wb - wt) * 0.15, W * 0.1, (wb - wt) * 0.6); }
    for (let i = 0; i < 6; i++) { const lx = W * (0.08 + i * 0.168), ly = Math.max(6, wt); g.fillStyle = 'rgba(255,255,220,.95)'; rr(g, lx - 26, ly, 52, 10, 5); g.fill(); g.fillStyle = 'rgba(255,255,200,.06)'; g.beginPath(); g.moveTo(lx - 20, ly + 8); g.lineTo(lx + 20, ly + 8); g.lineTo(lx + 120, wb); g.lineTo(lx - 120, wb); g.closePath(); g.fill(); }
  }

  /* ======================================================================
   * 🏸 🏓 🥎 SÂN ĐÁNH QUA LƯỚI — camera sau lưng người chơi, phối cảnh 3D
   * ==================================================================== */
  const AI_LOOK = { skin: '#ffe0c4', hair: 'long', hairColor: '#6b3e26', shirt: '#f06595', shirtStyle: 'plain', pants: '#343a40', hat: 'bow' };
  const RALLY = {
    badminton: { L: 13.4, W: 6.1, netH: 1.55, netBot: 0.78, surf: 0, shuttle: true, drag: 0.22, reach: 1.25, reachY: 2.55, meZ: 2.6, aiZ: 10.9, mySp: 6.2, aiSp: [3.6, 4.6, 5.8], cam: { y: 4.4, z: -5.4, pitch: 0.37, f: 1.28, cy: 0.36 },
      look: { wall1: '#16243f', wall2: '#2b4170', floor1: '#2c5f8a', floor2: '#1f4766', crowd: true, banner: ['🏸 QL OPEN', 'YONEX', 'SPORTS DRINK', 'VIETNAM'] } },
    pickleball: { L: 13.4, W: 6.1, netH: 0.91, netBot: 0, surf: 0, bounce: 0.62, kitchen: 2.13, BR: 0.04, reach: 1.0, reachY: 1.35, meZ: 0.8, aiZ: 12.6, mySp: 6, aiSp: [3.4, 4.4, 5.6], cam: { y: 3.9, z: -4.8, pitch: 0.36, f: 1.28, cy: 0.36 }, tN: 1.15, tP: 0.72,
      look: { wall1: '#5c7cfa', wall2: '#a5d8ff', floor1: '#2b8a3e', floor2: '#1e6b30', crowd: true, banner: ['🥎 PICKLEBALL', 'QL SPORT', 'DINK!', 'HÀ NỘI'] } },
    pingpong: { L: 2.74, W: 1.525, netH: 0.1525, netBot: 0, surf: 0.76, bounce: 0.88, BR: 0.02, reach: 0.3, meZ: -0.3, aiZ: 3.7, mySp: 9, aiSp: [2.2, 3.0, 4.0], cam: { y: 2.0, z: -2.1, pitch: 0.4, f: 1.5, cy: 0.36 }, tN: 0.72, tP: 0.45,
      look: { wall1: '#b9773f', wall2: '#e3a96b', floor1: '#d8a066', floor2: '#a86b33', wood: true } },
  };
  function makeRally(kind, diff) {
    const C = RALLY[kind], PP = kind === 'pingpong', BAD = kind === 'badminton', PK = kind === 'pickleball';
    const L = C.L, W = C.W, NZ = L / 2, G = 9.8, BR = C.BR || 0.03;
    const cam = makeCam(C.cam);
    const padY = C.surf + 0.2;
    const me = { x: 0, z: C.meZ, tx: 0, tz: C.meZ, vx: 0, vz: 0, y: 0, vy: 0, swing: 0, tap: -9, t: 0, moving: false };
    const ai = { x: 0, z: C.aiZ, tx: 0, tz: C.aiZ, swing: 0, react: 0, err: 0, plan: 0, t: 0, moving: false };
    const b = { x: 0, y: 1, z: 0, vx: 0, vy: 0, vz: 0, hitter: -1, bounces: 0, hits: 0, live: false, trail: [] };
    const sc = [0, 0];
    let server = 0, servesLeft = 2, phase = 'serve', wait = 1, t = 0, rally = 0, bestRally = 0, lastW = 0;
    const msgs = [];
    const say = (text, color = '#fff', y = 0.3) => msgs.push({ text, color, y, t: 0 });
    const P = (w) => (w === 0 ? me : ai);
    const inKitchen = (p, w) => PK && (w === 0 ? p.z > NZ - C.kitchen : p.z < NZ + C.kitchen);

    /* ---------- vật lý (dùng chung cho bóng thật và dự đoán của máy) ---------- */
    function adv(s, dt) {
      if (C.shuttle) { const v = Math.hypot(s.vx, s.vy, s.vz), k = C.drag * v; s.vx -= k * s.vx * dt; s.vz -= k * s.vz * dt; s.vy -= (G + k * s.vy) * dt; }
      else s.vy -= G * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    }
    const surfAt = (x, z) => (PP && Math.abs(x) <= W / 2 && z >= 0 && z <= L ? C.surf : 0);
    /** bắn bóng theo đường parabol tới (tx, tz) sau T giây; tự kéo dài thời gian nếu sát lưới */
    function ballistic(tx, tz, T, keep) {
      for (let i = 0; i < 6; i++) {
        const vx = (tx - b.x) / T, vz = (tz - b.z) / T, vy = (C.surf + BR - b.y + 0.5 * G * T * T) / T;
        const tn = (NZ - b.z) / vz, yn = b.y + vy * tn - 0.5 * G * tn * tn;
        if (keep || tn <= 0 || yn > C.surf + C.netH + 0.06 || i === 5) { b.vx = vx; b.vy = vy; b.vz = vz; return; }
        T *= 1.15;
      }
    }
    const KINDS = { clear: [[38, 62], [17, 28]], drop: [[8, 40], [7, 13]], drive: [[0, 14], [16, 25]], smash: [[-24, -6], [28, 40]], serve: [[30, 58], [11, 20]] };
    function shuttlePlan(dir, kind, tx, tz) {
      const [A, V] = KINDS[kind], hx = tx - b.x, hz = tz - b.z, hd = Math.hypot(hx, hz), ux = hx / hd, uz = hz / hd;
      let best = null;
      for (let i = 0; i <= 10; i++) for (let j = 0; j <= 8; j++) {
        const a = (A[0] + (A[1] - A[0]) * i / 10) * Math.PI / 180, v = V[0] + (V[1] - V[0]) * j / 8;
        const s = { x: b.x, y: b.y, z: b.z, vx: ux * Math.cos(a) * v, vy: Math.sin(a) * v, vz: uz * Math.cos(a) * v };
        let clear = null, n = 0;
        while (s.y > 0 && n++ < 500) { const pz = s.z; adv(s, 1 / 90); if (clear === null && (pz - NZ) * (s.z - NZ) <= 0) clear = s.y > C.netH + 0.12; }
        if (!clear) continue;
        const e = Math.hypot(s.x - tx, s.z - tz);
        if (!best || e < best.e) best = { e, vx: ux * Math.cos(a) * v, vy: Math.sin(a) * v, vz: uz * Math.cos(a) * v };
      }
      if (!best && kind !== 'clear') return shuttlePlan(dir, 'clear', tx, tz);
      return best || { vx: 0, vy: 9, vz: 12 * dir };
    }
    function launch(w, tx, tz, kind) {
      const p = P(w);
      if (PP) { b.x = p.x; b.z = w === 0 ? Math.max(b.z, p.z) : Math.min(b.z, p.z); b.y = Math.max(b.y, C.surf + 0.08); }
      else { b.x = p.x + (w === 0 ? 0.35 : -0.35); b.z = p.z + (w === 0 ? 0.25 : -0.25); if (BAD) b.y = Math.max(b.y, kind === 'smash' ? 2.5 : 1.2); }
      if (C.shuttle) { const s = shuttlePlan(w === 0 ? 1 : -1, kind, tx, tz); b.vx = s.vx; b.vy = s.vy; b.vz = s.vz; }
      else ballistic(tx, tz, kind === 'smash' || kind === 'drive' ? C.tP : kind === 'dink' ? 1.05 : kind === 'serve' ? C.tN * 1.15 : C.tN * (w === 1 ? [1.18, 1.05, 0.92][diff] : 1), kind === 'err');
      b.hitter = w; b.bounces = 0; b.hits++; b.live = true; b.trail = []; p.swing = 0.28; rally++;
      if (kind === 'smash') say(PP ? '💥 Đập bóng!' : BAD ? '💥 ĐẬP CẦU!' : '💥 Drive!', '#ffd43b', 0.42);
      if (w === 0) { ai.react = [0.28, 0.15, 0.06][diff]; ai.err = (Math.random() * 2 - 1) * [0.7, 0.35, 0.12][diff] * (PP ? 0.3 : 1); ai.plan = 0; }
    }
    function serve(w) {
      phase = 'play'; b.hits = 0;
      const p = P(w);
      b.x = p.x; b.z = p.z + (w === 0 ? 0.3 : -0.3); b.y = PP ? C.surf + 0.25 : BAD ? 1.1 : 0.8;
      const sideX = (Math.random() * 2 - 1) * W * 0.3;
      const tz = w === 0 ? NZ + (PP ? L * 0.3 : PK ? C.kitchen + 1.5 + Math.random() * 3 : 3.5 + Math.random() * 2.5) : NZ - (PP ? L * 0.3 : PK ? C.kitchen + 1.5 + Math.random() * 3 : 3.5 + Math.random() * 2.5);
      launch(w, sideX, tz, 'serve');
    }
    function point(w, text) {
      if (phase !== 'play') return;
      sc[w]++; phase = 'dead'; wait = 1.3; b.live = false; lastW = w;
      bestRally = Math.max(bestRally, rally); rally = 0;
      say(text, w === 0 ? '#8ce99a' : '#ffa8a8', 0.3); say(w === 0 ? '+1 cho bạn' : '+1 cho máy', '#ffe066', 0.38);
    }
    function myShot() {
      const recent = t - me.tap < 0.45;
      if (PP) {
        const off = Math.max(-1.3, Math.min(1.3, (b.x - me.x) / 0.14));
        const tx = Math.max(-W * 0.62, Math.min(W * 0.62, off * W * 0.42 + me.vx * 0.06 + (Math.random() - 0.5) * 0.1));
        const smash = recent || me.vz > 2.2;
        return launch(0, tx, NZ + L * (smash ? 0.4 : 0.22 + Math.random() * 0.24), smash ? 'smash' : 'normal');
      }
      if (BAD) {
        if (recent && b.y > 2.0) return launch(0, (Math.random() - 0.5) * W * 0.7, NZ + 2.5 + Math.random() * 3.5, 'smash');
        if (me.vz > 1.2) return launch(0, (Math.random() - 0.5) * W * 0.7, NZ + 1 + Math.random() * 1.2, 'drop');
        if (me.vz < -1.2) return launch(0, (Math.random() - 0.5) * W * 0.7, L - 0.4 - Math.random() * 1.2, 'clear');
        const r = Math.random();
        return r < 0.5 ? launch(0, (Math.random() - 0.5) * W * 0.75, L - 0.5 - Math.random() * 1.5, 'clear') : r < 0.8 ? launch(0, (Math.random() - 0.5) * W * 0.8, NZ + 3 + Math.random() * 2.5, 'drive') : launch(0, (Math.random() - 0.5) * W * 0.6, NZ + 1 + Math.random() * 1.2, 'drop');
      }
      // pickleball
      const off = Math.max(-1.3, Math.min(1.3, (b.x - me.x) / 0.5)), tx = Math.max(-W * 0.62, Math.min(W * 0.62, off * W * 0.4 + me.vx * 0.08));
      if (b.hits < 2) return launch(0, tx, NZ + C.kitchen + 1 + Math.random() * 3, 'normal');
      if (recent) return launch(0, tx, NZ + 3 + Math.random() * 2.5, 'drive');
      if (me.z > NZ - C.kitchen - 1) return launch(0, tx * 0.7, NZ + 0.5 + Math.random() * (C.kitchen - 0.8), 'dink');
      return launch(0, tx, NZ + 2 + Math.random() * 4, 'normal');
    }
    function aiShot() {
      const err = Math.random() < [0.2, 0.11, 0.05][diff];
      const away = me.x > 0 ? -1 : 1, pick = (a, c) => a + Math.random() * (c - a);
      if (err) { const out = Math.random() < 0.5; return launch(1, out ? away * W * pick(0.55, 0.75) : pick(-W / 3, W / 3), out ? pick(1, NZ - 0.5) : -pick(0.2, 0.9), PP ? 'err' : 'drive'); }
      const tx = (Math.random() < 0.35 + diff * 0.2 ? away : (Math.random() < 0.5 ? -1 : 1)) * W * pick(0.12, 0.4);
      if (PP) return launch(1, tx, pick(0.25, NZ - 0.35), diff === 2 && Math.random() < 0.25 ? 'smash' : 'normal');
      if (BAD) {
        if (diff >= 1 && b.y > 2.2 && Math.random() < 0.25 + diff * 0.15) return launch(1, tx, pick(1, NZ - 2.5), 'smash');
        const r = Math.random();
        return r < 0.45 ? launch(1, tx, pick(0.4, 1.8), 'clear') : r < 0.75 ? launch(1, tx, pick(NZ - 2, NZ - 1), 'drop') : launch(1, tx, pick(1.5, 4), 'drive');
      }
      if (b.hits < 2) return launch(1, tx, pick(0.8, NZ - C.kitchen - 1), 'normal');
      if (ai.z < NZ + C.kitchen + 1.2 && Math.random() < 0.45) return launch(1, tx * 0.7, pick(NZ - C.kitchen + 0.5, NZ - 0.5), 'dink');
      return launch(1, tx, pick(0.6, NZ - C.kitchen - 0.5), Math.random() < diff * 0.2 ? 'drive' : 'normal');
    }
    /** chỗ máy nên đứng: mô phỏng đường bóng tới khi đánh được */
    function aiTarget() {
      const s = { ...b }, dt = 1 / 60;
      let bounces = b.bounces;
      for (let i = 0; i < 240; i++) {
        adv(s, dt);
        const sf = surfAt(s.x, s.z);
        if (!C.shuttle && s.y <= sf + BR && s.vy < 0) { s.y = sf + BR; s.vy = -s.vy * C.bounce; bounces++; if (sf === 0 && PP) return null; }
        if (s.y < 0) return { x: s.x, z: Math.min(s.z, L + 1) };
        if (s.z <= NZ) continue;
        if (PP && bounces >= 1 && s.z > L - 0.1) return { x: s.x, z: Math.max(ai.z, s.z) };
        if (BAD && s.vy < 0 && s.y < 2.1) return { x: s.x + 0.35, z: s.z + 0.25 };
        if (PK && (bounces >= 1 || b.hits >= 2) && s.y < 1.1 && s.vy < 0) return { x: s.x + 0.35, z: s.z };
      }
      return null;
    }
    function moveTo(p, tx, tz, sp, dt) {
      const ox = p.x, oz = p.z, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz), st = Math.min(d, sp * dt);
      if (d > 0.001) { p.x += dx / d * st; p.z += dz / d * st; }
      p.vx = (p.vx || 0) * 0.6 + ((p.x - ox) / dt) * 0.4; p.vz = (p.vz || 0) * 0.6 + ((p.z - oz) / dt) * 0.4;
      p.moving = st > 0.004; if (p.moving) p.t += dt;
      p.swing = Math.max(0, p.swing - dt);
    }
    function step(dt) {
      t += dt;
      moveTo(me, me.tx, me.tz, C.mySp, dt);
      if (me.y > 0 || me.vy > 0) { me.vy -= G * dt; me.y = Math.max(0, me.y + me.vy * dt); if (me.y === 0) me.vy = 0; }
      if (b.live && b.hitter === 0) {
        if (ai.react > 0) ai.react -= dt;
        else if ((ai.plan -= dt) <= 0) { ai.plan = 0.12; const tg = aiTarget(); if (tg) { ai.tx = Math.max(-W, Math.min(W, tg.x + ai.err)); ai.tz = Math.max(NZ + (PK ? 0.3 : PP ? L + 0.5 : 1), Math.min(PP ? L + 1.2 : L + 1.2, tg.z)); } }
      } else if (phase === 'play' && b.hitter === 1) { ai.tx *= 0.98; ai.tz += ((PK && b.hits >= 2 ? NZ + C.kitchen + 0.4 : C.aiZ) - ai.tz) * 0.03; }
      moveTo(ai, ai.tx, ai.tz, C.aiSp[diff], dt);

      if (phase === 'serve') {
        const p = P(server);
        b.x = p.x + (server === 0 ? 0.25 : -0.25); b.z = p.z + (server === 0 ? 0.2 : -0.2); b.y = (PP ? C.surf + 0.25 : 1.0) + Math.abs(Math.sin(t * 3.5)) * 0.35;
        if (server === 1 && (wait -= dt) <= 0) serve(1);
        return;
      }
      if (phase === 'dead') {
        if (b.y > 0) { adv(b, dt); const sf = surfAt(b.x, b.z); if (b.y < sf + BR) { b.y = sf + BR; b.vy = Math.abs(b.vy) * 0.3; b.vx *= 0.7; b.vz *= 0.7; } }
        if ((wait -= dt) <= 0) {
          const w = sc[0] > sc[1] ? 0 : 1;
          if ((sc[w] >= 7 && sc[w] - sc[1 - w] >= 2) || sc[w] >= 11) { game.over = true; game.res = { win: w === 0, score: sc.slice(), bestRally }; return; }
          if (PP) { if (--servesLeft <= 0) { server = 1 - server; servesLeft = 2; } } else server = lastW;
          phase = 'serve'; wait = 1;
          if (!PP) { me.tx = 0; me.tz = C.meZ; ai.tx = 0; ai.tz = C.aiZ; }
        }
        return;
      }
      const pz = b.z;
      adv(b, dt);
      if ((pz - NZ) * (b.z - NZ) <= 0 && Math.abs(b.x) < W / 2 + 0.25 && b.y < C.surf + C.netH && b.y > C.surf - 0.05 + (C.netBot || 0) * 0) { b.z = pz; b.vz = -b.vz * 0.1; b.vx *= 0.3; return point(1 - b.hitter, '🥅 Chạm lưới!'); }
      const sf = surfAt(b.x, b.z);
      if (C.shuttle && b.y <= 0) {
        b.y = 0; const inC = Math.abs(b.x) <= W / 2 && b.z >= 0 && b.z <= L, side = b.z < NZ ? 0 : 1;
        return inC ? point(1 - side, side === 0 ? '😵 Cầu rơi sân bạn' : '✨ Cầu rơi sân đối thủ!') : point(1 - b.hitter, '🚫 Cầu ra ngoài!');
      }
      if (!C.shuttle && b.y <= sf + BR && b.vy < 0) {
        const onTable = !PP || sf > 0, inC = Math.abs(b.x) <= W / 2 && b.z >= 0 && b.z <= L, side = b.z < NZ ? 0 : 1;
        if (!onTable) { b.y = BR; b.vy = Math.abs(b.vy) * 0.4; return b.bounces ? point(b.hitter, b.hitter === 0 ? '✨ Ăn điểm!' : '😵 Không đỡ kịp!') : point(1 - b.hitter, '🚫 Bóng ra ngoài!'); }
        if (b.bounces === 0) {
          if (!inC) { b.y = sf + BR; b.vy = Math.abs(b.vy) * 0.5; return point(1 - b.hitter, '🚫 Bóng ra ngoài!'); }
          if (side === b.hitter) return point(1 - b.hitter, '❌ Lỗi!');
        }
        b.bounces++; b.y = sf + BR; b.vy = -b.vy * C.bounce; b.vx *= 0.97; b.vz *= 0.97;
        if (b.bounces >= 2) return point(b.hitter, b.hitter === 0 ? '✨ Ăn điểm!' : '😵 Không đỡ kịp!');
      }
      if (b.z < -6 || b.z > L + 6 || Math.abs(b.x) > W + 6) return b.bounces ? point(b.hitter, b.hitter === 0 ? '✨ Ăn điểm!' : '😵 Không đỡ kịp!') : point(1 - b.hitter, '🚫 Bóng ra ngoài!');
      // chạm vợt: tự đánh
      const r = 1 - b.hitter, p = P(r), onSide = r === 0 ? b.z < NZ : b.z > NZ;
      if (!onSide) return;
      let can;
      if (PP) can = b.bounces >= 1 && Math.hypot(b.x - p.x, b.z - p.z) < C.reach && Math.abs(b.y - padY) < 0.32;
      else {
        const ok = BAD || b.bounces >= 1 || (b.hits >= 2 && !inKitchen(p, r));
        const cx = p.x + (r === 0 ? 0.3 : -0.3), top = C.reachY + (r === 0 ? me.y : 0);
        can = ok && Math.hypot(b.x - cx, b.z - p.z) < C.reach && b.y < top && b.y > 0.12;
      }
      if (can) { if (r === 0) myShot(); else aiShot(); }
    }
    const game = {
      VW: 1280, VH: 720, wide: true, over: false, res: null,
      _dbg: () => ({ b, me, ai, sc, rally, bestRally, phase, server }),
      update(dt) {
        for (let k = 0; k < 3; k++) { step(dt / 3); if (game.over) break; }
        if (b.live) { b.trail.push([b.x, b.y, b.z]); if (b.trail.length > 10) b.trail.shift(); }
        msgs.forEach((m) => { m.t += dt; }); while (msgs.length && msgs[0].t > 1.4) msgs.shift();
      },
      down(p) {
        game.move(p); me.tap = t;
        if (phase === 'serve' && server === 0) return serve(0);
        if (BAD && me.y === 0) me.vy = 3.4;
      },
      move(p) {
        const q = cam.ground(p.x, p.y + (PP ? 0 : 40), PP ? padY : 0);
        if (!q) return;
        if (PP) { me.tx = Math.max(-1.3, Math.min(1.3, q.x)); me.tz = Math.max(-1.0, Math.min(0.35, q.z)); }
        else { me.tx = Math.max(-W / 2 - 1.6, Math.min(W / 2 + 1.6, q.x - 0.25)); me.tz = Math.max(-2, Math.min(NZ - 0.4, q.z)); }
      },
      up() {},
      key(k, on) {
        if (!on) return;
        const d = PP ? 0.18 : 0.8;
        if (k === 'ArrowLeft' || k === 'a') me.tx -= d;
        if (k === 'ArrowRight' || k === 'd') me.tx += d;
        if (k === 'ArrowUp' || k === 'w') me.tz = Math.min(PP ? 0.35 : NZ - 0.4, me.tz + d);
        if (k === 'ArrowDown' || k === 's') me.tz = Math.max(PP ? -1 : -2, me.tz - d);
        if (k === ' ' || k === 'Enter') { me.tap = t; if (phase === 'serve' && server === 0) serve(0); else if (BAD && me.y === 0) me.vy = 3.4; }
      },
      draw(g) {
        cam.set(game.VW, game.VH);
        cam.x = me.x * (PP ? 0.25 : 0.35);
        arena(g, cam, L + (PP ? 5 : 7), C.look);
        if (PP) drawTable(g); else drawCourt(g);
        // bóng đổ của bóng
        const sf = surfAt(b.x, b.z), S0 = cam.p(b.x, sf + 0.002, b.z);
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(S0.x, S0.y, Math.max(2, 0.06 * S0.k), Math.max(1, 0.02 * S0.k), 0, 0, Math.PI * 2); g.fill();
        // vẽ từ xa tới gần
        const items = [
          { z: ai.z, d: () => frontFigure(g, cam, ai.x, ai.z, AI_LOOK, { t: ai.t, moving: ai.moving, swing: ai.swing, paddle: !BAD, color: '#7048e8' }) },
          { z: NZ, d: () => drawNet(g) },
          { z: b.z, d: () => drawBall(g) },
          { z: me.z - 0.01, d: () => (PP ? drawMyPaddle(g) : backFigure(g, cam.p(me.x, 0, me.z), cam.p(me.x, 0, me.z).k, S().look || {}, { t: me.t, moving: me.moving, swing: me.swing > 0 ? Math.sin((1 - me.swing / 0.28) * Math.PI) : 0, paddle: PK, color: '#f76707', air: me.y * 100 })) },
        ];
        items.sort((a, c) => c.z - a.z).forEach((it) => it.d());
        if (!PP && PK && b.live && b.hitter === 1 && b.bounces === 0 && inKitchen(me, 0)) hint(g, '🚫 Đang trong vùng bếp — chờ bóng nảy rồi mới đánh', 0.9);
        scoreBoard(g, sc, server, game.VW);
        if (phase === 'serve' && server === 0) hint(g, PP ? '👆 Chạm để giao bóng · kéo ngón tay để di chuyển vợt' : '👆 Chạm để giao · kéo ngón tay để chạy theo bóng', 0.92);
        drawMsgs(g, msgs.map((m) => ({ ...m, x: game.VW / 2, y: game.VH * m.y })));
      },
    };
    function drawCourt(g) {
      const w2 = W / 2, m = BAD ? 1.6 : 2.2;
      cam.poly(g, [[-w2 - m, 0, -m], [w2 + m, 0, -m], [w2 + m, 0, L + m], [-w2 - m, 0, L + m]], BAD ? '#1d5f45' : '#2f6b3a');
      cam.poly(g, [[-w2, 0, 0], [w2, 0, 0], [w2, 0, L], [-w2, 0, L]], BAD ? '#2f9e6e' : '#1971c2');
      if (PK) cam.poly(g, [[-w2, 0, NZ - C.kitchen], [w2, 0, NZ - C.kitchen], [w2, 0, NZ + C.kitchen], [-w2, 0, NZ + C.kitchen]], '#4dabf7');
      const lw = 0.05, Ln = (a, c) => cam.line(g, a, c, '#fff', lw);
      Ln([-w2, 0, 0], [w2, 0, 0]); Ln([-w2, 0, L], [w2, 0, L]); Ln([-w2, 0, 0], [-w2, 0, L]); Ln([w2, 0, 0], [w2, 0, L]);
      if (BAD) {
        const si = w2 - 0.46; Ln([-si, 0, 0], [-si, 0, L]); Ln([si, 0, 0], [si, 0, L]);
        [NZ - 1.98, NZ + 1.98, 0.76, L - 0.76].forEach((z) => Ln([-w2, 0, z], [w2, 0, z]));
        Ln([0, 0, 0], [0, 0, NZ - 1.98]); Ln([0, 0, NZ + 1.98], [0, 0, L]);
      } else {
        [NZ - C.kitchen, NZ + C.kitchen].forEach((z) => Ln([-w2, 0, z], [w2, 0, z]));
        Ln([0, 0, 0], [0, 0, NZ - C.kitchen]); Ln([0, 0, NZ + C.kitchen], [0, 0, L]);
        const K = cam.p(0, 0, NZ - C.kitchen / 2); g.fillStyle = 'rgba(255,255,255,.22)'; g.font = `900 ${Math.max(10, 0.45 * K.k)}px "Be Vietnam Pro", system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('KITCHEN', K.x, K.y);
      }
    }
    function drawNet(g) {
      const w2 = W / 2 + (PP ? 0.15 : 0.3), y0 = PP ? C.surf : (C.netBot || 0), y1 = C.surf + C.netH;
      [-w2, w2].forEach((x) => cam.line(g, [x, PP ? C.surf : 0, NZ], [x, y1 + (PP ? 0.01 : 0.05), NZ], '#343a40', PP ? 0.03 : 0.06));
      cam.poly(g, [[-w2, y0, NZ], [w2, y0, NZ], [w2, y1, NZ], [-w2, y1, NZ]], 'rgba(20,20,25,.42)');
      const n = PP ? 40 : 60;
      for (let i = 0; i <= n; i++) { const x = -w2 + 2 * w2 * i / n; cam.line(g, [x, y0, NZ], [x, y1, NZ], 'rgba(255,255,255,.25)', 0.005); }
      for (let j = 0; j <= 6; j++) { const y = y0 + (y1 - y0) * j / 6; cam.line(g, [-w2, y, NZ], [w2, y, NZ], 'rgba(255,255,255,.25)', 0.005); }
      cam.line(g, [-w2, y1, NZ], [w2, y1, NZ], '#fff', PP ? 0.012 : 0.05);
    }
    function drawTable(g) {
      const w2 = W / 2, s = C.surf;
      // chân bàn
      [[-w2 + 0.15, 0.25], [w2 - 0.15, 0.25], [-w2 + 0.15, L - 0.25], [w2 - 0.15, L - 0.25]].forEach(([x, z]) => cam.line(g, [x, 0, z], [x, s, z], '#212529', 0.05));
      cam.poly(g, [[-w2, s - 0.04, 0], [w2, s - 0.04, 0], [w2, s, 0], [-w2, s, 0]], '#adb5bd');
      cam.poly(g, [[-w2, s, 0], [w2, s, 0], [w2, s, L], [-w2, s, L]], '#1c7ed6');
      cam.poly(g, [[-w2, s, L * 0.5], [w2, s, L * 0.5], [w2, s, L], [-w2, s, L]], 'rgba(255,255,255,.06)');
      const Ln = (a, c, w) => cam.line(g, a, c, '#fff', w || 0.02);
      Ln([-w2, s, 0], [w2, s, 0]); Ln([-w2, s, L], [w2, s, L]); Ln([-w2, s, 0], [-w2, s, L]); Ln([w2, s, 0], [w2, s, L]); Ln([0, s, 0], [0, s, L], 0.006);
    }
    function drawBall(g) {
      if (b.trail.length > 2) { g.strokeStyle = BAD ? 'rgba(255,255,255,.35)' : 'rgba(255,230,120,.45)'; g.lineCap = 'round'; g.beginPath(); b.trail.forEach(([x, y, z], i) => { const q = cam.p(x, y, z); g.lineWidth = Math.max(1, 0.03 * q.k); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); }); g.stroke(); }
      const q = cam.p(b.x, b.y, b.z);
      if (BAD) {
        const ang = Math.atan2(-(cam.p(b.x + b.vx * 0.02, b.y + b.vy * 0.02, b.z + b.vz * 0.02).y - q.y), cam.p(b.x + b.vx * 0.02, b.y + b.vy * 0.02, b.z + b.vz * 0.02).x - q.x);
        const s = Math.max(4, 0.07 * q.k);
        g.save(); g.translate(q.x, q.y); g.rotate(-ang);
        g.fillStyle = '#f8f9fa'; g.beginPath(); g.moveTo(0, -s * 0.25); g.lineTo(-s * 1.3, -s * 0.7); g.lineTo(-s * 1.3, s * 0.7); g.lineTo(0, s * 0.25); g.closePath(); g.fill();
        g.strokeStyle = '#ced4da'; g.lineWidth = 1; g.stroke();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 0.1, 0, s * 0.35, 0, Math.PI * 2); g.fill();
        g.restore();
        return;
      }
      const r = Math.max(3, (PP ? 0.035 : 0.06) * q.k);
      g.fillStyle = PP ? '#fff4d6' : '#ffe066'; g.beginPath(); g.arc(q.x, q.y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = PP ? '#e8a33c' : '#c9a227'; g.lineWidth = 1; g.stroke();
      if (PK) { g.fillStyle = '#b08f1a'; [[-0.4, -0.3], [0.35, -0.2], [0, 0.4]].forEach(([dx, dy]) => { g.beginPath(); g.arc(q.x + dx * r, q.y + dy * r, r * 0.17, 0, Math.PI * 2); g.fill(); }); }
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(q.x - r * 0.35, q.y - r * 0.35, r * 0.3, 0, Math.PI * 2); g.fill();
    }
    function drawMyPaddle(g) {
      const q = cam.p(me.x, padY, me.z), r = 0.085 * q.k, tilt = Math.max(-0.5, Math.min(0.5, me.vx * 0.12)) + (me.swing > 0 ? Math.sin((1 - me.swing / 0.28) * Math.PI) * 0.5 : 0);
      g.save(); g.translate(q.x, q.y); g.rotate(tilt);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(r * 0.2, r * 0.3, r, r * 1.05, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#c08b5c'; rr(g, -r * 0.18, r * 0.75, r * 0.36, r * 1.1, r * 0.12); g.fill();
      g.fillStyle = '#e03131'; g.beginPath(); g.ellipse(0, 0, r * 0.95, r, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#8a5a32'; g.lineWidth = Math.max(2, r * 0.06); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(-r * 0.3, -r * 0.35, r * 0.35, r * 0.25, -0.5, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    return game;
  }
  function hint(g, text, yk) {
    const W = g.canvas.__vw || 1280, H = g.canvas.__vh || 720;
    g.save(); g.font = '900 18px "Be Vietnam Pro", system-ui'; const w = g.measureText(text).width + 36;
    g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, W / 2 - w / 2, H * yk - 20, w, 40, 20); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H * yk); g.restore();
  }


  /* ======================================================================
   * ⛳ GOLF — kiểu Golf Clash: sân 3D nhìn từ sau bóng, chọn điểm rơi, thanh lực chính xác, gió
   * ==================================================================== */
  const GHOLES = [
    { par: 4, path: [[0, 0], [0, 170], [35, 270], [55, 350]], hw: 20, green: [58, 360, 16], sand: [[24, 200, 13, 7], [86, 345, 9, 6], [36, 378, 10, 5]], water: [] },
    { par: 3, path: [[0, 0], [0, 168]], hw: 15, green: [0, 170, 15], sand: [[-21, 170, 7, 9], [20, 178, 7, 6]], water: [[0, 118, 30, 14]] },
    { par: 5, path: [[0, 0], [-25, 200], [10, 380], [0, 470]], hw: 22, green: [0, 480, 17], sand: [[-55, 210, 12, 7], [32, 395, 12, 7], [-16, 492, 9, 5]], water: [[-48, 260, 26, 16], [30, 300, 18, 11]] },
  ];
  const CLUBS = [{ n: 'Gậy gạt (Putter)', max: 30, a: 0, roll: 0 }, { n: 'Gậy kỹ thuật (Wedge)', max: 95, a: 46, roll: 0.03 }, { n: 'Gậy sắt 7', max: 155, a: 30, roll: 0.07 }, { n: 'Gậy gỗ 3', max: 205, a: 20, roll: 0.11 }, { n: 'Gậy Driver', max: 245, a: 15, roll: 0.14 }];
  function makeGolf(diff) {
    const G = 9.8, cam = { x: 0, y: 60, z: -25, yaw: 0, pitch: 0.8, F: 600, W: 1280, H: 720, cy: 0.5 };
    let hi = 0, strokes = 0, phase = 'aim', t = 0, wait = 0, meter = null, drag = false, tree = null;
    const cards = [], aiCards = [], msgs = [];
    const say = (text, color = '#fff', y = 0.4) => msgs.push({ text, color, y, t: 0 });
    const ball = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, roll: null, trail: [] };
    let H, centerline, trees, target = { x: 0, z: 100 }, wind = { a: 0, s: 0 }, lastSafe = [0, 0], camT = null;
    const dirTo = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]);
    /* ---------- địa hình ---------- */
    function segDist(px, pz, a, b) { const vx = b[0] - a[0], vz = b[1] - a[1], l2 = vx * vx + vz * vz, k = Math.max(0, Math.min(1, ((px - a[0]) * vx + (pz - a[1]) * vz) / l2)); return Math.hypot(px - a[0] - vx * k, pz - a[1] - vz * k); }
    const inEll = (x, z, e) => ((x - e[0]) / e[2]) ** 2 + ((z - e[1]) / e[3]) ** 2 <= 1;
    function terrain(x, z) {
      if (Math.hypot(x - H.green[0], z - H.green[1]) <= H.green[2]) return 'green';
      if (H.water.some((e) => inEll(x, z, e))) return 'water';
      if (H.sand.some((e) => inEll(x, z, e))) return 'sand';
      if (Math.abs(x) < 5 && Math.abs(z) < 6) return 'tee';
      let d = 1e9; for (let i = 0; i < H.path.length - 1; i++) d = Math.min(d, segDist(x, z, H.path[i], H.path[i + 1]));
      if (d <= H.hw && z > 25) return 'fairway';
      if (d > 85) return 'ob';
      return 'rough';
    }
    function load() {
      H = GHOLES[hi]; strokes = 0; phase = 'aim';
      ball.x = 0; ball.y = 0; ball.z = 0; ball.trail = []; lastSafe = [0, 0];
      wind = { a: Math.random() * Math.PI * 2, s: Math.round(Math.random() * (1.5 + diff * 1.5) * 10) / 10 };
      const r = srand((hi + 1) * 977); trees = [];
      for (let i = 0; i < 260 && trees.length < 90; i++) {
        const z = -30 + r() * (H.green[1] + 80), x = (r() - 0.5) * 260;
        let d = 1e9; for (let k = 0; k < H.path.length - 1; k++) d = Math.min(d, segDist(x, z, H.path[k], H.path[k + 1]));
        if (d > H.hw + 12 && Math.hypot(x - H.green[0], z - H.green[1]) > H.green[2] + 14 && !H.water.some((e) => inEll(x, z, [e[0], e[1], e[2] + 6, e[3] + 6]))) trees.push({ x, z, s: 8 + r() * 7, c: r() });
      }
      defaultTarget(); frame(true);
      say(`Lỗ ${hi + 1}/3 · Par ${H.par}`, '#fff3bf', 0.35);
    }
    const pin = () => [H.green[0], H.green[1]];
    const onGreen = () => terrain(ball.x, ball.z) === 'green';
    const lie = () => terrain(ball.x, ball.z);
    const lieK = () => ({ sand: 0.6, rough: 0.85 })[lie()] || 1;
    function club() {
      if (onGreen()) return CLUBS[0];
      const d = Math.hypot(target.x - ball.x, target.z - ball.z) / lieK();
      return CLUBS.slice(1).find((c) => c.max >= d) || CLUBS[CLUBS.length - 1];
    }
    function defaultTarget() {
      const p = pin(), d = Math.hypot(p[0] - ball.x, p[1] - ball.z);
      if (onGreen()) { target = { x: p[0], z: p[1] }; return; }
      // đi dọc đường giữa fairway: điểm xa nhất trong tầm gậy driver
      const max = 235 * lieK();
      if (d <= max) { target = { x: p[0], z: p[1] }; return; }
      let best = null;
      for (let i = 0; i < H.path.length - 1; i++) for (let k = 0; k <= 20; k++) { const a = H.path[i], b = H.path[i + 1], x = a[0] + (b[0] - a[0]) * k / 20, z = a[1] + (b[1] - a[1]) * k / 20, dd = Math.hypot(x - ball.x, z - ball.z); if (dd <= max && z > ball.z && (!best || z > best.z)) best = { x, z }; }
      target = best || { x: ball.x + (p[0] - ball.x) / d * max, z: ball.z + (p[1] - ball.z) / d * max };
    }
    /* ---------- camera ---------- */
    function frame(snap) {
      const putt = onGreen() || phase === 'putt';
      const tx = target.x, tz = target.z, d = Math.max(putt ? 6 : 40, Math.hypot(tx - ball.x, tz - ball.z));
      const yaw = Math.atan2(tx - ball.x, tz - ball.z), back = putt ? 3 + d * 0.15 : 22, h = putt ? 2.5 + d * 0.35 : 26 + d * 0.32;
      const a1 = Math.atan2(h, back), a2 = Math.atan2(h, back + d + (putt ? 2 : 25));
      const c = { yaw, x: ball.x - Math.sin(yaw) * back, z: ball.z - Math.cos(yaw) * back, y: h, pitch: (a1 + a2) / 2, half: (a1 - a2) / 2 };
      camT = c; if (snap) Object.assign(cam, c);
    }
    function camStep(dt) {
      if (!camT) return;
      const k = Math.min(1, dt * 3);
      let dy = camT.yaw - cam.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      cam.yaw += dy * k; ['x', 'y', 'z', 'pitch', 'half'].forEach((p) => { cam[p] = (cam[p] ?? camT[p]) + (camT[p] - (cam[p] ?? camT[p])) * k; });
    }
    const toC = (x, y, z) => {
      const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z, cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
      const X = dx * cy - dz * sy, Dz = dx * sy + dz * cy, c = Math.cos(cam.pitch), s = Math.sin(cam.pitch);
      return { X, Y: dy * c + Dz * s, Z: -dy * s + Dz * c };
    };
    const proj = (C) => { const k = cam.F / Math.max(0.05, C.Z); return { x: cam.W / 2 + C.X * k, y: cam.H * cam.cy - C.Y * k, k }; };
    const P = (x, y, z) => proj(toC(x, y, z));
    function poly(g, pts, fill) {
      // cắt theo mặt phẳng gần (Z > 0.5) rồi chiếu
      const cs = pts.map(([x, z, y]) => toC(x, y || 0, z)), out = [], N = 0.5;
      for (let i = 0; i < cs.length; i++) {
        const a = cs[i], b = cs[(i + 1) % cs.length], ia = a.Z > N, ib = b.Z > N;
        if (ia) out.push(a);
        if (ia !== ib) { const k = (N - a.Z) / (b.Z - a.Z); out.push({ X: a.X + (b.X - a.X) * k, Y: a.Y + (b.Y - a.Y) * k, Z: N }); }
      }
      if (out.length < 3) return;
      g.beginPath(); out.forEach((c, i) => { const p = proj(c); if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.closePath(); g.fillStyle = fill; g.fill();
    }
    const ellPts = (e, n = 28) => Array.from({ length: n }, (_, i) => [e[0] + Math.cos(i / n * Math.PI * 2) * e[2], e[1] + Math.sin(i / n * Math.PI * 2) * e[3]]);
    function corridor(hw) {
      const L = [], R = [];
      for (let i = 0; i < H.path.length - 1; i++) {
        const a = H.path[i], b = H.path[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(len / 10);
        for (let k = 0; k <= n; k++) { const x = a[0] + (b[0] - a[0]) * k / n, z = a[1] + (b[1] - a[1]) * k / n; if (z < 25) continue; const nx = (b[1] - a[1]) / len, nz = -(b[0] - a[0]) / len, w = hw * (0.85 + 0.15 * Math.sin(z * 0.05)); L.push([x - nx * w, z - nz * w]); R.push([x + nx * w, z + nz * w]); }
      }
      return L.concat(R.reverse());
    }
    /* ---------- đánh bóng ---------- */
    function shoot(err) {
      const c = club(), d0 = Math.hypot(target.x - ball.x, target.z - ball.z), dir = Math.atan2(target.x - ball.x, target.z - ball.z);
      strokes++; lastSafe = [ball.x, ball.z];
      if (c.max === 30) { // gạt bóng: lăn trên green
        const d = Math.min(30, d0) * (1 + err * 0.12), v = Math.sqrt(2 * 1.3 * d);
        ball.roll = { vx: Math.sin(dir + err * 0.05) * v, vz: Math.cos(dir + err * 0.05) * v, a: 1.3 };
        phase = 'roll'; return;
      }
      const perfect = Math.abs(err) < 0.12;
      if (perfect) say('🎯 HOÀN HẢO!', '#69db7c', 0.3); else if (Math.abs(err) > 0.6) say(err > 0 ? 'Lệch phải!' : 'Lệch trái!', '#ffa8a8', 0.3);
      const dist = Math.min(d0, c.max * lieK()) * (perfect ? 1 : 1 - Math.abs(err) * 0.08);
      const side = perfect ? 0 : err * (8 + dist * 0.09);
      const tx = ball.x + Math.sin(dir) * dist + Math.cos(dir) * side, tz = ball.z + Math.cos(dir) * dist - Math.sin(dir) * side;
      const th = c.a * Math.PI / 180, v = Math.sqrt(G * dist / Math.sin(2 * th)), T = 2 * v * Math.sin(th) / G;
      const ux = (tx - ball.x) / dist, uz = (tz - ball.z) / dist;
      ball.vx = ux * v * Math.cos(th) + Math.sin(wind.a) * wind.s * 0.55; ball.vz = uz * v * Math.cos(th) + Math.cos(wind.a) * wind.s * 0.55; ball.vy = v * Math.sin(th);
      ball.club = c; ball.T = T; ball.trail = []; phase = 'fly'; tree = null;
      camT = { ...camT };
    }
    function settle() {
      const tr = lie();
      if (tr === 'water' || tr === 'ob') { strokes++; say(tr === 'water' ? '💦 Rơi xuống hồ! +1 gậy' : '🌲 Bóng ra ngoài sân! +1 gậy', '#a5d8ff', 0.35); ball.x = lastSafe[0]; ball.z = lastSafe[1]; ball.y = 0; }
      else if (tr === 'sand') say('🏖️ Rơi vào hố cát', '#ffe8a3', 0.35);
      if (strokes >= 10) { holeDone(true); return; }
      phase = 'aim'; defaultTarget(); frame(false);
    }
    function holeDone(pick) {
      const d = strokes - H.par;
      cards.push(strokes);
      const ai = Math.max(2, H.par + [[0, 1, 1, 2], [-1, 0, 0, 1], [-1, -1, 0, 0]][diff][Math.floor(Math.random() * 4)]);
      aiCards.push(ai);
      say(pick ? '🫳 Nhặt bóng' : strokes === 1 ? '🏆 HOLE IN ONE!!!' : d <= -2 ? '🦅 EAGLE!' : d === -1 ? '🐦 BIRDIE!' : d === 0 ? '👍 PAR' : d === 1 ? 'Bogey' : `+${d}`, d <= 0 ? '#ffe066' : '#fff', 0.32);
      say(`🤖 Máy: ${ai} gậy`, '#ffa8a8', 0.4);
      phase = 'next'; wait = 2.2;
    }
    function step(dt) {
      t += dt; camStep(dt);
      if (meter) meter.v = Math.sin(t * (2.6 + diff * 0.6) + meter.ph);
      if (phase === 'next') { if ((wait -= dt) <= 0) { if (hi >= GHOLES.length - 1) { const a = cards.reduce((s, v) => s + v, 0), b = aiCards.reduce((s, v) => s + v, 0); game.over = true; game.res = { win: a < b, draw: a === b, strokes: a, ai: b, par: GHOLES.reduce((s, h) => s + h.par, 0), cards }; return; } hi++; load(); } return; }
      if (phase === 'fly') {
        const px = ball.x, pz = ball.z;
        ball.vy -= G * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt;
        ball.trail.push([ball.x, ball.y, ball.z]); if (ball.trail.length > 60) ball.trail.shift();
        if (ball.y < 14) { const hit = trees.find((tr) => Math.hypot(tr.x - ball.x, tr.z - ball.z) < 3 && ball.y < tr.s); if (hit) { say('🌳 Trúng cây!', '#ffa8a8', 0.35); ball.x = px; ball.z = pz; ball.vx *= -0.15; ball.vz *= -0.15; ball.vy = Math.min(ball.vy, 0); } }
        if (ball.y <= 0) {
          ball.y = 0; const tr = lie();
          if (tr === 'water' || tr === 'ob') return settle();
          const sp = Math.hypot(ball.vx, ball.vz), k = ball.club.roll * ({ fairway: 1, green: 0.5, rough: 0.35, sand: 0, tee: 1 }[tr] || 0.5);
          const rd = Math.hypot(ball.x - lastSafe[0], ball.z - lastSafe[1]) * k, a = 3.5, v = Math.sqrt(2 * a * rd);
          ball.roll = sp > 0.01 ? { vx: ball.vx / sp * v, vz: ball.vz / sp * v, a } : { vx: 0, vz: 0, a };
          phase = 'roll';
        }
        return;
      }
      if (phase === 'roll') {
        const r = ball.roll, tr = lie(), a = tr === 'green' ? 1.3 : tr === 'sand' ? 30 : tr === 'rough' ? 9 : r.a;
        const sp = Math.hypot(r.vx, r.vz);
        if (sp > 0) { const ns = Math.max(0, sp - a * dt); r.vx *= ns / sp; r.vz *= ns / sp; }
        ball.x += r.vx * dt; ball.z += r.vz * dt;
        const dh = Math.hypot(ball.x - H.green[0], ball.z - H.green[1]);
        if (dh < 0.11 && sp < 2.2) { ball.y = -0.06; holeDone(false); return; }
        if (dh < 0.11 && sp >= 2.2) say('Lướt qua lỗ!', '#fff', 0.4);
        if (dh < 0.6 && sp < 1.2) { r.vx += (H.green[0] - ball.x) * 3 * dt; r.vz += (H.green[1] - ball.z) * 3 * dt; }
        if (lie() === 'water' || lie() === 'ob') return settle();
        if (Math.hypot(r.vx, r.vz) < 0.03) settle();
      }
    }
    const BTN = () => ({ x: game.VW - 250, y: game.VH - 110, w: 230, h: 90 });
    const inBtn = (p) => { const b = BTN(); return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; };
    function setTarget(p) {
      const c = Math.cos(cam.pitch), s = Math.sin(cam.pitch), X = (p.x - cam.W / 2) / cam.F, Y = (cam.H * cam.cy - p.y) / cam.F;
      const dy = c * Y - s, dzc = s * Y + c; if (dy > -0.01) return;
      const tt = -cam.y / dy, lx = tt * X, lz = tt * dzc, cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
      let x = cam.x + lx * cy + lz * sy, z = cam.z - lx * sy + lz * cy;
      const max = onGreen() ? 30 : 245 * lieK(), d = Math.hypot(x - ball.x, z - ball.z);
      if (d > max) { x = ball.x + (x - ball.x) / d * max; z = ball.z + (z - ball.z) / d * max; }
      if (d < 2) return;
      target = { x, z };
    }
    const game = {
      VW: 1280, VH: 720, wide: true, over: false, res: null,
      update(dt) { for (let k = 0; k < 2; k++) { step(dt / 2); if (game.over) break; } msgs.forEach((m) => { m.t += dt; }); while (msgs.length && msgs[0].t > 1.8) msgs.shift(); },
      down(p) {
        if (phase !== 'aim') return;
        if (meter) { const e = meter.v; meter = null; shoot(e); return; }
        if (inBtn(p)) { if (onGreen()) shoot((Math.random() - 0.5) * 0.25); else meter = { v: 0, ph: Math.random() * 6 }; return; }
        drag = true; setTarget(p);
      },
      move(p) { if (drag && phase === 'aim' && !meter) setTarget(p); },
      up() { if (drag) { drag = false; frame(false); } },
      key(k, on) { if (on && (k === ' ' || k === 'Enter')) game.down(game.btnCenter()); },
      btnCenter() { const b = BTN(); return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; },
      draw(g) {
        cam.W = game.VW; cam.H = game.VH; cam.F = cam.H * 0.42 / Math.tan(Math.max(0.12, cam.half || 0.4));
        const hz = cam.H * cam.cy - cam.F * Math.tan(cam.pitch);
        if (hz > 0) { const sk = g.createLinearGradient(0, 0, 0, hz); sk.addColorStop(0, '#74c0fc'); sk.addColorStop(1, '#d0ebff'); g.fillStyle = sk; g.fillRect(0, 0, cam.W, hz + 1); }
        g.fillStyle = '#3f8f3a'; g.fillRect(0, Math.max(0, hz), cam.W, cam.H);
        // fairway có sọc cắt cỏ
        const fw = corridor(H.hw);
        poly(g, corridor(H.hw + 6), '#4fa646'); poly(g, fw, '#78c850');
        g.save(); g.beginPath(); fw.forEach(([x, z], i) => { const q = proj(toC(x, 0, z)); if (toC(x, 0, z).Z > 0.5) { if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); } }); g.closePath(); g.clip();
        for (let z = 20; z < H.green[1] + 30; z += 22) poly(g, [[-300, z], [300, z], [300, z + 11], [-300, z + 11]], 'rgba(255,255,255,.07)');
        g.restore();
        poly(g, [[-6, -7], [6, -7], [6, 7], [-6, 7]], '#8bd06a');
        poly(g, ellPts([H.green[0], H.green[1], H.green[2] + 3, H.green[2] + 3]), '#5fb84a');
        poly(g, ellPts([H.green[0], H.green[1], H.green[2], H.green[2]]), '#94e07a');
        H.sand.forEach((e) => { poly(g, ellPts([e[0], e[1], e[2] + 1, e[3] + 1]), '#d9c27a'); poly(g, ellPts(e), '#f6e6ad'); });
        H.water.forEach((e) => { poly(g, ellPts([e[0], e[1], e[2] + 1.5, e[3] + 1.5]), '#2f7d3a'); poly(g, ellPts(e), '#3d9be9'); poly(g, ellPts([e[0] - e[2] * 0.2, e[1], e[2] * 0.5, e[3] * 0.4]), 'rgba(255,255,255,.18)'); });
        // vòng ngắm + đường bay dự kiến
        if (phase === 'aim') {
          const putt = onGreen();
          [[putt ? 0.9 : 7, 'rgba(255,255,255,.85)'], [putt ? 0.55 : 4.5, '#ffd43b'], [putt ? 0.25 : 2, '#ff922b']].forEach(([r, c]) => poly(g, ellPts([target.x, target.z, r, r], 24).map(([x, z]) => [x, z, 0.02]), c));
          const c = club(), d = Math.hypot(target.x - ball.x, target.z - ball.z), th = c.a * Math.PI / 180;
          g.setLineDash([10, 9]); g.strokeStyle = 'rgba(160,240,255,.95)'; g.lineWidth = 3; g.beginPath();
          for (let i = 0; i <= 40; i++) { const k = i / 40, x = ball.x + (target.x - ball.x) * k, z = ball.z + (target.z - ball.z) * k, y = putt ? 0.02 : Math.tan(th) * d * k * (1 - k), q = toC(x, y, z); if (q.Z < 0.5) continue; const pp = proj(q); if (i) g.lineTo(pp.x, pp.y); else g.moveTo(pp.x, pp.y); }
          g.stroke(); g.setLineDash([]);
        }
        // lá cờ + cây (xa trước gần sau)
        const items = trees.map((tr) => ({ z: toC(tr.x, 0, tr.z).Z, d: () => drawTree(g, tr) }));
        items.push({ z: toC(H.green[0], 0, H.green[1]).Z, d: () => drawPin(g) });
        items.push({ z: toC(ball.x, 0, ball.z).Z - 0.1, d: () => drawBall(g) });
        items.filter((it) => it.z > 0.5).sort((a, b) => b.z - a.z).forEach((it) => it.d());
        // người chơi đứng cạnh bóng lúc ngắm
        if (phase === 'aim' && !onGreen()) { const q = toC(ball.x - Math.cos(cam.yaw) * 0.9, 0, ball.z + Math.sin(cam.yaw) * 0.9); if (q.Z > 0.5) { const pp = proj(q); backFigure(g, pp, pp.k, S().look || {}, { racket: true, swing: meter ? 0.1 : 0, color: '#adb5bd' }); } }
        hud(g);
        drawMsgs(g, msgs.map((m) => ({ ...m, x: game.VW / 2, y: game.VH * m.y })));
      },
    };
    function drawTree(g, tr) {
      const b = P(tr.x, 0, tr.z), top = P(tr.x, tr.s, tr.z), r = tr.s * 0.42 * b.k;
      if (r < 1) return;
      g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(b.x + r * 0.3, b.y, r * 0.9, r * 0.35, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#5c3a1e'; g.lineWidth = Math.max(1, r * 0.18); g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(top.x, (b.y + top.y) / 2); g.stroke();
      const cy = (b.y * 0.35 + top.y * 0.65), col = tr.c > 0.5 ? ['#1e5f2b', '#2b7a3a', '#3f9a4c'] : ['#22552a', '#2f6d33', '#4c8f3c'];
      [[0, 0, 1, 0], [-0.45, 0.25, 0.7, 0], [0.45, 0.2, 0.7, 0], [0, -0.4, 0.75, 1], [-0.2, -0.15, 0.4, 2]].forEach(([dx, dy, s, ci]) => { g.fillStyle = col[ci]; g.beginPath(); g.arc(b.x + dx * r, cy + dy * r, r * s, 0, Math.PI * 2); g.fill(); });
    }
    function drawPin(g) {
      const b = P(H.green[0], 0, H.green[1]), top = P(H.green[0], 2.4, H.green[1]);
      g.fillStyle = '#1d3b12'; g.beginPath(); g.ellipse(b.x, b.y, Math.max(2, 0.11 * b.k), Math.max(1, 0.05 * b.k), 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#f8f9fa'; g.lineWidth = Math.max(1.5, 0.03 * b.k); g.beginPath(); g.moveTo(b.x, b.y); g.lineTo(top.x, top.y); g.stroke();
      const fl = Math.max(8, 0.55 * top.k), w = Math.sin(t * 5) * fl * 0.08;
      g.fillStyle = '#ff6b6b'; g.beginPath(); g.moveTo(top.x, top.y); g.quadraticCurveTo(top.x + fl * 0.6, top.y + fl * 0.2 + w, top.x + fl, top.y + fl * 0.3); g.lineTo(top.x, top.y + fl * 0.6); g.closePath(); g.fill();
    }
    function drawBall(g) {
      if (ball.trail.length > 1) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); let st = false; ball.trail.forEach(([x, y, z]) => { const q = toC(x, y, z); if (q.Z < 0.5) return; const pp = proj(q); if (st) g.lineTo(pp.x, pp.y); else { g.moveTo(pp.x, pp.y); st = true; } }); g.stroke(); }
      const s = P(ball.x, 0, ball.z), q = P(ball.x, Math.max(0, ball.y) + 0.05, ball.z), r = Math.max(3, 0.06 * q.k);
      if (ball.y < -0.01) return;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(s.x, s.y, r, r * 0.4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(q.x, q.y - r * 0.6, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#adb5bd'; g.lineWidth = 1; g.stroke();
    }
    function hud(g) {
      const W = game.VW, Hh = game.VH, tot = cards.reduce((s, v) => s + v, 0), aiTot = aiCards.reduce((s, v) => s + v, 0);
      g.fillStyle = 'rgba(10,30,60,.75)'; rr(g, W / 2 - 230, 10, 460, 54, 14); g.fill();
      g.font = '900 18px "Be Vietnam Pro", system-ui'; g.textBaseline = 'middle';
      g.textAlign = 'left'; g.fillStyle = '#8ce99a'; g.fillText(`🧑 Bạn: ${tot + strokes}`, W / 2 - 215, 37);
      g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(`⛳ Lỗ ${hi + 1}/3 · Par ${H.par} · Gậy ${strokes}`, W / 2, 37);
      g.textAlign = 'right'; g.fillStyle = '#ffa8a8'; g.fillText(`🤖 ${aiTot}`, W / 2 + 215, 37);
      // gió
      g.fillStyle = 'rgba(10,30,60,.75)'; rr(g, 14, 80, 120, 110, 14); g.fill();
      g.fillStyle = '#fff'; g.font = '900 14px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.fillText('GIÓ', 74, 98);
      g.save(); g.translate(74, 135); g.rotate(wind.a - cam.yaw); g.fillStyle = '#ff922b'; g.beginPath(); g.moveTo(0, -24); g.lineTo(14, 2); g.lineTo(5, 2); g.lineTo(5, 20); g.lineTo(-5, 20); g.lineTo(-5, 2); g.lineTo(-14, 2); g.closePath(); g.fill(); g.restore();
      g.fillStyle = '#fff'; g.font = '900 16px "Be Vietnam Pro", system-ui'; g.fillText(`${wind.s} m/s`, 74, 176);
      if (phase !== 'aim') return;
      const c = club(), d = Math.hypot(target.x - ball.x, target.z - ball.z), dp = Math.hypot(H.green[0] - ball.x, H.green[1] - ball.z);
      g.fillStyle = 'rgba(10,30,60,.75)'; rr(g, 14, Hh - 104, 300, 88, 14); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = '900 17px "Be Vietnam Pro", system-ui'; g.fillText(`🏌️ ${c.n}`, 30, Hh - 80);
      g.font = '800 14px "Be Vietnam Pro", system-ui'; g.fillText(`Đánh ${Math.round(d)}m · cách cờ ${Math.round(dp)}m`, 30, Hh - 56);
      g.fillStyle = '#ffd43b'; g.fillText(`Nằm ở: ${({ fairway: 'fairway', rough: 'cỏ dày', sand: 'hố cát', green: 'green', tee: 'điểm phát bóng' })[lie()] || lie()}`, 30, Hh - 34);
      const b = BTN();
      const gr = g.createLinearGradient(0, b.y, 0, b.y + b.h); gr.addColorStop(0, '#ff922b'); gr.addColorStop(1, '#e8590c');
      g.fillStyle = gr; rr(g, b.x, b.y, b.w, b.h, 22); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke();
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 30px "Be Vietnam Pro", system-ui'; g.fillText(meter ? 'DỪNG!' : onGreen() ? 'GẠT BÓNG' : 'ĐÁNH', b.x + b.w / 2, b.y + b.h / 2);
      if (meter) {
        const mw = Math.min(560, W - 80), mx = W / 2 - mw / 2, my = Hh - 190;
        g.fillStyle = 'rgba(0,0,0,.6)'; rr(g, mx - 10, my - 10, mw + 20, 56, 14); g.fill();
        g.fillStyle = '#e03131'; g.fillRect(mx, my, mw, 36); g.fillStyle = '#fab005'; g.fillRect(mx + mw * 0.3, my, mw * 0.4, 36); g.fillStyle = '#40c057'; g.fillRect(mx + mw * 0.44, my, mw * 0.12, 36);
        g.fillStyle = '#fff'; g.font = '900 12px "Be Vietnam Pro", system-ui'; g.fillText('HOÀN HẢO', W / 2, my + 18);
        const px = mx + (meter.v + 1) / 2 * mw; g.fillStyle = '#fff'; g.fillRect(px - 4, my - 8, 8, 52); g.strokeStyle = '#212529'; g.lineWidth = 2; g.strokeRect(px - 4, my - 8, 8, 52);
        g.font = '900 15px "Be Vietnam Pro", system-ui'; g.fillText('👆 Chạm để dừng đúng vùng xanh', W / 2, my - 22);
      } else if (strokes === 0 && hi === 0) {
        g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, W / 2 - 300, Hh - 170, 600, 40, 20); g.fill(); g.fillStyle = '#fff'; g.font = '900 16px "Be Vietnam Pro", system-ui';
        g.fillText('👆 Kéo trên sân để chọn chỗ bóng rơi · bấm ĐÁNH', W / 2, Hh - 150);
      }
    }
    load();
    return game;
  }


  /* ======================================================================
   * 🏀 BÓNG RỔ 3D — camera sau lưng người ném, vuốt lên (ở đâu trên màn hình cũng được) để ném
   * ==================================================================== */
  function makeBasket() {
    const G = 9.8, RIM = 3.05, RR = 0.23, BRd = 0.12, HZ = 6.4;
    const SPOTS = [[0, 0.0], [-1.6, 0.6], [1.6, 0.6], [-3, 1.4], [3, 1.4], [0, -1.6], [-2.2, -0.9], [2.2, -0.9]];
    const cam = makeCam({ y: 2.15, z: -3.4, pitch: -0.04, f: 1.15, cy: 0.52 });
    const me = { x: 0, z: 0, spot: 0, tx: 0, tz: 0, t: 0, throwT: 0 };
    const ball = { x: 0, y: 2.2, z: 0.35, vx: 0, vy: 0, vz: 0, st: 'hold', touched: false, scored: false, wait: 0, spin: 0 };
    let score = 0, streak = 0, shots = 0, makes = 0, time = 45, t = 0, ended = false, swipe = null, netK = 0, lastAim = null;
    const msgs = [];
    const say = (text, color = '#fff', y = 0.32) => msgs.push({ text, color, y, t: 0 });
    const hoop = { x: 0, z: HZ };
    const hand = () => ({ x: me.x + 0.05, y: 2.15 + Math.sin(t * 3) * 0.03, z: me.z + 0.35 });
    function reset() { const h = hand(); Object.assign(ball, h, { vx: 0, vy: 0, vz: 0, st: 'hold', touched: false, scored: false }); }
    function moveSpot() { me.spot = (me.spot + 1 + Math.floor(Math.random() * (SPOTS.length - 1))) % SPOTS.length; const [x, dz] = SPOTS[me.spot]; me.tx = x; me.tz = dz; }
    reset();
    function shoot(dx, dy) {
      const h = hand(), B = cam.p(h.x, h.y, h.z), R = cam.p(hoop.x, RIM, hoop.z);
      const want = Math.atan2(R.x - B.x, -(R.y - B.y)), got = Math.atan2(dx, -dy);
      let lat = Math.tan(Math.max(-0.6, Math.min(0.6, got - want))) * (hoop.z - h.z) * 0.9;
      const ideal = game.VH * 0.32, f = Math.max(0.5, Math.min(1.6, Math.hypot(dx, dy) / ideal));
      let dd = (f - 1) * 0.45;
      if (Math.abs(lat) < 0.14) lat *= 0.4; if (Math.abs(dd) < 0.07) dd *= 0.3;
      const D0 = Math.hypot(hoop.x - h.x, hoop.z - h.z), ux = (hoop.x - h.x) / D0, uz = (hoop.z - h.z) / D0;
      const tx = hoop.x + ux * D0 * dd + uz * lat, tz = hoop.z + uz * D0 * dd - ux * lat;
      const Dh = Math.hypot(tx - h.x, tz - h.z), a = 52 * Math.PI / 180, hh = RIM + 0.05 - h.y;
      const v = Math.sqrt(G * Dh * Dh / (2 * Math.cos(a) ** 2 * Math.max(0.3, Dh * Math.tan(a) - hh)));
      ball.vx = (tx - h.x) / Dh * v * Math.cos(a); ball.vz = (tz - h.z) / Dh * v * Math.cos(a); ball.vy = v * Math.sin(a);
      Object.assign(ball, h); ball.st = 'fly'; shots++; me.throwT = 0.5; lastAim = null;
    }
    function step(dt) {
      t += dt;
      if (!ended) { time -= dt; if (time <= 0) { time = 0; ended = true; } }
      netK = Math.max(0, netK - dt * 2.2); me.throwT = Math.max(0, me.throwT - dt);
      const ox = me.x, oz = me.z; me.x += (me.tx - me.x) * Math.min(1, dt * 4); me.z += (me.tz - me.z) * Math.min(1, dt * 4); me.moving = Math.hypot(me.x - ox, me.z - oz) > 0.002; if (me.moving) me.t += dt;
      cam.x += (me.x * 0.75 - cam.x) * Math.min(1, dt * 3); cam.z = me.z - 3.4;
      if (ball.st === 'hold') { Object.assign(ball, hand()); if (ended) { game.over = true; game.res = { win: score >= 10, score, makes, shots }; } return; }
      if (ball.st === 'wait') { if ((ball.wait -= dt) <= 0) reset(); return; }
      const py = ball.y;
      ball.vy -= G * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt; ball.spin += dt * 8;
      // vành rổ (vòng tròn): đẩy bóng ra khỏi ống vành
      const hx = ball.x - hoop.x, hz2 = ball.z - hoop.z, hd = Math.hypot(hx, hz2) || 0.0001;
      const qx = hoop.x + hx / hd * RR, qz = hoop.z + hz2 / hd * RR, dx = ball.x - qx, dy = ball.y - RIM, dz = ball.z - qz, d = Math.hypot(dx, dy, dz);
      if (d < BRd + 0.02 && !ball.scored) { const nx = dx / d, ny = dy / d, nz = dz / d, vn = ball.vx * nx + ball.vy * ny + ball.vz * nz; if (vn < 0) { ball.vx -= 1.6 * vn * nx; ball.vy -= 1.6 * vn * ny; ball.vz -= 1.6 * vn * nz; } const push = BRd + 0.02 - d; ball.x += nx * push; ball.y += ny * push; ball.z += nz * push; ball.touched = true; }
      // bảng rổ
      const bz = hoop.z + RR + 0.15;
      if (ball.z + BRd > bz && ball.vz > 0 && Math.abs(ball.x - hoop.x) < 0.9 && ball.y > 2.9 && ball.y < 3.95) { ball.z = bz - BRd; ball.vz *= -0.55; ball.touched = true; }
      // vào rổ
      if (!ball.scored && py > RIM && ball.y <= RIM && Math.hypot(ball.x - hoop.x, ball.z - hoop.z) < RR - 0.04) {
        ball.scored = true; makes++; streak++; netK = 1;
        const swish = !ball.touched, fire = streak >= 3, pts = (swish ? 2 : 1) * (fire ? 2 : 1);
        score += pts; if (swish) time = Math.min(60, time + 2);
        say(`${swish ? '🎯 Ngọt! ' : '✅ Vào! '}+${pts}${fire ? ' 🔥' : ''}`, swish ? '#ffe066' : '#fff');
        ball.vx *= 0.2; ball.vz *= 0.2;
      }
      if (ball.y < BRd) { ball.y = BRd; ball.vy = Math.abs(ball.vy) * 0.55; ball.vx *= 0.8; ball.vz *= 0.8; if (Math.abs(ball.vy) < 1.2) finish(); }
      if (ball.z > hoop.z + 4 || ball.z < -4 || Math.abs(ball.x) > 8) finish();
    }
    function finish() {
      if (ball.st !== 'fly') return;
      if (!ball.scored) { if (streak >= 3) say('Mất chuỗi 🔥', '#ffa8a8', 0.38); streak = 0; say('Trượt rồi!', '#ffa8a8', 0.32); }
      else if (makes % 2 === 0) moveSpot();
      ball.st = 'wait'; ball.wait = 0.35;
    }
    const game = {
      VW: 1280, VH: 720, wide: true, over: false, res: null,
      update(dt) { for (let k = 0; k < 4; k++) { step(dt / 4); if (game.over) break; } msgs.forEach((m) => { m.t += dt; }); while (msgs.length && msgs[0].t > 1.2) msgs.shift(); },
      down(p) { if (ball.st === 'hold' && !ended) swipe = { x: p.x, y: p.y, cx: p.x, cy: p.y }; },
      move(p) { if (swipe) { swipe.cx = p.x; swipe.cy = p.y; lastAim = swipe; } },
      up(p) { if (!swipe) return; const dx = p.x - swipe.x, dy = p.y - swipe.y; swipe = null; lastAim = null; if (dy < -30 && ball.st === 'hold') shoot(dx, dy); },
      key(k, on) { if (on && (k === ' ' || k === 'ArrowUp') && ball.st === 'hold' && !ended) { const h = hand(), B = cam.p(h.x, h.y, h.z), R = cam.p(hoop.x, RIM, hoop.z), L = game.VH * 0.32, a = Math.atan2(R.x - B.x, -(R.y - B.y)); shoot(Math.sin(a) * L, -Math.cos(a) * L); } },
      draw(g) {
        cam.set(game.VW, game.VH);
        arena(g, cam, HZ + 6, { wall1: '#18243d', wall2: '#33507f', floor1: '#d79a5c', floor2: '#b0733a', crowd: true, wood: true, banner: ['🏀 QL HOOPS', 'SLAM DUNK', 'SPORTS DRINK', 'HÀ NỘI'] });
        // vạch sân
        const L = (a, c, w = 0.05, col = '#fff') => cam.line(g, a, c, col, w);
        cam.poly(g, [[-2.45, 0.001, HZ - 5.8], [2.45, 0.001, HZ - 5.8], [2.45, 0.001, HZ + 1.2], [-2.45, 0.001, HZ + 1.2]], 'rgba(28,126,214,.55)');
        L([-2.45, 0.002, HZ - 5.8], [2.45, 0.002, HZ - 5.8]); L([-2.45, 0.002, HZ - 5.8], [-2.45, 0.002, HZ + 1.2]); L([2.45, 0.002, HZ - 5.8], [2.45, 0.002, HZ + 1.2]); L([-8, 0.002, HZ + 1.2], [8, 0.002, HZ + 1.2]);
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= 40; i++) { const a = Math.PI * (0.07 + 0.86 * i / 40), q = cam.p(hoop.x + Math.cos(a) * 6.75, 0.002, hoop.z - Math.sin(a) * 6.75); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); } g.stroke();
        // cột + bảng
        const bz = hoop.z + RR + 0.15;
        cam.line(g, [hoop.x, 0, bz + 1.0], [hoop.x, 3.4, bz + 1.0], '#495057', 0.16); cam.line(g, [hoop.x, 3.3, bz + 1.0], [hoop.x, 3.3, bz], '#495057', 0.1);
        cam.poly(g, [[hoop.x - 0.9, 2.9, bz], [hoop.x + 0.9, 2.9, bz], [hoop.x + 0.9, 3.95, bz], [hoop.x - 0.9, 3.95, bz]], 'rgba(240,248,255,.92)');
        [[[-0.9, 2.9], [0.9, 2.9]], [[0.9, 2.9], [0.9, 3.95]], [[0.9, 3.95], [-0.9, 3.95]], [[-0.9, 3.95], [-0.9, 2.9]]].forEach(([a, c]) => L([hoop.x + a[0], a[1], bz], [hoop.x + c[0], c[1], bz], 0.04, '#212529'));
        [[[-0.3, 3.0], [0.3, 3.0]], [[0.3, 3.0], [0.3, 3.45]], [[0.3, 3.45], [-0.3, 3.45]], [[-0.3, 3.45], [-0.3, 3.0]]].forEach(([a, c]) => L([hoop.x + a[0], a[1], bz - 0.01], [hoop.x + c[0], c[1], bz - 0.01], 0.04, '#e03131'));
        L([hoop.x, RIM, bz], [hoop.x, RIM, hoop.z + RR], 0.04, '#d9480f');
        const ring = (half) => { g.beginPath(); for (let i = 0; i <= 24; i++) { const a = (half ? Math.PI : 0) + Math.PI * i / 24, q = cam.p(hoop.x + Math.cos(a) * RR, RIM, hoop.z + Math.sin(a) * RR); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); } const k = cam.p(hoop.x, RIM, hoop.z).k; g.strokeStyle = '#f76707'; g.lineWidth = Math.max(2, 0.035 * k); g.stroke(); };
        const behind = ball.st === 'fly' && ball.z > hoop.z - 0.05 && ball.y < RIM + 0.15;
        ring(false); // nửa sau (xa)
        if (behind) drawBall(g);
        // lưới
        const k0 = cam.p(hoop.x, RIM, hoop.z).k, nl = 0.45 + netK * 0.12;
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(1, 0.008 * k0);
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, A = cam.p(hoop.x + Math.cos(a) * RR, RIM, hoop.z + Math.sin(a) * RR), B = cam.p(hoop.x + Math.cos(a + 0.4) * 0.13 + Math.sin(t * 9 + i) * netK * 0.03, RIM - nl, hoop.z + Math.sin(a + 0.4) * 0.13); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(B.x, B.y); g.stroke(); }
        ring(true); // nửa trước (gần)
        if (!behind && ball.st !== 'hold') drawBall(g);
        // người ném (nhìn từ sau) + bóng trên tay
        const F = cam.p(me.x, 0, me.z), sw = me.throwT > 0 ? me.throwT / 0.5 : 0;
        backFigure(g, F, F.k, S().look || {}, { t: me.t, moving: me.moving, racket: false, swing: 0.7 + sw * 0.3 });
        if (ball.st === 'hold') drawBall(g);
        // vệt vuốt
        if (lastAim) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(lastAim.x, lastAim.y); g.lineTo(lastAim.cx, lastAim.cy); g.stroke(); }
        // HUD
        const W = game.VW;
        g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, W / 2 - 260, 12, 520, 52, 14); g.fill();
        g.fillStyle = '#fff'; g.font = '900 22px "Be Vietnam Pro", system-ui'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`🏀 ${score}`, W / 2 - 240, 38);
        if (streak >= 3) { g.fillStyle = '#ffa94d'; g.fillText('🔥 x2', W / 2 - 160, 38); }
        g.textAlign = 'right'; g.fillStyle = time < 10 ? '#ff8787' : '#fff'; g.fillText(`⏱ ${Math.ceil(time)}s`, W / 2 + 240, 38);
        g.fillStyle = 'rgba(255,255,255,.2)'; rr(g, W / 2 - 90, 32, 180, 12, 6); g.fill(); g.fillStyle = time < 10 ? '#ff6b6b' : '#69db7c'; rr(g, W / 2 - 90, 32, 180 * Math.min(1, time / 45), 12, 6); g.fill();
        if (ball.st === 'hold' && !ended && shots < 2) hint(g, '👆 Vuốt lên về phía rổ (ở đâu trên màn hình cũng được) · vuốt dài = ném xa', 0.93);
        drawMsgs(g, msgs.map((m) => ({ ...m, x: W / 2, y: game.VH * m.y })));
      },
    };
    function drawBall(g) {
      const q = cam.p(ball.x, ball.y, ball.z), r = Math.max(3, BRd * q.k);
      if (ball.st !== 'hold') { const s = cam.p(ball.x, 0, ball.z); g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(s.x, s.y, r * 0.9, r * 0.3, 0, 0, Math.PI * 2); g.fill(); }
      g.save(); g.translate(q.x, q.y); g.rotate(ball.spin);
      const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); gr.addColorStop(0, '#ffa94d'); gr.addColorStop(1, '#d9480f');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#3d1a00'; g.lineWidth = Math.max(1, r * 0.06);
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.moveTo(-r, 0); g.lineTo(r, 0); g.moveTo(0, -r); g.lineTo(0, r); g.stroke();
      g.beginPath(); g.arc(-r * 1.25, 0, r * 0.85, -0.9, 0.9); g.stroke(); g.beginPath(); g.arc(r * 1.25, 0, r * 0.85, Math.PI - 0.9, Math.PI + 0.9); g.stroke();
      g.restore();
    }
    return game;
  }


  /* ---------- vẽ chung ---------- */
  function scoreBoard(g, sc, server, VW) {
    g.save();
    g.fillStyle = 'rgba(0,0,0,.6)'; rr(g, 10, 10, 210, 44, 12); g.fill();
    g.font = FONT(17); g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = '#8ce99a'; g.fillText(`🧑 Bạn ${sc[0]}`, 22, 32);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(':', 118, 32);
    g.fillStyle = '#ffa8a8'; g.textAlign = 'right'; g.fillText(`${sc[1]} Máy 🤖`, 208, 32);
    g.fillStyle = '#ffe066'; g.beginPath(); g.arc(server === 0 ? 16 : 214, 14, 5, 0, Math.PI * 2); g.fill();
    void VW;
    g.restore();
  }
  function drawMsgs(g, msgs) {
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    msgs.forEach((m, i) => {
      const a = Math.max(0, 1 - m.t / 1.3), up = m.t * 40;
      g.globalAlpha = a; g.font = FONT(26 - Math.min(6, i * 2));
      g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,.65)'; g.strokeText(m.text, m.x, m.y - up); g.fillStyle = m.color; g.fillText(m.text, m.x, m.y - up);
    });
    g.restore();
  }

  /* ======================================================================
   * Khung chơi: menu chọn độ khó → chơi → kết quả + thưởng
   * ==================================================================== */
  const GAMES = {
    badminton: { name: 'Cầu lông', icon: '🏸', vs: true, make: (d) => makeRally('badminton', d), bg: '#16243f',
      how: ['Camera sau lưng bạn như game thật — <b>kéo ngón tay trên sân</b> để chạy tới chỗ đó, vợt tự đỡ khi cầu tới gần', 'Chạm khi cầu bay cao = <b>bật nhảy ĐẬP CẦU</b> 💥', 'Đang chạy lên lưới thì bỏ nhỏ, lùi về sau thì phông cầu cao', 'Bàn phím: ← → ↑ ↓ di chuyển, Space nhảy đập', 'Ai được 7 điểm trước (cách 2 điểm) là thắng'] },
    pingpong: { name: 'Bóng bàn', icon: '🏓', vs: true, make: (d) => makeRally('pingpong', d), bg: '#b9773f',
      how: ['Kéo ngón tay để di chuyển vợt — bóng chạm vợt là tự đánh', 'Bóng phải nảy bên bàn mình 1 lần rồi mới đánh', 'Đỡ ở mép vợt → bóng đi chéo góc (dễ ra ngoài!)', 'Hất vợt nhanh lên trên (hoặc chạm màn hình) lúc chạm bóng = <b>ĐẬP</b> 💥', 'Ai được 7 điểm trước (cách 2 điểm) là thắng'] },
    golf: { name: 'Golf', icon: '⛳', vs: true, make: (d) => makeGolf(d), bg: '#3f8f3a',
      how: ['3 lỗ đấu với máy — ai ít gậy hơn thắng', '<b>Kéo trên sân</b> để chọn chỗ bóng rơi (vòng tròn), gậy tự đổi theo khoảng cách', 'Bấm <b>ĐÁNH</b> rồi chạm lần nữa để dừng thanh lực đúng vùng xanh <b>HOÀN HẢO</b>', 'Để ý 🌬️ gió, hố cát, hồ nước và cây', 'Lên green: kéo chọn chỗ gạt rồi bấm GẠT BÓNG'] },
    basketball: { name: 'Bóng rổ', icon: '🏀', vs: false, make: () => makeBasket(), bg: '#18243d',
      how: ['Nhân vật của bạn cầm bóng — <b>vuốt lên về phía rổ ở bất kỳ đâu trên màn hình</b>', 'Vuốt dài thì ném xa, vuốt lệch thì bóng lệch', '45 giây: vào rổ +1, không chạm vành (ngọt) +2 và +2 giây', 'Vào 3 quả liên tiếp: 🔥 nhân đôi điểm · vào 2 quả thì đổi vị trí ném'] },
    pickleball: { name: 'Pickleball', icon: '🥎', vs: true, make: (d) => makeRally('pickleball', d), bg: '#5c7cfa',
      how: ['<b>Kéo ngón tay trên sân</b> để chạy — bóng tới gần là tự đánh', 'Chạm màn hình lúc đánh = cú drive mạnh', '2 cú đầu (giao + trả giao) phải để bóng nảy', 'Sau đó được đánh vô lê, <b>trừ khi đứng trong vùng bếp (KITCHEN)</b>', 'Đứng sát vùng bếp sẽ đánh bỏ nhỏ (dink) nhẹ nhàng', 'Ai được 7 điểm trước (cách 2 điểm) là thắng'] },
  };
  if (!document.getElementById('sp-css')) {
    const st = document.createElement('style'); st.id = 'sp-css';
    st.textContent = `.sp-stage{flex:1;position:relative;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
.sp-stage canvas{position:absolute;inset:0;display:block;touch-action:none}
.sp-menu{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,20,40,.55);padding:16px}
.sp-menu[hidden]{display:none}
.sp-card{background:#fffaf0;border:3px solid #2b1a10;border-radius:18px;box-shadow:0 6px 0 #2b1a10;max-width:440px;width:100%;padding:18px 18px 14px;color:#2b1a10;max-height:100%;overflow:auto}
.sp-card h2{margin:0 0 6px;font-size:26px;text-align:center}
.sp-card .big{font-size:52px;text-align:center;line-height:1}
.sp-card ul{margin:8px 0;padding-left:20px;font-size:14px;line-height:1.5}
.sp-card .row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:10px}
.sp-card .row .btn{min-width:110px}
.sp-card .diff{display:flex;gap:6px;justify-content:center;margin:10px 0}
.sp-card .diff button{flex:1;border:2px solid #2b1a10;border-radius:10px;padding:8px 4px;font-weight:800;background:#fff;cursor:pointer;font-family:inherit}
.sp-card .diff button.on{background:#ffd43b}
.sp-card .note{font-size:12px;color:#7a5a3a;text-align:center;margin:6px 0 0}
.sp-card .res{font-size:18px;text-align:center;margin:8px 0;font-weight:800}`;
    document.head.appendChild(st);
  }

  function pay(coins, xp) {
    const d = D();
    if (d.day !== today()) { d.day = today(); d.earned = 0; }
    const c = Math.max(0, Math.min(coins, DAY_CAP - (d.earned || 0)));
    d.earned = (d.earned || 0) + c;
    AV.earn(c, xp);
    UI.updateHud();
    return c;
  }

  let open = null;
  function play(id) {
    const G = GAMES[id];
    if (!G) return;
    const v = document.getElementById('arcadeView');
    v.innerHTML = `<div class="arc-bar"><b>${G.icon} ${G.name}</b><span>Khu Thể Thao · mỗi ván tốn ${ENERGY} ⚡</span><button class="tv-x" data-close>✕ Thoát</button></div><div class="sp-stage"><canvas></canvas><div class="sp-menu"></div></div>`;
    v.classList.add('show');
    const stage = v.querySelector('.sp-stage'), cv = v.querySelector('canvas'), g = cv.getContext('2d'), menu = v.querySelector('.sp-menu');
    const me = { id, game: G.make(1), diff: +(D().diff || {})[id] || 1, running: false, raf: 0, last: 0 };
    open = me;
    let k = 1, ox = 0, oy = 0, dpr = 1;
    const fit = () => {
      const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
      if (me.game.wide) { me.game.VH = 720; me.game.VW = Math.round(clamp(720 * r.width / Math.max(1, r.height), 720, 1700)); }
      k = Math.min(r.width / me.game.VW, r.height / me.game.VH); ox = (r.width - me.game.VW * k) / 2; oy = (r.height - me.game.VH * k) / 2;
    };
    const toV = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - ox) / k, y: (e.clientY - r.top - oy) / k }; };
    let down = false;
    cv.addEventListener('pointerdown', (e) => { if (!me.running) return; e.preventDefault(); down = true; try { cv.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ } me.game.down(toV(e)); });
    cv.addEventListener('pointermove', (e) => { if (!me.running) return; if (down || e.pointerType === 'mouse') me.game.move(toV(e)); });
    const up = (e) => { if (!down) return; down = false; if (me.running) me.game.up(toV(e)); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    const kd = (e) => { if (!me.running) return; if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault(); me.game.key(e.key.length === 1 ? e.key.toLowerCase() : e.key, true); };
    const ku = (e) => { if (me.running) me.game.key(e.key.length === 1 ? e.key.toLowerCase() : e.key, false); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('resize', fit);
    const cleanup = () => { cancelAnimationFrame(me.raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', fit); if (open === me) open = null; };
    v.querySelector('[data-close]').onclick = () => { cleanup(); UI.closeArcade(); };

    function frame(now) {
      if (!cv.isConnected) return cleanup();
      const dt = Math.min(0.05, (now - (me.last || now)) / 1000); me.last = now;
      if (me.running) {
        me.game.update(dt);
        if (me.game.over) { me.running = false; finish(me.game.res); }
      }
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = G.bg; g.fillRect(0, 0, cv.width, cv.height);
      g.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
      cv.__vw = me.game.VW; cv.__vh = me.game.VH;
      g.save(); g.beginPath(); g.rect(0, 0, me.game.VW, me.game.VH); g.clip(); me.game.draw(g); g.restore();
      me.raf = requestAnimationFrame(frame);
    }
    function showMenu() {
      const d = D(), best = d.best[id], wins = d.wins[id] || 0, cap = d.day === today() ? DAY_CAP - (d.earned || 0) : DAY_CAP;
      const rec = id === 'golf' ? (best ? `🏅 Kỷ lục: <b>${best} gậy</b> / 3 lỗ` : 'Chưa có kỷ lục') : id === 'basketball' ? (best ? `🏅 Kỷ lục: <b>${best} điểm</b>` : 'Chưa có kỷ lục') : `🏆 Đã thắng máy <b>${wins}</b> ván`;
      menu.hidden = false;
      menu.innerHTML = `<div class="sp-card"><div class="big">${G.icon}</div><h2>${G.name}</h2>
        <ul>${G.how.map((h) => `<li>${h}</li>`).join('')}</ul>
        ${G.vs ? `<div class="diff">${DIFFS.map((n, i) => `<button data-d="${i}" class="${i === me.diff ? 'on' : ''}">${n}<br><small>thắng +${WIN_XU[i]} xu</small></button>`).join('')}</div>` : ''}
        <p class="note">${rec} · Hôm nay còn nhận được tối đa <b>${fmt(Math.max(0, cap))}</b> xu từ thể thao</p>
        <div class="row"><button class="btn" data-go>▶ Vào sân (−${ENERGY} ⚡)</button></div></div>`;
      menu.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { me.diff = +b.dataset.d; D().diff = { ...(D().diff || {}), [id]: me.diff }; showMenu(); });
      menu.querySelector('[data-go]').onclick = start;
    }
    function start() {
      if (!AV.useEnergy(ENERGY)) { UI.toast('😫 Mệt quá rồi — ăn gì đó để hồi ⚡ năng lượng rồi chơi tiếp nhé'); return; }
      me.game = G.make(me.diff); fit(); menu.hidden = true; me.running = true; me.last = 0;
      const d = D(); d.plays[id] = (d.plays[id] || 0) + 1; AV.markChanged();
    }
    function finish(res) {
      const d = D();
      let coins = 0, xp = 0, title = '', line = '';
      if (id === 'golf') {
        const diff = res.strokes - res.par;
        coins = res.win ? WIN_XU[me.diff] + 20 : res.draw ? Math.round(WIN_XU[me.diff] / 2) : 10; xp = res.win ? WIN_XP[me.diff] + 5 : 6;
        title = res.win ? '🏆 CHIẾN THẮNG!' : res.draw ? '🤝 Hoà!' : '⛳ Thua sát nút';
        line = `Bạn <b>${res.strokes} gậy</b> (par ${res.par}, ${diff > 0 ? '+' + diff : diff === 0 ? 'đúng par' : diff}) · Máy ${res.ai} gậy · ${res.cards.join(' · ')}`;
        if (!d.best.golf || res.strokes < d.best.golf) { d.best.golf = res.strokes; line += '<br>🎉 Kỷ lục mới!'; }
        if (res.win) d.wins.golf = (d.wins.golf || 0) + 1;
      } else if (G.vs) {
        coins = res.win ? WIN_XU[me.diff] : res.score[0] * 2; xp = res.win ? WIN_XP[me.diff] : 4;
        title = res.win ? '🏆 CHIẾN THẮNG!' : '😢 Thua mất rồi';
        line = `Tỉ số <b>${res.score[0]} - ${res.score[1]}</b> · ${DIFFS[me.diff]} · loạt đánh dài nhất ${res.bestRally} chạm`;
        if (res.win) { d.wins[id] = (d.wins[id] || 0) + 1; if (me.diff === 2) NET.sendSys && NET.sendSys(`${G.icon} ${S().name} vừa thắng máy mức KHÓ ở sân ${G.name}!`); }
      } else if (id === 'golf') {
        const diff = res.strokes - res.par;
        coins = clamp(20 + (res.par + 8 - res.strokes) * 6, 10, 130); xp = 8 + Math.max(0, -diff) * 3;
        title = diff <= 0 ? '🏆 Xuất sắc!' : '⛳ Hoàn thành 6 lỗ';
        line = `Tổng <b>${res.strokes} gậy</b> (par ${res.par}, ${diff > 0 ? '+' + diff : diff === 0 ? 'đúng par' : diff}) · ${res.cards.join(' · ')}`;
        if (!d.best.golf || res.strokes < d.best.golf) { d.best.golf = res.strokes; line += '<br>🎉 Kỷ lục mới!'; }
        if (diff <= 0) d.wins.golf = (d.wins.golf || 0) + 1;
      } else {
        coins = Math.min(110, res.score * 3); xp = 5 + Math.min(25, res.score);
        title = res.score >= 20 ? '🔥 Thiện xạ!' : res.score >= 10 ? '🏆 Ném hay lắm!' : '🏀 Hết giờ!';
        line = `Được <b>${res.score} điểm</b> · vào ${res.makes}/${res.shots} quả`;
        if (!d.best.basketball || res.score > d.best.basketball) { d.best.basketball = res.score; line += '<br>🎉 Kỷ lục mới!'; }
        if (res.score >= 10) d.wins.basketball = (d.wins.basketball || 0) + 1;
      }
      const got = pay(coins, xp);
      AV.markChanged();
      menu.hidden = false;
      menu.innerHTML = `<div class="sp-card"><div class="big">${G.icon}</div><h2>${title}</h2><p class="res">${line}</p>
        <p class="res">💰 +${fmt(got)} xu · ⭐ +${xp} XP</p>${got < coins ? '<p class="note">Đã đủ giới hạn xu thể thao hôm nay — mai quay lại nhé!</p>' : ''}
        <div class="row"><button class="btn" data-again>🔁 Chơi lại</button><button class="btn ghost" data-menu>📋 Đổi độ khó</button><button class="btn ghost" data-quit>🚪 Ra sân</button></div></div>`;
      menu.querySelector('[data-again]').onclick = start;
      menu.querySelector('[data-menu]').onclick = showMenu;
      menu.querySelector('[data-quit]').onclick = () => { cleanup(); UI.closeArcade(); };
    }
    requestAnimationFrame(() => { fit(); showMenu(); me.raf = requestAnimationFrame(frame); });
  }

  /** bảng thành tích */
  function records() {
    const d = D();
    const p = UI.panel('🏅 Bảng thành tích thể thao', `<div class="shop-list">${Object.entries(GAMES).map(([id, G]) => {
      const rec = id === 'golf' ? (d.best.golf ? `Kỷ lục ${d.best.golf} gậy · ${d.wins.golf || 0} lần dưới par` : 'Chưa chơi') : id === 'basketball' ? (d.best.basketball ? `Kỷ lục ${d.best.basketball} điểm` : 'Chưa chơi') : `Thắng máy ${d.wins[id] || 0} ván`;
      return `<div class="shop-row"><span class="ic">${G.icon}</span><div class="info"><b>${G.name}</b><small>${rec} · đã chơi ${d.plays[id] || 0} ván</small></div><button class="btn small" data-p="${id}">▶ Chơi</button></div>`;
    }).join('')}</div><p class="muted small-note">Mỗi ngày nhận tối đa ${fmt(DAY_CAP)} xu từ thể thao · hôm nay đã nhận ${fmt(d.day === today() ? d.earned || 0 : 0)} xu.</p>`, { wide: true });
    p.body.querySelectorAll('[data-p]').forEach((b) => b.onclick = () => { p.close(); play(b.dataset.p); });
  }

  /* ======================================================================
   * 🗺️ Bản đồ Khu Thể Thao
   * ==================================================================== */
  function buildMap(H) {
    const { base, ground, obj, sobj, aobj, col, inter, npc, paintGrass, paintPaved, paintStreet, addTree, addBush, addBench, addLamp, street } = H;
    const m = base('sport', 'Khu Thể Thao', 3700, 1070);
    // sân: [x, y, w, h]
    const CT = { bad: [130, 470, 560, 300], pp: [800, 450, 520, 340], golf: [1430, 430, 720, 380], bas: [2260, 440, 600, 360], pk: [2970, 460, 560, 320] };
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 123);
      paintPaved(g, 60, 380, m.w - 120, 470, '#e3d8c3');
      paintStreet(g, m.w, 870, 1000);
      // 🏸 cầu lông
      let [x, y, w, h] = CT.bad;
      g.fillStyle = '#2f9e44'; g.fillRect(x - 20, y - 20, w + 40, h + 40); g.fillStyle = '#37b24d'; g.fillRect(x, y, w, h);
      g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(x, y, w, h); g.lineWidth = 3; g.strokeRect(x, y + 24, w, h - 48);
      g.beginPath(); g.moveTo(x + w / 2 - 90, y); g.lineTo(x + w / 2 - 90, y + h); g.moveTo(x + w / 2 + 90, y); g.lineTo(x + w / 2 + 90, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w / 2 - 90, y + h / 2); g.moveTo(x + w / 2 + 90, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
      // 🏓 sàn bóng bàn
      [x, y, w, h] = CT.pp;
      g.fillStyle = '#c0392b'; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.06)'; for (let k = 0; k < w; k += 40) g.fillRect(x + k, y, 20, h);
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(x + 6, y + 6, w - 12, h - 12);
      // ⛳ golf: cỏ green, hố cát, hồ nhỏ
      [x, y, w, h] = CT.golf;
      g.fillStyle = '#5fb84a'; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#7ed36a'; g.beginPath(); g.ellipse(x + w / 2 + 60, y + h / 2 - 20, w / 3, h / 3, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.08)'; for (let k = -6; k < 7; k++) g.fillRect(x + w / 2 + k * 50, y + 10, 25, h - 20);
      g.fillStyle = '#f1d38a'; g.beginPath(); g.ellipse(x + 130, y + h - 90, 90, 45, -0.2, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#4dabf7'; g.beginPath(); g.ellipse(x + w - 110, y + h - 70, 80, 40, 0.2, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#1d3b12'; g.beginPath(); g.arc(x + w / 2 + 120, y + h / 2 - 40, 9, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + 90, y + 120, 50, 26);
      // 🏀 bóng rổ
      [x, y, w, h] = CT.bas;
      g.fillStyle = '#1c7ed6'; g.fillRect(x - 16, y - 16, w + 32, h + 32); g.fillStyle = '#e8590c'; g.fillRect(x, y, w, h);
      g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(x, y, w, h);
      g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.stroke(); g.beginPath(); g.arc(x + w / 2, y + h / 2, 55, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(28,126,214,.55)'; g.fillRect(x, y + h / 2 - 60, 110, 120); g.fillRect(x + w - 110, y + h / 2 - 60, 110, 120);
      g.beginPath(); g.arc(x, y + h / 2, 170, -Math.PI / 2, Math.PI / 2); g.stroke(); g.beginPath(); g.arc(x + w, y + h / 2, 170, Math.PI / 2, Math.PI * 1.5); g.stroke();
      // 🥎 pickleball
      [x, y, w, h] = CT.pk;
      g.fillStyle = '#2b8a3e'; g.fillRect(x - 24, y - 24, w + 48, h + 48); g.fillStyle = '#1971c2'; g.fillRect(x, y, w, h);
      g.fillStyle = '#4dabf7'; g.fillRect(x + w / 2 - 80, y, 160, h);
      g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(x, y, w, h);
      g.beginPath(); g.moveTo(x + w / 2 - 80, y); g.lineTo(x + w / 2 - 80, y + h); g.moveTo(x + w / 2 + 80, y); g.lineTo(x + w / 2 + 80, y + h);
      g.moveTo(x, y + h / 2); g.lineTo(x + w / 2 - 80, y + h / 2); g.moveTo(x + w / 2 + 80, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.font = '900 22px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.save(); g.translate(x + w / 2 - 40, y + h / 2); g.rotate(-Math.PI / 2); g.fillText('KITCHEN', 0, 0); g.restore(); g.save(); g.translate(x + w / 2 + 40, y + h / 2); g.rotate(Math.PI / 2); g.fillText('KITCHEN', 0, 0); g.restore();
    });
    const lab = (t, x, y) => m.labels.push({ text: t, x, y });
    const signPost = (x, y, title, sub, col1) => sobj(m, x, y, (c) => {
      c.fillStyle = '#5c3a1e'; c.fillRect(x - 4, y - 90, 8, 90);
      c.fillStyle = col1; c.beginPath(); c.roundRect(x - 92, y - 150, 184, 64, 12); c.fill(); c.strokeStyle = '#2b1a10'; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 17px "Be Vietnam Pro", system-ui'; c.fillText(title, x, y - 128);
      c.font = '800 11px "Be Vietnam Pro", system-ui'; c.fillText(sub, x, y - 104);
    }, { l: -100, t: -158, w: 200, h: 162 });
    const court = (id, area, x, y) => inter(m, { x: area[0], y: area[1], w: area[2], h: area[3], ax: x, ay: y, name: `${GAMES[id].icon} Sân ${GAMES[id].name} (bấm để chơi)`, use: () => play(id), arrow: { x: area[0] + area[2] / 2, y: area[1] - 30, text: `${GAMES[id].icon} ${GAMES[id].name}` } });

    /* cổng chào */
    sobj(m, 1880, 420, (c) => {
      c.fillStyle = '#1864ab'; c.fillRect(1730, 260, 18, 160); c.fillRect(2012, 260, 18, 160);
      c.fillStyle = '#1c7ed6'; c.beginPath(); c.roundRect(1700, 210, 360, 70, 16); c.fill(); c.strokeStyle = '#0b3d78'; c.lineWidth = 5; c.stroke();
      c.fillStyle = '#fff'; c.font = '900 30px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏟️ KHU THỂ THAO', 1880, 238);
      c.font = '800 14px "Be Vietnam Pro", system-ui'; c.fillText('🏸 🏓 ⛳ 🏀 🥎', 1880, 264);
    }, { l: -190, t: -220, w: 380, h: 225 });

    /* 🏸 cầu lông: lưới giữa sân */
    let [x, y, w, h] = CT.bad;
    lab('🏸 Sân Cầu Lông', x + w / 2, 440);
    sobj(m, x + w / 2, y + h + 6, (c) => {
      const nx = x + w / 2;
      c.fillStyle = '#495057'; c.fillRect(nx - 4, y - 70, 8, 72); c.fillRect(nx - 4, y + h - 70, 8, 76);
      c.fillStyle = 'rgba(30,30,30,.45)'; c.beginPath(); c.moveTo(nx - 3, y - 66); c.lineTo(nx + 3, y - 66); c.lineTo(nx + 3, y + h - 30); c.lineTo(nx - 3, y + h - 30); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1; for (let k = y - 60; k < y + h - 30; k += 10) { c.beginPath(); c.moveTo(nx - 3, k); c.lineTo(nx + 3, k + 4); c.stroke(); }
      c.fillStyle = '#fff'; c.fillRect(nx - 4, y - 70, 8, 5);
    }, { l: -20, t: -h - 90, w: 40, h: h + 100 });
    court('badminton', CT.bad, x + w / 2 - 120, y + h + 30);
    signPost(x + 70, y - 2, 'CẦU LÔNG', 'Đấu với máy · 7 điểm', '#2f9e44');

    /* 🏓 2 bàn bóng bàn */
    [x, y, w, h] = CT.pp;
    lab('🏓 Nhà Bóng Bàn', x + w / 2, 420);
    [[x + 140, y + 200], [x + 380, y + 200]].forEach(([tx, ty]) => {
      sobj(m, tx, ty, (c) => {
        c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(tx, ty + 6, 100, 16, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#343a40'; [[-80, 0], [72, 0], [-60, -40], [52, -40]].forEach(([dx, dy]) => c.fillRect(tx + dx, ty - 60 + dy + 40, 8, 60 - dy * 0.5));
        c.fillStyle = '#0b4f91'; c.beginPath(); c.moveTo(tx - 95, ty - 40); c.lineTo(tx + 95, ty - 40); c.lineTo(tx + 80, ty - 110); c.lineTo(tx - 80, ty - 110); c.closePath(); c.fill();
        c.fillStyle = '#1864ab'; c.beginPath(); c.moveTo(tx - 90, ty - 46); c.lineTo(tx + 90, ty - 46); c.lineTo(tx + 76, ty - 106); c.lineTo(tx - 76, ty - 106); c.closePath(); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); c.beginPath(); c.moveTo(tx, ty - 46); c.lineTo(tx, ty - 106); c.stroke();
        c.fillStyle = '#0b4f91'; c.fillRect(tx - 95, ty - 40, 190, 8);
        c.fillStyle = 'rgba(20,20,20,.7)'; c.fillRect(tx - 2, ty - 116, 4, 72); c.fillStyle = '#fff'; c.fillRect(tx - 3, ty - 118, 6, 3);
        c.fillStyle = '#e03131'; c.beginPath(); c.arc(tx - 50, ty - 76, 8, 0, Math.PI * 2); c.fill(); c.fillStyle = '#212529'; c.beginPath(); c.arc(tx + 55, ty - 88, 8, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(tx + 20, ty - 95, 4, 0, Math.PI * 2); c.fill();
      }, { l: -110, t: -130, w: 220, h: 145 });
      col(m, tx - 95, ty - 40, 190, 40);
    });
    court('pingpong', CT.pp, x + w / 2, y + h + 25);
    signPost(x + w - 60, y + 10, 'BÓNG BÀN', 'Bàn chuẩn quốc tế', '#c92a2a');

    /* ⛳ golf: cờ + xe golf */
    [x, y, w, h] = CT.golf;
    lab('⛳ Sân Golf Mini', x + w / 2, 410);
    const fx = x + w / 2 + 120, fy = y + h / 2 - 40;
    aobj(m, fx, fy, (c, t) => { c.fillStyle = '#f8f9fa'; c.fillRect(fx - 2, fy - 140, 4, 140); c.fillStyle = '#ff6b6b'; c.beginPath(); c.moveTo(fx + 2, fy - 140); c.quadraticCurveTo(fx + 30, fy - 130 + Math.sin(t * 4) * 5, fx + 58, fy - 124); c.lineTo(fx + 2, fy - 104); c.closePath(); c.fill(); }, { l: -10, t: -150, w: 80, h: 154 });
    sobj(m, x + 160, y + 140, (c) => { c.font = '64px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('🏌️', x + 160, y + 140); }, { l: -50, t: -80, w: 100, h: 90 });
    court('golf', CT.golf, x + w / 2 - 60, y + h + 25);
    signPost(x + 40, y + h - 10, 'GOLF MINI', '6 lỗ · kéo để đánh', '#2b8a3e');

    /* 🏀 bóng rổ: 2 cột rổ */
    [x, y, w, h] = CT.bas;
    lab('🏀 Sân Bóng Rổ', x + w / 2, 420);
    [[x + 30, 1], [x + w - 30, -1]].forEach(([hx, d]) => {
      const hy = y + h / 2 + 30;
      sobj(m, hx, hy, (c) => {
        c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(hx - d * 20, hy + 2, 40, 9, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#495057'; c.fillRect(hx - d * 30 - 5, hy - 210, 10, 212); c.fillRect(hx - d * 30, hy - 210, d * 34, 8);
        c.fillStyle = '#f8f9fa'; c.fillRect(hx - 6, hy - 250, 12, 90); c.strokeStyle = '#212529'; c.lineWidth = 2; c.strokeRect(hx - 6, hy - 250, 12, 90);
        c.strokeStyle = '#f76707'; c.lineWidth = 4; c.beginPath(); c.ellipse(hx + d * 22, hy - 185, 22, 6, 0, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(hx + d * 22 + k * 9, hy - 183); c.lineTo(hx + d * 22 + k * 5, hy - 155); c.stroke(); }
      }, { l: -60, t: -262, w: 120, h: 270 });
      col(m, hx - d * 30 - 10, hy - 8, 20, 12);
    });
    court('basketball', CT.bas, x + w / 2, y + h + 25);
    signPost(x + w / 2 + 160, y - 2, 'BÓNG RỔ', 'Ném 45 giây', '#e8590c');

    /* 🥎 pickleball: lưới */
    [x, y, w, h] = CT.pk;
    lab('🥎 Sân Pickleball', x + w / 2, 420);
    sobj(m, x + w / 2, y + h + 10, (c) => {
      const nx = x + w / 2;
      c.fillStyle = '#343a40'; c.fillRect(nx - 4, y - 50, 8, 52); c.fillRect(nx - 4, y + h - 46, 8, 56);
      c.fillStyle = 'rgba(20,20,20,.55)'; c.fillRect(nx - 3, y - 46, 6, h);
      c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 1; for (let k = y - 40; k < y + h - 46; k += 9) { c.beginPath(); c.moveTo(nx - 3, k); c.lineTo(nx + 3, k + 4); c.stroke(); }
      c.fillStyle = '#fff'; c.fillRect(nx - 4, y - 50, 8, 5);
    }, { l: -20, t: -h - 70, w: 40, h: h + 80 });
    court('pickleball', CT.pk, x + w / 2 - 120, y + h + 30);
    signPost(x + w - 50, y - 6, 'PICKLEBALL', 'Môn hot nhất 2025', '#7048e8');

    /* bảng thành tích + quầy nước */
    sobj(m, 2180, 860, (c) => {
      c.fillStyle = '#5c3a1e'; c.fillRect(2130, 780, 8, 80); c.fillRect(2222, 780, 8, 80);
      c.fillStyle = '#fab005'; c.beginPath(); c.roundRect(2108, 700, 144, 96, 12); c.fill(); c.strokeStyle = '#7a4a00'; c.lineWidth = 4; c.stroke();
      c.fillStyle = '#fff8e1'; c.beginPath(); c.roundRect(2116, 708, 128, 80, 8); c.fill();
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '28px system-ui, "Segoe UI Emoji"'; c.fillText('🏅', 2180, 734);
      c.fillStyle = '#7a4a00'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.fillText('THÀNH TÍCH', 2180, 762);
      c.font = '800 10px "Be Vietnam Pro", system-ui'; c.fillText('Kỷ lục của bạn', 2180, 778);
    }, { l: -80, t: -168, w: 160, h: 172 });
    col(m, 2125, 850, 110, 10);
    inter(m, { x: 2108, y: 700, w: 144, h: 160, ax: 2180, ay: 890, name: 'Bảng thành tích thể thao', use: records, arrow: { x: 2180, y: 690, text: 'Thành tích' } });

    [[60, 470, 'green'], [760, 820, 'pink'], [1370, 820, 'green'], [2930, 420, 'fruit'], [3620, 470, 'green'], [3620, 800, 'pink']].forEach(([tx, ty, v]) => addTree(m, tx, ty, v));
    [[740, 450], [1390, 440], [2920, 820]].forEach(([bx, by], i) => addBush(m, bx, by, ['#ff8fab', '#ffd43b', '#da77f2'][i]));
    addBench(m, 420, 830); addBench(m, 1060, 830); addBench(m, 2560, 830); addBench(m, 3250, 830);
    [[760, 600], [1380, 600], [2900, 640]].forEach(([lx, ly]) => addLamp(m, lx, ly));

    npc(m, 'HLV Tuấn', { skin: '#e3a979', hair: 'short', hairColor: '#212529', shirt: '#1c7ed6', shirtStyle: 'plain', pants: '#212529', hat: 'cap' }, { l: 200, t: 790, r: 1300, b: 840 }, 600, 820);
    npc(m, 'Chị Mai', { skin: '#ffe0c4', hair: 'long', hairColor: '#6b3e26', shirt: '#f06595', shirtStyle: 'plain', pants: '#343a40', hat: 'bow' }, { l: 2300, t: 790, r: 3500, b: 840 }, 2800, 820);
    street(m, 1880);
    m.spawn = { x: 1930, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  return { play, buildMap, records, GAMES, _game: () => open && open.game };
})();
