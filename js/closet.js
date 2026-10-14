/* 🎒 TỦ ĐỒ CỦA TÔI — mọi thứ đã mua ở bất cứ đâu đều hiện ở đây, theo từng ngăn:
 * thời trang 4 mùa, bộ đồ, mũ, trang sức, kiểu áo, thú cưng, xe máy / ô tô / xe đua, điện thoại, nội thất,
 * đồ trang trí vườn, máy làm bánh, thuyền. Mặc / dắt / chọn xe ngay tại đây.
 * Nhân vật vẽ (Bạn nam / Bạn nữ) không hiện được mũ, trang sức, bộ đồ kiểu cũ → khi mặc các món đó sẽ tự chuyển sang 🎨 Tự phối đồ. */
const CLOSET = (() => {
  const S = () => AV.S;
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const painted = () => typeof ART !== 'undefined' && !!ART.avatarOf(S().look);
  /** món kiểu cũ (mũ, trang sức, kiểu áo, bộ đồ) chỉ hiện trên nhân vật tự phối */
  function needCustom() {
    if (!painted()) return;
    S().look.avatar = 'custom';
    UI.toast('🎨 Đã chuyển nhân vật sang "Tự phối đồ" để món này hiện lên người bạn. Muốn quay lại nhân vật vẽ: 👕 Tủ đồ → Nhân vật', 6000);
  }
  const notify = (what) => UI.toast(`🎒 ${what} đã cất vào Tủ đồ của bạn (Menu → 🎒 Đồ đã mua)`, 4500);

  /** gói các hàm mua có sẵn: mua xong báo vào tủ, mặc đồ kiểu cũ thì hiện được */
  function patch() {
    if (AV._closet) return; AV._closet = 1;
    const wrap = (name, after) => { const f = AV[name]; if (typeof f !== 'function') return; AV[name] = (...a) => { const r = f(...a); try { after(r, ...a); } catch (e) { /* bỏ qua */ } return r; }; };
    const own = (k, id) => (S().owned[k] || []).includes(id);
    const before = (name, pre) => { const f = AV[name]; if (typeof f !== 'function') return; AV[name] = (...a) => { pre(...a); return f(...a); }; };
    // mặc mũ / áo / trang sức, bộ đồ → chuyển sang tự phối nếu đang là nhân vật vẽ
    before('wear', (kind, id) => { if (id && id !== 'none' && id !== 'plain') needCustom(); });
    before('wearOutfit', () => needCustom());
    // mua xong → báo đã vào tủ đồ
    const had = {};
    before('buyWear', (kind, id) => { had.w = own({ hat: 'hats', shirt: 'shirtStyles', acc: 'accs' }[kind], id); });
    wrap('buyWear', (r, kind, id) => { if (!had.w && own({ hat: 'hats', shirt: 'shirtStyles', acc: 'accs' }[kind], id)) notify(nameOf(kind, id)); });
    wrap('buyOutfit', (r, id) => { if (r) notify(`Bộ ${(DATA.OUTFITS.find((o) => o.id === id) || {}).name || 'đồ'}`); });
    before('buyPet', (id) => { had.p = own('pets', id); });
    wrap('buyPet', (r, id) => { if (!had.p && own('pets', id)) notify((DATA.PETS.find((p) => p.id === id) || {}).name || 'Thú cưng'); });
    wrap('buyBike', (r, id) => { if (r) notify((DATA.BIKES.find((b) => b.id === id) || {}).name || 'Xe máy'); });
    wrap('buyCar', (r, id) => { if (r) notify((DATA.CARS.find((c) => c.id === id) || {}).name || 'Ô tô'); });
  }
  function nameOf(kind, id) {
    const list = { hat: DATA.HATS, shirt: DATA.SHIRT_STYLES, acc: DATA.ACCS }[kind] || [];
    return (list.find((x) => x.id === id) || {}).name || 'Món đồ';
  }

  /* ---------- các ngăn tủ ---------- */
  function sections() {
    const s = S(), L = s.look, o = s.owned || {};
    const out = [];
    // 👗 thời trang 4 mùa
    if (typeof WARDROBE !== 'undefined') {
      const cur = WARDROBE.parse(L.wear);
      const items = WARDROBE.ITEMS.filter((it) => (o.wear || []).includes(it.id)).map((it) => ({ ic: { top: '👕', bottom: '👖', full: '👗', shoes: '👟' }[it.slot], name: it.name, on: cur[it.slot] === it.id, act: cur[it.slot] === it.id ? ['Cởi ra', () => { L.wear = String(L.wear || '').split('|').map((x) => (x === it.id ? '' : x)).join('|'); AV.markChanged(); }] : ['Mặc', () => { L.wear = WARDROBE.withItem(L.wear, it.id); if (L.avatar === 'custom') L.avatar = WARDROBE.isGirl(L) ? 'girl' : 'boy'; AV.markChanged(); }] }));
      out.push({ k: 'wear', t: '👗 Thời trang 4 mùa', items, empty: 'Mua ở 👗 Tiệm Thời Trang (Khu mua sắm) → ✨ Thời trang 4 mùa' });
    }
    // 🧥 bộ đồ
    out.push({ k: 'set', t: '🧥 Bộ đồ', items: (DATA.OUTFITS || []).filter((x) => (o.outfits || []).includes(x.id)).map((x) => { const on = !painted() && AV.wearingOutfit(x.id); return { ic: '🧥', name: x.name, on, act: on ? null : ['Mặc bộ này', () => AV.wearOutfit(x.id)] }; }), empty: 'Mua ở 👗 Tiệm Thời Trang → 🧥 Bộ đồ' });
    // 🎩 mũ, 💍 trang sức, 👚 kiểu áo
    const wearList = (k, t, list, ownK, lookK, ic, noneId) => out.push({ k, t, items: list.filter((x) => x.id !== noneId && (o[ownK] || []).includes(x.id)).map((x) => { const on = !painted() && L[lookK] === x.id; return { ic, name: x.name, on, act: on ? ['Bỏ ra', () => AV.wear(k, noneId)] : ['Mặc', () => AV.wear(k, x.id)] }; }), empty: 'Mua ở 👗 Tiệm Thời Trang' });
    wearList('hat', '🎩 Mũ', DATA.HATS || [], 'hats', 'hat', '🎩', 'none');
    wearList('acc', '💍 Trang sức & kính', DATA.ACCS || [], 'accs', 'acc', '💍', 'none');
    wearList('shirt', '👚 Kiểu áo', DATA.SHIRT_STYLES || [], 'shirtStyles', 'shirtStyle', '👚', 'plain');
    // 🐾 thú cưng
    out.push({ k: 'pet', t: '🐾 Thú cưng', items: (DATA.PETS || []).filter((p) => p.id !== 'none' && (o.pets || []).includes(p.id)).map((p) => { const on = L.pet === p.id; return { ic: '🐾', name: p.name, on, act: on ? ['Để ở nhà', () => AV.wearPet('none')] : ['Dắt theo', () => AV.wearPet(p.id)] }; }), empty: 'Nhận nuôi ở 🐶 Tiệm Thú Cưng (Khu mua sắm)' });
    // 🛵 xe
    const veh = [];
    (s.bikes || []).forEach((id) => { const b = (DATA.BIKES || []).find((x) => x.id === id); if (b) veh.push({ ic: '🛵', name: b.name, on: s.bike === id, sub: b.desc, act: s.bike === id ? null : ['Chọn đi', () => { s.bike = id; AV.markChanged(); }] }); });
    Object.entries(s.evs || {}).forEach(([id, st]) => { const c = (DATA.CARS || []).find((x) => x.id === id); if (c) veh.push({ ic: '🚗', name: c.name, sub: `🔋 Pin ${Math.round(st.bat)}%` }); });
    (s.cars || []).filter((id) => id !== 'basic').forEach((id) => { const c = typeof RACE !== 'undefined' && RACE.CARS ? RACE.CARS.find((x) => x.id === id) : null; veh.push({ ic: '🏎️', name: c ? c.name : 'Xe đua ' + id, on: (s.car || 'basic') === id, act: (s.car || 'basic') === id ? null : ['Dùng xe đua này', () => { s.car = id; AV.markChanged(); }] }); });
    out.push({ k: 'veh', t: '🛵 Xe cộ', items: veh, empty: 'Mua xe máy khi chọn đường đi trên 🗺️ Bản đồ, ô tô ở Quang Lâm Fast Showroom', note: 'Đi xe: mở 🗺️ Bản đồ → chọn nơi muốn đến → chọn xe.' });
    // 📱 điện thoại
    const ph = s.phone;
    out.push({ k: 'phone', t: '📱 Điện thoại', items: ph && ph.model ? [{ ic: '📱', name: `Điện thoại ${ph.model}`, sub: `🔋 Pin ${Math.round(ph.bat ?? 100)}%`, act: typeof PHONE !== 'undefined' ? ['Mở máy', () => PHONE.open()] : null }] : [], empty: 'Mua ở ZenoPhone / Thế Giới Dế Yêu (phố trước nông trại)' });
    // 🛋️ nội thất
    out.push({ k: 'furn', t: '🛋️ Nội thất', items: (DATA.FURNITURE || []).filter((f) => AV.hasFurn && AV.hasFurn(f.id)).map((f) => ({ ic: f.icon, name: f.name, sub: f.room })), empty: 'Mua ở cửa hàng nội thất trong nhà', note: 'Đồ nội thất đặt sẵn trong nhà bạn — dùng 🛋️ Sắp xếp đồ trong nhà để dời chỗ.' });
    // 🌳 vườn nhà
    if (typeof GARDEN !== 'undefined' && s.garden) {
      const g = s.garden, items = [];
      Object.entries(g.inv || {}).forEach(([k, n]) => { const D = GARDEN.DECO[k]; if (D && n > 0) items.push({ ic: D.icon, name: `${D.name} ×${n}`, sub: 'Trong kho — chưa đặt ra vườn' }); });
      const placed = {}; (g.deco || []).forEach((d) => { placed[d.k] = (placed[d.k] || 0) + 1; });
      Object.entries(placed).forEach(([k, n]) => { const D = GARDEN.DECO[k]; if (D) items.push({ ic: D.icon, name: `${D.name} ×${n}`, sub: 'Đang đặt ngoài vườn', on: true }); });
      Object.entries(g.saps || {}).forEach(([k, n]) => { const T = GARDEN.TREES[k]; if (T && n > 0) items.push({ ic: '🌱', name: `Cây giống ${T.name.toLowerCase()} ×${n}`, sub: 'Chưa trồng' }); });
      Object.keys(g.mach || {}).forEach((k) => { const M = GARDEN.MACH[k]; if (M) items.push({ ic: M.icon, name: M.name, sub: 'Đặt ở tiệm bánh trong vườn', on: true }); });
      (g.boats || []).forEach((b) => items.push({ ic: '⛵', name: { sampan: 'Thuyền nan', wood: 'Ghe gỗ', motor: 'Ca nô', yacht: 'Du thuyền' }[b.k] || 'Thuyền', sub: 'Neo ở bến sông', on: true }));
      out.push({ k: 'garden', t: '🌳 Vườn nhà', items, empty: 'Mua đồ trang trí, cây giống, máy làm bánh ở Vườn Nhà', note: 'Đặt đồ trong kho ra vườn: vào Vườn Nhà → 🎨 Trang trí vườn.' });
    }
    return out;
  }

  let tab = 'all';
  function open() {
    const p = UI.panel('🎒 Tủ đồ của tôi', '', { wide: true });
    const render = () => {
      if (!p.el.isConnected) return;
      const secs = sections(), total = secs.reduce((a, s) => a + s.items.length, 0);
      const show = tab === 'all' ? secs.filter((s) => s.items.length) : secs.filter((s) => s.k === tab);
      p.body.innerHTML = `<div class="coins-line">🎒 Bạn đang có <b>${fmt(total)}</b> món đã mua${painted() ? ' · Nhân vật vẽ: mũ / trang sức / bộ đồ chỉ hiện khi chuyển sang 🎨 Tự phối đồ' : ''}</div>
        <div class="tabs cl-tabs"><button class="chip ${tab === 'all' ? 'on' : ''}" data-t="all">Tất cả</button>${secs.map((s) => `<button class="chip ${tab === s.k ? 'on' : ''}" data-t="${s.k}">${s.t} <small>${s.items.length}</small></button>`).join('')}</div>
        ${show.length ? show.map((s) => `<h4 class="cl-h">${s.t}</h4>${s.items.length ? `<div class="shop-list">${s.items.map((it, i) => `<div class="shop-row ${it.on ? 'quest ready' : ''}"><span class="ic">${it.ic}</span><div class="info"><b>${esc(it.name)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}${it.on ? '<small>✅ Đang dùng</small>' : ''}</div>${it.act ? `<button class="btn small" data-a="${s.k}:${i}">${it.act[0]}</button>` : ''}</div>`).join('')}</div>` : `<p class="muted">Chưa có — ${s.empty}</p>`}${s.note && s.items.length ? `<p class="muted small-note">${s.note}</p>` : ''}`).join('') : '<p class="muted">Tủ đồ còn trống — ghé Khu mua sắm, Tiệm Thời Trang, Tiệm Thú Cưng để sắm sửa nhé!</p>'}
        <div class="row-end"><button class="btn ghost" data-editor>👕 Phối đồ / đổi nhân vật</button></div>`;
      p.body.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { tab = b.dataset.t; render(); });
      p.body.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => { const [k, i] = b.dataset.a.split(':'), it = secs.find((s) => s.k === k).items[+i]; if (it && it.act) { it.act[1](); if (UI.updateHud) UI.updateHud(); render(); } });
      p.body.querySelector('[data-editor]').onclick = () => { p.close(); UI.characterEditor(false); };
    };
    render();
  }
  if (!document.getElementById('cl-css')) { const st = document.createElement('style'); st.id = 'cl-css'; st.textContent = '.cl-h{margin:12px 0 6px}.cl-tabs{flex-wrap:wrap}.cl-tabs small{opacity:.7}.cl-btn{margin-left:auto;margin-right:6px}.cl-btn + .wd-mine-btn{margin-left:0}.cl-own{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;background:#fff3bf;border:2px solid #fab005;border-radius:12px;padding:8px 10px;margin:6px 0}'; document.head.appendChild(st); }
  return { open, patch };
})();
