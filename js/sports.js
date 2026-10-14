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

  /* ======================================================================
   * 🏓 / 🥎 BÓNG BÀN & PICKLEBALL — nhìn từ trên xuống, bóng có độ cao (nảy)
   * ==================================================================== */
  function makeRally(kind, diff) {
    const PP = kind === 'pingpong';
    const VW = 600, VH = 900, NY = 450, MID = 300;
    const C = PP ? { L: 120, R: 480, T: 150, B: 750 } : { L: 90, R: 510, T: 70, B: 830 };
    const KIT = PP ? 0 : 110, NETH = PP ? 15 : 22, GR = PP ? 1700 : 1250, BR = PP ? 7 : 9, PR = PP ? 38 : 44, REACH = PP ? 85 : 100;
    const me = { x: MID, y: PP ? 820 : 870, tx: MID, ty: PP ? 820 : 870, vx: 0, vy: 0, swing: 0 };
    const ai = { x: MID, y: PP ? 80 : 30, tx: MID, ty: PP ? 80 : 30, swing: 0, react: 0, err: 0 };
    const b = { x: MID, y: 0, z: 30, vx: 0, vy: 0, vz: 0, hitter: -1, bounces: 0, hits: 0, live: false, trail: [] };
    const sc = [0, 0];
    let server = 0, servesLeft = 2, phase = 'serve', wait = 0.8, t = 0, rally = 0, bestRally = 0;
    const msgs = [];
    const say = (text, color = '#fff', x = MID, y = NY) => msgs.push({ text, color, x, y, t: 0 });
    const paddle = (w) => (w === 0 ? me : ai);
    const inKitchen = (p, w) => KIT && (w === 0 ? p.y < NY + KIT : p.y > NY - KIT);

    function shoot(w, tx, ty, T) {
      b.vx = (tx - b.x) / T; b.vy = (ty - b.y) / T; b.vz = (-b.z + 0.5 * GR * T * T) / T;
      b.hitter = w; b.bounces = 0; b.hits++; b.live = true; paddle(w).swing = 0.22;
      rally++;
    }
    function serve(w) {
      phase = 'play';
      const P = paddle(w);
      b.x = P.x; b.y = P.y + (w === 0 ? -16 : 16); b.z = 26; b.hits = 0;
      const far = w === 0 ? [C.T + 50, NY - (PP ? 90 : KIT + 50)] : [NY + (PP ? 90 : KIT + 50), C.B - 50];
      const off = clamp((P.x - MID) / 200, -1, 1);
      shoot(w, clamp(MID - off * 110 + rnd(-60, 60), C.L + 35, C.R - 35), rnd(far[0], far[1]), PP ? 0.9 : 1.15);
      if (w === 0) aiPlan();
    }
    function point(w, text) {
      if (phase !== 'play') return;
      sc[w]++; phase = 'dead'; b.live = false; wait = 1.2;
      bestRally = Math.max(bestRally, rally); rally = 0;
      say(text, w === 0 ? '#8ce99a' : '#ffa8a8');
      say(w === 0 ? '+1 cho bạn' : '+1 cho máy', '#ffe066', MID, NY + 46);
    }
    function nextServe(lastWinner) {
      if (PP) { if (--servesLeft <= 0) { server = 1 - server; servesLeft = 2; } } else server = lastWinner;
      phase = 'serve'; wait = 0.9; b.hitter = -1; b.trail = [];
    }
    function aiPlan() { ai.react = [0.28, 0.16, 0.07][diff]; ai.err = rnd(-1, 1) * [55, 28, 10][diff]; }
    function myHit() {
      const off = clamp((b.x - me.x) / PR, -1.25, 1.25);
      const smash = me.vy < -650 || (b.z > 45 && me.vy < -300);
      const dink = !PP && !smash && me.y < NY + KIT + 60;
      let tx = MID + off * (C.R - C.L) * 0.55 + me.vx * 0.07;
      let ty, T;
      if (smash) { ty = rnd(C.T + 20, C.T + 130); T = PP ? 0.42 : 0.58; say('💥 Đập!', '#ffd43b', b.x, b.y - 40); }
      else if (dink) { ty = rnd(NY - KIT + 12, NY - 30); T = 0.95; tx = lerp(tx, MID, 0.3); }
      else { ty = rnd(C.T + 50, NY - (PP ? 80 : KIT + 25)); T = PP ? 0.72 : 0.95; }
      shoot(0, tx, ty, T);
      aiPlan();
    }
    function aiHit() {
      const err = Math.random() < [0.2, 0.11, 0.05][diff];
      let tx, ty, T = PP ? [0.92, 0.76, 0.6][diff] : [1.2, 1.0, 0.82][diff];
      if (err) {
        if (Math.random() < 0.6) { tx = Math.random() < 0.5 ? C.L - rnd(12, 55) : C.R + rnd(12, 55); ty = rnd(NY + 80, C.B - 40); }
        else { tx = rnd(C.L + 40, C.R - 40); ty = C.B + rnd(15, 60); }
      } else {
        const away = Math.random() < 0.35 + 0.2 * diff;
        tx = away ? (me.x < MID ? rnd(MID + 30, C.R - 30) : rnd(C.L + 30, MID - 30)) : rnd(C.L + 35, C.R - 35);
        const minY = NY + (PP ? 70 : (b.hits < 2 ? KIT + 30 : 40));
        ty = rnd(minY, C.B - 30);
        if (diff === 2 && b.z > 40 && Math.random() < 0.5) T *= 0.7;
        if (!PP && b.hits >= 2 && inKitchen(ai, 1) === false && ai.y > NY - KIT - 60 && Math.random() < 0.4) { ty = rnd(NY + 15, NY + KIT - 15); T = 1.0; }
      }
      shoot(1, tx, ty, T);
    }
    function step(dt) {
      // người chơi bám theo ngón tay
      const ox = me.x, oy = me.y, mx = 2600 * dt;
      me.x += clamp(me.tx - me.x, -mx, mx); me.y += clamp(me.ty - me.y, -mx, mx);
      me.vx = lerp(me.vx, (me.x - ox) / dt, 0.4); me.vy = lerp(me.vy, (me.y - oy) / dt, 0.4);
      // máy đoán chỗ bóng tới
      const aiSp = [300, 430, 580][diff] * dt;
      if (b.live && b.hitter === 0 && b.vy < 0) {
        if (ai.react > 0) ai.react -= dt;
        else { const tt = (ai.y - b.y) / b.vy; ai.tx = clamp(b.x + b.vx * tt + ai.err, 20, VW - 20); }
      } else if (phase !== 'serve' || server !== 1) ai.tx = lerp(ai.tx, MID, 0.02);
      if (!PP) ai.ty = b.hits >= 2 && b.hitter === 0 ? NY - KIT - 40 : 34;
      ai.x += clamp(ai.tx - ai.x, -aiSp, aiSp); ai.y += clamp(ai.ty - ai.y, -aiSp, aiSp);
      me.swing = Math.max(0, me.swing - dt); ai.swing = Math.max(0, ai.swing - dt);

      if (phase === 'serve') {
        const P = paddle(server);
        b.x = P.x + (server === 0 ? 0 : 0); b.y = P.y + (server === 0 ? -18 : 18); b.z = 26 + Math.abs(Math.sin(t * 4)) * 26;
        if (server === 1 && (wait -= dt) <= 0) serve(1);
        return;
      }
      if (phase === 'dead') {
        if ((wait -= dt) <= 0) {
          const w = sc[0] > sc[1] ? 0 : 1;
          if ((sc[w] >= 7 && sc[w] - sc[1 - w] >= 2) || sc[w] >= 11) { game.over = true; game.res = { win: w === 0, score: sc.slice(), bestRally }; return; }
          nextServe(lastW);
        }
        // bóng chết vẫn lăn tiếp cho đẹp
        b.x += b.vx * dt * 0.5; b.y += b.vy * dt * 0.5; b.vz -= GR * dt; b.z = Math.max(0, b.z + b.vz * dt); if (b.z === 0) b.vz = Math.abs(b.vz) * 0.4;
        return;
      }
      const py = b.y;
      b.x += b.vx * dt; b.y += b.vy * dt; b.vz -= GR * dt; b.z += b.vz * dt;
      if ((py - NY) * (b.y - NY) <= 0 && b.z < NETH && b.x > C.L - 25 && b.x < C.R + 25) { b.vy *= -0.15; b.vx *= 0.3; lastW = 1 - b.hitter; return point(1 - b.hitter, '🥅 Chạm lưới!'); }
      if (b.z <= 0 && b.vz < 0) {
        const inC = b.x >= C.L && b.x <= C.R && b.y >= C.T && b.y <= C.B, side = b.y > NY ? 0 : 1;
        if (b.bounces === 0) {
          if (!inC) { lastW = 1 - b.hitter; return point(1 - b.hitter, '🚫 Bóng ra ngoài!'); }
          if (side === b.hitter) { lastW = 1 - b.hitter; return point(1 - b.hitter, '❌ Lỗi!'); }
        }
        b.bounces++;
        b.z = 0; b.vz = -b.vz * (PP ? 0.78 : 0.6); b.vx *= 0.98; b.vy *= 0.98;
        if (b.bounces >= 2) { lastW = b.hitter; return point(b.hitter, b.hitter === 0 ? '✨ Ăn điểm!' : '😵 Không đỡ kịp!'); }
      }
      if (b.y < -40 || b.y > VH + 40 || b.x < -40 || b.x > VW + 40) { lastW = b.bounces ? b.hitter : 1 - b.hitter; return point(lastW, b.bounces ? (b.hitter === 0 ? '✨ Ăn điểm!' : '😵 Không đỡ kịp!') : '🚫 Bóng ra ngoài!'); }
      // chạm vợt (tự đánh khi bóng chạm vợt)
      const r = 1 - b.hitter, P = paddle(r);
      const onSide = r === 0 ? b.y > NY : b.y < NY;
      const volleyOk = PP ? false : b.hits >= 2 && !inKitchen(P, r);
      if (onSide && (b.bounces >= 1 || volleyOk) && b.z < REACH && Math.hypot(b.x - P.x, b.y - P.y) < PR + BR + 8) { if (r === 0) myHit(); else aiHit(); }
    }
    let lastW = 0;
    const game = {
      VW, VH, over: false, res: null,
      update(dt) {
        t += dt;
        for (let k = 0; k < 2; k++) { step(dt / 2); if (game.over) break; }
        if (b.live) { b.trail.push([b.x, b.y - b.z * 0.9]); if (b.trail.length > 8) b.trail.shift(); }
        msgs.forEach((m) => { m.t += dt; }); while (msgs.length && msgs[0].t > 1.3) msgs.shift();
      },
      down(p) { game.move(p); if (phase === 'serve' && server === 0) serve(0); },
      move(p) { me.tx = clamp(p.x, 20, VW - 20); me.ty = clamp(p.y - 30, NY + (PP ? 60 : 25), VH - 15); },
      up() {},
      key(k, on) {
        if (!on) return;
        const d = 60;
        if (k === 'ArrowLeft' || k === 'a') me.tx = clamp(me.tx - d, 20, VW - 20);
        if (k === 'ArrowRight' || k === 'd') me.tx = clamp(me.tx + d, 20, VW - 20);
        if (k === 'ArrowUp' || k === 'w') me.ty = clamp(me.ty - d, NY + (PP ? 60 : 25), VH - 15);
        if (k === 'ArrowDown' || k === 's') me.ty = clamp(me.ty + d, NY + (PP ? 60 : 25), VH - 15);
        if ((k === ' ' || k === 'Enter') && phase === 'serve' && server === 0) serve(0);
      },
      draw(g) {
        if (PP) drawTable(g); else drawCourt(g);
        // bóng: bóng đổ + đuôi + quả bóng
        const by = b.y - b.z * 0.9, br = BR * (1 + b.z / 260);
        g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(b.x, b.y, BR * 1.1, BR * 0.6, 0, 0, Math.PI * 2); g.fill();
        if (b.live && b.trail.length > 1) { g.strokeStyle = PP ? 'rgba(255,255,255,.35)' : 'rgba(255,240,120,.4)'; g.lineWidth = br; g.lineCap = 'round'; g.beginPath(); b.trail.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); }
        drawPaddle(g, ai, true);
        g.fillStyle = PP ? '#fff7e6' : '#ffe066'; g.beginPath(); g.arc(b.x, by, br, 0, Math.PI * 2); g.fill();
        g.strokeStyle = PP ? '#e8a33c' : '#c9a227'; g.lineWidth = 1.5; g.stroke();
        if (!PP) { g.fillStyle = '#b08f1a'; [[-0.4, -0.3], [0.35, -0.2], [0, 0.4], [-0.3, 0.35]].forEach(([dx, dy]) => { g.beginPath(); g.arc(b.x + dx * br, by + dy * br, br * 0.17, 0, Math.PI * 2); g.fill(); }); }
        else { g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(b.x - br * 0.35, by - br * 0.35, br * 0.35, 0, Math.PI * 2); g.fill(); }
        drawPaddle(g, me, false);
        // vùng bếp: nhắc không được vô lê
        if (!PP && b.live && b.hitter === 1 && b.bounces === 0 && inKitchen(me, 0)) { g.fillStyle = 'rgba(255,107,107,.9)'; g.font = FONT(15); g.textAlign = 'center'; g.fillText('🚫 Trong vùng bếp: chờ bóng nảy rồi mới đánh', MID, me.y + 62); }
        scoreBoard(g, sc, server, VW);
        if (phase === 'serve' && server === 0) { g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, MID - 150, VH - 60, 300, 40, 20); g.fill(); g.fillStyle = '#fff'; g.font = FONT(17); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('👆 Chạm để giao bóng', MID, VH - 40); }
        drawMsgs(g, msgs);
      },
    };
    function drawTable(g) {
      const grd = g.createLinearGradient(0, 0, 0, VH); grd.addColorStop(0, '#2c3e66'); grd.addColorStop(1, '#1b2742'); g.fillStyle = grd; g.fillRect(0, 0, VW, VH);
      g.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < VH; y += 60) g.fillRect(0, y, VW, 30);
      g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, C.L + 10, C.T + 14, C.R - C.L, C.B - C.T, 6); g.fill();
      g.fillStyle = '#1864ab'; rr(g, C.L, C.T, C.R - C.L, C.B - C.T, 6); g.fill();
      g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(C.L, C.T, (C.R - C.L) / 2, C.B - C.T);
      g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(C.L + 2.5, C.T + 2.5, C.R - C.L - 5, C.B - C.T - 5);
      g.lineWidth = 2; g.beginPath(); g.moveTo(MID, C.T); g.lineTo(MID, C.B); g.stroke();
      // lưới
      g.fillStyle = '#212529'; g.fillRect(C.L - 26, NY - 5, 10, 10); g.fillRect(C.R + 16, NY - 5, 10, 10);
      g.fillStyle = 'rgba(30,30,30,.75)'; g.fillRect(C.L - 18, NY - 7, C.R - C.L + 36, 12);
      g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 1; for (let x = C.L - 18; x < C.R + 18; x += 6) { g.beginPath(); g.moveTo(x, NY - 7); g.lineTo(x, NY + 5); g.stroke(); }
      g.fillStyle = '#fff'; g.fillRect(C.L - 18, NY - 9, C.R - C.L + 36, 3);
    }
    function drawCourt(g) {
      g.fillStyle = '#2b8a3e'; g.fillRect(0, 0, VW, VH);
      g.fillStyle = '#1971c2'; g.fillRect(C.L, C.T, C.R - C.L, C.B - C.T);
      g.fillStyle = '#4dabf7'; g.fillRect(C.L, NY - KIT, C.R - C.L, KIT * 2);
      g.fillStyle = 'rgba(255,255,255,.12)'; g.font = FONT(26); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('KITCHEN', MID, NY - KIT / 2); g.fillText('KITCHEN', MID, NY + KIT / 2);
      g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(C.L, C.T, C.R - C.L, C.B - C.T);
      g.beginPath(); g.moveTo(C.L, NY - KIT); g.lineTo(C.R, NY - KIT); g.moveTo(C.L, NY + KIT); g.lineTo(C.R, NY + KIT);
      g.moveTo(MID, C.T); g.lineTo(MID, NY - KIT); g.moveTo(MID, NY + KIT); g.lineTo(MID, C.B); g.stroke();
      g.fillStyle = '#343a40'; g.fillRect(C.L - 30, NY - 6, 12, 12); g.fillRect(C.R + 18, NY - 6, 12, 12);
      g.fillStyle = 'rgba(20,20,20,.8)'; g.fillRect(C.L - 20, NY - 8, C.R - C.L + 40, 14);
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1; for (let x = C.L - 20; x < C.R + 20; x += 7) { g.beginPath(); g.moveTo(x, NY - 8); g.lineTo(x, NY + 6); g.stroke(); }
      g.fillStyle = '#fff'; g.fillRect(C.L - 20, NY - 10, C.R - C.L + 40, 4);
    }
    function drawPaddle(g, P, top) {
      const sw = P.swing > 0 ? Math.sin((P.swing / 0.22) * Math.PI) * 0.6 : 0;
      g.save(); g.translate(P.x, P.y); g.rotate((top ? Math.PI : 0) + sw);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(6, 10, PR * 0.85, PR * 0.5, 0, 0, Math.PI * 2); g.fill();
      if (PP) {
        g.fillStyle = '#c08b5c'; rr(g, -7, PR * 0.55, 14, PR * 0.85, 4); g.fill();
        g.fillStyle = top ? '#212529' : '#e03131'; g.beginPath(); g.arc(0, 0, PR * 0.78, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#c08b5c'; g.lineWidth = 3; g.stroke();
        g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(-PR * 0.25, -PR * 0.25, PR * 0.3, 0, Math.PI * 2); g.fill();
      } else {
        g.fillStyle = '#343a40'; rr(g, -7, PR * 0.6, 14, PR * 0.8, 4); g.fill();
        g.fillStyle = top ? '#7048e8' : '#f76707'; rr(g, -PR * 0.62, -PR * 0.85, PR * 1.24, PR * 1.5, PR * 0.4); g.fill();
        g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.stroke();
        g.fillStyle = 'rgba(255,255,255,.2)'; rr(g, -PR * 0.45, -PR * 0.7, PR * 0.4, PR * 1.1, 8); g.fill();
      }
      g.restore();
    }
    return game;
  }

  /* ======================================================================
   * 🏸 CẦU LÔNG — nhìn ngang, cầu bay có lực cản không khí
   * ==================================================================== */
  const AI_LOOK = { skin: '#ffe0c4', hair: 'long', hairColor: '#6b3e26', shirt: '#f06595', shirtStyle: 'plain', pants: '#343a40', hat: 'bow' };
  function makeBadminton(diff) {
    const VW = 1000, VH = 600, FL = 540, NX = 500, NT = 372, CL = 60, CR = 940, G = 1000, K = 0.0017, PG = 2200;
    const me = { x: 240, y: FL, vy: 0, tx: 240, dir: 1, swing: 0, t: 0, moving: false, tap: -9, keyL: false, keyR: false, vx: 0 };
    const ai = { x: 760, y: FL, vy: 0, tx: 760, dir: -1, swing: 0, t: 0, moving: false, react: 0, err: 0, plan: 0 };
    const s = { x: 0, y: 0, vx: 0, vy: 0, live: false, hitter: -1, ang: 0 };
    const sc = [0, 0];
    let server = 0, phase = 'serve', wait = 1, t = 0, lastW = 0, rally = 0, bestRally = 0;
    const msgs = [];
    const say = (text, color = '#fff', x = VW / 2, y = 200) => msgs.push({ text, color, x, y, t: 0 });
    const P = (w) => (w === 0 ? me : ai);
    const reachC = (p) => ({ x: p.x + p.dir * 22, y: p.y - 120 });

    function sim(x, y, vx, vy) {
      const dt = 1 / 90; let clear = null, peak = y, n = 0;
      while (y < FL && n++ < 500) {
        const sp = Math.hypot(vx, vy); vx += -K * sp * vx * dt; vy += (G - K * sp * vy) * dt;
        const px = x; x += vx * dt; y += vy * dt; peak = Math.min(peak, y);
        if (clear === null && (px - NX) * (x - NX) <= 0) clear = y < NT - 12;
      }
      return { land: x, clear: !!clear, peak };
    }
    const KINDS = {
      clear: { a: [50, 76], v: [900, 1500] }, drop: { a: [18, 58], v: [380, 820] },
      drive: { a: [4, 26], v: [850, 1400] }, smash: { a: [-38, -8], v: [1350, 1900] }, serve: { a: [42, 72], v: [700, 1250] },
    };
    function plan(p, kind, target) {
      const k = KINDS[kind], sgn = p.dir, x0 = p.x + p.dir * 30, y0 = p.y - 135;
      let best = null;
      for (let i = 0; i <= 10; i++) for (let j = 0; j <= 9; j++) {
        const a = (k.a[0] + (k.a[1] - k.a[0]) * i / 10) * Math.PI / 180, v = k.v[0] + (k.v[1] - k.v[0]) * j / 9;
        const vx = sgn * Math.cos(a) * v, vy = -Math.sin(a) * v, r = sim(x0, y0, vx, vy);
        if (!r.clear) continue;
        const e = Math.abs(r.land - target);
        if (!best || e < best.e) best = { e, vx, vy };
      }
      if (!best && kind !== 'clear') return plan(p, 'clear', target);
      return best || { vx: sgn * 600, vy: -900 };
    }
    function hit(w, kind, target) {
      const p = P(w), pl = plan(p, kind, target);
      s.x = p.x + p.dir * 30; s.y = p.y - 135; s.vx = pl.vx; s.vy = pl.vy; s.hitter = w; s.live = true; p.swing = 0.28;
      rally++;
      if (kind === 'smash') say('💥 ĐẬP CẦU!', '#ffd43b', s.x, s.y - 40);
      if (w === 0) { ai.react = [0.3, 0.17, 0.07][diff]; ai.err = rnd(-1, 1) * [70, 35, 12][diff]; ai.plan = 0; }
    }
    function serve(w) {
      phase = 'play';
      const p = P(w); s.x = p.x + p.dir * 30; s.y = p.y - 95;
      hit(w, 'serve', w === 0 ? rnd(760, 900) : rnd(100, 240));
    }
    function point(w, text) {
      if (phase !== 'play') return;
      sc[w]++; phase = 'dead'; wait = 1.3; s.live = false; lastW = w;
      bestRally = Math.max(bestRally, rally); rally = 0;
      say(text, w === 0 ? '#8ce99a' : '#ffa8a8'); say(w === 0 ? '+1 cho bạn' : '+1 cho máy', '#ffe066', VW / 2, 245);
    }
    function myShot() {
      const smash = t - me.tap < 0.4 && s.y < FL - 175;
      if (smash) return hit(0, 'smash', rnd(640, 880));
      if (me.vx > 120) return hit(0, 'drop', rnd(560, 660));
      if (me.vx < -120) return hit(0, 'clear', rnd(820, 910));
      const r = Math.random();
      hit(0, r < 0.5 ? 'clear' : r < 0.8 ? 'drive' : 'drop', r < 0.5 ? rnd(800, 905) : r < 0.8 ? rnd(680, 860) : rnd(560, 650));
    }
    function aiShot() {
      if (Math.random() < [0.2, 0.12, 0.06][diff]) return hit(1, Math.random() < 0.5 ? 'clear' : 'drive', CL - rnd(25, 90));
      if (diff >= 1 && s.y < FL - 200 && Math.random() < 0.3 + diff * 0.15) return hit(1, 'smash', me.x < 260 ? rnd(300, 450) : rnd(90, 200));
      const r = Math.random(), far = me.x > 260;
      if (r < 0.45) hit(1, 'clear', rnd(85, 180));
      else if (r < 0.75) hit(1, 'drop', rnd(350, 440));
      else hit(1, 'drive', far ? rnd(100, 220) : rnd(300, 450));
    }
    function movePlayer(p, dt, sp) {
      const ox = p.x;
      p.x += clamp(p.tx - p.x, -sp * dt, sp * dt);
      p.vx = lerp(p.vx || 0, (p.x - ox) / dt, 0.3);
      p.moving = Math.abs(p.x - ox) > 0.5; if (p.moving) p.t += dt;
      if (p.y < FL || p.vy < 0) { p.vy += PG * dt; p.y += p.vy * dt; if (p.y >= FL) { p.y = FL; p.vy = 0; } }
      p.swing = Math.max(0, p.swing - dt);
    }
    function step(dt) {
      t += dt;
      if (me.keyL) me.tx = clamp(me.x - 80, 40, NX - 30); if (me.keyR) me.tx = clamp(me.x + 80, 40, NX - 30);
      movePlayer(me, dt, 560);
      // máy: đoán điểm rơi rồi chạy tới
      if (s.live && s.hitter === 0) {
        if (ai.react > 0) ai.react -= dt;
        else if ((ai.plan -= dt) <= 0) {
          ai.plan = 0.12;
          let x = s.x, y = s.y, vx = s.vx, vy = s.vy, n = 0, tx = null;
          const dtt = 1 / 60;
          while (n++ < 300 && y < FL) { const sp = Math.hypot(vx, vy); vx += -K * sp * vx * dtt; vy += (G - K * sp * vy) * dtt; x += vx * dtt; y += vy * dtt; if (x > NX && vy > 0 && y > FL - 150) { tx = x; break; } }
          if (tx !== null) ai.tx = clamp(tx + 22 + ai.err, NX + 30, VW - 30);
          if (diff >= 1 && s.vy > 0 && s.x > NX && s.y < FL - 260 && Math.abs(s.x - ai.x) < 80 && ai.y >= FL && Math.random() < 0.05) ai.vy = -650;
        }
      } else if (phase === 'play' && s.hitter === 1) ai.tx = lerp(ai.tx, 760, 0.03);
      movePlayer(ai, dt, [380, 490, 620][diff]);

      if (phase === 'serve') {
        const p = P(server); s.x = p.x + p.dir * 30; s.y = p.y - 95; s.ang = Math.PI / 2;
        if (server === 1 && (wait -= dt) <= 0) serve(1);
        return;
      }
      if (phase === 'dead') {
        if (s.y < FL) { const sp = Math.hypot(s.vx, s.vy); s.vx += -K * sp * s.vx * dt; s.vy += (G - K * sp * s.vy) * dt; s.x += s.vx * dt; s.y = Math.min(FL, s.y + s.vy * dt); }
        if ((wait -= dt) <= 0) {
          const w = sc[0] > sc[1] ? 0 : 1;
          if ((sc[w] >= 7 && sc[w] - sc[1 - w] >= 2) || sc[w] >= 11) { game.over = true; game.res = { win: w === 0, score: sc.slice(), bestRally }; return; }
          server = lastW; phase = 'serve'; wait = 1; me.tx = 240; ai.tx = 760;
        }
        return;
      }
      const sp = Math.hypot(s.vx, s.vy);
      s.vx += -K * sp * s.vx * dt; s.vy += (G - K * sp * s.vy) * dt;
      const px = s.x; s.x += s.vx * dt; s.y += s.vy * dt;
      s.ang = Math.atan2(s.vy, s.vx);
      if ((px - NX) * (s.x - NX) <= 0 && s.y > NT) { s.x = px; s.vx = -s.vx * 0.12; s.vy = Math.max(0, s.vy) * 0.4; }
      if (s.y >= FL) {
        s.y = FL;
        const inC = s.x >= CL && s.x <= CR, side = s.x < NX ? 0 : 1;
        if (inC) point(1 - side, side === 0 ? '😵 Cầu rơi sân bạn' : '✨ Cầu rơi sân đối thủ!');
        else point(1 - s.hitter, '🚫 Cầu ra ngoài!');
        return;
      }
      for (const w of [0, 1]) {
        if (s.hitter === w) continue;
        const p = P(w), onSide = w === 0 ? s.x < NX : s.x > NX, rc = reachC(p);
        if (onSide && Math.hypot(s.x - rc.x, s.y - rc.y) < 92) { if (w === 0) myShot(); else aiShot(); break; }
      }
    }
    const game = {
      VW, VH, over: false, res: null,
      update(dt) { for (let k = 0; k < 2; k++) { step(dt / 2); if (game.over) break; } msgs.forEach((m) => { m.t += dt; }); while (msgs.length && msgs[0].t > 1.3) msgs.shift(); },
      down(p) {
        me.tx = clamp(p.x, 40, NX - 30); me.tap = t;
        if (phase === 'serve' && server === 0) { serve(0); return; }
        if (me.y >= FL) me.vy = -640;
      },
      move(p) { me.tx = clamp(p.x, 40, NX - 30); },
      up() {},
      key(k, on) {
        if (k === 'ArrowLeft' || k === 'a') me.keyL = on;
        if (k === 'ArrowRight' || k === 'd') me.keyR = on;
        if (!on) { if (k === 'ArrowLeft' || k === 'a' || k === 'ArrowRight' || k === 'd') me.tx = me.x; return; }
        if (k === ' ' || k === 'ArrowUp' || k === 'w') { me.tap = t; if (phase === 'serve' && server === 0) serve(0); else if (me.y >= FL) me.vy = -640; }
      },
      draw(g) {
        // nhà thi đấu
        const wall = g.createLinearGradient(0, 0, 0, FL); wall.addColorStop(0, '#22385e'); wall.addColorStop(1, '#3d5f93'); g.fillStyle = wall; g.fillRect(0, 0, VW, FL);
        for (let i = 0; i < 6; i++) { const lx = 90 + i * 165; g.fillStyle = 'rgba(255,255,230,.12)'; g.beginPath(); g.moveTo(lx - 12, 0); g.lineTo(lx + 12, 0); g.lineTo(lx + 70, FL - 120); g.lineTo(lx - 70, FL - 120); g.closePath(); g.fill(); g.fillStyle = '#fff9db'; rr(g, lx - 22, 4, 44, 10, 5); g.fill(); }
        g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(20 + i * 25, 300 + (i % 3) * 8, 9, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#c92a2a'; rr(g, 300, 120, 400, 52, 10); g.fill(); g.fillStyle = '#fff'; g.font = FONT(26); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🏸 GIẢI CẦU LÔNG QL OPEN', 500, 147);
        const fl = g.createLinearGradient(0, FL, 0, VH); fl.addColorStop(0, '#2f9e44'); fl.addColorStop(1, '#237032'); g.fillStyle = fl; g.fillRect(0, FL, VW, VH - FL);
        g.fillStyle = '#fff'; [CL, CR, NX - 140, NX + 140].forEach((x) => g.fillRect(x - 2, FL, 4, 22)); g.fillRect(CL, FL + 18, CR - CL, 3);
        // lưới
        g.fillStyle = '#495057'; g.fillRect(NX - 4, NT - 8, 8, FL - NT + 8);
        g.fillStyle = 'rgba(20,20,20,.55)'; g.fillRect(NX - 3, NT, 6, 92);
        g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1; for (let y = NT; y < NT + 92; y += 7) { g.beginPath(); g.moveTo(NX - 3, y); g.lineTo(NX + 3, y); g.stroke(); }
        g.fillStyle = '#fff'; g.fillRect(NX - 5, NT - 4, 10, 6);
        // cầu thủ
        [ai, me].forEach((p, i) => drawPlayer(g, p, i === 1 ? (S().look || AI_LOOK) : AI_LOOK));
        // quả cầu
        if (phase !== 'serve' || true) {
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(s.x, FL + 6, 10, 3, 0, 0, Math.PI * 2); g.fill();
          g.save(); g.translate(s.x, s.y); g.rotate(s.ang);
          g.fillStyle = '#f8f9fa'; g.beginPath(); g.moveTo(0, -4); g.lineTo(-22, -11); g.lineTo(-22, 11); g.lineTo(0, 4); g.closePath(); g.fill();
          g.strokeStyle = '#adb5bd'; g.lineWidth = 1; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(0, k * 1.5); g.lineTo(-22, k * 5); g.stroke(); }
          g.fillStyle = '#fff'; g.beginPath(); g.arc(2, 0, 5.5, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#ced4da'; g.stroke();
          g.restore();
        }
        scoreBoard(g, sc, server, VW);
        if (phase === 'serve' && server === 0) { g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, 340, 40, 320, 40, 20); g.fill(); g.fillStyle = '#fff'; g.font = FONT(17); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('👆 Chạm để phát cầu', 500, 60); }
        drawMsgs(g, msgs);
      },
    };
    function drawPlayer(g, p, look) {
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(p.x, FL + 4, 34, 8, 0, 0, Math.PI * 2); g.fill();
      try { ART.character(g, p.x, p.y, look, { dir: p.dir, t: p.t, moving: p.moving, scale: 1.05 }); }
      catch (e) { g.fillStyle = look.shirt || '#4dabf7'; rr(g, p.x - 18, p.y - 110, 36, 70, 12); g.fill(); g.fillStyle = look.skin || '#f1c27d'; g.beginPath(); g.arc(p.x, p.y - 128, 20, 0, Math.PI * 2); g.fill(); }
      // vợt
      const sw = p.swing > 0 ? Math.sin((1 - p.swing / 0.28) * Math.PI) : 0;
      const a = -Math.PI / 2 + p.dir * (0.5 - sw * 1.6);
      const hx = p.x + p.dir * 18, hy = p.y - 82;
      const ex = hx + Math.cos(a) * 44, ey = hy + Math.sin(a) * 44;
      g.strokeStyle = '#495057'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx, hy); g.lineTo(ex, ey); g.stroke();
      g.save(); g.translate(ex + Math.cos(a) * 18, ey + Math.sin(a) * 18); g.rotate(a + Math.PI / 2);
      g.strokeStyle = p === me ? '#f76707' : '#7048e8'; g.lineWidth = 3.5; g.beginPath(); g.ellipse(0, 0, 13, 19, 0, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 0.8; for (let k = -10; k <= 10; k += 4) { g.beginPath(); g.moveTo(k, -16); g.lineTo(k, 16); g.stroke(); g.beginPath(); g.moveTo(-12, k * 1.4); g.lineTo(12, k * 1.4); g.stroke(); }
      g.restore();
    }
    return game;
  }

  /* ======================================================================
   * ⛳ GOLF MINI — 6 lỗ, kéo ngược để đánh như ná cao su
   * ==================================================================== */
  const HOLES = [
    { par: 2, start: [300, 790], cup: [300, 190], walls: [[230, 470, 140, 34]], sand: [], water: [], bump: [] },
    { par: 3, start: [130, 800], cup: [130, 180], walls: [[40, 470, 380, 36]], sand: [[430, 150, 130, 120]], water: [], bump: [] },
    { par: 3, start: [300, 810], cup: [300, 165], walls: [], sand: [[220, 200, 50, 70], [330, 200, 50, 70]], water: [[40, 470, 370, 90]], bump: [[480, 330, 26]] },
    { par: 3, start: [110, 810], cup: [480, 170], walls: [[40, 640, 380, 32], [180, 400, 380, 32]], sand: [[400, 690, 120, 70]], water: [], bump: [] },
    { par: 2, start: [300, 800], cup: [300, 170], walls: [], sand: [], water: [], bump: [[300, 420, 34], [200, 320, 26], [400, 320, 26], [150, 520, 22], [450, 520, 22], [300, 260, 20]] },
    { par: 3, start: [300, 810], cup: [300, 160], walls: [[40, 440, 170, 30], [390, 440, 170, 30]], sand: [[60, 150, 110, 90], [430, 150, 110, 90]], water: [[40, 600, 120, 120], [440, 600, 120, 120]], bump: [], mill: { x: 300, y: 455, len: 170, sp: 1.6 } },
  ];
  function makeGolf() {
    const VW = 600, VH = 900, L = 40, T = 70, R = 560, B = 870, BR = 9, CUP = 13;
    let hi = 0, strokes = 0, total = 0, parTot = 0, phase = 'aim', wait = 0, t = 0, mill = 0;
    const cards = [];
    const ball = { x: 0, y: 0, vx: 0, vy: 0, last: [0, 0], s: 1 };
    let aim = null;
    const msgs = [];
    const say = (text, color = '#fff', x = VW / 2, y = VH / 2) => msgs.push({ text, color, x, y, t: 0 });
    const H = () => HOLES[hi];
    function load() { const h = H(); ball.x = h.start[0]; ball.y = h.start[1]; ball.vx = ball.vy = 0; ball.s = 1; strokes = 0; phase = 'aim'; mill = 0; say(`Lỗ ${hi + 1} · Par ${h.par}`, '#fff3bf'); }
    load();
    const inR = (x, y, r) => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];
    function collideRect(r) {
      const cx = clamp(ball.x, r[0], r[0] + r[2]), cy = clamp(ball.y, r[1], r[1] + r[3]);
      const dx = ball.x - cx, dy = ball.y - cy, d = Math.hypot(dx, dy);
      if (d < BR && d > 0.0001) { const nx = dx / d, ny = dy / d; ball.x = cx + nx * BR; ball.y = cy + ny * BR; const vn = ball.vx * nx + ball.vy * ny; if (vn < 0) { ball.vx -= 1.8 * vn * nx; ball.vy -= 1.8 * vn * ny; } }
    }
    function holeDone(pick) {
      const h = H(), d = strokes - h.par;
      cards.push(strokes); total += strokes; parTot += h.par;
      const name = pick ? '🫳 Nhặt bóng (tối đa 8 gậy)' : strokes === 1 ? '🏆 HOLE IN ONE!!!' : d <= -2 ? '🦅 Eagle!' : d === -1 ? '🐦 Birdie!' : d === 0 ? '👍 Par' : d === 1 ? 'Bogey' : `+${d} gậy`;
      say(name, d <= 0 ? '#ffe066' : '#fff', VW / 2, VH / 2 - 30);
      phase = 'next'; wait = 1.6;
    }
    function step(dt) {
      t += dt;
      const h = H();
      if (h.mill) mill += h.mill.sp * dt;
      if (phase === 'next') {
        if ((wait -= dt) <= 0) {
          if (hi >= HOLES.length - 1) { game.over = true; game.res = { win: total <= parTot, strokes: total, par: parTot, cards }; return; }
          hi++; load();
        }
        return;
      }
      if (phase === 'sink') { ball.s = Math.max(0, ball.s - dt * 3); ball.x = lerp(ball.x, h.cup[0], 0.2); ball.y = lerp(ball.y, h.cup[1], 0.2); if (ball.s <= 0) holeDone(false); return; }
      if (phase !== 'roll') return;
      const sand = h.sand.some((r) => inR(ball.x, ball.y, r));
      const f = Math.exp(-(sand ? 4.2 : 1.15) * dt);
      ball.vx *= f; ball.vy *= f;
      const sp = Math.hypot(ball.vx, ball.vy);
      if (sp < 14) { ball.vx = ball.vy = 0; phase = 'aim'; if (strokes >= 8) { phase = 'next'; holeDone(true); } return; }
      ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      if (ball.x < L + BR) { ball.x = L + BR; ball.vx = Math.abs(ball.vx) * 0.8; }
      if (ball.x > R - BR) { ball.x = R - BR; ball.vx = -Math.abs(ball.vx) * 0.8; }
      if (ball.y < T + BR) { ball.y = T + BR; ball.vy = Math.abs(ball.vy) * 0.8; }
      if (ball.y > B - BR) { ball.y = B - BR; ball.vy = -Math.abs(ball.vy) * 0.8; }
      h.walls.forEach(collideRect);
      h.bump.forEach(([bx, by, r]) => { const dx = ball.x - bx, dy = ball.y - by, d = Math.hypot(dx, dy); if (d < r + BR) { const nx = dx / d, ny = dy / d; ball.x = bx + nx * (r + BR); ball.y = by + ny * (r + BR); const vn = ball.vx * nx + ball.vy * ny; if (vn < 0) { ball.vx -= 2.05 * vn * nx; ball.vy -= 2.05 * vn * ny; } } });
      if (h.mill) {
        const m = h.mill, ca = Math.cos(mill), sa = Math.sin(mill);
        for (const sgn of [1, -1]) {
          const ax = m.x - ca * m.len * sgn * 0, ay = m.y, bx = m.x + ca * m.len * sgn, by = m.y + sa * m.len * sgn;
          const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy, k = clamp(((ball.x - ax) * vx + (ball.y - ay) * vy) / l2, 0, 1);
          const px = ax + vx * k, py = ay + vy * k, dx = ball.x - px, dy = ball.y - py, d = Math.hypot(dx, dy);
          if (d < BR + 7 && d > 0.001) {
            const nx = dx / d, ny = dy / d; ball.x = px + nx * (BR + 7); ball.y = py + ny * (BR + 7);
            const vn = ball.vx * nx + ball.vy * ny; if (vn < 0) { ball.vx -= 1.8 * vn * nx; ball.vy -= 1.8 * vn * ny; }
            const tang = m.sp * m.len * k; ball.vx += -sa * sgn * tang * 0.6; ball.vy += ca * sgn * tang * 0.6;
          }
        }
      }
      if (h.water.some((r) => inR(ball.x, ball.y, r))) { strokes++; say('💦 Rơi xuống hồ! +1 gậy', '#a5d8ff', ball.x, ball.y - 30); ball.x = ball.last[0]; ball.y = ball.last[1]; ball.vx = ball.vy = 0; phase = 'aim'; return; }
      const dc = Math.hypot(ball.x - h.cup[0], ball.y - h.cup[1]);
      if (dc < CUP) { if (sp < 560) { phase = 'sink'; return; } const a = rnd(-0.5, 0.5); const c = Math.cos(a), s2 = Math.sin(a); const vx = ball.vx; ball.vx = (vx * c - ball.vy * s2) * 0.75; ball.vy = (vx * s2 + ball.vy * c) * 0.75; say('Lướt qua lỗ!', '#fff', h.cup[0], h.cup[1] - 30); }
      else if (dc < 34 && sp < 260) { ball.vx += (h.cup[0] - ball.x) * 6 * dt; ball.vy += (h.cup[1] - ball.y) * 6 * dt; }
    }
    const game = {
      VW, VH, over: false, res: null,
      update(dt) { for (let k = 0; k < 3; k++) { step(dt / 3); if (game.over) break; } msgs.forEach((m) => { m.t += dt; }); while (msgs.length && msgs[0].t > 1.5) msgs.shift(); },
      down(p) { if (phase === 'aim') aim = { sx: p.x, sy: p.y, cx: p.x, cy: p.y }; },
      move(p) { if (aim) { aim.cx = p.x; aim.cy = p.y; } },
      up() {
        if (!aim) return;
        const dx = aim.sx - aim.cx, dy = aim.sy - aim.cy, len = Math.hypot(dx, dy), pw = clamp(len / 230, 0, 1);
        aim = null;
        if (pw < 0.06 || phase !== 'aim') return;
        ball.last = [ball.x, ball.y]; ball.vx = dx / len * pw * 1150; ball.vy = dy / len * pw * 1150; strokes++; phase = 'roll';
      },
      key() {},
      draw(g) {
        const h = H();
        g.fillStyle = '#2b6b34'; g.fillRect(0, 0, VW, VH);
        g.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 70; i++) { g.beginPath(); g.arc((i * 97) % VW, (i * 173) % VH, 14, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#5c3d1e'; rr(g, L - 12, T - 12, R - L + 24, B - T + 24, 16); g.fill();
        g.fillStyle = '#69c454'; g.fillRect(L, T, R - L, B - T);
        g.fillStyle = 'rgba(255,255,255,.07)'; for (let y = T; y < B; y += 60) g.fillRect(L, y, R - L, 30);
        h.water.forEach((r) => { g.fillStyle = '#339af0'; rr(g, r[0], r[1], r[2], r[3], 16); g.fill(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; for (let k = 0; k < 3; k++) { const y = r[1] + 20 + k * 25; if (y > r[1] + r[3] - 10) break; g.beginPath(); g.moveTo(r[0] + 15 + Math.sin(t * 2 + k) * 6, y); g.quadraticCurveTo(r[0] + r[2] / 2, y - 6, r[0] + r[2] - 15, y); g.stroke(); } });
        h.sand.forEach((r) => { g.fillStyle = '#f3d98b'; rr(g, r[0], r[1], r[2], r[3], 30); g.fill(); g.fillStyle = 'rgba(160,120,50,.3)'; for (let k = 0; k < 14; k++) { g.beginPath(); g.arc(r[0] + 8 + ((k * 37) % (r[2] - 16)), r[1] + 8 + ((k * 23) % (r[3] - 16)), 1.6, 0, Math.PI * 2); g.fill(); } });
        h.walls.forEach((r) => { g.fillStyle = '#5c3d1e'; g.fillRect(r[0], r[1] + 5, r[2], r[3]); g.fillStyle = '#a06b3c'; g.fillRect(r[0], r[1], r[2], r[3] - 4); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(r[0], r[1], r[2], 4); });
        h.bump.forEach(([x, y, r]) => { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x + 3, y + 5, r, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e03131'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r * 0.6, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e03131'; g.beginPath(); g.arc(x, y, r * 0.3, 0, Math.PI * 2); g.fill(); });
        // tee + lỗ + cờ
        g.fillStyle = 'rgba(255,255,255,.25)'; rr(g, h.start[0] - 30, h.start[1] - 16, 60, 32, 6); g.fill();
        g.fillStyle = '#1d3b12'; g.beginPath(); g.arc(h.cup[0], h.cup[1], CUP, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke();
        if (h.mill) { const m = h.mill; g.save(); g.translate(m.x, m.y); g.rotate(mill); g.fillStyle = '#7a4a24'; rr(g, -m.len, -7, m.len * 2, 14, 6); g.fill(); g.fillStyle = '#c08b5c'; rr(g, -m.len, -7, m.len * 2, 5, 4); g.fill(); g.restore(); g.fillStyle = '#495057'; g.beginPath(); g.arc(m.x, m.y, 14, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ced4da'; g.beginPath(); g.arc(m.x, m.y, 6, 0, Math.PI * 2); g.fill(); }
        const far = Math.hypot(ball.x - h.cup[0], ball.y - h.cup[1]) > 70;
        if (far) { g.fillStyle = '#dee2e6'; g.fillRect(h.cup[0] - 1.5, h.cup[1] - 70, 3, 70); g.fillStyle = '#ff6b6b'; g.beginPath(); g.moveTo(h.cup[0] + 1.5, h.cup[1] - 70); g.quadraticCurveTo(h.cup[0] + 22, h.cup[1] - 62 + Math.sin(t * 5) * 3, h.cup[0] + 38, h.cup[1] - 58); g.lineTo(h.cup[0] + 1.5, h.cup[1] - 46); g.closePath(); g.fill(); g.fillStyle = '#fff'; g.font = FONT(11); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(hi + 1, h.cup[0] + 14, h.cup[1] - 58); }
        // ngắm
        if (aim && phase === 'aim') {
          const dx = aim.sx - aim.cx, dy = aim.sy - aim.cy, len = Math.hypot(dx, dy), pw = clamp(len / 230, 0, 1);
          if (len > 3) {
            g.setLineDash([8, 8]); g.strokeStyle = `hsl(${120 - pw * 120},90%,60%)`; g.lineWidth = 4; g.beginPath(); g.moveTo(ball.x, ball.y); g.lineTo(ball.x + dx / len * (40 + pw * 220), ball.y + dy / len * (40 + pw * 220)); g.stroke(); g.setLineDash([]);
            g.fillStyle = 'rgba(0,0,0,.5)'; rr(g, ball.x - 40, ball.y + 22, 80, 12, 6); g.fill(); g.fillStyle = `hsl(${120 - pw * 120},90%,55%)`; rr(g, ball.x - 38, ball.y + 24, 76 * pw, 8, 4); g.fill();
          }
        }
        if (ball.s > 0) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(ball.x + 2, ball.y + 4, BR * ball.s, BR * 0.6 * ball.s, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ball.x, ball.y, BR * ball.s, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#adb5bd'; g.lineWidth = 1; g.stroke(); }
        // bảng điểm
        g.fillStyle = 'rgba(0,0,0,.6)'; rr(g, 10, 10, VW - 20, 46, 12); g.fill();
        g.fillStyle = '#fff'; g.font = FONT(17); g.textAlign = 'left'; g.textBaseline = 'middle';
        const diffTot = total + strokes - parTot - (phase === 'next' ? 0 : 0);
        g.fillText(`⛳ Lỗ ${hi + 1}/6 · Par ${h.par} · Gậy ${strokes}`, 24, 33);
        g.textAlign = 'right'; g.fillStyle = '#ffe066'; g.fillText(`Tổng: ${total} (${parTot ? (total - parTot >= 0 ? '+' : '') + (total - parTot) : 'E'})`, VW - 24, 33);
        void diffTot;
        if (phase === 'aim' && !aim && strokes === 0) { g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, VW / 2 - 190, VH - 26 - 40, 380, 40, 20); g.fill(); g.fillStyle = '#fff'; g.font = FONT(15); g.textAlign = 'center'; g.fillText('👆 Kéo ngược ra sau rồi thả để đánh bóng', VW / 2, VH - 46); }
        drawMsgs(g, msgs);
      },
    };
    return game;
  }

  /* ======================================================================
   * 🏀 BÓNG RỔ — vuốt lên để ném, 45 giây, rổ di chuyển khi điểm cao
   * ==================================================================== */
  function makeBasket() {
    const VW = 600, VH = 900, G = 2500, RIM_Y = 300, RIM_W = 62, R0 = 40, Y0 = 780;
    const rim = { x: 300 };
    const ball = { x: 300, y: Y0, vx: 0, vy: 0, s: 1, rot: 0, st: 'ready', touched: false, scored: false, desc: false, peak: Y0, wait: 0 };
    let score = 0, streak = 0, shots = 0, makes = 0, time = 45, t = 0, swipe = null, netK = 0, ended = false;
    const msgs = [];
    const say = (text, color = '#fff', x = VW / 2, y = 420) => msgs.push({ text, color, x, y, t: 0 });
    function reset() { ball.x = rnd(170, 430); ball.y = Y0; ball.vx = ball.vy = 0; ball.s = 1; ball.st = 'ready'; ball.touched = ball.scored = ball.desc = false; ball.peak = Y0; }
    reset(); ball.x = 300;
    function shoot(dx, dy) {
      const L = clamp(-dy, 40, 460), vy0 = -(1180 + L * 1.55);
      const disc = vy0 * vy0 - 2 * G * (Y0 - RIM_Y);
      const T = disc > 0 ? (-vy0 + Math.sqrt(disc)) / G : -vy0 / G * 1.4;
      const tx = ball.x + (dx / Math.max(1, -dy)) * (Y0 - RIM_Y);
      ball.vx = (tx - ball.x) / T; ball.vy = vy0; ball.st = 'fly'; shots++;
    }
    function step(dt) {
      t += dt;
      if (!ended) { time -= dt; if (time <= 0) { time = 0; ended = true; } }
      const amp = score >= 5 ? Math.min(150, (score - 4) * 13) : 0;
      rim.x = 300 + Math.sin(t * (1.1 + Math.min(1.4, score * 0.03))) * amp;
      netK = Math.max(0, netK - dt * 2.5);
      if (ball.st === 'ready') { if (ended) { game.over = true; game.res = { win: score >= 10, score, makes, shots }; } return; }
      if (ball.st === 'wait') { if ((ball.wait -= dt) <= 0) reset(); return; }
      const py = ball.y;
      ball.vy += G * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.rot += ball.vx * dt * 0.02 + dt * 4;
      ball.peak = Math.min(ball.peak, ball.y);
      if (ball.vy < 0) ball.s = 1 - 0.38 * clamp((Y0 - ball.y) / (Y0 - RIM_Y), 0, 1);
      else if (!ball.desc) ball.desc = ball.peak < RIM_Y - 10;
      const r = R0 * ball.s;
      if (ball.desc && !ball.scored) {
        for (const lx of [rim.x - RIM_W, rim.x + RIM_W]) {
          const dx = ball.x - lx, dy = ball.y - RIM_Y, d = Math.hypot(dx, dy);
          if (d < r + 5 && d > 0.01) { const nx = dx / d, ny = dy / d; ball.x = lx + nx * (r + 5); ball.y = RIM_Y + ny * (r + 5); const vn = ball.vx * nx + ball.vy * ny; if (vn < 0) { ball.vx -= 1.55 * vn * nx; ball.vy -= 1.55 * vn * ny; } ball.touched = true; }
        }
        // bảng rổ phía sau
        if (ball.y < RIM_Y && ball.y > RIM_Y - 150 && Math.abs(ball.x - rim.x) < 110 && ball.vy < 0 && ball.peak < RIM_Y - 120) { /* bóng bay cao qua bảng */ }
        if (py < RIM_Y && ball.y >= RIM_Y && Math.abs(ball.x - rim.x) < RIM_W - 5) {
          ball.scored = true; makes++; streak++;
          const fire = streak >= 3, swish = !ball.touched, pts = (swish ? 2 : 1) * (fire ? 2 : 1);
          score += pts; netK = 1; if (swish) time = Math.min(60, time + 2);
          say(`${swish ? '🎯 Ngọt! ' : '✅ Vào! '}+${pts}${fire ? ' 🔥' : ''}`, swish ? '#ffe066' : '#fff', rim.x, RIM_Y - 70);
          ball.vx *= 0.3;
        }
      }
      if (ball.y > VH + 80 || ball.x < -120 || ball.x > VW + 120) {
        if (!ball.scored) { if (streak >= 3) say('Mất chuỗi 🔥', '#ffa8a8'); streak = 0; say('Trượt rồi!', '#ffa8a8', VW / 2, 520); }
        ball.st = 'wait'; ball.wait = 0.25;
      }
    }
    const game = {
      VW, VH, over: false, res: null,
      update(dt) { for (let k = 0; k < 3; k++) { step(dt / 3); if (game.over) break; } msgs.forEach((m) => { m.t += dt; }); while (msgs.length && msgs[0].t > 1.2) msgs.shift(); },
      down(p) { if (ball.st === 'ready' && !ended && Math.hypot(p.x - ball.x, p.y - ball.y) < 140) swipe = { x: p.x, y: p.y, t: performance.now() }; },
      move() {},
      up(p) { if (!swipe) return; const dx = p.x - swipe.x, dy = p.y - swipe.y; swipe = null; if (dy < -30 && ball.st === 'ready') shoot(dx, dy); },
      key(k, on) { if (on && (k === ' ' || k === 'ArrowUp') && ball.st === 'ready' && !ended) shoot((rim.x - ball.x) * 0.55, -330); },
      draw(g) {
        const wall = g.createLinearGradient(0, 0, 0, VH); wall.addColorStop(0, '#1c2c4c'); wall.addColorStop(0.62, '#3b5b92'); wall.addColorStop(0.62, '#c98a4b'); wall.addColorStop(1, '#a86b33'); g.fillStyle = wall; g.fillRect(0, 0, VW, VH);
        g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2; for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(300 + k * 30, 558); g.lineTo(300 + k * 120, VH); g.stroke(); }
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 4; g.beginPath(); g.ellipse(300, VH + 40, 260, 170, 0, Math.PI, 2 * Math.PI); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(20 + i * 20, 470 + (i % 4) * 14, 8, 0, Math.PI * 2); g.fill(); }
        // cột + bảng
        g.fillStyle = '#495057'; g.fillRect(rim.x - 6, RIM_Y - 40, 12, 300); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(rim.x - 6, RIM_Y + 200, 12, 60);
        g.fillStyle = '#f8f9fa'; rr(g, rim.x - 115, RIM_Y - 160, 230, 145, 8); g.fill(); g.strokeStyle = '#212529'; g.lineWidth = 4; g.stroke();
        g.strokeStyle = '#e03131'; g.lineWidth = 4; g.strokeRect(rim.x - 40, RIM_Y - 80, 80, 58);
        // vành sau
        g.strokeStyle = '#d9480f'; g.lineWidth = 5; g.beginPath(); g.ellipse(rim.x, RIM_Y, RIM_W, 12, 0, Math.PI, 2 * Math.PI); g.stroke();
        const behind = ball.desc && ball.y < RIM_Y + 90 && ball.st === 'fly';
        if (behind) drawBall(g);
        // lưới rổ
        const nl = 75 + netK * 25;
        g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2;
        for (let k = 0; k <= 6; k++) { const x1 = rim.x - RIM_W + k * RIM_W / 3, x2 = rim.x - RIM_W * 0.55 + k * RIM_W * 0.55 / 3; g.beginPath(); g.moveTo(x1, RIM_Y); g.lineTo(x2 + Math.sin(t * 9 + k) * netK * 6, RIM_Y + nl); g.stroke(); }
        for (let j = 1; j <= 3; j++) { const k = j / 4, w = RIM_W * (1 - 0.45 * k); g.beginPath(); g.ellipse(rim.x, RIM_Y + nl * k, w, 6, 0, 0, Math.PI); g.stroke(); }
        g.strokeStyle = '#f76707'; g.lineWidth = 6; g.beginPath(); g.ellipse(rim.x, RIM_Y, RIM_W, 12, 0, 0, Math.PI); g.stroke();
        if (!behind) drawBall(g);
        if (ball.st === 'ready' && !ended && shots < 2) { g.fillStyle = 'rgba(255,255,255,.9)'; g.font = FONT(18); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('👆 Vuốt bóng lên về phía rổ', 300, Y0 + 70); const k = (t * 1.6) % 1; g.globalAlpha = 1 - k; g.font = '32px system-ui'; g.fillText('⬆️', ball.x, Y0 - 70 - k * 60); g.globalAlpha = 1; }
        // HUD
        g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, 12, 12, VW - 24, 52, 14); g.fill();
        g.fillStyle = '#fff'; g.font = FONT(22); g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(`🏀 ${score}`, 28, 38);
        if (streak >= 3) { g.fillStyle = '#ffa94d'; g.fillText(`🔥 x2`, 120, 38); }
        g.textAlign = 'right'; g.fillStyle = time < 10 ? '#ff8787' : '#fff'; g.fillText(`⏱ ${Math.ceil(time)}s`, VW - 28, 38);
        g.fillStyle = 'rgba(255,255,255,.2)'; rr(g, 200, 32, 200, 12, 6); g.fill(); g.fillStyle = time < 10 ? '#ff6b6b' : '#69db7c'; rr(g, 200, 32, 200 * Math.min(1, time / 45), 12, 6); g.fill();
        drawMsgs(g, msgs);
      },
    };
    function drawBall(g) {
      const r = R0 * ball.s;
      if (ball.st === 'ready') { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(ball.x, Y0 + r * 0.95, r * 0.9, r * 0.25, 0, 0, Math.PI * 2); g.fill(); }
      g.save(); g.translate(ball.x, ball.y); g.rotate(ball.rot);
      const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); gr.addColorStop(0, '#ffa94d'); gr.addColorStop(1, '#d9480f');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#3d1a00'; g.lineWidth = Math.max(1.5, r * 0.06);
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.moveTo(0, -r); g.lineTo(0, r); g.stroke();
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
    badminton: { name: 'Cầu lông', icon: '🏸', vs: true, make: makeBadminton, VW: 1000, VH: 600, bg: '#22385e',
      how: ['Chạm / kéo ngang để chạy theo cầu — vợt tự đỡ khi cầu tới gần', 'Chạm khi cầu bay cao = <b>bật nhảy ĐẬP CẦU</b> 💥', 'Đang chạy lên lưới thì bỏ nhỏ, lùi về sau thì phông cầu cao', 'Bàn phím: ← → di chuyển, Space nhảy đập', 'Ai được 7 điểm trước (cách 2 điểm) là thắng'] },
    pingpong: { name: 'Bóng bàn', icon: '🏓', vs: true, make: (d) => makeRally('pingpong', d), VW: 600, VH: 900, bg: '#1b2742',
      how: ['Kéo ngón tay để di chuyển vợt — chạm bóng là tự đánh', 'Bóng phải nảy bên bàn mình 1 lần rồi mới đánh', 'Đỡ ở mép vợt → bóng đi chéo góc (dễ ra ngoài!)', 'Hất vợt nhanh lên trên lúc chạm bóng = <b>ĐẬP</b> 💥', 'Ai được 7 điểm trước (cách 2 điểm) là thắng'] },
    golf: { name: 'Golf mini', icon: '⛳', vs: false, make: () => makeGolf(), VW: 600, VH: 900, bg: '#2b6b34',
      how: ['Kéo ngược ra sau như ná cao su rồi thả để đánh', 'Kéo càng dài càng mạnh — vạch chấm cho biết hướng bóng', 'Cát làm bóng chậm, rơi xuống hồ bị phạt +1 gậy', '6 lỗ — tổng số gậy càng ít càng nhiều xu'] },
    basketball: { name: 'Bóng rổ', icon: '🏀', vs: false, make: () => makeBasket(), VW: 600, VH: 900, bg: '#1c2c4c',
      how: ['Vuốt quả bóng lên về phía rổ — vuốt dài thì ném xa', '45 giây: vào rổ +1, không chạm vành (ngọt) +2 và +2 giây', 'Vào 3 quả liên tiếp: 🔥 nhân đôi điểm', 'Từ 5 điểm rổ bắt đầu chạy qua lại'] },
    pickleball: { name: 'Pickleball', icon: '🥎', vs: true, make: (d) => makeRally('pickleball', d), VW: 600, VH: 900, bg: '#2b8a3e',
      how: ['Kéo ngón tay để di chuyển vợt — chạm bóng là tự đánh', '2 cú đầu (giao + trả giao) phải để bóng nảy', 'Sau đó được đánh vô lê, <b>trừ khi đứng trong vùng bếp (KITCHEN)</b>', 'Đứng sát vùng bếp sẽ đánh bỏ nhỏ (dink) nhẹ nhàng', 'Ai được 7 điểm trước (cách 2 điểm) là thắng'] },
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
      g.save(); g.beginPath(); g.rect(0, 0, me.game.VW, me.game.VH); g.clip(); me.game.draw(g); g.restore();
      me.raf = requestAnimationFrame(frame);
    }
    function showMenu() {
      const d = D(), best = d.best[id], wins = d.wins[id] || 0, cap = d.day === today() ? DAY_CAP - (d.earned || 0) : DAY_CAP;
      const rec = id === 'golf' ? (best ? `🏅 Kỷ lục: <b>${best} gậy</b> / 6 lỗ` : 'Chưa có kỷ lục') : id === 'basketball' ? (best ? `🏅 Kỷ lục: <b>${best} điểm</b>` : 'Chưa có kỷ lục') : `🏆 Đã thắng máy <b>${wins}</b> ván`;
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
      if (G.vs) {
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
