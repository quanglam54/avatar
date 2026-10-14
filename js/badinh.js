/* 🇻🇳 QUẢNG TRƯỜNG BA ĐÌNH — Lăng Chủ tịch Hồ Chí Minh, cột cờ, thảm cỏ ô vuông, vòi phun tưới cỏ, Chùa Một Cột.
 * Khu trang nghiêm: không có trò giải trí, chỉ tham quan, viếng lăng, xem lễ thượng cờ (10 phút / lần theo đồng hồ),
 * ngắm cảnh hoàng hôn và tìm hiểu lịch sử (câu hỏi mỗi ngày). */
const BADINH = (() => {
  const S = () => AV.S;
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const circ = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  const rr = (c, x, y, w, h, r, col) => { c.fillStyle = col; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
  const txt = (c, s, x, y, size, col, w = 900) => { c.fillStyle = col; c.font = `${w} ${size}px "Be Vietnam Pro", system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y); };
  const today = () => new Date().toDateString();
  const CER = 10 * 60e3, CER_LEN = 60e3;
  const cerSec = () => { const n = Date.now() % CER; return n < CER_LEN ? n / 1000 : -1; };
  const cerIn = () => CER - (Date.now() % CER);
  const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const isNight = () => { const h = new Date().getHours() + new Date().getMinutes() / 60; return h >= 18.5 || h < 5.5; };

  /* ---------- vẽ ---------- */
  function flag(c, x, y, w, t, waveK = 1) {
    const h = w * 2 / 3;
    c.fillStyle = '#da251d'; c.beginPath(); c.moveTo(x, y);
    for (let k = 0; k <= 12; k++) c.lineTo(x + w * k / 12, y + Math.sin(t * 4 + k * 0.7) * w * 0.04 * waveK * (k / 12));
    for (let k = 12; k >= 0; k--) c.lineTo(x + w * k / 12, y + h + Math.sin(t * 4 + k * 0.7) * w * 0.04 * waveK * (k / 12));
    c.closePath(); c.fill();
    const sx = x + w / 2, sy = y + h / 2 + Math.sin(t * 4 + 4.2) * w * 0.02 * waveK, R = h * 0.3;
    c.fillStyle = '#ffde00'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? R * 0.382 : R; c.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); } c.closePath(); c.fill();
  }
  /** Lăng: bệ đá nhiều cấp, hàng cột vuông, mái bằng có dòng chữ HỒ CHÍ MINH */
  function mausoleum(c, x, y, k = 1) {
    c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 4, 330, 22, 0, 0, Math.PI * 2); c.fill();
    // bệ 3 cấp
    [[320, 26, '#6e5a58'], [290, 30, '#7d6a66'], [262, 26, '#8c7a74']].reduce((yy, [w, h, col]) => { c.fillStyle = col; c.fillRect(-w, yy - h, w * 2, h); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(-w, yy - h, w * 2, 4); return yy - h; }, 0);
    // bậc thang + cửa
    c.fillStyle = '#5c4846'; for (let i = 0; i < 5; i++) c.fillRect(-60 + i * 4, -82 + i * 16, 120 - i * 8, 4);
    // khối chính
    c.fillStyle = '#9a9a9e'; c.fillRect(-210, -270, 420, 190);
    c.fillStyle = '#7c7c82'; c.fillRect(-210, -270, 420, 14);
    // hàng cột
    for (let i = 0; i < 10; i++) { const cx = -189 + i * 42; c.fillStyle = '#b4b4b8'; c.fillRect(cx - 11, -250, 22, 168); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(cx + 5, -250, 6, 168); }
    c.fillStyle = '#4a3b3a'; for (let i = 0; i < 9; i++) c.fillRect(-168 + i * 42 - 9, -250, 18, 168);
    c.fillStyle = '#c0392b'; c.fillRect(-26, -150, 52, 68); c.fillStyle = '#7a2018'; c.fillRect(-20, -144, 40, 62);
    // mái
    c.fillStyle = '#8e8e94'; c.fillRect(-232, -322, 464, 54); c.fillStyle = '#a6a6ac'; c.fillRect(-232, -322, 464, 10);
    c.fillStyle = '#76767c'; c.fillRect(-222, -268, 444, 6);
    for (let i = 0; i < 3; i++) { c.fillStyle = ['#8a8a90', '#949499', '#9e9ea3'][i]; c.fillRect(-200 + i * 14, -342 - i * 10, 400 - i * 28, 22); }
    txt(c, 'HỒ CHÍ MINH', 0, -294, 28, '#b3261e');
    c.restore();
  }
  function lampPost(c, x, y, t, lit) {
    c.fillStyle = '#e8e2d0'; c.fillRect(x - 4, y - 150, 8, 150); c.fillStyle = '#cfc6ae'; c.fillRect(x - 9, y - 12, 18, 12);
    c.fillStyle = '#c92a2a'; c.fillRect(x - 10, y - 70, 20, 30); txt(c, '★', x, y - 55, 12, '#ffde00');
    [[-22, -150], [22, -150], [-14, -170], [14, -170], [0, -185], [0, -160]].forEach(([dx, dy]) => { if (lit) { c.fillStyle = 'rgba(255,230,160,.35)'; c.beginPath(); c.arc(x + dx, y + dy, 13, 0, Math.PI * 2); c.fill(); } circ(c, x + dx, y + dy, 7, lit ? '#fff3c4' : '#f1ece0'); c.strokeStyle = '#d8cfb8'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 140); c.lineTo(x + dx, y + dy); c.stroke(); });
  }
  function palm(c, x, y, s = 1) {
    c.strokeStyle = '#7a5a3a'; c.lineWidth = 8 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10 * s, y - 80 * s, x + 4 * s, y - 160 * s); c.stroke();
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.45; c.strokeStyle = '#2f6b2f'; c.lineWidth = 5 * s; c.beginPath(); c.moveTo(x + 4 * s, y - 160 * s); c.quadraticCurveTo(x + 4 * s + Math.cos(a) * 50 * s, y - 160 * s + Math.sin(a) * 40 * s - 10 * s, x + 4 * s + Math.cos(a) * 85 * s, y - 160 * s + Math.sin(a) * 30 * s + 30 * s); c.stroke(); }
  }
  function guard(c, x, y, step) {
    const lg = step ? Math.sin(step) * 6 : 0;
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y, 13, 4, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f8f9fa'; c.fillRect(x - 7, y - 30 + Math.max(0, lg), 6, 30 - Math.max(0, lg)); c.fillRect(x + 1, y - 30 + Math.max(0, -lg), 6, 30 - Math.max(0, -lg));
    c.fillStyle = '#212529'; c.fillRect(x - 8, y - 3, 7, 3); c.fillRect(x + 1, y - 3, 7, 3);
    c.fillStyle = '#ffffff'; c.fillRect(x - 9, y - 58, 18, 30); c.fillStyle = '#ffd43b'; c.fillRect(x - 9, y - 50, 18, 2); c.fillRect(x - 2, y - 58, 4, 30);
    c.fillStyle = '#c92a2a'; c.fillRect(x - 10, y - 58, 3, 6); c.fillRect(x + 7, y - 58, 3, 6);
    circ(c, x, y - 64, 7, '#f1c27d'); c.fillStyle = '#f8f9fa'; c.fillRect(x - 9, y - 75, 18, 7); c.fillStyle = '#212529'; c.fillRect(x - 10, y - 69, 20, 2); circ(c, x, y - 72, 2.5, '#ffd43b');
    c.strokeStyle = '#5c3a1e'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + 10, y - 30); c.lineTo(x + 12, y - 88); c.stroke(); c.strokeStyle = '#adb5bd'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 12, y - 88); c.lineTo(x + 12, y - 98); c.stroke();
  }
  function onePillar(c, x, y, t) {
    c.fillStyle = '#5c7a8a'; c.fillRect(x - 120, y - 40, 240, 50); c.fillStyle = '#4dabf7'; c.fillRect(x - 112, y - 34, 224, 38);
    c.fillStyle = 'rgba(255,255,255,.2)'; for (let k = 0; k < 6; k++) c.fillRect(x - 100 + ((k * 47 + t * 8) % 200), y - 26 + (k % 3) * 10, 22, 2);
    [[-80, -14], [70, -8], [-40, -4], [90, -22]].forEach(([dx, dy], i) => { c.fillStyle = '#40c057'; c.beginPath(); c.ellipse(x + dx, y + dy, 13, 6, 0, 0, Math.PI * 2); c.fill(); if (i % 2) circ(c, x + dx + 3, y + dy - 6, 5, '#f783ac'); });
    c.fillStyle = '#9a8a7a'; c.fillRect(x - 9, y - 110, 18, 90);
    c.fillStyle = '#8a3324'; c.fillRect(x - 46, y - 150, 92, 40); c.fillStyle = '#5c4a3a'; for (let i = 0; i < 5; i++) c.fillRect(x - 40 + i * 20, y - 146, 6, 34);
    c.fillStyle = '#6b2a1c'; c.beginPath(); c.moveTo(x - 72, y - 148); c.quadraticCurveTo(x - 40, y - 160, x, y - 196); c.quadraticCurveTo(x + 40, y - 160, x + 72, y - 148); c.closePath(); c.fill();
    c.strokeStyle = '#6b2a1c'; c.lineWidth = 5; c.beginPath(); c.moveTo(x - 72, y - 148); c.quadraticCurveTo(x - 86, y - 156, x - 84, y - 168); c.moveTo(x + 72, y - 148); c.quadraticCurveTo(x + 86, y - 156, x + 84, y - 168); c.stroke();
    rr(c, x - 30, y - 168, 60, 12, 3, '#f3d27a'); txt(c, 'LIÊN HOA ĐÀI', x, y - 162, 7, '#6b2a1c');
  }

  /* ---------- lễ thượng cờ: 10 phút 1 lần ---------- */
  const POLE = { x: 2350, y: 760, h: 520 };
  const LANG = { x: 1450, y: 520 };
  function ceremonyDraw(c, t) {
    const s = cerSec();
    // cột cờ + cờ
    c.fillStyle = '#c9c4b5'; c.fillRect(POLE.x - 26, POLE.y - 18, 52, 18); c.fillStyle = '#e9e4d6'; c.fillRect(POLE.x - 18, POLE.y - 30, 36, 14);
    c.fillStyle = '#ece8df'; c.fillRect(POLE.x - 4, POLE.y - POLE.h, 8, POLE.h - 28); circ(c, POLE.x, POLE.y - POLE.h - 4, 7, '#ffd43b');
    let lift = 1;
    if (s >= 0) lift = s < 18 ? 0 : s < 48 ? (s - 18) / 30 : 1;
    const fy = POLE.y - 70 - (POLE.h - 110) * lift;
    flag(c, POLE.x + 4, fy, 150, t, lift > 0.05 ? 1 : 0.2);
    if (s < 0) return;
    // đội tiêu binh diễu bước từ Lăng ra cột cờ rồi trở về
    const n = 9, go = s < 18 ? s / 18 : s < 48 ? 1 : Math.max(0, 1 - (s - 48) / 12);
    for (let i = 0; i < n; i++) {
      const q = Math.max(0, Math.min(1, go * 1.2 - i * 0.02));
      const x = LANG.x + 60 + (POLE.x - 100 - LANG.x - 60) * q + (i % 3) * 22 - 22, y = 600 + (POLE.y - 30 - 600) * q + Math.floor(i / 3) * 18;
      guard(c, x, y, (go > 0 && go < 1) || (s > 48 && s < 60) ? t * 9 + i : 0);
    }
    if (s > 18 && s < 48) { c.globalAlpha = 0.85; txt(c, '♪ Quốc ca ♪', POLE.x + 90, POLE.y - POLE.h - 30, 16, '#ffd43b'); c.globalAlpha = 1; }
  }

  /* ---------- viếng lăng, chùa, câu hỏi ---------- */
  function visit() {
    const p = UI.panel('🙏 Viếng Lăng Chủ tịch Hồ Chí Minh', `
      <p>Lăng Chủ tịch Hồ Chí Minh nằm giữa <b>Quảng trường Ba Đình</b> — nơi ngày <b>2/9/1945</b> Người đọc bản Tuyên ngôn Độc lập khai sinh nước Việt Nam Dân chủ Cộng hoà.</p>
      <p>Lăng được khởi công ngày <b>2/9/1973</b> và khánh thành ngày <b>29/8/1975</b>. Ngoài đời, lăng thường mở cửa đón khách buổi sáng các ngày thứ Ba, Tư, Năm, Bảy và Chủ nhật; khách viếng ăn mặc lịch sự, giữ trật tự, không chụp ảnh bên trong.</p>
      <p class="muted">Trong game: đặt một bó hoa và dành một phút tưởng niệm (mỗi ngày 1 lần, +25 XP).</p>
      <div class="row-end"><button class="btn" data-v>💐 Đặt hoa tưởng niệm</button></div>`);
    p.body.querySelector('[data-v]').onclick = () => {
      if (S().bdVisit === today()) { UI.toast('🙏 Hôm nay bạn đã viếng Lăng rồi'); return; }
      if ((S().inv.bd_flower || 0) < 1) { UI.toast('💐 Mua một bó hoa ở quầy hoa bên cạnh trước nhé'); return; }
      S().inv.bd_flower--; S().bdVisit = today(); AV.earn(0, 25); AV.markChanged();
      AV.sayMine('🙏'); p.close();
      UI.toast('🙏 Bạn đặt bó hoa, đứng nghiêm và dành một phút tưởng niệm Chủ tịch Hồ Chí Minh. +25 XP', 6000);
    };
  }
  function flowerStall() {
    UI.confirm('Mua <b>một bó hoa cúc trắng</b> để viếng Lăng (20 xu)?', '💐 Mua hoa', () => { if (!AV.spend(20)) return; AV.addItem('bd_flower', 1); UI.toast('💐 Đã mua bó hoa — vào Lăng để đặt hoa tưởng niệm'); });
  }
  if (DATA.ITEMS && !DATA.ITEMS.bd_flower) DATA.ITEMS.bd_flower = { name: 'Bó hoa viếng', icon: '💐', sell: 0 };
  function ceremonyInfo() {
    const s = cerSec();
    UI.panel('🇻🇳 Lễ thượng cờ', `<p>Ngoài đời, Lễ thượng cờ ở Quảng trường Ba Đình được tổ chức vào sáng sớm mỗi ngày, Lễ hạ cờ vào buổi tối, do Bộ Tư lệnh Bảo vệ Lăng thực hiện — đội tiêu binh diễu bước từ Lăng ra cột cờ, cờ được kéo lên trong tiếng Quốc ca.</p>
      <p>Trong game: cứ <b>10 phút</b> có một lễ thượng cờ mô phỏng, mọi người cùng xem.</p>
      <p style="font-size:20px;text-align:center;font-weight:900">${s >= 0 ? '🇻🇳 Đang diễn ra — xin giữ trật tự' : `⏳ Lễ tiếp theo sau ${mmss(cerIn())}`}</p>`);
  }
  function pagoda() {
    const p = UI.panel('🛕 Chùa Một Cột', `<p>Chùa Một Cột (Diên Hựu tự) được dựng năm <b>1049</b> dưới triều vua <b>Lý Thái Tông</b>. Chùa có hình dáng như một bông sen mọc lên từ mặt nước, đặt trên một cột đá giữa hồ vuông.</p>
      <div class="row-end"><button class="btn" data-p>🙏 Thắp hương cầu bình an</button></div>`);
    p.body.querySelector('[data-p]').onclick = () => { if (S().bdPagoda === today()) { UI.toast('🙏 Hôm nay bạn đã thắp hương rồi'); return; } S().bdPagoda = today(); AV.earn(0, 10); AV.markChanged(); p.close(); UI.toast('🙏 Cầu cho gia đình bình an, mạnh khoẻ. +10 XP', 4500); };
  }
  const QUIZ = [
    ['Chủ tịch Hồ Chí Minh đọc bản Tuyên ngôn Độc lập tại Quảng trường Ba Đình vào ngày nào?', ['19/8/1945', '2/9/1945', '7/5/1954', '30/4/1975'], 1],
    ['Lăng Chủ tịch Hồ Chí Minh được khánh thành năm nào?', ['1969', '1973', '1975', '1980'], 2],
    ['Lăng Chủ tịch Hồ Chí Minh được khởi công năm nào?', ['1969', '1973', '1975', '1976'], 1],
    ['Chùa Một Cột được dựng dưới triều vua nào?', ['Lý Thái Tổ', 'Lý Thái Tông', 'Trần Nhân Tông', 'Lê Thánh Tông'], 1],
    ['Chủ tịch Hồ Chí Minh sinh năm nào?', ['1890', '1895', '1911', '1930'], 0],
    ['Năm 1911, Người ra đi tìm đường cứu nước từ bến cảng nào?', ['Cảng Hải Phòng', 'Bến Nhà Rồng', 'Cảng Đà Nẵng', 'Bến Ninh Kiều'], 1],
    ['Quốc kỳ Việt Nam là lá cờ đỏ với ngôi sao vàng mấy cánh?', ['4 cánh', '5 cánh', '6 cánh', '8 cánh'], 1],
  ];
  function quiz() {
    const done = S().bdQuiz === today();
    const qs = QUIZ.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    let i = 0, right = 0;
    const p = UI.panel('📜 Tìm hiểu lịch sử', '', { wide: true });
    const render = () => {
      if (i >= qs.length) {
        const reward = !done && right >= 2;
        p.body.innerHTML = `<p style="font-size:18px;font-weight:900;text-align:center">Đúng ${right}/${qs.length} câu ${right === 3 ? '🏆' : ''}</p><p class="muted" style="text-align:center">${done ? 'Hôm nay bạn đã nhận thưởng rồi — mai quay lại nhé.' : reward ? 'Thưởng: +30 xu, +20 XP' : 'Đúng từ 2 câu trở lên để nhận thưởng hôm nay.'}</p><div class="row-end"><button class="btn" data-again>🔁 Làm lại</button></div>`;
        if (reward) { S().bdQuiz = today(); AV.earn(30, 20); AV.markChanged(); }
        p.body.querySelector('[data-again]').onclick = () => { p.close(); quiz(); };
        return;
      }
      const [q, opts, ans] = qs[i];
      p.body.innerHTML = `<p class="muted">Câu ${i + 1}/${qs.length}</p><p style="font-weight:800;font-size:16px">${q}</p><div class="shop-list">${opts.map((o, k) => `<button class="btn ghost" data-o="${k}" style="width:100%;margin:3px 0">${o}</button>`).join('')}</div>`;
      p.body.querySelectorAll('[data-o]').forEach((b) => b.onclick = () => {
        const k = +b.dataset.o; if (k === ans) right++;
        b.style.background = k === ans ? '#b2f2bb' : '#ffc9c9';
        p.body.querySelector(`[data-o="${ans}"]`).style.background = '#b2f2bb';
        p.body.querySelectorAll('[data-o]').forEach((x) => { x.disabled = true; });
        setTimeout(() => { i++; render(); }, 900);
      });
    };
    render();
  }

  /* ---------- cảnh ngắm Quảng trường Ba Đình lúc hoàng hôn (như ảnh) ---------- */
  function scene() {
    const v = document.getElementById('arcadeView');
    v.innerHTML = `<div class="arc-bar"><b>🌇 Quảng trường Ba Đình</b><span>Hoàng hôn trên thảm cỏ, cờ đỏ sao vàng tung bay</span><button class="tv-x" data-close>✕ Thoát</button></div>
      <div class="ht-scene"><canvas></canvas><div class="ht-tools"><button data-time>🌗 Đổi giờ</button><button data-snap>📸 Chụp ảnh</button></div></div>`;
    v.classList.add('show');
    const box = v.querySelector('.ht-scene'), cv = box.querySelector('canvas'), g = cv.getContext('2d');
    let raf = 0, late = 0; const t0 = performance.now();
    v.querySelector('[data-close]').onclick = () => { cancelAnimationFrame(raf); UI.closeArcade(); };
    v.querySelector('[data-time]').onclick = () => { late = (late + 1) % 2; };
    v.querySelector('[data-snap]').onclick = () => { cv.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'quang-truong-ba-dinh.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }); UI.toast('📸 Đã chụp ảnh — ảnh được tải về máy!'); };
    if (S().bdView !== today()) { S().bdView = today(); AV.earn(0, 15); AV.markChanged(); }
    const clouds = Array.from({ length: 14 }, (_, i) => ({ x: Math.random(), y: 0.05 + Math.random() * 0.35, w: 0.08 + Math.random() * 0.14, s: 0.004 + Math.random() * 0.006, k: i }));
    function frame(now) {
      if (!cv.isConnected) return;
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000, r = box.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), W = r.width, H = r.height;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const hz = H * 0.66;
      // trời
      const sk = g.createLinearGradient(0, 0, 0, hz);
      if (late) { sk.addColorStop(0, '#3a3f78'); sk.addColorStop(0.5, '#a0607a'); sk.addColorStop(1, '#f4a46a'); } else { sk.addColorStop(0, '#6d7fb8'); sk.addColorStop(0.45, '#e8a07a'); sk.addColorStop(1, '#f9c48a'); }
      g.fillStyle = sk; g.fillRect(0, 0, W, hz);
      const sx = W * 0.82, sy = H * (late ? 0.5 : 0.3), gl = g.createRadialGradient(sx, sy, 0, sx, sy, H * 0.4); gl.addColorStop(0, 'rgba(255,220,150,.9)'); gl.addColorStop(1, 'rgba(255,170,90,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, hz);
      circ(g, sx, sy, H * 0.035, '#fff3d6');
      clouds.forEach((cl) => { const x = ((cl.x + t * cl.s * 0.1) % 1.3 - 0.15) * W, y = cl.y * H, w = cl.w * W; g.fillStyle = late ? 'rgba(80,70,110,.55)' : 'rgba(120,110,150,.45)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + k * w * 0.25, y + Math.sin(k + cl.k) * 6, w * 0.3, w * 0.09, 0, 0, Math.PI * 2); g.fill(); } g.fillStyle = 'rgba(255,170,100,.35)'; g.beginPath(); g.ellipse(x + w * 0.35, y + w * 0.05, w * 0.35, w * 0.05, 0, 0, Math.PI * 2); g.fill(); });
      // toà nhà xa, cây, cọ
      g.fillStyle = 'rgba(120,110,130,.55)'; [[0.08, 0.16], [0.11, 0.24], [0.6, 0.1], [0.66, 0.14]].forEach(([x, h]) => g.fillRect(W * x, hz - H * h, W * 0.035, H * h));
      g.fillStyle = '#2d4a2f'; for (let x = 0; x < W; x += 26) { const h = 30 + 30 * Math.abs(Math.sin(x * 0.02)) + (x > W * 0.5 ? 20 : 0); g.beginPath(); g.ellipse(x, hz - h * 0.5, 30, h * 0.6, 0, 0, Math.PI * 2); g.fill(); }
      [[0.08, 0.9], [0.55, 1.1], [0.72, 1.0], [0.78, 0.9]].forEach(([x, s]) => palm(g, W * x, hz - 6, s * H / 500));
      // lăng
      mausoleum(g, W * 0.34, hz + 6, H / 620);
      // băng rôn
      rr(g, W * 0.7, hz - H * 0.07, W * 0.32, H * 0.05, 4, '#20c997'); g.fillStyle = '#c92a2a'; g.font = `900 ${Math.max(9, H * 0.024)}px "Be Vietnam Pro", system-ui`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('CHỦ TỊCH HỒ CHÍ MINH VĨ ĐẠI SỐNG MÃI…', W * 0.71, hz - H * 0.045);
      // cột đèn
      [0.18, 0.5, 0.64].forEach((x) => { g.save(); g.translate(W * x, hz + 10); g.scale(H / 600, H / 600); lampPost(g, 0, 0, t, late === 1); g.restore(); });
      // cột cờ + cờ lớn
      g.fillStyle = '#ece8df'; g.fillRect(W * 0.8, H * 0.12, Math.max(3, W * 0.004), hz - H * 0.12 + 20);
      flag(g, W * 0.8 + W * 0.004, H * 0.12, W * 0.085, t);
      // thảm cỏ ô vuông (phối cảnh)
      const gr = g.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, late ? '#7a9a3a' : '#a8c94a'); gr.addColorStop(1, late ? '#5f8f2a' : '#7fb83a'); g.fillStyle = gr; g.fillRect(0, hz, W, H - hz);
      g.fillStyle = '#d8d2c0'; g.fillRect(0, hz + 2, W, H * 0.025);
      g.strokeStyle = 'rgba(230,225,200,.85)'; g.lineWidth = 3;
      for (let i = 1; i < 6; i++) { const y = hz + H * 0.03 + (H - hz) * (i / 6) ** 1.6; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(W / 2 + i * W * 0.09, hz + H * 0.03); g.lineTo(W / 2 + i * W * 0.45, H); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 300; i++) g.fillRect((i * 97) % W, hz + 20 + (i * 53) % (H - hz - 20), 2, 6);
      // vòi phun tưới cỏ ánh vàng
      [[0.25, 0.86], [0.66, 0.84]].forEach(([x, y], k) => {
        const bx = W * x, by = H * y;
        for (let j = 0; j < 60; j++) { const a = Math.PI * (0.15 + 0.7 * (j / 60)) + Math.sin(t * 2 + k) * 0.25, ph = ((t * 0.7 + j * 0.13) % 1), d = ph * H * 0.32; const px = bx + Math.cos(a) * d * (k ? -1 : 1), py = by - Math.sin(a) * d * 0.9 + (ph * ph) * H * 0.22; g.fillStyle = `rgba(255,230,170,${0.55 * (1 - ph)})`; g.fillRect(px, py, 2.5, 2.5); }
        g.fillStyle = 'rgba(255,240,200,.25)'; g.beginPath(); g.ellipse(bx + (k ? -1 : 1) * H * 0.12, by - H * 0.05, H * 0.14, H * 0.05, k ? 0.3 : -0.3, 0, Math.PI * 2); g.fill();
      });
      // khách tham quan
      [[0.6, 0.78], [0.62, 0.79], [0.88, 0.74]].forEach(([x, y], i) => { const px = W * x + Math.sin(t * 0.3 + i) * 8, py = H * y, s = H / 700; g.fillStyle = ['#c92a2a', '#343a40', '#f08c00'][i]; g.fillRect(px - 5 * s, py - 30 * s, 10 * s, 20 * s); g.fillStyle = '#343a40'; g.fillRect(px - 4 * s, py - 10 * s, 8 * s, 10 * s); circ(g, px, py - 35 * s, 5 * s, '#f1c27d'); });
      txt(g, '🇻🇳 Quảng trường Ba Đình · Hà Nội', W / 2, 24, 15, 'rgba(255,255,255,.8)', 800);
    }
    raf = requestAnimationFrame(frame);
  }

  /* ======================================================================
   * 🗺️ Bản đồ Quảng trường Ba Đình
   * ==================================================================== */
  function buildMap(H) {
    const { base, ground, obj, sobj, col, inter, npc, paintGrass, paintStreet, addTree, street } = H;
    const W = 4200;
    const m = base('badinh', 'Quảng trường Ba Đình', W, 1070);
    m.solemn = true;
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 1945);
      g.fillStyle = '#d8d2c0'; g.fillRect(0, 520, W, 80); g.fillStyle = 'rgba(0,0,0,.05)'; for (let x = 0; x < W; x += 60) g.fillRect(x, 520, 2, 80);
      // thảm cỏ ô vuông
      g.fillStyle = '#e6e0cc'; g.fillRect(0, 600, W, 270);
      for (let x = 30; x < W; x += 200) for (let y = 612; y < 860; y += 82) { g.fillStyle = '#86c045'; g.fillRect(x, y, 186, 72); g.fillStyle = 'rgba(255,255,255,.08)'; for (let k = 0; k < 186; k += 14) g.fillRect(x + k, y, 7, 72); }
      paintStreet(g, m.w, 870, 1000);
    });
    /* bầu trời hoàng hôn như ảnh */
    obj(m, 2, (c, t) => {
      const night = isNight(), sk = c.createLinearGradient(0, -900, 0, m.hz);
      if (night) { sk.addColorStop(0, '#0b1030'); sk.addColorStop(1, '#3b2f5a'); } else { sk.addColorStop(0, '#6d7fb8'); sk.addColorStop(0.6, '#e8a07a'); sk.addColorStop(1, '#f9c48a'); }
      c.fillStyle = sk; c.fillRect(0, -900, W, m.hz + 900);
      if (!night) { const gl = c.createRadialGradient(3300, 170, 0, 3300, 170, 380); gl.addColorStop(0, 'rgba(255,215,150,.85)'); gl.addColorStop(1, 'rgba(255,190,120,0)'); c.fillStyle = gl; c.fillRect(2900, -230, 800, 800); circ(c, 3300, 170, 24, '#fff3d6'); }
      for (let k = 0; k < 9; k++) { const x = ((k * 520 + t * 6) % (W + 400)) - 200, y = 60 + (k % 4) * 55; c.fillStyle = night ? 'rgba(40,40,70,.6)' : 'rgba(120,110,150,.45)'; for (let j = 0; j < 4; j++) { c.beginPath(); c.ellipse(x + j * 50, y + Math.sin(j + k) * 6, 70, 18, 0, 0, Math.PI * 2); c.fill(); } }
      c.fillStyle = night ? 'rgba(30,25,50,.9)' : 'rgba(130,110,130,.45)'; for (let x = 0; x < W; x += 30) { const h = 20 + 40 * Math.abs(Math.sin(x * 0.011)); c.fillRect(x, m.hz - h, 24, h); }
    }, [0, -900, W, 520]);
    /* hàng cây + cọ phía sau */
    sobj(m, W / 2, 520, (c) => { c.fillStyle = '#2d5a2f'; for (let x = 0; x < W; x += 34) { const h = 60 + 40 * Math.abs(Math.sin(x * 0.017)); c.beginPath(); c.ellipse(x, 520 - h * 0.55, 40, h * 0.6, 0, 0, Math.PI * 2); c.fill(); } [[900, 1], [1990, 1.1], [2130, 0.95], [3050, 1]].forEach(([x, s]) => palm(c, x, 515, s)); }, { l: -W / 2 - 50, t: -230, w: W + 100, h: 240 });
    /* Phủ Chủ tịch (vàng) bên trái */
    sobj(m, 420, 515, (c) => { c.fillStyle = '#f2c94c'; c.fillRect(260, 380, 320, 135); c.fillStyle = '#d4a72c'; c.fillRect(260, 380, 320, 12); c.fillStyle = '#9c4221'; c.beginPath(); c.moveTo(250, 382); c.lineTo(420, 330); c.lineTo(590, 382); c.closePath(); c.fill(); c.fillStyle = '#fff'; for (let i = 0; i < 8; i++) { c.fillRect(278 + i * 38, 405, 16, 34); c.fillRect(278 + i * 38, 455, 16, 40); } txt(c, 'PHỦ CHỦ TỊCH', 420, 368, 13, '#fff8e1'); }, { l: -180, t: -200, w: 360, h: 210 });
    /* Lăng */
    sobj(m, LANG.x, LANG.y, (c) => mausoleum(c, LANG.x, LANG.y, 1), { l: -340, t: -360, w: 680, h: 370 });
    col(m, LANG.x - 320, LANG.y - 40, 640, 40);
    // 2 đài lễ hai bên
    [[LANG.x - 470, 1], [LANG.x + 470, -1]].forEach(([x]) => sobj(m, x, 520, (c) => { for (let r = 0; r < 4; r++) { c.fillStyle = ['#7d6a66', '#8c7a74', '#9a8a84', '#a89a94'][r]; c.fillRect(x - 120 + r * 6, 520 - 20 - r * 16, 240 - r * 12, 18); } c.fillStyle = '#c92a2a'; c.fillRect(x - 100, 452, 200, 6); }, { l: -130, t: -90, w: 260, h: 95 }));
    // 2 chiến sĩ gác lăng
    [LANG.x - 80, LANG.x + 80].forEach((x) => sobj(m, x, 548, (c) => guard(c, x, 548, 0), { l: -20, t: -105, w: 44, h: 110 }));
    inter(m, { x: LANG.x - 230, y: LANG.y - 330, w: 460, h: 330, ax: LANG.x, ay: 580, name: '🙏 Lăng Chủ tịch Hồ Chí Minh (viếng, tìm hiểu)', use: visit, arrow: { x: LANG.x, y: LANG.y - 380, text: 'Lăng Bác' } });
    /* băng rôn */
    sobj(m, 3000, 520, (c) => { c.fillStyle = '#868e96'; c.fillRect(2640, 470, 8, 50); c.fillRect(3352, 470, 8, 50); rr(c, 2620, 440, 760, 40, 4, '#20c997'); txt(c, 'CHỦ TỊCH HỒ CHÍ MINH VĨ ĐẠI SỐNG MÃI TRONG SỰ NGHIỆP CỦA CHÚNG TA', 3000, 460, 15, '#c92a2a'); }, { l: -390, t: -90, w: 780, h: 95 });
    /* cột đèn dọc đường Hùng Vương */
    for (let x = 300; x < W; x += 600) { sobj(m, x, 600, (c) => lampPost(c, x, 600, 0, false), { l: -40, t: -200, w: 80, h: 205 }); col(m, x - 10, 590, 20, 10); (m.lights = m.lights || []).push([x, 420, 70]); }
    /* cột cờ + lễ thượng cờ */
    obj(m, POLE.y, (c, t) => ceremonyDraw(c, t), [POLE.x - 200, POLE.y - POLE.h - 60, POLE.x + 260, POLE.y + 20]);
    col(m, POLE.x - 26, POLE.y - 18, 52, 18);
    inter(m, { x: POLE.x - 60, y: POLE.y - 180, w: 120, h: 180, ax: POLE.x, ay: POLE.y + 30, name: '🇻🇳 Cột cờ Ba Đình (lễ thượng cờ 10 phút / lần)', use: ceremonyInfo, arrow: { x: POLE.x, y: POLE.y - 200, text: 'Cột cờ' }, indicator: () => (cerSec() >= 0 ? '🇻🇳' : null), ix: POLE.x, iy: POLE.y - 140 });
    /* vòi phun tưới cỏ */
    obj(m, 700, (c, t) => {
      [[700, 700], [1700, 780], [3000, 700], [3900, 780]].forEach(([bx, by], k) => {
        for (let j = 0; j < 40; j++) { const ph = (t * 0.7 + j * 0.11 + k * 0.3) % 1, a = Math.PI * (0.2 + 0.6 * (j / 40)) + Math.sin(t * 1.5 + k) * 0.2, d = ph * 150; c.fillStyle = `rgba(200,235,255,${0.6 * (1 - ph)})`; c.fillRect(bx + Math.cos(a) * d, by - Math.sin(a) * d * 0.7 + ph * ph * 90, 3, 3); }
        circ(c, bx, by, 4, '#495057');
      });
    }, [600, 560, 4000, 820]);
    /* quầy hoa viếng */
    sobj(m, 1000, 640, (c) => { c.fillStyle = '#8a5a32'; c.fillRect(940, 600, 120, 40); c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { circ(c, 955 + i * 18, 596, 8, i % 2 ? '#fff' : '#fff3bf'); } c.fillStyle = '#2f9e44'; c.fillRect(950, 600, 100, 4); rr(c, 940, 556, 120, 24, 6, '#2f9e44'); txt(c, '💐 HOA VIẾNG', 1000, 568, 12, '#fff'); }, { l: -70, t: -95, w: 140, h: 100 });
    col(m, 940, 620, 120, 20);
    inter(m, { x: 935, y: 550, w: 130, h: 90, ax: 1000, ay: 670, name: '💐 Quầy hoa viếng (20 xu)', use: flowerStall, arrow: { x: 1000, y: 535, text: 'Hoa viếng' } });
    /* Chùa Một Cột */
    const PX = 3750, PY = 650;
    obj(m, PY, (c, t) => onePillar(c, PX, PY, t), [PX - 130, PY - 200, PX + 130, PY + 15]);
    col(m, PX - 120, PY - 40, 240, 50);
    inter(m, { x: PX - 110, y: PY - 200, w: 220, h: 200, ax: PX, ay: PY + 40, name: '🛕 Chùa Một Cột', use: pagoda, arrow: { x: PX, y: PY - 220, text: 'Chùa Một Cột' } });
    /* bảng tìm hiểu lịch sử + điểm ngắm cảnh */
    sobj(m, 2900, 830, (c) => { c.fillStyle = '#6b4423'; c.fillRect(2896, 770, 8, 60); rr(c, 2830, 700, 140, 76, 10, '#c92a2a'); rr(c, 2838, 708, 124, 60, 7, '#fff8e1'); txt(c, '📜 TÌM HIỂU', 2900, 726, 13, '#c92a2a'); txt(c, 'LỊCH SỬ', 2900, 744, 13, '#c92a2a'); txt(c, '3 câu hỏi mỗi ngày', 2900, 760, 9, '#5c3a1e', 800); }, { l: -80, t: -135, w: 160, h: 140 });
    col(m, 2895, 820, 10, 10);
    inter(m, { x: 2830, y: 700, w: 140, h: 130, ax: 2900, ay: 860, name: '📜 Tìm hiểu lịch sử (câu hỏi mỗi ngày)', use: quiz, arrow: { x: 2900, y: 685, text: 'Lịch sử' } });
    sobj(m, 2000, 830, (c) => { c.fillStyle = '#6b4423'; c.fillRect(1996, 780, 8, 50); rr(c, 1920, 724, 160, 60, 10, '#f08c00'); txt(c, '📷 ĐIỂM NGẮM CẢNH', 2000, 744, 12, '#fff'); txt(c, 'Hoàng hôn Ba Đình', 2000, 764, 11, '#fff8e1', 800); }, { l: -90, t: -115, w: 180, h: 120 });
    col(m, 1995, 820, 10, 10);
    inter(m, { x: 1920, y: 724, w: 160, h: 106, ax: 2000, ay: 860, name: '📷 Ngắm Quảng trường Ba Đình lúc hoàng hôn', use: scene, arrow: { x: 2000, y: 708, text: 'Ngắm cảnh' } });
    m.labels.push({ text: '🇻🇳 Quảng trường Ba Đình', x: 2100, y: 380 });
    [[160, 560, 'green'], [4100, 560, 'green']].forEach(([x, y, v]) => addTree(m, x, y, v));
    npc(m, 'Khách tham quan', { skin: '#f1c27d', hair: 'short', hairColor: '#212529', shirt: '#f8f9fa', shirtStyle: 'plain', pants: '#343a40', hat: 'none' }, { l: 300, t: 820, r: 3900, b: 850 }, 1300, 840);
    npc(m, 'Cô hướng dẫn viên', { skin: '#ffe0c4', hair: 'long', hairColor: '#212529', shirt: '#c92a2a', shirtStyle: 'plain', pants: '#212529', hat: 'none' }, { l: 1200, t: 820, r: 2400, b: 850 }, 1800, 845);
    street(m, 2100);
    m.objects = m.objects.filter((o) => o.y !== m.hz + 18); // bỏ hàng rào gỗ + tulip mặc định sau Lăng
    void paintStreet;
    m.spawn = { x: 2150, y: 875 };
    m.bounds = { l: 20, t: 560, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  let chip = null, wasCer = false;
  function init() {
    chip = document.createElement('div'); chip.className = 'ht-chip'; chip.style.borderColor = '#da251d'; document.body.appendChild(chip);
    chip.onclick = ceremonyInfo;
    setInterval(() => {
      const on = AV.currentMap && AV.currentMap() === 'badinh', s = cerSec();
      chip.style.display = on ? 'block' : 'none';
      if (on) chip.textContent = s >= 0 ? '🇻🇳 Lễ thượng cờ đang diễn ra — xin giữ trật tự' : `🇻🇳 Lễ thượng cờ sau ${mmss(cerIn())}`;
      if (on && s >= 0 && !wasCer && S().bdCer !== today()) { S().bdCer = today(); AV.earn(0, 15); UI.toast('🇻🇳 Lễ thượng cờ bắt đầu — +15 XP (lần đầu xem hôm nay)', 4000); }
      wasCer = on && s >= 0;
    }, 500);
  }
  return { init, buildMap, scene, visit };
})();
