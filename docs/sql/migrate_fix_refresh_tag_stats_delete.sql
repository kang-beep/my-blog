-- Fix: Supabase blocks DELETE without WHERE (refresh_tag_stats on post save)
-- Run once in Supabase SQL Editor

create or replace function public.refresh_tag_stats()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate table public.tag_edges;
  truncate table public.tag_stats;

  insert into public.tag_stats (tag, post_count, updated_at)
  select
    t.tag,
    count(*)::int,
    now()
  from public.posts p
  cross join lateral unnest(p.tags) as t(tag)
  where p.status = 'published'
  group by t.tag;

  insert into public.tag_edges (source_tag, target_tag, weight, updated_at)
  select
    least(a.tag, b.tag) as source_tag,
    greatest(a.tag, b.tag) as target_tag,
    count(*)::int as weight,
    now()
  from public.posts p
  cross join lateral unnest(p.tags) as a(tag)
  cross join lateral unnest(p.tags) as b(tag)
  where p.status = 'published'
    and a.tag < b.tag
  group by least(a.tag, b.tag), greatest(a.tag, b.tag);
end;
$$;

grant execute on function public.refresh_tag_stats() to authenticated;
