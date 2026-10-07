/* 🍂 Mùa trong năm (kiểu Stardew Valley): mỗi mùa 7 ngày thật, cả server dùng chung theo lịch.
 * Mỗi loại cây chỉ gieo được trong mùa của nó (cây đã trồng vẫn lớn tiếp). Cảnh vật đổi màu theo mùa. */
const SEASON = (() => {
  const LIST = [
    { id: 'spring', name: 'Xuân', icon: '🌸', tint: 'rgba(255,182,213,.06)', fall: 'petals' },
    { id: 'summer', name: 'Hạ', icon: '☀️', tint: 'rgba(255,236,153,.05)', fall: null },
    { id: 'autumn', name: 'Thu', icon: '🍂', tint: 'rgba(232,121,32,.09)', fall: 'leaves' },
    { id: 'winter', name: 'Đông', icon: '❄️', tint: 'rgba(200,225,255,.16)', fall: 'snow' },
  ];
  /** mùa của từng cây: 0 Xuân · 1 Hạ · 2 Thu · 3 Đông */
  const CROP = {
    wheat: [0, 2], carrot: [0, 2, 3], rose: [0, 1, 3], strawberry: [0], corn: [1, 2], pumpkin: [2], tomato: [1], potato: [0, 3],
    cucumber: [1], chili: [1, 2], cabbage: [0, 2, 3], grape: [2], banana: [1], pineapple: [1], watermelon: [1], ginseng: [2, 3],
    daisy: [0, 2], tulip: [0, 3], sunflower: [1, 2], hibiscus: [1],
  };
  function now() {
    const d = new Date(), days = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5) + 1;
    const i = Math.floor(days / 7) % 4;
    return { i, ...LIST[i], day: (days % 7) + 1 };
  }
  const inSeason = (crop) => !CROP[crop] || CROP[crop].includes(now().i);
  const seasonsOf = (crop) => (CROP[crop] || [0, 1, 2, 3]).map((i) => LIST[i].icon + ' ' + LIST[i].name).join(', ');
  return { LIST, CROP, now, inSeason, seasonsOf };
})();
