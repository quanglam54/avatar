/* Luật Tiến lên miền Nam: lá bài, nhận diện bộ, so bài, chặt heo, tới trắng, máy đánh */
const TL = (() => {
  const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
  const SUITS = ['♠', '♣', '♦', '♥'];
  const HEO = 12;
  // lá bài = rank * 4 + chất  (3♠ = 0 … 2♥ = 51), số càng lớn bài càng to
  const rank = (c) => c >> 2;
  const suit = (c) => c & 3;
  const label = (c) => RANKS[rank(c)] + SUITS[suit(c)];
  const isRed = (c) => suit(c) >= 2;
  const sortCards = (a) => [...a].sort((x, y) => x - y);

  function shuffle(a, rnd = Math.random) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /** Chia 13 lá cho 4 người */
  function deal() {
    const d = shuffle([...Array(52).keys()]);
    return [0, 1, 2, 3].map((i) => sortCards(d.slice(i * 13, i * 13 + 13)));
  }

  /** Nhận diện bộ bài: lẻ, đôi, sám, tứ quý, sảnh, đôi thông. Không hợp lệ → null */
  function classify(cards) {
    const c = sortCards(cards), n = c.length;
    if (!n) return null;
    const r = c.map(rank);
    const same = r.every((x) => x === r[0]);
    if (n === 1) return { type: 'single', len: 1, top: c[0] };
    if (same && n === 2) return { type: 'pair', len: 2, top: c[1] };
    if (same && n === 3) return { type: 'triple', len: 3, top: c[2] };
    if (same && n === 4) return { type: 'quad', len: 4, top: c[3] };
    if (n >= 3 && r[n - 1] !== HEO && r.every((x, i) => i === 0 || x === r[i - 1] + 1)) return { type: 'straight', len: n, top: c[n - 1] };
    if (n >= 6 && n % 2 === 0 && r[n - 1] !== HEO) {
      let ok = true;
      for (let i = 0; i < n; i += 2) {
        if (r[i] !== r[i + 1]) ok = false;
        if (i > 0 && r[i] !== r[i - 2] + 1) ok = false;
      }
      if (ok) return { type: 'pairseq', len: n, top: c[n - 1] };
    }
    return null;
  }

  const NAMES = { single: 'Lẻ', pair: 'Đôi', triple: 'Sám', quad: 'Tứ quý', straight: 'Sảnh', pairseq: 'Đôi thông' };
  const describe = (k) => (k ? (k.type === 'pairseq' ? `${k.len / 2} đôi thông` : NAMES[k.type]) : '');

  /** cur có chặt / đè được prev không (kể cả chặt heo) */
  function canBeat(prev, cur) {
    if (!cur) return false;
    if (!prev) return true;
    if (cur.type === prev.type && cur.len === prev.len) return cur.top > prev.top;
    const heo = rank(prev.top) === HEO;
    if (prev.type === 'single' && heo) return cur.type === 'quad' || (cur.type === 'pairseq' && cur.len >= 6);
    if (prev.type === 'pair' && heo) return cur.type === 'quad' || (cur.type === 'pairseq' && cur.len >= 8);
    if (prev.type === 'pairseq' && prev.len === 6) return cur.type === 'quad' || (cur.type === 'pairseq' && cur.len >= 8);
    if (prev.type === 'quad') return cur.type === 'pairseq' && cur.len >= 8;
    return false;
  }

  /** Tới trắng ngay khi chia bài */
  function instantWin(hand) {
    const r = hand.map(rank);
    const count = (k) => r.filter((x) => x === k).length;
    if (count(HEO) === 4) return 'Tứ quý heo';
    if (new Set(r.filter((x) => x < HEO)).size === 12) return 'Sảnh rồng';
    let pairs = 0;
    for (let k = 0; k < 13; k++) pairs += Math.floor(count(k) / 2);
    if (pairs >= 6) return '6 đôi';
    return null;
  }

  function choose(arr, k, start = 0, cur = [], out = []) {
    if (cur.length === k) { out.push([...cur]); return out; }
    for (let i = start; i < arr.length; i++) { cur.push(arr[i]); choose(arr, k, i + 1, cur, out); cur.pop(); }
    return out;
  }

  /** Liệt kê các bộ có thể đánh từ bài trên tay */
  function combos(hand) {
    const by = Array.from({ length: 13 }, () => []);
    sortCards(hand).forEach((c) => by[rank(c)].push(c));
    const out = [];
    hand.forEach((c) => out.push([c]));
    by.forEach((g) => {
      if (g.length >= 2) choose(g, 2).forEach((x) => out.push(x));
      if (g.length >= 3) choose(g, 3).forEach((x) => out.push(x));
      if (g.length === 4) out.push([...g]);
    });
    for (let s = 0; s < HEO; s++) {
      for (let e = s + 2; e < HEO && by[e].length; e++) {
        if (!by.slice(s, e + 1).every((g) => g.length)) break;
        const base = by.slice(s, e).map((g) => g[0]);
        by[e].forEach((last) => out.push([...base, last]));
      }
    }
    for (let s = 0; s < HEO; s++) {
      for (let e = s + 2; e < HEO; e++) {
        if (!by.slice(s, e + 1).every((g) => g.length >= 2)) break;
        const base = by.slice(s, e).flatMap((g) => g.slice(0, 2));
        choose(by[e], 2).forEach((p) => out.push([...base, ...p]));
      }
    }
    return out;
  }

  /** Máy chọn nước đi. prev = bộ đang trên bàn (null nếu được đánh tự do). Trả về mảng lá hoặc null (bỏ lượt) */
  function botMove(hand, prev, minOpp = 13) {
    const all = combos(hand).map((cs) => ({ cs, k: classify(cs) })).filter((x) => x.k);
    if (!prev) {
      const low = sortCards(hand)[0];
      const opts = all.filter((x) => x.cs.includes(low) && x.k.type !== 'quad');
      opts.sort((a, b) => b.cs.length - a.cs.length || a.k.top - b.k.top);
      return opts.length ? opts[0].cs : [low];
    }
    const opts = all.filter((x) => canBeat(prev, x.k));
    if (!opts.length) return null;
    const isBomb = (x) => x.k.type === 'quad' || x.k.type === 'pairseq';
    const cheap = opts.filter((x) => !x.cs.some((c) => rank(c) === HEO) && (!isBomb(x) || x.k.type === prev.type));
    const urgent = minOpp <= 3 || rank(prev.top) >= 11;
    const pool = cheap.length ? cheap : urgent ? opts : [];
    if (!pool.length) return null;
    pool.sort((a, b) => a.k.top - b.k.top);
    return pool[0].cs;
  }

  return { RANKS, SUITS, HEO, rank, suit, label, isRed, sortCards, deal, classify, canBeat, describe, instantWin, combos, botMove, shuffle };
})();
if (typeof module !== 'undefined') module.exports = TL;
