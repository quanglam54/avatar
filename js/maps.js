/* Xây dựng bản đồ: cảnh vật, vật cản, điểm tương tác, động vật, NPC */
const MAPS = (() => {
  function base(id, name, w, h) {
    return { id, name, w, h, hz: HZ, objects: [], colliders: [], inter: [], animals: [], npcs: [], labels: [], pickups: [] };
  }
  const HZ = 340;
  /** bb = [trái, trên, phải, dưới]: ngoài màn hình thì không vẽ (đỡ nóng máy) */
  const obj = (m, y, draw, bb) => m.objects.push({ y, draw, bb });
  const bbOf = (x, y, box) => [x + box.l, y + box.t, x + box.l + box.w, y + box.t + box.h];
  /** Đồ vật tĩnh: vẽ sẵn một lần, có viền đậm kiểu Avatar */
  const sobj = (m, x, y, draw, box = FX.BOX.object, sortY = y) => m.objects.push({ y: sortY, s: 1, draw: FX.sprite(draw, x, y, box), bb: bbOf(x, y, box) });
  /** Đồ vật chuyển động: vẽ lại mỗi khung hình, có viền */
  const aobj = (m, x, y, draw, box) => { const key = {}; m.objects.push({ y, draw: (ctx, t) => FX.drawCached(ctx, key, (c) => draw(c, t), x, y, box, 90), bb: bbOf(x, y, box) }); };
  const col = (m, x, y, w, h) => m.colliders.push({ x, y, w, h });
  /** 🛋️ Đồ dời được: mọi hình / vật cản / chỗ bấm do fn() tạo ra thành 1 nhóm, dời cả nhóm theo (dx, dy) */
  function mv(m, key, fn) {
    m.movables = m.movables || [];
    const o0 = m.objects.length, c0 = m.colliders.length, i0 = m.inter.length;
    fn();
    const g = { key, dx: 0, dy: 0, objs: m.objects.slice(o0), cols: m.colliders.slice(c0), ints: m.inter.slice(i0) };
    g.objs.forEach((o) => {
      o.y0 = o.y; o.bb0 = o.bb ? o.bb.slice() : null;
      const d = o.draw;
      o.draw = (ctx, t) => { if (!g.dx && !g.dy) return d(ctx, t); ctx.save(); ctx.translate(g.dx, g.dy); d(ctx, t); ctx.restore(); };
    });
    g.cols.forEach((c) => { c.x0 = c.x; c.y0 = c.y; });
    g.ints.forEach((it) => { it.o0 = { x: it.x, y: it.y, ax: it.ax, ay: it.ay, ix: it.ix, iy: it.iy, ar: it.arrow ? { x: it.arrow.x, y: it.arrow.y } : null }; });
    const bbs = g.objs.map((o) => o.bb0).filter(Boolean);
    g.bb0 = bbs.length ? [Math.min(...bbs.map((b) => b[0])), Math.min(...bbs.map((b) => b[1])), Math.max(...bbs.map((b) => b[2])), Math.max(...bbs.map((b) => b[3]))] : null;
    g.when = (g.cols.find((c) => c.when) || g.ints.find((i) => i.when) || {}).when || null;
    g.name = (g.ints[0] && g.ints[0].name) || 'Đồ trang trí';
    if (g.bb0) m.movables.push(g);
    return g;
  }
  function moveGroup(g, dx, dy) {
    g.dx = dx; g.dy = dy;
    g.objs.forEach((o) => { o.y = o.y0 + dy; if (o.bb0) o.bb = [o.bb0[0] + dx, o.bb0[1] + dy, o.bb0[2] + dx, o.bb0[3] + dy]; });
    g.cols.forEach((c) => { c.x = c.x0 + dx; c.y = c.y0 + dy; });
    g.ints.forEach((it) => {
      const o = it.o0;
      it.x = o.x + dx; it.y = o.y + dy;
      if (o.ax != null) it.ax = o.ax + dx;
      if (o.ay != null) it.ay = o.ay + dy;
      if (o.ix != null) it.ix = o.ix + dx;
      if (o.iy != null) it.iy = o.iy + dy;
      if (o.ar) it.arrow = { ...it.arrow, x: o.ar.x + dx, y: o.ar.y + dy };
    });
  }
  const inter = (m, o) => m.inter.push(o);
  const FLOWERS = ['#ff8fab', '#ffd43b', '#fff', '#da77f2'];

  /* ---------- Nền đất vẽ sẵn một lần ---------- */
  function ground(m, painter) {
    m.paintGround = painter;
    m.ground = null;
  }

  /** Nền đất vàng của nông trại kiểu Avatar */
  function paintDirt(g, x, y, w, h, seed) {
    g.fillStyle = '#d6c08a';
    g.fillRect(x, y, w, h);
    const r = ART.srand(seed);
    for (let i = 0; i < (w * h) / 260; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(150,115,60,.28)' : 'rgba(255,245,215,.45)';
      g.fillRect(x + r() * w, y + r() * h, 2 + r() * 3, 2);
    }
  }

  /** Ô cỏ xanh nổi trên nền đất, có viền đậm như Avatar */
  function paintBlock(g, x, y, w, h, seed) {
    g.fillStyle = '#3f8f22';
    g.beginPath(); g.roundRect(x - 3, y - 3, w + 6, h + 9, 12); g.fill();
    g.fillStyle = '#5fc236';
    g.beginPath(); g.roundRect(x, y, w, h, 10); g.fill();
    g.fillStyle = '#74d248';
    g.beginPath(); g.roundRect(x + 6, y + 5, w - 12, h - 14, 8); g.fill();
    const r = ART.srand(seed);
    g.strokeStyle = '#4ba82b'; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 0; i < (w * h) / 420; i++) {
      const tx = x + 10 + r() * (w - 20), ty = y + 10 + r() * (h - 22);
      g.beginPath(); g.moveTo(tx - 3, ty - 5); g.lineTo(tx, ty); g.lineTo(tx + 3, ty - 6); g.stroke();
    }
    for (let i = 0; i < (w * h) / 5000; i++) {
      const fx = x + 12 + r() * (w - 24), fy = y + 12 + r() * (h - 26);
      g.fillStyle = ['#fff', '#ffe066', '#ff8fab'][i % 3];
      for (let k = 0; k < 5; k++) { const a = k * 1.2566; g.beginPath(); g.arc(fx + Math.cos(a) * 2.2, fy + Math.sin(a) * 2.2, 1.8, 0, 7); g.fill(); }
    }
  }

  function paintGrass(g, w, h, seed) {
    g.fillStyle = '#72c844';
    g.fillRect(0, 0, w, h);
    const r = ART.srand(seed);
    for (let i = 0; i < (w * h) / 5000; i++) {
      g.fillStyle = 'rgba(160,225,110,.35)';
      g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 60, 12 + r() * 25, 0, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = '#53a830'; g.lineWidth = 2; g.lineCap = 'round';
    for (let i = 0; i < (w * h) / 700; i++) {
      const x = r() * w, y = r() * h;
      g.beginPath(); g.moveTo(x - 3, y - 6); g.lineTo(x, y); g.lineTo(x + 3, y - 7); g.stroke();
    }
    for (let i = 0; i < (w * h) / 9000; i++) {
      const x = r() * w, y = r() * h;
      const colr = ['#fff', '#ffe066', '#ffa8a8', '#d0bfff'][Math.floor(r() * 4)];
      for (let k = 0; k < 5; k++) {
        const a = k * Math.PI * 2 / 5;
        g.fillStyle = colr; g.beginPath(); g.arc(x + Math.cos(a) * 2.4, y + Math.sin(a) * 2.4, 2, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = '#fab005'; g.beginPath(); g.arc(x, y, 1.4, 0, Math.PI * 2); g.fill();
    }
  }

  function paintDirtRoad(g, w, y1, y2, seed) {
    g.fillStyle = '#d9b382';
    g.fillRect(0, y1, w, y2 - y1);
    g.fillStyle = '#c99e6a';
    g.fillRect(0, y1, w, 4); g.fillRect(0, y2 - 4, w, 4);
    const r = ART.srand(seed);
    for (let i = 0; i < w / 6; i++) {
      g.fillStyle = r() > 0.5 ? 'rgba(160,120,70,.35)' : 'rgba(255,240,210,.4)';
      g.beginPath(); g.ellipse(r() * w, y1 + 8 + r() * (y2 - y1 - 16), 2 + r() * 3, 1.5 + r() * 2, 0, 0, Math.PI * 2); g.fill();
    }
  }

  function paintPaved(g, x0, y0, w, h, color = '#e9dcc4') {
    g.fillStyle = color;
    g.beginPath(); g.roundRect(x0, y0, w, h, 40); g.fill();
    g.strokeStyle = 'rgba(150,120,80,.18)'; g.lineWidth = 2;
    for (let y = y0 + 30; y < y0 + h - 20; y += 34) {
      for (let x = x0 + 30 + ((y / 34) % 2) * 22; x < x0 + w - 40; x += 44) {
        g.beginPath(); g.roundRect(x, y, 40, 30, 6); g.stroke();
      }
    }
  }

  function paintStreet(g, w, y1, y2) {
    g.fillStyle = '#d5ccbd'; g.fillRect(0, y1 - 22, w, 22);
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 44) { g.beginPath(); g.moveTo(x, y1 - 22); g.lineTo(x, y1); g.stroke(); }
    g.fillStyle = '#9b9384'; g.fillRect(0, y1 - 3, w, 5);
    g.fillStyle = '#b8ad9a'; g.fillRect(0, y1, w, y2 - y1);
    const r = ART.srand(w + y1);
    g.fillStyle = 'rgba(0,0,0,.05)';
    for (let i = 0; i < w / 4; i++) g.fillRect(r() * w, y1 + r() * (y2 - y1), 3, 2);
    g.fillStyle = '#f1e9da';
    for (let x = 20; x < w; x += 90) g.fillRect(x, (y1 + y2) / 2 - 3, 50, 6);
    g.fillStyle = '#9b9384'; g.fillRect(0, y2 - 2, w, 5);
  }

  /* ---------- Đồ vật ---------- */
  function addTree(m, x, y, variant) {
    sobj(m, x, y, (c) => ART.tree(c, x, y, variant));
    col(m, x - 14, y - 10, 28, 12);
  }
  function addBush(m, x, y, flower) {
    sobj(m, x, y, (c) => ART.bush(c, x, y, flower));
    col(m, x - 26, y - 12, 52, 12);
  }
  function addLamp(m, x, y) {
    sobj(m, x, y, (c) => ART.lamp(c, x, y, false));
    col(m, x - 6, y - 6, 12, 8);
  }
  function addPot(m, x, y, kind) {
    sobj(m, x, y, (c) => ART.flowerPot(c, x, y, kind));
    col(m, x - 16, y - 10, 32, 12);
  }
  function addBench(m, x, y) {
    sobj(m, x, y, (c) => ART.bench(c, x, y));
    col(m, x - 42, y - 10, 84, 12);
  }
  /** Bến xe buýt có nhà chờ (mái che, ghế ngồi đợi) + cột biển trạm. side -1: nhà chờ bên trái cột, 1: bên phải */
  function addBusStop(m, x, y, side = -1) {
    m.busStop = { x, y };
    const L = side < 0 ? x - 170 : x + 70, R = side < 0 ? x + 20 : x + 260;
    sobj(m, x, y, (c) => ART.busShelter(c, x, y, side), { l: Math.min(L, x) - x - 20, t: -180, w: Math.max(R, x + 70) - Math.min(L, x) + 40, h: 195 }, y - 60);
    col(m, L + 4, y - 44, R - L - 8, 8);
    col(m, x + 35, y - 5, 10, 6);
    inter(m, { x: x + 14, y: y - 172, w: 52, h: 176, ax: x + 44, ay: y + 12, name: 'Trạm xe buýt (bản đồ thành phố)', use: () => AV.useBusStop() });
    inter(m, { x: L + 14, y: y - 70, w: R - L - 28, h: 66, ax: (L + R) / 2, ay: y + 12, name: 'Ghế chờ xe buýt (ngồi đợi)', use: () => AV.sitBusBench(L, R, y) });
  }

  /** Toà nhà / đồ vật vẽ sẵn (ảnh PNG). (x, y) = giữa chân ảnh, w = bề rộng trong game.
   *  o.sign = chữ ghi lên biển hiệu trống { text, x, y, w (tỉ lệ theo ảnh), color }; o.fallback = vẽ hình cũ khi ảnh chưa tải xong */
  function pic(m, src, x, y, w, o = {}) {
    IMG.get(src);
    const hh = o.h || w * 1.1;
    let cache = null;
    obj(m, o.sortY ?? y, (ctx) => {
      const im = IMG.get(src);
      if (!im) { if (o.fallback) o.fallback(ctx, performance.now() / 1000); return; }
      if (!ob.s) { ob.s = 1; ob.repaint = true; }
      const h = w * im.naturalHeight / im.naturalWidth, k = FX.scale;
      if (!cache || cache.k !== k) {
        // thu nhỏ ảnh + ghi chữ biển hiệu MỘT lần (đỡ nặng cho điện thoại)
        const c = document.createElement('canvas');
        c.width = Math.ceil(w * k); c.height = Math.ceil(h * k);
        const g = c.getContext('2d');
        g.imageSmoothingQuality = 'high';
        g.scale(k, k);
        g.translate(w / 2 - x, h - y);
        paint(g, im, h);
        cache = { c, k };
      }
      ctx.drawImage(cache.c, x - w / 2, y - h, w, h);
    }, [x - w / 2 - 10, y - hh - 20, x + w / 2 + 10, y + 10]);
    const ob = m.objects[m.objects.length - 1];
    function paint(ctx, im, h) {
      ctx.drawImage(im, x - w / 2, y - h, w, h);
      const sg = o.sign;
      if (sg) {
        ctx.save();
        let size = sg.size || 26;
        const font = (n) => `900 ${n}px "Be Vietnam Pro", system-ui, sans-serif`;
        ctx.font = font(size);
        while (size > 10 && ctx.measureText(sg.text).width > w * sg.w) ctx.font = font(--size);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
        const tx = x - w / 2 + sg.x * w, ty = y - h + sg.y * h;
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.strokeText(sg.text, tx, ty);
        ctx.fillStyle = sg.color; ctx.fillText(sg.text, tx, ty);
        ctx.restore();
      }
    }
  }

  /** Hàng rào gỗ + luống tulip ở đường chân trời, tulip viền dưới đáy — giống nhau ở mọi khu */
  function edges(m, top = true) {
    if (top) sobj(m, 0, HZ + 18, (c) => { ART.woodFence(c, 0, m.w, HZ + 2); ART.tulips(c, 0, m.w, HZ + 18); }, { l: -10, t: -70, w: m.w + 20, h: 74 });
    sobj(m, 0, 1046, (c) => ART.tulips(c, 0, m.w, 1046), { l: -10, t: -42, w: m.w + 20, h: 46 });
  }

  /** Đường nhựa và trạm xe buýt — giống nhau ở mọi khu */
  /** Cột biển tên đường bên vỉa hè */
  const STREETS = ['Hồ Tùng Mậu', 'Cầu Giấy'];
  function addStreetSign(m, x, y, names = STREETS) {
    sobj(m, x, y, (c) => ART.streetSign(c, x, y, names), { l: -150, t: -160, w: 300, h: 166 });
    col(m, x - 5, y - 6, 10, 8);
  }

  function street(m, busX = 1000, sign2X = m.w - 320) {
    addBusStop(m, busX, 862);
    addStreetSign(m, 600, 860);
    addStreetSign(m, sign2X, 860, [...STREETS].reverse());
    edges(m);
  }

  function picketPen(m, L, T, R, B) {
    const hb = { l: -10, t: -48, w: R - L + 20, h: 52 };
    sobj(m, L, T, (c) => ART.picketsH(c, L, R, T), hb);
    sobj(m, L, B, (c) => ART.picketsH(c, L, R, B), hb);
    for (let y = T + 19; y < B - 4; y += 19) {
      sobj(m, L, y, (c) => { ART.picket(c, L + 6, y); ART.picket(c, R - 6, y); }, hb);
    }
    col(m, L - 6, T - 12, R - L + 12, 14);
    col(m, L - 6, B - 12, R - L + 12, 14);
    col(m, L - 6, T - 12, 16, B - T + 14);
    col(m, R - 10, T - 12, 16, B - T + 14);
  }

  function woodPen(m, L, T, R, B) {
    const n = Math.round((R - L) / 64), sx = (R - L) / n;
    const xs = Array.from({ length: n + 1 }, (_, i) => L + i * sx);
    [T, B].forEach((y) => {
      sobj(m, L, y, (c) => {
        for (let i = 0; i < n; i++) ART.rope(c, xs[i], y, xs[i + 1], y);
        xs.forEach((x) => ART.woodPost(c, x, y));
      }, { l: -16, t: -56, w: R - L + 32, h: 62 });
    });
    const k = Math.round((B - T) / 62), sy = (B - T) / k;
    for (let j = 1; j < k; j++) {
      const y = T + j * sy, yPrev = T + (j - 1) * sy;
      sobj(m, L, y, (c) => {
        [L, R].forEach((x) => { ART.rope(c, x, yPrev, x, y); ART.woodPost(c, x, y); });
      }, { l: -16, t: -130, w: R - L + 32, h: 136 });
    }
    obj(m, B - 1, (ctx) => [L, R].forEach((x) => ART.rope(ctx, x, T + (k - 1) * sy, x, B)));
    col(m, L - 8, T - 10, R - L + 16, 12);
    col(m, L - 8, B - 10, R - L + 16, 12);
    col(m, L - 8, T - 10, 16, B - T + 12);
    col(m, R - 8, T - 10, 16, B - T + 12);
  }

  function animal(m, kind, area, seed) {
    const x = area.l + Math.random() * (area.r - area.l);
    const y = area.t + Math.random() * (area.b - area.t);
    m.animals.push({ kind, x, y, tx: x, ty: y, area, wait: Math.random() * 3, dir: Math.random() > 0.5 ? 1 : -1, t: Math.random() * 10, moving: false, seed });
  }

  function npc(m, name, look, area, x, y, pet) {
    m.npcs.push({ name, look: { pet: pet || 'none', ...look, npc: true }, kind: 'npc', x, y, tx: x, ty: y, area, wait: 1 + Math.random() * 3, dir: 1, t: Math.random() * 5, moving: false, nextTalk: 3 + Math.random() * 10, bubble: null, px: x - 30, py: y });
  }

  /* ---------- Nông trại mở rộng: tường bao, cổng, 8 luống, khu gà, khu bò cừu, ao, vườn ---------- */
  function farm() {
    const m = base('farm', 'Nông trại', 5400, 1600);
    m.busY = 1555;
    m.lights = [];
    const WL = 140, WR = 5260, WT = 420, WB = 1300, GATE = 1600;
    const BL = {
      field: [180, 442, 2080, 420], home: [2300, 450, 780, 330],
      pasture: [180, 882, 840, 378], pond: [1100, 882, 400, 378], coop: [1700, 882, 330, 378], garden: [2045, 882, 1380, 378],
      play: [3120, 450, 600, 390], play2: [3465, 882, 255, 378],
      orchard: [3800, 450, 1380, 330], yard: [3800, 860, 1380, 400],
    };
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 11);
      paintDirt(g, WL + 10, WT + 10, WR - WL - 20, WB - WT - 14, 4);
      Object.values(BL).forEach(([x, y, w, h], i) => paintBlock(g, x, y, w, h, i + 1));
      // lối đá từ cổng ra trạm xe buýt
      g.fillStyle = '#cdbb8c'; g.fillRect(GATE - 70, WB - 6, 140, 150);
      g.fillStyle = 'rgba(255,255,255,.25)';
      for (let y = WB + 4; y < WB + 140; y += 24) for (let x = GATE - 62; x < GATE + 60; x += 30) { g.beginPath(); g.roundRect(x, y, 26, 18, 5); g.fill(); }
      paintStreet(g, m.w, 1440, 1570);
    });

    /* ----- Tường rào + cổng ----- */
    sobj(m, WL, WT, (c) => ART.wallH(c, WL, WR, WT), { l: -30, t: -112, w: WR - WL + 60, h: 120 });
    col(m, WL - 12, WT - 14, WR - WL + 24, 16);
    for (let y = WT + 60; y <= WB; y += 60) {
      sobj(m, WL, y, (c) => { ART.wallV(c, WL, y, 60); ART.wallV(c, WR, y, 60); }, { l: -20, t: -126, w: WR - WL + 40, h: 132 });
    }
    col(m, WL - 12, WT, 24, WB - WT);
    col(m, WR - 12, WT, 24, WB - WT);
    // chặn lối hai bên hông bên ngoài tường
    col(m, 0, WT - 20, WL - 12, WB - WT + 20);
    col(m, WR + 12, WT - 20, m.w - WR - 12, WB - WT + 20);
    sobj(m, WL, WB, (c) => ART.wallH(c, WL, GATE - 108, WB), { l: -30, t: -112, w: GATE - 108 - WL + 60, h: 120 });
    sobj(m, GATE + 108, WB, (c) => ART.wallH(c, GATE + 108, WR, WB), { l: -30, t: -112, w: WR - GATE - 108 + 60, h: 120 });
    col(m, WL - 12, WB - 14, GATE - 92 - WL, 16);
    col(m, GATE + 92, WB - 14, WR - GATE - 80, 16);
    pic(m, 'img/farm/' + 'gate.png', GATE, WB + 40, 300, { h: 300, sortY: WB + 2, sign: { text: 'NÔNG TRẠI', x: 0.5, y: 0.17, w: 0.36, color: '#7a3d0c' }, fallback: (c) => ART.farmGate(c, GATE, WB + 2) });
    m.labels.push({ text: '', x: GATE, y: WB - 232, dynamic: 'gate' });
    for (let x = WL; x <= WR; x += 220) m.lights.push([x + 26, WT - 62, 42]);
    m.lights.push([GATE - 60, WB - 126, 46], [GATE + 60, WB - 126, 46]);

    /* ----- Khu trồng trọt: 18 luống liền nhau (3 hàng × 6). Đất chưa mua chỉ có biển "Mua đất" ----- */
    m.labels.push({ text: '🌾 Khu Trồng Trọt', x: 1220, y: 442 });
    const BD = ART.BED;
    /** Vẽ 1 luống + 12 ô bấm được */
    const addBed = (bedIdx, bx, by, tileName) => {
      // luống được vẽ sẵn vào bộ đệm, chỉ vẽ lại khi cây đổi trạng thái (lớn, khát, sâu, chín…) → ruộng kín cây vẫn mượt
      const L = bx - 10, T = by - 72, BWc = BD.w + 20, BHc = BD.h + 94;
      let sig = '', at = 0, tiles = [], owned = false, cv = null, sc = 0;
      obj(m, by + BD.h - 25, (ctx, t) => {
        const now = performance.now(), Fm = AV.F();
        if (now - at > 400 || Fm !== addBed.lastF) {
          at = now; addBed.lastF = Fm;
          owned = !!Fm.beds[bedIdx];
          tiles = Fm.tiles.slice(bedIdx * 12, bedIdx * 12 + 12).map((x) => ({ crop: x.crop, st: AV.tileState(x), wet: x.watered, fert: x.fert, stolen: x.stolen }));
          const s2 = (owned ? 1 : 0) + '|' + tiles.map((q) => `${q.crop || ''}${q.st.stage}${q.st.thirsty ? 't' : ''}${q.wet ? 'w' : ''}${q.fert ? 'f' : ''}${q.stolen ? 's' : ''}`).join(',');
          if (s2 !== sig) { sig = s2; sc = 0; }
        }
        const S2 = Math.min(2, FX.scale);
        if (sc !== S2 || !cv) {
          sc = S2;
          cv = cv || document.createElement('canvas');
          cv.width = Math.ceil(BWc * S2); cv.height = Math.ceil(BHc * S2);
          const g = cv.getContext('2d');
          g.setTransform(S2, 0, 0, S2, -L * S2, -T * S2);
          ART.bed(g, bx, by, owned, DATA.BED_PRICES[bedIdx], tiles, 0, 'base');
        }
        ctx.drawImage(cv, L, T, BWc, BHc);
        if (owned) ART.bed(ctx, bx, by, owned, 0, tiles, t, 'over');
      }, [L, T, L + BWc, T + BHc]);
      m.objects[m.objects.length - 1].bed = { idx: bedIdx, bx, by };
      for (let k = 0; k < 12; k++) {
        const i = bedIdx * 12 + k;
        const tx = bx + BD.padX + (k % 6) * BD.step, ty = by + BD.padY + Math.floor(k / 6) * BD.step;
        inter(m, {
          x: tx - 2, y: ty - 2, w: BD.tile + 4, h: BD.tile + 4, ax: tx + BD.tile / 2, ay: by + BD.h + 8, name: tileName,
          use: () => AV.useTile(i), indicator: k === 0 ? () => AV.bedIndicator(bedIdx) : null, ix: bx + BD.w / 2, iy: by - 2, tile: i,
        });
      }
    };
    const FX0 = 180 + (2080 - (BD.w * 6 + 40 * 5)) / 2, FY0 = 458, FSTEP = BD.h + 34; // chừa lối giữa các hàng luống cho dễ bấm
    // thứ tự luống giữ nguyên số luống cũ (0–7 ruộng chính, 12–19 đất mở rộng, 20–21 đất mới) để không mất cây đang trồng
    [0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].forEach((bedIdx, slot) => addBed(bedIdx, FX0 + (slot % 6) * (BD.w + 40), FY0 + Math.floor(slot / 6) * FSTEP, 'Ô ruộng'));
    // 🧑‍🌾 cô giúp việc (chỉ hiện khi đã thuê, ở nông trại của chính mình)
    npc(m, 'Cô giúp việc', { skin: '#f1c27d', hair: 'bun', hairColor: '#3b2a1a', shirt: '#74c0fc', shirtStyle: 'plain', pants: '#495057', hat: 'nonla' }, { l: 260, t: 870, r: 2150, b: 880 }, 900, 875, 'none');
    Object.assign(m.npcs[m.npcs.length - 1], { helper: true, show: () => AV.helperActive && AV.helperActive() && !(AV.visiting && AV.visiting()) });

    /* ----- 📦 Thùng giao hàng ----- */
    sobj(m, 2262, 760, (c) => {
      c.fillStyle = '#8a5a32'; c.beginPath(); c.roundRect(2232, 712, 60, 48, 6); c.fill();
      c.fillStyle = '#a0632f'; c.fillRect(2228, 704, 68, 14);
      c.strokeStyle = '#5c3d1e'; c.lineWidth = 3; c.strokeRect(2232, 718, 60, 42);
      c.font = '20px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('📦', 2262, 738);
    }, { l: -40, t: -60, w: 80, h: 66 });
    col(m, 2234, 740, 56, 20);
    inter(m, { x: 2228, y: 700, w: 68, h: 62, ax: 2262, ay: 790, name: 'Thùng giao hàng (bán qua đêm +10%)', use: () => UI.shipBin(), arrow: { x: 2262, y: 690, text: 'Giao hàng' } });

    /* ----- Nhà + cửa hàng + bếp nằm cạnh nhau ----- */
    const SX = 2400, SY = 742;
    sobj(m, SX, SY, (c) => { c.save(); c.translate(SX, SY); c.scale(0.82, 0.82); ART.seedStall(c, 0, 0); c.restore(); }, { l: -95, t: -150, w: 190, h: 160 });
    col(m, SX - 78, SY - 38, 156, 36);
    inter(m, { x: SX - 88, y: SY - 140, w: 176, h: 140, ax: SX, ay: SY + 26, name: 'Cửa hàng nông trại (mua hạt giống, phân bón, thuốc · bán đồ)', use: () => UI.seedShop(), arrow: { x: SX, y: SY - 144, text: 'Cửa hàng' } });
    const HX = 2650, KX = 2960;
    {
      const hsp = [1, 2, 3, 4].map((lv) => FX.sprite((c) => houseArt(c, HX, 720, lv), HX, 720, { l: -175, t: -250 - (lv - 1) * 104, w: 350, h: 262 + (lv - 1) * 104 }));
      const tw = {};
      const tower = (lv) => (tw[lv] = tw[lv] || FX.sprite((c) => towerArt(c, HX, 720, lv), HX, 720, { l: -175, t: -700, w: 350, h: 712 }));
      m.objects.push({ y: 720, bb: [HX - 175, 720 - 700, HX + 175, 732], draw: (ctx) => { const lv = AV.F().house || 1; (lv >= 5 ? tower(lv) : hsp[Math.max(1, lv) - 1])(ctx); } });
    }
    col(m, HX - 102, 620, 204, 100);
    inter(m, { x: HX - 105, y: 540, w: 210, h: 180, ax: HX, ay: 748, name: 'Nhà của bạn (vào nhà)', use: () => AV.enterHome(), arrow: { x: HX, y: 635 } });
    m.labels.push({ text: '', x: HX, y: 504, dynamic: 'home' });
    sobj(m, KX, 720, (c) => ART.kitchen(c, KX, 720));
    col(m, KX - 108, 672, 216, 50);
    inter(m, { x: KX - 125, y: 540, w: 250, h: 182, ax: KX, ay: 748, name: 'Nhà bếp (nấu món ăn)', use: () => UI.kitchen(), arrow: { x: KX + 50, y: 640 } });
    sobj(m, 2800, 742, (c) => ART.mailbox(c, 2800, 742));
    col(m, 2793, 734, 14, 10);

    /* ----- 3 chuồng riêng: bò (chuồng đỏ), cừu, heo (mái tôn + vũng bùn) ----- */
    woodPen(m, 200, 884, 520, 1240);
    woodPen(m, 540, 884, 760, 1240);
    woodPen(m, 780, 884, 1000, 1240);
    sobj(m, 340, 1040, (c) => ART.barn(c, 340, 1040), { l: -140, t: -200, w: 280, h: 214 });
    col(m, 228, 990, 224, 52);
    pic(m, 'img/farm/' + 'hay.png', 470, 1225, 90, { h: 80, fallback: (c) => ART.hayStack(c, 470, 1215) });
    m.objects[m.objects.length - 1].hide3d = 1;
    pic(m, 'img/farm/' + 'hay.png', 650, 970, 70, { h: 62, fallback: (c) => ART.hayBale(c, 650, 960) });
    m.objects[m.objects.length - 1].hide3d = 1;
    sobj(m, 890, 1000, (c) => ART.pigSty(c, 890, 1000), { l: -125, t: -156, w: 250, h: 164 });
    col(m, 792, 950, 196, 50);
    obj(m, 1080, (ctx, t) => ART.mudPool(ctx, 880, 1160, t), [790, 1110, 970, 1210]);
    sobj(m, 940, 1050, (c) => ART.slopTrough(c, 940, 1050), { l: -50, t: -30, w: 100, h: 36 });
    col(m, 898, 1034, 84, 16);
    for (const [k, seed, area] of [
      ['cow', 7, { l: 240, t: 1075, r: 500, b: 1222 }], ['cow', 21, { l: 240, t: 1075, r: 500, b: 1222 }], ['cow', 33, { l: 240, t: 1075, r: 500, b: 1222 }],
      ['sheep', 3, { l: 565, t: 1000, r: 740, b: 1222 }], ['sheep', 9, { l: 565, t: 1000, r: 740, b: 1222 }], ['sheep', 15, { l: 565, t: 1000, r: 740, b: 1222 }],
      ['pig', 5, { l: 805, t: 1075, r: 980, b: 1222 }], ['pig', 11, { l: 805, t: 1075, r: 980, b: 1222 }], ['pig', 17, { l: 805, t: 1075, r: 980, b: 1222 }],
    ]) animal(m, k, area, seed);
    m.labels.push({ text: '🐄 Chuồng Bò', x: 360, y: 868 }, { text: '🐑 Chuồng Cừu', x: 650, y: 868 }, { text: '🐖 Chuồng Heo', x: 890, y: 868 });
    // bấm bất kỳ đâu trong từng chuồng = cho ăn / thu hoạch chuồng đó
    [['cow', 200, 520, 'Chuồng bò (cho ăn / vắt sữa)', 360, 1080], ['sheep', 540, 760, 'Chuồng cừu (cho ăn / cắt len)', 650, 905], ['pig', 780, 1000, 'Chuồng heo (đổ cám / thu thịt)', 890, 872]].forEach(([kind, L, R, name, ix, iy]) => {
      const cx = (L + R) / 2;
      inter(m, { x: L, y: 884, w: R - L, h: 356, ax: cx, ay: 1272, name, use: () => AV.usePen(kind), group: kind, approaches: [[cx, 1272], [cx, 862]], indicator: () => AV.penIndicator(kind), ix, iy });
    });
    inter(m, { x: 220, y: 860, w: 240, h: 190, ax: 360, ay: 1272, name: 'Chuồng bò (cho ăn / vắt sữa)', arrow: { x: 340, y: 935 }, group: 'cow', approaches: [[360, 1272], [360, 862]], use: () => AV.usePen('cow') });

    /* ----- Ao cá + sân gà thả rông cạnh ao ----- */
    // vùng nước theo ảnh ao mới (ảnh to hơn ao cũ)
    m.lake = { x: 1290, y: 1045, rx: 175, ry: 105 };
    pic(m, 'img/farm/' + 'pond.png', 1300, 1196, 430, { h: 340, sortY: 880, fallback: (c, t) => ART.lake(c, 1300, 1060, 180, 110, t) });
    m.objects[m.objects.length - 1].hide3d = 1;
    // chặn cả mặt nước + bờ đá + cầu gỗ (không đi lên ao được)
    col(m, 1100, 900, 400, 270);
    m.labels.push({ text: '🎣 Ao Cá', x: 1300, y: 868 }, { text: '🐔 Sân Gà', x: 1865, y: 900 });
    addBench(m, 1180, 1255);
    // bảng tin: ai đến trộm, có bị cắn / phạt không, ai tưới giúp
    pic(m, 'img/farm/' + 'board.png', 1400, 1262, 140, { h: 170, sortY: 1250, fallback: (c) => ART.noticeBoard(c, 1400, 1250) });
    col(m, 1350, 1240, 100, 12);
    inter(m, { x: 1334, y: 1084, w: 132, h: 170, ax: 1400, ay: 1282, name: 'Bảng tin nông trại (ai đến trộm, ai tưới giúp)', use: () => AV.useNoticeBoard(), indicator: () => AV.noticeIndicator(), ix: 1400, iy: 1072 });
    sobj(m, 1865, 1060, (c) => ART.henNest(c, 1865, 1060), { l: -80, t: -78, w: 160, h: 88 });
    m.objects[m.objects.length - 1].hide3d = 1;
    col(m, 1805, 1042, 120, 20);
    pic(m, 'img/farm/' + 'hay.png', 1975, 990, 72, { h: 64, fallback: (c) => ART.hayBale(c, 1975, 980) });
    m.objects[m.objects.length - 1].hide3d = 1;
    pic(m, 'img/farm/' + 'hay.png', 1760, 1225, 90, { h: 80, fallback: (c) => ART.hayStack(c, 1760, 1215) });
    m.objects[m.objects.length - 1].hide3d = 1;
    for (let i = 0; i < 5; i++) animal(m, 'chicken', { l: 1720, t: 930, r: 2010, b: 1240 }, i);
    for (let i = 5; i < 9; i++) animal(m, 'chicken', { l: 240, t: 860, r: 2280, b: 876 }, i);
    inter(m, {
      x: 1790, y: 980, w: 150, h: 90, ax: 1865, ay: 1092, name: 'Ổ rơm (cho gà ăn / nhặt trứng)', arrow: { x: 1865, y: 976 }, group: 'coop',
      use: () => AV.useCoop(), indicator: () => AV.coopIndicator(), ix: 1865, iy: 965,
    });

    /* ----- Vườn hoa ngay dưới ruộng (2 × 2 luống hoa) ----- */
    const GX = 2060, GY = 945;
    m.labels.push({ text: '🌸 Vườn Hoa', x: GX + BD.w + 20, y: 900 }, { text: '🌾 Đất Mở Rộng', x: GX + (BD.w + 40) * 2 + BD.w + 20, y: 900 });
    for (let k = 0; k < DATA.FLOWER_BEDS; k++) addBed(DATA.FIELD_BEDS + k, GX + (k % 2) * (BD.w + 40), GY + Math.floor(k / 2) * FSTEP, 'Ô trồng hoa');
    // đất mở rộng (luống 22–25) nằm ngay cạnh vườn hoa, chung một khu
    [22, 23, 24, 25].forEach((bedIdx, k) => addBed(bedIdx, GX + (2 + (k % 2)) * (BD.w + 40), GY + Math.floor(k / 2) * FSTEP, 'Ô ruộng'));

    /* ----- Góc nhỏ: bù nhìn, ghế, bụi hoa ----- */
    pic(m, 'img/farm/' + 'scarecrow.png', 4990, 1000, 96, { h: 135, fallback: (c) => ART.scarecrow(c, 4990, 990) });
    // giếng nước
    pic(m, 'img/farm/' + 'well.png', 4840, 1150, 120, { h: 160 });
    col(m, 4790, 1110, 100, 40);

    /* ----- Vườn cây ăn quả (khu bên phải, 2 hàng) ----- */
    AV._treePos = [];
    DATA.ORCHARD.forEach((_, i) => {
      const row = i < 8 ? 0 : 1, k = row ? i - 8 : i;
      const x = 3895 + k * 168 + row * 84, y = row ? 772 : 640;
      const fr = DATA.FRUITS[DATA.ORCHARD[i]];
      AV._treePos[i] = [x, y];
      const kind = DATA.ORCHARD[i];
      if (kind === 'orange' || kind === 'peach') {
        // cây cam / đào vẽ sẵn (quả có sẵn trong ảnh); cây chín thì lấp lánh
        pic(m, 'img/farm/' + kind + '.png', x, y + 14, 150, { h: 185, fallback: (c) => ART.tree(c, x, y, kind === 'peach' ? 'pink' : 'green') });
        col(m, x - 14, y - 10, 28, 12);
        obj(m, y + 2, (ctx, t) => { const st = AV.treeState(i); if (st.ripe) for (let k = 0; k < 4; k++) { const a = t * 2 + k * 1.6; ART.circle(ctx, x + Math.cos(a) * 46, y - 100 + Math.sin(a * 1.3) * 34, 2.6 + Math.sin(t * 6 + k) * 1.2, 'rgba(255,255,200,.95)'); } });
      } else {
        addTree(m, x, y, fr === DATA.FRUITS.peach ? 'pink' : 'green');
        obj(m, y + 1, (ctx, t) => { const st = AV.treeState(i); ART.treeFruits(ctx, x, y, fr.color, st.p, st.ripe, t); });
      }
      inter(m, {
        x: x - 62, y: y - 180, w: 124, h: 186, ax: x, ay: y + 30, name: `Cây ${fr.name.toLowerCase()} (hái quả)`,
        use: () => AV.useTree(i), indicator: () => AV.treeIndicator(i), ix: x, iy: y - 186,
      });
    });
    m.labels.push({ text: '🍊 Vườn Cây', x: 4490, y: 442 });

    /* ----- Chuồng thú giữ nhà: mua chó, hổ, sư tử canh nông trại ----- */
    m.labels.push({ text: '🐕 Chuồng Thú Giữ Nhà', x: 4490, y: 852 });
    sobj(m, 4060, 1070, (c) => ART.kennel(c, 4060, 1070), { l: -95, t: -125, w: 190, h: 135 });
    col(m, 4004, 1030, 112, 40);
    inter(m, { x: 3980, y: 950, w: 160, h: 122, ax: 4060, ay: 1100, name: 'Chuồng thú giữ nhà (mua chó, hổ, sư tử)', use: () => AV.useKennel(), arrow: { x: 4060, y: 985 } });
    sobj(m, 4300, 1010, (c) => ART.signBoard(c, 4300, 1010, 'CẨN THẬN\nCÓ THÚ DỮ 🦷\nCấm hái trộm!'));
    col(m, 4262, 1000, 80, 12);
    sobj(m, 4180, 1092, (c) => ART.dogBowl(c, 4180, 1092), { l: -22, t: -14, w: 44, h: 20 });
    // đất mở rộng thêm: 4 mảnh (luống 22–25), bấm biển "Mua đất" để mở
    m.labels.push({ text: '🍵 Góc Nghỉ', x: 4700, y: 865 });
    [[5140, 1050, 'pink'], [3880, 1230, 'green']].forEach(([x, y, v]) => addTree(m, x, y, v));
    addBush(m, 4420, 1245, '#ff8fab'); addBush(m, 4660, 1250, '#ffd43b');
    addBench(m, 5120, 1190);
    [[3760, 830], [4500, 830], [5100, 830]].forEach(([x, y]) => { addLamp(m, x, y); m.lights.push([x - 24, y - 112, 58], [x + 24, y - 112, 58]); });

    /* ----- Sân Chơi: xích đu, vọng lâu, cối xay gió ----- */
    m.labels.push({ text: '🌳 Sân Chơi', x: 3420, y: 442 });
    m.swings = [];
    [[3280, 700], [3560, 700]].forEach(([x, y]) => {
      sobj(m, x, y, (c) => ART.swingFrame(c, x, y), { l: -100, t: -165, w: 200, h: 172 }, y - 70);
      col(m, x - 98, y - 10, 52, 14); col(m, x + 46, y - 10, 52, 14);
      [-36, 36].forEach((dx) => {
        const s = { px: x + dx, py: y - 150, a: 0, user: null, idx: m.swings.length };
        m.swings.push(s);
        obj(m, y - 40, (ctx) => ART.swingSeat(ctx, s.px, s.py, s.a));
        inter(m, { x: s.px - 30, y: y - 125, w: 60, h: 131, ax: s.px, ay: y + 20, name: 'Xích đu (ngồi chơi)', use: () => AV.useSwing(s.idx) });
      });
    });
    const ZX = 4580, ZY = 1090;
    sobj(m, ZX, ZY, (c) => ART.gazebo(c, ZX, ZY), { l: -125, t: -210, w: 250, h: 222 });
    col(m, ZX - 100, ZY - 25, 200, 34);
    inter(m, { x: ZX - 100, y: ZY - 180, w: 200, h: 180, ax: ZX, ay: ZY + 40, name: 'Vọng lâu (ngồi nghỉ)', use: () => AV.restGazebo() });
    aobj(m, 3640, 1240, (c, t) => ART.windmill(c, 3640, 1240, t), { l: -100, t: -275, w: 200, h: 282 });
    col(m, 3606, 1225, 68, 18);
    addBench(m, 3480, 1180);
    addTree(m, 3175, 560, 'pink');
    [[3700, 560, 'mai'], [3490, 980, 'dao']].forEach(([x, y, k]) => addPot(m, x, y, k));
    addBush(m, 3460, 1240, '#ff8fab');
    addLamp(m, 3420, 760); m.lights.push([3396, 648, 58], [3444, 648, 58]);
    // bệ bắn pháo hoa
    sobj(m, 3640, 900, (c) => ART.fireworkPad(c, 3640, 900), { l: -70, t: -90, w: 140, h: 100 });
    col(m, 3586, 876, 108, 24);
    inter(m, { x: 3580, y: 820, w: 120, h: 82, ax: 3640, ay: 935, name: 'Bệ bắn pháo hoa', use: () => UI.fireworksPanel(), arrow: { x: 3640, y: 800, text: 'Bắn pháo hoa' } });

    /* ----- Đèn đường dọc lối đi (sáng về đêm) ----- */
    [[2300, 830], [1520, 1280], [1680, 1280], [1060, 1270], [2060, 1270]].forEach(([x, y]) => {
      addLamp(m, x, y);
      m.lights.push([x - 24, y - 112, 58], [x + 24, y - 112, 58]);
    });

    /* ----- Bên ngoài cổng ----- */
    [[4560, 1395, 'green'], [4860, 1400, 'pink'], [5250, 1395, 'fruit']].forEach(([x, y, v]) => addTree(m, x, y, v));
    /* ----- Phố ẩm thực trước cổng: cơm, phở, bún bò, mì cay | trà sữa, cà phê ----- */
    m.labels.push({ text: '🍜 Phố Ẩm Thực', x: 620, y: 1250 }, { text: '☕ Trà Sữa · Cà Phê', x: 4030, y: 1250 });
    DATA.EATERIES.forEach((e, i) => {
      const x = i < 4 ? 260 + i * 240 : 3790 + (i - 4) * 240, y = 1425;
      sobj(m, x, y, (c) => ART.foodShop(c, x, y, e), { l: -125, t: -165, w: 260, h: 172 });
      m.objects[m.objects.length - 1].b3d = { w: 236, h: 160, roof: e.trim, wall: e.wall, stools: e.deco === 'stools' };
      col(m, x - 105, y - 46, 210, 44);
      inter(m, { x: x - 105, y: y - 160, w: 210, h: 160, ax: x - 40, ay: y + 28, name: `${e.name} (ăn uống +XP)`, use: () => UI.eateryPanel(e.id) });
    });
    addPot(m, 1750, 1360, 'dao');
    /* ----- 🎰 Quầy Vietlott cạnh quán Mì Cay ----- */
    if (typeof LOTTO !== 'undefined') {
      const LX = 1150, LY = 1430;
      sobj(m, LX, LY, (c) => LOTTO.kiosk(c, LX, LY), { l: -66, t: -206, w: 160, h: 216 });
      obj(m, LY + 30, (c) => LOTTO.board(c, LX - 2, LY + 30), [LX - 36, LY - 56, LX + 36, LY + 32]);
      col(m, LX - 52, LY - 14, 104, 14);
      inter(m, { x: LX - 56, y: LY - 110, w: 112, h: 112, ax: LX, ay: LY + 26, name: 'Quầy Vietlott Mega 6/45 (quay mỗi 2 tiếng)', use: () => LOTTO.panel(), arrow: { x: LX, y: LY - 175, text: 'Vietlott' } });
    }
    /* ----- 🚜 cổng sang Trang Trại Mở Rộng ----- */
    {
      const RX = 4700, RY = 1430;
      sobj(m, RX, RY, (c) => {
        c.fillStyle = '#6b4423'; c.fillRect(RX - 70, RY - 120, 12, 120); c.fillRect(RX + 58, RY - 120, 12, 120);
        c.fillStyle = '#2f9e44'; c.beginPath(); c.roundRect(RX - 90, RY - 168, 180, 56, 10); c.fill(); c.strokeStyle = '#1b5e20'; c.lineWidth = 4; c.stroke();
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '900 15px "Be Vietnam Pro", system-ui'; c.fillText('🚜 TRANG TRẠI', RX, RY - 150); c.font = '900 12px "Be Vietnam Pro", system-ui'; c.fillText('MỞ RỘNG ➜', RX, RY - 128);
        c.font = '30px system-ui, "Segoe UI Emoji"'; c.fillText('🦆🐝🐐🌾', RX, RY - 70);
      }, { l: -100, t: -178, w: 200, h: 185 });
      inter(m, { x: RX - 90, y: RY - 170, w: 180, h: 172, ax: RX, ay: RY + 28, name: 'Sang Trang Trại Mở Rộng (vịt, ong, dê, xưởng, lúa nước…)', use: () => AV.teleport('ranch', false, 220, 1300, '🚜 Sang trang trại mở rộng…'), arrow: { x: RX, y: RY - 190, text: 'Trang trại' } });
    }
    /* ----- 🧑‍🌾 biển thuê giúp việc cạnh cổng, gần bến xe buýt ----- */
    const HX2 = 1470, HY2 = 1432;
    sobj(m, HX2, HY2, (c) => {
      c.save(); c.translate(HX2, HY2); c.scale(1.25, 1.25); c.translate(-HX2, -HY2);
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(HX2, HY2 + 2, 70, 9, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6b4423'; c.fillRect(HX2 - 52, HY2 - 70, 9, 70); c.fillRect(HX2 + 43, HY2 - 70, 9, 70);
      c.fillStyle = '#c98a4b'; c.beginPath(); c.roundRect(HX2 - 68, HY2 - 158, 136, 98, 12); c.fill();
      c.strokeStyle = '#6b4423'; c.lineWidth = 5; c.stroke();
      c.fillStyle = '#fff3d6'; c.beginPath(); c.roundRect(HX2 - 60, HY2 - 150, 120, 82, 8); c.fill();
      c.fillStyle = '#2f9e44'; c.beginPath(); c.roundRect(HX2 - 60, HY2 - 150, 120, 26, [8, 8, 0, 0]); c.fill();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#fff'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.fillText('THUÊ GIÚP VIỆC', HX2, HY2 - 137);
      c.font = '26px system-ui, "Segoe UI Emoji"'; c.fillText('🧑‍🌾', HX2 - 34, HY2 - 102);
      c.fillStyle = '#5c3010'; c.font = '800 10px "Be Vietnam Pro", system-ui'; c.textAlign = 'left';
      c.fillText('💧 Tưới nước', HX2 - 16, HY2 - 117); c.fillText('🧪 Bón phân', HX2 - 16, HY2 - 106); c.fillText('🐛 Trừ sâu', HX2 - 16, HY2 - 95); c.fillText('🌾 Thu hoạch', HX2 - 16, HY2 - 84);
      c.textAlign = 'center'; c.fillStyle = '#c92a2a'; c.font = '900 11px "Be Vietnam Pro", system-ui'; c.fillText('Từ 30.000 xu/ngày', HX2, HY2 - 72);
      c.restore();
    }, { l: -94, t: -206, w: 188, h: 214 });
    col(m, HX2 - 56, HY2 - 10, 112, 10);
    inter(m, { x: HX2 - 85, y: HY2 - 200, w: 170, h: 200, ax: HX2, ay: HY2 + 26, name: 'Biển thuê giúp việc (chăm nông trại hộ)', use: () => UI.helperPanel(), arrow: { x: HX2, y: HY2 - 218, text: 'Thuê giúp việc' } });
    /* QuangLamBank + cây ATM cạnh trạm xe buýt (vẽ sẵn 1 lần → nhẹ cho điện thoại) */
    const BX = 2345, BY = 1428, BK = 0.56; // thấp vừa để không che luống đất trong tường
    sobj(m, BX, BY, (c) => { c.save(); c.translate(BX, BY); c.scale(BK, BK); BANK.building(c, 0, 0); c.restore(); }, { l: -150, t: -235, w: 300, h: 255 });
    m.objects[m.objects.length - 1].b3d = { w: 256, h: 190, roof: '#00502b', wall: '#efe6d2', depth: 45 };
    col(m, BX - 128, BY - 42, 90, 40); col(m, BX + 38, BY - 42, 90, 40); col(m, BX - 38, BY - 42, 76, 14);
    inter(m, { x: BX - 40, y: BY - 84, w: 80, h: 86, ax: BX, ay: BY + 30, name: 'QuangLamBank (mở tài khoản, gửi / rút xu)', use: () => BANK.panel('counter'), arrow: { x: BX, y: BY - 70, text: 'Ngân hàng' } });
    pic(m, 'img/mall/atm.png', 2555, 1440, 86, { h: 124 });
    m.objects[m.objects.length - 1].b3d = { w: 70, h: 112, roof: '#2b8a3e', wall: '#e9ecef' };
    col(m, 2518, 1412, 74, 28);
    inter(m, { x: 2510, y: 1318, w: 90, h: 124, ax: 2555, ay: 1470, name: 'Cây ATM QuangLamBank', use: () => BANK.panel('atm'), arrow: { x: 2555, y: 1300, text: 'ATM' } });
    /* ----- 🧋 Quán trà đá vỉa hè cạnh bến xe buýt ----- */
    const TX = 2100, TY = 1428;
    sobj(m, TX, TY, (c) => teaStall(c, TX, TY), { l: -95, t: -150, w: 190, h: 165 });
    col(m, TX - 2, TY - 30, 80, 28);
    inter(m, { x: TX, y: TY - 120, w: 80, h: 120, ax: TX + 40, ay: TY + 30, name: 'Quán trà đá (trà đá, hướng dương, lạc rang)', use: () => UI.eateryPanel('trada'), arrow: { x: TX + 40, y: TY - 140, text: 'Trà đá' } });
    inter(m, { x: TX - 90, y: TY - 40, w: 80, h: 50, ax: TX - 50, ay: TY + 26, name: 'Ghế nhựa (ngồi uống trà đá)', use: () => AV.sitSeat(TX - 75, TX - 33, TY + 8, '🧋 Ngồi uống trà đá vỉa hè, ngắm phố', () => {}) });
    addBusStop(m, GATE + 140, 1432, 1);
    /* ----- 🚗 VinFast Showroom + 🔌 trạm sạc V-GREEN cạnh ATM ----- */
    const VX = 2790, VY = 1430;
    const VK = 0.72; // thấp vừa để không che luống đất
    sobj(m, VX, VY, (c) => { c.save(); c.translate(VX, VY); c.scale(VK, VK); c.translate(-VX, -VY); vinfast(c, VX, VY); c.restore(); }, { l: -170, t: -220, w: 340, h: 240 });
    m.objects[m.objects.length - 1].b3d = { w: 316, h: 198, roof: '#1b2f48', wall: '#495057', depth: 45 };
    col(m, VX - 152, VY - 38, 108, 36); col(m, VX + 44, VY - 38, 108, 36); col(m, VX - 44, VY - 38, 88, 12);
    inter(m, { x: VX - 44, y: VY - 110, w: 88, h: 110, ax: VX, ay: VY + 30, name: 'VinFast Showroom (mua ô tô điện)', use: () => UI.carShop(), arrow: { x: VX, y: VY - 124, text: 'VinFast' } });
    /* ----- 📱 CellphoneS + Thế Giới Di Động ngay cạnh VinFast ----- */
    [['cps', 3040, 'CellphoneS'], ['tgdd', 3290, 'Thế Giới Di Động']].forEach(([k, SX, nm]) => {
      const SY = 1430;
      sobj(m, SX, SY, (c) => phoneStore(c, SX, SY, k), { l: -126, t: -206, w: 252, h: 218 });
      m.objects[m.objects.length - 1].b3d = { w: 226, h: 150, roof: k === 'cps' ? '#d70018' : '#ffd400', wall: '#f8f9fa' };
      col(m, SX - 113, SY - 34, 80, 32); col(m, SX + 33, SY - 34, 80, 32); col(m, SX - 33, SY - 34, 66, 10);
      inter(m, { x: SX - 40, y: SY - 130, w: 80, h: 132, ax: SX, ay: SY + 30, name: `${nm} (mua điện thoại iPhone / Android)`, use: () => PHONE.shop(k), arrow: { x: SX, y: SY - 215, text: nm } });
    });
    const CX2 = 3545, CY2 = 1430;
    sobj(m, CX2, CY2, (c) => charger(c, CX2, CY2), { l: -80, t: -200, w: 160, h: 215 });
    m.objects[m.objects.length - 1].b3d = { w: 160, h: 196, roof: '#0ca678', wall: '#dee2e6', canopy: 1 };
    col(m, CX2 - 60, CY2 - 34, 120, 32);
    inter(m, { x: CX2 - 70, y: CY2 - 190, w: 140, h: 190, ax: CX2, ay: CY2 + 30, name: 'Trạm sạc V-GREEN (sạc pin ô tô)', use: () => UI.chargeStation(), arrow: { x: CX2, y: CY2 - 205, text: 'Trạm sạc' } });
    /* ----- Biển chúc mừng 20/10 cạnh cổng (hiện từ 1/10 đến hết 21/10) ----- */
    const WX = 1308, WY = 1430, WK = 0.54;
    const womensDay = () => { const d = new Date(); return d.getMonth() === 9 && d.getDate() <= 21; };
    const wdSprite = FX.sprite((c) => {
      c.save(); c.translate(WX, WY); c.scale(WK, WK); c.translate(-WX, -WY);
      // 2 cột gỗ quấn hoa
      [[-120, 0], [120, 0]].forEach(([dx]) => { c.fillStyle = '#8a5a3c'; c.fillRect(WX + dx - 7, WY - 150, 14, 150); });
      // bảng hồng viền hoa
      c.fillStyle = '#ffdeeb'; c.beginPath(); c.roundRect(WX - 150, WY - 330, 300, 190, 22); c.fill();
      c.strokeStyle = '#e64980'; c.lineWidth = 7; c.stroke();
      c.fillStyle = '#fff0f6'; c.beginPath(); c.roundRect(WX - 136, WY - 316, 272, 162, 16); c.fill();
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2, fx = WX + Math.cos(a) * 158, fy = WY - 235 + Math.sin(a) * 102;
        const col = ['#f783ac', '#ffd43b', '#ff6b6b', '#da77f2'][k % 4];
        for (let p = 0; p < 5; p++) { const pa = p * 1.2566; c.fillStyle = col; c.beginPath(); c.arc(fx + Math.cos(pa) * 6, fy + Math.sin(pa) * 6, 5, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#fff3bf'; c.beginPath(); c.arc(fx, fy, 3.5, 0, Math.PI * 2); c.fill();
      }
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#c2255c'; c.font = '900 26px "Be Vietnam Pro", system-ui'; c.fillText('CHÚC MỪNG', WX, WY - 292);
      c.font = '900 22px "Be Vietnam Pro", system-ui'; c.fillText('NGÀY PHỤ NỮ VIỆT NAM', WX, WY - 262);
      c.fillStyle = '#e64980'; c.font = '900 50px "Be Vietnam Pro", system-ui'; c.fillText('20/10', WX, WY - 218);
      c.fillStyle = '#862e9c'; c.font = '800 14px "Be Vietnam Pro", system-ui';
      c.fillText('Chúc chị em luôn xinh đẹp,', WX, WY - 182); c.fillText('hạnh phúc và thật nhiều niềm vui! 💐', WX, WY - 164);
      // bó hoa dưới chân biển
      [[-122, '#ff6b6b'], [122, '#f783ac']].forEach(([dx, col]) => {
        c.fillStyle = '#2f9e44'; c.beginPath(); c.arc(WX + dx, WY - 16, 22, 0, Math.PI * 2); c.fill();
        [[-10, -24], [8, -28], [0, -14], [-14, -10], [14, -12]].forEach(([fx, fy]) => { c.fillStyle = col; c.beginPath(); c.arc(WX + dx + fx, WY + fy, 8, 0, Math.PI * 2); c.fill(); c.fillStyle = '#fff3bf'; c.beginPath(); c.arc(WX + dx + fx, WY + fy, 3, 0, Math.PI * 2); c.fill(); });
      });
      c.restore();
    }, WX, WY, { l: -110, t: -216, w: 220, h: 224 });
    obj(m, WY, (ctx, t) => {
      if (!womensDay()) return;
      wdSprite(ctx);
      // tim bay lên lấp lánh
      for (let k = 0; k < 5; k++) { const ph = (t * 0.35 + k / 5) % 1; ctx.globalAlpha = 1 - ph; ctx.font = '18px system-ui'; ctx.textAlign = 'center'; ctx.fillText('💗', WX - 75 + k * 37, WY - 212 - ph * 45); }
      ctx.globalAlpha = 1;
    }, [WX - 115, WY - 270, WX + 115, WY + 10]);
    m.colliders.push({ x: WX - 84, y: WY - 8, w: 18, h: 10, when: womensDay }, { x: WX + 66, y: WY - 8, w: 18, h: 10, when: womensDay });
    addStreetSign(m, 3420, 1430, ['Cầu Giấy', 'Hồ Tùng Mậu']);
    sobj(m, 0, 1594, (c) => ART.roseHedge(c, 0, m.w, 1594), { l: -10, t: -44, w: m.w + 20, h: 48 });

    m.spawn = { x: GATE, y: 1350 };
    m.bounds = { l: 20, t: 440, r: m.w - 20, b: m.h - 34 };
    return m;
  }

  const plazaArea = { l: 240, t: 380, r: 1760, b: 790 };

  /* ---------- Quảng trường ---------- */
  let town = function town() {
    const m = base('town', 'Quảng trường', 2000, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 29);
      paintPaved(g, 180, 370, 1640, 440);
      g.fillStyle = '#d6c3a1';
      g.beginPath(); g.roundRect(960, 800, 80, 50, 6); g.fill();
      paintStreet(g, m.w, 870, 1000);
    });
    addTree(m, 80, 440, 'pink'); addTree(m, 1920, 440, 'fruit');

    aobj(m, 1000, 575, (c, t) => ART.fountain(c, 1000, 575, t), { l: -125, t: -115, w: 250, h: 165 });
    col(m, 885, 530, 230, 62);
    inter(m, { x: 880, y: 470, w: 240, h: 130, ax: 1000, ay: 625, name: 'Đài phun nước (ước nguyện 1 xu)', use: () => AV.useFountain() });
    m.labels.push({ text: '⛲ Quảng Trường', x: 1000, y: 445 });

    [[700, 470, 'mai'], [1300, 470, 'dao'], [700, 680, 'dao'], [1300, 680, 'mai'], [420, 560, 'mai'], [1580, 560, 'dao']].forEach(([x, y, k]) => addPot(m, x, y, k));
    addBench(m, 760, 760); addBench(m, 1240, 760);
    [[300, 580], [1700, 580], [760, 410], [1240, 410]].forEach(([x, y]) => addLamp(m, x, y));
    [[230, 400], [1770, 400], [230, 790], [1770, 790], [640, 790], [1360, 790]].forEach(([x, y], i) => addBush(m, x, y, FLOWERS[i % 4]));
    sobj(m, 480, 470, (c) => ART.signBoard(c, 480, 470, 'BẢNG TIN\nĐi xe buýt 🚌\nkhám phá TP!'));
    col(m, 440, 460, 80, 12);
    inter(m, { x: 430, y: 360, w: 100, h: 112, ax: 480, ay: 500, name: 'Bảng tin', use: () => UI.cityMap(false) });

    npc(m, 'Bé Na', { skin: '#ffe0c4', hair: 'pigtails', hairColor: '#6b3e26', shirt: '#e64980', shirtStyle: 'heart', pants: '#dee2e6', hat: 'bow' }, plazaArea, 440, 690, 'bunny');
    npc(m, 'Anh Tú', { skin: '#e3a979', hair: 'spiky', hairColor: '#2b2b33', shirt: '#4c6ef5', shirtStyle: 'stripes', pants: '#343a40', hat: 'cap' }, plazaArea, 800, 690, 'dog');
    npc(m, 'Cô Mai', { skin: '#f8c9a2', hair: 'long', hairColor: '#2b2b33', shirt: '#fcc419', shirtStyle: 'plain', pants: '#8b5a2b', hat: 'nonla' }, plazaArea, 1160, 690);
    npc(m, 'Bác Ba', { skin: '#b97a51', hair: 'bald', hairColor: '#e9ecef', shirt: '#40c057', shirtStyle: 'overall', pants: '#364fc7', hat: 'none' }, plazaArea, 1520, 690, 'pug');

    /* 🛒 thương lái phương xa (chỉ hiện khi đang ghé) */
    if (typeof EVENTS !== 'undefined') {
      const MX = 1500, MY = 470;
      const cartSpr = FX.sprite((c) => EVENTS.cart(c, MX, MY), MX, MY, { l: -100, t: -160, w: 200, h: 172 });
      m.objects.push({ y: MY, bb: [MX - 100, MY - 160, MX + 100, MY + 12], draw: (c) => { if (EVENTS.merchantHere()) cartSpr(c); } });
      m.colliders.push({ x: MX - 84, y: MY - 30, w: 168, h: 30, when: () => EVENTS.merchantHere() });
      inter(m, { x: MX - 90, y: MY - 150, w: 180, h: 150, ax: MX, ay: MY + 30, name: 'Thương lái phương xa', use: () => EVENTS.merchantPanel(), when: () => EVENTS.merchantHere(), arrow: { x: MX, y: MY - 170, text: 'Thương lái' } });
      npc(m, 'Thương lái', { skin: '#e3a979', hair: 'short', hairColor: '#2b2b33', shirt: '#7048e8', shirtStyle: 'plain', pants: '#495057', hat: 'nonla' }, { l: MX + 90, t: MY + 10, r: MX + 120, b: MY + 30 }, MX + 104, MY + 20, 'none');
      Object.assign(m.npcs[m.npcs.length - 1], { merchant: true, show: () => EVENTS.merchantHere() });
    }

    street(m);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  };

  /* ---------- Khu mua sắm ---------- */
  function mall() {
    const m = base('mall', 'Khu mua sắm', 2000, 1070);
    const A = 'img/mall/';
    m.groundImgs = true;
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 41);
      // nền trời + thành phố xa (ảnh vẽ sẵn)
      const sky = IMG.get(A + 'sky.jpg');
      if (sky) { g.drawImage(sky, 0, 0, m.w, 345); g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, 0, m.w, 345); }
      paintPaved(g, 120, 370, 1760, 450, '#e7e1f5');
      paintStreet(g, m.w, 870, 1000);
    });
    pic(m, A + 'tree.png', 70, 560, 170, { h: 200, fallback: (c) => ART.tree(c, 70, 470, 'green') });
    pic(m, A + 'tree.png', 1930, 560, 170, { h: 200, fallback: (c) => ART.tree(c, 1930, 470, 'pink') });
    col(m, 25, 530, 90, 30); col(m, 1885, 530, 90, 30);

    // Chợ nông sản
    pic(m, A + 'market.png', 450, 570, 400, { h: 360, sign: { text: 'CHỢ NÔNG SẢN', x: 0.491, y: 0.149, w: 0.36, color: '#8a4b14' }, fallback: (c) => ART.stall(c, 450, 520, 0) });
    col(m, 285, 470, 330, 92);
    inter(m, { x: 270, y: 250, w: 360, h: 320, ax: 450, ay: 600, name: 'Chợ (mua hạt, bán nông sản)', use: () => UI.shop(), arrow: { x: 450, y: 320, text: 'Mua bán' } });

    // Tiệm Thời Trang
    pic(m, A + 'boutique.png', 1000, 570, 380, { h: 370, sign: { text: 'THỜI TRANG', x: 0.472, y: 0.142, w: 0.38, color: '#c2255c' }, fallback: (c) => ART.boutique(c, 1000, 520) });
    col(m, 840, 450, 320, 104);
    inter(m, { x: 840, y: 220, w: 320, h: 350, ax: 990, ay: 600, name: 'Tiệm Thời Trang', use: () => UI.boutique(), arrow: { x: 990, y: 430 } });

    // cây ATM giữa 2 tiệm
    pic(m, A + 'atm.png', 1275, 575, 95, { h: 135 });
    col(m, 1235, 545, 80, 30);
    inter(m, { x: 1228, y: 440, w: 94, h: 135, ax: 1275, ay: 605, name: 'Cây ATM QuangLamBank', use: () => BANK.panel('atm'), arrow: { x: 1275, y: 430, text: 'ATM' } });

    // Tiệm Thú Cưng
    pic(m, A + 'petshop.png', 1555, 570, 380, { h: 370, sign: { text: 'THÚ CƯNG', x: 0.485, y: 0.236, w: 0.38, color: '#2b8a3e' }, fallback: (c) => ART.building(c, 1550, 520, { w: 240, wall: '#e6fcf5', roof: '#20c997', awning: '#0ca678', sign: '🐶 THÚ CƯNG', icons: ['🐕', '🐈'], door: '#087f5b' }) });
    col(m, 1400, 450, 320, 104);
    inter(m, { x: 1395, y: 220, w: 320, h: 350, ax: 1560, ay: 600, name: 'Tiệm Thú Cưng', use: () => UI.petShop(), arrow: { x: 1560, y: 430 } });

    // đèn đôi, thùng rác, ghế gỗ dọc vỉa hè
    [[300, 800], [820, 800], [1180, 800], [1700, 800]].forEach(([x, y]) => {
      pic(m, A + 'lamp.png', x, y, 70, { h: 120, fallback: (c) => ART.lamp(c, x, y, false) });
      col(m, x - 8, y - 8, 16, 10);
      m.lights = (m.lights || []).concat([[x - 22, y - 104, 50], [x + 22, y - 104, 50]]);
    });
    [[360, 805], [1760, 805]].forEach(([x, y]) => { pic(m, A + 'bin.png', x, y, 46, { h: 66 }); col(m, x - 20, y - 12, 40, 14); });
    [[650, 790], [1350, 790]].forEach(([x, y]) => {
      pic(m, A + 'bench.png', x, y, 130, { h: 100, fallback: (c) => ART.bench(c, x, y) });
      col(m, x - 60, y - 22, 120, 22);
      inter(m, { x: x - 64, y: y - 70, w: 128, h: 70, ax: x, ay: y + 14, name: 'Ghế gỗ (ngồi nghỉ)', use: () => AV.sitSeat(x - 34, x + 34, y + 6, '🪑 Ngồi nghỉ ở Khu mua sắm — bấm nơi khác để đứng dậy') });
    });
    m.labels.push({ text: '🛍️ Khu Mua Sắm', x: 1000, y: 190 });

    npc(m, 'Chị Lan', { skin: '#f8c9a2', hair: 'bun', hairColor: '#6b3e26', shirt: '#cc5de8', shirtStyle: 'star', pants: '#343a40', hat: 'flower' }, { l: 200, t: 600, r: 1800, b: 800 }, 800, 680, 'cat');

    street(m);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  /* ---------- Khu giải trí ---------- */
  function fun() {
    const m = base('fun', 'Khu giải trí', 5100, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 53);
      paintPaved(g, 120, 370, 4860, 460, '#f6e3d0');
      g.fillStyle = 'rgba(112,72,232,.12)'; g.beginPath(); g.roundRect(1960, 420, 600, 340, 30); g.fill();
      paintStreet(g, m.w, 870, 1000);
    });

    /* Đấu Trường MMA: vào trong xem 2 chiến binh đánh nhau, đặt cược ăn xu */
    const AX = 370, AY = 735;
    sobj(m, AX, AY, (c) => { c.save(); c.translate(AX, AY); c.scale(0.82, 0.82); ARENA.building(c, 0, 0); c.restore(); }, { l: -245, t: -300, w: 490, h: 330 });
    col(m, AX - 215, AY - 58, 165, 54); col(m, AX + 50, AY - 58, 165, 54); col(m, AX - 50, AY - 58, 100, 25);
    inter(m, { x: AX - 60, y: AY - 150, w: 120, h: 152, ax: AX, ay: AY + 40, name: 'Đấu Trường MMA (xem đấu, đặt cược ăn xu)', use: () => AV.enterArena(), arrow: { x: AX, y: AY - 112, text: 'Vào Đấu Trường MMA' } });

    aobj(m, 1160, 570, (c, t) => ART.stage(c, 1160, 570, t), { l: -185, t: -265, w: 370, h: 275 });
    col(m, 990, 524, 340, 50);
    inter(m, { x: 990, y: 380, w: 340, h: 195, ax: 1160, ay: 605, name: 'Sân khấu (nhảy múa)', use: () => AV.useStage() });

    aobj(m, 1680, 690, (c, t) => ART.ferrisWheel(c, 1680, 690, t), { l: -175, t: -385, w: 350, h: 400 });
    col(m, 1580, 660, 200, 40);
    inter(m, { x: 1520, y: 340, w: 320, h: 350, ax: 1680, ay: 730, name: 'Vòng quay (5 xu)', use: () => AV.useFerris() });

    sobj(m, 1260, 790, (c) => ART.iceCart(c, 1260, 790));
    col(m, 1214, 770, 92, 24);
    inter(m, { x: 1210, y: 650, w: 100, h: 145, ax: 1260, ay: 825, name: 'Xe kem (5 xu)', use: () => AV.buyIceCream() });

    [[1820, 420]].forEach(([x, y]) => addLamp(m, x, y));
    /* Trường Đua Ngựa cạnh Đấu Trường MMA */
    const HX = 790, HY = 735;
    sobj(m, HX, HY, (c) => { c.save(); c.translate(HX, HY); c.scale(0.9, 0.9); HORSE.building(c, 0, 0); c.restore(); }, { l: -180, t: -245, w: 360, h: 265 });
    col(m, HX - 160, HY - 50, 105, 46); col(m, HX + 55, HY - 50, 105, 46); col(m, HX - 55, HY - 50, 110, 22);
    inter(m, { x: HX - 50, y: HY - 110, w: 100, h: 112, ax: HX, ay: HY + 36, name: 'Trường Đua Ngựa (cược ngựa về nhất)', use: () => AV.enterHorse(), arrow: { x: HX, y: HY - 230, text: 'Vào Trường Đua' } });
    m.labels.push({ text: '🎡 Khu Giải Trí', x: 700, y: 318 });
    /* ----- Nhà Casino: vào trong mới có Bầu Cua, Tiến lên, máy game ----- */
    const CX = 2260, CY = 760;
    sobj(m, CX, CY, (c) => ART.casino(c, CX, CY), { l: -300, t: -420, w: 600, h: 465 });
    obj(m, CY, (ctx, t) => ART.casinoBulbs(ctx, CX, CY, t), [CX - 190, CY - 420, CX + 190, CY - 290]);
    col(m, CX - 280, CY - 70, 190, 64); col(m, CX + 90, CY - 70, 190, 64);
    col(m, CX - 90, CY - 70, 180, 30);
    inter(m, { x: CX - 80, y: CY - 160, w: 160, h: 170, ax: CX, ay: CY + 46, name: 'Nhà Casino (Bầu Cua, Tiến lên, máy game)', use: () => AV.enterCasino(), arrow: { x: CX, y: CY - 180, text: 'Vào Casino' } });
    addLamp(m, 1940, 790); addLamp(m, 2580, 790);
    /* ----- H-Club: quán bar, DJ, sàn nhảy (nhạc riêng chỉ nghe trong quán) ----- */
    const QX = 2820, QY = 770;
    aobj(m, QX, QY, (c, t) => CLUB.building(c, QX, QY, t), { l: -235, t: -270, w: 470, h: 305 });
    col(m, QX - 210, QY - 60, 150, 56); col(m, QX + 60, QY - 60, 150, 56); col(m, QX - 60, QY - 60, 120, 26);
    inter(m, { x: QX - 54, y: QY - 120, w: 108, h: 122, ax: QX, ay: QY + 40, name: 'H-Club (DJ, nhảy, quầy bar)', use: () => AV.enterClub(), arrow: { x: QX, y: QY - 130, text: 'Vào H-Club' } });
    m.lights = (m.lights || []).concat([[QX - 140, QY - 200, 70], [QX + 140, QY - 200, 70]]);
    /* ----- Sân vận động Concert Ngàn Chông Gai (cạnh H-Club) ----- */
    const VX = 3430, VY = 775;
    aobj(m, VX, VY, (c, t) => CONCERT.building(c, VX, VY, t), { l: -300, t: -320, w: 600, h: 355 });
    col(m, VX - 280, VY - 70, 200, 66); col(m, VX + 80, VY - 70, 200, 66); col(m, VX - 80, VY - 70, 160, 26);
    inter(m, { x: VX - 70, y: VY - 82, w: 140, h: 84, ax: VX, ay: VY + 40, name: 'Concert Ngàn Chông Gai (mua vé vào xem)', use: () => CONCERT.enter(), arrow: { x: VX, y: VY - 92, text: 'Vào xem concert' } });
    m.lights = m.lights.concat([[VX - 200, VY - 230, 80], [VX + 200, VY - 230, 80]]);
    /* ----- Rạp phim CGV ----- */
    const GX = 4080, GY = 775;
    aobj(m, GX, GY, (c, t) => {
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(GX, GY + 4, 230, 22, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2b2b30'; c.fillRect(GX - 210, GY - 260, 420, 260);
      c.fillStyle = '#e03131'; c.fillRect(GX - 220, GY - 272, 440, 70);
      c.fillStyle = '#fff'; c.font = '900 52px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CGV', GX, GY - 236);
      c.font = '800 13px "Be Vietnam Pro", system-ui'; c.fillStyle = '#ffe3e3'; c.fillText('CINEMAS', GX + 100, GY - 222);
      for (let k = 0; k < 18; k++) { c.fillStyle = (Math.floor(t * 4) + k) % 2 ? '#ffd43b' : '#fff3bf'; c.beginPath(); c.arc(GX - 205 + k * 24, GY - 196, 4, 0, Math.PI * 2); c.fill(); }
      [[-150, '#4c6ef5', '🦸'], [150, '#f03e3e', '👻']].forEach(([dx, col, ic]) => {
        c.fillStyle = '#111'; c.fillRect(GX + dx - 46, GY - 182, 92, 128);
        c.fillStyle = col; c.fillRect(GX + dx - 40, GY - 176, 80, 116);
        c.font = '38px system-ui'; c.fillText(ic, GX + dx, GY - 130); c.fillStyle = '#fff'; c.font = '900 11px "Be Vietnam Pro", system-ui'; c.fillText('ĐANG CHIẾU', GX + dx, GY - 76);
      });
      c.fillStyle = '#c92a2a'; c.fillRect(GX - 60, GY - 120, 120, 120);
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(GX - 52, GY - 112, 50, 112); c.fillRect(GX + 2, GY - 112, 50, 112);
      c.fillStyle = '#ffd43b'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.fillStyle = '#fff'; c.fillText('🎬 VÀO RẠP', GX, GY - 134);
    }, { l: -235, t: -285, w: 470, h: 315 });
    col(m, GX - 210, GY - 60, 140, 56); col(m, GX + 70, GY - 60, 140, 56); col(m, GX - 70, GY - 60, 140, 24);
    inter(m, { x: GX - 60, y: GY - 120, w: 120, h: 122, ax: GX, ay: GY + 40, name: 'Rạp phim CGV (vé 60 xu)', use: () => AV.enterCgv(), arrow: { x: GX, y: GY - 150, text: 'Xem phim' } });
    addPot(m, CX - 130, CY + 40, 'mai'); addPot(m, CX + 130, CY + 40, 'dao');

    npc(m, 'Bé Bin', { skin: '#ffe0c4', hair: 'spiky', hairColor: '#c68642', shirt: '#fd7e14', shirtStyle: 'star', pants: '#364fc7', hat: 'beanie' }, { l: 200, t: 700, r: 1800, b: 830 }, 1000, 760, 'chick');

    street(m, 1000, 4990);
    /* ----- 🥊 Võ Đài ----- */
    const BX = 4640, BY = 775;
    aobj(m, BX, BY, (c, t) => BOX.building(c, BX, BY, t), { l: -235, t: -330, w: 470, h: 360 });
    col(m, BX - 210, BY - 60, 140, 56); col(m, BX + 70, BY - 60, 140, 56); col(m, BX - 70, BY - 60, 140, 24);
    inter(m, { x: BX - 60, y: BY - 120, w: 120, h: 122, ax: BX, ay: BY + 40, name: 'Võ Đài (đấm nhau ăn xu)', use: () => AV.enterBoxing(), arrow: { x: BX, y: BY - 140, text: 'Vào Võ Đài' } });
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  /* ---------- Lớp học (đố vui tiếng Anh) ---------- */
  function classroom() {
    const m = base('classroom', 'Lớp học', 1600, 1000);
    m.indoor = true;
    m.hz = 0;
    ground(m, (g) => {
      g.fillStyle = '#3d2410'; g.fillRect(0, 0, m.w, m.h);
      g.fillStyle = '#e7f5ff'; g.fillRect(40, 20, 1520, 300);
      g.fillStyle = '#a5d8ff'; g.fillRect(40, 250, 1520, 70);
      g.fillStyle = '#1864ab'; g.fillRect(40, 314, 1520, 8);
      // cửa sổ hai bên
      [[90, 70], [1340, 70]].forEach(([x, y]) => {
        g.fillStyle = '#7a4520'; g.fillRect(x - 6, y - 6, 182, 132);
        const sk = g.createLinearGradient(0, y, 0, y + 120); sk.addColorStop(0, '#74c0fc'); sk.addColorStop(1, '#d0ebff');
        g.fillStyle = sk; g.fillRect(x, y, 170, 120);
        g.fillStyle = '#fff'; g.fillRect(x + 83, y, 4, 120); g.fillRect(x, y + 58, 170, 4);
      });
      ART.posterABC(g, 300, 110); ART.posterMap(g, 1170, 110);
      // sàn gạch hoa
      for (let y = 322; y < 960; y += 48) for (let x = 40; x < 1560; x += 48) { g.fillStyle = ((x + y) / 48) % 2 ? '#f1e3c6' : '#e6d3ab'; g.fillRect(x, y, 48, 48); }
      g.fillStyle = '#a61e4d'; g.fillRect(740, 900, 120, 46);
      g.fillStyle = '#3d2410'; g.fillRect(0, 960, m.w, 40); g.fillRect(0, 0, 40, m.h); g.fillRect(1560, 0, 40, m.h);
    });
    sobj(m, 800, 330, (c) => ART.blackboard(c, 800, 330), { l: -190, t: -245, w: 380, h: 252 });
    col(m, 625, 310, 350, 22);
    m.board = { x: 800, y: 330 };
    inter(m, { x: 620, y: 90, w: 360, h: 240, ax: 800, ay: 380, name: 'Bảng đố vui (gõ đáp án vào khung chat)', use: () => AV.quizHelp() });
    sobj(m, 1080, 420, (c) => ART.podium(c, 1080, 420), { l: -80, t: -30, w: 160, h: 36 });
    col(m, 1010, 400, 140, 22);
    npc(m, 'Cô giáo Hoa', { skin: '#f8c9a2', hair: 'long', hairColor: '#2b2b33', shirt: '#f8f9fa', shirtStyle: 'plain', pants: '#4c6ef5', hat: 'none' }, { l: 1070, t: 398, r: 1090, b: 402 }, 1080, 400);
    const teacher = m.npcs[m.npcs.length - 1];
    teacher.teacher = true;
    teacher.nextTalk = 1e9;
    // 3 dãy bàn học, bấm vào bàn để ngồi
    for (const y of [560, 680, 800]) for (const x of [440, 620, 800, 980, 1160]) {
      sobj(m, x, y - 16, (c) => ART.schoolChair(c, x, y - 16), { l: -22, t: -58, w: 44, h: 52 }, y - 40);
      sobj(m, x, y, (c) => ART.desk(c, x, y), { l: -40, t: -46, w: 80, h: 50 });
      col(m, x - 34, y - 12, 68, 14);
      inter(m, { x: x - 36, y: y - 60, w: 72, h: 62, ax: x, ay: y + 26, name: 'Bàn học (ngồi vào học)', use: () => AV.sitDesk(x, y) });
    }
    npc(m, 'Bạn Nam', { skin: '#ffe0c4', hair: 'spiky', hairColor: '#2b2b33', shirt: '#fff', shirtStyle: 'plain', pants: '#1c7ed6', hat: 'none' }, { l: 440, t: 662, r: 440, b: 662 }, 440, 662);
    npc(m, 'Bạn Lan', { skin: '#f8c9a2', hair: 'pigtails', hairColor: '#6b3e26', shirt: '#fff', shirtStyle: 'plain', pants: '#1c7ed6', hat: 'bow' }, { l: 1160, t: 542, r: 1160, b: 542 }, 1160, 542);
    furnLike(m, 130, 520, (c) => ART.bookshelf(c, 130, 520), { l: -56, t: -160, w: 112, h: 166 }, 96, 24);
    furnLike(m, 1470, 520, (c) => ART.plantPot(c, 1470, 520), { l: -30, t: -95, w: 60, h: 100 }, 34, 14);
    aobj(m, 1470, 860, (c, t) => ART.grandClock(c, 1470, 860, t), { l: -36, t: -166, w: 72, h: 172 });
    col(m, 1444, 838, 52, 22);
    // cửa ra ở giữa tường hai bên (phía dưới hay bị khung chat / thanh đáp án che)
    [[110, 770], [1490, 650]].forEach(([dx, dy]) => {
      sobj(m, dx, dy, (c) => ART.homeDoor(c, dx, dy), { l: -50, t: -22, w: 100, h: 28 }, dy - 40);
      inter(m, { x: dx - 60, y: dy - 80, w: 120, h: 100, ax: dx, ay: dy - 20, name: 'Ra sân trường', use: () => AV.leaveClass(), arrow: { x: dx, y: dy - 50, text: 'Ra ngoài' } });
    });
    m.spawn = { x: 800, y: 900 };
    m.bounds = { l: 56, t: 340, r: m.w - 56, b: 940 };
    return m;
  }
  function furnLike(m, x, y, draw, box, cw, ch) { sobj(m, x, y, draw, box); col(m, x - cw / 2, y - ch, cw, ch); }

  /* ---------- Trong Nhà Casino ---------- */
  function casino() {
    const m = base('casino', 'Nhà Casino', 2000, 1000);
    m.indoor = true;
    m.hz = 0;
    ground(m, (g) => {
      g.fillStyle = '#1a0a14'; g.fillRect(0, 0, m.w, m.h);
      // tường đỏ đô hoạ tiết vàng
      const wg = g.createLinearGradient(0, 20, 0, 240);
      wg.addColorStop(0, '#5c1232'); wg.addColorStop(1, '#3a0a20');
      g.fillStyle = wg; g.fillRect(40, 20, 1920, 220);
      g.strokeStyle = 'rgba(255,212,59,.22)'; g.lineWidth = 2;
      for (let x = 40; x < 1960; x += 48) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x + 24, 60); g.lineTo(x, 100); g.lineTo(x - 24, 60); g.closePath(); g.stroke(); }
      g.fillStyle = '#ffd43b'; g.fillRect(40, 104, 1920, 6); g.fillRect(40, 226, 1920, 14);
      // bảng neon
      g.fillStyle = '#2b0a3d'; g.beginPath(); g.roundRect(760, 128, 480, 84, 18); g.fill();
      g.strokeStyle = '#f783ac'; g.lineWidth = 5; g.stroke();
      g.font = '900 46px "Be Vietnam Pro", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = '#ff8fab'; g.shadowBlur = 18; g.fillStyle = '#fff0f6'; g.fillText('🎰 CASINO', 1000, 172); g.shadowBlur = 0;
      // thảm đỏ hoa văn kim cương
      g.fillStyle = '#8b1a2b'; g.fillRect(40, 240, 1920, 720);
      g.strokeStyle = 'rgba(255,212,59,.14)'; g.lineWidth = 2;
      for (let k = -720; k < 1920; k += 60) { g.beginPath(); g.moveTo(40 + k, 960); g.lineTo(40 + k + 720, 240); g.moveTo(40 + k + 720, 960); g.lineTo(40 + k, 240); g.stroke(); }
      // thảm xanh dưới các bàn chơi
      [[180, 470, 520, 300], [700, 470, 480, 300], [1260, 290, 640, 260]].forEach(([x, y, w, h]) => {
        g.fillStyle = '#ffd43b'; g.beginPath(); g.roundRect(x - 6, y - 6, w + 12, h + 12, 26); g.fill();
        g.fillStyle = '#1b5e3b'; g.beginPath(); g.roundRect(x, y, w, h, 22); g.fill();
      });
      g.fillStyle = '#a61e4d'; g.fillRect(940, 900, 120, 46);
      g.fillStyle = '#1a0a14'; g.fillRect(0, 960, m.w, 40); g.fillRect(0, 0, 40, m.h); g.fillRect(1960, 0, 40, m.h);
    });

    sobj(m, 440, 640, (c) => ART.gameTable(c, 440, 640, 'baucua', 0));
    col(m, 340, 590, 200, 50);
    inter(m, { x: 330, y: 520, w: 220, h: 140, ax: 440, ay: 690, name: 'Bàn Bầu Cua', use: () => UI.bauCua(), arrow: { x: 440, y: 505, text: 'Chơi' } });

    sobj(m, 940, 640, (c) => ART.gameTable(c, 940, 640, 'baicao', 0));
    col(m, 840, 590, 200, 50);
    inter(m, { x: 810, y: 520, w: 260, h: 170, ax: 940, ay: 700, name: 'Bàn Tiến lên (ngồi chơi với mọi người)', use: () => TABLE.openView(), arrow: { x: 940, y: 505, text: 'Chơi bài' } });

    m.labels.push({ text: '🕹️ Máy Game', x: 1580, y: 545 });
    // bàn bi-a 2 người
    sobj(m, 1580, 724, (c) => ART.billiardTable(c, 1580, 724), { l: -170, t: -140, w: 340, h: 150 });
    col(m, 1430, 600, 300, 124);
    inter(m, { x: 1430, y: 590, w: 300, h: 136, ax: 1580, ay: 748, name: 'Bàn bi-a (2 người chơi)', use: () => BIL.openView(), arrow: { x: 1580, y: 600, text: 'Chơi bi-a' } });
    DATA.ARCADE.forEach((g, i) => {
      const x = 1355 + i * 150, y = 470;
      aobj(m, x, y, (c, t) => ART.arcadeCabinet(c, x, y, g.color, g.name, g.icon, t), { l: -50, t: -158, w: 100, h: 166 });
      col(m, x - 38, y - 14, 76, 16);
      inter(m, { x: x - 40, y: y - 150, w: 80, h: 152, ax: x, ay: y + 30, name: `Máy game ${g.name}`, use: () => UI.arcade(g.id), arrow: { x, y: y - 160, text: 'Chơi' } });
    });

    // ghế sofa, chậu cây, quầy đổi xu
    sobj(m, 1500, 840, (c) => ART.sofa(c, 1500, 840, '#c92a2a'), { l: -125, t: -85, w: 250, h: 92 });
    col(m, 1385, 805, 230, 36);
    sobj(m, 1800, 840, (c) => ART.sofa(c, 1800, 840, '#7048e8'), { l: -125, t: -85, w: 250, h: 92 });
    col(m, 1685, 805, 230, 36);
    [[90, 330], [1910, 330], [90, 900], [1910, 900], [640, 330]].forEach(([x, y]) => { sobj(m, x, y, (c) => ART.plantPot(c, x, y), { l: -30, t: -95, w: 60, h: 100 }); col(m, x - 17, y - 12, 34, 14); });

    npc(m, 'Chú Lộc', { skin: '#f1c27d', hair: 'short', hairColor: '#222', shirt: '#212529', shirtStyle: 'plain', pants: '#212529', hat: 'cowboy' }, { l: 200, t: 760, r: 1200, b: 900 }, 600, 820, 'none');

    sobj(m, 1000, 962, (c) => ART.homeDoor(c, 1000, 962), { l: -50, t: -22, w: 100, h: 28 });
    inter(m, { x: 940, y: 900, w: 120, h: 70, ax: 1000, ay: 930, name: 'Ra Khu giải trí', use: () => AV.leaveCasino(), arrow: { x: 1000, y: 905, text: 'Ra ngoài' } });

    m.spawn = { x: 1000, y: 900 };
    m.bounds = { l: 56, t: 262, r: m.w - 56, b: 940 };
    return m;
  }

  /* ---------- Đấu Trường MMA (trong nhà, dùng chung) ---------- */
  function arena() {
    const m = base('arena', 'Đấu Trường MMA', 2000, 1100);
    m.indoor = true;
    m.hz = 0;
    ground(m, (g) => {
      g.fillStyle = '#2b1d14'; g.fillRect(0, 0, m.w, m.h);
      // tường đá + cờ
      g.fillStyle = '#f2c230'; g.fillRect(40, 20, 1920, 170);
      g.fillStyle = '#2b2b30'; g.fillRect(40, 150, 1920, 40);
      g.font = '900 26px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ff922b';
      [360, 1640].forEach((x) => g.fillText('MIXED MARTIAL ARTS', x, 170));
      [[200, '#e03131'], [520, '#1c7ed6'], [1480, '#e03131'], [1800, '#1c7ed6']].forEach(([x, c]) => { g.fillStyle = c; g.beginPath(); g.moveTo(x - 34, 30); g.lineTo(x + 34, 30); g.lineTo(x + 34, 140); g.lineTo(x, 116); g.lineTo(x - 34, 140); g.closePath(); g.fill(); g.fillStyle = '#ffd43b'; g.font = '900 30px system-ui'; g.textAlign = 'center'; g.fillText('⚔️', x, 80); });
      // khán đài bậc đá
      for (let r = 0; r < 5; r++) { g.fillStyle = r % 2 ? '#3a3b42' : '#45464e'; g.fillRect(40, 190 + r * 34, 1920, 34); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(40, 190 + r * 34 + 30, 1920, 4); }
      g.fillStyle = '#5c3d1e'; g.fillRect(40, 360, 1920, 16);
      // nền cát
      g.fillStyle = '#4a4c53'; g.fillRect(40, 376, 1920, 684);
      g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2;
      for (let x = 40; x < 1960; x += 120) { g.beginPath(); g.moveTo(x, 376); g.lineTo(x, 1060); g.stroke(); }
      for (let y = 376; y < 1060; y += 120) { g.beginPath(); g.moveTo(40, y); g.lineTo(1960, y); g.stroke(); }
      ARENA.floor(g);
      g.fillStyle = '#2b1d14'; g.fillRect(0, 1060, m.w, 40); g.fillRect(0, 0, 40, m.h); g.fillRect(1960, 0, 40, m.h);
    });
    obj(m, 150, (ctx) => ARENA.drawBoard(ctx, 1000, 106), [640, 20, 1360, 190]);
    obj(m, 360, (ctx, t) => ARENA.drawCrowd(ctx, t), [40, 180, 1960, 370]);
    const R = ARENA.RING;
    obj(m, R.y - R.ry - 1, (ctx) => ARENA.cageBack(ctx), [R.x - R.rx - 20, R.y - R.ry - 140, R.x + R.rx + 20, R.y + 10]);
    obj(m, R.y + 40, (ctx, t) => ARENA.drawRing(ctx, t), [R.x - R.rx - 120, R.y - R.ry - 360, R.x + R.rx + 120, R.y + R.ry + 60]);
    obj(m, R.y + R.ry + 2, (ctx) => ARENA.cageFront(ctx), [R.x - R.rx - 20, R.y - 140, R.x + R.rx + 20, R.y + R.ry + 10]);
    col(m, R.x - R.rx + 40, R.y - R.ry + 20, (R.rx - 40) * 2, (R.ry - 20) * 2);
    col(m, R.x - R.rx * 0.75, R.y - R.ry - 6, R.rx * 1.5, 30);
    inter(m, { x: R.x - 300, y: R.y - 200, w: 600, h: 400, ax: R.x, ay: R.y + R.ry + 40, name: 'Sàn đấu (đặt cược)', use: () => UI.arenaPanel() });
    // 2 quầy cược hai bên
    [[300, 'TRÁI'], [1700, 'PHẢI']].forEach(([x]) => {
      const y = 800;
      sobj(m, x, y, (c) => {
        c.fillStyle = '#7a4a26'; c.beginPath(); c.roundRect(x - 110, y - 60, 220, 60, 10); c.fill();
        c.fillStyle = '#a0632f'; c.fillRect(x - 110, y - 64, 220, 12);
        c.fillStyle = '#495057'; c.fillRect(x - 96, y - 150, 8, 90); c.fillRect(x + 88, y - 150, 8, 90);
        c.fillStyle = '#8b1a1a'; c.beginPath(); c.roundRect(x - 112, y - 186, 224, 46, 10); c.fill();
        c.strokeStyle = '#ffd43b'; c.lineWidth = 3; c.stroke();
        c.font = '900 22px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffd43b'; c.fillText('💰 QUẦY CƯỢC', x, y - 162);
        c.font = '22px system-ui'; c.fillText('🪙🪙💵', x, y - 80);
      }, { l: -120, t: -195, w: 240, h: 200 });
      col(m, x - 110, y - 50, 220, 48);
      inter(m, { x: x - 110, y: y - 190, w: 220, h: 190, ax: x, ay: y + 30, name: 'Quầy cược (đặt xu cho chiến binh)', use: () => UI.arenaPanel(), arrow: { x, y: y - 205, text: 'Đặt cược' } });
    });
    npc(m, 'Trọng tài Hùng', { skin: '#f1c27d', hair: 'short', hairColor: '#222', shirt: '#f8f9fa', shirtStyle: 'stripes', pants: '#212529', hat: 'none' }, { l: 200, t: 900, r: 800, b: 1000 }, 420, 950, 'none');
    sobj(m, 1000, 1062, (c) => ART.homeDoor(c, 1000, 1062), { l: -50, t: -22, w: 100, h: 28 });
    inter(m, { x: 940, y: 1000, w: 120, h: 70, ax: 1000, ay: 1030, name: 'Ra Khu giải trí', use: () => AV.leaveArena(), arrow: { x: 1000, y: 1005, text: 'Ra ngoài' } });
    m.spawn = { x: 1000, y: 1000 };
    m.bounds = { l: 56, t: 392, r: m.w - 56, b: 1040 };
    return m;
  }

  /* ---------- 🌸 Vườn Anh Đào: cắm trại, ăn uống, tạp hoá, WC, bể bơi, hồ chèo thuyền ---------- */
  function cherry() {
    const m = base('cherry', 'Vườn Anh Đào', 4100, 1070);
    m.forceFall = 'petals';
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 88);
      g.fillStyle = 'rgba(255,192,214,.18)'; g.fillRect(0, 380, m.w, 470);
      // lối đi đá
      g.fillStyle = '#e9dccb'; g.beginPath(); g.roundRect(100, 800, 3200, 46, 22); g.fill();
      g.fillStyle = 'rgba(255,255,255,.4)'; for (let x = 120; x < 3280; x += 60) { g.beginPath(); g.roundRect(x, 808, 40, 30, 8); g.fill(); }
      for (let i = 0; i < 300; i++) { g.fillStyle = ['#ffc9de', '#ffb3cf', '#fff0f6'][i % 3]; g.beginPath(); g.ellipse(80 + ((i * 337) % 3240), 400 + ((i * 131) % 420), 4, 2.5, i, 0, Math.PI * 2); g.fill(); }
      paintStreet(g, m.w, 870, 1000);
    });
    const L = (text, x) => m.labels.push({ text, x, y: 400 });
    L('⛺ Khu Cắm Trại', 420); L('🍢 Khu Ăn Uống', 1000); L('🛒 Tạp Hoá · WC', 1520); L('🏊 Bể Bơi', 2050); L('🚣 Hồ Chèo Thuyền', 2960); L('🧺 Bãi Cỏ Picnic', 3730);
    // hàng cây anh đào phía sau + rải rác
    [[150, 470], [700, 450], [1290, 470], [1740, 460], [2340, 470], [700, 760]].forEach(([x, y], i) => {
      sobj(m, x, y, (c) => CAMP.sakura(c, x, y, 1, i), { l: -95, t: -190, w: 190, h: 200 });
      col(m, x - 10, y - 6, 20, 10);
    });
    // khu cắm trại: 3 lều + lửa trại
    [[260, 600, '#ff8787'], [430, 570, '#74c0fc'], [600, 600, '#ffd43b']].forEach(([x, y, c2]) => {
      sobj(m, x, y, (c) => CAMP.tent(c, x, y, c2), { l: -90, t: -140, w: 180, h: 150 });
      col(m, x - 72, y - 30, 144, 26);
      inter(m, { x: x - 70, y: y - 110, w: 140, h: 110, ax: x, ay: y + 30, name: 'Lều cắm trại (vào ngủ)', use: () => CAMP.sleep(x, y, c2), arrow: { x, y: y - 140, text: 'Ngủ' } });
    });
    aobj(m, 430, 730, (c, t) => CAMP.campfire(c, 430, 730, t), { l: -130, t: -90, w: 260, h: 120 });
    col(m, 405, 715, 50, 18);
    m.lights = [[430, 700, 90]];
    [[330, 742], [530, 742]].forEach(([x, y]) => inter(m, { x: x - 40, y: y - 20, w: 80, h: 36, ax: x, ay: y + 30, name: 'Khúc gỗ (ngồi sưởi lửa)', use: () => AV.sitSeat(x - 10, x + 10, y + 24, '🔥 Ngồi sưởi lửa trại', () => {}) }));
    // khu ăn uống: quầy BBQ + 3 thảm picnic
    const bbq = DATA.CAMP_MENU[0], shop = DATA.CAMP_MENU[1];
    sobj(m, 1000, 560, (c) => ART.foodShop(c, 1000, 560, bbq), { l: -125, t: -165, w: 260, h: 172 });
    col(m, 895, 514, 210, 44);
    inter(m, { x: 895, y: 400, w: 210, h: 160, ax: 960, ay: 590, name: 'BBQ Anh Đào (đồ nướng +XP)', use: () => UI.eateryPanel('camp_bbq'), arrow: { x: 1000, y: 390, text: 'Đồ nướng' } });
    // 3 bàn BBQ có bếp than nướng giữa bàn
    [[800, 720], [1000, 720], [1200, 720]].forEach(([x, y]) => {
      aobj(m, x, y, (c, t) => CAMP.bbqTable(c, x, y, t), { l: -100, t: -130, w: 200, h: 140 });
      col(m, x - 86, y - 44, 172, 40);
      inter(m, { x: x - 90, y: y - 80, w: 180, h: 84, ax: x, ay: y + 40, name: 'Bàn BBQ (ngồi nướng, gọi đồ)', arrow: { x, y: y - 120, text: 'Ngồi nướng' },
        use: () => { AV.sitSeat(x - 45, x + 45, y + 42, '🔥 Ngồi bàn nướng BBQ — gọi đồ để nướng nhé', (g) => CAMP.bbqStoolsFront(g, x, y)); setTimeout(() => UI.eateryPanel('camp_bbq'), 400); } });
    });
    // tạp hoá + WC
    sobj(m, 1440, 560, (c) => ART.foodShop(c, 1440, 560, shop), { l: -125, t: -165, w: 260, h: 172 });
    col(m, 1335, 514, 210, 44);
    inter(m, { x: 1335, y: 400, w: 210, h: 160, ax: 1400, ay: 590, name: 'Tạp Hoá Cắm Trại (đồ uống, đồ ăn vặt)', use: () => UI.eateryPanel('camp_shop'), arrow: { x: 1440, y: 390, text: 'Mua đồ' } });
    sobj(m, 1650, 590, (c) => CAMP.wc(c, 1650, 590), { l: -100, t: -180, w: 200, h: 190 });
    col(m, 1575, 550, 150, 40);
    inter(m, { x: 1575, y: 440, w: 150, h: 150, ax: 1650, ay: 620, name: 'Nhà vệ sinh (vào trong)', use: () => AV.teleport('wc', false, 700, 800, '🚻 Vào nhà vệ sinh…'), arrow: { x: 1650, y: 410, text: 'WC' } });
    // bể bơi + ô dù
    const P = CAMP.POOL;
    obj(m, P.y - 30, (c, t) => CAMP.pool(c, t), [P.x - 30, P.y - 30, P.x + P.w + 30, P.y + P.h + 30]);
    inter(m, { x: P.x, y: P.y, w: P.w, h: P.h, ax: P.x + P.w / 2, ay: P.y + P.h / 2, name: 'Bể bơi (đi xuống nước để bơi)', use: () => UI.toast('🏊 Cứ đi thẳng xuống nước là bơi nhé!') });
    [[P.x - 40, P.y + P.h + 70, '#ff6b6b'], [P.x + P.w / 2, P.y + P.h + 74, '#4dabf7'], [P.x + P.w + 40, P.y + P.h + 70, '#ffd43b']].forEach(([x, y, c2]) => {
      sobj(m, x, y, (c) => CAMP.umbrella(c, x, y, c2), { l: -70, t: -140, w: 140, h: 150 });
      col(m, x - 48, y - 18, 96, 18);
    });
    // hồ + cầu tàu chèo thuyền
    const K = CAMP.LAKE, Dk = CAMP.DOCK;
    obj(m, K.y - K.ry - 30, (c, t) => CAMP.lake(c, t), [K.x - K.rx - 30, K.y - K.ry - 30, K.x + K.rx + 30, K.y + K.ry + 30]);
    col(m, K.x - K.rx + 40, K.y - K.ry + 20, K.rx * 2 - 80, K.ry * 2 - 40);
    inter(m, { x: Dk.x - 45, y: Dk.y - 110, w: 90, h: 120, ax: Dk.x, ay: Dk.y + 34, name: 'Cầu tàu (thuê thuyền chèo quanh hồ · 20 xu)', use: () => CAMP.row(), arrow: { x: Dk.x, y: Dk.y - 130, text: 'Chèo thuyền' } });
    /* bãi cỏ picnic rộng rãi: 4 thảm, bấm là ngồi hẳn xuống thảm */
    [[3420, 470, 2], [4020, 470, 5], [3730, 470, 7]].forEach(([x, y, k]) => { sobj(m, x, y, (c) => CAMP.sakura(c, x, y, 1, k), { l: -95, t: -190, w: 190, h: 200 }); col(m, x - 10, y - 6, 20, 10); });
    [[3560, 590, 0], [3900, 590, 1], [3560, 740, 2], [3900, 740, 0]].forEach(([x, y, k]) => {
      obj(m, y - 60, (c) => CAMP.picnic(c, x, y, k), [x - 95, y - 55, x + 95, y + 40]);
      inter(m, { x: x - 90, y: y - 50, w: 180, h: 90, ax: x, ay: y + 30, name: 'Thảm picnic (ngồi xuống)', arrow: { x, y: y - 70, text: 'Ngồi' },
        use: () => AV.sitSeat(x + 10, x + 52, y + 34, '🧺 Ngồi picnic dưới tán anh đào', () => {}) });
    });
    npc(m, 'Chị Hoa', { skin: '#ffe0c4', hair: 'long', hairColor: '#2b2b33', shirt: '#f783ac', shirtStyle: 'dress_flower', pants: '#fff', hat: 'flower' }, { l: 700, t: 640, r: 1300, b: 700 }, 900, 680, 'cat');
    street(m, 1450, 2460);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 400, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  /* ---------- 🚻 Nhà vệ sinh Vườn Anh Đào (trong nhà, chia khu Nam / Nữ) ---------- */
  function wc() {
    const m = base('wc', 'Nhà vệ sinh', 1400, 900);
    m.indoor = true;
    m.camTop = 0;
    m.zoom = 0.78;
    m.hz = 0;
    ground(m, (g) => CAMP.wcFloor(g, m.w, m.h));
    sobj(m, 360, 425, (c) => CAMP.wcSign(c, 360, 425, false), { l: -100, t: -40, w: 200, h: 80 });
    sobj(m, 1040, 425, (c) => CAMP.wcSign(c, 1040, 425, true), { l: -100, t: -40, w: 200, h: 80 });
    col(m, 680, 0, 40, 640);
    CAMP.STALLS.forEach(([x, k], i) => {
      obj(m, 380, (c) => CAMP.wcStall(c, x, i), [x - 70, 110, x + 70, 390]);
      col(m, x - 64, 100, 128, 280);
      inter(m, { x: x - 54, y: 130, w: 108, h: 245, ax: x, ay: 420, name: `Buồng vệ sinh ${k === 'nu' ? 'Nữ' : 'Nam'}`, use: () => CAMP.useStall(i), arrow: { x, y: 115, text: 'Vào' } });
    });
    // bồn rửa tay + gương mỗi bên
    [[160, 660], [520, 660], [880, 660], [1240, 660]].forEach(([x, y]) => {
      sobj(m, x, y, (c) => CAMP.wcSink(c, x, y), { l: -55, t: -200, w: 110, h: 205 });
      col(m, x - 50, y - 60, 100, 30);
      inter(m, { x: x - 50, y: y - 190, w: 100, h: 190, ax: x, ay: y + 30, name: 'Bồn rửa tay', use: () => CAMP.washHands() });
    });
    [[60, 820], [1340, 820]].forEach(([x, y]) => addPot(m, x, y, 'mai'));
    sobj(m, 700, 862, (c) => ART.homeDoor(c, 700, 862), { l: -50, t: -22, w: 100, h: 28 });
    inter(m, { x: 640, y: 800, w: 120, h: 70, ax: 700, ay: 830, name: 'Ra Vườn Anh Đào', use: () => AV.teleport('cherry', false, 1650, 640, '🌸 Ra Vườn Anh Đào…'), arrow: { x: 700, y: 805, text: 'Ra ngoài' } });
    m.spawn = { x: 700, y: 800 };
    m.bounds = { l: 56, t: 400, r: m.w - 56, b: 845 };
    return m;
  }

  /* ---------- ☁️ Đảo Trên Trời ---------- */
  function sky() {
    const m = base('sky', 'Đảo Trên Trời', SKY.W, SKY.H);
    m.hz = 0;
    m.fishTable = DATA.SKY_FISH;
    ground(m, (g) => SKY.paintGround(g));
    obj(m, 5, (ctx, t) => SKY.skyFx(ctx, t), [0, 0, SKY.W, 1000]);
    m.labels.push({ text: '☁️ Bến Mây', x: 1270, y: 440 }, { text: '🍭 Vườn Mây Kẹo Bông', x: 2450, y: 400 }, { text: '🔭 Đài Thiên Văn', x: 520, y: 400 }, { text: '🎣 Câu Cá Trên Mây', x: 680, y: 840 });
    // khinh khí cầu về Quảng trường
    aobj(m, 1500, 620, (c, t) => SKY.balloon(c, 1500, 620, t), { l: -100, t: -340, w: 200, h: 350 });
    col(m, 1462, 580, 76, 40);
    inter(m, { x: 1430, y: 300, w: 140, h: 320, ax: 1500, ay: 660, name: 'Khinh khí cầu (bay về Quảng trường)', use: () => SKY.fly(false), arrow: { x: 1500, y: 170, text: 'Về thành phố' } });
    sobj(m, 1270, 620, (c) => SKY.board(c, 1270, 620), { l: -80, t: -160, w: 160, h: 166 });
    col(m, 1222, 610, 96, 12);
    npc(m, 'Tiên Mây', { skin: '#ffe0c4', hair: 'long', hairColor: '#e9ecef', shirt: '#f8f9fa', shirtStyle: 'princess', pants: '#dee2e6', hat: 'halo', acc: 'wings' }, { l: 1200, t: 660, r: 1420, b: 740 }, 1320, 700, 'none');
    // tiệm đồ trời mây
    sobj(m, 1760, 640, (c) => SKY.shop(c, 1760, 640), { l: -130, t: -220, w: 260, h: 230 });
    col(m, 1665, 600, 190, 40);
    inter(m, { x: 1665, y: 450, w: 190, h: 190, ax: 1760, ay: 680, name: 'Tiệm Đồ Trời Mây (cánh, hào quang, áo choàng sao)', use: () => SKY.shopPanel(), arrow: { x: 1760, y: 430, text: 'Mua đồ' } });
    // Đài Thiên Văn
    sobj(m, 520, 660, (c) => SKY.observatory(c, 520, 660), { l: -140, t: -310, w: 280, h: 320 });
    col(m, 420, 600, 200, 60);
    inter(m, { x: 420, y: 380, w: 200, h: 280, ax: 520, ay: 700, name: 'Đài Thiên Văn (ước khi có sao băng)', use: () => SKY.wish(), arrow: { x: 520, y: 340, text: 'Ngắm sao' } });
    // câu cá trên mây
    m.lake = { x: SKY.LAKE.x, y: SKY.LAKE.y, rx: SKY.LAKE.rx, ry: SKY.LAKE.ry };
    col(m, SKY.LAKE.x - SKY.LAKE.rx + 30, SKY.LAKE.y - SKY.LAKE.ry + 20, SKY.LAKE.rx * 2 - 60, SKY.LAKE.ry * 2 - 40);
    // Vườn Mây Kẹo Bông: cây quả sao + mây nhún
    SKY.TREES.forEach(([x, y], i) => {
      aobj(m, x, y, (c, t) => SKY.glowTree(c, x, y, t, SKY.treeState(i).ripe), { l: -90, t: -180, w: 180, h: 190 });
      col(m, x - 12, y - 8, 24, 10);
      inter(m, { x: x - 70, y: y - 170, w: 140, h: 172, ax: x, ay: y + 26, name: 'Cây Quả Sao (hái quả phát sáng)', use: () => SKY.pickTree(i) });
    });
    [[1250, 960], [1500, 1000], [1760, 960], [2400, 980]].forEach(([x, y]) => {
      aobj(m, x, y, (c, t) => SKY.bounceCloud(c, x, y, t), { l: -80, t: -80, w: 160, h: 96 });
      inter(m, { x: x - 70, y: y - 70, w: 140, h: 80, ax: x, ay: y + 20, name: 'Mây nhún (nhảy lên)', use: () => AV.bounce() });
    });
    // thác nước chảy ngược
    aobj(m, SKY.FALLS.x, SKY.FALLS.bottom, (c, t) => SKY.waterfall(c, t), { l: -130, t: -(SKY.FALLS.bottom - SKY.FALLS.top) - 110, w: 260, h: SKY.FALLS.bottom - SKY.FALLS.top + 180 });
    col(m, SKY.FALLS.x - 55, SKY.FALLS.top, 110, SKY.FALLS.bottom - SKY.FALLS.top - 30);
    inter(m, { x: SKY.FALLS.x - 120, y: SKY.FALLS.bottom - 60, w: 240, h: 100, ax: SKY.FALLS.x, ay: SKY.FALLS.bottom + 34, name: 'Thác chảy ngược (ngồi phao trôi lên)', use: () => SKY.rideFalls(), arrow: { x: SKY.FALLS.x, y: SKY.FALLS.bottom - 80, text: 'Ngồi phao' } });
    m.spawn = { x: 1500, y: 700 };
    m.bounds = { l: 190, t: 420, r: SKY.W - 190, b: 1080 };
    return m;
  }

  /* ---------- H-Club (trong quán, dùng chung) ---------- */
  function club() {
    const m = base('club', 'H-Club', 2000, 1100);
    m.indoor = true;
    m.hz = 0;
    m.music = CLUB.MUSIC_URL;
    ground(m, (g) => {
      g.fillStyle = '#0d0a14'; g.fillRect(0, 0, m.w, m.h);
      g.fillStyle = '#1e1630'; g.fillRect(40, 20, 1920, 340);
      // dải đèn neon trên tường
      [[60, '#ff3ea5'], [110, '#20e3ff'], [330, '#9d4dff']].forEach(([y, c]) => { g.fillStyle = c; g.globalAlpha = 0.7; g.fillRect(40, y, 1920, 4); g.globalAlpha = 1; });
      g.font = '900 64px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = '#ff3ea5'; g.shadowBlur = 24; g.fillStyle = '#ffe3f3';
      [320, 1680].forEach((x) => g.fillText('H-CLUB', x, 200));
      g.shadowBlur = 0;
      // sàn đen bóng
      g.fillStyle = '#18121f'; g.fillRect(40, 360, 1920, 700);
      g.fillStyle = 'rgba(255,255,255,.03)'; for (let x = 40; x < 1960; x += 80) for (let y = 360; y < 1060; y += 80) if ((x + y) % 160 === 0) g.fillRect(x, y, 80, 80);
      g.fillStyle = '#0d0a14'; g.fillRect(0, 1060, m.w, 40); g.fillRect(0, 0, 40, m.h); g.fillRect(1960, 0, 40, m.h);
    });
    const F = CLUB.FLOOR;
    obj(m, F.y - 20, (ctx, t) => CLUB.floor(ctx, t), [F.x - 10, F.y - 10, F.x + F.cols * F.s + 10, F.y + F.rows * F.s * 0.6 + 10]);
    obj(m, 380, (ctx, t) => CLUB.djBooth(ctx, 1000, 470, t), [700, 220, 1300, 480]);
    obj(m, 472, (ctx, t) => CLUB.djDesk(ctx, 1000, 500, t), [850, 420, 1150, 510]);
    col(m, 700, 400, 600, 110);
    npc(m, 'DJ Hoàng', { skin: '#f1c27d', hair: 'spiky', hairColor: '#20e3ff', shirt: '#212529', shirtStyle: 'plain', pants: '#212529', hat: 'none', acc: 'sunglasses' }, { l: 1000, t: 470, r: 1001, b: 471 }, 1000, 470, 'none');
    m.npcs[m.npcs.length - 1].dance = true;
    inter(m, { x: F.x, y: F.y, w: F.cols * F.s, h: F.rows * F.s * 0.6, ax: F.x + F.cols * F.s / 2, ay: F.y + 120, name: 'Sàn nhảy (nhảy theo nhạc)', use: () => AV.useStage() });
    // khách đang nhảy trên sàn
    [['Linh', '#ff8fb1', 'long', '#2b2b33', 'dress'], ['Tùng', '#4c6ef5', 'spiky', '#c68642', 'stripes'], ['Vy', '#fcc419', 'pigtails', '#6b3e26', 'dress_flower'], ['Khoa', '#212529', 'emo', '#2b2b33', 'plain'], ['Mai', '#b197fc', 'bob', '#e86a92', 'princess'], ['Nam', '#40c057', 'short', '#2b2b33', 'star']].forEach(([name, shirt, hair, hc, st], i) => {
      const x = F.x + 90 + (i % 3) * 270 + (i > 2 ? 120 : 0), y = F.y + 70 + Math.floor(i / 3) * 110;
      npc(m, name, { skin: ['#ffe0c4', '#f8c9a2', '#e3a979'][i % 3], hair, hairColor: hc, shirt, shirtStyle: st, pants: '#343a40', hat: 'none' }, { l: x, t: y, r: x + 1, b: y + 1 }, x, y, 'none');
      m.npcs[m.npcs.length - 1].dance = true;
    });
    // quầy bar + bartender
    sobj(m, 1650, 470, (c) => CLUB.bar(c, 1650, 470), { l: -190, t: -180, w: 380, h: 190 });
    col(m, 1470, 410, 360, 62);
    npc(m, 'Bartender Ken', { skin: '#f8c9a2', hair: 'short', hairColor: '#2b2b33', shirt: '#f8f9fa', shirtStyle: 'plain', pants: '#212529', hat: 'none' }, { l: 1580, t: 400, r: 1720, b: 402 }, 1650, 400, 'none');
    inter(m, { x: 1470, y: 300, w: 360, h: 172, ax: 1650, ay: 500, name: 'Quầy bar (gọi đồ uống)', use: () => UI.eateryPanel('hclub'), arrow: { x: 1650, y: 280, text: 'Gọi đồ uống' } });
    // bàn rượu
    [[300, 640, 0], [300, 900, 1], [1680, 720, 2], [1680, 960, 3], [600, 1000, 4]].forEach(([x, y, k]) => {
      sobj(m, x, y, (c) => CLUB.table(c, x, y, k), { l: -70, t: -95, w: 140, h: 140 });
      col(m, x - 44, y - 44, 88, 30);
      inter(m, { x: x - 50, y: y - 90, w: 100, h: 96, ax: x, ay: y + 50, name: 'Bàn rượu (gọi đồ uống)', use: () => UI.eateryPanel('hclub') });
    });
    obj(m, 5000, (ctx, t) => CLUB.lights(ctx, t), [0, 0, m.w, m.h]);
    sobj(m, 1000, 1062, (c) => ART.homeDoor(c, 1000, 1062), { l: -50, t: -22, w: 100, h: 28 });
    inter(m, { x: 940, y: 1000, w: 120, h: 70, ax: 1000, ay: 1030, name: 'Ra Khu giải trí', use: () => AV.leaveClub(), arrow: { x: 1000, y: 1005, text: 'Ra ngoài' } });
    m.spawn = { x: 1000, y: 1000 };
    m.bounds = { l: 56, t: 400, r: m.w - 56, b: 1040 };
    return m;
  }

  /* ---------- 🎤 Concert Ngàn Chông Gai (trong sân vận động, dùng chung) ---------- */
  function concert() {
    const m = base('concert', 'Concert Ngàn Chông Gai', 2000, 1250);
    m.indoor = true;
    m.hz = 0;
    m.music = 'mute';
    m.screen = { video: '_41R6YGF4dA', x: CONCERT.LED.x, y: CONCERT.LED.y, w: CONCERT.LED.w, h: CONCERT.LED.h };
    m.zoom = 0.62;
    m.camTop = 20;
    ground(m, (g) => {
      g.fillStyle = '#0b0912'; g.fillRect(0, 0, m.w, m.h);
      g.fillStyle = '#1b1726'; g.fillRect(40, 700, 1920, 520);
      g.fillStyle = 'rgba(255,255,255,.03)'; for (let x = 40; x < 1960; x += 80) for (let y = 700; y < 1220; y += 80) if ((x + y) % 160 === 0) g.fillRect(x, y, 80, 80);
      // khu VIP sát sân khấu: sàn vàng
      g.fillStyle = '#3a2a10'; g.fillRect(340, 710, 1320, 130);
      g.fillStyle = 'rgba(255,212,59,.18)'; g.fillRect(340, 710, 1320, 130);
      g.font = '900 30px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,212,59,.5)'; g.fillText('★ KHU VIP ★', 1000, 778);
      // thảm đỏ lối đi giữa + lối ra
      g.fillStyle = '#7a1424'; g.fillRect(860, 850, 280, 370);
      g.fillStyle = '#0b0912'; g.fillRect(0, 1220, m.w, 30); g.fillRect(0, 0, 40, m.h); g.fillRect(1960, 0, 40, m.h);
    });
    obj(m, 0, (ctx, t) => CONCERT.stage(ctx, t), [340, 0, 1660, 710]);
    obj(m, 1, (ctx, t) => CONCERT.crowd(ctx, t), [40, 100, 1960, 640]);
    col(m, 340, 0, 1320, 712);
    col(m, 40, 100, 300, 610); col(m, 1660, 100, 300, 610);
    // 5 anh trai trên sân khấu
    CONCERT.BROS.forEach((b, i) => {
      const x = 640 + i * 180, y = 688;
      npc(m, b.name, { skin: ['#ffe0c4', '#f8c9a2', '#e3a979'][i % 3], hair: b.hair, hairColor: b.hc, shirt: b.shirt, shirtStyle: 'star', pants: '#212529', hat: 'none', acc: i === 2 ? 'sunglasses' : 'none', stick: b.stick }, { l: x, t: y, r: x + 1, b: y + 1 }, x, y, 'none');
      m.npcs[m.npcs.length - 1].dance = true;
    });
    // dây chắn khu VIP (chỉ người có vé VIP đi qua được)
    const vipOnly = () => !CONCERT.hasVip();
    m.colliders.push({ x: 330, y: 836, w: 1340, h: 10, when: vipOnly }, { x: 326, y: 710, w: 10, h: 136, when: vipOnly }, { x: 1664, y: 710, w: 10, h: 136, when: vipOnly });
    obj(m, 841, (ctx, t) => {
      for (let x = 340; x <= 1660; x += 132) { ctx.fillStyle = '#fcc419'; ctx.fillRect(x - 4, 802, 8, 40); ctx.beginPath(); ctx.arc(x, 800, 7, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#c92a2a'; ctx.lineWidth = 5;
      for (let x = 340; x < 1660; x += 132) { ctx.beginPath(); ctx.moveTo(x, 810); ctx.quadraticCurveTo(x + 66, 828, x + 132, 810); ctx.stroke(); }
    }, [320, 780, 1680, 850]);
    inter(m, { x: 900, y: 790, w: 200, h: 60, ax: 1000, ay: 880, name: 'Lối vào khu VIP (cần vé VIP)', use: () => (CONCERT.hasVip() ? UI.toast('🎫 Bạn có vé VIP — cứ đi thẳng lên sát sân khấu!') : CONCERT.ticketPanel()), arrow: { x: 1000, y: 760, text: 'Khu VIP' } });
    // ghế khán giả: 3 dãy mỗi bên, lối đi giữa để ra cửa
    [920, 995, 1070].forEach((y, r) => [[150, 780], [1220, 1850]].forEach(([L, R]) => {
      sobj(m, (L + R) / 2, y, (c) => CONCERT.seats(c, L, R, y), { l: -(R - L) / 2 - 30, t: -60, w: R - L + 60, h: 66 }, y - 40);
      col(m, L - 20, y - 52, R - L + 40, 24);
      inter(m, { x: L - 20, y: y - 62, w: R - L + 40, h: 62, ax: (L + R) / 2, ay: y + 20, name: `Ghế khán đài (dãy ${r + 1})`, use: () => AV.sitSeat(L, R, y, '🎤 Ngồi xem concert — bấm nơi khác để đứng dậy', (g) => CONCERT.seatsFront(g, L, R, y)) });
    }));
    // quầy lightstick + quầy vé
    [[260, 'lightstick', '🔦 LIGHTSTICK', () => CONCERT.stickPanel()], [1740, 'ticket', '🎫 QUẦY VÉ', () => CONCERT.ticketPanel()]].forEach(([x, , text, use]) => {
      const y = 1180;
      sobj(m, x, y, (c) => {
        c.fillStyle = '#2b2140'; c.beginPath(); c.roundRect(x - 100, y - 56, 200, 56, 10); c.fill();
        c.fillStyle = '#ff3ea5'; c.beginPath(); c.roundRect(x - 104, y - 100, 208, 40, 10); c.fill();
        c.fillStyle = '#fff'; c.font = '900 18px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y - 80);
        ['#ff3b3b', '#22e3ff', '#ffe14d', '#f1f6ff', '#b46bff'].forEach((col, k) => { c.fillStyle = col; c.fillRect(x - 70 + k * 32, y - 46, 10, 30); });
      }, { l: -110, t: -108, w: 220, h: 112 });
      col(m, x - 100, y - 50, 200, 48);
      inter(m, { x: x - 100, y: y - 104, w: 200, h: 104, ax: x, ay: y - 120, name: text, use, arrow: { x, y: y - 120, text: text.split(' ').slice(1).join(' ') } });
    });
    obj(m, 5000, (ctx, t) => CONCERT.fx(ctx, t), [0, 0, m.w, m.h]);
    sobj(m, 1000, 1222, (c) => ART.homeDoor(c, 1000, 1222), { l: -50, t: -22, w: 100, h: 28 });
    inter(m, { x: 940, y: 1160, w: 120, h: 70, ax: 1000, ay: 1190, name: 'Ra Khu giải trí', use: () => AV.teleport('fun', false, 3430, 840, '🎡 Ra Khu giải trí…'), arrow: { x: 1000, y: 1165, text: 'Ra ngoài' } });
    m.spawn = { x: 1000, y: 1150 };
    m.bounds = { l: 56, t: 720, r: m.w - 56, b: 1205 };
    return m;
  }

  /* ---------- 🧋 Quán trà đá: xe đẩy + bình trà + bàn nhựa xanh + ghế đỏ ---------- */
  function teaStall(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(x - 5, y + 4, 95, 12, 0, 0, Math.PI * 2); c.fill();
    // xe đẩy gỗ
    const cx = x + 40;
    c.fillStyle = '#8a5a32'; c.fillRect(cx - 40, y - 52, 80, 44);
    c.fillStyle = '#a0632f'; c.fillRect(cx - 44, y - 56, 88, 8);
    c.strokeStyle = '#6b4423'; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(cx - 40, y - 42 + k * 9); c.lineTo(cx + 40, y - 42 + k * 9); c.stroke(); }
    c.fillStyle = '#212529'; [cx - 28, cx + 28].forEach((wx) => { c.beginPath(); c.arc(wx, y - 6, 8, 0, Math.PI * 2); c.fill(); c.fillStyle = '#868e96'; c.beginPath(); c.arc(wx, y - 6, 3, 0, Math.PI * 2); c.fill(); c.fillStyle = '#212529'; });
    // ô che + biển
    c.fillStyle = '#868e96'; c.fillRect(cx - 2, y - 128, 4, 74);
    c.fillStyle = '#c92a2a'; c.beginPath(); c.moveTo(cx - 62, y - 112); c.quadraticCurveTo(cx, y - 150, cx + 62, y - 112); c.closePath(); c.fill();
    c.fillStyle = '#fff'; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(cx, y - 140); c.lineTo(cx + k * 24 - 6, y - 112); c.lineTo(cx + k * 24 + 6, y - 112); c.closePath(); if (k % 2 === 0) c.fill(); }
    c.fillStyle = '#ffd43b'; c.beginPath(); c.roundRect(cx - 34, y - 98, 68, 20, 5); c.fill();
    c.strokeStyle = '#c92a2a'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#c92a2a'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TRÀ ĐÁ', cx, y - 88);
    // bình trà đá cam + cốc
    c.fillStyle = '#fd7e14'; c.beginPath(); c.roundRect(cx - 30, y - 82, 26, 28, 5); c.fill();
    c.fillStyle = '#fff'; c.fillRect(cx - 30, y - 74, 26, 4);
    c.fillStyle = '#e67700'; c.fillRect(cx - 21, y - 86, 8, 5);
    for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(255,236,153,.85)'; c.fillRect(cx + 4 + k * 11, y - 68, 8, 12); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(cx + 5 + k * 11, y - 66, 2, 8); }
    c.fillStyle = '#ffe066'; c.beginPath(); c.arc(cx + 30, y - 60, 5, 0, Math.PI * 2); c.fill();
    // bàn nhựa xanh thấp + ghế đỏ
    const tx = x - 50;
    c.fillStyle = '#1c7ed6'; c.beginPath(); c.roundRect(tx - 24, y - 26, 48, 8, 3); c.fill();
    c.fillStyle = '#1864ab'; c.fillRect(tx - 20, y - 18, 5, 16); c.fillRect(tx + 15, y - 18, 5, 16);
    c.fillStyle = 'rgba(255,236,153,.9)'; c.fillRect(tx - 10, y - 36, 7, 10); c.fillRect(tx + 4, y - 36, 7, 10);
    c.fillStyle = '#e8590c'; c.beginPath(); c.arc(tx, y - 30, 3, 0, Math.PI * 2); c.fill();
    [tx - 32, tx + 32].forEach((sx) => { c.fillStyle = '#e03131'; c.beginPath(); c.roundRect(sx - 9, y - 16, 18, 6, 2); c.fill(); c.fillStyle = '#c92a2a'; c.fillRect(sx - 8, y - 10, 3, 10); c.fillRect(sx + 5, y - 10, 3, 10); });
  }

  /* ---------- 🚗 Showroom VinFast + trạm sạc (vẽ bằng code) ---------- */
  function vfLogo(c, x, y, r) {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#1864ab'; c.lineWidth = r * 0.22; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x - r * 0.55, y - r * 0.4); c.lineTo(x, y + r * 0.5); c.lineTo(x + r * 0.55, y - r * 0.4); c.stroke();
    c.strokeStyle = '#e03131'; c.lineWidth = r * 0.12; c.beginPath(); c.moveTo(x - r * 0.3, y - r * 0.4); c.lineTo(x, y + r * 0.15); c.lineTo(x + r * 0.3, y - r * 0.4); c.stroke();
  }
  function vinfast(c, x, y) {
    const W2 = 440, L = x - W2 / 2;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 6, W2 / 2 + 20, 20, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#343a40'; c.fillRect(L, y - 250, W2, 250);
    c.fillStyle = '#1b2f48'; c.fillRect(L - 8, y - 276, W2 + 16, 36);
    vfLogo(c, L + 34, y - 258, 15);
    c.fillStyle = '#fff'; c.font = '900 26px "Be Vietnam Pro", system-ui'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('VINFAST', L + 58, y - 257);
    c.font = '700 12px "Be Vietnam Pro", system-ui'; c.fillStyle = '#a5d8ff'; c.fillText('SHOWROOM Ô TÔ ĐIỆN', L + 190, y - 256);
    const g = c.createLinearGradient(L, y - 230, L, y); g.addColorStop(0, '#d0ebff'); g.addColorStop(1, '#74c0fc');
    c.fillStyle = g; c.fillRect(L + 12, y - 230, W2 - 24, 226);
    c.fillStyle = '#e9ecef'; c.fillRect(L + 12, y - 40, W2 - 24, 36);
    c.save(); c.translate(L + 130, y - 42); c.scale(1.05, 1.05); RIDE.drawCar(c, 0, 0, 'vf8'); c.restore();
    c.save(); c.translate(L + 330, y - 42); c.scale(0.9, 0.9); c.scale(-1, 1); RIDE.drawCar(c, 0, 0, 'vf3'); c.restore();
    c.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(L + 30 + k * 110, y - 230); c.lineTo(L + 70 + k * 110, y - 230); c.lineTo(L + 20 + k * 110, y - 4); c.lineTo(L - 20 + k * 110 > L + 12 ? L - 20 + k * 110 : L + 12, y - 4); c.closePath(); c.fill(); }
    c.fillStyle = '#343a40'; [0.33, 0.66].forEach((f) => c.fillRect(L + W2 * f - 3, y - 230, 6, 226));
    c.fillStyle = '#1b2f48'; c.fillRect(x - 56, y - 150, 112, 150);
    c.fillStyle = 'rgba(208,235,255,.85)'; c.fillRect(x - 50, y - 144, 48, 144); c.fillRect(x + 2, y - 144, 48, 144);
    c.fillStyle = '#ffd43b'; c.fillRect(x - 8, y - 80, 4, 20); c.fillRect(x + 4, y - 80, 4, 20);
  }
  function charger(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(x, y + 4, 80, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#868e96'; c.fillRect(x - 70, y - 190, 6, 190); c.fillRect(x + 64, y - 190, 6, 190);
    c.fillStyle = '#0ca678'; c.beginPath(); c.roundRect(x - 80, y - 200, 160, 30, 8); c.fill();
    c.fillStyle = '#fff'; c.font = '900 16px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⚡ V-GREEN', x, y - 185);
    [-28, 28].forEach((dx) => {
      c.fillStyle = '#f8f9fa'; c.beginPath(); c.roundRect(x + dx - 18, y - 120, 36, 120, 8); c.fill();
      c.fillStyle = '#0ca678'; c.fillRect(x + dx - 18, y - 120, 36, 16);
      c.fillStyle = '#1b2f48'; c.fillRect(x + dx - 12, y - 96, 24, 18);
      c.fillStyle = '#69db7c'; c.fillRect(x + dx - 9, y - 93, 18 * (dx < 0 ? 0.8 : 0.4), 12);
      c.strokeStyle = '#212529'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + dx + 18, y - 60); c.quadraticCurveTo(x + dx + 34, y - 30, x + dx + 20, y - 14); c.stroke();
    });
    c.fillStyle = '#ffd43b'; c.font = '900 22px system-ui'; c.fillText('⚡', x, y - 140);
  }

  /* ---------- ✈️ Sân bay (6 sân bay dùng chung 1 mẫu) ---------- */
  function bigPlane(c, x, y, col) {
    // máy bay đỗ trên sân đỗ, mũi quay phải; (x,y) = chân bánh giữa
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x + 20, y + 4, 320, 22, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = col; c.beginPath(); c.moveTo(x - 300, y - 120); c.lineTo(x - 250, y - 250); c.lineTo(x - 200, y - 250); c.lineTo(x - 170, y - 125); c.closePath(); c.fill();
    const g = c.createLinearGradient(0, y - 150, 0, y - 60); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ced4da');
    c.fillStyle = g; c.beginPath(); c.moveTo(x - 310, y - 110); c.quadraticCurveTo(x - 300, y - 150, x - 240, y - 152); c.lineTo(x + 230, y - 152); c.quadraticCurveTo(x + 330, y - 145, x + 340, y - 100); c.quadraticCurveTo(x + 330, y - 62, x + 250, y - 60); c.lineTo(x - 250, y - 62); c.quadraticCurveTo(x - 300, y - 68, x - 310, y - 110); c.closePath(); c.fill();
    c.fillStyle = col; c.fillRect(x - 290, y - 92, 600, 10);
    c.fillStyle = '#1b2f48'; c.font = '900 30px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('QUANGLAM AIR', x - 20, y - 125);
    c.fillStyle = '#1b2f48'; c.beginPath(); c.moveTo(x + 268, y - 140); c.quadraticCurveTo(x + 318, y - 132, x + 330, y - 112); c.lineTo(x + 280, y - 112); c.closePath(); c.fill();
    for (let k = 0; k < 14; k++) { c.fillStyle = '#74c0fc'; c.beginPath(); c.roundRect(x - 230 + k * 32, y - 116, 16, 18, 6); c.fill(); }
    c.fillStyle = '#adb5bd'; c.fillRect(x + 196, y - 140, 26, 60);                    // cửa
    c.fillStyle = '#868e96'; c.beginPath(); c.moveTo(x - 60, y - 80); c.lineTo(x - 170, y - 30); c.lineTo(x - 90, y - 30); c.lineTo(x + 40, y - 80); c.closePath(); c.fill();
    c.fillStyle = '#495057'; c.beginPath(); c.roundRect(x - 120, y - 52, 90, 30, 14); c.fill();
    [[-200, 0], [10, 0], [270, 0]].forEach(([dx]) => { c.fillStyle = '#343a40'; c.fillRect(x + dx - 3, y - 62, 6, 50); c.fillStyle = '#212529'; c.beginPath(); c.arc(x + dx, y - 10, 12, 0, Math.PI * 2); c.fill(); });
    // xe thang lên máy bay
    c.fillStyle = '#f1f3f5'; c.beginPath(); c.moveTo(x + 196, y - 82); c.lineTo(x + 290, y); c.lineTo(x + 250, y); c.lineTo(x + 180, y - 70); c.closePath(); c.fill();
    c.strokeStyle = '#adb5bd'; c.lineWidth = 3; for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(x + 190 + k * 13, y - 76 + k * 11.5); c.lineTo(x + 205 + k * 13, y - 76 + k * 11.5); c.stroke(); }
    c.fillStyle = '#fab005'; c.fillRect(x + 250, y - 14, 60, 14);
  }
  function airport(apId) {
    const ap = DATA.AIRPORTS.find((a) => a.id === apId);
    const m = base('apt_' + apId, ap.name, 2600, 1100);
    m.hz = 230;
    const RT = 255, RB = 395, AP_T = 480;
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 71);
      const sk = g.createLinearGradient(0, 0, 0, 230); sk.addColorStop(0, '#74c0fc'); sk.addColorStop(1, '#d0ebff');
      g.fillStyle = sk; g.fillRect(0, 0, m.w, 230);
      g.fillStyle = '#a5c8a0'; for (let x = 0; x < m.w; x += 160) { g.beginPath(); g.ellipse(x + 80, 232, 120, 34, 0, Math.PI, 0); g.fill(); }
      // đường băng
      g.fillStyle = '#3d4148'; g.fillRect(0, RT, m.w, RB - RT);
      g.fillStyle = '#f8f9fa'; g.fillRect(0, RT + 8, m.w, 4); g.fillRect(0, RB - 12, m.w, 4);
      for (let x = 260; x < m.w - 260; x += 120) g.fillRect(x, (RT + RB) / 2 - 3, 60, 6);
      for (const x0 of [40, m.w - 160]) for (let k = 0; k < 8; k++) g.fillRect(x0, RT + 22 + k * 14, 120, 7);
      g.font = '900 54px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('11', 240, (RT + RB) / 2); g.fillText('29', m.w - 240, (RT + RB) / 2);
      // đường lăn + sân đỗ
      g.fillStyle = '#5c6068'; g.fillRect(300, RB, 120, AP_T - RB); g.fillRect(2180, RB, 120, AP_T - RB);
      g.strokeStyle = '#ffd43b'; g.lineWidth = 4; [[360, RB, 360, AP_T + 40], [2240, RB, 2240, AP_T + 40]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); });
      g.fillStyle = '#c9c7bf'; g.fillRect(100, AP_T, m.w - 200, 1060 - AP_T);
      g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2;
      for (let x = 100; x < m.w - 100; x += 100) { g.beginPath(); g.moveTo(x, AP_T); g.lineTo(x, 1060); g.stroke(); }
      for (let y = AP_T; y < 1060; y += 100) { g.beginPath(); g.moveTo(100, y); g.lineTo(m.w - 100, y); g.stroke(); }
      g.strokeStyle = '#ffd43b'; g.lineWidth = 5; g.beginPath(); g.moveTo(360, AP_T + 40); g.quadraticCurveTo(380, 700, 760, 708); g.lineTo(1300, 708); g.stroke();
      g.fillStyle = '#ffd43b'; g.font = '900 24px "Be Vietnam Pro", system-ui'; g.fillText('GATE 3', 760, 740);
      // lối đi bộ vạch kẻ tới nhà ga
      g.fillStyle = 'rgba(255,255,255,.85)'; for (let x = 1060; x < 1880; x += 40) g.fillRect(x, 820, 24, 50);
    });
    // tháp điều khiển
    obj(m, 250, (c) => {
      const x = 2440;
      c.fillStyle = '#dee2e6'; c.fillRect(x - 18, 40, 36, 210);
      c.fillStyle = '#495057'; c.beginPath(); c.moveTo(x - 46, 40); c.lineTo(x + 46, 40); c.lineTo(x + 36, 0); c.lineTo(x - 36, 0); c.closePath(); c.fill();
      c.fillStyle = '#74c0fc'; c.fillRect(x - 38, 8, 76, 26);
      c.fillStyle = '#e03131'; c.beginPath(); c.arc(x, -6, 5, 0, Math.PI * 2); c.fill();
    }, [2380, -20, 2500, 260]);
    // máy bay đỗ
    sobj(m, 760, 690, (c) => bigPlane(c, 760, 690, ap.color), { l: -330, t: -260, w: 680, h: 280 });
    col(m, 460, 650, 600, 40);
    // nhà ga
    const TL = 1420, TR = 2440, TB = 800;
    sobj(m, (TL + TR) / 2, TB, (c) => {
      const w = TR - TL;
      c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(TL, TB - 4, w, 14);
      c.fillStyle = '#e9ecef'; c.fillRect(TL, TB - 280, w, 280);
      c.fillStyle = ap.color; c.beginPath(); c.moveTo(TL - 30, TB - 280); c.quadraticCurveTo((TL + TR) / 2, TB - 380, TR + 30, TB - 280); c.closePath(); c.fill();
      const gl = c.createLinearGradient(0, TB - 250, 0, TB); gl.addColorStop(0, '#a5d8ff'); gl.addColorStop(1, '#4dabf7');
      c.fillStyle = gl; c.fillRect(TL + 16, TB - 250, w - 32, 240);
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 3; for (let x = TL + 16; x < TR - 16; x += 70) { c.beginPath(); c.moveTo(x, TB - 250); c.lineTo(x, TB - 10); c.stroke(); }
      c.beginPath(); c.moveTo(TL + 16, TB - 130); c.lineTo(TR - 16, TB - 130); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.roundRect((TL + TR) / 2 - 360, TB - 340, 720, 74, 14); c.fill();
      c.strokeStyle = ap.color; c.lineWidth = 5; c.stroke();
      c.fillStyle = ap.color; c.font = '900 38px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ap.name.toUpperCase(), (TL + TR) / 2, TB - 314);
      c.fillStyle = '#495057'; c.font = '800 16px "Be Vietnam Pro", system-ui'; c.fillText(`${ap.en} · ${ap.code} · ${ap.city}`, (TL + TR) / 2, TB - 282);
      c.fillStyle = '#1b2f48'; c.fillRect(TR - 260, TB - 240, 210, 40); c.fillStyle = '#ffd43b'; c.font = '900 18px "Be Vietnam Pro", system-ui'; c.fillText('🛬 GA ĐẾN · ARRIVALS', TR - 155, TB - 220);
    }, { l: -(TR - TL) / 2 - 40, t: -390, w: TR - TL + 80, h: 400 });
    col(m, TL, TB - 40, 400, 40); col(m, 1750, TB - 40, TR - 1750, 40);
    // quầy vé
    const QX = 1520, QY = 880;
    sobj(m, QX, QY, (c) => {
      c.fillStyle = ap.color; c.beginPath(); c.roundRect(QX - 90, QY - 60, 180, 60, 10); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.roundRect(QX - 96, QY - 110, 192, 40, 10); c.fill();
      c.fillStyle = ap.color; c.font = '900 17px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('✈️ QUẦY BÁN VÉ', QX, QY - 90);
      c.fillStyle = '#fff'; c.font = '800 13px "Be Vietnam Pro", system-ui'; c.fillText('QUANGLAM AIR', QX, QY - 30);
    }, { l: -100, t: -115, w: 200, h: 120 });
    col(m, QX - 90, QY - 40, 180, 38);
    inter(m, { x: QX - 96, y: QY - 115, w: 192, h: 115, ax: QX, ay: QY + 30, name: 'Quầy bán vé máy bay', use: () => UI.flightDesk(), arrow: { x: QX, y: QY - 130, text: 'Mua vé bay' } });
    // cổng an ninh
    const GX = 1600 + 0, GY2 = 800;
    const SX = 1650;
    sobj(m, SX, GY2, (c) => {
      c.fillStyle = '#495057'; c.fillRect(SX - 70, GY2 - 130, 12, 130); c.fillRect(SX - 6, GY2 - 130, 12, 130); c.fillRect(SX - 70, GY2 - 136, 76, 14);
      c.fillStyle = '#69db7c'; c.beginPath(); c.arc(SX - 32, GY2 - 146, 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#343a40'; c.beginPath(); c.roundRect(SX + 16, GY2 - 70, 80, 70, 8); c.fill();
      c.fillStyle = '#212529'; c.fillRect(SX + 10, GY2 - 30, 92, 10);
      c.fillStyle = '#1b2f48'; c.beginPath(); c.roundRect(SX - 90, GY2 - 196, 200, 40, 10); c.fill();
      c.fillStyle = '#fff'; c.font = '900 17px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🛃 CỬA AN NINH · LỐI RA', SX + 10, GY2 - 176);
    }, { l: -100, t: -200, w: 210, h: 205 });
    inter(m, { x: SX - 80, y: GY2 - 150, w: 100, h: 160, ax: SX - 32, ay: GY2 + 40, name: 'Cửa an ninh → ra khu', use: () => AV.exitAirport(), arrow: { x: SX - 32, y: GY2 - 210, text: 'Ra khỏi sân bay' } });
    npc(m, 'An ninh sân bay', { skin: '#f1c27d', hair: 'short', hairColor: '#222', shirt: '#1c7ed6', shirtStyle: 'plain', pants: '#212529', hat: 'cap' }, { l: 1700, t: 830, r: 1760, b: 850 }, 1730, 840, 'none');
    // bảng giờ bay
    sobj(m, 1240, 840, (c) => {
      c.fillStyle = '#495057'; c.fillRect(1236, 760, 8, 80);
      c.fillStyle = '#111'; c.beginPath(); c.roundRect(1150, 660, 180, 104, 8); c.fill();
      c.fillStyle = '#ffd43b'; c.font = '900 12px monospace'; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('CHUYẾN    ĐI   TỚI', 1160, 676);
      DATA.AIRPORTS.filter((a) => a.id !== apId).slice(0, 4).forEach((a, i) => { c.fillStyle = i % 2 ? '#69db7c' : '#fff'; c.fillText(`QL${101 + i * 7}  ${ap.code} ${a.code}  ${i % 3 ? 'ĐÚNG GIỜ' : 'LÊN TÀU'}`, 1160, 696 + i * 17); });
    }, { l: -95, t: -185, w: 190, h: 190 });
    // ống gió + xe hành lý + cây
    obj(m, 470, (c, t) => { c.fillStyle = '#868e96'; c.fillRect(196, 400, 4, 70); c.fillStyle = '#ff922b'; c.beginPath(); c.moveTo(200, 402); c.lineTo(250, 408 + Math.sin(t * 3) * 3); c.lineTo(250, 418 + Math.sin(t * 3) * 3); c.lineTo(200, 416); c.closePath(); c.fill(); }, [190, 395, 260, 475]);
    sobj(m, 1180, 600, (c) => { c.fillStyle = '#fab005'; c.beginPath(); c.roundRect(1130, 566, 60, 30, 6); c.fill(); c.fillStyle = '#868e96'; for (let k = 0; k < 2; k++) { c.fillRect(1196 + k * 70, 570, 64, 22); } c.fillStyle = '#212529'; [1145, 1180, 1215, 1250, 1290, 1320].forEach((x) => { c.beginPath(); c.arc(x, 598, 6, 0, Math.PI * 2); c.fill(); }); }, { l: -60, t: -40, w: 210, h: 46 });
    for (let i = 0; i < 6; i++) { const x = 160 + i * 220, y = 1070; if (ap.palm) { sobj(m, x, y, (c) => ART.palm(c, x, y)); col(m, x - 14, y - 10, 28, 12); } else addTree(m, x, y, i % 2 ? 'green' : 'pink'); }
    m.labels.push({ text: `✈️ ${ap.name} (${ap.code})`, x: 760, y: 455 });
    m.lights = [];
    for (let x = 60; x < m.w; x += 180) m.lights.push([x, RT, 20], [x, RB, 20]);
    m.lights.push([1240, 650, 60], [QX, QY - 100, 60], [SX, GY2 - 160, 60]);
    m.spawn = { x: 1000, y: 770 };
    m.bounds = { l: 110, t: AP_T + 10, r: m.w - 110, b: 1040 };
    m.airport = ap;
    return m;
  }

  /* ---------- ⛏️ Mỏ Quảng Ninh: cửa hầm + lò rèn ---------- */
  function mine() {
    const m = base('mine', 'Mỏ Quảng Ninh', 2400, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 131);
      g.fillStyle = '#b8a48a'; g.fillRect(0, 380, m.w, 470);
      g.fillStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i < 260; i++) { g.beginPath(); g.arc((i * 97) % m.w, 390 + (i * 53) % 450, 3 + (i % 4), 0, Math.PI * 2); g.fill(); }
      paintStreet(g, m.w, 870, 1000);
    });
    sobj(m, 1350, 640, (c) => MINE.entrance(c, 1350, 640), { l: -340, t: -400, w: 710, h: 520 });
    col(m, 1020, 450, 220, 190); col(m, 1460, 450, 230, 190); col(m, 1250, 450, 210, 100);
    inter(m, { x: 1260, y: 470, w: 180, h: 170, ax: 1350, ay: 700, name: 'Cửa hầm mỏ (xuống đào quặng)', use: () => MINE.enter(), arrow: { x: 1350, y: 460, text: 'Xuống hầm' } });
    sobj(m, 1700, 760, (c) => MINE.cart(c, 1700, 760), { l: -60, t: -70, w: 120, h: 76 });
    col(m, 1650, 740, 100, 20);
    aobj(m, 520, 720, (c, t) => MINE.forgeArt(c, 520, 720, t), { l: -200, t: -330, w: 400, h: 345 });
    col(m, 350, 640, 340, 80);
    inter(m, { x: 420, y: 560, w: 200, h: 160, ax: 520, ay: 760, name: 'Lò rèn (nâng cấp dụng cụ, bán quặng)', use: () => MINE.forge(), arrow: { x: 520, y: 540, text: 'Lò rèn' } });
    npc(m, 'Bác thợ mỏ Tâm', { skin: '#e0a370', hair: 'short', hairColor: '#333', shirt: '#868e96', shirtStyle: 'plain', pants: '#495057', hat: 'cap' }, { l: 700, t: 760, r: 1100, b: 830 }, 900, 790, 'none');
    [[180, 600], [2200, 600], [2000, 560]].forEach(([x, y]) => addTree(m, x, y, 'green'));
    m.labels.push({ text: '⛏️ Mỏ Quảng Ninh', x: 1350, y: 400 });
    street(m);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 420, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  /* ---------- 🥊 Võ Đài Quyền Anh (dùng chung) ---------- */
  function boxing() {
    const m = base('boxing', 'Võ Đài', 2000, 1100);
    m.indoor = true;
    m.hz = 0;
    m.zoom = 0.8;
    ground(m, (g) => {
      g.fillStyle = '#14161d'; g.fillRect(0, 0, m.w, m.h);
      g.fillStyle = '#2b2f3a'; g.fillRect(40, 20, 1920, 170);
      for (let r = 0; r < 5; r++) { g.fillStyle = r % 2 ? '#2a2c34' : '#32353f'; g.fillRect(40, 190 + r * 34, 1920, 34); }
      g.fillStyle = '#5c3d1e'; g.fillRect(40, 360, 1920, 16);
      g.fillStyle = '#23262f'; g.fillRect(40, 376, 1920, 684);
      g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 2;
      for (let x = 40; x < 1960; x += 120) { g.beginPath(); g.moveTo(x, 376); g.lineTo(x, 1060); g.stroke(); }
      for (let y = 376; y < 1060; y += 120) { g.beginPath(); g.moveTo(40, y); g.lineTo(1960, y); g.stroke(); }
      const sp = g.createRadialGradient(1000, 700, 40, 1000, 700, 520); sp.addColorStop(0, 'rgba(255,240,200,.18)'); sp.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = sp; g.fillRect(400, 300, 1200, 760);
      g.fillStyle = '#14161d'; g.fillRect(0, 1060, m.w, 40); g.fillRect(0, 0, 40, m.h); g.fillRect(1960, 0, 40, m.h);
    });
    obj(m, 190, (c, t) => BOX.board(c, t), [700, 10, 1300, 200]);
    obj(m, 360, (ctx, t) => ARENA.drawCrowd(ctx, t), [40, 180, 1960, 370]);
    const R = BOX.RING;
    obj(m, R.y - R.h / 2 - 1, (c) => BOX.ringBack(c), [R.x - R.w / 2 - 30, R.y - R.h / 2 - 70, R.x + R.w / 2 + 30, R.y + R.h / 2 + 45]);
    obj(m, R.y + R.h / 2 - 2, (c, t) => BOX.ringFighters(c, t), [R.x - R.w / 2, R.y - R.h / 2 - 160, R.x + R.w / 2, R.y + R.h / 2]);
    obj(m, R.y + R.h / 2 + 1, (c) => BOX.ringFront(c), [R.x - R.w / 2 - 10, R.y + R.h / 2 - 70, R.x + R.w / 2 + 10, R.y + R.h / 2]);
    col(m, R.x - R.w / 2 - 20, R.y - R.h / 2 - 10, R.w + 40, R.h + 50);
    inter(m, { x: R.x - R.w / 2, y: R.y - R.h / 2 - 60, w: R.w, h: R.h + 100, ax: R.x, ay: R.y + R.h / 2 + 70, name: 'Võ đài (xem trận · đặt cược)', use: () => BOX.watchPanel() });
    // quầy đăng ký + quầy cược
    [[300, '📋 ĐĂNG KÝ ĐẤU', () => BOX.lobby(), 'Thách đấu'], [1700, '💰 QUẦY CƯỢC', () => BOX.watchPanel(), 'Đặt cược']].forEach(([x, label, use, arrow]) => {
      const y = 800;
      sobj(m, x, y, (c) => {
        c.fillStyle = '#7a4a26'; c.beginPath(); c.roundRect(x - 110, y - 60, 220, 60, 10); c.fill();
        c.fillStyle = '#a0632f'; c.fillRect(x - 110, y - 64, 220, 12);
        c.fillStyle = '#495057'; c.fillRect(x - 96, y - 150, 8, 90); c.fillRect(x + 88, y - 150, 8, 90);
        c.fillStyle = '#8b1a1a'; c.beginPath(); c.roundRect(x - 112, y - 186, 224, 46, 10); c.fill();
        c.strokeStyle = '#ffd43b'; c.lineWidth = 3; c.stroke();
        c.font = '900 20px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffd43b'; c.fillText(label, x, y - 162);
        c.font = '26px system-ui'; c.fillText(x < 1000 ? '🥊📝🥊' : '🪙🪙💵', x, y - 90);
      }, { l: -120, t: -195, w: 240, h: 200 });
      col(m, x - 110, y - 50, 220, 48);
      inter(m, { x: x - 110, y: y - 190, w: 220, h: 190, ax: x, ay: y + 30, name: label.slice(3), use, arrow: { x, y: y - 205, text: arrow } });
    });
    npc(m, 'Trọng tài Tuấn', { skin: '#f1c27d', hair: 'short', hairColor: '#222', shirt: '#f8f9fa', shirtStyle: 'stripes', pants: '#212529', hat: 'none' }, { l: 600, t: 900, r: 1400, b: 980 }, 1000, 940, 'none');
    sobj(m, 1000, 1062, (c) => ART.homeDoor(c, 1000, 1062), { l: -50, t: -22, w: 100, h: 28 });
    inter(m, { x: 940, y: 1000, w: 120, h: 70, ax: 1000, ay: 1030, name: 'Ra Khu giải trí', use: () => AV.teleport('fun', false, 4640, 840, '🎡 Ra Khu giải trí…'), arrow: { x: 1000, y: 1005, text: 'Ra ngoài' } });
    m.spawn = { x: 1000, y: 1000 };
    m.bounds = { l: 56, t: 392, r: m.w - 56, b: 1040 };
    return m;
  }

  /* ---------- 🎬 Rạp CGV (trong rạp, dùng chung) ---------- */
  /* ---------- 🏥 Bệnh viện Zeno (bên ngoài) ---------- */
  /** 💊 Nhà thuốc Long Châu: biển xanh dương, cửa kính, kệ thuốc, chữ thập xanh */
  function pharmacyArt(c, x, y) {
    const W = 290, L = x - W / 2;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 5, W / 2 + 16, 14, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f8f9fa'; c.fillRect(L, y - 190, W, 190);
    c.fillStyle = '#dee2e6'; c.fillRect(L, y - 8, W, 8);
    // biển hiệu xanh
    const g = c.createLinearGradient(0, y - 236, 0, y - 176); g.addColorStop(0, '#1d4ed8'); g.addColorStop(1, '#1e3a8a');
    c.fillStyle = g; c.beginPath(); c.roundRect(L - 10, y - 236, W + 20, 62, 8); c.fill();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    c.font = '800 13px "Be Vietnam Pro", system-ui'; c.fillText('NHÀ THUỐC', x + 18, y - 220);
    c.font = '900 25px "Be Vietnam Pro", system-ui'; c.fillText('LONG CHÂU', x + 18, y - 194);
    // logo tròn
    c.fillStyle = '#fff'; c.beginPath(); c.arc(L + 30, y - 205, 20, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1d4ed8'; c.font = '900 20px "Be Vietnam Pro", system-ui'; c.fillText('LC', L + 30, y - 204);
    // cửa kính + kệ thuốc
    const glass = (gx, gw) => {
      c.fillStyle = '#343a40'; c.fillRect(gx - 3, y - 160, gw + 6, 152);
      const gg = c.createLinearGradient(gx, y - 158, gx + gw, y - 10); gg.addColorStop(0, '#e7f5ff'); gg.addColorStop(1, '#a5d8ff');
      c.fillStyle = gg; c.fillRect(gx, y - 157, gw, 146);
    };
    glass(L + 14, 98); glass(L + W - 112, 98);
    const meds = ['#ff6b6b', '#4dabf7', '#ffd43b', '#69db7c', '#f783ac', '#ffa94d'];
    [L + 18, L + W - 108].forEach((sx) => { for (let r = 0; r < 3; r++) { c.fillStyle = '#ced4da'; c.fillRect(sx, y - 128 + r * 38, 90, 4); for (let k = 0; k < 7; k++) { c.fillStyle = meds[(k + r * 2) % 6]; c.fillRect(sx + 4 + k * 12, y - 146 + r * 38, 9, 18); } } });
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(L + 22, y - 154, 10, 140); c.fillRect(L + W - 104, y - 154, 10, 140);
    // cửa tự động
    c.fillStyle = '#343a40'; c.fillRect(x - 33, y - 150, 66, 150);
    c.fillStyle = '#d0ebff'; c.fillRect(x - 30, y - 147, 29, 147); c.fillRect(x + 1, y - 147, 29, 147);
    c.fillStyle = '#1d4ed8'; c.fillRect(x - 30, y - 92, 60, 10);
    c.fillStyle = '#fff'; c.font = '800 7px "Be Vietnam Pro", system-ui'; c.fillText('MỞ CỬA 24/7', x, y - 87);
    // chữ thập xanh phát sáng
    c.fillStyle = '#2f9e44'; c.beginPath(); c.roundRect(L + W - 26, y - 290, 44, 44, 6); c.fill();
    c.fillStyle = '#fff'; c.fillRect(L + W - 10, y - 284, 12, 32); c.fillRect(L + W - 20, y - 274, 32, 12);
    c.fillStyle = '#6b4423'; c.fillRect(L + W - 6, y - 246, 4, 10);
  }
  function hospitalArt(c, x, y) {
    const W = 760, L = x - W / 2;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 6, W / 2 + 30, 26, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f8f9fa'; c.fillRect(L, y - 360, W, 360);
    c.fillStyle = '#e9ecef'; for (let k = 0; k < 5; k++) c.fillRect(L, y - 360 + k * 72, W, 3);
    c.fillStyle = '#1c7ed6'; c.fillRect(L - 12, y - 380, W + 24, 26);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
      if (r === 2 && i >= 3 && i <= 5) continue;
      const wx = L + 30 + i * 80, wy = y - 330 + r * 96;
      c.fillStyle = '#495057'; c.fillRect(wx - 2, wy - 2, 56, 58);
      const g = c.createLinearGradient(wx, wy, wx + 52, wy + 54); g.addColorStop(0, '#d0ebff'); g.addColorStop(1, '#74c0fc');
      c.fillStyle = g; c.fillRect(wx, wy, 52, 54);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(wx + 4, wy + 4, 8, 46);
    }
    // biển + chữ thập đỏ
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - 230, y - 450, 460, 70, 14); c.fill();
    c.strokeStyle = '#e03131'; c.lineWidth = 6; c.stroke();
    c.fillStyle = '#e03131'; c.fillRect(x - 210, y - 440, 50, 50); c.fillStyle = '#fff'; c.fillRect(x - 192, y - 434, 14, 38); c.fillRect(x - 204, y - 422, 38, 14);
    c.fillStyle = '#e03131'; c.font = '900 34px "Be Vietnam Pro", system-ui'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('BỆNH VIỆN ZENO', x - 148, y - 414);
    // sảnh kính + cửa
    c.fillStyle = '#1864ab'; c.fillRect(x - 130, y - 150, 260, 150);
    c.fillStyle = 'rgba(208,235,255,.9)'; c.fillRect(x - 122, y - 142, 120, 142); c.fillRect(x + 2, y - 142, 120, 142);
    c.fillStyle = '#e03131'; c.beginPath(); c.roundRect(x - 110, y - 190, 220, 36, 8); c.fill();
    c.fillStyle = '#fff'; c.font = '900 17px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.fillText('🚑 CẤP CỨU 24/7', x, y - 172);
    c.fillStyle = '#ced4da'; c.fillRect(x - 150, y - 4, 300, 10);
  }
  ART.ambulance = (c, x, y) => ambulance(c, x, y);
  /** 📱 cửa hàng điện thoại: 'cps' = CellphoneS (đỏ), 'tgdd' = Thế Giới Di Động (vàng) */
  function phoneStore(c, x, y, kind) {
    const W = 226, L = x - W / 2, cps = kind === 'cps';
    const main = cps ? '#d70018' : '#ffd400', ink = cps ? '#fff' : '#111';
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 4, W / 2 + 10, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = cps ? '#f8f9fa' : '#fffdf0'; c.fillRect(L, y - 150, W, 150);
    c.fillStyle = main; c.fillRect(L - 6, y - 196, W + 12, 50);
    c.fillStyle = cps ? '#a50013' : '#e0b800'; c.fillRect(L - 6, y - 150, W + 12, 5);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (cps) {
      c.fillStyle = '#fff'; c.font = 'italic 900 27px "Be Vietnam Pro", system-ui'; c.fillText('CellphoneS', x, y - 172);
    } else {
      c.fillStyle = '#111'; c.beginPath(); c.arc(L + 22, y - 171, 15, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffd400'; c.beginPath(); c.arc(L + 22, y - 175, 5, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(L + 22, y - 163, 9, 5, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#111'; c.font = '900 15px "Be Vietnam Pro", system-ui'; c.fillText('thegioididong', x + 14, y - 178);
      c.font = '800 10px "Be Vietnam Pro", system-ui'; c.fillText('.com', x + 70, y - 163);
    }
    // tủ kính bày điện thoại
    const glass = (gx, gw) => {
      c.fillStyle = '#495057'; c.fillRect(gx - 2, y - 132, gw + 4, 120);
      const gg = c.createLinearGradient(gx, y - 130, gx + gw, y - 14); gg.addColorStop(0, '#f1f3f5'); gg.addColorStop(1, '#ced4da');
      c.fillStyle = gg; c.fillRect(gx, y - 130, gw, 116);
      const cols = ['#212529', '#ff922b', '#a5d8ff', '#e9ecef', '#5f3dc4', '#63e6be'];
      for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) {
        const px = gx + 8 + k * ((gw - 16) / 4), py = y - 118 + r * 50;
        c.fillStyle = '#868e96'; c.fillRect(px - 2, py + 34, 18, 3);
        c.fillStyle = cols[(k + r * 3) % 6]; c.beginPath(); c.roundRect(px, py, 14, 30, 3); c.fill();
        c.fillStyle = '#74c0fc'; c.fillRect(px + 2, py + 3, 10, 22);
      }
      c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(gx + 4, y - 128, 7, 110);
    };
    glass(L + 10, 70); glass(L + W - 80, 70);
    // cửa
    c.fillStyle = '#343a40'; c.fillRect(x - 30, y - 128, 60, 128);
    c.fillStyle = '#d0ebff'; c.fillRect(x - 27, y - 125, 26, 125); c.fillRect(x + 1, y - 125, 26, 125);
    c.fillStyle = main; c.beginPath(); c.roundRect(x - 26, y - 92, 52, 16, 4); c.fill();
    c.fillStyle = ink; c.font = '900 8px "Be Vietnam Pro", system-ui'; c.fillText(cps ? 'GIẢM 3%' : 'TRẢ GÓP 0%', x, y - 84);
  }
  function ambulance(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 2, 110, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - 100, y - 82, 140, 70, 8); c.fill(); c.beginPath(); c.roundRect(x + 40, y - 62, 58, 50, 8); c.fill();
    c.fillStyle = '#74c0fc'; c.fillRect(x + 52, y - 56, 36, 20);
    c.fillStyle = '#e03131'; c.fillRect(x - 100, y - 44, 198, 8); c.fillRect(x - 46, y - 74, 12, 30); c.fillRect(x - 55, y - 65, 30, 12);
    c.fillStyle = '#1c7ed6'; c.fillRect(x - 20, y - 92, 26, 10);
    c.fillStyle = '#212529'; [x - 60, x + 60].forEach((wx) => { c.beginPath(); c.arc(wx, y - 12, 13, 0, Math.PI * 2); c.fill(); });
  }
  function hospital() {
    const m = base('hospital', 'Bệnh viện Zeno', 2000, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 141);
      paintPaved(g, 120, 370, 1760, 455, '#eef2f5');
      paintStreet(g, m.w, 870, 1000);
    });
    sobj(m, 1000, 700, (c) => hospitalArt(c, 1000, 700), { l: -400, t: -460, w: 800, h: 475 });
    col(m, 620, 560, 250, 140); col(m, 1130, 560, 250, 140); col(m, 870, 560, 260, 70);
    inter(m, { x: 880, y: 550, w: 240, h: 150, ax: 1000, ay: 740, name: 'Vào Bệnh viện Zeno', use: () => AV.teleport('clinic', false, 800, 900, '🏥 Vào bệnh viện…'), arrow: { x: 1000, y: 520, text: 'Vào khám bệnh' } });
    sobj(m, 1520, 760, (c) => ambulance(c, 1520, 760), { l: -115, t: -100, w: 230, h: 112 });
    /* 💊 nhà thuốc Long Châu bên trái bệnh viện */
    const PX = 330, PY = 700;
    sobj(m, PX, PY, (c) => pharmacyArt(c, PX, PY), { l: -165, t: -300, w: 350, h: 312 });
    m.objects[m.objects.length - 1].b3d = { w: 290, h: 190, roof: '#1d4ed8', wall: '#f8f9fa' };
    col(m, PX - 145, PY - 40, 110, 40); col(m, PX + 35, PY - 40, 110, 40); col(m, PX - 35, PY - 40, 70, 12);
    inter(m, { x: PX - 60, y: PY - 160, w: 120, h: 162, ax: PX, ay: PY + 30, name: 'Nhà thuốc Long Châu (thuốc bổ +XP, thuốc cảm cúm)', use: () => UI.pharmacyPanel(), arrow: { x: PX, y: PY - 310, text: 'Nhà thuốc' } });
    col(m, 1410, 720, 200, 40);
    [[1750, 600, 'pink'], [1880, 760, 'green']].forEach(([x, y, v]) => addTree(m, x, y, v));
    addBench(m, 545, 800);
    m.labels.push({ text: '🏥 Bệnh viện Zeno', x: 1000, y: 395 });
    npc(m, 'Y tá Thảo', { skin: '#ffe0c4', hair: 'bun', hairColor: '#3b2a1a', shirt: '#f8f9fa', shirtStyle: 'plain', pants: '#f8f9fa', hat: 'none' }, { l: 700, t: 760, r: 1300, b: 840 }, 1150, 790, 'none');
    street(m, 1760, 1250);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 420, r: m.w - 20, b: m.h - 40 };
    return m;
  }
  /* ---------- 🏥 Bên trong bệnh viện: tiếp đón, phòng khám, phòng tiêm, nhà thuốc, phòng truyền nước ---------- */
  function clinic() {
    const m = base('clinic', 'Bệnh viện Zeno', 1600, 1000);
    m.indoor = true; m.hz = 0;
    const R = { lobby: [40, 580, 760, 380, '#eef6ff'], doc: [40, 240, 520, 340, '#f1f3f5'], shot: [560, 240, 480, 340, '#fff0f6'], ward: [1040, 240, 520, 720, '#ebfbee'], pharm: [800, 580, 240, 380, '#fff9db'] };
    ground(m, (g) => {
      g.fillStyle = '#2b3a4a'; g.fillRect(0, 0, m.w, m.h);
      g.fillStyle = '#e7f5ff'; g.fillRect(40, 20, 1520, 220);
      g.fillStyle = '#74c0fc'; g.fillRect(40, 200, 1520, 40);
      Object.values(R).forEach(([x, y, w, h, c]) => { g.fillStyle = c; g.fillRect(x, y, w, h); g.strokeStyle = 'rgba(0,0,0,.06)'; g.lineWidth = 2; for (let yy = y; yy < y + h; yy += 40) for (let xx = x; xx < x + w; xx += 40) g.strokeRect(xx, yy, 40, 40); });
      g.fillStyle = '#e03131'; g.fillRect(760, 60, 80, 80); g.fillStyle = '#fff'; g.fillRect(788, 70, 24, 60); g.fillRect(770, 88, 60, 24);
      g.fillStyle = '#1c7ed6'; g.font = '900 30px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BỆNH VIỆN ZENO · Tận tâm vì sức khoẻ của bạn', 800, 170);
      g.fillStyle = '#a61e4d'; g.fillRect(740, 900, 120, 46);
      g.fillStyle = '#2b3a4a'; g.fillRect(0, 960, m.w, 40); g.fillRect(0, 0, 40, m.h); g.fillRect(1560, 0, 40, m.h);
    });
    const wallH = (x1, x2, y) => { sobj(m, x1, y, (c) => ART.innerWallH(c, x1, x2, y), { l: -10, t: -70, w: x2 - x1 + 20, h: 74 }); col(m, x1, y - 14, x2 - x1, 16); };
    const wallV = (x, y1, y2) => { sobj(m, x, y2, (c) => ART.innerWallV(c, x, y1, y2), { l: -16, t: y1 - y2 - 70, w: 32, h: y2 - y1 + 74 }); col(m, x - 10, y1, 20, y2 - y1); };
    [[40, 200], [340, 720], [880, 1040]].forEach(([a, b]) => wallH(a, b, 580));
    wallV(560, 240, 400); wallV(1040, 240, 380); wallV(1040, 470, 960); wallV(800, 600, 820);
    const lab = (t, x, y) => m.labels.push({ text: t, x, y });
    lab('🩺 Phòng khám', 300, 262); lab('💉 Phòng tiêm', 800, 262); lab('🛏️ Truyền nước', 1300, 262); lab('🛎️ Tiếp đón', 420, 602); lab('💊 Nhà thuốc', 920, 602);
    const H = DATA.HOSPITAL, fmt = (n) => n.toLocaleString('vi-VN');
    // phòng khám: bàn bác sĩ
    sobj(m, 300, 420, (c) => { c.save(); c.translate(300, 420); c.scale(2.4, 2.4); c.translate(-300, -420); ART.desk(c, 300, 420); c.restore(); c.font = '24px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.fillText('🩺', 330, 330); }, { l: -90, t: -110, w: 180, h: 120 });
    col(m, 220, 380, 160, 40);
    inter(m, { x: 210, y: 300, w: 180, h: 130, ax: 300, ay: 470, name: `Bác sĩ khám bệnh (${fmt(H.exam)} xu)`, use: () => AV.hospital('exam'), arrow: { x: 300, y: 290, text: 'Khám bệnh' } });
    npc(m, 'Bác sĩ Minh', { skin: '#f1c27d', hair: 'short', hairColor: '#222', shirt: '#ffffff', shirtStyle: 'plain', pants: '#1c7ed6', hat: 'none' }, { l: 280, t: 330, r: 320, b: 345 }, 300, 340, 'none');
    // phòng tiêm: ghế + khay kim tiêm
    sobj(m, 800, 420, (c) => { c.fillStyle = '#e64980'; c.beginPath(); c.roundRect(740, 380, 90, 40, 10); c.fill(); c.fillStyle = '#c2255c'; c.fillRect(740, 360, 20, 60); c.fillStyle = '#dee2e6'; c.fillRect(860, 370, 60, 8); c.font = '26px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.fillText('💉', 890, 356); }, { l: -80, t: -90, w: 200, h: 100 });
    col(m, 740, 380, 180, 40);
    inter(m, { x: 730, y: 320, w: 200, h: 110, ax: 800, ay: 470, name: `Tiêm (${fmt(H.shot)} xu · khỏi sốt ngay)`, use: () => AV.hospital('shot'), arrow: { x: 800, y: 300, text: 'Tiêm' } });
    npc(m, 'Y tá Lan', { skin: '#ffe0c4', hair: 'long', hairColor: '#3b2a1a', shirt: '#f783ac', shirtStyle: 'plain', pants: '#ffffff', hat: 'none' }, { l: 860, t: 440, r: 900, b: 455 }, 880, 450, 'none');
    // nhà thuốc
    sobj(m, 920, 700, (c) => { c.fillStyle = '#2f9e44'; c.fillRect(830, 650, 180, 50); c.fillStyle = '#fff'; c.fillRect(830, 650, 180, 8); c.fillStyle = '#e9ecef'; c.fillRect(840, 600, 160, 46); c.font = '20px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.fillText('💊 🧴 💊 🩹', 920, 624); }, { l: -100, t: -110, w: 200, h: 120 });
    col(m, 830, 650, 180, 50);
    inter(m, { x: 830, y: 590, w: 180, h: 110, ax: 920, ay: 740, name: `Nhà thuốc (${fmt(H.pill)} xu · khỏi sau ${H.pillMin} phút)`, use: () => AV.hospital('pill'), arrow: { x: 920, y: 580, text: 'Mua thuốc' } });
    // phòng truyền nước: 3 giường + cây treo dịch
    [360, 560, 760].forEach((y) => {
      const x = 1250;
      sobj(m, x, y, (c) => { c.fillStyle = '#adb5bd'; c.fillRect(x - 90, y - 50, 180, 10); c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - 90, y - 70, 180, 34, 8); c.fill(); c.fillStyle = '#a5d8ff'; c.fillRect(x - 40, y - 68, 128, 30); c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - 86, y - 68, 40, 26, 8); c.fill(); c.fillStyle = '#868e96'; c.fillRect(x + 110, y - 140, 4, 100); c.fillStyle = 'rgba(165,216,255,.9)'; c.beginPath(); c.roundRect(x + 100, y - 150, 24, 30, 6); c.fill(); }, { l: -100, t: -160, w: 240, h: 170 });
      col(m, x - 90, y - 70, 180, 34);
      inter(m, { x: x - 90, y: y - 80, w: 180, h: 50, ax: x, ay: y + 10, name: `Giường truyền nước (${fmt(H.iv)} xu · đầy ⚡)`, use: () => { AV.hospital('iv'); }, arrow: y === 360 ? { x, y: y - 160, text: 'Truyền nước' } : undefined });
    });
    // quầy tiếp đón
    sobj(m, 420, 760, (c) => { c.fillStyle = '#1c7ed6'; c.beginPath(); c.roundRect(300, 720, 240, 50, 10); c.fill(); c.fillStyle = '#fff'; c.font = '900 16px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TIẾP ĐÓN · HƯỚNG DẪN', 420, 745); }, { l: -130, t: -50, w: 260, h: 60 });
    col(m, 300, 720, 240, 50);
    inter(m, { x: 300, y: 700, w: 240, h: 70, ax: 420, ay: 800, name: 'Quầy tiếp đón (hướng dẫn)', use: () => UI.toast(`🛎️ ${AV.isSick() ? 'Bạn đang sốt — vào 🩺 phòng khám trước, rồi sang 💉 tiêm hoặc 💊 nhà thuốc.' : 'Bệnh viện Zeno: 🩺 khám ' + fmt(H.exam) + ' · 💉 tiêm ' + fmt(H.shot) + ' · 💊 thuốc ' + fmt(H.pill) + ' · 💧 truyền nước ' + fmt(H.iv) + ' xu'}`, 6000) });
    npc(m, 'Y tá Hoa', { skin: '#ffe0c4', hair: 'bob', hairColor: '#6b3e26', shirt: '#74c0fc', shirtStyle: 'plain', pants: '#ffffff', hat: 'none' }, { l: 400, t: 690, r: 440, b: 700 }, 420, 695, 'none');
    [[120, 900], [700, 640]].forEach(([x, y]) => sobj(m, x, y, (c) => ART.plantPot(c, x, y), { l: -30, t: -95, w: 60, h: 100 }));
    // cửa ra
    sobj(m, 800, 962, (c) => ART.homeDoor(c, 800, 962), { l: -50, t: -22, w: 100, h: 28 });
    inter(m, { x: 740, y: 900, w: 120, h: 70, ax: 800, ay: 930, name: 'Ra ngoài', use: () => AV.teleport('hospital', false, 1000, 760, '🏥 Ra ngoài…'), arrow: { x: 800, y: 905, text: 'Ra ngoài' } });
    m.spawn = { x: 800, y: 900 };
    m.bounds = { l: 56, t: 262, r: m.w - 56, b: 940 };
    return m;
  }

  function cgv() {
    const m = base('cgv', 'Rạp CGV', 2000, 1250);
    m.indoor = true;
    m.hz = 0;
    m.music = 'mute';
    m.zoom = 0.62;
    m.camTop = 0;
    m.screen = { video: 'iRjt1n3mkN4', x: 260, y: 40, w: 1480, h: 600, tap: '▶ Bấm để xem phim' };
    ground(m, (g) => {
      g.fillStyle = '#0b0b10'; g.fillRect(0, 0, m.w, m.h);
      // rèm đỏ hai bên màn chiếu
      [[40, 210], [1790, 210]].forEach(([x, w]) => { for (let k = 0; k < w; k += 30) { g.fillStyle = k % 60 ? '#a61e1e' : '#c92a2a'; g.fillRect(x + k, 0, 30, 700); } });
      g.fillStyle = '#1a1a22'; g.fillRect(40, 700, 1920, 520);
      // bậc sàn + đèn lối đi
      for (let r = 0; r < 5; r++) { g.fillStyle = r % 2 ? '#22222c' : '#1c1c25'; g.fillRect(40, 760 + r * 90, 1920, 90); }
      g.fillStyle = '#7a1424'; g.fillRect(900, 700, 200, 520);
      for (let y = 720; y < 1220; y += 40) { g.fillStyle = '#ffd43b'; g.fillRect(896, y, 4, 8); g.fillRect(1100, y, 4, 8); }
      g.fillStyle = '#0b0b10'; g.fillRect(0, 1220, m.w, 30); g.fillRect(0, 0, 40, m.h); g.fillRect(1960, 0, 40, m.h);
    });
    // viền màn chiếu (video thật hiện đè lên)
    obj(m, 0, (c) => { c.fillStyle = '#000'; c.fillRect(250, 30, 1500, 620); c.strokeStyle = '#495057'; c.lineWidth = 8; c.strokeRect(250, 30, 1500, 620); }, [240, 20, 1760, 660]);
    col(m, 40, 0, 1920, 700);
    // ghế đỏ: 4 dãy mỗi bên lối đi
    [800, 890, 980, 1070].forEach((y, r) => [[180, 820], [1180, 1820]].forEach(([L, R]) => {
      sobj(m, (L + R) / 2, y, (c) => CONCERT.seats(c, L, R, y), { l: -(R - L) / 2 - 30, t: -60, w: R - L + 60, h: 66 }, y - 40);
      col(m, L - 20, y - 52, R - L + 40, 24);
      inter(m, { x: L - 20, y: y - 62, w: R - L + 40, h: 62, ax: (L + R) / 2, ay: y + 20, name: `Ghế xem phim (hàng ${String.fromCharCode(65 + r)})`, use: () => AV.sitSeat(L, R, y, '🎬 Ngồi xem phim — bấm nơi khác để đứng dậy', (g) => CONCERT.seatsFront(g, L, R, y)) });
    }));
    // quầy bắp nước
    sobj(m, 1780, 1185, (c) => {
      c.fillStyle = '#c92a2a'; c.beginPath(); c.roundRect(1680, 1130, 200, 55, 10); c.fill();
      c.fillStyle = '#ffd43b'; c.beginPath(); c.roundRect(1676, 1090, 208, 40, 10); c.fill();
      c.fillStyle = '#c92a2a'; c.font = '900 18px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🍿 BẮP NƯỚC', 1780, 1110);
      c.font = '26px system-ui'; c.fillText('🍿🥤🌭', 1780, 1160);
    }, { l: -110, t: -100, w: 220, h: 104 });
    col(m, 1680, 1130, 200, 50);
    inter(m, { x: 1680, y: 1090, w: 200, h: 95, ax: 1780, ay: 1080, name: 'Quầy bắp nước', use: () => UI.eateryPanel('cgv_snack'), arrow: { x: 1780, y: 1075, text: 'Bắp nước' } });
    // máy chọn phim: dán link YouTube tự xem
    sobj(m, 220, 1185, (c) => {
      c.fillStyle = '#1c7ed6'; c.beginPath(); c.roundRect(150, 1100, 140, 85, 12); c.fill();
      c.fillStyle = '#0b1730'; c.beginPath(); c.roundRect(162, 1110, 116, 46, 6); c.fill();
      c.fillStyle = '#74c0fc'; c.font = '900 15px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('▶ YouTube', 220, 1133);
      c.fillStyle = '#fff'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.fillText('🎬 CHỌN PHIM', 220, 1171);
    }, { l: -80, t: -95, w: 160, h: 100 });
    col(m, 150, 1130, 140, 50);
    inter(m, { x: 150, y: 1100, w: 140, h: 85, ax: 220, ay: 1080, name: 'Máy chọn phim (dán link YouTube)', use: () => UI.moviePicker(), arrow: { x: 220, y: 1085, text: 'Chọn phim' } });
    sobj(m, 1000, 1222, (c) => ART.homeDoor(c, 1000, 1222), { l: -50, t: -22, w: 100, h: 28 });
    inter(m, { x: 940, y: 1160, w: 120, h: 70, ax: 1000, ay: 1190, name: 'Ra Khu giải trí', use: () => AV.teleport('fun', false, 4080, 840, '🎡 Ra Khu giải trí…'), arrow: { x: 1000, y: 1165, text: 'Ra ngoài' } });
    m.spawn = { x: 1000, y: 1150 };
    m.bounds = { l: 56, t: 720, r: m.w - 56, b: 1205 };
    return m;
  }

  /* ---------- Trường Đua Ngựa (dùng chung) ---------- */
  function horse() {
    const m = base('horse', 'Trường Đua Ngựa', 2000, 1150);
    m.indoor = true;
    m.hz = 0;
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 77);
      // khán đài có mái
      g.fillStyle = '#2f9e44'; g.fillRect(40, 20, 1920, 50);
      g.fillStyle = '#e9ecef'; g.fillRect(40, 70, 1920, 150);
      for (let r = 0; r < 4; r++) { g.fillStyle = r % 2 ? '#c92a2a' : '#e03131'; g.fillRect(40, 220 + r * 34, 1920, 34); }
      g.fillStyle = '#fff'; g.fillRect(40, 356, 1920, 8);
      HORSE.ground(g);
      // lối đi cho khán giả phía dưới
      g.fillStyle = '#d6cfc4'; g.fillRect(40, 950, 1920, 160);
      g.fillStyle = 'rgba(0,0,0,.06)'; for (let x = 40; x < 1960; x += 60) g.fillRect(x, 950, 2, 160);
      g.fillStyle = '#fff'; for (let x = 60; x < 1950; x += 40) g.fillRect(x, 942, 6, 22); g.fillRect(40, 946, 1920, 5);
      g.fillStyle = '#1b2f1f'; g.fillRect(0, 1110, m.w, 40); g.fillRect(0, 0, 40, m.h); g.fillRect(1960, 0, 40, m.h);
    });
    obj(m, 150, (ctx) => HORSE.board(ctx, 1000, 140), [620, 60, 1380, 220]);
    obj(m, 360, (ctx, t) => ARENA.drawCrowd(ctx, t), [40, 180, 1960, 370]);
    obj(m, 935, (ctx, t) => HORSE.drawRace(ctx, t), [300, 300, 1700, 950]);
    inter(m, { x: 520, y: 420, w: 960, h: 480, ax: 1000, ay: 985, name: 'Đường đua (đặt cược)', use: () => HORSE.panel() });
    // 4 khán đài A B C D: bấm vào để ngồi xem ngựa đua
    [['A', 470], ['B', 790], ['C', 1210], ['D', 1530]].forEach(([k, cx]) => {
      const L = cx - 130, R = cx + 130, y = 1040;
      sobj(m, cx, y - 60, (c) => {
        // bậc sau cao hơn + lưng tựa
        c.fillStyle = '#6b4226'; c.fillRect(L + 6, y - 92, 6, 60); c.fillRect(R - 12, y - 92, 6, 60);
        c.fillStyle = '#8a5a3c'; c.beginPath(); c.roundRect(L, y - 96, R - L, 12, 4); c.fill();
        c.fillStyle = '#a0703c'; c.beginPath(); c.roundRect(L, y - 72, R - L, 10, 3); c.fill();
        c.fillStyle = '#7a4a26'; c.fillRect(L + 4, y - 62, R - L - 8, 26);
        // biển tên khán đài
        c.fillStyle = '#495057'; c.fillRect(cx - 3, y - 150, 6, 56);
        c.fillStyle = '#c92a2a'; c.beginPath(); c.roundRect(cx - 62, y - 178, 124, 36, 8); c.fill();
        c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
        c.font = '900 19px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
        c.fillText(`KHÁN ĐÀI ${k}`, cx, y - 160);
      }, { l: -140, t: -125, w: 280, h: 130 }, y - 60);
      obj(m, y - 21.5, (ctx) => ART.benchFront(ctx, L + 6, R - 6, y), [L, y - 40, R, y]);
      col(m, L + 4, y - 66, R - L - 8, 30);
      inter(m, { x: L, y: y - 110, w: R - L, h: 110, ax: cx, ay: y + 14, name: `Khán đài ${k} (ngồi xem đua ngựa)`, use: () => AV.sitSeat(L + 20, R - 20, y, `🏟️ Ngồi Khán đài ${k} xem đua ngựa — bấm nơi khác để đứng dậy`), arrow: { x: cx, y: y - 196, text: 'Ngồi xem' } });
    });
    [175, 1825].forEach((x) => {
      const y = 1010;
      sobj(m, x, y, (c) => {
        c.fillStyle = '#1b3d2a'; c.beginPath(); c.roundRect(x - 110, y - 60, 220, 60, 10); c.fill();
        c.fillStyle = '#2f9e44'; c.fillRect(x - 110, y - 64, 220, 12);
        c.fillStyle = '#495057'; c.fillRect(x - 96, y - 150, 8, 90); c.fillRect(x + 88, y - 150, 8, 90);
        c.fillStyle = '#ffd43b'; c.beginPath(); c.roundRect(x - 112, y - 186, 224, 46, 10); c.fill();
        c.strokeStyle = '#1b3d2a'; c.lineWidth = 3; c.stroke();
        c.font = '900 22px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1b3d2a'; c.fillText('🏇 QUẦY CƯỢC', x, y - 162);
        c.font = '22px system-ui'; c.fillText('🎟️🎟️💵', x, y - 80);
      }, { l: -120, t: -195, w: 240, h: 200 });
      col(m, x - 110, y - 50, 220, 48);
      inter(m, { x: x - 110, y: y - 190, w: 220, h: 190, ax: x, ay: y + 30, name: 'Quầy cược ngựa', use: () => HORSE.panel(), arrow: { x, y: y - 205, text: 'Đặt cược' } });
    });
    npc(m, 'Ông Bầu Ngựa', { skin: '#f1c27d', hair: 'short', hairColor: '#6b3e26', shirt: '#2f9e44', shirtStyle: 'plain', pants: '#8b5a2b', hat: 'cowboy' }, { l: 80, t: 1050, r: 320, b: 1090 }, 200, 1070, 'none');
    sobj(m, 1000, 1112, (c) => ART.homeDoor(c, 1000, 1112), { l: -50, t: -22, w: 100, h: 28 });
    inter(m, { x: 940, y: 1050, w: 120, h: 70, ax: 1000, ay: 1080, name: 'Ra Khu giải trí', use: () => AV.leaveHorse(), arrow: { x: 1000, y: 1055, text: 'Ra ngoài' } });
    m.spawn = { x: 1000, y: 1060 };
    m.bounds = { l: 56, t: 965, r: m.w - 56, b: 1095 };
    return m;
  }

  /* ---------- Công viên ---------- */
  function park() {
    const m = base('park', 'Công viên', 2000, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 67);
      paintDirtRoad(g, m.w, 770, 830, 3);
      // lối đá lát vòng quanh hồ câu
      g.save();
      g.beginPath(); g.ellipse(1000, 560, 420, 205, 0, 0, Math.PI * 2); g.clip();
      ART.stonePath(g, 560, 340, 880, 440);
      g.restore();
      g.strokeStyle = '#8f887a'; g.lineWidth = 4;
      g.beginPath(); g.ellipse(1000, 560, 420, 205, 0, 0, Math.PI * 2); g.stroke();
      paintStreet(g, m.w, 870, 1000);
    });
    m.lake = { x: 1000, y: 560, rx: 330, ry: 140 };

    obj(m, 410, (ctx, t) => ART.lake(ctx, 1000, 560, 330, 140, t));
    col(m, 690, 440, 620, 230);
    col(m, 740, 420, 520, 20);
    sobj(m, 1180, 745, (c) => ART.dock(c, 1180, 745));
    inter(m, { x: 1135, y: 640, w: 90, h: 135, ax: 1180, ay: 690, name: 'Bến câu cá (bấm để thả câu)', use: () => AV.startFishing() });
    m.labels.push({ text: '🎣 Hồ Câu Cá', x: 1000, y: 385 });

    aobj(m, 380, 760, (c, t) => ART.swing(c, 380, 760, t), { l: -70, t: -125, w: 140, h: 135 });
    col(m, 318, 748, 124, 14);
    [[300, 460, 'fruit'], [1700, 460, 'pink'], [220, 640, 'green'], [1780, 660, 'fruit'], [560, 420, 'pink'], [1440, 420, 'green']].forEach(([x, y, v]) => addTree(m, x, y, v));
    addBench(m, 620, 740); addBench(m, 1380, 740); addBench(m, 1640, 740);
    [[150, 560], [1850, 560], [500, 640], [1500, 640]].forEach(([x, y], i) => addBush(m, x, y, FLOWERS[i % 4]));

    npc(m, 'Ông Tư', { skin: '#e3a979', hair: 'bald', hairColor: '#adb5bd', shirt: '#868e96', shirtStyle: 'plain', pants: '#8b5a2b', hat: 'nonla' }, { l: 200, t: 700, r: 1800, b: 840 }, 1300, 800, 'dog');

    street(m);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  /* ---------- Bãi biển ---------- */
  function beach() {
    const m = base('beach', 'Bãi biển', 2000, 1070);
    m.hz = 190;
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 79);
      const sea = g.createLinearGradient(0, 190, 0, 480);
      sea.addColorStop(0, '#1864ab'); sea.addColorStop(1, '#4dabf7');
      g.fillStyle = sea; g.fillRect(0, 0, m.w, 480);
      g.fillStyle = '#f3d9a4'; g.fillRect(0, 470, m.w, 380);
      const r = ART.srand(5);
      for (let i = 0; i < 900; i++) {
        g.fillStyle = r() > 0.5 ? 'rgba(200,160,90,.25)' : 'rgba(255,250,230,.5)';
        g.fillRect(r() * m.w, 480 + r() * 370, 2, 2);
      }
      paintStreet(g, m.w, 870, 1000);
    });
    obj(m, 0, (ctx, t) => ART.seaWaves(ctx, m.w, 478, t));
    [[220, 640], [1780, 600], [1500, 820], [520, 820]].forEach(([x, y]) => {
      sobj(m, x, y, (c) => ART.palm(c, x, y, 0));
      col(m, x - 10, y - 8, 30, 10);
    });
    [[650, 650, '#fa5252'], [1000, 610, '#4dabf7'], [1340, 690, '#fcc419']].forEach(([x, y, c]) => {
      sobj(m, x, y, (cx) => ART.umbrella(cx, x, y, c));
      col(m, x - 30, y - 12, 54, 14);
    });
    sobj(m, 300, 820, (c) => ART.signBoard(c, 300, 820, 'BÃI BIỂN\nNhặt vỏ sò 🐚\nbán ở Chợ'));
    col(m, 262, 810, 80, 12);
    m.labels.push({ text: '🏖️ Bãi Biển', x: 1000, y: 520 });
    m.pickupArea = { l: 150, t: 540, r: 1850, b: 830 };
    m.pickupTable = DATA.SHELLS;
    /* 🏴‍☠️ săn rương Halloween: hố đã đào + quầy thuyền trưởng */
    obj(m, 470, (c) => TREASURE.drawSpots(c), [0, 470, m.w, 850]);
    sobj(m, 1640, 600, (c) => TREASURE.booth(c, 1640, 600), { l: -95, t: -160, w: 190, h: 170 });
    col(m, 1560, 560, 160, 40);
    inter(m, { x: 1560, y: 470, w: 160, h: 130, ax: 1640, ay: 630, name: 'Thuyền trưởng Râu Đỏ (mua xẻng, máy dò · đổi ngọc)', use: () => TREASURE.panel(), arrow: { x: 1640, y: 440, text: 'Săn rương' } });
    npc(m, 'Thuyền trưởng Râu Đỏ', { skin: '#e0a370', hair: 'short', hairColor: '#c92a2a', shirt: '#212529', shirtStyle: 'stripes', pants: '#7a4a26', hat: 'cap' }, { l: 1700, t: 640, r: 1760, b: 680 }, 1730, 660, 'none');
    m.npcs[m.npcs.length - 1].pirate = true;

    npc(m, 'Cô Hoa', { skin: '#b97a51', hair: 'long', hairColor: '#f4d06f', shirt: '#15aabf', shirtStyle: 'stripes', pants: '#fd7e14', hat: 'flower' }, { l: 200, t: 560, r: 1800, b: 830 }, 1200, 760, 'cat');

    addBusStop(m, 1000, 862);
    edges(m, false);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 520, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  /* ---------- Trường học: đố vui tiếng Anh ---------- */
  function school() {
    const m = base('school', 'Trường học', 2000, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 91);
      paintPaved(g, 120, 370, 1760, 455, '#efe6d4');
      paintStreet(g, m.w, 870, 1000);
    });
    addTree(m, 70, 470, 'green'); addTree(m, 1930, 470, 'pink');

    const bld = { w: 260, wall: '#fff4e0', roof: '#e8590c', awning: '#f59f00', sign: '🏫 TRƯỜNG HỌC', icons: ['📚', '✏️'], door: '#8a4b22' };
    sobj(m, 420, 540, (c) => ART.building(c, 420, 540, bld));
    col(m, 290, 460, 260, 82);
    aobj(m, 690, 560, (c, t) => ART.flagPole(c, 690, 560, t), { l: -20, t: -200, w: 110, h: 206 });
    col(m, 684, 552, 12, 10);

    inter(m, { x: 290, y: 380, w: 260, h: 160, ax: 420, ay: 578, name: 'Vào lớp học (đố vui tiếng Anh)', use: () => AV.enterClass(), arrow: { x: 420, y: 470, text: 'Vào lớp' } });
    sobj(m, 1150, 600, (c) => ART.signBoard(c, 1150, 600, 'ĐỐ VUI\nTIẾNG ANH\nVào lớp 🏫'));
    col(m, 1112, 590, 80, 12);
    sobj(m, 1430, 645, (c) => ART.podium(c, 1430, 645), { l: -80, t: -30, w: 160, h: 36 });
    [[220, 790], [1780, 790], [1700, 420]].forEach(([x, y], i) => addBush(m, x, y, FLOWERS[i % 4]));
    m.labels.push({ text: '🏫 Trường Học', x: 1000, y: 318 });

    npc(m, 'Bé Tí', { skin: '#ffe0c4', hair: 'short', hairColor: '#6b3e26', shirt: '#4c6ef5', shirtStyle: 'plain', pants: '#343a40', hat: 'cap' }, { l: 200, t: 640, r: 850, b: 830 }, 400, 720);
    npc(m, 'Bé Mơ', { skin: '#f8c9a2', hair: 'pigtails', hairColor: '#2b2b33', shirt: '#e64980', shirtStyle: 'heart', pants: '#dee2e6', hat: 'bow' }, { l: 200, t: 640, r: 850, b: 830 }, 700, 780);

    street(m);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  /* ---------- Bên trong nhà: phòng khách, bếp, phòng ngủ, sảnh, phòng tắm, kho ---------- */
  function home() {
    const m = base('home', 'Nhà của bạn', 1900, 1000);
    m.indoor = true;
    m.private = true;
    m.hz = 0;
    const R = {
      living: [40, 240, 760, 340, '#c98a4b', 'plank'], kitchen: [800, 240, 760, 340, '#eef0f2', 'check'],
      bed: [40, 580, 520, 380, '#f3c4d6', 'carpet'], hall: [560, 580, 480, 380, '#d8cfc0', 'stone'],
      bath: [1040, 580, 260, 380, '#a5d8ff', 'tile'], store: [1300, 580, 260, 380, '#8a5a32', 'plank'],
    };
    ground(m, (g) => {
      g.fillStyle = '#3d2410'; g.fillRect(0, 0, m.w, m.h);
      // tường trên có giấy dán tường + cửa sổ
      g.fillStyle = '#f7e9cf'; g.fillRect(40, 20, 1520, 220);
      g.fillStyle = 'rgba(232,180,106,.35)';
      for (let x = 50; x < 1560; x += 40) for (let y = 30; y < 230; y += 40) { g.beginPath(); g.arc(x + ((y / 40) % 2) * 20, y, 4, 0, 7); g.fill(); }
      g.fillStyle = '#9c5b2e'; g.fillRect(40, 226, 1520, 14);
      [[200, 60], [560, 60], [1040, 60], [1360, 60]].forEach(([x, y]) => {
        g.fillStyle = '#7a4520'; g.fillRect(x - 6, y - 6, 132, 112);
        const sk = g.createLinearGradient(0, y, 0, y + 100); sk.addColorStop(0, '#74c0fc'); sk.addColorStop(1, '#d0ebff');
        g.fillStyle = sk; g.fillRect(x, y, 120, 100);
        g.fillStyle = '#fff'; g.fillRect(x + 58, y, 4, 100); g.fillRect(x, y + 48, 120, 4);
        g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x + 30, y + 24, 10, 0, 7); g.arc(x + 44, y + 20, 13, 0, 7); g.fill();
        g.fillStyle = '#e64980'; g.fillRect(x - 14, y - 10, 16, 124); g.fillRect(x + 118, y - 10, 16, 124);
      });
      // sàn từng phòng
      Object.values(R).forEach(([x, y, w, h, c, kind]) => {
        g.fillStyle = c; g.fillRect(x, y, w, h);
        g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2;
        if (kind === 'plank') for (let yy = y + 22; yy < y + h; yy += 22) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); for (let xx = x + ((yy / 22) % 2) * 60; xx < x + w; xx += 120) { g.beginPath(); g.moveTo(xx, yy - 22); g.lineTo(xx, yy); g.stroke(); } }
        if (kind === 'check') for (let yy = y; yy < y + h; yy += 40) for (let xx = x; xx < x + w; xx += 40) { if (((xx - x) / 40 + (yy - y) / 40) % 2) { g.fillStyle = '#ced4da'; g.fillRect(xx, yy, 40, 40); } }
        if (kind === 'tile') for (let yy = y; yy < y + h; yy += 30) for (let xx = x; xx < x + w; xx += 30) g.strokeRect(xx, yy, 30, 30);
        if (kind === 'stone') for (let yy = y; yy < y + h; yy += 36) for (let xx = x + ((yy - y) / 36 % 2) * 24; xx < x + w; xx += 48) { g.strokeRect(xx, yy, 48, 36); }
        if (kind === 'carpet') { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 6; g.strokeRect(x + 24, y + 30, w - 48, h - 60); }
      });
      // thảm phòng khách + thảm cửa
      g.fillStyle = '#e8590c'; g.beginPath(); g.ellipse(420, 430, 190, 70, 0, 0, 7); g.fill();
      g.fillStyle = '#ffa94d'; g.beginPath(); g.ellipse(420, 430, 160, 54, 0, 0, 7); g.fill();
      g.fillStyle = '#a61e4d'; g.fillRect(740, 900, 120, 46);
      g.fillStyle = '#3d2410'; g.fillRect(0, 960, m.w, 40); g.fillRect(0, 0, 40, m.h); g.fillRect(1560, 0, 40, m.h);
      paintStairRoom(g);
    });
    stairRoom(m, true);

    // tường ngăn phòng (có cửa thông)
    const wallH = (x1, x2, y) => { sobj(m, x1, y, (c) => ART.innerWallH(c, x1, x2, y), { l: -10, t: -70, w: x2 - x1 + 20, h: 74 }); col(m, x1, y - 14, x2 - x1, 16); };
    const wallV = (x, y1, y2) => { sobj(m, x, y2, (c) => ART.innerWallV(c, x, y1, y2), { l: -16, t: y1 - y2 - 70, w: 32, h: y2 - y1 + 74 }); col(m, x - 10, y1, 20, y2 - y1); };
    [[40, 260], [340, 640], [720, 880], [960, 1380], [1460, 1560]].forEach(([a, b]) => wallH(a, b, 580));
    wallV(800, 240, 380); wallV(800, 460, 580);
    [560, 1040, 1300].forEach((x) => { wallV(x, 580, 730); wallV(x, 810, 960); });

    const lab = (t, x, y) => m.labels.push({ text: t, x, y });
    lab('🛋️ Phòng khách', 420, 262); lab('🍳 Nhà bếp', 1180, 262); lab('🛏️ Phòng ngủ', 300, 602);
    lab('🚪 Sảnh', 800, 602); lab('🛁 Phòng tắm', 1170, 602); lab('📦 Kho đồ', 1430, 602);
    const furn = (x, y, draw, box, cw, ch, it) => mv(m, `${Math.round(x)}_${Math.round(y)}`, () => {
      sobj(m, x, y, draw, box);
      if (cw) col(m, x - cw / 2, y - ch, cw, ch);
      if (it) inter(m, { ax: x, ay: y + 26, ...it });
    });

    // Phòng khách
    furn(420, 300, (c) => ART.tvSet(c, 420, 300, 0), { l: -110, t: -145, w: 220, h: 152 }, 190, 30,
      { x: 330, y: 160, w: 180, h: 145, name: 'TV (xem TV thư giãn)', use: () => AV.watchTV(), ay: 340 });
    furn(420, 425, (c) => ART.coffeeTable(c, 420, 425), { l: -70, t: -55, w: 140, h: 62 }, 110, 26);
    furn(420, 520, (c) => ART.sofa(c, 420, 520, '#4c6ef5'), { l: -125, t: -85, w: 250, h: 92 }, 230, 36,
      { x: 300, y: 440, w: 240, h: 85, name: 'Sofa (ngồi xem TV)', use: () => AV.watchTV(), ax: 575, ay: 500 });
    furn(110, 330, (c) => ART.bookshelf(c, 110, 330), { l: -56, t: -160, w: 112, h: 166 }, 96, 24,
      { x: 55, y: 170, w: 112, h: 165, name: 'Giá sách (xem catalog đồ nội thất)', use: () => UI.furnitureShop(), ay: 360, arrow: { x: 110, y: 160, text: 'Mua nội thất' } });
    furn(740, 320, (c) => ART.plantPot(c, 740, 320), { l: -30, t: -95, w: 60, h: 100 }, 34, 14);

    // Nhà bếp
    furn(1100, 330, (c) => ART.kitchenCounter(c, 880, 330, 420), { l: -230, t: -160, w: 460, h: 166 }, 430, 30,
      { x: 880, y: 170, w: 420, h: 165, name: 'Bếp nấu (nấu món ăn)', use: () => UI.kitchen(), ay: 360 });
    furn(1460, 340, (c) => ART.fridge(c, 1460, 340), { l: -46, t: -170, w: 92, h: 176 }, 74, 30,
      { x: 1420, y: 175, w: 80, h: 165, name: 'Tủ lạnh (xem đồ ăn)', use: () => UI.inventory(), ay: 370 });
    // bàn ăn tách 2 lớp: ghế sau → người ngồi → mặt bàn + ghế trước
    mv(m, '1180_520', () => {
      sobj(m, 1180, 520, (c) => ART.diningPart(c, 1180, 520, 'back'), { l: -100, t: -80, w: 200, h: 40 }, 470);
      sobj(m, 1180, 520, (c) => ART.diningPart(c, 1180, 520, 'front'), { l: -110, t: -60, w: 220, h: 92 });
      col(m, 1085, 470, 190, 50);
      inter(m, { x: 1080, y: 440, w: 200, h: 110, ax: 1180, ay: 565, name: 'Bàn ăn (ngồi ăn cơm)', use: () => AV.sitTable() });
    });

    // Phòng ngủ
    furn(200, 900, (c) => ART.bedFurn(c, 200, 900), { l: -95, t: -200, w: 190, h: 210 }, 160, 170,
      { x: 120, y: 710, w: 160, h: 190, name: 'Giường (ngủ một giấc)', use: () => AV.sleep(), ax: 320, ay: 860 });
    furn(470, 720, (c) => ART.wardrobe(c, 470, 720), { l: -60, t: -180, w: 120, h: 186 }, 108, 30,
      { x: 415, y: 550, w: 110, h: 170, name: 'Tủ quần áo (thay đồ)', use: () => UI.characterEditor(false), ay: 750 });
    furn(330, 690, (c) => ART.nightstand(c, 330, 690), { l: -30, t: -92, w: 60, h: 96 }, 48, 20);

    // Phòng tắm
    furn(1170, 720, (c) => ART.bathtub(c, 1170, 720), { l: -95, t: -105, w: 190, h: 112 }, 168, 40,
      { x: 1085, y: 640, w: 170, h: 80, name: 'Bồn tắm (tắm rửa)', use: () => AV.bathe(), ay: 760 });
    furn(1100, 900, (c) => ART.sinkMirror(c, 1100, 900), { l: -40, t: -135, w: 80, h: 140 }, 60, 26);

    // Kho đồ
    furn(1430, 700, (c) => ART.storageShelf(c, 1430, 700), { l: -80, t: -160, w: 160, h: 166 }, 140, 26);
    furn(1430, 880, (c) => ART.chest(c, 1430, 880), { l: -56, t: -90, w: 112, h: 96 }, 92, 36,
      { x: 1380, y: 800, w: 100, h: 82, name: 'Rương cất đồ', use: () => UI.storage(), ay: 915, ax: 1360 });

    /* ----- Đồ nội thất mua thêm (chỉ hiện khi đã mua) ----- */
    const own = (id, x, y, draw, box, cw, ch, it, opt = {}) => mv(m, 'own_' + id, () => {
      const has = () => AV.hasFurn(id);
      const bb = [x + box.l, y + box.t, x + box.l + box.w, y + box.t + box.h];
      if (opt.anim) { const key = {}; m.objects.push({ y: opt.sortY ?? y, bb, draw: (ctx, t) => { if (has()) FX.drawCached(ctx, key, (c) => draw(c, t), x, y, box, 90); } }); }
      else if (opt.flat) m.objects.push({ y: opt.sortY ?? y, bb, draw: (ctx) => { if (has()) draw(ctx); } });
      else { const spr = FX.sprite(draw, x, y, box); m.objects.push({ y: opt.sortY ?? y, bb, draw: (ctx) => { if (has()) spr(ctx); } }); }
      if (cw) m.colliders.push({ x: x - cw / 2, y: y - ch, w: cw, h: ch, when: has });
      if (it) inter(m, { ax: x, ay: y + 30, ...it, when: has });
      if (!it && !cw) m.colliders.push({ x: x - 1, y: y - 1, w: 0, h: 0, when: has });
    });
    own('painting', 420, 120, (c) => ART.painting(c, 420, 120), { l: -66, t: -50, w: 132, h: 88 }, 0, 0, null, { sortY: 150 });
    own('piano', 670, 560, (c) => ART.piano(c, 670, 560), { l: -80, t: -126, w: 160, h: 132 }, 150, 40,
      { x: 595, y: 440, w: 150, h: 120, name: 'Đàn piano (chơi đàn)', use: () => AV.playPiano(), ay: 590 });
    own('aquarium', 170, 560, (c, t) => ART.aquarium(c, 170, 560, t), { l: -78, t: -130, w: 156, h: 136 }, 140, 40,
      { x: 95, y: 435, w: 150, h: 125, name: 'Bể cá cảnh (ngắm cá)', use: () => AV.watchFish(), ay: 590 }, { anim: true });
    own('console', 575, 330, (c) => ART.gameConsole(c, 575, 330), { l: -36, t: -68, w: 72, h: 74 }, 60, 20,
      { x: 540, y: 262, w: 72, h: 70, name: 'Máy chơi game', use: () => AV.playConsole(), ay: 365 });
    own('rug', 380, 830, (c) => ART.furRug(c, 380, 830), { l: -100, t: -50, w: 200, h: 100 }, 0, 0, null, { sortY: 600, flat: true });
    own('teddy', 490, 925, (c) => ART.teddy(c, 490, 925), { l: -52, t: -136, w: 104, h: 142 }, 80, 30,
      { x: 440, y: 790, w: 100, h: 135, name: 'Gấu bông (ôm gấu)', use: () => AV.hugTeddy(), ax: 410, ay: 940 });
    own('clock', 620, 760, (c, t) => ART.grandClock(c, 620, 760, t), { l: -36, t: -166, w: 72, h: 172 }, 52, 22,
      { x: 590, y: 600, w: 60, h: 160, name: 'Đồng hồ quả lắc (xem giờ)', use: () => AV.lookClock(), ay: 790 }, { anim: true });
    own('palm', 990, 740, (c) => ART.palmPot(c, 990, 740), { l: -50, t: -130, w: 100, h: 136 }, 40, 16);
    own('lamp', 990, 930, (c) => ART.floorLamp(c, 990, 930), { l: -40, t: -152, w: 80, h: 158 }, 30, 12);

    // Cửa ra ngoài
    sobj(m, 800, 962, (c) => ART.homeDoor(c, 800, 962), { l: -50, t: -22, w: 100, h: 28 });
    inter(m, { x: 740, y: 900, w: 120, h: 70, ax: 800, ay: 930, name: 'Ra ngoài nông trại', use: () => AV.leaveHome(), arrow: { x: 800, y: 905, text: 'Ra ngoài' } });

    m.spawn = { x: 800, y: 900 };
    m.bounds = { l: 56, t: 262, r: m.w - 56, b: 940 };
    return m;
  }

  /* ---------- 🏠 Nhà nhiều tầng: phòng cầu thang + thang máy (dùng chung mọi tầng) ---------- */
  function paintStairRoom(g) {
    g.fillStyle = '#efe6d8'; g.fillRect(1600, 20, 260, 220);
    g.fillStyle = 'rgba(160,130,90,.25)'; for (let x = 1610; x < 1860; x += 30) g.fillRect(x, 20, 3, 220);
    g.fillStyle = '#9c5b2e'; g.fillRect(1600, 226, 260, 14);
    g.fillStyle = '#e9ecef'; g.fillRect(1600, 240, 260, 720);
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2;
    for (let y = 240; y < 960; y += 60) for (let x = 1600; x < 1860; x += 60) g.strokeRect(x, y, 60, 60);
    g.fillStyle = '#3d2410'; g.fillRect(1860, 0, 40, 1000); g.fillRect(1600, 960, 300, 40);
    // cửa thông từ bếp + kho
    g.fillStyle = '#d8cfc0'; g.fillRect(1560, 380, 40, 100); g.fillRect(1560, 760, 40, 100);
  }
  function stairRoom(m, ground) {
    const lv = () => AV.houseLv();
    // tường ngăn có 2 cửa
    [[240, 380], [480, 760], [860, 960]].forEach(([a, b]) => m.colliders.push({ x: 1560, y: a, w: 40, h: b - a }));
    m.labels.push({ text: '🪜 Cầu thang · 🛗 Thang máy', x: 1730, y: 262 });
    // cầu thang
    sobj(m, 1730, 600, (c) => {
      for (let k = 0; k < 9; k++) {
        const y = 590 - k * 34, x = 1640 + k * 20;
        c.fillStyle = k % 2 ? '#b07a45' : '#c98a4b'; c.fillRect(x, y - 16, 170 - k * 8, 16);
        c.fillStyle = '#7a4a26'; c.fillRect(x, y, 170 - k * 8, 6);
      }
      c.strokeStyle = '#495057'; c.lineWidth = 5; c.beginPath(); c.moveTo(1636, 560); c.lineTo(1810, 300); c.stroke();
      for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(1640 + k * 26, 560 - k * 38); c.lineTo(1640 + k * 26, 600 - k * 38); c.stroke(); }
    }, { l: -110, t: -330, w: 240, h: 340 });
    m.colliders.push({ x: 1640, y: 300, w: 200, h: 290 });
    inter(m, { x: 1630, y: 290, w: 210, h: 310, ax: 1700, ay: 640, name: '🪜 Cầu thang', use: () => AV.useStairs(), arrow: { x: 1730, y: 290, text: 'Cầu thang' } });
    // thang máy (nhà phố 3 tầng trở lên)
    m.objects.push({ y: 905, bb: [1660, 720, 1800, 910], draw: (c) => {
      const on = lv() >= 3;
      c.fillStyle = '#868e96'; c.fillRect(1664, 740, 132, 166);
      if (!on) { c.fillStyle = '#495057'; c.fillRect(1672, 750, 116, 150); c.fillStyle = '#ffd43b'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🛗 Thang máy', 1730, 800); c.fillStyle = '#fff'; c.font = '700 11px "Be Vietnam Pro", system-ui'; c.fillText('Nâng cấp nhà phố', 1730, 826); c.fillText('3 tầng để lắp', 1730, 842); return; }
      const g2 = c.createLinearGradient(1672, 0, 1788, 0); g2.addColorStop(0, '#ced4da'); g2.addColorStop(0.5, '#f8f9fa'); g2.addColorStop(1, '#adb5bd');
      c.fillStyle = g2; c.fillRect(1672, 760, 56, 142); c.fillRect(1732, 760, 56, 142);
      c.fillStyle = '#212529'; c.fillRect(1700, 742, 60, 16);
      c.fillStyle = '#ff6b6b'; c.font = '900 12px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`▲ ${AV.floor() || 1}`, 1730, 750);
      c.fillStyle = '#343a40'; c.fillRect(1800, 810, 12, 30); c.fillStyle = '#69db7c'; c.beginPath(); c.arc(1806, 818, 3, 0, 7); c.fill(); c.beginPath(); c.arc(1806, 832, 3, 0, 7); c.fill();
    } });
    m.colliders.push({ x: 1664, y: 870, w: 132, h: 36 });
    inter(m, { x: 1664, y: 740, w: 132, h: 166, ax: 1730, ay: 935, name: '🛗 Thang máy', use: () => (lv() >= 3 ? UI.elevator() : UI.houseUpgrade()) });
    if (ground) {
      // nhà 1 tầng: phòng cầu thang khoá, bấm để xem nâng cấp
      [[380, 480], [760, 860]].forEach(([a, b]) => m.colliders.push({ x: 1556, y: a, w: 48, h: b - a, when: () => lv() < 2 }));
      m.objects.push({ y: 990, bb: [1556, 240, 1860, 960], draw: (c) => {
        if (lv() >= 2) return;
        c.fillStyle = 'rgba(30,20,10,.72)'; c.fillRect(1600, 240, 260, 720);
        c.fillStyle = '#fff'; c.font = '900 40px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🔒', 1730, 520);
        c.font = '900 16px "Be Vietnam Pro", system-ui'; c.fillText('Nâng cấp nhà', 1730, 570); c.fillText('để mở cầu thang', 1730, 592);
      } });
      inter(m, { x: 1540, y: 380, w: 70, h: 480, ax: 1520, ay: 620, name: '🏗️ Nâng cấp nhà (mở thêm tầng)', use: () => UI.houseUpgrade(), when: () => lv() < 2, arrow: { x: 1580, y: 360, text: 'Nâng cấp nhà' } });
    }
  }
  /** tầng trên: n = 2 (ngủ + làm việc), 3 (karaoke + rạp phim + gym), 4 (sân thượng hồ bơi) */
  /** tầng 5 → 49: 1 phòng theo chủ đề; tầng 50: penthouse sân thượng */
  function floorN(n) {
    if (n >= 50) return floorMap(4, 50);
    const th = DATA.floorTheme(n);
    const m = base('home' + n, `Nhà của bạn · Tầng ${n} · ${th.name}`, 1900, 1000);
    m.indoor = true; m.private = true; m.hz = 0;
    const WALL = { vip: '#f3e5d0', lib: '#e8dcc6', game: '#2b2140', guest: '#e7f5ff', art: '#f8f9fa', bar: '#2b1d14', music: '#f1e8ff', spa: '#e6fcf5', garden: '#ebfbee', aqua: '#d0ebff', ceo: '#e9ecef', cinema: '#1a1a24' }[th.id];
    const FLOOR = { vip: '#c9a27a', lib: '#a47148', game: '#343a46', guest: '#e9d3b5', art: '#dee2e6', bar: '#5c3a21', music: '#c9a27a', spa: '#c3fae8', garden: '#8ce99a', aqua: '#a5d8ff', ceo: '#adb5bd', cinema: '#5c1a1a' }[th.id];
    const high = Math.min(1, (n - 4) / 46);
    ground(m, (g) => {
      g.fillStyle = '#3d2410'; g.fillRect(0, 0, m.w, m.h);
      g.fillStyle = WALL; g.fillRect(40, 20, 1520, 220);
      // cửa kính lớn nhìn ra thành phố: càng lên cao nhà cửa càng nhỏ, mây ngang tầm mắt
      [[160, 50], [620, 50], [1080, 50]].forEach(([x, y]) => {
        g.fillStyle = '#495057'; g.fillRect(x - 6, y - 6, 332, 152);
        const sk = g.createLinearGradient(0, y, 0, y + 140); sk.addColorStop(0, '#4dabf7'); sk.addColorStop(1, '#e7f5ff');
        g.fillStyle = sk; g.fillRect(x, y, 320, 140);
        const hz = y + 140 - 70 * (1 - high) - 10;
        for (let i = 0; i < 18; i++) { const bh = (14 + ((i * 37 + n * 13) % 50)) * (1 - high * 0.75), bx = x + i * 18; g.fillStyle = i % 2 ? '#a5b4c8' : '#8fa3bb'; g.fillRect(bx, y + 140 - bh, 15, bh); }
        g.fillStyle = 'rgba(255,255,255,.85)';
        for (let k = 0; k < 3; k++) { const cx = x + 40 + ((k * 113 + n * 29) % 260), cy = y + 20 + high * 70 + k * 12; g.beginPath(); g.ellipse(cx, cy, 34, 10, 0, 0, 7); g.ellipse(cx + 22, cy - 6, 20, 9, 0, 0, 7); g.fill(); }
        g.fillStyle = '#fff'; g.fillRect(x + 158, y, 4, 140); g.fillRect(x, y + 68, 320, 3);
        void hz;
      });
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(40, 226, 1520, 14);
      g.fillStyle = FLOOR; g.fillRect(40, 240, 1520, 720);
      g.strokeStyle = 'rgba(0,0,0,.1)'; g.lineWidth = 2;
      if (th.id === 'garden') { g.fillStyle = 'rgba(47,158,68,.25)'; for (let i = 0; i < 260; i++) g.fillRect(50 + (i * 97) % 1500, 250 + (i * 53) % 700, 4, 8); }
      else if (th.id === 'aqua' || th.id === 'spa') for (let y = 240; y < 960; y += 50) for (let x = 40; x < 1560; x += 50) g.strokeRect(x, y, 50, 50);
      else for (let y = 262; y < 960; y += 24) { g.beginPath(); g.moveTo(40, y); g.lineTo(1560, y); g.stroke(); }
      g.fillStyle = '#3d2410'; g.fillRect(0, 960, m.w, 40); g.fillRect(0, 0, 40, m.h); g.fillRect(1560, 0, 40, m.h);
      g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '900 30px "Be Vietnam Pro", system-ui'; g.textAlign = 'right'; g.fillText(`${n}F`, 1540, 220);
      paintStairRoom(g);
    });
    stairRoom(m, false);
    const furn = (x, y, draw, box, cw, ch, it) => mv(m, `${Math.round(x)}_${Math.round(y)}`, () => { sobj(m, x, y, draw, box); if (cw) col(m, x - cw / 2, y - ch, cw, ch); if (it) inter(m, { ax: x, ay: y + 26, ...it }); });
    const act = (min, xp, msg, bubble) => () => AV.homeAct('lastF_' + th.id, min, xp, msg, bubble, 'Vừa dùng xong, nghỉ chút đã');
    const xp = 10 + Math.floor(n / 2);
    m.labels.push({ text: `${th.icon} Tầng ${n} · ${th.name}`, x: 800, y: 262 });
    const big = (fn, x, y, k) => (c) => { c.save(); c.translate(x, y); c.scale(k, k); c.translate(-x, -y); fn(c); c.restore(); };
    const plant = (x, y) => furn(x, y, (c) => ART.palmPot(c, x, y), { l: -50, t: -130, w: 100, h: 136 }, 40, 16);
    switch (th.id) {
      case 'vip':
        furn(800, 520, (c) => ART.tvSet(c, 800, 360, 0), { l: -110, t: -305, w: 220, h: 312 }, 0, 0);
        furn(800, 640, (c) => ART.sofa(c, 800, 640, '#c92a2a'), { l: -125, t: -85, w: 250, h: 92 }, 230, 36, { x: 680, y: 560, w: 240, h: 85, name: 'Sofa da VIP (xem TV)', use: act(30, xp, `🛋️ Thư giãn trên sofa VIP! +${xp} XP`, '📺 Phim hay ghê') });
        furn(420, 640, (c) => ART.sofa(c, 420, 640, '#7048e8'), { l: -125, t: -85, w: 250, h: 92 }, 230, 36);
        furn(1200, 640, (c) => ART.sofa(c, 1200, 640, '#7048e8'), { l: -125, t: -85, w: 250, h: 92 }, 230, 36);
        plant(160, 900); plant(1450, 900);
        break;
      case 'lib':
        [260, 520, 1080, 1340].forEach((x) => furn(x, 420, (c) => ART.bookshelf(c, x, 420), { l: -56, t: -160, w: 112, h: 166 }, 96, 24));
        furn(800, 700, big((c) => ART.desk(c, 800, 700), 800, 700, 2.4), { l: -90, t: -110, w: 180, h: 120 }, 160, 40, { x: 720, y: 600, w: 170, h: 110, name: 'Bàn đọc sách', use: act(45, xp, `📚 Đọc hết một cuốn sách hay! +${xp} XP`, '📖 Hay quá…'), ay: 740 });
        furn(1480, 900, (c) => ART.floorLamp(c, 1480, 900), { l: -40, t: -152, w: 80, h: 158 }, 30, 12);
        break;
      case 'game':
        [500, 800, 1100].forEach((x, i) => furn(x, 520, (c) => { c.fillStyle = ['#e64980', '#4dabf7', '#ffd43b'][i]; c.beginPath(); c.roundRect(x - 50, 380, 100, 140, 10); c.fill(); c.fillStyle = '#111'; c.fillRect(x - 38, 395, 76, 56); c.fillStyle = ['#69db7c', '#ff922b', '#da77f2'][i]; c.fillRect(x - 32, 402, 64, 42); c.fillStyle = '#212529'; c.fillRect(x - 40, 462, 80, 20); c.fillStyle = '#e03131'; c.beginPath(); c.arc(x - 18, 472, 6, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '900 12px system-ui'; c.textAlign = 'center'; c.fillText(['PAC', 'RACE', 'BOOM'][i], x, 500); }, { l: -55, t: -145, w: 110, h: 150 }, 100, 40, { x: x - 50, y: 380, w: 100, h: 140, name: 'Máy game thùng', use: act(30, xp, `🎮 Phá kỷ lục máy game! +${xp} XP`, '🎮 Combo!!'), ay: 560 }));
        furn(800, 820, (c) => ART.sofa(c, 800, 820, '#5f3dc4'), { l: -125, t: -85, w: 250, h: 92 }, 230, 36);
        break;
      case 'guest':
        [400, 1100].forEach((x) => furn(x, 620, big((c) => ART.bedFurn(c, x, 620), x, 620, 1.2), { l: -115, t: -250, w: 230, h: 262 }, 190, 200, { x: x - 110, y: 380, w: 220, h: 240, name: 'Giường phòng khách (ngủ trưa)', use: act(90, xp, `😴 Ngủ trưa phòng khách! +${xp} XP`, '😴 Zzz…'), ax: x + 150, ay: 600 }));
        furn(750, 420, (c) => ART.wardrobe(c, 750, 420), { l: -60, t: -180, w: 120, h: 186 }, 108, 30, { x: 695, y: 250, w: 110, h: 170, name: 'Tủ quần áo (thay đồ)', use: () => UI.characterEditor(false), ay: 450 });
        break;
      case 'art':
        [[300, 120], [620, 120], [980, 120], [1300, 120]].forEach(([x, y]) => obj(m, 150, (c) => ART.painting(c, x, y), [x - 66, y - 50, x + 66, y + 38]));
        [500, 1100].forEach((x) => furn(x, 600, (c) => { c.fillStyle = '#f8f9fa'; c.fillRect(x - 30, 520, 60, 80); c.fillStyle = '#ced4da'; c.fillRect(x - 34, 515, 68, 8); c.fillStyle = '#adb5bd'; c.beginPath(); c.ellipse(x, 470, 22, 40, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x, 420, 16, 0, 7); c.fill(); }, { l: -40, t: -200, w: 80, h: 205 }, 60, 30, { x: x - 40, y: 400, w: 80, h: 200, name: 'Tượng điêu khắc (ngắm nghệ thuật)', use: act(30, xp, `🖼️ Ngắm tranh cảm thấy tâm hồn bay bổng! +${xp} XP`, '🎨 Nghệ thuật quá'), ay: 640 }));
        furn(800, 800, (c) => ART.sofa(c, 800, 800, '#212529'), { l: -125, t: -85, w: 250, h: 92 }, 230, 36);
        break;
      case 'bar':
        furn(800, 520, (c) => { c.fillStyle = '#6b3a1f'; c.beginPath(); c.roundRect(480, 440, 640, 80, 12); c.fill(); c.fillStyle = '#8a5a32'; c.fillRect(480, 432, 640, 14); c.fillStyle = '#3d2410'; c.fillRect(480, 290, 640, 120); for (let k = 0; k < 18; k++) { c.fillStyle = ['#2f9e44', '#c92a2a', '#f59f00', '#1c7ed6'][k % 4]; c.fillRect(500 + k * 34, 310 + (k % 2) * 46, 12, 34); } ['🍷', '🍸', '🍹', '🍺'].forEach((e, i) => { c.font = '26px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center'; c.fillText(e, 560 + i * 160, 430); }); }, { l: -330, t: -240, w: 660, h: 245 }, 640, 80, { x: 480, y: 420, w: 640, h: 100, name: 'Quầy bar riêng', use: act(30, xp, `🍸 Pha một ly cocktail tự làm! +${xp} XP`, '🍹 Cạn ly!'), ay: 560 });
        [560, 720, 880, 1040].forEach((x) => furn(x, 600, (c) => { c.fillStyle = '#212529'; c.fillRect(x - 3, 560, 6, 40); c.fillStyle = '#c92a2a'; c.beginPath(); c.ellipse(x, 558, 20, 8, 0, 0, 7); c.fill(); }, { l: -24, t: -50, w: 48, h: 54 }, 0, 0));
        break;
      case 'music':
        furn(600, 560, big((c) => ART.piano(c, 600, 560), 600, 560, 1.4), { l: -115, t: -180, w: 230, h: 188 }, 200, 50, { x: 490, y: 400, w: 220, h: 160, name: 'Đàn piano (chơi nhạc)', use: act(30, xp, `🎹 Chơi trọn bài "Để Mị nói cho mà nghe"! +${xp} XP`, '🎶 Tinh tinh tang~'), ay: 600 });
        furn(1100, 560, (c) => { c.fillStyle = '#c47f2c'; c.beginPath(); c.ellipse(1100, 520, 34, 46, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(1100, 460, 24, 28, 0, 0, 7); c.fill(); c.fillStyle = '#3d2410'; c.beginPath(); c.arc(1100, 505, 10, 0, 7); c.fill(); c.fillRect(1096, 360, 8, 110); }, { l: -40, t: -210, w: 80, h: 215 }, 50, 30, { x: 1060, y: 360, w: 80, h: 200, name: 'Đàn guitar', use: act(30, xp, `🎸 Đàn hát một bài thật cảm xúc! +${xp} XP`, '🎸 La la la~'), ay: 600 });
        plant(200, 900); plant(1450, 900);
        break;
      case 'spa':
        furn(600, 560, (c) => { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(600, 520, 200, 70, 0, 0, 7); c.fill(); c.fillStyle = '#63e6be'; c.beginPath(); c.ellipse(600, 515, 180, 56, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 8; k++) { c.beginPath(); c.arc(480 + k * 34, 500 + (k % 3) * 10, 6, 0, 7); c.fill(); } }, { l: -205, t: -120, w: 410, h: 125 }, 400, 110, { x: 400, y: 450, w: 400, h: 140, name: 'Bồn sục jacuzzi', use: act(45, xp, `🧖 Ngâm bồn sục thư giãn! +${xp} XP`, '😌 Đã quá'), ay: 620 });
        furn(1200, 560, (c) => { c.fillStyle = '#b07a45'; c.fillRect(1080, 380, 240, 180); c.fillStyle = '#8a5a32'; for (let k = 0; k < 6; k++) c.fillRect(1080, 390 + k * 30, 240, 6); c.fillStyle = 'rgba(255,255,255,.5)'; c.font = '900 18px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.fillText('SAUNA', 1200, 480); }, { l: -125, t: -185, w: 250, h: 190 }, 240, 60, { x: 1080, y: 380, w: 240, h: 180, name: 'Phòng xông hơi', use: act(45, xp, `🔥 Xông hơi khoẻ người! +${xp} XP`, '🥵 Nóng quá'), ay: 600 });
        plant(160, 900); plant(1450, 900);
        break;
      case 'garden':
        [[200, 420], [420, 600], [700, 420], [980, 620], [1250, 420], [1450, 640], [300, 860], [1100, 880]].forEach(([x, y]) => plant(x, y));
        furn(800, 760, (c) => ART.bench ? ART.bench(c, 800, 760) : null, { l: -80, t: -60, w: 160, h: 66 }, 140, 20, { x: 720, y: 700, w: 160, h: 60, name: 'Ghế vườn treo (ngắm cây)', use: act(30, xp, `🌿 Hít thở không khí trong lành! +${xp} XP`, '🌿 Mát quá'), ay: 800 });
        break;
      case 'aqua':
        m.objects.push({ y: 560, bb: [300, 300, 1300, 570], draw: (c, t) => {
          c.fillStyle = '#343a40'; c.fillRect(300, 300, 1000, 260);
          const w = c.createLinearGradient(0, 310, 0, 550); w.addColorStop(0, '#74c0fc'); w.addColorStop(1, '#1864ab'); c.fillStyle = w; c.fillRect(312, 312, 976, 236);
          c.fillStyle = '#2f9e44'; for (let k = 0; k < 14; k++) { c.beginPath(); c.moveTo(330 + k * 70, 548); c.quadraticCurveTo(320 + k * 70 + Math.sin(t * 2 + k) * 10, 470, 340 + k * 70, 420 + (k % 3) * 20); c.lineTo(346 + k * 70, 548); c.fill(); }
          c.font = '30px system-ui, "Segoe UI Emoji"'; c.textAlign = 'center';
          ['🐠', '🐟', '🐡', '🦈', '🐢', '🐙'].forEach((f, k) => { const x = 330 + ((t * (30 + k * 9) + k * 170) % 950); c.fillText(f, x, 360 + k * 30); });
          c.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 10; k++) { c.beginPath(); c.arc(400 + k * 90, 540 - ((t * 60 + k * 37) % 220), 4, 0, 7); c.fill(); }
        } });
        m.colliders.push({ x: 300, y: 300, w: 1000, h: 260 });
        inter(m, { x: 300, y: 300, w: 1000, h: 260, ax: 800, ay: 600, name: 'Bể cá cảnh khổng lồ', use: act(30, xp, `🐠 Ngắm cá bơi thật thư thái! +${xp} XP`, '🐟 Cá đẹp quá') });
        furn(800, 820, (c) => ART.sofa(c, 800, 820, '#1c7ed6'), { l: -125, t: -85, w: 250, h: 92 }, 230, 36);
        break;
      case 'ceo':
        furn(800, 520, big((c) => ART.desk(c, 800, 520), 800, 520, 3), { l: -110, t: -130, w: 220, h: 140 }, 200, 50, { x: 700, y: 400, w: 200, h: 120, name: 'Bàn CEO (họp online)', use: act(60, xp + 5, `💼 Chốt hợp đồng triệu đô! +${xp + 5} XP`, '📈 Deal!'), ay: 570 });
        [300, 1300].forEach((x) => furn(x, 420, (c) => ART.bookshelf(c, x, 420), { l: -56, t: -160, w: 112, h: 166 }, 96, 24));
        furn(800, 840, (c) => ART.sofa(c, 800, 840, '#343a40'), { l: -125, t: -85, w: 250, h: 92 }, 230, 36);
        break;
      default: // cinema
        m.screen = { video: 'iRjt1n3mkN4', x: 600, y: 40, w: 400, h: 190, tap: '▶ Bấm để xem phim' };
        obj(m, 0, (c) => { c.fillStyle = '#000'; c.fillRect(594, 34, 412, 202); }, [590, 30, 1010, 240]);
        [520, 660, 800].forEach((y) => { sobj(m, 800, y, (c) => CONCERT.seats(c, 640, 960, y), { l: -170, t: -60, w: 340, h: 66 }, y - 40); col(m, 640, y - 52, 320, 24); inter(m, { x: 640, y: y - 62, w: 320, h: 62, ax: 800, ay: y + 20, name: 'Ghế rạp riêng (xem phim)', use: act(60, xp, `🎬 Xem trọn bộ phim bom tấn! +${xp} XP`, '🍿 Hay quá!') }); });
        break;
    }
    m.spawn = { x: 1700, y: 640 };
    m.bounds = { l: 56, t: 262, r: m.w - 56, b: 940 };
    return m;
  }
  function floorMap(n, realN) {
    const names = { 2: 'Tầng 2 · Phòng ngủ & làm việc', 3: 'Tầng 3 · Giải trí', 4: realN ? `Tầng ${realN} · Penthouse sân thượng` : 'Sân thượng · Hồ bơi' };
    const m = base('home' + (realN || n), 'Nhà của bạn · ' + names[n], 1900, 1000);
    m.indoor = true; m.private = true; m.hz = 0;
    const floorCol = { 2: ['#e9d3b5', 'plank'], 3: ['#2b2f3a', 'dark'], 4: ['#c69c6d', 'deck'] }[n];
    ground(m, (g) => {
      g.fillStyle = '#3d2410'; g.fillRect(0, 0, m.w, m.h);
      if (n === 4) {
        const sk = g.createLinearGradient(0, 20, 0, 240); sk.addColorStop(0, '#4dabf7'); sk.addColorStop(1, '#d0ebff');
        g.fillStyle = sk; g.fillRect(40, 20, 1520, 220);
        for (let i = 0; i < 22; i++) { const bh = 50 + (i * 37) % 110, bx = 50 + i * 70; g.fillStyle = i % 2 ? '#a5b4c8' : '#8fa3bb'; g.fillRect(bx, 240 - bh, 58, bh); g.fillStyle = 'rgba(255,255,255,.4)'; for (let wy = 240 - bh + 8; wy < 232; wy += 14) g.fillRect(bx + 8, wy, 40, 5); }
        g.fillStyle = '#dee2e6'; g.fillRect(40, 226, 1520, 14);
      } else {
        g.fillStyle = n === 3 ? '#3b2a4a' : '#f3e5d0'; g.fillRect(40, 20, 1520, 220);
        if (n === 3) { for (let i = 0; i < 40; i++) { g.fillStyle = ['#f783ac', '#74c0fc', '#ffd43b', '#b197fc'][i % 4]; g.beginPath(); g.arc(60 + i * 38, 40 + (i * 53) % 170, 3, 0, 7); g.fill(); } }
        else { g.fillStyle = 'rgba(200,160,110,.25)'; for (let x = 50; x < 1560; x += 46) g.fillRect(x, 20, 20, 220); }
        g.fillStyle = '#9c5b2e'; g.fillRect(40, 226, 1520, 14);
        [[260, 60], [1080, 60]].forEach(([x, y]) => { g.fillStyle = '#7a4520'; g.fillRect(x - 6, y - 6, 172, 112); const sk = g.createLinearGradient(0, y, 0, y + 100); sk.addColorStop(0, n === 3 ? '#1b2f48' : '#74c0fc'); sk.addColorStop(1, n === 3 ? '#3b5bdb' : '#d0ebff'); g.fillStyle = sk; g.fillRect(x, y, 160, 100); g.fillStyle = '#fff'; g.fillRect(x + 78, y, 4, 100); });
      }
      g.fillStyle = floorCol[0]; g.fillRect(40, 240, 1520, 720);
      g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 2;
      if (floorCol[1] === 'plank' || floorCol[1] === 'deck') for (let y = 262; y < 960; y += 22) { g.beginPath(); g.moveTo(40, y); g.lineTo(1560, y); g.stroke(); }
      if (floorCol[1] === 'dark') for (let y = 240; y < 960; y += 60) for (let x = 40; x < 1560; x += 60) { if (((x + y) / 60) % 2) { g.fillStyle = '#343a46'; g.fillRect(x, y, 60, 60); } }
      g.fillStyle = '#3d2410'; g.fillRect(0, 960, m.w, 40); g.fillRect(0, 0, 40, m.h); g.fillRect(1560, 0, 40, m.h);
      paintStairRoom(g);
    });
    stairRoom(m, false);
    const furn = (x, y, draw, box, cw, ch, it) => mv(m, `${Math.round(x)}_${Math.round(y)}`, () => { sobj(m, x, y, draw, box); if (cw) col(m, x - cw / 2, y - ch, cw, ch); if (it) inter(m, { ax: x, ay: y + 26, ...it }); });
    const lab = (t, x, y) => m.labels.push({ text: t, x, y });
    const act = (key, min, xp, msg, bubble, wait) => () => AV.homeAct(key, min, xp, msg, bubble, wait);
    if (n === 2) {
      lab('🛏️ Phòng ngủ master', 420, 262); lab('💼 Phòng làm việc', 1180, 262);
      sobj(m, 800, 960, (c) => ART.innerWallV(c, 800, 240, 520), { l: -16, t: -790, w: 32, h: 794 }); col(m, 790, 240, 20, 280);
      sobj(m, 800, 960, (c) => ART.innerWallV(c, 800, 680, 960), { l: -16, t: -350, w: 32, h: 354 }); col(m, 790, 680, 20, 280);
      g2Rug(m, 400, 640);
      furn(300, 620, (c) => { c.save(); c.translate(300, 620); c.scale(1.35, 1.35); c.translate(-300, -620); ART.bedFurn(c, 300, 620); c.restore(); }, { l: -135, t: -280, w: 270, h: 290 }, 220, 230,
        { x: 180, y: 360, w: 240, h: 260, name: 'Giường master (ngủ)', use: act('lastSleep2', 120, 30, '😴 Ngủ trên giường master êm ái! +30 XP', '😴 Zzz…', 'Bạn chưa buồn ngủ'), ax: 470, ay: 600 });
      furn(640, 420, (c) => ART.wardrobe(c, 640, 420), { l: -60, t: -180, w: 120, h: 186 }, 108, 30, { x: 585, y: 250, w: 110, h: 170, name: 'Tủ quần áo (thay đồ)', use: () => UI.characterEditor(false), ay: 450 });
      furn(500, 400, (c) => ART.nightstand(c, 500, 400), { l: -30, t: -92, w: 60, h: 96 }, 48, 20);
      furn(120, 900, (c) => ART.plantPot(c, 120, 900), { l: -30, t: -95, w: 60, h: 100 }, 34, 14);
      furn(1000, 420, (c) => { c.save(); c.translate(1000, 420); c.scale(2.4, 2.4); c.translate(-1000, -420); ART.desk(c, 1000, 420); c.restore(); }, { l: -90, t: -110, w: 180, h: 120 }, 160, 40,
        { x: 920, y: 320, w: 170, h: 110, name: 'Bàn làm việc (làm việc chăm chỉ)', use: act('lastWork', 60, 15, '💼 Làm việc chăm chỉ! +15 XP', '💻 Gõ phím lạch cạch…', 'Làm nhiều quá rồi, nghỉ chút đi'), ay: 460 });
      furn(1450, 400, (c) => ART.bookshelf(c, 1450, 400), { l: -56, t: -160, w: 112, h: 166 }, 96, 24);
      furn(1200, 820, (c) => ART.sofa(c, 1200, 820, '#2f9e44'), { l: -125, t: -85, w: 250, h: 92 }, 230, 36,
        { x: 1080, y: 740, w: 240, h: 85, name: 'Sofa (nghỉ ngơi)', use: act('lastSofa2', 30, 6, '🛋️ Ngả lưng thư giãn! +6 XP', '😌 Thoải mái quá', 'Vừa nghỉ xong mà') });
      furn(1480, 900, (c) => ART.floorLamp(c, 1480, 900), { l: -40, t: -152, w: 80, h: 158 }, 30, 12);
    } else if (n === 3) {
      lab('🎤 Karaoke', 300, 262); lab('🎬 Rạp phim mini', 900, 262); lab('🏋️ Phòng gym', 1380, 262);
      // karaoke: sân khấu + loa + đèn
      m.objects.push({ y: 470, bb: [80, 260, 560, 480], draw: (c, t) => {
        c.fillStyle = '#5f3dc4'; c.fillRect(100, 380, 400, 80); c.fillStyle = '#7048e8'; c.fillRect(100, 372, 400, 12);
        for (let k = 0; k < 6; k++) { c.fillStyle = `hsl(${(t * 90 + k * 60) % 360},90%,60%)`; c.beginPath(); c.arc(130 + k * 68, 300, 10, 0, 7); c.fill(); }
        c.fillStyle = '#212529'; c.fillRect(110, 300, 50, 80); c.fillRect(440, 300, 50, 80);
        [135, 465].forEach((x) => { c.fillStyle = '#495057'; c.beginPath(); c.arc(x, 330, 14 + Math.abs(Math.sin(t * 8)) * 2, 0, 7); c.fill(); c.beginPath(); c.arc(x, 362, 8, 0, 7); c.fill(); });
        c.fillStyle = '#868e96'; c.fillRect(298, 330, 4, 50); c.fillStyle = '#212529'; c.beginPath(); c.arc(300, 326, 7, 0, 7); c.fill();
        c.fillStyle = '#111'; c.fillRect(220, 270, 160, 50); c.fillStyle = '#69db7c'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('♪ Hát cùng Quang Lâm ♪', 300, 295);
      } });
      col(m, 100, 380, 400, 80);
      inter(m, { x: 100, y: 260, w: 400, h: 200, ax: 300, ay: 500, name: 'Sân khấu karaoke (hát)', use: act('lastSing', 30, 10, '🎤 Hát karaoke cực sung! +10 XP', '🎤 Lalala~ ♪', 'Hát nhiều quá khản giọng rồi') });
      // rạp phim mini: màn chiếu (video thật) + 2 dãy ghế + máy chọn phim
      m.screen = { video: 'iRjt1n3mkN4', x: 700, y: 40, w: 400, h: 190, tap: '▶ Bấm để xem phim' };
      obj(m, 0, (c) => { c.fillStyle = '#000'; c.fillRect(694, 34, 412, 202); }, [690, 30, 1110, 240]);
      [560, 680].forEach((y, r) => { sobj(m, 900, y, (c) => CONCERT.seats(c, 760, 1040, y), { l: -170, t: -60, w: 340, h: 66 }, y - 40); col(m, 740, y - 52, 320, 24); inter(m, { x: 740, y: y - 62, w: 320, h: 62, ax: 900, ay: y + 20, name: 'Ghế rạp mini (ngồi xem phim)', use: () => AV.sitSeat(760, 1040, y, '🎬 Ngồi xem phim — bấm nơi khác để đứng dậy', (g) => CONCERT.seatsFront(g, 760, 1040, y)) }); });
      furn(1100, 900, (c) => { c.fillStyle = '#1c7ed6'; c.beginPath(); c.roundRect(1040, 830, 120, 70, 10); c.fill(); c.fillStyle = '#fff'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🎬 CHỌN PHIM', 1100, 865); }, { l: -65, t: -75, w: 130, h: 80 }, 120, 30,
        { x: 1040, y: 830, w: 120, h: 70, name: 'Máy chọn phim (dán link YouTube)', use: () => UI.moviePicker(), ay: 930 });
      // gym
      m.objects.push({ y: 560, bb: [1220, 380, 1540, 570], draw: (c, t) => {
        c.fillStyle = '#343a40'; c.fillRect(1240, 520, 150, 34); c.fillStyle = '#495057'; for (let k = 0; k < 6; k++) c.fillRect(1250 + ((k * 26 + t * 120) % 140), 526, 12, 22);
        c.fillStyle = '#868e96'; c.fillRect(1370, 430, 8, 100); c.fillStyle = '#212529'; c.fillRect(1356, 420, 40, 20);
        c.fillStyle = '#495057'; c.fillRect(1440, 470, 90, 8); [1440, 1530].forEach((x) => { c.fillStyle = '#212529'; c.beginPath(); c.arc(x, 474, 16, 0, 7); c.fill(); });
      } });
      col(m, 1240, 520, 150, 34); col(m, 1420, 455, 130, 30);
      inter(m, { x: 1230, y: 400, w: 320, h: 160, ax: 1320, ay: 600, name: 'Máy chạy bộ & tạ (tập gym)', use: act('lastGym', 45, 12, '🏋️ Tập gym khoẻ người! +12 XP', '💪 Hây dô!', 'Tập nhiều quá mỏi cơ rồi') });
    } else {
      lab('🏊 Hồ bơi vô cực', 520, 262); lab('🍢 BBQ', 1200, 262); lab('🚁 Bãi đáp', 1300, 700);
      // hồ bơi
      m.objects.push({ y: 300, bb: [120, 300, 940, 560], draw: (c, t) => {
        c.fillStyle = '#f8f9fa'; c.fillRect(120, 300, 820, 250);
        const w = c.createLinearGradient(0, 314, 0, 540); w.addColorStop(0, '#74c0fc'); w.addColorStop(1, '#1c7ed6');
        c.fillStyle = w; c.fillRect(134, 314, 792, 222);
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3;
        for (let k = 0; k < 6; k++) { c.beginPath(); const y = 340 + k * 34; for (let x = 140; x < 920; x += 20) c.lineTo(x, y + Math.sin(x * 0.03 + t * 2 + k) * 4); c.stroke(); }
      } });
      col(m, 120, 300, 820, 250);
      inter(m, { x: 120, y: 300, w: 820, h: 250, ax: 520, ay: 590, name: 'Hồ bơi vô cực (bơi thư giãn)', use: act('lastPool', 60, 15, '🏊 Bơi ở hồ vô cực ngắm thành phố! +15 XP', '🏊 Mát quá!', 'Vừa bơi xong mà') });
      [[260, 700], [520, 700], [780, 700]].forEach(([x, y]) => mv(m, `${x}_${y}`, () => { sobj(m, x, y, (c) => { c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x - 60, y - 24, 120, 20, 8); c.fill(); c.fillStyle = '#ff8787'; c.fillRect(x - 56, y - 22, 112, 6); ART.umbrella(c, x + 70, y + 10, '#ff6b6b'); }, { l: -70, t: -140, w: 180, h: 150 }); col(m, x - 60, y - 24, 120, 20);
        inter(m, { x: x - 60, y: y - 50, w: 120, h: 50, ax: x, ay: y + 20, name: 'Ghế tắm nắng (nằm nghỉ)', use: () => { const g = (AV.debugMap().movables || []).find((q) => q.key === `${x}_${y}`) || { dx: 0, dy: 0 }; AV.sitSeat(x - 30 + g.dx, x + 30 + g.dx, y + g.dy, '😎 Tắm nắng trên sân thượng'); } }); }));
      furn(1200, 470, (c) => { c.fillStyle = '#343a40'; c.beginPath(); c.roundRect(1130, 410, 140, 50, 10); c.fill(); c.fillStyle = '#ff922b'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(1150 + k * 20, 420, 6, 0, 7); c.fill(); } c.fillStyle = '#868e96'; c.fillRect(1140, 460, 8, 40); c.fillRect(1252, 460, 8, 40); }, { l: -80, t: -80, w: 160, h: 100 }, 140, 40,
        { x: 1130, y: 380, w: 140, h: 120, name: 'Bếp BBQ sân thượng', use: () => UI.eateryPanel('camp_bbq'), ay: 530 });
      furn(1460, 480, (c) => { c.strokeStyle = '#495057'; c.lineWidth = 5; c.beginPath(); c.moveTo(1460, 480); c.lineTo(1440, 430); c.moveTo(1460, 480); c.lineTo(1480, 430); c.stroke(); c.fillStyle = '#1b2f48'; c.save(); c.translate(1460, 420); c.rotate(-0.6); c.fillRect(-40, -10, 80, 20); c.restore(); }, { l: -60, t: -100, w: 120, h: 110 }, 40, 20,
        { x: 1410, y: 380, w: 100, h: 100, name: 'Kính thiên văn (ngắm sao)', use: act('lastStar', 60, 10, '🔭 Ngắm sao trên sân thượng thật lãng mạn! +10 XP', '✨ Đẹp quá!', 'Vừa ngắm xong mà'), ay: 520 });
      m.objects.push({ y: 700, bb: [1180, 740, 1420, 900], draw: (c) => { c.fillStyle = '#495057'; c.beginPath(); c.arc(1300, 820, 80, 0, 7); c.fill(); c.strokeStyle = '#ffd43b'; c.lineWidth = 6; c.beginPath(); c.arc(1300, 820, 64, 0, 7); c.stroke(); c.fillStyle = '#fff'; c.font = '900 64px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', 1300, 824); } });
      [[100, 900], [960, 900], [1520, 300]].forEach(([x, y]) => furn(x, y, (c) => ART.palmPot(c, x, y), { l: -50, t: -130, w: 100, h: 136 }, 40, 16));
      m.lights = [[520, 420, 200], [1300, 820, 120]];
    }
    m.spawn = { x: 1700, y: 640 };
    m.bounds = { l: 56, t: 262, r: m.w - 56, b: 940 };
    return m;
  }
  function g2Rug(m, x, y) { obj(m, 245, (c) => { c.fillStyle = '#c2255c'; c.beginPath(); c.ellipse(x, y, 260, 120, 0, 0, 7); c.fill(); c.fillStyle = '#f06595'; c.beginPath(); c.ellipse(x, y, 225, 98, 0, 0, 7); c.fill(); }, [x - 260, y - 120, x + 260, y + 120]); }
  /** Nhà ngoài nông trại theo cấp: 1 = nhà cấp 4, 2–3 = nhà nhiều tầng, 4 = biệt thự */
  /** 🏙️ nhà từ 5 tầng: toà tháp kính, càng nhiều tầng càng cao (tối đa ~680px) */
  function towerArt(c, x, y, lv) {
    const H = Math.min(680, 300 + lv * 8), W2 = lv >= 35 ? 220 : lv >= 20 ? 250 : 280, L = x - W2 / 2, top = y - H;
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 4, W2 / 2 + 30, 22, 0, 0, Math.PI * 2); c.fill();
    const gl = c.createLinearGradient(L, 0, L + W2, 0); gl.addColorStop(0, '#1b3a5c'); gl.addColorStop(0.45, '#5c8fbf'); gl.addColorStop(0.55, '#a5d8ff'); gl.addColorStop(1, '#1b3a5c');
    c.fillStyle = gl; c.fillRect(L, top, W2, H);
    const fh = (H - 70) / lv;
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1;
    for (let k = 0; k <= lv; k++) { const yy = y - 70 - k * fh; c.beginPath(); c.moveTo(L, yy); c.lineTo(L + W2, yy); c.stroke(); }
    for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(L + i * W2 / 6, top); c.lineTo(L + i * W2 / 6, y - 70); c.stroke(); }
    // đèn vài ô cửa
    c.fillStyle = 'rgba(255,224,102,.75)';
    for (let k = 0; k < lv; k++) for (let i = 0; i < 6; i++) if (((k * 7 + i * 13) % 5) === 0) c.fillRect(L + i * W2 / 6 + 3, y - 70 - (k + 1) * fh + 2, W2 / 6 - 6, Math.max(1, fh - 4));
    // sảnh tầng trệt
    c.fillStyle = '#e9ecef'; c.fillRect(L - 10, y - 70, W2 + 20, 70);
    c.fillStyle = '#343a40'; c.fillRect(x - 34, y - 62, 68, 62);
    c.fillStyle = '#a5d8ff'; c.fillRect(x - 30, y - 58, 29, 58); c.fillRect(x + 1, y - 58, 29, 58);
    c.fillStyle = '#c9a227'; c.fillRect(L - 14, y - 80, W2 + 28, 12);
    c.fillStyle = '#1b2f48'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(`QUANG LÂM TOWER · ${lv} TẦNG`, x, y - 74);
    // nóc: tầng 50 có bãi trực thăng + ăng ten
    c.fillStyle = '#495057'; c.fillRect(L - 6, top - 10, W2 + 12, 12);
    if (lv >= 20) { c.fillStyle = '#868e96'; c.fillRect(x - 3, top - 70, 6, 60); c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(x, top - 72, 5, 0, 7); c.fill(); }
    if (lv >= 50) { c.fillStyle = '#ffd43b'; c.beginPath(); c.arc(x - W2 * 0.25, top - 4, 16, Math.PI, 0); c.fill(); c.fillStyle = '#212529'; c.font = '900 14px system-ui'; c.fillText('H', x - W2 * 0.25, top - 10); }
  }
  function houseArt(c, x, y, lv) {
    if (lv <= 1) return ART.house(c, x, y);
    const W2 = lv === 4 ? 300 : 230, FH = 104, L = x - W2 / 2;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 4, W2 / 2 + 20, 20, 0, 0, Math.PI * 2); c.fill();
    for (let k = 0; k < lv; k++) {
      const fy = y - FH * (k + 1);
      c.fillStyle = lv === 4 ? (k % 2 ? '#f8f9fa' : '#f1f3f5') : (k % 2 ? '#fff3e0' : '#ffe8cc'); c.fillRect(L, fy, W2, FH);
      c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(L, fy + FH - 6, W2, 6);
      const wins = lv === 4 ? 4 : 3;
      for (let i = 0; i < wins; i++) {
        const wx = L + 18 + i * ((W2 - 36) / wins), ww = (W2 - 36) / wins - 14;
        if (k === 0 && i === Math.floor(wins / 2)) continue;
        c.fillStyle = lv === 4 ? '#1b2f48' : '#8a5a3c'; c.fillRect(wx - 3, fy + 18, ww + 6, 58);
        const gl = c.createLinearGradient(0, fy + 20, 0, fy + 74); gl.addColorStop(0, '#d0ebff'); gl.addColorStop(1, '#74c0fc');
        c.fillStyle = gl; c.fillRect(wx, fy + 21, ww, 52);
        c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(wx + 4, fy + 24, 6, 44);
      }
      if (k > 0) { c.fillStyle = lv === 4 ? 'rgba(165,216,255,.6)' : '#fff'; c.fillRect(L - 8, fy + FH - 22, W2 + 16, 4); for (let bx = L - 6; bx < L + W2 + 8; bx += 14) c.fillRect(bx, fy + FH - 22, 3, 20); }
    }
    // cửa chính
    c.fillStyle = lv === 4 ? '#1b2f48' : '#8a5a3c'; c.fillRect(x - 26, y - 78, 52, 78);
    c.fillStyle = lv === 4 ? '#a5d8ff' : '#c98a4b'; c.fillRect(x - 21, y - 72, 20, 72); c.fillRect(x + 1, y - 72, 20, 72);
    c.fillStyle = '#ffd43b'; c.fillRect(x - 6, y - 40, 3, 10); c.fillRect(x + 3, y - 40, 3, 10);
    const top = y - FH * lv;
    if (lv === 4) {
      // biệt thự: mái bằng + sân thượng kính + cột trắng + cây dừa
      c.fillStyle = '#dee2e6'; c.fillRect(L - 12, top - 10, W2 + 24, 12);
      c.fillStyle = 'rgba(165,216,255,.55)'; c.fillRect(L - 10, top - 40, W2 + 20, 30);
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(L - 10, top - 40, W2 + 20, 30);
      ART.umbrella(c, x + 80, top - 10, '#ff6b6b');
      c.fillStyle = '#2f9e44'; c.beginPath(); c.arc(L + 30, top - 56, 22, 0, 7); c.fill();
      [L + 8, L + W2 - 8].forEach((px) => { c.fillStyle = '#fff'; c.fillRect(px - 7, y - FH * 2, 14, FH * 2); });
      c.fillStyle = '#c9a227'; c.font = '900 16px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('✦ VILLA ✦', x, y - FH * 2 + 12);
    } else {
      c.fillStyle = '#e8590c'; c.beginPath(); c.moveTo(L - 22, top + 4); c.lineTo(x, top - 70); c.lineTo(L + W2 + 22, top + 4); c.closePath(); c.fill();
      c.fillStyle = '#c2410c'; c.fillRect(L - 22, top, W2 + 44, 8);
      c.fillStyle = '#868e96'; c.fillRect(x + 50, top - 52, 18, 40);
    }
  }

  /* ---------- Khu Đua Xe ---------- */
  function race() {
    const m = base('race', 'Khu Đua Xe', 2000, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 101);
      // đường đua trang trí hình bầu dục
      g.strokeStyle = '#d9c48f'; g.lineWidth = 120; g.beginPath(); g.ellipse(1000, 640, 760, 190, 0, 0, 7); g.stroke();
      g.strokeStyle = '#e03131'; g.lineWidth = 96; g.beginPath(); g.ellipse(1000, 640, 760, 190, 0, 0, 7); g.stroke();
      g.strokeStyle = '#fff'; g.setLineDash([30, 30]); g.beginPath(); g.ellipse(1000, 640, 760, 190, 0, 0, 7); g.stroke(); g.setLineDash([]);
      g.strokeStyle = '#56606b'; g.lineWidth = 84; g.beginPath(); g.ellipse(1000, 640, 760, 190, 0, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; g.setLineDash([26, 26]); g.beginPath(); g.ellipse(1000, 640, 760, 190, 0, 0, 7); g.stroke(); g.setLineDash([]);
      for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) { g.fillStyle = (k + r) % 2 ? '#fff' : '#111'; g.fillRect(1320 - 7 + r * 14 - 7, 760 + k * 14, 14, 14); }
      paintStreet(g, m.w, 870, 1000);
    });
    sobj(m, 1000, 470, (c) => ART.grandstand(c, 1000, 470), { l: -240, t: -175, w: 480, h: 182 });
    col(m, 770, 440, 460, 32);
    m.labels.push({ text: '🏎️ Khu Đua Xe', x: 1000, y: 318 });

    sobj(m, 1320, 830, (c) => ART.startGate(c, 1320, 830), { l: -145, t: -180, w: 290, h: 186 });
    col(m, 1186, 822, 20, 10); col(m, 1434, 822, 20, 10);
    inter(m, { x: 1180, y: 650, w: 280, h: 185, ax: 1320, ay: 850, name: 'Cổng xuất phát (Đua Xe 3D)', use: () => UI.race3d(), arrow: { x: 1320, y: 705, text: 'Đua xe' } });

    const garage = { w: 240, wall: '#fff9db', roof: '#f08c00', awning: '#e67700', sign: '🏆 BẢNG VÀNG', icons: ['🏆', '🏎️'], door: '#495057' };
    sobj(m, 300, 560, (c) => ART.building(c, 300, 560, garage));
    col(m, 180, 480, 240, 82);
    inter(m, { x: 170, y: 380, w: 260, h: 182, ax: 300, ay: 592, name: 'Bảng Vàng (thành tích đua xe)', use: () => UI.race3dStats(), arrow: { x: 300, y: 485, text: 'Thành tích' } });

    [[1700, 560, '#e03131'], [1700, 700, '#1971c2']].forEach(([x, y, c]) => { sobj(m, x, y, (cx) => ART.raceCar(cx, x, y, c), { l: -70, t: -55, w: 140, h: 70 }); col(m, x - 56, y - 14, 112, 16); });
    addLamp(m, 640, 830); addLamp(m, 1600, 830);
    addTree(m, 80, 450, 'green'); addTree(m, 1920, 450, 'pink');

    street(m);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  /** Trang trí Halloween: chỉ hiện khi sự kiện đang diễn ra (vẽ nhưng tự ẩn khi tắt) */
  function halloween(m) {
    if (m.indoor) return;
    const r = ART.srand([...m.id].reduce((a, c) => a * 31 + c.charCodeAt(0), 17) % 2147483646);
    const free = (x, y, pad) => !m.colliders.some((c) => x > c.x - pad && x < c.x + c.w + pad && y > c.y - pad && y < c.y + c.h + pad)
      && !m.inter.some((o) => x > o.x - 20 && x < o.x + o.w + 20 && y > o.y - 10 && y < o.y + o.h + 30)
      && (!m.busStop || Math.hypot(x - m.busStop.x, y - m.busStop.y) > 120);
    const b = m.bounds, spots = [];
    for (let tries = 0; tries < 400 && spots.length < 14; tries++) {
      const x = b.l + 60 + r() * (b.r - b.l - 120), y = b.t + 40 + r() * (Math.min(b.b, 840) - b.t - 40);
      if (free(x, y, 40) && spots.every((p) => Math.hypot(p[0] - x, p[1] - y) > 170)) spots.push([x, y]);
    }
    m.hwMagic = [];
    spots.forEach(([x, y], i) => {
      const magic = i % 4 === 0;
      const idx = m.hwMagic.length;
      if (magic) m.hwMagic.push({ x, y });
      obj(m, y, (ctx, t) => { if (AV.hw()) ART.jackLantern(ctx, x, y, t, magic && !AV.hwFound(m.id, idx)); });
      (m.lights = m.lights || []).push([x, y - 16, 36, 'hw']);
      if (magic) inter(m, { x: x - 26, y: y - 40, w: 52, h: 46, ax: x, ay: y + 22, name: '✨ Bí ngô ma (nhặt kẹo)', use: () => AV.hwPickPumpkin(m.id, idx), hw: true });
    });
    if (['park', 'farm', 'school', 'town'].includes(m.id)) {
      for (let k = 0, tries = 0; k < 5 && tries < 200; tries++) {
        const x = b.l + 80 + r() * (b.r - b.l - 160), y = b.t + 60 + r() * (Math.min(b.b, 840) - b.t - 60);
        if (!free(x, y, 50) || spots.some((p) => Math.hypot(p[0] - x, p[1] - y) < 90)) continue;
        const kk = k++;
        obj(m, y, (ctx) => { if (AV.hw()) ART.gravestone(ctx, x, y, kk); });
      }
    }
  }

  /* ---------- Tiệm Halloween ở Quảng trường ---------- */
  const _town = town;
  town = function townWithHalloween() {
    const m = _town();
    m.objects.push({ y: 790, draw: (ctx, t) => { if (AV.hw()) ART.cauldronStall(ctx, 1560, 790, t); } });
    inter(m, { x: 1470, y: 640, w: 180, h: 160, ax: 1560, ay: 830, name: '🎃 Tiệm Halloween (đổi kẹo)', use: () => UI.halloweenPanel(), arrow: { x: 1560, y: 600, text: 'Halloween' }, hw: true });
    npc(m, 'Bà Phù Thuỷ', { skin: '#b2f2bb', hair: 'long', hairColor: '#7048e8', shirt: '#5f3dc4', shirtStyle: 'witchdress', pants: '#212529', hat: 'witch' }, { l: 1470, t: 830, r: 1650, b: 850 }, 1640, 840, 'bat');
    m.npcs[m.npcs.length - 1].hw = true;
    return m;
  };

  Object.defineProperty(floorN, 'hidden', { value: true });
  const ranch = () => RANCH.buildMap({ base, ground, obj, sobj, col, inter, paintGrass, addTree, edges });
  const all = { apt_han: () => airport('han'), apt_hph: () => airport('hph'), apt_vdo: () => airport('vdo'), apt_sgn: () => airport('sgn'), apt_pqc: () => airport('pqc'), apt_dad: () => airport('dad'), ranch, mine, hospital, clinic, home2: () => floorMap(2), home3: () => floorMap(3), home4: () => floorMap(4), farm, town, mall, fun, casino, arena, horse, club, sky, concert, cherry, wc, cgv, boxing, park, beach, school, classroom, home, race };
  Object.defineProperty(all, 'moveGroup', { value: moveGroup, enumerable: false });
  Object.defineProperty(all, 'floorN', { value: (n) => { const m = floorN(n); halloween(m); return m; }, enumerable: false });
  Object.keys(all).forEach((k) => { const fn = all[k]; all[k] = () => { const m = fn(); halloween(m); return m; }; });
  return all;
})();
