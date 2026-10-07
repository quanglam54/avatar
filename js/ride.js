/* Đường phố Hà Nội: đi taxi Xanh SM (tự chở) hoặc tự lái xe máy giữa các khu — thấy đường đi, nhà cửa, đèn xanh đỏ, quán ven đường */
const RIDE = (() => {
  /* ---------- Mạng đường (toạ độ nút gần giống bản đồ thật: x sang đông, y xuống nam) ---------- */
  const NODES = {
    cn: [0, -2.2], hqv: [0, 0], nd: [2.2, 0], md: [0, 1.6], cg: [1.5, 1.6], cge: [3.3, 1.7],
    ph: [0, 3.9], ldt: [-1.5, 1.6], svd: [-1.5, 3.6], bien: [-3.3, 1.6], tl: [-3.4, 3.7],
  };
  const EDGES = [
    { id: 'pvd1', name: 'Phạm Văn Đồng', a: 'cn', b: 'hqv', len: 2200, theme: 'city', dist: 'Q. Bắc Từ Liêm' },
    { id: 'hqv', name: 'Hoàng Quốc Việt', a: 'hqv', b: 'nd', len: 2000, theme: 'campus', dist: 'Q. Cầu Giấy' },
    { id: 'pvd2', name: 'Phạm Văn Đồng', a: 'hqv', b: 'md', len: 1600, theme: 'city', dist: 'Q. Bắc Từ Liêm' },
    { id: 'xt', name: 'Xuân Thủy', a: 'md', b: 'cg', len: 1500, theme: 'metro', dist: 'Q. Cầu Giấy' },
    { id: 'cg', name: 'Cầu Giấy', a: 'cg', b: 'cge', len: 1800, theme: 'metro', dist: 'Q. Cầu Giấy' },
    { id: 'ph', name: 'Phạm Hùng', a: 'md', b: 'ph', len: 2200, theme: 'tower', dist: 'Q. Nam Từ Liêm' },
    { id: 'htm', name: 'Hồ Tùng Mậu', a: 'md', b: 'ldt', len: 1500, theme: 'metro', dist: 'Q. Cầu Giấy' },
    { id: 'ldt', name: 'Lê Đức Thọ', a: 'ldt', b: 'svd', len: 1900, theme: 'stadium', dist: 'Q. Nam Từ Liêm' },
    { id: 'mdinh', name: 'Mỹ Đình', a: 'svd', b: 'ph', len: 1700, theme: 'stadium', dist: 'Q. Nam Từ Liêm' },
    { id: 'htm2', name: 'Hồ Tùng Mậu', a: 'ldt', b: 'bien', len: 1700, theme: 'city', dist: 'Q. Bắc Từ Liêm' },
    { id: 'tl', name: 'Đại lộ Thăng Long', a: 'svd', b: 'tl', len: 1900, theme: 'highway', dist: 'Q. Nam Từ Liêm' },
  ];
  const E = Object.fromEntries(EDGES.map((e) => [e.id, e]));
  /** Mỗi khu nằm ở đâu trên đường: [đường, mét tính từ đầu đường] */
  const SPOTS = { hospital: ['cg', 1500], cherry: ['pvd2', 900], farm: ['pvd1', 350], school: ['hqv', 1300], town: ['cg', 800], mall: ['ph', 1250], fun: ['mdinh', 850], park: ['ldt', 1000], beach: ['htm2', 1450], race: ['tl', 1500] };
  const PARENT = { clinic: 'hospital', apt_han: 'fun', apt_hph: 'farm', apt_vdo: 'cherry', apt_sgn: 'mall', apt_pqc: 'beach', apt_dad: 'park', home: 'farm', home2: 'farm', home3: 'farm', home4: 'farm', casino: 'fun', arena: 'fun', horse: 'fun', club: 'fun', concert: 'fun', cgv: 'fun', boxing: 'fun', wc: 'cherry', classroom: 'school' };
  const zoneOf = (mapId) => { const id = PARENT[mapId] || String(mapId || '').split('-')[0]; return SPOTS[id] ? id : null; };

  /** Tìm đường ngắn nhất giữa 2 khu → danh sách chặng (mỗi chặng là một đoạn trên 1 con đường) */
  function route(from, to) {
    const A = SPOTS[from], B = SPOTS[to];
    if (!A || !B || from === to) return null;
    const ea = E[A[0]], eb = E[B[0]];
    let legs;
    if (ea === eb) legs = [{ e: ea, from: A[1], to: B[1] }];
    else {
      const dist = {}, prev = {}, done = {};
      Object.keys(NODES).forEach((n) => { dist[n] = Infinity; });
      dist[ea.a] = A[1]; dist[ea.b] = ea.len - A[1];
      for (;;) {
        let u = null;
        for (const n in dist) if (!done[n] && dist[n] < Infinity && (u === null || dist[n] < dist[u])) u = n;
        if (u === null) break;
        done[u] = true;
        EDGES.forEach((e) => {
          if (e.a !== u && e.b !== u) return;
          const v = e.a === u ? e.b : e.a, nd = dist[u] + e.len;
          if (nd < dist[v]) { dist[v] = nd; prev[v] = { n: u, e }; }
        });
      }
      const end = dist[eb.a] + B[1] <= dist[eb.b] + eb.len - B[1] ? eb.a : eb.b;
      const chain = [];
      for (let n = end; prev[n]; n = prev[n].n) chain.unshift(prev[n]);
      const start = chain.length ? chain[0].n : end;
      legs = [{ e: ea, from: A[1], to: start === ea.a ? 0 : ea.len }];
      chain.forEach(({ n, e }) => legs.push({ e, from: n === e.a ? 0 : e.len, to: n === e.a ? e.len : 0 }));
      legs.push({ e: eb, from: end === eb.a ? 0 : eb.len, to: B[1] });
    }
    legs.forEach((l) => { l.dir = l.to >= l.from ? 1 : -1; l.len = Math.abs(l.to - l.from); });
    return legs;
  }
  const heading = (l) => { const a = NODES[l.e.a], b = NODES[l.e.b], s = l.dir; return [(b[0] - a[0]) * s, (b[1] - a[1]) * s]; };
  /** Chữ báo rẽ ở ngã tư cuối chặng i */
  function turnText(legs, i) {
    const n = legs[i + 1];
    if (!n) return '';
    const [x1, y1] = heading(legs[i]), [x2, y2] = heading(n);
    const cr = x1 * y2 - y1 * x2, len = Math.hypot(x1, y1) * Math.hypot(x2, y2);
    if (Math.abs(cr) < 0.3 * len) return `⬆️ Đi thẳng sang ${n.e.name}`;
    return cr > 0 ? `↱ Rẽ phải vào ${n.e.name}` : `↰ Rẽ trái vào ${n.e.name}`;
  }
  const routeLen = (legs) => legs.reduce((a, l) => a + l.len, 0);
  const km = (m) => (m / 1000).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' km';
  const fareOf = (m) => Math.min(80, 15 + Math.round(m / 150));
  /** Thông tin chuyến đi để hiện ở bảng chọn xe */
  function info(fromMap, to) {
    const from = zoneOf(fromMap), legs = from && route(from, to);
    if (!legs) return null;
    const m = routeLen(legs), names = [];
    legs.forEach((l) => { if (names[names.length - 1] !== l.e.name) names.push(l.e.name); });
    return { m, km: km(m), fare: fareOf(m), streets: names };
  }

  /* ---------- Tiện ích vẽ ---------- */
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
  function circ(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
  function fitText(c, text, x, y, maxW, size, weight = 900) {
    let s = size;
    c.font = `${weight} ${s}px system-ui, "Segoe UI", sans-serif`;
    while (s > 7 && c.measureText(text).width > maxW) { s -= 1; c.font = `${weight} ${s}px system-ui, "Segoe UI", sans-serif`; }
    c.fillText(text, x, y);
  }

  /* ---------- Bố cục cảnh (đơn vị thế giới) ---------- */
  const VIEW_H = 660, FAR = 330, ROAD_T = 368, ROAD_B = 580, NEAR = 588;
  const LANE_Y = [408, 456, 514, 566];
  const CROSS = 95;

  const SIGNS = [
    ['BÚN ĐẬU MẮM TÔM', '#2b8a3e', '#fff'], ['BÚN CHẢ HÀ NỘI', '#c92a2a', '#ffe066'], ['PHỞ BÒ GIA TRUYỀN', '#e03131', '#fff'], ['BÁNH MÌ PATE', '#f59f00', '#5c3010'],
    ['XÔI XÉO', '#fab005', '#5c3010'], ['NEM NƯỚNG', '#d9480f', '#fff'], ['CÀ PHÊ MUỐI', '#5c3d2e', '#ffe8cc'], ['TRÀ CHANH', '#82c91e', '#1b4d0f'],
    ['TẠP HÓA', '#1971c2', '#fff'], ['SỬA XE MÁY', '#495057', '#ffd43b'], ['NHÀ THUỐC', '#2f9e44', '#fff'], ['TIỆM VÀNG', '#c92a2a', '#ffd43b'],
    ['ĐIỆN THOẠI', '#1864ab', '#fff'], ['GỘI ĐẦU DƯỠNG SINH', '#e64980', '#fff'], ['BIA HƠI', '#f08c00', '#fff'], ['LẨU NƯỚNG', '#a61e4d', '#fff'],
    ['CƠM VĂN PHÒNG', '#e8590c', '#fff'], ['KARAOKE', '#7048e8', '#ffe066'], ['VĂN PHÒNG PHẨM', '#0c8599', '#fff'], ['THỜI TRANG', '#212529', '#fcc2d7'],
    ['BÚN BÒ HUẾ', '#5f3dc4', '#ffd43b'], ['CHÈ THÁI', '#f783ac', '#fff'], ['GÀ RÁN', '#e03131', '#fff'], ['PHOTO COPY', '#228be6', '#fff'],
  ];
  const WALLS = ['#ffe8cc', '#fff3bf', '#e7f5ff', '#f3d9fa', '#d3f9d8', '#ffdeeb', '#fff', '#ffec99', '#d0ebff', '#e9ecef', '#ffd8a8', '#c5f6fa'];
  const sceneCache = new Map();

  /** Cảnh 2 bên đường của 1 con đường theo 1 chiều đi (toạ độ = mét trên đường) — ai đi cùng chiều thấy giống nhau */
  function scene(e, dir) {
    const key = e.id + dir;
    if (sceneCache.has(key)) return sceneCache.get(key);
    const r = rng(hash(key));
    const clear = [0, e.len], gates = [];
    Object.entries(SPOTS).forEach(([z, s]) => { if (s[0] === e.id) { clear.push(s[1]); gates.push({ z, ex: s[1] }); } });
    const near = (x, d) => clear.some((p) => Math.abs(x - p) < d);
    const far = [], side = [], front = [];
    for (let x = -700; x < e.len + 700;) {
      const theme = e.theme;
      let w = 76 + Math.floor(r() * 64);
      if (theme === 'tower' && r() < 0.45) w = 150 + Math.floor(r() * 60);
      if (near(x + w / 2, 150 + w / 2)) { x += 30; continue; }
      const b = { ex: x + w / 2, w };
      if (theme === 'highway' && r() < 0.55) { b.kind = r() < 0.3 ? 'billboard' : 'field'; b.h = 60; }
      else if (theme === 'campus' && r() < 0.22) { b.kind = 'campus'; b.w = w = 210; b.h = 120; b.ex = x + w / 2; }
      else if (theme === 'tower' && w > 140) { b.kind = 'office'; b.h = 200 + Math.floor(r() * 30); }
      else if (theme === 'stadium' && r() < 0.25) { b.kind = 'apart'; b.w = w = 150; b.ex = x + w / 2; b.h = 215; }
      else { b.kind = 'house'; b.h = 120 + Math.floor(r() * 4) * 40 + Math.floor(r() * 12); }
      b.wall = pick(r, WALLS);
      b.trim = pick(r, ['#adb5bd', '#ced4da', '#868e96', '#e9ecef']);
      const s = pick(r, SIGNS);
      b.sign = s[0]; b.signBg = s[1]; b.signFg = s[2];
      b.tank = r() < 0.55; b.balcony = r() < 0.6; b.awn = r() < 0.5 ? pick(r, ['#e03131', '#1c7ed6', '#2f9e44', '#f59f00']) : null;
      b.seed = Math.floor(r() * 1e6);
      far.push(b);
      x += w + (r() < 0.12 ? 18 + Math.floor(r() * 20) : 2);
    }
    // vỉa hè phía xa: cây xanh + cột điện có dây chằng chịt
    for (let x = -700; x < e.len + 700; x += 150 + Math.floor(r() * 140)) {
      if (near(x, 120)) continue;
      side.push({ ex: x, kind: r() < 0.6 ? 'tree' : 'bike', seed: Math.floor(r() * 1e6) });
    }
    const poles = [];
    for (let x = -700; x < e.len + 700; x += 210) if (!near(x, 110)) poles.push(x);
    // vỉa hè phía gần: quán vỉa hè (tấp vào ăn được), bồn cây, xe máy đỗ, cột đèn
    let lastStall = -9999;
    const foods = DATA.STREET_FOOD || [];
    for (let x = -700; x < e.len + 700; x += 110 + Math.floor(r() * 110)) {
      if (near(x, 140)) continue;
      if (x - lastStall > 520 && r() < 0.6 && foods.length) { front.push({ ex: x, kind: 'stall', food: pick(r, foods).id, seed: Math.floor(r() * 1e6) }); lastStall = x; x += 60; continue; }
      front.push({ ex: x, kind: pick(r, ['planter', 'planter', 'bikes', 'lamp', 'lamp', 'bin']), seed: Math.floor(r() * 1e6) });
    }
    const sc = { far, side, poles, front, gates };
    sceneCache.set(key, sc);
    return sc;
  }

  /* ---------- Trạng thái chuyến đi ---------- */
  let active = false, legs = null, li = 0, me = null, dest = null, from = null, veh = 'taxi', bike = null;
  let phase = 'drive', phaseT = 0, banner = null, npcs = [], spawnT = [0, 0, 0, 0], sendT = 0, fadeIn = 1, shake = 0;
  let crashMsgAt = 0, finedAt = -1, eatOpen = false, blockedT = 0, trainX = null;
  const others = new Map();
  const keys = new Set();
  let el = null, cv = null, ctx = null, W = 0, H = 0, DPR = 1, clock = 0;

  const leg = () => legs[li];
  const edgeOffset = () => leg().from + leg().dir * me.x;
  const lastLeg = () => li === legs.length - 1;
  const remaining = () => (leg().len - me.x) + legs.slice(li + 1).reduce((a, l) => a + l.len, 0);

  /** Đèn giao thông ở ngã tư cuối chặng (đồng bộ theo giờ thật nên mọi người thấy giống nhau) */
  function light(l) {
    const C = 14, off = hash(l.e.id + l.dir) % C, t = (Date.now() / 1000 + off) % C;
    if (t < 8) return { s: 'g', left: Math.ceil(8 - t) };
    if (t < 10) return { s: 'y', left: Math.ceil(10 - t) };
    return { s: 'r', left: Math.ceil(C - t) };
  }
  const stopX = () => leg().len - CROSS - 30;

  /* ---------- Bắt đầu / kết thúc ---------- */
  /** xe thuê có tài xế (gọi qua app ZenoCar) */
  const HIRED = ['taxi', 'xeom', 'vip'];
  const XEOM_DRIVER = { skin: '#f1c27d', hair: 'short', hairColor: '#2b2b33', shirt: '#00b14f', shirtStyle: 'plain', pants: '#343a40', hat: 'none', acc: 'none', pet: 'none', npc: true };
  function start(fromZone, to, vehicle) {
    const r = route(fromZone, to);
    if (!r) return false;
    ensureDom();
    legs = r; li = 0; from = fromZone; dest = to; veh = vehicle;
    carDef = (DATA.CARS || []).find((c) => c.id === veh) || null;
    bike = HIRED.includes(veh) ? null : carDef || (DATA.BIKES || []).find((b) => b.id === veh) || DATA.BIKES[0];
    me = { x: 0, v: 0, lane: 3, ly: LANE_Y[3], len: carDef ? carDef.len : bike || veh === 'xeom' ? 70 : 150 };
    batWarn = 0; towed = false;
    npcs = []; others.clear(); keys.clear();
    phase = 'drive'; phaseT = 0; fadeIn = 1; shake = 0; finedAt = -1; eatOpen = false; blockedT = 0; trainX = null;
    banner = { text: `${veh === 'taxi' ? '🚕 Taxi Xanh SM' : veh === 'xeom' ? '🛵 Xe ôm ZenoCar' : veh === 'vip' ? '🚙 Xe sang ZenoCar' : (carDef ? '🚗 ' : '🛵 ') + bike.name} · ${leg().e.name}`, until: clock + 2.6 };
    active = true;
    el.classList.toggle('bike', !!bike);
    el.style.display = 'block';
    resize();
    seedTraffic();
    updateHud(true);
    if (carDef) UI.toast(`🚗 Giữ ⚡ (hoặc →) để ga, 🛑 (←) để phanh, ⬆⬇ đổi làn · 🔋 Pin ${Math.round(carBat())}%`, 5000);
    else if (bike) UI.toast('🛵 Giữ ⚡ (hoặc →) để ga, 🛑 (←) để phanh, ⬆⬇ để đổi làn. Nhớ dừng đèn đỏ nhé!', 5000);
    return true;
  }

  /* ---------- Pin ô tô điện ---------- */
  let carDef = null, batWarn = 0, towed = false;
  const carState = () => { const S = AV.S; S.evs = S.evs || {}; return S.evs[carDef.id] || (S.evs[carDef.id] = { bat: 100 }); };
  const carBat = () => (carDef ? carState().bat : 100);
  /** % pin cần cho một quãng đường (mét) */
  const batNeed = (car, m) => Math.ceil((m / 1000) / car.range * 100);
  function drainBattery(dist) {
    if (!carDef || towed) return;
    const st = carState();
    st.bat = Math.max(0, st.bat - (dist / 1000) / carDef.range * 100);
    if (st.bat <= 20 && batWarn < 1) { batWarn = 1; UI.toast('🔋 Pin còn dưới 20% — nhớ ghé trạm sạc V-GREEN trước cổng nông trại nhé!', 4500); }
    if (st.bat <= 5 && batWarn < 2) { batWarn = 2; UI.toast('🪫 Pin sắp cạn (dưới 5%)!', 3500); if (navigator.vibrate) navigator.vibrate(150); }
    if (st.bat <= 0 && !towed) {
      towed = true; st.bat = 0; me.v = 0;
      const fee = Math.min(150, AV.S.coins);
      AV.S.coins -= fee;
      banner = { text: '🪫 Hết pin! Xe cứu hộ VinFast đang tới…', until: clock + 3 };
      UI.toast(`🪫 Xe hết pin giữa đường! Cứu hộ VinFast kéo xe bạn tới nơi (−${fee} xu). Nhớ sạc ở trạm V-GREEN trước cổng nông trại.`, 7000);
      phase = 'arrive'; phaseT = -1.5;
    }
  }

  function finish() {
    if (!active) return;
    if (carDef) { const b = Math.round(carBat()); AV.markChanged(); if (!towed && b < 20) setTimeout(() => UI.toast(`🔋 ${carDef.name} còn ${b}% pin — sạc ở trạm V-GREEN trước cổng nông trại nhé`, 5000), 1500); }
    active = false;
    el.style.display = 'none';
    keys.clear();
    AV.endRide(dest);
  }

  /* ---------- Giao thông ---------- */
  const NPC_KINDS = [
    ['moto', 0.5, 60], ['moto', 0, 60], ['sedan', 0.18, 140], ['suv', 0.1, 150], ['taxi', 0.08, 145], ['bus', 0.06, 290], ['truck', 0.05, 230],
  ];
  function rollKind(r) {
    let x = r * NPC_KINDS.reduce((a, k) => a + k[1], 0);
    for (const k of NPC_KINDS) if ((x -= k[1]) < 0) return k;
    return NPC_KINDS[0];
  }
  const CAR_COLORS = ['#f8f9fa', '#212529', '#adb5bd', '#c92a2a', '#1864ab', '#e9ecef', '#495057', '#f08c00', '#2b8a3e'];
  const JACKETS = ['#ff8787', '#74c0fc', '#ffd43b', '#b197fc', '#63e6be', '#ffa8a8', '#ced4da', '#ff922b', '#f783ac'];
  function makeNpc(lane, x) {
    const k = rollKind(Math.random());
    const opp = lane < 2;
    const base = k[0] === 'bus' ? 260 : k[0] === 'truck' ? 280 : k[0] === 'moto' ? 300 : 340;
    const vmax = base + Math.random() * (opp ? 160 : 110);
    return {
      lane, x, kind: k[0], len: k[2], v: vmax * 0.9, vmax, opp,
      color: k[0] === 'taxi' ? '#00b8b8' : pick(Math.random, CAR_COLORS),
      jacket: pick(Math.random, JACKETS), helmet: pick(Math.random, ['#e03131', '#fff', '#1971c2', '#fab005', '#212529', '#f783ac']),
      pillion: k[0] === 'moto' && Math.random() < 0.3, route: pick(Math.random, ['32', '34', '16', '20A', '49', '55', '38']),
      model: pick(Math.random, ['cub', 'scooter', 'scooter', 'electric']),
    };
  }
  function seedTraffic() {
    const vw = viewW();
    for (let lane = 0; lane < 4; lane++) {
      let x = -300 + Math.random() * 300, prev = 0;
      while (x < vw + 600) {
        const n = makeNpc(lane, x);
        n.x = x += (prev + n.len) / 2 + 90 + Math.random() * 320;
        prev = n.len;
        if (lane >= 2 && Math.abs(n.x - me.x) < (n.len + me.len) / 2 + 120) continue;
        npcs.push(n);
      }
    }
  }

  function aheadOf(lane, x, self) {
    let best = null;
    const list = npcs.filter((n) => n.lane === lane && n !== self);
    if (self !== me && me.lane === lane) list.push(me);
    for (const n of list) if (n.x > x && (!best || n.x < best.x)) best = n;
    return best;
  }
  /** Tốc độ nên chạy: bám xe trước, dừng đèn đỏ, dừng ở điểm đến */
  function targetSpeed(a, vmax, obeyLight) {
    let t = vmax;
    const ah = aheadOf(a.lane, a.x, a);
    if (ah) {
      const gap = ah.x - a.x - (ah.len + a.len) / 2;
      if (gap < 26) t = 0;
      else if (gap < 150) t = Math.min(t, Math.max(0, (ah.v || 0) + (gap - 60) * 2.2));
    }
    if (obeyLight && !lastLeg()) {
      const L = light(leg()), d = stopX() - (a.x + a.len / 2);
      if (L.s !== 'g' && d > (L.s === 'y' ? 40 : -4) && d < 260) t = Math.min(t, Math.max(0, (d - 6) * 2.4));
    }
    return t;
  }
  const approach = (v, t, dt, up = 320, down = 900) => (t > v ? Math.min(t, v + up * dt) : Math.max(t, v - down * dt));

  function updateTraffic(dt) {
    const camX = me.x - viewW() * 0.32, vw = viewW();
    for (const n of npcs) {
      if (n.opp) { n.x -= n.v * dt; continue; }
      n.v = approach(n.v, targetSpeed(n, n.vmax, true), dt, 260, 1400);
      n.x += n.v * dt;
    }
    npcs = npcs.filter((n) => n.x > camX - 900 && n.x < camX + vw + 1300);
    for (let lane = 0; lane < 4; lane++) {
      spawnT[lane] -= dt;
      if (spawnT[lane] > 0) continue;
      spawnT[lane] = 0.9 + Math.random() * 1.8;
      const inLane = npcs.filter((n) => n.lane === lane);
      if (inLane.length > 5) continue;
      if (lane < 2) {
        const n = makeNpc(lane, camX + vw + 300 + Math.random() * 300);
        if (!inLane.some((o) => Math.abs(o.x - n.x) < (o.len + n.len) / 2 + 90)) npcs.push(n);
      } else {
        // xe chạy chậm hơn ở phía trước, hoặc xe nhanh đuổi từ phía sau khi mình đi chậm
        const behind = me.v < 250 && Math.random() < 0.5;
        const x = behind ? camX - 300 : camX + vw + 250 + Math.random() * 300;
        const n = makeNpc(lane, x);
        if (!inLane.some((o) => Math.abs(o.x - x) < (o.len + n.len) / 2 + 160) && Math.abs(x - me.x) > 300) {
          if (behind) { n.vmax = 420 + Math.random() * 80; n.v = n.vmax; } else { n.vmax = Math.min(n.vmax, 250 + Math.random() * 140); n.v = n.vmax; }
          npcs.push(n);
        }
      }
    }
  }

  /* ---------- Cập nhật mỗi khung hình ---------- */
  function frame(dt) {
    if (!active) return;
    clock += dt;
    if (fadeIn > 0) fadeIn = Math.max(0, fadeIn - dt * 2.2);
    if (shake > 0) shake = Math.max(0, shake - dt * 2);
    const l = leg();
    const blocking = UI.isBlocking();
    if (phase === 'drive') {
      if (bike) driveBike(dt, blocking);
      else driveTaxi(dt);
      me.x += me.v * dt;
      drainBattery(me.v * dt);
      if (phase !== 'drive') { updateHud(true); draw(); return; }
      me.ly += (LANE_Y[me.lane] - me.ly) * Math.min(1, dt * 7);
      // vượt đèn đỏ bằng xe máy → phạt nguội
      if (bike && !lastLeg() && finedAt !== li) {
        const sx = stopX();
        if (me.x + me.len / 2 > sx + 4 && me.x + me.len / 2 - me.v * dt <= sx + 4 && light(l).s === 'r' && me.v > 40) {
          finedAt = li;
          const fine = Math.min(50, AV.S.coins);
          AV.S.coins -= fine;
          AV.markChanged();
          UI.updateHud();
          UI.toast(`📸 Phạt nguội: vượt đèn đỏ ở ${l.e.name}! −${fine} xu`, 4200);
          if (MUSIC.whistle) MUSIC.whistle();
        }
      }
      if (lastLeg()) {
        if (me.x >= l.len - 8 || (!bike && l.len - me.x < 14 && me.v < 20)) { me.x = Math.min(me.x, l.len); me.v = 0; phase = 'arrive'; phaseT = 0; banner = { text: `📍 Đã tới ${zoneName(dest)}`, until: clock + 3 }; }
      } else if (me.x > l.len + 160) {
        phase = 'turn'; phaseT = 0;
      }
    } else if (phase === 'turn') {
      phaseT += dt;
      if (phaseT >= 0.3) {
        banner = { text: turnText(legs, li), until: clock + 2.4 };
        li++;
        me.x = 30; npcs = []; seedTraffic(); trainX = null; fadeIn = 1; finedAt = -1;
        phase = 'drive';
      }
    } else if (phase === 'arrive') {
      phaseT += dt;
      me.v = 0;
      if (phaseT > 1.1) { finish(); return; }
    }
    updateTraffic(dt);
    updateOthers(dt);
    sendT -= dt;
    if (sendT <= 0) { sendT = 0.18; sendMe(); }
    updateHud(false);
    draw();
  }

  function driveTaxi(dt) {
    const l = leg();
    let t = targetSpeed(me, 470, true);
    if (lastLeg()) t = Math.min(t, Math.max(0, (l.len - me.x) * 2.2 + 8));
    if (me.x < 140 && li === 0) t = Math.min(t, 120 + me.x * 2.5);
    // bị kẹt sau xe chậm → tự chuyển làn
    const ah = aheadOf(me.lane, me.x, me);
    if (ah && ah.x - me.x < 260 && (ah.v || 0) < 330 && t < 400 && !(!lastLeg() && light(l).s !== 'g' && stopX() - me.x < 300)) blockedT += dt; else blockedT = 0;
    if (blockedT > 0.8) {
      const other = me.lane === 3 ? 2 : 3;
      const clear = !npcs.some((n) => n.lane === other && Math.abs(n.x - me.x) < (n.len + me.len) / 2 + 70);
      if (clear) me.lane = other;
      blockedT = 0;
    }
    me.v = approach(me.v, t, dt, 260, 800);
  }

  function driveBike(dt, blocking) {
    const l = leg();
    const gas = !blocking && !eatOpen && (keys.has('gas') || keys.has('right'));
    const brake = keys.has('brake') || keys.has('left') || blocking || eatOpen;
    if (brake) me.v = Math.max(0, me.v - 900 * dt);
    else if (gas) me.v = Math.min(bike.max, me.v + (bike.accel || 300) * dt * (1 - me.v / (bike.max * 1.15)));
    else me.v = Math.max(0, me.v - 90 * dt);
    if (lastLeg() && l.len - me.x < 160) me.v = Math.min(me.v, Math.max(40, (l.len - me.x) * 2));
    // va quẹt xe phía trước
    const ah = aheadOf(me.lane, me.x, me);
    if (ah) {
      const gap = ah.x - me.x - (ah.len + me.len) / 2;
      if (gap < 4) {
        const hard = me.v - (ah.v || 0) > 120;
        me.x = ah.x - (ah.len + me.len) / 2 - 4;
        me.v = Math.min(me.v, (ah.v || 0) * 0.6);
        if (hard) {
          shake = 1;
          if (clock - crashMsgAt > 3) { crashMsgAt = clock; UI.toast(pick(Math.random, ['💥 Ối! Va vào xe trước rồi, đi chậm thôi!', '😵 Cẩn thận! Giữ khoảng cách nhé', '🚨 Suýt nữa thì to chuyện!'])); if (navigator.vibrate) navigator.vibrate(120); }
        }
      }
    }
  }

  function changeLane(d) {
    if (!active || !bike || phase !== 'drive') return;
    const nl = Math.max(2, Math.min(3, me.lane + d));
    me.lane = nl;
  }

  const zoneName = (id) => { const z = DATA.ZONES.find((x) => x.id === id); return z ? `${z.icon} ${z.name}` : id; };

  /* ---------- Người chơi khác trên cùng con đường ---------- */
  function sendMe() {
    if (!me || !NET.sendRide) return;
    const S = AV.S;
    NET.sendRide({ edge: leg().e.id, o: Math.round(edgeOffset()), dir: leg().dir, lane: me.lane, veh, v: Math.round(me.v), name: S.name, look: S.look });
  }
  function onNet(m) {
    if (!m || typeof m.edge !== 'string' || !E[m.edge]) return;
    let o = others.get(m.id);
    if (!o) { o = { id: m.id, ro: +m.o || 0 }; others.set(m.id, o); }
    o.edge = m.edge; o.o = +m.o || 0; o.dir = m.dir === -1 ? -1 : 1; o.lane = m.lane === 2 ? 2 : 3; o.v = +m.v || 0;
    o.veh = String(m.veh || 'taxi').slice(0, 12);
    o.name = String(m.name || 'Người chơi').slice(0, 16);
    const look = {};
    if (m.look && typeof m.look === 'object') Object.keys(AV.S.look).forEach((k) => { if (m.look[k] != null) look[k] = String(m.look[k]).slice(0, 24); });
    o.look = { ...AV.S.look, ...look };
    o.seen = Date.now();
  }
  function updateOthers(dt) {
    const t = Date.now();
    for (const [id, o] of others) {
      if (t - o.seen > 4000) { others.delete(id); continue; }
      o.o += o.dir * o.v * dt * 0.9;
      if (Math.abs(o.o - o.ro) > 500) o.ro = o.o;
      o.ro += (o.o - o.ro) * Math.min(1, dt * 6);
      o.t = (o.t || 0) + dt;
    }
  }

  /* ---------- Giao diện ---------- */
  function ensureDom() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'ride-view';
    el.innerHTML = `<canvas></canvas>
      <div class="ride-top"><div class="ride-street"><span class="ride-sign">🛣️ <b></b></span><small></small></div><div class="ride-next"></div></div>
      <div class="ride-banner"></div>
      <div class="ride-speed"><b>0</b><small>km/h</small></div>
      <button class="ride-skip">⏩ Tới luôn</button>
      <button class="ride-eat"></button>
      <div class="ride-ctl">
        <div class="ride-lanes"><button data-k="up">⬆</button><button data-k="down">⬇</button></div>
        <div class="ride-pedals"><button data-k="brake" class="brake">🛑<small>Phanh</small></button><button data-k="gas" class="gas">⚡<small>Ga</small></button></div>
      </div>`;
    document.body.appendChild(el);
    cv = el.querySelector('canvas');
    ctx = cv.getContext('2d');
    el.querySelector('.ride-skip').onclick = () => {
      if (phase === 'arrive') return;
      phase = 'arrive'; phaseT = 0.6;
      banner = { text: `📍 Đã tới ${zoneName(dest)}`, until: clock + 3 };
    };
    el.querySelector('.ride-eat').onclick = () => {
      const st = nearStall();
      if (!st) return;
      me.v = 0; eatOpen = true;
      UI.eateryPanel(st.food);
      const wait = setInterval(() => { if (!UI.isBlocking()) { eatOpen = false; clearInterval(wait); } }, 300);
    };
    el.querySelectorAll('[data-k]').forEach((b) => {
      const k = b.dataset.k;
      if (k === 'up' || k === 'down') { b.onpointerdown = (e) => { e.preventDefault(); changeLane(k === 'up' ? -1 : 1); }; return; }
      b.onpointerdown = (e) => { e.preventDefault(); keys.add(k); b.classList.add('on'); };
      const up = () => { keys.delete(k); b.classList.remove('on'); };
      b.onpointerup = up; b.onpointerleave = up; b.onpointercancel = up;
    });
    window.addEventListener('resize', () => { if (active) resize(); });
    const KM = { ArrowRight: 'right', ArrowLeft: 'left', d: 'right', a: 'left' };
    window.addEventListener('keydown', (e) => {
      if (!active || /input|textarea/i.test(document.activeElement?.tagName || '')) return;
      const k = KM[e.key] || KM[e.key.toLowerCase?.()];
      if (k) { keys.add(k); e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (e.key === 'ArrowUp' || e.key.toLowerCase?.() === 'w') { changeLane(-1); e.preventDefault(); e.stopImmediatePropagation(); }
      if (e.key === 'ArrowDown' || e.key.toLowerCase?.() === 's') { changeLane(1); e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    window.addEventListener('keyup', (e) => { const k = KM[e.key] || KM[e.key.toLowerCase?.()]; if (k) keys.delete(k); }, true);
    window.addEventListener('blur', () => keys.clear());
  }

  function resize() {
    DPR = AV.S.settings && AV.S.settings.gfx === 'saver' ? Math.min(1.3, devicePixelRatio || 1) : Math.min(2, devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
  }
  const scaleK = () => Math.min(H / VIEW_H, W / 560);
  const viewW = () => (W || window.innerWidth) / scaleK();

  /** Quán vỉa hè ngay cạnh xe máy (đi chậm, làn sát lề) */
  function nearStall() {
    if (!bike || phase !== 'drive' || me.lane !== 3 || me.v > 170) return null;
    const l = leg(), sc = scene(l.e, l.dir);
    return sc.front.find((f) => f.kind === 'stall' && Math.abs((f.ex - l.from) * l.dir - me.x) < 95) || null;
  }

  let hudKey = '';
  function updateHud(force) {
    const l = leg();
    const next = lastLeg() ? `🎯 ${zoneName(dest)} · còn ${km(Math.max(0, remaining()))}` : `${l.len - me.x < 500 ? turnText(legs, li) : '🎯 ' + zoneName(dest)} · còn ${km(Math.max(0, remaining()))}`;
    const st = nearStall();
    const food = st && (DATA.STREET_FOOD || []).find((f) => f.id === st.food);
    const eat = food ? `${food.logo} Tấp vào: ${food.name}` : '';
    const ban = banner && banner.until > clock ? banner.text : '';
    const bat = carDef ? Math.round(carBat()) : -1;
    const key = [l.e.id, next, eat, ban, Math.round(me.v / 10), bat].join('|');
    if (!force && key === hudKey) return;
    hudKey = key;
    el.querySelector('.ride-sign b').textContent = l.e.name;
    el.querySelector('.ride-street small').textContent = l.e.dist + ' · Hà Nội';
    el.querySelector('.ride-next').textContent = next;
    el.querySelector('.ride-speed b').textContent = Math.round(me.v / 10);
    let bt = el.querySelector('.ride-bat');
    if (!bt) { bt = document.createElement('div'); bt.className = 'ride-bat'; el.appendChild(bt); }
    bt.style.display = carDef ? 'block' : 'none';
    if (carDef) { bt.textContent = `${bat <= 20 ? '🪫' : '🔋'} ${bat}%`; bt.classList.toggle('low', bat <= 20); }
    const eb = el.querySelector('.ride-eat');
    eb.textContent = eat;
    eb.style.display = eat ? 'block' : 'none';
    const bn = el.querySelector('.ride-banner');
    bn.textContent = ban;
    bn.style.display = ban ? 'block' : 'none';
  }

  /* ---------- Vẽ ---------- */
  function draw() {
    const k = scaleK(), vw = W / k, oy = (H - VIEW_H * k) * 0.8;
    const l = leg(), sc = scene(l.e, l.dir);
    const camX = me.x - vw * 0.32 + (shake ? (Math.random() - 0.5) * 10 * shake : 0);
    const night = AV.nightFactor ? AV.nightFactor() : 0;
    const c = ctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    // phần thừa trên/dưới (màn hình dọc)
    c.fillStyle = night > 0.5 ? '#0b1730' : '#74c0fc'; c.fillRect(0, 0, W, Math.max(0, oy) + 2);
    c.fillStyle = '#b8b0a4'; c.fillRect(0, oy + VIEW_H * k - 2, W, H);
    c.setTransform(DPR * k, 0, 0, DPR * k, 0, DPR * oy);
    const lx = (ex) => (ex - l.from) * l.dir - camX;
    c.save();
    sky(c, vw, night, camX);
    skyline(c, vw, camX, l.e.theme, night);
    // nhà phía xa
    for (const b of sc.far) { const x = lx(b.ex); if (x + b.w / 2 < -40 || x - b.w / 2 > vw + 40) continue; building(c, b, x, night); }
    for (const g of sc.gates) { const x = lx(g.ex); if (x > -200 && x < vw + 200) zoneGate(c, g.z, x); }
    crossStreets(c, vw, camX, 'far');
    farSidewalk(c, vw);
    for (const s of sc.side) { const x = lx(s.ex); if (x < -80 || x > vw + 80) continue; sideItem(c, s, x); }
    wires(c, sc.poles.map(lx).filter((x) => x > -260 && x < vw + 260));
    if (l.e.theme === 'metro') metro(c, vw, camX, night);
    road(c, vw, camX);
    // đèn giao thông + biển tên đường
    if (!lastLeg()) trafficPole(c, stopX() - camX - 14);
    streetSign(c, 120 - camX, l.e);
    if (l.len > 1400) streetSign(c, l.len / 2 - camX, l.e);
    // xe cộ: làn xa vẽ trước
    const actors = npcs.map((n) => ({ lane: n.lane, y: LANE_Y[n.lane], draw: () => drawNpc(c, n, n.x - camX) }));
    for (const o of others.values()) {
      if (o.edge !== l.e.id) continue;
      const same = o.dir === l.dir, x = (o.ro - l.from) * l.dir - camX;
      if (x < -200 || x > vw + 200) continue;
      const lane = same ? o.lane : 3 - o.lane;
      actors.push({ lane, y: LANE_Y[lane], draw: () => drawPlayerVeh(c, x, LANE_Y[lane], o.veh, o.look, o.t || 0, same ? 1 : -1, o.name, false) });
    }
    actors.push({ lane: me.lane, y: me.ly + 0.5, draw: () => drawPlayerVeh(c, me.x - camX, me.ly, veh, AV.S.look, clock, 1, AV.S.name, true) });
    actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
    nearSidewalk(c, vw);
    crossStreets(c, vw, camX, 'near');
    for (const f of sc.front) { const x = lx(f.ex); if (x < -90 || x > vw + 90) continue; frontItem(c, f, x); }
    if (night > 0) nightPass(c, vw, camX, night, sc, lx);
    rain(c, vw);
    c.restore();
    if (fadeIn > 0 || phase === 'turn' || phase === 'arrive') {
      const a = phase === 'turn' ? Math.min(1, phaseT / 0.3) : phase === 'arrive' ? Math.max(0, (phaseT - 0.5) / 0.6) : fadeIn;
      c.setTransform(DPR, 0, 0, DPR, 0, 0);
      c.fillStyle = `rgba(10,16,28,${a})`; c.fillRect(0, 0, W, H);
    }
  }

  function sky(c, vw, night, camX) {
    const g = c.createLinearGradient(0, 0, 0, FAR);
    if (night > 0.5) { g.addColorStop(0, '#0b1730'); g.addColorStop(1, '#2b3a67'); }
    else { g.addColorStop(0, '#74c0fc'); g.addColorStop(1, '#d0ebff'); }
    c.fillStyle = g; c.fillRect(-10, -10, vw + 20, FAR + 20);
    if (night > 0.5) {
      const r = rng(7);
      for (let i = 0; i < 60; i++) circ(c, (r() * 3000 - camX * 0.05) % (vw + 40), r() * 200, r() * 1.4 + 0.4, 'rgba(255,255,255,.8)');
      circ(c, vw * 0.8, 70, 26, '#fff9db');
    } else {
      circ(c, vw * 0.82, 70, 34, '#fff3bf');
      for (let i = -1; i < vw / 300 + 2; i++) {
        const off = camX * 0.08, x = i * 300 - (off % 300), r = rng(hash('cl' + (i + Math.floor(off / 300))));
        const y = 40 + r() * 70;
        c.fillStyle = 'rgba(255,255,255,.9)';
        c.beginPath(); c.ellipse(x, y, 46, 16, 0, 0, Math.PI * 2); c.ellipse(x + 30, y - 10, 30, 16, 0, 0, Math.PI * 2); c.ellipse(x - 26, y - 4, 24, 12, 0, 0, Math.PI * 2); c.fill();
      }
    }
  }

  /** Nhà cao tầng / sân vận động / cánh đồng ở xa (trôi chậm) */
  function skyline(c, vw, camX, theme, night) {
    const P = 0.3, step = 110, off = camX * P;
    const i0 = Math.floor(off / step) - 2, i1 = i0 + Math.ceil(vw / step) + 4;
    for (let i = i0; i < i1; i++) {
      const r = rng(hash(theme + i)), x = i * step - off;
      const col = night > 0.5 ? '#2c3e66' : '#9fb8cf';
      if (theme === 'highway') {
        c.fillStyle = night > 0.5 ? '#1f3b2d' : '#8ccf8a';
        c.beginPath(); c.ellipse(x + 55, FAR - 30, 90, 40 + r() * 30, 0, Math.PI, 0); c.fill();
        continue;
      }
      if (theme === 'stadium' && i % 9 === 0) {
        // sân vận động Mỹ Đình
        c.fillStyle = night > 0.5 ? '#3b4a6b' : '#c5d4e3';
        c.beginPath(); c.ellipse(x + 120, FAR - 40, 150, 70, 0, Math.PI, 0); c.fill();
        c.strokeStyle = night > 0.5 ? '#5c7cfa' : '#4c6ef5'; c.lineWidth = 5;
        c.beginPath(); c.arc(x + 120, FAR + 60, 170, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
        [[-10, 0], [250, 0]].forEach(([dx]) => { c.fillStyle = col; c.fillRect(x + dx, FAR - 170, 6, 140); c.fillStyle = night > 0.5 ? '#fff3bf' : '#e9ecef'; c.fillRect(x + dx - 10, FAR - 182, 26, 14); });
        continue;
      }
      const tall = theme === 'tower' ? 150 + r() * 150 : 70 + r() * 90;
      const w = 50 + r() * 50;
      c.fillStyle = theme === 'tower' ? (night > 0.5 ? '#2a3f6b' : '#8fb3d9') : col;
      c.fillRect(x, FAR - tall, w, tall);
      if (theme === 'tower' && i % 7 === 0) {
        // toà tháp chọc trời
        c.fillStyle = night > 0.5 ? '#334e86' : '#7aa5d6';
        c.fillRect(x + w + 6, FAR - 300, 44, 300); c.fillRect(x + w + 54, FAR - 280, 40, 280);
        c.fillStyle = night > 0.5 ? '#ffd43b' : '#dee2e6'; c.fillRect(x + w + 26, FAR - 322, 4, 22);
      }
      if (night > 0.5) { c.fillStyle = 'rgba(255,224,102,.55)'; for (let k = 0; k < 6; k++) c.fillRect(x + 6 + r() * (w - 12), FAR - tall + 10 + r() * (tall - 20), 4, 5); }
    }
  }

  function building(c, b, cx, night) {
    const x = cx - b.w / 2, top = FAR - b.h, r = rng(b.seed);
    if (b.kind === 'field') {
      c.fillStyle = '#82c91e'; c.fillRect(x, FAR - 30, b.w, 30);
      circ(c, cx, FAR - 50, 30, '#5c940d'); circ(c, cx - 22, FAR - 38, 20, '#74b816');
      return;
    }
    if (b.kind === 'billboard') {
      c.fillStyle = '#495057'; c.fillRect(cx - 4, FAR - 120, 8, 120);
      c.fillStyle = '#fff'; rr(c, x, FAR - 190, b.w, 76, 6); c.fill();
      c.fillStyle = b.signBg; rr(c, x + 5, FAR - 185, b.w - 10, 66, 4); c.fill();
      c.fillStyle = b.signFg; c.textAlign = 'center'; c.textBaseline = 'middle';
      fitText(c, b.sign, cx, FAR - 152, b.w - 18, 16);
      return;
    }
    if (b.kind === 'campus') {
      c.fillStyle = '#f1f3f5'; c.fillRect(x + 10, top, b.w - 20, b.h - 20);
      c.fillStyle = '#1c7ed6'; for (let wx = x + 22; wx < x + b.w - 30; wx += 26) for (let wy = top + 14; wy < FAR - 50; wy += 30) c.fillRect(wx, wy, 14, 16);
      c.fillStyle = '#e03131'; c.fillRect(x, FAR - 40, b.w, 8);
      c.fillStyle = '#c92a2a'; c.fillRect(x + 6, FAR - 70, 12, 70); c.fillRect(x + b.w - 18, FAR - 70, 12, 70);
      c.fillStyle = '#fff'; rr(c, x + 20, FAR - 76, b.w - 40, 24, 4); c.fill();
      c.fillStyle = '#1864ab'; c.textAlign = 'center'; c.textBaseline = 'middle';
      fitText(c, 'TRƯỜNG ĐẠI HỌC', cx, FAR - 64, b.w - 50, 13);
      return;
    }
    const glass = b.kind === 'office';
    c.fillStyle = glass ? '#a5d8ff' : b.wall;
    c.fillRect(x, top, b.w, b.h);
    c.fillStyle = 'rgba(0,0,0,.07)'; c.fillRect(x + b.w - 7, top, 7, b.h);
    c.fillStyle = b.trim; c.fillRect(x - 3, top - 8, b.w + 6, 10);
    if (b.tank && !glass) {
      c.fillStyle = '#ced4da'; rr(c, x + b.w * 0.2, top - 30, 30, 20, 8); c.fill();
      c.fillStyle = '#adb5bd'; c.fillRect(x + b.w * 0.2 + 4, top - 12, 4, 6); c.fillRect(x + b.w * 0.2 + 22, top - 12, 4, 6);
    }
    // cửa sổ các tầng
    const cols = Math.max(1, Math.floor((b.w - 14) / (glass ? 22 : 34)));
    const gap = (b.w - cols * (glass ? 16 : 22)) / (cols + 1);
    for (let fy = top + 14, f = 0; fy < FAR - 92; fy += glass ? 30 : 44, f++) {
      for (let i = 0; i < cols; i++) {
        const wx = x + gap + i * ((glass ? 16 : 22) + gap);
        c.fillStyle = glass ? '#4dabf7' : '#74c0fc';
        c.fillRect(wx, fy, glass ? 16 : 22, glass ? 20 : 26);
        if (!glass) { c.fillStyle = '#fff'; c.fillRect(wx + 10, fy, 2, 26); }
      }
      if (b.balcony && !glass && f % 2 === 0) {
        c.strokeStyle = '#495057'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x + 4, fy + 34); c.lineTo(x + b.w - 4, fy + 34); c.stroke();
        for (let bx = x + 8; bx < x + b.w - 6; bx += 8) { c.beginPath(); c.moveTo(bx, fy + 34); c.lineTo(bx, fy + 26); c.stroke(); }
        if (r() < 0.5) { c.fillStyle = '#2f9e44'; circ(c, x + 14, fy + 22, 6, '#40c057'); }
      }
      if (!glass && r() < 0.35) { c.fillStyle = '#f8f9fa'; c.fillRect(x + b.w - 26, fy + 4, 16, 11); c.fillStyle = '#adb5bd'; c.fillRect(x + b.w - 24, fy + 7, 12, 2); }
    }
    // tầng trệt: biển hiệu + cửa hàng
    c.fillStyle = b.signBg; c.fillRect(x + 3, FAR - 86, b.w - 6, 24);
    c.fillStyle = b.signFg; c.textAlign = 'center'; c.textBaseline = 'middle';
    fitText(c, b.sign, cx, FAR - 74, b.w - 14, 13);
    c.fillStyle = '#343a40'; c.fillRect(x + 6, FAR - 60, b.w - 12, 60);
    c.fillStyle = night > 0.5 ? '#ffe8a3' : '#f8f9fa'; c.fillRect(x + 10, FAR - 56, b.w - 20, 56);
    // hàng hoá trong cửa hàng
    for (let i = 0; i < 4; i++) { c.fillStyle = pick(r, ['#ff8787', '#ffd43b', '#69db7c', '#74c0fc', '#da77f2']); c.fillRect(x + 16 + i * (b.w - 32) / 4, FAR - 44 + (i % 2) * 8, (b.w - 40) / 5, 14); }
    if (b.awn) {
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff' : b.awn; c.beginPath(); c.moveTo(x + i * b.w / 8, FAR - 62); c.lineTo(x + (i + 1) * b.w / 8, FAR - 62); c.lineTo(x + (i + 1) * b.w / 8 + 2, FAR - 46); c.lineTo(x + i * b.w / 8 + 2, FAR - 46); c.fill(); }
    }
  }

  function zoneGate(c, z, x) {
    const zn = DATA.ZONES.find((q) => q.id === z);
    c.fillStyle = '#c8874a'; c.fillRect(x - 86, FAR - 150, 16, 150); c.fillRect(x + 70, FAR - 150, 16, 150);
    c.fillStyle = '#2f9e44'; rr(c, x - 104, FAR - 196, 208, 54, 12); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; rr(c, x - 104, FAR - 196, 208, 54, 12); c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    fitText(c, zn ? `${zn.icon} ${zn.name.toUpperCase()}` : z, x, FAR - 168, 190, 22);
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x - 70, FAR - 60, 140, 60);
    c.fillStyle = '#ffd43b'; circ(c, x - 78, FAR - 156, 7, '#ffd43b'); circ(c, x + 78, FAR - 156, 7, '#ffd43b');
  }

  function crossStreets(c, vw, camX, part) {
    const xs = [];
    if (li > 0) xs.push(0 - camX);
    if (!lastLeg()) xs.push(leg().len - camX);
    xs.forEach((x) => {
      if (x < -200 || x > vw + 200) return;
      if (part === 'far') {
        c.fillStyle = '#4a4f57';
        c.beginPath(); c.moveTo(x - 80, ROAD_T); c.lineTo(x - 50, 150); c.lineTo(x + 50, 150); c.lineTo(x + 80, ROAD_T); c.fill();
        c.strokeStyle = '#ffd43b'; c.lineWidth = 3; c.setLineDash([16, 14]);
        c.beginPath(); c.moveTo(x, ROAD_T); c.lineTo(x, 155); c.stroke(); c.setLineDash([]);
      } else {
        c.fillStyle = '#4a4f57'; c.fillRect(x - 80, ROAD_B, 160, VIEW_H - ROAD_B + 10);
      }
    });
  }

  function farSidewalk(c, vw) {
    c.fillStyle = '#d6cfc4'; c.fillRect(-10, FAR, vw + 20, ROAD_T - FAR);
    c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 1;
    for (let y = FAR + 9; y < ROAD_T; y += 9) { c.beginPath(); c.moveTo(-10, y); c.lineTo(vw + 10, y); c.stroke(); }
    c.fillStyle = '#adb5bd'; c.fillRect(-10, ROAD_T - 5, vw + 20, 5);
  }
  function nearSidewalk(c, vw) {
    c.fillStyle = '#adb5bd'; c.fillRect(-10, ROAD_B, vw + 20, 7);
    c.fillStyle = '#cfc6b8'; c.fillRect(-10, ROAD_B + 7, vw + 20, VIEW_H - ROAD_B);
    c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 1;
    for (let y = ROAD_B + 18; y < VIEW_H; y += 12) { c.beginPath(); c.moveTo(-10, y); c.lineTo(vw + 10, y); c.stroke(); }
  }

  function road(c, vw, camX) {
    c.fillStyle = '#4a4f57'; c.fillRect(-10, ROAD_T, vw + 20, ROAD_B - ROAD_T);
    const off = ((camX % 60) + 60) % 60;
    // vạch chia làn + vạch vàng đôi giữa đường
    c.fillStyle = '#f1f3f5';
    for (let x = -off; x < vw + 60; x += 60) { c.fillRect(x, 432, 30, 3); c.fillRect(x, 540, 30, 3); }
    c.fillStyle = '#fcc419'; c.fillRect(-10, 481, vw + 20, 3); c.fillRect(-10, 487, vw + 20, 3);
    // vạch dừng + vạch qua đường ở ngã tư
    const zebra = (x) => { c.fillStyle = 'rgba(255,255,255,.92)'; for (let y = ROAD_T + 6; y < ROAD_B - 6; y += 20) c.fillRect(x, y, 44, 11); };
    if (!lastLeg()) {
      const sx = stopX() - camX, ix = leg().len - camX;
      if (ix > -300 && ix < vw + 300) {
        c.fillStyle = '#3d424a'; c.fillRect(ix - 80, ROAD_T, 160, ROAD_B - ROAD_T);
        zebra(sx + 12); zebra(ix + 90);
        c.fillStyle = '#fff'; c.fillRect(sx, 488, 6, ROAD_B - 492);
      }
    }
    if (li > 0 && camX < 300) { const ix = -camX; c.fillStyle = '#3d424a'; c.fillRect(ix - 80, ROAD_T, 160, ROAD_B - ROAD_T); zebra(ix + 90); }
  }

  function trafficPole(c, x) {
    const L = light(leg());
    c.fillStyle = '#343a40'; c.fillRect(x - 3, 270, 6, ROAD_T - 270);
    c.fillStyle = '#212529'; rr(c, x - 16, 196, 32, 78, 7); c.fill();
    [['r', '#ff3b30', 210], ['y', '#ffcc00', 234], ['g', '#2fe36b', 258]].forEach(([s, col, y]) => {
      circ(c, x, y, 9, L.s === s ? col : '#495057');
      if (L.s === s) { c.globalAlpha = 0.35; circ(c, x, y, 16, col); c.globalAlpha = 1; }
    });
    // đồng hồ đếm ngược
    c.fillStyle = '#111'; rr(c, x + 18, 216, 34, 26, 5); c.fill();
    c.fillStyle = L.s === 'r' ? '#ff6b6b' : L.s === 'y' ? '#ffd43b' : '#51cf66';
    c.font = '900 18px ui-monospace, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(String(L.left).padStart(2, '0'), x + 35, 230);
  }

  function streetSign(c, x, e) {
    if (x < -150 || x > viewW() + 150) return;
    c.fillStyle = '#868e96'; c.fillRect(x - 3, 250, 6, ROAD_T - 250);
    c.fillStyle = '#1864ab'; rr(c, x - 78, 200, 156, 56, 6); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 3; rr(c, x - 74, 204, 148, 48, 4); c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    fitText(c, e.name.toUpperCase(), x, 222, 136, 17);
    c.font = '700 10px system-ui, sans-serif'; c.fillText(e.dist.toUpperCase(), x, 242);
  }

  function sideItem(c, s, x) {
    const r = rng(s.seed);
    if (s.kind === 'tree') {
      c.fillStyle = '#7c5a3a'; c.fillRect(x - 5, 250, 10, 112);
      c.fillStyle = '#e9ecef'; c.fillRect(x - 5, 330, 10, 22);
      const g = pick(r, ['#2f9e44', '#37b24d', '#2b8a3e']);
      circ(c, x, 232, 40, g); circ(c, x - 30, 252, 28, g); circ(c, x + 30, 250, 30, g);
      circ(c, x - 10, 214, 22, 'rgba(255,255,255,.12)');
      return;
    }
    // xe máy đỗ trên vỉa hè
    for (let i = 0; i < 3; i++) { c.save(); c.translate(x + i * 30, 360); c.scale(0.55, 0.55); moto(c, 0, 0, { kind: pick(r, ['cub', 'scooter']), body: pick(r, ['#e03131', '#f8f9fa', '#212529', '#1c7ed6']) }); c.restore(); }
  }

  function wires(c, xs) {
    c.strokeStyle = 'rgba(30,30,30,.75)'; c.lineWidth = 1.4;
    xs.forEach((x) => { c.fillStyle = '#868e96'; c.fillRect(x - 3, 150, 6, ROAD_T - 150); c.fillRect(x - 16, 160, 32, 4); });
    for (let i = 0; i + 1 < xs.length; i++) {
      const a = xs[i], b = xs[i + 1];
      for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(a, 160 + k * 3); c.quadraticCurveTo((a + b) / 2, 186 + k * 4, b, 160 + k * 3); c.stroke(); }
    }
  }

  /** Đường sắt trên cao (tuyến Nhổn – ga Hà Nội chạy dọc Cầu Giấy, Xuân Thủy, Hồ Tùng Mậu) */
  function metro(c, vw, camX, night) {
    const off = ((camX * 0.92) % 260 + 260) % 260;
    c.fillStyle = night > 0.5 ? '#6c7a91' : '#ced4da';
    for (let x = -off; x < vw + 260; x += 260) { c.fillRect(x - 12, 290, 24, ROAD_T - 290); c.fillRect(x - 30, 280, 60, 14); }
    c.fillStyle = night > 0.5 ? '#868e96' : '#dee2e6'; c.fillRect(-10, 262, vw + 20, 22);
    c.fillStyle = '#adb5bd'; c.fillRect(-10, 282, vw + 20, 4);
    if (trainX === null) trainX = Math.random() < 0.5 ? vw + 600 : null;
    if (trainX !== null) {
      trainX -= 9;
      for (let i = 0; i < 4; i++) {
        const x = trainX + i * 152;
        c.fillStyle = '#f8f9fa'; rr(c, x, 220, 148, 42, 10); c.fill();
        c.fillStyle = '#e03131'; c.fillRect(x, 248, 148, 5);
        c.fillStyle = night > 0.5 ? '#ffe066' : '#364fc7'; for (let w = 0; w < 5; w++) c.fillRect(x + 10 + w * 27, 228, 18, 14);
      }
      if (trainX < -700) trainX = null;
    }
  }

  function frontItem(c, f, x) {
    const r = rng(f.seed), y = VIEW_H - 18;
    if (f.kind === 'stall') return stall(c, f, x, y);
    if (f.kind === 'planter') {
      c.fillStyle = '#868e96'; rr(c, x - 34, y - 26, 68, 26, 4); c.fill();
      circ(c, x - 16, y - 32, 14, '#40c057'); circ(c, x + 4, y - 38, 16, '#2f9e44'); circ(c, x + 20, y - 30, 12, '#51cf66');
      if (r() < 0.5) [[-12, -42], [10, -48], [22, -36]].forEach(([dx, dy]) => circ(c, x + dx, y + dy, 3.5, pick(r, ['#ff6b6b', '#ffd43b', '#f783ac'])));
      return;
    }
    if (f.kind === 'bikes') {
      for (let i = 0; i < 2; i++) { c.save(); c.translate(x + i * 34 - 16, y); c.scale(0.62, 0.62); moto(c, 0, 0, { kind: pick(r, ['cub', 'scooter', 'electric']), body: pick(r, ['#e03131', '#f8f9fa', '#212529', '#1c7ed6', '#fab005']) }); c.restore(); }
      return;
    }
    if (f.kind === 'lamp') {
      c.fillStyle = '#495057'; c.fillRect(x - 3, ROAD_B - 70, 6, y - ROAD_B + 70);
      c.fillRect(x - 3, ROAD_B - 70, 30, 5);
      c.fillStyle = '#ffe066'; rr(c, x + 18, ROAD_B - 66, 16, 7, 3); c.fill();
      f.glow = [x + 26, ROAD_B - 58];
      return;
    }
    c.fillStyle = '#2b8a3e'; rr(c, x - 12, y - 34, 24, 34, 4); c.fill();
    c.fillStyle = '#237032'; c.fillRect(x - 14, y - 36, 28, 6);
  }

  /** Quán vỉa hè: ô dù, ghế nhựa, bàn thấp, biển tên */
  function stall(c, f, x, y) {
    const food = (DATA.STREET_FOOD || []).find((q) => q.id === f.food);
    if (!food) return;
    const r = rng(f.seed);
    // ghế nhựa + bàn thấp
    for (let i = 0; i < 4; i++) { c.fillStyle = pick(r, ['#e03131', '#1c7ed6', '#2f9e44']); rr(c, x - 60 + i * 34, y - 16, 16, 16, 3); c.fill(); }
    c.fillStyle = '#e9ecef'; rr(c, x - 44, y - 30, 70, 8, 3); c.fill();
    c.fillStyle = '#adb5bd'; c.fillRect(x - 40, y - 22, 4, 14); c.fillRect(x + 18, y - 22, 4, 14);
    c.font = '15px "Segoe UI Emoji", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(food.items[0], x - 24, y - 37); c.fillText(food.items[1] || food.items[0], x + 6, y - 37);
    // ô dù
    c.fillStyle = '#6c757d'; c.fillRect(x + 36, y - 64, 4, 64);
    c.fillStyle = food.umb; c.beginPath(); c.moveTo(x - 10, y - 58); c.quadraticCurveTo(x + 38, y - 84, x + 86, y - 58); c.closePath(); c.fill();
    // biển tên quán
    c.fillStyle = food.signBg; rr(c, x - 78, y - 66, 74, 20, 4); c.fill();
    c.fillStyle = food.signFg; fitText(c, food.name.toUpperCase(), x - 41, y - 56, 68, 10);
    c.fillStyle = '#ffe066'; c.font = '13px "Segoe UI Emoji", system-ui'; c.fillText(food.logo, x - 41, y - 76);
  }

  function nightPass(c, vw, camX, night, sc, lx) {
    c.fillStyle = `rgba(8,14,40,${0.48 * night})`; c.fillRect(-10, -10, vw + 20, VIEW_H + 20);
    c.globalCompositeOperation = 'lighter';
    // đèn đường, đèn xe, cửa hàng sáng
    sc.front.forEach((f) => { if (f.kind !== 'lamp') return; const x = lx(f.ex) + 26; if (x < -100 || x > vw + 100) return; const g = c.createRadialGradient(x, ROAD_B - 58, 4, x, ROAD_B - 30, 130); g.addColorStop(0, `rgba(255,220,130,${0.5 * night})`); g.addColorStop(1, 'rgba(255,220,130,0)'); c.fillStyle = g; c.fillRect(x - 140, ROAD_B - 190, 280, 260); });
    sc.far.forEach((b) => { const x = lx(b.ex); if (x < -150 || x > vw + 150 || b.kind === 'field') return; c.fillStyle = `rgba(255,200,90,${0.18 * night})`; c.fillRect(x - b.w / 2 + 10, FAR - 56, b.w - 20, 56); });
    const beam = (x, y, d) => { const g = c.createLinearGradient(x, y, x + d * 150, y); g.addColorStop(0, `rgba(255,245,200,${0.45 * night})`); g.addColorStop(1, 'rgba(255,245,200,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + d * 150, y - 22); c.lineTo(x + d * 150, y + 14); c.closePath(); c.fill(); };
    npcs.forEach((n) => { const x = n.x - camX, d = n.opp ? -1 : 1; beam(x + d * n.len / 2, LANE_Y[n.lane] - 26, d); });
    beam(me.x - camX + me.len / 2, me.ly - (bike || veh === 'xeom' ? 44 : 28), 1);
    c.globalCompositeOperation = 'source-over';
  }

  function rain(c, vw) {
    const lv = AV.rainLevel ? Math.min(1, AV.rainLevel()) : 0;
    if (lv <= 0.02) return;
    c.fillStyle = `rgba(30,40,60,${0.18 * lv})`; c.fillRect(-10, -10, vw + 20, VIEW_H + 20);
    c.strokeStyle = 'rgba(200,220,255,.55)'; c.lineWidth = 1.5;
    const n = Math.floor(120 * lv), t = clock * 900;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const x = ((i * 137.5 + t * 0.35) % (vw + 100)) - 50, y = ((i * 71.3 + t) % (VIEW_H + 60)) - 30;
      c.moveTo(x, y); c.lineTo(x - 7, y + 20);
    }
    c.stroke();
  }

  /* ---------- Xe cộ ---------- */
  function wheel(c, x, y, r) {
    circ(c, x, y, r, '#212529'); circ(c, x, y, r * 0.5, '#adb5bd'); circ(c, x, y, r * 0.18, '#495057');
  }

  /** Xe máy nhìn ngang, đầu xe bên phải. y = mặt đường */
  function moto(c, x, y, m, riderFn) {
    const body = m.body || '#e03131';
    wheel(c, x - 26, y - 11, 11); wheel(c, x + 28, y - 11, 11);
    c.strokeStyle = '#868e96'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x + 22, y - 50); c.lineTo(x + 28, y - 11); c.stroke();
    if (riderFn) riderFn();
    // thân xe
    c.fillStyle = body;
    if (m.kind === 'vespa') {
      c.beginPath(); c.ellipse(x - 20, y - 26, 24, 15, 0, 0, Math.PI * 2); c.fill();
      rr(c, x - 10, y - 22, 34, 9, 4); c.fill();
      c.beginPath(); c.moveTo(x + 12, y - 18); c.quadraticCurveTo(x + 18, y - 52, x + 26, y - 54); c.lineTo(x + 30, y - 18); c.closePath(); c.fill();
      c.fillStyle = '#7c4a2a'; rr(c, x - 38, y - 44, 36, 9, 5); c.fill();
    } else {
      rr(c, x - 12, y - 22, 34, 9, 4); c.fill();
      c.beginPath(); c.ellipse(x - 22, y - 30, m.kind === 'cub' ? 18 : 22, m.kind === 'cub' ? 9 : 12, -0.1, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(x + 10, y - 18); c.lineTo(x + 20, y - 54); c.lineTo(x + 28, y - 52); c.lineTo(x + 24, y - 18); c.closePath(); c.fill();
      c.fillStyle = '#212529'; rr(c, x - 40, y - 44, 36, 8, 4); c.fill();
      if (m.kind === 'cub') { c.fillStyle = '#495057'; rr(c, x - 8, y - 22, 18, 12, 3); c.fill(); }
      if (m.kind === 'electric') { c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(x - 30, y - 34, 18, 3); }
    }
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - 32, y - 36, 14, 3);
    // tay lái, đèn pha, đèn hậu
    c.strokeStyle = '#212529'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 20, y - 54); c.lineTo(x + 12, y - 62); c.stroke();
    circ(c, x + 28, y - 50, 4.5, '#fff3bf');
    c.fillStyle = '#e03131'; c.fillRect(x - 44, y - 34, 5, 5);
  }

  /** Người lái xe máy (NPC): áo khoác chống nắng + mũ bảo hiểm */
  function npcRider(c, x, y, n, back = 0) {
    const bx = x - 10 - back;
    c.fillStyle = '#495057'; rr(c, bx - 6, y - 40, 14, 18, 4); c.fill();
    c.fillStyle = n.jacket; rr(c, bx - 9, y - 66, 20, 30, 7); c.fill();
    c.strokeStyle = n.jacket; c.lineWidth = 5; c.beginPath(); c.moveTo(bx + 6, y - 58); c.lineTo(x + 14, y - 60); c.stroke();
    circ(c, bx + 1, y - 74, 9, '#ffd8b5');
    c.fillStyle = n.helmet; c.beginPath(); c.arc(bx + 1, y - 76, 10.5, Math.PI, 0); c.fill();
    c.fillRect(bx - 10, y - 77, 22, 3);
  }

  function car(c, x, y, n) {
    const L = n.len;
    if (n.kind === 'bus') {
      c.fillStyle = '#f59f00'; rr(c, x - L / 2, y - 98, L, 86, 12); c.fill();
      c.fillStyle = '#e03131'; c.fillRect(x - L / 2, y - 44, L, 10);
      c.fillStyle = '#343a40'; for (let i = 0; i < 6; i++) c.fillRect(x - L / 2 + 14 + i * 42, y - 88, 34, 26);
      c.fillStyle = '#495057'; c.fillRect(x + L / 2 - 46, y - 70, 24, 56);
      wheel(c, x - L * 0.32, y - 13, 14); wheel(c, x + L * 0.3, y - 13, 14);
      return;
    }
    if (n.kind === 'truck') {
      c.fillStyle = '#dee2e6'; rr(c, x - L / 2, y - 96, L - 58, 80, 6); c.fill();
      c.fillStyle = '#adb5bd'; c.fillRect(x - L / 2, y - 22, L - 58, 6);
      c.fillStyle = n.color === '#f8f9fa' ? '#1c7ed6' : n.color; rr(c, x + L / 2 - 56, y - 74, 56, 60, 8); c.fill();
      c.fillStyle = '#343a40'; rr(c, x + L / 2 - 32, y - 68, 26, 22, 4); c.fill();
      wheel(c, x - L * 0.32, y - 13, 13); wheel(c, x - L * 0.12, y - 13, 13); wheel(c, x + L * 0.34, y - 13, 13);
      return;
    }
    const h = n.kind === 'suv' ? 66 : 56;
    c.fillStyle = n.color;
    rr(c, x - L / 2, y - 40, L, 28, 9); c.fill();
    c.beginPath(); c.moveTo(x - L * 0.38, y - 38); c.lineTo(x - L * 0.26, y - h); c.lineTo(x + L * 0.12, y - h); c.lineTo(x + L * 0.3, y - 38); c.closePath(); c.fill();
    c.fillStyle = '#2b3a4a';
    c.beginPath(); c.moveTo(x - L * 0.33, y - 40); c.lineTo(x - L * 0.24, y - h + 5); c.lineTo(x - L * 0.05, y - h + 5); c.lineTo(x - L * 0.05, y - 40); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x - L * 0.01, y - 40); c.lineTo(x - L * 0.01, y - h + 5); c.lineTo(x + L * 0.1, y - h + 5); c.lineTo(x + L * 0.24, y - 40); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x - L / 2 + 8, y - 34, L - 16, 3);
    c.fillStyle = '#fff3bf'; rr(c, x + L / 2 - 10, y - 36, 10, 7, 3); c.fill();
    c.fillStyle = '#e03131'; rr(c, x - L / 2, y - 36, 7, 7, 2); c.fill();
    if (n.kind === 'taxi') {
      c.fillStyle = '#0b7f86'; c.fillRect(x - L / 2 + 6, y - 22, L - 12, 5);
      c.fillStyle = '#fff'; rr(c, x - 22, y - h - 12, 44, 13, 4); c.fill();
      c.fillStyle = '#00a3a8'; rr(c, x - 20, y - h - 10, 40, 9, 3); c.fill();
    }
    wheel(c, x - L * 0.3, y - 12, 12); wheel(c, x + L * 0.3, y - 12, 12);
  }
  /** Chữ trên xe (vẽ sau khi lật hình để chữ không bị ngược) */
  function carLabel(c, x, y, n) {
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (n.kind === 'taxi') {
      const h = 56;
      c.fillStyle = '#fff'; c.font = '900 7px system-ui, sans-serif'; c.fillText('XANH SM', x, y - h - 5.5);
      c.font = '900 11px system-ui, sans-serif'; c.fillText('Xanh SM', x, y - 26);
    } else if (n.kind === 'bus') {
      c.fillStyle = '#fff'; c.font = '900 14px system-ui, sans-serif'; c.fillText(`BUÝT ${n.route}`, x, y - 25);
    }
  }

  function drawNpc(c, n, x) {
    const y = LANE_Y[n.lane], d = n.opp ? -1 : 1;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y - 1, n.len * 0.48, 5, 0, 0, Math.PI * 2); c.fill();
    c.translate(x, 0); c.scale(d, 1); c.translate(-x, 0);
    if (n.kind === 'moto') {
      moto(c, x, y, { kind: n.model, body: n.color }, () => { if (n.pillion) npcRider(c, x - 18, y, { jacket: pick(rng(n.vmax | 0), JACKETS), helmet: '#fff' }); npcRider(c, x, y, n); });
    } else car(c, x, y, n);
    c.restore();
    carLabel(c, x, y, n);
  }

  /** Xe của người chơi (mình hoặc người khác): taxi Xanh SM có mình ngồi sau, hoặc xe máy tự lái */
  /** Ô tô VinFast tự lái: thân xe màu, logo V, người chơi ngồi ghế lái */
  function vfCar(c, x, y, car, look, t) {
    const L = car.len, h = car.id === 'vf3' ? 60 : 64;
    c.fillStyle = car.body;
    rr(c, x - L / 2, y - 42, L, 30, 10); c.fill();
    c.beginPath(); c.moveTo(x - L * 0.42, y - 40); c.quadraticCurveTo(x - L * 0.36, y - h, x - L * 0.2, y - h); c.lineTo(x + L * 0.12, y - h); c.quadraticCurveTo(x + L * 0.26, y - h + 2, x + L * 0.36, y - 40); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(x - L / 2 + 8, y - 36, L - 16, 3);
    c.fillStyle = '#1b2a38';
    c.beginPath(); c.moveTo(x - L * 0.36, y - 41); c.quadraticCurveTo(x - L * 0.32, y - h + 6, x - L * 0.19, y - h + 6); c.lineTo(x - L * 0.04, y - h + 6); c.lineTo(x - L * 0.04, y - 41); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x, y - 41); c.lineTo(x, y - h + 6); c.lineTo(x + L * 0.11, y - h + 6); c.quadraticCurveTo(x + L * 0.22, y - h + 8, x + L * 0.3, y - 41); c.closePath(); c.fill();
    // người lái
    c.save(); c.beginPath(); c.moveTo(x, y - 41); c.lineTo(x, y - h + 6); c.lineTo(x + L * 0.11, y - h + 6); c.quadraticCurveTo(x + L * 0.22, y - h + 8, x + L * 0.3, y - 41); c.closePath(); c.clip();
    if (look) ART.character(c, x + L * 0.1, y - 16, look, { scale: 0.5, t, dir: 1 });
    c.restore();
    // đèn LED chữ V đặc trưng + logo
    c.strokeStyle = '#e7f5ff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + L / 2 - 16, y - 36); c.lineTo(x + L / 2 - 6, y - 30); c.lineTo(x + L / 2 - 2, y - 36); c.stroke();
    c.fillStyle = '#ff6b6b'; c.fillRect(x - L / 2, y - 36, 6, 5);
    c.fillStyle = car.body === '#212529' ? '#ced4da' : '#1b2a38'; c.font = '900 9px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('VINFAST', x - L * 0.1, y - 24);
    wheel(c, x - L * 0.3, y - 12, 13); wheel(c, x + L * 0.3, y - 12, 13);
  }
  function drawPlayerVeh(c, x, y, v, look, t, d, name, mine) {
    const evCar = (DATA.CARS || []).find((q) => q.id === v);
    if (evCar) {
      c.save();
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y - 1, evCar.len * 0.5, 6, 0, 0, Math.PI * 2); c.fill();
      c.translate(x, 0); c.scale(d, 1); c.translate(-x, 0);
      vfCar(c, x, y, evCar, look, t);
      c.restore();
      const top = y - 86;
      c.font = '800 13px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const w = c.measureText(name).width + 14;
      c.fillStyle = mine ? 'rgba(47,158,68,.92)' : 'rgba(27,47,72,.85)'; rr(c, x - w / 2, top - 11, w, 20, 8); c.fill();
      c.fillStyle = '#fff'; c.fillText(name, x, top - 1);
      return;
    }
    if (v === 'xeom') {
      // 🛵 xe ôm: tài xế áo xanh lái, khách ngồi sau, cả hai đội mũ bảo hiểm
      const xb = { kind: 'cub', body: '#00b14f' };
      c.save();
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y - 1, 44, 6, 0, 0, Math.PI * 2); c.fill();
      c.translate(x, 0); c.scale(d, 1); c.translate(-x, 0);
      moto(c, x, y, xb, () => {
        const helmet = (hx, col) => { c.fillStyle = col; c.beginPath(); c.arc(hx, y - 61, 16.5, Math.PI * 1.02, -0.02); c.fill(); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(hx - 16, y - 62, 32, 3); };
        ART.character(c, x - 24, y - 27, look, { scale: 0.58, t, dir: 1 }); helmet(x - 24, '#fff');
        ART.character(c, x - 2, y - 25, XEOM_DRIVER, { scale: 0.62, t, dir: 1 }); helmet(x - 2, '#00b14f');
        c.strokeStyle = XEOM_DRIVER.skin; c.lineWidth = 4; c.beginPath(); c.moveTo(x + 4, y - 42); c.lineTo(x + 18, y - 60); c.stroke();
      });
      c.restore();
      const top = y - 86;
      c.font = '800 13px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const w = c.measureText(name).width + 14;
      c.fillStyle = mine ? 'rgba(47,158,68,.92)' : 'rgba(27,47,72,.85)'; rr(c, x - w / 2, top - 11, w, 20, 8); c.fill();
      c.fillStyle = '#fff'; c.fillText(name, x, top - 1);
      return;
    }
    const b = HIRED.includes(v) ? null : (DATA.BIKES || []).find((q) => q.id === v) || DATA.BIKES[0];
    c.save();
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y - 1, b ? 40 : 74, 6, 0, 0, Math.PI * 2); c.fill();
    c.translate(x, 0); c.scale(d, 1); c.translate(-x, 0);
    let top;
    if (b) {
      moto(c, x, y, b, () => {
        ART.character(c, x - 8, y - 25, look, { scale: 0.62, t, dir: 1 });
        c.fillStyle = b.helmet || '#fff';
        c.beginPath(); c.arc(x - 8, y - 61, 16.5, Math.PI * 1.02, -0.02); c.fill();
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 24, y - 62, 32, 3);
        c.strokeStyle = look.skin || '#ffd8b5'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 2, y - 42); c.lineTo(x + 14, y - 60); c.stroke();
      });
      top = y - 84;
    } else {
      const n = v === 'vip' ? { kind: 'sedan', len: 150, color: '#212529' } : { kind: 'taxi', len: 150, color: '#00b8b8' };
      car(c, x, y, n);
      // khách ngồi ghế sau + tài xế áo xanh
      c.save();
      c.beginPath(); c.moveTo(x - 150 * 0.33, y - 40); c.lineTo(x - 150 * 0.24, y - 51); c.lineTo(x - 150 * 0.05, y - 51); c.lineTo(x - 150 * 0.05, y - 40); c.closePath(); c.clip();
      ART.character(c, x - 22, y - 14, look, { scale: 0.5, t, dir: 1 });
      c.restore();
      c.save();
      c.beginPath(); c.moveTo(x - 1, y - 40); c.lineTo(x - 1, y - 51); c.lineTo(x + 15, y - 51); c.lineTo(x + 36, y - 40); c.closePath(); c.clip();
      circ(c, x + 12, y - 46, 7, '#ffd8b5'); c.fillStyle = '#0ca678'; c.fillRect(x + 4, y - 40, 16, 8); c.fillStyle = '#212529'; c.fillRect(x + 5, y - 54, 14, 4);
      c.restore();
      top = y - 92;
    }
    c.restore();
    if (!b && v !== 'vip') carLabel(c, x, y, { kind: 'taxi' });
    // bảng tên trên đầu
    c.font = '800 13px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(name).width + 14;
    c.fillStyle = mine ? 'rgba(47,158,68,.92)' : 'rgba(27,47,72,.85)'; rr(c, x - w / 2, top - 11, w, 20, 8); c.fill();
    c.fillStyle = '#fff'; c.fillText(name, x, top - 1);
  }

  /** Ảnh xem trước xe máy / ô tô trong cửa hàng */
  function preview(canvas, bikeId, look) {
    const car = (DATA.CARS || []).find((q) => q.id === bikeId);
    if (car) {
      const g = canvas.getContext('2d'), d = Math.min(2, devicePixelRatio || 1);
      const w = canvas.clientWidth || 120, h = canvas.clientHeight || 90;
      canvas.width = w * d; canvas.height = h * d;
      const k = Math.min(w / (car.len + 30), h / 80);
      g.setTransform(d * k, 0, 0, d * k, d * w / 2, d * (h - 6));
      vfCar(g, 0, 0, car, look, 0);
      return;
    }
    const b = (DATA.BIKES || []).find((q) => q.id === bikeId);
    if (!b) return;
    const g = canvas.getContext('2d'), d = Math.min(2, devicePixelRatio || 1);
    const w = canvas.clientWidth || 120, h = canvas.clientHeight || 90;
    canvas.width = w * d; canvas.height = h * d;
    g.setTransform(d * 0.95, 0, 0, d * 0.95, d * w / 2, d * (h - 6));
    moto(g, 0, 0, b, look ? () => {
      ART.character(g, -8, -25, look, { scale: 0.62, t: 0, dir: 1 });
      g.fillStyle = b.helmet || '#fff'; g.beginPath(); g.arc(-8, -61, 16.5, Math.PI * 1.02, -0.02); g.fill();
    } : null);
  }

  return {
    start, frame, onNet, info, zoneOf, preview, batNeed,
    drawCar: (c, x, y, id, look) => { const car = (DATA.CARS || []).find((q) => q.id === id); if (car) vfCar(c, x, y, car, look, 0); },
    get active() { return active; },
    canRide: (fromMap, to) => !!(zoneOf(fromMap) && SPOTS[to] && zoneOf(fromMap) !== to),
    _debug: () => ({ li, x: me && me.x, v: me && me.v, phase, light: legs && !lastLeg() ? light(leg()).s : '-', stop: legs && !lastLeg() ? stopX() : 0, legs: legs && legs.map((l) => `${l.e.id}:${l.from}->${l.to}`), npcs: npcs.length, others: others.size }),
  };
})();
