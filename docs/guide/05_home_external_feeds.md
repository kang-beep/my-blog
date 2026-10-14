# 05. External Feeds (HF · GitHub Trending)

Hugging Face Papers / GitHub Trending은 **GitHub Actions → Supabase 캐시 → React SELECT** 흐름이다.  
브라우저는 외부 API/RSS를 직접 호출하지 않는다.

UI: 홈 `HomeTodayInAi`(하이라이트) · `/trends`의 `TrendSourcePanel`(period별 **전체 목록**).

## 데이터 흐름

```
GitHub Actions (각 하루 10회, ~2.5h 간격)
  ├─ HF API → Supabase huggingface_daily_papers
  └─ GitHub Trending RSS → Supabase github_trending_repos

React
  ├─ Supabase SELECT (fetched_date = UTC 오늘)
  ├─ 오늘 데이터 없으면 최신 fetched_date fallback (isStale)
  └─ period별 DB rows 전부 표시 (클라이언트 top-N 없음)
```

## period

| | daily | weekly | monthly |
|---|---|---|---|
| Hugging Face | ✅ | ✅ | ✅ |
| GitHub Trending | ✅ | ✅ | ✅ |

## Supabase 테이블

초기 SQL: [`../sql/bootstrap.sql`](../sql/bootstrap.sql)

### `huggingface_daily_papers`

| 컬럼 | 비고 |
|---|---|
| paper_id | HF paper id |
| title, summary, ai_summary | |
| ai_keywords | text[] |
| authors | text[] |
| upvotes | int |
| github_repo | text, nullable |
| published_at | timestamptz |
| period | `daily` \| `weekly` \| `monthly` |
| fetched_date | date (UTC) |

Unique: `(paper_id, period, fetched_date)`

### `github_trending_repos`

| 컬럼 | 비고 |
|---|---|
| title | RSS title (보통 `owner / repo`) |
| url | 레포 URL |
| description | nullable |
| period | `daily` \| `weekly` \| `monthly` |
| fetched_date | date (UTC) |

Unique: `(url, period, fetched_date)`

RLS: anon/authenticated **SELECT only**. INSERT/DELETE는 Actions(service_role)만.

## GitHub Actions

| 워크플로 | cron (UTC) | 스크립트 |
|---|---|---|
| `fetch_huggingface_papers.yml` | 10×/day | `scripts/github-actions/sync-huggingface-daily-papers.mjs` |
| `fetch_github_trending.yml` | 10×/day | `scripts/github-actions/sync-github-trending-repos.mjs` |

Secrets: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (service role — 클라이언트 노출 금지)

sync 성공 시 해당 period의 당일 rows를 교체한다. **API/sync 실패 시 기존 캐시를 지우지 않는다.**

Gemini digest는 sync와 분리, **하루 2회** (`summarize_trend_ai_digests.yml`). HF는 upvote Top 10(`HF_TOP_LIMIT`). Admin regenerate도 동일 로직. 목록 표시 개수와 무관.

## 로컬 스크립트 (선택)

```bash
# PowerShell
$env:SUPABASE_URL="https://xxx.supabase.co"
$env:SUPABASE_SECRET_KEY="..."
$env:SKIP_DELETE="true"
npm run sync:hf-papers
npm run sync:gh-trending
```

## 프론트

```
src/features/huggingface/daily-papers/
src/features/github/trending-repos/
src/features/trends/          # /trends, HomeTodayInAi
src/shared/utils/externalFeedQuery.js
```

## 관련 문서

- DB: [`03_db.md`](./03_db.md), [`../sql/schema.md`](../sql/schema.md)
- Ops: [`04_ops.md`](./04_ops.md)
- 프론트: [`02_frontend.md`](./02_frontend.md)
