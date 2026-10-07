/* Bạn bè: kết bạn, xem ai đang online (ở khu nào), nhắn tin riêng, tặng quà.
 * Thư (lời mời / đồng ý / tin nhắn / quà) lưu ở bảng public.messages (supabase/05-ban-be-tin-nhan.sql),
 * người nhận đọc được cả khi lúc gửi họ đang offline. Danh sách bạn lưu trong bản lưu nhân vật (S.friends). */
const SOCIAL = (() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  let requests = [];          // lời mời kết bạn chưa trả lời
  const unread = {};          // username → số tin chưa đọc
  let chatWith = null, chatPanel = null, mainPanel = null, pulling = false, replyTo = null;
  const EMOS = ['😀', '😂', '🤣', '😍', '🥰', '😘', '😎', '🤩', '😜', '😢', '😭', '😡', '🤬', '😱', '🥺', '😴', '🤔', '🙄', '😏', '🤗', '😅', '😳', '🤭', '😤',
    '👍', '👎', '👏', '🙏', '💪', '👋', '🤝', '✌️', '🔥', '❤️', '💔', '💯', '✨', '🎉', '🎁', '🌹', '💩', '👻', '🤡', '💀', '🐶', '🐱', '🐷', '🌾', '🍉', '🍺', '🥊', '🎵'];
  /* ---------- 🧸 Nhãn dán (sticker) kiểu Zalo / Messenger: vẽ bằng canvas 1 lần rồi dùng lại ---------- */
  const STICKERS = {
    ava: { name: '🧒 Bé Avatar', list: [
      ['a_hi', 'boy', '👋', 'Chào nha!', '#4dabf7'], ['a_love', 'girl', '😍', 'Yêu quá à', '#f06595'], ['a_lol', 'boy', '🤣', 'Hahaha', '#fab005'], ['a_cry', 'girl', '😭', 'Huhu…', '#74c0fc'],
      ['a_angry', 'boy', '😡', 'Giận rồi đó!', '#fa5252'], ['a_thx', 'girl', '🙏', 'Cảm ơn nhiều', '#40c057'], ['a_ok', 'boy', '👌', 'OK luôn', '#20c997'], ['a_sleep', 'girl', '😴', 'Ngủ đây…', '#9775fa'],
      ['a_rich', 'boy', '💰', 'Giàu rồi!', '#f59f00'], ['a_farm', 'girl', '🌾', 'Ra đồng thôi', '#82c91e'], ['a_kiss', 'girl', '😘', 'Moaa~', '#f783ac'], ['a_wow', 'boy', '😱', 'Ối dồi ôi', '#ff922b'],
    ] },
    pet: { name: '🐶 Thú cưng', list: [
      ['p_dog', '🐶', 'Gâu gâu!', '#e8590c'], ['p_cat', '🐱', 'Meo~', '#f783ac'], ['p_pig', '🐷', 'Ủn ỉn', '#ff8fab'], ['p_bear', '🐻', 'Ôm cái nào', '#a0522d'],
      ['p_frog', '🐸', 'Ộp ộp', '#40c057'], ['p_panda', '🐼', 'Lười quá', '#495057'], ['p_chick', '🐥', 'Chíp chíp', '#fab005'], ['p_bunny', '🐰', 'Bye bye', '#cc5de8'],
      ['p_tiger', '🐯', 'Gừ gừ', '#f76707'], ['p_duck', '🦆', 'Quạc quạc', '#1c7ed6'], ['p_unicorn', '🦄', 'Lung linh', '#be4bdb'], ['p_dragon', '🐲', 'Phun lửa nè', '#e03131'],
    ] },
    word: { name: '💬 Chữ', list: [
      ['w_xin', 'XỊN XÒ', '#7048e8', '✨'], ['w_dinh', 'ĐỈNH CAO', '#e03131', '🔥'], ['w_ghe', 'GHÊ CHƯA', '#f59f00', '😎'], ['w_xong', 'THÔI XONG', '#495057', '💀'],
      ['w_chot', 'CHỐT ĐƠN', '#2f9e44', '✅'], ['w_iu', 'IU NHIỀU', '#e64980', '💖'], ['w_ok', 'OK BẠN ƠI', '#1c7ed6', '👍'], ['w_hihi', 'HIHI', '#fab005', '😆'],
    ] },
  };
  const STICK = {};
  Object.entries(STICKERS).forEach(([pk, p]) => p.list.forEach((x) => { STICK[x[0]] = { pk, x }; }));
  const stickCache = new Map();
  function stickerURL(id) {
    const st = STICK[id];
    if (!st) return '';
    if (stickCache.has(id)) return stickCache.get(id);
    const cv = document.createElement('canvas'); cv.width = 240; cv.height = 240;
    const c = cv.getContext('2d'); c.scale(2, 2);
    const caption = (text, col, y = 104, size = 19) => {
      c.font = `900 ${size}px "Be Vietnam Pro", system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle';
      let fs2 = size; while (c.measureText(text).width > 112 && fs2 > 11) { fs2--; c.font = `900 ${fs2}px "Be Vietnam Pro", system-ui`; }
      c.lineJoin = 'round'; c.lineWidth = 6; c.strokeStyle = '#fff'; c.strokeText(text, 60, y);
      c.fillStyle = col; c.fillText(text, 60, y);
    };
    if (st.pk === 'ava') {
      const [, av, emo, text, col] = st.x;
      const look = { ...AV.S.look, avatar: av, phair: undefined };
      c.save(); ART.character(c, 54, 88, look, { scale: 1.15, t: 0, dir: 1 }); c.restore();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(92, 26, 20, 0, Math.PI * 2); c.fill();
      c.strokeStyle = col; c.lineWidth = 3; c.stroke();
      c.font = '24px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(emo, 92, 27);
      caption(text, col);
    } else if (st.pk === 'pet') {
      const [, emo, text, col] = st.x;
      c.fillStyle = col + '22'; c.beginPath(); c.arc(60, 50, 44, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#000'; c.font = '66px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(emo, 60, 52);
      caption(text, col);
    } else {
      const [, text, col, emo] = st.x;
      c.save(); c.translate(60, 60); c.rotate(-0.12);
      c.fillStyle = '#fff'; c.beginPath(); c.roundRect(-56, -26, 112, 52, 16); c.fill();
      c.strokeStyle = col; c.lineWidth = 4; c.stroke();
      c.restore();
      c.save(); c.translate(0, 0); caption(text, col, 58, 22); c.restore();
      c.font = '26px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(emo, 100, 22); c.fillText(emo, 18, 96);
    }
    const url = cv.toDataURL('image/png');
    stickCache.set(id, url);
    return url;
  }

  /** tin chỉ gồm 1–3 emoji → hiện to */
  const onlyEmoji = (t) => /^(\p{Extended_Pictographic}|\p{Emoji_Component}|\u200d|\ufe0f|\s){1,12}$/u.test(t) && [...t.replace(/\s/g, '')].filter((c) => /\p{Extended_Pictographic}/u.test(c)).length <= 3;
  const snip = (t, n = 60) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

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
    const pb = $('#btnChat');
    if (pb) { pb.dataset.n = n || ''; pb.classList.toggle('has-n', n > 0); }
  }

  /* ---------- Hành động ---------- */
  async function addFriend(username, extra = {}) {
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
      await send(who.uid, 'friend_req', extra);
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
      body = requests.length ? `<div class="shop-list">${requests.map((r) => `<div class="shop-row"><span class="ic">📨</span><div class="info"><b>${esc(r.from_name || r.from_username)}</b><small>@${esc(r.from_username)} ${r.body && r.body.phone ? '📱 gửi số ' + esc(String(r.body.phone).slice(0, 12)) + ' · ' : ''}muốn kết bạn với bạn</small></div>
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
    const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40 || box.querySelector('p.muted');
    box.innerHTML = rows.length ? rows.map((m) => {
      const mine = m.from_user === me, time = new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const g = m.body || {};
      const raw = m.kind === 'gift' ? `🎁 Tặng ${g.coins ? fmt(g.coins) + ' xu' : g.n + ' ' + (DATA.ITEMS[g.item] ? DATA.ITEMS[g.item].icon + ' ' + DATA.ITEMS[g.item].name.toLowerCase() : '')}${g.note ? ' — ' + g.note : ''}` : String(g.text || '');
      const stk = m.kind === 'chat' && g.st && STICK[g.st];
      const big = !stk && m.kind === 'chat' && !g.re && onlyEmoji(raw);
      const re = g.re && typeof g.re === 'object' ? `<div class="dm-quote" data-goto="${+g.re.id || 0}"><b>↩ ${esc(String(g.re.w || '') === S().name ? 'Bạn' : String(g.re.w || ''))}</b>${esc(snip(String(g.re.t || ''), 80))}</div>` : '';
      const pic = m.kind === 'chat' && typeof CHATIMG !== 'undefined' && g.img && CHATIMG.url(g.img);
      return `<div class="dm-msg ${mine ? 'me' : ''} ${big ? 'big' : ''} ${stk || pic ? 'sticker' : ''}" data-id="${m.id}" data-who="${esc(mine ? S().name : chatWith.name)}" data-t="${esc(snip(raw, 80))}">${re}${pic ? `<img class="dm-img" src="${pic}" alt="ảnh" loading="lazy">` : stk ? `<img class="dm-stk" src="${stickerURL(g.st)}" alt="nhãn dán">` : `<span>${esc(raw)}</span>`}<small>${time}</small><button class="dm-re" title="Trả lời" type="button">↩</button></div>`;
    }).join('') : '<p class="muted">Chưa có tin nhắn nào. Chào nhau một câu đi 👋</p>';
    if (atBottom) box.scrollTop = box.scrollHeight;
    box.querySelectorAll('.dm-img').forEach((im) => { im.onclick = () => CHATIMG.view(im.src); im.onload = () => { if (atBottom) box.scrollTop = box.scrollHeight; }; });
    box.querySelectorAll('.dm-re').forEach((b) => b.onclick = (e) => { e.stopPropagation(); const el = b.closest('.dm-msg'); setReply({ id: +el.dataset.id, t: el.dataset.t, w: el.dataset.who }); });
    box.querySelectorAll('.dm-quote').forEach((q) => q.onclick = () => {
      const el = box.querySelector(`.dm-msg[data-id="${q.dataset.goto}"]`);
      if (!el) return UI.toast('Tin nhắn gốc đã cũ, không còn trong khung chat');
      el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    });
    // vuốt / nhấn giữ tin nhắn trên điện thoại = trả lời
    box.querySelectorAll('.dm-msg').forEach((el) => {
      let tm = 0;
      el.addEventListener('touchstart', () => { tm = setTimeout(() => setReply({ id: +el.dataset.id, t: el.dataset.t, w: el.dataset.who }), 450); }, { passive: true });
      ['touchend', 'touchmove', 'touchcancel'].forEach((ev) => el.addEventListener(ev, () => clearTimeout(tm), { passive: true }));
    });
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
      <div class="dm-reply" hidden><span></span><button type="button" class="dm-reply-x" title="Huỷ trả lời">✕</button></div>
      <div class="dm-pick" hidden>
        <div class="dm-tabs"><button type="button" data-tab="emo" class="on">😀 Emoji</button>${Object.entries(STICKERS).map(([k, p]) => `<button type="button" data-tab="${k}">${p.name}</button>`).join('')}</div>
        <div class="dm-emo">${EMOS.map((e) => `<button type="button" data-e="${e}">${e}</button>`).join('')}</div>
        <div class="dm-stks" hidden></div>
      </div>
      <form class="dm-form" data-dm><button type="button" class="dm-emo-btn" title="Emote">😊</button><button type="button" class="dm-emo-btn dm-img-btn" title="Gửi ảnh (hoặc Ctrl+V dán ảnh)">📷</button><input class="field" name="t" maxlength="200" placeholder="Nhắn cho ${esc(f.name)}…" autocomplete="off"><button class="btn">Gửi</button></form>
      <div class="row-end"><button class="btn small ghost" data-g>🎁 Tặng quà</button></div>`, { onClose: () => { if (chatPanel === me) { chatWith = null; chatPanel = null; } } });
    const me = chatPanel;
    replyTo = null;
    const form = chatPanel.body.querySelector('[data-dm]');
    const pickBox = chatPanel.body.querySelector('.dm-pick'), emo = pickBox.querySelector('.dm-emo'), stks = pickBox.querySelector('.dm-stks');
    const syncPick = () => chatPanel.body.classList.toggle('picking', !pickBox.hidden);
    chatPanel.body.querySelector('.dm-emo-btn').onclick = () => { pickBox.hidden = !pickBox.hidden; syncPick(); };
    pickBox.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => {
      pickBox.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('on', x === b));
      const k = b.dataset.tab;
      emo.hidden = k !== 'emo'; stks.hidden = k === 'emo';
      if (k !== 'emo') {
        stks.innerHTML = STICKERS[k].list.map((x) => `<button type="button" data-st="${x[0]}"><img src="${stickerURL(x[0])}" alt=""></button>`).join('');
        stks.querySelectorAll('[data-st]').forEach((sb) => sb.onclick = () => sendSticker(sb.dataset.st));
      }
    });
    const sendSticker = async (id) => {
      pickBox.hidden = true; syncPick();
      const body = { text: '[Nhãn dán]', st: id };
      if (replyTo) body.re = { id: replyTo.id, t: snip(replyTo.t, 80), w: String(replyTo.w || '').slice(0, 16) };
      setReply(null);
      try { await send(f.uid, 'chat', body); await loadChat(); const box = chatPanel && chatPanel.body.querySelector('.dm-log'); if (box) box.scrollTop = box.scrollHeight; } catch (er) { UI.toast('⚠️ ' + errText(er), 4500); }
    };
    emo.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => {
      const i = form.t, a = i.selectionStart ?? i.value.length, z = i.selectionEnd ?? i.value.length;
      i.value = (i.value.slice(0, a) + b.dataset.e + i.value.slice(z)).slice(0, 200);
      const p = a + b.dataset.e.length; i.focus(); i.setSelectionRange(p, p);
    });
    chatPanel.body.querySelector('.dm-reply-x').onclick = () => setReply(null);
    const imgBtn = chatPanel.body.querySelector('.dm-img-btn');
    if (typeof CHATIMG !== 'undefined') CHATIMG.attach(form.t, imgBtn, async (u) => {
      const body = { text: '📷 Ảnh', img: u };
      if (replyTo) body.re = { id: replyTo.id, t: snip(replyTo.t, 80), w: String(replyTo.w || '').slice(0, 16) };
      setReply(null);
      try { await send(f.uid, 'chat', body); await loadChat(); const box = chatPanel && chatPanel.body.querySelector('.dm-log'); if (box) box.scrollTop = box.scrollHeight; } catch (er) { UI.toast('⚠️ ' + errText(er), 4500); }
    }, `📷 Gửi ảnh cho ${esc(f.name)}`);
    else imgBtn.hidden = true;
    form.onsubmit = async (e) => {
      e.preventDefault();
      const t = form.t.value.trim();
      if (!t) return;
      form.t.value = '';
      pickBox.hidden = true; syncPick();
      const body = { text: t.slice(0, 200) };
      if (replyTo) body.re = { id: replyTo.id, t: snip(replyTo.t, 80), w: String(replyTo.w || '').slice(0, 16) };
      setReply(null);
      try { await send(f.uid, 'chat', body); const box = chatPanel && chatPanel.body.querySelector('.dm-log'); if (box) box.scrollTop = box.scrollHeight; await loadChat(); if (box) box.scrollTop = box.scrollHeight; } catch (er) { UI.toast('⚠️ ' + errText(er), 4500); }
    };
    chatPanel.body.querySelector('[data-g]').onclick = () => giftPanel(f);
    setTimeout(() => form.t.focus(), 60);
    loadChat();
  }

  /** chọn tin để trả lời (null = huỷ) */
  function setReply(r) {
    replyTo = r && r.id ? r : null;
    if (!chatPanel || !chatPanel.el.isConnected) return;
    const bar = chatPanel.body.querySelector('.dm-reply');
    bar.hidden = !replyTo;
    if (replyTo) {
      bar.querySelector('span').innerHTML = `↩ Trả lời <b>${esc(replyTo.w)}</b>: ${esc(snip(replyTo.t, 50))}`;
      chatPanel.body.querySelector('[data-dm]').t.focus();
    }
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
        <div class="chips center"><button class="chip ${kind === 'coins' ? 'on' : ''}" data-k="coins">💰 Tặng xu</button><button class="chip ${kind === 'item' ? 'on' : ''}" data-k="item">🎒 Tặng đồ</button><button class="chip" data-bankx>🏦 Chuyển khoản STK</button></div>
        ${kind === 'item' ? `<div class="ss-grid gift-grid">${items.map(([id, n]) => `<button class="ss-cell ${id === item ? 'sel' : ''}" data-it="${id}"><span>${DATA.ITEMS[id].icon}</span><i>${n}</i></button>`).join('') || '<p class="muted">Túi trống</p>'}</div>${item ? `<p class="muted">${DATA.ITEMS[item].name} · đang có ${st.inv[item] || 0}</p>` : ''}` : ''}
        ${err ? `<p class="game-msg">${err}</p>` : ''}
        <form class="fsearch" data-send><input class="field" name="n" type="number" min="1" value="${amount}" placeholder="Số lượng"><input class="field" name="note" maxlength="60" placeholder="Lời nhắn (không bắt buộc)"><button class="btn" ${kind === 'item' && !item ? 'disabled' : ''}>🎁 Tặng</button></form>
        <p class="muted small-note">Có tối đa: ${fmt(max)}</p>`;
      p.body.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { kind = b.dataset.k; amount = kind === 'coins' ? 100 : 1; render(); });
      p.body.querySelector('[data-bankx]').onclick = () => { p.close(); if (!AV.S.bank) return UI.toast('🏦 Bạn chưa có tài khoản QuangLamBank — mở tài khoản ở ngân hàng trước cổng nông trại nhé', 5000); UI.toast(`🏦 Nhập mật khẩu, rồi điền STK của ${f.name} ở mục 💸 Chuyển khoản`, 4500); BANK.panel('app'); };
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
