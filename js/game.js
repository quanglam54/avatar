/* Vòng lặp game, điều khiển, tương tác, lưu tiến trình */
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const SAVE_KEY = 'avatar_farm_save_v1';
  const SPEED = 175;
  const BUS_Y = 985;
  let W = 0, H = 0, DPR = 1, ZOOM = 1;

  /* ---------- Tiến trình ---------- */
  function defaultState() {
    return {
      name: '',
      look: { skin: DATA.SKINS[0], hair: 'short', hairColor: DATA.HAIR_COLORS[0], shirt: DATA.SHIRT_COLORS[5], shirtStyle: 'plain', pants: DATA.PANTS_COLORS[0], hat: 'none', pet: 'none', acc: 'none' },
      coins: 50, xp: 0, level: 1,
      inv: { seed_wheat: 6, seed_carrot: 3, wheat: 3, fertilizer: 5 },
      owned: { hats: ['none'], shirtStyles: ['plain'], pets: ['none'], accs: ['none'] },
      tiles: Array.from({ length: 144 }, () => ({ crop: null, plantedAt: 0, watered: false })),
      beds: [true, false, false, false, false, false, false, false, true, false, false, false],
      trees: DATA.ORCHARD.map(() => ({ at: 0 })),
      storage: {},
      coop: { fedAt: 0 },
      pen: { fedAt: 0 },
      map: 'farm', x: null, y: null,
      settings: { pixelArt: false },
    };
  }

  /** Ghép bản lưu (trong máy hoặc trên mạng) với dữ liệu mặc định, nâng cấp dữ liệu cũ */
  function mergeSave(s) {
    const d = defaultState();
    if (!s.tiles) {
      // chuyển dữ liệu từ ruộng cũ (10 ô) sang luống mới
      s.tiles = d.tiles;
      (s.plots || []).forEach((p, i) => { if (p && p.crop && i < 12) s.tiles[i] = { crop: p.crop, plantedAt: p.plantedAt, watered: true }; });
      s.beds = [true, (s.plots || []).filter((p) => p && p.unlocked).length > 6, false, false];
    }
    // nông trại mở rộng: 8 luống × 12 ô
    while (s.tiles.length < 96) s.tiles.push({ crop: null, plantedAt: 0, watered: false });
    while ((s.beds || []).length < 8) s.beds = [...(s.beds || [true]), false];
    // vườn hoa: thêm 4 luống hoa (luống đầu tiên miễn phí)
    while (s.tiles.length < 144) s.tiles.push({ crop: null, plantedAt: 0, watered: false });
    if (s.beds.length < 12) { while (s.beds.length < 12) s.beds.push(false); s.beds[8] = true; }
    s.trees = s.trees || [];
    while (s.trees.length < DATA.ORCHARD.length) s.trees.push({ at: 0 });
    return { ...d, ...s, look: { ...d.look, ...s.look }, owned: { ...d.owned, ...s.owned }, settings: { ...d.settings, ...s.settings } };
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) return mergeSave(JSON.parse(raw));
    } catch (e) { /* dùng dữ liệu mặc định */ }
    return defaultState();
  }

  const S = load();
  AV.S = S;
  let VISIT = null;
  const FD = () => (VISIT ? VISIT.data : S);
  AV.F = FD;
  AV.visiting = () => VISIT;

  const maps = {};
  Object.keys(MAPS).forEach((id) => { maps[id] = MAPS[id](); });
  let map = maps.farm;

  function saveNow() {
    if (map) { S.map = map.id; }
    if (!player.hidden) { S.x = Math.round(player.x); S.y = Math.round(player.y); }
    S.savedAt = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ }
    if (CLOUD.user && cloudReady) CLOUD.markDirty();
  }
  /** Đã quyết định xong dùng bản lưu nào sau khi đăng nhập thì mới được đẩy lên mạng */
  let cloudReady = false;

  /* ---------- Thực thể ---------- */
  const player = { x: 0, y: 0, dir: 1, moving: false, t: 0, target: null, pending: null, hidden: false, bubble: null, stuck: 0, dancing: 0, fishing: null };
  const myPet = { x: 0, y: 0, dir: 1, t: 0, moving: false };
  const bus = { x: -999, state: 'away', timer: 5, v: 0, carrying: false, wantsBoard: false, dest: 'town' };
  const floats = [];
  const fade = { a: 0, mode: null };
  let marker = null;
  let hover = null;
  let now = Date.now();
  let clock = 0;

  function enterMap(id, x, y) {
    camOff.x = 0; camOff.y = 0;
    if (map && map.id !== id) { map.ground = null; if (swingRide) { swingRide.s.a = 0; swingRide = null; player.seated = false; } }
    player.path = [];
    map = maps[id];
    player.x = x ?? map.spawn.x;
    player.y = y ?? map.spawn.y;
    if (blocked(player.x, player.y)) { player.x = map.spawn.x; player.y = map.spawn.y; }
    player.target = null;
    player.pending = null;
    myPet.x = player.x - 30; myPet.y = player.y + 3;
    if (id !== 'farm') VISIT = null;
    UI.setLocation(id === 'farm' && VISIT ? `Nông trại của ${VISIT.data.name}` : map.name);
    UI.updateVisitBar(VISIT);
    joinRoom();
    TABLE.onMapChange();
  }

  /** Phòng online của khu hiện tại: nông trại và nhà là riêng từng người */
  function joinRoom() {
    const myRoom = S.owner || NET.pid, id = map.id;
    NET.enter(id === 'farm' ? `farm-${VISIT ? VISIT.uid : myRoom}` : map.private ? `${id}-${myRoom}` : id);
  }

  /* ---------- Va chạm ---------- */
  function blockedIn(m, x, y) {
    const b = m.bounds;
    if (x < b.l || x > b.r || y < b.t || y > b.b) return true;
    for (const c of m.colliders) {
      if (x > c.x - 9 && x < c.x + c.w + 9 && y > c.y - 4 && y < c.y + c.h + 4) return true;
    }
    return false;
  }
  const blocked = (x, y) => blockedIn(map, x, y);

  /* ---------- Tự tìm đường (A*) để đi vòng qua cổng, nhà, chuồng ---------- */
  const NAV = 20;
  function navGrid(m) {
    if (m._nav) return m._nav;
    const cols = Math.ceil(m.w / NAV), rows = Math.ceil(m.h / NAV);
    const g = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * NAV + NAV / 2, y = r * NAV + NAV / 2;
      g[r * cols + c] = blockedIn(m, x, y) || blockedIn(m, x - 10, y) || blockedIn(m, x + 10, y) || blockedIn(m, x, y - 6) || blockedIn(m, x, y + 6) ? 1 : 0;
    }
    m._nav = { cols, rows, g };
    return m._nav;
  }

  const fat = (x, y) => blocked(x, y) || blocked(x - 9, y) || blocked(x + 9, y) || blocked(x, y - 5) || blocked(x, y + 5);
  function lineFree(x1, y1, x2, y2) {
    const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 6);
    for (let i = 1; i <= n; i++) if (fat(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n)) return false;
    return true;
  }

  function findPath(sx, sy, tx, ty) {
    const { cols, rows, g } = navGrid(map);
    const cell = (x, y) => [Math.max(0, Math.min(cols - 1, Math.floor(x / NAV))), Math.max(0, Math.min(rows - 1, Math.floor(y / NAV)))];
    const [sc, sr] = cell(sx, sy);
    let [tc, tr] = cell(tx, ty);
    if (g[tr * cols + tc]) {
      // điểm đích nằm trong vật cản: tìm ô trống gần nhất
      let best = null;
      for (let rad = 1; rad < 12 && !best; rad++) {
        for (let dr = -rad; dr <= rad && !best; dr++) for (let dc = -rad; dc <= rad; dc++) {
          const c = tc + dc, r = tr + dr;
          if (c >= 0 && r >= 0 && c < cols && r < rows && !g[r * cols + c]) { best = [c, r]; break; }
        }
      }
      if (!best) return null;
      [tc, tr] = best;
    }
    const N = cols * rows, start = sr * cols + sc, goal = tr * cols + tc;
    const gs = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const open = [start];
    gs[start] = 0;
    const h = (i) => Math.hypot((i % cols) - tc, Math.floor(i / cols) - tr);
    const fs2 = new Float32Array(N).fill(Infinity);
    fs2[start] = h(start);
    let guard = 0;
    while (open.length && guard++ < 40000) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (fs2[open[i]] < fs2[open[bi]]) bi = i;
      const cur = open[bi];
      open[bi] = open[open.length - 1]; open.pop();
      if (cur === goal) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cc = cur % cols, cr = Math.floor(cur / cols);
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nc = cc + dc, nr = cr + dr;
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const ni = nr * cols + nc;
        if (g[ni] || closed[ni]) continue;
        if (dr && dc && (g[cr * cols + nc] || g[nr * cols + cc])) continue;
        const ng = gs[cur] + (dr && dc ? 1.414 : 1);
        if (ng < gs[ni]) { gs[ni] = ng; came[ni] = cur; fs2[ni] = ng + h(ni); open.push(ni); }
      }
    }
    if (came[goal] < 0 && goal !== start) return null;
    const pts = [];
    for (let i = goal; i !== start && i >= 0; i = came[i]) pts.push({ x: (i % cols) * NAV + NAV / 2, y: Math.floor(i / cols) * NAV + NAV / 2 });
    pts.reverse();
    if (!g[Math.floor(ty / NAV) * cols + Math.floor(tx / NAV)]) pts.push({ x: tx, y: ty });
    // làm mượt: bỏ các điểm giữa nếu đi thẳng được
    const out = [];
    let px = sx, py = sy, k = 0;
    while (k < pts.length) {
      let far = k;
      for (let j = pts.length - 1; j > k; j--) if (lineFree(px, py, pts[j].x, pts[j].y)) { far = j; break; }
      out.push(pts[far]);
      px = pts[far].x; py = pts[far].y; k = far + 1;
    }
    return out;
  }

  /** Đi tới (x,y): đi thẳng nếu không vướng, không thì tự tìm đường vòng */
  function goTo(x, y) {
    player.goal = { x, y };
    player.repath = 0;
    if (lineFree(player.x, player.y, x, y)) { player.path = []; player.target = { x, y }; return; }
    const p = findPath(player.x, player.y, x, y);
    if (p && p.length) { player.target = p.shift(); player.path = p; } else { player.path = []; player.target = { x, y }; }
  }

  function tryMove(e, dx, dy) {
    let moved = false;
    if (dx && !blocked(e.x + dx, e.y)) { e.x += dx; moved = true; }
    if (dy && !blocked(e.x, e.y + dy)) { e.y += dy; moved = true; }
    return moved;
  }

  /* ---------- Hiệu ứng chữ bay ---------- */
  function float(text, x, y, color = '#fff') {
    floats.push({ text, x, y, t: 0, color });
  }

  /** 75 → "1 phút 15 giây", 3700 → "1 giờ 2 phút" */
  function fmtDur(sec) {
    sec = Math.max(0, Math.ceil(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    if (h) return `${h} giờ${m ? ' ' + m + ' phút' : ''}`;
    if (m) return `${m} phút${s && m < 5 ? ' ' + s + ' giây' : ''}`;
    return `${s} giây`;
  }
  AV.fmtDur = fmtDur;

  /* ---------- Kinh tế & cấp độ ---------- */
  function addItem(id, n) { S.inv[id] = (S.inv[id] || 0) + n; }

  function addXP(n) {
    S.xp += n;
    while (S.xp >= DATA.xpNeed(S.level)) {
      S.xp -= DATA.xpNeed(S.level);
      S.level++;
      UI.toast(`🎉 Lên cấp ${S.level}!`, 3200);
      float('LÊN CẤP!', player.x, player.y - 110, '#ffd43b');
      const unlocked = Object.values(DATA.CROPS).filter((c) => c.lvl === S.level);
      unlocked.forEach((c) => setTimeout(() => UI.toast(`🔓 Mở khoá hạt ${c.name.toLowerCase()} ${c.icon} ở Chợ`, 3500), 800));
    }
  }

  let cloudTimer = null;
  function changed() {
    // changedAt chỉ đổi khi tiến trình thật sự thay đổi (mua, bán, trồng…) — dùng để so bản lưu giữa các máy
    S.changedAt = Date.now();
    saveNow();
    // có thay đổi quan trọng: lưu lên mạng sau 3 giây (gom nhiều thay đổi liền nhau)
    if (CLOUD.user && cloudReady && !cloudTimer) cloudTimer = setTimeout(() => { cloudTimer = null; CLOUD.push(S); }, 3000);
    UI.updateHud();
    NET.sendState();
  }

  AV.saveNow = saveNow;

  AV.resetGame = () => {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* bỏ qua */ }
    window.removeEventListener('beforeunload', saveNow);
    location.reload();
  };

  AV.buySeed = (id, n) => {
    const c = DATA.CROPS[id];
    const cost = c.seed * n;
    if (S.coins < cost) return UI.toast('Không đủ xu 😢');
    S.coins -= cost;
    addItem('seed_' + id, n);
    UI.toast(`Đã mua ${n} hạt ${c.name.toLowerCase()} ${c.icon}`);
    changed();
  };

  AV.sell = (id, n) => {
    const have = S.inv[id] || 0;
    n = Math.min(n, have);
    if (!n) return;
    const gain = DATA.ITEMS[id].sell * n;
    S.inv[id] = have - n;
    S.coins += gain;
    UI.toast(`Bán ${n} ${DATA.ITEMS[id].icon} · +${gain} xu`);
    float(`+${gain} 💰`, player.x, player.y - 100, '#ffd43b');
    changed();
  };

  const WEAR = { hat: ['HATS', 'hats', 'hat'], shirt: ['SHIRT_STYLES', 'shirtStyles', 'shirtStyle'], acc: ['ACCS', 'accs', 'acc'] };
  AV.buyWear = (kind, id) => {
    const [listKey, ownKey] = WEAR[kind];
    S.owned[ownKey] = S.owned[ownKey] || ['none'];
    const list = DATA[listKey];
    const it = list.find((x) => x.id === id);
    if (it.lvl && S.level < it.lvl) return UI.toast(`Cần đạt cấp ${it.lvl}`);
    if (S.coins < it.price) return UI.toast('Không đủ xu 😢');
    S.coins -= it.price;
    S.owned[ownKey].push(id);
    AV.wear(kind, id);
    UI.toast(`Đã mua ${it.name} ✨`);
  };

  AV.wear = (kind, id) => {
    S.look[WEAR[kind][2]] = id;
    changed();
  };

  /* ---------- Ruộng: 4 luống × 12 ô, cây khát nước phải tưới ---------- */
  const TPB = DATA.TILES_PER_BED;
  /** Luống 0–7 trồng rau củ, 8–11 trồng hoa */
  const isFlowerBed = (bed) => bed >= DATA.FIELD_BEDS;
  AV.cropAllowed = (i, crop) => { const k = DATA.CROPS[crop].kind; return isFlowerBed(Math.floor(i / TPB)) ? (k === 'flower' || k === 'both') : k !== 'flower'; };
  AV.isFlowerTile = (i) => isFlowerBed(Math.floor(i / TPB));
  const bedOf = (i) => Math.floor(i / TPB);
  const bedTiles = (bed) => FD().tiles.slice(bed * TPB, bed * TPB + TPB);

  /** Trạng thái một ô: tiến độ (0..1), khát nước, giai đoạn cây */
  function tileState(t) {
    if (!t || !t.crop) return { stage: -1 };
    const total = DATA.CROPS[t.crop].time * 1000;
    let p = (now - t.plantedAt) / total;
    const thirsty = !t.watered && p >= DATA.THIRSTY_AT;
    if (thirsty) p = DATA.THIRSTY_AT;
    p = Math.min(1, p);
    return { p, thirsty, left: Math.max(0, (1 - p) * total / 1000), stage: p >= 1 ? 2 : p >= 0.3 ? 1 : 0 };
  }
  AV.tileState = tileState;

  /** Chỉ báo của cả luống: số ô chín, ô khát nước, thời gian ô sớm nhất */
  AV.bedIndicator = (bed) => {
    if (!FD().beds[bed]) return null;
    let ready = 0, thirsty = 0, minLeft = Infinity, p = 0;
    bedTiles(bed).forEach((t) => {
      const st = tileState(t);
      if (st.stage < 0) return;
      if (st.stage === 2) ready++;
      else if (st.thirsty) thirsty++;
      else if (st.left < minLeft) { minLeft = st.left; p = st.p; }
    });
    if (ready) return '🧺';
    if (thirsty) return '💧';
    if (minLeft < Infinity) return { p, left: minLeft };
    return null;
  };

  /** Tưới cả luống: cây khát được tưới thì lớn tiếp; mọi cây được tưới đều nhanh hơn 10% */
  function waterBed(bed) {
    let n = 0;
    now = Date.now();
    bedTiles(bed).forEach((t) => {
      const st = tileState(t);
      if (st.stage < 0 || st.stage === 2 || t.watered) return;
      const total = DATA.CROPS[t.crop].time * 1000;
      if (st.thirsty) t.plantedAt += now - (t.plantedAt + DATA.THIRSTY_AT * total);
      t.plantedAt -= DATA.WATER_CUT * total;
      t.watered = true;
      n++;
    });
    if (n) {
      addXP(Math.ceil(n / 2) + 1);
      float(`💧 Tưới ${n} cây`, player.x, player.y - 110, '#a5d8ff');
      changed();
    }
    return n;
  }

  /** Bón phân cả luống: mỗi ô 1 gói, nhanh hơn 30% (mỗi lần trồng bón 1 lần) */
  function fertBed(bed) {
    now = Date.now();
    let n = 0;
    for (const t of bedTiles(bed)) {
      const st = tileState(t);
      if (st.stage < 0 || st.stage === 2 || t.fert) continue;
      if ((S.inv.fertilizer || 0) < 1) break;
      S.inv.fertilizer--;
      t.plantedAt -= DATA.FERT.cut * DATA.CROPS[t.crop].time * 1000;
      t.fert = true;
      n++;
    }
    if (n) {
      addXP(Math.ceil(n / 3) + 1);
      float(`🧪 Bón phân ${n} cây`, player.x, player.y - 110, '#b2f2bb');
      changed();
    }
    return n;
  }

  /** Thống kê luống để hiện trong bảng chăm sóc */
  AV.bedCare = (bed) => {
    const tiles = bedTiles(bed).filter((t) => t.crop && tileState(t).stage < 2);
    return {
      growing: tiles.length,
      dry: tiles.filter((t) => !t.watered).length,
      unfert: tiles.filter((t) => !t.fert).length,
      soonest: tiles.reduce((m, t) => Math.min(m, tileState(t).left), Infinity),
      fert: S.inv.fertilizer || 0,
    };
  };
  AV.waterBed = (bed) => waterBed(bed);
  AV.fertBed = (bed) => {
    const n = fertBed(bed);
    if (!n) UI.toast((S.inv.fertilizer || 0) < 1 ? 'Hết phân bón — mua ở Chợ (Khu mua sắm) 5 xu/gói' : 'Các cây trong luống đã được bón phân rồi');
    return n;
  };
  AV.buyFert = (n) => {
    if (!AV.spend(DATA.FERT.price * n)) return;
    addItem('fertilizer', n);
    UI.toast(`Đã mua ${n} gói phân bón 🧪`);
    changed();
  };

  function harvestBed(bed) {
    const got = {};
    let xp = 0;
    bedTiles(bed).forEach((t) => {
      if (tileState(t).stage !== 2) return;
      const c = DATA.CROPS[t.crop];
      got[t.crop] = (got[t.crop] || 0) + c.yield;
      xp += c.xp;
      t.crop = null; t.plantedAt = 0; t.watered = false; t.fert = false;
    });
    const keys = Object.keys(got);
    if (!keys.length) return false;
    keys.forEach((k) => addItem(k, got[k]));
    AV.quest('harvest', keys.reduce((a, k) => a + got[k], 0));
    addXP(xp);
    float(keys.map((k) => `+${got[k]} ${DATA.CROPS[k].icon}`).join('  '), player.x, player.y - 110);
    changed();
    return true;
  }

  AV.useTile = (i) => {
    if (VISIT) return AV.helpWater();
    const bed = bedOf(i);
    if (!S.beds[bed]) {
      const price = DATA.BED_PRICES[bed];
      UI.confirm(`Mua ${isFlowerBed(bed) ? 'luống hoa' : 'luống ruộng'} này (12 ô) với giá <b>${price} xu</b>?`, 'Mua luống', () => {
        if (S.coins < price) return UI.toast('Không đủ xu 😢');
        S.coins -= price;
        S.beds[bed] = true;
        UI.toast('Đã mua luống mới! Gieo hạt thôi 🌱');
        changed();
      });
      return;
    }
    const t = S.tiles[i];
    const st = tileState(t);
    if (st.stage === 2 || (st.stage >= 0 && bedTiles(bed).some((x) => tileState(x).stage === 2))) { harvestBed(bed); return; }
    if (st.thirsty || bedTiles(bed).some((x) => tileState(x).thirsty)) { waterBed(bed); return; }
    if (st.stage < 0) return UI.seedPicker(i);
    UI.careBed(bed);
  };

  function plantTile(i, crop) {
    const key = 'seed_' + crop;
    if (!S.inv[key] || S.tiles[i].crop || !AV.cropAllowed(i, crop)) return false;
    S.inv[key]--;
    S.tiles[i] = { crop, plantedAt: Date.now(), watered: false };
    return true;
  }

  AV.plant = (i, crop) => {
    if (plantTile(i, crop)) { float('🌱 Gieo hạt', player.x, player.y - 110); changed(); }
  };

  /** Gieo tất cả ô trống trong luống bằng một loại hạt */
  AV.plantBed = (i, crop) => {
    const bed = bedOf(i);
    let n = 0;
    for (let k = bed * TPB; k < bed * TPB + TPB; k++) if (plantTile(k, crop)) n++;
    if (n) { float(`🌱 Gieo ${n} ô`, player.x, player.y - 110); changed(); }
    if (!S.inv['seed_' + crop] && n < bedTiles(bed).length) UI.toast('Hết hạt giống — mua thêm ở Chợ (Khu mua sắm)');
  };
  AV.emptyInBed = (i) => bedTiles(bedOf(i)).filter((t) => !t.crop).length;

  /* ---------- Vườn cây ăn quả: tự ra quả, chín để lâu không hỏng ---------- */
  function treeState(i) {
    const f = DATA.FRUITS[DATA.ORCHARD[i]];
    const el = (now - ((FD().trees[i] || {}).at || 0)) / 1000;
    return { f, ripe: el >= f.time, p: Math.min(1, el / f.time), left: f.time - el };
  }
  AV.treeState = treeState;

  AV.treeIndicator = (i) => {
    const st = treeState(i);
    if (st.ripe) return st.f.icon;
    return Math.hypot(player.x - AV._treePos[i][0], player.y - AV._treePos[i][1]) < 260 ? { p: st.p, left: st.left } : null;
  };

  AV.useTree = (i) => {
    if (VISIT) return visitOnly('hái quả');
    const st = treeState(i);
    if (!st.ripe) return UI.toast(`${st.f.icon} Cây ${st.f.name.toLowerCase()} đang ra quả, còn ${fmtDur(st.left)} nữa`);
    S.trees[i].at = Date.now();
    addItem(DATA.ORCHARD[i], st.f.yield);
    addXP(st.f.xp);
    float(`+${st.f.yield} ${st.f.icon}`, player.x, player.y - 110);
    AV.quest('harvest', st.f.yield);
    changed();
  };

  /* ---------- Chuồng trại ---------- */
  function farmBuilding(st, cfg, opts) {
    const t = Date.now();
    if (!st.fedAt) {
      if ((S.inv.wheat || 0) >= cfg.feed) {
        S.inv.wheat -= cfg.feed;
        st.fedAt = t;
        float(`-${cfg.feed} 🌾`, player.x, player.y - 100);
        UI.toast(`${opts.fedMsg} Quay lại sau ${fmtDur(cfg.time)} nhé!`);
        map.animals.filter((a) => opts.kinds.includes(a.kind)).forEach((a) => { a.wait = 0; a.bubble = { text: '❤️', until: t + 1800, big: true }; });
      } else {
        UI.toast(`Cần ${cfg.feed} 🌾 lúa mì để cho ăn (đang có ${S.inv.wheat || 0}). Trồng lúa mì ở Ruộng nhé!`, 3400);
      }
    } else if (t - st.fedAt >= cfg.time * 1000) {
      opts.collect();
      st.fedAt = 0;
      AV.quest('collect');
      addXP(cfg.xp);
    } else {
      UI.toast(`${opts.waitMsg} còn ${fmtDur(cfg.time - (t - st.fedAt) / 1000)}`);
    }
    changed();
  }

  function buildingIndicator(st, cfg) {
    if (!st.fedAt) return '🌾';
    const prog = (now - st.fedAt) / (cfg.time * 1000);
    return prog >= 1 ? null : { p: prog, left: cfg.time - (now - st.fedAt) / 1000 };
  }

  AV.useCoop = () => VISIT ? visitOnly('thu trứng') : farmBuilding(S.coop, DATA.COOP, {
    kinds: ['chicken'], fedMsg: 'Đã cho gà ăn! 🐔', waitMsg: 'Gà đang đẻ trứng…',
    collect: () => { addItem('egg', DATA.COOP.eggs); float(`+${DATA.COOP.eggs} 🥚`, player.x, player.y - 100); },
  });
  AV.coopIndicator = () => {
    const r = buildingIndicator(FD().coop || { fedAt: 0 }, DATA.COOP);
    return r === null ? '🥚' : r;
  };

  AV.usePen = () => VISIT ? visitOnly('thu sữa') : farmBuilding(S.pen, DATA.PEN, {
    kinds: ['cow', 'sheep', 'pig'], fedMsg: 'Đã cho gia súc ăn! 🐄', waitMsg: 'Bò đang làm sữa…',
    collect: () => {
      addItem('milk', DATA.PEN.milk);
      addItem('wool', DATA.PEN.wool);
      addItem('pork', DATA.PEN.pork);
      float(`+${DATA.PEN.milk} 🥛  +${DATA.PEN.wool} 🧶  +${DATA.PEN.pork} 🥩`, player.x, player.y - 100);
    },
  });
  AV.penIndicator = () => {
    const r = buildingIndicator(FD().pen || { fedAt: 0 }, DATA.PEN);
    return r === null ? '🥛' : r;
  };

  AV.useHouse = () => UI.characterEditor(false);

  AV.canCook = (r) => Object.entries(r.need).every(([id, n]) => (S.inv[id] || 0) >= n);
  AV.cook = (id) => {
    const r = DATA.RECIPES.find((x) => x.id === id);
    if (!r || !AV.canCook(r)) return UI.toast('Chưa đủ nguyên liệu 🥲');
    Object.entries(r.need).forEach(([k, n]) => { S.inv[k] -= n; });
    addItem(r.id, 1);
    addXP(r.xp);
    AV.quest('cook');
    float(`+1 ${r.icon}`, player.x, player.y - 110);
    UI.toast(`Đã nấu xong ${r.icon} ${r.name}! (bán ${r.sell} xu ở Chợ)`);
    changed();
  };

  AV.useFountain = () => {
    if (S.coins < 1) return UI.toast('Cần 1 xu để ước nguyện');
    S.coins -= 1;
    const r = Math.random();
    if (r < 0.12) {
      S.coins += 15;
      float('+15 💰', player.x, player.y - 100, '#ffd43b');
      say(player, 'Ồ! Mình nhặt được 15 xu dưới đáy hồ! 🍀');
    } else {
      const wishes = ['Ước gì mùa màng bội thu! ✨', 'Ước được làm bạn với cả thị trấn 💖', 'Ước có thật nhiều bí ngô 🎃', 'Ước mai trời nắng đẹp ☀️'];
      say(player, wishes[Math.floor(Math.random() * wishes.length)]);
    }
    float('-1 💰', 1000, 520, '#ffd43b');
    changed();
  };

  /* ---------- Khu giải trí, thú cưng, nhặt đồ ---------- */
  AV.spend = (n) => {
    if (S.coins < n) { UI.toast('Không đủ xu 😢'); return false; }
    S.coins -= n;
    changed();
    return true;
  };
  AV.earn = (n, xp = 0) => {
    S.coins += n;
    if (xp) addXP(xp);
    if (n > 0) float(`+${n} 💰`, player.x, player.y - 100, '#ffd43b');
    changed();
  };
  AV.addItem = (id, n) => { addItem(id, n); changed(); };
  AV.sayMine = (text) => say(player, text);
  AV.spendSilent = (n) => { S.coins = Math.max(0, S.coins - n); changed(); };
  AV.setSeatPos = (x, y, dir) => {
    player.seated = true;
    player.x = x; player.y = y; player.dir = dir;
    player.target = null; player.pending = null; marker = null;
    if (player.fishing) AV.stopFishing(true);
  };
  AV.leaveSeat = (x, y) => {
    player.seated = false;
    player.x = x; player.y = y;
    for (let k = 0; k < 20 && blocked(player.x, player.y); k++) player.y += 8;
  };

  AV.useStage = () => {
    if (player.dancing < Date.now()) AV.quest('dance');
    player.dancing = Date.now() + 10000;
    say(player, ['🎵 Quẩy lên nào!', '💃🕺', '🎶 La la la~', 'Cùng nhảy nhé! ✨'][Math.floor(Math.random() * 4)]);
    UI.toast('💃 Đang nhảy trên sân khấu! (10 giây)');
    NET.sendState();
  };

  AV.useFerris = () => {
    if (!AV.spend(5)) return;
    addXP(6);
    say(player, ['Ngắm cả thành phố từ trên cao, đẹp quá! 🎡', 'Woaa, thấy cả bãi biển luôn! 🌊', 'Gió mát ghê~ 🌤️'][Math.floor(Math.random() * 3)]);
    float('-5 💰', player.x, player.y - 100, '#ffd43b');
  };

  AV.buyIceCream = () => {
    if (!AV.spend(5)) return;
    addXP(4);
    say(player, ['🍦', '🍧', '🍨'][Math.floor(Math.random() * 3)]);
    UI.toast('Mát lạnh! 🍦 +4 XP');
  };

  AV.buyPet = (id) => {
    const p = DATA.PETS.find((x) => x.id === id);
    if (!p || S.owned.pets.includes(id)) return;
    if (!AV.spend(p.price)) return;
    S.owned.pets.push(id);
    AV.wearPet(id);
    UI.toast(`Đã nhận nuôi ${p.name}! 🐾`);
  };
  AV.wearPet = (id) => {
    S.look.pet = id;
    myPet.x = player.x - player.dir * 30;
    myPet.y = player.y + 2;
    changed();
  };

  function spawnPickups(dt) {
    if (!map.pickupArea) return;
    map.pickupTimer = (map.pickupTimer || 0) - dt;
    if (map.pickups.length >= 7 || map.pickupTimer > 0) return;
    map.pickupTimer = 40 + Math.random() * 40;
    const a = map.pickupArea;
    for (let tries = 0; tries < 10; tries++) {
      const x = a.l + Math.random() * (a.r - a.l), y = a.t + Math.random() * (a.b - a.t);
      if (blocked(x, y)) continue;
      let r = Math.random() * map.pickupTable.reduce((s, it) => s + it.w, 0);
      const it = map.pickupTable.find((p) => (r -= p.w) < 0) || map.pickupTable[0];
      map.pickups.push({ x, y, item: it });
      return;
    }
  }

  function collectPickup(p) {
    const i = map.pickups.indexOf(p);
    if (i < 0) return;
    map.pickups.splice(i, 1);
    addItem(p.item.id, 1);
    addXP(3);
    AV.quest('shell');
    float(`+1 ${p.item.icon}`, player.x, player.y - 100);
    if (p.item.id === 'pearl') UI.toast('✨ Wow! Bạn nhặt được Ngọc trai quý hiếm!');
    changed();
  }

  function followPet(pet, owner, dt, dir) {
    const tx = owner.x - dir * 30, ty = owner.y + 3;
    const dx = tx - pet.x, dy = ty - pet.y, d = Math.hypot(dx, dy);
    pet.t += dt;
    if (d > 300) { pet.x = tx; pet.y = ty; }
    if (d > 6) {
      const sp = Math.min(d, Math.max(90, d * 4) * dt);
      pet.x += dx / d * sp; pet.y += dy / d * sp;
      pet.moving = true;
      if (Math.abs(dx) > 2) pet.dir = dx > 0 ? 1 : -1;
    } else pet.moving = false;
  }
  AV.followPet = followPet;

  /* ---------- Nhiệm vụ hằng ngày ---------- */
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function ensureQuests() {
    const key = todayKey();
    if (S.quests && S.quests.date === key) return;
    const r = ART.srand([...key].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 2147483646);
    const others = DATA.QUESTS.filter((q) => q.id !== 'quiz');
    const picks = [DATA.QUESTS.find((q) => q.id === 'quiz')];
    while (picks.length < 4) picks.push(others.splice(Math.floor(r() * others.length), 1)[0]);
    S.quests = { date: key, list: picks.map((q) => ({ id: q.id, n: q.n, prog: 0, claimed: false })) };
  }

  AV.quests = () => { ensureQuests(); return S.quests.list; };

  /** Cộng tiến độ nhiệm vụ */
  AV.quest = (id, amount = 1) => {
    ensureQuests();
    const q = S.quests.list.find((x) => x.id === id);
    if (!q || q.prog >= q.n) return;
    q.prog = Math.min(q.n, q.prog + amount);
    if (q.prog >= q.n) {
      const def = DATA.QUESTS.find((x) => x.id === id);
      UI.toast(`📜 Hoàn thành nhiệm vụ: ${def.text.replace('{n}', q.n)}! Bấm 📜 để nhận thưởng`, 4000);
    }
    UI.updateQuestDot();
  };

  AV.claimQuest = (id) => {
    ensureQuests();
    const q = S.quests.list.find((x) => x.id === id);
    if (!q || q.prog < q.n || q.claimed) return;
    const def = DATA.QUESTS.find((x) => x.id === id);
    q.claimed = true;
    S.coins += def.coins;
    addXP(def.xp);
    float(`+${def.coins} 💰`, player.x, player.y - 120, '#ffd43b');
    UI.toast(`🎁 Nhận ${def.coins} xu và ${def.xp} XP!`);
    changed();
    UI.updateQuestDot();
  };

  /* ---------- Đố vui tiếng Anh ở Trường học ---------- */
  const quizState = { round: -1, answered: false, firstWinner: null, revealed: false };

  function syncQuizRound(q) {
    if (quizState.round === q.round) return;
    Object.assign(quizState, { round: q.round, answered: false, firstWinner: null, revealed: false });
    const teacher = map.npcs.find((n) => n.teacher);
    if (teacher) teacher.bubble = { text: q.q, until: Date.now() + 15000, big: false };
  }

  function updateQuiz() {
    if (map.id !== 'school') return;
    const q = QUIZ.current();
    syncQuizRound(q);
    if (!q.open && !quizState.revealed) {
      quizState.revealed = true;
      UI.chatLog('', `📢 Đáp án là: ${q.answer}${quizState.firstWinner ? ` — ${quizState.firstWinner} trả lời nhanh nhất!` : ''}`, false, true);
      const teacher = map.npcs.find((n) => n.teacher);
      if (teacher) teacher.bubble = { text: `Đáp án: ${q.answer} ✨`, until: Date.now() + 4500 };
    }
  }

  /** Kiểm tra câu trả lời gõ vào chat. Trả về true nếu là câu trả lời đúng */
  function checkQuizAnswer(text) {
    if (map.id !== 'school') return false;
    const q = QUIZ.current();
    syncQuizRound(q);
    if (!q.open || quizState.answered) return false;
    const teacher = map.npcs.find((n) => n.teacher);
    if (!q.check(text)) {
      if (teacher && QUIZ.norm(text).length > 0 && q.choices.some((c) => QUIZ.norm(c) === QUIZ.norm(text))) {
        teacher.bubble = { text: 'Chưa đúng rồi, thử lại nhé! 🤔', until: Date.now() + 2000 };
      }
      return false;
    }
    quizState.answered = true;
    const first = !quizState.firstWinner;
    quizState.firstWinner = quizState.firstWinner || S.name;
    const coins = first ? 5 : 2, xp = first ? 8 : 4;
    S.coins += coins;
    addXP(xp);
    float(`+${coins} 💰`, player.x, player.y - 120, '#ffd43b');
    const msg = `${S.name} trả lời đúng${first ? ' đầu tiên' : ''}: ${q.answer} 🎉 (+${coins} xu)`;
    UI.chatLog('', msg, true, true);
    NET.sendSys(msg);
    NET.sendQuiz(q.round);
    if (teacher) teacher.bubble = { text: first ? `Giỏi lắm ${S.name}! 👏` : 'Chính xác! 👍', until: Date.now() + 2500 };
    AV.quest('quiz');
    changed();
    return true;
  }

  /** Người khác báo đã trả lời đúng vòng này */
  AV.onQuizWin = (round, name) => {
    if (round === quizState.round && !quizState.firstWinner) quizState.firstWinner = name;
  };

  AV.quizHelp = () => {
    const q = QUIZ.current();
    UI.toast(q.open ? `❓ ${q.q} — gõ đáp án vào khung chat hoặc bấm nút chọn!` : 'Chờ câu hỏi tiếp theo nhé ⏳', 3500);
    document.getElementById('chatInput').focus();
  };

  /** Thanh nút chọn đáp án (cho điện thoại) */
  const quizBar = document.getElementById('quizBar');
  let quizBarKey = '';
  function updateQuizBar() {
    let key = '';
    let q = null;
    if (map.id === 'school' && !player.hidden && !UI.isBlocking()) {
      q = QUIZ.current();
      key = q.open && !quizState.answered ? 'q' + q.round : '';
    }
    if (key === quizBarKey) return;
    quizBarKey = key;
    quizBar.classList.toggle('show', !!key);
    quizBar.innerHTML = key ? q.choices.map((c, i) => `<button data-c="${i}"><b>${'ABCD'[i]}</b> ${c}</button>`).join('') : '';
    quizBar.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => AV.say(q.choices[+b.dataset.c]));
  }

  /* ---------- Câu cá ngay trên bản đồ (không popup) ---------- */
  /** Có đang đứng ở bờ hồ không */
  function nearShore() {
    const L = map.lake;
    if (!L || player.hidden) return false;
    const dx = (player.x - L.x) / (L.rx + 95), dy = (player.y - L.y) / (L.ry + 85);
    return dx * dx + dy * dy <= 1;
  }
  AV.nearShore = nearShore;

  /** Chọn điểm thả phao trên mặt nước, hướng về giữa hồ */
  function bobberSpot() {
    const L = map.lake;
    const vx = L.x - player.x, vy = L.y - player.y, d = Math.hypot(vx, vy) || 1;
    for (let k = 150; k < d + 150; k += 10) {
      const bx = player.x + vx / d * k, by = player.y + vy / d * k;
      const ex = (bx - L.x) / (L.rx - 25), ey = (by - L.y) / (L.ry - 20);
      if (ex * ex + ey * ey <= 1) return { bx, by };
    }
    return { bx: L.x, by: L.y };
  }

  AV.startFishing = () => {
    if (player.fishing) return;
    if (!nearShore()) return UI.toast('Ra sát bờ hồ ở Công viên mới câu được cá nhé 🎣');
    const { bx, by } = bobberSpot();
    player.target = null; player.pending = null; marker = null;
    player.dir = bx >= player.x ? 1 : -1;
    player.fishing = { state: 'wait', bx, by, biteAt: Date.now() + 6000 + Math.random() * 9000, endAt: 0 };
    UI.toast('🎣 Đã thả câu — chờ phao giật rồi bấm GIẬT CẦN!');
    NET.sendState();
  };

  AV.stopFishing = (silent) => {
    if (!player.fishing) return;
    player.fishing = null;
    if (!silent) UI.toast('Đã thu cần');
    NET.sendState();
  };

  /** Giật cần: đúng lúc cá cắn thì câu được, giật sớm thì cá sợ bỏ đi */
  AV.pullRod = () => {
    const f = player.fishing;
    if (!f) return;
    if (f.state !== 'bite') {
      f.biteAt = Date.now() + 6000 + Math.random() * 9000;
      UI.toast('Giật sớm quá, cá sợ bơi mất rồi 😅');
      return;
    }
    let r = Math.random() * DATA.FISH.reduce((a, x) => a + x.w, 0);
    const fish = DATA.FISH.find((x) => (r -= x.w) < 0) || DATA.FISH[0];
    addItem(fish.id, 1);
    addXP(fish.id === 'boot' ? 1 : 5);
    if (fish.id !== 'boot') AV.quest('fish');
    float(`+1 ${fish.icon}`, player.x, player.y - 120);
    say(player, fish.id === 'boot' ? 'Ơ… chiếc giày cũ 👢😂' : `Câu được ${fish.icon} ${fish.name}!`);
    const msg = fish.id === 'boot' ? 'đã câu phải một chiếc giày cũ 👢' : `đã câu được một ${fish.name.toLowerCase()} ${fish.icon}`;
    UI.chatLog('', `${S.name} ${msg}`, true, true);
    NET.sendSys(`${S.name} ${msg}`);
    f.state = 'wait';
    f.biteAt = Date.now() + 6000 + Math.random() * 9000;
    changed();
  };

  function updateFishing() {
    const f = player.fishing;
    if (!f) return;
    if (player.target || player.moving || player.hidden || !map.lake) { AV.stopFishing(true); return; }
    const t = Date.now();
    if (f.state === 'wait' && t >= f.biteAt) {
      f.state = 'bite'; f.endAt = t + 1400;
      if (navigator.vibrate) navigator.vibrate(80);
      NET.sendState();
    } else if (f.state === 'bite' && t >= f.endAt) {
      f.state = 'wait'; f.biteAt = t + 6000 + Math.random() * 9000;
      UI.toast('Chậm quá, cá chạy mất rồi 😢');
      NET.sendState();
    }
  }

  /** Nút hành động góc phải: Thả câu / Đang câu / GIẬT CẦN */
  const actionBtn = document.getElementById('actionBtn');
  let actionKey = '';
  function updateActionButton() {
    let key = '', text = '';
    if (player.fishing) {
      key = player.fishing.state === 'bite' ? 'bite' : 'wait';
      text = key === 'bite' ? '‼️ GIẬT CẦN!' : '🎣 Đang câu… <small>bấm để thu cần</small>';
    } else if (nearShore() && !UI.isBlocking()) {
      key = 'cast'; text = '🎣 Thả câu';
    }
    if (key === actionKey) return;
    actionKey = key;
    actionBtn.className = 'action-btn' + (key ? ' show ' + key : '');
    actionBtn.innerHTML = text;
  }
  actionBtn.addEventListener('click', () => {
    if (actionKey === 'cast') AV.startFishing();
    else if (actionKey === 'bite') AV.pullRod();
    else if (actionKey === 'wait') AV.stopFishing();
  });

  /* ---------- Xe buýt ---------- */
  const busStopX = () => map.busStop.x - 57;
  const destName = () => (maps[bus.dest] || maps.town).name;

  AV.useBusStop = () => UI.cityMap(true);
  AV.currentMap = () => map.id;

  /** Chọn điểm đến trên bản đồ thành phố: tự đi ra trạm và lên xe */
  AV.travelTo = (id) => {
    if (id === 'farm' && VISIT && map.id === 'farm') return AV.goHomeFarm();
    if (!map.busStop) return UI.toast('Ra khỏi nhà rồi mới đi xe buýt được nhé 🏠');
    if (!maps[id]) return;
    if (id === map.id) return UI.toast(`Bạn đang ở ${map.name} rồi 😄`);
    if (player.hidden || bus.carrying) return;
    bus.dest = id;
    bus.wantsBoard = true;
    if (bus.state === 'away') bus.timer = 0;
    const st = map.busStop;
    if (Math.hypot(player.x - st.x, player.y - st.y) > 150) {
      goTo(st.x + 44, st.y + 12);
      player.pending = null;
      marker = { x: st.x + 44, y: st.y + 12, t: 0 };
      UI.toast(`Đang ra trạm xe buýt đi ${maps[id].name} 🚌`);
    } else if (bus.state !== 'waiting') UI.toast(`Đang đợi xe buýt đi ${maps[id].name}… 🚌`);
  };

  function boardBus() {
    bus.wantsBoard = false;
    bus.carrying = true;
    player.hidden = true;
    player.target = null;
    player.pending = null;
    player.dancing = 0;
    bus.timer = Math.min(bus.timer, 0.8);
    UI.toast(`Lên xe! Đang đi tới ${destName()}…`);
  }

  function updateBus(dt) {
    const stopX = busStopX();
    if (bus.state === 'away') {
      bus.timer -= dt;
      if (bus.timer <= 0) { bus.state = 'arriving'; bus.x = map.w + 200; }
    } else if (bus.state === 'arriving') {
      const v = Math.max(45, Math.min(400, (bus.x - stopX) * 1.6));
      bus.x -= v * dt;
      if (bus.x <= stopX + 0.5) {
        bus.x = stopX;
        bus.state = 'waiting';
        bus.timer = 5;
        if (bus.carrying) {
          bus.carrying = false;
          player.hidden = false;
          player.x = map.busStop.x + 50;
          player.y = map.busStop.y + 12;
          player.dir = 1;
          UI.toast(`📍 Đã tới ${map.name}`);
          saveNow();
        }
      }
    } else if (bus.state === 'waiting') {
      bus.timer -= dt;
      if (bus.wantsBoard && !player.hidden && Math.hypot(player.x - map.busStop.x, player.y - map.busStop.y) < 150) boardBus();
      if (bus.timer <= 0) {
        if (bus.wantsBoard && !bus.carrying) bus.timer = 1;
        else { bus.state = 'leaving'; bus.v = 0; }
      }
    } else if (bus.state === 'leaving') {
      bus.v = Math.min(460, bus.v + 280 * dt);
      bus.x -= bus.v * dt;
      if (bus.x < -260) {
        if (bus.carrying) { bus.state = 'travel'; fade.mode = 'out'; }
        else { bus.state = 'away'; bus.timer = bus.wantsBoard ? 0.3 : 18 + Math.random() * 18; }
      }
    }
  }

  /** Chuyển thẳng tới một khu (dùng khi mới vào game) */
  AV.teleport = (id, showHelp, x, y, label) => {
    if (!maps[id] || fade.mode) return;
    fade.teleport = id;
    fade.afterHelp = !!showHelp;
    fade.pos = x != null ? [x, y] : null;
    fade.label = label || '🚌 Đang di chuyển…';
    fade.mode = 'out';
  };

  /* ---------- Sự kiện Halloween (tự bật cả tháng 10) ---------- */
  AV.hw = () => {
    const mode = (S.settings && S.settings.halloween) || 'auto';
    return mode === 'on' || (mode === 'auto' && new Date().getMonth() === 9);
  };
  const hwDay = () => new Date().toDateString();
  function hwState() {
    if (!S.hw || S.hw.day !== hwDay()) S.hw = { day: hwDay(), found: {}, npc: {} };
    return S.hw;
  }
  AV.hwFound = (mapId, i) => !!hwState().found[mapId + ':' + i];
  function giveCandy(n, x, y) {
    addItem('candy', n);
    float(`+${n} 🍬`, x ?? player.x, (y ?? player.y) - 110, '#ff922b');
    UI.updateEventBtn();
  }
  AV.hwPickPumpkin = (mapId, i) => {
    if (!AV.hw()) return;
    const st = hwState(), key = mapId + ':' + i;
    if (st.found[key]) return UI.toast('🎃 Bí ngô này hết kẹo rồi, mai quay lại nhé!');
    st.found[key] = true;
    const n = 2 + Math.floor(Math.random() * 3);
    giveCandy(n);
    addXP(4);
    say(player, ['Trick or treat! 🎃', 'Oa, kẹo nè! 🍬', 'Boo! 👻'][Math.floor(Math.random() * 3)]);
    changed();
  };
  /** NPC: cho kẹo hay bị ghẹo — mỗi NPC cho 1 lần mỗi ngày */
  function trickOrTreat(e) {
    const st = hwState();
    if (st.npc[e.name]) return false;
    st.npc[e.name] = true;
    const n = e.hw ? 5 : 2 + Math.floor(Math.random() * 2);
    say(e, e.hw ? 'Hí hí hí… Kẹo phù thuỷ cho cháu nè! 🧙' : ['Kẹo nè, đừng ghẹo nha! 🍬', 'Happy Halloween! 🎃', 'Lấy kẹo đi nè 👻'][Math.floor(Math.random() * 3)]);
    giveCandy(n, e.x, e.y);
    changed();
    return true;
  }
  AV.hwCandy = () => S.inv.candy || 0;
  AV.hwBuy = (it) => {
    const keyOwn = { hat: 'hats', shirt: 'shirtStyles', pet: 'pets' }[it.kind];
    S.owned[keyOwn] = S.owned[keyOwn] || ['none'];
    if (S.owned[keyOwn].includes(it.id)) return UI.toast('Bạn đã có món này rồi');
    if (AV.hwCandy() < it.candy) return UI.toast(`Cần ${it.candy} 🍬 — đi xin kẹo NPC và tìm bí ngô ma lấp lánh nhé!`);
    S.inv.candy -= it.candy;
    S.owned[keyOwn].push(it.id);
    if (it.kind === 'pet') AV.wearPet(it.id); else AV.wear(it.kind, it.id);
    UI.toast(`🎃 Đã đổi ${it.name}!`);
    UI.updateEventBtn();
    changed();
  };
  AV.hwExchange = (n) => {
    n = Math.min(n, AV.hwCandy());
    if (n <= 0) return;
    S.inv.candy -= n;
    S.coins += n * DATA.HALLOWEEN.candyToCoins;
    UI.toast(`Đổi ${n} 🍬 → ${n * DATA.HALLOWEEN.candyToCoins} xu`);
    UI.updateEventBtn();
    changed();
  };

  /* ---------- Thăm nông trại bạn bè ---------- */
  function visitOnly(what) {
    UI.toast(`Đây là nông trại của ${VISIT.data.name} — bạn không thể ${what} ở đây. Bấm ô ruộng để 💧 tưới giúp nhé!`, 3500);
  }

  /** Ghép dữ liệu nông trại tải về với mặc định (bản lưu cũ có thể thiếu) */
  function farmData(f) {
    const d = defaultState();
    const pad = (arr, n, mk) => { const a = Array.isArray(arr) ? arr.map((x) => ({ ...x })) : []; while (a.length < n) a.push(mk()); return a; };
    return {
      name: f.name || f.username, level: f.level || 1, look: { ...d.look, ...(f.look || {}) },
      tiles: pad(f.tiles, d.tiles.length, () => ({ crop: null, plantedAt: 0, watered: false })),
      beds: pad(f.beds, d.beds.length, () => false).map((b, i) => (typeof b === 'object' ? false : b) || (i === 0 || i === 8)),
      trees: pad(f.trees, d.trees.length, () => ({ at: 0 })),
      coop: f.coop || { fedAt: 0 }, pen: f.pen || { fedAt: 0 },
    };
  }

  AV.visitFarm = async (username) => {
    if (!CLOUD.user) return UI.toast('🔐 Cần đăng nhập tài khoản để thăm nông trại bạn bè');
    const u = String(username || '').trim().toLowerCase();
    if (!u) return;
    if (u === CLOUD.username) return AV.goHomeFarm();
    if (fade.mode) return;
    UI.toast(`🔍 Đang tìm nông trại của ${u}…`);
    let f;
    try { f = await CLOUD.getFarm(u); } catch (e) { return UI.toast('⚠️ ' + e.message, 6000); }
    if (!f || !f.user_id) return UI.toast(`Không tìm thấy người chơi "${u}" — kiểm tra lại tên đăng nhập nhé`, 4000);
    if (swingRide) AV.leaveSwing();
    VISIT = { uid: f.user_id, username: u, data: farmData(f), helped: false };
    AV.teleport('farm', false, 1600, 1350, `🏡 Đi thăm nông trại của ${VISIT.data.name}…`);
  };

  AV.goHomeFarm = () => {
    VISIT = null;
    if (fade.mode) return;
    AV.teleport('farm', false, 1600, 1350, '🌾 Về nông trại của bạn…');
  };

  /** Tưới giúp cả nông trại của bạn đang thăm (1 lần / bạn / ngày, chủ nhận khi online) */
  AV.helpWater = async () => {
    if (!VISIT) return;
    const name = VISIT.data.name;
    if (VISIT.helped) return UI.toast(`Bạn đã tưới giúp ${name} rồi 💧`);
    const need = VISIT.data.tiles.filter((t) => t.crop && !t.watered && tileState(t).stage < 2).length;
    if (!need) return UI.toast(`Ruộng của ${name} không cần tưới lúc này 🌱`);
    try { await CLOUD.sendHelp(VISIT.uid, S.name); } catch (e) { return UI.toast('⚠️ ' + e.message, 4500); }
    VISIT.helped = true;
    VISIT.data.tiles.forEach((t) => { if (t.crop) t.watered = true; });
    addXP(12);
    float('💧 Tưới giúp +12 XP', player.x, player.y - 120, '#a5d8ff');
    say(player, `💧 Tưới giúp ${name} nè!`);
    NET.sendSys(`${S.name} đã tưới giúp ${need} cây cho ${name} 💧`);
    AV.quest('help');
    changed();
  };

  /** Chủ nông trại: nhận các lời tưới giúp của bạn bè (tưới cả nông trại) */
  async function receiveHelps() {
    if (!CLOUD.user || VISIT) return;
    let rows = [];
    try { rows = await CLOUD.pullHelps(); } catch (e) { return; }
    if (!rows.length) return;
    let n = 0;
    for (let b = 0; b < S.beds.length; b++) if (S.beds[b]) n += bedTiles(b).filter((t) => t.crop && !t.watered).length && waterBed(b);
    const names = [...new Set(rows.map((r) => r.helper_name || 'Bạn bè'))].join(', ');
    addXP(4 * rows.length);
    UI.toast(`💧 ${names} đã tưới giúp nông trại của bạn! Cây lớn nhanh hơn rồi đó 🌱`, 6000);
    UI.chatLog('', `💧 ${names} đã tưới giúp nông trại của bạn`, false, true);
    changed();
  }
  AV.receiveHelps = receiveHelps;
  setInterval(receiveHelps, 60000);

  /* ---------- Máy game: nhận điểm từ trò chơi, đổi ra xu ---------- */
  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type === 'arcade-close') return UI.closeArcade();
    if (m.type !== 'arcade-score') return;
    const g = DATA.ARCADE.find((x) => x.id === m.game);
    const score = Math.max(0, Math.floor(+m.score || 0));
    if (!g || !UI.arcadeOpen()) return;
    const coins = Math.min(40, Math.floor(score / g.div));
    const xp = Math.min(30, 2 + Math.floor(coins / 2));
    if (coins > 0) { S.coins += coins; }
    addXP(xp);
    AV.quest('arcade');
    changed();
    UI.toast(coins > 0 ? `🕹️ ${g.name}: ${score} điểm → +${coins} xu, +${xp} XP` : `🕹️ ${g.name}: ${score} điểm → +${xp} XP (chơi giỏi hơn để nhận xu nhé!)`, 4000);
  });

  /* ---------- Xích đu & vọng lâu ở Sân Chơi ---------- */
  let swingRide = null;
  AV.useSwing = (idx) => {
    const s = map.swings && map.swings[idx];
    if (!s) return;
    if (swingRide) return AV.leaveSwing();
    swingRide = { s, t: 0 };
    player.seated = true;
    player.target = null; player.pending = null; marker = null;
    say(player, ['Wiii~ 🎶', 'Bay cao nào! 🌤️', 'Vui quá đi! 😆'][Math.floor(Math.random() * 3)]);
    if (!S.lastSwing || Date.now() - S.lastSwing > 10 * 60000) { S.lastSwing = Date.now(); addXP(6); float('+6 XP', player.x, player.y - 120, '#a5d8ff'); changed(); }
    UI.toast('🎠 Đang chơi xích đu — bấm vào màn hình để xuống');
  };
  AV.leaveSwing = () => {
    if (!swingRide) return;
    const s = swingRide.s;
    s.a = 0;
    swingRide = null;
    AV.leaveSeat(s.px, s.py + 170);
  };
  function updateSwings(dt) {
    if (!map.swings) return;
    map.swings.forEach((s, i) => {
      if (swingRide && swingRide.s === s) return;
      s.a = Math.sin(clock * 1.3 + i * 1.7) * 0.06;
    });
    if (!swingRide) return;
    swingRide.t += dt;
    const s = swingRide.s, amp = Math.min(0.55, 0.1 + swingRide.t * 0.12);
    s.a = Math.sin(swingRide.t * 2.4) * amp;
    const sx = s.px + Math.sin(s.a) * 96, sy = s.py + Math.cos(s.a) * 96;
    player.x = sx; player.y = sy + 20; player.dir = Math.cos(swingRide.t * 2.4) > 0 ? 1 : -1;
  }
  AV.restGazebo = () => homeActivity('lastRest', 20, 6, '🍵 Ngồi nghỉ ở vọng lâu thật thư thái! +6 XP', '🍵 Mát quá~', 'Vừa nghỉ xong mà');

  /* ---------- Vào / ra nhà ---------- */
  AV.enterHome = () => VISIT ? UI.toast(`🏠 Nhà của ${VISIT.data.name} đang khoá cửa`) : AV.teleport('home', false, 800, 900, '🏠 Vào nhà…');
  AV.leaveHome = () => AV.teleport('farm', false, 2520, 762, '🌾 Ra nông trại…');

  /** Hoạt động trong nhà, có thời gian chờ để không spam XP */
  function homeActivity(key, cooldownMin, xp, msg, bubble, waitMsg) {
    const last = S[key] || 0, wait = cooldownMin * 60000 - (Date.now() - last);
    if (wait > 0) { UI.toast(`${waitMsg} (còn ${fmtDur(wait / 1000)})`); say(player, bubble); return; }
    S[key] = Date.now();
    addXP(xp);
    say(player, bubble);
    float(`+${xp} XP`, player.x, player.y - 120, '#a5d8ff');
    UI.toast(msg);
    changed();
  }
  AV.sleep = () => homeActivity('lastSleep', 120, 30, '😴 Ngủ một giấc thật ngon! +30 XP', '😴 Zzz…', 'Bạn chưa buồn ngủ');
  AV.bathe = () => homeActivity('lastBath', 60, 15, '🛁 Tắm xong thơm tho quá! +15 XP', '🛁 La la la~', 'Vừa tắm xong mà');
  AV.watchTV = () => homeActivity('lastTV', 30, 8, '📺 Xem TV vui ghê! +8 XP', '📺 Phim hay quá!', 'Xem nhiều quá mỏi mắt đó');

  /** Rương cất đồ: chuyển vật phẩm giữa túi và rương */
  AV.storeItem = (id, toChest) => {
    S.storage = S.storage || {};
    const from = toChest ? S.inv : S.storage, to = toChest ? S.storage : S.inv;
    const n = from[id] || 0;
    if (!n) return;
    from[id] = 0;
    to[id] = (to[id] || 0) + n;
    changed();
  };

  function updateFade(dt) {
    if (fade.mode === 'out') {
      fade.a = Math.min(1, fade.a + dt * 2.5);
      if (fade.a >= 1 && fade.teleport) {
        const id = fade.teleport;
        fade.teleport = null;
        const pos = fade.pos || (maps[id].busStop ? [maps[id].busStop.x + 50, maps[id].busStop.y + 12] : [maps[id].spawn.x, maps[id].spawn.y]);
        enterMap(id, pos[0], pos[1]);
        player.hidden = false;
        fade.mode = 'in';
        if (!fade.pos) UI.toast(`📍 Chào mừng tới ${map.name}!`);
        saveNow();
        if (fade.afterHelp) { fade.afterHelp = false; setTimeout(UI.help, 800); }
      } else if (fade.a >= 1) {
        const dest = maps[bus.dest] && bus.dest !== map.id ? bus.dest : (map.id === 'farm' ? 'town' : 'farm');
        enterMap(dest, maps[dest].busStop.x + 50, maps[dest].busStop.y + 12);
        player.hidden = true;
        bus.state = 'arriving';
        bus.x = map.w + 120;
        fade.mode = 'in';
      }
    } else if (fade.mode === 'in') {
      fade.a = Math.max(0, fade.a - dt * 2.5);
      if (fade.a <= 0) fade.mode = null;
    }
  }

  /* ---------- Chat ---------- */
  function say(ent, text) {
    const big = /^\p{Extended_Pictographic}[\u{FE0F}\u{200D}\p{Extended_Pictographic}]*$/u.test(text);
    ent.bubble = { text, until: Date.now() + (big ? 2500 : 4500 + text.length * 40), big };
  }

  function reply(npc, text) {
    const t = text.toLowerCase();
    let r;
    if (/chào|hello|\bhi\b|xin chào|alo/.test(t)) r = `Chào ${S.name}! 👋`;
    else if (/tên/.test(t)) r = `Mình là ${npc.name} nè!`;
    else if (/bạn/.test(t)) r = 'Làm bạn với nhau nhé! 🤝';
    else if (/mua|bán|chợ|hạt/.test(t)) r = 'Chợ ở Khu mua sắm nha, bấm 🗺️ Bản đồ rồi đi xe buýt!';
    else if (/áo|mũ|nón|đồ|thời trang/.test(t)) r = 'Tiệm Thời Trang ở Khu mua sắm, đồ xinh lắm!';
    else if (/xe|buýt|bus|nông trại/.test(t)) r = 'Trạm xe buýt ở ngay dưới đường kìa.';
    else if (/\p{Extended_Pictographic}/u.test(t) && t.length <= 4) r = text;
    else r = ['Haha, vui ghê!', 'Thật hả? 😮', 'Mình cũng nghĩ vậy!', '😄', 'Hay quá đi!', 'Ừ ừ!', 'Kể tiếp đi!'][Math.floor(Math.random() * 7)];
    npc.dir = player.x < npc.x ? -1 : 1;
    npc.wait = Math.max(npc.wait, 3);
    say(npc, r);
  }

  const SOUNDS = { chicken: 'Cục ta cục tác!', cow: 'Ùmm boò~', sheep: 'Be be be~', pig: 'Ụt ịt!', dog: 'Gâu gâu! 🐶' };

  AV.showBubble = (ent, text) => say(ent, text);

  AV.say = (text) => {
    if (player.hidden) return;
    say(player, text);
    NET.sendChat(text);
    UI.chatLog(S.name, text, true);
    if (checkQuizAnswer(text)) return;
    if (!/^\p{Extended_Pictographic}/u.test(text)) AV.quest('chat');
    const near = map.npcs
      .map((n) => ({ n, d: Math.hypot(n.x - player.x, n.y - player.y) }))
      .filter((o) => o.d < 320 && !o.n.teacher)
      .sort((a, b) => a.d - b.d)[0];
    if (near) setTimeout(() => reply(near.n, text), 900 + Math.random() * 600);
  };

  function poke(e) {
    if (e.kind === 'remote') {
      UI.playerCard(e);
      return;
    }
    if (e.teacher) {
      const q = QUIZ.current();
      say(e, q.open ? q.q : `Đáp án: ${q.answer} ✨`);
      return;
    }
    if (e.kind === 'npc') {
      e.dir = player.x < e.x ? -1 : 1;
      e.wait = Math.max(e.wait, 3);
      e.moving = false;
      if (AV.hw() && trickOrTreat(e)) return;
      if (e.hw && !AV.hw()) return;
      say(e, [`Chào ${S.name}!`, 'Hôm nay bạn khoẻ không?', 'Ghé Chợ chơi nha!', 'Đồ bạn mặc xinh quá!'][Math.floor(Math.random() * 4)]);
    } else {
      say(e, SOUNDS[e.kind]);
      float('❤️', e.x, e.y - 50);
      e.wait = 1.5;
      e.moving = false;
    }
  }

  /* ---------- Cập nhật ---------- */
  const keys = new Set();

  function updatePlayer(dt) {
    player.t += dt;
    if (player.hidden || player.seated) { player.moving = false; return; }
    let vx = 0, vy = 0;
    const kx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    const ky = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    if (!UI.isBlocking() && (kx || ky)) {
      const l = Math.hypot(kx, ky);
      vx = kx / l * SPEED; vy = ky / l * SPEED;
      player.target = null; player.pending = null; marker = null;
    } else if (player.target) {
      const dx = player.target.x - player.x, dy = player.target.y - player.y, d = Math.hypot(dx, dy);
      if (d < 4) {
        if (player.path && player.path.length) player.target = player.path.shift();
        else { player.target = null; marker = null; }
      }
      else {
        const sp = Math.min(SPEED, d / dt);
        vx = dx / d * sp; vy = dy / d * sp;
      }
    }
    if (vx || vy) {
      const moved = tryMove(player, vx * dt, vy * dt);
      player.moving = moved;
      if (Math.abs(vx) > 1) player.dir = vx > 0 ? 1 : -1;
      if (!moved && player.target) {
        player.stuck += dt;
        if (player.stuck > 0.35) {
          player.stuck = 0;
          if (player.goal && (player.repath || 0) < 2) {
            const g = player.goal, n = (player.repath || 0) + 1;
            const p = findPath(player.x, player.y, g.x, g.y);
            if (p && p.length) { player.target = p.shift(); player.path = p; player.repath = n; }
            else { player.target = null; player.path = []; marker = null; }
          } else { player.target = null; player.path = []; marker = null; }
        }
      } else player.stuck = 0;
    } else player.moving = false;

    const p = player.pending;
    if (p) {
      const d = Math.hypot(p.ax - player.x, p.ay - player.y);
      if (d < 16 || (!player.target && d < 110)) {
        player.pending = null; player.target = null; marker = null;
        p.use();
      } else if (!player.target) {
        player.pending = null;
        UI.toast('Không tới được chỗ đó 🤔');
      }
    }
  }

  function wander(e, dt, speed, useCollision) {
    e.t += dt;
    if (e.wait > 0) { e.wait -= dt; e.moving = false; return; }
    const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy);
    if (d < 3) {
      e.wait = 1 + Math.random() * 4;
      e.peck = e.kind === 'chicken' && Math.random() < 0.6;
      const a = e.area;
      e.tx = a.l + Math.random() * (a.r - a.l);
      e.ty = a.t + Math.random() * (a.b - a.t);
      e.moving = false;
      return;
    }
    const step = Math.min(d, speed * dt);
    const mx = dx / d * step, my = dy / d * step;
    if (useCollision) {
      if (!tryMove(e, mx, my)) { e.tx = e.x; e.ty = e.y; }
    } else { e.x += mx; e.y += my; }
    e.dir = dx > 0 ? 1 : -1;
    e.moving = true;
    e.peck = false;
  }

  const ANIMAL_SPEED = { chicken: 45, cow: 26, sheep: 30, pig: 32, dog: 70 };

  function update(dt) {
    clock += dt;
    now = Date.now();
    updatePlayer(dt);
    map.animals.forEach((a) => wander(a, dt, ANIMAL_SPEED[a.kind], false));
    map.npcs.forEach((n) => {
      wander(n, dt, 60, true);
      n.nextTalk -= dt;
      if (n.nextTalk <= 0) {
        n.nextTalk = 10 + Math.random() * 14;
        if (!n.bubble || n.bubble.until < now) say(n, DATA.NPC_LINES[Math.floor(Math.random() * DATA.NPC_LINES.length)]);
      }
      if (n.look.pet && n.look.pet !== 'none') {
        n.petState = n.petState || { x: n.x - 30, y: n.y, dir: 1, t: 0, moving: false };
        followPet(n.petState, n, dt, n.dir);
      }
    });
    if (S.look.pet && S.look.pet !== 'none') followPet(myPet, player, dt, player.dir);
    if (player.dancing && player.dancing < now) { player.dancing = 0; NET.sendState(); }
    spawnPickups(dt);
    updateFishing();
    updateActionButton();
    updateQuiz();
    updateQuizBar();
    const nearPk = !player.hidden && map.pickups.find((p) => Math.hypot(p.x - player.x, p.y - player.y) < 20);
    if (nearPk) collectPickup(nearPk);
    if (map.busStop) updateBus(dt);
    updateSwings(dt);
    TABLE.tick(dt);
    NET.tick(dt);
    NET.update(dt);
    updateFade(dt);
    for (let i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t > 1.4) floats.splice(i, 1); }
    if (marker) marker.t += dt;
  }

  /* ---------- Vẽ ---------- */
  let cam = { x: 0, y: 0 };

  /* Kéo bản đồ: camOff = độ lệch so với vị trí nhân vật. Nhân vật đi thì camera từ từ quay về */
  const camOff = { x: 0, y: 0 };
  let zoomMul = 1;
  function updateCamera() {
    const vw = W / ZOOM, vh = H / ZOOM;
    if (!drag.active && (player.moving || player.seated || player.hidden)) { camOff.x *= 0.9; camOff.y *= 0.9; }
    const clampX = (v) => (vw >= map.w ? map.w / 2 : Math.max(vw / 2, Math.min(map.w - vw / 2, v)));
    const clampY = (v) => (vh >= map.h ? map.h / 2 : Math.max(vh / 2, Math.min(map.h - vh / 2, v)));
    const bx = player.x, by = player.y - 150;
    cam.x = clampX(bx + camOff.x); cam.y = clampY(by + camOff.y);
    // không cho độ lệch vượt quá mép bản đồ (để kéo ngược lại có tác dụng ngay)
    camOff.x = cam.x - bx; camOff.y = cam.y - by;
    const away = Math.hypot(camOff.x, camOff.y) > 260;
    if (away !== recenterShown) { recenterShown = away; document.getElementById('recenterBtn').classList.toggle('show', away); }
  }
  let recenterShown = false;
  AV.recenter = () => { camOff.x = 0; camOff.y = 0; };

  function progressBar(x, y, p) {
    ctx.fillStyle = '#3d2410';
    ART.rr(ctx, x - 27, y - 6, 54, 12, 4); ctx.fill();
    ctx.fillStyle = '#69db7c';
    ART.rr(ctx, x - 25, y - 4, 50 * Math.min(1, p), 8, 3); ctx.fill();
  }

  /* Thế giới được vẽ vào bộ đệm độ phân giải thấp rồi phóng to không làm mịn → nét pixel kiểu Avatar */
  const wbuf = document.createElement('canvas');
  const wctx = wbuf.getContext('2d');
  const pixelSize = () => (S.settings && S.settings.pixelArt ? 2 : 0);
  const BOX_BUS = { l: -168, t: -145, w: 336, h: 155 };
  const BOX_PICK = { l: -16, t: -32, w: 32, h: 36 };

  /** Vẽ nền của khu ở độ phân giải phù hợp (tối đa 2x để tiết kiệm bộ nhớ) */
  function ensureGround(m, scale) {
    // bản đồ lớn: giới hạn khoảng 9 triệu điểm ảnh để không tốn bộ nhớ
    const gs = Math.max(1, Math.min(2, scale, Math.sqrt(9e6 / (m.w * m.h))));
    if (m.ground && m.groundScale === gs) return;
    const c = m.ground || document.createElement('canvas');
    c.width = Math.round(m.w * gs);
    c.height = Math.round(m.h * gs);
    const gc = c.getContext('2d');
    gc.setTransform(gs, 0, 0, gs, 0, 0);
    m.paintGround(gc);
    m.ground = c;
    m.groundScale = gs;
  }

  /** Viết câu hỏi lên bảng đen bằng chữ phấn */
  function drawBoard(b) {
    const q = QUIZ.current();
    const x = b.x, top = b.y - 222;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe066'; ctx.font = '800 13px "Be Vietnam Pro", system-ui';
    ctx.fillText(q.open ? `❓ ĐỐ VUI TIẾNG ANH · còn ${q.left}s` : `✨ ĐÁP ÁN · câu mới sau ${q.left}s`, x, top + 16);
    ctx.fillStyle = '#fff'; ctx.font = '800 17px "Be Vietnam Pro", system-ui';
    const words = q.q.split(' '); const lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > 300 && cur) { lines.push(cur); cur = w; } else cur = t; }
    lines.push(cur);
    lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, x, top + 44 + i * 22));
    if (q.open) {
      ctx.font = '700 13px "Be Vietnam Pro", system-ui'; ctx.fillStyle = '#d3f9d8';
      q.choices.forEach((c, i) => ctx.fillText(`${'ABCD'[i]}. ${c}`, x - 80 + (i % 2) * 160, top + 98 + Math.floor(i / 2) * 20));
    } else {
      ctx.font = '900 22px "Be Vietnam Pro", system-ui'; ctx.fillStyle = '#ffe066';
      ctx.fillText(q.answer, x, top + 108);
    }
  }

  /** Mức tối của trời (0 = ngày, 1 = đêm) theo giờ thật hoặc theo cài đặt */
  function nightFactor() {
    const mode = (S.settings && S.settings.time) || 'real';
    if (mode === 'day') return 0;
    if (mode === 'night') return 1;
    const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
    if (h >= 19 || h < 5) return 1;
    if (h >= 17.5) return (h - 17.5) / 1.5;
    if (h < 6) return 1 - (h - 5);
    return 0;
  }

  function worldTransform(c, scale, offX, offY) {
    c.setTransform(scale, 0, 0, scale, offX, offY);
  }

  function draw() {
    updateCamera();
    const px = pixelSize();
    let g, bw = 0, bh = 0;
    if (px) {
      bw = Math.ceil(W / px); bh = Math.ceil(H / px);
      if (wbuf.width !== bw || wbuf.height !== bh) { wbuf.width = bw; wbuf.height = bh; }
      g = wctx;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#72c844';
      g.fillRect(0, 0, bw, bh);
      worldTransform(g, ZOOM / px, (W / 2 - cam.x * ZOOM) / px, (H / 2 - cam.y * ZOOM) / px);
    } else {
      g = ctx;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = '#72c844';
      ctx.fillRect(0, 0, W, H);
      worldTransform(ctx, DPR * ZOOM, DPR * (W / 2 - cam.x * ZOOM), DPR * (H / 2 - cam.y * ZOOM));
    }
    g.imageSmoothingEnabled = true;
    ensureGround(map, px ? 1 : FX.scale);
    g.drawImage(map.ground, 0, 0, map.w, map.h);
    if (!map.indoor) ART.backdrop(g, map.w, map.hz, cam.x, clock, map.id === 'beach');
    const night = map.indoor ? 0 : nightFactor();
    ART.nightSky(g, map.w, map.hz, night, clock);

    if (marker) {
      const sc = 1 + (marker.t % 0.8);
      g.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.9 - (marker.t % 0.8))})`;
      g.lineWidth = 2.5;
      g.beginPath(); g.ellipse(marker.x, marker.y, 10 * sc, 4 * sc, 0, 0, Math.PI * 2); g.stroke();
    }

    const out = (fn, x, y, box, key, ms = 55) => FX.drawCached(g, key, fn, x, y, box, ms);
    const list = map.objects.slice();
    map.animals.forEach((a) => list.push({ y: a.y, draw: () => {
      if (a.kind === 'chicken') out((c) => ART.chicken(c, a.x, a.y, a.dir, a.t, a.moving, a.peck), a.x, a.y, FX.BOX.chicken, a);
      else if (a.kind === 'cow') out((c) => ART.cow(c, a.x, a.y, a.dir, a.t, a.moving, a.seed), a.x, a.y, FX.BOX.cow, a);
      else if (a.kind === 'sheep') out((c) => ART.sheep(c, a.x, a.y, a.dir, a.t, a.moving), a.x, a.y, FX.BOX.sheep, a);
      else if (a.kind === 'dog') out((c) => { c.save(); c.translate(a.x, a.y); c.scale(1.5, 1.5); ART.pet(c, 0, 0, 'dog', a.dir, a.t, a.moving); c.restore(); }, a.x, a.y, { l: -55, t: -80, w: 110, h: 86 }, a);
      else out((c) => ART.pig(c, a.x, a.y, a.dir, a.t, a.moving), a.x, a.y, FX.BOX.pig, a);
    } }));
    map.pickups.forEach((p) => list.push({ y: p.y, draw: () => out((c) => ART.pickup(c, p.x, p.y, p.item.icon, clock), p.x, p.y, BOX_PICK, p, 120) }));
    const petDraw = (p, kind) => list.push({ y: p.y, draw: () => out((c) => ART.pet(c, p.x, p.y, kind, p.dir, p.t, p.moving), p.x, p.y, FX.BOX.pet, p) });
    const charDraw = (x, y, look, o, key) => list.push({ y, draw: () => out((c) => ART.character(c, x, y, look, o), x, y, FX.BOX.character, key) });
    map.npcs.forEach((n) => {
      if (n.hw && !AV.hw()) return;
      charDraw(n.x, n.y, n.look, n, n);
      if (n.petState) petDraw(n.petState, n.look.pet);
    });
    const others = NET.players().filter((r) => !r.hidden);
    others.forEach((r) => {
      charDraw(r.rx, r.ry, r.look, { t: r.t, dir: r.dir, moving: r.walking, dance: r.dance }, r);
      if (r.pet && r.look.pet && r.look.pet !== 'none') petDraw(r.pet, r.look.pet);
    });
    const rodDraw = (x, y, f) => list.push({ y: y + 1, draw: () => ART.fishingRod(g, x, y, f.bx, f.by, clock, f.state === 'bite' || f.bite) });
    others.forEach((r) => { if (r.fish) rodDraw(r.rx, r.ry, r.fish); });
    if (player.fishing && !player.hidden) rodDraw(player.x, player.y, player.fishing);
    if (!player.hidden) {
      charDraw(player.x, player.y, S.look, { ...player, dance: player.dancing > now }, player);
      if (S.look.pet && S.look.pet !== 'none') petDraw(myPet, S.look.pet);
    }
    if (map.busStop && bus.state !== 'away' && bus.state !== 'travel') {
      const busY = map.busY || BUS_Y;
      list.push({ y: busY, draw: () => out((c) => ART.bus(c, bus.x, busY, clock, bus.state !== 'waiting'), bus.x, busY, BOX_BUS, bus, 70) });
    }
    list.sort((a, b) => a.y - b.y);
    list.forEach((o) => o.draw(g, clock));
    if (AV.hw() && !map.indoor) {
      const vw = W / ZOOM, vh = H / ZOOM;
      if (map.hz > 0) ART.hwBunting(g, Math.max(0, cam.x - vw / 2 - 60), Math.min(map.w, cam.x + vw / 2 + 60), map.hz - 40, clock);
      ART.hwSky(g, cam.x, cam.y, vw, vh, clock, map.hz);
    }
    if (night > 0) {
      const vw = W / ZOOM, vh = H / ZOOM;
      g.fillStyle = `rgba(16,26,72,${0.45 * night})`;
      g.fillRect(cam.x - vw / 2 - 10, map.hz, vw + 20, vh + 400);
      ART.fireflies(g, cam.x, cam.y, vw, vh, night, clock);
      if (map.lights) {
        g.save();
        g.globalCompositeOperation = 'lighter';
        for (const [lx, ly, lr, kind] of map.lights) {
          if (kind === 'hw' && !AV.hw()) continue;
          if (Math.abs(lx - cam.x) > vw / 2 + lr || Math.abs(ly - cam.y) > vh / 2 + lr) continue;
          const gr = g.createRadialGradient(lx, ly, 2, lx, ly, lr);
          gr.addColorStop(0, `rgba(255,200,110,${0.38 * night})`); gr.addColorStop(1, 'rgba(255,180,80,0)');
          g.fillStyle = gr; g.beginPath(); g.arc(lx, ly, lr, 0, Math.PI * 2); g.fill();
        }
        g.restore();
      }
    }

    if (px) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(wbuf, 0, 0, bw, bh, 0, 0, bw * px * DPR, bh * px * DPR);
      ctx.imageSmoothingEnabled = true;
    }

    // Lớp chữ & giao diện trong thế giới: vẽ ở độ phân giải đầy đủ cho sắc nét
    worldTransform(ctx, DPR * ZOOM, DPR * (W / 2 - cam.x * ZOOM), DPR * (H / 2 - cam.y * ZOOM));
    map.labels.forEach((l) => ART.label(ctx, l.dynamic === 'home' ? `🏠 Nhà ${FD().name || 'của bạn'}` : l.dynamic === 'gate' ? `Nông trại của ${FD().name || 'bạn'}` : l.text, l.x, l.y));
    map.inter.forEach((o) => {
      if (!o.indicator) return;
      const r = o.indicator();
      if (r == null) return;
      if (typeof r === 'object') ART.timerLabel(ctx, o.ix, o.iy, r.left, r.p);
      else ART.iconBubble(ctx, r, o.ix, o.iy - 14, clock);
    });

    if (map.board) drawBoard(map.board);

    // mũi tên vàng "Vào" trước cửa
    map.inter.forEach((o) => { if (o.arrow && (!o.hw || AV.hw())) ART.doorArrow(ctx, o.arrow.x, o.arrow.y, clock, o.arrow.text); });

    // bảng tên gỗ dưới chân như Avatar
    map.npcs.forEach((n) => { if (!n.hw || AV.hw()) ART.namePlate(ctx, n.name, n.x, n.y + 6, 'npc'); });
    others.forEach((r) => ART.namePlate(ctx, r.name, r.rx, r.ry + 6, 'other'));
    if (!player.hidden) ART.namePlate(ctx, S.name || 'Bạn', player.x, player.y + 6, 'me');

    const headTop = (look) => (look && look.hat === 'nonla' ? 134 : 120);
    const bubbleOf = (e) => {
      if (e.bubble && e.bubble.until > now) {
        const top = e.kind === 'npc' || e === player ? headTop(e === player ? S.look : e.look) : 52;
        ART.bubble(ctx, e.bubble.text, e.x, e.y - top, e.bubble.big);
      }
    };
    map.animals.forEach(bubbleOf);
    map.npcs.forEach(bubbleOf);
    others.forEach((r) => {
      if (r.bubble && r.bubble.until > now) ART.bubble(ctx, r.bubble.text, r.rx, r.ry - headTop(r.look), r.bubble.big);
    });
    if (!player.hidden) bubbleOf(player);
    if (player.fishing && player.fishing.state === 'bite') ART.biteMark(ctx, player.x, player.y - headTop(S.look) - 6, clock);
    others.forEach((r) => { if (r.fish && r.fish.bite) ART.biteMark(ctx, r.rx, r.ry - headTop(r.look) - 6, clock); });

    floats.forEach((f) => {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
      ctx.font = '800 17px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,30,40,.7)';
      ctx.strokeText(f.text, f.x, f.y - f.t * 40);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y - f.t * 40);
      ctx.globalAlpha = 1;
    });

    if (hover && !UI.isBlocking()) {
      const hx = hover.x + hover.w / 2;
      ctx.font = '700 13px "Be Vietnam Pro", system-ui';
      const w = ctx.measureText(hover.name).width + 18;
      ctx.fillStyle = '#5a3010';
      ART.rr(ctx, hx - w / 2 - 2, hover.y + hover.h + 2, w + 4, 28, 9); ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ART.rr(ctx, hx - w / 2, hover.y + hover.h + 4, w, 24, 8); ctx.fill();
      ctx.fillStyle = '#3d1f08'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(hover.name, hx, hover.y + hover.h + 16.5);
    }

    if (fade.a > 0) {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = `rgba(15,20,35,${fade.a})`;
      ctx.fillRect(0, 0, W, H);
      if (fade.a > 0.6) {
        ctx.fillStyle = '#fff';
        ctx.font = '800 22px "Be Vietnam Pro", system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(fade.label || '🚌 Đang di chuyển…', W / 2, H / 2);
      }
    }
  }

  /* ---------- Điều khiển ---------- */
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    applyZoom();
  }

  function applyZoom() {
    const baseZoom = Math.max(0.62, Math.min(1.15, Math.min(W / 1050, H / 720)));
    ZOOM = baseZoom * (typeof zoomMul === 'number' ? zoomMul : 1);
    FX.setScale(DPR * ZOOM);
  }

  function toWorld(cx, cy) {
    return { x: (cx - W / 2) / ZOOM + cam.x, y: (cy - H / 2) / ZOOM + cam.y };
  }

  function entityAt(x, y) {
    const remote = NET.players().find((r) => !r.hidden && Math.abs(x - r.rx) < 26 && y < r.ry + 6 && y > r.ry - 100);
    if (remote) return remote;
    return [...map.npcs, ...map.animals].find((e) => {
      const h = e.kind === 'npc' ? 100 : e.kind === 'chicken' ? 34 : 54;
      const w = e.kind === 'npc' ? 26 : e.kind === 'chicken' ? 18 : 34;
      return Math.abs(x - e.x) < w && y < e.y + 6 && y > e.y - h;
    });
  }

  function interAt(x, y) {
    const hits = map.inter.filter((o) => (!o.hw || AV.hw()) && x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h);
    hits.sort((a, b) => a.w * a.h - b.w * b.h);
    return hits[0] || null;
  }

  /* Chạm = đi tới; kéo 1 ngón / chuột = trượt bản đồ; chụm 2 ngón / lăn chuột = phóng to thu nhỏ */
  const drag = { active: false, moved: false, sx: 0, sy: 0, lx: 0, ly: 0, pointers: new Map(), pinch: 0, pinchZoom: 1 };
  const DRAG_PX = 10;
  function tap(e) {
    if (UI.isBlocking() || player.hidden || fade.mode) return;
    if (player.fishing && player.fishing.state === 'bite') { AV.pullRod(); return; }
    if (TABLE.seated()) { TABLE.openView(); return; }
    clickWorld(toWorld(e.clientX, e.clientY));
  }
  canvas.addEventListener('pointerdown', (e) => {
    document.activeElement && document.activeElement.blur();
    if (UI.isBlocking() || fade.mode) return;
    // cá cắn câu: giật cần ngay khi chạm, không đợi nhấc tay
    if (player.fishing && player.fishing.state === 'bite') { AV.pullRod(); return; }
    try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ }
    drag.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (drag.pointers.size === 2) {
      const [a, b] = [...drag.pointers.values()];
      drag.pinch = Math.hypot(a.x - b.x, a.y - b.y);
      drag.pinchZoom = zoomMul;
      drag.moved = true;
      return;
    }
    Object.assign(drag, { active: true, moved: false, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY });
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag.pointers.has(e.pointerId)) return;
    drag.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (drag.pointers.size >= 2) {
      const [a, b] = [...drag.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (drag.pinch > 0) setZoomMul(drag.pinchZoom * d / drag.pinch);
      return;
    }
    if (!drag.active) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > DRAG_PX) drag.moved = true;
    if (drag.moved) {
      camOff.x -= (e.clientX - drag.lx) / ZOOM;
      camOff.y -= (e.clientY - drag.ly) / ZOOM;
      canvas.style.cursor = 'grabbing';
    }
    drag.lx = e.clientX; drag.ly = e.clientY;
  });
  const endPointer = (e, cancel) => {
    if (!drag.pointers.has(e.pointerId)) return;
    drag.pointers.delete(e.pointerId);
    if (drag.pointers.size > 0) return;
    const wasTap = drag.active && !drag.moved && !cancel;
    drag.active = false;
    canvas.style.cursor = 'default';
    if (wasTap) tap(e);
  };
  canvas.addEventListener('pointerup', (e) => endPointer(e, false));
  canvas.addEventListener('pointercancel', (e) => endPointer(e, true));
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); setZoomMul(zoomMul * (e.deltaY > 0 ? 0.9 : 1.1)); }, { passive: false });

  function setZoomMul(z) {
    zoomMul = Math.max(0.6, Math.min(1.8, z));
    applyZoom();
  }

  /** Xử lý một cú bấm tại toạ độ thế giới w */
  function clickWorld(w) {
    if (swingRide) { AV.leaveSwing(); return; }
    const pk = map.pickups.find((p) => Math.abs(p.x - w.x) < 22 && w.y > p.y - 30 && w.y < p.y + 8);
    if (pk) {
      goTo(pk.x, pk.y + 4);
      player.pending = { ax: pk.x, ay: pk.y + 4, use: () => collectPickup(pk) };
      marker = { x: pk.x, y: pk.y + 4, t: 0 };
      return;
    }
    // bấm vào biểu tượng trạng thái (🥛 🥚 🌾 đồng hồ…) = bấm vào chỗ đó
    const ind = map.inter.find((o) => o.indicator && o.indicator() != null && Math.hypot(w.x - o.ix, w.y - (o.iy - 14)) < 28);
    const ent = ind ? null : entityAt(w.x, w.y);
    // bấm vào con vật trong nông trại = vào chuồng thu hoạch / cho ăn
    const herd = ent && map.id === 'farm' && ent.kind !== 'npc' && ent.kind !== 'remote' && ent.kind !== 'dog'
      ? map.inter.find((o) => o.group === (ent.kind === 'chicken' ? 'coop' : 'pen')) : null;
    if (ent && !herd) { poke(ent); return; }
    if (herd) say(ent, SOUNDS[ent.kind]);
    const o = ind || herd || interAt(w.x, w.y);
    if (o) {
      // chuồng có nhiều chỗ đứng (trên, dưới, bên hông): chọn chỗ gần nhân vật nhất
      const [ax, ay] = (o.approaches || [[o.ax, o.ay]]).reduce((b, p) => (Math.hypot(p[0] - player.x, p[1] - player.y) < Math.hypot(b[0] - player.x, b[1] - player.y) ? p : b));
      goTo(ax, ay);
      player.pending = { ax, ay, use: o.use };
      marker = { x: ax, y: ay, t: 0 };
      return;
    }
    goTo(w.x, w.y);
    player.pending = null;
    marker = { x: w.x, y: w.y, t: 0 };
  }

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || drag.moved) return;
    const w = toWorld(e.clientX, e.clientY);
    const ent = entityAt(w.x, w.y);
    hover = ent ? null : interAt(w.x, w.y);
    canvas.style.cursor = ent || hover ? 'pointer' : 'default';
  });

  const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
  window.addEventListener('keydown', (e) => {
    const typing = /input|textarea/i.test(document.activeElement?.tagName || '');
    if (e.key === 'Escape') { if (typing) document.activeElement.blur(); else UI.closeTop(); return; }
    if (typing) return;
    const k = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase?.()];
    if (k) { keys.add(k); e.preventDefault(); return; }
    if (e.key === 'Enter' && !UI.isBlocking()) { e.preventDefault(); document.getElementById('chatInput').focus(); }
    if ((e.key === ' ' || e.key.toLowerCase() === 'f') && !UI.isBlocking()) {
      if (player.fishing) { e.preventDefault(); if (player.fishing.state === 'bite') AV.pullRod(); }
      else if (nearShore()) { e.preventDefault(); AV.startFishing(); }
    }
  });
  window.addEventListener('keyup', (e) => {
    const k = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase?.()];
    if (k) keys.delete(k);
  });
  window.addEventListener('blur', () => keys.clear());

  /* ---------- Khởi động ---------- */
  let last = 0;
  function loop(t) {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  enterMap(maps[S.map] ? S.map : 'farm', S.x, S.y);
  UI.init();
  TABLE.init();
  UI.updateHud();
  NET.init(player);
  /* ---------- Tài khoản: đăng nhập rồi mới vào chơi ---------- */
  function startLocal() {
    if (!S.name) UI.characterEditor(true);
    else UI.toast(`Chào mừng trở lại, ${S.name}! 🌾`);
  }
  AV.playAsGuest = startLocal;

  /** Thay toàn bộ tiến trình bằng bản khác (vd: tải từ tài khoản) */
  function replaceState(data) {
    const m = mergeSave(JSON.parse(JSON.stringify(data)));
    Object.keys(S).forEach((k) => { delete S[k]; });
    Object.assign(S, m);
    enterMap(maps[S.map] ? S.map : 'farm', S.x, S.y);
    UI.updateHud();
    UI.updateQuestDot();
    NET.sendState();
  }

  /** Cất một bản sao trong máy trước khi thay bản lưu (để khôi phục nếu cần) */
  function backupLocal(reason) {
    if (!S.name) return;
    try {
      const list = JSON.parse(localStorage.getItem('avatar_backups') || '[]');
      list.unshift({ at: Date.now(), reason, data: JSON.parse(JSON.stringify(S)) });
      localStorage.setItem('avatar_backups', JSON.stringify(list.slice(0, 6)));
    } catch (e) { /* bộ nhớ đầy thì thôi */ }
  }
  AV.localBackups = () => { try { return JSON.parse(localStorage.getItem('avatar_backups') || '[]'); } catch (e) { return []; } };

  /** Dùng một bản lưu (từ máy chủ hoặc bản sao) thay cho bản hiện tại, rồi đẩy lên tài khoản */
  AV.restoreSave = async (data, label) => {
    backupLocal('trước khi khôi phục');
    const uid = S.owner;
    replaceState(data);
    if (uid) S.owner = uid;
    S.changedAt = Date.now();
    saveNow();
    joinRoom();
    if (CLOUD.user) await CLOUD.push(S);
    UI.toast(`✅ Đã khôi phục ${label || 'bản lưu'}`, 4000);
  };

  const summary = (d) => ({ name: d.name, level: d.level || 1, coins: d.coins || 0, beds: (d.beds || []).filter(Boolean).length, at: d.changedAt || 0 });

  AV.afterLogin = async () => {
    setTimeout(receiveHelps, 4000);
    cloudReady = false;
    const uid = CLOUD.user.id;
    let cloud = null;
    try { cloud = await CLOUD.pull(); } catch (e) { UI.toast('⚠️ ' + e.message, 6000); }
    const finish = () => { cloudReady = true; saveNow(); joinRoom(); };
    if (cloud && cloud.data && cloud.data.name) {
      const local = S.owner === uid && S.name ? S : null;
      const lc = local ? local.changedAt || 0 : 0, cc = cloud.data.changedAt || 0;
      const same = local && JSON.stringify(summary(local)) === JSON.stringify(summary(cloud.data));
      if (!local || same || (cc && lc && cc >= lc)) {
        // bản trên tài khoản mới hơn (hoặc máy này chưa có nhân vật) → dùng bản tài khoản
        if (local && !same) backupLocal('bản trên máy này trước khi tải bản tài khoản');
        replaceState(cloud.data);
        S.owner = uid;
        finish();
        UI.toast(`Chào mừng trở lại, ${S.name}! ☁️ Đã tải nhân vật từ tài khoản`, 3500);
      } else if (cc && lc && lc > cc) {
        // máy này có thay đổi chưa kịp lưu lên tài khoản → giữ bản máy này
        S.owner = uid;
        finish();
        CLOUD.push(S);
        UI.toast(`Chào mừng trở lại, ${S.name}! ☁️ Đã lưu tiến trình mới nhất của máy này lên tài khoản`, 3500);
      } else {
        // bản lưu cũ chưa có dấu thời gian thay đổi → hỏi người chơi giữ bản nào
        S.owner = uid;
        UI.chooseSave(summary(local), summary(cloud.data), (pick) => {
          if (pick === 'cloud') { backupLocal('bản trên máy này (không chọn)'); replaceState(cloud.data); S.owner = uid; }
          S.changedAt = Date.now();
          finish();
          CLOUD.push(S);
          UI.toast(`☁️ Đã dùng ${pick === 'cloud' ? 'bản trên tài khoản' : 'bản trên máy này'}`, 3500);
        });
      }
    } else if (S.name && (!S.owner || S.owner === uid)) {
      // tài khoản mới: chuyển nhân vật đang chơi trong máy lên tài khoản
      S.owner = uid;
      S.changedAt = Date.now();
      cloudReady = true;
      saveNow();
      joinRoom();
      const ok = await CLOUD.push(S);
      UI.toast(ok ? `☁️ Đã lưu nhân vật ${S.name} vào tài khoản — giờ chơi máy nào cũng được!` : '⚠️ Chưa lưu được lên mạng, game sẽ thử lại', 4000);
    } else {
      backupLocal('nhân vật khác trên máy này');
      replaceState(defaultState());
      S.owner = uid;
      cloudReady = true;
      saveNow();
      joinRoom();
      UI.characterEditor(true);
    }
  };

  /** Mã quà tặng (mỗi mã dùng 1 lần cho mỗi nhân vật) */
  const GIFTS = { 'XINLOI3500': { coins: 3500, msg: 'Quà xin lỗi vì lỗi mất đồ' } };
  AV.redeem = (code) => {
    const c = String(code || '').trim().toUpperCase().replace(/\s+/g, '');
    const g = GIFTS[c];
    if (!g) return UI.toast('Mã quà không đúng 🤔');
    S.redeemed = S.redeemed || [];
    if (S.redeemed.includes(c)) return UI.toast('Bạn đã dùng mã này rồi');
    S.redeemed.push(c);
    S.coins += g.coins;
    float(`+${g.coins} 💰`, player.x, player.y - 120, '#ffd43b');
    UI.toast(`🎁 ${g.msg}: +${g.coins.toLocaleString('vi-VN')} xu!`, 5000);
    changed();
  };

  AV.cloudSaveNow = async () => {
    saveNow();
    const ok = await CLOUD.push(S);
    UI.toast(ok ? '☁️ Đã lưu lên tài khoản' : '⚠️ Lưu thất bại, kiểm tra mạng');
  };

  AV.logout = async () => {
    saveNow();
    await CLOUD.push(S);
    await CLOUD.signOut();
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* bỏ qua */ }
    window.removeEventListener('beforeunload', saveNow);
    location.reload();
  };

  (async () => {
    const u = await CLOUD.init();
    if (!CLOUD.available) return startLocal();
    if (u) return AV.afterLogin();
    UI.authPanel(true);
  })();

  setInterval(() => { if (CLOUD.user && cloudReady && CLOUD.dirty) CLOUD.push(S); }, 10000);
  window.addEventListener('pagehide', () => { saveNow(); if (cloudReady) CLOUD.pushOnExit(S); });

  setInterval(saveNow, 5000);
  window.addEventListener('beforeunload', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { saveNow(); if (CLOUD.user && cloudReady) CLOUD.push(S); } });

  AV._debug = { player, bus, maps, get map() { return map; }, enterMap, update, draw, goTo, findPath, clickWorld, camOff, cam, get zoom() { return ZOOM; } };
  requestAnimationFrame(loop);
})();
