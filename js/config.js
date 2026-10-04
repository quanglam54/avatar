/*
 * Cấu hình chơi online.
 * - Điền URL và anon key của Supabase để mọi người trên mọi máy thấy nhau và chat với nhau.
 *   Lấy ở: Supabase Dashboard → Project Settings → API (Project URL + anon public key).
 *   Không cần tạo bảng nào — game chỉ dùng Realtime Broadcast.
 * - Để trống = chế độ thử: chỉ thấy nhau giữa các tab trên cùng một máy.
 */
window.AVATAR_CONFIG = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};
