-- =====================================================================
-- Avatar Game · QuangLamBank: chuyển khoản theo số tài khoản (STK)
-- Chạy 1 lần trong Supabase → SQL Editor (sau các file 01–08).
-- Người chơi chỉ tra được TÊN chủ tài khoản qua hàm bank_lookup, không xem được danh sách.
-- =====================================================================

create table if not exists public.bank_accounts (
  acct text primary key check (acct ~ '^[0-9]{6,12}$'),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text,
  updated_at timestamptz not null default now()
);
alter table public.bank_accounts enable row level security;
-- không có policy → chỉ truy cập qua các hàm bên dưới

create table if not exists public.bank_transfers (
  id bigserial primary key,
  from_user uuid not null references auth.users(id) on delete cascade,
  from_acct text,
  from_name text,
  to_user uuid not null references auth.users(id) on delete cascade,
  to_acct text not null,
  to_name text,
  amount bigint not null check (amount > 0 and amount <= 1000000000000),
  note text check (length(note) <= 80),
  claimed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists bank_transfers_to_open on public.bank_transfers (to_user) where not claimed;
alter table public.bank_transfers enable row level security;
drop policy if exists "Xem giao dịch của mình" on public.bank_transfers;
create policy "Xem giao dịch của mình" on public.bank_transfers
  for select to authenticated using (from_user = auth.uid() or to_user = auth.uid());

/** Gắn số tài khoản với nhân vật đang đăng nhập. Trả về 'ok' hoặc 'taken' (STK đã thuộc người khác). */
create or replace function public.bank_register(p_acct text, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if auth.uid() is null then return 'auth'; end if;
  select user_id into owner from public.bank_accounts where acct = p_acct;
  if owner is not null and owner <> auth.uid() then return 'taken'; end if;
  delete from public.bank_accounts where user_id = auth.uid() and acct <> p_acct;
  insert into public.bank_accounts (acct, user_id, name, updated_at) values (p_acct, auth.uid(), left(p_name, 24), now())
    on conflict (acct) do update set name = excluded.name, updated_at = now();
  return 'ok';
end $$;

/** Tra tên chủ tài khoản theo STK (null nếu không có) */
create or replace function public.bank_lookup(p_acct text)
returns text language sql security definer set search_path = public as $$
  select name from public.bank_accounts where acct = p_acct;
$$;

/** Chuyển khoản: trả về { id, to_name, at } hoặc { error } */
create or replace function public.bank_send(p_to text, p_amount bigint, p_note text, p_from_acct text, p_from_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare rec public.bank_accounts; tid bigint; tat timestamptz;
begin
  if auth.uid() is null then return jsonb_build_object('error', 'auth'); end if;
  if p_amount is null or p_amount <= 0 then return jsonb_build_object('error', 'amount'); end if;
  select * into rec from public.bank_accounts where acct = p_to;
  if rec.acct is null then return jsonb_build_object('error', 'not_found'); end if;
  if rec.user_id = auth.uid() then return jsonb_build_object('error', 'self'); end if;
  if (select count(*) from public.bank_transfers where from_user = auth.uid() and created_at > now() - interval '1 minute') >= 10 then
    return jsonb_build_object('error', 'rate');
  end if;
  insert into public.bank_transfers (from_user, from_acct, from_name, to_user, to_acct, to_name, amount, note)
    values (auth.uid(), p_from_acct, left(p_from_name, 24), rec.user_id, rec.acct, rec.name, p_amount, left(coalesce(p_note, ''), 80))
    returning id, created_at into tid, tat;
  return jsonb_build_object('id', tid, 'to_name', rec.name, 'at', tat);
end $$;

/** Người nhận gom tiền chuyển đến (đánh dấu đã nhận) */
create or replace function public.bank_claim()
returns jsonb language plpgsql security definer set search_path = public as $$
declare rws jsonb;
begin
  if auth.uid() is null then return '[]'::jsonb; end if;
  with c as (
    update public.bank_transfers set claimed = true
    where to_user = auth.uid() and not claimed
    returning id, from_name, from_acct, amount, note, created_at
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'n', from_name, 'a', from_acct, 'amt', amount, 'note', note, 't', created_at)), '[]'::jsonb) into rws from c;
  return rws;
end $$;

revoke all on function public.bank_register(text, text) from public;
revoke all on function public.bank_lookup(text) from public;
revoke all on function public.bank_send(text, bigint, text, text, text) from public;
revoke all on function public.bank_claim() from public;
grant execute on function public.bank_register(text, text) to authenticated;
grant execute on function public.bank_lookup(text) to authenticated;
grant execute on function public.bank_send(text, bigint, text, text, text) to authenticated;
grant execute on function public.bank_claim() to authenticated;
