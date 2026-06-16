-- 기본 카테고리 「기타」 보장 + category 없는 글 백필 + NOT NULL 유지
-- Supabase SQL Editor에서 1회 실행

insert into public.categories (name, slug, sort_order, is_visible)
select '기타', '기타', 9999, true
where not exists (
  select 1 from public.categories where name = '기타'
);

update public.posts p
set
  category_id = c.id,
  category = c.name
from public.categories c
where c.name = '기타'
  and (p.category is null or p.category_id is null);

alter table public.posts
  alter column category set not null;
