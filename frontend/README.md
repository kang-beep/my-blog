# Frontend

Vite + React 웹 앱 (`kang-beep tech`).

## 로컬 실행

```bash
npm install
```

`.env.local`:

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

```bash
npm run dev
npm run build
```

## 구조

```
src/
  app/        App, router, providers
  shared/     layout, constants, lib, ui
  features/   도메인별 (posts, admin, auth, …)
public/       정적 파일 (favicon 등)
```

상세: [`../docs/guide/02_frontend.md`](../docs/guide/02_frontend.md)

## Vercel

프로젝트 **Root Directory**를 `frontend`로 설정합니다.
