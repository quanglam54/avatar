/* Vẽ toàn bộ hình ảnh bằng canvas — không dùng file ảnh ngoài */
const ART = (() => {
  function srand(seed) {
    let s = Math.abs(Math.floor(seed)) % 2147483646 + 1;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function shadow(ctx, x, y, rx, ry, a = 0.18) {
    if (typeof ART_CAPTURE !== 'undefined' && ART_CAPTURE) {
      // đang vẽ sprite có viền: ghi lại bóng để vẽ riêng, tránh bị viền bao quanh
      const m = ctx.getTransform();
      ART_CAPTURE.push([m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f, Math.abs(rx * m.a), Math.abs(ry * m.d), a]);
      return;
    }
    ctx.fillStyle = `rgba(0,0,0,${a})`;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function circle(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function label(ctx, text, x, y, size = 15) {
    ctx.font = `800 ${size}px "Be Vietnam Pro", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(30,30,40,.75)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x, y);
  }

  function bubble(ctx, text, x, y, big = false) {
    ctx.font = big ? '30px system-ui, "Segoe UI Emoji", sans-serif' : '600 14px "Be Vietnam Pro", system-ui, sans-serif';
    const lines = wrap(ctx, text, 180);
    const lh = big ? 34 : 18;
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 22;
    const h = lines.length * lh + 14;
    const bx = x - w / 2, by = y - h - 10;
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    rr(ctx, bx + 2, by + 3, w, h, 12); ctx.fill();
    ctx.fillStyle = '#fff';
    rr(ctx, bx, by, w, h, 12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 7, by + h - 1); ctx.lineTo(x, by + h + 9); ctx.lineTo(x + 7, by + h - 1); ctx.fill();
    ctx.fillStyle = '#1f2433';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, x, by + 7 + lh / 2 + i * lh));
  }

  function wrap(ctx, text, max) {
    const words = String(text).split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > max && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 4);
  }

  function iconBubble(ctx, icon, x, y, pulse = 0) {
    const s = 1 + Math.sin(pulse * 5) * 0.06;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,.15)';
    ctx.beginPath(); ctx.arc(1, 2, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-6, 14); ctx.lineTo(0, 24); ctx.lineTo(6, 14); ctx.fill();
    ctx.font = '19px system-ui, "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 0, 1);
    ctx.restore();
  }

  /* ---------------- Nhân vật ---------------- */
  function character(ctx, x, y, look, o = {}) {
    const s = o.scale ?? 1.18;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    characterBase(ctx, 0, 0, look, o);
    ctx.restore();
  }

  function characterBase(ctx, x, y, look, o) {
    const t = o.t || 0;
    const dir = o.dance ? (Math.sin(t * 4) > 0 ? 1 : -1) : (o.dir || 1);
    const swing = o.dance ? Math.sin(t * 14) * 8 : o.moving ? Math.sin(t * 12) * 4 : 0;
    const bob = o.dance ? Math.abs(Math.sin(t * 7)) * 10 : o.moving ? Math.abs(Math.sin(t * 12)) * 2 : Math.sin(t * 2) * 0.6;
    shadow(ctx, x, y, 15, 5);
    ctx.save();
    ctx.translate(x, y - bob);

    const hairBack = look.hair === 'long' || look.hair === 'pigtails';
    if (hairBack) {
      ctx.fillStyle = look.hairColor;
      if (look.hair === 'long') { rr(ctx, -21, -62, 42, 44, 14); ctx.fill(); }
      else { circle(ctx, -22, -48, 9, look.hairColor); circle(ctx, 22, -48, 9, look.hairColor); }
    }

    cape(ctx, look);

    // chân
    const lLift = Math.max(0, swing) * 0.6, rLift = Math.max(0, -swing) * 0.6;
    ctx.fillStyle = look.pants;
    rr(ctx, -9, -17 - lLift, 8, 14, 3); ctx.fill();
    rr(ctx, 1, -17 - rLift, 8, 14, 3); ctx.fill();
    ctx.fillStyle = '#3a2f2a';
    ctx.beginPath(); ctx.ellipse(-5, -3 - lLift, 5.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -3 - rLift, 5.5, 3, 0, 0, Math.PI * 2); ctx.fill();

    // tay
    ctx.fillStyle = look.shirt;
    rr(ctx, -17, -35 + swing * 0.4, 7, 13, 3); ctx.fill();
    rr(ctx, 10, -35 - swing * 0.4, 7, 13, 3); ctx.fill();
    circle(ctx, -13.5, -21 + swing * 0.4, 4, look.skin);
    circle(ctx, 13.5, -21 - swing * 0.4, 4, look.skin);

    // thân áo
    ctx.fillStyle = look.shirt;
    rr(ctx, -12, -37, 24, 23, 8); ctx.fill();
    ctx.save();
    rr(ctx, -12, -37, 24, 23, 8); ctx.clip();
    shirtStyle(ctx, look.shirtStyle);
    ctx.restore();
    skirt(ctx, look);

    // đầu
    circle(ctx, -18, -53, 4.5, look.skin);
    circle(ctx, 18, -53, 4.5, look.skin);
    circle(ctx, 0, -55, 19, look.skin);
    ctx.fillStyle = 'rgba(0,0,0,.05)';
    ctx.beginPath(); ctx.arc(0, -55, 19, 0.2, Math.PI - 0.2); ctx.fill();

    // mặt
    const ex = dir * 2;
    ctx.fillStyle = '#2b2b33';
    ctx.beginPath(); ctx.ellipse(-6 + ex, -53, 2.4, 3.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(6 + ex, -53, 2.4, 3.2, 0, 0, Math.PI * 2); ctx.fill();
    circle(ctx, -5.3 + ex, -54.2, 0.9, '#fff');
    circle(ctx, 6.7 + ex, -54.2, 0.9, '#fff');
    ctx.fillStyle = 'rgba(255,120,140,.45)';
    ctx.beginPath(); ctx.ellipse(-10 + ex, -47, 3.6, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10 + ex, -47, 3.6, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a3b2e'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(ex, -47, 3, 0.2, Math.PI - 0.2); ctx.stroke();

    hairFront(ctx, look);
    accessory(ctx, look.acc, ex, look.skin);
    hat(ctx, look.hat, dir);
    ctx.restore();
  }

  /** Áo choàng ma cà rồng: vạt choàng đen viền đỏ phía sau người */
  function cape(ctx, look) {
    if (look.shirtStyle !== 'vampire') return;
    ctx.fillStyle = '#1b1b24';
    ctx.beginPath(); ctx.moveTo(-14, -40); ctx.lineTo(14, -40); ctx.lineTo(22, -2); ctx.quadraticCurveTo(0, 4, -22, -2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c92a2a';
    ctx.beginPath(); ctx.moveTo(-12, -38); ctx.lineTo(12, -38); ctx.lineTo(18, -4); ctx.quadraticCurveTo(0, 1, -18, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1b1b24';
    ctx.beginPath(); ctx.moveTo(-16, -42); ctx.lineTo(-22, -54); ctx.lineTo(-8, -40); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(16, -42); ctx.lineTo(22, -54); ctx.lineTo(8, -40); ctx.closePath(); ctx.fill();
  }

  function witchSkirt(ctx, look) {
    ctx.fillStyle = '#5f3dc4';
    ctx.beginPath(); ctx.moveTo(-11, -18); ctx.lineTo(11, -18); ctx.lineTo(19, -4);
    for (let i = 1; i <= 6; i++) ctx.lineTo(19 - i * 6.33, i % 2 ? 1 : -5);
    ctx.lineTo(-19, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fd7e14'; ctx.fillRect(-11, -19, 22, 3);
    [[-7, -11], [6, -9]].forEach(([sx, sy]) => star(ctx, sx, sy, 3, 1.3, '#ffd43b'));
  }

  /** Chân váy cho các kiểu váy (vẽ đè lên phần trên của chân) */
  function skirt(ctx, look) {
    const st = look.shirtStyle;
    if (st === 'witchdress') return witchSkirt(ctx, look);
    if (st !== 'dress' && st !== 'dress_flower' && st !== 'princess') return;
    const wide = st === 'princess' ? 24 : 17;
    ctx.fillStyle = look.shirt;
    ctx.beginPath(); ctx.moveTo(-11, -18); ctx.lineTo(11, -18); ctx.lineTo(wide, -5); ctx.quadraticCurveTo(0, 0, -wide, -5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.moveTo(-wide, -5); ctx.quadraticCurveTo(0, 0, wide, -5); ctx.lineTo(wide - 1, -7); ctx.quadraticCurveTo(0, -2, -wide + 1, -7); ctx.closePath(); ctx.fill();
    if (st === 'dress_flower') {
      [[-8, -10], [0, -13], [8, -9], [-3, -6], [5, -6]].forEach(([fx, fy], i) => circle(ctx, fx, fy, 1.8, ['#fff', '#ffe066', '#ff8fab'][i % 3]));
    } else if (st === 'princess') {
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      for (let k = -wide + 3; k < wide - 2; k += 6) { ctx.beginPath(); ctx.arc(k, -5, 3, 0, Math.PI); ctx.fill(); }
      ART.star(ctx, 0, -29, 4, 1.8, '#fff3bf');
    }
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-11, -19, 22, 2);
  }

  /** Trang sức: bông tai, dây chuyền, ngọc trai, kính */
  function accessory(ctx, acc, ex, skin) {
    if (!acc || acc === 'none') return;
    if (acc === 'earrings') {
      [-18, 18].forEach((dx) => { circle(ctx, dx, -48, 2.4, '#fcc419'); circle(ctx, dx, -44, 1.6, '#e64980'); });
    } else if (acc === 'necklace' || acc === 'pearl') {
      ctx.strokeStyle = acc === 'pearl' ? '#f8f9fa' : '#fcc419'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, -38, 8, 0.25, Math.PI - 0.25); ctx.stroke();
      if (acc === 'pearl') for (let k = 0; k < 7; k++) { const a = 0.35 + k * (Math.PI - 0.7) / 6; circle(ctx, Math.cos(a) * 8, -38 + Math.sin(a) * 8, 1.6, '#fff'); }
      else { ctx.fillStyle = '#e03131'; ctx.beginPath(); ctx.moveTo(0, -27); ctx.lineTo(3, -30); ctx.lineTo(0, -33); ctx.lineTo(-3, -30); ctx.closePath(); ctx.fill(); }
    } else if (acc === 'glasses' || acc === 'sunglasses') {
      const dark = acc === 'sunglasses';
      ctx.strokeStyle = '#212529'; ctx.lineWidth = 1.6;
      ctx.fillStyle = dark ? 'rgba(20,20,30,.88)' : 'rgba(200,230,255,.35)';
      [-6, 6].forEach((dx) => { ctx.beginPath(); ctx.arc(dx + ex, -53, 4.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(-1.4 + ex, -53); ctx.lineTo(1.4 + ex, -53); ctx.moveTo(-10.6 + ex, -54); ctx.lineTo(-17, -55); ctx.moveTo(10.6 + ex, -54); ctx.lineTo(17, -55); ctx.stroke();
      if (dark) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-8 + ex, -55.5, 2, 1.5); ctx.fillRect(4 + ex, -55.5, 2, 1.5); }
    }
  }

  function shirtStyle(ctx, style) {
    if (style === 'stripes') {
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (let y = -35; y < -14; y += 6) ctx.fillRect(-14, y, 28, 2.5);
    } else if (style === 'star') {
      star(ctx, 0, -26, 6, 2.6, '#ffd43b');
    } else if (style === 'heart') {
      heart(ctx, 0, -27, 6, '#ff4d6d');
    } else if (style === 'overall') {
      ctx.fillStyle = '#3b6fd8';
      rr(ctx, -9, -29, 18, 16, 3); ctx.fill();
      ctx.fillRect(-9, -38, 3, 10); ctx.fillRect(6, -38, 3, 10);
      circle(ctx, -7.5, -29, 1.6, '#ffd43b'); circle(ctx, 7.5, -29, 1.6, '#ffd43b');
    }
  }

  function star(ctx, x, y, R, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R;
      ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill();
  }

  function heart(ctx, x, y, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.3, x, y - s * 0.4);
    ctx.bezierCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
    ctx.fill();
  }

  function hairFront(ctx, look) {
    const c = look.hairColor;
    ctx.fillStyle = c;
    if (look.hair === 'bald') {
      ctx.strokeStyle = c; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(2, -76, 4, Math.PI * 0.9, Math.PI * 2.2); ctx.stroke();
      return;
    }
    // phần mái chung
    ctx.beginPath();
    ctx.arc(0, -57, 20.5, Math.PI * 1.02, Math.PI * 1.98);
    let x = 20;
    ctx.lineTo(x, -58);
    while (x > -20) { ctx.quadraticCurveTo(x - 4, -54, x - 8, -59); x -= 8; }
    ctx.closePath();
    ctx.fill();
    if (look.hair === 'spiky') {
      // tóc anime dựng tua tủa kiểu Avatar
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1.05 + i * 0.112);
        const bx = Math.cos(a) * 17, by = -58 + Math.sin(a) * 17;
        const tx = Math.cos(a) * 31, ty = -58 + Math.sin(a) * 29 - 4;
        const nx = -Math.sin(a) * 7, ny = Math.cos(a) * 7;
        ctx.beginPath(); ctx.moveTo(bx - nx, by - ny); ctx.lineTo(tx, ty); ctx.lineTo(bx + nx, by + ny); ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(-4, -66); ctx.lineTo(-10, -48); ctx.lineTo(2, -60); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, -66); ctx.lineTo(13, -50); ctx.lineTo(14, -62); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-19, -62); ctx.lineTo(-23, -44); ctx.lineTo(-14, -56); ctx.fill();
      ctx.beginPath(); ctx.moveTo(19, -62); ctx.lineTo(23, -44); ctx.lineTo(14, -56); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      ctx.beginPath(); ctx.ellipse(-6, -70, 7, 3, -0.4, 0, Math.PI * 2); ctx.fill();
    } else if (look.hair === 'bun') {
      circle(ctx, 0, -79, 9, c);
    } else if (look.hair === 'long') {
      rr(ctx, -21, -60, 7, 30, 4); ctx.fill();
      rr(ctx, 14, -60, 7, 30, 4); ctx.fill();
    } else if (look.hair === 'pigtails') {
      circle(ctx, -15, -68, 4, '#ff6b9a'); circle(ctx, 15, -68, 4, '#ff6b9a');
    }
  }

  function hat(ctx, h, dir) {
    if (!h || h === 'none') return;
    if (h === 'cap') {
      ctx.fillStyle = '#e03131';
      ctx.beginPath(); ctx.arc(0, -63, 19, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#c92a2a';
      ctx.beginPath(); ctx.ellipse(dir * 15, -63, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
      circle(ctx, 0, -82, 2.5, '#c92a2a');
      ctx.fillStyle = '#fff'; ctx.font = '800 10px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Z', 0, -70);
    } else if (h === 'nonla') {
      ctx.fillStyle = '#ead7a0';
      ctx.beginPath(); ctx.moveTo(-32, -62); ctx.lineTo(0, -96); ctx.lineTo(32, -62); ctx.quadraticCurveTo(0, -56, -32, -62); ctx.fill();
      ctx.strokeStyle = 'rgba(150,110,50,.45)'; ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(-32 * i / 4, -62 - 34 * (1 - i / 4) - 0); ctx.lineTo(32 * i / 4, -62 - 34 * (1 - i / 4)); ctx.stroke();
      }
      ctx.strokeStyle = '#b08a4a'; ctx.beginPath(); ctx.moveTo(-14, -60); ctx.quadraticCurveTo(0, -30, 14, -60); ctx.stroke();
    } else if (h === 'beanie') {
      ctx.fillStyle = '#4c6ef5';
      ctx.beginPath(); ctx.arc(0, -62, 19.5, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#364fc7'; rr(ctx, -20, -66, 40, 8, 4); ctx.fill();
      circle(ctx, 0, -84, 6, '#fff');
    } else if (h === 'bow') {
      ctx.fillStyle = '#ff4d8d';
      ctx.beginPath(); ctx.moveTo(12, -72); ctx.lineTo(0, -80); ctx.lineTo(0, -64); ctx.fill();
      ctx.beginPath(); ctx.moveTo(12, -72); ctx.lineTo(24, -80); ctx.lineTo(24, -64); ctx.fill();
      circle(ctx, 12, -72, 4, '#d6336c');
    } else if (h === 'flower') {
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5;
        circle(ctx, -13 + Math.cos(a) * 5, -70 + Math.sin(a) * 5, 4.2, '#fff');
      }
      circle(ctx, -13, -70, 3.5, '#fcc419');
    } else if (h === 'beret') {
      ctx.fillStyle = '#c92a2a';
      ctx.beginPath(); ctx.ellipse(dir * 4, -71, 21, 9, dir * -0.15, 0, Math.PI * 2); ctx.fill();
      circle(ctx, dir * 4, -80, 2.5, '#a61e1e');
    } else if (h === 'party') {
      ctx.fillStyle = '#7048e8';
      ctx.beginPath(); ctx.moveTo(-12, -70); ctx.lineTo(4, -104); ctx.lineTo(14, -68); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd43b'; [[-4, -78], [5, -88], [6, -76]].forEach(([dx, dy]) => circle(ctx, dx, dy, 2.2, '#ffd43b'));
      circle(ctx, 4, -106, 4.5, '#ff6b9a');
    } else if (h === 'bunny') {
      ctx.fillStyle = '#f8f9fa';
      ctx.beginPath(); ctx.ellipse(-9, -90, 6, 17, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(9, -90, 6, 17, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffc9c9';
      ctx.beginPath(); ctx.ellipse(-9, -89, 2.8, 11, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(9, -89, 2.8, 11, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ff8fab'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -57, 20, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else if (h === 'cowboy') {
      ctx.fillStyle = '#8a4b22';
      ctx.beginPath(); ctx.ellipse(0, -68, 32, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-16, -68); ctx.quadraticCurveTo(-18, -92, -6, -88); ctx.quadraticCurveTo(0, -84, 6, -88); ctx.quadraticCurveTo(18, -92, 16, -68); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5c3214'; ctx.fillRect(-16, -74, 32, 4);
      ctx.fillStyle = '#c98a4b'; ctx.beginPath(); ctx.ellipse(-24, -70, 7, 2.5, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(24, -70, 7, 2.5, 0.3, 0, Math.PI * 2); ctx.fill();
    } else if (h === 'tiara') {
      ctx.fillStyle = '#ced4da';
      ctx.beginPath(); ctx.moveTo(-14, -72); ctx.lineTo(-9, -80); ctx.lineTo(-4, -75); ctx.lineTo(0, -86); ctx.lineTo(4, -75); ctx.lineTo(9, -80); ctx.lineTo(14, -72); ctx.closePath(); ctx.fill();
      circle(ctx, 0, -80, 2.4, '#e64980'); circle(ctx, -9, -77, 1.6, '#74c0fc'); circle(ctx, 9, -77, 1.6, '#74c0fc');
    } else if (h === 'witch') {
      ctx.fillStyle = '#2b2140';
      ctx.beginPath(); ctx.ellipse(0, -68, 30, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-15, -70); ctx.quadraticCurveTo(-6, -92, dir * 14, -108); ctx.quadraticCurveTo(6, -90, 15, -70); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fd7e14'; ctx.fillRect(-15, -76, 30, 5);
      ctx.fillStyle = '#ffd43b'; ctx.fillRect(-4, -77, 8, 7); ctx.fillStyle = '#2b2140'; ctx.fillRect(-2, -75, 4, 3);
    } else if (h === 'pumpkinhead') {
      ctx.fillStyle = '#e8590c';
      ctx.beginPath(); ctx.ellipse(0, -58, 24, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fd7e14';
      [-12, 0, 12].forEach((dx) => { ctx.beginPath(); ctx.ellipse(dx, -58, 9, 21, 0, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = '#5c940d'; ctx.fillRect(-2, -86, 5, 9);
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath(); ctx.moveTo(-12, -64); ctx.lineTo(-5, -64); ctx.lineTo(-8.5, -70); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5, -64); ctx.lineTo(12, -64); ctx.lineTo(8.5, -70); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-12, -52); ctx.lineTo(12, -52); ctx.lineTo(8, -46); ctx.lineTo(4, -49); ctx.lineTo(0, -45); ctx.lineTo(-4, -49); ctx.lineTo(-8, -46); ctx.closePath(); ctx.fill();
    } else if (h === 'crown') {
      ctx.fillStyle = '#fcc419';
      ctx.beginPath();
      ctx.moveTo(-15, -70); ctx.lineTo(-15, -86); ctx.lineTo(-8, -78); ctx.lineTo(0, -90); ctx.lineTo(8, -78); ctx.lineTo(15, -86); ctx.lineTo(15, -70);
      ctx.closePath(); ctx.fill();
      circle(ctx, 0, -77, 2.6, '#e03131'); circle(ctx, -9, -74, 2, '#4dabf7'); circle(ctx, 9, -74, 2, '#51cf66');
    }
  }

  /* ---------------- Động vật ---------------- */
  function chicken(ctx, x, y, dir, t, moving, peck) {
    shadow(ctx, x, y, 12, 4);
    const hop = moving ? Math.abs(Math.sin(t * 14)) * 2 : 0;
    const p = peck ? Math.max(0, Math.sin(t * 9)) * 6 : 0;
    ctx.save();
    ctx.translate(x, y - hop);
    ctx.scale(dir, 1);
    ctx.strokeStyle = '#f08c00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-3, -6); ctx.lineTo(-4, 0); ctx.moveTo(3, -6); ctx.lineTo(4, 0); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-10, -14); ctx.lineTo(-17, -24); ctx.lineTo(-7, -19); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -13, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9ecef';
    ctx.beginPath(); ctx.ellipse(-2, -12, 6, 4, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(8, -22 + p, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fa5252';
    circle(ctx, 7, -29 + p, 2.6, '#fa5252'); circle(ctx, 10, -28.5 + p, 2.2, '#fa5252');
    ctx.fillStyle = '#ff922b';
    ctx.beginPath(); ctx.moveTo(13, -23 + p); ctx.lineTo(18, -21 + p); ctx.lineTo(13, -19 + p); ctx.fill();
    circle(ctx, 9.5, -23.5 + p, 1.2, '#222');
    ctx.restore();
  }

  function legs4(ctx, t, moving, color, xs, top, h) {
    ctx.fillStyle = color;
    xs.forEach((lx, i) => {
      const lift = moving ? Math.max(0, Math.sin(t * 8 + i * Math.PI / 2)) * 3 : 0;
      rr(ctx, lx - 3, top - lift, 6, h, 2); ctx.fill();
    });
  }

  function cow(ctx, x, y, dir, t, moving, seed) {
    shadow(ctx, x, y, 30, 7);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    legs4(ctx, t, moving, '#f1f3f5', [-18, -9, 10, 19], -16, 16);
    ctx.fillStyle = '#495057';
    [-18, -9, 10, 19].forEach((lx) => { ctx.fillRect(lx - 3, -3, 6, 3); });
    ctx.fillStyle = '#fff';
    rr(ctx, -28, -40, 56, 28, 13); ctx.fill();
    const r = srand(seed);
    ctx.fillStyle = '#212529';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(-18 + r() * 34, -34 + r() * 16, 5 + r() * 5, 4 + r() * 4, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-27, -34); ctx.quadraticCurveTo(-34, -26 + Math.sin(t * 3) * 3, -32, -16); ctx.stroke();
    // đầu
    ctx.fillStyle = '#fff';
    rr(ctx, 20, -50, 22, 24, 9); ctx.fill();
    ctx.fillStyle = '#212529';
    ctx.beginPath(); ctx.ellipse(25, -45, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffc9c9';
    rr(ctx, 24, -35, 20, 11, 5); ctx.fill();
    circle(ctx, 30, -30, 1.5, '#c2255c'); circle(ctx, 38, -30, 1.5, '#c2255c');
    circle(ctx, 34, -44, 2, '#222');
    ctx.fillStyle = '#f1f3f5';
    ctx.beginPath(); ctx.ellipse(18, -47, 6, 3, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9d8a6';
    ctx.beginPath(); ctx.moveTo(24, -50); ctx.lineTo(22, -57); ctx.lineTo(28, -50); ctx.fill();
    ctx.beginPath(); ctx.moveTo(36, -50); ctx.lineTo(38, -57); ctx.lineTo(40, -50); ctx.fill();
    ctx.restore();
  }

  function sheep(ctx, x, y, dir, t, moving) {
    shadow(ctx, x, y, 24, 6);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    legs4(ctx, t, moving, '#495057', [-13, -5, 7, 14], -14, 14);
    const puffs = [[-14, -30, 11], [-2, -34, 12], [10, -30, 11], [-8, -22, 11], [6, -22, 11], [-18, -24, 9]];
    puffs.forEach(([px, py, r]) => circle(ctx, px, py, r + 1.5, '#dee2e6'));
    puffs.forEach(([px, py, r]) => circle(ctx, px, py, r, '#f8f9fa'));
    ctx.fillStyle = '#495057';
    ctx.beginPath(); ctx.ellipse(21, -34, 8, 10, 0.2, 0, Math.PI * 2); ctx.fill();
    circle(ctx, 18, -44, 6, '#f8f9fa');
    circle(ctx, 24, -36, 1.6, '#fff');
    ctx.fillStyle = '#343a40';
    ctx.beginPath(); ctx.ellipse(14, -36, 5, 2.5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function pig(ctx, x, y, dir, t, moving) {
    shadow(ctx, x, y, 24, 6);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);
    legs4(ctx, t, moving, '#f59fb0', [-14, -6, 7, 15], -12, 12);
    ctx.fillStyle = '#ffadc0';
    ctx.beginPath(); ctx.ellipse(0, -24, 24, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f783ac'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-26, -28, 4, 0, Math.PI * 1.6); ctx.stroke();
    circle(ctx, 20, -30, 12, '#ffadc0');
    ctx.fillStyle = '#f783ac';
    ctx.beginPath(); ctx.moveTo(14, -40); ctx.lineTo(16, -48); ctx.lineTo(22, -41); ctx.fill();
    ctx.fillStyle = '#ff8fab';
    ctx.beginPath(); ctx.ellipse(30, -28, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
    circle(ctx, 29, -30, 1.2, '#c2255c'); circle(ctx, 31, -26, 1.2, '#c2255c');
    circle(ctx, 22, -34, 1.8, '#222');
    ctx.restore();
  }

  /* ---------------- Cảnh vật ---------------- */
  function tree(ctx, x, y, variant) {
    if (variant === 'mai') return maiTree(ctx, x, y);
    const r = srand(x * 13 + y * 7);
    shadow(ctx, x, y, 48, 12, 0.16);
    ctx.fillStyle = '#8b5a2b';
    rr(ctx, x - 11, y - 64, 22, 64, 6); ctx.fill();
    ctx.fillStyle = '#6f4420';
    ctx.fillRect(x - 3, y - 50, 3, 40);
    const pal = variant === 'pink'
      ? ['#e64980', '#f783ac', '#ffc2d8']
      : ['#2b8a3e', '#40c057', '#8ce99a'];
    const cy = y - 112;
    const blobs = [[0, 8, 50], [-42, 18, 36], [42, 18, 36], [-24, -26, 36], [24, -26, 36], [0, -40, 32], [0, 30, 36]];
    blobs.forEach(([bx, by, br]) => circle(ctx, x + bx, cy + by + 5, br, pal[0]));
    blobs.forEach(([bx, by, br]) => circle(ctx, x + bx, cy + by, br - 3, pal[1]));
    for (let i = 0; i < 9; i++) {
      circle(ctx, x - 40 + r() * 70, cy - 40 + r() * 60, 6 + r() * 8, pal[2] + 'aa');
    }
    if (variant === 'pink') {
      for (let i = 0; i < 26; i++) circle(ctx, x - 55 + r() * 110, cy - 55 + r() * 100, 2 + r() * 2, '#fff0f6');
    }
    if (variant === 'fruit') {
      for (let i = 0; i < 14; i++) {
        const fx = x - 50 + r() * 100, fy = cy - 45 + r() * 90;
        ctx.fillStyle = '#ffd43b';
        ctx.beginPath(); ctx.ellipse(fx, fy, 5, 7, 0.3, 0, Math.PI * 2); ctx.fill();
        circle(ctx, fx - 1.5, fy - 2, 1.6, '#fff3bf');
      }
    }
  }

  /** Cây mai vàng ngày Tết: thân gỗ phân nhánh, chùm hoa vàng rực */
  function maiTree(ctx, x, y) {
    const r = srand(x * 7 + y * 3);
    shadow(ctx, x, y, 52, 12, 0.16);
    ctx.strokeStyle = '#6f4420'; ctx.lineCap = 'round';
    const branches = [];
    const grow = (bx, by, ang, len, wdt, depth) => {
      const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
      ctx.lineWidth = wdt;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
      if (depth <= 0) { branches.push([ex, ey]); return; }
      grow(ex, ey, ang - 0.45 - r() * 0.3, len * 0.72, wdt * 0.65, depth - 1);
      grow(ex, ey, ang + 0.45 + r() * 0.3, len * 0.72, wdt * 0.65, depth - 1);
      if (depth === 2) branches.push([ex, ey]);
    };
    grow(x, y, -Math.PI / 2, 62, 14, 3);
    const cols = ['#ffd21f', '#ffe36b', '#ffc400', '#fff3a0'];
    branches.forEach(([bx, by]) => {
      for (let i = 0; i < 9; i++) {
        const fx = bx - 20 + r() * 40, fy = by - 18 + r() * 34;
        for (let k = 0; k < 5; k++) {
          const a = k * Math.PI * 2 / 5;
          circle(ctx, fx + Math.cos(a) * 3.4, fy + Math.sin(a) * 3.4, 3, cols[i % 4]);
        }
        circle(ctx, fx, fy, 1.8, '#e8590c');
      }
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = '#5cb83c';
        ctx.beginPath(); ctx.ellipse(bx - 14 + r() * 28, by - 10 + r() * 20, 5, 2.6, r() * 3, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  function bush(ctx, x, y, flower) {
    shadow(ctx, x, y, 28, 7, 0.15);
    const r = srand(x * 3 + y);
    [[-14, -14, 15], [12, -14, 15], [0, -22, 17]].forEach(([bx, by, br]) => circle(ctx, x + bx, y + by, br, '#2f9e44'));
    [[-14, -16, 12], [12, -16, 12], [0, -24, 14]].forEach(([bx, by, br]) => circle(ctx, x + bx, y + by, br, '#51cf66'));
    for (let i = 0; i < 7; i++) {
      const fx = x - 22 + r() * 44, fy = y - 34 + r() * 22;
      for (let k = 0; k < 5; k++) {
        const a = k * Math.PI * 2 / 5;
        circle(ctx, fx + Math.cos(a) * 2.6, fy + Math.sin(a) * 2.6, 2.2, flower);
      }
      circle(ctx, fx, fy, 1.6, '#ffe066');
    }
  }

  function lamp(ctx, x, y, glow) {
    shadow(ctx, x, y, 10, 4);
    ctx.fillStyle = '#868e96';
    rr(ctx, x - 7, y - 8, 14, 8, 2); ctx.fill();
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(x - 3, y - 120, 6, 114);
    ctx.fillRect(x - 28, y - 122, 56, 4);
    [-24, 24].forEach((dx) => {
      ctx.fillStyle = '#495057';
      rr(ctx, x + dx - 9, y - 124, 18, 6, 3); ctx.fill();
      ctx.fillStyle = '#fff3bf';
      rr(ctx, x + dx - 6, y - 118, 12, 5, 2); ctx.fill();
      if (glow) {
        const g = ctx.createRadialGradient(x + dx, y - 112, 2, x + dx, y - 112, 40);
        g.addColorStop(0, 'rgba(255,240,170,.35)'); g.addColorStop(1, 'rgba(255,240,170,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx, y - 112, 40, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  function hayStack(ctx, x, y) {
    shadow(ctx, x, y, 38, 8);
    ctx.fillStyle = '#e8a93a';
    ctx.beginPath(); ctx.moveTo(x - 38, y); ctx.quadraticCurveTo(x - 36, y - 70, x, y - 76); ctx.quadraticCurveTo(x + 36, y - 70, x + 38, y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c47f17'; ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(x - 38 + i * 4, y - i * 14); ctx.quadraticCurveTo(x, y - i * 14 - 6, x + 38 - i * 4, y - i * 14); ctx.stroke();
    }
    circle(ctx, x, y - 78, 4, '#c47f17');
  }

  function hayBale(ctx, x, y) {
    shadow(ctx, x, y, 26, 6);
    ctx.fillStyle = '#f2c14e';
    rr(ctx, x - 26, y - 28, 52, 28, 6); ctx.fill();
    ctx.fillStyle = '#d99a1c';
    ctx.fillRect(x - 12, y - 28, 4, 28); ctx.fillRect(x + 8, y - 28, 4, 28);
    ctx.strokeStyle = 'rgba(160,100,10,.35)'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x - 24, y - 24 + i * 5); ctx.lineTo(x + 24, y - 23 + i * 5); ctx.stroke(); }
  }

  function picketsH(ctx, x1, x2, y) {
    ctx.fillStyle = '#f8f9fa';
    ctx.strokeStyle = '#ced4da';
    ctx.lineWidth = 1.5;
    rr(ctx, x1, y - 28, x2 - x1, 5, 2); ctx.fill(); ctx.stroke();
    rr(ctx, x1, y - 14, x2 - x1, 5, 2); ctx.fill(); ctx.stroke();
    for (let x = x1; x <= x2 - 12; x += 19) picket(ctx, x + 6, y);
  }

  function picket(ctx, x, y) {
    ctx.fillStyle = '#f8f9fa';
    ctx.strokeStyle = '#ced4da';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 6, y); ctx.lineTo(x - 6, y - 32); ctx.lineTo(x, y - 40); ctx.lineTo(x + 6, y - 32); ctx.lineTo(x + 6, y);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  function woodPost(ctx, x, y) {
    shadow(ctx, x, y, 9, 3);
    ctx.fillStyle = '#b0703a';
    rr(ctx, x - 8, y - 46, 16, 46, 4); ctx.fill();
    ctx.fillStyle = '#d4964f';
    ctx.beginPath(); ctx.ellipse(x, y - 46, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8f5526';
    ctx.fillRect(x - 8, y - 34, 16, 3); ctx.fillRect(x - 8, y - 18, 16, 3);
  }

  function rope(ctx, x1, y1, x2, y2) {
    ctx.strokeStyle = '#8f5526'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    [32, 16].forEach((h) => {
      ctx.beginPath(); ctx.moveTo(x1, y1 - h); ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - h + 9, x2, y2 - h); ctx.stroke();
    });
    ctx.strokeStyle = '#c9894a'; ctx.lineWidth = 3;
    [32, 16].forEach((h) => {
      ctx.beginPath(); ctx.moveTo(x1, y1 - h); ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - h + 9, x2, y2 - h); ctx.stroke();
    });
  }

  function nestBox(ctx, x, y) {
    shadow(ctx, x, y, 30, 6);
    ctx.fillStyle = '#9c5b2e';
    rr(ctx, x - 30, y - 46, 60, 46, 6); ctx.fill();
    ctx.fillStyle = '#7a4320';
    rr(ctx, x - 24, y - 40, 48, 30, 4); ctx.fill();
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath(); ctx.ellipse(x, y - 14, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
    chicken(ctx, x - 2, y - 14, 1, 0, false, false);
    ctx.fillStyle = '#b8743f';
    ctx.beginPath(); ctx.moveTo(x - 36, y - 44); ctx.lineTo(x, y - 62); ctx.lineTo(x + 36, y - 44); ctx.closePath(); ctx.fill();
  }

  function plot(ctx, x, y, w, h, plotState, crop, stage, now) {
    if (!plotState.unlocked) {
      // ô cỏ trống có cọc biển "Mua" như Avatar
      ctx.fillStyle = '#5fbf3a';
      rr(ctx, x, y, w, h, 4); ctx.fill();
      ctx.strokeStyle = '#3d8f25'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#7a4a2c'; ctx.fillRect(x + w / 2 - 2, y + h / 2 - 4, 4, 24);
      ctx.fillStyle = '#e8b46a';
      rr(ctx, x + w / 2 - 24, y + h / 2 - 22, 48, 22, 4); ctx.fill();
      ctx.strokeStyle = '#7a4a2c'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = '800 11px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#5c3010';
      ctx.fillText('MUA', x + w / 2, y + h / 2 - 11);
      ctx.font = '800 11px "Be Vietnam Pro", system-ui'; ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(40,30,20,.7)'; ctx.lineWidth = 3;
      ctx.strokeText(plotState.price + ' xu', x + w / 2, y + h - 8);
      ctx.fillText(plotState.price + ' xu', x + w / 2, y + h - 8);
      return;
    }
    // ô đất vuông, luống cày kẻ ô
    ctx.fillStyle = '#6b3f22';
    rr(ctx, x, y + 3, w, h, 4); ctx.fill();
    ctx.fillStyle = '#a8703f';
    rr(ctx, x, y, w, h, 4); ctx.fill();
    ctx.strokeStyle = '#4a2a14'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(80,45,20,.35)';
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      if ((i + j) % 2) ctx.fillRect(x + 3 + i * (w - 6) / 3, y + 3 + j * (h - 6) / 2, (w - 6) / 3, (h - 6) / 2);
    }
    if (!crop) return;
    // mỗi ô một cây to như Avatar
    ctx.save();
    ctx.translate(x + w / 2, y + h * 0.78);
    ctx.scale(2.4, 2.4);
    plant(ctx, 0, 0, crop, stage, now);
    ctx.restore();
  }

  function plant(ctx, x, y, crop, stage, t) {
    const sway = Math.sin(t * 2) * 1.2;
    if (stage === 0) {
      ctx.fillStyle = '#69db7c';
      ctx.beginPath(); ctx.ellipse(x - 3, y - 5, 4, 2, -0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 3, y - 5, 4, 2, 0.6, 0, Math.PI * 2); ctx.fill();
      return;
    }
    if (stage === 1) {
      // cây non lá to xoè ra như Avatar
      [[-6, -6, -0.9], [6, -6, 0.9], [-3, -11, -0.4], [3, -11, 0.4], [0, -13, 0]].forEach(([dx, dy, ang], i) => {
        ctx.save(); ctx.translate(x + dx * 0.4 + sway * 0.5, y + dy * 0.3); ctx.rotate(ang);
        ctx.fillStyle = i < 2 ? '#2f8f2f' : '#4cb33f';
        ctx.beginPath(); ctx.ellipse(0, -6, 3.6, 7, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.6;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -11); ctx.stroke();
        ctx.restore();
      });
      return;
    }
    const fc = typeof DATA !== 'undefined' && DATA.CROPS[crop];
    if (fc && fc.kind === 'flower') {
      ctx.strokeStyle = '#2f8f2f'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sway, y - 17); ctx.stroke();
      ctx.fillStyle = '#3c9e36';
      ctx.beginPath(); ctx.ellipse(x - 5, y - 7, 5, 2.2, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 5, y - 10, 5, 2.2, 0.5, 0, Math.PI * 2); ctx.fill();
      const fx = x + sway, fy = y - 20;
      if (crop === 'tulip') {
        ctx.fillStyle = fc.petal;
        ctx.beginPath(); ctx.moveTo(fx - 6, fy - 5); ctx.lineTo(fx - 3, fy - 1); ctx.lineTo(fx, fy - 6); ctx.lineTo(fx + 3, fy - 1); ctx.lineTo(fx + 6, fy - 5);
        ctx.quadraticCurveTo(fx + 6, fy + 6, fx, fy + 6); ctx.quadraticCurveTo(fx - 6, fy + 6, fx - 6, fy - 5); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(fx - 3, fy - 1, 1.5, 4);
      } else {
        const n = crop === 'sunflower' ? 12 : crop === 'hibiscus' ? 5 : 8;
        const r = crop === 'sunflower' ? 7 : crop === 'hibiscus' ? 6 : 5.5;
        for (let k = 0; k < n; k++) {
          const a = k * Math.PI * 2 / n;
          ctx.fillStyle = fc.petal;
          ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * r * 0.7, fy + Math.sin(a) * r * 0.7, r * 0.55, r * 0.32, a, 0, Math.PI * 2); ctx.fill();
        }
        circle(ctx, fx, fy, crop === 'sunflower' ? 4.2 : 2.6, fc.heart);
        if (crop === 'hibiscus') { ctx.strokeStyle = fc.heart; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + 5, fy - 6); ctx.stroke(); }
      }
      return;
    }
    if (crop === 'rose') {
      ctx.strokeStyle = '#2f8f2f'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sway, y - 15); ctx.stroke();
      ctx.fillStyle = '#3c9e36';
      ctx.beginPath(); ctx.ellipse(x - 4, y - 6, 4, 2, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 4, y - 9, 4, 2, 0.5, 0, Math.PI * 2); ctx.fill();
      circle(ctx, x + sway, y - 18, 5.5, '#c2185b');
      circle(ctx, x + sway, y - 18.5, 4.2, '#e64980');
      circle(ctx, x + sway - 1, y - 19.5, 2.4, '#f783ac');
      ctx.strokeStyle = '#a61e4d'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(x + sway, y - 18.5, 2.6, 0.5, 4); ctx.stroke();
      return;
    }
    if (crop === 'wheat') {
      ctx.strokeStyle = '#d9a52b'; ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(x + i * 4, y); ctx.lineTo(x + i * 5 + sway, y - 20); ctx.stroke();
        ctx.fillStyle = '#f5c542';
        ctx.beginPath(); ctx.ellipse(x + i * 5 + sway, y - 23, 2.6, 6, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else if (crop === 'carrot') {
      ctx.fillStyle = '#ff922b';
      ctx.beginPath(); ctx.moveTo(x - 5, y - 4); ctx.lineTo(x + 5, y - 4); ctx.lineTo(x, y + 4); ctx.fill();
      ctx.fillStyle = '#40c057';
      [[-4, -12, -0.4], [0, -15, 0], [4, -12, 0.4]].forEach(([dx, dy, a]) => {
        ctx.beginPath(); ctx.ellipse(x + dx + sway, y + dy, 2.5, 7, a, 0, Math.PI * 2); ctx.fill();
      });
    } else if (crop === 'strawberry') {
      [[-6, -8], [6, -8], [0, -14]].forEach(([dx, dy]) => circle(ctx, x + dx, y + dy, 7, '#37b24d'));
      [[-5, -6], [5, -9], [1, -15]].forEach(([dx, dy]) => {
        ctx.fillStyle = '#f03e3e';
        ctx.beginPath(); ctx.moveTo(x + dx - 4, y + dy - 2); ctx.lineTo(x + dx + 4, y + dy - 2); ctx.lineTo(x + dx, y + dy + 5); ctx.fill();
      });
    } else if (crop === 'corn') {
      ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sway, y - 28); ctx.stroke();
      ctx.fillStyle = '#51cf66';
      ctx.beginPath(); ctx.ellipse(x - 6, y - 14, 8, 2.5, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath(); ctx.ellipse(x + 4 + sway, y - 18, 3.5, 7, 0.2, 0, Math.PI * 2); ctx.fill();
    } else if (crop === 'pumpkin') {
      ctx.fillStyle = '#2f9e44';
      ctx.beginPath(); ctx.ellipse(x - 7, y - 10, 6, 3, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fd7e14';
      ctx.beginPath(); ctx.ellipse(x, y - 6, 10, 7.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e8590c'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(x, y - 6, 4, 7.5, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#5c940d'; ctx.fillRect(x - 1, y - 16, 2.5, 4);
    }
  }

  function house(ctx, x, y) {
    shadow(ctx, x, y, 120, 14);
    ctx.fillStyle = '#fff4e0';
    rr(ctx, x - 100, y - 110, 200, 110, 6); ctx.fill();
    ctx.fillStyle = '#f3dfbf';
    ctx.fillRect(x - 100, y - 14, 200, 14);
    ctx.fillStyle = '#e8590c';
    ctx.beginPath(); ctx.moveTo(x - 118, y - 104); ctx.lineTo(x - 70, y - 176); ctx.lineTo(x + 70, y - 176); ctx.lineTo(x + 118, y - 104); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d9480f';
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 112 + i * 4, y - 112 - i * 16, 224 - i * 8, 3);
    ctx.fillStyle = '#868e96';
    ctx.fillRect(x + 50, y - 196, 22, 34);
    ctx.fillStyle = '#9c5b2e';
    rr(ctx, x - 20, y - 70, 40, 70, 6); ctx.fill();
    circle(ctx, x + 11, y - 34, 3, '#ffd43b');
    [-64, 64].forEach((dx) => {
      ctx.fillStyle = '#74c0fc';
      rr(ctx, x + dx - 22, y - 84, 44, 36, 4); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + dx - 1.5, y - 84, 3, 36); ctx.fillRect(x + dx - 22, y - 67, 44, 3);
      ctx.fillStyle = '#e64980';
      rr(ctx, x + dx - 24, y - 48, 48, 8, 3); ctx.fill();
    });
  }

  function mailbox(ctx, x, y) {
    shadow(ctx, x, y, 10, 3);
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - 3, y - 36, 6, 36);
    ctx.fillStyle = '#4dabf7';
    rr(ctx, x - 14, y - 52, 28, 18, 8); ctx.fill();
    ctx.fillStyle = '#e03131'; ctx.fillRect(x + 10, y - 60, 3, 12); ctx.fillRect(x + 10, y - 60, 8, 5);
  }

  function stall(ctx, x, y, t) {
    shadow(ctx, x, y, 110, 12);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(x - 96, y - 130, 8, 130); ctx.fillRect(x + 88, y - 130, 8, 130);
    ctx.fillStyle = '#b0703a';
    rr(ctx, x - 100, y - 54, 200, 54, 6); ctx.fill();
    ctx.fillStyle = '#d4964f'; ctx.fillRect(x - 100, y - 54, 200, 8);
    const items = ['🍎', '🥕', '🍓', '🌽', '🎃', '🥚', '🥛'];
    ctx.font = '20px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    items.forEach((it, i) => ctx.fillText(it, x - 78 + i * 26, y - 66));
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : '#fa5252';
      ctx.beginPath();
      ctx.moveTo(x - 110 + i * 27.5, y - 150); ctx.lineTo(x - 110 + (i + 1) * 27.5, y - 150);
      ctx.lineTo(x - 110 + (i + 1) * 27.5, y - 122); ctx.quadraticCurveTo(x - 110 + (i + 0.5) * 27.5, y - 112, x - 110 + i * 27.5, y - 122);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    rr(ctx, x - 44, y - 178, 88, 28, 8); ctx.fill();
    ctx.fillStyle = '#e03131'; ctx.font = '800 16px "Be Vietnam Pro", system-ui';
    ctx.fillText('🛒 CHỢ', x, y - 163);
  }

  function boutique(ctx, x, y) {
    shadow(ctx, x, y, 130, 14);
    ctx.fillStyle = '#ffdeeb';
    rr(ctx, x - 120, y - 150, 240, 150, 8); ctx.fill();
    ctx.fillStyle = '#f783ac';
    rr(ctx, x - 130, y - 172, 260, 30, 8); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '800 17px "Be Vietnam Pro", system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('👗 THỜI TRANG', x, y - 157);
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i % 2 ? '#fff' : '#be4bdb';
      ctx.beginPath();
      const w = 260 / 9;
      ctx.moveTo(x - 130 + i * w, y - 142); ctx.lineTo(x - 130 + (i + 1) * w, y - 142);
      ctx.lineTo(x - 130 + (i + 1) * w, y - 124); ctx.quadraticCurveTo(x - 130 + (i + 0.5) * w, y - 114, x - 130 + i * w, y - 124);
      ctx.fill();
    }
    ctx.fillStyle = '#a5d8ff';
    rr(ctx, x - 104, y - 100, 70, 74, 6); ctx.fill();
    rr(ctx, x + 34, y - 100, 70, 74, 6); ctx.fill();
    ctx.font = '26px system-ui, "Segoe UI Emoji"';
    ctx.fillText('👒', x - 69, y - 70); ctx.fillText('👕', x + 69, y - 70);
    ctx.fillStyle = '#9c36b5';
    rr(ctx, x - 22, y - 80, 44, 80, 6); ctx.fill();
    circle(ctx, x + 12, y - 40, 3, '#ffd43b');
  }

  function fountain(ctx, x, y, t) {
    shadow(ctx, x, y + 6, 120, 22, 0.12);
    ctx.fillStyle = '#adb5bd';
    ctx.beginPath(); ctx.ellipse(x, y, 112, 40, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ced4da';
    ctx.beginPath(); ctx.ellipse(x, y - 8, 112, 40, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4dabf7';
    ctx.beginPath(); ctx.ellipse(x, y - 8, 96, 31, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const p = ((t * 0.5 + i / 3) % 1);
      ctx.globalAlpha = 1 - p;
      ctx.beginPath(); ctx.ellipse(x, y - 8, 20 + p * 70, 6 + p * 22, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ced4da';
    rr(ctx, x - 10, y - 70, 20, 62, 6); ctx.fill();
    ctx.fillStyle = '#adb5bd';
    ctx.beginPath(); ctx.ellipse(x, y - 70, 30, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(165,216,255,.9)';
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2 + t;
      const p = (t * 1.5 + i * 0.1) % 1;
      const dx = Math.cos(a) * 26 * p, dy = -80 - Math.sin(p * Math.PI) * 26 + p * 70;
      circle(ctx, x + dx, y + dy, 3, 'rgba(165,216,255,.9)');
    }
  }

  function bench(ctx, x, y) {
    shadow(ctx, x, y, 44, 6);
    ctx.fillStyle = '#495057';
    ctx.fillRect(x - 36, y - 18, 5, 18); ctx.fillRect(x + 31, y - 18, 5, 18);
    ctx.fillStyle = '#b0703a';
    rr(ctx, x - 42, y - 24, 84, 8, 3); ctx.fill();
    rr(ctx, x - 42, y - 44, 84, 7, 3); ctx.fill();
    rr(ctx, x - 42, y - 34, 84, 7, 3); ctx.fill();
  }

  function busStop(ctx, x, y) {
    shadow(ctx, x, y, 10, 3);
    ctx.fillStyle = '#868e96'; ctx.fillRect(x - 3, y - 96, 6, 96);
    ctx.fillStyle = '#1c7ed6';
    rr(ctx, x - 24, y - 120, 48, 34, 8); ctx.fill();
    ctx.font = '20px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🚌', x, y - 103);
  }

  function bus(ctx, x, y, t, moving) {
    // x = tâm xe, y = đáy bánh; đầu xe hướng sang trái
    const L = 300, H = 118;
    shadow(ctx, x, y, L / 2 + 10, 10, 0.2);
    const bob = moving ? Math.sin(t * 20) * 0.8 : 0;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.fillStyle = '#f8f9fa';
    rr(ctx, -L / 2, -H - 12, L, H, 18); ctx.fill();
    ctx.fillStyle = '#1971c2';
    rr(ctx, -L / 2, -H - 12, L, 26, [18, 18, 0, 0]); ctx.fill();
    ctx.fillStyle = '#e7f5ff';
    rr(ctx, -L / 2 + 50, -H - 22, L - 110, 12, 6); ctx.fill();
    ctx.fillStyle = '#1c7ed6';
    ctx.beginPath(); ctx.moveTo(-L / 2, -40); ctx.lineTo(L / 2, -54); ctx.lineTo(L / 2, -30); ctx.lineTo(-L / 2, -16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#74c0fc';
    ctx.beginPath(); ctx.moveTo(-L / 2, -26); ctx.lineTo(L / 2, -38); ctx.lineTo(L / 2, -32); ctx.lineTo(-L / 2, -20); ctx.closePath(); ctx.fill();
    // kính lái
    ctx.fillStyle = '#1864ab';
    rr(ctx, -L / 2 + 4, -H + 18, 30, 58, 8); ctx.fill();
    // cửa sổ
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#1864ab';
      rr(ctx, -L / 2 + 44 + i * 46, -H + 18, 40, 46, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.fillRect(-L / 2 + 48 + i * 46, -H + 22, 8, 38);
    }
    // cửa
    ctx.fillStyle = '#1864ab';
    rr(ctx, L / 2 - 66, -H + 18, 46, 82, 6); ctx.fill();
    ctx.fillStyle = '#4dabf7'; ctx.fillRect(L / 2 - 44, -H + 18, 2, 82);
    // đèn
    circle(ctx, -L / 2 + 8, -28, 6, '#fff3bf');
    ctx.fillStyle = '#343a40'; rr(ctx, -L / 2 - 4, -18, 14, 8, 3); ctx.fill();
    // bánh xe
    [-L / 2 + 64, L / 2 - 96].forEach((wx) => {
      circle(ctx, wx, -8, 24, '#212529');
      circle(ctx, wx, -8, 12, '#adb5bd');
      ctx.save(); ctx.translate(wx, -8); ctx.rotate(moving ? t * 10 : 0);
      ctx.fillStyle = '#495057'; ctx.fillRect(-2, -10, 4, 20); ctx.fillRect(-10, -2, 20, 4);
      ctx.restore();
    });
    ctx.restore();
  }

  function pond(ctx, x, y, t) {
    ctx.fillStyle = '#8ce99a';
    ctx.beginPath(); ctx.ellipse(x, y, 150, 62, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#339af0';
    ctx.beginPath(); ctx.ellipse(x, y, 136, 52, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#74c0fc';
    ctx.beginPath(); ctx.ellipse(x - 20, y - 10, 90, 28, 0, 0, Math.PI * 2); ctx.fill();
    [[x - 70, y + 10], [x + 60, y - 8], [x + 20, y + 22]].forEach(([lx, ly], i) => {
      ctx.fillStyle = '#40c057';
      ctx.beginPath(); ctx.ellipse(lx, ly + Math.sin(t + i) * 1.5, 13, 7, 0, 0.3, Math.PI * 2 - 0.3); ctx.lineTo(lx, ly); ctx.fill();
    });
    circle(ctx, x + 60, y - 12, 4, '#f783ac');
  }

  return {
    srand, rr, shadow, circle, label, bubble, iconBubble, character, chicken, cow, sheep, pig,
    tree, bush, lamp, hayStack, hayBale, picketsH, picket, woodPost, rope, nestBox, plot, plant,
    house, mailbox, stall, boutique, fountain, bench, busStop, bus, pond, star, heart,
  };
})();
