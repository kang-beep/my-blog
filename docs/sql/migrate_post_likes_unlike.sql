-- 이미 migrate_post_likes.sql 을 실행한 경우에만 실행 (좋아요 취소 지원)

grant delete on table public.post_likes to anon, authenticated;

drop policy if exists "post_likes_delete_public" on public.post_likes;
create policy "post_likes_delete_public"
  on public.post_likes for delete to anon, authenticated using (true);

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
