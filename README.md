# my_portfolio_blog

React + Vite + Supabase 기반의 포트폴리오 미니 블로그입니다.

## 기술 스택

- React (Vite)
- Supabase (Database, Auth, Storage)
- Zustand
- React Router 

## 로컬 실행

1. 의존성 설치

```bash
npm install
```

2. 루트에 `.env.local` 파일 생성

```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

3. 개발 서버 실행

```bash
npm run dev
```

## 빌드

```bash
npm run build
```

## Vercel 배포 설정

Vercel 프로젝트 환경변수에 아래 키를 등록합니다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

빌드 설정은 기본값(Vite) 또는 아래로 맞춥니다.

- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## GitHub Actions: Supabase Ping

Supabase 무료 플랜의 자동 일시정지 방지를 위해 주기적으로 REST API를 호출합니다.

필요한 GitHub Secrets:

- `SUPABASE_URL` (예: `https://<project-id>.supabase.co`)
- `SUPABASE_PUBLISHABLE_KEY` (publishable key)

워크플로우 파일: `.github/workflows/supabase-ping.yml`