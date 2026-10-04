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
  ],
  HATS: [
    { id: 'none', name: 'Không đội', price: 0 },
    { id: 'flower', name: 'Hoa cài tóc', price: 35 },
    { id: 'cap', name: 'Mũ lưỡi trai', price: 40 },
    { id: 'beanie', name: 'Mũ len', price: 40 },
    { id: 'bow', name: 'Nơ xinh', price: 45 },
    { id: 'nonla', name: 'Nón lá', price: 50 },
    { id: 'crown', name: 'Vương miện', price: 300, lvl: 5 },
  ],
  CROPS: {
    wheat: { name: 'Lúa mì', icon: '🌾', seed: 2, sell: 5, time: 30, xp: 1, lvl: 1, yield: 2 },
    carrot: { name: 'Cà rốt', icon: '🥕', seed: 4, sell: 9, time: 60, xp: 2, lvl: 1, yield: 1 },
    rose: { name: 'Hoa hồng', icon: '🌹', seed: 7, sell: 15, time: 90, xp: 3, lvl: 2, yield: 1 },
    strawberry: { name: 'Dâu tây', icon: '🍓', seed: 9, sell: 19, time: 120, xp: 3, lvl: 2, yield: 1 },
    corn: { name: 'Ngô', icon: '🌽', seed: 13, sell: 28, time: 180, xp: 4, lvl: 3, yield: 1 },
    pumpkin: { name: 'Bí ngô', icon: '🎃', seed: 22, sell: 60, time: 300, xp: 6, lvl: 4, yield: 1 },
  },
  PRODUCTS: {
    egg: { name: 'Trứng gà', icon: '🥚', sell: 6 },
    milk: { name: 'Sữa bò', icon: '🥛', sell: 18 },
    wool: { name: 'Len cừu', icon: '🧶', sell: 22 },
  },
  COOP: { time: 60, feed: 3, eggs: 5, xp: 5 },
  PEN: { time: 120, feed: 4, milk: 2, wool: 1, xp: 8 },
  PLOT_PRICES: [0, 0, 0, 0, 0, 0, 40, 80, 120, 200],
  BED_PRICES: [0, 150, 400, 900],
  TILES_PER_BED: 12,
  THIRSTY_AT: 0.4,
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

DATA.RECIPES = [
  { id: 'cake_egg', name: 'Bánh trứng', icon: '🥮', need: { egg: 2, wheat: 1 }, sell: 30, xp: 4 },
  { id: 'carrot_cake', name: 'Bánh cà rốt', icon: '🍰', need: { carrot: 3, egg: 1, wheat: 1 }, sell: 55, xp: 5 },
  { id: 'milk_straw', name: 'Sữa dâu', icon: '🥤', need: { milk: 1, strawberry: 2 }, sell: 65, xp: 6 },
  { id: 'corn_soup', name: 'Súp ngô', icon: '🍲', need: { corn: 2, milk: 1 }, sell: 85, xp: 8 },
  { id: 'wool_scarf', name: 'Khăn len', icon: '🧣', need: { wool: 2 }, sell: 70, xp: 6 },
  { id: 'pumpkin_pie', name: 'Bánh bí ngô', icon: '🥧', need: { pumpkin: 1, egg: 2, milk: 1 }, sell: 170, xp: 12 },
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
  return items;
})();
