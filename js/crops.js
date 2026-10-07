/* 🌾 Cây chín trông như thật: vẽ chi tiết (đổ bóng, bóng loáng, gân lá) một lần thành ảnh rồi dùng lại → không lag */
const CROPS_ART = (() => {
  const S = 6, BW = 44, BH = 52, OX = 22, OY = 42;            // khung vẽ (đơn vị cây) + độ nét
  const cache = {};
  const TAU = Math.PI * 2;

  /* ---------- nét vẽ dùng chung ---------- */
  function rg(c, x, y, r, stops) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    return g;
  }
  function ball(c, x, y, r, light, mid, dark) { c.fillStyle = rg(c, x, y, r, [[0, light], [0.55, mid], [1, dark]]); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function shine(c, x, y, r, a = 0.75) { c.fillStyle = `rgba(255,255,255,${a})`; c.beginPath(); c.ellipse(x - r * 0.38, y - r * 0.42, r * 0.3, r * 0.16, -0.6, 0, TAU); c.fill(); }
  /** lá hình mũi mác mọc từ (x,y) theo góc ang (0 = thẳng lên) */
  function leaf(c, x, y, len, w, ang, col = '#40c057', dark = '#2b8a3e') {
    c.save(); c.translate(x, y); c.rotate(ang);
    const g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, dark); g.addColorStop(0.5, col); g.addColorStop(1, dark);
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(w, -len * 0.45, 0, -len); c.quadraticCurveTo(-w, -len * 0.45, 0, 0); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.3; c.beginPath(); c.moveTo(0, -0.5); c.lineTo(0, -len * 0.92); c.stroke();
    c.restore();
  }
  function stem(c, pts, col = '#2f9e44', w = 0.9) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(pts[0], pts[1]); if (pts.length === 4) c.lineTo(pts[2], pts[3]); else c.quadraticCurveTo(pts[2], pts[3], pts[4], pts[5]); c.stroke(); }
  function soil(c, w = 11) { c.fillStyle = 'rgba(80,50,20,.35)'; c.beginPath(); c.ellipse(0, 1.5, w, 3, 0, 0, TAU); c.fill(); }
  function calyx(c, x, y, r, col = '#2b8a3e') { c.fillStyle = col; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? r * 0.35 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.6); } c.closePath(); c.fill(); }

  /* ---------- từng loại cây ---------- */
  const D = {
    wheat(c) { // lúa chín vàng trĩu bông
      soil(c, 13);
      [[-10, -0.5], [10, 0.5], [-6, -0.25], [6, 0.3]].forEach(([x0, a]) => leaf(c, x0 * 0.3, 1, 18, 1.4, a, '#c0c45a', '#8a8f2e'));
      const st = [[-8, -0.26], [-5.5, -0.16], [-3, -0.08], [-0.5, -0.02], [2, 0.05], [4.5, 0.13], [7, 0.22], [9, 0.3], [0.5, -0.06], [-2, 0.02]];
      st.forEach(([x0, a], i) => {
        const h = 24 + ((i * 5) % 7), tx = x0 + Math.sin(a) * h * 0.55, ty = -h, dir = a >= 0 ? 1 : -1;
        stem(c, [x0 * 0.35, 2, x0 * 0.8, -h * 0.5, tx, ty], '#c99a2e', 0.6);
        for (let k = 0; k < 9; k++) {                                           // bông lúa cong rủ xuống
          const u = k / 8, gx = tx + dir * u * 6.5, gy = ty + u * u * 9 - u * 1.5;
          for (const side of [-1, 1]) {
            c.save(); c.translate(gx + side * 0.9, gy); c.rotate(dir * 0.5 + side * 0.4);
            const g = c.createLinearGradient(-0.9, 0, 0.9, 0); g.addColorStop(0, '#b8860b'); g.addColorStop(0.5, '#ffd54f'); g.addColorStop(1, '#c99a2e');
            c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 1.05, 1.9, 0, 0, TAU); c.fill();
            c.restore();
          }
        }
      });
    },
    carrot(c) {
      soil(c, 9);
      for (let k = -2; k <= 2; k++) {                                           // ngọn lá lông chim
        const a = k * 0.32, len = 20 - Math.abs(k) * 2, ex = Math.sin(a) * len, ey = -6 - Math.cos(a) * len;
        stem(c, [0, -6, ex * 0.5, (ey - 6) / 2, ex, ey], '#2f9e44', 0.6);
        for (let s = 0.35; s <= 1; s += 0.13) { const px = ex * s, py = -6 + (ey + 6) * s; [-1, 1].forEach((sd) => leaf(c, px, py, 3.2, 1.1, a + sd * 0.9, '#51cf66', '#2b8a3e')); }
      }
      const g = c.createLinearGradient(-5, 0, 5, 0); g.addColorStop(0, '#d9480f'); g.addColorStop(0.35, '#ff922b'); g.addColorStop(0.6, '#ffa94d'); g.addColorStop(1, '#d9480f');
      c.fillStyle = g; c.beginPath(); c.moveTo(-5, -5); c.quadraticCurveTo(-5.5, -8, 0, -8); c.quadraticCurveTo(5.5, -8, 5, -5); c.quadraticCurveTo(3.5, 3, 0.4, 10); c.quadraticCurveTo(-3.5, 3, -5, -5); c.fill();
      c.strokeStyle = 'rgba(160,60,10,.55)'; c.lineWidth = 0.35;
      [-3, 0, 3, 6].forEach((y) => { const w = 4.4 - (y + 5) * 0.28; c.beginPath(); c.moveTo(-w, y); c.quadraticCurveTo(0, y + 0.8, w * 0.6, y - 0.2); c.stroke(); });
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-2.4, -2, 0.8, 4, 0.1, 0, TAU); c.fill();
    },
    rose(c) { // hoa hồng đỏ + hồng
      soil(c, 10);
      stem(c, [-1, 2, -3, -12, -6, -22], '#2b8a3e', 0.9); stem(c, [1, 2, 3, -14, 6, -26], '#2b8a3e', 0.9); stem(c, [0, 2, 0, -8, 1, -14], '#2b8a3e', 0.9);
      [[-4, -8, -1.1], [4, -10, 1.1], [-5, -16, -0.9], [6, -18, 1], [2, -4, 0.7], [-2, -3, -0.6]].forEach(([x, y, a]) => leaf(c, x, y, 6.5, 2.6, a, '#37b24d', '#1b5e20'));
      c.fillStyle = '#5c2b0e'; [[-3.5, -14], [3.2, -18], [0.4, -9]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1, y - 0.4); c.lineTo(x, y + 0.6); c.fill(); });
      const flower = (x, y, r, [dark, mid, light]) => {
        for (let k = 0; k < 7; k++) { const a = k * TAU / 7 + 0.4; c.fillStyle = k % 2 ? dark : mid; c.beginPath(); c.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.42, r * 0.58, r * 0.42, a, 0, TAU); c.fill(); }
        ball(c, x, y - r * 0.12, r * 0.72, light, mid, dark);
        c.strokeStyle = dark; c.lineWidth = 0.4; c.beginPath();
        for (let s = 0; s < 16; s++) { const a = s * 0.75, rr = r * 0.06 + s * r * 0.032; const px = x + Math.cos(a) * rr, py = y - r * 0.2 + Math.sin(a) * rr * 0.75; if (s) c.lineTo(px, py); else c.moveTo(px, py); }
        c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 0.5; c.beginPath(); c.arc(x, y - r * 0.12, r * 0.6, 3.7, 5.6); c.stroke();
        calyx(c, x, y + r * 0.7, r * 0.5);
      };
      flower(-6, -23, 5.2, ['#a61e1e', '#e03131', '#ff8787']);
      flower(6, -27, 5.6, ['#a61e4d', '#e64980', '#ffb3cf']);
      flower(1, -16, 4.6, ['#9c1d2a', '#f03e3e', '#ffa8a8']);
    },
    strawberry(c) {
      soil(c, 12);
      const tri = (x, y, a) => { [-0.6, 0, 0.6].forEach((d) => { c.save(); c.translate(x, y); c.rotate(a + d); ball(c, 0, -3.6, 3.4, '#69db7c', '#2f9e44', '#1b5e20'); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 0.3; c.beginPath(); c.moveTo(0, -0.5); c.lineTo(0, -6.5); c.stroke(); c.restore(); }); };
      tri(-6, -9, -0.4); tri(6, -10, 0.4); tri(0, -15, 0);
      const berry = (x, y, s) => {
        stem(c, [x, y - 7 * s, x, y - 4 * s], '#2b8a3e', 0.5);
        c.fillStyle = rg(c, x, y, 5 * s, [[0, '#ff8787'], [0.5, '#f03e3e'], [1, '#a51111']]);
        c.beginPath(); c.moveTo(x, y + 5 * s); c.bezierCurveTo(x - 6 * s, y + 1 * s, x - 4.5 * s, y - 4.5 * s, x, y - 3.6 * s); c.bezierCurveTo(x + 4.5 * s, y - 4.5 * s, x + 6 * s, y + 1 * s, x, y + 5 * s); c.fill();
        c.fillStyle = '#ffe066'; for (let k = 0; k < 12; k++) { const px = x + ((k % 4) - 1.5) * 1.6 * s * (1 - Math.floor(k / 4) * 0.25), py = y - 1.5 * s + Math.floor(k / 4) * 2 * s; c.beginPath(); c.ellipse(px, py, 0.28 * s, 0.4 * s, 0, 0, TAU); c.fill(); }
        shine(c, x, y - 0.5 * s, 4 * s, 0.6);
        calyx(c, x, y - 3.6 * s, 3 * s, '#2f9e44');
      };
      berry(-6, -2, 1); berry(5, -4, 1.05); berry(0, 2, 0.9);
    },
    corn(c) {
      soil(c, 9);
      stem(c, [0, 2, 0, -36], '#5c940d', 1.8);
      [[0, -6, -1.2, 17], [0, -10, 1.15, 17], [0, -18, -1.05, 15], [0, -24, 1.0, 13], [0, -30, -0.9, 10]].forEach(([x, y, a, l]) => {
        c.save(); c.translate(x, y); c.rotate(a); const g = c.createLinearGradient(-1.5, 0, 1.5, 0); g.addColorStop(0, '#2b8a3e'); g.addColorStop(0.5, '#69db7c'); g.addColorStop(1, '#2b8a3e');
        c.fillStyle = g; c.beginPath(); c.moveTo(-1.4, 0); c.quadraticCurveTo(-1.5, -l * 0.6, l * 0.35 * Math.sign(a), -l); c.quadraticCurveTo(1.6, -l * 0.6, 1.4, 0); c.fill(); c.restore();
      });
      for (let k = -3; k <= 3; k++) stem(c, [0, -36, k * 1.4, -40 + Math.abs(k) * 0.6], '#d9a52b', 0.45);  // bông cờ
      c.save(); c.translate(3.6, -18); c.rotate(0.28);                      // bắp ngô lột vỏ
      c.fillStyle = '#74b816'; c.beginPath(); c.moveTo(-3.6, 6); c.quadraticCurveTo(-5.5, -2, -2, -9); c.lineTo(-1.2, 5); c.fill();
      c.fillStyle = '#94d82d'; c.beginPath(); c.moveTo(3.6, 6); c.quadraticCurveTo(5.5, -2, 2, -9); c.lineTo(1.2, 5); c.fill();
      c.fillStyle = rg(c, 0, 0, 5, [[0, '#fff3bf'], [0.5, '#fcc419'], [1, '#e67700']]); c.beginPath(); c.ellipse(0, -1.5, 3, 7.5, 0, 0, TAU); c.fill();
      for (let r = 0; r < 9; r++) for (let q = -1; q <= 1; q++) { const y = -7.5 + r * 1.7; const w = Math.sqrt(Math.max(0, 1 - ((y + 1.5) / 7.6) ** 2)) * 2.6; c.fillStyle = q ? '#f08c00' : '#ffe066'; c.beginPath(); c.ellipse(q * w * 0.62 + (r % 2) * 0.3, y, 0.75, 0.7, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#74b816'; c.beginPath(); c.moveTo(-3, 6.5); c.quadraticCurveTo(0, 2, 3, 6.5); c.lineTo(0, 9); c.fill();
      c.strokeStyle = '#a0522d'; c.lineWidth = 0.35; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 0.4, -9); c.quadraticCurveTo(k * 1.5, -11, k * 2.2, -10); c.stroke(); }
      c.restore();
    },
    pumpkin(c) {
      leaf(c, -8, -4, 11, 6, -1.0, '#40c057', '#1b5e20'); leaf(c, 9, -3, 9, 5, 1.1, '#51cf66', '#2b8a3e');
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, 2.5, 13, 3, 0, 0, TAU); c.fill();
      [[-8, 4.6], [8, 4.6], [-4.5, 5.4], [4.5, 5.4], [0, 5.8]].forEach(([dx, w]) => {
        c.fillStyle = rg(c, dx, -7, 11, [[0, '#ffc078'], [0.5, '#fd7e14'], [1, '#c2410c']]);
        c.beginPath(); c.ellipse(dx, -6.5, w, 8.5, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(150,50,0,.45)'; c.lineWidth = 0.4; c.stroke();
      });
      shine(c, -2, -9, 6, 0.4);
      c.strokeStyle = '#5c3d1e'; c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -14); c.quadraticCurveTo(0.5, -17, 2.6, -18); c.stroke();
      c.strokeStyle = '#2f9e44'; c.lineWidth = 0.4; c.beginPath(); for (let a = 0; a < 9; a += 0.3) { const r = 0.4 + a * 0.32; c.lineTo(3 + Math.cos(a) * r, -18 + Math.sin(a) * r); } c.stroke();
    },
    tomato(c) {
      soil(c, 8);
      c.strokeStyle = '#a47148'; c.lineWidth = 1; c.beginPath(); c.moveTo(-6, 3); c.lineTo(-6, -32); c.stroke();
      stem(c, [0, 2, -2, -14, 1, -30], '#2f9e44', 1);
      [[-1, -8, -1.1], [1, -12, 1.1], [0, -19, -1.0], [1, -24, 1.0], [0, -28, -0.6]].forEach(([x, y, a]) => { leaf(c, x, y, 7, 3, a, '#37b24d', '#1b5e20'); leaf(c, x, y, 4.5, 2, a * 0.4, '#40c057', '#2b8a3e'); });
      const tom = (x, y, r, ripe) => { ball(c, x, y, r, ripe ? '#ffa8a8' : '#d8f5a2', ripe ? '#f03e3e' : '#94d82d', ripe ? '#a51111' : '#5c940d'); shine(c, x, y, r); calyx(c, x, y - r * 0.85, r * 0.6, '#2b8a3e'); };
      tom(4, -10, 3.7, true); tom(-2, -6, 3.4, true); tom(5, -18, 3.2, true); tom(-1, -22, 2.8, false); tom(1.5, -3, 3, true);
    },
    potato(c) {
      [[-6, -6, -0.9], [6, -6, 0.9], [-3, -12, -0.4], [3, -12, 0.4], [0, -15, 0], [-8, -2, -1.3], [8, -2, 1.3]].forEach(([x, y, a]) => leaf(c, x * 0.3, y * 0.4, 9, 3.2, a, '#51cf66', '#2b8a3e'));
      [[-2, -16], [2, -17]].forEach(([x, y]) => { for (let k = 0; k < 5; k++) { const a = k * TAU / 5; c.fillStyle = '#f3f0ff'; c.beginPath(); c.ellipse(x + Math.cos(a) * 1, y + Math.sin(a) * 1, 0.9, 0.6, a, 0, TAU); c.fill(); } c.fillStyle = '#fcc419'; c.beginPath(); c.arc(x, y, 0.5, 0, TAU); c.fill(); });
      soil(c, 12);
      [[-6, 2, 4.8, 3.6, 0.2], [5, 3, 5, 3.4, -0.3], [0, 4.5, 4, 3, 0.1]].forEach(([x, y, w, h, a]) => {
        c.save(); c.translate(x, y); c.rotate(a);
        c.fillStyle = rg(c, 0, 0, w, [[0, '#f1d3a1'], [0.55, '#c99a5b'], [1, '#8a5a2b']]); c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, TAU); c.fill();
        c.fillStyle = '#6b4423'; [[-2, -1], [1.5, 0.5], [-0.5, 1.4], [2.4, -1.2]].forEach(([ex, ey]) => { c.beginPath(); c.ellipse(ex, ey, 0.45, 0.3, 0, 0, TAU); c.fill(); });
        c.restore();
      });
    },
    cucumber(c) {
      soil(c, 10);
      c.strokeStyle = '#c8a26a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-9, 3); c.lineTo(-7, -32); c.moveTo(9, 3); c.lineTo(7, -32); c.moveTo(-8.5, -24); c.lineTo(8.5, -24); c.moveTo(-8.8, -12); c.lineTo(8.8, -12); c.stroke();
      stem(c, [-2, 2, -6, -16, 2, -30], '#2f9e44', 0.8); stem(c, [2, 2, 6, -14, -2, -26], '#2f9e44', 0.8);
      const heart = (x, y, s, a) => { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = rg(c, 0, -2 * s, 4.5 * s, [[0, '#8ce99a'], [0.6, '#40c057'], [1, '#2b8a3e']]); c.beginPath(); c.moveTo(0, 2 * s); c.bezierCurveTo(-6 * s, -2 * s, -3 * s, -7 * s, 0, -4.5 * s); c.bezierCurveTo(3 * s, -7 * s, 6 * s, -2 * s, 0, 2 * s); c.fill(); c.restore(); };
      heart(-5, -18, 1, -0.3); heart(5, -22, 1, 0.3); heart(-3, -28, 0.8, 0); heart(4, -8, 0.9, 0.4);
      const cuc = (x, y, a, l) => {
        c.save(); c.translate(x, y); c.rotate(a);
        const g = c.createLinearGradient(-2.2, 0, 2.2, 0); g.addColorStop(0, '#1b4d2b'); g.addColorStop(0.45, '#40c057'); g.addColorStop(1, '#1b4d2b');
        c.fillStyle = g; c.beginPath(); c.ellipse(0, l / 2, 2.2, l / 2, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(216,245,162,.5)'; c.lineWidth = 0.35; [-0.9, 0.9].forEach((dx) => { c.beginPath(); c.moveTo(dx, 1); c.lineTo(dx, l - 1); c.stroke(); });
        c.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 1; k < 6; k++) { c.beginPath(); c.arc((k % 2 ? -1.4 : 1.2), k * l / 6.5, 0.25, 0, TAU); c.fill(); }
        c.fillStyle = '#fcc419'; c.beginPath(); c.arc(0, l, 0.8, 0, TAU); c.fill();
        c.restore();
      };
      cuc(-3, -16, 0.15, 12); cuc(3.5, -20, -0.1, 13);
      for (let k = 0; k < 5; k++) { const a = k * TAU / 5; c.fillStyle = '#ffd43b'; c.beginPath(); c.ellipse(-6 + Math.cos(a) * 1.3, -28 + Math.sin(a) * 1.3, 1.3, 0.8, a, 0, TAU); c.fill(); }
    },
    chili(c) {
      soil(c, 9);
      stem(c, [0, 2, 0, -20], '#2f9e44', 1);
      [[0, -6, -1.2], [0, -8, 1.2], [0, -13, -1], [0, -15, 1], [0, -19, -0.5], [0, -20, 0.5], [0, -10, 0]].forEach(([x, y, a]) => leaf(c, x, y, 8, 2.8, a, '#40c057', '#1b5e20'));
      const pep = (x, y, a, col) => {
        c.save(); c.translate(x, y); c.rotate(a);
        const g = c.createLinearGradient(-1.4, 0, 1.4, 0); g.addColorStop(0, col[2]); g.addColorStop(0.4, col[1]); g.addColorStop(1, col[2]);
        c.fillStyle = g; c.beginPath(); c.moveTo(-1.5, 0); c.quadraticCurveTo(-1.6, 6, 1.5, 9.5); c.quadraticCurveTo(0.6, 5, 1.5, 0); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(-0.9, 1, 0.4, 4);
        c.fillStyle = '#2b8a3e'; c.beginPath(); c.ellipse(0, -0.2, 1.8, 0.8, 0, 0, TAU); c.fill(); c.fillRect(-0.3, -2, 0.6, 2);
        c.restore();
      };
      const R = ['', '#e03131', '#9c1111'], G = ['', '#82c91e', '#2b8a3e'];
      pep(-5, -12, 0.3, R); pep(4, -14, -0.4, R); pep(-2, -8, 0.1, R); pep(6, -7, -0.6, R); pep(1, -17, 0.2, G); pep(-7, -6, 0.5, R);
    },
    cabbage(c) {
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(0, 1.5, 13, 3, 0, 0, TAU); c.fill();
      [-2.6, -1.6, -0.6, 0.6, 1.6, 2.6].forEach((a) => {                     // lá ngoài xoè
        c.save(); c.translate(0, -4); c.rotate(a);
        c.fillStyle = rg(c, 0, -7, 8, [[0, '#a9e34b'], [0.6, '#5c940d'], [1, '#2b5e10']]);
        c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-7, -2, -6, -12, 0, -12); c.bezierCurveTo(6, -12, 7, -2, 0, 0); c.fill();
        c.strokeStyle = 'rgba(235,255,210,.55)'; c.lineWidth = 0.35; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -11); for (let k = 3; k < 11; k += 3) { c.moveTo(0, -k); c.lineTo(-2.6, -k - 2); c.moveTo(0, -k); c.lineTo(2.6, -k - 2); } c.stroke();
        c.restore();
      });
      ball(c, 0, -7, 7.5, '#ebfbee', '#b2f2bb', '#69db7c');                // bắp cuộn
      c.strokeStyle = 'rgba(64,140,64,.55)'; c.lineWidth = 0.45;
      [[-1.5, -8, 5.5, 2.4, 4.2], [1.5, -6, 5.6, 4.0, 6.0], [0, -9, 3.5, 0.3, 2.9]].forEach(([x, y, r, a0, a1]) => { c.beginPath(); c.arc(x, y, r, a0, a1); c.stroke(); });
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.moveTo(0, -1); c.quadraticCurveTo(-1, -7, 0.5, -13); c.stroke();
    },
    grape(c) { // nho tím chùm to
      c.fillStyle = '#8b5a2b'; c.fillRect(-1, -34, 2, 37); c.fillRect(-15, -34, 30, 2);
      const gl = (x, y, s) => { c.fillStyle = rg(c, x, y, 6 * s, [[0, '#8ce99a'], [0.6, '#37b24d'], [1, '#1b5e20']]); c.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.75; c.arc(x + Math.cos(a) * 3 * s, y + Math.sin(a) * 3 * s, 2.6 * s, 0, TAU); } c.fill(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 0.3; c.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.75; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 5 * s, y + Math.sin(a) * 5 * s); } c.stroke(); };
      gl(-9, -30, 1); gl(9, -31, 1); gl(-3, -34, 0.8);
      stem(c, [1, -32, 2, -28, 1, -26], '#6b4423', 0.6);
      const rows = [6, 6, 5, 5, 4, 3, 2, 1];
      rows.forEach((n, r) => { for (let q = 0; q < n; q++) { const x = 1 + (q - (n - 1) / 2) * 2.6 + (r % 2) * 0.3, y = -25 + r * 2.4; ball(c, x, y, 1.55, '#b197fc', '#6741d9', '#2b1a6b'); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x - 0.5, y - 0.55, 0.38, 0, TAU); c.fill(); } });
      c.strokeStyle = '#2f9e44'; c.lineWidth = 0.35; c.beginPath(); for (let a = 0; a < 8; a += 0.3) { const r = 0.3 + a * 0.25; c.lineTo(-6 + Math.cos(a) * r, -24 + Math.sin(a) * r); } c.stroke();
    },
    banana(c) {
      soil(c, 8);
      const g = c.createLinearGradient(-2.5, 0, 2.5, 0); g.addColorStop(0, '#6b4f2a'); g.addColorStop(0.5, '#a9845a'); g.addColorStop(1, '#6b4f2a');
      c.fillStyle = g; c.beginPath(); c.moveTo(-2.6, 2); c.lineTo(-1.8, -26); c.lineTo(1.8, -26); c.lineTo(2.6, 2); c.fill();
      [[-1.5, -0.7, 20], [1.4, 0.75, 19], [-0.9, -0.25, 16], [0.8, 0.35, 17], [-2, -1.6, 14], [2, 1.6, 14]].forEach(([d, a, l]) => {
        c.save(); c.translate(0, -26); c.rotate(a);
        const lg = c.createLinearGradient(-3, 0, 3, 0); lg.addColorStop(0, '#2b8a3e'); lg.addColorStop(0.5, '#69db7c'); lg.addColorStop(1, '#2b8a3e');
        c.fillStyle = lg; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(4.2 * Math.sign(d || 1), -l * 0.5, 0, -l); c.quadraticCurveTo(-4.2 * Math.sign(d || 1), -l * 0.5, 0, 0); c.fill();
        c.strokeStyle = 'rgba(216,245,162,.8)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -l); c.stroke(); c.strokeStyle = 'rgba(20,80,30,.35)'; c.lineWidth = 0.25; c.beginPath(); for (let k = 3; k < l - 1; k += 1.6) { c.moveTo(0, -k); c.lineTo(3, -k - 1.8); c.moveTo(0, -k); c.lineTo(-3, -k - 1.8); } c.stroke();
        c.restore();
      });
      stem(c, [1.5, -24, 6, -20, 6.5, -10], '#6b4f2a', 0.8);
      for (let r = 0; r < 2; r++) for (let q = 0; q < 5; q++) {                 // nải chuối
        c.save(); c.translate(3.2 + q * 1.2, -21 + r * 4 + q * 0.5); c.rotate(-0.5 + q * 0.12);
        const bg = c.createLinearGradient(-1, 0, 1, 0); bg.addColorStop(0, '#e67700'); bg.addColorStop(0.5, '#ffe066'); bg.addColorStop(1, '#f59f00');
        c.fillStyle = bg; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-2.4, 3, -1.2, 6.4); c.quadraticCurveTo(0.2, 3, 1.1, 0); c.fill();
        c.fillStyle = '#5c3d1e'; c.beginPath(); c.arc(-1.2, 6.3, 0.4, 0, TAU); c.fill();
        c.restore();
      }
      c.fillStyle = rg(c, 6.5, -6, 2.5, [[0, '#e599f7'], [0.6, '#862e9c'], [1, '#4a1859']]); c.beginPath(); c.ellipse(6.6, -7, 1.6, 3, 0, 0, TAU); c.fill();
    },
    pineapple(c) {
      [-1.4, -0.9, 0.9, 1.4].forEach((a) => leaf(c, 0, 0, 10, 1.6, a, '#5c9e6c', '#2b5e3a'));
      soil(c, 8);
      c.fillStyle = rg(c, 0, -8, 9, [[0, '#ffe066'], [0.5, '#f59f00'], [1, '#a35400']]); c.beginPath(); c.ellipse(0, -8, 6.4, 9, 0, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.ellipse(0, -8, 6.4, 9, 0, 0, TAU); c.clip();
      c.strokeStyle = 'rgba(120,60,0,.55)'; c.lineWidth = 0.45;
      for (let k = -6; k <= 6; k++) { c.beginPath(); c.moveTo(-8, -8 + k * 2.6 - 6); c.lineTo(8, -8 + k * 2.6 + 6); c.moveTo(8, -8 + k * 2.6 - 6); c.lineTo(-8, -8 + k * 2.6 + 6); c.stroke(); }
      c.fillStyle = 'rgba(90,50,0,.6)'; for (let r = -3; r <= 3; r++) for (let q = -3; q <= 3; q++) { c.beginPath(); c.arc(q * 2.6 + (r % 2 ? 1.3 : 0), -8 + r * 2.6, 0.35, 0, TAU); c.fill(); }
      c.restore();
      shine(c, -1, -10, 6, 0.35);
      for (let k = -4; k <= 4; k++) leaf(c, k * 0.4, -16, 9 - Math.abs(k) * 0.8, 1.1, k * 0.22, '#69a87a', '#2b5e3a');
    },
    watermelon(c) { // dưa hấu sọc + miếng bổ đỏ
      leaf(c, -9, -3, 9, 4.5, -1.2, '#40c057', '#1b5e20'); leaf(c, 8, -10, 8, 4, 0.9, '#51cf66', '#2b8a3e');
      c.strokeStyle = '#2f9e44'; c.lineWidth = 0.4; c.beginPath(); for (let a = 0; a < 9; a += 0.3) { const r = 0.3 + a * 0.3; c.lineTo(-11 + Math.cos(a) * r, -10 + Math.sin(a) * r); } c.stroke();
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(-1, 2.5, 14, 3, 0, 0, TAU); c.fill();
      c.fillStyle = rg(c, -2, -7, 14, [[0, '#8ce99a'], [0.5, '#2f9e44'], [1, '#14401f']]); c.beginPath(); c.ellipse(-2, -5.5, 12.5, 8.5, 0, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.ellipse(-2, -5.5, 12.5, 8.5, 0, 0, TAU); c.clip();
      c.fillStyle = '#143d1e';
      [-9, -4.5, 0, 4.5, 9].forEach((x0) => {                             // sọc dưa uốn theo quả
        const pts = [];
        for (let y = -14.5; y <= 3.5; y += 0.6) { const f = Math.sqrt(Math.max(0, 1 - ((y + 5.5) / 8.6) ** 2)); pts.push([-2 + x0 * f * 1.15 + Math.sin(y * 1.7 + x0) * 0.55, y, 0.5 + 1.3 * f]); }
        c.beginPath(); pts.forEach(([x, y, w], i) => (i ? c.lineTo(x - w, y) : c.moveTo(x - w, y))); for (let i = pts.length - 1; i >= 0; i--) c.lineTo(pts[i][0] + pts[i][2], pts[i][1]); c.fill();
      });
      c.restore();
      shine(c, -4, -8, 9, 0.45);
      // miếng bổ sẵn
      c.save(); c.translate(9, 1); c.rotate(-0.15);
      c.fillStyle = '#2b8a3e'; c.beginPath(); c.arc(0, -0.5, 5.4, 0, Math.PI); c.fill();
      c.fillStyle = '#e9fac8'; c.beginPath(); c.arc(0, -0.5, 4.7, 0, Math.PI); c.fill();
      c.fillStyle = rg(c, 0, -0.5, 4.5, [[0, '#ff8787'], [0.7, '#f03e3e'], [1, '#c92a2a']]); c.beginPath(); c.arc(0, -0.5, 4.2, 0, Math.PI); c.fill();
      c.fillStyle = '#111'; [[-2, 0.8], [0, 1.6], [2, 0.8], [-1, 2.6], [1, 2.6]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 0.35, 0.55, x * 0.2, 0, TAU); c.fill(); });
      c.restore();
    },
    ginseng(c) {
      stem(c, [0, 0, 0, -18], '#2f9e44', 0.9);
      [[-0.9, -14], [0.9, -14]].forEach(([a, y]) => { for (let k = -2; k <= 2; k++) leaf(c, Math.sign(a) * 2, y, 6.5 - Math.abs(k), 1.8, a + k * 0.35, '#51cf66', '#2b8a3e'); });
      for (let k = 0; k < 14; k++) { const a = k * 2.4, r = Math.sqrt(k) * 0.9; ball(c, Math.cos(a) * r, -21 + Math.sin(a) * r * 0.8, 0.95, '#ff8787', '#e03131', '#8b0000'); }
      soil(c, 9);
      c.fillStyle = rg(c, 0, 2, 6, [[0, '#fff4dc'], [0.6, '#e9c98a'], [1, '#b08950']]);
      c.beginPath(); c.moveTo(-3, -1); c.quadraticCurveTo(0, -3, 3, -1); c.quadraticCurveTo(4, 3, 6, 7); c.lineTo(3.5, 5); c.quadraticCurveTo(2, 7, 1, 10); c.lineTo(0, 5.5); c.quadraticCurveTo(-2, 8, -4.5, 9); c.lineTo(-2.4, 4); c.quadraticCurveTo(-4, 2, -3, -1); c.fill();
      c.strokeStyle = 'rgba(140,100,50,.6)'; c.lineWidth = 0.3; [0, 1.5, 3].forEach((y) => { c.beginPath(); c.moveTo(-2.5, y); c.lineTo(2.8, y + 0.4); c.stroke(); });
    },
  };

  /* ---------- hoa ---------- */
  function flowerHead(c, crop, x, y, s) {
    const fc = DATA.CROPS[crop];
    if (crop === 'tulip') {
      const g = c.createLinearGradient(x - 4 * s, 0, x + 4 * s, 0); g.addColorStop(0, '#a61e4d'); g.addColorStop(0.45, fc.petal); g.addColorStop(1, '#c2255c');
      c.fillStyle = g; c.beginPath(); c.moveTo(x - 4 * s, y - 4 * s); c.lineTo(x - 2 * s, y - 1 * s); c.lineTo(x, y - 5.5 * s); c.lineTo(x + 2 * s, y - 1 * s); c.lineTo(x + 4 * s, y - 4 * s);
      c.bezierCurveTo(x + 4.5 * s, y + 3 * s, x + 2 * s, y + 4.5 * s, x, y + 4.5 * s); c.bezierCurveTo(x - 2 * s, y + 4.5 * s, x - 4.5 * s, y + 3 * s, x - 4 * s, y - 4 * s); c.fill();
      c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(x - 1.8 * s, y + 0.5 * s, 0.6 * s, 2.4 * s, 0.1, 0, TAU); c.fill();
      return;
    }
    if (crop === 'sunflower') {
      for (let ring = 0; ring < 2; ring++) for (let k = 0; k < 16; k++) { const a = k * TAU / 16 + ring * 0.2; c.fillStyle = ring ? '#ffd43b' : '#f59f00'; c.beginPath(); c.ellipse(x + Math.cos(a) * 4.6 * s, y + Math.sin(a) * 4.6 * s, 2.6 * s, 0.95 * s, a, 0, TAU); c.fill(); }
      ball(c, x, y, 3.4 * s, '#a0522d', '#5c3317', '#2b1708');
      c.fillStyle = 'rgba(255,200,80,.45)'; for (let k = 0; k < 30; k++) { const a = k * 2.4, r = Math.sqrt(k) * 0.55 * s; c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 0.25 * s, 0, TAU); c.fill(); }
      return;
    }
    if (crop === 'hibiscus') {
      for (let k = 0; k < 5; k++) { const a = k * TAU / 5 - Math.PI / 2; c.save(); c.translate(x + Math.cos(a) * 3 * s, y + Math.sin(a) * 3 * s); c.rotate(a + Math.PI / 2); c.fillStyle = rg(c, 0, 1.5 * s, 4 * s, [[0, '#ff8fa3'], [0.55, fc.petal], [1, '#a4133c']]); c.beginPath(); c.ellipse(0, 0, 3 * s, 3.6 * s, 0, 0, TAU); c.fill(); c.restore(); }
      ball(c, x, y, 1.6 * s, '#ff4d6d', '#800f2f', '#4d0a1c');
      c.strokeStyle = '#ffe3e3'; c.lineWidth = 0.4 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 4 * s, y - 5 * s); c.stroke();
      c.fillStyle = fc.heart; c.beginPath(); c.arc(x + 4 * s, y - 5 * s, 0.7 * s, 0, TAU); c.fill();
      return;
    }
    // hoa cúc
    for (let ring = 0; ring < 2; ring++) for (let k = 0; k < 14; k++) { const a = k * TAU / 14 + ring * 0.22; c.fillStyle = ring ? fc.petal : '#f2c230'; c.beginPath(); c.ellipse(x + Math.cos(a) * 2.8 * s, y + Math.sin(a) * 2.8 * s, 2 * s, 0.7 * s, a, 0, TAU); c.fill(); }
    ball(c, x, y, 1.5 * s, '#ffc078', fc.heart, '#a33f04');
  }
  ['daisy', 'tulip', 'sunflower', 'hibiscus'].forEach((id) => {
    D[id] = (c) => {
      soil(c, 9);
      const big = id === 'sunflower';
      const heads = big ? [[0, -32, 1.05]] : id === 'hibiscus' ? [[-5, -18, 1], [5, -24, 1]] : [[-5, -18, 0.9], [5, -21, 0.95], [0, -26, 0.9]];
      heads.forEach(([x, y]) => stem(c, [0, 2, x * 0.4, y * 0.5, x, y], '#2f9e44', big ? 1.4 : 0.7));
      (big ? [[0, -10, -1.1], [0, -14, 1.1], [0, -22, -1.0]] : id === 'tulip' ? [[-1, 1, -0.5], [1, 1, 0.45]] : [[-1, -4, -1.0], [1, -6, 1.0], [0, -12, -0.7], [0, -13, 0.8]])
        .forEach(([x, y, a]) => leaf(c, x, y, id === 'tulip' ? 16 : big ? 9 : 7, id === 'tulip' ? 2.2 : big ? 4.2 : 2.8, a, id === 'hibiscus' ? '#2f9e44' : '#40c057', '#1b5e20'));
      heads.forEach(([x, y, s]) => flowerHead(c, id, x, y, big ? 1.35 : s));
    };
  });

  /* cây mới: bụi lá + quả vẽ bằng biểu tượng (rõ ràng, nhẹ máy) */
  const NEW = { garlic: ['#8ce99a', 'tall'], eggplant: ['#2f9e44', 'bush'], peanut: ['#51cf66', 'low'], sweetpotato: ['#5c940d', 'vine'], broccoli: ['#2b8a3e', 'low'], mushroom: ['#8a5a32', 'none'], lemon: ['#37b24d', 'bush'], avocado: ['#2b8a3e', 'bush'] };
  Object.entries(NEW).forEach(([id, [col, shape]]) => {
    D[id] = (c) => {
      soil(c, 12);
      if (shape === 'tall') [[-3, -0.25], [0, 0], [3, 0.25], [-1, -0.1], [1.5, 0.12]].forEach(([x, a]) => leaf(c, x, 0, 20, 1.6, a, col, '#2b8a3e'));
      else if (shape === 'bush') [[-6, -6, -1], [6, -6, 1], [-3, -12, -0.5], [3, -13, 0.5], [0, -16, 0]].forEach(([x, y, a]) => leaf(c, x, y + 6, 11, 4.2, a, col, '#1b5e20'));
      else if (shape === 'low') [[-7, -1.1], [7, 1.1], [-3, -0.4], [3, 0.4]].forEach(([x, a]) => leaf(c, x * 0.5, 0, 10, 4.5, a, col, '#1b5e20'));
      else if (shape === 'vine') { [[-8, -1.3], [8, 1.3], [-4, -0.6], [4, 0.6], [0, 0]].forEach(([x, a]) => leaf(c, x * 0.4, 0, 9, 4.6, a, col, '#2b5d0a')); }
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.globalAlpha = 1;
      const icon = DATA.CROPS[id].icon;
      const spots = shape === 'none' ? [[-5, -6, 11], [5, -5, 10], [0, -12, 12]] : shape === 'low' || shape === 'vine' ? [[-6, -4, 11], [6, -3, 11]] : shape === 'tall' ? [[0, -2, 11]] : [[-6, -12, 9], [6, -14, 9], [0, -20, 9]];
      spots.forEach(([x, y, s]) => { c.font = s + 'px system-ui, "Segoe UI Emoji", sans-serif'; c.fillText(icon, x, y); });
    };
  });
  function sprite(crop) {
    if (crop in cache) return cache[crop];
    const fn = D[crop];
    if (!fn || typeof document === 'undefined') return (cache[crop] = null);
    const cv = document.createElement('canvas');
    cv.width = BW * S; cv.height = BH * S;
    const c = cv.getContext('2d');
    c.scale(S, S); c.translate(OX, OY);
    try { fn(c); } catch (e) { return (cache[crop] = null); }
    return (cache[crop] = cv);
  }
  /** cây cao thu nhỏ lại cho khỏi đè sang ô phía trên */
  const FIT = { wheat: 0.85, corn: 0.8, sunflower: 0.76, banana: 0.8, grape: 0.84, cucumber: 0.86, tomato: 0.9, rose: 0.9, chili: 0.95 };
  /** Vẽ cây chín (có đung đưa nhẹ). Trả về false nếu loại cây này chưa có hình mới. */
  function draw(ctx, x, y, crop, t) {
    const cv = sprite(crop);
    if (!cv) return false;
    const sway = Math.sin(t * 2) * 0.03;
    ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -sway, 1, 0, 0);
    const k = FIT[crop] || 1;
    ctx.drawImage(cv, -OX * k, -OY * k, BW * k, BH * k);
    ctx.restore();
    return true;
  }
  return { draw, sprite, list: () => Object.keys(D) };
})();

/* cây chín (stage 2) dùng hình mới, cây non giữ hình cũ */
(() => {
  const old = ART.plant;
  ART.plant = function (ctx, x, y, crop, stage, t) {
    if (stage === 2 && CROPS_ART.draw(ctx, x, y, crop, t)) return;
    return old(ctx, x, y, crop, stage, t);
  };
})();
