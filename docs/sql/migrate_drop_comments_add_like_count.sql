-- Supabase SQL Editor에서 실행
-- 1) comments 테이블 제거 (Giscus로 대체)
-- 2) posts.like_count 추가

-- ─── comments 제거 ───────────────────────────────────────

drop policy if exists "comments_select_public" on public.comments;
drop policy if exists "comments_insert_public" on public.comments;
drop policy if exists "comments_delete_authenticated" on public.comments;

revoke all on table public.comments from anon, authenticated, service_role;

drop table if exists public.comments cascade;

-- ─── posts.like_count 추가 ───────────────────────────────

alter table public.posts
  add column if not exists like_count int not null default 0;

-- 기존 행이 이미 있을 때 default 0 적용 확인 (add column 시 자동)
