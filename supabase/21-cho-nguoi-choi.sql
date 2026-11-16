-- =====================================================================
-- Avatar Game · 🛒 Chợ người chơi (ZenoMarket trên điện thoại)
-- Chạy 1 lần trong Supabase → SQL Editor (sau các file 01–20).
-- Người bán đăng món trong túi (món rời túi ngay) · người mua mua đứt cả lô · người bán nhận 95% khi mở chợ.
-- Mọi thao tác ghi đều qua hàm (security definer) để 2 người không mua trùng 1 lô.
-- =====================================================================
create table if not exists public.market (
  id bigint generated always as identity primary key,
  seller uuid not null default auth.uid() references auth.users(id) on delete cascade,
  seller_name text,
  item text not null check (item ~ '^[a-z0-9_]{1,40}$'),
  qty int not null check (qty between 1 and 9999),
  price bigint not null check (price between 1 and 1000000000),
  status text not null default 'open' check (status in ('open', 'sold', 'cancelled')),
  buyer uuid references auth.users(id) on delete set null,
  buyer_name text,
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  sold_at timestamptz
);
create index if not exists market_open on public.market (status, created_at desc);
create index if not exists market_seller on public.market (seller, status);
alter table public.market enable row level security;
drop policy if exists "Xem chợ" on public.market;
create policy "Xem chợ" on public.market for select to authenticated
  using (status = 'open' or seller = auth.uid() or buyer = auth.uid());

-- đăng bán (tối đa 8 lô đang bán / người)
create or replace function public.market_list(p_item text, p_qty int, p_price bigint, p_name text)
returns bigint language plpgsql security definer set search_path = public as $$
declare new_id bigint;
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập'; end if;
  if (select count(*) from public.market where seller = auth.uid() and status = 'open') >= 8 then
    raise exception 'Bạn đang bán 8 lô rồi — huỷ bớt hoặc chờ bán xong';
  end if;
  insert into public.market (seller, seller_name, item, qty, price)
  values (auth.uid(), left(coalesce(p_name, ''), 24), p_item, p_qty, p_price)
  returning id into new_id;
  return new_id;
end; $$;

-- mua cả lô
create or replace function public.market_buy(p_id bigint, p_name text)
returns table (item text, qty int, price bigint) language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập'; end if;
  return query
    update public.market m set status = 'sold', buyer = auth.uid(), buyer_name = left(coalesce(p_name, ''), 24), sold_at = now()
    where m.id = p_id and m.status = 'open' and m.seller <> auth.uid()
    returning m.item, m.qty, m.price;
  if not found then raise exception 'Lô hàng này vừa có người mua hoặc đã bị huỷ'; end if;
end; $$;

-- huỷ lô của mình (trả món về túi)
create or replace function public.market_cancel(p_id bigint)
returns table (item text, qty int) language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập'; end if;
  return query
    update public.market m set status = 'cancelled'
    where m.id = p_id and m.seller = auth.uid() and m.status = 'open'
    returning m.item, m.qty;
  if not found then raise exception 'Lô hàng này đã bán hoặc đã huỷ'; end if;
end; $$;

-- nhận tiền các lô đã bán (mỗi lô chỉ nhận 1 lần)
create or replace function public.market_collect()
returns json language plpgsql security definer set search_path = public as $$
declare total bigint; n int;
begin
  if auth.uid() is null then raise exception 'Cần đăng nhập'; end if;
  with s as (
    update public.market set paid = true
    where seller = auth.uid() and status = 'sold' and not paid
    returning price
  ) select coalesce(sum(price), 0), count(*) into total, n from s;
  return json_build_object('total', total, 'n', n);
end; $$;

revoke all on function public.market_list(text, int, bigint, text) from public, anon;
revoke all on function public.market_buy(bigint, text) from public, anon;
revoke all on function public.market_cancel(bigint) from public, anon;
revoke all on function public.market_collect() from public, anon;
grant execute on function public.market_list(text, int, bigint, text) to authenticated;
grant execute on function public.market_buy(bigint, text) to authenticated;
grant execute on function public.market_cancel(bigint) to authenticated;
grant execute on function public.market_collect() to authenticated;
