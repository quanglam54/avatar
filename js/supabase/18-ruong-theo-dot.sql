-- =====================================================================
-- Avatar Game · 🏴‍☠️ Săn rương theo đợt: cứ 3 tiếng (giờ Việt Nam) chôn thêm 3 rương → 24 rương / ngày (slot 0..23).
-- Đợt 0h có slot 0–2, đợt 3h có slot 3–5, … đợt 21h có slot 21–23.
-- Máy chủ chỉ cho nhận rương của đợt đã tới giờ (không đào trước rương của đợt sau được).
-- Chạy 1 lần trong Supabase → SQL Editor (sau file 10-san-kho-bau.sql).
-- =====================================================================

alter table public.treasure_claims drop constraint if exists treasure_claims_slot_check;
alter table public.treasure_claims add constraint treasure_claims_slot_check check (slot between 0 and 23);

drop policy if exists "Đào rương hôm nay" on public.treasure_claims;
create policy "Đào rương hôm nay" on public.treasure_claims
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and day = to_char((now() at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM-DD')
    and slot < (extract(hour from (now() at time zone 'Asia/Ho_Chi_Minh'))::int / 3 + 1) * 3
  );
