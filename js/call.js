/* 📞 GỌI THOẠI THẬT giữa 2 số SIM — chỉ 2 người nghe được nhau (WebRTC nối thẳng 2 máy, dùng TURN trong config.js).
 * Báo hiệu (đổ chuông / nghe / offer / answer / ICE / cúp máy) gửi qua kênh online chung của game (NET.sendCall),
 * mỗi tin ghi rõ người nhận (user id) + mã cuộc gọi; máy khác bỏ qua. Không cần bảng Supabase mới. */
const CALL = (() => {
  const RING_MS = 30000;
  const cfg = window.AVATAR_CONFIG || {};
  const ICE = cfg.iceServers || [{ urls: ['stun:stun.l.google.com:19302'] }];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const me = () => (CLOUD.user && CLOUD.user.id) || '';
  let cur = null; // { cid, peer:{uid,name,num,username}, dir:'out'|'in', state, pc, stream, audio, timer, startAt, muted, speaker, ice:[] }
  const send = (op, extra = {}) => { if (cur) NET.sendCall({ op, cid: cur.cid, to: cur.peer.uid, from: me(), ...extra }); };

  /* ---------- âm thanh: tút chờ, nhạc chuông ---------- */
  let ac = null, toneT = null;
  const actx = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); return ac; } catch (e) { return null; } };
  function beep(f, dur, vol = 0.05, at = 0) {
    if (AV.S && AV.S.settings && AV.S.settings.sfx === false && !(cur && cur.dir === 'in' && cur.state === 'incoming')) return;
    const a = actx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.frequency.value = f; g.gain.value = vol; o.connect(g); g.connect(a.destination);
    o.start(a.currentTime + at); g.gain.setValueAtTime(vol, a.currentTime + at + dur - 0.05); g.gain.linearRampToValueAtTime(0.0001, a.currentTime + at + dur); o.stop(a.currentTime + at + dur + 0.02);
  }
  /* 🎵 nhạc chuông cuộc gọi đến: bài YouTube (trình phát ẩn), lỗi thì dùng tiếng chuông tự tạo */
  const RING_YT = '02obsXXuwcY';
  let ytp = null, ytReady = false, ytWant = false, musicWas = false;
  function prepRing() {
    if (ytp) return;
    ytp = 'loading';
    const box = document.createElement('div'); box.className = 'ring-yt'; box.innerHTML = '<div id="ringYt"></div>'; document.body.appendChild(box);
    const make = () => { ytp = new window.YT.Player('ringYt', { width: 200, height: 200, videoId: RING_YT, playerVars: { playsinline: 1, controls: 0, loop: 1, playlist: RING_YT }, events: { onReady: () => { ytReady = true; if (ytWant) playRing(); } } }); };
    if (window.YT && window.YT.Player) make();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); make(); };
      if (!document.getElementById('ytApi')) { const sc = document.createElement('script'); sc.id = 'ytApi'; sc.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(sc); }
    }
  }
  ['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, prepRing, { once: true, passive: true }));
  function playRing() {
    ytWant = true;
    if (!ytReady) return;
    try { ytp.seekTo(0, true); ytp.unMute(); ytp.setVolume(100); ytp.playVideo(); } catch (e) { /* bỏ qua */ }
  }
  function stopRing() {
    ytWant = false;
    try { if (ytReady) ytp.pauseVideo(); } catch (e) { /* bỏ qua */ }
    if (musicWas && typeof MUSIC !== 'undefined') { MUSIC.setOn(true); musicWas = false; }
  }
  function tone(kind) {
    stopTone();
    if (kind === 'ring') {
      if (typeof MUSIC !== 'undefined' && MUSIC.on) { musicWas = true; MUSIC.setOn(false); }
      prepRing(); playRing();
      const vib = () => { if (navigator.vibrate) navigator.vibrate([300, 200, 300]); };
      vib(); toneT = setInterval(vib, 2000);
      // YouTube không phát được (chặn tự phát / mất mạng) → chuông tự tạo
      setTimeout(() => {
        let playing = false;
        try { playing = ytReady && ytp.getPlayerState() === 1; } catch (e) { /* bỏ qua */ }
        if (!playing && ytWant && toneT) {
          clearInterval(toneT);
          const bell = () => { [0, 0.18, 0.36, 0.54].forEach((t, i) => beep(i % 2 ? 1320 : 1046, 0.15, 0.07, t)); vib(); };
          bell(); toneT = setInterval(bell, 2000);
        }
      }, 2500);
      return;
    }
    const play = kind === 'ring' ? () => { [0, 0.18, 0.36, 0.54].forEach((t, i) => beep(i % 2 ? 1320 : 1046, 0.15, 0.07, t)); if (navigator.vibrate) navigator.vibrate([300, 200, 300]); } : () => beep(425, 1, 0.04);
    play(); toneT = setInterval(play, kind === 'ring' ? 2000 : 3000);
  }
  function stopTone() { clearInterval(toneT); toneT = null; if (navigator.vibrate) navigator.vibrate(0); if (ytWant || musicWas) stopRing(); }

  /* ---------- màn hình cuộc gọi ---------- */
  let ov = null;
  function show() {
    if (!cur) { if (ov) { ov.remove(); ov = null; } return; }
    if (!ov) { ov = document.createElement('div'); ov.className = 'call-ov'; document.body.appendChild(ov); }
    const p = cur.peer, st = cur.state;
    if (st === 'incoming') {
      ov.className = 'call-ov in';
      ov.innerHTML = `<div class="call-noti"><div class="cn-app"><span>📞</span><small>Gọi</small></div><div class="cn-body"><b>Cuộc gọi đến</b><span class="cn-who">${esc(p.name || PHONE.pretty(p.num))} · ${esc(PHONE.pretty(p.num))}</span>
        <div class="cn-btns"><button class="cn-ok" data-a="accept">📞 Trả lời</button><button class="cn-no" data-a="reject">Từ chối</button></div></div></div>`;
      ov.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => act(b.dataset.a));
      return;
    }
    ov.className = 'call-ov';
    const label = { calling: 'Đang gọi…', ringing: 'Đang đổ chuông…', incoming: 'Cuộc gọi đến', connecting: 'Đang kết nối…', talking: dur(), ended: cur.endMsg || 'Đã kết thúc' }[st] || '';
    ov.innerHTML = `<div class="call-box">
      <div class="call-top"><small>${cur.dir === 'in' ? '📲 Di động' : '📞 Đang gọi đi'}</small><div class="call-av">${esc((p.name || '?')[0].toUpperCase())}</div>
        <b>${esc(p.name || PHONE.pretty(p.num))}</b><small>${esc(PHONE.pretty(p.num))}</small><p class="call-st ${st === 'talking' ? 'on' : ''}">${esc(label)}</p></div>
      ${st === 'incoming' ? `<div class="call-btns two"><button class="call-b red" data-a="reject">📵<small>Từ chối</small></button><button class="call-b green" data-a="accept">📞<small>Nghe</small></button></div>`
        : st === 'ended' ? '' : `<div class="call-btns"><button class="call-b ${cur.muted ? 'on' : ''}" data-a="mute">${cur.muted ? '🔇' : '🎙️'}<small>${cur.muted ? 'Đã tắt mic' : 'Tắt mic'}</small></button><button class="call-b ${cur.speaker ? 'on' : ''}" data-a="spk">🔊<small>Loa ngoài</small></button><button class="call-b red" data-a="hang">📵<small>Kết thúc</small></button></div>`}
    </div>`;
    ov.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => act(b.dataset.a));
  }
  const dur = () => { const s = Math.max(0, Math.floor((Date.now() - (cur.startAt || Date.now())) / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  function act(a) {
    if (!cur) return;
    if (a === 'accept') return accept();
    if (a === 'reject') { send('reject'); return end('Đã từ chối', true); }
    if (a === 'hang') { send('end'); return end('Đã kết thúc', true); }
    if (a === 'mute') { cur.muted = !cur.muted; if (cur.stream) cur.stream.getAudioTracks().forEach((t) => { t.enabled = !cur.muted; }); show(); }
    if (a === 'spk') { cur.speaker = !cur.speaker; if (cur.audio) cur.audio.volume = cur.speaker ? 1 : 0.6; show(); }
  }

  /* ---------- gọi đi ---------- */
  /** peer = { uid, name, num, username }; onMissed() khi không ai nghe / máy tắt */
  function start(peer, onMissed) {
    if (cur) return UI.toast('📞 Bạn đang có cuộc gọi khác');
    if (!CLOUD.user) return UI.toast('🔐 Đăng nhập tài khoản để gọi điện');
    cur = { cid: Math.random().toString(36).slice(2, 10), peer, dir: 'out', state: 'calling', ice: [], speaker: true, onMissed };
    show(); tone('back');
    send('ring', { fromName: AV.S.name, fromNum: PHONE.myNum() });
    cur.timer = setTimeout(() => { if (cur && (cur.state === 'calling' || cur.state === 'ringing')) { send('cancel'); const cb = cur.onMissed; end('Không trả lời', true); if (cb) cb(); } }, RING_MS);
  }

  /* ---------- nghe máy ---------- */
  async function getMic() {
    try { return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (e) { UI.toast('🎙️ Cần cho phép dùng micro để nói chuyện (bấm 🔒 cạnh địa chỉ web → Micro → Cho phép)', 6000); return null; }
  }
  async function accept() {
    if (!cur || cur.state !== 'incoming') return;
    stopTone();
    cur.state = 'connecting'; show();
    cur.stream = await getMic();
    if (!cur) return;
    if (!cur.stream) { send('reject'); return end('Không có micro', true); }
    makePc();
    send('accept');
  }
  function makePc() {
    const pc = new RTCPeerConnection({ iceServers: ICE });
    cur.pc = pc;
    cur.stream.getAudioTracks().forEach((t) => pc.addTrack(t, cur.stream));
    pc.onicecandidate = (e) => { if (e.candidate) send('ice', { c: e.candidate.toJSON() }); };
    pc.ontrack = (e) => {
      if (!cur) return;
      cur.audio = cur.audio || new Audio();
      cur.audio.autoplay = true; cur.audio.playsInline = true;
      cur.audio.srcObject = e.streams[0] || new MediaStream([e.track]);
      cur.audio.volume = cur.speaker ? 1 : 0.6;
      cur.audio.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (!cur || cur.pc !== pc) return;
      const s = pc.connectionState;
      if (s === 'connected' && cur.state !== 'talking') { cur.state = 'talking'; cur.startAt = Date.now(); stopTone(); show(); AV.sayMine('📞 A lô~'); }
      if (s === 'failed') { send('end'); end('Mất kết nối — mạng hai bên chặn kết nối', true); }
    };
    return pc;
  }
  async function flushIce() { const l = cur.ice.splice(0); for (const c of l) { try { await cur.pc.addIceCandidate(c); } catch (e) { /* bỏ qua */ } } }

  /* ---------- kết thúc ---------- */
  function end(msg, quiet) {
    if (!cur) return;
    const c = cur;
    clearTimeout(c.timer); stopTone();
    try { if (c.pc) c.pc.close(); } catch (e) { /* bỏ qua */ }
    if (c.stream) c.stream.getTracks().forEach((t) => t.stop());
    if (c.audio) { c.audio.srcObject = null; }
    const talked = c.startAt ? dur() : '';
    c.state = 'ended'; c.endMsg = msg + (talked ? ` · ${talked}` : '');
    show();
    beep(480, 0.25, 0.05); beep(480, 0.25, 0.05, 0.35);
    setTimeout(() => { if (cur === c) { cur = null; show(); } }, 1600);
    if (!quiet) UI.toast('📵 ' + msg);
  }

  /* ---------- nhận tín hiệu ---------- */
  async function onSignal(m) {
    if (!m || m.to !== me() || !me()) return;
    const op = m.op;
    if (op === 'ring') {
      const ph = AV.S.phone;
      if (!ph || !ph.sim || ph.bat <= 0) return; // máy tắt / không SIM → bên gọi tự báo cuộc gọi nhỡ
      if (cur) { NET.sendCall({ op: 'busy', cid: m.cid, to: m.from, from: me() }); return; }
      const c = (ph.contacts || []).find((x) => x.num === m.fromNum);
      cur = { cid: m.cid, peer: { uid: m.from, num: String(m.fromNum || ''), name: c ? c.name : String(m.fromName || '').slice(0, 24) || PHONE.pretty(m.fromNum) }, dir: 'in', state: 'incoming', ice: [], speaker: true };
      NET.sendCall({ op: 'ringing', cid: m.cid, to: m.from, from: me() });
      show(); tone('ring');
      cur.timer = setTimeout(() => { if (cur && cur.state === 'incoming' && cur.cid === m.cid) end('Cuộc gọi nhỡ', true); }, RING_MS + 2000);
      return;
    }
    if (!cur || m.cid !== cur.cid || m.from !== cur.peer.uid) return;
    if (op === 'ringing' && cur.state === 'calling') { cur.state = 'ringing'; show(); }
    else if (op === 'busy') { const cb = cur.onMissed; end('Máy bận', true); if (cb) cb(); }
    else if (op === 'reject') end('Người nghe đã từ chối', true);
    else if (op === 'cancel') end('Cuộc gọi nhỡ', true);
    else if (op === 'end') end('Đối phương đã cúp máy');
    else if (op === 'accept' && cur.dir === 'out') {
      clearTimeout(cur.timer); stopTone();
      cur.state = 'connecting'; show();
      cur.stream = await getMic();
      if (!cur) return;
      if (!cur.stream) { send('end'); return end('Không có micro', true); }
      const pc = makePc();
      const o = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(o);
      send('offer', { sdp: pc.localDescription.sdp });
    } else if (op === 'offer' && cur.pc) {
      await cur.pc.setRemoteDescription({ type: 'offer', sdp: m.sdp });
      await flushIce();
      const a = await cur.pc.createAnswer();
      await cur.pc.setLocalDescription(a);
      send('answer', { sdp: cur.pc.localDescription.sdp });
    } else if (op === 'answer' && cur.pc) {
      await cur.pc.setRemoteDescription({ type: 'answer', sdp: m.sdp });
      await flushIce();
    } else if (op === 'ice' && m.c) {
      if (cur.pc && cur.pc.remoteDescription) { try { await cur.pc.addIceCandidate(m.c); } catch (e) { /* bỏ qua */ } } else cur.ice.push(m.c);
    }
  }

  /* đang gọi: pin tụt nhanh; hết pin tự cúp; đóng trang thì báo cúp */
  setInterval(() => {
    if (!cur || cur.state !== 'talking') return;
    const ph = AV.S.phone; if (!ph) return;
    ph.bat = Math.max(0, ph.bat - 1);
    if (ph.bat <= 0) { send('end'); end('Điện thoại hết pin'); }
    else if (ov) { const s = ov.querySelector('.call-st'); if (s) s.textContent = dur(); }
  }, 20000);
  setInterval(() => { if (cur && cur.state === 'talking' && ov) { const s = ov.querySelector('.call-st'); if (s) s.textContent = dur(); } }, 1000);
  window.addEventListener('pagehide', () => { if (cur) send('end'); });

  return { start, onSignal, busy: () => !!cur };
})();
