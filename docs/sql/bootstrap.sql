-- my-blog — Supabase initial setup
-- Run once in Supabase SQL Editor on a fresh project.
-- Schema reference: docs/sql/schema.md

-- ─── Core tables ─────────────────────────────────────────

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_sort on public.categories (sort_order);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  excerpt text,
  status text not null default 'published',
  published_at timestamptz,
  content text not null,
  category text not null,
  category_id uuid references public.categories (id),
  tags text[] not null default '{}',
  image_url text,
  like_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_posts_slug_unique
  on public.posts (slug)
  where slug is not null;

create index if not exists idx_posts_created_at
  on public.posts (created_at desc);

create index if not exists idx_posts_category
  on public.posts (category);

create index if not exists idx_posts_tags_gin
  on public.posts using gin (tags);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  headline text,
  bio text,
  avatar_url text,
  github_url text,
  email text,
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text,
  content text,
  tech_stack text[] not null default '{}',
  repo_url text,
  demo_url text,
  image_url text,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_portfolio_sort
  on public.portfolio_projects (sort_order desc);

-- ─── Post likes ──────────────────────────────────────────

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  visitor_key text not null,
  created_at timestamptz not null default now(),
  unique (post_id, visitor_key)
);

create index if not exists idx_post_likes_post_id
  on public.post_likes (post_id);

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

-- ─── Tag network (aggregated) ────────────────────────────

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

-- ─── Home external feed cache ────────────────────────────

create table if not exists public.huggingface_daily_papers (
  id uuid primary key default gen_random_uuid(),
  paper_id text not null,
  title text not null,
  summary text,
  ai_summary text,
  ai_keywords text[],
  authors text[],
  upvotes int default 0,
  github_repo text,
  published_at timestamptz,
  fetched_date date not null default current_date,
  created_at timestamptz default now()
);

create index if not exists idx_hf_papers_fetched_date
  on public.huggingface_daily_papers (fetched_date desc);

create unique index if not exists idx_hf_papers_paper_id_fetched_date
  on public.huggingface_daily_papers (paper_id, fetched_date);

create table if not exists public.github_trending_repos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  period text not null check (period in ('daily', 'weekly', 'monthly')),
  fetched_date date not null default current_date,
  created_at timestamptz default now()
);

create index if not exists idx_gh_trending_fetched_date
  on public.github_trending_repos (fetched_date desc);

create index if not exists idx_gh_trending_period
  on public.github_trending_repos (period);

create unique index if not exists idx_gh_trending_url_period_fetched_date
  on public.github_trending_repos (url, period, fetched_date);

-- ─── GRANT ───────────────────────────────────────────────

grant usage on schema public to anon, authenticated, service_role;

grant select on table public.categories to anon, authenticated;
grant insert, update, delete on table public.categories to authenticated;

grant select on table public.posts to anon, authenticated, service_role;
grant insert, update, delete on table public.posts to authenticated, service_role;

grant select on table public.profiles to anon, authenticated;
grant insert, update, delete on table public.profiles to authenticated;

grant select on table public.portfolio_projects to anon, authenticated;
grant insert, update, delete on table public.portfolio_projects to authenticated;

grant select, insert, delete on table public.post_likes to anon, authenticated;

grant select on table public.tag_stats to anon, authenticated;
grant select on table public.tag_edges to anon, authenticated;
grant insert, update, delete on table public.tag_stats to authenticated;
grant insert, update, delete on table public.tag_edges to authenticated;

grant execute on function public.refresh_tag_stats() to authenticated;

grant select on table public.huggingface_daily_papers to anon, authenticated;
grant select on table public.github_trending_repos to anon, authenticated;
grant all on table public.huggingface_daily_papers to service_role;
grant all on table public.github_trending_repos to service_role;

-- ─── RLS ─────────────────────────────────────────────────

alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.profiles enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.post_likes enable row level security;
alter table public.tag_stats enable row level security;
alter table public.tag_edges enable row level security;
alter table public.huggingface_daily_papers enable row level security;
alter table public.github_trending_repos enable row level security;

-- categories
drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public"
  on public.categories for select to anon, authenticated
  using (is_visible = true);

drop policy if exists "categories_insert_authenticated" on public.categories;
create policy "categories_insert_authenticated"
  on public.categories for insert to authenticated with check (true);

drop policy if exists "categories_update_authenticated" on public.categories;
create policy "categories_update_authenticated"
  on public.categories for update to authenticated
  using (true) with check (true);

drop policy if exists "categories_delete_authenticated" on public.categories;
create policy "categories_delete_authenticated"
  on public.categories for delete to authenticated using (true);

-- posts
drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
  on public.posts for select to anon, authenticated using (true);

drop policy if exists "posts_insert_authenticated" on public.posts;
create policy "posts_insert_authenticated"
  on public.posts for insert to authenticated with check (true);

drop policy if exists "posts_update_authenticated" on public.posts;
create policy "posts_update_authenticated"
  on public.posts for update to authenticated
  using (true) with check (true);

drop policy if exists "posts_delete_authenticated" on public.posts;
create policy "posts_delete_authenticated"
  on public.posts for delete to authenticated using (true);

-- profiles
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select to anon, authenticated using (true);

drop policy if exists "profiles_insert_authenticated" on public.profiles;
create policy "profiles_insert_authenticated"
  on public.profiles for insert to authenticated with check (true);

drop policy if exists "profiles_update_authenticated" on public.profiles;
create policy "profiles_update_authenticated"
  on public.profiles for update to authenticated
  using (true) with check (true);

drop policy if exists "profiles_delete_authenticated" on public.profiles;
create policy "profiles_delete_authenticated"
  on public.profiles for delete to authenticated using (true);

-- portfolio_projects
drop policy if exists "portfolio_select_public" on public.portfolio_projects;
create policy "portfolio_select_public"
  on public.portfolio_projects for select to anon, authenticated using (true);

drop policy if exists "portfolio_insert_authenticated" on public.portfolio_projects;
create policy "portfolio_insert_authenticated"
  on public.portfolio_projects for insert to authenticated with check (true);

drop policy if exists "portfolio_update_authenticated" on public.portfolio_projects;
create policy "portfolio_update_authenticated"
  on public.portfolio_projects for update to authenticated
  using (true) with check (true);

drop policy if exists "portfolio_delete_authenticated" on public.portfolio_projects;
create policy "portfolio_delete_authenticated"
  on public.portfolio_projects for delete to authenticated using (true);

-- post_likes
drop policy if exists "post_likes_select_public" on public.post_likes;
create policy "post_likes_select_public"
  on public.post_likes for select to anon, authenticated using (true);

drop policy if exists "post_likes_insert_public" on public.post_likes;
create policy "post_likes_insert_public"
  on public.post_likes for insert to anon, authenticated with check (true);

drop policy if exists "post_likes_delete_public" on public.post_likes;
create policy "post_likes_delete_public"
  on public.post_likes for delete to anon, authenticated using (true);

-- tag_stats / tag_edges
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

-- external feeds (read-only for clients)
drop policy if exists "hf_papers_select_public" on public.huggingface_daily_papers;
create policy "hf_papers_select_public"
  on public.huggingface_daily_papers for select using (true);

drop policy if exists "gh_trending_select_public" on public.github_trending_repos;
create policy "gh_trending_select_public"
  on public.github_trending_repos for select using (true);

-- ─── Storage (create buckets in Dashboard first) ───────
-- Buckets: avatars, posts-images, portfolio-images

drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
  on storage.objects for select to public
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_authenticated" on storage.objects;
create policy "avatars_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_update_authenticated" on storage.objects;
create policy "avatars_update_authenticated"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars') with check (bucket_id = 'avatars');

drop policy if exists "avatars_delete_authenticated" on storage.objects;
create policy "avatars_delete_authenticated"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "posts_images_select_public" on storage.objects;
create policy "posts_images_select_public"
  on storage.objects for select to public
  using (bucket_id = 'posts-images');

drop policy if exists "posts_images_insert_authenticated" on storage.objects;
create policy "posts_images_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'posts-images');

drop policy if exists "posts_images_update_authenticated" on storage.objects;
create policy "posts_images_update_authenticated"
  on storage.objects for update to authenticated
  using (bucket_id = 'posts-images') with check (bucket_id = 'posts-images');

drop policy if exists "posts_images_delete_authenticated" on storage.objects;
create policy "posts_images_delete_authenticated"
  on storage.objects for delete to authenticated
  using (bucket_id = 'posts-images');

drop policy if exists "portfolio_images_select_public" on storage.objects;
create policy "portfolio_images_select_public"
  on storage.objects for select to public
  using (bucket_id = 'portfolio-images');

drop policy if exists "portfolio_images_insert_authenticated" on storage.objects;
create policy "portfolio_images_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'portfolio-images');

drop policy if exists "portfolio_images_update_authenticated" on storage.objects;
create policy "portfolio_images_update_authenticated"
  on storage.objects for update to authenticated
  using (bucket_id = 'portfolio-images') with check (bucket_id = 'portfolio-images');

drop policy if exists "portfolio_images_delete_authenticated" on storage.objects;
create policy "portfolio_images_delete_authenticated"
  on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio-images');

-- ─── Seed: default category ──────────────────────────────

insert into public.categories (name, slug, sort_order, is_visible)
select '기타', '기타', 9999, true
where not exists (
  select 1 from public.categories where name = '기타'
);
