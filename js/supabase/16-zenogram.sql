-- =====================================================================
-- Avatar Game · 📸 ZenoGram — mạng xã hội trong điện thoại (bảng tin chung cả server)
-- Chạy 1 lần trong Supabase → SQL Editor (sau các file 01–15). Ảnh dùng kho chat-images (file 12).
-- =====================================================================
create table if not exists public.zeno_posts (
  id bigserial primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  text text check (length(text) <= 200),
  img text check (length(img) <= 300),
  created_at timestamptz not null default now()
);
create table if not exists public.zeno_likes (
  post_id bigint not null references public.zeno_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (post_id, user_id)
);
create table if not exists public.zeno_comments (
  id bigserial primary key,
  post_id bigint not null references public.zeno_posts(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text,
  text text not null check (length(text) between 1 and 120),
  created_at timestamptz not null default now()
);
create index if not exists zeno_likes_post on public.zeno_likes (post_id);
create index if not exists zeno_comments_post on public.zeno_comments (post_id);

alter table public.zeno_posts enable row level security;
alter table public.zeno_likes enable row level security;
alter table public.zeno_comments enable row level security;
drop policy if exists "Xem bài" on public.zeno_posts;
drop policy if exists "Đăng bài" on public.zeno_posts;
drop policy if exists "Xoá bài của mình" on public.zeno_posts;
drop policy if exists "Xem tim" on public.zeno_likes;
drop policy if exists "Thả tim" on public.zeno_likes;
drop policy if exists "Bỏ tim" on public.zeno_likes;
drop policy if exists "Xem bình luận" on public.zeno_comments;
drop policy if exists "Bình luận" on public.zeno_comments;
drop policy if exists "Xoá bình luận của mình" on public.zeno_comments;
create policy "Xem bài" on public.zeno_posts for select to authenticated using (true);
create policy "Đăng bài" on public.zeno_posts for insert to authenticated with check (user_id = auth.uid());
create policy "Xoá bài của mình" on public.zeno_posts for delete to authenticated using (user_id = auth.uid());
create policy "Xem tim" on public.zeno_likes for select to authenticated using (true);
create policy "Thả tim" on public.zeno_likes for insert to authenticated with check (user_id = auth.uid());
create policy "Bỏ tim" on public.zeno_likes for delete to authenticated using (user_id = auth.uid());
create policy "Xem bình luận" on public.zeno_comments for select to authenticated using (true);
create policy "Bình luận" on public.zeno_comments for insert to authenticated with check (user_id = auth.uid());
create policy "Xoá bình luận của mình" on public.zeno_comments for delete to authenticated using (user_id = auth.uid());

-- chống spam: mỗi người tối đa 10 bài / giờ
create or replace function public.limit_zeno_posts() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.zeno_posts where user_id = new.user_id and created_at > now() - interval '1 hour') >= 10 then
    raise exception 'Đăng nhiều quá, nghỉ chút rồi đăng tiếp nhé';
  end if;
  return new;
end $$;
drop trigger if exists zeno_posts_limit on public.zeno_posts;
create trigger zeno_posts_limit before insert on public.zeno_posts for each row execute function public.limit_zeno_posts();
