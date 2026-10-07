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
  /** Xe chạy dọc làn đường tới đoạn đường trước chỗ người chơi → gọi điện báo → người chơi đi ra xe.
   *  kind: 'food' | 'bike' | 'taxi' | 'vip'. onArrive(): giao đồ / đón khách xong. pickUp = chở người đi. */
  function vehicle(kind, label, onArrive, pickUp, vo = {}) {
    if (busy) { UI.toast('🛵 Đang có xe trên đường tới rồi, đợi chút nhé'); return false; }
    const P = AV.player, roadY = AV.roadY ? AV.roadY() : null;
    const caller = vo.caller || { name: pickUp ? `Tài xế ${label.replace(/^\S+\s/, '')}` : 'Shipper ZenoFood', num: pickUp ? '19006868' : '19001234' };
    /** gọi vào số người đặt: đúng số mình thì đổ chuông, số khác thì mình không nghe được */
    const ring = (opt) => { if (vo.ring === false) { UI.toast(`📞 ${caller.name} đang gọi ${PHONE.pretty(vo.wrongNum || '')} — không phải số của bạn nên bạn không nghe được`, 5000); return false; } return typeof CALL !== 'undefined' && CALL.fakeIncoming(caller, opt); };
    const line = pickUp ? 'Alo, tài xế đây ạ. Mình đến địa chỉ rồi đây, bạn ra xe nhé!' : 'Alo, shipper đây ạ. Đồ ăn của bạn tới rồi, bạn ra lấy đồ nhé!';
    busy = true;
    // khu không có đường (trong nhà, khu kín…): gọi điện rồi giao tận cửa
    if (roadY == null) {
      UI.toast(`${label} đang tới…`, 3500);
      setTimeout(() => {
        const done = () => { busy = false; onArrive(); };
        if (!(ring({ line: pickUp ? 'Alo, tài xế đây ạ. Mình đến địa chỉ rồi đây, xe đợi ở cửa nhé!' : 'Alo, shipper đây ạ. Mình tới cửa rồi, bạn ra lấy đồ nhé!', onEnd: done, onReject: done, onMissed: done }))) done();
      }, 6000);
      return true;
    }
    const mapId = AV.currentMap(), W = AV.mapW ? AV.mapW() : 3000;
    const car = kind === 'taxi' || kind === 'vip', K = car ? 1.25 : 1.45;
    const opt = { driver: car ? DRIVER.car : kind === 'food' ? DRIVER.food : DRIVER.bike, box: kind === 'food', color: kind === 'food' ? '#ff6b00' : kind === 'bike' ? '#00b14f' : kind === 'vip' ? '#212529' : '#0fb9b1', sign: kind === 'taxi' ? 'TAXI' : kind === 'vip' ? 'VIP' : '', moving: true, passenger: null };
    const stopX = Math.max(160, Math.min(W - 160, P.x)), fromLeft = P.x > 400 || W - P.x < 400 ? Math.random() < 0.5 || stopX > W - 400 : true;
    const fx = { x: fromLeft ? -200 : W + 200, y: roadY, w: 240, dir: fromLeft ? 1 : -1, ph: 'come', t: 0, waitT: 0 };
    let marker = null;
    fx.draw = (g, t) => {
      if (AV.currentMap() !== mapId) return;
      g.save(); g.translate(fx.x, fx.y); g.scale(K * fx.dir, K);
      (car ? drawCar : drawBike)(g, t, opt);
      g.restore();
      if (fx.ph === 'wait') { const m = pickUp ? '🚕 Xe của bạn — lại đây lên xe!' : '📦 Đồ ăn của bạn — lại lấy nhé!'; g.font = '800 15px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.strokeStyle = '#2b1a10'; g.lineWidth = 4; g.strokeText(m, fx.x, fx.y - 175 * K); g.fillText(m, fx.x, fx.y - 175 * K); }
    };
    AV.worldFx.push(fx);
    UI.toast(`${label} đang chạy tới đường gần chỗ bạn — để ý điện thoại nhé!`, 4000);
    const end = () => { const i = AV.worldFx.indexOf(fx); if (i >= 0) AV.worldFx.splice(i, 1); busy = false; if (marker) AV.removePickups((p) => p === marker); };
    const onPhone = () => typeof CALL !== 'undefined' && CALL.busy();
    const handOver = () => {
      if (fx.ph !== 'wait') return;
      // đang nghe / đang đổ chuông → nghe xong, cúp máy rồi mới lấy đồ / lên xe
      if (onPhone()) { if (!fx.toldCall) { fx.toldCall = 1; UI.toast('📞 Nghe máy xong đã rồi mới ' + (pickUp ? 'lên xe' : 'nhận đồ') + ' nhé'); setTimeout(() => { fx.toldCall = 0; }, 4000); } return; }
      fx.ph = 'go'; fx.t = 0; opt.moving = true;
      if (marker) AV.removePickups((p) => p === marker);
      if (pickUp) { P.hidden = true; P.target = null; opt.passenger = AV.S.look; AV.sayMine('🚕 Đi thôi!'); }
      else { onArrive(); AV.sayMine('📦 Cảm ơn anh shipper!'); }
    };
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      fx.t += dt;
      if (fx.ph === 'come') {
        const d = stopX - fx.x;
        fx.x += Math.sign(d) * Math.min(Math.abs(d), (Math.abs(d) < 160 ? 140 : Math.abs(d) > 900 ? 900 : 460) * dt);
        if (Math.abs(stopX - fx.x) < 2) {
          fx.ph = 'wait'; fx.t = 0; opt.moving = false;
          if (typeof MUSIC !== 'undefined' && MUSIC.clack) MUSIC.clack();
          // gọi điện cho người đặt; dù nghe hay không xe vẫn đợi 3 phút
          ring({ line });
          if (AV.currentMap() === mapId) marker = AV.dropPickup(fx.x, fx.y + 6, pickUp ? '👋' : '📦', handOver, { big: 1 });
        }
      } else if (fx.ph === 'wait') {
        // người chơi đi tới gần xe (đứng trên vỉa hè / lòng đường cạnh xe) cũng tính
        if (AV.currentMap() === mapId && !P.hidden && !onPhone() && Math.abs(P.x - fx.x) < 110 && Math.abs(P.y - fx.y) < 90) handOver();
        if (marker && AV.currentMap() === mapId && !AV.pickups().includes(marker)) marker = AV.dropPickup(fx.x, fx.y + 6, pickUp ? '👋' : '📦', handOver, { big: 1 });
        if (fx.t > 180) { fx.ph = 'go'; fx.t = 0; opt.moving = true; UI.toast(pickUp ? '🚕 Đợi lâu quá, tài xế đã đi mất' : '🛵 Đợi lâu quá, shipper đã đi mất', 5000); fx.abandon = true; }
      } else {
        fx.x += fx.dir * Math.min(520, 80 + fx.t * 420) * dt;
        if (pickUp && !fx.abandon) { P.x = Math.max(40, Math.min(W - 40, fx.x)); P.y = fx.y; P.target = null; }
        if (fx.x < -260 || fx.x > W + 260 || fx.t > 6) { end(); if (pickUp && !fx.abandon) onArrive(); if (fx.abandon && vo.onGone) vo.onGone(); return; }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return true;
  }

  /* giao diện app (nhúng sẵn để không phụ thuộc style.css cũ) */
  if (!document.getElementById('zx-css')) { const st = document.createElement('style'); st.id = 'zx-css'; st.textContent = "/* 🛵 ZenoFood & 🚕 ZenoCar — đặt món / đặt xe như app thật */ .ph-app.food > *, .ph-app.car > * { flex-shrink: 0; }\n.zf-top { background: linear-gradient(135deg,#00b14f,#2f9e44); color: #fff; padding: 8px 12px 12px; display: grid; gap: 2px; }\n.zf-top small { opacity: .85; font-size: 11px; } .zf-top b { font-size: 14px; }\n.zf-search { margin-top: 6px; border: 0; border-radius: 10px; padding: 8px 12px; font: inherit; font-size: 13px; }\n.zf-banner { margin: 8px; border-radius: 14px; background: linear-gradient(120deg,#fff3bf,#ffd8a8); padding: 12px; display: flex; align-items: center; gap: 8px; position: relative; overflow: hidden; }\n.zf-banner b { color: #c92a2a; font-size: 18px; line-height: 1.1; font-weight: 900; } .zf-banner span { background: #00b14f; color: #fff; border-radius: 10px; padding: 4px 8px; font-size: 11px; font-weight: 800; }\n.zf-banner i { position: absolute; right: 8px; bottom: 2px; font-size: 30px; font-style: normal; }\n.zf-cats { display: flex; gap: 6px; padding: 4px 8px; overflow-x: auto; }\n.zf-cats button { border: 1px solid #dee2e6; background: #fff; border-radius: 999px; padding: 5px 12px; font: inherit; font-size: 12px; white-space: nowrap; cursor: pointer; }\n.zf-cats button.on { background: #00b14f; border-color: #00b14f; color: #fff; font-weight: 800; }\n.zf-h { padding: 8px 12px 2px; font-weight: 900; font-size: 14px; }\n.zf-shops { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 6px 8px 70px; }\n.zf-shop { border: 0; background: #fff; border-radius: 12px; padding: 0 0 6px; overflow: hidden; display: grid; gap: 2px; text-align: left; font: inherit; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,.08); }\n.zf-shop b { font-size: 12px; padding: 0 8px; } .zf-shop small { font-size: 10.5px; color: #868e96; padding: 0 8px; }\n.zf-cover { height: 74px; display: flex; align-items: center; justify-content: center; gap: 2px; }\n.zf-cover i { font-style: normal; font-size: 30px; filter: drop-shadow(0 3px 3px rgba(0,0,0,.25)); }\n.zf-cover i:nth-child(2) { font-size: 38px; transform: translateY(-4px); }\n.zf-sh { background: #fff; padding: 8px 12px; display: grid; gap: 2px; } .zf-sh b { font-size: 15px; } .zf-sh small { color: #868e96; font-size: 11px; }\n.zf-tag { color: #00b14f; font-weight: 800; }\n.zf-menu { display: grid; gap: 6px; padding: 8px 8px 70px; }\n.zf-dish { display: flex; gap: 10px; align-items: center; background: #fff; border-radius: 12px; padding: 7px; }\n.zf-pic { width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; flex: none; position: relative; overflow: hidden; }\n.zf-pic::before { content: \"\"; position: absolute; width: 78%; height: 78%; border-radius: 50%; background: rgba(255,255,255,.75); box-shadow: 0 2px 4px rgba(0,0,0,.15); }\n.zf-pic i { font-style: normal; font-size: 20px; position: relative; filter: drop-shadow(0 2px 2px rgba(0,0,0,.25)); }\n.zf-pic.big { width: 66px; height: 66px; border-radius: 12px; } .zf-pic.big i { font-size: 38px; }\n.zf-dn { flex: 1; display: grid; gap: 1px; min-width: 0; } .zf-dn b { font-size: 13px; } .zf-dn small { color: #868e96; font-size: 11px; }\n.zf-qty { display: flex; align-items: center; gap: 4px; } .zf-qty span, .zf-qty [data-minus] { display: none; }\n.zf-qty.has span, .zf-qty.has [data-minus] { display: inline-grid; }\n.zf-qty button { width: 26px; height: 26px; border-radius: 50%; border: 0; background: #00b14f; color: #fff; font-weight: 900; cursor: pointer; place-items: center; }\n.zf-qty [data-minus] { background: #fff; color: #00b14f; border: 1.5px solid #00b14f; } .zf-qty span { min-width: 16px; text-align: center; font-weight: 800; font-size: 13px; }\n.zf-cart { position: sticky; bottom: 0; margin: auto 8px 0; background: #00b14f; color: #fff; border-radius: 14px; padding: 8px 8px 8px 12px; display: flex; align-items: center; gap: 8px; font-size: 12px; box-shadow: 0 4px 12px rgba(0,0,0,.25); }\n.zf-cart span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.zf-cart button { border: 0; background: #fff; color: #00b14f; border-radius: 10px; padding: 6px 10px; font: inherit; font-weight: 900; cursor: pointer; }\n.zf-line { display: flex; gap: 8px; align-items: center; } .zf-line span { flex: 1; }\n.zx-form { display: grid; gap: 8px; padding: 10px; }\n.zx-f { display: grid; gap: 3px; background: #fff; border-radius: 12px; padding: 7px 10px; } .zx-f span { font-size: 11px; color: #868e96; font-weight: 700; }\n.zx-f input { border: 0; border-bottom: 1.5px solid #e9ecef; padding: 4px 0; font: inherit; font-size: 14px; outline: none; background: none; } .zx-f input:focus { border-color: #00b14f; }\n.zx-route { background: #fff; border-radius: 12px; display: grid; } .zx-route .zx-f { padding-bottom: 4px; }\n.zx-sugs:empty { display: none; } .zx-sugs { background: #fff; border-radius: 10px; box-shadow: 0 4px 14px rgba(0,0,0,.15); display: grid; margin-top: -4px; overflow: hidden; }\n.zx-sugs button { border: 0; border-bottom: 1px solid #f1f3f5; background: #fff; text-align: left; padding: 7px 10px; font: inherit; font-size: 13px; cursor: pointer; display: grid; grid-template-columns: auto 1fr; column-gap: 6px; }\n.zx-sugs button small { grid-column: 2; color: #868e96; font-size: 11px; } .zx-sugs button:hover { background: #ebfbee; }\n.zx-sugnum { border: 1px dashed #00b14f; background: #ebfbee; color: #2b8a3e; border-radius: 10px; padding: 6px 10px; font: inherit; font-size: 12px; cursor: pointer; text-align: left; margin-top: -4px; }\n.zx-sum { background: #fff; border-radius: 12px; padding: 8px 10px; display: grid; gap: 6px; font-size: 13px; }\n.zx-sum > div { display: flex; justify-content: space-between; gap: 8px; } .zx-sum > div.tot { border-top: 1px dashed #dee2e6; padding-top: 6px; font-size: 15px; } .zx-sum .tot b { color: #e8590c; }\n.zx-sum small { color: #868e96; font-size: 11px; } .zx-sum > div.zx-sh { justify-content: flex-start; }\n.zx-go { border: 0; background: #00b14f; color: #fff; border-radius: 12px; padding: 11px; font: inherit; font-size: 14px; font-weight: 900; cursor: pointer; }\n.zx-go:disabled { background: #ced4da; cursor: default; }\n.zx-h { font-weight: 900; font-size: 13px; padding: 2px 2px 0; }\n.zx-rides { display: grid; gap: 6px; }\n.zx-ride { display: flex; align-items: center; gap: 10px; border: 2px solid #e9ecef; background: #fff; border-radius: 12px; padding: 6px 10px; font: inherit; cursor: pointer; text-align: left; }\n.zx-ride > span { font-size: 26px; } .zx-ride div { flex: 1; display: grid; } .zx-ride small { color: #868e96; font-size: 11px; } .zx-ride em { font-style: normal; font-weight: 900; color: #2b8a3e; }\n.zx-ride.on { border-color: #00b14f; background: #ebfbee; }\n.zx-map { position: relative; height: 130px; border-radius: 12px; overflow: hidden; background: #e6f4ea; flex: none; }\n.zx-map svg { position: absolute; inset: 0; width: 100%; height: 100%; }\n.zx-pin, .zx-car { position: absolute; transform: translate(-50%,-80%); font-style: normal; font-size: 18px; filter: drop-shadow(0 2px 2px rgba(0,0,0,.3)); }\n.zx-car { transform: translate(-50%,-50%); background: #fff; border-radius: 50%; padding: 1px 3px; font-size: 15px; }\n.zx-lb { position: absolute; transform: translate(-50%, 4px); background: #fff; border-radius: 6px; padding: 0 5px; font-size: 10px; font-weight: 800; white-space: nowrap; }\n.zx-track { display: grid; gap: 8px; padding: 10px; }\n.zx-eta { text-align: center; font-size: 14px; }\n.zx-driver { display: flex; align-items: center; justify-content: center; gap: 22px; }\n.zx-face { width: 62px; height: 62px; border-radius: 50%; background: #fff3bf; display: grid; place-items: center; font-size: 36px; position: relative; box-shadow: 0 2px 6px rgba(0,0,0,.15); }\n.zx-face em { position: absolute; bottom: -6px; background: #fab005; color: #fff; border-radius: 999px; font-size: 10px; font-style: normal; font-weight: 900; padding: 0 5px; }\n.zx-ib { width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid #dee2e6; background: #fff; font-size: 18px; cursor: pointer; }\n.zx-dname { text-align: center; display: grid; } .zx-dname small { color: #868e96; font-size: 12px; } .zx-dname small b { color: #212529; }\n.zx-steps { margin: 0; padding: 4px 10px 4px 28px; background: #fff; border-radius: 12px; font-size: 12.5px; display: grid; gap: 4px; color: #adb5bd; }\n.zx-steps li.ok { color: #2b8a3e; } .zx-steps li.now { color: #212529; font-weight: 800; }\n.zx-cancel { border: 1.5px solid #fa5252; background: #fff; color: #e03131; border-radius: 12px; padding: 8px; font: inherit; font-weight: 800; cursor: pointer; }\n.zx-nosim { display: grid; justify-items: center; text-align: center; gap: 8px; padding: 30px 18px; } .zx-nosim div { font-size: 54px; } .zx-nosim p { font-size: 13px; color: #495057; margin: 0; }"; document.head.appendChild(st); }

  /* ================= 📦 ĐƠN HÀNG (dùng chung giao đồ ăn & gọi xe) ================= */
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').trim();
  const ZONES = () => (DATA.ZONES || []).filter((z) => z.id !== 'sky');
  /** nơi đang đứng: khu hiện tại (trong nhà thì vẫn tính là "vị trí hiện tại") */
  const here = () => ZONES().find((z) => z.id === AV.currentMap()) || { id: AV.currentMap(), name: AV.mapIndoor() ? 'Trong nhà' : 'Chỗ bạn đứng', icon: '📍', x: 50, y: 52 };
  const HERE_TXT = () => `Vị trí hiện tại · ${here().name}`;
  /** chữ người chơi gõ → khu (null = không tìm thấy) */
  function resolvePlace(txt) {
    const q = norm(txt);
    if (!q || q.includes('vi tri hien tai') || q === norm(here().name)) return here();
    return ZONES().find((z) => norm(z.name) === q) || ZONES().find((z) => norm(z.name).includes(q) || q.includes(norm(z.name))) || null;
  }
  /** ô gõ địa chỉ có gợi ý bên dưới */
  const placeField = (key, icon, label, val, ph) => `<label class="zx-f"><span>${icon} ${label}</span><input data-place="${key}" value="${esc(val)}" placeholder="${ph}" autocomplete="off"></label><div class="zx-sugs" data-sugs="${key}"></div>`;
  function bindPlaces(box, onPick) {
    box.querySelectorAll('[data-place]').forEach((inp) => {
      const list = box.querySelector(`[data-sugs="${inp.dataset.place}"]`);
      const show = () => {
        const q = norm(inp.value), cur = here();
        const opts = [{ ...cur, cur: true }, ...ZONES().filter((z) => z.id !== cur.id)].filter((z) => !q || z.cur || norm(z.name).includes(q) || norm(z.desc).includes(q)).slice(0, 7);
        list.innerHTML = opts.map((z) => `<button type="button" data-pz="${z.id}">${z.cur ? '📍' : z.icon} <b>${z.cur ? 'Vị trí hiện tại' : esc(z.name)}</b><small>${z.cur ? esc(z.name) : esc(z.desc || '')}</small></button>`).join('');
        list.querySelectorAll('[data-pz]').forEach((b) => b.onmousedown = (e) => {
          e.preventDefault();
          const z = opts.find((x) => x.id === b.dataset.pz);
          inp.value = z.cur ? HERE_TXT() : z.name; list.innerHTML = '';
          if (onPick) onPick(inp.dataset.place, z);
        });
      };
      inp.onfocus = () => { inp.select(); show(); };
      inp.oninput = show;
      inp.onblur = () => setTimeout(() => { list.innerHTML = ''; }, 150);
    });
  }
  /** ô số điện thoại + gợi ý số SIM của mình */
  const phoneField = (val) => {
    const mine = PHONE.myNum();
    return `<label class="zx-f"><span>📞 Số điện thoại</span><input data-num inputmode="tel" maxlength="12" value="${esc(val || '')}" placeholder="Số để tài xế gọi"></label>
      ${mine ? `<button type="button" class="zx-sugnum" data-mynum>💡 Dùng số của tôi: <b>${PHONE.pretty(mine)}</b></button>` : ''}`;
  };
  function bindPhone(box) {
    const inp = box.querySelector('[data-num]'), b = box.querySelector('[data-mynum]');
    if (b) b.onclick = () => { inp.value = PHONE.pretty(PHONE.myNum()); };
    inp.oninput = () => { inp.value = inp.value.replace(/[^\d ]/g, ''); };
  }
  const readNum = (box) => box.querySelector('[data-num]').value.replace(/\D/g, '');
  const noSim = (box, back, title, what) => {
    box.innerHTML = back(title) + `<div class="zx-nosim"><div>📵</div><b>Chưa có SIM nên chưa ${what} được</b><p>Tài xế cần gọi vào số điện thoại của bạn khi tới nơi.<br>Mua SIM ở <b>CellphoneS</b> hoặc <b>Thế Giới Di Động</b> (khu mua sắm) rồi quay lại nhé.</p></div>`;
  };

  const FIRST = ['Nguyễn Văn', 'Trần Minh', 'Lê Hoàng', 'Phạm Đức', 'Vũ Quang', 'Đỗ Thành', 'Bùi Anh', 'Hoàng Văn', 'Lưu'];
  const LAST = ['Hùng', 'Tuấn', 'Nam', 'Huy', 'Long', 'Dũng', 'Phong', 'Khang', 'Sơn'];
  const CARS = { bike: ['Honda Wave Alpha', 'Yamaha Sirius', 'Honda Vision'], taxi: ['Toyota Vios', 'Hyundai Accent', 'Kia Morning'], vip: ['Mercedes E300', 'BMW 530i', 'Lexus ES 250'] };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  function makeDriver(kind) {
    const veh = kind === 'food' ? 'bike' : kind;
    const plate = `${pick(['29', '30', '51', '88'])}${veh === 'bike' ? pick(['B1', 'H1', 'X2']) : pick(['A', 'F', 'G'])}-${100 + Math.floor(Math.random() * 900)}.${10 + Math.floor(Math.random() * 90)}`;
    return { name: `${pick(FIRST)} ${pick(LAST)}`, car: pick(CARS[veh]), plate, star: (4.7 + Math.random() * 0.3).toFixed(1), num: '09' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0'), face: veh === 'bike' ? '🧑🏻‍🦱' : '🧔🏻' };
  }

  let order = null, ticker = 0, trackEl = null;
  const STEPS = {
    food: [['prep', '🍳 Quán đang chuẩn bị món'], ['coming', '🛵 Tài xế đang giao tới'], ['near', '📍 Tài xế đã tới — ra đường lấy hàng'], ['done', '✅ Đã nhận hàng']],
    ride: [['prep', '🔎 Đang tìm tài xế'], ['coming', '🚗 Tài xế đang tới điểm đón'], ['near', '📍 Tài xế đã tới — ra đường lên xe'], ['done', '✅ Đang trên xe']],
  };
  const progress = () => (order && order.status !== 'prep' ? Math.min(1, (Date.now() - order.goAt) / order.travelMs) : 0);
  /** bản đồ mini: đường đi từ (a) tới (b), chấm xe chạy theo tiến độ */
  function miniMap(a, b, p, icon) {
    const mx = b.x, my = a.y, L1 = Math.abs(mx - a.x), L2 = Math.abs(b.y - my), d = (L1 + L2) * p;
    const cx = d <= L1 ? a.x + Math.sign(mx - a.x) * d : mx, cy = d <= L1 ? a.y : my + Math.sign(b.y - my) * (d - L1);
    const roads = ZONES().map((z) => `<circle cx="${z.x}" cy="${z.y}" r="1.6" fill="#ced4da"/>`).join('');
    return `<div class="zx-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 30H100M0 62H100M34 0V100M70 0V100" stroke="#fff" stroke-width="3"/>${roads}
      <path d="M${a.x} ${a.y}H${mx}V${b.y}" stroke="#1c7ed6" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <i class="zx-pin a" style="left:${a.x}%;top:${a.y}%">${a.icon || '🏪'}</i><i class="zx-pin b" style="left:${b.x}%;top:${b.y}%">📍</i><i class="zx-car" style="left:${cx}%;top:${cy}%">${icon}</i>
      <small class="zx-lb" style="left:${b.x}%;top:${b.y}%">${esc(b.name)}</small></div>`;
  }
  function trackHtml() {
    const o = order, dr = o.driver, steps = STEPS[o.type], at = steps.findIndex((s) => s[0] === o.status);
    const mins = Math.max(1, Math.ceil((o.travelMs - (Date.now() - (o.goAt || Date.now()))) / 60000 * 3));
    return miniMap(o.from, o.to, progress(), o.type === 'food' ? '🛵' : o.vicon)
      + `<div class="zx-eta">${o.status === 'prep' ? steps[0][1] + '…' : o.status === 'coming' ? `Dự kiến tới trong <b>${mins} phút</b>` : o.status === 'near' ? `<b>Tài xế đang đợi ở ${esc(o.to.name)}</b>` : '✅ Hoàn tất'}</div>
      <div class="zx-driver"><button class="zx-ib" data-dcall>📞</button><div class="zx-face">${dr.face}<em>★ ${dr.star}</em></div><button class="zx-ib" data-dmsg>💬</button></div>
      <div class="zx-dname"><b>${esc(dr.name)}</b><small>${esc(dr.car)} · <b>${dr.plate}</b></small></div>
      <ol class="zx-steps">${steps.map((s, i) => `<li class="${i < at ? 'ok' : i === at ? 'now' : ''}">${s[1]}</li>`).join('')}</ol>
      <div class="zx-sum">${o.lines.map((l) => `<div><span>${l[0]}</span><b>${l[1]}</b></div>`).join('')}
        <div><span>👤 ${esc(o.name)}</span><b>${PHONE.pretty(o.num)}</b></div></div>
      ${o.status === 'prep' || o.status === 'coming' ? '<button class="zx-cancel" data-cancel>Huỷ đơn</button>' : ''}`;
  }
  function showTrack(box, back) {
    const type = order.type, title = type === 'food' ? '🛵 Theo dõi đơn hàng' : '🚕 Theo dõi tài xế';
    const paint = () => {
      if (!order) { trackEl = null; if (box.isConnected) (type === 'food' ? food : ride)(box, back); return; }
      box.innerHTML = back(title) + `<div class="zx-track">${trackHtml()}</div>`;
      box.querySelector('[data-dcall]').onclick = () => UI.toast(`📞 ${order.driver.name}: "${order.status === 'near' ? 'Mình đứng ngoài đường rồi, bạn ra nhé!' : 'Alo, mình đang chạy tới, bạn đợi chút xíu nha!'}"`, 4000);
      box.querySelector('[data-dmsg]').onclick = () => UI.toast(`💬 ${order.driver.name}: "Dạ mình nhận đơn rồi ạ 👍"`, 3500);
      const c = box.querySelector('[data-cancel]');
      if (c) c.onclick = () => UI.confirm('Huỷ đơn này? Bạn được hoàn lại tiền đã trả.', 'Huỷ đơn', () => { AV.earn(order.paid); UI.toast('Đã huỷ đơn, hoàn ' + fmt(order.paid) + ' xu'); order = null; PHONE.close(); });
    };
    trackEl = { box, paint };
    paint();
  }
  const repaint = () => { if (trackEl && trackEl.box.isConnected) trackEl.paint(); else trackEl = null; };

  /** đặt đơn: o = { type:'food'|'ride', kind, label, from, to, num, name, lines, paid, onArrive, pickUp, vicon } */
  function placeOrder(o) {
    order = { ...o, driver: makeDriver(o.kind), status: 'prep', t0: Date.now(), prepMs: o.type === 'food' ? 6000 : 3000, travelMs: 9000 + Math.round(Math.hypot(o.from.x - o.to.x, o.from.y - o.to.y) * 120) };
    clearInterval(ticker);
    ticker = setInterval(tick, 500);
  }
  function startVehicle() {
    const o = order, mine = o.num === PHONE.myNum();
    o.status = 'near';
    const ok = vehicle(o.kind, o.label, () => { if (order === o) { o.status = 'done'; repaint(); order = null; clearInterval(ticker); } o.onArrive(); }, o.pickUp, {
      caller: { name: `${o.type === 'food' ? 'Shipper' : 'Tài xế'} ${o.driver.name}`, num: o.driver.num },
      ring: mine, wrongNum: o.num,
      onGone: () => { if (order === o) { order = null; clearInterval(ticker); } if (o.type === 'food') UI.toast('Đơn đã huỷ vì không có ai nhận — mất phí ship', 4000); },
    });
    if (!ok) { o.status = 'coming'; return; }
    o.started = true;
  }
  function tick() {
    const o = order;
    if (!o) { clearInterval(ticker); return; }
    const now = Date.now();
    if (o.status === 'prep' && now - o.t0 > o.prepMs) {
      o.status = 'coming'; o.goAt = now;
      UI.toast(o.type === 'food' ? `🛵 ${o.driver.name} đã lấy món, đang giao tới ${o.to.name}` : `🚗 ${o.driver.name} (${o.driver.plate}) đã nhận chuyến, đang tới ${o.to.name}`, 4000);
    }
    if (o.status === 'coming' && progress() >= 1) {
      const there = AV.currentMap() === o.to.id && !AV.player.hidden;
      if (there) startVehicle();
      else if (!o.calledAway) {
        // tài xế tới nơi mà người đặt đang ở chỗ khác → gọi báo ra đó nhận
        o.calledAway = now;
        const line = o.type === 'food' ? `Alo, shipper đây ạ. Mình tới ${o.to.name} rồi, bạn ra lấy đồ nhé!` : `Alo, tài xế đây ạ. Mình đến ${o.to.name} rồi đây, bạn ra xe nhé!`;
        if (!(o.num === PHONE.myNum() && typeof CALL !== 'undefined' && CALL.fakeIncoming({ name: `${o.type === 'food' ? 'Shipper' : 'Tài xế'} ${o.driver.name}`, num: o.driver.num }, { line }))) UI.toast(`📍 ${o.driver.name} đã tới ${o.to.name} — hãy tới đó (đơn huỷ sau 5 phút)`, 5000);
      } else if (now - o.calledAway > 300000) {
        UI.toast(`⌛ ${o.driver.name} đợi ở ${o.to.name} lâu quá nên đã huỷ đơn`, 5000);
        order = null; clearInterval(ticker);
      }
    }
    repaint();
  }

  /* ================= 🛵 ZENOFOOD — giao đồ ăn ================= */
  const SHIP = 10, FREESHIP = 50;
  const FS = { view: 'home', sid: '', cart: {}, cat: 'all', q: '', addr: '', name: '', num: '', note: '' };
  const shopsAll = () => [...DATA.EATERIES, ...(DATA.TEA_MENU || [])];
  const isDrink = (e) => e.deco === 'cafe' || e.id === 'trada';
  const seed = (s) => [...s].reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 7);
  const shopMeta = (e) => { const h = seed(e.id); return { star: (4.5 + (h % 5) / 10).toFixed(1), km: (0.4 + (h % 30) / 10).toFixed(1), min: 10 + (h % 20), bg: `linear-gradient(135deg, ${e.wall || '#fff3bf'}, ${(e.awn && e.awn[0]) || '#ffa94d'})` }; };
  const dishPic = (e, it, big) => `<div class="zf-pic ${big ? 'big' : ''}" style="background:${shopMeta(e).bg}"><i>${it.icon}</i></div>`;
  const cartShop = () => shopsAll().find((e) => e.id === FS.sid);
  const cartList = () => { const e = cartShop(); return e ? e.menu.filter((it) => FS.cart[it.id] > 0).map((it) => ({ it, q: FS.cart[it.id] })) : []; };
  const cartSum = () => cartList().reduce((a, x) => a + x.it.price * x.q, 0);
  const cartQty = () => cartList().reduce((a, x) => a + x.q, 0);
  const shipFee = () => (cartSum() >= FREESHIP ? 0 : SHIP);

  function food(box, back) {
    if (order && order.type === 'food') return showTrack(box, back);
    if (!PHONE.myNum()) return noSim(box, back, '🛵 ZenoFood', 'đặt đồ ăn');
    const sub = (t) => back(t).replace('data-back', 'data-sub');
    const goView = (v) => { FS.view = v; food(box, back); box.scrollTop = 0; };
    const bindSub = () => { const b = box.querySelector('[data-sub]'); if (b) b.onclick = () => goView(FS.view === 'checkout' ? 'shop' : 'home'); };
    const cartBar = () => cartQty() ? `<div class="zf-cart"><span>🛒 <b>${cartQty()}</b> món · ${esc(cartShop().name)}</span><b>${fmt(cartSum())} xu</b><button data-checkout>Giao hàng ›</button></div>` : '';
    const bindCart = () => { const b = box.querySelector('[data-checkout]'); if (b) b.onclick = () => goView('checkout'); };
    const setQty = (sid, iid, d) => {
      if (FS.sid !== sid && cartQty()) { FS.cart = {}; UI.toast('🛒 Giỏ hàng chỉ đặt 1 quán — đã đổi sang quán mới'); }
      FS.sid = sid; FS.cart[iid] = Math.max(0, Math.min(9, (FS.cart[iid] || 0) + d));
      box.querySelectorAll(`[data-q="${iid}"]`).forEach((s) => { s.textContent = FS.cart[iid]; s.parentElement.classList.toggle('has', FS.cart[iid] > 0); });
      const old = box.querySelector('.zf-cart'); if (old) old.remove();
      box.insertAdjacentHTML('beforeend', cartBar()); bindCart();
    };
    const qtyCtl = (e, it) => `<div class="zf-qty ${FS.sid === e.id && FS.cart[it.id] ? 'has' : ''}"><button data-minus="${e.id}|${it.id}">−</button><span data-q="${it.id}">${FS.sid === e.id ? FS.cart[it.id] || 0 : 0}</span><button data-plus="${e.id}|${it.id}">＋</button></div>`;
    const bindQty = () => {
      box.querySelectorAll('[data-plus]').forEach((b) => b.onclick = (ev) => { ev.stopPropagation(); const [s, i] = b.dataset.plus.split('|'); setQty(s, i, 1); });
      box.querySelectorAll('[data-minus]').forEach((b) => b.onclick = (ev) => { ev.stopPropagation(); const [s, i] = b.dataset.minus.split('|'); setQty(s, i, -1); });
    };

    if (FS.view === 'shop' && FS.open) {
      const e = shopsAll().find((x) => x.id === FS.open), m = shopMeta(e);
      box.innerHTML = sub(esc(e.name)) + `<div class="zf-cover" style="background:${m.bg}">${(e.items || [e.logo]).map((x) => `<i>${x}</i>`).join('')}</div>
        <div class="zf-sh"><b>${e.logo || '🍜'} ${esc(e.name)}</b><small>${esc(e.sub || '')}</small><small>⭐ ${m.star} · ${m.km} km · 🕒 ${m.min} phút · <span class="zf-tag">Freeship từ ${FREESHIP} xu</span></small></div>
        <div class="zf-menu">${e.menu.map((it) => `<div class="zf-dish">${dishPic(e, it, true)}<div class="zf-dn"><b>${esc(it.name)}</b><small>+${it.xp} XP · no bụng</small><span class="ap-pr">${fmt(it.price)} xu</span></div>${qtyCtl(e, it)}</div>`).join('')}</div>` + cartBar();
      bindSub(); bindQty(); bindCart();
      return;
    }
    if (FS.view === 'checkout' && cartQty()) {
      const e = cartShop();
      if (!FS.addr) FS.addr = HERE_TXT();
      if (!FS.name) FS.name = S().name;
      if (!FS.num) FS.num = PHONE.pretty(PHONE.myNum());
      box.innerHTML = sub('Xác nhận đơn hàng') + `<div class="zx-form">
        ${placeField('addr', '📍', 'Giao tới', FS.addr, 'Gõ địa chỉ: Nông trại, Quảng trường…')}
        <label class="zx-f"><span>👤 Tên người nhận</span><input data-name maxlength="30" value="${esc(FS.name)}"></label>
        ${phoneField(FS.num)}
        <label class="zx-f"><span>📝 Ghi chú cho tài xế</span><input data-note maxlength="60" value="${esc(FS.note)}" placeholder="VD: gọi trước khi tới"></label>
        <div class="zx-sum"><div class="zx-sh">${e.logo || '🍜'} <b>${esc(e.name)}</b></div>
          ${cartList().map((x) => `<div class="zf-line">${dishPic(e, x.it)}<span>${x.q} × ${esc(x.it.name)}</span><b>${fmt(x.it.price * x.q)} xu</b></div>`).join('')}
          <div><span>Tạm tính</span><b>${fmt(cartSum())} xu</b></div>
          <div><span>Phí giao hàng</span><b>${shipFee() ? fmt(shipFee()) + ' xu' : '<s>' + SHIP + ' xu</s> Miễn phí'}</b></div>
          <div class="tot"><span>Tổng cộng</span><b>${fmt(cartSum() + shipFee())} xu</b></div>
          <small>💵 Phí ship trả trước qua ví · tiền món trả khi nhận hàng</small></div>
        <button class="zx-go" data-order>Đặt đơn · ${fmt(cartSum() + shipFee())} xu</button></div>`;
      bindSub(); bindPlaces(box); bindPhone(box);
      const keep = () => { FS.addr = box.querySelector('[data-place="addr"]').value; FS.name = box.querySelector('[data-name]').value; FS.num = box.querySelector('[data-num]').value; FS.note = box.querySelector('[data-note]').value; };
      box.querySelectorAll('input').forEach((i) => i.addEventListener('change', keep));
      box.querySelector('[data-order]').onclick = () => {
        keep();
        const to = resolvePlace(FS.addr), num = readNum(box), name = FS.name.trim();
        if (!to) return UI.toast('📍 Không tìm thấy địa chỉ — chọn trong danh sách gợi ý nhé');
        if (!name) return UI.toast('👤 Nhập tên người nhận');
        if (!/^0\d{9}$/.test(num)) return UI.toast('📞 Số điện thoại phải đủ 10 số (VD 09xx xxx xxx)');
        if (AV.belly() >= DATA.BELLY.max) return UI.toast('😵 Bạn đang no căng bụng, đặt sau nhé');
        const fee = shipFee(), sum = cartSum(), items = cartList();
        if (S().coins < sum + fee) return UI.toast('Không đủ xu 😢');
        if (fee && !AV.spend(fee)) return;
        const shopZone = ZONES().find((z) => z.id === 'town') || here();
        placeOrder({
          type: 'food', kind: 'food', label: `🛵 Shipper ${e.name}`, from: { ...shopZone, icon: e.logo || '🏪' }, to, num, name, paid: fee, pickUp: false,
          lines: [...items.map((x) => [`${x.it.icon} ${x.q} × ${x.it.name}`, fmt(x.it.price * x.q) + ' xu']), ['🛵 Phí ship', fee ? fee + ' xu' : 'Miễn phí'], ['📍 Giao tới', to.name]],
          onArrive: () => {
            let k = 0;
            items.forEach((x) => { for (let i = 0; i < x.q; i++) setTimeout(() => AV.eat(e.id, x.it.id), 700 * k++); });
            UI.toast(`🛵 Đã nhận đơn ${e.name} — ăn ngon miệng nhé!`, 3500);
          },
        });
        FS.cart = {}; FS.view = 'home'; FS.note = '';
        UI.toast(`✅ Đặt đơn thành công! Shipper sẽ gọi ${PHONE.pretty(num)} khi tới ${to.name}`, 4500);
        food(box, back);
      };
      return;
    }
    // trang chủ
    FS.view = 'home';
    const q = norm(FS.q), list = shopsAll().filter((e) => FS.cat === 'all' || (FS.cat === 'drink') === isDrink(e));
    const dishes = q ? list.flatMap((e) => e.menu.filter((it) => norm(it.name).includes(q)).map((it) => ({ e, it }))) : [];
    const shops = q ? list.filter((e) => norm(e.name).includes(q) || dishes.some((d) => d.e === e)) : list;
    box.innerHTML = back('🛵 ZenoFood') + `<div class="zf-top"><small>Giao tới</small><b>📍 ${esc(here().name)}</b>
        <input class="zf-search" data-q placeholder="🔍 Tìm món ăn, quán ăn…" value="${esc(FS.q)}"></div>
      ${q ? '' : `<div class="zf-banner"><b>Ăn hết<br>Zeno Việt</b><span>🔥 FREESHIP<br>đơn từ ${FREESHIP} xu</span><i>🍜🧋🍗</i></div>`}
      <div class="zf-cats">${[['all', '✨ Tất cả'], ['meal', '🍚 Đồ ăn'], ['drink', '🧋 Đồ uống']].map((c) => `<button class="${FS.cat === c[0] ? 'on' : ''}" data-cat="${c[0]}">${c[1]}</button>`).join('')}</div>
      ${dishes.length ? `<div class="zf-h">Món phù hợp</div><div class="zf-menu">${dishes.map(({ e, it }) => `<div class="zf-dish">${dishPic(e, it, true)}<div class="zf-dn"><b>${esc(it.name)}</b><small>${esc(e.name)}</small><span class="ap-pr">${fmt(it.price)} xu</span></div>${qtyCtl(e, it)}</div>`).join('')}</div>` : ''}
      <div class="zf-h">${q ? 'Quán ăn' : 'Quán ngon gần bạn'}</div>
      <div class="zf-shops">${shops.map((e) => { const m = shopMeta(e); return `<button class="zf-shop" data-shop="${e.id}"><div class="zf-cover" style="background:${m.bg}">${(e.items || [e.logo]).slice(0, 3).map((x) => `<i>${x}</i>`).join('')}</div><b>${esc(e.name)}</b><small>⭐ ${m.star} · ${m.km}km · ${m.min}'</small></button>`; }).join('') || '<p class="ph-empty">Không tìm thấy quán nào.</p>'}</div>` + cartBar();
    const s = box.querySelector('[data-q]');
    s.onchange = () => { FS.q = s.value; food(box, back); };
    s.onkeydown = (ev) => { if (ev.key === 'Enter') { FS.q = s.value; food(box, back); } };
    box.querySelectorAll('[data-cat]').forEach((b) => b.onclick = () => { FS.cat = b.dataset.cat; food(box, back); });
    box.querySelectorAll('[data-shop]').forEach((b) => b.onclick = () => { FS.open = b.dataset.shop; goView('shop'); });
    bindQty(); bindCart();
  }

  /* ================= 🚕 ZENOCAR — gọi xe ================= */
  const RIDES = [{ id: 'bike', icon: '🛵', name: 'Xe ôm', base: 15, per: 0.6, seat: '1 chỗ' }, { id: 'taxi', icon: '🚕', name: 'Taxi 4 chỗ', base: 30, per: 1.4, seat: '4 chỗ' }, { id: 'vip', icon: '🚙', name: 'Xe sang', base: 120, per: 4, seat: '4 chỗ · đời mới' }];
  const RS = { kind: 'bike', from: '', to: '', num: '' };
  const fare = (r, a, b) => Math.round(r.base + r.per * Math.hypot(a.x - b.x, a.y - b.y));
  function ride(box, back) {
    if (order && order.type === 'ride') return showTrack(box, back);
    if (!PHONE.myNum()) return noSim(box, back, '🚕 ZenoCar', 'gọi xe');
    if (!RS.from) RS.from = HERE_TXT();
    if (!RS.num) RS.num = PHONE.pretty(PHONE.myNum());
    const a = resolvePlace(RS.from), b = RS.to ? resolvePlace(RS.to) : null, ok = a && b && a.id !== b.id;
    box.innerHTML = back('🚕 ZenoCar') + `<div class="zx-form">
      <div class="zx-route">${placeField('from', '🟢', 'Điểm đón', RS.from, 'Bạn đang ở đâu?')}${placeField('to', '🔴', 'Điểm đến', RS.to, 'Bạn muốn đi đâu?')}</div>
      ${ok ? miniMap(a, b, 0, '🚗') : ''}
      <div class="zx-h">Chọn loại xe</div>
      <div class="zx-rides">${RIDES.map((r) => `<button class="zx-ride ${r.id === RS.kind ? 'on' : ''}" data-k="${r.id}"><span>${r.icon}</span><div><b>${r.name}</b><small>${r.seat}</small></div><em>${ok ? fmt(fare(r, a, b)) + ' xu' : '—'}</em></button>`).join('')}</div>
      ${phoneField(RS.num)}
      <button class="zx-go" data-book ${ok ? '' : 'disabled'}>${ok ? `Đặt ${RIDES.find((r) => r.id === RS.kind).name} · ${fmt(fare(RIDES.find((r) => r.id === RS.kind), a, b))} xu` : 'Nhập điểm đón và điểm đến'}</button></div>`;
    const keep = () => { RS.from = box.querySelector('[data-place="from"]').value; RS.to = box.querySelector('[data-place="to"]').value; RS.num = box.querySelector('[data-num]').value; };
    bindPlaces(box, () => { keep(); ride(box, back); });
    bindPhone(box);
    box.querySelectorAll('[data-place]').forEach((i) => i.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { keep(); ride(box, back); } }));
    box.querySelectorAll('[data-k]').forEach((x) => x.onclick = () => { keep(); RS.kind = x.dataset.k; ride(box, back); });
    box.querySelector('[data-book]').onclick = () => {
      keep();
      const from = resolvePlace(RS.from), to = resolvePlace(RS.to), num = readNum(box), r = RIDES.find((x) => x.id === RS.kind);
      if (!from) return UI.toast('🟢 Không tìm thấy điểm đón');
      if (!to) return UI.toast('🔴 Không tìm thấy điểm đến');
      if (from.id === to.id) return UI.toast('Điểm đón và điểm đến đang trùng nhau');
      if (!/^0\d{9}$/.test(num)) return UI.toast('📞 Số điện thoại phải đủ 10 số');
      const price = fare(r, from, to);
      if (!AV.spend(price)) return;
      const goRide = () => {
        // chạy trên đường phố Hà Nội thật (chế độ taxi tự lái); khu chưa nối đường thì đưa thẳng tới nơi
        if (typeof RIDE !== 'undefined' && RIDE.canRide(AV.currentMap(), to.id) && AV.startRide && AV.startRide(to.id, 'taxi')) return;
        AV.player.hidden = false; AV.teleport(to.id, false, undefined, undefined, `${r.icon} ${r.name} chở bạn tới ${to.name}…`);
      };
      const start = ZONES().filter((z) => z.id !== from.id)[Math.floor(Math.random() * (ZONES().length - 1))] || from;
      placeOrder({
        type: 'ride', kind: r.id, label: `${r.icon} ${r.name}`, from: { ...start, icon: r.icon }, to: from, num, name: S().name, paid: price, pickUp: true, vicon: r.icon, onArrive: goRide,
        lines: [['🟢 Điểm đón', from.name], ['🔴 Điểm đến', to.name], [`${r.icon} ${r.name}`, fmt(price) + ' xu']],
      });
      RS.to = '';
      UI.toast(`✅ Đã đặt ${r.name}! Tài xế sẽ gọi ${PHONE.pretty(num)} khi tới ${from.name}`, 4500);
      ride(box, back);
    };
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
