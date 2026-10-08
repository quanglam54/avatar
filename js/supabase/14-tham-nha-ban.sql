-- =====================================================================
-- Avatar Game · 🏠 Thăm nông trại thấy luôn nhà mới của bạn (số tầng nhà)
-- Chạy 1 lần trong Supabase → SQL Editor (sau các file 01–13).
-- Chỉ thêm trường 'house' (số tầng) vào dữ liệu nông trại khi đi thăm — vẫn không lộ xu, túi đồ.
-- =====================================================================
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
    'guardHurt', data->'guardHurt',
    'house', data->'house'
  )
  from public.saves
  where username = lower(trim(p_username))
  limit 1;
$$;
revoke all on function public.get_farm(text) from public, anon;
grant execute on function public.get_farm(text) to authenticated;
