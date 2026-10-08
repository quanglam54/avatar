-- =====================================================================
-- Avatar Game · 🎰 Xổ số miền Bắc + 🎲 sự kiện bất ngờ (túi tiền rơi, rồng con đi lạc)
-- Chạy 1 lần trong Supabase → SQL Editor (sau các file 01–10).
--
-- XỔ SỐ: mua vé 5 số đến 18h30 (giờ Việt Nam). Sau 18h30 hàm lottery_draw quay số NGẪU NHIÊN
-- trên máy chủ (không ai đoán trước được), lưu lại 1 lần duy nhất cho mỗi ngày.
-- =====================================================================

create table if not exists public.lottery_tickets (
  id bigserial primary key,
  day text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  num text not null check (num ~ '^[0-9]{5}$'),
  claimed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists lottery_tickets_day on public.lottery_tickets (day);
create index if not exists lottery_tickets_mine on public.lottery_tickets (user_id) where not claimed;

alter table public.lottery_tickets enable row level security;
drop policy if exists "Mua vé trước 18h30" on public.lottery_tickets;
drop policy if exists "Xem vé" on public.lottery_tickets;
drop policy if exists "Đánh dấu đã lĩnh" on public.lottery_tickets;

-- chỉ mua vé của đúng hôm nay, trước 18h30 giờ Việt Nam
create policy "Mua vé trước 18h30" on public.lottery_tickets
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and day = to_char((now() at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM-DD')
    and (now() at time zone 'Asia/Ho_Chi_Minh')::time < time '18:30'
  );
create policy "Xem vé" on public.lottery_tickets
  for select to authenticated using (true);
-- chỉ được sửa cột claimed của vé mình (đánh dấu đã lĩnh thưởng), không sửa được số vé
create policy "Đánh dấu đã lĩnh" on public.lottery_tickets
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.lottery_tickets from authenticated, anon;
grant update (claimed) on public.lottery_tickets to authenticated;

create table if not exists public.lottery_results (
  day text primary key,
  nums jsonb not null,
  drawn_at timestamptz not null default now()
);
alter table public.lottery_results enable row level security;
drop policy if exists "Xem kết quả" on public.lottery_results;
create policy "Xem kết quả" on public.lottery_results
  for select to authenticated using (true);
-- không có quyền ghi → chỉ hàm lottery_draw được ghi kết quả

/** Quay số cho ngày p_day (mặc định: kỳ gần nhất đã đến giờ quay).
 *  Trả về { day, nums, fresh } — fresh = true nếu lần gọi này vừa quay xong. */
create or replace function public.lottery_draw(p_day text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  vn timestamp := now() at time zone 'Asia/Ho_Chi_Minh';
  today text := to_char(vn::date, 'YYYY-MM-DD');
  d text := coalesce(p_day, case when vn::time >= time '18:30' then today else to_char(vn::date - 1, 'YYYY-MM-DD') end);
  r public.lottery_results;
  n jsonb;
  inserted boolean := false;
begin
  if auth.uid() is null then return null; end if;
  if d !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then return null; end if;
  if d > today or (d = today and vn::time < time '18:30') then return null; end if;
  select * into r from public.lottery_results where day = d;
  if found then return jsonb_build_object('day', r.day, 'nums', r.nums, 'fresh', false); end if;
  n := jsonb_build_object(
    'db', (select jsonb_agg(lpad(floor(random() * 100000)::int::text, 5, '0')) from generate_series(1, 1)),
    'g1', (select jsonb_agg(lpad(floor(random() * 100000)::int::text, 5, '0')) from generate_series(1, 1)),
    'g2', (select jsonb_agg(lpad(floor(random() * 100000)::int::text, 5, '0')) from generate_series(1, 2)),
    'g3', (select jsonb_agg(lpad(floor(random() * 100000)::int::text, 5, '0')) from generate_series(1, 6)),
    'g4', (select jsonb_agg(lpad(floor(random() * 10000)::int::text, 4, '0')) from generate_series(1, 4)),
    'g5', (select jsonb_agg(lpad(floor(random() * 10000)::int::text, 4, '0')) from generate_series(1, 6)),
    'g6', (select jsonb_agg(lpad(floor(random() * 1000)::int::text, 3, '0')) from generate_series(1, 3)),
    'g7', (select jsonb_agg(lpad(floor(random() * 100)::int::text, 2, '0')) from generate_series(1, 4))
  );
  insert into public.lottery_results (day, nums) values (d, n) on conflict (day) do nothing returning true into inserted;
  select * into r from public.lottery_results where day = d;
  return jsonb_build_object('day', r.day, 'nums', r.nums, 'fresh', coalesce(inserted, false));
end $$;
revoke all on function public.lottery_draw(text) from public, anon;
grant execute on function public.lottery_draw(text) to authenticated;

-- =====================================================================
-- 🎲 Sự kiện bất ngờ "ai nhanh tay người đó được": túi tiền rơi ở Quảng trường, rồng con đi lạc.
-- key dạng 'bag|2026-10-07|123' → khoá chính nên chỉ 1 người nhận được.
-- =====================================================================
create table if not exists public.event_claims (
  key text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  claimed_at timestamptz not null default now()
);
alter table public.event_claims enable row level security;
drop policy if exists "Nhận quà sự kiện hôm nay" on public.event_claims;
drop policy if exists "Xem ai đã nhận" on public.event_claims;
create policy "Nhận quà sự kiện hôm nay" on public.event_claims
  for insert to authenticated
  with check (user_id = auth.uid() and split_part(key, '|', 2) = to_char((now() at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM-DD'));
create policy "Xem ai đã nhận" on public.event_claims
  for select to authenticated using (true);
