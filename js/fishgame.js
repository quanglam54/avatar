/* 🎣 Mini-game kéo cá kiểu Stardew Valley: giữ (chuột / chạm / phím cách) để khung xanh nổi lên bám theo con cá.
 * Khung trùng cá → thanh tiến độ đầy dần; lệch → tụt. Đầy = câu được, cạn = cá thoát. Cá hiếm nhảy càng loạn. */
const FISHGAME = (() => {
  let el = null, cv = null, ctx = null, run = null;
  function ensure() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'fishgame';
    el.innerHTML = '<div class="fg-box"><div class="fg-title"></div><canvas width="180" height="360"></canvas><div class="fg-tip">Giữ chuột / chạm / phím <b>Space</b> để kéo khung xanh lên</div></div>';
    document.body.appendChild(el);
    cv = el.querySelector('canvas'); ctx = cv.getContext('2d');
    const down = (e) => { if (run) { run.hold = true; e.preventDefault(); } };
    const up = () => { if (run) run.hold = false; };
    el.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    window.addEventListener('keydown', (e) => { if (run && (e.code === 'Space' || e.key === ' ')) { run.hold = true; e.preventDefault(); } });
    window.addEventListener('keyup', (e) => { if (run && (e.code === 'Space' || e.key === ' ')) run.hold = false; });
  }
  /** diff 0..1 (độ khó cá), rodLv 0..4 (cấp cần câu), done(ok) */
  function start(fish, diff, rodLv, done) {
    ensure();
    const H = 320;
    run = {
      fish, diff, done, hold: false,
      fy: H * 0.5, fv: 0, ftarget: H * 0.5, nextJump: 0,
      by: H * 0.6, bv: 0, bh: 64 + rodLv * 12,
      prog: 0.3, t: 0, last: performance.now(), H,
    };
    el.querySelector('.fg-title').textContent = `${fish.icon} Cá cắn câu! Kéo lên nào…`;
    el.style.display = 'flex';
    requestAnimationFrame(loop);
  }
  function loop(now) {
    if (!run) return;
    const r = run, dt = Math.min(0.05, (now - r.last) / 1000);
    r.last = now; r.t += dt;
    // cá: chọn điểm đến ngẫu nhiên, cá khó đổi hướng nhanh và xa hơn
    r.nextJump -= dt;
    if (r.nextJump <= 0) {
      r.nextJump = 0.35 + Math.random() * (1.4 - r.diff);
      const span = 60 + r.diff * 220;
      r.ftarget = Math.max(12, Math.min(r.H - 12, r.fy + (Math.random() - 0.5) * 2 * span));
    }
    r.fv += (r.ftarget - r.fy) * (2 + r.diff * 6) * dt;
    r.fv *= 1 - Math.min(1, dt * (3.2 - r.diff));
    r.fy = Math.max(10, Math.min(r.H - 10, r.fy + r.fv * dt * 4));
    // khung xanh: giữ thì bay lên, thả thì rơi xuống
    r.bv += (r.hold ? -620 : 520) * dt;
    r.bv = Math.max(-420, Math.min(460, r.bv));
    r.by += r.bv * dt;
    if (r.by < 0) { r.by = 0; r.bv *= -0.35; }
    if (r.by > r.H - r.bh) { r.by = r.H - r.bh; r.bv *= -0.35; }
    const inside = r.fy >= r.by && r.fy <= r.by + r.bh;
    r.prog = Math.max(0, Math.min(1, r.prog + (inside ? 0.32 : -(0.2 + r.diff * 0.12)) * dt));
    draw(r, inside);
    if (r.prog >= 1 || r.prog <= 0) { const ok = r.prog >= 1; finish(ok); return; }
    requestAnimationFrame(loop);
  }
  function draw(r, inside) {
    const c = ctx;
    c.clearRect(0, 0, 180, 360);
    c.fillStyle = '#1b2f48'; c.beginPath(); c.roundRect(20, 20, 70, r.H + 20, 14); c.fill();
    const w = c.createLinearGradient(0, 30, 0, r.H + 30); w.addColorStop(0, '#74c0fc'); w.addColorStop(1, '#1864ab');
    c.fillStyle = w; c.fillRect(30, 30, 50, r.H);
    c.fillStyle = inside ? 'rgba(105,219,124,.9)' : 'rgba(105,219,124,.6)'; c.fillRect(32, 30 + r.by, 46, r.bh);
    c.strokeStyle = '#2b8a3e'; c.lineWidth = 3; c.strokeRect(32, 30 + r.by, 46, r.bh);
    c.font = '26px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(r.fish.icon, 55, 30 + r.fy + Math.sin(r.t * 18) * (1 + r.diff * 2));
    // thanh tiến độ
    c.fillStyle = '#1b2f48'; c.beginPath(); c.roundRect(110, 20, 34, r.H + 20, 10); c.fill();
    const ph = r.H * r.prog;
    c.fillStyle = r.prog > 0.66 ? '#40c057' : r.prog > 0.33 ? '#fab005' : '#fa5252';
    c.fillRect(118, 30 + r.H - ph, 18, ph);
  }
  function finish(ok) {
    const r = run; run = null;
    el.style.display = 'none';
    r.done(ok);
  }
  return { start, get active() { return !!run; } };
})();
