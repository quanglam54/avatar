/* 🕹️ Máy game mới chơi ngay trong Avatar (không dùng khung iframe):
 *   🐟 CÁ LỚN NUỐT CÁ BÉ — kéo ngón tay / chuột để bơi, ăn cá nhỏ hơn mình để lớn dần, né cá to hơn.
 *   🚇 CHẠY TÀU ĐIỆN (kiểu Subway Surfers) — 3 làn đường ray: vuốt trái/phải đổi làn, vuốt lên nhảy, vuốt xuống lăn; nhặt xu, né rào chắn & tàu.
 * Thưởng xu theo điểm (tối đa 60 xu/ván, như các máy game khác), lưu kỷ lục vào S.arc2.best. */
const ARCADE2 = (() => {
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const S = () => AV.S;
  const D = () => { const s = S(); s.arc2 = s.arc2 || {}; s.arc2.best = s.arc2.best || {}; return s.arc2; };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const FONT = (n, w = 900) => `${w} ${n}px "Be Vietnam Pro", system-ui, sans-serif`;
  function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
  function txt(g, s, x, y, size, col = '#fff', align = 'center', stroke = true) {
    g.font = FONT(size); g.textAlign = align; g.textBaseline = 'middle';
    if (stroke) { g.lineWidth = Math.max(3, size / 6); g.strokeStyle = 'rgba(0,0,0,.45)'; g.strokeText(s, x, y); }
    g.fillStyle = col; g.fillText(s, x, y);
  }

  /* ======================================================================
   * 🐟 CÁ LỚN NUỐT CÁ BÉ
   * ==================================================================== */
  const FISH_COLORS = [['#ffd43b', '#fab005'], ['#74c0fc', '#1c7ed6'], ['#b2f2bb', '#2f9e44'], ['#ffc9c9', '#e03131'], ['#e5dbff', '#7048e8'], ['#ffd8a8', '#e8590c'], ['#c3fae8', '#0ca678']];
  function makeBigFish() {
    const VH = 720;
    const me = { x: 640, y: 360, tx: 640, ty: 360, r: 22, dir: 1, inv: 2, eaten: 0, ph: 0 };
    const fish = [], fx = [], bubbles = [];
    let t = 0, score = 0, lives = 3, combo = 0, comboT = 0, level = 1, held = false;
    const NEED = [0, 6, 10, 14, 18, 24, 30, 40]; // số cá cần ăn để lên cấp tiếp
    const say = (text, x, y, c = '#fff', big) => fx.push({ text, x, y, c, t: 0, big });
    for (let i = 0; i < 30; i++) bubbles.push({ x: rnd(0, 1700), y: rnd(0, VH), r: rnd(2, 6), sp: rnd(20, 60) });
    function spawn(init) {
      const W = game.VW, dir = Math.random() < 0.5 ? 1 : -1;
      // phần lớn cá nhỏ hơn mình một chút (ăn được), thỉnh thoảng có cá to (nguy hiểm), càng lên cấp càng nhiều cá to
      const k = Math.random(), danger = k < 0.18 + Math.min(0.17, level * 0.02);
      const r = danger ? me.r * rnd(1.25, 2.6) : k < 0.55 ? me.r * rnd(0.35, 0.75) : me.r * rnd(0.6, 0.95);
      const col = FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)];
      fish.push({ x: init ? rnd(0, W) : dir > 0 ? -r * 2 - 20 : W + r * 2 + 20, y: rnd(70, VH - 50), r: clamp(r, 6, 150), dir, sp: rnd(40, 110) * (danger ? 1.15 : 1) / Math.sqrt(Math.max(1, r / 20)) * 1.6, ph: Math.random() * 6, col, shark: danger && r > 70 && Math.random() < 0.5, wob: rnd(10, 30) });
    }
    const game = {
      VW: 1280, VH, wide: true, over: false, res: null,
      how: ['<b>Kéo ngón tay / di chuột</b> — cá của bạn bơi theo', 'Ăn cá <b>nhỏ hơn</b> mình để lớn dần · chạm cá <b>to hơn</b> là bị ăn (mất 1 mạng)', 'Ăn liên tục được <b>combo</b> nhân điểm · có 3 mạng'],
      start() { for (let i = 0; i < 14; i++) spawn(true); },
      update(dt) {
        t += dt; me.ph += dt; me.inv = Math.max(0, me.inv - dt); comboT -= dt; if (comboT <= 0) combo = 0;
        const W = game.VW;
        // bơi theo ngón tay (có quán tính)
        const dx = me.tx - me.x, dy = me.ty - me.y, d = Math.hypot(dx, dy), sp = 330 + 60 / Math.max(1, me.r / 20);
        if (d > 2) { const m = Math.min(d, sp * dt); me.x += dx / d * m; me.y += dy / d * m; if (Math.abs(dx) > 4) me.dir = dx > 0 ? 1 : -1; }
        me.x = clamp(me.x, me.r, W - me.r); me.y = clamp(me.y, 50 + me.r * 0.5, VH - 30);
        for (const f of fish) {
          f.ph += dt; f.x += f.dir * f.sp * dt; f.y += Math.sin(f.ph * 1.5) * f.wob * dt;
          // cá to thấy mình gần thì đuổi theo một chút
          if (f.r > me.r * 1.1 && me.inv <= 0) { const ex = me.x - f.x, ey = me.y - f.y, ed = Math.hypot(ex, ey); if (ed < 260 && Math.sign(ex) === f.dir) f.y += Math.sign(ey) * 40 * dt; }
          // cá nhỏ thấy mình thì bơi lệch ra
          if (f.r < me.r * 0.9) { const ex = f.x - me.x, ey = f.y - me.y, ed = Math.hypot(ex, ey); if (ed < 150) f.y += Math.sign(ey || 1) * 50 * dt; }
          f.y = clamp(f.y, 60, VH - 30);
        }
        // ăn / bị ăn
        for (let i = fish.length - 1; i >= 0; i--) {
          const f = fish[i], dd = Math.hypot(f.x - me.x, f.y - me.y);
          if (dd > (f.r + me.r) * 0.72) continue;
          if (f.r < me.r * 0.95) {
            fish.splice(i, 1); combo++; comboT = 1.6; me.eaten++;
            const pts = Math.round(f.r * 2) * Math.min(5, combo);
            score += pts; me.r = Math.min(150, me.r + f.r * 0.07);
            say(`+${pts}${combo > 1 ? ' ×' + Math.min(5, combo) : ''}`, f.x, f.y - 20, combo > 2 ? '#ffe066' : '#fff');
            if (me.eaten >= NEED[Math.min(NEED.length - 1, level)]) { level++; me.eaten = 0; say(`🎉 LÊN CẤP ${level}!`, W / 2, 200, '#8ce99a', 1); score += level * 50; }
          } else if (me.inv <= 0 && f.r > me.r * 1.05) {
            lives--; me.inv = 2.5; combo = 0; say(lives > 0 ? '💥 Bị đớp rồi!' : '💀 Hết mạng!', me.x, me.y - 40, '#ff8787', 1);
            me.r = Math.max(20, me.r * 0.85);
            if (lives <= 0) { game.over = true; game.res = { score, level }; return; }
          }
        }
        for (let i = fish.length - 1; i >= 0; i--) { const f = fish[i]; if (f.x < -f.r * 3 - 60 || f.x > W + f.r * 3 + 60) fish.splice(i, 1); }
        while (fish.length < 14 + Math.min(8, level)) spawn();
        bubbles.forEach((b) => { b.y -= b.sp * dt; if (b.y < -10) { b.y = VH + 10; b.x = rnd(0, W); } });
        fx.forEach((f) => { f.t += dt; }); while (fx.length && fx[0].t > 1.1) fx.shift();
      },
      down(p) { held = true; me.tx = p.x; me.ty = p.y; },
      move(p) { me.tx = p.x; me.ty = p.y; },
      up() { held = false; },
      key(k, on) { if (!on) return; const st = 70; if (k === 'ArrowLeft' || k === 'a') me.tx = me.x - st; if (k === 'ArrowRight' || k === 'd') me.tx = me.x + st; if (k === 'ArrowUp' || k === 'w') me.ty = me.y - st; if (k === 'ArrowDown' || k === 's') me.ty = me.y + st; },
      draw(g) {
        const W = game.VW;
        const sea = g.createLinearGradient(0, 0, 0, VH); sea.addColorStop(0, '#3bc9db'); sea.addColorStop(0.5, '#1c7ed6'); sea.addColorStop(1, '#0b3d63'); g.fillStyle = sea; g.fillRect(0, 0, W, VH);
        g.fillStyle = 'rgba(255,255,255,.06)'; for (let i = 0; i < 7; i++) { const x = ((i * 250 + Math.sin(t * 0.3 + i) * 50) % (W + 200)) - 100; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 80, 0); g.lineTo(x + 260, VH); g.lineTo(x + 140, VH); g.fill(); }
        g.fillStyle = '#e9d8a6'; g.beginPath(); g.moveTo(0, VH); for (let x = 0; x <= W; x += 40) g.lineTo(x, VH - 26 + Math.sin(x * 0.02) * 6); g.lineTo(W, VH); g.fill();
        for (let i = 0; i < 12; i++) { const x = (i * 173 + 50) % W, h = 50 + (i * 41) % 70; g.strokeStyle = i % 2 ? '#2f9e44' : '#51cf66'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, VH - 20); for (let s = 1; s <= 5; s++) g.lineTo(x + Math.sin(t * 1.5 + i + s) * 7 * s / 5, VH - 20 - h * s / 5); g.stroke(); }
        g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; bubbles.forEach((b) => { g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2); g.stroke(); });
        fish.forEach((f) => drawFish(g, f.x, f.y, f.r, f.dir, f.col, f.ph, f.r > me.r * 1.05, f.shark));
        if (!(me.inv > 0 && Math.floor(t * 10) % 2)) drawFish(g, me.x, me.y, me.r, me.dir, ['#ffa94d', '#e8590c'], me.ph, false, false, true);
        fx.forEach((f) => { g.globalAlpha = Math.max(0, 1 - f.t / 1.1); txt(g, f.text, f.x, f.y - f.t * 40, f.big ? 34 : 22, f.c); g.globalAlpha = 1; });
        // HUD
        g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 12, 12, 260, 44, 22); g.fill();
        txt(g, `⭐ ${fmt(score)}`, 30, 34, 22, '#ffe066', 'left');
        txt(g, '❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3 - lives)), W - 20, 34, 24, '#fff', 'right', false);
        const need = NEED[Math.min(NEED.length - 1, level)], bw = Math.min(320, W * 0.3);
        g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, W / 2 - bw / 2 - 6, 14, bw + 12, 32, 16); g.fill();
        g.fillStyle = '#69db7c'; rr(g, W / 2 - bw / 2, 20, bw * Math.min(1, me.eaten / need), 20, 10); g.fill();
        txt(g, `🐟 Cấp ${level} · ăn thêm ${Math.max(0, need - me.eaten)} con để lớn`, W / 2, 30, 14);
        if (t < 4 && !held) txt(g, '👆 Kéo ngón tay để bơi · ăn cá nhỏ, né cá to!', W / 2, VH * 0.82, 22);
      },
    };
    return game;
  }
  /** vẽ con cá: thân bầu dục + đuôi + vây + mắt (cá nguy hiểm có lông mày giận, cá mập có vây lưng) */
  function drawFish(g, x, y, r, dir, col, ph, angry, shark, mine) {
    g.save(); g.translate(x, y); g.scale(dir, 1);
    const w = r * 1.35, h = r * (shark ? 0.62 : 0.85), wag = Math.sin(ph * 10) * 0.25;
    if (shark) col = ['#adb5bd', '#495057'];
    g.fillStyle = col[1];
    g.save(); g.translate(-w * 0.85, 0); g.rotate(wag); g.beginPath(); g.moveTo(0, 0); g.lineTo(-r * 0.75, -h * 0.8); g.lineTo(-r * 0.55, 0); g.lineTo(-r * 0.75, h * 0.8); g.closePath(); g.fill(); g.restore();
    if (shark) { g.beginPath(); g.moveTo(-w * 0.1, -h * 0.8); g.lineTo(w * 0.15, -h * 1.6); g.lineTo(w * 0.35, -h * 0.75); g.fill(); }
    else { g.beginPath(); g.moveTo(-w * 0.3, -h * 0.8); g.quadraticCurveTo(0, -h * 1.45, w * 0.25, -h * 0.8); g.fill(); }
    const bd = g.createLinearGradient(0, -h, 0, h); bd.addColorStop(0, col[1]); bd.addColorStop(0.5, col[0]); bd.addColorStop(1, shark ? '#f1f3f5' : col[0]);
    g.fillStyle = bd; g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, Math.PI * 2); g.fill();
    if (mine) { g.strokeStyle = '#fff'; g.lineWidth = Math.max(2, r * 0.08); g.stroke(); }
    if (!shark) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = Math.max(1.5, r * 0.08); for (let k = -1; k <= 1; k++) { g.beginPath(); g.arc(-w * 0.15 + k * w * 0.28, 0, h * 0.7, -0.6, 0.6); g.stroke(); } }
    const ex = w * 0.5, ey = -h * 0.2, er = Math.max(2.5, r * 0.2);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, er, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#212529'; g.beginPath(); g.arc(ex + er * 0.25, ey, er * 0.55, 0, Math.PI * 2); g.fill();
    if (angry || shark) { g.strokeStyle = '#212529'; g.lineWidth = Math.max(2, r * 0.09); g.beginPath(); g.moveTo(ex - er * 1.2, ey - er * 1.6); g.lineTo(ex + er * 1.1, ey - er * 0.9); g.stroke(); }
    g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = Math.max(1.5, r * 0.06); g.beginPath();
    if (shark) { g.moveTo(w * 0.55, h * 0.35); g.lineTo(w * 0.9, h * 0.2); } else g.arc(w * 0.82, h * 0.15, r * 0.14, 0.2, 1.8);
    g.stroke();
    g.restore();
  }

  /* ======================================================================
   * 🚇 CHẠY TÀU ĐIỆN (kiểu Subway Surfers)
   * ==================================================================== */
  function makeSubway() {
    const VH = 720, LANE = 2.6, CAMZ = 6, CAMY = 3.2;
    const me = { lane: 0, x: 0, y: 0, vy: 0, roll: 0, t: 0, magnet: 0 };
    let speed = 14, dist = 0, coins = 0, t = 0, nextObs = 30, nextCoin = 12, over = false, deathT = 0, swipe = null, msg = 0;
    const objs = []; // { type: 'low'|'high'|'train'|'coin'|'magnet', lane, z, y? }
    const fx = [];
    // camera nhìn chéo xuống đường ray
    function P(x, y, z, W) { const zz = Math.max(0.3, z + CAMZ), f = VH * 1.05 / zz; return { x: W / 2 + x * f, y: VH * 0.3 + (CAMY - y) * f, k: f }; }
    function lanePattern() {
      const L = [-1, 0, 1], z = 120;
      const r = Math.random();
      if (r < 0.35) { // 1-2 tàu chắn, chừa ít nhất 1 làn
        const free = L[Math.floor(Math.random() * 3)];
        L.filter((l) => l !== free && Math.random() < 0.75).forEach((l) => objs.push({ type: 'train', lane: l, z, len: rnd(14, 26) }));
        objs.push(...Array.from({ length: 6 }, (_, i) => ({ type: 'coin', lane: free, z: z + i * 2.2, y: 0.8 })));
      } else if (r < 0.7) {
        const l = L[Math.floor(Math.random() * 3)], type = Math.random() < 0.55 ? 'low' : 'high';
        objs.push({ type, lane: l, z });
        if (Math.random() < 0.5) { const l2 = L.filter((q) => q !== l)[Math.floor(Math.random() * 2)]; objs.push({ type: type === 'low' ? 'high' : 'low', lane: l2, z: z + 0.1 }); }
        if (type === 'low') objs.push(...Array.from({ length: 5 }, (_, i) => ({ type: 'coin', lane: l, z: z - 4 + i * 2, y: 0.8 + Math.sin(i / 4 * Math.PI) * 2.4 })));
      } else {
        const l = L[Math.floor(Math.random() * 3)];
        objs.push({ type: 'low', lane: l, z }, { type: 'high', lane: l, z: z + 12 });
      }
      if (Math.random() < 0.08) objs.push({ type: 'magnet', lane: L[Math.floor(Math.random() * 3)], z: z + 20, y: 1 });
    }
    const game = {
      VW: 1280, VH, wide: true, over: false, res: null,
      how: ['<b>Vuốt trái / phải</b> (hoặc ← →) để đổi làn ray', '<b>Vuốt lên</b> (↑ / Space) để nhảy qua rào thấp 🚧', '<b>Vuốt xuống</b> (↓) để lăn dưới rào cao 🚦 · đâm vào tàu là thua', 'Nhặt 🪙 xu và 🧲 nam châm hút xu · chạy càng xa càng nhanh'],
      start() { for (let z = 14; z < 110; z += 2.2) if (z < 40) objs.push({ type: 'coin', lane: 0, z, y: 0.8 }); },
      update(dt) {
        t += dt;
        if (over) { deathT += dt; if (deathT > 1.2) { game.over = true; game.res = { score: Math.floor(dist) + coins * 10, coins, dist: Math.floor(dist) }; } return; }
        speed = Math.min(34, 14 + t * 0.25);
        dist += speed * dt; me.t += dt; me.magnet = Math.max(0, me.magnet - dt); msg = Math.max(0, msg - dt);
        me.x += (me.lane * LANE - me.x) * Math.min(1, dt * 14);
        if (me.y > 0 || me.vy > 0) { me.vy -= 38 * dt; me.y = Math.max(0, me.y + me.vy * dt); if (me.y === 0) me.vy = 0; }
        me.roll = Math.max(0, me.roll - dt);
        if ((nextObs -= speed * dt) <= 0) { nextObs = rnd(26, 40) + speed * 0.4; lanePattern(); }
        if ((nextCoin -= speed * dt) <= 0) { nextCoin = rnd(30, 60); const l = [-1, 0, 1][Math.floor(Math.random() * 3)]; if (!objs.some((o) => o.lane === l && o.z > 100 && o.type !== 'coin')) for (let i = 0; i < 6; i++) objs.push({ type: 'coin', lane: l, z: 120 + i * 2.2, y: 0.8 }); }
        for (const o of objs) o.z -= speed * dt;
        for (let i = objs.length - 1; i >= 0; i--) {
          const o = objs[i], laneHit = Math.abs(o.lane * LANE - me.x) < 1.2;
          if (o.type === 'coin') {
            if (me.magnet > 0 && o.z < 14 && o.z > -1) { o.lane += (me.x / LANE - o.lane) * Math.min(1, dt * 8); o.y += (me.y + 1 - o.y) * Math.min(1, dt * 8); }
            if (o.z < 0.8 && o.z > -0.8 && (laneHit || me.magnet > 0 && Math.abs(o.lane * LANE - me.x) < 2) && Math.abs((o.y || 0.8) - (me.y + 1)) < 1.8) { objs.splice(i, 1); coins++; continue; }
          } else if (o.type === 'magnet') {
            if (o.z < 0.8 && o.z > -0.8 && laneHit) { objs.splice(i, 1); me.magnet = 10; msg = 1.5; fx.push({ text: '🧲 Nam châm hút xu!', t: 0 }); continue; }
          } else if (laneHit) {
            const len = o.type === 'train' ? o.len : 0.6;
            if (o.z < 0.5 && o.z + len > -0.5) {
              const ok = (o.type === 'low' && me.y > 1.1) || (o.type === 'high' && me.roll > 0 && me.y < 0.8);
              if (!ok) { over = true; fx.push({ text: o.type === 'train' ? '💥 Đâm tàu rồi!' : '💥 Vấp rào!', t: 0 }); if (navigator.vibrate) try { navigator.vibrate(120); } catch (e) { /* bỏ qua */ } return; }
            }
          }
          if (o.z + (o.len || 0) < -6) objs.splice(i, 1);
        }
        fx.forEach((f) => { f.t += dt; }); while (fx.length && fx[0].t > 1.4) fx.shift();
      },
      act(a) {
        if (over) return;
        if (a === 'L') me.lane = Math.max(-1, me.lane - 1);
        if (a === 'R') me.lane = Math.min(1, me.lane + 1);
        if (a === 'U' && me.y < 0.05) { me.vy = 13.5; me.roll = 0; }
        if (a === 'D') { me.roll = 0.75; if (me.y > 0) me.vy = -22; }
      },
      down(p) { swipe = { x: p.x, y: p.y, done: false }; },
      move(p) {
        if (!swipe || swipe.done) return;
        const dx = p.x - swipe.x, dy = p.y - swipe.y;
        if (Math.hypot(dx, dy) < 40) return;
        swipe.done = true; game.act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy < 0 ? 'U' : 'D'));
      },
      up(p) {
        // chạm nhanh không vuốt: nửa trái / phải màn hình = đổi làn
        if (swipe && !swipe.done && Math.hypot(p.x - swipe.x, p.y - swipe.y) < 40) game.act(p.x < game.VW / 2 ? 'L' : 'R');
        swipe = null;
      },
      key(k, on) { if (!on) return; if (k === 'ArrowLeft' || k === 'a') game.act('L'); if (k === 'ArrowRight' || k === 'd') game.act('R'); if (k === 'ArrowUp' || k === 'w' || k === ' ') game.act('U'); if (k === 'ArrowDown' || k === 's') game.act('D'); },
      draw(g) {
        const W = game.VW;
        // trời + phố
        const sk = g.createLinearGradient(0, 0, 0, VH * 0.4); sk.addColorStop(0, '#74c0fc'); sk.addColorStop(1, '#d0ebff'); g.fillStyle = sk; g.fillRect(0, 0, W, VH);
        const hz = P(0, 0, 130, W).y;
        // nhà hai bên (dải màu chạy về chân trời)
        for (const side of [-1, 1]) {
          for (let i = 0; i < 16; i++) {
            const z0 = ((i * 9 - dist) % 144 + 144) % 144, z1 = z0 + 8; if (z0 > 130) continue;
            const a = P(side * 7, 0, z0, W), b = P(side * 7, 0, z1, W), h = 6 + (i * 37) % 7;
            const at = P(side * 7, h, z0, W), bt = P(side * 7, h, z1, W);
            g.fillStyle = ['#ffa8a8', '#ffd8a8', '#b197fc', '#91a7ff', '#63e6be', '#ffe066'][i % 6];
            g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(bt.x, bt.y); g.lineTo(at.x, at.y); g.closePath(); g.fill();
            g.fillStyle = 'rgba(0,0,0,.12)'; g.fill();
            g.fillStyle = 'rgba(255,255,255,.55)'; for (let wy = 1.5; wy < h - 1; wy += 2.2) { const w1 = P(side * 7, wy, z0 + 2, W), w2 = P(side * 7, wy + 1, z0 + 5, W); g.fillRect(Math.min(w1.x, w2.x), Math.min(w1.y, w2.y), Math.abs(w2.x - w1.x), Math.abs(w2.y - w1.y)); }
          }
        }
        // nền sỏi + 3 làn ray
        const gr = g.createLinearGradient(0, hz, 0, VH); gr.addColorStop(0, '#c9a86a'); gr.addColorStop(1, '#a9824a'); g.fillStyle = gr;
        const l0 = P(-5, 0, 130, W), l1 = P(5, 0, 130, W), r0 = P(-5, 0, -3, W), r1 = P(5, 0, -3, W);
        g.beginPath(); g.moveTo(l0.x, l0.y); g.lineTo(l1.x, l1.y); g.lineTo(r1.x, r1.y); g.lineTo(r0.x, r0.y); g.closePath(); g.fill();
        g.fillStyle = '#7a5530';
        for (let z = -(dist % 1.6); z < 130; z += 1.6) { const a = P(-4.2, 0, z, W), b = P(4.2, 0, z, W), h = Math.max(1.5, 0.18 * a.k); g.fillRect(a.x, a.y - h / 2, b.x - a.x, h); }
        g.strokeStyle = '#ced4da'; for (const l of [-1, 0, 1]) for (const s of [-0.6, 0.6]) { const a = P(l * LANE + s, 0.05, 130, W), b = P(l * LANE + s, 0.05, -3, W); g.lineWidth = 4; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
        // vật cản / xu: vẽ xa trước
        objs.slice().sort((a, b) => b.z - a.z).forEach((o) => { if (o.z > 125 || o.z < -4) return; drawObj(g, o, W); });
        // người chơi trên ván trượt
        const pb = P(me.x, me.y, 0, W), sc = pb.k / 95;
        g.fillStyle = 'rgba(0,0,0,.25)'; const sh = P(me.x, 0, 0, W); g.beginPath(); g.ellipse(sh.x, sh.y, 34 * sc, 10 * sc, 0, 0, Math.PI * 2); g.fill();
        g.save(); g.translate(pb.x, pb.y);
        if (me.roll > 0 && me.y < 0.8) { g.scale(1, 0.55); g.rotate(Math.sin(me.t * 20) * 0.3); }
        g.fillStyle = '#f03e3e'; rr(g, -42 * sc, -8 * sc, 84 * sc, 14 * sc, 7 * sc); g.fill(); g.fillStyle = '#ffd43b'; g.fillRect(-30 * sc, -6 * sc, 60 * sc, 4 * sc);
        try { ART.character(g, 0, -8 * sc, S().look || {}, { dir: 1, t: me.t, moving: me.y === 0 && me.roll <= 0, scale: 1.35 * sc }); } catch (e) { g.fillStyle = '#4dabf7'; rr(g, -18 * sc, -90 * sc, 36 * sc, 80 * sc, 12 * sc); g.fill(); }
        g.restore();
        if (me.magnet > 0) { g.strokeStyle = `rgba(255,107,107,${0.4 + 0.3 * Math.sin(t * 10)})`; g.lineWidth = 4; g.beginPath(); g.arc(pb.x, pb.y - 60 * sc, 90 * sc, 0, Math.PI * 2); g.stroke(); }
        // HUD
        g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 12, 12, 210, 44, 22); g.fill(); txt(g, `🪙 ${coins}`, 30, 34, 22, '#ffe066', 'left');
        g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, W - 232, 12, 220, 44, 22); g.fill(); txt(g, `🏃 ${fmt(Math.floor(dist))} m`, W - 24, 34, 22, '#fff', 'right');
        if (me.magnet > 0) txt(g, `🧲 ${Math.ceil(me.magnet)}s`, W / 2, 34, 20, '#ffc9c9');
        if (t < 4) txt(g, '👆 Vuốt ← → đổi làn · vuốt ↑ nhảy · vuốt ↓ lăn', W / 2, VH * 0.2, 24);
        fx.forEach((f) => { g.globalAlpha = Math.max(0, 1 - f.t / 1.4); txt(g, f.text, W / 2, VH * 0.3 - f.t * 30, 36, '#ffe066'); g.globalAlpha = 1; });
      },
    };
    function drawObj(g, o, W) {
      const x = o.lane * LANE;
      if (o.type === 'coin' || o.type === 'magnet') {
        const p = P(x, o.y || 0.8, o.z, W), r = 0.42 * p.k, s = Math.abs(Math.cos(t * 5 + o.z));
        if (o.type === 'magnet') { txt(g, '🧲', p.x, p.y, r * 2.4, '#fff', 'center', false); return; }
        g.fillStyle = '#fcc419'; g.strokeStyle = '#e67700'; g.lineWidth = Math.max(1.5, r * 0.15); g.beginPath(); g.ellipse(p.x, p.y, Math.max(1, r * s), r, 0, 0, Math.PI * 2); g.fill(); g.stroke();
        if (s > 0.5) { g.fillStyle = '#e67700'; g.font = FONT(r); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', p.x, p.y + 1); }
        return;
      }
      if (o.type === 'train') {
        const z0 = Math.max(-2, o.z), z1 = o.z + o.len, w = 1.15, h = 3.6;
        const fbl = P(x - w, 0, z0, W), fbr = P(x + w, 0, z0, W), ftl = P(x - w, h, z0, W), ftr = P(x + w, h, z0, W), btl = P(x - w, h, z1, W), btr = P(x + w, h, z1, W), bbl = P(x - w, 0, z1, W), bbr = P(x + w, 0, z1, W);
        g.fillStyle = '#1971c2'; // hông tàu
        if (x <= 0) { g.beginPath(); g.moveTo(fbr.x, fbr.y); g.lineTo(bbr.x, bbr.y); g.lineTo(btr.x, btr.y); g.lineTo(ftr.x, ftr.y); g.closePath(); g.fill(); }
        if (x >= 0) { g.beginPath(); g.moveTo(fbl.x, fbl.y); g.lineTo(bbl.x, bbl.y); g.lineTo(btl.x, btl.y); g.lineTo(ftl.x, ftl.y); g.closePath(); g.fill(); }
        g.fillStyle = '#a5d8ff'; g.beginPath(); g.moveTo(ftl.x, ftl.y); g.lineTo(ftr.x, ftr.y); g.lineTo(btr.x, btr.y); g.lineTo(btl.x, btl.y); g.closePath(); g.fill(); // nóc
        g.fillStyle = '#e8590c'; g.fillRect(ftl.x, ftl.y, fbr.x - ftl.x, fbr.y - ftl.y); // đầu tàu
        const k = fbr.x - ftl.x, hh = fbr.y - ftl.y;
        g.fillStyle = '#d0ebff'; g.fillRect(ftl.x + k * 0.12, ftl.y + hh * 0.14, k * 0.76, hh * 0.32);
        g.fillStyle = '#fff3bf'; g.beginPath(); g.arc(ftl.x + k * 0.2, ftl.y + hh * 0.72, k * 0.07, 0, Math.PI * 2); g.arc(ftl.x + k * 0.8, ftl.y + hh * 0.72, k * 0.07, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#212529'; g.fillRect(ftl.x, ftl.y + hh * 0.9, k, hh * 0.1);
        return;
      }
      // rào chắn sọc đỏ trắng (thấp: nhảy qua · cao: lăn dưới)
      const w = 1.2, y0 = o.type === 'low' ? 0.5 : 1.9, y1 = o.type === 'low' ? 1.4 : 3.1;
      const a = P(x - w, y1, o.z, W), b = P(x + w, y0, o.z, W), base = P(x, 0, o.z, W);
      g.fillStyle = '#495057'; const pw = Math.max(2, 0.12 * a.k); g.fillRect(a.x, a.y, pw, base.y - a.y); g.fillRect(b.x - pw, a.y, pw, base.y - a.y);
      const bw = b.x - a.x, bh = b.y - a.y;
      g.fillStyle = '#fff'; g.fillRect(a.x, a.y, bw, bh);
      g.save(); g.beginPath(); g.rect(a.x, a.y, bw, bh); g.clip(); g.fillStyle = '#e03131';
      for (let i = -2; i < 8; i++) { g.beginPath(); g.moveTo(a.x + i * bw / 5, a.y + bh); g.lineTo(a.x + i * bw / 5 + bw / 10, a.y + bh); g.lineTo(a.x + i * bw / 5 + bw / 10 + bh, a.y); g.lineTo(a.x + i * bw / 5 + bh, a.y); g.fill(); }
      g.restore(); g.strokeStyle = '#343a40'; g.lineWidth = Math.max(1.5, 0.05 * a.k); g.strokeRect(a.x, a.y, bw, bh);
    }
    return game;
  }

  /* ======================================================================
   * 🏹 BẮN CUNG: giữ ngón tay để giương cung, kéo để ngắm (tay hơi rung, giữ lâu quá thì rung mạnh),
   * buông tay để bắn. Mỗi mũi tên bia lùi xa hơn và gió đổi hướng — nhớ ngắm bù gió.
   * ==================================================================== */
  function makeArchery() {
    const VH = 720, N = 10;
    let t = 0, arrow = 0, score = 0, phase = 'ready', wait = 0, hold = 0, bulls = 0;
    const aim = { x: 0, y: 0, on: false, sx: 0, sy: 0, ax: 0, ay: 0 };
    const hits = [], fx = [];
    let dist = 20, wind = 0, fly = null, kx = 0, ky = 0;
    const R0 = 230; // bán kính bia (px) ở 20 m
    const rad = () => R0 * 20 / dist;
    function setup() { dist = 20 + arrow * 6; wind = arrow === 0 ? 0 : Math.round((Math.random() * 2 - 1) * Math.min(6, 1 + arrow * 0.7) * 10) / 10; hits.length = 0; }
    setup();
    const sway = () => { const s = 6 + Math.max(0, hold - 2.2) * 26; return { x: Math.sin(t * 1.7) * s + Math.sin(t * 3.1) * s * 0.4, y: Math.cos(t * 1.3) * s * 0.8 + Math.sin(t * 2.6) * s * 0.3 }; };
    function shoot() {
      const W = game.VW, cx = W / 2, cy = VH * 0.45, sw = sway();
      const px = aim.x + sw.x, py = aim.y + sw.y;
      // gió đẩy ngang, đi càng xa trôi càng nhiều; mũi tên rơi một chút theo khoảng cách
      const dx = wind * dist * 0.22 * rad() / 100, dy = dist * 0.12 * rad() / 100;
      fly = { t: 0, T: 0.35 + dist / 160, x: px + dx, y: py + dy, sx: W / 2, sy: VH + 40 };
      phase = 'fly'; aim.on = false; hold = 0;
      void cx; void cy;
    }
    function land() {
      const W = game.VW, cx = W / 2, cy = VH * 0.45, r = rad();
      const d = Math.hypot(fly.x - cx, fly.y - cy) / r;
      const pts = d <= 0.05 ? 10 : d > 1 ? 0 : Math.max(1, 10 - Math.floor(d * 10));
      const X = d <= 0.05;
      score += pts; if (X) bulls++;
      hits.push({ x: (fly.x - cx) / r, y: (fly.y - cy) / r });
      fx.push({ text: X ? '🎯 HỒNG TÂM!' : pts ? `+${pts}` : '❌ Trượt bia', c: X ? '#ffe066' : pts >= 8 ? '#8ce99a' : '#fff', t: 0, x: fly.x, y: fly.y - 40 });
      if (navigator.vibrate) try { navigator.vibrate(X ? 60 : 20); } catch (e) { /* bỏ qua */ }
      fly = null; phase = 'hit'; wait = 1.3; arrow++;
    }
    const game = {
      VW: 1280, VH, wide: true, over: false, res: null,
      how: ['<b>Giữ ngón tay</b> để giương cung, <b>kéo</b> để ngắm, <b>buông tay</b> để bắn', 'Tay sẽ rung nhẹ — giữ quá 2 giây là rung mạnh, bắn nhanh cho chuẩn', 'Mỗi mũi bia <b>lùi xa hơn</b>, có <b>gió</b> đẩy lệch: gió thổi sang phải thì ngắm lệch trái', '10 mũi tên · hồng tâm 10 điểm'],
      update(dt) {
        t += dt;
        if (aim.on) hold += dt;
        if (fly) { fly.t += dt; if (fly.t >= fly.T) land(); }
        if (phase === 'hit' && (wait -= dt) <= 0) {
          if (arrow >= N) { game.over = true; game.res = { score, extra: `${N} mũi tên · ${bulls} lần trúng hồng tâm 🎯` }; return; }
          setup(); phase = 'ready';
        }
        fx.forEach((f) => { f.t += dt; }); while (fx.length && fx[0].t > 1.3) fx.shift();
      },
      down(p) { if (phase !== 'ready') return; const W = game.VW; aim.on = true; hold = 0; aim.sx = p.x; aim.sy = p.y; aim.ax = aim.x = W / 2; aim.ay = aim.y = VH * 0.45; },
      move(p) { if (!aim.on) return; aim.x = clamp(aim.ax + (p.x - aim.sx) * 0.8, 40, game.VW - 40); aim.y = clamp(aim.ay + (p.y - aim.sy) * 0.8, 40, VH - 40); },
      up() { if (aim.on && phase === 'ready') shoot(); },
      key(k, on) {
        const W = game.VW;
        if (k === ' ' || k === 'Enter') { if (on && phase === 'ready' && !aim.on) { aim.on = true; hold = 0; aim.x = W / 2 + kx; aim.y = VH * 0.45 + ky; } else if (!on && aim.on) shoot(); return; }
        if (!on) return;
        if (k === 'ArrowLeft' || k === 'a') kx -= 12; if (k === 'ArrowRight' || k === 'd') kx += 12; if (k === 'ArrowUp' || k === 'w') ky -= 12; if (k === 'ArrowDown' || k === 's') ky += 12;
        if (aim.on) { aim.x = W / 2 + kx; aim.y = VH * 0.45 + ky; }
      },
      draw(g) {
        const W = game.VW, cx = W / 2, cy = VH * 0.45, r = rad();
        const sk = g.createLinearGradient(0, 0, 0, VH * 0.6); sk.addColorStop(0, '#74c0fc'); sk.addColorStop(1, '#e7f5ff'); g.fillStyle = sk; g.fillRect(0, 0, W, VH);
        g.fillStyle = '#8ce99a'; g.beginPath(); g.moveTo(0, VH * 0.58); for (let x = 0; x <= W; x += 60) g.lineTo(x, VH * 0.5 - Math.abs(Math.sin(x * 0.004)) * 70); g.lineTo(W, VH * 0.58); g.fill();
        const gr = g.createLinearGradient(0, VH * 0.55, 0, VH); gr.addColorStop(0, '#69db7c'); gr.addColorStop(1, '#2f9e44'); g.fillStyle = gr; g.fillRect(0, VH * 0.55, W, VH * 0.45);
        // cờ gió
        for (const fxp of [W * 0.12, W * 0.88]) { g.strokeStyle = '#495057'; g.lineWidth = 4; g.beginPath(); g.moveTo(fxp, VH * 0.62); g.lineTo(fxp, VH * 0.36); g.stroke(); const wv = Math.sin(t * 8) * 4; g.fillStyle = '#ff6b6b'; g.beginPath(); g.moveTo(fxp, VH * 0.36); g.lineTo(fxp + wind * 14 + (wind ? wv : 0), VH * 0.38 + (wind ? 0 : 30)); g.lineTo(fxp, VH * 0.41); g.fill(); }
        // giá + bia
        g.strokeStyle = '#8a5a32'; g.lineWidth = Math.max(4, r * 0.06); g.beginPath(); g.moveTo(cx - r * 0.6, cy + r * 1.6); g.lineTo(cx, cy); g.lineTo(cx + r * 0.6, cy + r * 1.6); g.stroke();
        g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(cx, cy + r * 1.6, r * 0.9, r * 0.12, 0, 0, Math.PI * 2); g.fill();
        const RING = ['#f8f9fa', '#f8f9fa', '#343a40', '#343a40', '#4dabf7', '#4dabf7', '#ff6b6b', '#ff6b6b', '#ffd43b', '#ffd43b'];
        for (let i = 0; i < 10; i++) { g.fillStyle = RING[i]; g.beginPath(); g.arc(cx, cy, r * (1 - i / 10), 0, Math.PI * 2); g.fill(); g.strokeStyle = i === 2 || i === 3 ? '#adb5bd' : 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.stroke(); }
        g.strokeStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.moveTo(cx - 6, cy); g.lineTo(cx + 6, cy); g.moveTo(cx, cy - 6); g.lineTo(cx, cy + 6); g.stroke();
        // mũi tên đã cắm
        hits.forEach((h) => { const x = cx + h.x * r, y = cy + h.y * r; g.fillStyle = '#212529'; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#8a5a32'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14, y + 22); g.stroke(); g.fillStyle = '#e64980'; g.beginPath(); g.moveTo(x + 14, y + 22); g.lineTo(x + 24, y + 26); g.lineTo(x + 18, y + 34); g.closePath(); g.fill(); });
        // mũi tên đang bay
        if (fly) { const k = fly.t / fly.T, e = 1 - Math.pow(1 - k, 2), x = fly.sx + (fly.x - fly.sx) * e, y = fly.sy + (fly.y - fly.sy) * e - Math.sin(k * Math.PI) * 60, s = 1 - k * 0.8; g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = '#8a5a32'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 90); g.stroke(); g.fillStyle = '#495057'; g.beginPath(); g.moveTo(0, -14); g.lineTo(-7, 2); g.lineTo(7, 2); g.fill(); g.restore(); }
        // tâm ngắm + cung
        if (aim.on) {
          const sw = sway(), x = aim.x + sw.x, y = aim.y + sw.y, shake = hold > 2.2;
          g.strokeStyle = shake ? '#ff6b6b' : '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 26, 0, Math.PI * 2); g.moveTo(x - 40, y); g.lineTo(x - 12, y); g.moveTo(x + 12, y); g.lineTo(x + 40, y); g.moveTo(x, y - 40); g.lineTo(x, y - 12); g.moveTo(x, y + 12); g.lineTo(x, y + 40); g.stroke();
          g.fillStyle = shake ? '#ff6b6b' : '#fff'; g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
          // cây cung phía dưới
          g.strokeStyle = '#7a4a1e'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.arc(W / 2 + (x - W / 2) * 0.15, VH + 120, 260, Math.PI * 1.25, Math.PI * 1.75); g.stroke();
          const bx = W / 2 + (x - W / 2) * 0.15; g.strokeStyle = '#f1f3f5'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx - 184, VH + 120 - 184); g.lineTo(bx, VH - 30 + Math.min(1, hold) * 60); g.lineTo(bx + 184, VH + 120 - 184); g.stroke();
          if (shake) txt(g, '😮‍💨 Tay mỏi rồi — bắn đi!', W / 2, VH * 0.86, 20, '#ffc9c9');
        }
        fx.forEach((f) => { g.globalAlpha = Math.max(0, 1 - f.t / 1.3); txt(g, f.text, f.x, f.y - f.t * 40, 32, f.c); g.globalAlpha = 1; });
        // HUD
        g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, 12, 12, 230, 44, 22); g.fill(); txt(g, `⭐ ${score}`, 30, 34, 22, '#ffe066', 'left');
        g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, W - 262, 12, 250, 44, 22); g.fill(); txt(g, `🏹 ${Math.min(arrow + 1, N)}/${N} · ${dist} m`, W - 26, 34, 20, '#fff', 'right');
        g.fillStyle = 'rgba(0,0,0,.35)'; rr(g, W / 2 - 110, 12, 220, 44, 22); g.fill();
        txt(g, wind === 0 ? '🍃 Lặng gió' : `🍃 Gió ${Math.abs(wind)} ${wind > 0 ? '→' : '←'}`, W / 2, 34, 20, wind === 0 ? '#fff' : Math.abs(wind) > 3 ? '#ffa8a8' : '#d3f9d8');
        if (phase === 'ready' && !aim.on) txt(g, arrow === 0 ? '👆 Giữ ngón tay để giương cung · kéo để ngắm · buông tay để bắn' : '👆 Giữ để giương cung', W / 2, VH * 0.9, 22);
      },
    };
    return game;
  }

  /* ======================================================================
   * 🍬 XẾP KẸO (kiểu Candy Crush): đổi chỗ 2 viên kẹo cạnh nhau để có hàng 3 viên cùng màu.
   * 4 viên → kẹo sọc (nổ cả hàng/cột) · 5 viên → kẹo cầu vồng (đổi với viên nào là nổ hết màu đó). 25 lượt.
   * ==================================================================== */
  const CANDY = [
    { c: '#ff6b6b', d: '#c92a2a', s: 'heart' }, { c: '#ffd43b', d: '#e67700', s: 'star' }, { c: '#69db7c', d: '#2b8a3e', s: 'square' },
    { c: '#4dabf7', d: '#1864ab', s: 'drop' }, { c: '#b197fc', d: '#5f3dc4', s: 'diamond' }, { c: '#ffa94d', d: '#d9480f', s: 'circle' },
  ];
  /** 30 màn: đạt điểm · thu thập kẹo · xoá thạch (thạch 2 lớp từ màn 16) — 6 màn đầu 5 màu kẹo, sau đó 6 màu */
  const JELLY = {
    center: (r, c) => r >= 2 && r <= 5 && c >= 2 && c <= 5,
    rows: (r) => r === 3 || r === 4,
    cols: (r, c) => c === 1 || c === 6,
    border: (r, c) => r === 0 || c === 0 || r === 7 || c === 7,
    x: (r, c) => r === c || r + c === 7,
    bottom: (r) => r >= 5,
  };
  const CANDY_NAMES = ['tim đỏ', 'sao vàng', 'vuông xanh lá', 'giọt nước', 'kim cương tím', 'tròn cam'];
  const CANDY_LV = Array.from({ length: 30 }, (_, i) => {
    const goal = i < 2 ? 'score' : ['collect', 'jelly', 'score'][(i + 1) % 3], colors = i < 6 ? 5 : 6;
    const L = { goal, colors };
    if (goal === 'score') { L.moves = 18 + (i % 3) * 2; L.t1 = Math.round((1100 + i * 90) / 100) * 100; }
    if (goal === 'collect') { L.moves = 18 + (i % 4); L.k = i % colors; L.n = 9 + Math.round(i * 0.5); L.t1 = 600 + i * 30; }
    if (goal === 'jelly') {
      const pats = Object.keys(JELLY), p = pats[Math.floor(i / 3) % pats.length];
      const cells = Array.from({ length: 64 }, (_, q) => JELLY[p](q >> 3, q & 7)).filter(Boolean).length;
      L.pat = p; L.layers = i >= 15 ? 2 : 1; L.moves = 18 + Math.ceil(cells * L.layers / 3.5); L.t1 = 600 + i * 30;
    }
    L.t2 = Math.round(L.t1 * 1.7 / 100) * 100; L.t3 = Math.round(L.t1 * 2.5 / 100) * 100;
    return L;
  });
  function makeCandy(lv) {
    const VH = 720, N = 8, LVI = Math.max(0, Math.min(CANDY_LV.length - 1, lv | 0)), L = CANDY_LV[LVI], MOVES = L.moves;
    let grid = [], moves = MOVES, score = 0, t = 0, busy = 0, combo = 0, sel = null, drag = null, hint = 0, idle = 0, cascades = 0, maxCombo = 0, got = 0, ending = 0;
    const fx = [], parts = [];
    const jelly = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (L.goal === 'jelly' && JELLY[L.pat](r, c) ? L.layers : 0)));
    const jellyLeft = () => jelly.reduce((a, row) => a + row.reduce((b, v) => b + v, 0), 0), JELLY0 = jellyLeft();
    const goalDone = () => (L.goal === 'collect' ? got >= L.n : L.goal === 'jelly' ? jellyLeft() === 0 : score >= L.t1);
    const starsOf = () => (!goalDone() || score < L.t1 ? 0 : score >= L.t3 ? 3 : score >= L.t2 ? 2 : 1);
    const cellOf = () => { const W = game.VW, size = Math.min((VH - 150) / N, (W - 40) / N), ox = (W - size * N) / 2, oy = 120; return { size, ox, oy }; };
    const rndT = () => Math.floor(Math.random() * L.colors);
    function at(r, c) { return r >= 0 && r < N && c >= 0 && c < N ? grid[r][c] : null; }
    function fill() {
      grid = [];
      for (let r = 0; r < N; r++) { grid.push([]); for (let c = 0; c < N; c++) { let k; do { k = rndT(); } while ((c >= 2 && grid[r][c - 1].k === k && grid[r][c - 2].k === k) || (r >= 2 && grid[r - 1][c].k === k && grid[r - 2][c].k === k)); grid[r].push({ k, sp: null, y: r - N - 2, x: c, pop: 0 }); } }
      if (!hasMove()) fill();
    }
    /** tìm các nhóm ≥3 viên liên tiếp cùng màu */
    function findRuns() {
      const runs = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N;) { const k = grid[r][c] && grid[r][c].k; let e = c; while (e + 1 < N && grid[r][e + 1] && k != null && k >= 0 && grid[r][e + 1].k === k) e++; if (e - c + 1 >= 3) runs.push({ cells: Array.from({ length: e - c + 1 }, (_, i) => [r, c + i]), dir: 'h' }); c = e + 1; }
      for (let c = 0; c < N; c++) for (let r = 0; r < N;) { const k = grid[r][c] && grid[r][c].k; let e = r; while (e + 1 < N && grid[e + 1][c] && k != null && k >= 0 && grid[e + 1][c].k === k) e++; if (e - r + 1 >= 3) runs.push({ cells: Array.from({ length: e - r + 1 }, (_, i) => [r + i, c]), dir: 'v' }); r = e + 1; }
      return runs;
    }
    function swapCells(a, b) { const tmp = grid[a[0]][a[1]]; grid[a[0]][a[1]] = grid[b[0]][b[1]]; grid[b[0]][b[1]] = tmp; }
    function hasMove() {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const r2 = r + dr, c2 = c + dc; if (r2 >= N || c2 >= N) continue;
        if (grid[r][c].sp === 'bomb' || grid[r2][c2].sp === 'bomb') return [[r, c], [r2, c2]];
        swapCells([r, c], [r2, c2]); const ok = findRuns().length > 0; swapCells([r, c], [r2, c2]);
        if (ok) return [[r, c], [r2, c2]];
      }
      return null;
    }
    function burst(r, c, col) { const { size, ox, oy } = cellOf(); for (let i = 0; i < 6; i++) parts.push({ x: ox + (c + 0.5) * size, y: oy + (r + 0.5) * size, vx: rnd(-220, 220), vy: rnd(-260, 80), c: col, t: 0 }); }
    /** xoá các ô (kèm hiệu ứng kẹo đặc biệt), trả về số viên đã xoá */
    function clearCells(list) {
      const seen = new Set(), q = list.slice();
      let n = 0;
      while (q.length) {
        const [r, c] = q.shift(), key = r * N + c, it = at(r, c);
        if (!it || seen.has(key)) continue; seen.add(key);
        if (it.sp === 'h') for (let cc = 0; cc < N; cc++) q.push([r, cc]);
        if (it.sp === 'v') for (let rr2 = 0; rr2 < N; rr2++) q.push([rr2, c]);
        if (it.sp === 'bomb') { const k = it.bk != null ? it.bk : rndT(); for (let r2 = 0; r2 < N; r2++) for (let c2 = 0; c2 < N; c2++) if (grid[r2][c2] && grid[r2][c2].k === k) q.push([r2, c2]); }
        burst(r, c, it.k >= 0 ? CANDY[it.k].c : '#fff'); grid[r][c] = null; n++;
        if (jelly[r][c] > 0) { jelly[r][c]--; score += 30; }
        if (L.goal === 'collect' && it.k === L.k) got++;
      }
      return n;
    }
    function resolve(swapped) {
      const runs = findRuns();
      if (!runs.length) return false;
      combo++; cascades++; maxCombo = Math.max(maxCombo, combo);
      const toClear = [], specials = [];
      runs.forEach((run) => {
        run.cells.forEach((p) => toClear.push(p));
        if (run.cells.length >= 4) {
          // kẹo đặc biệt sinh ra ở chỗ vừa đổi (nếu nằm trong nhóm), không thì ở giữa nhóm
          const pos = (swapped && run.cells.find((p) => swapped.some((s) => s[0] === p[0] && s[1] === p[1]))) || run.cells[Math.floor(run.cells.length / 2)];
          const k = grid[pos[0]][pos[1]].k;
          specials.push({ pos, k, sp: run.cells.length >= 5 ? 'bomb' : run.dir === 'h' ? 'v' : 'h' });
        }
      });
      const keep = new Set(specials.map((s) => s.pos[0] * N + s.pos[1]));
      const n = clearCells(toClear.filter((p) => !keep.has(p[0] * N + p[1])));
      specials.forEach((s) => { grid[s.pos[0]][s.pos[1]] = { k: s.sp === 'bomb' ? -1 : s.k, sp: s.sp, y: s.pos[0], x: s.pos[1], pop: 0.3 }; });
      const pts = (n + specials.length) * 20 * Math.min(6, combo);
      score += pts;
      const { size, ox, oy } = cellOf(), p0 = runs[0].cells[0];
      fx.push({ text: `+${pts}${combo > 1 ? ' ×' + Math.min(6, combo) : ''}`, x: ox + (p0[1] + 0.5) * size, y: oy + (p0[0] + 0.5) * size, c: combo > 2 ? '#ffe066' : '#fff', t: 0 });
      if (combo === 3) fx.push({ text: '🍬 Ngon!', big: 1, t: 0, c: '#ff8787' }); else if (combo === 4) fx.push({ text: '🌟 Tuyệt vời!', big: 1, t: 0, c: '#ffe066' }); else if (combo >= 5) fx.push({ text: '🔥 Siêu đỉnh!', big: 1, t: 0, c: '#ff922b' });
      drop();
      return true;
    }
    function drop() {
      for (let c = 0; c < N; c++) {
        let w = N - 1;
        for (let r = N - 1; r >= 0; r--) if (grid[r][c]) { const it = grid[r][c]; grid[r][c] = null; grid[w][c] = it; w--; }
        for (let r = w, k = 0; r >= 0; r--, k++) grid[r][c] = { k: rndT(), sp: null, y: -1 - k, x: c, pop: 0 };
      }
      busy = 0.35;
    }
    function trySwap(a, b) {
      if (busy > 0 || moves <= 0) return;
      const A = at(...a), B = at(...b); if (!A || !B) return;
      sel = null; idle = 0;
      // kẹo cầu vồng: đổi với viên nào thì nổ hết màu đó
      if (A.sp === 'bomb' || B.sp === 'bomb') {
        moves--; combo = 0;
        const bomb = A.sp === 'bomb' ? a : b, other = A.sp === 'bomb' ? B : A;
        grid[bomb[0]][bomb[1]].bk = other.sp === 'bomb' ? null : other.k;
        const n = clearCells([bomb]); score += n * 30; fx.push({ text: '🌈 BÙM!', big: 1, t: 0, c: '#ffe066' }); fx.push({ text: `+${n * 30}`, t: 0, c: '#fff', x: game.VW / 2, y: VH / 2 });
        drop(); return;
      }
      swapCells(a, b); A.anim = { from: a, t: 0 }; B.anim = { from: b, t: 0 };
      combo = 0;
      if (findRuns().length) { moves--; busy = 0.18; pendingSwap = [a, b]; }
      else { swapCells(a, b); A.anim = null; B.anim = null; A.shake = 0.3; B.shake = 0.3; }
    }
    let pendingSwap = null;
    const goalText = () => (L.goal === 'collect' ? `thu ${Math.min(got, L.n)}/${L.n} kẹo ${CANDY_NAMES[L.k]}` : L.goal === 'jelly' ? `xoá ${JELLY0 - jellyLeft()}/${JELLY0} thạch` : `mục tiêu ${fmt(L.t1)} điểm`);
    const cellAt = (p) => { const { size, ox, oy } = cellOf(); const c = Math.floor((p.x - ox) / size), r = Math.floor((p.y - oy) / size); return r >= 0 && r < N && c >= 0 && c < N ? [r, c] : null; };
    fill();
    const game = {
      VW: 1280, VH, wide: true, over: false, res: null,
      how: [`<b>Màn ${LVI + 1}:</b> ${L.goal === 'collect' ? `thu đủ ${L.n} viên kẹo ${CANDY_NAMES[L.k]}` : L.goal === 'jelly' ? `xoá hết thạch hồng dưới kẹo${L.layers > 1 ? ' (thạch 2 lớp)' : ''}` : `đạt ${fmt(L.t1)} điểm`} trong ${MOVES} lượt`, '<b>Vuốt</b> một viên kẹo sang ô bên cạnh (hoặc chạm 2 viên liền nhau) để đổi chỗ', 'Xếp được <b>3 viên cùng loại</b> thẳng hàng là nổ · kẹo rơi xuống nổ dây chuyền được nhân điểm', '4 viên → 🍭 <b>kẹo sọc</b> nổ cả hàng · 5 viên → 🌈 <b>kẹo cầu vồng</b> nổ hết 1 màu', 'Xong nhiệm vụ sớm thì lượt dư đổi thành điểm thưởng · điểm cao được ⭐⭐⭐'],
      update(dt) {
        t += dt; idle += dt; busy = Math.max(0, busy - dt);
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const it = grid[r][c]; if (!it) continue; if (it.y < r) { it.vy = (it.vy || 0) + 40 * dt; it.y = Math.min(r, it.y + it.vy * dt); if (it.y >= r) it.vy = 0; } else it.y = r; it.x = c; it.pop = Math.max(0, it.pop - dt); if (it.shake) it.shake = Math.max(0, it.shake - dt); if (it.anim) { it.anim.t += dt * 6; if (it.anim.t >= 1) it.anim = null; } }
        const settled = grid.every((row, r) => row.every((it) => it && it.y >= r && !it.anim));
        if (busy <= 0 && settled) {
          if (resolve(pendingSwap)) { pendingSwap = null; }
          else {
            pendingSwap = null;
            const done = L.goal !== 'score' && goalDone();
            if (done && moves > 0 && !ending) { const b = moves * 250; score += b; fx.push({ text: `🍭 Thưởng ${moves} lượt dư +${fmt(b)}`, big: 1, t: 0, c: '#ffe066' }); moves = 0; ending = 1.4; }
            if (ending > 0) { ending -= dt; if (ending > 0) return; }
            if (moves <= 0) { const st = starsOf(); game.over = true; game.res = { score, lv: LVI, stars: st, win: st > 0, extra: `Màn ${LVI + 1} · ${goalText()} · nổ dây chuyền ×${maxCombo}` }; return; }
            if (!hasMove()) { fx.push({ text: '🔀 Xáo lại bàn kẹo', big: 1, t: 0, c: '#fff' }); fill(); }
            cascades = 0;
          }
        }
        parts.forEach((p) => { p.t += dt; p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }); while (parts.length && parts[0].t > 0.7) parts.shift();
        fx.forEach((f) => { f.t += dt; }); while (fx.length && fx[0].t > 1.2) fx.shift();
        hint = idle > 6 ? hasMove() : null;
      },
      down(p) { const c = cellAt(p); if (!c) return; drag = { cell: c, x: p.x, y: p.y, done: false }; },
      move(p) {
        if (!drag || drag.done) return;
        const dx = p.x - drag.x, dy = p.y - drag.y, { size } = cellOf();
        if (Math.hypot(dx, dy) < size * 0.35) return;
        drag.done = true;
        const [r, c] = drag.cell, to = Math.abs(dx) > Math.abs(dy) ? [r, c + Math.sign(dx)] : [r + Math.sign(dy), c];
        if (at(...to)) trySwap(drag.cell, to);
      },
      up() {
        if (drag && !drag.done) {
          const c = drag.cell;
          if (sel && Math.abs(sel[0] - c[0]) + Math.abs(sel[1] - c[1]) === 1) trySwap(sel, c);
          else sel = sel && sel[0] === c[0] && sel[1] === c[1] ? null : c;
        }
        drag = null;
      },
      key() {},
      _dbg: () => ({ move: hasMove(), cell: cellOf(), moves, score, busy, got, jelly: jellyLeft(), L }),
      draw(g) {
        const W = game.VW, { size, ox, oy } = cellOf();
        const bg = g.createLinearGradient(0, 0, 0, VH); bg.addColorStop(0, '#f783ac'); bg.addColorStop(1, '#9775fa'); g.fillStyle = bg; g.fillRect(0, 0, W, VH);
        g.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc((i * 197 + t * 10) % (W + 100) - 50, (i * 131) % VH, 20 + (i % 4) * 14, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = 'rgba(40,20,80,.45)'; rr(g, ox - 10, oy - 10, size * N + 20, size * N + 20, 18); g.fill();
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { g.fillStyle = (r + c) % 2 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.2)'; g.fillRect(ox + c * size, oy + r * size, size, size); }
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (jelly[r][c]) { g.fillStyle = jelly[r][c] > 1 ? 'rgba(230,73,128,.75)' : 'rgba(247,131,172,.6)'; rr(g, ox + c * size + 3, oy + r * size + 3, size - 6, size - 6, 10); g.fill(); g.strokeStyle = jelly[r][c] > 1 ? '#a61e4d' : 'rgba(255,255,255,.7)'; g.lineWidth = jelly[r][c] > 1 ? 3 : 2; g.stroke(); }
        if (sel) { g.fillStyle = 'rgba(255,255,255,.45)'; rr(g, ox + sel[1] * size + 2, oy + sel[0] * size + 2, size - 4, size - 4, 10); g.fill(); }
        g.save(); g.beginPath(); g.rect(ox, oy, size * N, size * N); g.clip();
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          const it = grid[r][c]; if (!it) continue;
          let x = c, y = it.y;
          if (it.anim) { const k = Math.min(1, it.anim.t); x = it.anim.from[1] + (c - it.anim.from[1]) * k; y = it.anim.from[0] + (r - it.anim.from[0]) * k; }
          let px = ox + (x + 0.5) * size, py = oy + (y + 0.5) * size;
          if (it.shake) px += Math.sin(it.shake * 60) * 5;
          const isHint = hint && hint.some((h) => h[0] === r && h[1] === c);
          const s = size * 0.42 * (1 + it.pop * 0.8) * (isHint ? 1 + Math.sin(t * 8) * 0.08 : 1);
          drawCandy(g, px, py, s, it, t);
        }
        g.restore();
        parts.forEach((p) => { g.globalAlpha = Math.max(0, 1 - p.t / 0.7); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, 6, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; });
        fx.forEach((f) => { g.globalAlpha = Math.max(0, 1 - f.t / 1.2); if (f.big) txt(g, f.text, W / 2, VH * 0.45 - f.t * 30, 46, f.c); else txt(g, f.text, f.x, f.y - f.t * 50, 26, f.c); g.globalAlpha = 1; });
        // HUD
        const bw = size * N;
        g.fillStyle = 'rgba(0,0,0,.3)'; rr(g, ox - 10, 12, bw + 20, 96, 18); g.fill();
        txt(g, `MÀN ${LVI + 1}`, ox + 52, 34, 16, '#ffd8f0'); txt(g, fmt(score), ox + 52, 66, 24, '#fff');
        txt(g, 'LƯỢT', ox + bw - 40, 34, 14, '#ffd8f0'); txt(g, String(moves), ox + bw - 40, 66, 30, moves <= 5 ? '#ffa8a8' : '#fff');
        const gx = ox + bw / 2;
        if (L.goal === 'collect') { drawCandy(g, gx - 44, 44, 16, { k: L.k }, t); txt(g, `${Math.min(got, L.n)}/${L.n}`, gx + 14, 45, 24, got >= L.n ? '#8ce99a' : '#fff'); }
        else if (L.goal === 'jelly') { g.fillStyle = 'rgba(247,131,172,.95)'; rr(g, gx - 70, 30, 30, 30, 8); g.fill(); txt(g, `Thạch ${jellyLeft()}`, gx + 14, 45, 22, jellyLeft() === 0 ? '#8ce99a' : '#fff'); }
        else txt(g, `🎯 ${fmt(L.t1)} điểm`, gx, 45, 22, score >= L.t1 ? '#8ce99a' : '#fff');
        const sx = gx - 110, sw2 = 220, k3 = Math.min(1, score / L.t3);
        g.fillStyle = 'rgba(255,255,255,.25)'; rr(g, sx, 80, sw2, 12, 6); g.fill(); g.fillStyle = '#ffd43b'; rr(g, sx, 80, Math.max(12, sw2 * k3), 12, 6); g.fill();
        [L.t1, L.t2, L.t3].forEach((tv) => { const x = sx + sw2 * tv / L.t3; txt(g, score >= tv ? '★' : '☆', x, 86, 22, score >= tv ? '#ffe066' : '#fff'); });
      },
    };
    return game;
  }
  function drawCandy(g, x, y, s, it, t) {
    g.save(); g.translate(x, y);
    if (it.sp === 'bomb') {
      const gr = g.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.1, 0, 0, s); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#343a40'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, s * 0.9, 0, Math.PI * 2); g.fill();
      CANDY.forEach((cd, i) => { const a = i / CANDY.length * Math.PI * 2 + t * 2; g.fillStyle = cd.c; g.beginPath(); g.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.16, 0, Math.PI * 2); g.fill(); });
      g.restore(); return;
    }
    const cd = CANDY[it.k];
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, s * 0.85, s * 0.7, s * 0.18, 0, 0, Math.PI * 2); g.fill();
    const gr = g.createLinearGradient(0, -s, 0, s); gr.addColorStop(0, cd.c); gr.addColorStop(1, cd.d); g.fillStyle = gr; g.strokeStyle = cd.d; g.lineWidth = 2;
    g.beginPath();
    if (cd.s === 'heart') { g.moveTo(0, s * 0.85); g.bezierCurveTo(-s * 1.2, -s * 0.1, -s * 0.6, -s * 1.05, 0, -s * 0.45); g.bezierCurveTo(s * 0.6, -s * 1.05, s * 1.2, -s * 0.1, 0, s * 0.85); }
    else if (cd.s === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? s * 0.45 : s; g.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } g.closePath(); }
    else if (cd.s === 'square') { g.roundRect(-s * 0.78, -s * 0.78, s * 1.56, s * 1.56, s * 0.3); }
    else if (cd.s === 'drop') { g.moveTo(0, -s); g.bezierCurveTo(s * 0.9, -s * 0.1, s * 0.8, s * 0.9, 0, s * 0.9); g.bezierCurveTo(-s * 0.8, s * 0.9, -s * 0.9, -s * 0.1, 0, -s); }
    else if (cd.s === 'diamond') { g.moveTo(0, -s); g.lineTo(s * 0.85, 0); g.lineTo(0, s); g.lineTo(-s * 0.85, 0); g.closePath(); }
    else g.arc(0, 0, s * 0.85, 0, Math.PI * 2);
    g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-s * 0.28, -s * 0.38, s * 0.24, s * 0.13, -0.6, 0, Math.PI * 2); g.fill();
    if (it.sp === 'h' || it.sp === 'v') { g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = s * 0.14; for (const k of [-0.4, 0, 0.4]) { g.beginPath(); if (it.sp === 'h') { g.moveTo(-s * 0.7, k * s); g.lineTo(s * 0.7, k * s); } else { g.moveTo(k * s, -s * 0.7); g.lineTo(k * s, s * 0.7); } g.stroke(); } }
    g.restore();
  }

  /* ======================================================================
   * Khung chơi: menu → chơi → kết quả + thưởng xu
   * ==================================================================== */
  const GAMES = {
    bigfish: { name: 'Cá Lớn Nuốt Cá Bé', icon: '🐟', bg: '#0b3d63', make: makeBigFish, div: 60, unit: 'điểm' },
    subway: { name: 'Chạy Tàu Điện', icon: '🚇', bg: '#74c0fc', make: makeSubway, div: 40, unit: 'điểm' },
    archery: { name: 'Bắn Cung', icon: '🏹', bg: '#2f9e44', make: makeArchery, div: 1.5, unit: 'điểm' },
    candy: { name: 'Xếp Kẹo', icon: '🍬', bg: '#9775fa', make: makeCandy, div: 120, unit: 'điểm', levels: true },
  };
  if (!document.getElementById('a2-css')) {
    const st = document.createElement('style'); st.id = 'a2-css';
    st.textContent = `.a2-stage{flex:1;position:relative;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
.a2-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.a2-menu{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(10,20,40,.55);padding:16px}
.a2-menu[hidden]{display:none}
.a2-card{background:#fffaf0;border:3px solid #2b1a10;border-radius:18px;box-shadow:0 6px 0 #2b1a10;max-width:440px;width:100%;padding:16px;color:#2b1a10;text-align:center;max-height:100%;overflow:auto}
.a2-card .big{font-size:52px;line-height:1}.a2-card h2{margin:6px 0}
.a2-card ul{text-align:left;font-size:14px;line-height:1.5;padding-left:20px;margin:8px 0}
.a2-card .row{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px}
.a2-card .note{font-size:12px;color:#7a5a3a;margin:6px 0 0}
.a2-lv{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin:8px 0;max-height:40vh;overflow:auto;padding:2px}
.a2-lv button{border:2px solid #2b1a10;border-radius:12px;background:linear-gradient(#fff,#ffe3ef);padding:4px 2px;display:flex;flex-direction:column;align-items:center;font-family:inherit;cursor:pointer;line-height:1.1}
.a2-lv button b{font-size:18px}.a2-lv button i{font-style:normal;font-size:11px;letter-spacing:-1px}.a2-lv button small{font-size:10px}
.a2-lv button.on{background:#ffd43b}.a2-lv button:disabled{opacity:.45;cursor:default}.a2-card .res{font-size:18px;font-weight:800;margin:8px 0}`;
    document.head.appendChild(st);
  }
  let open = null;
  function play(id) {
    const G = GAMES[id];
    if (!G) return;
    if (open && open.cleanup) open.cleanup();
    const v = document.getElementById('arcadeView');
    v.innerHTML = `<div class="arc-bar"><b>${G.icon} ${G.name}</b><span>Điểm càng cao thưởng càng nhiều xu (tối đa 60 xu/ván)</span><button class="tv-x" data-close>✕ Thoát</button></div><div class="a2-stage"><canvas></canvas><div class="a2-menu"></div></div>`;
    v.classList.add('show');
    const stage = v.querySelector('.a2-stage'), cv = v.querySelector('canvas'), g = cv.getContext('2d'), menu = v.querySelector('.a2-menu');
    const me = { id, game: G.make(0), running: false, raf: 0, last: 0, lv: 0 };
    const LVD = () => { const d = D(); d.lv = d.lv || {}; d.lv[id] = d.lv[id] || []; return d.lv[id]; };
    const unlocked = () => Math.min(CANDY_LV.length - 1, LVD().filter((v) => v > 0).length);
    if (G.levels) me.lv = unlocked();
    open = me;
    let k = 1, ox = 0, oy = 0, dpr = 1;
    const fit = () => {
      const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
      me.game.VW = Math.round(clamp(720 * r.width / Math.max(1, r.height), 720, 1700));
      k = Math.min(r.width / me.game.VW, r.height / me.game.VH); ox = (r.width - me.game.VW * k) / 2; oy = (r.height - me.game.VH * k) / 2;
    };
    const toV = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - ox) / k, y: (e.clientY - r.top - oy) / k, id: e.pointerId }; };
    const downs = new Set();
    cv.addEventListener('pointerdown', (e) => { if (!me.running) return; e.preventDefault(); downs.add(e.pointerId); try { cv.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ } me.game.down(toV(e)); });
    cv.addEventListener('pointermove', (e) => { if (!me.running) return; if (downs.has(e.pointerId) || (e.pointerType === 'mouse' && id === 'bigfish')) me.game.move(toV(e), downs.has(e.pointerId)); });
    const up = (e) => { if (!downs.has(e.pointerId)) return; downs.delete(e.pointerId); if (me.running) me.game.up(toV(e)); };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    const kd = (e) => { if (!me.running) return; if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault(); if (!e.repeat) me.game.key(e.key.length === 1 ? e.key.toLowerCase() : e.key, true); };
    window.addEventListener('keydown', kd); window.addEventListener('resize', fit);
    const cleanup = () => { cancelAnimationFrame(me.raf); window.removeEventListener('keydown', kd); window.removeEventListener('resize', fit); if (open === me) open = null; };
    me.cleanup = cleanup;
    v.querySelector('[data-close]').onclick = () => { cleanup(); UI.closeArcade(); };
    function frame(now) {
      if (!cv.isConnected) return cleanup();
      const dt = Math.min(0.05, (now - (me.last || now)) / 1000); me.last = now;
      if (me.running && dt > 0) { me.game.update(dt); if (me.game.over) { me.running = false; finish(me.game.res); } }
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = G.bg; g.fillRect(0, 0, cv.width, cv.height);
      g.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
      g.save(); g.beginPath(); g.rect(0, 0, me.game.VW, me.game.VH); g.clip(); me.game.draw(g); g.restore();
      me.raf = requestAnimationFrame(frame);
    }
    function showMenu() {
      if (G.levels) return levelMenu();
      const best = D().best[id] || 0;
      menu.hidden = false;
      menu.innerHTML = `<div class="a2-card"><div class="big">${G.icon}</div><h2>${G.name}</h2><ul>${me.game.how.map((h) => `<li>${h}</li>`).join('')}</ul>
        <p class="note">🏅 Kỷ lục: <b>${fmt(best)}</b> ${G.unit} · ${G.div} ${G.unit} = 1 xu (tối đa 60 xu/ván)</p>
        <div class="row"><button class="btn" data-go>▶ Chơi ngay</button></div></div>`;
      menu.querySelector('[data-go]').onclick = start;
    }
    /** bản đồ chọn màn (kiểu Candy Crush): màn đã qua có sao, màn chưa mở bị khoá */
    function levelMenu() {
      const st = LVD(), open = unlocked(), total = st.reduce((a, v) => a + (v || 0), 0);
      if (me.lv > open) me.lv = open;
      const L = CANDY_LV[me.lv], icon = (x) => (x.goal === 'collect' ? '🍬' : x.goal === 'jelly' ? '🟪' : '🎯');
      menu.hidden = false;
      menu.innerHTML = `<div class="a2-card"><div class="big">${G.icon}</div><h2>${G.name}</h2>
        <p class="note">⭐ Đã có <b>${total}/${CANDY_LV.length * 3}</b> sao · qua màn để mở màn tiếp theo</p>
        <div class="a2-lv">${CANDY_LV.map((x, i) => `<button data-lv="${i}" class="${i === me.lv ? 'on' : ''}" ${i > open ? 'disabled' : ''}><b>${i > open ? '🔒' : i + 1}</b><small>${i > open ? '' : icon(x)}</small><i>${i > open ? '' : '★'.repeat(st[i] || 0) + '☆'.repeat(3 - (st[i] || 0))}</i></button>`).join('')}</div>
        <p class="res">Màn ${me.lv + 1}: ${L.goal === 'collect' ? `thu ${L.n} kẹo ${CANDY_NAMES[L.k]}` : L.goal === 'jelly' ? `xoá hết thạch${L.layers > 1 ? ' 2 lớp' : ''}` : `đạt ${fmt(L.t1)} điểm`} · ${L.moves} lượt</p>
        <p class="note">👆 Vuốt kẹo sang ô bên cạnh · 3 viên cùng loại là nổ · 4 viên ra kẹo sọc · 5 viên ra kẹo cầu vồng</p>
        <div class="row"><button class="btn" data-go>▶ Chơi màn ${me.lv + 1}</button></div></div>`;
      menu.querySelectorAll('[data-lv]').forEach((b) => b.onclick = () => { me.lv = +b.dataset.lv; levelMenu(); });
      menu.querySelector('[data-go]').onclick = start;
    }
    function start() {
      me.game = G.make(me.lv); fit(); if (me.game.start) me.game.start();
      menu.hidden = true; me.running = true; me.last = 0;
    }
    function finish(res) {
      if (G.levels && res.lv != null) return finishLevel(res);
      const d = D(), best = d.best[id] || 0, rec = res.score > best;
      if (rec) d.best[id] = res.score;
      const coins = Math.min(60, Math.floor(res.score / G.div)), xp = Math.min(30, 3 + Math.floor(coins / 2));
      if (coins > 0) AV.earn(coins, xp); else AV.earn(0, xp);
      AV.quest('arcade'); AV.markChanged(); UI.updateHud();
      if (rec && res.score >= G.div * 40 && typeof NET !== 'undefined' && NET.sendSys) NET.sendSys(`${G.icon} ${S().name} vừa lập kỷ lục ${fmt(res.score)} điểm ở máy ${G.name}!`);
      const extra = res.extra || (id === 'subway' ? `Chạy ${fmt(res.dist)} m · nhặt ${res.coins} 🪙` : `Lên tới cấp ${res.level}`);
      menu.hidden = false;
      menu.innerHTML = `<div class="a2-card"><div class="big">${G.icon}</div><h2>${rec ? '🎉 Kỷ lục mới!' : 'Hết ván!'}</h2>
        <p class="res">⭐ ${fmt(res.score)} ${G.unit}</p><p>${extra}</p>
        <p class="res">💰 +${coins} xu · ⭐ +${xp} XP</p>${coins < 60 ? `<p class="note">Kỷ lục của bạn: ${fmt(Math.max(best, res.score))} ${G.unit}</p>` : ''}
        <div class="row"><button class="btn" data-again>🔁 Chơi lại</button><button class="btn ghost" data-quit>🚪 Thoát</button></div></div>`;
      menu.querySelector('[data-again]').onclick = start;
      menu.querySelector('[data-quit]').onclick = () => { cleanup(); UI.closeArcade(); };
    }
    /** hết màn: lưu sao, thưởng xu theo số sao (lần đầu qua màn thưởng thêm), mở màn sau */
    function finishLevel(res) {
      const st = LVD(), prev = st[res.lv] || 0, first = prev === 0 && res.stars > 0;
      if (res.stars > prev) st[res.lv] = res.stars;
      const coins = res.win ? Math.min(60, [0, 20, 35, 50][res.stars] + (first ? 10 : 0)) : 3, xp = res.win ? 6 + res.stars * 4 : 3;
      AV.earn(coins, xp); if (res.win) AV.quest('arcade'); AV.markChanged(); UI.updateHud();
      if (first && res.lv === CANDY_LV.length - 1 && typeof NET !== 'undefined' && NET.sendSys) NET.sendSys(`🍬 ${S().name} vừa phá đảo cả ${CANDY_LV.length} màn Xếp Kẹo!`);
      if (res.win) me.lv = Math.min(CANDY_LV.length - 1, Math.max(me.lv, res.lv + 1));
      menu.hidden = false;
      menu.innerHTML = `<div class="a2-card"><div class="big">${res.win ? '🎉' : '😢'}</div><h2>${res.win ? `Qua màn ${res.lv + 1}!` : `Chưa qua màn ${res.lv + 1}`}</h2>
        <p style="font-size:40px;margin:4px 0;color:#f59f00">${'★'.repeat(res.stars)}<span style="color:#ced4da">${'★'.repeat(3 - res.stars)}</span></p>
        <p class="res">⭐ ${fmt(res.score)} điểm</p><p>${res.extra}</p>
        <p class="res">💰 +${coins} xu · ⭐ +${xp} XP${first ? ' · 🔓 mở màn mới' : ''}</p>
        <div class="row">${res.win && res.lv < CANDY_LV.length - 1 ? `<button class="btn" data-next>▶ Màn ${res.lv + 2}</button>` : ''}<button class="btn ${res.win ? 'ghost' : ''}" data-again>🔁 Chơi lại</button><button class="btn ghost" data-map>🗺️ Chọn màn</button></div></div>`;
      const nx = menu.querySelector('[data-next]'); if (nx) nx.onclick = () => { me.lv = res.lv + 1; start(); };
      menu.querySelector('[data-again]').onclick = () => { me.lv = res.lv; start(); };
      menu.querySelector('[data-map]').onclick = levelMenu;
    }
    requestAnimationFrame(() => { fit(); showMenu(); me.raf = requestAnimationFrame(frame); });
  }
  return { play, GAMES, _game: () => open && open.game };
})();
