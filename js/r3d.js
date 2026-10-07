/* 🧊 Đồ hoạ 3D (three.js) cho Nông trại — thử nghiệm.
 * Camera trực giao nhìn chéo (xoay ~32°, nghiêng 50°) như game nông trại 3D.
 * Thế giới 3D dùng đúng toạ độ 2D: (x, chiều cao, y). Mặt đất = ảnh nền 2D; luống ruộng = khối 3D có cây đứng trên từng ô;
 * nhà, cây, thú, nhân vật = tấm hình luôn quay về camera (kiểu sa bàn), đổ bóng thật dưới nắng; ban đêm đèn đường chiếu sáng mặt đất.
 * Bấm chuột: bắn tia vào cảnh → đổi ra điểm 2D tương ứng nên mọi thao tác cũ vẫn dùng được. */
const R3D = (() => {
  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const YAW = 0, PITCH = 55 * Math.PI / 180, WIDE = 520;
  let T = null, renderer = null, scene = null, cam = null, sun = null, hemi = null;
  let ground = null, groundSrc = null, curMap = null, loading = false, failed = false, on = false, ray = null;
  const bills = new Map();      // khoá → { mesh, cv, c, tex, w, h, last, painted, bb, flat, wide }
  const beds = new Map();
  const cropTex = new Map();
  const lamps = [];
  let geoPlane = null, frameNo = 0, signTex = null;
  const tgt = { x: 0, z: 0 };

  /* ---------- bật / tắt ---------- */
  const touch = () => matchMedia('(pointer: coarse)').matches;
  function mode() { const st = AV.S && AV.S.settings; return (st && st.r3d) || 'auto'; }
  function wanted() { const md = mode(); return md === 'on' || (md === 'auto' && !touch()); }
  function supports(m) { return !!m && m.id === 'farm' && !m.indoor; }
  function active(m) {
    on = false;
    if (!supports(m) || !wanted() || failed) { if (renderer) renderer.domElement.style.display = 'none'; return false; }
    if (!T) { load(); return false; }
    renderer.domElement.style.display = 'block';
    on = true;
    return true;
  }
  function load() {
    if (loading || failed) return;
    if (window.THREE) { T = window.THREE; init(); return; }
    loading = true;
    const sc = document.createElement('script');
    sc.src = THREE_URL;
    sc.onload = () => { loading = false; T = window.THREE; try { init(); } catch (e) { console.error(e); failed = true; T = null; } };
    sc.onerror = () => { loading = false; failed = true; UI.toast('Không tải được đồ hoạ 3D — dùng 2D'); };
    document.head.appendChild(sc);
  }
  function init() {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    const el = renderer.domElement;
    el.id = 'game3d';
    document.body.insertBefore(el, document.getElementById('game'));
    scene = new T.Scene();
    cam = new T.OrthographicCamera(-1, 1, 1, -1, 1, 30000);
    hemi = new T.HemisphereLight(0xfff1d6, 0x5f7f35, 0.62);
    scene.add(hemi);
    sun = new T.DirectionalLight(0xffd59a, 0.78);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0006;
    sun.shadow.radius = 3;
    scene.add(sun); scene.add(sun.target);
    for (let i = 0; i < 6; i++) { const L = new T.PointLight(0xffc670, 0, 420, 2); scene.add(L); lamps.push(L); }
    geoPlane = new T.PlaneGeometry(1, 1);
    ray = new T.Raycaster();
  }

  /* ---------- mặt đất ---------- */
  function setGround(m) {
    if (ground && groundSrc === m.ground) return;
    if (ground) { scene.remove(ground); ground.material.map.dispose(); ground.material.dispose(); ground.geometry.dispose(); }
    let src = m.ground;
    const max = renderer.capabilities.maxTextureSize;
    if (src.width > max || src.height > max) {
      const k = Math.min(max / src.width, max / src.height), c = document.createElement('canvas');
      c.width = Math.floor(src.width * k); c.height = Math.floor(src.height * k);
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); src = c;
    }
    const tex = new T.CanvasTexture(src);
    tex.encoding = T.sRGBEncoding; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    ground = new T.Mesh(new T.PlaneGeometry(m.w, m.h), new T.MeshLambertMaterial({ map: tex, depthWrite: false, color: 0xd9e8b4 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(m.w / 2, 0, m.h / 2);
    ground.receiveShadow = true;
    ground.renderOrder = -1e7;
    ground.userData.ground = true;
    scene.add(ground);
    groundSrc = m.ground;
  }

  /* ---------- tấm hình (đồ vật, nhân vật) ---------- */
  function bill(key, w, h) {
    let b = bills.get(key);
    if (b && (b.w !== w || b.h !== h)) { scene.remove(b.mesh); b.tex.dispose(); b.mesh.material.dispose(); bills.delete(key); b = null; }
    if (b) return b;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const tex = new T.CanvasTexture(cv);
    tex.encoding = T.sRGBEncoding;
    const mat = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, alphaTest: 0.02, side: T.DoubleSide });
    const mesh = new T.Mesh(geoPlane, mat);
    mesh.castShadow = true;
    mesh.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: tex, alphaTest: 0.5 });
    scene.add(mesh);
    b = { mesh, cv, c: cv.getContext('2d'), tex, w, h, last: -1, painted: false };
    mesh.userData.bill = b;
    bills.set(key, b);
    return b;
  }
  const camUp = () => new T.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
  const fwd = () => ({ x: Math.sin(YAW), z: Math.cos(YAW) });
  const depthOf = (x, z) => { const f = fwd(); return (x - tgt.x) * f.x + (z - tgt.z) * f.z; };
  /** đặt tấm hình: rộng (tường, hàng rào) đứng thẳng theo trục x; hẹp thì quay về camera; flat nằm trên mặt đất */
  function place(b, bb, sortY, flat) {
    const m = b.mesh, bw = bb[2] - bb[0], bh = bb[3] - bb[1], cx = (bb[0] + bb[2]) / 2;
    b.bb = bb; b.flat = flat; b.sortY = sortY;
    m.scale.set(bw, bh, 1);
    if (flat) {
      m.quaternion.setFromEuler(new T.Euler(-Math.PI / 2, 0, 0));
      m.position.set(cx, 0.5, (bb[1] + bb[3]) / 2);
      m.renderOrder = -1e6 + sortY; b.wide = false;
      return;
    }
    const lift = ((sortY - bb[3]) + (sortY - bb[1])) / 2;
    if (bw > WIDE) {
      // tường / hàng rào dài: đứng thẳng theo trục x, ghi chiều sâu để che khuất đúng từng điểm, vẽ trước mọi thứ
      b.wide = true;
      m.quaternion.set(0, 0, 0, 1);
      m.position.set(cx, lift, sortY);
      m.renderOrder = depthOf(cx, sortY); // camera nhìn thẳng: vẽ theo thứ tự trước/sau như bản 2D
      return;
    } else {
      b.wide = false;
      m.quaternion.copy(cam.quaternion);
      const U = camUp();
      m.position.set(cx + U.x * lift, U.y * lift, sortY + U.z * lift);
    }
    m.renderOrder = depthOf(cx, sortY);
  }

  /* ---------- luống ruộng 3D ---------- */
  function cropTexture(crop, stage) {
    const k = crop + '|' + stage;
    if (cropTex.has(k)) return cropTex.get(k);
    const s = 2, cv = document.createElement('canvas'); cv.width = 60 * s; cv.height = 84 * s;
    const c = cv.getContext('2d');
    c.setTransform(s * 1.55, 0, 0, s * 1.55, 30 * s, 76 * s);
    ART.plant(c, 0, 0, crop, stage, 0);
    const tex = new T.CanvasTexture(cv); tex.encoding = T.sRGBEncoding;
    cropTex.set(k, tex);
    return tex;
  }
  function signTexture() {
    if (signTex) return signTex;
    const cv = document.createElement('canvas'); cv.width = 200; cv.height = 140;
    const c = cv.getContext('2d');
    c.fillStyle = '#6b3f22'; c.fillRect(94, 50, 12, 90);
    c.fillStyle = '#e8b46a'; c.beginPath(); c.roundRect(10, 10, 180, 60, 12); c.fill();
    c.strokeStyle = '#6b3f22'; c.lineWidth = 6; c.stroke();
    c.fillStyle = '#5c3010'; c.font = '900 28px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🪧 MUA ĐẤT', 100, 41);
    signTex = new T.CanvasTexture(cv); signTex.encoding = T.sRGBEncoding;
    return signTex;
  }
  const BOXG = {};
  const boxGeo = (w, h, d) => { const k = `${w}|${h}|${d}`; return BOXG[k] || (BOXG[k] = new T.BoxGeometry(w, h, d)); };
  const MATS = {};
  const lam = (col) => { if (!MATS[col]) { MATS[col] = new T.MeshLambertMaterial({ color: col }); MATS[col].color.convertSRGBToLinear(); } return MATS[col]; };
  /** hàng rào gỗ: cọc mỗi ~40px + 2 thanh ngang */
  function fence(g, L, Tp, R, Bt) {
    const H = 30, wood = lam('#8a5a32'), dark = lam('#6b4423');
    const post = (x, z) => { const p = new T.Mesh(boxGeo(7, H, 7), dark); p.position.set(x, H / 2, z); p.castShadow = true; g.add(p); const cap = new T.Mesh(boxGeo(9, 3, 9), wood); cap.position.set(x, H + 1.5, z); g.add(cap); };
    const side = (x1, z1, x2, z2) => {
      const len = Math.hypot(x2 - x1, z2 - z1), n = Math.max(1, Math.round(len / 42));
      for (let i = 0; i < n; i++) post(x1 + (x2 - x1) * i / n, z1 + (z2 - z1) * i / n);
      [11, 23].forEach((h) => {
        const r = new T.Mesh(x1 === x2 ? boxGeo(4, 4, len) : boxGeo(len, 4, 4), wood);
        r.position.set((x1 + x2) / 2, h, (z1 + z2) / 2); r.castShadow = true; g.add(r);
      });
    };
    side(L, Tp, R, Tp); side(R, Tp, R, Bt); side(R, Bt, L, Bt); side(L, Bt, L, Tp);
  }
  /* ---------- 🏞️ đồ vật 3D thật ở nông trại: ao cá, rơm, ổ gà ---------- */
  let props = null, ducks = [];
  function buildProps(map) {
    if (props) { scene.remove(props); props = null; ducks = []; }
    if (map.id !== 'farm') return;
    const g = new T.Group();
    const add = (mesh, x, y, z, shadow = true) => { mesh.position.set(x, y, z); mesh.castShadow = shadow; mesh.receiveShadow = true; g.add(mesh); return mesh; };
    // ao cá: nước + bờ đá + lá sen + cầu gỗ + vịt
    const L = map.lake;
    if (L) {
      const water = new T.Mesh(new T.CircleGeometry(1, 48), (() => { const w = new T.MeshPhongMaterial({ color: 0x3fa7e8, shininess: 90, specular: 0xffffff, transparent: true, opacity: 0.92 }); w.color.convertSRGBToLinear(); return w; })());
      water.rotation.x = -Math.PI / 2; water.scale.set(L.rx, L.ry, 1); add(water, L.x, 3, L.y, false);
      const bed = new T.Mesh(new T.CircleGeometry(1, 48), lam('#1c5f8a')); bed.rotation.x = -Math.PI / 2; bed.scale.set(L.rx + 6, L.ry + 6, 1); add(bed, L.x, 1.5, L.y, false);
      const rockG = new T.DodecahedronGeometry(1, 0);
      for (let i = 0; i < 34; i++) {
        const a = i / 34 * Math.PI * 2, r = 20 + (i * 37 % 13);
        const rock = new T.Mesh(rockG, lam(['#8d939a', '#a3a9ae', '#7b8188'][i % 3]));
        rock.scale.set(r, r * 0.7, r * 0.9); rock.rotation.set(i, i * 2, i * 3);
        add(rock, L.x + Math.cos(a) * (L.rx + 8), r * 0.4, L.y + Math.sin(a) * (L.ry + 8));
      }
      const padG = new T.CylinderGeometry(1, 1, 2, 16);
      [[-90, -30], [-40, 40], [60, -40], [110, 30], [10, -10], [-120, 20]].forEach(([dx, dz], i) => {
        const pad = new T.Mesh(padG, lam('#3c9e36')); pad.scale.set(18 + i % 3 * 4, 1, 14 + i % 2 * 4); add(pad, L.x + dx, 4, L.y + dz, false);
        if (i % 2 === 0) { const fl = new T.Mesh(new T.SphereGeometry(6, 10, 8), lam('#f783ac')); add(fl, L.x + dx, 8, L.y + dz); }
      });
      // cầu gỗ
      for (let k = 0; k < 6; k++) add(new T.Mesh(boxGeo(16, 5, 70), lam(k % 2 ? '#a0632f' : '#b5773c')), L.x + 80 + k * 17, 10, L.y - L.ry + 10);
      [[0, 0], [100, 0], [0, 60], [100, 60]].forEach(([dx, dz]) => add(new T.Mesh(boxGeo(10, 34, 10), lam('#6b4423')), L.x + 74 + dx, 10, L.y - L.ry - 20 + dz));
      // vịt
      for (let i = 0; i < 3; i++) {
        const d = new T.Group();
        const body = new T.Mesh(new T.SphereGeometry(13, 14, 10), lam(i ? '#ffd43b' : '#ffffff')); body.scale.set(1.2, 0.8, 1); d.add(body);
        const head = new T.Mesh(new T.SphereGeometry(8, 12, 10), lam(i ? '#ffd43b' : '#ffffff')); head.position.set(12, 12, 0); d.add(head);
        const beak = new T.Mesh(boxGeo(8, 3, 5), lam('#ff922b')); beak.position.set(21, 11, 0); d.add(beak);
        d.children.forEach((c) => { c.castShadow = true; });
        d.userData = { a: i * 2.1, r: 60 + i * 25 };
        g.add(d); ducks.push(d);
      }
    }
    // rơm
    const hay = (x, z, big) => {
      const n = big ? [[0, 0, 0], [44, 0, 0], [22, 0, 26]] : [[0, 0, 0]];
      if (big) n.push([22, 26, 13]);
      n.forEach(([dx, dy, dz]) => {
        const b = new T.Mesh(boxGeo(42, 24, 28), lam('#e9c46a')); add(b, x - (big ? 22 : 0) + dx, 12 + dy, z - 14 + dz);
        const band = new T.Mesh(boxGeo(43, 25, 4), lam('#b8892b')); add(band, x - (big ? 22 : 0) + dx, 12 + dy, z - 14 + dz - 6, false);
      });
    };
    hay(470, 1210, true); hay(650, 960, false); hay(1975, 980, false); hay(1760, 1210, true);
    // ổ gà: thùng gỗ + rơm + trứng
    const NX = 1865, NZ = 1040;
    add(new T.Mesh(boxGeo(150, 30, 56), lam('#8a5a32')), NX, 15, NZ);
    add(new T.Mesh(boxGeo(140, 6, 48), lam('#e9c46a')), NX, 31, NZ, false);
    const eggG = new T.SphereGeometry(7, 10, 8);
    for (let i = 0; i < 5; i++) { const e = new T.Mesh(eggG, lam('#fff4e6')); e.scale.set(1, 1.3, 1); add(e, NX - 50 + i * 25, 39, NZ); }
    [[-75], [75]].forEach(([dx]) => add(new T.Mesh(boxGeo(8, 70, 8), lam('#6b4423')), NX + dx, 35, NZ - 26));
    const roof = new T.Mesh(boxGeo(170, 8, 50), lam('#c2410c')); roof.rotation.x = 0.35; add(roof, NX, 72, NZ - 20);
    props = g;
    scene.add(g);
  }

  function bedGroup(o) {
    const { idx, bx, by } = o.bed, BD = ART.BED;
    let B = beds.get(idx);
    if (!B) {
      const g = new T.Group();
      const frame = new T.Mesh(boxGeo(BD.w + 8, 8, BD.h + 8), lam('#3d7a1e'));
      frame.position.set(bx + BD.w / 2, 4, by + BD.h / 2);
      frame.castShadow = true; frame.receiveShadow = true;
      g.add(frame);
      fence(g, bx - 6, by - 6, bx + BD.w + 6, by + BD.h + 6);
      const dirt = new T.Mesh(boxGeo(BD.w - 4, 4, BD.h - 4), lam('#a07a48'));
      dirt.position.set(bx + BD.w / 2, 9, by + BD.h / 2); dirt.receiveShadow = true;
      g.add(dirt);
      const tiles = [], crops = [];
      for (let k = 0; k < 12; k++) {
        const tx = bx + BD.padX + (k % 6) * BD.step, ty = by + BD.padY + Math.floor(k / 6) * BD.step;
        const t = new T.Mesh(boxGeo(BD.tile, 6, BD.tile), lam('#d8bd86'));
        t.position.set(tx + BD.tile / 2, 12, ty + BD.tile / 2);
        t.receiveShadow = true; t.castShadow = true;
        t.userData.pick = true;
        g.add(t); tiles.push(t);
        const mat = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, alphaTest: 0.05, side: T.DoubleSide });
        const cm = new T.Mesh(geoPlane, mat);
        cm.castShadow = true;
        cm.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, alphaTest: 0.5 });
        cm.userData.crop = { x: tx + BD.tile / 2, y: ty + BD.tile - 6 };
        cm.visible = false;
        g.add(cm); crops.push(cm);
      }
      const sign = new T.Mesh(geoPlane, new T.MeshBasicMaterial({ map: signTexture(), transparent: true, alphaTest: 0.05, depthWrite: false, side: T.DoubleSide }));
      sign.castShadow = true;
      sign.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: signTexture(), alphaTest: 0.5 });
      sign.userData.sign = { x: bx + BD.w / 2, y: by + BD.h / 2 + 20 };
      g.add(sign);
      scene.add(g);
      B = { g, tiles, crops, sign, dirt, sig: '', at: 0, data: [], owned: null };
      beds.set(idx, B);
    }
    return B;
  }
  function updateBed(o, B) {
    const F = AV.F(), { idx } = o.bed, owned = !!F.beds[idx];
    const now = performance.now();
    if (now - B.at >= 400 || !B.sig || owned !== B.owned) {
      B.at = now; B.owned = owned;
      const tiles = owned ? F.tiles.slice(idx * 12, idx * 12 + 12).map((x) => ({ crop: x.crop, st: AV.tileState(x), wet: x.watered, fert: x.fert, stolen: x.stolen })) : [];
      B.data = tiles;
      const sig = owned + '|' + tiles.map((q) => `${q.crop || ''}${q.st.stage}${q.st.thirsty ? 't' : ''}${q.wet ? 'w' : ''}`).join(',');
      if (sig !== B.sig) {
        B.sig = sig;
        B.tiles.forEach((t, k) => { t.visible = owned; const q = tiles[k]; if (q) t.material = lam(q.st.thirsty ? '#cdb27a' : q.crop && q.wet ? '#a87f4f' : '#d8bd86'); });
        B.dirt.material = lam(owned ? '#a07a48' : '#c9a66b');
        B.crops.forEach((cm, k) => {
          const q = tiles[k];
          if (owned && q && q.crop && q.st.stage >= 0) { cm.material.map = cropTexture(q.crop, q.st.stage); cm.material.needsUpdate = true; cm.customDepthMaterial.map = cm.material.map; cm.customDepthMaterial.needsUpdate = true; cm.visible = true; } else cm.visible = false;
        });
        B.sign.visible = !owned;
      }
    }
    // cây + biển quay về camera
    const U = camUp();
    B.crops.forEach((cm) => {
      if (!cm.visible) return;
      const { x, y } = cm.userData.crop, lift = (84 / 2 - 8) + 12;
      cm.quaternion.copy(cam.quaternion); cm.scale.set(60, 84, 1);
      cm.position.set(x + U.x * lift, 12 + U.y * lift, y + U.z * lift);
      cm.renderOrder = depthOf(x, y);
    });
    if (B.sign.visible) {
      const { x, y } = B.sign.userData.sign, lift = 50;
      B.sign.quaternion.copy(cam.quaternion); B.sign.scale.set(100, 70, 1);
      B.sign.position.set(x + U.x * lift, 10 + U.y * lift, y + U.z * lift);
      B.sign.renderOrder = depthOf(x, y);
    }
  }

  /* ---------- vẽ 1 khung hình ---------- */
  function render(o) {
    const { map, cx, cy, W, H, ZOOM, DPR, night, items, paint } = o;
    frameNo++;
    if (curMap !== map) {
      bills.forEach((b) => { scene.remove(b.mesh); b.tex.dispose(); b.mesh.material.dispose(); });
      bills.clear();
      beds.forEach((B) => scene.remove(B.g)); beds.clear();
      curMap = map;
      buildProps(map);
    }
    setGround(map);
    const d = Math.min(2, DPR);
    if (renderer.getPixelRatio() !== d) renderer.setPixelRatio(d);
    const sz = renderer.getSize(new T.Vector2());
    if (sz.x !== W || sz.y !== H) renderer.setSize(W, H);
    const hw = W / 2 / ZOOM, hh = H / 2 / ZOOM;
    cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh; cam.updateProjectionMatrix();
    tgt.x = cx; tgt.z = cy;
    const Dd = 8000;
    cam.position.set(cx + Dd * Math.cos(PITCH) * Math.sin(YAW), Dd * Math.sin(PITCH), cy + Dd * Math.cos(PITCH) * Math.cos(YAW));
    cam.lookAt(cx, 0, cy);
    cam.updateMatrixWorld();
    // nắng chiếu từ sau-trái → bóng đổ ra trước-phải
    sun.position.set(cx - 900, 1500, cy - 1000);
    sun.target.position.set(cx, 0, cy);
    const sc = sun.shadow.camera, ext = Math.max(hw, hh) * 1.7;
    sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 10; sc.far = 8000; sc.updateProjectionMatrix();
    sun.intensity = 0.78 * (1 - night * 0.85);
    hemi.intensity = 0.62 - night * 0.36;
    hemi.color.setRGB(1 - night * 0.45, 0.945 - night * 0.3, 0.84 + night * 0.1);
    const tint = new T.Color(1 - night * 0.5, 1 - night * 0.45, 1 - night * 0.2);
    const L = (map.lights || []).filter((l) => l[3] !== 'hw' || AV.hw()).map((l) => [l, Math.hypot(l[0] - cx, l[1] - cy)]).sort((a, b) => a[1] - b[1]).slice(0, lamps.length);
    lamps.forEach((p, i) => { const l = L[i]; if (l && night > 0.05) { p.position.set(l[0][0], 90, l[0][1] + 40); p.intensity = night * 1.5; p.distance = l[0][2] * 5; } else p.intensity = 0; });

    const seen = new Set();
    beds.forEach((B) => { B.g.visible = false; });
    for (const it of items) {
      if (it.bed) { const B = bedGroup(it); updateBed(it, B); B.g.visible = true; continue; }
      if (it.hide3d) continue;
      if (!it.bb) continue;
      const bb = it.bb, s = Math.min(2, DPR * ZOOM, 2048 / Math.max(1, bb[2] - bb[0]), 2048 / Math.max(1, bb[3] - bb[1]));
      const w = Math.max(2, Math.ceil((bb[2] - bb[0]) * s)), h = Math.max(2, Math.ceil((bb[3] - bb[1]) * s));
      const key = it.key || it;
      const b = bill(key, w, h);
      const due = !b.painted || it.repaint || (!it.s && (it.ent || frameNo - b.last >= 4));
      if (it.repaint) it.repaint = false;
      if (due) {
        b.c.setTransform(1, 0, 0, 1, 0, 0);
        b.c.clearRect(0, 0, w, h);
        b.c.setTransform(w / (bb[2] - bb[0]), 0, 0, h / (bb[3] - bb[1]), -bb[0] * w / (bb[2] - bb[0]), -bb[1] * h / (bb[3] - bb[1]));
        paint(it, b.c);
        b.tex.needsUpdate = true; b.painted = true; b.last = frameNo;
      }
      place(b, bb, it.y, !!it.flat);
      b.mesh.material.color.copy(tint);
      b.mesh.visible = true;
      seen.add(key);
    }
    bills.forEach((b, k) => { if (!seen.has(k)) b.mesh.visible = false; });
    if (map.lake) { const tt = performance.now() / 1000; ducks.forEach((d) => { const a = d.userData.a + tt * 0.25; d.position.set(map.lake.x + Math.cos(a) * d.userData.r, 6 + Math.sin(tt * 3 + a) * 1.5, map.lake.y + Math.sin(a) * d.userData.r * 0.55); d.rotation.y = -a - Math.PI / 2; }); }
    scene.background = new T.Color(night > 0.5 ? 0x0b1730 : 0xbfe0ee);
    renderer.render(scene, cam);
  }

  /* ---------- chuyển đổi toạ độ ---------- */
  const _v = () => new T.Vector3();
  /** điểm (x, y mặt đất, cao h) → điểm màn hình (px CSS) */
  function toScreen(x, y, h, W, H) {
    // cao h tính dọc theo tấm hình (nghiêng theo camera) để tên / bong bóng nằm đúng trên đầu nhân vật
    const U = camUp(), hh = h || 0;
    const v = _v().set(x + U.x * hh, U.y * hh, y + U.z * hh).project(cam);
    return { x: (v.x + 1) / 2 * W, y: (1 - v.y) / 2 * H };
  }
  function ndc(clientX, clientY) { const r = renderer.domElement.getBoundingClientRect(); return new T.Vector2((clientX - r.left) / r.width * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1); }
  /** điểm mặt đất dưới con trỏ */
  function pickGround(clientX, clientY) {
    ray.setFromCamera(ndc(clientX, clientY), cam);
    const o = ray.ray.origin, dd = ray.ray.direction;
    if (Math.abs(dd.y) < 1e-6) return null;
    const t = -o.y / dd.y;
    return { x: o.x + dd.x * t, y: o.z + dd.z * t };
  }
  /** bấm chuột → điểm 2D tương ứng (trúng tấm hình thì lấy đúng điểm trên hình) */
  function pick(clientX, clientY) {
    if (!on || !renderer) return null;
    ray.setFromCamera(ndc(clientX, clientY), cam);
    const meshes = [];
    bills.forEach((b) => { if (b.mesh.visible && !b.flat) meshes.push(b.mesh); });
    beds.forEach((B) => { if (B.g.visible) B.tiles.forEach((t) => t.visible && meshes.push(t)); });
    const hits = ray.intersectObjects(meshes, false);
    for (const h of hits) {
      const b = h.object.userData.bill;
      if (b && h.uv) {
        const px = Math.floor(h.uv.x * b.w), py = Math.floor((1 - h.uv.y) * b.h);
        let a = 255;
        try { a = b.c.getImageData(Math.min(b.w - 1, px), Math.min(b.h - 1, py), 1, 1).data[3]; } catch (e) { /* bỏ qua */ }
        if (a < 30) continue;
        return { x: b.bb[0] + h.uv.x * (b.bb[2] - b.bb[0]), y: b.bb[1] + (1 - h.uv.y) * (b.bb[3] - b.bb[1]) };
      }
      if (h.object.userData.pick) return { x: h.point.x, y: h.point.z };
    }
    return pickGround(clientX, clientY);
  }
  /** lớp hiệu ứng luống (sâu, khát nước, lấp lánh) — vẽ từng ô theo đúng vị trí 3D */
  function bedOverlays(at, ctx, t) {
    const BD = ART.BED;
    beds.forEach((B) => {
      if (!B.g.visible || !B.owned || !B.data.length) return;
      const o = curMap.objects.find((q) => q.bed && beds.get(q.bed.idx) === B);
      if (!o) return;
      B.data.forEach((q, k) => {
        if (!q.st || !(q.st.pest || q.st.thirsty || q.st.stage === 2)) return;
        const tx = o.bed.bx + BD.padX + (k % 6) * BD.step + BD.tile / 2, ty = o.bed.by + BD.padY + Math.floor(k / 6) * BD.step;
        at(tx, ty + BD.tile / 2, 30, () => ART.bed(ctx, o.bed.bx, o.bed.by, true, 0, B.data.map((x, i) => (i === k ? x : { st: {} })), t, 'over'));
      });
    });
  }
  function cycle() {
    const st = AV.S.settings = AV.S.settings || {};
    const was = wanted();
    st.r3d = was ? 'off' : 'on';
    AV.markChanged();
    UI.toast(was ? '🖼️ Đã chuyển về đồ hoạ 2D' : '🧊 Đã bật đồ hoạ 3D (thử nghiệm) cho Nông trại', 3500);
    syncBtn();
  }
  let btn = null;
  function syncBtn() {
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'r3d-btn'; btn.title = 'Đổi đồ hoạ 2D / 3D';
      btn.onclick = cycle;
      document.body.appendChild(btn);
    }
    const m = AV.debugMap && AV.debugMap();
    btn.style.display = supports(m) ? 'block' : 'none';
    btn.textContent = wanted() ? '🖼️ 2D' : '🧊 3D';
  }
  setInterval(syncBtn, 1000);
  return { active, render, bedOverlays, supports, wanted, cycle, pick, pickGround, toScreen, get on() { return on; } };
})();
