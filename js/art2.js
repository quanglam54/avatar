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

  function pickup(ctx, x, y, icon, t) {
    const b = Math.sin(t * 3 + x) * 2;
    shadow(ctx, x, y, 9, 3);
    ctx.font = '22px system-ui, "Segoe UI Emoji", sans-serif';
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
    ctx.font = '800 12px "Be Vietnam Pro", system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = Math.max(44, ctx.measureText(text).width + 18);
    const bg = kind === 'me' ? '#ffb547' : kind === 'npc' ? '#efe2bf' : '#f6c77e';
    ctx.fillStyle = '#5a3010';
    rr(ctx, x - w / 2 - 2, y - 2, w + 4, 22, 6); ctx.fill();
    ctx.fillStyle = bg;
    rr(ctx, x - w / 2, y, w, 18, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - w / 2 + 4, y + 2, w - 8, 3);
    ctx.fillStyle = '#7a4316'; circle(ctx, x - w / 2 + 5, y + 9, 1.6, '#7a4316'); circle(ctx, x + w / 2 - 5, y + 9, 1.6, '#7a4316');
    ctx.fillStyle = '#3d1f08';
    ctx.fillText(text, x, y + 9.5);
    if (kind === 'me') {
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath(); ctx.moveTo(x - 6, y + 26); ctx.lineTo(x + 6, y + 26); ctx.lineTo(x, y + 34); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 1.5; ctx.stroke();
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
    const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
    const text = `${m}:${String(s).padStart(2, '0')}`;
    ctx.fillStyle = '#3d2410';
    rr(ctx, x - 25, y + 6, 50, 9, 3); ctx.fill();
    ctx.fillStyle = '#ff6b3d';
    rr(ctx, x - 23, y + 8, 46 * Math.min(1, p), 5, 2); ctx.fill();
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

  function bed(ctx, bx, by, unlocked, price, tiles, t) {
    ctx.fillStyle = '#2f7a1c';
    rr(ctx, bx - 3, by - 3, BED.w + 6, BED.h + 9, 10); ctx.fill();
    ctx.fillStyle = '#4fb32c';
    rr(ctx, bx, by, BED.w, BED.h, 8); ctx.fill();
    if (!unlocked) {
      ctx.fillStyle = '#6fd043'; rr(ctx, bx + 6, by + 6, BED.w - 12, BED.h - 14, 6); ctx.fill();
      const cx = bx + BED.w / 2, cy = by + BED.h / 2;
      ctx.fillStyle = '#7a4a2c'; ctx.fillRect(cx - 2, cy - 6, 4, 30);
      ctx.fillStyle = '#e8b46a'; rr(ctx, cx - 30, cy - 26, 60, 26, 5); ctx.fill();
      ctx.strokeStyle = '#7a4a2c'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = '900 13px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#5c3010'; ctx.fillText('MUA', cx, cy - 13);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(40,30,20,.75)'; ctx.fillStyle = '#fff';
      ctx.strokeText(price + ' xu', cx, by + BED.h - 12); ctx.fillText(price + ' xu', cx, by + BED.h - 12);
      return;
    }
    tiles.forEach((tile, k) => {
      const tx = bx + BED.padX + (k % 6) * BED.step, ty = by + BED.padY + Math.floor(k / 6) * BED.step;
      ctx.fillStyle = '#a07a48';
      rr(ctx, tx, ty + 2, BED.tile, BED.tile, 4); ctx.fill();
      ctx.fillStyle = tile.st.thirsty ? '#cdb27a' : '#d8bd86';
      rr(ctx, tx, ty, BED.tile, BED.tile, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(120,85,40,.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(tx + 6, ty + 14); ctx.lineTo(tx + BED.tile - 6, ty + 14); ctx.moveTo(tx + 6, ty + 28); ctx.lineTo(tx + BED.tile - 6, ty + 28); ctx.stroke();
      if (tile.crop) {
        ctx.save();
        ctx.translate(tx + BED.tile / 2, ty + BED.tile - 6);
        ctx.scale(1.55, 1.55);
        ART.plant(ctx, 0, 0, tile.crop, tile.st.stage, t + k * 0.7);
        ctx.restore();
      }
      if (tile.st.thirsty) {
        const bob = Math.sin(t * 4 + k) * 1.5;
        circle(ctx, tx + BED.tile / 2, ty - 6 + bob, 9, '#fff');
        ctx.font = '12px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
        ctx.fillText('😟', tx + BED.tile / 2, ty - 5.5 + bob);
      } else if (tile.st.stage === 2) {
        const tw = (Math.sin(t * 5 + k * 1.3) + 1) / 2;
        ctx.fillStyle = `rgba(255,255,200,${tw})`;
        circle(ctx, tx + BED.tile - 7, ty + 6, 2.2, ctx.fillStyle);
      }
    });
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

  return { blackboard, desk, podium, flagPole, fishingRod, biteMark, stonePath, BED, bed, roseHedge, scarecrow, doorArrow, nightSky, fireflies, shed, kitchen, timerLabel, backdrop, cloud, woodFence, tulips, namePlate, pet, flowerPot, palm, umbrella, pickup, seaWaves, lake, dock, building, ferrisWheel, stage, gameTable, iceCart, signBoard, swing };
})());
