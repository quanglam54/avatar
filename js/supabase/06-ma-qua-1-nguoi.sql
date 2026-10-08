-- =====================================================================
-- Avatar Game · Mã quà dùng chung cả server (chỉ 1 người nhận được)
-- Chạy 1 lần trong Supabase → SQL Editor.
-- Khoá chính là mã (đã băm) → người thứ 2 trở đi ghi vào sẽ bị từ chối.
-- =====================================================================

create table if not exists public.gift_claims (
  code text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  claimed_at timestamptz not null default now()
);

alter table public.gift_claims enable row level security;

drop policy if exists "Nhận mã quà" on public.gift_claims;
drop policy if exists "Xem ai đã nhận mã" on public.gift_claims;

create policy "Nhận mã quà" on public.gift_claims
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "Xem ai đã nhận mã" on public.gift_claims
  for select to authenticated
  using (true);
-- không có quyền sửa / xoá → không ai giành lại được mã đã nhận
