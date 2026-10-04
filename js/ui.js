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

  const isBlocking = () => stack.length > 0;

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

  function setLocation(name) { $('#hudLoc').textContent = '📍 ' + name; }

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
          toast(`Chào mừng ${n} tới nông trại! 🌾`, 3500);
          setTimeout(help, 600);
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
      return left > 0 ? `${label}: đang sản xuất, còn <b>${left}s</b>` : `${label}: <b>đã sẵn sàng thu hoạch!</b>`;
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
    const render = () => {
      let list = '';
      if (tab === 'buy') {
        list = Object.entries(DATA.CROPS).map(([id, c]) => {
          const locked = S.level < c.lvl;
          const have = S.inv['seed_' + id] || 0;
          return `<div class="shop-row ${locked ? 'locked' : ''}">
            <span class="ic">${c.icon}</span>
            <div class="info"><b>Hạt ${c.name.toLowerCase()}</b><small>⏱ ${c.time}s · thu ${c.yield} ${c.icon} · bán ${c.sell} xu/cái · đang có ${have}</small></div>
            ${locked ? `<span class="lock">🔒 Cấp ${c.lvl}</span>` : `
              <button class="btn small" data-buy="${id}" data-n="1">Mua 1 · ${c.seed}💰</button>
              <button class="btn small ghost" data-buy="${id}" data-n="5">×5 · ${c.seed * 5}💰</button>`}
          </div>`;
        }).join('');
      } else {
        const items = Object.entries(S.inv).filter(([id, n]) => n > 0 && DATA.ITEMS[id].sell > 0);
        list = items.length ? items.map(([id, n]) => {
          const it = DATA.ITEMS[id];
          return `<div class="shop-row">
            <span class="ic">${it.icon}</span>
            <div class="info"><b>${it.name}</b><small>Đang có ${n} · ${it.sell} xu/cái</small></div>
            <button class="btn small ghost" data-sell="${id}" data-n="1">Bán 1 · +${it.sell}</button>
            <button class="btn small" data-sell="${id}" data-n="${n}">Bán hết · +${it.sell * n}</button>
          </div>`;
        }).join('') : '<p class="muted">Chưa có nông sản để bán. Hãy thu hoạch ruộng và chuồng trại nhé!</p>';
      }
      p.body.innerHTML = `
        <div class="coins-line">💰 ${S.coins.toLocaleString('vi-VN')} xu</div>
        <div class="tabs"><button class="chip ${tab === 'buy' ? 'on' : ''}" data-tab="buy">🌱 Mua hạt giống</button><button class="chip ${tab === 'sell' ? 'on' : ''}" data-tab="sell">💰 Bán nông sản</button></div>
        <div class="shop-list">${list}</div>`;
      p.body.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      p.body.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => { AV.buySeed(b.dataset.buy, +b.dataset.n); render(); });
      p.body.querySelectorAll('[data-sell]').forEach((b) => b.onclick = () => { AV.sell(b.dataset.sell, +b.dataset.n); render(); });
    };
    render();
  }

  /* ---------- Tiệm thời trang ---------- */
  function boutique() {
    const S = AV.S;
    const p = panel('👗 Tiệm Thời Trang', '', { wide: true });
    const render = () => {
      const card = (kind, it) => {
        const owned = kind === 'hat' ? S.owned.hats.includes(it.id) : S.owned.shirtStyles.includes(it.id);
        const wearing = kind === 'hat' ? S.look.hat === it.id : S.look.shirtStyle === it.id;
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
        <h4>Mũ & phụ kiện</h4>
        <div class="b-grid">${DATA.HATS.filter((h) => h.id !== 'none').map((h) => card('hat', h)).join('')}</div>
        <h4>Kiểu áo</h4>
        <div class="b-grid">${DATA.SHIRT_STYLES.filter((s) => s.id !== 'plain').map((s) => card('shirt', s)).join('')}</div>`;
      p.body.querySelectorAll('[data-pv]').forEach((c) => {
        const [kind, id] = c.dataset.pv.split(':');
        const look = { ...S.look, [kind === 'hat' ? 'hat' : 'shirtStyle']: id };
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
  function seedPicker(plotIndex) {
    const S = AV.S;
    const seeds = Object.keys(DATA.CROPS).filter((id) => (S.inv['seed_' + id] || 0) > 0);
    const p = panel('🌱 Gieo hạt', seeds.length
      ? `<div class="shop-list">${seeds.map((id) => {
        const c = DATA.CROPS[id];
        return `<button class="shop-row pick" data-seed="${id}"><span class="ic">${c.icon}</span>
          <div class="info"><b>${c.name}</b><small>⏱ ${c.time}s · còn ${S.inv['seed_' + id]} hạt</small></div><span class="go">Gieo ▶</span></button>`;
      }).join('')}</div>`
      : '<p class="muted">Bạn hết hạt giống rồi! Đi xe buýt 🚌 tới <b>Thị trấn</b> và ghé <b>Chợ</b> để mua thêm nhé.</p>');
    p.body.querySelectorAll('[data-seed]').forEach((b) => b.onclick = () => { p.close(); AV.plant(plotIndex, b.dataset.seed); });
  }

  /* ---------- Hướng dẫn & cài đặt ---------- */
  function help() {
    const p = panel('❓ Cách chơi', `
      <ul class="help">
        <li>👆 <b>Chạm / click</b> vào mặt đất để đi, hoặc dùng <b>phím mũi tên / WASD</b>.</li>
        <li>🌾 Bấm vào <b>ô ruộng</b> để gieo hạt, đợi cây lớn rồi bấm lần nữa để thu hoạch.</li>
        <li>🐔 Cho <b>gà</b> ăn 3 lúa mì → có 5 trứng. 🐄 Cho <b>gia súc</b> ăn 4 lúa mì → có sữa & len.</li>
        <li>🚌 Ra <b>trạm xe buýt</b> để đi tới <b>Thị trấn</b>: bán nông sản ở <b>Chợ</b>, mua đồ ở <b>Tiệm Thời Trang</b>.</li>
        <li>💬 Gõ chat ở thanh dưới cùng — người chơi khác cùng khu vực sẽ thấy, NPC trong thị trấn cũng trả lời!</li>
        <li>👥 Bấm ô <b>🟢 online</b> trên cùng để xem ai đang ở cùng khu vực với bạn.</li>
        <li>🏠 Vào <b>nhà</b> hoặc bấm <b>Tủ đồ</b> để thay trang phục.</li>
        <li>⏱ Cây và vật nuôi vẫn lớn khi bạn tắt game.</li>
      </ul>
      <div class="row-end"><button class="btn" data-ok>Đã hiểu!</button></div>`);
    p.body.querySelector('[data-ok]').onclick = p.close;
  }

  function settings() {
    const p = panel('⚙️ Cài đặt', `
      <p class="muted">Dữ liệu được lưu tự động trên trình duyệt này.</p>
      <div class="row-end"><button class="btn danger" data-reset>🗑 Chơi lại từ đầu</button></div>`);
    p.body.querySelector('[data-reset]').onclick = () => {
      p.close();
      confirm('Xoá toàn bộ tiến trình và tạo nhân vật mới?', 'Xoá hết', () => AV.resetGame());
    };
  }

  /* ---------- Chat & người chơi online ---------- */
  function chatLog(name, text, mine) {
    const box = $('#chatLog');
    const row = document.createElement('div');
    row.className = 'msg' + (mine ? ' mine' : '');
    const b = document.createElement('b');
    b.textContent = name + ': ';
    row.appendChild(b);
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
    $('#btnBag').onclick = inventory;
    $('#btnWardrobe').onclick = () => characterEditor(false);
    $('#btnHelp').onclick = help;
    $('#btnSettings').onclick = settings;
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

  return { toast, panel, closeTop, isBlocking, confirm, updateHud, setLocation, characterEditor, inventory, shop, boutique, seedPicker, help, settings, init, drawAvatar, chatLog, playersPanel };
})();
