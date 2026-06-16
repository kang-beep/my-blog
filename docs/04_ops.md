# 04. Ops

## 파이프라인

```
로컬 dev
  → git push (main)
    → GitHub
      → Vercel: install / build / `dist` 배포
        ↔ Supabase (REST, Auth, Storage, Edge Functions)
      → GitHub Discussions (Giscus 댓글)
  → GitHub Actions (schedule)
      → Supabase REST ping (일시정지 방지)
      → HF Daily Papers / GitHub Trending 동기화 → Supabase
```

## Vercel

- 트리거: `main` (또는 설정한 Production Branch)에 push
- 설정 값: `docs/02_frontend.md` 표 참고
- 환경변수 변경 후 **Redeploy** 필요

## Supabase Edge Functions

| 함수 | 배포 슬러그 | 용도 |
|------|-------------|------|
| Giscus discussion 삭제 | **`dynamic-handler`** | 글 삭제 시 GitHub Discussion 제거 |

소스: `supabase/functions/delete-giscus-discussion/index.ts`  
배포·Secret·JWT: **`docs/06_post_delete_and_giscus.md`**

```bash
supabase functions deploy dynamic-handler --project-ref tznrmatarsyyptddnaee
```

Secret (Dashboard): `my-tech-blog-comments-tokens` = GitHub fine-grained PAT (Discussions read/write).

## GitHub Actions — Supabase ping

| 항목 | 내용 |
|---|---|
| 파일 | `.github/workflows/supabase-ping.yml` |
| 스케줄 | `cron: "0 0 * * *"` (UTC 매일 1회) |
| 수동 | `workflow_dispatch` |
| 요청 | `GET /rest/v1/posts?select=id&limit=1` |
| 헤더 | `apikey: ${{ secrets.SUPABASE_SECRET_KEY }}` |

### Secrets (Repository → Settings → Secrets and variables → Actions)

| 이름 | 값 |
|---|---|
| `SUPABASE_URL` | `https://<project>.supabase.co` |
| `SUPABASE_SECRET_KEY` | Secret API key (프론트·VITE에 넣지 말 것) |

## GitHub Actions — External feeds sync

| 워크플로 | cron (UTC) | 스크립트 |
|---|---|---|
| `fetch_huggingface_papers.yml` | `30 0 * * *`, `30 12 * * *` | `scripts/sync/sync-huggingface-daily-papers.mjs` |
| `fetch_github_trending.yml` | `30 1 * * *`, `0 13 * * *` | `scripts/sync/sync-github-trending-repos.mjs` |

수동: `workflow_dispatch`

Secrets: ping과 동일 (`SUPABASE_URL`, `SUPABASE_SECRET_KEY`).

**선행 조건:** `docs/sql/migrate_home_external_feeds.sql` 실행 후 워크플로 실행.

**수동 테스트:** Actions → Run workflow → `skip_delete: true` 권장(첫 검증).

상세: `docs/05_home_external_feeds.md`

## 브랜치 (권장)

| 브랜치 | 용도 |
|---|---|
| `main` | 프로덕션, Vercel 자동 배포 |
| `dev` | 개발·검증 후 `main` merge |

## 로컬

- `.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- git에 `.env.local` 커밋 금지
- Edge Function 로컬 테스트: Supabase CLI `supabase functions serve`

## 장애 대응

| 증상 | 점검 |
|---|---|
| 사이트 다운 | Vercel Deployments 로그 |
| API/DB 무응답 | Supabase 프로젝트 일시정지 여부 |
| 이미지 안 열림 | Storage 버킷·정책 |
| ping 워크플로 실패 | `SUPABASE_*` Secrets, `GRANT ... TO service_role` |
| 글 삭제 실패 (Giscus) | Edge Function 로그, Secret, PAT 권한 (`docs/06_post_delete_and_giscus.md`) |
| 홈 외부 피드 비어 있음 | Actions 실행 여부, `fetched_date`, fallback 동작 (`05`) |

## 관련 문서

- 프론트·Vercel: `docs/02_frontend.md`
- 스키마·권한·Storage: `docs/03_db.md`, `docs/sql/schema.md`
- 글 삭제·Giscus: `docs/06_post_delete_and_giscus.md`
- 외부 피드: `docs/05_home_external_feeds.md`
