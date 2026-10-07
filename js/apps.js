/* 📱 Ứng dụng trên điện thoại: 📸 ZenoGram (mạng xã hội cả server) · 🛵 Giao đồ ăn · 🚕 Gọi xe.
 * ZenoGram lưu ở bảng zeno_posts / zeno_likes / zeno_comments (supabase/16-zenogram.sql), ảnh dùng kho chat-images.
 * Giao đồ ăn: đặt món ở các quán, shipper chạy xe máy tới tận chỗ → ăn ngay (hồi ⚡, +XP).
 * Gọi xe: xe ôm / taxi chạy tới đón rồi chở tới khu đã chọn. */
const ZAPPS = (() => {
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => AV.S;
  const db = () => CLOUD.user && CLOUD.client;
  const ago = (iso) => { const s = (Date.now() - Date.parse(iso)) / 1000; return s < 60 ? 'vừa xong' : s < 3600 ? Math.floor(s / 60) + ' phút' : s < 86400 ? Math.floor(s / 3600) + ' giờ' : Math.floor(s / 86400) + ' ngày'; };
  const NOT_READY = 'Chủ game chưa bật ZenoGram (chạy file supabase/16-zenogram.sql)';
  const missing = (e) => /zeno_|does not exist|Could not find/i.test(String((e && e.message) || ''));

  /* ================= 🚗 xe chạy tới chỗ người chơi (dùng chung cho shipper & taxi) ================= */
  let busy = false;
  /** icon xe, onArrive() khi tới nơi, pickUp = đón người (ẩn nhân vật rồi chạy đi) */
  function vehicle(icon, label, onArrive, pickUp) {
    if (busy) { UI.toast('🛵 Đang có xe trên đường tới rồi, đợi chút nhé'); return false; }
    busy = true;
    const P = AV.player;
    if (AV.mapIndoor()) {
      UI.toast(`${icon} ${label} đang tới cửa…`, 3500);
      setTimeout(() => { busy = false; onArrive(); }, 4500);
      return true;
    }
    const fx = { x: P.x - 1000, y: P.y + 28, ph: 'come', t: 0 };
    fx.draw = (g, t) => { g.save(); g.translate(fx.x, fx.y + Math.sin(t * 20) * 1.2); g.scale(-1, 1); g.font = '64px system-ui, "Segoe UI Emoji"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = '#000'; g.fillText(icon, 0, 0); g.restore(); if (fx.ph === 'stop') { g.font = '800 14px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = '#2b1a10'; g.lineWidth = 4; const m = pickUp ? 'Lên xe đi bạn ơi!' : 'Đồ ăn tới rồi nè!'; g.strokeText(m, fx.x, fx.y - 74); g.fillText(m, fx.x, fx.y - 74); } };
    AV.worldFx.push(fx);
    UI.toast(`${icon} ${label} đang chạy tới chỗ bạn!`, 3500);
    let last = performance.now();
    const end = () => { const i = AV.worldFx.indexOf(fx); if (i >= 0) AV.worldFx.splice(i, 1); busy = false; };
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (fx.ph === 'come') {
        const tx = P.x - 80;
        fx.x += Math.min(480 * dt, tx - fx.x); fx.y += (P.y + 28 - fx.y) * Math.min(1, dt * 3);
        if (tx - fx.x < 2) { fx.ph = 'stop'; fx.t = 0; if (typeof MUSIC !== 'undefined' && MUSIC.clack) MUSIC.clack(); }
      } else if (fx.ph === 'stop') {
        fx.t += dt;
        if (fx.t > 1.4) { if (pickUp) P.hidden = true; else onArrive(); fx.ph = 'go'; }
      } else {
        fx.x += 560 * dt;
        if (fx.x > P.x + 1000) { end(); if (pickUp) onArrive(); return; }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(() => { if (busy && AV.worldFx.includes(fx)) { end(); P.hidden = false; onArrive(); } }, 25000);
    return true;
  }

  /* ================= 🛵 GIAO ĐỒ ĂN ================= */
  const SHIP = 10;
  function food(box, back) {
    const shops = [...DATA.EATERIES, ...(DATA.TEA_MENU || [])];
    box.innerHTML = back('🛵 ZenoFood') + `<div class="ap-note">Phí ship <b>${SHIP} xu</b> · shipper chạy xe máy tới tận chỗ bạn</div>
      <div class="ap-list">${shops.map((e) => `<div class="ap-shop"><b>${e.logo || '🍜'} ${esc(e.name)}</b>${e.menu.map((it) => `<button class="ap-item" data-f="${e.id}|${it.id}"><span>${it.icon}</span><span class="ap-nm">${esc(it.name)}</span><span class="ap-pr">${it.price + SHIP} xu</span></button>`).join('')}</div>`).join('')}</div>`;
    box.querySelectorAll('[data-f]').forEach((b) => b.onclick = () => {
      const [sid, iid] = b.dataset.f.split('|'), shop = shops.find((x) => x.id === sid), it = shop.menu.find((x) => x.id === iid);
      if (AV.belly() >= DATA.BELLY.max) return UI.toast('😵 Bạn đang no căng bụng, đặt sau nhé');
      if (S().coins < it.price + SHIP) return UI.toast('Không đủ xu 😢');
      if (!AV.spend(SHIP)) return;
      PHONE.close();
      vehicle('🛵', `Shipper ${shop.name}`, () => { AV.eat(sid, iid); UI.toast(`🛵 Đã nhận ${it.icon} ${it.name} — ăn ngon miệng nhé!`, 3500); }, false) || AV.earn(SHIP);
    });
  }

  /* ================= 🚕 GỌI XE ================= */
  const RIDES = [{ id: 'bike', icon: '🛵', name: 'Xe ôm', price: 30 }, { id: 'taxi', icon: '🚕', name: 'Taxi 4 chỗ', price: 80 }, { id: 'vip', icon: '🚙', name: 'Xe sang', price: 300 }];
  let rideKind = 'bike';
  function ride(box, back) {
    const zones = (DATA.ZONES || []).filter((z) => z.id !== 'sky' && z.id !== AV.currentMap());
    box.innerHTML = back('🚕 ZenoCar') + `<div class="ap-rides">${RIDES.map((r) => `<button class="ap-ride ${r.id === rideKind ? 'on' : ''}" data-k="${r.id}"><span>${r.icon}</span><b>${r.name}</b><small>${r.price} xu</small></button>`).join('')}</div>
      <div class="ap-note">Chọn nơi muốn đến:</div>
      <div class="ap-list">${zones.map((z) => `<button class="ap-item" data-z="${z.id}"><span>${z.icon}</span><span class="ap-nm">${esc(z.name)}</span><span class="ap-pr">Đặt xe</span></button>`).join('')}</div>`;
    box.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { rideKind = b.dataset.k; ride(box, back); });
    box.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => {
      const r = RIDES.find((x) => x.id === rideKind), z = zones.find((x) => x.id === b.dataset.z);
      if (!AV.spend(r.price)) return;
      PHONE.close();
      vehicle(r.icon, r.name, () => { AV.player.hidden = false; AV.teleport(z.id, false, undefined, undefined, `${r.icon} ${r.name} chở bạn tới ${z.name}…`); }, true) || AV.earn(r.price);
    });
  }

  /* ================= 📸 ZENOGRAM ================= */
  let gramBox = null, gramBack = null;
  async function gram(box, back) {
    gramBox = box; gramBack = back;
    box.innerHTML = back('📸 ZenoGram').replace('<span></span>', '<button class="ph-back" data-new>＋</button>') + '<div class="zg-feed"><p class="ph-empty">⏳ Đang tải bảng tin…</p></div>';
    box.querySelector('[data-new]').onclick = () => compose(box, back);
    if (!db()) { box.querySelector('.zg-feed').innerHTML = '<p class="ph-empty">🔐 Đăng nhập tài khoản để dùng ZenoGram</p>'; return; }
    const { data: posts, error } = await CLOUD.client.from('zeno_posts').select('id, user_id, name, text, img, created_at').order('id', { ascending: false }).limit(30);
    if (!box.isConnected) return;
    if (error) { box.querySelector('.zg-feed').innerHTML = `<p class="ph-empty">⚠️ ${missing(error) ? NOT_READY : esc(error.message)}</p>`; return; }
    const ids = (posts || []).map((p) => p.id);
    let likes = [], cmts = [];
    if (ids.length) {
      const [a, b] = await Promise.all([CLOUD.client.from('zeno_likes').select('post_id, user_id').in('post_id', ids), CLOUD.client.from('zeno_comments').select('id, post_id, name, text').in('post_id', ids).order('id', { ascending: true })]);
      likes = a.data || []; cmts = b.data || [];
    }
    if (!box.isConnected) return;
    const me = CLOUD.user.id;
    box.querySelector('.zg-feed').innerHTML = (posts || []).length ? posts.map((p) => {
      const L = likes.filter((l) => l.post_id === p.id), mine = L.some((l) => l.user_id === me), C = cmts.filter((c) => c.post_id === p.id);
      const img = p.img && typeof CHATIMG !== 'undefined' && CHATIMG.url(p.img);
      return `<div class="zg-post" data-id="${p.id}"><div class="zg-head"><span class="ph-av">${esc((p.name || '?')[0].toUpperCase())}</span><div><b>${esc(p.name)}</b><small>${ago(p.created_at)}</small></div>${p.user_id === me ? `<button class="zg-del" data-del="${p.id}">🗑️</button>` : ''}</div>
        ${p.text ? `<p class="zg-text">${esc(p.text)}</p>` : ''}${img ? `<img class="zg-img" src="${img}" loading="lazy" alt="ảnh">` : ''}
        <div class="zg-acts"><button data-like="${p.id}" class="${mine ? 'on' : ''}">${mine ? '❤️' : '🤍'} ${L.length || ''}</button><button data-cm="${p.id}">💬 ${C.length || ''}</button></div>
        ${C.slice(-3).map((c) => `<div class="zg-cm"><b>${esc(c.name)}</b> ${esc(c.text)}</div>`).join('')}
        <form class="zg-cf" data-cf="${p.id}" hidden><input maxlength="120" placeholder="Viết bình luận…"><button>Gửi</button></form></div>`;
    }).join('') : '<p class="ph-empty">Chưa có bài nào. Bấm ＋ để đăng bài đầu tiên!</p>';
    const feed = box.querySelector('.zg-feed');
    feed.querySelectorAll('.zg-img').forEach((im) => { im.onclick = () => CHATIMG.view(im.src); });
    feed.querySelectorAll('[data-like]').forEach((b) => b.onclick = async () => {
      const id = +b.dataset.like, on = b.classList.contains('on');
      if (on) await CLOUD.client.from('zeno_likes').delete().eq('post_id', id).eq('user_id', me);
      else { await CLOUD.client.from('zeno_likes').insert({ post_id: id, user_id: me }); if (typeof MUSIC !== 'undefined' && MUSIC.clack) MUSIC.clack(); }
      gram(box, back);
    });
    feed.querySelectorAll('[data-cm]').forEach((b) => b.onclick = () => { const f = feed.querySelector(`[data-cf="${b.dataset.cm}"]`); f.hidden = !f.hidden; if (!f.hidden) f.querySelector('input').focus(); });
    feed.querySelectorAll('[data-cf]').forEach((f) => f.onsubmit = async (e) => {
      e.preventDefault();
      const t = f.querySelector('input').value.trim(); if (!t) return;
      const { error: er } = await CLOUD.client.from('zeno_comments').insert({ post_id: +f.dataset.cf, user_id: me, name: S().name, text: t.slice(0, 120) });
      if (er) return UI.toast('⚠️ ' + er.message);
      gram(box, back);
    });
    feed.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => UI.confirm('Xoá bài đăng này?', 'Xoá', async () => { await CLOUD.client.from('zeno_posts').delete().eq('id', +b.dataset.del); gram(box, back); }));
  }
  function compose(box, back, preImg) {
    let img = preImg || '';
    const render = () => {
      box.innerHTML = back('Bài viết mới') + `<div class="zg-new"><textarea maxlength="200" placeholder="Bạn đang nghĩ gì?"></textarea>
        ${img ? `<img class="zg-img" src="${esc(img)}" alt="ảnh"><button class="ph-paste" data-rmimg>✕ Bỏ ảnh</button>` : ''}
        <div class="zg-row"><button class="ph-paste" data-pick>🖼️ Chọn ảnh</button><button class="ph-paste" data-shot>📷 Chụp màn hình game</button></div>
        <button class="ph-big" data-post>📤 Đăng</button></div>`;
      const ta = box.querySelector('textarea');
      ta.value = compose.text || ''; ta.oninput = () => { compose.text = ta.value; };
      const pick = box.querySelector('[data-pick]');
      if (typeof CHATIMG !== 'undefined') CHATIMG.attach(ta, pick, (u) => { img = u; render(); }, '🖼️ Ảnh cho ZenoGram');
      box.querySelector('[data-shot]').onclick = async () => {
        const cv = document.getElementById('game'); if (!cv) return;
        let url; try { url = cv.toDataURL('image/jpeg', 0.85); } catch (e) { return UI.toast('Không chụp được màn hình này'); }
        const blob = await (await fetch(url)).blob();
        CHATIMG.pickAndSend(new File([blob], 'chup.jpg', { type: 'image/jpeg' }), (u) => { img = u; PHONE.open(); setTimeout(() => PHONE.openApp('gram', img), 100); }, '📷 Ảnh cho ZenoGram');
      };
      const rm = box.querySelector('[data-rmimg]'); if (rm) rm.onclick = () => { img = ''; render(); };
      box.querySelector('[data-post]').onclick = async () => {
        const t = (compose.text || '').trim();
        if (!t && !img) return UI.toast('Viết gì đó hoặc chọn ảnh nhé');
        if (!db()) return UI.toast('🔐 Đăng nhập tài khoản để đăng bài');
        const { error } = await CLOUD.client.from('zeno_posts').insert({ user_id: CLOUD.user.id, name: S().name, text: t.slice(0, 200), img: img || null });
        if (error) return UI.toast('⚠️ ' + (missing(error) ? NOT_READY : error.message), 5000);
        compose.text = '';
        UI.toast('📸 Đã đăng lên ZenoGram!');
        if (NET.sendNews) NET.sendNews(`📸 ${S().name} vừa đăng bài mới trên ZenoGram`);
        AV.earn(0, 5);
        gram(box, back);
      };
    };
    render();
  }

  return { food, ride, gram, compose, vehicle };
})();
