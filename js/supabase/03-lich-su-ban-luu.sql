-- =====================================================================
-- Avatar Game · Lịch sử bản lưu (chống mất đồ)
-- Mỗi lần bản lưu thay đổi, bản cũ được giữ lại (30 bản gần nhất / người).
-- Trong game: MENU → Cài đặt → "Khôi phục bản lưu" để quay lại bản cũ.
-- Chạy 1 lần trong Supabase → SQL Editor.
-- =====================================================================
create table if not exists public.saves_history (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  saved_at timestamptz not null default now()
);
create index if not exists saves_history_user_idx on public.saves_history (user_id, saved_at desc);

alter table public.saves_history enable row level security;
drop policy if exists "Xem lịch sử bản lưu của mình" on public.saves_history;
create policy "Xem lịch sử bản lưu của mình" on public.saves_history
  for select to authenticated using (user_id = auth.uid());

-- Trước khi ghi đè bản lưu: cất bản cũ vào lịch sử (tối đa 1 bản / 2 phút để không quá nhiều)
create or replace function public.keep_save_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.data is distinct from new.data and not exists (
    select 1 from public.saves_history h
    where h.user_id = old.user_id and h.saved_at > now() - interval '2 minutes'
  ) then
    insert into public.saves_history (user_id, data, saved_at) values (old.user_id, old.data, old.updated_at);
    delete from public.saves_history
    where user_id = old.user_id
      and id not in (select id from public.saves_history where user_id = old.user_id order by saved_at desc limit 30);
  end if;
  return new;
end;
$$;

drop trigger if exists saves_keep_history on public.saves;
create trigger saves_keep_history
  before update on public.saves
  for each row execute function public.keep_save_history();
