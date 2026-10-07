/* 🎡 Vòng quay 3D thật (three.js): ngồi trong cabin quay 1 vòng, nhìn ra cả thành phố —
 * nhà cao tầng có cửa sổ (ban đêm sáng đèn), đường phố có xe chạy, sông, cây, núi xa, khung vòng quay + các cabin khác.
 * Không tải được three.js thì dùng lại cảnh vẽ 2D cũ. */
const FERRIS3D = (() => {
  const URL3 = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const DUR = 20, R = 110, HUB = 126;
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
      try { start(); } catch (e) { console.error(e); PLANE.ferris(); }
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
      el.innerHTML = '<div class="fx-cabin"></div><div class="fx-title">🎡 Vòng quay · ngắm thành phố từ trên cao</div><div class="fx-alt"></div><button class="fx-skip">⏩ Bỏ qua</button>';
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
      if (dist < 330) continue;                                // khu vui chơi dưới chân vòng quay
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

    /* vòng quay: vành, nan hoa, cabin, trụ đỡ */
    const wheel = new T.Group(); wheel.position.set(0, HUB, 0);
    const steel = new T.MeshLambertMaterial({ color: col('#dee2e6') }), pink = new T.MeshLambertMaterial({ color: col('#f06595'), emissive: isNight ? 0xff4fa0 : 0, emissiveIntensity: isNight ? 0.7 : 0 });
    [-6, 6].forEach((z) => { const rim = new T.Mesh(new T.TorusGeometry(R, 1.4, 6, 64), pink); rim.position.z = z; wheel.add(rim); });
    const CAB = 12;
    for (let k = 0; k < CAB; k++) {
      const a = k / CAB * Math.PI * 2;
      [-6, 6].forEach((z) => { const sp = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, R, 4), steel); sp.position.set(Math.cos(a) * R / 2, Math.sin(a) * R / 2, z); sp.rotation.z = a - Math.PI / 2; wheel.add(sp); });
    }
    scene.add(wheel);
    const cabins = [];
    const cabCols = ['#ff6b6b', '#fcc419', '#51cf66', '#339af0', '#cc5de8', '#ff922b'];
    for (let k = 1; k < CAB; k++) {
      const g = new T.Group();
      const body = new T.Mesh(new T.CylinderGeometry(6, 6, 8, 10), new T.MeshLambertMaterial({ color: col(cabCols[k % cabCols.length]) })); g.add(body);
      const top = new T.Mesh(new T.ConeGeometry(7, 4, 10), steel); top.position.y = 6; g.add(top);
      scene.add(g); cabins.push({ g, a: k / CAB * Math.PI * 2 });
    }
    [[-1], [1]].forEach(([s]) => [-8, 8].forEach((z) => { const leg = new T.Mesh(new T.CylinderGeometry(1.6, 2.2, HUB / Math.cos(0.32), 6), steel); leg.position.set(s * Math.tan(0.32) * HUB / 2, HUB / 2, z); leg.rotation.z = -s * 0.32; scene.add(leg); }));
    const plaza = new T.Mesh(new T.CircleGeometry(300, 40), new T.MeshLambertMaterial({ color: col(isNight ? '#3b3f4a' : '#e9d8b4') })); plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.5; scene.add(plaza);
    // đèn trang trí vành (ban đêm nhấp nháy)
    const bulbs = new T.InstancedMesh(new T.SphereGeometry(1.2, 6, 4), new T.MeshBasicMaterial({ color: 0xffffff }), 48);
    for (let k = 0; k < 48; k++) { const a = k / 48 * Math.PI * 2; M.compose(P3.set(Math.cos(a) * R, Math.sin(a) * R, 7.6), Q, S.set(1, 1, 1)); bulbs.setMatrixAt(k, M); }
    wheel.add(bulbs);

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
      const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
      const u = window.__ferrisU != null ? window.__ferrisU : Math.min(1, t / DUR);
      const ang = -Math.PI / 2 + u * Math.PI * 2;               // bắt đầu ở đáy, quay 1 vòng
      wheel.rotation.z = u * Math.PI * 2;
      cabins.forEach((cb) => { const a = ang + cb.a; cb.g.position.set(Math.cos(a) * R, HUB + Math.sin(a) * R - 8, 0); });
      // camera trong cabin, nhìn ra thành phố, hơi đung đưa
      const cy = HUB + Math.sin(ang) * R - 4, cx = Math.cos(ang) * R;
      camera.position.set(cx, cy, 16);
      const sway = Math.sin(t * 1.3) * 0.04;
      // nhìn ra ngoài (phía trước vòng quay), lên cao thì chúc xuống ngắm phố
      camera.lookAt(cx * 0.6 + Math.sin(t * 0.22) * 500, cy * 0.35, 1100);
      camera.rotation.z += sway;
      // xe
      cars.forEach((c, i) => {
        c.p += c.v * dt; const L = GRID * N * 2; c.p = ((c.p % L) + L) % L;
        const pos = c.p - GRID * N;
        if (c.along) M.compose(P3.set(c.lane, 4, pos), Q.setFromAxisAngle(S.set(0, 1, 0), 0), S.set(1, 1, 1));
        else M.compose(P3.set(pos, 4, c.lane), Q.setFromAxisAngle(S.set(0, 1, 0), Math.PI / 2), S.set(1, 1, 1));
        Q.identity(); carMesh.setMatrixAt(i, M);
      });
      carMesh.instanceMatrix.needsUpdate = true;
      bulbs.material.color.setHSL(isNight ? (t * 0.15) % 1 : 0.12, isNight ? 0.9 : 0.4, isNight ? 0.65 : 0.95);
      altEl.textContent = `Độ cao ${Math.max(0, Math.round(cy * 0.45))} m`;
      renderer.render(scene, camera);
      if (t >= DUR) end();
    };
    raf = requestAnimationFrame(loop);
    setTimeout(end, DUR * 1000 + 2500);
  }
  return { ride };
})();
