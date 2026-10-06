/* Nhân vật pixel sprite (phong cách game Java đời cũ): ghép các lớp PNG trong sprites/atlas.png, đổi màu da/tóc/áo/quần theo bảng màu */
const PX = (() => {
  let meta = null, atlas = null, ready = false;
  const frameCache = new Map(), compCache = new Map();
  const ORDER = ['shadow', 'back', 'base', 'bottom', 'shoes', 'top', 'neck', 'hair', 'face', 'hat'];
  const LEGACY_TOP = { plain: 'tee_plain', stripes: 'tee_stripe', star: 'tee_star', heart: 'tee_heart', overall: 'overall', dress: 'dress', dress_flower: 'dress_flower', princess: 'princess', vampire: 'vampire', witchdress: 'witchdress' };
  const DRESSY = { dress: 1, dress_flower: 1, princess: 1, witchdress: 1, cute: 1 };
  const FX_OF = { thunder: 'thunder', armor: 'legend' };
  const BASE_SCALE = 1.85;

  function load() {
    fetch('sprites/atlas.json').then((r) => r.json()).then((m) => {
      meta = m;
      const img = new Image();
      img.onload = () => { atlas = img; ready = true; };
      img.src = 'sprites/atlas.png';
    }).catch(() => { /* không tải được thì dùng hình vẽ cũ */ });
  }

  const hexRgb = (h) => { const s = String(h || '#000000').replace('#', ''); return [parseInt(s.slice(0, 2), 16) || 0, parseInt(s.slice(2, 4), 16) || 0, parseInt(s.slice(4, 6), 16) || 0]; };
  const shade = (h, amt) => hexRgb(h).map((v) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt)));
  /** 3 tông (gốc, bóng, sáng) cho từng nhóm đổi màu */
  function tones(look) {
    const sk = look.skin || '#ffd9b8', hc = look.hairColor || '#4a3226', sh = look.shirt || '#e8463c', pa = look.pants || '#4767c4';
    return {
      skin: [hexRgb(sk), shade(sk, -0.13)],
      hair: [hexRgb(hc), shade(hc, -0.38), shade(hc, 0.28)],
      shirt: [hexRgb(sh), shade(sh, -0.25), shade(sh, 0.3)],
      pants: [hexRgb(pa), shade(pa, -0.3), shade(pa, 0.4)],
    };
  }

  /** Một khung của một món, đã đổi màu (nếu món đó đổi màu được) */
  function frame(id, fi, tn) {
    const it = meta.items[id];
    const idx = it.f[Math.min(fi, it.f.length - 1)];
    const rc = it.rc && tn[it.rc];
    const key = id + ':' + idx + (rc ? ':' + rc.join('|') : '');
    let c = frameCache.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = meta.w; c.height = meta.h;
    const g = c.getContext('2d');
    g.drawImage(atlas, (idx % meta.cols) * meta.w, Math.floor(idx / meta.cols) * meta.h, meta.w, meta.h, 0, 0, meta.w, meta.h);
    if (rc) {
      const from = meta.groups[it.rc].map(hexRgb);
      const d = g.getImageData(0, 0, meta.w, meta.h), p = d.data;
      for (let i = 0; i < p.length; i += 4) {
        if (!p[i + 3]) continue;
        for (let k = 0; k < from.length; k++) {
          const f = from[k];
          if (p[i] === f[0] && p[i + 1] === f[1] && p[i + 2] === f[2]) { const t = rc[k]; p[i] = t[0]; p[i + 1] = t[1]; p[i + 2] = t[2]; break; }
        }
      }
      g.putImageData(d, 0, 0);
    }
    frameCache.set(key, c);
    return c;
  }

  /** Danh sách món đang mặc theo `look` (tương thích kiểu áo / mũ / trang sức cũ) */
  function resolve(look) {
    const has = (id) => meta.items[id];
    const ids = ['shadow', 'base'];
    const topKey = look.top || LEGACY_TOP[look.shirtStyle] || 'tee_plain';
    const dressy = DRESSY[topKey];
    if (has('top_' + topKey)) ids.push('top_' + topKey);
    const bot = look.bottom || (dressy ? '' : 'jeans');
    if (bot && has('bottom_' + bot)) ids.push('bottom_' + bot);
    const sh = look.shoes || (dressy ? 'maryjane' : 'sneaker');
    if (has('shoes_' + sh)) ids.push('shoes_' + sh);
    if (look.hair && look.hair !== 'bald') { ids.push(has('hair_' + look.hair) ? 'hair_' + look.hair : 'hair_short'); if (look.hair === 'long') ids.push('hairback_long'); }
    if (look.hat && look.hat !== 'none' && has('hat_' + look.hat)) ids.push('hat_' + look.hat);
    if (look.acc === 'wings') ids.push('back_wings');
    else if (look.acc && look.acc !== 'none' && has('acc_' + look.acc)) ids.push('acc_' + look.acc);
    if (look.back && has('back_' + look.back)) ids.push('back_' + look.back);
    if (topKey === 'vampire') ids.push('back_cape_vampire');
    return { ids: ids.sort((a, b) => ORDER.indexOf(meta.items[a].layer) - ORDER.indexOf(meta.items[b].layer)), fx: FX_OF[topKey] || null };
  }

  /** Ghép cả nhân vật vào 1 canvas 32x56 (có bộ nhớ đệm) */
  function compose(look, fi) {
    const key = JSON.stringify([look.skin, look.hair, look.hairColor, look.shirt, look.shirtStyle, look.pants, look.hat, look.acc, look.top, look.bottom, look.shoes, look.back, fi]);
    let e = compCache.get(key);
    if (e) return e;
    const r = resolve(look), tn = tones(look);
    const c = document.createElement('canvas');
    c.width = meta.w; c.height = meta.h;
    const g = c.getContext('2d');
    r.ids.forEach((id) => g.drawImage(frame(id, fi, tn), 0, 0));
    e = { c, fx: r.fx };
    if (compCache.size > 400) compCache.clear();
    compCache.set(key, e);
    return e;
  }

  /** Vẽ nhân vật: (x, y) = điểm giữa gót chân, giống ART.character */
  function draw(ctx, x, y, look, o = {}) {
    const t = o.t || 0;
    const sc = (o.scale ?? 1.18) * BASE_SCALE;
    const fi = o.moving ? [1, 0, 2, 0][Math.floor(t * 7) % 4] : 0;
    const e = compose(look, fi);
    let lift = 0;
    if (o.dance) lift = Math.round(Math.abs(Math.sin(t * 7)) * 3);
    else if (o.moving && fi) lift = 1;
    const dir = o.dance ? (Math.sin(t * 4) > 0 ? 1 : -1) : (o.dir || 1);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(x, y - lift * sc);
    if (dir < 0) ctx.scale(-1, 1);
    if (e.fx === 'legend') aura(ctx, sc, t, true);
    ctx.drawImage(e.c, -meta.ax * sc, -meta.ay * sc, meta.w * sc, meta.h * sc);
    if (e.fx) sparks(ctx, sc, t, e.fx);
    ctx.restore();
  }

  /** Hiệu ứng pixel: tia điện (Thần Sấm), hào quang + đốm lửa vàng (Rồng Vàng) */
  function px(ctx, sc, gx, gy, col) { ctx.fillStyle = col; ctx.fillRect(Math.round(gx) * sc - 16 * sc, Math.round(gy) * sc - 47 * sc, sc, sc); }
  function aura(ctx, sc, t) {
    const a = 0.18 + 0.08 * Math.sin(t * 3);
    ctx.fillStyle = `rgba(255,212,59,${a})`;
    for (let gy = 4; gy <= 46; gy += 1) {
      const half = Math.round(12 + Math.sin(gy * 0.35 + t * 2) * 1.5 - Math.max(0, (gy - 34) * 0.3));
      ctx.fillRect((16 - half) * sc - 16 * sc, gy * sc - 47 * sc, half * 2 * sc, sc);
    }
  }
  function sparks(ctx, sc, t, kind) {
    const n = kind === 'legend' ? 7 : 6;
    for (let i = 0; i < n; i++) {
      const ph = (t * (kind === 'legend' ? 0.6 : 2.2) + i * 0.37) % 1;
      const seed = Math.sin(i * 12.9898 + Math.floor(t * (kind === 'legend' ? 0.6 : 2.2) + i * 0.37) * 78.233) * 43758.5453;
      const rx = (seed - Math.floor(seed));
      if (kind === 'legend') {
        const gx = 4 + rx * 24, gy = 44 - ph * 40;
        px(ctx, sc, gx, gy, ph < 0.5 ? '#fff59a' : '#ffa62b');
        if (ph < 0.3) px(ctx, sc, gx, gy + 1, '#ffd43b');
      } else {
        if (ph > 0.55) continue;
        const gx = rx < 0.5 ? 3 + rx * 10 : 19 + (rx - 0.5) * 20, gy = 12 + ((i * 7) % 28);
        const col = ph < 0.25 ? '#fff59a' : '#67e8f9';
        px(ctx, sc, gx, gy, col); px(ctx, sc, gx + 1, gy + 1, col); px(ctx, sc, gx, gy + 2, col);
      }
    }
  }

  load();
  return { draw, get ready() { return ready; }, resolve: (look) => (meta ? resolve(look) : null) };
})();
