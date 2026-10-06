/* Ảnh vẽ sẵn (PNG/JPG) cho toà nhà, đồ vật, nền trời: tải 1 lần; tải xong thì vẽ lại nền bản đồ */
const IMG = (() => {
  const cache = {};
  function get(src) {
    let im = cache[src];
    if (!im) {
      im = cache[src] = new Image();
      im.onload = () => { if (typeof AV !== 'undefined' && AV.refreshGround) AV.refreshGround(); };
      im.src = src;
    }
    return im.complete && im.naturalWidth ? im : null;
  }
  return { get, preload: (list) => list.forEach(get) };
})();
