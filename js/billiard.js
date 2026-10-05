/* Bàn bi-a 2 người trong Nhà Casino.
 * Chủ bàn (người ngồi đầu tiên) tính luật và kết quả mỗi cú đánh rồi gửi trạng thái cho mọi người.
 * Mỗi máy tự mô phỏng lại đường bi lăn (cùng phép tính nên ra cùng kết quả) để xem bi chạy, xong thì khớp theo chủ bàn. */
const BIL = (() => {
  const T = { id: 'bida1', x: 1580, y: 720, zone: 'casino' };
  const W = 600, H = 300, R = 10, PR = 19, FRICTION = 150, MAXV = 950, STEP = 1 / 120;
  const POCKETS = [[0, 0], [W / 2, -6], [W, 0], [0, H], [W / 2, H + 6], [W, H]];
  const COLORS = ['#fff', '#fcc419', '#1c7ed6', '#e03131', '#7048e8', '#fd7e14', '#2b8a3e', '#862e9c', '#212529', '#f08c00'];
  const TURN_MS = 40000, REWARD = 40;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fresh = () => ({ host: null, seats: [null, null], game: null, v: 0 });
  let st = fresh();
  let lastHostMsg = 0, viewOpen = false, anim = null, aim = null, seenShot = 0;
  const paid = new Set();

  const me = () => NET.pid;
  const mySeat = () => st.seats.findIndex((s) => s && s.id === me());
  const seated = () => mySeat() >= 0;
  const isHost = () => st.host === me();
  const send = (p) => NET.sendTable({ table: T.id, ...p });
  const inZone = () => AV.currentMap() === T.zone;
  const gameOn = () => st.game && !st.game.end;
  const solo = () => st.seats.filter(Boolean).length < 2;

  /* ================= VẬT LÝ (giống hệt nhau trên mọi máy) ================= */
  function rack() {
    const balls = [{ n: 0, x: 150, y: H / 2, vx: 0, vy: 0, in: false }];
    const order = [1, 2, 3, 9, 4, 5, 6, 7, 8];
    let k = 0;
    [1, 2, 3, 2, 1].forEach((cnt, col) => {
      for (let r = 0; r < cnt; r++) {
        const x = 420 + col * (R * 1.75), y = H / 2 + (r - (cnt - 1) / 2) * (R * 2.02);
        balls.push({ n: order[k++], x, y, vx: 0, vy: 0, in: false });
      }
    });
    return balls;
  }

  const clone = (balls) => balls.map((b) => ({ n: b.n, x: b.x, y: b.y, vx: 0, vy: 0, in: b.in }));

  /** Một bước mô phỏng. Trả về danh sách bi vừa rơi lỗ */
  function step(balls, out) {
    for (const b of balls) {
      if (b.in || (b.vx === 0 && b.vy === 0)) continue;
      b.x += b.vx * STEP; b.y += b.vy * STEP;
      const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy), ns = Math.max(0, sp - FRICTION * STEP);
      if (ns < 2) { b.vx = 0; b.vy = 0; } else { b.vx *= ns / sp; b.vy *= ns / sp; }
      for (const [px, py] of POCKETS) {
        const dx = b.x - px, dy = b.y - py;
        if (dx * dx + dy * dy < PR * PR) { b.in = true; b.vx = 0; b.vy = 0; out.push(b.n); break; }
      }
      if (b.in) continue;
      if (b.x < R) { b.x = R; b.vx = -b.vx * 0.82; }
      if (b.x > W - R) { b.x = W - R; b.vx = -b.vx * 0.82; }
      if (b.y < R) { b.y = R; b.vy = -b.vy * 0.82; }
      if (b.y > H - R) { b.y = H - R; b.vy = -b.vy * 0.82; }
    }
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      if (a.in) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j];
        if (b.in) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
        if (d2 >= 4 * R * R || d2 === 0) continue;
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        const push = (2 * R - d) / 2;
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        if (rel > 0) {
          const imp = rel * 0.97;
          a.vx -= imp * nx; a.vy -= imp * ny; b.vx += imp * nx; b.vy += imp * ny;
        }
      }
    }
  }
  const moving = (balls) => balls.some((b) => !b.in && (b.vx !== 0 || b.vy !== 0));

  function shoot(balls, vx, vy) {
    const cue = balls.find((b) => b.n === 0);
    cue.vx = vx; cue.vy = vy;
  }

  /** Chạy hết cú đánh ngay lập tức (chủ bàn dùng để tính kết quả) */
  function simulate(start, vx, vy) {
    const balls = clone(start), potted = [];
    shoot(balls, vx, vy);
    for (let k = 0; k < 120 * 25 && moving(balls); k++) step(balls, potted);
    balls.forEach((b) => { b.vx = 0; b.vy = 0; });
    return { balls, potted };
  }

  /* ================= CHỦ BÀN ================= */
  function broadcast() {
    st.v++;
    send({ a: 'state', s: st });
    afterState();
  }

  function hostStart() {
    if (gameOn()) return;
    if (!st.seats[0] && !st.seats[1]) return;
    st.game = { round: Date.now(), balls: rack(), turn: st.seats[0] ? 0 : 1, scores: [0, 0], shot: 0, last: null, msg: 'Bắt đầu! Kéo ngược từ bi trắng để ngắm, thả tay để đánh', end: null, turnEnds: Date.now() + TURN_MS, solo: solo() };
    broadcast();
  }

  function hostShot(seat, vx, vy) {
    const g = st.game;
    if (!gameOn() || g.turn !== seat || !Number.isFinite(vx) || !Number.isFinite(vy)) return;
    const sp = Math.sqrt(vx * vx + vy * vy);
    if (sp > MAXV) { vx *= MAXV / sp; vy *= MAXV / sp; }
    vx = Math.round(vx * 100) / 100; vy = Math.round(vy * 100) / 100;
    const prev = clone(g.balls);
    const { balls, potted } = simulate(prev, vx, vy);
    const scratch = potted.includes(0);
    const objs = potted.filter((n) => n > 0);
    const pts = objs.reduce((a, n) => a + (n === 9 ? 2 : 1), 0) - (scratch ? 1 : 0);
    g.scores[seat] = Math.max(0, g.scores[seat] + pts);
    const name = st.seats[seat] ? st.seats[seat].name : '?';
    if (scratch) {
      const cue = balls.find((b) => b.n === 0);
      cue.in = false; cue.x = 150; cue.y = H / 2;
      while (balls.some((b) => b !== cue && !b.in && Math.abs(b.x - cue.x) < 2 * R + 1 && Math.abs(b.y - cue.y) < 2 * R + 1)) cue.y += 2 * R + 2;
    }
    const other = 1 - seat;
    const keep = objs.length > 0 && !scratch;
    if (!keep && st.seats[other]) g.turn = other;
    g.msg = scratch ? `😬 ${name} đánh bi trắng rơi lỗ: -1 điểm` : objs.length ? `🎯 ${name} đưa ${objs.length} bi vào lỗ (+${pts})${keep ? ', đánh tiếp!' : ''}` : `${name} không vào bi`;
    g.balls = balls;
    g.shot++;
    g.last = { no: g.shot, prev, vx, vy };
    g.turnEnds = Date.now() + TURN_MS;
    if (balls.every((b) => b.n === 0 || b.in)) {
      const [a, b] = g.scores;
      const win = st.seats[1] && st.seats[0] ? (a === b ? -1 : a > b ? 0 : 1) : seat;
      g.end = { win, msg: win < 0 ? `Hoà ${a} - ${b}!` : `🏆 ${st.seats[win].name} thắng ${Math.max(a, b)} - ${Math.min(a, b)}!` };
    }
    broadcast();
  }

  function hostRemove(id) {
    const i = st.seats.findIndex((s) => s && s.id === id);
    if (i < 0) return;
    st.seats[i] = null;
    if (gameOn()) { st.game.end = { win: st.seats[1 - i] ? 1 - i : -1, msg: 'Đối thủ đã rời bàn', left: true }; }
  }

  /* ================= NHẬN TIN ================= */
  function onNet(m) {
    if (m.table !== T.id) return;
    const from = m.id;
    switch (m.a) {
      case 'state':
        if (m.s.host !== from && st.host !== from) return;
        if (isHost() && from !== me() && st.v > m.s.v) return;
        // mới vào xem: không chiếu lại cú đánh cũ
        if (!seenShot && !seated() && m.s.game && m.s.game.last) seenShot = m.s.game.last.no;
        st = m.s;
        lastHostMsg = Date.now();
        afterState();
        break;
      case 'req': if (isHost()) broadcast(); break;
      case 'sit':
        if (isHost() && !st.seats[m.seat] && !st.seats.some((s) => s && s.id === from) && !gameOn()) {
          st.seats[m.seat] = { id: from, name: String(m.name).slice(0, 16) };
          broadcast();
        }
        break;
      case 'leave': if (isHost()) { hostRemove(from); broadcast(); } break;
      case 'shot': {
        if (!isHost()) return;
        const seat = st.seats.findIndex((s) => s && s.id === from);
        if (seat >= 0) hostShot(seat, +m.vx, +m.vy);
        break;
      }
      default:
    }
  }

  /** Có trạng thái mới: chạy hoạt cảnh cú đánh (nếu có), trả thưởng khi hết ván */
  function afterState() {
    const g = st.game;
    if (g && g.last && g.last.no > seenShot) {
      seenShot = g.last.no;
      const balls = clone(g.last.prev);
      shoot(balls, g.last.vx, g.last.vy);
      anim = { balls, potted: [], acc: 0, steps: 0 };
      if (typeof MUSIC !== 'undefined' && MUSIC.clack) MUSIC.clack();
    }
    if (g && g.end && !paid.has(g.round)) {
      paid.add(g.round);
      const my = mySeat();
      if (my >= 0 && !g.solo && !g.end.left) {
        if (g.end.win === my) { AV.earn(REWARD, 20); UI.toast(`🏆 Bạn thắng ván bi-a! +${REWARD} xu`, 4000); AV.sayMine('🎱 Thắng rồi!'); }
        else if (g.end.win < 0) { AV.earn(10, 10); UI.toast('🤝 Hoà! +10 xu'); }
        else { AV.earn(0, 8); UI.toast('Thua mất rồi, ván sau gỡ nhé! +8 XP'); }
      } else if (my >= 0 && g.end.left && g.end.win === my) UI.toast('Đối thủ rời bàn — ván dừng lại');
    }
    if (!seated() && $('#bilBtn')) $('#bilBtn').classList.remove('show');
    if (viewOpen) render();
  }

  /* ================= NGƯỜI CHƠI ================= */
  function hostStale() { return !st.host || (st.host !== me() && Date.now() - lastHostMsg > 9000); }

  function placeMe() {
    const i = mySeat();
    if (i >= 0) AV.setSeatPos(T.x + (i ? 185 : -185), T.y - 8, i ? -1 : 1);
  }

  function sit(seat) {
    if (seated() || st.seats[seat]) return;
    if (gameOn()) return UI.toast('Ván đang chơi, đợi ván sau nhé');
    if (hostStale()) {
      st = fresh();
      st.host = me();
      st.seats[seat] = { id: me(), name: AV.S.name };
      broadcast();
      UI.toast('Bạn là chủ bàn — đợi bạn bè vào ghế còn lại rồi bấm Bắt đầu (hoặc tập một mình)');
    } else {
      send({ a: 'sit', seat, name: AV.S.name });
    }
    setTimeout(placeMe, 600);
  }

  function leave(silent) {
    const i = mySeat();
    if (i < 0) return;
    if (isHost()) {
      hostRemove(me());
      const next = st.seats.find(Boolean);
      st.host = next ? next.id : null;
      if (!next) st = fresh();
      broadcast();
    } else {
      send({ a: 'leave' });
      st.seats[i] = null;
    }
    aim = null;
    AV.leaveSeat(T.x, T.y + 60);
    closeView();
    if (!silent) UI.toast('Đã rời bàn bi-a');
  }

  function shootNow(vx, vy) {
    if (!gameOn() || st.game.turn !== mySeat() || anim) return;
    if (isHost()) hostShot(mySeat(), vx, vy); else send({ a: 'shot', vx, vy });
  }

  /* ================= NHỊP GAME ================= */
  let beat = 0;
  function tick(dt) {
    if (anim) {
      anim.acc += Math.min(dt, 0.05);
      while (anim.acc >= STEP && anim) {
        anim.acc -= STEP;
        step(anim.balls, anim.potted);
        if (!moving(anim.balls)) anim = null;
      }
      if (viewOpen) draw();
    }
    if (!inZone()) return;
    beat += dt;
    if (isHost()) {
      const g = st.game;
      if (gameOn() && Date.now() > g.turnEnds && !anim) {
        const nm = st.seats[g.turn] ? st.seats[g.turn].name : '?';
        if (st.seats[1 - g.turn]) g.turn = 1 - g.turn;
        g.turnEnds = Date.now() + TURN_MS;
        g.msg = `⏰ ${nm} hết giờ, đổi lượt`;
        broadcast();
      } else if (beat > 3) { beat = 0; broadcast(); }
    } else if (seated() && st.host && Date.now() - lastHostMsg > 9000) {
      st.seats = st.seats.map((s) => (s && s.id === st.host ? null : s));
      st.host = me();
      if (st.game) st.game.end = { win: mySeat(), msg: 'Chủ bàn mất kết nối', left: true };
      broadcast();
      UI.toast('Đối thủ mất kết nối — bạn thành chủ bàn');
    }
    if (viewOpen && gameOn()) renderTimer();
  }

  function onMapChange() {
    if (seated()) leave(true);
    st = fresh(); lastHostMsg = 0; anim = null;
    closeView();
    setTimeout(() => { if (inZone()) send({ a: 'req' }); }, 900);
  }

  /* ================= GIAO DIỆN ================= */
  let cv = null, cx = null;
  function openView() {
    viewOpen = true;
    $('#bilView').classList.add('show');
    $('#bilBtn').classList.remove('show');
    if (hostStale()) send({ a: 'req' });
    render();
  }
  function closeView() {
    viewOpen = false;
    aim = null;
    const v = $('#bilView');
    if (v) v.classList.remove('show');
    const b = $('#bilBtn');
    if (b) b.classList.toggle('show', seated());
  }

  function seatHtml(i) {
    const s = st.seats[i], g = st.game, turn = g && gameOn() && g.turn === i;
    if (!s) return `<div class="bseat empty">${!seated() && !gameOn() ? `<button class="btn small" data-sit="${i}">🎱 Vào chơi</button>` : '<span>Ghế trống</span>'}</div>`;
    return `<div class="bseat ${turn ? 'turn' : ''} ${s.id === me() ? 'me' : ''}"><b>${esc(s.name)}</b><span class="bscore">${g ? g.scores[i] : 0}</span>${turn ? '<i>đang đánh</i>' : ''}</div>`;
  }

  function render() {
    const v = $('#bilView');
    const g = st.game, my = mySeat();
    const myTurn = gameOn() && g.turn === my;
    v.innerHTML = `<div class="bil-box">
      <div class="bil-head">${seatHtml(0)}<div class="bil-mid"><b>🎱 BI-A</b><small>${g ? esc(g.end ? g.end.msg : g.msg) : 'Mỗi bi 1 điểm, bi số 9 được 2 điểm. Vào bi được đánh tiếp. Bi trắng rơi lỗ -1 điểm.'}</small><div class="bil-timer"><i data-btimer></i></div></div>${seatHtml(1)}</div>
      <canvas class="bil-cv"></canvas>
      <div class="bil-foot">
        <span class="muted">${myTurn ? '👉 Lượt của bạn: kéo ngược từ bi trắng để ngắm, kéo càng xa đánh càng mạnh, thả tay để đánh' : gameOn() ? 'Đợi đối thủ đánh…' : seated() ? (isHost() ? 'Bấm Bắt đầu khi đủ người (hoặc tập một mình)' : 'Đợi chủ bàn bắt đầu…') : 'Chọn ghế để vào chơi'}</span>
        <div class="row-end">
          ${seated() && isHost() && !gameOn() ? `<button class="btn" data-start>${solo() ? '▶ Tập một mình' : '▶ Bắt đầu'}</button>` : ''}
          ${seated() ? '<button class="btn ghost" data-leave>🚪 Rời bàn</button>' : ''}
          <button class="btn ghost" data-close>✕ Đóng</button>
        </div>
      </div></div>`;
    v.querySelectorAll('[data-sit]').forEach((b) => b.onclick = () => sit(+b.dataset.sit));
    const q = (s) => v.querySelector(s);
    if (q('[data-start]')) q('[data-start]').onclick = hostStart;
    if (q('[data-leave]')) q('[data-leave]').onclick = () => leave();
    q('[data-close]').onclick = closeView;
    cv = q('.bil-cv'); cx = cv.getContext('2d');
    bindAim();
    draw();
  }

  function renderTimer() {
    const bar = document.querySelector('#bilView [data-btimer]');
    if (bar && st.game) bar.style.width = Math.max(0, (st.game.turnEnds - Date.now()) / TURN_MS * 100) + '%';
  }

  const M = 30; // viền gỗ quanh mặt bàn (đơn vị bàn)
  function fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth, h = w * (H + M * 2) / (W + M * 2);
    cv.style.height = h + 'px';
    if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const k = w / (W + M * 2);
    cx.setTransform(k * dpr, 0, 0, k * dpr, M * k * dpr, M * k * dpr);
    return k;
  }

  function draw() {
    if (!cv || !cv.isConnected) return;
    fit();
    const c = cx;
    c.fillStyle = '#5c3010'; c.beginPath(); c.roundRect(-M, -M, W + M * 2, H + M * 2, 22); c.fill();
    c.fillStyle = '#8b5a2b'; c.beginPath(); c.roundRect(-M + 6, -M + 6, W + M * 2 - 12, H + M * 2 - 12, 18); c.fill();
    c.fillStyle = '#ffd43b';
    [[W / 4, -M / 2], [W * 3 / 4, -M / 2], [W / 4, H + M / 2], [W * 3 / 4, H + M / 2], [-M / 2, H / 2], [W + M / 2, H / 2]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); });
    const fg = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.65);
    fg.addColorStop(0, '#2f9e44'); fg.addColorStop(1, '#1e6b30');
    c.fillStyle = fg; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(150, 0); c.lineTo(150, H); c.stroke();
    c.beginPath(); c.arc(450, H / 2, 3, 0, Math.PI * 2); c.stroke();
    POCKETS.forEach(([x, y]) => { c.fillStyle = '#111'; c.beginPath(); c.arc(x, y, PR, 0, Math.PI * 2); c.fill(); });
    const balls = anim ? anim.balls : st.game ? st.game.balls : rack();
    balls.forEach((b) => {
      if (b.in) return;
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(b.x + 2, b.y + 3, R, 0, Math.PI * 2); c.fill();
      c.fillStyle = COLORS[b.n]; c.beginPath(); c.arc(b.x, b.y, R, 0, Math.PI * 2); c.fill();
      if (b.n === 9) { c.fillStyle = '#fff'; c.fillRect(b.x - R, b.y - 4, R * 2, 8); c.fillStyle = COLORS[9]; c.beginPath(); c.arc(b.x, b.y, R, 0, Math.PI * 2); c.save(); c.clip(); c.fillStyle = '#fff'; c.fillRect(b.x - R, b.y - R, R * 2, 5); c.fillRect(b.x - R, b.y + R - 5, R * 2, 5); c.restore(); }
      if (b.n) { c.fillStyle = '#fff'; c.beginPath(); c.arc(b.x, b.y, 4.6, 0, Math.PI * 2); c.fill(); c.fillStyle = '#111'; c.font = '700 6.5px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.n, b.x, b.y + 0.5); }
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(b.x - 3, b.y - 3, 2.6, 0, Math.PI * 2); c.fill();
    });
    // ngắm: gậy + đường dự đoán + thanh lực
    const cue = balls.find((b) => b.n === 0 && !b.in);
    if (aim && cue) {
      const dx = cue.x - aim.x, dy = cue.y - aim.y, d = Math.sqrt(dx * dx + dy * dy) || 1, p = Math.min(1, d / 160);
      const ux = dx / d, uy = dy / d;
      c.setLineDash([6, 6]); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cue.x, cue.y); c.lineTo(cue.x + ux * 260, cue.y + uy * 260); c.stroke(); c.setLineDash([]);
      const back = R + 6 + p * 50;
      c.strokeStyle = '#c8874a'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cue.x - ux * back, cue.y - uy * back); c.lineTo(cue.x - ux * (back + 220), cue.y - uy * (back + 220)); c.stroke();
      c.strokeStyle = '#f8f9fa'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(cue.x - ux * back, cue.y - uy * back); c.lineTo(cue.x - ux * (back + 10), cue.y - uy * (back + 10)); c.stroke();
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(W / 2 - 100, H + 8, 200, 12);
      c.fillStyle = p > 0.8 ? '#ff6b6b' : p > 0.5 ? '#ffd43b' : '#69db7c'; c.fillRect(W / 2 - 100, H + 8, 200 * p, 12);
    }
  }

  function toTable(e) {
    const r = cv.getBoundingClientRect(), k = r.width / (W + M * 2);
    return { x: (e.clientX - r.left) / k - M, y: (e.clientY - r.top) / k - M };
  }
  function bindAim() {
    cv.onpointerdown = (e) => {
      if (!gameOn() || st.game.turn !== mySeat() || anim) return;
      cv.setPointerCapture(e.pointerId);
      aim = toTable(e);
      draw();
    };
    cv.onpointermove = (e) => { if (aim) { aim = toTable(e); draw(); } };
    cv.onpointerup = () => {
      if (!aim) return;
      const cue = st.game.balls.find((b) => b.n === 0);
      const dx = cue.x - aim.x, dy = cue.y - aim.y, d = Math.sqrt(dx * dx + dy * dy);
      aim = null;
      if (d < 12) { draw(); return; }
      const p = Math.min(1, d / 160);
      shootNow(dx / d * p * MAXV, dy / d * p * MAXV);
    };
  }

  function init() {
    $('#bilBtn').onclick = openView;
    window.addEventListener('resize', () => { if (viewOpen) draw(); });
  }

  return {
    init, onNet, tick, onMapChange, openView, closeView, seated, isOpen: () => viewOpen,
    get state() { return st; }, _sit: sit, _leave: leave, _start: hostStart, _shoot: shootNow, _simulate: simulate, _rack: rack, get animating() { return !!anim; },
  };
})();
