# 05. Home External Feeds

홈(`/`)은 **Mine**(내 콘텐츠)과 **Latest Trends**(외부) 두 섹션으로 구성된다. **Mine이 위**, Latest Trends가 아래.

- **Mine**: 최신 글 목록 + Tag Network (확대 시 창형 모달)
- **Latest Trends**: Hugging Face Daily Papers + GitHub Trending Repos (`External` 배지)

## 데이터 흐름

```
GitHub Actions (하루 2회)
  ├─ UTC 00:30, 12:30 — HF API → Supabase huggingface_daily_papers
  └─ UTC 01:30, 13:00 — GitHub Trending RSS → Supabase github_trending_repos

React (브라우저)
  ├─ Supabase SELECT (fetched_date = UTC 오늘)
  ├─ 오늘 데이터 없으면 최신 fetched_date로 fallback (isStale)
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
| `fetch_huggingface_papers.yml` | `30 0 * * *`, `30 12 * * *` | `scripts/sync/sync-huggingface-daily-papers.mjs` |
| `fetch_github_trending.yml` | `30 1 * * *`, `0 13 * * *` | `scripts/sync/sync-github-trending-repos.mjs` |

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

**주의:** 2→3 순서 때문에 fetch 실패로 INSERT 0건이어도 당일 캐시는 비워진다. 프론트는 `externalFeedQuery` fallback으로 이전 `fetched_date`를 보여줄 수 있다 (`isStale`).

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
- `fetchRowsForTodayOrLatest` (`src/shared/utils/externalFeedQuery.js`): 오늘 행이 0건이면 해당 테이블의 최신 `fetched_date`로 재조회 (`isStale: true`)

## Home 레이아웃

### Mine (상단)

- `.home-tag-posts-grid`: Posts + Tag Network — lg+ **`6fr : 4fr`**
- 섹션 제목 **내 글** (`HOME_SECTION_MINE`)
- Posts 카드 헤더 **Latest Posts**, 최대 10건 (`HOME_LATEST_POST_LIMIT`)
- Tag Network: `TagNetworkPanel` + `TagForceGraph`
  - 우상단 확대 → `TagNetworkFullscreenModal` (배경 딤, PC **정사각형** 창, 모바일 여백 유지)
  - Esc / X / 배경 클릭으로 닫기

### Latest Trends (하단)

- `.home-cards-grid`: HF + GitHub 2열 (lg+) / 1열 (모바일)
- 카드 헤더 `External` 배지, UI 라벨 영문

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
- 글 삭제·Giscus: `docs/06_post_delete_and_giscus.md`
