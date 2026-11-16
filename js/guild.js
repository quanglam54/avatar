/* 🛡️ BANG HỘI — lập bang / vào bang, góp xu quỹ tuần, nhận thưởng mốc, bảng xếp hạng bang.
 * Cần file supabase/22-bang-hoi.sql. Nút 🛡️ trên thanh công cụ. */
const GUILD = (() => {
  const COST = 100000, MAXM = 20;
  const NEED = [1000000, 5000000, 20000000], PRIZE = [30000, 120000, 400000];
  const ICONS = ['🛡️', '🐉', '🦁', '🐺', '🦅', '🌸', '🔥', '⚡', '🌙', '🍀', '👑', '🦎', '🐼', '🍉'];
  const S = () => AV.S;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (n) => Math.floor(+n || 0).toLocaleString('vi-VN');
  const online = () => typeof CLOUD !== 'undefined' && CLOUD.user && CLOUD.client;
  const db = () => CLOUD.client;
  const errMsg = (e) => String((e && e.message) || e || 'Lỗi');
  const save = () => { AV.markChanged(); if (AV.saveNow) AV.saveNow(); };
  const weekKey = (t = Date.now()) => { const d = new Date(t + 7 * 3600e3); const day = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - day); return d.toISOString().slice(0, 10); };
  const rpc = async (name, args) => { const { data, error } = await db().rpc(name, args || {}); if (error) throw error; return data; };

  function panel() {
    if (!online()) return UI.toast('🛡️ Đăng nhập tài khoản để vào bang hội', 4000);
    const p = UI.panel('🛡️ Bang hội', '<p class="muted">⏳ Đang tải…</p>', { wide: true });
    let tab = 'my', busy = false, q = '';
    const tabs = (mine) => `<div class="ss-tabs">${[['my', mine ? '🛡️ Bang của tôi' : '🛡️ Tìm bang'], ['rank', '🏆 Xếp hạng tuần']].map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;
    const act = async (fn, okMsg) => {
      if (busy) return; busy = true;
      try { const r = await fn(); if (okMsg) UI.toast(typeof okMsg === 'function' ? okMsg(r) : okMsg, 4000); } catch (e) { UI.toast('🛡️ ' + errMsg(e), 4500); }
      busy = false; render();
    };

    async function render() {
      if (!p.body.isConnected) return;
      const uid = CLOUD.user.id, wk = weekKey();
      const me = await db().from('guild_members').select('guild_id, role').eq('user_id', uid).maybeSingle();
      if (!p.body.isConnected) return;
      if (me.error) { p.body.innerHTML = '<p class="muted">Bang hội chưa mở (cần chạy file SQL 22 trên Supabase).</p>'; return; }
      const mine = me.data;
      S().guild = mine ? mine.guild_id : 0;
      p.body.innerHTML = `${tabs(!!mine)}<div class="ss-box"><p class="muted">⏳ Đang tải…</p></div>`;
      p.body.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; render(); }; });
      const box = p.body.querySelector('.ss-box');
      if (tab === 'rank') return renderRank(box, wk, mine);
      if (mine) return renderMine(box, wk, mine, uid);
      return renderFind(box, wk);
    }

    async function renderRank(box, wk, mine) {
      const { data } = await db().from('guild_week').select('guild_id, points').eq('week', wk).order('points', { ascending: false }).limit(20);
      const ids = (data || []).map((r) => r.guild_id);
      const g = ids.length ? (await db().from('guilds').select('id, name, icon, members').in('id', ids)).data || [] : [];
      if (!box.isConnected) return;
      box.innerHTML = `<p class="muted small-note">Xếp theo quỹ bang góp được trong tuần này (tính lại mỗi thứ Hai).</p>
        <div class="shop-list">${(data || []).map((r, i) => { const x = g.find((y) => y.id === r.guild_id); if (!x) return ''; return `<div class="shop-row ${mine && mine.guild_id === x.id ? 'quest ready' : ''}"><span class="ic">${['🥇', '🥈', '🥉'][i] || x.icon}</span><div class="info"><b>${esc(x.icon)} ${esc(x.name)}</b><small>👥 ${x.members}/${MAXM}</small></div><b>${fmt(r.points)} xu</b></div>`; }).join('') || '<p class="muted">Tuần này chưa bang nào góp quỹ.</p>'}</div>`;
    }

    async function renderFind(box, wk) {
      const { data } = await db().from('guilds').select('id, name, icon, descr, members, created_at').order('members', { ascending: false }).limit(60);
      if (!box.isConnected) return;
      const k = q.trim().toLowerCase();
      const list = (data || []).filter((g) => !k || g.name.toLowerCase().includes(k));
      box.innerHTML = `<p class="muted small-note">Vào bang để cùng góp quỹ tuần — quỹ đạt <b>${NEED.map((n) => fmt(n)).join(' / ')} xu</b> thì <b>mỗi thành viên</b> nhận <b>${PRIZE.map((n) => fmt(n)).join(' / ')} xu</b>.</p>
        <input class="field" data-q placeholder="🔍 Tìm tên bang…" value="${esc(q)}">
        <div class="shop-list">${list.map((g) => `<div class="shop-row"><span class="ic">${esc(g.icon)}</span><div class="info"><b>${esc(g.name)}</b><small>👥 ${g.members}/${MAXM}${g.descr ? ' · ' + esc(g.descr) : ''}</small></div><button class="btn small" data-join="${g.id}" ${g.members >= MAXM ? 'disabled' : ''}>${g.members >= MAXM ? 'Đủ người' : '➕ Vào bang'}</button></div>`).join('') || '<p class="muted">Chưa có bang nào — lập bang đầu tiên đi!</p>'}</div>
        <h4 class="ev-h">✨ Lập bang mới · ${fmt(COST)} xu</h4>
        <div class="bk-row"><select class="field" data-icon style="flex:0 0 76px">${ICONS.map((i) => `<option>${i}</option>`).join('')}</select><input class="field" data-name maxlength="24" placeholder="Tên bang (3–24 ký tự)"></div>
        <input class="field" data-descr maxlength="120" placeholder="Lời giới thiệu (không bắt buộc)">
        <div class="row-end"><button class="btn" data-create ${S().coins < COST ? 'disabled' : ''}>🛡️ Lập bang (${fmt(COST)} xu)</button></div>`;
      const qi = box.querySelector('[data-q]');
      qi.oninput = () => { q = qi.value; clearTimeout(qi._t); qi._t = setTimeout(() => render().then(() => { const n = p.body.querySelector('[data-q]'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }), 400); };
      box.querySelectorAll('[data-join]').forEach((b) => { b.onclick = () => act(async () => { await rpc('guild_join', { p_id: +b.dataset.join, p_pname: S().name || 'Bạn' }); }, '🛡️ Đã vào bang! Góp quỹ để cả bang cùng nhận thưởng'); });
      box.querySelector('[data-create]').onclick = () => {
        const name = box.querySelector('[data-name]').value.trim(), icon = box.querySelector('[data-icon]').value, descr = box.querySelector('[data-descr]').value.trim();
        if (name.length < 3) return UI.toast('Tên bang cần ít nhất 3 ký tự');
        if (S().coins < COST) return UI.toast(`Cần ${fmt(COST)} xu để lập bang`);
        UI.confirm(`Lập bang <b>${esc(icon)} ${esc(name)}</b> với giá <b>${fmt(COST)} xu</b>?`, '🛡️ Lập bang', () => act(async () => {
          await rpc('guild_create', { p_name: name, p_icon: icon, p_descr: descr, p_pname: S().name || 'Bạn' });
          S().coins -= COST; UI.updateHud(); save();
          if (NET.sendNews) NET.sendNews(`🛡️ ${S().name} vừa lập bang ${icon} ${name} — vào bang cùng chơi nhé!`);
        }, `🎉 Đã lập bang ${icon} ${name}!`));
      };
    }

    async function renderMine(box, wk, mine, uid) {
      const gid = mine.guild_id;
      const [g, mem, w, cl] = await Promise.all([
        db().from('guilds').select('id, name, icon, descr, members, leader').eq('id', gid).maybeSingle(),
        db().from('guild_members').select('user_id, name, role, week, week_pts, total_pts, joined_at').eq('guild_id', gid).order('joined_at', { ascending: true }),
        db().from('guild_week').select('points').eq('guild_id', gid).eq('week', wk).maybeSingle(),
        db().from('guild_claims').select('lvl').eq('week', wk).eq('user_id', uid),
      ]);
      if (!box.isConnected) return;
      if (!g.data) { box.innerHTML = '<p class="muted">Không tải được bang.</p>'; return; }
      const G = g.data, pts = (w.data && w.data.points) || 0, got = new Set((cl.data || []).map((r) => r.lvl)), lead = mine.role === 'leader';
      const members = (mem.data || []).map((m) => ({ ...m, wp: m.week === wk ? m.week_pts : 0 })).sort((a, b) => b.wp - a.wp);
      const pct = Math.min(100, (pts / NEED[2]) * 100);
      box.innerHTML = `<div class="shop-row quest ready"><span class="ic">${esc(G.icon)}</span><div class="info"><b>${esc(G.name)}</b><small>👥 ${G.members}/${MAXM}${G.descr ? ' · ' + esc(G.descr) : ''}</small></div>${lead ? '<button class="btn small ghost" data-edit>✏️ Giới thiệu</button>' : ''}</div>
        <h4 class="ev-h">💰 Quỹ tuần này: ${fmt(pts)} xu</h4>
        <div style="position:relative;height:16px;border-radius:9px;background:#e9ecef;overflow:hidden"><i style="position:absolute;inset:0 auto 0 0;width:${pct}%;background:linear-gradient(90deg,#ffd43b,#f08c00)"></i>${NEED.map((n) => `<b style="position:absolute;top:0;bottom:0;left:${(n / NEED[2]) * 100}%;width:2px;background:#495057"></b>`).join('')}</div>
        <div class="shop-list">${NEED.map((n, i) => { const ok = pts >= n, done = got.has(i + 1); return `<div class="shop-row ${ok && !done ? 'quest ready' : ''}"><span class="ic">${['🥉', '🥈', '🥇'][i]}</span><div class="info"><b>Mốc ${i + 1}: quỹ ${fmt(n)} xu</b><small>Mỗi thành viên nhận ${fmt(PRIZE[i])} xu</small></div>${done ? '<span class="lock">✅ Đã nhận</span>' : `<button class="btn small" data-claim="${i + 1}" ${ok ? '' : 'disabled'}>${ok ? '🎁 Nhận' : `Còn ${fmt(n - pts)}`}</button>`}</div>`; }).join('')}</div>
        <div class="bk-row"><input class="field" data-amt type="number" min="1000" step="1000" placeholder="Số xu góp (1.000 – 10.000.000)"><button class="btn" data-donate>💰 Góp quỹ</button></div>
        <div class="bk-row">${[10000, 100000, 1000000].map((n) => `<button class="btn small ghost" data-quick="${n}">+${fmt(n)}</button>`).join('')}</div>
        <h4 class="ev-h">👥 Thành viên · góp tuần này</h4>
        <div class="shop-list">${members.map((m, i) => `<div class="shop-row"><span class="ic">${m.role === 'leader' ? '👑' : i < 3 && m.wp ? ['🥇', '🥈', '🥉'][i] : '🙂'}</span><div class="info"><b>${esc(m.name || 'Ẩn danh')}${m.user_id === uid ? ' (bạn)' : ''}</b><small>Tuần này ${fmt(m.wp)} · tổng ${fmt(m.total_pts)} xu</small></div>${lead && m.user_id !== uid ? `<button class="btn small ghost" data-kick="${m.user_id}" data-n="${esc(m.name || '')}">Mời ra</button>` : ''}</div>`).join('')}</div>
        <div class="row-end"><button class="btn ghost" data-leave>🚪 Rời bang</button></div>`;
      const amt = box.querySelector('[data-amt]');
      box.querySelectorAll('[data-quick]').forEach((b) => { b.onclick = () => { amt.value = b.dataset.quick; }; });
      box.querySelector('[data-donate]').onclick = () => {
        const n = Math.floor(+amt.value || 0);
        if (n < 1000 || n > 10000000) return UI.toast('Mỗi lần góp từ 1.000 đến 10.000.000 xu');
        if (S().coins < n) return UI.toast('Không đủ xu');
        act(async () => { await rpc('guild_donate', { p_amount: n, p_pname: S().name || 'Bạn' }); S().coins -= n; UI.updateHud(); save(); }, `💰 Đã góp ${fmt(n)} xu vào quỹ bang!`);
      };
      box.querySelectorAll('[data-claim]').forEach((b) => { b.onclick = () => act(async () => { const lvl = +b.dataset.claim; const c = +(await rpc('guild_claim', { p_lvl: lvl })) || 0; if (c > 0) { AV.earn(c, 30); UI.updateHud(); save(); } return c; }, (c) => `🎁 Thưởng mốc bang: +${fmt(c)} xu!`); });
      box.querySelectorAll('[data-kick]').forEach((b) => { b.onclick = () => UI.confirm(`Mời <b>${esc(b.dataset.n)}</b> ra khỏi bang?`, 'Mời ra', () => act(() => rpc('guild_kick', { p_user: b.dataset.kick }), 'Đã mời ra khỏi bang')); });
      box.querySelector('[data-leave]').onclick = () => UI.confirm(`Rời bang <b>${esc(G.name)}</b>?${lead ? '<br><small>Bạn là bang chủ — người vào bang sớm nhất sẽ lên thay. Bang không còn ai sẽ bị giải tán.</small>' : ''}`, '🚪 Rời bang', () => act(() => rpc('guild_leave'), 'Đã rời bang'));
      const ed = box.querySelector('[data-edit]');
      if (ed) ed.onclick = () => { const t = prompt('Lời giới thiệu bang (tối đa 120 ký tự):', G.descr || ''); if (t !== null) act(() => rpc('guild_edit', { p_descr: t.slice(0, 120) }), 'Đã sửa lời giới thiệu'); };
    }

    render();
  }

  const hook = () => { const b = document.getElementById('btnGuild'); if (b) b.onclick = () => panel(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();

  return { panel };
})();
