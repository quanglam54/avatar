/* 📸 QUANG LÂM PHOTOBOOTH — quầy chụp ảnh ở Khu mua sắm.
 * 7.000 xu / lượt, trong lượt (20 phút) chụp thoải mái. Chụp chung với mọi người đang đứng gần quầy.
 * Phông nền + phụ kiện (mũ, kính, đồ cầm tay) phải THUÊ thêm cho từng lượt; khung ảnh miễn phí.
 * Phối đồ bằng tủ "✨ Đồ của tôi". Ảnh xong: tải về máy hoặc đăng ZenoGram. */
const BOOTH = (() => {
  const PRICE = 7000, SESSION_MIN = 20, NEAR = 520, MAX_PEOPLE = 6, K = 0.72;
  /** vị trí quầy (đặt cạnh quán trà đá ở nông trại) */
  let BX = 2285, BY = 1458, MAP = 'farm';
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- 🎨 phông nền ---------- */
  const BACKDROPS = [
    // 🏠 phòng chụp 3D (vẽ phối cảnh: tường sau, 2 tường bên, sàn, trần) — xem drawRoom
    { id: 'r_studio', name: 'Studio đèn flash', icon: '💡', price: 0 },
    { id: 'r_pink', name: 'Phòng hồng Hàn Quốc', icon: '🎀', price: 1500 },
    { id: 'r_cafe', name: 'Góc cà phê gỗ', icon: '☕', price: 1500 },
    { id: 'r_balloon', name: 'Phòng bóng bay', icon: '🎈', price: 2000 },
    { id: 'r_neon', name: 'Phòng neon', icon: '🌃', price: 2500 },
    { id: 'r_royal', name: 'Sảnh hoàng gia', icon: '👑', price: 3000 },
    // phông phẳng
    { id: 'studio', name: 'Studio trắng', icon: '⬜', price: 0 },
    { id: 'pastel', name: 'Pastel kẹo ngọt', icon: '🍬', price: 1000 },
    { id: 'sakura', name: 'Hoa anh đào', icon: '🌸', price: 2000 },
    { id: 'beach', name: 'Biển hoàng hôn', icon: '🌅', price: 2500 },
    { id: 'neon', name: 'Sân khấu neon', icon: '🎤', price: 2500 },
    { id: 'love', name: 'Trái tim hồng', icon: '💗', price: 1500 },
    { id: 'noel', name: 'Giáng sinh tuyết', icon: '🎄', price: 2000 },
    { id: 'galaxy', name: 'Dải ngân hà', icon: '🌌', price: 3000 },
  ];
  /* ---------- 👑 phụ kiện thuê ---------- */
  const PROPS = [
    { id: 'crown', slot: 'hat', name: 'Vương miện', icon: '👑', price: 2000 },
    { id: 'tophat', slot: 'hat', name: 'Mũ ảo thuật', icon: '🎩', price: 1500 },
    { id: 'bow', slot: 'hat', name: 'Nơ đỏ', icon: '🎀', price: 800 },
    { id: 'flowers', slot: 'hat', name: 'Vòng hoa', icon: '🌸', price: 1200 },
    { id: 'party', slot: 'hat', name: 'Mũ sinh nhật', icon: '🥳', price: 1000 },
    { id: 'bunny', slot: 'hat', name: 'Tai thỏ', icon: '🐰', price: 1500 },
    { id: 'cat', slot: 'hat', name: 'Tai mèo', icon: '🐱', price: 1200 },
    { id: 'halo', slot: 'hat', name: 'Hào quang thiên thần', icon: '😇', price: 1000 },
    { id: 'shades', slot: 'eye', name: 'Kính râm', icon: '🕶️', price: 800 },
    { id: 'heart', slot: 'eye', name: 'Kính trái tim', icon: '💕', price: 1200 },
    { id: 'star', slot: 'eye', name: 'Kính ngôi sao', icon: '⭐', price: 1200 },
    { id: 'nerd', slot: 'eye', name: 'Kính cận tròn', icon: '🤓', price: 600 },
    { id: 'bouquet', slot: 'hand', name: 'Bó hoa', icon: '💐', price: 1500 },
    { id: 'rose', slot: 'hand', name: 'Hoa hồng', icon: '🌹', price: 800 },
    { id: 'balloon', slot: 'hand', name: 'Bóng bay', icon: '🎈', price: 800 },
    { id: 'teddy', slot: 'hand', name: 'Gấu bông', icon: '🧸', price: 1500 },
    { id: 'cake', slot: 'hand', name: 'Bánh kem', icon: '🎂', price: 1500 },
    { id: 'icecream', slot: 'hand', name: 'Kem ốc quế', icon: '🍦', price: 500 },
    { id: 'lovesign', slot: 'hand', name: 'Bảng LOVE', icon: '💌', price: 1000 },
    { id: 'mic', slot: 'hand', name: 'Micro', icon: '🎙️', price: 1000 },
  ];
  const FRAMES = [
    { id: 'pink', name: 'Hồng', bg: '#ffdeeb', ink: '#c2255c' },
    { id: 'white', name: 'Trắng', bg: '#ffffff', ink: '#495057' },
    { id: 'black', name: 'Phim đen', bg: '#1a1b1e', ink: '#f8f9fa' },
    { id: 'mint', name: 'Bạc hà', bg: '#d3f9d8', ink: '#2b8a3e' },
    { id: 'sky', name: 'Xanh trời', bg: '#d0ebff', ink: '#1864ab' },
  ];
  const SLOTS = [['hat', '👑 Mũ & cài tóc'], ['eye', '🕶️ Kính'], ['hand', '💐 Đồ cầm tay']];

  /** lượt chụp hiện tại: { until, rent: Set(id), dress: { pid: { hat, eye, hand } }, bg, frame, layout, skip: Set(pid) } */
  let sess = null;
  const live = () => !!(sess && sess.until > Date.now());

  /* ================= 🏪 quầy chụp ngoài phố ================= */
  function drawKiosk(c, x, y) {
    c.save();
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 2, 92, 12, 0, 0, 7); c.fill();
    // thân quầy
    const g = c.createLinearGradient(x - 85, 0, x + 85, 0); g.addColorStop(0, '#9c36b5'); g.addColorStop(0.5, '#cc5de8'); g.addColorStop(1, '#9c36b5');
    c.fillStyle = g; c.beginPath(); c.roundRect(x - 85, y - 230, 170, 230, [14, 14, 4, 4]); c.fill();
    c.strokeStyle = '#2b1a10'; c.lineWidth = 3; c.stroke();
    // rèm đỏ
    c.fillStyle = '#c92a2a'; c.beginPath(); c.roundRect(x - 62, y - 168, 82, 166, 6); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 3;
    for (let k = 0; k < 5; k++) { const fx = x - 54 + k * 16; c.beginPath(); c.moveTo(fx, y - 164); c.quadraticCurveTo(fx + 5, y - 85, fx, y - 6); c.stroke(); }
    c.fillStyle = '#ffd43b'; c.fillRect(x - 64, y - 172, 86, 6);
    // màn hình + nút
    c.fillStyle = '#212529'; c.beginPath(); c.roundRect(x + 28, y - 160, 48, 62, 6); c.fill();
    const sg = c.createLinearGradient(0, y - 156, 0, y - 104); sg.addColorStop(0, '#74c0fc'); sg.addColorStop(1, '#f783ac');
    c.fillStyle = sg; c.fillRect(x + 32, y - 156, 40, 54);
    c.font = '20px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('📸', x + 52, y - 130);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(x + 28, y - 90, 48, 30, 6); c.fill();
    c.fillStyle = '#c2255c'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.fillText('7K', x + 52, y - 80); c.font = '800 8px "Be Vietnam Pro", system-ui'; c.fillText('/LƯỢT', x + 52, y - 68);
    // biển hiệu có bóng đèn
    c.fillStyle = '#ffe3f1'; c.beginPath(); c.roundRect(x - 92, y - 290, 184, 62, 12); c.fill();
    c.strokeStyle = '#2b1a10'; c.lineWidth = 3; c.stroke();
    for (let k = 0; k < 12; k++) { c.fillStyle = k % 2 ? '#ffd43b' : '#fff9db'; c.beginPath(); c.arc(x - 82 + k * 15, y - 284, 3.2, 0, 7); c.fill(); c.beginPath(); c.arc(x - 82 + k * 15, y - 234, 3.2, 0, 7); c.fill(); }
    c.fillStyle = '#ae3ec9'; c.font = '900 15px "Be Vietnam Pro", system-ui'; c.fillText('QUANG LÂM', x, y - 268);
    c.fillStyle = '#e64980'; c.font = 'italic 900 19px "Be Vietnam Pro", system-ui'; c.fillText('Photobooth', x, y - 248);
    c.restore();
  }
  function addTo(m, h, x, y) {
    BX = x; BY = y + 30; MAP = m.id;
    h.sobj(m, x, y, (c) => { c.save(); c.translate(x, y); c.scale(K, K); c.translate(-x, -y); drawKiosk(c, x, y); c.restore(); }, { l: -100 * K, t: -300 * K, w: 200 * K, h: 312 * K });
    m.objects[m.objects.length - 1].b3d = { w: 170 * K, h: 230 * K, roof: '#9c36b5', wall: '#cc5de8' };
    h.col(m, x - 60 * K, y - 34, 120 * K, 32);
    h.inter(m, { x: x - 85 * K, y: y - 290 * K, w: 170 * K, h: 290 * K, ax: x, ay: y + 30, name: 'Quang Lâm Photobooth (7.000 xu/lượt, chụp thoải mái)', use: () => open(), arrow: { x, y: y - 300 * K, text: 'Photobooth' } });
  }

  /* ================= 🖼️ vẽ ảnh ================= */
  /* ---------- 👥 phòng chụp chung: chủ phòng trả tiền, mời bạn bè (đã kết bạn) vào chụp cùng ---------- */
  /** room = { host: pid chủ phòng, members: [pid…] } — chỉ người trong phòng mới có mặt trong ảnh */
  let room = null;
  const openRooms = new Map(); // phòng của người khác đang mở gần đây: host → { name, at, members }
  const myId = () => (typeof NET !== 'undefined' && NET.pid) || 'me';
  const isHost = () => !!room && room.host === myId();
  const isMember = () => !!room && !isHost() && room.members.includes(myId());
  /** tin phòng chụp đi qua kênh chung toàn server (mỗi người có nông trại riêng nên không chung bản đồ),
   *  mỗi tin kèm tên + tài khoản + trang phục người gửi */
  const send = (p) => { if (typeof NET !== 'undefined' && NET.sendBooth) NET.sendBooth(p); };
  const peers = new Map(); // pid → { name, user, look, at }
  const remote = (id) => peers.get(id) || null;
  const isFriendPid = (id) => { const r = remote(id); return !!(r && r.user && typeof SOCIAL !== 'undefined' && SOCIAL.isFriend(r.user)); };
  function people() {
    const me = { id: myId(), me: true, name: AV.S.name, look: AV.S.look };
    if (!room) return [me];
    // 1 tài khoản chỉ hiện 1 lần (giữ mã kết nối mới nhất — đứng sau trong danh sách)
    const seen = new Set([typeof CLOUD !== 'undefined' && CLOUD.username ? 'u:' + CLOUD.username : 'me']);
    return room.members.map((id) => {
      if (id === myId()) return me;
      const r = remote(id) || (room.info && room.info[id]);
      return r && r.look ? { id, name: r.name || 'Bạn', look: r.look, key: r.user ? 'u:' + r.user : 'n:' + (r.name || id) } : null;
    }).filter(Boolean).reverse().filter((x) => { if (x.me) return true; if (seen.has(x.key)) return false; seen.add(x.key); return true; }).reverse().slice(0, MAX_PEOPLE);
  }
  function hostSync() {
    if (!isHost() || !live()) return;
    const info = {};
    room.members.forEach((id) => { const r = id === myId() ? { name: AV.S.name, look: AV.S.look, user: typeof CLOUD !== 'undefined' ? CLOUD.username : '' } : remote(id); if (r) info[id] = { name: r.name, look: r.look, user: r.user || '' }; });
    send({ a: 'room', host: myId(), hname: AV.S.name, members: room.members, info, s: { until: sess.until, dress: sess.dress, bg: sess.bg, frame: sess.frame, layout: sess.layout, pose: sess.pose, skip: [...sess.skip] } });
  }
  /** bạn bè đang online (ở bất kỳ khu nào) chưa vào phòng — để mời */
  const onlineFriends = () => {
    if (typeof NET === 'undefined' || !NET.lobbyPeers || typeof SOCIAL === 'undefined') return [];
    const fl = AV.S.friends || [];
    return NET.lobbyPeers().filter((p) => p.user && SOCIAL.isFriend(p.user) && !(room && room.members.includes(p.id)))
      .map((p) => ({ id: p.id, name: (remote(p.id) || {}).name || (fl.find((f) => f.username === p.user) || {}).name || p.user }));
  };
  setInterval(hostSync, 2500);
  let shooting = false;
  const rerender = () => { if (!shooting && panelRef && panelRef._render && panelRef.body.querySelector('.pb-wrap')) panelRef._render(); };
  function onNet(m) {
    const from = m.id;
    if (from && m.look) peers.set(from, { name: String(m.name || 'Bạn').slice(0, 16), user: String(m.user || ''), look: m.look, at: Date.now() });
    switch (m.a) {
      case 'room': {
        if (m.host !== from || !Array.isArray(m.members)) return;
        openRooms.set(from, { name: String(m.hname || 'Bạn').slice(0, 16), at: Date.now(), members: m.members });
        const mine = m.members.includes(myId());
        if (mine && !isHost()) {
          const st = m.s || {};
          room = { host: from, members: m.members.map(String).slice(0, MAX_PEOPLE), info: m.info || {} };
          const rent = sess && sess.member ? sess.rent : new Set(['studio']);
          sess = { member: true, rent, until: Math.min(+st.until || 0, Date.now() + SESSION_MIN * 60000), dress: st.dress || {}, bg: BACKDROPS.some((b) => b.id === st.bg) ? st.bg : 'studio', frame: FRAMES.some((f) => f.id === st.frame) ? st.frame : 'pink', layout: st.layout === 'one' ? 'one' : 'strip', pose: POSES.some((x) => x.id === st.pose) ? st.pose : 'v', skip: new Set(st.skip || []) };
          if (pendingJoin === from) { pendingJoin = null; UI.toast(`📸 Đã vào phòng chụp của ${openRooms.get(from).name}!`); if (panelRef) studio(panelRef); else open(); }
          else rerender();
        } else if (room && room.host === from && !mine) { room = null; sess = null; UI.toast('Bạn đã rời phòng chụp'); if (panelRef) panelRef.close(); }
        break;
      }
      case 'close': if (room && room.host === from && !isHost()) { room = null; sess = null; UI.toast('📸 Chủ phòng đã đóng phòng chụp'); if (panelRef) panelRef.close(); } openRooms.delete(from); break;
      case 'invite': if (m.to === myId() && !isHost()) UI.confirm(`📸 <b>${esc(m.name)}</b> mời bạn vào phòng chụp <b>Quang Lâm Photobooth</b> chụp ảnh cùng nhau!`, 'Vào chụp', () => join(from)); break;
      case 'join':
        if (!isHost() || m.to !== myId()) return;
        if (!isFriendPid(from)) { send({ a: 'reject', to: from, msg: 'Chỉ bạn bè (đã kết bạn) mới vào chung phòng chụp được' }); return; }
        // cùng 1 tài khoản tải lại trang / mở tab khác → mã kết nối mới: bỏ mã cũ để không hiện 2 lần
        { const u = (remote(from) || {}).user; if (u) room.members.filter((id) => id !== from && id !== myId() && (remote(id) || {}).user === u).forEach((old) => { room.members = room.members.filter((x) => x !== old); delete sess.dress[old]; sess.skip.delete(old); }); }
        if (room.members.length >= MAX_PEOPLE) { send({ a: 'reject', to: from, msg: 'Phòng chụp đã đủ người' }); return; }
        if (!room.members.includes(from)) { room.members.push(from); UI.toast(`📸 ${esc((remote(from) || {}).name || 'Bạn')} đã vào phòng chụp`); }
        hostSync(); rerender();
        break;
      case 'leave': if (isHost() && room.members.includes(from)) { room.members = room.members.filter((x) => x !== from); delete sess.dress[from]; hostSync(); rerender(); } break;
      case 'dress':
        if (!isHost() || !room.members.includes(from) || !m.d) return;
        sess.dress[from] = { hat: PROPS.some((p) => p.id === m.d.hat) ? m.d.hat : '', eye: PROPS.some((p) => p.id === m.d.eye) ? m.d.eye : '', hand: PROPS.some((p) => p.id === m.d.hand) ? m.d.hand : '' };
        hostSync(); rerender();
        break;
      case 'shoot':
        if (!isMember() || room.host !== from) return;
        if (!panelRef) open();
        setTimeout(() => { if (panelRef && sess) { if (!panelRef.body.querySelector('.pb-wrap')) studio(panelRef); shoot(panelRef); } }, 150);
        break;
      case 'reject': if (m.to === myId()) { pendingJoin = null; UI.toast('⚠️ ' + m.msg, 4000); } break;
      default:
    }
  }
  let pendingJoin = null;
  function join(host) {
    if (isHost() && live()) return UI.toast('Bạn đang là chủ phòng chụp rồi');
    pendingJoin = host;
    send({ a: 'join', to: host, name: AV.S.name });
    UI.toast('📸 Đang vào phòng chụp…');
  }
  function leaveRoom() {
    if (isMember()) send({ a: 'leave', to: room.host });
    room = null; sess = null;
  }
  /* ---------- 🏠 phòng chụp 3D ----------
   * Phối cảnh 1 điểm tụ: tường sau là hình chữ nhật ở giữa, 2 tường bên + sàn + trần là hình thang nối ra 4 góc ảnh.
   * d = độ sâu (0 = mép trước, 1 = sát tường sau), u = ngang (0 trái → 1 phải), v = dọc (0 trên → 1 dưới). */
  function drawRoom(g, w, h, id, t) {
    const s = w / 640, X0 = w * 0.2, X1 = w * 0.8, Y0 = h * 0.07, Y1 = h * 0.6;
    const L = (a, b, k) => a + (b - a) * k;
    const back = (u, v) => [L(X0, X1, u), L(Y0, Y1, v)];
    const wl = (d, v) => [L(0, X0, d), L(L(0, Y0, d), L(h, Y1, d), v)];
    const wr = (d, v) => [L(w, X1, d), L(L(0, Y0, d), L(h, Y1, d), v)];
    const fl = (d, u) => [L(L(0, X0, d), L(w, X1, d), u), L(h, Y1, d)];
    const ce = (d, u) => [L(L(0, X0, d), L(w, X1, d), u), L(0, Y0, d)];
    const poly = (pts, fill) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = fill; g.fill(); };
    const line = (a, b, col, lw) => { g.strokeStyle = col; g.lineWidth = lw * s; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
    const lg = (x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
    const emoji = (ch, [x, y], size) => { g.font = `${Math.round(size * s)}px system-ui, "Segoe UI Emoji"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x, y); };
    /** các mốc độ sâu dày dần về phía xa (giống gạch thật nhỏ dần) */
    const DEP = (n) => Array.from({ length: n + 1 }, (_, k) => (1 - Math.pow(0.8, k)) / (1 - Math.pow(0.8, n)));
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const shell = (o) => {
      poly([[0, 0], [w, 0], back(1, 0), back(0, 0)], o.ceil);
      poly([[0, 0], back(0, 0), back(0, 1), [0, h]], lg(0, 0, X0, 0, [[0, o.sideA], [1, o.sideB]]));
      poly([[w, 0], back(1, 0), back(1, 1), [w, h]], lg(w, 0, X1, 0, [[0, o.sideA], [1, o.sideB]]));
      poly([back(0, 0), back(1, 0), back(1, 1), back(0, 1)], o.back);
      poly([back(0, 1), back(1, 1), [w, h], [0, h]], lg(0, Y1, 0, h, [[0, o.floorB], [1, o.floorA]]));
    };
    /** ốp gạch vuông nửa dưới 3 bức tường (từ v = vt xuống chân tường) */
    const tiles = (vt, fill, col, rows, cols) => {
      poly([back(0, vt), back(1, vt), back(1, 1), back(0, 1)], fill);
      for (let r = 1; r < rows; r++) line(back(0, L(vt, 1, r / rows)), back(1, L(vt, 1, r / rows)), col, 1.2);
      for (let c = 1; c < cols; c++) line(back(c / cols, vt), back(c / cols, 1), col, 1.2);
      [wl, wr].forEach((f) => {
        poly([f(0, vt), f(1, vt), f(1, 1), f(0, 1)], fill);
        for (let r = 1; r < rows; r++) line(f(0, L(vt, 1, r / rows)), f(1, L(vt, 1, r / rows)), col, 1.2);
        DEP(Math.round(cols * 0.8)).forEach((d) => line(f(d, vt), f(d, 1), col, 1.2));
        line(f(0, vt), f(1, vt), 'rgba(255,255,255,.85)', 3);
      });
      line(back(0, vt), back(1, vt), 'rgba(255,255,255,.85)', 3);
    };
    const floorGrid = (n, col, lw = 1.2) => { for (let i = 0; i <= n; i++) line(fl(0, i / n), fl(1, i / n), col, lw); DEP(n).forEach((d) => line(fl(d, 0), fl(d, 1), col, lw)); };
    const checker = (n, a, b) => { const ds = DEP(n); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) poly([fl(ds[j], i / n), fl(ds[j], (i + 1) / n), fl(ds[j + 1], (i + 1) / n), fl(ds[j + 1], i / n)], (i + j) % 2 ? a : b); };
    /** kệ gắn tường bên (f = wl | wr) từ độ sâu d0 → d1 ở độ cao v, bày đồ emoji */
    const shelf = (f, d0, d1, v, items) => {
      const a = f(d0, v), b = f(d1, v), a2 = f(d0, v + 0.025), b2 = f(d1, v + 0.025);
      poly([a, b, b2, a2], '#fff'); line(a2, b2, 'rgba(0,0,0,.12)', 2);
      g.save(); g.shadowColor = 'rgba(255,240,250,.9)'; g.shadowBlur = 10 * s; line(a2, b2, 'rgba(255,255,255,.9)', 1.5); g.restore();
      items.forEach((ch, i) => { const d = L(d0, d1, (i + 0.5) / items.length), p = f(d, v); emoji(ch, [p[0], p[1] - 16 * s * (1 - d * 0.55)], 30 * (1 - d * 0.55)); });
    };
    /** khung treo tường sau */
    const frame = (u0, v0, u1, v1, border, inner) => { const [x0, y0] = back(u0, v0), [x1, y1] = back(u1, v1); g.fillStyle = border; g.fillRect(x0, y0, x1 - x0, y1 - y0); g.fillStyle = inner; g.fillRect(x0 + 5 * s, y0 + 5 * s, x1 - x0 - 10 * s, y1 - y0 - 10 * s); return [x0 + 5 * s, y0 + 5 * s, x1 - x0 - 10 * s, y1 - y0 - 10 * s]; };
    const glowText = (txt, [x, y], size, col, glow, font = '900') => { g.save(); g.font = `${font} ${Math.round(size * s)}px "Be Vietnam Pro", system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = glow; g.shadowBlur = 18 * s; g.fillStyle = col; g.fillText(txt, x, y); g.fillText(txt, x, y); g.restore(); };
    const balloon = (x, y, r, col) => { const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, col); gr.addColorStop(1, col); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 0.86, r, 0, 0, 7); g.fill(); };

    if (id === 'r_pink') {
      shell({ ceil: '#fffafb', sideA: '#fff0f4', sideB: '#fff8fa', back: '#fffdfd', floorA: '#efe4df', floorB: '#f8f1ee' });
      // sàn đá mài (terrazzo): hạt màu nhỏ dần về phía xa
      for (let k = 0; k < 260; k++) { const d = Math.pow(rnd(), 0.7), p = fl(d, rnd()); g.fillStyle = ['#c9b8b0', '#f4a7b9', '#9fb7c9', '#d8cfc8', '#e8a87c'][k % 5]; g.beginPath(); g.ellipse(p[0], p[1], (1 - d * 0.7) * 3.4 * s, (1 - d * 0.7) * 1.6 * s, rnd() * 3, 0, 7); g.fill(); }
      tiles(0.58, '#f6c3d1', '#fff', 6, 12);
      // cửa vòm có rèm xanh (phòng thay đồ)
      const [ax0, ay0] = back(0.6, 0.18), [ax1, ay1] = back(0.86, 1), r = (ax1 - ax0) / 2;
      g.fillStyle = '#fff'; g.beginPath(); g.moveTo(ax0 - 6 * s, ay1); g.lineTo(ax0 - 6 * s, ay0 + r); g.arc(ax0 + r, ay0 + r, r + 6 * s, Math.PI, 0); g.lineTo(ax1 + 6 * s, ay1); g.fill();
      g.fillStyle = '#3d4b5c'; g.beginPath(); g.moveTo(ax0, ay1); g.lineTo(ax0, ay0 + r); g.arc(ax0 + r, ay0 + r, r, Math.PI, 0); g.lineTo(ax1, ay1); g.fill();
      g.fillStyle = lg(ax0, 0, ax1, 0, [[0, '#5b8ec9'], [0.5, '#8fb8e8'], [1, '#5b8ec9']]); g.fillRect(ax0 + 4 * s, ay0 + r * 0.9, (ax1 - ax0) * 0.62, ay1 - ay0 - r * 0.9);
      g.strokeStyle = 'rgba(30,50,90,.25)'; g.lineWidth = 2 * s; for (let k = 1; k < 6; k++) { const x = ax0 + 4 * s + k * (ax1 - ax0) * 0.1; g.beginPath(); g.moveTo(x, ay0 + r); g.quadraticCurveTo(x + 4 * s, (ay0 + ay1) / 2, x, ay1); g.stroke(); }
      // gương đứng + đồng hồ ON AIR
      const [mx, my, mw, mh] = frame(0.06, 0.12, 0.26, 0.98, '#fff', '#dbe4ea');
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(mx + mw * 0.2, my); g.lineTo(mx + mw * 0.45, my); g.lineTo(mx + mw * 0.1, my + mh); g.lineTo(mx, my + mh * 0.75); g.fill();
      const [cx, cy] = back(0.42, 0.2); g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 16 * s, 0, 7); g.fill(); g.strokeStyle = '#dee2e6'; g.lineWidth = 2 * s; g.stroke();
      g.fillStyle = '#495057'; g.font = `800 ${Math.round(6 * s)}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ON AIR', cx, cy);
      glowText('Smile & Shine', back(0.42, 0.42), 15, '#e64980', 'rgba(255,255,255,.9)', 'italic 800');
      // kệ phụ kiện tường trái + tường phải
      shelf(wl, 0.12, 0.8, 0.3, ['🧸', '🐻', '🎀', '🐰']);
      shelf(wl, 0.12, 0.8, 0.5, ['👒', '🎩', '🧢', '👑']);
      shelf(wl, 0.12, 0.8, 0.7, ['🐱', '🦄', '🐶', '🐥']);
      shelf(wr, 0.25, 0.85, 0.42, ['🌷', '💐', '🕶️']);
    } else if (id === 'r_cafe') {
      shell({ ceil: '#6b4a35', sideA: '#ead7bd', sideB: '#f3e4cf', back: '#f6e9d6', floorA: '#8a5a32', floorB: '#b07a4a' });
      // sàn ván gỗ so le
      for (let i = 0; i <= 12; i++) line(fl(0, i / 12), fl(1, i / 12), 'rgba(60,30,10,.35)', 1.4);
      const ds = DEP(9); for (let j = 1; j < ds.length; j++) for (let i = 0; i < 12; i++) if ((i + j) % 2) line(fl(ds[j], i / 12), fl(ds[j], (i + 1) / 12), 'rgba(60,30,10,.3)', 1);
      tiles(0.66, '#a9744a', 'rgba(60,30,10,.35)', 1, 8);
      // cửa sổ có nắng
      const [wx, wy, ww, wh] = frame(0.52, 0.1, 0.94, 0.58, '#5c3d2e', '#bfe3ff');
      g.fillStyle = lg(0, wy, 0, wy + wh, [[0, '#a5d8ff'], [1, '#fff3bf']]); g.fillRect(wx, wy, ww, wh);
      g.fillStyle = '#69db7c'; g.beginPath(); g.ellipse(wx + ww * 0.3, wy + wh, ww * 0.35, wh * 0.3, 0, Math.PI, 0); g.fill();
      g.fillStyle = '#5c3d2e'; g.fillRect(wx + ww / 2 - 3 * s, wy, 6 * s, wh); g.fillRect(wx, wy + wh / 2 - 3 * s, ww, 6 * s);
      g.save(); g.globalAlpha = 0.18; poly([[wx, wy], [wx + ww, wy], [w * 0.9, h], [w * 0.35, h]], '#fff3bf'); g.restore();
      glowText('Quang Lâm Coffee', back(0.27, 0.26), 17, '#fff4e6', '#ff922b', 'italic 900');
      frame(0.08, 0.38, 0.22, 0.6, '#5c3d2e', '#ffe8cc'); emoji('☕', back(0.15, 0.49), 22);
      frame(0.27, 0.38, 0.41, 0.6, '#5c3d2e', '#d3f9d8'); emoji('🌿', back(0.34, 0.49), 22);
      // bóng đèn treo
      [0.25, 0.5, 0.75].forEach((u, i) => { const top = ce(0.55, u), y = top[1] + (40 + i % 2 * 18) * s; line(top, [top[0], y], '#2b1a10', 1.5); g.save(); g.shadowColor = '#ffd43b'; g.shadowBlur = 22 * s; g.fillStyle = '#fff3bf'; g.beginPath(); g.arc(top[0], y + 6 * s, 7 * s, 0, 7); g.fill(); g.restore(); });
      emoji('🪴', fl(0.12, 0.06), 58); emoji('🪴', fl(0.12, 0.94), 58);
      shelf(wl, 0.2, 0.85, 0.42, ['🥐', '🍰', '🧁']); shelf(wr, 0.2, 0.85, 0.42, ['📚', '🕯️', '📻']);
    } else if (id === 'r_balloon') {
      shell({ ceil: '#fff', sideA: '#e5dbff', sideB: '#f3f0ff', back: '#fff0f6', floorA: '#ffd8e8', floorB: '#ffe3ef' });
      checker(8, '#ffc9de', '#fff0f6');
      tiles(0.7, '#d0bfff', '#fff', 2, 10);
      // vòm bóng bay trên tường sau
      const [bx, by] = back(0.5, 0.95), R = (X1 - X0) * 0.36, cols = ['#ff8fab', '#ffd43b', '#74c0fc', '#b197fc', '#63e6be'];
      for (let k = 0; k <= 22; k++) { const a = Math.PI + (k / 22) * Math.PI; balloon(bx + Math.cos(a) * R, by + Math.sin(a) * R * 1.35, (14 + (k % 3) * 3) * s, cols[k % 5]); }
      glowText('HAPPY DAY', back(0.5, 0.6), 24, '#f06595', 'rgba(255,255,255,1)');
      // chùm bóng ở 2 góc
      [[0.12, 1], [0.88, -1]].forEach(([u, sg]) => { const base = fl(0.15, u); for (let k = 0; k < 7; k++) { const x = base[0] + sg * (Math.sin(k * 2.1) * 28) * s, y = base[1] - (120 + (k % 4) * 34) * s; line([x, y + 18 * s], base, 'rgba(0,0,0,.25)', 1); balloon(x, y, 22 * s, cols[(k + (sg > 0 ? 0 : 2)) % 5]); } });
      emoji('🎁', fl(0.2, 0.2), 34); emoji('🧸', fl(0.2, 0.8), 40);
    } else if (id === 'r_neon') {
      shell({ ceil: '#0e0820', sideA: '#160c33', sideB: '#22124a', back: '#140b2b', floorA: '#07050f', floorB: '#120a26' });
      const pulse = 0.65 + 0.35 * Math.sin(t * 3);
      g.save(); g.shadowColor = '#f06595'; g.shadowBlur = 12 * s; floorGrid(10, `rgba(240,101,149,${0.35 + 0.25 * pulse})`, 1.6); g.restore();
      // ống neon dọc 2 tường bên
      DEP(5).slice(0, 5).forEach((d, i) => [wl, wr].forEach((f) => { g.save(); g.shadowColor = i % 2 ? '#4dabf7' : '#da77f2'; g.shadowBlur = 16 * s; line(f(d + 0.05, 0.12), f(d + 0.05, 0.85), i % 2 ? '#a5d8ff' : '#f3d9fa', 4 * (1 - d * 0.6)); g.restore(); }));
      // khung neon + chữ trên tường sau
      const [nx0, ny0] = back(0.1, 0.12), [nx1, ny1] = back(0.9, 0.8);
      g.save(); g.shadowColor = '#4dabf7'; g.shadowBlur = 20 * s; g.strokeStyle = '#d0ebff'; g.lineWidth = 4 * s; g.beginPath(); g.roundRect(nx0, ny0, nx1 - nx0, ny1 - ny0, 18 * s); g.stroke(); g.restore();
      g.globalAlpha = 0.6 + 0.4 * pulse; glowText('QUANG LÂM', back(0.5, 0.36), 36, '#ffdeeb', '#f06595'); glowText('✦ PHOTO NIGHT ✦', back(0.5, 0.58), 15, '#e3fafc', '#22b8cf'); g.globalAlpha = 1;
      // phản chiếu trên sàn bóng
      g.save(); g.globalAlpha = 0.18; poly([back(0.1, 1), back(0.9, 1), fl(0.6, 0.85), fl(0.6, 0.15)], '#f06595'); g.restore();
    } else if (id === 'r_royal') {
      shell({ ceil: '#3b0a12', sideA: '#6e0f1f', sideB: '#8b1426', back: '#951a2c', floorA: '#e9ecef', floorB: '#f8f9fa' });
      checker(8, '#212529', '#f1f3f5');
      // thảm đỏ chạy vào tường sau
      poly([fl(0, 0.36), fl(0, 0.64), fl(1, 0.58), fl(1, 0.42)], '#c92a2a');
      line(fl(0, 0.38), fl(1, 0.435), '#fcc419', 2); line(fl(0, 0.62), fl(1, 0.565), '#fcc419', 2);
      tiles(0.66, '#5c0b19', '#d4a017', 2, 6);
      // rèm nhung 2 bên tường sau + khung tranh vàng
      [[0, 0.16], [0.84, 1]].forEach(([u0, u1]) => { const [x0, y0] = back(u0, 0), [x1, y1] = back(u1, 1); g.fillStyle = lg(x0, 0, x1, 0, [[0, '#7a0f1c'], [0.5, '#c92a2a'], [1, '#7a0f1c']]); g.fillRect(x0, y0, x1 - x0, y1 - y0); g.fillStyle = '#fcc419'; g.fillRect(x0, y0 + (y1 - y0) * 0.55, x1 - x0, 5 * s); });
      const [fx, fy, fw, fh] = frame(0.3, 0.14, 0.7, 0.56, '#d4a017', '#fff3bf');
      g.fillStyle = lg(0, fy, 0, fy + fh, [[0, '#a5d8ff'], [1, '#d8f5a2']]); g.fillRect(fx + 4 * s, fy + 4 * s, fw - 8 * s, fh - 8 * s); emoji('🏰', [fx + fw / 2, fy + fh * 0.6], 44);
      // đèn chùm
      const top = ce(0.6, 0.5), cy = top[1] + 46 * s; line(top, [top[0], cy], '#d4a017', 2);
      g.save(); g.shadowColor = '#ffe066'; g.shadowBlur = 24 * s; g.strokeStyle = '#fcc419'; g.lineWidth = 3 * s; g.beginPath(); g.ellipse(top[0], cy, 46 * s, 12 * s, 0, 0, Math.PI); g.stroke();
      for (let k = 0; k < 7; k++) { const x = top[0] - 42 * s + k * 14 * s, y = cy + Math.sin((k / 6) * Math.PI) * 12 * s; g.fillStyle = '#fff9db'; g.beginPath(); g.arc(x, y - 6 * s, 4 * s, 0, 7); g.fill(); }
      g.restore();
      emoji('🏺', fl(0.18, 0.08), 46); emoji('🏺', fl(0.18, 0.92), 46);
    } else {
      // r_studio: phông giấy trắng cuộn xuống sàn + 2 đèn softbox
      shell({ ceil: '#ced4da', sideA: '#adb5bd', sideB: '#ced4da', back: '#dee2e6', floorA: '#868e96', floorB: '#adb5bd' });
      floorGrid(6, 'rgba(0,0,0,.06)');
      poly([back(0.08, 0), back(0.92, 0), back(0.92, 1), fl(0.5, 0.86), fl(0.5, 0.14), back(0.08, 1)], lg(0, Y0, 0, L(h, Y1, 0.5), [[0, '#ffffff'], [0.75, '#f8f9fa'], [1, '#e9ecef']]));
      const [rx, ry] = back(0.5, 0.06); g.fillStyle = '#495057'; g.fillRect(rx - (X1 - X0) * 0.44, ry - 6 * s, (X1 - X0) * 0.88, 8 * s);
      [[0.1, 1], [0.9, -1]].forEach(([u, sg]) => {
        const f = fl(0.22, u), top = [f[0] + sg * 6 * s, f[1] - 210 * s];
        line(f, top, '#212529', 3); line(f, [f[0] - 24 * s, f[1] + 4 * s], '#212529', 3); line(f, [f[0] + 24 * s, f[1] + 4 * s], '#212529', 3);
        g.save(); g.translate(top[0], top[1]); g.rotate(sg * 0.35);
        g.fillStyle = '#212529'; g.fillRect(-38 * s, -46 * s, 76 * s, 70 * s);
        g.shadowColor = '#fff'; g.shadowBlur = 28 * s; g.fillStyle = '#fff'; g.fillRect(-32 * s, -40 * s, 64 * s, 58 * s); g.restore();
      });
      // đèn vòng (ring light) sau lưng
      const [lx, ly] = back(0.5, 0.36); g.save(); g.shadowColor = '#fff'; g.shadowBlur = 20 * s; g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 7 * s; g.beginPath(); g.arc(lx, ly, 50 * s, 0, 7); g.stroke(); g.restore();
    }
    // ánh sáng đèn chụp từ trên + tối dần 4 góc cho có chiều sâu
    const sp = g.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h * 0.5, w * 0.62); sp.addColorStop(0, 'rgba(255,255,255,.18)'); sp.addColorStop(0.6, 'rgba(255,255,255,0)'); sp.addColorStop(1, 'rgba(0,0,0,.28)');
    g.fillStyle = sp; g.fillRect(0, 0, w, h);
    // đường giao tường cho nổi khối
    [[[0, 0], back(0, 0)], [[w, 0], back(1, 0)], [[0, h], back(0, 1)], [[w, h], back(1, 1)]].forEach(([a, b]) => line(a, b, 'rgba(0,0,0,.08)', 1.5));
    line(back(0, 1), back(1, 1), 'rgba(0,0,0,.15)', 2);
  }
  function backdrop(g, w, h, id, t) {
    if (id && id.startsWith('r_')) return drawRoom(g, w, h, id, t);
    const lin = (a, b, c3) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, a); if (c3) { gr.addColorStop(0.6, b); gr.addColorStop(1, c3); } else gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, w, h); };
    const emo = (ch, n, size, seed) => { g.font = `${size}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let k = 0; k < n; k++) { const a = Math.sin(k * 12.9898 + seed) * 43758.5453, r = a - Math.floor(a), b = Math.sin(k * 78.233 + seed) * 12345.678, r2 = b - Math.floor(b); g.globalAlpha = 0.55 + r2 * 0.4; g.fillText(ch, r * w, (r2 * h * 0.8 + t * 8 * (k % 3 + 1)) % (h * 0.85)); } g.globalAlpha = 1; };
    if (id === 'pastel') { lin('#ffdeeb', '#e5dbff', '#d0ebff'); emo('🍭', 7, 26, 1); emo('☁️', 5, 34, 2); }
    else if (id === 'sakura') { lin('#fff0f6', '#fcc2d7'); g.fillStyle = '#8c5e3c'; g.fillRect(w * 0.08, h * 0.15, 10, h * 0.7); g.fillRect(w * 0.88, h * 0.1, 10, h * 0.75); g.fillStyle = '#faa2c1'; for (const cx of [w * 0.08, w * 0.9]) for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(cx + Math.cos(k) * 40, h * 0.18 + Math.sin(k * 2) * 26, 34, 0, 7); g.fill(); } emo('🌸', 14, 18, 3); }
    else if (id === 'beach') { lin('#ff922b', '#ffc078', '#ffe8cc'); g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(w * 0.72, h * 0.42, 46, 0, 7); g.fill(); g.fillStyle = '#4dabf7'; g.fillRect(0, h * 0.5, w, h * 0.22); g.fillStyle = '#ffe8a1'; g.fillRect(0, h * 0.72, w, h); emo('🌴', 2, 70, 4); }
    else if (id === 'neon') { lin('#1b1035', '#3b0764'); for (let k = 0; k < 7; k++) { g.strokeStyle = ['#f06595', '#4dabf7', '#ffd43b', '#69db7c'][k % 4]; g.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3 + k); g.lineWidth = 10; g.beginPath(); g.moveTo(w / 2, -10); g.lineTo(k * w / 6, h); g.stroke(); } g.globalAlpha = 1; g.font = '900 34px "Be Vietnam Pro", system-ui'; g.textAlign = 'center'; g.shadowColor = '#f06595'; g.shadowBlur = 16; g.fillStyle = '#ffdeeb'; g.fillText('PARTY TIME', w / 2, h * 0.14); g.shadowBlur = 0; }
    else if (id === 'love') { lin('#ffc9e0', '#f783ac'); emo('💗', 16, 30, 5); g.font = '120px system-ui'; g.textAlign = 'center'; g.globalAlpha = 0.25; g.fillText('❤️', w / 2, h * 0.4); g.globalAlpha = 1; }
    else if (id === 'noel') { lin('#1c3d5a', '#2b6b8f', '#e7f5ff'); emo('❄️', 18, 18, 6); g.font = '90px system-ui'; g.textAlign = 'center'; g.fillText('🎄', w * 0.1, h * 0.55); g.fillText('🎁', w * 0.92, h * 0.68); }
    else if (id === 'galaxy') { const gr = g.createRadialGradient(w * 0.6, h * 0.35, 10, w * 0.5, h * 0.5, w * 0.8); gr.addColorStop(0, '#9775fa'); gr.addColorStop(0.5, '#3b2a7a'); gr.addColorStop(1, '#0b0920'); g.fillStyle = gr; g.fillRect(0, 0, w, h); emo('✦', 30, 10, 7); emo('🪐', 1, 50, 8); }
    else { lin('#ffffff', '#f1f3f5'); g.fillStyle = 'rgba(0,0,0,.05)'; g.beginPath(); g.ellipse(w / 2, h * 0.86, w * 0.42, 26, 0, 0, 7); g.fill(); }
  }
  /** phụ kiện vẽ theo vị trí đầu / mắt / tay (tỉ lệ k = chiều cao nhân vật / 100) */
  function drawProp(g, id, x, top, k, dir) {
    const p = PROPS.find((q) => q.id === id);
    if (!p) return;
    const emoji = (ch, px, py, size, rot = 0) => { g.save(); g.globalAlpha = 1; g.fillStyle = '#000'; g.shadowBlur = 0; g.translate(px, py); g.rotate(rot); g.font = `${size}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 0, 0); g.restore(); };
    const eyeY = top + 41 * k, hx = x + dir * 30 * k, hy = top + 68 * k;
    g.save();
    switch (id) {
      case 'crown': emoji('👑', x, top + 2 * k, 34 * k); break;
      case 'tophat': emoji('🎩', x, top - 4 * k, 40 * k); break;
      case 'bow': emoji('🎀', x + 16 * k, top + 6 * k, 22 * k, 0.3); break;
      case 'flowers': for (let i = -2; i <= 2; i++) emoji(i % 2 ? '🌼' : '🌸', x + i * 11 * k, top + 6 * k + Math.abs(i) * 3 * k, 15 * k); break;
      case 'party': { g.fillStyle = '#4dabf7'; g.beginPath(); g.moveTo(x - 13 * k, top + 6 * k); g.lineTo(x + 13 * k, top + 6 * k); g.lineTo(x + 3 * k, top - 30 * k); g.closePath(); g.fill(); g.strokeStyle = '#ffd43b'; g.lineWidth = 3 * k; g.beginPath(); g.moveTo(x - 8 * k, top - 4 * k); g.lineTo(x + 8 * k, top - 8 * k); g.stroke(); g.fillStyle = '#ff6b6b'; g.beginPath(); g.arc(x + 3 * k, top - 31 * k, 5 * k, 0, 7); g.fill(); break; }
      case 'bunny': case 'cat': {
        const col = id === 'bunny' ? '#fff' : '#343a40', inn = '#ffc9de';
        for (const s of [-1, 1]) {
          g.save(); g.translate(x + s * 14 * k, top + 8 * k); g.rotate(s * 0.25);
          g.fillStyle = col; g.strokeStyle = '#2b1a10'; g.lineWidth = 2 * k; g.beginPath();
          if (id === 'bunny') g.ellipse(0, -22 * k, 8 * k, 22 * k, 0, 0, 7); else { g.moveTo(-10 * k, 0); g.lineTo(0, -20 * k); g.lineTo(10 * k, 0); g.closePath(); }
          g.fill(); g.stroke();
          g.fillStyle = inn; g.beginPath(); if (id === 'bunny') g.ellipse(0, -22 * k, 4 * k, 15 * k, 0, 0, 7); else { g.moveTo(-5 * k, -2 * k); g.lineTo(0, -13 * k); g.lineTo(5 * k, -2 * k); g.closePath(); } g.fill();
          g.restore();
        }
        break;
      }
      case 'halo': g.strokeStyle = '#ffd43b'; g.shadowColor = '#fff3bf'; g.shadowBlur = 12; g.lineWidth = 5 * k; g.beginPath(); g.ellipse(x, top - 8 * k, 20 * k, 6 * k, 0, 0, 7); g.stroke(); break;
      case 'shades': { g.fillStyle = '#111'; for (const s of [-1, 1]) { g.beginPath(); g.roundRect(x + s * 11 * k - 9 * k, eyeY - 5 * k, 18 * k, 11 * k, 4 * k); g.fill(); } g.fillRect(x - 3 * k, eyeY - 3 * k, 6 * k, 2.5 * k); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - 17 * k, eyeY - 3 * k, 5 * k, 2 * k); break; }
      case 'heart': for (const s of [-1, 1]) emoji('❤️', x + s * 11 * k, eyeY, 19 * k); break;
      case 'star': for (const s of [-1, 1]) emoji('⭐', x + s * 11 * k, eyeY, 20 * k); break;
      case 'nerd': { g.strokeStyle = '#2b1a10'; g.lineWidth = 2.4 * k; for (const s of [-1, 1]) { g.beginPath(); g.arc(x + s * 11 * k, eyeY, 7.5 * k, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(x - 3.5 * k, eyeY); g.lineTo(x + 3.5 * k, eyeY); g.stroke(); break; }
      case 'balloon': { g.strokeStyle = '#495057'; g.lineWidth = 1.5 * k; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo(hx + dir * 14 * k, top - 10 * k, hx + dir * 6 * k, top - 34 * k); g.stroke(); emoji('🎈', hx + dir * 6 * k, top - 48 * k, 34 * k); break; }
      case 'lovesign': { g.fillStyle = '#c2255c'; g.fillRect(hx - 1.5 * k, hy - 4 * k, 3 * k, 30 * k); g.fillStyle = '#fff'; g.strokeStyle = '#c2255c'; g.lineWidth = 2.5 * k; g.beginPath(); g.roundRect(hx - 24 * k, hy - 28 * k, 48 * k, 24 * k, 5 * k); g.fill(); g.stroke(); g.fillStyle = '#e64980'; g.font = `900 ${12 * k}px "Be Vietnam Pro", system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LOVE ♥', hx, hy - 16 * k); break; }
      default: emoji(p.icon, hx, hy, (id === 'teddy' || id === 'cake' || id === 'bouquet' ? 30 : 24) * k, dir * 0.15);
    }
    g.restore();
  }
  /* ---------- 🤸 dáng chụp / động tác (dùng chung cho ảnh và khi gặp nhau ngoài đường) ---------- */
  const POSES = [
    { id: 'v', name: 'Tạo dáng', icon: '✌️' },
    { id: 'heart', name: 'Bắn tim', icon: '🫶' },
    { id: 'wave', name: 'Xin chào', icon: '👋' },
    { id: 'shake', name: 'Bắt tay', icon: '🤝' },
    { id: 'fist', name: 'Đấm nhau', icon: '🤜' },
    { id: 'jump', name: 'Nhảy lên', icon: '🤸' },
  ];
  const PAIR = { shake: 1, fist: 1 };
  /** vẽ động tác của 1 nhân vật đứng ở (x, y chân), cao 100·k, quay mặt dir; mate = toạ độ x người đối diện (bắt tay / đấm tay) */
  function gesture(g, kind, x, y, k, dir, t, mateX) {
    const top = y - 100 * k;
    const emoji = (ch, px, py, size, rot = 0) => { g.save(); g.globalAlpha = 1; g.fillStyle = '#000'; g.shadowBlur = 0; g.translate(px, py); g.rotate(rot); g.font = `${size}px system-ui, "Segoe UI Emoji"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 0, 0); g.restore(); };
    const mid = mateX != null ? (x + mateX) / 2 : null;
    switch (kind) {
      case 'v': emoji('✌️', x + dir * 30 * k, top + 34 * k, 28 * k, -0.25 * dir); break;
      case 'heart': emoji('🫶', x + dir * 6 * k, top + 66 * k, 28 * k); emoji('💗', x + dir * 22 * k, top - 4 * k - ((t * 30) % 24) * k, 16 * k); break;
      case 'wave': emoji('👋', x - dir * 32 * k, top + 26 * k, 30 * k, Math.sin(t * 12) * 0.4); break;
      case 'jump': emoji('✨', x - 22 * k, y + 2 * k, 18 * k); emoji('✨', x + 22 * k, y - 6 * k, 14 * k); break;
      case 'shake': emoji('🤝', mid ?? x + dir * 32 * k, top + 64 * k, 30 * k); break;
      case 'fist': {
        const c = mid ?? x + dir * 44 * k, hit = 1 + 0.25 * Math.abs(Math.sin(t * 8));
        if (mid != null) { emoji('🤜', c - 14 * k, top + 62 * k, 26 * k); emoji('🤛', c + 14 * k, top + 62 * k, 26 * k); }
        else emoji(dir > 0 ? '🤜' : '🤛', x + dir * 30 * k, top + 62 * k, 26 * k);
        emoji('💥', c + (mid != null ? 0 : dir * 18 * k), top + 46 * k, 20 * k * hit);
        break;
      }
      default:
    }
  }
  /** 1 khung ảnh: phông + mọi người + phụ kiện + động tác theo dáng */
  function drawShot(g, w, h, list, pose, t) {
    backdrop(g, w, h, sess.bg, t);
    const n = list.length, k = Math.min(3.2, (h * 0.62) / 100, (w / Math.max(1, n)) / 62), base = h * 0.9;
    const xs = list.map((p, i) => w / 2 + (i - (n - 1) / 2) * Math.min(w / (n + 0.3), 70 * k));
    list.forEach((p, i) => {
      const x = xs[i];
      // bắt tay / đấm tay: ghép từng cặp đứng quay mặt vào nhau
      const mate = PAIR[pose] ? (i % 2 === 0 ? (i + 1 < n ? i + 1 : -1) : i - 1) : -1;
      let dir = 1, dy = 0;
      if (mate >= 0) dir = xs[mate] > x ? 1 : -1;
      else if (pose === 'heart' || pose === 'v') dir = n > 1 && x > w / 2 ? -1 : 1;
      if (pose === 'jump') dy = -(14 + Math.abs(Math.sin(i * 1.7 + 1)) * 16) * k;
      const y = base + dy, top = y - 100 * k;
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x, base + 2 * k, 24 * k * (dy ? 0.7 : 1), 6 * k, 0, 0, 7); g.fill(); // bóng đổ dưới chân
      try { ART.character(g, x, y, p.look, { scale: 1.18 * k, t: 0, dir, hires: Math.min(4, Math.ceil(k * 1.2)) }); } catch (e) { /* bỏ qua */ }
      g.globalAlpha = 1; g.shadowBlur = 0;
      const d = (sess.dress[p.id]) || {};
      ['hat', 'eye', 'hand'].forEach((s) => { if (d[s]) drawProp(g, d[s], x, top, k, dir); });
      if (mate < 0 || i % 2 === 0) gesture(g, pose, x, y, k, dir, t, mate >= 0 ? xs[mate] : null);
    });
    if (pose === 'heart' && n >= 2) { g.save(); g.font = `${46 * k}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.globalAlpha = 0.9; g.fillText('💖', w / 2, base - 128 * k); g.restore(); }
  }
  /** dải 4 tấm: dáng đang chọn trước, rồi 3 dáng khác */
  const stripPoses = () => [sess.pose, ...['v', 'heart', 'wave', 'fist', 'shake', 'jump'].filter((x) => x !== sess.pose)].slice(0, 4);
  /** ảnh hoàn chỉnh có khung: layout 'one' (1 ảnh) | 'strip' (dải 4 ảnh) */
  function compose(list) {
    const fr = FRAMES.find((f) => f.id === sess.frame) || FRAMES[0], P = 26, FOOT = 74;
    const strip = sess.layout === 'strip', sw = strip ? 420 : 900, sh = strip ? 315 : 640, n = strip ? 4 : 1;
    const cv = document.createElement('canvas');
    cv.width = sw + P * 2; cv.height = P + n * (sh + (strip ? 16 : 0)) - (strip ? 16 : 0) + FOOT + P / 2;
    const g = cv.getContext('2d');
    g.fillStyle = fr.bg; g.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < n; i++) {
      const sc = document.createElement('canvas'); sc.width = sw; sc.height = sh;
      drawShot(sc.getContext('2d'), sw, sh, list, strip ? stripPoses()[i] : sess.pose, 0.4 + i);
      const y = P + i * (sh + 16);
      g.save(); g.beginPath(); g.roundRect(P, y, sw, sh, 10); g.clip(); g.drawImage(sc, P, y); g.restore();
    }
    const fy = cv.height - FOOT;
    g.fillStyle = fr.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `italic 900 ${strip ? 26 : 34}px "Be Vietnam Pro", system-ui`; g.fillText('📸 Quang Lâm Photobooth', cv.width / 2, fy + 22);
    g.font = `700 ${strip ? 13 : 16}px "Be Vietnam Pro", system-ui`;
    const d = new Date();
    g.fillText(`${list.map((p) => p.name).join(' · ').slice(0, 60)} — ${d.toLocaleDateString('vi-VN')}`, cv.width / 2, fy + 52);
    return cv;
  }

  /* ================= 🧑‍🎤 quầy chụp ================= */
  let panelRef = null, raf = 0;
  function open() {
    if (panelRef) return;
    const p = UI.panel('📸 Quang Lâm Photobooth', '', { wide: true, onClose: () => { cancelAnimationFrame(raf); panelRef = null; } });
    panelRef = p;
    if (!live()) { if (room && isHost()) { send({ a: 'close' }); room = null; } return intro(p); }
    studio(p);
  }
  function intro(p) {
    const fr = [...openRooms].filter(([h, o]) => Date.now() - o.at < 8000 && h !== myId() && isFriendPid(h) && o.members.length < MAX_PEOPLE);
    p.body.innerHTML = `<div class="pb-intro"><div class="pb-hero">📸</div>
      <h3>Quang Lâm Photobooth</h3>
      <p>Chụp ảnh nhân vật cùng bạn bè · phối đồ · thuê phụ kiện xinh xắn.</p>
      ${fr.length ? `<div class="pb-join">${fr.map(([h, o]) => `<button class="btn" data-join="${esc(h)}">🎉 Vào phòng chụp của ${esc(o.name)} (${o.members.length} người) — miễn phí</button>`).join('')}</div>` : ''}
      <div class="pb-price"><b>${fmt(PRICE)} xu</b> / lượt · chụp <b>thoải mái</b> trong ${SESSION_MIN} phút</div>
      <p class="muted">👥 Mở phòng xong bấm <b>✉️ Mời</b> để bạn bè (đã kết bạn) đang online vào chụp chung — chỉ người trong phòng mới có mặt trong ảnh.</p>
      <p class="muted">🏠 Phòng chụp 3D & 👑 phụ kiện thuê riêng từng món (500 – 3.000 xu) · 🖼️ khung ảnh miễn phí</p>
      <button class="btn" data-pay>💳 Trả ${fmt(PRICE)} xu & vào chụp</button></div>`;
    p.body.querySelectorAll('[data-join]').forEach((b) => b.onclick = () => join(b.dataset.join));
    p.body.querySelector('[data-pay]').onclick = () => {
      if (!AV.spend(PRICE)) return UI.toast(`Cần ${fmt(PRICE)} xu để chụp 😢`);
      if (isMember()) leaveRoom();
      sess = { until: Date.now() + SESSION_MIN * 60000, rent: new Set(['studio']), dress: {}, bg: 'r_studio', frame: 'pink', layout: 'strip', pose: 'v', skip: new Set() };
      room = { host: myId(), members: [myId()] };
      hostSync();
      UI.toast('📸 Chào mừng tới Quang Lâm Photobooth! Chụp thoải mái nhé ✨', 3500);
      studio(p);
    };
  }
  function studio(p) {
    let tab = 'pose', who = myId();
    const list = () => people().filter((x) => !sess.skip.has(x.id));
    const render = () => {
      if (!live()) { if (isHost()) send({ a: 'close' }); room = null; sess = null; UI.toast('⌛ Hết lượt chụp rồi — trả thêm để chụp tiếp nhé'); return intro(p); }
      const host = isHost(), member = isMember();
      if (member) { who = myId(); if (['pose', 'bg', 'frame'].includes(tab)) tab = 'hat'; }
      p._render = render;
      const friendsNear = host ? onlineFriends() : [];
      const all = people(), left = Math.max(0, sess.until - Date.now()), mm = Math.floor(left / 60000), ss = Math.floor(left / 1000) % 60;
      const items = tab === 'bg' ? BACKDROPS : tab === 'frame' ? FRAMES : PROPS.filter((x) => x.slot === tab);
      const d = sess.dress[who] || {};
      p.body.innerHTML = `<div class="pb-wrap">
        <div class="pb-left"><canvas class="pb-prev" width="640" height="480"></canvas><div class="pb-flash"></div><div class="pb-count"></div>
          <div class="pb-ppl">${all.map((x) => `<button class="${sess.skip.has(x.id) ? 'off' : ''} ${who === x.id ? 'sel' : ''}" data-who="${esc(x.id)}">${x.id === room.host ? '👑' : x.me ? '🙋' : '🧑'} ${esc(x.name)}</button>`).join('')}</div>
          ${host ? (friendsNear.length ? `<div class="pb-inv"><b>👥 Mời bạn bè:</b>${friendsNear.map((r) => `<button class="chip" data-inv="${esc(r.id)}">✉️ ${esc(r.name)}</button>`).join('')}</div>` : '<small class="muted">👥 Bạn bè (đã kết bạn) đang online sẽ hiện ở đây để mời vào chụp chung</small>') : `<small class="muted">👑 Phòng của ${esc((openRooms.get(room.host) || {}).name || 'chủ phòng')} · bạn tự chọn phụ kiện cho mình, chủ phòng chọn dáng / phông / khung và bấm chụp</small>`}
          <small class="muted">${host ? 'Bấm tên để chọn người đeo phụ kiện · bấm lần nữa để ẩn/hiện người đó trong ảnh' : ''}</small></div>
        <div class="pb-right">
          <div class="pb-time">⏳ Còn <b>${mm}:${String(ss).padStart(2, '0')}</b> · 💰 ${fmt(AV.S.coins)} xu</div>
          <div class="pb-tabs">${[...(member ? [] : [['pose', '🤸 Dáng'], ['bg', '🏠 Phòng']]), ...SLOTS.map((s) => [s[0], s[1].split(' ')[0] + ' ' + s[1].split(' ')[1]]), ...(member ? [] : [['frame', '🖼️ Khung']])].map((t) => `<button class="${tab === t[0] ? 'on' : ''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div>
          <div class="pb-items">${tab === 'pose' ? POSES.map((x) => `<button class="pb-it ${sess.pose === x.id ? 'on' : ''}" data-pose="${x.id}"><span>${x.icon}</span><b>${x.name}</b><small>${sess.pose === x.id ? 'Đang chọn' : 'Miễn phí'}</small></button>`).join('') + `<small class="muted" style="grid-column:1/-1">${sess.layout === 'strip' ? '🎞️ Dải 4 tấm: ' + stripPoses().map((id) => POSES.find((x) => x.id === id).icon).join(' → ') : '🖼️ 1 tấm lớn theo dáng đang chọn'} · 🤝🤜 Bắt tay / đấm nhau: ghép từng cặp</small>` : tab === 'frame' ? items.map((f) => `<button class="pb-it ${sess.frame === f.id ? 'on' : ''}" data-frame="${f.id}"><span style="background:${f.bg};border:2px solid ${f.ink}" class="pb-sw"></span><b>${f.name}</b><small>Miễn phí</small></button>`).join('')
            : (tab !== 'bg' ? `<button class="pb-it ${!d[tab] ? 'on' : ''}" data-off="${tab}"><span>🚫</span><b>Không đeo</b><small>&nbsp;</small></button>` : '')
              + items.map((it) => { const has = it.price === 0 || sess.rent.has(it.id), on = tab === 'bg' ? sess.bg === it.id : d[tab] === it.id; return `<button class="pb-it ${on ? 'on' : ''} ${has ? '' : 'lock'}" data-item="${it.id}"><span>${it.icon}</span><b>${it.name}</b><small>${has ? (on ? 'Đang dùng' : 'Đã thuê ✓') : 'Thuê ' + fmt(it.price) + ' xu'}</small></button>`; }).join('')}</div>
          <div class="pb-opts" ${member ? 'hidden' : ''}><span>Kiểu ảnh:</span><button class="${sess.layout === 'strip' ? 'on' : ''}" data-lay="strip">🎞️ Dải 4 tấm</button><button class="${sess.layout === 'one' ? 'on' : ''}" data-lay="one">🖼️ 1 tấm lớn</button></div>
          <div class="pb-acts"><button class="btn ghost" data-wear>👗 Phối đồ</button>${member ? '<button class="btn ghost" data-leaveroom>🚪 Rời phòng</button><span class="wait">⏳ Chờ chủ phòng bấm chụp…</span>' : '<button class="btn" data-shoot>📸 Chụp!</button>'}</div>
        </div></div>`;
      p.body.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      p.body.querySelectorAll('[data-inv]').forEach((b) => b.onclick = () => { send({ a: 'invite', to: b.dataset.inv, name: AV.S.name }); UI.toast('✉️ Đã gửi lời mời chụp chung'); b.disabled = true; });
      const lr = p.body.querySelector('[data-leaveroom]'); if (lr) lr.onclick = () => { leaveRoom(); p.close(); UI.toast('Đã rời phòng chụp'); };
      p.body.querySelectorAll('[data-who]').forEach((b) => b.onclick = () => {
        const id = b.dataset.who;
        if (member) return UI.toast('Bạn chỉ chọn phụ kiện cho mình thôi nhé');
        if (who === id) { if (sess.skip.has(id)) sess.skip.delete(id); else if (list().length > 1) sess.skip.add(id); else UI.toast('Ảnh phải có ít nhất 1 người'); }
        who = id; render();
      });
      p.body.querySelectorAll('[data-frame]').forEach((b) => b.onclick = () => { sess.frame = b.dataset.frame; render(); });
      p.body.querySelectorAll('[data-pose]').forEach((b) => b.onclick = () => { sess.pose = b.dataset.pose; render(); });
      p.body.querySelectorAll('[data-off]').forEach((b) => b.onclick = () => { const dd = sess.dress[who] || (sess.dress[who] = {}); delete dd[b.dataset.off]; if (member) send({ a: 'dress', to: room.host, d: dd }); render(); });
      p.body.querySelectorAll('[data-lay]').forEach((b) => b.onclick = () => { sess.layout = b.dataset.lay; render(); });
      p.body.querySelectorAll('[data-item]').forEach((b) => b.onclick = () => {
        const it = (tab === 'bg' ? BACKDROPS : PROPS).find((x) => x.id === b.dataset.item);
        const use = () => { if (tab === 'bg') sess.bg = it.id; else { const dd = sess.dress[who] || (sess.dress[who] = {}); dd[tab] = dd[tab] === it.id ? '' : it.id; if (member) send({ a: 'dress', to: room.host, d: dd }); } render(); };
        if (it.price === 0 || sess.rent.has(it.id)) return use();
        UI.confirm(`Thuê <b>${it.icon} ${it.name}</b> giá <b>${fmt(it.price)} xu</b> cho lượt chụp này?`, 'Thuê', () => {
          if (!AV.spend(it.price)) return UI.toast('Không đủ xu 😢');
          sess.rent.add(it.id); UI.toast(`✅ Đã thuê ${it.icon} ${it.name}`); use();
        });
      });
      p.body.querySelector('[data-wear]').onclick = () => { if (typeof WARDROBE !== 'undefined' && WARDROBE.mine) WARDROBE.mine(); };
      const sb = p.body.querySelector('[data-shoot]'); if (sb) sb.onclick = () => { send({ a: 'shoot' }); shoot(p, render); };
      if (host) hostSync();
      loop(p);
    };
    render();
    clearInterval(p._tick); p._tick = setInterval(() => { if (!panelRef) return clearInterval(p._tick); const t = p.body.querySelector('.pb-time b'); if (t && sess) { const left = Math.max(0, sess.until - Date.now()); t.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`; if (!left) render(); } }, 1000);
    function loop(pp) {
      cancelAnimationFrame(raf);
      const cv = pp.body.querySelector('.pb-prev');
      if (!cv) return;
      const g = cv.getContext('2d');
      const frame = (now) => { if (!cv.isConnected || !sess) return; g.clearRect(0, 0, 640, 480); drawShot(g, 640, 480, list(), sess.pose, now / 1000); raf = requestAnimationFrame(frame); };
      raf = requestAnimationFrame(frame);
    }
  }
  /** đếm ngược 3-2-1, đèn flash, chụp (dải 4 tấm thì nháy 4 lần) rồi hiện ảnh */
  async function shoot(p, back) {
    if (shooting) return;
    shooting = true;
    try { await shootRun(p, back); } finally { shooting = false; }
  }
  async function shootRun(p, back) {
    const btn = p.body.querySelector('[data-shoot]'); if (btn) btn.disabled = true;
    const cnt = p.body.querySelector('.pb-count'), fl = p.body.querySelector('.pb-flash');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const snaps = sess.layout === 'strip' ? 4 : 1;
    for (let s = 0; s < snaps; s++) {
      for (const n of [3, 2, 1]) { if (!cnt || !cnt.isConnected) return; cnt.textContent = n; cnt.classList.add('on'); await wait(s ? 450 : 750); }
      cnt.textContent = s < snaps - 1 ? `${s + 1}/${snaps}` : '📸'; fl.classList.remove('on'); void fl.offsetWidth; fl.classList.add('on');
      if (typeof MUSIC !== 'undefined' && MUSIC.clack) MUSIC.clack();
      await wait(350);
    }
    cnt.classList.remove('on');
    const list = people().filter((x) => !sess.skip.has(x.id));
    const cv = compose(list);
    result(p, cv, back);
  }
  function result(p, cv, back) {
    cancelAnimationFrame(raf);
    const url = cv.toDataURL('image/png');
    p.body.innerHTML = `<div class="pb-result"><img src="${url}" alt="Ảnh photobooth"><div class="pb-acts">
      <button class="btn" data-dl>💾 Tải ảnh về máy</button><button class="btn ghost" data-gram>📲 Đăng ZenoGram</button><button class="btn ghost" data-again>🔁 Chụp tiếp</button></div>
      <small class="muted">Lượt chụp còn hiệu lực — chụp bao nhiêu tấm cũng được 😉</small></div>`;
    p.body.querySelector('[data-dl]').onclick = () => { const a = document.createElement('a'); a.href = url; a.download = `quanglam-photobooth-${Date.now()}.png`; document.body.appendChild(a); a.click(); a.remove(); };
    p.body.querySelector('[data-again]').onclick = () => (sess ? studio(p) : intro(p));
    p.body.querySelector('[data-gram]').onclick = () => {
      if (typeof CHATIMG === 'undefined' || typeof PHONE === 'undefined') return UI.toast('Chưa đăng được lúc này');
      if (!PHONE.has()) return UI.toast('📱 Cần có điện thoại để đăng ZenoGram');
      cv.toBlob((blob) => {
        p.close();
        CHATIMG.pickAndSend(new File([blob], 'photobooth.jpg', { type: 'image/png' }), (u) => { PHONE.open(); setTimeout(() => PHONE.openApp('gram', u), 120); }, '📸 Ảnh Photobooth cho ZenoGram');
      }, 'image/png');
    };
    AV.sayMine('📸 Cheese~ ✌️');
  }

  /* giao diện */
  if (!document.getElementById('pb-css')) {
    const st = document.createElement('style'); st.id = 'pb-css';
    st.textContent = `
.pb-intro { display: grid; justify-items: center; text-align: center; gap: 6px; padding: 6px 4px; }
.pb-intro h3 { margin: 0; font-size: 22px; background: linear-gradient(90deg,#ae3ec9,#e64980); -webkit-background-clip: text; background-clip: text; color: transparent; font-style: italic; }
.pb-hero { font-size: 60px; } .pb-intro p { margin: 0; font-size: 13px; }
.pb-price { background: #fff0f6; border: 2px dashed #e64980; border-radius: 12px; padding: 8px 14px; color: #a61e4d; }
.pb-wrap { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 12px; }
.pb-left { position: relative; display: grid; gap: 6px; align-content: start; }
.pb-prev { width: 100%; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,.18); background: #fff; aspect-ratio: 4 / 3; }
.pb-flash { position: absolute; left: 0; top: 0; width: 100%; aspect-ratio: 4 / 3; border-radius: 12px; background: #fff; opacity: 0; pointer-events: none; }
.pb-flash.on { animation: pbFlash .45s ease-out; } @keyframes pbFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
.pb-count { position: absolute; left: 0; top: 0; width: 100%; aspect-ratio: 4 / 3; display: grid; place-items: center; font: 900 90px "Be Vietnam Pro", system-ui; color: #fff; text-shadow: 0 4px 18px rgba(0,0,0,.5); opacity: 0; pointer-events: none; }
.pb-count.on { opacity: 1; }
.pb-join { display: grid; gap: 6px; width: 100%; } .pb-inv { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: 12px; }
.pb-ppl { display: flex; flex-wrap: wrap; gap: 5px; } .pb-ppl button { border: 2px solid #e9ecef; background: #fff; border-radius: 999px; padding: 4px 10px; font: inherit; font-size: 12px; cursor: pointer; }
.pb-ppl button.sel { border-color: #e64980; background: #fff0f6; font-weight: 800; } .pb-ppl button.off { opacity: .45; text-decoration: line-through; }
.pb-right { display: grid; gap: 8px; align-content: start; min-width: 0; }
.pb-time { font-size: 13px; }
.pb-tabs { display: flex; gap: 4px; flex-wrap: wrap; } .pb-tabs button { border: 0; background: #f1f3f5; border-radius: 999px; padding: 5px 10px; font: inherit; font-size: 12px; cursor: pointer; } .pb-tabs button.on { background: #e64980; color: #fff; font-weight: 800; }
.pb-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 6px; max-height: 260px; overflow-y: auto; padding: 2px; }
.pb-it { border: 2px solid #e9ecef; background: #fff; border-radius: 12px; padding: 6px 4px; display: grid; justify-items: center; gap: 1px; font: inherit; cursor: pointer; }
.pb-it span { font-size: 26px; line-height: 1.1; } .pb-it b { font-size: 11px; } .pb-it small { font-size: 10px; color: #2b8a3e; font-weight: 700; }
.pb-it.lock small { color: #e8590c; } .pb-it.on { border-color: #e64980; background: #fff0f6; }
.pb-sw { width: 30px; height: 22px; border-radius: 5px; display: block; }
.pb-opts { display: flex; gap: 5px; align-items: center; flex-wrap: wrap; font-size: 12px; } .pb-opts button { border: 2px solid #e9ecef; background: #fff; border-radius: 10px; padding: 4px 8px; font: inherit; font-size: 12px; cursor: pointer; } .pb-opts button.on { border-color: #ae3ec9; background: #f8f0fc; font-weight: 800; }
.pb-acts { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; } .pb-acts .btn { flex: 1; min-width: 120px; }
.pb-result { display: grid; justify-items: center; gap: 10px; } .pb-result img { max-width: 100%; max-height: 62vh; border-radius: 8px; box-shadow: 0 6px 20px rgba(0,0,0,.25); }
.gest-row { grid-column: 1 / -1; flex-basis: 100%; width: 100%; display: flex; gap: 4px; flex-wrap: wrap; padding-bottom: 4px; margin-bottom: 2px; border-bottom: 1px dashed rgba(0,0,0,.15); }
.gest-row button { flex: 1; min-width: 52px; display: grid; justify-items: center; font-size: 20px !important; line-height: 1.1; padding: 3px 2px !important; }
.gest-row button small { font-size: 9px; font-weight: 800; }
@media (max-width: 720px) { .pb-wrap { grid-template-columns: 1fr; } .pb-items { max-height: 180px; } }
`;
    document.head.appendChild(st);
  }
  return { open, addTo, drawKiosk, PRICE, gesture, POSES, onNet };
})();
