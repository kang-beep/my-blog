# SQL

Supabase 초기 설정용 SQL입니다.

## 파일

| 파일 | 용도 |
|------|------|
| `bootstrap.sql` | 신규 Supabase 프로젝트 **1회 실행** — 테이블·RLS·Storage 정책·시드 |
| `schema.md` | 현재 스키마 상세 (컬럼·관계·운영 참고) |

## 신규 프로젝트 설정 순서

1. Supabase Dashboard → **Storage**에서 버킷 생성 (public)
   - `avatars`
   - `posts-images`
   - `portfolio-images`
2. **SQL Editor**에서 `bootstrap.sql` 전체 실행
3. **Authentication** → Users에서 관리자 계정 생성
4. `.env.local` / Vercel에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 설정

## 포함 범위

- 코어: `categories`, `posts`, `profiles`, `portfolio_projects`
- 좋아요: `post_likes` + `like_count` 트리거
- 태그 네트워크: `tag_stats`, `tag_edges`, `refresh_tag_stats()`
- 홈 외부 피드 캐시: `huggingface_daily_papers`, `github_trending_repos`
- RLS / GRANT (anon·authenticated·service_role)
- Storage 객체 정책 (버킷 3개)

**댓글은 DB에 없음** — [Giscus](https://giscus.app) (GitHub Discussions). Edge Function 배포는 `docs/guide/06_post_delete_and_giscus.md` 참고.

## 스키마 변경 시

1. Supabase에 직접 반영
2. `schema.md` 업데이트
3. `bootstrap.sql`도 최종 상태에 맞게 수정 (신규 clone용)
