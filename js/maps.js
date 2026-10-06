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
  const sobj = (m, x, y, draw, box = FX.BOX.object, sortY = y) => m.objects.push({ y: sortY, draw: FX.sprite(draw, x, y, box), bb: bbOf(x, y, box) });
  /** Đồ vật chuyển động: vẽ lại mỗi khung hình, có viền */
  const aobj = (m, x, y, draw, box) => { const key = {}; m.objects.push({ y, draw: (ctx, t) => FX.drawCached(ctx, key, (c) => draw(c, t), x, y, box, 90), bb: bbOf(x, y, box) }); };
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

  function street(m) {
    addBusStop(m, 1000, 862);
    addStreetSign(m, 600, 860);
    addStreetSign(m, m.w - 320, 860, [...STREETS].reverse());
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
    const m = base('farm', 'Nông trại', 5400, 1600);
    m.busY = 1555;
    m.lights = [];
    const WL = 140, WR = 5260, WT = 420, WB = 1300, GATE = 1600;
    const BL = {
      field: [180, 450, 2080, 385], home: [2300, 450, 780, 330],
      pasture: [180, 860, 840, 400], pond: [1100, 860, 400, 400], coop: [1700, 860, 330, 400], garden: [2090, 860, 660, 400], nook: [2810, 860, 270, 400],
      play: [3120, 450, 600, 810],
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
    sobj(m, GATE, WB + 2, (c) => ART.farmGate(c, GATE, WB + 2), { l: -170, t: -225, w: 340, h: 240 });
    m.labels.push({ text: '', x: GATE, y: WB - 232, dynamic: 'gate' });
    for (let x = WL; x <= WR; x += 220) m.lights.push([x + 26, WT - 62, 42]);
    m.lights.push([GATE - 60, WB - 126, 46], [GATE + 60, WB - 126, 46]);

    /* ----- Khu trồng trọt: 18 luống liền nhau (3 hàng × 6). Đất chưa mua chỉ có biển "Mua đất" ----- */
    m.labels.push({ text: '🌾 Khu Trồng Trọt', x: 1220, y: 442 });
    const BD = ART.BED;
    /** Vẽ 1 luống + 12 ô bấm được */
    const addBed = (bedIdx, bx, by, tileName) => {
      obj(m, by + BD.h - 25, (ctx, t) => {
        const tiles = AV.F().tiles.slice(bedIdx * 12, bedIdx * 12 + 12).map((x) => ({ crop: x.crop, st: AV.tileState(x), wet: x.watered, fert: x.fert, stolen: x.stolen }));
        ART.bed(ctx, bx, by, AV.F().beds[bedIdx], DATA.BED_PRICES[bedIdx], tiles, t);
      }, [bx - 10, by - 70, bx + BD.w + 10, by + BD.h + 20]);
      for (let k = 0; k < 12; k++) {
        const i = bedIdx * 12 + k;
        const tx = bx + BD.padX + (k % 6) * BD.step, ty = by + BD.padY + Math.floor(k / 6) * BD.step;
        inter(m, {
          x: tx - 2, y: ty - 2, w: BD.tile + 4, h: BD.tile + 4, ax: tx + BD.tile / 2, ay: by + BD.h + 8, name: tileName,
          use: () => AV.useTile(i), indicator: k === 0 ? () => AV.bedIndicator(bedIdx) : null, ix: bx + BD.w / 2, iy: by - 2,
        });
      }
    };
    const FX0 = 180 + (2080 - (BD.w * 6 + 40 * 5)) / 2, FY0 = 466, FSTEP = BD.h + 12;
    // thứ tự luống giữ nguyên số luống cũ (0–7 ruộng chính, 12–19 đất mở rộng, 20–21 đất mới) để không mất cây đang trồng
    [0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].forEach((bedIdx, slot) => addBed(bedIdx, FX0 + (slot % 6) * (BD.w + 40), FY0 + Math.floor(slot / 6) * FSTEP, 'Ô ruộng'));

    /* ----- Nhà + cửa hàng + bếp nằm cạnh nhau ----- */
    const SX = 2400, SY = 742;
    sobj(m, SX, SY, (c) => { c.save(); c.translate(SX, SY); c.scale(0.82, 0.82); ART.seedStall(c, 0, 0); c.restore(); }, { l: -95, t: -150, w: 190, h: 160 });
    col(m, SX - 78, SY - 38, 156, 36);
    inter(m, { x: SX - 88, y: SY - 140, w: 176, h: 140, ax: SX, ay: SY + 26, name: 'Cửa hàng nông trại (mua hạt giống, phân bón, thuốc · bán đồ)', use: () => UI.seedShop(), arrow: { x: SX, y: SY - 144, text: 'Cửa hàng' } });
    const HX = 2650, KX = 2960;
    sobj(m, HX, 720, (c) => ART.house(c, HX, 720));
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
    sobj(m, 470, 1215, (c) => ART.hayStack(c, 470, 1215));
    sobj(m, 650, 960, (c) => ART.hayBale(c, 650, 960));
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
    m.labels.push({ text: '🐄 Chuồng Bò', x: 360, y: 852 }, { text: '🐑 Chuồng Cừu', x: 650, y: 852 }, { text: '🐖 Chuồng Heo', x: 890, y: 852 });
    // bấm bất kỳ đâu trong từng chuồng = cho ăn / thu hoạch chuồng đó
    [['cow', 200, 520, 'Chuồng bò (cho ăn / vắt sữa)', 360, 1080], ['sheep', 540, 760, 'Chuồng cừu (cho ăn / cắt len)', 650, 905], ['pig', 780, 1000, 'Chuồng heo (đổ cám / thu thịt)', 890, 830]].forEach(([kind, L, R, name, ix, iy]) => {
      const cx = (L + R) / 2;
      inter(m, { x: L, y: 884, w: R - L, h: 356, ax: cx, ay: 1272, name, use: () => AV.usePen(kind), group: kind, approaches: [[cx, 1272], [cx, 862]], indicator: () => AV.penIndicator(kind), ix, iy });
    });
    inter(m, { x: 220, y: 860, w: 240, h: 190, ax: 360, ay: 1272, name: 'Chuồng bò (cho ăn / vắt sữa)', arrow: { x: 340, y: 935 }, group: 'cow', approaches: [[360, 1272], [360, 862]], use: () => AV.usePen('cow') });

    /* ----- Ao cá + sân gà thả rông cạnh ao ----- */
    m.lake = { x: 1300, y: 1060, rx: 180, ry: 110 };
    obj(m, 950, (ctx, t) => ART.lake(ctx, 1300, 1060, 180, 110, t));
    col(m, 1140, 970, 320, 180);
    m.labels.push({ text: '🎣 Ao Cá', x: 1300, y: 900 }, { text: '🐔 Sân Gà', x: 1865, y: 900 });
    addBench(m, 1180, 1255);
    // bảng tin: ai đến trộm, có bị cắn / phạt không, ai tưới giúp
    sobj(m, 1400, 1250, (c) => ART.noticeBoard(c, 1400, 1250), { l: -72, t: -172, w: 144, h: 178 });
    col(m, 1350, 1240, 100, 12);
    inter(m, { x: 1334, y: 1084, w: 132, h: 170, ax: 1400, ay: 1282, name: 'Bảng tin nông trại (ai đến trộm, ai tưới giúp)', use: () => AV.useNoticeBoard(), indicator: () => AV.noticeIndicator(), ix: 1400, iy: 1072 });
    sobj(m, 1865, 1060, (c) => ART.henNest(c, 1865, 1060), { l: -80, t: -78, w: 160, h: 88 });
    col(m, 1805, 1042, 120, 20);
    sobj(m, 1975, 980, (c) => ART.hayBale(c, 1975, 980));
    sobj(m, 1760, 1215, (c) => ART.hayStack(c, 1760, 1215));
    for (let i = 0; i < 5; i++) animal(m, 'chicken', { l: 1720, t: 930, r: 2010, b: 1240 }, i);
    for (let i = 5; i < 9; i++) animal(m, 'chicken', { l: 240, t: 834, r: 2280, b: 860 }, i);
    inter(m, {
      x: 1790, y: 980, w: 150, h: 90, ax: 1865, ay: 1092, name: 'Ổ rơm (cho gà ăn / nhặt trứng)', arrow: { x: 1865, y: 976 }, group: 'coop',
      use: () => AV.useCoop(), indicator: () => AV.coopIndicator(), ix: 1865, iy: 965,
    });

    /* ----- Vườn hoa ngay dưới ruộng (2 × 2 luống hoa) ----- */
    m.labels.push({ text: '🌸 Vườn Hoa', x: 2420, y: 900 });
    const GX = 2090 + (660 - (BD.w * 2 + 40)) / 2, GY = 945;
    for (let k = 0; k < DATA.FLOWER_BEDS; k++) addBed(DATA.FIELD_BEDS + k, GX + (k % 2) * (BD.w + 40), GY + Math.floor(k / 2) * FSTEP, 'Ô trồng hoa');

    /* ----- Góc nhỏ: bù nhìn, ghế, bụi hoa ----- */
    sobj(m, 2945, 1040, (c) => ART.scarecrow(c, 2945, 1040), { l: -45, t: -100, w: 90, h: 106 });
    addBench(m, 2945, 1200);
    addBush(m, 2860, 960, '#ff8fab'); addBush(m, 3035, 960, '#ffd43b'); addPot(m, 2860, 1230, 'mai'); addPot(m, 3035, 1230, 'dao');

    /* ----- Vườn cây ăn quả (khu bên phải, 2 hàng) ----- */
    AV._treePos = [];
    DATA.ORCHARD.forEach((_, i) => {
      const row = i < 8 ? 0 : 1, k = row ? i - 8 : i;
      const x = 3895 + k * 168 + row * 84, y = row ? 772 : 640;
      const fr = DATA.FRUITS[DATA.ORCHARD[i]];
      AV._treePos[i] = [x, y];
      addTree(m, x, y, fr === DATA.FRUITS.peach ? 'pink' : 'green');
      obj(m, y + 1, (ctx, t) => { const st = AV.treeState(i); ART.treeFruits(ctx, x, y, fr.color, st.p, st.ripe, t); });
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
    sobj(m, 4560, 960, (c) => ART.hayBale(c, 4560, 960));
    [[4760, 1000, 'green'], [5080, 960, 'fruit'], [4980, 1230, 'pink'], [3880, 1230, 'green']].forEach(([x, y, v]) => addTree(m, x, y, v));
    addBush(m, 4420, 1245, '#ff8fab'); addBush(m, 4660, 1250, '#ffd43b');
    addBench(m, 4820, 1180);
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
    [[3760, 1400, 'fruit'], [4300, 1395, 'green'], [4800, 1400, 'pink'], [5250, 1395, 'fruit']].forEach(([x, y, v]) => addTree(m, x, y, v));
    /* ----- Phố ẩm thực trước cổng: cơm, phở, bún bò, mì cay | trà sữa, cà phê ----- */
    m.labels.push({ text: '🍜 Phố Ẩm Thực', x: 620, y: 1250 }, { text: '☕ Trà Sữa · Cà Phê', x: 2780, y: 1250 });
    DATA.EATERIES.forEach((e, i) => {
      const x = i < 4 ? 260 + i * 240 : 2420 + (i - 4) * 240, y = 1425;
      sobj(m, x, y, (c) => ART.foodShop(c, x, y, e), { l: -125, t: -165, w: 260, h: 172 });
      col(m, x - 105, y - 46, 210, 44);
      inter(m, { x: x - 105, y: y - 160, w: 210, h: 160, ax: x - 40, ay: y + 28, name: `${e.name} (ăn uống +XP)`, use: () => UI.eateryPanel(e.id) });
    });
    addPot(m, 1450, 1360, 'mai'); addPot(m, 1750, 1360, 'dao');
    sobj(m, 2160, 1385, (c) => ART.signBoard(c, 2160, 1385, 'NÔNG TRẠI\nCửa hàng cạnh\nnhà bếp 🌱'));
    col(m, 2122, 1375, 80, 12);
    addBusStop(m, GATE + 140, 1432, 1);
    addStreetSign(m, GATE - 360, 1430);
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
    addPot(m, CX - 130, CY + 40, 'mai'); addPot(m, CX + 130, CY + 40, 'dao');

    npc(m, 'Bé Bin', { skin: '#ffe0c4', hair: 'spiky', hairColor: '#c68642', shirt: '#fd7e14', shirtStyle: 'star', pants: '#364fc7', hat: 'beanie' }, { l: 200, t: 700, r: 1800, b: 830 }, 1000, 760, 'chick');

    street(m);
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
    furn(110, 330, (c) => ART.bookshelf(c, 110, 330), { l: -56, t: -160, w: 112, h: 166 }, 96, 24,
      { x: 55, y: 170, w: 112, h: 165, name: 'Giá sách (xem catalog đồ nội thất)', use: () => UI.furnitureShop(), ay: 360, arrow: { x: 110, y: 160, text: 'Mua nội thất' } });
    furn(740, 320, (c) => ART.plantPot(c, 740, 320), { l: -30, t: -95, w: 60, h: 100 }, 34, 14);

    // Nhà bếp
    furn(1100, 330, (c) => ART.kitchenCounter(c, 880, 330, 420), { l: -230, t: -160, w: 460, h: 166 }, 430, 30,
      { x: 880, y: 170, w: 420, h: 165, name: 'Bếp nấu (nấu món ăn)', use: () => UI.kitchen(), ay: 360 });
    furn(1460, 340, (c) => ART.fridge(c, 1460, 340), { l: -46, t: -170, w: 92, h: 176 }, 74, 30,
      { x: 1420, y: 175, w: 80, h: 165, name: 'Tủ lạnh (xem đồ ăn)', use: () => UI.inventory(), ay: 370 });
    // bàn ăn tách 2 lớp: ghế sau → người ngồi → mặt bàn + ghế trước
    sobj(m, 1180, 520, (c) => ART.diningPart(c, 1180, 520, 'back'), { l: -100, t: -80, w: 200, h: 40 }, 470);
    sobj(m, 1180, 520, (c) => ART.diningPart(c, 1180, 520, 'front'), { l: -110, t: -60, w: 220, h: 92 });
    col(m, 1085, 470, 190, 50);
    inter(m, { x: 1080, y: 440, w: 200, h: 110, ax: 1180, ay: 565, name: 'Bàn ăn (ngồi ăn cơm)', use: () => AV.sitTable() });

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
    const own = (id, x, y, draw, box, cw, ch, it, opt = {}) => {
      const has = () => AV.hasFurn(id);
      const bb = [x + box.l, y + box.t, x + box.l + box.w, y + box.t + box.h];
      if (opt.anim) { const key = {}; m.objects.push({ y: opt.sortY ?? y, bb, draw: (ctx, t) => { if (has()) FX.drawCached(ctx, key, (c) => draw(c, t), x, y, box, 90); } }); }
      else if (opt.flat) m.objects.push({ y: opt.sortY ?? y, bb, draw: (ctx) => { if (has()) draw(ctx); } });
      else { const spr = FX.sprite(draw, x, y, box); m.objects.push({ y: opt.sortY ?? y, bb, draw: (ctx) => { if (has()) spr(ctx); } }); }
      if (cw) m.colliders.push({ x: x - cw / 2, y: y - ch, w: cw, h: ch, when: has });
      if (it) inter(m, { ax: x, ay: y + 30, ...it, when: has });
    };
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

  const all = { farm, town, mall, fun, casino, arena, horse, park, beach, school, classroom, home, race };
  Object.keys(all).forEach((k) => { const fn = all[k]; all[k] = () => { const m = fn(); halloween(m); return m; }; });
  return all;
})();
