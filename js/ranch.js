/* 🚜 TRANG TRẠI MỞ RỘNG — bản đồ riêng của mỗi người (đi từ phố trước nông trại sang).
 *  🐾 vật nuôi: vịt ở ao, tổ ong, chuồng dê, ao nuôi cá, ngựa riêng để cưỡi
 *  🏭 xưởng chế biến: xay xát → lò nướng, máy ép, hũ muối dưa, máy phô mai / bơ, khung dệt
 *  🌳 cây lâu năm theo mùa, 🌾 ruộng lúa nước + trâu + sân phơi, 🏡 nhà kính trồng trái mùa
 *  ✨ đột biến quả vàng / khổng lồ khi thu hoạch, 🐦‍⬛ quạ phá ruộng, 🌪️ bão, 🏆 hội chợ tuần, 📦 đơn xe tải
 *  🏅 cấp trang trại 1–10 mở dần công trình, máy tưới / máy cho ăn tự động, 🚜 máy cày, đồ trang trí.
 * Dữ liệu lưu ở S.ranch. Hội chợ dùng bảng farm_fair (supabase/15-hoi-cho-nong-san.sql). */
const RANCH = (() => {
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => AV.S;
  const R = () => { const s = S(); s.ranch = s.ranch || {}; const r = s.ranch; r.xp = r.xp || 0; r.built = r.built || {}; r.deco = r.deco || {}; r.jobs = r.jobs || {}; return r; };
  const now = () => Date.now();
  const inv = () => S().inv;
  const has = (need) => Object.entries(need).every(([id, n]) => (inv()[id] || 0) >= n);
  const take = (need) => Object.entries(need).forEach(([id, n]) => { inv()[id] -= n; });
  const give = (id, n) => AV.addItem(id, n);
  const icon = (id) => (DATA.ITEMS[id] ? DATA.ITEMS[id].icon : '❓');
  const nm = (id) => (DATA.ITEMS[id] ? DATA.ITEMS[id].name : id);
  const dur = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return s >= 3600 ? `${Math.floor(s / 3600)}h${String(Math.floor(s / 60) % 60).padStart(2, '0')}` : s >= 60 ? `${Math.floor(s / 60)}p${String(s % 60).padStart(2, '0')}` : `${s}s`; };
  const needTxt = (need) => Object.entries(need).map(([id, n]) => `${n} ${icon(id)}`).join(' + ');
  const changed = () => { if (AV.markChanged) AV.markChanged(); };
  const season = () => (typeof SEASON !== 'undefined' ? SEASON.now().i : 0);

  /* ================= vật phẩm mới ================= */
  const NEW_ITEMS = {
    duck_egg: ['Trứng vịt', '🪺', 14], honey: ['Mật ong', '🍯', 45], goat_milk: ['Sữa dê', '🍼', 32],
    flour: ['Bột mì', '🥣', 18], bread: ['Bánh mì', '🥖', 48], cake: ['Bánh kem', '🎂', 170],
    juice_orange: ['Nước cam', '🧃', 60], juice_melon: ['Nước dưa hấu', '🍹', 130], juice_pine: ['Nước dứa', '🥤', 120],
    pickle: ['Dưa muối', '🫙', 95], cheese: ['Phô mai', '🧀', 90], goat_cheese: ['Phô mai dê', '🧀', 115], butter: ['Bơ sữa', '🧈', 60],
    knit_sweater: ['Áo len đan tay', '🧥', 160], paddy: ['Thóc', '🌾', 10], rice: ['Gạo', '🍚', 28], seedling: ['Mạ', '🌱', 0],
    durian: ['Sầu riêng', '🍈', 420], jackfruit: ['Mít', '🟢', 180], lychee: ['Vải thiều', '🍒', 150], longan: ['Nhãn lồng', '🟤', 140], rambutan: ['Chôm chôm', '🔴', 130],
    tarp: ['Bạt che bão', '⛺', 0],
  };
  Object.entries(NEW_ITEMS).forEach(([id, [name, ic, sell]]) => { DATA.ITEMS[id] = DATA.ITEMS[id] || { name, icon: ic, sell }; });
  Object.entries(DATA.CROPS).forEach(([id, c]) => {
    DATA.ITEMS['gold_' + id] = { name: `${c.name} vàng ✨`, icon: c.icon, sub: '✨', sell: c.sell * 10 };
    DATA.ITEMS['giant_' + id] = { name: `${c.name} khổng lồ`, icon: c.icon, sub: '🔝', sell: c.sell * 5 };
  });
  if (DATA.RECIPES && !DATA.RECIPES.some((r) => r.id === 'hot_vit_lon')) {
    DATA.RECIPES.push({ id: 'hot_vit_lon', name: 'Trứng vịt lộn', icon: '🥚', need: { duck_egg: 2 }, sell: 40, xp: 8 });
    DATA.ITEMS.hot_vit_lon = { name: 'Trứng vịt lộn', icon: '🥚', sell: 40 };
  }

  /* ================= cấp trang trại ================= */
  const LV_XP = [0, 80, 250, 600, 1200, 2200, 3800, 6000, 9000, 13000];
  const level = () => { const x = R().xp; let l = 1; LV_XP.forEach((need, i) => { if (x >= need) l = i + 1; }); return Math.min(10, l); };
  function addXP(n) {
    const before = level();
    R().xp += n;
    AV.earn(0, Math.ceil(n / 2));
    if (level() > before) { UI.toast(`🏅 Trang trại lên CẤP ${level()}! Mở thêm công trình mới — xem 📋 Bảng quản lý`, 6000); AV.floatText(`🏅 Trang trại cấp ${level()}!`, AV.player.x, AV.player.y - 130, '#ffd43b'); }
    changed();
  }

  /* ================= công trình ================= */
  const FAC = {
    duck: { name: 'Ao vịt', icon: '🦆', lv: 1, cost: 50000 },
    mill: { name: 'Máy xay xát', icon: '⚙️', lv: 1, cost: 80000 },
    bee: { name: 'Tổ ong', icon: '🐝', lv: 2, cost: 120000 },
    oven: { name: 'Lò nướng bánh', icon: '🔥', lv: 2, cost: 150000 },
    horse: { name: 'Chuồng ngựa (+ 1 con ngựa)', icon: '🐎', lv: 2, cost: 3000000 },
    goat: { name: 'Chuồng dê', icon: '🐐', lv: 3, cost: 300000 },
    juicer: { name: 'Máy ép nước', icon: '🧃', lv: 3, cost: 200000 },
    fish: { name: 'Ao nuôi cá', icon: '🐟', lv: 4, cost: 500000 },
    pickle: { name: 'Hũ muối dưa (3 hũ)', icon: '🫙', lv: 4, cost: 250000 },
    cheese: { name: 'Máy phô mai & bơ', icon: '🧀', lv: 5, cost: 400000 },
    paddy: { name: 'Ruộng lúa nước + trâu', icon: '🌾', lv: 5, cost: 800000 },
    loom: { name: 'Khung dệt', icon: '🧶', lv: 6, cost: 600000 },
    orchard: { name: 'Vườn cây lâu năm', icon: '🌳', lv: 6, cost: 1500000 },
    greenhouse: { name: 'Nhà kính', icon: '🏡', lv: 7, cost: 5000000 },
    sprinkler: { name: 'Máy tưới phun mưa (tưới 1 luống)', icon: '💦', lv: 8, cost: 1000000, multi: 4 },
    feeder: { name: 'Máy cho gà, bò, cừu, heo ăn', icon: '🤖', lv: 8, cost: 1500000 },
    tractor: { name: 'Máy cày 🚜', icon: '🚜', lv: 9, cost: 20000000 },
    statue: { name: 'Tượng vàng nông dân xuất sắc', icon: '🗿', lv: 10, cost: 50000000 },
  };
  const built = (k) => (R().built[k] || 0) > 0;
  function build(k) {
    const f = FAC[k], have = R().built[k] || 0;
    if (level() < f.lv) return UI.toast(`🔒 Cần trang trại cấp ${f.lv}`);
    if (have >= (f.multi || 1)) return UI.toast('Đã xây đủ rồi');
    UI.confirm(`Xây <b>${f.icon} ${f.name}</b> giá <b>${fmt(f.cost)} xu</b>?`, '🏗️ Xây', () => {
      if (!AV.spend(f.cost)) return;
      R().built[k] = have + 1;
      if (k === 'pickle') R().jars = R().jars || [null, null, null];
      addXP(40);
      UI.toast(`🏗️ Đã xây xong ${f.icon} ${f.name}!`, 4000);
      changed(); refreshPanels();
    });
  }

  /* ================= vật nuôi ================= */
  const ANIMALS = {
    duck: { feed: { wheat: 3 }, time: 20 * 60e3, out: { duck_egg: 6 }, xp: 8, msg: '🦆 Cho vịt ăn rồi! Vịt sẽ đẻ trứng sau 20 phút' },
    goat: { feed: { wheat: 4 }, time: 30 * 60e3, out: { goat_milk: 3 }, xp: 10, msg: '🐐 Cho dê ăn rồi! 30 phút nữa vắt sữa' },
  };
  function useAnimal(k) {
    const A = ANIMALS[k], st = R()[k] = R()[k] || { fedAt: 0 };
    if (!st.fedAt) {
      if (!has(A.feed)) return UI.toast(`Cần ${needTxt(A.feed)} để cho ăn (trồng lúa mì ở ruộng nhé)`);
      if (!AV.useEnergy(1)) return;
      take(A.feed); st.fedAt = now(); UI.toast(A.msg); changed(); return;
    }
    const left = st.fedAt + A.time - now();
    if (left > 0) return UI.toast(`⏳ Còn ${dur(left)} nữa`);
    Object.entries(A.out).forEach(([id, n]) => give(id, n));
    AV.floatText(Object.entries(A.out).map(([id, n]) => `+${n} ${icon(id)}`).join(' '), AV.player.x, AV.player.y - 110);
    st.fedAt = 0; addXP(A.xp); AV.quest('collect');
  }
  const animalInd = (k) => { const st = R()[k]; if (!built(k)) return null; if (!st || !st.fedAt) return '🌾'; const left = st.fedAt + ANIMALS[k].time - now(); return left <= 0 ? icon(Object.keys(ANIMALS[k].out)[0]) : { p: 1 - left / ANIMALS[k].time, left: left / 1000 }; };
  /* 🐝 mật ong: mỗi 30 phút +1 hũ (+ thêm theo số cây hoa đang trồng ở ruộng), tối đa 12 */
  function honeyNow() {
    const b = R().bee = R().bee || { at: now(), stock: 0 };
    const flowers = (S().tiles || []).filter((t) => t.crop && DATA.CROPS[t.crop] && DATA.CROPS[t.crop].kind && DATA.CROPS[t.crop].kind !== 'crop').length;
    const per = 30 * 60e3 / (1 + Math.min(3, flowers / 6));
    const gained = Math.floor((now() - b.at) / per);
    if (gained > 0) { b.stock = Math.min(12, b.stock + gained); b.at += gained * per; }
    return { b, per, flowers };
  }
  function useBee() {
    const { b, flowers } = honeyNow();
    if (!b.stock) return UI.toast(`🐝 Ong đang làm mật… trồng thêm hoa (đang có ${flowers} cây hoa) để ong làm nhanh hơn`, 4000);
    if (!R().beesuit && !AV.useEnergy(5)) return;
    give('honey', b.stock); AV.floatText(`+${b.stock} 🍯`, AV.player.x, AV.player.y - 110);
    if (!R().beesuit) UI.toast('🐝 Ái! Bị ong đốt mất 5 ⚡ — mua 🧑‍🚀 đồ bảo hộ trong 📋 Bảng quản lý để khỏi bị đốt', 4000);
    addXP(4 + b.stock); b.stock = 0; changed();
  }
  /* 🐟 ao nuôi cá: thả 20 cá giống → 3 giờ → kéo lưới */
  function useFish() {
    const f = R().fishpond = R().fishpond || { at: 0 };
    if (!f.at) return UI.confirm('Thả <b>20 cá giống</b> giá <b>20.000 xu</b>? 3 giờ sau kéo lưới thu cá.', 'Thả cá', () => { if (!AV.spend(20000)) return; f.at = now(); UI.toast('🐟 Đã thả cá giống!'); changed(); });
    const left = f.at + 3 * 3600e3 - now();
    if (left > 0) return UI.toast(`🐟 Cá đang lớn, còn ${dur(left)}`);
    if (!AV.useEnergy(4)) return;
    const pool = DATA.FISH.filter((x) => DATA.ITEMS[x.id]), tot = pool.reduce((a, x) => a + (x.w || 1), 0), got = {};
    const n = 10 + Math.floor(Math.random() * 6);
    for (let k = 0; k < n; k++) { let r = Math.random() * tot; const fx = pool.find((x) => (r -= (x.w || 1)) < 0) || pool[0]; got[fx.id] = (got[fx.id] || 0) + 1; }
    Object.entries(got).forEach(([id, c]) => give(id, c));
    UI.toast(`🎣 Kéo lưới được ${Object.entries(got).map(([id, c]) => `${c} ${icon(id)}`).join(' ')}`, 4500);
    f.at = 0; addXP(20); changed();
  }

  /* ================= xưởng chế biến ================= */
  const MACH = {
    mill: [{ out: 'flour', n: 1, need: { wheat: 3 }, t: 2 }],
    oven: [{ out: 'bread', n: 1, need: { flour: 2, egg: 1 }, t: 5 }, { out: 'cake', n: 1, need: { flour: 2, egg: 2, milk: 1, honey: 1 }, t: 10 }],
    juicer: [{ out: 'juice_orange', n: 1, need: { orange: 3 }, t: 4 }, { out: 'juice_melon', n: 1, need: { watermelon: 1 }, t: 4 }, { out: 'juice_pine', n: 1, need: { pineapple: 1 }, t: 4 }],
    cheese: [{ out: 'cheese', n: 1, need: { milk: 3 }, t: 8 }, { out: 'goat_cheese', n: 1, need: { goat_milk: 2 }, t: 8 }, { out: 'butter', n: 1, need: { milk: 2 }, t: 6 }],
    loom: [{ out: 'knit_sweater', n: 1, need: { wool: 3 }, t: 15 }],
  };
  const PICKLE = [{ out: 'pickle', n: 2, need: { cabbage: 2 } }, { out: 'pickle', n: 2, need: { cucumber: 3 } }];
  function machinePanel(k) {
    const f = FAC[k];
    const p = UI.panel(`${f.icon} ${f.name}`, '', { wide: true });
    const render = () => {
      if (!p.el.isConnected) return;
      const job = R().jobs[k];
      const head = job ? (job.end <= now() ? `<div class="shop-row quest ready"><span class="ic">${icon(job.out)}</span><div class="info"><b>Xong rồi: ${job.n} ${nm(job.out)}</b></div><button class="btn small" data-collect>📦 Lấy ra</button></div>`
        : `<div class="shop-row"><span class="ic">⏳</span><div class="info"><b>Đang làm ${job.n} ${nm(job.out)}</b><div class="qbar"><i style="width:${Math.min(100, (1 - (job.end - now()) / (job.dur)) * 100)}%"></i></div><small>Còn ${dur(job.end - now())}</small></div></div>`) : '<p class="muted">Máy đang rảnh — chọn món để làm:</p>';
      p.body.innerHTML = head + `<div class="shop-list">${MACH[k].map((r, i) => `<div class="shop-row"><span class="ic">${icon(r.out)}</span><div class="info"><b>${nm(r.out)}</b><small>${needTxt(r.need)} · ${r.t} phút · bán ${fmt(DATA.ITEMS[r.out].sell)} xu</small></div><button class="btn small" data-r="${i}" ${!job && has(r.need) ? '' : 'disabled'}>Làm</button></div>`).join('')}</div>`;
      const c = p.body.querySelector('[data-collect]');
      if (c) c.onclick = () => { give(job.out, job.n); AV.floatText(`+${job.n} ${icon(job.out)}`, AV.player.x, AV.player.y - 110); addXP(6 + job.dur / 60e3); if (job.out === 'knit_sweater' && typeof WARDROBE !== 'undefined' && WARDROBE.give('sweater_cream')) UI.toast('🧥 Mở khoá áo len cổ lọ trong ✨ Đồ của tôi!', 4500); delete R().jobs[k]; changed(); render(); };
      p.body.querySelectorAll('[data-r]').forEach((b) => b.onclick = () => {
        const r = MACH[k][+b.dataset.r];
        if (!has(r.need) || !AV.useEnergy(1)) return;
        take(r.need); R().jobs[k] = { out: r.out, n: r.n, end: now() + r.t * 60e3, dur: r.t * 60e3 }; changed(); render();
      });
    };
    render();
    const iv = setInterval(() => (p.el.isConnected ? render() : clearInterval(iv)), 1000);
  }
  function picklePanel() {
    const p = UI.panel('🫙 Hũ muối dưa', '', { wide: true });
    const render = () => {
      const jars = R().jars = R().jars || [null, null, null];
      p.body.innerHTML = `<p class="muted">Muối dưa phải để <b>1 ngày</b> mới ăn được. Có 3 hũ, muối cùng lúc được.</p><div class="shop-list">${jars.map((j, i) => {
        if (!j) return `<div class="shop-row"><span class="ic">🫙</span><div class="info"><b>Hũ ${i + 1} trống</b><small>${PICKLE.map((r) => needTxt(r.need)).join(' hoặc ')} → 2 🫙</small></div>${PICKLE.map((r, k) => `<button class="btn small" data-j="${i}:${k}" ${has(r.need) ? '' : 'disabled'}>${needTxt(r.need)}</button>`).join('')}</div>`;
        const left = j.end - now();
        return `<div class="shop-row ${left <= 0 ? 'quest ready' : ''}"><span class="ic">🫙</span><div class="info"><b>Hũ ${i + 1}: ${left <= 0 ? 'chua rồi, ăn được!' : 'đang muối'}</b><small>${left <= 0 ? '' : 'Còn ' + dur(left)}</small></div>${left <= 0 ? `<button class="btn small" data-jc="${i}">Lấy ra</button>` : ''}</div>`;
      }).join('')}</div>`;
      p.body.querySelectorAll('[data-j]').forEach((b) => b.onclick = () => { const [i, k] = b.dataset.j.split(':').map(Number), r = PICKLE[k]; if (!has(r.need)) return; take(r.need); jars[i] = { end: now() + 86400e3, n: r.n }; changed(); render(); });
      p.body.querySelectorAll('[data-jc]').forEach((b) => b.onclick = () => { const i = +b.dataset.jc; give('pickle', jars[i].n); jars[i] = null; addXP(20); changed(); render(); });
    };
    render();
  }
  const machInd = (k) => { if (!built(k)) return null; const j = R().jobs[k]; if (!j) return null; const left = j.end - now(); return left <= 0 ? icon(j.out) : { p: 1 - left / j.dur, left: left / 1000 }; };

  /* ================= ruộng lúa nước + sân phơi ================= */
  const PADDY_N = 6, RICE_T = 30 * 60e3, DRY_T = 10 * 60e3;
  function usePaddy(i) {
    const P = R().paddies = R().paddies || Array(PADDY_N).fill(0);
    const at = P[i];
    if (!at) {
      if (!AV.useEnergy(2)) return;
      if (!AV.spend(30)) return;
      P[i] = now(); AV.sayMine('🌱 Cấy mạ…'); AV.floatText('🌱 Cấy lúa', AV.player.x, AV.player.y - 110); changed(); return;
    }
    const left = at + RICE_T - now();
    if (left > 0) return UI.toast(`🌾 Lúa đang lớn, còn ${dur(left)}`);
    if (!AV.useEnergy(2)) return;
    give('paddy', 5); P[i] = 0; addXP(5); AV.floatText('+5 🌾 thóc', AV.player.x, AV.player.y - 110); AV.quest('harvest', 5);
  }
  function useDry() {
    const d = R().dry = R().dry || { n: 0, end: 0 };
    if (d.n && d.end <= now()) { give('rice', d.n); AV.floatText(`+${d.n} 🍚`, AV.player.x, AV.player.y - 110); addXP(d.n); d.n = 0; d.end = 0; changed(); return; }
    if (d.n) return UI.toast(`☀️ Đang phơi ${d.n} thóc, còn ${dur(d.end - now())}`);
    const n = Math.min(40, inv().paddy || 0);
    if (!n) return UI.toast('Chưa có thóc — gặt lúa ở ruộng lúa nước trước nhé');
    inv().paddy -= n; d.n = n; d.end = now() + DRY_T; UI.toast(`☀️ Đã rải ${n} thóc ra sân phơi, 10 phút nữa thành gạo`); changed();
  }
  const paddyState = (i) => { const at = (R().paddies || [])[i] || 0; if (!at) return 0; return Math.min(1, (now() - at) / RICE_T); };

  /* ================= cây lâu năm (mỗi mùa 1 loại ra quả) ================= */
  const TREES = [
    { id: 'jackfruit', name: 'Cây mít', ss: [0], col: '#7cb342', yield: 3 },
    { id: 'lychee', name: 'Cây vải', ss: [1], col: '#e53935', yield: 6 },
    { id: 'durian', name: 'Cây sầu riêng', ss: [1, 2], col: '#9e9d24', yield: 2 },
    { id: 'longan', name: 'Cây nhãn', ss: [2], col: '#a1887f', yield: 6 },
    { id: 'rambutan', name: 'Cây chôm chôm', ss: [3], col: '#d81b60', yield: 6 },
  ];
  const TREE_T = 3 * 3600e3;
  const SSN = ['🌸 Xuân', '☀️ Hạ', '🍂 Thu', '❄️ Đông'];
  function useTree(i) {
    const T = TREES[i], st = R().trees = R().trees || TREES.map(() => now());
    if (!T.ss.includes(season())) return UI.toast(`${T.name} chỉ ra quả vào mùa ${T.ss.map((s) => SSN[s]).join(', ')}`, 3500);
    const left = st[i] + TREE_T - now();
    if (left > 0) return UI.toast(`${icon(T.id)} ${T.name} đang ra quả, còn ${dur(left)}`);
    if (!AV.useEnergy(2)) return;
    give(T.id, T.yield); st[i] = now(); addXP(15); AV.floatText(`+${T.yield} ${icon(T.id)}`, AV.player.x, AV.player.y - 110); AV.quest('harvest', T.yield);
  }
  const treeRipe = (i) => { const st = (R().trees || [])[i]; return TREES[i].ss.includes(season()) && st && now() - st >= TREE_T; };

  /* ================= nhà kính: trồng mọi cây không cần đúng mùa ================= */
  const GH_N = 8;
  function greenhousePanel() {
    const p = UI.panel('🏡 Nhà kính', '', { wide: true });
    const render = () => {
      if (!p.el.isConnected) return;
      const G = R().gh = R().gh || Array(GH_N).fill(null);
      const seeds = Object.keys(DATA.CROPS).filter((c) => (inv()['seed_' + c] || 0) > 0);
      p.body.innerHTML = `<p class="muted">Trong nhà kính trồng được <b>mọi loại cây bất kể mùa</b>, lớn nhanh hơn 20%.</p>
        <div class="gh-grid">${G.map((t, i) => {
          if (!t) return `<div class="gh-cell"><b>Ô ${i + 1}</b><select data-gs="${i}"><option value="">🌱 Chọn hạt…</option>${seeds.map((c) => `<option value="${c}">${DATA.CROPS[c].icon} ${DATA.CROPS[c].name} (${inv()['seed_' + c]})</option>`).join('')}</select></div>`;
          const c = DATA.CROPS[t.crop], total = c.time * 800, left = t.at + total - now();
          return `<div class="gh-cell ${left <= 0 ? 'ripe' : ''}"><b>${c.icon} ${c.name}</b>${left <= 0 ? `<button class="btn small" data-gh="${i}">Thu hoạch</button>` : `<div class="qbar"><i style="width:${Math.min(100, (1 - left / total) * 100)}%"></i></div><small>${dur(left)}</small>`}</div>`;
        }).join('')}</div>${seeds.length ? '' : '<p class="muted small-note">Hết hạt giống — mua ở Cửa hàng nông trại.</p>'}`;
      p.body.querySelectorAll('[data-gs]').forEach((s) => s.onchange = () => { const c = s.value, i = +s.dataset.gs; if (!c || !inv()['seed_' + c]) return; if (!AV.useEnergy(1)) return; inv()['seed_' + c]--; G[i] = { crop: c, at: now() }; changed(); render(); });
      p.body.querySelectorAll('[data-gh]').forEach((b) => b.onclick = () => { const i = +b.dataset.gh, t = G[i], c = DATA.CROPS[t.crop]; give(t.crop, c.yield); onHarvest([t.crop]); addXP(c.xp); G[i] = null; changed(); render(); });
    };
    render();
    const iv = setInterval(() => (p.el.isConnected ? render() : clearInterval(iv)), 3000);
  }

  /* ================= ✨ đột biến khi thu hoạch ================= */
  function onHarvest(keys) {
    if (!keys || !keys.length || Math.random() > 0.01 + level() * 0.001) return;
    const crop = keys[Math.floor(Math.random() * keys.length)], gold = Math.random() < 0.4, id = (gold ? 'gold_' : 'giant_') + crop;
    give(id, 1);
    const msg = `${gold ? '✨ QUẢ VÀNG' : '🔝 QUẢ KHỔNG LỒ'}! ${S().name} vừa thu hoạch được ${nm(id)} (bán ${fmt(DATA.ITEMS[id].sell)} xu)`;
    UI.toast(msg, 6000);
    if (typeof NET !== 'undefined' && NET.sendNews) NET.sendNews(msg);
    AV.floatText(gold ? '✨ QUẢ VÀNG!' : '🔝 KHỔNG LỒ!', AV.player.x, AV.player.y - 140, '#ffd43b');
  }

  /* ================= 📦 đơn hàng xe tải ================= */
  const vnDay = (t = now()) => new Date(t + 7 * 3600e3).toISOString().slice(0, 10);
  const hash = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function orders() {
    const r = R(), d = vnDay();
    if (r.orders && r.orders.day === d) return r.orders.list;
    let a = hash('ORD|' + d + '|' + (S().owner || S().name));
    const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
    const pool = ['egg', 'milk', 'wool', 'wheat', 'corn', 'carrot', 'tomato', 'potato', 'strawberry'];
    if (built('duck')) pool.push('duck_egg'); if (built('mill')) pool.push('flour'); if (built('oven')) pool.push('bread');
    if (built('bee')) pool.push('honey'); if (built('goat')) pool.push('goat_milk'); if (built('juicer')) pool.push('juice_orange');
    if (built('cheese')) pool.push('cheese'); if (built('paddy')) pool.push('rice');
    const list = [];
    for (let k = 0; k < 3; k++) {
      const need = {};
      const m = 1 + Math.floor(rnd() * 2);
      for (let j = 0; j < m; j++) { const id = pool[Math.floor(rnd() * pool.length)]; if (DATA.ITEMS[id]) need[id] = (need[id] || 0) + Math.max(2, Math.round((60 / Math.max(5, DATA.ITEMS[id].sell)) * (2 + rnd() * 4))); }
      const val = Object.entries(need).reduce((s, [id, n]) => s + DATA.ITEMS[id].sell * n, 0);
      list.push({ need, coins: Math.round(val * 2.5 / 10) * 10 + 500, xp: 20 + Math.round(val / 20), done: false });
    }
    r.orders = { day: d, list };
    return list;
  }

  /* ================= 🏆 hội chợ nông sản (cả server, theo tuần) ================= */
  const weekKey = (t = now()) => { const d = new Date(t + 7 * 3600e3); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day); return d.toISOString().slice(0, 10); };
  const fairOk = () => typeof CLOUD !== 'undefined' && CLOUD.user && CLOUD.client;
  async function fairBoard(week) {
    const { data, error } = await CLOUD.client.from('farm_fair').select('user_id, name, item, score').eq('week', week).order('score', { ascending: false }).limit(10);
    if (error) throw error;
    return data || [];
  }

  /* ================= 📋 bảng quản lý ================= */
  const DECO = {
    windmill: { name: 'Cối xay gió', icon: '🌬️', cost: 300000 }, well: { name: 'Giếng nước', icon: '🪣', cost: 150000 },
    bridge: { name: 'Cầu gỗ qua ao', icon: '🌉', cost: 200000 }, lanterns: { name: 'Dãy đèn lồng', icon: '🏮', cost: 120000 },
    flowerfence: { name: 'Hàng rào hoa', icon: '🌷', cost: 100000 }, scarecrow: { name: 'Bù nhìn đuổi quạ', icon: '🎃', cost: 80000, use: 'Ít quạ phá ruộng hơn' },
  };
  /** 📖 hướng dẫn lên cấp trang trại: XP kiếm ở đâu, mỗi cấp mở công trình gì, đang cấp mấy */
  function guideHtml() {
    const lv = level(), xp = R().xp, next = LV_XP[lv];
    const unlock = (l) => Object.values(FAC).filter((f) => f.lv === l).map((f) => `${f.icon} ${f.name}`).join(' · ');
    const WAYS = [
      ['🏗️', 'Xây công trình mới ở các ô "Đất trống"', '+40 XP mỗi công trình'],
      ['🚚', 'Giao đơn xe tải (3 đơn mỗi ngày)', '+20 XP trở lên mỗi đơn — lên cấp nhanh nhất!'],
      ['🦆', 'Cho vịt / dê ăn rồi thu trứng vịt, sữa dê', '+8 / +10 XP mỗi lần thu'],
      ['🐝', 'Lấy mật ở tổ ong', '+4 XP + số hũ mật'],
      ['🐟', 'Thu cá ở ao nuôi cá', '+20 XP'],
      ['⚙️', 'Chế biến ở máy: xay bột, nướng bánh, ép nước, phô mai, dệt len', '+6 XP trở lên (món làm càng lâu càng nhiều XP)'],
      ['🫙', 'Muối dưa trong hũ', '+20 XP mỗi hũ'],
      ['🌾', 'Gặt lúa nước · phơi thóc thành gạo', '+5 XP · +1 XP mỗi phần gạo'],
      ['🌳', 'Hái quả ở vườn cây lâu năm', '+15 XP'],
      ['🏡', 'Thu hoạch trong nhà kính', '+XP theo loại cây'],
      ['🏆', 'Mang nông sản đi thi hội chợ tuần', '+10 XP'],
    ];
    return `<div class="rg-now">🏅 Trang trại đang <b>cấp ${lv}</b>${next ? ` · còn <b>${fmt(next - xp)} XP</b> nữa lên cấp ${lv + 1}${unlock(lv + 1) ? ` → mở <b>${unlock(lv + 1)}</b>` : ''}` : ' · đã đạt cấp tối đa 🎉'}</div>
      <h4>① Làm việc ở trang trại để kiếm XP</h4>
      <div class="shop-list">${WAYS.map(([ic, t, x]) => `<div class="shop-row"><span class="ic">${ic}</span><div class="info"><b>${t}</b><small>${x}</small></div></div>`).join('')}</div>
      <h4>② Đủ XP thì trang trại lên cấp, mở thêm công trình</h4>
      <div class="shop-list">${LV_XP.map((need, i) => `<div class="shop-row" style="${i + 1 <= lv ? 'opacity:.6' : ''}"><span class="ic">${i + 1 <= lv ? '✅' : '🔒'}</span><div class="info"><b>Cấp ${i + 1}${i + 1 === lv ? ' (đang ở đây)' : ''}</b><small>Cần ${fmt(need)} XP · mở: ${unlock(i + 1) || '—'}</small></div></div>`).join('')}</div>
      <h4>③ Xây công trình đã mở</h4>
      <p class="muted">Đi tới các ô <b>"Đất trống"</b> có biển gỗ trên bản đồ (hoặc tab 🏗️ Xây dựng ở 📋 Bảng quản lý). Đủ cấp và đủ xu là xây được ngay. Có công trình mới thì làm ra nhiều đồ hơn → giao được nhiều đơn → lên cấp nhanh hơn.</p>
      <p class="muted small-note">💡 Mẹo: bắt đầu bằng 🦆 Ao vịt và ⚙️ Máy xay xát (mở sẵn ở cấp 1), rồi mỗi ngày giao đủ 3 đơn xe tải 🚚. Thiếu đồ thì xem đơn cần gì để trồng / nuôi / chế biến.</p>`;
  }
  function guide() { const p = UI.panel('📖 Hướng dẫn nâng cấp Trang Trại', guideHtml(), { wide: true }); R().guided = 1; changed(); return p; }
  let mainP = null;
  function refreshPanels() { if (mainP && mainP.el.isConnected) mainP.render(); }
  function panel(tab = 'build') {
    const p = UI.panel('📋 Quản lý Trang Trại', '', { wide: true });
    mainP = p;
    const render = async () => {
      const lv = level(), xp = R().xp, nextXp = LV_XP[lv] || null;
      const TABS = [['guide', '📖 Hướng dẫn'], ['build', '🏗️ Xây dựng'], ['orders', '📦 Đơn xe tải'], ['fair', '🏆 Hội chợ'], ['deco', '🎨 Trang trí'], ['ride', '🐎 Xe & đồ']];
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu · 🏅 Trang trại <b>cấp ${lv}</b>${nextXp ? ` · ${fmt(xp)}/${fmt(nextXp)} XP` : ' (tối đa)'}</div>
        <div class="qbar"><i style="width:${nextXp ? Math.min(100, (xp - LV_XP[lv - 1]) / (nextXp - LV_XP[lv - 1]) * 100) : 100}%"></i></div>
        <div class="ss-tabs">${TABS.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div><div class="ss-box"></div>`;
      p.body.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      const box = p.body.querySelector('.ss-box');
      if (tab === 'guide') { box.innerHTML = guideHtml(); return; }
      if (tab === 'build') {
        box.innerHTML = `<div class="shop-list">${Object.entries(FAC).map(([k, f]) => {
          const n = R().built[k] || 0, max = f.multi || 1;
          const btn = n >= max ? '<button class="btn small ghost" disabled>✅ Đã xây</button>' : lv < f.lv ? `<button class="btn small ghost" disabled>🔒 Cấp ${f.lv}</button>` : `<button class="btn small" data-b="${k}">${fmt(f.cost)} xu</button>`;
          return `<div class="shop-row"><span class="ic">${f.icon}</span><div class="info"><b>${f.name}${max > 1 ? ` (${n}/${max})` : ''}</b></div>${btn}</div>`;
        }).join('')}</div><p class="muted small-note">Làm việc ở trang trại (cho ăn, thu hoạch, chế biến, giao hàng) để lên cấp mở thêm công trình.</p>`;
        box.querySelectorAll('[data-b]').forEach((b) => b.onclick = () => build(b.dataset.b));
      } else if (tab === 'orders') {
        const list = orders();
        box.innerHTML = `<p class="muted">Xe tải ghé mỗi ngày với 3 đơn hàng — giao đủ được nhiều xu và XP. Đơn mới vào 0h.</p><div class="shop-list">${list.map((o, i) => `<div class="shop-row ${o.done ? '' : has(o.need) ? 'quest ready' : ''}"><span class="ic">📦</span><div class="info"><b>${Object.entries(o.need).map(([id, n]) => `${n} ${icon(id)} ${nm(id)} <small>(có ${inv()[id] || 0})</small>`).join(' + ')}</b><small>Thưởng ${fmt(o.coins)} xu · ${o.xp} XP trang trại</small></div>${o.done ? '<button class="btn small ghost" disabled>✅ Đã giao</button>' : `<button class="btn small" data-o="${i}" ${has(o.need) ? '' : 'disabled'}>Giao</button>`}</div>`).join('')}</div>`;
        box.querySelectorAll('[data-o]').forEach((b) => b.onclick = () => { const o = list[+b.dataset.o]; if (o.done || !has(o.need)) return; take(o.need); o.done = true; AV.earn(o.coins, 10); addXP(o.xp); UI.toast(`🚚 Giao hàng thành công: +${fmt(o.coins)} xu`); render(); });
      } else if (tab === 'fair') {
        if (!fairOk()) { box.innerHTML = '<p class="muted">🔐 Đăng nhập tài khoản để thi hội chợ</p>'; return; }
        const wk = weekKey(), last = weekKey(now() - 7 * 86400e3);
        const cands = Object.entries(inv()).filter(([id, n]) => n > 0 && DATA.ITEMS[id] && DATA.ITEMS[id].sell > 0 && !id.startsWith('seed_')).sort((a, b) => DATA.ITEMS[b[0]].sell - DATA.ITEMS[a[0]].sell).slice(0, 12);
        box.innerHTML = '<p class="muted">⏳ Đang tải bảng xếp hạng…</p>';
        let rows = [], lastRows = [];
        try { rows = await fairBoard(wk); lastRows = await fairBoard(last); } catch (e) { box.innerHTML = `<p class="muted">⚠️ ${/farm_fair|does not exist|Could not find/i.test(e.message || '') ? 'Chủ game chưa bật hội chợ (chạy file supabase/15-hoi-cho-nong-san.sql)' : esc(e.message)}</p>`; return; }
        if (!p.el.isConnected || tab !== 'fair') return;
        const champ = lastRows[0], iWon = champ && champ.user_id === CLOUD.user.id && !(R().fairWon || {})[last];
        box.innerHTML = `${iWon ? `<div class="shop-row quest ready"><span class="ic">🏆</span><div class="info"><b>Bạn VÔ ĐỊCH hội chợ tuần trước!</b><small>Nhận cúp + 5.000.000 xu</small></div><button class="btn small" data-win>Nhận</button></div>` : ''}
          <p>Mang nông sản <b>giá trị nhất</b> đi thi (theo giá bán). Quả ✨ vàng, 🔝 khổng lồ, đồ chế biến đều được. Mỗi tuần nộp lại được, giữ món cao nhất. Vô địch tuần nhận 🏆 cúp + 5 triệu xu.</p>
          <div class="shop-list">${cands.map(([id, n]) => `<div class="shop-row"><span class="ic">${icon(id)}</span><div class="info"><b>${nm(id)}</b><small>Điểm ${fmt(DATA.ITEMS[id].sell)} · có ${n}</small></div><button class="btn small" data-f="${id}">Mang đi thi</button></div>`).join('') || '<p class="muted">Túi chưa có nông sản nào.</p>'}</div>
          <h4 class="ev-h">🏆 Bảng xếp hạng tuần này</h4><div class="shop-list">${rows.map((r, i) => `<div class="shop-row"><span class="ic">${['🥇', '🥈', '🥉'][i] || '🏅'}</span><div class="info"><b>${esc(r.name)}</b><small>${icon(r.item)} ${esc(nm(r.item))}</small></div><b>${fmt(r.score)}</b></div>`).join('') || '<p class="muted">Chưa ai dự thi tuần này!</p>'}</div>
          ${champ ? `<p class="muted small-note">Vô địch tuần trước: <b>${esc(champ.name)}</b> với ${esc(nm(champ.item))}</p>` : ''}`;
        box.querySelectorAll('[data-f]').forEach((b) => b.onclick = async () => {
          const id = b.dataset.f, score = DATA.ITEMS[id].sell, mine = rows.find((r) => r.user_id === CLOUD.user.id);
          if (mine && mine.score >= score) return UI.toast(`Món bạn đang dự thi (${nm(mine.item)}) điểm cao hơn rồi`);
          const { error } = await CLOUD.client.from('farm_fair').upsert({ week: wk, user_id: CLOUD.user.id, name: S().name, item: id, score }, { onConflict: 'week,user_id' });
          if (error) return UI.toast('⚠️ ' + error.message, 5000);
          inv()[id]--; addXP(10); UI.toast(`🏆 Đã mang ${nm(id)} đi thi hội chợ!`); changed(); render();
        });
        const w = box.querySelector('[data-win]');
        if (w) w.onclick = () => { R().fairWon = { ...(R().fairWon || {}), [last]: 1 }; R().trophies = (R().trophies || 0) + 1; AV.earn(5000000, 100); NET.sendNews(`🏆 ${S().name} là nhà vô địch Hội chợ nông sản tuần trước!`); changed(); render(); };
      } else if (tab === 'deco') {
        box.innerHTML = `<div class="shop-list">${Object.entries(DECO).map(([k, d]) => `<div class="shop-row"><span class="ic">${d.icon}</span><div class="info"><b>${d.name}</b><small>${d.use || 'Trang trí trang trại'}</small></div>${R().deco[k] ? '<button class="btn small ghost" disabled>✅ Đã có</button>' : `<button class="btn small" data-d="${k}">${fmt(d.cost)} xu</button>`}</div>`).join('')}</div>`;
        box.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { const d = DECO[b.dataset.d]; if (!AV.spend(d.cost)) return; R().deco[b.dataset.d] = 1; addXP(15); UI.toast(`🎨 Đã đặt ${d.icon} ${d.name}`); render(); });
      } else {
        const tarpLeft = (R().tarpUntil || 0) - now();
        box.innerHTML = `<div class="shop-list">
          <div class="shop-row"><span class="ic">🐎</span><div class="info"><b>Cưỡi ngựa</b><small>${built('horse') ? 'Đi nhanh gấp rưỡi ở mọi khu ngoài trời' : 'Xây chuồng ngựa (cấp 2) để có ngựa'}</small></div><button class="btn small" data-mount="horse" ${built('horse') ? '' : 'disabled'}>${mount === 'horse' ? 'Xuống ngựa' : 'Lên ngựa'}</button></div>
          <div class="shop-row"><span class="ic">🚜</span><div class="info"><b>Máy cày</b><small>${built('tractor') ? 'Lái qua ruộng chín là thu hoạch cả luống' : 'Xây ở cấp 9'}</small></div><button class="btn small" data-mount="tractor" ${built('tractor') ? '' : 'disabled'}>${mount === 'tractor' ? 'Xuống xe' : 'Lái máy cày'}</button></div>
          <div class="shop-row"><span class="ic">🧑‍🚀</span><div class="info"><b>Đồ bảo hộ lấy mật</b><small>Không bị ong đốt</small></div>${R().beesuit ? '<button class="btn small ghost" disabled>✅ Đã có</button>' : '<button class="btn small" data-suit>50.000 xu</button>'}</div>
          <div class="shop-row"><span class="ic">⛺</span><div class="info"><b>Bạt che bão (24 giờ)</b><small>${tarpLeft > 0 ? 'Đang che, còn ' + dur(tarpLeft) : 'Bão tới cây không bị đổ'}</small></div><button class="btn small" data-tarp>30.000 xu</button></div>
        </div>`;
        box.querySelectorAll('[data-mount]').forEach((b) => b.onclick = () => { setMount(mount === b.dataset.mount ? null : b.dataset.mount); render(); });
        const su = box.querySelector('[data-suit]'); if (su) su.onclick = () => { if (!AV.spend(50000)) return; R().beesuit = 1; changed(); render(); };
        box.querySelector('[data-tarp]').onclick = () => { if (!AV.spend(30000)) return; R().tarpUntil = Math.max(now(), R().tarpUntil || 0) + 86400e3; UI.toast('⛺ Đã che bạt cho ruộng 24 giờ'); changed(); render(); };
      }
    };
    p.render = render;
    render();
  }

  /* ================= 🐎 cưỡi ngựa / 🚜 máy cày ================= */
  let mount = null, mountFx = null;
  function setMount(k) {
    mount = k;
    if (mountFx) { const i = AV.worldFx.indexOf(mountFx); if (i >= 0) AV.worldFx.splice(i, 1); mountFx = null; }
    if (!k) { UI.toast('🚶 Đã xuống'); return; }
    mountFx = { x: 0, y: 0, draw: (g, t) => {
      const P = AV.player; if (P.hidden || AV.mapIndoor()) return;
      g.save(); g.translate(P.x, P.y + 4); g.scale(-(P.dir || 1), 1);
      g.font = k === 'horse' ? '64px system-ui, "Segoe UI Emoji"' : '70px system-ui, "Segoe UI Emoji"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillText(k === 'horse' ? '🐎' : '🚜', 0, Math.sin(t * 14) * (P.moving ? 2 : 0));
      g.restore();
    } };
    AV.worldFx.push(mountFx);
    UI.toast(k === 'horse' ? '🐎 Lên ngựa! Đi nhanh hơn hẳn' : '🚜 Lái máy cày — chạy qua luống chín để gặt', 3500);
  }
  AV.mountMul = () => (mount && !AV.mapIndoor() ? (mount === 'horse' ? 1.6 : 1.3) : 1);

  /* ================= vòng lặp: máy tự động, quạ, bão ================= */
  let crowAt = now() + (8 + Math.random() * 10) * 60e3, crowEnd = 0, stormSeen = {};
  function tick() {
    if (!AV.S || !AV.currentMap) return;
    const r = R(), mapId = AV.currentMap(), vis = AV.visiting && AV.visiting();
    if (mapId === 'ranch' && !vis && !r.guided && !UI.isBlocking()) { r.guided = 1; setTimeout(guide, 1200); }
    // mountFx bám theo người chơi
    if (mountFx) { mountFx.x = AV.player.x; mountFx.y = AV.player.y - 0.5; }
    // 🚜 gặt khi lái qua luống chín
    if (mount === 'tractor' && mapId === 'farm' && !vis && AV.tractorHarvest) AV.tractorHarvest(AV.player.x, AV.player.y);
    // 💦 máy tưới + 🤖 máy cho ăn (mỗi 30 giây)
    if (!vis && now() - (r.autoAt || 0) > 30000) {
      r.autoAt = now();
      const sprink = r.built.sprinkler || 0;
      if (sprink) {
        let beds = 0;
        for (let b = 0; b < (DATA.BED_COUNT || 22) && beds < sprink; b++) {
          if (!S().beds[b]) continue;
          const tiles = S().tiles.slice(b * 12, b * 12 + 12).filter((t) => t.crop && !t.watered && AV.tileState(t).stage >= 0 && AV.tileState(t).stage < 2);
          if (!tiles.length) continue;
          tiles.forEach((t) => { const total = DATA.CROPS[t.crop].time * 1000, st = AV.tileState(t); if (st.thirsty) t.plantedAt += now() - (t.plantedAt + DATA.THIRSTY_AT * total); t.plantedAt -= DATA.WATER_CUT * total; t.watered = true; });
          beds++;
        }
        if (beds) changed();
      }
      if (built('feeder')) {
        const feed = (st, cfg) => { if (st && !st.fedAt && (inv().wheat || 0) >= cfg.feed) { inv().wheat -= cfg.feed; st.fedAt = now(); return 1; } return 0; };
        let n = AV.hasHerd('coop', S()) ? feed(S().coop, DATA.COOP) : 0;
        Object.keys(DATA.PENS).forEach((k) => { if (AV.hasHerd(k, S())) n += feed((S().pen || {})[k], DATA.PENS[k]); });
        if (n) changed();
      }
    }
    // 🐦‍⬛ quạ phá ruộng (chỉ khi đang ở nông trại của mình)
    if (mapId === 'farm' && !vis) {
      if (!crowEnd && now() > crowAt) {
        crowAt = now() + (15 + Math.random() * 20) * 60e3;
        const n = r.deco.scarecrow ? 1 : 4;
        if (S().look.pet === 'cat') UI.toast('🐈 Mèo nhà bạn đuổi lũ quạ chạy hết rồi!', 3500);
        else {
          const spots = AV.debugMap().inter.filter((o) => o.tile != null && S().beds[Math.floor(o.tile / 12)] && S().tiles[o.tile].crop);
          if (spots.length) {
            crowEnd = now() + 60000;
            for (let k = 0; k < n; k++) { const o = spots[Math.floor(Math.random() * spots.length)]; AV.dropPickup(o.ax + (Math.random() - 0.5) * 40, o.ay - 20, '🐦‍⬛', (p) => { AV.floatText('Xua! +XP', p.x, p.y - 40, '#fff'); AV.earn(0, 3); }, { ev: 'crow', big: 1 }); }
            UI.toast(`🐦‍⬛ ${n} con quạ đang phá ruộng! Chạm vào để xua đi trong 60 giây${r.deco.scarecrow ? '' : ' (dựng 🎃 bù nhìn để ít quạ hơn)'}`, 5000);
          }
        }
      }
      if (crowEnd && now() > crowEnd) {
        const left = AV.pickups().filter((p) => p.ev === 'crow').length;
        AV.removePickups((p) => p.ev === 'crow');
        crowEnd = 0;
        if (left) {
          const ripe = S().tiles.filter((t) => t.crop && !t.stolen && AV.tileState(t).stage === 2);
          let lost = 0;
          for (let k = 0; k < left && ripe.length; k++) { const t = ripe.splice(Math.floor(Math.random() * ripe.length), 1)[0]; t.stolen = Math.max(1, Math.floor(DATA.CROPS[t.crop].yield / 2)); lost++; }
          UI.toast(lost ? `🐦‍⬛ Quạ đã mổ mất ${lost} ô ruộng chín!` : '🐦‍⬛ Quạ bay đi rồi', 4000);
          changed();
        }
      }
    }
    // 🌪️ bão: 1/5 số cơn mưa to
    const slot = Math.floor(now() / (15 * 60e3)), into = now() - slot * 15 * 60e3;
    if (!vis && AV.rainLevel() > 0.6 && hash('STORM|' + slot) % 5 === 0) {
      if (!stormSeen[slot]) {
        stormSeen[slot] = 1;
        const covered = (r.tarpUntil || 0) > now();
        if (covered) UI.toast('🌪️ BÃO tới! May mà ruộng đã che ⛺ bạt — cây không sao', 5000);
        else {
          let n = 0;
          S().tiles.forEach((t) => { if (!t.crop) return; const st = AV.tileState(t); if (st.stage < 0 || st.stage >= 2) return; t.plantedAt += DATA.CROPS[t.crop].time * 1000 * 0.2; n++; });
          UI.toast(`🌪️ BÃO tới! ${n} cây bị gió quật đổ, chậm lớn thêm 20% — lần sau mua ⛺ bạt che trong 📋 Quản lý trang trại`, 6000);
          if (n) changed();
        }
      }
    }
    void into;
  }

  /* ================= vẽ ================= */
  const em = (c, s, x, y, size) => { c.fillStyle = '#000'; c.globalAlpha = 1; c.font = `${size}px system-ui, "Segoe UI Emoji", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(s, x, y); };
  function shed(c, x, y, w, h, wall, roof, label) {
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 4, w / 2 + 10, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = wall; c.fillRect(x - w / 2, y - h, w, h);
    c.fillStyle = 'rgba(0,0,0,.08)'; for (let k = 0; k < w; k += 14) c.fillRect(x - w / 2 + k, y - h, 2, h);
    c.fillStyle = roof; c.beginPath(); c.moveTo(x - w / 2 - 14, y - h + 4); c.lineTo(x, y - h - 46); c.lineTo(x + w / 2 + 14, y - h + 4); c.closePath(); c.fill();
    if (label) { c.fillStyle = '#fff8e6'; c.beginPath(); c.roundRect(x - 60, y - h - 18, 120, 22, 6); c.fill(); c.fillStyle = '#5c3a1e'; c.font = '900 12px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, x, y - h - 7); }
  }
  function lotSign(c, x, y, f) {
    c.fillStyle = 'rgba(120,90,50,.25)'; c.beginPath(); c.ellipse(x, y - 20, 90, 34, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6b4423'; c.fillRect(x - 3, y - 70, 6, 70);
    c.fillStyle = '#f3d9a4'; c.beginPath(); c.roundRect(x - 62, y - 110, 124, 46, 8); c.fill(); c.strokeStyle = '#8a5a32'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#5c3a1e'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '20px system-ui, "Segoe UI Emoji"'; c.fillText('🏗️' + f.icon, x, y - 97);
    c.font = '900 10px "Be Vietnam Pro", system-ui'; c.fillText(`Xây ${f.name.split(' (')[0]}`, x, y - 76);
  }

  /* ================= dựng bản đồ ================= */
  function buildMap(H) {
    const { base, ground, obj, sobj, col, inter, paintGrass, addTree, edges } = H;
    const m = base('ranch', '🚜 Trang Trại Mở Rộng', 3000, 1500);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 77);
      g.fillStyle = '#d6b98a';
      g.fillRect(0, 1180, m.w, 70); g.fillRect(200, 360, 70, 900); g.fillRect(200, 760, 2650, 60);
      g.fillStyle = 'rgba(0,0,0,.05)'; for (let x = 0; x < m.w; x += 40) g.fillRect(x, 1180, 20, 70);
    });
    const fac = (k, x, y, box, drawBuilt, ia, extra = {}) => {
      const spr = FX.sprite(drawBuilt, x, y, box), lot = FX.sprite((c) => lotSign(c, x, y, FAC[k]), x, y, { l: -95, t: -120, w: 190, h: 130 });
      m.objects.push({ y, bb: [x + box.l, y + box.t, x + box.l + box.w, y + box.t + box.h], draw: (g, t) => { if (built(k)) { spr(g); if (extra.anim) extra.anim(g, t); } else lot(g); } });
      inter(m, { ...ia, when: () => built(k), indicator: extra.ind, ix: x, iy: y + box.t + 10 });
      inter(m, { x: x - 65, y: y - 112, w: 130, h: 115, ax: x, ay: y + 26, name: `Đất trống: xây ${FAC[k].name}`, use: () => build(k), when: () => !built(k) });
      if (extra.col) m.colliders.push({ ...extra.col, when: () => built(k) });
    };
    const lab = (t, x, y) => m.labels.push({ text: t, x, y });

    /* lối về + bảng quản lý + xe tải */
    sobj(m, 120, 1290, (c) => { c.fillStyle = '#6b4423'; c.fillRect(116, 1190, 8, 100); c.fillStyle = '#2f9e44'; c.beginPath(); c.roundRect(60, 1170, 130, 40, 8); c.fill(); c.fillStyle = '#fff'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⬅ Về nông trại', 125, 1190); }, { l: -70, t: -125, w: 140, h: 130 });
    inter(m, { x: 55, y: 1165, w: 140, h: 130, ax: 125, ay: 1320, name: 'Về nông trại', use: () => AV.teleport('farm', false, 1300, 1500, '🏡 Về nông trại…'), arrow: { x: 125, y: 1150, text: 'Nông trại' } });
    sobj(m, 420, 1260, (c) => { c.fillStyle = '#6b4423'; c.fillRect(352, 1180, 8, 80); c.fillRect(480, 1180, 8, 80); c.fillStyle = '#8a5a32'; c.beginPath(); c.roundRect(336, 1110, 168, 84, 10); c.fill(); c.fillStyle = '#fff3d6'; c.beginPath(); c.roundRect(344, 1118, 152, 68, 7); c.fill(); c.fillStyle = '#5c3a1e'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.fillText('📋 QUẢN LÝ', 420, 1138); c.font = '800 11px "Be Vietnam Pro", system-ui'; c.fillText('Xây · Đơn hàng · Hội chợ', 420, 1160); c.fillText('Trang trí · Xe & đồ', 420, 1175); }, { l: -90, t: -155, w: 180, h: 160 });
    col(m, 340, 1250, 160, 12);
    inter(m, { x: 336, y: 1110, w: 168, h: 150, ax: 420, ay: 1300, name: 'Bảng quản lý trang trại', use: () => panel('build'), arrow: { x: 420, y: 1095, text: 'Quản lý' } });
    sobj(m, 720, 1270, (c) => { em(c, '🚚', 720, 1270, 120); c.fillStyle = '#fff'; c.beginPath(); c.roundRect(660, 1120, 120, 26, 6); c.fill(); c.fillStyle = '#c92a2a'; c.font = '900 12px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('📦 ĐƠN HÀNG', 720, 1133); }, { l: -80, t: -160, w: 160, h: 170 });
    col(m, 660, 1240, 120, 26);
    sobj(m, 580, 1265, (c) => {
      c.fillStyle = '#6b4423'; c.fillRect(530, 1175, 8, 90); c.fillRect(622, 1175, 8, 90);
      c.fillStyle = '#c92a2a'; c.beginPath(); c.roundRect(516, 1100, 128, 92, 10); c.fill();
      c.fillStyle = '#fff8e1'; c.beginPath(); c.roundRect(522, 1106, 116, 80, 7); c.fill();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '26px system-ui, "Segoe UI Emoji"'; c.fillText('📖', 580, 1126);
      c.fillStyle = '#c92a2a'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.fillText('HƯỚNG DẪN', 580, 1150);
      c.fillStyle = '#5c3a1e'; c.font = '800 10px "Be Vietnam Pro", system-ui'; c.fillText('LÊN CẤP TRANG TRẠI', 580, 1167);
    }, { l: -70, t: -170, w: 140, h: 175 });
    col(m, 525, 1255, 110, 10);
    inter(m, { x: 516, y: 1100, w: 128, h: 165, ax: 580, ay: 1300, name: 'Biển hướng dẫn: làm gì để nâng cấp trang trại', use: () => guide(), arrow: { x: 580, y: 1085, text: 'Hướng dẫn' }, indicator: () => (R().guided ? null : '❓'), ix: 580, iy: 1092 });
    inter(m, { x: 650, y: 1150, w: 140, h: 120, ax: 720, ay: 1310, name: 'Xe tải giao hàng (đơn hàng mỗi ngày)', use: () => panel('orders'), indicator: () => (orders().some((o) => !o.done && has(o.need)) ? '📦' : null), ix: 720, iy: 1120 });
    // cúp hội chợ + tượng vàng
    obj(m, 1260, (c) => { const n = R().trophies || 0; if (!n) return; em(c, '🏆', 960, 1260, 54); c.fillStyle = '#5c3a1e'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.fillText(`×${n} vô địch hội chợ`, 960, 1280); }, [900, 1180, 1020, 1290]);

    /* hàng 1: cây lâu năm */
    lab('🌳 Vườn cây lâu năm', 1400, 590);
    TREES.forEach((T, i) => {
      const x = 500 + i * 450, y = 545;
      m.objects.push({ y, bb: [x - 90, y - 240, x + 90, y + 10], draw: (c) => {
        if (!built('orchard')) { if (i === 2) lotSign(c, x, y, FAC.orchard); return; }
        c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x, y + 2, 60, 12, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#6b4423'; c.fillRect(x - 9, y - 80, 18, 82);
        c.fillStyle = T.col; [[0, -140, 70], [-48, -110, 46], [48, -110, 46], [0, -95, 52]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx, y + dy, r, 0, Math.PI * 2); c.fill(); });
        c.fillStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(x - 20, y - 160, 30, 0, Math.PI * 2); c.fill();
        if (treeRipe(i)) [[-30, -120], [25, -140], [0, -100], [40, -100], [-45, -95]].forEach(([dx, dy]) => em(c, icon(T.id), x + dx, y + dy, 24));
        c.fillStyle = '#fff8e6'; c.beginPath(); c.roundRect(x - 56, y - 232, 112, 18, 5); c.fill(); c.fillStyle = '#5c3a1e'; c.font = '800 10px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`${T.name} · ${T.ss.map((s) => SSN[s].split(' ')[0]).join('')}`, x, y - 223);
      } });
      inter(m, { x: x - 80, y: y - 210, w: 160, h: 215, ax: x, ay: y + 50, name: `${T.name} (hái quả)`, use: () => useTree(i), when: () => built('orchard'), indicator: () => (built('orchard') && treeRipe(i) ? icon(T.id) : null), ix: x, iy: y - 220 });
      m.colliders.push({ x: x - 14, y: y - 12, w: 28, h: 14, when: () => built('orchard') });
    });
    inter(m, { x: 1400 - 65, y: 545 - 112, w: 130, h: 115, ax: 1400, ay: 575, name: 'Đất trống: trồng vườn cây lâu năm', use: () => build('orchard'), when: () => !built('orchard') });

    /* hàng 2: vật nuôi (y ≈ 680) */
    fac('duck', 520, 700, { l: -170, t: -140, w: 340, h: 150 }, (c) => { ART.lake(c, 520, 650, 150, 60, 0); }, { x: 370, y: 590, w: 300, h: 120, ax: 520, ay: 740, name: 'Ao vịt (cho ăn / nhặt trứng)', use: () => useAnimal('duck') },
      { ind: () => animalInd('duck'), anim: (g, t) => { for (let k = 0; k < 4; k++) em(g, '🦆', 520 + Math.sin(t * 0.4 + k * 1.6) * 110, 660 + Math.cos(t * 0.5 + k) * 28, 30); }, col: { x: 380, y: 610, w: 280, h: 80 } });
    fac('fish', 1000, 700, { l: -170, t: -140, w: 340, h: 150 }, (c) => { ART.lake(c, 1000, 650, 150, 60, 0); c.strokeStyle = '#8a5a32'; c.lineWidth = 3; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(880 + k * 48, 610); c.lineTo(880 + k * 48, 700); c.stroke(); } }, { x: 850, y: 590, w: 300, h: 120, ax: 1000, ay: 740, name: 'Ao nuôi cá (thả cá giống / kéo lưới)', use: useFish },
      { ind: () => { const f = R().fishpond; if (!f || !f.at) return '🐟'; const left = f.at + 3 * 3600e3 - now(); return left <= 0 ? '🎣' : { p: 1 - left / (3 * 3600e3), left: left / 1000 }; }, anim: (g, t) => { const f = R().fishpond; if (!f || !f.at) return; g.fillStyle = 'rgba(255,255,255,.6)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(900 + ((k * 53 + t * 30) % 200), 630 + (k % 3) * 18, 4 + Math.sin(t * 3 + k) * 2, 0, 7); g.fill(); } }, col: { x: 860, y: 610, w: 280, h: 80 } });
    if (true) obj(m, 690, (c) => { if (!R().deco.bridge || !built('fish')) return; c.fillStyle = '#8a5a32'; c.fillRect(940, 640, 120, 22); c.fillStyle = '#6b4423'; for (let k = 0; k < 7; k++) c.fillRect(942 + k * 17, 640, 3, 22); c.fillRect(940, 630, 120, 5); }, [930, 620, 1070, 670]);
    fac('bee', 1460, 700, { l: -110, t: -150, w: 220, h: 160 }, (c) => { [[-60, 0], [0, -6], [60, 0]].forEach(([dx, dy]) => { c.fillStyle = '#6b4423'; c.fillRect(1460 + dx - 4, 640 + dy, 8, 60); c.fillStyle = '#ffd43b'; c.beginPath(); c.roundRect(1460 + dx - 28, 590 + dy, 56, 56, 6); c.fill(); c.fillStyle = '#e8a10e'; for (let k = 0; k < 4; k++) c.fillRect(1460 + dx - 28, 600 + dy + k * 12, 56, 3); c.fillStyle = '#5c3a1e'; c.beginPath(); c.arc(1460 + dx, 632 + dy, 5, 0, 7); c.fill(); }); }, { x: 1360, y: 580, w: 200, h: 120, ax: 1460, ay: 740, name: 'Tổ ong (lấy mật)', use: useBee },
      { ind: () => { const { b } = honeyNow(); return b.stock ? '🍯' : null; }, anim: (g, t) => { for (let k = 0; k < 6; k++) em(g, '🐝', 1460 + Math.sin(t * 2 + k) * 90, 600 + Math.cos(t * 2.6 + k * 2) * 40, 16); }, col: { x: 1380, y: 640, w: 160, h: 60 } });
    fac('goat', 1950, 720, { l: -170, t: -170, w: 340, h: 180 }, (c) => { c.fillStyle = '#c9a874'; c.fillRect(1800, 600, 300, 110); c.strokeStyle = '#8a5a32'; c.lineWidth = 5; c.strokeRect(1800, 600, 300, 110); for (let k = 0; k < 11; k++) { c.fillStyle = '#a0522d'; c.fillRect(1800 + k * 30, 586, 8, 30); } shed(c, 2060, 640, 70, 50, '#c2410c', '#7a2e0b'); }, { x: 1800, y: 580, w: 300, h: 140, ax: 1950, ay: 760, name: 'Chuồng dê (cho ăn / vắt sữa)', use: () => useAnimal('goat') },
      { ind: () => animalInd('goat'), anim: (g, t) => { for (let k = 0; k < 3; k++) { g.save(); const x = 1870 + Math.sin(t * 0.3 + k * 2) * 70 + k * 30, y = 690 + Math.cos(t * 0.4 + k) * 10; g.translate(x, y); g.scale(Math.cos(t * 0.3 + k * 2) > 0 ? -1 : 1, 1); em(g, '🐐', 0, 0, 36); g.restore(); } }, col: { x: 1800, y: 610, w: 300, h: 90 } });
    fac('horse', 2550, 720, { l: -130, t: -190, w: 260, h: 200 }, (c) => { shed(c, 2550, 720, 200, 110, '#8a5a32', '#5c2a12', '🐎 CHUỒNG NGỰA'); c.fillStyle = '#3d2410'; c.fillRect(2510, 640, 80, 80); }, { x: 2440, y: 570, w: 220, h: 150, ax: 2550, ay: 760, name: 'Chuồng ngựa (lên / xuống ngựa)', use: () => setMount(mount === 'horse' ? null : 'horse') },
      { anim: (g) => { if (mount !== 'horse') em(g, '🐎', 2550, 715, 60); }, col: { x: 2450, y: 640, w: 200, h: 80 } });

    /* hàng 3: xưởng chế biến (y ≈ 1050) */
    lab('🏭 Xưởng chế biến', 900, 880);
    [['mill', 400, '#adb5bd', '#495057', '⚙️'], ['oven', 600, '#e9c46a', '#9c4221', '🔥'], ['juicer', 800, '#b2f2bb', '#2b8a3e', '🧃'], ['pickle', 1000, '#ffe8cc', '#8a5a32', '🫙'], ['cheese', 1200, '#fff3bf', '#e67700', '🧀'], ['loom', 1400, '#e5dbff', '#5f3dc4', '🧶']].forEach(([k, x, wall, roof, ic]) => {
      const y = 1080;
      fac(k, x, y, { l: -90, t: -170, w: 180, h: 180 }, (c) => { shed(c, x, y, 140, 100, wall, roof, FAC[k].name.split(' (')[0].toUpperCase()); c.fillStyle = '#5c3a1e'; c.fillRect(x - 22, y - 56, 44, 56); em(c, ic, x, y - 62, 34); }, { x: x - 75, y: y - 150, w: 150, h: 150, ax: x, ay: y + 30, name: `${FAC[k].name}`, use: () => (k === 'pickle' ? picklePanel() : machinePanel(k)) },
        { ind: () => (k === 'pickle' ? ((R().jars || []).some((j) => j && j.end <= now()) ? '🫙' : null) : machInd(k)), col: { x: x - 70, y: y - 40, w: 140, h: 40 } });
    });
    /* nhà kính */
    fac('greenhouse', 1850, 1080, { l: -190, t: -210, w: 380, h: 220 }, (c) => {
      c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(1850, 1084, 190, 16, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(200,240,255,.75)'; c.beginPath(); c.moveTo(1680, 1080); c.lineTo(1680, 960); c.quadraticCurveTo(1850, 860, 2020, 960); c.lineTo(2020, 1080); c.closePath(); c.fill();
      c.strokeStyle = '#f8f9fa'; c.lineWidth = 4; c.stroke(); c.lineWidth = 2; for (let k = 1; k < 8; k++) { c.beginPath(); c.moveTo(1680 + k * 42.5, 1080); c.lineTo(1680 + k * 42.5, 960 - Math.sin(k / 8 * Math.PI) * 50); c.stroke(); }
      for (let k = 0; k < 8; k++) em(c, ['🍅', '🍓', '🌽', '🍉', '🥕', '🌷', '🍍', '🌻'][k], 1705 + k * 42, 1060, 26);
      c.fillStyle = '#2f9e44'; c.beginPath(); c.roundRect(1790, 1012, 120, 22, 6); c.fill(); c.fillStyle = '#fff'; c.font = '900 12px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏡 NHÀ KÍNH', 1850, 1023);
    }, { x: 1680, y: 900, w: 340, h: 180, ax: 1850, ay: 1120, name: 'Nhà kính (trồng trái mùa)', use: greenhousePanel },
    { ind: () => ((R().gh || []).some((t) => t && t.at + DATA.CROPS[t.crop].time * 800 <= now()) ? '🧺' : null), col: { x: 1680, y: 1040, w: 340, h: 40 } });

    /* ruộng lúa nước + trâu + sân phơi (y ≈ 1380) */
    lab('🌾 Ruộng lúa nước', 1700, 1265);
    m.objects.push({ y: 1300, bb: [1250, 1290, 2550, 1470], draw: (c, t) => {
      if (!built('paddy')) { lotSign(c, 1700, 1420, FAC.paddy); return; }
      for (let i = 0; i < PADDY_N; i++) {
        const x = 1260 + i * 180, y = 1300, s = paddyState(i);
        c.fillStyle = '#6b8e9b'; c.fillRect(x, y, 160, 130); c.strokeStyle = '#8a6b3a'; c.lineWidth = 6; c.strokeRect(x, y, 160, 130);
        c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x + 10, y + 10, 50, 4);
        if (s > 0) { const col = s >= 1 ? '#e8b923' : s > 0.5 ? '#74b816' : '#94d82d', h = 10 + s * 26; c.strokeStyle = col; c.lineWidth = 2.4; for (let r = 0; r < 4; r++) for (let k = 0; k < 7; k++) { const bx = x + 14 + k * 21, by = y + 30 + r * 28; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - 3, by - h); c.moveTo(bx, by); c.lineTo(bx + 4, by - h * 0.9); c.stroke(); } }
      }
      // trâu cày ruộng
      const bx = 1260 + ((t * 25) % 1080), flip = Math.floor(t * 25 / 1080) % 2;
      c.save(); c.translate(flip ? 2340 - (bx - 1260) : bx, 1460); c.scale(flip ? 1 : -1, 1); em(c, '🐃', 0, 0, 52); c.restore();
    } });
    for (let i = 0; i < PADDY_N; i++) { const x = 1260 + i * 180; inter(m, { x, y: 1300, w: 160, h: 130, ax: x + 80, ay: 1290, name: 'Ruộng lúa nước (cấy mạ 30 xu / gặt)', use: () => usePaddy(i), when: () => built('paddy'), indicator: () => (built('paddy') && !(R().paddies || [])[i] ? '🌱' : paddyState(i) >= 1 ? '🌾' : null), ix: x + 80, iy: 1300 }); }
    inter(m, { x: 1630, y: 1340, w: 140, h: 100, ax: 1700, ay: 1290, name: 'Đất trống: làm ruộng lúa nước', use: () => build('paddy'), when: () => !built('paddy') });
    m.objects.push({ y: 1430, bb: [2380, 1300, 2560, 1440], draw: (c) => {
      if (!built('paddy')) return;
      const d = R().dry || {};
      c.fillStyle = '#ced4da'; c.fillRect(2400, 1310, 150, 120); c.strokeStyle = '#868e96'; c.lineWidth = 3; c.strokeRect(2400, 1310, 150, 120);
      if (d.n) { c.fillStyle = d.end <= now() ? '#f8f9fa' : '#e8b923'; for (let k = 0; k < 60; k++) c.fillRect(2410 + (k * 37) % 130, 1320 + (k * 53) % 100, 5, 3); }
      c.fillStyle = '#495057'; c.font = '900 11px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.fillText('☀️ SÂN PHƠI', 2475, 1305);
    } });
    inter(m, { x: 2400, y: 1300, w: 150, h: 130, ax: 2475, ay: 1290, name: 'Sân phơi thóc → gạo', use: useDry, when: () => built('paddy'), indicator: () => { const d = R().dry; return d && d.n && d.end <= now() ? '🍚' : null; }, ix: 2475, iy: 1300 });

    /* máy cày, tượng vàng, trang trí */
    obj(m, 1250, (c) => { if (built('tractor') && mount !== 'tractor') em(c, '🚜', 2250, 1250, 70); }, [2200, 1180, 2300, 1260]);
    inter(m, { x: 2200, y: 1180, w: 100, h: 80, ax: 2250, ay: 1290, name: 'Máy cày (lên xe)', use: () => setMount(mount === 'tractor' ? null : 'tractor'), when: () => built('tractor') });
    obj(m, 1100, (c) => { if (!built('statue')) return; c.fillStyle = '#868e96'; c.fillRect(2510, 1040, 80, 60); em(c, '🧑‍🌾', 2550, 1040, 80); c.fillStyle = 'rgba(255,212,59,.45)'; c.beginPath(); c.arc(2550, 1000, 50, 0, 7); c.fill(); }, [2480, 940, 2620, 1100]);
    obj(m, 820, (c, t) => { if (R().deco.windmill) ART.windmill(c, 2830, 820, t); }, [2700, 560, 2960, 830]);
    obj(m, 880, (c) => { if (!R().deco.well) return; c.fillStyle = '#868e96'; c.beginPath(); c.ellipse(120, 860, 45, 18, 0, 0, 7); c.fill(); c.fillStyle = '#495057'; c.fillRect(75, 830, 90, 30); c.fillStyle = '#1c7ed6'; c.beginPath(); c.ellipse(120, 832, 38, 12, 0, 0, 7); c.fill(); c.fillStyle = '#6b4423'; c.fillRect(78, 760, 8, 72); c.fillRect(154, 760, 8, 72); c.fillStyle = '#c2410c'; c.beginPath(); c.moveTo(66, 768); c.lineTo(120, 730); c.lineTo(174, 768); c.closePath(); c.fill(); }, [60, 720, 180, 880]);
    obj(m, 1170, (c) => { if (!R().deco.lanterns) return; c.strokeStyle = '#5c3a1e'; c.lineWidth = 2; c.beginPath(); c.moveTo(300, 1130); for (let x = 300; x <= 1600; x += 100) c.quadraticCurveTo(x - 50, 1150, x, 1130); c.stroke(); for (let x = 350; x < 1600; x += 100) { c.fillStyle = '#e03131'; c.beginPath(); c.ellipse(x, 1152, 10, 13, 0, 0, 7); c.fill(); c.fillStyle = '#ffd43b'; c.fillRect(x - 3, 1164, 6, 6); } }, [280, 1120, 1620, 1180]);
    obj(m, 1490, (c) => { if (!R().deco.flowerfence) return; for (let x = 20; x < 2980; x += 30) { c.fillStyle = '#fff'; c.fillRect(x, 1462, 6, 30); c.fillStyle = ['#ff6b6b', '#ffd43b', '#f783ac', '#da77f2'][(x / 30) % 4]; c.beginPath(); c.arc(x + 3, 1460, 7, 0, 7); c.fill(); } }, [0, 1440, 3000, 1500]);
    obj(m, 830, (c, t) => { if (R().deco.scarecrow) ART.scarecrow(c, 120, 1060, t); }, [60, 940, 180, 1070]);
    [[2850, 400, 'green'], [2900, 1100, 'fruit'], [100, 400, 'pink']].forEach(([x, y, v]) => addTree(m, x, y, v));
    edges(m);
    m.spawn = { x: 200, y: 1300 };
    m.bounds = { l: 30, t: 360, r: m.w - 30, b: m.h - 30 };
    return m;
  }

  function init() { setInterval(tick, 500); }
  return { init, buildMap, panel, guide, onHarvest, level, mount: () => mount };
})();
