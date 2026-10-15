/* 🆕 CÓ GÌ MỚI — bảng giới thiệu bản cập nhật (tự hiện 1 lần mỗi khi có bản mới), nút 🆕 trên màn hình,
 * và đánh dấu "MỚI" trên bản đồ thành phố cho các khu người chơi chưa ghé.
 * Ra bản cập nhật mới: tăng VER và thêm mục vào ITEMS. */
const NEWS = (() => {
  const VER = 5;
  const NEW_ZONES = ['sport', 'hotay', 'badinh'];
  const S = () => AV.S;
  const go = (id, x, y, label) => () => AV.teleport(id, false, x, y, label);
  const ITEMS = () => {
    const list = [];
    const fe = typeof FEST !== 'undefined' && FEST.current();
    if (fe) { const e = FEST.EV[fe]; list.push({ ic: e.icon, t: `Sự kiện ${e.name}`, d: 'Đang diễn ra — làm hoạt động sự kiện, gom vật phẩm đổi quà độc quyền', act: () => FEST.panel(), btn: 'Xem sự kiện' }); }
    list.push(
      { ic: '♟️', t: 'Cờ caro ở Nhà Casino', d: 'Đánh caro 5 ô liên tiếp với máy hoặc với bạn bè — thắng được xu', act: go('casino', 1000, 880, '🎰 Vào Nhà Casino…') },
      { ic: '💐', t: 'Chợ hoa Quảng Bá (Hồ Tây)', d: 'Hoa bó, cúc họa mi, cây đào, quất, mai mang về trang trí vườn', act: go('hotay', 4700, 860, '💐 Tới chợ hoa Quảng Bá…') },
      { ic: '🏟️', t: 'Khu Thể Thao 3D', d: 'Cầu lông, bóng bàn, pickleball, bóng rổ, golf — camera sau lưng như game thật', act: go('sport', 1930, 875, '🏟️ Tới Khu Thể Thao…') },
      { ic: '🌅', t: 'Hồ Tây', d: 'Show drone & pháo hoa 5 phút/lần, ngồi vịt đạp, đài ngắm cực quang, 4 điểm ngắm cảnh', act: go('hotay', 2650, 875, '🌅 Ra Hồ Tây…') },
      { ic: '🇻🇳', t: 'Quảng trường Ba Đình', d: 'Lăng Bác, lễ thượng cờ 10 phút/lần, Chùa Một Cột, tìm hiểu lịch sử', act: go('badinh', 2150, 875, '🇻🇳 Tới Quảng trường Ba Đình…') },
      { ic: '🌳', t: 'Vườn Nhà · Tiệm bánh · Bến sông', d: 'Tự trồng cây ăn quả to, trang trí vườn, 30+ loại bánh, thuyền giao hàng', act: go('garden', 330, 1235, '🌳 Sang vườn nhà…') },
      { ic: '🧑‍🌾', t: 'Thuê giúp việc', d: 'Quản gia vườn & công nhân trang trại làm hộ khi bạn bận', act: go('garden', 1060, 1240, '🌳 Sang vườn nhà…') },
      { ic: '🎒', t: 'Tủ đồ: Đồ đã mua', d: 'Mọi thứ đã mua gom về một chỗ, mặc / dắt / chọn xe ngay', act: () => typeof CLOSET !== 'undefined' && CLOSET.open(), btn: 'Mở tủ đồ' },
      { ic: '📶', t: 'SIM VIP 0812.112.003', d: 'Số đẹp độc nhất 100.000.000 xu ở ZenoPhone / Thế Giới Dế Yêu — ai mua trước người đó có', act: () => typeof PHONE !== 'undefined' && PHONE.shop('cps'), btn: 'Xem SIM' },
      { ic: '📜', t: 'Nhiệm vụ mới mỗi ngày', d: 'Luôn có 1 nhiệm vụ ở khu mới: thắng ván thể thao, đạp vịt, làm bánh, giao thuyền, ngắm cảnh, mua hoa', act: () => UI.questsPanel && UI.questsPanel(), btn: 'Xem nhiệm vụ' },
    );
    return list;
  };
  const unseen = () => (S().newsSeen || 0) < VER;
  function open() {
    const p = UI.panel('🆕 Có gì mới', '', { wide: true });
    const items = ITEMS();
    p.body.innerHTML = `<p class="muted" style="margin-top:0">Thành phố vừa có thêm nhiều chỗ chơi mới — bấm <b>Đi ngay</b> để tới thẳng!</p>
      <div class="shop-list">${items.map((it, i) => `<div class="shop-row"><span class="ic">${it.ic}</span><div class="info"><b>${it.t}</b><small>${it.d}</small></div><button class="btn small" data-i="${i}">${it.btn || 'Đi ngay'}</button></div>`).join('')}</div>`;
    p.body.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { p.close(); items[+b.dataset.i].act(); });
    S().newsSeen = VER; AV.markChanged(); refresh();
  }
  let btn = null;
  function refresh() { if (btn) btn.classList.toggle('has-dot', unseen()); }
  /** khu chưa ghé lần nào → hiện chữ MỚI trên bản đồ thành phố */
  const isNew = (zoneId) => NEW_ZONES.includes(zoneId) && !((S().visited || {})[zoneId]);
  function init() {
    btn = document.createElement('button');
    btn.className = 'av-btn sq news-btn'; btn.textContent = '🆕'; btn.title = 'Có gì mới';
    btn.onclick = open;
    const host = document.querySelector('.hud-row') || document.querySelector('.hud-left');
    if (host) host.appendChild(btn); else document.body.appendChild(btn);
    const st = document.createElement('style');
    st.textContent = `.news-btn{position:relative}.news-btn.has-dot::after{content:'';position:absolute;top:2px;right:2px;width:12px;height:12px;border-radius:50%;background:#fa5252;border:2px solid #fff;animation:nwPulse 1s infinite alternate}
@keyframes nwPulse{from{transform:scale(.8)}to{transform:scale(1.2)}}
.zone{position:absolute}.zone .zone-new{position:absolute;top:-9px;right:-6px;background:#fa5252;color:#fff;font-style:normal;font-size:10px;font-weight:900;padding:1px 6px;border-radius:999px;border:2px solid #fff;animation:nwPulse .8s infinite alternate;pointer-events:none}`;
    document.head.appendChild(st);
    refresh();
    // ghi lại khu đã ghé
    setInterval(() => { if (!AV.currentMap || !S()) return; const id = AV.currentMap(); S().visited = S().visited || {}; if (!S().visited[id]) { S().visited[id] = 1; AV.markChanged(); } }, 1500);
    // có bản mới → tự mở bảng 1 lần (đợi popup đăng nhập / sự kiện đóng)
    if (unseen()) { const tryOpen = () => { if (!unseen()) return; if (UI.isBlocking()) return setTimeout(tryOpen, 3000); open(); }; setTimeout(tryOpen, 9000); }
  }
  return { init, open, isNew };
})();
