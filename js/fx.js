/* Hiệu ứng kiểu Avatar: viền đậm quanh hình (outline) + bộ nhớ đệm sprite, vẽ theo đúng độ phân giải màn hình cho sắc nét */
var ART_CAPTURE = null;

const FX = (() => {
  const OUTLINE = '#2b1a10';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; };
  const A = mk(256, 256), B = mk(256, 256);
  const ensure = (c, w, h) => { if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); } };
  let SCALE = 1;
  let gen = 0;

  /** Đặt độ phân giải vẽ sprite (= DPR × zoom). Đổi scale sẽ vẽ lại toàn bộ sprite tĩnh. */
  function setScale(s) {
    const v = Math.max(1, Math.min(3, Math.round(s * 4) / 4));
    if (v !== SCALE) { SCALE = v; gen++; }
  }

  function offsets() {
    const o = Math.max(1, Math.round(1.6 * SCALE));
    const d = Math.max(1, Math.round(1.1 * SCALE));
    return [[-o, 0], [o, 0], [0, -o], [0, o], [-d, -d], [d, -d], [-d, d], [d, d]];
  }

  /** Vẽ drawFn (toạ độ thế giới quanh x,y) vào bộ đệm rồi thêm viền. Kết quả nằm trong canvas B. */
  function render(drawFn, x, y, box) {
    const s = SCALE, pad = 4;
    const w = Math.ceil(box.w) + pad * 2, h = Math.ceil(box.h) + pad * 2;
    const W = Math.ceil(w * s), H = Math.ceil(h * s);
    ensure(A, W + 4, H + 4); ensure(B, W + 4, H + 4);
    const a = A.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0);
    a.clearRect(0, 0, A.width, A.height);
    const tx = (pad - (x + box.l)) * s, ty = (pad - (y + box.t)) * s;
    a.setTransform(s, 0, 0, s, tx, ty);
    const shadows = [];
    ART_CAPTURE = shadows;
    try { drawFn(a); } finally { ART_CAPTURE = null; }
    for (const sh of shadows) { sh[0] = (sh[0] - tx) / s; sh[1] = (sh[1] - ty) / s; sh[2] /= s; sh[3] /= s; }
    const b = B.getContext('2d');
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.clearRect(0, 0, B.width, B.height);
    b.imageSmoothingEnabled = false;
    for (const [dx, dy] of offsets()) b.drawImage(A, 0, 0, W, H, dx, dy, W, H);
    b.globalCompositeOperation = 'source-in';
    b.fillStyle = OUTLINE;
    b.fillRect(0, 0, W + 4, H + 4);
    b.globalCompositeOperation = 'source-over';
    b.imageSmoothingEnabled = true;
    b.drawImage(A, 0, 0, W, H, 0, 0, W, H);
    return { W, H, w: W / s, h: H / s, ox: x + box.l - pad, oy: y + box.t - pad, shadows };
  }

  function drawShadows(ctx, shadows, dx = 0, dy = 0) {
    for (const [sx, sy, rx, ry, al] of shadows) {
      ctx.fillStyle = `rgba(0,0,0,${al})`;
      ctx.beginPath(); ctx.ellipse(sx + dx, sy + dy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  function snapshot(r) {
    const c = mk(r.W, r.H);
    c.getContext('2d').drawImage(B, 0, 0, r.W, r.H, 0, 0, r.W, r.H);
    return c;
  }

  /** Vẽ có viền ngay trong khung hình */
  function drawOutlined(ctx, drawFn, x, y, box) {
    const r = render(drawFn, x, y, box);
    drawShadows(ctx, r.shadows);
    ctx.drawImage(B, 0, 0, r.W, r.H, r.ox, r.oy, r.w, r.h);
  }

  /** Vẽ có viền nhưng chỉ vẽ lại sau mỗi interval ms; giữa các lần đó dùng lại hình cũ ở vị trí mới */
  const live = new WeakMap();
  function drawCached(ctx, key, drawFn, x, y, box, interval) {
    const now = performance.now();
    let e = live.get(key);
    if (!e || e.gen !== gen || now - e.t > interval) {
      const r = render(drawFn, x, y, box);
      if (!e) { e = { c: mk(r.W, r.H) }; live.set(key, e); }
      if (e.c.width < r.W || e.c.height < r.H) { e.c.width = Math.max(e.c.width, r.W); e.c.height = Math.max(e.c.height, r.H); }
      const cc = e.c.getContext('2d');
      cc.clearRect(0, 0, e.c.width, e.c.height);
      cc.drawImage(B, 0, 0, r.W, r.H, 0, 0, r.W, r.H);
      Object.assign(e, { W: r.W, H: r.H, w: r.w, h: r.h, rx: r.ox - x, ry: r.oy - y, t: now, gen });
      e.sh = r.shadows.map((s) => [s[0] - x, s[1] - y, s[2], s[3], s[4]]);
    }
    drawShadows(ctx, e.sh, x, y);
    ctx.drawImage(e.c, 0, 0, e.W, e.H, x + e.rx, y + e.ry, e.w, e.h);
  }

  /** Sprite tĩnh có viền: vẽ một lần (vẽ lại khi đổi độ phân giải) */
  function sprite(drawFn, x, y, box) {
    let cache = null;
    return (ctx) => {
      if (!cache || cache.gen !== gen) {
        const r = render(drawFn, x, y, box);
        cache = { c: snapshot(r), ...r, gen };
      }
      drawShadows(ctx, cache.shadows);
      ctx.drawImage(cache.c, 0, 0, cache.W, cache.H, cache.ox, cache.oy, cache.w, cache.h);
    };
  }

  const BOX = {
    character: { l: -55, t: -150, w: 110, h: 158 },
    chicken: { l: -28, t: -42, w: 56, h: 46 },
    cow: { l: -48, t: -66, w: 100, h: 70 },
    sheep: { l: -38, t: -58, w: 74, h: 62 },
    pig: { l: -38, t: -56, w: 76, h: 60 },
    pet: { l: -40, t: -58, w: 80, h: 62 },
    object: { l: -150, t: -215, w: 300, h: 235 },
  };

  return { render, drawOutlined, drawCached, sprite, setScale, BOX, get scale() { return SCALE; } };
})();
