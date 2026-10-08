-- Mua con giống: người mới chuồng trống, phải mua gà / bò / cừu / heo.
-- Thêm 'animals' vào dữ liệu thăm nông trại để khách thấy đúng chuồng nào có con, chuồng nào trống.
-- (Chưa chạy file này thì khách vẫn thấy đủ con như cũ — không lỗi gì.)
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
    'animals', data->'animals',
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
