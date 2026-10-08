/* 🦖 ĐẢO KHỦNG LONG — cổng ở cuối Khu giải trí. Mua 1 loài khủng long (trả xu 1 lần) rồi nuôi lớn dần qua nhiều lượt chơi.
 * Game chạy trong khung (arcade/games/dino.html); cứ vài giây gửi về độ lớn + hoá thạch → lưu vào S.dino, hoá thạch đổi ra xu.
 * Chết trên đảo thì con đó nở lại làm con non (vẫn còn của mình, không phải mua lại). */
const DINO = (() => {
  const FOSSIL_XU = 50;
  const SPECIES = [
    { id: 'galli', icon: '🦤', name: 'Gallimimus', diet: '🌿 Ăn cỏ', price: 10000, desc: 'Chân dài chạy nhanh nhất đảo · gặm dương xỉ, bụi quả · yếu, phải biết né kẻ săn mồi' },
    { id: 'raptor', icon: '🦖', name: 'Utahraptor', diet: '🥩 Ăn thịt', price: 15000, desc: 'Thợ săn có lông vũ, móng vuốt cong · săn Dryosaurus, ăn xác · đi theo đàn mạnh hơn' },
  ];
  const SOON = [['🦏', 'Triceratops'], ['🦕', 'Stegosaurus'], ['🦖', 'T-Rex'], ['🐊', 'Cá sấu Deino'], ['🦕', 'Spinosaurus'], ['🦅', 'Thằn lằn bay']];
  const STAGES = ['🐣 Con non', '🦎 Thiếu niên', '🦖 Trưởng thành'];
  const stageOf = (g) => (g < 0.33 ? 0 : g < 0.75 ? 1 : 2);
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const S = () => AV.S;
  const data = () => (S().dino = S().dino || { own: {}, fossils: 0 });
  let sess = null; // lượt đang chơi: { sid, sp, fos đã cộng }

  function panel() {
    const p = UI.panel('🦖 Đảo Khủng Long', '', { wide: true });
    const render = () => {
      const d = data();
      p.body.innerHTML = `<p class="muted" style="margin-top:0">Mua 1 con khủng long rồi <b>nuôi lớn</b> trên đảo: ăn đủ, uống đủ thì lớn dần <b>Con non → Thiếu niên → Trưởng thành</b> (lưu lại qua các lượt). Sống càng lâu, săn càng nhiều càng được 🦴 hoá thạch · <b>1 🦴 = ${FOSSIL_XU} xu</b>.</p>
        <div class="shop-list">${SPECIES.map((s) => {
          const o = d.own[s.id];
          const g = o ? o.g || 0 : 0;
          return `<div class="shop-row"><span class="ic" style="font-size:30px">${s.icon}</span><div class="info"><b>${s.name}</b> <small>${s.diet}</small><small>${s.desc}</small>
            ${o ? `<small>Đang là <b>${STAGES[stageOf(g)]}</b> · lớn ${Math.floor(g * 100)}%${o.deaths ? ` · đã chết ${o.deaths} lần` : ''}</small><div class="dn-bar"><i style="width:${Math.floor(g * 100)}%"></i></div>` : ''}</div>
            ${o ? `<button class="btn small" data-play="${s.id}">▶ Chơi</button>` : `<button class="btn small" data-buy="${s.id}">${fmt(s.price)} xu</button>`}</div>`;
        }).join('')}
        ${SOON.map(([ic, n]) => `<div class="shop-row" style="opacity:.55"><span class="ic" style="font-size:30px">${ic}</span><div class="info"><b>${n}</b><small>Sắp ra mắt</small></div><button class="btn small ghost" disabled>🔒</button></div>`).join('')}</div>
        <p class="muted small-note">🦴 Tổng hoá thạch đã đổi: <b>${fmt(d.fossils || 0)}</b> · Chết trên đảo thì con đó nở lại làm con non (không mất con, không phải mua lại). Cẩn thận 🐊 cá sấu rình mép nước!</p>`;
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => {
        const s = SPECIES.find((x) => x.id === b.dataset.buy);
        UI.confirm(`Mua <b>${s.icon} ${s.name}</b> giá <b>${fmt(s.price)} xu</b>? Bạn sẽ nuôi nó từ một con non mới nở.`, '🥚 Mua', () => {
          if (!AV.spend(s.price)) return;
          data().own[s.id] = { g: 0, deaths: 0 };
          AV.markChanged(); UI.toast(`🥚 Trứng ${s.name} đã nở! Bấm ▶ Chơi để ra đảo nuôi nó lớn`, 4000);
          render();
        });
      });
      p.body.querySelectorAll('[data-play]').forEach((b) => b.onclick = () => { p.close(); play(b.dataset.play); });
    };
    render();
  }

  function play(sp) {
    const o = data().own[sp];
    if (!o) return panel();
    sess = { sid: Date.now().toString(36), sp, fos: 0, kills: 0 };
    const v = document.getElementById('arcadeView');
    v.innerHTML = `<div class="arc-bar"><b>🦖 Đảo Khủng Long</b><span>Ăn uống đủ để lớn · 🦴 hoá thạch đổi ra xu khi thoát</span><button class="tv-x" data-close>✕ Thoát</button></div>
      <iframe src="arcade/games/dino.html?sp=${sp}&g=${(o.g || 0).toFixed(4)}&sid=${sess.sid}&pid=${encodeURIComponent(NET.pid || '')}&name=${encodeURIComponent(S().name || 'Bạn')}&v=${Date.now().toString(36)}" title="Đảo Khủng Long" allow="autoplay; fullscreen"></iframe>`;
    v.classList.add('show');
    v.querySelector('[data-close]').onclick = () => { UI.closeArcade(); finish(); };
    setTimeout(() => { const f = v.querySelector('iframe'); if (f) f.focus(); }, 300);
  }
  /** game gửi về: lưu độ lớn, cộng xu cho phần hoá thạch mới */
  function onSave(m) {
    if (!sess || m.sid !== sess.sid) return;
    const o = data().own[sess.sp];
    if (!o) return;
    if (m.dead && !sess.dead) o.deaths = (o.deaths || 0) + 1;
    sess.dead = !!m.dead;
    o.g = Math.max(0, Math.min(1, +m.g || 0));
    o.best = Math.max(o.best || 0, o.g);
    const fos = Math.max(0, m.fos | 0), add = fos - sess.fos;
    if (add > 0) { sess.fos = fos; data().fossils = (data().fossils || 0) + add; S().coins += add * FOSSIL_XU; UI.updateHud(); }
    sess.kills = m.kills | 0;
    AV.markChanged();
  }
  function finish() {
    if (!sess) return;
    const s = sess;
    NET.sendDino({ k: 'bye' });
    // chờ tin lưu cuối (game gửi lúc đóng khung) tới rồi mới kết thúc lượt
    setTimeout(() => { if (sess === s) sess = null; if (s.fos > 0) UI.toast(`🦖 Rời đảo: ${s.fos} 🦴 hoá thạch → +${fmt(s.fos * FOSSIL_XU)} xu${s.kills ? ` · 🎯 hạ ${s.kills} con` : ''}`, 5000); }, 400);
  }
  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type === 'dino-save') onSave(m);
    else if (m.type === 'dino-net' && sess && m.d && typeof m.d === 'object') NET.sendDino(m.d);
    else if (m.type === 'arcade-close' && sess) finish();
  });

  /** tin của người chơi khác trên đảo → chuyển vào game (đang mở) */
  function onNet(m) {
    if (!sess) return;
    const f = document.querySelector('#arcadeView iframe');
    if (f && f.contentWindow) f.contentWindow.postMessage({ type: 'dino-in', d: m }, '*');
  }

  /** cổng gỗ vào đảo (vẽ trên bản đồ Khu giải trí) */
  function gate(c, x, y, t) {
    c.save();
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 4, 200, 22, 0, 0, Math.PI * 2); c.fill();
    // núi lửa phía sau
    c.fillStyle = '#5c4a3d'; c.beginPath(); c.moveTo(x - 190, y - 40); c.lineTo(x - 60, y - 300); c.lineTo(x + 20, y - 300); c.lineTo(x + 170, y - 40); c.closePath(); c.fill();
    c.fillStyle = '#e8590c'; c.beginPath(); c.moveTo(x - 60, y - 300); c.lineTo(x - 30, y - 250); c.lineTo(x - 10, y - 280); c.lineTo(x + 20, y - 300); c.closePath(); c.fill();
    c.fillStyle = 'rgba(120,120,120,.45)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x - 20 + Math.sin(t + k) * 12 + k * 6, y - 320 - k * 26 - ((t * 10) % 26), 16 + k * 5, 0, Math.PI * 2); c.fill(); }
    // rặng cây rừng rậm
    const blob = (bx, by, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.fill(); };
    [[-170, -60, 50], [-120, -90, 46], [150, -70, 52], [110, -100, 44], [-200, -20, 36], [190, -20, 38]].forEach(([dx, dy, r]) => { blob(x + dx, y + dy, r, '#1f4d1a'); blob(x + dx - 8, y + dy - 10, r * 0.7, '#2f6b26'); blob(x + dx - 14, y + dy - 18, r * 0.35, '#4f8f3a'); });
    // 2 cột gỗ + xà ngang + biển
    c.fillStyle = '#6b4423'; c.fillRect(x - 120, y - 210, 26, 210); c.fillRect(x + 94, y - 210, 26, 210);
    c.fillStyle = '#4a2d14'; c.fillRect(x - 136, y - 226, 272, 24);
    c.fillStyle = '#8a5a32'; c.fillRect(x - 130, y - 222, 260, 6);
    c.strokeStyle = '#3d2410'; c.lineWidth = 3; [[-120, -190], [94, -190]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(x + dx, y + dy); c.lineTo(x + dx + 26, y + dy + 30); c.stroke(); });
    c.fillStyle = '#f1e3c3'; c.beginPath(); c.roundRect(x - 110, y - 196, 220, 52, 10); c.fill(); c.strokeStyle = '#4a2d14'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#5c3d14'; c.font = '900 22px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ĐẢO KHỦNG LONG', x, y - 176);
    c.font = '800 11px "Be Vietnam Pro", system-ui'; c.fillStyle = '#8a5a32'; c.fillText('NUÔI LỚN · SINH TỒN · SĂN MỒI', x, y - 156);
    // đầu lâu khủng long trên xà
    c.fillStyle = '#efe6cf'; c.beginPath(); c.ellipse(x, y - 236, 34, 18, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(x + 20, y - 244); c.lineTo(x + 62, y - 236); c.lineTo(x + 20, y - 226); c.fill();
    c.fillStyle = '#3d2410'; c.beginPath(); c.arc(x + 4, y - 240, 5, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(x + 24 + k * 7, y - 228); c.lineTo(x + 27 + k * 7, y - 220); c.lineTo(x + 30 + k * 7, y - 228); c.fill(); }
    // lối vào tối như rừng sâu + dấu chân
    const g = c.createLinearGradient(0, y - 140, 0, y); g.addColorStop(0, '#0f2a0c'); g.addColorStop(1, '#2f4a1f'); c.fillStyle = g; c.fillRect(x - 94, y - 140, 188, 140);
    c.fillStyle = 'rgba(255,230,120,.7)'; [[-30, -100], [26, -110]].forEach(([dx, dy]) => { if (Math.sin(t * 1.3 + dx) > -0.6) { c.beginPath(); c.arc(x + dx, y + dy, 3, 0, Math.PI * 2); c.arc(x + dx + 10, y + dy, 3, 0, Math.PI * 2); c.fill(); } });
    c.fillStyle = 'rgba(60,40,20,.55)'; [[-20, 30], [14, 54], [-16, 80]].forEach(([dx, dy]) => { c.beginPath(); c.ellipse(x + dx, y + dy, 9, 6, 0, 0, Math.PI * 2); c.fill(); [-1, 0, 1].forEach((s) => { c.beginPath(); c.ellipse(x + dx + s * 8, y + dy - 10, 3, 6, s * 0.4, 0, Math.PI * 2); c.fill(); }); });
    c.restore();
  }

  if (!document.getElementById('dn-css')) {
    const s = document.createElement('style'); s.id = 'dn-css';
    s.textContent = '.dn-bar { height: 7px; border-radius: 4px; background: #e9ecef; overflow: hidden; margin-top: 3px; } .dn-bar i { display: block; height: 100%; background: linear-gradient(90deg, #7048e8, #b197fc); }';
    document.head.appendChild(s);
  }
  return { panel, play, gate, onNet };
})();
