/* 🦎 TẮC KÈ HOA — trốn tìm ngụy trang nhiều người. Cửa ở cuối Khu giải trí.
 * Game chạy trong khung (arcade/games/hide.html); tin nhắn giữa người chơi đi qua kênh của Khu giải trí (NET.sendHide).
 * Hết ván game gửi về số xu thưởng (tối đa 100 xu/ván). */
const HIDE = (() => {
  let sess = null; // { sid, paid: số ván đã nhận thưởng }
  const S = () => AV.S;

  const cleanRoom = (r) => String(r || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

  /** room: mã phòng riêng (để trống = phòng chung) */
  function play(room) {
    room = cleanRoom(room);
    sess = { sid: Date.now().toString(36), paid: 0, room };
    const v = document.getElementById('arcadeView');
    v.innerHTML = `<div class="arc-bar"><b>🦎 Tắc Kè Hoa</b><span>Trốn tìm ngụy trang · tự tô người giống tường để trốn · người tìm cầm súng săn</span><button class="tv-x" data-close>✕ Thoát</button></div>
      <iframe src="arcade/games/hide.html?sid=${sess.sid}&pid=${encodeURIComponent(NET.pid || '')}&name=${encodeURIComponent(S().name || 'Bạn')}&room=${room}&v=${Date.now().toString(36)}" title="Tắc Kè Hoa" allow="autoplay; fullscreen"></iframe>`;
    v.classList.add('show');
    v.querySelector('[data-close]').onclick = () => { finish(); UI.closeArcade(); };
    setTimeout(() => { const f = v.querySelector('iframe'); if (f) f.focus(); }, 300);
    if (NET.mode === 'offline') UI.toast('⚠️ Đang offline — chỉ chơi được với bot', 4000);
  }

  function finish() {
    if (!sess) return;
    NET.sendHide({ k: 'bye', u: NET.pid, rm: sess.room });
    sess = null;
  }

  function reward(m) {
    if (!sess || m.sid !== sess.sid) return;
    if (sess.paid > 40) return; // chặn gửi thưởng dồn dập
    sess.paid++;
    const coins = Math.max(0, Math.min(100, m.coins | 0));
    if (!coins) return;
    S().coins += coins;
    UI.updateHud();
    AV.markChanged();
    if (AV.quest) AV.quest('arcade');
    UI.toast(`🦎 Tắc Kè Hoa: ${m.role === 's' ? `🔫 bắt được ${m.catches | 0} người` : '🫥 đi trốn'} → +${coins} xu`, 4500);
  }

  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type === 'hide-net' && sess && m.d && typeof m.d === 'object') NET.sendHide(m.d);
    else if (m.type === 'hide-reward') reward(m);
    else if (m.type === 'hide-room' && sess) sess.room = cleanRoom(m.room);
    else if (m.type === 'hide-friends' && sess) sendFriends();
    else if (m.type === 'hide-invite' && sess) invite(m);
    else if (m.type === 'arcade-close' && sess) finish();
  });

  /** tin của người khác → chuyển vào game đang mở */
  function onNet(m) {
    if (!sess) return;
    const f = document.querySelector('#arcadeView iframe');
    if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'hide-in', d: m }, '*');
  }

  /* ---------- mời bạn bè ---------- */
  /** gửi vào game: bạn bè (đang online hay không) + người đang đứng gần ở Khu giải trí */
  function sendFriends() {
    const me = typeof CLOUD !== 'undefined' ? CLOUD.username : '';
    const friends = (S().friends || []).filter((f) => f.username && f.username !== me)
      .map((f) => ({ u: f.username, n: f.name || f.username, on: !!NET.onlineUser(f.username) }))
      .sort((a, b) => b.on - a.on);
    const fu = new Set(friends.map((f) => f.u));
    const near = NET.players().filter((r) => !r.user || !fu.has(r.user)).map((r) => ({ p: r.id, n: r.name }));
    const f = document.querySelector('#arcadeView iframe');
    if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'hide-friends-list', friends, near, me: !!me }, '*');
  }
  function invite(m) {
    const to = String(m.to || '').slice(0, 30), toPid = String(m.toPid || '').slice(0, 40);
    if (!to && !toPid) return;
    NET.sendHideInv({ to, toPid, room: cleanRoom(m.room) });
  }
  /** nhận lời mời (qua kênh chung của cả server) */
  function onInvite(m) {
    const me = typeof CLOUD !== 'undefined' ? CLOUD.username : '';
    if (!((m.to && me && m.to === me) || (m.toPid && m.toPid === NET.pid))) return;
    const room = cleanRoom(m.room), who = String(m.name || 'Một người bạn').slice(0, 20);
    if (sess && sess.room === room) return; // đang ở đúng phòng đó rồi
    document.querySelectorAll('.invite-card').forEach((x) => x.remove());
    const el = document.createElement('div');
    el.className = 'invite-card';
    el.innerHTML = `<div>🦎 <b>${UI.esc ? UI.esc(who) : who.replace(/[<>&"]/g, '')}</b> rủ bạn chơi <b>Tắc Kè Hoa</b> — trốn tìm ngụy trang${room ? ` · phòng riêng <b>${room}</b>` : ''}!</div>
      <div class="row-end"><button class="btn ghost small" data-no>Để sau</button><button class="btn small" data-yes>🦎 Vào chơi</button></div>`;
    document.body.appendChild(el);
    el.querySelector('[data-no]').onclick = () => el.remove();
    el.querySelector('[data-yes]').onclick = () => { el.remove(); go(room); };
    setTimeout(() => el.remove(), 25000);
  }
  /** tới Khu giải trí (nếu đang ở khu khác) rồi mở game vào đúng phòng */
  function go(room) {
    if (sess) { finish(); UI.closeArcade(); }
    if (AV.currentMap() === 'fun') return play(room);
    AV.teleport('fun', false, 5880, 850, '🦎 Tới Tắc Kè Hoa…');
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (AV.currentMap() === 'fun') { clearInterval(iv); setTimeout(() => play(room), 1200); } else if (Date.now() - t0 > 15000) clearInterval(iv);
    }, 300);
  }

  /** toà nhà gạch có chữ graffiti + hình nhân sơn nửa người ép vào tường */
  function building(c, x, y, t) {
    c.save();
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x, y + 4, 250, 24, 0, 0, Math.PI * 2); c.fill();
    const L = x - 230, T = y - 300, Wd = 460, Hd = 300;
    c.fillStyle = '#c9b6a2'; c.fillRect(L, T, Wd, Hd);
    const cols = ['#a4553f', '#b4613f', '#924936', '#ab5a44'];
    for (let r = 0; r * 18 < Hd; r++) for (let k = -1; k * 40 < Wd; k++) {
      const bx = L + k * 40 + (r % 2) * 20, by = T + r * 18;
      if (bx + 38 < L || bx > L + Wd) continue;
      c.fillStyle = cols[(r * 7 + k * 3) & 3];
      const x0 = Math.max(L, bx + 2), x1 = Math.min(L + Wd, bx + 38);
      c.fillRect(x0, by + 2, x1 - x0, 14);
    }
    c.fillStyle = '#5c3a2a'; c.fillRect(L - 10, T - 16, Wd + 20, 18);
    // chữ graffiti nhiều màu
    const word = 'TẮC KÈ HOA', cs = ['#40c057', '#fa5252', '#4dabf7', '#fcc419', '#e64980', '#7950f2', '#fd7e14', '#15aabf', '#82c91e'];
    c.font = '900 46px "Be Vietnam Pro", system-ui'; c.textBaseline = 'middle';
    let wx = x - c.measureText(word).width / 2 - 40;
    [...word].forEach((ch, i) => {
      const w = c.measureText(ch).width, bob = Math.sin(t * 2 + i) * 2;
      c.save(); c.translate(wx + w / 2, T + 62 + bob); c.rotate((i % 2 ? 1 : -1) * 0.06);
      c.lineWidth = 7; c.strokeStyle = '#1b1b1b'; c.lineJoin = 'round'; c.textAlign = 'center'; c.strokeText(ch, 0, 0);
      c.fillStyle = cs[i % cs.length]; c.fillText(ch, 0, 0); c.restore();
      wx += w;
    });
    c.font = '800 14px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.fillStyle = '#fff3bf';
    c.fillText('TRỐN TÌM NGỤY TRANG · NHIỀU NGƯỜI', x - 40, T + 104);
    // hình nhân sơn gạch nửa người, đầu trắng mặt cười
    const mx = x + 160, my = T + 150;
    c.fillStyle = '#a4553f'; c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2;
    c.beginPath(); c.roundRect(mx - 22, my, 44, 70, 18); c.fill(); c.stroke();
    c.lineCap = 'round'; c.strokeStyle = '#ab5a44'; c.lineWidth = 14;
    c.beginPath(); c.moveTo(mx - 18, my + 14); c.lineTo(mx - 62, my + 4 + Math.sin(t * 3) * 6); c.moveTo(mx + 18, my + 14); c.lineTo(mx + 44, my + 40); c.stroke();
    c.beginPath(); c.moveTo(mx - 10, my + 66); c.lineTo(mx - 22, my + 112); c.moveTo(mx + 10, my + 66); c.lineTo(mx + 26, my + 110); c.stroke();
    c.strokeStyle = '#d9cfc4'; c.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(mx - 22, my + 14 + k * 16); c.lineTo(mx + 22, my + 14 + k * 16); c.stroke(); }
    c.fillStyle = '#f8f8f5'; c.beginPath(); c.arc(mx, my - 22, 24, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#222'; c.lineWidth = 2.5;
    c.beginPath(); c.arc(mx - 8, my - 26, 4, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.beginPath(); c.arc(mx + 8, my - 26, 4, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.beginPath(); c.arc(mx, my - 20, 11, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
    // cửa
    const dg = c.createLinearGradient(0, y - 130, 0, y); dg.addColorStop(0, '#2b2b2b'); dg.addColorStop(1, '#4a4a4a');
    c.fillStyle = '#3d2410'; c.fillRect(x - 70, y - 138, 140, 138);
    c.fillStyle = dg; c.fillRect(x - 60, y - 128, 120, 128);
    c.fillStyle = (Math.floor(t * 2) % 2) ? '#ffd43b' : '#fab005'; c.font = '900 15px "Be Vietnam Pro", system-ui'; c.textAlign = 'center';
    c.fillText('🦎 VÀO CHƠI', x, y - 150);
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x - 56, y - 124, 54, 120); c.fillRect(x + 2, y - 124, 54, 120);
    // vệt sơn nhỏ giọt
    ['#40c057', '#4dabf7', '#e64980'].forEach((col, i) => { c.fillStyle = col; c.fillRect(L + 30 + i * 22, T + 120, 8, 30 + i * 12); c.beginPath(); c.arc(L + 34 + i * 22, T + 150 + i * 12, 5, 0, Math.PI * 2); c.fill(); });
    c.restore();
  }

  return { play, onNet, onInvite, building };
})();
