/* 🎰 XỔ SỐ MIỀN BẮC — quầy vé số cạnh quán Mì Cay ở phố trước nông trại.
 * Mua vé 5 số (10.000 xu/vé) đến 18h30 giờ Việt Nam. 18h30 máy chủ quay số ngẫu nhiên (supabase/11-xo-so-va-su-kien.sql),
 * ai đang online xem quay trực tiếp; ai trúng tự nhận xu, cả server được thông báo người trúng.
 * Cơ cấu giải giống vé kiến thiết miền Bắc: so các số cuối của vé với bảng kết quả, mỗi vé lấy giải cao nhất. */
const LOTTO = (() => {
  const PRICE = 10000, MAX_DAY = 30, CLOSE = 18 * 60 + 30;
  const PRIZES = [
    { k: 'db', name: 'Giải Đặc Biệt', amt: 500000000, n: 1, len: 5 },
    { k: 'g1', name: 'Giải Nhất', amt: 10000000, n: 1, len: 5 },
    { k: 'g2', name: 'Giải Nhì', amt: 5000000, n: 2, len: 5 },
    { k: 'g3', name: 'Giải Ba', amt: 1000000, n: 6, len: 5 },
    { k: 'g4', name: 'Giải Tư', amt: 400000, n: 4, len: 4 },
    { k: 'g5', name: 'Giải Năm', amt: 200000, n: 6, len: 4 },
    { k: 'g6', name: 'Giải Sáu', amt: 100000, n: 3, len: 3 },
    { k: 'g7', name: 'Giải Bảy', amt: 40000, n: 4, len: 2 },
  ];
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => AV.S;
  const vn = () => new Date(Date.now() + 7 * 3600e3);
  const day = () => vn().toISOString().slice(0, 10);
  const mins = () => { const d = vn(); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
  const isOpen = () => mins() < CLOSE;
  const dm = (d) => d.slice(8, 10) + '/' + d.slice(5, 7);
  const rnd5 = () => String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  const db = () => CLOUD.user && CLOUD.client;
  const missing = (e) => /lottery_|does not exist|Could not find/i.test(String((e && e.message) || ''));
  const NOT_READY = 'Chủ game chưa bật xổ số (chạy file supabase/11-xo-so-va-su-kien.sql)';

  /** giải cao nhất của 1 vé, hoặc null */
  function prizeOf(num, nums) {
    if (!nums) return null;
    return PRIZES.find((p) => (nums[p.k] || []).some((x) => num.endsWith(x))) || null;
  }

  /* ---------- máy chủ ---------- */
  let latest = null, mine = [], mineAt = 0;
  async function draw(d) {
    const { data, error } = await CLOUD.client.rpc('lottery_draw', d ? { p_day: d } : {});
    if (error) throw error;
    if (data) { if (!latest || data.day >= latest.day) latest = data; }
    return data;
  }
  async function loadMine(force) {
    if (!db()) return mine;
    if (!force && Date.now() - mineAt < 15000) return mine;
    mineAt = Date.now();
    const since = new Date(Date.now() + 7 * 3600e3 - 7 * 86400e3).toISOString().slice(0, 10);
    const { data, error } = await CLOUD.client.from('lottery_tickets').select('id, day, num, claimed').eq('user_id', CLOUD.user.id).gte('day', since).order('id', { ascending: false }).limit(200);
    if (!error) mine = data || [];
    return mine;
  }
  const todayCount = () => mine.filter((t) => t.day === day()).length;

  async function buy(nums) {
    if (!db()) return UI.toast('🔐 Đăng nhập tài khoản mới mua được vé số');
    if (!isOpen()) return UI.toast('⏰ Đã quá 18h30 — quầy ngừng bán, mai mua tiếp nhé!');
    await loadMine(true);
    if (todayCount() + nums.length > MAX_DAY) return UI.toast(`🎟️ Mỗi ngày mua tối đa ${MAX_DAY} vé (bạn đã mua ${todayCount()})`);
    const cost = PRICE * nums.length;
    if (!AV.spend(cost)) return;
    const { error } = await CLOUD.client.from('lottery_tickets').insert(nums.map((num) => ({ day: day(), num, user_id: CLOUD.user.id, name: S().name })));
    if (error) {
      AV.earn(cost);
      return UI.toast('⚠️ ' + (missing(error) ? NOT_READY : /row-level|policy/i.test(error.message) ? 'Đã hết giờ bán vé hôm nay' : error.message), 5000);
    }
    AV.quest('lotto', nums.length);
    UI.toast(`🎟️ Đã mua ${nums.length} vé: ${nums.join(', ')} — 18h30 quay số, chúc may mắn!`, 4500);
    AV.sayMine('🎟️ Mua vé số cầu may~');
    await loadMine(true);
    return true;
  }

  /** dò vé chưa lĩnh của các kỳ đã quay → trả thưởng */
  let settling = false;
  async function settle(show = true) {
    if (!db() || settling) return;
    settling = true;
    try {
      await loadMine(true);
      const open = mine.filter((t) => !t.claimed && (t.day < day() || !isOpen()));
      const days = [...new Set(open.map((t) => t.day))];
      for (const d of days) {
        const res = await draw(d);
        if (!res) continue;
        const tks = open.filter((t) => t.day === d);
        const { data: marked, error } = await CLOUD.client.from('lottery_tickets').update({ claimed: true }).in('id', tks.map((t) => t.id)).eq('claimed', false).select('id');
        if (error) continue;
        const ids = new Set((marked || []).map((r) => r.id));
        const wins = tks.filter((t) => ids.has(t.id)).map((t) => ({ t, p: prizeOf(t.num, res.nums) })).filter((w) => w.p);
        const total = wins.reduce((a, w) => a + w.p.amt, 0);
        if (total) {
          AV.earn(total, 30);
          if (show) winPopup(d, wins, total);
        } else if (show && ids.size) UI.toast(`🎰 Kỳ ${dm(d)}: ${ids.size} vé của bạn không trúng. ĐB hôm đó là ${res.nums.db[0]} — mai thử lại nhé!`, 5000);
      }
      await loadMine(true);
    } catch (e) { if (missing(e)) console.warn(NOT_READY); }
    finally { settling = false; }
  }
  function winPopup(d, wins, total) {
    const p = UI.panel('🎉 TRÚNG XỔ SỐ!', `<div class="xs-win">
        <div class="tr-chest">🎰💰🎉</div>
        <p>Kỳ quay <b>${dm(d)}</b> bạn trúng:</p>
        <div class="shop-list">${wins.map((w) => `<div class="shop-row"><span class="ic">🎟️</span><div class="info"><b class="xs-num">${w.t.num}</b><small>${w.p.name}</small></div><b>+${fmt(w.p.amt)} xu</b></div>`).join('')}</div>
        <h2>+${fmt(total)} xu</h2></div>`);
    setTimeout(() => { if (p.el.isConnected) p.close(); }, 12000);
  }

  /** người vừa quay xong (fresh) báo kết quả + danh sách trúng cho cả server */
  async function announce(res) {
    let line = `🎰 KẾT QUẢ XỔ SỐ MIỀN BẮC ${dm(res.day)}: ĐẶC BIỆT ${res.nums.db[0]}`;
    try {
      const { data } = await CLOUD.client.from('lottery_tickets').select('name, num').eq('day', res.day).limit(2000);
      const wins = (data || []).map((t) => ({ name: t.name || 'Ai đó', p: prizeOf(t.num, res.nums) })).filter((w) => w.p).sort((a, b) => b.p.amt - a.p.amt);
      NET.sendNews(line);
      UI.chatLog('', line, true, true);
      if (wins.length) {
        const top = wins.slice(0, 4).map((w) => `${w.name} (${w.p.name.replace('Giải ', '')} ${fmt(w.p.amt)})`).join(', ');
        line = `🎉 Chúc mừng ${top}${wins.length > 4 ? ` và ${wins.length - 4} vé khác` : ''} trúng xổ số!`;
      } else line = '🎰 Kỳ này chưa ai trúng — mai mua vé tiếp nhé!';
      setTimeout(() => { NET.sendNews(line); UI.chatLog('', line, true, true); }, 1500);
    } catch (e) { NET.sendNews(line); }
  }

  /* ---------- quay trực tiếp lúc 18h30 ---------- */
  function liveShow(res) {
    const p = UI.panel(`📺 TRỰC TIẾP XỔ SỐ MIỀN BẮC ${dm(res.day)}`, `<div class="xs-live">${table(res.nums, true)}</div><p class="muted xs-live-note">🎲 Đang quay…</p>`, { wide: true });
    const cells = [...p.body.querySelectorAll('[data-roll]')].reverse(); // quay từ giải bảy lên đặc biệt
    let i = 0;
    const roll = setInterval(() => {
      if (!p.el.isConnected) return clearInterval(roll);
      cells.slice(i).forEach((c) => { c.textContent = String(Math.floor(Math.random() * 10 ** c.dataset.len)).padStart(+c.dataset.len, '0'); });
    }, 70);
    const next = () => {
      if (!p.el.isConnected) return;
      if (i >= cells.length) {
        clearInterval(roll);
        const note = p.body.querySelector('.xs-live-note');
        if (note) note.innerHTML = `🎉 Đã quay xong! Giải Đặc Biệt: <b class="xs-num">${res.nums.db[0]}</b> · bấm 🎰 quầy vé số để dò vé`;
        settle(true);
        return;
      }
      const c = cells[i++];
      c.textContent = c.dataset.roll; c.classList.add('done');
      setTimeout(next, i >= cells.length - 1 ? 1600 : 380);
    };
    setTimeout(next, 1200);
  }

  /* ---------- bảng kết quả kiểu XSMB ---------- */
  function table(nums, rolling) {
    return `<table class="xs-table">${PRIZES.map((p) => `<tr class="${p.k}"><th>${p.name.replace('Giải ', '')}</th><td>${(nums[p.k] || []).map((x) => rolling ? `<span data-roll="${x}" data-len="${x.length}">${'?'.repeat(x.length)}</span>` : `<span>${x}</span>`).join('')}</td></tr>`).join('')}</table>`;
  }

  /* ---------- quầy vé số ---------- */
  function panel(tab = 'buy') {
    const p = UI.panel('🎰 Xổ Số Miền Bắc', '', { wide: true });
    let pick = rnd5();
    const render = async () => {
      const left = CLOSE - mins();
      const tabs = [['buy', '🎟️ Mua vé'], ['mine', '📋 Vé của tôi'], ['result', '📺 Kết quả'], ['rule', '🏆 Cơ cấu giải']];
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu · ${isOpen() ? `⏰ Ngừng bán sau <b>${Math.floor(left / 60)}h${String(left % 60).padStart(2, '0')}</b> (18h30 quay số)` : '🔒 Đã quay số hôm nay · mở bán lại lúc 0h'}</div>
        <div class="ss-tabs">${tabs.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div><div class="ss-box"><p class="muted">⏳ Đang tải…</p></div>`;
      p.body.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      const box = p.body.querySelector('.ss-box');
      if (tab === 'buy') {
        box.innerHTML = isOpen() ? `<div class="xs-buy">
            <p>Chọn 1 số <b>5 chữ số</b> (00000 – 99999) · <b>${fmt(PRICE)} xu</b>/vé</p>
            <div class="xs-pick"><input class="xs-input" inputmode="numeric" maxlength="5" value="${pick}"><button class="btn small ghost" data-rand>🎲 Số ngẫu nhiên</button></div>
            <div class="row-end" style="justify-content:center;flex-wrap:wrap"><button class="btn" data-one>🎟️ Mua vé này</button><button class="btn ghost" data-five>🎲 Mua 5 vé ngẫu nhiên (${fmt(PRICE * 5)} xu)</button></div>
            <p class="muted small-note">Tối đa ${MAX_DAY} vé/ngày · Đặc biệt trúng <b>${fmt(PRIZES[0].amt)} xu</b>! Trúng 2 số cuối giải bảy cũng được ${fmt(PRIZES[7].amt)} xu.</p></div>`
          : `<p class="muted">🔒 Hôm nay đã quay số lúc 18h30. Quầy mở bán lại lúc <b>0h</b> — xem tab 📺 Kết quả để dò vé.</p>`;
        const inp = box.querySelector('.xs-input');
        if (inp) {
          inp.oninput = () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 5); pick = inp.value; };
          box.querySelector('[data-rand]').onclick = () => { pick = rnd5(); inp.value = pick; };
          box.querySelector('[data-one]').onclick = async () => {
            if (!/^\d{5}$/.test(inp.value)) return UI.toast('Nhập đủ 5 chữ số nhé (vd 08386)');
            if (await buy([inp.value])) { pick = rnd5(); render(); }
          };
          box.querySelector('[data-five]').onclick = async () => { if (await buy([rnd5(), rnd5(), rnd5(), rnd5(), rnd5()])) render(); };
        }
      } else if (tab === 'mine') {
        const list = await loadMine(true);
        if (!p.el.isConnected || tab !== 'mine') return;
        let res = latest;
        try { if (!isOpen() || list.some((t) => t.day < day())) res = await draw(); } catch (e) { /* chưa có bảng */ }
        if (!p.el.isConnected || tab !== 'mine') return;
        box.innerHTML = list.length ? `<div class="shop-list">${list.slice(0, 60).map((t) => {
          const drawn = res && res.day === t.day ? res : null;
          const pr = drawn && prizeOf(t.num, drawn.nums);
          const st = !drawn ? (t.day === day() && isOpen() ? '⏳ Chờ 18h30' : t.claimed ? '✔️ Đã dò' : '⏳ Chờ dò') : pr ? `🎉 ${pr.name} +${fmt(pr.amt)}` : '😢 Không trúng';
          return `<div class="shop-row ${pr ? 'quest ready' : ''}"><span class="ic">🎟️</span><div class="info"><b class="xs-num">${t.num}</b><small>Kỳ ${dm(t.day)}</small></div><b>${st}</b></div>`;
        }).join('')}</div>` : '<p class="muted">Bạn chưa mua vé nào. Mua 1 tấm cầu may đi! 🍀</p>';
      } else if (tab === 'result') {
        let res = null;
        try { res = await draw(); } catch (e) { box.innerHTML = `<p class="muted">⚠️ ${missing(e) ? NOT_READY : esc(e.message)}</p>`; return; }
        if (!p.el.isConnected || tab !== 'result') return;
        box.innerHTML = res ? `<p class="xs-day">Kết quả kỳ <b>${dm(res.day)}</b></p>${table(res.nums)}` : '<p class="muted">Chưa có kỳ quay nào. 18h30 hôm nay quay kỳ đầu tiên!</p>';
      } else {
        box.innerHTML = `<div class="shop-list">${PRIZES.map((pz) => `<div class="shop-row"><span class="ic">${pz.k === 'db' ? '👑' : '🏅'}</span><div class="info"><b>${pz.name}</b><small>${pz.n} số · trùng ${pz.len} số cuối của vé</small></div><b>${fmt(pz.amt)} xu</b></div>`).join('')}</div>
          <p class="muted small-note">Mỗi vé chỉ nhận giải cao nhất. Không cần online lúc 18h30 — lần sau vào game tự dò vé và cộng xu.</p>`;
      }
    };
    render();
  }

  /* ---------- vẽ quầy vé số (2D) ---------- */
  function kiosk(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 3, 62, 10, 0, 0, Math.PI * 2); c.fill();
    // ô che nắng đỏ
    c.fillStyle = '#6b4423'; c.fillRect(x + 20, y - 150, 4, 150);
    const cols = ['#e03131', '#fff', '#e03131', '#fff', '#e03131', '#fff'];
    for (let k = 0; k < 6; k++) { c.fillStyle = cols[k]; c.beginPath(); c.moveTo(x + 22, y - 160); c.arc(x + 22, y - 150, 46, Math.PI + k * Math.PI / 6, Math.PI + (k + 1) * Math.PI / 6); c.closePath(); c.fill(); }
    // tủ kính bày vé
    c.fillStyle = '#7a4a26'; c.fillRect(x - 54, y - 12, 108, 12);
    c.fillStyle = '#a0522d'; c.beginPath(); c.roundRect(x - 52, y - 66, 104, 56, 5); c.fill();
    c.fillStyle = '#dbe9f5'; c.beginPath(); c.roundRect(x - 46, y - 62, 92, 34, 3); c.fill();
    const tc = ['#ffd43b', '#ff8787', '#74c0fc', '#8ce99a', '#ffa94d', '#e599f7'];
    for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) { c.fillStyle = tc[(k + r * 2) % 6]; c.fillRect(x - 43 + k * 15, y - 59 + r * 15, 12, 12); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 41 + k * 15, y - 55 + r * 15, 8, 1.5); }
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - 44, y - 61, 6, 32);
    // bảng chữ đỏ vàng
    c.fillStyle = '#c92a2a'; c.beginPath(); c.roundRect(x - 58, y - 104, 116, 36, 6); c.fill();
    c.strokeStyle = '#ffd43b'; c.lineWidth = 3; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#ffd43b'; c.font = '900 13px "Be Vietnam Pro", system-ui'; c.fillText('XỔ SỐ', x, y - 93);
    c.font = '900 10px "Be Vietnam Pro", system-ui'; c.fillText('MIỀN BẮC', x, y - 79);
    // cô bán vé ngồi sau quầy
    c.fillStyle = '#ffe0c4'; c.beginPath(); c.arc(x + 20, y - 118, 10, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f3d27a'; c.beginPath(); c.moveTo(x + 4, y - 120); c.lineTo(x + 20, y - 136); c.lineTo(x + 36, y - 120); c.closePath(); c.fill();
    c.fillStyle = '#212529'; c.fillRect(x + 16, y - 119, 2, 2); c.fillRect(x + 23, y - 119, 2, 2);
  }
  /** bảng đen nhỏ cạnh quầy: giải đặc biệt kỳ gần nhất / giờ quay */
  function board(c, x, y) {
    c.fillStyle = '#6b4423'; c.fillRect(x - 2, y - 52, 4, 52);
    c.fillStyle = '#2b3a2e'; c.beginPath(); c.roundRect(x - 34, y - 84, 68, 40, 5); c.fill();
    c.strokeStyle = '#8a5a32'; c.lineWidth = 3; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    c.font = '800 8px "Be Vietnam Pro", system-ui'; c.fillText(latest ? `KQ ${dm(latest.day)} · ĐB` : 'QUAY LÚC', x, y - 74);
    c.fillStyle = '#ffd43b'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.fillText(latest ? latest.nums.db[0] : '18:30', x, y - 57);
  }

  /* ---------- nhắc giờ + quay lúc 18h30 ---------- */
  let wasOpen = isOpen(), warned = {};
  function tick() {
    const m = mins(), d = day();
    if (m === CLOSE - 30 && !warned[d + 30]) { warned[d + 30] = 1; UI.toast('🎰 Còn 30 phút nữa quầy xổ số ngừng bán (18h30 quay số) — mua vé ở phố trước nông trại!', 5000); }
    if (m === CLOSE - 5 && !warned[d + 5]) { warned[d + 5] = 1; UI.toast('🎰 Còn 5 phút ngừng bán vé số!', 4000); }
    const open = isOpen();
    if (wasOpen && !open && db()) {
      setTimeout(async () => {
        try {
          const res = await draw(d);
          if (!res) return;
          if (res.fresh) announce(res);
          await loadMine(true);
          if (todayCount() || AV.currentMap() === 'farm') liveShow(res); else settle(true);
        } catch (e) { /* chưa bật */ }
      }, 1500 + Math.random() * 4000);
    }
    wasOpen = open;
  }
  function init() {
    setInterval(tick, 5000);
    setTimeout(async () => { if (!db()) return; try { await draw(); } catch (e) { /* chưa bật */ } settle(true); }, 7000);
  }
  return { init, panel, kiosk, board, prizeOf, settle, PRIZES };
})();
