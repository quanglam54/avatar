/* 🎡 Vòng quay 3D thật (three.js): ngồi trong cabin quay 1 vòng, nhìn ra cả thành phố —
 * nhà cao tầng có cửa sổ (ban đêm sáng đèn), đường phố có xe chạy, sông, cây, núi xa, khung vòng quay + các cabin khác.
 * Không tải được three.js thì dùng lại cảnh vẽ 2D cũ. */
const FERRIS3D = (() => {
  const URL3 = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const DUR = 22, R = 70, HUB = 82;
  let el = null, T = null;

  function load(cb) {
    if (window.THREE) { T = window.THREE; return cb(true); }
    const s = document.createElement('script');
    s.src = URL3;
    s.onload = () => { T = window.THREE; cb(true); };
    s.onerror = () => cb(false);
    document.head.appendChild(s);
  }
  function ride() {
    load((ok) => {
      if (!ok || !T) return PLANE.ferris();
      try { start(); } catch (e) { console.error(e); window.__ferrisErr = String(e && e.stack); if (el) el.style.display = "none"; PLANE.ferris(); }
    });
  }

  /* ---------- tiện ích ---------- */
  const rnd = (() => { let a = 12345; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; }
  const col = (hex) => new T.Color(hex).convertSRGBToLinear();

  function start() {
    const night = AV.nightFactor ? AV.nightFactor() : 0, isNight = night > 0.5;
    if (!el) {
      el = document.createElement('div');
      el.className = 'ferris3d';
      el.innerHTML = '<div class="fx-title">🎡 Vòng quay công viên</div><div class="fx-alt"></div><button class="fx-skip">⏩ Bỏ qua</button>';
      document.body.appendChild(el);
    }
    el.style.display = 'block';
    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.shadowMap.enabled = false;
    el.prepend(renderer.domElement);
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(62, innerWidth / innerHeight, 1, 9000);

    /* bầu trời (ảnh nền dải màu) + sương xa */
    scene.background = canvasTex(4, 256, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h);
      if (isNight) { g.addColorStop(0, '#060b1f'); g.addColorStop(0.6, '#1b2a55'); g.addColorStop(1, '#3b3f6b'); }
      else { g.addColorStop(0, '#4a90d9'); g.addColorStop(0.55, '#9cc9ee'); g.addColorStop(0.8, '#ffd6a5'); g.addColorStop(1, '#ffb27a'); }
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });
    scene.fog = new T.Fog(isNight ? 0x1b2a55 : 0xf3d2b0, 900, 5200);
    scene.add(new T.HemisphereLight(isNight ? 0x6070b0 : 0xfff1d6, isNight ? 0x101828 : 0x557a3a, isNight ? 0.55 : 0.75));
    const sun = new T.DirectionalLight(isNight ? 0x8899ff : 0xffcf90, isNight ? 0.25 : 0.9);
    sun.position.set(-800, 600, -1500); scene.add(sun);

    /* mặt đất + sông + đường */
    const ground = new T.Mesh(new T.PlaneGeometry(12000, 12000), new T.MeshLambertMaterial({ color: col(isNight ? '#1f3a24' : '#6fbf4f') }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);
    const river = new T.Mesh(new T.PlaneGeometry(12000, 260), new T.MeshPhongMaterial({ color: col(isNight ? '#1c3d6b' : '#3f9ae0'), shininess: 120, specular: 0xffffff }));
    river.rotation.x = -Math.PI / 2; river.position.set(0, 0.6, 1500); scene.add(river);
    const roadMat = new T.MeshLambertMaterial({ color: col(isNight ? '#2b2f36' : '#5b6068') });
    const GRID = 220, N = 14;
    for (let i = -N; i <= N; i++) {
      const a = new T.Mesh(new T.PlaneGeometry(36, GRID * N * 2), roadMat); a.rotation.x = -Math.PI / 2; a.position.set(i * GRID, 0.4, 0); scene.add(a);
      const b = new T.Mesh(new T.PlaneGeometry(GRID * N * 2, 36), roadMat); b.rotation.x = -Math.PI / 2; b.position.set(0, 0.4, i * GRID); scene.add(b);
    }
    // cầu qua sông
    for (let i = -N; i <= N; i += 3) { const br = new T.Mesh(new T.BoxGeometry(40, 10, 300), new T.MeshLambertMaterial({ color: col('#adb5bd') })); br.position.set(i * GRID, 6, 1500); scene.add(br); }

    /* nhà cao tầng: InstancedMesh, cửa sổ vẽ bằng ảnh, ban đêm sáng đèn */
    // ảnh cửa sổ + ảnh đèn (chỉ ô cửa sáng mới phát sáng ban đêm)
    const lit = []; for (let y = 6; y < 128; y += 14) for (let x = 6; x < 64; x += 14) lit.push([x, y, Math.random() < 0.55]);
    const winTex = canvasTex(64, 128, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); lit.forEach(([x, y, on]) => { c.fillStyle = isNight && on ? '#ffe9a8' : '#5a6b80'; c.fillRect(x, y, 8, 9); }); });
    const glowTex = canvasTex(64, 128, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); lit.forEach(([x, y, on]) => { if (on) { c.fillStyle = '#ffd77a'; c.fillRect(x, y, 8, 9); } }); });
    [winTex, glowTex].forEach((t) => { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1, 3); });
    const bMat = new T.MeshLambertMaterial({ map: winTex, emissive: isNight ? 0xffffff : 0x000000, emissiveMap: isNight ? glowTex : null, emissiveIntensity: isNight ? 1 : 0 });
    const roofMat = new T.MeshLambertMaterial({ color: col(isNight ? '#3a3f4a' : '#e9ecef') });
    const PAL = ['#f8f9fa', '#ffd8a8', '#d0ebff', '#e5dbff', '#ffe3e3', '#d3f9d8', '#fff3bf', '#ced4da', '#a5d8ff'];
    const spots = [];
    for (let i = -N; i < N; i++) for (let j = -N; j < N; j++) {
      const cx = i * GRID + GRID / 2, cz = j * GRID + GRID / 2;
      if (Math.abs(cz - 1500) < 200) continue;                 // sông
      const dist = Math.hypot(cx, cz);
      if (dist < 1700) continue;                               // giữa là công viên, thành phố chỉ ở xa
      const r = rnd();
      if (r < 0.12) { spots.push({ park: true, cx, cz }); continue; }
      const cnt = r > 0.85 ? 1 : 4;
      for (let k = 0; k < cnt; k++) {
        const w = cnt === 1 ? 110 + rnd() * 40 : 55 + rnd() * 30, d = cnt === 1 ? 110 + rnd() * 40 : 55 + rnd() * 30;
        const near = dist < 1300;                              // gần: nhà phố thấp · xa: cao ốc
        const h = near ? 24 + rnd() * 50 : cnt === 1 ? 160 + rnd() * (200 + dist / 12) : 40 + rnd() * 120;
        spots.push({ x: cx + (cnt === 1 ? 0 : ((k % 2) - 0.5) * 80), z: cz + (cnt === 1 ? 0 : (Math.floor(k / 2) - 0.5) * 80), w, d, h, c: PAL[Math.floor(rnd() * PAL.length)] });
      }
    }
    const blds = spots.filter((p) => !p.park);
    const box = new T.BoxGeometry(1, 1, 1);
    const im = new T.InstancedMesh(box, bMat, blds.length), rm = new T.InstancedMesh(box, roofMat, blds.length);
    const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), P3 = new T.Vector3();
    blds.forEach((b, i) => {
      M.compose(P3.set(b.x, b.h / 2, b.z), Q, S.set(b.w, b.h, b.d)); im.setMatrixAt(i, M); im.setColorAt(i, col(b.c));
      M.compose(P3.set(b.x, b.h + 2, b.z), Q, S.set(b.w + 4, 4, b.d + 4)); rm.setMatrixAt(i, M);
    });
    scene.add(im); scene.add(rm);
    // công viên + cây
    const parks = spots.filter((p) => p.park), treesPer = 9;
    const trunk = new T.InstancedMesh(new T.CylinderGeometry(3, 4, 18, 6), new T.MeshLambertMaterial({ color: col('#7a4a26') }), parks.length * treesPer);
    const crown = new T.InstancedMesh(new T.SphereGeometry(16, 8, 6), new T.MeshLambertMaterial({ color: col(isNight ? '#1f5a2a' : '#2f9e44') }), parks.length * treesPer);
    let ti = 0;
    parks.forEach((p) => {
      const lawn = new T.Mesh(new T.PlaneGeometry(GRID - 40, GRID - 40), new T.MeshLambertMaterial({ color: col(isNight ? '#234d2b' : '#8ce99a') })); lawn.rotation.x = -Math.PI / 2; lawn.position.set(p.cx, 0.5, p.cz); scene.add(lawn);
      for (let k = 0; k < treesPer; k++) {
        const x = p.cx + (rnd() - 0.5) * 150, z = p.cz + (rnd() - 0.5) * 150;
        M.compose(P3.set(x, 9, z), Q, S.set(1, 1, 1)); trunk.setMatrixAt(ti, M);
        M.compose(P3.set(x, 26, z), Q, S.set(1, 0.9 + rnd() * 0.4, 1)); crown.setMatrixAt(ti, M); ti++;
      }
    });
    scene.add(trunk); scene.add(crown);
    // núi xa
    for (let i = 0; i < 14; i++) { const m = new T.Mesh(new T.ConeGeometry(500 + rnd() * 400, 500 + rnd() * 500, 6), new T.MeshLambertMaterial({ color: col(isNight ? '#1a2440' : '#7d9db5') })); m.position.set(-4500 + i * 700, 200, 5600 + rnd() * 600); scene.add(m); }
    // xe chạy (đèn pha ban đêm)
    const CARS = 160, carMesh = new T.InstancedMesh(new T.BoxGeometry(10, 7, 18), new T.MeshLambertMaterial({ emissive: isNight ? 0xffd27a : 0x000000, emissiveIntensity: isNight ? 0.6 : 0 }), CARS);
    const cars = Array.from({ length: CARS }, (_, i) => ({ along: rnd() < 0.5, lane: (Math.floor(rnd() * N * 2) - N) * GRID + (rnd() < 0.5 ? -9 : 9), p: rnd() * GRID * N * 2, v: (60 + rnd() * 80) * (rnd() < 0.5 ? 1 : -1) }));
    cars.forEach((c, i) => carMesh.setColorAt(i, col(['#e03131', '#1c7ed6', '#fab005', '#f8f9fa', '#212529', '#40c057'][i % 6])));
    scene.add(carMesh);

    /* ---------- công viên quanh vòng quay ---------- */
    const at3 = (mesh, x, y, z) => { mesh.position.set(x, y, z); return mesh; };
    const lam = (c, e) => { const m = new T.MeshLambertMaterial({ color: col(c) }); if (e && isNight) { m.emissive = col(c); m.emissiveIntensity = 0.6; } return m; };
    const park = new T.Mesh(new T.CircleGeometry(1650, 64), lam(isNight ? '#2b5a2f' : '#7ccf5a')); park.rotation.x = -Math.PI / 2; park.position.y = 0.8; scene.add(park);
    const pathM = lam(isNight ? '#5c5547' : '#e9d3a6');
    const ring = new T.Mesh(new T.RingGeometry(150, 185, 64), pathM); ring.rotation.x = -Math.PI / 2; ring.position.y = 1; scene.add(ring);
    [0, 1].forEach((k) => { const p = new T.Mesh(new T.PlaneGeometry(36, 1600), pathM); p.rotation.x = -Math.PI / 2; p.rotation.z = k * Math.PI / 2; p.position.y = 1; scene.add(p); });
    const plaza = new T.Mesh(new T.CircleGeometry(110, 40), lam(isNight ? '#6b5d4a' : '#f3dfb6')); plaza.rotation.x = -Math.PI / 2; plaza.position.y = 1.2; scene.add(plaza);
    // cây quanh công viên
    const tg = new T.Group();
    for (let i = 0; i < 70; i++) {
      const a2 = rnd() * Math.PI * 2, d = 230 + rnd() * 900; const x = Math.cos(a2) * d, z = Math.sin(a2) * d;
      if (Math.abs(x) < 40 || Math.abs(z) < 40) continue;
      const tr = new T.Mesh(new T.CylinderGeometry(2.5, 3.5, 16, 6), lam('#7a4a26')); tr.position.set(x, 8, z); tg.add(tr);
      const cr = new T.Mesh(new T.SphereGeometry(14 + rnd() * 6, 10, 8), lam(['#2f9e44', '#40c057', '#f783ac', '#37b24d'][i % 4])); cr.position.set(x, 26, z); tg.add(cr);
    }
    scene.add(tg);
    // ngựa gỗ xoay (carousel)
    const car = new T.Group(); car.position.set(-200, 0, 120);
    car.add(at3(new T.Mesh(new T.CylinderGeometry(42, 44, 6, 24), lam('#f8f9fa')), 0, 3, 0));
    const roofC = new T.Mesh(new T.ConeGeometry(50, 26, 16), lam('#e64980', true)); roofC.position.y = 50; car.add(roofC);
    const rim2 = new T.Mesh(new T.CylinderGeometry(50, 50, 6, 16, 1, true), lam('#ffd43b', true)); rim2.position.y = 36; car.add(rim2);
    const horses = new T.Group(); car.add(horses);
    for (let k = 0; k < 8; k++) {
      const a3 = k / 8 * Math.PI * 2, x = Math.cos(a3) * 32, z = Math.sin(a3) * 32;
      const pole = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 34, 6), lam('#ffd43b')); pole.position.set(x, 20, z); horses.add(pole);
      const h = new T.Mesh(new T.BoxGeometry(14, 7, 5), lam(['#fff', '#ffc9c9', '#d0ebff', '#fff3bf'][k % 4])); h.position.set(x, 16 + (k % 2) * 4, z); h.rotation.y = -a3; h.userData.k = k; horses.add(h);
    }
    scene.add(car);
    // xe kem + chùm bóng bay + ghế đá
    const stand = new T.Group(); stand.position.set(170, 0, 140);
    stand.add(at3(new T.Mesh(new T.BoxGeometry(30, 18, 16), lam('#ffffff')), 0, 12, 0));
    const um = new T.Mesh(new T.ConeGeometry(26, 12, 12), lam('#ff8787', true)); um.position.y = 40; stand.add(um);
    stand.add(at3(new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 34, 4), lam('#868e96')), 0, 22, 0));
    const balloons = [];
    for (let k = 0; k < 9; k++) {
      const bl = new T.Mesh(new T.SphereGeometry(5, 10, 8), lam(['#ff6b6b', '#fcc419', '#51cf66', '#339af0', '#cc5de8', '#ff922b'][k % 6], true));
      bl.scale.set(1, 1.2, 1); bl.position.set(22 + (k % 3) * 7 - 7, 50 + Math.floor(k / 3) * 8, (k % 2) * 6); stand.add(bl); balloons.push(bl);
    }
    scene.add(stand);
    [[120, -120], [-120, -120], [-130, 200], [130, 220]].forEach(([x, z]) => { const bc = new T.Mesh(new T.BoxGeometry(30, 5, 10), lam('#a0632f')); bc.position.set(x, 9, z); scene.add(bc); });
    // đèn đường
    for (let k = 0; k < 10; k++) { const a4 = k / 10 * Math.PI * 2, x = Math.cos(a4) * 195, z = Math.sin(a4) * 195; const lp = new T.Mesh(new T.CylinderGeometry(1, 1.4, 40, 6), lam('#495057')); lp.position.set(x, 20, z); scene.add(lp); const gl = new T.Mesh(new T.SphereGeometry(4, 8, 6), new T.MeshBasicMaterial({ color: isNight ? 0xffe08a : 0xfff9db })); gl.position.set(x, 42, z); scene.add(gl); }

    /* ---------- vòng quay sặc sỡ ---------- */
    const wheel = new T.Group(); wheel.position.set(0, HUB, 0);
    const steel = lam('#f8f9fa'), RAIN = ['#ff6b6b', '#ff922b', '#fcc419', '#51cf66', '#22b8cf', '#339af0', '#845ef7', '#f06595'];
    [-7, 7].forEach((z) => { const rim = new T.Mesh(new T.TorusGeometry(R, 1.8, 8, 72), lam('#f06595', true)); rim.position.z = z; wheel.add(rim); const rimIn = new T.Mesh(new T.TorusGeometry(R * 0.55, 1.2, 6, 48), lam('#ffd43b', true)); rimIn.position.z = z; wheel.add(rimIn); });
    const CAB = 12;
    for (let k = 0; k < CAB; k++) {
      const a5 = k / CAB * Math.PI * 2;
      [-7, 7].forEach((z) => { const sp = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, R, 5), lam(RAIN[k % RAIN.length])); sp.position.set(Math.cos(a5) * R / 2, Math.sin(a5) * R / 2, z); sp.rotation.z = a5 - Math.PI / 2; wheel.add(sp); });
      const bar = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 16, 5), steel); bar.rotation.x = Math.PI / 2; bar.position.set(Math.cos(a5) * R, Math.sin(a5) * R, 0); wheel.add(bar);
    }
    const hub = new T.Mesh(new T.CylinderGeometry(7, 7, 18, 16), lam('#ffd43b', true)); hub.rotation.x = Math.PI / 2; wheel.add(hub);
    scene.add(wheel);
    // cabin dạng giỏ mở: thân thấp + 4 cột + mái → thấy người ngồi bên trong
    const cabins = [];
    let me = null;
    for (let k = 0; k < CAB; k++) {
      const g = new T.Group(), c0 = RAIN[k % RAIN.length];
      const body = new T.Mesh(new T.CylinderGeometry(8, 7, 7, 14, 1, true), new T.MeshLambertMaterial({ color: col(c0), side: T.DoubleSide })); body.position.y = -3; g.add(body);
      const floor = new T.Mesh(new T.CircleGeometry(7, 14), lam(c0)); floor.rotation.x = -Math.PI / 2; floor.position.y = -6.4; g.add(floor);
      for (let p = 0; p < 4; p++) { const a6 = p / 4 * Math.PI * 2 + 0.4; const post = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 12, 4), steel); post.position.set(Math.cos(a6) * 7, 4, Math.sin(a6) * 7); g.add(post); }
      const roof = new T.Mesh(new T.ConeGeometry(10, 6, 14), lam(c0, true)); roof.position.y = 12; g.add(roof);
      const hang = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 6, 4), steel); hang.position.y = 17; g.add(hang);
      scene.add(g); cabins.push({ g, a: k / CAB * Math.PI * 2 });
      if (k === 0) me = g;
    }
    // nhân vật của mình ngồi trong cabin
    const avTex = canvasTex(160, 200, (c) => { try { ART.character(c, 80, 190, AV.S.look, { scale: 1.15, t: 0, dir: 1 }); } catch (e) { /* bỏ qua */ } });
    const av = new T.Sprite(new T.SpriteMaterial({ map: avTex })); av.scale.set(15, 18.75, 1); av.position.set(0, 3, 0); me.add(av);
    const flag = new T.Sprite(new T.SpriteMaterial({ map: canvasTex(256, 64, (c) => { c.fillStyle = '#ffd43b'; c.beginPath(); c.roundRect(4, 4, 248, 56, 18); c.fill(); c.fillStyle = '#1b2f48'; c.font = '900 30px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⬇ ' + (AV.S.name || 'Bạn'), 128, 34); }) }));
    flag.scale.set(26, 6.5, 1); flag.position.set(0, 26, 0); me.add(flag);
    // chân đỡ + phòng vé
    [[-1], [1]].forEach(([sd]) => [-10, 10].forEach((z) => { const leg = new T.Mesh(new T.CylinderGeometry(2, 3, HUB / Math.cos(0.3), 8), lam('#adb5bd')); leg.position.set(sd * Math.tan(0.3) * HUB / 2, HUB / 2, z); leg.rotation.z = -sd * 0.3; scene.add(leg); }));
    const booth = new T.Mesh(new T.BoxGeometry(26, 20, 16), lam('#ff8787')); booth.position.set(60, 10, 40); scene.add(booth);
    const boothRoof = new T.Mesh(new T.ConeGeometry(20, 10, 4), lam('#ffd43b')); boothRoof.position.set(60, 25, 40); boothRoof.rotation.y = Math.PI / 4; scene.add(boothRoof);
    // đèn trang trí vành
    const bulbs = new T.InstancedMesh(new T.SphereGeometry(1.4, 6, 4), new T.MeshBasicMaterial({ color: 0xffffff }), 72);
    for (let k = 0; k < 72; k++) { const a7 = k / 72 * Math.PI * 2; M.compose(P3.set(Math.cos(a7) * R, Math.sin(a7) * R, 9), Q, S.set(1, 1, 1)); bulbs.setMatrixAt(k, M); }
    wheel.add(bulbs);
    const bulbCols = Array.from({ length: 72 }, (_, k) => col(RAIN[k % RAIN.length]));

    /* chạy */
    const t0 = performance.now();
    let raf = 0, fin = false;
    const altEl = el.querySelector('.fx-alt');
    const onResize = () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
    addEventListener('resize', onResize);
    const end = () => {
      if (fin) return; fin = true;
      cancelAnimationFrame(raf); removeEventListener('resize', onResize);
      renderer.dispose(); renderer.domElement.remove();
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); } });
      el.style.display = 'none';
    };
    el.querySelector('.fx-skip').onclick = end;
    let last = t0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      try { frame(now); } catch (e) { window.__ferrisErr = String(e && e.stack); end(); }
    };
    const frame = (now) => {
      const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
      const u = window.__ferrisU != null ? window.__ferrisU : Math.min(1, t / DUR);
      const ang = -Math.PI / 2 + u * Math.PI * 2;               // bắt đầu ở đáy, quay 1 vòng
      wheel.rotation.z = u * Math.PI * 2;
      cabins.forEach((cb) => { const a = ang + cb.a; cb.g.position.set(Math.cos(a) * R, HUB + Math.sin(a) * R - 17, 0); cb.g.rotation.z = Math.sin(t * 1.6 + cb.a) * 0.05; });
      const cx = me.position.x, cy = me.position.y;
      // camera đứng ngoài, lượn quanh vòng quay rồi tiến lại gần cabin của mình
      const th = -0.75 + u * 1.5, dist = 260 - Math.sin(u * Math.PI) * 120;
      camera.position.set(Math.sin(th) * dist + cx * 0.3, 40 + cy * 0.55, Math.cos(th) * dist);
      camera.lookAt(cx * 0.65, HUB * 0.35 + cy * 0.65, 0);
      horses.rotation.y = t * 0.6; horses.children.forEach((h) => { if (h.userData.k != null) h.position.y = 16 + Math.sin(t * 3 + h.userData.k) * 4; });
      balloons.forEach((bl, k) => { bl.position.x += Math.sin(t * 2 + k) * 0.02; });
      // xe
      cars.forEach((c, i) => {
        c.p += c.v * dt; const L = GRID * N * 2; c.p = ((c.p % L) + L) % L;
        const pos = c.p - GRID * N;
        if (c.along) M.compose(P3.set(c.lane, 4, pos), Q.setFromAxisAngle(S.set(0, 1, 0), 0), S.set(1, 1, 1));
        else M.compose(P3.set(pos, 4, c.lane), Q.setFromAxisAngle(S.set(0, 1, 0), Math.PI / 2), S.set(1, 1, 1));
        Q.identity(); carMesh.setMatrixAt(i, M);
      });
      carMesh.instanceMatrix.needsUpdate = true;
      for (let k = 0; k < 72; k++) bulbs.setColorAt(k, bulbCols[((k + Math.floor(Math.max(0, t) * 8)) % 72 + 72) % 72]);
      bulbs.instanceColor.needsUpdate = true;
      altEl.textContent = `🎡 Bạn đang ở độ cao ${Math.max(0, Math.round(cy * 0.4))} m`;
      renderer.render(scene, camera);
      if (t >= DUR) end();
    };
    raf = requestAnimationFrame(loop);
    setTimeout(end, DUR * 1000 + 2500);
  }
  return { ride };
})();
