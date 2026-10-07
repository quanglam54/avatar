/* QuangLamBank: mở tài khoản (số tài khoản + mật khẩu 6 số), gửi xu vào tài khoản, rút xu cần mật khẩu.
   Xu trong tài khoản an toàn: không bị trộm, không bị phạt, không dùng nhầm khi mua đồ. */
const BANK = (() => {
  const MAX_FAILS = 5, LOCK_MIN = 10;
  /** Lãi 1%/ngày tính theo giờ, tối đa 20.000 xu lãi mỗi ngày */
  const RATE = 0.01, MAX_DAY = 20000;
  const fmt = (n) => Math.floor(n).toLocaleString('vi-VN');

  /** Băm mật khẩu kèm số tài khoản (không lưu mật khẩu thật trong bản lưu) */
  async function hash(acct, pin) {
    const txt = `QLB|${acct}|${pin}`;
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      let h = 2166136261; for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
      return 'f' + (h >>> 0).toString(16);
    }
  }
  const acc = () => AV.S.bank || null;
  const save = () => { AV.markChanged(); UI.updateHud(); };
  function log(type, amt, who) {
    const b = acc();
    b.log = [{ type, amt, at: Date.now(), bal: b.bal, ...(who ? { who } : {}) }, ...(b.log || [])].slice(0, 30);
  }

  /* ---------- Chuyển khoản theo STK (Supabase: supabase/09-chuyen-khoan-ngan-hang.sql) ---------- */
  const online = () => typeof CLOUD !== 'undefined' && CLOUD.user && CLOUD.client;
  let regKey = '', regTaken = false;
  function sqlMissing(e) { return /bank_|does not exist|Could not find the function/i.test(String((e && e.message) || e || '')); }
  /** gắn STK với nhân vật trên máy chủ (để người khác chuyển tiền tới được) */
  async function register() {
    const b = acc();
    if (!b || !online()) return;
    const k = b.acct + '|' + AV.S.name;
    if (k === regKey) return;
    const { data, error } = await CLOUD.client.rpc('bank_register', { p_acct: b.acct, p_name: AV.S.name });
    if (error) return;
    regKey = k; regTaken = data === 'taken';
  }
  async function lookup(acct) {
    if (!online()) throw new Error('Cần đăng nhập tài khoản game để chuyển khoản');
    const { data, error } = await CLOUD.client.rpc('bank_lookup', { p_acct: acct });
    if (error) throw new Error(sqlMissing(error) ? 'Chủ game chưa bật chuyển khoản (chạy supabase/09-chuyen-khoan-ngan-hang.sql)' : 'Không tra được số tài khoản');
    return data || null;
  }
  /** chuyển tiền từ số dư tài khoản → trả về biên lai */
  async function transfer(toAcct, amt, note) {
    const b = acc();
    amt = Math.floor(amt);
    if (!b) throw new Error('Chưa có tài khoản');
    if (!/^\d{6,12}$/.test(toAcct)) throw new Error('Số tài khoản người nhận gồm 6–12 chữ số');
    if (toAcct === b.acct) throw new Error('Không thể tự chuyển cho chính mình');
    if (!(amt > 0)) throw new Error('Nhập số xu muốn chuyển');
    if (amt > b.bal) throw new Error(`Số dư không đủ (còn ${fmt(b.bal)} xu). Gửi thêm xu vào tài khoản trước nhé`);
    if (!online()) throw new Error('Cần đăng nhập tài khoản game để chuyển khoản');
    await register();
    b.bal -= amt; save();                                          // trừ trước, lỗi thì hoàn lại
    let data, error;
    try { ({ data, error } = await CLOUD.client.rpc('bank_send', { p_to: toAcct, p_amount: amt, p_note: String(note || '').slice(0, 80), p_from_acct: b.acct, p_from_name: AV.S.name })); }
    catch (e) { error = e; }
    const why = error ? (sqlMissing(error) ? 'Chủ game chưa bật chuyển khoản (chạy supabase/09-chuyen-khoan-ngan-hang.sql)' : 'Không kết nối được máy chủ ngân hàng') : data && data.error ? ({ not_found: 'Số tài khoản không tồn tại', self: 'Không thể tự chuyển cho chính mình', rate: 'Chuyển quá nhanh, đợi 1 phút nhé', auth: 'Cần đăng nhập' }[data.error] || 'Giao dịch thất bại') : '';
    if (why) { b.bal += amt; save(); throw new Error(why); }
    log('xout', amt, `${data.to_name || ''} · ${toAcct}`); save();
    return { id: data.id, toName: data.to_name || '', toAcct, amt, note: String(note || ''), at: data.at ? new Date(data.at) : new Date(), fromName: AV.S.name, fromAcct: b.acct, bal: b.bal };
  }
  /** nhận tiền người khác chuyển tới (gọi định kỳ) */
  let receiving = false;
  async function receive() {
    const b = acc();
    if (!b || !online() || receiving || (AV.isCloudReady && !AV.isCloudReady())) return;
    receiving = true;
    try {
      await register();
      const { data, error } = await CLOUD.client.rpc('bank_claim');
      if (error || !Array.isArray(data) || !data.length) return;
      let tot = 0;
      data.forEach((r) => { const a = Math.max(0, Math.floor(+r.amt) || 0); tot += a; b.bal += a; log('xin', a, `${r.n || 'Ai đó'} · ${r.a || ''}${r.note ? ' · "' + r.note + '"' : ''}`); });
      save();
      UI.toast(`🏦 QuangLamBank: +${fmt(tot)} xu vào tài khoản ${b.acct} (${data.length} giao dịch) — mở 🏦 Ngân hàng trong MENU để xem`, 7000);
      if (typeof MUSIC !== 'undefined' && MUSIC.coin) MUSIC.coin();
    } finally { receiving = false; }
  }
  setInterval(receive, 45000);
  setTimeout(receive, 8000);

  /** 🧾 Biên lai "Chuyển tiền thành công" (ảnh, có thể lưu về máy) */
  function receipt(r) {
    const cv = document.createElement('canvas'), W2 = 520, H2 = 640;
    cv.width = W2 * 2; cv.height = H2 * 2;
    const c = cv.getContext('2d'); c.scale(2, 2);
    const bg = c.createLinearGradient(0, 0, 0, H2); bg.addColorStop(0, '#00703c'); bg.addColorStop(0.32, '#00502b'); bg.addColorStop(0.32, '#f1f3f5'); bg.addColorStop(1, '#f1f3f5');
    c.fillStyle = bg; c.fillRect(0, 0, W2, H2);
    logo(c, 46, 42, 20);
    c.fillStyle = '#fff'; c.font = '900 22px "Be Vietnam Pro", system-ui'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('QuangLamBank', 76, 42);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(W2 / 2, 120, 34, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#2f9e44'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(W2 / 2 - 15, 121); c.lineTo(W2 / 2 - 3, 133); c.lineTo(W2 / 2 + 17, 108); c.stroke();
    c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '900 22px "Be Vietnam Pro", system-ui'; c.fillText('Chuyển tiền thành công', W2 / 2, 178);
    c.fillStyle = '#fff'; c.beginPath(); c.roundRect(24, 214, W2 - 48, 396, 18); c.fill();
    c.fillStyle = '#00703c'; c.font = '900 38px "Be Vietnam Pro", system-ui'; c.fillText(`${fmt(r.amt)} xu`, W2 / 2, 262);
    c.fillStyle = '#868e96'; c.font = '600 14px "Be Vietnam Pro", system-ui'; c.fillText(r.at.toLocaleString('vi-VN'), W2 / 2, 294);
    const rows = [['Người nhận', r.toName || '—'], ['Số tài khoản nhận', r.toAcct], ['Người chuyển', r.fromName], ['Từ tài khoản', r.fromAcct], ['Nội dung', r.note || 'Chuyển tiền'], ['Mã giao dịch', 'QL' + String(r.id).padStart(8, '0')]];
    rows.forEach(([k, v], i) => {
      const y = 334 + i * 44;
      c.strokeStyle = '#e9ecef'; c.lineWidth = 1; c.beginPath(); c.moveTo(44, y - 22); c.lineTo(W2 - 44, y - 22); c.stroke();
      c.textAlign = 'left'; c.fillStyle = '#868e96'; c.font = '600 14px "Be Vietnam Pro", system-ui'; c.fillText(k, 44, y);
      c.textAlign = 'right'; c.fillStyle = '#1b2f48'; c.font = '800 15px "Be Vietnam Pro", system-ui';
      let t = String(v); while (c.measureText(t).width > 260 && t.length > 4) t = t.slice(0, -2) + '…';
      c.fillText(t, W2 - 44, y);
    });
    c.textAlign = 'center'; c.fillStyle = '#adb5bd'; c.font = '600 12px "Be Vietnam Pro", system-ui'; c.fillText('Cảm ơn quý khách đã sử dụng dịch vụ QuangLamBank 💚', W2 / 2, 624);
    const url = cv.toDataURL('image/png');
    const p = UI.panel('🧾 Biên lai chuyển khoản', `<img class="bk-receipt" src="${url}" alt="Chuyển tiền thành công"><div class="row-end"><a class="btn small ghost" download="chuyen-khoan-QL${r.id}.png" href="${url}">📥 Lưu ảnh</a><button class="btn small" data-ok>Xong</button></div>`);
    p.body.querySelector('[data-ok]').onclick = () => p.close();
  }
  /** Cộng lãi từ lần tính trước (gọi khi mở ngân hàng / ATM) */
  function accrue() {
    const b = acc(); if (!b) return 0;
    const now = Date.now();
    if (!b.lastInt) { b.lastInt = now; return 0; }
    const days = (now - b.lastInt) / 86400000;
    if (days < 1 / 24) return 0;
    const gain = Math.floor(Math.min(b.bal * RATE * days, MAX_DAY * days));
    b.lastInt = now;
    if (gain > 0) { b.bal += gain; log('int', gain); save(); }
    return gain;
  }
  const locked = () => { const b = acc(); return b && b.lockUntil && b.lockUntil > Date.now(); };

  async function openAccount(acct, pin) {
    if (acc()) return 'Bạn đã có tài khoản rồi';
    if (!/^\d{6,12}$/.test(acct)) return 'Số tài khoản gồm 6–12 chữ số';
    if (!/^\d{6}$/.test(pin)) return 'Mật khẩu gồm đúng 6 chữ số';
    if (online()) {
      try { const { data } = await CLOUD.client.rpc('bank_lookup', { p_acct: acct }); if (data) return 'Số tài khoản này đã có người dùng, chọn số khác nhé'; } catch (e) { /* chưa bật chuyển khoản */ }
    }
    AV.S.bank = { acct, pin: await hash(acct, pin), bal: 0, fails: 0, lockUntil: 0, opened: Date.now(), lastInt: Date.now(), log: [] };
    log('open', 0); save();
    regKey = ''; register();
    return null;
  }
  async function checkPin(pin) {
    const b = acc();
    if (!b) return 'Chưa có tài khoản';
    if (locked()) return `🔒 Nhập sai quá ${MAX_FAILS} lần — thẻ bị khoá, thử lại sau ${Math.ceil((b.lockUntil - Date.now()) / 60000)} phút`;
    if ((await hash(b.acct, pin)) === b.pin) { b.fails = 0; save(); return null; }
    b.fails = (b.fails || 0) + 1;
    if (b.fails >= MAX_FAILS) { b.lockUntil = Date.now() + LOCK_MIN * 60000; b.fails = 0; save(); return `🔒 Sai mật khẩu ${MAX_FAILS} lần — tài khoản bị khoá ${LOCK_MIN} phút`; }
    save();
    return `Sai mật khẩu (còn ${MAX_FAILS - b.fails} lần thử)`;
  }
  function deposit(amt) {
    const S = AV.S, b = acc();
    amt = Math.floor(amt);
    if (!b) return 'Chưa có tài khoản';
    if (!(amt > 0)) return 'Nhập số xu muốn gửi';
    if (amt > S.coins) return `Bạn chỉ có ${fmt(S.coins)} xu trong túi`;
    S.coins -= amt; b.bal += amt; log('in', amt); save();
    return null;
  }
  function withdraw(amt) {
    const S = AV.S, b = acc();
    amt = Math.floor(amt);
    if (!(amt > 0)) return 'Nhập số xu muốn rút';
    if (amt > b.bal) return `Tài khoản chỉ còn ${fmt(b.bal)} xu`;
    b.bal -= amt; S.coins += amt; log('out', amt); save();
    return null;
  }

  /* ---------- Giao diện ---------- */
  /** where: 'counter' (quầy giao dịch trong ngân hàng) | 'atm' */
  function panel(where = 'atm') {
    const S = AV.S;
    const atm = where === 'atm' || where === 'app';
    const p = UI.panel(where === 'app' ? '📱 QuangLam Mobile Banking' : atm ? '🏧 ATM QuangLamBank' : '🏦 QuangLamBank · Quầy giao dịch', '', { wide: false });
    register(); receive();
    let unlocked = false, msg = '', ok = false;
    if (where === 'app' && !acc()) { p.close(); return UI.toast('🏦 Bạn chưa có tài khoản — mở tài khoản ở QuangLamBank trước cổng nông trại nhé', 5000); }
    const got = accrue();
    if (got > 0) setTimeout(() => UI.toast(`💹 Tiền lãi về tài khoản: +${fmt(got)} xu`, 4000), 300);
    const say = (m, good) => { msg = m || ''; ok = !!good; };
    const val = (sel) => (p.body.querySelector(sel) || {}).value || '';
    const render = () => {
      const b = acc();
      const note = msg ? `<p class="bk-msg ${ok ? 'ok' : ''}">${msg}</p>` : '';
      if (!b) {
        p.body.innerHTML = `<div class="bk-card"><div class="bk-logo">QL</div><div><b>QuangLamBank</b><small>Cất xu an toàn · lãi 1%/ngày</small></div></div>
          <p class="muted">Bạn chưa có tài khoản. Tạo số tài khoản và mật khẩu 6 số để bắt đầu gửi xu.</p>
          <label class="muted">Số tài khoản (6–12 chữ số)</label>
          <div class="bk-row"><input class="field" data-acct inputmode="numeric" maxlength="12" placeholder="vd: 0912345678"><button class="btn small ghost" data-rand>🎲 Số ngẫu nhiên</button></div>
          <label class="muted">Mật khẩu (6 chữ số)</label>
          <input class="field" data-pin type="password" inputmode="numeric" maxlength="6" placeholder="••••••">
          <input class="field" data-pin2 type="password" inputmode="numeric" maxlength="6" placeholder="Nhập lại mật khẩu" style="margin-top:6px">
          ${note}
          <div class="row-end"><button class="btn" data-open>🏦 Mở tài khoản</button></div>
          <p class="muted small-note">⚠️ Nhớ kỹ mật khẩu — rút xu bắt buộc phải nhập đúng mật khẩu.</p>`;
        p.body.querySelector('[data-rand]').onclick = () => { p.body.querySelector('[data-acct]').value = '9' + String(Math.floor(Math.random() * 1e9)).padStart(9, '0'); };
        p.body.querySelector('[data-open]').onclick = async () => {
          const a = val('[data-acct]').trim(), pin = val('[data-pin]'), pin2 = val('[data-pin2]');
          if (pin !== pin2) { say('Hai lần nhập mật khẩu không giống nhau'); return render(); }
          const e = await openAccount(a, pin);
          if (e) { say(e); return render(); }
          unlocked = true; say(`🎉 Mở tài khoản thành công! Số tài khoản: ${a}`, true); render();
        };
        return;
      }
      const head = `<div class="bk-card"><div class="bk-logo">QL</div><div><b>QuangLamBank</b><small>STK: <b>${b.acct}</b> · ${esc(S.name || '')}</small></div></div>`;
      if (!unlocked) {
        p.body.innerHTML = `${head}
          <p>💰 Trong túi: <b>${fmt(S.coins)} xu</b></p>
          <label class="muted">Gửi xu vào tài khoản (không cần mật khẩu)</label>
          <div class="bk-row"><input class="field" data-in type="number" min="1" placeholder="Số xu"><button class="btn small ghost" data-inall>Tất cả</button><button class="btn small" data-dep>Gửi</button></div>
          <label class="muted" style="margin-top:12px">Nhập mật khẩu để xem số dư / rút xu</label>
          <div class="bk-row"><input class="field" data-pin type="password" inputmode="numeric" maxlength="6" placeholder="••••••"><button class="btn small" data-unlock>Đăng nhập</button></div>
          ${note}
          ${atm ? '' : '<div class="row-end"><button class="btn small ghost" data-forgot>Quên mật khẩu?</button></div>'}`;
      } else {
        p.body.innerHTML = `${head}
          <div class="bk-bal"><small>Số dư tài khoản · 💹 lãi 1%/ngày</small><b>${fmt(b.bal)} xu</b><small>💰 Trong túi: ${fmt(S.coins)} xu</small></div>
          <label class="muted">Gửi xu vào tài khoản</label>
          <div class="bk-row"><input class="field" data-in type="number" min="1" placeholder="Số xu"><button class="btn small ghost" data-inall>Tất cả</button><button class="btn small" data-dep>Gửi</button></div>
          <label class="muted">Rút xu về túi</label>
          <div class="bk-row"><input class="field" data-out type="number" min="1" placeholder="Số xu"><button class="btn small ghost" data-outall>Tất cả</button><button class="btn small" data-wd>Rút</button></div>
          <div class="bk-xfer"><b>💸 Chuyển khoản</b>${regTaken ? '<p class="bk-msg">⚠️ STK của bạn trùng với người khác nên chưa nhận được chuyển khoản — mở tài khoản mới ở quầy giao dịch.</p>' : ''}
            <div class="bk-row"><input class="field" data-to inputmode="numeric" maxlength="12" placeholder="Số tài khoản người nhận"><button class="btn small ghost" data-look>Kiểm tra</button></div>
            <p class="muted" data-toname></p>
            <div class="bk-row"><input class="field" data-amt type="number" min="1" placeholder="Số xu"><input class="field" data-note maxlength="80" placeholder="Nội dung (không bắt buộc)"></div>
            <div class="row-end"><button class="btn" data-send>💸 Chuyển tiền</button></div></div>
          ${note}
          ${(b.log || []).length ? `<div class="bk-log">${b.log.map((l) => `<div><span>${l.type === 'in' ? '⬇️ Gửi' : l.type === 'out' ? '⬆️ Rút' : l.type === 'int' ? '💹 Tiền lãi' : l.type === 'xin' ? '💰 Nhận CK từ ' + esc(l.who || '') : l.type === 'xout' ? '💸 Chuyển tới ' + esc(l.who || '') : l.type === 'pin' ? '🔑 Đổi mật khẩu' : '🏦 Mở tài khoản'}</span><b class="${l.type === 'int' || l.type === 'xin' ? 'in' : l.type === 'xout' ? 'out' : l.type}">${l.type === 'in' || l.type === 'int' || l.type === 'xin' ? '+' : l.type === 'out' || l.type === 'xout' ? '−' : ''}${l.amt ? fmt(l.amt) : ''}</b><small>${new Date(l.at).toLocaleString('vi-VN')}</small></div>`).join('')}</div>` : ''}
          <div class="row-end"><button class="btn small ghost" data-chpin>🔑 Đổi mật khẩu</button><button class="btn small ghost" data-lock>🔒 Thoát</button></div>`;
        p.body.querySelector('[data-out]') && (p.body.querySelector('[data-outall]').onclick = () => { p.body.querySelector('[data-out]').value = b.bal; });
        p.body.querySelector('[data-wd]').onclick = () => {
          const e = withdraw(+val('[data-out]'));
          say(e || `✅ Đã rút ${fmt(+val('[data-out]'))} xu về túi`, !e); render();
        };
        p.body.querySelector('[data-lock]').onclick = () => { unlocked = false; say(''); render(); };
        const nameBox = p.body.querySelector('[data-toname]');
        p.body.querySelector('[data-look]').onclick = async () => {
          const a = val('[data-to]').trim();
          if (!/^\d{6,12}$/.test(a)) { nameBox.textContent = '⚠️ Số tài khoản gồm 6–12 chữ số'; return; }
          nameBox.textContent = '⏳ Đang tra…';
          try { const n = await lookup(a); nameBox.innerHTML = n ? `👤 Người nhận: <b>${esc(n)}</b>` : '⚠️ Không tìm thấy số tài khoản này'; } catch (e) { nameBox.textContent = '⚠️ ' + e.message; }
        };
        p.body.querySelector('[data-send]').onclick = async () => {
          const a = val('[data-to]').trim(), n = +val('[data-amt]'), t = val('[data-note]');
          let who = null;
          try { who = await lookup(a); } catch (e) { say('⚠️ ' + e.message); return render(); }
          if (!who) { say('⚠️ Không tìm thấy số tài khoản ' + esc(a)); return render(); }
          UI.confirm(`Chuyển <b>${fmt(n || 0)} xu</b> tới <b>${esc(who)}</b> (STK ${esc(a)})?`, '💸 Chuyển', async () => {
            try { const r = await transfer(a, n, t); say(`✅ Đã chuyển ${fmt(r.amt)} xu tới ${esc(r.toName)}`, true); render(); receipt(r); }
            catch (e) { say('⚠️ ' + e.message); render(); }
          });
        };
        p.body.querySelector('[data-chpin]').onclick = () => changePin();
      }
      p.body.querySelector('[data-inall]').onclick = () => { p.body.querySelector('[data-in]').value = S.coins; };
      p.body.querySelector('[data-dep]').onclick = () => {
        const n = +val('[data-in]'), e = deposit(n);
        say(e || `✅ Đã gửi ${fmt(n)} xu vào tài khoản`, !e); render();
      };
      const ub = p.body.querySelector('[data-unlock]');
      if (ub) ub.onclick = async () => { const e = await checkPin(val('[data-pin]')); if (e) say(e); else { unlocked = true; say(''); } render(); };
      const fg = p.body.querySelector('[data-forgot]');
      if (fg) fg.onclick = () => UI.confirm('Đặt lại mật khẩu mới cho tài khoản này? Nhân viên ngân hàng sẽ xác minh bạn là chủ tài khoản (đang đăng nhập nhân vật này).', 'Đặt lại', () => changePin(true));
    };
    /** Đổi mật khẩu (reset = quên mật khẩu, làm ở quầy) */
    function changePin(reset) {
      const q = UI.panel('🔑 Đặt mật khẩu mới', `<input class="field" data-n1 type="password" inputmode="numeric" maxlength="6" placeholder="Mật khẩu mới (6 số)">
        <input class="field" data-n2 type="password" inputmode="numeric" maxlength="6" placeholder="Nhập lại" style="margin-top:6px">
        <p class="bk-msg" data-err></p><div class="row-end"><button class="btn" data-ok>Lưu</button></div>`);
      q.body.querySelector('[data-ok]').onclick = async () => {
        const a = q.body.querySelector('[data-n1]').value, c = q.body.querySelector('[data-n2]').value, err = q.body.querySelector('[data-err]');
        if (!/^\d{6}$/.test(a)) { err.textContent = 'Mật khẩu gồm đúng 6 chữ số'; return; }
        if (a !== c) { err.textContent = 'Hai lần nhập không giống nhau'; return; }
        const b = acc(); b.pin = await hash(b.acct, a); b.fails = 0; b.lockUntil = 0; log('pin', 0); save();
        q.close(); unlocked = true; say('✅ Đã đặt mật khẩu mới', true); render();
        if (reset) UI.toast('🔑 Đã đặt lại mật khẩu ngân hàng');
      };
    }
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    render();
  }

  /* ---------- Toà nhà ngân hàng (vẽ bằng code) ---------- */
  const G = '#00703c', G2 = '#00502b', LG = '#7bc142';
  function logo(c, x, y, r) {
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, r + 3, 0, Math.PI * 2); c.fill();
    c.fillStyle = LG; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = G; c.beginPath(); c.moveTo(x - r * 0.6, y - r * 0.45); c.lineTo(x + r * 0.62, y - r * 0.45); c.lineTo(x, y + r * 0.62); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.font = `900 ${r * 0.62}px "Be Vietnam Pro", system-ui`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('QL', x, y - r * 0.12);
  }
  function building(c, x, y) {
    const W = 460, L = x - W / 2;
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 6, W / 2 + 30, 24, 0, 0, Math.PI * 2); c.fill();
    // thân 2 tầng: đá kem + mặt kính xanh
    c.fillStyle = '#efe6d2'; c.fillRect(L, y - 330, W, 330);
    c.fillStyle = '#d9cdb2'; for (let k = 0; k < 8; k++) c.fillRect(L, y - 330 + k * 42, W, 2);
    c.fillStyle = G2; c.fillRect(L - 10, y - 342, W + 20, 18);
    c.fillStyle = LG; c.fillRect(L - 10, y - 326, W + 20, 5);
    // tầng 2: dãy cửa kính
    for (let i = 0; i < 5; i++) {
      const wx = L + 22 + i * 86;
      c.fillStyle = '#2f7a57'; c.fillRect(wx, y - 300, 74, 70);
      const g = c.createLinearGradient(wx, y - 300, wx + 74, y - 230); g.addColorStop(0, '#b8e6cf'); g.addColorStop(1, '#5fb48c');
      c.fillStyle = g; c.fillRect(wx + 4, y - 296, 66, 62);
      c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.moveTo(wx + 10, y - 296); c.lineTo(wx + 30, y - 296); c.lineTo(wx + 12, y - 234); c.lineTo(wx + 4, y - 234); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.fillRect(wx - 3, y - 230, 80, 6);
    }
    // biển hiệu lớn
    c.fillStyle = G; c.beginPath(); c.roundRect(L + 18, y - 216, W - 36, 64, 12); c.fill();
    c.strokeStyle = LG; c.lineWidth = 4; c.stroke();
    logo(c, L + 62, y - 184, 22);
    c.fillStyle = '#fff'; c.font = '900 34px "Be Vietnam Pro", system-ui'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('QUANGLAM BANK', L + 96, y - 186);
    // tầng 1: cột trắng + cửa kính lớn
    c.fillStyle = '#fff'; [0, 1, 2, 3].forEach((k) => c.fillRect(L + 20 + k * 138, y - 146, 18, 146));
    for (let k = 0; k < 3; k++) {
      const wx = L + 38 + k * 138;
      c.fillStyle = G2; c.fillRect(wx, y - 146, 120, 146);
      const g = c.createLinearGradient(wx, y - 140, wx + 120, y); g.addColorStop(0, '#d9f5e6'); g.addColorStop(1, '#7cc9a0');
      c.fillStyle = g; c.fillRect(wx + 6, y - 140, 108, 140);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.moveTo(wx + 14, y - 140); c.lineTo(wx + 40, y - 140); c.lineTo(wx + 16, y); c.lineTo(wx + 6, y); c.closePath(); c.fill();
      if (k === 1) {
        c.strokeStyle = G2; c.lineWidth = 3; c.beginPath(); c.moveTo(wx + 60, y - 140); c.lineTo(wx + 60, y); c.stroke();
        c.fillStyle = '#d4a017'; c.fillRect(wx + 50, y - 76, 4, 22); c.fillRect(wx + 66, y - 76, 4, 22);
        logo(c, wx + 60, y - 112, 13);
      } else {
        c.fillStyle = '#0b4d2f'; c.font = '800 13px "Be Vietnam Pro", system-ui'; c.textAlign = 'center';
        c.fillText(k === 0 ? 'GIAO DỊCH' : 'TIẾT KIỆM', wx + 60, y - 70);
      }
    }
    // bậc thềm + chậu cây
    c.fillStyle = '#cfc4ad'; c.fillRect(L + 160, y - 4, 140, 10); c.fillStyle = '#e5dcc8'; c.fillRect(L + 150, y + 4, 160, 10);
    [L + 4, L + W - 4].forEach((px) => {
      c.fillStyle = '#8a5a3c'; c.beginPath(); c.moveTo(px - 18, y - 30); c.lineTo(px + 18, y - 30); c.lineTo(px + 13, y); c.lineTo(px - 13, y); c.closePath(); c.fill();
      c.fillStyle = '#2f9e44'; c.beginPath(); c.arc(px, y - 52, 24, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#51cf66'; c.beginPath(); c.arc(px - 8, y - 60, 12, 0, Math.PI * 2); c.fill();
    });
    // cờ trên mái
    c.fillStyle = '#868e96'; c.fillRect(x - 2, y - 400, 4, 60);
    c.fillStyle = LG; c.beginPath(); c.moveTo(x + 2, y - 398); c.lineTo(x + 46, y - 386); c.lineTo(x + 2, y - 372); c.closePath(); c.fill();
  }

  return { panel, building, logo, receive, lookup, transfer, receipt };
})();
