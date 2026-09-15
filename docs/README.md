# Documentation

## SQL (Supabase 초기 설정)

| 경로 | 설명 |
|------|------|
| [sql/README.md](./sql/README.md) | bootstrap 실행 방법 |
| [sql/bootstrap.sql](./sql/bootstrap.sql) | 테이블·권한·RLS 일괄 SQL |
| [sql/schema.md](./sql/schema.md) | 스키마 상세 |

## Guide (프로젝트 운영 문서)

| 문서 | 내용 |
|------|------|
| [guide/01_project_overview.md](./guide/01_project_overview.md) | 목적, 스택, 아키텍처 |
| [guide/02_frontend.md](./guide/02_frontend.md) | 라우트, 레이아웃, Vercel |
| [guide/03_db.md](./guide/03_db.md) | DB·Storage·RLS 운영 |
| [guide/04_ops.md](./guide/04_ops.md) | 배포, Actions, Edge Functions |
| [guide/05_home_external_feeds.md](./guide/05_home_external_feeds.md) | HF·GitHub Trending 캐시 |
| [guide/06_post_delete_and_giscus.md](./guide/06_post_delete_and_giscus.md) | 글 삭제, Giscus, Edge Function |

## 빠른 시작 (clone 후)

1. Supabase: `docs/sql/bootstrap.sql` 실행 (상세: `docs/sql/README.md`)
2. `cd frontend && npm install`
3. `frontend/.env.local` 작성 → `npm run dev`
