/* H-Club: quán bar ở Khu giải trí — sàn nhảy LED, DJ, đèn laser, bàn rượu, nhạc riêng chỉ nghe khi ở trong quán */
const CLUB = (() => {
  const MUSIC_URL = 'https://youtu.be/mz6gUkYBgPA';
  const FLOOR = { x: 640, y: 560, cols: 9, rows: 5, s: 80 };
  const NEON = ['#ff3ea5', '#20e3ff', '#ffe14d', '#9d4dff', '#3dff8b', '#ff7a1a'];

  /** Toà nhà H-Club bên ngoài: tường đen, biển neon nhấp nháy, thảm đỏ + dây chắn */
  function building(c, x, y, t) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 4, 230, 22, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1424'; c.fillRect(x - 210, y - 250, 420, 250);
    c.fillStyle = '#2a2038'; for (let k = 0; k < 6; k++) c.fillRect(x - 210, y - 250 + k * 42, 420, 3);
    c.fillStyle = '#0d0a14'; c.fillRect(x - 222, y - 262, 444, 16);
    // biển neon
    const on = Math.sin(t * 6) > -0.6;
    c.fillStyle = '#0d0a14'; c.beginPath(); c.roundRect(x - 150, y - 236, 300, 76, 14); c.fill();
    c.shadowColor = '#ff3ea5'; c.shadowBlur = on ? 22 : 4;
    c.strokeStyle = on ? '#ff3ea5' : '#7a2050'; c.lineWidth = 4; c.beginPath(); c.roundRect(x - 140, y - 228, 280, 60, 12); c.stroke();
    c.font = '900 44px "Be Vietnam Pro", system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = on ? '#fff0fa' : '#a0507a'; c.fillText('H-CLUB', x, y - 197);
    c.shadowColor = '#20e3ff'; c.shadowBlur = 14; c.fillStyle = '#20e3ff'; c.font = '800 14px "Be Vietnam Pro", system-ui'; c.fillText('★ DJ · DANCE · BAR ★', x, y - 146);
    c.shadowBlur = 0;
    // cửa kính + đèn viền
    c.fillStyle = '#3a1f4a'; c.fillRect(x - 54, y - 120, 108, 120);
    c.fillStyle = 'rgba(157,77,255,.55)'; c.fillRect(x - 48, y - 114, 46, 112); c.fillRect(x + 2, y - 114, 46, 112);
    for (let k = 0; k < 10; k++) { c.fillStyle = NEON[(k + Math.floor(t * 4)) % NEON.length]; c.beginPath(); c.arc(x - 60 + (k % 5) * 0, y - 120 + k * 12, 3, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x + 60, y - 120 + k * 12, 3, 0, Math.PI * 2); c.fill(); }
    // cửa sổ có bóng người nhảy
    [[-150, -110], [150, -110]].forEach(([dx, dy], i) => {
      c.fillStyle = NEON[(Math.floor(t * 2) + i * 2) % NEON.length]; c.globalAlpha = 0.55; c.fillRect(x + dx - 40, y + dy - 30, 80, 60); c.globalAlpha = 1;
      c.fillStyle = '#0d0a14'; for (let p = 0; p < 3; p++) { const bob = Math.abs(Math.sin(t * 6 + p + i)) * 6; c.beginPath(); c.arc(x + dx - 24 + p * 24, y + dy - 6 - bob, 6, 0, Math.PI * 2); c.fill(); c.fillRect(x + dx - 30 + p * 24, y + dy - bob, 12, 30); }
      c.strokeStyle = '#2a2038'; c.lineWidth = 4; c.strokeRect(x + dx - 40, y + dy - 30, 80, 60);
    });
    // thảm đỏ + cột dây
    c.fillStyle = '#c92a2a'; c.fillRect(x - 40, y - 4, 80, 30);
    [-75, 75].forEach((dx) => { c.fillStyle = '#fcc419'; c.fillRect(x + dx - 3, y - 30, 6, 36); c.beginPath(); c.arc(x + dx, y - 32, 6, 0, Math.PI * 2); c.fill(); });
    c.strokeStyle = '#c92a2a'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 75, y - 24); c.quadraticCurveTo(x - 60, y - 8, x - 44, y - 20); c.moveTo(x + 75, y - 24); c.quadraticCurveTo(x + 60, y - 8, x + 44, y - 20); c.stroke();
  }

  /** Sàn nhảy LED đổi màu theo nhịp */
  function floor(ctx, t) {
    const beat = Math.floor(t * 2.2);
    for (let r = 0; r < FLOOR.rows; r++) for (let k = 0; k < FLOOR.cols; k++) {
      const x = FLOOR.x + k * FLOOR.s, y = FLOOR.y + r * FLOOR.s * 0.6;
      const lit = (k + r + beat) % 3 === 0 || (k * 7 + r * 3 + beat) % 5 === 0;
      ctx.fillStyle = lit ? NEON[(k + r * 2 + beat) % NEON.length] : '#241a33';
      ctx.globalAlpha = lit ? 0.85 : 1;
      ctx.fillRect(x + 2, y + 2, FLOOR.s - 4, FLOOR.s * 0.6 - 4);
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = '#ff3ea5'; ctx.lineWidth = 4; ctx.strokeRect(FLOOR.x - 2, FLOOR.y - 2, FLOOR.cols * FLOOR.s + 4, FLOOR.rows * FLOOR.s * 0.6 + 4);
  }

  /** Quầy DJ: bàn xoay đĩa, loa 2 bên, màn LED */
  function djBooth(c, x, y, t) {
    // loa
    [-230, 230].forEach((dx) => {
      c.fillStyle = '#111'; c.fillRect(x + dx - 50, y - 170, 100, 170);
      [-120, -50].forEach((dy, i) => { const pump = 1 + Math.abs(Math.sin(t * 9 + i)) * 0.12; c.fillStyle = '#333'; c.beginPath(); c.arc(x + dx, y + dy, 30 * pump, 0, Math.PI * 2); c.fill(); c.fillStyle = '#555'; c.beginPath(); c.arc(x + dx, y + dy, 12, 0, Math.PI * 2); c.fill(); });
    });
    // màn LED sau lưng DJ
    c.fillStyle = '#0d0a14'; c.fillRect(x - 170, y - 230, 340, 110);
    for (let k = 0; k < 16; k++) { const h = 10 + Math.abs(Math.sin(t * 5 + k * 0.7)) * 80; c.fillStyle = NEON[k % NEON.length]; c.fillRect(x - 160 + k * 20, y - 124 - h, 14, h); }
    c.font = '900 20px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.fillText('♪ DJ BOOTH ♪', x, y - 214);
  }
  function djDesk(c, x, y, t) {
    c.fillStyle = '#1a1424'; c.beginPath(); c.roundRect(x - 140, y - 56, 280, 60, 8); c.fill();
    c.strokeStyle = '#20e3ff'; c.lineWidth = 3; c.stroke();
    [-70, 70].forEach((dx) => {
      c.fillStyle = '#2b2b33'; c.beginPath(); c.ellipse(x + dx, y - 60, 34, 12, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.translate(x + dx, y - 60); c.rotate(t * 5); c.fillStyle = '#111'; c.beginPath(); c.ellipse(0, 0, 26, 9, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#e03131'; c.fillRect(-3, -2, 6, 4); c.restore();
    });
    c.fillStyle = '#495057'; c.fillRect(x - 22, y - 70, 44, 14);
    for (let k = 0; k < 6; k++) { c.fillStyle = NEON[(k + Math.floor(t * 6)) % NEON.length]; c.fillRect(x - 18 + k * 6, y - 66, 4, 6); }
    c.font = '900 18px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ff3ea5'; c.fillText('H-CLUB', x, y - 24);
  }

  /** Bàn tròn có chai rượu, ly, nến + ghế đẩu */
  function table(c, x, y, seed) {
    [[-46, 6], [46, 6], [0, 30]].forEach(([dx, dy]) => { c.fillStyle = '#7048e8'; c.beginPath(); c.ellipse(x + dx, y + dy, 16, 7, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#495057'; c.fillRect(x + dx - 2, y + dy, 4, 16); });
    c.fillStyle = '#495057'; c.fillRect(x - 4, y - 30, 8, 40);
    c.fillStyle = '#f1f3f5'; c.beginPath(); c.ellipse(x, y - 32, 44, 16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#dee2e6'; c.beginPath(); c.ellipse(x, y - 30, 44, 14, 0, 0, Math.PI); c.fill();
    // chai rượu vang + chai bia + ly
    const wine = seed % 2 === 0;
    c.fillStyle = wine ? '#5c1a2e' : '#2f9e44'; c.beginPath(); c.roundRect(x - 18, y - 70, 12, 34, 3); c.fill(); c.fillRect(x - 15, y - 82, 6, 14);
    c.fillStyle = '#ffd43b'; c.fillRect(x - 17, y - 60, 10, 8);
    c.fillStyle = '#e8590c'; c.beginPath(); c.roundRect(x + 2, y - 62, 9, 26, 3); c.fill(); c.fillRect(x + 4, y - 70, 5, 9);
    [[20, -44], [-30, -40], [30, -36]].forEach(([dx, dy], i) => {
      c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(x + dx - 6, y + dy - 12); c.lineTo(x + dx + 6, y + dy - 12); c.lineTo(x + dx + 2, y + dy - 2); c.lineTo(x + dx - 2, y + dy - 2); c.closePath(); c.fill();
      c.fillStyle = i % 2 ? '#c92a2a' : '#fab005'; c.fillRect(x + dx - 4, y + dy - 9, 8, 4);
      c.fillStyle = '#ced4da'; c.fillRect(x + dx - 1, y + dy - 2, 2, 6);
    });
    c.fillStyle = '#ffe066'; c.beginPath(); c.arc(x - 2, y - 46, 3, 0, Math.PI * 2); c.fill();
  }

  /** Quầy bar */
  function bar(c, x, y) {
    c.fillStyle = '#2a2038'; c.fillRect(x - 170, y - 170, 340, 100);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 10; k++) { c.fillStyle = NEON[(k + r * 3) % NEON.length]; c.globalAlpha = 0.8; c.beginPath(); c.roundRect(x - 155 + k * 32, y - 160 + r * 46, 12, 34, 3); c.fill(); c.globalAlpha = 1; }
    c.fillStyle = '#4a2c1a'; c.beginPath(); c.roundRect(x - 180, y - 60, 360, 62, 8); c.fill();
    c.fillStyle = '#6b3f22'; c.fillRect(x - 180, y - 64, 360, 12);
    c.strokeStyle = '#20e3ff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 176, y - 4); c.lineTo(x + 176, y - 4); c.stroke();
    c.font = '900 22px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffe14d'; c.fillText('🍸 BAR', x, y - 30);
  }

  /** Đèn laser + quả cầu disco (vẽ trên cùng) */
  function lights(ctx, t) {
    const cx = 1000, cy = 120;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 2 + Math.sin(t * (0.8 + k * 0.17) + k) * 0.9;
      const col = NEON[k % NEON.length];
      ctx.fillStyle = col; ctx.globalAlpha = 0.13;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a - 0.05) * 1100, cy + Math.sin(a - 0.05) * 1100); ctx.lineTo(cx + Math.cos(a + 0.05) * 1100, cy + Math.sin(a + 0.05) * 1100); ctx.closePath(); ctx.fill();
    }
    // đốm sáng chạy trên sàn
    for (let k = 0; k < 14; k++) {
      const px = 1000 + Math.sin(t * 0.7 + k * 1.7) * 700, py = 700 + Math.cos(t * 0.9 + k * 2.3) * 280;
      ctx.globalAlpha = 0.22; ctx.fillStyle = NEON[k % NEON.length]; ctx.beginPath(); ctx.ellipse(px, py, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // quả cầu disco
    ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, cy - 30); ctx.stroke();
    ctx.fillStyle = '#ced4da'; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 18; k++) { const a = k * 0.35 + t * 2; ctx.fillStyle = k % 3 ? '#fff' : NEON[k % NEON.length]; ctx.fillRect(cx + Math.cos(a) * 20 - 3, cy + Math.sin(k * 1.3) * 20 - 3, 6, 6); }
  }

  return { MUSIC_URL, FLOOR, NEON, building, floor, djBooth, djDesk, table, bar, lights };
})();
