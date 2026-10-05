/* Nhạc nền chill tự tạo bằng Web Audio: hợp âm lo-fi chậm, piano rải nhẹ, bass trầm (không cần file nhạc) */
const MUSIC = (() => {
  const BPM = 70, BEAT = 60 / BPM, BAR = BEAT * 4;
  /** Cmaj7 – Am7 – Fmaj7 – G6 (số MIDI) */
  const CHORDS = [[48, 52, 55, 59], [45, 48, 52, 55], [41, 45, 48, 52], [43, 47, 50, 52]];
  const SCALE = [72, 74, 76, 79, 81, 84];
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);

  let ac = null, master = null, bus = null, echo = null, timer = null;
  let on = true, vol = 0.5, bar = 0, nextBar = 0, started = false;

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
      if (!started) { started = true; nextBar = ac.currentTime + 0.1; }
      if (!timer) timer = setInterval(pump, 300);
      pump();
      fadeTo(vol * 0.9, 2.5);
    } catch (e) { /* trình duyệt không hỗ trợ âm thanh */ }
  }

  function stop() {
    if (!ac) return;
    fadeTo(0, 0.6);
    setTimeout(() => { if (!on && ac) { ac.suspend(); clearInterval(timer); timer = null; started = false; } }, 700);
  }

  /** settings: { music: bool, musicVol: 0..1 } */
  function init(settings) {
    on = settings.music !== false;
    vol = typeof settings.musicVol === 'number' ? settings.musicVol : 0.5;
    // trình duyệt chỉ cho phát tiếng sau khi người chơi chạm / bấm lần đầu
    const kick = () => { if (on && (!ac || ac.state !== 'running' || !started)) start(); };
    ['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.addEventListener(ev, kick, { passive: true }));
    document.addEventListener('visibilitychange', () => {
      if (!ac) return;
      if (document.hidden) ac.suspend(); else if (on) { ac.resume(); start(); }
    });
  }

  function setOn(v) { on = v; if (v) start(); else stop(); }
  function setVolume(v) { vol = Math.max(0, Math.min(1, v)); if (on && ac) fadeTo(vol * 0.9, 0.3); }

  return { init, setOn, setVolume, get on() { return on; }, get volume() { return vol; } };
})();
