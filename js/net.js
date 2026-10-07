/* Chơi nhiều người: đồng bộ vị trí, trang phục và chat qua Supabase Realtime (hoặc BroadcastChannel khi thử trên cùng máy) */
const NET = (() => {
  const cfg = window.AVATAR_CONFIG || {};
  const remotes = new Map();
  const ROOM_PREFIX = 'avatar-world-';
  let mode = 'offline';
  let status = 'offline';
  let client = null;
  let transport = null;
  let mapId = null;
  let player = null;
  let heartbeat = 0;
  let sinceMove = 0;
  const last = { x: 0, y: 0, dir: 1, moving: false, hidden: false };

  const pid = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

  /* ---------- Kênh truyền ---------- */
  function localTransport(room) {
    const bc = new BroadcastChannel(room);
    return {
      send: (m) => bc.postMessage(m),
      on: (cb) => { bc.onmessage = (e) => cb(e.data); },
      close: () => bc.close(),
    };
  }

  function supabaseTransport(room, quiet) {
    const ch = client.channel(room, { config: { broadcast: { self: false } } });
    let cb = () => {};
    let ready = false;
    let queue = [];
    ch.on('broadcast', { event: 'msg' }, ({ payload }) => cb(payload));
    if (!quiet) setStatus('connecting');
    ch.subscribe((s) => {
      if (s === 'SUBSCRIBED') {
        ready = true;
        if (!quiet) setStatus('online');
        queue.forEach((m) => ch.send({ type: 'broadcast', event: 'msg', payload: m }));
        queue = [];
      } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
        ready = false;
        if (!quiet && transport && transport.ch === ch) setStatus('error');
      }
    });
    return {
      ch,
      send: (m) => {
        if (ready) ch.send({ type: 'broadcast', event: 'msg', payload: m });
        else if (queue.length < 10) queue.push(m);
      },
      on: (f) => { cb = f; },
      close: () => client.removeChannel(ch),
    };
  }

  /* ---------- Trạng thái ---------- */
  function setStatus(s) {
    status = s;
    renderStatus();
  }

  function renderStatus() {
    const el = document.getElementById('netStatus');
    if (!el) return;
    const n = [...remotes.values()].length + 1;
    const text = {
      offline: '⚪ Offline',
      local: `🟡 Thử nghiệm · ${n} người`,
      connecting: '🟠 Đang kết nối…',
      online: `🟢 ${n} người online`,
      error: '🔴 Mất kết nối',
    }[status];
    el.textContent = text;
  }

  /* ---------- Gửi ---------- */
  function send(t, extra = {}) {
    if (!transport || !mapId) return;
    transport.send({ t, id: pid, map: mapId, ...extra });
  }

  function stateMsg() {
    const S = AV.S;
    return {
      name: S.name, look: S.look, level: S.level, user: (typeof CLOUD !== 'undefined' && CLOUD.username) || '',
      x: Math.round(player.x), y: Math.round(player.y), dir: player.dir, moving: player.moving, hidden: player.hidden,
      dance: player.dancing > Date.now(),
      fish: fishMsg(),
    };
  }

  function fishMsg() {
    const f = player && player.fishing;
    return f ? [Math.round(f.bx), Math.round(f.by), f.state === 'bite' ? 1 : 0] : 0;
  }
  const readFish = (v) => (Array.isArray(v) ? { bx: num(v[0]), by: num(v[1]), bite: !!v[2] } : null);

  function sendState(t = 'state') {
    if (!player || !AV.S.name) return;
    send(t, stateMsg());
    heartbeat = 0;
  }

  function sendChat(text) {
    send('chat', { name: AV.S.name, text });
  }

  function sendRace(p) {
    send('race', p);
  }

  function sendTable(p) {
    send('tbl', p);
  }

  function sendQuiz(round) {
    send('quiz', { round, name: AV.S.name });
  }

  /** Báo hiệu gọi giọng nói (offer / answer / ICE), có `to` thì chỉ người đó xử lý */
  function sendVoice(p) {
    send('vc', p);
  }

  /** Vị trí xe trên đường phố (ride.js) */
  function sendRide(p) {
    send('ride', p);
  }

  function sendHorse(p) {
    send('horse', p);
  }

  function sendArena(p) {
    send('arena', p);
  }

  function sendRps(p) {
    send('rps', p);
  }

  function sendBox(p) {
    send('box', p);
  }

  function sendBite(ks, fine) {
    send('bite', { ks, fine });
  }

  function sendFirework(kind, name) {
    send('fw', { kind, name });
  }

  /** Thông báo hệ thống cho cả khu, vd: "Lâm đã câu được một cá chép" */
  function sendSys(text) {
    send('sys', { text });
  }

  /* ---------- Nhận ---------- */
  const clean = (s, n) => String(s ?? '').slice(0, n);
  const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

  function cleanLook(l) {
    const d = AV.S.look;
    if (!l || typeof l !== 'object') return { ...d };
    const out = {};
    for (const k of Object.keys(d)) { if (k === 'avatar' || k === 'phair') continue; out[k] = clean(l[k] ?? d[k], 24); }
    if (/^h[1-9]$/.test(l.phair || '')) out.phair = l.phair;
    out.wear = typeof WARDROBE !== 'undefined' ? WARDROBE.sanitize(l.wear) : '';
    if (l.avatar === 'boy' || l.avatar === 'girl' || l.avatar === 'custom') out.avatar = l.avatar;
    return out;
  }

  function upsert(m) {
    let r = remotes.get(m.id);
    const isNew = !r;
    if (!r) {
      r = { id: m.id, rx: num(m.x), ry: num(m.y), t: Math.random() * 10, bubble: null, kind: 'remote' };
      remotes.set(m.id, r);
    }
    r.name = clean(m.name, 16) || 'Người chơi';
    r.look = cleanLook(m.look);
    r.level = num(m.level, 1);
    r.user = clean(m.user, 20);
    r.x = num(m.x, r.x); r.y = num(m.y, r.y);
    r.dir = m.dir === -1 ? -1 : 1;
    r.moving = !!m.moving;
    r.hidden = !!m.hidden;
    r.dance = !!m.dance;
    r.fish = readFish(m.fish);
    r.seen = Date.now();
    if (isNew) renderStatus();
    return isNew;
  }

  function handle(m) {
    if (!m || m.id === pid || m.map !== mapId) return;
    if (m.t === 'hello') {
      const isNew = upsert(m);
      if (isNew) UI.toast(`👋 ${clean(m.name, 16)} vừa tới`);
      setTimeout(() => sendState(), 100 + Math.random() * 400);
    } else if (m.t === 'state') {
      upsert(m);
    } else if (m.t === 'move') {
      const r = remotes.get(m.id);
      if (!r) { send('hello', stateMsg()); return; }
      r.x = num(m.x, r.x); r.y = num(m.y, r.y);
      r.dir = m.dir === -1 ? -1 : 1;
      r.moving = !!m.moving;
      r.hidden = !!m.hidden;
      r.dance = !!m.dance;
      r.fish = readFish(m.fish);
      r.seen = Date.now();
    } else if (m.t === 'race') {
      RACE.onNet(m);
    } else if (m.t === 'tbl') {
      TABLE.onNet(m);
      BIL.onNet(m);
    } else if (m.t === 'quiz') {
      AV.onQuizWin(num(m.round, -1), clean(m.name, 16));
    } else if (m.t === 'ride') {
      if (typeof RIDE !== 'undefined') RIDE.onNet(m);
    } else if (m.t === 'horse') {
      if (typeof HORSE !== 'undefined') HORSE.onNet(m);
    } else if (m.t === 'arena') {
      if (typeof ARENA !== 'undefined') ARENA.onNet(m);
    } else if (m.t === 'rps') {
      if (typeof RPS !== 'undefined') RPS.onNet(m);
    } else if (m.t === 'box') {
      if (typeof BOX !== 'undefined') BOX.onNet(m);
    } else if (m.t === 'vc') {
      if (typeof VOICE !== 'undefined') VOICE.onNet(m);
    } else if (m.t === 'bite') {
      AV.onBite(m.id, Array.isArray(m.ks) ? m.ks.slice(0, 5) : [], num(m.fine));
    } else if (m.t === 'fw') {
      AV.onFirework(clean(m.kind, 10), clean(m.name, 16));
    } else if (m.t === 'sys') {
      const text = clean(m.text, 120);
      if (text) UI.chatLog('', text, false, true);
    } else if (m.t === 'chat') {
      const r = remotes.get(m.id);
      const isImg = typeof CHATIMG !== 'undefined' && CHATIMG.isImg(String(m.text || '').slice(0, 300));
      const text = isImg ? String(m.text).slice(0, 300) : clean(m.text, 150);
      if (!text) return;
      if (r) AV.showBubble(r, isImg ? '📷 Gửi 1 ảnh' : text);
      UI.chatLog(clean(m.name, 16) || 'Ai đó', text, false);
      if (isImg) { const box = document.getElementById('chatLog'); if (box) { box.classList.add('active'); setTimeout(() => { if (document.activeElement !== document.getElementById('chatInput')) box.classList.remove('active'); }, 6000); } }
    } else if (m.t === 'bye') {
      const r = remotes.get(m.id);
      if (r) { remotes.delete(m.id); renderStatus(); }
      if (typeof VOICE !== 'undefined') VOICE.drop(m.id);
    }
  }

  /* ---------- Phòng chờ chung: biết ai đang ở khu nào ---------- */
  let lobby = null;
  let lobbyBeat = 0;
  const where = new Map();

  function openLobby() {
    lobby = mode === 'online' ? supabaseTransport(ROOM_PREFIX + 'lobby', true) : mode === 'local' ? localTransport(ROOM_PREFIX + 'lobby') : null;
    if (!lobby) return;
    lobby.on((m) => {
      if (!m || m.id === pid) return;
      if (m.t === 'where') where.set(m.id, { map: String(m.map), at: String(m.at || m.map), user: String(m.user || ''), seen: Date.now() });
      else if (m.t === 'bye') where.delete(m.id);
      else if (m.t === 'call' && typeof CALL !== 'undefined') CALL.onSignal(m);
      else if (m.t === 'news' && m.text) { if (typeof TREASURE !== 'undefined') TREASURE.onNews(String(m.text).slice(0, 160)); }
      else if ((m.t === 'farmrev' || m.t === 'farmhit' || m.t === 'saverev' || m.t === 'dm') && m.u) AV.onFarmPing(m.t, String(m.u));
    });
    announce();
  }

  function announce() {
    lobbyBeat = 0;
    if (lobby && mapId && AV.S.name) lobby.send({ t: 'where', id: pid, map: mapId.startsWith('apt_') ? ((DATA.AIRPORTS.find((a) => 'apt_' + a.id === mapId) || { zones: ['fun'] }).zones[0]) : mapId === 'casino' || mapId === 'arena' || mapId === 'horse' || mapId === 'club' || mapId === 'concert' || mapId === 'cgv' || mapId === 'boxing' ? 'fun' : mapId === 'classroom' ? 'school' : mapId === 'clinic' ? 'hospital' : mapId.split('-')[0], at: mapId.split('-')[0], user: (typeof CLOUD !== 'undefined' && CLOUD.username) || '' });
  }

  /** Báo ngắn cho mọi người: nông trại của uid vừa thay đổi / vừa bị tưới giúp, hái trộm */
  /** tin cho cả server (mọi khu) */
  function sendNews(text) {
    if (lobby) lobby.send({ t: 'news', id: pid, text: String(text).slice(0, 160) });
  }
  /** báo hiệu gọi thoại 1-1 (chỉ máy có user id = to xử lý) */
  function sendCall(p) {
    if (lobby) lobby.send({ t: 'call', id: pid, ...p });
  }
  function farmPing(t, uid) {
    if (lobby && uid) lobby.send({ t, id: pid, u: uid });
  }

  /** Người chơi (theo tên đăng nhập) đang online không, ở khu nào */
  function onlineUser(u) {
    if (!u) return null;
    for (const r of remotes.values()) if (r.user === u) return { map: String(mapId || '').split('-')[0] };
    const now = Date.now();
    for (const w of where.values()) if (w.user === u && now - w.seen < 15000) return { map: w.at };
    return null;
  }

  function zoneCounts() {
    const counts = {};
    const now = Date.now();
    for (const [id, w] of where) {
      if (now - w.seen > 15000) { where.delete(id); continue; }
      counts[w.map] = (counts[w.map] || 0) + 1;
    }
    if (mapId) counts[mapId] = (counts[mapId] || 0) + 1;
    return counts;
  }

  /* ---------- Vòng đời ---------- */
  function join(newMap) {
    if (transport) { send('bye'); transport.close(); }
    remotes.clear();
    mapId = newMap;
    transport = null;
    if (mode === 'online') transport = supabaseTransport(ROOM_PREFIX + newMap);
    else if (mode === 'local') transport = localTransport(ROOM_PREFIX + newMap);
    if (!transport) { renderStatus(); return; }
    transport.on(handle);
    if (AV.S.name) send('hello', stateMsg());
    announce();
    renderStatus();
    if (typeof VOICE !== 'undefined') VOICE.onRoomChange();
  }

  function tick(dt) {
    if (!transport || !player || !AV.S.name) return;
    heartbeat += dt;
    lobbyBeat += dt;
    if (lobbyBeat > 5) announce();
    sinceMove += dt;
    if (heartbeat > 3) sendState();
    const d = Math.hypot(player.x - last.x, player.y - last.y);
    const changed = d > 1.5 || player.moving !== last.moving || player.hidden !== last.hidden || player.dir !== last.dir;
    if (changed && sinceMove > 0.11) {
      send('move', { x: Math.round(player.x), y: Math.round(player.y), dir: player.dir, moving: player.moving, hidden: player.hidden, dance: player.dancing > Date.now(), fish: fishMsg() });
      Object.assign(last, { x: player.x, y: player.y, dir: player.dir, moving: player.moving, hidden: player.hidden });
      sinceMove = 0;
    }
  }

  function update(dt) {
    const now = Date.now();
    const k = Math.min(1, dt * 9);
    for (const r of remotes.values()) {
      const dx = r.x - r.rx, dy = r.y - r.ry;
      if (Math.hypot(dx, dy) > 400) { r.rx = r.x; r.ry = r.y; }
      r.rx += dx * k;
      r.ry += dy * k;
      r.t += dt;
      r.walking = r.moving || Math.hypot(dx, dy) > 2;
      if (Math.abs(dx) > 1) r.dir = dx > 0 ? 1 : -1;
      if (r.look.pet && r.look.pet !== 'none') {
        r.pet = r.pet || { x: r.rx - 30, y: r.ry, dir: 1, t: 0, moving: false };
        AV.followPet(r.pet, { x: r.rx, y: r.ry }, dt, r.dir);
      }
      if (now - r.seen > 10000) { remotes.delete(r.id); renderStatus(); }
    }
  }

  function loadSupabase() {
    return new Promise((resolve) => {
      if (window.supabase) return resolve(true);
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload = () => resolve(!!window.supabase);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }

  async function init(p) {
    player = p;
    if (cfg.supabaseUrl && cfg.supabaseAnonKey) {
      setStatus('connecting');
      client = await window.getSupabase();
      if (client) {
        mode = 'online';
      } else {
        UI.toast('Không tải được thư viện Supabase — chuyển sang chế độ thử', 3500);
      }
    }
    if (mode !== 'online' && 'BroadcastChannel' in window) mode = 'local';
    if (mode === 'local') setStatus('local');
    if (mode === 'offline') setStatus('offline');
    openLobby();
    if (mapId) join(mapId);
    window.addEventListener('pagehide', () => { send('bye'); if (lobby) lobby.send({ t: 'bye', id: pid }); });
  }

  /** Gọi khi vào map mới; nếu chưa init xong thì chỉ ghi nhớ map */
  function enter(newMap) {
    if (mode === 'offline' && !client) { mapId = newMap; renderStatus(); return; }
    join(newMap);
  }

  return {
    init, enter, tick, update, sendState, sendChat, sendSys, sendQuiz, sendTable, sendRace, remotes, zoneCounts, announce, farmPing, sendNews, sendCall, sendFirework, sendBite, sendVoice, sendRps, sendBox, sendRide, sendArena, sendHorse,
    get mode() { return mode; },
    get pid() { return pid; },
    players: () => [...remotes.values()],
    onlineUser,
    renderStatus,
  };
})();
