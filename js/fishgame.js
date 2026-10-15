/* 🎣 Câu cá kiểu "Fishing Paradise": nhìn ngang xuống lòng hồ, cá bơi qua lại.
 * Kéo ngón tay (hoặc ◀ ▶) để di chuyển thuyền, CHẠM để thả lưỡi câu — lưỡi chìm xuống, chạm con nào là dính con đó rồi tự kéo lên.
 * Cá càng hiếm càng bơi sâu và nhanh. Có xu nổi để vớt thêm, tránh sứa (bị giật mất mồi).
 * Mỗi lượt câu 30 giây (cần câu xịn được thêm giờ và lưỡi chìm nhanh hơn). */
const FISHGAME = (() => {
  const VH = 720, SURF = 190, BOT = VH - 70;
  let el = null, cv = null, g = null, run = null, VW = 1280, k = 1, ox = 0, oy = 0, dpr = 1;
  const rnd = (a, b) => a + Math.random() * (b - a);
  function ensure() {
    if (el) return;
    const st = document.createElement('style');
    st.textContent = `.fishsea{position:fixed;inset:0;z-index:60;display:none;flex-direction:column;background:#0b3d63;touch-action:none;user-select:none;-webkit-user-select:none}
.fishsea .fs-bar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:linear-gradient(#4dabf7,#1c7ed6);color:#fff;font-weight:900;border-bottom:3px solid #0b2a4a}
.fishsea .fs-bar span{font-weight:700;font-size:13px;opacity:.9;flex:1}
.fishsea .fs-stage{flex:1;position:relative;overflow:hidden}
.fishsea canvas{position:absolute;inset:0;display:block;touch-action:none}
.fishsea .fs-card{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,25,45,.55);padding:16px}
.fishsea .fs-card[hidden]{display:none}
.fishsea .fs-card>div{background:#fffaf0;border:3px solid #2b1a10;border-radius:18px;box-shadow:0 6px 0 #2b1a10;max-width:420px;width:100%;padding:16px;color:#2b1a10;text-align:center;max-height:100%;overflow:auto}
.fishsea .fs-card h2{margin:4px 0 8px}
.fishsea .fs-list{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:8px 0}
.fishsea .fs-list b{background:#e7f5ff;border:2px solid #74c0fc;border-radius:12px;padding:4px 10px;font-size:15px}
.fishsea .fs-row{display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap}`;
    document.head.appendChild(st);
    el = document.createElement('div');
    el.className = 'fishsea';
    el.innerHTML = '<div class="fs-bar">🎣 <b>Câu cá</b><span></span><button class="tv-x" data-x>✕ Thu cần</button></div><div class="fs-stage"><canvas></canvas><div class="fs-card" hidden></div></div>';
    document.body.appendChild(el);
    cv = el.querySelector('canvas'); g = cv.getContext('2d');
    const toV = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - ox) / k, y: (e.clientY - r.top - oy) / k }; };
    cv.addEventListener('pointerdown', (e) => { if (!run || run.over) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ } down(toV(e)); });
    cv.addEventListener('pointermove', (e) => { if (run && run.drag) move(toV(e)); });
    const up = () => { if (run && !run.over) release(); if (run) run.drag = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    window.addEventListener('keydown', (e) => {
      if (!run || run.over || el.style.display === 'none') return;
      if (e.key === 'ArrowLeft' || e.key === 'a') { run.kL = true; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd') { run.kR = true; e.preventDefault(); }
      if (e.key === ' ' || e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); drop(); }
    });
    window.addEventListener('keyup', (e) => { if (!run) return; if (e.key === 'ArrowLeft' || e.key === 'a') run.kL = false; if (e.key === 'ArrowRight' || e.key === 'd') run.kR = false; });
    window.addEventListener('resize', fit);
    el.querySelector('[data-x]').onclick = () => end(true);
  }
  function fit() {
    if (!el || el.style.display === 'none') return;
    const r = cv.parentElement.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    VW = Math.round(Math.max(720, Math.min(1700, VH * r.width / Math.max(1, r.height))));
    k = Math.min(r.width / VW, r.height / VH); ox = (r.width - VW * k) / 2; oy = (r.height - VH * k) / 2;
  }

  /* ---------- điều khiển ---------- */
  const BTN = () => [{ k: -1, x: 70, y: VH - 70 }, { k: 1, x: 200, y: VH - 70 }];
  function down(p) {
    const b = BTN().find((o) => Math.hypot(p.x - o.x, p.y - o.y) < 56);
    if (b) { run.hold = b.k; run.drag = { btn: true }; return; }
    run.drag = { sx: p.x, bx: run.boat, moved: false, t: run.t };
    run.hint = false;
  }
  function move(p) {
    const d = run.drag;
    if (!d || d.btn) return;
    if (Math.abs(p.x - d.sx) > 12) d.moved = true;
    if (d.moved) run.boat = Math.max(90, Math.min(VW - 160, d.bx + (p.x - d.sx)));
  }
  // nhấc ngón: nếu không kéo (chạm nhanh) thì thả lưỡi câu
  function release() { const d = run && run.drag; if (!d) return; if (d.btn) run.hold = 0; else if (!d.moved) drop(); }
  function drop() { const h = run.hook; if (h.st === 'idle') { h.st = 'down'; run.hint = false; } }

  /* ---------- loài cá: hiếm hơn → sâu hơn, nhanh hơn, to hơn ---------- */
  function species(table) {
    const list = table.filter((f) => f.id !== 'boot').slice().sort((a, b) => a.sell - b.sell), n = list.length;
    return list.map((f, i) => {
      const q = n > 1 ? i / (n - 1) : 0;
      return { f, w: f.w, y0: SURF + 70 + q * (BOT - SURF - 190), y1: SURF + 170 + q * (BOT - SURF - 190), sp: 70 + q * 150, size: 46 + q * 34 };
    });
  }
  function spawn(r, init) {
    const S = r.sp, tot = S.reduce((a, s) => a + s.w, 0);
    let x = Math.random() * tot; const s = S.find((o) => (x -= o.w) < 0) || S[0];
    const dir = Math.random() < 0.5 ? 1 : -1;
    r.fish.push({ s, x: init ? rnd(60, VW - 60) : dir > 0 ? -60 : VW + 60, y: rnd(s.y0, s.y1), dir, sp: s.sp * rnd(0.8, 1.2), ph: Math.random() * 6, turn: rnd(3, 9) });
  }
  function spawnJelly(r) { r.jelly.push({ x: rnd(220, VW - 220), y: BOT + 30, vy: -rnd(28, 45), ph: Math.random() * 6 }); }
  function spawnCoin(r) { r.coins.push({ x: rnd(120, VW - 120), y: BOT + 10, vy: -rnd(40, 70), ph: Math.random() * 6 }); }

  /** opts: { table, rodLv, look, sky, onCatch(fish), onCoin(n), onEnd(summary), again() → bool } */
  function session(opts) {
    ensure();
    el.style.display = 'flex'; el.querySelector('.fs-card').hidden = true;
    el.querySelector('.fs-bar span').textContent = opts.sky ? 'Đảo Trên Trời · thả câu xuống biển mây' : 'Kéo để di chuyển thuyền · chạm để thả lưỡi câu';
    fit();
    const rod = Math.max(0, Math.min(4, opts.rodLv | 0)), boot = opts.table.find((f) => f.id === 'boot');
    run = {
      opts, rod, boot, t: 0, time: 30 + rod * 4, last: 0, over: false, hint: true, hold: 0, kL: false, kR: false, drag: null,
      boat: VW * 0.42, bob: 0, hook: { st: 'idle', y: SURF + 40, x: 0, fish: null, zap: 0 },
      sp: species(opts.table), fish: [], jelly: [], coins: [], fx: [], bag: {}, nCatch: 0, coinsGot: 0, trash: [],
      nextJelly: 6, nextCoin: 3,
    };
    for (let i = 0; i < 8; i++) spawn(run, true);
    if (boot) for (let i = 0; i < 2; i++) run.trash.push({ x: rnd(150, VW - 150), y: BOT - rnd(10, 40), rot: rnd(-0.6, 0.6) });
    const r0 = run;
    requestAnimationFrame(function loop(now) {
      if (run !== r0 || el.style.display === 'none') return;
      const dt = Math.min(0.05, (now - (r0.last || now)) / 1000); r0.last = now;
      if (!r0.over && dt > 0) step(r0, dt);
      draw(r0);
      requestAnimationFrame(loop);
    });
  }

  function step(r, dt) {
    r.t += dt; r.bob += dt;
    const h = r.hook;
    // thuyền
    const mv = r.hold || (r.kL ? -1 : 0) + (r.kR ? 1 : 0);
    if (mv) r.boat = Math.max(90, Math.min(VW - 160, r.boat + mv * 420 * dt));
    const tipX = r.boat + 92;
    h.x += (tipX - h.x) * Math.min(1, dt * (h.st === 'idle' ? 20 : 6));
    if (h.zap > 0) h.zap -= dt;
    // lưỡi câu
    if (h.st === 'down') { h.y += (430 + r.rod * 60) * dt; if (h.y >= BOT - 10) { h.y = BOT - 10; h.st = 'up'; } }
    else if (h.st === 'up') {
      h.y -= (h.fish ? 360 + r.rod * 50 : 650) * dt;
      if (h.y <= SURF + 40) { h.y = SURF + 40; h.st = 'idle'; if (h.fish) land(r, h.fish); h.fish = null; }
    }
    // chạm cá / rác / sứa / xu khi lưỡi đang chìm hoặc đi lên không mang gì
    if (h.st !== 'idle' && !h.fish && h.zap <= 0) {
      const f = r.fish.find((o) => Math.abs(o.x - h.x) < o.s.size * 0.55 && Math.abs(o.y - h.y) < o.s.size * 0.38);
      if (f) { r.fish.splice(r.fish.indexOf(f), 1); h.fish = { ...f, hooked: true }; h.st = 'up'; r.fx.push({ x: h.x, y: h.y, t: 0, c: '#fff' }); if (navigator.vibrate) try { navigator.vibrate(20); } catch (e) { /* bỏ qua */ } }
      const tr = !h.fish && r.boot && r.trash.find((o) => Math.abs(o.x - h.x) < 30 && Math.abs(o.y - h.y) < 26);
      if (tr) { r.trash.splice(r.trash.indexOf(tr), 1); h.fish = { s: { f: r.boot, size: 44 }, x: h.x, y: h.y, dir: 1, ph: 0, hooked: true }; h.st = 'up'; }
      const j = r.jelly.find((o) => Math.hypot(o.x - h.x, o.y - h.y) < 40);
      if (j) { h.zap = 1.2; h.st = 'up'; r.fx.push({ x: h.x, y: h.y, t: 0, c: '#e599f7', text: '⚡ Bị sứa chích!' }); }
    }
    if (h.st === 'up' && h.fish && h.zap <= 0) {
      const j = r.jelly.find((o) => Math.hypot(o.x - h.x, o.y - h.y) < 44);
      if (j) { const lost = h.fish; h.fish = null; h.zap = 1.2; r.fx.push({ x: h.x, y: h.y, t: 0, c: '#e599f7', text: `⚡ Sứa làm sổng ${lost.s.f.icon}!` }); if (lost.s.f.id !== 'boot') r.fish.push({ ...lost, hooked: false, dir: Math.random() < 0.5 ? -1 : 1 }); }
    }
    for (const c of r.coins) if (h.st !== 'idle' && Math.hypot(c.x - h.x, c.y - h.y) < 34 && !c.got) { c.got = true; r.coinsGot += 5; r.opts.onCoin && r.opts.onCoin(5); r.fx.push({ x: c.x, y: c.y, t: 0, c: '#ffe066', text: '+5 xu' }); }
    r.coins = r.coins.filter((c) => !c.got && c.y > SURF + 20);
    // cá bơi
    for (const f of r.fish) {
      f.ph += dt; f.turn -= dt;
      f.x += f.dir * f.sp * dt; f.y += Math.sin(f.ph * 2) * 12 * dt;
      // thỉnh thoảng quay đầu giữa chừng
      if (f.turn <= 0) { f.turn = rnd(4, 10); if (Math.random() < 0.35) f.dir *= -1; }
    }
    r.fish = r.fish.filter((f) => f.x > -90 && f.x < VW + 90);
    while (r.fish.length < 8 + Math.min(3, r.rod)) spawn(r);
    // sứa + xu nổi lên
    if ((r.nextJelly -= dt) <= 0) { r.nextJelly = rnd(5, 9); spawnJelly(r); }
    if ((r.nextCoin -= dt) <= 0) { r.nextCoin = rnd(3, 6); spawnCoin(r); }
    r.jelly.forEach((j) => { j.ph += dt; j.y += j.vy * dt * (0.6 + 0.6 * Math.max(0, Math.sin(j.ph * 3))); j.x += Math.sin(j.ph) * 14 * dt; });
    r.jelly = r.jelly.filter((j) => j.y > SURF + 30);
    r.coins.forEach((c) => { c.ph += dt; c.y += c.vy * dt; c.x += Math.sin(c.ph * 2) * 20 * dt; });
    r.fx.forEach((f) => { f.t += dt; }); r.fx = r.fx.filter((f) => f.t < 1.2);
    if (r.t >= r.time && h.st === 'idle') finish(r);
    else if (r.t >= r.time + 6) { if (h.fish) land(r, h.fish); finish(r); }
  }
  function land(r, f) {
    const fish = f.s.f;
    r.bag[fish.id] = r.bag[fish.id] || { fish, n: 0 }; r.bag[fish.id].n++;
    if (fish.id !== 'boot') r.nCatch++;
    r.fx.push({ x: r.boat + 40, y: SURF - 120, t: 0, c: fish.id === 'boot' ? '#dee2e6' : '#8ce99a', text: fish.id === 'boot' ? '👢 Giày cũ 😂' : `+1 ${fish.icon} ${fish.name}`, big: 1 });
    try { r.opts.onCatch && r.opts.onCatch(fish); } catch (e) { console.error(e); }
  }
  function finish(r) {
    if (r.over) return;
    r.over = true;
    const card = el.querySelector('.fs-card'), items = Object.values(r.bag);
    card.hidden = false;
    card.innerHTML = `<div><div style="font-size:48px">🎣</div><h2>${r.nCatch >= 8 ? '🏆 Mẻ cá khủng!' : r.nCatch >= 4 ? '🎉 Câu giỏi lắm!' : r.nCatch ? '🙂 Hết giờ!' : '😅 Chưa được con nào'}</h2>
      <p>Câu được <b>${r.nCatch}</b> con${r.coinsGot ? ` · vớt được <b>${r.coinsGot} xu</b>` : ''}</p>
      <div class="fs-list">${items.map((o) => `<b>${o.fish.icon} ${o.fish.name} ×${o.n}</b>`).join('') || '<i>Không có gì…</i>'}</div>
      <p class="muted" style="font-size:12px">Cá đã vào túi đồ — mang ra chợ bán hoặc nấu ăn nhé!</p>
      <div class="fs-row"><button class="btn" data-again>🎣 Câu tiếp (−2 ⚡)</button><button class="btn ghost" data-done>Xong</button></div></div>`;
    card.querySelector('[data-again]').onclick = () => { if (r.opts.again && !r.opts.again()) return; session(r.opts); };
    card.querySelector('[data-done]').onclick = () => end(false);
  }
  function end(early) {
    const r = run; if (!r) return;
    if (early && !r.over && r.hook.fish) land(r, r.hook.fish);
    run = null; el.style.display = 'none';
    r.opts.onEnd && r.opts.onEnd({ caught: r.nCatch, coins: r.coinsGot });
  }

  /* ---------- vẽ ---------- */
  function emoji(c, ch, x, y, size, flip, rot = 0) {
    c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (flip) c.scale(-1, 1);
    c.font = `${size}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, 0, 0); c.restore();
  }
  function draw(r) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0b3d63'; g.fillRect(0, 0, cv.width, cv.height);
    g.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
    g.save(); g.beginPath(); g.rect(0, 0, VW, VH); g.clip();
    const sky = r.opts.sky, t = r.t, W = VW;
    // trời + núi
    const sk = g.createLinearGradient(0, 0, 0, SURF); sk.addColorStop(0, sky ? '#b197fc' : '#74c0fc'); sk.addColorStop(1, sky ? '#ffd8f0' : '#e7f5ff'); g.fillStyle = sk; g.fillRect(0, 0, W, SURF + 10);
    g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 5; i++) { const cx = ((i * 330 + t * 10) % (W + 300)) - 150, cy = 40 + (i % 3) * 26; [[0, 0, 26], [28, 6, 20], [-26, 8, 18]].forEach(([dx, dy, rr]) => { g.beginPath(); g.arc(cx + dx, cy + dy, rr, 0, Math.PI * 2); g.fill(); }); }
    if (!sky) { g.fillStyle = '#69b578'; g.beginPath(); g.moveTo(0, SURF); for (let x = 0; x <= W; x += 60) g.lineTo(x, SURF - 40 - Math.abs(Math.sin(x * 0.006)) * 60 - Math.sin(x * 0.021) * 10); g.lineTo(W, SURF); g.fill(); g.fillStyle = '#4f9a62'; g.beginPath(); g.moveTo(0, SURF); for (let x = 0; x <= W; x += 50) g.lineTo(x, SURF - 18 - Math.abs(Math.sin(x * 0.011 + 1)) * 30); g.lineTo(W, SURF); g.fill(); }
    // nước
    const wa = g.createLinearGradient(0, SURF, 0, VH); wa.addColorStop(0, sky ? '#d0bfff' : '#4fc3f7'); wa.addColorStop(0.5, sky ? '#9775fa' : '#1e88c7'); wa.addColorStop(1, sky ? '#5f3dc4' : '#0d4f86'); g.fillStyle = wa; g.fillRect(0, SURF, W, VH - SURF);
    // tia nắng
    g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 6; i++) { const x = ((i * 260 + Math.sin(t * 0.3 + i) * 40) % (W + 200)) - 100; g.beginPath(); g.moveTo(x, SURF); g.lineTo(x + 70, SURF); g.lineTo(x + 230, VH); g.lineTo(x + 120, VH); g.fill(); }
    // đáy cát + rong
    g.fillStyle = sky ? '#e5dbff' : '#e9d8a6'; g.beginPath(); g.moveTo(0, VH); for (let x = 0; x <= W; x += 40) g.lineTo(x, BOT + 18 + Math.sin(x * 0.02) * 8); g.lineTo(W, VH); g.fill();
    for (let i = 0; i < 14; i++) { const x = (i * 157 + 40) % W, hgt = 50 + (i * 37) % 60; g.strokeStyle = i % 2 ? '#2f9e44' : '#51cf66'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, BOT + 22); for (let s = 1; s <= 5; s++) g.lineTo(x + Math.sin(t * 1.5 + i + s * 0.8) * 8 * s / 5, BOT + 22 - hgt * s / 5); g.stroke(); }
    // bong bóng
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1.5; for (let i = 0; i < 18; i++) { const x = (i * 97) % W + Math.sin(t + i) * 6, y = VH - ((t * (30 + i % 5 * 10) + i * 61) % (VH - SURF)); g.beginPath(); g.arc(x, y, 3 + i % 4, 0, Math.PI * 2); g.stroke(); }
    // rác dưới đáy
    if (r.boot) r.trash.forEach((o) => emoji(g, r.boot.icon, o.x, o.y, 40, false, o.rot));
    // xu
    r.coins.forEach((c) => { const s = Math.abs(Math.cos(c.ph * 3)); g.fillStyle = '#fcc419'; g.strokeStyle = '#e67700'; g.lineWidth = 2; g.beginPath(); g.ellipse(c.x, c.y, 13 * Math.max(0.2, s), 13, 0, 0, Math.PI * 2); g.fill(); g.stroke(); });
    // sứa
    r.jelly.forEach((j) => {
      const p = 1 + Math.sin(j.ph * 3) * 0.12;
      g.fillStyle = 'rgba(229,153,247,.75)'; g.beginPath(); g.ellipse(j.x, j.y, 26 * p, 20 / p, 0, Math.PI, 0); g.fill();
      g.strokeStyle = 'rgba(229,153,247,.7)'; g.lineWidth = 3; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(j.x + i * 9, j.y); for (let s = 1; s <= 4; s++) g.lineTo(j.x + i * 9 + Math.sin(j.ph * 4 + s + i) * 4, j.y + s * 9); g.stroke(); }
    });
    // cá
    r.fish.forEach((f) => emoji(g, f.s.f.icon, f.x, f.y, f.s.size, f.dir > 0, Math.sin(f.ph * 6) * 0.06));
    // thuyền + người
    const h = r.hook, by = SURF - 6 + Math.sin(r.bob * 2) * 3, bx = r.boat;
    try { if (typeof ART !== 'undefined') ART.character(g, bx + 10, by - 20, r.opts.look || {}, { dir: 1, t: 0, moving: false, scale: 0.95 }); } catch (e) { /* bỏ qua */ }
    g.fillStyle = '#c92a2a'; g.beginPath(); g.moveTo(bx - 70, by - 26); g.lineTo(bx + 90, by - 26); g.quadraticCurveTo(bx + 80, by + 20, bx + 50, by + 22); g.lineTo(bx - 40, by + 22); g.quadraticCurveTo(bx - 66, by + 10, bx - 70, by - 26); g.fill();
    g.fillStyle = '#fff'; g.fillRect(bx - 66, by - 26, 152, 9); g.fillStyle = '#862e2e'; g.fillRect(bx - 50, by - 4, 120, 4);
    // cần câu + dây
    const tipX = bx + 92, tipY = by - 110;
    g.strokeStyle = '#5c3a1e'; g.lineWidth = 5; g.beginPath(); g.moveTo(bx + 24, by - 50); g.lineTo(tipX, tipY); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(tipX, tipY); g.quadraticCurveTo(tipX + (h.x - tipX) * 0.5, (tipY + h.y) / 2 + 10, h.x, h.y - 10); g.stroke();
    // phao + lưỡi
    g.fillStyle = '#ff6b6b'; g.beginPath(); g.ellipse(h.x, h.y - 22, 6, 9, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#fff'; g.fillRect(h.x - 6, h.y - 23, 12, 3);
    g.strokeStyle = h.zap > 0 ? '#e599f7' : '#adb5bd'; g.lineWidth = 3; g.beginPath(); g.moveTo(h.x, h.y - 13); g.lineTo(h.x, h.y + 4); g.arc(h.x - 6, h.y + 4, 6, 0, Math.PI); g.stroke();
    if (h.fish) emoji(g, h.fish.s.f.icon, h.x, h.y + h.fish.s.size * 0.42, h.fish.s.size, false, -Math.PI / 2 + Math.sin(t * 20) * 0.25);
    if (h.zap > 0) { g.strokeStyle = `rgba(255,236,153,${h.zap})`; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * 10; g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(h.x + Math.cos(a) * 30, h.y + Math.sin(a) * 30); g.stroke(); } }
    // hiệu ứng chữ
    r.fx.forEach((f) => {
      if (!f.text) { g.strokeStyle = `rgba(255,255,255,${1 - f.t / 1.2})`; g.lineWidth = 3; g.beginPath(); g.arc(f.x, f.y, 10 + f.t * 60, 0, Math.PI * 2); g.stroke(); return; }
      g.globalAlpha = Math.max(0, 1 - f.t / 1.2); g.font = `900 ${f.big ? 28 : 20}px "Be Vietnam Pro", system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,.5)'; g.strokeText(f.text, f.x, f.y - f.t * 40); g.fillStyle = f.c; g.fillText(f.text, f.x, f.y - f.t * 40); g.globalAlpha = 1;
    });
    // HUD: thời gian + số cá
    const left = Math.max(0, r.time - r.t), bw = Math.min(360, W * 0.3);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.roundRect(W / 2 - bw / 2 - 6, 12, bw + 12, 30, 15); g.fill();
    g.fillStyle = left < 10 ? '#ff6b6b' : '#69db7c'; g.beginPath(); g.roundRect(W / 2 - bw / 2, 18, bw * left / r.time, 18, 9); g.fill();
    g.fillStyle = '#fff'; g.font = '900 15px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`⏱️ ${Math.ceil(left)}s`, W / 2, 27);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.roundRect(12, 12, 200, 40, 20); g.fill();
    g.fillStyle = '#fff'; g.font = '900 18px "Be Vietnam Pro", system-ui'; g.textAlign = 'left'; g.fillText(`🐟 ${r.nCatch}   🪙 ${r.coinsGot}`, 28, 33);
    // nút ◀ ▶
    BTN().forEach((o) => { g.fillStyle = r.hold === o.k ? 'rgba(255,212,59,.6)' : 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(o.x, o.y, 44, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.stroke(); g.fillStyle = '#fff'; g.font = '900 30px system-ui'; g.textAlign = 'center'; g.fillText(o.k < 0 ? '◀' : '▶', o.x, o.y + 1); });
    if (r.hint && !r.over) {
      const msg = '👆 Chạm vào nước để thả lưỡi câu · kéo ngang để di chuyển thuyền';
      g.font = '800 18px "Be Vietnam Pro", system-ui'; const tw = g.measureText(msg).width + 36;
      g.fillStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.roundRect(W / 2 - tw / 2, VH * 0.5 - 22, tw, 44, 22); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(msg, W / 2, VH * 0.5);
    }
    g.restore();
  }
  return { session, get active() { return !!run; }, _run: () => run };
})();
