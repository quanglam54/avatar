/* Dữ liệu tĩnh của game */
var AV = {};

const DATA = {
  SKINS: ['#ffe0c4', '#f8c9a2', '#e3a979', '#b97a51', '#8a5a3c'],
  HAIR_COLORS: ['#2b2b33', '#6b3e26', '#c68642', '#f4d06f', '#e86a92', '#5c9dff', '#9b6bff', '#e9ecef'],
  SHIRT_COLORS: ['#fa5252', '#fd7e14', '#fcc419', '#40c057', '#15aabf', '#4c6ef5', '#7950f2', '#e64980', '#f8f9fa', '#343a40'],
  PANTS_COLORS: ['#364fc7', '#343a40', '#8b5a2b', '#2b8a3e', '#a61e4d', '#dee2e6'],
  HAIR_STYLES: [
    { id: 'bald', name: 'Trọc' },
    { id: 'short', name: 'Ngắn' },
    { id: 'spiky', name: 'Dựng' },
    { id: 'long', name: 'Dài' },
    { id: 'bun', name: 'Búi' },
    { id: 'pigtails', name: 'Hai bím' },
  ],
  SHIRT_STYLES: [
    { id: 'plain', name: 'Áo trơn', price: 0 },
    { id: 'stripes', name: 'Áo kẻ sọc', price: 30 },
    { id: 'star', name: 'Áo ngôi sao', price: 60 },
    { id: 'heart', name: 'Áo trái tim', price: 60 },
    { id: 'overall', name: 'Quần yếm', price: 80 },
    { id: 'dress', name: 'Váy liền', price: 90 },
    { id: 'dress_flower', name: 'Váy hoa', price: 140 },
    { id: 'princess', name: 'Váy công chúa', price: 320, lvl: 4 },
  ],
  HATS: [
    { id: 'none', name: 'Không đội', price: 0 },
    { id: 'flower', name: 'Hoa cài tóc', price: 35 },
    { id: 'cap', name: 'Mũ lưỡi trai', price: 40 },
    { id: 'beanie', name: 'Mũ len', price: 40 },
    { id: 'bow', name: 'Nơ xinh', price: 45 },
    { id: 'nonla', name: 'Nón lá', price: 50 },
    { id: 'beret', name: 'Mũ nồi', price: 60 },
    { id: 'party', name: 'Mũ sinh nhật', price: 55 },
    { id: 'bunny', name: 'Băng đô tai thỏ', price: 80 },
    { id: 'cowboy', name: 'Mũ cao bồi', price: 110 },
    { id: 'tiara', name: 'Vương miện nhỏ', price: 180, lvl: 3 },
    { id: 'crown', name: 'Vương miện', price: 300, lvl: 5 },
  ],
  ACCS: [
    { id: 'none', name: 'Không đeo', price: 0 },
    { id: 'earrings', name: 'Bông tai', price: 50 },
    { id: 'necklace', name: 'Dây chuyền vàng', price: 120 },
    { id: 'pearl', name: 'Vòng ngọc trai', price: 200, lvl: 3 },
    { id: 'glasses', name: 'Kính tròn', price: 70 },
    { id: 'sunglasses', name: 'Kính râm', price: 90 },
  ],
  ARCADE: [
    { id: 'pikachu', name: 'Pikachu', icon: '⚡', color: '#fcc419', div: 30 },
    { id: 'flappy', name: 'Flappy Bird', icon: '🐤', color: '#38bdf8', div: 0.5 },
    { id: 'goldminer', name: 'Đào Vàng', icon: '⛏️', color: '#f59f00', div: 60 },
  ],
  CROPS: {
    wheat: { name: 'Lúa mì', icon: '🌾', seed: 2, sell: 5, time: 300, xp: 4, lvl: 1, yield: 4 },
    carrot: { name: 'Cà rốt', icon: '🥕', seed: 4, sell: 9, time: 600, xp: 6, lvl: 1, yield: 3 },
    rose: { name: 'Hoa hồng', icon: '🌹', seed: 7, sell: 15, time: 1200, xp: 8, lvl: 2, yield: 3, kind: 'both' },
    strawberry: { name: 'Dâu tây', icon: '🍓', seed: 9, sell: 19, time: 1800, xp: 10, lvl: 2, yield: 3 },
    corn: { name: 'Ngô', icon: '🌽', seed: 13, sell: 28, time: 3600, xp: 14, lvl: 3, yield: 3 },
    pumpkin: { name: 'Bí ngô', icon: '🎃', seed: 22, sell: 60, time: 7200, xp: 20, lvl: 4, yield: 2 },
    daisy: { name: 'Hoa cúc', icon: '🌼', seed: 5, sell: 12, time: 900, xp: 6, lvl: 1, yield: 3, kind: 'flower', petal: '#ffe066', heart: '#e8590c' },
    tulip: { name: 'Hoa tulip', icon: '🌷', seed: 8, sell: 18, time: 1500, xp: 8, lvl: 1, yield: 3, kind: 'flower', petal: '#ff6b9a', heart: '#c2255c' },
    sunflower: { name: 'Hướng dương', icon: '🌻', seed: 12, sell: 26, time: 2700, xp: 12, lvl: 2, yield: 3, kind: 'flower', petal: '#fcc419', heart: '#7a4520' },
    hibiscus: { name: 'Hoa dâm bụt', icon: '🌺', seed: 20, sell: 45, time: 5400, xp: 18, lvl: 3, yield: 3, kind: 'flower', petal: '#ff4d6d', heart: '#ffd43b' },
  },
  PRODUCTS: {
    egg: { name: 'Trứng gà', icon: '🥚', sell: 6 },
    milk: { name: 'Sữa bò', icon: '🥛', sell: 18 },
    wool: { name: 'Len cừu', icon: '🧶', sell: 22 },
    pork: { name: 'Thịt heo', icon: '🥩', sell: 32 },
  },
  COOP: { time: 900, feed: 3, eggs: 10, xp: 16 },
  PEN: { time: 1800, feed: 4, milk: 8, wool: 4, pork: 3, xp: 24 },
  PLOT_PRICES: [0, 0, 0, 0, 0, 0, 40, 80, 120, 200],
  BED_PRICES: [0, 150, 400, 900, 1500, 2200, 3000, 4000, 0, 300, 800, 1500],
  FIELD_BEDS: 8,
  FLOWER_BEDS: 4,
  TILES_PER_BED: 12,
  THIRSTY_AT: 0.4,
  WATER_CUT: 0.1,
  FERT: { id: 'fertilizer', name: 'Phân bón', icon: '🧪', price: 5, cut: 0.3 },
  xpNeed: (lvl) => 20 + lvl * 25,
  EMOTES: ['😀', '😂', '😍', '😎', '👋', '❤️', '😴', '😡'],
  NPC_LINES: [
    'Hôm nay trời đẹp quá!', 'Chợ ở Khu mua sắm đó, đi xe buýt là tới!', 'Nón lá ở tiệm Thời Trang xinh lắm đó.', 'Ra Bãi biển nhặt vỏ sò đi, có cả ngọc trai đấy!', 'Khu giải trí có bầu cua vui lắm 🎲', 'Công viên câu được cá vàng hiếm đó 🐡',
    'Bí ngô bán được giá nhất đấy!', 'Mình đang đợi xe buýt nè.', 'Ai muốn làm bạn với mình không?',
    'Gà nhà mình đẻ trứng to lắm!', 'Đi dạo quanh đài phun nước thật thư giãn.', 'Lên cấp 5 là mua được vương miện!',
  ],
};

DATA.PETS = [
  { id: 'none', name: 'Không dẫn', price: 0 },
  { id: 'chick', name: 'Gà con', price: 60 },
  { id: 'dog', name: 'Cún vàng', price: 120 },
  { id: 'cat', name: 'Mèo mướp', price: 120 },
  { id: 'bunny', name: 'Thỏ trắng', price: 150 },
  { id: 'pug', name: 'Chó Pug', price: 180 },
];

DATA.ZONES = [
  { id: 'farm', name: 'Nông trại', icon: '🌾', x: 80, y: 80, desc: 'Trồng trọt, chăn nuôi' },
  { id: 'town', name: 'Quảng trường', icon: '⛲', x: 50, y: 52, desc: 'Gặp gỡ, trò chuyện' },
  { id: 'mall', name: 'Khu mua sắm', icon: '🛍️', x: 74, y: 28, desc: 'Chợ, thời trang, thú cưng' },
  { id: 'fun', name: 'Khu giải trí', icon: '🎡', x: 25, y: 26, desc: 'Bầu cua, bài cào, sân khấu' },
  { id: 'park', name: 'Công viên', icon: '🌳', x: 20, y: 72, desc: 'Câu cá, dạo hồ' },
  { id: 'beach', name: 'Bãi biển', icon: '🏖️', x: 90, y: 12, desc: 'Nhặt vỏ sò, tắm nắng' },
  { id: 'school', name: 'Trường học', icon: '🏫', x: 48, y: 86, desc: 'Đố vui tiếng Anh' },
  { id: 'race', name: 'Khu Đua Xe', icon: '🏎️', x: 8, y: 48, desc: 'Đua xe với mọi người' },
];

DATA.FISH = [
  { id: 'fish_ro', name: 'Cá rô', icon: '🐟', sell: 8, w: 50 },
  { id: 'fish_chep', name: 'Cá chép', icon: '🐠', sell: 15, w: 28 },
  { id: 'fish_vang', name: 'Cá vàng hiếm', icon: '🐡', sell: 45, w: 8 },
  { id: 'boot', name: 'Giày cũ', icon: '👢', sell: 1, w: 14 },
];

DATA.SHELLS = [
  { id: 'shell', name: 'Vỏ sò', icon: '🐚', sell: 4, w: 70 },
  { id: 'starfish', name: 'Sao biển', icon: '⭐', sell: 10, w: 25 },
  { id: 'pearl', name: 'Ngọc trai', icon: '🔮', sell: 60, w: 5 },
];

DATA.BAUCUA = [
  { id: 'nai', name: 'Nai', icon: '🦌' },
  { id: 'bau', name: 'Bầu', icon: '🍐' },
  { id: 'ga', name: 'Gà', icon: '🐓' },
  { id: 'ca', name: 'Cá', icon: '🐟' },
  { id: 'cua', name: 'Cua', icon: '🦀' },
  { id: 'tom', name: 'Tôm', icon: '🦐' },
];

/** Nhiệm vụ hằng ngày: luôn có nhiệm vụ tiếng Anh + 3 nhiệm vụ ngẫu nhiên theo ngày */
DATA.QUESTS = [
  { id: 'quiz', icon: '🏫', text: 'Trả lời đúng {n} câu tiếng Anh ở Trường học', n: 5, coins: 60, xp: 40 },
  { id: 'fish', icon: '🎣', text: 'Câu được {n} con cá ở Công viên', n: 3, coins: 40, xp: 24 },
  { id: 'harvest', icon: '🌾', text: 'Thu hoạch {n} nông sản', n: 20, coins: 40, xp: 24 },
  { id: 'cook', icon: '🍳', text: 'Nấu {n} món ở Nhà bếp', n: 2, coins: 50, xp: 30 },
  { id: 'shell', icon: '🐚', text: 'Nhặt {n} vỏ sò / sao biển ở Bãi biển', n: 5, coins: 35, xp: 20 },
  { id: 'collect', icon: '🥚', text: 'Thu trứng / sữa ở chuồng {n} lần', n: 2, coins: 35, xp: 20 },
  { id: 'chat', icon: '💬', text: 'Trò chuyện {n} câu với mọi người', n: 5, coins: 25, xp: 16 },
  { id: 'race', icon: '🏎️', text: 'Tham gia {n} cuộc đua ở Khu Đua Xe', n: 2, coins: 40, xp: 24 },
  { id: 'arcade', icon: '🕹️', text: 'Chơi {n} ván ở máy game Khu giải trí', n: 2, coins: 30, xp: 20 },
  { id: 'help', icon: '💧', text: 'Thăm và tưới giúp nông trại {n} người bạn', n: 1, coins: 35, xp: 24 },
  { id: 'dance', icon: '💃', text: 'Nhảy trên sân khấu Khu giải trí {n} lần', n: 1, coins: 25, xp: 16 },
];

/** Cây ăn quả trong vườn: tự ra quả, không cần trồng, quả chín để lâu không hỏng */
DATA.FRUITS = {
  orange: { name: 'Cam', icon: '🍊', color: '#fd7e14', sell: 12, time: 2400, yield: 6, xp: 8 },
  apple: { name: 'Táo', icon: '🍎', color: '#e03131', sell: 14, time: 2700, yield: 6, xp: 8 },
  mango: { name: 'Xoài', icon: '🥭', color: '#fcc419', sell: 16, time: 3000, yield: 5, xp: 10 },
  peach: { name: 'Đào', icon: '🍑', color: '#ff8fab', sell: 20, time: 3600, yield: 5, xp: 12 },
};
DATA.ORCHARD = ['orange', 'apple', 'mango', 'peach', 'orange', 'mango', 'peach', 'orange', 'apple', 'mango', 'apple', 'peach', 'orange', 'apple', 'mango'];

DATA.RECIPES = [
  { id: 'cake_egg', name: 'Bánh trứng', icon: '🥮', need: { egg: 2, wheat: 1 }, sell: 30, xp: 8 },
  { id: 'carrot_cake', name: 'Bánh cà rốt', icon: '🍰', need: { carrot: 3, egg: 1, wheat: 1 }, sell: 55, xp: 10 },
  { id: 'milk_straw', name: 'Sữa dâu', icon: '🥤', need: { milk: 1, strawberry: 2 }, sell: 65, xp: 12 },
  { id: 'corn_soup', name: 'Súp ngô', icon: '🍲', need: { corn: 2, milk: 1 }, sell: 85, xp: 16 },
  { id: 'wool_scarf', name: 'Khăn len', icon: '🧣', need: { wool: 2 }, sell: 70, xp: 12 },
  { id: 'pumpkin_pie', name: 'Bánh bí ngô', icon: '🥧', need: { pumpkin: 1, egg: 2, milk: 1 }, sell: 170, xp: 24 },
  { id: 'orange_juice', name: 'Nước cam', icon: '🧃', need: { orange: 4 }, sell: 65, xp: 10 },
  { id: 'mango_smoothie', name: 'Sinh tố xoài', icon: '🥤', need: { mango: 2, milk: 1 }, sell: 75, xp: 12 },
  { id: 'braised_pork', name: 'Thịt kho trứng', icon: '🍖', need: { pork: 2, egg: 3 }, sell: 120, xp: 14 },
  { id: 'bouquet', name: 'Bó hoa', icon: '💐', need: { daisy: 3, tulip: 3, rose: 2 }, sell: 160, xp: 20 },
  { id: 'fruit_salad', name: 'Salad trái cây', icon: '🥗', need: { apple: 2, peach: 2, orange: 2 }, sell: 140, xp: 20 },
];

/** Danh sách mọi vật phẩm trong túi đồ: hạt giống, nông sản, sản phẩm chăn nuôi */
DATA.ITEMS = (() => {
  const items = {};
  for (const [id, c] of Object.entries(DATA.CROPS)) {
    items['seed_' + id] = { name: 'Hạt ' + c.name.toLowerCase(), icon: '🌱', sub: c.icon, sell: 0 };
    items[id] = { name: c.name, icon: c.icon, sell: c.sell };
  }
  for (const [id, p] of Object.entries(DATA.PRODUCTS)) items[id] = { name: p.name, icon: p.icon, sell: p.sell };
  for (const f of [...DATA.FISH, ...DATA.SHELLS, ...DATA.RECIPES]) items[f.id] = { name: f.name, icon: f.icon, sell: f.sell };
  for (const [id, f] of Object.entries(DATA.FRUITS)) items[id] = { name: f.name, icon: f.icon, sell: f.sell };
  items.fertilizer = { name: 'Phân bón', icon: '🧪', sell: 0 };
  return items;
})();
