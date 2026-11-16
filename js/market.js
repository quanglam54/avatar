/* 🛒 ZENOMARKET — chợ mua bán đồ giữa người chơi (ứng dụng trên điện thoại).
 * Đăng bán: món rời túi ngay (giữ hộ trên chợ) · Mua: mua đứt cả lô · Huỷ: món về lại túi.
 * Người bán nhận 95% giá khi mở chợ (hoặc tự động mỗi 3 phút). Cần file supabase/21-cho-nguoi-choi.sql. */
const MARKET = (() => {
  const FEE = 0.05, MAX_OPEN = 8, NO_TRADE = new Set(['ticket']);
  const S = () => AV.S;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Math.floor(n).toLocaleString('vi-VN');
  const it = (id) => DATA.ITEMS[id] || { name: id, icon: '📦', sell: 0 };
  const online = () => typeof CLOUD !== 'undefined' && CLOUD.user && CLOUD.client;
  const db = () => CLOUD.client;
  const errMsg = (e) => String((e && e.message) || e || 'Lỗi');
  const save = () => { AV.markChanged(); if (AV.saveNow) AV.saveNow(); };

  /** nhận tiền các lô đã bán */
  async function collect(silent) {
    if (!online() || (AV.isTabLocked && AV.isTabLocked())) return 0;
    let r; try { const res = await db().rpc('market_collect'); if (res.error) throw res.error; r = res.data; } catch (e) { return 0; }
    const total = +(r && r.total) || 0; if (!total) return 0;
    const got = Math.floor(total * (1 - FEE));
    S().coins += got; UI.updateHud(); save();
    UI.toast(`🛒 Chợ: bán được ${r.n} lô hàng → +${fmt(got)} xu (đã trừ phí 5%)`, 5000);
    return got;
  }
  setInterval(() => { if (!document.hidden) collect(true); }, 180000);
  setTimeout(() => collect(true), 20000);

  function panel(tab = 'buy') {
    if (!online()) return UI.toast('🛒 Đăng nhập tài khoản để dùng chợ người chơi', 4000);
    const p = UI.panel('🛒 ZenoMarket · Chợ người chơi', '<p class="muted">⏳ Đang tải…</p>', { wide: true });
    let q = '', busy = false;
    collect(true);

    const tabs = () => `<div class="ss-tabs">${[['buy', '🛍️ Mua'], ['sell', '🏷️ Đăng bán'], ['mine', '📦 Hàng của tôi']].map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;
    const wire = () => {
      p.body.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; render(); }; });
    };

    async function render() {
      if (!p.body.isConnected) return;
      if (tab === 'buy') return renderBuy();
      if (tab === 'sell') return renderSell();
      return renderMine();
    }

    async function renderBuy() {
      p.body.innerHTML = `${tabs()}<div class="ss-box"><p class="muted">⏳ Đang tải chợ…</p></div>`; wire();
      const { data, error } = await db().from('market').select('id, seller, seller_name, item, qty, price, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(80);
      if (!p.body.isConnected || tab !== 'buy') return;
      const box = p.body.querySelector('.ss-box');
      if (error) { box.innerHTML = '<p class="muted">Chợ chưa mở (cần chạy file SQL 21 trên Supabase).</p>'; return; }
      const me = CLOUD.user.id, k = q.trim().toLowerCase();
      const rows = (data || []).filter((r) => !k || it(r.item).name.toLowerCase().includes(k) || String(r.seller_name || '').toLowerCase().includes(k));
      box.innerHTML = `<input class="field" data-q placeholder="🔍 Tìm món hoặc tên người bán…" value="${esc(q)}">
        <p class="muted small-note">Giá là giá cả lô. Bạn đang có <b>${fmt(S().coins)} xu</b>.</p>
        <div class="shop-list">${rows.map((r) => {
          const x = it(r.item), mine = r.seller === me, each = r.price / r.qty, ref = x.sell ? ` · giá shop ${fmt(x.sell)}/món` : '';
          return `<div class="shop-row"><span class="ic">${x.icon}</span><div class="info"><b>${esc(x.name)} × ${fmt(r.qty)}</b><small>👤 ${esc(r.seller_name || 'Ẩn danh')} · ${fmt(each)} xu/món${ref}</small></div>
            ${mine ? '<span class="lock">Hàng của bạn</span>' : `<button class="btn small" data-buy="${r.id}" ${S().coins < r.price ? 'disabled' : ''}>💰 ${fmt(r.price)}</button>`}</div>`;
        }).join('') || '<p class="muted">Chưa có ai bán gì — hãy là người đầu tiên đăng bán!</p>'}</div>`;
      const qi = box.querySelector('[data-q]');
      qi.oninput = () => { q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => { renderBuy().then(() => { const n = p.body.querySelector('[data-q]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }); }, 350); };
      box.querySelectorAll('[data-buy]').forEach((b) => {
        const r = rows.find((x) => x.id === +b.dataset.buy);
        b.onclick = () => UI.confirm(`Mua <b>${it(r.item).icon} ${esc(it(r.item).name)} × ${fmt(r.qty)}</b> của ${esc(r.seller_name || 'Ẩn danh')} với giá <b>${fmt(r.price)} xu</b>?`, '💰 Mua', () => buy(r));
      });
    }
    async function buy(r) {
      if (busy) return; busy = true;
      try {
        if (S().coins < r.price) throw new Error('Không đủ xu');
        const { data, error } = await db().rpc('market_buy', { p_id: r.id, p_name: S().name || 'Bạn' });
        if (error) throw error;
        const got = Array.isArray(data) ? data[0] : data;
        if (!got) throw new Error('Lô hàng này vừa có người mua');
        S().coins -= +got.price;
        S().inv[got.item] = (S().inv[got.item] || 0) + (+got.qty);
        UI.updateHud(); save();
        UI.toast(`🛒 Đã mua ${it(got.item).icon} ${it(got.item).name} × ${fmt(got.qty)} — món đã vào túi!`, 4000);
      } catch (e) { UI.toast('🛒 ' + errMsg(e), 4000); }
      busy = false; render();
    }

    function renderSell() {
      const inv = Object.entries(S().inv || {}).filter(([id, n]) => n > 0 && DATA.ITEMS[id] && !NO_TRADE.has(id)).sort((a, b) => it(a[0]).name.localeCompare(it(b[0]).name, 'vi'));
      p.body.innerHTML = `${tabs()}<div class="ss-box">
        <p class="muted small-note">Chọn món trong túi, nhập số lượng và <b>giá cả lô</b>. Món sẽ rời túi ngay và được giữ trên chợ. Bán được thì bạn nhận <b>95%</b> (phí chợ 5%). Tối đa ${MAX_OPEN} lô cùng lúc.</p>
        <div class="shop-list">${inv.map(([id, n]) => { const x = it(id); return `<div class="shop-row pick" data-pick="${id}"><span class="ic">${x.icon}</span><div class="info"><b>${esc(x.name)}</b><small>Đang có ${fmt(n)}${x.sell ? ` · giá shop ${fmt(x.sell)}/món` : ''}</small></div><span class="go">Bán ›</span></div>`; }).join('') || '<p class="muted">Túi đồ trống — thu hoạch, câu cá, đào mỏ rồi quay lại nhé!</p>'}</div></div>`;
      wire();
      p.body.querySelectorAll('[data-pick]').forEach((row) => { row.onclick = () => sellForm(row.dataset.pick); });
    }
    function sellForm(id) {
      const x = it(id), have = S().inv[id] || 0, unit = Math.max(1, x.sell || 10);
      p.body.innerHTML = `${tabs()}<div class="ss-box">
        <div class="shop-row"><span class="ic">${x.icon}</span><div class="info"><b>${esc(x.name)}</b><small>Đang có ${fmt(have)}${x.sell ? ` · giá shop ${fmt(x.sell)}/món` : ''}</small></div></div>
        <label class="muted">Số lượng (1–${fmt(Math.min(have, 9999))})</label>
        <input class="field" data-qty type="number" min="1" max="${Math.min(have, 9999)}" value="${Math.min(have, 10)}">
        <label class="muted">Giá cả lô (xu)</label>
        <input class="field" data-price type="number" min="1" value="${Math.min(have, 10) * unit * 2}">
        <p class="muted small-note" data-hint></p>
        <div class="row-end"><button class="btn ghost" data-back>‹ Quay lại</button><button class="btn" data-post>🏷️ Đăng bán</button></div></div>`;
      wire();
      const qi = p.body.querySelector('[data-qty]'), pi = p.body.querySelector('[data-price]'), hint = p.body.querySelector('[data-hint]');
      const vals = () => ({ qty: Math.floor(+qi.value || 0), price: Math.floor(+pi.value || 0) });
      const upd = () => { const { qty, price } = vals(); hint.innerHTML = qty > 0 && price > 0 ? `≈ ${fmt(price / qty)} xu/món · bán được bạn nhận <b>${fmt(price * (1 - FEE))} xu</b>` : ''; };
      qi.oninput = upd; pi.oninput = upd; upd();
      p.body.querySelector('[data-back]').onclick = () => renderSell();
      p.body.querySelector('[data-post]').onclick = async () => {
        const { qty, price } = vals();
        if (busy) return;
        if (qty < 1 || qty > Math.min(S().inv[id] || 0, 9999)) return UI.toast('Số lượng không hợp lệ');
        if (price < 1 || price > 1e9) return UI.toast('Giá từ 1 đến 1.000.000.000 xu');
        busy = true;
        S().inv[id] -= qty; save(); // giữ hộ trước, lỗi thì trả lại
        try {
          const { error } = await db().rpc('market_list', { p_item: id, p_qty: qty, p_price: price, p_name: S().name || 'Bạn' });
          if (error) throw error;
          UI.toast(`🏷️ Đã đăng bán ${x.icon} ${x.name} × ${fmt(qty)} giá ${fmt(price)} xu`, 4000);
          if (NET.sendNews && price >= 100000) NET.sendNews(`🛒 ${S().name} vừa đăng bán ${x.icon} ${x.name} × ${fmt(qty)} trên ZenoMarket!`);
          tab = 'mine';
        } catch (e) { S().inv[id] = (S().inv[id] || 0) + qty; save(); UI.toast('🛒 ' + errMsg(e), 4500); }
        busy = false; render();
      };
    }

    async function renderMine() {
      p.body.innerHTML = `${tabs()}<div class="ss-box"><p class="muted">⏳ Đang tải…</p></div>`; wire();
      const me = CLOUD.user.id;
      const [a, b] = await Promise.all([
        db().from('market').select('id, item, qty, price, status, buyer_name, paid, created_at, sold_at').eq('seller', me).in('status', ['open', 'sold']).order('created_at', { ascending: false }).limit(30),
        db().from('market').select('id, item, qty, price, seller_name, sold_at').eq('buyer', me).order('sold_at', { ascending: false }).limit(10),
      ]);
      if (!p.body.isConnected || tab !== 'mine') return;
      const box = p.body.querySelector('.ss-box');
      if (a.error) { box.innerHTML = '<p class="muted">Chợ chưa mở (cần chạy file SQL 21 trên Supabase).</p>'; return; }
      const open = (a.data || []).filter((r) => r.status === 'open'), sold = (a.data || []).filter((r) => r.status === 'sold').slice(0, 10);
      const row = (r, right, sub) => `<div class="shop-row"><span class="ic">${it(r.item).icon}</span><div class="info"><b>${esc(it(r.item).name)} × ${fmt(r.qty)}</b><small>${sub}</small></div>${right}</div>`;
      box.innerHTML = `<h4 class="ev-h">🏷️ Đang bán (${open.length}/${MAX_OPEN})</h4>
        <div class="shop-list">${open.map((r) => row(r, `<button class="btn small ghost" data-cancel="${r.id}">✕ Huỷ</button>`, `Giá ${fmt(r.price)} xu`)).join('') || '<p class="muted">Chưa đăng bán gì.</p>'}</div>
        <h4 class="ev-h">✅ Đã bán gần đây</h4>
        <div class="shop-list">${sold.map((r) => row(r, `<b>+${fmt(r.price * (1 - FEE))}</b>`, `👤 ${esc(r.buyer_name || 'Ai đó')} mua${r.paid ? ' · đã nhận tiền' : ' · đang chuyển tiền'}`)).join('') || '<p class="muted">Chưa bán được lô nào.</p>'}</div>
        <h4 class="ev-h">🛍️ Đã mua gần đây</h4>
        <div class="shop-list">${(b.data || []).map((r) => row(r, `<b>−${fmt(r.price)}</b>`, `của ${esc(r.seller_name || 'Ẩn danh')}`)).join('') || '<p class="muted">Chưa mua gì.</p>'}</div>`;
      box.querySelectorAll('[data-cancel]').forEach((btn) => {
        btn.onclick = async () => {
          if (busy) return; busy = true; btn.disabled = true;
          try {
            const { data, error } = await db().rpc('market_cancel', { p_id: +btn.dataset.cancel });
            if (error) throw error;
            const got = Array.isArray(data) ? data[0] : data;
            if (got) { S().inv[got.item] = (S().inv[got.item] || 0) + (+got.qty); save(); UI.toast(`↩️ Đã huỷ — ${it(got.item).icon} × ${fmt(got.qty)} về lại túi`); }
          } catch (e) { UI.toast('🛒 ' + errMsg(e), 4000); }
          busy = false; render();
        };
      });
    }

    render();
  }

  const hook = () => { const b = document.getElementById('btnMarket'); if (b) b.onclick = () => panel(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();

  return { panel, collect };
})();
