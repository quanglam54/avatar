/* 🦋 NÔNG TRẠI SỐNG ĐỘNG (nông trại chính)
 *  · bướm, chuồn chuồn bay lượn quanh ruộng (ban ngày)
 *  · chim sẻ đậu trên tường rào, người đi tới gần thì vỗ cánh bay đi rồi đậu chỗ khác
 *  · cỏ dại mọc ở ô ruộng trống: nhổ được XP; để quá 30 phút làm cây cùng luống chậm lớn
 *  · thú cưng nhà mình (mèo / chó / cún…) ngủ trước hiên, thỉnh thoảng dậy đuổi gà chạy toán loạn */
const FARMLIFE = (() => {
  const S = () => AV.S;
  const onFarm = () => AV.currentMap && AV.currentMap() === 'farm' && !(AV.visiting && AV.visiting());
  const day = () => (AV.nightFactor ? AV.nightFactor() < 0.4 : true);
  const em = (g, s, x, y, size) => { g.font = `${size}px system-ui, "Segoe UI Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.globalAlpha = 1; g.fillText(s, x, y); };
  const fx = [];
  const add = (f) => { fx.push(f); AV.worldFx.push(f); return f; };
  function clear() { fx.forEach((f) => { const i = AV.worldFx.indexOf(f); if (i >= 0) AV.worldFx.splice(i, 1); }); fx.length = 0; }

  /* ---------- 🦋 bướm & chuồn chuồn: bay theo đường cong quanh 1 điểm neo ---------- */
  const FIELD = { l: 200, r: 2240, t: 470, b: 1230 };
  function flyer(kind, k) {
    const ax = FIELD.l + Math.random() * (FIELD.r - FIELD.l), ay = FIELD.t + Math.random() * (FIELD.b - FIELD.t);
    const f = { x: ax, y: ay, kind, ph: Math.random() * 9, sp: 0.25 + Math.random() * 0.3, rx: 140 + Math.random() * 160, ry: 60 + Math.random() * 80 };
    f.draw = (g, t) => {
      if (!onFarm() || !day()) return;
      const a = t * f.sp + f.ph;
      f.x = ax + Math.sin(a) * f.rx + Math.sin(a * 2.7) * 20; f.y = ay + Math.sin(a * 1.3) * f.ry;
      const hover = kind === 'drag' ? Math.sin(t * 30) * 1.5 : Math.sin(t * 9 + k) * 6;
      g.save(); g.translate(f.x, f.y - 70 + hover);
      if (Math.cos(a) < 0) g.scale(-1, 1);
      if (kind === 'drag') { g.rotate(-0.15); const fl = Math.sin(t * 40) * 0.25; g.fillStyle = 'rgba(200,235,255,.75)'; g.strokeStyle = 'rgba(80,140,180,.8)'; g.lineWidth = 0.8; [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sy]) => { g.save(); g.translate(sx * 3, 0); g.rotate(sy * (0.5 + fl)); g.beginPath(); g.ellipse(0, sy * 9, 3, 9, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }); g.fillStyle = '#1c7ed6'; g.fillRect(-16, -1.5, 22, 3); g.fillStyle = '#0b4f8a'; g.beginPath(); g.arc(7, 0, 3, 0, 7); g.fill(); } else { g.scale(1, 0.7 + Math.abs(Math.sin(t * 12 + k)) * 0.3); em(g, '🦋', 0, 0, 28); }
      g.restore();
    };
    return add(f);
  }

  /* ---------- 🐦 chim sẻ trên tường rào ---------- */
  const PERCH = () => (Math.random() < 0.6 ? { x: 260 + Math.random() * 4800, y: 1302 } : { x: 260 + Math.random() * 1900, y: 428 });
  function bird() {
    const p = PERCH();
    const b = { x: p.x, y: p.y, st: 'sit', t: 0, vx: 0, vy: 0, peck: 0, dir: Math.random() < 0.5 ? -1 : 1 };
    b.draw = (g, t) => {
      if (!onFarm()) return;
      const bob = b.st === 'sit' ? (Math.sin(t * 3 + b.x) > 0.92 ? -3 : 0) : Math.sin(t * 25) * 3;
      g.save(); g.translate(b.x, b.y - 40 + bob); g.scale(b.dir, 1);
      em(g, b.st === 'sit' ? '🐦' : '🕊️', 0, 0, b.st === 'sit' ? 26 : 30);
      g.restore();
    };
    return add(b);
  }
  function stepBirds(dt) {
    const P = AV.player;
    fx.filter((f) => f.st).forEach((b) => {
      if (b.st === 'sit') {
        if (Math.hypot(P.x - b.x, P.y - b.y) < 170) { b.st = 'fly'; b.vx = (b.x < P.x ? -1 : 1) * (180 + Math.random() * 120); b.vy = -200 - Math.random() * 80; b.dir = Math.sign(b.vx); b.t = 0; }
        else if (Math.random() < dt * 0.15) b.dir *= -1;
      } else if (b.st === 'fly') {
        b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 40 * dt;
        if (b.t > 3) { b.st = 'away'; b.t = 0; b.y = -999; }
      } else if (b.st === 'away') {
        b.t += dt;
        if (b.t > 12 + Math.random() * 10) { const p = PERCH(); if (Math.hypot(P.x - p.x, P.y - p.y) > 300) { b.x = p.x; b.y = p.y; b.st = 'sit'; } }
      }
    });
  }

  /* ---------- 🌿 cỏ dại ---------- */
  const W = () => { const s = S(); s.weeds = s.weeds || {}; return s.weeds; }; // ô → thời điểm mọc
  const MAX_WEEDS = 8, SLOW_AFTER = 30 * 60e3;
  let weedFx = null;
  function tilePos(i) { const o = AV.debugMap().inter.find((q) => q.tile === i); return o ? { x: o.x + o.w / 2, y: o.y + o.h / 2 } : null; }
  function spawnWeed() {
    const s = S(), w = W();
    if (Object.keys(w).length >= MAX_WEEDS) return;
    const empty = [];
    s.tiles.forEach((t, i) => { if (!t.crop && s.beds[Math.floor(i / 12)] && !w[i]) empty.push(i); });
    if (!empty.length) return;
    w[empty[Math.floor(Math.random() * empty.length)]] = Date.now();
    if (AV.markChanged) AV.markChanged();
  }
  function weedsFx() {
    const f = { x: 1200, y: 400, draw: (g, t) => {
      if (!onFarm()) return;
      for (const [i, at] of Object.entries(W())) {
        const p = tilePos(+i); if (!p) continue;
        const old = Date.now() - at > SLOW_AFTER, s = old ? 1.25 : 0.9;
        g.save(); g.translate(p.x, p.y + 6); g.rotate(Math.sin(t * 2 + +i) * 0.08); g.scale(s, s);
        g.fillStyle = old ? '#4f7a1f' : '#6aa832';
        for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 3, 0); g.quadraticCurveTo(k * 7, -10, k * 6 + Math.sin(t * 3 + k) * 2, -20 - Math.abs(k) * -2); g.lineTo(k * 3 + 2, 0); g.closePath(); g.fill(); }
        if (old) { g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(-4, -18, 2.5, 0, 7); g.arc(6, -16, 2.5, 0, 7); g.fill(); }
        g.restore();
      }
    } };
    f.y = 1262; // vẽ sau các luống ruộng (cỏ nằm trên ô đất)
    return add(f);
  }
  /** bấm ô ruộng có cỏ → nhổ cỏ (trả true nếu đã xử lý) */
  function pull(i) {
    const w = W();
    if (!w[i]) return false;
    if (!AV.useEnergy(1)) return true;
    const old = Date.now() - w[i] > SLOW_AFTER;
    delete w[i];
    AV.earn(0, old ? 4 : 2);
    const p = tilePos(i) || AV.player;
    AV.floatText(old ? '🌿 Nhổ cỏ dại! +4 XP' : '🌿 Nhổ cỏ +2 XP', p.x, p.y - 40, '#8ce99a');
    AV.sayMine(['Cỏ ơi đi đi!', 'Sạch ruộng~', 'Nhổ nhổ…'][Math.floor(Math.random() * 3)]);
    if (AV.quest) AV.quest('weed');
    if (AV.markChanged) AV.markChanged();
    return true;
  }
  /** cỏ để lâu: cây đang lớn trong cùng luống chậm lại ~10% / cỏ */
  function slowCrops(dt) {
    const s = S(), w = W(), now = Date.now();
    for (const [i, at] of Object.entries(W())) {
      if (now - at < SLOW_AFTER) continue;
      const bed = Math.floor(+i / 12);
      for (let k = bed * 12; k < bed * 12 + 12; k++) {
        const t = s.tiles[k];
        if (!t.crop || AV.tileState(t).stage < 0 || AV.tileState(t).stage >= 2) continue;
        t.plantedAt += dt * 1000 * 0.1;
      }
    }
    void w;
  }

  /* ---------- 🐈 thú cưng ngủ trước hiên, thỉnh thoảng đuổi gà ---------- */
  const HOME = { x: 2575, y: 772 };
  const PETS = ['cat', 'dog', 'pug', 'bunny', 'chick', 'dino', 'dino_pink', 'babydragon', 'ghost', 'bat'];
  let pet = null;
  function porchPet() {
    const owned = (S().owned.pets || []).filter((p) => PETS.includes(p) && p !== S().look.pet);
    const kind = owned.includes('cat') ? 'cat' : owned.includes('dog') ? 'dog' : owned[0];
    if (!kind) return null;
    const p = { x: HOME.x, y: HOME.y, kind, st: 'sleep', t: 0, dir: 1, tx: 0, ty: 0, target: null, wake: 30 + Math.random() * 40 };
    p.draw = (g, t) => {
      if (!onFarm()) return;
      if (p.st === 'sleep') {
        g.save(); g.translate(p.x, p.y); g.scale(1.6, 1.05); ART.pet(g, 0, 0, p.kind, p.dir, 0, false); g.restore();
        const z = (t * 0.6) % 1; g.globalAlpha = 1 - z; em(g, '💤', p.x + 22 + z * 12, p.y - 40 - z * 26, 22); g.globalAlpha = 1;
      } else { g.save(); g.translate(p.x, p.y); g.scale(1.25, 1.25); ART.pet(g, 0, 0, p.kind, p.dir, t, true); g.restore(); if (p.st === 'chase') em(g, '❗', p.x, p.y - 50, 18); }
    };
    return add(p);
  }
  function stepPet(dt) {
    if (!pet) return;
    pet.t += dt;
    const move = (tx, ty, sp) => { const dx = tx - pet.x, dy = ty - pet.y, d = Math.hypot(dx, dy); if (d < 6) return true; pet.dir = dx > 0 ? 1 : -1; pet.x += dx / d * Math.min(d, sp * dt); pet.y += dy / d * Math.min(d, sp * dt); return false; };
    if (pet.st === 'sleep') {
      if (pet.t > pet.wake) {
        const chickens = AV.debugMap().animals.filter((a) => a.kind === 'chicken');
        if (chickens.length) { pet.target = chickens[Math.floor(Math.random() * chickens.length)]; pet.st = 'chase'; pet.t = 0; AV.showBubble && AV.showBubble(pet.target, 'Cục tác!! 😱'); }
        else { pet.t = 0; }
      }
    } else if (pet.st === 'chase') {
      const c = pet.target;
      move(c.x - 30 * (c.x > pet.x ? 1 : -1), c.y, 260);
      // gà chạy toán loạn
      AV.debugMap().animals.forEach((a) => { if (a.kind !== 'chicken') return; const d = Math.hypot(a.x - pet.x, a.y - pet.y); if (d < 160) { a.wait = 0; const ang = Math.atan2(a.y - pet.y, a.x - pet.x); a.tx = Math.max(a.area.l, Math.min(a.area.r, a.x + Math.cos(ang) * 120)); a.ty = Math.max(a.area.t, Math.min(a.area.b, a.y + Math.sin(ang) * 120)); a.x += Math.cos(ang) * 120 * dt; a.y += Math.sin(ang) * 120 * dt; } });
      if (pet.t > 5) { pet.st = 'home'; pet.t = 0; }
    } else if (pet.st === 'home') {
      if (move(HOME.x, HOME.y, 160)) { pet.st = 'sleep'; pet.t = 0; pet.wake = 40 + Math.random() * 60; pet.dir = 1; }
    }
  }

  /* ---------- vòng lặp ---------- */
  let built = false, last = performance.now(), weedAt = Date.now() + 60000;
  function tick() {
    const now = performance.now(), dt = Math.min(0.2, (now - last) / 1000); last = now;
    if (!AV.S || !AV.worldFx || !AV.currentMap) return;
    if (!onFarm()) { if (built) { clear(); built = false; pet = null; weedFx = null; } }
    else if (!built) {
      built = true;
      for (let k = 0; k < 6; k++) flyer('fly', k);
      for (let k = 0; k < 3; k++) flyer('drag', k);
      for (let k = 0; k < 7; k++) bird();
      weedFx = weedsFx();
      pet = porchPet();
    }
    if (built) { stepBirds(dt); stepPet(dt); }
    // cỏ mọc kể cả khi đi khu khác (theo thời gian thật), làm chậm cây
    if (!(AV.visiting && AV.visiting())) {
      if (Date.now() > weedAt) { weedAt = Date.now() + (4 + Math.random() * 6) * 60e3; spawnWeed(); }
      slowCrops(dt);
    }
  }
  function init() {
    setInterval(tick, 100);
    // lần đầu vào game: cỏ đã mọc trong lúc vắng nhà (mỗi 20 phút vắng ~1 bụi)
    setTimeout(() => { const away = Date.now() - (S().savedAt || Date.now()); for (let k = 0; k < Math.min(MAX_WEEDS, Math.floor(away / (20 * 60e3))); k++) spawnWeed(); }, 3000);
  }
  return { init, pull, hasWeed: (i) => !!W()[i] };
})();
