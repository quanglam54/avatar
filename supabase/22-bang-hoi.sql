-- =====================================================================
-- Avatar Game · 🛡️ Bang hội
-- Chạy 1 lần trong Supabase → SQL Editor (sau các file 01–21).
-- Mỗi người ở 1 bang · bang tối đa 20 người · góp xu vào quỹ tuần (tuần bắt đầu thứ Hai, giờ VN).
-- Quỹ tuần đạt 1tr / 5tr / 20tr → mỗi thành viên nhận thưởng mốc 1 lần / tuần (dù có đổi bang).
-- Mọi thao tác ghi đều qua hàm (security definer).
-- =====================================================================
create or replace function public.vn_week() returns text language sql stable as $$
  select to_char(date_trunc('week', now() at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM-DD')
$$;

create table if not exists public.guilds (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 3 and 24),
  icon text not null default '🛡️' check (char_length(icon) <= 8),
  descr text check (char_length(descr) <= 120),
  leader uuid references auth.users(id) on delete set null,
  members int not null default 1,
  created_at timestamptz not null default now()
);
create unique index if not exists guilds_name_uq on public.guilds (lower(name));

create table if not exists public.guild_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  guild_id bigint not null references public.guilds(id) on delete cascade,
  name text,
  role text not null default 'member' check (role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  week text,
  week_pts bigint not null default 0,
  total_pts bigint not null default 0
);
create index if not exists guild_members_g on public.guild_members (guild_id);

create table if not exists public.guild_week (
  guild_id bigint not null references public.guilds(id) on delete cascade,
  week text not null,
  points bigint not null default 0,
  primary key (guild_id, week)
);
create index if not exists guild_week_rank on public.guild_week (week, points desc);

create table if not exists public.guild_claims (
  week text not null,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lvl int not null check (lvl between 1 and 3),
  guild_id bigint,
  primary key (week, user_id, lvl)
);

alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.guild_week enable row level security;
alter table public.guild_claims enable row level security;
drop policy if exists "Xem bang" on public.guilds;
drop policy if exists "Xem thành viên bang" on public.guild_members;
drop policy if exists "Xem quỹ bang" on public.guild_week;
drop policy if exists "Xem mốc đã nhận" on public.guild_claims;
create policy "Xem bang" on public.guilds for select to authenticated using (true);
create policy "Xem thành viên bang" on public.guild_members for select to authenticated using (true);
create policy "Xem quỹ bang" on public.guild_week for select to authenticated using (true);
create policy "Xem mốc đã nhận" on public.guild_claims for select to authenticated using (user_id = auth.uid());

-- lập bang
create or replace function public.guild_create(p_name text, p_icon text, p_descr text, p_pname text)
returns bigint language plpgsql security definer set search_path = public as $$
declare gid bigint;
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập'; end if;
  if exists (select 1 from public.guild_members where user_id = auth.uid()) then raise exception 'Bạn đang ở trong một bang rồi'; end if;
  if exists (select 1 from public.guilds where lower(name) = lower(trim(p_name))) then raise exception 'Tên bang này đã có người dùng'; end if;
  insert into public.guilds (name, icon, descr, leader) values (trim(p_name), coalesce(nullif(p_icon, ''), '🛡️'), left(coalesce(p_descr, ''), 120), auth.uid()) returning id into gid;
  insert into public.guild_members (user_id, guild_id, name, role) values (auth.uid(), gid, left(coalesce(p_pname, ''), 24), 'leader');
  return gid;
end; $$;

-- vào bang
create or replace function public.guild_join(p_id bigint, p_pname text)
returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập'; end if;
  if exists (select 1 from public.guild_members where user_id = auth.uid()) then raise exception 'Bạn đang ở trong một bang rồi'; end if;
  select members into n from public.guilds where id = p_id for update;
  if not found then raise exception 'Bang này không còn nữa'; end if;
  if n >= 20 then raise exception 'Bang đã đủ 20 người'; end if;
  insert into public.guild_members (user_id, guild_id, name) values (auth.uid(), p_id, left(coalesce(p_pname, ''), 24));
  update public.guilds set members = members + 1 where id = p_id;
end; $$;

-- rời bang (bang chủ rời → người vào sớm nhất lên thay; bang trống → giải tán)
create or replace function public.guild_leave()
returns void language plpgsql security definer set search_path = public as $$
declare m public.guild_members; nxt uuid;
begin
  select * into m from public.guild_members where user_id = auth.uid();
  if not found then return; end if;
  perform 1 from public.guilds where id = m.guild_id for update;
  delete from public.guild_members where user_id = auth.uid();
  update public.guilds set members = greatest(0, members - 1) where id = m.guild_id;
  if m.role = 'leader' then
    select user_id into nxt from public.guild_members where guild_id = m.guild_id order by joined_at limit 1;
    if nxt is null then delete from public.guilds where id = m.guild_id;
    else
      update public.guild_members set role = 'leader' where user_id = nxt;
      update public.guilds set leader = nxt where id = m.guild_id;
    end if;
  end if;
end; $$;

-- bang chủ mời ra khỏi bang
create or replace function public.guild_kick(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare g bigint;
begin
  select guild_id into g from public.guild_members where user_id = auth.uid() and role = 'leader';
  if g is null then raise exception 'Chỉ bang chủ mới mời người ra được'; end if;
  if p_user = auth.uid() then raise exception 'Không tự mời mình ra được'; end if;
  delete from public.guild_members where user_id = p_user and guild_id = g;
  if found then update public.guilds set members = greatest(0, members - 1) where id = g; end if;
end; $$;

-- sửa lời giới thiệu bang (bang chủ)
create or replace function public.guild_edit(p_descr text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.guilds set descr = left(coalesce(p_descr, ''), 120)
  where id = (select guild_id from public.guild_members where user_id = auth.uid() and role = 'leader');
end; $$;

-- góp xu vào quỹ tuần
create or replace function public.guild_donate(p_amount bigint, p_pname text)
returns bigint language plpgsql security definer set search_path = public as $$
declare g bigint; wk text := public.vn_week(); total bigint;
begin
  if p_amount < 1000 or p_amount > 10000000 then raise exception 'Mỗi lần góp từ 1.000 đến 10.000.000 xu'; end if;
  select guild_id into g from public.guild_members where user_id = auth.uid();
  if g is null then raise exception 'Bạn chưa vào bang nào'; end if;
  insert into public.guild_week as w (guild_id, week, points) values (g, wk, p_amount)
    on conflict (guild_id, week) do update set points = w.points + excluded.points
    returning points into total;
  update public.guild_members set
    name = left(coalesce(p_pname, name), 24),
    week_pts = case when week = wk then week_pts + p_amount else p_amount end,
    week = wk,
    total_pts = total_pts + p_amount
  where user_id = auth.uid();
  return total;
end; $$;

-- nhận thưởng mốc quỹ tuần
create or replace function public.guild_claim(p_lvl int)
returns bigint language plpgsql security definer set search_path = public as $$
declare g bigint; wk text := public.vn_week(); pts bigint; need bigint[] := array[1000000, 5000000, 20000000]; prize bigint[] := array[30000, 120000, 400000];
begin
  if p_lvl < 1 or p_lvl > 3 then raise exception 'Mốc không hợp lệ'; end if;
  select guild_id into g from public.guild_members where user_id = auth.uid();
  if g is null then raise exception 'Bạn chưa vào bang nào'; end if;
  select points into pts from public.guild_week where guild_id = g and week = wk;
  if coalesce(pts, 0) < need[p_lvl] then raise exception 'Quỹ bang chưa đạt mốc này'; end if;
  insert into public.guild_claims (week, user_id, lvl, guild_id) values (wk, auth.uid(), p_lvl, g) on conflict do nothing;
  if not found then raise exception 'Tuần này bạn đã nhận mốc này rồi'; end if;
  return prize[p_lvl];
end; $$;

revoke all on function public.guild_create(text, text, text, text) from public, anon;
revoke all on function public.guild_join(bigint, text) from public, anon;
revoke all on function public.guild_leave() from public, anon;
revoke all on function public.guild_kick(uuid) from public, anon;
revoke all on function public.guild_edit(text) from public, anon;
revoke all on function public.guild_donate(bigint, text) from public, anon;
revoke all on function public.guild_claim(int) from public, anon;
grant execute on function public.guild_create(text, text, text, text) to authenticated;
grant execute on function public.guild_join(bigint, text) to authenticated;
grant execute on function public.guild_leave() to authenticated;
grant execute on function public.guild_kick(uuid) to authenticated;
grant execute on function public.guild_edit(text) to authenticated;
grant execute on function public.guild_donate(bigint, text) to authenticated;
grant execute on function public.guild_claim(int) to authenticated;
