-- =====================================================================
-- Avatar Game · 🎰 Vietlott Mega 6/45 (quay mỗi 2 tiếng) · 📶 SIM điện thoại · 🥷 trộm 6 lần/ngày
-- Chạy 1 lần trong Supabase → SQL Editor (SAU file 11-xo-so-va-su-kien.sql).
-- =====================================================================

/* ---------- 🎰 VIETLOTT: vé 6 số (01–45), quay vào mỗi giờ chẵn 0h, 2h, 4h … 22h (giờ Việt Nam) ---------- */
-- kỳ quay = 'YYYY-MM-DD HH' (vd '2026-10-07 14'); vé xổ số kiểu cũ (5 chữ số) coi như đã dò
update public.lottery_tickets set claimed = true where not claimed and day !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}$';
alter table public.lottery_tickets drop constraint if exists lottery_tickets_num_check;
alter table public.lottery_tickets add constraint lottery_tickets_num_check
  check (num ~ '^[0-9]{5}$' or num ~ '^([0-4][0-9] ){5}[0-4][0-9]$');

/** kỳ quay sắp tới (giờ chẵn kế tiếp) */
create or replace function public.lottery_next_key()
returns text language sql stable as $$
  select to_char(date_trunc('hour', now() at time zone 'Asia/Ho_Chi_Minh')
    + make_interval(hours => 2 - (extract(hour from now() at time zone 'Asia/Ho_Chi_Minh')::int % 2)), 'YYYY-MM-DD HH24')
$$;

drop policy if exists "Mua vé trước 18h30" on public.lottery_tickets;
drop policy if exists "Mua vé Vietlott" on public.lottery_tickets;
-- chỉ mua được vé cho kỳ quay sắp tới
create policy "Mua vé Vietlott" on public.lottery_tickets
  for insert to authenticated
  with check (user_id = auth.uid() and day = public.lottery_next_key());

/** Quay kỳ p_day (mặc định: kỳ vừa đến giờ quay gần nhất). 6 số khác nhau từ 01 đến 45, ngẫu nhiên trên máy chủ.
 *  Trả về { day, nums: { mega: ["03","12",…] }, fresh } */
create or replace function public.lottery_draw(p_day text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  vn timestamp := now() at time zone 'Asia/Ho_Chi_Minh';
  cur text := to_char(date_trunc('hour', vn) - make_interval(hours => extract(hour from vn)::int % 2), 'YYYY-MM-DD HH24');
  d text := coalesce(p_day, cur);
  r public.lottery_results;
  n jsonb;
  inserted boolean := false;
begin
  if auth.uid() is null then return null; end if;
  if d !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}$' then return null; end if;
  if (d || ':00')::timestamp > vn then return null; end if;
  select * into r from public.lottery_results where day = d;
  if found then return jsonb_build_object('day', r.day, 'nums', r.nums, 'fresh', false); end if;
  n := jsonb_build_object('mega', (select jsonb_agg(lpad(x::text, 2, '0') order by x) from (select x from generate_series(1, 45) x order by random() limit 6) s));
  insert into public.lottery_results (day, nums) values (d, n) on conflict (day) do nothing returning true into inserted;
  select * into r from public.lottery_results where day = d;
  return jsonb_build_object('day', r.day, 'nums', r.nums, 'fresh', coalesce(inserted, false));
end $$;
revoke all on function public.lottery_draw(text) from public, anon;
grant execute on function public.lottery_draw(text) to authenticated;

/* ---------- 📶 SIM: mỗi tài khoản 1 số, không trùng; ai cũng tra được số → tên (để gọi / nhắn tin) ---------- */
create table if not exists public.phone_sims (
  num text primary key check (num ~ '^0[0-9]{9}$'),
  user_id uuid not null unique default auth.uid() references auth.users(id) on delete cascade,
  name text,
  username text,
  created_at timestamptz not null default now()
);
alter table public.phone_sims enable row level security;
drop policy if exists "Mua sim" on public.phone_sims;
drop policy if exists "Tra số" on public.phone_sims;
drop policy if exists "Bỏ sim của mình" on public.phone_sims;
create policy "Mua sim" on public.phone_sims for insert to authenticated with check (user_id = auth.uid());
create policy "Tra số" on public.phone_sims for select to authenticated using (true);
create policy "Bỏ sim của mình" on public.phone_sims for delete to authenticated using (user_id = auth.uid());

/* ---------- 🥷 trộm: mỗi kẻ trộm tối đa 6 lần / 1 nông trại / ngày (trước là 3) ---------- */
create or replace function public.limit_farm_steals()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.farm_steals where owner = new.owner and thief = new.thief and day = new.day) >= 6 then
    raise exception 'steal_limit';
  end if;
  return new;
end;
$$;
