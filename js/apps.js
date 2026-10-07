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

  /* ================= 🚗 xe có tài xế chạy tới chỗ người chơi (dùng chung cho shipper & gọi xe) ================= */
  const DRIVER = {
    bike: { skin: '#f1c27d', hair: 'short', hairColor: '#2b2b33', shirt: '#00b14f', shirtStyle: 'plain', pants: '#343a40', hat: 'cap', acc: 'none', pet: 'none', npc: true },
    food: { skin: '#e3a979', hair: 'short', hairColor: '#1a1a1a', shirt: '#ff6b00', shirtStyle: 'plain', pants: '#212529', hat: 'cap', acc: 'none', pet: 'none', npc: true },
    car: { skin: '#f8c9a2', hair: 'short', hairColor: '#2b2b33', shirt: '#0fb9b1', shirtStyle: 'plain', pants: '#212529', hat: 'none', acc: 'sunglasses', pet: 'none', npc: true },
  };
  const wheel = (g, x, y, r) => { g.fillStyle = '#1f1f24'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = '#adb5bd'; g.beginPath(); g.arc(x, y, r * 0.55, 0, 7); g.fill(); g.fillStyle = '#495057'; g.beginPath(); g.arc(x, y, r * 0.2, 0, 7); g.fill(); };
  const person = (g, x, y, look, sc) => { try { ART.character(g, x, y, look, { scale: sc, dir: 1 }); } catch (e) { /* bỏ qua */ } };
  /** 🛵 xe máy: tài xế lái, (passenger) ngồi sau, (box) thùng giao đồ ăn */
  function drawBike(g, t, opt) {
    const bob = Math.sin(t * 22) * (opt.moving ? 1.2 : 0);
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0, 2, 70, 9, 0, 0, 7); g.fill();
    g.save(); g.translate(0, bob);
    wheel(g, -44, -18, 19);
    if (opt.box) {
      g.fillStyle = '#ff6b00'; g.beginPath(); g.roundRect(-80, -104, 50, 46, 6); g.fill(); g.strokeStyle = '#a63c00'; g.lineWidth = 2.5; g.stroke();
      g.fillStyle = '#fff'; g.font = '900 11px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ZENO', -55, -88); g.fillText('FOOD', -55, -74);
    }
    if (opt.passenger) person(g, -30, -24, opt.passenger, 0.82);
    person(g, 4, -26, opt.driver, 0.85);
    // thân xe phủ chân người
    g.fillStyle = opt.color || '#e03131';
    g.beginPath(); g.moveTo(-62, -40); g.quadraticCurveTo(-60, -60, -30, -58); g.lineTo(26, -58); g.quadraticCurveTo(46, -58, 50, -40); g.lineTo(40, -28); g.lineTo(-52, -28); g.closePath(); g.fill();
    g.fillStyle = '#212529'; g.beginPath(); g.roundRect(-48, -66, 64, 10, 5); g.fill();
    g.strokeStyle = '#495057'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(40, -46); g.lineTo(52, -18); g.stroke();
    g.strokeStyle = '#212529'; g.lineWidth = 4; g.beginPath(); g.moveTo(34, -82); g.lineTo(42, -50); g.stroke();
    g.beginPath(); g.moveTo(26, -84); g.lineTo(42, -84); g.stroke();
    g.fillStyle = '#fff3bf'; g.beginPath(); g.arc(50, -52, 6, 0, 7); g.fill();
    g.fillStyle = '#868e96'; g.fillRect(-62, -34, 26, 6);
    wheel(g, 52, -18, 19);
    g.restore();
  }
  /** 🚕 ô tô: tài xế ghế trước, khách ghế sau, nhìn qua cửa kính */
  function drawCar(g, t, opt) {
    const bob = Math.sin(t * 18) * (opt.moving ? 1 : 0), col = opt.color || '#0fb9b1';
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 2, 128, 12, 0, 0, 7); g.fill();
    g.save(); g.translate(0, bob);
    if (opt.passenger) person(g, -34, -30, opt.passenger, 0.72);
    person(g, 34, -30, opt.driver, 0.72);
    // khung cabin + kính
    g.fillStyle = 'rgba(190,230,255,.35)'; g.beginPath(); g.moveTo(-70, -78); g.lineTo(-52, -122); g.lineTo(58, -122); g.lineTo(86, -78); g.closePath(); g.fill();
    g.strokeStyle = col; g.lineWidth = 9; g.lineJoin = 'round'; g.stroke();
    g.beginPath(); g.moveTo(2, -122); g.lineTo(2, -78); g.stroke();
    // thân dưới (che chân)
    g.fillStyle = col; g.beginPath(); g.roundRect(-120, -80, 240, 54, 16); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-112, -74, 224, 6);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(2, -78); g.lineTo(2, -32); g.stroke();
    g.fillStyle = '#fff3bf'; g.beginPath(); g.roundRect(108, -66, 12, 12, 3); g.fill();
    g.fillStyle = '#ff6b6b'; g.beginPath(); g.roundRect(-120, -66, 10, 12, 3); g.fill();
    if (opt.sign) { g.fillStyle = '#fff'; g.beginPath(); g.roundRect(-30, -142, 60, 18, 5); g.fill(); g.fillStyle = col; g.font = '900 11px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(opt.sign, 0, -133); }
    wheel(g, -72, -24, 22); wheel(g, 72, -24, 22);
    g.restore();
  }
  let busy = false;
  /** kind: 'food' | 'bike' | 'taxi' | 'vip'. onArrive() khi giao / đón xong. pickUp = chở người */
  function vehicle(kind, label, onArrive, pickUp) {
    if (busy) { UI.toast('🛵 Đang có xe trên đường tới rồi, đợi chút nhé'); return false; }
    busy = true;
    const P = AV.player;
    if (AV.mapIndoor()) {
      UI.toast(`${label} đang tới cửa…`, 3500);
      setTimeout(() => { busy = false; onArrive(); }, 4500);
      return true;
    }
    const car = kind === 'taxi' || kind === 'vip', K = car ? 1.25 : 1.45;
    const opt = { driver: car ? DRIVER.car : kind === 'food' ? DRIVER.food : DRIVER.bike, box: kind === 'food', color: kind === 'food' ? '#ff6b00' : kind === 'bike' ? '#00b14f' : kind === 'vip' ? '#212529' : '#0fb9b1', sign: kind === 'taxi' ? 'TAXI' : kind === 'vip' ? 'VIP' : '', moving: true, passenger: null };
    const fx = { x: P.x - 1000, y: P.y + 26, w: 220, ph: 'come', t: 0 };
    fx.draw = (g, t) => {
      g.save(); g.translate(fx.x, fx.y); g.scale(K, K);
      (car ? drawCar : drawBike)(g, t, opt);
      g.restore();
      if (fx.ph === 'stop') { const m = pickUp ? 'Lên xe đi bạn ơi!' : 'Đồ ăn tới rồi nè!'; g.font = '800 15px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = '#2b1a10'; g.lineWidth = 4; g.strokeText(m, fx.x, fx.y - 170 * K); g.fillText(m, fx.x, fx.y - 170 * K); }
    };
    AV.worldFx.push(fx);
    UI.toast(`${label} đang chạy tới chỗ bạn!`, 3500);
    let last = performance.now();
    const end = () => { const i = AV.worldFx.indexOf(fx); if (i >= 0) AV.worldFx.splice(i, 1); busy = false; };
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      fx.t += dt;
      if (fx.ph === 'come') {
        const tx = P.x - (car ? 40 : 70);
        fx.x += Math.min(460 * dt, tx - fx.x); fx.y += (P.y + 26 - fx.y) * Math.min(1, dt * 3);
        if (tx - fx.x < 2) { fx.ph = 'stop'; fx.t = 0; opt.moving = false; if (typeof MUSIC !== 'undefined' && MUSIC.clack) MUSIC.clack(); }
      } else if (fx.ph === 'stop') {
        if (fx.t > 1.3) {
          if (pickUp) { P.hidden = true; opt.passenger = AV.S.look; } else onArrive();
          fx.ph = 'go'; fx.t = 0; opt.moving = true;
        }
      } else {
        fx.x += Math.min(520, 60 + fx.t * 420) * dt;
        if (pickUp) { P.x = fx.x; P.target = null; }
        if (fx.t > (pickUp ? 1.8 : 3)) { end(); if (pickUp) onArrive(); return; }
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
      vehicle('food', `🛵 Shipper ${shop.name}`, () => { AV.eat(sid, iid); UI.toast(`🛵 Đã nhận ${it.icon} ${it.name} — ăn ngon miệng nhé!`, 3500); }, false) || AV.earn(SHIP);
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
      const goRide = () => {
        // chạy trên đường phố Hà Nội thật (chế độ taxi tự lái); khu chưa nối đường thì đưa thẳng tới nơi
        if (typeof RIDE !== 'undefined' && RIDE.canRide(AV.currentMap(), z.id) && AV.startRide && AV.startRide(z.id, 'taxi')) return;
        AV.player.hidden = false; AV.teleport(z.id, false, undefined, undefined, `${r.icon} ${r.name} chở bạn tới ${z.name}…`);
      };
      vehicle(r.id === 'bike' ? 'bike' : r.id, `${r.icon} ${r.name}`, goRide, true) || AV.earn(r.price);
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
