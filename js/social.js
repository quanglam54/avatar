/* Bạn bè: kết bạn, xem ai đang online (ở khu nào), nhắn tin riêng, tặng quà.
 * Thư (lời mời / đồng ý / tin nhắn / quà) lưu ở bảng public.messages (supabase/05-ban-be-tin-nhan.sql),
 * người nhận đọc được cả khi lúc gửi họ đang offline. Danh sách bạn lưu trong bản lưu nhân vật (S.friends). */
const SOCIAL = (() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  let requests = [];          // lời mời kết bạn chưa trả lời
  const unread = {};          // username → số tin chưa đọc
  let chatWith = null, chatPanel = null, mainPanel = null, pulling = false;

  const S = () => AV.S;
  const friends = () => (S().friends = S().friends || []);
  const isFriend = (u) => friends().some((f) => f.username === u);
  const ready = () => CLOUD.user && CLOUD.client;
  const db = () => CLOUD.client.from('messages');
  const ZONE = (id) => { const z = DATA.ZONES.find((x) => x.id === id); return z ? `${z.icon} ${z.name}` : id === 'casino' ? '🎰 Casino' : id === 'classroom' ? '🏫 Lớp học' : id === 'home' ? '🏠 Trong nhà' : id || ''; };

  function errText(e) {
    const m = String((e && e.message) || e || '');
    if (/messages|does not exist|Could not find the table/i.test(m)) return 'Chủ game chưa cài tính năng bạn bè trên Supabase (chạy file supabase/05-ban-be-tin-nhan.sql)';
    if (/msg_rate_limit/.test(m)) return 'Gửi nhanh quá, đợi một chút nhé';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Không kết nối được máy chủ, kiểm tra mạng';
    return m || 'Có lỗi xảy ra';
  }

  /** Tìm mã người chơi theo tên đăng nhập (dùng lại hàm get_farm) */
  async function lookup(username) {
    const u = String(username || '').trim().toLowerCase();
    if (!u) return null;
    const f = await CLOUD.getFarm(u);
    return f && f.user_id ? { uid: f.user_id, username: u, name: f.name || u } : null;
  }

  async function send(toUid, kind, body = {}) {
    const { error } = await db().insert({ to_user: toUid, from_name: S().name, from_username: CLOUD.username, kind, body });
    if (error) throw new Error(errText(error));
    NET.farmPing('dm', toUid);
  }

  /* ---------- Nhận thư ---------- */
  async function pull() {
    if (!ready() || pulling) return;
    pulling = true;
    try {
      const { data, error } = await db().select('id, from_user, from_name, from_username, kind, body, created_at').eq('to_user', CLOUD.user.id).eq('read', false).order('created_at', { ascending: true }).limit(100);
      if (error) return;
      const done = [];
      requests = [];
      Object.keys(unread).forEach((k) => delete unread[k]);
      for (const m of data || []) {
        const who = m.from_username || '';
        if (m.kind === 'friend_req') {
          if (isFriend(who)) done.push(m.id); else requests.push(m);
        } else if (m.kind === 'friend_ok') {
          if (!isFriend(who)) { friends().push({ uid: m.from_user, username: who, name: m.from_name || who }); AV.saveNow(); AV.markChanged(); }
          UI.toast(`🤝 ${m.from_name || who} đã đồng ý kết bạn!`, 4000);
          done.push(m.id);
        } else if (m.kind === 'chat') {
          if (chatWith && chatWith.username === who) done.push(m.id);
          else unread[who] = (unread[who] || 0) + 1;
        } else if (m.kind === 'gift') {
          // nhận quà: chỉ cộng khi đánh dấu "đã nhận" thành công (tránh nhận 2 lần trên 2 máy)
          const { data: ok } = await db().update({ read: true }).eq('id', m.id).eq('read', false).select('id');
          if (ok && ok.length) {
            const g = m.body || {};
            if (g.coins > 0) AV.earn(Math.floor(g.coins), 0);
            if (g.item && DATA.ITEMS[g.item] && g.n > 0) AV.addItem(g.item, Math.floor(g.n));
            const what = g.coins ? `${fmt(g.coins)} xu` : `${g.n} ${DATA.ITEMS[g.item] ? DATA.ITEMS[g.item].icon + ' ' + DATA.ITEMS[g.item].name.toLowerCase() : ''}`;
            UI.toast(`🎁 ${m.from_name || who} tặng bạn ${what}${g.note ? ` — "${g.note}"` : ''}`, 5000);
            UI.chatLog('', `🎁 ${m.from_name || who} tặng bạn ${what}`, false, true);
          }
        }
      }
      if (done.length) await db().update({ read: true }).in('id', done);
      updateBadge();
      if (mainPanel && mainPanel.el.isConnected) renderMain();
      if (chatWith) loadChat();
    } catch (e) { /* thử lại sau */ } finally { pulling = false; }
  }

  function updateBadge() {
    const b = $('#btnSocial');
    if (!b) return;
    const n = requests.length + Object.values(unread).reduce((a, x) => a + x, 0);
    b.dataset.n = n || '';
    b.classList.toggle('has-n', n > 0);
  }

  /* ---------- Hành động ---------- */
  async function addFriend(username) {
    if (!ready()) return UI.toast('🔐 Cần đăng nhập tài khoản để kết bạn');
    const u = String(username || '').trim().toLowerCase();
    if (!u) return;
    if (u === CLOUD.username) return UI.toast('Đây là tên của chính bạn 😄');
    if (isFriend(u)) return UI.toast('Hai bạn đã là bạn bè rồi 🤝');
    try {
      const who = await lookup(u);
      if (!who) return UI.toast(`Không tìm thấy người chơi "${u}" — kiểm tra lại tên đăng nhập nhé`, 4000);
      // người kia đã mời mình trước → đồng ý luôn
      const req = requests.find((r) => r.from_username === u);
      if (req) return accept(req);
      await send(who.uid, 'friend_req');
      UI.toast(`📨 Đã gửi lời mời kết bạn tới ${who.name}`);
    } catch (e) { UI.toast('⚠️ ' + errText(e), 4500); }
  }

  async function accept(req) {
    try {
      const who = req.from_username;
      if (!isFriend(who)) friends().push({ uid: req.from_user, username: who, name: req.from_name || who });
      AV.markChanged();
      await db().update({ read: true }).eq('id', req.id);
      await send(req.from_user, 'friend_ok');
      requests = requests.filter((r) => r.id !== req.id);
      UI.toast(`🤝 Đã kết bạn với ${req.from_name || who}!`);
      updateBadge();
      if (mainPanel && mainPanel.el.isConnected) renderMain();
    } catch (e) { UI.toast('⚠️ ' + errText(e), 4500); }
  }
  async function decline(req) {
    try { await db().update({ read: true }).eq('id', req.id); } catch (e) { /* bỏ qua */ }
    requests = requests.filter((r) => r.id !== req.id);
    updateBadge();
    renderMain();
  }
  function removeFriend(u) {
    S().friends = friends().filter((f) => f.username !== u);
    AV.markChanged();
    renderMain();
  }

  /* ---------- Bảng bạn bè ---------- */
  let tab = 'list';
  function open(t) {
    if (!ready()) {
      const p = UI.panel('👥 Bạn bè', '<p class="muted">Cần đăng nhập tài khoản để kết bạn, nhắn tin và tặng quà.</p><div class="row-end"><button class="btn" data-login>🔐 Đăng nhập / Tạo tài khoản</button></div>');
      p.body.querySelector('[data-login]').onclick = () => { p.close(); UI.authPanel(false); };
      return;
    }
    if (t) tab = t;
    if (mainPanel && mainPanel.el.isConnected) mainPanel.close();
    mainPanel = UI.panel('👥 Bạn bè', '', { wide: true, onClose: () => { mainPanel = null; } });
    renderMain();
    pull();
  }

  function renderMain() {
    if (!mainPanel || !mainPanel.el.isConnected) return;
    const list = friends().map((f) => ({ ...f, on: NET.onlineUser(f.username) })).sort((a, b) => (b.on ? 1 : 0) - (a.on ? 1 : 0) || (unread[b.username] || 0) - (unread[a.username] || 0));
    const tabs = [['list', `Bạn bè (${list.length})`], ['req', `Lời mời${requests.length ? ` (${requests.length})` : ''}`], ['add', '➕ Thêm bạn']];
    let body = '';
    if (tab === 'list') {
      body = list.length ? `<div class="shop-list">${list.map((f) => `<div class="shop-row fr-row"><span class="ic fr-dot ${f.on ? 'on' : ''}">${f.on ? '🟢' : '⚪'}</span>
        <div class="info"><b>${esc(f.name)}${unread[f.username] ? ` <span class="lnew">${unread[f.username]} tin mới</span>` : ''}</b><small>@${esc(f.username)} · ${f.on ? 'đang ở ' + ZONE(f.on.map) : 'offline'}</small></div>
        <button class="btn small" data-chat="${esc(f.username)}">💬</button><button class="btn small ghost" data-gift="${esc(f.username)}">🎁</button><button class="btn small ghost" data-visit="${esc(f.username)}">🏡</button><button class="btn small ghost" data-rm="${esc(f.username)}" title="Huỷ kết bạn">✕</button></div>`).join('')}</div>`
        : '<p class="muted">Chưa có bạn nào. Bấm vào người chơi khác → <b>➕ Kết bạn</b>, hoặc vào tab <b>Thêm bạn</b> gõ tên đăng nhập.</p>';
    } else if (tab === 'req') {
      body = requests.length ? `<div class="shop-list">${requests.map((r) => `<div class="shop-row"><span class="ic">📨</span><div class="info"><b>${esc(r.from_name || r.from_username)}</b><small>@${esc(r.from_username)} muốn kết bạn với bạn</small></div>
        <button class="btn small ghost" data-no="${r.id}">Từ chối</button><button class="btn small" data-ok="${r.id}">🤝 Đồng ý</button></div>`).join('')}</div>` : '<p class="muted">Không có lời mời nào.</p>';
    } else {
      body = `<p class="muted">Gõ <b>tên đăng nhập</b> của bạn bè để gửi lời mời. Tên đăng nhập của bạn: <b>@${esc(CLOUD.username)}</b></p>
        <form class="fsearch" data-add><input class="field" name="u" placeholder="Tên đăng nhập" maxlength="20" autocomplete="off"><button class="btn">➕ Kết bạn</button></form>
        <h4>Đang online gần bạn</h4><div class="shop-list">${NET.players().filter((r) => r.user && r.user !== CLOUD.username && !isFriend(r.user)).map((r) => `<div class="shop-row"><span class="ic">🧑</span><div class="info"><b>${esc(r.name)}</b><small>@${esc(r.user)}</small></div><button class="btn small" data-addu="${esc(r.user)}">➕ Kết bạn</button></div>`).join('') || '<p class="muted">Không có ai khác ở khu này.</p>'}</div>`;
    }
    mainPanel.body.innerHTML = `<div class="ss-tabs">${tabs.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div><div class="ss-box">${body}</div>`;
    const q = (s) => mainPanel.body.querySelectorAll(s);
    q('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; renderMain(); });
    q('[data-chat]').forEach((b) => b.onclick = () => openChat(friends().find((f) => f.username === b.dataset.chat)));
    q('[data-gift]').forEach((b) => b.onclick = () => giftPanel(friends().find((f) => f.username === b.dataset.gift)));
    q('[data-visit]').forEach((b) => b.onclick = () => { mainPanel.close(); AV.visitFarm(b.dataset.visit); });
    q('[data-rm]').forEach((b) => b.onclick = () => UI.confirm(`Huỷ kết bạn với @${esc(b.dataset.rm)}?`, 'Huỷ kết bạn', () => removeFriend(b.dataset.rm)));
    q('[data-ok]').forEach((b) => b.onclick = () => accept(requests.find((r) => String(r.id) === b.dataset.ok)));
    q('[data-no]').forEach((b) => b.onclick = () => decline(requests.find((r) => String(r.id) === b.dataset.no)));
    q('[data-addu]').forEach((b) => b.onclick = () => addFriend(b.dataset.addu));
    const f = mainPanel.body.querySelector('[data-add]');
    if (f) f.onsubmit = (e) => { e.preventDefault(); addFriend(f.u.value); f.u.value = ''; };
  }

  /* ---------- Khung chat riêng ---------- */
  async function loadChat() {
    if (!chatWith || !chatPanel || !chatPanel.el.isConnected) return;
    const me = CLOUD.user.id, them = chatWith.uid;
    const { data } = await db().select('id, from_user, kind, body, created_at, read').or(`and(from_user.eq.${me},to_user.eq.${them}),and(from_user.eq.${them},to_user.eq.${me})`).in('kind', ['chat', 'gift']).order('created_at', { ascending: false }).limit(60);
    const rows = (data || []).reverse();
    const box = chatPanel.body.querySelector('.dm-log');
    if (!box) return;
    box.innerHTML = rows.length ? rows.map((m) => {
      const mine = m.from_user === me, time = new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const g = m.body || {};
      const text = m.kind === 'gift' ? `🎁 Tặng ${g.coins ? fmt(g.coins) + ' xu' : g.n + ' ' + (DATA.ITEMS[g.item] ? DATA.ITEMS[g.item].icon + ' ' + DATA.ITEMS[g.item].name.toLowerCase() : '')}${g.note ? ' — ' + esc(g.note) : ''}` : esc(g.text);
      return `<div class="dm-msg ${mine ? 'me' : ''}"><span>${text}</span><small>${time}</small></div>`;
    }).join('') : '<p class="muted">Chưa có tin nhắn nào. Chào nhau một câu đi 👋</p>';
    box.scrollTop = box.scrollHeight;
    const unreadIds = rows.filter((m) => m.from_user === them && !m.read && m.kind === 'chat').map((m) => m.id);
    if (unreadIds.length) { await db().update({ read: true }).in('id', unreadIds); delete unread[chatWith.username]; updateBadge(); }
  }

  function openChat(f) {
    if (!f) return;
    if (chatPanel && chatPanel.el.isConnected) chatPanel.close();
    chatWith = f;
    const on = NET.onlineUser(f.username);
    chatPanel = UI.panel(`💬 ${esc(f.name)}`, `<small class="muted">@${esc(f.username)} · ${on ? '🟢 đang ở ' + ZONE(on.map) : '⚪ offline — sẽ đọc khi online'}</small>
      <div class="dm-log"><p class="muted">⏳ Đang tải…</p></div>
      <form class="dm-form" data-dm><input class="field" name="t" maxlength="200" placeholder="Nhắn cho ${esc(f.name)}…" autocomplete="off"><button class="btn">Gửi</button></form>
      <div class="row-end"><button class="btn small ghost" data-g>🎁 Tặng quà</button></div>`, { onClose: () => { if (chatPanel === me) { chatWith = null; chatPanel = null; } } });
    const me = chatPanel;
    const form = chatPanel.body.querySelector('[data-dm]');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const t = form.t.value.trim();
      if (!t) return;
      form.t.value = '';
      try { await send(f.uid, 'chat', { text: t.slice(0, 200) }); loadChat(); } catch (er) { UI.toast('⚠️ ' + errText(er), 4500); }
    };
    chatPanel.body.querySelector('[data-g]').onclick = () => giftPanel(f);
    setTimeout(() => form.t.focus(), 60);
    loadChat();
  }

  /* ---------- Tặng quà ---------- */
  function giftPanel(f) {
    if (!f) return;
    const st = S();
    let kind = 'coins', item = null, amount = 100;
    const p = UI.panel(`🎁 Tặng quà cho ${esc(f.name)}`, '');
    const render = (err) => {
      const items = Object.entries(st.inv).filter(([id, n]) => n > 0 && DATA.ITEMS[id] && id !== 'ticket');
      const max = kind === 'coins' ? st.coins : (st.inv[item] || 0);
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(st.coins)} xu</div>
        <div class="chips center"><button class="chip ${kind === 'coins' ? 'on' : ''}" data-k="coins">💰 Tặng xu</button><button class="chip ${kind === 'item' ? 'on' : ''}" data-k="item">🎒 Tặng đồ</button></div>
        ${kind === 'item' ? `<div class="ss-grid gift-grid">${items.map(([id, n]) => `<button class="ss-cell ${id === item ? 'sel' : ''}" data-it="${id}"><span>${DATA.ITEMS[id].icon}</span><i>${n}</i></button>`).join('') || '<p class="muted">Túi trống</p>'}</div>${item ? `<p class="muted">${DATA.ITEMS[item].name} · đang có ${st.inv[item] || 0}</p>` : ''}` : ''}
        ${err ? `<p class="game-msg">${err}</p>` : ''}
        <form class="fsearch" data-send><input class="field" name="n" type="number" min="1" value="${amount}" placeholder="Số lượng"><input class="field" name="note" maxlength="60" placeholder="Lời nhắn (không bắt buộc)"><button class="btn" ${kind === 'item' && !item ? 'disabled' : ''}>🎁 Tặng</button></form>
        <p class="muted small-note">Có tối đa: ${fmt(max)}</p>`;
      p.body.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { kind = b.dataset.k; amount = kind === 'coins' ? 100 : 1; render(); });
      p.body.querySelectorAll('[data-it]').forEach((b) => b.onclick = () => { item = b.dataset.it; render(); });
      const form = p.body.querySelector('[data-send]');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const n = Math.floor(+form.n.value);
        amount = n;
        if (!n || n < 1) return render('⚠️ Nhập số lượng muốn tặng');
        if (kind === 'coins' && n > st.coins) return render(`⚠️ Không đủ xu! Bạn chỉ còn ${fmt(st.coins)} xu`);
        if (kind === 'item' && n > (st.inv[item] || 0)) return render(`⚠️ Không đủ đồ! Bạn chỉ có ${st.inv[item] || 0}`);
        const body = kind === 'coins' ? { coins: n } : { item, n };
        if (form.note.value.trim()) body.note = form.note.value.trim().slice(0, 60);
        try {
          // trừ trước để không tặng 2 lần khi bấm nhanh, lỗi thì trả lại
          if (kind === 'coins') st.coins -= n; else st.inv[item] -= n;
          AV.markChanged();
          await send(f.uid, 'gift', body);
          UI.toast(`🎁 Đã tặng ${f.name} ${kind === 'coins' ? fmt(n) + ' xu' : n + ' ' + DATA.ITEMS[item].icon}`, 3500);
          p.close();
          if (chatWith && chatWith.username === f.username) loadChat();
        } catch (er) {
          if (kind === 'coins') st.coins += n; else st.inv[item] = (st.inv[item] || 0) + n;
          AV.markChanged();
          render('⚠️ ' + errText(er));
        }
      };
    };
    render();
  }

  function init() {
    const b = $('#btnSocial');
    if (b) b.onclick = () => open();
    setInterval(pull, 30000);
    setInterval(() => { if (mainPanel && mainPanel.el.isConnected && tab === 'list') renderMain(); }, 8000);
  }

  return { init, pull, open, addFriend, openChat, giftPanel, isFriend, get requests() { return requests; } };
})();
