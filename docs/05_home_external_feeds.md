# 05. Home External Feeds

홈(`/`)은 **Latest Trends**(외부)와 **Mine**(내 콘텐츠) 두 섹션으로 구성된다.

- **Latest Trends**: Hugging Face Daily Papers + GitHub Trending Repos (`External` 배지)
- **Mine**: 최신 글 목록 + Tag Network (확대 시 창형 모달)

## 데이터 흐름

```
GitHub Actions (매일)
  ├─ UTC 01:00 — HF API → Supabase huggingface_daily_papers
  └─ UTC 02:00 — GitHub Trending RSS (daily/weekly/monthly) → Supabase github_trending_repos

React (브라우저)
  ├─ Supabase SELECT (fetched_date = UTC 오늘)
  └─ 카드 렌더링 (self-contained 컴포넌트)
```

브라우저는 외부 API/RSS를 직접 호출하지 않는다. CORS 회피 및 rate limit 관리를 Actions + Supabase 캐시로 처리한다.

## period 지원

| | daily | weekly | monthly |
|---|---|---|---|
| Hugging Face | ✅ | ❌ (추후) | ❌ (추후) |
| GitHub Trending | ✅ | ✅ | ✅ |

## Supabase 테이블

마이그레이션: `docs/sql/migrate_home_external_feeds.sql` (SQL Editor에서 1회 실행)

### `huggingface_daily_papers`

| 컬럼 | 비고 |
|---|---|
| paper_id | HF paper id |
| title, summary, ai_summary | |
| ai_keywords | text[] |
| authors | text[] |
| upvotes | int |
| github_repo | text, **nullable** |
| published_at | timestamptz |
| fetched_date | date (UTC 기준) |

Unique: `(paper_id, fetched_date)`

### `github_trending_repos`

| 컬럼 | 비고 |
|---|---|
| title | RSS title (보통 `owner / repo`) |
| url | 레포 URL |
| description | nullable |
| period | `daily` \| `weekly` \| `monthly` |
| fetched_date | date (UTC 기준) |

Unique: `(url, period, fetched_date)`

RLS: anon/authenticated **SELECT only**. INSERT/DELETE는 Actions(service_role)만.

## GitHub Actions

| 워크플로 | cron (UTC) | 스크립트 |
|---|---|---|
| `fetch_huggingface_papers.yml` | `0 1 * * *` | `scripts/sync/sync-huggingface-daily-papers.mjs` |
| `fetch_github_trending.yml` | `0 2 * * *` | `scripts/sync/sync-github-trending-repos.mjs` |

공통 Secrets (기존 ping과 동일):

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (service role / secret key — 클라이언트 노출 금지)

### 수동 실행

Actions 탭 → 워크플로 선택 → **Run workflow**

| 입력 | 용도 |
|---|---|
| `skip_delete` | `true`면 전날 데이터 삭제 건너뜀 (테스트) |
| `period` (GitHub만) | `all` / `daily` / `weekly` / `monthly` |

### 동기화 순서 (스크립트)

1. 외부 API/RSS fetch
2. 오늘(`fetched_date`) 기존 행 삭제 (재실행 idempotent)
3. INSERT
4. `skip_delete`가 아니면 `fetched_date < today` 삭제
5. GitHub Trending: period별 실패 시 해당 period만 skip (나머지 계속)

## 로컬 스크립트 (선택)

`.env.local`에 **로컬 전용**으로 service role key를 넣지 말 것. 테스트 시 일회성 env로 실행:

```bash
# PowerShell 예시
$env:SUPABASE_URL="https://xxx.supabase.co"
$env:SUPABASE_SECRET_KEY="..."
$env:SKIP_DELETE="true"
npm run sync:hf-papers
npm run sync:gh-trending
```

## 프론트 구조

```
src/features/huggingface/daily-papers/
src/features/github/trending-repos/
```

- 커스텀 훅 / Zustand / React Query **사용 안 함**
- `useEffect` + `useState` + Supabase JS
- `fetched_date`는 `getUtcDateString()` (Actions와 동일 UTC 날짜)

## Home 레이아웃

### Latest Trends

- `.home-cards-grid`: HF + GitHub 2열 (lg+) / 1열 (모바일)
- 카드 헤더 `External` 배지, UI 라벨 영문

### Mine

- `.home-tag-posts-grid`: Posts + Tag Network — lg+ **`6fr : 4fr`**
- Posts: 최대 10건 (`HOME_LATEST_POST_LIMIT`)
- Tag Network: `TagNetworkPanel` + `TagForceGraph`
  - 우상단 확대 → `TagNetworkFullscreenModal` (배경 딤, PC **정사각형** 창, 모바일 여백 유지)
  - Esc / X / 배경 클릭으로 닫기

### 관련 컴포넌트

```
src/features/posts/components/HomeSection.jsx
src/features/posts/components/HomeLatestPosts.jsx
src/features/tags/components/TagNetwork.jsx
src/features/tags/components/TagNetworkPanel.jsx
src/features/tags/components/TagNetworkFullscreenModal.jsx
src/shared/ui/HomeFeedBadge.jsx
src/shared/hooks/useProfileSidebarOpen.js
```

## 제거된 것

- `api/huggingface/daily-papers.js` (Vercel Edge)
- `vite.config.js` HuggingFace proxy

## 추후 (범위 외)

- Hugging Face weekly/monthly (`?date=` 누적)

## 관련 문서

- DB 상세: `docs/03_db.md`, `docs/sql/schema.md`
- Ops: `docs/04_ops.md`
- 프론트: `docs/02_frontend.md`
