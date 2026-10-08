/* 🃏 Bàn 3 Cây (Bài cào) và bàn Phỏm (Tá lả) trong Nhà Casino — chơi nhiều người như bàn Tiến lên.
 * Máy CHỦ BÀN (người ngồi đầu tiên) chia bài, kiểm tra luật, điều khiển máy chơi thay; trạng thái công khai gửi qua kênh Realtime,
 * bài trên tay gửi riêng. Máy (🤖) chỉ vào ngồi khi bàn có MỘT người thật; có từ 2 người thật trở lên thì máy rời bàn,
 * người thật luôn được ngồi vào ghế của máy. */
const CARDROOM = (() => {
  const SUITS = ['♣', '♠', '♥', '♦'];
  const RL = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  /** lá bài = (số − 1) × 4 + chất · số 1 (A) … 13 (K) · chất ♣ < ♠ < ♥ < ♦ */
  const rk = (c) => (c >> 2) + 1, su = (c) => c & 3, isRed = (c) => su(c) >= 2;
  const BOT_NAMES = ['Máy Tí', 'Máy Tèo', 'Máy Bin', 'Máy Na'];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const newDeck = () => shuffle([...Array(52).keys()]);
  const sortRS = (a) => [...a].sort((x, y) => rk(x) - rk(y) || su(x) - su(y));
  const cardHtml = (c, o = {}) => (c == null || o.back
    ? `<span class="pc cr-back ${o.small ? 'sm' : ''}"></span>`
    : `<button class="pc ${isRed(c) ? 'red' : ''} ${o.sel ? 'sel' : ''} ${o.small ? 'sm' : ''} ${o.eat ? 'cr-eat' : ''} ${o.meld ? 'cr-meld' : ''}" ${o.click ? `data-card="${c}"` : 'disabled'}><b>${RL[rk(c)]}</b><i>${SUITS[su(c)]}</i></button>`);

  /* =============================== khung bàn chơi chung =============================== */
  const rooms = [];
  function makeRoom(cfg) {
    const SEAT_POS = [[0, 42], [118, -2], [0, -50], [-118, -2]];
    const fresh = () => ({ host: null, seats: [null, null, null, null], bet: cfg.bet || 50, game: null, lastWinner: null, v: 0 });
    let st = fresh(), H = null, myHand = [], viewOpen = false, lastHostMsg = 0, botTimer = null, beat = 0;
    const sel = new Set(), paidStart = new Set(), paidEnd = new Set(), refunded = new Set(), paidAmt = {};
    const me = () => NET.pid;
    const mySeat = () => st.seats.findIndex((s) => s && s.id === me());
    const seated = () => mySeat() >= 0;
    const isHost = () => st.host === me();
    const seatName = (i) => (st.seats[i] ? st.seats[i].name : '?');
    const send = (p) => NET.sendTable({ table: cfg.id, ...p });
    const inZone = () => AV.currentMap() === cfg.zone;
    const gameOn = () => !!(st.game && !st.game.end);
    const humans = () => st.seats.filter((s) => s && !s.bot);
    const players = () => [0, 1, 2, 3].filter((i) => st.seats[i]);

    const view = document.createElement('div'); view.className = 'table-view'; document.body.appendChild(view);
    const btn = document.createElement('button'); btn.className = 'table-btn cr-btn'; btn.textContent = `🃏 Đang ngồi ${cfg.short} — mở`; btn.onclick = () => openView(); document.body.appendChild(btn);

    const R = {
      cfg, get st() { return st; }, get H() { return H; }, set H(v) { H = v; }, get g() { return st.game; }, get myHand() { return myHand; }, sel,
      mySeat, isHost, seatName, players, render: () => render(),
      sendHand(i) { const s = st.seats[i]; if (!s || s.bot) return; if (s.id === me()) { myHand = [...H.hands[i]]; [...sel].forEach((c) => { if (!myHand.includes(c)) sel.delete(c); }); } else send({ a: 'hand', to: s.id, cards: H.hands[i], round: st.game.round }); },
      /** kết thúc ván: net[i] = số xu thắng (+) / thua (−) của ghế i (đã tính cả tiền cược) */
      end(net, info) { st.game.end = { net, ...info }; st.lastWinner = info.winner; clearTimeout(botTimer); broadcast(); },
      act(act, data) { if (isHost()) { const err = hostAction(mySeat(), act, data); if (err) UI.toast(err); } else send({ a: 'act', act, data }); },
    };

    /* ---------- chủ bàn ---------- */
    function broadcast() { st.v++; send({ a: 'state', s: st }); afterState(); }
    /** máy chỉ ngồi khi có đúng 1 người thật; ≥ 2 người thật thì mời máy ra */
    function fixBots() {
      if (gameOn()) return;
      const h = humans().length;
      if (h >= 2) st.seats = st.seats.map((s) => (s && s.bot ? null : s));
      else if (h === 1) st.seats = st.seats.map((s, i) => s || { id: 'bot' + i, name: BOT_NAMES[i], bot: true });
      else st.seats = st.seats.map((s) => (s && s.bot ? null : s));
    }
    function hostSit(seat, who) {
      if (gameOn() || (st.seats[seat] && !st.seats[seat].bot)) return false;
      st.seats = st.seats.map((s) => (s && s.id === who.id ? null : s));
      st.seats[seat] = { id: who.id, name: who.name };
      fixBots();
      return true;
    }
    function hostRemove(id) {
      const i = st.seats.findIndex((s) => s && s.id === id);
      if (i < 0) return;
      st.seats[i] = gameOn() ? { id: 'bot' + i, name: BOT_NAMES[i], bot: true } : null;
      fixBots();
    }
    function hostStart() {
      if (gameOn()) return;
      fixBots();
      if (players().length < 2) { UI.toast('Cần ít nhất 2 người chơi'); broadcast(); return; }
      const round = Date.now();
      send({ a: 'start', round, bet: st.bet });
      payStart(round, st.bet);
      st.game = { round };
      const g = cfg.rules.start(R, round);
      if (!st.game.end) { g.round = round; st.game = g; }
      players().forEach((i) => R.sendHand(i));
      if (!st.game.end) broadcast();
      scheduleBot();
    }
    function hostAction(seat, act, data) {
      if (!gameOn()) return 'Ván chưa bắt đầu';
      const err = cfg.rules.action(R, seat, act, data);
      if (err) return err;
      if (!st.game.end) broadcast();
      scheduleBot();
      return null;
    }
    function scheduleBot() {
      clearTimeout(botTimer);
      if (!isHost() || !gameOn()) return;
      const seat = cfg.rules.botSeat(R);
      if (seat < 0 || !st.seats[seat] || !st.seats[seat].bot) return;
      botTimer = setTimeout(() => { if (isHost() && gameOn() && st.seats[seat] && st.seats[seat].bot) { cfg.rules.bot(R, seat); if (gameOn()) { broadcast(); scheduleBot(); } } }, 900 + Math.random() * 900);
    }
    function hostCancel(reason) {
      if (!st.game) return;
      const round = st.game.round;
      st.game = null; H = null; clearTimeout(botTimer);
      send({ a: 'cancel', round, reason });
      refund(round, reason);
    }

    /* ---------- mọi người: tiền cược ---------- */
    function payStart(round, bet) {
      if (!seated() || paidStart.has(round)) return;
      paidStart.add(round);
      const n = Math.min(bet, AV.S.coins);
      paidAmt[round] = n;
      AV.spendSilent(n);
    }
    function refund(round, reason) {
      if (!paidStart.has(round) || refunded.has(round) || paidEnd.has(round)) return;
      refunded.add(round);
      AV.earn(paidAmt[round] ?? st.bet);
      UI.toast(`Ván bài bị huỷ${reason ? ' (' + reason + ')' : ''} — đã trả lại tiền cược`);
    }
    function afterState() {
      const g = st.game, i = mySeat();
      if (g && g.end && i >= 0 && !paidEnd.has(g.round) && paidStart.has(g.round)) {
        paidEnd.add(g.round);
        const d = g.end.net[i] || 0, back = (paidAmt[g.round] ?? st.bet) + d;
        if (back > 0) AV.earn(back, d > 0 ? 5 : 0); else if (back < 0) AV.spendSilent(Math.min(-back, AV.S.coins));
        UI.toast(g.end.winner === i ? `🏆 Bạn thắng ván ${cfg.short}! +${fmt(d)} xu` : `😢 ${seatName(g.end.winner)} thắng · bạn ${d >= 0 ? '+' : ''}${fmt(d)} xu`, 4000);
      }
      if (gameOn() && i >= 0 && cfg.rules.myTurn(R) && !viewOpen) openView();
      placeMe();
      render();
    }
    function placeMe() { const i = mySeat(); if (i < 0) return; const [dx, dy] = SEAT_POS[i]; AV.setSeatPos(cfg.x + dx, cfg.y + dy, dx === 0 ? 1 : dx > 0 ? -1 : 1); }

    function onNet(m) {
      if (m.table !== cfg.id) return;
      const from = m.id;
      switch (m.a) {
        case 'state':
          if (m.s.host !== from && st.host !== from) return;
          if (isHost() && from !== me() && st.v > m.s.v) return;
          st = m.s; lastHostMsg = Date.now();
          if (!st.game && !isHost()) H = null;
          afterState();
          break;
        case 'hand': if (m.to === me()) { myHand = m.cards.map(Number); [...sel].forEach((c) => { if (!myHand.includes(c)) sel.delete(c); }); render(); } break;
        case 'start': lastHostMsg = Date.now(); setTimeout(() => payStart(m.round, m.bet), 50); break;
        case 'cancel': refund(m.round, m.reason); break;
        case 'invite': if (m.to === me() && !seated() && !anySeated()) UI.confirm(`✉️ <b>${esc(m.name)}</b> mời bạn vào bàn <b>${cfg.title}</b>!`, 'Vào bàn', () => openView()); break;
        case 'reject': if (m.to === me()) UI.toast('⚠️ ' + m.msg); break;
        case 'req': if (isHost()) broadcast(); break;
        case 'sit': if (isHost() && hostSit(m.seat, { id: from, name: String(m.name).slice(0, 16) })) broadcast(); break;
        case 'leave': if (isHost()) { hostRemove(from); broadcast(); scheduleBot(); } break;
        case 'act': {
          if (!isHost()) return;
          const seat = st.seats.findIndex((s) => s && s.id === from);
          const err = seat < 0 ? 'Bạn không ngồi bàn này' : hostAction(seat, m.act, m.data);
          if (err) send({ a: 'reject', to: from, msg: err });
          break;
        }
        default:
      }
    }
    const hostStale = () => !st.host || (st.host !== me() && Date.now() - lastHostMsg > 9000);
    function sit(seat) {
      if (seated() || (st.seats[seat] && !st.seats[seat].bot)) return;
      if (anySeated()) return UI.toast('Bạn đang ngồi bàn khác rồi');
      if (gameOn()) return UI.toast('Ván đang chơi, đợi ván sau nhé');
      if (AV.S.coins < st.bet) return UI.toast(`Cần ít nhất ${fmt(st.bet)} xu để ngồi bàn này`);
      if (hostStale()) {
        st = fresh(); st.host = me();
        hostSit(seat, { id: me(), name: AV.S.name });
        broadcast();
        UI.toast('Bạn là chủ bàn — chưa có ai thì máy 🤖 chơi cùng, bấm Bắt đầu nhé!');
      } else { send({ a: 'sit', seat, name: AV.S.name }); UI.toast('Đang vào ghế…'); }
    }
    function leave(silent) {
      const i = mySeat();
      if (i < 0) return;
      if (isHost()) {
        if (gameOn()) hostCancel('chủ bàn rời bàn');
        st.seats[i] = null;
        const next = st.seats.find((s) => s && !s.bot);
        st.host = next ? next.id : null;
        if (!next) st = fresh(); else fixBots();
        broadcast();
      } else { send({ a: 'leave' }); st.seats[i] = null; }
      myHand = []; sel.clear();
      AV.leaveSeat(cfg.x, cfg.y + 60);
      closeView();
      if (!silent) UI.toast('Đã rời bàn');
    }
    function tick(dt) {
      if (!inZone()) return;
      beat += dt;
      if (isHost()) {
        if (gameOn() && cfg.rules.deadline(R) && Date.now() > cfg.rules.deadline(R)) { cfg.rules.timeout(R); if (gameOn()) broadcast(); scheduleBot(); }
        if (beat > 3) { beat = 0; broadcast(); }
      } else if (seated() && st.host && Date.now() - lastHostMsg > 9000) {
        const hs = humans().filter((s) => s.id !== st.host);
        if (hs[0] && hs[0].id === me()) {
          const round = st.game && st.game.round;
          st.seats = st.seats.map((s) => (s && s.id === st.host ? null : s));
          st.host = me(); st.game = null;
          if (round) { send({ a: 'cancel', round, reason: 'chủ bàn mất kết nối' }); refund(round, 'chủ bàn mất kết nối'); }
          fixBots(); broadcast();
          UI.toast('Chủ bàn đã rời — bạn trở thành chủ bàn mới');
        }
      }
      if (viewOpen && gameOn()) renderTimers();
    }
    function onMapChange() {
      if (seated()) leave(true);
      st = fresh(); H = null; lastHostMsg = 0;
      closeView();
      setTimeout(() => { if (inZone()) send({ a: 'req' }); }, 900);
    }

    /* ---------- giao diện ---------- */
    function openView() { viewOpen = true; view.classList.add('show'); btn.classList.remove('show'); if (hostStale()) send({ a: 'req' }); render(); }
    function closeView() { viewOpen = false; view.classList.remove('show'); btn.classList.toggle('show', seated()); }
    function seatHtml(i, pos) {
      const s = st.seats[i], g = st.game;
      const canSit = !seated() && !gameOn() && (!s || s.bot);
      if (!s) return `<div class="seat ${pos} empty">${canSit ? `<button class="btn small" data-sit="${i}">🪑 Ngồi đây</button>` : '<span>Ghế trống</span>'}</div>`;
      const turn = gameOn() && cfg.rules.turnSeat(R) === i;
      const net = g && g.end && g.end.net[i] != null ? g.end.net[i] : null;
      return `<div class="seat ${pos} ${turn ? 'turn' : ''}">
        <div class="who"><span class="ava">${s.bot ? '🤖' : s.id === st.host ? '👑' : '🧑'}</span><b>${esc(s.name)}</b></div>
        ${g ? cfg.rules.seatExtra(R, i) : ''}
        ${turn ? '<div class="tbar"><i data-tbar></i></div>' : ''}
        ${net != null ? `<div class="pay ${net > 0 ? 'win' : ''}">${net > 0 ? '+' : ''}${fmt(net)}</div>` : ''}
        ${canSit ? `<button class="btn small" data-sit="${i}">🪑 Ngồi thay máy</button>` : ''}
      </div>`;
    }
    function lobbyHtml() {
      const g = st.game, host = isHost();
      const nearby = NET.players().filter((r) => !st.seats.some((s) => s && s.id === r.id));
      return `<div class="lobby">
        ${g && g.end ? `<div class="endbox">🏆 <b>${esc(seatName(g.end.winner))}</b> thắng! <small>${esc(g.end.reason || '')}</small></div>` : ''}
        <div class="lrow">Mức cược: ${host ? [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 200000].map((b) => `<button class="chip ${b === st.bet ? 'on' : ''}" data-bet="${b}">🪙 ${fmt(b)}</button>`).join('') : `<b>🪙 ${fmt(st.bet)} xu</b>`}</div>
        ${seated() ? (host ? `<button class="btn big" data-start>▶ ${g && g.end ? 'Ván mới' : 'Bắt đầu'}</button>` : '<div class="muted">⏳ Chờ chủ bàn bắt đầu…</div>') : '<div class="muted">Chọn một ghế để ngồi chơi</div>'}
        <div class="muted cr-note">🤖 Chỉ có mình bạn thì máy vào chơi cùng · có bạn bè ngồi là máy tự rời bàn</div>
        ${seated() && nearby.length ? `<div class="invite"><b>Mời người chơi:</b>${nearby.map((r) => `<button class="chip" data-invite="${r.id}">✉️ ${esc(r.name)}</button>`).join('')}</div>` : ''}
        <div class="muted cr-note">${cfg.howto}</div>
      </div>`;
    }
    function render() {
      if (!viewOpen) { btn.classList.toggle('show', seated()); return; }
      const base = Math.max(0, mySeat()), pos = ['bottom', 'right', 'top', 'left'];
      const seatsHtml = [0, 1, 2, 3].map((k) => { const i = (base + k) % 4; return k === 0 && seated() ? '' : seatHtml(i, pos[k]); }).join('');
      view.innerHTML = `<div class="tv cr-tv">
        <div class="tv-head"><b>${cfg.title}</b><span>Cược ${fmt(st.bet)} xu</span><button class="tv-x" data-close>${seated() ? '▾ Thu nhỏ' : '✕'}</button></div>
        <div class="felt">${seatsHtml}${gameOn() ? cfg.rules.center(R) : lobbyHtml()}</div>
        ${seated() ? `<div class="myhand ${gameOn() && cfg.rules.myTurn(R) ? 'turn' : ''}">${st.game ? cfg.rules.mine(R) : '<div class="cards"><span class="muted">Chưa chia bài</span></div>'}<div class="acts">${gameOn() ? cfg.rules.buttons(R) : ''}<button class="btn ghost small" data-leave>🚪 Rời bàn</button></div></div>` : ''}
      </div>`;
      const q = (s) => view.querySelector(s);
      view.querySelectorAll('[data-sit]').forEach((b) => b.onclick = () => sit(+b.dataset.sit));
      view.querySelectorAll('[data-bet]').forEach((b) => b.onclick = () => { st.bet = +b.dataset.bet; broadcast(); });
      view.querySelectorAll('[data-invite]').forEach((b) => b.onclick = () => { send({ a: 'invite', to: b.dataset.invite, name: AV.S.name }); UI.toast('Đã gửi lời mời ✉️'); b.disabled = true; });
      if (q('[data-start]')) q('[data-start]').onclick = hostStart;
      if (q('[data-leave]')) q('[data-leave]').onclick = () => (gameOn() ? UI.confirm('Rời bàn giữa ván sẽ mất tiền cược. Vẫn rời?', 'Rời bàn', () => leave()) : leave());
      q('[data-close]').onclick = closeView;
      if (gameOn()) cfg.rules.bind(R, view);
      renderTimers();
    }
    function renderTimers() {
      const bar = view.querySelector('[data-tbar]'), dl = st.game && cfg.rules.deadline(R);
      if (bar && dl) bar.style.width = Math.max(0, (dl - Date.now()) / cfg.turnMs * 100) + '%';
      const cd = view.querySelector('[data-cd]');
      if (cd && dl) cd.textContent = Math.max(0, Math.ceil((dl - Date.now()) / 1000));
    }
    const room = { cfg, onNet, tick, onMapChange, openView, closeView, seated, isOpen: () => viewOpen, _start: hostStart, _sit: sit, get state() { return st; }, get hand() { return myHand; }, R };
    rooms.push(room);
    return room;
  }
  const anySeated = () => rooms.some((r) => r.seated()) || (typeof TABLE !== 'undefined' && TABLE.seated()) || (typeof BIL !== 'undefined' && BIL.seated && BIL.seated());

  /* =============================== 🃏 3 CÂY (Bài cào) =============================== */
  const BC_MS = 15000;
  /** bộ bài 36 lá A → 9 (bỏ 10 J Q K) · Sáp (3 lá cùng số) to nhất, Sáp A to nhất rồi 9, 8 … 2 · còn lại cộng điểm lấy hàng đơn vị, 9 nút cao nhất */
  function bcScore(h) {
    if (h.length === 3 && h.every((c) => rk(c) === rk(h[0]))) { const r = rk(h[0]); return { pts: 100 + (r === 1 ? 14 : r), text: `🔥 Sáp ${RL[r]}` }; }
    const p = h.reduce((a, c) => a + rk(c), 0) % 10;
    return { pts: p, text: p === 0 ? 'Bù (0 nút)' : `${p} nút` };
  }
  /** so lá to nhất khi bằng nút: chất ♦ > ♥ > ♠ > ♣, rồi số (A to nhất) */
  const bcKey = (h) => Math.max(...h.map((c) => su(c) * 20 + (rk(c) === 1 ? 14 : rk(c))));
  const BACAY = {
    start(R) {
      const d = shuffle([...Array(36).keys()]);
      R.H = { hands: [[], [], [], []] };
      R.players().forEach((i, k) => { R.H.hands[i] = d.slice(k * 3, k * 3 + 3); });
      return { kind: 'bacay', ends: Date.now() + BC_MS, ready: [0, 0, 0, 0], msg: 'Nặn bài đi nào! Hết giờ là lật bài so điểm' };
    },
    action(R, seat, act) {
      if (act !== 'ready') return 'Thao tác không hợp lệ';
      R.g.ready[seat] = 1;
      R.g.msg = `${R.seatName(seat)} đã nặn bài xong`;
      if (R.players().every((i) => R.g.ready[i])) BACAY.finish(R);
      return null;
    },
    finish(R) {
      const ps = R.players(), sc = {};
      ps.forEach((i) => { sc[i] = bcScore(R.H.hands[i]); });
      const win = ps.reduce((a, b) => (sc[b].pts > sc[a].pts || (sc[b].pts === sc[a].pts && bcKey(R.H.hands[b]) > bcKey(R.H.hands[a])) ? b : a));
      const net = {}, bet = R.st.bet;
      ps.forEach((i) => { net[i] = i === win ? bet * (ps.length - 1) : -bet; });
      R.end(net, { winner: win, reason: sc[win].text, hands: R.H.hands, labels: Object.fromEntries(ps.map((i) => [i, sc[i].text])) });
    },
    botSeat: (R) => R.players().find((i) => R.st.seats[i].bot && !R.g.ready[i]) ?? -1,
    bot(R, seat) { BACAY.action(R, seat, 'ready'); },
    deadline: (R) => R.g && R.g.ends,
    timeout(R) { BACAY.finish(R); },
    turnSeat: () => -1,
    myTurn: (R) => R.mySeat() >= 0 && !R.g.end && !R.g.ready[R.mySeat()],
    seatExtra(R, i) {
      const g = R.g;
      if (g.end) return `<div class="reveal">${(g.end.hands[i] || []).map((c) => cardHtml(c, { small: true })).join('')}</div><div class="tag cr-lbl">${esc(g.end.labels[i] || '')}</div>`;
      return `<div class="reveal">${cardHtml(null, { small: true }).repeat(3)}</div>${g.ready[i] ? '<div class="tag">✅ Xong</div>' : ''}`;
    },
    center(R) { return `<div class="center-play"><div class="cr-cd">⏳ <b data-cd>${Math.ceil((R.g.ends - Date.now()) / 1000)}</b>s</div><div class="msg">${esc(R.g.msg)}</div></div>`; },
    mine(R) {
      const g = R.g, i = R.mySeat(), seen = g.end || g.ready[i], h = R.myHand;
      return `<div class="cards">${h.map((c) => cardHtml(c, { back: !seen })).join('') || '<span class="muted">Đang chia…</span>'}</div>${seen && h.length ? `<div class="cr-score">${bcScore(h).text}</div>` : ''}`;
    },
    buttons(R) { return !R.g.ready[R.mySeat()] ? '<button class="btn" data-ready>👀 Nặn bài</button>' : '<span class="wait">Chờ mọi người nặn bài…</span>'; },
    bind(R, root) { const b = root.querySelector('[data-ready]'); if (b) b.onclick = () => R.act('ready'); },
  };

  /* =============================== 🀄 PHỎM (Tá lả) =============================== */
  const PH_MS = 25000;
  /** chia bài trên tay thành phỏm (≥ 3 lá cùng số, hoặc ≥ 3 lá liền nhau cùng chất) sao cho điểm rác ít nhất.
   *  req = các lá bắt buộc phải nằm trong phỏm (lá đã ăn). Không xếp được → null */
  function bestMelds(cards, req = []) {
    const n = cards.length, cand = [];
    const byR = {};
    cards.forEach((c, i) => { (byR[rk(c)] = byR[rk(c)] || []).push(i); });
    Object.values(byR).forEach((ix) => { if (ix.length >= 3) { cand.push(ix); if (ix.length === 4) for (let k = 0; k < 4; k++) cand.push(ix.filter((_, j) => j !== k)); } });
    for (let s = 0; s < 4; s++) {
      const ix = cards.map((c, i) => [c, i]).filter(([c]) => su(c) === s).sort((a, b) => rk(a[0]) - rk(b[0]));
      let seg = [];
      const flush = () => { for (let a = 0; a < seg.length; a++) for (let b = a + 2; b < seg.length; b++) cand.push(seg.slice(a, b + 1).map((x) => x[1])); seg = []; };
      ix.forEach((x) => { if (seg.length && rk(x[0]) !== rk(seg[seg.length - 1][0]) + 1) flush(); seg.push(x); });
      flush();
    }
    let reqMask = 0;
    cards.forEach((c, i) => { if (req.includes(c)) reqMask |= 1 << i; });
    let best = null;
    const chosen = [];
    (function rec(j, used, left) {
      while (j < n && (used >> j) & 1) j++;
      if (best && left > best.points) return;
      if (j === n) { if (!best || left < best.points || chosen.length > best.melds.length) best = { melds: chosen.map((m) => [...m]), points: left }; return; }
      for (const m of cand) {
        if (!m.includes(j) || m.some((k) => (used >> k) & 1)) continue;
        let mask = 0; m.forEach((k) => { mask |= 1 << k; });
        chosen.push(m); rec(j + 1, used | mask, left); chosen.pop();
      }
      if (!((reqMask >> j) & 1)) rec(j + 1, used | (1 << j), left + rk(cards[j]));
    }(0, 0, 0));
    if (!best) return null;
    const inM = new Set(best.melds.flat());
    return { melds: best.melds.map((m) => sortRS(m.map((k) => cards[k]))), left: sortRS(cards.filter((_, k) => !inM.has(k))), points: best.points };
  }
  const canEat = (hand, eaten, card) => card != null && !!bestMelds([...hand, card], [...eaten, card]);
  /** máy chọn lá đánh: bỏ lá làm điểm rác còn lại ít nhất, hoà thì bỏ lá to */
  function phDiscardPick(hand, eaten) {
    let pick = null, bestPts = Infinity;
    for (const c of hand) {
      if (eaten.includes(c)) continue;
      const bm = bestMelds(hand.filter((x) => x !== c), eaten);
      if (!bm) continue;
      if (bm.points < bestPts || (bm.points === bestPts && rk(c) > rk(pick))) { bestPts = bm.points; pick = c; }
    }
    return pick;
  }
  const PHOM = {
    start(R, round) {
      const ps = R.players(), d = newDeck();
      const first = R.st.lastWinner != null && ps.includes(R.st.lastWinner) ? R.st.lastWinner : ps[Math.floor(Math.random() * ps.length)];
      const order = [...ps.slice(ps.indexOf(first)), ...ps.slice(0, ps.indexOf(first))];
      R.H = { hands: [[], [], [], []], deck: d };
      order.forEach((i, k) => { R.H.hands[i] = d.splice(0, k === 0 ? 10 : 9); });
      const g = { kind: 'phom', order, turn: first, phase: 'discard', disc: [[], [], [], []], eaten: [[], [], [], []], counts: [0, 0, 0, 0], nDisc: [0, 0, 0, 0], eatU: [0, 0, 0, 0], deck: d.length, last: null, turnEnds: Date.now() + PH_MS, msg: `${R.seatName(first)} đánh trước`, round };
      order.forEach((i) => { g.counts[i] = R.H.hands[i].length; });
      R.st.game = g;
      PHOM.checkU(R, first);
      return g;
    },
    prev(g, seat) { const k = g.order.indexOf(seat); return g.order[(k - 1 + g.order.length) % g.order.length]; },
    checkU(R, seat) {
      const h = R.H.hands[seat];
      if (h.length !== 10) return false;
      const bm = bestMelds(h, R.g.eaten[seat]);
      if (bm && !bm.left.length) { PHOM.finish(R, seat); return true; }
      return false;
    },
    action(R, seat, act, data) {
      const g = R.g, h = R.H.hands[seat];
      if (g.turn !== seat) return 'Chưa tới lượt của bạn';
      if (act === 'draw' || act === 'eat') {
        if (g.phase !== 'take') return 'Bạn phải đánh một lá';
        let card;
        if (act === 'eat') {
          if (!g.last || g.last.seat !== PHOM.prev(g, seat) || !canEat(h, g.eaten[seat], g.last.card)) return 'Lá này không ăn được (phải tạo thành phỏm)';
          card = g.last.card;
          g.disc[g.last.seat].pop();
          g.eaten[seat].push(card);
          const chot = g.nDisc[g.last.seat] >= 4, u = chot ? 4 : 1;
          g.eatU[seat] += u; g.eatU[g.last.seat] -= u;
          g.msg = chot ? `💥 ${R.seatName(seat)} ĂN CHỐT ${RL[rk(card)]}${SUITS[su(card)]} — ${R.seatName(g.last.seat)} đền 4 lần cược!` : `🍽️ ${R.seatName(seat)} ĂN ${RL[rk(card)]}${SUITS[su(card)]} của ${R.seatName(g.last.seat)}!`;
        } else {
          if (!R.H.deck.length) { PHOM.finish(R, null); return null; }
          card = R.H.deck.pop();
          g.msg = `${R.seatName(seat)} bốc bài`;
        }
        h.push(card); g.last = null;
        g.counts[seat] = h.length; g.deck = R.H.deck.length;
        g.phase = 'discard'; g.turnEnds = Date.now() + PH_MS;
        R.sendHand(seat);
        PHOM.checkU(R, seat);
        return null;
      }
      if (act === 'discard') {
        if (g.phase !== 'discard') return 'Bốc hoặc ăn bài trước đã';
        const c = Number(data);
        if (!h.includes(c)) return 'Bài không hợp lệ';
        if (g.eaten[seat].includes(c)) return 'Không được đánh lá đã ăn';
        if (!bestMelds(h.filter((x) => x !== c), g.eaten[seat])) return 'Đánh lá này sẽ phá phỏm có lá đã ăn';
        R.H.hands[seat] = h.filter((x) => x !== c);
        g.counts[seat] = R.H.hands[seat].length;
        g.disc[seat].push(c); g.nDisc[seat]++;
        g.last = { seat, card: c };
        g.msg = `${R.seatName(seat)} đánh ${RL[rk(c)]}${SUITS[su(c)]}`;
        R.sendHand(seat);
        if (g.order.every((i) => g.nDisc[i] >= 4) || !R.H.deck.length) { PHOM.finish(R, null); return null; }
        g.turn = g.order[(g.order.indexOf(seat) + 1) % g.order.length];
        g.phase = 'take'; g.turnEnds = Date.now() + PH_MS;
        return null;
      }
      return 'Thao tác không hợp lệ';
    },
    finish(R, u) {
      const g = R.g, bet = R.st.bet, res = {}, net = {};
      g.order.forEach((i) => {
        const bm = bestMelds(R.H.hands[i], g.eaten[i]) || bestMelds(R.H.hands[i]) || { melds: [], left: sortRS(R.H.hands[i]), points: R.H.hands[i].reduce((a, c) => a + rk(c), 0) };
        res[i] = { melds: bm.melds, left: bm.left, points: bm.points, mom: !bm.melds.length };
        net[i] = g.eatU[i] * bet;
      });
      if (u == null) PHOM.sendCards(g, res);
      let winner, reason;
      if (u != null) {
        winner = u; reason = '🎉 Ù — cả bài đều là phỏm!';
        g.order.forEach((i) => { if (i !== u) { net[i] -= 5 * bet; net[u] += 5 * bet; } });
        res[u].u = true;
      } else {
        const rank = [...g.order].sort((a, b) => (res[a].mom - res[b].mom) || (res[a].points - res[b].points) || (g.order.indexOf(a) - g.order.indexOf(b)));
        winner = rank[0];
        reason = res[winner].mom ? 'Ít điểm nhất' : `Về nhất · ${res[winner].points} điểm`;
        rank.forEach((i, k) => { if (!k) return; const units = res[i].mom ? 4 : k; net[i] -= units * bet; net[winner] += units * bet; res[i].place = k + 1; });
        res[winner].place = 1;
      }
      R.end(net, { winner, reason, res, hands: R.H.hands });
    },
    /** lá c gửi được vào phỏm m: bộ cùng số (chưa đủ 4) hoặc nối đầu / cuối sảnh cùng chất */
    fits(m, c) {
      if (m.every((x) => rk(x) === rk(m[0]))) return m.length < 4 && rk(c) === rk(m[0]);
      const lo = Math.min(...m.map(rk)), hi = Math.max(...m.map(rk));
      return su(c) === su(m[0]) && (rk(c) === lo - 1 || rk(c) === hi + 1);
    },
    sendCards(g, res) {
      const laid = [];
      g.order.forEach((i) => {
        const r = res[i];
        if (laid.length && !r.mom) {
          let moved = true;
          while (moved) {
            moved = false;
            for (const c of [...r.left]) {
              const j = laid.find((x) => res[x].melds.some((m) => PHOM.fits(m, c)));
              if (j == null) continue;
              const m = res[j].melds.find((mm) => PHOM.fits(mm, c));
              m.push(c); res[j].melds[res[j].melds.indexOf(m)] = sortRS(m);
              r.left = r.left.filter((x) => x !== c); r.points -= rk(c);
              (r.sent = r.sent || []).push(c); (res[j].got = res[j].got || []).push(c);
              moved = true;
            }
          }
        }
        laid.push(i);
      });
    },
    botSeat: (R) => R.g.turn,
    bot(R, seat) {
      const g = R.g, h = R.H.hands[seat];
      if (g.phase === 'take') {
        const eat = g.last && g.last.seat === PHOM.prev(g, seat) && canEat(h, g.eaten[seat], g.last.card);
        PHOM.action(R, seat, eat ? 'eat' : 'draw');
      } else PHOM.action(R, seat, 'discard', phDiscardPick(h, g.eaten[seat]) ?? h.find((c) => !g.eaten[seat].includes(c)));
    },
    deadline: (R) => R.g && R.g.turnEnds,
    timeout(R) { PHOM.bot(R, R.g.turn); },
    turnSeat: (R) => R.g.turn,
    myTurn: (R) => R.g.turn === R.mySeat(),
    seatExtra(R, i) {
      const g = R.g;
      if (g.end) {
        const r = g.end.res[i];
        if (!r) return '';
        const sent = new Set(Object.values(g.end.res).flatMap((x) => x.sent || []));
        return `<div class="reveal">${r.melds.map((m) => `<span class="cr-grp">${m.map((c) => cardHtml(c, { small: true, meld: 1, eat: sent.has(c) })).join('')}</span>`).join('')}${r.left.map((c) => cardHtml(c, { small: true })).join('')}</div>${r.sent ? `<div class="tag">📤 Gửi ${r.sent.length} lá</div>` : ''}
          <div class="tag cr-lbl">${r.u ? '🎉 Ù' : r.mom ? '😵 Móm' : `${r.points} điểm${r.place ? ' · ' + (r.place === 1 ? 'Nhất' : r.place === 2 ? 'Nhì' : r.place === 3 ? 'Ba' : 'Bét') : ''}`}</div>`;
      }
      return `<div class="cnt"><span class="back"></span>× ${g.counts[i]}</div>
        ${g.eaten[i].length ? `<div class="reveal">${g.eaten[i].map((c) => cardHtml(c, { small: true, eat: 1 })).join('')}</div>` : ''}
        <div class="reveal cr-disc">${g.disc[i].map((c) => cardHtml(c, { small: true })).join('')}</div>`;
    },
    center(R) {
      const g = R.g;
      return `<div class="center-play">${g.last ? `<div class="played">${cardHtml(g.last.card)}</div><div class="pdesc">${esc(R.seatName(g.last.seat))} vừa đánh</div>` : '<div class="pdesc">Chưa có lá nào để ăn</div>'}
        <div class="pdesc">🂠 Nọc còn ${g.deck} lá · ⏳ <b data-cd></b>s</div><div class="msg">${esc(g.msg || '')}</div></div>`;
    },
    mine(R) {
      const g = R.g, i = R.mySeat(), eaten = g.eaten[i] || [];
      const bm = bestMelds(R.myHand, eaten) || bestMelds(R.myHand) || { melds: [], left: sortRS(R.myHand), points: 0 };
      const can = g.phase === 'discard' && g.turn === i;
      return `<div class="cards">${bm.melds.map((m) => `<span class="cr-grp">${m.map((c) => cardHtml(c, { click: can, sel: R.sel.has(c), eat: eaten.includes(c), meld: 1 })).join('')}</span>`).join('')}${bm.left.map((c) => cardHtml(c, { click: can, sel: R.sel.has(c) })).join('')}</div>
        <div class="cr-score">Phỏm: ${bm.melds.length} · Điểm rác: <b>${bm.points}</b>${eaten.length ? ` · 🍽️ đã ăn ${eaten.length}` : ''}</div>`;
    },
    buttons(R) {
      const g = R.g, i = R.mySeat();
      if (g.turn !== i) return `<span class="wait">Đang chờ ${esc(R.seatName(g.turn))}…</span>`;
      if (g.phase === 'take') {
        const eat = g.last && g.last.seat === PHOM.prev(g, i) && canEat(R.myHand, g.eaten[i], g.last.card);
        return `<button class="btn" data-draw>🂠 Bốc bài</button>${eat ? `<button class="btn" data-eat>🍽️ Ăn ${RL[rk(g.last.card)]}${SUITS[su(g.last.card)]}</button>` : ''}`;
      }
      return '<button class="btn" data-discard>🃏 Đánh</button><button class="btn ghost small" data-hint>💡 Gợi ý</button>';
    },
    bind(R, root) {
      const q = (s) => root.querySelector(s);
      root.querySelectorAll('.myhand [data-card]').forEach((b) => b.onclick = () => { const c = +b.dataset.card; const had = R.sel.has(c); R.sel.clear(); if (!had) R.sel.add(c); R.render(); });
      if (q('[data-draw]')) q('[data-draw]').onclick = () => R.act('draw');
      if (q('[data-eat]')) q('[data-eat]').onclick = () => R.act('eat');
      if (q('[data-discard]')) q('[data-discard]').onclick = () => { const c = [...R.sel][0]; if (c == null) return UI.toast('Chọn 1 lá để đánh'); R.sel.clear(); R.act('discard', c); };
      if (q('[data-hint]')) q('[data-hint]').onclick = () => { const c = phDiscardPick(R.myHand, R.g.eaten[R.mySeat()]); R.sel.clear(); if (c != null) R.sel.add(c); R.render(); };
    },
  };

  /* =============================== hai bàn trong Casino =============================== */
  const BC_ROOM = makeRoom({ id: 'bc1', zone: 'casino', x: 440, y: 860, title: '🃏 3 Cây (Bài cào)', short: '3 Cây', bet: 50, turnMs: BC_MS, rules: BACAY,
    howto: 'Bộ 36 lá từ A đến 9 (không có 10 J Q K) · mỗi người 3 lá, cộng điểm lấy hàng đơn vị, 9 nút cao nhất · 🔥 Sáp (3 lá cùng số) to nhất, Sáp A to nhất · bằng nút so chất lá to nhất (♦ Rô > ♥ Cơ > ♠ Bích > ♣ Tép), cùng chất so số (A to nhất). Người thắng ăn hết tiền cược.' });
  const PH_ROOM = makeRoom({ id: 'ph1', zone: 'casino', x: 1240, y: 860, title: '🀄 Phỏm (Tá lả)', short: 'Phỏm', bet: 50, turnMs: PH_MS, rules: PHOM,
    howto: 'Mỗi người 9 lá (người đầu 10) · tới lượt: ăn lá người trước vừa đánh (nếu thành phỏm) hoặc bốc nọc, rồi đánh 1 lá · đánh đủ 4 lá thì hạ theo thứ tự, người hạ sau tự GỬI lá rác vào phỏm người hạ trước · ít điểm rác nhất về nhất (Nhì −1, Ba −2, Bét −3, Móm −4 lần cược) · bị ăn 1 cây −1, bị ĂN CHỐT (lá thứ 4) đền −4 · 🎉 Ù (10 lá đều là phỏm) ăn mỗi người 5 lần cược.' });

  if (!document.getElementById('cr-css')) {
    const s = document.createElement('style'); s.id = 'cr-css';
    s.textContent = `
.cr-back { display: inline-block; background: repeating-linear-gradient(45deg, #c92a2a 0 6px, #a61e4d 6px 12px) !important; border: 2px solid #fff !important; box-shadow: 0 0 0 2px #2b1a10; }
.pc.cr-eat { box-shadow: 0 0 0 3px #fab005; } .pc.cr-meld { background: #ebfbee; }
.cr-grp { display: inline-flex; gap: 2px; padding: 2px; margin-right: 6px; border-radius: 9px; background: rgba(64,192,87,.25); }
.cr-score { color: #fff; font-weight: 800; font-size: 13px; text-align: center; margin: 2px 0; }
.cr-lbl { background: #fab005 !important; color: #2b1a10; font-weight: 800; }
.cr-cd { color: #fff; font-size: 34px; font-weight: 900; text-align: center; } .cr-note { font-size: 12px; max-width: 520px; }
.cr-disc { opacity: .85; } .cr-btn { bottom: 150px; }
.cr-tv .myhand .cards { flex-wrap: wrap; justify-content: center; }
`;
    document.head.appendChild(s);
  }

  return {
    rooms, bacay: BC_ROOM, phom: PH_ROOM, bestMelds, bcScore, _phom: PHOM,
    onNet: (m) => rooms.forEach((r) => r.onNet(m)),
    tick: (dt) => rooms.forEach((r) => r.tick(dt)),
    onMapChange: () => rooms.forEach((r) => r.onMapChange()),
    seatedAny: () => rooms.some((r) => r.seated()),
    openMine: () => { const r = rooms.find((x) => x.seated()); if (r) r.openView(); },
    isOpen: () => rooms.some((r) => r.isOpen()),
  };
})();
