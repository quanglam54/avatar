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

  function supabaseTransport(room) {
    const ch = client.channel(room, { config: { broadcast: { self: false } } });
    let cb = () => {};
    let ready = false;
    let queue = [];
    ch.on('broadcast', { event: 'msg' }, ({ payload }) => cb(payload));
    setStatus('connecting');
    ch.subscribe((s) => {
      if (s === 'SUBSCRIBED') {
        ready = true;
        setStatus('online');
        queue.forEach((m) => ch.send({ type: 'broadcast', event: 'msg', payload: m }));
        queue = [];
      } else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
        ready = false;
        if (transport && transport.ch === ch) setStatus('error');
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
      name: S.name, look: S.look, level: S.level,
      x: Math.round(player.x), y: Math.round(player.y), dir: player.dir, moving: player.moving, hidden: player.hidden,
    };
  }

  function sendState(t = 'state') {
    if (!player || !AV.S.name) return;
    send(t, stateMsg());
    heartbeat = 0;
  }

  function sendChat(text) {
    send('chat', { name: AV.S.name, text });
  }

  /* ---------- Nhận ---------- */
  const clean = (s, n) => String(s ?? '').slice(0, n);
  const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);

  function cleanLook(l) {
    const d = AV.S.look;
    if (!l || typeof l !== 'object') return { ...d };
    const out = {};
    for (const k of Object.keys(d)) out[k] = clean(l[k] ?? d[k], 24);
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
    r.x = num(m.x, r.x); r.y = num(m.y, r.y);
    r.dir = m.dir === -1 ? -1 : 1;
    r.moving = !!m.moving;
    r.hidden = !!m.hidden;
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
      r.seen = Date.now();
    } else if (m.t === 'chat') {
      const r = remotes.get(m.id);
      const text = clean(m.text, 80);
      if (!text) return;
      if (r) AV.showBubble(r, text);
      UI.chatLog(clean(m.name, 16) || 'Ai đó', text, false);
    } else if (m.t === 'bye') {
      const r = remotes.get(m.id);
      if (r) { remotes.delete(m.id); renderStatus(); UI.toast(`${r.name} đã rời đi`); }
    }
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
    renderStatus();
  }

  function tick(dt) {
    if (!transport || !player || !AV.S.name) return;
    heartbeat += dt;
    sinceMove += dt;
    if (heartbeat > 3) sendState();
    const d = Math.hypot(player.x - last.x, player.y - last.y);
    const changed = d > 1.5 || player.moving !== last.moving || player.hidden !== last.hidden || player.dir !== last.dir;
    if (changed && sinceMove > 0.11) {
      send('move', { x: Math.round(player.x), y: Math.round(player.y), dir: player.dir, moving: player.moving, hidden: player.hidden });
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
      const ok = await loadSupabase();
      if (ok) {
        client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, { realtime: { params: { eventsPerSecond: 12 } } });
        mode = 'online';
      } else {
        UI.toast('Không tải được thư viện Supabase — chuyển sang chế độ thử', 3500);
      }
    }
    if (mode !== 'online' && 'BroadcastChannel' in window) mode = 'local';
    if (mode === 'local') setStatus('local');
    if (mode === 'offline') setStatus('offline');
    if (mapId) join(mapId);
    window.addEventListener('pagehide', () => send('bye'));
  }

  /** Gọi khi vào map mới; nếu chưa init xong thì chỉ ghi nhớ map */
  function enter(newMap) {
    if (mode === 'offline' && !client) { mapId = newMap; renderStatus(); return; }
    join(newMap);
  }

  return {
    init, enter, tick, update, sendState, sendChat, remotes,
    get mode() { return mode; },
    get pid() { return pid; },
    players: () => [...remotes.values()],
    renderStatus,
  };
})();
