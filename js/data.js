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
    wheat: { name: 'Lúa mì', icon: '🌾', seed: 2, sell: 5, time: 30, xp: 2, lvl: 1, yield: 3 },
    carrot: { name: 'Cà rốt', icon: '🥕', seed: 5, sell: 9, time: 60, xp: 4, lvl: 1, yield: 2 },
    strawberry: { name: 'Dâu tây', icon: '🍓', seed: 10, sell: 18, time: 120, xp: 7, lvl: 2, yield: 2 },
    corn: { name: 'Ngô', icon: '🌽', seed: 15, sell: 28, time: 180, xp: 10, lvl: 3, yield: 2 },
    pumpkin: { name: 'Bí ngô', icon: '🎃', seed: 25, sell: 80, time: 300, xp: 15, lvl: 4, yield: 1 },
  },
  PRODUCTS: {
    egg: { name: 'Trứng gà', icon: '🥚', sell: 6 },
    milk: { name: 'Sữa bò', icon: '🥛', sell: 18 },
    wool: { name: 'Len cừu', icon: '🧶', sell: 22 },
  },
  COOP: { time: 60, feed: 3, eggs: 5, xp: 5 },
  PEN: { time: 120, feed: 4, milk: 2, wool: 1, xp: 8 },
  PLOT_PRICES: [0, 0, 0, 0, 0, 0, 40, 80, 120, 200],
  xpNeed: (lvl) => 20 + lvl * 25,
  EMOTES: ['😀', '😂', '😍', '😎', '👋', '❤️', '😴', '😡'],
  NPC_LINES: [
    'Hôm nay trời đẹp quá!', 'Bạn đã ghé Chợ chưa?', 'Nón lá ở tiệm Thời Trang xinh lắm đó.',
    'Bí ngô bán được giá nhất đấy!', 'Mình đang đợi xe buýt nè.', 'Ai muốn làm bạn với mình không?',
    'Gà nhà mình đẻ trứng to lắm!', 'Đi dạo quanh đài phun nước thật thư giãn.', 'Lên cấp 5 là mua được vương miện!',
  ],
};

/** Danh sách mọi vật phẩm trong túi đồ: hạt giống, nông sản, sản phẩm chăn nuôi */
DATA.ITEMS = (() => {
  const items = {};
  for (const [id, c] of Object.entries(DATA.CROPS)) {
    items['seed_' + id] = { name: 'Hạt ' + c.name.toLowerCase(), icon: '🌱', sub: c.icon, sell: 0 };
    items[id] = { name: c.name, icon: c.icon, sell: c.sell };
  }
  for (const [id, p] of Object.entries(DATA.PRODUCTS)) items[id] = { name: p.name, icon: p.icon, sell: p.sell };
  return items;
})();
