/* ♟️ CỜ CARO ở Nhà Casino — bàn 15×15, 5 quân liên tiếp là thắng (luật Việt Nam: bị chặn cả 2 đầu thì không tính).
 * Đấu với máy (Dễ / Vừa / Khó, cược xu — thắng ăn gấp đôi, hoà trả lại) hoặc 2 người chơi chung 1 máy. */
const CARO = (() => {
  const N = 15, S = () => AV.S;
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]];
  const LV = ['😊 Dễ', '😤 Vừa', '🔥 Khó'], BETS = [0, 1000, 5000, 20000, 100000];
  let st = null;

  /* ---------- luật ---------- */
  const at = (b, x, y) => (x < 0 || y < 0 || x >= N || y >= N ? -1 : b[y * N + x]);
  /** trả về dãy 5 ô thắng nếu nước (x,y) của p tạo thành 5 liên tiếp không bị chặn 2 đầu */
  function winLine(b, x, y, p) {
    for (const [dx, dy] of DIRS) {
      let a = 0, c = 0;
      while (at(b, x + (a + 1) * dx, y + (a + 1) * dy) === p) a++;
      while (at(b, x - (c + 1) * dx, y - (c + 1) * dy) === p) c++;
      if (a + c + 1 >= 5) {
        const e1 = at(b, x + (a + 1) * dx, y + (a + 1) * dy), e2 = at(b, x - (c + 1) * dx, y - (c + 1) * dy);
        const blocked = e1 !== 0 && e1 !== -1 && e2 !== 0 && e2 !== -1;
        if (a + c + 1 === 5 && blocked) continue; // chặn 2 đầu
        const line = []; for (let k = -c; k <= a; k++) line.push([x + k * dx, y + k * dy]); return line;
      }
    }
    return null;
  }

  /* ---------- máy chơi: chấm điểm từng ô theo thế công / thủ ---------- */
  const SC = { 5: [1e7, 1e7, 1e7], 4: [0, 2e4, 3e5], 3: [0, 600, 9000], 2: [0, 60, 400], 1: [0, 6, 25] };
  function lineScore(b, x, y, p) {
    let s = 0;
    for (const [dx, dy] of DIRS) {
      let a = 0, c = 0;
      while (at(b, x + (a + 1) * dx, y + (a + 1) * dy) === p) a++;
      while (at(b, x - (c + 1) * dx, y - (c + 1) * dy) === p) c++;
      const n = Math.min(5, a + c + 1), open = (at(b, x + (a + 1) * dx, y + (a + 1) * dy) === 0 ? 1 : 0) + (at(b, x - (c + 1) * dx, y - (c + 1) * dy) === 0 ? 1 : 0);
      s += n >= 5 ? SC[5][0] : SC[n][open];
    }
    return s;
  }
  function aiMove(b, me, lv) {
    const opp = 3 - me, cand = [];
    let any = false;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (b[y * N + x]) { any = true; continue; }
      let near = false; for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) if (at(b, x + dx, y + dy) > 0) { near = true; break; }
      if (!near) continue;
      const atk = lineScore(b, x, y, me), def = lineScore(b, x, y, opp);
      cand.push({ x, y, s: atk * [0.8, 1.05, 1.15][lv] + def * [0.55, 0.9, 1.0][lv] + Math.random() * [400, 60, 5][lv] });
    }
    if (!any || !cand.length) return { x: 7, y: 7 };
    cand.sort((p, q) => q.s - p.s);
    if (lv === 0 && cand.length > 2 && Math.random() < 0.35 && cand[0].s < 2e5) return cand[1 + Math.floor(Math.random() * Math.min(3, cand.length - 1))];
    return cand[0];
  }

  /* ---------- giao diện ---------- */
  function open() {
    const v = document.getElementById('arcadeView');
    v.innerHTML = `<div class="arc-bar"><b>♟️ Cờ Caro</b><span>5 quân liên tiếp · chặn 2 đầu không tính</span><button class="tv-x" data-close>✕ Thoát</button></div>
      <div class="ca-wrap"><div class="ca-side"></div><div class="ca-board"><canvas></canvas></div></div>`;
    v.classList.add('show');
    v.querySelector('[data-close]').onclick = () => { leave(); UI.closeArcade(); };
    const cv = v.querySelector('canvas');
    cv.addEventListener('pointerdown', (e) => {
      if (!st || st.over || st.busy) return;
      const r = cv.getBoundingClientRect(), cell = r.width / N, x = Math.floor((e.clientX - r.left) / cell), y = Math.floor((e.clientY - r.top) / cell);
      if (x < 0 || y < 0 || x >= N || y >= N || st.b[y * N + x]) return;
      if ((st.mode === 'ai' || st.mode === 'net') && st.turn !== st.me) return UI.toast(st.mode === 'net' ? `⏳ Chờ ${st.oppName} đi…` : '⏳ Chờ máy đi…', 1500);
      if (st.mode === 'net') send({ op: 'move', to: st.opp, gid: st.gid, x, y });
      play(x, y);
    });
    window.addEventListener('resize', draw);
    menu();
  }
  /** rời ván đang chơi (online thì báo bỏ cuộc) */
  function leave() {
    if (st && !st.over) {
      if (st.mode === 'net') { send({ op: 'resign', to: st.opp, gid: st.gid }); if (st.bet) UI.toast(`🏳️ Bỏ cuộc — mất ${fmt(st.bet)} xu cược`); }
      else if (st.mode === 'ai' && st.bet && st.moves > 1) UI.toast(`🏳️ Bỏ cuộc — mất ${fmt(st.bet)} xu cược`);
      else if (st.mode === 'ai' && st.bet) AV.earn(st.bet);
    }
    st = null;
  }
  function menu() {
    const side = document.querySelector('.ca-side'); if (!side) return;
    const pref = S().caro || (S().caro = { lv: 1, bet: 1000, w: 0, l: 0 });
    leave(); draw();
    side.innerHTML = `<h3>♟️ Cờ Caro</h3>
      <p class="muted">Bạn cầm <b style="color:#e03131">✕</b>, máy cầm <b style="color:#1c7ed6">◯</b>. Ai xếp được <b>5 quân liên tiếp</b> (ngang, dọc, chéo) trước là thắng — bị chặn cả 2 đầu thì không tính.</p>
      <label>Độ khó</label><div class="chips">${LV.map((n, i) => `<button class="chip ${pref.lv === i ? 'on' : ''}" data-lv="${i}">${n}</button>`).join('')}</div>
      <label>Tiền cược</label><div class="chips">${BETS.map((b) => `<button class="chip ${pref.bet === b ? 'on' : ''}" data-bet="${b}">${b ? fmt(b) : 'Chơi vui'}</button>`).join('')}</div>
      <p class="muted small-note">Thắng nhận gấp đôi tiền cược · hoà trả lại · thua mất tiền cược. Đã thắng máy ${pref.w} · thua ${pref.l}.</p>
      <button class="btn" data-ai>🤖 Đấu với máy</button>
      <button class="btn" data-net style="background:linear-gradient(135deg,#f08c00,#e8590c)">🌐 Mời người chơi online</button>
      <button class="btn ghost" data-pvp>👥 2 người chơi chung máy</button>`;
    side.querySelector('[data-net]').onclick = inviteList;
    side.querySelectorAll('[data-lv]').forEach((b) => b.onclick = () => { pref.lv = +b.dataset.lv; menu(); });
    side.querySelectorAll('[data-bet]').forEach((b) => b.onclick = () => { pref.bet = +b.dataset.bet; menu(); });
    side.querySelector('[data-ai]').onclick = () => start('ai');
    side.querySelector('[data-pvp]').onclick = () => start('pvp');
  }
  function start(mode) {
    const pref = S().caro;
    const bet = mode === 'ai' ? pref.bet : 0;
    if (bet && !AV.spend(bet)) return;
    const meFirst = mode === 'pvp' || Math.random() < 0.5;
    st = { mode, lv: pref.lv, bet, b: new Array(N * N).fill(0), turn: 1, me: meFirst ? 1 : 2, over: false, last: null, win: null, moves: 0, busy: false };
    side();
    draw();
    if (mode === 'ai' && st.me !== 1) aiTurn();
  }
  function side() {
    const el = document.querySelector('.ca-side'); if (!el || !st) return;
    const who = (p) => (st.mode === 'pvp' ? (p === 1 ? 'Người chơi ✕' : 'Người chơi ◯') : p === st.me ? 'Bạn' : st.mode === 'net' ? esc(st.oppName) : 'Máy');
    const sym = (p) => (p === 1 ? '<b style="color:#e03131">✕</b>' : '<b style="color:#1c7ed6">◯</b>');
    if (st.mode === 'net') return netSide(el, sym);
    el.innerHTML = `<h3>♟️ ${st.mode === 'ai' ? `Đấu máy · ${LV[st.lv]}` : '2 người chơi'}</h3>
      ${st.bet ? `<p>💰 Cược <b>${fmt(st.bet)} xu</b></p>` : ''}
      <p class="ca-turn">${st.over ? st.msg : `Lượt: ${sym(st.turn)} <b>${who(st.turn)}</b>${st.busy ? ' — đang nghĩ…' : ''}`}</p>
      ${st.mode === 'ai' ? `<p class="muted small-note">Bạn cầm ${sym(st.me)} · ${st.me === 1 ? 'bạn đi trước' : 'máy đi trước'}</p>` : ''}
      <button class="btn" data-again>🔁 Ván mới</button><button class="btn ghost" data-menu>⚙️ Đổi chế độ</button>`;
    el.querySelector('[data-again]').onclick = () => { if (st && !st.over && st.bet && st.moves > 1) UI.toast(`🏳️ Bỏ ván — mất ${fmt(st.bet)} xu cược`); start(st ? st.mode : 'ai'); };
    el.querySelector('[data-menu]').onclick = () => { if (st && !st.over && st.bet && st.moves > 1) UI.toast(`🏳️ Bỏ ván — mất ${fmt(st.bet)} xu cược`); menu(); };
  }
  function play(x, y) {
    const p = st.turn;
    st.b[y * N + x] = p; st.last = [x, y]; st.moves++;
    const line = winLine(st.b, x, y, p);
    if (line) return finish(p, line);
    if (st.moves >= N * N) return finish(0);
    st.turn = 3 - p; side(); draw();
    if (st.mode === 'ai' && st.turn !== st.me) aiTurn();
  }
  function aiTurn() {
    st.busy = true; side();
    const cur = st;
    setTimeout(() => { if (st !== cur || st.over) return; st.busy = false; const m = aiMove(st.b, st.turn, st.lv); play(m.x, m.y); }, 350 + Math.random() * 300);
  }
  function finish(p, line, why) {
    st.over = true; st.win = line || null; st.busy = false;
    const pref = S().caro || (S().caro = { lv: 1, bet: 1000, w: 0, l: 0 });
    if (st.mode === 'net') return netFinish(p, why, pref);
    if (st.mode === 'pvp') st.msg = p ? `🏆 ${p === 1 ? 'Người chơi ✕' : 'Người chơi ◯'} thắng!` : '🤝 Hoà — kín bàn rồi';
    else if (!p) { st.msg = '🤝 Hoà!'; if (st.bet) AV.earn(st.bet); }
    else if (p === st.me) { pref.w++; const prize = st.bet * 2; st.msg = `🏆 Bạn thắng!${prize ? ` +${fmt(prize)} xu` : ''}`; AV.earn(prize, [8, 15, 25][st.lv]); AV.quest('arcade'); if (st.lv === 2 && typeof NET !== 'undefined' && NET.sendSys) NET.sendSys(`♟️ ${S().name} vừa thắng máy cờ caro mức KHÓ!`); }
    else { pref.l++; st.msg = `😢 Máy thắng rồi${st.bet ? ` — mất ${fmt(st.bet)} xu` : ''}`; AV.earn(0, 3); }
    AV.markChanged(); side(); draw();
  }
  function draw() {
    const cv = document.querySelector('.ca-board canvas'); if (!cv) return;
    const box = cv.parentElement.getBoundingClientRect(), size = Math.max(200, Math.min(box.width, box.height) - 8), dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.style.width = cv.style.height = size + 'px'; cv.width = cv.height = Math.round(size * dpr);
    const g = cv.getContext('2d'), c = size / N; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#f3d9a4'; g.fillRect(0, 0, size, size);
    g.strokeStyle = 'rgba(92,58,30,.45)'; g.lineWidth = 1;
    for (let i = 0; i <= N; i++) { g.beginPath(); g.moveTo(i * c, 0); g.lineTo(i * c, size); g.moveTo(0, i * c); g.lineTo(size, i * c); g.stroke(); }
    if (!st) { g.fillStyle = 'rgba(92,58,30,.25)'; g.font = `900 ${c * 1.6}px "Be Vietnam Pro", system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('✕ ◯', size / 2, size / 2); return; }
    if (st.last) { g.fillStyle = 'rgba(255,212,59,.45)'; g.fillRect(st.last[0] * c, st.last[1] * c, c, c); }
    if (st.win) { g.fillStyle = 'rgba(105,219,124,.55)'; st.win.forEach(([x, y]) => g.fillRect(x * c, y * c, c, c)); }
    g.lineCap = 'round';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const p = st.b[y * N + x]; if (!p) continue;
      const cx = x * c + c / 2, cy = y * c + c / 2, r = c * 0.32;
      g.lineWidth = Math.max(2, c * 0.12);
      if (p === 1) { g.strokeStyle = '#e03131'; g.beginPath(); g.moveTo(cx - r, cy - r); g.lineTo(cx + r, cy + r); g.moveTo(cx + r, cy - r); g.lineTo(cx - r, cy + r); g.stroke(); }
      else { g.strokeStyle = '#1c7ed6'; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke(); }
    }
  }
  /* ======================================================================
   * 👥 CHƠI ONLINE với người chơi khác cùng khu: mời → chấp nhận → mỗi bên cược bằng nhau, thắng ăn cả
   * Tin nhắn qua NET.sendCaro (phòng của khu đang đứng). Mỗi bên tự kiểm tra nước đi và thắng thua.
   * ==================================================================== */
  const CHIPS = [0, 500, 1000, 5000, 20000, 100000];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const send = (p) => { if (typeof NET !== 'undefined' && NET.sendCaro) NET.sendCaro(p); };
  let invite = null, invP = null;
  /** chọn mức cược rồi gửi lời mời */
  function challenge(r) {
    if (st && st.mode === 'net' && !st.over) return UI.toast('Bạn đang chơi một ván caro rồi');
    let bet = 1000;
    const p = UI.panel(`♟️ Mời ${esc(r.name)} chơi caro`, '');
    const render = () => {
      p.body.innerHTML = `<p class="muted">Chọn mức cược — mỗi bên đặt bằng nhau, thắng ăn cả, hoà trả lại.</p>
        <div class="chips center">${CHIPS.map((c) => `<button class="chip ${c === bet ? 'on' : ''}" data-c="${c}">${c ? '🪙 ' + fmt(c) : 'Chơi vui'}</button>`).join('')}</div>
        <div class="row-end"><button class="btn" data-go>♟️ Gửi lời mời</button></div>`;
      p.body.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { bet = +b.dataset.c; render(); });
      p.body.querySelector('[data-go]').onclick = () => {
        if (bet > S().coins) return UI.toast(`Không đủ xu — cần ${fmt(bet)} xu`);
        if (!NET.remotes.get(r.id)) return UI.toast('⚠️ Người này vừa rời khu rồi');
        p.close();
        invite = { gid: NET.pid + '-' + Date.now(), to: r.id, name: r.name, bet };
        send({ op: 'invite', to: r.id, gid: invite.gid, bet, name: S().name });
        UI.toast(`♟️ Đã mời ${r.name} — chờ trả lời…`, 4000);
        const gid = invite.gid;
        setTimeout(() => { if (invite && invite.gid === gid) { invite = null; UI.toast('⌛ Không thấy trả lời — đã huỷ lời mời'); } }, 25000);
      };
    };
    render();
  }
  function onInvite(m) {
    const bet = Math.max(0, Math.floor(+m.bet) || 0), who = String(m.name || 'Người chơi').slice(0, 16);
    if ((st && st.mode === 'net' && !st.over) || (invP && invP.el.isConnected)) return send({ op: 'busy', to: m.id, gid: m.gid });
    invP = UI.panel('♟️ Lời mời chơi caro', `<p class="confirm-text"><b>${esc(who)}</b> mời bạn đánh cờ caro${bet ? ` · cược <b>${fmt(bet)} xu</b>` : ' (chơi vui)'}</p>
      ${S().coins < bet ? `<p class="game-msg">⚠️ Bạn không đủ xu</p>` : ''}
      <div class="row-end"><button class="btn ghost" data-no>Từ chối</button><button class="btn" data-yes ${S().coins < bet ? 'disabled' : ''}>♟️ Chơi</button></div>`);
    const ip = invP, tm = setTimeout(() => { if (ip.el.isConnected) { ip.close(); send({ op: 'decline', to: m.id, gid: m.gid, why: 'không trả lời' }); } }, 22000);
    ip.body.querySelector('[data-no]').onclick = () => { clearTimeout(tm); ip.close(); send({ op: 'decline', to: m.id, gid: m.gid, why: 'từ chối' }); };
    ip.body.querySelector('[data-yes]').onclick = () => {
      clearTimeout(tm); ip.close();
      if (bet && !AV.spend(bet)) return send({ op: 'decline', to: m.id, gid: m.gid, why: 'không đủ xu' });
      send({ op: 'accept', to: m.id, gid: m.gid });
      // người mời cầm ✕ đi trước
      startNet({ gid: m.gid, opp: m.id, oppName: who, bet, me: 2 });
    };
  }
  function startNet(o) {
    if (!document.querySelector('.ca-board')) open();
    st = { mode: 'net', lv: 0, bet: o.bet, b: new Array(N * N).fill(0), turn: 1, me: o.me, over: false, last: null, win: null, moves: 0, busy: false, gid: o.gid, opp: o.opp, oppName: o.oppName, seen: Date.now() };
    side(); draw();
    UI.toast(`♟️ Bắt đầu ván với ${o.oppName} — ${o.me === 1 ? 'bạn cầm ✕ đi trước' : 'bạn cầm ◯, đối thủ đi trước'}`, 4000);
  }
  function onNet(m) {
    if (m.to !== NET.pid) return;
    if (m.op === 'invite') return onInvite(m);
    if (m.op === 'accept' && invite && m.gid === invite.gid && m.id === invite.to) {
      const iv = invite; invite = null;
      if (iv.bet && !AV.spend(iv.bet)) { send({ op: 'resign', to: m.id, gid: m.gid, why: 'nopay' }); return; }
      return startNet({ gid: iv.gid, opp: m.id, oppName: iv.name, bet: iv.bet, me: 1 });
    }
    if ((m.op === 'decline' || m.op === 'busy') && invite && m.gid === invite.gid) { invite = null; return UI.toast(m.op === 'busy' ? '♟️ Người đó đang bận ván khác' : `♟️ Lời mời bị từ chối (${esc(m.why || 'từ chối')})`, 4000); }
    if (!st || st.mode !== 'net' || m.gid !== st.gid || m.id !== st.opp) return;
    st.seen = Date.now();
    if (m.op === 'move' && !st.over && st.turn !== st.me) {
      const x = m.x | 0, y = m.y | 0;
      if (x < 0 || y < 0 || x >= N || y >= N || st.b[y * N + x]) return;
      play(x, y, true);
    } else if (m.op === 'resign' && !st.over) {
      if (m.why === 'nopay') { if (st.bet) AV.earn(st.bet); st.over = true; st.msg = '⚠️ Đối thủ không đủ xu — đã trả lại tiền cược'; side(); draw(); return; }
      finish(st.me, null, `🏳️ ${st.oppName} bỏ cuộc — bạn thắng!`);
    } else if (m.op === 'rematch' && st.over) {
      if (st.wantRematch) { const nb = st.bet; if (nb && !AV.spend(nb)) return send({ op: 'decline', to: st.opp, gid: st.gid, why: 'không đủ xu' }); send({ op: 'rematchOk', to: st.opp, gid: st.gid }); startNet({ gid: st.gid + 'r', opp: st.opp, oppName: st.oppName, bet: nb, me: 3 - st.me }); }
      else { st.oppRematch = true; side(); }
    } else if (m.op === 'rematchOk' && st.over && st.wantRematch) {
      const nb = st.bet; if (nb && !AV.spend(nb)) return;
      startNet({ gid: st.gid + 'r', opp: st.opp, oppName: st.oppName, bet: nb, me: 3 - st.me });
    }
  }
  /** đối thủ rời khu / mất kết nối quá 30 giây → xử thắng */
  setInterval(() => {
    if (!st || st.mode !== 'net' || st.over) return;
    if (NET.remotes.get(st.opp)) { st.gone = 0; return; }
    st.gone = st.gone || Date.now();
    if (Date.now() - st.gone > 30000) finish(st.me, null, `📴 ${st.oppName} đã rời đi — bạn thắng!`);
  }, 2000);
  /** danh sách người trong khu để mời */
  function inviteList() {
    const list = NET.players().filter((r) => !r.hidden && r.id);
    const p = UI.panel('👥 Mời người chơi caro', list.length ? `<p class="muted">Người đang ở cùng khu với bạn:</p><div class="shop-list">${list.map((r, i) => `<div class="shop-row"><span class="ic">🧑</span><div class="info"><b>${esc(r.name)}</b></div><button class="btn small" data-i="${i}">♟️ Mời</button></div>`).join('')}</div>`
      : '<p class="muted">Chưa có ai ở cùng khu. Rủ bạn bè vào 🎰 Nhà Casino rồi bấm lại nhé — hoặc bấm vào nhân vật của họ → ♟️ Mời chơi caro.</p>');
    p.body.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { p.close(); challenge(list[+b.dataset.i]); });
  }
  function netSide(el, sym) {
    el.innerHTML = `<h3>🌐 Đấu với ${esc(st.oppName)}</h3>${st.bet ? `<p>💰 Cược mỗi bên <b>${fmt(st.bet)} xu</b></p>` : '<p class="muted">Chơi vui</p>'}
      <p class="ca-turn">${st.over ? st.msg : st.turn === st.me ? `👉 Tới lượt <b>bạn</b> ${sym(st.me)}` : `⏳ Chờ <b>${esc(st.oppName)}</b> ${sym(3 - st.me)}…`}</p>
      <p class="muted small-note">Bạn cầm ${sym(st.me)} · ${st.me === 1 ? 'bạn đi trước' : 'đối thủ đi trước'}</p>
      ${st.over ? `${st.oppRematch ? `<p class="game-msg">♟️ ${esc(st.oppName)} muốn đánh tiếp!</p>` : ''}<button class="btn" data-re ${st.wantRematch ? 'disabled' : ''}>${st.wantRematch ? '⏳ Chờ đối thủ…' : '🔁 Đánh ván nữa'}</button>` : '<button class="btn ghost" data-resign>🏳️ Xin thua</button>'}
      <button class="btn ghost" data-menu>⚙️ Về menu</button>`;
    const re = el.querySelector('[data-re]');
    if (re) re.onclick = () => {
      if (st.bet > S().coins) return UI.toast('Không đủ xu để đánh tiếp');
      if (st.oppRematch) { if (st.bet && !AV.spend(st.bet)) return; send({ op: 'rematchOk', to: st.opp, gid: st.gid }); startNet({ gid: st.gid + 'r', opp: st.opp, oppName: st.oppName, bet: st.bet, me: 3 - st.me }); return; }
      st.wantRematch = true; send({ op: 'rematch', to: st.opp, gid: st.gid }); side();
    };
    const rs = el.querySelector('[data-resign]');
    if (rs) rs.onclick = () => UI.confirm('Xin thua ván này?', '🏳️ Xin thua', () => { if (!st || st.over) return; send({ op: 'resign', to: st.opp, gid: st.gid }); finish(3 - st.me, null, '🏳️ Bạn đã xin thua'); });
    el.querySelector('[data-menu]').onclick = menu;
  }
  function netFinish(p, why, pref) {
    if (!p) { st.msg = '🤝 Hoà — kín bàn rồi'; if (st.bet) AV.earn(st.bet); }
    else if (p === st.me) { pref.nw = (pref.nw || 0) + 1; st.msg = `${why || '🏆 Bạn thắng!'}${st.bet ? ` +${fmt(st.bet * 2)} xu` : ''}`; AV.earn(st.bet * 2, 20); AV.quest('arcade'); if (NET.sendSys) NET.sendSys(`♟️ ${S().name} vừa thắng ${st.oppName} một ván cờ caro${st.bet ? ` (${fmt(st.bet)} xu)` : ''}!`); }
    else { pref.nl = (pref.nl || 0) + 1; st.msg = `${why || `😢 ${esc(st.oppName)} thắng rồi`}${st.bet ? ` — mất ${fmt(st.bet)} xu` : ''}`; AV.earn(0, 5); }
    AV.markChanged(); side(); draw();
  }
  /** bàn caro đặt trong Nhà Casino */
  function addTo(m, H, x, y) {
    H.sobj(m, x, y, (c) => {
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 4, 110, 18, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#5c3a1e'; c.fillRect(x - 86, y - 40, 10, 40); c.fillRect(x + 76, y - 40, 10, 40);
      c.fillStyle = '#8a5a32'; c.beginPath(); c.moveTo(x - 100, y - 40); c.lineTo(x + 100, y - 40); c.lineTo(x + 80, y - 96); c.lineTo(x - 80, y - 96); c.closePath(); c.fill();
      c.fillStyle = '#f3d9a4'; c.beginPath(); c.moveTo(x - 88, y - 46); c.lineTo(x + 88, y - 46); c.lineTo(x + 70, y - 90); c.lineTo(x - 70, y - 90); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(92,58,30,.5)'; c.lineWidth = 1;
      for (let i = 0; i <= 10; i++) { const k = i / 10; c.beginPath(); c.moveTo(x - 88 + 18 * 0 + (176 - 0) * k, y - 46); c.lineTo(x - 70 + 140 * k, y - 90); c.stroke(); const yy = y - 46 - 44 * k, w = 88 - 18 * k; c.beginPath(); c.moveTo(x - w, yy); c.lineTo(x + w, yy); c.stroke(); }
      c.font = '900 16px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; [[-30, -62, '✕', '#e03131'], [-12, -70, '◯', '#1c7ed6'], [6, -62, '✕', '#e03131'], [24, -70, '◯', '#1c7ed6'], [-6, -78, '✕', '#e03131']].forEach(([dx, dy, s, col]) => { c.fillStyle = col; c.fillText(s, x + dx, y + dy); });
      c.fillStyle = '#1b2f48'; c.beginPath(); c.roundRect(x - 60, y - 130, 120, 26, 8); c.fill(); c.fillStyle = '#ffd43b'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.fillText('♟️ CỜ CARO', x, y - 117);
    }, { l: -115, t: -140, w: 230, h: 148 });
    H.col(m, x - 100, y - 50, 200, 50);
    H.inter(m, { x: x - 110, y: y - 135, w: 220, h: 140, ax: x, ay: y + 40, name: '♟️ Bàn cờ caro (đấu máy / 2 người)', use: open, arrow: { x, y: y - 150, text: 'Cờ caro' } });
  }
  if (!document.getElementById('ca-css')) {
    const s = document.createElement('style'); s.id = 'ca-css';
    s.textContent = `.ca-wrap{flex:1;display:flex;gap:14px;padding:12px;background:linear-gradient(#2b1d3d,#160f22);overflow:auto;min-height:0}
.ca-side{width:270px;flex:none;background:#fffaf0;border:3px solid #2b1a10;border-radius:16px;padding:12px;color:#2b1a10;display:flex;flex-direction:column;gap:8px;align-self:flex-start}
.ca-side h3{margin:0}.ca-side label{font-weight:800;font-size:13px}.ca-side .btn{width:100%}.ca-turn{font-size:17px;font-weight:800;margin:4px 0}
.ca-board{flex:1;display:flex;align-items:center;justify-content:center;min-width:0;min-height:0;touch-action:none}
.ca-board canvas{border:4px solid #5c3a1e;border-radius:8px;box-shadow:0 6px 0 #2b1a10;cursor:pointer}
@media (max-width:700px){.ca-wrap{flex-direction:column-reverse}.ca-side{width:auto;align-self:stretch}.ca-board{min-height:62vw}}`;
    document.head.appendChild(s);
  }
  return { open, addTo, challenge, onNet };
})();
