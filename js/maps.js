/* Xây dựng bản đồ: cảnh vật, vật cản, điểm tương tác, động vật, NPC */
const MAPS = (() => {
  function base(id, name, w, h) {
    return { id, name, w, h, hz: HZ, objects: [], colliders: [], inter: [], animals: [], npcs: [], labels: [], pickups: [] };
  }
  const HZ = 340;
  const obj = (m, y, draw) => m.objects.push({ y, draw });
  /** Đồ vật tĩnh: vẽ sẵn một lần, có viền đậm kiểu Avatar */
  const sobj = (m, x, y, draw, box = FX.BOX.object, sortY = y) => m.objects.push({ y: sortY, draw: FX.sprite(draw, x, y, box) });
  /** Đồ vật chuyển động: vẽ lại mỗi khung hình, có viền */
  const aobj = (m, x, y, draw, box) => { const key = {}; m.objects.push({ y, draw: (ctx, t) => FX.drawCached(ctx, key, (c) => draw(c, t), x, y, box, 90) }); };
  const col = (m, x, y, w, h) => m.colliders.push({ x, y, w, h });
  const inter = (m, o) => m.inter.push(o);
  const FLOWERS = ['#ff8fab', '#ffd43b', '#fff', '#da77f2'];

  /* ---------- Nền đất vẽ sẵn một lần ---------- */
  function ground(m, painter) {
    const c = document.createElement('canvas');
    c.width = m.w;
    c.height = m.h;
    painter(c.getContext('2d'));
    m.ground = c;
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
  function addBusStop(m, x, y) {
    m.busStop = { x, y };
    sobj(m, x, y, (c) => ART.busStop(c, x, y));
    col(m, x - 5, y - 5, 10, 6);
    inter(m, { x: x - 30, y: y - 128, w: 60, h: 132, ax: x + 44, ay: y + 12, name: 'Trạm xe buýt (bản đồ thành phố)', use: () => AV.useBusStop() });
  }

  /** Hàng rào gỗ + luống tulip ở đường chân trời, tulip viền dưới đáy — giống nhau ở mọi khu */
  function edges(m, top = true) {
    if (top) sobj(m, 0, HZ + 18, (c) => { ART.woodFence(c, 0, m.w, HZ + 2); ART.tulips(c, 0, m.w, HZ + 18); }, { l: -10, t: -70, w: m.w + 20, h: 74 });
    sobj(m, 0, 1046, (c) => ART.tulips(c, 0, m.w, 1046), { l: -10, t: -42, w: m.w + 20, h: 46 });
  }

  /** Đường nhựa và trạm xe buýt — giống nhau ở mọi khu */
  function street(m) {
    addBusStop(m, 1000, 862);
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
    m.npcs.push({ name, look: { pet: pet || 'none', ...look }, kind: 'npc', x, y, tx: x, ty: y, area, wait: 1 + Math.random() * 3, dir: 1, t: Math.random() * 5, moving: false, nextTalk: 3 + Math.random() * 10, bubble: null, px: x - 30, py: y });
  }

  /* ---------- Nông trại ---------- */
  function farm() {
    const m = base('farm', 'Nông trại', 2200, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 11);
      g.fillStyle = 'rgba(120,180,70,.45)';
      g.beginPath(); g.roundRect(1280, 350, 550, 230, 24); g.fill();
      paintDirtRoad(g, m.w, 650, 728, 5);
      g.fillStyle = '#d9b382';
      g.beginPath(); g.roundRect(2015, 600, 50, 60, 6); g.fill();
      paintStreet(g, m.w, 870, 1000);
    });

    addTree(m, 60, 430, 'pink');
    addTree(m, 1240, 400, 'fruit');

    picketPen(m, 180, 370, 520, 590);
    sobj(m, 240, 430, (c) => ART.nestBox(c, 240, 430));
    sobj(m, 120, 610, (c) => ART.hayBale(c, 120, 610));
    sobj(m, 132, 575, (c) => ART.hayBale(c, 132, 575));
    col(m, 92, 560, 70, 52);
    const coopArea = { l: 215, t: 455, r: 490, b: 575 };
    for (let i = 0; i < 5; i++) animal(m, 'chicken', coopArea, i);
    m.labels.push({ text: '🐔 Chuồng Gà', x: 350, y: 335 });
    inter(m, {
      x: 180, y: 330, w: 340, h: 262, ax: 350, ay: 618, name: 'Chuồng Gà',
      use: () => AV.useCoop(), indicator: () => AV.coopIndicator(), ix: 440, iy: 420,
    });

    woodPen(m, 620, 360, 1180, 615);
    sobj(m, 1110, 440, (c) => ART.hayStack(c, 1110, 440));
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

    sobj(m, 2040, 600, (c) => ART.house(c, 2040, 600));
    col(m, 1935, 500, 210, 100);
    inter(m, { x: 1935, y: 420, w: 210, h: 180, ax: 2040, ay: 628, name: 'Nhà của bạn (thay đồ)', use: () => AV.useHouse() });
    sobj(m, 1905, 640, (c) => ART.mailbox(c, 1905, 640));
    col(m, 1898, 632, 14, 10);
    m.labels.push({ text: '', x: 2040, y: 395, dynamic: 'home' });

    [80, 320, 600, 820, 1180, 1420, 1700, 2120].forEach((x, i) => addBush(m, x, 810, FLOWERS[i % 4]));
    [460, 1300, 1950].forEach((x) => addLamp(m, x, 815));
    street(m);

    m.spawn = { x: 1000, y: 690 };
    m.bounds = { l: 20, t: 365, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  const plazaArea = { l: 240, t: 380, r: 1760, b: 790 };

  /* ---------- Quảng trường ---------- */
  function town() {
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

    street(m);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  /* ---------- Khu mua sắm ---------- */
  function mall() {
    const m = base('mall', 'Khu mua sắm', 2000, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 41);
      paintPaved(g, 120, 370, 1760, 450, '#e7e1f5');
      paintStreet(g, m.w, 870, 1000);
    });
    addTree(m, 60, 470, 'green'); addTree(m, 1940, 470, 'pink');

    sobj(m, 450, 520, (c) => ART.stall(c, 450, 520, 0));
    col(m, 345, 472, 210, 50);
    inter(m, { x: 340, y: 350, w: 220, h: 172, ax: 450, ay: 552, name: 'Chợ (mua hạt, bán nông sản)', use: () => UI.shop() });

    sobj(m, 1000, 520, (c) => ART.boutique(c, 1000, 520));
    col(m, 875, 440, 250, 82);
    inter(m, { x: 870, y: 340, w: 260, h: 182, ax: 1000, ay: 552, name: 'Tiệm Thời Trang', use: () => UI.boutique() });

    const petShop = { w: 240, wall: '#e6fcf5', roof: '#20c997', awning: '#0ca678', sign: '🐶 THÚ CƯNG', icons: ['🐕', '🐈'], door: '#087f5b' };
    sobj(m, 1550, 520, (c) => ART.building(c, 1550, 520, petShop));
    col(m, 1430, 440, 240, 82);
    inter(m, { x: 1420, y: 340, w: 260, h: 182, ax: 1550, ay: 552, name: 'Tiệm Thú Cưng', use: () => UI.petShop() });

    [[720, 600, 'mai'], [1280, 600, 'dao'], [200, 700, 'dao'], [1800, 700, 'mai']].forEach(([x, y, k]) => addPot(m, x, y, k));
    [[300, 780], [820, 780], [1700, 780]].forEach(([x, y]) => addLamp(m, x, y));
    addBench(m, 650, 770); addBench(m, 1350, 770);
    m.labels.push({ text: '🛍️ Khu Mua Sắm', x: 1000, y: 318 });

    npc(m, 'Chị Lan', { skin: '#f8c9a2', hair: 'bun', hairColor: '#6b3e26', shirt: '#cc5de8', shirtStyle: 'star', pants: '#343a40', hat: 'flower' }, { l: 200, t: 600, r: 1800, b: 800 }, 800, 680, 'cat');

    street(m);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  /* ---------- Khu giải trí ---------- */
  function fun() {
    const m = base('fun', 'Khu giải trí', 2000, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 53);
      paintPaved(g, 120, 370, 1760, 460, '#f6e3d0');
      paintStreet(g, m.w, 870, 1000);
    });

    sobj(m, 400, 640, (c) => ART.gameTable(c, 400, 640, 'baucua', 0));
    col(m, 300, 590, 200, 50);
    inter(m, { x: 290, y: 520, w: 220, h: 140, ax: 400, ay: 690, name: 'Bàn Bầu Cua', use: () => UI.bauCua() });

    sobj(m, 760, 640, (c) => ART.gameTable(c, 760, 640, 'baicao', 0));
    col(m, 660, 590, 200, 50);
    inter(m, { x: 650, y: 520, w: 220, h: 140, ax: 760, ay: 690, name: 'Bàn Bài Cào', use: () => UI.baiCao() });

    aobj(m, 1160, 570, (c, t) => ART.stage(c, 1160, 570, t), { l: -185, t: -265, w: 370, h: 275 });
    col(m, 990, 524, 340, 50);
    inter(m, { x: 990, y: 380, w: 340, h: 195, ax: 1160, ay: 605, name: 'Sân khấu (nhảy múa)', use: () => AV.useStage() });

    aobj(m, 1680, 690, (c, t) => ART.ferrisWheel(c, 1680, 690, t), { l: -175, t: -385, w: 350, h: 400 });
    col(m, 1580, 660, 200, 40);
    inter(m, { x: 1520, y: 340, w: 320, h: 350, ax: 1680, ay: 730, name: 'Vòng quay (5 xu)', use: () => AV.useFerris() });

    sobj(m, 1260, 790, (c) => ART.iceCart(c, 1260, 790));
    col(m, 1214, 770, 92, 24);
    inter(m, { x: 1210, y: 650, w: 100, h: 145, ax: 1260, ay: 825, name: 'Xe kem (5 xu)', use: () => AV.buyIceCream() });

    [[180, 420], [580, 420], [1820, 420]].forEach(([x, y]) => addLamp(m, x, y));
    [[200, 790, 'mai'], [580, 790, 'dao'], [860, 790, 'mai']].forEach(([x, y, k]) => addPot(m, x, y, k));
    m.labels.push({ text: '🎡 Khu Giải Trí', x: 700, y: 318 });

    npc(m, 'Bé Bin', { skin: '#ffe0c4', hair: 'spiky', hairColor: '#c68642', shirt: '#fd7e14', shirtStyle: 'star', pants: '#364fc7', hat: 'beanie' }, { l: 200, t: 700, r: 1800, b: 830 }, 1000, 760, 'chick');

    street(m);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  /* ---------- Công viên ---------- */
  function park() {
    const m = base('park', 'Công viên', 2000, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 67);
      paintDirtRoad(g, m.w, 770, 830, 3);
      paintStreet(g, m.w, 870, 1000);
    });

    obj(m, 410, (ctx, t) => ART.lake(ctx, 1000, 560, 330, 140, t));
    col(m, 690, 440, 620, 230);
    col(m, 740, 420, 520, 20);
    sobj(m, 1180, 745, (c) => ART.dock(c, 1180, 745));
    inter(m, { x: 1135, y: 640, w: 90, h: 135, ax: 1180, ay: 790, name: 'Bến câu cá', use: () => UI.fishing() });
    m.labels.push({ text: '🌳 Công Viên', x: 1000, y: 390 });

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

    npc(m, 'Cô Hoa', { skin: '#b97a51', hair: 'long', hairColor: '#f4d06f', shirt: '#15aabf', shirtStyle: 'stripes', pants: '#fd7e14', hat: 'flower' }, { l: 200, t: 560, r: 1800, b: 830 }, 1200, 760, 'cat');

    addBusStop(m, 1000, 862);
    edges(m, false);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 520, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  return { farm, town, mall, fun, park, beach };
})();
