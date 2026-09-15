# my-blog

React + Vite + Supabase 기반의 `kang-beep tech` 블로그입니다.

## Repository layout

```
├── frontend/     React (Vite) 웹 앱
├── docs/         프로젝트·DB 문서
├── supabase/     Edge Functions, CLI 설정
├── scripts/      GitHub Actions 동기화 스크립트
└── .github/      CI 워크플로
```

## 빠른 시작

### 1. 프론트엔드 (로컬 개발)

```bash
cd frontend
npm install
```

`frontend/.env.local` 생성:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

```bash
npm run dev
```

### 2. Supabase 초기 설정

`docs/sql/bootstrap.sql`을 SQL Editor에서 1회 실행. 상세: [`docs/sql/README.md`](./docs/sql/README.md)

### 3. Vercel 배포

- **Root Directory:** `frontend`
- 환경변수: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Build: `npm run build` · Output: `dist`

## GitHub Actions

루트에서 `npm ci` 후 `scripts/sync/` 실행 (HF Papers, GitHub Trending).

Secrets: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`

## 문서

전체 인덱스: [`docs/README.md`](./docs/README.md)
