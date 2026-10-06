/* Nhạc nền: mặc định lấy link trong config (YouTube / mp3), hoặc nhạc chill tự tạo bằng Web Audio
 * (hợp âm lo-fi chậm, piano rải nhẹ, bass trầm). Mỗi người đổi được trong Cài đặt (dán link khác). */
const MUSIC = (() => {
  const BPM = 70, BEAT = 60 / BPM, BAR = BEAT * 4;
  /** Cmaj7 – Am7 – Fmaj7 – G6 (số MIDI) */
  const CHORDS = [[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 52]];
  const SCALE = [72, 74, 76, 79, 81, 84];
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

  let ac = null, master = null, bus = null, echo = null, timer = null;
  let on = true, vol = 0.5, bar = 0, nextBar = 0, started = false;
  /* Nguồn nhạc: chill (tự tạo) | yt (YouTube) | file (mp3...) */
  let src = { kind: 'chill' }, yt = null, ytReady = false, fileEl = null, kicked = false;
  const DEFAULT = (window.AVATAR_CONFIG && window.AVATAR_CONFIG.defaultMusic) || 'chill';

  function build() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0;
    master.connect(ac.destination);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1800; lp.Q.value = 0.4;
    lp.connect(master);
    bus = lp;
    // tiếng vọng nhẹ
    echo = ac.createDelay(1);
    echo.delayTime.value = BEAT * 0.75;
    const fb = ac.createGain(); fb.gain.value = 0.28;
    const ef = ac.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 1400;
    echo.connect(ef); ef.connect(fb); fb.connect(echo); ef.connect(lp);
  }

  function tone(freq, t, dur, { type = 'sine', gain = 0.1, attack = 0.02, release = 0.4, toEcho = 0, detune = 0 } = {}) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.setValueAtTime(gain, t + Math.max(attack, dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    if (toEcho) { const e = ac.createGain(); e.gain.value = toEcho; g.connect(e); e.connect(echo); }
    o.start(t); o.stop(t + dur + 0.05);
  }

  /** Lên lịch một ô nhịp: pad hợp âm, bass, piano rải ngẫu nhiên nhẹ nhàng */
  function scheduleBar(t) {
    const ch = CHORDS[bar % CHORDS.length];
    ch.forEach((n, i) => {
      tone(hz(n + 12), t, BAR + 0.6, { type: 'triangle', gain: 0.022, attack: 0.9, release: 1.1, detune: i % 2 ? 6 : -6 });
      tone(hz(n + 12), t, BAR + 0.6, { type: 'sine', gain: 0.018, attack: 1.1, release: 1.2 });
    });
    tone(hz(ch[0] - 12), t, BEAT * 1.8, { gain: 0.07, attack: 0.04, release: 0.8 });
    tone(hz(ch[0] - 12), t + BEAT * 2, BEAT * 1.6, { gain: 0.055, attack: 0.04, release: 0.7 });
    for (let k = 0; k < 8; k++) {
      if (Math.random() > (k % 2 ? 0.35 : 0.6)) continue;
      const pool = Math.random() < 0.55 ? ch.map((n) => n + 24) : SCALE;
      const n = pool[Math.floor(Math.random() * pool.length)];
      const at = t + k * BEAT / 2 + (Math.random() - 0.5) * 0.03;
      tone(hz(n), at, 1.4, { type: 'triangle', gain: 0.045 + Math.random() * 0.02, attack: 0.008, release: 1.3, toEcho: 0.5 });
      tone(hz(n + 12), at, 0.6, { gain: 0.008, attack: 0.005, release: 0.55 });
    }
    bar++;
  }

  function pump() {
    if (!ac) return;
    while (nextBar < ac.currentTime + 1.2) { scheduleBar(nextBar); nextBar += BAR; }
  }

  function fadeTo(v, s = 1.5) {
    if (!ac) return;
    const t = ac.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(v, t + s);
  }

  function start() {
    if (!on) return;
    try {
      if (!ac) build();
      if (ac.state === 'suspended') ac.resume();
      if (src.kind !== 'chill') { playCustom(); return; }
      if (!started) { started = true; nextBar = ac.currentTime + 0.1; }
      if (!timer) timer = setInterval(pump, 300);
      pump();
      fadeTo(vol * 0.9, 2.5);
    } catch (e) { /* trình duyệt không hỗ trợ âm thanh */ }
  }

  function stop() {
    pauseCustom();
    if (!ac) return;
    fadeTo(0, 0.6);
    setTimeout(() => { if (!on && ac) { ac.suspend(); clearInterval(timer); timer = null; started = false; } }, 700);
  }

  /** settings: { music: bool, musicVol: 0..1 } */
  function init(settings) {
    on = settings.music !== false;
    vol = typeof settings.musicVol === 'number' ? settings.musicVol : 0.5;
    setSource(zoneUrl || (settings.musicUrl ?? DEFAULT), true);
    // trình duyệt chỉ cho phát tiếng sau khi người chơi chạm / bấm lần đầu
    // chỉ tự phát 1 lần ở lần chạm đầu tiên — sau đó bấm/tưới cây không được tự bật lại nhạc người chơi đã tắt
    const kick = () => {
      if (kicked) return;
      kicked = true;
      ['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.removeEventListener(ev, kick));
      if (!on) return;
      if (src.kind !== 'chill') { if (!ac) { try { build(); } catch (e) { /* bỏ qua */ } } if (ac && ac.state === 'suspended') ac.resume(); playCustom(); return; }
      if (!ac || ac.state !== 'running' || !started) start();
    };
    ['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.addEventListener(ev, kick, { passive: true }));
    document.addEventListener('visibilitychange', () => {
      if (!ac) return;
      if (document.hidden) { ac.suspend(); pauseCustom(); } else if (on) { ac.resume(); start(); }
    });
  }

  /** Tiếng "bùm" của pháo hoa (tắt nhạc thì cũng tắt tiếng pháo) */
  function boom(size = 1) {
    if (!ac || !on || ac.state !== 'running') return;
    const t = ac.currentTime, len = 1.4;
    const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * len), ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3.2);
    const src = ac.createBufferSource(); src.buffer = buf;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1600, t); lp.frequency.exponentialRampToValueAtTime(160, t + 0.9);
    const g = ac.createGain(); g.gain.value = 0.35 * vol * size;
    src.connect(lp); lp.connect(g); g.connect(ac.destination);
    src.start(t + Math.random() * 0.05);
    // lách tách sau tiếng nổ
    for (let k = 0; k < 6; k++) {
      const o = ac.createOscillator(), og = ac.createGain(), at = t + 0.25 + Math.random() * 0.7;
      o.type = 'square'; o.frequency.value = 1800 + Math.random() * 2400;
      og.gain.setValueAtTime(0.0001, at); og.gain.exponentialRampToValueAtTime(0.025 * vol, at + 0.005); og.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
      o.connect(og); og.connect(ac.destination); o.start(at); o.stop(at + 0.06);
    }
  }
  /** Tiếng huýt khi pháo bay lên */
  function whistle() {
    if (!ac || !on || ac.state !== 'running') return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(1900, t + 0.9);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03 * vol, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 1.05);
  }

  /** Một đoạn piano ngắn khi bấm chơi đàn trong nhà */
  function melody() {
    try {
      if (!ac) build();
      if (ac.state === 'suspended') ac.resume();
    } catch (e) { return; }
    const t = ac.currentTime + 0.05;
    const tunes = [[72, 74, 76, 77, 79, 77, 76, 74, 72], [67, 72, 76, 79, 76, 72, 74, 71, 72], [76, 74, 72, 74, 76, 76, 76]];
    const tune = tunes[Math.floor(Math.random() * tunes.length)];
    tune.forEach((n, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), at = t + i * 0.28;
      o.type = 'triangle'; o.frequency.value = hz(n);
      g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.16 * Math.max(0.3, vol), at + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
      o.connect(g); g.connect(ac.destination); o.start(at); o.stop(at + 0.95);
    });
  }

  /** Tiếng mưa rơi rì rào (độ to theo độ mưa 0..1) */
  let rainSrc = null, rainGain = null, rainLv = -1;
  function rain(level) {
    if (!ac || ac.state !== 'running') return;
    const v = on ? Math.round(level * 20) / 20 : 0;
    if (v === rainLv) return;
    rainLv = v;
    if (!rainSrc && v > 0) {
      const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      rainSrc = ac.createBufferSource(); rainSrc.buffer = buf; rainSrc.loop = true;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.5;
      rainGain = ac.createGain(); rainGain.gain.value = 0;
      rainSrc.connect(bp); bp.connect(rainGain); rainGain.connect(ac.destination);
      rainSrc.start();
    }
    if (rainGain) rainGain.gain.setTargetAtTime(v * 0.09 * vol, ac.currentTime, 0.5);
  }

  /** Tiếng sủa (chó) / gầm (hổ, sư tử) */
  function bark(big) {
    if (!ac || !on || ac.state !== 'running') return;
    const t0 = ac.currentTime;
    (big ? [0] : [0, 0.22]).forEach((d) => {
      const t = t0 + d, o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'sawtooth';
      if (big) { o.frequency.setValueAtTime(140, t); o.frequency.linearRampToValueAtTime(95, t + 0.9); }
      else { o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.14); }
      f.type = 'lowpass'; f.frequency.value = big ? 700 : 1600;
      const len = big ? 1 : 0.16;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22 * vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(f); f.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + len + 0.05);
    });
  }

  /** Tiếng "cạch" khi gậy chạm bi */
  function clack() {
    if (!ac || !on || ac.state !== 'running') return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(1400, t); o.frequency.exponentialRampToValueAtTime(500, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.08 * vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.1);
  }

  function setOn(v) { on = v; if (v) start(); else stop(); updateMini(); }
  function setVolume(v) {
    vol = Math.max(0, Math.min(1, v));
    if (on && ac && src.kind === 'chill') fadeTo(vol * 0.9, 0.3);
    if (yt && ytReady) yt.setVolume(Math.round(vol * 100));
    if (fileEl) fileEl.volume = vol;
  }

  /* ---------- Nhạc từ link: YouTube (trình phát nhỏ ở góc) hoặc file mp3 ---------- */
  /** Nhận diện link: trả về nguồn nhạc, null nếu link không dùng được */
  function parseSource(url) {
    const u = String(url || '').trim();
    if (!u || u === 'chill') return { kind: 'chill' };
    const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    const list = (u.match(/[?&]list=([\w-]+)/) || [])[1];
    if (m || list) return { kind: 'yt', id: m ? m[1] : null, list: list || null, url: u };
    if (/^https?:\/\/\S+\.(mp3|m4a|ogg|wav|aac)(\?\S*)?$/i.test(u)) return { kind: 'file', url: u };
    return null;
  }

  function loadYT() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve();
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(); };
      if (!document.getElementById('ytApi')) {
        const sc = document.createElement('script');
        sc.id = 'ytApi'; sc.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(sc);
      }
    });
  }

  /** Trình phát nhỏ ở góc màn hình (YouTube không cho ẩn hẳn trình phát) */
  function mini() {
    let el = document.getElementById('ytMini');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ytMini';
      el.className = 'yt-mini';
      el.innerHTML = '<div class="yt-bar"><span class="yt-title">🎵 Đang tải nhạc…</span><button data-yplay title="Phát / dừng">⏯</button><button data-ynext title="Bài tiếp">⏭</button><button data-yvid title="Hiện / ẩn video">📺</button></div><div class="yt-frame"><div id="ytHolder"></div></div>';
      document.body.appendChild(el);
      el.querySelector('[data-yplay]').onclick = () => { kicked = true; const v = !on || !(yt && ytReady && yt.getPlayerState() === 1); setOn(v); if (api.onToggle) api.onToggle(v); };
      el.querySelector('[data-ynext]').onclick = () => { if (yt && ytReady) { if (src.list) yt.nextVideo(); else yt.seekTo(0); } };
      el.querySelector('[data-yvid]').onclick = () => el.classList.toggle('video');
    }
    return el;
  }
  function updateMini() {
    const el = document.getElementById('ytMini');
    if (!el) return;
    el.classList.toggle('hide', src.kind !== 'yt');
    let title = '🎵 Nhạc nền';
    try { const d = yt && ytReady && yt.getVideoData(); if (d && d.title) title = '🎵 ' + d.title; } catch (e) { /* bỏ qua */ }
    if (!on) title = '🔇 Đã tắt nhạc — bấm ⏯ để bật';
    el.querySelector('.yt-title').textContent = title;
    el.querySelector('[data-ynext]').style.display = src.list ? '' : 'none';
  }

  async function setupYT() {
    const me = src;
    mini();
    updateMini();
    await loadYT();
    if (src !== me) return;
    if (yt) { try { yt.destroy(); } catch (e) { /* bỏ qua */ } yt = null; ytReady = false; document.querySelector('.yt-frame').innerHTML = '<div id="ytHolder"></div>'; }
    const pv = { playsinline: 1, rel: 0, modestbranding: 1, controls: 1 };
    if (me.list) { pv.listType = 'playlist'; pv.list = me.list; pv.loop = 1; } else { pv.loop = 1; pv.playlist = me.id; }
    yt = new window.YT.Player('ytHolder', {
      width: 200, height: 113, videoId: me.id || undefined, playerVars: pv,
      events: {
        onReady: () => { ytReady = true; yt.setVolume(Math.round(vol * 100)); if (on && kicked) yt.playVideo(); updateMini(); },
        onStateChange: () => updateMini(),
        onError: () => { const el = document.getElementById('ytMini'); if (el) el.querySelector('.yt-title').textContent = '⚠️ Video này không cho phát nhúng — thử link khác'; },
      },
    });
  }

  function playCustom() {
    if (src.kind === 'yt' && yt && ytReady) yt.playVideo();
    if (src.kind === 'file' && fileEl) fileEl.play().catch(() => {});
  }
  function pauseCustom() {
    if (yt && ytReady) try { yt.pauseVideo(); } catch (e) { /* bỏ qua */ }
    if (fileEl) fileEl.pause();
  }

  /** Đổi nguồn nhạc. Trả về false nếu link không dùng được */
  function setSource(url, silent) {
    const next = parseSource(url);
    if (!next) return false;
    if (next.kind === src.kind && next.url === src.url && (next.kind !== 'yt' || yt)) return true;
    // dừng nguồn cũ
    pauseCustom();
    if (src.kind === 'chill' && ac) { fadeTo(0, 0.4); clearInterval(timer); timer = null; started = false; }
    if (fileEl && next.kind !== 'file') { fileEl.src = ''; fileEl = null; }
    if (yt && next.kind !== 'yt') { try { yt.destroy(); } catch (e) { /* bỏ qua */ } yt = null; ytReady = false; }
    src = next;
    if (src.kind === 'yt') setupYT();
    else if (src.kind === 'file') { fileEl = new Audio(src.url); fileEl.loop = true; fileEl.volume = vol; if (on && kicked) fileEl.play().catch(() => {}); }
    else if (on && kicked) start();
    updateMini();
    return true;
  }
  /** Sau khi đăng nhập (cài đặt có thể khác bản trên máy) */
  function refresh(settings) {
    if (typeof settings.musicVol === 'number') setVolume(settings.musicVol);
    setSource(zoneUrl || (settings.musicUrl ?? DEFAULT), true);
  }
  /** Nhạc riêng của một khu (vd H-Club). url = null → trả lại nhạc người chơi chọn */
  let zoneUrl = null;
  function zone(url) {
    url = url || null;
    if (url === zoneUrl) return;
    zoneUrl = url;
    const S = typeof AV !== 'undefined' && AV.S;
    const mine = (S && S.settings && S.settings.musicUrl) ?? DEFAULT;
    setSource(url || mine, true);
    if (url && typeof UI !== 'undefined') UI.toast(on ? '🪩 Nhạc của H-Club đang phát — quẩy lên nào!' : '🔇 Bạn đang tắt nhạc — bấm 🎵 để nghe nhạc H-Club', 3500);
  }

  const api = { zone, init, setOn, setVolume, setSource, parseSource, refresh, get source() { return src; }, get defaultUrl() { return DEFAULT; }, boom, whistle, melody, clack, bark, rain, get on() { return on; }, get volume() { return vol; }, onToggle: null };
  return api;
})();
