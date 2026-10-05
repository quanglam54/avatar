/* Đố vui tiếng Anh ở Trường học: câu hỏi được chọn theo đồng hồ chung nên mọi người online cùng thấy một câu */
const QUIZ = (() => {
  // [tiếng Anh, tiếng Việt, emoji, nhóm]
  const VOCAB = [
    ['cat', 'con mèo', '🐱', 'animal'], ['dog', 'con chó', '🐶', 'animal'], ['chicken', 'con gà', '🐔', 'animal'], ['duck', 'con vịt', '🦆', 'animal'],
    ['cow', 'con bò', '🐄', 'animal'], ['pig', 'con lợn', '🐷', 'animal'], ['horse', 'con ngựa', '🐴', 'animal'], ['sheep', 'con cừu', '🐑', 'animal'],
    ['fish', 'con cá', '🐟', 'animal'], ['bird', 'con chim', '🐦', 'animal'], ['rabbit', 'con thỏ', '🐰', 'animal'], ['monkey', 'con khỉ', '🐵', 'animal'],
    ['tiger', 'con hổ', '🐯', 'animal'], ['lion', 'con sư tử', '🦁', 'animal'], ['elephant', 'con voi', '🐘', 'animal'], ['bear', 'con gấu', '🐻', 'animal'],
    ['snake', 'con rắn', '🐍', 'animal'], ['frog', 'con ếch', '🐸', 'animal'], ['butterfly', 'con bướm', '🦋', 'animal'], ['bee', 'con ong', '🐝', 'animal'],
    ['mouse', 'con chuột', '🐭', 'animal'], ['turtle', 'con rùa', '🐢', 'animal'], ['crab', 'con cua', '🦀', 'animal'], ['shrimp', 'con tôm', '🦐', 'animal'],
    ['apple', 'quả táo', '🍎', 'fruit'], ['banana', 'quả chuối', '🍌', 'fruit'], ['orange', 'quả cam', '🍊', 'fruit'], ['grape', 'quả nho', '🍇', 'fruit'],
    ['watermelon', 'quả dưa hấu', '🍉', 'fruit'], ['strawberry', 'quả dâu tây', '🍓', 'fruit'], ['mango', 'quả xoài', '🥭', 'fruit'], ['pineapple', 'quả dứa', '🍍', 'fruit'],
    ['lemon', 'quả chanh', '🍋', 'fruit'], ['coconut', 'quả dừa', '🥥', 'fruit'], ['peach', 'quả đào', '🍑', 'fruit'], ['cherry', 'quả anh đào', '🍒', 'fruit'],
    ['carrot', 'cà rốt', '🥕', 'food'], ['corn', 'ngô', '🌽', 'food'], ['rice', 'cơm', '🍚', 'food'], ['bread', 'bánh mì', '🍞', 'food'],
    ['egg', 'quả trứng', '🥚', 'food'], ['milk', 'sữa', '🥛', 'food'], ['cake', 'bánh ngọt', '🍰', 'food'], ['water', 'nước', '💧', 'food'],
    ['tomato', 'cà chua', '🍅', 'food'], ['potato', 'khoai tây', '🥔', 'food'], ['cheese', 'phô mai', '🧀', 'food'], ['candy', 'kẹo', '🍬', 'food'],
    ['red', 'màu đỏ', '🔴', 'color'], ['blue', 'màu xanh dương', '🔵', 'color'], ['green', 'màu xanh lá', '🟢', 'color'], ['yellow', 'màu vàng', '🟡', 'color'],
    ['black', 'màu đen', '⚫', 'color'], ['white', 'màu trắng', '⚪', 'color'], ['pink', 'màu hồng', '🌸', 'color'], ['purple', 'màu tím', '🟣', 'color'],
    ['brown', 'màu nâu', '🟤', 'color'], ['orange', 'màu cam', '🟠', 'color'],
    ['one', 'số một', '1️⃣', 'number'], ['two', 'số hai', '2️⃣', 'number'], ['three', 'số ba', '3️⃣', 'number'], ['four', 'số bốn', '4️⃣', 'number'],
    ['five', 'số năm', '5️⃣', 'number'], ['six', 'số sáu', '6️⃣', 'number'], ['seven', 'số bảy', '7️⃣', 'number'], ['eight', 'số tám', '8️⃣', 'number'],
    ['nine', 'số chín', '9️⃣', 'number'], ['ten', 'số mười', '🔟', 'number'],
    ['book', 'quyển sách', '📕', 'school'], ['pen', 'cái bút', '🖊️', 'school'], ['pencil', 'bút chì', '✏️', 'school'], ['bag', 'cái cặp', '🎒', 'school'],
    ['ruler', 'thước kẻ', '📏', 'school'], ['desk', 'cái bàn', '🪑', 'school'], ['teacher', 'giáo viên', '👩‍🏫', 'school'], ['student', 'học sinh', '🧑‍🎓', 'school'],
    ['school', 'trường học', '🏫', 'school'], ['clock', 'đồng hồ', '🕒', 'school'], ['computer', 'máy tính', '💻', 'school'], ['scissors', 'cái kéo', '✂️', 'school'],
    ['mother', 'mẹ', '👩', 'family'], ['father', 'bố', '👨', 'family'], ['sister', 'chị gái', '👧', 'family'], ['brother', 'anh trai', '👦', 'family'],
    ['baby', 'em bé', '👶', 'family'], ['grandmother', 'bà', '👵', 'family'], ['grandfather', 'ông', '👴', 'family'], ['friend', 'bạn bè', '🧑‍🤝‍🧑', 'family'],
    ['doctor', 'bác sĩ', '🧑‍⚕️', 'job'], ['farmer', 'nông dân', '🧑‍🌾', 'job'], ['cook', 'đầu bếp', '🧑‍🍳', 'job'], ['police', 'cảnh sát', '👮', 'job'],
    ['singer', 'ca sĩ', '🎤', 'job'], ['driver', 'tài xế', '🚗', 'job'], ['pilot', 'phi công', '✈️', 'job'], ['nurse', 'y tá', '💉', 'job'],
    ['sun', 'mặt trời', '☀️', 'nature'], ['moon', 'mặt trăng', '🌙', 'nature'], ['star', 'ngôi sao', '⭐', 'nature'], ['rain', 'mưa', '🌧️', 'nature'],
    ['cloud', 'đám mây', '☁️', 'nature'], ['tree', 'cái cây', '🌳', 'nature'], ['flower', 'bông hoa', '🌼', 'nature'], ['sea', 'biển', '🌊', 'nature'],
    ['mountain', 'núi', '⛰️', 'nature'], ['river', 'dòng sông', '🏞️', 'nature'], ['snow', 'tuyết', '❄️', 'nature'], ['wind', 'gió', '🍃', 'nature'],
    ['house', 'ngôi nhà', '🏠', 'thing'], ['car', 'ô tô', '🚗', 'thing'], ['bus', 'xe buýt', '🚌', 'thing'], ['bike', 'xe đạp', '🚲', 'thing'],
    ['phone', 'điện thoại', '📱', 'thing'], ['ball', 'quả bóng', '⚽', 'thing'], ['hat', 'cái mũ', '👒', 'thing'], ['shoe', 'chiếc giày', '👟', 'thing'],
    ['door', 'cái cửa', '🚪', 'thing'], ['window', 'cửa sổ', '🪟', 'thing'], ['bed', 'cái giường', '🛏️', 'thing'], ['key', 'chìa khoá', '🔑', 'thing'],
    ['eye', 'con mắt', '👁️', 'body'], ['ear', 'cái tai', '👂', 'body'], ['nose', 'cái mũi', '👃', 'body'], ['mouth', 'cái miệng', '👄', 'body'],
    ['hand', 'bàn tay', '✋', 'body'], ['foot', 'bàn chân', '🦶', 'body'], ['hair', 'tóc', '💇', 'body'], ['tooth', 'cái răng', '🦷', 'body'],
    ['hello', 'xin chào', '👋', 'phrase'], ['goodbye', 'tạm biệt', '👋', 'phrase'], ['thank you', 'cảm ơn', '🙏', 'phrase'], ['sorry', 'xin lỗi', '🙇', 'phrase'],
    ['happy', 'vui vẻ', '😄', 'phrase'], ['sad', 'buồn', '😢', 'phrase'], ['big', 'to lớn', '🐘', 'phrase'], ['small', 'nhỏ bé', '🐜', 'phrase'],
    ['hot', 'nóng', '🔥', 'phrase'], ['cold', 'lạnh', '🥶', 'phrase'], ['good morning', 'chào buổi sáng', '🌅', 'phrase'], ['good night', 'chúc ngủ ngon', '🌙', 'phrase'],
  ];

  const ROUND_MS = 14000;
  const OPEN_MS = 10000;
  const PREFIX = /^(con|qua|trai|mau|so|cai|chiec|ban|bong|ngoi|cay|quyen|but|dam|dong|a|an|the)\s+/;

  function norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
      .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const core = (s) => { let n = norm(s), prev; do { prev = n; n = n.replace(PREFIX, ''); } while (n !== prev); return n; };
  const PREFIX_VI = /^(con|quả|trái|màu|số|cái|chiếc|bàn|bông|ngôi|cây|quyển|bút|đám|dòng)\s+/;

  /** Rút gọn câu trả lời tiếng Việt nhưng giữ nguyên dấu (để phân biệt dứa / dừa) */
  function coreVi(s) {
    let n = String(s).toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
    let prev;
    do { prev = n; n = n.replace(PREFIX_VI, ''); } while (n !== prev);
    return n;
  }

  const hasMarks = (s) => /[^a-z0-9\s.,!?'"-]/i.test(String(s).normalize('NFC'));

  /** Gõ có dấu thì so có dấu, gõ không dấu thì so không dấu */
  function matchVi(input, answer) {
    return hasMarks(input) ? coreVi(input) === coreVi(answer) : core(input) === core(answer);
  }

  /** Tạo câu hỏi cho vòng thứ round (giống nhau trên mọi máy) */
  function questionAt(round) {
    const r = ART.srand(round * 7919 + 13);
    const item = VOCAB[Math.floor(r() * VOCAB.length)];
    const toEnglish = r() < 0.6;
    const pool = VOCAB.filter((v) => v[3] === item[3] && v[0] !== item[0] && v[1] !== item[1]);
    const picks = [];
    while (picks.length < 3 && pool.length) picks.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
    const opts = [item, ...picks];
    for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    return toEnglish
      ? { round, q: `${item[2]} "${item[1]}" tiếng Anh là gì?`, answer: item[0], choices: opts.map((o) => o[0]), check: (s) => core(s) === core(item[0]) }
      : { round, q: `${item[2]} "${item[0]}" nghĩa là gì?`, answer: item[1], choices: opts.map((o) => o[1]), check: (s) => matchVi(s, item[1]) };
  }

  /** Vòng hiện tại: câu hỏi, đang mở hay đang công bố đáp án, còn bao nhiêu giây */
  function current() {
    const t = Date.now();
    const round = Math.floor(t / ROUND_MS);
    const inRound = t - round * ROUND_MS;
    const q = questionAt(round);
    return { ...q, open: inRound < OPEN_MS, left: Math.ceil(((inRound < OPEN_MS ? OPEN_MS : ROUND_MS) - inRound) / 1000) };
  }

  return { current, questionAt, norm, VOCAB, ROUND_MS };
})();
