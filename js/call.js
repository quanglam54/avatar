/* 📞 GỌI THOẠI THẬT giữa 2 số SIM — chỉ 2 người nghe được nhau (WebRTC nối thẳng 2 máy, dùng TURN trong config.js).
 * Báo hiệu (đổ chuông / nghe / offer / answer / ICE / cúp máy) gửi qua kênh online chung của game (NET.sendCall),
 * mỗi tin ghi rõ người nhận (user id) + mã cuộc gọi; máy khác bỏ qua. Không cần bảng Supabase mới. */
const CALL = (() => {
  const RING_MS = 30000;
  const cfg = window.AVATAR_CONFIG || {};
  const ICE = cfg.iceServers || [{ urls: ['stun:stun.l.google.com:19302'] }];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const me = () => (CLOUD.user && CLOUD.user.id) || '';
  /* giao diện cuộc gọi tự kèm CSS → không phụ thuộc style.css (máy còn giữ bản cũ vẫn hiện đúng) */
  if (!document.getElementById('callCss')) { const st = document.createElement('style'); st.id = 'callCss'; st.textContent = "/* 📞 cuộc gọi thoại */\n.call-ov { position: fixed; inset: 0; z-index: 70; background: rgba(0,0,0,.45); display: grid; place-items: center; animation: phIn .25s ease-out; }\n.call-box { width: min(320px, 88vw); height: min(600px, 84vh); border-radius: 42px; padding: 40px 22px 34px; display: flex; flex-direction: column; justify-content: space-between;\n  background: linear-gradient(170deg, #3b4a6b, #10151f 70%); color: #fff; box-shadow: 0 0 0 10px #111, 0 20px 50px rgba(0,0,0,.6); font-family: \"Be Vietnam Pro\", system-ui; }\n.call-top { display: grid; justify-items: center; gap: 6px; text-align: center; }\n.call-top small { opacity: .75; }\n.call-av { width: 104px; height: 104px; border-radius: 50%; background: linear-gradient(#adb5bd, #6c757d); display: grid; place-items: center; font-size: 48px; font-weight: 900; margin: 18px 0 6px; }\n.call-top b { font-size: 26px; }\n.call-st { margin: 6px 0 0; opacity: .85; min-height: 22px; }\n.call-st.on { font-variant-numeric: tabular-nums; color: #8ce99a; font-weight: 800; font-size: 18px; }\n.call-btns { display: flex; justify-content: space-around; }\n.call-btns.two { justify-content: space-between; padding: 0 12px; }\n.call-b { width: 70px; height: 70px; border-radius: 50%; border: 0; background: rgba(255,255,255,.18); color: #fff; font-size: 26px; display: grid; place-items: center; cursor: pointer; position: relative; }\n.call-b small { position: absolute; bottom: -22px; font-size: 11px; white-space: nowrap; }\n.call-b.on { background: #fff; }\n.call-b.red { background: #ff3b30; } .call-b.green { background: #34c759; animation: evPulse 1s infinite; }\n/* 📲 cuộc gọi đến (thông báo trên cùng) */\n.call-ov.in { background: transparent; place-items: start center; pointer-events: none; padding-top: max(10px, env(safe-area-inset-top, 0px)); }\n.call-noti { pointer-events: auto; display: flex; gap: 14px; align-items: center; width: min(560px, 94vw); background: #4a62d8; color: #fff; border-radius: 22px; padding: 12px 16px; box-shadow: 0 10px 30px rgba(0,0,0,.35); animation: cnIn .35s cubic-bezier(.2,1.4,.4,1); font-family: \"Be Vietnam Pro\", system-ui; }\n@keyframes cnIn { from { transform: translateY(-120%); } }\n.cn-app { flex: none; width: 74px; height: 74px; border-radius: 18px; background: #fff; color: #1e5bff; display: grid; place-items: center; align-content: center; animation: evPulse 1s infinite; }\n.cn-app span { font-size: 30px; line-height: 1; }\n.cn-app small { font-weight: 900; font-size: 14px; }\n.cn-body { flex: 1; min-width: 0; display: grid; gap: 4px; }\n.cn-body b { font-size: 20px; }\n.cn-who { font-weight: 700; font-size: 14px; opacity: .92; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.cn-btns { display: flex; gap: 10px; margin-top: 4px; }\n.cn-btns button { flex: 1; border: 0; border-radius: 10px; padding: 9px 6px; font: 800 16px \"Be Vietnam Pro\", system-ui; color: #fff; cursor: pointer; }\n.cn-ok { background: #3cb54a; } .cn-no { background: #e2546a; }\n.ring-yt { position: fixed; left: -9999px; top: 0; width: 200px; height: 200px; overflow: hidden; pointer-events: none; }\n\n/* 📱 điện thoại: xếp tầng tên khu → mùa → dải sự kiện → chip sự kiện, không đè nhau */\n@media (max-width: 600px) {\n  .season-chip { top: 136px; }\n  .tr-banner { top: 162px; }\n  .ev-chips { top: 194px; }\n}"; document.head.appendChild(st); }
  if (!document.getElementById('callCssV')) { const st = document.createElement('style'); st.id = 'callCssV'; st.textContent = `
.cv-box { position: relative; overflow: hidden; padding: 0 !important; background: #0b1020 !important; justify-content: flex-end !important; }
.cv-remote { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; background: #000; }
.cv-fallback { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 8px; color: #fff; }
.cv-local { position: absolute; right: 12px; top: 12px; width: 32%; aspect-ratio: 3/4; object-fit: cover; border-radius: 14px; border: 2px solid #fff; background: #222; z-index: 2; box-shadow: 0 4px 12px rgba(0,0,0,.4); }
.cv-local.mirror { transform: scaleX(-1); }
.cv-top { position: absolute; left: 14px; top: 14px; z-index: 2; color: #fff; text-shadow: 0 1px 4px #000; display: grid; max-width: 55%; }
.cv-top b { font-size: 20px; }
.cv-btns { position: relative; z-index: 2; padding: 14px 6px 30px; background: linear-gradient(transparent, rgba(0,0,0,.65)); }
.cv-btns .call-b { width: 58px; height: 58px; font-size: 22px; }
.cn-voice { background: #4dabf7 !important; }
`; document.head.appendChild(st); }
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
      ov.innerHTML = cur.video
        ? `<div class="call-noti"><div class="cn-app"><span>📹</span><small>Video</small></div><div class="cn-body"><b>Cuộc gọi video đến</b><span class="cn-who">${esc(p.name || PHONE.pretty(p.num))} · ${esc(PHONE.pretty(p.num))}</span>
          <div class="cn-btns"><button class="cn-ok" data-a="acceptv">📹 Trả lời</button><button class="cn-ok cn-voice" data-a="accept">📞 Chỉ tiếng</button><button class="cn-no" data-a="reject">Từ chối</button></div></div></div>`
        : `<div class="call-noti"><div class="cn-app"><span>📞</span><small>Gọi</small></div><div class="cn-body"><b>Cuộc gọi đến</b><span class="cn-who">${esc(p.name || PHONE.pretty(p.num))} · ${esc(PHONE.pretty(p.num))}</span>
          <div class="cn-btns"><button class="cn-ok" data-a="accept">📞 Trả lời</button><button class="cn-no" data-a="reject">Từ chối</button></div></div></div>`;
      ov.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => act(b.dataset.a));
      return;
    }
    ov.className = 'call-ov';
    if (cur.video && st !== 'ended') return showVideo();
    const label = { calling: 'Đang gọi…', ringing: 'Đang đổ chuông…', incoming: 'Cuộc gọi đến', connecting: 'Đang kết nối…', talking: dur(), ended: cur.endMsg || 'Đã kết thúc' }[st] || '';
    ov.innerHTML = `<div class="call-box">
      <div class="call-top"><small>${cur.dir === 'in' ? '📲 Di động' : '📞 Đang gọi đi'}</small><div class="call-av">${esc((p.name || '?')[0].toUpperCase())}</div>
        <b>${esc(p.name || PHONE.pretty(p.num))}</b><small>${esc(PHONE.pretty(p.num))}</small><p class="call-st ${st === 'talking' ? 'on' : ''}">${esc(label)}</p></div>
      ${st === 'incoming' ? `<div class="call-btns two"><button class="call-b red" data-a="reject">📵<small>Từ chối</small></button><button class="call-b green" data-a="accept">📞<small>Nghe</small></button></div>`
        : st === 'ended' ? '' : `<div class="call-btns"><button class="call-b ${cur.muted ? 'on' : ''}" data-a="mute">${cur.muted ? '🔇' : '🎙️'}<small>${cur.muted ? 'Đã tắt mic' : 'Tắt mic'}</small></button><button class="call-b ${cur.speaker ? 'on' : ''}" data-a="spk">🔊<small>Loa ngoài</small></button><button class="call-b red" data-a="hang">📵<small>Kết thúc</small></button></div>`}
    </div>`;
    ov.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => act(b.dataset.a));
  }
  /** màn gọi video: mặt người kia to cả khung, mặt mình ô nhỏ góc trên */
  function showVideo() {
    const p = cur.peer, st = cur.state, remoteOn = !!(cur.remote && cur.remote.getVideoTracks().length && !cur.remoteCamOff);
    const label = { calling: 'Đang gọi video…', ringing: 'Đang đổ chuông…', connecting: 'Đang kết nối…', talking: dur() }[st] || '';
    const camOn = !!(cur.stream && cur.stream.getVideoTracks().length && !cur.camOff);
    if (!ov.querySelector('.cv-box')) {
      ov.innerHTML = `<div class="call-box cv-box"><video class="cv-remote" autoplay playsinline></video><div class="cv-fallback"></div>
        <video class="cv-local" autoplay playsinline muted></video><div class="cv-top"><b></b><small class="call-st"></small></div><div class="call-btns cv-btns"></div></div>`;
    }
    const rv = ov.querySelector('.cv-remote'), lv = ov.querySelector('.cv-local');
    if (cur.remote && rv.srcObject !== cur.remote) { rv.srcObject = cur.remote; rv.play().catch(() => {}); }
    if (cur.stream && lv.srcObject !== cur.stream) { lv.srcObject = cur.stream; lv.play().catch(() => {}); }
    rv.style.display = remoteOn ? '' : 'none';
    lv.style.display = camOn ? '' : 'none';
    lv.classList.toggle('mirror', cur.facing !== 'environment');
    ov.querySelector('.cv-fallback').innerHTML = remoteOn ? '' : `<div class="call-av">${esc((p.name || '?')[0].toUpperCase())}</div><small>${cur.remoteCamOff ? '📷 Đã tắt camera' : st === 'talking' ? '📷 Không có hình' : ''}</small>`;
    ov.querySelector('.cv-top b').textContent = p.name || PHONE.pretty(p.num);
    const stEl = ov.querySelector('.call-st'); stEl.textContent = label; stEl.classList.toggle('on', st === 'talking');
    ov.querySelector('.cv-btns').innerHTML = `<button class="call-b ${cur.muted ? 'on' : ''}" data-a="mute">${cur.muted ? '🔇' : '🎙️'}<small>Mic</small></button>
      <button class="call-b ${camOn ? '' : 'on'}" data-a="cam">${camOn ? '📷' : '🚫'}<small>Camera</small></button>
      <button class="call-b" data-a="flip">🔄<small>Đổi cam</small></button>
      <button class="call-b red" data-a="hang">📵<small>Kết thúc</small></button>`;
    ov.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => act(b.dataset.a));
  }
  const dur = () => { const s = Math.max(0, Math.floor((Date.now() - (cur.startAt || Date.now())) / 1000)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  function act(a) {
    if (!cur) return;
    if (a === 'accept') return accept(false);
    if (a === 'acceptv') return accept(true);
    if (a === 'cam') {
      const vt = cur.stream && cur.stream.getVideoTracks()[0];
      if (!vt) return UI.toast('📷 Máy này không có camera');
      cur.camOff = !cur.camOff; vt.enabled = !cur.camOff; send('cam', { off: cur.camOff ? 1 : 0 }); show(); return;
    }
    if (a === 'flip') return flipCam();
    if (a === 'reject') { send('reject'); return end('Đã từ chối', true); }
    if (a === 'hang') { send('end'); return end('Đã kết thúc', true); }
    if (a === 'mute') { cur.muted = !cur.muted; if (cur.stream) cur.stream.getAudioTracks().forEach((t) => { t.enabled = !cur.muted; }); show(); }
    if (a === 'spk') { cur.speaker = !cur.speaker; if (cur.audio) cur.audio.volume = cur.speaker ? 1 : 0.6; show(); }
  }

  /* ---------- gọi đi ---------- */
  /** peer = { uid, name, num, username }; onMissed() khi không ai nghe / máy tắt */
  function start(peer, onMissed, video) {
    if (cur) return UI.toast('📞 Bạn đang có cuộc gọi khác');
    if (!CLOUD.user) return UI.toast('🔐 Đăng nhập tài khoản để gọi điện');
    cur = { cid: Math.random().toString(36).slice(2, 10), peer, dir: 'out', state: 'calling', ice: [], speaker: true, onMissed, video: !!video, facing: 'user' };
    if (video) getMedia(true).then((st) => { if (cur && !cur.stream && st) { cur.stream = st; show(); } else if (st && cur && cur.stream !== st) st.getTracks().forEach((t) => t.stop()); });
    show(); tone('back');
    send('ring', { fromName: AV.S.name, fromNum: PHONE.myNum(), video: video ? 1 : 0 });
    cur.timer = setTimeout(() => { if (cur && (cur.state === 'calling' || cur.state === 'ringing')) { send('cancel'); const cb = cur.onMissed; end('Không trả lời', true); if (cb) cb(); } }, RING_MS);
  }

  /* ---------- nghe máy ---------- */
  /** video = true: lấy cả camera; không có camera / bị từ chối thì chỉ lấy mic */
  async function getMedia(video) {
    if (!video) return getMic();
    try { return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: { facingMode: cur ? cur.facing || 'user' : 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } } }); }
    catch (e) { UI.toast('📷 Không mở được camera (chưa cho phép hoặc máy không có) — gọi bằng tiếng nhé', 5000); return getMic(); }
  }
  async function flipCam() {
    if (!cur || !cur.stream || !cur.stream.getVideoTracks().length) return;
    cur.facing = cur.facing === 'environment' ? 'user' : 'environment';
    try {
      const ns = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cur.facing, width: { ideal: 640 }, height: { ideal: 480 } } });
      const nt = ns.getVideoTracks()[0], old = cur.stream.getVideoTracks()[0];
      const sender = cur.pc && cur.pc.getSenders().find((x) => x.track && x.track.kind === 'video');
      if (sender) await sender.replaceTrack(nt);
      cur.stream.removeTrack(old); old.stop(); cur.stream.addTrack(nt); nt.enabled = !cur.camOff;
      const lv = ov && ov.querySelector('.cv-local'); if (lv) { lv.srcObject = null; lv.srcObject = cur.stream; }
      show();
    } catch (e) { cur.facing = cur.facing === 'environment' ? 'user' : 'environment'; UI.toast('🔄 Máy chỉ có 1 camera'); }
  }
  async function getMic() {
    try { return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); }
    catch (e) { UI.toast('🎙️ Cần cho phép dùng micro để nói chuyện (bấm 🔒 cạnh địa chỉ web → Micro → Cho phép)', 6000); return null; }
  }
  async function accept(withVideo) {
    if (!cur || cur.state !== 'incoming') return;
    stopTone();
    cur.state = 'connecting'; show();
    cur.stream = await getMedia(cur.video && withVideo);
    if (cur && cur.video && !withVideo) send('cam', { off: 1 });
    if (!cur) return;
    if (!cur.stream) { send('reject'); return end('Không có micro', true); }
    makePc();
    send('accept');
  }
  function makePc() {
    const pc = new RTCPeerConnection({ iceServers: ICE });
    cur.pc = pc;
    cur.stream.getTracks().forEach((t) => pc.addTrack(t, cur.stream));
    // cuộc gọi video mà máy mình không có camera: vẫn nhận hình bên kia
    if (cur.video && !cur.stream.getVideoTracks().length) pc.addTransceiver('video', { direction: 'recvonly' });
    pc.onicecandidate = (e) => { if (e.candidate) send('ice', { c: e.candidate.toJSON() }); };
    pc.ontrack = (e) => {
      if (!cur) return;
      if (e.track.kind === 'video') {
        cur.remote = cur.remote || new MediaStream();
        cur.remote.addTrack(e.track);
        e.track.onunmute = () => show();
        show();
        return;
      }
      cur.audio = cur.audio || new Audio();
      cur.audio.autoplay = true; cur.audio.playsInline = true;
      cur.audio.srcObject = e.streams[0] || new MediaStream([e.track]);
      cur.audio.volume = cur.speaker ? 1 : 0.6;
      cur.audio.play().catch(() => {});
    };
    pc.onconnectionstatechange = () => {
      if (!cur || cur.pc !== pc) return;
      const s = pc.connectionState;
      if (s === 'connected' && cur.state !== 'talking') { cur.state = 'talking'; cur.startAt = Date.now(); stopTone(); show(); AV.sayMine(cur.video ? '📹 Hi~ thấy mình không?' : '📞 A lô~'); }
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
    if (ov) ov.querySelectorAll('video').forEach((v) => { v.srcObject = null; });
    c.video = false;
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
      cur = { cid: m.cid, peer: { uid: m.from, num: String(m.fromNum || ''), name: c ? c.name : String(m.fromName || '').slice(0, 24) || PHONE.pretty(m.fromNum) }, dir: 'in', state: 'incoming', ice: [], speaker: true, video: !!m.video, facing: 'user' };
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
    else if (op === 'cam') { cur.remoteCamOff = !!m.off; show(); }
    else if (op === 'accept' && cur.dir === 'out') {
      clearTimeout(cur.timer); stopTone();
      cur.state = 'connecting'; show();
      if (!cur.stream) cur.stream = await getMedia(cur.video);
      if (!cur) return;
      if (!cur.stream) { send('end'); return end('Không có micro', true); }
      const pc = makePc();
      const o = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: !!cur.video });
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
    ph.bat = Math.max(0, ph.bat - (cur.video ? 2 : 1));
    if (ph.bat <= 0) { send('end'); end('Điện thoại hết pin'); }
    else if (ov) { const s = ov.querySelector('.call-st'); if (s) s.textContent = dur(); }
  }, 20000);
  setInterval(() => { if (cur && cur.state === 'talking' && ov) { const s = ov.querySelector('.call-st'); if (s) s.textContent = dur(); } }, 1000);
  window.addEventListener('pagehide', () => { if (cur) send('end'); });

  return { start, onSignal, busy: () => !!cur };
})();
