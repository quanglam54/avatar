/* Bàn Tiến lên nhiều người ở Khu giải trí.
 * Không có máy chủ riêng: máy của CHỦ BÀN (người ngồi đầu tiên) chia bài, kiểm tra luật, điều khiển máy chơi thay,
 * rồi gửi trạng thái công khai cho mọi người qua kênh Realtime của khu. Bài trên tay gửi riêng tới từng người. */
const TABLE = (() => {
  const T = { id: 'tl1', x: 940, y: 640, zone: 'casino' };
  const SEAT_POS = [[0, 42], [118, -2], [0, -50], [-118, -2]];
  const TURN_MS = 25000;
  const BOT_NAMES = ['Máy Tí', 'Máy Tèo', 'Máy Bin', 'Máy Na'];
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fresh = () => ({ host: null, seats: [null, null, null, null], bet: 20, bots: false, game: null, lastWinner: null, v: 0 });
  let st = fresh();
  let myHand = [];
  const selected = new Set();
  let viewOpen = false;
  let lastHostMsg = 0;
  let H = null; // chỉ chủ bàn: bài của mọi người
  let botTimer = null;
  const paidStart = new Set(), paidEnd = new Set(), refunded = new Set();

  const me = () => NET.pid;
  const mySeat = () => st.seats.findIndex((s) => s && s.id === me());
  const seated = () => mySeat() >= 0;
  const isHost = () => st.host === me();
  const seatName = (i) => (st.seats[i] ? st.seats[i].name : '?');
  const send = (p) => NET.sendTable({ table: T.id, ...p });
  const inZone = () => AV.currentMap() === T.zone;
  const gameOn = () => st.game && !st.game.end;

  /* ================= CHỦ BÀN ================= */
  function broadcast() {
    st.v++;
    send({ a: 'state', s: st });
    afterState();
  }

  function hostSit(seat, who) {
    if (gameOn() || (st.seats[seat] && !st.seats[seat].bot)) return false;
    st.seats = st.seats.map((s) => (s && s.id === who.id ? null : s));
    st.seats[seat] = { id: who.id, name: who.name };
    fixBots();
    return true;
  }
  /** máy chỉ ngồi khi bàn có đúng 1 người thật; từ 2 người thật trở lên thì máy rời bàn */
  function fixBots() {
    if (gameOn()) return;
    const h = st.seats.filter((s) => s && !s.bot).length;
    st.seats = h === 1 ? st.seats.map((s, i) => s || { id: 'bot' + i, name: BOT_NAMES[i], bot: true }) : st.seats.map((s) => (s && s.bot ? null : s));
  }

  function hostRemove(id) {
    const i = st.seats.findIndex((s) => s && s.id === id);
    if (i < 0) return;
    if (gameOn()) st.seats[i] = { id: 'bot' + i, name: BOT_NAMES[i], bot: true };
    else { st.seats[i] = null; fixBots(); }
  }

  function lowestHolder() {
    let best = -1, card = 99;
    H.hands.forEach((h, i) => { if (h.length && h[0] < card) { card = h[0]; best = i; } });
    return best;
  }

  function hostStart() {
    if (gameOn()) return;
    fixBots();
    if (st.seats.filter(Boolean).length < 2) { UI.toast('Cần ít nhất 2 người chơi', 4000); broadcast(); return; }
    const hands = TL.deal();
    H = { hands: st.seats.map((s, i) => (s ? hands[i] : [])) };
    const first = st.lastWinner != null && st.seats[st.lastWinner] ? st.lastWinner : lowestHolder();
    const round = Date.now();
    st.game = {
      round, turn: first, last: null, passed: [0, 0, 0, 0], counts: H.hands.map((h) => h.length), played: [0, 0, 0, 0],
      turnEnds: Date.now() + TURN_MS, msg: `${seatName(first)} đánh trước`, end: null,
    };
    send({ a: 'start', round, bet: st.bet });
    payStart(round, st.bet);
    st.seats.forEach((s, i) => sendHand(i));
    const iw = H.hands.findIndex((h) => h.length && TL.instantWin(h));
    if (iw >= 0) { hostEnd(iw, `Tới trắng — ${TL.instantWin(H.hands[iw])}!`); return; }
    broadcast();
    scheduleBot();
  }

  function sendHand(i) {
    const s = st.seats[i];
    if (!s || s.bot) return;
    if (s.id === me()) { myHand = [...H.hands[i]]; selected.clear(); } else send({ a: 'hand', to: s.id, cards: H.hands[i], round: st.game.round });
  }

  const active = (i) => st.seats[i] && st.game.counts[i] > 0;

  function advance() {
    const g = st.game;
    if (g.last) {
      const left = [0, 1, 2, 3].filter((i) => active(i) && i !== g.last.seat && !g.passed[i]);
      if (!left.length) {
        const w = g.last.seat;
        g.last = null; g.passed = [0, 0, 0, 0];
        g.turn = active(w) ? w : nextActive(w);
        g.turnEnds = Date.now() + TURN_MS;
        g.msg = `${seatName(g.turn)} được đánh tự do`;
        return;
      }
    }
    g.turn = nextActive(g.turn, true);
    g.turnEnds = Date.now() + TURN_MS;
  }

  function nextActive(from, skipPassed) {
    let t = from;
    for (let k = 0; k < 4; k++) {
      t = (t + 1) % 4;
      if (active(t) && !(skipPassed && st.game.passed[t])) return t;
    }
    return from;
  }

  /** Xử lý một nước đi. Trả về chuỗi lỗi nếu không hợp lệ */
  function hostAction(seat, act, cards) {
    const g = st.game;
    if (!g || g.end || g.turn !== seat) return 'Chưa tới lượt của bạn';
    if (act === 'pass') {
      if (!g.last) return 'Bạn đang được đánh tự do, phải đánh một bộ';
      g.passed[seat] = 1;
      g.msg = `${seatName(seat)} bỏ lượt`;
    } else {
      const hand = H.hands[seat];
      if (!cards || !cards.length || !cards.every((c) => hand.includes(c))) return 'Bài không hợp lệ';
      const k = TL.classify(cards);
      if (!k) return 'Đây không phải bộ bài hợp lệ';
      if (!TL.canBeat(g.last ? g.last.k : null, k)) return 'Bài chưa đủ lớn để chặn';
      const chop = g.last && g.last.k.type !== k.type;
      H.hands[seat] = hand.filter((c) => !cards.includes(c));
      g.counts[seat] = H.hands[seat].length;
      g.played[seat] = 1;
      g.last = { seat, cards: TL.sortCards(cards), k, desc: TL.describe(k) };
      g.msg = chop ? `💥 ${seatName(seat)} CHẶT bằng ${TL.describe(k)}!` : `${seatName(seat)} đánh ${TL.describe(k).toLowerCase()}`;
      sendHand(seat);
      if (!H.hands[seat].length) { hostEnd(seat, 'Hết bài'); return null; }
    }
    advance();
    broadcast();
    scheduleBot();
    return null;
  }

  function hostEnd(winner, reason) {
    const g = st.game, bet = st.bet, pay = {};
    let pot = 0;
    st.seats.forEach((s, i) => {
      if (!s || i === winner) return;
      let extra = 0;
      const h = H.hands[i];
      if (!g.played[i] && reason === 'Hết bài') extra += bet;
      extra += Math.round(h.filter((c) => TL.rank(c) === TL.HEO).length * bet / 2);
      pay[i] = -extra;
      pot += bet + extra;
    });
    pay[winner] = pot + bet;
    g.end = { winner, reason, pay, hands: H.hands };
    g.msg = `🏆 ${seatName(winner)} thắng!`;
    st.lastWinner = winner;
    clearTimeout(botTimer);
    broadcast();
  }

  function scheduleBot() {
    clearTimeout(botTimer);
    if (!isHost() || !gameOn()) return;
    const s = st.seats[st.game.turn];
    if (!s || !s.bot) return;
    botTimer = setTimeout(() => {
      if (!isHost() || !gameOn()) return;
      const seat = st.game.turn;
      if (!st.seats[seat] || !st.seats[seat].bot) return;
      const opp = Math.min(...st.game.counts.filter((c, i) => i !== seat && st.seats[i] && c > 0));
      const mv = TL.botMove(H.hands[seat], st.game.last ? st.game.last.k : null, opp);
      if (hostAction(seat, mv ? 'play' : 'pass', mv || []) && st.game.last) hostAction(seat, 'pass');
    }, 900 + Math.random() * 900);
  }

  /** Hết giờ: tự bỏ lượt, hoặc tự đánh lá nhỏ nhất nếu đang được đánh tự do */
  function hostTimers() {
    if (!isHost() || !gameOn()) return;
    const g = st.game;
    if (Date.now() < g.turnEnds) return;
    const seat = g.turn;
    if (g.last) hostAction(seat, 'pass');
    else hostAction(seat, 'play', [TL.sortCards(H.hands[seat])[0]]);
  }

  function hostCancel(reason) {
    if (!st.game) return;
    const round = st.game.round;
    st.game = null;
    H = null;
    clearTimeout(botTimer);
    send({ a: 'cancel', round, reason });
    refund(round, reason);
  }

  /* ================= MỌI NGƯỜI ================= */
  const paidAmt = {};
  function payStart(round, bet) {
    if (!seated() || paidStart.has(round)) return;
    paidStart.add(round);
    const n = Math.min(bet, AV.S.coins);
    paidAmt[round] = n;
    AV.spendSilent(n);
    if (n < bet) UI.toast(`⚠️ Bạn chỉ còn ${n.toLocaleString('vi-VN')} xu — đã cược hết số đó`);
  }

  function refund(round, reason) {
    if (!paidStart.has(round) || refunded.has(round) || paidEnd.has(round)) return;
    refunded.add(round);
    AV.earn(paidAmt[round] ?? st.bet);
    UI.toast(`Ván bài bị huỷ${reason ? ' (' + reason + ')' : ''} — đã trả lại tiền cược`);
  }

  function afterState() {
    const g = st.game;
    const i = mySeat();
    if (g && g.end && i >= 0 && !paidEnd.has(g.round) && paidStart.has(g.round)) {
      paidEnd.add(g.round);
      const d = g.end.pay[i] || 0;
      if (d > 0) AV.earn(d, 5);
      else if (d < 0) AV.spendSilent(Math.min(-d, AV.S.coins));
      UI.toast(g.end.winner === i ? `🏆 Bạn thắng ván bài! +${d} xu` : `😢 ${seatName(g.end.winner)} thắng. ${d < 0 ? `Bạn bị phạt thêm ${-d} xu` : ''}`, 3500);
    }
    if (gameOn() && g.turn === i && !viewOpen) openView();
    placeMe();
    render();
  }

  /** Đặt nhân vật vào ghế (người khác thấy mình đang ngồi) */
  function placeMe() {
    const i = mySeat();
    if (i < 0) return;
    const [dx, dy] = SEAT_POS[i];
    AV.setSeatPos(T.x + dx, T.y + dy, dx === 0 ? 1 : dx > 0 ? -1 : 1);
  }

  function onNet(m) {
    if (m.table !== T.id) return;
    const from = m.id;
    switch (m.a) {
      case 'state':
        if (m.s.host !== from && st.host !== from) return;
        if (isHost() && from !== me() && st.v > m.s.v) return;
        st = m.s;
        lastHostMsg = Date.now();
        if (!st.game) H = isHost() ? H : null;
        afterState();
        break;
      case 'hand':
        if (m.to === me()) { myHand = TL.sortCards(m.cards); [...selected].forEach((c) => { if (!myHand.includes(c)) selected.delete(c); }); render(); }
        break;
      case 'start':
        lastHostMsg = Date.now();
        setTimeout(() => payStart(m.round, m.bet), 50);
        break;
      case 'cancel':
        refund(m.round, m.reason);
        break;
      case 'invite':
        if (m.to === me() && !seated()) UI.tableInvite(m.name);
        break;
      case 'reject':
        if (m.to === me()) UI.toast('⚠️ ' + m.msg);
        break;
      case 'req':
        if (isHost()) broadcast();
        break;
      case 'sit':
        if (isHost() && hostSit(m.seat, { id: from, name: String(m.name).slice(0, 16) })) broadcast();
        break;
      case 'leave':
        if (isHost()) { hostRemove(from); broadcast(); scheduleBot(); }
        break;
      case 'play':
      case 'pass': {
        if (!isHost()) return;
        const seat = st.seats.findIndex((s) => s && s.id === from);
        const err = seat < 0 ? 'Bạn không ngồi bàn này' : hostAction(seat, m.a, (m.cards || []).map(Number));
        if (err) send({ a: 'reject', to: from, msg: err });
        break;
      }
      default:
    }
  }

  function hostStale() { return !st.host || (st.host !== me() && Date.now() - lastHostMsg > 9000); }

  function sit(seat) {
    if (seated() || (st.seats[seat] && !st.seats[seat].bot)) return;
    if (typeof CARDROOM !== 'undefined' && CARDROOM.seatedAny()) return UI.toast('Bạn đang ngồi bàn khác rồi');
    if (gameOn()) return UI.toast('Ván đang chơi, đợi ván sau nhé');
    if (AV.S.coins < st.bet) return UI.toast(`Cần ít nhất ${st.bet} xu để ngồi bàn này`);
    if (hostStale()) {
      st = fresh();
      st.host = me();
      hostSit(seat, { id: me(), name: AV.S.name });
      broadcast();
      UI.toast('Bạn là chủ bàn — chưa có ai thì máy 🤖 chơi cùng, bấm Bắt đầu nhé!');
    } else {
      send({ a: 'sit', seat, name: AV.S.name });
      UI.toast('Đang vào ghế…');
    }
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
    } else {
      send({ a: 'leave' });
      st.seats[i] = null;
    }
    myHand = []; selected.clear();
    AV.leaveSeat(T.x, T.y + 60);
    closeView();
    if (!silent) UI.toast('Đã rời bàn');
  }

  function play() {
    const cards = [...selected];
    const g = st.game;
    if (!gameOn() || g.turn !== mySeat()) return;
    const k = TL.classify(cards);
    if (!k) return UI.toast('Bộ bài không hợp lệ (lẻ, đôi, sám, sảnh, đôi thông, tứ quý)');
    if (!TL.canBeat(g.last ? g.last.k : null, k)) return UI.toast('Bài chưa đủ lớn để chặn');
    selected.clear();
    if (isHost()) { const err = hostAction(mySeat(), 'play', cards); if (err) UI.toast(err); } else send({ a: 'play', cards });
  }

  function pass() {
    if (!gameOn() || st.game.turn !== mySeat() || !st.game.last) return;
    selected.clear();
    if (isHost()) hostAction(mySeat(), 'pass'); else send({ a: 'pass' });
  }

  function hint() {
    const g = st.game;
    if (!gameOn() || g.turn !== mySeat()) return;
    const mv = TL.botMove(myHand, g.last ? g.last.k : null, 1);
    selected.clear();
    if (mv) mv.forEach((c) => selected.add(c)); else UI.toast('Không có bài chặn được — bỏ lượt thôi');
    render();
  }

  /** Mỗi nhịp: chủ bàn kiểm tra hết giờ, gửi trạng thái định kỳ; người khác phát hiện chủ bàn mất kết nối */
  let beat = 0;
  function tick(dt) {
    if (!inZone()) return;
    beat += dt;
    if (isHost()) {
      hostTimers();
      if (beat > 3) { beat = 0; broadcast(); }
    } else if (seated() && st.host && Date.now() - lastHostMsg > 9000) {
      const humans = st.seats.filter((s) => s && !s.bot && s.id !== st.host);
      if (humans[0] && humans[0].id === me()) {
        const round = st.game && st.game.round;
        st.seats = st.seats.map((s) => (s && s.id === st.host ? null : s));
        st.host = me();
        st.game = null;
        if (round) { send({ a: 'cancel', round, reason: 'chủ bàn mất kết nối' }); refund(round, 'chủ bàn mất kết nối'); }
        broadcast();
        UI.toast('Chủ bàn đã rời — bạn trở thành chủ bàn mới');
      }
    }
    if (viewOpen && gameOn()) renderTimers();
  }

  function onMapChange() {
    if (seated()) leave(true);
    st = fresh(); H = null; lastHostMsg = 0;
    closeView();
    setTimeout(() => { if (inZone()) send({ a: 'req' }); }, 800);
  }

  /* ================= GIAO DIỆN BÀN BÀI ================= */
  function openView() {
    viewOpen = true;
    $('#tableView').classList.add('show');
    $('#tableBtn').classList.remove('show');
    if (!st.host || hostStale()) send({ a: 'req' });
    render();
  }

  function closeView() {
    viewOpen = false;
    $('#tableView').classList.remove('show');
    $('#tableBtn').classList.toggle('show', seated());
  }

  const cardHtml = (c, opts = {}) => `<button class="pc ${TL.isRed(c) ? 'red' : ''} ${opts.sel ? 'sel' : ''} ${opts.small ? 'sm' : ''}" ${opts.click ? `data-card="${c}"` : 'disabled'}><b>${TL.RANKS[TL.rank(c)]}</b><i>${TL.SUITS[TL.suit(c)]}</i></button>`;

  function seatHtml(i, pos) {
    const s = st.seats[i];
    const g = st.game;
    if (!s) {
      const canSit = !seated() && !gameOn();
      return `<div class="seat ${pos} empty">${canSit ? `<button class="btn small" data-sit="${i}">🪑 Ngồi đây</button>` : '<span>Ghế trống</span>'}</div>`;
    }
    if (s.bot && !seated() && !gameOn()) return `<div class="seat ${pos}"><div class="who"><span class="ava">🤖</span><b>${esc(s.name)}</b></div><button class="btn small" data-sit="${i}">🪑 Ngồi thay máy</button></div>`;
    const turn = g && !g.end && g.turn === i;
    const count = g ? g.counts[i] : 0;
    const passed = g && !g.end && g.passed[i];
    const reveal = g && g.end && i !== mySeat() ? `<div class="reveal">${(g.end.hands[i] || []).map((c) => cardHtml(c, { small: true })).join('')}</div>` : '';
    return `<div class="seat ${pos} ${turn ? 'turn' : ''}">
      <div class="who"><span class="ava">${s.bot ? '🤖' : s.id === st.host ? '👑' : '🧑'}</span><b>${esc(s.name)}</b></div>
      ${g && !g.end ? `<div class="cnt"><span class="back"></span>× ${count}</div>` : ''}
      ${passed ? '<div class="tag">Bỏ lượt</div>' : ''}
      ${turn ? '<div class="tbar"><i data-tbar></i></div>' : ''}
      ${g && g.end && g.end.pay[i] != null ? `<div class="pay ${g.end.pay[i] > 0 ? 'win' : ''}">${g.end.pay[i] > 0 ? '+' + g.end.pay[i] : g.end.pay[i] ? g.end.pay[i] : '−' + st.bet}</div>` : ''}
      ${reveal}
    </div>`;
  }

  function centerHtml() {
    const g = st.game;
    if (g && !g.end) {
      return `<div class="center-play">
        ${g.last ? `<div class="played">${g.last.cards.map((c) => cardHtml(c)).join('')}</div><div class="pdesc">${esc(seatName(g.last.seat))} · ${esc(g.last.desc)}</div>` : '<div class="pdesc">Chưa có bài trên bàn</div>'}
        <div class="msg">${esc(g.msg || '')}</div></div>`;
    }
    const host = isHost();
    const nearby = NET.players().filter((r) => !st.seats.some((s) => s && s.id === r.id));
    const end = g && g.end ? `<div class="endbox">🏆 <b>${esc(seatName(g.end.winner))}</b> thắng! <small>${esc(g.end.reason)}</small></div>` : '';
    return `<div class="lobby">
      ${end}
      <div class="lrow">Mức cược: ${host ? [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000].map((b) => `<button class="chip ${b === st.bet ? 'on' : ''}" data-bet="${b}">🪙 ${b.toLocaleString('vi-VN')}</button>`).join('') + '<input class="field bet-in" type="number" min="1" placeholder="Tự nhập" data-betin><button class="chip" data-betset>Đặt</button>' : `<b>🪙 ${st.bet.toLocaleString('vi-VN')} xu</b>`}</div>
      ${seated() ? (host ? `<button class="btn big" data-start>▶ ${g && g.end ? 'Ván mới' : 'Bắt đầu'}</button>` : '<div class="muted">⏳ Chờ chủ bàn bắt đầu…</div>') : '<div class="muted">Chọn một ghế trống để ngồi chơi</div>'}
      <div class="muted" style="font-size:12px">🤖 Chỉ có mình bạn thì máy vào chơi cùng · có bạn bè ngồi là máy tự rời bàn</div>
      ${seated() && nearby.length ? `<div class="invite"><b>Mời người chơi:</b>${nearby.map((r) => `<button class="chip" data-invite="${r.id}">✉️ ${esc(r.name)}</button>`).join('')}</div>` : ''}
      ${!seated() ? '<button class="btn small ghost" data-solo>🃏 Chơi Bài cào một mình với nhà cái</button>' : ''}
    </div>`;
  }

  function myHandHtml() {
    if (!seated()) return '';
    const g = st.game;
    const myTurn = gameOn() && g.turn === mySeat();
    const cards = TL.sortCards(myHand);
    return `<div class="myhand ${myTurn ? 'turn' : ''}">
      <div class="cards">${cards.map((c) => cardHtml(c, { click: gameOn(), sel: selected.has(c) })).join('') || '<span class="muted">Chưa chia bài</span>'}</div>
      <div class="acts">
        ${myTurn ? '<button class="btn" data-play>🃏 Đánh</button>' : ''}
        ${myTurn && g.last ? '<button class="btn ghost" data-pass>Bỏ lượt</button>' : ''}
        ${myTurn ? '<button class="btn ghost small" data-hint>💡 Gợi ý</button>' : ''}
        ${gameOn() && !myTurn ? `<span class="wait">Đang chờ ${esc(seatName(g.turn))}…</span>` : ''}
        <button class="btn ghost small" data-leave>🚪 Rời bàn</button>
      </div>
    </div>`;
  }

  function render() {
    if (!viewOpen) { $('#tableBtn').classList.toggle('show', seated()); return; }
    const base = Math.max(0, mySeat());
    const pos = ['bottom', 'right', 'top', 'left'];
    const seatsHtml = [0, 1, 2, 3].map((k) => {
      const i = (base + k) % 4;
      if (k === 0 && seated()) return '';
      return seatHtml(i, pos[k]);
    }).join('');
    $('#tableView').innerHTML = `
      <div class="tv">
        <div class="tv-head"><b>🃏 Tiến lên miền Nam</b><span>Cược ${st.bet.toLocaleString('vi-VN')} xu</span><button class="tv-x" data-close>${seated() ? '▾ Thu nhỏ' : '✕'}</button></div>
        <div class="felt">${seatsHtml}${centerHtml()}</div>
        ${myHandHtml()}
      </div>`;
    const root = $('#tableView');
    root.querySelectorAll('[data-card]').forEach((b) => b.onclick = () => { const c = +b.dataset.card; selected.has(c) ? selected.delete(c) : selected.add(c); render(); });
    root.querySelectorAll('[data-sit]').forEach((b) => b.onclick = () => sit(+b.dataset.sit));
    root.querySelectorAll('[data-bet]').forEach((b) => b.onclick = () => { st.bet = +b.dataset.bet; broadcast(); });
    const bs = root.querySelector('[data-betset]');
    if (bs) bs.onclick = () => {
      const v = Math.floor(+root.querySelector('[data-betin]').value || 0);
      if (v < 1) return UI.toast('Nhập số xu muốn cược');
      st.bet = Math.min(v, 100000000);
      broadcast();
    };
    root.querySelectorAll('[data-invite]').forEach((b) => b.onclick = () => { send({ a: 'invite', to: b.dataset.invite, name: AV.S.name }); UI.toast('Đã gửi lời mời ✉️'); b.disabled = true; });
    const q = (s) => root.querySelector(s);
    if (q('[data-bots]')) q('[data-bots]').onchange = (e) => { st.bots = e.target.checked; broadcast(); };
    if (q('[data-start]')) q('[data-start]').onclick = hostStart;
    if (q('[data-play]')) q('[data-play]').onclick = play;
    if (q('[data-pass]')) q('[data-pass]').onclick = pass;
    if (q('[data-hint]')) q('[data-hint]').onclick = hint;
    if (q('[data-leave]')) q('[data-leave]').onclick = () => (gameOn() ? UI.confirm('Rời bàn giữa ván sẽ mất tiền cược. Vẫn rời?', 'Rời bàn', () => leave()) : leave());
    if (q('[data-solo]')) q('[data-solo]').onclick = () => { closeView(); UI.baiCao(); };
    q('[data-close]').onclick = closeView;
    renderTimers();
  }

  function renderTimers() {
    const bar = document.querySelector('#tableView [data-tbar]');
    if (bar && st.game) bar.style.width = Math.max(0, (st.game.turnEnds - Date.now()) / TURN_MS * 100) + '%';
  }

  function init() {
    $('#tableBtn').onclick = openView;
  }

  return {
    init, onNet, tick, onMapChange, openView, closeView, seated, isOpen: () => viewOpen,
    get state() { return st; }, get hand() { return myHand; }, _sit: sit, _leave: leave, _start: hostStart, _play: (cards) => { selected.clear(); cards.forEach((c) => selected.add(c)); play(); }, _pass: pass,
  };
})();
