/*
 * Cấu hình chơi online.
 * - Điền URL và anon key của Supabase để mọi người trên mọi máy thấy nhau và chat với nhau.
 *   Lấy ở: Supabase Dashboard → Project Settings → API (Project URL + anon public key).
 *   Không cần tạo bảng nào — game chỉ dùng Realtime Broadcast.
 * - Để trống = chế độ thử: chỉ thấy nhau giữa các tab trên cùng một máy.
 */
window.AVATAR_CONFIG = {
  // Mic khác mạng (4G ↔ wifi) cần máy chủ chuyển tiếp TURN. Đăng ký miễn phí ở metered.ca → TURN Server → lấy link
  // "credentials" có apiKey rồi dán vào đây, vd: turnApiUrl: 'https://ten-app.metered.live/api/v1/turn/credentials?apiKey=XXXX',
  turnApiUrl: '',
  // Máy chủ nối mic (STUN + TURN chuyển tiếp của Metered) — để 2 người khác mạng vẫn nghe được nhau
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun.relay.metered.ca:80'] },
    { urls: 'turn:global.relay.metered.ca:80', username: 'cba0aeb5044bc68d74220e1e', credential: 'P2Cas15p8lNBiR9C' },
    { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: 'cba0aeb5044bc68d74220e1e', credential: 'P2Cas15p8lNBiR9C' },
    { urls: 'turn:global.relay.metered.ca:443', username: 'cba0aeb5044bc68d74220e1e', credential: 'P2Cas15p8lNBiR9C' },
    { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: 'cba0aeb5044bc68d74220e1e', credential: 'P2Cas15p8lNBiR9C' },
  ],
  // Nhạc nền mặc định cho mọi người: link YouTube (bài / playlist) hoặc link file .mp3. Để 'chill' = nhạc tự tạo
  defaultMusic: 'https://youtu.be/UyhGJdyLVmU',
  supabaseUrl: 'https://pdmqatnknikjcykeubyg.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbXFhdG5rbmlramN5a2V1YnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwOTg3NzUsImV4cCI6MjEwNjY3NDc3NX0.fJxGkqwNAsD1rN4SfT92nNkxRuVbWWNR6KfKD7zSvZY',
};
