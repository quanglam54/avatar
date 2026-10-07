-- =====================================================================
-- Avatar Game · Két nhà cái: xu người chơi thua bầu cua chảy về nick chủ game
-- Chạy 1 lần trong Supabase → SQL Editor (sau các file 01–07).
-- Nick nhận tiền = nhân vật đang có tên đúng 'Quang Lâm dz' lúc chạy file này.
-- Đổi chủ: sửa tên trong khối DO bên dưới rồi chạy lại file.
-- =====================================================================

create table if not exists public.house_owner (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.house_owner enable row level security;
-- không có policy nào → người chơi không đọc / sửa được bảng này

do $$
declare n int;
begin
  select count(*) into n from public.saves where data->>'name' = 'Quang Lâm dz';
  if n <> 1 then
    raise exception 'Tìm thấy % nhân vật tên "Quang Lâm dz" — cần đúng 1 nhân vật', n;
  end if;
  delete from public.house_owner;
  insert into public.house_owner (user_id)
    select user_id from public.saves where data->>'name' = 'Quang Lâm dz';
end $$;

create table if not exists public.house_income (
  id bigserial primary key,
  player uuid not null default auth.uid() references auth.users(id) on delete cascade,
  player_name text,
  game text not null default 'baucua',
  amount bigint not null check (amount > 0 and amount <= 1000000000),
  claimed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists house_income_open_idx on public.house_income (claimed) where not claimed;

alter table public.house_income enable row level security;
drop policy if exists "Ghi xu thua" on public.house_income;
create policy "Ghi xu thua" on public.house_income
  for insert to authenticated
  with check (player = auth.uid() and claimed = false);
-- không có quyền đọc / sửa → chỉ chủ game nhận qua hàm claim_house()

/** Chủ game gom xu trong két. Người khác gọi → trả về null. */
create or replace function public.claim_house()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare tot bigint; rws jsonb;
begin
  if not exists (select 1 from public.house_owner where user_id = auth.uid()) then
    return null;
  end if;
  with c as (
    update public.house_income set claimed = true
    where not claimed
    returning player_name, game, amount, created_at
  )
  select coalesce(sum(amount), 0),
         coalesce(jsonb_agg(jsonb_build_object('n', player_name, 'g', game, 'a', amount, 't', created_at)), '[]'::jsonb)
    into tot, rws
  from c;
  return jsonb_build_object('total', tot, 'rows', rws);
end $$;

revoke all on function public.claim_house() from public;
grant execute on function public.claim_house() to authenticated;
