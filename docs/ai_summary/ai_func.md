# Gemini 트렌드 요약

GitHub Trending / Hugging Face Papers 캐시를 Gemini로 요약해 Home·Trends UI에 보여주는 기능.

관련: [`pipeline_design.md`](./pipeline_design.md), [`../sql/migrations/20261010_trend_ai_digests.sql`](../sql/migrations/20261010_trend_ai_digests.sql), [`../guide/05_home_external_feeds.md`](../guide/05_home_external_feeds.md)

## 현재 상태

| 항목 | 상태 |
|------|------|
| `admin_secrets.gemini_api_key` + Admin Settings UI | ✅ 완료 |
| Edge `getGeminiApiKey()` | ✅ 완료 (호출처 아직 없음) |
| DB `trend_ai_digests` | ✅ SQL 추가 (`bootstrap` + migration) — Supabase에 적용 필요 |
| GH 요약 스크립트 (`summarize-github-trending-ai.mjs`) | ✅ daily/weekly/monthly + fingerprint skip |
| GH → DB upsert (`trend_ai_digests`) | ✅ 완료 |
| HF 요약 파이프라인 | ❌ 미착수 |
| Actions workflow 연결 | ✅ GH `fetch_github_trending.yml` + HF `fetch_huggingface_papers.yml` digest jobs |
| HF 요약 (upvote Top 5, title+summary) | ✅ `summarize-huggingface-papers-ai.mjs` |
| Home / Trends UI → 실데이터 | ❌ mock 유지 |

## 목표 (확정)

- digest는 **소스별만** (`github` / `huggingface`). **combined 없음**
- GitHub: **daily / weekly / monthly** 각각 요약
- HF: 추후 (상위 20~30 + `ai_summary \|\| truncated summary` + upvotes)
- 입력 fingerprint 동일 → **Gemini 호출 skip**
- 키: Admin UI `admin_secrets.gemini_api_key` (Actions에서는 service_role로 조회)

## Gemini 입력

소스 행은 기존 캐시 테이블에서 읽는다. 브라우저 → Gemini 직접 호출 없음.

### GitHub (`github_trending_repos`) — 구현 중

| 전달 필드 | DB 컬럼 |
|-----------|---------|
| title | `title` |
| description | `description` |

필터: `period` ∈ daily/weekly/monthly, 해당 period 최신 `fetched_date` 전체 행.

### Hugging Face (`huggingface_daily_papers`) — 예정

| 전달 필드 | DB 컬럼 | 비고 |
|-----------|---------|------|
| title | `title` | |
| summary | `ai_summary` 우선, 없으면 `summary` truncate | 최신 daily는 `ai_summary` 비는 경우 많음 |
| upvotes | `upvotes` | Top-N 정렬용 |

## Gemini 출력

| 필드 | 의미 |
|------|------|
| `headline` | 한 줄 헤드라인 |
| `summary` | 2~4문장 |
| `keywords` | 3~5개 |

톤: **English**, 목록에 없는 항목 언급 금지.

## DB: `trend_ai_digests`

| 컬럼 | 타입 | 비고 |
|------|------|------|
| `fetched_date` | date | feed와 동일 |
| `source` | text | `github` \| `huggingface` |
| `period` | text | `daily` \| `weekly` \| `monthly` |
| `headline` / `summary` / `keywords` | text / text / text[] | |
| `model` / `prompt_version` / `input_fingerprint` | text | skip·재생성용 |

Unique: `(fetched_date, source, period)`

적용:

1. 기존 프로젝트: Supabase SQL Editor에서 `docs/sql/migrations/20261010_trend_ai_digests.sql` 실행
2. 신규: `bootstrap.sql`에 포함됨

## 파이프라인

```
GH sync (기존 Actions)
  → summarize-github-trending-ai.mjs
       1. admin_secrets.gemini_api_key
       2. period별 최신 feed SELECT
       3. fingerprint vs cache/DB → 동일하면 skip
       4. Gemini 호출
       5. (예정) trend_ai_digests upsert
```

로컬 실행:

```bash
# SUPABASE_URL + SUPABASE_SECRET_KEY 필요
# Admin에 gemini_api_key 저장 또는 GEMINI_API_KEY
npm run summarize:gh-trending
```

## UI (방향)

| 화면 | 방향 |
|------|------|
| Home Today in Trend | 소스별 카드 + AI Brief (헤드라인) + feed picks |
| Trends AI Briefs | **Monthly** 카피 쪽으로 정리 예정 |
| Trends Browse | 기존 daily/weekly/monthly 원본 리스트 유지 |

## Open / 다음 작업

1. Supabase에 `20261010_trend_ai_digests.sql` 적용
2. summarize 스크립트 → `trend_ai_digests` upsert + DB fingerprint 조회
3. GH sync workflow에 digest job 연결
4. HF digest 스크립트
5. FE mock → DB SELECT
