-- =====================================================================
-- Avatar Game · 🏆 Hội chợ nông sản hằng tuần (Trang Trại Mở Rộng)
-- Chạy 1 lần trong Supabase → SQL Editor (sau các file 01–14).
-- Mỗi người 1 món dự thi / tuần (week = ngày thứ Hai đầu tuần), nộp lại món điểm cao hơn thì thay.
-- =====================================================================
create table if not exists public.farm_fair (
  week text not null check (week ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  item text,
  score bigint not null default 0 check (score >= 0 and score <= 100000),
  updated_at timestamptz not null default now(),
  primary key (week, user_id)
);
create index if not exists farm_fair_rank on public.farm_fair (week, score desc);
alter table public.farm_fair enable row level security;
drop policy if exists "Dự thi hội chợ" on public.farm_fair;
drop policy if exists "Sửa bài dự thi" on public.farm_fair;
drop policy if exists "Xem hội chợ" on public.farm_fair;
create policy "Dự thi hội chợ" on public.farm_fair for insert to authenticated with check (user_id = auth.uid());
create policy "Sửa bài dự thi" on public.farm_fair for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Xem hội chợ" on public.farm_fair for select to authenticated using (true);
