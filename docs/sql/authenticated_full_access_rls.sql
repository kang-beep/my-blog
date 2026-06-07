-- Supabase SQL Editor에서 한 번 실행
-- 목적: 로그인(authenticated) 사용자에게 관리 기능 전체 허용
-- 전제: 회원가입을 막고 관리자 계정만 사용 (실무상 본인만 로그인)

-- ─── GRANT ───────────────────────────────────────────────
grant usage on schema public to anon, authenticated, service_role;

grant select on table public.posts to anon, authenticated, service_role;
grant insert, update, delete on table public.posts to authenticated, service_role;

grant select, insert on table public.comments to anon, authenticated;
grant delete on table public.comments to authenticated, service_role;

grant select on table public.categories to anon, authenticated;
grant insert, update, delete on table public.categories to authenticated;

grant select on table public.profiles to anon, authenticated;
grant insert, update, delete on table public.profiles to authenticated;

grant select on table public.portfolio_projects to anon, authenticated;
grant insert, update, delete on table public.portfolio_projects to authenticated;

-- ─── RLS 활성화 ───────────────────────────────────────────
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.portfolio_projects enable row level security;

-- ─── posts ───────────────────────────────────────────────
drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
  on public.posts for select to anon, authenticated using (true);

drop policy if exists "posts_insert_authenticated" on public.posts;
create policy "posts_insert_authenticated"
  on public.posts for insert to authenticated with check (true);

drop policy if exists "posts_update_authenticated" on public.posts;
create policy "posts_update_authenticated"
  on public.posts for update to authenticated using (true) with check (true);

drop policy if exists "posts_delete_authenticated" on public.posts;
create policy "posts_delete_authenticated"
  on public.posts for delete to authenticated using (true);

-- ─── comments ────────────────────────────────────────────
drop policy if exists "comments_select_public" on public.comments;
create policy "comments_select_public"
  on public.comments for select to anon, authenticated using (true);

drop policy if exists "comments_insert_public" on public.comments;
create policy "comments_insert_public"
  on public.comments for insert to anon, authenticated with check (true);

drop policy if exists "comments_delete_authenticated" on public.comments;
create policy "comments_delete_authenticated"
  on public.comments for delete to authenticated using (true);

-- ─── categories ──────────────────────────────────────────
drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public"
  on public.categories for select to anon, authenticated using (is_visible = true);

drop policy if exists "categories_insert_authenticated" on public.categories;
create policy "categories_insert_authenticated"
  on public.categories for insert to authenticated with check (true);

drop policy if exists "categories_update_authenticated" on public.categories;
create policy "categories_update_authenticated"
  on public.categories for update to authenticated using (true) with check (true);

drop policy if exists "categories_delete_authenticated" on public.categories;
create policy "categories_delete_authenticated"
  on public.categories for delete to authenticated using (true);

-- ─── profiles ────────────────────────────────────────────
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select to anon, authenticated using (true);

drop policy if exists "profiles_insert_authenticated" on public.profiles;
create policy "profiles_insert_authenticated"
  on public.profiles for insert to authenticated with check (true);

drop policy if exists "profiles_update_authenticated" on public.profiles;
create policy "profiles_update_authenticated"
  on public.profiles for update to authenticated using (true) with check (true);

drop policy if exists "profiles_delete_authenticated" on public.profiles;
create policy "profiles_delete_authenticated"
  on public.profiles for delete to authenticated using (true);

-- ─── portfolio_projects ──────────────────────────────────
drop policy if exists "portfolio_select_public" on public.portfolio_projects;
create policy "portfolio_select_public"
  on public.portfolio_projects for select to anon, authenticated using (true);

drop policy if exists "portfolio_insert_authenticated" on public.portfolio_projects;
create policy "portfolio_insert_authenticated"
  on public.portfolio_projects for insert to authenticated with check (true);

drop policy if exists "portfolio_update_authenticated" on public.portfolio_projects;
create policy "portfolio_update_authenticated"
  on public.portfolio_projects for update to authenticated using (true) with check (true);

drop policy if exists "portfolio_delete_authenticated" on public.portfolio_projects;
create policy "portfolio_delete_authenticated"
  on public.portfolio_projects for delete to authenticated using (true);

-- ─── Storage (avatars, posts-images, portfolio-images) ───
-- 버킷 이름은 Supabase Dashboard와 일치해야 함

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
