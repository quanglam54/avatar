-- =====================================================================
-- Avatar Game · Thăm nông trại bạn bè + tưới giúp
-- Chạy 1 lần trong Supabase → SQL Editor (sau khi đã tạo bảng saves).
-- An toàn: người khác chỉ XEM được phần nông trại (không thấy xu, túi đồ),
-- và chỉ gửi được "lời tưới giúp" — không ai sửa được bản lưu của bạn.
-- =====================================================================

-- 1) Xem nông trại của một người chơi theo tên đăng nhập (chỉ trả về phần nông trại)
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
    'pen', data->'pen'
  )
  from public.saves
  where username = lower(trim(p_username))
  limit 1;
$$;

-- 2) Danh sách người chơi gần đây (để chọn bạn đi thăm)
create or replace function public.recent_farms()
returns table (username text, name text, level int, updated_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select s.username, s.data->>'name', coalesce((s.data->>'level')::int, 1), s.updated_at
  from public.saves s
  where s.data->>'name' is not null
  order by s.updated_at desc
  limit 30;
$$;

revoke all on function public.get_farm(text) from public, anon;
revoke all on function public.recent_farms() from public, anon;
grant execute on function public.get_farm(text) to authenticated;
grant execute on function public.recent_farms() to authenticated;

-- 3) Lời tưới giúp: mỗi người chỉ tưới giúp 1 bạn 1 lần mỗi ngày
create table if not exists public.farm_helps (
  id bigserial primary key,
  owner uuid not null references auth.users(id) on delete cascade,
  helper uuid not null default auth.uid() references auth.users(id) on delete cascade,
  helper_name text,
  day date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (owner, helper, day)
);

alter table public.farm_helps enable row level security;

drop policy if exists "Gửi lời tưới giúp" on public.farm_helps;
drop policy if exists "Chủ nông trại xem lời tưới giúp" on public.farm_helps;
drop policy if exists "Chủ nông trại đánh dấu đã nhận" on public.farm_helps;

create policy "Gửi lời tưới giúp" on public.farm_helps
  for insert to authenticated
  with check (helper = auth.uid() and owner <> auth.uid());

create policy "Chủ nông trại xem lời tưới giúp" on public.farm_helps
  for select to authenticated
  using (owner = auth.uid());

create policy "Chủ nông trại đánh dấu đã nhận" on public.farm_helps
  for update to authenticated
  using (owner = auth.uid())
  with check (owner = auth.uid());
