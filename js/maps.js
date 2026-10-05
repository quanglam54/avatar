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

  /* ---------- Nông trại mở rộng: tường bao, cổng, 8 luống, khu gà, khu bò cừu, ao, vườn ---------- */
  function farm() {
    const m = base('farm', 'Nông trại', 3900, 1600);
    m.busY = 1555;
    m.lights = [];
    const WL = 140, WR = 3760, WT = 420, WB = 1300, GATE = 1600;
    const BL = {
      chick: [180, 450, 600, 330], field: [860, 450, 1400, 330], home: [2340, 450, 700, 330],
      pasture: [180, 860, 840, 400], pond: [1100, 860, 440, 400], orchard: [1660, 860, 680, 400], garden: [2420, 860, 620, 400],
      play: [3120, 450, 600, 810],
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
    sobj(m, GATE, WB + 2, (c) => ART.farmGate(c, GATE, WB + 2), { l: -170, t: -225, w: 340, h: 240 });
    m.labels.push({ text: '', x: GATE, y: WB - 232, dynamic: 'gate' });
    for (let x = WL; x <= WR; x += 220) m.lights.push([x + 26, WT - 62, 42]);
    m.lights.push([GATE - 60, WB - 126, 46], [GATE + 60, WB - 126, 46]);

    /* ----- Khu gà: rào trắng + chuồng mái tôn ----- */
    picketPen(m, 200, 472, 760, 760);
    sobj(m, 330, 640, (c) => ART.shed(c, 330, 640));
    col(m, 230, 598, 200, 44);
    sobj(m, 700, 540, (c) => ART.hayBale(c, 700, 540));
    for (let i = 0; i < 8; i++) animal(m, 'chicken', { l: 450, t: 520, r: 735, b: 742 }, i);
    m.labels.push({ text: '🐔 Khu Gà', x: 480, y: 442 });
    inter(m, {
      x: 220, y: 480, w: 230, h: 170, ax: 330, ay: 795, name: 'Chuồng gà (cho ăn / nhặt trứng)', arrow: { x: 330, y: 585 }, group: 'coop', approaches: [[330, 795], [790, 620]],
      use: () => AV.useCoop(), indicator: () => AV.coopIndicator(), ix: 330, iy: 470,
    });

    /* ----- Khu trồng trọt: 8 luống ----- */
    m.labels.push({ text: '🌾 Khu Trồng Trọt', x: 1560, y: 442 });
    const BD = ART.BED;
    const fx0 = 860 + (1400 - (BD.w * 4 + 40 * 3)) / 2;
    for (let bedIdx = 0; bedIdx < 8; bedIdx++) {
      const bx = fx0 + (bedIdx % 4) * (BD.w + 40), by = 478 + Math.floor(bedIdx / 4) * (BD.h + 21);
      obj(m, by + BD.h - 25, (ctx, t) => {
        const tiles = AV.F().tiles.slice(bedIdx * 12, bedIdx * 12 + 12).map((x) => ({ crop: x.crop, st: AV.tileState(x), wet: x.watered, fert: x.fert }));
        ART.bed(ctx, bx, by, AV.F().beds[bedIdx], DATA.BED_PRICES[bedIdx], tiles, t);
      });
      for (let k = 0; k < 12; k++) {
        const i = bedIdx * 12 + k;
        const tx = bx + BD.padX + (k % 6) * BD.step, ty = by + BD.padY + Math.floor(k / 6) * BD.step;
        inter(m, {
          x: tx - 2, y: ty - 2, w: BD.tile + 4, h: BD.tile + 4, ax: tx + BD.tile / 2, ay: by + BD.h + 8, name: 'Ô ruộng',
          use: () => AV.useTile(i), indicator: k === 0 ? () => AV.bedIndicator(bedIdx) : null, ix: bx + BD.w / 2, iy: by - 2,
        });
      }
    }
    sobj(m, 2235, 700, (c) => ART.scarecrow(c, 2235, 700), { l: -45, t: -100, w: 90, h: 106 });

    /* ----- Nhà + bếp ----- */
    sobj(m, 2520, 720, (c) => ART.house(c, 2520, 720));
    col(m, 2418, 620, 204, 100);
    inter(m, { x: 2415, y: 540, w: 210, h: 180, ax: 2520, ay: 748, name: 'Nhà của bạn (vào nhà)', use: () => AV.enterHome(), arrow: { x: 2520, y: 635 } });
    m.labels.push({ text: '', x: 2520, y: 504, dynamic: 'home' });
    sobj(m, 2870, 720, (c) => ART.kitchen(c, 2870, 720));
    col(m, 2762, 672, 216, 50);
    inter(m, { x: 2745, y: 540, w: 250, h: 182, ax: 2870, ay: 748, name: 'Nhà bếp (nấu món ăn)', use: () => UI.kitchen(), arrow: { x: 2920, y: 640 } });
    sobj(m, 2380, 740, (c) => ART.mailbox(c, 2380, 740));
    col(m, 2373, 732, 14, 10);

    /* ----- Khu bò cừu: đồng cỏ rào gỗ + chuồng đỏ ----- */
    woodPen(m, 200, 884, 1000, 1240);
    sobj(m, 340, 1040, (c) => ART.barn(c, 340, 1040), { l: -140, t: -200, w: 280, h: 214 });
    col(m, 228, 990, 224, 52);
    sobj(m, 880, 960, (c) => ART.trough(c, 880, 960), { l: -50, t: -30, w: 100, h: 36 });
    col(m, 840, 944, 80, 18);
    sobj(m, 300, 1200, (c) => ART.hayStack(c, 300, 1200));
    for (const [k, seed] of [['cow', 7], ['cow', 21], ['cow', 33], ['sheep', 3], ['sheep', 9], ['sheep', 15], ['pig', 5], ['pig', 11]]) {
      animal(m, k, { l: 500, t: 960, r: 960, b: 1222 }, seed);
    }
    m.labels.push({ text: '🐄 Khu Bò Cừu', x: 600, y: 852 });
    // bấm bất kỳ đâu trong đồng cỏ / sân gà cũng thu hoạch được
    inter(m, { x: 200, y: 884, w: 800, h: 356, ax: 600, ay: 1272, name: 'Đồng cỏ bò cừu (cho ăn / thu sữa, len, thịt)', use: () => AV.usePen(), group: 'pen', approaches: [[600, 1272], [600, 862], [1030, 1060]] });
    inter(m, { x: 200, y: 472, w: 560, h: 288, ax: 330, ay: 795, name: 'Sân gà (cho ăn / nhặt trứng)', use: () => AV.useCoop(), group: 'coop', approaches: [[330, 795], [790, 620]] });
    inter(m, {
      x: 220, y: 860, w: 260, h: 190, ax: 600, ay: 1272, name: 'Chuồng bò cừu (cho ăn / thu sữa, len, thịt)', arrow: { x: 340, y: 935 }, group: 'pen', approaches: [[600, 1272], [600, 862], [1030, 1060]],
      use: () => AV.usePen(), indicator: () => AV.penIndicator(), ix: 600, iy: 930,
    });

    /* ----- Ao cá (câu được cá) ----- */
    m.lake = { x: 1320, y: 1060, rx: 180, ry: 110 };
    obj(m, 950, (ctx, t) => ART.lake(ctx, 1320, 1060, 180, 110, t));
    col(m, 1160, 970, 320, 180);
    m.labels.push({ text: '🎣 Ao Cá', x: 1320, y: 900 });
    addBench(m, 1200, 1255);

    /* ----- Vườn cây ăn quả ----- */
    AV._treePos = [];
    [960, 1110, 1250].forEach((y, row) => [1730, 1870, 2010, 2150, 2290].forEach((x0, k) => {
      const i = row * 5 + k, x = x0 + (row % 2) * 30;
      const fr = DATA.FRUITS[DATA.ORCHARD[i]];
      AV._treePos[i] = [x, y];
      addTree(m, x, y, fr === DATA.FRUITS.peach ? 'pink' : 'green');
      obj(m, y + 1, (ctx, t) => { const st = AV.treeState(i); ART.treeFruits(ctx, x, y, fr.color, st.p, st.ripe, t); });
      inter(m, {
        x: x - 62, y: y - 180, w: 124, h: 186, ax: x, ay: y + 30, name: `Cây ${fr.name.toLowerCase()} (hái quả)`,
        use: () => AV.useTree(i), indicator: () => AV.treeIndicator(i), ix: x, iy: y - 186,
      });
    }));
    m.labels.push({ text: '🍊 Vườn Cây', x: 2000, y: 852 });

    /* ----- Vườn hoa + cối xay gió ----- */
    /* 4 luống hoa (luống số 9–12) trồng được: cúc, tulip, hướng dương, dâm bụt, hồng */
    m.labels.push({ text: '🌼 Vườn Hoa', x: 2730, y: 852 });
    const BDf = ART.BED;
    for (let k = 0; k < 4; k++) {
      const bedIdx = 8 + k;
      const bx = 2420 + 6 + (k % 2) * (BDf.w + 6), by = 890 + Math.floor(k / 2) * (BDf.h + 40);
      obj(m, by + BDf.h - 25, (ctx, t) => {
        const tiles = AV.F().tiles.slice(bedIdx * 12, bedIdx * 12 + 12).map((x) => ({ crop: x.crop, st: AV.tileState(x), wet: x.watered, fert: x.fert }));
        ART.bed(ctx, bx, by, AV.F().beds[bedIdx], DATA.BED_PRICES[bedIdx], tiles, t);
      });
      for (let j = 0; j < 12; j++) {
        const i = bedIdx * 12 + j;
        const tx = bx + BDf.padX + (j % 6) * BDf.step, ty = by + BDf.padY + Math.floor(j / 6) * BDf.step;
        inter(m, {
          x: tx - 2, y: ty - 2, w: BDf.tile + 4, h: BDf.tile + 4, ax: tx + BDf.tile / 2, ay: by + BDf.h + 8, name: 'Ô trồng hoa',
          use: () => AV.useTile(i), indicator: j === 0 ? () => AV.bedIndicator(bedIdx) : null, ix: bx + BDf.w / 2, iy: by - 2,
        });
      }
    }

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
    sobj(m, 3420, 1000, (c) => ART.gazebo(c, 3420, 1000), { l: -125, t: -210, w: 250, h: 222 });
    col(m, 3320, 975, 200, 34);
    inter(m, { x: 3320, y: 820, w: 200, h: 180, ax: 3420, ay: 1040, name: 'Vọng lâu (ngồi nghỉ)', use: () => AV.restGazebo() });
    aobj(m, 3640, 1240, (c, t) => ART.windmill(c, 3640, 1240, t), { l: -100, t: -275, w: 200, h: 282 });
    col(m, 3606, 1225, 68, 18);
    addBench(m, 3200, 1180);
    addTree(m, 3175, 560, 'pink');
    [[3700, 560, 'mai'], [3180, 900, 'dao']].forEach(([x, y, k]) => addPot(m, x, y, k));
    addBush(m, 3460, 1240, '#ff8fab');
    addLamp(m, 3420, 760); m.lights.push([3396, 648, 58], [3444, 648, 58]);

    /* ----- Đèn đường dọc lối đi (sáng về đêm) ----- */
    [[820, 830], [1600, 830], [2300, 830], [1520, 1280], [1680, 1280], [1060, 1270], [2380, 1270]].forEach(([x, y]) => {
      addLamp(m, x, y);
      m.lights.push([x - 24, y - 112, 58], [x + 24, y - 112, 58]);
    });

    /* ----- Bên ngoài cổng ----- */
    [[300, 1395, 'green'], [820, 1400, 'pink'], [2380, 1395, 'fruit'], [2900, 1400, 'green'], [3420, 1395, 'pink'], [3760, 1400, 'fruit']].forEach(([x, y, v]) => addTree(m, x, y, v));
    addPot(m, 1450, 1360, 'mai'); addPot(m, 1750, 1360, 'dao');
    sobj(m, 1880, 1385, (c) => ART.signBoard(c, 1880, 1385, 'NÔNG TRẠI\nVào cổng để\ntrồng trọt 🌱'));
    col(m, 1842, 1375, 80, 12);
    addBusStop(m, GATE + 140, 1432);
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

    street(m);
    m.spawn = { x: 1050, y: 875 };
    m.bounds = { l: 20, t: 380, r: m.w - 20, b: m.h - 40 };
    return m;
  };

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
    const m = base('fun', 'Khu giải trí', 2700, 1070);
    ground(m, (g) => {
      paintGrass(g, m.w, m.h, 53);
      paintPaved(g, 120, 370, 2460, 460, '#f6e3d0');
      g.fillStyle = 'rgba(112,72,232,.12)'; g.beginPath(); g.roundRect(1960, 420, 600, 340, 30); g.fill();
      paintStreet(g, m.w, 870, 1000);
    });

    sobj(m, 400, 640, (c) => ART.gameTable(c, 400, 640, 'baucua', 0));
    col(m, 300, 590, 200, 50);
    inter(m, { x: 290, y: 520, w: 220, h: 140, ax: 400, ay: 690, name: 'Bàn Bầu Cua', use: () => UI.bauCua() });

    sobj(m, 760, 640, (c) => ART.gameTable(c, 760, 640, 'baicao', 0));
    col(m, 660, 590, 200, 50);
    inter(m, { x: 630, y: 520, w: 260, h: 170, ax: 760, ay: 700, name: 'Bàn Tiến lên (ngồi chơi với mọi người)', use: () => TABLE.openView(), arrow: { x: 760, y: 505, text: 'Chơi bài' } });

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
    m.labels.push({ text: '🕹️ Khu Game', x: 2265, y: 402 });
    DATA.ARCADE.forEach((g, i) => {
      const x = 2040 + i * 150, y = 620;
      aobj(m, x, y, (c, t) => ART.arcadeCabinet(c, x, y, g.color, g.name, g.icon, t), { l: -50, t: -158, w: 100, h: 166 });
      col(m, x - 38, y - 14, 76, 16);
      inter(m, { x: x - 40, y: y - 150, w: 80, h: 152, ax: x, ay: y + 30, name: `Máy game ${g.name}`, use: () => UI.arcade(g.id), arrow: { x, y: y - 160, text: 'Chơi' } });
    });
    addLamp(m, 1960, 760); addLamp(m, 2560, 760);
    addBench(m, 2260, 760);

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

  /* ---------- Bên trong nhà: phòng khách, bếp, phòng ngủ, sảnh, phòng tắm, kho ---------- */
  function home() {
    const m = base('home', 'Nhà của bạn', 1600, 1000);
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
    });

    // tường ngăn phòng (có cửa thông)
    const wallH = (x1, x2, y) => { sobj(m, x1, y, (c) => ART.innerWallH(c, x1, x2, y), { l: -10, t: -70, w: x2 - x1 + 20, h: 74 }); col(m, x1, y - 14, x2 - x1, 16); };
    const wallV = (x, y1, y2) => { sobj(m, x, y2, (c) => ART.innerWallV(c, x, y1, y2), { l: -16, t: y1 - y2 - 70, w: 32, h: y2 - y1 + 74 }); col(m, x - 10, y1, 20, y2 - y1); };
    [[40, 260], [340, 640], [720, 880], [960, 1380], [1460, 1560]].forEach(([a, b]) => wallH(a, b, 580));
    wallV(800, 240, 380); wallV(800, 460, 580);
    [560, 1040, 1300].forEach((x) => { wallV(x, 580, 730); wallV(x, 810, 960); });

    const lab = (t, x, y) => m.labels.push({ text: t, x, y });
    lab('🛋️ Phòng khách', 420, 262); lab('🍳 Nhà bếp', 1180, 262); lab('🛏️ Phòng ngủ', 300, 602);
    lab('🚪 Sảnh', 800, 602); lab('🛁 Phòng tắm', 1170, 602); lab('📦 Kho đồ', 1430, 602);
    const furn = (x, y, draw, box, cw, ch, it) => {
      sobj(m, x, y, draw, box);
      if (cw) col(m, x - cw / 2, y - ch, cw, ch);
      if (it) inter(m, { ax: x, ay: y + 26, ...it });
    };

    // Phòng khách
    furn(420, 300, (c) => ART.tvSet(c, 420, 300, 0), { l: -110, t: -145, w: 220, h: 152 }, 190, 30,
      { x: 330, y: 160, w: 180, h: 145, name: 'TV (xem TV thư giãn)', use: () => AV.watchTV(), ay: 340 });
    furn(420, 425, (c) => ART.coffeeTable(c, 420, 425), { l: -70, t: -55, w: 140, h: 62 }, 110, 26);
    furn(420, 520, (c) => ART.sofa(c, 420, 520, '#4c6ef5'), { l: -125, t: -85, w: 250, h: 92 }, 230, 36,
      { x: 300, y: 440, w: 240, h: 85, name: 'Sofa (ngồi xem TV)', use: () => AV.watchTV(), ax: 575, ay: 500 });
    furn(110, 330, (c) => ART.bookshelf(c, 110, 330), { l: -56, t: -160, w: 112, h: 166 }, 96, 24);
    furn(740, 320, (c) => ART.plantPot(c, 740, 320), { l: -30, t: -95, w: 60, h: 100 }, 34, 14);

    // Nhà bếp
    furn(1100, 330, (c) => ART.kitchenCounter(c, 880, 330, 420), { l: -230, t: -160, w: 460, h: 166 }, 430, 30,
      { x: 880, y: 170, w: 420, h: 165, name: 'Bếp nấu (nấu món ăn)', use: () => UI.kitchen(), ay: 360 });
    furn(1460, 340, (c) => ART.fridge(c, 1460, 340), { l: -46, t: -170, w: 92, h: 176 }, 74, 30,
      { x: 1420, y: 175, w: 80, h: 165, name: 'Tủ lạnh (xem đồ ăn)', use: () => UI.inventory(), ay: 370 });
    furn(1180, 520, (c) => ART.diningTable(c, 1180, 520), { l: -110, t: -92, w: 220, h: 118 }, 190, 50);

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

    // Cửa ra ngoài
    sobj(m, 800, 962, (c) => ART.homeDoor(c, 800, 962), { l: -50, t: -22, w: 100, h: 28 });
    inter(m, { x: 740, y: 900, w: 120, h: 70, ax: 800, ay: 930, name: 'Ra ngoài nông trại', use: () => AV.leaveHome(), arrow: { x: 800, y: 905, text: 'Ra ngoài' } });

    m.spawn = { x: 800, y: 900 };
    m.bounds = { l: 56, t: 262, r: m.w - 56, b: 940 };
    return m;
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
    inter(m, { x: 1180, y: 650, w: 280, h: 185, ax: 1320, ay: 850, name: 'Cổng xuất phát (vào đua)', use: () => RACE.open(), arrow: { x: 1320, y: 705, text: 'Đua xe' } });

    const garage = { w: 240, wall: '#e7f5ff', roof: '#1971c2', awning: '#1864ab', sign: '🔧 GARA XE', icons: ['🏎️', '🔧'], door: '#495057' };
    sobj(m, 300, 560, (c) => ART.building(c, 300, 560, garage));
    col(m, 180, 480, 240, 82);
    inter(m, { x: 170, y: 380, w: 260, h: 182, ax: 300, ay: 592, name: 'Gara xe (mua xe)', use: () => UI.garage(), arrow: { x: 300, y: 485 } });

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

  const all = { farm, town, mall, fun, park, beach, school, home, race };
  Object.keys(all).forEach((k) => { const fn = all[k]; all[k] = () => { const m = fn(); halloween(m); return m; }; });
  return all;
})();
