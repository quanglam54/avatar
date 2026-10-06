-- =====================================================================
-- Avatar Game · Bạn bè, tin nhắn riêng, tặng quà
-- Chạy 1 lần trong Supabase → SQL Editor (sau các file 01–04).
-- Mỗi "thư" là 1 dòng: lời mời kết bạn, đồng ý kết bạn, tin nhắn, quà tặng.
-- Người nhận đọc được khi online (kể cả khi lúc gửi họ đang offline).
-- =====================================================================

create table if not exists public.messages (
  id bigserial primary key,
  to_user uuid not null references auth.users(id) on delete cascade,
  from_user uuid not null default auth.uid() references auth.users(id) on delete cascade,
  from_name text,
  from_username text,
  kind text not null check (kind in ('friend_req', 'friend_ok', 'chat', 'gift')),
  body jsonb not null default '{}'::jsonb check (length(body::text) < 2000),
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_to_unread on public.messages (to_user, read);
create index if not exists messages_from on public.messages (from_user, created_at);

alter table public.messages enable row level security;
drop policy if exists "Gửi thư" on public.messages;
drop policy if exists "Xem thư của mình" on public.messages;
drop policy if exists "Đánh dấu đã đọc" on public.messages;
drop policy if exists "Xoá thư của mình" on public.messages;

create policy "Gửi thư" on public.messages
  for insert to authenticated
  with check (from_user = auth.uid() and to_user <> auth.uid());
create policy "Xem thư của mình" on public.messages
  for select to authenticated using (to_user = auth.uid() or from_user = auth.uid());
create policy "Đánh dấu đã đọc" on public.messages
  for update to authenticated using (to_user = auth.uid()) with check (to_user = auth.uid());
create policy "Xoá thư của mình" on public.messages
  for delete to authenticated using (to_user = auth.uid() or from_user = auth.uid());

-- Chống spam: mỗi người tối đa 30 thư / phút
create or replace function public.limit_messages()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.messages where from_user = new.from_user and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'msg_rate_limit';
  end if;
  return new;
end;
$$;
drop trigger if exists messages_limit on public.messages;
create trigger messages_limit before insert on public.messages
  for each row execute function public.limit_messages();
