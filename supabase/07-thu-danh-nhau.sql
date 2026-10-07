-- =====================================================================
-- Avatar Game · Thú giữ nhà đánh nhau khi đi trộm
-- Chạy 1 lần trong Supabase → SQL Editor (sau file 04).
-- =====================================================================

-- kết quả đánh nhau gửi kèm lời báo trộm: "w|l:<thú chủ nhà>:<loại thú kẻ trộm>"
alter table public.farm_steals add column if not exists fight text;

-- cho người đi thăm biết thú nào nhà bạn đang bị thương (không canh nhà)
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
    'guard', data->'guard',
    'guardHurt', data->'guardHurt'
  )
  from public.saves
  where username = lower(trim(p_username))
  limit 1;
$$;
revoke all on function public.get_farm(text) from public, anon;
grant execute on function public.get_farm(text) to authenticated;
