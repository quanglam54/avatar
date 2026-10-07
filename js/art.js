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
  /* ---------- Nhân vật vẽ sẵn (ảnh nam / nữ) ---------- */
  const GIRLISH = { long: 1, pigtails: 1, bun: 1, bob: 1 };
  const DRESSY_ST = { dress: 1, dress_flower: 1, princess: 1, witchdress: 1 };
  /** Nhân vật ảnh nào cho look này (null = vẽ bằng code: NPC, hoặc người chơi chọn tự phối đồ) */
  function avatarOf(look) {
    if (!look || look.npc || look.avatar === 'custom' || typeof DATA === 'undefined' || !DATA.AVATARS) return null;
    const id = look.avatar === 'boy' || look.avatar === 'girl' ? look.avatar : (GIRLISH[look.hair] || DRESSY_ST[look.shirtStyle] || look.top === 'cute' ? 'girl' : 'boy');
    return DATA.AVATARS.find((a) => a.id === id) || null;
  }
  /** Ảnh nhân vật vẽ theo look: { src, squash } (squash = ảnh gốc dáng cao cần thu ngắn thân) */
  function paintedSrc(look) {
    const a = avatarOf(look);
    if (!a) return null;
    const list = (DATA.PAINT_HAIRS && DATA.PAINT_HAIRS[a.id]) || [];
    if (look.phair && list.some((h) => h.id === look.phair)) return { src: `img/char/${a.id}_${look.phair}.png`, squash: false };
    return { src: a.src, squash: true };
  }
  const paintedImg = (look) => { const p = paintedSrc(look); return p && typeof IMG !== 'undefined' ? IMG.get(p.src) : null; };
  /** Dáng chibi lùn: giữ nguyên đầu (phần trên SPLIT của ảnh), thân + chân thu ngắn còn BODY_K */
  const SPLIT = 0.36, BODY_K = 0.48;
  /** Đang hiện nhân vật ảnh (ảnh đã tải xong) */
  const isPainted = (look) => !!paintedImg(look);
  const PAINT_H = 100;
  /** Ảnh nhân vật dựng sẵn: thu lùn thân + viền nâu đậm, ở độ phân giải k (chiều cao PAINT_H) */
  const spriteCache = new Map();
  function paintedSprite(look, im) {
    const p = paintedSrc(look), k = Math.min(3, Math.max(1, (typeof FX !== 'undefined' && FX.scale) || 1));
    const wear = typeof WARDROBE !== 'undefined' && WARDROBE.active(look) ? look.wear : '';
    const key = p.src + '|' + k + '|' + wear;
    let e = spriteCache.get(key);
    if (e) return e;
    const split = p.squash ? SPLIT : 0.42, bk = p.squash ? BODY_K : 0.72;
    im = (wear && WARDROBE.dress(p.src, im, wear)) || im;
    const iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height;
    const H = PAINT_H / (split + (1 - split) * bk), W = H * iw / ih;
    const headH = H * split, bodyH = H * (1 - split) * bk;
    const pad = 3, cw = Math.ceil((W + pad * 2) * k), chh = Math.ceil((PAINT_H + pad * 2) * k);
    const a = document.createElement('canvas'); a.width = cw; a.height = chh;
    const g = a.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.setTransform(k, 0, 0, k, pad * k, pad * k);
    g.drawImage(im, 0, ih * split, iw, ih * (1 - split), 0, headH, W, bodyH);
    g.drawImage(im, 0, 0, iw, ih * split + 1, 0, 0, W, headH + 1);
    // viền nâu đậm như mọi hình trong game
    const out = document.createElement('canvas'); out.width = cw; out.height = chh;
    const o2 = out.getContext('2d'), d = Math.max(1, Math.round(1.4 * k));
    for (const [dx, dy] of [[-d, 0], [d, 0], [0, -d], [0, d], [-d, -d], [d, -d], [-d, d], [d, d]]) o2.drawImage(a, dx, dy);
    o2.globalCompositeOperation = 'source-in'; o2.fillStyle = '#2b1a10'; o2.fillRect(0, 0, cw, chh);
    o2.globalCompositeOperation = 'source-over'; o2.drawImage(a, 0, 0);
    e = { c: out, w: W + pad * 2, h: PAINT_H + pad * 2, pad };
    if (spriteCache.size > 120) spriteCache.clear();
    spriteCache.set(key, e);
    return e;
  }
  function painted(ctx, x, y, look, o) {
    const im = paintedImg(look);
    if (!im) return false;
    const s = (o.scale ?? 1.18) / 1.18, t = o.t || 0;
    const sp = paintedSprite(look, im);
    let bob = 0, tilt = 0, sq = 1;
    if (o.dance) { bob = Math.abs(Math.sin(t * 7)) * 9 * s; tilt = Math.sin(t * 4) * 0.12; }
    else if (o.moving) { bob = Math.abs(Math.sin(t * 12)) * 3 * s; tilt = Math.sin(t * 12) * 0.045; }
    else sq = 1 + Math.sin(t * 2) * 0.01;
    const dir = o.dance ? (Math.sin(t * 4) > 0 ? 1 : -1) : (o.dir || 1);
    shadow(ctx, x, y, 17 * s, 5 * s);
    ctx.save();
    ctx.translate(x, y - bob); ctx.rotate(tilt); ctx.scale((dir < 0 ? -1 : 1) * s, sq * s);
    ctx.drawImage(sp.c, -sp.w / 2, -sp.h + sp.pad, sp.w, sp.h);
    ctx.restore();
    return true;
  }

  function character(ctx, x, y, look, o = {}) {
    if (look && look.stick && typeof CONCERT !== 'undefined' && AV.currentMap && AV.currentMap() === 'concert') {
      characterOnly(ctx, x, y, look, o);
      const s = (o.scale ?? 1.18) / 1.18, bob = o.dance ? Math.abs(Math.sin((o.t || 0) * 7)) * 9 * s : 0;
      CONCERT.heldStick(ctx, x, y - bob, look.stick, (o.t || 0) + x * 0.01, s);
      return;
    }
    characterOnly(ctx, x, y, look, o);
  }
  function characterOnly(ctx, x, y, look, o) {
    if (!o.vector && painted(ctx, x, y, look, o)) return;
    if (typeof PX !== 'undefined' && PX.ready && !o.vector) return PX.draw(ctx, x, y, look, o);
    const s = o.scale ?? 1.18;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    characterBase(ctx, 0, 0, look, o);
    ctx.restore();
  }

  /* Nét viền nâu đậm bên trong (giống nét vẽ game Avatar) */
  const OUT = '#3a2214';
  function ol(ctx, w = 1.3) { ctx.strokeStyle = OUT; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  /** Khung vẽ đầu: đầu to kiểu chibi (vẽ theo toạ độ cũ: tâm đầu 0,-55 bán kính 19) */
  const headFrame = (ctx) => { ctx.translate(0, -52); ctx.scale(1.24, 1.24); ctx.translate(0, 55); };
  const GIRLY = { long: 1, pigtails: 1, bun: 1, bob: 1 };

  /* ---------- Bộ trang phục (áo / quần / giày / áo choàng) ---------- */
  const TOPS = {
    tee_star: { style: 'star' },
    hoodie: { shirt: '#b8c0cc', style: 'hoodie', jacket: 1 },
    school: { shirt: '#ffffff', style: 'school' },
    varsity: { shirt: '#e03131', style: 'varsity', jacket: 1, sleeve: '#f8f9fa' },
    couple_l: { shirt: '#ffffff', style: 'coupleL' },
    couple_r: { shirt: '#ffffff', style: 'coupleR' },
    puffer: { shirt: '#20c4b8', style: 'puffer', jacket: 1 },
    cute: { shirt: '#ff8fb1', dress: 'dress', style: 'cute' },
    leather: { shirt: '#262a33', style: 'leather', jacket: 1 },
    thunder: { shirt: '#3b82f6', style: 'thunder', jacket: 1 },
    armor: { shirt: '#f5c542', style: 'armor', jacket: 1 },
  };
  const BOTTOMS = {
    jeans: {}, baggy: { pants: '#d9b98a' }, school_pants: { pants: '#2c3e75' }, school_skirt: { pants: '#2c3e75', skirt: 1 },
    baggy_denim: { pants: '#8fb0ee' }, shorts: { pants: '#5b7fd6', shorts: 1 }, warm: { pants: '#3d4452' },
    ripped: { pants: '#262a33', ripped: 1 }, track: { pants: '#1d4ed8', stripe: '#ffffff' }, knight: { pants: '#9e1c1c', stripe: '#f5c542' },
  };
  const SHOES = {
    sneaker: ['#f4f5f7', '#e03131'], chunky: ['#ffffff', '#adb5bd'], school: ['#212529', '#495057'], hightop: ['#e03131', '#ffffff'], slipon: ['#212529', '#ffffff'],
    boots: ['#8a5a3c', '#eceff3'], maryjane: ['#e03131', '#ffd43b'], combat: ['#1f232b', '#868e96'], thunder: ['#3b82f6', '#ffd43b'], armor: ['#f5c542', '#e03131'],
  };
  /** Ghép bộ đồ vào look: đổi màu áo / quần, kiểu váy… */
  function outfit(look) {
    const tp = TOPS[look.top], bt = BOTTOMS[look.bottom];
    const L = { ...look };
    if (tp) { if (tp.shirt) L.shirt = tp.shirt; L.shirtStyle = tp.dress || (tp.style === 'star' ? 'star' : 'plain'); }
    if (bt && bt.pants) L.pants = bt.pants;
    const dress = !!DRESSES[L.shirtStyle] || L.shirtStyle === 'witchdress';
    return { L, top: tp || null, bot: bt || null, shoes: SHOES[look.shoes] || (dress ? SHOES.maryjane : null), dress };
  }

  /** Chi tiết trên thân áo của từng bộ (vẽ trong khung thân áo) */
  function topDetail(ctx, st, L) {
    if (st === 'hoodie') {
      ctx.fillStyle = shade(L.shirt, -0.18); rr(ctx, -8, -25, 16, 9, 3); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-3, -37); ctx.lineTo(-3, -30); ctx.moveTo(3, -37); ctx.lineTo(3, -30); ctx.stroke();
      ctx.fillStyle = shade(L.shirt, -0.3); ctx.beginPath(); ctx.ellipse(0, -38, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
    } else if (st === 'school') {
      ctx.fillStyle = '#e9ecef'; ctx.beginPath(); ctx.moveTo(-8, -38); ctx.lineTo(-1, -33); ctx.lineTo(-4, -38); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(8, -38); ctx.lineTo(1, -33); ctx.lineTo(4, -38); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e03131'; ctx.beginPath(); ctx.moveTo(-5, -38); ctx.lineTo(5, -38); ctx.lineTo(0, -33); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-1, -34); ctx.lineTo(-4, -26); ctx.lineTo(-1, -27); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(1, -34); ctx.lineTo(4, -25); ctx.lineTo(1, -26); ctx.closePath(); ctx.fill();
      [-22, -18].forEach((yy) => circle(ctx, 0, yy, 0.9, '#adb5bd'));
    } else if (st === 'varsity') {
      ctx.fillStyle = '#f8f9fa'; ctx.fillRect(-2.5, -38, 5, 24);
      ctx.fillStyle = '#9e1c1c'; ctx.fillRect(-12, -16.5, 24, 2.5);
      ctx.fillStyle = '#ffd43b'; ctx.font = '900 8px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', -7, -29);
    } else if (st === 'coupleL' || st === 'coupleR') {
      const sx = st === 'coupleL' ? 1 : -1;
      ctx.fillStyle = '#ff4d6d'; ctx.beginPath(); ctx.moveTo(sx * 12, -24); ctx.bezierCurveTo(sx * 12, -30, sx * 6, -32, sx * 4, -28); ctx.bezierCurveTo(sx * 2, -24, sx * 8, -20, sx * 12, -18); ctx.closePath(); ctx.fill();
    } else if (st === 'puffer') {
      ctx.strokeStyle = shade(L.shirt, -0.3); ctx.lineWidth = 1.3;
      [-31, -25, -19].forEach((yy) => { ctx.beginPath(); ctx.moveTo(-12, yy); ctx.lineTo(12, yy); ctx.stroke(); });
      ctx.strokeStyle = '#eceff3'; ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(0, -14); ctx.stroke();
      [-9, -4.5, 0, 4.5, 9].forEach((xx) => circle(ctx, xx, -37.5, 3.2, '#f1f3f5'));
    } else if (st === 'cute') {
      ctx.fillStyle = '#e03131';
      ctx.beginPath(); ctx.moveTo(0, -31); ctx.lineTo(-6, -35); ctx.lineTo(-6, -27); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -31); ctx.lineTo(6, -35); ctx.lineTo(6, -27); ctx.closePath(); ctx.fill();
      circle(ctx, 0, -31, 1.8, '#a61e1e');
    } else if (st === 'leather') {
      ctx.fillStyle = '#e03131'; ctx.fillRect(-4, -38, 8, 24);
      ctx.strokeStyle = '#ced4da'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(4, -38); ctx.lineTo(2, -14); ctx.stroke();
      ctx.fillStyle = '#495057'; ctx.fillRect(-12, -38, 6, 4); ctx.fillRect(6, -38, 6, 4);
    } else if (st === 'thunder') {
      ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.moveTo(3, -36); ctx.lineTo(-3, -27); ctx.lineTo(1, -27); ctx.lineTo(-3, -17); ctx.lineTo(6, -29); ctx.lineTo(2, -29); ctx.lineTo(6, -36); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-12, -38, 2.5, 24); ctx.fillRect(9.5, -38, 2.5, 24);
    } else if (st === 'armor') {
      ctx.fillStyle = shade(L.shirt, -0.25); ctx.beginPath(); ctx.moveTo(-9, -36); ctx.lineTo(9, -36); ctx.lineTo(7, -20); ctx.lineTo(0, -16); ctx.lineTo(-7, -20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = L.shirt; ctx.beginPath(); ctx.moveTo(-7, -34); ctx.lineTo(7, -34); ctx.lineTo(5.5, -21); ctx.lineTo(0, -18); ctx.lineTo(-5.5, -21); ctx.closePath(); ctx.fill();
      circle(ctx, 0, -28, 3, '#e03131'); circle(ctx, -0.8, -28.8, 1, '#ffc9c9');
      ctx.fillStyle = '#9e1c1c'; ctx.fillRect(-12, -16, 24, 2);
    }
  }

  /** Áo choàng đỏ sau lưng (bộ Rồng Vàng) */
  function capeBack(ctx, t) {
    const sw = Math.sin(t * 2) * 2;
    ctx.fillStyle = '#c92a2a';
    ctx.beginPath(); ctx.moveTo(-13, -37); ctx.lineTo(13, -37); ctx.lineTo(19 + sw, -2); ctx.quadraticCurveTo(0, 3, -19 + sw, -2); ctx.closePath(); ctx.fill(); ol(ctx, 1.2);
    ctx.fillStyle = '#ffd43b'; ctx.fillRect(-13, -38, 26, 3);
  }

  /** Hiệu ứng bộ đồ hiếm: tia sét (Thần Sấm), đốm vàng bay lên (Rồng Vàng) */
  function setFx(ctx, style, t) {
    if (style === 'thunder') {
      for (let i = 0; i < 4; i++) {
        if (Math.sin(t * 9 + i * 2.1) < 0.35) continue;
        const sx = (i % 2 ? 1 : -1) * (22 + (i > 1 ? 6 : 0)), sy = -60 + i * 12;
        ctx.strokeStyle = i % 2 ? '#fff59a' : '#67e8f9'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 4, sy + 5); ctx.lineTo(sx - 2, sy + 8); ctx.lineTo(sx + 3, sy + 14); ctx.stroke();
      }
    } else if (style === 'armor') {
      for (let i = 0; i < 6; i++) {
        const ph = (t * 0.55 + i / 6) % 1;
        const sx = Math.sin(i * 2.4 + t * 0.7) * 26, sy = -6 - ph * 95;
        star(ctx, sx, sy, 3.2 * (1 - ph * 0.5), 1.3, `rgba(255,212,59,${1 - ph})`);
      }
    }
  }

  function characterBase(ctx, x, y, look, o) {
    const OF = outfit(look);
    look = OF.L;
    const t = o.t || 0;
    const dir = o.dance ? (Math.sin(t * 4) > 0 ? 1 : -1) : (o.dir || 1);
    const swing = o.dance ? Math.sin(t * 14) * 8 : o.moving ? Math.sin(t * 12) * 4 : 0;
    const bob = o.dance ? Math.abs(Math.sin(t * 7)) * 10 : o.moving ? Math.abs(Math.sin(t * 12)) * 2 : Math.sin(t * 2) * 0.6;
    shadow(ctx, x, y, 15, 5);
    ctx.save();
    ctx.translate(x, y - bob);

    // ---- phía sau: cánh, tóc sau
    if (look.acc === 'wings') wings(ctx, t);
    if (look.acc === 'starcape') {
      ctx.save(); ctx.scale(0.86, 0.86);
      const sw = Math.sin(t * 2) * 2;
      ctx.fillStyle = '#1c2f6b'; ctx.beginPath(); ctx.moveTo(-13, -37); ctx.lineTo(13, -37); ctx.lineTo(21 + sw, 0); ctx.quadraticCurveTo(0, 5, -21 + sw, 0); ctx.closePath(); ctx.fill(); ol(ctx, 1.2);
      [[-8, -24], [7, -16], [-3, -8], [12, -4], [-14, -6]].forEach(([sx, sy], k) => star(ctx, sx + sw * 0.5, sy, 2.6, 1.1, `rgba(255,236,120,${0.6 + 0.4 * Math.sin(t * 3 + k)})`));
      ctx.fillStyle = '#ffd43b'; ctx.fillRect(-13, -38, 26, 3);
      ctx.restore();
    }
    if (look.back === 'cape_red') { ctx.save(); ctx.scale(0.86, 0.86); capeBack(ctx, t); ctx.restore(); }
    ctx.save(); headFrame(ctx); hairBack(ctx, look); ctx.restore();

    // ---- thân người nhỏ kiểu chibi
    ctx.save();
    ctx.scale(0.86, 0.86);
    cape(ctx, look);
    const lLift = Math.max(0, swing) * 0.6, rLift = Math.max(0, -swing) * 0.6;
    const dress = !!DRESSES[look.shirtStyle] || look.shirtStyle === 'witchdress';
    // chân + giày
    const B = OF.bot || {};
    [[-9, lLift], [1, rLift]].forEach(([lx, lift]) => {
      if (B.shorts || B.skirt) {
        ctx.fillStyle = look.skin; rr(ctx, lx, -18 - lift, 8, 14, 3); ctx.fill(); ol(ctx, 1.1);
        if (B.shorts) { ctx.fillStyle = look.pants; rr(ctx, lx, -18 - lift, 8, 7, 2); ctx.fill(); ol(ctx, 1.1); }
      } else {
        ctx.fillStyle = look.pants; rr(ctx, lx, -18 - lift, 8, 14, 3); ctx.fill(); ol(ctx, 1.1);
        if (B.stripe) { ctx.fillStyle = B.stripe; ctx.fillRect(lx === -9 ? lx + 0.5 : lx + 6, -17 - lift, 1.6, 12); }
        if (B.ripped) { ctx.fillStyle = look.skin; ctx.fillRect(lx + 2, -11 - lift, 4, 2); }
      }
      const sh = OF.shoes;
      ctx.fillStyle = sh ? sh[0] : '#4a2f22'; ctx.beginPath(); ctx.ellipse(lx + 4, -3.5 - lift, 6, 3.4, 0, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.1);
      ctx.fillStyle = sh ? sh[1] : 'rgba(255,255,255,.35)'; ctx.fillRect(lx + 1, -5.5 - lift, 4, 1.3);
    });
    // thân áo
    const light = shade(look.shirt, 0.25), dark = shade(look.shirt, -0.22);
    ctx.fillStyle = look.shirt;
    rr(ctx, -12, -38, 24, 24, 8); ctx.fill();
    ctx.save();
    rr(ctx, -12, -38, 24, 24, 8); ctx.clip();
    ctx.fillStyle = dark; ctx.fillRect(6, -38, 7, 24);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-10, -38, 4, 24);
    if (!dress) { ctx.fillStyle = dark; ctx.fillRect(-12, -18, 24, 4); }
    shirtStyle(ctx, look.shirtStyle);
    bodice(ctx, look);
    if (OF.top) topDetail(ctx, OF.top.style, look);
    // cổ áo
    if (!dress && look.shirtStyle !== 'overall' && !(OF.top && (OF.top.jacket || OF.top.style === 'school' || OF.top.style === 'armor'))) {
      ctx.fillStyle = light;
      ctx.beginPath(); ctx.moveTo(-7, -38); ctx.lineTo(0, -32); ctx.lineTo(7, -38); ctx.closePath(); ctx.fill();
      ctx.fillStyle = shade(look.skin, -0.08);
      ctx.beginPath(); ctx.moveTo(-4, -38); ctx.lineTo(0, -34); ctx.lineTo(4, -38); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    rr(ctx, -12, -38, 24, 24, 8); ol(ctx, 1.2);
    skirt(ctx, look, swing);
    if (B.skirt) {
      ctx.fillStyle = look.pants; ctx.beginPath(); ctx.moveTo(-12, -18); ctx.lineTo(12, -18); ctx.lineTo(16 + swing * 0.3, -9); ctx.lineTo(-16 + swing * 0.3, -9); ctx.closePath(); ctx.fill(); ol(ctx, 1.1);
      ctx.strokeStyle = shade(look.pants, -0.3); ctx.lineWidth = 1; for (let k = -8; k <= 8; k += 4) { ctx.beginPath(); ctx.moveTo(k * 0.8, -17); ctx.lineTo(k * 1.15, -10); ctx.stroke(); }
    }
    // thắt lưng
    if (!dress && !(OF.top && OF.top.jacket)) {
      ctx.fillStyle = '#3b2a1a'; ctx.fillRect(-11.5, -17.5, 23, 3);
      ctx.fillStyle = '#fcc419'; ctx.fillRect(-2, -18, 4, 4);
    }
    // tay
    [[-17.5, swing * 0.4], [10.5, -swing * 0.4]].forEach(([ax, sw]) => {
      ctx.fillStyle = (OF.top && OF.top.sleeve) || look.shirt; rr(ctx, ax, -36 + sw, 7, 12, 3.5); ctx.fill(); ol(ctx, 1.1);
      ctx.fillStyle = light; ctx.fillRect(ax + 1, -26 + sw, 5, 2);
      ctx.fillStyle = look.skin; ctx.beginPath(); ctx.arc(ax + 3.5, -21 + sw, 3.8, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1);
    });
    if (OF.top && OF.top.style === 'armor') [-14, 14].forEach((sx) => { ctx.fillStyle = '#f5c542'; ctx.beginPath(); ctx.ellipse(sx, -35, 7, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.1); });
    if (OF.top) setFx(ctx, OF.top.style, t);
    ctx.restore();

    // ---- đầu to
    ctx.save();
    headFrame(ctx);
    // tai
    [-18.5, 18.5].forEach((ex2) => { ctx.fillStyle = look.skin; ctx.beginPath(); ctx.arc(ex2, -53, 4.2, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1); });
    // mặt
    ctx.fillStyle = look.skin;
    ctx.beginPath(); ctx.arc(0, -55, 19, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.06)';
    ctx.beginPath(); ctx.arc(0, -55, 19, 0.15, Math.PI - 0.15); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -55, 19, 0, Math.PI * 2); ol(ctx, 1.1);
    face(ctx, look, dir, t);
    hairFront(ctx, look);
    accessory(ctx, look.acc, dir * 2, look.skin);
    hat(ctx, look.hat, dir);
    ctx.restore();
    ctx.restore();
  }

  /** Mắt to long lanh kiểu anime, má hồng, miệng cười */
  function face(ctx, look, dir, t) {
    const ex = dir * 2;
    const blink = (t * 0.35) % 4 > 3.88;
    const girly = GIRLY[look.hair];
    [-6.5, 6.5].forEach((dx) => {
      const cx = dx + ex, cy = -52;
      if (blink) { ctx.strokeStyle = '#2b1a10'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx - 3, cy); ctx.quadraticCurveTo(cx, cy + 1.6, cx + 3, cy); ctx.stroke(); return; }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(cx, cy, 3.6, 4.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b1a10'; ctx.beginPath(); ctx.ellipse(cx + dir * 0.4, cy + 0.4, 2.9, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5c3a21'; ctx.beginPath(); ctx.ellipse(cx + dir * 0.4, cy + 1.8, 2, 2.2, 0, 0, Math.PI * 2); ctx.fill();
      circle(ctx, cx - 0.9, cy - 1.6, 1.3, '#fff');
      circle(ctx, cx + 1.1, cy + 1.6, 0.6, '#fff');
      // mí trên đậm + mi cong ở đuôi mắt (tóc nữ)
      const o = dx < 0 ? -1 : 1;
      ctx.strokeStyle = '#2b1a10'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, cy, 3.6, 4.6, 0, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
      if (girly) { ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(cx + o * 3.2, cy - 2.4); ctx.quadraticCurveTo(cx + o * 4.8, cy - 2.8, cx + o * 5.4, cy - 1.6); ctx.stroke(); }
    });
    ctx.fillStyle = 'rgba(255,110,130,.42)';
    ctx.beginPath(); ctx.ellipse(-11 + ex, -46.5, 3.6, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(11 + ex, -46.5, 3.6, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a3b2e'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(ex, -46.5, 2.6, 0.25, Math.PI - 0.25); ctx.stroke();
  }

  /** Cánh thiên thần sau lưng (khẽ vỗ) */
  function wings(ctx, t) {
    const flap = Math.sin(t * 3) * 0.12;
    [-1, 1].forEach((sd) => {
      ctx.save();
      ctx.translate(sd * 5, -32);
      ctx.rotate(-sd * (0.45 + flap));
      ctx.scale(1.3, 1.3);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(sd * 18, -26, sd * 36, -22);
      ctx.quadraticCurveTo(sd * 31, -14, sd * 34, -10);
      ctx.quadraticCurveTo(sd * 26, -6, sd * 30, 0);
      ctx.quadraticCurveTo(sd * 20, 2, sd * 22, 8);
      ctx.quadraticCurveTo(sd * 10, 8, 0, 4);
      ctx.closePath(); ctx.fill(); ol(ctx, 1.2);
      ctx.strokeStyle = '#a5d8ff'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sd * 6, -2); ctx.quadraticCurveTo(sd * 18, -12, sd * 30, -14); ctx.moveTo(sd * 6, 2); ctx.quadraticCurveTo(sd * 16, -2, sd * 26, -3); ctx.stroke();
      ctx.restore();
    });
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
  /** Pha màu: amt > 0 sáng hơn, < 0 tối hơn */
  function shade(hex, amt) {
    const h = String(hex).replace('#', '');
    if (h.length !== 6) return hex;
    const n = parseInt(h, 16);
    const f = (c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  const DRESSES = {
    dress: { hem: 18, len: -6, belt: '#fff', bow: '#fff', lace: '#fff', pleats: 5 },
    dress_flower: { hem: 20, len: -6, belt: '#ff8fab', bow: '#ff8fab', lace: '#fff', pleats: 0, petticoat: true, print: true },
    princess: { hem: 25, len: -5, belt: '#fcc419', bow: '#fcc419', lace: '#fff8db', pleats: 0, layers: true, sparkle: true },
  };

  /** Váy: thân váy có cổ áo + nơ eo + tay phồng, chân váy xoè có nếp gấp và viền ren, đung đưa khi đi */
  function skirt(ctx, look, swing = 0) {
    const st = look.shirtStyle;
    if (st === 'witchdress') return witchSkirt(ctx, look);
    const D = DRESSES[st];
    if (!D) return;
    const base = look.shirt, light = shade(base, 0.35), dark = shade(base, -0.28);
    const sway = swing * 0.45, top = -18, bot = D.len, hw = D.hem;

    // lớp ren lót bên dưới (váy hoa, công chúa)
    if (D.petticoat || D.layers) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(-10, top + 3); ctx.lineTo(10, top + 3); ctx.lineTo(hw + 2 + sway, bot + 1);
      for (let k = 0; k < 8; k++) { const x = hw + 2 + sway - k * (2 * hw + 4) / 8; ctx.quadraticCurveTo(x - (2 * hw + 4) / 16, bot + 4, x - (2 * hw + 4) / 8, bot + 1); }
      ctx.closePath(); ctx.fill();
    }

    const layer = (w, b2, col1, col2) => {
      const g = ctx.createLinearGradient(0, top, 0, b2);
      g.addColorStop(0, col1); g.addColorStop(1, col2);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-11, top);
      ctx.lineTo(11, top);
      ctx.quadraticCurveTo(w * 0.7 + sway * 0.5, (top + b2) / 2, w + sway, b2);
      ctx.quadraticCurveTo(sway, b2 + 3.5, -w + sway, b2);
      ctx.quadraticCurveTo(-w * 0.7 + sway * 0.5, (top + b2) / 2, -11, top);
      ctx.closePath(); ctx.fill();
    };

    if (D.layers) {
      layer(hw, bot, base, dark);                       // lớp voan dưới
      layer(hw - 5, bot - 5, light, base);              // lớp voan trên ngắn hơn
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = -1; k <= 1; k++) { ctx.moveTo(k * 4, top + 1); ctx.quadraticCurveTo(k * 9 + sway * 0.6, (top + bot) / 2, k * (hw - 7) + sway, bot - 5); }
      ctx.stroke();
    } else {
      layer(hw, bot, light, base);
    }

    // nếp gấp xếp ly
    if (D.pleats) {
      ctx.strokeStyle = shade(base, -0.2); ctx.lineWidth = 1.3; ctx.lineCap = 'round';
      for (let k = 1; k < D.pleats; k++) {
        const t = k / D.pleats, xt = -9 + 18 * t, xb = -hw + 2 * hw * t + sway;
        ctx.beginPath(); ctx.moveTo(xt, top + 2); ctx.quadraticCurveTo((xt + xb) / 2 + sway * 0.3, (top + bot) / 2, xb, bot + 1); ctx.stroke();
      }
    }

    // hoạ tiết hoa nhí
    if (D.print) {
      const spots = [[-7, -13], [3, -14], [-12, -7], [-2, -8], [8, -9], [14, -4], [-16, -3], [5, -3], [-6, -3]];
      spots.forEach(([fx, fy], i) => {
        const x = fx + sway * ((fy - top) / (bot - top)), c = ['#fff', '#ffe066', '#ff8fab'][i % 3];
        for (let k = 0; k < 5; k++) { const an = k * 1.2566; circle(ctx, x + Math.cos(an) * 1.6, fy + Math.sin(an) * 1.6, 1.2, c); }
        circle(ctx, x, fy, 0.8, '#e8590c');
      });
    }

    // lấp lánh váy công chúa
    if (D.sparkle) {
      const t = performance.now() / 1000;
      [[-10, -8], [6, -11], [14, -5], [-3, -5], [-17, -3]].forEach(([sx, sy], i) => {
        const al = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i * 1.3));
        star(ctx, sx + sway * 0.7, sy, 2.4, 0.9, `rgba(255,255,255,${al})`);
      });
    }

    // viền ren gấu váy
    ctx.fillStyle = D.lace;
    const lw = D.layers ? hw - 5 : hw, lb = D.layers ? bot - 5 : bot;
    for (let k = 0; k < 9; k++) {
      const x = -lw + sway + (k + 0.5) * (2 * lw) / 9;
      const y = lb + 1.2 - Math.abs(k - 4) * 0.1;
      ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI); ctx.fill();
    }

    // thắt eo + nơ
    ctx.fillStyle = D.belt; ctx.fillRect(-11.5, top - 2, 23, 3.5);
    const bx = D.layers ? 0 : 7;
    ctx.fillStyle = D.bow;
    ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx - 6, top - 4); ctx.lineTo(bx - 6, top + 4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx + 6, top - 4); ctx.lineTo(bx + 6, top + 4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx - 1, top + 1); ctx.lineTo(bx - 3.5, top + 8); ctx.lineTo(bx - 0.5, top + 7); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(bx + 1, top + 1); ctx.lineTo(bx + 3.5, top + 8); ctx.lineTo(bx + 0.5, top + 7); ctx.closePath(); ctx.fill();
    circle(ctx, bx, top, 1.8, shade(D.bow === '#fff' ? '#dee2e6' : D.bow, -0.15));

    // tay áo phồng
    [-13, 13].forEach((sx) => {
      circle(ctx, sx, -34, 5.2, light);
      ctx.strokeStyle = D.lace; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(sx, -34, 5.2, 0.3, Math.PI - 0.3); ctx.stroke();
    });
  }

  /** Thân váy (vẽ trong khung thân áo): cổ áo, đổ bóng hai bên */
  function bodice(ctx, look) {
    const D = DRESSES[look.shirtStyle];
    if (!D) return;
    ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fillRect(-12, -37, 4, 23); ctx.fillRect(8, -37, 4, 23);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-5, -37, 6, 23);
    if (look.shirtStyle === 'princess') {
      ctx.fillStyle = shade(look.shirt, 0.45);
      ctx.beginPath(); ctx.moveTo(-9, -36); ctx.quadraticCurveTo(-4, -30, 0, -33); ctx.quadraticCurveTo(4, -30, 9, -36); ctx.lineTo(9, -38); ctx.lineTo(-9, -38); ctx.closePath(); ctx.fill();
      circle(ctx, 0, -30, 2, '#74c0fc'); circle(ctx, -0.6, -30.6, 0.7, '#fff');
    } else {
      ctx.fillStyle = D.lace;
      ctx.beginPath(); ctx.ellipse(-4, -36.5, 4.5, 3, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(4, -36.5, 4.5, 3, -0.3, 0, Math.PI * 2); ctx.fill();
      if (look.shirtStyle === 'dress') { circle(ctx, 0, -29, 1.1, '#fff'); circle(ctx, 0, -25, 1.1, '#fff'); }
    }
  }

  /** Trang sức: bông tai, dây chuyền, ngọc trai, kính */
  function accessory(ctx, acc, ex, skin) {
    if (!acc || acc === 'none') return;
    if (acc === 'chain') {
      ctx.strokeStyle = '#fcc419'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(0, -40, 9, 0.3, Math.PI - 0.3); ctx.stroke();
      circle(ctx, 0, -30.5, 3.4, '#fcc419'); circle(ctx, 0, -30.5, 1.6, '#e8590c');
      return;
    }
    if (acc === 'scarf') {
      ctx.fillStyle = '#e03131'; rr(ctx, -12, -40, 24, 6, 3); ctx.fill(); ol(ctx, 1);
      rr(ctx, 4, -36, 5, 11, 2); ctx.fill(); ol(ctx, 1);
      ctx.fillStyle = '#fff'; ctx.fillRect(4, -27, 5, 1.5); ctx.fillRect(-8, -38, 2, 2); ctx.fillRect(0, -38, 2, 2);
      return;
    }
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

  /* ---------- Tóc kiểu Avatar: phồng, nhiều lọn nhọn, có viền, đổ bóng và vệt bóng sáng ---------- */
  const BIG_HATS = { cap: 1, beanie: 1, nonla: 1, cowboy: 1, witch: 1, pumpkinhead: 1, beret: 1 };
  /** Lọn tóc nhọn: từ gốc (bx,by) hướng ra đầu nhọn (tx,ty), bề rộng w */
  function lock(ctx, bx, by, tx, ty, w, col) {
    const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w, ny = dx / L * w;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(bx - nx, by - ny);
    ctx.quadraticCurveTo(bx + dx * 0.55 - nx * 0.6, by + dy * 0.55 - ny * 0.6, tx, ty);
    ctx.quadraticCurveTo(bx + dx * 0.55 + nx * 0.3, by + dy * 0.55 + ny * 0.3, bx + nx, by + ny);
    ctx.closePath(); ctx.fill(); ol(ctx, 1.1);
  }
  /** Phần tóc ôm đầu + mái lởm chởm. tips: các đỉnh mái từ phải sang trái */
  function hairCap(ctx, c, tips, side = -44) {
    ctx.beginPath();
    ctx.moveTo(-21.5, side);
    ctx.quadraticCurveTo(-26, -60, -20, -69);
    ctx.arc(0, -58, 22, Math.PI * 1.15, Math.PI * 1.85);
    ctx.quadraticCurveTo(26, -60, 21.5, side);
    ctx.lineTo(17.5, -53);
    tips.forEach(([px, py], i) => {
      const prev = i ? tips[i - 1] : [17.5, -53];
      ctx.quadraticCurveTo((prev[0] + px) / 2 + 1, Math.min(prev[1], py) - 3, px, py);
    });
    ctx.lineTo(-17.5, -53);
    ctx.closePath();
    ctx.fillStyle = c; ctx.fill();
    // bóng sẫm phía dưới mái + vệt bóng sáng trên đỉnh
    ctx.save(); ctx.clip();
    ctx.fillStyle = shade(c, -0.28); ctx.fillRect(-30, -62, 60, 22);
    ctx.fillStyle = shade(c, -0.12); ctx.fillRect(-30, -66, 60, 4);
    ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -58, 15, Math.PI * 1.22, Math.PI * 1.48); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -58, 15, Math.PI * 1.56, Math.PI * 1.66); ctx.stroke();
    ctx.restore();
    ol(ctx, 1.3);
  }
  const FRINGE = {
    short: [[13, -58], [8, -63], [3, -57], [-2, -63], [-7, -57], [-12, -62], [-15, -56]],
    spiky: [[14, -56], [9, -63], [4, -55], [-1, -63], [-6, -56], [-11, -63], [-15, -55]],
    long: [[14, -58], [7, -64], [1, -58], [-5, -64], [-11, -58], [-15, -61]],
    bob: [[15, -58], [9, -59], [3, -58], [-3, -59], [-9, -58], [-15, -58]],
    emo: [[15, -60], [10, -64], [4, -58], [-2, -56], [-8, -52], [-13, -48], [-16, -47]],
    mohawk: [[12, -64], [-12, -64]],
  };

  /** Tóc phía sau đầu (vẽ trước thân): tóc dài, hai bím, xoăn */
  function hairBack(ctx, look) {
    const c = look.hairColor, d = shade(c, -0.2);
    if (look.hair === 'long') {
      ctx.fillStyle = d;
      ctx.beginPath(); ctx.moveTo(-22, -62); ctx.quadraticCurveTo(-28, -38, -24, -22); ctx.lineTo(-17, -26); ctx.lineTo(-12, -20); ctx.lineTo(0, -24); ctx.lineTo(12, -20); ctx.lineTo(17, -26); ctx.lineTo(24, -22); ctx.quadraticCurveTo(28, -38, 22, -62); ctx.closePath(); ctx.fill(); ol(ctx, 1.2);
    } else if (look.hair === 'pigtails') {
      [-1, 1].forEach((sd) => {
        ctx.save(); ctx.translate(sd * 25, -50); ctx.rotate(sd * -0.25);
        ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-5, -10); ctx.quadraticCurveTo(-11, 6, -2, 20); ctx.quadraticCurveTo(0, 14, 3, 21); ctx.quadraticCurveTo(10, 6, 5, -10); ctx.closePath(); ctx.fill(); ol(ctx, 1.2);
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-3, -4, 2, 12);
        ctx.restore();
      });
    } else if (look.hair === 'curly') {
      for (let i = 0; i < 9; i++) { const a = Math.PI * (0.85 + i * 0.165); ctx.fillStyle = d; ctx.beginPath(); ctx.arc(Math.cos(a) * 22, -54 + Math.sin(a) * 21, 8, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.1); }
    } else if (look.hair === 'bob') {
      ctx.fillStyle = d; rr(ctx, -24, -66, 48, 30, 10); ctx.fill(); ol(ctx, 1.2);
    }
  }

  function hairFront(ctx, look) {
    const c = look.hairColor, h = look.hair;
    if (h === 'bald') {
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.ellipse(-6, -68, 6, 3, -0.4, 0, Math.PI * 2); ctx.fill();
      return;
    }
    const big = BIG_HATS[look.hat];
    if (h === 'spiky' && !big) {
      // tóc dựng tua tủa: các lọn chĩa lên trên và sang hai bên
      [[-1.15, 33], [-0.85, 37], [-0.55, 39], [-0.25, 38], [0.08, 36], [0.38, 34]].forEach(([a, r]) => {
        const an = Math.PI * 1.5 + a * 1.25;
        lock(ctx, Math.cos(an) * 12, -58 + Math.sin(an) * 12, Math.cos(an) * r, -58 + Math.sin(an) * r, 7, c);
      });
      lock(ctx, -18, -56, -31, -46, 5, c); lock(ctx, 18, -56, 31, -47, 5, c);
    }
    if (h === 'mohawk' && !big) {
      for (let i = -2; i <= 2; i++) lock(ctx, i * 4, -70, i * 6, -92 + Math.abs(i) * 5, 4, c);
    }
    if (h === 'bun') {
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, -80, 9.5, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1.2);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -80, 6, Math.PI * 1.1, Math.PI * 1.5); ctx.stroke();
      ctx.fillStyle = '#ff6b9a'; rr(ctx, -6, -73, 12, 3.5, 1.5); ctx.fill(); ol(ctx, 0.9);
    }
    if (h === 'curly') {
      hairCap(ctx, c, FRINGE.short, -48);
      for (let i = 0; i < 7; i++) { const a = Math.PI * (1.1 + i * 0.13); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(Math.cos(a) * 18, -58 + Math.sin(a) * 18, 6.2, 0, Math.PI * 2); ctx.fill(); ol(ctx, 1); }
      return;
    }
    if (h === 'mohawk') {
      ctx.save(); ctx.globalAlpha = 0.55; hairCap(ctx, c, FRINGE.mohawk, -52); ctx.restore();
      return;
    }
    hairCap(ctx, c, FRINGE[h] || FRINGE.short, h === 'bob' ? -40 : h === 'long' || h === 'emo' ? -42 : -45);
    if (h === 'long') {
      // tóc mai dài buông trước vai
      [-1, 1].forEach((sd) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(sd * 21, -50); ctx.quadraticCurveTo(sd * 25, -36, sd * 21, -28); ctx.lineTo(sd * 17, -34); ctx.quadraticCurveTo(sd * 18, -42, sd * 17, -50); ctx.closePath(); ctx.fill(); ol(ctx, 1.1); });
    }
    if (h === 'pigtails') {
      circle(ctx, -18, -65, 3.6, '#ff6b9a'); circle(ctx, 18, -65, 3.6, '#ff6b9a');
      ctx.beginPath(); ctx.arc(-18, -65, 3.6, 0, Math.PI * 2); ol(ctx, 0.9);
      ctx.beginPath(); ctx.arc(18, -65, 3.6, 0, Math.PI * 2); ol(ctx, 0.9);
    }
  }

  function hat(ctx, h, dir) {
    if (!h || h === 'none') return;
    if (h === 'halo') {
      const tt = performance.now() / 1000;
      ctx.strokeStyle = 'rgba(255,224,102,.45)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(0, -86 + Math.sin(tt * 2) * 1.5, 15, 5, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#ffd43b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -86 + Math.sin(tt * 2) * 1.5, 15, 5, 0, 0, Math.PI * 2); ctx.stroke();
      return;
    }
    if (h === 'snapback') {
      ctx.fillStyle = '#212529'; ctx.beginPath(); ctx.arc(0, -63, 19.5, Math.PI, 0); ctx.fill(); ol(ctx, 1.2);
      ctx.fillStyle = '#343a40'; rr(ctx, -22, -65, 44, 5, 2); ctx.fill(); ol(ctx, 1);
      ctx.fillStyle = '#fcc419'; rr(ctx, -5, -78, 10, 7, 2); ctx.fill();
      return;
    }
    if (h === 'beanie_winter') {
      ctx.fillStyle = '#e03131'; ctx.beginPath(); ctx.arc(0, -62, 19.5, Math.PI, 0); ctx.fill(); ol(ctx, 1.2);
      ctx.fillStyle = '#fff'; rr(ctx, -20, -66, 40, 8, 4); ctx.fill(); ol(ctx, 1);
      [-10, 0, 10].forEach((xx) => star(ctx, xx, -73, 2.6, 1.1, '#fff'));
      circle(ctx, 0, -84, 6, '#fff'); ctx.beginPath(); ctx.arc(0, -84, 6, 0, Math.PI * 2); ol(ctx, 1);
      return;
    }
    if (h === 'catears') {
      [-1, 1].forEach((sd) => {
        ctx.fillStyle = '#212529'; ctx.beginPath(); ctx.moveTo(sd * 8, -74); ctx.lineTo(sd * 17, -90); ctx.lineTo(sd * 19, -70); ctx.closePath(); ctx.fill(); ol(ctx, 1.1);
        ctx.fillStyle = '#ff8fb1'; ctx.beginPath(); ctx.moveTo(sd * 11, -74); ctx.lineTo(sd * 16, -84); ctx.lineTo(sd * 17, -73); ctx.closePath(); ctx.fill();
      });
      ctx.strokeStyle = '#212529'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -57, 20, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      return;
    }
    if (h === 'laurel') {
      for (let i = 0; i < 6; i++) [-1, 1].forEach((sd) => {
        const a = Math.PI * (1.12 + i * 0.07);
        const lx = sd * Math.abs(Math.cos(a) * 20), ly = -58 + Math.sin(a) * 18;
        ctx.fillStyle = i % 2 ? '#fcc419' : '#f59f00'; ctx.beginPath(); ctx.ellipse(lx, ly, 4.5, 2.2, sd * (0.6 - i * 0.15), 0, Math.PI * 2); ctx.fill();
      });
      circle(ctx, 0, -77, 3, '#e03131');
      return;
    }
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

  function pig(ctx, x, y, dir, t, moving, seed = 0) {
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
    // lấm lem bùn
    if (seed) {
      const r = srand(seed * 97);
      for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? 'rgba(107,68,35,.75)' : 'rgba(139,90,43,.7)'; ctx.beginPath(); ctx.ellipse(-16 + r() * 30, -30 + r() * 16, 3 + r() * 5, 2 + r() * 3, r(), 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(107,68,35,.8)'; ctx.fillRect(-16, -8, 34, 4);
    }
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
    } else if (crop === 'tomato') {
      ctx.strokeStyle = '#8b5a2b'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y + 2); ctx.lineTo(x, y - 24); ctx.stroke();
      [[-6, -10], [6, -14], [-4, -20], [5, -6]].forEach(([dx, dy]) => { ctx.fillStyle = '#37b24d'; ctx.beginPath(); ctx.ellipse(x + dx + sway, y + dy, 5, 2.5, dx > 0 ? 0.5 : -0.5, 0, Math.PI * 2); ctx.fill(); });
      [[-5, -6], [5, -12], [-3, -17]].forEach(([dx, dy]) => { circle(ctx, x + dx + sway, y + dy, 4.4, '#f03e3e'); circle(ctx, x + dx + sway - 1.4, y + dy - 1.4, 1.3, 'rgba(255,255,255,.6)'); ctx.fillStyle = '#2b8a3e'; ctx.fillRect(x + dx + sway - 1, y + dy - 5, 2, 2); });
    } else if (crop === 'potato') {
      [[-6, -9], [6, -9], [0, -14], [-2, -6], [3, -5]].forEach(([dx, dy]) => circle(ctx, x + dx + sway * 0.4, y + dy, 5.5, '#40c057'));
      [[-6, 1], [5, 2], [0, 3]].forEach(([dx, dy]) => { ctx.fillStyle = '#c99a5b'; ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 4.6, 3.4, 0.2, 0, Math.PI * 2); ctx.fill(); circle(ctx, x + dx + 1, y + dy - 0.5, 0.7, '#8b5a2b'); });
    } else if (crop === 'cucumber') {
      ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.quadraticCurveTo(x, y - 26, x + 8, y - 4); ctx.stroke();
      [[-7, -14], [7, -16], [0, -22]].forEach(([dx, dy]) => circle(ctx, x + dx + sway * 0.5, y + dy, 5, '#51cf66'));
      [[-4, -6, -0.3], [5, -9, 0.4]].forEach(([dx, dy, a]) => { ctx.fillStyle = '#2b8a3e'; ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 2.6, 7.5, a, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + dx - 0.5, y + dy - 5, 1, 9); });
    } else if (crop === 'chili') {
      [[-6, -10], [6, -12], [0, -17], [0, -7]].forEach(([dx, dy]) => circle(ctx, x + dx + sway * 0.4, y + dy, 5, '#37b24d'));
      [[-6, -8, -0.5], [2, -12, 0.3], [6, -6, 0.6], [-1, -4, -0.2]].forEach(([dx, dy, a]) => { ctx.save(); ctx.translate(x + dx + sway * 0.4, y + dy); ctx.rotate(a); ctx.fillStyle = '#e03131'; ctx.beginPath(); ctx.moveTo(-1.8, -3); ctx.quadraticCurveTo(2.5, 2, 0, 7); ctx.quadraticCurveTo(-2.6, 2, -1.8, -3); ctx.fill(); ctx.fillStyle = '#2b8a3e'; ctx.fillRect(-1.6, -4.5, 2.4, 2); ctx.restore(); });
    } else if (crop === 'cabbage') {
      circle(ctx, x, y - 8, 10, '#8ce99a');
      [[-7, -6, -0.6], [7, -6, 0.6], [0, -2, 0]].forEach(([dx, dy, a]) => { ctx.fillStyle = '#51cf66'; ctx.beginPath(); ctx.ellipse(x + dx, y + dy, 7, 4.5, a, 0, Math.PI * 2); ctx.fill(); });
      circle(ctx, x, y - 10, 6, '#d3f9d8');
      ctx.strokeStyle = '#69db7c'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y - 10, 4, 0.4, 3.6); ctx.stroke();
    } else if (crop === 'grape') {
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(x - 1, y - 26, 2.4, 28); ctx.fillRect(x - 10, y - 26, 20, 2.2);
      [[-6, -22], [6, -23]].forEach(([dx, dy]) => circle(ctx, x + dx, y + dy, 5, '#40c057'));
      [[-3, -18], [1, -18], [5, -18], [-1, -14], [3, -14], [1, -10], [-5, -14]].forEach(([dx, dy]) => { circle(ctx, x + dx + sway * 0.6, y + dy, 2.6, '#7048e8'); circle(ctx, x + dx + sway * 0.6 - 0.8, y + dy - 0.8, 0.7, 'rgba(255,255,255,.6)'); });
    } else if (crop === 'banana') {
      ctx.fillStyle = '#a47148'; ctx.fillRect(x - 2, y - 22, 4, 24);
      [[-1, -0.9], [1, 0.9], [0, 0]].forEach(([sd, a]) => { ctx.save(); ctx.translate(x + sway, y - 22); ctx.rotate(a * 0.8 + (sd ? 0 : -0.1)); ctx.fillStyle = '#40c057'; ctx.beginPath(); ctx.ellipse(sd * 9, -4, 11, 4, sd * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.restore(); });
      [[-3, -14], [0, -12], [3, -14], [-1, -9], [2, -9]].forEach(([dx, dy]) => { ctx.fillStyle = '#ffd43b'; ctx.beginPath(); ctx.ellipse(x + dx + 2, y + dy, 1.8, 5, 0.3, 0, Math.PI * 2); ctx.fill(); });
    } else if (crop === 'pineapple') {
      [[-5, -18, -0.5], [0, -21, 0], [5, -18, 0.5], [-3, -16, -0.2], [3, -16, 0.2]].forEach(([dx, dy, a]) => { ctx.save(); ctx.translate(x + dx + sway * 0.5, y + dy); ctx.rotate(a); ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(0, -7); ctx.lineTo(2, 4); ctx.closePath(); ctx.fill(); ctx.restore(); });
      ctx.fillStyle = '#fcc419'; ctx.beginPath(); ctx.ellipse(x, y - 6, 6.5, 8.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e67700'; ctx.lineWidth = 0.9;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x - 6, y - 6 + k * 3.5 - 4); ctx.lineTo(x + 6, y - 6 + k * 3.5 + 4); ctx.moveTo(x + 6, y - 6 + k * 3.5 - 4); ctx.lineTo(x - 6, y - 6 + k * 3.5 + 4); ctx.stroke(); }
    } else if (crop === 'watermelon') {
      ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.ellipse(x - 8, y - 12, 6, 3, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#37b24d'; ctx.beginPath(); ctx.ellipse(x, y - 5, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#1b5e20'; ctx.lineWidth = 1.6;
      [-6, -2, 2, 6].forEach((dx) => { ctx.beginPath(); ctx.moveTo(x + dx, y - 12.5); ctx.quadraticCurveTo(x + dx * 1.3, y - 5, x + dx, y + 2.5); ctx.stroke(); });
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(x - 4, y - 8, 3, 1.6, -0.4, 0, Math.PI * 2); ctx.fill();
    } else if (crop === 'ginseng') {
      ctx.strokeStyle = '#2f9e44'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sway, y - 18); ctx.stroke();
      [0, 1.25, 2.5, 3.75, 5].forEach((a) => { ctx.fillStyle = '#40c057'; ctx.beginPath(); ctx.ellipse(x + sway + Math.cos(a) * 7, y - 16 + Math.sin(a) * 4, 5, 2.2, a, 0, Math.PI * 2); ctx.fill(); });
      [[-1.5, -21], [1.5, -21], [0, -23.5], [-2.5, -23], [2.5, -23]].forEach(([dx, dy]) => circle(ctx, x + dx + sway, y + dy, 1.8, '#e03131'));
      ctx.fillStyle = '#f1d6a6'; ctx.beginPath(); ctx.moveTo(x - 4, y - 2); ctx.quadraticCurveTo(x, y - 6, x + 4, y - 2); ctx.lineTo(x + 6, y + 4); ctx.lineTo(x + 1, y + 1); ctx.lineTo(x - 2, y + 5); ctx.lineTo(x - 5, y + 2); ctx.closePath(); ctx.fill();
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
    const top = -H - 12;
    // thân xe: trên trắng, dưới cam, sọc xanh
    ctx.fillStyle = '#fff';
    rr(ctx, -L / 2, top, L, H, 18); ctx.fill();
    const lower = ctx.createLinearGradient(0, -70, 0, -12);
    lower.addColorStop(0, '#ff922b'); lower.addColorStop(1, '#e8590c');
    ctx.fillStyle = lower;
    rr(ctx, -L / 2, -70, L, 58, [0, 0, 18, 18]); ctx.fill();
    ctx.fillStyle = '#1c7ed6'; ctx.fillRect(-L / 2, -74, L, 6);
    ctx.fillStyle = '#ffd43b'; ctx.fillRect(-L / 2, -20, L, 4);
    // mái + máy lạnh
    ctx.fillStyle = '#1971c2';
    rr(ctx, -L / 2, top, L, 22, [18, 18, 0, 0]); ctx.fill();
    ctx.fillStyle = '#dee2e6'; rr(ctx, -40, top - 10, 110, 12, 5); ctx.fill();
    ctx.fillStyle = '#adb5bd'; for (let k = 0; k < 5; k++) ctx.fillRect(-32 + k * 20, top - 7, 12, 3);
    // bảng điện tử tuyến xe trên mái
    ctx.fillStyle = '#212529'; rr(ctx, -L / 2 + 40, top + 3, 170, 16, 4); ctx.fill();
    ctx.font = '800 11px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd43b'; ctx.fillText('QL 01 · CẦU GIẤY', -L / 2 + 47, top + 11.5);
    // kính lái
    ctx.fillStyle = '#1864ab';
    rr(ctx, -L / 2 + 4, top + 26, 30, 50, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-L / 2 + 9, top + 30, 5, 40);
    // cửa sổ
    for (let i = 0; i < 4; i++) {
      const wx = -L / 2 + 44 + i * 46;
      ctx.fillStyle = '#1864ab'; rr(ctx, wx, top + 26, 40, 40, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(wx + 4, top + 30, 7, 32);
    }
    // cửa lên xuống
    ctx.fillStyle = '#1864ab';
    rr(ctx, L / 2 - 66, top + 26, 46, 104, 6); ctx.fill();
    ctx.fillStyle = '#4dabf7'; ctx.fillRect(L / 2 - 44, top + 26, 2, 104);
    // chữ QUANG LÂM to rõ trên thân xe
    ctx.font = '900 27px "Be Vietnam Pro", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#7a2e00';
    ctx.strokeText('QUANG LÂM', -30, -46);
    ctx.fillStyle = '#fff'; ctx.fillText('QUANG LÂM', -30, -46);
    // đèn pha, đèn hậu
    circle(ctx, -L / 2 + 9, -30, 6, '#fff3bf');
    ctx.fillStyle = '#e03131'; rr(ctx, L / 2 - 8, -66, 6, 18, 3); ctx.fill();
    ctx.fillStyle = '#343a40'; rr(ctx, -L / 2 - 4, -18, 14, 8, 3); ctx.fill();
    // bánh xe
    [-L / 2 + 64, L / 2 - 96].forEach((wx) => {
      ctx.fillStyle = '#c2410c'; ctx.beginPath(); ctx.arc(wx, -8, 28, Math.PI, 0); ctx.fill();
      circle(ctx, wx, -8, 22, '#212529');
      circle(ctx, wx, -8, 11, '#adb5bd');
      ctx.save(); ctx.translate(wx, -8); ctx.rotate(moving ? t * 10 : 0);
      ctx.fillStyle = '#495057'; ctx.fillRect(-2, -9, 4, 18); ctx.fillRect(-9, -2, 18, 4);
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
    srand,isPainted, avatarOf,  rr, shadow, circle, label, bubble, iconBubble, character, chicken, cow, sheep, pig,
    tree, bush, lamp, hayStack, hayBale, picketsH, picket, woodPost, rope, nestBox, plot, plant,
    house, mailbox, stall, boutique, fountain, bench, busStop, bus, pond, star, heart,
  };
})();
