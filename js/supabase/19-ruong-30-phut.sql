-- =====================================================================
-- Avatar Game · 🏴‍☠️ Săn rương: cứ 30 phút (giờ Việt Nam) chôn thêm 3 rương → 48 đợt × 3 = 144 rương / ngày (slot 0..143).
-- Đợt 0h00 có slot 0–2, đợt 0h30 có slot 3–5, … đợt 23h30 có slot 141–143.
-- Máy chủ chỉ cho nhận rương của đợt đã tới giờ (không đào trước rương của đợt sau được).
-- Chạy 1 lần trong Supabase → SQL Editor (thay cho file 18-ruong-theo-dot.sql).
-- =====================================================================

alter table public.treasure_claims drop constraint if exists treasure_claims_slot_check;
alter table public.treasure_claims add constraint treasure_claims_slot_check check (slot between 0 and 143);

drop policy if exists "Đào rương hôm nay" on public.treasure_claims;
create policy "Đào rương hôm nay" on public.treasure_claims
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and day = to_char((now() at time zone 'Asia/Ho_Chi_Minh')::date, 'YYYY-MM-DD')
    and slot < (
      (extract(hour from (now() at time zone 'Asia/Ho_Chi_Minh'))::int * 60
       + extract(minute from (now() at time zone 'Asia/Ho_Chi_Minh'))::int) / 30 + 1
    ) * 3
  );
