/* 🏴‍☠️ Sự kiện Halloween: SĂN RƯƠNG BÃI BIỂN — mỗi ngày cả server có 3 rương chôn ở bãi biển, ai đào trước người đó được.
 * Vị trí rương sinh theo ngày (mọi máy giống nhau). Nhận rương ghi vào bảng treasure_claims (supabase/10-san-kho-bau.sql),
 * khoá chính (ngày, số rương) → không 2 người cùng nhận. Gom 10 💠 Ngọc Halloween đổi 1.000.000 xu ở Thuyền trưởng Râu Đỏ.
 * Cần 🪏 xẻng để đào; 📡 máy dò kêu bíp nhanh dần khi lại gần rương. */
const TREASURE = (() => {
  const SLOTS = 3, NEED = 10, REWARD = 10000000, SHOVEL = 80000, DETECTOR = 200000, DIG_R = 60;
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => AV.S;
  /** ngày theo giờ Việt Nam (khớp với kiểm tra trên máy chủ) */
  const day = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);
  let claims = {}, claimsDay = '', lastFetch = 0, digging = false;

  /* ---------- vị trí rương trong ngày ---------- */
  const AVOID = [[220, 640], [1780, 600], [1500, 820], [520, 820], [650, 650], [1000, 610], [1340, 690], [300, 820], [1640, 600]];
  function spots(d = day()) {
    let h = 2166136261; for (const ch of 'TRE|' + d) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    let a = h >>> 0;
    const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const out = [];
    for (let tries = 0; out.length < SLOTS && tries < 500; tries++) {
      const x = 180 + rnd() * 1640, y = 575 + rnd() * 240;
      if (AVOID.some(([ax, ay]) => Math.hypot(ax - x, ay - y) < 90)) continue;
      if (out.some((p) => Math.hypot(p.x - x, p.y - y) < 300)) continue;
      out.push({ x: Math.round(x), y: Math.round(y), slot: out.length });
    }
    return out;
  }
  /** rương đã bị đào HÔM NAY (dữ liệu ngày cũ không tính) — máy dò, nút đào, bảng thông báo đều dùng chung */
  const today = () => (claimsDay === day() ? claims : {});
  const left = () => SLOTS - spots().filter((s) => today()[s.slot]).length;

  /* ---------- máy chủ ---------- */
  async function refresh(force) {
    if (!CLOUD.user || !CLOUD.client) return;
    if (!force && claimsDay === day() && Date.now() - lastFetch < 20000) return;
    if (!force && Date.now() - lastFetch < 3000) return;
    lastFetch = Date.now();
    const d = day();
    try {
      const { data, error } = await CLOUD.client.from('treasure_claims').select('slot, name').eq('day', d);
      if (error) return;
      claims = {}; claimsDay = d;
      (data || []).forEach((r) => { claims[r.slot] = r.name || 'Ai đó'; });
      updateBanner();
    } catch (e) { /* thử lại sau */ }
  }
  async function claim(slot) {
    const { error } = await CLOUD.client.from('treasure_claims').insert({ day: day(), slot, user_id: CLOUD.user.id, name: S().name });
    if (!error) return true;
    const m = String(error.message || '');
    if (/duplicate key|unique/i.test(m)) return false;
    if (/treasure_claims|does not exist|Could not find/i.test(m)) throw new Error('Chủ game chưa bật sự kiện săn rương (chạy file supabase/10-san-kho-bau.sql)');
    throw new Error(m);
  }

  /* ---------- đào ---------- */
  function dig() {
    if (digging) return;
    if (AV.currentMap() !== 'beach') return;
    if (!S().inv.tool_shovel) return UI.toast('🪏 Cần xẻng để đào — mua ở Thuyền trưởng Râu Đỏ', 3500);
    if (!CLOUD.user) return UI.toast('🔐 Đăng nhập tài khoản mới đào rương được');
    if (!AV.useEnergy(3)) return;
    digging = true;
    const p = AV.player;
    AV.sayMine('🪏 Đào đào…');
    setTimeout(async () => {
      try {
        await refresh(true);
        const target = spots().find((s) => !today()[s.slot] && Math.hypot(s.x - p.x, s.y - p.y) < DIG_R);
        if (!target) {
          const near = spots().find((s) => Math.hypot(s.x - p.x, s.y - p.y) < DIG_R);
          if (near && today()[near.slot]) { UI.toast(`🕳️ Chỗ này ${esc(today()[near.slot])} đào mất rồi!`); return; }
          if (Math.random() < 0.18) { AV.addItem('shell', 1); UI.toast('🐚 Chỉ đào được vỏ sò thôi…'); } else UI.toast('Chỉ có cát… thử chỗ khác xem 🏝️');
          return;
        }
        const ok = await claim(target.slot);
        if (!ok) { UI.toast('😭 Chậm chân rồi! Có người vừa đào mất rương này'); await refresh(true); return; }
        claims[target.slot] = S().name; claimsDay = day();
        AV.addItem('hw_gem', 1);
        const rem = left();
        showChest();
        AV.sayMine('🎉 Kho báu!!!');
        const msg = `🏴‍☠️ ${S().name} vừa đào được rương Halloween ở Bãi biển! Còn ${rem} rương hôm nay`;
        NET.sendNews(msg);
        UI.chatLog('', msg, true, true);
        updateBanner();
      } catch (e) { UI.toast('⚠️ ' + e.message, 5000); }
      finally { digging = false; }
    }, 1300);
  }
  function showChest() {
    const have = S().inv.hw_gem || 0;
    const p = UI.panel('🎃 RƯƠNG HALLOWEEN!', `<div class="tr-chest">🧰✨</div>
      <p class="confirm-text">Bạn đào được <b>+1 💠 Ngọc Halloween</b>!</p>
      <div class="tr-bar"><i style="width:${Math.min(100, have / NEED * 100)}%"></i><span>${have}/${NEED} 💠</span></div>
      <p class="muted">Gom đủ ${NEED} ngọc mang tới 🦜 Thuyền trưởng Râu Đỏ đổi <b>${fmt(REWARD)} xu</b>.</p>`);
    setTimeout(() => { if (p.el.isConnected) p.close(); }, 6000);
  }

  /* ---------- máy dò ---------- */
  let ac = null, beepAt = 0;
  function beep(f) {
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.value = 0.05; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12); o.stop(ac.currentTime + 0.13); } catch (e) { /* bỏ qua */ }
  }
  let hud = null;
  function ensureHud() {
    if (hud) return;
    hud = document.createElement('div');
    hud.className = 'tr-hud';
    hud.innerHTML = '<div class="tr-meter"><b></b><div class="tr-gauge"><i></i></div></div><button class="tr-dig">🪏 Đào</button>';
    document.body.appendChild(hud);
    hud.querySelector('.tr-dig').onclick = dig;
  }
  function tick() {
    const onBeach = AV.currentMap && AV.currentMap() === 'beach';
    if (!onBeach) { if (hud) hud.style.display = 'none'; return; }
    ensureHud();
    hud.style.display = 'flex';
    refresh();
    const meter = hud.querySelector('.tr-meter');
    if (!S().inv.tool_detector) { meter.style.display = 'none'; return; }
    meter.style.display = 'block';
    const p = AV.player, open = spots().filter((s) => !today()[s.slot]);
    if (!open.length) { if (claimsDay !== day()) { refresh(true); return; } meter.querySelector('b').textContent = '📡 Hết rương hôm nay'; meter.querySelector('i').style.width = '0%'; return; }
    const d = Math.min(...open.map((s) => Math.hypot(s.x - p.x, s.y - p.y)));
    const heat = Math.max(0, Math.min(1, 1 - d / 900));
    const lab = d < DIG_R ? '🔥🔥 ĐÀO NGAY ĐÂY!' : heat > 0.8 ? '🔥 Rất nóng' : heat > 0.55 ? '♨️ Nóng' : heat > 0.3 ? '🌤️ Ấm' : '❄️ Lạnh';
    meter.querySelector('b').textContent = '📡 ' + lab;
    const gi = meter.querySelector('i'); gi.style.width = Math.round(heat * 100) + '%'; gi.style.background = heat > 0.8 ? '#fa5252' : heat > 0.5 ? '#fd7e14' : heat > 0.3 ? '#fcc419' : '#74c0fc';
    const gap = 1600 - heat * 1450;
    if (Date.now() - beepAt > gap) { beepAt = Date.now(); beep(500 + heat * 900); }
  }
  setInterval(tick, 200);

  /* ---------- vẽ ở bãi biển: hố đã đào ---------- */
  function drawSpots(c) {
    if (claimsDay !== day()) return;
    spots().forEach((s) => {
      if (!claims[s.slot]) return;
      c.fillStyle = 'rgba(120,80,30,.55)'; c.beginPath(); c.ellipse(s.x, s.y, 26, 10, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(200,160,90,.9)'; c.beginPath(); c.ellipse(s.x + 30, s.y - 2, 14, 6, 0, 0, Math.PI * 2); c.fill();
    });
  }
  function booth(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 4, 90, 14, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6b4423'; c.fillRect(x - 80, y - 46, 160, 46);
    c.fillStyle = '#8a5a32'; c.fillRect(x - 86, y - 52, 172, 10);
    c.fillStyle = '#212529'; c.fillRect(x - 4, y - 150, 6, 100);
    c.fillStyle = '#111'; c.beginPath(); c.moveTo(x + 2, y - 150); c.lineTo(x + 70, y - 138); c.lineTo(x + 2, y - 112); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.font = '20px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('☠️', x + 26, y - 134);
    c.fillStyle = '#ff922b'; c.beginPath(); c.roundRect(x - 78, y - 96, 120, 30, 8); c.fill();
    c.fillStyle = '#fff'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.fillText('🎃 SĂN RƯƠNG', x - 18, y - 81);
    c.font = '24px system-ui, "Segoe UI Emoji"'; c.fillText('🧰🪏📡', x, y - 24);
  }

  /* ---------- Thuyền trưởng: mua đồ, đổi ngọc, bảng xếp hạng ---------- */
  async function board() {
    if (!CLOUD.user || !CLOUD.client) return [];
    const since = new Date(Date.now() + 7 * 3600e3 - 6 * 86400e3).toISOString().slice(0, 10);
    const { data } = await CLOUD.client.from('treasure_claims').select('name, day').gte('day', since);
    const cnt = {};
    (data || []).forEach((r) => { cnt[r.name || 'Ai đó'] = (cnt[r.name || 'Ai đó'] || 0) + 1; });
    return Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }
  function panel(tab = 'shop') {
    const p = UI.panel('🦜 Thuyền trưởng Râu Đỏ', '', { wide: true });
    const render = async () => {
      const inv = S().inv, have = inv.hw_gem || 0;
      let body = '';
      if (tab === 'shop') {
        body = `<div class="shop-list">
          <div class="shop-row"><span class="ic">🪏</span><div class="info"><b>Xẻng hải tặc</b><small>Bắt buộc để đào rương · dùng mãi mãi</small></div>${inv.tool_shovel ? '<button class="btn small ghost" disabled>✅ Đã có</button>' : `<button class="btn small" data-buy="tool_shovel">${fmt(SHOVEL)} xu</button>`}</div>
          <div class="shop-row"><span class="ic">📡</span><div class="info"><b>Máy dò kim loại</b><small>Kêu bíp nhanh dần, báo Lạnh → Nóng khi lại gần rương</small></div>${inv.tool_detector ? '<button class="btn small ghost" disabled>✅ Đã có</button>' : `<button class="btn small" data-buy="tool_detector">${fmt(DETECTOR)} xu</button>`}</div>
        </div><p class="muted small-note">Mỗi lần đào tốn 3 ⚡. Đứng đúng chỗ rương (máy dò báo 🔥🔥) rồi bấm 🪏 Đào.</p>`;
      } else if (tab === 'trade') {
        body = `<div class="tr-bar big"><i style="width:${Math.min(100, have / NEED * 100)}%"></i><span>${have}/${NEED} 💠 Ngọc Halloween</span></div>
          <div class="row-end" style="justify-content:center"><button class="btn" data-trade ${have >= NEED ? '' : 'disabled'}>💰 Đổi ${NEED} 💠 lấy ${fmt(REWARD)} xu</button></div>`;
      } else {
        body = '<p class="muted">⏳ Đang tải…</p>';
      }
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu · 💠 ${have} · Hôm nay còn <b>${left()}/${SLOTS}</b> rương</div>
        <div class="ss-tabs">${[['shop', '🛒 Đồ đi săn'], ['trade', '💰 Đổi ngọc'], ['rank', '🏆 Xếp hạng tuần']].map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div><div class="ss-box">${body}</div>`;
      p.body.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => {
        const id = b.dataset.buy, price = id === 'tool_shovel' ? SHOVEL : DETECTOR;
        UI.confirm(`Mua ${DATA.ITEMS[id].icon} <b>${DATA.ITEMS[id].name}</b> giá <b>${fmt(price)} xu</b>?`, 'Mua', () => { if (!AV.spend(price)) return; AV.addItem(id, 1); UI.toast(`${DATA.ITEMS[id].icon} Đã mua ${DATA.ITEMS[id].name}!`); render(); });
      });
      const tr = p.body.querySelector('[data-trade]');
      if (tr) tr.onclick = () => { if ((S().inv.hw_gem || 0) < NEED) return; S().inv.hw_gem -= NEED; AV.earn(REWARD, 50); UI.toast(`🎉 Đổi ${NEED} 💠 thành công: +${fmt(REWARD)} xu!`, 5000); NET.sendNews(`💰 ${S().name} vừa đổi ${NEED} ngọc Halloween lấy ${fmt(REWARD)} xu!`); render(); };
      if (tab === 'rank') {
        const rows = await board();
        if (!p.el.isConnected || tab !== 'rank') return;
        p.body.querySelector('.ss-box').innerHTML = rows.length ? `<div class="shop-list">${rows.map(([n, c], i) => `<div class="shop-row"><span class="ic">${['🥇', '🥈', '🥉'][i] || '🏅'}</span><div class="info"><b>${esc(n)}</b></div><b>${c} 🧰</b></div>`).join('')}</div>` : '<p class="muted">Chưa ai đào được rương trong tuần này. Bạn sẽ là người đầu tiên!</p>';
      }
    };
    render();
  }

  /* ---------- thông báo: popup khi vào game + dải chữ trên màn hình ---------- */
  let banner = null;
  function updateBanner() {
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'tr-banner';
      banner.onclick = () => (AV.currentMap() === 'beach' ? panel() : popup());
      document.body.appendChild(banner);
    }
    const n = left();
    banner.innerHTML = `<span>🎃 SỰ KIỆN HALLOWEEN · Săn rương ở 🏖️ Bãi biển · Hôm nay còn <b>${n}/${SLOTS}</b> rương · Gom ${NEED} 💠 đổi ${fmt(REWARD)} xu</span>`;
  }
  function popup() {
    const n = left();
    const p = UI.panel('🎃 SỰ KIỆN HALLOWEEN', `<div class="tr-pop">
        <div class="tr-chest">🏴‍☠️🧰🎃</div>
        <h2>SĂN RƯƠNG BÃI BIỂN</h2>
        <p>Mỗi ngày có <b>${SLOTS} rương</b> chôn ở 🏖️ Bãi biển cho <b>cả server</b> — <b>ai đào trước người đó được!</b></p>
        <p>Hôm nay còn: <b class="tr-left">${n}/${SLOTS}</b> rương</p>
        <p>Gom <b>${NEED} 💠 Ngọc Halloween</b> đổi <b>${fmt(REWARD)} xu</b> tại 🦜 Thuyền trưởng Râu Đỏ.</p>
        <p class="muted small-note">Cần 🪏 xẻng (${fmt(SHOVEL)} xu) · 📡 máy dò (${fmt(DETECTOR)} xu) giúp tìm nhanh hơn.</p>
      </div>
      <div class="row-end" style="justify-content:center"><button class="btn ghost" data-later>Để sau</button><button class="btn" data-go>🏖️ Đến bãi biển ngay</button></div>`);
    p.body.querySelector('[data-later]').onclick = () => p.close();
    p.body.querySelector('[data-go]').onclick = () => { p.close(); if (AV.currentMap() !== 'beach') AV.teleport('beach', false, undefined, undefined, '🏖️ Ra bãi biển săn rương…'); };
  }
  function onNews(text) {
    UI.toast(text, 5000);
    UI.chatLog('', text, false, true);
    lastFetch = 0; refresh(true);
  }
  function init() {
    updateBanner();
    setTimeout(async () => { await refresh(true); popup(); }, 4500);
    setInterval(() => refresh(), 60000);
  }
  return { init, dig, panel, popup, onNews, drawSpots, booth, spots, refresh };
})();
