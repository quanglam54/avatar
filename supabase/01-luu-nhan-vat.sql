-- =====================================================================
-- Avatar Game · Bảng lưu nhân vật (chạy trước file 02)
-- Nhớ tắt: Authentication → Sign In / Providers → Email → "Confirm email"
-- =====================================================================
create table if not exists public.saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

drop policy if exists "Đọc bản lưu của mình" on public.saves;
drop policy if exists "Tạo bản lưu của mình" on public.saves;
drop policy if exists "Sửa bản lưu của mình" on public.saves;

create policy "Đọc bản lưu của mình" on public.saves
  for select using (auth.uid() = user_id);
create policy "Tạo bản lưu của mình" on public.saves
  for insert with check (auth.uid() = user_id);
create policy "Sửa bản lưu của mình" on public.saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists saves_username_idx on public.saves (username);
