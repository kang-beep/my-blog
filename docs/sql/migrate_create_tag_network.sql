-- Supabase SQL Editor에서 실행
-- 태그 네트워크 집계 테이블 생성 + RLS + 초기 집계

-- ─── tables ──────────────────────────────────────────────

create table if not exists public.tag_stats (
  tag text primary key,
  post_count int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.tag_edges (
  source_tag text not null,
  target_tag text not null,
  weight int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (source_tag, target_tag),
  check (source_tag < target_tag)
);

create index if not exists idx_tag_stats_count
  on public.tag_stats (post_count desc);

create index if not exists idx_tag_edges_weight
  on public.tag_edges (weight desc);

-- ─── grants ──────────────────────────────────────────────

grant select on table public.tag_stats to anon, authenticated;
grant select on table public.tag_edges to anon, authenticated;
grant insert, update, delete on table public.tag_stats to authenticated;
grant insert, update, delete on table public.tag_edges to authenticated;

-- ─── RLS ─────────────────────────────────────────────────

alter table public.tag_stats enable row level security;
alter table public.tag_edges enable row level security;

drop policy if exists "tag_stats_select_public" on public.tag_stats;
create policy "tag_stats_select_public"
  on public.tag_stats for select to anon, authenticated using (true);

drop policy if exists "tag_stats_write_authenticated" on public.tag_stats;
create policy "tag_stats_write_authenticated"
  on public.tag_stats for all to authenticated using (true) with check (true);

drop policy if exists "tag_edges_select_public" on public.tag_edges;
create policy "tag_edges_select_public"
  on public.tag_edges for select to anon, authenticated using (true);

drop policy if exists "tag_edges_write_authenticated" on public.tag_edges;
create policy "tag_edges_write_authenticated"
  on public.tag_edges for all to authenticated using (true) with check (true);

-- ─── refresh (posts.tags → 집계 테이블) ──────────────────

create or replace function public.refresh_tag_stats()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.tag_edges;
  delete from public.tag_stats;

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

-- 기존 published 글 기준 1회 집계
select public.refresh_tag_stats();
