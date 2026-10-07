/* 📷 Gửi ảnh trong chat (khung chat chung + nhắn tin riêng).
 * Ảnh được thu nhỏ (tối đa 1024px, JPEG) rồi tải lên Supabase Storage, bucket công khai "chat-images"
 * (supabase/12-anh-chat.sql). Tin nhắn chỉ mang link ảnh; chỉ nhận link đúng bucket của game để tránh link lạ. */
const CHATIMG = (() => {
  const BUCKET = 'chat-images', MAX = 1024, MAX_BYTES = 1024 * 1024;
  const base = () => `${((window.AVATAR_CONFIG || {}).supabaseUrl || '').replace(/\/$/, '')}/storage/v1/object/public/${BUCKET}/`;
  /** link ảnh hợp lệ từ chuỗi "[img]https://…" (hoặc link trần), không hợp lệ → null */
  function url(text) {
    const s = String(text || '').replace(/^\[img\]/, '').trim();
    const b = base();
    if (!b.startsWith('https://') || !s.startsWith(b)) return null;
    return /^[\w\-/.]+$/.test(s.slice(b.length)) ? s : null;
  }
  const isImg = (text) => /^\[img\]/.test(String(text || '')) && !!url(text);

  /** thu nhỏ ảnh → Blob JPEG (GIF nhỏ giữ nguyên để còn chuyển động) */
  function shrink(file) {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/gif' && file.size <= MAX_BYTES) return resolve(file);
      const img = new Image(), u = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(u);
        const k = Math.min(1, MAX / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
        const g = c.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        const tryQ = (q) => c.toBlob((b) => (b && b.size > MAX_BYTES && q > 0.4 ? tryQ(q - 0.15) : b ? resolve(b) : reject(new Error('Không đọc được ảnh'))), 'image/jpeg', q);
        tryQ(0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(u); reject(new Error('File này không phải ảnh')); };
      img.src = u;
    });
  }

  async function upload(blob) {
    if (!CLOUD.user || !CLOUD.client) throw new Error('Đăng nhập tài khoản mới gửi được ảnh');
    const ext = blob.type === 'image/gif' ? 'gif' : 'jpg';
    const path = `${CLOUD.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await CLOUD.client.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });
    if (error) {
      const m = String(error.message || '');
      if (/bucket not found|not found/i.test(m)) throw new Error('Chủ game chưa bật gửi ảnh (chạy file supabase/12-anh-chat.sql)');
      if (/row-level|policy|unauthorized/i.test(m)) throw new Error('Chưa có quyền gửi ảnh (chạy file supabase/12-anh-chat.sql)');
      throw new Error(m);
    }
    return base() + path;
  }

  /** chọn / dán ảnh → xem trước → bấm Gửi → onSend(url) */
  async function pickAndSend(file, onSend, title = '📷 Gửi ảnh') {
    if (!file || !/^image\//.test(file.type)) return UI.toast('Chỉ gửi được file ảnh (jpg, png, gif…)');
    if (file.size > 15 * 1024 * 1024) return UI.toast('Ảnh lớn quá (tối đa 15MB)');
    if (!CLOUD.user) return UI.toast('🔐 Đăng nhập tài khoản mới gửi được ảnh');
    let blob;
    try { blob = await shrink(file); } catch (e) { return UI.toast('⚠️ ' + e.message); }
    const prev = URL.createObjectURL(blob);
    const p = UI.panel(title, `<div class="ci-prev"><img src="${prev}" alt="ảnh"></div>
      <div class="row-end" style="justify-content:center"><button class="btn ghost" data-no>Huỷ</button><button class="btn" data-go>📤 Gửi ảnh</button></div>`, { onClose: () => URL.revokeObjectURL(prev) });
    p.body.querySelector('[data-no]').onclick = () => p.close();
    const go = p.body.querySelector('[data-go]');
    go.onclick = async () => {
      go.disabled = true; go.textContent = '⏳ Đang gửi…';
      try { const u = await upload(blob); p.close(); await onSend(u); }
      catch (e) { go.disabled = false; go.textContent = '📤 Gửi ảnh'; UI.toast('⚠️ ' + e.message, 5000); }
    };
  }

  /** ảnh đầu tiên trong clipboard của sự kiện paste (không có → null) */
  function fromPaste(e) {
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for (const it of items) if (it.kind === 'file' && /^image\//.test(it.type)) return it.getAsFile();
    return null;
  }
  /** gắn nút 📷 + dán ảnh (Ctrl+V) vào 1 ô nhập */
  function attach(input, button, onSend, title) {
    const file = document.createElement('input');
    file.type = 'file'; file.accept = 'image/*'; file.hidden = true;
    button.after(file);
    button.onclick = (e) => { e.preventDefault(); file.value = ''; file.click(); };
    file.onchange = () => { if (file.files[0]) pickAndSend(file.files[0], onSend, title); };
    input.addEventListener('paste', (e) => { const f = fromPaste(e); if (f) { e.preventDefault(); pickAndSend(f, onSend, title); } });
  }

  /** xem ảnh to */
  function view(u) {
    if (!url(u)) return;
    UI.panel('🖼️ Ảnh', `<div class="ci-full"><img src="${url(u)}" alt="ảnh"></div><div class="row-end" style="justify-content:center"><a class="btn ghost" href="${url(u)}" target="_blank" rel="noopener">🔗 Mở ảnh gốc</a></div>`, { wide: true });
  }
  return { url, isImg, attach, view, pickAndSend };
})();
