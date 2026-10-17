/* ♟️ PHÒNG CỜ trong Nhà Casino: Cờ Vua · Cờ Tướng · Cờ Vây (9×9) · Cờ Cá Ngựa · Cờ Tỷ Phú · Hải Chiến.
 * Mỗi trò: đấu với máy (Dễ / Vừa / Khó, có cược xu), chơi chung 1 máy, hoặc mời người cùng khu chơi online (mỗi bên cược bằng nhau, thắng ăn cả).
 * Mỗi trò khai báo: init · legal (nước đi hợp lệ của bên tới lượt) · apply (trả về thế cờ mới) · status (thắng/hoà) · ai · draw · hit (toạ độ → ô). */
const BOARD = (() => {
  const S = () => AV.S;
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LV = ['😊 Dễ', '😤 Vừa', '🔥 Khó'], BETS = [0, 1000, 5000, 20000, 100000];
  const FONT = (n, w = 900) => `${w} ${n}px "Be Vietnam Pro", system-ui, sans-serif`;
  const rnd = (n) => Math.floor(Math.random() * n);

  /** tìm kiếm negamax + cắt tỉa alpha-beta trên nước đi "giả hợp lệ" (ăn được vua/tướng là thắng ngay) */
  function search(G, s, depth, alpha, beta, ply) {
    if (depth === 0) return G.evaluate(s);
    const moves = G.pseudo(s);
    if (!moves.length) return -50000 + ply;
    moves.sort((a, b) => (b.cap || 0) - (a.cap || 0));
    let best = -Infinity;
    for (const m of moves) {
      if (m.kingCap) return 100000 - ply;
      const v = -search(G, G.apply(s, m), depth - 1, -beta, -alpha, ply + 1);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  }
  function bestMove(G, s, lv) {
    const moves = G.legal(s);
    if (!moves.length) return null;
    const depth = [1, 2, 3][lv], noise = [90, 25, 4][lv];
    let best = null, bv = -Infinity;
    moves.sort((a, b) => (b.cap || 0) - (a.cap || 0));
    for (const m of moves) {
      const v = -search(G, G.apply(s, m), depth - 1, -Infinity, Infinity, 1) + Math.random() * noise;
      if (v > bv) { bv = v; best = m; }
    }
    return best;
  }

  /* ======================================================================
   * ♚ CỜ VUA — đủ luật: nhập thành, bắt tốt qua đường, phong hậu (tự lên Hậu), chiếu bí, hết nước (hoà)
   * ô = hàng*8 + cột, hàng 0 ở trên (bên Đen). Bên 0 = Trắng đi trước.
   * ==================================================================== */
  const CHESS = (() => {
    const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    const sideOf = (p) => (p === '.' ? -1 : p === p.toUpperCase() ? 0 : 1);
    const N8 = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]], K8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]], ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    function attacked(b, sq, by) {
      const r = sq >> 3, c = sq & 7, at = (rr, cc) => (rr < 0 || rr > 7 || cc < 0 || cc > 7 ? null : b[rr * 8 + cc]);
      const own = (p, t) => p && p !== '.' && sideOf(p) === by && p.toLowerCase() === t;
      const pr = by === 0 ? r + 1 : r - 1;
      if (own(at(pr, c - 1), 'p') || own(at(pr, c + 1), 'p')) return true;
      for (const [dr, dc] of N8) if (own(at(r + dr, c + dc), 'n')) return true;
      for (const [dr, dc] of K8) if (own(at(r + dr, c + dc), 'k')) return true;
      for (const [dirs, ts] of [[DIAG, 'bq'], [ORTH, 'rq']]) for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const p = b[rr * 8 + cc]; if (p !== '.') { if (sideOf(p) === by && ts.includes(p.toLowerCase())) return true; break; } rr += dr; cc += dc; }
      }
      return false;
    }
    function pseudo(s) {
      const b = s.b, side = s.side, out = [];
      const push = (f, t, extra) => { const cp = b[t]; out.push({ f, t, cap: cp !== '.' ? VAL[cp.toLowerCase()] + 10 : 0, kingCap: cp.toLowerCase() === 'k', ...extra }); };
      for (let f = 0; f < 64; f++) {
        const p = b[f]; if (p === '.' || sideOf(p) !== side) continue;
        const r = f >> 3, c = f & 7, t = p.toLowerCase();
        const free = (rr, cc) => rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === '.';
        const enemy = (rr, cc) => rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] !== '.' && sideOf(b[rr * 8 + cc]) !== side;
        if (t === 'p') {
          const d = side === 0 ? -1 : 1, last = side === 0 ? 0 : 7, start = side === 0 ? 6 : 1;
          if (free(r + d, c)) { push(f, (r + d) * 8 + c, r + d === last ? { promo: true } : {}); if (r === start && free(r + 2 * d, c)) push(f, (r + 2 * d) * 8 + c, { dbl: true }); }
          for (const dc of [-1, 1]) { if (enemy(r + d, c + dc)) push(f, (r + d) * 8 + c + dc, r + d === last ? { promo: true } : {}); else if (s.ep === (r + d) * 8 + c + dc && c + dc >= 0 && c + dc < 8) out.push({ f, t: s.ep, ep: true, cap: 110 }); }
        } else if (t === 'n' || t === 'k') {
          for (const [dr, dc] of t === 'n' ? N8 : K8) if (free(r + dr, c + dc) || enemy(r + dr, c + dc)) push(f, (r + dr) * 8 + c + dc);
          if (t === 'k') {
            const home = side === 0 ? 60 : 4, opp = 1 - side, K = side === 0 ? 'K' : 'k', Q = side === 0 ? 'Q' : 'q';
            if (f === home && !attacked(b, f, opp)) {
              if (s.cs.includes(K) && b[f + 1] === '.' && b[f + 2] === '.' && !attacked(b, f + 1, opp) && !attacked(b, f + 2, opp)) out.push({ f, t: f + 2, castle: 'k', cap: 0 });
              if (s.cs.includes(Q) && b[f - 1] === '.' && b[f - 2] === '.' && b[f - 3] === '.' && !attacked(b, f - 1, opp) && !attacked(b, f - 2, opp)) out.push({ f, t: f - 2, castle: 'q', cap: 0 });
            }
          }
        } else {
          const dirs = t === 'b' ? DIAG : t === 'r' ? ORTH : [...DIAG, ...ORTH];
          for (const [dr, dc] of dirs) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { if (b[rr * 8 + cc] === '.') push(f, rr * 8 + cc); else { if (sideOf(b[rr * 8 + cc]) !== side) push(f, rr * 8 + cc); break; } rr += dr; cc += dc; } }
        }
      }
      return out;
    }
    function apply(s, m) {
      const b = s.b.slice(), p = b[m.f], side = s.side;
      let cs = s.cs;
      const captured = b[m.t] !== '.' || m.ep;
      b[m.t] = m.promo ? (side === 0 ? 'Q' : 'q') : p; b[m.f] = '.';
      if (m.ep) b[m.t + (side === 0 ? 8 : -8)] = '.';
      if (m.castle === 'k') { b[m.f + 1] = b[m.f + 3]; b[m.f + 3] = '.'; }
      if (m.castle === 'q') { b[m.f - 1] = b[m.f - 4]; b[m.f - 4] = '.'; }
      if (p === 'K') cs = cs.replace('K', '').replace('Q', ''); if (p === 'k') cs = cs.replace('k', '').replace('q', '');
      [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']].forEach(([sq, k]) => { if (m.f === sq || m.t === sq) cs = cs.replace(k, ''); });
      return { b, side: 1 - side, cs, ep: m.dbl ? (m.f + m.t) / 2 : -1, half: p.toLowerCase() === 'p' || captured ? 0 : s.half + 1 };
    }
    const kingSq = (b, side) => b.indexOf(side === 0 ? 'K' : 'k');
    const inCheck = (s, side) => attacked(s.b, kingSq(s.b, side), 1 - side);
    const legal = (s) => pseudo(s).filter((m) => { const n = apply(s, m); return kingSq(n.b, s.side) >= 0 && !attacked(n.b, kingSq(n.b, s.side), n.side); });
    function status(s) {
      if (!legal(s).length) return inCheck(s, s.side) ? { winner: 1 - s.side, why: '♚ Chiếu bí!' } : { winner: -1, why: '🤝 Hết nước đi — hoà' };
      if (s.half >= 100) return { winner: -1, why: '🤝 50 nước không ăn quân — hoà' };
      if (s.b.every((p) => p === '.' || p.toLowerCase() === 'k')) return { winner: -1, why: '🤝 Chỉ còn 2 vua — hoà' };
      return null;
    }
    function evaluate(s) {
      let v = 0;
      for (let i = 0; i < 64; i++) {
        const p = s.b[i]; if (p === '.') continue;
        const t = p.toLowerCase(), sd = sideOf(p), r = i >> 3, c = i & 7, adv = sd === 0 ? 7 - r : r;
        let x = VAL[t];
        if (t === 'p') x += adv * 7 + (c >= 2 && c <= 5 ? adv * 3 : 0);
        if (t === 'n' || t === 'b') x += 14 - (Math.abs(3.5 - r) + Math.abs(3.5 - c)) * 4;
        if (t === 'k') x += adv === 0 && (c <= 2 || c >= 6) ? 20 : 0;
        v += sd === s.side ? x : -x;
      }
      return v;
    }
    const GLYPH = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
    return {
      id: 'chess', name: 'Cờ Vua', icon: '♟️', cols: 8, rows: 8, sides: ['Trắng', 'Đen'],
      rules: 'Luật quốc tế: nhập thành, bắt tốt qua đường, tốt xuống cuối bàn tự lên <b>Hậu</b>. Chiếu bí vua đối phương là thắng.',
      init: () => ({ b: 'rnbqkbnrpppppppp................................PPPPPPPPRNBQKBNR'.split(''), side: 0, cs: 'KQkq', ep: -1, half: 0 }),
      turn: (s) => s.side, pseudo, legal, apply, status, evaluate,
      ai: (s, lv) => bestMove(CHESS, s, lv),
      pieceSide: (s, cell) => sideOf(s.b[cell]),
      movesFrom: (s, cell) => legal(s).filter((m) => m.f === cell),
      checkSq: (s) => (inCheck(s, s.side) ? kingSq(s.b, s.side) : -1),
      hit(x, y, W, H, flip) { const c = Math.floor(x / (W / 8)), r = Math.floor(y / (H / 8)); if (c < 0 || c > 7 || r < 0 || r > 7) return -1; return flip ? (7 - r) * 8 + (7 - c) : r * 8 + c; },
      draw(g, W, H, s, v) {
        const q = W / 8, pos = (i) => { let r = i >> 3, c = i & 7; if (v.flip) { r = 7 - r; c = 7 - c; } return [c * q, r * q]; };
        for (let i = 0; i < 64; i++) { const [x, y] = pos(i); g.fillStyle = ((i >> 3) + (i & 7)) % 2 ? '#b58863' : '#f0d9b5'; g.fillRect(x, y, q, q); }
        if (v.last) for (const i of [v.last.f, v.last.t]) { const [x, y] = pos(i); g.fillStyle = 'rgba(255,212,59,.45)'; g.fillRect(x, y, q, q); }
        const ck = CHESS.checkSq(s); if (ck >= 0) { const [x, y] = pos(ck); const gr = g.createRadialGradient(x + q / 2, y + q / 2, 2, x + q / 2, y + q / 2, q * 0.7); gr.addColorStop(0, 'rgba(255,0,0,.85)'); gr.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, q, q); }
        if (v.sel >= 0) { const [x, y] = pos(v.sel); g.fillStyle = 'rgba(105,219,124,.55)'; g.fillRect(x, y, q, q); }
        g.textAlign = 'center'; g.textBaseline = 'middle';
        for (let i = 0; i < 64; i++) {
          const p = s.b[i]; if (p === '.') continue;
          const [x, y] = pos(i), white = sideOf(p) === 0;
          g.font = `${q * 0.82}px "Segoe UI Symbol","Noto Sans Symbols 2","DejaVu Sans",serif`;
          g.lineWidth = q * 0.06; g.strokeStyle = white ? '#212529' : '#f8f9fa'; g.fillStyle = white ? '#fff' : '#212529';
          g.strokeText(GLYPH[p.toLowerCase()], x + q / 2, y + q * 0.54); g.fillText(GLYPH[p.toLowerCase()], x + q / 2, y + q * 0.54);
        }
        (v.targets || []).forEach((m) => { const [x, y] = pos(m.t); g.fillStyle = 'rgba(20,20,20,.28)'; g.beginPath(); if (s.b[m.t] !== '.') { g.lineWidth = q * 0.08; g.strokeStyle = 'rgba(20,20,20,.35)'; g.arc(x + q / 2, y + q / 2, q * 0.44, 0, Math.PI * 2); g.stroke(); } else { g.arc(x + q / 2, y + q / 2, q * 0.15, 0, Math.PI * 2); g.fill(); } });
        g.font = FONT(q * 0.18, 700); g.fillStyle = 'rgba(0,0,0,.45)';
        for (let k = 0; k < 8; k++) { const file = v.flip ? 7 - k : k, rank = v.flip ? k + 1 : 8 - k; g.textAlign = 'left'; g.fillText('abcdefgh'[file], k * q + 3, H - q * 0.12); g.textAlign = 'right'; g.fillText(rank, W - 3, k * q + q * 0.14); }
      },
    };
  })();

  /* ======================================================================
   * 🀄 CỜ TƯỚNG — bàn 9×10 giao điểm, bên Đỏ (0) ở dưới đi trước.
   * Đủ luật: tướng/sĩ trong cung, tượng không qua sông & bị cản mắt, mã bị cản chân, pháo cách 1 quân để ăn, tốt qua sông đi ngang, 2 tướng không được đối mặt.
   * ==================================================================== */
  const XQ = (() => {
    const VAL = { k: 0, a: 20, e: 20, h: 40, r: 90, c: 45, p: 10 };
    const sideOf = (p) => (p === '.' ? -1 : p === p.toUpperCase() ? 0 : 1);
    const inPal = (r, c, sd) => c >= 3 && c <= 5 && (sd === 0 ? r >= 7 : r <= 2);
    function pseudo(s) {
      const b = s.b, side = s.side, out = [];
      const ok = (r, c) => r >= 0 && r < 10 && c >= 0 && c < 9 && (b[r * 9 + c] === '.' || sideOf(b[r * 9 + c]) !== side);
      const push = (f, r, c) => { const t = r * 9 + c, cp = b[t]; out.push({ f, t, cap: cp !== '.' ? VAL[cp.toLowerCase()] + 10 : 0, kingCap: cp.toLowerCase() === 'k' }); };
      for (let f = 0; f < 90; f++) {
        const p = b[f]; if (p === '.' || sideOf(p) !== side) continue;
        const r = Math.floor(f / 9), c = f % 9, t = p.toLowerCase();
        if (t === 'k') { for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inPal(r + dr, c + dc, side) && ok(r + dr, c + dc)) push(f, r + dr, c + dc); }
        else if (t === 'a') { for (const [dr, dc] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) if (inPal(r + dr, c + dc, side) && ok(r + dr, c + dc)) push(f, r + dr, c + dc); }
        else if (t === 'e') { for (const [dr, dc] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) { const rr = r + dr, cc = c + dc; if (rr < 0 || rr > 9 || cc < 0 || cc > 8 || (side === 0 ? rr < 5 : rr > 4)) continue; if (b[(r + dr / 2) * 9 + c + dc / 2] !== '.') continue; if (ok(rr, cc)) push(f, rr, cc); } }
        else if (t === 'h') { for (const [dr, dc, lr, lc] of [[-2, -1, -1, 0], [-2, 1, -1, 0], [2, -1, 1, 0], [2, 1, 1, 0], [-1, -2, 0, -1], [1, -2, 0, -1], [-1, 2, 0, 1], [1, 2, 0, 1]]) { const rr = r + dr, cc = c + dc; if (rr < 0 || rr > 9 || cc < 0 || cc > 8) continue; if (b[(r + lr) * 9 + c + lc] !== '.') continue; if (ok(rr, cc)) push(f, rr, cc); } }
        else if (t === 'r' || t === 'c') {
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            let rr = r + dr, cc = c + dc, jumped = false;
            while (rr >= 0 && rr < 10 && cc >= 0 && cc < 9) {
              const q = b[rr * 9 + cc];
              if (t === 'r') { if (q === '.') push(f, rr, cc); else { if (sideOf(q) !== side) push(f, rr, cc); break; } }
              else if (!jumped) { if (q === '.') push(f, rr, cc); else jumped = true; }
              else if (q !== '.') { if (sideOf(q) !== side) push(f, rr, cc); break; }
              rr += dr; cc += dc;
            }
          }
        } else if (t === 'p') {
          const d = side === 0 ? -1 : 1, crossed = side === 0 ? r <= 4 : r >= 5;
          if (r + d >= 0 && r + d <= 9 && ok(r + d, c)) push(f, r + d, c);
          if (crossed) for (const dc of [-1, 1]) if (c + dc >= 0 && c + dc <= 8 && ok(r, c + dc)) push(f, r, c + dc);
        }
      }
      return out;
    }
    const apply = (s, m) => { const b = s.b.slice(); b[m.t] = b[m.f]; b[m.f] = '.'; return { b, side: 1 - s.side, n: (s.n || 0) + 1 }; };
    const kingSq = (b, sd) => b.indexOf(sd === 0 ? 'K' : 'k');
    function facing(b) {
      const a = kingSq(b, 0), k = kingSq(b, 1); if (a < 0 || k < 0 || a % 9 !== k % 9) return false;
      for (let i = k + 9; i < a; i += 9) if (b[i] !== '.') return false;
      return true;
    }
    function inCheck(s, side) {
      if (facing(s.b)) return true;
      const k = kingSq(s.b, side); if (k < 0) return true;
      return pseudo({ b: s.b, side: 1 - side }).some((m) => m.t === k);
    }
    const legal = (s) => pseudo(s).filter((m) => !inCheck(apply(s, m), s.side));
    function status(s) {
      if (!legal(s).length) return { winner: 1 - s.side, why: inCheck(s, s.side) ? '🀄 Chiếu hết!' : '🀄 Hết nước đi — thua' };
      if ((s.n || 0) >= 300) return { winner: -1, why: '🤝 Quá 300 nước — hoà' };
      return null;
    }
    function evaluate(s) {
      let v = facing(s.b) ? 100000 : 0; // tướng đối mặt: bên tới lượt ăn được tướng
      for (let i = 0; i < 90; i++) {
        const p = s.b[i]; if (p === '.') continue;
        const t = p.toLowerCase(), sd = sideOf(p), r = Math.floor(i / 9), c = i % 9;
        let x = VAL[t];
        if (t === 'p') { const cr = sd === 0 ? r <= 4 : r >= 5; if (cr) x += 10 + (4 - Math.abs(4 - c)) * 2; }
        if (t === 'h' || t === 'c') x += (4 - Math.abs(4 - c));
        v += sd === s.side ? x : -x;
      }
      return v;
    }
    const CH = { k: ['帥', '將'], a: ['仕', '士'], e: ['相', '象'], h: ['傌', '馬'], r: ['俥', '車'], c: ['炮', '砲'], p: ['兵', '卒'] };
    return {
      id: 'xiangqi', name: 'Cờ Tướng', icon: '🀄', cols: 9, rows: 10, sides: ['Đỏ', 'Đen'],
      rules: 'Bên <b>Đỏ</b> đi trước. Tướng & sĩ ở trong cung · tượng không qua sông · mã bị cản chân · pháo cách đúng 1 quân mới ăn · tốt qua sông được đi ngang · 2 tướng không được đối mặt. Chiếu hết là thắng.',
      init: () => ({ b: ('rheakaehr' + '.........' + '.c.....c.' + 'p.p.p.p.p' + '.........' + '.........' + 'P.P.P.P.P' + '.C.....C.' + '.........' + 'RHEAKAEHR').split(''), side: 0, n: 0 }),
      turn: (s) => s.side, pseudo, legal, apply, status, evaluate,
      ai: (s, lv) => bestMove(XQ, s, lv),
      pieceSide: (s, cell) => sideOf(s.b[cell]),
      movesFrom: (s, cell) => legal(s).filter((m) => m.f === cell),
      hit(x, y, W, H, flip) { const q = W / 9, c = Math.round(x / q - 0.5), r = Math.round(y / q - 0.5); if (c < 0 || c > 8 || r < 0 || r > 9) return -1; return flip ? (9 - r) * 9 + (8 - c) : r * 9 + c; },
      draw(g, W, H, s, v) {
        const q = W / 9, P = (i) => { let r = Math.floor(i / 9), c = i % 9; if (v.flip) { r = 9 - r; c = 8 - c; } return [(c + 0.5) * q, (r + 0.5) * q]; };
        g.fillStyle = '#f2cf8d'; g.fillRect(0, 0, W, H);
        g.strokeStyle = '#7a4a1e'; g.lineWidth = Math.max(1, q * 0.03);
        for (let r = 0; r < 10; r++) { g.beginPath(); g.moveTo(q / 2, (r + 0.5) * q); g.lineTo(W - q / 2, (r + 0.5) * q); g.stroke(); }
        for (let c = 0; c < 9; c++) for (const [r0, r1] of c === 0 || c === 8 ? [[0, 9]] : [[0, 4], [5, 9]]) { g.beginPath(); g.moveTo((c + 0.5) * q, (r0 + 0.5) * q); g.lineTo((c + 0.5) * q, (r1 + 0.5) * q); g.stroke(); }
        for (const r0 of [0, 7]) { g.beginPath(); g.moveTo(3.5 * q, (r0 + 0.5) * q); g.lineTo(5.5 * q, (r0 + 2.5) * q); g.moveTo(5.5 * q, (r0 + 0.5) * q); g.lineTo(3.5 * q, (r0 + 2.5) * q); g.stroke(); }
        g.font = FONT(q * 0.42, 800); g.fillStyle = 'rgba(122,74,30,.55)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SÔNG   HÀ', W / 2, 5 * q);
        if (v.last) for (const i of [v.last.f, v.last.t]) { const [x, y] = P(i); g.strokeStyle = '#2f9e44'; g.lineWidth = 3; g.strokeRect(x - q * 0.47, y - q * 0.47, q * 0.94, q * 0.94); }
        for (let i = 0; i < 90; i++) {
          const p = s.b[i]; if (p === '.') continue;
          const [x, y] = P(i), red = sideOf(p) === 0, rr = q * 0.44, sel = i === v.sel;
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x + 2, y + 3, rr, 0, Math.PI * 2); g.fill();
          g.fillStyle = sel ? '#d3f9d8' : '#fff4e0'; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill();
          g.strokeStyle = red ? '#c92a2a' : '#212529'; g.lineWidth = q * 0.05; g.stroke(); g.lineWidth = q * 0.025; g.beginPath(); g.arc(x, y, rr * 0.8, 0, Math.PI * 2); g.stroke();
          g.fillStyle = red ? '#c92a2a' : '#212529'; g.font = `900 ${q * 0.48}px "Microsoft YaHei","PingFang SC","Noto Sans CJK SC",serif`; g.fillText(CH[p.toLowerCase()][red ? 0 : 1], x, y + q * 0.02);
        }
        if (v.check >= 0) { const [x, y] = P(v.check); g.strokeStyle = '#ff0000'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, q * 0.5, 0, Math.PI * 2); g.stroke(); }
        (v.targets || []).forEach((m) => { const [x, y] = P(m.t); g.fillStyle = s.b[m.t] !== '.' ? 'rgba(224,49,49,.55)' : 'rgba(47,158,68,.65)'; g.beginPath(); g.arc(x, y, q * (s.b[m.t] !== '.' ? 0.18 : 0.13), 0, Math.PI * 2); g.fill(); });
      },
      checkSq: (s) => (inCheck(s, s.side) ? kingSq(s.b, s.side) : -1),
    };
  })();

  /* ======================================================================
   * ⚫ CỜ VÂY 9×9 — luật Trung Quốc (tính đất + quân), komi 6.5 cho Trắng. Đen (0) đi trước.
   * Cấm tự sát, cấm cướp lại ngay (ko). Hai bên cùng bỏ lượt thì đếm điểm.
   * ==================================================================== */
  const GO = (() => {
    const N = 9, KOMI = 6.5;
    const nb = (i) => { const r = Math.floor(i / N), c = i % N, o = []; if (r > 0) o.push(i - N); if (r < N - 1) o.push(i + N); if (c > 0) o.push(i - 1); if (c < N - 1) o.push(i + 1); return o; };
    const NB = Array.from({ length: N * N }, (_, i) => nb(i));
    function group(b, i) {
      const col = b[i], seen = new Set([i]), st = [i], libs = new Set();
      while (st.length) { const x = st.pop(); for (const y of NB[x]) { if (b[y] === 0) libs.add(y); else if (b[y] === col && !seen.has(y)) { seen.add(y); st.push(y); } } }
      return { stones: [...seen], libs };
    }
    /** đặt quân: trả về { b, caps } hoặc null nếu tự sát */
    function place(b0, i, col) {
      if (b0[i] !== 0) return null;
      const b = b0.slice(); b[i] = col; let caps = 0;
      for (const y of NB[i]) if (b[y] === 3 - col) { const gp = group(b, y); if (!gp.libs.size) { gp.stones.forEach((z) => { b[z] = 0; }); caps += gp.stones.length; } }
      if (!group(b, i).libs.size) return null;
      return { b, caps };
    }
    const key = (b) => b.join('');
    function legal(s) {
      const col = s.side + 1, out = [{ pass: true, p: -1 }];
      for (let i = 0; i < N * N; i++) { if (s.b[i]) continue; const r = place(s.b, i, col); if (r && key(r.b) !== s.prev) out.push({ p: i, caps: r.caps }); }
      return out;
    }
    function apply(s, m) {
      if (m.pass) return { ...s, side: 1 - s.side, passes: s.passes + 1, prev: key(s.b), n: s.n + 1 };
      const r = place(s.b, m.p, s.side + 1), cap = s.cap.slice(); cap[s.side] += r.caps;
      return { b: r.b, side: 1 - s.side, passes: 0, prev: key(s.b), cap, n: s.n + 1 };
    }
    function score(b) {
      const sc = [0, KOMI], seen = new Set();
      for (let i = 0; i < N * N; i++) {
        if (b[i]) { sc[b[i] - 1]++; continue; }
        if (seen.has(i)) continue;
        const reg = [i], st = [i], touch = new Set(); seen.add(i);
        while (st.length) { const x = st.pop(); for (const y of NB[x]) { if (b[y]) touch.add(b[y]); else if (!seen.has(y)) { seen.add(y); reg.push(y); st.push(y); } } }
        if (touch.size === 1) sc[[...touch][0] - 1] += reg.length;
      }
      return sc;
    }
    function status(s) {
      if (s.passes >= 2 || s.n >= 220) { const sc = score(s.b); return { winner: sc[0] > sc[1] ? 0 : 1, why: `Đen ${sc[0]} – Trắng ${sc[1]} (đã cộng komi ${KOMI})` }; }
      return null;
    }
    function ownEye(b, i, col) { return NB[i].every((y) => b[y] === col); }
    function ai(s, lv) {
      const col = s.side + 1, opp = 3 - col, moves = legal(s).filter((m) => !m.pass);
      // đối thủ vừa bỏ lượt và mình đang dẫn → bỏ lượt để kết thúc
      if (s.passes === 1) { const sc = score(s.b); if (sc[s.side] > sc[1 - s.side]) return { pass: true, p: -1 }; }
      let best = null, bv = -Infinity;
      for (const m of moves) {
        const i = m.p;
        if (ownEye(s.b, i, col)) continue;
        const r = place(s.b, i, col), me = group(r.b, i);
        let v = m.caps * 14;
        for (const y of NB[i]) {
          if (s.b[y] === col) { const g0 = group(s.b, y); if (g0.libs.size === 1) v += 10 * g0.stones.length; }
          if (r.b[y] === opp) { const go = group(r.b, y); if (go.libs.size === 1) v += 5 * go.stones.length; if (go.libs.size === 2) v += 1; }
        }
        if (me.libs.size === 1 && !m.caps) v -= 16 * me.stones.length;
        if (me.libs.size === 2) v -= 1.5;
        const rr = Math.floor(i / N), cc = i % N, edge = Math.min(rr, cc, N - 1 - rr, N - 1 - cc);
        v += edge === 0 ? -4 : edge === 1 ? 0.5 : edge === 2 ? 2.5 : 1.5;
        if (s.n < 6) v += (edge === 2 ? 3 : 0) + (rr === 4 && cc === 4 ? 2 : 0);
        let near = 0; for (const y of NB[i]) if (s.b[y]) near++; v += near ? 1 : 0;
        // giành đất: ô trống gần quân mình hơn quân địch
        v += lv >= 1 ? influence(r.b, col) * 0.08 : 0;
        v += Math.random() * [6, 2, 0.6][lv];
        if (v > bv) { bv = v; best = m; }
      }
      if (!best || (bv < -2 && s.n > 30)) return { pass: true, p: -1 };
      return best;
    }
    function influence(b, col) {
      let v = 0;
      for (let i = 0; i < N * N; i++) {
        if (b[i]) continue;
        let a = 0, d = 0; const r = Math.floor(i / N), c = i % N;
        for (let j = 0; j < N * N; j++) { if (!b[j]) continue; const dd = Math.abs(Math.floor(j / N) - r) + Math.abs(j % N - c); if (dd > 3) continue; if (b[j] === col) a += 4 - dd; else d += 4 - dd; }
        v += a > d ? 1 : d > a ? -1 : 0;
      }
      return v;
    }
    return {
      id: 'go', name: 'Cờ Vây', icon: '⚫', cols: N, rows: N, sides: ['Đen', 'Trắng'],
      rules: 'Bàn 9×9. Đen đi trước, lần lượt đặt quân lên giao điểm. Vây kín hết "khí" của nhóm quân địch là ăn. Không được tự sát, không cướp lại ngay (ko). Hết nước thì <b>bỏ lượt</b> — cả 2 cùng bỏ lượt thì đếm <b>đất + quân</b>, Trắng được cộng 6.5.',
      init: () => ({ b: new Array(N * N).fill(0), side: 0, passes: 0, prev: '', cap: [0, 0], n: 0 }),
      turn: (s) => s.side, legal, apply, status, ai, score,
      canPass: true,
      pieceSide: () => -1,
      clickMove: (s, cell) => legal(s).find((m) => m.p === cell),
      hit(x, y, W) { const q = W / N, c = Math.floor(x / q), r = Math.floor(y / q); return c < 0 || c >= N || r < 0 || r >= N ? -1 : r * N + c; },
      info(s) { const sc = score(s.b); return `⚫ Đen ăn ${s.cap[0]} · ⚪ Trắng ăn ${s.cap[1]}<br>Ước tính: Đen ${sc[0]} – Trắng ${sc[1]}`; },
      draw(g, W, H, s, v) {
        const q = W / N;
        const wood = g.createLinearGradient(0, 0, W, H); wood.addColorStop(0, '#e9c27a'); wood.addColorStop(1, '#d9a85b'); g.fillStyle = wood; g.fillRect(0, 0, W, H);
        g.strokeStyle = '#5c3a1e'; g.lineWidth = Math.max(1, q * 0.03);
        for (let k = 0; k < N; k++) { g.beginPath(); g.moveTo(q / 2, (k + 0.5) * q); g.lineTo(W - q / 2, (k + 0.5) * q); g.moveTo((k + 0.5) * q, q / 2); g.lineTo((k + 0.5) * q, H - q / 2); g.stroke(); }
        g.fillStyle = '#5c3a1e'; [[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]].forEach(([r, c]) => { g.beginPath(); g.arc((c + 0.5) * q, (r + 0.5) * q, q * 0.08, 0, Math.PI * 2); g.fill(); });
        for (let i = 0; i < N * N; i++) {
          if (!s.b[i]) continue;
          const x = (i % N + 0.5) * q, y = (Math.floor(i / N) + 0.5) * q, black = s.b[i] === 1;
          g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(x + 2, y + 3, q * 0.45, 0, Math.PI * 2); g.fill();
          const gr = g.createRadialGradient(x - q * 0.15, y - q * 0.15, q * 0.05, x, y, q * 0.46); gr.addColorStop(0, black ? '#666' : '#fff'); gr.addColorStop(1, black ? '#111' : '#cfd4da');
          g.fillStyle = gr; g.beginPath(); g.arc(x, y, q * 0.45, 0, Math.PI * 2); g.fill();
        }
        if (v.last && !v.last.pass && v.last.p >= 0) { const i = v.last.p, x = (i % N + 0.5) * q, y = (Math.floor(i / N) + 0.5) * q; g.strokeStyle = s.b[i] === 1 ? '#fff' : '#111'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, q * 0.2, 0, Math.PI * 2); g.stroke(); }
        if (v.hover >= 0 && !s.b[v.hover] && v.myTurn) { const i = v.hover, x = (i % N + 0.5) * q, y = (Math.floor(i / N) + 0.5) * q; g.globalAlpha = 0.45; g.fillStyle = s.side === 0 ? '#111' : '#fff'; g.beginPath(); g.arc(x, y, q * 0.45, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
      },
    };
  })();

  /* ======================================================================
   * 🐴 CỜ CÁ NGỰA (kiểu Ludo) — 2 đến 4 người, mỗi người 4 ngựa.
   * Gieo được 6 mới xuất chuồng · gieo 6 được gieo tiếp · đi trúng ô có ngựa địch là đá về chuồng (trừ ô có ★ và ô xuất phát)
   * Đi hết 1 vòng thì vào đường về chuồng màu mình, phải gieo vừa đúng mới vào đích. Ai đưa đủ 4 ngựa về đích trước là thắng.
   * ==================================================================== */
  const LUDO = (() => {
    const COL = ['#e03131', '#2f9e44', '#f59f00', '#1c7ed6'], NAME = ['Đỏ', 'Xanh lá', 'Vàng', 'Xanh dương'];
    const TRACK = [];
    [[1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], [7, 0], [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [14, 7], [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], [7, 14], [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], [0, 7], [0, 6]].forEach((p) => TRACK.push(p));
    const START = [0, 13, 26, 39], SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
    const HOME = [[[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]], [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]], [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]], [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]]];
    const BASE = [[0, 0], [9, 0], [9, 9], [0, 9]];
    const GOAL = 56;
    const trackIdx = (k, p) => (START[k] + p) % 52;
    /** ô (cột, hàng) của ngựa: p −1 = trong chuồng, 0..50 trên đường, 51..55 đường về, 56 = đích */
    function cellOf(k, h, p) {
      if (p < 0) { const [bx, by] = BASE[k]; return [bx + 1.5 + (h % 2) * 3, by + 1.5 + Math.floor(h / 2) * 3]; }
      if (p <= 50) { const [c, r] = TRACK[trackIdx(k, p)]; return [c + 0.5, r + 0.5]; }
      if (p < GOAL) { const [c, r] = HOME[k][p - 51]; return [c + 0.5, r + 0.5]; }
      return [[6.9, 7.5], [7.5, 6.9], [8.1, 7.5], [7.5, 8.1]][k];
    }
    function horseMoves(s) {
      const k = s.turn, d = s.dice, out = [];
      s.pos[k].forEach((p, h) => {
        if (p >= GOAL) return;
        if (p < 0) { if (d === 6) out.push({ h, to: 0 }); return; }
        if (p + d <= GOAL) out.push({ h, to: p + d });
      });
      return out;
    }
    function legal(s) {
      if (s.phase === 'roll') return [{ roll: true }];
      const hm = horseMoves(s);
      return hm.length ? hm : [{ skip: true }];
    }
    const next = (s, k) => { const i = s.players.indexOf(k); return s.players[(i + 1) % s.players.length]; };
    function apply(s0, m) {
      const s = { ...s0, pos: s0.pos.map((a) => a.slice()), kicks: s0.kicks };
      if (m.roll) { s.dice = m.v; s.phase = 'move'; return s; }
      const k = s.turn;
      if (m.skip) { s.phase = 'roll'; s.turn = next(s, k); s.dice = 0; return s; }
      s.pos[k][m.h] = m.to; s.kick = null;
      // đá ngựa địch đứng cùng ô (trừ ô an toàn)
      if (m.to <= 50) {
        const ti = trackIdx(k, m.to);
        if (!SAFE.has(ti)) s.players.forEach((o) => { if (o === k) return; s.pos[o].forEach((p, h) => { if (p >= 0 && p <= 50 && trackIdx(o, p) === ti) { s.pos[o][h] = -1; s.kick = { o, h }; } }); });
      }
      s.phase = 'roll';
      if (s.dice !== 6 && !s.kick) s.turn = next(s, k);
      s.dice = 0;
      return s;
    }
    function status(s) {
      for (const k of s.players) if (s.pos[k].every((p) => p >= GOAL)) return { winner: k, why: `🏁 Ngựa ${NAME[k]} về đích đủ 4 con!` };
      return null;
    }
    function ai(s, lv) {
      if (s.phase === 'roll') return { roll: true };
      const ms = legal(s); if (ms[0].skip) return ms[0];
      const k = s.turn;
      const danger = (k2, to) => { if (to > 50) return 0; const ti = trackIdx(k2, to); if (SAFE.has(ti)) return 0; let d = 0; s.players.forEach((o) => { if (o === k2) return; s.pos[o].forEach((p) => { if (p < 0 || p > 50) return; const op = trackIdx(o, p), dist = (ti - op + 52) % 52; if (dist >= 1 && dist <= 6) d++; }); }); return d; };
      let best = ms[0], bv = -Infinity;
      for (const m of ms) {
        const from = s.pos[k][m.h];
        let v = m.to * 0.5;
        if (m.to === GOAL) v += 60;
        if (from < 0) v += 40;
        if (m.to <= 50) { const ti = trackIdx(k, m.to); if (!SAFE.has(ti)) s.players.forEach((o) => { if (o !== k) s.pos[o].forEach((p) => { if (p >= 0 && p <= 50 && trackIdx(o, p) === ti) v += 50 + p; }); }); if (SAFE.has(ti)) v += 8; }
        if (m.to > 50) v += 15;
        v -= danger(k, m.to) * 12 * (lv + 1) / 2;
        if (from >= 0) v += danger(k, from) * 8 * lv / 2;
        v += Math.random() * [30, 8, 1][lv];
        if (v > bv) { bv = v; best = m; }
      }
      return best;
    }
    return {
      id: 'ludo', name: 'Cờ Cá Ngựa', icon: '🐴', cols: 15, rows: 15, multi: true, sides: NAME, colors: COL,
      rules: 'Bấm <b>🎲 Gieo</b> rồi chọn ngựa để đi. Gieo được <b>6</b> mới ra chuồng, gieo 6 hoặc đá được ngựa địch thì được gieo tiếp. Đi trúng ô có ngựa địch là <b>đá về chuồng</b> (trừ ô ★ và ô xuất phát). Phải gieo vừa đủ mới vào đích.',
      init: (players) => ({ players, pos: [0, 1, 2, 3].map(() => [-1, -1, -1, -1]), turn: players[0], phase: 'roll', dice: 0 }),
      /** bỏ các màu ks khỏi bàn (người chơi thoát); tới lượt màu đó thì chuyển sang người kế tiếp */
      drop(s0, ks) {
        const s = { ...s0, pos: s0.pos.map((a) => a.slice()) }, old = s.players;
        s.players = old.filter((k) => !ks.includes(k));
        if (ks.includes(s.turn) && s.players.length) { let i = old.indexOf(s.turn); do { i = (i + 1) % old.length; } while (ks.includes(old[i])); s.turn = old[i]; s.phase = 'roll'; s.dice = 0; }
        return s;
      },
      turn: (s) => s.turn, legal, apply, status, ai,
      pieceSide: () => -1,
      clickMove(s, cell) {
        if (s.phase !== 'move') return null;
        const ms = horseMoves(s), c = cell % 15, r = Math.floor(cell / 15);
        let best = null, bd = 1.3; ms.forEach((m) => { const [x, y] = cellOf(s.turn, m.h, s.pos[s.turn][m.h]), d = Math.hypot(x - 0.5 - c, y - 0.5 - r); if (d < bd) { bd = d; best = m; } }); return best;
      },
      hit(x, y, W) { const q = W / 15, c = Math.floor(x / q), r = Math.floor(y / q); return c < 0 || c > 14 || r < 0 || r > 14 ? -1 : r * 15 + c; },
      info(s) { return s.players.map((k) => `<span style="color:${COL[k]}">●</span> ${NAME[k]}: ${s.pos[k].filter((p) => p >= GOAL).length}/4 về đích`).join('<br>'); },
      draw(g, W, H, s, v) {
        const q = W / 15;
        g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
        BASE.forEach(([bx, by], k) => { g.fillStyle = COL[k]; g.fillRect(bx * q, by * q, 6 * q, 6 * q); g.fillStyle = '#fff'; g.beginPath(); g.roundRect((bx + 0.8) * q, (by + 0.8) * q, 4.4 * q, 4.4 * q, q * 0.6); g.fill(); for (let h = 0; h < 4; h++) { const [x, y] = cellOf(k, h, -1); g.strokeStyle = COL[k]; g.lineWidth = 2; g.beginPath(); g.arc(x * q, y * q, q * 0.55, 0, Math.PI * 2); g.stroke(); } });
        TRACK.forEach(([c, r], i) => { const st = START.indexOf(i); g.fillStyle = st >= 0 ? COL[st] : '#fff'; g.fillRect(c * q, r * q, q, q); g.strokeStyle = '#adb5bd'; g.lineWidth = 1; g.strokeRect(c * q, r * q, q, q); if (SAFE.has(i) && st < 0) { g.fillStyle = '#ced4da'; g.font = FONT(q * 0.6); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('★', (c + 0.5) * q, (r + 0.55) * q); } });
        HOME.forEach((cells, k) => cells.forEach(([c, r]) => { g.fillStyle = COL[k]; g.fillRect(c * q, r * q, q, q); g.strokeStyle = 'rgba(255,255,255,.6)'; g.strokeRect(c * q, r * q, q, q); }));
        const cx = 7.5 * q, cy = 7.5 * q;
        [[6, 6, 6, 9], [6, 6, 9, 6], [9, 6, 9, 9], [6, 9, 9, 9]].forEach(([x1, y1, x2, y2], k) => { g.fillStyle = COL[[0, 1, 2, 3][k]]; g.beginPath(); g.moveTo(x1 * q, y1 * q); g.lineTo(x2 * q, y2 * q); g.lineTo(cx, cy); g.closePath(); g.fill(); });
        // ngựa: gom theo ô để xếp lệch nhau
        const groups = new Map();
        s.players.forEach((k) => s.pos[k].forEach((p, h) => { const [x, y] = cellOf(k, h, p); const key2 = p < 0 ? `b${k}${h}` : `${x.toFixed(1)},${y.toFixed(1)}`; if (!groups.has(key2)) groups.set(key2, []); groups.get(key2).push({ k, h, p, x, y }); }));
        const movable = new Set((v.myTurn && s.phase === 'move' ? horseMoves(s) : []).map((m) => m.h));
        groups.forEach((list) => list.forEach((o, i) => {
          const off = list.length > 1 ? (i - (list.length - 1) / 2) * q * 0.28 : 0, x = o.x * q + off, y = o.y * q - (o.p >= GOAL ? 0 : 0), rr = o.p >= GOAL ? q * 0.22 : q * 0.36;
          const can = o.k === s.turn && movable.has(o.h);
          if (can) { g.fillStyle = `rgba(255,212,59,${0.5 + 0.4 * Math.sin(v.t * 8)})`; g.beginPath(); g.arc(x, y, rr * 1.45, 0, Math.PI * 2); g.fill(); }
          g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(x + 1.5, y + 2.5, rr, 0, Math.PI * 2); g.fill();
          g.fillStyle = COL[o.k]; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = Math.max(2, q * 0.08); g.stroke();
          if (o.p < GOAL) { g.font = `${rr * 1.15}px system-ui,"Segoe UI Emoji"`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('🐴', x, y + 1); }
        }));
        // xúc xắc giữa bàn
        if (s.dice) { g.fillStyle = '#fff'; g.strokeStyle = COL[s.turn]; g.lineWidth = 4; g.beginPath(); g.roundRect(cx - q * 0.75, cy - q * 0.75, q * 1.5, q * 1.5, q * 0.25); g.fill(); g.stroke(); g.fillStyle = '#212529'; const pip = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[s.dice]; pip.forEach(([a, b]) => { g.beginPath(); g.arc(cx + a * q * 0.36, cy + b * q * 0.36, q * 0.12, 0, Math.PI * 2); g.fill(); }); }
      },
    };
  })();

  /* ======================================================================
   * 🎩 CỜ TỶ PHÚ (kiểu Monopoly) — 2 đến 4 người, đất là các địa danh Việt Nam.
   * Tiền trong ván tính bằng nghìn đồng (15.000 = 15 triệu). Gieo 2 xúc xắc, mua đất, thu tiền thuê, gom đủ màu thì xây nhà → khách sạn.
   * Mọi thứ ngẫu nhiên (xúc xắc do người gieo gửi kèm, bộ thẻ Cơ hội / Khí vận xáo theo hạt giống chung) nên chơi online các máy luôn khớp nhau.
   * ==================================================================== */
  const TYPHU = (() => {
    const COL = ['#e03131', '#2f9e44', '#f59f00', '#1c7ed6'], NAME = ['Đỏ', 'Xanh lá', 'Vàng', 'Xanh dương'];
    const GROUP = { br: '#8d5524', lb: '#74c0fc', pk: '#e64980', or: '#fd7e14', rd: '#e03131', ye: '#fcc419', gr: '#2b8a3e', db: '#1c3faa' };
    const HOUSE = { br: 500, lb: 500, pk: 1000, or: 1000, rd: 1500, ye: 1500, gr: 2000, db: 2000 };
    const P = (name, g, price, rent) => ({ t: 'prop', name, g, price, rent });
    const CELLS = [
      { t: 'go', name: 'XUẤT PHÁT' }, P('Cà Mau', 'br', 600, [20, 100, 300, 900, 1600, 2500]), { t: 'chest', name: 'Khí vận' }, P('Bạc Liêu', 'br', 600, [40, 200, 600, 1800, 3200, 4500]), { t: 'tax', name: 'Thuế thu nhập', amt: 2000 },
      { t: 'st', name: 'Sân bay Nội Bài', price: 2000 }, P('Cần Thơ', 'lb', 1000, [60, 300, 900, 2700, 4000, 5500]), { t: 'chance', name: 'Cơ hội' }, P('Châu Đốc', 'lb', 1000, [60, 300, 900, 2700, 4000, 5500]), P('Vĩnh Long', 'lb', 1200, [80, 400, 1000, 3000, 4500, 6000]),
      { t: 'jail', name: 'NHÀ TÙ' }, P('Phan Thiết', 'pk', 1400, [100, 500, 1500, 4500, 6250, 7500]), { t: 'ut', name: 'Công ty Điện', price: 1500 }, P('Đà Lạt', 'pk', 1400, [100, 500, 1500, 4500, 6250, 7500]), P('Nha Trang', 'pk', 1600, [120, 600, 1800, 5000, 7000, 9000]),
      { t: 'st', name: 'Sân bay Đà Nẵng', price: 2000 }, P('Quy Nhơn', 'or', 1800, [140, 700, 2000, 5500, 7500, 9500]), { t: 'chest', name: 'Khí vận' }, P('Hội An', 'or', 1800, [140, 700, 2000, 5500, 7500, 9500]), P('Huế', 'or', 2000, [160, 800, 2200, 6000, 8000, 10000]),
      { t: 'park', name: 'BÃI ĐỖ XE' }, P('Đà Nẵng', 'rd', 2200, [180, 900, 2500, 7000, 8750, 10500]), { t: 'chance', name: 'Cơ hội' }, P('Hạ Long', 'rd', 2200, [180, 900, 2500, 7000, 8750, 10500]), P('Sa Pa', 'rd', 2400, [200, 1000, 3000, 7500, 9250, 11000]),
      { t: 'st', name: 'Sân bay Tân Sơn Nhất', price: 2000 }, P('Phú Quốc', 'ye', 2600, [220, 1100, 3300, 8000, 9750, 11500]), P('Vũng Tàu', 'ye', 2600, [220, 1100, 3300, 8000, 9750, 11500]), { t: 'ut', name: 'Công ty Nước', price: 1500 }, P('Ninh Bình', 'ye', 2800, [240, 1200, 3600, 8500, 10250, 12000]),
      { t: 'gojail', name: 'VÀO TÙ' }, P('Chợ Bến Thành', 'gr', 3000, [260, 1300, 3900, 9000, 11000, 12750]), P('Phố đi bộ Nguyễn Huệ', 'gr', 3000, [260, 1300, 3900, 9000, 11000, 12750]), { t: 'chest', name: 'Khí vận' }, P('Landmark 81', 'gr', 3200, [280, 1500, 4500, 10000, 12000, 14000]),
      { t: 'st', name: 'Sân bay Phú Quốc', price: 2000 }, { t: 'chance', name: 'Cơ hội' }, P('Hồ Tây', 'db', 3500, [350, 1750, 5000, 11000, 13000, 15000]), { t: 'tax', name: 'Thuế xa xỉ', amt: 1000 }, P('Hồ Gươm', 'db', 4000, [500, 2000, 6000, 14000, 17000, 20000]),
    ];
    const SHORT = { 'Phố đi bộ Nguyễn Huệ': 'Nguyễn Huệ', 'Sân bay Nội Bài': '✈ Nội Bài', 'Sân bay Đà Nẵng': '✈ Đà Nẵng', 'Sân bay Tân Sơn Nhất': '✈ Tân Sơn Nhất', 'Sân bay Phú Quốc': '✈ Phú Quốc', 'Công ty Điện': '💡 Điện', 'Công ty Nước': '🚰 Nước', 'Thuế thu nhập': '💸 Thuế', 'Thuế xa xỉ': '💎 Thuế', 'Chợ Bến Thành': 'Bến Thành' };
    const CHANCE = [
      ['Đi thẳng về Ô Xuất Phát, lĩnh 2 triệu', { go: 0 }], ['Đi du lịch Hồ Gươm', { go: 39 }], ['Bay vào Sân bay Tân Sơn Nhất', { go: 25 }], ['Lên Đà Lạt ngắm hoa', { go: 13 }],
      ['Ra vịnh Hạ Long', { go: 23 }], ['Lùi lại 3 ô', { back: 3 }], ['Vượt đèn đỏ — vào tù!', { jail: 1 }], ['Ngân hàng trả cổ tức +500k', { m: 500 }],
      ['Trúng vé số +1,5 triệu', { m: 1500 }], ['Phạt đỗ xe sai chỗ −150k', { m: -150 }], ['Đóng học phí −1,5 triệu', { m: -1500 }], ['Bao cả bàn trà sữa: trả mỗi người 500k', { each: -500 }],
    ];
    const CHEST = [
      ['Về Ô Xuất Phát, lĩnh 2 triệu', { go: 0 }], ['Ngân hàng tính nhầm có lợi cho bạn +2 triệu', { m: 2000 }], ['Tiền khám bệnh −500k', { m: -500 }], ['Bán cổ phiếu +500k', { m: 500 }],
      ['Trốn thuế bị phát hiện — vào tù!', { jail: 1 }], ['Hoàn thuế +200k', { m: 200 }], ['Sinh nhật: mỗi người mừng bạn 100k', { each: 100 }], ['Bảo hiểm đáo hạn +1 triệu', { m: 1000 }],
      ['Đóng viện phí −1 triệu', { m: -1000 }], ['Giải nhì cuộc thi nhan sắc +100k', { m: 100 }], ['Được thừa kế +1 triệu', { m: 1000 }], ['Sửa nhà: mỗi nhà 250k, khách sạn 1 triệu', { repair: 1 }],
    ];
    const START = 15000, SALARY = 2000, JAILFINE = 500;
    const buyable = (i) => ['prop', 'st', 'ut'].includes(CELLS[i].t);
    const groupCells = (g) => CELLS.map((c, i) => (c.g === g ? i : -1)).filter((i) => i >= 0);
    const money = (v) => { const a = Math.abs(v), sg = v < 0 ? '−' : ''; return a >= 1000 ? `${sg}${(a / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}tr` : `${sg}${a}k`; };
    function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    const shuffle = (n, r) => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function init(players, seed, opt = {}) {
      const r = rng(seed || 1);
      return { players: players.slice(), turn: players[0], phase: 'roll', dice: [0, 0], dbl: 0, pos: [0, 0, 0, 0], money: [START, START, START, START], jail: [0, 0, 0, 0], own: Array(40).fill(-1), houses: Array(40).fill(0), mort: Array(40).fill(false), dc: shuffle(CHANCE.length, r), dk: shuffle(CHEST.length, r), ci: 0, ki: 0, round: 1, maxRounds: opt.rounds || 20, log: ['🎩 Ván mới bắt đầu — mỗi người có 15 triệu'], extra: false };
    }
    const clone = (s) => ({ ...s, players: s.players.slice(), pos: s.pos.slice(), money: s.money.slice(), jail: s.jail.slice(), own: s.own.slice(), houses: s.houses.slice(), mort: s.mort.slice(), log: s.log.slice(-5) });
    const say = (s, t) => { s.log.push(t); if (s.log.length > 6) s.log.shift(); };
    const fullGroup = (s, g, k) => groupCells(g).every((i) => s.own[i] === k);
    function rentOf(s, i) {
      const c = CELLS[i], o = s.own[i];
      if (c.t === 'st') { const n = [5, 15, 25, 35].filter((j) => s.own[j] === o && !s.mort[j]).length; return 250 * Math.pow(2, n - 1); }
      if (c.t === 'ut') { const n = [12, 28].filter((j) => s.own[j] === o).length; return (s.dice[0] + s.dice[1]) * (n === 2 ? 100 : 40); }
      const h = s.houses[i]; return h ? c.rent[h] : c.rent[0] * (fullGroup(s, c.g, o) ? 2 : 1);
    }
    function pay(s, k, amt, to) { s.money[k] -= amt; if (to != null && to >= 0) s.money[to] += amt; }
    function afterPay(s) { s.phase = s.money[s.turn] < 0 ? 'debt' : 'manage'; if (s.phase === 'debt') say(s, `⚠️ ${NAME[s.turn]} thiếu tiền — bán nhà / cầm cố đất hoặc phá sản`); }
    function toJail(s, k) { s.pos[k] = 10; s.jail[k] = 1; s.dbl = 0; s.extra = false; s.phase = 'manage'; say(s, `🚔 ${NAME[k]} vào tù!`); }
    function moveTo(s, k, to, salary) { if (salary && to < s.pos[k]) { s.money[k] += SALARY; say(s, `💵 ${NAME[k]} qua Xuất Phát +2tr`); } s.pos[k] = to; land(s, k); }
    function land(s, k) {
      const i = s.pos[k], c = CELLS[i];
      if (buyable(i)) {
        const o = s.own[i];
        if (o < 0) { s.phase = 'buy'; return; }
        if (o === k || s.mort[i] || !s.players.includes(o)) { s.phase = 'manage'; return; }
        const r = rentOf(s, i); pay(s, k, r, o); say(s, `🏠 ${NAME[k]} trả ${money(r)} tiền thuê ${c.name} cho ${NAME[o]}`); return afterPay(s);
      }
      if (c.t === 'tax') { pay(s, k, c.amt); say(s, `💸 ${NAME[k]} nộp ${c.name} ${money(c.amt)}`); return afterPay(s); }
      if (c.t === 'gojail') return toJail(s, k);
      if (c.t === 'chance' || c.t === 'chest') {
        const ch = c.t === 'chance', deck = ch ? CHANCE : CHEST, idx = ch ? s.dc[s.ci++ % s.dc.length] : s.dk[s.ki++ % s.dk.length], [txt, ef] = deck[idx];
        say(s, `${ch ? '❓ Cơ hội' : '🎁 Khí vận'}: ${txt}`); s.card = { ch, txt };
        if (ef.go != null) return moveTo(s, k, ef.go, true);
        if (ef.back) { s.pos[k] = (s.pos[k] + 37) % 40; return land(s, k); }
        if (ef.jail) return toJail(s, k);
        if (ef.m) { s.money[k] += ef.m; return afterPay(s); }
        if (ef.each) { s.players.forEach((o) => { if (o !== k) { s.money[o] -= ef.each; s.money[k] += ef.each; } }); return afterPay(s); }
        if (ef.repair) { let cost = 0; s.own.forEach((o, j) => { if (o === k) cost += s.houses[j] === 5 ? 1000 : s.houses[j] * 250; }); pay(s, k, cost); return afterPay(s); }
      }
      s.phase = 'manage';
    }
    /** các việc quản lý đất làm được lúc này (xây / bán nhà / cầm cố / chuộc) */
    function manageMoves(s, k, debt) {
      const out = [];
      for (let i = 0; i < 40; i++) {
        if (s.own[i] !== k) continue;
        const c = CELLS[i];
        if (c.t === 'prop') {
          const gc = groupCells(c.g), hs = gc.map((j) => s.houses[j]);
          if (s.houses[i] > 0 && s.houses[i] === Math.max(...hs)) out.push({ sell: i });
          if (!debt && fullGroup(s, c.g, k) && gc.every((j) => !s.mort[j]) && s.houses[i] < 5 && s.houses[i] === Math.min(...hs) && s.money[k] >= HOUSE[c.g]) out.push({ build: i });
        }
        const grpHouses = c.t === 'prop' ? groupCells(c.g).some((j) => s.houses[j] > 0) : false;
        if (!s.mort[i] && !grpHouses) out.push({ mort: i });
        if (!debt && s.mort[i] && s.money[k] >= Math.ceil(c.price * 0.55)) out.push({ unmort: i });
      }
      return out;
    }
    function legal(s) {
      const k = s.turn;
      if (s.phase === 'roll') return s.jail[k] && s.money[k] >= JAILFINE ? [{ roll: true }, { payjail: true }] : [{ roll: true }];
      if (s.phase === 'buy') return [{ buy: true }, { pass: true }];
      if (s.phase === 'debt') return [...manageMoves(s, k, true), { bankrupt: true }];
      return [{ end: true }, ...manageMoves(s, k, false)];
    }
    function nextTurn(s) {
      const i = s.players.indexOf(s.turn), n = s.players[(i + 1) % s.players.length];
      if (s.players.indexOf(n) <= i) s.round++;
      s.turn = n; s.phase = 'roll'; s.dbl = 0; s.extra = false; s.card = null;
    }
    function release(s, k) { for (let i = 0; i < 40; i++) if (s.own[i] === k) { s.own[i] = -1; s.houses[i] = 0; s.mort[i] = false; } }
    function apply(s0, m) {
      const s = clone(s0), k = s.turn, c = CELLS[s.pos[k]];
      s.card = null;
      if (m.roll) {
        const [a, b] = m.d; s.dice = [a, b]; const dbl = a === b;
        if (s.jail[k]) {
          if (dbl) { s.jail[k] = 0; say(s, `🎲 ${NAME[k]} gieo đôi ${a}-${b}, ra tù!`); }
          else if (s.jail[k] >= 3) { s.jail[k] = 0; pay(s, k, JAILFINE); say(s, `🎲 ${a}-${b} — ${NAME[k]} nộp phạt 500k rồi ra tù`); }
          else { s.jail[k]++; say(s, `🎲 ${a}-${b} — ${NAME[k]} vẫn ngồi tù`); s.phase = 'manage'; return s; }
          s.extra = false;
        } else if (dbl) { s.dbl++; if (s.dbl >= 3) { say(s, `🎲 ${NAME[k]} gieo đôi 3 lần liền — vào tù!`); toJail(s, k); return s; } s.extra = true; }
        else s.extra = false;
        if (!s.jail[k] && !dbl) say(s, `🎲 ${NAME[k]} gieo ${a}-${b}`); else if (dbl && !s.jail[k]) say(s, `🎲 ${NAME[k]} gieo đôi ${a}-${b} — được gieo thêm`);
        const to = (s.pos[k] + a + b) % 40;
        if (to < s.pos[k]) { s.money[k] += SALARY; say(s, `💵 ${NAME[k]} qua Xuất Phát +2tr`); }
        s.pos[k] = to; land(s, k);
        if (s.phase === 'manage' && s.money[k] < 0) s.phase = 'debt';
        return s;
      }
      if (m.payjail) { pay(s, k, JAILFINE); s.jail[k] = 0; say(s, `🔓 ${NAME[k]} nộp 500k ra tù`); return s; }
      if (m.buy) { const i = s.pos[k], cc = CELLS[i]; pay(s, k, cc.price); s.own[i] = k; say(s, `🏷️ ${NAME[k]} mua ${cc.name} giá ${money(cc.price)}`); s.phase = 'manage'; return s; }
      if (m.pass) { s.phase = 'manage'; return s; }
      if (m.build != null) { const cc = CELLS[m.build]; pay(s, k, HOUSE[cc.g]); s.houses[m.build]++; say(s, `🔨 ${NAME[k]} xây ${s.houses[m.build] === 5 ? 'khách sạn' : 'nhà'} ở ${cc.name}`); return s; }
      if (m.sell != null) { const cc = CELLS[m.sell]; s.houses[m.sell]--; s.money[k] += HOUSE[cc.g] / 2; say(s, `🏚️ ${NAME[k]} bán 1 nhà ở ${cc.name}`); if (s.phase === 'debt' && s.money[k] >= 0) s.phase = 'manage'; return s; }
      if (m.mort != null) { const cc = CELLS[m.mort]; s.mort[m.mort] = true; s.money[k] += cc.price / 2; say(s, `📜 ${NAME[k]} cầm cố ${cc.name} +${money(cc.price / 2)}`); if (s.phase === 'debt' && s.money[k] >= 0) s.phase = 'manage'; return s; }
      if (m.unmort != null) { const cc = CELLS[m.unmort]; pay(s, k, Math.ceil(cc.price * 0.55)); s.mort[m.unmort] = false; say(s, `📜 ${NAME[k]} chuộc lại ${cc.name}`); return s; }
      if (m.bankrupt) { say(s, `💀 ${NAME[k]} phá sản!`); release(s, k); const old = s.players.slice(); nextTurn(s); s.players = old.filter((x) => x !== k); if (s.turn === k) s.turn = s.players[0]; return s; }
      if (m.end) { if (s.extra && !s.jail[k]) { s.phase = 'roll'; s.extra = false; return s; } nextTurn(s); return s; }
      void c;
      return s;
    }
    const worth = (s, k) => s.money[k] + s.own.reduce((a, o, i) => a + (o === k ? (s.mort[i] ? CELLS[i].price / 2 : CELLS[i].price) + s.houses[i] * HOUSE[CELLS[i].g || 'br'] : 0), 0);
    function status(s) {
      if (s.players.length === 1) return { winner: s.players[0], why: `🎩 ${NAME[s.players[0]]} là tỷ phú cuối cùng!` };
      if (s.round > s.maxRounds) { const w = s.players.slice().sort((a, b) => worth(s, b) - worth(s, a))[0]; return { winner: w, why: `🏁 Hết ${s.maxRounds} vòng — ${NAME[w]} giàu nhất (${money(worth(s, w))})` }; }
      return null;
    }
    function ai(s, lv) {
      const k = s.turn, ms = legal(s), M = s.money[k], reserve = [800, 1500, 2500][lv];
      if (s.phase === 'roll') return s.jail[k] && M > 6000 && s.round < 10 ? { payjail: true } : { roll: true };
      if (s.phase === 'buy') { const pr = CELLS[s.pos[k]].price; return M - pr >= reserve * (lv === 0 ? 0.3 : 0.6) ? { buy: true } : { pass: true }; }
      if (s.phase === 'debt') { const sell = ms.find((m) => m.sell != null); if (sell) return sell; const mo = ms.filter((m) => m.mort != null).sort((a, b) => CELLS[a.mort].price - CELLS[b.mort].price)[0]; return mo || { bankrupt: true }; }
      const b = ms.filter((m) => m.build != null && M - HOUSE[CELLS[m.build].g] >= reserve).sort((x, y) => CELLS[y.build].price - CELLS[x.build].price)[0];
      if (b && Math.random() < [0.5, 0.85, 1][lv]) return b;
      const u = ms.find((m) => m.unmort != null && M - CELLS[m.unmort].price > reserve * 2); if (u) return u;
      return { end: true };
    }
    /* ---------- vẽ bàn: 11×11 ô, góc dưới phải là Xuất Phát ---------- */
    const cellRC = (i) => (i <= 10 ? [10, 10 - i] : i <= 20 ? [20 - i, 0] : i <= 30 ? [0, i - 20] : [i - 30, 10]);
    const pipDots = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    function die(g, x, y, sz, v) { g.fillStyle = '#fff'; g.strokeStyle = '#495057'; g.lineWidth = 2; g.beginPath(); g.roundRect(x - sz / 2, y - sz / 2, sz, sz, sz * 0.18); g.fill(); g.stroke(); g.fillStyle = '#212529'; (pipDots[v] || []).forEach(([a, b]) => { g.beginPath(); g.arc(x + a * sz * 0.26, y + b * sz * 0.26, sz * 0.08, 0, Math.PI * 2); g.fill(); }); }
    function wrap(g, t, maxW) { const w = t.split(' '), lines = []; let cur = ''; w.forEach((x) => { const tt = cur ? cur + ' ' + x : x; if (g.measureText(tt).width > maxW && cur) { lines.push(cur); cur = x; } else cur = tt; }); if (cur) lines.push(cur); return lines.slice(0, 3); }
    function draw(g, W, H, s, v) {
      const q = W / 11;
      g.fillStyle = '#d3f9d8'; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) {
        const [r, c] = cellRC(i), x = c * q, y = r * q, C = CELLS[i];
        g.fillStyle = s.mort[i] ? '#dee2e6' : '#fffdf5'; g.fillRect(x, y, q, q); g.strokeStyle = '#343a40'; g.lineWidth = 1; g.strokeRect(x, y, q, q);
        if (C.g) { g.fillStyle = GROUP[C.g]; g.fillRect(x + 1, y + 1, q - 2, q * 0.24); }
        const o = s.own[i];
        if (o >= 0) { g.strokeStyle = COL[o]; g.lineWidth = Math.max(2, q * 0.07); g.strokeRect(x + 2, y + 2, q - 4, q - 4); }
        g.fillStyle = '#212529'; g.textAlign = 'center'; g.textBaseline = 'middle';
        const nm = SHORT[C.name] || C.name;
        if (['go', 'jail', 'park', 'gojail'].includes(C.t)) { g.font = FONT(q * 0.2); const ic = { go: '🏁', jail: '🚔', park: '🅿️', gojail: '👮' }[C.t]; g.font = `${q * 0.38}px system-ui,"Segoe UI Emoji"`; g.fillText(ic, x + q / 2, y + q * 0.42); g.font = FONT(q * 0.13); g.fillText(C.name, x + q / 2, y + q * 0.82); }
        else if (C.t === 'chance' || C.t === 'chest') { g.font = `${q * 0.4}px system-ui,"Segoe UI Emoji"`; g.fillText(C.t === 'chance' ? '❓' : '🎁', x + q / 2, y + q * 0.45); g.font = FONT(q * 0.14, 800); g.fillText(C.name, x + q / 2, y + q * 0.84); }
        else {
          g.font = FONT(Math.max(7, q * 0.15), 800); const ls = wrap(g, nm, q * 0.92), y0 = y + (C.g ? q * 0.42 : q * 0.3);
          ls.forEach((l, j) => g.fillText(l, x + q / 2, y0 + j * q * 0.17));
          if (C.price || C.amt) { g.font = FONT(Math.max(7, q * 0.13), 700); g.fillStyle = C.amt ? '#c92a2a' : '#495057'; g.fillText(money(C.price || C.amt), x + q / 2, y + q * 0.86); }
        }
        const h = s.houses[i]; if (h) { if (h === 5) { g.fillStyle = '#e03131'; g.fillRect(x + q * 0.3, y + q * 0.03, q * 0.4, q * 0.17); } else for (let j = 0; j < h; j++) { g.fillStyle = '#2f9e44'; g.fillRect(x + q * 0.08 + j * q * 0.22, y + q * 0.04, q * 0.17, q * 0.15); } }
        if (v.sel === i) { g.strokeStyle = '#7048e8'; g.lineWidth = 4; g.strokeRect(x + 1, y + 1, q - 2, q - 2); }
      }
      // giữa bàn
      g.fillStyle = '#ebfbee'; g.fillRect(q, q, q * 9, q * 9);
      g.font = FONT(q * 0.62); g.fillStyle = '#c92a2a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CỜ TỶ PHÚ', W / 2, q * 2.1);
      g.font = FONT(q * 0.24, 700); g.fillStyle = '#495057'; g.fillText(`Vòng ${Math.min(s.round, s.maxRounds)}/${s.maxRounds}`, W / 2, q * 2.75);
      if (s.dice[0]) { die(g, W / 2 - q * 0.6, q * 3.8, q * 0.9, s.dice[0]); die(g, W / 2 + q * 0.6, q * 3.8, q * 0.9, s.dice[1]); }
      if (s.card) { g.fillStyle = s.card.ch ? '#fff3bf' : '#e7f5ff'; g.strokeStyle = '#495057'; g.lineWidth = 2; g.beginPath(); g.roundRect(q * 2.2, q * 4.6, q * 6.6, q * 1.5, 12); g.fill(); g.stroke(); g.fillStyle = '#212529'; g.font = FONT(q * 0.24, 800); wrap(g, (s.card.ch ? '❓ ' : '🎁 ') + s.card.txt, q * 6.2).forEach((l, j) => g.fillText(l, W / 2, q * 5.05 + j * q * 0.32)); }
      g.font = FONT(q * 0.2, 600); g.fillStyle = '#343a40'; g.textAlign = 'left';
      s.log.slice(-5).forEach((l, j) => { const t = g.measureText(l).width > q * 8.4 ? l.slice(0, 52) + '…' : l; g.fillText(t, q * 1.3, q * 6.6 + j * q * 0.36); });
      // quân cờ
      const at = {}; s.players.forEach((k) => { (at[s.pos[k]] = at[s.pos[k]] || []).push(k); });
      Object.entries(at).forEach(([i, ks]) => { const [r, c] = cellRC(+i); ks.forEach((k, j) => { const x = c * q + q * (0.28 + (j % 2) * 0.44), y = r * q + q * (0.5 + Math.floor(j / 2) * 0.28) + (s.jail[k] ? 0 : 0); const pulse = k === s.turn ? 1 + 0.12 * Math.sin(v.t * 6) : 1; g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(x + 1.5, y + 2, q * 0.15 * pulse, 0, Math.PI * 2); g.fill(); g.fillStyle = COL[k]; g.beginPath(); g.arc(x, y, q * 0.15 * pulse, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); if (s.jail[k]) { g.strokeStyle = '#212529'; g.lineWidth = 1.5; for (let b = -1; b <= 1; b++) { g.beginPath(); g.moveTo(x + b * q * 0.07, y - q * 0.15); g.lineTo(x + b * q * 0.07, y + q * 0.15); g.stroke(); } } }); });
    }
    const MV = (m) => (m.build != null ? `🔨 Xây ${CELLS[m.build].name}` : m.sell != null ? `🏚️ Bán nhà ${CELLS[m.sell].name}` : m.mort != null ? `📜 Cầm cố ${CELLS[m.mort].name} (+${money(CELLS[m.mort].price / 2)})` : m.unmort != null ? `📜 Chuộc ${CELLS[m.unmort].name}` : '');
    return {
      id: 'typhu', name: 'Cờ Tỷ Phú', icon: '🎩', cols: 11, rows: 11, multi: true, rounds: true, sides: NAME, colors: COL,
      rules: 'Gieo 2 xúc xắc đi quanh bàn. Vào đất chưa ai mua thì được <b>mua</b> · vào đất người khác thì <b>trả tiền thuê</b> · gom đủ 1 màu thì <b>xây nhà → khách sạn</b> (tiền thuê tăng vọt). Gieo đôi được gieo thêm. Hết tiền thì bán nhà / cầm cố, không trả nổi là phá sản. Hết số vòng ai giàu nhất thắng.',
      init, turn: (s) => s.turn, legal, apply, status, ai, draw,
      rollMove: () => ({ roll: true, d: [1 + rnd(6), 1 + rnd(6)] }),
      okRoll: (mv) => Array.isArray(mv.d) && mv.d.length === 2 && mv.d.every((x) => x >= 1 && x <= 6) && { roll: true, d: [mv.d[0] | 0, mv.d[1] | 0] },
      drop(s0, ks) { let s = clone(s0); ks.forEach((k) => release(s, k)); const old = s.players; if (ks.includes(s.turn)) { let i = old.indexOf(s.turn); do { i = (i + 1) % old.length; } while (ks.includes(old[i])); s.turn = old[i]; s.phase = 'roll'; s.dbl = 0; s.extra = false; } s.players = old.filter((k) => !ks.includes(k)); return s; },
      pieceSide: () => -1,
      hit(x, y, W) { const q = W / 11, c = Math.floor(x / q), r = Math.floor(y / q); for (let i = 0; i < 40; i++) { const [rr, cc] = cellRC(i); if (rr === r && cc === c) return i; } return -1; },
      clickMove: () => null,
      cellInfo(s, i) {
        const C = CELLS[i]; if (!C) return '';
        if (!buyable(i)) return `<b>${C.name}</b>${C.amt ? ` — nộp ${money(C.amt)}` : ''}`;
        const o = s.own[i], own = o >= 0 ? `<span style="color:${COL[o]}">●</span> của ${NAME[o]}${s.mort[i] ? ' (đang cầm cố)' : ''}` : 'Chưa có chủ';
        const rent = C.t === 'prop' ? `Thuê: ${money(C.rent[0])} · 1 nhà ${money(C.rent[1])} · 2 nhà ${money(C.rent[2])} · 3 nhà ${money(C.rent[3])} · 4 nhà ${money(C.rent[4])} · KS ${money(C.rent[5])} · xây ${money(HOUSE[C.g])}/nhà` : C.t === 'st' ? 'Thuê: 250k / 500k / 1tr / 2tr theo số sân bay sở hữu' : 'Thuê: tổng xúc xắc × 40k (đủ 2 công ty × 100k)';
        return `<b>${C.name}</b> · giá ${money(C.price)}<br>${own}${s.houses[i] ? ` · ${s.houses[i] === 5 ? '🏨 khách sạn' : `🏠 ${s.houses[i]} nhà`}` : ''}<br><small>${rent}</small>`;
      },
      info(s) { return s.players.map((k) => `<span style="color:${COL[k]}">●</span> ${NAME[k]}: <b>${money(s.money[k])}</b> · ${s.own.filter((o) => o === k).length} đất${s.jail[k] ? ' · 🚔' : ''}`).join('<br>'); },
      /** các nút hành động cho người đang tới lượt */
      panel(s) {
        const k = s.turn, ms = legal(s), b = [];
        if (s.phase === 'roll') { b.push({ l: s.jail[k] ? '🎲 Gieo (ra đôi thì ra tù)' : '🎲 Gieo xúc xắc', m: { roll: true }, big: 1 }); if (ms.some((m) => m.payjail)) b.push({ l: '🔓 Nộp 500k ra tù', m: { payjail: true } }); }
        else if (s.phase === 'buy') { const C = CELLS[s.pos[k]]; b.push({ l: `🏷️ Mua ${C.name} (${money(C.price)})`, m: { buy: true }, big: 1, dis: s.money[k] < C.price }); b.push({ l: 'Không mua', m: { pass: true } }); }
        else {
          if (s.phase === 'debt') b.push({ l: `💀 Tuyên bố phá sản`, m: { bankrupt: true } });
          else b.push({ l: s.extra ? '🎲 Gieo tiếp (được đôi)' : '✅ Kết thúc lượt', m: { end: true }, big: 1 });
          ms.filter((m) => !m.end && !m.bankrupt).slice(0, 12).forEach((m) => b.push({ l: MV(m), m, small: 1 }));
        }
        return { text: s.phase === 'debt' ? `⚠️ Bạn đang nợ ${money(-s.money[k])} — bán nhà hoặc cầm cố đất để trả` : s.phase === 'buy' ? `Bạn vào ô <b>${CELLS[s.pos[k]].name}</b> chưa ai mua` : '', buttons: b };
      },
      waitText: (s) => (s.phase === 'buy' ? 'đang cân nhắc mua đất…' : ''),
    };
  })();

  /* ======================================================================
   * ⚓ HẢI CHIẾN (Bắn Tàu) — mỗi bên 1 vùng biển 8×8 có 5 tàu (dài 4·3·3·2·2), tàu không được nằm sát nhau.
   * Lần lượt chọn ô bắn vào biển đối thủ: trúng 🔥 thì được bắn tiếp, trượt 💦 thì mất lượt. Đánh chìm hết tàu đối thủ là thắng.
   * Giai đoạn xếp tàu: mỗi bên xếp xong gửi đội hình (bên 0 xếp trước rồi tới bên 1).
   * ==================================================================== */
  const BATTLE = (() => {
    const N = 8, SHIPS = [4, 3, 3, 2, 2];
    const rc = (i) => [Math.floor(i / N), i % N];
    function randomFleet() {
      for (let tries = 0; tries < 500; tries++) {
        const taken = new Set(), ships = [];
        let ok = true;
        for (const L of SHIPS) {
          let placed = false;
          for (let k = 0; k < 200 && !placed; k++) {
            const hor = Math.random() < 0.5, r = rnd(hor ? N : N - L + 1), c = rnd(hor ? N - L + 1 : N);
            const cells = Array.from({ length: L }, (_, j) => (hor ? r * N + c + j : (r + j) * N + c));
            // không chồng và không sát tàu khác (kể cả chéo)
            if (cells.some((x) => { const [rr, cc] = rc(x); for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const r2 = rr + dr, c2 = cc + dc; if (r2 >= 0 && r2 < N && c2 >= 0 && c2 < N && taken.has(r2 * N + c2)) return true; } return false; })) continue;
            cells.forEach((x) => taken.add(x)); ships.push(cells); placed = true;
          }
          if (!placed) { ok = false; break; }
        }
        if (ok) return ships;
      }
      return [[0, 1, 2, 3], [16, 17, 18], [32, 33, 34], [48, 49], [62, 63]];
    }
    /** kiểm tra đội hình đối thủ gửi qua mạng */
    function validFleet(f) {
      if (!Array.isArray(f) || f.length !== SHIPS.length) return false;
      const all = new Set();
      return f.every((sh, i) => Array.isArray(sh) && sh.length === SHIPS[i] && sh.every((x) => Number.isInteger(x) && x >= 0 && x < N * N && !all.has(x) && all.add(x)) && (sh.every((x) => Math.floor(x / N) === Math.floor(sh[0] / N)) || sh.every((x) => x % N === sh[0] % N)));
    }
    const init = () => ({ fleets: [null, null], shots: [Array(N * N).fill(0), Array(N * N).fill(0)], side: 0, phase: 'place', last: -1, n: 0 });
    const turn = (s) => (s.phase === 'place' ? (s.fleets[0] ? 1 : 0) : s.side);
    /** shots[k] = các phát bắn VÀO biển của bên k (0 chưa bắn · 1 trượt · 2 trúng) */
    const sunk = (s, k, sh) => sh.every((x) => s.shots[k][x] === 2);
    function legal(s) {
      if (s.phase === 'place') return [{ place: true }];
      const t = 1 - s.side, out = [];
      for (let i = 0; i < N * N; i++) if (!s.shots[t][i]) out.push({ shot: i });
      return out;
    }
    function apply(s0, m) {
      const s = { ...s0, fleets: s0.fleets.slice(), shots: [s0.shots[0].slice(), s0.shots[1].slice()], n: s0.n + 1 };
      if (m.place) { const k = turn(s0); s.fleets[k] = m.fleet; if (s.fleets[0] && s.fleets[1]) { s.phase = 'play'; s.side = 0; } return s; }
      const t = 1 - s.side, hit = s.fleets[t].some((sh) => sh.includes(m.shot));
      s.shots[t][m.shot] = hit ? 2 : 1; s.last = m.shot; s.lastBy = s.side; s.lastHit = hit;
      s.justSunk = hit ? s.fleets[t].find((sh) => sh.includes(m.shot) && sunk(s, t, sh)) || null : null;
      // tàu chìm: các ô quanh tàu chắc chắn không có tàu → tự đánh dấu trượt cho đỡ phí đạn
      if (s.justSunk) s.justSunk.forEach((x) => { const [r, c] = rc(x); for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const r2 = r + dr, c2 = c + dc; if (r2 >= 0 && r2 < N && c2 >= 0 && c2 < N && !s.shots[t][r2 * N + c2]) s.shots[t][r2 * N + c2] = 1; } });
      if (!hit) s.side = t;
      return s;
    }
    function status(s) {
      if (s.phase !== 'play') return null;
      for (const k of [0, 1]) if (s.fleets[k].every((sh) => sunk(s, k, sh))) return { winner: 1 - k, why: '⚓ Đánh chìm toàn bộ hạm đội!' };
      return null;
    }
    /** máy bắn: Dễ = bắn bừa · Vừa = săn quanh ô trúng · Khó = thêm tính xác suất chỗ tàu có thể nằm */
    function ai(s, lv) {
      if (s.phase === 'place') return { place: true, fleet: randomFleet() };
      const t = 1 - s.side, sh = s.shots[t], free = legal(s).map((m) => m.shot);
      if (lv === 0 && Math.random() < 0.6) return { shot: free[rnd(free.length)] };
      // các ô trúng mà tàu chưa chìm
      const open = []; for (let i = 0; i < N * N; i++) if (sh[i] === 2 && !s.fleets[t].some((x) => x.includes(i) && sunk(s, t, x))) open.push(i);
      const left = SHIPS.filter((_, j) => !sunk(s, t, s.fleets[t][j]));
      const score = Array(N * N).fill(0);
      for (const L of left) for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const hor of [true, false]) {
        if (hor ? c + L > N : r + L > N) continue;
        const cells = Array.from({ length: L }, (_, j) => (hor ? r * N + c + j : (r + j) * N + c));
        if (cells.some((x) => sh[x] === 1 || (sh[x] === 2 && !open.includes(x)))) continue;
        const cover = cells.filter((x) => open.includes(x)).length;
        if (open.length && !cover) { if (lv < 2) continue; }
        cells.forEach((x) => { if (!sh[x]) score[x] += 1 + cover * 30; });
      }
      let best = free[0], bv = -1;
      free.forEach((x) => { const v = score[x] + Math.random() * (lv === 2 ? 0.5 : 3); if (v > bv) { bv = v; best = x; } });
      return { shot: best };
    }
    /* ---------- vẽ: trái = biển của mình, phải = biển đối thủ ---------- */
    function sea(g, x0, y0, q, title, col) {
      const gr = g.createLinearGradient(0, y0, 0, y0 + q * N); gr.addColorStop(0, '#74c0fc'); gr.addColorStop(1, '#1c7ed6'); g.fillStyle = gr; g.fillRect(x0, y0, q * N, q * N);
      g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 1;
      for (let k = 0; k <= N; k++) { g.beginPath(); g.moveTo(x0 + k * q, y0); g.lineTo(x0 + k * q, y0 + q * N); g.moveTo(x0, y0 + k * q); g.lineTo(x0 + q * N, y0 + k * q); g.stroke(); }
      g.font = FONT(q * 0.42); g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(title, x0 + q * N / 2, y0 - q * 0.5);
      g.font = FONT(q * 0.26, 700); g.fillStyle = 'rgba(255,255,255,.75)';
      for (let k = 0; k < N; k++) { g.fillText('ABCDEFGH'[k], x0 + (k + 0.5) * q, y0 + q * N + q * 0.3); }
    }
    function hull(g, x0, y0, q, sh, color) {
      const [r0, c0] = rc(Math.min(...sh)), [r1, c1] = rc(Math.max(...sh));
      const x = x0 + c0 * q + q * 0.12, y = y0 + r0 * q + q * 0.12, w = (c1 - c0 + 1) * q - q * 0.24, h = (r1 - r0 + 1) * q - q * 0.24;
      g.fillStyle = color; g.beginPath(); g.roundRect(x, y, w, h, q * 0.35); g.fill(); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.35)'; sh.forEach((i) => { const [r, c] = rc(i); g.beginPath(); g.arc(x0 + (c + 0.5) * q, y0 + (r + 0.5) * q, q * 0.13, 0, Math.PI * 2); g.fill(); });
    }
    function marks(g, x0, y0, q, shots, t) {
      for (let i = 0; i < N * N; i++) {
        const [r, c] = rc(i), x = x0 + (c + 0.5) * q, y = y0 + (r + 0.5) * q;
        if (shots[i] === 1) { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(x, y, q * 0.12, 0, Math.PI * 2); g.fill(); }
        if (shots[i] === 2) { const f = 1 + Math.sin(t * 9 + i) * 0.12; g.fillStyle = '#ff6b6b'; g.beginPath(); g.arc(x, y, q * 0.3 * f, 0, Math.PI * 2); g.fill(); g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(x, y, q * 0.16 * f, 0, Math.PI * 2); g.fill(); }
      }
    }
    function draw(g, W, H, s, v) {
      const q = W / 17, y0 = q * 1.1, me = v.me ?? 0, op = 1 - me;
      g.fillStyle = '#0b2545'; g.fillRect(0, 0, W, H);
      sea(g, 0, y0, q, '🛳️ Biển của bạn', '#d0ebff'); sea(g, 9 * q, y0, q, '🎯 Biển đối thủ', '#ffc9c9');
      const myFleet = s.fleets[me] || v.preview;
      if (myFleet) myFleet.forEach((sh) => hull(g, 0, y0, q, sh, sunk(s, me, sh) && s.phase === 'play' ? '#868e96' : '#495057'));
      marks(g, 0, y0, q, s.shots[me], v.t);
      if (s.phase === 'play') s.fleets[op].forEach((sh) => { if (sunk(s, op, sh)) hull(g, 9 * q, y0, q, sh, '#a61e4d'); });
      marks(g, 9 * q, y0, q, s.shots[op], v.t);
      if (s.last >= 0) { const [r, c] = rc(s.last), x0 = s.lastBy === me ? 9 * q : 0; g.strokeStyle = '#ffd43b'; g.lineWidth = 3; g.strokeRect(x0 + c * q + 2, y0 + r * q + 2, q - 4, q - 4); }
      if (v.myTurn && s.phase === 'play' && v.hover >= 0 && !s.shots[op][v.hover]) { const [r, c] = rc(v.hover); g.strokeStyle = '#fff'; g.lineWidth = 3; const x = 9 * q + (c + 0.5) * q, y = y0 + (r + 0.5) * q; g.beginPath(); g.arc(x, y, q * 0.34, 0, Math.PI * 2); g.moveTo(x - q * 0.45, y); g.lineTo(x + q * 0.45, y); g.moveTo(x, y - q * 0.45); g.lineTo(x, y + q * 0.45); g.stroke(); }
      const left = (k) => s.fleets[k] ? s.fleets[k].filter((sh) => !sunk(s, k, sh)).length : SHIPS.length;
      g.font = FONT(q * 0.3, 700); g.fillStyle = '#fff'; g.textAlign = 'center';
      g.fillText(`Còn ${left(me)}/${SHIPS.length} tàu`, q * 4, y0 + q * N + q * 0.75); g.fillText(`Đối thủ còn ${left(op)}/${SHIPS.length} tàu`, q * 13, y0 + q * N + q * 0.75);
      if (s.phase === 'play' && s.justSunk) { g.font = FONT(q * 0.6); g.fillStyle = '#ffd43b'; g.fillText('💥 CHÌM TÀU!', W / 2, y0 + q * 4); }
    }
    return {
      id: 'battle', name: 'Hải Chiến', icon: '⚓', cols: 17, rows: 10.4, sides: ['Hạm đội Xanh', 'Hạm đội Đỏ'],
      rules: 'Mỗi bên giấu 5 tàu (dài 4·3·3·2·2) trong vùng biển 8×8. Lần lượt bấm ô bên <b>Biển đối thủ</b> để bắn: <b>trúng 🔥 được bắn tiếp</b>, trượt 💦 thì mất lượt. Đánh chìm hết tàu đối thủ trước là thắng.',
      init, turn, legal, apply, status, ai, draw,
      pieceSide: () => -1,
      hit(x, y, W) { const q = W / 17, c = Math.floor(x / q) - 9, r = Math.floor((y - q * 1.1) / q); return c < 0 || c >= N || r < 0 || r >= N ? -1 : r * N + c; },
      clickMove: (s, cell) => (s.phase === 'play' && cell >= 0 && !s.shots[1 - s.side][cell] ? { shot: cell } : null),
      okMove(s, mv) { if (mv.place) return s.phase === 'place' && validFleet(mv.fleet) ? { place: true, fleet: mv.fleet } : null; return legal(s).find((x) => x.shot === mv.shot) || null; },
      localAct(st2, m) { if (m.reroll) { st2.preview = randomFleet(); return true; } return false; },
      panel(s, st2) {
        if (s.phase === 'place') { if (!st2.preview) st2.preview = randomFleet(); return { text: '🛳️ Xếp hạm đội của bạn — bấm <b>Xếp lại</b> tới khi ưng ý', buttons: [{ l: '🎲 Xếp lại', m: { reroll: true } }, { l: '✅ Vào trận!', m: { place: true, fleet: st2.preview }, big: 1 }] }; }
        return { text: s.lastHit && s.lastBy === s.side && s.n > 2 ? '🔥 Trúng rồi — bắn tiếp!' : '🎯 Bấm 1 ô bên <b>Biển đối thủ</b> để bắn', buttons: [] };
      },
      waitText: (s) => (s.phase === 'place' ? 'đang xếp tàu…' : 'đang ngắm bắn…'),
    };
  })();

  const GAMES = { chess: CHESS, xiangqi: XQ, go: GO, ludo: LUDO, typhu: TYPHU, battle: BATTLE };

  /* ======================================================================
   * Khung chơi chung
   * ==================================================================== */
  let st = null; // { id, G, mode, lv, bet, s, mine:[sides], over, msg, sel, targets, last, busy, gid, opp, oppName }
  const pref = () => { const p = S().board = S().board || {}; p.lv = p.lv || {}; p.w = p.w || {}; p.l = p.l || {}; if (p.bet == null) p.bet = 1000; p.np = p.np || 4; p.rounds = p.rounds || 20; return p; };
  const ctrl = (side) => {
    if (st.mode === 'pvp') return 'me';
    if (st.room) { if (st.owner[side] !== NET.pid) return 'net'; return st.bots.includes(side) ? 'ai' : 'me'; }
    return st.mine.includes(side) ? 'me' : st.mode === 'ai' ? 'ai' : 'net';
  };
  const sideName = (side) => {
    const nm = st.G.sides[side];
    if (st.mode === 'pvp') return nm;
    if (st.room) return st.mine.includes(side) ? `Bạn (${nm})` : st.bots.includes(side) ? `Máy (${nm})` : `${esc(st.names[side] || '?')} (${nm})`;
    if (st.mine.includes(side)) return `Bạn (${nm})`;
    return st.mode === 'net' ? `${esc(st.oppName)} (${nm})` : `Máy (${nm})`;
  };
  let hover = -1, raf = 0;

  function open(id) {
    const G = GAMES[id]; if (!G) return;
    leave();
    const v = document.getElementById('arcadeView');
    v.innerHTML = `<div class="arc-bar"><b>${G.icon} ${G.name}</b><span>Phòng Cờ · Nhà Casino</span><button class="tv-x" data-close>✕ Thoát</button></div>
      <div class="ca-wrap bg-wrap"><div class="ca-side"></div><div class="ca-board"><canvas></canvas></div></div>`;
    v.classList.add('show');
    v.querySelector('[data-close]').onclick = () => { leave(); cancelAnimationFrame(raf); UI.closeArcade(); };
    const cv = v.querySelector('canvas');
    const toCell = (e) => { const r = cv.getBoundingClientRect(); return st ? st.G.hit(e.clientX - r.left, e.clientY - r.top, r.width, r.height, st.flip) : -1; };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); click(toCell(e)); });
    cv.addEventListener('pointermove', (e) => { hover = toCell(e); });
    cv.addEventListener('pointerleave', () => { hover = -1; });
    st = { id, G, idle: true };
    menu();
    const loop = () => { if (!cv.isConnected) return; draw(); raf = requestAnimationFrame(loop); };
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function leave() {
    if (st && !st.idle && !st.over) {
      if (st.mode === 'net') { send(st.room ? { op: 'quit', to: '*', gid: st.gid } : { op: 'resign', to: st.opp, gid: st.gid }); if (st.bet) UI.toast(`🏳️ Bỏ cuộc — mất ${fmt(st.bet)} xu cược`); }
      else if (st.mode === 'ai' && st.bet) UI.toast(`🏳️ Bỏ ván — mất ${fmt(st.bet)} xu cược`);
    }
  }
  function menu() {
    const side = document.querySelector('.bg-wrap .ca-side'); if (!side) return;
    const G = st.G, p = pref(), lv = p.lv[G.id] ?? 1;
    leave();
    st = { id: G.id, G, idle: true };
    side.innerHTML = `<h3>${G.icon} ${G.name}</h3><p class="muted">${G.rules}</p>
      <label>Độ khó của máy</label><div class="chips">${LV.map((n, i) => `<button class="chip ${lv === i ? 'on' : ''}" data-lv="${i}">${n}</button>`).join('')}</div>
      ${G.multi ? `<label>Số người chơi</label><div class="chips">${[2, 3, 4].map((n) => `<button class="chip ${p.np === n ? 'on' : ''}" data-np="${n}">${n} người</button>`).join('')}</div>` : ''}
      ${G.rounds ? `<label>Số vòng (hết vòng ai giàu nhất thắng)</label><div class="chips">${[10, 20, 30].map((n) => `<button class="chip ${p.rounds === n ? 'on' : ''}" data-rd="${n}">${n} vòng</button>`).join('')}</div>` : ''}
      <label>Tiền cược</label><div class="chips">${BETS.map((b) => `<button class="chip ${p.bet === b ? 'on' : ''}" data-bet="${b}">${b ? fmt(b) : 'Chơi vui'}</button>`).join('')}</div>
      <p class="muted small-note">Đấu máy: thắng nhận ${G.multi ? '<b>cược × số người</b>' : 'gấp đôi tiền cược'} · hoà trả lại · thua mất cược. Đã thắng ${p.w[G.id] || 0} · thua ${p.l[G.id] || 0}.</p>
      <button class="btn" data-ai>🤖 Đấu với máy</button>
      <button class="btn" data-net style="background:linear-gradient(135deg,#f08c00,#e8590c)">🌐 Mời người chơi online</button>
      <button class="btn ghost" data-pvp>👥 Chơi chung 1 máy${G.multi ? ' (2–4 người)' : ''}</button>`;
    side.querySelectorAll('[data-lv]').forEach((b) => b.onclick = () => { p.lv[G.id] = +b.dataset.lv; menu(); });
    side.querySelectorAll('[data-np]').forEach((b) => b.onclick = () => { p.np = +b.dataset.np; menu(); });
    side.querySelectorAll('[data-rd]').forEach((b) => b.onclick = () => { p.rounds = +b.dataset.rd; menu(); });
    side.querySelectorAll('[data-bet]').forEach((b) => b.onclick = () => { p.bet = +b.dataset.bet; menu(); });
    side.querySelector('[data-ai]').onclick = () => start('ai');
    side.querySelector('[data-pvp]').onclick = () => start('pvp');
    side.querySelector('[data-net]').onclick = () => inviteList(G.id);
  }
  function playersFor(n) { return n === 2 ? [0, 2] : n === 3 ? [0, 1, 2] : [0, 1, 2, 3]; }
  function start(mode, o = {}) {
    const G = GAMES[o.id || st.id], p = pref();
    const bet = mode === 'ai' ? p.bet : mode === 'net' ? o.bet : 0;
    if (mode === 'ai' && bet && !AV.spend(bet)) return;
    let mine, s;
    if (G.multi) {
      const players = mode === 'net' ? [0, 2] : playersFor(p.np);
      s = G.init(players, 1 + rnd(1e9), { rounds: p.rounds });
      mine = mode === 'net' ? [o.role === 0 ? 0 : 2] : mode === 'ai' ? [0] : players.slice();
    } else {
      s = G.init();
      mine = mode === 'net' ? [o.side] : mode === 'ai' ? [Math.random() < 0.5 ? 0 : 1] : [0, 1];
    }
    st = { id: G.id, G, mode, lv: p.lv[G.id] ?? 1, bet, s, mine, over: false, sel: -1, targets: [], last: null, busy: false, moves: 0, flip: !G.multi && mode !== 'pvp' && mine[0] === 1, n0: G.multi ? s.players.length : 2, gid: o.gid, opp: o.opp, oppName: o.oppName, seen: Date.now() };
    side(); next();
  }
  /** sau mỗi nước: kiểm tra thắng thua, tới lượt máy thì cho máy đi */
  function next() {
    if (!st || st.over) return;
    const r = st.G.status(st.s);
    if (r) return finish(r);
    const turn = st.G.turn(st.s), who = ctrl(turn);
    side();
    if (who === 'ai') { st.busy = true; side(); const cur = st; setTimeout(() => { if (st !== cur || st.over) return; st.busy = false; let m = st.G.ai(st.s, st.lv); if (m && m.roll) m = st.G.rollMove ? st.G.rollMove() : { roll: true, v: 1 + rnd(6) }; if (!m) return finish({ winner: 1 - turn, why: 'Hết nước' }); doMove(m, st.mode === 'net'); }, st.G.multi ? 420 : 350 + rnd(300)); return; }
    // cá ngựa: không có ngựa nào đi được thì tự bỏ lượt (chỉ bên điều khiển lượt đó thực hiện)
    if (who === 'me' && st.G.multi && st.s.phase === 'move') { const ms = st.G.legal(st.s); if (ms[0].skip) { const cur = st; setTimeout(() => { if (st === cur && !st.over && st.s.phase === 'move') doMove({ skip: true }, true); }, 1100); } }
  }
  function doMove(m, mine) {
    if (mine && st.mode === 'net') send({ op: 'move', to: st.room ? '*' : st.opp, gid: st.gid, m });
    st.s = st.G.apply(st.s, m); st.moves++;
    if (m.place) st.preview = null;
    if (!m.roll) st.last = m;
    st.sel = -1; st.targets = [];
    if (st.G.multi && st.s.kick) UI.toast(`💥 Đá ngựa ${st.G.sides[st.s.kick.o]} về chuồng!`, 1600);
    next();
  }
  function click(cell) {
    if (st && !st.idle && st.G.cellInfo && cell >= 0) { st.sel = cell; st.infoCell = cell; side(); return; }
    if (!st || st.idle || st.over || st.busy || cell < 0) return;
    const turn = st.G.turn(st.s);
    if (ctrl(turn) !== 'me') return UI.toast(st.mode === 'net' ? `⏳ Chờ ${st.room ? sideName(turn) : st.oppName} đi…` : '⏳ Chờ máy đi…', 1200);
    if (st.G.clickMove) { const m = st.G.clickMove(st.s, cell); if (m) doMove(m, true); else if (st.G.multi && st.s.phase === 'roll') roll(); return; }
    const hit = st.targets.find((m) => m.t === cell);
    if (hit) return doMove(hit, true);
    if (st.G.pieceSide(st.s, cell) === turn) { st.sel = cell; st.targets = st.G.movesFrom(st.s, cell); if (!st.targets.length) UI.toast('Quân này chưa đi được', 1000); }
    else { st.sel = -1; st.targets = []; }
  }
  function roll() {
    if (!st || st.over || !st.G.multi || st.s.phase !== 'roll' || ctrl(st.s.turn) !== 'me') return;
    doMove(st.G.rollMove ? st.G.rollMove() : { roll: true, v: 1 + rnd(6) }, true);
  }
  function pass() { if (!st || st.over || !st.G.canPass || ctrl(st.G.turn(st.s)) !== 'me') return; doMove({ pass: true, p: -1 }, true); }
  function side() {
    const el = document.querySelector('.bg-wrap .ca-side'); if (!el || !st || st.idle) return;
    const G = st.G, turn = G.turn(st.s), dot = (k) => (G.colors ? `<b style="color:${G.colors[k]}">●</b> ` : '');
    if (st.over) {
      el.innerHTML = `<h3>${G.icon} ${G.name}</h3><p class="ca-turn">${st.msg}</p>${G.info ? `<p class="muted small-note">${G.info(st.s)}</p>` : ''}
        ${st.room ? '' : st.mode === 'net' ? `<button class="btn" data-re>🔁 Mời đấu lại</button>` : `<button class="btn" data-again>🔁 Ván mới</button>`}<button class="btn ghost" data-menu>⚙️ Đổi chế độ</button>`;
    } else {
      el.innerHTML = `<h3>${G.icon} ${st.mode === 'ai' ? `Đấu máy · ${LV[st.lv]}` : st.room ? `🌐 Phòng ${st.s.players.length} người` : st.mode === 'net' ? `🌐 Đấu với ${esc(st.oppName)}` : 'Chơi chung máy'}</h3>
        ${st.bet ? `<p>💰 Cược <b>${fmt(st.bet)} xu</b></p>` : ''}
        <p class="ca-turn">Lượt: ${dot(turn)}<b>${sideName(turn)}</b>${st.busy ? ' — đang nghĩ…' : ''}</p>
        ${G.panel && ctrl(turn) === 'me' ? panelHtml() : G.panel ? `<p class="muted">${(G.waitText && G.waitText(st.s)) || 'đang đi…'}</p>` : G.multi && ctrl(turn) === 'me' ? (st.s.phase === 'roll' ? '<button class="btn" data-roll style="font-size:20px">🎲 Gieo xúc xắc</button>' : `<p class="muted">Được <b>${st.s.dice}</b> — bấm vào ngựa đang nhấp nháy để đi</p>`) : ''}
        ${G.canPass && ctrl(turn) === 'me' ? '<button class="btn ghost" data-pass>⏭️ Bỏ lượt</button>' : ''}
        ${G.info ? `<p class="muted small-note">${G.info(st.s)}</p>` : ''}
        ${G.cellInfo && st.infoCell != null ? `<p class="small-note" style="background:#fff3bf;border-radius:10px;padding:6px">${G.cellInfo(st.s, st.infoCell)}</p>` : G.cellInfo ? '<p class="muted small-note">👆 Bấm vào ô đất trên bàn để xem giá & tiền thuê</p>' : ''}
        ${!G.multi && st.mode !== 'pvp' ? `<p class="muted small-note">Bạn cầm quân <b>${G.sides[st.mine[0]]}</b>${st.mine[0] === 0 ? ' · đi trước' : ''}</p>` : ''}
        <button class="btn ghost" data-resign>🏳️ ${st.mode === 'pvp' ? 'Kết thúc ván' : 'Xin thua'}</button>`;
    }
    const q = (s) => el.querySelector(s);
    el.querySelectorAll('[data-mv]').forEach((b) => b.onclick = () => { if (!st || st.over || ctrl(st.G.turn(st.s)) !== 'me') return; const m = JSON.parse(b.dataset.mv); if (st.G.localAct && st.G.localAct(st, m)) return side(); if (m.roll) return roll(); doMove(m, true); });
    if (q('[data-roll]')) q('[data-roll]').onclick = roll;
    if (q('[data-pass]')) q('[data-pass]').onclick = pass;
    if (q('[data-resign]')) q('[data-resign]').onclick = () => UI.confirm(st.mode === 'pvp' ? 'Kết thúc ván này?' : 'Xin thua ván này?', '🏳️ Đồng ý', () => {
      if (!st || st.over) return;
      if (st.mode === 'net') send(st.room ? { op: 'quit', to: '*', gid: st.gid } : { op: 'resign', to: st.opp, gid: st.gid });
      if (st.mode === 'pvp') { st.over = true; st.msg = '🏳️ Đã kết thúc ván'; side(); return; }
      finish({ winner: -2, why: '🏳️ Bạn đã xin thua' });
    });
    if (q('[data-again]')) q('[data-again]').onclick = () => start(st.mode);
    if (q('[data-menu]')) q('[data-menu]').onclick = menu;
    if (q('[data-re]')) q('[data-re]').onclick = () => { if (st.bet > S().coins) return UI.toast('Không đủ xu để đấu tiếp'); if (!NET.remotes.get(st.opp)) return UI.toast('⚠️ Đối thủ đã rời khu'); sendInvite({ to: st.opp, name: st.oppName, game: st.id, bet: st.bet }); };
  }
  function panelHtml() {
    const P = st.G.panel(st.s, st);
    return `${P.text ? `<p class="muted">${P.text}</p>` : ''}${P.buttons.map((b) => `<button class="btn ${b.big ? '' : 'ghost'}" style="${b.big ? 'font-size:17px' : b.small ? 'font-size:12px;padding:6px 8px' : ''}" data-mv='${JSON.stringify(b.m)}' ${b.dis ? 'disabled' : ''}>${b.l}</button>`).join('')}`;
  }
  /** kết thúc ván. r.winner: bên thắng · −1 hoà · −2 mình xin thua */
  function finish(r) {
    if (st.over) return;
    st.over = true; st.busy = false;
    const G = st.G, p = pref(), id = G.id;
    const iWin = r.winner >= 0 && st.mine.includes(r.winner), draw = r.winner === -1;
    if (st.mode === 'pvp') { st.msg = draw ? r.why : `🏆 ${G.sides[r.winner]} thắng! ${r.why}`; side(); return; }
    const pot = st.room ? st.bet * st.humans0 : st.mode === 'net' ? st.bet * 2 : st.bet * (G.multi ? st.n0 || st.s.players.length : 2);
    if (draw) { st.msg = `${r.why}${st.bet ? ` — trả lại ${fmt(st.bet)} xu` : ''}`; if (st.bet) AV.earn(st.bet, 5); }
    else if (iWin) {
      p.w[id] = (p.w[id] || 0) + 1; AV.earn(pot, st.mode === 'net' ? 20 : [8, 15, 25][st.lv]); AV.quest('arcade');
      st.msg = `🏆 Bạn thắng! ${r.why}${pot ? ` +${fmt(pot)} xu` : ''}`;
      if (typeof NET !== 'undefined' && NET.sendSys && (st.mode === 'net' || st.lv === 2)) NET.sendSys(`${G.icon} ${S().name} vừa thắng ${st.mode === 'net' ? st.oppName : 'máy mức KHÓ'} ván ${G.name}!`);
    } else {
      p.l[id] = (p.l[id] || 0) + 1; AV.earn(0, 4);
      st.msg = `😢 ${r.winner === -2 ? r.why : `${sideName(r.winner)} thắng — ${r.why}`}${st.bet ? ` · mất ${fmt(st.bet)} xu` : ''}`;
    }
    AV.markChanged(); UI.updateHud(); side();
  }
  function draw() {
    const cv = document.querySelector('.bg-wrap .ca-board canvas'); if (!cv || !st) return;
    const G = st.G, box = cv.parentElement.getBoundingClientRect(), asp = G.rows / G.cols;
    const W = Math.max(200, window.innerWidth <= 700 ? Math.min(box.width - 8, window.innerHeight * 0.62 / asp) : Math.min(box.width - 8, (box.height - 8) / asp)), H = W * asp, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = st.s || (G.multi ? G.init([0, 1, 2, 3]) : G.init());
    const myTurn = !st.idle && !st.over && ctrl(G.turn(s)) === 'me';
    G.draw(g, W, H, s, { me: st.idle ? 0 : st.mode === 'pvp' ? G.turn(s) : st.mine[0], preview: st.preview, sel: st.sel ?? -1, targets: st.targets || [], last: st.last, flip: st.flip, hover, myTurn, t: performance.now() / 1000, check: G.checkSq && !st.idle ? G.checkSq(s) : -1 });
    if (st.idle) { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W, H); g.font = FONT(Math.max(16, W / 18)); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('👈 Chọn chế độ chơi', W / 2, H / 2); }
  }

  /* ---------- 🌐 online ---------- */
  const send = (p) => { if (typeof NET !== 'undefined' && NET.sendBoard) NET.sendBoard(p); };
  let invite = null, invP = null;
  function inviteList(game) {
    if (GAMES[game] && GAMES[game].multi) return ludoLobby(null, game);
    const list = (typeof NET !== 'undefined' ? NET.players() : []).filter((r) => !r.hidden && r.id);
    const p = UI.panel('👥 Mời người chơi cờ', list.length ? `<p class="muted">Người đang ở cùng khu với bạn:</p><div class="shop-list">${list.map((r, i) => `<div class="shop-row"><span class="ic">🧑</span><div class="info"><b>${esc(r.name)}</b></div><button class="btn small" data-i="${i}">♟️ Mời</button></div>`).join('')}</div>`
      : '<p class="muted">Chưa có ai ở cùng khu. Rủ bạn bè vào 🎰 Nhà Casino rồi bấm lại nhé — hoặc bấm vào nhân vật của họ → ♟️ Mời chơi cờ.</p>');
    p.body.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { p.close(); challenge(list[+b.dataset.i], game); });
  }
  function challenge(r, game) {
    if (st && !st.idle && !st.over && st.mode === 'net') return UI.toast('Bạn đang trong một ván cờ rồi');
    let gm = GAMES[game] ? game : 'chess', bet = pref().bet;
    const p = UI.panel(`♟️ Mời ${esc(r.name)} chơi cờ`, '');
    const render = () => {
      p.body.innerHTML = `<p class="muted">Chọn loại cờ và mức cược — mỗi bên đặt bằng nhau, thắng ăn cả, hoà trả lại.</p>
        <div class="chips center">${Object.values(GAMES).map((G) => `<button class="chip ${G.id === gm ? 'on' : ''}" data-g="${G.id}">${G.icon} ${G.name}</button>`).join('')}</div>
        <div class="chips center">${BETS.map((c) => `<button class="chip ${c === bet ? 'on' : ''}" data-c="${c}">${c ? '🪙 ' + fmt(c) : 'Chơi vui'}</button>`).join('')}</div>
        ${GAMES[gm].multi ? `<p class="muted small-note">${GAMES[gm].icon} ${GAMES[gm].name} chơi được tới 4 người — bấm tiếp để mời thêm bạn vào phòng.</p>` : ''}
        <div class="row-end"><button class="btn" data-go>${GAMES[gm].multi ? `${GAMES[gm].icon} Tiếp tục` : '♟️ Gửi lời mời'}</button></div>`;
      p.body.querySelectorAll('[data-g]').forEach((b) => b.onclick = () => { gm = b.dataset.g; render(); });
      p.body.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { bet = +b.dataset.c; render(); });
      p.body.querySelector('[data-go]').onclick = () => {
        if (bet > S().coins) return UI.toast(`Không đủ xu — cần ${fmt(bet)} xu`);
        if (!NET.remotes.get(r.id)) return UI.toast('⚠️ Người này vừa rời khu rồi');
        p.close(); if (GAMES[gm].multi) return ludoLobby(r, gm); sendInvite({ to: r.id, name: r.name, game: gm, bet });
      };
    };
    render();
  }
  function sendInvite(o) {
    invite = { ...o, gid: NET.pid + '-' + Date.now(), side: Math.random() < 0.5 ? 0 : 1 };
    send({ op: 'invite', to: o.to, gid: invite.gid, bet: o.bet, game: o.game, side: invite.side, name: S().name });
    UI.toast(`${GAMES[o.game].icon} Đã mời ${o.name} chơi ${GAMES[o.game].name} — chờ trả lời…`, 4000);
    const gid = invite.gid;
    setTimeout(() => { if (invite && invite.gid === gid) { invite = null; UI.toast('⌛ Không thấy trả lời — đã huỷ lời mời'); } }, 25000);
  }
  function onInvite(m) {
    const G = GAMES[m.game]; if (!G) return;
    const bet = Math.max(0, Math.floor(+m.bet) || 0), who = String(m.name || 'Người chơi').slice(0, 16);
    if ((st && !st.idle && !st.over && st.mode === 'net') || (invP && invP.el.isConnected)) return send({ op: 'busy', to: m.id, gid: m.gid });
    invP = UI.panel(`${G.icon} Lời mời chơi ${G.name}`, `<p class="confirm-text"><b>${esc(who)}</b> mời bạn chơi <b>${G.name}</b>${bet ? ` · cược <b>${fmt(bet)} xu</b>` : ' (chơi vui)'}</p>
      ${S().coins < bet ? '<p class="game-msg">⚠️ Bạn không đủ xu</p>' : ''}
      <div class="row-end"><button class="btn ghost" data-no>Từ chối</button><button class="btn" data-yes ${S().coins < bet ? 'disabled' : ''}>${G.icon} Chơi</button></div>`);
    const ip = invP, tm = setTimeout(() => { if (ip.el.isConnected) { ip.close(); send({ op: 'decline', to: m.id, gid: m.gid, why: 'không trả lời' }); } }, 22000);
    ip.body.querySelector('[data-no]').onclick = () => { clearTimeout(tm); ip.close(); send({ op: 'decline', to: m.id, gid: m.gid, why: 'từ chối' }); };
    ip.body.querySelector('[data-yes]').onclick = () => {
      clearTimeout(tm); ip.close();
      if (bet && !AV.spend(bet)) return send({ op: 'decline', to: m.id, gid: m.gid, why: 'không đủ xu' });
      send({ op: 'accept', to: m.id, gid: m.gid });
      startNet({ id: m.game, gid: m.gid, opp: m.id, oppName: who, bet, side: 1 - (m.side | 0), role: 1 });
    };
  }
  function startNet(o) {
    open(o.id);
    start('net', o);
    UI.toast(`${GAMES[o.id].icon} Bắt đầu ván ${GAMES[o.id].name} với ${o.oppName}!`, 3500);
  }
  function onNet(m) {
    if (typeof NET === 'undefined') return;
    if (m.to === '*') return onRoom(m);
    if (m.to !== NET.pid) return;
    if (m.op === 'invite') return m.room ? onRoomInvite(m) : onInvite(m);
    if (lobby && m.gid === lobby.gid) return onLobby(m);
    if (m.op === 'accept' && st && st.room && m.gid === st.gid) return send({ op: 'cancel', to: m.id, gid: m.gid });
    if (m.op === 'cancel' && joining && m.gid === joining.gid) return cancelJoin('⚠️ Phòng đã bắt đầu hoặc bị huỷ — đã trả lại tiền cược');
    if (m.op === 'accept' && invite && m.gid === invite.gid && m.id === invite.to) {
      const iv = invite; invite = null;
      if (iv.bet && !AV.spend(iv.bet)) { send({ op: 'resign', to: m.id, gid: m.gid, why: 'nopay' }); return UI.toast('Không đủ xu để vào ván'); }
      return startNet({ id: iv.game, gid: iv.gid, opp: m.id, oppName: iv.name, bet: iv.bet, side: iv.side, role: 0 });
    }
    if ((m.op === 'decline' || m.op === 'busy') && invite && m.gid === invite.gid) { invite = null; return UI.toast(m.op === 'busy' ? '♟️ Người đó đang bận ván khác' : `Lời mời bị từ chối (${esc(m.why || 'từ chối')})`, 4000); }
    if (!st || st.idle || st.mode !== 'net' || m.gid !== st.gid || m.id !== st.opp) return;
    st.seen = Date.now();
    if (m.op === 'resign' && !st.over) {
      if (m.why === 'nopay') { st.over = true; if (st.bet) AV.earn(st.bet); st.msg = '⚠️ Đối thủ không đủ xu — đã trả lại tiền cược'; side(); return; }
      return finish({ winner: st.mine[0], why: `🏳️ ${esc(st.oppName)} bỏ cuộc` });
    }
    if (m.op === 'move' && !st.over && m.m && ctrl(st.G.turn(st.s)) === 'net') {
      const mv = m.m;
      // kiểm tra nước đi bên kia gửi có hợp lệ không
      if (mv.roll) { if (st.s.phase !== 'roll' || !(mv.v >= 1 && mv.v <= 6)) return; return doMove({ roll: true, v: mv.v | 0 }); }
      const ok = st.G.okMove ? st.G.okMove(st.s, mv) : st.G.legal(st.s).find((x) => (x.skip && mv.skip) || (x.pass && mv.pass) || (x.h != null && x.h === mv.h && x.to === mv.to) || (x.p != null && x.p >= 0 && x.p === mv.p) || (x.f != null && x.f === mv.f && x.t === mv.t));
      if (ok) doMove(ok);
    }
  }
  /* ---------- 🐴 PHÒNG CÁ NGỰA nhiều người ---------- */
  let lobby = null, joining = null;
  /** chủ phòng: chọn tối đa 3 bạn, mức cược, có cho máy chơi ghế trống không */
  function ludoLobby(pre, game = 'ludo') {
    const GG = GAMES[game];
    if (st && st.room && !st.over) return UI.toast('Bạn đang trong một ván cá ngựa rồi');
    const list = (typeof NET !== 'undefined' ? NET.players() : []).filter((r) => !r.hidden && r.id);
    if (pre && !list.some((r) => r.id === pre.id)) list.unshift(pre);
    const pick = new Set(pre ? [pre.id] : []);
    let bet = pref().bet, bots = true;
    const p = UI.panel(`${GG.icon} Mở phòng ${GG.name}`, '');
    const render = () => {
      p.body.innerHTML = `<p class="muted">Chọn <b>tối đa 3 bạn</b> cùng khu để mời. Ai nhận lời sẽ vào phòng, mỗi người cược bằng nhau — <b>người thắng ăn hết</b>.</p>
        ${list.length ? `<div class="shop-list">${list.map((r, i) => `<div class="shop-row"><span class="ic">${pick.has(r.id) ? '✅' : '🧑'}</span><div class="info"><b>${esc(r.name)}</b></div><button class="btn small ${pick.has(r.id) ? '' : 'ghost'}" data-i="${i}">${pick.has(r.id) ? 'Đã chọn' : '+ Mời'}</button></div>`).join('')}</div>` : '<p class="muted">Chưa có ai ở cùng khu — rủ bạn bè vào 🎰 Nhà Casino nhé.</p>'}
        <div class="chips center">${BETS.map((c) => `<button class="chip ${c === bet ? 'on' : ''}" data-c="${c}">${c ? '🪙 ' + fmt(c) : 'Chơi vui'}</button>`).join('')}</div>
        <label style="display:flex;gap:8px;align-items:center;justify-content:center;margin:8px 0"><input type="checkbox" data-bots ${bots ? 'checked' : ''}> 🤖 Ghế trống cho máy chơi (đủ 4 người)</label>
        <div class="row-end"><button class="btn" data-go ${pick.size ? '' : 'disabled'}>${GG.icon} Mời ${pick.size} bạn</button></div>`;
      p.body.querySelectorAll('[data-i]').forEach((b) => b.onclick = () => { const r = list[+b.dataset.i]; if (pick.has(r.id)) pick.delete(r.id); else if (pick.size < 3) pick.add(r.id); else UI.toast('Tối đa 3 bạn (đủ 4 người)'); render(); });
      p.body.querySelectorAll('[data-c]').forEach((b) => b.onclick = () => { bet = +b.dataset.c; render(); });
      p.body.querySelector('[data-bots]').onchange = (e) => { bots = e.target.checked; };
      p.body.querySelector('[data-go]').onclick = () => {
        if (bet > S().coins) return UI.toast(`Không đủ xu — cần ${fmt(bet)} xu`);
        const ppl = list.filter((r) => pick.has(r.id) && NET.remotes.get(r.id));
        if (!ppl.length) return UI.toast('⚠️ Những người này vừa rời khu rồi');
        lobby = { game, rounds: pref().rounds, gid: NET.pid + '-' + Date.now(), bet, bots, panel: p, seats: ppl.map((r) => ({ id: r.id, name: r.name, st: 'wait' })) };
        lobby.seats.forEach((sd) => send({ op: 'invite', room: 1, to: sd.id, gid: lobby.gid, bet, game, n: lobby.seats.length + 1, name: S().name }));
        const gid = lobby.gid;
        setTimeout(() => { if (lobby && lobby.gid === gid) { lobby.seats.forEach((sd) => { if (sd.st === 'wait') sd.st = 'no'; }); lobbyRender(); } }, 30000);
        lobbyRender();
      };
    };
    render();
  }
  function lobbyRender() {
    if (!lobby) return;
    const p = lobby.panel, ok = lobby.seats.filter((x) => x.st === 'ok').length, wait = lobby.seats.filter((x) => x.st === 'wait').length;
    if (!p.el.isConnected) { lobby.panel = UI.panel(`${GAMES[lobby.game].icon} Phòng ${GAMES[lobby.game].name}`, ''); return lobbyRender(); }
    p.body.innerHTML = `<p class="muted">Đang chờ bạn bè trả lời… ${lobby.bet ? `Cược <b>${fmt(lobby.bet)} xu</b>/người.` : 'Chơi vui.'}</p>
      <div class="shop-list"><div class="shop-row"><span class="ic">👑</span><div class="info"><b>${esc(S().name)}</b><small>Chủ phòng</small></div></div>
      ${lobby.seats.map((x) => `<div class="shop-row"><span class="ic">${x.st === 'ok' ? '✅' : x.st === 'no' ? '❌' : '⏳'}</span><div class="info"><b>${esc(x.name)}</b><small>${x.st === 'ok' ? 'Đã vào phòng' : x.st === 'no' ? 'Không tham gia' : 'Đang chờ trả lời…'}</small></div></div>`).join('')}</div>
      <p class="muted small-note">${lobby.bots ? '🤖 Ghế trống sẽ do máy chơi' : 'Chỉ người thật chơi'} · tất cả trả lời xong sẽ tự bắt đầu</p>
      <div class="row-end"><button class="btn ghost" data-cancel>Huỷ phòng</button><button class="btn" data-start ${ok ? '' : 'disabled'}>▶ Bắt đầu (${ok + 1} người)</button></div>`;
    p.body.querySelector('[data-cancel]').onclick = () => { lobby.seats.forEach((x) => { if (x.st !== 'no') send({ op: 'cancel', to: x.id, gid: lobby.gid }); }); lobby = null; p.close(); };
    p.body.querySelector('[data-start]').onclick = startLobby;
    if (ok && !wait) setTimeout(() => { if (lobby && lobby.panel === p && !lobby.seats.some((x) => x.st === 'wait')) startLobby(); }, 900);
  }
  function onLobby(m) {
    const x = lobby.seats.find((q) => q.id === m.id); if (!x) return;
    if (m.op === 'accept') x.st = 'ok';
    if (m.op === 'decline' || m.op === 'busy') { x.st = 'no'; UI.toast(`🐴 ${x.name} ${m.op === 'busy' ? 'đang bận' : 'không tham gia'}`, 2500); }
    lobbyRender();
  }
  function startLobby() {
    if (!lobby) return;
    const L = lobby, ok = L.seats.filter((x) => x.st === 'ok');
    if (!ok.length) return UI.toast('Chưa có ai vào phòng');
    if (L.bet && !AV.spend(L.bet)) { ok.forEach((x) => send({ op: 'cancel', to: x.id, gid: L.gid })); lobby = null; L.panel.close(); return; }
    L.seats.filter((x) => x.st === 'wait').forEach((x) => send({ op: 'cancel', to: x.id, gid: L.gid }));
    const humans = [{ id: NET.pid, name: S().name }, ...ok], players = playersFor(L.bots ? 4 : Math.max(2, humans.length));
    const seats = humans.map((h, i) => ({ id: h.id, name: String(h.name).slice(0, 16), color: players[i] }));
    const d = { op: 'start', to: '*', game: L.game, rounds: L.rounds, seed: 1 + rnd(1e9), gid: L.gid, bet: L.bet, seats, bots: players.slice(humans.length), host: NET.pid };
    lobby = null; L.panel.close();
    send(d); startRoom(d);
  }
  function onRoomInvite(m) {
    const bet = Math.max(0, Math.floor(+m.bet) || 0), who = String(m.name || 'Người chơi').slice(0, 16);
    if ((st && !st.idle && !st.over && st.mode === 'net') || joining || lobby || (invP && invP.el.isConnected)) return send({ op: 'busy', to: m.id, gid: m.gid });
    const GG = GAMES[m.game] || LUDO;
    invP = UI.panel(`${GG.icon} Lời mời chơi ${GG.name}`, `<p class="confirm-text"><b>${esc(who)}</b> mời bạn vào phòng <b>${GG.name}</b> (${m.n | 0} người)${bet ? ` · cược <b>${fmt(bet)} xu</b>` : ' (chơi vui)'}</p>
      ${S().coins < bet ? '<p class="game-msg">⚠️ Bạn không đủ xu</p>' : ''}
      <div class="row-end"><button class="btn ghost" data-no>Từ chối</button><button class="btn" data-yes ${S().coins < bet ? 'disabled' : ''}>${GG.icon} Vào phòng</button></div>`);
    const ip = invP, tm = setTimeout(() => { if (ip.el.isConnected) { ip.close(); send({ op: 'decline', to: m.id, gid: m.gid }); } }, 25000);
    ip.body.querySelector('[data-no]').onclick = () => { clearTimeout(tm); ip.close(); send({ op: 'decline', to: m.id, gid: m.gid }); };
    ip.body.querySelector('[data-yes]').onclick = () => {
      clearTimeout(tm); ip.close();
      if (bet && !AV.spend(bet)) return send({ op: 'decline', to: m.id, gid: m.gid });
      joining = { gid: m.gid, host: m.id, bet };
      send({ op: 'accept', to: m.id, gid: m.gid });
      UI.toast(`${GG.icon} Đã vào phòng của ${who} — chờ chủ phòng bắt đầu…`, 5000);
      const gid = m.gid;
      setTimeout(() => { if (joining && joining.gid === gid) cancelJoin('⌛ Chủ phòng chưa bắt đầu — đã trả lại tiền cược'); }, 60000);
    };
  }
  function cancelJoin(msg) { if (joining.bet) AV.earn(joining.bet); joining = null; UI.toast(msg, 4500); }
  function startRoom(d) {
    if (d.host !== NET.pid) { if (!joining || joining.gid !== d.gid || joining.host !== d.host) return; if (!d.seats.some((x) => x.id === NET.pid)) return cancelJoin('⚠️ Phòng đã đủ người — đã trả lại tiền cược'); joining = null; }
    const GG = GAMES[d.game] || LUDO;
    open(GG.id);
    const owner = {}, names = {}, players = [...d.seats.map((x) => x.color), ...d.bots].sort((a, b) => a - b);
    d.seats.forEach((x) => { owner[x.color] = x.id; names[x.color] = x.name; });
    d.bots.forEach((k) => { owner[k] = d.host; });
    const me = d.seats.find((x) => x.id === NET.pid);
    st = { id: GG.id, G: GG, mode: 'net', room: true, lv: 1, bet: d.bet, s: GG.init(players, d.seed, { rounds: d.rounds }), mine: [me.color], n0: players.length, owner, names, bots: d.bots.slice(), humans0: d.seats.length, gid: d.gid, oppName: d.seats.filter((x) => x.id !== NET.pid).map((x) => x.name).join(', '), over: false, sel: -1, targets: [], last: null, busy: false, moves: 0, flip: false, gone: {} };
    UI.toast(`${GG.icon} Bắt đầu! Bạn là ${GG.sides[me.color]}`, 4000);
    side(); next();
  }
  /** người chơi thoát / mất kết nối: bỏ ngựa của họ khỏi bàn; nếu là chủ phòng thì người kế tiếp điều khiển máy */
  function dropPeer(pid, why) {
    if (!st || !st.room || st.over) return;
    const ks = Object.keys(st.owner).map(Number).filter((k) => st.owner[k] === pid && !st.bots.includes(k) && st.s.players.includes(k));
    if (ks.length) { UI.toast(`🚪 ${esc(st.names[ks[0]] || 'Một người')} ${why}`, 3000); st.s = st.G.drop(st.s, ks); }
    if (st.bots.some((k) => st.owner[k] === pid)) {
      const heir = st.s.players.filter((k) => !st.bots.includes(k)).map((k) => st.owner[k]).filter(Boolean)[0];
      st.bots.forEach((k) => { if (st.owner[k] === pid) st.owner[k] = heir; });
    }
    const humansLeft = st.s.players.filter((k) => !st.bots.includes(k));
    if (st.s.players.length <= 1 || !humansLeft.length) return finish({ winner: st.s.players[0] ?? -1, why: '🏁 Những người khác đã rời bàn' });
    if (humansLeft.length === 1 && humansLeft[0] === st.mine[0] && !st.s.players.some((k) => st.bots.includes(k))) return finish({ winner: st.mine[0], why: '🏁 Những người khác đã rời bàn' });
    st.busy = false; next();
  }
  function onRoom(m) {
    if (m.op === 'start') return startRoom(m);
    if (!st || !st.room || st.idle || m.gid !== st.gid) return;
    if (m.op === 'quit') return dropPeer(m.id, 'đã rời bàn');
    if (m.op === 'move' && !st.over && m.m) {
      const turn = st.G.turn(st.s);
      if (st.owner[turn] !== m.id || ctrl(turn) !== 'net') return;
      const mv = m.m;
      if (mv.roll) { if (st.s.phase !== 'roll') return; if (st.G.okRoll) { const r = st.G.okRoll(mv); return r && doMove(r); } if (!(mv.v >= 1 && mv.v <= 6)) return; return doMove({ roll: true, v: mv.v | 0 }); }
      const key = (o) => JSON.stringify(Object.keys(o).sort().reduce((a, k2) => (o[k2] === undefined ? a : { ...a, [k2]: o[k2] }), {}));
      const ok = st.G.legal(st.s).find((x) => (x.skip && mv.skip) || (x.h != null && x.h === mv.h && x.to === mv.to) || (!x.roll && x.h == null && key(x) === key(mv)));
      if (ok) doMove(ok);
    }
  }

  /** đối thủ rời khu quá 30 giây → xử thắng (phòng cá ngựa: bỏ ngựa người đó khỏi bàn) */
  setInterval(() => {
    if (st && st.room && !st.idle && !st.over && typeof NET !== 'undefined') {
      [...new Set(st.s.players.filter((k) => !st.bots.includes(k)).map((k) => st.owner[k]))].forEach((pid) => {
        if (pid === NET.pid) return;
        if (NET.remotes.get(pid)) { st.gone[pid] = 0; return; }
        st.gone[pid] = st.gone[pid] || Date.now();
        if (Date.now() - st.gone[pid] > 30000) dropPeer(pid, 'đã mất kết nối');
      });
      return;
    }
    if (!st || st.idle || st.mode !== 'net' || st.over || typeof NET === 'undefined') return;
    if (NET.remotes.get(st.opp)) { st.gone = 0; return; }
    st.gone = st.gone || Date.now();
    if (Date.now() - st.gone > 30000) finish({ winner: st.mine[0], why: `📴 ${esc(st.oppName)} đã rời đi` });
  }, 2000);

  /* ---------- bàn cờ đặt trong Nhà Casino ---------- */
  function tableArt(c, x, y, id) {
    const G = GAMES[id] || { name: 'Cờ Caro', icon: '♟️' };
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x, y + 4, 120, 20, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#5c3a1e'; c.fillRect(x - 92, y - 42, 12, 42); c.fillRect(x + 80, y - 42, 12, 42);
    c.fillStyle = '#8a5a32'; c.beginPath(); c.moveTo(x - 108, y - 42); c.lineTo(x + 108, y - 42); c.lineTo(x + 86, y - 104); c.lineTo(x - 86, y - 104); c.closePath(); c.fill();
    // mặt bàn cờ nhỏ (vẽ phối cảnh đơn giản)
    const bx0 = x - 78, by0 = y - 98, bw = 156, bh = 50;
    const P = (u, v) => [bx0 + (bw * u) + (1 - v) * 0 + (v - 1) * 0 + (u - 0.5) * 18 * v, by0 + bh * v];
    const quad = (u0, v0, u1, v1, col) => { const a = P(u0, v0), b = P(u1, v0), d = P(u1, v1), e = P(u0, v1); c.fillStyle = col; c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.lineTo(...d); c.lineTo(...e); c.closePath(); c.fill(); };
    if (id === 'chess') { for (let r = 0; r < 8; r++) for (let k = 0; k < 8; k++) quad(k / 8, r / 8, (k + 1) / 8, (r + 1) / 8, (r + k) % 2 ? '#b58863' : '#f0d9b5'); c.font = '16px "Segoe UI Symbol",serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#111'; c.fillText('♚ ♛', x - 30, y - 92); c.fillStyle = '#fff'; c.strokeStyle = '#111'; c.lineWidth = 1; c.strokeText('♔ ♕', x + 30, y - 58); c.fillText('♔ ♕', x + 30, y - 58); }
    else if (id === 'xiangqi') { quad(0, 0, 1, 1, '#f2cf8d'); c.strokeStyle = '#7a4a1e'; c.lineWidth = 1; for (let k = 0; k <= 8; k++) { const a = P(k / 8, 0), b = P(k / 8, 1); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); } for (let r = 0; r <= 9; r++) { const a = P(0, r / 9), b = P(1, r / 9); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); } [[0.3, 0.2, '#c92a2a'], [0.6, 0.3, '#212529'], [0.45, 0.75, '#c92a2a'], [0.7, 0.8, '#212529']].forEach(([u, v, col]) => { const [px, py] = P(u, v); c.fillStyle = '#fff4e0'; c.beginPath(); c.ellipse(px, py, 7, 4, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = col; c.lineWidth = 1.5; c.stroke(); }); }
    else if (id === 'go') { quad(0, 0, 1, 1, '#e3b56a'); c.strokeStyle = '#5c3a1e'; c.lineWidth = 1; for (let k = 0; k <= 8; k++) { let a = P(k / 8, 0), b = P(k / 8, 1); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); a = P(0, k / 8); b = P(1, k / 8); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); } [[0.25, 0.25, '#111'], [0.5, 0.375, '#fff'], [0.625, 0.625, '#111'], [0.375, 0.75, '#fff'], [0.75, 0.25, '#111']].forEach(([u, v, col]) => { const [px, py] = P(u, v); c.fillStyle = col; c.beginPath(); c.ellipse(px, py, 6, 3.5, 0, 0, Math.PI * 2); c.fill(); }); }
    else if (id === 'battle') { quad(0, 0, 0.48, 1, '#4dabf7'); quad(0.52, 0, 1, 1, '#4dabf7'); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1; for (let k = 0; k <= 6; k++) for (const u0 of [0, 0.52]) { let a = P(u0 + 0.48 * k / 6, 0), b = P(u0 + 0.48 * k / 6, 1); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); a = P(u0, k / 6); b = P(u0 + 0.48, k / 6); c.beginPath(); c.moveTo(...a); c.lineTo(...b); c.stroke(); } quad(0.08, 0.2, 0.34, 0.33, '#495057'); quad(0.6, 0.55, 0.68, 0.9, '#495057'); [[0.75, 0.3], [0.2, 0.7], [0.85, 0.75]].forEach(([u, v]) => { const [px, py] = P(u, v); c.fillStyle = '#e03131'; c.beginPath(); c.ellipse(px, py, 4, 2.5, 0, 0, Math.PI * 2); c.fill(); }); }
    else if (id === 'typhu') { quad(0, 0, 1, 1, '#d3f9d8'); const cols = ['#8d5524', '#74c0fc', '#e64980', '#fd7e14', '#e03131', '#fcc419', '#2b8a3e', '#1c3faa']; for (let k = 0; k < 8; k++) { const u = k / 8; quad(u, 0, u + 0.125, 0.14, cols[k]); quad(u, 0.86, u + 0.125, 1, cols[7 - k]); } quad(0.15, 0.25, 0.85, 0.75, '#ebfbee'); const [px, py] = P(0.5, 0.5); c.font = '900 10px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#c92a2a'; c.fillText('TỶ PHÚ', px, py); }
    else if (id === 'ludo') { quad(0, 0, 1, 1, '#fff'); [[0, 0, '#e03131'], [0.6, 0, '#2f9e44'], [0.6, 0.6, '#f59f00'], [0, 0.6, '#1c7ed6']].forEach(([u, v, col]) => quad(u, v, u + 0.4, v + 0.4, col)); const [px, py] = P(0.5, 0.5); c.font = '16px system-ui,"Segoe UI Emoji"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🎲', px, py); }
    c.fillStyle = '#1b2f48'; c.beginPath(); c.roundRect(x - 70, y - 140, 140, 28, 9); c.fill(); c.fillStyle = '#ffd43b'; c.font = '900 14px "Be Vietnam Pro", system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`${G.icon} ${G.name.toUpperCase()}`, x, y - 126);
    // ghế 2 bên
    c.fillStyle = '#c92a2a'; c.beginPath(); c.roundRect(x - 150, y - 60, 34, 46, 8); c.fill(); c.beginPath(); c.roundRect(x + 116, y - 60, 34, 46, 8); c.fill();
  }
  function addTo(m, H, id, x, y) {
    H.sobj(m, x, y, (c) => tableArt(c, x, y, id), { l: -155, t: -150, w: 310, h: 158 });
    H.col(m, x - 108, y - 52, 216, 52);
    H.inter(m, { x: x - 120, y: y - 145, w: 240, h: 150, ax: x, ay: y + 40, name: `${GAMES[id].icon} Bàn ${GAMES[id].name} (đấu máy / 2 người / online)`, use: () => open(id), arrow: { x, y: y - 160, text: GAMES[id].name } });
  }
  if (!document.getElementById('bg-css')) {
    const st2 = document.createElement('style'); st2.id = 'bg-css';
    st2.textContent = '.bg-wrap .ca-side{max-height:100%;overflow:auto}@media (max-width:700px){.bg-wrap{flex-direction:column;padding:4px;gap:6px}.bg-wrap .ca-board{order:1;flex:none;min-height:0}.bg-wrap .ca-side{order:2;width:auto;max-height:none;flex:1;overflow:auto}}';
    document.head.appendChild(st2);
  }
  return { open, addTo, challenge, onNet, GAMES, _st: () => st, _click: click, _roll: roll, _lobby: () => lobby };
})();
