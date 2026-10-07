/* 🥊 Võ Đài Quyền Anh: 2 người chơi thật lên sàn đấm nhau, ai thắng ăn tiền cược. Khán giả cược bên Đỏ / Xanh.
 * Mỗi lượt cả hai chọn bí mật 1 đòn (👊 đấm · 💥 móc · 🦵 đá · 🛡️ đỡ). Chống nhìn trộm như oẳn tù tì:
 * gửi "mã khoá" (băm đòn + chuỗi ngẫu nhiên) trước, cả hai khoá xong mới mở ra → không ai đổi đòn theo đối thủ.
 * Cả 2 máy tự tính cùng một kết quả (không có may rủi ngoài hạt giống chung), máy người thách (Đỏ) phát trực tiếp cho khán giả. */
const BOX = (() => {
  const MOVES = {
    jab: { icon: '👊', name: 'Đấm thẳng', cost: 6, tip: 'nhanh · cắt ngang cú đá' },
    hook: { icon: '💥', name: 'Móc', cost: 14, tip: 'phá thế đỡ' },
    kick: { icon: '🦵', name: 'Đá', cost: 22, tip: 'mạnh nhất · thắng cú móc' },
    block: { icon: '🛡️', name: 'Đỡ / Né', cost: -20, tip: 'chặn đấm thẳng · hồi sức' },
  };
  /** sát thương A gây cho B khi A ra đòn a, B ra đòn b */
  const DMG = {
    jab: { jab: 6, hook: 8, kick: 10, block: 0 },
    hook: { jab: 7, hook: 10, kick: 0, block: 16 },
    kick: { jab: 0, hook: 20, kick: 12, block: 8 },
    block: { jab: 4, hook: 0, kick: 0, block: 0 },
  };
  const ROUNDS = 3, TURNS = 5, PICK_MS = 8000, BET_MS = 15000, ANIM_MS = 1600, BREAK_MS = 3000;
  const MIN_BET = 100, MAX_BET = 1000000;
  const CHIPS = [100, 500, 1000, 5000, 10000, 50000, 100000];
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const send = (p) => NET.sendBox(p);
  const nameOf = (id) => { const r = NET.remotes.get(id); return r ? r.name : 'Võ sĩ'; };
  const lookOf = (id) => (id === NET.pid ? AV.S.look : (NET.remotes.get(id) || {}).look || AV.S.look);
  const salt = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  async function hash(text) {
    try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
    catch (e) { let h = 5381; for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0; return 'x' + h.toString(16); }
  }
  /** số ngẫu nhiên chung cho cả 2 máy (theo mã trận + lượt) */
  function seeded(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 10000) / 10000; }

  let g = null;        // trận mình đang đánh
  let watch = null;    // trận đang diễn ra trên võ đài (để vẽ + khán giả xem)
  let myBet = null;    // { gid, side, amt } khán giả đặt
  let fp = null;       // bảng đánh / xem trận
  const inBox = () => AV.currentMap && AV.currentMap() === 'boxing';

  /* ================= Thách đấu ================= */
  function challenge(r) {
    if (!inBox()) return UI.toast('Vào 🥊 Võ Đài ở Khu giải trí mới thách đấu được');
    if (g) return UI.toast('Bạn đang có trận rồi');
    if (watch && !watch.winner) return UI.toast('Võ đài đang có trận — đợi trận này xong nhé');
    const S = AV.S;
    let bet = 1000;
    const p = UI.panel(`🥊 Thách ${esc(r.name)} lên võ đài`, '');
    const render = (err) => {
      p.body.innerHTML = `<p class="muted">3 hiệp × ${TURNS} lượt. Hạ đo ván hoặc còn nhiều máu hơn sau 3 hiệp là thắng — <b>ăn trọn tiền cược của đối thủ</b>. Cược từ ${fmt(MIN_BET)} đến ${fmt(MAX_BET)} xu.</p>
        ${err ? `<p class="game-msg">${err}</p>` : ''}
        <div class="chips center">${CHIPS.map((c) => `<button class="chip ${c === bet ? 'on' : ''} ${c > S.coins ? 'poor' : ''}" data-c="${c}">🪙 ${fmt(c)}</button>`).join('')}</div>
        <form class="bc-custom" data-f><span>Mức khác:</span><input class="field" name="v" type="number" min="${MIN_BET}" max="${MAX_BET}" placeholder="Nhập số xu" value="${CHIPS.includes(bet) ? '' : bet}"><button class="btn small">Dùng</button></form>
        <div class="row-end"><button class="btn" data-go>🥊 Thách đấu · ${fmt(bet)} xu</button></div>`;
      p.body.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { bet = +b.dataset.c; render(); });
      const f = p.body.querySelector('[data-f]');
      f.onsubmit = (e) => { e.preventDefault(); const v = Math.floor(+f.v.value); if (v) bet = Math.max(MIN_BET, Math.min(MAX_BET, v)); render(); };
      p.body.querySelector('[data-go]').onclick = () => {
        if (bet > S.coins) return render(`⚠️ Không đủ xu! Cần <b>${fmt(bet)} xu</b>, bạn còn <b>${fmt(S.coins)} xu</b>`);
        if (!NET.remotes.get(r.id)) return render('⚠️ Người này vừa rời võ đài rồi');
        p.close();
        g = newGame(NET.pid + '-' + Date.now(), r.id, 'red', bet);
        g.state = 'inviting';
        send({ op: 'invite', to: r.id, gid: g.id, bet, name: S.name });
        openFight();
        g.timer = setTimeout(() => { if (g && g.state === 'inviting') endLocal('⌛ Không thấy trả lời — đã huỷ lời mời'); }, 20000);
      };
    };
    render();
  }
  function newGame(id, opp, side, bet) {
    return { id, opp, side, bet, state: 'new', round: 1, turn: 1, hp: { red: 100, blue: 100 }, st: { red: 100, blue: 100 }, commits: {}, reveals: {}, my: {}, paid: false };
  }
  const other = (s) => (s === 'red' ? 'blue' : 'red');
  const key = () => g.round * 10 + g.turn;

  function onInvite(m) {
    if (g && (g.state === 'done' || g.state === 'over')) closeFight();
    if (g || !inBox()) return send({ op: 'busy', to: m.id, gid: m.gid });
    const bet = Math.max(MIN_BET, Math.min(MAX_BET, Math.floor(+m.bet) || 0));
    const who = String(m.name || nameOf(m.id)).slice(0, 16);
    const poor = AV.S.coins < bet;
    const ip = UI.panel('🥊 Lời thách đấu võ đài', `<p class="confirm-text"><b>${esc(who)}</b> thách bạn lên võ đài · cược <b>${fmt(bet)} xu</b></p>
      ${poor ? `<p class="game-msg">⚠️ Không đủ xu! Cần ${fmt(bet)} xu</p>` : ''}
      <div class="row-end"><button class="btn ghost" data-no>Từ chối</button><button class="btn" data-yes ${poor ? 'disabled' : ''}>🥊 Lên sàn</button></div>`);
    const tm = setTimeout(() => { if (ip.el.isConnected) { ip.close(); send({ op: 'decline', to: m.id, gid: m.gid, why: 'không trả lời' }); } }, 18000);
    ip.body.querySelector('[data-no]').onclick = () => { clearTimeout(tm); ip.close(); send({ op: 'decline', to: m.id, gid: m.gid, why: poor ? 'không đủ xu' : 'từ chối' }); };
    ip.body.querySelector('[data-yes]').onclick = () => {
      clearTimeout(tm); ip.close();
      if (g || AV.S.coins < bet) return send({ op: 'decline', to: m.id, gid: m.gid, why: 'không đủ xu' });
      g = newGame(m.gid, m.id, 'blue', bet);
      AV.spendSilent(bet); g.paid = true;
      send({ op: 'accept', to: m.id, gid: m.gid });
      startReady();
    };
  }

  /* ================= Diễn biến trận ================= */
  function view() {
    const red = g.side === 'red' ? NET.pid : g.opp, blue = g.side === 'blue' ? NET.pid : g.opp;
    return {
      gid: g.id, bet: g.bet, phase: g.state, round: g.round, turn: g.turn, hp: { ...g.hp }, st: { ...g.st },
      red: { id: red, name: red === NET.pid ? AV.S.name : nameOf(red) }, blue: { id: blue, name: blue === NET.pid ? AV.S.name : nameOf(blue) },
      betEnd: g.betEnd, pools: (watch && watch.gid === g.id && watch.pools) || { red: 0, blue: 0 }, last: g.last || null, winner: g.winner || null, how: g.how || '',
    };
  }
  /** máy Đỏ phát tình hình trận cho cả võ đài */
  function broadcast() {
    if (!g || g.side !== 'red') return;
    const v = view();
    watch = { ...v, seenAt: Date.now() };
    send({ op: 'live', v: { ...v, last: v.last ? { mv: v.last.mv, dmg: v.last.dmg } : null } });
  }

  function startReady() {
    g.state = 'ready';
    g.betEnd = Date.now() + BET_MS;
    watch = { ...view(), seenAt: Date.now() };
    broadcast();
    NET.sendSys(`🥊 ${watch.red.name} 🆚 ${watch.blue.name} lên võ đài · cược ${fmt(g.bet)} xu — vào xem và đặt cược!`);
    openFight();
    clearTimeout(g.timer);
    g.timer = setTimeout(() => startPick(), BET_MS);
  }
  function startPick() {
    if (!g || g.winner) return;
    g.state = 'pick';
    g.pickEnd = Date.now() + PICK_MS;
    broadcast();
    render();
    clearTimeout(g.timer); clearTimeout(g.dead);
    const k = key();
    g.timer = setTimeout(() => { if (g && key() === k && !g.my[k]) pick('block', true); }, PICK_MS);
    g.dead = setTimeout(() => { if (g && key() === k && !g.winner && !g.reveals[k]) finish(g.side, 'đối thủ bỏ trận'); }, PICK_MS + 15000);
  }
  async function pick(mv, auto) {
    const k = key();
    if (!g || g.state !== 'pick' || g.my[k] || !MOVES[mv]) return;
    const sl = salt();
    g.my[k] = { mv, salt: sl };
    send({ op: 'commit', to: g.opp, gid: g.id, k, h: await hash(g.id + '|' + k + '|' + mv + '|' + sl) });
    if (auto) UI.toast('⌛ Hết giờ — tự động 🛡️ đỡ đòn');
    tryReveal(k);
    render();
  }
  function tryReveal(k) {
    if (!g || !g.my[k] || !g.commits[k] || g.my[k].sent) return;
    g.my[k].sent = true;
    send({ op: 'reveal', to: g.opp, gid: g.id, k, mv: g.my[k].mv, salt: g.my[k].salt });
    tryResolve(k);
  }
  async function onReveal(m) {
    const k = m.k | 0;
    if (!g || !MOVES[m.mv] || !g.commits[k]) return;
    const h = await hash(g.id + '|' + k + '|' + m.mv + '|' + m.salt);
    if (h !== g.commits[k]) return finish(g.side, 'đối thủ gian lận đòn');
    g.reveals[k] = m.mv;
    tryResolve(k);
  }
  function tryResolve(k) {
    if (!g || g.winner || k !== key() || !g.my[k] || !g.my[k].sent || !g.reveals[k] || g.state !== 'pick') return;
    clearTimeout(g.timer); clearTimeout(g.dead);
    const mv = { [g.side]: g.my[k].mv, [other(g.side)]: g.reveals[k] };
    const dmg = { red: 0, blue: 0 };
    for (const s of ['red', 'blue']) {
      const o = other(s), m = MOVES[mv[s]];
      const weak = m.cost > 0 && g.st[s] < m.cost;
      g.st[s] = Math.max(0, Math.min(100, g.st[s] - m.cost + 4));
      const base = DMG[mv[s]][mv[o]];
      if (base) dmg[o] = Math.max(1, Math.round(base * (weak ? 0.4 : 1) * (0.85 + seeded(g.id + '|' + k + '|' + s) * 0.3)));
    }
    g.hp.red = Math.max(0, g.hp.red - dmg.red); g.hp.blue = Math.max(0, g.hp.blue - dmg.blue);
    g.last = { mv, dmg, at: performance.now() };
    g.state = 'anim';
    broadcast();
    render();
    g.timer = setTimeout(nextTurn, ANIM_MS);
  }
  function nextTurn() {
    if (!g || g.winner) return;
    if (g.hp.red <= 0 || g.hp.blue <= 0) {
      const w = g.hp.red === g.hp.blue ? 'draw' : g.hp.red > g.hp.blue ? 'red' : 'blue';
      return finish(w, 'KO');
    }
    g.turn++;
    if (g.turn > TURNS) {
      g.turn = 1; g.round++;
      if (g.round > ROUNDS) {
        g.round = ROUNDS; g.turn = TURNS;
        const w = g.hp.red === g.hp.blue ? 'draw' : g.hp.red > g.hp.blue ? 'red' : 'blue';
        return finish(w, 'tính điểm');
      }
      g.state = 'break';
      g.st.red = Math.min(100, g.st.red + 30); g.st.blue = Math.min(100, g.st.blue + 30);
      broadcast(); render();
      g.timer = setTimeout(startPick, BREAK_MS);
      return;
    }
    startPick();
  }
  /** kết thúc trận (w = 'red' | 'blue' | 'draw') */
  function finish(w, how) {
    if (!g || g.winner) return;
    clearTimeout(g.timer); clearTimeout(g.dead);
    g.winner = w; g.how = how; g.state = 'done';
    const S = AV.S, st = (S.boxStats = S.boxStats || { w: 0, l: 0, ko: 0 });
    if (w === 'draw') { if (g.paid) AV.earn(g.bet, 5); }
    else if (w === g.side) { AV.earn(g.bet * 2, 20); st.w++; if (how === 'KO') st.ko++; AV.sayMine('🏆 Thắng rồi! 🥊'); }
    else { st.l++; AV.earn(0, 5); AV.sayMine('😵 Thua mất rồi…'); }
    AV.markChanged();
    // máy Đỏ báo kết quả (máy Xanh báo thay nếu Đỏ đã bỏ trận)
    if (g.side === 'red' || how === 'đối thủ bỏ trận' || how === 'đối thủ đầu hàng' || how === 'đối thủ gian lận đòn') {
      const v = view();
      watch = { ...v, seenAt: Date.now() };
      send({ op: 'end', v });
      const wn = w === 'draw' ? '' : v[w].name, ln = w === 'draw' ? '' : v[other(w)].name;
      NET.sendSys(w === 'draw' ? `🥊 ${v.red.name} và ${v.blue.name} hoà nhau trên võ đài!` : `🏆 ${wn} ${how === 'KO' ? 'hạ đo ván' : 'thắng'} ${ln}${how !== 'KO' ? ' (' + how + ')' : ''}, ẵm ${fmt(g.bet * 2)} xu!`);
    }
    render();
  }
  function forfeit() {
    if (!g || g.winner || !g.paid) return;
    UI.confirm('Đầu hàng sẽ <b>mất tiền cược</b>. Vẫn đầu hàng?', '🏳️ Đầu hàng', () => {
      if (!g || g.winner) return;
      send({ op: 'quit', to: g.opp, gid: g.id });
      finish(other(g.side), 'đầu hàng');
    });
  }
  /** huỷ trước khi bắt đầu (từ chối, không trả lời…) */
  function endLocal(msg, refund) {
    if (!g) return;
    clearTimeout(g.timer); clearTimeout(g.dead);
    if (refund && g.paid && !g.winner) AV.earn(g.bet, 0);
    g.state = 'over'; g.msg = msg;
    render();
  }

  /* ================= Khán giả ================= */
  function placeBet(side, amt) {
    const S = AV.S;
    if (!watch || watch.winner || watch.phase !== 'ready' || Date.now() > watch.betEnd) return UI.toast('Đã hết giờ đặt cược trận này');
    if (g) return UI.toast('Võ sĩ không được cược');
    if (myBet && myBet.gid === watch.gid && myBet.side !== side) return UI.toast('Bạn đã cược bên kia rồi');
    amt = Math.floor(amt);
    if (!(amt >= 10)) return UI.toast('Cược tối thiểu 10 xu');
    if (amt > S.coins) return UI.toast(`Không đủ xu 😢 Bạn còn ${fmt(S.coins)} xu`);
    AV.spendSilent(amt);
    myBet = myBet && myBet.gid === watch.gid ? { ...myBet, amt: myBet.amt + amt } : { gid: watch.gid, side, amt };
    watch.pools[side] += amt;
    send({ op: 'bet', gid: watch.gid, side, amt, name: S.name });
    UI.toast(`🎟️ Đã cược ${fmt(amt)} xu cho ${side === 'red' ? '🔴 ' + watch.red.name : '🔵 ' + watch.blue.name}`);
    render();
  }
  function settleBet(v) {
    if (!myBet || myBet.gid !== v.gid) return;
    const b = myBet; myBet = null;
    if (v.winner === 'draw' || !v.winner) { AV.earn(b.amt, 0); return UI.toast(`🤝 Trận hoà — trả lại ${fmt(b.amt)} xu tiền cược`, 4000); }
    if (v.winner !== b.side) return UI.toast(`😢 Cược trượt — mất ${fmt(b.amt)} xu`, 4000);
    const mine = Math.max(b.amt, v.pools[b.side] || b.amt), lose = v.pools[other(b.side)] || 0;
    const win = b.amt + Math.floor(b.amt * lose / mine);
    AV.earn(win, 3);
    UI.toast(`🎉 Cược trúng! +${fmt(win)} xu`, 5000);
  }

  /* ================= Nhận tin ================= */
  function onNet(m) {
    if (m.op === 'live' || m.op === 'end') {
      const v = m.v || {};
      if (!v.gid || !v.hp || !v.st || !v.pools || !v.red || !v.blue) return;
      const pools = { red: +v.pools.red || 0, blue: +v.pools.blue || 0 };
      if (g && g.id === v.gid) { if (watch && watch.gid === v.gid) watch.pools = pools; return; }
      const k = v.round * 10 + v.turn;
      let last = watch && watch.gid === v.gid ? watch.last : null;
      if (v.phase === 'anim' && v.last && v.last.mv && v.last.dmg && (!last || last.turnKey !== k)) last = { mv: v.last.mv, dmg: v.last.dmg, at: performance.now(), turnKey: k };
      watch = { ...v, hp: { red: +v.hp.red || 0, blue: +v.hp.blue || 0 }, st: { red: +v.st.red || 0, blue: +v.st.blue || 0 }, pools, last, seenAt: Date.now() };
      if (m.op === 'end') settleBet(watch);
      render();
      return;
    }
    if (m.op === 'bet') {
      if (watch && watch.gid === m.gid && (m.side === 'red' || m.side === 'blue')) {
        const a = Math.max(0, Math.min(1e9, Math.floor(+m.amt) || 0));
        watch.pools[m.side] += a;
        if (g && g.id === m.gid && g.side === 'red') broadcast();
        UI.chatLog && UI.chatLog('', `🎟️ ${String(m.name || 'Ai đó').slice(0, 16)} cược ${fmt(a)} xu cho ${m.side === 'red' ? '🔴 Đỏ' : '🔵 Xanh'}`, false, true);
        render();
      }
      return;
    }
    if (m.to !== NET.pid) return;
    if (m.op === 'invite') return onInvite(m);
    if (!g || m.gid !== g.id || m.id !== g.opp) return;
    if (m.op === 'accept' && g.state === 'inviting') {
      if (AV.S.coins < g.bet) { send({ op: 'cancel', to: g.opp, gid: g.id }); return endLocal('⚠️ Bạn không còn đủ xu — đã huỷ trận'); }
      AV.spendSilent(g.bet); g.paid = true;
      startReady();
    } else if (m.op === 'decline' || m.op === 'busy') {
      endLocal(m.op === 'busy' ? `${esc(nameOf(g.opp))} đang bận` : `${esc(nameOf(g.opp))} ${esc(m.why || 'từ chối')} 😅`);
    } else if (m.op === 'cancel') {
      endLocal('Đối thủ đã huỷ trận — đã trả lại tiền cược', true);
    } else if (m.op === 'commit') {
      g.commits[m.k | 0] = String(m.h || '');
      tryReveal(m.k | 0);
      render();
    } else if (m.op === 'reveal') {
      onReveal(m);
    } else if (m.op === 'quit') {
      finish(g.side, 'đối thủ đầu hàng');
    }
  }
  /** rời võ đài: khán giả mất cược, võ sĩ bị xử thua */
  function onMap(id) {
    if (id === 'boxing') return;
    if (myBet) { UI.toast(`🚪 Rời võ đài giữa trận — mất ${fmt(myBet.amt)} xu tiền cược`, 4000); myBet = null; }
    if (g && !g.winner && g.paid) { send({ op: 'quit', to: g.opp, gid: g.id }); finish(other(g.side), 'bỏ trận'); }
    if (fp && fp.el.isConnected) fp.close();
    fp = null; g = null; watch = null;
  }
  // khán giả: trận "đứng hình" quá 60s (võ sĩ mất mạng hết) → huỷ, trả lại tiền cược
  setInterval(() => {
    if (!watch || watch.winner || (g && g.id === watch.gid)) return;
    if (Date.now() - watch.seenAt > 60000) {
      if (myBet && myBet.gid === watch.gid) { AV.earn(myBet.amt, 0); UI.toast('⚠️ Trận bị gián đoạn — trả lại tiền cược', 4000); myBet = null; }
      watch = null; render();
    }
  }, 5000);
  // máy Đỏ nhắc lại tình hình cho người mới vào xem
  setInterval(() => { if (g && g.side === 'red' && !g.winner && g.state !== 'inviting' && g.state !== 'over') broadcast(); }, 3000);
  setInterval(() => { if (fp && fp.el.isConnected && ((g && (g.state === 'pick' || g.state === 'ready')) || (watch && watch.phase === 'ready'))) renderInfo(); }, 500);

  /* ================= Hình vẽ ================= */
  function glove(c, x, y, r, col) {
    const gr = c.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    gr.addColorStop(0, col === 'red' ? '#ff8787' : '#74c0fc'); gr.addColorStop(1, col === 'red' ? '#a51111' : '#1864ab');
    c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.fillRect(x - r * 0.7, y + r * 0.6, r * 1.4, r * 0.45);
  }
  /** vẽ 1 võ sĩ: side = 'red' (bên trái, quay phải) | 'blue' */
  function boxer(c, x, y, s, side, look, name, t, act) {
    const dir = side === 'red' ? 1 : -1;
    const a = act || {};
    const lunge = a.lunge || 0, hit = a.hit || 0;
    const bx = x + dir * lunge * 40 * s - dir * hit * 14 * s + (hit ? Math.sin(t * 60) * 3 * s : 0);
    c.save();
    if (a.down) { c.translate(bx, y); c.rotate(-dir * 1.2 * a.down); c.translate(-bx, -y); }
    ART.character(c, bx, y, look, { scale: 1.18 * s, t, dir });
    if (!a.down) {
      const gy = y - 46 * s;
      if (a.block) { glove(c, bx + dir * 16 * s, gy - 8 * s, 10 * s, side); glove(c, bx + dir * 22 * s, gy + 6 * s, 10 * s, side); }
      else { glove(c, bx + dir * (18 + lunge * 34) * s, gy - lunge * 6 * s, 10 * s, side); glove(c, bx + dir * 6 * s, gy + 10 * s, 9 * s, side); }
    }
    if (hit) { c.globalAlpha = hit; c.fillStyle = '#ffe066'; c.font = `${Math.round(34 * s)}px system-ui`; c.textAlign = 'center'; c.fillText('💥', bx, y - 70 * s); c.globalAlpha = 1; }
    c.restore();
  }
  /** cảnh trận (dùng cho cả bảng đánh và màn hình lớn) */
  function scene(c, W, H, v, t) {
    c.fillStyle = '#10131c'; c.fillRect(0, 0, W, H);
    // đèn rọi + khán giả
    const sp = c.createRadialGradient(W / 2, -40, 10, W / 2, -40, H * 1.2); sp.addColorStop(0, 'rgba(255,240,200,.35)'); sp.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = sp; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { const x = (i + 0.5) * W / 26, b = Math.abs(Math.sin(t * 3 + i)) * 4; c.fillStyle = ['#343a40', '#495057', '#3b3f4a'][i % 3]; c.beginPath(); c.arc(x, H * 0.26 - b, 9, 0, Math.PI * 2); c.fill(); c.fillRect(x - 10, H * 0.26 - b + 6, 20, 18); }
    // sàn
    c.fillStyle = '#1c7ed6'; c.beginPath(); c.moveTo(W * 0.08, H * 0.92); c.lineTo(W * 0.92, H * 0.92); c.lineTo(W * 0.82, H * 0.42); c.lineTo(W * 0.18, H * 0.42); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.12)'; c.font = `900 ${Math.round(H * 0.08)}px "Be Vietnam Pro", system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('VÕ ĐÀI', W / 2, H * 0.72);
    const ropes = (front) => { ['#e03131', '#f8f9fa', '#1c7ed6'].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); if (front) { c.moveTo(W * 0.08, H * (0.78 - i * 0.07)); c.lineTo(W * 0.92, H * (0.78 - i * 0.07)); } else { c.moveTo(W * 0.18, H * (0.32 - i * 0.05)); c.lineTo(W * 0.82, H * (0.32 - i * 0.05)); } c.stroke(); }); };
    ropes(false);
    [[0.18, 0.42, '#e03131'], [0.82, 0.42, '#1c7ed6']].forEach(([x, y, col]) => { c.fillStyle = col; c.fillRect(W * x - 4, H * (y - 0.2), 8, H * 0.2); });
    if (!v) { ropes(true); return; }
    // hoạt cảnh đòn đánh
    const L = v.last, u = L && L.at ? Math.min(1, (performance.now() - L.at) / ANIM_MS) : 1;
    const act = { red: {}, blue: {} };
    if (L && u < 1) {
      for (const s of ['red', 'blue']) {
        const mv = L.mv[s];
        if (mv === 'block') act[s].block = true;
        else act[s].lunge = Math.sin(Math.min(1, u * 2) * Math.PI);
        if (L.dmg[s] && u > 0.25 && u < 0.75) act[s].hit = 1 - Math.abs(u - 0.5) * 4;
      }
    } else for (const s of ['red', 'blue']) act[s].block = false;
    if (v.winner && v.winner !== 'draw' && v.how === 'KO') act[v.winner === 'red' ? 'blue' : 'red'].down = 1;
    const s = H / 330;
    boxer(c, W * 0.36, H * 0.86, s, 'red', lookOf(v.red.id), v.red.name, t, act.red);
    boxer(c, W * 0.64, H * 0.86, s, 'blue', lookOf(v.blue.id), v.blue.name, t + 1, act.blue);
    ropes(true);
    // số máu mất + đòn vừa ra
    if (L && u < 1) {
      for (const sd of ['red', 'blue']) {
        const x = sd === 'red' ? W * 0.36 : W * 0.64;
        c.globalAlpha = 1 - Math.max(0, u - 0.7) / 0.3;
        c.font = `${Math.round(28 * s)}px system-ui`; c.textAlign = 'center'; c.fillText(MOVES[L.mv[sd]].icon, x + (sd === 'red' ? 50 : -50) * s, H * 0.44);
        if (L.dmg[sd]) { c.font = `900 ${Math.round(24 * s)}px "Be Vietnam Pro", system-ui`; c.fillStyle = '#ff6b6b'; c.strokeStyle = '#fff'; c.lineWidth = 4; const yy = H * 0.5 - u * 40 * s; c.strokeText('-' + L.dmg[sd], x, yy); c.fillText('-' + L.dmg[sd], x, yy); }
        c.globalAlpha = 1;
      }
    }
    // thanh máu / thể lực
    const bar = (x, w, side, al) => {
      const hp = v.hp[side], st = v.st[side];
      c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x, 10, w, 34);
      c.fillStyle = '#343a40'; c.fillRect(x + 4, 14, w - 8, 14);
      c.fillStyle = hp > 50 ? '#40c057' : hp > 25 ? '#fab005' : '#fa5252';
      const hw = (w - 8) * hp / 100; c.fillRect(al === 'l' ? x + 4 : x + w - 4 - hw, 14, hw, 14);
      c.fillStyle = '#ffd43b'; const sw = (w - 8) * st / 100; c.fillRect(al === 'l' ? x + 4 : x + w - 4 - sw, 32, sw, 7);
      c.fillStyle = '#fff'; c.font = '900 12px "Be Vietnam Pro", system-ui'; c.textBaseline = 'middle'; c.textAlign = al === 'l' ? 'left' : 'right';
      c.fillText(`${side === 'red' ? '🔴' : '🔵'} ${v[side].name}  ${hp}❤`, al === 'l' ? x + 8 : x + w - 8, 21);
    };
    const bw = Math.min(260, W * 0.4);
    bar(8, bw, 'red', 'l'); bar(W - 8 - bw, bw, 'blue', 'r');
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '900 13px "Be Vietnam Pro", system-ui';
    c.fillText(v.winner ? 'KẾT THÚC' : `HIỆP ${v.round} · ${v.turn}/${TURNS}`, W / 2, 22);
    // chữ lớn giữa màn
    let big = '';
    if (v.winner) big = v.winner === 'draw' ? '🤝 HOÀ' : `${v.how === 'KO' ? 'K.O! ' : ''}🏆 ${v[v.winner].name}`;
    else if (v.phase === 'ready') big = `🎟️ Đặt cược · ${Math.max(0, Math.ceil((v.betEnd - Date.now()) / 1000))}s`;
    else if (v.phase === 'break') big = `🔔 Hết hiệp ${v.round - 1}`;
    if (big) { c.font = `900 ${Math.round(30 * s)}px "Be Vietnam Pro", system-ui`; c.lineWidth = 6; c.strokeStyle = '#1b2f48'; c.strokeText(big, W / 2, H * 0.36); c.fillStyle = '#ffd43b'; c.fillText(big, W / 2, H * 0.36); }
  }

  /* ================= Bảng đánh / xem ================= */
  let raf = 0;
  function openFight() {
    if (fp && fp.el.isConnected) return render();
    const fighter = !!g;
    fp = UI.panel(fighter ? '🥊 Võ Đài' : '🥊 Xem trận · Đặt cược', `<canvas class="box-cv"></canvas><div class="box-info"></div>`, { wide: true, locked: fighter, onClose: () => { cancelAnimationFrame(raf); fp = null; } });
    const cv = fp.body.querySelector('.box-cv');
    const loop = () => {
      if (!fp || !fp.el.isConnected) return;
      raf = requestAnimationFrame(loop);
      const w = cv.clientWidth || 520, h = Math.round(w * 0.56), d = Math.min(2, devicePixelRatio || 1);
      if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); cv.style.height = h + 'px'; }
      const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0);
      scene(c, w, h, g && g.state !== 'inviting' && g.state !== 'over' ? { ...view(), last: g.last } : watch, performance.now() / 1000);
    };
    loop();
    render();
  }
  function closeFight() { if (fp && fp.el.isConnected) fp.close(); fp = null; g = null; }
  function render() { renderInfo(); }
  function renderInfo() {
    if (!fp || !fp.el.isConnected) return;
    const box = fp.body.querySelector('.box-info');
    if (!box) return;
    const typing = box.querySelector('input');
    const keep = typing ? typing.value : null;
    if (typing && document.activeElement === typing) { const cd = box.querySelector('[data-cd]'); if (cd && watch) cd.textContent = Math.max(0, Math.ceil((watch.betEnd - Date.now()) / 1000)) + 's'; return; }
    let h = '';
    if (g) {
      const k = key(), opp = esc(nameOf(g.opp));
      if (g.state === 'inviting') h = `<p class="game-msg">⏳ Đang chờ <b>${opp}</b> nhận lời… (cược ${fmt(g.bet)} xu)</p><div class="row-end"><button class="btn ghost" data-cancel>Huỷ lời mời</button></div>`;
      else if (g.state === 'over') h = `<p class="game-msg">${g.msg}</p><div class="row-end"><button class="btn" data-close>Đóng</button></div>`;
      else if (g.state === 'done') {
        const w = g.winner;
        h = `<p class="rps-result ${w === 'draw' ? 'draw' : w === g.side ? 'win' : 'lose'}">${w === 'draw' ? '🤝 Hoà — trả lại tiền cược' : w === g.side ? `🏆 Bạn thắng (${g.how})! +${fmt(g.bet * 2)} xu` : `😵 Bạn thua (${g.how})! -${fmt(g.bet)} xu`}</p>
          <div class="row-end"><button class="btn" data-close>Đóng</button></div>`;
      } else {
        const left = g.state === 'pick' ? Math.max(0, Math.ceil((g.pickEnd - Date.now()) / 1000)) : 0;
        const msg = g.state === 'ready' ? `🎟️ Khán giả đang đặt cược… vào trận sau <b>${Math.max(0, Math.ceil((g.betEnd - Date.now()) / 1000))}s</b>`
          : g.state === 'pick' ? (g.my[k] ? `Đã chọn ${MOVES[g.my[k].mv].icon} — đợi ${opp}${g.commits[k] ? ' (đã chọn)' : '…'}` : `Chọn đòn! Còn <b>${left}s</b>`)
            : g.state === 'break' ? '🔔 Nghỉ giữa hiệp — hồi thể lực' : '🥊 …';
        h = `<p class="game-msg">${msg} · Bạn là <b>${g.side === 'red' ? '🔴 Đỏ' : '🔵 Xanh'}</b> · cược ${fmt(g.bet)} xu</p>
          <div class="box-moves">${Object.entries(MOVES).map(([id, m]) => `<button class="rps-btn ${g.my[k] && g.my[k].mv === id ? 'on' : ''}" data-mv="${id}" ${g.state !== 'pick' || g.my[k] ? 'disabled' : ''}><span>${m.icon}</span>${m.name}<small>${m.tip}${m.cost > 0 ? ` · -${m.cost}⚡` : ' · +20⚡'}</small></button>`).join('')}</div>
          <p class="muted small-note">⚡ Thể lực thấp hơn giá đòn thì đòn yếu đi rất nhiều. 👊 thắng 🦵 · 🦵 thắng 💥 · 💥 thắng 🛡️ · 🛡️ chặn 👊.</p>
          <div class="row-end"><button class="btn small ghost" data-quit>🏳️ Đầu hàng</button></div>`;
      }
    } else if (watch) {
      const v = watch, canBet = v.phase === 'ready' && !v.winner && Date.now() < v.betEnd;
      const tot = v.pools.red + v.pools.blue;
      const odds = (s) => (v.pools[s] ? (1 + v.pools[other(s)] / v.pools[s]).toFixed(2) : '—');
      h = `<div class="box-pools"><span>🔴 ${esc(v.red.name)}<b>${fmt(v.pools.red)} xu</b><small>x${odds('red')}</small></span><span>🔵 ${esc(v.blue.name)}<b>${fmt(v.pools.blue)} xu</b><small>x${odds('blue')}</small></span></div>
        ${myBet && myBet.gid === v.gid ? `<p class="game-msg">🎟️ Bạn cược <b>${fmt(myBet.amt)} xu</b> cho ${myBet.side === 'red' ? '🔴 ' + esc(v.red.name) : '🔵 ' + esc(v.blue.name)}</p>` : ''}
        ${canBet ? `<p class="game-msg">🎟️ Đặt cược còn <b data-cd>${Math.max(0, Math.ceil((v.betEnd - Date.now()) / 1000))}s</b></p><form class="bc-custom" data-bet><span>Số xu:</span><input class="field" name="v" type="number" min="10" value="1000"><button class="btn small" data-side="red" type="button">🔴 Cược Đỏ</button><button class="btn small" data-side="blue" type="button">🔵 Cược Xanh</button></form>`
          : `<p class="muted">${v.winner ? 'Trận đã kết thúc.' : 'Đã hết giờ đặt cược — xem trận thôi! 🍿'} Tổng tiền cược: ${fmt(tot)} xu</p>`}
        <p class="muted small-note">Thắng ăn tiền của bên thua chia theo tỉ lệ cược. ⚠️ Rời võ đài giữa trận là mất tiền cược.</p>`;
    } else h = '<p class="muted">Võ đài đang trống. Bấm vào một người chơi → <b>🥊 Thách đấu võ đài</b> để lên sàn!</p>';
    box.innerHTML = h;
    if (keep != null && box.querySelector('input')) box.querySelector('input').value = keep;
    const q = (s) => box.querySelector(s);
    box.querySelectorAll('[data-mv]').forEach((b) => b.onclick = () => pick(b.dataset.mv));
    if (q('[data-quit]')) q('[data-quit]').onclick = forfeit;
    if (q('[data-close]')) q('[data-close]').onclick = closeFight;
    if (q('[data-cancel]')) q('[data-cancel]').onclick = () => { send({ op: 'cancel', to: g.opp, gid: g.id }); closeFight(); };
    box.querySelectorAll('[data-side]').forEach((b) => b.onclick = () => placeBet(b.dataset.side, +q('[data-bet]').v.value));
  }

  /** bảng ở quầy đăng ký: ai đang ở võ đài, thách đấu + thành tích */
  function lobby() {
    if (watch && !watch.winner) return openFight();
    const st = AV.S.boxStats || { w: 0, l: 0, ko: 0 };
    const list = NET.players().filter((r) => !r.hidden);
    const p = UI.panel('🥊 Đăng ký thách đấu', `<p>Thành tích của bạn: <b>${st.w}</b> thắng (${st.ko} KO) · <b>${st.l}</b> thua</p>
      <div class="shop-list">${list.map((r) => `<div class="shop-row"><span class="ic">🧑</span><div class="info"><b>${esc(r.name)}</b><small>Cấp ${r.level || 1}</small></div><button class="btn small" data-ch="${esc(r.id)}">🥊 Thách đấu</button></div>`).join('') || '<p class="muted">Chưa có ai khác ở võ đài. Rủ bạn bè vào đấu nhé!</p>'}</div>`);
    p.body.querySelectorAll('[data-ch]').forEach((b) => b.onclick = () => { const r = NET.remotes.get(b.dataset.ch); p.close(); if (r) challenge(r); });
  }
  function watchPanel() { openFight(); }

  /* ================= Trong thế giới: sàn đấu + màn hình lớn ================= */
  const RING = { x: 1000, y: 700, w: 540, h: 290 };
  function ringBack(c) {
    const { x, y, w, h } = RING, L = x - w / 2, T = y - h / 2;
    c.fillStyle = '#1b1e27'; c.fillRect(L - 20, T - 10, w + 40, h + 50);
    c.fillStyle = '#1c7ed6'; c.fillRect(L, T, w, h);
    c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 3; c.strokeRect(L + 12, T + 12, w - 24, h - 24);
    c.fillStyle = 'rgba(255,255,255,.12)'; c.font = '900 52px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🥊 VÕ ĐÀI', x, y);
    c.fillStyle = '#c92a2a'; c.fillRect(L - 20, T + h + 10, w + 40, 30);
    c.fillStyle = '#fff'; c.font = '900 18px "Be Vietnam Pro", system-ui'; c.fillText('QUANG LÂM BOXING CHAMPIONSHIP', x, T + h + 25);
    [[L, T, '#e03131'], [L + w, T, '#f8f9fa'], [L, T + h, '#f8f9fa'], [L + w, T + h, '#1c7ed6']].forEach(([px, py, col]) => { c.fillStyle = col; c.fillRect(px - 6, py - 60, 12, 62); });
    ['#e03131', '#f8f9fa', '#1c7ed6'].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(L, T - 18 - i * 16); c.lineTo(L + w, T - 18 - i * 16); c.moveTo(L, T - 18 - i * 16); c.lineTo(L, T + h - 18 - i * 16); c.moveTo(L + w, T - 18 - i * 16); c.lineTo(L + w, T + h - 18 - i * 16); c.stroke(); });
  }
  function ringFighters(c, t) {
    const v = g && g.state !== 'inviting' && g.state !== 'over' ? { ...view(), last: g.last } : watch;
    if (!v) return;
    const L = v.last, u = L && L.at ? Math.min(1, (performance.now() - L.at) / ANIM_MS) : 1;
    const act = { red: {}, blue: {} };
    if (L && u < 1) for (const s of ['red', 'blue']) { if (L.mv[s] === 'block') act[s].block = true; else act[s].lunge = Math.sin(Math.min(1, u * 2) * Math.PI); if (L.dmg[s] && u > 0.25 && u < 0.75) act[s].hit = 1 - Math.abs(u - 0.5) * 4; }
    if (v.winner && v.winner !== 'draw' && v.how === 'KO') act[v.winner === 'red' ? 'blue' : 'red'].down = 1;
    boxer(c, RING.x - 90, RING.y + 60, 1, 'red', lookOf(v.red.id), v.red.name, t, act.red);
    boxer(c, RING.x + 90, RING.y + 60, 1, 'blue', lookOf(v.blue.id), v.blue.name, t + 1, act.blue);
    [['red', -90], ['blue', 90]].forEach(([s, dx]) => {
      const x = RING.x + dx, y = RING.y - 110;
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(x - 46, y, 92, 12);
      c.fillStyle = s === 'red' ? '#fa5252' : '#4dabf7'; c.fillRect(x - 44, y + 2, 88 * v.hp[s] / 100, 8);
    });
  }
  function ringFront(c) {
    const { x, y, w, h } = RING, L = x - w / 2, T = y - h / 2;
    ['#e03131', '#f8f9fa', '#1c7ed6'].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 3.5; c.beginPath(); c.moveTo(L, T + h - 18 - i * 16); c.lineTo(L + w, T + h - 18 - i * 16); c.stroke(); });
  }
  function board(c, t) {
    const x = 1000, y = 30, w = 560, h = 150;
    c.fillStyle = '#111'; c.fillRect(x - w / 2 - 8, y - 8, w + 16, h + 16);
    c.save(); c.translate(x - w / 2, y); c.beginPath(); c.rect(0, 0, w, h); c.clip();
    scene(c, w, h, g && g.state !== 'inviting' && g.state !== 'over' ? { ...view(), last: g.last } : watch, t);
    if (!watch && !g) { c.fillStyle = '#ffd43b'; c.font = '900 26px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🥊 ĐANG CHỜ VÕ SĨ…', w / 2, h / 2); }
    c.restore();
  }
  /** toà nhà Võ Đài ở Khu giải trí */
  function building(c, x, y, t) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 4, 230, 22, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#2b2b30'; c.fillRect(x - 210, y - 250, 420, 250);
    c.fillStyle = '#c92a2a'; c.beginPath(); c.moveTo(x - 230, y - 250); c.lineTo(x, y - 320); c.lineTo(x + 230, y - 250); c.closePath(); c.fill();
    c.fillStyle = '#ffd43b'; c.font = '900 44px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('VÕ ĐÀI', x, y - 205);
    c.font = '800 14px "Be Vietnam Pro", system-ui'; c.fillStyle = '#fff'; c.fillText('BOXING · ĐẤM NHAU ĂN XU', x, y - 172);
    glove(c, x - 150, y - 210, 26, 'red'); glove(c, x + 150, y - 210, 26, 'blue');
    for (let k = 0; k < 16; k++) { c.fillStyle = (Math.floor(t * 4) + k) % 2 ? '#ffd43b' : '#fff3bf'; c.beginPath(); c.arc(x - 195 + k * 26, y - 150, 4, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#8b1a1a'; c.fillRect(x - 60, y - 120, 120, 120);
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(x - 52, y - 112, 50, 112); c.fillRect(x + 2, y - 112, 50, 112);
    if (watch && !watch.winner) { c.fillStyle = '#fa5252'; c.beginPath(); c.roundRect(x + 70, y - 135, 120, 30, 8); c.fill(); c.fillStyle = '#fff'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.fillText('🔴 ĐANG ĐẤU', x + 130, y - 120); }
  }

  return { challenge, onNet, onMap, lobby, watchPanel, ringBack, ringFighters, ringFront, board, building, RING, get fighting() { return !!g && !g.winner; } };
})();
