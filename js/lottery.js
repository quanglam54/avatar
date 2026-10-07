/* 🎰 VIETLOTT MEGA 6/45 — quầy vé cạnh quán Mì Cay ở phố trước nông trại.
 * Chọn 6 số từ 01 đến 45, 10.000 xu/vé. Quay cố định mỗi 2 tiếng vào giờ chẵn (0h, 2h, 4h … 22h, giờ Việt Nam).
 * Máy chủ quay ngẫu nhiên (supabase/13-vietlott-sim-trom.sql); ai đang online xem quay trực tiếp, người trúng tự nhận xu,
 * cả server được thông báo. Trùng 6 số = Jackpot, 5 số = Giải Nhất, 4 số = Giải Nhì, 3 số = Giải Ba (như Mega 6/45 thật). */
const LOTTO = (() => {
  const PRICE = 10000, MAX_DRAW = 20, PICK = 6, MAXN = 45;
  const PRIZES = [
    { k: 6, name: 'JACKPOT', amt: 12000000000 },
    { k: 5, name: 'Giải Nhất', amt: 10000000 },
    { k: 4, name: 'Giải Nhì', amt: 300000 },
    { k: 3, name: 'Giải Ba', amt: 30000 },
  ];
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = () => AV.S;
  const vn = (t = Date.now()) => new Date(t + 7 * 3600e3);
  const key = (d, h) => d.toISOString().slice(0, 10) + ' ' + String(h).padStart(2, '0');
  /** kỳ vừa quay gần nhất (giờ chẵn ≤ bây giờ) */
  const curKey = () => { const d = vn(); return key(d, d.getUTCHours() - (d.getUTCHours() % 2)); };
  /** kỳ sắp quay (giờ chẵn kế tiếp) */
  const nextKey = () => { const d = vn(), h = d.getUTCHours() - (d.getUTCHours() % 2) + 2; return h >= 24 ? key(vn(Date.now() + 86400e3), 0) : key(d, h); };
  const msToNext = () => { const d = vn(); return (2 - (d.getUTCHours() % 2)) * 3600e3 - (d.getUTCMinutes() * 60e3 + d.getUTCSeconds() * 1e3); };
  const label = (k) => `${+k.slice(11, 13)}h ${k.slice(8, 10)}/${k.slice(5, 7)}`;
  const isNew = (k) => /^\d{4}-\d{2}-\d{2} \d{2}$/.test(k || '');
  const db = () => CLOUD.user && CLOUD.client;
  const missing = (e) => /lottery_|does not exist|Could not find|violates check/i.test(String((e && e.message) || ''));
  const NOT_READY = 'Chủ game chưa bật Vietlott (chạy file supabase/13-vietlott-sim-trom.sql)';
  const quick = () => { const a = []; while (a.length < PICK) { const n = 1 + Math.floor(Math.random() * MAXN); if (!a.includes(n)) a.push(n); } return a.sort((x, y) => x - y); };
  const toNum = (arr) => arr.map((n) => String(n).padStart(2, '0')).join(' ');
  const balls = (num, win) => num.split(' ').map((x) => `<i class="vl-ball ${win && win.includes(x) ? 'hit' : ''}">${x}</i>`).join('');

  /** giải của 1 vé, hoặc null */
  function prizeOf(num, nums) {
    if (!nums || !nums.mega) return null;
    const hit = num.split(' ').filter((x) => nums.mega.includes(x)).length;
    return PRIZES.find((p) => p.k === hit) || null;
  }

  /* ---------- máy chủ ---------- */
  let latest = null, mine = [], mineAt = 0;
  async function draw(d) {
    const { data, error } = await CLOUD.client.rpc('lottery_draw', d ? { p_day: d } : {});
    if (error) throw error;
    if (data && data.nums && data.nums.mega && (!latest || data.day >= latest.day)) latest = data;
    return data && data.nums && data.nums.mega ? data : null;
  }
  async function loadMine(force) {
    if (!db()) return mine;
    if (!force && Date.now() - mineAt < 15000) return mine;
    mineAt = Date.now();
    const since = vn(Date.now() - 7 * 86400e3).toISOString().slice(0, 10);
    const { data, error } = await CLOUD.client.from('lottery_tickets').select('id, day, num, claimed').eq('user_id', CLOUD.user.id).gte('day', since).order('id', { ascending: false }).limit(300);
    if (!error) mine = (data || []).filter((t) => isNew(t.day));
    return mine;
  }
  const countFor = (k) => mine.filter((t) => t.day === k).length;

  async function buy(list) {
    if (!db()) return UI.toast('🔐 Đăng nhập tài khoản mới mua được vé Vietlott');
    const k = nextKey();
    await loadMine(true);
    if (countFor(k) + list.length > MAX_DRAW) return UI.toast(`🎟️ Mỗi kỳ mua tối đa ${MAX_DRAW} vé (kỳ ${label(k)} bạn đã mua ${countFor(k)})`);
    const cost = PRICE * list.length;
    if (!AV.spend(cost)) return;
    const { error } = await CLOUD.client.from('lottery_tickets').insert(list.map((num) => ({ day: k, num, user_id: CLOUD.user.id, name: S().name })));
    if (error) {
      AV.earn(cost);
      return UI.toast('⚠️ ' + (missing(error) || /row-level|policy/i.test(error.message) ? NOT_READY : error.message), 5000);
    }
    UI.toast(`🎟️ Đã mua ${list.length} vé Vietlott kỳ ${label(k)} — quay sau ${Math.ceil(msToNext() / 60000)} phút, chúc may mắn!`, 4500);
    AV.sayMine('🎟️ Mua vé Vietlott cầu may~');
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
      const cur = curKey();
      const open = mine.filter((t) => !t.claimed && t.day <= cur);
      for (const d of [...new Set(open.map((t) => t.day))]) {
        const res = await draw(d);
        if (!res) continue;
        const tks = open.filter((t) => t.day === d);
        const { data: marked, error } = await CLOUD.client.from('lottery_tickets').update({ claimed: true }).in('id', tks.map((t) => t.id)).eq('claimed', false).select('id');
        if (error) continue;
        const ids = new Set((marked || []).map((r) => r.id));
        const wins = tks.filter((t) => ids.has(t.id)).map((t) => ({ t, p: prizeOf(t.num, res.nums) })).filter((w) => w.p);
        const total = wins.reduce((a, w) => a + w.p.amt, 0);
        if (total) { AV.earn(total, 30); if (show) winPopup(res, wins, total); }
        else if (show && ids.size) UI.toast(`🎰 Kỳ ${label(d)}: ${ids.size} vé không trúng. Kết quả ${res.nums.mega.join(' ')} — kỳ sau thử lại nhé!`, 5000);
      }
      await loadMine(true);
    } catch (e) { if (missing(e)) console.warn(NOT_READY); }
    finally { settling = false; }
  }
  function winPopup(res, wins, total) {
    const p = UI.panel('🎉 TRÚNG VIETLOTT!', `<div class="xs-win">
        <div class="tr-chest">🎰💰🎉</div>
        <p>Kỳ <b>${label(res.day)}</b> · kết quả <span class="vl-row">${balls(res.nums.mega.join(' '))}</span></p>
        <div class="shop-list">${wins.map((w) => `<div class="shop-row"><span class="ic">🎟️</span><div class="info"><span class="vl-row">${balls(w.t.num, res.nums.mega)}</span><small>${w.p.name}</small></div><b>+${fmt(w.p.amt)} xu</b></div>`).join('')}</div>
        <h2>+${fmt(total)} xu</h2></div>`);
    setTimeout(() => { if (p.el.isConnected) p.close(); }, 12000);
  }

  /** người vừa quay xong (fresh) báo kết quả + người trúng cho cả server */
  async function announce(res) {
    let line = `🎰 VIETLOTT kỳ ${label(res.day)}: ${res.nums.mega.join(' - ')}`;
    NET.sendNews(line); UI.chatLog('', line, true, true);
    try {
      const { data } = await CLOUD.client.from('lottery_tickets').select('name, num').eq('day', res.day).limit(3000);
      const wins = (data || []).map((t) => ({ name: t.name || 'Ai đó', p: prizeOf(t.num, res.nums) })).filter((w) => w.p).sort((a, b) => b.p.amt - a.p.amt);
      if (!wins.length) return;
      const top = wins.slice(0, 4).map((w) => `${w.name} (${w.p.name} ${fmt(w.p.amt)})`).join(', ');
      line = `🎉 Chúc mừng ${top}${wins.length > 4 ? ` và ${wins.length - 4} vé khác` : ''} trúng Vietlott!`;
      setTimeout(() => { NET.sendNews(line); UI.chatLog('', line, true, true); }, 1500);
    } catch (e) { /* bỏ qua */ }
  }

  /* ---------- quay trực tiếp ---------- */
  function liveShow(res) {
    const p = UI.panel(`📺 TRỰC TIẾP VIETLOTT MEGA 6/45 · KỲ ${label(res.day)}`, `<div class="vl-live">${res.nums.mega.map((x) => `<i class="vl-ball big" data-roll="${x}">??</i>`).join('')}</div><p class="muted xs-live-note">🎲 Lồng cầu đang quay…</p>`, { wide: true });
    const cells = [...p.body.querySelectorAll('[data-roll]')];
    let i = 0;
    const roll = setInterval(() => { if (!p.el.isConnected) return clearInterval(roll); cells.slice(i).forEach((c) => { c.textContent = String(1 + Math.floor(Math.random() * 45)).padStart(2, '0'); }); }, 70);
    const next = () => {
      if (!p.el.isConnected) return;
      if (i >= cells.length) {
        clearInterval(roll);
        const note = p.body.querySelector('.xs-live-note');
        if (note) note.innerHTML = '🎉 Đã quay xong! Đang dò vé của bạn…';
        settle(true);
        return;
      }
      const c = cells[i++]; c.textContent = c.dataset.roll; c.classList.add('done');
      setTimeout(next, 1100);
    };
    setTimeout(next, 1400);
  }

  /* ---------- quầy vé ---------- */
  function panel(tab = 'buy') {
    const p = UI.panel('🎰 Vietlott Mega 6/45', '', { wide: true });
    let pick = [];
    const render = async () => {
      const left = msToNext();
      const tabs = [['buy', '🎟️ Mua vé'], ['mine', '📋 Vé của tôi'], ['result', '📺 Kết quả'], ['rule', '🏆 Cơ cấu giải']];
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(S().coins)} xu · ⏰ Kỳ <b>${label(nextKey())}</b> quay sau <b>${Math.floor(left / 3600e3)}h${String(Math.floor(left / 60e3) % 60).padStart(2, '0')}'</b> · Jackpot <b class="vl-jp">${fmt(PRIZES[0].amt)} xu</b></div>
        <div class="ss-tabs">${tabs.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div><div class="ss-box"><p class="muted">⏳ Đang tải…</p></div>`;
      p.body.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      const box = p.body.querySelector('.ss-box');
      if (tab === 'buy') {
        const draw6 = () => {
          box.innerHTML = `<div class="xs-buy"><p>Chọn <b>6 số</b> từ 01 đến 45 · <b>${fmt(PRICE)} xu</b>/vé · đã chọn <b>${pick.length}/6</b></p>
            <div class="vl-grid">${Array.from({ length: MAXN }, (_, k) => k + 1).map((n) => `<button class="vl-n ${pick.includes(n) ? 'on' : ''}" data-n="${n}">${String(n).padStart(2, '0')}</button>`).join('')}</div>
            <div class="row-end" style="justify-content:center;flex-wrap:wrap"><button class="btn ghost" data-quick>🎲 Chọn nhanh</button><button class="btn ghost" data-clear>Xoá</button><button class="btn" data-one ${pick.length === PICK ? '' : 'disabled'}>🎟️ Mua vé này</button><button class="btn ghost" data-five>🎲 Mua 5 vé chọn nhanh (${fmt(PRICE * 5)})</button></div>
            <p class="muted small-note">Quay mỗi 2 tiếng vào giờ chẵn. Tối đa ${MAX_DRAW} vé/kỳ. Không cần online lúc quay — vào game là tự dò vé.</p></div>`;
          box.querySelectorAll('[data-n]').forEach((b) => b.onclick = () => { const n = +b.dataset.n; if (pick.includes(n)) pick = pick.filter((x) => x !== n); else if (pick.length < PICK) pick.push(n); pick.sort((a, c) => a - c); draw6(); });
          box.querySelector('[data-quick]').onclick = () => { pick = quick(); draw6(); };
          box.querySelector('[data-clear]').onclick = () => { pick = []; draw6(); };
          box.querySelector('[data-one]').onclick = async () => { if (pick.length !== PICK) return; if (await buy([toNum(pick)])) { pick = []; render(); } };
          box.querySelector('[data-five]').onclick = async () => { if (await buy(Array.from({ length: 5 }, () => toNum(quick())))) render(); };
        };
        draw6();
      } else if (tab === 'mine') {
        const list = await loadMine(true);
        if (!p.el.isConnected || tab !== 'mine') return;
        const res = {};
        for (const d of [...new Set(list.map((t) => t.day))].filter((d) => d <= curKey()).slice(0, 6)) { try { res[d] = await draw(d); } catch (e) { /* chưa bật */ } }
        if (!p.el.isConnected || tab !== 'mine') return;
        box.innerHTML = list.length ? `<div class="shop-list">${list.slice(0, 60).map((t) => {
          const r = res[t.day], pr = r && prizeOf(t.num, r.nums);
          const st = !r ? '⏳ Chờ quay' : pr ? `🎉 ${pr.name} +${fmt(pr.amt)}` : '😢 Không trúng';
          return `<div class="shop-row ${pr ? 'quest ready' : ''}"><span class="ic">🎟️</span><div class="info"><span class="vl-row">${balls(t.num, r && r.nums.mega)}</span><small>Kỳ ${label(t.day)}</small></div><b>${st}</b></div>`;
        }).join('')}</div>` : '<p class="muted">Bạn chưa mua vé nào. Mua 1 tấm cầu may đi! 🍀</p>';
      } else if (tab === 'result') {
        const rows = [];
        try {
          const { data } = await CLOUD.client.from('lottery_results').select('day, nums').like('day', '____-__-__ __').order('day', { ascending: false }).limit(8);
          (data || []).forEach((r) => { if (r.nums && r.nums.mega) rows.push(r); });
          if (!rows.length) { const r = await draw(); if (r) rows.push(r); }
        } catch (e) { box.innerHTML = `<p class="muted">⚠️ ${missing(e) ? NOT_READY : esc(e.message)}</p>`; return; }
        if (!p.el.isConnected || tab !== 'result') return;
        box.innerHTML = rows.length ? `<div class="shop-list">${rows.map((r) => `<div class="shop-row"><span class="ic">🎱</span><div class="info"><b>Kỳ ${label(r.day)}</b><span class="vl-row">${balls(r.nums.mega.join(' '))}</span></div></div>`).join('')}</div>` : '<p class="muted">Chưa có kỳ quay nào — đợi giờ chẵn tới nhé!</p>';
      } else {
        box.innerHTML = `<div class="shop-list">${PRIZES.map((pz) => `<div class="shop-row"><span class="ic">${pz.k === 6 ? '👑' : '🏅'}</span><div class="info"><b>${pz.name}</b><small>Trùng ${pz.k} số với kết quả (không cần đúng thứ tự)</small></div><b>${fmt(pz.amt)} xu</b></div>`).join('')}</div>
          <p class="muted small-note">Lịch quay cố định: 0h · 2h · 4h · 6h · 8h · 10h · 12h · 14h · 16h · 18h · 20h · 22h (giờ Việt Nam).</p>`;
      }
    };
    render();
  }

  /* ---------- vẽ quầy (2D) ---------- */
  function kiosk(c, x, y) {
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x, y + 3, 62, 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#6b4423'; c.fillRect(x + 20, y - 150, 4, 150);
    const cols = ['#c8102e', '#fff', '#c8102e', '#fff', '#c8102e', '#fff'];
    for (let k = 0; k < 6; k++) { c.fillStyle = cols[k]; c.beginPath(); c.moveTo(x + 22, y - 160); c.arc(x + 22, y - 150, 46, Math.PI + k * Math.PI / 6, Math.PI + (k + 1) * Math.PI / 6); c.closePath(); c.fill(); }
    c.fillStyle = '#7a4a26'; c.fillRect(x - 54, y - 12, 108, 12);
    c.fillStyle = '#f8f9fa'; c.beginPath(); c.roundRect(x - 52, y - 66, 104, 56, 5); c.fill();
    c.strokeStyle = '#c8102e'; c.lineWidth = 3; c.stroke();
    // màn hình máy in vé
    c.fillStyle = '#212529'; c.fillRect(x - 44, y - 60, 40, 30); c.fillStyle = '#74c0fc'; c.fillRect(x - 41, y - 57, 34, 24);
    const bc = ['#ffd43b', '#ff6b6b', '#4dabf7', '#69db7c', '#da77f2', '#ff922b'];
    for (let k = 0; k < 6; k++) { c.fillStyle = bc[k]; c.beginPath(); c.arc(x + 6 + (k % 3) * 15, y - 52 + Math.floor(k / 3) * 15, 6, 0, 7); c.fill(); }
    // biển VIETLOTT
    c.fillStyle = '#c8102e'; c.beginPath(); c.roundRect(x - 58, y - 104, 116, 36, 6); c.fill();
    c.strokeStyle = '#ffd43b'; c.lineWidth = 3; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#fff'; c.font = '900 16px "Be Vietnam Pro", system-ui'; c.fillText('VIETLOTT', x, y - 93);
    c.fillStyle = '#ffd43b'; c.font = '900 9px "Be Vietnam Pro", system-ui'; c.fillText('MEGA 6/45', x, y - 78);
    c.fillStyle = '#ffe0c4'; c.beginPath(); c.arc(x + 20, y - 118, 10, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#f3d27a'; c.beginPath(); c.moveTo(x + 4, y - 120); c.lineTo(x + 20, y - 136); c.lineTo(x + 36, y - 120); c.closePath(); c.fill();
    c.fillStyle = '#212529'; c.fillRect(x + 16, y - 119, 2, 2); c.fillRect(x + 23, y - 119, 2, 2);
  }
  /** bảng nhỏ cạnh quầy: jackpot + giờ quay tới */
  function board(c, x, y) {
    c.fillStyle = '#6b4423'; c.fillRect(x - 2, y - 52, 4, 52);
    c.fillStyle = '#1b2f48'; c.beginPath(); c.roundRect(x - 36, y - 86, 72, 42, 5); c.fill();
    c.strokeStyle = '#ffd43b'; c.lineWidth = 3; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    c.font = '800 8px "Be Vietnam Pro", system-ui'; c.fillText(`JACKPOT · KỲ ${+nextKey().slice(11, 13)}H`, x, y - 76);
    c.fillStyle = '#ffd43b'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.fillText('12 TỈ', x, y - 58);
  }

  /* ---------- nhắc giờ + quay mỗi giờ chẵn ---------- */
  let lastCur = curKey(), warned = {};
  function tick() {
    const left = msToNext(), nk = nextKey();
    if (left < 5 * 60e3 && !warned[nk]) { warned[nk] = 1; if (countFor(nk)) UI.toast(`🎰 Còn 5 phút nữa quay Vietlott kỳ ${label(nk)} — bạn có ${countFor(nk)} vé!`, 5000); }
    const cur = curKey();
    if (cur !== lastCur && db()) {
      lastCur = cur;
      setTimeout(async () => {
        try {
          const res = await draw(cur);
          if (!res) return;
          if (res.fresh) announce(res);
          await loadMine(true);
          if (countFor(cur)) liveShow(res); else settle(false);
        } catch (e) { /* chưa bật */ }
      }, 1500 + Math.random() * 4000);
    }
  }
  function init() {
    setInterval(tick, 5000);
    setTimeout(async () => { if (!db()) return; try { await draw(); } catch (e) { /* chưa bật */ } loadMine(true); settle(true); }, 7000);
  }
  return { init, panel, kiosk, board, prizeOf, settle, PRIZES, nextKey, curKey };
})();
