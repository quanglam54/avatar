-- =====================================================================
-- Avatar Game · 🦎 Giải đấu tuần Tắc Kè Hoa
-- Chạy 1 lần trong Supabase → SQL Editor (sau các file 01–19).
-- Mỗi ván chơi xong cộng điểm (= số xu thưởng của ván, tối đa 100) vào bảng tuần (tuần bắt đầu thứ Hai, giờ Việt Nam).
-- Chỉ cộng được qua hàm hide_week_add: mỗi người tối đa 1 lần / 40 giây (1 ván ít nhất 45 giây trốn).
-- Top 3 tuần trước nhận thưởng trong game (1.000.000 / 500.000 / 200.000 xu).
-- =====================================================================
create table if not exists public.hide_week (
  week text not null check (week ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  points int not null default 0 check (points >= 0),
  catches int not null default 0 check (catches >= 0),
  wins int not null default 0 check (wins >= 0),
  rounds int not null default 0 check (rounds >= 0),
  updated_at timestamptz not null default now(),
  primary key (week, user_id)
);
create index if not exists hide_week_rank on public.hide_week (week, points desc, updated_at);
alter table public.hide_week enable row level security;
drop policy if exists "Xem giải Tắc Kè Hoa" on public.hide_week;
create policy "Xem giải Tắc Kè Hoa" on public.hide_week for select to authenticated using (true);
-- không có policy insert/update: chỉ ghi qua hàm bên dưới

create or replace function public.hide_week_add(p_name text, p_points int, p_catches int, p_win boolean)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  wk text := to_char(date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM-DD');
  r public.hide_week;
  total int;
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập'; end if;
  select * into r from public.hide_week where week = wk and user_id = auth.uid() for update;
  if found and r.updated_at > now() - interval '40 seconds' then return r.points; end if;
  insert into public.hide_week as h (week, user_id, name, points, catches, wins, rounds, updated_at)
  values (wk, auth.uid(), left(coalesce(p_name, ''), 24), least(greatest(coalesce(p_points, 0), 0), 100),
          least(greatest(coalesce(p_catches, 0), 0), 10), case when p_win then 1 else 0 end, 1, now())
  on conflict (week, user_id) do update set
    name = excluded.name,
    points = h.points + excluded.points,
    catches = h.catches + excluded.catches,
    wins = h.wins + excluded.wins,
    rounds = h.rounds + 1,
    updated_at = now()
  returning points into total;
  return total;
end;
$$;
revoke all on function public.hide_week_add(text, int, int, boolean) from public, anon;
grant execute on function public.hide_week_add(text, int, int, boolean) to authenticated;
