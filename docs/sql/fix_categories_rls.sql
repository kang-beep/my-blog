-- Supabase SQL Editor에서 실행
-- 증상: new row violates row-level security policy for table "categories"

grant insert, update, delete on table public.categories to authenticated;

drop policy if exists "categories_insert_authenticated" on public.categories;
create policy "categories_insert_authenticated"
  on public.categories
  for insert
  to authenticated
  with check (true);

drop policy if exists "categories_update_authenticated" on public.categories;
create policy "categories_update_authenticated"
  on public.categories
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "categories_delete_authenticated" on public.categories;
create policy "categories_delete_authenticated"
  on public.categories
  for delete
  to authenticated
  using (true);
