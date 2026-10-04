/* Hiệu ứng kiểu Avatar: viền đậm quanh hình (outline) + bộ nhớ đệm sprite tĩnh */
var ART_CAPTURE = null;

const FX = (() => {
  const OUTLINE = '#2b1a10';
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const A = mk(256, 256), B = mk(256, 256);
  const ensure = (c, w, h) => { if (c.width < w || c.height < h) { c.width = Math.max(c.width, w); c.height = Math.max(c.height, h); } };
  const OFFS = [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1], [-2, -1], [2, -1], [-2, 1], [2, 1]];

  /** Vẽ drawFn (toạ độ thế giới quanh x,y) vào bộ đệm rồi thêm viền. Trả về thông tin để dán ra màn hình. */
  function render(drawFn, x, y, box) {
    const pad = 4;
    const w = Math.ceil(box.w) + pad * 2, h = Math.ceil(box.h) + pad * 2;
    ensure(A, w, h); ensure(B, w, h);
    const a = A.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0);
    a.clearRect(0, 0, A.width, A.height);
    a.setTransform(1, 0, 0, 1, pad - (x + box.l), pad - (y + box.t));
    const shadows = [];
    ART_CAPTURE = shadows;
    try { drawFn(a); } finally { ART_CAPTURE = null; }
    for (const s of shadows) { s[0] -= pad - (x + box.l); s[1] -= pad - (y + box.t); }
    const b = B.getContext('2d');
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.clearRect(0, 0, B.width, B.height);
    b.imageSmoothingEnabled = false;
    for (const [dx, dy] of OFFS) b.drawImage(A, 0, 0, w, h, dx, dy, w, h);
    b.globalCompositeOperation = 'source-in';
    b.fillStyle = OUTLINE;
    b.fillRect(0, 0, w, h);
    b.globalCompositeOperation = 'source-over';
    b.drawImage(A, 0, 0, w, h, 0, 0, w, h);
    return { w, h, ox: x + box.l - pad, oy: y + box.t - pad, shadows };
  }

  function drawShadows(ctx, shadows) {
    for (const [sx, sy, rx, ry, al] of shadows) {
      ctx.fillStyle = `rgba(0,0,0,${al})`;
      ctx.beginPath(); ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  /** Vẽ có viền ngay trong khung hình (dùng cho nhân vật, con vật, vật thể chuyển động) */
  function drawOutlined(ctx, drawFn, x, y, box) {
    const r = render(drawFn, x, y, box);
    drawShadows(ctx, r.shadows);
    // xoá viền 1px quanh vùng dùng để khi thu nhỏ không lấy nhầm điểm ảnh cũ
    const b = B.getContext('2d');
    b.clearRect(r.w, 0, 2, r.h + 2); b.clearRect(0, r.h, r.w + 2, 2);
    ctx.drawImage(B, 0, 0, r.w, r.h, r.ox, r.oy, r.w, r.h);
  }

  /** Vẽ có viền nhưng chỉ vẽ lại sau mỗi interval ms; giữa các lần đó dùng lại hình cũ ở vị trí mới */
  const live = new WeakMap();
  function drawCached(ctx, key, drawFn, x, y, box, interval) {
    const now = performance.now();
    let e = live.get(key);
    if (!e || now - e.t > interval) {
      const r = render(drawFn, x, y, box);
      if (!e) { e = { c: mk(r.w, r.h) }; live.set(key, e); }
      if (e.c.width < r.w || e.c.height < r.h) { e.c.width = Math.max(e.c.width, r.w); e.c.height = Math.max(e.c.height, r.h); }
      const cc = e.c.getContext('2d');
      cc.clearRect(0, 0, e.c.width, e.c.height);
      cc.drawImage(B, 0, 0, r.w, r.h, 0, 0, r.w, r.h);
      e.w = r.w; e.h = r.h; e.rx = r.ox - x; e.ry = r.oy - y;
      e.sh = r.shadows.map((s) => [s[0] - x, s[1] - y, s[2], s[3], s[4]]);
      e.t = now;
    }
    for (const [sx, sy, rx, ry, al] of e.sh) {
      ctx.fillStyle = `rgba(0,0,0,${al})`;
      ctx.beginPath(); ctx.ellipse(x + sx, y + sy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.drawImage(e.c, 0, 0, e.w, e.h, x + e.rx, y + e.ry, e.w, e.h);
  }

  /** Tạo sprite tĩnh có viền, vẽ một lần rồi dùng lại */
  function sprite(drawFn, x, y, box) {
    let cache = null;
    return (ctx) => {
      if (!cache) {
        const r = render(drawFn, x, y, box);
        const c = mk(r.w, r.h);
        c.getContext('2d').drawImage(B, 0, 0, r.w, r.h, 0, 0, r.w, r.h);
        cache = { c, ...r };
      }
      drawShadows(ctx, cache.shadows);
      ctx.drawImage(cache.c, cache.ox, cache.oy);
    };
  }

  const BOX = {
    character: { l: -55, t: -150, w: 110, h: 158 },
    chicken: { l: -28, t: -42, w: 56, h: 46 },
    cow: { l: -48, t: -66, w: 100, h: 70 },
    sheep: { l: -38, t: -58, w: 74, h: 62 },
    pig: { l: -38, t: -56, w: 76, h: 60 },
    pet: { l: -32, t: -46, w: 64, h: 50 },
    object: { l: -150, t: -215, w: 300, h: 235 },
  };

  return { render, drawOutlined, drawCached, sprite, BOX };
})();
