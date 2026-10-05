/* Đua xe ở Khu Đua Xe: xe nhìn từ trên xuống, 3 vòng.
 * Đua một mình: có 3 xe máy đua cùng. Nhiều người bấm "Sẵn sàng" trong cùng lượt đếm ngược sẽ đua chung (qua kênh Realtime của khu). */
const RACE = (() => {
  const LAPS = 3, W = 150, LOBBY_MS = 10000;
  const CARS = [
    { id: 'basic', name: 'Xe cơ bản', price: 0, speed: 1.0 },
    { id: 'sport', name: 'Xe thể thao', price: 400, speed: 1.06, lvl: 3 },
    { id: 'f1', name: 'Xe đua F1', price: 1200, speed: 1.12, lvl: 6 },
  ];
  const COLORS = ['#e03131', '#1971c2', '#2f9e44', '#f59f00', '#7048e8', '#e64980', '#212529', '#f8f9fa'];
  const PRIZE = [[20, 30], [10, 20], [5, 12], [2, 8]];
  const BOTS = [{ name: 'Máy Tí', color: '#fd7e14' }, { name: 'Máy Tèo', color: '#15aabf' }, { name: 'Máy Bin', color: '#82c91e' }];

  /* ---------- Đường đua: đường cong khép kín ---------- */
  const CTRL = [[400, 300], [1100, 220], [1800, 260], [2150, 520], [2050, 900], [1650, 1000], [1400, 820], [1050, 860], [900, 1180], [1300, 1380], [2000, 1350], [2250, 1500], [1500, 1650], [600, 1600], [250, 1250], [300, 750]];
  const PATH = (() => {
    const pts = [], n = CTRL.length;
    for (let i = 0; i < n; i++) {
      const p0 = CTRL[(i - 1 + n) % n], p1 = CTRL[i], p2 = CTRL[(i + 1) % n], p3 = CTRL[(i + 2) % n];
      for (let k = 0; k < 28; k++) {
        const t = k / 28, t2 = t * t, t3 = t2 * t;
        pts.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    return pts;
  })();
  const N = PATH.length;
  const TW = 2500, TH = 1900;
  const dirAt = (i) => { const a = PATH[i], b = PATH[(i + 1) % N]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  const curveAt = (i) => { let d = dirAt((i + 10) % N) - dirAt(i); while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };

  function nearest(x, y, hint) {
    let best = hint, bd = Infinity;
    const scan = hint == null ? N : 40;
    for (let k = -scan; k <= scan; k++) {
      const i = hint == null ? (k + N) % N : (hint + k + N) % N;
      const d = (PATH[i][0] - x) ** 2 + (PATH[i][1] - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return { i: best, d: Math.sqrt(bd) };
  }

  let trackImg = null;
  function buildTrack() {
    const c = document.createElement('canvas');
    c.width = TW; c.height = TH;
    const g = c.getContext('2d');
    g.fillStyle = '#5fb83a'; g.fillRect(0, 0, TW, TH);
    const r = ART.srand(42);
    for (let i = 0; i < 900; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'; g.beginPath(); g.arc(r() * TW, r() * TH, 10 + r() * 30, 0, 7); g.fill(); }
    const stroke = (w, col, dash) => {
      g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round';
      g.setLineDash(dash || []);
      g.beginPath(); PATH.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.stroke();
      g.setLineDash([]);
    };
    stroke(W + 60, '#d9c48f');
    stroke(W + 22, '#e03131');
    stroke(W + 22, '#ffffff', [28, 28]);
    stroke(W, '#56606b');
    stroke(W - 8, '#626d78');
    stroke(4, 'rgba(255,255,255,.75)', [30, 30]);
    // vạch xuất phát
    const [sx, sy] = PATH[0], a = dirAt(0);
    g.save(); g.translate(sx, sy); g.rotate(a);
    for (let row = 0; row < 2; row++) for (let k = -W / 2; k < W / 2; k += 15) {
      g.fillStyle = ((k + W / 2) / 15 + row) % 2 < 1 ? '#fff' : '#111';
      g.fillRect(-15 + row * 15, k, 15, 15);
    }
    g.restore();
    // cây trang trí
    for (let i = 0; i < 140; i++) {
      const x = r() * TW, y = r() * TH;
      if (nearest(x, y).d < W / 2 + 90) continue;
      g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(x + 6, y + 10, 24, 10, 0, 0, 7); g.fill();
      g.fillStyle = '#2b8a3e'; g.beginPath(); g.arc(x, y, 22, 0, 7); g.fill();
      g.fillStyle = '#40c057'; g.beginPath(); g.arc(x - 5, y - 5, 15, 0, 7); g.fill();
    }
    trackImg = c;
  }

  /* ---------- Trạng thái ---------- */
  let open = false, phase = 'lobby', raf = 0, last = 0, joined = false;
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let startAt = 0, me = null, cars = [], remote = new Map(), finishers = [], results = null, sendT = 0;
  const keys = { left: false, right: false, brake: false, gas: false };
  const $ = (s) => document.querySelector(s);
  const S = () => AV.S;
  const car = () => CARS.find((c) => c.id === (S().car || 'basic')) || CARS[0];

  function newCar(name, color, slot, opts = {}) {
    const back = 10 + Math.floor(slot / 2) * 8, side = (slot % 2 ? 1 : -1) * 34;
    const i = (N - back) % N, a = dirAt(i);
    return {
      name, color, x: PATH[i][0] - Math.sin(a) * side, y: PATH[i][1] + Math.cos(a) * side, a, v: 0, idx: i, lap: 0,
      prog: -back, done: null, ...opts,
    };
  }

  function resetRace(humans) {
    cars = [];
    me = newCar(S().name, S().carColor || COLORS[0], 0, { mine: true, speedK: car().speed });
    cars.push(me);
    if (humans.length === 0) BOTS.forEach((b, k) => cars.push(newCar(b.name, b.color, k + 1, { bot: true, speedK: 0.9 + Math.random() * 0.1, wob: Math.random() * 6 })));
    finishers = []; results = null;
  }

  /* ---------- Vật lý ---------- */
  function stepCar(c, dt) {
    const base = 520 * (c.speedK || 1);
    const n = nearest(c.x, c.y, c.idx);
    const off = n.d > W / 2 - 6;
    let steer = 0, throttle = 1;
    if (c.bot) {
      const ahead = PATH[(n.i + 14) % N];
      let want = Math.atan2(ahead[1] - c.y, ahead[0] - c.x) - c.a + Math.sin(performance.now() / 900 + c.wob) * 0.04;
      while (want > Math.PI) want -= 2 * Math.PI; while (want < -Math.PI) want += 2 * Math.PI;
      steer = Math.max(-1, Math.min(1, want * 3));
      if (curveAt(n.i) > 0.7 && c.v > base * 0.62) throttle = -0.3;
    } else if (c.mine) {
      steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      throttle = keys.brake ? -1 : 1;
    }
    const maxV = off ? base * 0.45 : base;
    c.v += (throttle > 0 ? 340 * throttle : 600 * throttle) * dt;
    if (c.v > maxV) c.v = Math.max(maxV, c.v - 700 * dt);
    c.v = Math.max(0, c.v);
    c.a += steer * dt * (1.4 + 1.6 * Math.min(1, c.v / base)) * (c.v > 20 ? 1 : 0);
    c.x += Math.cos(c.a) * c.v * dt;
    c.y += Math.sin(c.a) * c.v * dt;
    if (n.d > W / 2 + 110) { const p = PATH[n.i]; c.x += (p[0] - c.x) * 0.08; c.y += (p[1] - c.y) * 0.08; c.v *= 0.92; }
    c.x = Math.max(20, Math.min(TW - 20, c.x)); c.y = Math.max(20, Math.min(TH - 20, c.y));
    const prev = c.idx;
    c.idx = nearest(c.x, c.y, c.idx).i;
    let d = c.idx - prev;
    if (d < -N / 2) d += N; else if (d > N / 2) d -= N;
    c.prog += d;
    c.lap = Math.floor(c.prog / N);
    if (c.lap >= LAPS && !c.done) {
      c.done = (performance.now() - startAt) / 1000;
      finishers.push({ name: c.name, time: c.done, mine: !!c.mine, bot: !!c.bot });
      if (c.mine) { NET.sendRace({ a: 'fin', start: S().raceStart, time: c.done, name: c.name }); onFinish(); }
    }
  }

  function rankList() {
    const all = cars.map((c) => ({ name: c.name, prog: c.done ? 1e9 - c.done : c.prog, mine: c.mine }));
    remote.forEach((r) => all.push({ name: r.name, prog: r.done ? 1e9 - r.done : r.prog }));
    return all.sort((a, b) => b.prog - a.prog);
  }

  function onFinish() {
    setTimeout(() => { if (phase === 'race') endRace(); }, 6000);
    if (remote.size === 0 && cars.every((c) => c.done || c.bot)) setTimeout(endRace, 2500);
  }

  function endRace() {
    if (phase !== 'race') return;
    phase = 'result';
    const order = rankList();
    const place = order.findIndex((o) => o.mine);
    const [coins, xp] = PRIZE[Math.min(place, 3)];
    const time = me.done;
    const best = S().bestRace;
    if (time && (!best || time < best)) S().bestRace = time;
    AV.earn(coins, xp);
    results = { order, place, coins, xp, time, newBest: time && (!best || time < best) };
    AV.quest && AV.quest('race');
    renderUI();
  }

  /* ---------- Mạng ---------- */
  function onNet(m) {
    if (!open) return;
    if (m.a === 'ask' && phase === 'lobby' && joined && S().raceStart > Date.now()) {
      NET.sendRace({ a: 'lobby', start: S().raceStart, name: S().name, color: S().carColor || COLORS[0] });
    } else if (m.a === 'lobby') {
      if (phase !== 'lobby' || !m.start || m.start < Date.now()) return;
      if (S().raceStart && Math.abs(m.start - S().raceStart) > 800 && m.start > S().raceStart) return;
      if (!S().raceStart || m.start < S().raceStart) { S().raceStart = m.start; startAt = 0; }
      remote.set(m.id, { name: String(m.name).slice(0, 16), color: String(m.color).slice(0, 9), x: 0, y: 0, a: 0, prog: -10, done: null });
      renderUI();
    } else if (m.a === 'pos' && remote.has(m.id)) {
      const r = remote.get(m.id);
      r.tx = +m.x; r.ty = +m.y; r.a = +m.ang; r.prog = +m.p;
      if (r.x === 0) { r.x = r.tx; r.y = r.ty; }
    } else if (m.a === 'fin' && remote.has(m.id)) {
      const r = remote.get(m.id);
      r.done = +m.time;
      finishers.push({ name: r.name, time: r.done });
    } else if (m.a === 'quit') {
      remote.delete(m.id);
      if (phase === 'lobby') renderUI();
    }
  }

  /* ---------- Vòng lặp ---------- */
  function loop(t) {
    if (!open) return;
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    if (phase === 'lobby' && S().raceStart && !joined && Date.now() >= S().raceStart - 3000) { S().raceStart = 0; remote.clear(); renderUI(); }
    if (phase === 'lobby' && joined && S().raceStart && Date.now() >= S().raceStart - 3000) {
      phase = 'count';
      resetRace([...remote.values()]);
      startAt = performance.now() + (S().raceStart - Date.now());
      renderUI();
    }
    if (phase === 'count' && performance.now() >= startAt) { phase = 'race'; renderUI(); }
    if (phase === 'race') {
      cars.forEach((c) => { if (!c.done || c.v > 0) { if (c.done) c.v *= 0.96; stepCar(c, dt); } });
      remote.forEach((r) => { if (r.tx != null) { r.x += (r.tx - r.x) * Math.min(1, dt * 10); r.y += (r.ty - r.y) * Math.min(1, dt * 10); } });
      sendT += dt;
      if (sendT > 0.1 && remote.size) {
        sendT = 0;
        NET.sendRace({ a: 'pos', start: S().raceStart, x: Math.round(me.x), y: Math.round(me.y), ang: +me.a.toFixed(2), p: me.prog });
      }
      if (remote.size && me.done && [...remote.values()].every((r) => r.done)) endRace();
    }
    draw();
    if (phase === 'lobby' || phase === 'count') updateLobbyTimer();
    raf = requestAnimationFrame(loop);
  }

  function drawCar(g, x, y, a, color, label, mine) {
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(4, 6, 30, 16, 0, 0, 7); g.fill();
    g.fillStyle = '#212529'; [[-16, -16], [12, -16], [-16, 11], [12, 11]].forEach(([wx, wy]) => g.fillRect(wx, wy, 12, 6));
    g.fillStyle = color; g.beginPath(); g.roundRect(-26, -13, 52, 26, 9); g.fill();
    g.strokeStyle = '#1b1b1b'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#a5d8ff'; g.beginPath(); g.roundRect(2, -10, 13, 20, 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(-20, -3, 18, 6);
    g.fillStyle = '#fff3bf'; g.fillRect(23, -11, 4, 6); g.fillRect(23, 5, 4, 6);
    g.restore();
    if (label) {
      g.font = '800 15px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText(label, x, y - 34);
      g.fillStyle = mine ? '#ffe066' : '#fff'; g.fillText(label, x, y - 34);
    }
  }

  function draw() {
    const cv = $('#raceCanvas');
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = cv.getContext('2d');
    const focus = me || { x: PATH[0][0], y: PATH[0][1] };
    const z = phase === 'lobby' ? Math.min(w / TW, h / TH) : Math.max(0.55, Math.min(1, w / 1100));
    const cx = phase === 'lobby' ? TW / 2 : focus.x, cy = phase === 'lobby' ? TH / 2 : focus.y;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#5fb83a'; g.fillRect(0, 0, w, h);
    g.setTransform(dpr * z, 0, 0, dpr * z, dpr * (w / 2 - cx * z), dpr * (h / 2 - cy * z));
    g.drawImage(trackImg, 0, 0);
    remote.forEach((r) => { if (phase !== 'lobby' && r.tx != null) drawCar(g, r.x, r.y, r.a, r.color, r.name); });
    if (phase !== 'lobby') cars.forEach((c) => drawCar(g, c.x, c.y, c.a, c.color, c.mine ? 'Bạn' : c.name, c.mine));
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (phase === 'count') {
      const s = Math.ceil((startAt - performance.now()) / 1000);
      g.font = '900 120px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 10; g.strokeStyle = 'rgba(0,0,0,.5)'; g.strokeText(s > 0 ? s : 'GO!', w / 2, h / 2);
      g.fillStyle = s > 0 ? '#ffe066' : '#69db7c'; g.fillText(s > 0 ? s : 'GO!', w / 2, h / 2);
    }
    if (phase === 'race' || phase === 'count') {
      const order = rankList();
      const place = order.findIndex((o) => o.mine) + 1;
      const lap = Math.min(LAPS, Math.max(1, me.lap + 1));
      const time = me.done || Math.max(0, (performance.now() - startAt) / 1000);
      g.fillStyle = 'rgba(20,28,45,.75)'; g.beginPath(); g.roundRect(12, 12, 210, 98, 14); g.fill();
      g.fillStyle = '#fff'; g.font = '900 26px "Be Vietnam Pro", system-ui'; g.textAlign = 'left'; g.textBaseline = 'top';
      g.fillText(`Hạng ${place}/${order.length}`, 26, 20);
      g.font = '700 16px "Be Vietnam Pro", system-ui';
      g.fillText(`Vòng ${lap}/${LAPS}`, 26, 54); g.fillText(`⏱ ${time.toFixed(1)}s`, 120, 54);
      g.fillText(`${Math.round(me.v / 5)} km/h`, 26, 80);
      // bản đồ nhỏ
      const mw = 170, mh = mw * TH / TW, mx = w - mw - 14, my = 14;
      g.fillStyle = 'rgba(20,28,45,.7)'; g.beginPath(); g.roundRect(mx - 6, my - 6, mw + 12, mh + 12, 10); g.fill();
      g.strokeStyle = '#adb5bd'; g.lineWidth = 5; g.beginPath();
      PATH.forEach(([x, y], i) => { const px = mx + x / TW * mw, py = my + y / TH * mh; i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.closePath(); g.stroke();
      const dot = (x, y, c, r) => { g.fillStyle = c; g.beginPath(); g.arc(mx + x / TW * mw, my + y / TH * mh, r, 0, 7); g.fill(); };
      remote.forEach((r) => dot(r.x, r.y, r.color, 4));
      cars.forEach((c) => dot(c.x, c.y, c.color, c.mine ? 6 : 4));
      if (me.done) {
        g.font = '900 54px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,.5)'; g.strokeText('🏁 VỀ ĐÍCH!', w / 2, h / 2 - 60);
        g.fillStyle = '#ffe066'; g.fillText('🏁 VỀ ĐÍCH!', w / 2, h / 2 - 60);
      }
    }
  }

  /* ---------- Giao diện ---------- */
  function updateLobbyTimer() {
    const el = $('#raceTimer');
    if (!el) return;
    const left = S().raceStart ? Math.max(0, Math.ceil((S().raceStart - Date.now()) / 1000)) : null;
    el.textContent = left == null ? '' : `Xuất phát sau ${left}s`;
    if (phase !== 'lobby') { const lb = $('#raceLobby'); if (lb) lb.remove(); }
  }

  function renderUI() {
    const root = $('#raceView');
    const S0 = S();
    const best = S0.bestRace ? `${S0.bestRace.toFixed(1)}s` : 'chưa có';
    let panelHtml = '';
    if (phase === 'lobby') {
      const racers = [...(joined ? [S0.name] : []), ...[...remote.values()].map((r) => r.name)];
      const forming = S0.raceStart && S0.raceStart > Date.now();
      panelHtml = `<div class="race-card" id="raceLobby">
        <h3>🏎️ Đường đua ${LAPS} vòng</h3>
        <p class="muted">Kỷ lục của bạn: <b>${best}</b> · Xe: <b>${car().name}</b> (tốc độ ×${car().speed})</p>
        <div class="lrow">Màu xe: ${COLORS.map((c) => `<button class="sw ${c === (S0.carColor || COLORS[0]) ? 'on' : ''}" data-color="${c}" style="background:${c}"></button>`).join('')}</div>
        ${forming ? `<div class="racers"><b>Người đua (${racers.length}):</b> ${racers.map((n) => `<span>🏎️ ${esc(n)}</span>`).join('')}</div><div class="race-timer" id="raceTimer"></div>` : ''}
        ${joined ? '' : `<button class="btn big" data-ready>${forming ? '🏁 Vào đua cùng' : '🚦 Sẵn sàng đua'}</button>`}
        ${forming ? '' : `<p class="muted small-note">Bấm sẵn sàng sẽ đếm ngược 10 giây — người khác trong khu bấm đua lúc đó sẽ đua chung. Đua một mình thì có 3 xe máy đua cùng.</p>`}
        <p class="muted small-note">Điều khiển: ◀ ▶ hoặc phím ← → / A D để lái, xe tự chạy; ▼ / phím ↓ / Space để phanh.</p>
        <div class="row-end"><button class="btn ghost small" data-quit>✕ Thoát</button></div>
      </div>`;
    } else if (phase === 'result' && results) {
      panelHtml = `<div class="race-card">
        <h3>${results.place === 0 ? '🏆 Bạn về nhất!' : `🏁 Bạn về hạng ${results.place + 1}`}</h3>
        <ol class="race-res">${results.order.map((o, k) => `<li class="${o.mine ? 'me' : ''}"><b>${k + 1}.</b> ${esc(o.name)}${o.prog >= 1e8 ? ` · ${(1e9 - o.prog).toFixed(1)}s` : ' · chưa về đích'}</li>`).join('')}</ol>
        <p>Thưởng: <b>+${results.coins} xu</b> · <b>+${results.xp} XP</b>${results.newBest ? ' · 🎉 <b>Kỷ lục mới!</b>' : ''}</p>
        <div class="row-end"><button class="btn ghost" data-quit>Thoát</button><button class="btn" data-again>🔁 Đua lại</button></div>
      </div>`;
    }
    root.innerHTML = `<canvas id="raceCanvas"></canvas>${panelHtml}
      <div class="race-pad ${phase === 'race' ? 'show' : ''}">
        <button data-k="left">◀</button><button data-k="brake">▼</button><button data-k="right">▶</button>
      </div>
      ${phase === 'race' ? '<button class="race-exit" data-quit>✕</button>' : ''}`;
    root.querySelectorAll('[data-color]').forEach((b) => b.onclick = () => { S0.carColor = b.dataset.color; AV.saveNow(); renderUI(); });
    const q = (s) => root.querySelector(s);
    if (q('[data-ready]')) q('[data-ready]').onclick = ready;
    root.querySelectorAll('[data-quit]').forEach((b) => b.onclick = () => (phase === 'race' && !me.done ? UI.confirm('Bỏ cuộc đua này?', 'Bỏ cuộc', close) : close()));
    if (q('[data-again]')) q('[data-again]').onclick = () => { phase = 'lobby'; joined = false; S0.raceStart = 0; remote.clear(); renderUI(); };
    root.querySelectorAll('.race-pad [data-k]').forEach((b) => {
      const k = b.dataset.k;
      const on = (e) => { e.preventDefault(); keys[k] = true; }, off = () => { keys[k] = false; };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    });
  }

  function ready() {
    joined = true;
    if (!S().raceStart || S().raceStart < Date.now()) S().raceStart = Date.now() + LOBBY_MS;
    NET.sendRace({ a: 'lobby', start: S().raceStart, name: S().name, color: S().carColor || COLORS[0] });
    renderUI();
  }

  const KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowDown: 'brake', s: 'brake', S: 'brake', ' ': 'brake' };
  function onKey(e) {
    if (!open) return;
    const k = KEYMAP[e.key];
    if (k) { keys[k] = e.type === 'keydown'; e.preventDefault(); e.stopPropagation(); }
    if (e.key === 'Escape' && e.type === 'keydown' && phase !== 'race') close();
  }

  function openRace() {
    if (open) return;
    if (!trackImg) buildTrack();
    open = true; phase = 'lobby'; joined = false; S().raceStart = 0; remote.clear(); me = null; cars = [];
    $('#raceView').classList.add('show');
    renderUI();
    NET.sendRace({ a: 'ask' });
    last = 0;
    raf = requestAnimationFrame(loop);
  }

  function close() {
    if (!open) return;
    open = false;
    cancelAnimationFrame(raf);
    NET.sendRace({ a: 'quit' });
    S().raceStart = 0;
    Object.keys(keys).forEach((k) => { keys[k] = false; });
    $('#raceView').classList.remove('show');
    $('#raceView').innerHTML = '';
  }

  window.addEventListener('keydown', onKey, true);
  window.addEventListener('keyup', onKey, true);

  /** Mua xe ở gara */
  function buyCar(id) {
    const c = CARS.find((x) => x.id === id);
    S().cars = S().cars || ['basic'];
    if (!c || S().cars.includes(id)) return;
    if (c.lvl && S().level < c.lvl) return UI.toast(`Cần đạt cấp ${c.lvl}`);
    if (!AV.spend(c.price)) return;
    S().cars.push(id);
    S().car = id;
    AV.saveNow();
    UI.toast(`Đã mua ${c.name}! 🏎️`);
  }

  return {
    open: openRace, close, onNet, buyCar, CARS, COLORS, isOpen: () => open,
    _state: () => ({ phase, me, cars, remote, results, PATH, N }), _keys: keys, _end: endRace,
  };
})();
