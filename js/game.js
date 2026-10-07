/* Vòng lặp game, điều khiển, tương tác, lưu tiến trình */
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const SAVE_KEY = 'avatar_farm_save_v1';
  const SPEED = 335;
  const BUS_Y = 985;
  let W = 0, H = 0, DPR = 1, ZOOM = 1;

  /* ---------- Tiến trình ---------- */
  function defaultState() {
    return {
      name: '',
      look: { skin: DATA.SKINS[0], hair: 'short', hairColor: DATA.HAIR_COLORS[0], shirt: DATA.SHIRT_COLORS[5], shirtStyle: 'plain', pants: DATA.PANTS_COLORS[0], hat: 'none', pet: 'none', acc: 'none', stick: '', wear: '' },
      coins: 50, xp: 0, level: 1,
      inv: { seed_wheat: 6, seed_carrot: 3, wheat: 3, fertilizer: 5 },
      owned: { hats: ['none'], shirtStyles: ['plain'], pets: ['none'], accs: ['none'], guards: ['none'] },
      tiles: Array.from({ length: DATA.BED_COUNT * DATA.TILES_PER_BED }, () => ({ crop: null, plantedAt: 0, watered: false })),
      beds: Array.from({ length: DATA.BED_COUNT }, (_, i) => i === 0 || i === DATA.FIELD_BEDS),
      guard: [],
      trees: DATA.ORCHARD.map(() => ({ at: 0 })),
      storage: {},
      coop: { fedAt: 0 },
      pen: normPen(),
      map: 'farm', x: null, y: null,
      settings: { pixelArt: false },
    };
  }

  /** Ghép bản lưu (trong máy hoặc trên mạng) với dữ liệu mặc định, nâng cấp dữ liệu cũ */
  function mergeSave(s) {
    const d = defaultState();
    // ô tô VinFast từng lưu nhầm vào S.cars (trùng danh sách xe đua) → tách sang S.evs
    if (typeof s.energy !== 'number') s.energy = 100;
    if (Array.isArray(s.guard) && s.guard.length && !Array.isArray(s.guardExp)) s.guardExp = s.guard.map(() => Date.now() + DATA.GUARD_DAYS * 86400000);
    if (s.cars && !Array.isArray(s.cars) && typeof s.cars === 'object') { s.evs = { ...(s.evs || {}), ...s.cars }; s.cars = ['basic']; }
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
    // khu đất mở rộng: thêm 8 luống ruộng (luống 13–20)
    while (s.tiles.length < d.tiles.length) s.tiles.push({ crop: null, plantedAt: 0, watered: false });
    while (s.beds.length < d.beds.length) s.beds.push(false);
    s.trees = s.trees || [];
    while (s.trees.length < DATA.ORCHARD.length) s.trees.push({ at: 0 });
    const out = { ...d, ...s, look: { ...d.look, ...s.look }, owned: { ...d.owned, ...s.owned }, settings: { ...d.settings, ...s.settings } };
    out.guard = normTeam(s.guard, s.owned && s.owned.guards);
    out.pen = normPen(s.pen);
    // thú bị thương kiểu cũ (không hạn) → tự khỏi sau 2 giờ kể từ lúc vào game
    if (Array.isArray(out.guardHurt)) out.guardHurt = out.guardHurt.map((v) => (v === 1 || v === true ? 0 : v));
    if (!out.pestFix1) {
      out.pestFix1 = true;
      const now = Date.now();
      (out.tiles || []).forEach((t) => {
        if (!t || !t.crop || !t.pestAt || t.sprayed || !DATA.CROPS[t.crop]) return;
        const p = (now - t.plantedAt) / (DATA.CROPS[t.crop].time * 1000);
        if (p < t.pestAt && Math.random() > 0.1) t.pestAt = 0;
      });
    }
    return out;
  }

  /** 3 chuồng riêng { cow, sheep, pig }. Bản lưu cũ chỉ có 1 chuồng chung { fedAt } → cả 3 chuồng cùng mốc cho ăn */
  function normPen(p) {
    const old = p && typeof p.fedAt === 'number' ? p.fedAt : 0;
    const out = {};
    Object.keys(DATA.PENS).forEach((k) => { out[k] = { fedAt: p && p[k] && p[k].fedAt ? p[k].fedAt : old }; if (p && p[k] && p[k].took) out[k].took = p[k].took; });
    return out;
  }

  /** Đội thú giữ nhà (mảng id, tối đa 5). Bản lưu cũ chỉ có 1 con canh → cho mọi con đã mua cùng ra canh */
  function normTeam(v, owned) {
    const ok = (id) => id !== 'none' && DATA.GUARDS.some((g) => g.id === id);
    const team = Array.isArray(v) ? v.filter(ok) : [...new Set([...(ok(v) ? [v] : []), ...(owned || []).filter(ok)])];
    return team.slice(0, DATA.GUARD_MAX);
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
  // tầng 5 → 50: chỉ dựng khi bước vào (đỡ tốn bộ nhớ), ra khỏi thì bỏ
  for (let n = 5; n <= 50; n++) {
    let built = null;
    Object.defineProperty(maps, 'home' + n, { configurable: true, enumerable: false, get: () => (built = built || MAPS.floorN(n)), set: (v) => { built = v; } });
    maps['_drop' + n] = () => { built = null; };
  }
  let map = maps.farm;

  function saveNow() {
    if (map) { S.map = map.id; }
    if (!player.hidden) { S.x = Math.round(player.x); S.y = Math.round(player.y); }
    S.savedAt = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ }
  }
  /** Đã quyết định xong dùng bản lưu nào sau khi đăng nhập thì mới được đẩy lên mạng */
  let cloudReady = false;
  /** Mốc changedAt của bản trên mạng mà máy này đã biết (tải về hoặc tự đẩy lên) */
  let syncedAt = 0, syncing = false;

  /** Đẩy lên mạng an toàn: nếu máy khác vừa lưu bản mới hơn thì tải bản đó về, KHÔNG ghi đè */
  async function pushSafe() {
    if (!CLOUD.user || !cloudReady || syncing) return false;
    syncing = true;
    try {
      let remote = 0;
      try { remote = await CLOUD.peekChangedAt(); } catch (e) { return false; }
      if (remote > syncedAt && remote !== S.changedAt) { await adoptRemote(); return false; }
      const ok = await CLOUD.push(S);
      if (ok) { syncedAt = S.changedAt || syncedAt; NET.farmPing('saverev', S.owner); }
      return ok;
    } finally { syncing = false; }
  }
  /** Kiểm tra máy khác có vừa lưu không (khi quay lại tab, khi máy kia báo, định kỳ) */
  async function checkRemote() {
    if (!CLOUD.user || !cloudReady || syncing) return;
    syncing = true;
    try {
      const remote = await CLOUD.peekChangedAt();
      if (remote > syncedAt && remote !== S.changedAt) await adoptRemote();
    } catch (e) { /* thử lại sau */ } finally { syncing = false; }
  }
  /** Lấy bản mới nhất từ mạng (giữ nguyên chỗ đang đứng) */
  async function adoptRemote() {
    const cloud = await CLOUD.pull();
    if (!cloud || !cloud.data || !cloud.data.name) return;
    backupLocal('trước khi tải bản mới từ máy khác');
    const uid = S.owner;
    const d = { ...cloud.data, map: map.id, x: Math.round(player.x), y: Math.round(player.y) };
    replaceState(d);
    S.owner = uid;
    syncedAt = cloud.data.changedAt || Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ }
    UI.toast('☁️ Đã cập nhật tiến trình mới nhất từ máy khác của bạn', 4000);
  }
  AV.checkRemote = () => checkRemote();

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
    if (map && map.id !== id && /^home\d+$/.test(map.id) && +map.id.slice(4) >= 5 && maps['_drop' + map.id.slice(4)]) { const old = map.id.slice(4); setTimeout(() => { if (!map || map.id !== 'home' + old) maps['_drop' + old](); }, 0); }
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
    pose = null;
    rockets.length = 0; sparks.length = 0; flashes.length = 0; fwShow = null; fwDim = 0;
    drops.length = 0; splashes.length = 0;
    if (attack) endAttack();
    player.stun = false;
    UI.setLocation(id === 'farm' && VISIT ? `Nông trại của ${VISIT.data.name}` : map.name);
    UI.updateVisitBar(VISIT);
    joinRoom();
    TABLE.onMapChange();
    BIL.onMapChange();
    // khu có nhạc riêng (H-Club): vào mới nghe, ra thì trả lại nhạc của bạn
    if (typeof MUSIC !== 'undefined' && MUSIC.zone) MUSIC.zone(map.music || null);
    if (typeof CONCERT !== 'undefined') CONCERT.onMap(id);
    if (typeof BOX !== 'undefined') BOX.onMap(id);
    if (AV.onLayoutMap) AV.onLayoutMap();
    applyZoom();
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
      if (c.when && !c.when()) continue;
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
    n *= (typeof EVENTS !== 'undefined' ? EVENTS.mult() : 1);
    S.xp += n;
    while (S.xp >= DATA.xpNeed(S.level)) {
      S.xp -= DATA.xpNeed(S.level);
      S.level++;
      UI.toast(`🎉 Lên cấp ${S.level}!`, 3200);
      float('LÊN CẤP!', player.x, player.y - 110, '#ffd43b');
      const unlocked = Object.values(DATA.CROPS).filter((c) => c.lvl === S.level);
      unlocked.forEach((c) => setTimeout(() => UI.toast(`🔓 Mở khoá hạt ${c.name.toLowerCase()} ${c.icon} ở Cửa hàng hạt giống (cổng nông trại)`, 3500), 800));
    }
  }

  let cloudTimer = null;
  function changed() {
    // changedAt chỉ đổi khi tiến trình thật sự thay đổi (mua, bán, trồng…) — dùng để so bản lưu giữa các máy
    S.changedAt = Date.now();
    saveNow();
    // có thay đổi quan trọng: lưu lên mạng sau 3 giây (gom nhiều thay đổi liền nhau)
    if (CLOUD.user && cloudReady) CLOUD.markDirty();
    if (CLOUD.user && cloudReady && !cloudTimer) cloudTimer = setTimeout(() => { cloudTimer = null; pushSafe(); }, 3000);
    UI.updateHud();
    NET.sendState();
  }

  AV.saveNow = saveNow;
  AV.markChanged = () => changed();

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
  /** Bán toàn bộ đồ có giá trong túi (không bán hạt giống, phân bón, thuốc, vé) — 1 thông báo gộp */
  AV.sellAll = () => {
    let gain = 0, kinds = 0;
    Object.entries(S.inv).forEach(([id, n]) => {
      const it = DATA.ITEMS[id];
      if (n > 0 && it && it.sell > 0 && !id.startsWith('seed_')) { gain += it.sell * n; S.inv[id] = 0; kinds++; }
    });
    if (!gain) return UI.toast('Túi không có gì để bán');
    S.coins += gain;
    UI.toast(`✅ Bán thành công ${kinds} loại đồ · +${gain.toLocaleString('vi-VN')} xu`, 3500);
    float(`+${gain.toLocaleString('vi-VN')} 💰`, player.x, player.y - 100, '#ffd43b');
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

  /* ---------- Bộ trang phục pixel ---------- */
  const OUTFIT_KEYS = { top: 'tops', bottom: 'bottoms', shoes: 'shoes', back: 'backs', hat: 'hats', acc: 'accs' };
  AV.ownsOutfit = (id) => (S.owned.outfits || []).includes(id);
  AV.wearingOutfit = (id) => { const o = DATA.OUTFITS.find((x) => x.id === id); return !!o && Object.entries(o.look).every(([k, v]) => (S.look[k] || '') === v); };
  AV.buyOutfit = (id) => {
    const o = DATA.OUTFITS.find((x) => x.id === id);
    if (!o || AV.ownsOutfit(id)) return false;
    if (o.lvl && S.level < o.lvl) { UI.toast(`Cần đạt cấp ${o.lvl}`); return false; }
    if (!AV.spend(o.price)) return false;
    S.owned.outfits = [...(S.owned.outfits || []), id];
    Object.entries(o.look).forEach(([k, v]) => {
      if (!v) return;
      const ok = OUTFIT_KEYS[k];
      S.owned[ok] = S.owned[ok] || (k === 'hat' || k === 'acc' ? ['none'] : []);
      if (!S.owned[ok].includes(v)) S.owned[ok].push(v);
    });
    AV.wearOutfit(id);
    UI.toast(`✨ Đã mua bộ ${o.name}!`, 3000);
    return true;
  };
  /** Nhân vật mặc bộ o: bỏ mũ / phụ kiện của bộ khác nếu bộ này không có */
  AV.outfitLook = (o) => {
    const setItem = (list, id) => { const it = list.find((x) => x.id === id); return !!(it && it.set); };
    return { ...S.look, back: '', hat: setItem(DATA.HATS, S.look.hat) ? 'none' : S.look.hat, acc: setItem(DATA.ACCS, S.look.acc) ? 'none' : S.look.acc, ...o.look };
  };
  AV.wearOutfit = (id) => {
    const o = DATA.OUTFITS.find((x) => x.id === id);
    if (!o || !AV.ownsOutfit(id)) return;
    S.look = AV.outfitLook(o);
    changed();
    UI.updateHud();
  };

  /* ---------- Ruộng: 20 luống × 12 ô (0–7 và 12–19 rau củ, 8–11 hoa), cây khát nước phải tưới ---------- */
  const TPB = DATA.TILES_PER_BED;
  /** Luống 0–7 trồng rau củ, 8–11 trồng hoa */
  const isFlowerBed = (bed) => bed >= DATA.FIELD_BEDS && bed < DATA.FIELD_BEDS + DATA.FLOWER_BEDS;
  AV.cropAllowed = (i, crop) => { const k = DATA.CROPS[crop].kind; return isFlowerBed(Math.floor(i / TPB)) ? (k === 'flower' || k === 'both') : k !== 'flower'; };
  AV.isFlowerTile = (i) => isFlowerBed(Math.floor(i / TPB));
  const bedOf = (i) => Math.floor(i / TPB);
  const bedTiles = (bed) => FD().tiles.slice(bed * TPB, bed * TPB + TPB);

  /** Trạng thái một ô: tiến độ (0..1), khát nước, giai đoạn cây */
  function tileState(t) {
    if (!t || !t.crop) return { stage: -1 };
    const total = DATA.CROPS[t.crop].time * 1000;
    let p = (now - t.plantedAt) / total;
    // cây đứng lại khi khát nước hoặc bị sâu (chưa xịt thuốc)
    let cap = 1, thirsty = false, pest = false;
    if (!t.watered && p >= DATA.THIRSTY_AT) cap = DATA.THIRSTY_AT;
    const pestOn = t.pestAt && !t.sprayed;
    if (pestOn && p >= t.pestAt && t.pestAt < cap) cap = t.pestAt;
    if (cap < 1 && p >= cap) { p = cap; thirsty = cap === DATA.THIRSTY_AT && !t.watered; pest = pestOn && cap === t.pestAt; }
    p = Math.min(1, p);
    return { p, thirsty, pest, left: Math.max(0, (1 - p) * total / 1000), stage: p >= 1 ? 2 : p >= 0.3 ? 1 : 0 };
  }
  /** Sản lượng thật của 1 ô: không bón phân chỉ được ~60% */
  const tileYield = (t) => { const y = DATA.CROPS[t.crop].yield; return t.fert ? y : Math.max(1, Math.round(y * DATA.FERT.noFertYield)); };
  AV.tileYield = tileYield;
  AV.tileState = tileState;

  /** Chỉ báo của cả luống: số ô chín, ô khát nước, thời gian ô sớm nhất */
  AV.bedIndicator = (bed) => {
    if (!FD().beds[bed]) return null;
    let ready = 0, thirsty = 0, pests = 0, minLeft = Infinity, p = 0;
    bedTiles(bed).forEach((t) => {
      const st = tileState(t);
      if (st.stage < 0) return;
      if (st.stage === 2) ready++;
      else if (st.pest) pests++;
      else if (st.thirsty) thirsty++;
      else if (st.left < minLeft) { minLeft = st.left; p = st.p; }
    });
    if (ready) return '🧺';
    if (pests) return '🐛';
    if (thirsty) return '💧';
    if (minLeft < Infinity) return { p, left: minLeft };
    return null;
  };

  /** Tưới cả luống: cây khát được tưới thì lớn tiếp; mọi cây được tưới đều nhanh hơn 10% */
  function waterBed(bed, chain) {
    let n = 0;
    now = Date.now();
    const canLv = (S.tools && S.tools.can) || 0, cut = DATA.WATER_CUT * [1, 1.2, 1.5, 1.5, 2][canLv];
    if (!chain && canLv >= 3 && !VISIT) {
      let tot = 0;
      for (let b = 0; b < DATA.BED_COUNT; b++) if (S.beds[b]) tot += waterBed(b, true);
      if (tot) UI.toast(`🚿 Bình tưới ${canLv === 4 ? 'kim cương' : 'vàng'} tưới cả ruộng: ${tot} cây!`, 2500);
      return tot;
    }
    bedTiles(bed).forEach((t) => {
      const st = tileState(t);
      if (st.stage < 0 || st.stage === 2 || t.watered) return;
      const total = DATA.CROPS[t.crop].time * 1000;
      if (st.thirsty) t.plantedAt += now - (t.plantedAt + DATA.THIRSTY_AT * total);
      t.plantedAt -= cut * total;
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
      pests: tiles.filter((t) => tileState(t).pest).length,
      unsprayed: tiles.filter((t) => t.pestAt && !t.sprayed).length,
      pesticide: S.inv.pesticide || 0,
    };
  };
  /** Xịt thuốc trừ sâu cả luống: 1 chai. Cây đang bị sâu lớn tiếp, cây chưa bị thì được phòng luôn */
  AV.sprayBed = (bed) => {
    const tiles = bedTiles(bed).filter((t) => t.crop && tileState(t).stage < 2 && !t.sprayed);
    if (!tiles.length) return UI.toast('Luống này không cần xịt thuốc 🌱');
    if ((S.inv.pesticide || 0) < 1) { UI.toast(`🐛 Cây bị sâu! Cần ${DATA.PEST.icon} thuốc trừ sâu — mua ở Cửa hàng hạt giống cạnh cổng nông trại (${DATA.PEST.price} xu/chai)`, 4500); return; }
    if (!AV.useEnergy(1)) return;
    now = Date.now();
    let cured = 0;
    tiles.forEach((t) => {
      const st = tileState(t);
      if (st.pest) { const total = DATA.CROPS[t.crop].time * 1000; t.plantedAt += now - (t.plantedAt + t.pestAt * total); cured++; }
      t.sprayed = true;
    });
    S.inv.pesticide--;
    addXP(2 + cured);
    float(cured ? `🧴 Diệt sâu ${cured} cây` : '🧴 Phun phòng sâu', player.x, player.y - 110, '#b2f2bb');
    changed();
  };
  AV.buyItem = (id, n) => {
    const price = ({ pesticide: DATA.PEST.price, fertilizer: DATA.FERT.price, pet_med: DATA.PETMED.price, pet_food: DATA.PETFOOD.price })[id] || 0;
    if (!price || n < 1) return false;
    if (!AV.spend(price * n)) return false;
    addItem(id, n);
    UI.toast(`Đã mua ${n} ${DATA.ITEMS[id].icon} ${DATA.ITEMS[id].name.toLowerCase()}`);
    changed();
    return true;
  };
  AV.waterBed = (bed) => waterBed(bed);
  AV.fertBed = (bed) => {
    const n = fertBed(bed);
    if (!n) UI.toast((S.inv.fertilizer || 0) < 1 ? 'Hết phân bón — mua ở 🌱 Cửa hàng hạt giống cạnh cổng nông trại (5 xu/gói)' : 'Các cây trong luống đã được bón phân rồi');
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
      const hoeLv = (S.tools && S.tools.hoe) || 0;
      got[t.crop] = (got[t.crop] || 0) + (Math.max(1, tileYield(t) - (t.stolen || 0)) + (Math.random() < hoeLv * 0.1 ? 1 : 0)) * (typeof EVENTS !== 'undefined' ? EVENTS.mult() : 1);
      xp += c.xp;
      t.crop = null; t.plantedAt = 0; t.watered = false; t.fert = false; t.stolen = 0;
    });
    const keys = Object.keys(got);
    if (!keys.length) return false;
    keys.forEach((k) => addItem(k, got[k]));
    AV.quest('harvest', keys.reduce((a, k) => a + got[k], 0));
    if (typeof RANCH !== 'undefined') RANCH.onHarvest(keys);
    addXP(xp);
    float(keys.map((k) => `+${got[k]} ${DATA.CROPS[k].icon}`).join('  '), player.x, player.y - 110);
    changed();
    return true;
  }

  AV.useTile = (i) => {
    if (VISIT) return VISIT.data.beds[bedOf(i)] && tileState(VISIT.data.tiles[i]).stage === 2 ? AV.stealTile(i) : AV.helpWater();
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
    if (st.stage === 2 || (st.stage >= 0 && bedTiles(bed).some((x) => tileState(x).stage === 2))) { if (AV.useEnergy(2)) harvestBed(bed); return; }
    if (st.pest || bedTiles(bed).some((x) => tileState(x).pest)) { AV.sprayBed(bed); return; }
    if (st.thirsty || bedTiles(bed).some((x) => tileState(x).thirsty)) { if (AV.useEnergy(3)) waterBed(bed); return; }
    if (st.stage < 0) return UI.seedPicker(i);
    UI.careBed(bed);
  };

  function plantTile(i, crop) {
    const key = 'seed_' + crop;
    if (!S.inv[key] || S.tiles[i].crop || !AV.cropAllowed(i, crop)) return false;
    if (typeof SEASON !== 'undefined' && !SEASON.inSeason(crop)) { UI.toast(`${DATA.CROPS[crop].icon} ${DATA.CROPS[crop].name} chỉ gieo được vào mùa ${SEASON.seasonsOf(crop)}`, 3500); return false; }
    S.inv[key]--;
    // có khả năng bị sâu ở giữa chừng (khác mốc khát nước)
    const pestAt = Math.random() < DATA.PEST.chance ? Math.round((0.15 + Math.random() * 0.55) * 1000) / 1000 : 0;
    S.tiles[i] = { crop, plantedAt: Date.now(), watered: false, pestAt: pestAt === DATA.THIRSTY_AT ? pestAt + 0.01 : pestAt };
    return true;
  }

  AV.plant = (i, crop) => {
    if (!AV.useEnergy(1)) return;
    if (plantTile(i, crop)) { float('🌱 Gieo hạt', player.x, player.y - 110); changed(); }
  };

  /** Gieo tất cả ô trống trong luống bằng một loại hạt */
  AV.plantBed = (i, crop) => {
    if (!AV.useEnergy(2)) return;
    const bed = bedOf(i);
    let n = 0;
    for (let k = bed * TPB; k < bed * TPB + TPB; k++) if (plantTile(k, crop)) n++;
    if (n) { float(`🌱 Gieo ${n} ô`, player.x, player.y - 110); changed(); }
    if (!S.inv['seed_' + crop] && n < bedTiles(bed).length) UI.toast('Hết hạt giống — mua thêm ở 🌱 Cửa hàng hạt giống cạnh cổng nông trại');
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
    if (VISIT) return AV.stealTree(i);
    const st = treeState(i);
    if (!st.ripe) return UI.toast(`${st.f.icon} Cây ${st.f.name.toLowerCase()} đang ra quả, còn ${fmtDur(st.left)} nữa`);
    if (!AV.useEnergy(1)) return;
    const n = Math.max(1, st.f.yield - (S.trees[i].stolen || 0)) * (typeof EVENTS !== 'undefined' ? EVENTS.mult() : 1);
    S.trees[i].at = Date.now(); S.trees[i].stolen = 0;
    addItem(DATA.ORCHARD[i], n);
    addXP(st.f.xp);
    float(`+${n} ${st.f.icon}`, player.x, player.y - 110);
    AV.quest('harvest', n);
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
      opts.collect(st.took || {});
      st.took = null;
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

  AV.useCoop = () => VISIT ? AV.stealBarn('coop') : farmBuilding(S.coop, DATA.COOP, {
    kinds: ['chicken'], fedMsg: 'Đã cho gà ăn! 🐔', waitMsg: 'Gà đang đẻ trứng…',
    collect: (took) => { const n = Math.max(1, DATA.COOP.eggs - (took.egg || 0)); addItem('egg', n); float(`+${n} 🥚`, player.x, player.y - 100); },
  });
  AV.coopIndicator = () => {
    const r = buildingIndicator(FD().coop || { fedAt: 0 }, DATA.COOP);
    return r === null ? '🥚' : r;
  };

  /** Chuồng bò / cừu / heo: mỗi chuồng cho ăn và thu hoạch riêng */
  AV.usePen = (kind = 'cow') => {
    const P = DATA.PENS[kind];
    if (!P) return;
    if (VISIT) return AV.stealBarn(kind);
    if (!AV.useEnergy(2)) return;
    S.pen = normPen(S.pen);
    farmBuilding(S.pen[kind], P, {
      kinds: [kind], fedMsg: P.fedMsg, waitMsg: P.waitMsg,
      collect: (took) => {
        const got = Object.entries(P.out).map(([id, n]) => [id, Math.max(1, n - (took[id] || 0))]);
        got.forEach(([id, n]) => addItem(id, n));
        float(got.map(([id, n]) => `+${n} ${DATA.ITEMS[id].icon}`).join('  '), player.x, player.y - 100);
      },
    });
  };
  AV.penIndicator = (kind = 'cow') => {
    const P = DATA.PENS[kind];
    const r = buildingIndicator((FD().pen || {})[kind] || { fedAt: 0 }, P);
    return r === null ? DATA.ITEMS[Object.keys(P.out)[0]].icon : r;
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
  /* ---------- ⚡ Năng lượng: làm việc tốn sức, ăn uống / ngủ để hồi ---------- */
  const enOf = () => (typeof S.energy === 'number' ? S.energy : (S.energy = 100));
  let enWarnAt = 0;
  AV.energy = () => enOf();
  /* ---------- 🤒 Ốm sốt: kiệt sức quá thì sốt, phải đi Bệnh viện Zeno ---------- */
  AV.isSick = () => !!(S.sick && !(S.sick.cureAt && S.sick.cureAt <= Date.now()));
  function getSick(why) {
    if (S.sick) return;
    S.sick = { since: Date.now(), why };
    changed();
    say(player, '🤒 Nóng quá… sốt rồi');
    UI.toast(`🤒 Bạn bị ốm sốt (${why})! Đi chậm, không làm việc được. Đến 🏥 Bệnh viện Zeno khám và tiêm / uống thuốc nhé`, 7000);
  }
  AV.getSick = getSick;
  function checkSick() {
    if (S.sick && S.sick.cureAt && S.sick.cureAt <= Date.now()) { S.sick = null; S.lowSince = 0; changed(); UI.toast('💪 Thuốc ngấm rồi — bạn đã khỏi sốt!', 4000); }
    if (enOf() < 10) { S.lowSince = S.lowSince || Date.now(); if (Date.now() - S.lowSince > 15 * 60000) getSick('đói lả lâu quá'); } else S.lowSince = 0;
  }
  setInterval(checkSick, 30000);
  AV.useEnergy = (n, quiet) => {
    if (AV.isSick()) { if (!quiet && Date.now() - enWarnAt > 2500) { enWarnAt = Date.now(); UI.toast('🤒 Bạn đang ốm sốt — không làm việc được. Đến 🏥 Bệnh viện Zeno khám nhé!', 4500); } return false; }
    const e = enOf();
    if (e < n) {
      if (!quiet && Date.now() - enWarnAt > 2500) { enWarnAt = Date.now(); UI.toast('😫 Đói và mệt quá! Ăn gì đó ở quán ăn, ăn đồ trong 🎒 túi, hoặc về nhà ngủ để hồi ⚡ năng lượng', 4500); say(player, '😫 Đói quá…'); }
      return false;
    }
    S.energy = Math.max(0, e - n);
    if (e >= 20 && S.energy < 20) UI.toast('⚡ Năng lượng sắp hết — nhớ ăn uống nhé!', 3500);
    if (S.energy <= 0 && Math.random() < 0.5) getSick('làm việc kiệt sức');
    UI.updateHud();
    return true;
  };
  AV.addEnergy = (n) => { S.energy = Math.min(100, enOf() + n); UI.updateHud(); changed(); };
  // tự hồi rất chậm: +1 mỗi 2 phút
  setInterval(() => { if (enOf() < (AV.isSick() ? 30 : 100)) { S.energy = Math.min(100, enOf() + 1); UI.updateHud(); } }, 120000);
  /** món ăn được từ túi đồ (món nấu, trái cây, rau quả, trứng, sữa) → năng lượng hồi */
  AV.edibleEnergy = (id) => {
    if ((DATA.RECIPES || []).some((r) => r.id === id)) return Math.min(50, Math.max(15, Math.round(DATA.ITEMS[id].sell / 2)));
    const RAW = ['strawberry', 'tomato', 'carrot', 'cucumber', 'watermelon', 'banana', 'pineapple', 'grape', 'egg', 'milk', 'sky_fruit', 'corn', 'potato', 'cabbage'];
    if (RAW.includes(id) || (DATA.FRUITS && DATA.FRUITS[id])) return Math.min(25, Math.max(4, Math.round(DATA.ITEMS[id].sell * 0.4)));
    return 0;
  };
  AV.eatItem = (id) => {
    const gain = AV.edibleEnergy(id);
    if (!gain || (S.inv[id] || 0) < 1) return false;
    if (enOf() >= 100) { UI.toast('⚡ Năng lượng đang đầy rồi'); return false; }
    S.inv[id]--;
    AV.addEnergy(gain);
    AV.quest('eat');
    float(`${DATA.ITEMS[id].icon} +${gain} ⚡`, player.x, player.y - 120, '#ffe066');
    say(player, `${DATA.ITEMS[id].icon} Ngon quá 😋`);
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
  /* đồ rơi của sự kiện (sao băng, túi tiền, rồng con, mưa tiền): on(p) chạy khi nhặt thay cho cộng đồ */
  AV.pickups = () => map.pickups;
  /** 🚜 máy cày: luống chín ở gần (x, y) thì gặt luôn (không tốn năng lượng) */
  AV.tractorHarvest = (x, y) => {
    if (VISIT || map.id !== 'farm') return;
    const o = map.inter.find((q) => q.tile != null && Math.abs(q.ax - x) < 70 && Math.abs(q.ay - 20 - y) < 60);
    if (!o) return;
    const bed = bedOf(o.tile);
    if (S.beds[bed] && bedTiles(bed).some((t) => tileState(t).stage === 2)) harvestBed(bed);
  };
  AV.worldFx = [];
  AV.dropPickup = (x, y, icon, on, extra = {}) => { const p = { x, y, item: { id: 'ev', icon }, on, ...extra }; map.pickups.push(p); return p; };
  AV.removePickups = (fn) => { for (let k = map.pickups.length - 1; k >= 0; k--) if (fn(map.pickups[k])) map.pickups.splice(k, 1); };
  AV.blocked = (x, y) => blocked(x, y);
  AV.mapIndoor = () => !!map.indoor;
  AV.floatText = (text, x, y, color) => float(text, x, y, color);
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
    if (typeof FERRIS3D !== "undefined") FERRIS3D.ride(); else PLANE.ferris();
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
    if (p.on) { p.on(p); changed(); return; }
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
    wheelProgress(id, amount);
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
    if (!map.board) return;
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
    if (!map.board) return false;
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
    if (map.board && !player.hidden && !UI.isBlocking()) {
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
    if (!AV.useEnergy(2)) return;
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
  AV.pullRod = (forced) => {
    const f = player.fishing;
    if (!f) return;
    if (f.state !== 'bite') {
      f.biteAt = Date.now() + 6000 + Math.random() * 9000;
      UI.toast('Giật sớm quá, cá sợ bơi mất rồi 😅');
      return;
    }
    const FT = map.fishTable || DATA.FISH;
    let r = Math.random() * FT.reduce((a, x) => a + x.w, 0);
    const fish = forced || FT.find((x) => (r -= x.w) < 0) || FT[0];
    if (fish.id !== 'boot' && typeof FISHGAME !== 'undefined' && !f.reeled) {
      f.state = 'reel';
      const diff = Math.max(0.1, Math.min(0.95, Math.log10(1 + fish.sell) / 2.4));
      FISHGAME.start(fish, diff, (S.tools && S.tools.rod) || 0, (ok) => {
        if (!player.fishing) return;
        if (ok) { player.fishing.reeled = true; player.fishing.state = 'bite'; AV.pullRod(fish); player.fishing && (player.fishing.reeled = false); }
        else { player.fishing.state = 'wait'; player.fishing.biteAt = Date.now() + 5000 + Math.random() * 8000; UI.toast(`💨 ${fish.icon} ${fish.name} giãy thoát mất rồi!`); say(player, 'Tiếc quá 😭'); }
      });
      return;
    }
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
    if (f.state === 'reel') return;
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
    if (map.id === 'concert' && id === 'fun') return AV.teleport('fun', false, 3430, 840, '🎡 Ra Khu giải trí…');
    if (id === 'sky') { if (map.id === 'sky') return UI.toast('Bạn đang ở Đảo Trên Trời rồi ☁️'); return SKY.fly(true); }
    if (id === 'farm' && VISIT && map.id === 'farm') return AV.goHomeFarm();
    if (!map.busStop) {
      if (!maps[id] || id === map.id) return;
      const z = DATA.ZONES.find((x) => x.id === id);
      return AV.teleport(id, false, undefined, undefined, `🚕 Đi taxi tới ${z ? z.name : maps[id].name}…`);
    }
    if (pose) AV.leavePose();
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

  /* ---------- Đi taxi Xanh SM / xe máy trên đường phố (ride.js) ---------- */
  AV.hasBusStop = () => !!map.busStop;
  AV.startRide = (dest, vehicle) => {
    if (RIDE.active || fade.mode || !RIDE.canRide(map.id, dest)) return false;
    if (pose) AV.leavePose();
    if (player.fishing) AV.stopFishing(true);
    if (bus.wantsBoard) bus.wantsBoard = false;
    player.target = null; player.pending = null; player.path = []; player.dancing = 0;
    player.hidden = true;
    keys.clear();
    if (!RIDE.start(RIDE.zoneOf(map.id), dest, vehicle)) { player.hidden = false; return false; }
    NET.enter('road');
    return true;
  };
  AV.endRide = (dest) => {
    player.hidden = false;
    VISIT = null;
    const m = maps[dest], st = m && m.busStop;
    if (!m) return;
    enterMap(dest, st ? st.x + 50 : undefined, st ? st.y + 12 : undefined);
    UI.toast(`📍 Đã tới ${m.name}`);
    saveNow();
  };
  AV.buyBike = (id) => {
    const b = (DATA.BIKES || []).find((x) => x.id === id);
    if (!b) return false;
    S.bikes = S.bikes || [];
    if (S.bikes.includes(id)) { UI.toast('Bạn có xe này rồi 🛵'); return false; }
    if (!AV.spend(b.price)) return false;
    S.bikes.push(id);
    S.bike = id;
    changed();
    UI.updateHud();
    UI.toast(`🛵 Đã mua ${b.name}! Chọn khu trên bản đồ rồi chọn xe để tự lái nhé`, 4000);
    return true;
  };

  /** 🚗 Mua ô tô VinFast (pin đầy 100%) */
  AV.buyCar = (id) => {
    const c = (DATA.CARS || []).find((x) => x.id === id);
    if (!c) return false;
    S.evs = S.evs || {};
    if (S.evs[id]) { UI.toast('Bạn có xe này rồi 🚗'); return false; }
    if (!AV.spend(c.price)) return false;
    S.evs[id] = { bat: 100, at: Date.now() };
    changed();
    UI.updateHud();
    UI.toast(`🚗 Chúc mừng! Bạn đã sở hữu ${c.name} (pin 100%). Chọn khu trên bản đồ → chọn xe để tự lái nhé`, 5000);
    return true;
  };
  /** 🔌 Sạc pin tới 100% ở trạm V-GREEN */
  AV.chargeCar = (id) => {
    const st = (S.evs || {})[id], c = (DATA.CARS || []).find((x) => x.id === id);
    if (!st || !c) return 0;
    const need = Math.ceil(100 - st.bat);
    if (need <= 0) { UI.toast('🔋 Pin đã đầy rồi'); return 0; }
    const cost = need * DATA.CHARGE_PRICE;
    if (!AV.spend(cost)) return 0;
    st.bat = 100;
    changed();
    return cost;
  };

  /* ---------- ✈️ Sân bay ---------- */
  AV.flightDest = null;
  /** hạ cánh: vào sân bay gần khu muốn tới */
  AV.landAt = (zone) => {
    const ap = DATA.airportOf(zone);
    AV.flightDest = zone;
    AV.teleport('apt_' + ap.id, false, 1060, 740, `🛬 Hạ cánh · ${ap.name}`);
  };
  /** qua cổng an ninh → ra khu (khu đã bay tới, hoặc khu chính của sân bay) */
  AV.exitAirport = () => {
    const ap = DATA.AIRPORTS.find((a) => 'apt_' + a.id === map.id);
    if (!ap) return;
    const zone = ap.zones.includes(AV.flightDest) ? AV.flightDest : ap.zones[0];
    const m = maps[zone], st = m && m.busStop;
    AV.flightDest = null;
    AV.teleport(zone, false, st ? st.x + 50 : undefined, st ? st.y + 12 : undefined, `🛃 Qua cửa an ninh · ra ${m ? m.name : ''}…`);
  };
  AV.isCloudReady = () => cloudReady;

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

  /** Ghép dữ liệu nông trại tải về với mặc định (bản lưu cũ có thể thiếu) */
  function farmData(f) {
    const d = defaultState();
    const pad = (arr, n, mk) => { const a = Array.isArray(arr) ? arr.map((x) => (x && typeof x === 'object' ? { ...x } : x)) : []; while (a.length < n) a.push(mk()); return a; };
    return {
      name: f.name || f.username, level: f.level || 1, look: { ...d.look, ...(f.look || {}) },
      tiles: pad(f.tiles, d.tiles.length, () => ({ crop: null, plantedAt: 0, watered: false })),
      beds: pad(f.beds, d.beds.length, () => false).map((b, i) => b === true || i === 0 || i === DATA.FIELD_BEDS),
      trees: pad(f.trees, d.trees.length, () => ({ at: 0 })),
      coop: f.coop || { fedAt: 0 }, pen: normPen(f.pen),
      guard: normTeam(f.guard),
      guardHurt: Array.isArray(f.guardHurt) ? f.guardHurt : [],
      house: Math.max(1, Math.min(DATA.HOUSE_LEVELS.length, f.house | 0 || 1)),
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
    VISIT = { uid: f.user_id, username: u, data: farmData(f), helped: false, stolen: {}, rev: f.updated_at };
    guards.length = 0;
    AV.teleport('farm', false, 1600, 1350, `🏡 Đi thăm nông trại của ${VISIT.data.name}…`);
  };

  AV.goHomeFarm = () => {
    VISIT = null;
    guards.length = 0;
    if (fade.mode) return;
    AV.teleport('farm', false, 1600, 1350, '🌾 Về nông trại của bạn…');
  };

  /** Tưới giúp cả nông trại của bạn đang thăm (1 lần / bạn / ngày, chủ nhận khi online) */
  AV.helpWater = async () => {
    if (!VISIT) return;
    const name = VISIT.data.name;
    if (VISIT.helped) return UI.toast(`Bạn đã tưới giúp ${name} rồi 💧 · Ô ruộng chín 🧺, cây có quả, chuồng có trứng / sữa mới hái trộm được`, 4000);
    const need = VISIT.data.tiles.filter((t) => t.crop && !t.watered && tileState(t).stage < 2).length;
    if (!need) return UI.toast(`Ô này chưa chín để hái trộm, ruộng của ${name} cũng không cần tưới lúc này 🌱`, 3500);
    try { await CLOUD.sendHelp(VISIT.uid, S.name); } catch (e) {
      if (/đã tưới giúp/.test(e.message)) VISIT.helped = true;
      return UI.toast((VISIT.helped ? '💧 ' : '⚠️ ') + e.message, 4500);
    }
    VISIT.helped = true;
    VISIT.data.tiles.forEach((t) => { if (t.crop) t.watered = true; });
    addXP(12);
    float('💧 Tưới giúp +12 XP', player.x, player.y - 120, '#a5d8ff');
    say(player, `💧 Tưới giúp ${name} nè!`);
    NET.sendSys(`${S.name} đã tưới giúp ${need} cây cho ${name} 💧`);
    NET.farmPing('farmhit', VISIT.uid);
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
    rows.forEach((r) => logFarm({ type: 'help', who: r.helper_name || 'Bạn bè' }));
    addXP(4 * rows.length);
    UI.toast(`💧 ${names} đã tưới giúp nông trại của bạn! Cây lớn nhanh hơn rồi đó 🌱`, 6000);
    UI.chatLog('', `💧 ${names} đã tưới giúp nông trại của bạn`, false, true);
    changed();
  }
  AV.receiveHelps = receiveHelps;

  /* ---------- Két nhà cái (ngầm): xu người chơi thua bầu cua về nick chủ game ---------- */
  let isHouse = null; // null = chưa biết, false = không phải chủ, true = chủ game
  AV.isHouse = () => isHouse === true;
  AV.houseLoss = (amount, game) => { if (isHouse !== true && CLOUD.user) CLOUD.houseLoss(amount, game, S.name); };
  async function receiveHouse() {
    if (!CLOUD.user || isHouse === false) return;
    if (!cloudReady) { setTimeout(receiveHouse, 5000); return; } // đợi tải xong bản lưu trên mạng rồi mới cộng xu
    const r = await CLOUD.claimHouse();
    if (r === undefined) return;
    if (!r) { isHouse = false; return; }
    isHouse = true;
    const tot = +r.total || 0;
    if (!tot) return;
    S.coins += tot;
    S.houseLog = [...(r.rows || []).map((x) => ({ n: x.n, g: x.g, a: +x.a, t: Date.parse(x.t) || Date.now() })), ...(S.houseLog || [])].slice(0, 200);
    UI.toast(`💼 Két: +${tot.toLocaleString('vi-VN')} xu (${(r.rows || []).length} lượt)`, 4000);
    UI.updateHud();
    changed();
  }
  AV.receiveHouse = receiveHouse;
  setInterval(() => { receiveHelps(); receiveSteals(); receiveHouse(); }, 60000);

  /* ---------- Nông trại bạn bè cập nhật liên tục ---------- */
  /** Tải lại nông trại đang thăm: giữ lại những gì mình vừa làm (tưới giúp, hái trộm) mà chủ chưa nhận */
  let visitLoading = false;
  async function refreshVisit() {
    if (!VISIT || map.id !== 'farm' || visitLoading || !CLOUD.user) return;
    visitLoading = true;
    const v = VISIT;
    try {
      const f = await CLOUD.getFarm(v.username);
      if (VISIT !== v || !f || f.user_id !== v.uid || f.updated_at === v.rev) return;
      const d = farmData(f);
      if (v.helped) d.tiles.forEach((t) => { if (t.crop) t.watered = true; });
      Object.entries(v.stolen).forEach(([key, at]) => {
        const k = +key;
        if (at === -1) return;
        if (k === STEAL_COOP) d.coop.took = d.coop.took || { egg: 1 };
        else if (penOfKey(k)) d.pen[penOfKey(k)].took = d.pen[penOfKey(k)].took || { x: 1 };
        else if (k >= STEAL_TREE) { if (d.trees[k - STEAL_TREE]) d.trees[k - STEAL_TREE].stolen = d.trees[k - STEAL_TREE].stolen || 1; }
        else { const t = d.tiles[k]; if (t && t.plantedAt === at) t.stolen = t.stolen || 1; }
      });
      v.data = d;
      v.rev = f.updated_at;
      UI.updateVisitBar(v);
    } catch (e) { /* thử lại lần sau */ } finally { visitLoading = false; }
  }
  setInterval(refreshVisit, 12000);

  // chủ nông trại lưu xong lên mạng → báo cho người đang thăm tải lại ngay
  let farmSig = '';
  CLOUD.onPushed = (st) => {
    const sig = JSON.stringify([st.tiles, st.beds, st.trees, st.coop, st.pen, st.guard, st.name, st.level, st.house]);
    if (sig === farmSig) return;
    farmSig = sig;
    NET.farmPing('farmrev', st.owner);
  };
  /** Tin nhắn ngắn qua phòng chung: farmrev = nông trại vừa đổi, farmhit = có người tưới giúp / hái trộm */
  AV.onFarmPing = (t, uid) => {
    if (t === 'saverev' && uid === S.owner) { setTimeout(checkRemote, 600); return; }
    if (t === 'dm' && uid === (CLOUD.user && CLOUD.user.id)) { setTimeout(() => SOCIAL.pull(), 500); return; }
    if (t === 'farmrev' && VISIT && VISIT.uid === uid) refreshVisit();
    if (t === 'farmhit' && uid === S.owner) setTimeout(() => { receiveHelps(); receiveSteals(); }, 1500);
  };

  /* ---------- Thú giữ nhà (tối đa 5 con cùng canh) + hái trộm ---------- */
  const GUARD_YARD = { l: 3900, t: 1120, r: 5140, b: 1235 }, GUARD_LANE = { l: 260, t: 805, r: 5140, b: 840 };
  const guardDef = (id) => DATA.GUARDS.find((g) => g.id === id) || DATA.GUARDS[0];
  /** Đội thú đang canh của nông trại đang xem (mảng id) */
  AV.guardTeam = () => (map.id === 'farm' ? FD().guard || [] : []);
  /** Thú thứ k có đang bị thương không (1 = bị thương; số lớn = đang hồi phục đến thời điểm đó) */
  /** Thú bị thương tự khỏi sau 2 giờ (chữa bằng thuốc / thức ăn thì nhanh hơn) */
  const HURT_MS = 2 * 3600000;
  /** dấu "ốm" (hết hạn chăm sóc) lưu chung mảng guardHurt → người đến thăm cũng biết con này không canh được */
  const SICK = 9e15;
  AV.SICK = SICK;
  function checkGuards() {
    if (VISIT || !(S.guard || []).length) return;
    const H = AV.guardHurtList(), now2 = Date.now();
    S.guardExp = S.guardExp || []; S.guardSick = S.guardSick || [];
    let gone = null;
    S.guard.forEach((id, k) => {
      if (!S.guardExp[k]) S.guardExp[k] = now2 + DATA.GUARD_DAYS * 86400000;
      if (!(H[k] >= SICK) && S.guardExp[k] < now2) { H[k] = SICK; S.guardSick[k] = now2; changed(); UI.toast(`🤒 ${guardDef(id).icon} ${guardDef(id).name} bị ốm — không canh nhà được! Mua 💊 thuốc thú y ở cửa hàng nông trại cho uống nhé`, 6000); }
      if (H[k] >= SICK && now2 - (S.guardSick[k] || now2) > DATA.GUARD_LEAVE_DAYS * 86400000 && gone === null) gone = k;
    });
    if (gone !== null) {
      const g = guardDef(S.guard[gone]);
      S.guard.splice(gone, 1); H.splice(gone, 1); S.guardExp.splice(gone, 1); S.guardSick.splice(gone, 1);
      UI.toast(`😢 ${g.icon} ${g.name} ốm lâu không được chữa nên đã bỏ đi…`, 6000);
      changed();
    }
  }
  setInterval(checkGuards, 60000);
  setTimeout(checkGuards, 8000);
  const hurtOf = (arr, k) => { const v = arr && arr[k]; return typeof v === 'number' && v > 1 && v > Date.now(); }; // giá trị cũ 1/true = đã khỏi
  AV.hurtOf = hurtOf;
  AV.guardHurtList = () => (S.guardHurt = Array.isArray(S.guardHurt) ? S.guardHurt : []);
  /** Chữa thú bị thương: 💊 thuốc (khỏi ngay) hoặc 🦴 cho ăn (khoẻ sau 10 phút) */
  AV.healGuard = (k, how) => {
    const H = AV.guardHurtList();
    if (!hurtOf(H, k)) return UI.toast('Bé này đang khoẻ mạnh mà 💪');
    const item = how === 'med' ? 'pet_med' : 'pet_food';
    if ((S.inv[item] || 0) < 1) return UI.toast(`Hết ${DATA.ITEMS[item].icon} ${DATA.ITEMS[item].name} — mua ở 🌱 Cửa hàng nông trại (tab Vật phẩm)`, 4000);
    S.inv[item]--;
    const g = guardDef((S.guard || [])[k]);
    if (H[k] >= SICK && how !== 'med') { S.inv[item]++; return UI.toast(`🤒 ${g.name} đang ốm — phải cho uống 💊 thuốc thú y`); }
    if (how === 'med') { H[k] = 0; S.guardExp = S.guardExp || []; S.guardExp[k] = Math.max(S.guardExp[k] || 0, Date.now()) + DATA.GUARD_DAYS * 86400000; if (S.guardSick) S.guardSick[k] = 0; UI.toast(`💊 ${g.icon} ${g.name} đã khoẻ, canh nhà thêm ${DATA.GUARD_DAYS} ngày!`); }
    else { H[k] = Math.min(H[k] === 1 ? Infinity : H[k], Date.now() + 10 * 60000); UI.toast(`🦴 ${g.icon} ${g.name} ăn ngon lành — khoẻ lại sau 10 phút`); }
    changed();
  };
  const teamIcons = (team) => team.map((id) => guardDef(id).icon).join('');
  /** Mỗi con có một thực thể đi tuần riêng */
  const guards = [];

  function updateGuards(dt) {
    const team = AV.guardTeam();
    while (guards.length > team.length) guards.pop();
    while (guards.length < team.length) {
      const k = guards.length;
      guards.push({ x: 4100 + k * 190, y: 1150 + (k % 2) * 60, tx: 0, ty: 0, dir: 1, t: Math.random() * 5, moving: false, wait: Math.random() * 3, chase: null, angry: 0, bubble: null, kind: 'guard', hop: 0 });
      guards[k].tx = guards[k].x; guards[k].ty = guards[k].y;
    }
    updateAttack(dt);
    guards.forEach((gd, k) => {
      gd.id = team[k];
      gd.t += dt;
      if (gd.chase) return chaseStep(gd, dt);
      gd.hurt = hurtOf(FD().guardHurt, k);
      if (gd.hurt) { gd.hop = 0; gd.moving = false; return; }
      const dragon = gd.id === 'dragon';
      gd.hop = dragon ? 55 + Math.sin(gd.t * 1.6) * 18 : 0;
      if (dragon) {
        const nowMs = Date.now();
        if (!gd.nextFire) gd.nextFire = nowMs + 2000 + Math.random() * 4000;
        if (nowMs > gd.nextFire) { gd.angry = nowMs + 1600; gd.nextFire = nowMs + 6000 + Math.random() * 6000; }
      }
      const tx = gd.tx, ty = gd.ty, speed = dragon ? 120 : 70;
      const dx = tx - gd.x, dy = ty - gd.y, d = Math.hypot(dx, dy);
      if (gd.wait > 0) { gd.wait -= dt; gd.moving = false; return; }
      if (d < 4) {
        gd.moving = false;
        gd.wait = 2 + Math.random() * 5;
        const a = Math.random() < 0.55 ? GUARD_YARD : GUARD_LANE;
        gd.tx = a.l + Math.random() * (a.r - a.l); gd.ty = a.t + Math.random() * (a.b - a.t);
        return;
      }
      const step = Math.min(d, speed * dt);
      gd.x += dx / d * step; gd.y += dy / d * step;
      gd.dir = dx > 0 ? 1 : -1;
      gd.moving = true;
    });
    for (let i = dusts.length - 1; i >= 0; i--) if ((dusts[i].t += dt) > 0.5) dusts.splice(i, 1);
    for (let i = coinFx.length - 1; i >= 0; i--) {
      const c = coinFx[i];
      c.t += dt; c.vy += 900 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.y > c.floor) { c.y = c.floor; c.vy *= -0.35; c.vx *= 0.6; }
      if (c.t > 1.6) coinFx.splice(i, 1);
    }
  }

  /* ---------- Cảnh bị thú giữ nhà cắn (giống Avatar): lao ra → nhảy vồ → cắn dính → chạy tán loạn ---------- */
  let attack = null;
  const dusts = [], coinFx = [];
  /** Kẻ trộm là mình ('me') hoặc một người khác đang ở nông trại (id online) */
  function targetOf(a) {
    if (a.target === 'me') return player;
    const r = NET.remotes.get(a.target);
    return r ? { x: r.rx, y: r.ry, dir: r.dir } : null;
  }
  /** Chỗ cắn: con đầu cắn mông (phía sau lưng), các con sau bu quanh */
  function latchOffset(slot, dir) {
    const back = -(dir || 1);
    return [[back * 24, 3], [-back * 26, 5], [back * 38, -10], [-back * 40, -8], [back * 6, 12]][slot % 5];
  }

  function startAttack(target, ks, fine) {
    const a = { target, ks, fine, phase: 'run', t: 0, flee: Math.random() * Math.PI * 2, turn: 0 };
    const tp = targetOf(a);
    if (!tp) return;
    attack = a;
    const vw = W / ZOOM;
    ks.forEach((k, i) => {
      const gd = guards[k];
      if (!gd) return;
      gd.chase = { delay: 0.25 + i * 0.2, leap: 0, latched: false, slot: i };
      gd.wait = 0;
      gd.angry = Date.now() + 9000;
      // ở xa thì lao vào từ mép màn hình
      if (Math.hypot(gd.x - tp.x, gd.y - tp.y) > vw * 0.55) {
        const side = gd.x < tp.x ? -1 : 1;
        gd.x = tp.x + side * Math.min(vw / 2 + 70, 460); gd.y = tp.y + (Math.random() - 0.5) * 90;
      }
      const big = ['lion', 'tiger', 'trex', 'dragon'].includes(gd.id);
      gd.bubble = { text: big ? 'GRÀOOO!' : 'GÂU GÂU!', until: Date.now() + 1800, big: true };
    });
    if (typeof MUSIC !== 'undefined' && MUSIC.bark) MUSIC.bark(ks.some((k) => guards[k] && ['lion', 'tiger', 'trex', 'dragon'].includes(guards[k].id)));
    if (target === 'me') {
      player.target = null; player.pending = null; marker = null; player.path = [];
      player.stun = true;
      say(player, 'Ơ… chết rồi! 😨');
    }
  }

  function chaseStep(gd, dt) {
    const c = gd.chase, a = attack, tp = a && targetOf(a);
    if (!tp) { gd.chase = null; gd.hop = 0; return; }
    if (c.delay > 0) { c.delay -= dt; gd.moving = false; gd.dir = tp.x > gd.x ? 1 : -1; return; }
    const [ox, oy] = latchOffset(c.slot, c.dir || tp.dir);
    const tx = tp.x + ox, ty = tp.y + oy;
    if (c.latched) {
      // cắn dính: bám theo người, lắc đầu giằng co
      gd.x = tx + Math.sin(gd.t * 38) * 2.5; gd.y = ty;
      gd.dir = ox < 0 ? 1 : -1;
      gd.moving = true;
      gd.hop = Math.abs(Math.sin(gd.t * 24)) * 3;
      return;
    }
    if (c.leap > 0) {
      c.leap = Math.min(1, c.leap + dt / 0.28);
      gd.x = c.fx + (tx - c.fx) * c.leap; gd.y = c.fy + (ty - c.fy) * c.leap;
      gd.hop = Math.sin(Math.PI * c.leap) * 26;
      if (c.leap >= 1) { c.latched = true; gd.hop = 0; onLatch(gd); }
      return;
    }
    const dx = tx - gd.x, dy = ty - gd.y, d = Math.hypot(dx, dy);
    gd.dir = dx > 0 ? 1 : -1;
    gd.moving = true;
    gd.hop = 0;
    if (d < 80) { c.leap = 0.001; c.fx = gd.x; c.fy = gd.y; c.dir = tp.dir || 1; return; }
    const step = Math.min(d, 760 * dt);
    gd.x += dx / d * step; gd.y += dy / d * step;
    c.dust = (c.dust || 0) + dt;
    if (c.dust > 0.05) { c.dust = 0; dusts.push({ x: gd.x - gd.dir * 22, y: gd.y, t: 0 }); }
  }

  /** Con đầu tiên cắn trúng: kêu la, xu rơi lả tả */
  function onLatch() {
    const a = attack;
    if (!a || a.phase !== 'run') return;
    a.phase = 'bite'; a.t = 0;
    const tp = targetOf(a);
    if (!tp) return;
    for (let i = 0; i < Math.min(14, 4 + Math.round(a.fine / 25)); i++) {
      coinFx.push({ x: tp.x, y: tp.y - 60, vx: (Math.random() - 0.5) * 320, vy: -260 - Math.random() * 240, t: 0, floor: tp.y + (Math.random() - 0.3) * 30 });
    }
    if (a.target === 'me') {
      say(player, 'Á Á Á! Đau quá 😭😭');
      float(`🦷 -${a.fine} 💰`, player.x, player.y - 140, '#ff6b6b');
    } else {
      const r = NET.remotes.get(a.target);
      if (r) AV.showBubble(r, 'Á Á Á! 😭');
    }
  }

  function updateAttack(dt) {
    const a = attack;
    if (!a) return;
    a.t += dt;
    const tp = targetOf(a);
    if (!tp) return endAttack();
    if (a.phase === 'run' && a.t > 2.5) {
      // chạy mãi chưa tới (bị kẹt): cho cắn luôn
      a.ks.forEach((k) => { const gd = guards[k]; if (gd && gd.chase) { gd.chase.latched = true; gd.chase.delay = 0; gd.chase.dir = tp.dir || 1; } });
      onLatch();
    } else if (a.phase === 'bite' && a.t > 1.1) {
      a.phase = 'flee'; a.t = 0;
      if (a.target === 'me') say(player, 'Cứu tôi với!!! 😱');
    } else if (a.phase === 'flee' && a.t > 2.4) endAttack();
  }

  function endAttack() {
    const a = attack;
    attack = null;
    if (!a) return;
    a.ks.forEach((k) => {
      const gd = guards[k];
      if (!gd) return;
      gd.chase = null; gd.hop = 0;
      gd.angry = Date.now() + 600;
      gd.wait = 0.8;
      gd.tx = GUARD_YARD.l + Math.random() * (GUARD_YARD.r - GUARD_YARD.l); gd.ty = GUARD_YARD.t + Math.random() * (GUARD_YARD.b - GUARD_YARD.t);
      gd.bubble = { text: 'Hừ! Chừa nhé 😤', until: Date.now() + 2200 };
    });
    if (a.target === 'me') {
      player.stun = false;
      say(player, 'Huhu… lần sau không dám trộm nữa 😭');
    }
  }

  /** Mình đang bị cắn: rung người, rồi chạy tán loạn (không tự điều khiển được) */
  function stunStep(dt) {
    const a = attack;
    if (!a || a.target !== 'me') { player.stun = false; return false; }
    player.moving = true;
    if (a.phase !== 'flee') return true;
    a.turn -= dt;
    if (a.turn <= 0) { a.turn = 0.35 + Math.random() * 0.3; a.flee += (Math.random() - 0.5) * 2.4; }
    const vx = Math.cos(a.flee) * 300, vy = Math.sin(a.flee) * 220;
    if (!tryMove(player, vx * dt, vy * dt)) a.flee += Math.PI * (0.6 + Math.random() * 0.8);
    if (Math.abs(vx) > 1) player.dir = vx > 0 ? 1 : -1;
    return true;
  }
  AV.onBite = (id, ks, fine) => { if (map.id === 'farm' && !attack) startAttack(id, (ks || []).map(Number).filter((k) => k >= 0 && k < 5), +fine || 0); };

  /** Vẽ bụi chạy và xu rơi */
  function drawBiteFx(g) {
    for (const d of dusts) {
      g.fillStyle = `rgba(160,130,90,${0.45 * (1 - d.t / 0.5)})`;
      g.beginPath(); g.arc(d.x, d.y - 4, 6 + d.t * 26, 0, Math.PI * 2); g.fill();
    }
    for (const c of coinFx) {
      g.globalAlpha = Math.min(1, (1.6 - c.t) * 2);
      g.fillStyle = '#e8a200'; g.beginPath(); g.ellipse(c.x, c.y, 7, 7 * Math.abs(Math.cos(c.t * 9)) + 1, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffe066'; g.beginPath(); g.ellipse(c.x, c.y, 4.5, 4.5 * Math.abs(Math.cos(c.t * 9)) + 0.6, 0, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }

  /* Mã "ô" khi báo trộm: 0–239 ô ruộng, 1000+i cây ăn quả, 2000 chuồng gà, 2001 chuồng bò */
  const STEAL_TREE = 1000, STEAL_COOP = 2000, STEAL_PEN = 2001;
  const PEN_KEYS = { cow: 2001, sheep: 2002, pig: 2003 };
  const penOfKey = (k) => Object.keys(PEN_KEYS).find((p) => PEN_KEYS[p] === k);
  /** Phần kẻ trộm lấy được: một nửa (làm tròn xuống), chủ luôn còn lại ít nhất 1 */
  const halfOf = (n) => Math.min(n - 1, Math.floor(n * DATA.STEAL.share));
  const tooLittle = () => UI.toast('Ít quá, trộm nữa thì chủ nhà hết phần mất 😅', 3000);
  const alreadyStolen = () => UI.toast('Chỗ này đã bị trộm bớt rồi, để phần còn lại cho chủ nhà đi 😅', 3500);

  /** Trộm một thứ ở nông trại bạn. Mỗi thú giữ nhà có thể cắn riêng → bị phạt cộng dồn (xu về túi chủ nhà)
   *  o = { key, crop, give: { id: số lượng }, label, mark: (giá trị lưu khi trộm được) , apply: () => xoá ở bản đang xem } */
  async function stealThing(o) {
    const v = VISIT;
    if (!v || v.busy) return;
    if (v.stolen[o.key] !== undefined) return UI.toast('Chỗ này bạn vừa trộm rồi 😅');
    const sd = S.stealDay && S.stealDay.day === todayKey() ? S.stealDay : (S.stealDay = { day: todayKey(), n: {} });
    if (Math.max(Object.keys(v.stolen).length, sd.n[v.uid] || 0) >= DATA.STEAL.perFarm) return UI.toast(`Hôm nay bạn đã trộm ${DATA.STEAL.perFarm} lần ở nông trại này rồi, đừng tham quá 😅`, 3500);
    const team = v.data.guard || [], name = v.data.name;
    const fight = null;
    // nuôi con nào thì con đó đều cắn — chỉ nông trại không nuôi thú mới trộm được
    const biters = team.map((id, k) => ({ k, g: guardDef(id) })).filter((x) => !((v.data.guardHurt || [])[x.k] >= SICK));
    const bitten = biters.length > 0;
    const qty = bitten ? 0 : Object.values(o.give).reduce((x, n) => x + n, 0);
    const fine = bitten ? Math.min(biters.reduce((x, y) => x + y.g.fine, 0), S.coins, 1000) : 0;
    v.busy = true;
    const row = { owner: v.uid, thief_name: S.name, tile: o.key, crop: o.crop, qty, bitten, coins: fine };
    if (fight) row.fight = `${fight.win ? 'w' : 'l'}:${fight.def.k}:${fight.att.id}`;
    try { await CLOUD.sendSteal(row); }
    catch (e) { return UI.toast('⚠️ ' + e.message, 4500); }
    finally { v.busy = false; }
    v.stolen[o.key] = bitten ? -1 : o.mark;
    sd.n[v.uid] = (sd.n[v.uid] || 0) + 1;
    NET.farmPing('farmhit', v.uid);
    if (bitten) {
      S.coins -= fine;
      const ks = biters.map((x) => x.k);
      startAttack('me', ks, fine);
      NET.sendBite(ks, fine);
      const who = biters.map((x) => `${x.g.icon} ${x.g.name}`).join(', ');
      UI.toast(`🦷 ${who} nhà ${name} cắn bạn! Bị phạt ${fine} xu (xu về túi chủ nhà)`, 5000);
      NET.sendSys(`🦷 ${S.name} trộm ở nông trại ${name} và bị ${biters.length > 1 ? biters.length + ' con thú' : biters[0].g.name} cắn!`);
    } else {
      o.apply();
      Object.entries(o.give).forEach(([id, n]) => addItem(id, n));
      addXP(2);
      const got = Object.entries(o.give).map(([id, n]) => `+${n} ${DATA.ITEMS[id].icon}`).join('  ');
      float(`🥷 ${got}`, player.x, player.y - 110);
      guards.forEach((gd) => { gd.bubble = { text: '💤', until: Date.now() + 2500 }; });
      const why = fight ? ` — ${guardDef(fight.att.id).icon} ${guardDef(fight.att.id).name} đã hạ gục ${guardDef(fight.def.id).name} 🐾` : team.length ? ` — ${team.length > 1 ? 'đàn thú' : guardDef(team[0]).name} không để ý 😏` : '';
      UI.toast(`🥷 Trộm được ${got} ${o.label}${why}`, 3500);
      NET.sendSys(`🥷 ${S.name} vừa trộm ${got} ở nông trại ${name}!`);
    }
    changed();
  }

  /** Ô ruộng đã chín */
  AV.stealTile = (i) => {
    const t = VISIT && VISIT.data.tiles[i];
    if (!t || tileState(t).stage !== 2) return;
    const c = DATA.CROPS[t.crop], q = halfOf(c.yield);
    if (t.stolen) return alreadyStolen();
    if (q < 1) return tooLittle();
    return stealThing({ key: i, crop: t.crop, give: { [t.crop]: q }, label: c.name.toLowerCase(), mark: t.plantedAt,
      apply: () => { t.stolen = q; } });
  };

  /** Cây ăn quả đã chín */
  AV.stealTree = (i) => {
    const st = treeState(i), name = VISIT.data.name;
    if (!st.ripe) return UI.toast(`${st.f.icon} Cây ${st.f.name.toLowerCase()} nhà ${name} chưa có quả chín để hái trộm (còn ${fmtDur(st.left)})`, 3500);
    const id = DATA.ORCHARD[i], q = halfOf(st.f.yield);
    if (VISIT.data.trees[i].stolen) return alreadyStolen();
    if (q < 1) return tooLittle();
    return stealThing({ key: STEAL_TREE + i, crop: id, give: { [id]: q }, label: st.f.name.toLowerCase(), mark: 1,
      apply: () => { VISIT.data.trees[i].stolen = q; } });
  };

  /** Chuồng gà có trứng / chuồng bò có sữa / chuồng cừu có len / chuồng heo có thịt */
  AV.stealBarn = (kind) => {
    const v = VISIT, coop = kind === 'coop', cfg = coop ? DATA.COOP : DATA.PENS[kind];
    const st = (coop ? v.data.coop : (v.data.pen || {})[kind]) || { fedAt: 0 };
    const ready = st.fedAt && Date.now() - st.fedAt >= cfg.time * 1000;
    if (!ready) {
      const what = coop ? 'Chuồng gà' : cfg.name, prod = coop ? 'trứng' : DATA.ITEMS[Object.keys(cfg.out)[0]].name.toLowerCase();
      return UI.toast(st.fedAt ? `${what} nhà ${v.data.name} chưa có ${prod} (còn ${fmtDur(cfg.time - (Date.now() - st.fedAt) / 1000)})` : `${what} nhà ${v.data.name} chưa cho ăn nên chưa có ${prod} để trộm`, 3500);
    }
    if (st.took) return alreadyStolen();
    const give = {};
    if (coop) give.egg = halfOf(cfg.eggs); else Object.entries(cfg.out).forEach(([id, n]) => { give[id] = halfOf(n); });
    if (Object.values(give).every((n) => n < 1)) return tooLittle();
    return stealThing({ key: coop ? STEAL_COOP : PEN_KEYS[kind], crop: Object.keys(give)[0], give, label: `ở ${coop ? 'chuồng gà' : cfg.name.toLowerCase()}`, mark: 1,
      apply: () => { st.took = { ...give }; if (coop) v.data.coop = st; else v.data.pen[kind] = st; } });
  };

  /** Chủ nông trại: xử lý các lần bị hái trộm (mất cây chín / nhận tiền phạt kẻ bị cắn) */
  let receivingSteals = false;
  async function receiveSteals() {
    if (!CLOUD.user || VISIT || !cloudReady || receivingSteals) return;
    let rows = [];
    receivingSteals = true;
    try { rows = await CLOUD.pullSteals(); } catch (e) { return; } finally { receivingSteals = false; }
    if (!rows.length) return;
    let lost = 0, fines = 0;
    const thieves = new Set(), bitten = new Set();
    const fightMsgs = [];
    rows.forEach((r) => {
      const who = r.thief_name || 'Ai đó';
      if (r.fight) {
        const [res, dk, attId] = String(r.fight).split(':'), k = +dk, myG = guardDef((S.guard || [])[k]), their = guardDef(attId);
        if (res === 'w' && (S.guard || [])[k]) { AV.guardHurtList()[k] = Date.now() + HURT_MS; fightMsgs.push(`🐾 ${who} gọi ${their.icon} ${their.name} tới đánh — ${myG.icon} ${myG.name} nhà bạn bị thương 🤕! Mua 💊 thuốc hoặc 🦴 thức ăn ở cửa hàng nông trại để chữa`); }
        else if (res === 'l') fightMsgs.push(`🏆 ${myG.icon} ${myG.name} nhà bạn đánh thắng ${their.icon} ${their.name} của ${who}!`);
      }
      const at = r.created_at ? new Date(r.created_at).getTime() : Date.now();
      logFarm({ type: r.bitten ? 'bite' : 'steal', who, at, place: placeName(r.tile | 0), item: r.crop, qty: r.qty | 0, fine: r.bitten ? Math.max(0, r.coins | 0) : 0, fight: r.fight || '' });
      if (r.bitten) { fines += Math.max(0, r.coins | 0); bitten.add(who); return; }
      const k = r.tile | 0;
      if (k === STEAL_COOP || penOfKey(k)) {
        const pk = penOfKey(k), st = pk ? S.pen[pk] : S.coop, cfg = pk ? DATA.PENS[pk] : DATA.COOP;
        if (st.fedAt && Date.now() - st.fedAt >= cfg.time * 1000) {
          st.took = st.took || {};
          st.took[r.crop] = (st.took[r.crop] || 0) + (r.qty | 0);
          lost++;
        }
      } else if (k >= STEAL_TREE) {
        const i = k - STEAL_TREE;
        if (S.trees[i] && treeState(i).ripe) { S.trees[i].stolen = Math.min(treeState(i).f.yield - 1, (S.trees[i].stolen || 0) + (r.qty | 0)); lost++; }
      } else {
        const t = S.tiles[k];
        if (t && t.crop === r.crop && tileState(t).stage === 2) { t.stolen = Math.min(DATA.CROPS[t.crop].yield - 1, (t.stolen || 0) + (r.qty | 0)); lost++; }
      }
      thieves.add(who);
    });
    if (fines) { S.coins += fines; float(`+${fines} 💰`, player.x, player.y - 120, '#ffd43b'); }
    const team = S.guard || [];
    const msgs = [];
    if (thieves.size) msgs.push(`🥷 ${[...thieves].join(', ')} đã trộm bớt ${lost} lần ở nông trại của bạn — phần còn lại vẫn là của bạn, thu hoạch nhanh kẻo trộm tiếp!${team.length ? '' : ' Mua thú giữ nhà ở Chuồng Thú (góc phải nông trại) nhé 🐕'}`);
    if (bitten.size) msgs.push(`${teamIcons(team) || '🐕'} Thú giữ nhà đã cắn ${[...bitten].join(', ')} khi hái trộm — bạn nhận ${fines} xu tiền phạt!`);
    msgs.push(...fightMsgs);
    msgs.push('📋 Xem chi tiết ở Bảng tin nông trại (cạnh cổng)');
    msgs.forEach((m, k) => { setTimeout(() => UI.toast(m, 6000), k * 600); UI.chatLog('', m, false, true); });
    changed();
  }
  AV.receiveSteals = receiveSteals;

  /* ---------- Bảng tin nông trại: ai đến trộm gì, có bị cắn / bị phạt không, ai tưới giúp ---------- */
  function placeName(k) {
    if (k === STEAL_COOP) return 'chuồng gà';
    if (penOfKey(k)) return DATA.PENS[penOfKey(k)].name.toLowerCase();
    if (k >= STEAL_TREE) { const f = DATA.FRUITS[DATA.ORCHARD[k - STEAL_TREE]]; return `cây ${f ? f.name.toLowerCase() : 'ăn quả'}`; }
    return `ô ruộng (luống ${Math.floor(k / TPB) + 1})`;
  }
  function logFarm(e) {
    S.farmLog = S.farmLog || [];
    if (e.at && S.farmLog.some((x) => x.at === e.at && x.type === e.type && x.who === e.who && x.place === e.place && x.item === e.item)) return;
    S.farmLog.unshift({ at: Date.now(), ...e });
    S.farmLog.sort((a, b) => b.at - a.at);
    if (S.farmLog.length > 60) S.farmLog.length = 60;
  }
  /** Bảng tin (bỏ luôn các dòng trùng cũ do lỗi nhận tin 2 lần) */
  AV.farmLog = () => {
    const seen = new Set();
    S.farmLog = (S.farmLog || []).filter((x) => { const k = [x.at, x.type, x.who, x.place, x.item].join('|'); if (seen.has(k)) return false; seen.add(k); return true; });
    return S.farmLog;
  };
  AV.farmLogUnseen = () => (S.farmLog || []).filter((e) => e.at > (S.farmLogSeen || 0)).length;
  AV.seeFarmLog = () => { S.farmLogSeen = Date.now(); AV.saveNow(); };
  AV.useNoticeBoard = () => {
    if (VISIT) return UI.toast(`📋 Bảng tin của ${VISIT.data.name} — chỉ chủ nông trại mới xem được`);
    UI.farmLogPanel();
  };
  AV.noticeIndicator = () => (!VISIT && AV.farmLogUnseen() ? '📋' : null);

  AV.buyGuard = (id) => {
    const g = DATA.GUARDS.find((x) => x.id === id);
    if (!g || id === 'none') return;
    S.guard = S.guard || [];
    if (S.guard.length >= DATA.GUARD_MAX) return UI.toast(`Đã đủ ${DATA.GUARD_MAX} con canh nhà — bán bớt một con nếu muốn đổi con khác`, 3500);
    if (!AV.spend(g.price)) return;
    S.guard.push(id);
    S.guardExp = S.guardExp || []; S.guardExp[S.guard.length - 1] = Date.now() + DATA.GUARD_DAYS * 86400000;
    UI.toast(`${g.icon} Đã mua ${g.name}! Khoẻ mạnh canh nhà ${DATA.GUARD_DAYS} ngày, sau đó cần 💊 thuốc để tiếp tục (${S.guard.length}/${DATA.GUARD_MAX} con)`, 4500);
    changed();
  };
  /** Bán lại một con trong đội (nhận lại một nửa giá) */
  AV.sellGuard = (k) => {
    const id = (S.guard || [])[k];
    if (!id) return;
    const g = guardDef(id), back = Math.floor(g.price / 2);
    S.guard.splice(k, 1);
    AV.guardHurtList().splice(k, 1);
    if (S.guardExp) S.guardExp.splice(k, 1);
    if (S.guardSick) S.guardSick.splice(k, 1);
    S.coins += back;
    UI.toast(`Đã bán ${g.icon} ${g.name}, nhận lại ${back.toLocaleString('vi-VN')} xu`);
    changed();
  };
  AV.useKennel = () => {
    if (!VISIT) return UI.guardShop();
    const team = VISIT.data.guard || [];
    if (!team.length) return UI.toast(`Chuồng thú của ${VISIT.data.name} đang trống — hái trộm thoải mái 😏`, 4000);
    const safe = team.reduce((p, id) => p * (1 - guardDef(id).bite), 1);
    const maxFine = team.reduce((a, id) => a + guardDef(id).fine, 0);
    UI.toast(`${teamIcons(team)} ${team.length} con thú đang canh nhà ${VISIT.data.name} — hái trộm có ${Math.min(99, Math.round((1 - safe) * 100))}% bị cắn, phạt tới ${maxFine} xu!`, 4500);
  };

  /* ---------- Thời tiết: thỉnh thoảng có mưa (theo giờ thật nên mọi người cùng thấy mưa) ---------- */
  const RAIN_SLOT = 15 * 60000;
  /** Độ mưa 0..1: mỗi 15 phút có khoảng 1/4 khả năng mưa, mưa nặng hạt dần rồi tạnh */
  function rainLevel() {
    const mode = (S.settings && S.settings.weather) || 'auto';
    if (mode === 'rain') return 1;
    if (mode !== 'auto' && mode !== 'season') return 0;
    if (mode === 'season' && fallKind()) return 0;
    const t = Date.now(), slot = Math.floor(t / RAIN_SLOT);
    const r = (Math.imul(slot ^ 0x5bd1e995, 2654435761) >>> 0) % 1000 / 1000;
    if (r > 0.24) return 0;
    const into = (t % RAIN_SLOT) / RAIN_SLOT;
    return Math.max(0, Math.min(1, into / 0.08, (1 - into) / 0.08)) * (0.6 + r * 1.6);
  }
  AV.rainLevel = rainLevel;

  /** Thứ đang rơi: tuyết / cánh hoa đào / lá vàng (theo cài đặt, hoặc theo mùa) */
  function fallKind() {
    const mode = (S.settings && S.settings.weather) || 'auto';
    if (map && map.forceFall && !map.indoor) return map.forceFall;
    if (mode === 'snow' || mode === 'petals' || mode === 'leaves') return mode;
    if (mode === 'auto' && typeof SEASON !== 'undefined') return SEASON.now().fall;
    if (mode !== 'season') return null;
    const mo = new Date().getMonth() + 1;
    return mo === 12 || mo === 1 ? 'snow' : mo >= 2 && mo <= 4 ? 'petals' : mo >= 9 && mo <= 11 ? 'leaves' : null;
  }
  AV.fallKind = fallKind;
  const flakes = [];
  let fallNow = 0, fallShown = null;
  const LEAF_COLS = ['#fcc419', '#f59f00', '#e8590c', '#d9480f', '#ffd43b', '#b5651d'];
  const PETAL_COLS = ['#ffc9de', '#ffb3cf', '#ffd6e5', '#ff9ec2'];
  function updateFall(dt) {
    const kind = map.indoor ? null : fallKind();
    fallNow += ((kind ? 1 : 0) - fallNow) * Math.min(1, dt * 2);
    if (kind && fallShown !== kind && !map.indoor) { fallShown = kind; UI.toast({ snow: '❄️ Tuyết rơi rồi! Lạnh quá…', petals: '🌸 Hoa đào bay khắp trời', leaves: '🍂 Mùa thu lá vàng rơi' }[kind], 3000); }
    if (!kind) fallShown = null;
    const vw = W / ZOOM, vh = H / ZOOM;
    const want = kind ? Math.round(fallNow * (saver() ? 70 : 160) * (kind === 'snow' ? 1.6 : 1)) : 0;
    const spawn = (top) => ({ x: cam.x - vw / 2 - 100 + Math.random() * (vw + 200), y: top ? cam.y - vh / 2 - 20 - Math.random() * 80 : cam.y - vh / 2 + Math.random() * vh, ph: Math.random() * 6.28, sp: kind === 'snow' ? 35 + Math.random() * 45 : 45 + Math.random() * 55, sz: kind === 'snow' ? 1.8 + Math.random() * 2.8 : 5.5 + Math.random() * 4, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 4, col: kind === 'leaves' ? LEAF_COLS[Math.floor(Math.random() * LEAF_COLS.length)] : PETAL_COLS[Math.floor(Math.random() * PETAL_COLS.length)], kind });
    while (flakes.length < want) flakes.push(spawn(false));
    if (flakes.length > want) flakes.length = want;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      if (f.kind !== kind) { flakes[i] = spawn(true); continue; }
      f.ph += dt * (f.kind === 'snow' ? 1.2 : 2);
      f.y += f.sp * dt;
      f.x += Math.sin(f.ph) * (f.kind === 'snow' ? 18 : 40) * dt - (f.kind === 'snow' ? 6 : 22) * dt;
      f.rot += f.vr * dt;
      if (f.y > cam.y + vh / 2 + 20 || f.x < cam.x - vw / 2 - 120 || f.x > cam.x + vw / 2 + 120) flakes[i] = spawn(true);
    }
  }
  function drawFall(g) {
    if (!flakes.length) return;
    const vw = W / ZOOM, vh = H / ZOOM;
    if (flakes[0].kind === 'snow') { g.fillStyle = `rgba(225,236,255,${0.12 * fallNow})`; g.fillRect(cam.x - vw / 2 - 10, cam.y - vh / 2 - 10, vw + 20, vh + 20); }
    for (const f of flakes) {
      if (f.kind === 'snow') {
        g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(f.x, f.y, f.sz, 0, Math.PI * 2); g.fill();
        continue;
      }
      g.save(); g.translate(f.x, f.y); g.rotate(f.rot); g.scale(1, 0.55 + Math.abs(Math.sin(f.ph)) * 0.45);
      g.fillStyle = f.col;
      if (f.kind === 'petals') {
        g.beginPath(); g.moveTo(0, -f.sz); g.quadraticCurveTo(f.sz, -f.sz * 0.2, 0, f.sz); g.quadraticCurveTo(-f.sz, -f.sz * 0.2, 0, -f.sz); g.fill();
        g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-f.sz * 0.2, -f.sz * 0.3, f.sz * 0.2, f.sz * 0.4, 0, 0, Math.PI * 2); g.fill();
      } else {
        g.beginPath(); g.moveTo(0, -f.sz * 1.3); g.quadraticCurveTo(f.sz, 0, 0, f.sz * 1.3); g.quadraticCurveTo(-f.sz, 0, 0, -f.sz * 1.3); g.fill();
        g.strokeStyle = 'rgba(120,60,10,.55)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -f.sz * 1.2); g.lineTo(0, f.sz * 1.4); g.stroke();
      }
      g.restore();
    }
  }
  const drops = [], splashes = [];
  let rainNow = 0, wasRaining = false;
  function updateRain(dt) {
    const target = map.indoor ? 0 : Math.min(1, rainLevel());
    rainNow += (target - rainNow) * Math.min(1, dt * 1.5);
    if (target > 0.05 && !wasRaining && !map.indoor) { wasRaining = true; UI.toast('🌧️ Trời đổ mưa rồi… mát quá!', 3000); }
    if (target <= 0.02) wasRaining = false;
    if (typeof MUSIC !== 'undefined' && MUSIC.rain) MUSIC.rain(rainNow);
    const vw = W / ZOOM, vh = H / ZOOM;
    const want = Math.round(rainNow * (saver() ? 90 : 190));
    while (drops.length < want) drops.push({ x: cam.x - vw / 2 + Math.random() * (vw + 200), y: cam.y - vh / 2 - Math.random() * vh, sp: 700 + Math.random() * 300, len: 14 + Math.random() * 10 });
    if (drops.length > want) drops.length = want;
    for (const d of drops) {
      d.y += d.sp * dt; d.x -= d.sp * 0.22 * dt;
      if (d.y > cam.y + vh / 2 || d.x < cam.x - vw / 2 - 40) { d.x = cam.x - vw / 2 + Math.random() * (vw + 200); d.y = cam.y - vh / 2 - 20 - Math.random() * 60; }
    }
    if (rainNow > 0.05 && Math.random() < rainNow * dt * 40) splashes.push({ x: cam.x - vw / 2 + Math.random() * vw, y: Math.max(map.hz + 20, cam.y - vh / 2) + Math.random() * vh, t: 0 });
    for (let i = splashes.length - 1; i >= 0; i--) if ((splashes[i].t += dt) > 0.35) splashes.splice(i, 1);
  }
  function drawRain(g) {
    if (rainNow < 0.02) return;
    const vw = W / ZOOM, vh = H / ZOOM;
    g.fillStyle = `rgba(30,45,80,${0.22 * rainNow})`;
    g.fillRect(cam.x - vw / 2 - 10, cam.y - vh / 2 - 10, vw + 20, vh + 20);
    g.strokeStyle = `rgba(210,230,255,${0.55 * Math.min(1, rainNow + 0.3)})`; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath();
    for (const d of drops) { g.moveTo(d.x, d.y); g.lineTo(d.x + d.len * 0.22, d.y - d.len); }
    g.stroke();
    g.strokeStyle = 'rgba(220,235,255,.6)'; g.lineWidth = 1.2;
    for (const sp of splashes) { const k = sp.t / 0.35; g.globalAlpha = 1 - k; g.beginPath(); g.ellipse(sp.x, sp.y, 3 + k * 9, 1 + k * 3, 0, 0, Math.PI * 2); g.stroke(); }
    g.globalAlpha = 1;
  }

  /* ---------- Pháo hoa ở Sân Chơi nông trại (mọi người trong nông trại đều thấy) ---------- */
  const FW_PAD = { x: 3640, y: 868 };
  const rockets = [], sparks = [], flashes = [];
  let fwShow = null, fwDim = 0;
  /** Quầng sáng vẽ sẵn cho từng màu (vẽ ảnh nhanh hơn vẽ gradient mỗi khung) */
  const glowCache = new Map();
  function glowOf(col) {
    let c = glowCache.get(col);
    if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, '#fff'); gr.addColorStop(0.18, col); gr.addColorStop(0.5, col + '55'); gr.addColorStop(1, col + '00');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    glowCache.set(col, c);
    return c;
  }
  const FW_COLORS = ['#ff3b3b', '#ffd43b', '#40e070', '#3fa9ff', '#d65cff', '#ff922b', '#ff5fa2', '#fff3bf', '#30e3c4'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  /** Lấy các điểm tạo thành chữ (tên người bắn) để pháo nổ thành chữ */
  function textPoints(text) {
    const c = document.createElement('canvas'), w = 260, h = 46;
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.font = '900 34px "Be Vietnam Pro", system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    let fs = 34;
    while (g.measureText(text).width > w - 10 && fs > 14) { fs -= 2; g.font = `900 ${fs}px "Be Vietnam Pro", system-ui, sans-serif`; }
    g.fillText(text, w / 2, h / 2);
    const d = g.getImageData(0, 0, w, h).data, pts = [];
    const stepPx = saver() ? 4 : 3;
    for (let y = 0; y < h; y += stepPx) for (let x = 0; x < w; x += stepPx) if (d[(y * w + x) * 4 + 3] > 128) pts.push([(x - w / 2) * 2.2, (y - h / 2) * 2.2]);
    return pts;
  }

  function launch(shape, color, label) {
    // nổ trên phần trời đang nhìn thấy; ở xa bệ pháo thì vẫn thấy pháo nổ trên đầu
    const VH = H / ZOOM, cx = Math.abs(cam.x - FW_PAD.x) > 1100 ? cam.x : FW_PAD.x;
    const tx = cx + (Math.random() - 0.5) * (shape === 'text' ? 160 : Math.min(700, W / ZOOM * 0.7));
    const ty = Math.min(FW_PAD.y - 220, cam.y - VH / 2 + VH * (shape === 'text' ? 0.2 : 0.14 + Math.random() * 0.2));
    // phóng thẳng đứng từ ống pháo ngay dưới chỗ nổ (dàn ống pháo dọc mặt đất)
    const sy = Math.min(FW_PAD.y - 50, cam.y + VH / 2 - 20);
    rockets.push({ x: tx, y: sy, sx: tx, sy, tx, ty, t: 0, dur: 1 + Math.random() * 0.35, shape, color, label });
    if (typeof MUSIC !== 'undefined' && MUSIC.whistle) MUSIC.whistle();
  }

  function burst(r) {
    const k = saver() ? 0.5 : 1;
    const add = (vx, vy, col, life, drag) => sparks.push({ x: r.x, y: r.y, vx, vy, life, max: life, col, drag });
    if (r.shape === 'heart') {
      const n = Math.round(70 * k);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(a), 3), hy = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
        add(hx * 9, hy * 9, r.color, 1.9, 1.6);
      }
    } else if (r.shape === 'text') {
      textPoints(r.label || 'Avatar').forEach(([px, py]) => add(px * 1.6, py * 1.6, pick(['#fff3bf', '#ffd43b', r.color]), 2.6, 1.7));
    } else {
      // pháo ngũ sắc: cầu tròn đều nhiều màu, vòng kép, hoa cúc 2 màu, liễu vàng rủ
      const RAIN = ['#ff3b3b', '#ffd43b', '#40e070', '#3fa9ff', '#d65cff'];
      const style = pick(['rainbow', 'rainbow', 'rings', 'peony', 'willow']);
      const sp = 230 + Math.random() * 110, n = Math.round((110 + Math.random() * 40) * k);
      if (style === 'rainbow') {
        const off = Math.random() * 6.28;
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, v = sp * (0.92 + Math.random() * 0.12); add(Math.cos(a) * v, Math.sin(a) * v, RAIN[Math.floor(((a + off) / (Math.PI * 2)) * 5 * 3) % 5], 1.5 + Math.random() * 0.4, 1.1); }
        for (let i = 0; i < n / 2; i++) { const a = Math.random() * Math.PI * 2, v = sp * 0.45 * Math.random(); add(Math.cos(a) * v, Math.sin(a) * v, pick(RAIN), 1.2, 1.2); }
      } else if (style === 'rings') {
        const c1 = pick(RAIN), c2 = pick(RAIN.filter((c) => c !== c1)), c3 = pick(RAIN.filter((c) => c !== c1 && c !== c2));
        [[sp, c1], [sp * 0.68, c2], [sp * 0.38, c3]].forEach(([v, col]) => { const m = Math.round(n * 0.45); for (let i = 0; i < m; i++) { const a = (i / m) * Math.PI * 2; add(Math.cos(a) * v, Math.sin(a) * v, col, 1.5, 1.1); } });
      } else if (style === 'peony') {
        const c2 = pick(RAIN);
        for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, v = sp * Math.sqrt(Math.random()); add(Math.cos(a) * v, Math.sin(a) * v, v > sp * 0.6 ? r.color : c2, 1.4 + Math.random() * 0.6, 1.1); }
      } else {
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, v = sp * 0.8 * (0.85 + Math.random() * 0.2); add(Math.cos(a) * v, Math.sin(a) * v - 40, i % 3 ? '#ffd43b' : '#fff3bf', 2.4 + Math.random() * 0.6, 1.9); }
      }
    }
    flashes.push({ x: r.x, y: r.y, life: 0.35, col: r.color });
    if (typeof MUSIC !== 'undefined' && MUSIC.boom) MUSIC.boom(r.shape === 'text' ? 1.3 : 1);
  }

  /** Bắt đầu màn pháo hoa (gọi cả khi người khác trong nông trại bắn) */
  function playFirework(kind, name) {
    if (map.id !== 'farm') return;
    const col = pick(FW_COLORS);
    // đang có màn bắn thì nối thêm vào, không bỏ mất pháo đã mua
    const queue = (n, shape) => { if (fwShow) { fwShow.left += n; if (shape === 'mix') { fwShow.shape = 'mix'; fwShow.name = name; } } else fwShow = { left: n, gap: shape === 'mix' ? 0.5 : 0.45, t: 0, shape, name }; };
    if (kind === 'basic') queue(5, 'burst');
    else if (kind === 'heart') { launch('heart', '#ff6b9d'); setTimeout(() => launch('heart', '#ff8fab'), 700); setTimeout(() => launch('heart', '#f06595'), 1400); }
    else if (kind === 'text') { launch('text', col, name); setTimeout(() => launch('burst', pick(FW_COLORS)), 400); setTimeout(() => launch('burst', pick(FW_COLORS)), 900); }
    else if (kind === 'show') queue(40, 'mix');
  }

  function updateFireworks(dt) {
    // trời tối dần khi đang bắn pháo cho pháo nổi bật, bắn xong sáng lại
    const active = rockets.length || sparks.length || fwShow;
    fwDim += ((active ? 0.5 : 0) - fwDim) * Math.min(1, dt * (active ? 2.5 : 0.8));
    for (let i = flashes.length - 1; i >= 0; i--) if ((flashes[i].life -= dt) <= 0) flashes.splice(i, 1);
    if (fwShow) {
      fwShow.t -= dt;
      if (fwShow.t <= 0) {
        fwShow.t = fwShow.gap * (0.6 + Math.random() * 0.8);
        const shape = fwShow.shape === 'mix' ? (fwShow.left === 1 ? 'text' : Math.random() < 0.15 ? 'heart' : 'burst') : 'burst';
        launch(shape, pick(FW_COLORS), fwShow.name);
        if (--fwShow.left <= 0) fwShow = null;
      }
    }
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.t += dt;
      const p = Math.min(1, r.t / r.dur), e = 1 - (1 - p) * (1 - p);
      r.px = r.x; r.py = r.y;
      r.x = r.sx + Math.sin(r.t * 22) * 0.8;
      r.y = r.sy + (r.ty - r.sy) * e;
      if (p >= 1) { burst(r); rockets.splice(i, 1); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const f = Math.exp(-s.drag * dt);
      s.vx *= f; s.vy = s.vy * f + 70 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
    }
  }

  function drawFireworks(g) {
    if (fwDim > 0.01) {
      const vw = W / ZOOM, vh = H / ZOOM;
      g.fillStyle = `rgba(8,12,40,${fwDim})`;
      g.fillRect(cam.x - vw / 2 - 10, cam.y - vh / 2 - 10, vw + 20, vh + 20);
    }
    if (!rockets.length && !sparks.length && !flashes.length) return;
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const f of flashes) {
      const r = 160 * (1 - f.life / 0.35) + 40;
      g.globalAlpha = f.life / 0.35 * 0.8;
      g.drawImage(glowOf(f.col), f.x - r, f.y - r, r * 2, r * 2);
    }
    g.globalAlpha = 1;
    for (const r of rockets) {
      g.strokeStyle = 'rgba(255,220,150,.85)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(r.x, r.y); g.lineTo(r.x, r.y + 34); g.stroke();
      g.drawImage(glowOf('#ffd8a8'), r.x - 12, r.y - 12, 24, 24);
    }
    for (const s of sparks) {
      const a = Math.max(0, s.life / s.max);
      g.globalAlpha = Math.min(1, a * 1.7) * (a < 0.3 && Math.random() < 0.35 ? 0.25 : 1);
      const rad = 5 + a * 9;
      g.drawImage(glowOf(s.col), s.x - rad, s.y - rad, rad * 2, rad * 2);
    }
    g.restore();
  }

  AV.firework = (kind) => {
    const f = DATA.FIREWORKS.find((x) => x.id === kind);
    if (!f || map.id !== 'farm') return;
    if (rockets.length > 6 || (fwShow && fwShow.left > 8)) return UI.toast('Đợi pháo hoa đang bắn xong đã nhé 🎆');
    if (!AV.spend(f.price)) return;
    addXP(5);
    playFirework(kind, S.name);
    NET.sendFirework(kind, S.name);
    const msg = `🎆 ${S.name} vừa bắn ${f.name.toLowerCase()}!`;
    UI.chatLog('', msg, true, true);
    NET.sendSys(msg);
    if (nightFactor() < 0.3) setTimeout(() => UI.toast('💡 Pháo hoa đẹp nhất vào buổi tối (sau 19 giờ) đó!', 3500), 1200);
  };
  AV.onFirework = (kind, name) => { if (DATA.FIREWORKS.some((x) => x.id === kind)) playFirework(kind, name); };

  /* ---------- Vòng quay may mắn: nhiệm vụ → lượt quay (tối đa 2 lượt / ngày) ---------- */
  function wheelState() {
    const key = todayKey();
    if (!S.wheel || S.wheel.day !== key) S.wheel = { day: key, prog: {}, earned: [], used: 0 };
    return S.wheel;
  }
  AV.wheel = wheelState;
  AV.wheelSpins = () => { const w = wheelState(); return Math.max(0, w.earned.length - w.used); };

  function wheelProgress(id, n) {
    const task = DATA.WHEEL.tasks.find((x) => x.id === id);
    if (!task) return;
    const w = wheelState();
    if (w.earned.includes(id)) return;
    w.prog[id] = Math.min(task.n, (w.prog[id] || 0) + n);
    if (w.prog[id] >= task.n && w.earned.length < DATA.WHEEL.maxPerDay) {
      w.earned.push(id);
      setTimeout(() => UI.toast('🎡 Nhận được 1 lượt Vòng quay may mắn! Bấm nút 🎡 để quay', 4500), 900);
    }
    UI.updateWheelDot();
  }

  /** Quay: trả về vị trí ô trúng thưởng (phần thưởng cộng ngay) hoặc -1 nếu hết lượt */
  AV.spinWheel = () => {
    const w = wheelState();
    if (w.used >= w.earned.length) { UI.toast('Hết lượt quay — làm nhiệm vụ để nhận thêm (tối đa 2 lượt/ngày)'); return -1; }
    const P = DATA.WHEEL.prizes;
    let r = Math.random() * P.reduce((a, p) => a + p.w, 0);
    let idx = P.findIndex((p) => (r -= p.w) < 0);
    if (idx < 0) idx = 0;
    const p = P[idx];
    w.used++;
    if (p.coins) S.coins += p.coins;
    if (p.item) addItem(p.item, p.n);
    if (p.xp) addXP(p.xp);
    changed();
    UI.updateWheelDot();
    return idx;
  };

  /* ---------- Máy game: nhận điểm từ trò chơi, đổi ra xu ---------- */
  window.addEventListener('message', (e) => {
    const m = e.data || {};
    if (m.type === 'arcade-close') return UI.closeArcade();
    if (m.type === 'race3d-finish') {
      if (!UI.arcadeOpen()) return;
      const pos = Math.max(1, Math.min(6, m.pos | 0)), diff = Math.max(0, Math.min(2, m.diff | 0)), laps = [2, 3, 5].includes(m.laps) ? m.laps : 3;
      const coins = Math.round([100, 70, 50, 35, 25, 15][pos - 1] * [0.5, 1, 1.6][diff] * laps / 3);
      const xp = 10 + (6 - pos) * 4;
      S.coins += coins; addXP(xp);
      if (pos === 1) S.race3dWins = (S.race3dWins || 0) + 1;
      AV.quest('race');
      if (m.time > 0 && (!S.race3dBest || m.time < S.race3dBest)) S.race3dBest = +m.time;
      changed(); UI.updateHud();
      UI.toast(`🏁 Về thứ ${pos} · ${['Dễ', 'Vừa', 'Khó'][diff]} · ${laps} vòng → +${coins} xu, +${xp} XP`, 5000);
      if (pos === 1) NET.sendSys(`🏆 ${S.name} về nhất cuộc đua xe 3D (${['dễ', 'vừa', 'khó'][diff]}, ${laps} vòng)!`);
      return;
    }
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
  AV.enterHome = () => VISIT ? UI.toast((() => { const h = DATA.HOUSE_LEVELS[(VISIT.data.house || 1) - 1]; return `${h.icon} ${h.name} của ${VISIT.data.name} — chủ nhà đang khoá cửa, chỉ ngắm bên ngoài thôi nha`; })(), 4000) : AV.teleport('home', false, 800, 900, '🏠 Vào nhà…');
  AV.enterClass = () => AV.teleport('classroom', false, 800, 880, '🏫 Vào lớp học…');
  AV.leaveClass = () => AV.teleport('school', false, 420, 590, '🌳 Ra sân trường…');
  AV.enterCasino = () => AV.teleport('casino', false, 1000, 880, '🎰 Vào Nhà Casino…');
  AV.enterArena = () => AV.teleport('arena', false, 1000, 990, '⚔️ Vào Đấu Trường MMA…');
  /** Rạp CGV: vé 60 xu dùng cả ngày */
  AV.enterBoxing = () => AV.teleport('boxing', false, 1000, 1000, '🥊 Vào Võ Đài…');
  AV.enterCgv = () => {
    const today = new Date().toDateString();
    const go = () => AV.teleport('cgv', false, 1000, 1150, '🎬 Vào rạp CGV…');
    if (S.cgv === today) return go();
    UI.confirm('🎟️ Mua vé xem phim CGV <b>60 xu</b> (xem cả ngày hôm nay)?', 'Mua vé', () => { if (!AV.spend(60)) return; S.cgv = today; changed(); go(); });
  };
  AV.enterClub = () => AV.teleport('club', false, 1000, 1000, '🪩 Vào H-Club…');
  AV.leaveClub = () => AV.teleport('fun', false, 2820, 830, '🎡 Ra Khu giải trí…');
  AV.enterHorse = () => AV.teleport('horse', false, 1000, 1060, '🏇 Vào Trường Đua Ngựa…');
  AV.leaveHorse = () => AV.teleport('fun', false, 790, 800, '🎡 Ra Khu giải trí…');
  AV.leaveArena = () => AV.teleport('fun', false, 360, 805, '🎡 Ra Khu giải trí…');
  AV.leaveCasino = () => AV.teleport('fun', false, 2260, 815, '🎡 Ra Khu giải trí…');
  AV.leaveHome = () => AV.teleport('farm', false, 2650, 762, '🌾 Ra nông trại…');

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
  /* ---------- Tư thế trong nhà: nằm giường, ngâm bồn tắm, ngồi bàn ăn ---------- */
  let pose = null;
  const POSES = {
    bed: { x: 200, y: 822, dir: 1, sortY: 901, clipY: 792, front: (g, t) => ART.bedBlanket(g, 200, 900, t), back: [320, 860] },
    bath: { x: 1170, y: 702, dir: 1, sortY: 721, clipY: 672, front: (g, t) => ART.bathFront(g, 1170, 720, t), back: [1170, 770] },
    seatL: { x: 1110, y: 486, dir: 1, sortY: 490, clipY: 478, back: [1150, 565] },
    seatR: { x: 1250, y: 486, dir: -1, sortY: 490, clipY: 478, back: [1210, 565] },
  };
  function startPose(id, msg, custom) {
    if (!custom && map.id !== 'home') return;
    if (swingRide) AV.leaveSwing();
    pose = custom ? { id, ...custom } : { id, ...POSES[id] };
    if (!custom) {
      const g = (map.movables || []).find((q) => q.key === { bed: '200_900', bath: '1170_720', seatL: '1180_520', seatR: '1180_520' }[id]);
      if (g && (g.dx || g.dy)) {
        const f0 = pose.front;
        Object.assign(pose, { x: pose.x + g.dx, y: pose.y + g.dy, sortY: pose.sortY + g.dy, clipY: pose.clipY + g.dy, back: [pose.back[0] + g.dx, pose.back[1] + g.dy] });
        if (f0) pose.front = (gg, t) => { gg.save(); gg.translate(g.dx, g.dy); f0(gg, t); gg.restore(); };
      }
    }
    AV.setSeatPos(pose.x, pose.y, pose.dir);
    UI.toast(`${msg} — bấm vào màn hình để đứng dậy`, 3200);
  }
  AV.leavePose = () => {
    if (!pose) return;
    const [bx, by] = pose.back;
    pose = null;
    AV.leaveSeat(bx, by);
  };
  AV.posing = () => pose;
  /** Ngồi vào bàn học (người lọt sau bàn, ghế phía sau) */
  AV.sitDesk = (x, y) => startPose('desk', '📚 Đã ngồi vào bàn — gõ đáp án vào khung chat hoặc bấm nút A B C D', { x, y: y - 8, dir: 1, sortY: y - 2, clipY: y - 30, back: [x, y + 26] });
  /** Ngồi ghế chờ xe buýt */
  AV.sitBusBench = (L, R, y) => {
    const used = NET.players().filter((r) => Math.abs(r.ry - (y - 22)) < 8).map((r) => r.rx);
    let x = (L + R) / 2;
    for (const dx of [0, -40, 40, -70, 70]) { if (!used.some((u) => Math.abs(u - ((L + R) / 2 + dx)) < 30)) { x = (L + R) / 2 + dx; break; } }
    startPose('bench', '🪑 Ngồi đợi xe buýt — bấm 🗺️ hoặc cột biển trạm để chọn nơi đến', { x, y: y - 22, dir: 1, sortY: y - 21, clipY: y - 34, front: (g) => ART.benchFront(g, L + 14, R - 14, y), back: [x, y + 12] });
  };
  /** Ngồi một chỗ trống trên ghế dài (khán đài) */
  AV.sitSeat = (L, R, y, msg, frontFn) => {
    const used = NET.players().filter((r) => Math.abs(r.ry - (y - 22)) < 8).map((r) => r.rx);
    const slots = []; for (let x = L; x <= R; x += 42) slots.push(x);
    slots.sort((a, b) => Math.abs(a - player.x) - Math.abs(b - player.x));
    const x = slots.find((sx) => !used.some((u) => Math.abs(u - sx) < 30)) ?? slots[0];
    startPose('bench', msg, { x, y: y - 22, dir: 1, sortY: y - 21, clipY: y - 34, front: frontFn || ((g) => ART.benchFront(g, L - 14, R + 14, y)), back: [x, y + 14] });
  };
  AV.restFull = () => {
    if (Date.now() - (S.lastEnergySleep || 0) < 3 * 3600000) return false;
    S.lastEnergySleep = Date.now(); AV.addEnergy(100);
    if (S.phone) { S.phone.bat = 100; setTimeout(() => UI.toast('🔌 Điện thoại đã sạc đầy qua đêm', 3000), 3800); }
    setTimeout(() => UI.toast('⚡ Ngủ dậy khoẻ re — năng lượng đầy 100!', 3500), 600);
    return true;
  };
  AV.sleep = () => { AV.restFull(); startPose('bed', '🛏️ Đang nằm ngủ'); homeActivity('lastSleep', 120, 30, '😴 Ngủ một giấc thật ngon! +30 XP', '😴 Zzz…', 'Bạn chưa buồn ngủ'); };
  AV.bathe = () => { startPose('bath', '🛁 Đang ngâm mình trong bồn'); homeActivity('lastBath', 60, 15, '🛁 Tắm xong thơm tho quá! +15 XP', '🛁 La la la~', 'Vừa tắm xong mà'); };
  AV.sitTable = () => {
    const tg = (map.movables || []).find((q) => q.key === '1180_520');
    startPose(player.x > 1180 + (tg ? tg.dx : 0) ? 'seatR' : 'seatL', '🍽️ Ngồi vào bàn ăn');
    homeActivity('lastMeal', 30, 10, '🍽️ Bữa cơm ngon miệng! +10 XP', '😋 Ngon quá!', 'Vừa ăn xong, no rồi');
  };

  /* ---------- Quán ăn uống: tốn xu, được XP; ăn nhiều thì no, đợi tiêu bớt ---------- */
  function belly() {
    const b = S.belly || { v: 0, at: Date.now() };
    const dig = Math.floor((Date.now() - b.at) / (DATA.BELLY.digestMin * 60000));
    if (dig > 0) { b.v = Math.max(0, b.v - dig); b.at += dig * DATA.BELLY.digestMin * 60000; }
    if (!b.v) b.at = Date.now();
    S.belly = b;
    return b;
  }
  AV.belly = () => belly().v;
  AV.eat = (shopId, itemId) => {
    const shop = [...DATA.EATERIES, ...(DATA.STREET_FOOD || []), ...(DATA.CLUB_MENU || []), ...(DATA.CAMP_MENU || []), ...(DATA.CGV_MENU || []), ...(DATA.TEA_MENU || [])].find((e) => e.id === shopId), it = shop && shop.menu.find((x) => x.id === itemId);
    if (!it) return false;
    const b = belly();
    if (b.v >= DATA.BELLY.max) { UI.toast(`😵 No căng bụng rồi! Đợi khoảng ${DATA.BELLY.digestMin} phút cho tiêu bớt nhé`, 3500); say(player, '🥴 No quá…'); return false; }
    if (!AV.spend(it.price)) return false;
    b.v += it.price >= 15 ? 1 : 0.5;
    addXP(it.xp);
    const en = Math.max(10, Math.min(60, Math.round(it.price * 0.8) + 8));
    S.energy = Math.min(100, enOf() + en); UI.updateHud();
    float(`${it.icon} +${it.xp} XP · +${en} ⚡`, player.x, player.y - 120, '#a5d8ff');
    say(player, `${it.icon} ${['Ngon quá! 😋', 'Tuyệt cú mèo! 🤤', 'Đúng vị luôn! 👍', 'Sảng khoái ghê~ ✨'][Math.floor(Math.random() * 4)]}`);
    NET.sendSys(`${S.name} vừa thưởng thức ${it.icon} ${it.name} ở ${shop.name}`);
    changed();
    return true;
  };

  /* ---------- Điểm danh hằng ngày + đổi quà sự kiện ---------- */
  const dayKeyOf = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  AV.checkin = () => S.checkin || { last: '', streak: 0 };
  AV.checkedToday = () => AV.checkin().last === todayKey();
  /** Hôm nay là ngày thứ mấy trong chuỗi 7 ngày (0..6) */
  AV.checkinDay = () => {
    const c = AV.checkin();
    if (c.last === todayKey()) return (c.streak - 1) % DATA.CHECKIN.length;
    const y = new Date(); y.setDate(y.getDate() - 1);
    return c.last === dayKeyOf(y) ? c.streak % DATA.CHECKIN.length : 0;
  };
  AV.doCheckin = () => {
    if (AV.checkedToday()) return UI.toast('Hôm nay bạn điểm danh rồi, mai quay lại nhé 📅');
    const day = AV.checkinDay(), r = DATA.CHECKIN[day];
    S.checkin = { last: todayKey(), streak: day + 1 };
    const got = [];
    if (r.coins) { S.coins += r.coins; got.push(`${r.coins} xu`); }
    if (r.item) { addItem(r.item, r.n); got.push(`${r.n} ${DATA.ITEMS[r.item].icon}`); }
    if (r.ticket) { addItem('ticket', r.ticket); got.push(`${r.ticket} 🎟️`); }
    addXP(5);
    float('📅 Điểm danh!', player.x, player.y - 120, '#ffd43b');
    UI.toast(`📅 Điểm danh ngày ${day + 1}: nhận ${got.join(' + ')}`, 4000);
    changed();
    UI.updateDailyDot();
  };
  AV.exchange = (id) => {
    const x = DATA.EXCHANGE.find((e) => e.id === id);
    if (!x) return;
    if (x.kind === 'pet' && S.owned.pets.includes(x.pet)) return UI.toast('Bạn có thú cưng này rồi 🐾');
    if ((S.inv.ticket || 0) < x.cost) return UI.toast(`Cần ${x.cost} 🎟️ vé — điểm danh mỗi ngày để nhận thêm`);
    S.inv.ticket -= x.cost;
    if (x.kind === 'pet') { S.owned.pets.push(x.pet); AV.wearPet(x.pet); }
    else if (x.kind === 'coins') S.coins += x.n;
    else addItem(x.item, x.n);
    UI.toast(`🎁 Đã đổi ${x.icon} ${x.name}!`, 3500);
    changed();
  };
  /** Đổi tên nhân vật */
  AV.rename = (name) => {
    const n = String(name || '').replace(/\s+/g, ' ').trim();
    if (n.length < 2 || n.length > 16) { UI.toast('Tên dài 2–16 ký tự nhé'); return false; }
    if (n === S.name) return true;
    const old = S.name;
    S.name = n;
    changed();
    NET.sendSys(`✏️ ${old} đã đổi tên thành ${n}`);
    UI.toast(`✏️ Đã đổi tên thành ${n}`);
    return true;
  };

  /* ---------- Đồ nội thất ---------- */
  AV.hasFurn = (id) => (S.furniture || []).includes(id);
  AV.buyFurn = (id) => {
    const f = DATA.FURNITURE.find((x) => x.id === id);
    if (!f || AV.hasFurn(id)) return;
    if (!AV.spend(f.price)) return;
    S.furniture = [...(S.furniture || []), id];
    maps.home._nav = null;
    addXP(5);
    UI.toast(`${f.icon} Đã mua ${f.name}! Đã đặt ở ${f.room}`, 3500);
    changed();
  };
  AV.playPiano = () => {
    if (typeof MUSIC !== 'undefined' && MUSIC.melody) MUSIC.melody();
    homeActivity('lastPiano', 10, 5, '🎹 Chơi đàn hay quá! +5 XP', '🎵🎶', 'Nghỉ tay chút rồi chơi tiếp nhé');
  };
  AV.watchFish = () => homeActivity('lastAqua', 15, 4, '🐠 Ngắm cá thật thư giãn! +4 XP', '🐟 Cá xinh quá~', 'Cá đang ngủ trưa');
  AV.hugTeddy = () => homeActivity('lastHug', 20, 4, '🧸 Ôm gấu thật êm! +4 XP', '🧸💕', 'Gấu đang được giặt');
  AV.lookClock = () => { const d = new Date(); UI.toast(`🕰️ Bây giờ là ${d.getHours()} giờ ${String(d.getMinutes()).padStart(2, '0')} phút`); say(player, '⏰ Tích tắc~'); };
  AV.playConsole = () => UI.arcade(DATA.ARCADE[Math.floor(Math.random() * DATA.ARCADE.length)].id);
  /* ---------- 🛋️ Tự sắp xếp đồ trong nhà (kéo thả) ---------- */
  const EDIT = { on: false, sel: null, drag: null };
  const arrangeBtn = document.createElement('button');
  arrangeBtn.className = 'arrange-btn'; arrangeBtn.textContent = '🛋️ Sắp xếp đồ'; arrangeBtn.style.display = 'none';
  arrangeBtn.onclick = () => AV.editLayout(!EDIT.on);
  document.body.appendChild(arrangeBtn);
  const editBar = document.createElement('div');
  editBar.className = 'edit-bar';
  editBar.innerHTML = '<span>🛋️ Bấm giữ & kéo món đồ để dời chỗ</span><button data-r>↩ Về chỗ cũ</button><button data-all>🔄 Đặt lại tất cả</button><button data-ok>✅ Xong</button>';
  document.body.appendChild(editBar);
  AV.onLayoutMap = () => {
    if (map.movables) applyLayout(map);
    if (EDIT.on) AV.editLayout(false);
    arrangeBtn.style.display = map.movables && !VISIT ? 'block' : 'none';
  };
  setTimeout(() => { if (map) AV.onLayoutMap(); }, 0);
  function layoutOf(id) { S.layout = S.layout || {}; return (S.layout[id] = S.layout[id] || {}); }
  function applyLayout(m) {
    const L = (S.layout || {})[m.id] || {};
    m.movables.forEach((g) => { const o = L[g.key]; MAPS.moveGroup(g, o ? o[0] : 0, o ? o[1] : 0); });
    AV.resetNav(m.id);
  }
  const visibleGroups = () => (map.movables || []).filter((g) => !g.when || g.when());
  const gbb = (g) => [g.bb0[0] + g.dx, g.bb0[1] + g.dy, g.bb0[2] + g.dx, g.bb0[3] + g.dy];
  function pickGroup(w) {
    let best = null, area = Infinity;
    for (const g of visibleGroups()) {
      const b = gbb(g);
      if (w.x >= b[0] && w.x <= b[2] && w.y >= b[1] && w.y <= b[3]) { const a = (b[2] - b[0]) * (b[3] - b[1]); if (a < area) { area = a; best = g; } }
    }
    return best;
  }
  function saveGroup(g) {
    const L = layoutOf(map.id);
    if (g.dx || g.dy) L[g.key] = [g.dx, g.dy]; else delete L[g.key];
    AV.resetNav(map.id);
    if (blocked(player.x, player.y)) { player.x = map.spawn.x; player.y = map.spawn.y; player.path = []; }
    changed();
  }
  AV.editLayout = (on) => {
    if (on && (!map.movables || VISIT)) return;
    if (on && pose) AV.leavePose();
    EDIT.on = !!on; EDIT.sel = null; EDIT.drag = null;
    editBar.classList.toggle('show', EDIT.on);
    arrangeBtn.classList.toggle('on', EDIT.on);
    arrangeBtn.textContent = EDIT.on ? '✅ Xong sắp xếp' : '🛋️ Sắp xếp đồ';
    if (EDIT.on) { player.target = null; player.path = []; player.pending = null; UI.toast('🛋️ Chế độ sắp xếp: kéo món đồ để dời, bấm ✅ Xong khi xong', 3500); }
  };
  editBar.querySelector('[data-ok]').onclick = () => AV.editLayout(false);
  editBar.querySelector('[data-r]').onclick = () => { if (!EDIT.sel) return UI.toast('Chọn một món đồ trước'); MAPS.moveGroup(EDIT.sel, 0, 0); saveGroup(EDIT.sel); };
  editBar.querySelector('[data-all]').onclick = () => UI.confirm('Đưa tất cả đồ ở tầng này về chỗ ban đầu?', 'Đặt lại', () => { (map.movables || []).forEach((g) => MAPS.moveGroup(g, 0, 0)); S.layout[map.id] = {}; AV.resetNav(map.id); changed(); });
  /** kéo thả (trả về true nếu đã xử lý cú chạm) */
  function editDown(w) {
    const g = pickGroup(w);
    if (!g) return false;
    EDIT.sel = g; EDIT.drag = { sx: w.x, sy: w.y, dx0: g.dx, dy0: g.dy };
    return true;
  }
  function editMove(w) {
    const d = EDIT.drag, g = EDIT.sel;
    if (!d || !g) return;
    let dx = Math.round((d.dx0 + w.x - d.sx) / 10) * 10, dy = Math.round((d.dy0 + w.y - d.sy) / 10) * 10;
    const b = map.bounds, bx = (g.bb0[0] + g.bb0[2]) / 2, by = g.bb0[3];
    dx = Math.max(b.l + 10 - bx, Math.min(b.r - 10 - bx, dx));
    dy = Math.max(b.t + 20 - by, Math.min(b.b + 25 - by, dy));
    MAPS.moveGroup(g, dx, dy);
  }
  function editUp() { if (EDIT.drag && EDIT.sel) saveGroup(EDIT.sel); EDIT.drag = null; }
  function drawEdit(g2) {
    g2.save();
    for (const g of visibleGroups()) {
      const b = gbb(g), sel = g === EDIT.sel;
      g2.setLineDash(sel ? [] : [8, 6]); g2.lineWidth = sel ? 4 : 2;
      g2.strokeStyle = sel ? '#ffd43b' : 'rgba(255,255,255,.8)';
      g2.strokeRect(b[0], b[1], b[2] - b[0], b[3] - b[1]);
      if (sel) { g2.fillStyle = 'rgba(255,212,59,.15)'; g2.fillRect(b[0], b[1], b[2] - b[0], b[3] - b[1]); }
    }
    g2.restore();
  }

  /* ---------- 🏠 Nâng cấp nhà nhiều tầng ---------- */
  AV.houseLv = () => Math.max(1, Math.min(DATA.HOUSE_LEVELS.length, S.house || 1));
  AV.upgradeHouse = () => {
    const next = DATA.HOUSE_LEVELS[AV.houseLv()];
    if (!next) { UI.toast('🏰 Nhà bạn đã là biệt thự cao cấp nhất rồi!'); return false; }
    if (!AV.spend(next.price)) return false;
    S.house = next.lv;
    changed();
    clearTimeout(AV._houseSync); AV._houseSync = setTimeout(() => { saveNow(); pushSafe(); }, 800); // lưu lên mạng ngay để bạn bè đang thăm thấy nhà mới
    UI.toast(`🏗️ Thợ xây xong rồi! Nhà bạn giờ là ${next.icon} ${next.name}`, 5000);
    float(`${next.icon} ${next.name}!`, player.x, player.y - 120, '#ffd43b');
    NET.sendSys(`🏗️ ${S.name} vừa nâng cấp nhà lên ${next.icon} ${next.name}!`);
    return true;
  };
  /** lên / xuống tầng (via: 'stairs' | 'lift') */
  AV.goFloor = (n, via) => {
    if (n < 1 || n > AV.houseLv()) return;
    const id = n === 1 ? 'home' : 'home' + n;
    const lift = via === 'lift';
    AV.teleport(id, false, lift ? 1730 : 1700, lift ? 935 : 640, lift ? `🛗 Ting! Tầng ${n}` : `🪜 ${n > AV.floor() ? 'Lên' : 'Xuống'} tầng ${n}…`);
  };
  AV.floor = () => (map.id === 'home' ? 1 : /^home\d+$/.test(map.id) ? +map.id.slice(4) : 0);
  AV.useStairs = () => {
    const f = AV.floor(), top = AV.houseLv();
    if (top < 2) return UI.houseUpgrade();
    if (f === 1) return AV.goFloor(2, 'stairs');
    if (f === top) return AV.goFloor(f - 1, 'stairs');
    UI.stairsPick(f, top);
  };
  AV.homeAct = homeActivity;
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

  /* ---------- 🆕 Tự cập nhật bản mới: không cần F5 ----------
   * Định kỳ hỏi máy chủ "dấu vân tay" (ETag) của trang + các file js/css. Khi thấy đổi và đã ổn định ~1,5 phút
   * (tránh lúc đang upload dở từng file) thì báo nhẹ; lần chuyển khu tiếp theo tự lưu (cả lên mạng) rồi tải lại. */
  const UPD = { sig: null, cand: null, pending: false, applying: false };
  async function siteSig() {
    if (!/^https?:$/.test(location.protocol)) return null;
    const urls = new Set([location.origin + location.pathname]);
    document.querySelectorAll('script[src], link[rel="stylesheet"][href]').forEach((e) => { const u = e.src || e.href; if (u && u.startsWith(location.origin)) urls.add(u.split('?')[0]); });
    const tags = await Promise.all([...urls].map((u) => fetch(u, { method: 'HEAD', cache: 'no-store' }).then((r) => (r.ok ? r.headers.get('etag') || r.headers.get('last-modified') || '?' : '?')).catch(() => null)));
    return tags.some((t) => t === null) ? null : tags.join('|');
  }
  async function checkUpdate() {
    if (UPD.pending || document.hidden) return;
    const sg = await siteSig();
    if (!sg) return;
    if (UPD.sig === null) { UPD.sig = sg; return; }
    if (sg === UPD.sig) { UPD.cand = null; return; }
    if (sg !== UPD.cand) { UPD.cand = sg; setTimeout(checkUpdate, 90000); return; }   // vừa đổi: đợi xem còn đang upload tiếp không
    UPD.pending = true;
    const bar = document.createElement('div');
    bar.className = 'update-bar';
    bar.innerHTML = '🆕 Có bản cập nhật mới — sẽ tự cập nhật khi bạn chuyển khu <button>Cập nhật ngay</button>';
    bar.querySelector('button').onclick = () => applyUpdate();
    document.body.appendChild(bar);
  }
  async function applyUpdate() {
    if (UPD.applying) return;
    UPD.applying = true;
    const cover = document.createElement('div');
    cover.className = 'update-cover';
    cover.textContent = '🆕 Đang cập nhật phiên bản mới…';
    document.body.appendChild(cover);
    changed(); saveNow();
    if (CLOUD.user && cloudReady) { try { await Promise.race([pushSafe(), new Promise((r) => setTimeout(r, 5000))]); } catch (e) { /* vẫn tải lại */ } }
    location.reload();
  }
  AV.checkUpdate = checkUpdate;
  setTimeout(checkUpdate, 20000);
  setInterval(checkUpdate, 120000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(checkUpdate, 1500); });

  function updateFade(dt) {
    if (fade.mode === 'out') {
      fade.a = Math.min(1, fade.a + dt * 2.5);
      if (fade.a >= 1 && fade.teleport) {
        const id = fade.teleport;
        fade.teleport = null;
        const pos = fade.pos || (maps[id].busStop ? [maps[id].busStop.x + 50, maps[id].busStop.y + 12] : [maps[id].spawn.x, maps[id].spawn.y]);
        enterMap(id, pos[0], pos[1]);
        player.hidden = false;
        if (UPD.pending && !UPD.applying) { applyUpdate(); return; }
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

  /** gửi ảnh vào chat khu vực (link ảnh đã tải lên) */
  AV.sayImage = (u) => {
    if (player.hidden) return;
    say(player, '📷 Đã gửi 1 ảnh');
    NET.sendChat('[img]' + u);
    UI.chatLog(S.name, '[img]' + u, true);
    const box = document.getElementById('chatLog');
    if (box) { box.classList.add('active'); clearTimeout(AV._imgT); AV._imgT = setTimeout(() => { if (document.activeElement !== document.getElementById('chatInput')) box.classList.remove('active'); }, 6000); }
  };
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
    if (e.kind === 'npc' && e.helper) { say(e, VISIT ? 'Chào bạn~' : 'Nông trại để cô lo nhé! 🌱'); if (!VISIT) UI.helperPanel(); return; }
    if (e.kind === 'npc' && e.merchant) { say(e, 'Hàng hiếm giá rẻ đây! 🛒'); EVENTS.merchantPanel(); return; }
    if (e.kind === 'npc' && e.pirate) { say(e, 'Arrr! Săn rương không, cháu? 🏴‍☠️'); TREASURE.panel(); return; }
    if (e.kind === 'npc') {
      e.dir = player.x < e.x ? -1 : 1;
      e.wait = Math.max(e.wait, 3);
      e.moving = false;
      if (AV.hw() && trickOrTreat(e)) return;
      if (e.hw && !AV.hw()) return;
      say(e, [`Chào ${S.name}!`, 'Hôm nay bạn khoẻ không?', 'Ghé Chợ chơi nha!', 'Đồ bạn mặc xinh quá!'][Math.floor(Math.random() * 4)]);
      AV.npcTalk(e);
    } else {
      say(e, SOUNDS[e.kind]);
      float('❤️', e.x, e.y - 50);
      e.wait = 1.5;
      e.moving = false;
    }
  }

  /* ---------- ❤️ Thân thiết với NPC (kiểu Stardew): nói chuyện + tặng quà mỗi ngày ---------- */
  const love = (name) => { S.npcLove = S.npcLove || {}; return (S.npcLove[name] = S.npcLove[name] || { pts: 0, got: [] }); };
  AV.npcLove = love;
  AV.todayKeyPublic = () => todayKey();
  AV.npcHearts = (name) => Math.min(10, Math.floor(love(name).pts / 100));
  function npcAdd(name, pts) {
    const L = love(name), before = AV.npcHearts(name);
    L.pts = Math.max(0, Math.min(1000, L.pts + pts));
    const after = AV.npcHearts(name);
    for (const h of [2, 5, 10]) {
      if (after >= h && !L.got.includes(h)) {
        L.got.push(h);
        const rw = DATA.NPC_REWARDS[h];
        S.coins += rw.coins; if (rw.item) addItem(rw.item, rw.n);
        UI.toast(`💝 ${name} quý bạn ${h} tim! Tặng bạn ${rw.coins.toLocaleString('vi-VN')} xu${rw.item ? ' + ' + rw.n + ' ' + DATA.ITEMS[rw.item].icon : ''}`, 6000);
      }
    }
    if (after > before) float(`❤️ ${after}/10`, player.x, player.y - 130, '#ff8fab');
    changed();
  }
  AV.npcTalk = (e) => {
    if (!e.name) return;
    const L = love(e.name), day = todayKey();
    if (L.talk !== day) { L.talk = day; npcAdd(e.name, 10); }
    UI.npcPanel(e);
  };
  AV.npcGift = (e, id) => {
    const L = love(e.name), day = todayKey();
    if (L.gift === day) return UI.toast(`Hôm nay đã tặng ${e.name} rồi, mai quay lại nhé`);
    if ((S.inv[id] || 0) < 1) return;
    const P = DATA.NPC_LIKES[e.name] || DATA.NPC_LIKES.default;
    const kind = P.love.includes(id) ? 'love' : P.like.includes(id) ? 'like' : P.hate.includes(id) ? 'hate' : 'ok';
    S.inv[id]--; L.gift = day; AV.quest('gift');
    const pts = { love: 80, like: 45, ok: 20, hate: -30 }[kind];
    say(e, { love: 'Ôi! Mình thích món này nhất luôn! 😍', like: 'Cảm ơn nha, mình thích lắm 😊', ok: 'Cảm ơn bạn nhé!', hate: 'Ờm… mình không thích cái này lắm 😕' }[kind]);
    npcAdd(e.name, pts);
  };

  /* ---------- 📦 Thùng giao hàng: bỏ đồ vào, sáng hôm sau nhận xu (+10%) ---------- */
  AV.shipPut = (ids) => {
    S.ship = S.ship && S.ship.day === todayKey() ? S.ship : (AV.shipPayout(), { day: todayKey(), items: {} });
    let n = 0;
    ids.forEach((id) => { const k = S.inv[id] || 0; if (k > 0 && DATA.ITEMS[id] && DATA.ITEMS[id].sell > 0) { S.ship.items[id] = (S.ship.items[id] || 0) + k; S.inv[id] = 0; n += k; } });
    if (n) { UI.toast(`📦 Đã bỏ ${n} món vào thùng — sáng mai nhận xu (+10%)`, 3500); changed(); }
    return n;
  };
  AV.shipValue = (sh) => Math.round(Object.entries((sh || S.ship || {}).items || {}).reduce((a, [id, n]) => a + (DATA.ITEMS[id] ? DATA.ITEMS[id].sell * n : 0), 0) * 1.1);
  AV.shipPayout = () => {
    const sh = S.ship;
    if (!sh || sh.day === todayKey() || !Object.keys(sh.items || {}).length) return;
    const v = AV.shipValue(sh);
    S.ship = null; S.coins += v; changed(); UI.updateHud();
    setTimeout(() => UI.toast(`📦 Thùng giao hàng: thương lái đã thu mua đồ hôm trước · +${v.toLocaleString('vi-VN')} xu`, 6000), 1500);
  };
  setInterval(() => { if (!CLOUD.user || cloudReady) AV.shipPayout(); }, 60000);
  setTimeout(() => AV.shipPayout(), 9000);

  /* ---------- 🏥 Bệnh viện Zeno ---------- */
  AV.hospital = (what) => {
    const P = DATA.HOSPITAL, sick = AV.isSick();
    if (what === 'exam') {
      if (!AV.spend(P.exam)) return;
      if (S.sick) S.sick.examined = true;
      changed();
      return UI.toast(sick ? `🩺 Bác sĩ: "Cháu bị sốt do ${S.sick.why}. Sang phòng tiêm tiêm 1 mũi cho khỏi ngay, hoặc ra nhà thuốc mua thuốc uống (khỏi sau ${P.pillMin} phút)."` : '🩺 Bác sĩ: "Cháu khoẻ mạnh! Nhớ ăn uống đầy đủ, đừng làm việc quá sức nhé."', 7000);
    }
    if (what === 'shot' || what === 'pill') {
      if (!sick) return UI.toast('Bạn đang khoẻ mạnh, không cần ' + (what === 'shot' ? 'tiêm' : 'uống thuốc') + ' 😊');
      if (!S.sick.examined) return UI.toast('🩺 Phải vào phòng bác sĩ khám trước để được kê đơn nhé', 4000);
      if (!AV.spend(what === 'shot' ? P.shot : P.pill)) return;
      if (what === 'shot') { S.sick = null; S.lowSince = 0; S.energy = Math.min(100, enOf() + 30); say(player, '💉 Á đau… nhưng khỏi rồi!'); UI.toast('💉 Tiêm xong — hết sốt ngay! +30 ⚡', 4500); }
      else { S.sick.cureAt = Date.now() + P.pillMin * 60000; say(player, '💊 Ực…'); UI.toast(`💊 Đã uống thuốc — khỏi sốt sau ${P.pillMin} phút`, 4500); }
      changed(); UI.updateHud();
      return;
    }
    if (what === 'iv') {
      if (!AV.spend(P.iv)) return;
      S.energy = AV.isSick() ? 30 : 100; changed(); UI.updateHud();
      UI.toast(AV.isSick() ? '💧 Truyền nước xong (+⚡) — nhưng vẫn đang sốt, nhớ tiêm hoặc uống thuốc!' : '💧 Truyền nước xong — năng lượng đầy 100!', 5000);
    }
  };

  /* ---------- 🧑‍🌾 Thuê giúp việc: tự thu hoạch, tưới, xịt sâu, bón phân, gieo hạt bằng đồ trong túi ---------- */
  AV.helperActive = () => !!(S.helper && S.helper.until > Date.now());
  AV.hireHelper = (plan) => {
    if (!AV.spend(plan.price)) return false;
    const base = Math.max(Date.now(), (S.helper && S.helper.until) || 0);
    S.helper = { ...(S.helper || {}), until: base + plan.days * 86400000 };
    changed();
    UI.toast(`🧑‍🌾 Đã thuê giúp việc ${plan.label}! Cô sẽ chăm nông trại bằng hạt giống, phân bón, thuốc trong túi của bạn`, 5000);
    setTimeout(helperTick, 1500);
    return true;
  };
  let helperSaid = 0;
  function helperTick() {
    if (!AV.helperActive()) return;
    now = Date.now();
    if (VISIT) return;
    const r = { harvest: 0, water: 0, spray: 0, fert: 0, plant: 0, feed: 0, animal: 0, tree: 0 }, got = {};
    const add = (id, n) => { got[id] = (got[id] || 0) + n; };
    /* chuồng trại: thu trứng / sữa / len / thịt rồi cho ăn lại bằng lúa mì trong túi */
    let noWheat = false;
    const barn = (st, cfg, collect) => {
      if (!st) return;
      if (st.fedAt && now - st.fedAt >= cfg.time * 1000) { collect(st.took || {}); st.took = null; st.fedAt = 0; r.animal++; }
      if (!st.fedAt) { if ((S.inv.wheat || 0) >= cfg.feed) { S.inv.wheat -= cfg.feed; st.fedAt = now; r.feed++; } else noWheat = true; }
    };
    S.coop = S.coop || { fedAt: 0 };
    barn(S.coop, DATA.COOP, (took) => add('egg', Math.max(1, DATA.COOP.eggs - (took.egg || 0))));
    S.pen = normPen(S.pen);
    Object.keys(DATA.PENS).forEach((k) => barn(S.pen[k], DATA.PENS[k], (took) => Object.entries(DATA.PENS[k].out).forEach(([id, n]) => add(id, Math.max(1, n - (took[id] || 0))))));
    if (noWheat && Date.now() - (S.helper.noWheatAt || 0) > 1800000) { S.helper.noWheatAt = Date.now(); UI.toast('🧑‍🌾 Cô giúp việc: hết lúa mì 🌾 để cho gà, bò, cừu, heo ăn rồi — trồng thêm lúa mì nhé!', 5000); }
    /* vườn cây ăn quả: hái quả chín */
    (S.trees || []).forEach((tr, i) => {
      const st = treeState(i);
      if (!st.ripe) return;
      add(DATA.ORCHARD[i], Math.max(1, st.f.yield - (tr.stolen || 0)));
      tr.at = now; tr.stolen = 0; r.tree++;
    });
    for (let b = 0; b < DATA.BED_COUNT; b++) {
      if (!S.beds[b]) continue;
      const tiles = S.tiles.slice(b * TPB, b * TPB + TPB);
      // thu hoạch
      tiles.forEach((t) => {
        if (!t.crop || tileState(t).stage !== 2) return;
        got[t.crop] = (got[t.crop] || 0) + Math.max(1, tileYield(t) - (t.stolen || 0));
        t.crop = null; t.plantedAt = 0; t.watered = false; t.fert = false; t.stolen = 0; t.sprayed = false; t.pestAt = 0;
        r.harvest++;
      });
      // diệt sâu (1 chai / luống)
      if (tiles.some((t) => t.crop && tileState(t).pest) && (S.inv.pesticide || 0) > 0) {
        S.inv.pesticide--;
        tiles.forEach((t) => { const st = tileState(t); if (!t.crop || st.stage === 2) return; if (st.pest) { const total = DATA.CROPS[t.crop].time * 1000; t.plantedAt += now - (t.plantedAt + t.pestAt * total); r.spray++; } t.sprayed = true; });
      }
      // tưới + bón phân
      tiles.forEach((t) => {
        if (!t.crop) return;
        const st = tileState(t), total = DATA.CROPS[t.crop].time * 1000;
        if (st.stage < 0 || st.stage === 2) return;
        if (!t.watered) { if (st.thirsty) t.plantedAt += now - (t.plantedAt + DATA.THIRSTY_AT * total); t.plantedAt -= DATA.WATER_CUT * total; t.watered = true; r.water++; }
        if (!t.fert && (S.inv.fertilizer || 0) > 0) { S.inv.fertilizer--; t.plantedAt -= DATA.FERT.cut * total; t.fert = true; r.fert++; }
      });
      // gieo hạt vào ô trống (hạt đúng mùa, nhiều nhất trong túi)
      for (let k = b * TPB; k < b * TPB + TPB; k++) {
        if (S.tiles[k].crop) continue;
        const seeds = Object.keys(DATA.CROPS).filter((c) => (S.inv['seed_' + c] || 0) > 0 && AV.cropAllowed(k, c) && (typeof SEASON === 'undefined' || SEASON.inSeason(c)));
        if (!seeds.length) break;
        seeds.sort((a, b2) => (S.inv['seed_' + b2] || 0) - (S.inv['seed_' + a] || 0));
        const c = seeds[0];
        S.inv['seed_' + c]--;
        const pestAt = Math.random() < DATA.PEST.chance ? Math.round((0.15 + Math.random() * 0.55) * 1000) / 1000 : 0;
        S.tiles[k] = { crop: c, plantedAt: now, watered: false, pestAt: pestAt === DATA.THIRSTY_AT ? pestAt + 0.01 : pestAt };
        r.plant++;
      }
    }
    Object.entries(got).forEach(([c, n]) => addItem(c, n));
    const any = Object.values(r).some((v) => v);
    if (!any) return;
    changed();
    S.helper.stats = S.helper.stats || { harvest: 0, water: 0, spray: 0, fert: 0, plant: 0 };
    Object.keys(r).forEach((k) => { S.helper.stats[k] = (S.helper.stats[k] || 0) + r[k]; });
    if (Date.now() - helperSaid > 180000) {
      helperSaid = Date.now();
      const parts = [r.animal && `thu hoạch ${r.animal} chuồng`, r.feed && `cho ăn ${r.feed} chuồng`, r.tree && `hái ${r.tree} cây`, r.harvest && `thu ${r.harvest} ô`, r.water && `tưới ${r.water}`, r.spray && `diệt sâu ${r.spray}`, r.fert && `bón phân ${r.fert}`, r.plant && `gieo ${r.plant}`].filter(Boolean);
      UI.toast(`🧑‍🌾 Cô giúp việc: ${parts.join(' · ')}`, 4000);
    }
  }
  AV.helperTick = helperTick;
  setInterval(helperTick, 20000);
  setTimeout(helperTick, 10000);

  /* ---------- Cập nhật ---------- */
  const keys = new Set();

  function updatePlayer(dt) {
    player.t += dt;
    if (player.hidden || player.seated) { player.moving = false; return; }
    if (player.stun && stunStep(dt)) return;
    let vx = 0, vy = 0;
    const kx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    const ky = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    if (!UI.isBlocking() && (kx || ky)) {
      const l = Math.hypot(kx, ky);
      const spd = SPEED * (AV.isSick && AV.isSick() ? 0.55 : 1) * (AV.mountMul ? AV.mountMul() : 1);
      vx = kx / l * spd; vy = ky / l * spd;
      player.target = null; player.pending = null; marker = null;
    } else if (player.target) {
      const dx = player.target.x - player.x, dy = player.target.y - player.y, d = Math.hypot(dx, dy);
      if (d < 4) {
        if (player.path && player.path.length) player.target = player.path.shift();
        else { player.target = null; marker = null; }
      }
      else {
        const sp = Math.min(SPEED * (AV.isSick && AV.isSick() ? 0.55 : 1) * (AV.mountMul ? AV.mountMul() : 1), d / dt);
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

  /** 🧑‍🌾 cô giúp việc: lần lượt đi tới ruộng / chuồng / cây, làm việc vài giây rồi đi chỗ khác */
  const HELP_SAY = { bed: ['💧 Tưới tưới…', '🌾 Thu hoạch nè!', '🐛 Bắt sâu~', '🧪 Bón phân', '🌱 Gieo hạt'], coop: ['🐔 Gà ơi ăn đi!', '🥚 Nhặt trứng~'], cow: ['🐄 Vắt sữa nào', '🌾 Cho bò ăn'], sheep: ['🐑 Cắt len~', '🌾 Cho cừu ăn'], pig: ['🐖 Đổ cám cho heo'], tree: ['🍊 Hái quả chín', '🍎 Quả to ghê!'] };
  function helperPatrol(e) {
    const spots = map.inter.filter((o) => o.ax && (o.group === 'coop' || o.group === 'cow' || o.group === 'sheep' || o.group === 'pig' || /^Ô ruộng|^Ô hoa|^Luống|^Cây (cam|táo|xoài|đào)/.test(o.name || '')));
    if (!spots.length) return false;
    let o = spots[Math.floor(Math.random() * spots.length)];
    if (e.lastSpot === o && spots.length > 1) o = spots[(spots.indexOf(o) + 1) % spots.length];
    e.lastSpot = o;
    const kind = o.group || (/^Cây/.test(o.name) ? 'tree' : 'bed');
    e.tx = o.ax + (Math.random() - 0.5) * 40; e.ty = o.ay - 6;
    e.onArrive = () => { const l = HELP_SAY[kind] || HELP_SAY.bed; say(e, l[Math.floor(Math.random() * l.length)]); };
    return true;
  }
  function wander(e, dt, speed, useCollision) {
    e.t += dt;
    if (e.wait > 0) { e.wait -= dt; e.moving = false; return; }
    const dx = e.tx - e.x, dy = e.ty - e.y, d = Math.hypot(dx, dy);
    if (d < 3 && e.helper) {
      const done = e.onArrive;
      if (done) { e.onArrive = null; done(); e.wait = 3 + Math.random() * 3; e.moving = false; return; }
      if (helperPatrol(e)) { e.wait = 0.3; e.moving = false; return; }
    }
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
      if (n.helper) { if (n.show && !n.show()) return; wander(n, dt, 110, false); return; }
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
    if (map.id === 'farm') { updateGuards(dt); updateFireworks(dt); }
    updateRain(dt);
    updateFall(dt);
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
    VOICE.tick(dt, player);
    BIL.tick(dt);
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
    // chừa thêm khoảng bằng ô chat ở đáy màn hình → cửa ra / đồ vật sát mép dưới không bị ô chat che
    const padB = 96 / ZOOM;
    const clampY = (v) => (vh >= map.h + padB ? (map.h + padB) / 2 : Math.max(vh / 2, Math.min(map.h + padB - vh / 2, v)));
    const bx = player.x;
    // khu có camTop (sân vận động): luôn cố nhìn thấy phần trên (màn LED), chỉ lùi xuống khi nhân vật sắp ra khỏi khung
    const by = map.camTop != null ? Math.max(map.camTop + vh / 2, player.y + 110 - vh / 2) : player.y - 150;
    cam.x = clampX(bx + camOff.x); cam.y = clampY(by + camOff.y);
    // không cho độ lệch vượt quá mép bản đồ (để kéo ngược lại có tác dụng ngay)
    camOff.x = cam.x - bx; camOff.y = cam.y - by;
    const away = Math.hypot(camOff.x, camOff.y) > 260;
    if (away !== recenterShown) { recenterShown = away; document.getElementById('recenterBtn').classList.toggle('show', away); }
  }
  let recenterShown = false;
  AV.recenter = () => { camOff.x = 0; camOff.y = 0; };
  AV.player = player;
  AV.startPose = startPose;
  /** Toạ độ thế giới → toạ độ màn hình (để đặt video lên màn LED) */
  AV.toScreen = (x, y) => ({ x: W / 2 + (x - cam.x) * ZOOM, y: H / 2 + (y - cam.y) * ZOOM });
  /** Tính lại đường đi khi vật cản thay đổi (vd mua vé VIP) */
  AV.resetNav = (id) => { if (maps[id]) maps[id]._nav = null; };
  AV.addItemPublic = (id, n) => addItem(id, n);
  /** Nhảy lên mây nhún */
  AV.bounce = () => { player.bounceUntil = Date.now() + 1800; say(player, ['Boing~ ☁️', 'Hú hú! 🤸', 'Bay lên nào!'][Math.floor(Math.random() * 3)]); };
  /** Ảnh vẽ sẵn vừa tải xong → vẽ lại nền bản đồ hiện tại */
  AV.refreshGround = () => { if (map && map.groundImgs) map.groundScale = 0; };

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
  const BOX_BIG = { l: -30, t: -56, w: 60, h: 62 };

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

  AV.nightFactor = nightFactor;

  function worldTransform(c, scale, offX, offY) {
    c.setTransform(scale, 0, 0, scale, offX, offY);
  }

  function draw() {
    updateCamera();
    const use3d = typeof R3D !== 'undefined' && R3D.active(map);
    const px = use3d ? 0 : pixelSize();
    let g, bw = 0, bh = 0;
    if (use3d) {
      g = ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      worldTransform(ctx, DPR * ZOOM, DPR * (W / 2 - cam.x * ZOOM), DPR * (H / 2 - cam.y * ZOOM));
    } else if (px) {
      bw = Math.ceil(W / px); bh = Math.ceil(H / px);
      if (wbuf.width !== bw || wbuf.height !== bh) { wbuf.width = bw; wbuf.height = bh; }
      g = wctx;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = map.indoor ? '#1b1410' : '#72c844';
      g.fillRect(0, 0, bw, bh);
      worldTransform(g, ZOOM / px, (W / 2 - cam.x * ZOOM) / px, (H / 2 - cam.y * ZOOM) / px);
    } else {
      g = ctx;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = map.indoor ? '#1b1410' : '#72c844';
      ctx.fillRect(0, 0, W, H);
      worldTransform(ctx, DPR * ZOOM, DPR * (W / 2 - cam.x * ZOOM), DPR * (H / 2 - cam.y * ZOOM));
    }
    g.imageSmoothingEnabled = true;
    ensureGround(map, px ? 1 : FX.scale);
    const VW = W / ZOOM, VH = H / ZOOM;
    const mg3 = use3d ? Math.max(VW, VH) * 0.55 : 0;
    const vl = cam.x - VW / 2 - 160 - mg3, vr = cam.x + VW / 2 + 160 + mg3, vt = cam.y - VH / 2 - 220 - mg3, vb = cam.y + VH / 2 + 220 + mg3;
    /** 3D: vẽ fn (toạ độ 2D quanh điểm x, y−h) đúng chỗ của điểm mặt đất (x, y) cao h trên màn hình */
    const at = (x, y, h, fn) => {
      if (!use3d) return fn();
      const p = R3D.toScreen(x, y, h, W, H);
      ctx.setTransform(DPR * ZOOM, 0, 0, DPR * ZOOM, DPR * p.x - DPR * ZOOM * x, DPR * p.y - DPR * ZOOM * (y - h));
      fn();
    };
    const resetWT = () => worldTransform(ctx, DPR * ZOOM, DPR * (W / 2 - cam.x * ZOOM), DPR * (H / 2 - cam.y * ZOOM));
    const inView = (x, y) => x > vl && x < vr && y > vt && y < vb;
    if (!use3d) {
      const gs = map.groundScale, sx = Math.max(0, Math.floor(cam.x - VW / 2 - 4)), sy = Math.max(0, Math.floor(cam.y - VH / 2 - 4));
      const sw = Math.min(map.w - sx, Math.ceil(VW + 8)), sh = Math.min(map.h - sy, Math.ceil(VH + 8));
      if (sw > 0 && sh > 0) g.drawImage(map.ground, sx * gs, sy * gs, sw * gs, sh * gs, sx, sy, sw, sh);
    }
    const night = map.indoor ? 0 : nightFactor();
    if (!use3d) {
      if (!map.indoor) ART.backdrop(g, map.w, map.hz, cam.x, clock, map.id === 'beach');
      ART.nightSky(g, map.w, map.hz, night, clock);
    }

    if (marker && !use3d) {
      const sc = 1 + (marker.t % 0.8);
      g.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.9 - (marker.t % 0.8))})`;
      g.lineWidth = 2.5;
      g.beginPath(); g.ellipse(marker.x, marker.y, 10 * sc, 4 * sc, 0, 0, Math.PI * 2); g.stroke();
    }

    const out = (fn, x, y, box, key, ms = 55) => FX.drawCached(g, key, fn, x, y, box, ms);
    const list = map.objects.filter((o) => !o.bb || (o.bb[0] < vr && o.bb[2] > vl && o.bb[1] < vb && o.bb[3] > vt));
    const ABX = { chicken: FX.BOX.chicken, cow: FX.BOX.cow, sheep: FX.BOX.sheep, pig: FX.BOX.pig, dog: { l: -55, t: -80, w: 110, h: 86 } };
    const bbOf = (x, y, b) => [x + b.l - 4, y + b.t - 4, x + b.l + b.w + 4, y + b.t + b.h + 4];
    map.animals.forEach((a) => inView(a.x, a.y) && list.push({ y: a.y, key: a, ent: true, bb: bbOf(a.x, a.y, ABX[a.kind] || FX.BOX.pig), draw: () => {
      if (a.kind === 'chicken') out((c) => ART.chicken(c, a.x, a.y, a.dir, a.t, a.moving, a.peck), a.x, a.y, FX.BOX.chicken, a);
      else if (a.kind === 'cow') out((c) => ART.cow(c, a.x, a.y, a.dir, a.t, a.moving, a.seed), a.x, a.y, FX.BOX.cow, a);
      else if (a.kind === 'sheep') out((c) => ART.sheep(c, a.x, a.y, a.dir, a.t, a.moving), a.x, a.y, FX.BOX.sheep, a);
      else if (a.kind === 'dog') out((c) => { c.save(); c.translate(a.x, a.y); c.scale(1.5, 1.5); ART.pet(c, 0, 0, 'dog', a.dir, a.t, a.moving); c.restore(); }, a.x, a.y, { l: -55, t: -80, w: 110, h: 86 }, a);
      else out((c) => ART.pig(c, a.x, a.y, a.dir, a.t, a.moving, a.seed), a.x, a.y, FX.BOX.pig, a);
    } }));
    if (map.id === 'farm') guards.forEach((gd) => {
      if (!gd.id || !inView(gd.x, gd.y)) return;
      const ang = gd.angry > now;
      const hy = gd.y - (gd.hop || 0);
      list.push({ y: gd.y, key: gd, ent: true, bb: [gd.x - 120, hy - 110, gd.x + 120, gd.y + 18], draw: () => {
        if (gd.hop > 10) { g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(gd.x, gd.y, 58 - gd.hop * 0.2, 11, 0, 0, Math.PI * 2); g.fill(); }
        out((c) => ART.guard(c, gd.x, hy, gd.id, gd.dir, gd.t, gd.moving, ang), gd.x, hy, { l: -115, t: -105, w: 230, h: 111 }, gd, ang ? 30 : 55);
        if (gd.hurt) ART.iconBubble(g, '🤕', gd.x, hy - 95, clock);
      } });
    });
    (AV.worldFx || []).forEach((f) => list.push({ y: f.y, key: f, ent: true, bb: [f.x - 140, f.y - 130, f.x + 140, f.y + 20], draw: () => f.draw(g, clock) }));
    map.pickups.forEach((p) => { const bx = p.big ? BOX_BIG : BOX_PICK; inView(p.x, p.y) && list.push({ y: p.y, key: p, ent: true, bb: bbOf(p.x, p.y, bx), draw: () => out((c) => ART.pickup(c, p.x, p.y, p.item.icon, clock, p.big ? 40 : 22), p.x, p.y, bx, p, 120) }); });
    const petDraw = (p, kind) => list.push({ y: p.y, key: p, ent: true, bb: bbOf(p.x, p.y, FX.BOX.pet), draw: () => out((c) => ART.pet(c, p.x, p.y, kind, p.dir, p.t, p.moving), p.x, p.y, FX.BOX.pet, p) });
    // sprite pixel đã có viền sẵn → vẽ thẳng, không thêm viền mềm
    const drawChar = (x, y, look, o, key) => (PX.ready || ART.isPainted(look) ? ART.character(g, x, y, look, o) : out((c) => ART.character(c, x, y, look, o), x, y, FX.BOX.character, key));
    const charDraw = (x, y, look, o, key) => list.push({ y, key, ent: true, bb: [x - 75, y - 200, x + 75, y + 16], draw: () => {
      const boat = o && o.boat, swim = !boat && map.id === 'cherry' && CAMP.inPool(x, y);
      if (!boat && !swim) return drawChar(x, y, look, o, key);
      if (boat) CAMP.boat(g, x, y, clock);
      const sink = boat ? 18 : 30;
      g.save(); g.beginPath(); g.rect(x - 100, y - 400, 200, 400 - (boat ? 10 : 6)); g.clip();
      drawChar(x, y + sink, look, { ...o, moving: false }, key);
      g.restore();
      if (boat) CAMP.boatFront(g, x, y, clock);
      else { g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y - 6, 26 + Math.sin(clock * 4) * 3, 7, 0, 0, Math.PI * 2); g.stroke(); }
    } });
    map.npcs.forEach((n) => {
      if ((n.hw && !AV.hw()) || (n.show && !n.show()) || !inView(n.x, n.y)) return;
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
    if (pose && !player.hidden) {
      const p = pose;
      list.push({ y: p.sortY, draw: () => {
        g.save();
        g.beginPath(); g.rect(p.x - 120, p.y - 400, 240, p.clipY - (p.y - 400)); g.clip();
        if (PX.ready || ART.isPainted(S.look)) ART.character(g, p.x, p.y, S.look, { ...player, moving: false });
        else out((c) => ART.character(c, p.x, p.y, S.look, { ...player, moving: false }), p.x, p.y, FX.BOX.character, player);
        g.restore();
        if (p.front) p.front(g, clock);
      } });
    } else if (!player.hidden) {
      const shake = player.stun && attack && attack.phase === 'bite' ? Math.sin(clock * 60) * 3.5 : 0;
      const bnc = player.bounceUntil > now ? Math.abs(Math.sin((player.bounceUntil - now) / 1800 * Math.PI * 3)) * 70 : 0;
      charDraw(player.x + shake, player.y - bnc, S.look, { ...player, dance: player.dancing > now }, player);
      if (S.look.pet && S.look.pet !== 'none') petDraw(myPet, S.look.pet);
    }
    if (map.busStop && bus.state !== 'away' && bus.state !== 'travel') {
      const busY = map.busY || BUS_Y;
      list.push({ y: busY, key: bus, ent: true, bb: bbOf(bus.x, busY, BOX_BUS), draw: () => out((c) => ART.bus(c, bus.x, busY, clock, bus.state !== 'waiting'), bus.x, busY, BOX_BUS, bus, 70) });
    }
    if (map.id === 'farm' && (dusts.length || coinFx.length)) list.push({ y: 99999, draw: () => drawBiteFx(g) });
    list.sort((a, b) => a.y - b.y);
    if (use3d) {
      // bầu trời + đồi xa: 1 tấm hình động phía sau cùng
      if (!map.indoor) list.unshift({ y: 0, key: 'sky', bb: [Math.max(0, cam.x - VW / 2 - 80), -40, Math.min(map.w, cam.x + VW / 2 + 80), map.hz + 4], draw: (c) => { ART.backdrop(c, map.w, map.hz, cam.x, clock, map.id === 'beach'); ART.nightSky(c, map.w, map.hz, night, clock); } });
      R3D.render({ map, cx: cam.x, cy: cam.y, W, H, ZOOM, DPR, night, items: list.filter((o) => o.bb || o.bed),
        paint: (it, c) => { const og = g; g = c; try { it.draw(c, clock); } finally { g = og; } } });
      list.filter((o) => !o.bb && !o.bed).forEach((o) => at(player.x, player.y, 0, () => o.draw(g, clock)));
      R3D.bedOverlays(at, g, clock);
      if (marker) at(marker.x, marker.y, 0, () => { const sc = 1 + (marker.t % 0.8); g.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.9 - (marker.t % 0.8))})`; g.lineWidth = 2.5; g.beginPath(); g.ellipse(marker.x, marker.y, 10 * sc, 4 * sc, 0, 0, Math.PI * 2); g.stroke(); });
      resetWT();
    } else list.forEach((o) => o.draw(g, clock));
    if (EDIT.on && map.movables) drawEdit(g);
    if (!map.indoor && typeof SEASON !== 'undefined') { const VW2 = W / ZOOM, VH2 = H / ZOOM; g.fillStyle = SEASON.now().tint; g.fillRect(cam.x - VW2 / 2 - 10, cam.y - VH2 / 2 - 10, VW2 + 20, VH2 + 20); }
    if (AV.hw() && !map.indoor) {
      const vw = W / ZOOM, vh = H / ZOOM;
      if (map.hz > 0) ART.hwBunting(g, Math.max(0, cam.x - vw / 2 - 60), Math.min(map.w, cam.x + vw / 2 + 60), map.hz - 40, clock);
      ART.hwSky(g, cam.x, cam.y, vw, vh, clock, map.hz);
    }
    if (night > 0) {
      const vw = W / ZOOM, vh = H / ZOOM;
      g.fillStyle = `rgba(16,26,72,${(use3d ? 0.15 : 0.45) * night})`;
      g.fillRect(cam.x - vw / 2 - 10, cam.y - vh / 2 - 10, vw + 20, vh + 20); // phủ cả màn để nhà cửa không bị 2 màu ở đường chân trời
      ART.fireflies(g, cam.x, cam.y, vw, vh, night, clock);
      if (map.lights && !use3d) {
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

    drawRain(g);
    drawFall(g);
    if (map.id === 'farm') drawFireworks(g);
    if (px) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(wbuf, 0, 0, bw, bh, 0, 0, bw * px * DPR, bh * px * DPR);
      ctx.imageSmoothingEnabled = true;
    }

    // Lớp chữ & giao diện trong thế giới: vẽ ở độ phân giải đầy đủ cho sắc nét
    worldTransform(ctx, DPR * ZOOM, DPR * (W / 2 - cam.x * ZOOM), DPR * (H / 2 - cam.y * ZOOM));
    map.labels.forEach((l) => at(l.x, l.y, 0, () => ART.label(ctx, l.dynamic === 'home' ? `🏠 Nhà ${FD().name || 'của bạn'}${(FD().house || 1) > 1 ? ' · ' + (FD().house) + ' tầng' : ''}` : l.dynamic === 'gate' ? `Nông trại của ${FD().name || 'bạn'}` : l.text, l.x, l.y)));
    map.inter.forEach((o) => {
      if (!o.indicator || !inView(o.ix, o.iy) || (o.when && !o.when())) return;
      const r = o.indicator();
      if (r == null) return;
      if (typeof r === 'object') at(o.ix, o.iy, 0, () => ART.timerLabel(ctx, o.ix, o.iy, r.left, r.p));
      else at(o.ix, o.iy, 0, () => ART.iconBubble(ctx, r, o.ix, o.iy - 14, clock));
    });

    if (map.board) drawBoard(map.board);

    // mũi tên vàng "Vào" trước cửa
    map.inter.forEach((o) => { if (o.arrow && (!o.hw || AV.hw()) && (!o.when || o.when())) at(o.arrow.x, (o.ay || o.arrow.y), (o.ay || o.arrow.y) - o.arrow.y, () => ART.doorArrow(ctx, o.arrow.x, o.arrow.y, clock, o.arrow.text)); });

    // bảng tên gỗ trên đầu nhân vật
    // bảng tên nằm sát trên đỉnh đầu (cao hơn khi đội mũ); bong bóng chat nằm trên bảng tên
    const nameTop = (look) => (ART.isPainted(look) ? 116 : !look || look.hat === 'none' ? 118 : look.hat === 'nonla' ? 138 : 130);
    map.npcs.forEach((n) => { if ((!n.hw || AV.hw()) && (!n.show || n.show())) at(n.x, n.y, nameTop(n.look), () => ART.namePlate(ctx, n.name, n.x, n.y - nameTop(n.look), 'npc')); });
    others.forEach((r) => at(r.rx, r.ry, nameTop(r.look), () => ART.namePlate(ctx, r.name, r.rx, r.ry - nameTop(r.look), 'other')));
    if (!player.hidden && !(pose && pose.front)) at(player.x, player.y, nameTop(S.look), () => ART.namePlate(ctx, S.name || 'Bạn', player.x, player.y - nameTop(S.look), 'me'));
    if (!player.hidden && !(pose && pose.front)) at(player.x, player.y, nameTop(S.look) + 14, () => {
      const e = Math.max(0, Math.min(100, enOf())), x = player.x, y = player.y - nameTop(S.look) - 14, w = 46;
      ctx.fillStyle = 'rgba(27,47,72,.85)'; ctx.beginPath(); ctx.roundRect(x - w / 2 - 2, y - 4, w + 4, 8, 4); ctx.fill();
      ctx.fillStyle = e < 20 ? (Math.floor(clock * 3) % 2 ? '#ff6b6b' : '#c92a2a') : e < 50 ? '#fab005' : '#40c057';
      ctx.beginPath(); ctx.roundRect(x - w / 2, y - 2, w * e / 100, 4, 2); ctx.fill();
      ctx.font = '11px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
      ctx.fillText(AV.isSick() ? '🤒' : '⚡', x - w / 2 - 4, y);
      if (e < 20 && !AV.isSick()) { ctx.textAlign = 'left'; ctx.fillText('🍜', x + w / 2 + 4, y); }
    });
    // ai đang nói qua mic: hiện 🔊 cạnh bảng tên
    const speak = (x, y) => { ctx.font = '18px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(Math.floor(clock * 4) % 2 ? '🔊' : '🔉', x, y); };
    others.forEach((r) => { if (VOICE.talking(r.id)) at(r.rx, r.ry, nameTop(r.look), () => speak(r.rx + 44, r.ry - nameTop(r.look) + 9)); });
    if (!player.hidden && VOICE.meTalking()) at(player.x, player.y, nameTop(S.look), () => speak(player.x + 44, player.y - nameTop(S.look) + 9));

    const bubbleOf = (e) => {
      if (e.bubble && e.bubble.until > now) {
        const top = e.kind === 'npc' || e === player ? nameTop(e === player ? S.look : e.look) + 4 : 52;
        at(e.x, e.y, top, () => ART.bubble(ctx, e.bubble.text, e.x, e.y - top, e.bubble.big));
      }
    };
    map.animals.forEach(bubbleOf);
    if (map.id === 'farm') guards.forEach((gd) => { if (gd.bubble && gd.bubble.until > now) at(gd.x, gd.y, 78, () => ART.bubble(ctx, gd.bubble.text, gd.x, gd.y - 78, gd.bubble.big)); });
    map.npcs.forEach(bubbleOf);
    others.forEach((r) => {
      if (r.bubble && r.bubble.until > now) at(r.rx, r.ry, nameTop(r.look) + 4, () => ART.bubble(ctx, r.bubble.text, r.rx, r.ry - nameTop(r.look) - 4, r.bubble.big));
    });
    if (!player.hidden) bubbleOf(player);
    if (player.fishing && player.fishing.state === 'bite') at(player.x, player.y, nameTop(S.look) + 10, () => ART.biteMark(ctx, player.x, player.y - nameTop(S.look) - 10, clock));
    others.forEach((r) => { if (r.fish && r.fish.bite) at(r.rx, r.ry, nameTop(r.look) + 10, () => ART.biteMark(ctx, r.rx, r.ry - nameTop(r.look) - 10, clock)); });

    floats.forEach((f) => at(f.x, f.y + 100, 100, () => {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
      ctx.font = '800 17px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,30,40,.7)';
      ctx.strokeText(f.text, f.x, f.y - f.t * 40);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y - f.t * 40);
      ctx.globalAlpha = 1;
    }));

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
  /* ---------- Tiết kiệm pin: điện thoại tự bật — 30 hình/giây, độ nét vừa phải, chỉ vẽ phần đang thấy ---------- */
  const IS_PHONE = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || Math.min(screen.width, screen.height) < 820;
  const saver = () => { const g = (S.settings && S.settings.gfx) || 'auto'; return g === 'saver' || (g === 'auto' && IS_PHONE); };
  AV.saverOn = saver;
  AV.applyGfx = () => { resize(); FX.setSlow(saver() ? 1.8 : 1); };

  function resize() {
    DPR = Math.min(saver() ? 2 : 2.5, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    applyZoom();
  }

  function applyZoom() {
    const portrait = H > W * 1.15;
    const baseZoom = portrait ? Math.max(0.62, Math.min(1.15, H / 1000)) : Math.max(0.62, Math.min(1.15, Math.min(W / 1050, H / 720)));
    ZOOM = baseZoom * (typeof zoomMul === 'number' ? zoomMul : 1) * ((map && map.zoom) || 1);
    FX.setScale(Math.min(saver() ? 2 : 3, DPR * ZOOM));
  }

  function toWorld(cx, cy) {
    if (typeof R3D !== 'undefined' && R3D.on) { const p = R3D.pick(cx, cy); if (p) return p; }
    return { x: (cx - W / 2) / ZOOM + cam.x, y: (cy - H / 2) / ZOOM + cam.y };
  }

  function entityAt(x, y) {
    const remote = NET.players().find((r) => !r.hidden && Math.abs(x - r.rx) < 26 && y < r.ry + 6 && y > r.ry - 100);
    if (remote) return remote;
    return [...map.npcs.filter((n) => !n.show || n.show()), ...map.animals].find((e) => {
      const h = e.kind === 'npc' ? 100 : e.kind === 'chicken' ? 34 : 54;
      const w = e.kind === 'npc' ? 26 : e.kind === 'chicken' ? 18 : 34;
      return Math.abs(x - e.x) < w && y < e.y + 6 && y > e.y - h;
    });
  }

  function interAt(x, y) {
    const hits = map.inter.filter((o) => (!o.hw || AV.hw()) && (!o.when || o.when()) && x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h);
    hits.sort((a, b) => a.w * a.h - b.w * b.h);
    return hits[0] || null;
  }

  /* Chạm = đi tới; kéo 1 ngón / chuột = trượt bản đồ; chụm 2 ngón / lăn chuột = phóng to thu nhỏ */
  const drag = { active: false, moved: false, sx: 0, sy: 0, lx: 0, ly: 0, pointers: new Map(), pinch: 0, pinchZoom: 1 };
  const DRAG_PX = 10;
  function tap(e) {
    if (UI.isBlocking() || player.hidden || fade.mode) return;
    if (EDIT.on) return;
    if (player.fishing && player.fishing.state === 'bite') { AV.pullRod(); return; }
    if (TABLE.seated()) { TABLE.openView(); return; }
    if (BIL.seated()) { BIL.openView(); return; }
    clickWorld(toWorld(e.clientX, e.clientY));
  }
  canvas.addEventListener('pointerdown', (e) => {
    document.activeElement && document.activeElement.blur();
    if (UI.isBlocking() || fade.mode) return;
    // cá cắn câu: giật cần ngay khi chạm, không đợi nhấc tay
    if (player.fishing && player.fishing.state === 'bite') { AV.pullRod(); return; }
    try { canvas.setPointerCapture(e.pointerId); } catch (er) { /* bỏ qua */ }
    if (EDIT.on && drag.pointers.size === 0 && editDown(toWorld(e.clientX, e.clientY))) { EDIT.pid = e.pointerId; return; }
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
    if (EDIT.drag && e.pointerId === EDIT.pid) { editMove(toWorld(e.clientX, e.clientY)); return; }
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
    if (drag.moved && typeof R3D !== 'undefined' && R3D.on) {
      const a = R3D.pickGround(drag.lx, drag.ly), b = R3D.pickGround(e.clientX, e.clientY);
      if (a && b) { camOff.x -= b.x - a.x; camOff.y -= b.y - a.y; }
      canvas.style.cursor = 'grabbing';
    } else if (drag.moved) {
      camOff.x -= (e.clientX - drag.lx) / ZOOM;
      camOff.y -= (e.clientY - drag.ly) / ZOOM;
      canvas.style.cursor = 'grabbing';
    }
    drag.lx = e.clientX; drag.ly = e.clientY;
  });
  const endPointer = (e, cancel) => {
    if (EDIT.drag && e.pointerId === EDIT.pid) { editUp(); return; }
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
    if (pose) { AV.leavePose(); return; }
    const pk = map.pickups.find((p) => Math.abs(p.x - w.x) < (p.big ? 34 : 22) && w.y > p.y - (p.big ? 56 : 30) && w.y < p.y + 8);
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
      ? map.inter.find((o) => o.group === (ent.kind === 'chicken' ? 'coop' : ent.kind)) : null;
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
    requestAnimationFrame(loop);
    // tiết kiệm pin: tối đa ~30 hình/giây
    if (saver() && last && t - last < 30) return;
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    if (RIDE.active) { RIDE.frame(dt); return; }
    if (AV.mineActive) return;
    const P = AV.perf;
    if (P) { const t0 = performance.now(); update(dt); const t1 = performance.now(); draw(); const t2 = performance.now(); P.n++; P.upd += t1 - t0; P.drw += t2 - t1; P.max = Math.max(P.max, t2 - t0); return; }
    update(dt);
    draw();
  }
  /** Đo hiệu năng (chỉ bật khi kiểm tra): AV.perf = { n: 0, upd: 0, drw: 0, max: 0 } */
  AV.perf = null;
  AV.debugMap = () => map;

  AV.applyGfx();
  {
    const chip = document.createElement('div'); chip.className = 'season-chip'; document.body.appendChild(chip);
    const upd = () => { const sn = SEASON.now(); chip.textContent = `${sn.icon} Mùa ${sn.name} · ngày ${sn.day}/7`; chip.title = 'Mỗi mùa 7 ngày · cây chỉ gieo được trong mùa của nó'; };
    upd(); setInterval(upd, 60000);
    chip.onclick = () => { const sn = SEASON.now(); UI.toast(`${sn.icon} Mùa ${sn.name} (ngày ${sn.day}/7) · gieo được: ${Object.keys(DATA.CROPS).filter((c) => SEASON.inSeason(c)).map((c) => DATA.CROPS[c].icon).join(' ')}`, 6000); };
  }
  window.addEventListener('resize', resize);
  enterMap(maps[S.map] ? S.map : 'farm', S.x, S.y);
  UI.init();
  if (typeof TREASURE !== 'undefined') TREASURE.init();
  if (typeof EVENTS !== 'undefined') EVENTS.init();
  // 📱 iPhone: chặn chụm 2 ngón phóng to cả trang (bản đồ đã có zoom riêng)
  ['gesturestart', 'gesturechange'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
  if (typeof LOTTO !== 'undefined') LOTTO.init();
  if (typeof PHONE !== 'undefined') PHONE.init();
  if (typeof RANCH !== 'undefined') RANCH.init();
  MUSIC.init(S.settings || {});
  SOCIAL.init();
  VOICE.init();
  UI.updateMusicBtn();
  TABLE.init();
  BIL.init();
  UI.updateHud();
  NET.init(player);
  /* ---------- Tài khoản: đăng nhập rồi mới vào chơi ---------- */
  function startLocal() {
    if (!S.name) UI.characterEditor(true);
    else {
      UI.toast(`Chào mừng trở lại, ${S.name}! 🌾`);
      setTimeout(() => { if (!AV.checkedToday() && !UI.isBlocking()) UI.dailyPanel(); }, 2500);
    }
  }
  AV.playAsGuest = startLocal;

  /** Thay toàn bộ tiến trình bằng bản khác (vd: tải từ tài khoản) */
  function replaceState(data) {
    const m = mergeSave(JSON.parse(JSON.stringify(data)));
    Object.keys(S).forEach((k) => { delete S[k]; });
    Object.assign(S, m);
    if (!map || S.map !== map.id) enterMap(maps[S.map] ? S.map : 'farm', S.x, S.y);
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
    if (CLOUD.user) { await CLOUD.push(S); syncedAt = S.changedAt; }
    UI.toast(`✅ Đã khôi phục ${label || 'bản lưu'}`, 4000);
  };

  const summary = (d) => ({ name: d.name, level: d.level || 1, coins: d.coins || 0, beds: (d.beds || []).filter(Boolean).length, at: d.changedAt || 0 });

  AV.afterLogin = async () => {
    setTimeout(() => { receiveHelps(); receiveSteals(); }, 4000);
    isHouse = null;
    setTimeout(receiveHouse, 6000);
    cloudReady = false;
    const uid = CLOUD.user.id;
    let cloud = null;
    try { cloud = await CLOUD.pull(); } catch (e) { UI.toast('⚠️ ' + e.message, 6000); }
    const finish = () => {
      cloudReady = true; syncedAt = S.changedAt || 0; saveNow(); joinRoom(); MUSIC.refresh(S.settings || {});
      setTimeout(() => { if (S.name && !AV.checkedToday() && !UI.isBlocking()) UI.dailyPanel(); UI.updateDailyDot(); }, 2500);
      setTimeout(() => SOCIAL.pull(), 3500);
    };
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
      syncedAt = S.changedAt;
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
  const GIFTS = { 'XINLOI3500': { coins: 3500, msg: 'Quà xin lỗi vì lỗi mất đồ' }, 'QUANGLAM100K': { coins: 100000, msg: 'Voucher quà tặng 100K' }, 'QUANGLAM10TR': { coins: 10000000, msg: 'Voucher 10 triệu xu', expired: true } };
  /** Mã dùng chung cả server: chỉ 1 người nhận được (ai nhanh tay). Chỉ lưu bản băm của mã, không lộ mã trong code */
  const GLOBAL_GIFTS = { '83fb97087d6471ebf6ec252ad41511f9f28f5a624a69265ac539fcd4f8c81a37': { coins: 15000000, msg: 'Voucher 15 triệu xu' }, '74e5c0d7d6215472540a7def2a0f1b3124e0b6b8ba2bb93525b43662ac9ae08a': { coins: 100000000000, msg: 'Voucher 100 tỉ xu' }, 'd89c3f9dee512c45334ac863c71d16a2288edc347d238903e6df550f99fd8bce': { coins: 1000000000000, msg: 'Voucher 1000 tỉ xu', unlimited: true } };
  async function redeemGlobal(c) {
    let h = '';
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('QLGIFT|' + c));
      h = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { /* trình duyệt cũ */ }
    const g = GLOBAL_GIFTS[h];
    if (!g) return UI.toast('Mã quà không đúng 🤔');
    if (!CLOUD.user) return UI.toast('🔐 Đăng nhập tài khoản mới nhận được mã này');
    if (g.unlimited) { S.coins += g.coins; float(`+${g.coins.toLocaleString('vi-VN')} 💰`, player.x, player.y - 120, '#ffd43b'); UI.toast(`🎁 ${g.msg}: +${g.coins.toLocaleString('vi-VN')} xu!`, 5000); changed(); saveNow(); return; }
    try { await CLOUD.claimGift(h, S.name); } catch (e) { return UI.toast('⚠️ ' + e.message, 5000); }
    S.coins += g.coins;
    float(`+${g.coins.toLocaleString('vi-VN')} 💰`, player.x, player.y - 120, '#ffd43b');
    UI.toast(`🎉 Bạn là người NHANH NHẤT! ${g.msg}: +${g.coins.toLocaleString('vi-VN')} xu!`, 6000);
    NET.sendSys(`🎉 ${S.name} vừa giành được ${g.msg}!`);
    changed();
  }
  AV.redeem = (code) => {
    const c = String(code || '').trim().toUpperCase().replace(/\s+/g, '');
    const g = GIFTS[c];
    if (!g) return redeemGlobal(c);
    S.redeemed = S.redeemed || [];
    if (g.expired) return UI.toast('⛔ Mã này đã bị khoá / hết hạn');
    if (!g.unlimited && S.redeemed.includes(c)) return UI.toast('Bạn đã dùng mã này rồi');
    if (!S.redeemed.includes(c)) S.redeemed.push(c);
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

  setInterval(() => { if (CLOUD.user && cloudReady && CLOUD.dirty) pushSafe(); }, 10000);
  setInterval(() => { if (!document.hidden && !CLOUD.dirty) checkRemote(); }, 45000);
  window.addEventListener('focus', () => { if (!CLOUD.dirty) checkRemote(); });
  window.addEventListener('pagehide', () => { saveNow(); if (cloudReady) CLOUD.pushOnExit(S); });

  setInterval(saveNow, 5000);
  window.addEventListener('beforeunload', saveNow);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { saveNow(); if (CLOUD.user && cloudReady && CLOUD.dirty) pushSafe(); }
    else if (CLOUD.dirty) pushSafe(); else checkRemote();
  });

  AV._debug = { player, bus, maps, get map() { return map; }, enterMap, update, draw, goTo, findPath, clickWorld, camOff, cam, get zoom() { return ZOOM; }, guards, get attack() { return attack; }, refreshVisit, fw: () => ({ rockets: rockets.length, sparks: sparks.length }), get visit() { return VISIT; }, set visit(v) { VISIT = v; } };
  requestAnimationFrame(loop);
})();
