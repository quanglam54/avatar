/* Giao diện HTML: HUD, bảng chọn, cửa hàng, tủ đồ */
const UI = (() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const stack = [];

  function toast(msg, ms = 2600) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), ms - 300);
    setTimeout(() => t.remove(), ms);
  }

  function panel(title, body, opts = {}) {
    const back = document.createElement('div');
    back.className = 'panel-back';
    back.innerHTML = `
      <div class="panel ${opts.wide ? 'wide' : ''}">
        <header><h3>${title}</h3>${opts.locked ? '' : '<button class="x" aria-label="Đóng">✕</button>'}</header>
        <div class="panel-body">${body}</div>
      </div>`;
    $('#panels').appendChild(back);
    const p = { el: back.querySelector('.panel'), body: back.querySelector('.panel-body'), back, onClose: opts.onClose };
    p.close = () => {
      back.remove();
      const i = stack.indexOf(p);
      if (i >= 0) stack.splice(i, 1);
      p.onClose && p.onClose();
    };
    if (!opts.locked) {
      back.querySelector('.x').onclick = p.close;
      back.addEventListener('pointerdown', (e) => { if (e.target === back) p.close(); });
    }
    p.locked = !!opts.locked;
    stack.push(p);
    return p;
  }

  function closeTop() {
    const p = stack[stack.length - 1];
    if (p && !p.locked) p.close();
  }

  const isBlocking = () => stack.length > 0 || (typeof TABLE !== 'undefined' && TABLE.isOpen()) || (typeof RACE !== 'undefined' && RACE.isOpen()) || !!document.querySelector('#arcadeView.show');

  function confirm(text, okText, onOk) {
    const p = panel('Xác nhận', `<p class="confirm-text">${text}</p>
      <div class="row-end"><button class="btn ghost" data-no>Thôi</button><button class="btn" data-ok>${okText}</button></div>`);
    p.body.querySelector('[data-no]').onclick = p.close;
    p.body.querySelector('[data-ok]').onclick = () => { p.close(); onOk(); };
  }

  /* ---------- Vẽ preview nhân vật ---------- */
  function drawAvatar(canvas, look, { scale = 1.6, t = 0, bg = true, headOnly = false } = {}) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (bg) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#d0ebff'); g.addColorStop(1, '#b2f2bb');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    ctx.save();
    if (headOnly) { ctx.translate(w / 2, h / 2 + 55 * scale - 2); }
    else ctx.translate(w / 2, h - 14 * scale / 1.6);
    ctx.scale(scale, scale);
    ART.character(ctx, 0, 0, look, { t, dir: 1 });
    ctx.restore();
  }

  /* ---------- HUD ---------- */
  function updateHud() {
    const S = AV.S;
    $('#hudName').textContent = S.name || 'Người chơi';
    $('#hudLv').textContent = S.level;
    $('#hudXp').style.width = Math.min(100, (S.xp / DATA.xpNeed(S.level)) * 100) + '%';
    $('#hudXpText').textContent = `${S.xp}/${DATA.xpNeed(S.level)} XP`;
    $('#hudCoins').textContent = S.coins.toLocaleString('vi-VN');
    drawAvatar($('#hudAvatar'), S.look, { scale: 1, headOnly: true, bg: false });
  }

  function setLocation(name) {
    const el = $('#hudLoc');
    el.textContent = name;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }

  /* ---------- Tạo / sửa nhân vật ---------- */
  function swatches(key, colors, cur) {
    return `<div class="swatches">${colors.map((c) => `<button class="sw ${c === cur ? 'on' : ''}" data-k="${key}" data-v="${c}" style="background:${c}"></button>`).join('')}</div>`;
  }
  function chips(key, items, cur) {
    return `<div class="chips">${items.map((it) => `<button class="chip ${it.id === cur ? 'on' : ''}" data-k="${key}" data-v="${it.id}">${it.name}</button>`).join('')}</div>`;
  }

  function characterEditor(isNew) {
    const S = AV.S;
    const look = { ...S.look };
    let name = S.name;
    const p = panel(isNew ? '✨ Tạo nhân vật của bạn' : '👕 Tủ đồ', '', { wide: true, locked: isNew });
    let timer;
    const render = () => {
      const hats = DATA.HATS.filter((h) => S.owned.hats.includes(h.id));
      const accs = DATA.ACCS.filter((a) => (S.owned.accs || ['none']).includes(a.id));
      const styles = DATA.SHIRT_STYLES.filter((s) => S.owned.shirtStyles.includes(s.id));
      p.body.innerHTML = `
        <div class="editor">
          <div class="preview-col">
            <canvas class="preview" id="pv"></canvas>
            <input class="field" id="nameInput" maxlength="16" placeholder="Tên nhân vật" value="${esc(name)}">
            <div class="err" id="nameErr"></div>
          </div>
          <div class="opts">
            <label>Màu da</label>${swatches('skin', DATA.SKINS, look.skin)}
            <label>Kiểu tóc</label>${chips('hair', DATA.HAIR_STYLES, look.hair)}
            <label>Màu tóc</label>${swatches('hairColor', DATA.HAIR_COLORS, look.hairColor)}
            <label>Màu áo</label>${swatches('shirt', DATA.SHIRT_COLORS, look.shirt)}
            <label>Kiểu áo ${isNew ? '' : '<small>(mua thêm ở Tiệm Thời Trang)</small>'}</label>${chips('shirtStyle', styles, look.shirtStyle)}
            <label>Màu quần</label>${swatches('pants', DATA.PANTS_COLORS, look.pants)}
            <label>Mũ / phụ kiện</label>${chips('hat', hats, look.hat)}
            <label>Trang sức / kính ${isNew ? '' : '<small>(mua ở Tiệm Thời Trang)</small>'}</label>${chips('acc', accs, look.acc || 'none')}
          </div>
        </div>
        <div class="row-end">
          ${isNew ? '<button class="btn ghost" data-random>🎲 Ngẫu nhiên</button>' : ''}
          <button class="btn" data-save>${isNew ? 'Bắt đầu chơi ▶' : 'Lưu'}</button>
        </div>`;
      const pv = p.body.querySelector('#pv');
      drawAvatar(pv, look);
      p.body.querySelectorAll('[data-k]').forEach((b) => b.onclick = () => {
        look[b.dataset.k] = b.dataset.v;
        name = p.body.querySelector('#nameInput').value;
        render();
      });
      const rnd = p.body.querySelector('[data-random]');
      if (rnd) rnd.onclick = () => {
        const pick = (a) => a[Math.floor(Math.random() * a.length)];
        look.skin = pick(DATA.SKINS); look.hair = pick(DATA.HAIR_STYLES).id; look.hairColor = pick(DATA.HAIR_COLORS);
        look.shirt = pick(DATA.SHIRT_COLORS); look.pants = pick(DATA.PANTS_COLORS);
        name = p.body.querySelector('#nameInput').value;
        render();
      };
      p.body.querySelector('[data-save]').onclick = () => {
        const n = p.body.querySelector('#nameInput').value.trim().replace(/\s+/g, ' ');
        if (n.length < 2) { p.body.querySelector('#nameErr').textContent = 'Tên cần ít nhất 2 ký tự.'; return; }
        S.name = n;
        S.look = look;
        AV.saveNow();
        updateHud();
        NET.sendState(isNew ? 'hello' : 'state');
        p.close();
        if (isNew) {
          toast(`Chào mừng ${n} tới thành phố! 🌆`, 3500);
          setTimeout(() => cityMap('start'), 300);
        } else toast('Đã lưu trang phục ✨');
      };
    };
    render();
    let t = 0;
    timer = setInterval(() => { t += 0.05; const pv = p.body.querySelector('#pv'); if (pv) drawAvatar(pv, look, { t }); }, 50);
    p.onClose = () => clearInterval(timer);
    if (isNew) setTimeout(() => p.body.querySelector('#nameInput').focus(), 50);
  }

  /* ---------- Túi đồ ---------- */
  function inventory() {
    const S = AV.S;
    const entries = Object.entries(S.inv).filter(([, n]) => n > 0);
    const now = Date.now();
    const status = (st, cfg, label) => {
      if (!st.fedAt) return `${label}: <b>đói bụng</b> — cần ${cfg.feed} 🌾`;
      const left = Math.ceil(cfg.time - (now - st.fedAt) / 1000);
      return left > 0 ? `${label}: đang sản xuất, còn <b>${AV.fmtDur(left)}</b>` : `${label}: <b>đã sẵn sàng thu hoạch!</b>`;
    };
    const p = panel('🎒 Túi đồ', `
      <div class="coins-line">💰 ${S.coins.toLocaleString('vi-VN')} xu · Cấp ${S.level}</div>
      ${entries.length ? `<div class="inv-grid">${entries.map(([id, n]) => {
        const it = DATA.ITEMS[id];
        return `<div class="inv-item"><span class="ic">${it.icon}${it.sub ? `<small>${it.sub}</small>` : ''}</span><b>${n}</b><span>${it.name}</span></div>`;
      }).join('')}</div>` : '<p class="muted">Túi trống trơn…</p>'}
      <div class="status">
        <div>🐔 ${status(S.coop, DATA.COOP, 'Chuồng gà')}</div>
        <div>🐄 ${status(S.pen, DATA.PEN, 'Chuồng gia súc')}</div>
      </div>`);
    return p;
  }

  /* ---------- Chợ ---------- */
  function shop(tab = 'buy') {
    const S = AV.S;
    const p = panel('🛒 Chợ', '', { wide: true });
    const qty = {};

    /** Ô nhập số lượng: nút −/+, ô số, nút nhanh, nút xác nhận hiện tổng tiền */
    const qtyBox = (key, price, max, kind) => {
      const q = Math.max(1, Math.min(qty[key] || 1, Math.max(1, max)));
      qty[key] = q;
      const label = kind === 'buy' ? 'Mua' : 'Bán';
      return `<div class="qty" data-key="${key}" data-price="${price}" data-max="${max}" data-kind="${kind}">
        <div class="qty-row">
          <button class="qbtn" data-step="-1" aria-label="Bớt">−</button>
          <input class="qin" type="number" inputmode="numeric" min="1" max="${max}" value="${q}">
          <button class="qbtn" data-step="1" aria-label="Thêm">+</button>
          <button class="btn small ${kind === 'buy' ? '' : 'sell'}" data-go ${max < 1 ? 'disabled' : ''}>${label} · <span class="qtot">${kind === 'buy' ? '' : '+'}${(q * price).toLocaleString('vi-VN')}</span>💰</button>
        </div>
        <div class="qquick">${[10, 50].filter((n) => n < max).map((n) => `<button data-set="${n}">${n}</button>`).join('')}<button data-set="${max}">${kind === 'buy' ? 'Tối đa' : 'Tất cả'} (${max.toLocaleString('vi-VN')})</button></div>
      </div>`;
    };

    const render = () => {
      let list = '';
      if (tab === 'buy') {
        const afford = (price) => Math.max(0, Math.min(999, Math.floor(S.coins / price)));
        const crops = Object.entries(DATA.CROPS);
        const rows = (arr) => arr.map(([id, c]) => {
          const locked = S.level < c.lvl;
          const have = S.inv['seed_' + id] || 0;
          return `<div class="shop-row ${locked ? 'locked' : ''}">
            <span class="ic">${c.icon}</span>
            <div class="info"><b>Hạt ${c.name.toLowerCase()}</b><small>⏱ ${AV.fmtDur(c.time)} · thu ${c.yield} ${c.icon}/ô · ${c.seed} xu/hạt · đang có ${have}</small></div>
            ${locked ? `<span class="lock">🔒 Cấp ${c.lvl}</span>` : qtyBox('seed_' + id, c.seed, afford(c.seed), 'buy')}
          </div>`;
        }).join('');
        list = '<h4 class="shop-h">🥕 Hạt rau củ (trồng ở Khu Trồng Trọt)</h4>' + rows(crops.filter(([, c]) => c.kind !== 'flower'))
          + '<h4 class="shop-h">🌼 Hạt hoa (trồng ở Vườn Hoa)</h4>' + rows(crops.filter(([, c]) => c.kind === 'flower' || c.kind === 'both'))
          + `<h4 class="shop-h">🧪 Phân bón</h4><div class="shop-row">
            <span class="ic">🧪</span>
            <div class="info"><b>Phân bón</b><small>Cây nhanh hơn ${Math.round(DATA.FERT.cut * 100)}% · ${DATA.FERT.price} xu/gói · đang có ${S.inv.fertilizer || 0}</small></div>
            ${qtyBox('fertilizer', DATA.FERT.price, afford(DATA.FERT.price), 'buy')}
          </div>`;
      } else {
        const items = Object.entries(S.inv).filter(([id, n]) => n > 0 && DATA.ITEMS[id] && DATA.ITEMS[id].sell > 0);
        const total = items.reduce((t, [id, n]) => t + DATA.ITEMS[id].sell * n, 0);
        list = items.length ? items.map(([id, n]) => {
          const it = DATA.ITEMS[id];
          return `<div class="shop-row">
            <span class="ic">${it.icon}</span>
            <div class="info"><b>${it.name}</b><small>Đang có ${n} · ${it.sell} xu/cái</small></div>
            ${qtyBox(id, it.sell, n, 'sell')}
          </div>`;
        }).join('') + `<div class="row-end"><button class="btn" data-sellall>💰 Bán tất cả · +${total.toLocaleString('vi-VN')} xu</button></div>`
          : '<p class="muted">Chưa có nông sản để bán. Hãy thu hoạch ruộng và chuồng trại nhé!</p>';
      }
      const scroll = p.body.querySelector('.shop-list') ? p.body.querySelector('.shop-list').scrollTop : 0;
      p.body.innerHTML = `
        <div class="coins-line">💰 ${S.coins.toLocaleString('vi-VN')} xu</div>
        <div class="tabs"><button class="chip ${tab === 'buy' ? 'on' : ''}" data-tab="buy">🌱 Mua hạt giống</button><button class="chip ${tab === 'sell' ? 'on' : ''}" data-tab="sell">💰 Bán nông sản</button></div>
        <div class="shop-list">${list}</div>`;
      p.body.querySelector('.shop-list').scrollTop = scroll;
      p.body.querySelectorAll('[data-tab]').forEach((bt) => bt.onclick = () => { tab = bt.dataset.tab; render(); });

      p.body.querySelectorAll('.qty').forEach((box) => {
        const key = box.dataset.key, price = +box.dataset.price, max = +box.dataset.max, kind = box.dataset.kind;
        const inp = box.querySelector('.qin'), tot = box.querySelector('.qtot');
        const set = (v) => {
          const n = Math.max(1, Math.min(Math.floor(+v) || 1, Math.max(1, max)));
          qty[key] = n;
          inp.value = n;
          tot.textContent = (kind === 'buy' ? '' : '+') + (n * price).toLocaleString('vi-VN');
        };
        inp.oninput = () => { if (inp.value !== '') set(inp.value); };
        inp.onblur = () => set(inp.value);
        inp.onkeydown = (e) => { if (e.key === 'Enter') box.querySelector('[data-go]').click(); };
        box.querySelectorAll('[data-step]').forEach((bt) => bt.onclick = () => set((qty[key] || 1) + +bt.dataset.step));
        box.querySelectorAll('[data-set]').forEach((bt) => bt.onclick = () => set(bt.dataset.set));
        box.querySelector('[data-go]').onclick = () => {
          set(inp.value);
          const n = qty[key];
          if (kind === 'buy') {
            if (key === 'fertilizer') AV.buyFert(n); else AV.buySeed(key.slice(5), n);
          } else AV.sell(key, n);
          qty[key] = 1;
          render();
        };
      });
      const sa = p.body.querySelector('[data-sellall]');
      if (sa) sa.onclick = () => confirm('Bán toàn bộ nông sản trong túi?', 'Bán tất cả', () => {
        Object.entries(S.inv).forEach(([id, n]) => { if (n > 0 && DATA.ITEMS[id] && DATA.ITEMS[id].sell > 0) AV.sell(id, n); });
        render();
      });
    };
    render();
  }

  /* ---------- Tiệm thời trang ---------- */
  function boutique() {
    const S = AV.S;
    const p = panel('👗 Tiệm Thời Trang', '', { wide: true });
    let tab = 'shirt';
    const render = () => {
      const card = (kind, it) => {
        const KEY = { hat: ['hats', 'hat'], shirt: ['shirtStyles', 'shirtStyle'], acc: ['accs', 'acc'] }[kind];
        const owned = (S.owned[KEY[0]] || ['none']).includes(it.id);
        const wearing = (S.look[KEY[1]] || 'none') === it.id;
        const locked = it.lvl && S.level < it.lvl;
        let btn;
        if (wearing) btn = '<button class="btn small ghost" disabled>Đang mặc</button>';
        else if (owned) btn = `<button class="btn small" data-wear="${kind}:${it.id}">Mặc thử</button>`;
        else if (locked) btn = `<button class="btn small ghost" disabled>🔒 Cấp ${it.lvl}</button>`;
        else btn = `<button class="btn small" data-buy="${kind}:${it.id}">Mua · ${it.price}💰</button>`;
        return `<div class="b-card"><canvas data-pv="${kind}:${it.id}"></canvas><b>${it.name}</b>${btn}</div>`;
      };
      p.body.innerHTML = `
        <div class="coins-line">💰 ${S.coins.toLocaleString('vi-VN')} xu</div>
        <div class="tabs">${[['shirt', '👗 Váy & áo'], ['hat', '🎩 Mũ'], ['acc', '💍 Trang sức']].map(([k, l]) => `<button class="chip ${tab === k ? 'on' : ''}" data-btab="${k}">${l}</button>`).join('')}</div>
        <div class="b-grid">${tab === 'hat' ? DATA.HATS.filter((h) => h.id !== 'none').map((h) => card('hat', h)).join('')
          : tab === 'acc' ? DATA.ACCS.filter((a) => a.id !== 'none').map((a) => card('acc', a)).join('')
            : DATA.SHIRT_STYLES.filter((s) => s.id !== 'plain').map((s) => card('shirt', s)).join('')}</div>
        <p class="muted small-note">Mua xong thay đổi tự do trong 👕 Tủ đồ. Hình xem trước dùng màu áo hiện tại của bạn.</p>`;
      p.body.querySelectorAll('[data-btab]').forEach((b) => b.onclick = () => { tab = b.dataset.btab; render(); });
      p.body.querySelectorAll('[data-pv]').forEach((c) => {
        const [kind, id] = c.dataset.pv.split(':');
        const look = { ...S.look, [{ hat: 'hat', shirt: 'shirtStyle', acc: 'acc' }[kind]]: id };
        drawAvatar(c, look, { scale: 1.15 });
      });
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => {
        const [kind, id] = b.dataset.buy.split(':');
        AV.buyWear(kind, id);
        render();
      });
      p.body.querySelectorAll('[data-wear]').forEach((b) => b.onclick = () => {
        const [kind, id] = b.dataset.wear.split(':');
        AV.wear(kind, id);
        render();
      });
    };
    render();
  }

  /* ---------- Chọn hạt giống ---------- */
  function seedPicker(tileIndex) {
    const S = AV.S;
    const flowerBed = AV.isFlowerTile(tileIndex);
    const seeds = Object.keys(DATA.CROPS).filter((id) => (S.inv['seed_' + id] || 0) > 0 && AV.cropAllowed(tileIndex, id));
    const empty = AV.emptyInBed(tileIndex);
    const p = panel(flowerBed ? '🌼 Trồng hoa' : '🌱 Gieo hạt', seeds.length
      ? `<p class="muted">Luống này còn <b>${empty}</b> ô trống. Cây lớn được nửa chừng sẽ khát nước 😟 — nhớ quay lại tưới nhé!</p>
        <div class="shop-list">${seeds.map((id) => {
        const c = DATA.CROPS[id];
        const have = S.inv['seed_' + id];
        return `<div class="shop-row"><span class="ic">${c.icon}</span>
          <div class="info"><b>${c.name}</b><small>⏱ ${AV.fmtDur(c.time)} · thu ${c.yield}/ô · còn ${have} hạt · bán ${c.sell} xu</small></div>
          <button class="btn small ghost" data-one="${id}">Gieo 1 ô</button>
          <button class="btn small" data-all="${id}">Cả luống (${Math.min(have, empty)})</button></div>`;
      }).join('')}</div>`
      : `<p class="muted">Bạn chưa có ${flowerBed ? 'hạt giống hoa (cúc, tulip, hướng dương, dâm bụt, hồng)' : 'hạt giống rau củ'}! Bấm 🗺️ đi xe buýt tới <b>Khu mua sắm</b> và ghé <b>Chợ</b> để mua nhé.</p>`);
    p.body.querySelectorAll('[data-one]').forEach((b) => b.onclick = () => { p.close(); AV.plant(tileIndex, b.dataset.one); });
    p.body.querySelectorAll('[data-all]').forEach((b) => b.onclick = () => { p.close(); AV.plantBed(tileIndex, b.dataset.all); });
  }

  /* ---------- Bản đồ thành phố ---------- */
  function drawCity(canvas) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const P = (px, py) => [px / 100 * w, py / 100 * h];
    ctx.fillStyle = '#8fd16a'; ctx.fillRect(0, 0, w, h);
    const r = ART.srand(7);
    for (let i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(60,140,50,.25)'; ctx.beginPath(); ctx.arc(r() * w, r() * h, 6 + r() * 10, 0, Math.PI * 2); ctx.fill(); }
    // biển góc phải trên
    ctx.fillStyle = '#f3d9a4';
    ctx.beginPath(); ctx.moveTo(w * 0.7, 0); ctx.quadraticCurveTo(w * 0.82, h * 0.22, w, h * 0.3); ctx.lineTo(w, 0); ctx.fill();
    ctx.fillStyle = '#4dabf7';
    ctx.beginPath(); ctx.moveTo(w * 0.78, 0); ctx.quadraticCurveTo(w * 0.88, h * 0.14, w, h * 0.2); ctx.lineTo(w, 0); ctx.fill();
    // sông
    ctx.strokeStyle = '#4dabf7'; ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-10, h * 0.45); ctx.bezierCurveTo(w * 0.2, h * 0.38, w * 0.32, h * 0.62, w * 0.42, h * 0.7); ctx.bezierCurveTo(w * 0.55, h * 0.8, w * 0.6, h * 0.95, w * 0.62, h + 10); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.stroke();
    // đường xe buýt nối các khu
    const hub = P(50, 52);
    ctx.strokeStyle = '#6c6c6c'; ctx.lineWidth = 12;
    DATA.ZONES.forEach((z) => { const p = P(z.x, z.y); ctx.beginPath(); ctx.moveTo(hub[0], hub[1]); ctx.lineTo(p[0], hub[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); });
    ctx.strokeStyle = '#f1e9da'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
    DATA.ZONES.forEach((z) => { const p = P(z.x, z.y); ctx.beginPath(); ctx.moveTo(hub[0], hub[1]); ctx.lineTo(p[0], hub[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); });
    ctx.setLineDash([]);
    // nhà cửa trang trí
    for (let i = 0; i < 26; i++) {
      const x = r() * w, y = r() * h;
      if (Math.abs(x - hub[0]) < 40 || DATA.ZONES.some((z) => Math.hypot(P(z.x, z.y)[0] - x, P(z.x, z.y)[1] - y) < 55)) continue;
      ctx.fillStyle = ['#fff4e0', '#ffe3e3', '#e7f5ff'][i % 3]; ctx.fillRect(x - 8, y - 6, 16, 12);
      ctx.fillStyle = ['#e8590c', '#c92a2a', '#1971c2'][i % 3];
      ctx.beginPath(); ctx.moveTo(x - 10, y - 6); ctx.lineTo(x, y - 14); ctx.lineTo(x + 10, y - 6); ctx.fill();
    }
    for (let i = 0; i < 30; i++) { const x = r() * w, y = r() * h; ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
  }

  function cityMap(mode) {
    const fromStop = mode === true, start = mode === 'start';
    const p = panel(start ? '🌆 Bạn muốn đến đâu?' : '🗺️ Bản đồ thành phố', `
      <div class="citymap"><canvas></canvas><div class="zones"></div></div>
      ${start ? '' : '<div class="row-end"><button class="btn ghost small" data-friends>🏡 Thăm nông trại bạn bè</button></div>'}
      <p class="muted small-note">${start ? 'Chào mừng tới thành phố! Chọn khu bạn muốn bắt đầu — sau này đi lại bằng xe buýt 🚌' : fromStop ? 'Chọn nơi muốn đến — xe buýt sẽ tới đón bạn 🚌' : 'Chọn nơi muốn đến — nhân vật sẽ tự đi ra trạm xe buýt 🚌'}</p>`, { wide: true, locked: start });
    const box = p.body.querySelector('.citymap');
    const zones = p.body.querySelector('.zones');
    const render = () => {
      const counts = NET.zoneCounts();
      const cur = start ? null : AV.currentMap();
      zones.innerHTML = DATA.ZONES.map((z) => `
        <button class="zone ${z.id === cur ? 'here' : ''}" data-z="${z.id}" style="left:${z.x}%;top:${z.y}%">
          <span class="zi">${z.icon}</span>
          <b>${z.name}</b>
          <small>${z.id === cur ? '📍 Bạn ở đây' : z.desc}</small>
          ${counts[z.id] ? `<em>👥 ${counts[z.id]}</em>` : ''}
        </button>`).join('');
      zones.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => { p.close(); if (start) AV.teleport(b.dataset.z, true); else AV.travelTo(b.dataset.z); });
      const fb = p.body.querySelector('[data-friends]');
      if (fb) fb.onclick = () => { p.close(); friendsPanel(); };
    };
    requestAnimationFrame(() => drawCity(box.querySelector('canvas')));
    render();
    const timer = setInterval(render, 2000);
    p.onClose = () => clearInterval(timer);
  }

  /* ---------- Tiệm thú cưng ---------- */
  function petShop() {
    const S = AV.S;
    const p = panel('🐶 Tiệm Thú Cưng', '', { wide: true });
    const render = () => {
      p.body.innerHTML = `
        <div class="coins-line">💰 ${S.coins.toLocaleString('vi-VN')} xu</div>
        <p class="muted">Thú cưng sẽ đi theo bạn khắp thành phố — người chơi khác cũng nhìn thấy!</p>
        <div class="b-grid">${DATA.PETS.map((pt) => {
          const owned = S.owned.pets.includes(pt.id);
          const using = S.look.pet === pt.id;
          const btn = using ? '<button class="btn small ghost" disabled>Đang dẫn</button>'
            : owned ? `<button class="btn small" data-use="${pt.id}">${pt.id === 'none' ? 'Đi một mình' : 'Dẫn theo'}</button>`
              : `<button class="btn small" data-buy="${pt.id}">Mua · ${pt.price}💰</button>`;
          return `<div class="b-card"><canvas data-pet="${pt.id}"></canvas><b>${pt.name}</b>${btn}</div>`;
        }).join('')}</div>`;
      p.body.querySelectorAll('[data-pet]').forEach((c) => {
        const ctx = c.getContext('2d');
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const g = ctx.createLinearGradient(0, 0, 0, c.clientHeight);
        g.addColorStop(0, '#e6fcf5'); g.addColorStop(1, '#b2f2bb');
        ctx.fillStyle = g; ctx.fillRect(0, 0, c.clientWidth, c.clientHeight);
        if (c.dataset.pet === 'none') { ctx.font = '40px system-ui, "Segoe UI Emoji"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚶', c.clientWidth / 2, c.clientHeight / 2); return; }
        ctx.save(); ctx.translate(c.clientWidth / 2 - 4, c.clientHeight - 22); ctx.scale(2.2, 2.2);
        ART.pet(ctx, 0, 0, c.dataset.pet, 1, 0, false);
        ctx.restore();
      });
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { AV.buyPet(b.dataset.buy); render(); });
      p.body.querySelectorAll('[data-use]').forEach((b) => b.onclick = () => { AV.wearPet(b.dataset.use); render(); });
    };
    render();
  }

  /* ---------- Bầu cua tôm cá ---------- */
  function bauCua() {
    const S = AV.S;
    const p = panel('🎲 Bầu Cua Tôm Cá', '', { wide: true });
    let chip = 10, bets = {}, lastBets = {}, rolling = false, dice = ['❔', '❔', '❔'], msg = 'Chọn mức cược rồi bấm vào ô để đặt. Ra mấy mặt ăn bấy nhiêu lần!';
    const total = () => Object.values(bets).reduce((a, b) => a + b, 0);
    const render = () => {
      p.body.innerHTML = `
        <div class="coins-line">💰 ${S.coins.toLocaleString('vi-VN')} xu · Đang cược: ${total()} xu</div>
        <div class="dice">${dice.map((d) => `<span class="die ${rolling ? 'roll' : ''}">${d}</span>`).join('')}</div>
        <p class="game-msg">${msg}</p>
        <div class="chips center">${[5, 10, 50, 100].map((c) => `<button class="chip ${c === chip ? 'on' : ''}" data-chip="${c}">🪙 ${c}</button>`).join('')}</div>
        <div class="bc-board">${DATA.BAUCUA.map((s) => `
          <button class="bc-cell" data-bet="${s.id}" ${rolling ? 'disabled' : ''}>
            <span class="ic">${s.icon}</span><b>${s.name}</b>${bets[s.id] ? `<em>${bets[s.id]}</em>` : ''}
          </button>`).join('')}</div>
        <div class="row-end">
          <button class="btn ghost" data-clear ${rolling || !total() ? 'disabled' : ''}>Huỷ cược</button>
          <button class="btn ghost" data-again ${rolling || total() || !Object.keys(lastBets).length ? 'disabled' : ''}>Cược lại</button>
          <button class="btn" data-roll ${rolling || !total() ? 'disabled' : ''}>🎲 Lắc!</button>
        </div>`;
      p.body.querySelectorAll('[data-chip]').forEach((b) => b.onclick = () => { chip = +b.dataset.chip; render(); });
      p.body.querySelectorAll('[data-bet]').forEach((b) => b.onclick = () => {
        if (rolling || !AV.spend(chip)) return;
        bets[b.dataset.bet] = (bets[b.dataset.bet] || 0) + chip;
        render();
      });
      const clear = p.body.querySelector('[data-clear]');
      clear.onclick = () => { S.coins += total(); bets = {}; AV.saveNow(); updateHud(); render(); };
      p.body.querySelector('[data-again]').onclick = () => {
        const need = Object.values(lastBets).reduce((a, b) => a + b, 0);
        if (!AV.spend(need)) return;
        bets = { ...lastBets };
        render();
      };
      p.body.querySelector('[data-roll]').onclick = roll;
    };
    const roll = () => {
      rolling = true;
      msg = 'Đang lắc… 🫨';
      let ticks = 0;
      const iv = setInterval(() => {
        dice = dice.map(() => DATA.BAUCUA[Math.floor(Math.random() * 6)].icon);
        render();
        if (++ticks >= 12) {
          clearInterval(iv);
          const res = [0, 1, 2].map(() => DATA.BAUCUA[Math.floor(Math.random() * 6)]);
          dice = res.map((r) => r.icon);
          let win = 0;
          const spent = total();
          for (const [id, b] of Object.entries(bets)) {
            const k = res.filter((r) => r.id === id).length;
            if (k) win += b + b * k;
          }
          const net = win - spent;
          msg = `Ra: <b>${res.map((r) => r.name).join(' · ')}</b> — ${net > 0 ? `🎉 Thắng <b>+${net}</b> xu!` : net === 0 ? 'Hoà vốn 😅' : `😢 Thua <b>${-net}</b> xu`}`;
          if (win) AV.earn(win, 1);
          lastBets = bets;
          bets = {};
          rolling = false;
          render();
        }
      }, 110);
    };
    p.onClose = () => { if (total() && !rolling) { S.coins += total(); AV.saveNow(); updateHud(); } };
    render();
  }

  /* ---------- Bài cào 3 lá ---------- */
  function baiCao() {
    const S = AV.S;
    const p = panel('🃏 Bài Cào 3 Lá', '', { wide: true });
    const SUITS = ['♠', '♣', '♦', '♥'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let bet = 20, me = [], dealer = [], reveal = false, busy = false, msg = 'Tổng điểm 3 lá lấy hàng đơn vị, cao hơn nhà cái là thắng. Ba Tây (J/Q/K) là to nhất!';
    const val = (c) => (c.r === 'A' ? 1 : ['10', 'J', 'Q', 'K'].includes(c.r) ? 0 : +c.r);
    const score = (h) => h.reduce((s, c) => s + val(c), 0) % 10;
    const baTay = (h) => h.every((c) => ['J', 'Q', 'K'].includes(c.r));
    const label = (h) => (baTay(h) ? 'Ba Tây 👑' : `${score(h)} nút`);
    const card = (c, hidden) => hidden
      ? '<span class="card back">🂠</span>'
      : `<span class="card ${'♦♥'.includes(c.s) ? 'red' : ''}"><b>${c.r}</b><i>${c.s}</i></span>`;
    const render = () => {
      p.body.innerHTML = `
        <div class="coins-line">💰 ${S.coins.toLocaleString('vi-VN')} xu</div>
        <div class="hand"><span class="who">Nhà cái ${dealer.length && reveal ? `· ${label(dealer)}` : ''}</span>${dealer.map((c) => card(c, !reveal)).join('') || '<span class="muted">—</span>'}</div>
        <div class="hand"><span class="who">Bạn ${me.length ? `· ${label(me)}` : ''}</span>${me.map((c) => card(c, false)).join('') || '<span class="muted">—</span>'}</div>
        <p class="game-msg">${msg}</p>
        <div class="chips center">${[10, 20, 50, 100].map((c) => `<button class="chip ${c === bet ? 'on' : ''}" data-b="${c}" ${busy ? 'disabled' : ''}>🪙 ${c}</button>`).join('')}</div>
        <div class="row-end"><button class="btn" data-deal ${busy ? 'disabled' : ''}>🃏 Chia bài (${bet} xu)</button></div>`;
      p.body.querySelectorAll('[data-b]').forEach((b) => b.onclick = () => { bet = +b.dataset.b; render(); });
      p.body.querySelector('[data-deal]').onclick = deal;
    };
    const deal = () => {
      if (busy || !AV.spend(bet)) return;
      const deck = [];
      SUITS.forEach((s) => RANKS.forEach((r) => deck.push({ r, s })));
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      me = deck.slice(0, 3); dealer = deck.slice(3, 6);
      reveal = false; busy = true; msg = 'Nhà cái đang lật bài… 🤫';
      render();
      setTimeout(() => {
        reveal = true; busy = false;
        const a = baTay(me), b = baTay(dealer);
        let result;
        if (a && !b) result = 1; else if (b && !a) result = -1; else if (a && b) result = 0;
        else result = Math.sign(score(me) - score(dealer));
        if (result > 0) {
          const win = a ? bet * 3 : bet * 2;
          AV.earn(win, 2);
          msg = `🎉 Bạn thắng <b>+${win - bet}</b> xu!${a ? ' Ba Tây ăn gấp đôi!' : ''}`;
        } else if (result === 0) {
          AV.earn(bet);
          msg = '🤝 Hoà — trả lại tiền cược.';
        } else msg = `😢 Nhà cái thắng, bạn mất ${bet} xu.`;
        render();
      }, 1000);
    };
    render();
  }

  /* ---------- Nhà bếp ---------- */
  function kitchen() {
    const S = AV.S;
    const p = panel('🍳 Nhà Bếp', '', { wide: true });
    const render = () => {
      p.body.innerHTML = `
        <p class="muted">Nấu món ăn từ nông sản để bán được giá cao hơn ở Chợ.</p>
        <div class="shop-list">${DATA.RECIPES.map((r) => {
          const ok = AV.canCook(r);
          const need = Object.entries(r.need).map(([id, n]) => {
            const have = S.inv[id] || 0;
            return `<span class="${have >= n ? 'ok' : 'lack'}">${DATA.ITEMS[id].icon} ${have}/${n}</span>`;
          }).join(' ');
          return `<div class="shop-row">
            <span class="ic">${r.icon}</span>
            <div class="info"><b>${r.name}</b><small class="need">${need} · bán ${r.sell} xu · +${r.xp} XP</small></div>
            <button class="btn small" data-cook="${r.id}" ${ok ? '' : 'disabled'}>🔥 Nấu</button>
          </div>`;
        }).join('')}</div>`;
      p.body.querySelectorAll('[data-cook]').forEach((b) => b.onclick = () => { AV.cook(b.dataset.cook); render(); });
    };
    render();
  }

  /* ---------- Lời mời chơi bài ---------- */
  function tableInvite(from) {
    const old = document.querySelector('.invite-card');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'invite-card';
    el.innerHTML = `<div>🃏 <b>${esc(from)}</b> mời bạn chơi <b>Tiến lên</b>!</div>
      <div class="row-end"><button class="btn ghost small" data-no>Để sau</button><button class="btn small" data-yes>Vào bàn</button></div>`;
    document.body.appendChild(el);
    el.querySelector('[data-no]').onclick = () => el.remove();
    el.querySelector('[data-yes]').onclick = () => { el.remove(); TABLE.openView(); };
    setTimeout(() => el.remove(), 15000);
  }

  /* ---------- Chăm sóc luống: tưới nước, bón phân ---------- */
  function careBed(bed) {
    const p = panel('🌱 Chăm sóc luống', '');
    const render = () => {
      const c = AV.bedCare(bed);
      if (!c.growing) { p.close(); return; }
      p.body.innerHTML = `
        <p class="muted">Luống có <b>${c.growing}</b> cây đang lớn · cây chín sớm nhất còn <b>${AV.fmtDur(c.soonest)}</b>.</p>
        <div class="shop-list">
          <div class="shop-row"><span class="ic">💧</span><div class="info"><b>Tưới nước</b><small>Miễn phí · nhanh hơn ${Math.round(DATA.WATER_CUT * 100)}% · ${c.dry ? c.dry + ' cây chưa tưới' : 'đã tưới hết'}</small></div>
            <button class="btn small" data-water ${c.dry ? '' : 'disabled'}>Tưới</button></div>
          <div class="shop-row"><span class="ic">🧪</span><div class="info"><b>Bón phân</b><small>1 gói/ô · nhanh hơn ${Math.round(DATA.FERT.cut * 100)}% · ${c.unfert ? c.unfert + ' cây chưa bón' : 'đã bón hết'} · đang có <b>${c.fert}</b> gói</small></div>
            <button class="btn small" data-fert ${c.unfert && c.fert ? '' : 'disabled'}>Bón</button></div>
        </div>
        ${c.fert ? '' : '<p class="muted small-note">Hết phân bón? Mua ở 🛒 Chợ trong Khu mua sắm (5 xu/gói).</p>'}`;
      p.body.querySelector('[data-water]').onclick = () => { AV.waterBed(bed); render(); };
      p.body.querySelector('[data-fert]').onclick = () => { AV.fertBed(bed); render(); };
    };
    render();
  }

  /* ---------- Thẻ người chơi & thăm nông trại bạn bè ---------- */
  function playerCard(r) {
    const p = panel(`👤 ${esc(r.name)}`, `
      <div class="menu-head"><canvas class="menu-av"></canvas><div><b>${esc(r.name)}</b><small>Cấp ${r.level || 1}${r.user ? ' · @' + esc(r.user) : ' · chơi không tài khoản'}</small></div></div>
      <div class="row-end">
        <button class="btn ghost" data-wave>👋 Vẫy tay</button>
        ${r.user ? '<button class="btn" data-visit>🏡 Thăm nông trại</button>' : ''}
      </div>
      ${r.user ? '' : '<p class="muted small-note">Người này chưa có tài khoản nên chưa thăm nông trại được.</p>'}`);
    drawAvatar(p.body.querySelector('.menu-av'), r.look || AV.S.look, { scale: 0.9 });
    p.body.querySelector('[data-wave]').onclick = () => { p.close(); AV.say(`👋 Chào ${r.name}!`); };
    const v = p.body.querySelector('[data-visit]');
    if (v) v.onclick = () => { p.close(); AV.visitFarm(r.user); };
  }

  function friendsPanel() {
    const p = panel('🏡 Thăm nông trại bạn bè', '', { wide: true });
    if (!CLOUD.user) {
      p.body.innerHTML = `<p class="muted">Cần đăng nhập tài khoản để thăm nông trại của bạn bè và để bạn bè thăm nông trại của bạn.</p>
        <div class="row-end"><button class="btn" data-login>🔐 Đăng nhập / Tạo tài khoản</button></div>`;
      p.body.querySelector('[data-login]').onclick = () => { p.close(); authPanel(false); };
      return;
    }
    const visiting = AV.visiting();
    p.body.innerHTML = `
      <p class="muted">Gõ <b>tên đăng nhập</b> của bạn bè hoặc chọn trong danh sách. Ở nông trại bạn bè, bấm ô ruộng để <b>💧 tưới giúp</b> (mỗi ngày 1 lần mỗi bạn, cả hai đều được thưởng). Tên đăng nhập của bạn: <b>@${esc(CLOUD.username)}</b></p>
      <form class="fsearch"><input class="field" name="u" placeholder="Tên đăng nhập của bạn bè" maxlength="20" autocomplete="off"><button class="btn">🔍 Thăm</button></form>
      ${visiting ? '<div class="row-end"><button class="btn ghost" data-home>🌾 Về nông trại của mình</button></div>' : ''}
      <h4>Người chơi gần đây</h4>
      <div class="shop-list" id="flist"><p class="muted">⏳ Đang tải…</p></div>`;
    const f = p.body.querySelector('form');
    f.onsubmit = (e) => { e.preventDefault(); const u = f.u.value.trim(); if (u) { p.close(); AV.visitFarm(u); } };
    const h = p.body.querySelector('[data-home]');
    if (h) h.onclick = () => { p.close(); AV.goHomeFarm(); };
    CLOUD.recentFarms().then((rows) => {
      const list = p.body.querySelector('#flist');
      if (!list) return;
      const ago = (t) => { const m = Math.floor((Date.now() - new Date(t).getTime()) / 60000); return m < 1 ? 'vừa xong' : m < 60 ? m + ' phút trước' : m < 1440 ? Math.floor(m / 60) + ' giờ trước' : Math.floor(m / 1440) + ' ngày trước'; };
      const others = (rows || []).filter((r) => r.username && r.username !== CLOUD.username);
      list.innerHTML = others.length ? others.map((r) => `<div class="shop-row"><span class="ic">🧑‍🌾</span>
        <div class="info"><b>${esc(r.name)}</b><small>@${esc(r.username)} · Cấp ${r.level} · chơi ${ago(r.updated_at)}</small></div>
        <button class="btn small" data-v="${esc(r.username)}">🏡 Thăm</button></div>`).join('') : '<p class="muted">Chưa có người chơi nào khác.</p>';
      list.querySelectorAll('[data-v]').forEach((b) => b.onclick = () => { p.close(); AV.visitFarm(b.dataset.v); });
    }).catch((e) => { const list = p.body.querySelector('#flist'); if (list) list.innerHTML = `<p class="muted">⚠️ ${esc(e.message)}</p>`; });
    setTimeout(() => f.u.focus(), 60);
  }

  function updateVisitBar(v) {
    const bar = $('#visitBar');
    if (!bar) return;
    bar.classList.toggle('show', !!v);
    if (v) {
      bar.innerHTML = `🏡 Đang thăm nông trại của <b>${esc(v.data.name)}</b> <small>· bấm ô ruộng để 💧 tưới giúp</small><button data-home>🌾 Về nhà mình</button>`;
      bar.querySelector('[data-home]').onclick = () => AV.goHomeFarm();
    }
  }

  /* ---------- Máy game (chơi trong khung, không rời khỏi Avatar) ---------- */
  function arcade(id) {
    const g = DATA.ARCADE.find((x) => x.id === id);
    if (!g) return;
    try { localStorage.setItem('gh_name', JSON.stringify(AV.S.name || 'Khách')); } catch (e) { /* bỏ qua */ }
    const v = $('#arcadeView');
    v.innerHTML = `<div class="arc-bar"><b>${g.icon} ${g.name}</b><span>Điểm càng cao thưởng càng nhiều xu (tối đa 40 xu/ván)</span><button class="tv-x" data-close>✕ Thoát</button></div>
      <iframe src="arcade/games/${id}.html" title="${g.name}"></iframe>`;
    v.classList.add('show');
    v.querySelector('[data-close]').onclick = closeArcade;
  }
  function closeArcade() {
    const v = $('#arcadeView');
    v.classList.remove('show');
    v.innerHTML = '';
  }
  const arcadeOpen = () => $('#arcadeView').classList.contains('show');

  /* ---------- Gara xe ---------- */
  function garage() {
    const S = AV.S;
    const p = panel('🔧 Gara xe', '', { wide: true });
    const render = () => {
      S.cars = S.cars || ['basic'];
      p.body.innerHTML = `<div class="coins-line">💰 ${S.coins.toLocaleString('vi-VN')} xu · Kỷ lục đua: <b>${S.bestRace ? S.bestRace.toFixed(1) + 's' : 'chưa có'}</b></div>
        <div class="shop-list">${RACE.CARS.map((c) => {
          const owned = S.cars.includes(c.id), using = (S.car || 'basic') === c.id, locked = c.lvl && S.level < c.lvl;
          const btn = using ? '<button class="btn small ghost" disabled>Đang dùng</button>'
            : owned ? `<button class="btn small" data-use="${c.id}">Dùng xe này</button>`
              : locked ? `<span class="lock">🔒 Cấp ${c.lvl}</span>` : `<button class="btn small" data-buy="${c.id}">Mua · ${c.price}💰</button>`;
          return `<div class="shop-row"><span class="ic">🏎️</span><div class="info"><b>${c.name}</b><small>Tốc độ ×${c.speed}${c.price ? '' : ' · miễn phí'}</small></div>${btn}</div>`;
        }).join('')}</div>
        <p class="muted small-note">Màu xe chọn ngay trước khi đua ở cổng xuất phát.</p>`;
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { RACE.buyCar(b.dataset.buy); render(); });
      p.body.querySelectorAll('[data-use]').forEach((b) => b.onclick = () => { S.car = b.dataset.use; AV.saveNow(); render(); });
    };
    render();
  }

  /* ---------- Rương cất đồ trong nhà ---------- */
  function storage() {
    const S = AV.S;
    const p = panel('📦 Rương cất đồ', '', { wide: true });
    const list = (obj, toChest) => {
      const items = Object.entries(obj || {}).filter(([id, n]) => n > 0 && DATA.ITEMS[id]);
      return items.length ? items.map(([id, n]) => `<div class="shop-row"><span class="ic">${DATA.ITEMS[id].icon}</span>
        <div class="info"><b>${DATA.ITEMS[id].name}</b><small>× ${n}</small></div>
        <button class="btn small ${toChest ? '' : 'ghost'}" data-move="${id}" data-to="${toChest ? 1 : 0}">${toChest ? 'Cất vào rương →' : '← Lấy ra túi'}</button></div>`).join('')
        : '<p class="muted">Trống</p>';
    };
    const render = () => {
      p.body.innerHTML = `<p class="muted">Đồ cất trong rương được giữ an toàn, không bị bán nhầm ở Chợ. Muốn bán thì lấy ra túi trước.</p>
        <div class="store-cols"><div><h4>🎒 Túi đồ</h4><div class="shop-list">${list(S.inv, true)}</div></div>
        <div><h4>📦 Rương</h4><div class="shop-list">${list(S.storage, false)}</div></div></div>`;
      p.body.querySelectorAll('[data-move]').forEach((b) => b.onclick = () => { AV.storeItem(b.dataset.move, b.dataset.to === '1'); render(); });
    };
    render();
  }

  /* ---------- Nhiệm vụ hằng ngày ---------- */
  function questsPanel() {
    const p = panel('📜 Nhiệm vụ hôm nay', '', { wide: true });
    const render = () => {
      const list = AV.quests();
      p.body.innerHTML = `
        <p class="muted">Nhiệm vụ đổi mới mỗi ngày. Hoàn thành rồi bấm <b>Nhận thưởng</b> nhé!</p>
        <div class="shop-list">${list.map((q) => {
          const d = DATA.QUESTS.find((x) => x.id === q.id);
          const done = q.prog >= q.n;
          const btn = q.claimed ? '<button class="btn small ghost" disabled>✅ Đã nhận</button>'
            : done ? `<button class="btn small" data-claim="${q.id}">🎁 Nhận thưởng</button>`
              : `<button class="btn small ghost" disabled>${q.prog}/${q.n}</button>`;
          return `<div class="shop-row quest ${done && !q.claimed ? 'ready' : ''}"><span class="ic">${d.icon}</span>
            <div class="info"><b>${d.text.replace('{n}', q.n)}</b>
              <div class="qbar"><i style="width:${Math.min(100, q.prog / q.n * 100)}%"></i></div>
              <small>Thưởng: ${d.coins} xu · ${d.xp} XP</small></div>${btn}</div>`;
        }).join('')}</div>`;
      p.body.querySelectorAll('[data-claim]').forEach((b) => b.onclick = () => { AV.claimQuest(b.dataset.claim); render(); });
    };
    render();
  }

  function updateQuestDot() {
    const btn = $('#btnQuest');
    if (!btn) return;
    const ready = AV.quests().some((q) => q.prog >= q.n && !q.claimed);
    btn.classList.toggle('dot', ready);
  }

  /* ---------- Hướng dẫn & cài đặt ---------- */
  function help() {
    const p = panel('❓ Cách chơi', `
      <ul class="help">
        <li>👆 <b>Chạm / click</b> vào mặt đất để đi, hoặc dùng <b>phím mũi tên / WASD</b>.</li>
        <li>🌾 Bấm <b>ô ruộng</b> để gieo hạt (gieo 1 ô hoặc cả luống). Bấm luống đang lớn để <b>💧 tưới nước</b> (nhanh hơn 10%) và <b>🧪 bón phân</b> (nhanh hơn 30%). Cây khát 😟 thì phải tưới mới lớn tiếp.</li>
        <li>🐔 Cho <b>gà</b> ăn 3 lúa mì → có 5 trứng. 🐄 Cho <b>gia súc</b> ăn 4 lúa mì → có sữa & len.</li>
        <li>🃏 Ở <b>Khu giải trí</b>, bấm bàn <b>Tiến lên</b> để ngồi, mời bạn bè cùng chơi (thiếu người có máy chơi thay).</li>
        <li>🏫 Tới <b>Trường học</b>: cô giáo ra câu đố tiếng Anh mỗi 20 giây, gõ đáp án vào chat (hoặc bấm nút A/B/C/D). Ai đúng đầu tiên được thưởng nhiều nhất!</li>
        <li>📜 Bấm nút <b>📜</b> xem nhiệm vụ hằng ngày để nhận thêm xu.</li>
        <li>🌼 <b>Vườn Hoa</b> trồng hoa cúc, tulip, hướng dương, dâm bụt, hồng — bán lấy tiền hoặc gói <b>💐 Bó hoa</b> ở Nhà bếp. 🎠 <b>Sân Chơi</b> cạnh vườn hoa có xích đu và vọng lâu.</li>
        <li>🏡 Mỗi người có <b>nông trại riêng</b>. Bấm vào người chơi khác → <b>Thăm nông trại</b>, hoặc MENU → <b>Thăm bạn bè</b>. Ở nông trại bạn, bấm ô ruộng để <b>💧 tưới giúp</b>.</li>
        <li>🕹️ <b>Khu Game</b> trong Khu giải trí: máy chơi Pikachu, Flappy Bird, Đào Vàng — điểm cao được thưởng xu.</li>
        <li>🏎️ <b>Khu Đua Xe</b>: bấm cổng xuất phát để đua 3 vòng (đua một mình với máy hoặc với người chơi khác cùng lúc), về nhất được thưởng. Mua xe nhanh hơn ở Gara.</li>
        <li>🍊 <b>Vườn Cây</b> trong nông trại tự ra quả (cam, táo, xoài, đào) — không cần trồng, quả chín để lâu không hỏng, ghé hái rồi đem bán.</li>
        <li>🍳 Vào <b>Nhà Bếp</b> ở Nông trại nấu bánh, súp, khăn len… bán được giá cao hơn nhiều.</li>
        <li>🗺️ Ra <b>trạm xe buýt</b> hoặc bấm <b>Bản đồ</b> để đi 6 khu: Nông trại, Quảng trường, Khu mua sắm, Khu giải trí, Công viên, Bãi biển.</li>
        <li>🛍️ <b>Khu mua sắm</b>: Chợ, Tiệm Thời Trang, Tiệm Thú Cưng. 🎡 <b>Khu giải trí</b>: Bầu cua, Bài cào, sân khấu, vòng quay.</li>
        <li>🎣 Câu cá ở <b>Công viên</b>, 🐚 nhặt vỏ sò ở <b>Bãi biển</b> rồi đem bán ở Chợ.</li>
        <li>💬 Gõ chat ở thanh dưới cùng — người chơi khác cùng khu vực sẽ thấy, NPC trong thị trấn cũng trả lời!</li>
        <li>👥 Bấm ô <b>🟢 online</b> trên cùng để xem ai đang ở cùng khu vực với bạn.</li>
        <li>🏠 Bấm vào <b>nhà</b> để vào trong: phòng khách (xem TV), bếp (nấu ăn), phòng ngủ (ngủ, tủ quần áo), phòng tắm, kho (rương cất đồ).</li>
        <li>⏱ Cây và vật nuôi vẫn lớn khi bạn tắt game.</li>
      </ul>
      <div class="row-end"><button class="btn" data-ok>Đã hiểu!</button></div>`);
    p.body.querySelector('[data-ok]').onclick = p.close;
  }

  function menu() {
    const S = AV.S;
    const items = [
      ['bag', '🎒', 'Túi đồ', inventory],
      ['wear', '👕', 'Tủ đồ', () => characterEditor(false)],
      ['map', '🗺️', 'Bản đồ', () => cityMap(false)],
      ['quest', '📜', 'Nhiệm vụ', questsPanel],
      ['friends', '🏡', 'Thăm bạn bè', friendsPanel],
      ['people', '👥', 'Người chơi', playersPanel],
      ['help', '❓', 'Cách chơi', help],
      ['set', '⚙️', 'Cài đặt', settings],
    ];
    const p = panel('☰ MENU', `
      <div class="menu-head"><canvas class="menu-av"></canvas><div><b>${esc(S.name)}</b><small>Cấp ${S.level} · 💰 ${S.coins.toLocaleString('vi-VN')} xu</small></div></div>
      <div class="menu-grid">${items.map(([id, ic, label]) => `<button class="menu-item" data-m="${id}"><span>${ic}</span>${label}</button>`).join('')}</div>`);
    drawAvatar(p.body.querySelector('.menu-av'), S.look, { scale: 0.9 });
    p.body.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => {
      const it = items.find((x) => x[0] === b.dataset.m);
      p.close();
      it[3]();
    });
  }

  /* ---------- Đăng nhập / đăng ký ---------- */
  function authPanel(first) {
    let tab = 'login';
    const p = panel('🔐 Tài khoản', '', { locked: first });
    const render = (err = '') => {
      p.body.innerHTML = `
        <p class="muted">Đăng nhập để lưu nhân vật lên mạng — chơi trên điện thoại hay máy tính đều ra đúng nhân vật của bạn.</p>
        <div class="tabs"><button class="chip ${tab === 'login' ? 'on' : ''}" data-tab="login">Đăng nhập</button><button class="chip ${tab === 'signup' ? 'on' : ''}" data-tab="signup">Tạo tài khoản mới</button></div>
        <form class="auth-form" autocomplete="on">
          <input class="field" name="u" autocomplete="username" placeholder="Tên đăng nhập (vd: lam_2024)" maxlength="20">
          <input class="field" name="pw" type="password" autocomplete="${tab === 'login' ? 'current-password' : 'new-password'}" placeholder="Mật khẩu (ít nhất 6 ký tự)">
          ${tab === 'signup' ? '<input class="field" name="pw2" type="password" autocomplete="new-password" placeholder="Nhập lại mật khẩu">' : ''}
          <div class="err">${esc(err)}</div>
          <button class="btn big" type="submit">${tab === 'login' ? '▶ Đăng nhập' : '✨ Tạo tài khoản'}</button>
        </form>
        ${tab === 'signup' && AV.S.name ? `<p class="muted small-note">Nhân vật <b>${esc(AV.S.name)}</b> đang chơi trên máy này sẽ được chuyển vào tài khoản mới.</p>` : ''}
        ${first ? '<div class="row-end"><button class="btn ghost small" data-guest>Chơi thử không cần tài khoản (chỉ lưu trên máy này)</button></div>' : ''}`;
      p.body.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      const g = p.body.querySelector('[data-guest]');
      if (g) g.onclick = () => { p.close(); AV.playAsGuest(); };
      const f = p.body.querySelector('form');
      setTimeout(() => f.u.focus(), 50);
      f.onsubmit = async (e) => {
        e.preventDefault();
        const btn = f.querySelector('[type=submit]');
        const u = f.u.value, pw = f.pw.value;
        if (tab === 'signup' && pw !== f.pw2.value) return render('Hai mật khẩu không giống nhau');
        btn.disabled = true; btn.textContent = '⏳ Đang xử lý…';
        try {
          if (tab === 'login') await CLOUD.signIn(u, pw); else await CLOUD.signUp(u, pw);
          p.close();
          await AV.afterLogin();
        } catch (er) {
          const keepU = u;
          render(er.message);
          p.body.querySelector('form').u.value = keepU;
        }
      };
    };
    render();
  }

  function settings() {
    const S = AV.S;
    const account = CLOUD.user
      ? `<div class="acct">👤 Tài khoản: <b>${esc(CLOUD.username)}</b><small>☁️ Tiến trình tự lưu lên mạng${CLOUD.lastPush ? ' · lần cuối ' + new Date(CLOUD.lastPush).toLocaleTimeString('vi-VN') : ''}</small>
          <div class="row-end"><button class="btn small ghost" data-cloudsave>☁️ Lưu ngay</button><button class="btn small ghost" data-logout>🚪 Đăng xuất</button></div></div>`
      : CLOUD.available ? '<div class="acct warn">⚠️ Bạn đang chơi không tài khoản — tiến trình chỉ lưu trên máy này.<div class="row-end"><button class="btn small" data-login>🔐 Đăng nhập / Tạo tài khoản</button></div></div>' : '';
    const p = panel('⚙️ Cài đặt', `${account}
      <label class="toggle">🌙 Ngày / đêm <select data-time><option value="real">Theo giờ thật</option><option value="day">Luôn ban ngày</option><option value="night">Luôn ban đêm</option></select></label>
      <label class="toggle"><input type="checkbox" data-pixel ${S.settings && S.settings.pixelArt ? 'checked' : ''}> Hiệu ứng ô vuông pixel (nét to hơn, hơi nhoè)</label>
      <p class="muted">Dữ liệu được lưu tự động trên trình duyệt này.</p>
      <div class="row-end"><button class="btn danger" data-reset>🗑 Chơi lại từ đầu</button></div>`);
    const ts = p.body.querySelector('[data-time]');
    ts.value = (S.settings && S.settings.time) || 'real';
    ts.onchange = () => { S.settings = { ...(S.settings || {}), time: ts.value }; AV.saveNow(); };
    const q = (sel) => p.body.querySelector(sel);
    if (q('[data-cloudsave]')) q('[data-cloudsave]').onclick = () => AV.cloudSaveNow();
    if (q('[data-logout]')) q('[data-logout]').onclick = () => { p.close(); confirm('Đăng xuất khỏi tài khoản? Tiến trình đã được lưu lên mạng.', 'Đăng xuất', () => AV.logout()); };
    if (q('[data-login]')) q('[data-login]').onclick = () => { p.close(); authPanel(false); };
    p.body.querySelector('[data-pixel]').onchange = (e) => {
      S.settings = { ...(S.settings || {}), pixelArt: e.target.checked };
      AV.saveNow();
    };
    p.body.querySelector('[data-reset]').onclick = () => {
      p.close();
      confirm('Xoá toàn bộ tiến trình và tạo nhân vật mới?', 'Xoá hết', () => AV.resetGame());
    };
  }

  /* ---------- Chat & người chơi online ---------- */
  function chatLog(name, text, mine, sys) {
    const box = $('#chatLog');
    const row = document.createElement('div');
    row.className = 'msg' + (mine ? ' mine' : '') + (sys ? ' sys' : '');
    if (!sys) {
      const b = document.createElement('b');
      b.textContent = name + ': ';
      row.appendChild(b);
    }
    row.appendChild(document.createTextNode(text));
    box.appendChild(row);
    while (box.children.length > 30) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
    box.classList.add('active');
    clearTimeout(chatLog.timer);
    chatLog.timer = setTimeout(() => box.classList.remove('active'), 8000);
  }

  function playersPanel() {
    const S = AV.S;
    const list = NET.players();
    const modeNote = {
      online: 'Đang kết nối máy chủ — mọi người ở cùng khu vực sẽ thấy nhau.',
      local: 'Chế độ thử: chỉ thấy nhau giữa các tab trên cùng máy. Điền Supabase trong <b>js/config.js</b> để chơi online thật.',
      offline: 'Không có kết nối nhiều người.',
    }[NET.mode];
    const row = (name, lvl, me) => `<div class="shop-row"><span class="ic">${me ? '⭐' : '👤'}</span><div class="info"><b>${esc(name)}${me ? ' (bạn)' : ''}</b><small>Cấp ${lvl}</small></div></div>`;
    panel('👥 Người chơi trong khu vực', `
      <p class="muted">${modeNote}</p>
      <div class="shop-list">${row(S.name, S.level, true)}${list.map((r) => row(r.name, r.level, false)).join('')}</div>`);
  }

  function init() {
    $('#netStatus').onclick = playersPanel;
    $('#chatLog').onclick = () => $('#chatLog').classList.toggle('active');
    $('#btnMenu').onclick = menu;
    $('#btnQuest').onclick = questsPanel;
    updateQuestDot();
    $('#btnMap').onclick = () => cityMap(false);
    $('#btnChat').onclick = () => { $('#chatLog').classList.add('active'); $('#chatInput').focus(); };
    const emo = $('#emotes');
    emo.innerHTML = DATA.EMOTES.map((e) => `<button data-e="${e}">${e}</button>`).join('');
    emo.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => AV.say(b.dataset.e));
    $('#emoToggle').onclick = () => emo.classList.toggle('open');
    $('#chatForm').onsubmit = (e) => {
      e.preventDefault();
      const v = $('#chatInput').value.trim();
      if (v) AV.say(v);
      $('#chatInput').value = '';
      $('#chatInput').blur();
    };
  }

  return { toast, panel, closeTop, isBlocking, confirm, updateHud, setLocation, characterEditor, inventory, shop, boutique, seedPicker, help, settings, init, drawAvatar, chatLog, playersPanel, cityMap, petShop, bauCua, baiCao, menu, kitchen, questsPanel, updateQuestDot, tableInvite, authPanel, storage, careBed, garage, arcade, closeArcade, arcadeOpen, playerCard, friendsPanel, updateVisitBar };
})();
