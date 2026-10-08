/* 🍜 BÊN TRONG QUÁN ĂN / QUÁN CÀ PHÊ (phố ẩm thực trước nông trại): đi vào quán, chọn bàn ngồi, gọi món theo thực đơn,
 * món được bưng ra đặt trên bàn (đĩa / ly bốc khói), ăn dần cho tới khi hết. Mỗi quán 1 bản đồ riêng 'eat_<mã quán>',
 * màu sắc theo biển hiệu quán: quán Việt (ghế nhựa đỏ, bàn inox, quạt trần, nồi nước dùng) · quán cà phê (sàn gỗ, bàn tròn, đèn thả). */
const EATERY = (() => {
  const W = 1600, H = 1000, TAU = Math.PI * 2;
  const shopOf = (id) => DATA.EATERIES.find((e) => e.id === id);
  const isCafe = (e) => e.deco === 'cafe';
  /** chỗ cửa quán ngoài phố (khớp với vị trí trong maps.js) */
  const streetPos = (id) => { const i = DATA.EATERIES.findIndex((e) => e.id === id); return { x: (i < 4 ? 260 + i * 240 : 3790 + (i - 4) * 240) - 40, y: 1465 }; };
  /** bàn: hàng trên 3 bàn, hàng dưới 4 bàn (chừa lối đi ở giữa ra cửa) */
  const TABLES = [[300, 640], [640, 640], [980, 640], [300, 860], [560, 860], [1040, 860], [1320, 860]];
  const DOOR = 800;

  /* ---------- tiện ích vẽ ---------- */
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const shade = (h, k) => { const [r, g, b] = hex(h), f = (v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k); return `rgb(${f(r)},${f(g)},${f(b)})`; };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  const emo = (c, ch, x, y, size) => { c.font = `${size}px system-ui, "Segoe UI Emoji"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, x, y); };
  const shadowE = (c, x, y, rx, ry, a = 0.18) => { c.fillStyle = `rgba(0,0,0,${a})`; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); };

  /** ghế nhựa đỏ thấp kiểu quán vỉa hè */
  function stool(c, x, y, col = '#e03131') {
    shadowE(c, x, y + 2, 17, 5, 0.2);
    c.fillStyle = shade(col, -0.3); c.beginPath(); c.moveTo(x - 12, y - 20); c.lineTo(x + 12, y - 20); c.lineTo(x + 16, y); c.lineTo(x - 16, y); c.closePath(); c.fill();
    c.fillStyle = shade(col, -0.5); c.beginPath(); c.ellipse(x, y - 6, 8, 3, 0, 0, TAU); c.fill();
    c.fillStyle = col; c.beginPath(); c.ellipse(x, y - 20, 15, 6, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(x - 4, y - 21, 6, 2, 0, 0, TAU); c.fill();
  }
  /** ghế gỗ có tựa (quán cà phê) — back: true = ghế phía sau bàn (thấy tựa lưng) */
  function chair(c, x, y, back) {
    shadowE(c, x, y + 2, 20, 6, 0.2);
    c.fillStyle = '#5c3a1e'; [[-14, 0], [14, 0]].forEach(([dx]) => c.fillRect(x + dx - 2, y - 22, 4, 22));
    if (back) { c.fillStyle = '#6b4423'; rr(c, x - 18, y - 70, 36, 44, 6); c.fill(); c.fillStyle = '#8a5a32'; [-8, 0, 8].forEach((dx) => c.fillRect(x + dx - 2, y - 64, 4, 34)); }
    c.fillStyle = '#8a5a32'; c.beginPath(); c.ellipse(x, y - 24, 19, 8, 0, 0, TAU); c.fill();
    c.fillStyle = '#a87843'; c.beginPath(); c.ellipse(x, y - 26, 16, 6, 0, 0, TAU); c.fill();
  }
  /** bàn: inox chữ nhật (quán Việt) hoặc bàn tròn gỗ (cà phê); cx, cy = mép trước bàn */
  function table(c, e, x, y) {
    if (isCafe(e)) {
      shadowE(c, x, y + 4, 60, 12, 0.22);
      c.fillStyle = '#3b2412'; c.fillRect(x - 5, y - 52, 10, 52); c.beginPath(); c.ellipse(x, y, 24, 7, 0, 0, TAU); c.fill();
      c.fillStyle = '#5c3a1e'; c.beginPath(); c.ellipse(x, y - 52, 66, 30, 0, 0, TAU); c.fill();
      const g = c.createLinearGradient(x - 60, y - 80, x + 60, y - 40); g.addColorStop(0, '#c08d58'); g.addColorStop(1, '#8a5a32');
      c.fillStyle = g; c.beginPath(); c.ellipse(x, y - 57, 64, 27, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; c.beginPath(); c.ellipse(x - 6, y - 60, 44, 16, 0, 3.4, 5.2); c.stroke();
      // lọ hoa nhỏ giữa bàn
      c.fillStyle = '#d0ebff'; rr(c, x + 30, y - 76, 10, 16, 3); c.fill(); emo(c, '🌼', x + 35, y - 80, 14);
    } else {
      shadowE(c, x, y + 4, 84, 12, 0.22);
      c.fillStyle = '#868e96'; [[-66, 1], [62, 1]].forEach(([dx]) => c.fillRect(x + dx, y - 40, 5, 40));
      c.fillStyle = '#adb5bd'; rr(c, x - 80, y - 46, 160, 10, 4); c.fill();
      const g = c.createLinearGradient(0, y - 90, 0, y - 44); g.addColorStop(0, '#f8f9fa'); g.addColorStop(1, '#ced4da');
      c.fillStyle = g; rr(c, x - 80, y - 92, 160, 50, 8); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 70, y - 86); c.lineTo(x + 40, y - 86); c.stroke();
      // ống đũa, lọ tương ớt, hộp giấy ăn
      c.fillStyle = '#e8590c'; rr(c, x + 44, y - 90, 12, 22, 3); c.fill(); c.fillStyle = '#c92a2a'; rr(c, x + 47, y - 96, 6, 8, 2); c.fill();
      c.fillStyle = '#495057'; rr(c, x + 58, y - 86, 12, 18, 3); c.fill(); c.strokeStyle = '#f1e3c3'; c.lineWidth = 2; [0, 3, 6].forEach((d) => { c.beginPath(); c.moveTo(x + 61 + d, y - 86); c.lineTo(x + 60 + d, y - 100); c.stroke(); });
      c.fillStyle = '#fff'; rr(c, x - 72, y - 88, 22, 14, 3); c.fill(); c.fillStyle = '#e9ecef'; c.fillRect(x - 66, y - 92, 10, 5);
    }
  }
  /** ghế phía sau bàn (người ngồi đè lên) và ghế phía trước + 2 bên (che chân bàn) */
  const seatsBack = (c, e, x, y) => (isCafe(e) ? chair(c, x, y - 52, true) : stool(c, x, y - 58));
  function seatsFront(c, e, x, y) {
    if (isCafe(e)) { chair(c, x - 78, y - 30, false); chair(c, x + 78, y - 30, false); }
    else { stool(c, x - 98, y - 30); stool(c, x + 98, y - 30); stool(c, x - 34, y + 22, '#c92a2a'); stool(c, x + 34, y + 22, '#c92a2a'); }
  }

  /* ---------- món ăn đang bưng ra bàn của mình ---------- */
  let served = [], seat = null, orderBtn = null;
  const EAT_MS = 25000;
  function drawServed(c, e, x, y, t) {
    const now = Date.now(), topY = isCafe(e) ? y - 62 : y - 70;
    served = served.filter((s) => now < s.until);
    served.forEach((s, i) => {
      if (now < s.at) return;
      const px = x - 34 + i * 34, left = 1 - (now - s.at) / (s.until - s.at), drink = /🧋|☕|🍵|🥤|🧃|🍹|🥛|🍺|🍷|🍸/.test(s.icon);
      if (drink) { c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, px - 9, topY - 30, 18, 26, 4); c.fill(); }
      else { shadowE(c, px, topY + 2, 18, 6, 0.15); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(px, topY, 18, 7, 0, 0, TAU); c.fill(); c.strokeStyle = '#dee2e6'; c.lineWidth = 1.5; c.stroke(); }
      if (left > 0.08) { c.globalAlpha = 0.4 + 0.6 * left; emo(c, s.icon, px, topY - 10 - (drink ? 6 : 0), 14 + 12 * left); c.globalAlpha = 1; }
      // khói nóng bốc lên trong mấy giây đầu
      if (!drink && now - s.at < 9000) { c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { const ph = (t * 1.5 + k * 0.33) % 1; c.globalAlpha = 1 - ph; c.beginPath(); c.moveTo(px - 6 + k * 6, topY - 20 - ph * 26); c.quadraticCurveTo(px - 2 + k * 6, topY - 26 - ph * 26, px - 6 + k * 6, topY - 32 - ph * 26); c.stroke(); } c.globalAlpha = 1; }
    });
  }

  /* ---------- ngồi bàn, gọi món ---------- */
  function sitAt(e, i) {
    const [x, y] = TABLES[i];
    const used = NET.players().some((r) => Math.abs(r.rx - x) < 20 && Math.abs(r.ry - (y - 70)) < 20);
    if (used) return UI.toast('🙅 Bàn này có người ngồi rồi — chọn bàn khác nhé');
    if (!seat || seat.i !== i) served = [];
    seat = { e, i };
    AV.startPose('eat', `🍽️ Đã ngồi vào bàn ở ${e.name}`, { x, y: y - 70, dir: 1, sortY: y - 69, clipY: y - 84,
      front: (g, t) => { table(g, e, x, y); drawServed(g, e, x, y, t); seatsFront(g, e, x, y); }, back: [x, y + 46] });
    showOrderBtn(e);
    setTimeout(() => menu(e), 400);
  }
  /** nút "📜 Gọi món" nổi khi đang ngồi bàn (bấm màn hình là đứng dậy) */
  function showOrderBtn(e) {
    if (!orderBtn) {
      orderBtn = document.createElement('button'); orderBtn.className = 'eat-order';
      document.body.appendChild(orderBtn);
      setInterval(() => { if (orderBtn.style.display !== 'none' && (!AV.posing() || !String(AV.currentMap()).startsWith('eat_'))) orderBtn.style.display = 'none'; }, 500);
    }
    orderBtn.textContent = '📜 Gọi món';
    orderBtn.style.display = '';
    orderBtn.onclick = (ev) => { ev.stopPropagation(); menu(e); };
  }
  /** thực đơn kiểu tờ menu giấy */
  function menu(e) {
    const p = UI.panel(`📜 Thực đơn · ${e.name}`, '', { wide: false });
    p.el.classList.add('menu-card');
    const render = () => {
      const b = AV.belly(), full = !AV.canEat(), waiting = served.filter((s) => Date.now() < s.at).length;
      p.body.innerHTML = `<div class="mc-head"><span>${e.logo}</span><div><b>${e.name}</b><small>${e.sub || ''}</small></div></div>
        <div class="mc-list">${e.menu.map((it) => `<div class="mc-row"><span class="mc-ic">${it.icon}</span><span class="mc-name">${it.name}<small>+${it.xp} XP</small></span><i></i><b>${it.price} xu</b>
          <button class="btn small" data-o="${it.id}" ${full || served.length >= 3 ? 'disabled' : ''}>Gọi</button></div>`).join('')}</div>
        <div class="belly"><span>🍽️ No bụng</span><div class="qbar"><i style="width:${Math.min(100, b / DATA.BELLY.max * 100)}%;background:${full ? '#e03131' : '#40c057'}"></i></div><small>${full ? 'No rồi, đợi tiêu bớt' : 'Còn ăn được'}</small></div>
        <p class="muted small-note">${waiting ? '🛎️ Món đang được làm, sắp bưng ra…' : served.length >= 3 ? 'Bàn đầy món rồi — ăn bớt đã nhé 😋' : 'Gọi món xong món sẽ được bưng ra bàn của bạn.'} · 💰 ${AV.S.coins.toLocaleString('vi-VN')} xu</p>`;
      p.body.querySelectorAll('[data-o]').forEach((bt) => bt.onclick = () => {
        const it = e.menu.find((x) => x.id === bt.dataset.o);
        if (!AV.eat(e.id, it.id)) return render();
        const at = Date.now() + 1800 + served.length * 600;
        served.push({ icon: it.icon, at, until: at + EAT_MS });
        UI.toast(`🛎️ Đã gọi ${it.icon} ${it.name} — đợi chút món ra ngay!`, 2500);
        setTimeout(() => { if (AV.posing()) AV.sayMine(`${it.icon} Món ra rồi, ăn thôi! 😋`); }, at - Date.now());
        if (served.length >= 3 || !AV.canEat()) p.close(); else render();
      });
    };
    render();
  }

  /* ---------- dựng bản đồ bên trong quán ---------- */
  function buildMap(H, id) {
    const { base, ground, sobj, aobj, col, inter, npc } = H;
    const e = shopOf(id), cafe = isCafe(e);
    const m = base('eat_' + id, `${e.logo} ${e.name}`, W, H_);
    m.indoor = true; m.hz = 0; m.zoom = 0.8;
    ground(m, (g) => {
      // tường sau
      g.fillStyle = e.wall; g.fillRect(0, 0, W, 340);
      if (cafe) { g.fillStyle = 'rgba(90,55,25,.12)'; for (let x = 0; x < W; x += 46) g.fillRect(x, 0, 2, 340); g.fillStyle = shade(e.trim, -0.2); g.fillRect(0, 230, W, 110); g.fillStyle = 'rgba(255,255,255,.08)'; for (let x = 0; x < W; x += 60) g.fillRect(x, 230, 2, 110); }
      else { g.fillStyle = '#f8f9fa'; g.fillRect(0, 210, W, 130); g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1; for (let x = 0; x < W; x += 30) { g.beginPath(); g.moveTo(x, 210); g.lineTo(x, 340); g.stroke(); } for (let y = 210; y < 340; y += 30) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } }
      g.fillStyle = e.trim; g.fillRect(0, 330, W, 14);
      // sàn
      if (cafe) { for (let y = 344, r = 0; y < H_; y += 34, r++) { g.fillStyle = r % 2 ? '#a0703f' : '#946538'; g.fillRect(0, y, W, 34); g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = (r % 2) * 90; x < W; x += 180) g.fillRect(x, y, 2, 34); g.fillRect(0, y + 33, W, 1); } }
      else { for (let y = 344, r = 0; y < H_; y += 56, r++) for (let x = 0, k = 0; x < W; x += 56, k++) { g.fillStyle = (r + k) % 2 ? '#e9d8c4' : '#c2703d'; g.fillRect(x, y, 56, 56); } g.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 344; y < H_; y += 56) g.fillRect(0, y, W, 2); }
      // 2 tường bên + bậu cửa ra phố
      const sg = g.createLinearGradient(0, 0, 60, 0); sg.addColorStop(0, 'rgba(0,0,0,.35)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg; g.fillRect(0, 0, 60, H_);
      const sg2 = g.createLinearGradient(W, 0, W - 60, 0); sg2.addColorStop(0, 'rgba(0,0,0,.35)'); sg2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = sg2; g.fillRect(W - 60, 0, 60, H_);
      g.fillStyle = '#343a40'; g.fillRect(0, H_ - 30, W, 30);
      g.fillStyle = '#8f6a3f'; rr(g, DOOR - 90, H_ - 70, 180, 46, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,.15)'; for (let x = DOOR - 80; x < DOOR + 80; x += 12) g.fillRect(x, H_ - 66, 6, 38);
      g.fillStyle = '#ffe066'; g.font = '900 16px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.fillText('⬇ RA PHỐ', DOOR, H_ - 8);
    });
    // biển tên quán trên tường
    sobj(m, 330, 210, (c) => {
      c.fillStyle = e.signBg; rr(c, 90, 60, 480, 120, 18); c.fill(); c.strokeStyle = e.trim; c.lineWidth = 6; c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(160, 120, 42, 0, TAU); c.fill(); emo(c, e.logo, 160, 122, 50);
      c.fillStyle = e.signFg; c.font = `900 ${e.name.length > 13 ? 34 : 42}px "Be Vietnam Pro", system-ui`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(e.name, 220, 110);
      c.fillStyle = e.subFg || e.signFg; c.font = '800 16px "Be Vietnam Pro", system-ui'; c.fillText(e.sub || '', 222, 150);
    }, { l: -250, t: -160, w: 500, h: 170 }, 0);
    // cửa sổ nhìn ra phố
    sobj(m, 840, 250, (c) => {
      c.fillStyle = '#5c3a1e'; rr(c, 690, 70, 300, 170, 8); c.fill();
      const sk = c.createLinearGradient(0, 80, 0, 230); sk.addColorStop(0, '#a5d8ff'); sk.addColorStop(1, '#e7f5ff'); c.fillStyle = sk; c.fillRect(702, 82, 276, 146);
      c.fillStyle = '#8ce99a'; c.beginPath(); c.ellipse(760, 230, 70, 30, 0, Math.PI, 0); c.fill(); c.beginPath(); c.ellipse(900, 230, 80, 40, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#5c3a1e'; c.fillRect(836, 82, 8, 146); c.fillRect(702, 150, 276, 6);
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(720, 90); c.lineTo(760, 90); c.lineTo(720, 140); c.fill();
      c.fillStyle = e.trim; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(690 + k * 50, 66); c.lineTo(740 + k * 50, 66); c.lineTo(715 + k * 50, 92); c.fill(); }
    }, { l: -160, t: -190, w: 320, h: 200 }, 0);
    // bảng thực đơn trên tường (sau quầy)
    sobj(m, 1290, 300, (c) => {
      c.fillStyle = '#6b4423'; rr(c, 1090, 40, 400, 230, 10); c.fill();
      c.fillStyle = cafe ? '#2b2b2b' : '#1f3a2b'; rr(c, 1100, 50, 380, 210, 6); c.fill();
      c.fillStyle = '#fff3bf'; c.font = '900 22px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('✦ THỰC ĐƠN ✦', 1290, 76);
      e.menu.slice(0, 5).forEach((it, k) => {
        const y = 112 + k * 32;
        c.textAlign = 'left'; emo(c, it.icon, 1124, y, 20); c.textAlign = 'left';
        c.fillStyle = '#f8f9fa'; c.font = '700 15px "Be Vietnam Pro", system-ui'; c.fillText(it.name.length > 26 ? it.name.slice(0, 25) + '…' : it.name, 1142, y);
        c.textAlign = 'right'; c.fillStyle = '#ffd43b'; c.font = '900 15px "Be Vietnam Pro", system-ui'; c.fillText(it.price + ' xu', 1466, y);
      });
    }, { l: -210, t: -270, w: 420, h: 280 }, 0);
    // đèn thả (cà phê) / quạt trần (quán Việt)
    if (cafe) sobj(m, 640, 300, (c) => { [200, 640, 1000].forEach((x) => { c.strokeStyle = '#212529'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 40); c.stroke(); c.fillStyle = '#212529'; c.beginPath(); c.moveTo(x - 22, 62); c.lineTo(x + 22, 62); c.lineTo(x + 10, 40); c.lineTo(x - 10, 40); c.closePath(); c.fill(); const gl = c.createRadialGradient(x, 66, 2, x, 70, 60); gl.addColorStop(0, 'rgba(255,224,130,.9)'); gl.addColorStop(1, 'rgba(255,224,130,0)'); c.fillStyle = gl; c.beginPath(); c.arc(x, 70, 60, 0, TAU); c.fill(); }); }, { l: -500, t: -300, w: 1000, h: 140 }, 1);
    else aobj(m, 620, 40, (c, t) => { const x = 620, y = 40; c.strokeStyle = '#495057'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y); c.stroke(); c.save(); c.translate(x, y); c.scale(1, 0.35); c.rotate(t * 9); c.fillStyle = '#dee2e6'; for (let k = 0; k < 3; k++) { c.rotate(TAU / 3); c.beginPath(); c.ellipse(0, -34, 9, 34, 0, 0, TAU); c.fill(); } c.restore(); c.fillStyle = '#868e96'; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); }, { l: -50, t: -45, w: 100, h: 70 });
    // quầy + món bày trong tủ kính + nồi nước dùng / máy pha cà phê
    const CX = 1290, CY = 450;
    aobj(m, CX, CY, (c, t) => {
      shadowE(c, CX, CY + 4, 220, 14, 0.2);
      const g = c.createLinearGradient(0, CY - 60, 0, CY); g.addColorStop(0, shade(e.trim, 0.1)); g.addColorStop(1, shade(e.trim, -0.35));
      c.fillStyle = g; rr(c, CX - 210, CY - 62, 420, 62, 6); c.fill();
      c.fillStyle = cafe ? '#3b2412' : '#adb5bd'; rr(c, CX - 218, CY - 76, 436, 18, 6); c.fill();
      c.fillStyle = 'rgba(255,255,255,.18)'; for (let x = CX - 190; x < CX + 200; x += 70) c.fillRect(x, CY - 54, 34, 46);
      // tủ kính bày món
      c.fillStyle = 'rgba(208,235,255,.55)'; rr(c, CX - 200, CY - 126, 200, 52, 6); c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2; c.stroke();
      (e.items || []).forEach((ic, k) => emo(c, ic, CX - 165 + k * 64, CY - 100, 30));
      if (cafe) { c.fillStyle = '#495057'; rr(c, CX + 40, CY - 140, 90, 66, 8); c.fill(); c.fillStyle = '#ced4da'; rr(c, CX + 48, CY - 132, 74, 20, 4); c.fill(); c.fillStyle = '#212529'; c.fillRect(CX + 70, CY - 108, 30, 10); emo(c, '☕', CX + 85, CY - 84, 18); }
      else { c.fillStyle = '#868e96'; c.beginPath(); c.ellipse(CX + 90, CY - 104, 44, 14, 0, 0, TAU); c.fill(); c.fillStyle = '#495057'; c.fillRect(CX + 46, CY - 104, 88, 30); c.fillStyle = '#c2703d'; c.beginPath(); c.ellipse(CX + 90, CY - 106, 38, 10, 0, 0, TAU); c.fill(); }
      // hơi nóng bốc lên
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 3;
      for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1; c.globalAlpha = 1 - ph; c.beginPath(); c.moveTo(CX + 72 + k * 18, CY - 120 - ph * 50); c.quadraticCurveTo(CX + 82 + k * 18, CY - 132 - ph * 50, CX + 72 + k * 18, CY - 144 - ph * 50); c.stroke(); }
      c.globalAlpha = 1;
      // máy tính tiền
      c.fillStyle = '#343a40'; rr(c, CX + 150, CY - 112, 50, 38, 5); c.fill(); c.fillStyle = '#69db7c'; c.fillRect(CX + 158, CY - 106, 34, 10);
    }, { l: -230, t: -170, w: 460, h: 180 });
    col(m, CX - 215, CY - 40, 430, 40);
    inter(m, { x: CX - 210, y: CY - 130, w: 420, h: 130, ax: CX - 120, ay: CY + 40, name: `Quầy ${e.name} (mua mang đi)`, use: () => UI.eateryPanel(e.id), arrow: { x: CX - 120, y: CY - 140, text: 'Quầy' } });
    // nhân viên sau quầy + phục vụ đi giữa các bàn
    const apron = { skin: '#f1c27d', hair: cafe ? 'short' : 'bun', hairColor: '#3b2a1a', shirt: e.trim, shirtStyle: 'plain', pants: '#343a40', hat: cafe ? 'none' : 'none' };
    npc(m, cafe ? 'Barista' : 'Cô chủ quán', apron, { l: CX - 160, t: CY - 92, r: CX + 160, b: CY - 88 }, CX - 40, CY - 90);
    m.npcs[m.npcs.length - 1].lines = cafe ? ['Mời bạn vào ạ, hôm nay có đồ uống mới!', 'Ngồi bàn nào cũng được nha ☕', 'Uống gì để mình pha liền nè~'] : ['Mời vào ăn đi cháu ơi!', 'Nước dùng ninh từ sáng, ngon lắm!', 'Ngồi đi, cô bưng ra ngay 🍜', 'Thêm rau thơm không cháu?'];
    npc(m, 'Phục vụ', { skin: '#e3a979', hair: 'short', hairColor: '#2b2b33', shirt: '#f8f9fa', shirtStyle: 'plain', pants: '#212529', hat: 'none' }, { l: 140, t: 720, r: 1460, b: 740 }, 700, 730);
    m.npcs[m.npcs.length - 1].lines = ['Quý khách dùng gì ạ?', 'Món ra liền đây ạ!', 'Mời quý khách ngồi ạ 😊', 'Cảm ơn quý khách!'];
    // bàn ghế
    TABLES.forEach(([x, y], i) => {
      sobj(m, x, y - 50, (c) => seatsBack(c, e, x, y), { l: -40, t: -60, w: 80, h: 70 }, y - 75);
      sobj(m, x, y, (c) => { table(c, e, x, y); seatsFront(c, e, x, y); }, { l: -120, t: -110, w: 240, h: 150 });
      col(m, x - 80, y - 60, 160, 50);
      inter(m, { x: x - 90, y: y - 110, w: 180, h: 120, ax: x, ay: y + 46, name: `Bàn ${i + 1} (ngồi gọi món)`, use: () => sitAt(e, i) });
    });
    // chậu cây góc phòng
    [[90, 420], [1510, 940], [90, 940]].forEach(([x, y]) => sobj(m, x, y, (c) => { shadowE(c, x, y + 2, 26, 7, 0.2); c.fillStyle = '#c2703d'; c.beginPath(); c.moveTo(x - 22, y - 34); c.lineTo(x + 22, y - 34); c.lineTo(x + 16, y); c.lineTo(x - 16, y); c.fill(); emo(c, '🪴', x, y - 62, 64); }, { l: -40, t: -100, w: 80, h: 106 }));
    // cửa ra phố
    const sp = streetPos(id);
    inter(m, { x: DOOR - 100, y: H_ - 90, w: 200, h: 90, ax: DOOR, ay: H_ - 60, name: 'Ra phố', use: () => AV.teleport('farm', false, sp.x, sp.y, '🚶 Ra phố…'), arrow: { x: DOOR, y: H_ - 96, text: 'Ra ngoài' } });
    m.spawn = { x: DOOR, y: H_ - 70 };
    m.bounds = { l: 60, t: 470, r: W - 60, b: H_ - 40 };
    return m;
  }
  const H_ = H;

  if (!document.getElementById('eat-css')) {
    const s = document.createElement('style'); s.id = 'eat-css';
    s.textContent = `
.eat-order { position: fixed; left: 50%; bottom: 90px; transform: translateX(-50%); z-index: 30; font: inherit; font-weight: 900; font-size: 17px; color: #5c3010; background: linear-gradient(#ffe066, #fab005); border: 3px solid #5c3010; border-radius: 999px; padding: 10px 22px; box-shadow: 0 4px 0 #5c3010; cursor: pointer; }
.menu-card .panel-body { background: #fdf6e3 repeating-linear-gradient(0deg, transparent 0 27px, rgba(160,120,60,.08) 27px 28px); }
.mc-head { display: flex; align-items: center; gap: 10px; border-bottom: 3px double #b08968; padding-bottom: 8px; margin-bottom: 6px; }
.mc-head span { font-size: 38px; } .mc-head b { display: block; font-size: 20px; color: #5c3a1e; font-family: Georgia, "Be Vietnam Pro", serif; } .mc-head small { color: #8a6a4a; font-weight: 700; letter-spacing: .08em; }
.mc-list { display: grid; gap: 4px; margin-bottom: 8px; }
.mc-row { display: flex; align-items: center; gap: 8px; padding: 6px 4px; border-bottom: 1px dashed rgba(139,94,52,.35); }
.mc-ic { font-size: 30px; } .mc-name { display: grid; color: #3b2412; font-weight: 800; font-family: Georgia, "Be Vietnam Pro", serif; } .mc-name small { color: #2f9e44; font-weight: 700; font-family: inherit; }
.mc-row i { flex: 1; border-bottom: 2px dotted #c8a97a; margin: 0 4px 6px; } .mc-row b { color: #c92a2a; white-space: nowrap; }
`;
    document.head.appendChild(s);
  }
  return { buildMap, ids: () => DATA.EATERIES.map((e) => 'eat_' + e.id) };
})();
