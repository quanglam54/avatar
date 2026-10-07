/* 📱 ĐIỆN THOẠI — mua ở CellphoneS / Thế Giới Di Động (phố trước nông trại, cạnh VinFast).
 * Bấm nút 📱 trên thanh trên cùng để cầm điện thoại: giao diện iPhone hoặc Android tuỳ máy đã mua,
 * có số điện thoại riêng, danh bạ (bạn bè), tin nhắn, gọi điện, máy ảnh chụp màn hình, ngân hàng, bản đồ…
 * Gọi 115 khi ốm → xe cấp cứu hú còi chạy tới tận nơi đưa vào Bệnh viện Zeno.
 * Pin tụt dần (dùng càng nhiều càng tụt), pin yếu sẽ nhắc; sạc ở cửa hàng, sạc dự phòng hoặc ngủ ở nhà. */
const PHONE = (() => {
  const MODELS = [
    { id: 'a16', name: 'Samsung Galaxy A16', os: 'android', price: 4990000, drain: 1, color: '#343a40', tag: 'Pin trâu · giá rẻ' },
    { id: 'redmi', name: 'Xiaomi Redmi Note 14 Pro', os: 'android', price: 7490000, drain: 0.9, color: '#5f3dc4', tag: 'Camera 200MP' },
    { id: 'reno', name: 'OPPO Reno13 5G', os: 'android', price: 12990000, drain: 0.85, color: '#63e6be', tag: 'Chụp chân dung đẹp' },
    { id: 's25u', name: 'Samsung Galaxy S25 Ultra', os: 'android', price: 33990000, drain: 0.7, color: '#495057', tag: 'Bút S Pen · AI' },
    { id: 'fold7', name: 'Samsung Galaxy Z Fold7', os: 'android', price: 46990000, drain: 0.8, color: '#1b2f48', tag: 'Màn hình gập' },
    { id: 'ip16e', name: 'iPhone 16e', os: 'ios', price: 16990000, drain: 0.9, color: '#f1f3f5', tag: 'iPhone giá tốt' },
    { id: 'ip17', name: 'iPhone 17', os: 'ios', price: 24990000, drain: 0.8, color: '#a5d8ff', tag: 'Màn 120Hz' },
    { id: 'ip17pm', name: 'iPhone 17 Pro Max', os: 'ios', price: 42990000, drain: 0.6, color: '#ff922b', tag: 'Pin khủng · cam 48MP' },
    { id: 'ip18', name: 'iPhone 18', os: 'ios', price: 27990000, drain: 0.75, color: '#b197fc', tag: 'MỚI · chip A20' },
    { id: 'ip18p', name: 'iPhone 18 Pro', os: 'ios', price: 36990000, drain: 0.6, color: '#868e96', tag: 'MỚI · camera 3 ống kính' },
    { id: 'ip18pm', name: 'iPhone 18 Pro Max', os: 'ios', price: 49990000, drain: 0.5, color: '#c92a2a', tag: 'MỚI · đỉnh nhất · pin trâu nhất' },
  ];
  const STORES = {
    cps: { name: 'CellphoneS', icon: '🔴', disc: 0.97, note: 'Giảm 3% cho thành viên S-Member' },
    tgdd: { name: 'Thế Giới Di Động', icon: '🟡', disc: 1, note: 'Tặng kèm 1 sạc dự phòng khi mua máy' },
  };
  const POWERBANK = 590000, TRADE_IN = 0.3;
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => AV.S;
  const model = () => (S().phone && MODELS.find((m) => m.id === S().phone.model)) || null;
  const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  /** số điện thoại cố định theo tài khoản: 09xxxxxxxx */
  /** số của mình = SIM đã mua ('' = chưa có SIM) */
  const myNum = () => (S().phone && S().phone.sim) || '';
  const pretty = (n) => String(n || '').replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  const contacts = () => { const ph = S().phone; if (!ph) return []; return (ph.contacts = ph.contacts || []); };
  /** lưu / cập nhật 1 số vào danh bạ */
  function addContact(name, num, uid) {
    num = String(num || '').replace(/\D/g, '');
    if (!/^0\d{9}$/.test(num) || !S().phone) return false;
    const list = contacts(), old = list.find((c) => c.num === num);
    if (old) { old.name = name || old.name; if (uid) old.uid = uid; } else list.push({ name: String(name || num).slice(0, 24), num, uid: uid || '' });
    list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    if (AV.markChanged) AV.markChanged();
    return true;
  }
  const contactOf = (num) => contacts().find((c) => c.num === num);
  /** tra số trên máy chủ → { num, user_id, name, username } */
  async function lookup(num) {
    if (!CLOUD.client) return null;
    const { data, error } = await CLOUD.client.from('phone_sims').select('num, user_id, name, username').eq('num', num).maybeSingle();
    if (error) throw error;
    return data || null;
  }
  /* ---------- 📶 SIM ---------- */
  const NETS = [
    { id: 'viettel', name: 'Viettel', pre: ['086', '096', '097', '098', '032', '033', '035', '037', '039'], col: '#e60012' },
    { id: 'vina', name: 'Vinaphone', pre: ['088', '091', '094', '081', '083', '085'], col: '#0072bc' },
    { id: 'mobi', name: 'Mobifone', pre: ['089', '090', '093', '070', '077', '079'], col: '#005baa' },
  ];
  const SIM_PRICE = 50000;
  /** giá số đẹp: lặp đuôi, tiến, lộc phát, thần tài */
  function simPrice(num) {
    const t = num.slice(3), last4 = num.slice(-4), last3 = num.slice(-3);
    if (/^(\d)\1{6}$/.test(t)) return 9000000000;
    if (/(\d)\1{4}$/.test(num)) return 1500000000;
    if (/(\d)\1{3}$/.test(num)) return 200000000;
    if ('0123456789'.includes(last4) || /(\d\d)\1\1$/.test(num)) return 60000000;
    if (/(\d)\1{2}$/.test(num) || /6868$|8686$|3979$|3939$|7979$/.test(num)) return 20000000;
    if (/68$|86$|79$|39$/.test(num) || '0123456789'.includes(last3)) return 2000000;
    return SIM_PRICE;
  }
  function simOffers(net) {
    const out = [], R = () => Math.floor(Math.random() * 10);
    const pre = () => net.pre[Math.floor(Math.random() * net.pre.length)];
    for (let k = 0; k < 6; k++) out.push(pre() + Array.from({ length: 7 }, R).join(''));
    const d = R(), d2 = R(), s = R();
    out.push(pre() + String(R()) + String(R()) + String(R()) + String(d).repeat(4));
    out.push(pre() + Array.from({ length: 3 }, R).join('') + ['6868', '3979', '8686', '7979'][Math.floor(Math.random() * 4)]);
    out.push(pre() + String(R()) + String(R()) + String(s) + String(s + 1 > 9 ? 0 : s + 1) + String((s + 2) % 10) + String((s + 3) % 10) + String((s + 4) % 10));
    out.push(pre() + String(d2) + String(d).repeat(6));
    return [...new Set(out)].map((num) => ({ num, price: simPrice(num) })).sort((a, b) => a.price - b.price);
  }
  async function buySim(num, price, net) {
    if (!S().phone) return UI.toast('📱 Mua điện thoại trước rồi mới lắp SIM được');
    if (!CLOUD.user || !CLOUD.client) return UI.toast('🔐 Đăng nhập tài khoản mới đăng ký SIM được');
    if (!AV.spend(price)) return false;
    try {
      await CLOUD.client.from('phone_sims').delete().eq('user_id', CLOUD.user.id);
      const { error } = await CLOUD.client.from('phone_sims').insert({ num, user_id: CLOUD.user.id, name: S().name, username: CLOUD.username || '' });
      if (error) throw error;
    } catch (e) {
      AV.earn(price);
      const m = String((e && e.message) || '');
      UI.toast('⚠️ ' + (/duplicate|unique/i.test(m) ? 'Số này vừa có người mua mất rồi, chọn số khác nhé' : /phone_sims|does not exist|Could not find/i.test(m) ? 'Chủ game chưa bật SIM (chạy file supabase/13-vietlott-sim-trom.sql)' : m), 5000);
      return false;
    }
    S().phone.sim = num; S().phone.net = net.name;
    if (AV.markChanged) AV.markChanged();
    UI.toast(`📶 Đã lắp SIM ${net.name}: ${pretty(num)} — giờ gọi điện, nhắn tin, gửi số kết bạn được rồi!`, 6000);
    AV.sayMine('📶 Có số mới nè!');
    return true;
  }
  const friends = () => (S().friends || []).filter((f) => f.uid);

  /* ================= 🛒 CỬA HÀNG ================= */
  function shop(kind) {
    const st = STORES[kind];
    const p = UI.panel(`📱 ${st.name}`, '', { wide: true });
    const render = () => {
      const cur = model(), ph = S().phone;
      const price = (m) => Math.round(m.price * st.disc / 1000) * 1000;
      if (st.simTab) return renderSim();
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu${cur ? ` · Đang dùng: <b>${cur.name}</b> 🔋${Math.round(ph.bat)}%` : ''} · <button class="btn small" data-sim>📶 Mua SIM số${myNum() ? ' (đang dùng ' + pretty(myNum()) + ')' : ''}</button></div>
        <p class="muted">${st.icon} ${st.note}${cur ? ` · Thu cũ đổi mới: máy cũ được trừ <b>${Math.round(TRADE_IN * 100)}%</b> giá` : ''}</p>
        <div class="ph-grid">${MODELS.map((m) => {
          const own = cur && cur.id === m.id, tradeIn = cur && !own ? Math.round(cur.price * TRADE_IN) : 0;
          return `<div class="ph-card ${m.os}"><div class="ph-mini" style="--c:${m.color}"><i></i></div>
            <b>${m.name}</b><small>${m.os === 'ios' ? ' iOS' : '🤖 Android'} · ${m.tag}</small>
            <div class="ph-price">${fmt(price(m))} xu</div>${tradeIn ? `<small class="ph-tradein">Thu cũ: −${fmt(tradeIn)} xu</small>` : ''}
            ${own ? '<button class="btn small ghost" disabled>✅ Đang dùng</button>' : `<button class="btn small" data-buy="${m.id}">Mua ngay</button>`}</div>`;
        }).join('')}</div>
        <div class="shop-list" style="margin-top:10px">
          <div class="shop-row"><span class="ic">🔋</span><div class="info"><b>Sạc dự phòng 20.000mAh</b><small>Sạc đầy pin ở bất cứ đâu · đang có ${(ph && ph.pb) || 0} cái</small></div><button class="btn small" data-pb ${cur ? '' : 'disabled'}>${fmt(POWERBANK)} xu</button></div>
          <div class="shop-row"><span class="ic">🔌</span><div class="info"><b>Cắm sạc miễn phí tại cửa hàng</b><small>Sạc đầy 100% ngay</small></div><button class="btn small ghost" data-charge ${cur && ph.bat < 100 ? '' : 'disabled'}>Cắm sạc</button></div>
        </div>`;
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => {
        const m = MODELS.find((x) => x.id === b.dataset.buy), old = model();
        const cost = price(m) - (old ? Math.round(old.price * TRADE_IN) : 0);
        UI.confirm(`Mua <b>${m.name}</b> giá <b>${fmt(cost)} xu</b>${old ? ` (đã trừ thu cũ ${old.name})` : ''}?`, 'Mua', () => {
          if (!AV.spend(cost)) return;
          const prev = S().phone || {}, pb = (prev.pb || 0) + (kind === 'tgdd' ? 1 : 0);
          S().phone = { ...prev, model: m.id, bat: 100, pb };
          AV.markChanged && AV.markChanged();
          if (old && S().phone) { /* giữ SIM + danh bạ khi đổi máy */ }
          UI.toast(`📱 Đã mua ${m.name}! ${myNum() ? 'SIM cũ đã lắp sang máy mới' : 'Mua thêm 📶 SIM ở ngay quầy này để có số điện thoại'}${kind === 'tgdd' ? ' · 🎁 Tặng 1 sạc dự phòng' : ''}`, 6000);
          AV.sayMine('📱 Máy mới nè!');
          updateBtn(); render();
        });
      });
      p.body.querySelector('[data-sim]').onclick = () => { st.simTab = 1; st.net = st.net || NETS[0]; st.offers = simOffers(st.net); render(); };
      const pbB = p.body.querySelector('[data-pb]');
      if (pbB) pbB.onclick = () => { if (!AV.spend(POWERBANK)) return; S().phone.pb = (S().phone.pb || 0) + 1; UI.toast('🔋 Đã mua sạc dự phòng — mở điện thoại để dùng khi pin yếu'); render(); };
      const ch = p.body.querySelector('[data-charge]');
      if (ch) ch.onclick = () => { charge(100, '🔌 Đã sạc đầy pin ở cửa hàng'); render(); };
    };
    const renderSim = () => {
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu${myNum() ? ` · SIM đang dùng: <b>${pretty(myNum())}</b>` : ''} <button class="btn small ghost" data-back>‹ Về máy</button></div>
        ${model() ? '' : '<p class="wd-note">⚠️ Bạn chưa có điện thoại — mua máy trước rồi mới lắp SIM được.</p>'}
        <div class="tabs">${NETS.map((n) => `<button class="chip ${st.net.id === n.id ? 'on' : ''}" data-net="${n.id}">${n.name}</button>`).join('')}<button class="chip" data-more>🔄 Số khác</button></div>
        <div class="shop-list">${st.offers.map((o) => `<div class="shop-row"><span class="ic">📶</span><div class="info"><b class="ph-simnum">${pretty(o.num)}</b><small>${o.price > SIM_PRICE ? '💎 Số đẹp' : 'Số thường'} · ${st.net.name}</small></div><button class="btn small" data-buysim="${o.num}" ${model() ? '' : 'disabled'}>${fmt(o.price)} xu</button></div>`).join('')}</div>
        <p class="muted small-note">Mỗi người 1 số, không trùng ai. Mua SIM mới thì số cũ bị thu hồi. Số đẹp (đuôi lặp, sảnh tiến, 68 · 79 · 39) giá cao hơn.</p>`;
      p.body.querySelector('[data-back]').onclick = () => { st.simTab = 0; render(); };
      p.body.querySelectorAll('[data-net]').forEach((b) => b.onclick = () => { st.net = NETS.find((n) => n.id === b.dataset.net); st.offers = simOffers(st.net); renderSim(); });
      p.body.querySelector('[data-more]').onclick = () => { st.offers = simOffers(st.net); renderSim(); };
      p.body.querySelectorAll('[data-buysim]').forEach((b) => b.onclick = () => {
        const o = st.offers.find((x) => x.num === b.dataset.buysim);
        UI.confirm(`Mua SIM <b>${st.net.name} ${pretty(o.num)}</b> giá <b>${fmt(o.price)} xu</b>?${myNum() ? '<br><small>Số cũ ' + pretty(myNum()) + ' sẽ bị thu hồi.</small>' : ''}`, 'Mua SIM', async () => { if (await buySim(o.num, o.price, st.net)) { st.simTab = 0; render(); updateBtn(); } });
      });
    };
    render();
  }

  /* ================= 🔋 PIN ================= */
  let openNow = false, warned = 100;
  function charge(to, msg) {
    if (!S().phone) return;
    S().phone.bat = Math.min(100, to); warned = 100;
    if (msg) UI.toast(msg + ` (🔋 ${Math.round(S().phone.bat)}%)`);
    AV.markChanged && AV.markChanged();
    render();
  }
  function battTick() {
    const ph = S() && S().phone, m = model();
    if (!ph || !m || ph.bat <= 0) return;
    const before = ph.bat;
    ph.bat = Math.max(0, ph.bat - (openNow ? 1.5 : 0.25) * m.drain);
    for (const lv of [20, 10, 5]) {
      if (before > lv && ph.bat <= lv && warned > lv) {
        warned = lv;
        UI.toast(`🪫 Điện thoại còn ${lv}% pin — nhớ sạc (cửa hàng điện thoại, sạc dự phòng hoặc về nhà ngủ)!`, 6000);
        beep(880, 0.15); setTimeout(() => beep(660, 0.2), 200);
      }
    }
    if (ph.bat <= 0) { UI.toast('📴 Điện thoại hết pin, đã tắt nguồn. Sạc để dùng tiếp nhé!', 6000); if (openNow) close(); }
    updateBtn();
    if (openNow) statusBar();
  }

  /* ================= 📱 GIAO DIỆN ================= */
  let wrap = null, screen = null, app = 'home';
  const APPS = [
    { id: 'call', icon: '📞', name: 'Điện thoại', bg: 'linear-gradient(#5ef08a,#28c450)' },
    { id: 'msg', icon: '💬', name: 'Tin nhắn', bg: 'linear-gradient(#6ef07a,#2fbf47)' },
    { id: 'contacts', icon: '👤', name: 'Danh bạ', bg: 'linear-gradient(#dee2e6,#adb5bd)' },
    { id: 'camera', icon: '📷', name: 'Máy ảnh', bg: 'linear-gradient(#868e96,#343a40)' },
    { id: 'map', icon: '🗺️', name: 'Bản đồ', bg: 'linear-gradient(#e7f5ff,#74c0fc)' },
    { id: 'bank', icon: '🏦', name: 'QL Bank', bg: 'linear-gradient(#2f9e44,#00502b)' },
    { id: 'quest', icon: '📜', name: 'Nhiệm vụ', bg: 'linear-gradient(#ffe8a3,#f59f00)' },
    { id: 'lotto', icon: '🎰', name: 'Vietlott', bg: 'linear-gradient(#ff8787,#c92a2a)' },
    { id: 'weather', icon: '🌤️', name: 'Thời tiết', bg: 'linear-gradient(#74c0fc,#1c7ed6)' },
    { id: 'clock', icon: '⏰', name: 'Đồng hồ', bg: 'linear-gradient(#343a40,#000)' },
    { id: 'health', icon: '❤️', name: 'Sức khoẻ', bg: 'linear-gradient(#fff,#f1f3f5)' },
    { id: 'settings', icon: '⚙️', name: 'Cài đặt', bg: 'linear-gradient(#adb5bd,#495057)' },
  ];
  const DOCK = ['call', 'msg', 'camera', 'map'];
  const vnTime = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  function updateBtn() {
    const b = document.getElementById('btnChat');
    if (!b) return;
    b.textContent = '📱';
    b.title = 'Điện thoại';
    const ph = S() && S().phone;
    b.classList.toggle('ph-low', !!(ph && ph.bat <= 20));
  }
  function open() {
    const m = model();
    if (!m) {
      const p = UI.panel('📱 Bạn chưa có điện thoại', `<p>Mua điện thoại ở <b>🔴 CellphoneS</b> hoặc <b>🟡 Thế Giới Di Động</b> — phố trước cổng nông trại, cạnh VinFast.</p>
        <p class="muted">Có điện thoại để: nhận số riêng, gửi số kết bạn, nhắn tin, gọi <b>115</b> khi ốm để xe cấp cứu đến đón, chụp ảnh màn hình…</p>
        <div class="row-end" style="justify-content:center"><button class="btn" data-go>🛵 Đến cửa hàng</button></div>`);
      p.body.querySelector('[data-go]').onclick = () => { p.close(); AV.teleport('farm', false, 3160, 1500, '📱 Đến cửa hàng điện thoại…'); };
      return;
    }
    if (S().phone.bat <= 0) {
      const p = UI.panel('📴 Hết pin', `<div class="tr-chest">🪫</div><p class="confirm-text">Điện thoại hết pin rồi.</p>`);
      if (S().phone.pb) p.body.insertAdjacentHTML('beforeend', `<div class="row-end" style="justify-content:center"><button class="btn" data-pb>🔋 Dùng sạc dự phòng (còn ${S().phone.pb})</button></div>`);
      else p.body.insertAdjacentHTML('beforeend', '<p class="muted">Sạc ở cửa hàng điện thoại, hoặc về nhà ngủ một giấc.</p>');
      const b = p.body.querySelector('[data-pb]');
      if (b) b.onclick = () => { usePb(); p.close(); open(); };
      return;
    }
    if (wrap) return close();
    openNow = true; app = 'home';
    wrap = document.createElement('div');
    wrap.className = 'ph-wrap';
    wrap.innerHTML = `<div class="ph ${m.os}" style="--c:${m.color}"><div class="ph-cut"></div><div class="ph-scr"><div class="ph-sb"></div><div class="ph-app"></div></div><div class="ph-home" title="Màn hình chính"></div></div>`;
    document.body.appendChild(wrap);
    screen = wrap.querySelector('.ph-scr');
    wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) close(); });
    wrap.querySelector('.ph-home').onclick = () => (app === 'home' ? close() : go('home'));
    render();
  }
  function close() { if (wrap) { wrap.remove(); wrap = null; screen = null; } openNow = false; }
  const go = (a) => { app = a; render(); };
  function usePb() {
    if (!S().phone || !S().phone.pb) return;
    S().phone.pb--; charge(100, '🔋 Đã cắm sạc dự phòng');
  }
  function statusBar() {
    if (!screen) return;
    const b = Math.round(S().phone.bat), m = model();
    screen.querySelector('.ph-sb').innerHTML = m.os === 'ios'
      ? `<b>${vnTime()}</b><span class="ph-isl"></span><span>${myNum() ? '📶' : '<small>Không SIM</small>'} <i class="ph-bat ${b <= 20 ? 'low' : ''}"><u style="width:${b}%"></u></i> ${b}%</span>`
      : `<span>${vnTime()} ✉</span><span>${myNum() ? (S().phone.net || '') + ' 📶' : 'Không SIM'} ${b}% <i class="ph-bat ${b <= 20 ? 'low' : ''}"><u style="width:${b}%"></u></i></span>`;
  }
  function header(title) { return `<div class="ph-head"><button class="ph-back" data-back>‹ Về</button><b>${title}</b><span></span></div>`; }

  function render() {
    if (!screen) return;
    statusBar();
    const box = screen.querySelector('.ph-app'), m = model();
    box.className = 'ph-app ' + app;
    if (app === 'home') {
      const icon = (a) => `<button class="ph-ic" data-app="${a.id}"><span style="background:${a.bg}">${a.icon}</span><small>${a.name}</small></button>`;
      const unread = document.getElementById('btnSocial') ? +(document.getElementById('btnSocial').dataset.n || 0) : 0;
      box.innerHTML = (m.os === 'android' ? '<div class="ph-search">🔍 Tìm trên điện thoại</div>' : `<div class="ph-widget"><b>${vnTime()}</b><small>${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}</small></div>`)
        + `<div class="ph-grid-ic">${APPS.filter((a) => m.os === 'android' || !DOCK.includes(a.id)).map(icon).join('')}</div>`
        + (m.os === 'ios' ? `<div class="ph-dock">${DOCK.map((id) => icon(APPS.find((a) => a.id === id))).join('')}</div>` : '<div class="ph-nav"><i>|||</i><i>◯</i><i>‹</i></div>');
      if (unread) box.querySelectorAll('[data-app="msg"] span').forEach((s) => s.insertAdjacentHTML('beforeend', `<em class="ph-badge">${unread}</em>`));
      box.querySelectorAll('[data-app]').forEach((b) => b.onclick = () => openApp(b.dataset.app));
      return;
    }
    const back = () => { const bk = box.querySelector('[data-back]'); if (bk) bk.onclick = () => go('home'); };
    if (app === 'call') {
      box.innerHTML = header('Điện thoại') + `<div class="ph-dial"><div class="ph-num"></div><div class="ph-numname"></div>
        <div class="ph-keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}</div>
        <div class="ph-dial-row"><button class="ph-del" data-del>⌫</button><button class="ph-callbtn" data-call>📞</button><button class="ph-del" data-q>115</button></div>
        <button class="ph-addc" data-addc hidden>➕ Thêm vào danh bạ</button>
        <p class="ph-hint">🚑 115 cấp cứu · 🚓 113 · 🚒 114${myNum() ? '' : '<br>⚠️ Chưa có SIM — chỉ gọi được số khẩn cấp'}</p></div>`;
      back();
      let num = dialPre || ''; dialPre = '';
      const show = () => {
        box.querySelector('.ph-num').textContent = num.length === 10 ? pretty(num) : num || ' ';
        const c = contactOf(num);
        box.querySelector('.ph-numname').textContent = c ? c.name : '';
        box.querySelector('[data-addc]').hidden = !(num.length === 10 && /^0/.test(num) && !c && num !== myNum());
      };
      box.querySelector('[data-addc]').onclick = () => newContact(num);
      box.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { if (num.length < 12) num += b.dataset.k; beep(700 + (+b.dataset.k || 0) * 40, 0.06); show(); });
      box.querySelector('[data-del]').onclick = () => { num = num.slice(0, -1); show(); };
      box.querySelector('[data-q]').onclick = () => { num = '115'; show(); };
      box.querySelector('[data-call]').onclick = () => { if (num) dial(num); };
      show();
    } else if (app === 'contacts') {
      const list = contacts();
      box.innerHTML = header('Danh bạ').replace('<span></span>', '<button class="ph-back" data-new>＋</button>') + `<div class="ph-me"><b>${esc(S().name)}</b><span>${myNum() ? 'Số của tôi: ' + pretty(myNum()) : 'Chưa có SIM — mua ở CellphoneS / Thế Giới Di Động'}</span></div>
        <div class="ph-list">${list.length ? list.map((c, i) => `<div class="ph-row" data-open="${i}"><span class="ph-av">${esc((c.name || '?')[0].toUpperCase())}</span><div><b>${esc(c.name)}</b></div><span class="ph-chev">›</span></div>`).join('')
        : '<p class="ph-empty">Danh bạ trống.<br>Bấm <b>＋</b> để lưu số, hoặc gặp người chơi khác → bấm vào họ → <b>📱 Gửi số điện thoại</b>.</p>'}</div>`;
      back();
      box.querySelector('[data-new]').onclick = () => newContact('');
      box.querySelectorAll('[data-open]').forEach((b) => b.onclick = () => { contactSel = list[+b.dataset.open]; go('contact'); });
    } else if (app === 'contact') {
      const c = contactSel;
      if (!c) return go('contacts');
      box.innerHTML = header('Liên hệ').replace("data-back>‹ Về", "data-back2>‹ Danh bạ") + `<div class="ph-card1"><div class="ph-av big">${esc((c.name || '?')[0].toUpperCase())}</div><b>${esc(c.name)}</b>
        <div class="ph-acts"><button data-c="call">📞<small>gọi</small></button><button data-c="sms">💬<small>nhắn tin</small></button><button data-c="del">🗑️<small>xoá</small></button></div>
        <div class="ph-row2"><small>di động</small><br><b class="ph-simnum">${pretty(c.num)}</b></div></div>`;
      box.querySelector('[data-back2]').onclick = () => go('contacts');
      box.querySelector('[data-c="call"]').onclick = () => { dialPre = c.num; go('call'); };
      box.querySelector('[data-c="sms"]').onclick = () => smsTo(c.num);
      box.querySelector('[data-c="del"]').onclick = () => { const l = contacts(); l.splice(l.indexOf(c), 1); if (AV.markChanged) AV.markChanged(); go('contacts'); };
    } else if (app === 'msg') {
      box.innerHTML = header('Tin nhắn').replace('<span></span>', '<button class="ph-back" data-compose>✏️</button>') + '<div class="ph-threads"><p class="ph-empty">⏳ Đang tải…</p></div>';
      back();
      box.querySelector('[data-compose]').onclick = () => { const n = prompt('Nhắn tin tới số điện thoại:'); if (n) smsTo(n); };
      loadThreads(box.querySelector('.ph-threads'));
    } else if (app === 'weather') {
      const rain = AV.rainLevel() > 0.05, sea = typeof SEASON !== 'undefined' ? SEASON.now() : null;
      box.innerHTML = header('Thời tiết') + `<div class="ph-wx"><small>Thành phố Zeno</small><div class="ph-wx-big">${rain ? '🌧️' : new Date().getHours() >= 18 || new Date().getHours() < 6 ? '🌙' : '☀️'}</div>
        <b>${rain ? 'Đang mưa' : 'Trời quang'} · ${rain ? 24 : 31}°</b><small>${sea ? 'Mùa ' + (sea.name || '') : ''}</small>
        <p>${rain ? 'Mưa thì cây không cần tưới 💧 — và biết đâu có <b>mưa tiền</b>!' : 'Nắng đẹp, ra đồng thôi 🌾'}</p></div>`;
      back();
    } else if (app === 'clock') {
      const golden = typeof EVENTS !== 'undefined' && EVENTS.golden();
      const mh = typeof EVENTS !== 'undefined' ? EVENTS.merchantHours().map((h) => h + 'h').join(' · ') : '';
      box.innerHTML = header('Đồng hồ') + `<div class="ph-clock"><b>${vnTime()}</b>
        <div class="ph-row2">⏰ Giờ vàng x2: <b>20h–21h</b>${golden ? ' 🔥 ĐANG DIỄN RA' : ''}</div>
        <div class="ph-row2">🎰 Vietlott quay: <b>mỗi 2 tiếng (giờ chẵn)</b></div>${mh ? `<div class="ph-row2">🛒 Thương lái: <b>${mh}</b></div>` : ''}</div>`;
      back();
    } else if (app === 'health') {
      const sick = AV.isSick(), en = Math.round(AV.energy());
      box.innerHTML = header('Sức khoẻ') + `<div class="ph-clock"><div class="ph-wx-big">${sick ? '🤒' : '💪'}</div>
        <b>${sick ? 'Đang ốm sốt' : 'Khoẻ mạnh'}</b><div class="ph-row2">⚡ Năng lượng: <b>${en}/100</b></div><div class="ph-row2">🔋 Pin điện thoại: <b>${Math.round(S().phone.bat)}%</b></div>
        ${sick ? '<button class="ph-big red" data-115>🚑 Gọi 115 cấp cứu</button>' : ''}${S().phone.pb ? `<button class="ph-big" data-pb>🔋 Dùng sạc dự phòng (còn ${S().phone.pb})</button>` : ''}</div>`;
      back();
      const e = box.querySelector('[data-115]'); if (e) e.onclick = () => dial('115');
      const pb = box.querySelector('[data-pb]'); if (pb) pb.onclick = usePb;
    } else if (app === 'calling') {
      box.innerHTML = `<div class="ph-calling"><div class="ph-av big">${esc(callInfo.icon)}</div><b>${esc(callInfo.name)}</b><small>${esc(callInfo.num)}</small><p class="ph-cstate">${esc(callInfo.state)}</p><button class="ph-hang" data-hang>📵</button></div>`;
      box.querySelector('[data-hang]').onclick = () => { callInfo.cancel = true; stopRing(); go('home'); };
    }
  }

  function openApp(id) {

    if (id === 'map') { close(); return UI.cityMap(false); }
    if (id === 'bank') { close(); return BANK.panel('atm'); }
    if (id === 'quest') { close(); return UI.questsPanel(); }
    if (id === 'lotto') { close(); return typeof LOTTO !== 'undefined' ? LOTTO.panel('result') : null; }
    if (id === 'settings') { close(); return UI.settings(); }
    if (id === 'camera') return snap();
    go(id);
  }

  /* ---------- 📷 máy ảnh: chụp màn hình game ---------- */
  function snap() {
    const cv = document.getElementById('game');
    if (!cv) return;
    const flash = document.createElement('div'); flash.className = 'ph-flash'; document.body.appendChild(flash); setTimeout(() => flash.remove(), 400);
    beep(1500, 0.05);
    let url;
    try { url = cv.toDataURL('image/jpeg', 0.85); } catch (e) { return UI.toast('Không chụp được màn hình này'); }
    close();
    const p = UI.panel('📷 Ảnh vừa chụp', `<div class="ci-full"><img src="${url}" alt="ảnh chụp"></div>
      <div class="row-end" style="justify-content:center;flex-wrap:wrap"><a class="btn ghost" href="${url}" download="avatar-${Date.now()}.jpg">💾 Lưu về máy</a>${typeof CHATIMG !== 'undefined' ? '<button class="btn" data-send>📤 Gửi vào chat khu vực</button>' : ''}</div>`, { wide: true });
    const sb = p.body.querySelector('[data-send]');
    if (sb) sb.onclick = async () => { const blob = await (await fetch(url)).blob(); p.close(); CHATIMG.pickAndSend(new File([blob], 'chup.jpg', { type: 'image/jpeg' }), (u) => AV.sayImage(u)); };
  }

  /* ---------- 📞 gọi điện ---------- */
  let callInfo = null, dialPre = '', contactSel = null;
  /** lưu số mới (hỏi tên) */
  function newContact(num) {
    const n = String(num || prompt('Số điện thoại:') || '').replace(/\D/g, '');
    if (!/^0\d{9}$/.test(n)) return n && UI.toast('Số điện thoại phải có 10 chữ số, bắt đầu bằng 0');
    const name = prompt('Tên liên hệ:', (contactOf(n) || {}).name || '');
    if (!name) return;
    addContact(name.trim(), n);
    UI.toast(`📇 Đã lưu ${name} · ${pretty(n)} vào danh bạ`);
    render();
  }
  /** mở khung nhắn tin với 1 số */
  async function smsTo(raw) {
    const num = String(raw).replace(/\D/g, '');
    if (!myNum()) return UI.toast('📶 Cần lắp SIM mới nhắn tin được');
    try {
      const who = await lookup(num);
      if (!who) return UI.toast('Số này chưa có ai dùng 📵');
      if (who.user_id === (CLOUD.user && CLOUD.user.id)) return UI.toast('Đây là số của bạn 😄');
      const c = contactOf(num); if (c && !c.uid) c.uid = who.user_id;
      close();
      SOCIAL.openChat({ uid: who.user_id, username: who.username || '', name: (c && c.name) || who.name || pretty(num) });
    } catch (e) { UI.toast('⚠️ Chưa bật SIM (chạy file supabase/13-vietlott-sim-trom.sql)', 5000); }
  }
  /** danh sách cuộc trò chuyện kiểu iPhone */
  async function loadThreads(el) {
    if (!CLOUD.user || !CLOUD.client) { el.innerHTML = '<p class="ph-empty">🔐 Đăng nhập tài khoản để nhắn tin</p>'; return; }
    const me = CLOUD.user.id;
    const { data, error } = await CLOUD.client.from('messages').select('id, from_user, to_user, from_name, from_username, kind, body, read, created_at').in('kind', ['chat', 'gift']).or(`from_user.eq.${me},to_user.eq.${me}`).order('created_at', { ascending: false }).limit(300);
    if (error) { el.innerHTML = '<p class="ph-empty">⚠️ Không tải được tin nhắn</p>'; return; }
    const th = new Map();
    (data || []).forEach((m) => {
      const other = m.from_user === me ? m.to_user : m.from_user;
      const t = th.get(other) || { uid: other, last: m, unread: 0, name: '', username: '' };
      if (m.created_at > t.last.created_at) t.last = m;
      if (m.from_user !== me) { t.name = t.name || m.from_name; t.username = t.username || m.from_username; if (!m.read && m.kind === 'chat') t.unread++; }
      th.set(other, t);
    });
    const list = [...th.values()].sort((a, b) => (a.last.created_at < b.last.created_at ? 1 : -1));
    let sims = [];
    try { const r = await CLOUD.client.from('phone_sims').select('num, user_id, name, username').in('user_id', list.map((t) => t.uid)); sims = r.data || []; } catch (e) { /* chưa bật SIM */ }
    const fr = S().friends || [];
    list.forEach((t) => {
      const sim = sims.find((s) => s.user_id === t.uid), f = fr.find((x) => x.uid === t.uid), c = contacts().find((x) => x.uid === t.uid || (sim && x.num === sim.num));
      t.username = t.username || (sim && sim.username) || (f && f.username) || '';
      t.title = c ? c.name : sim ? pretty(sim.num) : t.name || (f && f.name) || 'Người chơi';
      t.name = (c && c.name) || t.name || (f && f.name) || (sim && sim.name) || t.title;
    });
    if (!el.isConnected) return;
    const when = (iso) => { const d = new Date(iso), n = new Date(); return d.toDateString() === n.toDateString() ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' }); };
    const prev = (m) => { const g = m.body || {}; return m.kind === 'gift' ? '🎁 Quà tặng' : g.img ? '📷 Ảnh' : g.st ? '[Nhãn dán]' : String(g.text || ''); };
    el.innerHTML = list.length ? list.map((t, i) => `<div class="ph-th" data-t="${i}"><i class="ph-dot ${t.unread ? 'on' : ''}"></i><span class="ph-av">👤</span><div class="ph-thb"><div><b>${esc(t.title)}</b><small>${when(t.last.created_at)} ›</small></div><p>${t.last.from_user === me ? 'Bạn: ' : ''}${esc(prev(t.last)).slice(0, 80)}</p></div></div>`).join('')
      : '<p class="ph-empty">Chưa có tin nhắn nào.<br>Bấm ✏️ để nhắn tới một số điện thoại.</p>';
    el.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { const t = list[+b.dataset.t]; close(); SOCIAL.openChat({ uid: t.uid, username: t.username, name: t.name }); });
  }
  function dial(num) {
    num = String(num).replace(/\D/g, '');
    const emergency = ['115', '113', '114'].includes(num);
    if (!emergency && !myNum()) { UI.toast('📶 Chưa có SIM — mua SIM ở CellphoneS / Thế Giới Di Động để gọi điện'); return; }
    const c = contactOf(num);
    const f = c ? { name: c.name } : null;
    callInfo = { num: num.length === 10 ? pretty(num) : num, name: num === '115' ? 'Cấp cứu 115' : num === '113' ? 'Công an 113' : num === '114' ? 'Cứu hoả 114' : f ? (f.name || f.username) : num === myNum() ? 'Chính bạn' : 'Số lạ', icon: num === '115' ? '🚑' : num === '113' ? '🚓' : num === '114' ? '🚒' : f ? (f.name || '?')[0].toUpperCase() : '📞', state: 'Đang gọi…', cancel: false };
    go('calling');
    S().phone.bat = Math.max(0, S().phone.bat - 1);
    ring();
    const later = (ms, fn) => setTimeout(() => { if (!callInfo.cancel && wrap) fn(); }, ms);
    const say = (t) => { callInfo.state = t; render(); };
    if (num === '115') {
      later(2600, () => {
        stopRing();
        if (!AV.isSick()) { say('Tổng đài 115: Bạn đang khoẻ mạnh, xe cấp cứu chỉ đi đón người ốm sốt nhé!'); later(3500, () => go('home')); return; }
        say('Trung tâm cấp cứu 115 xin nghe… Đã nhận định vị, xe cấp cứu đang tới!');
        later(2200, () => { close(); ambulance(); });
      });
    } else if (num === '113' || num === '114') {
      later(2200, () => { stopRing(); say(num === '113' ? '113: Bị hái trộm thì nuôi chó giữ nhà nhé 🐕' : '114: Khu vực của bạn không có cháy 🔥 — cảm ơn đã báo!'); later(3200, () => go('home')); });
    } else if (num === myNum()) {
      later(1200, () => { stopRing(); say('Máy bận — bạn đang gọi chính mình 😅'); later(2500, () => go('home')); });
    } else {
      lookup(num).then((who) => {
        if (!who) { later(1800, () => { stopRing(); say('Số máy quý khách vừa gọi không tồn tại. Xin vui lòng kiểm tra lại.'); later(3200, () => go('home')); }); return; }
        if (!f) { callInfo.name = who.name || callInfo.num; render(); }
        if (typeof CALL !== 'undefined') {
          stopRing(); close();
          if (c && !c.uid) c.uid = who.user_id;
          CALL.start({ uid: who.user_id, name: callInfo.name, num, username: who.username || '' }, () => {
            CLOUD.client.from('messages').insert({ to_user: who.user_id, from_name: S().name, from_username: CLOUD.username, kind: 'chat', body: { text: `📞 Cuộc gọi nhỡ từ ${S().name} (${pretty(myNum())})` } }).then(() => {}, () => {});
            UI.toast(`📵 ${callInfo.name} không nghe máy — đã gửi thông báo cuộc gọi nhỡ`, 4000);
          });
          return;
        }
        later(3800, () => {
          stopRing();
          say(`${callInfo.name} không nghe máy — đã gửi thông báo cuộc gọi nhỡ`);
          CLOUD.client.from('messages').insert({ to_user: who.user_id, from_name: S().name, from_username: CLOUD.username, kind: 'chat', body: { text: `📞 Cuộc gọi nhỡ từ ${S().name} (${pretty(myNum())})` } }).then(() => {}, () => {});
          if (c && !c.uid) c.uid = who.user_id;
          later(2500, () => { close(); SOCIAL.openChat({ uid: who.user_id, username: who.username || '', name: callInfo.name }); });
        });
      }).catch(() => { later(1500, () => { stopRing(); say('Mạng di động chưa sẵn sàng (chủ game chưa bật SIM)'); later(3000, () => go('home')); }); });
    }
  }

  /* ---------- âm thanh ---------- */
  let ac = null, ringT = null;
  const audio = () => { try { return (ac = ac || new (window.AudioContext || window.webkitAudioContext)()); } catch (e) { return null; } };
  function beep(f, dur = 0.1, vol = 0.05, type = 'sine') {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = f; g.gain.value = vol; o.connect(g); g.connect(a.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur); o.stop(a.currentTime + dur + 0.02);
  }
  function ring() { stopRing(); const tut = () => { beep(425, 1, 0.04); }; tut(); ringT = setInterval(tut, 1800); }
  function stopRing() { clearInterval(ringT); ringT = null; }
  /** còi xe cứu thương hi-lo, to dần khi xe lại gần */
  function siren(sec, loud) {
    const a = audio(); if (!a) return () => {};
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'square'; g.gain.value = 0.0001; o.connect(g); g.connect(a.destination);
    const t0 = a.currentTime;
    for (let k = 0; k < sec / 0.55; k++) o.frequency.setValueAtTime(k % 2 ? 660 : 960, t0 + k * 0.55);
    o.start();
    const step = setInterval(() => { g.gain.setTargetAtTime(Math.max(0.0001, loud() * 0.06), a.currentTime, 0.1); }, 100);
    const stop = () => { clearInterval(step); try { g.gain.setTargetAtTime(0.0001, a.currentTime, 0.2); o.stop(a.currentTime + 0.6); } catch (e) { /* đã dừng */ } };
    setTimeout(stop, sec * 1000);
    return stop;
  }

  /* ---------- 🚑 xe cấp cứu tới đón ---------- */
  let busy = false;
  function ambulance() {
    if (busy) return;
    busy = true;
    const P = AV.player;
    const toHospital = () => {
      AV.teleport('clinic', false, 360, 560, '🚑 Xe cấp cứu đưa bạn tới Bệnh viện Zeno…');
      setTimeout(() => { P.hidden = false; busy = false; UI.toast('🏥 Đã tới Bệnh viện Zeno — gặp bác sĩ ở phòng khám để khám và tiêm / uống thuốc nhé!', 6000); }, 1500);
    };
    if (AV.mapIndoor()) {
      UI.toast('🚑 Xe cấp cứu đang đến… nghe tiếng còi kìa!', 4000);
      let v = 0.2; const stop = siren(6, () => (v = Math.min(1, v + 0.03)));
      setTimeout(() => { stop(); P.hidden = true; toHospital(); }, 5000);
      return;
    }
    UI.toast('🚑 Xe cấp cứu 115 đang chạy tới chỗ bạn!', 4000);
    const fx = { x: P.x - 1100, y: P.y + 30, dir: 1, t: 0, phase: 'come' };
    fx.draw = (g, clock) => {
      g.save(); g.translate(fx.x, fx.y);
      ART.ambulance(g, 0, 0);
      const on = Math.floor(clock * 6) % 2;
      g.fillStyle = on ? '#ff3b3b' : '#3fa9ff'; g.beginPath(); g.arc(-12, -96, 7, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.35; g.beginPath(); g.arc(-12, -96, 22, 0, Math.PI * 2); g.fill();
      g.restore();
    };
    AV.worldFx.push(fx);
    const stopSiren = siren(14, () => Math.max(0.15, 1 - Math.abs(fx.x - P.x) / 1300));
    const end = () => { const i = AV.worldFx.indexOf(fx); if (i >= 0) AV.worldFx.splice(i, 1); stopSiren(); };
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (fx.phase === 'come') {
        const tx = P.x - 110;
        fx.x += Math.min(520 * dt, tx - fx.x);
        fx.y += (P.y + 30 - fx.y) * Math.min(1, dt * 3);
        if (tx - fx.x < 2) { fx.phase = 'load'; fx.t = 0; AV.sayMine('🤒 Cứu với…'); }
      } else if (fx.phase === 'load') {
        fx.t += dt;
        if (fx.t > 1.2 && !P.hidden) P.hidden = true;
        if (fx.t > 1.8) fx.phase = 'go';
      } else {
        fx.x += 600 * dt;
        if (fx.x > P.x + 1000) { end(); toHospital(); return; }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    setTimeout(() => { if (busy && fx.phase !== 'go') { end(); P.hidden = true; toHospital(); } }, 20000);
  }

  function init() {
    updateBtn();
    setInterval(battTick, 30000);
    setInterval(() => { if (openNow) statusBar(); }, 15000);
  }
  return { init, open, close, shop, charge, myNum, pretty, addContact, has: () => !!model(), hasSim: () => !!myNum(), dial, ambulance };
})();
