-- =====================================================================
-- Avatar Game · 📷 Gửi ảnh trong chat (khung chat chung + nhắn tin riêng)
-- Chạy 1 lần trong Supabase → SQL Editor (sau các file 01–11).
-- Tạo kho ảnh công khai "chat-images": ai đăng nhập cũng tải ảnh lên thư mục của chính mình,
-- mọi người xem được ảnh qua link. Ảnh tối đa 1MB (game tự thu nhỏ trước khi gửi).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-images', 'chat-images', true, 1048576, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "Tải ảnh chat của mình" on storage.objects;
drop policy if exists "Xem ảnh chat" on storage.objects;
drop policy if exists "Xoá ảnh chat của mình" on storage.objects;

-- chỉ được tải ảnh vào thư mục mang id của chính mình: chat-images/<user_id>/…
create policy "Tải ảnh chat của mình" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'chat-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Xem ảnh chat" on storage.objects
  for select using (bucket_id = 'chat-images');
create policy "Xoá ảnh chat của mình" on storage.objects
  for delete to authenticated
  using (bucket_id = 'chat-images' and (storage.foldername(name))[1] = auth.uid()::text);
