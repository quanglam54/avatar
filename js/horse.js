/* Trường Đua Ngựa: 6 con ngựa chạy 2 vòng đường đua bầu dục, người chơi cược con về nhất.
   Chạy theo giờ thật + hạt giống theo số lượt đua → mọi người cùng xem một cuộc đua, cùng kết quả. */
const HORSE = (() => {
  const HORSES = [
    { name: 'Xích Thố', coat: '#a0522d', mane: '#5c2a12', silk: '#e03131' },
    { name: 'Ô Vân', coat: '#2b2b33', mane: '#111114', silk: '#1c7ed6' },
    { name: 'Bạch Long', coat: '#f1f3f5', mane: '#ced4da', silk: '#2f9e44' },
    { name: 'Hoàng Phong', coat: '#d9a441', mane: '#8a5a1c', silk: '#7048e8' },
    { name: 'Tia Chớp', coat: '#9aa3b0', mane: '#495057', silk: '#fcc419' },
    { name: 'Gió Lốc', coat: '#6b4226', mane: '#2b1a10', silk: '#f76707' },
  ];
  const BET = 25, RACE = 24, SHOW = 8, ROUND = BET + RACE + SHOW, LAPS = 2, STEP = 0.05;
  const TRACK = { x: 1000, y: 700, rx0: 425, ry0: 150, dx: 27, dy: 12 };

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const nowS = () => Date.now() / 1000;

  /** Phong độ từng con trong lượt đua r (người chơi thấy được để chọn) */
  function form(r) {
    const R = rng(r * 4243 + 99);
    return HORSES.map(() => 0.965 + R() * 0.07);
  }
  /** Mô phỏng cuộc đua: tiến độ (số vòng) từng con theo thời gian + thời gian về đích */
  function simulate(fm, seed) {
    const R = rng(seed);
    const waves = fm.map(() => [0, 1, 2].map(() => ({ a: 0.08 + R() * 0.16, f: 0.2 + R() * 0.7, p: R() * 6.28 })));
    const kick = fm.map(() => ({ at: 0.55 + R() * 0.35, k: R() * 0.3 }));
    const prog = fm.map(() => [0]), fin = fm.map(() => Infinity);
    const base = LAPS / 19.5;
    for (let s = 1, t = STEP; t <= RACE + 2; s++, t += STEP) {
      fm.forEach((f, h) => {
        const last = prog[h][s - 1];
        if (last >= LAPS) { prog[h].push(LAPS); return; }
        let v = base * f;
        waves[h].forEach((w) => { v += base * w.a * Math.sin(t * w.f + w.p); });
        if (last / LAPS > kick[h].at) v += base * kick[h].k;
        const nx = Math.min(LAPS, last + v * STEP * (t < 1 ? t : 1));
        prog[h].push(nx);
        if (nx >= LAPS && fin[h] === Infinity) fin[h] = t;
      });
    }
    const order = fm.map((_, h) => h).sort((a, b) => fin[a] - fin[b]);
    return { prog, fin, order, win: order[0], end: fin[order[0]] };
  }

  const cache = new Map();
  function race(r) {
    if (cache.has(r)) return cache.get(r);
    const fm = form(r);
    const wins = fm.map(() => 0);
    for (let k = 0; k < 60; k++) wins[simulate(fm, r * 1000 + 300 + k).win]++;
    const odds = wins.map((w) => Math.round(Math.min(15, Math.max(1.3, 0.9 / Math.max(0.05, w / 60))) * 10) / 10);
    const res = { r, fm, odds, sim: simulate(fm, r * 1000 + 11) };
    cache.set(r, res);
    if (cache.size > 20) cache.delete(cache.keys().next().value);
    return res;
  }
  function state() {
    const s = nowS(), r = Math.floor(s / ROUND), into = s - r * ROUND, info = race(r);
    if (into < BET) return { ...info, phase: 'bet', left: BET - into };
    if (into < BET + RACE) return { ...info, phase: 'race', rt: into - BET, left: BET + RACE - into };
    return { ...info, phase: 'show', rt: RACE, left: ROUND - into };
  }
  const finished = (r) => nowS() >= r * ROUND + BET + race(r).sim.end + 1;
  const progAt = (sim, h, t) => sim.prog[h][Math.max(0, Math.min(sim.prog[h].length - 1, Math.floor(t / STEP)))];
  /** Thứ hạng hiện tại (ai dẫn đầu) */
  function standings(st) {
    const t = st.phase === 'bet' ? 0 : st.rt;
    return HORSES.map((_, h) => h).sort((a, b) => (progAt(st.sim, b, t) - progAt(st.sim, a, t)) || (st.sim.fin[a] - st.sim.fin[b]));
  }

  /* ---------- Cược ---------- */
  const pool = { r: -1, v: [0, 0, 0, 0, 0, 0] };
  function addPool(r, h, amt) { if (pool.r !== r) { pool.r = r; pool.v = [0, 0, 0, 0, 0, 0]; } pool.v[h] += amt; }
  function placeBet(h, amt) {
    const S = AV.S, st = state();
    amt = Math.floor(amt);
    if (st.phase !== 'bet') { UI.toast('⏳ Đã xuất phát rồi, đợi lượt đua sau nhé!'); return false; }
    if (!(amt > 0)) { UI.toast('Nhập số xu muốn cược'); return false; }
    if (amt > S.coins) { UI.toast(`Không đủ xu 😢 (bạn có ${S.coins.toLocaleString('vi-VN')} xu)`); return false; }
    const cur = S.horseBet && S.horseBet.r === st.r ? S.horseBet : null;
    if (cur && cur.h !== h) { UI.toast(`Lượt này bạn đã cược ${HORSES[cur.h].name} rồi — mỗi lượt chỉ cược 1 con`); return false; }
    S.coins -= amt;
    S.horseBet = { r: st.r, h, amt: (cur ? cur.amt : 0) + amt, odds: st.odds[h] };
    addPool(st.r, h, amt);
    AV.markChanged(); UI.updateHud();
    UI.toast(`🏇 Đã cược ${amt.toLocaleString('vi-VN')} xu cho ${HORSES[h].name} (x${st.odds[h]})`, 3000);
    if (NET.sendHorse) NET.sendHorse({ r: st.r, h, amt, name: S.name });
    return true;
  }
  function onNet(m) {
    const r = +m.r, h = Math.max(0, Math.min(5, Math.floor(+m.h || 0))), amt = Math.max(0, Math.floor(+m.amt || 0));
    if (!amt || r !== state().r) return;
    addPool(r, h, amt);
    UI.chatLog('', `🏇 ${String(m.name || 'Ai đó').slice(0, 16)} cược ${amt.toLocaleString('vi-VN')} xu cho ${HORSES[h].name}`, false, true);
  }
  function settle() {
    const S = AV.S, b = S && S.horseBet;
    if (!b || !finished(b.r)) return;
    const res = race(b.r), name = HORSES[b.h].name;
    S.horseBet = null;
    const log = S.horseLog = (S.horseLog || []).slice(-9);
    if (res.sim.win === b.h) {
      const pay = Math.floor(b.amt * b.odds);
      S.coins += pay;
      log.push({ f: name, amt: b.amt, pay });
      UI.toast(`🏆 ${name} VỀ NHẤT! Bạn ăn ${pay.toLocaleString('vi-VN')} xu (cược ${b.amt.toLocaleString('vi-VN')} × ${b.odds})`, 5000);
      if (pay >= 1000) NET.sendSys(`${S.name} vừa thắng ${pay.toLocaleString('vi-VN')} xu ở Trường Đua Ngựa nhờ cược ${name} 🏇`);
    } else {
      const pos = res.sim.order.indexOf(b.h) + 1;
      log.push({ f: name, amt: b.amt, pay: 0 });
      UI.toast(`😢 ${name} về thứ ${pos}… mất ${b.amt.toLocaleString('vi-VN')} xu`, 4000);
    }
    AV.markChanged(); UI.updateHud();
  }

  /* ---------- Thanh thông tin ---------- */
  let bar = null, barKey = '';
  function updateBar() {
    const here = AV.currentMap && AV.currentMap() === 'horse';
    if (!bar) { bar = document.createElement('div'); bar.className = 'arena-bar horse-bar'; document.body.appendChild(bar); bar.addEventListener('click', (e) => { if (e.target.closest('[data-hbet]')) panel(); }); }
    bar.style.display = here ? 'flex' : 'none';
    if (!here) return;
    const st = state(), S = AV.S, my = S.horseBet && S.horseBet.r === st.r ? S.horseBet : null;
    const top = standings(st).slice(0, 3);
    const status = st.phase === 'bet' ? `🔔 Mở cược · còn ${Math.ceil(st.left)}s` : st.phase === 'race' ? '🏇 Đang đua!' : `🏆 ${HORSES[st.sim.win].name} về nhất!`;
    const mine = my ? `Bạn cược <b>${my.amt.toLocaleString('vi-VN')}</b> xu cho ${HORSES[my.h].name} (x${my.odds})` : st.phase === 'bet' ? 'Chưa cược lượt này' : '';
    const key = [st.r, st.phase, Math.ceil(st.left), top.join(), mine].join('|');
    if (key === barKey) return;
    barKey = key;
    const rank = st.phase === 'bet' ? '' : `<div class="hb-rank">${top.map((h, i) => `<span><b style="background:${HORSES[h].silk}">${i + 1}</b>${HORSES[h].name}</span>`).join('')}</div>`;
    bar.innerHTML = `<div class="ab-mid"><div class="ab-st">${status}</div>${rank}<small>${mine}</small>${st.phase === 'bet' ? '<button class="btn small" data-hbet>💰 Đặt cược</button>' : ''}</div>`;
  }

  /* ---------- Bảng đặt cược ---------- */
  function panel() {
    const S = AV.S;
    let amt = 100, lastKey = '';
    const p = UI.panel('🏇 Trường Đua Ngựa · Đặt cược', '', { wide: true });
    const render = (force) => {
      const st = state(), my = S.horseBet && S.horseBet.r === st.r ? S.horseBet : null;
      const tEl = p.body.querySelector('[data-time]');
      if (tEl) tEl.textContent = st.phase === 'bet' ? `🔔 Còn ${Math.ceil(st.left)} giây trước khi xuất phát` : st.phase === 'race' ? '🏇 Đang đua — đợi lượt sau' : `🏆 ${HORSES[st.sim.win].name} về nhất! Lượt mới sau ${Math.ceil(st.left)}s`;
      const key = [st.r, st.phase, my && my.amt, S.coins].join('|');
      if (!force && key === lastKey) return;
      lastKey = key;
      const stars = (f) => '★'.repeat(1 + Math.round((f - 0.965) / 0.0175)) || '☆';
      p.body.innerHTML = `<div class="coins-line">💰 ${S.coins.toLocaleString('vi-VN')} xu</div>
        <p class="ar-time" data-time></p>
        <div class="hr-list">${HORSES.map((hs, h) => `<div class="hr-row ${my && my.h === h ? 'mine' : ''}">
          <span class="hr-silk" style="background:${hs.silk}">${h + 1}</span>
          <canvas data-hpv="${h}"></canvas>
          <div class="info"><b>${hs.name}</b><small>Phong độ ${stars(st.fm[h])}</small></div>
          <div class="ar-odds">x${st.odds[h]}</div>
          <button class="btn small" data-h="${h}" ${st.phase !== 'bet' || (my && my.h !== h) ? 'disabled' : ''}>Cược</button></div>`).join('')}</div>
        <label class="muted">Số xu cược</label>
        <div class="chips">${[100, 500, 1000, 5000, 10000, 50000, 100000].map((v) => `<button class="chip ${amt === v ? 'on' : ''}" data-amt="${v}">${v.toLocaleString('vi-VN')}</button>`).join('')}<button class="chip" data-all>🔥 Tất tay</button></div>
        <input class="field" type="number" min="1" data-amtin value="${amt}" style="margin-top:8px">
        ${my ? `<p class="ar-mine">✅ Bạn đã cược <b>${my.amt.toLocaleString('vi-VN')} xu</b> cho ${HORSES[my.h].name} — về nhất nhận <b>${Math.floor(my.amt * my.odds).toLocaleString('vi-VN')} xu</b>.</p>` : ''}
        <p class="muted small-note">Mỗi lượt: 25 giây đặt cược → 6 ngựa chạy 2 vòng → con về nhất thắng. Cược đúng nhận xu × tỉ lệ. Ra ngoài vẫn được trả thưởng.</p>
        ${(S.horseLog || []).length ? `<div class="ar-log">${S.horseLog.slice().reverse().map((l) => `<span class="${l.pay ? 'w' : 'l'}">${l.pay ? '🏆 +' + l.pay.toLocaleString('vi-VN') : '❌ −' + l.amt.toLocaleString('vi-VN')} · ${l.f}</span>`).join('')}</div>` : ''}`;
      p.body.querySelectorAll('[data-hpv]').forEach((cv) => {
        const h = +cv.dataset.hpv, g = cv.getContext('2d'), d = Math.min(2, devicePixelRatio || 1);
        cv.width = 76 * d; cv.height = 50 * d; g.setTransform(d * 0.62, 0, 0, d * 0.62, 38 * d, 46 * d);
        draw(g, 0, 0, 1, 0, h);
      });
      p.body.querySelectorAll('[data-amt]').forEach((b) => b.onclick = () => { amt = +b.dataset.amt; render(true); });
      p.body.querySelector('[data-all]').onclick = () => { amt = S.coins; render(true); };
      const inp = p.body.querySelector('[data-amtin]');
      inp.oninput = () => { amt = Math.max(0, Math.floor(+inp.value || 0)); };
      p.body.querySelectorAll('[data-h]').forEach((b) => b.onclick = () => { if (placeBet(+b.dataset.h, amt)) render(true); });
      render(false);
    };
    render(true);
    const timer = setInterval(() => render(false), 400);
    p.onClose = () => clearInterval(timer);
  }

  /* ---------- Vẽ ---------- */
  /** Ngựa phi + nài ngựa áo màu, số trên yên. (x,y) = điểm giữa chân */
  function draw(c, x, y, dir, t, h) {
    const hs = HORSES[h], run = t > 0 ? t * 16 : 0;
    c.save(); c.translate(x, y); c.scale(dir, 1);
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, 0, 38, 7, 0, 0, Math.PI * 2); c.fill();
    const leg = (lx, ph) => { const a = Math.sin(run + ph) * 0.6; c.save(); c.translate(lx, -26); c.rotate(a); c.fillStyle = hs.coat; c.fillRect(-3, 0, 6, 24); c.fillStyle = '#2b1a10'; c.fillRect(-3, 21, 6, 4); c.restore(); };
    leg(-22, 0); leg(18, 2.4);
    // đuôi
    c.strokeStyle = hs.mane; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-32, -38); c.quadraticCurveTo(-48, -36 + Math.sin(run) * 4, -50, -22); c.stroke();
    // thân + cổ + đầu
    c.fillStyle = hs.coat;
    c.beginPath(); c.ellipse(0, -38, 34, 15, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(20, -46); c.quadraticCurveTo(32, -66, 40, -70); c.lineTo(48, -62); c.quadraticCurveTo(36, -50, 30, -32); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(46, -66, 12, 7, 0.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = hs.mane; c.beginPath(); c.moveTo(22, -50); c.quadraticCurveTo(30, -70, 40, -76); c.lineTo(36, -64); c.quadraticCurveTo(30, -56, 26, -46); c.closePath(); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(45, -69, 1.8, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-6, -46, 20, 5, 0, 0, Math.PI * 2); c.fill();
    leg(-16, 1.2); leg(24, 3.6);
    // khăn yên có số
    c.fillStyle = '#fff'; c.fillRect(-14, -48, 22, 16);
    c.fillStyle = hs.silk; c.font = '900 13px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.save(); c.scale(dir, 1); c.fillText(String(h + 1), -3 * dir, -40); c.restore();
    // nài ngựa
    c.fillStyle = hs.silk; c.beginPath(); c.ellipse(4, -60, 9, 11, -0.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.fillRect(-2, -52, 10, 6);
    c.fillStyle = '#ffd8b5'; c.beginPath(); c.arc(10, -75, 6.5, 0, Math.PI * 2); c.fill();
    c.fillStyle = hs.silk; c.beginPath(); c.arc(10, -77, 7, Math.PI, 0); c.fill(); c.fillRect(10, -78, 9, 2.5);
    c.strokeStyle = '#2b1a10'; c.lineWidth = 2; c.beginPath(); c.moveTo(12, -60); c.lineTo(38, -64); c.stroke();
    c.restore();
  }
  const lane = (h) => ({ rx: TRACK.rx0 + h * TRACK.dx, ry: TRACK.ry0 + h * TRACK.dy });
  /** Vẽ cả 6 con theo vị trí hiện tại (con ở xa vẽ trước) */
  function drawRace(ctx, t) {
    const st = state(), rt = st.phase === 'bet' ? 0 : st.rt;
    const P = HORSES.map((_, h) => {
      const pr = progAt(st.sim, h, rt), L = lane(h);
      const th = Math.PI / 2 - pr * Math.PI * 2;
      const x = TRACK.x + Math.cos(th) * L.rx, y = TRACK.y + Math.sin(th) * L.ry;
      const dir = Math.sin(th) >= 0 ? 1 : -1;
      const moving = st.phase === 'race' && pr < LAPS;
      return { h, x, y, dir, moving };
    }).sort((a, b) => a.y - b.y);
    P.forEach((p) => draw(ctx, p.x, p.y, p.dir, p.moving ? t + p.h : 0, p.h));
    let big = '';
    if (st.phase === 'bet') big = st.left < 4 ? `${Math.ceil(st.left)}` : '🏇 ĐẶT CƯỢC!';
    else if (st.phase === 'race' && st.rt < 1.2) big = 'XUẤT PHÁT!';
    else if (st.phase === 'race' && st.rt > st.sim.end) big = `🏁 ${HORSES[st.sim.win].name} về nhất!`;
    else if (st.phase === 'show') big = `🏆 ${HORSES[st.sim.win].name}`;
    if (big) {
      ctx.font = `900 ${big.length > 14 ? 40 : 54}px "Be Vietnam Pro", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 9; ctx.strokeStyle = '#2a1405'; ctx.strokeText(big, TRACK.x, TRACK.y);
      ctx.fillStyle = '#ffd43b'; ctx.fillText(big, TRACK.x, TRACK.y);
    }
  }
  /** Nền đường đua (vẽ một lần vào nền bản đồ) */
  function ground(g) {
    const o = lane(5), i0 = lane(0);
    g.fillStyle = '#b5835a'; g.beginPath(); g.ellipse(TRACK.x, TRACK.y, o.rx + 26, o.ry + 18, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#6fbf4a'; g.beginPath(); g.ellipse(TRACK.x, TRACK.y, i0.rx - 26, i0.ry - 18, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 1.5;
    for (let h = 0; h < 5; h++) { const L = lane(h); g.beginPath(); g.ellipse(TRACK.x, TRACK.y, L.rx + 13, L.ry + 7, 0, 0, Math.PI * 2); g.stroke(); }
    g.strokeStyle = '#fff'; g.lineWidth = 5;
    g.beginPath(); g.ellipse(TRACK.x, TRACK.y, o.rx + 26, o.ry + 18, 0, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.ellipse(TRACK.x, TRACK.y, i0.rx - 26, i0.ry - 18, 0, 0, Math.PI * 2); g.stroke();
    // vạch đích ô cờ
    const y0 = TRACK.y + i0.ry - 18, y1 = TRACK.y + o.ry + 18;
    for (let yy = y0, k = 0; yy < y1; yy += 8, k++) for (let c = 0; c < 2; c++) { g.fillStyle = (k + c) % 2 ? '#111' : '#fff'; g.fillRect(TRACK.x - 8 + c * 8, yy, 8, 8); }
    // giữa sân: chữ + bồn hoa
    g.font = '900 54px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText('HÀ NỘI DERBY', TRACK.x, TRACK.y - 60);
    [[-200, 40], [200, 40], [0, 90]].forEach(([dx, dy]) => { g.fillStyle = '#2f9e44'; g.beginPath(); g.ellipse(TRACK.x + dx, TRACK.y + dy, 46, 18, 0, 0, Math.PI * 2); g.fill(); ['#ff6b6b', '#ffd43b', '#f783ac'].forEach((col, k) => { g.fillStyle = col; g.beginPath(); g.arc(TRACK.x + dx - 22 + k * 22, TRACK.y + dy - 4, 6, 0, Math.PI * 2); g.fill(); }); });
  }
  /** Bảng xếp hạng trực tiếp trên khán đài */
  function board(ctx, x, y) {
    const st = state(), top = standings(st);
    ctx.fillStyle = '#1b3d2a'; ctx.beginPath(); ctx.roundRect(x - 360, y - 62, 720, 124, 14); ctx.fill();
    ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 5; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 22px "Be Vietnam Pro", system-ui'; ctx.fillStyle = '#ffd43b';
    ctx.fillText(st.phase === 'bet' ? `🏇 XUẤT PHÁT SAU ${Math.ceil(st.left)}s` : st.phase === 'race' ? '🏇 ĐANG ĐUA' : `🏆 ${HORSES[st.sim.win].name.toUpperCase()} VỀ NHẤT`, x, y - 36);
    top.forEach((h, i) => {
      const cx = x - 300 + i * 120;
      ctx.fillStyle = HORSES[h].silk; ctx.beginPath(); ctx.roundRect(cx - 52, y - 12, 104, 56, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '900 15px "Be Vietnam Pro", system-ui'; ctx.fillText(`${st.phase === 'bet' ? '#' + (h + 1) : i + 1 + '.'} ${HORSES[h].name}`, cx, y + 6);
      ctx.font = '800 14px "Be Vietnam Pro", system-ui'; ctx.fillText(`x${st.odds[h]}`, cx, y + 28);
    });
  }
  /** Toà nhà Trường Đua Ngựa ở Khu giải trí */
  function building(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 4, 190, 20, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#b3541e'; c.fillRect(x - 170, y - 170, 340, 170);
    c.strokeStyle = '#7a3410'; c.lineWidth = 3; for (let yy = y - 160; yy < y; yy += 16) { c.beginPath(); c.moveTo(x - 170, yy); c.lineTo(x + 170, yy); c.stroke(); }
    c.fillStyle = '#2f9e44'; c.beginPath(); c.moveTo(x - 190, y - 166); c.lineTo(x, y - 260); c.lineTo(x + 190, y - 166); c.closePath(); c.fill();
    c.strokeStyle = '#1e6e31'; c.lineWidth = 4; c.stroke();
    // cửa chuồng chữ X
    c.fillStyle = '#f8f9fa'; c.fillRect(x - 60, y - 120, 120, 120);
    c.fillStyle = '#5c2a12'; c.fillRect(x - 52, y - 112, 104, 112);
    c.strokeStyle = '#f8f9fa'; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 52, y - 112); c.lineTo(x + 52, y); c.moveTo(x + 52, y - 112); c.lineTo(x - 52, y); c.stroke();
    // móng ngựa + biển
    c.strokeStyle = '#ffd43b'; c.lineWidth = 8; c.beginPath(); c.arc(x, y - 200, 18, 0.2, Math.PI - 0.2, true); c.stroke();
    c.fillStyle = '#1b3d2a'; c.beginPath(); c.roundRect(x - 165, y - 166, 330, 40, 10); c.fill();
    c.strokeStyle = '#ffd43b'; c.lineWidth = 3; c.stroke();
    c.font = '900 24px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffd43b';
    c.fillText('🏇 TRƯỜNG ĐUA NGỰA', x, y - 146);
    // hàng rào trắng 2 bên
    [-1, 1].forEach((sd) => { c.fillStyle = '#fff'; for (let k = 0; k < 3; k++) c.fillRect(x + sd * (80 + k * 28) - 3, y - 60, 6, 60); c.fillRect(x + sd * 80 - (sd < 0 ? 62 : 0), y - 50, 62, 6); c.fillRect(x + sd * 80 - (sd < 0 ? 62 : 0), y - 28, 62, 6); });
  }

  setInterval(() => { try { settle(); updateBar(); } catch (e) { /* chưa sẵn sàng */ } }, 500);
  return { HORSES, TRACK, state, placeBet, onNet, panel, drawRace, ground, board, building, race, ROUND };
})();
