-- Supabase SQL Editor에서 실행
-- post_likes 테이블 + like_count 자동 증가 트리거 + RLS

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  visitor_key text not null,
  created_at timestamptz not null default now(),
  unique (post_id, visitor_key)
);

create index if not exists idx_post_likes_post_id on public.post_likes (post_id);

grant select, insert, delete on table public.post_likes to anon, authenticated;

alter table public.post_likes enable row level security;

drop policy if exists "post_likes_select_public" on public.post_likes;
create policy "post_likes_select_public"
  on public.post_likes for select to anon, authenticated using (true);

drop policy if exists "post_likes_insert_public" on public.post_likes;
create policy "post_likes_insert_public"
  on public.post_likes for insert to anon, authenticated with check (true);

drop policy if exists "post_likes_delete_public" on public.post_likes;
create policy "post_likes_delete_public"
  on public.post_likes for delete to anon, authenticated using (true);

create or replace function public.handle_post_like_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set like_count = like_count + 1
  where id = new.post_id;
  return new;
end;
$$;

drop trigger if exists on_post_like_insert on public.post_likes;
create trigger on_post_like_insert
  after insert on public.post_likes
  for each row
  execute function public.handle_post_like_insert();

create or replace function public.handle_post_like_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
  set like_count = greatest(like_count - 1, 0)
  where id = old.post_id;
  return old;
end;
$$;

drop trigger if exists on_post_like_delete on public.post_likes;
create trigger on_post_like_delete
  after delete on public.post_likes
  for each row
  execute function public.handle_post_like_delete();
