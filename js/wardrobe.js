/* 👗 THỜI TRANG 4 MÙA cho nhân vật vẽ (ảnh Bạn nam / Bạn nữ).
 * Ảnh gốc mặc áo phông trắng + quần bò (nam) / chân váy xanh (nữ) + giày trắng. Ở đây tự dò vùng áo, quần/váy, giày,
 * tay, chân trên ảnh rồi "may" đồ mới lên: tô vải (giữ nếp gấp và bóng của ảnh gốc), vẽ thêm chi tiết
 * (mũ hoodie, khoá kéo, cà vạt, số áo…), kéo dài thành váy dài / quần dài / bốt… Tóc không bị đè vì chỉ tô đúng điểm ảnh quần áo.
 * Đồ đang mặc lưu ở look.wear = "áo|quần|bộ|giày" (id), đồng bộ qua mạng như các món đồ khác. */
const WARDROBE = (() => {
  const OUT = '#3a2214';
  const SEASON = { x: '🌸 Xuân', h: '☀️ Hạ', t: '🍂 Thu', d: '❄️ Đông' };
  const ALL4 = 'xhtd';
  /** slot: top | bottom | full (váy / cả bộ) | shoes · g: u (ai cũng mặc), m (nam), f (nữ) */
  const ITEMS = [
    // ---------- 👕 áo ----------
    { id: 'tee_red', slot: 'top', g: 'u', ss: 'h', price: 15000, name: 'Áo phông đỏ', top: { col: '#e03131', sleeve: 'short' } },
    { id: 'tee_stripe', slot: 'top', g: 'u', ss: 'xh', price: 25000, name: 'Áo phông kẻ ngang', top: { col: '#f8f9fa', col2: '#1c3d7a', pat: 'stripes', sleeve: 'short' } },
    { id: 'polo', slot: 'top', g: 'u', ss: 'xh', price: 45000, name: 'Áo polo navy', top: { col: '#1b2f6b', col2: '#f8f9fa', sleeve: 'short', det: 'polo' } },
    { id: 'hawaii', slot: 'top', g: 'u', ss: 'h', price: 60000, name: 'Sơ mi hoa Hawaii', top: { col: '#1098ad', col2: '#ff6b6b', pat: 'hawaii', sleeve: 'short', det: 'shirtOpen' } },
    { id: 'tank', slot: 'top', g: 'f', ss: 'h', price: 40000, name: 'Áo hai dây', top: { col: '#ffd8e8', sleeve: 'none', det: 'tank' } },
    { id: 'crop', slot: 'top', g: 'f', ss: 'h', price: 50000, name: 'Áo croptop', top: { col: '#f3f0ff', col2: '#845ef7', sleeve: 'short', crop: 1, det: 'crop' } },
    { id: 'hoodie_grey', slot: 'top', g: 'u', ss: 'td', price: 80000, name: 'Hoodie xám basic', top: { col: '#a9b1bd', sleeve: 'long', det: 'hoodie' } },
    { id: 'hoodie_pink', slot: 'top', g: 'u', ss: 'td', price: 90000, name: 'Hoodie hồng pastel', top: { col: '#ffb3cf', sleeve: 'long', det: 'hoodie' } },
    { id: 'hoodie_black', slot: 'top', g: 'u', ss: 'td', price: 120000, name: 'Hoodie đen in chữ', top: { col: '#2b2f36', col2: '#ffd43b', sleeve: 'long', det: 'hoodie', text: 'ZENO' } },
    { id: 'sweater_noel', slot: 'top', g: 'u', ss: 'd', price: 120000, name: 'Áo len Noel', top: { col: '#c92a2a', col2: '#f8f9fa', pat: 'knit', sleeve: 'long', det: 'knitCollar' } },
    { id: 'sweater_cream', slot: 'top', g: 'u', ss: 'td', price: 110000, name: 'Áo len cổ lọ kem', top: { col: '#efe1c6', col2: '#d8c3a0', pat: 'cable', sleeve: 'long', det: 'turtle' } },
    { id: 'cardigan', slot: 'top', g: 'u', ss: 'xt', price: 95000, name: 'Cardigan len vàng', top: { col: '#ffe066', col2: '#f8f9fa', sleeve: 'long', det: 'cardigan' } },
    { id: 'bomber_olive', slot: 'top', g: 'u', ss: 'xt', price: 180000, name: 'Áo khoác bomber rêu', top: { col: '#5c6b3a', col2: '#2b2f36', sleeve: 'long', det: 'bomber' } },
    { id: 'bomber_black', slot: 'top', g: 'u', ss: 'xt', price: 260000, name: 'Bomber đen thêu hổ', top: { col: '#212529', col2: '#c92a2a', sleeve: 'long', det: 'bomber', emb: 'tiger' } },
    { id: 'denim_jacket', slot: 'top', g: 'u', ss: 'xt', price: 220000, name: 'Áo khoác bò', top: { col: '#5b84c4', col2: '#3f6aa8', pat: 'denim', sleeve: 'long', det: 'denim' } },
    { id: 'puffer', slot: 'top', g: 'u', ss: 'd', price: 300000, name: 'Áo phao siêu ấm', top: { col: '#20c4b8', sleeve: 'long', det: 'puffer' } },
    { id: 'leather', slot: 'top', g: 'u', ss: 'td', price: 450000, name: 'Áo khoác da biker', top: { col: '#262a33', col2: '#adb5bd', sleeve: 'long', det: 'leather' } },
    // ---------- 👖 quần / chân váy ----------
    { id: 'jeans_dark', slot: 'bottom', g: 'u', ss: ALL4, price: 60000, name: 'Quần jeans xanh đậm', bot: { col: '#2c4a8a', col2: '#c9a227', pat: 'denim', cut: 'long', det: 'jeans' } },
    { id: 'jeans_black', slot: 'bottom', g: 'u', ss: ALL4, price: 70000, name: 'Quần jeans đen', bot: { col: '#2b2f36', col2: '#868e96', pat: 'denim', cut: 'long', det: 'jeans' } },
    { id: 'jeans_ripped', slot: 'bottom', g: 'u', ss: 'xht', price: 90000, name: 'Quần jeans rách gối', bot: { col: '#8fb0ee', col2: '#c9a227', pat: 'denim', cut: 'long', det: 'jeans', ripped: 1 } },
    { id: 'kaki', slot: 'bottom', g: 'u', ss: ALL4, price: 70000, name: 'Quần kaki be', bot: { col: '#d4b98c', cut: 'long', det: 'crease' } },
    { id: 'jogger', slot: 'bottom', g: 'u', ss: 'xtd', price: 65000, name: 'Quần jogger thể thao', bot: { col: '#343a40', col2: '#f8f9fa', cut: 'long', det: 'stripe', cuff: 1 } },
    { id: 'trousers', slot: 'bottom', g: 'u', ss: ALL4, price: 150000, name: 'Quần âu đen', bot: { col: '#22252b', cut: 'long', det: 'crease' } },
    { id: 'shorts_denim', slot: 'bottom', g: 'u', ss: 'h', price: 45000, name: 'Quần short jeans', bot: { col: '#5b84c4', pat: 'denim', cut: 'short', det: 'fray' } },
    { id: 'shorts_kaki', slot: 'bottom', g: 'u', ss: 'h', price: 40000, name: 'Quần short kaki', bot: { col: '#c9b48a', cut: 'short' } },
    { id: 'skirt_tennis', slot: 'bottom', g: 'f', ss: 'xh', price: 55000, name: 'Chân váy tennis trắng', bot: { col: '#f8f9fa', col2: '#dee2e6', cut: 'skirt', det: 'pleat' } },
    { id: 'skirt_plaid', slot: 'bottom', g: 'f', ss: 'xtd', price: 75000, name: 'Chân váy kẻ caro', bot: { col: '#a61e4d', col2: '#212529', col3: '#ffd43b', pat: 'plaid', cut: 'skirt', det: 'pleat' } },
    { id: 'skirt_denim', slot: 'bottom', g: 'f', ss: 'xh', price: 65000, name: 'Chân váy bò', bot: { col: '#4f74b3', pat: 'denim', cut: 'skirt', det: 'skirtDenim' } },
    { id: 'skirt_long', slot: 'bottom', g: 'f', ss: 'xht', price: 120000, name: 'Chân váy dài voan', bot: { col: '#e5dbff', col2: '#d0bfff', cut: 'skirtLong' } },
    // ---------- 👗 váy liền ----------
    { id: 'dress_floral', slot: 'full', g: 'f', ss: 'xh', price: 150000, name: 'Váy hoa nhí vintage', top: { col: '#fff4e6', col2: '#ff8787', pat: 'flowers', sleeve: 'short', det: 'sweetheart' }, bot: { col: '#fff4e6', col2: '#ff8787', pat: 'flowers', cut: 'skirt', det: 'frill' } },
    { id: 'dress_baby', slot: 'full', g: 'f', ss: 'xh', price: 180000, name: 'Váy babydoll hồng', top: { col: '#ffc9de', sleeve: 'short', det: 'bow' }, bot: { col: '#ffc9de', col2: '#ffffff', cut: 'skirt', det: 'frill' } },
    { id: 'dress_polka', slot: 'full', g: 'f', ss: 'xh', price: 160000, name: 'Váy chấm bi đỏ', top: { col: '#e03131', col2: '#ffffff', pat: 'dots', sleeve: 'short', det: 'belt' }, bot: { col: '#e03131', col2: '#ffffff', pat: 'dots', cut: 'skirt' } },
    { id: 'dress_white', slot: 'full', g: 'f', ss: 'xh', price: 220000, name: 'Váy trắng tiểu thư', top: { col: '#ffffff', col2: '#ffd8a8', sleeve: 'short', det: 'lace' }, bot: { col: '#ffffff', col2: '#e9ecef', cut: 'skirt', det: 'frill' } },
    { id: 'dress_pinafore', slot: 'full', g: 'f', ss: 'xt', price: 140000, name: 'Váy yếm bò', top: { keep: 1, det: 'pinafore', col: '#4f74b3' }, bot: { col: '#4f74b3', pat: 'denim', cut: 'skirt', det: 'skirtDenim' } },
    { id: 'dress_knit', slot: 'full', g: 'f', ss: 'd', price: 240000, name: 'Váy len mùa đông', top: { col: '#b5651d', col2: '#d9a066', pat: 'cable', sleeve: 'long', det: 'turtle' }, bot: { col: '#b5651d', col2: '#d9a066', pat: 'cable', cut: 'skirt' } },
    { id: 'dress_maxi', slot: 'full', g: 'f', ss: 'h', price: 260000, name: 'Váy maxi đi biển', top: { col: '#ffe8cc', col2: '#ff922b', pat: 'hawaii', sleeve: 'none', det: 'tank' }, bot: { col: '#ffe8cc', col2: '#ff922b', pat: 'hawaii', cut: 'gown' } },
    { id: 'dress_party', slot: 'full', g: 'f', ss: ALL4, price: 900000, name: 'Váy dạ hội đỏ lấp lánh', top: { col: '#c2121f', col2: '#ffd6d6', pat: 'sparkle', sleeve: 'none', det: 'tank' }, bot: { col: '#c2121f', col2: '#ffd6d6', pat: 'sparkle', cut: 'gown', slit: 1 } },
    { id: 'dress_princess', slot: 'full', g: 'f', ss: ALL4, price: 1200000, name: 'Váy công chúa', top: { col: '#f783ac', col2: '#fff0f6', pat: 'sparkle', sleeve: 'short', det: 'puffSleeve' }, bot: { col: '#f783ac', col2: '#fff0f6', pat: 'sparkle', cut: 'ball' } },
    { id: 'dress_wedding', slot: 'full', g: 'f', ss: ALL4, price: 2500000, name: 'Váy cưới trắng', top: { col: '#ffffff', col2: '#e9ecef', pat: 'lace', sleeve: 'none', det: 'lace' }, bot: { col: '#ffffff', col2: '#e9ecef', pat: 'lace', cut: 'ball' } },
    { id: 'aodai_red', slot: 'full', g: 'f', ss: 'x', price: 600000, name: 'Áo dài đỏ du xuân', top: { col: '#d6001c', col2: '#ffd43b', pat: 'flowers', sleeve: 'long', det: 'aodai' }, bot: { col: '#fff9db', cut: 'long', aodai: 1 } },
    { id: 'aodai_white', slot: 'full', g: 'f', ss: ALL4, price: 450000, name: 'Áo dài trắng nữ sinh', top: { col: '#ffffff', sleeve: 'long', det: 'aodai' }, bot: { col: '#ffffff', cut: 'long', aodai: 1 } },
    // ---------- 🧥 cả bộ ----------
    { id: 'aodai_m', slot: 'full', g: 'm', ss: 'x', price: 500000, name: 'Áo dài nam gấm', top: { col: '#1d3f8a', col2: '#ffd43b', pat: 'brocade', sleeve: 'long', det: 'aodai' }, bot: { col: '#f8f9fa', cut: 'long', aodai: 1 } },
    { id: 'suit_black', slot: 'full', g: 'u', ss: ALL4, price: 1500000, name: 'Bộ vest đen lịch lãm', top: { col: '#1f2228', col2: '#c92a2a', sleeve: 'long', det: 'suit' }, bot: { col: '#1f2228', cut: 'long', det: 'crease' } },
    { id: 'suit_navy', slot: 'full', g: 'u', ss: ALL4, price: 1300000, name: 'Bộ vest xanh navy', top: { col: '#1b2f6b', col2: '#74c0fc', sleeve: 'long', det: 'suit' }, bot: { col: '#1b2f6b', cut: 'long', det: 'crease' } },
    { id: 'suit_white', slot: 'full', g: 'u', ss: ALL4, price: 2200000, name: 'Vest trắng chú rể', top: { col: '#f8f9fa', col2: '#212529', sleeve: 'long', det: 'suit', bow: 1 }, bot: { col: '#f1f3f5', cut: 'long', det: 'crease' } },
    { id: 'kit_vn', slot: 'full', g: 'u', ss: 'xh', price: 200000, name: 'Bộ đá bóng đỏ (số 10)', top: { col: '#da291c', col2: '#ffd43b', sleeve: 'short', det: 'jersey', num: '10' }, bot: { col: '#da291c', col2: '#ffd43b', cut: 'short', socks: '#da291c', det: 'kitStripe' } },
    { id: 'kit_blue', slot: 'full', g: 'u', ss: 'xh', price: 180000, name: 'Bộ đá bóng xanh (số 7)', top: { col: '#1c49c2', col2: '#ffffff', sleeve: 'short', det: 'jersey', num: '7' }, bot: { col: '#ffffff', col2: '#1c49c2', cut: 'short', socks: '#1c49c2', det: 'kitStripe' } },
    { id: 'kit_white', slot: 'full', g: 'u', ss: 'xh', price: 180000, name: 'Bộ đá bóng trắng (số 9)', top: { col: '#f8f9fa', col2: '#c9a227', sleeve: 'short', det: 'jersey', num: '9' }, bot: { col: '#f8f9fa', col2: '#c9a227', cut: 'short', socks: '#f8f9fa', det: 'kitStripe' } },
    { id: 'pj_star', slot: 'full', g: 'u', ss: ALL4, price: 90000, name: 'Đồ ngủ sao xanh', top: { col: '#4263eb', col2: '#ffe066', pat: 'stars', sleeve: 'long', det: 'pajama' }, bot: { col: '#4263eb', col2: '#ffe066', pat: 'stars', cut: 'long' } },
    { id: 'pj_heart', slot: 'full', g: 'u', ss: ALL4, price: 90000, name: 'Đồ ngủ trái tim hồng', top: { col: '#ffc9de', col2: '#f03e3e', pat: 'hearts', sleeve: 'long', det: 'pajama' }, bot: { col: '#ffc9de', col2: '#f03e3e', pat: 'hearts', cut: 'long' } },
    { id: 'pj_dino', slot: 'full', g: 'u', ss: ALL4, price: 120000, name: 'Đồ ngủ khủng long', top: { col: '#69db7c', col2: '#2f9e44', pat: 'dots', sleeve: 'long', det: 'dino' }, bot: { col: '#69db7c', col2: '#2f9e44', pat: 'dots', cut: 'long' } },
    { id: 'beach_m', slot: 'full', g: 'm', ss: 'h', price: 120000, name: 'Đồ đi biển (sơ mi hoa + quần đùi)', top: { col: '#ffd43b', col2: '#e8590c', pat: 'hawaii', sleeve: 'short', det: 'shirtOpen' }, bot: { col: '#1098ad', col2: '#ffffff', cut: 'short', det: 'kitStripe' } },
    { id: 'bikini_red', slot: 'full', g: 'f', ss: 'h', price: 150000, name: 'Bikini đỏ đi biển', top: { bare: 1, col: '#e03131', det: 'bikini' }, bot: { bare: 1, col: '#e03131', cut: 'bikini' } },
    { id: 'bikini_tropic', slot: 'full', g: 'f', ss: 'h', price: 180000, name: 'Bikini hoa nhiệt đới', top: { bare: 1, col: '#15aabf', col2: '#ffd43b', pat: 'flowers', det: 'bikini' }, bot: { bare: 1, col: '#15aabf', col2: '#ffd43b', pat: 'flowers', cut: 'bikini' } },
    // ---------- 👟 giày ----------
    { id: 'sh_white', slot: 'shoes', g: 'u', ss: ALL4, price: 50000, name: 'Sneaker trắng', sh: { col: '#f8f9fa', col2: '#212529', kind: 'sneaker' } },
    { id: 'sh_red', slot: 'shoes', g: 'u', ss: ALL4, price: 70000, name: 'Sneaker đỏ', sh: { col: '#e03131', col2: '#ffffff', kind: 'sneaker' } },
    { id: 'sh_high', slot: 'shoes', g: 'u', ss: ALL4, price: 350000, name: 'Sneaker cổ cao', sh: { col: '#c92a2a', col2: '#212529', kind: 'high' } },
    { id: 'sh_run', slot: 'shoes', g: 'u', ss: ALL4, price: 120000, name: 'Giày chạy bộ neon', sh: { col: '#a9e34b', col2: '#212529', kind: 'sneaker' } },
    { id: 'sh_oxford', slot: 'shoes', g: 'u', ss: ALL4, price: 400000, name: 'Giày âu da đen', sh: { col: '#17191d', kind: 'oxford' } },
    { id: 'sh_brown', slot: 'shoes', g: 'u', ss: ALL4, price: 380000, name: 'Giày tây da nâu', sh: { col: '#6b3a1f', kind: 'oxford' } },
    { id: 'sh_boots', slot: 'shoes', g: 'u', ss: 'td', price: 300000, name: 'Bốt da mùa đông', sh: { col: '#7a4a26', col2: '#f1f3f5', kind: 'boots' } },
    { id: 'sh_heels', slot: 'shoes', g: 'f', ss: ALL4, price: 250000, name: 'Giày cao gót đỏ', sh: { col: '#c2121f', kind: 'heels' } },
    { id: 'sh_heels_w', slot: 'shoes', g: 'f', ss: ALL4, price: 260000, name: 'Cao gót trắng ngọc', sh: { col: '#f8f9fa', kind: 'heels' } },
    { id: 'sh_mary', slot: 'shoes', g: 'f', ss: ALL4, price: 90000, name: 'Giày búp bê', sh: { col: '#212529', col2: '#e03131', kind: 'mary' } },
    { id: 'sh_cleats', slot: 'shoes', g: 'u', ss: 'xh', price: 150000, name: 'Giày đá bóng', sh: { col: '#ff922b', col2: '#212529', kind: 'cleats' } },
    { id: 'sh_sandal', slot: 'shoes', g: 'u', ss: 'h', price: 30000, name: 'Dép xăng đan', sh: { col: '#5c3a1e', kind: 'sandal' } },
    { id: 'sh_flip', slot: 'shoes', g: 'u', ss: 'h', price: 15000, name: 'Dép tông đi biển', sh: { col: '#15aabf', kind: 'flip' } },
    { id: 'sh_slipper', slot: 'shoes', g: 'u', ss: ALL4, price: 25000, name: 'Dép bông đi trong nhà', sh: { col: '#ffc9de', kind: 'slipper' } },
  ];
  const BY = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

  /* ================= đọc / ghi look.wear ================= */
  /** "áo|quần|bộ|giày" → { top, bottom, full, shoes } (id hoặc '') */
  function parse(w) {
    const [top = '', bottom = '', full = '', shoes = ''] = String(w || '').split('|');
    const ok = (id, slot) => (BY[id] && BY[id].slot === slot ? id : '');
    return { top: ok(top, 'top'), bottom: ok(bottom, 'bottom'), full: ok(full, 'full'), shoes: ok(shoes, 'shoes') };
  }
  const join = (o) => [o.top, o.bottom, o.full, o.shoes].join('|').replace(/^\|+$/, '');
  const sanitize = (w) => join(parse(w));
  const active = (look) => !!(look && look.wear && /[a-z]/.test(look.wear));

  /* ================= dò vùng quần áo trên ảnh ================= */
  const anCache = new Map();
  function analyze(src, img) {
    let A = anCache.get(src);
    if (A) return A;
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, w, h).data;
    const cls = new Uint8Array(w * h), lum = new Float32Array(w * h);
    const W_ = 1, B_ = 2, S_ = 3;
    const raw = new Uint8Array(w * h);
    for (let i = 0, p = 0; p < w * h; p++, i += 4) {
      const r = d[i], gg = d[i + 1], b = d[i + 2], a = d[i + 3];
      lum[p] = 0.3 * r + 0.59 * gg + 0.11 * b;
      if (a < 90) continue;
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      if (b > r + 18 && b > 95) raw[p] = B_;
      else if (mx - mn < 42 && lum[p] > 135) raw[p] = W_;
      else if (r > 165 && gg > 105 && b > 70 && r >= gg && r - b > 22 && r - b < 135) raw[p] = S_;
    }
    const rowCount = (y, k) => { let n = 0; for (let x = 0; x < w; x++) if (raw[y * w + x] === k) n++; return n; };
    let blueTop = -1, blueBot = -1;
    for (let y = Math.floor(h * 0.4); y < h; y++) if (rowCount(y, B_) >= 6) { if (blueTop < 0) blueTop = y; blueBot = y; }
    let shirtTop = -1;
    for (let y = Math.floor(h * 0.3); y < blueTop; y++) if (rowCount(y, W_) >= 10) { shirtTop = y; break; }
    let shoeTop = -1, shoeBot = -1;
    for (let y = Math.max(blueBot, Math.floor(h * 0.85)); y < h; y++) if (rowCount(y, W_) >= 5) { if (shoeTop < 0) shoeTop = y; shoeBot = y; }
    if (blueTop < 0 || shirtTop < 0 || shoeTop < 0) { A = { bad: true }; anCache.set(src, A); return A; }
    let legRows = 0;
    for (let y = blueBot + 1; y < shoeTop; y++) if (rowCount(y, S_) >= 6) legRows++;
    const girl = legRows > (shoeTop - blueBot) * 0.5 && legRows > 20;
    const SHIRT = 1, BLUE = 2, SKIN = 3, SHOE = 4, ARM = 5, LEG = 6;
    // khung thân áo (không tính tay áo)
    const runs = (y, test) => { const out = []; let s = -1; for (let x = 0; x <= w; x++) { const on = x < w && test(raw[y * w + x], x); if (on && s < 0) s = x; if (!on && s >= 0) { out.push([s, x - 1]); s = -1; } } return out; };
    const hem = blueTop;
    const tRow = runs(Math.max(shirtTop + 4, hem - 10), (k) => k === W_).filter((r) => r[1] - r[0] > 6);
    const torsoL = tRow.length ? tRow[0][0] : w * 0.3, torsoR = tRow.length ? tRow[tRow.length - 1][1] : w * 0.7;
    const cx = (torsoL + torsoR) / 2;
    let sleeveEnd = shirtTop + 40;
    for (let y = shirtTop; y < hem; y++) { const r = runs(y, (k) => k === W_); if (r.length && r[r.length - 1][1] - r[0][0] > torsoR - torsoL + 12) sleeveEnd = y; }
    let armBot = sleeveEnd;
    for (let p = 0; p < w * h; p++) {
      const y = (p / w) | 0, x = p % w, k = raw[p];
      if (k === W_ && y >= shirtTop && y <= hem + 3) cls[p] = SHIRT;
      else if (k === B_) cls[p] = BLUE;
      else if (k === W_ && y >= shoeTop) cls[p] = SHOE;
      else if (k === S_ && y > sleeveEnd - 6 && y < (girl ? blueBot : hem + 50) && (x < torsoL - 1 || x > torsoR + 1)) { cls[p] = ARM; if (y > armBot) armBot = y; }
      else if (k === S_ && girl && y > blueBot - 4 && y < shoeTop + 4) cls[p] = LEG;
      else if (k === S_) cls[p] = SKIN;
    }
    // mép áo/quần hơi xám (nếp gấp sẫm) nằm kẹp giữa vải → coi là vải
    for (let pass = 0; pass < 2; pass++) for (let y = shirtTop; y < shoeBot; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (cls[p] || d[p * 4 + 3] < 200) continue;
      const L = cls[p - 1], R = cls[p + 1], U = cls[p - w], Dn = cls[p + w];
      for (const k of [SHIRT, BLUE, SHOE]) if ((L === k && R === k) || (U === k && Dn === k)) { const r = d[p * 4], gg = d[p * 4 + 1], b = d[p * 4 + 2]; if (Math.max(r, gg, b) > 70) { cls[p] = k; break; } }
    }
    const median = (k) => { const v = []; for (let p = 0; p < w * h; p++) if (cls[p] === k) v.push(lum[p]); v.sort((a, b) => a - b); return v[v.length >> 1] || 200; };
    const skinRGB = (() => { let n = 0, r = 0, gg = 0, b = 0; for (let p = 0; p < w * h; p++) if (cls[p] === ARM || cls[p] === LEG) { n++; r += d[p * 4]; gg += d[p * 4 + 1]; b += d[p * 4 + 2]; } return n ? [r / n, gg / n, b / n] : [248, 214, 190]; })();
    const legRuns = (y, k) => runs(y, (_, x) => cls[y * w + x] === k).filter((r) => r[1] - r[0] > 3);
    const lg = girl ? legRuns(Math.min(shoeTop - 2, blueBot + 10), LEG) : legRuns(blueBot - 8, BLUE);
    const legs = lg.length >= 2 ? [lg[0], lg[lg.length - 1]] : [[cx - 30, cx - 4], [cx + 4, cx + 30]];
    const ankle = girl ? legRuns(shoeTop - 3, LEG) : legRuns(blueBot - 3, BLUE);
    const waist = runs(blueTop + 3, (k) => k === B_).filter((r) => r[1] - r[0] > 4);
    A = {
      w, h, d, cls, lum, girl, shirtTop, hem, blueTop, blueBot, shoeTop, shoeBot, torsoL, torsoR, cx, sleeveEnd,
      wrist: armBot - Math.round(h * 0.028), armBot, legs, ankles: ankle.length >= 2 ? [ankle[0], ankle[ankle.length - 1]] : legs,
      waistL: waist.length ? waist[0][0] : torsoL, waistR: waist.length ? waist[waist.length - 1][1] : torsoR,
      knee: Math.round(blueTop + (blueBot - blueTop) * (girl ? 0.5 : 0.42)),
      ref: { shirt: median(SHIRT), blue: median(BLUE), shoe: median(SHOE), skin: median(ARM) || median(LEG) || 200 },
      skinRGB, K: { SHIRT, BLUE, SKIN, SHOE, ARM, LEG },
    };
    anCache.set(src, A);
    return A;
  }

  /* ================= vải: màu nền + hoạ tiết (toạ độ ảnh gốc) ================= */
  const rgb = (hex) => { const s = String(hex || '#888').replace('#', ''); return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]; };
  const shadeHex = (hex, k) => { const c = rgb(hex).map((v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))))); return `rgb(${c[0]},${c[1]},${c[2]})`; };
  function petals(g, x, y, r, col, mid) { g.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k * 1.2566; g.beginPath(); g.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, 0, 7); g.fill(); } g.fillStyle = mid || '#ffd43b'; g.beginPath(); g.arc(x, y, r * 0.6, 0, 7); g.fill(); }
  function heart(g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.3, y, x - s * 0.7, y - s, x, y - s * 0.35); g.bezierCurveTo(x + s * 0.7, y - s, x + s * 1.3, y, x, y + s * 0.9); g.fill(); }
  function star(g, x, y, r) { g.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  function tex(A, spec) {
    const c = document.createElement('canvas'); c.width = A.w; c.height = A.h;
    const g = c.getContext('2d');
    g.fillStyle = spec.col || '#888'; g.fillRect(0, 0, A.w, A.h);
    const c2 = spec.col2 || shadeHex(spec.col, -0.25), W = A.w, H = A.h;
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    switch (spec.pat) {
      case 'stripes': g.fillStyle = c2; for (let y = 0; y < H; y += 26) g.fillRect(0, y, W, 11); break;
      case 'dots': g.fillStyle = c2; for (let y = 0, r = 0; y < H; y += 24, r++) for (let x = (r % 2) * 12; x < W; x += 24) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); } break;
      case 'flowers': for (let y = 6, r = 0; y < H; y += 30, r++) for (let x = (r % 2) * 15; x < W; x += 30) petals(g, x + rnd() * 6, y + rnd() * 6, 4.5, c2, '#ffe066'); break;
      case 'hawaii':
        for (let k = 0; k < 90; k++) { const x = rnd() * W, y = rnd() * H; g.fillStyle = k % 3 ? '#2f9e44' : '#37b24d'; g.save(); g.translate(x, y); g.rotate(rnd() * 6.28); g.beginPath(); g.ellipse(0, 0, 14, 5, 0, 0, 7); g.fill(); g.restore(); }
        for (let k = 0; k < 45; k++) petals(g, rnd() * W, rnd() * H, 6, c2, '#fff3bf');
        break;
      case 'stars': g.fillStyle = c2; for (let y = 10, r = 0; y < H; y += 30, r++) for (let x = (r % 2) * 15 + 6; x < W; x += 30) star(g, x, y, 7); break;
      case 'hearts': g.fillStyle = c2; for (let y = 10, r = 0; y < H; y += 28, r++) for (let x = (r % 2) * 14 + 6; x < W; x += 28) heart(g, x, y, 6); break;
      case 'plaid':
        g.globalAlpha = 0.55; g.fillStyle = c2; for (let x = 0; x < W; x += 30) g.fillRect(x, 0, 12, H); for (let y = 0; y < H; y += 30) g.fillRect(0, y, W, 12);
        g.globalAlpha = 0.8; g.fillStyle = spec.col3 || '#fff'; for (let x = 20; x < W; x += 30) g.fillRect(x, 0, 2, H); for (let y = 20; y < H; y += 30) g.fillRect(0, y, W, 2);
        g.globalAlpha = 1; break;
      case 'knit':
        g.fillStyle = c2;
        for (const by of [A.shirtTop + 22, A.shirtTop + 52]) { for (let x = 0; x < W; x += 14) { g.beginPath(); g.moveTo(x, by + 8); g.lineTo(x + 7, by); g.lineTo(x + 14, by + 8); g.lineTo(x + 7, by + 4); g.closePath(); g.fill(); } }
        for (let x = 6; x < W; x += 22) star(g, x, A.shirtTop + 38, 4.5);
        g.fillStyle = shadeHex(spec.col, -0.18); for (let x = 0; x < W; x += 6) g.fillRect(x, 0, 1.5, H);
        break;
      case 'cable':
        g.strokeStyle = c2; g.lineWidth = 3;
        for (let x = 8; x < W; x += 20) { g.beginPath(); for (let y = 0; y < H; y += 2) g.lineTo(x + Math.sin(y * 0.18) * 4, y); g.stroke(); }
        break;
      case 'denim':
        g.strokeStyle = shadeHex(spec.col, 0.12); g.lineWidth = 1; g.globalAlpha = 0.5;
        for (let k = -H; k < W; k += 4) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + H, H); g.stroke(); }
        g.globalAlpha = 1; break;
      case 'sparkle': g.fillStyle = c2; for (let k = 0; k < 260; k++) { g.beginPath(); g.arc(rnd() * W, rnd() * H, 1.3 + rnd() * 1.6, 0, 7); g.fill(); } break;
      case 'lace': g.strokeStyle = c2; g.lineWidth = 1.5; for (let y = 8, r = 0; y < H; y += 18, r++) for (let x = (r % 2) * 9; x < W; x += 18) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.stroke(); } break;
      case 'brocade': g.fillStyle = c2; g.globalAlpha = 0.85; for (let y = 10, r = 0; y < H; y += 34, r++) for (let x = (r % 2) * 17 + 8; x < W; x += 34) { g.beginPath(); g.arc(x, y, 8, 0, 7); g.lineWidth = 2; g.strokeStyle = c2; g.stroke(); star(g, x, y, 4); } g.globalAlpha = 1; break;
      default: break;
    }
    return c;
  }

  /* ================= may đồ lên ảnh ================= */
  const dressCache = new Map();
  function dress(src, img, wear) {
    const key = src + '#' + wear;
    let out = dressCache.get(key);
    if (out) return out;
    const A = analyze(src, img);
    if (A.bad) return null;
    const P = parse(wear), full = BY[P.full];
    const top = (full && full.top) || (BY[P.top] && BY[P.top].top) || null;
    const bot = (full && full.bot) || (BY[P.bottom] && BY[P.bottom].bot) || null;
    const sh = BY[P.shoes] ? BY[P.shoes].sh : null;
    const { w, h, cls, lum, K } = A;
    out = document.createElement('canvas'); out.width = w; out.height = h;
    const g = out.getContext('2d');
    g.drawImage(img, 0, 0);
    const id = g.getImageData(0, 0, w, h), px = id.data;
    const texOf = (spec) => (spec ? tex(A, spec).getContext('2d').getImageData(0, 0, w, h).data : null);
    const tT = top && !top.keep ? texOf(top) : null, tB = bot ? texOf(bot) : null, tS = sh ? texOf({ col: sh.col }) : null;
    const sockC = bot && bot.socks ? rgb(bot.socks) : null;
    const sk = A.skinRGB;
    const put = (p, src3, s) => { const i = p * 4; px[i] = Math.min(255, src3[0] * s); px[i + 1] = Math.min(255, src3[1] * s); px[i + 2] = Math.min(255, src3[2] * s); };
    const fromTex = (T, p, s) => { const i = p * 4; px[i] = Math.min(255, T[i] * s); px[i + 1] = Math.min(255, T[i + 1] * s); px[i + 2] = Math.min(255, T[i + 2] * s); };
    const sh_ = (p, ref, lo = 0.5, hi = 1.1) => Math.max(lo, Math.min(hi, lum[p] / ref));
    const longPants = bot && (bot.cut === 'long');
    const girlSkirtGone = A.girl && bot && !/skirt|gown|ball/.test(bot.cut);
    const sleeveZone = (x, y) => (x < A.torsoL - 2 || x > A.torsoR + 2) && y < A.sleeveEnd + 4;
    const sockTop = A.shoeTop - Math.round(h * 0.075);
    for (let p = 0; p < w * h; p++) {
      const k = cls[p];
      if (!k) continue;
      const y = (p / w) | 0, x = p % w;
      if (k === K.SHIRT && top && !top.keep) {
        const s = sh_(p, A.ref.shirt);
        if (top.bare || (top.sleeve === 'none' && sleeveZone(x, y)) || (top.crop && y > A.hem - Math.round(h * 0.06))) put(p, sk, Math.max(0.75, s));
        else fromTex(tT, p, s);
      } else if (k === K.ARM && top && !top.keep && top.sleeve === 'long' && y < A.wrist) {
        fromTex(tT, p, sh_(p, A.ref.skin, 0.6, 1.08));
      } else if (k === K.BLUE && bot) {
        if (girlSkirtGone) { px[p * 4 + 3] = 0; continue; }
        const s = sh_(p, A.ref.blue, 0.55, 1.25);
        if (!A.girl && sockC && y >= sockTop) put(p, sockC, s);
        else if (!A.girl && (bot.cut === 'short' || bot.cut === 'bikini') && y > A.knee) put(p, sk, Math.max(0.8, Math.min(1.05, s)));
        else fromTex(tB, p, s);
      } else if (k === K.LEG && bot) {
        if (sockC && y >= sockTop) put(p, sockC, sh_(p, A.ref.skin, 0.6, 1.05));
        else if (longPants) fromTex(tB, p, sh_(p, A.ref.skin, 0.6, 1.05));
      } else if (k === K.SHOE && sh) {
        const s = sh_(p, A.ref.shoe, 0.45, 1.1);
        if (sh.kind === 'sandal' || sh.kind === 'flip') put(p, sk, Math.max(0.8, s));
        else fromTex(tS, p, s);
      }
    }
    g.putImageData(id, 0, 0);
    // chi tiết + phần kéo dài (vẽ chồng, nét viền nâu giống ảnh gốc)
    try {
      if (bot) drawBottom(g, A, bot, tB ? patternOf(g, A, bot) : null);
      if (top && !top.keep) drawTop(g, A, top);
      if (top && top.keep) drawTop(g, A, top);
      if (sh) drawShoes(g, A, sh);
    } catch (e) { /* chi tiết lỗi thì vẫn giữ phần tô màu */ }
    if (dressCache.size > 60) dressCache.clear();
    dressCache.set(key, out);
    return out;
  }
  const patternOf = (g, A, spec) => g.createPattern(tex(A, spec), 'no-repeat');
  const outline = (g, lw = 3.2) => { g.strokeStyle = OUT; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); };
  const skinFill = (A) => `rgb(${A.skinRGB.map(Math.round).join(',')})`;
  /** chỉ vẽ lên vùng có lớp `ks` (dùng ảnh hiện tại làm mặt nạ) */
  function onMask(g, A, ks, fn) {
    const m = document.createElement('canvas'); m.width = A.w; m.height = A.h;
    const mg = m.getContext('2d'), md = mg.createImageData(A.w, A.h);
    for (let p = 0; p < A.w * A.h; p++) if (ks.includes(A.cls[p])) md.data[p * 4 + 3] = 255;
    mg.putImageData(md, 0, 0);
    const l = document.createElement('canvas'); l.width = A.w; l.height = A.h;
    const lg = l.getContext('2d'); fn(lg);
    lg.globalCompositeOperation = 'destination-in'; lg.drawImage(m, 0, 0);
    g.drawImage(l, 0, 0);
  }

  function drawTop(g, A, t) {
    const { cx, shirtTop: st, hem, torsoL: L, torsoR: R, K } = A, Wt = R - L;
    const det = t.det, c2 = t.col2 || shadeHex(t.col, -0.3), dark = shadeHex(t.col, -0.35);
    const body = [K.SHIRT], withArms = [K.SHIRT, K.ARM];
    const line = (x1, y1, x2, y2, col, lw) => { g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
    if (t.sleeve === 'long' && A.wrist > A.sleeveEnd) {
      // cổ tay áo
      onMask(g, A, [K.ARM], (q) => { q.fillStyle = det === 'bomber' ? c2 : dark; q.fillRect(0, A.wrist - 9, A.w, 9); if (det === 'bomber') { q.fillStyle = 'rgba(255,255,255,.18)'; for (let x = 0; x < A.w; x += 4) q.fillRect(x, A.wrist - 9, 1.5, 9); } });
    }
    if (det === 'hoodie') {
      onMask(g, A, body, (q) => {
        q.fillStyle = dark; q.beginPath(); q.ellipse(cx, st + 4, Wt * 0.36, 18, 0, 0, Math.PI); q.fill();
        q.fillStyle = shadeHex(t.col, -0.12); q.beginPath(); q.roundRect(cx - Wt * 0.28, hem - 48, Wt * 0.56, 34, 8); q.fill();
        q.strokeStyle = dark; q.lineWidth = 2.5; q.stroke();
        q.fillStyle = dark; q.fillRect(L - 30, hem - 12, Wt + 60, 12);
        if (t.text) { q.fillStyle = t.col2; q.font = `900 ${Math.round(Wt * 0.24)}px "Be Vietnam Pro", system-ui`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(t.text, cx, st + 50); }
      });
      line(cx - 8, st + 14, cx - 9, st + 44, '#fff', 3); line(cx + 8, st + 14, cx + 9, st + 44, '#fff', 3);
    } else if (det === 'bomber' || det === 'leather' || det === 'puffer') {
      onMask(g, A, body, (q) => {
        if (det === 'puffer') { q.strokeStyle = dark; q.lineWidth = 2.5; for (let y = st + 26; y < hem; y += 22) { q.beginPath(); q.moveTo(0, y); q.lineTo(A.w, y); q.stroke(); } q.fillStyle = shadeHex(t.col, -0.15); q.fillRect(0, st - 4, A.w, 18); }
        if (det === 'bomber') { q.fillStyle = c2; q.fillRect(0, hem - 14, A.w, 14); q.fillRect(cx - Wt * 0.3, st - 2, Wt * 0.6, 10); q.fillStyle = 'rgba(255,255,255,.18)'; for (let x = 0; x < A.w; x += 4) q.fillRect(x, hem - 14, 1.5, 14); }
        if (det === 'leather') { q.fillStyle = 'rgba(255,255,255,.12)'; q.fillRect(L + 6, st + 10, 6, hem - st - 20); q.fillStyle = dark; q.beginPath(); q.moveTo(cx - 6, st); q.lineTo(cx - Wt * 0.32, st + 30); q.lineTo(cx - 12, st + 40); q.closePath(); q.fill(); q.beginPath(); q.moveTo(cx + 6, st); q.lineTo(cx + Wt * 0.32, st + 30); q.lineTo(cx + 12, st + 40); q.closePath(); q.fill(); }
        if (t.emb === 'tiger') { q.font = `${Math.round(Wt * 0.32)}px system-ui, "Segoe UI Emoji"`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('🐯', cx, st + 52); }
      });
      line(cx, st + 4, det === 'leather' ? cx + 10 : cx, hem, '#ced4da', 2.5);
    } else if (det === 'denim') {
      onMask(g, A, body, (q) => {
        q.fillStyle = '#f8f9fa'; q.beginPath(); q.moveTo(cx - 14, st); q.lineTo(cx + 14, st); q.lineTo(cx + 10, hem); q.lineTo(cx - 10, hem); q.closePath(); q.fill();
        q.strokeStyle = '#d9a441'; q.lineWidth = 1.6; q.setLineDash([4, 3]);
        q.beginPath(); q.moveTo(0, st + 30); q.lineTo(A.w, st + 30); q.stroke(); q.setLineDash([]);
        q.fillStyle = shadeHex(t.col, -0.15); [[cx - Wt * 0.32, st + 34], [cx + Wt * 0.12, st + 34]].forEach(([x, y]) => { q.fillRect(x, y, Wt * 0.2, 16); q.fillStyle = '#c9a227'; q.beginPath(); q.arc(x + Wt * 0.1, y + 10, 2.5, 0, 7); q.fill(); q.fillStyle = shadeHex(t.col, -0.15); });
        q.fillStyle = dark; q.fillRect(0, hem - 12, A.w, 12);
      });
      line(cx - 14, st, cx - 10, hem, OUT, 2.5); line(cx + 14, st, cx + 10, hem, OUT, 2.5);
    } else if (det === 'suit') {
      onMask(g, A, body, (q) => {
        q.fillStyle = '#ffffff'; q.beginPath(); q.moveTo(cx - 18, st - 2); q.lineTo(cx + 18, st - 2); q.lineTo(cx, st + 72); q.closePath(); q.fill();
        q.fillStyle = t.col2;
        if (t.bow) { q.beginPath(); q.moveTo(cx, st + 10); q.lineTo(cx - 12, st + 4); q.lineTo(cx - 12, st + 16); q.closePath(); q.moveTo(cx, st + 10); q.lineTo(cx + 12, st + 4); q.lineTo(cx + 12, st + 16); q.closePath(); q.fill(); }
        else { q.beginPath(); q.moveTo(cx - 4, st + 6); q.lineTo(cx + 4, st + 6); q.lineTo(cx + 6, st + 58); q.lineTo(cx, st + 66); q.lineTo(cx - 6, st + 58); q.closePath(); q.fill(); }
        q.fillStyle = shadeHex(t.col, -0.25);
        q.beginPath(); q.moveTo(cx - 18, st - 2); q.lineTo(cx - 34, st + 26); q.lineTo(cx - 22, st + 30); q.lineTo(cx, st + 74); q.lineTo(cx - 4, st + 74); q.closePath(); q.fill();
        q.beginPath(); q.moveTo(cx + 18, st - 2); q.lineTo(cx + 34, st + 26); q.lineTo(cx + 22, st + 30); q.lineTo(cx, st + 74); q.lineTo(cx + 4, st + 74); q.closePath(); q.fill();
        q.fillStyle = t.col === '#f8f9fa' ? '#adb5bd' : '#ffd43b'; [st + 84, st + 102].forEach((y) => { q.beginPath(); q.arc(cx, y, 3, 0, 7); q.fill(); });
        q.fillStyle = '#ffffff'; q.fillRect(cx + Wt * 0.2, st + 34, 12, 5);
      });
    } else if (det === 'jersey') {
      onMask(g, A, body, (q) => {
        q.fillStyle = c2; q.beginPath(); q.moveTo(cx - 16, st - 2); q.lineTo(cx, st + 18); q.lineTo(cx + 16, st - 2); q.lineTo(cx + 10, st - 2); q.lineTo(cx, st + 10); q.lineTo(cx - 10, st - 2); q.closePath(); q.fill();
        q.fillRect(0, A.sleeveEnd - 8, L - 2, 8); q.fillRect(R + 2, A.sleeveEnd - 8, A.w, 8);
        q.font = `900 ${Math.round(Wt * 0.5)}px "Be Vietnam Pro", system-ui`; q.textAlign = 'center'; q.textBaseline = 'middle';
        q.lineWidth = 4; q.strokeStyle = shadeHex(t.col, -0.4); q.strokeText(t.num || '10', cx, st + 56); q.fillText(t.num || '10', cx, st + 56);
        q.fillStyle = c2; star(q, cx - Wt * 0.24, st + 22, 6);
      });
    } else if (det === 'polo' || det === 'shirtOpen' || det === 'pajama' || det === 'cardigan') {
      onMask(g, A, body, (q) => {
        if (det === 'shirtOpen') { q.fillStyle = skinFill(A); q.beginPath(); q.moveTo(cx - 13, st - 2); q.lineTo(cx + 13, st - 2); q.lineTo(cx, st + 26); q.closePath(); q.fill(); }
        q.fillStyle = det === 'polo' ? shadeHex(t.col, -0.2) : t.col2 || dark;
        q.beginPath(); q.moveTo(cx - 20, st - 2); q.lineTo(cx - 2, st + 8); q.lineTo(cx - 14, st + 20); q.closePath(); q.fill();
        q.beginPath(); q.moveTo(cx + 20, st - 2); q.lineTo(cx + 2, st + 8); q.lineTo(cx + 14, st + 20); q.closePath(); q.fill();
        q.fillStyle = det === 'cardigan' ? '#8a5a32' : '#f8f9fa';
        const until = det === 'polo' ? st + 40 : hem - 6;
        for (let y = st + (det === 'shirtOpen' ? 32 : 18); y < until; y += 18) { q.beginPath(); q.arc(cx, y, 3, 0, 7); q.fill(); }
        if (det === 'pajama' || det === 'cardigan') { q.fillStyle = t.col2 || dark; q.fillRect(0, hem - 9, A.w, 9); }
      });
      if (det !== 'polo') line(cx, st + (det === 'shirtOpen' ? 26 : 10), cx, hem, dark, 2);
    } else if (det === 'turtle' || det === 'knitCollar') {
      onMask(g, A, body, (q) => { q.fillStyle = shadeHex(t.col, -0.12); q.fillRect(cx - Wt * 0.24, st - 4, Wt * 0.48, 16); q.strokeStyle = dark; q.lineWidth = 1.5; for (let x = cx - Wt * 0.24; x < cx + Wt * 0.24; x += 5) { q.beginPath(); q.moveTo(x, st - 4); q.lineTo(x, st + 12); q.stroke(); } q.fillStyle = dark; q.fillRect(0, hem - 10, A.w, 10); });
    } else if (det === 'dino') {
      onMask(g, A, body, (q) => { q.fillStyle = '#2f9e44'; for (let k = 0; k < 5; k++) { q.beginPath(); q.moveTo(cx - 30 + k * 15, st + 4); q.lineTo(cx - 23 + k * 15, st - 8); q.lineTo(cx - 16 + k * 15, st + 4); q.closePath(); q.fill(); } q.fillStyle = '#d3f9d8'; q.beginPath(); q.ellipse(cx, hem - 34, Wt * 0.26, 30, 0, 0, 7); q.fill(); });
    } else if (det === 'aodai') {
      onMask(g, A, body, (q) => { q.fillStyle = t.col2 || shadeHex(t.col, -0.2); q.fillRect(cx - 16, st - 4, 32, 12); });
      line(cx - 2, st + 8, R - 4, st + 30, shadeHex(t.col, -0.4), 2.5);
      // 2 tà áo dài buông xuống gần mắt cá
      const endY = A.girl ? A.shoeTop - 18 : A.knee + 26, pat = g.createPattern(tex(A, t), 'no-repeat');
      [[-1, 0.9], [1, 0.7]].forEach(([sd, a]) => {
        g.globalAlpha = a; g.fillStyle = pat;
        g.beginPath(); g.moveTo(cx - Wt * 0.36, hem - 6); g.lineTo(cx + Wt * 0.36, hem - 6); g.lineTo(cx + Wt * 0.4 + sd * 4, endY); g.lineTo(cx - Wt * 0.4 + sd * 4, endY); g.closePath(); g.fill();
        g.globalAlpha = 1;
      });
      g.beginPath(); g.moveTo(cx - Wt * 0.36, hem - 6); g.lineTo(cx - Wt * 0.4, endY); g.lineTo(cx + Wt * 0.4, endY); g.lineTo(cx + Wt * 0.36, hem - 6); outline(g, 3);
    } else if (det === 'bikini') {
      const pat = t.pat ? g.createPattern(tex(A, t), 'no-repeat') : t.col, cy = st + Math.round((hem - st) * 0.34);
      g.fillStyle = pat;
      [-1, 1].forEach((sd) => { g.beginPath(); g.moveTo(cx + sd * 3, cy - 2); g.quadraticCurveTo(cx + sd * Wt * 0.36, cy - 14, cx + sd * Wt * 0.36, cy + 10); g.quadraticCurveTo(cx + sd * Wt * 0.18, cy + 18, cx + sd * 3, cy + 8); g.closePath(); g.fill(); outline(g, 2.6); });
      line(cx - Wt * 0.3, cy - 8, cx - Wt * 0.22, st - 2, t.col, 2.5); line(cx + Wt * 0.3, cy - 8, cx + Wt * 0.22, st - 2, t.col, 2.5);
      g.strokeStyle = OUT; g.lineWidth = 1.6; g.beginPath(); g.arc(cx, hem - 22, 2.2, 0, 7); g.stroke();
    } else if (det === 'pinafore') {
      onMask(g, A, body, (q) => {
        const pat = q.createPattern(tex(A, { col: t.col, pat: 'denim' }), 'no-repeat');
        q.fillStyle = pat; q.fillRect(cx - Wt * 0.3, hem - 46, Wt * 0.6, 50);
        q.fillRect(cx - Wt * 0.26, st - 4, 7, hem - st); q.fillRect(cx + Wt * 0.26 - 7, st - 4, 7, hem - st);
        q.fillStyle = '#ffd43b'; [cx - Wt * 0.26 + 3.5, cx + Wt * 0.26 - 3.5].forEach((x) => { q.beginPath(); q.arc(x, hem - 40, 3, 0, 7); q.fill(); });
      });
    } else if (det === 'tank' || det === 'sweetheart' || det === 'lace' || det === 'puffSleeve' || det === 'bow' || det === 'belt' || det === 'crop') {
      onMask(g, A, body, (q) => {
        if (det === 'tank' || (det === 'lace' && t.sleeve === 'none')) { q.fillStyle = skinFill(A); q.beginPath(); q.ellipse(cx, st - 4, Wt * 0.32, 16, 0, 0, Math.PI); q.fill(); }
        if (det === 'sweetheart') { q.fillStyle = skinFill(A); q.beginPath(); q.moveTo(cx - 16, st - 2); q.quadraticCurveTo(cx - 8, st + 18, cx, st + 10); q.quadraticCurveTo(cx + 8, st + 18, cx + 16, st - 2); q.closePath(); q.fill(); }
        if (det === 'belt') { q.fillStyle = '#212529'; q.fillRect(0, hem - 10, A.w, 9); q.fillStyle = '#ffd43b'; q.fillRect(cx - 6, hem - 12, 12, 13); }
        if (det === 'bow') { q.fillStyle = '#e64980'; q.beginPath(); q.moveTo(cx, hem - 14); q.lineTo(cx - 14, hem - 22); q.lineTo(cx - 14, hem - 6); q.closePath(); q.moveTo(cx, hem - 14); q.lineTo(cx + 14, hem - 22); q.lineTo(cx + 14, hem - 6); q.closePath(); q.fill(); }
        if (det === 'puffSleeve') { q.fillStyle = shadeHex(t.col, 0.25); q.beginPath(); q.ellipse(L - 6, st + 20, 18, 22, 0, 0, 7); q.ellipse(R + 6, st + 20, 18, 22, 0, 0, 7); q.fill(); q.fillStyle = '#fff'; q.fillRect(0, hem - 8, A.w, 8); }
        if (det === 'lace') { q.fillStyle = t.col2; for (let x = 0; x < A.w; x += 10) { q.beginPath(); q.arc(x, hem - 4, 4, 0, Math.PI); q.fill(); } }
        if (det === 'crop') { q.fillStyle = t.col2; q.font = `900 ${Math.round(Wt * 0.2)}px "Be Vietnam Pro", system-ui`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText('LOVE', cx, st + 34); }
      });
      if (det === 'tank') { line(cx - Wt * 0.3, st - 2, cx - Wt * 0.28, st + 22, t.col, 4); line(cx + Wt * 0.3, st - 2, cx + Wt * 0.28, st + 22, t.col, 4); }
    }
  }

  function drawBottom(g, A, b, pat) {
    const { cx, blueTop: bt, blueBot: bb, waistL, waistR, legs, ankles, shoeTop, K } = A;
    const fillP = pat || b.col;
    const [lL, lR] = legs;
    if (A.girl && !/skirt|gown|ball/.test(b.cut)) {
      // bỏ chân váy → vẽ quần / quần short / bikini theo dáng hông + 2 chân
      const crotch = bt + Math.round((bb - bt) * 0.42);
      const endY = b.cut === 'long' ? bb + 10 : b.cut === 'short' ? bt + Math.round((bb - bt) * 0.62) : crotch;
      // đùi (da) từ hông xuống chỗ chân bắt đầu
      if (b.cut !== 'long') {
        g.fillStyle = skinFill(A);
        g.beginPath(); g.moveTo(waistL + 2, crotch - 8); g.lineTo(cx - 1, crotch - 8); g.lineTo(lL[1] + 1, bb + 12); g.lineTo(lL[0] - 1, bb + 12); g.closePath(); g.fill(); outline(g, 2.4);
        g.beginPath(); g.moveTo(cx + 1, crotch - 8); g.lineTo(waistR - 2, crotch - 8); g.lineTo(lR[1] + 1, bb + 12); g.lineTo(lR[0] - 1, bb + 12); g.closePath(); g.fill(); outline(g, 2.4);
      }
      g.fillStyle = fillP;
      if (b.cut === 'bikini') {
        g.beginPath(); g.moveTo(waistL + 4, bt + 10); g.lineTo(waistR - 4, bt + 10); g.lineTo(cx + 6, crotch + 6); g.lineTo(cx - 6, crotch + 6); g.closePath(); g.fill(); outline(g, 2.4);
      } else {
        const lx = (t) => waistL + (lL[0] - waistL) * t, rx = (t) => waistR + (lR[1] - waistR) * t;
        const tEnd = (endY - bt) / (bb + 10 - bt);
        g.beginPath(); g.moveTo(waistL, bt); g.lineTo(waistR, bt); g.lineTo(rx(tEnd) + 3, endY); g.lineTo(cx + 2 + (lR[0] - cx) * tEnd, endY); g.lineTo(cx, crotch); g.lineTo(cx - 2 + (lL[1] - cx) * tEnd, endY); g.lineTo(lx(tEnd) - 3, endY); g.closePath(); g.fill(); outline(g, 2.8);
        g.strokeStyle = shadeHex(b.col, -0.3); g.lineWidth = 2; g.beginPath(); g.moveTo(waistL, bt + 8); g.lineTo(waistR, bt + 8); g.stroke();
      }
    } else if (b.cut === 'gown' || b.cut === 'ball' || b.cut === 'skirtLong') {
      const wide = b.cut === 'ball' ? 0.62 : b.cut === 'gown' ? 0.32 : 0.24, endY = b.cut === 'skirtLong' ? shoeTop - 26 : shoeTop + 6;
      const span = (A.legs[1][1] - A.legs[0][0]) * (1 + wide);
      const start = A.girl ? bt : A.hem;
      g.fillStyle = fillP;
      g.beginPath(); g.moveTo(waistL, start);
      g.bezierCurveTo(waistL - 12, start + 40, cx - span * 0.6, endY - 40, cx - span * 0.62, endY);
      for (let k = 0; k <= 10; k++) g.lineTo(cx - span * 0.62 + (span * 1.24) * k / 10, endY + (k % 2 ? 6 : 0));
      g.bezierCurveTo(cx + span * 0.6, endY - 40, waistR + 12, start + 40, waistR, start);
      g.closePath(); g.fill(); outline(g, 3);
      g.strokeStyle = shadeHex(b.col, -0.22); g.lineWidth = 2;
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(cx + k * 10, start + 14); g.quadraticCurveTo(cx + k * 18, (start + endY) / 2, cx + k * span * 0.24, endY - 4); g.stroke(); }
      if (b.slit) { g.fillStyle = skinFill(A); g.beginPath(); g.moveTo(cx + span * 0.18, endY); g.lineTo(cx + span * 0.1, (start + endY) / 2 + 20); g.lineTo(cx + span * 0.3, endY); g.closePath(); g.fill(); }
    } else if (A.girl && b.cut === 'skirt') {
      onMask(g, A, [K.BLUE], (q) => {
        if (b.det === 'pleat') { q.strokeStyle = b.col2 || shadeHex(b.col, -0.25); q.lineWidth = 2; for (let x = 0; x < A.w; x += 11) { q.beginPath(); q.moveTo(cx + (x - cx) * 0.6, bt); q.lineTo(x, bb); q.stroke(); } }
        if (b.det === 'frill') { q.fillStyle = b.col2 || '#fff'; for (let x = 0; x < A.w; x += 12) { q.beginPath(); q.arc(x + 6, bb - 2, 7, Math.PI, 0); q.fill(); } }
        if (b.det === 'skirtDenim') { q.strokeStyle = '#d9a441'; q.lineWidth = 1.6; q.setLineDash([4, 3]); q.beginPath(); q.moveTo(cx, bt); q.lineTo(cx, bb); q.stroke(); q.setLineDash([]); q.fillStyle = '#c9a227'; for (let y = bt + 10; y < bb - 10; y += 16) { q.beginPath(); q.arc(cx + 5, y, 2.5, 0, 7); q.fill(); } }
        q.fillStyle = shadeHex(b.col, -0.25); q.fillRect(0, bt, A.w, 7);
      });
    }
    // chi tiết quần (vẽ trên vùng quần của bạn nam)
    if (!A.girl) {
      onMask(g, A, [K.BLUE], (q) => {
        q.fillStyle = shadeHex(b.col, -0.3); q.fillRect(0, bt, A.w, 8);
        if (b.det === 'jeans') { q.strokeStyle = b.col2 || '#c9a227'; q.lineWidth = 1.6; q.setLineDash([4, 3]); q.beginPath(); q.moveTo(cx, bt + 8); q.lineTo(cx, bt + 34); q.stroke(); [lL, lR].forEach(([a, z]) => { q.beginPath(); q.moveTo((a + z) / 2 + (z - a) * 0.3, bt + 30); q.lineTo((ankles[0][0] + ankles[0][1]) / 2 + ((a + z) / 2 - (lL[0] + lL[1]) / 2), bb); q.stroke(); }); q.setLineDash([]); }
        if (b.det === 'crease') { q.strokeStyle = shadeHex(b.col, 0.18); q.lineWidth = 1.6; [lL, lR].forEach(([a, z], i) => { const top = i ? cx + (waistR - cx) / 2 : cx - (cx - waistL) / 2; q.beginPath(); q.moveTo(top, bt + 12); q.lineTo((ankles[i][0] + ankles[i][1]) / 2, bb); q.stroke(); }); }
        if (b.det === 'stripe' || b.det === 'kitStripe') { const endY = b.cut === 'long' ? bb : A.knee, ax = b.cut === 'long' ? ankles : legs; q.strokeStyle = b.col2 || '#fff'; q.lineWidth = 5; q.lineCap = 'butt'; q.beginPath(); q.moveTo(waistL + 3, bt + 4); q.lineTo(ax[0][0] + 3, endY); q.moveTo(waistR - 3, bt + 4); q.lineTo(ax[1][1] - 3, endY); q.stroke(); }
        if (b.cuff) { q.fillStyle = shadeHex(b.col, -0.3); q.fillRect(0, bb - 10, A.w, 10); }
        if (b.ripped) { q.fillStyle = skinFill(A); [lL, lR].forEach(([a, z]) => { const m = (a + z) / 2; q.beginPath(); q.ellipse(m, A.knee + 16, (z - a) * 0.28, 7, 0, 0, 7); q.fill(); q.strokeStyle = '#f8f9fa'; q.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { q.beginPath(); q.moveTo(m - 10, A.knee + 10 + k * 3); q.lineTo(m + 10, A.knee + 10 + k * 3); q.stroke(); } }); }
        if ((b.cut === 'short' || b.cut === 'bikini') && b.det === 'fray') { q.strokeStyle = '#e9ecef'; q.lineWidth = 1.4; for (let x = 0; x < A.w; x += 3) { q.beginPath(); q.moveTo(x, A.knee - 2); q.lineTo(x + 1, A.knee + 3); q.stroke(); } }
      });
      if (b.cut === 'short' || b.cut === 'bikini') { g.strokeStyle = OUT; g.lineWidth = 2.6; [lL, lR].forEach(([a, z]) => { const m = (a + z) / 2, hw = (z - a) / 2 + 3; g.beginPath(); g.moveTo(m - hw, A.knee); g.lineTo(m + hw, A.knee); g.stroke(); }); }
    }
  }

  function drawShoes(g, A, s) {
    const { shoeTop: t, shoeBot: b, legs, ankles, K } = A;
    const feet = ankles;
    if (s.kind === 'sneaker' || s.kind === 'high' || s.kind === 'cleats') {
      onMask(g, A, [K.SHOE], (q) => {
        q.fillStyle = s.kind === 'cleats' ? '#212529' : '#ffffff'; q.fillRect(0, b - 7, A.w, 8);
        q.fillStyle = s.col2 || '#212529';
        feet.forEach(([a, z]) => { q.beginPath(); q.moveTo(a - 6, b - 10); q.quadraticCurveTo((a + z) / 2, b - 22, z + 10, b - 18); q.lineTo(z + 10, b - 13); q.quadraticCurveTo((a + z) / 2, b - 15, a - 6, b - 6); q.closePath(); q.fill(); });
        if (s.kind === 'cleats') { q.fillStyle = '#adb5bd'; for (let x = 0; x < A.w; x += 9) { q.beginPath(); q.arc(x, b, 2.2, 0, 7); q.fill(); } }
      });
      if (s.kind === 'high') feet.forEach(([a, z]) => { g.fillStyle = s.col; g.beginPath(); g.roundRect(a - 3, t - 16, z - a + 6, 22, 4); g.fill(); outline(g, 2.6); g.fillStyle = s.col2; g.fillRect(a, t - 10, z - a, 4); });
    } else if (s.kind === 'oxford') {
      onMask(g, A, [K.SHOE], (q) => { q.fillStyle = 'rgba(255,255,255,.35)'; feet.forEach(([a, z]) => { q.beginPath(); q.ellipse((a + z) / 2 + 6, t + (b - t) * 0.45, 8, 4, -0.2, 0, 7); q.fill(); }); q.fillStyle = '#000'; q.fillRect(0, b - 5, A.w, 6); });
    } else if (s.kind === 'boots') {
      feet.forEach(([a, z]) => { g.fillStyle = s.col; g.beginPath(); g.roundRect(a - 5, t - 46, z - a + 10, 52, 5); g.fill(); outline(g, 2.6); g.fillStyle = s.col2 || '#f1f3f5'; g.beginPath(); g.roundRect(a - 7, t - 50, z - a + 14, 12, 6); g.fill(); outline(g, 2); });
      onMask(g, A, [K.SHOE], (q) => { q.fillStyle = '#2b1a10'; q.fillRect(0, b - 6, A.w, 7); });
    } else if (s.kind === 'heels') {
      feet.forEach(([a, z]) => { g.fillStyle = s.col; g.beginPath(); g.moveTo(a + 2, b - 3); g.lineTo(a + 6, b + 8); g.lineTo(a + 10, b + 8); g.lineTo(a + 10, b - 3); g.closePath(); g.fill(); outline(g, 1.8); });
      onMask(g, A, [K.SHOE], (q) => { q.fillStyle = 'rgba(255,255,255,.35)'; feet.forEach(([a, z]) => { q.beginPath(); q.ellipse((a + z) / 2, t + 8, 7, 3, 0, 0, 7); q.fill(); }); });
    } else if (s.kind === 'mary') {
      onMask(g, A, [K.SHOE], (q) => { q.fillStyle = s.col2; feet.forEach(([a, z]) => { q.fillRect(a - 4, t + 6, z - a + 8, 4); }); });
    } else if (s.kind === 'sandal' || s.kind === 'flip') {
      onMask(g, A, [K.SHOE], (q) => {
        q.fillStyle = s.col; q.fillRect(0, b - 5, A.w, 6);
        q.strokeStyle = s.col; q.lineWidth = 4;
        feet.forEach(([a, z]) => { const m = (a + z) / 2 + 4; if (s.kind === 'flip') { q.beginPath(); q.moveTo(a - 2, t + 10); q.lineTo(m, t + 20); q.lineTo(z + 6, t + 10); q.stroke(); } else { q.beginPath(); q.moveTo(0, t + 10); q.lineTo(A.w, t + 10); q.moveTo(0, t + 22); q.lineTo(A.w, t + 22); q.stroke(); } });
      });
    } else if (s.kind === 'slipper') {
      onMask(g, A, [K.SHOE], (q) => { q.fillStyle = '#fff'; feet.forEach(([a, z]) => { q.beginPath(); q.arc((a + z) / 2 + 6, t + 12, 7, 0, 7); q.fill(); }); });
    }
  }

  /* ================= cửa hàng ================= */
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const isGirl = (look) => {
    if (!look) return false;
    if (look.avatar === 'girl') return true;
    if (look.avatar === 'boy') return false;
    return ({ long: 1, pigtails: 1, bun: 1, bob: 1 })[look.hair] || ({ dress: 1, dress_flower: 1, princess: 1, witchdress: 1 })[look.shirtStyle] || look.top === 'cute';
  };
  const fits = (it, look) => it.g === 'u' || (it.g === 'f') === !!isGirl(look);
  /** mặc thêm 1 món vào chuỗi wear (bộ váy thay áo + quần, và ngược lại) */
  function withItem(w, id) {
    const o = parse(w), it = BY[id];
    if (!it) return sanitize(w);
    if (it.slot === 'full') { o.full = id; o.top = ''; o.bottom = ''; }
    else if (it.slot === 'shoes') o.shoes = id;
    else { o[it.slot] = id; o.full = ''; }
    return join(o);
  }
  function without(w, id) { const o = parse(w); for (const k of ['top', 'bottom', 'full', 'shoes']) if (o[k] === id) o[k] = ''; return join(o); }
  function shop(container, rerender) {
    const S = AV.S;
    S.owned.wear = S.owned.wear || [];
    const st = shop.st || (shop.st = { cat: 'full', ss: '' });
    const painted = S.look.avatar !== 'custom';
    const girl = isGirl(S.look);
    const CATS = [['full', '👗 Váy & cả bộ'], ['top', '👕 Áo'], ['bottom', '👖 Quần & chân váy'], ['shoes', '👟 Giày dép']];
    const list = ITEMS.filter((it) => it.slot === st.cat && (!st.ss || it.ss.includes(st.ss))).sort((a, b) => (fits(b, S.look) - fits(a, S.look)) || a.price - b.price);
    const cur = parse(S.look.wear);
    container.innerHTML = `${painted ? '' : '<p class="wd-note">⚠️ Đồ mới chỉ hiện trên <b>nhân vật vẽ</b> (Bạn nam / Bạn nữ). Vào 👕 Tủ đồ đổi nhân vật để mặc nhé!</p>'}
      <div class="tabs">${CATS.map(([k, l]) => `<button class="chip ${st.cat === k ? 'on' : ''}" data-wc="${k}">${l}</button>`).join('')}</div>
      <div class="tabs wd-ss"><button class="chip ${!st.ss ? 'on' : ''}" data-wss="">Tất cả</button>${Object.entries(SEASON).map(([k, l]) => `<button class="chip ${st.ss === k ? 'on' : ''}" data-wss="${k}">${l}</button>`).join('')}</div>
      <div class="b-grid sets">${list.map((it) => {
        const own = S.owned.wear.includes(it.id), on = cur[it.slot] === it.id, ok = fits(it, S.look);
        const btn = !ok ? `<button class="btn small ghost" disabled>${it.g === 'f' ? '👧 Chỉ bạn nữ' : '👦 Chỉ bạn nam'}</button>`
          : on ? `<button class="btn small ghost" data-woff="${it.id}">Cởi ra</button>`
            : own ? `<button class="btn small" data-won="${it.id}">Mặc</button>`
              : `<button class="btn small" data-wbuy="${it.id}">Mua · ${fmt(it.price)}💰</button>`;
        return `<div class="b-card set-card ${on ? 'wd-on' : ''}" style="--rar:${it.price >= 1000000 ? '#fcc419' : it.price >= 300000 ? '#b197fc' : it.price >= 100000 ? '#4dabf7' : '#adb5bd'}"><span class="rar">${[...it.ss].map((k) => SEASON[k].split(' ')[0]).join('')}</span><canvas data-wpv="${it.id}"></canvas><b>${it.name}</b>${btn}</div>`;
      }).join('')}</div>
      <p class="muted small-note">Mua rồi thì mặc / cởi tự do. Váy liền & cả bộ thay cả áo lẫn quần. Hình xem trước là nhân vật của bạn.</p>`;
    container.querySelectorAll('[data-wc]').forEach((b) => b.onclick = () => { st.cat = b.dataset.wc; rerender(); });
    container.querySelectorAll('[data-wss]').forEach((b) => b.onclick = () => { st.ss = b.dataset.wss; rerender(); });
    const baseLook = { ...S.look, avatar: S.look.avatar === 'custom' ? (girl ? 'girl' : 'boy') : S.look.avatar };
    container.querySelectorAll('[data-wpv]').forEach((c, i) => setTimeout(() => { if (c.isConnected) UI.drawAvatar(c, { ...baseLook, wear: withItem(S.look.wear, c.dataset.wpv) }, { scale: 1.15 }); }, 30 + i * 40));
    container.querySelectorAll('[data-wbuy]').forEach((b) => b.onclick = () => {
      const it = BY[b.dataset.wbuy];
      UI.confirm(`Mua <b>${it.name}</b> giá <b>${fmt(it.price)} xu</b> và mặc luôn?`, 'Mua', () => {
        if (!AV.spend(it.price)) return;
        S.owned.wear.push(it.id); wearIt(it.id);
        UI.toast(`👗 Đã mua ${it.name}! Đẹp quá đi`);
        rerender();
      });
    });
    container.querySelectorAll('[data-won]').forEach((b) => b.onclick = () => { wearIt(b.dataset.won); rerender(); });
    container.querySelectorAll('[data-woff]').forEach((b) => b.onclick = () => { S.look.wear = without(S.look.wear, b.dataset.woff); changedLook(); rerender(); });
  }
  function wearIt(id) { const S = AV.S; S.look.wear = withItem(S.look.wear, id); if (S.look.avatar === 'custom') S.look.avatar = isGirl(S.look) ? 'girl' : 'boy'; changedLook(); AV.sayMine && AV.sayMine('✨ Đồ mới nè!'); }
  function changedLook() { if (AV.markChanged) AV.markChanged(); if (AV.refreshLook) AV.refreshLook(); if (typeof NET !== 'undefined' && NET.sendState) NET.sendState(); }

  /** ✨ Đồ của tôi: chỉ hiện đồ đã mua, mặc / cởi ở bất cứ đâu + 3 bộ yêu thích */
  function mine() {
    const S = AV.S;
    S.owned.wear = S.owned.wear || [];
    const p = UI.panel('✨ Đồ của tôi', '', { wide: true });
    let cat = 'all';
    const render = () => {
      const cur = parse(S.look.wear), favs = S.wearFav || (S.wearFav = ['', '', '']);
      const own = ITEMS.filter((it) => S.owned.wear.includes(it.id) && (cat === 'all' || it.slot === cat));
      const baseLook = { ...S.look, avatar: S.look.avatar === 'custom' ? (isGirl(S.look) ? 'girl' : 'boy') : S.look.avatar };
      const CATS = [['all', 'Tất cả'], ['full', '👗 Váy & bộ'], ['top', '👕 Áo'], ['bottom', '👖 Quần'], ['shoes', '👟 Giày']];
      p.body.innerHTML = `<div class="wd-mine-top"><canvas class="wd-me"></canvas><div>
          <b>Đang mặc</b><small>${[cur.full, cur.top, cur.bottom, cur.shoes].filter(Boolean).map((id) => BY[id].name).join(' · ') || 'Đồ gốc'}</small>
          <div class="wd-favs">${favs.map((f, i) => `<div class="wd-fav"><button class="btn small ${f ? '' : 'ghost'}" data-fload="${i}" ${f ? '' : 'disabled'}>⭐ Bộ ${i + 1}</button><button class="btn small ghost" data-fsave="${i}" title="Lưu bộ đang mặc">💾</button></div>`).join('')}</div>
          <button class="btn small ghost" data-nude>Cởi hết (về đồ gốc)</button></div></div>
        <div class="tabs">${CATS.map(([k, l]) => `<button class="chip ${cat === k ? 'on' : ''}" data-mc="${k}">${l}</button>`).join('')}</div>
        ${own.length ? `<div class="b-grid sets">${own.map((it) => { const on = cur[it.slot] === it.id; return `<div class="b-card set-card ${on ? 'wd-on' : ''}"><canvas data-mpv="${it.id}"></canvas><b>${it.name}</b>${on ? `<button class="btn small ghost" data-moff="${it.id}">Cởi ra</button>` : `<button class="btn small" data-mon="${it.id}">Mặc</button>`}</div>`; }).join('')}</div>`
          : `<p class="muted">Chưa có món nào ${cat === 'all' ? '' : 'loại này '}— mua ở 👗 Tiệm Thời Trang (Khu mua sắm) → tab ✨ Thời trang 4 mùa.</p>`}`;
      UI.drawAvatar(p.body.querySelector('.wd-me'), baseLook, { scale: 1.3 });
      p.body.querySelectorAll('[data-mpv]').forEach((c, i) => setTimeout(() => { if (c.isConnected) UI.drawAvatar(c, { ...baseLook, wear: withItem(S.look.wear, c.dataset.mpv) }, { scale: 1.15 }); }, 30 + i * 40));
      p.body.querySelectorAll('[data-mc]').forEach((b) => b.onclick = () => { cat = b.dataset.mc; render(); });
      p.body.querySelectorAll('[data-mon]').forEach((b) => b.onclick = () => { wearIt(b.dataset.mon); render(); });
      p.body.querySelectorAll('[data-moff]').forEach((b) => b.onclick = () => { S.look.wear = without(S.look.wear, b.dataset.moff); changedLook(); render(); });
      p.body.querySelectorAll('[data-fsave]').forEach((b) => b.onclick = () => { favs[+b.dataset.fsave] = sanitize(S.look.wear); changedLook(); UI.toast(`⭐ Đã lưu Bộ ${+b.dataset.fsave + 1}`); render(); });
      p.body.querySelectorAll('[data-fload]').forEach((b) => b.onclick = () => { S.look.wear = sanitize(favs[+b.dataset.fload]); if (S.look.avatar === 'custom') S.look.avatar = isGirl(S.look) ? 'girl' : 'boy'; changedLook(); AV.sayMine('✨ Thay đồ!'); render(); });
      p.body.querySelector('[data-nude]').onclick = () => { S.look.wear = ''; changedLook(); render(); };
    };
    render();
  }
  return { ITEMS, parse, sanitize, active, dress, shop, isGirl, withItem, mine, give: (id) => { const S = AV.S; S.owned.wear = S.owned.wear || []; if (BY[id] && !S.owned.wear.includes(id)) { S.owned.wear.push(id); return true; } return false; } };
})();
