// Service worker tối giản: chỉ để trình duyệt cho "cài như app".
// Không lưu cache → mỗi lần mở luôn lấy bản mới nhất từ Netlify.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
