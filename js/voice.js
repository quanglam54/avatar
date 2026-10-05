/* Nói chuyện bằng giọng nói với người cùng khu (WebRTC, nối thẳng giữa các máy).
 * Báo hiệu kết nối (offer / answer / ICE) gửi qua kênh Realtime của khu. Bật mic thì mọi người trong khu nghe được,
 * ai đứng gần nghe to hơn. Tối đa 8 người nối cùng lúc để máy không nặng. */
const VOICE = (() => {
  const MAX_PEERS = 8;
  const cfg = window.AVATAR_CONFIG || {};
  const ICE = cfg.iceServers || [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  const peers = new Map(); // id → { pc, audio, analyser, level, gain }
  let stream = null, micOn = false, beat = 0, ctx = null, myAnalyser = null;
  const $ = (s) => document.querySelector(s);

  const send = (p) => NET.sendVoice(p);
  const audioCtx = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } } return ctx; };

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
    const p = { pc, audio: null, analyser: null, level: 0, id, made: Date.now() };
    peers.set(id, p);
    const track = stream ? stream.getAudioTracks()[0] : null;
    pc.onicecandidate = (e) => { if (e.candidate) send({ to: id, op: 'ice', c: e.candidate.toJSON() }); };
    pc.ontrack = (e) => {
      const s = e.streams[0] || new MediaStream([e.track]);
      if (!p.audio) { p.audio = new Audio(); p.audio.autoplay = true; p.audio.playsInline = true; }
      p.audio.srcObject = s;
      p.audio.play().catch(() => {});
      const ac = audioCtx();
      if (ac) { try { p.analyser = meter(ac.createMediaStreamSource(s)); } catch (err) { /* bỏ qua */ } }
    };
    pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) drop(id); };
    if (offerer) {
      p.tx = pc.addTransceiver('audio', { direction: 'sendrecv' });
      if (track) p.tx.sender.replaceTrack(track);
    }
    return p;
  }

  function drop(id) {
    const p = peers.get(id);
    if (!p) return;
    peers.delete(id);
    try { p.pc.close(); } catch (e) { /* bỏ qua */ }
    if (p.audio) { p.audio.srcObject = null; }
  }

  async function offerTo(id) {
    const p = makePeer(id, true);
    if (!p) return;
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
      // ai đó bật mic: nối tới họ (nếu chưa nối). Bên có mã nhỏ hơn chủ động gửi lời mời để tránh hai bên cùng mời
      if (!peers.has(id)) {
        if (NET.pid < id || !micOn) offerTo(id); else send({ to: id, op: 'on' });
      }
    } else if (m.op === 'offer') {
      let p = peers.get(id);
      if (p && p.pc.signalingState !== 'stable') {
        if (NET.pid < id) return; // mình đã mời trước, đợi họ trả lời
        drop(id); p = null;
      }
      p = p || makePeer(id, false);
      if (!p) return;
      try {
        await p.pc.setRemoteDescription({ type: 'offer', sdp: m.sdp });
        const tx = p.pc.getTransceivers().find((t) => t.mid !== null) || p.pc.getTransceivers()[0];
        if (tx) { tx.direction = 'sendrecv'; if (stream) tx.sender.replaceTrack(stream.getAudioTracks()[0]); p.tx = tx; }
        const ans = await p.pc.createAnswer();
        await p.pc.setLocalDescription(ans);
        send({ to: id, op: 'answer', sdp: p.pc.localDescription.sdp });
      } catch (e) { drop(id); }
    } else if (m.op === 'answer') {
      const p = peers.get(id);
      if (p && p.pc.signalingState === 'have-local-offer') { try { await p.pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }); } catch (e) { drop(id); } }
    } else if (m.op === 'ice') {
      const p = peers.get(id);
      if (p && m.c) { try { await p.pc.addIceCandidate(m.c); } catch (e) { /* bỏ qua */ } }
    } else if (m.op === 'off') {
      // tắt mic: vẫn giữ kết nối để nghe người kia, chỉ không gửi tiếng
    }
  }

  async function setMic(on) {
    if (on === micOn) return;
    if (on) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return UI.toast('Trình duyệt này không hỗ trợ mic 😢');
      if (NET.mode === 'offline') return UI.toast('Cần kết nối online để nói chuyện');
      try {
        stream = stream || await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      } catch (e) {
        return UI.toast('🎤 Chưa được cho phép dùng mic — bấm "Cho phép" khi trình duyệt hỏi nhé', 4500);
      }
      micOn = true;
      stream.getAudioTracks().forEach((t) => { t.enabled = true; });
      const ac = audioCtx();
      if (ac && ac.state === 'suspended') ac.resume();
      if (ac && !myAnalyser) { try { myAnalyser = meter(ac.createMediaStreamSource(stream)); } catch (e) { /* bỏ qua */ } }
      peers.forEach((p) => { if (p.tx) p.tx.sender.replaceTrack(stream.getAudioTracks()[0]).catch(() => {}); });
      send({ op: 'on' });
      UI.toast('🎤 Đã bật mic — mọi người trong khu nghe được bạn nói');
    } else {
      micOn = false;
      if (stream) stream.getAudioTracks().forEach((t) => { t.enabled = false; });
      send({ op: 'off' });
      UI.toast('🔇 Đã tắt mic');
    }
    updateBtn();
  }

  function updateBtn() {
    const b = $('#btnMic');
    if (!b) return;
    b.classList.toggle('mic-on', micOn);
    b.textContent = micOn ? '🎤' : '🎙️';
    b.title = micOn ? 'Đang bật mic — bấm để tắt' : 'Bật mic để nói chuyện';
  }

  /** Đổi khu: ngắt hết kết nối cũ, sang khu mới thì báo lại nếu đang bật mic */
  function onRoomChange() {
    [...peers.keys()].forEach(drop);
    if (micOn) setTimeout(() => send({ op: 'on' }), 1200);
  }

  /** Mỗi nhịp: âm lượng theo khoảng cách, đo ai đang nói, nhắc lại "đang bật mic" cho người mới tới */
  function tick(dt, me) {
    beat += dt;
    if (micOn && beat > 8) { beat = 0; send({ op: 'on' }); }
    for (const [id, p] of peers) {
      const r = NET.remotes.get(id);
      if (!r) { if (Date.now() - p.made > 15000) drop(id); continue; }
      if (p.audio) {
        const d = Math.hypot(r.rx - me.x, r.ry - me.y);
        p.audio.volume = Math.max(0.15, Math.min(1, 1.2 - d / 1400));
      }
      p.level = levelOf(p.analyser);
    }
  }

  /** Ai đang nói (để vẽ biểu tượng 🔊 trên đầu) */
  const talking = (id) => { const p = peers.get(id); return !!p && p.level > 0.03; };
  const meTalking = () => micOn && levelOf(myAnalyser) > 0.03;

  function init() {
    const b = $('#btnMic');
    if (b) b.onclick = () => setMic(!micOn);
    updateBtn();
  }

  return { init, onNet, setMic, tick, onRoomChange, drop, talking, meTalking, get on() { return micOn; }, get peers() { return peers; } };
})();
