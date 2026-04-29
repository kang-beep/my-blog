# 02. Frontend

## 스택

| 항목 | 값 |
|---|---|
| 런타임 | React 19, Vite 7 |
| 스타일 | Tailwind CSS 4 (`@tailwindcss/vite`) |
| 라우팅 | `react-router-dom` |
| 상태 | Zustand |
| 백엔드 클라이언트 | `@supabase/supabase-js` |

## 라우트 (`src/shared/constants/routes.js`)

| 경로 | 설명 |
|---|---|
| `/` | 홈 |
| `/posts` | 글 목록 |
| `/posts/:id` | 글 상세 |
| `/write` | 글 작성 (인증) |
| `/edit/:id` | 글 수정 (인증) |
| `/portfolio` | 포트폴리오 |
| `/login` | 로그인 |
| `/manage-kang-beep` | 프로필·카테고리 등 설정 (인증) |

## 레이아웃

- 좌측 `Sidebar` + 중앙 본문
- 공개 네비에 관리 대시보드 링크 없음 (URL 직접 입력 또는 로그인 후 진입)

## 소스 구조 (요약)

```
src/
  app/           App, router, providers
  shared/        layout, constants, supabaseClient, 공용 UI
  features/      posts, comments, auth, admin(에디터), settings, portfolio, categories …
```

규칙: 도메인 코드는 `features/*`, 2곳 이상 재사용 시 `shared/*`로 승격.

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
