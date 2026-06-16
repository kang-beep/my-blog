# 02. Frontend

## 스택

| 항목 | 값 |
|---|---|
| 런타임 | React 19, Vite 7 |
| 스타일 | Tailwind CSS 4 (`@tailwindcss/vite`) |
| 라우팅 | `react-router-dom` |
| 상태 | Zustand |
| 백엔드 클라이언트 | `@supabase/supabase-js` |
| 댓글 | `@giscus/react` (GitHub Discussions) |

## 라우트 (`src/shared/constants/routes.js`)

### 공개

| 경로 | 설명 |
|---|---|
| `/` | 홈 — Latest Trends + 내 글(Posts·Tag Network) |
| `/posts` | 글 목록 |
| `/posts/:id` | 글 상세 + Giscus 댓글 |
| `/portfolio` | 포트폴리오 |

### 관리자 (인증)

| 경로 | 설명 |
|---|---|
| `/admin-login` | 로그인 |
| `/admin` | 관리 대시보드 |
| `/admin/profile` | 프로필 설정 |
| `/admin/posts` | 글 목록 (카테고리 탭·검색·페이지네이션) |
| `/admin/posts/new` | 글 작성 |
| `/admin/posts/:id/edit` | 글 수정·삭제 |
| `/admin/portfolio` | 포트폴리오 관리 |

## 레이아웃

- 상단 `Header` (공개/관리 네비, 영문 라벨)
- `ProfileSidebar` (프로필 레일, 접기/펼치기) + 본문
  - lg+: 그리드 **2fr : 8fr** (사이드바 열림 시), 토글은 사이드바 우상단 `btn`
  - 모바일: 사이드바 기본 닫힘, 상·하단 바로 열기/닫기
- 공개 네비에 관리 대시보드 링크 없음 (URL 직접 입력 또는 로그인 후 진입)

## 소스 구조 (요약)

```
src/
  app/           App, router, providers
  shared/        layout, constants, supabaseClient, 공용 UI
  features/
    posts/       목록·상세·홈, PostListRow
    comments/    GiscusComments, deleteGiscusDiscussion API
    auth/        로그인
    admin/       글 에디터·목록, adminPostApi (CRUD·삭제)
    categories/  categoryApi (카테고리 CRUD)
    tags/        Tag Network, refreshTagStats
    settings/    프로필
    portfolio/
    huggingface/daily-papers/
    github/trending-repos/
```

규칙: 도메인 코드는 `features/*`, 2곳 이상 재사용 시 `shared/*`로 승격.

## 글·댓글 UI

| 항목 | 동작 |
|------|------|
| 목록 썸네일 | `posts.image_url` |
| 상세 본문 | `posts.content` (마크다운) — 상세 hero 이미지 없음, 본문 내 이미지만 표시 |
| excerpt | DB `null`이면 목록에서 본문 30자 자동 미리보기; 수동 입력 시 그대로 사용 |
| 댓글 | `GiscusComments` — `term={postId}`, mapping `specific` |
| 카테고리 | 미선택 시 **`기타`** 자동 (`categories.js`, `resolvePostCategory.js`) |
| 이미지 업로드 | JPEG/PNG 등 → **WebP 변환** 후 Storage (`prepareImageForUpload`) |
| 좋아요 | `post_likes` + `posts.like_count` (익명, visitor_key) |

글 삭제: `adminPostApi.deletePost` → Storage + Giscus Edge Function + `posts` DELETE. 상세는 `docs/06_post_delete_and_giscus.md`.

## 홈 외부 피드

- Hugging Face / GitHub Trending 카드: Supabase 캐시 조회 (브라우저 직접 fetch 없음)
- 홈 섹션 **Latest Trends** (`External` 배지) / **내 글** (Posts + Tag Network)
- 오늘(UTC) 데이터 없으면 최신 `fetched_date`로 fallback (`externalFeedQuery.js`)
- 상세: `docs/05_home_external_feeds.md`

## 로컬

| 파일 | 변수 |
|---|---|
| `.env.local` (git 제외) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |

```bash
npm install
npm run dev
```

## Vercel

| 항목 | 값 |
|---|---|
| 연동 | GitHub 저장소 → `main` push 시 Production 배포 |
| Build | `npm run build` (또는 `vite build`) |
| Output | `dist` |
| Install | `npm install` |
| SPA | 루트 `vercel.json` → 모든 경로 `index.html` 리라이트 |

환경변수 (Production / Preview 동일 권장):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

변경 후 반드시 Redeploy.

## 빌드 검증

```bash
npm run build
```

## 관련 문서

- 글 삭제·Giscus: `docs/06_post_delete_and_giscus.md`
- DB·Storage: `docs/03_db.md`
- Ops: `docs/04_ops.md`
