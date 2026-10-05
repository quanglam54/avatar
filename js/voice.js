/* Nói chuyện bằng giọng nói với người cùng khu (WebRTC, nối thẳng giữa các máy).
 * Báo hiệu kết nối (offer / answer / ICE) gửi qua kênh Realtime của khu. Bật mic thì mọi người trong khu nghe được,
 * ai đứng gần nghe to hơn. Tối đa 8 người nối cùng lúc để máy không nặng.
 * Khác mạng (4G ↔ wifi) thường cần máy chủ chuyển tiếp TURN: điền vào js/config.js (iceServers hoặc turnApiUrl). */
const VOICE = (() => {
  const MAX_PEERS = 8;
  const cfg = window.AVATAR_CONFIG || {};
  let ICE = cfg.iceServers || [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  const peers = new Map(); // id → { pc, audio, gain, analyser, level, state, pendingIce }
  const earlyIce = new Map(); // ICE tới trước cả lời mời
  const warned = new Set();
  let stream = null, micOn = false, beat = 0, ctx = null, myAnalyser = null, iceLoaded = !cfg.turnApiUrl;
  const $ = (s) => document.querySelector(s);

  const send = (p) => NET.sendVoice(p);
  const nameOf = (id) => { const r = NET.remotes.get(id); return r ? r.name : 'người chơi'; };
  const audioCtx = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } } return ctx; };
  /** Điện thoại chỉ cho phát tiếng sau khi người chơi chạm: mở khoá bộ âm thanh ở mỗi lần chạm */
  const unlock = () => { const ac = audioCtx(); if (ac && ac.state === 'suspended') ac.resume().catch(() => {}); peers.forEach((p) => { if (p.audio && p.audio.paused) p.audio.play().catch(() => {}); }); };

  /** Lấy danh sách máy chủ TURN (nếu chủ game cấu hình turnApiUrl, vd Metered.ca) */
  async function loadIce() {
    if (iceLoaded) return;
    iceLoaded = true;
    try {
      const r = await fetch(cfg.turnApiUrl);
      const list = await r.json();
      if (Array.isArray(list) && list.length) ICE = [...ICE, ...list];
    } catch (e) { /* dùng STUN mặc định */ }
  }

  function meter(src) {
    const ac = audioCtx();
    if (!ac) return null;
    const an = ac.createAnalyser();
    an.fftSize = 256;
    src.connect(an);
    return an;
  }
  function levelOf(an) {
    if (!an) return 0;
    const buf = new Uint8Array(an.fftSize);
    an.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
    return Math.sqrt(sum / buf.length);
  }

  /** offerer = mình gửi lời mời (tự tạo kênh tiếng); bên trả lời dùng kênh có sẵn trong lời mời */
  function makePeer(id, offerer) {
    if (peers.has(id)) return peers.get(id);
    if (peers.size >= MAX_PEERS) return null;
    const pc = new RTCPeerConnection({ iceServers: ICE });
    const p = { pc, id, audio: null, gain: null, analyser: null, level: 0, state: 'đang nối', made: Date.now(), pendingIce: earlyIce.get(id) || [], tries: 0 };
    earlyIce.delete(id);
    peers.set(id, p);
    pc.onicecandidate = (e) => { if (e.candidate) send({ to: id, op: 'ice', c: e.candidate.toJSON() }); };
    pc.ontrack = (e) => {
      const s = e.streams[0] || new MediaStream([e.track]);
      // phần tử audio (tắt tiếng) giữ luồng chạy; tiếng thật phát qua bộ âm thanh đã mở khoá → không bị chặn tự phát
      if (!p.audio) { p.audio = new Audio(); p.audio.playsInline = true; p.audio.autoplay = true; }
      p.audio.srcObject = s;
      const ac = audioCtx();
      if (ac) {
        try {
          p.audio.muted = true;
          const src = ac.createMediaStreamSource(s);
          p.gain = ac.createGain();
          src.connect(p.gain); p.gain.connect(ac.destination);
          p.analyser = meter(src);
        } catch (err) { p.audio.muted = false; p.gain = null; }
      }
      p.audio.play().catch(() => {});
      unlock();
    };
    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      p.state = { connected: 'đã nối', connecting: 'đang nối', new: 'đang nối', failed: 'không nối được', disconnected: 'rớt mạng', closed: 'đã ngắt' }[st] || st;
      renderPanel();
      if (st === 'failed') {
        if (!warned.has(id)) {
          warned.add(id);
          UI.toast(`🎙️ Chưa nối được giọng nói với ${nameOf(id)} — mạng hai bên chặn kết nối trực tiếp, đang thử lại…`, 5000);
        }
        retry(id, p.tries + 1);
      }
      if (st === 'connected') { warned.delete(id); UI.toast(`🔊 Đã nối giọng nói với ${nameOf(id)}`); }
    };
    if (offerer) {
      p.tx = pc.addTransceiver('audio', { direction: 'sendrecv' });
      if (stream) p.tx.sender.replaceTrack(stream.getAudioTracks()[0]);
    }
    return p;
  }

  function drop(id) {
    const p = peers.get(id);
    if (!p) return;
    peers.delete(id);
    try { p.pc.close(); } catch (e) { /* bỏ qua */ }
    if (p.audio) p.audio.srcObject = null;
    if (p.gain) try { p.gain.disconnect(); } catch (e) { /* bỏ qua */ }
    renderPanel();
  }

  /** Rớt / không nối được: ngắt rồi thử lại (bên có mã nhỏ hơn mời lại), tối đa 3 lần */
  function retry(id, tries) {
    drop(id);
    if (tries > 3 || !NET.remotes.get(id)) return;
    setTimeout(() => {
      if (peers.has(id) || !NET.remotes.get(id)) return;
      if (NET.pid < id) offerTo(id, tries); else send({ to: id, op: 'on' });
    }, 1500 + tries * 1500);
  }

  async function flushIce(p) {
    const list = p.pendingIce.splice(0);
    for (const c of list) { try { await p.pc.addIceCandidate(c); } catch (e) { /* bỏ qua */ } }
  }

  async function offerTo(id, tries = 0) {
    await loadIce();
    const p = makePeer(id, true);
    if (!p) return;
    p.tries = tries;
    try {
      const o = await p.pc.createOffer();
      await p.pc.setLocalDescription(o);
      send({ to: id, op: 'offer', sdp: p.pc.localDescription.sdp });
    } catch (e) { drop(id); }
  }

  async function onNet(m) {
    if (m.to && m.to !== NET.pid) return;
    const id = m.id;
    if (m.op === 'on') {
      // ai đó bật mic: nối tới họ (nếu chưa nối). Bên có mã nhỏ hơn chủ động mời để tránh hai bên cùng mời
      if (!peers.has(id)) {
        if (NET.pid < id || !micOn) offerTo(id); else send({ to: id, op: 'on' });
      }
    } else if (m.op === 'offer') {
      await loadIce();
      let p = peers.get(id);
      if (p && p.pc.signalingState !== 'stable') {
        if (NET.pid < id) return; // mình đã mời trước, đợi họ trả lời
        const keep = p.pendingIce;
        drop(id); p = null;
        earlyIce.set(id, keep);
      } else if (p && p.pc.signalingState === 'stable' && p.pc.remoteDescription) {
        // đã nối rồi mà họ mời lại (họ vừa vào lại): nối mới
        drop(id); p = null;
      }
      p = p || makePeer(id, false);
      if (!p) return;
      try {
        await p.pc.setRemoteDescription({ type: 'offer', sdp: m.sdp });
        await flushIce(p);
        const tx = p.pc.getTransceivers().find((t) => t.mid !== null) || p.pc.getTransceivers()[0];
        if (tx) { tx.direction = 'sendrecv'; if (stream) tx.sender.replaceTrack(stream.getAudioTracks()[0]); p.tx = tx; }
        const ans = await p.pc.createAnswer();
        await p.pc.setLocalDescription(ans);
        send({ to: id, op: 'answer', sdp: p.pc.localDescription.sdp });
      } catch (e) { drop(id); }
    } else if (m.op === 'answer') {
      const p = peers.get(id);
      if (p && p.pc.signalingState === 'have-local-offer') {
        try { await p.pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }); await flushIce(p); } catch (e) { drop(id); }
      }
    } else if (m.op === 'ice') {
      if (!m.c) return;
      const p = peers.get(id);
      // chưa có lời mời / chưa nhận mô tả của bên kia: giữ lại, nhận xong mới thêm
      if (!p) { const q = earlyIce.get(id) || []; q.push(m.c); earlyIce.set(id, q.slice(-40)); return; }
      if (!p.pc.remoteDescription) { p.pendingIce.push(m.c); return; }
      try { await p.pc.addIceCandidate(m.c); } catch (e) { /* bỏ qua */ }
    }
  }

  async function setMic(on) {
    if (on === micOn) return;
    unlock();
    if (on) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return UI.toast('Trình duyệt này không hỗ trợ mic 😢');
      if (NET.mode === 'offline') return UI.toast('Cần kết nối online để nói chuyện');
      try {
        stream = stream || await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      } catch (e) {
        return UI.toast('🎤 Chưa được cho phép dùng mic — bấm "Cho phép" khi trình duyệt hỏi nhé (vào cài đặt trang web nếu lỡ chặn)', 5000);
      }
      await loadIce();
      micOn = true;
      stream.getAudioTracks().forEach((t) => { t.enabled = true; });
      const ac = audioCtx();
      if (ac && !myAnalyser) { try { myAnalyser = meter(ac.createMediaStreamSource(stream)); } catch (e) { /* bỏ qua */ } }
      peers.forEach((p) => { if (p.tx) p.tx.sender.replaceTrack(stream.getAudioTracks()[0]).catch(() => {}); });
      send({ op: 'on' });
      UI.toast(NET.players().length ? '🎤 Đã bật mic — đang nối giọng nói với mọi người trong khu…' : '🎤 Đã bật mic — chưa có ai trong khu này', 3500);
    } else {
      micOn = false;
      if (stream) stream.getAudioTracks().forEach((t) => { t.enabled = false; });
      send({ op: 'off' });
      UI.toast('🔇 Đã tắt mic (vẫn nghe được người khác)');
    }
    updateBtn();
    renderPanel();
  }

  function updateBtn() {
    const b = $('#btnMic');
    if (!b) return;
    b.classList.toggle('mic-on', micOn);
    b.textContent = micOn ? '🎤' : '🎙️';
    b.title = micOn ? 'Đang bật mic — bấm để xem / tắt' : 'Bật mic để nói chuyện';
  }

  /** Bảng trạng thái giọng nói: nối được với ai, ai đang nói */
  let panelRef = null;
  function openPanel() {
    panelRef = UI.panel('🎙️ Nói chuyện bằng giọng nói', '', { onClose: () => { panelRef = null; } });
    renderPanel();
  }
  function renderPanel() {
    if (!panelRef || !panelRef.el.isConnected) return;
    const others = NET.players();
    const rows = others.map((r) => {
      const p = peers.get(r.id);
      const st = p ? p.state : 'chưa nối';
      const ic = st === 'đã nối' ? (talking(r.id) ? '🔊' : '🟢') : st === 'không nối được' ? '🔴' : '🟡';
      return `<div class="shop-row"><span class="ic">${ic}</span><div class="info"><b>${String(r.name).replace(/[<>&]/g, '')}</b><small>${st}</small></div></div>`;
    }).join('');
    panelRef.body.innerHTML = `
      <p class="muted">${micOn ? '🎤 Mic đang <b>bật</b> — mọi người trong khu nghe được bạn.' : '🔇 Mic đang tắt — bạn vẫn nghe được người đang bật mic.'}</p>
      <div class="shop-list">${rows || '<p class="muted">Chưa có ai trong khu này.</p>'}</div>
      <p class="muted small-note">🟢 đã nối · 🟡 đang nối · 🔴 không nối được. Nếu luôn 🔴: hai mạng khác nhau (4G ↔ wifi) chặn kết nối trực tiếp — chủ game cần thêm máy chủ TURN trong js/config.js.</p>
      <div class="row-end"><button class="btn ${micOn ? 'ghost' : ''}" data-mic>${micOn ? '🔇 Tắt mic' : '🎤 Bật mic'}</button></div>`;
    panelRef.body.querySelector('[data-mic]').onclick = () => setMic(!micOn);
  }

  /** Đổi khu: ngắt hết kết nối cũ, sang khu mới thì báo lại nếu đang bật mic */
  function onRoomChange() {
    [...peers.keys()].forEach(drop);
    earlyIce.clear();
    if (micOn) setTimeout(() => send({ op: 'on' }), 1200);
  }

  /** Mỗi nhịp: âm lượng theo khoảng cách, đo ai đang nói, nhắc lại "đang bật mic" cho người mới tới */
  let uiBeat = 0;
  function tick(dt, me) {
    beat += dt; uiBeat += dt;
    if (micOn && beat > 8) { beat = 0; send({ op: 'on' }); }
    for (const [id, p] of peers) {
      const r = NET.remotes.get(id);
      if (!r) { if (Date.now() - p.made > 15000) drop(id); continue; }
      const d = Math.hypot(r.rx - me.x, r.ry - me.y), vol = Math.max(0.2, Math.min(1, 1.2 - d / 1400));
      if (p.gain) p.gain.gain.value = vol * 1.4;
      else if (p.audio) p.audio.volume = vol;
      p.level = levelOf(p.analyser);
    }
    if (uiBeat > 1) { uiBeat = 0; renderPanel(); }
  }

  /** Ai đang nói (để vẽ biểu tượng 🔊 trên đầu) */
  const talking = (id) => { const p = peers.get(id); return !!p && p.level > 0.03; };
  const meTalking = () => micOn && levelOf(myAnalyser) > 0.03;

  function init() {
    const b = $('#btnMic');
    if (b) b.onclick = () => (micOn ? openPanel() : setMic(true));
    ['pointerdown', 'touchend', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
    updateBtn();
  }

  return { init, onNet, setMic, tick, onRoomChange, drop, talking, meTalking, openPanel, get on() { return micOn; }, get peers() { return peers; } };
})();
