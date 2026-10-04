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
      look: { skin: DATA.SKINS[0], hair: 'short', hairColor: DATA.HAIR_COLORS[0], shirt: DATA.SHIRT_COLORS[5], shirtStyle: 'plain', pants: DATA.PANTS_COLORS[0], hat: 'none', pet: 'none' },
      coins: 50, xp: 0, level: 1,
      inv: { seed_wheat: 6, seed_carrot: 3, wheat: 3 },
      owned: { hats: ['none'], shirtStyles: ['plain'], pets: ['none'] },
      tiles: Array.from({ length: 48 }, () => ({ crop: null, plantedAt: 0, watered: false })),
      beds: [true, false, false, false],
      coop: { fedAt: 0 },
      pen: { fedAt: 0 },
      map: 'farm', x: null, y: null,
      settings: { pixelArt: false },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        const d = defaultState();
        if (!s.tiles) {
          // chuyển dữ liệu từ ruộng cũ (10 ô) sang luống mới
          s.tiles = d.tiles;
          (s.plots || []).forEach((p, i) => { if (p && p.crop && i < 12) s.tiles[i] = { crop: p.crop, plantedAt: p.plantedAt, watered: true }; });
          s.beds = [true, (s.plots || []).filter((p) => p && p.unlocked).length > 6, false, false];
        }
        return { ...d, ...s, look: { ...d.look, ...s.look }, owned: { ...d.owned, ...s.owned }, settings: { ...d.settings, ...s.settings } };
      }
    } catch (e) { /* dùng dữ liệu mặc định */ }
    return defaultState();
  }

  const S = load();
  AV.S = S;

  const maps = {};
  Object.keys(MAPS).forEach((id) => { maps[id] = MAPS[id](); });
  let map = maps.farm;

  function saveNow() {
    if (map) { S.map = map.id; }
    if (!player.hidden) { S.x = Math.round(player.x); S.y = Math.round(player.y); }
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ }
  }

  /* ---------- Thực thể ---------- */
  const player = { x: 0, y: 0, dir: 1, moving: false, t: 0, target: null, pending: null, hidden: false, bubble: null, stuck: 0, dancing: 0 };
  const myPet = { x: 0, y: 0, dir: 1, t: 0, moving: false };
  const bus = { x: -999, state: 'away', timer: 5, v: 0, carrying: false, wantsBoard: false, dest: 'town' };
  const floats = [];
  const fade = { a: 0, mode: null };
  let marker = null;
  let hover = null;
  let now = Date.now();
  let clock = 0;

  function enterMap(id, x, y) {
    if (map && map.id !== id) { map.ground = null; }
    map = maps[id];
    player.x = x ?? map.spawn.x;
    player.y = y ?? map.spawn.y;
    if (blocked(player.x, player.y)) { player.x = map.spawn.x; player.y = map.spawn.y; }
    player.target = null;
    player.pending = null;
    myPet.x = player.x - 30; myPet.y = player.y + 3;
    UI.setLocation(map.name);
    NET.enter(id);
  }

  /* ---------- Va chạm ---------- */
  function blocked(x, y) {
    const b = map.bounds;
    if (x < b.l || x > b.r || y < b.t || y > b.b) return true;
    for (const c of map.colliders) {
      if (x > c.x - 9 && x < c.x + c.w + 9 && y > c.y - 4 && y < c.y + c.h + 4) return true;
    }
    return false;
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

  function changed() {
    saveNow();
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

  AV.buyWear = (kind, id) => {
    const list = kind === 'hat' ? DATA.HATS : DATA.SHIRT_STYLES;
    const it = list.find((x) => x.id === id);
    if (it.lvl && S.level < it.lvl) return UI.toast(`Cần đạt cấp ${it.lvl}`);
    if (S.coins < it.price) return UI.toast('Không đủ xu 😢');
    S.coins -= it.price;
    (kind === 'hat' ? S.owned.hats : S.owned.shirtStyles).push(id);
    AV.wear(kind, id);
    UI.toast(`Đã mua ${it.name} ✨`);
  };

  AV.wear = (kind, id) => {
    if (kind === 'hat') S.look.hat = id; else S.look.shirtStyle = id;
    changed();
  };

  /* ---------- Ruộng: 4 luống × 12 ô, cây khát nước phải tưới ---------- */
  const TPB = DATA.TILES_PER_BED;
  const bedOf = (i) => Math.floor(i / TPB);
  const bedTiles = (bed) => S.tiles.slice(bed * TPB, bed * TPB + TPB);

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
    if (!S.beds[bed]) return null;
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

  function waterBed(bed) {
    let n = 0;
    bedTiles(bed).forEach((t) => {
      const st = tileState(t);
      if (!st.thirsty) return;
      const total = DATA.CROPS[t.crop].time * 1000;
      t.plantedAt += now - (t.plantedAt + DATA.THIRSTY_AT * total);
      t.watered = true;
      n++;
    });
    if (n) {
      addXP(Math.ceil(n / 3));
      float(`💧 Tưới ${n} cây`, player.x, player.y - 110, '#a5d8ff');
      changed();
    }
    return n;
  }

  function harvestBed(bed) {
    const got = {};
    let xp = 0;
    bedTiles(bed).forEach((t) => {
      if (tileState(t).stage !== 2) return;
      const c = DATA.CROPS[t.crop];
      got[t.crop] = (got[t.crop] || 0) + c.yield;
      xp += c.xp;
      t.crop = null; t.plantedAt = 0; t.watered = false;
    });
    const keys = Object.keys(got);
    if (!keys.length) return false;
    keys.forEach((k) => addItem(k, got[k]));
    addXP(xp);
    float(keys.map((k) => `+${got[k]} ${DATA.CROPS[k].icon}`).join('  '), player.x, player.y - 110);
    changed();
    return true;
  }

  AV.useTile = (i) => {
    const bed = bedOf(i);
    if (!S.beds[bed]) {
      const price = DATA.BED_PRICES[bed];
      UI.confirm(`Mua luống ruộng này (12 ô) với giá <b>${price} xu</b>?`, 'Mua luống', () => {
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
    const c = DATA.CROPS[t.crop];
    UI.toast(`${c.icon} ${c.name} còn ${Math.ceil(st.left)}s nữa mới thu hoạch được`);
  };

  function plantTile(i, crop) {
    const key = 'seed_' + crop;
    if (!S.inv[key] || S.tiles[i].crop) return false;
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

  /* ---------- Chuồng trại ---------- */
  function farmBuilding(st, cfg, opts) {
    const t = Date.now();
    if (!st.fedAt) {
      if ((S.inv.wheat || 0) >= cfg.feed) {
        S.inv.wheat -= cfg.feed;
        st.fedAt = t;
        float(`-${cfg.feed} 🌾`, player.x, player.y - 100);
        UI.toast(`${opts.fedMsg} Quay lại sau ${cfg.time}s nhé!`);
        map.animals.filter((a) => opts.kinds.includes(a.kind)).forEach((a) => { a.wait = 0; a.bubble = { text: '❤️', until: t + 1800, big: true }; });
      } else {
        UI.toast(`Cần ${cfg.feed} 🌾 lúa mì để cho ăn (đang có ${S.inv.wheat || 0}). Trồng lúa mì ở Ruộng nhé!`, 3400);
      }
    } else if (t - st.fedAt >= cfg.time * 1000) {
      opts.collect();
      st.fedAt = 0;
      addXP(cfg.xp);
    } else {
      UI.toast(`${opts.waitMsg} còn ${Math.ceil(cfg.time - (t - st.fedAt) / 1000)}s`);
    }
    changed();
  }

  function buildingIndicator(st, cfg) {
    if (!st.fedAt) return '🌾';
    const prog = (now - st.fedAt) / (cfg.time * 1000);
    return prog >= 1 ? null : { p: prog, left: cfg.time - (now - st.fedAt) / 1000 };
  }

  AV.useCoop = () => farmBuilding(S.coop, DATA.COOP, {
    kinds: ['chicken'], fedMsg: 'Đã cho gà ăn! 🐔', waitMsg: 'Gà đang đẻ trứng…',
    collect: () => { addItem('egg', DATA.COOP.eggs); float(`+${DATA.COOP.eggs} 🥚`, player.x, player.y - 100); },
  });
  AV.coopIndicator = () => {
    const r = buildingIndicator(S.coop, DATA.COOP);
    return r === null ? '🥚' : r;
  };

  AV.usePen = () => farmBuilding(S.pen, DATA.PEN, {
    kinds: ['cow', 'sheep', 'pig'], fedMsg: 'Đã cho gia súc ăn! 🐄', waitMsg: 'Bò đang làm sữa…',
    collect: () => {
      addItem('milk', DATA.PEN.milk);
      addItem('wool', DATA.PEN.wool);
      float(`+${DATA.PEN.milk} 🥛  +${DATA.PEN.wool} 🧶`, player.x, player.y - 100);
    },
  });
  AV.penIndicator = () => {
    const r = buildingIndicator(S.pen, DATA.PEN);
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

  AV.useStage = () => {
    player.dancing = Date.now() + 10000;
    say(player, ['🎵 Quẩy lên nào!', '💃🕺', '🎶 La la la~', 'Cùng nhảy nhé! ✨'][Math.floor(Math.random() * 4)]);
    UI.toast('💃 Đang nhảy trên sân khấu! (10 giây)');
    NET.sendState();
  };

  AV.useFerris = () => {
    if (!AV.spend(5)) return;
    addXP(3);
    say(player, ['Ngắm cả thành phố từ trên cao, đẹp quá! 🎡', 'Woaa, thấy cả bãi biển luôn! 🌊', 'Gió mát ghê~ 🌤️'][Math.floor(Math.random() * 3)]);
    float('-5 💰', player.x, player.y - 100, '#ffd43b');
  };

  AV.buyIceCream = () => {
    if (!AV.spend(5)) return;
    addXP(2);
    say(player, ['🍦', '🍧', '🍨'][Math.floor(Math.random() * 3)]);
    UI.toast('Mát lạnh! 🍦 +2 XP');
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
    map.pickupTimer = 5 + Math.random() * 5;
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
    addXP(1);
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

  /* ---------- Xe buýt ---------- */
  const busStopX = () => map.busStop.x - 57;
  const destName = () => (maps[bus.dest] || maps.town).name;

  AV.useBusStop = () => UI.cityMap(true);
  AV.currentMap = () => map.id;

  /** Chọn điểm đến trên bản đồ thành phố: tự đi ra trạm và lên xe */
  AV.travelTo = (id) => {
    if (!maps[id]) return;
    if (id === map.id) return UI.toast(`Bạn đang ở ${map.name} rồi 😄`);
    if (player.hidden || bus.carrying) return;
    bus.dest = id;
    bus.wantsBoard = true;
    if (bus.state === 'away') bus.timer = 0;
    const st = map.busStop;
    if (Math.hypot(player.x - st.x, player.y - st.y) > 150) {
      player.target = { x: st.x + 44, y: st.y + 12 };
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
  AV.teleport = (id, showHelp) => {
    if (!maps[id] || fade.mode) return;
    fade.teleport = id;
    fade.afterHelp = !!showHelp;
    fade.mode = 'out';
  };

  function updateFade(dt) {
    if (fade.mode === 'out') {
      fade.a = Math.min(1, fade.a + dt * 2.5);
      if (fade.a >= 1 && fade.teleport) {
        const id = fade.teleport;
        fade.teleport = null;
        enterMap(id, maps[id].busStop.x + 50, maps[id].busStop.y + 12);
        player.hidden = false;
        fade.mode = 'in';
        UI.toast(`📍 Chào mừng tới ${map.name}!`);
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
    const near = map.npcs
      .map((n) => ({ n, d: Math.hypot(n.x - player.x, n.y - player.y) }))
      .filter((o) => o.d < 320)
      .sort((a, b) => a.d - b.d)[0];
    if (near) setTimeout(() => reply(near.n, text), 900 + Math.random() * 600);
  };

  function poke(e) {
    if (e.kind === 'remote') {
      UI.toast(`👤 ${e.name} · Cấp ${e.level}`);
      return;
    }
    if (e.kind === 'npc') {
      e.dir = player.x < e.x ? -1 : 1;
      e.wait = Math.max(e.wait, 3);
      e.moving = false;
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
    if (player.hidden) { player.moving = false; return; }
    let vx = 0, vy = 0;
    const kx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    const ky = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    if (!UI.isBlocking() && (kx || ky)) {
      const l = Math.hypot(kx, ky);
      vx = kx / l * SPEED; vy = ky / l * SPEED;
      player.target = null; player.pending = null; marker = null;
    } else if (player.target) {
      const dx = player.target.x - player.x, dy = player.target.y - player.y, d = Math.hypot(dx, dy);
      if (d < 4) { player.target = null; marker = null; }
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
        if (player.stuck > 0.35) { player.target = null; marker = null; }
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
    const nearPk = !player.hidden && map.pickups.find((p) => Math.hypot(p.x - player.x, p.y - player.y) < 20);
    if (nearPk) collectPickup(nearPk);
    updateBus(dt);
    NET.tick(dt);
    NET.update(dt);
    updateFade(dt);
    for (let i = floats.length - 1; i >= 0; i--) { floats[i].t += dt; if (floats[i].t > 1.4) floats.splice(i, 1); }
    if (marker) marker.t += dt;
  }

  /* ---------- Vẽ ---------- */
  let cam = { x: 0, y: 0 };

  function updateCamera() {
    const vw = W / ZOOM, vh = H / ZOOM;
    const tx = vw >= map.w ? map.w / 2 : Math.max(vw / 2, Math.min(map.w - vw / 2, player.x));
    const ty = vh >= map.h ? map.h / 2 : Math.max(vh / 2, Math.min(map.h - vh / 2, player.y - 150));
    cam.x = tx; cam.y = ty;
  }

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
    const gs = Math.max(1, Math.min(2, scale));
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
    ART.backdrop(g, map.w, map.hz, cam.x, clock, map.id === 'beach');
    const night = nightFactor();
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
      charDraw(n.x, n.y, n.look, n, n);
      if (n.petState) petDraw(n.petState, n.look.pet);
    });
    const others = NET.players().filter((r) => !r.hidden);
    others.forEach((r) => {
      charDraw(r.rx, r.ry, r.look, { t: r.t, dir: r.dir, moving: r.walking, dance: r.dance }, r);
      if (r.pet && r.look.pet && r.look.pet !== 'none') petDraw(r.pet, r.look.pet);
    });
    if (!player.hidden) {
      charDraw(player.x, player.y, S.look, { ...player, dance: player.dancing > now }, player);
      if (S.look.pet && S.look.pet !== 'none') petDraw(myPet, S.look.pet);
    }
    if (bus.state !== 'away' && bus.state !== 'travel') {
      list.push({ y: BUS_Y, draw: () => out((c) => ART.bus(c, bus.x, BUS_Y, clock, bus.state !== 'waiting'), bus.x, BUS_Y, BOX_BUS, bus, 70) });
    }
    list.sort((a, b) => a.y - b.y);
    list.forEach((o) => o.draw(g, clock));
    if (night > 0) {
      const vw = W / ZOOM, vh = H / ZOOM;
      g.fillStyle = `rgba(16,26,72,${0.45 * night})`;
      g.fillRect(cam.x - vw / 2 - 10, map.hz, vw + 20, vh + 400);
      ART.fireflies(g, cam.x, cam.y, vw, vh, night, clock);
    }

    if (px) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(wbuf, 0, 0, bw, bh, 0, 0, bw * px * DPR, bh * px * DPR);
      ctx.imageSmoothingEnabled = true;
    }

    // Lớp chữ & giao diện trong thế giới: vẽ ở độ phân giải đầy đủ cho sắc nét
    worldTransform(ctx, DPR * ZOOM, DPR * (W / 2 - cam.x * ZOOM), DPR * (H / 2 - cam.y * ZOOM));
    map.labels.forEach((l) => ART.label(ctx, l.dynamic === 'home' ? `🏠 Nhà ${S.name || 'của bạn'}` : l.text, l.x, l.y));
    map.inter.forEach((o) => {
      if (!o.indicator) return;
      const r = o.indicator();
      if (r == null) return;
      if (typeof r === 'object') ART.timerLabel(ctx, o.ix, o.iy, r.left, r.p);
      else ART.iconBubble(ctx, r, o.ix, o.iy - 14, clock);
    });

    // mũi tên vàng "Vào" trước cửa
    map.inter.forEach((o) => { if (o.arrow) ART.doorArrow(ctx, o.arrow.x, o.arrow.y, clock, o.arrow.text); });

    // bảng tên gỗ dưới chân như Avatar
    map.npcs.forEach((n) => ART.namePlate(ctx, n.name, n.x, n.y + 6, 'npc'));
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
        ctx.fillText('🚌 Đang di chuyển…', W / 2, H / 2);
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
    ZOOM = Math.max(0.62, Math.min(1.15, Math.min(W / 1050, H / 720)));
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
    const hits = map.inter.filter((o) => x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h);
    hits.sort((a, b) => a.w * a.h - b.w * b.h);
    return hits[0] || null;
  }

  canvas.addEventListener('pointerdown', (e) => {
    if (UI.isBlocking() || player.hidden || fade.mode) return;
    document.activeElement && document.activeElement.blur();
    const w = toWorld(e.clientX, e.clientY);
    const pk = map.pickups.find((p) => Math.abs(p.x - w.x) < 22 && w.y > p.y - 30 && w.y < p.y + 8);
    if (pk) {
      player.target = { x: pk.x, y: pk.y + 4 };
      player.pending = { ax: pk.x, ay: pk.y + 4, use: () => collectPickup(pk) };
      marker = { x: pk.x, y: pk.y + 4, t: 0 };
      return;
    }
    const ent = entityAt(w.x, w.y);
    if (ent) { poke(ent); return; }
    const o = interAt(w.x, w.y);
    if (o) {
      player.target = { x: o.ax, y: o.ay };
      player.pending = { ax: o.ax, ay: o.ay, use: o.use };
      marker = { x: o.ax, y: o.ay, t: 0 };
      return;
    }
    player.target = { x: w.x, y: w.y };
    player.pending = null;
    marker = { x: w.x, y: w.y, t: 0 };
  });

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
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
  UI.updateHud();
  NET.init(player);
  if (!S.name) UI.characterEditor(true);
  else UI.toast(`Chào mừng trở lại, ${S.name}! 🌾`);

  setInterval(saveNow, 5000);
  window.addEventListener('beforeunload', saveNow);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

  AV._debug = { player, bus, maps, get map() { return map; }, enterMap, update, draw };
  requestAnimationFrame(loop);
})();
