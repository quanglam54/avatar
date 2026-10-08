/* 🪑 CHỌN BÀN cho Tiến lên / 3 Cây / Phỏm ở Nhà Casino.
 * Mỗi game có N bàn (mã tl1…tl6, bc1…bc6, ph1…ph6). Bấm vào bàn ngoài casino → bảng chọn bàn: thấy bàn nào trống,
 * bàn nào đang có ai, cược bao nhiêu. Chọn mức cược → tạo bàn (chưa có ai thì máy 🤖 chơi cùng) → mời bạn bè.
 * Mời người đứng gần qua kênh khu (tbl), mời bạn bè đang online ở BẤT KỲ khu nào qua kênh chung (cinv) — nhận lời là tự bay tới casino và ngồi vào bàn. */
const CARDLOBBY = (() => {
  const N = 6, BETS = [100, 500, 1000, 5000, 10000, 50000, 100000];
  const GAMES = { tl: { name: '🃏 Tiến lên miền Nam', short: 'Tiến lên' }, bc: { name: '🃏 3 Cây (Bài cào)', short: '3 Cây' }, ph: { name: '🀄 Phỏm (Tá lả)', short: 'Phỏm' } };
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const gameOf = (id) => String(id || '').slice(0, 2);
  const eng = (g) => (g === 'tl' ? TABLE : g === 'bc' ? CARDROOM.bacay : g === 'ph' ? CARDROOM.phom : null);
  const seatedAnywhere = () => TABLE.seated() || CARDROOM.seatedAny();
  /** trạng thái công khai của các bàn nghe được từ chủ bàn: mã bàn → { s, at } */
  const sums = new Map();
  let bet = 1000;

  function onTbl(m) {
    if (!m || !GAMES[gameOf(m.table)]) return;
    if (m.a === 'state' && m.s && Array.isArray(m.s.seats)) sums.set(m.table, { s: m.s, at: Date.now() });
    else if (m.a === 'invite' && m.to === NET.pid) invited(String(m.name || 'Bạn'), String(m.table), +m.bet || 0);
  }
  /** bàn đang có người không (chủ bàn phải báo trong 9 giây gần đây) */
  function info(id) {
    const e = eng(gameOf(id));
    if (e.tableId === id && e.isHost()) return e.state; // bàn mình làm chủ (tin của mình không vọng lại)
    const x = sums.get(id);
    return x && Date.now() - x.at < 9000 && x.s.host ? x.s : null;
  }

  /* ---------- bảng chọn bàn ---------- */
  function pick(g) {
    const e = eng(g);
    if (!e) return;
    if (e.seated()) return e.openView();
    if (seatedAnywhere()) return UI.toast('Bạn đang ngồi bàn khác rồi — rời bàn đó trước nhé');
    for (let k = 1; k <= N; k++) NET.sendTable({ table: g + k, a: 'req' });
    let tm = 0;
    const p = UI.panel(`${GAMES[g].name} · chọn bàn`, '', { wide: true, onClose: () => clearInterval(tm) });
    const render = () => {
      if (!p.el.isConnected) return clearInterval(tm);
      let firstFree = 0;
      const rows = [];
      for (let k = 1; k <= N; k++) {
        const id = g + k, s = info(id);
        if (!s) {
          if (!firstFree) firstFree = k;
          rows.push(`<div class="cl-t empty"><b>Bàn ${k}</b><span class="muted">Trống</span><small>&nbsp;</small><button class="btn small" data-new="${id}">➕ Tạo bàn</button></div>`);
          continue;
        }
        const hs = s.seats.filter((x) => x && !x.bot), bots = s.seats.filter((x) => x && x.bot).length;
        const playing = !!(s.game && !s.game.end), free = s.seats.filter((x) => !x || x.bot).length;
        rows.push(`<div class="cl-t ${playing ? 'play' : ''}"><b>Bàn ${k}</b>
          <span>${hs.map((x) => `${x.id === s.host ? '👑' : '🧑'} ${esc(x.name)}`).join(' · ')}${bots ? ` · 🤖×${bots}` : ''}</span>
          <small>🪙 ${fmt(s.bet)} xu · ${playing ? '🎴 Đang chơi' : `⏳ Đang chờ · còn ${free} ghế`}</small>
          <button class="btn small ${playing || !free ? 'ghost' : ''}" data-go="${id}" data-sit="${playing || !free ? '' : 1}">${playing || !free ? '👀 Xem' : '🪑 Vào bàn'}</button></div>`);
      }
      p.body.innerHTML = `<div class="cl-bet"><b>Mức cược khi tạo bàn:</b>${BETS.map((b) => `<button class="chip ${b === bet ? 'on' : ''}" data-bet="${b}">🪙 ${fmt(b)}</button>`).join('')}</div>
        <div class="cl-list">${rows.join('')}</div>
        ${firstFree ? `<div class="row-end" style="justify-content:center"><button class="btn" data-quick="${g + firstFree}">🤖 Chơi ngay với máy (${fmt(bet)} xu)</button></div>` : ''}
        <p class="muted small-note">Tạo bàn xong bấm <b>✉️ Mời</b> để rủ bạn bè đang online (ở khu nào cũng được, nhận lời là tự tới casino) · chưa có ai thì máy 🤖 chơi cùng, bạn bè vào ngồi là máy tự nhường ghế.</p>`;
      p.body.querySelectorAll('[data-bet]').forEach((b) => b.onclick = () => { bet = +b.dataset.bet; render(); });
      const make = (id, auto) => {
        if (AV.S.coins < bet) return UI.toast(`Cần ít nhất ${fmt(bet)} xu để tạo bàn cược ${fmt(bet)} — chọn mức cược thấp hơn nhé`);
        p.close(); e.create(id, bet, auto);
      };
      p.body.querySelectorAll('[data-new]').forEach((b) => b.onclick = () => make(b.dataset.new, false));
      const q = p.body.querySelector('[data-quick]'); if (q) q.onclick = () => make(q.dataset.quick, true);
      p.body.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => { p.close(); e.joinAt(b.dataset.go, !!b.dataset.sit); });
    };
    render();
    tm = setInterval(render, 2000);
  }

  /* ---------- mời người chơi (gắn vào sảnh của từng bàn) ---------- */
  function inviteHtml(st) {
    const inSeat = new Set(st.seats.filter(Boolean).map((s) => s.id));
    const near = NET.players().filter((r) => !inSeat.has(r.id));
    const nearU = new Set(near.map((r) => r.user).filter(Boolean));
    const fr = (AV.S.friends || []).filter((f) => f.username && !nearU.has(f.username) && NET.onlineUser(f.username));
    if (!near.length && !fr.length) return '<div class="muted cr-note">✉️ Chưa có bạn bè nào online để mời — máy 🤖 chơi cùng bạn nhé</div>';
    return `<div class="invite"><b>✉️ Mời:</b>${near.map((r) => `<button class="chip" data-cinv-pid="${esc(r.id)}">🧑 ${esc(r.name)}</button>`).join('')}${fr.map((f) => `<button class="chip" data-cinv-user="${esc(f.username)}">👥 ${esc(f.name || f.username)} <small>(online)</small></button>`).join('')}</div>`;
  }
  function bindInvites(root, id, b) {
    const sent = (el) => { UI.toast('✉️ Đã gửi lời mời'); el.disabled = true; };
    root.querySelectorAll('[data-cinv-pid]').forEach((el) => el.onclick = () => { NET.sendTable({ table: id, a: 'invite', to: el.dataset.cinvPid, name: AV.S.name, bet: b }); sent(el); });
    root.querySelectorAll('[data-cinv-user]').forEach((el) => el.onclick = () => { NET.sendCardInv({ to: el.dataset.cinvUser, table: id, bet: b }); sent(el); });
  }

  /* ---------- nhận lời mời ---------- */
  function onInvite(m) {
    if (!m || typeof CLOUD === 'undefined' || !CLOUD.username || m.to !== CLOUD.username || !GAMES[gameOf(m.table)]) return;
    invited(String(m.name || 'Bạn'), String(m.table), +m.bet || 0);
  }
  function invited(name, table, b) {
    if (seatedAnywhere()) return;
    const g = gameOf(table), k = table.slice(2);
    document.querySelectorAll('.invite-card').forEach((x) => x.remove());
    const el = document.createElement('div');
    el.className = 'invite-card';
    el.innerHTML = `<div>🃏 <b>${esc(name)}</b> mời bạn chơi <b>${GAMES[g].short}</b> · Bàn ${esc(k)}${b ? ` · cược <b>${fmt(b)} xu</b>` : ''}!</div>
      <div class="row-end"><button class="btn ghost small" data-no>Để sau</button><button class="btn small" data-yes>Vào bàn</button></div>`;
    document.body.appendChild(el);
    el.querySelector('[data-no]').onclick = () => el.remove();
    el.querySelector('[data-yes]').onclick = () => { el.remove(); go(table); };
    setTimeout(() => el.remove(), 20000);
  }
  /** tới casino (nếu đang ở khu khác) rồi vào đúng bàn được mời và tự ngồi ghế trống */
  function go(table) {
    const e = eng(gameOf(table));
    if (AV.currentMap() === 'casino') return e.joinAt(table, true);
    AV.teleport('casino', false, 1000, 880, '🃏 Tới Nhà Casino…');
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (AV.currentMap() === 'casino') { clearInterval(iv); setTimeout(() => e.joinAt(table, true), 1300); } else if (Date.now() - t0 > 15000) clearInterval(iv);
    }, 300);
  }

  if (!document.getElementById('cl-css')) {
    const s = document.createElement('style'); s.id = 'cl-css';
    s.textContent = `
.cl-bet { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 10px; }
.cl-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; margin-bottom: 10px; }
.cl-t { display: grid; gap: 3px; padding: 10px; border: 2px solid #e9ecef; border-radius: 14px; background: #f8fff9; }
.cl-t > b { font-size: 15px; } .cl-t span { font-size: 13px; min-height: 18px; } .cl-t small { color: #868e96; }
.cl-t.empty { background: #fff; border-style: dashed; } .cl-t.play { background: #fff9db; border-color: #ffd43b; }
.cl-t .btn { justify-self: start; margin-top: 2px; }
`;
    document.head.appendChild(s);
  }

  return { pick, onTbl, onInvite, inviteHtml, bindInvites, go };
})();
