/* 🧑‍🌾 THUÊ GIÚP VIỆC dùng chung cho Vườn Nhà và Trang Trại Mở Rộng.
 * Mỗi khu tự viết việc người giúp việc làm (gọi STAFF.record để ghi lại), file này chỉ lo bảng thuê / gia hạn / bật tắt việc.
 * Trạng thái lưu trong dữ liệu của từng khu: { until, opt: { việc: true/false }, stats: { việc: số lần } } */
const STAFF = (() => {
  const PLANS = [{ days: 1, price: 25000, label: '1 ngày' }, { days: 3, price: 65000, label: '3 ngày' }, { days: 7, price: 140000, label: '7 ngày' }];
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const active = (st) => !!(st && st.until > Date.now());
  const on = (st, k) => !st || !st.opt || st.opt[k] !== false;
  function left(st) { const h = Math.ceil((st.until - Date.now()) / 3600e3); return h >= 24 ? `${Math.floor(h / 24)} ngày ${h % 24} giờ` : `${h} giờ`; }
  /** ghi lại việc đã làm; trả về chuỗi tóm tắt để báo cho người chơi */
  function record(st, done, labels) {
    st.stats = st.stats || {};
    const parts = [];
    Object.entries(done).forEach(([k, n]) => { if (!n) return; st.stats[k] = (st.stats[k] || 0) + n; parts.push(`${labels[k] || k} ${n}`); });
    st.lastAt = Date.now();
    return parts.join(' · ');
  }
  /** o: { title, who, icon, desc, get: () => state, jobs: [[key, label, default]], labels: {key: label} } */
  function panel(o) {
    const p = UI.panel(`${o.icon} ${o.title}`, '', { wide: true });
    const render = () => {
      if (!p.el.isConnected) return;
      const st = o.get(), act = active(st);
      p.body.innerHTML = `<div class="coins-line">💰 ${fmt(AV.S.coins)} xu</div>
        ${act ? `<p class="game-msg">✅ ${o.who} đang làm việc · còn <b>${left(st)}</b></p>` : `<p class="muted">${o.who} chưa được thuê.</p>`}
        <p class="muted">${o.desc}</p>
        <h4 style="margin:10px 0 4px">Việc cần làm</h4>
        <div class="shop-list">${o.jobs.map(([k, label]) => `<div class="shop-row" data-j="${k}" style="cursor:pointer;padding-top:6px;padding-bottom:6px"><span class="ic">${on(st, k) ? '✅' : '⬜'}</span><div class="info"><b>${label}</b><small>${on(st, k) ? 'Đang bật — chạm để tắt' : 'Đang tắt — chạm để bật'}</small></div></div>`).join('')}</div>
        <h4 style="margin:10px 0 4px">${act ? 'Gia hạn' : 'Thuê'}</h4>
        <div class="shop-list">${PLANS.map((pl, i) => `<div class="shop-row"><span class="ic">${o.icon}</span><div class="info"><b>${act ? 'Gia hạn' : 'Thuê'} ${pl.label}</b><small>${fmt(Math.round(pl.price / pl.days))} xu/ngày</small></div><button class="btn small" data-plan="${i}">${fmt(pl.price)} xu</button></div>`).join('')}</div>
        ${st.stats && Object.keys(st.stats).length ? `<p class="muted small-note">Đã làm: ${Object.entries(st.stats).map(([k, n]) => `${o.labels[k] || k} ${fmt(n)}`).join(' · ')}</p>` : ''}
        <p class="muted small-note">Làm việc cả khi bạn ở khu khác (chỉ cần mở game). Không tốn ⚡ năng lượng của bạn.</p>`;
      p.body.querySelectorAll('[data-j]').forEach((row) => row.onclick = () => { st.opt = st.opt || {}; st.opt[row.dataset.j] = !on(st, row.dataset.j); AV.markChanged(); render(); });
      p.body.querySelectorAll('[data-plan]').forEach((b) => b.onclick = () => {
        const pl = PLANS[+b.dataset.plan];
        UI.confirm(`${act ? 'Gia hạn' : 'Thuê'} <b>${o.who}</b> ${pl.label} giá <b>${fmt(pl.price)} xu</b>?`, act ? 'Gia hạn' : 'Thuê', () => {
          if (!AV.spend(pl.price)) return;
          st.until = Math.max(Date.now(), st.until || 0) + pl.days * 86400e3;
          AV.markChanged(); UI.toast(`${o.icon} Đã thuê ${o.who} — bắt đầu làm việc ngay!`, 4000);
          if (o.onHire) o.onHire();
          render();
        });
      });
    };
    render();
  }
  return { panel, active, on, record, PLANS };
})();
