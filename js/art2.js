/* Hình vẽ cho các khu mới: giải trí, mua sắm, công viên, bãi biển, thú cưng */
Object.assign(ART, (() => {
  const { rr, shadow, circle, srand } = ART;

  /* ---------- Thú cưng ---------- */
  function pet(ctx, x, y, kind, dir, t, moving) {
    if (!kind || kind === 'none') return;
    const hop = moving ? Math.abs(Math.sin(t * 13)) * 3 : 0;
    shadow(ctx, x, y, kind === 'chick' ? 8 : 14, 4);
    ctx.save();
    ctx.translate(x, y - hop);
    ctx.scale(dir, 1);
    if (kind === 'babydragon') {
      ctx.restore();
      ctx.save();
      const fl = Math.sin(t * 3) * 4, wf = Math.sin(t * 12) * 0.5;
      ctx.translate(x, y - 30 + fl);
      ctx.scale(dir, 1);
      // cánh
      [-1, 1].forEach((sd) => {
        ctx.save(); ctx.translate(-2, -6); ctx.scale(1, sd > 0 ? 1 : 0.8); ctx.rotate(-0.4 + wf * sd * 0.6);
        ctx.fillStyle = sd > 0 ? '#ff8787' : '#e03131';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-8, -22, -20, -20); ctx.lineTo(-14, -12); ctx.lineTo(-18, -6); ctx.lineTo(-10, -4); ctx.closePath(); ctx.fill();
        ctx.restore();
      });
      // đuôi
      ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-8, 2); ctx.quadraticCurveTo(-18, 6 + Math.sin(t * 5) * 3, -22, -2); ctx.stroke();
      ctx.fillStyle = '#e03131'; ctx.beginPath(); ctx.moveTo(-22, -6); ctx.lineTo(-27, 0); ctx.lineTo(-20, 1); ctx.closePath(); ctx.fill();
      // thân + bụng
      ctx.fillStyle = '#40c057'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3bf'; ctx.beginPath(); ctx.ellipse(3, 3, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
      // đầu
      ctx.fillStyle = '#40c057'; ctx.beginPath(); ctx.ellipse(9, -11, 9, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(16, -8, 6, 4.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd43b';
      [[4, -18], [10, -20]].forEach(([hx, hy]) => { ctx.beginPath(); ctx.moveTo(hx - 2, hy + 3); ctx.lineTo(hx, hy - 4); ctx.lineTo(hx + 2, hy + 3); ctx.closePath(); ctx.fill(); });
      circle(ctx, 10, -13, 2.6, '#fff'); circle(ctx, 10.8, -13, 1.5, '#111');
      circle(ctx, 19, -9, 0.9, '#1b5e20');
      ctx.fillStyle = 'rgba(255,135,135,.6)'; ctx.beginPath(); ctx.arc(13, -7, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return;
    }
    if (kind === 'ghost' || kind === 'bat') {
      ctx.restore();
      ctx.save();
      const fl = Math.sin(t * 3) * 5;
      ctx.translate(x, y - 26 + fl);
      ctx.scale(dir, 1);
      if (kind === 'ghost') {
        ctx.fillStyle = 'rgba(248,249,250,.95)';
        ctx.beginPath(); ctx.arc(0, -10, 13, Math.PI, 0); ctx.lineTo(13, 8);
        for (let k = 13; k > -13; k -= 6.5) ctx.quadraticCurveTo(k - 3.25, 14 + Math.sin(t * 6 + k) * 2, k - 6.5, 8);
        ctx.closePath(); ctx.fill();
        circle(ctx, -4, -10, 2.4, '#212529'); circle(ctx, 5, -10, 2.4, '#212529');
        ctx.fillStyle = '#212529'; ctx.beginPath(); ctx.ellipse(1, -3, 2.4, 3, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        const wf = Math.sin(t * 16) * 0.6;
        ctx.fillStyle = '#4b2e83';
        [-1, 1].forEach((sd) => {
          ctx.save(); ctx.scale(sd, 1); ctx.rotate(wf * 0.5);
          ctx.beginPath(); ctx.moveTo(4, -4); ctx.quadraticCurveTo(16, -16, 24, -6); ctx.quadraticCurveTo(18, -6, 16, 0); ctx.quadraticCurveTo(12, -3, 8, 2); ctx.closePath(); ctx.fill();
          ctx.restore();
        });
        circle(ctx, 0, -2, 7, '#5f3dc4');
        ctx.beginPath(); ctx.moveTo(-5, -7); ctx.lineTo(-3, -13); ctx.lineTo(-1, -8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(5, -7); ctx.lineTo(3, -13); ctx.lineTo(1, -8); ctx.fill();
        circle(ctx, -2.5, -3, 1.4, '#ffd43b'); circle(ctx, 2.5, -3, 1.4, '#ffd43b');
      }
      ctx.restore();
      return;
    }
    if (kind === 'chick') {
      circle(ctx, 0, -8, 8, '#ffe066');
      circle(ctx, 5, -15, 5.5, '#ffe066');
      ctx.fillStyle = '#ff922b';
      ctx.beginPath(); ctx.moveTo(10, -15); ctx.lineTo(14, -13.5); ctx.lineTo(10, -12); ctx.fill();
      circle(ctx, 7, -16, 1.1, '#222');
    } else if (kind === 'bunny') {
      ctx.fillStyle = '#f8f9fa';
      ctx.beginPath(); ctx.ellipse(-2, -10, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
      circle(ctx, 9, -16, 7, '#f8f9fa');
      ctx.beginPath(); ctx.ellipse(6, -29, 2.6, 8, -0.15, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(11, -28, 2.6, 8, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffc9c9';
      ctx.beginPath(); ctx.ellipse(6, -29, 1.2, 5, -0.15, 0, Math.PI * 2); ctx.fill();
      circle(ctx, -13, -10, 3.5, '#fff');
      circle(ctx, 11, -17, 1.4, '#222');
      circle(ctx, 15, -14, 1.2, '#ff8fab');
    } else if (kind === 'dino' || kind === 'dino_pink') {
      const P = kind === 'dino' ? { b: '#69db7c', d: '#2f9e44', s: '#ffd43b', belly: '#d3f9d8' } : { b: '#f783ac', d: '#c2255c', s: '#fff3bf', belly: '#ffdeeb' };
      const wag = Math.sin(t * 6) * 2;
      // đuôi dài
      ctx.fillStyle = P.b;
      ctx.beginPath(); ctx.moveTo(-6, -20); ctx.quadraticCurveTo(-20, -16 + wag, -30, -8 + wag); ctx.quadraticCurveTo(-18, -7, -6, -9); ctx.closePath(); ctx.fill();
      // chân
      ctx.fillStyle = P.d;
      [-6, 5].forEach((lx, i) => { const lift = moving ? Math.max(0, Math.sin(t * 12 + i * 3)) * 3 : 0; rr(ctx, lx - 3.5, -9 - lift, 7, 9, 3); ctx.fill(); });
      // thân + bụng
      ctx.fillStyle = P.b; ctx.beginPath(); ctx.ellipse(0, -16, 12, 10, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.belly; ctx.beginPath(); ctx.ellipse(4, -13, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
      // gai lưng
      ctx.fillStyle = P.s;
      [[-14, -14], [-9, -22], [-3, -25], [3, -25]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.moveTo(sx - 3, sy + 2); ctx.lineTo(sx, sy - 5); ctx.lineTo(sx + 3, sy + 2); ctx.closePath(); ctx.fill(); });
      // cổ + đầu
      ctx.fillStyle = P.b;
      ctx.beginPath(); ctx.ellipse(8, -24, 5, 8, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(13, -31, 8, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(19, -29, 6, 4.6, 0, 0, Math.PI * 2); ctx.fill();
      circle(ctx, 14, -33, 2, '#fff'); circle(ctx, 14.6, -33, 1.2, '#111');
      circle(ctx, 22.5, -30, 0.9, P.d);
      ctx.strokeStyle = P.d; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(19, -28, 3, 0.2, Math.PI - 0.6); ctx.stroke();
      // tay ngắn
      ctx.strokeStyle = P.d; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(9, -17); ctx.lineTo(12, -13 + Math.sin(t * 8) * 1); ctx.stroke();
    } else {
      const body = { dog: '#e8a94d', pug: '#e9d3b0', cat: '#f4a261' }[kind];
      const dark = { dog: '#c47f2c', pug: '#3b3b3b', cat: '#d07a3a' }[kind];
      ctx.fillStyle = body;
      rr(ctx, -13, -18, 24, 13, 6); ctx.fill();
      ctx.fillStyle = dark;
      [-10, -4, 4, 9].forEach((lx, i) => {
        const lift = moving ? Math.max(0, Math.sin(t * 13 + i * 1.6)) * 3 : 0;
        rr(ctx, lx - 2, -7 - lift, 4, 7, 2); ctx.fill();
      });
      ctx.strokeStyle = body; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-12, -14);
      if (kind === 'cat') ctx.quadraticCurveTo(-22, -16, -20, -28 + Math.sin(t * 4) * 2);
      else if (kind === 'pug') ctx.arc(-15, -18, 3, 0, Math.PI * 1.5);
      else ctx.quadraticCurveTo(-20, -20 - Math.abs(Math.sin(t * 10)) * 4, -18, -24);
      ctx.stroke();
      circle(ctx, 12, -20, 9, body);
      if (kind === 'cat') {
        ctx.fillStyle = body;
        ctx.beginPath(); ctx.moveTo(6, -26); ctx.lineTo(7, -34); ctx.lineTo(12, -28); ctx.fill();
        ctx.beginPath(); ctx.moveTo(13, -28); ctx.lineTo(18, -34); ctx.lineTo(19, -25); ctx.fill();
        ctx.strokeStyle = dark; ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 6, -18); ctx.lineTo(-6 + i * 6, -12); ctx.stroke(); }
      } else {
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.ellipse(6, -22, 3.5, 6, 0.4, 0, Math.PI * 2); ctx.fill();
        if (kind === 'pug') { ctx.beginPath(); ctx.ellipse(15, -18, 6, 5, 0, 0, Math.PI * 2); ctx.fill(); }
      }
      circle(ctx, 14, -22, 1.6, '#111');
      circle(ctx, 20, -18, 2, kind === 'cat' ? '#ff8fab' : '#111');
    }
    ctx.restore();
  }

  /* ---------- Trang trí ---------- */
  function flowerPot(ctx, x, y, kind) {
    shadow(ctx, x, y, 22, 6);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.moveTo(x - 18, y - 26); ctx.lineTo(x + 18, y - 26); ctx.lineTo(x + 13, y); ctx.lineTo(x - 13, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd43b'; ctx.fillRect(x - 18, y - 26, 36, 4);
    ctx.strokeStyle = '#6f4420'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, y - 26); ctx.lineTo(x - 2, y - 52); ctx.lineTo(x - 14, y - 66); ctx.moveTo(x - 2, y - 52); ctx.lineTo(x + 12, y - 70); ctx.stroke();
    const r = srand(x + y);
    const c = kind === 'mai' ? ['#fcc419', '#ffe066'] : ['#f783ac', '#ffc2d8'];
    for (let i = 0; i < 22; i++) {
      const fx = x - 26 + r() * 52, fy = y - 92 + r() * 44;
      circle(ctx, fx, fy, 3.4, c[i % 2]);
      circle(ctx, fx, fy, 1.2, '#e8590c');
    }
  }

  function palm(ctx, x, y, t) {
    shadow(ctx, x + 10, y, 40, 9);
    ctx.fillStyle = '#a47148';
    for (let i = 0; i < 8; i++) {
      const sx = x + Math.sin(i * 0.25) * 10 * (i / 8);
      rr(ctx, sx - 8 + i * 0.4, y - 16 - i * 16, 16 - i * 0.5, 18, 5); ctx.fill();
    }
    const tx = x + 9, ty = y - 140;
    const sway = Math.sin(t * 1.2) * 0.06;
    ctx.fillStyle = '#2f9e44';
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI + i * (Math.PI / 6) + sway;
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(38, 6, 40, 9, 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    circle(ctx, tx - 6, ty + 8, 6, '#8b5a2b');
    circle(ctx, tx + 6, ty + 9, 6, '#8b5a2b');
  }

  function umbrella(ctx, x, y, color) {
    shadow(ctx, x, y + 4, 52, 12, 0.12);
    ctx.fillStyle = '#fff';
    rr(ctx, x - 30, y - 12, 50, 12, 4); ctx.fill();
    ctx.fillStyle = color;
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 28 + i * 12, y - 11, 6, 10);
    ctx.fillStyle = '#868e96'; ctx.fillRect(x + 22, y - 110, 4, 110);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : color;
      ctx.beginPath();
      ctx.moveTo(x + 24, y - 132);
      ctx.lineTo(x + 24 - 62 + i * 20.6, y - 100);
      ctx.lineTo(x + 24 - 62 + (i + 1) * 20.6, y - 100);
      ctx.closePath(); ctx.fill();
    }
  }

  function pickup(ctx, x, y, icon, t, size = 22) {
    const b = Math.sin(t * 3 + x) * 2 * size / 22;
    shadow(ctx, x, y, 9 * size / 22, 3 * size / 22);
    ctx.font = size + 'px system-ui, "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#000';
    ctx.fillText(icon, x, y - 2 + b);
    ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(t * 6 + x) * 0.5})`;
    circle(ctx, x + 9, y - 20 + b, 2, ctx.fillStyle);
  }

  function seaWaves(ctx, w, y, t) {
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let row = 0; row < 3; row++) {
      const yy = y - 30 - row * 55 + Math.sin(t * 1.5 + row) * 4;
      ctx.beginPath();
      for (let x = -40 + ((t * 30 * (row % 2 ? -1 : 1)) % 80); x < w + 40; x += 80) {
        ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + 20, yy - 10, x + 40, yy);
      }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    const foam = y + Math.sin(t * 1.2) * 6;
    ctx.beginPath(); ctx.moveTo(0, foam);
    for (let x = 0; x <= w; x += 40) ctx.quadraticCurveTo(x + 20, foam + 10, x + 40, foam);
    ctx.lineTo(w, foam - 12); ctx.lineTo(0, foam - 12); ctx.closePath(); ctx.fill();
  }

  function lake(ctx, x, y, rx, ry, t) {
    ctx.fillStyle = '#69db7c';
    ctx.beginPath(); ctx.ellipse(x, y, rx + 16, ry + 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4dabf7';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#74c0fc';
    ctx.beginPath(); ctx.ellipse(x - rx * 0.15, y - ry * 0.2, rx * 0.65, ry * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const px = x - rx * 0.7 + ((i * 97 + t * 12) % (rx * 1.4)), py = y - ry * 0.5 + (i * 37 % (ry));
      ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 10, py - 4, px + 20, py); ctx.stroke();
    }
    // vịt
    for (let i = 0; i < 3; i++) {
      const a = t * 0.15 + i * 2.1;
      const dx = x + Math.cos(a) * rx * 0.55, dy = y + Math.sin(a) * ry * 0.45;
      const d = -Math.sin(a) > 0 ? 1 : -1;
      ctx.save(); ctx.translate(dx, dy); ctx.scale(d, 1);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
      circle(ctx, 8, -7, 5, '#2f9e44');
      ctx.fillStyle = '#ff922b'; ctx.beginPath(); ctx.moveTo(12, -7); ctx.lineTo(17, -6); ctx.lineTo(12, -4); ctx.fill();
      ctx.restore();
    }
    // sen
    [[x - rx * 0.6, y + ry * 0.3], [x + rx * 0.5, y - ry * 0.4], [x + rx * 0.7, y + ry * 0.2]].forEach(([lx, ly]) => {
      ctx.fillStyle = '#40c057';
      ctx.beginPath(); ctx.ellipse(lx, ly, 14, 7, 0, 0.3, Math.PI * 2 - 0.3); ctx.lineTo(lx, ly); ctx.fill();
      circle(ctx, lx + 4, ly - 3, 4, '#f783ac');
    });
  }

  function dock(ctx, x, y) {
    ctx.fillStyle = '#8b5a2b';
    [-34, 26].forEach((dx) => ctx.fillRect(x + dx, y - 90, 8, 96));
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#b0703a' : '#c08550';
      ctx.fillRect(x - 40, y - 96 + i * 14, 80, 13);
    }
    ctx.fillStyle = '#fff';
    rr(ctx, x - 40, y + 4, 80, 22, 6); ctx.fill();
    ctx.fillStyle = '#1c7ed6'; ctx.font = '800 12px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🎣 CÂU CÁ', x, y + 15);
  }

  function building(ctx, x, y, o) {
    shadow(ctx, x, y, o.w / 2 + 10, 14);
    ctx.fillStyle = o.wall;
    rr(ctx, x - o.w / 2, y - 150, o.w, 150, 8); ctx.fill();
    ctx.fillStyle = o.roof;
    rr(ctx, x - o.w / 2 - 10, y - 172, o.w + 20, 30, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 17px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.sign, x, y - 157);
    const n = 9, w = (o.w + 20) / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : o.awning;
      ctx.beginPath();
      ctx.moveTo(x - o.w / 2 - 10 + i * w, y - 142); ctx.lineTo(x - o.w / 2 - 10 + (i + 1) * w, y - 142);
      ctx.lineTo(x - o.w / 2 - 10 + (i + 1) * w, y - 124); ctx.quadraticCurveTo(x - o.w / 2 - 10 + (i + 0.5) * w, y - 114, x - o.w / 2 - 10 + i * w, y - 124);
      ctx.fill();
    }
    ctx.fillStyle = '#a5d8ff';
    rr(ctx, x - o.w / 2 + 16, y - 100, 70, 74, 6); ctx.fill();
    rr(ctx, x + o.w / 2 - 86, y - 100, 70, 74, 6); ctx.fill();
    ctx.font = '26px system-ui, "Segoe UI Emoji"';
    ctx.fillText(o.icons[0], x - o.w / 2 + 51, y - 63); ctx.fillText(o.icons[1], x + o.w / 2 - 51, y - 63);
    ctx.fillStyle = o.door;
    rr(ctx, x - 22, y - 80, 44, 80, 6); ctx.fill();
    circle(ctx, x + 12, y - 40, 3, '#ffd43b');
  }

  function ferrisWheel(ctx, x, y, t) {
    shadow(ctx, x, y, 110, 16);
    const cx = x, cy = y - 200, R = 150;
    ctx.strokeStyle = '#495057'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 90, y); ctx.lineTo(cx, cy); ctx.lineTo(x + 90, y); ctx.stroke();
    ctx.strokeStyle = '#e64980'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#faa2c1'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, R - 14, 0, Math.PI * 2); ctx.stroke();
    const n = 10, rot = t * 0.25;
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2;
    for (let i = 0; i < n; i++) {
      const a = rot + i * Math.PI * 2 / n;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
    }
    const colors = ['#ff6b6b', '#ffd43b', '#51cf66', '#4dabf7', '#cc5de8'];
    for (let i = 0; i < n; i++) {
      const a = rot + i * Math.PI * 2 / n;
      const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
      ctx.strokeStyle = '#495057'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + 10); ctx.stroke();
      ctx.fillStyle = colors[i % colors.length];
      rr(ctx, px - 15, py + 8, 30, 24, 7); ctx.fill();
      ctx.fillStyle = '#e7f5ff'; ctx.fillRect(px - 10, py + 12, 20, 9);
    }
    circle(ctx, cx, cy, 14, '#fcc419');
  }

  function stage(ctx, x, y, t) {
    shadow(ctx, x, y, 170, 14);
    ctx.fillStyle = '#343a40';
    rr(ctx, x - 160, y - 190, 320, 150, 10); ctx.fill();
    const g = ctx.createLinearGradient(x - 150, 0, x + 150, 0);
    g.addColorStop(0, '#7048e8'); g.addColorStop(0.5, '#e64980'); g.addColorStop(1, '#fd7e14');
    ctx.fillStyle = g;
    rr(ctx, x - 150, y - 182, 300, 132, 8); ctx.fill();
    for (let i = 0; i < 4; i++) {
      const a = Math.sin(t * 2 + i) * 0.4;
      ctx.save(); ctx.translate(x - 120 + i * 80, y - 182); ctx.rotate(a);
      const lg = ctx.createLinearGradient(0, 0, 0, 130);
      lg.addColorStop(0, 'rgba(255,255,200,.55)'); lg.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = lg;
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.lineTo(30, 130); ctx.lineTo(-30, 130); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#fff'; ctx.font = '800 22px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🎤 SÂN KHẤU', x, y - 150);
    ctx.fillStyle = '#8b5a2b';
    rr(ctx, x - 170, y - 46, 340, 46, 8); ctx.fill();
    ctx.fillStyle = '#b0703a'; ctx.fillRect(x - 170, y - 46, 340, 10);
    [-150, 150].forEach((dx) => {
      ctx.fillStyle = '#212529'; rr(ctx, x + dx - 16, y - 100, 32, 56, 5); ctx.fill();
      const pulse = 1 + Math.abs(Math.sin(t * 8)) * 0.15;
      circle(ctx, x + dx, y - 82, 9 * pulse, '#495057');
      circle(ctx, x + dx, y - 58, 6 * pulse, '#495057');
    });
    ctx.font = '18px system-ui, "Segoe UI Emoji"';
    ['🎵', '🎶', '✨'].forEach((n, i) => {
      const p = (t * 0.6 + i / 3) % 1;
      ctx.globalAlpha = 1 - p;
      ctx.fillText(n, x - 60 + i * 60 + Math.sin(p * 6) * 10, y - 200 - p * 50);
    });
    ctx.globalAlpha = 1;
  }

  function gameTable(ctx, x, y, kind, t) {
    shadow(ctx, x, y + 4, 92, 18);
    ctx.fillStyle = '#6f4420';
    ctx.fillRect(x - 60, y - 30, 8, 30); ctx.fillRect(x + 52, y - 30, 8, 30);
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath(); ctx.ellipse(x, y - 30, 92, 34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = kind === 'baucua' ? '#c92a2a' : '#2b8a3e';
    ctx.beginPath(); ctx.ellipse(x, y - 34, 84, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.font = '17px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (kind === 'baucua') {
      DATA.BAUCUA.forEach((s, i) => {
        const cx = x - 50 + (i % 3) * 50, cy = y - 44 + Math.floor(i / 3) * 20;
        ctx.fillStyle = '#fff3bf'; rr(ctx, cx - 14, cy - 9, 28, 18, 4); ctx.fill();
        ctx.fillText(s.icon, cx, cy + 1);
      });
    } else {
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.translate(x - 26 + i * 26, y - 36); ctx.rotate((i - 1) * 0.15);
        ctx.fillStyle = '#fff'; rr(ctx, -10, -14, 20, 28, 3); ctx.fill();
        ctx.fillStyle = i === 1 ? '#e03131' : '#212529'; ctx.font = '800 12px system-ui';
        ctx.fillText(['A', '♥', 'K'][i], 0, 0);
        ctx.restore();
      }
    }
    // ghế
    (kind === 'baucua' ? [[-110, -10], [110, -10], [0, 26]] : [[0, 34], [118, -6], [0, -58], [-118, -6]]).forEach(([dx, dy]) => {
      ctx.fillStyle = '#e8590c'; ctx.beginPath(); ctx.ellipse(x + dx, y + dy - 14, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6f4420'; ctx.fillRect(x + dx - 2, y + dy - 12, 4, 12);
    });
    // biển hiệu
    ctx.fillStyle = '#fff';
    rr(ctx, x - 62, y - 112, 124, 30, 10); ctx.fill();
    ctx.fillStyle = kind === 'baucua' ? '#c92a2a' : '#2b8a3e'; ctx.font = '800 14px "Be Vietnam Pro", system-ui';
    ctx.fillText(kind === 'baucua' ? '🎲 BẦU CUA' : '🃏 TIẾN LÊN', x, y - 97);
    ctx.fillStyle = '#868e96'; ctx.fillRect(x - 2, y - 82, 4, 14);
  }

  function iceCart(ctx, x, y) {
    shadow(ctx, x, y, 50, 9);
    ctx.fillStyle = '#fff';
    rr(ctx, x - 44, y - 56, 88, 44, 8); ctx.fill();
    ctx.fillStyle = '#74c0fc'; ctx.fillRect(x - 44, y - 30, 88, 8);
    circle(ctx, x - 26, y - 6, 9, '#495057'); circle(ctx, x + 26, y - 6, 9, '#495057');
    ctx.fillStyle = '#868e96'; ctx.fillRect(x - 2, y - 120, 4, 64);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : '#f783ac';
      ctx.beginPath(); ctx.moveTo(x, y - 136); ctx.lineTo(x - 48 + i * 16, y - 108); ctx.lineTo(x - 48 + (i + 1) * 16, y - 108); ctx.closePath(); ctx.fill();
    }
    ctx.font = '22px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🍦', x - 18, y - 42); ctx.fillText('🍧', x + 18, y - 42);
  }

  function signBoard(ctx, x, y, text) {
    shadow(ctx, x, y, 34, 6);
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - 30, y - 60, 6, 60); ctx.fillRect(x + 24, y - 60, 6, 60);
    ctx.fillStyle = '#f1dcb4';
    rr(ctx, x - 44, y - 104, 88, 54, 6); ctx.fill();
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#5c3d1e'; ctx.font = '800 12px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    text.split('\n').forEach((l, i, a) => ctx.fillText(l, x, y - 77 + (i - (a.length - 1) / 2) * 15));
  }

  function swing(ctx, x, y, t) {
    shadow(ctx, x, y, 60, 9);
    ctx.strokeStyle = '#e03131'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 60, y); ctx.lineTo(x - 45, y - 110); ctx.lineTo(x + 45, y - 110); ctx.lineTo(x + 60, y); ctx.stroke();
    [-20, 20].forEach((dx, i) => {
      const a = Math.sin(t * 2 + i * 1.5) * 0.35;
      const sx = x + dx + Math.sin(a) * 70, sy = y - 110 + Math.cos(a) * 70;
      ctx.strokeStyle = '#868e96'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + dx - 8, y - 110); ctx.lineTo(sx - 8, sy); ctx.moveTo(x + dx + 8, y - 110); ctx.lineTo(sx + 8, sy); ctx.stroke();
      ctx.fillStyle = '#ffd43b'; rr(ctx, sx - 11, sy - 2, 22, 6, 2); ctx.fill();
    });
  }

  /** Khung xích đu (vẽ tĩnh). Ghế vẽ riêng bằng swingSeat để đồng bộ với người ngồi */
  function swingFrame(ctx, x, y) {
    shadow(ctx, x, y, 92, 12);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#7a4520'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(x - 92, y); ctx.lineTo(x - 72, y - 150); ctx.moveTo(x - 52, y); ctx.lineTo(x - 72, y - 150);
    ctx.moveTo(x + 92, y); ctx.lineTo(x + 72, y - 150); ctx.moveTo(x + 52, y); ctx.lineTo(x + 72, y - 150); ctx.stroke();
    ctx.strokeStyle = '#a0602e'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(x - 82, y - 150); ctx.lineTo(x + 82, y - 150); ctx.stroke();
    ctx.strokeStyle = '#c98a4b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 80, y - 153); ctx.lineTo(x + 80, y - 153); ctx.stroke();
    // dây leo hoa trên thanh ngang
    for (let i = 0; i < 9; i++) {
      circle(ctx, x - 72 + i * 18, y - 148 + (i % 2) * 4, 5, '#2f8f2f');
      circle(ctx, x - 72 + i * 18 + 3, y - 150, 3, ['#ff6b9a', '#ffd43b', '#fff'][i % 3]);
    }
  }
  /** Một ghế xích đu: (px,py) = điểm treo trên thanh ngang, a = góc lắc */
  function swingSeat(ctx, px, py, a, len = 96) {
    const sx = px + Math.sin(a) * len, sy = py + Math.cos(a) * len;
    ctx.strokeStyle = '#5c3214'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(px - 13, py); ctx.lineTo(sx - 13, sy); ctx.moveTo(px + 13, py); ctx.lineTo(sx + 13, sy); ctx.stroke();
    ctx.fillStyle = '#e8590c'; rr(ctx, sx - 18, sy - 3, 36, 8, 3); ctx.fill();
    ctx.fillStyle = '#ffa94d'; ctx.fillRect(sx - 16, sy - 3, 32, 2);
    return [sx, sy];
  }
  /** Vọng lâu (chòi nghỉ) */
  function gazebo(ctx, x, y) {
    shadow(ctx, x, y, 110, 16);
    ctx.fillStyle = '#d8c49a'; ctx.beginPath(); ctx.ellipse(x, y - 6, 104, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9b48a'; ctx.beginPath(); ctx.ellipse(x, y - 10, 98, 22, 0, 0, Math.PI * 2); ctx.fill();
    [-82, -30, 30, 82].forEach((dx) => { ctx.fillStyle = '#fff4e0'; ctx.fillRect(x + dx - 6, y - 130, 12, 120); });
    ctx.fillStyle = '#c92a2a';
    ctx.beginPath(); ctx.moveTo(x - 118, y - 124); ctx.lineTo(x, y - 196); ctx.lineTo(x + 118, y - 124); ctx.quadraticCurveTo(x, y - 136, x - 118, y - 124); ctx.fill();
    ctx.fillStyle = '#a61e1e'; ctx.beginPath(); ctx.moveTo(x - 118, y - 124); ctx.quadraticCurveTo(x, y - 136, x + 118, y - 124); ctx.lineTo(x + 112, y - 116); ctx.quadraticCurveTo(x, y - 126, x - 112, y - 116); ctx.fill();
    circle(ctx, x, y - 200, 6, '#ffd43b');
    ctx.fillStyle = '#a0602e'; rr(ctx, x - 50, y - 46, 100, 10, 3); ctx.fill();
    ctx.fillRect(x - 44, y - 38, 6, 26); ctx.fillRect(x + 38, y - 38, 6, 26);
  }

  /* ---------- Halloween ---------- */
  function jackLantern(ctx, x, y, t, magic) {
    shadow(ctx, x, y, 18, 5);
    ctx.fillStyle = '#d9480f';
    ctx.beginPath(); ctx.ellipse(x, y - 15, 20, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fd7e14';
    [-10, 0, 10].forEach((dx) => { ctx.beginPath(); ctx.ellipse(x + dx, y - 15, 8, 14.5, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#5c940d'; ctx.fillRect(x - 2, y - 36, 5, 8);
    const glow = 0.75 + 0.25 * Math.sin(t * 5 + x);
    ctx.fillStyle = `rgba(255,224,102,${glow})`;
    ctx.beginPath(); ctx.moveTo(x - 11, y - 19); ctx.lineTo(x - 4, y - 19); ctx.lineTo(x - 7.5, y - 25); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 4, y - 19); ctx.lineTo(x + 11, y - 19); ctx.lineTo(x + 7.5, y - 25); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 11, y - 12); ctx.lineTo(x + 11, y - 12); ctx.lineTo(x + 7, y - 6); ctx.lineTo(x + 3, y - 9); ctx.lineTo(x, y - 5); ctx.lineTo(x - 3, y - 9); ctx.lineTo(x - 7, y - 6); ctx.closePath(); ctx.fill();
    if (magic) {
      for (let k = 0; k < 4; k++) {
        const a = t * 2 + k * 1.57, r = 24 + Math.sin(t * 3 + k) * 4;
        ART.star(ctx, x + Math.cos(a) * r, y - 16 + Math.sin(a) * r * 0.6, 4, 1.6, `rgba(255,240,150,${0.6 + 0.4 * Math.sin(t * 6 + k)})`);
      }
    }
  }

  function gravestone(ctx, x, y, k) {
    shadow(ctx, x, y, 22, 5);
    ctx.fillStyle = '#868e96';
    ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x - 16, y - 30); ctx.arc(x, y - 30, 16, Math.PI, 0); ctx.lineTo(x + 16, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#adb5bd'; ctx.beginPath(); ctx.moveTo(x - 12, y - 2); ctx.lineTo(x - 12, y - 30); ctx.arc(x, y - 30, 12, Math.PI, 0); ctx.lineTo(x + 12, y - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#495057'; ctx.font = '900 10px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(['R.I.P', 'BOO', '👻'][k % 3], x, y - 26);
    ctx.fillStyle = '#5c940d'; [-14, -6, 8, 14].forEach((dx) => { ctx.beginPath(); ctx.moveTo(x + dx - 3, y); ctx.lineTo(x + dx, y - 7); ctx.lineTo(x + dx + 3, y); ctx.fill(); });
  }

  /** Dơi bay ngang trời và ma lơ lửng (vẽ theo vùng đang nhìn) */
  function hwSky(ctx, cx, cy, vw, vh, t, hz) {
    for (let i = 0; i < 7; i++) {
      const span = vw + 400;
      const bx = cx - vw / 2 - 200 + ((i * 377 + t * (60 + i * 9)) % span);
      const by = Math.min(cy - vh / 2 + 70 + (i * 53) % 200, hz > 0 ? hz - 30 : cy) + Math.sin(t * 3 + i) * 14;
      const wf = Math.sin(t * 14 + i) * 0.7, s = 0.7 + (i % 3) * 0.2;
      ctx.save(); ctx.translate(bx, by); ctx.scale(s, s);
      ctx.fillStyle = '#2b2140';
      [-1, 1].forEach((sd) => { ctx.save(); ctx.scale(sd, 1); ctx.rotate(wf * 0.5); ctx.beginPath(); ctx.moveTo(3, -2); ctx.quadraticCurveTo(14, -14, 22, -4); ctx.quadraticCurveTo(16, -4, 14, 2); ctx.quadraticCurveTo(10, -1, 6, 3); ctx.closePath(); ctx.fill(); ctx.restore(); });
      circle(ctx, 0, 0, 5, '#2b2140');
      ctx.restore();
    }
    for (let i = 0; i < 3; i++) {
      const gx = cx - vw / 2 + ((i * 523 + t * 25) % (vw + 200)) - 100, gy = cy - vh / 4 + i * 90 + Math.sin(t * 1.3 + i * 2) * 20;
      ctx.globalAlpha = 0.45 + 0.2 * Math.sin(t * 2 + i);
      ctx.fillStyle = '#f8f9fa';
      ctx.beginPath(); ctx.arc(gx, gy, 16, Math.PI, 0); ctx.lineTo(gx + 16, gy + 18);
      for (let k = 16; k > -16; k -= 8) ctx.quadraticCurveTo(gx + k - 4, gy + 24, gx + k - 8, gy + 18);
      ctx.closePath(); ctx.fill();
      circle(ctx, gx - 5, gy - 2, 2.6, '#212529'); circle(ctx, gx + 5, gy - 2, 2.6, '#212529');
      ctx.globalAlpha = 1;
    }
  }

  /** Dây đèn cam tím chăng dọc hàng rào */
  function hwBunting(ctx, x1, x2, y, t) {
    ctx.strokeStyle = '#2b2140'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = x1; x <= x2; x += 60) { ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 30, y + 16, x + 60, y); }
    ctx.stroke();
    for (let x = x1 + 10; x < x2; x += 20) {
      const sag = 16 * 0.5 * (1 - Math.pow(((x - x1) % 60) / 30 - 1, 2));
      const on = (Math.floor(t * 3) + Math.floor(x / 20)) % 2 === 0;
      circle(ctx, x, y + 2 + sag, 4, (Math.floor(x / 20) % 2 ? '#ff922b' : '#9775fa') + (on ? '' : '88'));
    }
  }

  function cauldronStall(ctx, x, y, t) {
    shadow(ctx, x, y, 90, 12);
    ctx.fillStyle = '#4b2e83'; ctx.fillRect(x - 84, y - 130, 10, 130); ctx.fillRect(x + 74, y - 130, 10, 130);
    for (let k = 0; k < 8; k++) { ctx.fillStyle = k % 2 ? '#ff922b' : '#2b2140'; ctx.beginPath(); ctx.moveTo(x - 92 + k * 23, y - 150); ctx.lineTo(x - 92 + (k + 1) * 23, y - 150); ctx.lineTo(x - 92 + (k + 1) * 23, y - 124); ctx.quadraticCurveTo(x - 92 + (k + 0.5) * 23, y - 114, x - 92 + k * 23, y - 124); ctx.fill(); }
    ctx.fillStyle = '#2b2140'; rr(ctx, x - 70, y - 176, 140, 28, 8); ctx.fill();
    ctx.fillStyle = '#ffa94d'; ctx.font = '900 14px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🎃 TIỆM HALLOWEEN', x, y - 162);
    ctx.fillStyle = '#212529'; ctx.beginPath(); ctx.ellipse(x, y - 30, 40, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#343a40'; ctx.beginPath(); ctx.ellipse(x, y - 56, 42, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#69db7c'; ctx.beginPath(); ctx.ellipse(x, y - 57, 36, 6, 0, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 5; k++) {
      const p = (t * 0.7 + k / 5) % 1;
      ctx.globalAlpha = 1 - p;
      circle(ctx, x - 20 + k * 10 + Math.sin(p * 8 + k) * 4, y - 60 - p * 50, 4 + p * 3, '#8ce99a');
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#495057'; ctx.fillRect(x - 30, y - 6, 8, 8); ctx.fillRect(x + 22, y - 6, 8, 8);
    jackLantern(ctx, x - 60, y, t, false); jackLantern(ctx, x + 60, y, t, false);
  }

  /* ---------- Máy chơi game (arcade) ---------- */
  function arcadeCabinet(ctx, x, y, color, name, icon, t) {
    shadow(ctx, x, y, 44, 9);
    ctx.fillStyle = '#343a40'; rr(ctx, x - 38, y - 150, 76, 150, 8); ctx.fill();
    ctx.fillStyle = color; rr(ctx, x - 34, y - 146, 68, 142, 6); ctx.fill();
    ctx.fillStyle = '#212529'; rr(ctx, x - 30, y - 132, 60, 28, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 10px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name.toUpperCase(), x, y - 118);
    ctx.fillStyle = '#0b1a2e'; rr(ctx, x - 28, y - 100, 56, 44, 4); ctx.fill();
    const g = ctx.createLinearGradient(0, y - 98, 0, y - 58);
    g.addColorStop(0, '#4dabf7'); g.addColorStop(1, '#9775fa');
    ctx.fillStyle = g; ctx.globalAlpha = 0.75 + 0.25 * Math.sin((t || 0) * 3 + x); rr(ctx, x - 25, y - 97, 50, 38, 3); ctx.fill(); ctx.globalAlpha = 1;
    ctx.font = '20px system-ui, "Segoe UI Emoji"'; ctx.fillStyle = '#000'; ctx.fillText(icon, x, y - 78);
    ctx.fillStyle = '#495057'; rr(ctx, x - 32, y - 52, 64, 18, 3); ctx.fill();
    circle(ctx, x - 14, y - 43, 5, '#e03131'); circle(ctx, x + 2, y - 43, 4, '#fcc419'); circle(ctx, x + 14, y - 43, 4, '#51cf66');
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 10, y - 26, 20, 6);
  }

  /* ---------- Khu đua xe ---------- */
  function grandstand(ctx, x, y) {
    shadow(ctx, x, y, 230, 16);
    for (let r = 0; r < 4; r++) {
      ctx.fillStyle = r % 2 ? '#adb5bd' : '#ced4da';
      ctx.fillRect(x - 220 + r * 10, y - 30 - r * 26, 440 - r * 20, 28);
      for (let k = 0; k < 16 - r; k++) {
        const px = x - 200 + r * 10 + k * 26;
        circle(ctx, px, y - 44 - r * 26, 7, ['#ffe0c4', '#e3a979', '#f8c9a2'][(k + r) % 3]);
        ctx.fillStyle = ['#e03131', '#1971c2', '#f59f00', '#2f9e44', '#e64980'][(k * 3 + r) % 5]; ctx.fillRect(px - 7, y - 37 - r * 26, 14, 9);
      }
    }
    ctx.fillStyle = '#e03131'; ctx.fillRect(x - 230, y - 160, 460, 22);
    for (let k = 0; k < 12; k++) { ctx.fillStyle = k % 2 ? '#fff' : '#e03131'; ctx.beginPath(); ctx.moveTo(x - 230 + k * 38.3, y - 138); ctx.lineTo(x - 230 + (k + 1) * 38.3, y - 138); ctx.lineTo(x - 230 + (k + 0.5) * 38.3, y - 124); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.font = '900 16px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏁 TRƯỜNG ĐUA AVATAR 🏁', x, y - 149);
  }

  function raceCar(ctx, x, y, color) {
    shadow(ctx, x, y + 2, 52, 10);
    ctx.fillStyle = '#212529'; [[-36, -4], [24, -4]].forEach(([dx, dy]) => { circle(ctx, x + dx, y + dy, 11, '#212529'); circle(ctx, x + dx, y + dy, 5, '#adb5bd'); });
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x - 56, y - 8); ctx.lineTo(x - 50, y - 24); ctx.lineTo(x - 14, y - 26); ctx.lineTo(x - 2, y - 40); ctx.lineTo(x + 24, y - 40); ctx.lineTo(x + 38, y - 24); ctx.lineTo(x + 56, y - 20); ctx.lineTo(x + 56, y - 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a5d8ff'; ctx.beginPath(); ctx.moveTo(x, y - 37); ctx.lineTo(x + 22, y - 37); ctx.lineTo(x + 32, y - 25); ctx.lineTo(x - 8, y - 25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; circle(ctx, x - 26, y - 17, 7, '#fff');
    ctx.fillStyle = '#212529'; ctx.font = '900 9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1', x - 26, y - 17);
    ctx.fillStyle = '#fff3bf'; ctx.fillRect(x + 50, y - 20, 6, 5);
  }

  function startGate(ctx, x, y) {
    shadow(ctx, x, y, 140, 12);
    ctx.fillStyle = '#495057'; ctx.fillRect(x - 130, y - 140, 14, 140); ctx.fillRect(x + 116, y - 140, 14, 140);
    ctx.fillStyle = '#212529'; ctx.fillRect(x - 136, y - 172, 272, 40);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 17; k++) { ctx.fillStyle = (k + r) % 2 ? '#fff' : '#111'; ctx.fillRect(x - 136 + k * 16, y - 132 + r * 8, 16, 8); }
    ctx.fillStyle = '#ffe066'; ctx.font = '900 20px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🚦 XUẤT PHÁT', x, y - 152);
    [-1, 0, 1].forEach((k) => circle(ctx, x + k * 30, y - 100, 9, ['#ff3b30', '#ffd43b', '#51cf66'][k + 1]));
    ctx.fillStyle = '#212529'; ctx.fillRect(x - 46, y - 112, 92, 4);
  }

  /* ---------- Phong cách Avatar: bầu trời, đồng xa, hàng rào, tulip, bảng tên ---------- */
  function cloud(ctx, x, y, s) {
    ctx.fillStyle = '#dbefff';
    [[0, 6, 22], [24, 2, 26], [50, 8, 20], [14, -10, 20], [36, -12, 22]].forEach(([dx, dy, r]) => circle(ctx, x + dx * s, y + dy * s + 4, r * s, '#cfe8fb'));
    [[0, 6, 22], [24, 2, 26], [50, 8, 20], [14, -10, 20], [36, -12, 22]].forEach(([dx, dy, r]) => circle(ctx, x + dx * s, y + dy * s, r * s, '#fff'));
  }

  function backdrop(ctx, w, hz, camX, t, sea) {
    const g = ctx.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, '#4fb0f0'); g.addColorStop(1, '#c6ebff');
    ctx.fillStyle = g; ctx.fillRect(-800, -200, w + 1600, hz + 200);
    for (let i = 0; i < 8; i++) {
      const span = w + 900;
      const cx = ((i * 397 + t * (6 + i)) % span) - 450;
      cloud(ctx, cx, 30 + (i * 61) % 120, 0.8 + (i % 3) * 0.25);
    }
    if (sea) return;
    const par = (f, fn) => { ctx.save(); ctx.translate((camX - w / 2) * f, 0); fn(); ctx.restore(); };
    par(0.6, () => {
      ctx.fillStyle = '#a5dc8c';
      for (let x = -900; x < w + 900; x += 240) { ctx.beginPath(); ctx.ellipse(x, hz - 30, 190, 80, 0, Math.PI, 0); ctx.fill(); }
    });
    par(0.45, () => {
      for (let x = -900; x < w + 900; x += 44) {
        const yy = hz - 52 + ((x / 44) % 3) * 4, r = 22 + ((x / 44) % 4) * 3;
        circle(ctx, x, yy + 4, r, '#3c9a3c');
        circle(ctx, x, yy, r, '#57b84a');
        circle(ctx, x - 6, yy - 7, r * 0.45, '#7fd36a');
      }
    });
    par(0.25, () => {
      const cols = ['#c9e47f', '#9fd468', '#e3d27a', '#b4dc6e'];
      for (let x = -900, i = 0; x < w + 900; x += 200, i++) {
        ctx.fillStyle = cols[i % 4];
        ctx.fillRect(x, hz - 34, 198, 34);
        ctx.strokeStyle = 'rgba(80,120,40,.35)'; ctx.lineWidth = 2;
        for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x, hz - 34 + k * 8.5); ctx.lineTo(x + 198, hz - 34 + k * 8.5); ctx.stroke(); }
      }
    });
  }

  function woodFence(ctx, x1, x2, y) {
    ctx.fillStyle = '#c98a4b';
    ctx.fillRect(x1, y - 30, x2 - x1, 6);
    ctx.fillRect(x1, y - 16, x2 - x1, 6);
    for (let x = x1 + 6; x < x2; x += 34) {
      ctx.fillStyle = '#b97a3e';
      ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 6, y - 36); ctx.lineTo(x, y - 42); ctx.lineTo(x + 6, y - 36); ctx.lineTo(x + 6, y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#dba468'; ctx.fillRect(x - 4, y - 36, 3, 34);
    }
  }

  function tulips(ctx, x1, x2, y) {
    const r = srand(x1 * 3 + y);
    for (let x = x1; x < x2; x += 16) {
      ctx.fillStyle = '#2f8f2f';
      ctx.beginPath(); ctx.ellipse(x, y - 6, 9, 8, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#46b23e';
      ctx.beginPath(); ctx.ellipse(x - 4, y - 8, 4, 10, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 5, y - 8, 4, 10, 0.4, 0, Math.PI * 2); ctx.fill();
    }
    const cols = ['#e8202a', '#ffd21f', '#ff4f7a', '#ff8c1a', '#e8202a'];
    for (let x = x1 + 4; x < x2; x += 12) {
      const fx = x + r() * 6, fy = y - 18 - r() * 10;
      ctx.strokeStyle = '#2f8f2f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(fx, fy + 4); ctx.lineTo(fx, y - 6); ctx.stroke();
      ctx.fillStyle = cols[Math.floor(r() * cols.length)];
      ctx.beginPath();
      ctx.moveTo(fx - 5, fy - 4); ctx.lineTo(fx - 2.5, fy - 1); ctx.lineTo(fx, fy - 5); ctx.lineTo(fx + 2.5, fy - 1); ctx.lineTo(fx + 5, fy - 4);
      ctx.quadraticCurveTo(fx + 5, fy + 5, fx, fy + 5); ctx.quadraticCurveTo(fx - 5, fy + 5, fx - 5, fy - 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(fx - 3, fy - 2, 1.5, 4);
    }
  }

  function namePlate(ctx, text, x, y, kind) {
    ctx.font = '900 13px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.6; ctx.strokeStyle = '#3a1d08';
    ctx.strokeText(text, x, y + 10);
    ctx.fillStyle = kind === 'me' ? '#ffe066' : kind === 'npc' ? '#fff4d6' : '#ffa62b';
    ctx.fillText(text, x, y + 10);
    if (kind === 'me') {
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath(); ctx.moveTo(x - 5, y + 20); ctx.lineTo(x + 5, y + 20); ctx.lineTo(x, y + 26); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#3a1d08'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  /* ---------- Nông trại kiểu Avatar ---------- */
  /** Chuồng gà mái tôn có rơm bên trong */
  function shed(ctx, x, y) {
    shadow(ctx, x, y + 2, 105, 14, 0.18);
    ctx.fillStyle = '#7a4a26';
    ctx.fillRect(x - 92, y - 112, 184, 112);
    ctx.fillStyle = '#4e2f17';
    ctx.fillRect(x - 80, y - 98, 160, 92);
    ctx.fillStyle = '#e8a93a';
    ctx.beginPath(); ctx.moveTo(x - 72, y - 6); ctx.quadraticCurveTo(x - 60, y - 70, x - 8, y - 72); ctx.quadraticCurveTo(x + 42, y - 66, x + 46, y - 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c47f17'; ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x - 66 + i * 4, y - 6 - i * 13); ctx.quadraticCurveTo(x - 12, y - 14 - i * 13, x + 42 - i * 4, y - 6 - i * 13); ctx.stroke(); }
    ctx.fillStyle = '#f2c14e';
    rr(ctx, x + 44, y - 30, 30, 24, 4); ctx.fill();
    ctx.fillStyle = '#a8703f';
    ctx.fillRect(x - 96, y - 116, 12, 116); ctx.fillRect(x + 84, y - 116, 12, 116);
    ctx.fillStyle = '#c9d2d8';
    ctx.beginPath(); ctx.moveTo(x - 116, y - 104); ctx.lineTo(x + 116, y - 104); ctx.lineTo(x + 104, y - 156); ctx.lineTo(x - 104, y - 156); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8f9aa3'; ctx.lineWidth = 2;
    for (let i = 0; i <= 22; i++) {
      const bx = x - 116 + i * 10.5, tx = x - 104 + i * 9.45;
      ctx.beginPath(); ctx.moveTo(bx, y - 104); ctx.lineTo(tx, y - 156); ctx.stroke();
    }
    ctx.fillStyle = '#e9eef1'; ctx.fillRect(x - 118, y - 108, 236, 7);
    ctx.fillStyle = '#9aa5ad'; ctx.fillRect(x - 106, y - 158, 212, 5);
  }

  /** Nhà bếp có biển tên và mũ đầu bếp */
  function kitchen(ctx, x, y) {
    shadow(ctx, x, y + 2, 125, 14, 0.18);
    ctx.fillStyle = '#f3dfb8';
    ctx.fillRect(x - 110, y - 112, 220, 112);
    ctx.fillStyle = '#e2c38d'; ctx.fillRect(x - 110, y - 16, 220, 16);
    ctx.fillStyle = '#8a4b22';
    ctx.beginPath(); ctx.moveTo(x - 126, y - 104); ctx.lineTo(x - 100, y - 168); ctx.lineTo(x + 100, y - 168); ctx.lineTo(x + 126, y - 104); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#6b3618'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 126 + i * 7, y - 104 - i * 16); ctx.lineTo(x + 126 - i * 7, y - 104 - i * 16); ctx.stroke(); }
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.moveTo(x - 118 + i * 18, y - 104); ctx.lineTo(x - 96 + i * 15.4, y - 168); ctx.stroke(); }
    ctx.fillStyle = '#9b9b9b'; ctx.fillRect(x + 52, y - 200, 20, 40);
    circle(ctx, x + 62, y - 210, 9, 'rgba(255,255,255,.85)'); circle(ctx, x + 70, y - 224, 7, 'rgba(255,255,255,.85)'); circle(ctx, x + 64, y - 236, 5, 'rgba(255,255,255,.85)');
    ctx.fillStyle = '#3d2410';
    rr(ctx, x - 58, y - 160, 116, 30, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 17px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('NHÀ BẾP', x, y - 145);
    circle(ctx, x + 70, y - 170, 12, '#fff'); circle(ctx, x + 84, y - 174, 13, '#fff'); circle(ctx, x + 96, y - 168, 11, '#fff');
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 72, y - 168, 22, 14);
    ctx.fillStyle = '#5c3d1e'; ctx.fillRect(x - 96, y - 92, 96, 60);
    ctx.fillStyle = '#a5d8ff'; ctx.fillRect(x - 90, y - 86, 84, 48);
    ctx.font = '18px system-ui, "Segoe UI Emoji"'; ctx.fillStyle = '#000';
    ctx.fillText('🍲', x - 70, y - 72); ctx.fillText('🥧', x - 26, y - 72); ctx.fillText('🍰', x - 48, y - 50);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(x - 100, y - 34, 104, 8);
    ctx.fillStyle = '#6b3618'; rr(ctx, x + 22, y - 86, 56, 86, 4); ctx.fill();
    ctx.fillStyle = '#8a4b22'; ctx.fillRect(x + 28, y - 80, 44, 36);
    circle(ctx, x + 70, y - 40, 3, '#ffd43b');
  }

  /** Đồng hồ đếm ngược kiểu Avatar (vd: 1:05) kèm thanh tiến độ */
  function timerLabel(ctx, x, y, secs, p) {
    secs = Math.max(0, Math.ceil(secs));
    const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
    const p2 = (n) => String(n).padStart(2, '0');
    // từ 1 giờ trở lên hiện giờ:phút:giây (vd 1:59:30), dưới 1 giờ hiện phút:giây (vd 4:05)
    const text = h ? `${h}:${p2(m)}:${p2(s)}` : `${m}:${p2(s)}`;
    ctx.fillStyle = '#3d2410';
    const bw = h ? 64 : 50;
    rr(ctx, x - bw / 2, y + 6, bw, 9, 3); ctx.fill();
    ctx.fillStyle = '#ff6b3d';
    rr(ctx, x - bw / 2 + 2, y + 8, (bw - 4) * Math.min(1, p), 5, 2); ctx.fill();
    ctx.font = '900 15px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#3d2410';
    ctx.strokeText(text, x, y - 4);
    ctx.fillStyle = '#ffe14d';
    ctx.fillText(text, x, y - 4);
  }

  /* ---------- Luống ruộng 6×2 ô kiểu Avatar ---------- */
  const BED = { tile: 42, step: 47, padX: 12, padY: 10 };
  BED.w = BED.padX * 2 + BED.step * 5 + BED.tile;
  BED.h = BED.padY * 2 + BED.step + BED.tile;

  /** layer: 'base' = đất + cây (vẽ sẵn vào bộ đệm), 'over' = chỉ hiệu ứng động (sâu, bong bóng, lấp lánh), bỏ trống = cả hai */
  function bed(ctx, bx, by, unlocked, price, tiles, t, layer) {
    if (layer === 'over') { if (unlocked) tiles.forEach((tile, k) => bedOverlay(ctx, bx, by, tile, k, t)); return; }
    ctx.fillStyle = '#2f7a1c';
    rr(ctx, bx - 3, by - 3, BED.w + 6, BED.h + 9, 10); ctx.fill();
    ctx.fillStyle = '#4fb32c';
    rr(ctx, bx, by, BED.w, BED.h, 8); ctx.fill();
    if (!unlocked) {
      // đất trống: cỏ lơ thơ + biển gỗ "MUA ĐẤT"
      ctx.fillStyle = '#c9a66b'; rr(ctx, bx + 4, by + 4, BED.w - 8, BED.h - 10, 6); ctx.fill();
      const fr = srand(bx * 3 + by);
      for (let d = 0; d < 26; d++) {
        const gx = bx + 14 + fr() * (BED.w - 28), gy = by + 12 + fr() * (BED.h - 26);
        ctx.strokeStyle = d % 3 ? '#6fae3a' : '#4f8f26'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(gx, gy + 6); ctx.lineTo(gx - 3, gy); ctx.moveTo(gx, gy + 6); ctx.lineTo(gx + 3, gy - 1); ctx.stroke();
      }
      for (let d = 0; d < 6; d++) circle(ctx, bx + 20 + fr() * (BED.w - 40), by + 16 + fr() * (BED.h - 30), 3, '#a8895a');
      const cx = bx + BED.w / 2, cy = by + BED.h / 2 + 4;
      ctx.fillStyle = '#6b3f22'; ctx.fillRect(cx - 3, cy - 14, 6, 34);
      ctx.fillStyle = '#e8b46a'; rr(ctx, cx - 44, cy - 38, 88, 30, 6); ctx.fill();
      ctx.strokeStyle = '#6b3f22'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(cx - 38, cy - 34, 76, 4);
      ctx.font = '900 14px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#5c3010'; ctx.fillText('🪧 MUA ĐẤT', cx, cy - 22);
      return;
    }
    tiles.forEach((tile, k) => {
      const tx = bx + BED.padX + (k % 6) * BED.step, ty = by + BED.padY + Math.floor(k / 6) * BED.step;
      ctx.fillStyle = '#a07a48';
      rr(ctx, tx, ty + 2, BED.tile, BED.tile, 4); ctx.fill();
      ctx.fillStyle = tile.st.thirsty ? '#cdb27a' : tile.crop && tile.wet ? '#b88f5c' : '#d8bd86';
      rr(ctx, tx, ty, BED.tile, BED.tile, 4); ctx.fill();
      if (tile.crop && tile.fert) {
        const fr = srand(tx * 7 + ty);
        for (let d = 0; d < 9; d++) circle(ctx, tx + 5 + fr() * (BED.tile - 10), ty + 5 + fr() * (BED.tile - 10), 1.6, d % 3 ? '#5c3d1e' : '#2b8a3e');
      }
      ctx.strokeStyle = 'rgba(120,85,40,.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tx + 6, ty + 14); ctx.lineTo(tx + BED.tile - 6, ty + 14); ctx.moveTo(tx + 6, ty + 28); ctx.lineTo(tx + BED.tile - 6, ty + 28); ctx.stroke();
      if (tile.crop) {
        ctx.save();
        ctx.translate(tx + BED.tile / 2, ty + BED.tile - 6);
        ctx.scale(1.55, 1.55);
        ART.plant(ctx, 0, 0, tile.crop, tile.st.stage, t + k * 0.7);
        ctx.restore();
      }
      if (layer !== 'base') bedOverlay(ctx, bx, by, tile, k, t);
    });
  }
  function bedOverlay(ctx, bx, by, tile, k, t) {
    const tx = bx + BED.padX + (k % 6) * BED.step, ty = by + BED.padY + Math.floor(k / 6) * BED.step;
    {
      if (tile.st.pest) {
        // sâu xanh bò trên lá + bóng chỉ 🐛
        const wx = tx + 10 + (Math.sin(t * 1.5 + k) + 1) * 8, wy = ty + BED.tile - 12;
        for (let s2 = 0; s2 < 5; s2++) circle(ctx, wx + s2 * 3.4, wy + Math.sin(t * 6 + s2) * 1.4, 2.6, s2 === 4 ? '#5c940d' : '#82c91e');
        circle(ctx, wx + 14.5, wy - 1, 0.8, '#111');
        const bob = Math.sin(t * 4 + k) * 1.5;
        circle(ctx, tx + BED.tile / 2, ty - 6 + bob, 9, '#fff');
        ctx.font = '12px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
        ctx.fillText('🐛', tx + BED.tile / 2, ty - 5.5 + bob);
      } else if (tile.st.thirsty) {
        const bob = Math.sin(t * 4 + k) * 1.5;
        circle(ctx, tx + BED.tile / 2, ty - 6 + bob, 9, '#fff');
        ctx.font = '12px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
        ctx.fillText('😟', tx + BED.tile / 2, ty - 5.5 + bob);
      } else if (tile.st.stage === 2) {
        const tw = (Math.sin(t * 5 + k * 1.3) + 1) / 2;
        ctx.fillStyle = `rgba(255,255,200,${tw})`;
        circle(ctx, tx + BED.tile - 7, ty + 6, 2.2, ctx.fillStyle);
      }
    }
  }

  /** Hàng hoa hồng đỏ rậm rạp viền nông trại */
  function roseHedge(ctx, x1, x2, y) {
    const r = srand(x1 * 5 + y * 2);
    for (let x = x1; x < x2; x += 18) {
      circle(ctx, x, y - 10, 13, '#1f6b1f');
      circle(ctx, x + 6, y - 14, 10, '#2f8f2f');
    }
    for (let x = x1 + 4; x < x2; x += 13) {
      const fx = x + r() * 6, fy = y - 12 - r() * 14;
      const c = r() > 0.15 ? ['#e8202a', '#c2121c', '#ff3b3b'][Math.floor(r() * 3)] : '#ffd21f';
      circle(ctx, fx, fy, 5.2, c);
      circle(ctx, fx - 1, fy - 1, 2.8, 'rgba(255,255,255,.28)');
      ctx.strokeStyle = 'rgba(90,0,0,.45)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(fx, fy, 2.6, 0.4, 4.2); ctx.stroke();
    }
  }

  function scarecrow(ctx, x, y, t) {
    shadow(ctx, x, y, 18, 5);
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - 3, y - 70, 6, 70); ctx.fillRect(x - 30, y - 56, 60, 5);
    ctx.fillStyle = '#4c6ef5'; rr(ctx, x - 14, y - 60, 28, 30, 4); ctx.fill();
    ctx.fillStyle = '#e8a93a';
    [-34, 34].forEach((dx) => { ctx.beginPath(); ctx.moveTo(x + dx, y - 56); ctx.lineTo(x + dx + (dx > 0 ? 6 : -6), y - 48); ctx.lineTo(x + dx, y - 50); ctx.fill(); });
    circle(ctx, x, y - 72, 11, '#f2d49b');
    ctx.fillStyle = '#c47f17';
    ctx.beginPath(); ctx.ellipse(x, y - 80, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
    rr(ctx, x - 9, y - 94, 18, 14, 4); ctx.fill();
    circle(ctx, x - 4, y - 73, 1.6, '#222'); circle(ctx, x + 4, y - 73, 1.6, '#222');
    ctx.strokeStyle = '#7a3b2e'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y - 69, 3, 0.3, Math.PI - 0.3); ctx.stroke();
  }

  /** Mũi tên vàng nhấp nháy trước cửa, kèm chữ "Vào" */
  function doorArrow(ctx, x, y, t, text = 'Vào') {
    const b = Math.abs(Math.sin(t * 4)) * 6;
    ctx.font = '900 14px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = '#5a3010';
    ctx.strokeText(text, x, y - 30 - b); ctx.fillStyle = '#ffe14d'; ctx.fillText(text, x, y - 30 - b);
    ctx.fillStyle = '#ffd21f'; ctx.strokeStyle = '#7a4a10'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 20 - b); ctx.lineTo(x + 6, y - 20 - b); ctx.lineTo(x + 6, y - 10 - b); ctx.lineTo(x + 12, y - 10 - b);
    ctx.lineTo(x, y + 2 - b); ctx.lineTo(x - 12, y - 10 - b); ctx.lineTo(x - 6, y - 10 - b); ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  /* ---------- Câu cá ngay trên bản đồ ---------- */
  /** Cần câu, dây câu và phao. (x,y) = chân nhân vật, (bx,by) = vị trí phao trên mặt nước */
  function fishingRod(ctx, x, y, bx, by, t, bite) {
    const dir = bx >= x ? 1 : -1;
    const hx = x + dir * 15, hy = y - 36;
    const tx = x + dir * 58, ty = y - 104;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3d2410'; ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.strokeStyle = '#c98a4b'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
    circle(ctx, hx + dir * 4, hy - 6, 3.5, '#868e96');
    const shake = bite ? Math.sin(t * 40) * 2 : 0;
    const bobY = by + (bite ? 4 + Math.abs(Math.sin(t * 18)) * 3 : Math.sin(t * 3) * 1.5);
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo((tx + bx) / 2, Math.max(ty, by) + 10, bx + shake, bobY - 4); ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${bite ? 0.9 : 0.5})`; ctx.lineWidth = 1.5;
    const rp = (t * (bite ? 2.5 : 0.8)) % 1;
    ctx.beginPath(); ctx.ellipse(bx, by + 2, 8 + rp * 16, 3 + rp * 6, 0, 0, Math.PI * 2); ctx.stroke();
    circle(ctx, bx + shake, bobY, 4.5, '#fff');
    ctx.fillStyle = '#e03131';
    ctx.beginPath(); ctx.arc(bx + shake, bobY, 4.5, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = '#3d2410'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx + shake, bobY, 4.5, 0, Math.PI * 2); ctx.stroke();
  }

  /** Dấu "!" đỏ nhấp nháy trên đầu khi cá cắn câu */
  function biteMark(ctx, x, y, t) {
    const s = 1 + Math.abs(Math.sin(t * 10)) * 0.25;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    circle(ctx, 0, 0, 14, '#3d2410');
    circle(ctx, 0, 0, 12, '#ff3b30');
    ctx.fillStyle = '#fff'; ctx.font = '900 18px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, 1);
    ctx.restore();
  }

  /** Lối đá lát quanh hồ câu */
  function stonePath(ctx, x, y, w, h) {
    const r = srand(x + y);
    ctx.fillStyle = '#b9b2a4'; rr(ctx, x, y, w, h, 8); ctx.fill();
    for (let yy = y + 4; yy < y + h - 4; yy += 22) {
      for (let xx = x + 4 + ((yy - y) / 22 % 2) * 12; xx < x + w - 8; xx += 26) {
        ctx.fillStyle = ['#d8d2c4', '#cfc8b8', '#e2dccf'][Math.floor(r() * 3)];
        rr(ctx, xx, yy, 22, 18, 4); ctx.fill();
      }
    }
  }

  /* ---------- Nông trại mở rộng: tường rào, cổng, chuồng đỏ, cối xay gió, luống hoa ---------- */
  function lantern(ctx, x, y) {
    ctx.strokeStyle = '#3d2410'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x, y - 6); ctx.stroke();
    ctx.fillStyle = '#e03131';
    ctx.beginPath(); ctx.ellipse(x, y + 4, 9, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd43b'; ctx.fillRect(x - 6, y - 8, 12, 3); ctx.fillRect(x - 6, y + 13, 12, 3);
    ctx.strokeStyle = 'rgba(120,0,0,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 4, y - 6); ctx.quadraticCurveTo(x - 9, y + 4, x - 4, y + 14); ctx.moveTo(x + 4, y - 6); ctx.quadraticCurveTo(x + 9, y + 4, x + 4, y + 14); ctx.stroke();
    ctx.strokeStyle = '#ffd43b'; ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(x, y + 24); ctx.stroke();
  }

  function pillar(ctx, x, y, h = 70) {
    ctx.fillStyle = '#c9b48a';
    ctx.fillRect(x - 16, y - h, 32, h);
    ctx.fillStyle = '#b39b6e';
    for (let yy = y - h + 10; yy < y; yy += 14) ctx.fillRect(x - 16, yy, 32, 2);
    ctx.fillStyle = '#8f7a52'; ctx.fillRect(x - 20, y - h - 8, 40, 10);
    ctx.fillStyle = '#e8590c';
    ctx.beginPath(); ctx.moveTo(x - 22, y - h - 8); ctx.lineTo(x, y - h - 24); ctx.lineTo(x + 22, y - h - 8); ctx.closePath(); ctx.fill();
    circle(ctx, x, y - h - 26, 4, '#ffd43b');
  }

  /** Tường gạch ngang có trụ và đèn lồng */
  function wallH(ctx, x1, x2, y) {
    const r = srand(x1 + y);
    ctx.fillStyle = '#e6d7b4';
    ctx.fillRect(x1, y - 48, x2 - x1, 48);
    for (let row = 0; row < 4; row++) {
      for (let x = x1 + (row % 2) * 18; x < x2; x += 36) {
        ctx.fillStyle = ['#d8c49a', '#e2d0a8', '#cfb98c'][Math.floor(r() * 3)];
        ctx.fillRect(x + 1, y - 46 + row * 12, Math.min(34, x2 - x - 1), 10);
      }
    }
    ctx.fillStyle = '#9c5b2e'; ctx.fillRect(x1, y - 56, x2 - x1, 10);
    ctx.fillStyle = '#c0703a'; ctx.fillRect(x1, y - 58, x2 - x1, 4);
    for (let x = x1; x <= x2; x += 220) { pillar(ctx, x, y, 72); lantern(ctx, x + (x === x2 ? -26 : 26), y - 66); }
  }

  /** Một đoạn tường dọc (hai bên hông) */
  function wallV(ctx, x, y, step) {
    ctx.fillStyle = '#d8c49a';
    ctx.fillRect(x - 12, y - 48 - step, 24, 48 + step);
    ctx.fillStyle = '#9c5b2e'; ctx.fillRect(x - 14, y - 56 - step, 28, step + 10);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x - 12, y - 10, 24, 10);
  }

  /** Cổng lớn của nông trại */
  function farmGate(ctx, x, y) {
    shadow(ctx, x, y + 4, 140, 14, 0.18);
    // cánh cổng gỗ mở hé
    ctx.fillStyle = '#8a4b22';
    ctx.beginPath(); ctx.moveTo(x - 70, y); ctx.lineTo(x - 70, y - 70); ctx.lineTo(x - 104, y - 60); ctx.lineTo(x - 104, y + 6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 70, y); ctx.lineTo(x + 70, y - 70); ctx.lineTo(x + 104, y - 60); ctx.lineTo(x + 104, y + 6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#5c2f12'; ctx.lineWidth = 2;
    [[-70, -104], [70, 104]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(x + a, y - 35); ctx.lineTo(x + b, y - 28); ctx.stroke(); });
    pillar(ctx, x - 92, y, 130); pillar(ctx, x + 92, y, 130);
    // vòm cổng
    ctx.fillStyle = '#9c5b2e';
    ctx.beginPath(); ctx.moveTo(x - 112, y - 136); ctx.quadraticCurveTo(x, y - 196, x + 112, y - 136); ctx.lineTo(x + 112, y - 120); ctx.quadraticCurveTo(x, y - 176, x - 112, y - 120); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8590c';
    ctx.beginPath(); ctx.moveTo(x - 124, y - 138); ctx.quadraticCurveTo(x, y - 212, x + 124, y - 138); ctx.lineTo(x + 112, y - 136); ctx.quadraticCurveTo(x, y - 196, x - 112, y - 136); ctx.closePath(); ctx.fill();
    // biển tên
    ctx.fillStyle = '#5a3010'; rr(ctx, x - 96, y - 182, 192, 40, 8); ctx.fill();
    ctx.fillStyle = '#ffd99a'; rr(ctx, x - 90, y - 177, 180, 30, 6); ctx.fill();
    ctx.fillStyle = '#5a3010'; ctx.font = '900 18px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🌾 NÔNG TRẠI', x, y - 161);
    lantern(ctx, x - 60, y - 132); lantern(ctx, x + 60, y - 132);
    // hoa hai bên
    [[-140, '#ff6b6b'], [140, '#ffd43b']].forEach(([dx, c]) => {
      circle(ctx, x + dx, y - 14, 18, '#2f8f2f');
      for (let i = 0; i < 7; i++) circle(ctx, x + dx - 12 + (i * 7) % 24, y - 22 + (i * 5) % 14, 4, c);
    });
  }

  /** Chuồng bò sơn đỏ */
  function barn(ctx, x, y) {
    shadow(ctx, x, y + 2, 130, 14, 0.18);
    ctx.fillStyle = '#c92a2a';
    ctx.beginPath(); ctx.moveTo(x - 110, y); ctx.lineTo(x - 110, y - 110); ctx.lineTo(x, y - 170); ctx.lineTo(x + 110, y - 110); ctx.lineTo(x + 110, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a61e1e'; ctx.fillRect(x - 110, y - 14, 220, 14);
    ctx.fillStyle = '#495057';
    ctx.beginPath(); ctx.moveTo(x - 124, y - 104); ctx.lineTo(x, y - 180); ctx.lineTo(x + 124, y - 104); ctx.lineTo(x + 112, y - 100); ctx.lineTo(x, y - 166); ctx.lineTo(x - 112, y - 100); ctx.closePath(); ctx.fill();
    // cửa lớn có chữ X trắng
    ctx.fillStyle = '#8f1a1a'; ctx.fillRect(x - 44, y - 92, 88, 92);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5;
    ctx.strokeRect(x - 44, y - 92, 88, 92);
    ctx.beginPath(); ctx.moveTo(x - 44, y - 92); ctx.lineTo(x, y - 46); ctx.lineTo(x + 44, y - 92); ctx.moveTo(x - 44, y); ctx.lineTo(x, y - 46); ctx.lineTo(x + 44, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y - 92); ctx.lineTo(x, y); ctx.stroke();
    // cửa sổ gác
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 18, y - 140, 36, 30);
    ctx.fillStyle = '#e8a93a'; ctx.fillRect(x - 14, y - 136, 28, 22);
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 1.5, y - 140, 3, 30);
  }

  /** Cối xay gió quay */
  function windmill(ctx, x, y, t) {
    shadow(ctx, x, y + 2, 50, 10);
    ctx.fillStyle = '#f1e3c6';
    ctx.beginPath(); ctx.moveTo(x - 34, y); ctx.lineTo(x - 22, y - 150); ctx.lineTo(x + 22, y - 150); ctx.lineTo(x + 34, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a4b22';
    ctx.beginPath(); ctx.moveTo(x - 30, y - 150); ctx.lineTo(x, y - 182); ctx.lineTo(x + 30, y - 150); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6b3618'; rr(ctx, x - 10, y - 34, 20, 34, 6); ctx.fill();
    ctx.fillStyle = '#74c0fc'; ctx.fillRect(x - 7, y - 110, 14, 16);
    ctx.save(); ctx.translate(x, y - 150); ctx.rotate(t * 0.8);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#8a4b22'; ctx.fillRect(-3, 0, 6, 86);
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillRect(3, 18, 22, 64);
      ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1;
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(3, 26 + k * 15); ctx.lineTo(25, 26 + k * 15); ctx.stroke(); }
    }
    ctx.restore();
    circle(ctx, x, y - 150, 7, '#5c2f12');
  }

  /** Luống hoa nhiều màu */
  function flowerBed(ctx, x, y, w, palette) {
    ctx.fillStyle = '#7a4a26'; rr(ctx, x, y - 26, w, 30, 8); ctx.fill();
    ctx.fillStyle = '#9a6238'; rr(ctx, x + 3, y - 24, w - 6, 24, 6); ctx.fill();
    const r = srand(x * 3 + y);
    for (let fx = x + 10; fx < x + w - 6; fx += 12) {
      const fy = y - 14 - r() * 10;
      ctx.strokeStyle = '#2f8f2f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(fx, y - 4); ctx.lineTo(fx, fy); ctx.stroke();
      const c = palette[Math.floor(r() * palette.length)];
      for (let k = 0; k < 5; k++) { const a = k * 1.2566; circle(ctx, fx + Math.cos(a) * 3.4, fy + Math.sin(a) * 3.4, 3, c); }
      circle(ctx, fx, fy, 2, '#ffe066');
    }
  }

  function trough(ctx, x, y) {
    shadow(ctx, x, y, 40, 6);
    ctx.fillStyle = '#7a4a26'; rr(ctx, x - 40, y - 20, 80, 20, 4); ctx.fill();
    ctx.fillStyle = '#4dabf7'; rr(ctx, x - 34, y - 18, 68, 8, 3); ctx.fill();
  }

  /** Quả trên cây: chín thì to và đủ màu, đang lớn thì nhỏ và xanh */
  function treeFruits(ctx, x, y, color, p, ripe, t) {
    const r = srand(x * 11 + y * 5);
    const n = ripe ? 12 : Math.floor(p * 9);
    const cy = y - 112;
    for (let i = 0; i < n; i++) {
      const fx = x - 48 + r() * 96, fy = cy - 40 + r() * 80;
      const sz = ripe ? 6.5 : 3 + p * 2.5;
      const col = ripe ? color : '#94d82d';
      const bob = ripe ? Math.sin(t * 2 + i) * 0.8 : 0;
      ctx.fillStyle = 'rgba(0,0,0,.18)';
      ctx.beginPath(); ctx.ellipse(fx + 1, fy + 2 + bob, sz, sz * 0.95, 0, 0, Math.PI * 2); ctx.fill();
      circle(ctx, fx, fy + bob, sz, col);
      circle(ctx, fx - sz * 0.35, fy - sz * 0.35 + bob, sz * 0.32, 'rgba(255,255,255,.55)');
      ctx.fillStyle = '#2f8f2f';
      ctx.beginPath(); ctx.ellipse(fx + 2, fy - sz + bob, 2.6, 1.4, -0.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ---------- Nội thất trong nhà ---------- */
  /** Tường trong nhà nằm ngang (mặt tường cao 56px) */
  function innerWallH(ctx, x1, x2, y) {
    ctx.fillStyle = '#f3e6c8'; ctx.fillRect(x1, y - 56, x2 - x1, 50);
    ctx.fillStyle = '#e2cfa4'; for (let x = x1 + 12; x < x2; x += 24) ctx.fillRect(x, y - 56, 2, 50);
    ctx.fillStyle = '#9c5b2e'; ctx.fillRect(x1, y - 8, x2 - x1, 8);
    ctx.fillStyle = '#7a4520'; ctx.fillRect(x1 - 2, y - 64, x2 - x1 + 4, 10);
  }
  function innerWallV(ctx, x, y1, y2) {
    ctx.fillStyle = '#e2cfa4'; ctx.fillRect(x - 9, y1 - 56, 18, y2 - y1 + 50);
    ctx.fillStyle = '#7a4520'; ctx.fillRect(x - 11, y1 - 64, 22, y2 - y1 + 10);
  }

  function sofa(ctx, x, y, color = '#4c6ef5') {
    shadow(ctx, x, y, 110, 12);
    ctx.fillStyle = color; rr(ctx, x - 104, y - 74, 208, 50, 14); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; rr(ctx, x - 96, y - 70, 192, 12, 8); ctx.fill();
    ctx.fillStyle = color; rr(ctx, x - 116, y - 52, 30, 50, 10); ctx.fill(); rr(ctx, x + 86, y - 52, 30, 50, 10); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.12)'; rr(ctx, x - 86, y - 30, 172, 28, 8); ctx.fill();
    ctx.fillStyle = '#ffd43b'; rr(ctx, x - 70, y - 64, 30, 26, 6); ctx.fill();
    ctx.fillStyle = '#ff8fab'; rr(ctx, x + 40, y - 64, 30, 26, 6); ctx.fill();
  }

  function tvSet(ctx, x, y, t) {
    shadow(ctx, x, y, 100, 10);
    ctx.fillStyle = '#7a4520'; rr(ctx, x - 96, y - 40, 192, 40, 6); ctx.fill();
    ctx.fillStyle = '#a0602e'; ctx.fillRect(x - 90, y - 34, 84, 26); ctx.fillRect(x + 6, y - 34, 84, 26);
    ctx.fillStyle = '#212529'; rr(ctx, x - 80, y - 132, 160, 92, 8); ctx.fill();
    const g = ctx.createLinearGradient(x - 72, 0, x + 72, 0);
    g.addColorStop(0, '#74c0fc'); g.addColorStop(1, '#b197fc');
    ctx.fillStyle = g; ctx.fillRect(x - 72, y - 124, 144, 76);
    ctx.fillStyle = '#000'; ctx.font = '26px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(['🐼', '⚽', '🎵', '🌏'][Math.floor((t || 0) / 3) % 4], x, y - 86);
    ctx.fillStyle = '#495057'; ctx.fillRect(x - 6, y - 44, 12, 6);
  }

  function coffeeTable(ctx, x, y) {
    shadow(ctx, x, y, 60, 8);
    ctx.fillStyle = '#6b3618'; ctx.fillRect(x - 50, y - 22, 6, 22); ctx.fillRect(x + 44, y - 22, 6, 22);
    ctx.fillStyle = '#a0602e'; ctx.beginPath(); ctx.ellipse(x, y - 24, 62, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c98a4b'; ctx.beginPath(); ctx.ellipse(x, y - 27, 56, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.font = '18px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    ctx.fillText('🫖', x - 14, y - 34); ctx.fillText('🍪', x + 18, y - 30);
  }

  function bookshelf(ctx, x, y) {
    shadow(ctx, x, y, 50, 8);
    ctx.fillStyle = '#7a4520'; rr(ctx, x - 48, y - 150, 96, 150, 4); ctx.fill();
    const cols = ['#e03131', '#1971c2', '#2f9e44', '#f59f00', '#7048e8', '#e64980'];
    for (let r = 0; r < 4; r++) {
      ctx.fillStyle = '#5c3214'; ctx.fillRect(x - 42, y - 144 + r * 36, 84, 30);
      for (let k = 0; k < 7; k++) { ctx.fillStyle = cols[(r * 3 + k) % 6]; ctx.fillRect(x - 40 + k * 11.5, y - 140 + r * 36 + (k % 3), 9, 26 - (k % 3)); }
    }
  }

  function plantPot(ctx, x, y) {
    shadow(ctx, x, y, 22, 6);
    ctx.fillStyle = '#e8590c'; ctx.beginPath(); ctx.moveTo(x - 18, y - 30); ctx.lineTo(x + 18, y - 30); ctx.lineTo(x + 13, y); ctx.lineTo(x - 13, y); ctx.closePath(); ctx.fill();
    [[-14, -60, -0.5], [14, -62, 0.5], [0, -76, 0], [-8, -48, -0.9], [9, -46, 0.9]].forEach(([dx, dy, a]) => {
      ctx.save(); ctx.translate(x + dx * 0.3, y - 30); ctx.rotate(a); ctx.fillStyle = '#2f9e44';
      ctx.beginPath(); ctx.ellipse(0, dy / 1.6 + 10, 8, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
  }

  function kitchenCounter(ctx, x, y, w) {
    shadow(ctx, x + w / 2, y, w / 2 + 8, 8);
    ctx.fillStyle = '#f8f9fa'; ctx.fillRect(x, y - 62, w, 62);
    ctx.fillStyle = '#ced4da'; for (let k = 0; k < w; k += 70) ctx.fillRect(x + k + 4, y - 50, 62, 44);
    for (let k = 0; k < w; k += 70) circle(ctx, x + k + 56, y - 28, 2.5, '#868e96');
    ctx.fillStyle = '#495057'; ctx.fillRect(x - 4, y - 70, w + 8, 10);
    const sx = x + w * 0.3;
    ctx.fillStyle = '#212529'; ctx.fillRect(sx - 40, y - 70, 80, 8);
    [-20, 20].forEach((d) => { ctx.strokeStyle = '#ff6b3d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(sx + d, y - 66, 12, 4, 0, 0, Math.PI * 2); ctx.stroke(); });
    ctx.fillStyle = '#868e96'; rr(ctx, sx - 32, y - 92, 26, 20, 4); ctx.fill();
    ctx.fillStyle = '#495057'; ctx.fillRect(sx - 36, y - 94, 34, 4);
    const kx = x + w * 0.72;
    ctx.fillStyle = '#74c0fc'; ctx.beginPath(); ctx.ellipse(kx, y - 66, 26, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(kx, y - 70); ctx.lineTo(kx, y - 92); ctx.lineTo(kx + 14, y - 92); ctx.stroke();
    ctx.fillStyle = '#c98a4b'; ctx.fillRect(x, y - 150, w, 46);
    ctx.fillStyle = '#a0602e'; for (let k = 0; k < w; k += 70) ctx.fillRect(x + k + 4, y - 146, 62, 38);
  }

  function fridge(ctx, x, y) {
    shadow(ctx, x, y, 40, 8);
    ctx.fillStyle = '#e9ecef'; rr(ctx, x - 36, y - 160, 72, 160, 8); ctx.fill();
    ctx.fillStyle = '#ced4da'; ctx.fillRect(x - 36, y - 106, 72, 4);
    ctx.fillStyle = '#868e96'; ctx.fillRect(x + 22, y - 150, 5, 34); ctx.fillRect(x + 22, y - 96, 5, 40);
    ctx.font = '14px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    ctx.fillText('🍓', x - 14, y - 132); ctx.fillText('⭐', x - 4, y - 80);
  }

  function diningTable(ctx, x, y) {
    shadow(ctx, x, y + 10, 110, 16);
    [[-70, 30], [70, 30], [-70, -38], [70, -38]].forEach(([dx, dy]) => { ctx.fillStyle = '#8a4b22'; rr(ctx, x + dx - 16, y + dy - 34, 32, 30, 5); ctx.fill(); ctx.fillStyle = '#a0602e'; ctx.fillRect(x + dx - 16, y + dy - 34, 32, 8); });
    ctx.fillStyle = '#6b3618'; ctx.fillRect(x - 80, y - 30, 8, 30); ctx.fillRect(x + 72, y - 30, 8, 30);
    ctx.fillStyle = '#c98a4b'; rr(ctx, x - 92, y - 52, 184, 30, 6); ctx.fill();
    ctx.fillStyle = '#fff'; rr(ctx, x - 60, y - 50, 120, 24, 4); ctx.fill();
    ctx.font = '16px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    ctx.fillText('🍲', x - 26, y - 40); ctx.fillText('🥗', x + 4, y - 38); ctx.fillText('🍚', x + 32, y - 40);
  }

  function bedFurn(ctx, x, y) {
    shadow(ctx, x, y + 4, 90, 14);
    ctx.fillStyle = '#7a4520'; rr(ctx, x - 80, y - 190, 160, 34, 8); ctx.fill();
    ctx.fillStyle = '#a0602e'; rr(ctx, x - 78, y - 160, 156, 160, 6); ctx.fill();
    ctx.fillStyle = '#fff'; rr(ctx, x - 70, y - 158, 140, 150, 8); ctx.fill();
    ctx.fillStyle = '#f8f0e3'; rr(ctx, x - 58, y - 152, 52, 30, 10); ctx.fill(); rr(ctx, x + 6, y - 152, 52, 30, 10); ctx.fill();
    const g = ctx.createLinearGradient(0, y - 116, 0, y);
    g.addColorStop(0, '#91a7ff'); g.addColorStop(1, '#748ffc');
    ctx.fillStyle = g; rr(ctx, x - 72, y - 116, 144, 112, 10); ctx.fill();
    for (let i = 0; i < 4; i++) ART.star(ctx, x - 44 + i * 30, y - 70 + (i % 2) * 22, 6, 2.6, 'rgba(255,255,255,.55)');
  }

  function wardrobe(ctx, x, y) {
    shadow(ctx, x, y, 56, 8);
    ctx.fillStyle = '#8a4b22'; rr(ctx, x - 54, y - 170, 108, 170, 6); ctx.fill();
    ctx.fillStyle = '#a0602e'; ctx.fillRect(x - 48, y - 162, 46, 150); ctx.fillRect(x + 2, y - 162, 46, 150);
    circle(ctx, x - 8, y - 88, 3, '#ffd43b'); circle(ctx, x + 8, y - 88, 3, '#ffd43b');
  }

  function nightstand(ctx, x, y) {
    shadow(ctx, x, y, 26, 5);
    ctx.fillStyle = '#a0602e'; rr(ctx, x - 24, y - 40, 48, 40, 4); ctx.fill();
    ctx.fillStyle = '#7a4520'; ctx.fillRect(x - 18, y - 30, 36, 3);
    ctx.fillStyle = '#868e96'; ctx.fillRect(x - 2, y - 66, 4, 26);
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.moveTo(x - 16, y - 66); ctx.lineTo(x + 16, y - 66); ctx.lineTo(x + 10, y - 84); ctx.lineTo(x - 10, y - 84); ctx.closePath(); ctx.fill();
  }

  function bathtub(ctx, x, y) {
    shadow(ctx, x, y, 90, 12);
    ctx.fillStyle = '#f8f9fa'; rr(ctx, x - 84, y - 70, 168, 70, 30); ctx.fill();
    ctx.fillStyle = '#74c0fc'; rr(ctx, x - 72, y - 64, 144, 30, 14); ctx.fill();
    ['#fff', '#e7f5ff', '#fff'].forEach((c, i) => circle(ctx, x - 40 + i * 34, y - 58, 10, c));
    ctx.strokeStyle = '#adb5bd'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 70, y - 66); ctx.lineTo(x + 70, y - 96); ctx.lineTo(x + 54, y - 96); ctx.stroke();
    ctx.font = '18px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText('🦆', x - 10, y - 66);
  }

  function sinkMirror(ctx, x, y) {
    shadow(ctx, x, y, 34, 6);
    ctx.fillStyle = '#f8f9fa'; rr(ctx, x - 30, y - 56, 60, 56, 6); ctx.fill();
    ctx.fillStyle = '#74c0fc'; ctx.beginPath(); ctx.ellipse(x, y - 52, 20, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ced4da'; rr(ctx, x - 26, y - 128, 52, 64, 26); ctx.fill();
    ctx.fillStyle = '#e7f5ff'; rr(ctx, x - 20, y - 122, 40, 52, 20); ctx.fill();
  }

  function storageShelf(ctx, x, y) {
    shadow(ctx, x, y, 70, 8);
    ctx.fillStyle = '#7a4520'; ctx.fillRect(x - 70, y - 150, 8, 150); ctx.fillRect(x + 62, y - 150, 8, 150);
    for (let r = 0; r < 3; r++) {
      ctx.fillStyle = '#a0602e'; ctx.fillRect(x - 70, y - 50 - r * 48, 140, 6);
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = ['#e8b46a', '#d9a05a', '#c98a4b'][(r + k) % 3];
        rr(ctx, x - 60 + k * 42, y - 86 - r * 48, 36, 36, 3); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x - 60 + k * 42, y - 72 - r * 48, 36, 3);
      }
    }
  }

  function chest(ctx, x, y) {
    shadow(ctx, x, y, 50, 8);
    ctx.fillStyle = '#8a4b22'; rr(ctx, x - 46, y - 50, 92, 50, 6); ctx.fill();
    ctx.fillStyle = '#a0602e'; ctx.beginPath(); ctx.moveTo(x - 46, y - 46); ctx.quadraticCurveTo(x, y - 82, x + 46, y - 46); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fcc419'; ctx.fillRect(x - 48, y - 48, 96, 6); ctx.fillRect(x - 30, y - 64, 6, 64); ctx.fillRect(x + 24, y - 64, 6, 64);
    rr(ctx, x - 8, y - 46, 16, 16, 3); ctx.fill();
    circle(ctx, x, y - 38, 3, '#5c3214');
  }

  function homeDoor(ctx, x, y) {
    ctx.fillStyle = '#5c3214'; rr(ctx, x - 44, y - 16, 88, 20, 4); ctx.fill();
    ctx.fillStyle = '#e8590c'; rr(ctx, x - 38, y - 12, 76, 12, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 11px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('RA NGOÀI', x, y - 6);
  }

  /* ---------- Trường học ---------- */
  /** Bảng đen trên giá gỗ. (x,y) = chân giữa; vùng viết chữ: x±160, y-220..y-70 */
  function blackboard(ctx, x, y) {
    shadow(ctx, x, y, 150, 12);
    ctx.fillStyle = '#7a4a26';
    ctx.fillRect(x - 150, y - 70, 10, 70); ctx.fillRect(x + 140, y - 70, 10, 70);
    ctx.fillStyle = '#9c5b2e';
    rr(ctx, x - 180, y - 236, 360, 176, 8); ctx.fill();
    ctx.fillStyle = '#2f5d3a';
    rr(ctx, x - 168, y - 224, 336, 152, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    ctx.fillRect(x - 160, y - 216, 120, 10);
    ctx.fillStyle = '#b8743f';
    ctx.fillRect(x - 170, y - 66, 340, 8);
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 120, y - 70, 18, 4);
    ctx.fillStyle = '#ffd43b'; ctx.fillRect(x - 96, y - 70, 14, 4);
    ctx.fillStyle = '#c0c0c0'; rr(ctx, x + 80, y - 72, 30, 7, 2); ctx.fill();
  }

  function desk(ctx, x, y) {
    shadow(ctx, x, y, 34, 6);
    ctx.fillStyle = '#7a4a26';
    ctx.fillRect(x - 28, y - 26, 5, 26); ctx.fillRect(x + 23, y - 26, 5, 26);
    ctx.fillStyle = '#c98a4b';
    rr(ctx, x - 34, y - 34, 68, 12, 3); ctx.fill();
    ctx.fillStyle = '#e8b46a'; ctx.fillRect(x - 32, y - 34, 64, 3);
    ctx.fillStyle = '#4c6ef5'; ctx.fillRect(x - 14, y - 40, 16, 6);
    ctx.fillStyle = '#e03131'; ctx.fillRect(x + 6, y - 39, 12, 5);
  }

  function podium(ctx, x, y) {
    shadow(ctx, x, y, 70, 10);
    ctx.fillStyle = '#8a4b22';
    rr(ctx, x - 70, y - 22, 140, 22, 4); ctx.fill();
    ctx.fillStyle = '#b0703a'; ctx.fillRect(x - 70, y - 22, 140, 5);
  }

  function flagPole(ctx, x, y, t) {
    shadow(ctx, x, y, 14, 4);
    ctx.fillStyle = '#adb5bd'; ctx.fillRect(x - 3, y - 190, 6, 190);
    circle(ctx, x, y - 192, 5, '#fcc419');
    ctx.fillStyle = '#da251d';
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 186);
    for (let i = 0; i <= 10; i++) { const fx = x + 3 + i * 7, wv = Math.sin(t * 4 + i * 0.7) * 3 * (i / 10); ctx.lineTo(fx, y - 186 + wv); }
    for (let i = 10; i >= 0; i--) { const fx = x + 3 + i * 7, wv = Math.sin(t * 4 + i * 0.7) * 3 * (i / 10); ctx.lineTo(fx, y - 138 + wv); }
    ctx.closePath(); ctx.fill();
    ART.star(ctx, x + 38, y - 162 + Math.sin(t * 4 + 3.5) * 1.5, 11, 4.5, '#ffde00');
  }

  /* ---------- Ban đêm ---------- */
  function nightSky(ctx, w, hz, n, t) {
    if (n <= 0) return;
    ctx.fillStyle = `rgba(10,18,52,${0.82 * n})`;
    ctx.fillRect(-800, -200, w + 1600, hz + 200);
    const r = srand(99);
    for (let i = 0; i < 90; i++) {
      const sx = -200 + r() * (w + 400), sy = r() * (hz - 60);
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i));
      ctx.fillStyle = `rgba(255,255,230,${n * tw})`;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = n;
    circle(ctx, w * 0.78, 70, 30, '#fff7d1');
    circle(ctx, w * 0.78 + 12, 62, 26, `rgb(${10 + 30 * (1 - n)},${18 + 40 * (1 - n)},${52 + 60 * (1 - n)})`);
    ctx.globalAlpha = 1;
  }

  function fireflies(ctx, cx, cy, vw, vh, n, t) {
    if (n < 0.3) return;
    for (let i = 0; i < 26; i++) {
      const fx = cx - vw / 2 + ((i * 173 + Math.sin(t * 0.6 + i) * 60 + t * 8) % vw + vw) % vw;
      const fy = cy - vh / 2 + ((i * 97 + Math.cos(t * 0.5 + i * 2) * 50) % vh + vh) % vh;
      const a = n * (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)));
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 9);
      g.addColorStop(0, `rgba(255,255,150,${a})`); g.addColorStop(1, 'rgba(255,255,150,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,255,210,${a})`; ctx.fillRect(fx - 1, fy - 1, 2, 2);
    }
  }

  return { jackLantern, gravestone, hwSky, hwBunting, cauldronStall, arcadeCabinet, grandstand, raceCar, startGate, swingFrame, swingSeat, gazebo, innerWallH, innerWallV, sofa, tvSet, coffeeTable, bookshelf, plantPot, kitchenCounter, fridge, diningTable, bedFurn, wardrobe, nightstand, bathtub, sinkMirror, storageShelf, chest, homeDoor, treeFruits, lantern, pillar, wallH, wallV, farmGate, barn, windmill, flowerBed, trough, blackboard, desk, podium, flagPole, fishingRod, biteMark, stonePath, BED, bed, roseHedge, scarecrow, doorArrow, nightSky, fireflies, shed, kitchen, timerLabel, backdrop, cloud, woodFence, tulips, namePlate, pet, flowerPot, palm, umbrella, pickup, seaWaves, lake, dock, building, ferrisWheel, stage, gameTable, iceCart, signBoard, swing };
})());

/* Thú giữ nhà (chó cỏ, béc-giê, hổ, sư tử) + chuồng thú */
Object.assign(ART, (() => {
  const { rr, shadow, circle } = ART;
  const LOOK = {
    dog: { s: 1.3, body: '#d9a066', dark: '#a8723a', belly: '#f6e3c3' },
    shepherd: { s: 1.5, body: '#c98d4a', dark: '#2b2622', belly: '#ecc48e' },
    tiger: { s: 1.75, body: '#f08c00', dark: '#1f1a17', belly: '#fff4e6' },
    lion: { s: 1.85, body: '#e2ab55', dark: '#8a5a19', belly: '#f7e1b5', mane: '#9c5418' },
  };

  /** Thú giữ nhà nhìn sang phải (dir = -1 thì lật). angry = đang đuổi cắn kẻ trộm */
  function guard(ctx, x, y, kind, dir, t, moving, angry) {
    if (kind === 'trex') return trex(ctx, x, y, dir, t, moving, angry);
    if (kind === 'dragon') return dragon(ctx, x, y, dir, t, moving, angry);
    const L = LOOK[kind];
    if (!L) return;
    const s = L.s, run = angry ? 20 : 12;
    const hop = moving ? Math.abs(Math.sin(t * run)) * 2.2 : 0;
    shadow(ctx, x, y, 17 * s, 4.5 * s);
    ctx.save();
    ctx.translate(x, y - hop * s);
    ctx.scale(dir * s, s);
    const cat = kind === 'tiger' || kind === 'lion';

    // đuôi
    const wag = angry ? Math.sin(t * 22) * 3 : moving ? Math.sin(t * 12) * 3 : Math.sin(t * 3) * 1.5;
    ctx.strokeStyle = L.body; ctx.lineWidth = cat ? 3 : 3.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-13, -16);
    if (cat) ctx.quadraticCurveTo(-26, -12, -27 + wag * 0.3, -26 + wag);
    else ctx.quadraticCurveTo(-21, -20, -20 + wag * 0.4, -28 + Math.abs(wag));
    ctx.stroke();
    if (kind === 'lion') circle(ctx, -27 + wag * 0.3, -27 + wag, 3.2, L.mane);
    if (kind === 'tiger') { ctx.strokeStyle = L.dark; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-22, -15); ctx.lineTo(-23, -18); ctx.moveTo(-25, -20); ctx.lineTo(-27, -21); ctx.stroke(); }

    // chân (sau trước)
    [-10, -5, 5, 10].forEach((lx, i) => {
      const lift = moving ? Math.max(0, Math.sin(t * run + i * 1.7)) * 3.2 : 0;
      ctx.fillStyle = i === 1 || i === 3 ? L.body : L.dark;
      if (kind === 'shepherd' || cat) ctx.fillStyle = i === 1 || i === 3 ? L.body : shadeOf(L.body);
      rr(ctx, lx - 2.4, -9 - lift, 4.8, 9, 2.2); ctx.fill();
      circle(ctx, lx, -0.6 - lift, 2.6, cat ? L.belly : L.dark);
    });

    // thân
    ctx.fillStyle = L.body;
    ctx.beginPath(); ctx.ellipse(0, -15, 15.5, 8.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = L.belly;
    ctx.beginPath(); ctx.ellipse(2, -10.5, 10, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    if (kind === 'shepherd') { ctx.fillStyle = L.dark; ctx.beginPath(); ctx.ellipse(-2, -19.5, 11, 5, 0, 0, Math.PI * 2); ctx.fill(); }
    if (kind === 'tiger') {
      ctx.strokeStyle = L.dark; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (let k = -10; k <= 8; k += 4.5) { ctx.beginPath(); ctx.moveTo(k, -23); ctx.quadraticCurveTo(k + 2, -18, k, -13); ctx.stroke(); }
    }

    // bờm sư tử
    const hx = 13, hy = -22;
    if (kind === 'lion') {
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        circle(ctx, hx - 1 + Math.cos(a) * 9.5, hy + Math.sin(a) * 9.5, 4.6, L.mane);
      }
      circle(ctx, hx - 1, hy, 9.5, L.mane);
    }

    // đầu
    circle(ctx, hx, hy, 7.6, L.body);
    // tai
    if (kind === 'dog') { ctx.fillStyle = L.dark; ctx.beginPath(); ctx.ellipse(hx - 5, hy - 2, 3.2, 6, 0.5, 0, Math.PI * 2); ctx.fill(); }
    else if (kind === 'shepherd') {
      ctx.fillStyle = L.dark;
      ctx.beginPath(); ctx.moveTo(hx - 6, hy - 4); ctx.lineTo(hx - 5, hy - 15); ctx.lineTo(hx - 1, hy - 6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx - 1, hy - 6); ctx.lineTo(hx + 1, hy - 16); ctx.lineTo(hx + 4, hy - 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = L.dark; ctx.beginPath(); ctx.ellipse(hx - 2, hy - 2, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      circle(ctx, hx - 5, hy - 6, 3, L.body); circle(ctx, hx + 2, hy - 7.5, 3, L.body);
      circle(ctx, hx - 5, hy - 6, 1.5, kind === 'tiger' ? L.dark : L.mane); circle(ctx, hx + 2, hy - 7.5, 1.5, kind === 'tiger' ? L.dark : L.mane);
    }
    if (kind === 'tiger') {
      ctx.strokeStyle = L.dark; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(hx - 2, hy - 7); ctx.lineTo(hx - 1, hy - 4); ctx.moveTo(hx + 2, hy - 7); ctx.lineTo(hx + 2, hy - 4); ctx.moveTo(hx - 7, hy - 1); ctx.lineTo(hx - 4, hy); ctx.stroke();
    }

    // mõm + mũi + mắt
    ctx.fillStyle = L.belly;
    ctx.beginPath(); ctx.ellipse(hx + 6, hy + 2.5, kind === 'shepherd' ? 6 : 5, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    circle(ctx, hx + 10.5, hy + 0.8, 1.9, '#2b1d14');
    circle(ctx, hx + 2.5, hy - 2.5, 1.5, angry ? '#c92a2a' : '#111');
    if (angry) {
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(hx, hy - 5.5); ctx.lineTo(hx + 4.5, hy - 3.8); ctx.stroke();
      // há miệng nhe răng
      ctx.fillStyle = '#8b1a1a';
      ctx.beginPath(); ctx.moveTo(hx + 3, hy + 4.5); ctx.lineTo(hx + 11, hy + 3.5); ctx.lineTo(hx + 8, hy + 8.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(hx + 5, hy + 4.2); ctx.lineTo(hx + 6, hy + 6.4); ctx.lineTo(hx + 7, hy + 4); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx + 8, hy + 3.9); ctx.lineTo(hx + 9, hy + 6); ctx.lineTo(hx + 10, hy + 3.7); ctx.closePath(); ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(40,25,15,.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(hx + 7, hy + 4, 2.2, 0.2, Math.PI - 0.4); ctx.stroke();
    }
    // vòng cổ chó
    if (!cat) { ctx.fillStyle = '#e03131'; rr(ctx, hx - 7, hy + 5, 6, 3.2, 1.5); ctx.fill(); circle(ctx, hx - 3.5, hy + 9, 1.6, '#fcc419'); }
    ctx.restore();
  }
  const shadeOf = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.round(c * 0.8);
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  };

  /** Khủng long bạo chúa: đi 2 chân, đầu to, tay ngắn; giận thì há miệng nhe răng */
  function trex(ctx, x, y, dir, t, moving, angry) {
    const s = 1.9, run = angry ? 18 : 10;
    const bob = moving ? Math.abs(Math.sin(t * run)) * 2 : 0;
    shadow(ctx, x, y, 20 * s, 5 * s);
    ctx.save(); ctx.translate(x, y - bob * s); ctx.scale(dir * s, s);
    const G = '#5c940d', DK = '#2b8a3e', BL = '#d8f5a2';
    // đuôi
    const wag = Math.sin(t * (angry ? 14 : 4)) * 2;
    ctx.fillStyle = G; ctx.beginPath(); ctx.moveTo(-6, -26); ctx.quadraticCurveTo(-22, -24 + wag, -34, -16 + wag); ctx.quadraticCurveTo(-20, -15, -6, -16); ctx.closePath(); ctx.fill();
    // chân
    [-4, 4].forEach((lx, i) => {
      const lift = moving ? Math.max(0, Math.sin(t * run + i * Math.PI)) * 4 : 0;
      ctx.fillStyle = i ? G : DK; rr(ctx, lx - 3.5, -16 - lift, 7, 16, 3); ctx.fill();
      ctx.fillStyle = DK; rr(ctx, lx - 3, -2 - lift, 9, 3, 1.5); ctx.fill();
    });
    // thân
    ctx.fillStyle = G; ctx.beginPath(); ctx.ellipse(0, -24, 13, 11, -0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = BL; ctx.beginPath(); ctx.ellipse(4, -21, 7, 7, -0.3, 0, Math.PI * 2); ctx.fill();
    [[-6, -30], [-1, -32], [-8, -24]].forEach(([dx, dy]) => circle(ctx, dx, dy, 1.6, DK));
    // cổ + đầu to
    ctx.fillStyle = G; ctx.beginPath(); ctx.ellipse(8, -33, 6, 8, 0.5, 0, Math.PI * 2); ctx.fill();
    const open = angry ? 3 + Math.abs(Math.sin(t * 16)) * 3 : 0;
    rr(ctx, 6, -46, 20, 10, 5); ctx.fill();
    ctx.fillStyle = DK; rr(ctx, 8, -37 + open, 16, 5, 2.5); ctx.fill();
    if (open) {
      ctx.fillStyle = '#c92a2a'; ctx.fillRect(9, -37, 14, open);
      ctx.fillStyle = '#fff';
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(10 + k * 3, -37); ctx.lineTo(11.5 + k * 3, -34.5); ctx.lineTo(13 + k * 3, -37); ctx.fill(); }
    }
    circle(ctx, 15, -43, 2.4, '#fff'); circle(ctx, 15.6, -43, 1.3, angry ? '#c92a2a' : '#111');
    if (angry) { ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(12, -46.5); ctx.lineTo(18, -45); ctx.stroke(); }
    circle(ctx, 24, -43, 0.9, DK);
    // tay ngắn
    ctx.strokeStyle = DK; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(8, -24); ctx.lineTo(12, -21 + Math.sin(t * 9)); ctx.stroke();
    // gai lưng
    ctx.fillStyle = '#ffd43b';
    [[-10, -32], [-4, -35], [2, -36]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.moveTo(sx - 2.5, sy + 2); ctx.lineTo(sx, sy - 4); ctx.lineTo(sx + 2.5, sy + 2); ctx.closePath(); ctx.fill(); });
    ctx.restore();
  }

  /** Rồng lửa: 4 chân, cánh vỗ, sừng, đuôi mũi giáo; giận thì phun lửa */
  function dragon(ctx, x, y, dir, t, moving, angry) {
    const s = 1.85, run = angry ? 18 : 10;
    const bob = Math.sin(t * 3) * 1.5 + (moving ? Math.abs(Math.sin(t * run)) * 2 : 0);
    shadow(ctx, x, y, 20 * s, 5 * s);
    ctx.save(); ctx.translate(x, y - bob * s); ctx.scale(dir * s, s);
    const R = '#e03131', DR = '#a61e1e', BY = '#ffd43b';
    // cánh sau
    const flap = Math.sin(t * (angry ? 14 : 5)) * 0.35;
    const wing = (rot, col) => {
      ctx.save(); ctx.translate(-2, -26); ctx.rotate(rot);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -20); ctx.lineTo(-20, -16); ctx.quadraticCurveTo(-16, -10, -18, -6); ctx.quadraticCurveTo(-11, -6, -10, -1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-20, -16); ctx.moveTo(0, 0); ctx.lineTo(-18, -6); ctx.stroke();
      ctx.restore();
    };
    wing(-0.2 - flap, DR);
    // đuôi
    ctx.strokeStyle = R; ctx.lineWidth = 4; ctx.lineCap = 'round';
    const w = Math.sin(t * 4) * 3;
    ctx.beginPath(); ctx.moveTo(-12, -16); ctx.quadraticCurveTo(-24, -10 + w, -32, -18 + w); ctx.stroke();
    ctx.fillStyle = DR; ctx.beginPath(); ctx.moveTo(-31, -18 + w); ctx.lineTo(-38, -22 + w); ctx.lineTo(-35, -14 + w); ctx.closePath(); ctx.fill();
    // chân
    [-9, -3, 5, 10].forEach((lx, i) => { const lift = moving ? Math.max(0, Math.sin(t * run + i * 1.6)) * 3 : 0; ctx.fillStyle = i % 2 ? R : DR; rr(ctx, lx - 2.5, -10 - lift, 5, 10, 2); ctx.fill(); });
    // thân + bụng vảy vàng
    ctx.fillStyle = R; ctx.beginPath(); ctx.ellipse(0, -17, 15, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = BY; ctx.beginPath(); ctx.ellipse(2, -12, 10, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(160,80,0,.5)'; ctx.lineWidth = 0.8; for (let k = -6; k <= 8; k += 3.5) { ctx.beginPath(); ctx.moveTo(k, -15); ctx.lineTo(k, -9); ctx.stroke(); }
    // gai lưng
    ctx.fillStyle = BY; [[-9, -25], [-4, -26], [1, -26], [6, -25]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.moveTo(sx - 2, sy + 2); ctx.lineTo(sx, sy - 3.5); ctx.lineTo(sx + 2, sy + 2); ctx.closePath(); ctx.fill(); });
    // cổ + đầu
    ctx.fillStyle = R; ctx.beginPath(); ctx.ellipse(11, -26, 5, 8, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(17, -33, 8, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(24, -31, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    // sừng
    ctx.fillStyle = '#fff3bf'; [[13, -38, -0.5], [18, -39, 0.1]].forEach(([hx, hy, a]) => { ctx.save(); ctx.translate(hx, hy); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-1.6, 0); ctx.lineTo(0, -7); ctx.lineTo(1.6, 0); ctx.closePath(); ctx.fill(); ctx.restore(); });
    circle(ctx, 19, -35, 2.2, BY); circle(ctx, 19.6, -35, 1.1, '#111');
    circle(ctx, 28, -32, 0.8, DR);
    // cánh trước
    wing(-0.05 + flap, R);
    // phun lửa khi giận
    if (angry) {
      for (let k = 0; k < 7; k++) {
        const p = ((t * 3 + k / 7) % 1);
        const fx = 30 + p * 26, fy = -31 + Math.sin(k * 2 + t * 10) * p * 6;
        circle(ctx, fx, fy, 2.5 + p * 5, p < 0.4 ? '#fff3bf' : p < 0.7 ? '#ffa94d' : 'rgba(240,62,62,.7)');
      }
    }
    ctx.restore();
  }

  /** Chuồng thú bằng gỗ mái đỏ, có hình khúc xương */
  function kennel(ctx, x, y) {
    shadow(ctx, x, y, 66, 12);
    ctx.fillStyle = '#b5773e';
    rr(ctx, x - 52, y - 64, 104, 64, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,20,.35)'; ctx.lineWidth = 2;
    for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x - 52, y - 64 + k * 13); ctx.lineTo(x + 52, y - 64 + k * 13); ctx.stroke(); }
    ctx.fillStyle = '#c92a2a';
    ctx.beginPath(); ctx.moveTo(x - 66, y - 56); ctx.lineTo(x, y - 112); ctx.lineTo(x + 66, y - 56); ctx.lineTo(x + 56, y - 50); ctx.lineTo(x, y - 98); ctx.lineTo(x - 56, y - 50); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8b46a';
    ctx.beginPath(); ctx.moveTo(x - 56, y - 50); ctx.lineTo(x, y - 98); ctx.lineTo(x + 56, y - 50); ctx.lineTo(x + 52, y - 64); ctx.lineTo(x - 52, y - 64); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9c6a36';
    ctx.beginPath(); ctx.moveTo(x - 52, y - 64); ctx.lineTo(x, y - 98); ctx.lineTo(x + 52, y - 64); ctx.closePath(); ctx.fill();
    // cửa vòm
    ctx.fillStyle = '#3b2412';
    ctx.beginPath(); ctx.moveTo(x - 22, y); ctx.lineTo(x - 22, y - 26); ctx.arc(x, y - 26, 22, Math.PI, 0); ctx.lineTo(x + 22, y); ctx.closePath(); ctx.fill();
    // khúc xương
    ctx.fillStyle = '#fff';
    rr(ctx, x - 13, y - 81, 26, 7, 3); ctx.fill();
    [[-13, -82], [-13, -73], [13, -82], [13, -73]].forEach(([dx, dy]) => circle(ctx, x + dx, y + dy, 4, '#fff'));
  }

  function dogBowl(ctx, x, y) {
    shadow(ctx, x, y, 16, 4);
    ctx.fillStyle = '#1c7ed6';
    ctx.beginPath(); ctx.ellipse(x, y - 4, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath(); ctx.ellipse(x, y - 6, 11, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    circle(ctx, x - 4, y - 7, 2, '#a0703a'); circle(ctx, x + 3, y - 7, 2, '#a0703a');
  }

  return { guard, kennel, dogBowl, trex, dragon };
})());

/* Nhà Casino ở Khu giải trí: mặt tiền + bảng hiệu đèn nhấp nháy */
Object.assign(ART, (() => {
  const { rr, shadow, circle } = ART;
  const CW = 560, CH = 300;

  function casino(ctx, x, y) {
    const L = x - CW / 2, T = y - CH;
    shadow(ctx, x, y + 6, 310, 24, 0.2);
    // thân nhà
    const body = ctx.createLinearGradient(0, T, 0, y);
    body.addColorStop(0, '#7b1f45'); body.addColorStop(1, '#4a0f2a');
    ctx.fillStyle = body; rr(ctx, L, T, CW, CH, 10); ctx.fill();
    // hoạ tiết kim cương
    ctx.strokeStyle = 'rgba(255,212,59,.16)'; ctx.lineWidth = 2;
    for (let k = -CH; k < CW; k += 34) { ctx.beginPath(); ctx.moveTo(L + k, y); ctx.lineTo(L + k + CH, T + 20); ctx.moveTo(L + k + CH, y); ctx.lineTo(L + k, T + 20); ctx.stroke(); }
    // cột vàng
    for (let k = 0; k < 5; k++) {
      const px = L + 26 + k * (CW - 52) / 4;
      const g = ctx.createLinearGradient(px - 11, 0, px + 11, 0);
      g.addColorStop(0, '#c78b00'); g.addColorStop(0.5, '#ffe066'); g.addColorStop(1, '#b07800');
      ctx.fillStyle = g; ctx.fillRect(px - 11, T + 36, 22, CH - 36);
      ctx.fillStyle = '#ffd43b'; ctx.fillRect(px - 15, T + 30, 30, 10); ctx.fillRect(px - 15, y - 10, 30, 10);
    }
    // mái + diềm vàng
    ctx.fillStyle = '#ffd43b'; rr(ctx, L - 16, T - 8, CW + 32, 28, 8); ctx.fill();
    ctx.fillStyle = '#e8a200'; ctx.fillRect(L - 10, T + 12, CW + 20, 6);
    // cửa sổ vòm sáng ấm
    [L + 92, L + 196, L + CW - 196, L + CW - 92].forEach((wx, wi) => {
      ctx.fillStyle = '#2b0a1f'; rr(ctx, wx - 36, T + 70, 72, 118, 30); ctx.fill();
      const gl = ctx.createLinearGradient(0, T + 76, 0, T + 184);
      gl.addColorStop(0, '#fff3bf'); gl.addColorStop(1, '#ffa94d');
      ctx.fillStyle = gl; rr(ctx, wx - 30, T + 76, 60, 106, 26); ctx.fill();
      ctx.fillStyle = '#c92a2a';
      ctx.beginPath(); ctx.moveTo(wx - 30, T + 90); ctx.quadraticCurveTo(wx - 14, T + 120, wx - 26, T + 182); ctx.lineTo(wx - 30, T + 182); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(wx + 30, T + 90); ctx.quadraticCurveTo(wx + 14, T + 120, wx + 26, T + 182); ctx.lineTo(wx + 30, T + 182); ctx.closePath(); ctx.fill();
      ctx.font = '22px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
      ctx.fillText(['🎲', '🃏', '🎰', '🕹️'][wi], wx, T + 140);
    });
    // cửa kính đôi
    ctx.fillStyle = '#ffd43b'; rr(ctx, x - 78, y - 150, 156, 150, 10); ctx.fill();
    ctx.fillStyle = '#1b1430'; rr(ctx, x - 70, y - 142, 140, 142, 6); ctx.fill();
    [-1, 1].forEach((sd) => {
      const gl = ctx.createLinearGradient(x + sd * 34 - 30, y - 136, x + sd * 34 + 30, y);
      gl.addColorStop(0, '#ffe8a3'); gl.addColorStop(1, '#e8590c');
      ctx.fillStyle = gl; rr(ctx, x + sd * 34 - 30, y - 136, 60, 136, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + sd * 34 - 22, y - 128, 8, 110);
      ctx.fillStyle = '#ffd43b'; rr(ctx, x + sd * 8 - 3, y - 80, 6, 26, 3); ctx.fill();
    });
    // mái hiên đỏ
    ctx.fillStyle = '#e03131';
    ctx.beginPath(); ctx.moveTo(x - 104, y - 168); ctx.lineTo(x + 104, y - 168); ctx.lineTo(x + 92, y - 146); ctx.lineTo(x - 92, y - 146); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let k = -96; k < 96; k += 24) { ctx.beginPath(); ctx.moveTo(x + k, y - 146); ctx.lineTo(x + k + 12, y - 146); ctx.lineTo(x + k + 6, y - 138); ctx.closePath(); ctx.fill(); }
    // thảm đỏ trước cửa
    ctx.fillStyle = '#c92a2a';
    ctx.beginPath(); ctx.moveTo(x - 66, y); ctx.lineTo(x + 66, y); ctx.lineTo(x + 88, y + 34); ctx.lineTo(x - 88, y + 34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd43b'; ctx.fillRect(x - 88, y + 30, 176, 4);
    // bảng hiệu
    ctx.fillStyle = '#ffd43b'; rr(ctx, x - 182, T - 104, 364, 100, 18); ctx.fill();
    ctx.fillStyle = '#2b0a3d'; rr(ctx, x - 174, T - 96, 348, 84, 14); ctx.fill();
    ctx.font = '900 52px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const tg = ctx.createLinearGradient(0, T - 80, 0, T - 28);
    tg.addColorStop(0, '#fff3bf'); tg.addColorStop(1, '#fcc419');
    ctx.lineWidth = 6; ctx.strokeStyle = '#7a2e00'; ctx.strokeText('CASINO', x, T - 53);
    ctx.fillStyle = tg; ctx.fillText('CASINO', x, T - 53);
    ctx.font = '22px system-ui, "Segoe UI Emoji"';
    ctx.fillStyle = '#000'; ctx.fillText('♠️', x - 150, T - 54); ctx.fillText('♥️', x + 150, T - 54);
  }

  /** Bóng đèn quanh bảng hiệu: nhấp nháy chạy vòng (vẽ mỗi khung, rất nhẹ) */
  function casinoBulbs(ctx, x, y, t) {
    const T = y - CH, l = x - 178, r = x + 178, top = T - 100, bot = T - 8;
    const pts = [];
    for (let px = l; px <= r; px += 22) { pts.push([px, top]); }
    for (let py = top + 22; py <= bot; py += 22) pts.push([r, py]);
    for (let px = r - 22; px >= l; px -= 22) pts.push([px, bot]);
    for (let py = bot - 22; py > top; py -= 22) pts.push([l, py]);
    const step = Math.floor(t * 7);
    pts.forEach(([px, py], i) => {
      const lit = (i + step) % 3 === 0;
      circle(ctx, px, py, 4.2, lit ? '#fff9db' : '#f08c00');
      if (lit) circle(ctx, px, py, 7, 'rgba(255,240,170,.35)');
    });
  }

  return { casino, casinoBulbs, CASINO: { w: CW, h: CH } };
})());

/* Bệ bắn pháo hoa ở Sân Chơi nông trại */
Object.assign(ART, (() => {
  const { rr, shadow } = ART;
  function fireworkPad(ctx, x, y) {
    shadow(ctx, x, y, 62, 12);
    ctx.fillStyle = '#8b5a2b'; rr(ctx, x - 56, y - 26, 112, 26, 5); ctx.fill();
    ctx.fillStyle = '#a9733f'; rr(ctx, x - 56, y - 30, 112, 10, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(70,40,15,.45)'; ctx.lineWidth = 2;
    for (let k = -40; k <= 40; k += 20) { ctx.beginPath(); ctx.moveTo(x + k, y - 20); ctx.lineTo(x + k, y - 2); ctx.stroke(); }
    // ống pháo
    [[-34, '#e03131', 34], [-12, '#fcc419', 44], [12, '#4dabf7', 40], [34, '#e64980', 30]].forEach(([dx, col, h]) => {
      ctx.fillStyle = col; rr(ctx, x + dx - 8, y - 28 - h, 16, h, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(x + dx - 8, y - 28 - h * 0.6, 16, 4);
      ctx.fillStyle = '#343a40'; rr(ctx, x + dx - 9, y - 31 - h, 18, 5, 2); ctx.fill();
      ctx.strokeStyle = '#495057'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x + dx, y - 31 - h); ctx.quadraticCurveTo(x + dx + 5, y - 38 - h, x + dx + 2, y - 43 - h); ctx.stroke();
    });
    // biển nhỏ
    ctx.fillStyle = '#fff3bf'; rr(ctx, x - 30, y - 22, 60, 16, 4); ctx.fill();
    ctx.fillStyle = '#c92a2a'; ctx.font = '900 10px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PHÁO HOA', x, y - 14);
  }
  return { fireworkPad };
})());

/* Đồ nội thất mua thêm + lớp phủ khi nằm giường / ngâm bồn tắm */
Object.assign(ART, (() => {
  const { rr, shadow, circle } = ART;

  /** Chăn đắp lên người khi nằm ngủ (vẽ đè lên nhân vật) */
  function bedBlanket(ctx, x, y, t) {
    const g = ctx.createLinearGradient(0, y - 118, 0, y);
    g.addColorStop(0, '#91a7ff'); g.addColorStop(1, '#748ffc');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 72, y - 108);
    ctx.quadraticCurveTo(x, y - 128, x + 72, y - 108);
    ctx.lineTo(x + 72, y - 14); ctx.quadraticCurveTo(x + 72, y - 4, x + 62, y - 4);
    ctx.lineTo(x - 62, y - 4); ctx.quadraticCurveTo(x - 72, y - 4, x - 72, y - 14);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#dbe4ff'; rr(ctx, x - 72, y - 116, 144, 14, 7); ctx.fill();
    for (let i = 0; i < 4; i++) ART.star(ctx, x - 44 + i * 30, y - 66 + (i % 2) * 22, 6, 2.6, 'rgba(255,255,255,.55)');
    // Zzz bay lên
    ctx.font = '900 18px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let k = 0; k < 3; k++) {
      const p = ((t * 0.5 + k / 3) % 1);
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = '#5c7cfa';
      ctx.fillText('z', x + 30 + p * 30 + Math.sin(p * 6) * 4, y - 150 - p * 60);
    }
    ctx.globalAlpha = 1;
  }

  /** Mặt nước + thành bồn phía trước khi đang ngâm mình (vẽ đè lên nhân vật) */
  function bathFront(ctx, x, y, t) {
    ctx.fillStyle = 'rgba(116,192,252,.85)'; rr(ctx, x - 72, y - 62, 144, 26, 12); ctx.fill();
    ctx.fillStyle = '#f8f9fa'; rr(ctx, x - 84, y - 44, 168, 44, 18); ctx.fill();
    ctx.fillStyle = '#e9ecef'; ctx.fillRect(x - 78, y - 44, 156, 4);
    for (let k = 0; k < 9; k++) {
      const bx = x - 64 + k * 16 + Math.sin(t * 2 + k) * 3, by = y - 50 + Math.sin(t * 3 + k * 1.7) * 2;
      circle(ctx, bx, by, 7 + (k % 3) * 2, k % 2 ? '#fff' : '#e7f5ff');
    }
    for (let k = 0; k < 3; k++) {
      const p = (t * 0.4 + k / 3) % 1;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = '#a5d8ff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x - 30 + k * 30, y - 70 - p * 50, 4 + p * 3, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.font = '18px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    ctx.fillText('🦆', x + 40 + Math.sin(t * 1.5) * 8, y - 56);
  }

  /** Bàn ăn tách 2 phần để ngồi vào giữa: 'back' = 2 ghế phía sau, còn lại = bàn + ghế trước */
  function diningPart(ctx, x, y, part) {
    if (part === 'back') {
      [-70, 70].forEach((dx) => { ctx.fillStyle = '#8a4b22'; rr(ctx, x + dx - 16, y - 72, 32, 30, 5); ctx.fill(); ctx.fillStyle = '#a0602e'; ctx.fillRect(x + dx - 16, y - 72, 32, 8); });
      return;
    }
    shadow(ctx, x, y + 10, 110, 16);
    [-70, 70].forEach((dx) => { ctx.fillStyle = '#8a4b22'; rr(ctx, x + dx - 16, y - 4, 32, 30, 5); ctx.fill(); ctx.fillStyle = '#a0602e'; ctx.fillRect(x + dx - 16, y - 4, 32, 8); });
    ctx.fillStyle = '#6b3618'; ctx.fillRect(x - 80, y - 30, 8, 30); ctx.fillRect(x + 72, y - 30, 8, 30);
    ctx.fillStyle = '#c98a4b'; rr(ctx, x - 92, y - 52, 184, 30, 6); ctx.fill();
    ctx.fillStyle = '#fff'; rr(ctx, x - 60, y - 50, 120, 24, 4); ctx.fill();
    ctx.font = '16px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    ctx.fillText('🍲', x - 26, y - 40); ctx.fillText('🥗', x + 4, y - 38); ctx.fillText('🍚', x + 32, y - 40);
  }

  function piano(ctx, x, y) {
    shadow(ctx, x, y, 80, 10);
    ctx.fillStyle = '#212529'; rr(ctx, x - 74, y - 120, 148, 92, 8); ctx.fill();
    ctx.fillStyle = '#343a40'; rr(ctx, x - 68, y - 114, 136, 40, 6); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x - 66, y - 62, 132, 20);
    ctx.fillStyle = '#212529';
    for (let k = 0; k <= 12; k++) ctx.fillRect(x - 66 + k * 11, y - 62, 1, 20);
    [1, 2, 4, 5, 6, 8, 9, 11].forEach((k) => ctx.fillRect(x - 66 + k * 11 - 3, y - 62, 6, 12));
    ctx.fillStyle = '#212529'; ctx.fillRect(x - 70, y - 42, 8, 42); ctx.fillRect(x + 62, y - 42, 8, 42);
    ctx.fillStyle = '#fcc419'; ctx.fillRect(x - 20, y - 104, 40, 22);
    ctx.fillStyle = '#5c3010'; ctx.font = '12px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎼', x, y - 93);
    ctx.fillStyle = '#495057'; rr(ctx, x - 34, y - 14, 68, 12, 4); ctx.fill();
  }

  function aquarium(ctx, x, y, t) {
    shadow(ctx, x, y, 76, 10);
    ctx.fillStyle = '#8a4b22'; rr(ctx, x - 70, y - 40, 140, 40, 5); ctx.fill();
    ctx.fillStyle = '#5c3010'; ctx.fillRect(x - 64, y - 34, 128, 4);
    ctx.fillStyle = '#343a40'; rr(ctx, x - 70, y - 124, 140, 86, 6); ctx.fill();
    const wg = ctx.createLinearGradient(0, y - 118, 0, y - 44);
    wg.addColorStop(0, '#74c0fc'); wg.addColorStop(1, '#1c7ed6');
    ctx.fillStyle = wg; ctx.fillRect(x - 64, y - 118, 128, 74);
    ctx.fillStyle = '#ffe8a3'; ctx.fillRect(x - 64, y - 52, 128, 8);
    [[-44, '#2f9e44'], [-30, '#51cf66'], [40, '#2f9e44']].forEach(([dx, c]) => {
      ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + dx, y - 46);
      ctx.quadraticCurveTo(x + dx + Math.sin(t * 2 + dx) * 6, y - 70, x + dx, y - 96); ctx.stroke();
    });
    [['#ff922b', 0, -84], ['#ffd43b', 2.1, -66], ['#f06595', 4.2, -100]].forEach(([c, ph, dy]) => {
      const fx = x + Math.sin(t * 0.8 + ph) * 46, dir = Math.cos(t * 0.8 + ph) > 0 ? 1 : -1, fy = y + dy + Math.sin(t * 2 + ph) * 3;
      ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(fx, fy, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(fx - dir * 7, fy); ctx.lineTo(fx - dir * 13, fy - 5); ctx.lineTo(fx - dir * 13, fy + 5); ctx.closePath(); ctx.fill();
      circle(ctx, fx + dir * 4, fy - 1, 1.2, '#111');
    });
    for (let k = 0; k < 3; k++) { const p = (t * 0.5 + k / 3) % 1; circle(ctx, x + 30 + Math.sin(p * 8) * 3, y - 50 - p * 64, 2.4, 'rgba(255,255,255,.7)'); }
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x - 60, y - 116, 10, 66);
  }

  function gameConsole(ctx, x, y) {
    shadow(ctx, x, y, 34, 6);
    ctx.fillStyle = '#495057'; rr(ctx, x - 30, y - 40, 60, 40, 5); ctx.fill();
    ctx.fillStyle = '#f8f9fa'; rr(ctx, x - 26, y - 62, 52, 22, 6); ctx.fill();
    ctx.fillStyle = '#4dabf7'; rr(ctx, x - 22, y - 58, 20, 14, 3); ctx.fill();
    circle(ctx, x + 12, y - 51, 4, '#e03131');
    ctx.fillStyle = '#212529'; rr(ctx, x - 18, y - 26, 36, 14, 6); ctx.fill();
    circle(ctx, x - 10, y - 19, 2.4, '#fcc419'); circle(ctx, x + 10, y - 19, 2.4, '#69db7c');
  }

  function grandClock(ctx, x, y, t) {
    shadow(ctx, x, y, 34, 7);
    ctx.fillStyle = '#7a4520'; rr(ctx, x - 26, y - 158, 52, 158, 8); ctx.fill();
    ctx.fillStyle = '#a0602e'; rr(ctx, x - 20, y - 152, 40, 40, 20); ctx.fill();
    circle(ctx, x, y - 132, 16, '#fff8e6');
    const d = new Date(), hA = ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * Math.PI * 2, mA = d.getMinutes() / 60 * Math.PI * 2;
    ctx.strokeStyle = '#212529'; ctx.lineCap = 'round';
    ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x, y - 132); ctx.lineTo(x + Math.sin(hA) * 8, y - 132 - Math.cos(hA) * 8); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y - 132); ctx.lineTo(x + Math.sin(mA) * 12, y - 132 - Math.cos(mA) * 12); ctx.stroke();
    ctx.fillStyle = '#3d2410'; rr(ctx, x - 16, y - 104, 32, 86, 4); ctx.fill();
    const a = Math.sin(t * 3) * 0.35;
    ctx.strokeStyle = '#fcc419'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 100); ctx.lineTo(x + Math.sin(a) * 56, y - 100 + Math.cos(a) * 56); ctx.stroke();
    circle(ctx, x + Math.sin(a) * 60, y - 100 + Math.cos(a) * 60, 7, '#fcc419');
  }

  function teddy(ctx, x, y) {
    shadow(ctx, x, y, 44, 8);
    const b = '#c47f3c', l = '#e8b46a';
    circle(ctx, x - 26, y - 14, 14, b); circle(ctx, x + 26, y - 14, 14, b);
    ctx.fillStyle = b; ctx.beginPath(); ctx.ellipse(x, y - 44, 34, 38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = l; ctx.beginPath(); ctx.ellipse(x, y - 38, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
    circle(ctx, x - 36, y - 56, 12, b); circle(ctx, x + 36, y - 56, 12, b);
    circle(ctx, x, y - 98, 28, b);
    circle(ctx, x - 22, y - 120, 11, b); circle(ctx, x + 22, y - 120, 11, b);
    circle(ctx, x - 22, y - 120, 6, l); circle(ctx, x + 22, y - 120, 6, l);
    ctx.fillStyle = l; ctx.beginPath(); ctx.ellipse(x, y - 88, 13, 10, 0, 0, Math.PI * 2); ctx.fill();
    circle(ctx, x - 10, y - 104, 3, '#111'); circle(ctx, x + 10, y - 104, 3, '#111');
    circle(ctx, x, y - 92, 4, '#3d2410');
    ctx.fillStyle = '#e64980';
    ctx.beginPath(); ctx.moveTo(x, y - 72); ctx.lineTo(x - 14, y - 80); ctx.lineTo(x - 14, y - 64); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y - 72); ctx.lineTo(x + 14, y - 80); ctx.lineTo(x + 14, y - 64); ctx.closePath(); ctx.fill();
  }

  function painting(ctx, x, y) {
    ctx.fillStyle = '#b07800'; rr(ctx, x - 62, y - 46, 124, 80, 4); ctx.fill();
    ctx.fillStyle = '#ffd43b'; rr(ctx, x - 58, y - 42, 116, 72, 3); ctx.fill();
    const g = ctx.createLinearGradient(0, y - 38, 0, y + 26);
    g.addColorStop(0, '#ffa94d'); g.addColorStop(1, '#ffe066');
    ctx.fillStyle = g; ctx.fillRect(x - 54, y - 38, 108, 64);
    circle(ctx, x + 20, y - 14, 12, '#fff3bf');
    ctx.fillStyle = '#5c940d'; ctx.beginPath(); ctx.moveTo(x - 54, y + 26); ctx.lineTo(x - 20, y - 8); ctx.lineTo(x + 8, y + 12); ctx.lineTo(x + 30, y - 2); ctx.lineTo(x + 54, y + 26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b8a3e'; ctx.beginPath(); ctx.moveTo(x - 54, y + 26); ctx.lineTo(x - 30, y + 6); ctx.lineTo(x - 6, y + 26); ctx.closePath(); ctx.fill();
  }

  function furRug(ctx, x, y) {
    ctx.fillStyle = '#e599f7'; ctx.beginPath(); ctx.ellipse(x, y, 92, 44, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f3d9fa'; ctx.beginPath(); ctx.ellipse(x, y, 74, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 86, y + Math.sin(a) * 40); ctx.lineTo(x + Math.cos(a) * 96, y + Math.sin(a) * 47); ctx.stroke(); }
  }

  function palmPot(ctx, x, y) {
    shadow(ctx, x, y, 28, 6);
    ctx.fillStyle = '#e8590c'; ctx.beginPath(); ctx.moveTo(x - 22, y - 34); ctx.lineTo(x + 22, y - 34); ctx.lineTo(x + 16, y); ctx.lineTo(x - 16, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a47148'; ctx.fillRect(x - 4, y - 96, 8, 64);
    ctx.fillStyle = '#2f9e44';
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI + k * (Math.PI / 6);
      ctx.save(); ctx.translate(x, y - 96); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(28, 4, 30, 7, 0.25, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function floorLamp(ctx, x, y) {
    shadow(ctx, x, y, 22, 5);
    ctx.fillStyle = '#495057'; ctx.beginPath(); ctx.ellipse(x, y - 3, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - 2, y - 120, 4, 118);
    ctx.fillStyle = '#fff3bf'; ctx.beginPath(); ctx.moveTo(x - 24, y - 112); ctx.lineTo(x + 24, y - 112); ctx.lineTo(x + 16, y - 146); ctx.lineTo(x - 16, y - 146); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,236,153,.35)'; ctx.beginPath(); ctx.ellipse(x, y - 108, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
  }

  return { bedBlanket, bathFront, diningPart, piano, aquarium, gameConsole, grandClock, teddy, painting, furRug, palmPot, floorLamp };
})());

/* Biển tên đường kiểu Hà Nội + bàn bi-a */
Object.assign(ART, (() => {
  const { rr, shadow, circle } = ART;

  /** Cột biển tên đường: mỗi tên một tấm biển xanh chữ trắng */
  function streetSign(ctx, x, y, names) {
    shadow(ctx, x, y, 14, 4);
    ctx.fillStyle = '#868e96'; ctx.fillRect(x - 3, y - 150, 6, 150);
    ctx.fillStyle = '#495057'; ctx.fillRect(x - 5, y - 6, 10, 6);
    names.forEach((nm, i) => {
      const py = y - 150 + i * 40;
      ctx.font = '900 15px "Be Vietnam Pro", system-ui, sans-serif';
      const w = Math.max(110, ctx.measureText(nm.toUpperCase()).width + 26);
      const px = i % 2 ? x - w + 14 : x - 14;
      ctx.fillStyle = '#0b3d91'; rr(ctx, px - 2, py - 2, w + 4, 36, 6); ctx.fill();
      ctx.fillStyle = '#1c5fc4'; rr(ctx, px, py, w, 32, 5); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; rr(ctx, px + 3, py + 3, w - 6, 26, 4); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '700 7.5px "Be Vietnam Pro", system-ui, sans-serif'; ctx.fillText('ĐƯỜNG', px + w / 2, py + 9);
      ctx.font = '900 13px "Be Vietnam Pro", system-ui, sans-serif'; ctx.fillText(nm.toUpperCase(), px + w / 2, py + 21);
    });
  }

  /** Bàn bi-a nhìn nghiêng, mặt nỉ xanh, có vài bi và gậy */
  function billiardTable(ctx, x, y) {
    shadow(ctx, x, y + 4, 160, 18);
    ctx.fillStyle = '#5c3010';
    [[-128, 0], [128, 0], [-128, -40], [128, -40]].forEach(([dx]) => { ctx.fillRect(x + dx - 7, y - 34, 14, 34); });
    ctx.fillStyle = '#7a4520'; rr(ctx, x - 150, y - 130, 300, 100, 14); ctx.fill();
    ctx.fillStyle = '#a0602e'; rr(ctx, x - 144, y - 126, 288, 90, 12); ctx.fill();
    const g = ctx.createLinearGradient(0, y - 116, 0, y - 46);
    g.addColorStop(0, '#2f9e44'); g.addColorStop(1, '#237a35');
    ctx.fillStyle = g; rr(ctx, x - 130, y - 116, 260, 70, 6); ctx.fill();
    [[-130, -116], [0, -118], [130, -116], [-130, -46], [0, -44], [130, -46]].forEach(([dx, dy]) => circle(ctx, x + dx, y + dy, 7, '#111'));
    [[60, -84, '#fcc419'], [72, -78, '#e03131'], [72, -90, '#1c7ed6'], [84, -84, '#7048e8'], [84, -72, '#2b8a3e'], [84, -96, '#fd7e14'], [-70, -80, '#fff']].forEach(([dx, dy, c]) => {
      circle(ctx, x + dx, y + dy, 5.5, c); circle(ctx, x + dx - 1.6, y + dy - 1.6, 1.6, 'rgba(255,255,255,.6)');
    });
    ctx.strokeStyle = '#c8874a'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 150, y - 40); ctx.lineTo(x - 82, y - 78); ctx.stroke();
    ctx.strokeStyle = '#212529'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 160, y - 34); ctx.lineTo(x - 140, y - 46); ctx.stroke();
  }

  return { streetSign, billiardTable };
})());

/* Chuồng heo kiểu quê: mái tôn, tường gạch, rơm, máng cám, vũng bùn */
Object.assign(ART, (() => {
  const { rr, shadow, circle, srand } = ART;

  function pigSty(ctx, x, y) {
    shadow(ctx, x, y + 2, 112, 14, 0.18);
    // tường gạch thấp 3 mặt
    ctx.fillStyle = '#b5543c'; ctx.fillRect(x - 100, y - 92, 200, 92);
    ctx.fillStyle = '#4a2a14'; ctx.fillRect(x - 86, y - 80, 172, 80);
    // rơm trong chuồng
    const r = srand(x * 3 + y);
    for (let i = 0; i < 70; i++) {
      ctx.strokeStyle = ['#e9c46a', '#d4a373', '#f4d58d'][i % 3]; ctx.lineWidth = 2;
      const sx = x - 82 + r() * 164, sy = y - 26 + r() * 24;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (r() - 0.5) * 16, sy - 4 - r() * 6); ctx.stroke();
    }
    // gạch
    ctx.strokeStyle = 'rgba(255,220,200,.35)'; ctx.lineWidth = 1;
    for (let row = 0; row < 7; row++) {
      const yy = y - 92 + row * 13;
      ctx.beginPath(); ctx.moveTo(x - 100, yy); ctx.lineTo(x - 86, yy); ctx.moveTo(x + 86, yy); ctx.lineTo(x + 100, yy); ctx.stroke();
    }
    ctx.fillStyle = '#c96a4f'; ctx.fillRect(x - 100, y - 18, 200, 18);
    ctx.strokeStyle = 'rgba(80,30,15,.4)';
    for (let k = 0; k < 10; k++) { ctx.beginPath(); ctx.moveTo(x - 100 + k * 20 + (k % 2) * 10, y - 18); ctx.lineTo(x - 100 + k * 20 + (k % 2) * 10, y); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - 100, y - 9); ctx.lineTo(x + 100, y - 9); ctx.stroke();
    // cột gỗ + mái tôn gợn sóng
    ctx.fillStyle = '#7a4520'; ctx.fillRect(x - 98, y - 132, 8, 50); ctx.fillRect(x + 90, y - 132, 8, 50);
    ctx.fillStyle = '#adb5bd';
    ctx.beginPath(); ctx.moveTo(x - 118, y - 96); ctx.lineTo(x - 104, y - 148); ctx.lineTo(x + 104, y - 148); ctx.lineTo(x + 118, y - 96); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#868e96'; ctx.lineWidth = 2;
    for (let k = -110; k <= 110; k += 9) { ctx.beginPath(); ctx.moveTo(x + k, y - 97); ctx.lineTo(x + k * 0.9, y - 147); ctx.stroke(); }
    ctx.fillStyle = 'rgba(160,82,45,.45)'; ctx.fillRect(x + 30, y - 140, 40, 20); ctx.fillRect(x - 80, y - 118, 24, 14);
    ctx.fillStyle = '#495057'; ctx.fillRect(x - 118, y - 98, 236, 5);
    // biển
    ctx.fillStyle = '#f8f0e3'; rr(ctx, x - 44, y - 78, 88, 20, 4); ctx.fill();
    ctx.strokeStyle = '#7a4520'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#c2255c'; ctx.font = '900 11px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🐷 CHUỒNG HEO', x, y - 67.5);
  }

  /** Vũng bùn cho heo lăn (vẽ dưới đất) */
  function mudPool(ctx, x, y, t) {
    ctx.fillStyle = '#6b4423'; ctx.beginPath(); ctx.ellipse(x, y, 84, 40, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.ellipse(x - 4, y - 2, 72, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(x - 26, y - 12, 22, 6, -0.2, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.4 + k / 4) % 1;
      ctx.strokeStyle = `rgba(60,35,15,${0.6 * (1 - p)})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x - 40 + k * 26, y + 6 - (k % 2) * 10, 3 + p * 8, 1.5 + p * 4, 0, 0, Math.PI * 2); ctx.stroke();
    }
    [[-70, 26], [62, 30], [78, -10], [-80, -6]].forEach(([dx, dy]) => { ctx.fillStyle = '#6b4423'; ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); });
  }

  /** Máng cám gỗ có cám, rau */
  function slopTrough(ctx, x, y) {
    shadow(ctx, x, y, 46, 7);
    ctx.fillStyle = '#7a4520'; rr(ctx, x - 44, y - 22, 88, 22, 4); ctx.fill();
    ctx.fillStyle = '#a0602e'; ctx.fillRect(x - 40, y - 22, 80, 5);
    ctx.fillStyle = '#d9c38a'; ctx.beginPath(); ctx.ellipse(x, y - 20, 38, 5, 0, 0, Math.PI * 2); ctx.fill();
    [[-24, '#69db7c'], [-6, '#ff922b'], [14, '#69db7c'], [28, '#f8f9fa']].forEach(([dx, c]) => circle(ctx, x + dx, y - 21, 3, c));
  }

  return { pigSty, mudPool, slopTrough };
})());

/* Bến xe buýt có mái che + ghế chờ, đồ trong lớp học */
Object.assign(ART, (() => {
  const { rr, shadow, circle } = ART;

  /** Nhà chờ xe buýt: mái che, vách kính có quảng cáo, ghế ngồi; cột biển trạm ở x + 39 (side -1: nhà chờ bên trái cột, 1: bên phải) */
  function busShelter(ctx, x, y, side = -1) {
    const L = side < 0 ? x - 170 : x + 70, R = side < 0 ? x + 20 : x + 260;
    shadow(ctx, (L + R) / 2, y, 110, 12, 0.16);
    // cột
    ctx.fillStyle = '#495057';
    [L + 6, R - 6].forEach((px) => ctx.fillRect(px - 4, y - 150, 8, 150));
    // vách kính phía sau
    ctx.fillStyle = 'rgba(165,216,255,.55)'; ctx.fillRect(L + 10, y - 138, R - L - 20, 100);
    ctx.strokeStyle = '#868e96'; ctx.lineWidth = 3; ctx.strokeRect(L + 10, y - 138, R - L - 20, 100);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(L + 20, y - 132, 10, 88); ctx.fillRect(L + 100, y - 132, 6, 88);
    // tấm quảng cáo
    const ax = L + 34, aw = 70;
    ctx.fillStyle = '#ff922b'; rr(ctx, ax, y - 128, aw, 76, 4); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '900 10px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('QUANG LÂM', ax + aw / 2, y - 116); ctx.fillText('BUS', ax + aw / 2, y - 104);
    ctx.font = '26px system-ui, "Segoe UI Emoji"'; ctx.fillStyle = '#000'; ctx.fillText('🚌', ax + aw / 2, y - 76);
    // bản đồ tuyến
    ctx.fillStyle = '#fff'; rr(ctx, L + 118, y - 126, 46, 56, 3); ctx.fill();
    ctx.strokeStyle = '#1c7ed6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(L + 124, y - 116); ctx.lineTo(L + 140, y - 100); ctx.lineTo(L + 132, y - 86); ctx.lineTo(L + 158, y - 76); ctx.stroke();
    [[124, -116], [140, -100], [132, -86], [158, -76]].forEach(([dx, dy]) => circle(ctx, L + dx, y + dy, 2.5, '#e03131'));
    // ghế ngồi chờ
    ctx.fillStyle = '#7a4520'; ctx.fillRect(L + 22, y - 30, 8, 30); ctx.fillRect(R - 30, y - 30, 8, 30);
    ctx.fillStyle = '#c8874a'; rr(ctx, L + 14, y - 36, R - L - 28, 9, 3); ctx.fill();
    ctx.fillStyle = '#a0602e'; rr(ctx, L + 14, y - 58, R - L - 28, 7, 3); ctx.fill();
    // mái che
    ctx.fillStyle = '#1971c2';
    ctx.beginPath(); ctx.moveTo(L - 12, y - 146); ctx.lineTo(R + 12, y - 146); ctx.lineTo(R + 4, y - 162); ctx.lineTo(L - 4, y - 162); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#74c0fc'; ctx.fillRect(L - 12, y - 148, R - L + 24, 4);
    ctx.fillStyle = '#fff'; ctx.font = '800 10px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillText('NHÀ CHỜ XE BUÝT', (L + R) / 2, y - 154);
    // cột biển trạm
    ctx.fillStyle = '#868e96'; ctx.fillRect(x + 36, y - 150, 6, 150);
    ctx.fillStyle = '#1c7ed6'; rr(ctx, x + 14, y - 172, 50, 40, 6); ctx.fill();
    ctx.font = '20px system-ui, "Segoe UI Emoji"'; ctx.fillStyle = '#000'; ctx.fillText('🚌', x + 39, y - 158);
    ctx.fillStyle = '#fff'; ctx.font = '800 7px "Be Vietnam Pro", system-ui, sans-serif'; ctx.fillText('TRẠM DỪNG', x + 39, y - 140);
    ctx.fillStyle = '#ffd43b'; rr(ctx, x + 18, y - 128, 42, 26, 3); ctx.fill();
    ctx.fillStyle = '#212529'; ctx.font = '800 7.5px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillText('QL01 · 32', x + 39, y - 120); ctx.fillText('34 · 49', x + 39, y - 109);
  }
  /** Mép ghế phía trước (vẽ đè lên người đang ngồi chờ) */
  function benchFront(ctx, x0, x1, y) {
    ctx.fillStyle = '#c8874a'; rr(ctx, x0, y - 36, x1 - x0, 9, 3); ctx.fill();
    ctx.fillStyle = '#a0602e'; ctx.fillRect(x0 + 2, y - 28, x1 - x0 - 4, 3);
  }

  /** Bàn học có ghế phía sau (ghế vẽ riêng để người ngồi lọt giữa) */
  function schoolChair(ctx, x, y) {
    ctx.fillStyle = '#4c6ef5'; rr(ctx, x - 16, y - 52, 32, 26, 4); ctx.fill();
    ctx.fillStyle = '#364fc7'; ctx.fillRect(x - 14, y - 26, 4, 18); ctx.fillRect(x + 10, y - 26, 4, 18);
  }

  function posterABC(g, x, y) {
    g.fillStyle = '#fff'; g.fillRect(x, y, 120, 80);
    g.strokeStyle = '#e8590c'; g.lineWidth = 4; g.strokeRect(x, y, 120, 80);
    g.font = '900 28px "Be Vietnam Pro", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['#e03131', '#2b8a3e', '#1c7ed6'].forEach((c, i) => { g.fillStyle = c; g.fillText('ABC'[i], x + 26 + i * 34, y + 32); });
    g.font = '700 11px "Be Vietnam Pro", system-ui, sans-serif'; g.fillStyle = '#495057'; g.fillText('Apple · Ball · Cat', x + 60, y + 62);
  }
  function posterMap(g, x, y) {
    g.fillStyle = '#d0ebff'; g.fillRect(x, y, 130, 80);
    g.strokeStyle = '#7a4520'; g.lineWidth = 4; g.strokeRect(x, y, 130, 80);
    g.fillStyle = '#69db7c';
    [[20, 20, 30, 18], [60, 14, 34, 26], [96, 36, 22, 20], [30, 48, 24, 18]].forEach(([dx, dy, w, h]) => { g.beginPath(); g.ellipse(x + dx + w / 2, y + dy + h / 2, w / 2, h / 2, 0.3, 0, Math.PI * 2); g.fill(); });
    g.font = '700 10px "Be Vietnam Pro", system-ui, sans-serif'; g.fillStyle = '#1864ab'; g.textAlign = 'center'; g.fillText('WORLD MAP', x + 65, y + 72);
  }

  return { busShelter, benchFront, schoolChair, posterABC, posterMap };
})());

/* Bảng tin nông trại bằng gỗ, ghim giấy */
Object.assign(ART, (() => {
  const { rr, shadow } = ART;
  function noticeBoard(ctx, x, y) {
    shadow(ctx, x, y, 60, 9);
    ctx.fillStyle = '#7a4520'; ctx.fillRect(x - 54, y - 120, 9, 120); ctx.fillRect(x + 45, y - 120, 9, 120);
    ctx.fillStyle = '#8b5a2b'; rr(ctx, x - 66, y - 150, 132, 96, 6); ctx.fill();
    ctx.fillStyle = '#d4a373'; rr(ctx, x - 59, y - 143, 118, 82, 4); ctx.fill();
    [[-48, -136, '#fff', -0.08], [-4, -138, '#fff3bf', 0.06], [-46, -100, '#ffe3e3', 0.05], [6, -102, '#e7f5ff', -0.05]].forEach(([dx, dy, c, a]) => {
      ctx.save(); ctx.translate(x + dx + 21, y + dy + 16); ctx.rotate(a);
      ctx.fillStyle = c; ctx.fillRect(-21, -16, 42, 32);
      ctx.fillStyle = 'rgba(60,40,20,.45)'; for (let k = 0; k < 4; k++) ctx.fillRect(-16, -10 + k * 7, 30 - (k % 2) * 8, 2);
      ctx.fillStyle = '#e03131'; ctx.beginPath(); ctx.arc(0, -14, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    ctx.fillStyle = '#5c3010'; rr(ctx, x - 50, y - 166, 100, 20, 5); ctx.fill();
    ctx.fillStyle = '#ffe066'; ctx.font = '900 11px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('📋 BẢNG TIN', x, y - 156);
  }
  return { noticeBoard };
})());

/* Dãy quán ăn uống trước cổng nông trại */
Object.assign(ART, (() => {
  const { rr, shadow, circle } = ART;
  const W = 210;

  /** Mặt tiền quán: biển hiệu, mái hiên sọc, quầy kính, cửa, ghế nhựa (quán Việt) hoặc bàn cà phê */
  function foodShop(ctx, x, y, o) {
    const L = x - W / 2;
    shadow(ctx, x, y + 2, W / 2 + 8, 12, 0.16);
    // thân quán
    ctx.fillStyle = o.wall; ctx.fillRect(L, y - 112, W, 112);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(L, y - 14, W, 14);
    ctx.fillStyle = o.trim; ctx.fillRect(L - 4, y - 116, W + 8, 6);
    // biển hiệu
    ctx.fillStyle = o.signBg; rr(ctx, L - 6, y - 158, W + 12, 44, 8); ctx.fill();
    ctx.strokeStyle = o.trim; ctx.lineWidth = 3; rr(ctx, L - 6, y - 158, W + 12, 44, 8); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = o.signFg; ctx.font = `900 ${o.nameSize || 18}px "Be Vietnam Pro", system-ui, sans-serif`;
    ctx.fillText(o.name, x + (o.logo ? 12 : 0), y - 141);
    if (o.sub) { ctx.font = '700 9px "Be Vietnam Pro", system-ui, sans-serif'; ctx.fillStyle = o.subFg || o.signFg; ctx.fillText(o.sub, x + (o.logo ? 12 : 0), y - 123); }
    if (o.logo) {
      circle(ctx, L + 18, y - 136, 15, o.logoBg || '#fff');
      ctx.font = '17px system-ui, "Segoe UI Emoji"'; ctx.fillStyle = '#000'; ctx.fillText(o.logo, L + 18, y - 135);
    }
    // mái hiên sọc + diềm lượn
    const n = 10, sw = (W + 16) / n;
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = o.awn[k % 2];
      ctx.beginPath(); ctx.moveTo(L - 8 + k * sw, y - 108); ctx.lineTo(L - 8 + (k + 1) * sw, y - 108); ctx.lineTo(L - 8 + (k + 1) * sw, y - 86);
      ctx.quadraticCurveTo(L - 8 + (k + 0.5) * sw, y - 76, L - 8 + k * sw, y - 86); ctx.closePath(); ctx.fill();
    }
    // quầy kính bên trái, cửa bên phải
    ctx.fillStyle = '#343a40'; rr(ctx, L + 12, y - 72, 116, 52, 4); ctx.fill();
    const gl = ctx.createLinearGradient(0, y - 70, 0, y - 22);
    gl.addColorStop(0, '#fff8e1'); gl.addColorStop(1, o.glass || '#ffe8a3');
    ctx.fillStyle = gl; rr(ctx, L + 15, y - 69, 110, 46, 3); ctx.fill();
    ctx.font = '19px system-ui, "Segoe UI Emoji"'; ctx.fillStyle = '#000';
    (o.items || []).slice(0, 3).forEach((ic, i) => ctx.fillText(ic, L + 36 + i * 34, y - 44));
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(L + 18, y - 67, 8, 40);
    ctx.fillStyle = o.trim; ctx.fillRect(L + 10, y - 22, 120, 6);
    ctx.fillStyle = '#5c3010'; rr(ctx, L + 140, y - 80, 56, 80, 4); ctx.fill();
    ctx.fillStyle = 'rgba(165,216,255,.7)'; rr(ctx, L + 146, y - 74, 44, 38, 3); ctx.fill();
    circle(ctx, L + 186, y - 36, 2.5, '#fcc419');
    ctx.fillStyle = '#fff'; rr(ctx, L + 150, y - 31, 36, 12, 3); ctx.fill();
    ctx.fillStyle = '#2b8a3e'; ctx.font = '800 7px "Be Vietnam Pro", system-ui, sans-serif'; ctx.fillText('MỞ CỬA', L + 168, y - 25);
    // trước quán: ghế nhựa (quán Việt) hoặc bàn tròn + dù (cà phê)
    if (o.deco === 'stools') {
      [[L - 2, '#1c7ed6'], [L + 206, '#e03131']].forEach(([sx, c]) => {
        ctx.fillStyle = c; rr(ctx, sx - 9, y - 18, 18, 6, 2); ctx.fill();
        ctx.fillRect(sx - 8, y - 12, 3, 12); ctx.fillRect(sx + 5, y - 12, 3, 12);
      });
    } else {
      ctx.fillStyle = '#868e96'; ctx.fillRect(L + 206, y - 70, 3, 70);
      ctx.fillStyle = o.awn[0];
      ctx.beginPath(); ctx.moveTo(L + 186, y - 64); ctx.quadraticCurveTo(L + 207, y - 82, L + 228, y - 64); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; rr(ctx, L + 196, y - 26, 24, 5, 2); ctx.fill();
      ctx.fillStyle = '#495057'; ctx.fillRect(L + 206, y - 21, 3, 21);
    }
  }

  return { foodShop, FOOD_W: W };
})());

/* Sạp hạt giống ở cổng nông trại: mái xanh, thúng rau củ, kệ hạt giống */
Object.assign(ART, (() => {
  const { rr, shadow, circle } = ART;
  function seedStall(ctx, x, y) {
    const L = x - 100, W = 200;
    shadow(ctx, x, y + 2, 108, 12, 0.16);
    ctx.fillStyle = '#a0602e'; ctx.fillRect(L + 6, y - 120, 8, 120); ctx.fillRect(L + W - 14, y - 120, 8, 120);
    // kệ hạt giống phía sau
    ctx.fillStyle = '#c8874a'; ctx.fillRect(L + 18, y - 104, W - 36, 50);
    ['#ffd43b', '#ff8787', '#69db7c', '#74c0fc', '#ffa94d', '#da77f2', '#ffe066', '#63e6be'].forEach((c, i) => {
      const px = L + 26 + (i % 4) * 40, py = y - 100 + Math.floor(i / 4) * 24;
      ctx.fillStyle = c; rr(ctx, px, py, 28, 20, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(px + 4, py + 4, 20, 4);
    });
    // quầy + thúng rau
    ctx.fillStyle = '#8b5a2b'; rr(ctx, L, y - 50, W, 50, 6); ctx.fill();
    ctx.fillStyle = '#a0602e'; ctx.fillRect(L, y - 50, W, 8);
    ctx.font = '20px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    [['🥕', -66], ['🌽', -22], ['🍅', 22], ['🌱', 66]].forEach(([ic, dx]) => {
      ctx.fillStyle = '#d4a373'; ctx.beginPath(); ctx.ellipse(x + dx, y - 50, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.fillText(ic, x + dx, y - 58);
    });
    // mái sọc xanh lá
    const n = 8, sw = (W + 24) / n;
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = k % 2 ? '#fff' : '#2f9e44';
      ctx.beginPath(); ctx.moveTo(L - 12 + k * sw, y - 140); ctx.lineTo(L - 12 + (k + 1) * sw, y - 140); ctx.lineTo(L - 12 + (k + 1) * sw, y - 116);
      ctx.quadraticCurveTo(L - 12 + (k + 0.5) * sw, y - 106, L - 12 + k * sw, y - 116); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#2b8a3e'; rr(ctx, L + 10, y - 176, W - 20, 36, 8); ctx.fill();
    ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 3; rr(ctx, L + 10, y - 176, W - 20, 36, 8); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '900 14px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.fillText('🌱 CỬA HÀNG', x, y - 164);
    ctx.font = '700 8.5px "Be Vietnam Pro", system-ui, sans-serif'; ctx.fillStyle = '#ffe066';
    ctx.fillText('HẠT GIỐNG · THU MUA NÔNG SẢN', x, y - 150);
  }
  return { seedStall };
})());

/* Ổ rơm cho gà đẻ (thay chuồng gà) */
Object.assign(ART, (() => {
  const { rr, shadow, circle, srand } = ART;
  function henNest(ctx, x, y) {
    shadow(ctx, x, y, 70, 12);
    ctx.fillStyle = '#8b5a2b'; rr(ctx, x - 62, y - 34, 124, 34, 6); ctx.fill();
    ctx.fillStyle = '#a0602e'; ctx.fillRect(x - 62, y - 34, 124, 6);
    ctx.strokeStyle = 'rgba(70,40,15,.4)'; ctx.lineWidth = 2;
    [-20, 20].forEach((dx) => { ctx.beginPath(); ctx.moveTo(x + dx, y - 30); ctx.lineTo(x + dx, y); ctx.stroke(); });
    const r = srand(x + y);
    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = ['#e9c46a', '#d4a373', '#f4d58d'][i % 3]; ctx.lineWidth = 2;
      const sx = x - 58 + r() * 116, sy = y - 40 + r() * 10;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (r() - 0.5) * 14, sy - 4 - r() * 6); ctx.stroke();
    }
    [[-34, -44], [-12, -46], [14, -45], [36, -43]].forEach(([dx, dy]) => {
      ctx.fillStyle = '#fff8e6'; ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.beginPath(); ctx.ellipse(x + dx + 2, y + dy + 3, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#fff3bf'; rr(ctx, x - 26, y - 76, 52, 18, 4); ctx.fill();
    ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#5c3010'; ctx.font = '900 10px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🥚 Ổ GÀ', x, y - 66.5);
  }
  return { henNest };
})());
