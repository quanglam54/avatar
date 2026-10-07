/* 🎉 SỰ KIỆN LIÊN TỤC — mọi máy tính theo cùng giờ Việt Nam + hạt giống theo ngày nên cả server thấy giống nhau.
 *  ⏰ Giờ vàng 20h–21h: x2 XP, x2 nông sản, x2 quặng hầm mỏ (báo trước 5 phút)
 *  🛒 Thương lái: mỗi ngày ghé Quảng trường 3 lần (mỗi lần 1 tiếng) — bán đồ hiếm giá rẻ, thu mua 1 loại nông sản giá x3
 *  🎲 Bất ngờ (mỗi 10 phút có thể xảy ra): 🌠 mưa sao băng · 💰 túi tiền rơi ở Quảng trường · 🐉 rồng con đi lạc · 🌧️💰 mưa tiền
 *  📜 Rương nhiệm vụ ngày + chuỗi 7 ngày nhận quà lớn
 * "Ai nhanh tay người đó được" (túi tiền, rồng con) ghi vào bảng event_claims (supabase/11-xo-so-va-su-kien.sql). */
const EVENTS = (() => {
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => AV.S;
  const vn = () => new Date(Date.now() + 7 * 3600e3);
  const day = (t = Date.now()) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10);
  const hour = () => vn().getUTCHours();
  const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const seeded = (s) => { let a = hash(s); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const zoneName = (id) => ((DATA.ZONES || []).find((z) => z.id === id) || {}).name || id;
  const go = (id, label) => { if (AV.currentMap() !== id) AV.teleport(id, false, undefined, undefined, label); };
  let force = null; // thử nghiệm: EVENTS.force('meteor' | 'bag' | 'dragon' | 'goldrain' | 'golden' | 'merchant')

  /* ================= ⏰ GIỜ VÀNG ================= */
  const GOLD_H = 20;
  const golden = () => force === 'golden' || hour() === GOLD_H;
  /** hệ số nhân XP / nông sản / quặng */
  const mult = () => (golden() ? 2 : 1);

  /* ================= 🛒 THƯƠNG LÁI ================= */
  const MER_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22];
  function merchantHours(d = day()) {
    const r = seeded('MER|' + d), pool = MER_HOURS.slice(), out = [];
    while (out.length < 3) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    return out.sort((a, b) => a - b);
  }
  function visit() {
    if (force === 'merchant') return { i: 9, key: day() + '|t' };
    const i = merchantHours().indexOf(hour());
    return i < 0 ? null : { i, key: day() + '|' + i };
  }
  const merchantHere = () => !!visit();
  const SALE_POOL = [
    { id: 'seed_ginseng', n: 10, base: () => DATA.CROPS.ginseng.seed * 10 },
    { id: 'seed_pumpkin', n: 10, base: () => DATA.CROPS.pumpkin.seed * 10 },
    { id: 'seed_watermelon', n: 10, base: () => DATA.CROPS.watermelon.seed * 10 },
    { id: 'fertilizer', n: 30, base: () => DATA.FERT.price * 30 },
    { id: 'pesticide', n: 20, base: () => DATA.PEST.price * 20 },
    { id: 'mine_tonic', n: 5, base: () => 380 },
    { id: 'pet_med', n: 2, base: () => DATA.PETMED.price * 2 },
    { id: 'pet_food', n: 5, base: () => DATA.PETFOOD.price * 5 },
    { id: 'tool_shovel', n: 1, base: () => 80000, once: true },
    { id: 'tool_detector', n: 1, base: () => 200000, once: true },
  ];
  function offers(key) {
    const r = seeded('OFF|' + key), pool = SALE_POOL.filter((o) => DATA.ITEMS[o.id]), sale = [];
    while (sale.length < 3 && pool.length) {
      const o = pool.splice(Math.floor(r() * pool.length), 1)[0];
      sale.push({ ...o, price: Math.max(1, Math.round(o.base() * (0.4 + r() * 0.2))) });
    }
    const crops = Object.keys(DATA.CROPS);
    const crop = crops[Math.floor(r() * crops.length)];
    return { sale, crop, quota: 50, price: DATA.CROPS[crop].sell * 3 };
  }
  function merState(v) {
    if (!S().merchant || S().merchant.key !== v.key) S().merchant = { key: v.key, bought: {}, sold: 0 };
    return S().merchant;
  }
  function merchantPanel() {
    const v = visit();
    if (!v) {
      const hs = merchantHours();
      return UI.panel('🛒 Thương lái', `<p>Thương lái hôm nay ghé <b>⛲ Quảng trường</b> lúc <b>${hs.map((h) => h + 'h').join(' · ')}</b> (mỗi lần 1 tiếng).</p><p class="muted">Bán đồ hiếm giá rẻ và thu mua nông sản giá gấp 3!</p>`);
    }
    const p = UI.panel('🛒 Thương lái phương xa', '', { wide: true });
    const render = () => {
      const o = offers(v.key), st = merState(v), c = DATA.CROPS[o.crop], have = S().inv[o.crop] || 0, room = o.quota - st.sold;
      const leftMin = 59 - vn().getUTCMinutes();
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu · ⏳ Thương lái đi sau <b>${leftMin} phút</b></div>
        <h4 class="ev-h">🔥 Đồ hiếm giảm giá (mỗi món mua 1 lần)</h4>
        <div class="shop-list">${o.sale.map((s, k) => {
          const it = DATA.ITEMS[s.id], owned = s.once && S().inv[s.id], done = st.bought[k];
          return `<div class="shop-row"><span class="ic">${it.icon}${it.sub || ''}</span><div class="info"><b>${s.n > 1 ? s.n + ' ' : ''}${it.name}</b><small><s>${fmt(s.base())} xu</s> → giảm ${Math.round((1 - s.price / s.base()) * 100)}%</small></div>${done || owned ? '<button class="btn small ghost" disabled>✅ Đã có</button>' : `<button class="btn small" data-buy="${k}">${fmt(s.price)} xu</button>`}</div>`;
        }).join('')}</div>
        <h4 class="ev-h">📦 Đang cần thu mua</h4>
        <div class="shop-row quest ${have && room > 0 ? 'ready' : ''}"><span class="ic">${c.icon}</span><div class="info"><b>Cần ${o.quota} ${c.name} — trả ${fmt(o.price)} xu/cái (gấp 3!)</b>
          <div class="qbar"><i style="width:${Math.min(100, st.sold / o.quota * 100)}%"></i></div><small>Đã bán ${st.sold}/${o.quota} · trong túi có ${have}</small></div>
          <button class="btn small" data-sell ${have && room > 0 ? '' : 'disabled'}>Bán ${Math.min(have, room)}</button></div>`;
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => {
        const s = o.sale[+b.dataset.buy];
        if (!AV.spend(s.price)) return;
        st.bought[b.dataset.buy] = 1;
        AV.addItem(s.id, s.n);
        UI.toast(`🛒 Mua được ${s.n} ${DATA.ITEMS[s.id].icon} ${DATA.ITEMS[s.id].name} giá hời!`);
        render();
      });
      const sb = p.body.querySelector('[data-sell]');
      if (sb) sb.onclick = () => {
        const n = Math.min(S().inv[o.crop] || 0, o.quota - st.sold);
        if (n <= 0) return;
        S().inv[o.crop] -= n; st.sold += n;
        AV.earn(n * o.price, Math.ceil(n / 5));
        UI.toast(`📦 Bán ${n} ${c.icon} cho thương lái: +${fmt(n * o.price)} xu`);
        render();
      };
    };
    render();
  }
  /** xe hàng của thương lái (vẽ ở Quảng trường khi đang ghé) */
  function cart(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 4, 92, 12, 0, 0, Math.PI * 2); c.fill();
    [-58, 58].forEach((dx) => {
      c.fillStyle = '#5c3a1e'; c.beginPath(); c.arc(x + dx, y - 14, 16, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#c98a4b'; c.beginPath(); c.arc(x + dx, y - 14, 6, 0, Math.PI * 2); c.fill();
    });
    c.fillStyle = '#a0522d'; c.fillRect(x - 84, y - 52, 168, 32);
    c.fillStyle = '#8a4b22'; for (let k = 0; k < 6; k++) c.fillRect(x - 84 + k * 28, y - 52, 3, 32);
    c.font = '20px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('🎃🍉🍍🧪💊🪏', x, y - 60);
    c.fillStyle = '#6b4423'; c.fillRect(x - 80, y - 130, 5, 80); c.fillRect(x + 75, y - 130, 5, 80);
    const cols = ['#7048e8', '#ffd43b'];
    for (let k = 0; k < 8; k++) { c.fillStyle = cols[k % 2]; c.beginPath(); c.moveTo(x - 92 + k * 23, y - 128); c.lineTo(x - 69 + k * 23, y - 128); c.lineTo(x - 69 + k * 23, y - 112); c.quadraticCurveTo(x - 80.5 + k * 23, y - 104, x - 92 + k * 23, y - 112); c.closePath(); c.fill(); }
    c.fillStyle = '#5f3dc4'; c.beginPath(); c.roundRect(x - 92, y - 146, 184, 20, 6); c.fill();
    c.fillStyle = '#fff'; c.font = '900 12px "Be Vietnam Pro", system-ui'; c.fillText('🛒 THƯƠNG LÁI PHƯƠNG XA', x, y - 136);
  }

  /* ================= 🎲 SỰ KIỆN BẤT NGỜ ================= */
  const SLOT = 600000, DRAGON_MAPS = ['town', 'park', 'beach', 'fun', 'cherry'];
  const LEN = { meteor: 3 * 60000, bag: 4 * 60000, dragon: 5 * 60000 };
  function surprise(t = Date.now()) {
    const slot = Math.floor(t / SLOT);
    let kind = null;
    if (force && LEN[force]) kind = force;
    else {
      const h = hash('SUR|' + slot) % 1000;
      kind = h < 60 ? 'meteor' : h < 100 ? 'bag' : h < 130 ? 'dragon' : null;
    }
    if (!kind) return null;
    const into = t - slot * SLOT;
    if (!force && into > LEN[kind]) return null;
    const r = seeded('SURD|' + slot);
    const ev = { kind, slot, key: `${kind}|${day()}|${slot}`, until: slot * SLOT + LEN[kind] };
    if (kind === 'bag') { ev.map = 'town'; ev.x = Math.round(260 + r() * 1480); ev.y = Math.round(720 + r() * 70); ev.amt = Math.round(10 + r() * 90) * 10000; }
    if (kind === 'dragon') ev.map = DRAGON_MAPS[Math.floor(r() * DRAGON_MAPS.length)];
    return ev;
  }
  /** mưa tiền: 10% số cơn mưa, 1 phút sau khi mưa nặng hạt */
  const RAIN_SLOT = 15 * 60000;
  function goldRain() {
    if (force === 'goldrain') return true;
    const t = Date.now(), rs = Math.floor(t / RAIN_SLOT), into = t - rs * RAIN_SLOT;
    return hash('GOLD|' + rs) % 10 === 0 && into > 75000 && into < 135000 && AV.rainLevel() > 0.2;
  }

  /* ---------- nhận quà "ai nhanh tay" ---------- */
  const claimed = {}; // key → tên người đã nhận
  async function checkClaim(key) {
    if (!CLOUD.user || !CLOUD.client) return;
    try {
      const { data } = await CLOUD.client.from('event_claims').select('name').eq('key', key).maybeSingle();
      if (data) claimed[key] = data.name || 'Ai đó';
    } catch (e) { /* bỏ qua */ }
  }
  async function grab(key) {
    if (!CLOUD.user || !CLOUD.client) { UI.toast('🔐 Đăng nhập tài khoản mới nhận được quà sự kiện'); return false; }
    const { error } = await CLOUD.client.from('event_claims').insert({ key, user_id: CLOUD.user.id, name: S().name });
    if (!error) { claimed[key] = S().name; return true; }
    if (/duplicate key|unique/i.test(error.message || '')) { await checkClaim(key); UI.toast(`😭 Chậm chân rồi! ${esc(claimed[key] || 'Có người')} nhanh tay hơn`); return false; }
    claimed[key] = claimed[key] || '—';
    UI.toast('⚠️ ' + (/event_claims|does not exist|Could not find/i.test(error.message || '') ? 'Chủ game chưa bật sự kiện (chạy file supabase/11-xo-so-va-su-kien.sql)' : error.message), 5000);
    return false;
  }

  /* ---------- đồ rơi trên bản đồ ---------- */
  const evPicks = () => AV.pickups().filter((p) => p.ev);
  function spotNear(px, py, rMin, rMax) {
    for (let k = 0; k < 20; k++) {
      const a = Math.random() * Math.PI * 2, d = rMin + Math.random() * (rMax - rMin);
      const x = px + Math.cos(a) * d, y = py + Math.sin(a) * d * 0.6;
      if (!AV.blocked(x, y)) return { x, y };
    }
    return null;
  }
  let dragonHits = {}, grabbing = false;
  function onShard(p) {
    AV.addItem('star_shard', 1);
    AV.floatText('+1 💫', p.x, p.y - 40, '#ffe066');
  }
  function onCoin(p) {
    const n = (2 + Math.floor(Math.random() * 18)) * 100;
    AV.earn(n);
  }
  async function onBag(p, ev) {
    if (grabbing) { AV.dropPickup(p.x, p.y, '💰', p.on, { ev: ev.key, big: 1 }); return; }
    grabbing = true;
    try {
      if (await grab(ev.key)) {
        AV.earn(ev.amt, 20);
        AV.sayMine('💰 Của rơi của rơi!');
        const msg = `💰 ${S().name} vừa nhặt được TÚI TIỀN ${fmt(ev.amt)} xu ở Quảng trường!`;
        NET.sendNews(msg); UI.chatLog('', msg, true, true);
        UI.toast(`🎉 Bạn nhanh tay nhất! +${fmt(ev.amt)} xu`, 5000);
      }
    } finally { grabbing = false; }
  }
  async function onDragon(p, ev) {
    const n = (dragonHits[ev.key] = (dragonHits[ev.key] || 0) + 1);
    if (n < 10) {
      AV.floatText(`🐉 ${n}/10`, p.x, p.y - 50, '#69db7c');
      AV.sayMine(['Bắt được rồi… ơ nó chạy!', 'Rồng ơi đứng lại!', 'Ngoan nào~'][n % 3]);
      const s = spotNear(p.x, p.y, 110, 220) || p;
      AV.dropPickup(s.x, s.y, '🐉', p.on, { ev: ev.key, big: 1 });
      return;
    }
    if (claimed[ev.key] || grabbing) return;
    grabbing = true;
    try {
      if (await grab(ev.key)) {
        if (!S().owned.pets.includes('babydragon')) S().owned.pets.push('babydragon');
        AV.wearPet('babydragon');
        const msg = `🐉 ${S().name} đã thuần phục được RỒNG CON đi lạc ở ${zoneName(ev.map)}!`;
        NET.sendNews(msg); UI.chatLog('', msg, true, true);
        UI.panel('🐉 RỒNG CON!', `<div class="tr-chest">🥚➡️🐉</div><p class="confirm-text">Rồng con đã chịu theo bạn về nhà!<br>Thú cưng <b>Rồng con</b> đã vào tủ đồ và đang đi theo bạn.</p>`);
      }
    } finally { grabbing = false; }
  }

  /* ---------- hiệu ứng màn hình (DOM, nhẹ) ---------- */
  let sky = null, coins = null;
  function overlay(kind, on) {
    if (kind === 'meteor') {
      if (on && !sky) { sky = document.createElement('div'); sky.className = 'ev-sky'; sky.innerHTML = Array.from({ length: 7 }, (_, k) => `<i style="left:${10 + k * 13}%;animation-delay:${(k * 0.7) % 3.4}s"></i>`).join(''); document.body.appendChild(sky); }
      if (!on && sky) { sky.remove(); sky = null; }
    } else {
      if (on && !coins) { coins = document.createElement('div'); coins.className = 'ev-coins'; coins.innerHTML = Array.from({ length: 18 }, (_, k) => `<i style="left:${(k * 5.7) % 100}%;animation-delay:${(k * 0.37) % 2.2}s;animation-duration:${1.8 + (k % 4) * 0.35}s">🪙</i>`).join(''); document.body.appendChild(coins); }
      if (!on && coins) { coins.remove(); coins = null; }
    }
  }

  /* ---------- dải chip trạng thái trên màn hình ---------- */
  let chips = null;
  function renderChips(list) {
    if (!chips) { chips = document.createElement('div'); chips.className = 'ev-chips'; document.body.appendChild(chips); chips.onclick = (e) => { const b = e.target.closest('[data-ev]'); if (b) chipClick(b.dataset.ev); }; }
    const html = list.map(([k, t, cls]) => `<button class="ev-chip ${cls || ''}" data-ev="${k}">${t}</button>`).join('');
    if (chips.innerHTML !== html) chips.innerHTML = html;
  }
  function chipClick(k) {
    const ev = surprise();
    if (k === 'golden') return UI.toast('⏰ GIỜ VÀNG 20h–21h: x2 XP, x2 nông sản khi thu hoạch, x2 quặng ở hầm mỏ!', 4500);
    if (k === 'merchant') return AV.currentMap() === 'town' ? merchantPanel() : go('town', '🛒 Đến Quảng trường gặp thương lái…');
    if (k === 'meteor') return UI.toast('🌠 Mưa sao băng! Ra ngoài trời nhặt 💫 Mảnh Sao Băng rơi quanh bạn', 4000);
    if (k === 'goldrain') return UI.toast('🌧️💰 MƯA TIỀN! Chạy ra ngoài trời nhặt 🪙 xu rơi quanh bạn', 4000);
    if (ev && (k === 'bag' || k === 'dragon')) go(ev.map, k === 'bag' ? '💰 Chạy ra Quảng trường nhặt túi tiền…' : `🐉 Đến ${zoneName(ev.map)} tìm rồng con…`);
  }
  const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  /* ---------- vòng lặp mỗi giây ---------- */
  const seen = {};
  const once = (k, fn) => { if (!seen[k]) { seen[k] = 1; fn(); } };
  let lastSpawn = 0;
  function tick() {
    if (!AV.S || !AV.currentMap) return;
    const now = Date.now(), d = day(), m = vn().getUTCMinutes(), h = hour(), mapId = AV.currentMap(), outdoor = !AV.mapIndoor();
    const list = [];
    // ⏰ giờ vàng
    if (h === GOLD_H - 1 && m >= 55) once('g5|' + d, () => UI.toast('⏰ 5 phút nữa bắt đầu GIỜ VÀNG (20h–21h): x2 XP, x2 nông sản, x2 quặng!', 6000));
    if (golden()) {
      once('g|' + d, () => { UI.toast('🌟 GIỜ VÀNG BẮT ĐẦU! x2 XP · x2 nông sản · x2 quặng đến 21h', 6000); UI.chatLog('', '🌟 GIỜ VÀNG bắt đầu: x2 XP, x2 nông sản, x2 quặng đến 21h!', false, true); });
      list.push(['golden', `⏰ GIỜ VÀNG x2 · ${mmss((60 - m) * 60000 - vn().getUTCSeconds() * 1000)}`, 'gold']);
    }
    if (h === GOLD_H + 1 && m === 0) once('ge|' + d, () => UI.toast('⏰ Giờ vàng đã kết thúc — hẹn 20h mai!', 4000));
    // 🛒 thương lái
    merchantHours().forEach((mh) => { if (h === mh - 1 && m >= 55) once('m5|' + d + mh, () => UI.toast(`🛒 5 phút nữa thương lái tới ⛲ Quảng trường — bán đồ hiếm giá rẻ, mua nông sản giá x3!`, 5000)); });
    const v = visit();
    if (v) {
      once('m|' + v.key, () => { const o = offers(v.key); UI.toast(`🛒 Thương lái đã tới ⛲ Quảng trường (1 tiếng)! Hôm nay cần mua ${o.quota} ${DATA.CROPS[o.crop].icon} giá gấp 3`, 6000); });
      list.push(['merchant', `🛒 Thương lái · ${59 - m} phút`, 'mer']);
    }
    // 🎲 bất ngờ
    const ev = surprise(now);
    if (ev) {
      const left = mmss(ev.until - now);
      if (ev.kind === 'meteor') {
        once('s|' + ev.key, () => UI.toast('🌠 MƯA SAO BĂNG! Ra ngoài trời nhặt 💫 Mảnh Sao Băng (bán 300 xu/mảnh)', 6000));
        list.push(['meteor', `🌠 Mưa sao băng · ${left}`, 'met']);
        if (outdoor && now - lastSpawn > 5000 && evPicks().length < 4) { lastSpawn = now; const s = spotNear(AV.player.x, AV.player.y, 90, 320); if (s) AV.dropPickup(s.x, s.y, '💫', onShard, { ev: ev.key }); }
      } else if (ev.kind === 'bag') {
        if (!claimed[ev.key]) {
          once('s|' + ev.key, () => UI.toast(`💰 Có TÚI TIỀN ${fmt(ev.amt)} xu rơi ở ⛲ Quảng trường! Ai nhanh tay người đó được!`, 6000));
          list.push(['bag', `💰 Túi tiền ở Quảng trường · ${left}`, 'bag']);
        }
        if (mapId === 'town') {
          if (now % 10000 < 1000) checkClaim(ev.key);
          if (!claimed[ev.key] && !grabbing && !evPicks().some((p) => p.ev === ev.key)) AV.dropPickup(ev.x, ev.y, '💰', (p) => onBag(p, ev), { ev: ev.key, big: 1 });
        }
      } else if (ev.kind === 'dragon') {
        if (!claimed[ev.key]) {
          once('s|' + ev.key, () => UI.toast(`🐉 Có RỒNG CON đi lạc ở ${zoneName(ev.map)}! Đuổi bắt đủ 10 lần sẽ nuôi được — nhanh lên!`, 6000));
          list.push(['dragon', `🐉 Rồng con ở ${zoneName(ev.map)} · ${left}`, 'drg']);
        }
        if (mapId === ev.map) {
          if (now % 10000 < 1000) checkClaim(ev.key);
          if (!claimed[ev.key] && !grabbing && !evPicks().some((p) => p.ev === ev.key)) { const s = spotNear(AV.player.x, AV.player.y, 200, 420); if (s) AV.dropPickup(s.x, s.y, '🐉', (p) => onDragon(p, ev), { ev: ev.key, big: 1 }); }
        }
      }
    }
    // 🌧️💰 mưa tiền
    const gr = goldRain();
    if (gr) {
      once('gr|' + Math.floor(now / RAIN_SLOT), () => UI.toast('🌧️💰 MƯA TIỀN! Xu đang rơi — chạy ra ngoài trời nhặt nhanh (1 phút)!', 6000));
      list.push(['goldrain', '🌧️💰 Mưa tiền!', 'gold']);
      if (outdoor && now - lastSpawn > 1400 && evPicks().length < 6) { lastSpawn = now; const s = spotNear(AV.player.x, AV.player.y, 60, 260); if (s) AV.dropPickup(s.x, s.y, '🪙', onCoin, { ev: 'goldrain' }); }
    }
    // dọn đồ rơi của sự kiện đã hết / đã có người nhận
    const live = new Set([ev && !claimed[ev.key] && ev.key, gr && 'goldrain'].filter(Boolean));
    AV.removePickups((p) => p.ev && !live.has(p.ev));
    overlay('meteor', !!(ev && ev.kind === 'meteor' && outdoor));
    overlay('coins', gr && outdoor);
    renderChips(list);
  }

  /* ================= 📜 RƯƠNG NHIỆM VỤ + CHUỖI 7 NGÀY ================= */
  function streak() {
    const q = S().qstreak || (S().qstreak = { n: 0, last: '', opened: '' });
    const yest = day(Date.now() - 86400e3);
    return { ...q, shown: q.last === day() || q.last === yest ? q.n : 0 };
  }
  function questChestHtml() {
    const st = streak(), all = AV.quests().every((q) => q.claimed), opened = st.opened === day();
    const dots = Array.from({ length: 7 }, (_, k) => `<i class="${k < st.shown ? 'on' : ''}">${k === 6 ? '🎁' : k + 1}</i>`).join('');
    return `<div class="ev-streak"><div class="ev-dots">${dots}</div>
      <p class="muted">Nhận hết thưởng nhiệm vụ trong ngày → mở 🧰 <b>Rương nhiệm vụ</b>. Mở <b>7 ngày liên tiếp</b> được quà lớn: 50.000 xu + 💎 + 3 💫!</p>
      <button class="btn ${opened ? 'ghost' : ''}" data-qchest ${all && !opened ? '' : 'disabled'}>${opened ? '✅ Hôm nay đã mở rương' : all ? '🧰 Mở rương nhiệm vụ' : '🔒 Hoàn thành hết nhiệm vụ để mở rương'}</button></div>`;
  }
  function openQuestChest() {
    const st = streak(), q = S().qstreak;
    if (q.opened === day() || !AV.quests().every((x) => x.claimed)) return;
    q.n = st.shown + 1; q.last = day(); q.opened = day();
    const ITEMS = [['fertilizer', 5], ['pesticide', 3], ['mine_tonic', 2], ['star_shard', 1], ['pet_food', 2]];
    const coinsGot = (10 + Math.floor(Math.random() * 21)) * 100;
    const [it, n] = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    AV.earn(coinsGot, 20); AV.addItem(it, n);
    let extra = '';
    if (q.n >= 7) {
      AV.earn(50000, 100); AV.addItem('gem_diamond', 1); AV.addItem('star_shard', 3);
      extra = '<h2>🎁 QUÀ CHUỖI 7 NGÀY!</h2><p>+50.000 xu · +1 💎 Kim cương · +3 💫 Mảnh Sao Băng</p>';
      q.n = 0;
    }
    UI.panel('🧰 Rương nhiệm vụ', `<div class="tr-pop"><div class="tr-chest">🧰✨</div><p>+${fmt(coinsGot)} xu · +${n} ${DATA.ITEMS[it].icon} ${DATA.ITEMS[it].name}</p>${extra}
      <p class="muted">Chuỗi hiện tại: <b>${q.n || 7}/7</b> ngày</p></div>`);
  }

  function init() { setInterval(tick, 1000); }
  return {
    init, golden, mult, merchantHere, merchantHours, merchantPanel, cart, surprise, goldRain, questChestHtml, openQuestChest,
    force: (k) => { force = k || null; },
  };
})();
