/* Đấu Trường MMA: 2 chiến binh tự đánh nhau, người chơi đặt cược bên thắng để ăn xu.
   Mỗi trận chạy theo giờ thật + hạt giống theo số trận → mọi người thấy cùng một trận, cùng kết quả. */
const ARENA = (() => {
  const FIGHTERS = [
    { id: 'dog', name: 'Chó Mực', icon: '🐕', hp: 120, atk: 11, spd: 1.15 },
    { id: 'shepherd', name: 'Becgie Thép', icon: '🐕‍🦺', hp: 130, atk: 12, spd: 1.0 },
    { id: 'tiger', name: 'Hổ Vằn', icon: '🐯', hp: 140, atk: 13, spd: 0.92 },
    { id: 'lion', name: 'Sư Tử Vàng', icon: '🦁', hp: 150, atk: 13.5, spd: 0.85 },
    { id: 'trex', name: 'Khủng Long T-Rex', icon: '🦖', hp: 175, atk: 15, spd: 0.7 },
    { id: 'dragon', name: 'Rồng Lửa', icon: '🐉', hp: 165, atk: 16.5, spd: 0.7 },
  ];
  /** Bo3: 3 hiệp (mỗi hiệp tối đa RD giây, nghỉ BRK giây), thắng 2 hiệp là thắng trận */
  const BET = 20, RD = 14, BRK = 3, FIGHT = RD * 3 + BRK * 2, SHOW = 8, ROUND = BET + FIGHT + SHOW;
  const RMAX = RD - 1.5;
  const RING = { x: 1000, y: 640, rx: 430, ry: 205 };

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const nowS = () => Date.now() / 1000;
  const roundAt = (s) => Math.floor(s / ROUND);

  /** Cặp đấu của trận r (mỗi con có "phong độ" ±12% riêng trận đó) */
  function match(r) {
    const R = rng(r * 7919 + 13);
    const i = Math.floor(R() * FIGHTERS.length);
    const near = FIGHTERS.map((_, k) => k).filter((k) => k !== i && Math.abs(k - i) <= 2);
    const j = near[Math.floor(R() * near.length)];
    const form = () => 0.85 + R() * 0.3;
    const mk = (f) => { const k = form(); return { ...f, hp: Math.round(f.hp * k), atk: f.atk * (0.94 + (k - 0.85) * 0.5) }; };
    return [mk(FIGHTERS[i]), mk(FIGHTERS[j])];
  }

  /** Mô phỏng 1 hiệp: danh sách đòn đánh theo thời gian + người thắng hiệp (KO hoặc tính điểm máu) */
  function simulate(fs, seed) {
    const R = rng(seed);
    const max = [Math.round(fs[0].hp * 0.62), Math.round(fs[1].hp * 0.62)];
    const hp = max.slice();
    const next = [0.9 + R() * 0.6, 0.9 + R() * 0.6];
    const ev = [];
    let ko = -1, t = 0;
    for (;;) {
      const who = next[0] <= next[1] ? 0 : 1, foe = 1 - who;
      t = next[who];
      if (t >= RMAX) break;
      const miss = R() < 0.16, crit = !miss && R() < 0.2;
      const dmg = miss ? 0 : Math.round(fs[who].atk * (0.6 + R() * 0.8) * (crit ? 2 : 1));
      hp[foe] = Math.max(0, hp[foe] - dmg);
      ev.push({ t, who, dmg, miss, crit, hp: [hp[0], hp[1]] });
      next[who] = t + (1.55 / fs[who].spd) * (0.85 + R() * 0.3);
      if (hp[foe] <= 0) { ko = foe; break; }
    }
    const win = ko >= 0 ? 1 - ko : hp[0] / max[0] >= hp[1] / max[1] ? 0 : 1;
    return { ev, win, ko, end: ko >= 0 ? t : RMAX, max };
  }
  /** Cả trận Bo3 */
  function bo3(fs, seed) {
    const rounds = [], score = [0, 0];
    for (let i = 0; i < 3 && score[0] < 2 && score[1] < 2; i++) { const x = simulate(fs, seed * 3 + i); rounds.push(x); score[x.win]++; }
    const last = rounds[rounds.length - 1];
    return { rounds, score, win: score[0] > score[1] ? 0 : 1, decided: (rounds.length - 1) * (RD + BRK) + last.end };
  }

  const cache = new Map();
  /** Thông tin trận r: cặp đấu, tỉ lệ ăn, kết quả */
  function round(r) {
    if (cache.has(r)) return cache.get(r);
    const fs = match(r);
    // ước lượng xác suất thắng bằng 60 trận Bo3 thử → tỉ lệ trả thưởng
    let wa = 0;
    for (let k = 0; k < 60; k++) if (bo3(fs, r * 1000 + 500 + k).win === 0) wa++;
    const pa = Math.min(0.9, Math.max(0.1, wa / 60));
    const odds = [pa, 1 - pa].map((p) => Math.round(Math.min(7, Math.max(1.15, 0.94 / p)) * 100) / 100);
    const res = { r, fs, odds, sim: bo3(fs, r * 1000 + 7) };
    cache.set(r, res);
    if (cache.size > 30) cache.delete(cache.keys().next().value);
    return res;
  }

  /** Trạng thái hiện tại: giai đoạn, hiệp đang đấu, tỉ số */
  function state() {
    const s = nowS(), r = roundAt(s), into = s - r * ROUND;
    const info = round(r);
    if (into < BET) return { ...info, phase: 'bet', left: BET - into, into, score: [0, 0] };
    const ft = into - BET;
    if (into < BET + FIGHT && ft < info.sim.decided + 2.5) {
      const ri = Math.min(Math.floor(ft / (RD + BRK)), info.sim.rounds.length - 1);
      const rt = ft - ri * (RD + BRK), cur = info.sim.rounds[ri];
      const score = [0, 0];
      info.sim.rounds.forEach((x, i) => { if (i < ri || (i === ri && rt >= x.end)) score[x.win]++; });
      return { ...info, phase: 'fight', ft, ri, rt, cur, brk: rt >= cur.end, score, left: BET + FIGHT - into, into };
    }
    return { ...info, phase: 'show', left: ROUND - into, into, score: info.sim.score };
  }
  /** Trận r đã có kết quả chưa (để trả thưởng) */
  const finished = (r) => nowS() >= r * ROUND + BET + round(r).sim.decided + 1;

  /* ---------- Đặt cược + trả thưởng ---------- */
  const pool = { r: -1, a: 0, b: 0 };
  function placeBet(side, amt) {
    const S = AV.S, st = state();
    amt = Math.floor(amt);
    if (st.phase !== 'bet') { UI.toast('⏳ Hết giờ đặt cược trận này, đợi trận sau nhé!'); return false; }
    if (!(amt > 0)) { UI.toast('Nhập số xu muốn cược'); return false; }
    if (amt > S.coins) { UI.toast(`Không đủ xu 😢 (bạn có ${S.coins.toLocaleString('vi-VN')} xu)`); return false; }
    const cur = S.arenaBet && S.arenaBet.r === st.r ? S.arenaBet : null;
    if (cur && cur.side !== side) { UI.toast('Trận này bạn đã cược bên kia rồi — mỗi trận chỉ cược 1 bên'); return false; }
    S.coins -= amt;
    S.arenaBet = { r: st.r, side, amt: (cur ? cur.amt : 0) + amt, odds: st.odds[side] };
    addPool(st.r, side, amt);
    AV.markChanged();
    UI.updateHud();
    const f = st.fs[side];
    UI.toast(`💰 Đã cược ${amt.toLocaleString('vi-VN')} xu cho ${f.icon} ${f.name} (x${st.odds[side]})`, 3000);
    if (NET.sendArena) NET.sendArena({ r: st.r, side, amt, name: S.name });
    return true;
  }
  function addPool(r, side, amt) {
    if (pool.r !== r) { pool.r = r; pool.a = 0; pool.b = 0; }
    pool[side ? 'b' : 'a'] += amt;
  }
  function onNet(m) {
    const r = +m.r, side = m.side === 1 ? 1 : 0, amt = Math.max(0, Math.floor(+m.amt || 0));
    if (!amt || r !== state().r) return;
    addPool(r, side, amt);
    const f = round(r).fs[side];
    UI.chatLog('', `💰 ${String(m.name || 'Ai đó').slice(0, 16)} cược ${amt.toLocaleString('vi-VN')} xu cho ${f.icon} ${f.name}`, false, true);
  }
  /** Trả thưởng khi trận đã xong (kể cả lúc bạn đã ra khỏi đấu trường) */
  function settle() {
    const S = AV.S, b = S && S.arenaBet;
    if (!b || !finished(b.r)) return;
    const res = round(b.r), f = res.fs[b.side];
    S.arenaBet = null;
    const won = res.sim.win === b.side;
    const log = S.arenaLog = (S.arenaLog || []).slice(-9);
    if (won) {
      const pay = Math.floor(b.amt * b.odds);
      S.coins += pay;
      log.push({ r: b.r, f: f.name, amt: b.amt, pay });
      UI.toast(`🏆 ${f.icon} ${f.name} THẮNG! Bạn ăn ${pay.toLocaleString('vi-VN')} xu (cược ${b.amt.toLocaleString('vi-VN')} × ${b.odds})`, 5000);
      if (pay >= 1000) NET.sendSys(`${S.name} vừa thắng ${pay.toLocaleString('vi-VN')} xu ở Đấu Trường MMA nhờ cược ${f.name} 🏆`);
    } else {
      log.push({ r: b.r, f: f.name, amt: b.amt, pay: 0 });
      UI.toast(`😢 ${f.icon} ${f.name} thua rồi… mất ${b.amt.toLocaleString('vi-VN')} xu`, 4000);
    }
    AV.markChanged();
    UI.updateHud();
  }

  /* ---------- Thanh thông tin trên màn hình khi ở trong đấu trường ---------- */
  let bar = null, barKey = '';
  function ensureBar() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'arena-bar';
    document.body.appendChild(bar);
    bar.addEventListener('click', (e) => { if (e.target.closest('[data-abet]')) UI.arenaPanel(); });
    return bar;
  }
  function updateBar() {
    const inArena = AV.currentMap && AV.currentMap() === 'arena';
    const el = ensureBar();
    el.style.display = inArena ? 'flex' : 'none';
    if (!inArena) return;
    const st = state(), S = AV.S, [A, B] = st.fs;
    const my = S.arenaBet && S.arenaBet.r === st.r ? S.arenaBet : null;
    const left = Math.ceil(st.left);
    const status = st.phase === 'bet' ? `🔔 Mở cược · còn ${left}s` : st.phase === 'fight' ? `🥊 Hiệp ${st.ri + 1}/3 · ${st.score[0]} - ${st.score[1]}` : `🏆 ${st.fs[st.sim.win].name} thắng ${st.sim.score[st.sim.win]}-${st.sim.score[1 - st.sim.win]}!`;
    const mine = my ? `Bạn cược <b>${my.amt.toLocaleString('vi-VN')}</b> xu cho ${st.fs[my.side].icon} (x${my.odds})` : st.phase === 'bet' ? 'Chưa cược trận này' : '';
    const pl = pool.r === st.r ? pool : { a: 0, b: 0 };
    const key = [st.r, st.phase, st.phase === 'fight' ? st.ri + ':' + st.score : left, mine, pl.a, pl.b].join('|');
    if (key === barKey) return;
    barKey = key;
    const side = (f, o, p, k) => `<div class="ab-side ${st.phase === 'show' && st.sim.win === k ? 'win' : ''}"><span class="ab-ic">${f.icon}</span><b>${f.name}</b><small>x${o} · 💰${p.toLocaleString('vi-VN')}</small></div>`;
    el.innerHTML = `${side(A, st.odds[0], pl.a, 0)}<div class="ab-mid"><div class="ab-st">${status}</div><small>${mine}</small>${st.phase === 'bet' ? '<button class="btn small" data-abet>💰 Đặt cược</button>' : ''}</div>${side(B, st.odds[1], pl.b, 1)}`;
  }

  /* ---------- Vẽ trận đấu trong lồng ---------- */
  function fighterPose(st, k) {
    const side = k === 0 ? -1 : 1;
    const p = { x: RING.x + side * 250, y: RING.y + 20, dir: -side, lunge: 0, hit: 0, angry: false, moving: false, ko: false, hp: 1, max: 1 };
    if (st.phase === 'bet') { p.x += Math.sin(nowS() * 2 + k) * 6; p.moving = true; return p; }
    if (st.phase === 'show') { p.x = RING.x + side * 140; p.ko = st.sim.win !== k && st.sim.rounds[st.sim.rounds.length - 1].ko === k; return p; }
    const cur = st.cur, rt = st.rt;
    p.max = cur.max[k]; p.hp = cur.max[k];
    if (st.brk && rt - cur.end > 1.2) { p.x = RING.x + side * 260; p.moving = rt - cur.end < 2.2; return p; }
    const approach = Math.min(1, rt / 1.3);
    p.x = RING.x + side * (250 - 160 * approach);
    p.moving = rt < 1.3;
    for (const e of cur.ev) {
      if (e.t > rt) break;
      p.hp = e.hp[k];
      const dt = rt - e.t;
      if (e.who === k && dt < 0.45) { p.lunge = Math.sin((dt / 0.45) * Math.PI); p.angry = true; }
      if (e.who !== k && dt < 0.4 && !e.miss) p.hit = 1 - dt / 0.4;
    }
    if (cur.ko === k && rt >= cur.end) p.ko = true;
    p.x += -side * p.lunge * 70 + side * p.hit * 24;
    return p;
  }

  function drawRing(ctx, t) {
    const st = state();
    const P = [fighterPose(st, 0), fighterPose(st, 1)];
    P.forEach((p, k) => {
      const f = st.fs[k];
      ctx.save();
      ctx.translate(p.x, p.y);
      if (p.ko) { ctx.globalAlpha = 0.75; ctx.rotate(-p.dir * 1.2); }
      if (st.phase === 'show' && st.sim.win === k) ctx.translate(0, -Math.abs(Math.sin(t * 6)) * 18);
      const sc = f.id === 'dog' || f.id === 'shepherd' ? 1.9 : 1.45;
      ctx.scale(sc, sc);
      if (p.hit > 0.3) ctx.filter = 'brightness(2.2)';
      ART.guard(ctx, 0, 0, f.id, p.dir, t + k, p.moving || p.lunge > 0, p.angry || (st.phase === 'fight' && !st.brk));
      ctx.filter = 'none';
      ctx.restore();
      // thanh máu (máu của hiệp đang đấu) + tên + số hiệp thắng
      const w = 150, x = p.x - w / 2, y = p.y - 175, ratio = Math.max(0, p.hp / p.max);
      ctx.fillStyle = 'rgba(20,20,30,.75)'; ctx.beginPath(); ctx.roundRect(x - 3, y - 3, w + 6, 16, 6); ctx.fill();
      ctx.fillStyle = ratio > 0.5 ? '#51cf66' : ratio > 0.25 ? '#fcc419' : '#ff6b6b'; ctx.beginPath(); ctx.roundRect(x, y, w * ratio, 10, 4); ctx.fill();
      ctx.font = '900 15px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const label = `${f.icon} ${f.name} ${'🏅'.repeat(st.score[k])}`;
      ctx.lineWidth = 4; ctx.strokeStyle = '#2a1405'; ctx.strokeText(label, p.x, y - 14); ctx.fillStyle = '#ffd43b'; ctx.fillText(label, p.x, y - 14);
    });
    if (st.phase === 'fight') {
      for (const e of st.cur.ev) {
        const dt = st.rt - e.t;
        if (dt < 0) break;
        if (dt > 0.9) continue;
        const tgt = P[1 - e.who], txt = e.miss ? 'HỤT' : `${e.crit ? '💥 ' : ''}-${e.dmg}`;
        ctx.globalAlpha = 1 - dt / 0.9;
        ctx.font = `900 ${e.crit ? 30 : 24}px "Be Vietnam Pro", system-ui, sans-serif`;
        ctx.lineWidth = 5; ctx.strokeStyle = '#2a1405'; ctx.strokeText(txt, tgt.x, tgt.y - 120 - dt * 60);
        ctx.fillStyle = e.miss ? '#dee2e6' : e.crit ? '#ff922b' : '#ff6b6b'; ctx.fillText(txt, tgt.x, tgt.y - 120 - dt * 60);
        ctx.globalAlpha = 1;
      }
    }
    let big = '';
    if (st.phase === 'bet') big = st.left < 4 ? `${Math.ceil(st.left)}` : 'ĐẶT CƯỢC!';
    else if (st.phase === 'fight') {
      const cur = st.cur, nm = st.fs[cur.win].name;
      if (st.rt < 1.3) big = `HIỆP ${st.ri + 1}`;
      else if (st.rt >= cur.end) big = cur.ko >= 0 && st.rt < cur.end + 1.2 ? 'K.O!' : `Hiệp ${st.ri + 1}: ${nm} thắng${cur.ko >= 0 ? ' (KO)' : ''} · ${st.score[0]}-${st.score[1]}`;
    } else big = `🏆 ${st.fs[st.sim.win].name} ${st.sim.score[st.sim.win]}-${st.sim.score[1 - st.sim.win]}`;
    if (big) {
      const fsz = big.length > 16 ? 34 : 54;
      ctx.font = `900 ${fsz}px "Be Vietnam Pro", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 9; ctx.strokeStyle = '#2a1405'; ctx.strokeText(big, RING.x, RING.y - 300);
      ctx.fillStyle = st.phase === 'show' ? '#ffd43b' : '#fff'; ctx.fillText(big, RING.x, RING.y - 300);
    }
  }

  /* ---------- Lồng bát giác MMA ---------- */
  const OCT = Array.from({ length: 8 }, (_, k) => { const a = Math.PI / 8 + k * Math.PI / 4; return [RING.x + Math.cos(a) * RING.rx, RING.y + Math.sin(a) * RING.ry]; });
  const POST_H = 120;
  function fence(ctx, back) {
    for (let k = 0; k < 8; k++) {
      const a = OCT[k], b = OCT[(k + 1) % 8];
      const isBack = (a[1] + b[1]) / 2 < RING.y;
      if (isBack !== back) continue;
      // lưới thép
      ctx.fillStyle = 'rgba(30,32,36,.18)';
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0], b[1] - POST_H); ctx.lineTo(a[0], a[1] - POST_H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(25,25,28,.42)'; ctx.lineWidth = 1;
      const n = Math.max(6, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 14));
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const P = (j, top) => { const u = Math.max(0, Math.min(1, j / n)); return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - (top ? POST_H : 0)]; };
        const p0 = P(i, false), p1 = P(i + 4, true), p2 = P(i - 4, true);
        ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p2[0], p2[1]);
      }
      ctx.stroke();
      // thanh trên + đệm dưới
      ctx.strokeStyle = '#111'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(a[0], a[1] - POST_H); ctx.lineTo(b[0], b[1] - POST_H); ctx.stroke();
      ctx.strokeStyle = '#1c1c1f'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(a[0], a[1] - 4); ctx.lineTo(b[0], b[1] - 4); ctx.stroke();
      ctx.strokeStyle = '#f08c00'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1] - 9); ctx.lineTo(b[0], b[1] - 9); ctx.stroke();
    }
    // cột đệm đen chữ cam
    OCT.forEach(([x, y]) => {
      if ((y < RING.y) !== back) return;
      ctx.fillStyle = '#18181b'; ctx.beginPath(); ctx.roundRect(x - 11, y - POST_H - 10, 22, POST_H + 12, 5); ctx.fill();
      ctx.save(); ctx.translate(x + 1, y - POST_H / 2 - 4); ctx.rotate(-Math.PI / 2);
      ctx.font = '900 11px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ff922b';
      ctx.fillText('MIXED MARTIAL ARTS', 0, 0);
      ctx.restore();
    });
  }
  const cageBack = (ctx) => fence(ctx, true);
  const cageFront = (ctx) => fence(ctx, false);

  /** Bảng điểm lớn trên khán đài */
  function drawBoard(ctx, x, y) {
    const st = state();
    ctx.fillStyle = '#2b1d14'; ctx.beginPath(); ctx.roundRect(x - 330, y - 70, 660, 130, 16); ctx.fill();
    ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(x - 314, y - 56, 628, 102, 10); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '900 26px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillStyle = '#ffa94d'; ctx.fillText(`${st.fs[0].icon} ${st.fs[0].name}`, x - 170, y - 22);
    ctx.fillStyle = '#74c0fc'; ctx.fillText(`${st.fs[1].name} ${st.fs[1].icon}`, x + 170, y - 22);
    ctx.font = '900 30px "Be Vietnam Pro", system-ui, sans-serif'; ctx.fillStyle = '#ff6b6b'; ctx.fillText('VS', x, y - 22);
    ctx.font = '800 20px "Be Vietnam Pro", system-ui, sans-serif'; ctx.fillStyle = '#fff3bf';
    ctx.fillText(`x${st.odds[0]}`, x - 170, y + 16); ctx.fillText(`x${st.odds[1]}`, x + 170, y + 16);
    ctx.fillStyle = '#51cf66';
    ctx.fillText(st.phase === 'bet' ? `CƯỢC ${Math.ceil(st.left)}s` : st.phase === 'fight' ? `H${st.ri + 1} · ${st.score[0]}-${st.score[1]}` : `${st.sim.score[0]}-${st.sim.score[1]}`, x, y + 16);
  }

  /** Khán giả nhấp nhô trên khán đài */
  function drawCrowd(ctx, t) {
    const st = state(), hype = st.phase === 'fight' ? 1 : 0.35;
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 34; i++) {
        const x = 90 + i * 56 + (row % 2) * 28, y = 250 + row * 34;
        const seed = (i * 37 + row * 11) % 17;
        const bob = Math.max(0, Math.sin(t * (4 + seed % 4) + seed)) * 6 * hype;
        ctx.fillStyle = ['#ff8787', '#74c0fc', '#ffd43b', '#b197fc', '#63e6be', '#ffa94d'][seed % 6];
        ctx.fillRect(x - 9, y - 8 - bob, 18, 14);
        ctx.fillStyle = ['#ffd8b5', '#e3a979', '#b97a51'][seed % 3];
        ctx.fillRect(x - 6, y - 20 - bob, 12, 12);
        ctx.fillStyle = ['#2b2b33', '#6b3e26', '#f4d06f'][seed % 3];
        ctx.fillRect(x - 6, y - 22 - bob, 12, 4);
        if (hype > 0.5 && seed % 5 === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(x + 8, y - 26 - bob, 3, 10); }
      }
    }
  }

  /** Toà nhà Đấu Trường MMA ở Khu giải trí (kiểu đấu trường La Mã) */
  function building(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 4, 280, 26, 0, 0, Math.PI * 2); c.fill();
    // thân tròn 2 tầng vòm
    c.fillStyle = '#d9b77e'; c.beginPath(); c.moveTo(x - 260, y); c.lineTo(x - 260, y - 230); c.quadraticCurveTo(x, y - 330, x + 260, y - 230); c.lineTo(x + 260, y); c.closePath(); c.fill();
    c.strokeStyle = '#7a5a2a'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#c49a5a'; c.fillRect(x - 260, y - 120, 520, 10); c.fillRect(x - 260, y - 214, 520, 8);
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
      const ax = x - 232 + i * 58, ay = row ? y - 20 : y - 130;
      if (row === 1 && i === 4) continue;
      c.fillStyle = '#5c3d1e'; c.beginPath(); c.moveTo(ax - 18, ay); c.lineTo(ax - 18, ay - 60); c.arc(ax, ay - 60, 18, Math.PI, 0); c.lineTo(ax + 18, ay); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,200,120,.25)'; c.fillRect(ax - 12, ay - 50, 6, 40);
    }
    // cổng lớn có song sắt
    c.fillStyle = '#2b1d14'; c.beginPath(); c.moveTo(x - 50, y); c.lineTo(x - 50, y - 80); c.arc(x, y - 80, 50, Math.PI, 0); c.lineTo(x + 50, y); c.closePath(); c.fill();
    c.strokeStyle = '#868e96'; c.lineWidth = 4;
    for (let k = -36; k <= 36; k += 18) { c.beginPath(); c.moveTo(x + k, y - 4); c.lineTo(x + k, y - 120 + Math.abs(k) * 0.6); c.stroke(); }
    // cờ đỏ + biển tên
    [[-200, '#e03131'], [200, '#1c7ed6'], [0, '#fcc419']].forEach(([dx, col]) => {
      c.fillStyle = '#495057'; c.fillRect(x + dx - 2, y - 340 + (dx ? 40 : 0), 4, 70);
      c.fillStyle = col; c.beginPath(); c.moveTo(x + dx + 2, y - 338 + (dx ? 40 : 0)); c.lineTo(x + dx + 44, y - 326 + (dx ? 40 : 0)); c.lineTo(x + dx + 2, y - 312 + (dx ? 40 : 0)); c.closePath(); c.fill();
    });
    c.fillStyle = '#8b1a1a'; c.beginPath(); c.roundRect(x - 185, y - 262, 370, 52, 12); c.fill();
    c.strokeStyle = '#ffd43b'; c.lineWidth = 4; c.stroke();
    c.font = '900 30px "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#ffd43b'; c.fillText('🥊 ĐẤU TRƯỜNG MMA', x, y - 236);
  }

  /** Sàn lồng: thảm đen, viền đệm, logo lục giác cam ở giữa (vẽ dưới chân) */
  function floor(g) {
    g.fillStyle = '#1e1f23';
    g.beginPath(); OCT.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
    g.strokeStyle = '#2c2d33'; g.lineWidth = 2;
    for (let k = 1; k < 6; k++) { g.beginPath(); g.ellipse(RING.x, RING.y, RING.rx * k / 6, RING.ry * k / 6, 0, 0, Math.PI * 2); g.stroke(); }
    // logo lục giác
    const hex = (r, w) => { g.lineWidth = w; g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const x = RING.x + Math.cos(a) * r, y = RING.y + Math.sin(a) * r * 0.48; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke(); };
    g.strokeStyle = '#f59f00'; hex(92, 9); hex(62, 7);
    g.fillStyle = '#f59f00'; g.fillRect(RING.x - 40, RING.y - 3, 80, 6);
    g.font = '900 20px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(245,159,0,.85)';
    g.fillText('MMA', RING.x, RING.y + 70);
  }

  setInterval(() => { try { settle(); updateBar(); } catch (e) { /* chưa sẵn sàng */ } }, 500);

  return { FIGHTERS, RING, state, placeBet, onNet, drawRing, drawBoard, drawCrowd, building, floor, cageBack, cageFront, round, ROUND };
})();
