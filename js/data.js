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
    { id: 'vampire', name: 'Áo choàng ma cà rồng', price: 0, event: true },
    { id: 'witchdress', name: 'Váy phù thuỷ', price: 0, event: true },
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
    { id: 'witch', name: 'Mũ phù thuỷ', price: 0, event: true },
    { id: 'pumpkinhead', name: 'Đầu bí ngô', price: 0, event: true },
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
    { id: 'keobo', name: 'Bắt Bò', icon: '🐄', color: '#e03131', div: 60 },
  ],
  CROPS: {
    wheat: { name: 'Lúa mì', icon: '🌾', seed: 2, sell: 5, time: 300, xp: 4, lvl: 1, yield: 4 },
    carrot: { name: 'Cà rốt', icon: '🥕', seed: 4, sell: 9, time: 600, xp: 6, lvl: 1, yield: 3 },
    rose: { name: 'Hoa hồng', icon: '🌹', seed: 7, sell: 15, time: 1200, xp: 8, lvl: 2, yield: 3, kind: 'both' },
    strawberry: { name: 'Dâu tây', icon: '🍓', seed: 9, sell: 19, time: 1800, xp: 10, lvl: 2, yield: 3 },
    corn: { name: 'Ngô', icon: '🌽', seed: 13, sell: 28, time: 3600, xp: 14, lvl: 3, yield: 3 },
    pumpkin: { name: 'Bí ngô', icon: '🎃', seed: 22, sell: 60, time: 7200, xp: 20, lvl: 4, yield: 2 },
    tomato: { name: 'Cà chua', icon: '🍅', seed: 6, sell: 13, time: 900, xp: 7, lvl: 2, yield: 4 },
    potato: { name: 'Khoai tây', icon: '🥔', seed: 5, sell: 11, time: 1200, xp: 7, lvl: 2, yield: 4 },
    cucumber: { name: 'Dưa chuột', icon: '🥒', seed: 8, sell: 16, time: 1500, xp: 9, lvl: 3, yield: 3 },
    chili: { name: 'Ớt', icon: '🌶️', seed: 10, sell: 20, time: 2100, xp: 10, lvl: 3, yield: 4 },
    cabbage: { name: 'Bắp cải', icon: '🥬', seed: 14, sell: 30, time: 3000, xp: 13, lvl: 4, yield: 3 },
    grape: { name: 'Nho', icon: '🍇', seed: 18, sell: 38, time: 4200, xp: 16, lvl: 5, yield: 3 },
    banana: { name: 'Chuối', icon: '🍌', seed: 20, sell: 42, time: 5400, xp: 18, lvl: 5, yield: 3 },
    pineapple: { name: 'Dứa', icon: '🍍', seed: 24, sell: 55, time: 6000, xp: 20, lvl: 6, yield: 2 },
    watermelon: { name: 'Dưa hấu', icon: '🍉', seed: 30, sell: 70, time: 7200, xp: 22, lvl: 6, yield: 2 },
    ginseng: { name: 'Nhân sâm', icon: '🌿', seed: 40, sell: 95, time: 14400, xp: 30, lvl: 7, yield: 2 },
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
  /** 3 chuồng riêng: bò cho sữa, cừu cho len, heo cho thịt */
  PENS: {
    cow: { name: 'Chuồng bò', icon: '🐄', time: 1800, feed: 2, out: { milk: 8 }, xp: 12, fedMsg: 'Đã cho bò ăn! 🐄', waitMsg: 'Bò đang làm sữa…' },
    sheep: { name: 'Chuồng cừu', icon: '🐑', time: 1800, feed: 1, out: { wool: 4 }, xp: 8, fedMsg: 'Đã cho cừu ăn! 🐑', waitMsg: 'Cừu đang mọc len…' },
    pig: { name: 'Chuồng heo', icon: '🐖', time: 2400, feed: 2, out: { pork: 3 }, xp: 10, fedMsg: 'Đã đổ cám cho heo! 🐖', waitMsg: 'Heo đang ăn no ngủ kỹ…' },
  },
  PLOT_PRICES: [0, 0, 0, 0, 0, 0, 40, 80, 120, 200],
  BED_PRICES: [0, 150, 400, 900, 1500, 2200, 3000, 4000, 0, 300, 800, 1500, 4500, 5000, 5500, 6000, 7000, 8000, 9000, 10000],
  /** Luống 12–19: khu đất mở rộng (trồng rau củ) */
  EXTRA_BEDS: 8,
  BED_COUNT: 20,
  FIELD_BEDS: 8,
  FLOWER_BEDS: 4,
  TILES_PER_BED: 12,
  THIRSTY_AT: 0.4,
  WATER_CUT: 0.1,
  FERT: { id: 'fertilizer', name: 'Phân bón', icon: '🧪', price: 5, cut: 0.3, noFertYield: 0.6 },
  /** Sâu bệnh: ~45% lần gieo sẽ bị sâu giữa chừng → cây đứng không lớn tới khi xịt thuốc (1 chai / luống) */
  PEST: { id: 'pesticide', name: 'Thuốc trừ sâu', icon: '🧴', price: 8, chance: 0.45 },
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
  { id: 'ghost', name: 'Ma nhỏ', price: 0, event: true },
  { id: 'bat', name: 'Dơi con', price: 0, event: true },
  { id: 'dino', name: 'Khủng long con', price: 600 },
  { id: 'dino_pink', name: 'Khủng long hồng', price: 0, event: true },
];

/** Thú giữ nhà: canh nông trại, kẻ hái trộm có thể bị cắn và bị phạt xu (xu phạt về túi chủ nhà) */
DATA.GUARDS = [
  { id: 'none', name: 'Không nuôi', icon: '🚫', price: 0, bite: 0, fine: 0 },
  { id: 'dog', name: 'Chó cỏ', icon: '🐕', price: 500, bite: 0.35, fine: 40 },
  { id: 'shepherd', name: 'Chó béc-giê', icon: '🐺', price: 1500, bite: 0.5, fine: 80 },
  { id: 'tiger', name: 'Hổ vằn', icon: '🐯', price: 4000, bite: 0.65, fine: 150 },
  { id: 'lion', name: 'Sư tử', icon: '🦁', price: 8000, bite: 0.8, fine: 250 },
  { id: 'trex', name: 'Khủng long bạo chúa', icon: '🦖', price: 12000, bite: 0.85, fine: 350 },
  { id: 'dragon', name: 'Rồng lửa', icon: '🐉', price: 20000, bite: 0.9, fine: 500 },
];
/** Pháo hoa ở Sân Chơi nông trại */
DATA.FIREWORKS = [
  { id: 'basic', icon: '🎆', name: 'Pháo hoa thường', desc: 'Bắn 5 quả nổ tung nhiều màu', price: 20 },
  { id: 'heart', icon: '💖', name: 'Pháo hoa trái tim', desc: '3 quả nổ thành hình trái tim', price: 50 },
  { id: 'text', icon: '✨', name: 'Pháo hoa chữ', desc: 'Nổ thành tên của bạn trên trời', price: 100 },
  { id: 'show', icon: '🎇', name: 'Màn pháo hoa lớn', desc: 'Bắn liên tục khoảng 20 giây, kết thúc bằng tên bạn', price: 300 },
];

/** Đồ nội thất mua thêm cho nhà (mua xong hiện ngay trong nhà) */
DATA.FURNITURE = [
  { id: 'piano', icon: '🎹', name: 'Đàn piano', price: 1200, room: 'Phòng khách', desc: 'Bấm để chơi đàn (+XP)' },
  { id: 'aquarium', icon: '🐠', name: 'Bể cá cảnh', price: 800, room: 'Phòng khách', desc: 'Cá bơi tung tăng, bấm để ngắm (+XP)' },
  { id: 'console', icon: '🎮', name: 'Máy chơi game', price: 1500, room: 'Phòng khách', desc: 'Chơi game máy ngay trong nhà, có thưởng xu' },
  { id: 'painting', icon: '🖼️', name: 'Tranh phong cảnh', price: 300, room: 'Phòng khách', desc: 'Treo trên tường phía trên TV' },
  { id: 'teddy', icon: '🧸', name: 'Gấu bông khổng lồ', price: 500, room: 'Phòng ngủ', desc: 'Bấm để ôm gấu (+XP)' },
  { id: 'rug', icon: '🟣', name: 'Thảm lông', price: 400, room: 'Phòng ngủ', desc: 'Thảm lông tím mềm mại' },
  { id: 'clock', icon: '🕰️', name: 'Đồng hồ quả lắc', price: 600, room: 'Sảnh', desc: 'Chạy đúng giờ thật, quả lắc đung đưa' },
  { id: 'palm', icon: '🌴', name: 'Cây cọ cảnh', price: 250, room: 'Sảnh', desc: 'Chậu cọ xanh mát' },
  { id: 'lamp', icon: '💡', name: 'Đèn cây', price: 350, room: 'Sảnh', desc: 'Đèn đứng ánh vàng ấm áp' },
];

/** Dãy quán ăn uống trước cổng nông trại: ăn uống tốn xu, được XP (no bụng thì phải đợi tiêu bớt) */
DATA.BELLY = { max: 6, digestMin: 4 };
DATA.EATERIES = [
  { id: 'com', name: 'Cơm Tấm', sub: 'CƠM BÌNH DÂN · CƠM GÀ', logo: '🍛', wall: '#fff3bf', trim: '#e67700', awn: ['#fd7e14', '#fff'], signBg: '#e8590c', signFg: '#fff', items: ['🍛', '🍗', '🥚'], deco: 'stools',
    menu: [{ id: 'com_suon', name: 'Cơm tấm sườn bì chả', icon: '🍛', price: 25, xp: 12 }, { id: 'com_ga', name: 'Cơm gà xối mỡ', icon: '🍗', price: 22, xp: 10 }, { id: 'com_rang', name: 'Cơm rang dưa bò', icon: '🍳', price: 18, xp: 8 }] },
  { id: 'pho', name: 'Phở Hà Nội', sub: 'PHỞ BÒ · PHỞ GÀ GIA TRUYỀN', logo: '🍜', wall: '#fff', trim: '#c92a2a', awn: ['#e03131', '#fff'], signBg: '#c92a2a', signFg: '#ffe066', items: ['🍜', '🥢', '🌿'], deco: 'stools',
    menu: [{ id: 'pho_tai', name: 'Phở bò tái lăn', icon: '🍜', price: 30, xp: 14 }, { id: 'pho_ga', name: 'Phở gà ta', icon: '🍲', price: 28, xp: 13 }, { id: 'quay', name: 'Quẩy giòn', icon: '🥖', price: 5, xp: 2 }] },
  { id: 'bunbo', name: 'Bún Bò Huế', sub: 'ĐẶC SẢN CỐ ĐÔ', logo: '🌶️', wall: '#ffe8cc', trim: '#7048e8', awn: ['#845ef7', '#ffd43b'], signBg: '#5f3dc4', signFg: '#ffd43b', items: ['🍲', '🌶️', '🍋'], deco: 'stools',
    menu: [{ id: 'bunbo_dacbiet', name: 'Bún bò Huế đặc biệt', icon: '🍲', price: 32, xp: 15 }, { id: 'bun_cha', name: 'Bún chả Hà Nội', icon: '🥗', price: 28, xp: 13 }, { id: 'tra_da', name: 'Trà đá', icon: '🧊', price: 3, xp: 1 }] },
  { id: 'mi', name: 'Mì Cay · Mì Ếch', sub: 'MÌ CAY 7 CẤP ĐỘ 🔥', logo: '🔥', wall: '#ffe3e3', trim: '#212529', awn: ['#e03131', '#212529'], signBg: '#212529', signFg: '#ff6b6b', items: ['🍜', '🐸', '🔥'], deco: 'stools',
    menu: [{ id: 'mi_cay', name: 'Mì cay hải sản cấp 7', icon: '🌶️', price: 26, xp: 12 }, { id: 'mi_ech', name: 'Mì ếch om', icon: '🐸', price: 35, xp: 16 }, { id: 'kimchi', name: 'Kim chi thêm', icon: '🥬', price: 6, xp: 2 }] },
  { id: 'koi', name: 'KOI Thé', sub: 'TRÀ SỮA · MACCHIATO', logo: '🧋', wall: '#fff8e6', trim: '#b08968', awn: ['#7f5539', '#fff8e6'], signBg: '#3d2b1f', signFg: '#f5d6a1', items: ['🧋', '🧋', '🍮'], deco: 'cafe',
    menu: [{ id: 'koi_tran', name: 'Trà sữa trân châu hoàng kim', icon: '🧋', price: 25, xp: 10 }, { id: 'koi_mac', name: 'Trà xanh macchiato', icon: '🍵', price: 28, xp: 11 }, { id: 'koi_pudding', name: 'Thêm pudding', icon: '🍮', price: 8, xp: 3 }] },
  { id: 'highlands', name: 'Highlands', sub: 'COFFEE · SINCE 1999', logo: '☕', wall: '#f8f0e3', trim: '#8b0000', awn: ['#a51c1c', '#f8f0e3'], signBg: '#8b0000', signFg: '#fff', items: ['☕', '🥤', '🥐'], deco: 'cafe',
    menu: [{ id: 'hl_phin', name: 'Phin sữa đá', icon: '☕', price: 22, xp: 9 }, { id: 'hl_freeze', name: 'Freeze trà xanh', icon: '🥤', price: 30, xp: 12 }, { id: 'hl_banhmi', name: 'Bánh mì que', icon: '🥖', price: 12, xp: 5 }] },
  { id: 'starbucks', name: 'Starbucks', sub: 'COFFEE', logo: '⭐', wall: '#f1f3f5', trim: '#00704a', awn: ['#00704a', '#fff'], signBg: '#00704a', signFg: '#fff', items: ['☕', '🥤', '🍰'], deco: 'cafe',
    menu: [{ id: 'sb_caramel', name: 'Caramel Macchiato', icon: '☕', price: 40, xp: 15 }, { id: 'sb_frap', name: 'Java Chip Frappuccino', icon: '🥤', price: 42, xp: 16 }, { id: 'sb_cake', name: 'Bánh cheesecake', icon: '🍰', price: 30, xp: 11 }] },
  { id: 'tch', name: 'The Coffee House', nameSize: 14, sub: 'CÀ PHÊ · TRÀ', logo: '🏠', wall: '#fff4e6', trim: '#f08c00', awn: ['#212529', '#ff922b'], signBg: '#fff', signFg: '#212529', subFg: '#f08c00', items: ['☕', '🍑', '🧁'], deco: 'cafe',
    menu: [{ id: 'tch_suada', name: 'Cà phê sữa đá', icon: '☕', price: 20, xp: 8 }, { id: 'tch_dao', name: 'Trà đào cam sả', icon: '🍑', price: 26, xp: 11 }, { id: 'tch_cake', name: 'Bánh mousse', icon: '🧁', price: 18, xp: 7 }] },
];

/** Điểm danh hằng ngày: 7 ngày liên tiếp, bỏ 1 ngày thì tính lại từ ngày 1 */
DATA.CHECKIN = [
  { coins: 50, ticket: 1 },
  { coins: 80 },
  { item: 'fertilizer', n: 10, ticket: 1 },
  { coins: 120 },
  { item: 'pesticide', n: 5, ticket: 1 },
  { coins: 200, ticket: 1 },
  { coins: 500, ticket: 3 },
];
/** Đổi quà sự kiện bằng 🎟️ vé (nhận từ điểm danh) */
DATA.EXCHANGE = [
  { id: 'x_dino', kind: 'pet', pet: 'dino_pink', icon: '🦕', name: 'Thú cưng Khủng long hồng', cost: 10 },
  { id: 'x_coins', kind: 'coins', n: 1000, icon: '💰', name: '1.000 xu', cost: 5 },
  { id: 'x_fert', kind: 'item', item: 'fertilizer', n: 20, icon: '🧪', name: '20 gói phân bón', cost: 2 },
  { id: 'x_pest', kind: 'item', item: 'pesticide', n: 10, icon: '🧴', name: '10 chai thuốc trừ sâu', cost: 2 },
  { id: 'x_pumpkin', kind: 'item', item: 'seed_pumpkin', n: 10, icon: '🎃', name: '10 hạt bí ngô', cost: 3 },
  { id: 'x_hibiscus', kind: 'item', item: 'seed_hibiscus', n: 10, icon: '🌺', name: '10 hạt hoa dâm bụt', cost: 3 },
];

/** Số thú giữ nhà tối đa cùng canh một nông trại */
DATA.GUARD_MAX = 5;

/** Hái trộm: tối đa 3 ô / nông trại / ngày, lấy được một nửa sản lượng của ô */
DATA.STEAL = { perFarm: 3, share: 0.5 };

/** Vòng quay may mắn: làm nhiệm vụ để nhận lượt, tối đa 2 lượt / ngày */
DATA.WHEEL = {
  maxPerDay: 2,
  tasks: [
    { id: 'fish', icon: '🎣', text: 'Câu được {n} con cá', n: 3 },
    { id: 'harvest', icon: '🌾', text: 'Thu hoạch {n} nông sản', n: 20 },
    { id: 'quiz', icon: '🏫', text: 'Trả lời đúng {n} câu tiếng Anh ở Trường học', n: 2 },
  ],
  prizes: [
    { label: '50 xu', icon: '💰', coins: 50, w: 26, color: '#ffd43b' },
    { label: '100 xu', icon: '💰', coins: 100, w: 20, color: '#ff922b' },
    { label: '10 phân bón', icon: '🧪', item: 'fertilizer', n: 10, w: 16, color: '#69db7c' },
    { label: '300 xu', icon: '💎', coins: 300, w: 9, color: '#4dabf7' },
    { label: '40 XP', icon: '⭐', xp: 40, w: 14, color: '#da77f2' },
    { label: '6 hạt bí ngô', icon: '🎃', item: 'seed_pumpkin', n: 6, w: 10, color: '#ffa94d' },
    { label: '1000 xu', icon: '👑', coins: 1000, w: 2, color: '#f03e3e' },
    { label: '6 hạt dâu', icon: '🍓', item: 'seed_strawberry', n: 6, w: 12, color: '#ff8fab' },
  ],
};

DATA.ZONES = [
  { id: 'farm', name: 'Nông trại', icon: '🌾', x: 80, y: 80, desc: 'Trồng trọt, chăn nuôi' },
  { id: 'town', name: 'Quảng trường', icon: '⛲', x: 50, y: 52, desc: 'Gặp gỡ, trò chuyện' },
  { id: 'mall', name: 'Khu mua sắm', icon: '🛍️', x: 74, y: 28, desc: 'Chợ, thời trang, thú cưng' },
  { id: 'fun', name: 'Khu giải trí', icon: '🎡', x: 25, y: 26, desc: 'Nhà Casino, sân khấu, vòng quay' },
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
  { id: 'arcade', icon: '🕹️', text: 'Chơi {n} ván máy game ở Nhà Casino (Khu giải trí)', n: 2, coins: 30, xp: 20 },
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

/** Sự kiện Halloween (tháng 10): đổi kẹo lấy đồ */
DATA.HALLOWEEN = {
  shop: [
    { kind: 'hat', id: 'witch', name: 'Mũ phù thuỷ', icon: '🧙', candy: 15 },
    { kind: 'shirt', id: 'vampire', name: 'Áo choàng ma cà rồng', icon: '🧛', candy: 25 },
    { kind: 'shirt', id: 'witchdress', name: 'Váy phù thuỷ', icon: '👗', candy: 25 },
    { kind: 'hat', id: 'pumpkinhead', name: 'Đầu bí ngô', icon: '🎃', candy: 30 },
    { kind: 'pet', id: 'bat', name: 'Dơi con', icon: '🦇', candy: 35 },
    { kind: 'pet', id: 'ghost', name: 'Ma nhỏ', icon: '👻', candy: 40 },
  ],
  candyToCoins: 5,
};

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
  items.pesticide = { name: 'Thuốc trừ sâu', icon: '🧴', sell: 0 };
  items.ticket = { name: 'Vé sự kiện', icon: '🎟️', sell: 0 };
  items.candy = { name: 'Kẹo Halloween', icon: '🍬', sell: 0 };
  return items;
})();
