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
    { id: 'ip17pm', name: 'iPhone 17 Pro Max', os: 'ios', price: 42990000, drain: 0.6, color: '#ff922b', tag: 'Đỉnh nhất · pin khủng' },
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
  const numOf = (uid) => { const h = hash('PHONE|' + uid), h2 = hash('P2|' + uid); return '09' + String(h % 10000).padStart(4, '0') + String(h2 % 10000).padStart(4, '0'); };
  const myNum = () => numOf(CLOUD.user ? CLOUD.user.id : 'guest|' + S().name);
  const pretty = (n) => n.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  const friends = () => (S().friends || []).filter((f) => f.uid);

  /* ================= 🛒 CỬA HÀNG ================= */
  function shop(kind) {
    const st = STORES[kind];
    const p = UI.panel(`📱 ${st.name}`, '', { wide: true });
    const render = () => {
      const cur = model(), ph = S().phone;
      const price = (m) => Math.round(m.price * st.disc / 1000) * 1000;
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu${cur ? ` · Đang dùng: <b>${cur.name}</b> 🔋${Math.round(ph.bat)}%` : ''}</div>
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
          const pb = ((S().phone && S().phone.pb) || 0) + (kind === 'tgdd' ? 1 : 0);
          S().phone = { model: m.id, bat: 100, pb };
          AV.markChanged && AV.markChanged();
          UI.toast(`📱 Đã mua ${m.name}! Bấm nút 📱 trên cùng để dùng. Số của bạn: ${pretty(myNum())}${kind === 'tgdd' ? ' · 🎁 Tặng 1 sạc dự phòng' : ''}`, 6000);
          AV.sayMine('📱 Máy mới nè!');
          updateBtn(); render();
        });
      });
      const pbB = p.body.querySelector('[data-pb]');
      if (pbB) pbB.onclick = () => { if (!AV.spend(POWERBANK)) return; S().phone.pb = (S().phone.pb || 0) + 1; UI.toast('🔋 Đã mua sạc dự phòng — mở điện thoại để dùng khi pin yếu'); render(); };
      const ch = p.body.querySelector('[data-charge]');
      if (ch) ch.onclick = () => { charge(100, '🔌 Đã sạc đầy pin ở cửa hàng'); render(); };
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
    { id: 'lotto', icon: '🎰', name: 'Xổ số', bg: 'linear-gradient(#ff8787,#c92a2a)' },
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
      ? `<b>${vnTime()}</b><span class="ph-isl"></span><span>📶 Viettel <i class="ph-bat ${b <= 20 ? 'low' : ''}"><u style="width:${b}%"></u></i> ${b}%</span>`
      : `<span>${vnTime()} ✉</span><span>📶 ${b}% <i class="ph-bat ${b <= 20 ? 'low' : ''}"><u style="width:${b}%"></u></i></span>`;
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
      box.innerHTML = header('Điện thoại') + `<div class="ph-dial"><div class="ph-num"></div>
        <div class="ph-keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}</div>
        <div class="ph-dial-row"><button class="ph-del" data-del>⌫</button><button class="ph-callbtn" data-call>📞</button><button class="ph-del" data-q>115</button></div>
        <p class="ph-hint">🚑 115 cấp cứu · 🚓 113 · 🚒 114</p></div>`;
      back();
      let num = '';
      const show = () => { box.querySelector('.ph-num').textContent = num || ' '; };
      box.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => { if (num.length < 12) num += b.dataset.k; beep(700 + (+b.dataset.k || 0) * 40, 0.06); show(); });
      box.querySelector('[data-del]').onclick = () => { num = num.slice(0, -1); show(); };
      box.querySelector('[data-q]').onclick = () => { num = '115'; show(); };
      box.querySelector('[data-call]').onclick = () => { if (num) dial(num); };
      show();
    } else if (app === 'contacts') {
      const list = friends();
      box.innerHTML = header('Danh bạ') + `<div class="ph-me"><b>${esc(S().name)}</b><span>Số của tôi: ${pretty(myNum())}</span></div>
        <div class="ph-list">${list.length ? list.map((f, i) => `<div class="ph-row"><span class="ph-av">${esc((f.name || f.username || '?')[0].toUpperCase())}</span><div><b>${esc(f.name || f.username)}</b><small>${pretty(numOf(f.uid))}</small></div><button data-dial="${i}">📞</button><button data-sms="${i}">💬</button></div>`).join('')
        : '<p class="ph-empty">Chưa có ai trong danh bạ.<br>Gặp người chơi khác → bấm vào họ → <b>📱 Gửi số điện thoại</b>.</p>'}</div>`;
      back();
      box.querySelectorAll('[data-dial]').forEach((b) => b.onclick = () => dial(numOf(list[+b.dataset.dial].uid)));
      box.querySelectorAll('[data-sms]').forEach((b) => b.onclick = () => { const f = list[+b.dataset.sms]; close(); SOCIAL.openChat(f); });
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
        <div class="ph-row2">🎰 Quay xổ số: <b>18h30</b></div>${mh ? `<div class="ph-row2">🛒 Thương lái: <b>${mh}</b></div>` : ''}</div>`;
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
    if (id === 'msg') { close(); return SOCIAL.open ? SOCIAL.open() : UI.friendsPanel(); }
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
  let callInfo = null;
  function dial(num) {
    num = String(num).replace(/\D/g, '');
    const f = friends().find((x) => numOf(x.uid) === num);
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
    } else if (f) {
      later(3800, () => {
        stopRing();
        say(`${f.name || f.username} không nghe máy — đã gửi thông báo cuộc gọi nhỡ`);
        if (CLOUD.user) CLOUD.client.from('messages').insert({ to_user: f.uid, from_name: S().name, from_username: CLOUD.username, kind: 'chat', body: { text: `📞 Cuộc gọi nhỡ từ ${S().name} (${pretty(myNum())})` } }).then(() => {}, () => {});
        later(2500, () => { close(); SOCIAL.openChat(f); });
      });
    } else {
      later(1800, () => { stopRing(); say('Số máy quý khách vừa gọi không tồn tại. Xin vui lòng kiểm tra lại.'); later(3200, () => go('home')); });
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
  return { init, open, close, shop, charge, myNum, numOf, pretty, has: () => !!model(), dial, ambulance };
})();
