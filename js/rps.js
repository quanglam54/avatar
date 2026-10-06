/* Oẳn tù tì ăn xu giữa 2 người chơi: bấm vào người khác → thách đấu → cả hai chọn ✊ ✌️ ✋.
 * Chống nhìn trộm: mỗi bên gửi "mã khoá" của lựa chọn trước (băm cùng chuỗi ngẫu nhiên), khi cả hai đã khoá mới mở ra.
 * Xu: mỗi bên tự giữ tiền cược của mình khi bắt đầu; thắng nhận gấp đôi, hoà nhận lại, thua mất. */
const RPS = (() => {
  const HANDS = { rock: { icon: '✊', name: 'Búa' }, scissors: { icon: '✌️', name: 'Kéo' }, paper: { icon: '✋', name: 'Bao' } };
  const BEATS = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
  const CHIPS = [10, 50, 100, 500, 1000, 5000, 10000];
  const PICK_MS = 10000;
  let g = null; // ván đang chơi
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const send = (p) => NET.sendRps(p);
  const nameOf = (id) => { const r = NET.remotes.get(id); return r ? r.name : 'Người chơi'; };
  const fmt = (n) => Number(n).toLocaleString('vi-VN');

  async function hash(text) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      let h = 5381;
      for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
      return 'x' + h.toString(16);
    }
  }
  const salt = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  /* ---------- Mời ---------- */
  /** Bảng chọn mức cược rồi gửi lời thách đấu */
  function challenge(r) {
    if (g) return UI.toast('Bạn đang chơi một ván rồi');
    const S = AV.S;
    let bet = 100;
    const p = UI.panel(`✊ Thách ${esc(r.name)} oẳn tù tì`, '');
    const render = (err) => {
      p.body.innerHTML = `<p class="muted">Chọn mức cược — thắng ăn xu của đối thủ, hoà trả lại tiền.</p>
        ${err ? `<p class="game-msg">${err}</p>` : ''}
        <div class="chips center">${CHIPS.map((c) => `<button class="chip ${c === bet ? 'on' : ''} ${c > S.coins ? 'poor' : ''}" data-c="${c}">🪙 ${fmt(c)}</button>`).join('')}</div>
        <form class="bc-custom" data-f><span>Mức khác:</span><input class="field" name="v" type="number" min="1" placeholder="Nhập số xu" value="${CHIPS.includes(bet) ? '' : bet}"><button class="btn small">Dùng</button></form>
        <div class="row-end"><button class="btn" data-go>✊ Thách đấu · ${fmt(bet)} xu</button></div>`;
      p.body.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { bet = +b.dataset.c; render(bet > S.coins ? notEnough(bet) : ''); });
      const f = p.body.querySelector('[data-f]');
      f.onsubmit = (e) => { e.preventDefault(); const v = Math.floor(+f.v.value); if (v >= 1) bet = v; render(bet > S.coins ? notEnough(bet) : ''); };
      p.body.querySelector('[data-go]').onclick = () => {
        if (bet > S.coins) return render(notEnough(bet));
        if (!NET.remotes.get(r.id)) return render('⚠️ Người này vừa rời khu rồi');
        p.close();
        g = { id: NET.pid + '-' + Date.now(), opp: r.id, oppName: r.name, bet, me: 'host', state: 'inviting' };
        send({ op: 'invite', to: r.id, gid: g.id, bet, name: S.name });
        openGame();
        g.timer = setTimeout(() => { if (g && g.state === 'inviting') { endGame('⌛ Không thấy trả lời — đã huỷ lời mời'); } }, 20000);
      };
    };
    render();
  }
  const notEnough = (n) => `⚠️ Không đủ xu! Cần <b>${fmt(n)} xu</b>, bạn chỉ còn <b>${fmt(AV.S.coins)} xu</b>`;

  /** Nhận lời mời */
  function onInvite(m) {
    const bet = Math.max(1, Math.floor(+m.bet) || 0);
    // ván cũ đã xong (đang xem kết quả) thì không tính là bận
    if (g && (g.state === 'done' || g.state === 'over')) { if (p && p.el.isConnected) p.close(); p = null; g = null; }
    if (g) return send({ op: 'busy', to: m.id, gid: m.gid });
    const who = String(m.name || nameOf(m.id)).slice(0, 16);
    const ip = UI.panel('✊ Lời thách oẳn tù tì', `<p class="confirm-text"><b>${esc(who)}</b> thách bạn oẳn tù tì · cược <b>${fmt(bet)} xu</b></p>
      ${AV.S.coins < bet ? `<p class="game-msg">${notEnough(bet)}</p>` : ''}
      <div class="row-end"><button class="btn ghost" data-no>Từ chối</button><button class="btn" data-yes ${AV.S.coins < bet ? 'disabled' : ''}>✊ Chơi</button></div>`);
    const tm = setTimeout(() => { if (ip.el.isConnected) { ip.close(); send({ op: 'decline', to: m.id, gid: m.gid, why: 'không trả lời' }); } }, 18000);
    ip.body.querySelector('[data-no]').onclick = () => { clearTimeout(tm); ip.close(); send({ op: 'decline', to: m.id, gid: m.gid, why: AV.S.coins < bet ? 'không đủ xu' : 'từ chối' }); };
    ip.body.querySelector('[data-yes]').onclick = () => {
      clearTimeout(tm);
      ip.close();
      if (g) return;
      if (AV.S.coins < bet) return send({ op: 'decline', to: m.id, gid: m.gid, why: 'không đủ xu' });
      g = { id: m.gid, opp: m.id, oppName: who, bet, me: 'guest', state: 'pick' };
      AV.spendSilent(bet); g.paid = true;
      send({ op: 'accept', to: m.id, gid: m.gid });
      startPick();
    };
  }

  /* ---------- Ván đấu ---------- */
  function startPick() {
    g.state = 'pick';
    g.pickEnd = Date.now() + PICK_MS;
    openGame();
    clearTimeout(g.timer);
    g.timer = setTimeout(() => { if (g && !g.mine) pick(Object.keys(HANDS)[Math.floor(Math.random() * 3)], true); }, PICK_MS);
    // đối thủ không ra tay / mất kết nối
    g.dead = setTimeout(() => { if (g && !g.result) endGame('⌛ Đối thủ không ra tay — ván bị huỷ, đã trả lại tiền cược', true); }, PICK_MS + 15000);
  }

  async function pick(hand, auto) {
    if (!g || g.mine) return;
    g.mine = hand; g.salt = salt();
    g.myHash = await hash(g.id + '|' + hand + '|' + g.salt);
    send({ op: 'commit', to: g.opp, gid: g.id, h: g.myHash });
    if (auto) UI.toast('⌛ Hết giờ — máy chọn giúp bạn ' + HANDS[hand].icon);
    tryReveal();
    render();
  }
  function tryReveal() {
    if (g && g.mine && g.oppHash && !g.revealed) {
      g.revealed = true;
      send({ op: 'reveal', to: g.opp, gid: g.id, hand: g.mine, salt: g.salt });
      finish();
    }
  }
  async function onReveal(m) {
    if (!g || !HANDS[m.hand]) return;
    const h = await hash(g.id + '|' + m.hand + '|' + m.salt);
    if (h !== g.oppHash) return endGame('⚠️ Đối thủ gửi kết quả không khớp — ván bị huỷ, đã trả lại tiền', true);
    g.opHand = m.hand;
    finish();
  }

  /** Đủ cả 2 bên: lắc tay "Oẳn… tù… tì!" rồi tính xu */
  function finish() {
    if (!g || !g.mine || !g.opHand || g.result) return;
    clearTimeout(g.timer); clearTimeout(g.dead);
    const res = g.mine === g.opHand ? 'draw' : BEATS[g.mine] === g.opHand ? 'win' : 'lose';
    g.result = res;
    g.state = 'shake';
    let beat = 0;
    const words = ['Oẳn…', 'tù…', 'tì!'];
    g.word = words[0];
    render();
    const iv = setInterval(() => {
      beat++;
      if (beat < 3) { g.word = words[beat]; render(); return; }
      clearInterval(iv);
      g.state = 'done';
      const b = g.bet;
      if (res === 'win') AV.earn(b * 2, 3);
      else if (res === 'draw') AV.earn(b, 0);
      AV.sayMine(`${HANDS[g.mine].icon} ${res === 'win' ? 'Thắng rồi! 🎉' : res === 'draw' ? 'Hoà! 🤝' : 'Thua mất rồi 😭'}`);
      if (g.me === 'host') NET.sendSys(`✊ ${AV.S.name} ${HANDS[g.mine].icon} vs ${HANDS[g.opHand].icon} ${g.oppName} — ${res === 'draw' ? 'hoà' : (res === 'win' ? AV.S.name : g.oppName) + ' thắng ' + fmt(b) + ' xu'}!`);
      render();
    }, 650);
  }

  function endGame(msg, refund) {
    if (!g) return;
    clearTimeout(g.timer); clearTimeout(g.dead);
    if (refund && g.paid && !g.result) AV.earn(g.bet, 0);
    g.state = 'over'; g.msg = msg;
    render();
  }

  /* ---------- Nhận tin ---------- */
  function onNet(m) {
    if (m.to !== NET.pid) return;
    if (m.op === 'invite') return onInvite(m);
    if (!g || m.gid !== g.id || m.id !== g.opp) return;
    if (m.op === 'accept' && g.state === 'inviting') {
      if (AV.S.coins < g.bet) { send({ op: 'cancel', to: g.opp, gid: g.id }); return endGame('⚠️ Bạn không còn đủ xu — đã huỷ ván'); }
      AV.spendSilent(g.bet); g.paid = true;
      startPick();
    } else if (m.op === 'decline' || m.op === 'busy') {
      endGame(m.op === 'busy' ? `${esc(g.oppName)} đang bận chơi ván khác` : `${esc(g.oppName)} ${esc(m.why || 'từ chối')} 😅`);
    } else if (m.op === 'cancel') {
      endGame('Đối thủ đã huỷ ván — đã trả lại tiền cược', true);
    } else if (m.op === 'commit') {
      g.oppHash = String(m.h || '');
      tryReveal();
      render();
    } else if (m.op === 'reveal') {
      onReveal(m);
    }
  }

  /* ---------- Giao diện ván đấu ---------- */
  let p = null;
  function openGame() {
    if (p && p.el.isConnected) return render();
    p = UI.panel('✊✌️✋ Oẳn tù tì', '', { wide: true, locked: true });
    render();
  }
  function render() {
    if (!p || !p.el.isConnected || !g) return;
    const S = AV.S, opp = esc(g.oppName);
    const hand = (h, hidden) => `<span class="rps-hand ${g.state === 'shake' ? 'shake' : ''}">${hidden || !h ? '✊' : HANDS[h].icon}</span>`;
    let mid = '', foot = '';
    if (g.state === 'inviting') mid = `<p class="game-msg">⏳ Đang chờ <b>${opp}</b> nhận lời… (cược ${fmt(g.bet)} xu)</p>`;
    else if (g.state === 'pick') {
      const left = Math.max(0, Math.ceil((g.pickEnd - Date.now()) / 1000));
      mid = `<p class="game-msg">${g.mine ? `Bạn đã chọn ${HANDS[g.mine].icon} — đợi ${opp}${g.oppHash ? ' (đã chọn)' : '…'}` : `Chọn tay của bạn! Còn <b>${left}s</b>`}</p>
        <div class="rps-pick">${Object.entries(HANDS).map(([k, h]) => `<button class="rps-btn ${g.mine === k ? 'on' : ''}" data-h="${k}" ${g.mine ? 'disabled' : ''}><span>${h.icon}</span>${h.name}</button>`).join('')}</div>`;
    } else if (g.state === 'shake') mid = `<p class="rps-word">${g.word}</p>`;
    else if (g.state === 'done') {
      const r = g.result;
      mid = `<p class="rps-result ${r}">${r === 'win' ? `🎉 Bạn thắng! +${fmt(g.bet)} xu` : r === 'draw' ? '🤝 Hoà — trả lại tiền cược' : `😭 Bạn thua! -${fmt(g.bet)} xu`}</p>`;
    } else if (g.state === 'over') mid = `<p class="game-msg">${g.msg}</p>`;
    const showHands = g.state === 'shake' || g.state === 'done';
    if (g.state === 'done' || g.state === 'over') {
      foot = `<div class="row-end"><button class="btn ghost" data-close>Đóng</button>${NET.remotes.get(g.opp) ? `<button class="btn" data-again>🔁 Chơi lại · ${fmt(g.bet)} xu</button>` : ''}</div>`;
    } else if (g.state === 'inviting') foot = '<div class="row-end"><button class="btn ghost" data-cancel>Huỷ lời mời</button></div>';
    p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S.coins)} xu · Cược: <b>${fmt(g.bet)} xu</b></div>
      <div class="rps-arena">
        <div class="rps-side"><b>${esc(S.name)} (bạn)</b>${hand(showHands ? (g.state === 'done' ? g.mine : null) : g.mine, !showHands && !g.mine)}</div>
        <div class="rps-vs">VS</div>
        <div class="rps-side"><b>${opp}</b>${hand(g.state === 'done' ? g.opHand : null, g.state !== 'done')}</div>
      </div>
      ${mid}${foot}`;
    p.body.querySelectorAll('[data-h]').forEach((b) => b.onclick = () => pick(b.dataset.h));
    const c = p.body.querySelector('[data-close]');
    if (c) c.onclick = () => { p.close(); p = null; g = null; };
    const cc = p.body.querySelector('[data-cancel]');
    if (cc) cc.onclick = () => { send({ op: 'cancel', to: g.opp, gid: g.id }); p.close(); p = null; g = null; };
    const a = p.body.querySelector('[data-again]');
    if (a) a.onclick = () => {
      const opp2 = { id: g.opp, name: g.oppName }, bet = g.bet;
      p.close(); p = null; g = null;
      if (AV.S.coins < bet) return UI.toast(`Không đủ xu 😢 Cần ${fmt(bet)} xu`);
      g = { id: NET.pid + '-' + Date.now(), opp: opp2.id, oppName: opp2.name, bet, me: 'host', state: 'inviting' };
      send({ op: 'invite', to: opp2.id, gid: g.id, bet, name: AV.S.name });
      openGame();
      g.timer = setTimeout(() => { if (g && g.state === 'inviting') endGame('⌛ Không thấy trả lời — đã huỷ lời mời'); }, 20000);
    };
  }
  // đếm ngược khi đang chọn
  setInterval(() => { if (g && g.state === 'pick' && !g.mine) render(); }, 1000);

  return { challenge, onNet, get game() { return g; }, _pick: pick };
})();
