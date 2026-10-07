/* 🏆 GIẢI ĐUA XE ĐẠO CỤ nhiều người (khu Đua Xe).
 * Ai đang đứng ở khu đua bấm Cổng xuất phát → 🏆 Giải đua → vào phòng chờ. Người vào phòng sớm nhất làm chủ phòng,
 * bấm Bắt đầu khi có từ 2 người. Mỗi máy chạy game 3D (arcade/games/race3d.html?mp=1), vị trí xe và đạo cụ được
 * chuyển qua kênh online của khu (NET.sendKart). Thiếu người thì xe máy chạy cùng cho đủ 6 xe.
 * Vô địch (người thật về nhất, giải có từ 2 người) nhận 10.000.000 xu. */
const RACECUP = (() => {
  const PRIZE = 10000000, MAX = 6, LAPS = 3, START_DELAY = 12000;
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const members = new Map(); // pid → { name, at }
  let lp = null, beat = null, active = null, joinedAt = 0;
  const me = () => NET.pid;
  const send = (p) => NET.sendKart(p);
  const fresh = () => { const now = Date.now(); for (const [k, v] of members) if (now - v.at > 7000 && k !== me()) members.delete(k); return [...members.entries()].sort((a, b) => a[1].since - b[1].since || (a[0] < b[0] ? -1 : 1)); };
  const host = () => (fresh()[0] || [])[0];

  /* ---------- cổng xuất phát ---------- */
  function gate() {
    const p = UI.panel('🏁 Cổng xuất phát', `<div class="shop-list">
      <div class="shop-row"><span class="ic">🏆</span><div class="info"><b>Giải đua đạo cụ (nhiều người)</b><small>Mọi người ở khu Đua Xe cùng vào phòng · vô địch nhận <b>${fmt(PRIZE)} xu</b></small></div><button class="btn small" data-g="cup">Vào phòng</button></div>
      <div class="shop-row"><span class="ic">🎁</span><div class="info"><b>Đua đạo cụ một mình</b><small>Đua với 5 xe máy, nhặt 🚀 🍌 💣 🛡️ ⚡ 🧲 ⛈️</small></div><button class="btn small ghost" data-g="items">Đua</button></div>
      <div class="shop-row"><span class="ic">🏎️</span><div class="info"><b>Đua thường</b><small>Không đạo cụ, chọn độ khó và số vòng</small></div><button class="btn small ghost" data-g="classic">Đua</button></div>
    </div>`);
    p.body.querySelector('[data-g="cup"]').onclick = () => { p.close(); lobby(); };
    p.body.querySelector('[data-g="items"]').onclick = () => { p.close(); openGame('mode=items'); };
    p.body.querySelector('[data-g="classic"]').onclick = () => { p.close(); UI.race3d(); };
  }

  /* ---------- phòng chờ ---------- */
  function lobby() {
    if (lp && lp.el.isConnected) return;
    joinedAt = Date.now();
    members.set(me(), { name: AV.S.name, at: Date.now(), since: joinedAt });
    const here = () => send({ op: 'here', name: AV.S.name, since: joinedAt });
    here();
    beat = setInterval(() => { members.set(me(), { name: AV.S.name, at: Date.now(), since: joinedAt }); here(); render(); }, 2000);
    lp = UI.panel('🏆 Phòng chờ giải đua đạo cụ', '', { wide: true, onClose: leave });
    render();
  }
  function leave() {
    clearInterval(beat); beat = null; lp = null;
    members.delete(me());
    send({ op: 'bye' });
  }
  function render() {
    if (!lp || !lp.el.isConnected) return;
    const list = fresh(), h = host(), iAmHost = h === me();
    lp.body.innerHTML = `<p class="muted">Người ở khu Đua Xe vào phòng này sẽ đua cùng nhau (tối đa ${MAX} người, thiếu thì xe máy chạy cho đủ). Đua ${LAPS} vòng, đạo cụ 🚀 🍌 💣 🛡️ ⚡ 🧲 ⛈️.</p>
      <div class="coins-line">🏆 Vô địch nhận <b>${fmt(PRIZE)} xu</b> (giải từ 2 người thật trở lên)</div>
      <div class="shop-list">${list.slice(0, MAX).map(([pid, v], i) => `<div class="shop-row"><span class="ic">${['🔴', '🟡', '🔵', '🟢', '🟣', '🩷'][i]}</span><div class="info"><b>${esc(v.name)}${pid === me() ? ' (bạn)' : ''}</b><small>${i === 0 ? '👑 Chủ phòng' : 'Sẵn sàng'}</small></div></div>`).join('')}</div>
      ${list.length > MAX ? `<p class="muted small-note">Phòng đầy — ${list.length - MAX} người đến sau đua lượt tới.</p>` : ''}
      <div class="row-end" style="justify-content:center">${iAmHost ? `<button class="btn" data-start ${list.length >= 2 ? '' : 'disabled'}>🏁 Bắt đầu (${Math.min(list.length, MAX)} người)</button>` : '<p class="muted">⏳ Đợi chủ phòng bấm bắt đầu…</p>'}</div>
      ${iAmHost && list.length < 2 ? '<p class="muted small-note">Cần ít nhất 2 người. Rủ bạn bè tới khu Đua Xe rồi bấm Cổng xuất phát → 🏆 Giải đua.</p>' : ''}`;
    const b = lp.body.querySelector('[data-start]');
    if (b) b.onclick = start;
  }
  function start() {
    const list = fresh().slice(0, MAX);
    if (list.length < 2 || host() !== me()) return;
    const cfg = { op: 'start', race: me() + '-' + Date.now().toString(36), host: me(), laps: LAPS, startAt: Date.now() + START_DELAY, players: list.map(([pid, v]) => ({ pid, name: v.name })) };
    send(cfg);
    launch(cfg);
  }

  /* ---------- vào game ---------- */
  function openGame(q) {
    const v = document.getElementById('arcadeView');
    v.innerHTML = `<div class="arc-bar"><b>🏎️ Đua Xe Đạo Cụ</b><span>${q.includes('mp=1') ? '🏆 Giải đua · vô địch nhận ' + fmt(PRIZE) + ' xu' : 'Chạy qua hộp ❓ nhận đạo cụ · bấm E hoặc 🎁 để dùng'}</span><button class="tv-x" data-close>✕ Thoát</button></div>
      <iframe src="arcade/games/race3d.html?${q}" title="Đua Xe Đạo Cụ" allow="autoplay; fullscreen"></iframe>`;
    v.classList.add('show');
    v.querySelector('[data-close]').onclick = () => { if (active) send({ op: 'g', race: active.race, d: { op: 'quit' } }); active = null; UI.closeArcade(); };
    setTimeout(() => { const f = v.querySelector('iframe'); if (f) f.focus(); }, 300);
  }
  function launch(cfg) {
    if (lp && lp.el.isConnected) { const p = lp; lp = null; clearInterval(beat); beat = null; p.close(); }
    members.clear();
    active = cfg;
    UI.toast(`🏁 Giải đua bắt đầu sau ${Math.round((cfg.startAt - Date.now()) / 1000)} giây!`, 3000);
    openGame('mode=items&mp=1');
  }
  const frame = () => { const f = document.querySelector('#arcadeView iframe'); return f && f.contentWindow; };

  /* ---------- tin từ khu ---------- */
  function onNet(m) {
    if (m.op === 'here') { members.set(m.id, { name: String(m.name || 'Tay đua').slice(0, 16), at: Date.now(), since: +m.since || Date.now() }); render(); }
    else if (m.op === 'bye') { members.delete(m.id); render(); }
    else if (m.op === 'start') { if (!active && Array.isArray(m.players) && m.players.some((p) => p.pid === me())) launch(m); else if (lp) { m.players.forEach((p) => members.delete(p.pid)); render(); } }
    else if (m.op === 'g' && active && m.race === active.race) { const w = frame(); if (w) w.postMessage({ type: 'kart-in', from: m.id, d: m.d }, '*'); }
  }
  /* ---------- tin từ game 3D ---------- */
  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type === 'kart-ready' && active) { const w = frame(); if (w) w.postMessage({ type: 'kart-config', me: me(), host: active.host, laps: active.laps, startAt: active.startAt, players: active.players }, '*'); }
    else if (m.type === 'kart-out' && active) send({ op: 'g', race: active.race, d: m.d });
  });
  /** hết giải: trả thưởng */
  function onFinish(m) {
    if (!active) return;
    const cfg = active; active = null;
    const pos = Math.max(1, Math.min(6, m.pos | 0)), humans = Math.max(1, m.humans | 0);
    AV.earn(0, 15 + (6 - pos) * 5); AV.quest('race');
    if (pos === 1 && m.winnerHuman && humans >= 2) {
      AV.earn(PRIZE, 200);
      AV.S.race3dWins = (AV.S.race3dWins || 0) + 1;
      UI.toast(`🏆 VÔ ĐỊCH GIẢI ĐUA ĐẠO CỤ! +${fmt(PRIZE)} xu`, 7000);
      NET.sendNews(`🏆 ${AV.S.name} vô địch giải đua xe đạo cụ ${humans} người, nhận ${fmt(PRIZE)} xu!`);
    } else UI.toast(m.winnerHuman ? `🏁 Bạn về thứ ${pos}. Vô địch: ${m.winner}` : `🏁 Bạn về thứ ${pos} — xe máy về nhất nên giải này không ai nhận thưởng`, 6000);
    void cfg;
  }
  return { gate, lobby, onNet, onFinish, get active() { return active; } };
})();
