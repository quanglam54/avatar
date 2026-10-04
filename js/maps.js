/* Xây dựng bản đồ: cảnh vật, vật cản, điểm tương tác, động vật, NPC */
const MAPS = (() => {
  function base(id, name, w, h) {
    return { id, name, w, h, objects: [], colliders: [], inter: [], animals: [], npcs: [], labels: [] };
  }
  const obj = (m, y, draw) => m.objects.push({ y, draw });
  const col = (m, x, y, w, h) => m.colliders.push({ x, y, w, h });
  const inter = (m, o) => m.inter.push(o);

  /* ---------- Nền đất vẽ sẵn một lần ---------- */
  function ground(m, painter) {
    const c = document.createElement('canvas');
    c.width = m.w;
    c.height = m.h;
    painter(c.getContext('2d'));
    m.ground = c;
  }

  function paintGrass(g, w, h, seed) {
    g.fillStyle = '#86cf55';
    g.fillRect(0, 0, w, h);
    const r = ART.srand(seed);
    for (let i = 0; i < (w * h) / 5000; i++) {
      g.fillStyle = 'rgba(160,225,110,.35)';
      g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 60, 12 + r() * 25, 0, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = '#6cba42'; g.lineWidth = 2; g.lineCap = 'round';
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

  function paintStreet(g, w, y1, y2) {
    g.fillStyle = '#d5ccbd'; g.fillRect(0, y1 - 22, w, 22);
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 44) { g.beginPath(); g.moveTo(x, y1 - 22); g.lineTo(x, y1); g.stroke(); }
    g.fillStyle = '#9b9384'; g.fillRect(0, y1 - 3, w, 5);
    g.fillStyle = '#b8ad9a'; g.fillRect(0, y1, w, y2 - y1);
    g.fillStyle = 'rgba(0,0,0,.05)';
    for (let i = 0; i < w / 4; i++) g.fillRect(Math.random() * w, y1 + Math.random() * (y2 - y1), 3, 2);
    g.fillStyle = '#f1e9da';
    for (let x = 20; x < w; x += 90) g.fillRect(x, (y1 + y2) / 2 - 3, 50, 6);
    g.fillStyle = '#9b9384'; g.fillRect(0, y2 - 2, w, 5);
  }

  /* ---------- Đồ vật ---------- */
  function addTree(m, x, y, variant) {
    obj(m, y, (ctx) => ART.tree(ctx, x, y, variant));
    col(m, x - 14, y - 10, 28, 12);
  }
  function addBush(m, x, y, flower) {
    obj(m, y, (ctx) => ART.bush(ctx, x, y, flower));
    col(m, x - 26, y - 12, 52, 12);
  }
  function addLamp(m, x, y) {
    obj(m, y, (ctx) => ART.lamp(ctx, x, y, false));
    col(m, x - 6, y - 6, 12, 8);
  }
  function addBusStop(m, x, y) {
    m.busStop = { x, y };
    obj(m, y, (ctx) => ART.busStop(ctx, x, y));
    col(m, x - 5, y - 5, 10, 6);
    inter(m, { x: x - 30, y: y - 128, w: 60, h: 132, ax: x + 44, ay: y + 12, name: 'Trạm xe buýt', use: () => AV.useBusStop() });
  }

  function picketPen(m, L, T, R, B) {
    obj(m, T, (ctx) => ART.picketsH(ctx, L, R, T));
    obj(m, B, (ctx) => ART.picketsH(ctx, L, R, B));
    for (let y = T + 19; y < B - 4; y += 19) {
      obj(m, y, (ctx) => { ART.picket(ctx, L + 6, y); ART.picket(ctx, R - 6, y); });
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
      obj(m, y, (ctx) => {
        for (let i = 0; i < n; i++) ART.rope(ctx, xs[i], y, xs[i + 1], y);
        xs.forEach((x) => ART.woodPost(ctx, x, y));
      });
    });
    const k = Math.round((B - T) / 62), sy = (B - T) / k;
    for (let j = 1; j < k; j++) {
      const y = T + j * sy, yPrev = T + (j - 1) * sy;
      obj(m, y, (ctx) => {
        [L, R].forEach((x) => { ART.rope(ctx, x, yPrev, x, y); ART.woodPost(ctx, x, y); });
      });
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

  /* ---------- Nông trại ---------- */
  function farm() {
    const m = base('farm', 'Nông trại', 2200, 1250);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 11);
      g.fillStyle = 'rgba(120,180,70,.45)';
      g.beginPath(); g.roundRect(1280, 350, 550, 230, 24); g.fill();
      paintDirtRoad(g, m.w, 650, 728, 5);
      g.fillStyle = '#d9b382';
      g.beginPath(); g.roundRect(2015, 600, 50, 60, 6); g.fill();
      paintStreet(g, m.w, 870, 1000);
    });

    const variants = ['green', 'pink', 'fruit', 'pink', 'green', 'fruit'];
    for (let i = 0, x = 40; x < m.w + 40; x += 150, i++) addTree(m, x, i % 2 ? 190 : 255, variants[i % 6]);

    // Chuồng gà
    picketPen(m, 180, 370, 520, 590);
    obj(m, 430, (ctx) => ART.nestBox(ctx, 240, 430));
    obj(m, 610, (ctx) => ART.hayBale(ctx, 120, 610));
    obj(m, 575, (ctx) => ART.hayBale(ctx, 132, 575));
    col(m, 92, 560, 70, 52);
    const coopArea = { l: 215, t: 455, r: 490, b: 575 };
    for (let i = 0; i < 5; i++) animal(m, 'chicken', coopArea, i);
    m.labels.push({ text: '🐔 Chuồng Gà', x: 350, y: 335 });
    inter(m, {
      x: 180, y: 330, w: 340, h: 262, ax: 350, ay: 618, name: 'Chuồng Gà',
      use: () => AV.useCoop(), indicator: () => AV.coopIndicator(), ix: 440, iy: 420,
    });

    // Chuồng gia súc
    woodPen(m, 620, 360, 1180, 615);
    obj(m, 440, (ctx) => ART.hayStack(ctx, 1110, 440));
    const penArea = { l: 670, t: 430, r: 1050, b: 595 };
    animal(m, 'cow', penArea, 7);
    animal(m, 'cow', penArea, 21);
    animal(m, 'sheep', penArea, 3);
    animal(m, 'pig', penArea, 5);
    m.labels.push({ text: '🐄 Chuồng Gia Súc', x: 900, y: 322 });
    inter(m, {
      x: 620, y: 320, w: 560, h: 295, ax: 900, ay: 642, name: 'Chuồng Gia Súc',
      use: () => AV.usePen(), indicator: () => AV.penIndicator(), ix: 900, iy: 415,
    });

    // Ruộng
    m.labels.push({ text: '🌾 Ruộng', x: 1555, y: 330 });
    for (let row = 0; row < 2; row++) for (let c = 0; c < 5; c++) {
      const i = row * 5 + c;
      const px = 1300 + c * 102, py = 368 + row * 104, w = 88, h = 72;
      obj(m, py + h - 30, (ctx, t) => {
        const p = AV.S.plots[i];
        ART.plot(ctx, px, py, w, h, { unlocked: p.unlocked, price: DATA.PLOT_PRICES[i] }, p.crop, AV.plotStage(p), t);
      });
      inter(m, {
        x: px, y: py, w, h, ax: px + w / 2, ay: py + h + 12, name: 'Ô ruộng',
        use: () => AV.usePlot(i), indicator: () => AV.plotIndicator(i), ix: px + w / 2, iy: py - 4,
      });
    }

    // Nhà
    obj(m, 600, (ctx) => ART.house(ctx, 2040, 600));
    col(m, 1935, 500, 210, 100);
    inter(m, { x: 1935, y: 420, w: 210, h: 180, ax: 2040, ay: 628, name: 'Nhà của bạn (thay đồ)', use: () => AV.useHouse() });
    obj(m, 640, (ctx) => ART.mailbox(ctx, 1905, 640));
    col(m, 1898, 632, 14, 10);
    m.labels.push({ text: '🏠 Nhà ' + (AV.S && AV.S.name ? AV.S.name : 'của bạn'), x: 2040, y: 395, dynamic: 'home' });

    // Hàng bụi hoa & đèn
    const flowers = ['#ff8fab', '#ffd43b', '#fff', '#da77f2'];
    [80, 320, 600, 820, 1180, 1420, 1700, 2120].forEach((x, i) => addBush(m, x, 810, flowers[i % 4]));
    [460, 1300, 1950].forEach((x) => addLamp(m, x, 815));
    addBusStop(m, 1000, 862);

    // Dưới đường
    obj(m, 1060, (ctx, t) => ART.pond(ctx, 480, 1120, t));
    col(m, 345, 1075, 270, 90);
    [150, 900, 1300, 1720, 2080].forEach((x, i) => addTree(m, x, 1240, variants[(i + 2) % 6]));
    [760, 1500, 1950].forEach((x, i) => addBush(m, x, 1110, flowers[(i + 1) % 4]));
    obj(m, 1130, (ctx) => ART.hayBale(ctx, 1150, 1130));
    col(m, 1124, 1104, 52, 26);

    m.spawn = { x: 1000, y: 690 };
    m.bounds = { l: 20, t: 290, r: m.w - 20, b: m.h - 20 };
    return m;
  }

  /* ---------- Thị trấn ---------- */
  function town() {
    const m = base('town', 'Thị trấn', 2000, 1250);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 29);
      g.fillStyle = '#e9dcc4';
      g.beginPath(); g.roundRect(180, 300, 1640, 510, 40); g.fill();
      g.strokeStyle = 'rgba(150,120,80,.18)'; g.lineWidth = 2;
      for (let y = 330; y < 800; y += 34) for (let x = 210 + ((y / 34) % 2) * 22; x < 1800; x += 44) {
        g.beginPath(); g.roundRect(x, y, 40, 30, 6); g.stroke();
      }
      g.fillStyle = '#d6c3a1';
      g.beginPath(); g.roundRect(960, 800, 80, 50, 6); g.fill();
      paintStreet(g, m.w, 870, 1000);
    });

    const variants = ['pink', 'green', 'fruit', 'green', 'pink'];
    for (let i = 0, x = 60; x < m.w + 40; x += 160, i++) addTree(m, x, i % 2 ? 200 : 260, variants[i % 5]);

    obj(m, 500, (ctx, t) => ART.stall(ctx, 520, 500, t));
    col(m, 415, 452, 210, 50);
    inter(m, { x: 410, y: 330, w: 220, h: 172, ax: 520, ay: 532, name: 'Chợ (mua bán)', use: () => UI.shop() });

    obj(m, 500, (ctx) => ART.boutique(ctx, 1480, 500));
    col(m, 1355, 420, 250, 82);
    inter(m, { x: 1350, y: 320, w: 260, h: 182, ax: 1480, ay: 532, name: 'Tiệm Thời Trang', use: () => UI.boutique() });

    obj(m, 575, (ctx, t) => ART.fountain(ctx, 1000, 575, t));
    col(m, 885, 530, 230, 62);
    inter(m, { x: 880, y: 470, w: 240, h: 130, ax: 1000, ay: 625, name: 'Đài phun nước (ước nguyện 1 xu)', use: () => AV.useFountain() });
    m.labels.push({ text: '⛲ Quảng Trường', x: 1000, y: 445 });

    [[760, 760], [1240, 760]].forEach(([x, y]) => { obj(m, y, (ctx) => ART.bench(ctx, x, y)); col(m, x - 42, y - 10, 84, 12); });
    [[300, 580], [1700, 580], [760, 360], [1240, 360]].forEach(([x, y]) => addLamp(m, x, y));
    const flowers = ['#ff8fab', '#ffd43b', '#fff', '#da77f2'];
    [[230, 340], [1770, 340], [230, 790], [1770, 790], [640, 790], [1360, 790]].forEach(([x, y], i) => addBush(m, x, y, flowers[i % 4]));
    addBusStop(m, 1000, 862);

    [120, 520, 1450, 1880].forEach((x, i) => addTree(m, x, 1240, variants[(i + 1) % 5]));
    [300, 800, 1200, 1650].forEach((x, i) => addBush(m, x, 1120, flowers[i % 4]));

    const area = { l: 240, t: 380, r: 1760, b: 790 };
    const npcs = [
      { name: 'Bé Na', look: { skin: '#ffe0c4', hair: 'pigtails', hairColor: '#6b3e26', shirt: '#e64980', shirtStyle: 'heart', pants: '#dee2e6', hat: 'bow' } },
      { name: 'Anh Tú', look: { skin: '#e3a979', hair: 'spiky', hairColor: '#2b2b33', shirt: '#4c6ef5', shirtStyle: 'stripes', pants: '#343a40', hat: 'cap' } },
      { name: 'Cô Mai', look: { skin: '#f8c9a2', hair: 'long', hairColor: '#2b2b33', shirt: '#fcc419', shirtStyle: 'plain', pants: '#8b5a2b', hat: 'nonla' } },
      { name: 'Bác Ba', look: { skin: '#b97a51', hair: 'bald', hairColor: '#e9ecef', shirt: '#40c057', shirtStyle: 'overall', pants: '#364fc7', hat: 'none' } },
    ];
    npcs.forEach((n, i) => {
      const x = area.l + 200 + i * 360, y = 690;
      m.npcs.push({ ...n, kind: 'npc', x, y, tx: x, ty: y, area, wait: 1 + i, dir: 1, t: i, moving: false, nextTalk: 4 + i * 5, bubble: null });
    });

    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 300, r: m.w - 20, b: m.h - 20 };
    return m;
  }

  return { farm, town };
})();
