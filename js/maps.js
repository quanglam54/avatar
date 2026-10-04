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

  /* ---------- Nông trại (bố cục ô cỏ trên nền đất như Avatar) ---------- */
  function farm() {
    const m = base('farm', 'Nông trại', 2200, 1070);
    const BL = {
      chick: [110, 378, 520, 252], pen: [700, 378, 520, 252], field: [1290, 378, 620, 252], home: [1975, 378, 210, 252],
      kitchen: [110, 692, 560, 138], mid: [740, 692, 480, 138], garden: [1290, 692, 620, 138], mail: [1975, 692, 210, 138],
    };
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 11);
      paintDirt(g, 70, 360, m.w - 140, 490, 4);
      Object.values(BL).forEach(([x, y, w, h], i) => paintBlock(g, x, y, w, h, i + 1));
      paintStreet(g, m.w, 870, 1000);
    });

    addTree(m, 40, 640, 'pink');
    addTree(m, 2165, 690, 'green');

    // Chuồng gà mái tôn + gà chạy trong ô cỏ
    sobj(m, 250, 530, (c) => ART.shed(c, 250, 530));
    col(m, 150, 488, 200, 46);
    sobj(m, 590, 470, (c) => ART.hayBale(c, 590, 470));
    col(m, 562, 444, 56, 28);
    const coopArea = { l: 370, t: 420, r: 610, b: 615 };
    for (let i = 0; i < 6; i++) animal(m, 'chicken', coopArea, i);
    m.labels.push({ text: '🐔 Chuồng Gà', x: 250, y: 362 });
    inter(m, {
      x: 130, y: 360, w: 240, h: 180, ax: 250, ay: 560, name: 'Chuồng gà (cho ăn / nhặt trứng)', arrow: { x: 250, y: 470 },
      use: () => AV.useCoop(), indicator: () => AV.coopIndicator(), ix: 250, iy: 405,
    });

    // Chuồng gia súc rào gỗ
    woodPen(m, 722, 402, 1198, 612);
    sobj(m, 1138, 470, (c) => ART.hayStack(c, 1138, 470));
    const penArea = { l: 770, t: 455, r: 1080, b: 598 };
    animal(m, 'cow', penArea, 7);
    animal(m, 'cow', penArea, 21);
    animal(m, 'sheep', penArea, 3);
    animal(m, 'sheep', penArea, 9);
    animal(m, 'pig', penArea, 5);
    m.labels.push({ text: '🐄 Chuồng Gia Súc', x: 960, y: 362 });
    inter(m, {
      x: 722, y: 362, w: 476, h: 250, ax: 960, ay: 650, name: 'Chuồng gia súc',
      use: () => AV.usePen(), indicator: () => AV.penIndicator(), ix: 960, iy: 440,
    });

    // Ruộng: 4 luống, mỗi luống 6×2 ô như Avatar
    m.labels.push({ text: '🌾 Ruộng', x: 1600, y: 362 });
    const BD = ART.BED;
    for (let bedIdx = 0; bedIdx < 4; bedIdx++) {
      const bx = 1290 + (bedIdx % 2) * (BD.w + 18), by = 386 + Math.floor(bedIdx / 2) * (BD.h + 12);
      obj(m, by + BD.h - 25, (ctx, t) => {
        const tiles = AV.S.tiles.slice(bedIdx * 12, bedIdx * 12 + 12).map((x) => ({ crop: x.crop, st: AV.tileState(x) }));
        ART.bed(ctx, bx, by, AV.S.beds[bedIdx], DATA.BED_PRICES[bedIdx], tiles, t);
      });
      for (let k = 0; k < 12; k++) {
        const i = bedIdx * 12 + k;
        const tx = bx + BD.padX + (k % 6) * BD.step, ty = by + BD.padY + Math.floor(k / 6) * BD.step;
        inter(m, {
          x: tx - 2, y: ty - 2, w: BD.tile + 4, h: BD.tile + 4, ax: tx + BD.tile / 2, ay: by + BD.h + 8, name: 'Ô ruộng',
          use: () => AV.useTile(i),
          indicator: k === 0 ? () => AV.bedIndicator(bedIdx) : null, ix: bx + BD.w / 2, iy: by - 2,
        });
      }
    }

    // Nhà của bạn
    sobj(m, 2080, 618, (c) => ART.house(c, 2080, 618));
    col(m, 1978, 518, 204, 100);
    inter(m, { x: 1975, y: 440, w: 210, h: 178, ax: 2080, ay: 648, name: 'Nhà của bạn (thay đồ)', use: () => AV.useHouse(), arrow: { x: 2080, y: 535 } });
    m.labels.push({ text: '', x: 2080, y: 404, dynamic: 'home' });

    // Nhà bếp
    sobj(m, 330, 820, (c) => ART.kitchen(c, 330, 820));
    col(m, 222, 772, 216, 50);
    inter(m, { x: 205, y: 640, w: 250, h: 182, ax: 330, ay: 845, name: 'Nhà bếp (nấu món ăn)', use: () => UI.kitchen(), arrow: { x: 380, y: 740 } });
    sobj(m, 560, 760, (c) => ART.hayBale(c, 560, 760));
    col(m, 532, 734, 56, 28);
    animal(m, 'dog', { l: 600, t: 705, r: 1200, b: 822 }, 2);

    // Vườn hoa mai, đào
    addTree(m, 860, 800, 'mai');
    [[1080, 800, '#ff8fab'], [1500, 805, '#ffd43b'], [1700, 805, '#fff']].forEach(([x, y, f]) => addBush(m, x, y, f));
    addTree(m, 1380, 800, 'pink');
    addTree(m, 1840, 800, 'mai');
    sobj(m, 2030, 790, (c) => ART.mailbox(c, 2030, 790));
    sobj(m, 1255, 690, (c) => ART.scarecrow(c, 1255, 690), { l: -45, t: -100, w: 90, h: 106 });
    col(m, 1249, 684, 12, 8);
    for (let y = 420; y <= 840; y += 30) {
      sobj(m, 0, y, (c) => ART.roseHedge(c, 6, 66, y), { l: -10, t: -40, w: 90, h: 44 });
      sobj(m, 2130, y, (c) => ART.roseHedge(c, 2136, 2196, y), { l: -10, t: -40, w: 90, h: 44 });
    }
    col(m, 2023, 782, 14, 10);

    addBusStop(m, 1000, 862);
    sobj(m, 0, HZ + 20, (c) => { ART.woodFence(c, 0, m.w, HZ + 2); ART.roseHedge(c, 0, m.w, HZ + 22); }, { l: -10, t: -72, w: m.w + 20, h: 78 });
    sobj(m, 0, 1050, (c) => ART.roseHedge(c, 0, m.w, 1050), { l: -10, t: -44, w: m.w + 20, h: 48 });
    m.spawn = { x: 1000, y: 660 };
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
    inter(m, { x: 340, y: 350, w: 220, h: 172, ax: 450, ay: 552, name: 'Chợ (mua hạt, bán nông sản)', use: () => UI.shop(), arrow: { x: 450, y: 470, text: 'Mua bán' } });

    sobj(m, 1000, 520, (c) => ART.boutique(c, 1000, 520));
    col(m, 875, 440, 250, 82);
    inter(m, { x: 870, y: 340, w: 260, h: 182, ax: 1000, ay: 552, name: 'Tiệm Thời Trang', use: () => UI.boutique(), arrow: { x: 1000, y: 445 } });

    const petShop = { w: 240, wall: '#e6fcf5', roof: '#20c997', awning: '#0ca678', sign: '🐶 THÚ CƯNG', icons: ['🐕', '🐈'], door: '#087f5b' };
    sobj(m, 1550, 520, (c) => ART.building(c, 1550, 520, petShop));
    col(m, 1430, 440, 240, 82);
    inter(m, { x: 1420, y: 340, w: 260, h: 182, ax: 1550, ay: 552, name: 'Tiệm Thú Cưng', use: () => UI.petShop(), arrow: { x: 1550, y: 445 } });

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

    sobj(m, 1150, 560, (c) => ART.blackboard(c, 1150, 560), { l: -190, t: -245, w: 380, h: 252 });
    col(m, 975, 540, 350, 22);
    m.board = { x: 1150, y: 560 };
    inter(m, { x: 970, y: 320, w: 360, h: 240, ax: 1150, ay: 600, name: 'Bảng đố vui (gõ đáp án vào khung chat)', use: () => AV.quizHelp() });

    sobj(m, 1430, 645, (c) => ART.podium(c, 1430, 645), { l: -80, t: -30, w: 160, h: 36 });
    npc(m, 'Cô giáo Hoa', { skin: '#f8c9a2', hair: 'long', hairColor: '#2b2b33', shirt: '#f8f9fa', shirtStyle: 'plain', pants: '#4c6ef5', hat: 'none' }, { l: 1415, t: 628, r: 1445, b: 640 }, 1430, 634);
    const teacher = m.npcs[m.npcs.length - 1];
    teacher.teacher = true;
    teacher.nextTalk = 1e9;

    for (const y of [720, 800]) for (const x of [900, 1020, 1140, 1260, 1380]) {
      sobj(m, x, y, (c) => ART.desk(c, x, y), { l: -40, t: -46, w: 80, h: 50 });
      col(m, x - 34, y - 12, 68, 14);
    }
    [[220, 790], [1780, 790], [1700, 420]].forEach(([x, y], i) => addBush(m, x, y, FLOWERS[i % 4]));
    m.labels.push({ text: '🏫 Trường Học', x: 1000, y: 318 });

    npc(m, 'Bé Tí', { skin: '#ffe0c4', hair: 'short', hairColor: '#6b3e26', shirt: '#4c6ef5', shirtStyle: 'plain', pants: '#343a40', hat: 'cap' }, { l: 200, t: 640, r: 850, b: 830 }, 400, 720);
    npc(m, 'Bé Mơ', { skin: '#f8c9a2', hair: 'pigtails', hairColor: '#2b2b33', shirt: '#e64980', shirtStyle: 'heart', pants: '#dee2e6', hat: 'bow' }, { l: 200, t: 640, r: 850, b: 830 }, 700, 780);

    street(m);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  }

  return { farm, town, mall, fun, park, beach, school };
})();
