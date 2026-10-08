-- =====================================================================
-- Avatar Game · 🏴‍☠️ Săn kho báu bãi biển (sự kiện Halloween)
-- Mỗi ngày cả server có 3 rương (slot 0..2). Khoá chính (day, slot) → ai đào trước người đó được,
-- người thứ 2 ghi vào sẽ bị từ chối. Chạy 1 lần trong Supabase → SQL Editor.
-- =====================================================================

create table if not exists public.treasure_claims (
  day text not null,
  slot int not null check (slot between 0 and 2),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  claimed_at timestamptz not null default now(),
  primary key (day, slot)
);
create index if not exists treasure_claims_time on public.treasure_claims (claimed_at);

alter table public.treasure_claims enable row level security;
drop policy if exists "Đào rương hôm nay" on public.treasure_claims;
drop policy if exists "Xem ai đã đào" on public.treasure_claims;

-- chỉ được nhận rương của đúng ngày hôm nay (giờ Việt Nam)
create policy "Đào rương hôm nay" on public.treasure_claims
  for insert to authenticated
  with check (user_id = auth.uid() and day = to_char((now() at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM-DD'));

create policy "Xem ai đã đào" on public.treasure_claims
  for select to authenticated using (true);
-- không có quyền sửa / xoá → không ai giành lại được rương đã đào
