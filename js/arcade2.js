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
   * Khung chơi: menu → chơi → kết quả + thưởng xu
   * ==================================================================== */
  const GAMES = {
    bigfish: { name: 'Cá Lớn Nuốt Cá Bé', icon: '🐟', bg: '#0b3d63', make: makeBigFish, div: 60, unit: 'điểm' },
    subway: { name: 'Chạy Tàu Điện', icon: '🚇', bg: '#74c0fc', make: makeSubway, div: 40, unit: 'điểm' },
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
.a2-card .note{font-size:12px;color:#7a5a3a;margin:6px 0 0}.a2-card .res{font-size:18px;font-weight:800;margin:8px 0}`;
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
    const me = { id, game: G.make(), running: false, raf: 0, last: 0 };
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
      const best = D().best[id] || 0;
      menu.hidden = false;
      menu.innerHTML = `<div class="a2-card"><div class="big">${G.icon}</div><h2>${G.name}</h2><ul>${me.game.how.map((h) => `<li>${h}</li>`).join('')}</ul>
        <p class="note">🏅 Kỷ lục: <b>${fmt(best)}</b> ${G.unit} · ${G.div} ${G.unit} = 1 xu (tối đa 60 xu/ván)</p>
        <div class="row"><button class="btn" data-go>▶ Chơi ngay</button></div></div>`;
      menu.querySelector('[data-go]').onclick = start;
    }
    function start() {
      me.game = G.make(); fit(); if (me.game.start) me.game.start();
      menu.hidden = true; me.running = true; me.last = 0;
    }
    function finish(res) {
      const d = D(), best = d.best[id] || 0, rec = res.score > best;
      if (rec) d.best[id] = res.score;
      const coins = Math.min(60, Math.floor(res.score / G.div)), xp = Math.min(30, 3 + Math.floor(coins / 2));
      if (coins > 0) AV.earn(coins, xp); else AV.earn(0, xp);
      AV.quest('arcade'); AV.markChanged(); UI.updateHud();
      if (rec && res.score >= G.div * 40 && typeof NET !== 'undefined' && NET.sendSys) NET.sendSys(`${G.icon} ${S().name} vừa lập kỷ lục ${fmt(res.score)} điểm ở máy ${G.name}!`);
      const extra = id === 'subway' ? `Chạy ${fmt(res.dist)} m · nhặt ${res.coins} 🪙` : `Lên tới cấp ${res.level}`;
      menu.hidden = false;
      menu.innerHTML = `<div class="a2-card"><div class="big">${G.icon}</div><h2>${rec ? '🎉 Kỷ lục mới!' : 'Hết ván!'}</h2>
        <p class="res">⭐ ${fmt(res.score)} ${G.unit}</p><p>${extra}</p>
        <p class="res">💰 +${coins} xu · ⭐ +${xp} XP</p>${coins < 60 ? `<p class="note">Kỷ lục của bạn: ${fmt(Math.max(best, res.score))} ${G.unit}</p>` : ''}
        <div class="row"><button class="btn" data-again>🔁 Chơi lại</button><button class="btn ghost" data-quit>🚪 Thoát</button></div></div>`;
      menu.querySelector('[data-again]').onclick = start;
      menu.querySelector('[data-quit]').onclick = () => { cleanup(); UI.closeArcade(); };
    }
    requestAnimationFrame(() => { fit(); showMenu(); me.raf = requestAnimationFrame(frame); });
  }
  return { play, GAMES, _game: () => open && open.game };
})();
