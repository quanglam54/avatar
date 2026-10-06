/* 🎤 Concert Ngàn Chông Gai: sân vận động cạnh H-Club — sân khấu lớn, màn LED chiếu video YouTube,
   5 anh trai hát nhảy, khói, pháo giấy, laser, ghế ngồi, khu VIP sát sân khấu, lightstick. */
const CONCERT = (() => {
  const VIDEO = '_41R6YGF4dA';
  const LED = { x: 560, y: 40, w: 880, h: 495 };
  const PRICE = { normal: 300, vip: 1500 }, STICK_PRICE = 150;
  const STICKS = [
    { id: 'red', name: 'Đỏ — Anh Lửa', col: '#ff3b3b' }, { id: 'cyan', name: 'Xanh ngọc — Anh Gió', col: '#22e3ff' },
    { id: 'yellow', name: 'Vàng — Anh Sấm', col: '#ffe14d' }, { id: 'white', name: 'Trắng — Anh Băng', col: '#f1f6ff' }, { id: 'purple', name: 'Tím — Anh Sao', col: '#b46bff' },
  ];
  const BROS = [
    { name: 'Anh Lửa', shirt: '#e03131', hair: 'spiky', hc: '#e8590c', stick: 'red' },
    { name: 'Anh Gió', shirt: '#15aabf', hair: 'emo', hc: '#2b2b33', stick: 'cyan' },
    { name: 'Anh Sấm', shirt: '#fab005', hair: 'mohawk', hc: '#f4d06f', stick: 'yellow' },
    { name: 'Anh Băng', shirt: '#f8f9fa', hair: 'short', hc: '#e9ecef', stick: 'white' },
    { name: 'Anh Sao', shirt: '#7950f2', hair: 'curly', hc: '#6b3e26', stick: 'purple' },
  ];
  const stickCol = (id) => (STICKS.find((s) => s.id === id) || {}).col;
  const today = () => new Date().toDateString();
  const ticket = () => { const c = AV.S.concert; return c && c.day === today() ? c : null; };
  const hasVip = () => !!(ticket() && ticket().vip);

  /* ---------- Toà sân vận động ở Khu giải trí ---------- */
  function building(c, x, y, t) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 4, 300, 26, 0, 0, Math.PI * 2); c.fill();
    // thân sân vận động hình vòm
    c.fillStyle = '#2b2d42'; c.beginPath(); c.moveTo(x - 280, y); c.lineTo(x - 280, y - 170); c.quadraticCurveTo(x, y - 300, x + 280, y - 170); c.lineTo(x + 280, y); c.closePath(); c.fill();
    c.fillStyle = '#3d405b'; for (let k = 0; k < 9; k++) c.fillRect(x - 270 + k * 62, y - 160, 8, 160);
    c.strokeStyle = '#8d99ae'; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 280, y - 170); c.quadraticCurveTo(x, y - 300, x + 280, y - 170); c.stroke();
    // đèn pha nhấp nháy theo nhạc
    for (let k = 0; k < 7; k++) { const on = Math.sin(t * 5 + k) > 0; const lx = x - 240 + k * 80, ly = y - 200 - Math.sin((k / 6) * Math.PI) * 70; c.fillStyle = on ? '#fff59a' : '#868e96'; c.beginPath(); c.arc(lx, ly, 8, 0, Math.PI * 2); c.fill(); }
    // biển tên
    c.fillStyle = '#0d0a14'; c.beginPath(); c.roundRect(x - 230, y - 160, 460, 70, 14); c.fill();
    c.strokeStyle = '#ffd43b'; c.lineWidth = 4; c.stroke();
    c.font = '900 30px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const g = c.createLinearGradient(x - 200, 0, x + 200, 0); g.addColorStop(0, '#ff6b6b'); g.addColorStop(0.5, '#ffd43b'); g.addColorStop(1, '#4dabf7');
    c.fillStyle = g; c.fillText('CONCERT NGÀN CHÔNG GAI', x, y - 125);
    // cổng vào + màn LED nhỏ
    c.fillStyle = '#111'; c.fillRect(x - 70, y - 80, 140, 80);
    c.fillStyle = `hsl(${(t * 60) % 360},80%,55%)`; c.fillRect(x - 62, y - 74, 124, 30);
    c.fillStyle = '#fff'; c.font = '900 15px "Be Vietnam Pro", system-ui'; c.fillText('🎤 LIVE TỐI NAY', x, y - 59);
    c.fillStyle = '#c92a2a'; c.fillRect(x - 40, y - 4, 80, 26);
    // bóng bay + lightstick cắm hai bên
    [[-160, '#ff3b3b'], [-120, '#22e3ff'], [120, '#ffe14d'], [160, '#b46bff']].forEach(([dx, col], k) => {
      c.fillStyle = '#495057'; c.fillRect(x + dx - 2, y - 60, 4, 60);
      c.fillStyle = col; c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4 + k); c.beginPath(); c.roundRect(x + dx - 7, y - 92, 14, 34, 7); c.fill(); c.globalAlpha = 1;
    });
  }

  /* ---------- Trong sân vận động ---------- */
  function stage(c, t) {
    // khung sân khấu + loa
    c.fillStyle = '#1a1424'; c.fillRect(380, 0, 1240, 640);
    [[430, 120], [1570, 120]].forEach(([x, y]) => {
      c.fillStyle = '#0a0a0a'; c.fillRect(x - 60, y, 120, 440);
      for (let k = 0; k < 4; k++) { const p = 1 + Math.abs(Math.sin(t * 8 + k)) * 0.1; c.fillStyle = '#333'; c.beginPath(); c.arc(x, y + 60 + k * 100, 38 * p, 0, Math.PI * 2); c.fill(); c.fillStyle = '#666'; c.beginPath(); c.arc(x, y + 60 + k * 100, 14, 0, Math.PI * 2); c.fill(); }
    });
    // viền màn LED (video thật hiện đè lên đúng chỗ này)
    c.fillStyle = '#05050a'; c.fillRect(LED.x - 14, LED.y - 14, LED.w + 28, LED.h + 28);
    c.strokeStyle = `hsl(${(t * 80) % 360},90%,60%)`; c.lineWidth = 6; c.strokeRect(LED.x - 10, LED.y - 10, LED.w + 20, LED.h + 20);
    // sàn sân khấu
    const g = c.createLinearGradient(0, 540, 0, 650); g.addColorStop(0, '#2d2440'); g.addColorStop(1, '#120d1c');
    c.fillStyle = g; c.fillRect(380, 545, 1240, 100);
    c.fillStyle = '#ffd43b'; c.fillRect(380, 640, 1240, 6);
    for (let k = 0; k < 16; k++) { c.fillStyle = (Math.floor(t * 4) + k) % 2 ? '#ff6b6b' : '#4dabf7'; c.beginPath(); c.arc(400 + k * 80, 643, 5, 0, Math.PI * 2); c.fill(); }
    c.font = '900 22px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffd43b';
    c.fillText('★ CONCERT NGÀN CHÔNG GAI ★', 1000, 568);
  }
  /** Khói, pháo giấy, laser (vẽ trên cùng) */
  function fx(c, t) {
    // laser từ đỉnh sân khấu
    c.save(); c.globalCompositeOperation = 'lighter';
    const cols = ['#ff3b3b', '#22e3ff', '#ffe14d', '#b46bff', '#3dff8b'];
    for (let k = 0; k < 8; k++) {
      const ox = 420 + k * 165, a = Math.PI / 2 + Math.sin(t * (0.9 + k * 0.13) + k) * 0.85;
      c.fillStyle = cols[k % 5]; c.globalAlpha = 0.12;
      c.beginPath(); c.moveTo(ox, 20); c.lineTo(ox + Math.cos(a - 0.03) * 1300, 20 + Math.sin(a - 0.03) * 1300); c.lineTo(ox + Math.cos(a + 0.03) * 1300, 20 + Math.sin(a + 0.03) * 1300); c.closePath(); c.fill();
    }
    c.restore();
    // khói trắng dưới chân sân khấu
    for (let k = 0; k < 14; k++) {
      const ph = (t * 0.25 + k / 14) % 1, x = 420 + ((k * 89) % 1160) + Math.sin(t + k) * 30, y = 650 - ph * 70;
      c.fillStyle = `rgba(235,235,255,${0.16 * (1 - ph)})`; c.beginPath(); c.ellipse(x, y, 60 + ph * 50, 22 + ph * 14, 0, 0, Math.PI * 2); c.fill();
    }
    // pháo giấy bung mỗi 15 giây, rơi khoảng 6 giây
    const cyc = t % 15;
    if (cyc < 6) for (let k = 0; k < 70; k++) {
      const sx = 400 + ((k * 173) % 1200), sy = -20 + cyc * (110 + (k % 7) * 18) - ((k * 37) % 120);
      if (sy < 0 || sy > 1150) continue;
      c.save(); c.translate(sx + Math.sin(t * 3 + k) * 20, sy); c.rotate(t * 4 + k);
      c.fillStyle = ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#f783ac', '#fff'][k % 6]; c.fillRect(-5, -3, 10, 6); c.restore();
    }
    // pháo tia hai bên sân khấu cùng lúc bung pháo giấy
    if (cyc < 1.2) [[470, 640], [1530, 640]].forEach(([x, y]) => { for (let k = 0; k < 12; k++) { const h = cyc * 400; c.fillStyle = `rgba(255,230,140,${1 - cyc / 1.2})`; c.fillRect(x - 3 + Math.sin(k) * 14, y - h - k * 8, 4, 10); } });
  }
  /** Khán đài hai bên sân khấu: fan vẫy lightstick */
  function crowd(c, t) {
    [[60, 340], [1660, 1940]].forEach(([x0, x1]) => {
      for (let row = 0; row < 7; row++) for (let x = x0 + (row % 2) * 18; x < x1; x += 38) {
        const y = 150 + row * 62, seed = (x * 7 + row * 13) % 17, bob = Math.max(0, Math.sin(t * 6 + seed)) * 5;
        c.fillStyle = ['#ff8787', '#74c0fc', '#ffd43b', '#b197fc', '#63e6be'][seed % 5]; c.fillRect(x - 10, y - bob, 20, 18);
        c.fillStyle = ['#ffd8b5', '#e3a979', '#f8c9a2'][seed % 3]; c.fillRect(x - 7, y - 14 - bob, 14, 14);
        c.fillStyle = '#2b2b33'; c.fillRect(x - 7, y - 16 - bob, 14, 5);
        const sw = Math.sin(t * 5 + seed) * 0.5, col = STICKS[seed % 5].col;
        c.save(); c.translate(x + 9, y - 6 - bob); c.rotate(sw);
        c.fillStyle = '#222'; c.fillRect(-2, 0, 4, 8);
        c.shadowColor = col; c.shadowBlur = 10; c.fillStyle = col; c.fillRect(-3, -18, 6, 18); c.restore();
      }
    });
  }
  /** Dãy ghế sân vận động */
  function seats(c, L, R, y) {
    for (let x = L; x <= R; x += 42) {
      c.fillStyle = '#c92a2a'; c.beginPath(); c.roundRect(x - 17, y - 50, 34, 30, [8, 8, 2, 2]); c.fill();
      c.fillStyle = '#e03131'; c.beginPath(); c.roundRect(x - 18, y - 24, 36, 12, 4); c.fill();
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x - 12, y - 46, 24, 4);
      c.fillStyle = '#495057'; c.fillRect(x - 15, y - 12, 4, 12); c.fillRect(x + 11, y - 12, 4, 12);
    }
  }
  function seatsFront(c, L, R, y) { for (let x = L; x <= R; x += 42) { c.fillStyle = '#e03131'; c.beginPath(); c.roundRect(x - 18, y - 24, 36, 12, 4); c.fill(); } }

  /** Lightstick cầm trên tay nhân vật (chỉ hiện trong sân vận động) */
  function heldStick(c, x, y, id, t, s = 1) {
    const col = stickCol(id);
    if (!col) return;
    c.save(); c.translate(x + 16 * s, y - 50 * s); c.rotate(Math.sin(t * 6) * 0.5); c.scale(s, s);
    c.fillStyle = '#222'; c.fillRect(-2.5, 0, 5, 12);
    c.shadowColor = col; c.shadowBlur = 14; c.fillStyle = col; c.beginPath(); c.roundRect(-4, -26, 8, 28, 4); c.fill();
    c.restore();
  }

  /* ---------- Màn LED: video YouTube thật đặt đè lên đúng vị trí màn trong thế giới game ---------- */
  let box = null, yt = null, ready = false, raf = 0, tapBtn = null, started = false;
  function ensureVideo() {
    if (box) return;
    box = document.createElement('div');
    box.className = 'led-video';
    box.innerHTML = '<div id="ledHolder"></div>';
    document.body.appendChild(box);
    tapBtn = document.createElement('button');
    tapBtn.className = 'led-tap'; tapBtn.textContent = '▶ Bấm để xem màn LED';
    tapBtn.onclick = () => { if (yt && ready) { yt.unMute(); yt.playVideo(); } tapBtn.style.display = 'none'; };
    document.body.appendChild(tapBtn);
    const make = () => {
      yt = new window.YT.Player('ledHolder', {
        width: '100%', height: '100%', videoId: VIDEO,
        playerVars: { autoplay: 1, playsinline: 1, controls: 0, rel: 0, modestbranding: 1, loop: 1, playlist: VIDEO, disablekb: 1 },
        events: {
          onReady: () => {
            ready = true;
            yt.setVolume(Math.round((typeof MUSIC !== 'undefined' ? MUSIC.volume : 0.6) * 100));
            // mọi người xem cùng một đoạn: tua theo giờ thật
            const d = yt.getDuration && yt.getDuration();
            if (d > 10) yt.seekTo((Date.now() / 1000) % d, true);
            yt.playVideo();
            setTimeout(() => { if (yt.getPlayerState && yt.getPlayerState() !== 1 && box.style.display !== 'none') tapBtn.style.display = 'block'; }, 1800);
          },
          onStateChange: (e) => { if (e.data === 1) tapBtn.style.display = 'none'; },
        },
      });
    };
    if (window.YT && window.YT.Player) make();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); make(); };
      if (!document.getElementById('ytApi')) { const sc = document.createElement('script'); sc.id = 'ytApi'; sc.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(sc); }
    }
  }
  /** Gọi mỗi khi đổi khu */
  function onMap(id) {
    if (id === 'concert') {
      ensureVideo();
      box.style.display = 'block';
      if (yt && ready) { const d = yt.getDuration(); if (d > 10) yt.seekTo((Date.now() / 1000) % d, true); yt.playVideo(); }
      started = true;
      cancelAnimationFrame(raf);
      const place = () => {
        raf = requestAnimationFrame(place);
        const a = AV.toScreen(LED.x, LED.y), b = AV.toScreen(LED.x + LED.w, LED.y + LED.h);
        box.style.left = a.x + 'px'; box.style.top = a.y + 'px'; box.style.width = (b.x - a.x) + 'px'; box.style.height = (b.y - a.y) + 'px';
        box.style.visibility = UI.isBlocking() ? 'hidden' : 'visible';
        tapBtn.style.left = ((a.x + b.x) / 2) + 'px'; tapBtn.style.top = ((a.y + b.y) / 2) + 'px';
      };
      place();
    } else if (started) {
      started = false;
      cancelAnimationFrame(raf);
      box.style.display = 'none'; tapBtn.style.display = 'none';
      if (yt && ready) yt.pauseVideo();
    }
  }

  /* ---------- Vé + lightstick ---------- */
  function buyTicket(vip) {
    const S = AV.S, cur = ticket(), price = vip ? (cur ? PRICE.vip - PRICE.normal : PRICE.vip) : PRICE.normal;
    if (cur && (cur.vip || !vip)) return true;
    if (!AV.spend(price)) return false;
    S.concert = { day: today(), vip: !!vip };
    AV.markChanged();
    UI.toast(vip ? '🎫 Đã mua vé VIP — đứng sát sân khấu!' : '🎟️ Đã mua vé thường — chọn ghế ngồi xem nhé!');
    if (AV.resetNav) AV.resetNav('concert');
    return true;
  }
  function ticketPanel(then) {
    const S = AV.S, cur = ticket();
    const p = UI.panel('🎤 Concert Ngàn Chông Gai · Mua vé', `
      <div class="ct-hero">🎤 5 anh trai · màn LED · khói · pháo giấy · laser</div>
      <div class="ct-tickets">
        <div class="ct-t"><b>🎟️ Vé thường</b><small>Ngồi ghế khán đài</small><em>${PRICE.normal.toLocaleString('vi-VN')} xu</em><button class="btn" data-t="0" ${cur ? 'disabled' : ''}>${cur ? 'Đã có vé' : 'Mua'}</button></div>
        <div class="ct-t vip"><b>🎫 Vé VIP</b><small>Đứng sát sân khấu (khu VIP)</small><em>${(cur && !cur.vip ? PRICE.vip - PRICE.normal : PRICE.vip).toLocaleString('vi-VN')} xu</em><button class="btn" data-t="1" ${cur && cur.vip ? 'disabled' : ''}>${cur && cur.vip ? 'Đã có VIP' : cur ? 'Nâng lên VIP' : 'Mua'}</button></div>
      </div>
      <p class="muted small-note">Vé dùng được cả ngày hôm nay. 💰 Bạn có ${S.coins.toLocaleString('vi-VN')} xu.</p>
      ${cur && then ? '<div class="row-end"><button class="btn" data-go>Vào xem ▶</button></div>' : ''}`);
    p.body.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { if (buyTicket(b.dataset.t === '1')) { p.close(); if (then) then(); else ticketPanel(); } });
    const go = p.body.querySelector('[data-go]');
    if (go) go.onclick = () => { p.close(); then(); };
  }
  function stickPanel() {
    const S = AV.S;
    const p = UI.panel('🔦 Quầy Lightstick', '');
    const render = () => {
      const own = S.sticks || [];
      p.body.innerHTML = `<p class="muted">Mỗi anh trai một màu — giơ lightstick cổ vũ anh trai bạn thích! (${STICK_PRICE} xu/cây)</p>
        <div class="shop-list">${STICKS.map((s) => `<div class="shop-row"><span class="ic" style="color:${s.col};text-shadow:0 0 8px ${s.col}">▮</span><div class="info"><b>${s.name}</b></div>
          ${S.look.stick === s.id ? '<button class="btn small ghost" data-off>Cất đi</button>' : own.includes(s.id) ? `<button class="btn small" data-use="${s.id}">Giơ lên</button>` : `<button class="btn small" data-buy="${s.id}">${STICK_PRICE} xu</button>`}</div>`).join('')}</div>`;
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { if (!AV.spend(STICK_PRICE)) return; S.sticks = [...own, b.dataset.buy]; S.look.stick = b.dataset.buy; AV.markChanged(); render(); });
      p.body.querySelectorAll('[data-use]').forEach((b) => b.onclick = () => { S.look.stick = b.dataset.use; AV.markChanged(); render(); });
      const off = p.body.querySelector('[data-off]');
      if (off) off.onclick = () => { S.look.stick = ''; AV.markChanged(); render(); };
    };
    render();
  }
  /** Vào sân vận động: cần vé hôm nay */
  function enter() {
    const go = () => AV.teleport('concert', false, 1000, 1110, '🎤 Vào Concert Ngàn Chông Gai…');
    if (ticket()) go(); else ticketPanel(go);
  }

  return { LED, BROS, STICKS, building, stage, fx, crowd, seats, seatsFront, heldStick, onMap, enter, ticketPanel, stickPanel, hasVip, stickCol };
})();
