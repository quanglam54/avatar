-- =====================================================================
-- Avatar Game · Hái trộm nông trại bạn + thú giữ nhà
-- Chạy 1 lần trong Supabase → SQL Editor (sau file 02).
-- Kẻ trộm chỉ GHI được "lời báo trộm"; chủ nông trại tự xử lý khi online
-- (mất cây / nhận tiền phạt nếu thú giữ nhà cắn được kẻ trộm).
-- =====================================================================

-- 1) Cho người khác thấy thú giữ nhà khi đi thăm
create or replace function public.get_farm(p_username text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'user_id', user_id,
    'username', username,
    'updated_at', updated_at,
    'name', data->'name',
    'level', data->'level',
    'look', data->'look',
    'tiles', data->'tiles',
    'beds', data->'beds',
    'trees', data->'trees',
    'coop', data->'coop',
    'pen', data->'pen',
    'guard', data->'guard'
  )
  from public.saves
  where username = lower(trim(p_username))
  limit 1;
$$;
revoke all on function public.get_farm(text) from public, anon;
grant execute on function public.get_farm(text) to authenticated;

-- 2) Lời báo trộm: mỗi ô ruộng chỉ bị 1 người trộm 1 lần mỗi ngày
create table if not exists public.farm_steals (
  id bigserial primary key,
  owner uuid not null references auth.users(id) on delete cascade,
  thief uuid not null default auth.uid() references auth.users(id) on delete cascade,
  thief_name text,
  tile int not null,
  crop text,
  qty int not null default 0,
  bitten boolean not null default false,
  coins int not null default 0 check (coins between 0 and 1000),
  day date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (owner, thief, day, tile)
);

alter table public.farm_steals enable row level security;
drop policy if exists "Ghi lời báo trộm" on public.farm_steals;
drop policy if exists "Chủ nông trại xem lời báo trộm" on public.farm_steals;
drop policy if exists "Chủ nông trại đánh dấu đã xử lý trộm" on public.farm_steals;

create policy "Ghi lời báo trộm" on public.farm_steals
  for insert to authenticated
  with check (thief = auth.uid() and owner <> auth.uid());
create policy "Chủ nông trại xem lời báo trộm" on public.farm_steals
  for select to authenticated using (owner = auth.uid());
create policy "Chủ nông trại đánh dấu đã xử lý trộm" on public.farm_steals
  for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());

-- Mỗi kẻ trộm tối đa 3 ô / 1 nông trại / ngày
create or replace function public.limit_farm_steals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.farm_steals where owner = new.owner and thief = new.thief and day = new.day) >= 3 then
    raise exception 'steal_limit';
  end if;
  return new;
end;
$$;
drop trigger if exists farm_steals_limit on public.farm_steals;
create trigger farm_steals_limit before insert on public.farm_steals
  for each row execute function public.limit_farm_steals();
