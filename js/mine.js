/* ⛏️ Hầm mỏ nhiều tầng kiểu Stardew Valley (màn chơi riêng phủ toàn màn hình):
 * bấm đá kề bên để đập lấy quặng / đá quý, bấm quái để chém, tìm 🪜 cầu thang xuống tầng sâu hơn.
 * Mỗi 5 tầng mở thang máy. Đồ nhặt được vào túi ngay. Ngất xỉu (hết máu) thì mất một nửa đồ của chuyến đi. */
const MINE = (() => {
  const T = 64, COLS = 15, ROWS = 11;
  const ROCKS = {
    stone: { hp: 2, col: '#868e96', dark: '#495057' },
    copper: { hp: 3, col: '#8d7b6a', dark: '#5c4a3a', speck: '#e8590c', drop: 'ore_copper', min: 1 },
    iron: { hp: 4, col: '#7d8590', dark: '#495057', speck: '#e9ecef', drop: 'ore_iron', min: 8 },
    gold: { hp: 5, col: '#8a7a4a', dark: '#5c4f22', speck: '#ffd43b', drop: 'ore_gold', min: 20 },
    quartz: { hp: 4, col: '#868e96', dark: '#495057', gem: '🤍', drop: 'gem_quartz', min: 1 },
    ruby: { hp: 5, col: '#7a5560', dark: '#4a2a33', gem: '❤️', drop: 'gem_ruby', min: 12 },
    diamond: { hp: 6, col: '#6a7f8f', dark: '#3a4a55', gem: '💎', drop: 'gem_diamond', min: 30 },
  };
  const MONS = {
    slime: { hp: 4, dmg: 4, sp: 55, xp: 3, col: '#69db7c' },
    bat: { hp: 3, dmg: 6, sp: 105, xp: 4, col: '#9775fa', fly: true },
    skull: { hp: 10, dmg: 11, sp: 70, xp: 8, col: '#f1f3f5' },
  };
  const S = () => AV.S;
  const tools = () => (S().tools = S().tools || { can: 0, hoe: 0, rod: 0, pick: 0 });
  const mineState = () => (S().mine = S().mine || { deep: 0 });
  let el = null, cv = null, g = null, hud = null, run = null, raf = 0, DPR = 1, VW = 0, VH = 0, K = 1, OX = 0, OY = 0;

  /* ---------- tạo tầng ---------- */
  function pickRock(f) {
    const r = Math.random();
    if (f >= 30 && r < 0.012) return 'diamond';
    if (f >= 12 && r < 0.03) return 'ruby';
    if (r < 0.06) return 'quartz';
    if (f >= 20 && r < 0.14) return 'gold';
    if (f >= 8 && r < (f >= 20 ? 0.26 : 0.2)) return 'iron';
    if (r < (f >= 8 ? 0.34 : 0.3)) return 'copper';
    return 'stone';
  }
  function genFloor(f) {
    const grid = [];
    const sc = Math.floor(COLS / 2), sr = ROWS - 2;
    for (let r = 0; r < ROWS; r++) {
      grid.push([]);
      for (let c = 0; c < COLS; c++) {
        const edge = r === 0 || c === 0 || r === ROWS - 1 || c === COLS - 1;
        const nearStart = Math.abs(c - sc) <= 1 && Math.abs(r - sr) <= 1;
        if (edge) grid[r].push({ wall: true });
        else if (!nearStart && Math.random() < 0.46) { const type = pickRock(f); grid[r].push({ type, hp: ROCKS[type].hp + Math.floor(f / 25) }); }
        else grid[r].push(null);
      }
    }
    const rocks = [];
    grid.forEach((row, r) => row.forEach((cell, c) => { if (cell && cell.type) rocks.push([c, r]); }));
    const ladderUnder = rocks.length ? rocks[Math.floor(Math.random() * rocks.length)] : [sc, 1];
    const mons = [];
    const n = 2 + Math.floor(Math.random() * 3) + Math.floor(f / 15);
    for (let i = 0; i < n; i++) {
      const kinds = f >= 25 ? ['slime', 'bat', 'skull'] : f >= 8 ? ['slime', 'bat'] : ['slime'];
      const kind = kinds[Math.floor(Math.random() * kinds.length)], M = MONS[kind];
      let c, r, tries = 0;
      do { c = 1 + Math.floor(Math.random() * (COLS - 2)); r = 1 + Math.floor(Math.random() * (ROWS - 4)); tries++; } while ((grid[r][c] && !M.fly) && tries < 40);
      const hp = Math.round(M.hp * (1 + f * 0.06));
      mons.push({ kind, x: c * T + T / 2, y: r * T + T / 2, hp, max: hp, cool: 1, hit: 0, ph: Math.random() * 6 });
    }
    return { grid, ladderUnder, ladder: null, mons, start: [sc, sr] };
  }

  /* ---------- vào / ra ---------- */
  function ensure() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'mine-view';
    el.innerHTML = `<canvas></canvas>
      <div class="mine-hud"><b class="mh-floor"></b><div class="mh-hp"><i></i><span></span></div><span class="mh-haul"></span><button data-tonic title="Uống nước tăng lực">🧃 <span></span></button><button data-exit>⬆️ Lên mặt đất</button></div>
      <div class="mine-msg"></div>`;
    document.body.appendChild(el);
    cv = el.querySelector('canvas'); g = cv.getContext('2d');
    hud = el.querySelector('.mine-hud');
    cv.addEventListener('pointerdown', onTap);
    el.querySelector('[data-exit]').onclick = () => exit(false);
    el.querySelector('[data-tonic]').onclick = drinkTonic;
    window.addEventListener('resize', () => { if (run) size(); });
  }
  function size() {
    DPR = Math.min(2, devicePixelRatio || 1); VW = el.clientWidth || innerWidth; VH = el.clientHeight || innerHeight;
    cv.width = VW * DPR; cv.height = VH * DPR; cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
    K = Math.min((VW - 16) / (COLS * T), (VH - 80) / (ROWS * T));
    OX = (VW - COLS * T * K) / 2; OY = 64 + (VH - 80 - ROWS * T * K) / 2;
  }
  /** chọn tầng bắt đầu (1 hoặc các tầng thang máy đã mở) */
  function enter() {
    const deep = mineState().deep || 0;
    const stops = [1]; for (let f = 5; f <= deep; f += 5) stops.push(f);
    if (stops.length === 1) return begin(1);
    const p = UI.panel('🛗 Thang máy hầm mỏ', `<p class="muted">Tầng sâu nhất đã tới: <b>${deep}</b>. Chọn tầng xuống:</p>
      <div class="lift-pad mine-lift">${stops.map((f) => `<button class="lift-btn" data-f="${f}">${f}<small>${f === 1 ? 'Cửa hầm' : f >= 30 ? '💎 Có kim cương' : f >= 20 ? '🟡 Có vàng' : f >= 8 ? '⚪ Có sắt' : '🟠 Đồng'}</small></button>`).join('')}</div>`);
    p.body.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => { p.close(); begin(+b.dataset.f); });
  }
  function begin(f) {
    ensure();
    run = { floor: f, hp: 100, max: 100, haul: {}, xp: 0, px: 0, py: 0, path: [], act: null, cool: 0, swing: 0, hurt: 0, dir: 1, t: 0, floats: [], last: performance.now(), dead: false };
    newFloor(f);
    el.style.display = 'block';
    size();
    AV.mineActive = true;
    if (typeof MUSIC !== 'undefined' && MUSIC.zone) MUSIC.zone('mute');
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    say(`⛏️ Tầng ${f} — bấm đá kề bên để đập, bấm quái để chém. Tìm 🪜 để xuống sâu hơn!`);
  }
  function newFloor(f) {
    run.floor = f;
    run.lv = genFloor(f);
    const [c, r] = run.lv.start;
    run.px = c * T + T / 2; run.py = r * T + T / 2; run.path = []; run.act = null;
    const ms = mineState();
    if (f > (ms.deep || 0)) { ms.deep = f; if (f % 5 === 0) say(`🛗 Mở thang máy tầng ${f}!`); AV.markChanged(); }
    updateHud();
  }
  function exit(fainted) {
    if (!run) return;
    cancelAnimationFrame(raf);
    const r = run; run = null;
    el.style.display = 'none';
    AV.mineActive = false;
    if (typeof MUSIC !== 'undefined' && MUSIC.zone) MUSIC.zone(null);
    let lost = '';
    if (fainted) {
      const L = [];
      Object.entries(r.haul).forEach(([id, n]) => { const k = Math.ceil(n / 2); if (k > 0 && (S().inv[id] || 0) >= k) { S().inv[id] -= k; L.push(`${k} ${DATA.ITEMS[id].icon}`); } });
      lost = L.length ? ` Mất: ${L.join(' ')}` : '';
    }
    if (r.xp) AV.earn(0, r.xp);
    AV.markChanged();
    const got = Object.entries(r.haul).map(([id, n]) => `${n} ${DATA.ITEMS[id].icon}`).join(' ');
    UI.toast(fainted ? `😵 Bạn ngất xỉu ở tầng ${r.floor}, thợ mỏ cõng lên mặt đất.${lost}` : `⛏️ Lên mặt đất từ tầng ${r.floor}${got ? ' · nhặt được ' + got : ''} · +${r.xp} XP`, 6000);
  }
  function drinkTonic() {
    if (!run) return;
    if ((S().inv.mine_tonic || 0) < 1) return say('Hết 🧃 nước tăng lực — mua ở Lò rèn');
    if (run.hp >= run.max && AV.energy() >= 100) return say('Máu và năng lượng đang đầy');
    S().inv.mine_tonic--; run.hp = Math.min(run.max, run.hp + 50); AV.addEnergy(30);
    float('+50 ❤ +30 ⚡', run.px, run.py - 40, '#69db7c'); updateHud();
  }
  let msgT = 0;
  function say(t) { const m = el.querySelector('.mine-msg'); m.textContent = t; m.style.opacity = 1; clearTimeout(msgT); msgT = setTimeout(() => { m.style.opacity = 0; }, 3500); }
  function float(text, x, y, col) { run.floats.push({ text, x, y, col: col || '#fff', t: 0 }); }

  /* ---------- điều khiển ---------- */
  const cellOf = (x, y) => [Math.floor(x / T), Math.floor(y / T)];
  const solid = (c, r) => { const row = run.lv.grid[r]; const cell = row && row[c]; return !row || cell === undefined || (cell && (cell.wall || cell.type)); };
  function bfs(from, goalFn) {
    const key = (c, r) => r * COLS + c, prev = new Map([[key(...from), null]]), q = [from];
    while (q.length) {
      const [c, r] = q.shift();
      if (goalFn(c, r)) { const path = []; let k = key(c, r); while (k != null) { path.unshift([k % COLS, Math.floor(k / COLS)]); k = prev.get(k); } return path; }
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nc = c + dc, nr = r + dr, k = key(nc, nr);
        if (prev.has(k) || solid(nc, nr)) continue;
        prev.set(k, key(c, r)); q.push([nc, nr]);
      }
    }
    return null;
  }
  function onTap(e) {
    if (!run || run.dead) return;
    const x = (e.clientX - OX) / K, y = (e.clientY - OY) / K;
    const [c, r] = cellOf(x, y);
    // quái
    const m = run.lv.mons.find((q) => Math.hypot(q.x - x, q.y - y) < 40);
    if (m) { run.act = { kind: 'hit', m }; walkNear(m.x, m.y, 85); return; }
    const cell = run.lv.grid[r] && run.lv.grid[r][c];
    if (cell && cell.type) { run.act = { kind: 'rock', c, r }; walkAdjacent(c, r); return; }
    if (cell && cell.wall) return;
    run.act = null;
    const p = bfs(cellOf(run.px, run.py), (cc, rr) => cc === c && rr === r);
    if (p) run.path = p.slice(1);
  }
  function walkAdjacent(c, r) {
    const [pc, pr] = cellOf(run.px, run.py);
    if (Math.max(Math.abs(pc - c), Math.abs(pr - r)) <= 1) { run.path = []; return; }
    const p = bfs([pc, pr], (cc, rr) => Math.max(Math.abs(cc - c), Math.abs(rr - r)) <= 1 && !(cc === c && rr === r));
    run.path = p ? p.slice(1) : [];
  }
  function walkNear(x, y, d) {
    if (Math.hypot(run.px - x, run.py - y) <= d) { run.path = []; return; }
    const [tc, tr] = cellOf(x, y);
    const p = bfs(cellOf(run.px, run.py), (cc, rr) => Math.hypot(cc * T + T / 2 - x, rr * T + T / 2 - y) <= d || (cc === tc && rr === tr));
    run.path = p ? p.slice(1) : [];
  }

  /* ---------- cập nhật ---------- */
  function update(dt) {
    const R = run;
    R.t += dt; R.cool = Math.max(0, R.cool - dt); R.swing = Math.max(0, R.swing - dt); R.hurt = Math.max(0, R.hurt - dt);
    // đi theo đường
    if (R.path.length) {
      const [c, r] = R.path[0], tx = c * T + T / 2, ty = r * T + T / 2, d = Math.hypot(tx - R.px, ty - R.py), sp = 300 * dt;
      if (Math.abs(tx - R.px) > 1) R.dir = tx > R.px ? 1 : -1;
      if (d <= sp) { R.px = tx; R.py = ty; R.path.shift(); } else { R.px += (tx - R.px) / d * sp; R.py += (ty - R.py) / d * sp; }
    }
    R.moving = R.path.length > 0;
    // hành động khi tới nơi
    const pick = tools().pick;
    if (!R.path.length && R.act && R.cool <= 0) {
      if (R.act.kind === 'rock') {
        const { c, r } = R.act, cell = R.lv.grid[r][c];
        if (!cell || !cell.type) R.act = null;
        else if (!AV.useEnergy(0.5, true)) { R.act = null; say('😫 Kiệt sức rồi! Uống 🧃 hoặc lên mặt đất ăn uống để hồi ⚡'); }
        else {
          R.cool = 0.38; R.swing = 0.25; R.dir = c * T + T / 2 >= R.px ? 1 : -1;
          cell.hp -= 1 + pick * 0.5;
          if (cell.hp <= 0) breakRock(c, r, cell);
        }
      } else if (R.act.kind === 'hit') {
        const m = R.act.m;
        if (!R.lv.mons.includes(m)) R.act = null;
        else if (Math.hypot(m.x - R.px, m.y - R.py) <= 90) {
          AV.useEnergy(0.3, true);
          R.cool = 0.4; R.swing = 0.25; R.dir = m.x >= R.px ? 1 : -1;
          const dmg = 2 + pick * 2 + Math.floor(Math.random() * 2);
          m.hp -= dmg; m.hit = 0.25; float('-' + dmg, m.x, m.y - 30, '#ffd43b');
          const a = Math.atan2(m.y - R.py, m.x - R.px); m.x += Math.cos(a) * 26; m.y += Math.sin(a) * 26;
          if (m.hp <= 0) {
            R.lv.mons.splice(R.lv.mons.indexOf(m), 1); R.xp += MONS[m.kind].xp; R.act = null; float('+' + MONS[m.kind].xp + ' XP', m.x, m.y - 40, '#a5d8ff');
            if (Math.random() < 0.35) gain(Math.random() < 0.5 ? 'ore_copper' : 'gem_quartz', 1, m.x, m.y);
            if (!R.lv.mons.length && !R.lv.ladder) { R.lv.ladder = cellOf(m.x, m.y); if (solid(...R.lv.ladder)) R.lv.ladder = cellOf(R.px, R.py); say('🪜 Hạ hết quái — cầu thang hiện ra!'); }
          }
        } else walkNear(m.x, m.y, 85);
      }
    }
    // quái
    for (const m of R.lv.mons) {
      const M = MONS[m.kind];
      m.ph += dt; m.cool = Math.max(0, m.cool - dt); m.hit = Math.max(0, m.hit - dt);
      const dx = R.px - m.x, dy = R.py - m.y, d = Math.hypot(dx, dy) || 1;
      if (d < 420) {
        const sp = M.sp * dt * (m.kind === 'slime' ? (Math.sin(m.ph * 5) > 0 ? 1.6 : 0.2) : 1);
        let nx = m.x + dx / d * sp, ny = m.y + dy / d * sp;
        if (m.kind === 'bat') { nx += Math.sin(m.ph * 7) * 40 * dt; ny += Math.cos(m.ph * 5) * 40 * dt; }
        if (M.fly || !solid(...cellOf(nx, m.y))) m.x = nx;
        if (M.fly || !solid(...cellOf(m.x, ny))) m.y = ny;
        m.x = Math.max(T, Math.min((COLS - 1) * T, m.x)); m.y = Math.max(T, Math.min((ROWS - 1) * T, m.y));
      }
      if (d < 36 && m.cool <= 0 && !R.dead) {
        m.cool = 1.3;
        const dmg = Math.round(M.dmg * (1 + R.floor * 0.03));
        R.hp -= dmg; R.hurt = 0.3; float('-' + dmg, R.px, R.py - 50, '#ff6b6b');
        if (navigator.vibrate) navigator.vibrate(60);
        if (R.hp <= 0) { R.dead = true; R.hp = 0; say('😵 Bạn ngất xỉu…'); setTimeout(() => exit(true), 1400); }
        updateHud();
      }
    }
    // cầu thang
    if (R.lv.ladder && !R.dead) {
      const [lc, lr] = R.lv.ladder, [pc, pr] = cellOf(R.px, R.py);
      if (lc === pc && lr === pr && !R.path.length) { R.hp = Math.min(R.max, R.hp + 5); newFloor(R.floor + 1); say(`⬇️ Tầng ${R.floor}`); }
    }
    R.floats.forEach((f) => { f.t += dt; f.y -= 30 * dt; });
    R.floats = R.floats.filter((f) => f.t < 1.2);
  }
  function breakRock(c, r, cell) {
    const R = run, def = ROCKS[cell.type], x = c * T + T / 2, y = r * T + T / 2;
    R.lv.grid[r][c] = null;
    R.xp += 1;
    if (def.drop) gain(def.drop, def.gem ? 1 : 1 + Math.floor(Math.random() * 2) + (Math.random() < tools().pick * 0.1 ? 1 : 0), x, y);
    else if (Math.random() < 0.08) gain('ore_copper', 1, x, y);
    const [lc, lr] = R.lv.ladderUnder;
    if (!R.lv.ladder && ((lc === c && lr === r) || Math.random() < 0.05)) { R.lv.ladder = [c, r]; say('🪜 Tìm thấy cầu thang xuống tầng dưới!'); }
  }
  function gain(id, n, x, y) {
    AV.addItem(id, n);
    run.haul[id] = (run.haul[id] || 0) + n;
    float(`+${n} ${DATA.ITEMS[id].icon}`, x, y - 20, '#ffe066');
    updateHud();
  }
  function updateHud() {
    if (!run) return;
    hud.querySelector('.mh-floor').textContent = `⛏️ Tầng ${run.floor}`;
    hud.querySelector('.mh-hp i').style.width = (run.hp / run.max * 100) + '%';
    hud.querySelector('.mh-hp span').textContent = `❤ ${Math.max(0, Math.ceil(run.hp))}/${run.max}`;
    hud.querySelector('.mh-floor').textContent += ` · ⚡${Math.floor(AV.energy())}`;
    hud.querySelector('.mh-haul').textContent = Object.entries(run.haul).map(([id, n]) => `${DATA.ITEMS[id].icon}${n}`).join(' ');
    el.querySelector('[data-tonic] span').textContent = S().inv.mine_tonic || 0;
  }

  /* ---------- vẽ ---------- */
  function draw() {
    const R = run, c = g;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.fillStyle = '#120c08'; c.fillRect(0, 0, VW, VH);
    c.setTransform(DPR * K, 0, 0, DPR * K, DPR * OX, DPR * OY);
    const deep = Math.min(1, R.floor / 40);
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
      const cell = R.lv.grid[r][col], x = col * T, y = r * T;
      if (cell && cell.wall) { c.fillStyle = '#2b1d14'; c.fillRect(x, y, T, T); c.fillStyle = '#3d2a1c'; c.fillRect(x + 4, y + 4, T - 8, T - 12); continue; }
      c.fillStyle = (col + r) % 2 ? `rgb(${120 - deep * 50},${92 - deep * 40},${66 - deep * 30})` : `rgb(${112 - deep * 50},${85 - deep * 40},${60 - deep * 30})`;
      c.fillRect(x, y, T, T);
    }
    if (R.lv.ladder) { const [lc, lr] = R.lv.ladder; c.fillStyle = '#000'; c.fillRect(lc * T + 10, lr * T + 10, T - 20, T - 20); c.font = '38px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🪜', lc * T + T / 2, lr * T + T / 2); }
    for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
      const cell = R.lv.grid[r][col];
      if (!cell || !cell.type) continue;
      const d = ROCKS[cell.type], x = col * T + T / 2, y = r * T + T / 2 + 4;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y + 18, 24, 7, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = d.dark; c.beginPath(); c.moveTo(x - 26, y + 16); c.lineTo(x - 22, y - 14); c.lineTo(x - 4, y - 24); c.lineTo(x + 20, y - 16); c.lineTo(x + 27, y + 14); c.closePath(); c.fill();
      c.fillStyle = d.col; c.beginPath(); c.moveTo(x - 22, y + 10); c.lineTo(x - 18, y - 12); c.lineTo(x - 3, y - 20); c.lineTo(x + 16, y - 13); c.lineTo(x + 21, y + 9); c.closePath(); c.fill();
      if (d.speck) { c.fillStyle = d.speck; [[-9, -6], [6, -10], [10, 3], [-4, 6], [-12, 2]].forEach(([dx, dy]) => { c.beginPath(); c.arc(x + dx, y + dy, 3.2, 0, Math.PI * 2); c.fill(); }); }
      if (d.gem) { c.font = '18px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.gem, x, y - 2); }
      if (cell.hp < d.hp) { c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 8, y - 12); c.lineTo(x, y - 2); c.lineTo(x - 4, y + 8); c.stroke(); }
    }
    // quái
    for (const m of R.lv.mons) {
      const M = MONS[m.kind], bob = Math.sin(m.ph * 6) * 3;
      c.save(); if (m.hit > 0) c.globalAlpha = 0.6;
      if (m.kind === 'slime') { const sq = 1 + Math.sin(m.ph * 10) * 0.12; c.fillStyle = M.col; c.beginPath(); c.ellipse(m.x, m.y + 6, 22 * sq, 18 / sq, 0, Math.PI, 0); c.lineTo(m.x + 22 * sq, m.y + 12); c.lineTo(m.x - 22 * sq, m.y + 12); c.fill(); c.fillStyle = '#111'; c.fillRect(m.x - 8, m.y - 2, 4, 6); c.fillRect(m.x + 4, m.y - 2, 4, 6); }
      else if (m.kind === 'bat') { const w = Math.sin(m.ph * 20) * 12; c.fillStyle = M.col; c.beginPath(); c.moveTo(m.x, m.y + bob); c.lineTo(m.x - 26, m.y - 6 + w + bob); c.lineTo(m.x - 12, m.y + 6 + bob); c.closePath(); c.fill(); c.beginPath(); c.moveTo(m.x, m.y + bob); c.lineTo(m.x + 26, m.y - 6 + w + bob); c.lineTo(m.x + 12, m.y + 6 + bob); c.closePath(); c.fill(); c.beginPath(); c.arc(m.x, m.y + bob, 9, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ff6b6b'; c.fillRect(m.x - 5, m.y - 3 + bob, 3, 3); c.fillRect(m.x + 2, m.y - 3 + bob, 3, 3); }
      else { c.font = '34px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('💀', m.x, m.y - 6 + bob); c.fillStyle = M.col; c.fillRect(m.x - 8, m.y + 10, 16, 14); }
      c.restore();
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(m.x - 20, m.y - 34, 40, 6); c.fillStyle = '#fa5252'; c.fillRect(m.x - 19, m.y - 33, 38 * Math.max(0, m.hp / m.max), 4);
    }
    // nhân vật
    c.save();
    if (R.hurt > 0) c.globalAlpha = 0.55 + Math.sin(R.t * 60) * 0.3;
    ART.character(c, R.px, R.py + 22, AV.S.look, { scale: 0.62, t: R.t, dir: R.dir, moving: R.moving });
    c.restore();
    if (R.swing > 0) { c.save(); c.translate(R.px + R.dir * 22, R.py - 12); c.rotate(R.dir * (1.6 - R.swing * 8)); c.font = '28px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(R.act && R.act.kind === 'hit' ? '🗡️' : '⛏️', 0, -14); c.restore(); }
    for (const f of R.floats) { c.globalAlpha = 1 - f.t / 1.2; c.font = '900 18px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#000'; c.strokeText(f.text, f.x, f.y); c.fillStyle = f.col; c.fillText(f.text, f.x, f.y); c.globalAlpha = 1; }
    // bóng tối hầm mỏ, có đèn quanh người
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    const sx = OX + R.px * K, sy = OY + R.py * K, rad = (240 - deep * 80) * K;
    const v = c.createRadialGradient(sx, sy, rad * 0.35, sx, sy, rad * 2.4);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${0.55 + deep * 0.35})`);
    c.fillStyle = v; c.fillRect(0, 0, VW, VH);
  }
  function loop(now) {
    if (!run) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - run.last) / 1000); run.last = now;
    if (!UI.isBlocking()) update(dt);
    if (run) draw();
  }

  /* ---------- 🔨 Lò rèn: nâng cấp dụng cụ, bán khoáng sản, mua nước tăng lực ---------- */
  const TOOL = {
    can: { name: 'Bình tưới', icon: '🚿', fx: ['Tưới xong cây lớn nhanh hơn 10%', '+ nhanh hơn 12%', '+ nhanh hơn 15%', 'Tưới 1 luống là tưới luôn CẢ RUỘNG', 'Cả ruộng + cây lớn nhanh hơn 20%'] },
    hoe: { name: 'Cuốc', icon: '🪓', fx: ['Sản lượng bình thường', '10% ô thu thêm 1 nông sản', '20% ô thu thêm 1', '30% ô thu thêm 1', '40% ô thu thêm 1'] },
    rod: { name: 'Cần câu', icon: '🎣', fx: ['Khung kéo cá nhỏ', 'Khung kéo cá to hơn', 'To hơn nữa', 'Rất to', 'Khổng lồ — cá hiếm cũng dễ'] },
    pick: { name: 'Cúp & kiếm', icon: '⛏️', fx: ['Đập đá chậm, chém yếu', 'Đập nhanh hơn, chém mạnh hơn', 'Nhanh hơn nữa', 'Rất nhanh, có cơ hội rơi thêm quặng', 'Đập đá 1–2 nhát, chém cực mạnh'] },
  };
  const LV = [
    { name: 'Thường', col: '#adb5bd' },
    { name: 'Đồng', col: '#e8590c', coins: 2000, ore: 'ore_copper', n: 5 },
    { name: 'Sắt', col: '#868e96', coins: 8000, ore: 'ore_iron', n: 5 },
    { name: 'Vàng', col: '#fab005', coins: 25000, ore: 'ore_gold', n: 5 },
    { name: 'Kim cương', col: '#4dabf7', coins: 80000, ore: 'gem_diamond', n: 2 },
  ];
  function upgrade(id) {
    const lv = tools()[id], nx = LV[lv + 1];
    if (!nx) return UI.toast('Dụng cụ đã đạt cấp cao nhất 💎');
    if ((S().inv[nx.ore] || 0) < nx.n) return UI.toast(`Thiếu ${DATA.ITEMS[nx.ore].icon} ${DATA.ITEMS[nx.ore].name}: cần ${nx.n}, có ${S().inv[nx.ore] || 0}`);
    if (!AV.spend(nx.coins)) return;
    S().inv[nx.ore] -= nx.n;
    tools()[id] = lv + 1;
    AV.markChanged();
    UI.toast(`🔨 Thợ rèn đã nâng ${TOOL[id].icon} ${TOOL[id].name} lên cấp ${nx.name}!`, 4000);
  }
  function forge() {
    let tab = 'up';
    const p = UI.panel('🔨 Lò rèn Bác Tâm', '', { wide: true });
    const render = () => {
      const T2 = tools();
      let body = '';
      if (tab === 'up') {
        body = `<div class="shop-list">${Object.entries(TOOL).map(([id, t]) => { const lv = T2[id], nx = LV[lv + 1]; return `<div class="shop-row"><span class="ic">${t.icon}</span>
          <div class="info"><b>${t.name} <span class="tool-lv" style="background:${LV[lv].col}">${LV[lv].name}</span></b><small>${t.fx[lv]}${nx ? ` → <b>${nx.name}</b>: ${t.fx[lv + 1]}` : ''}</small>
          ${nx ? `<small>Cần: 💰 ${nx.coins.toLocaleString('vi-VN')} xu + ${nx.n} ${DATA.ITEMS[nx.ore].icon} ${DATA.ITEMS[nx.ore].name} (có ${S().inv[nx.ore] || 0})</small>` : ''}</div>
          ${nx ? `<button class="btn small" data-up="${id}">🔨 Nâng cấp</button>` : '<button class="btn small ghost" disabled>💎 Tối đa</button>'}</div>`; }).join('')}</div>`;
      } else if (tab === 'sell') {
        const ids = ['ore_copper', 'ore_iron', 'ore_gold', 'gem_quartz', 'gem_ruby', 'gem_diamond'];
        body = `<div class="shop-list">${ids.map((id) => { const it = DATA.ITEMS[id], n = S().inv[id] || 0; return `<div class="shop-row"><span class="ic">${it.icon}</span><div class="info"><b>${it.name}</b><small>Có ${n} · ${it.sell} xu / cái</small></div><button class="btn small" data-sell="${id}" ${n ? '' : 'disabled'}>Bán hết · ${(n * it.sell).toLocaleString('vi-VN')}</button></div>`; }).join('')}</div>
          <p class="muted small-note">💡 Giữ lại quặng để nâng cấp dụng cụ nhé!</p>`;
      } else {
        body = `<div class="shop-list"><div class="shop-row"><span class="ic">🧃</span><div class="info"><b>Nước tăng lực</b><small>Hồi 50 ❤ khi ở dưới hầm · có ${S().inv.mine_tonic || 0}</small></div><button class="btn small" data-buy="1">80 xu</button><button class="btn small" data-buy="5">5 chai · 380</button></div></div>`;
      }
      p.body.innerHTML = `<div class="coins-line">💰 ${S().coins.toLocaleString('vi-VN')} xu · ⛏️ Tầng sâu nhất: ${mineState().deep || 0}</div>
        <div class="ss-tabs">${[['up', '🔨 Nâng cấp dụng cụ'], ['sell', '💰 Bán khoáng sản'], ['buy', '🧃 Đồ đi mỏ']].map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div><div class="ss-box">${body}</div>`;
      p.body.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      p.body.querySelectorAll('[data-up]').forEach((b) => b.onclick = () => { const id = b.dataset.up, nx = LV[tools()[id] + 1]; UI.confirm(`Nâng ${TOOL[id].icon} ${TOOL[id].name} lên <b>${nx.name}</b>: ${nx.coins.toLocaleString('vi-VN')} xu + ${nx.n} ${DATA.ITEMS[nx.ore].icon}?`, '🔨 Rèn', () => { upgrade(id); render(); }); });
      p.body.querySelectorAll('[data-sell]').forEach((b) => b.onclick = () => { AV.sell(b.dataset.sell, S().inv[b.dataset.sell] || 0); render(); });
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { const n = +b.dataset.buy, cost = n === 5 ? 380 : 80; if (!AV.spend(cost)) return; AV.addItem('mine_tonic', n); UI.toast(`🧃 +${n} nước tăng lực`); render(); });
    };
    render();
  }

  /* ---------- hình vẽ ở khu mỏ (bên ngoài) ---------- */
  function entrance(c, x, y) {
    c.fillStyle = '#6b5a4a'; c.beginPath(); c.moveTo(x - 330, y); c.lineTo(x - 220, y - 300); c.lineTo(x - 60, y - 380); c.lineTo(x + 120, y - 330); c.lineTo(x + 300, y - 210); c.lineTo(x + 360, y); c.closePath(); c.fill();
    c.fillStyle = '#7d6b5a'; c.beginPath(); c.moveTo(x - 300, y); c.lineTo(x - 200, y - 260); c.lineTo(x - 60, y - 330); c.lineTo(x + 100, y - 290); c.lineTo(x + 260, y - 180); c.lineTo(x + 320, y); c.closePath(); c.fill();
    c.fillStyle = '#1a120c'; c.beginPath(); c.moveTo(x - 80, y); c.lineTo(x - 80, y - 120); c.quadraticCurveTo(x, y - 190, x + 80, y - 120); c.lineTo(x + 80, y); c.closePath(); c.fill();
    c.fillStyle = '#8a5a32'; c.fillRect(x - 96, y - 150, 18, 150); c.fillRect(x + 78, y - 150, 18, 150); c.fillRect(x - 104, y - 162, 208, 22);
    c.fillStyle = '#ffd43b'; c.font = '900 18px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⛏️ HẦM MỎ', x, y - 151);
    c.strokeStyle = '#495057'; c.lineWidth = 5; c.beginPath(); c.moveTo(x - 40, y); c.lineTo(x - 70, y + 120); c.moveTo(x + 40, y); c.lineTo(x + 70, y + 120); c.stroke();
    c.lineWidth = 4; for (let k = 0; k < 6; k++) { const yy = y + 10 + k * 20, w = 44 + k * 6; c.strokeStyle = '#8a5a32'; c.beginPath(); c.moveTo(x - w, yy); c.lineTo(x + w, yy); c.stroke(); }
    c.fillStyle = '#ffa94d'; c.beginPath(); c.arc(x - 92, y - 110, 7, 0, Math.PI * 2); c.arc(x + 92, y - 110, 7, 0, Math.PI * 2); c.fill();
  }
  function cart(c, x, y) {
    c.fillStyle = '#495057'; c.beginPath(); c.moveTo(x - 46, y - 46); c.lineTo(x + 46, y - 46); c.lineTo(x + 36, y - 12); c.lineTo(x - 36, y - 12); c.closePath(); c.fill();
    c.fillStyle = '#343a40'; c.fillRect(x - 48, y - 50, 96, 8);
    [[-12, '#e8590c'], [4, '#adb5bd'], [18, '#ffd43b'], [-26, '#868e96']].forEach(([dx, col]) => { c.fillStyle = col; c.beginPath(); c.arc(x + dx, y - 52, 10, 0, Math.PI * 2); c.fill(); });
    c.fillStyle = '#212529'; [-24, 24].forEach((dx) => { c.beginPath(); c.arc(x + dx, y - 8, 9, 0, Math.PI * 2); c.fill(); });
  }
  function forgeArt(c, x, y, t) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 4, 190, 18, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8a8178'; c.fillRect(x - 170, y - 200, 340, 200);
    for (let k = 0; k < 8; k++) for (let j = 0; j < 5; j++) { c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 2; c.strokeRect(x - 170 + j * 68 + (k % 2) * 34, y - 200 + k * 25, 68, 25); }
    c.fillStyle = '#5c3d1e'; c.beginPath(); c.moveTo(x - 190, y - 200); c.lineTo(x, y - 270); c.lineTo(x + 190, y - 200); c.closePath(); c.fill();
    c.fillStyle = '#495057'; c.fillRect(x + 90, y - 300, 40, 90);
    for (let k = 0; k < 3; k++) { const a = (t * 0.6 + k / 3) % 1; c.fillStyle = `rgba(200,200,200,${0.5 * (1 - a)})`; c.beginPath(); c.arc(x + 110 + Math.sin(a * 6) * 10, y - 310 - a * 80, 12 + a * 16, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#1a120c'; c.fillRect(x - 50, y - 120, 100, 120);
    const fire = c.createRadialGradient(x, y - 40, 4, x, y - 40, 60); fire.addColorStop(0, `rgba(255,${180 + Math.sin(t * 9) * 40},60,.95)`); fire.addColorStop(1, 'rgba(255,80,0,0)');
    c.fillStyle = fire; c.fillRect(x - 50, y - 120, 100, 120);
    c.fillStyle = '#2b2b30'; c.beginPath(); c.roundRect(x - 150, y - 160, 80, 34, 6); c.fill();
    c.fillStyle = '#ffd43b'; c.font = '900 17px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🔨 LÒ RÈN', x - 110, y - 143);
    c.fillStyle = '#343a40'; c.beginPath(); c.moveTo(x + 70, y - 40); c.lineTo(x + 150, y - 40); c.lineTo(x + 135, y - 26); c.lineTo(x + 85, y - 26); c.closePath(); c.fill(); c.fillRect(x + 100, y - 26, 20, 26);
  }

  return { enter, forge, entrance, cart, forgeArt, TOOL, LV, get active() { return !!run; } };
})();
