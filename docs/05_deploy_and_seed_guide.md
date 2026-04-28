# 05. Deploy & Seed Guide

> Vercel 배포 + Supabase 초기 세팅 + 데이터 입력(시드) 운영 가이드

---

## 1. 배포 전 체크리스트

- GitHub 기본 배포 브랜치: `main`
- Vercel Production Branch: `main`
- Vercel Deployment Protection이 프로덕션 트래픽을 막지 않는 상태
- Supabase 프로젝트 URL / Publishable Key 준비

---

## 2. 환경변수 키 이름 표준

### 로컬 (`.env.local`)

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

### Vercel (Environment Variables)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### GitHub Actions (Secrets)

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (권장)
- `SUPABASE_PUBLISHABLE_KEY` (fallback)

> 주의: `sb_secret_*` 키는 서버 전용이며 프론트엔드/VITE 환경변수로 사용 금지.

---

## 3. Vercel 배포 설정

| 항목 | 값 |
|---|---|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Root Directory | `./` |

추가 설정:

- SPA 라우팅 404 방지를 위해 루트의 `vercel.json` 리라이트 유지
- 환경변수 변경 후에는 반드시 `Redeploy` 수행

---

## 4. Supabase 테이블 생성 SQL

아래 SQL을 Supabase SQL Editor에서 1회 실행한다.

```sql
create extension if not exists pgcrypto;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null,
  tags text[] not null default '{}',
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  nickname text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_posts_category on public.posts(category);
create index if not exists idx_posts_tags_gin on public.posts using gin(tags);
create index if not exists idx_comments_post_id on public.comments(post_id);
```

---

## 5. Storage 버킷

- 버킷명: `post-images`
- 권장 권한: Public read, 관리자만 업로드

---

## 6. 관리자 계정 생성

- Supabase `Authentication > Users > Add user`에서 관리자 계정 1개 생성
- 비관리자 사용자 접근을 허용하지 않으려면 sign up 정책을 별도로 제한

---

## 7. 데이터 입력(시드) 방법

### 방법 A. SQL Insert (권장)

```sql
insert into public.posts (title, content, category, tags, image_url)
values
('프로젝트 시작기', '첫 글 내용', 'devlog', array['react','supabase'], null),
('운영 자동화 설정', '깃허브 액션 구성기', 'ops', array['github-actions','vercel'], null);
```

### 방법 B. CSV Import

- Supabase Table Editor `posts` 테이블에서 CSV Import
- `tags` 컬럼은 배열 형식 사용 (예: `{react,supabase}`)

예시 CSV:

```csv
title,content,category,tags,image_url
"프로젝트 시작기","첫 글 내용","devlog","{react,supabase}",""
"운영 자동화 설정","깃허브 액션 구성기","ops","{github-actions,vercel}",""
```

---

## 8. 트러블슈팅

### `Could not find the table 'public.posts' in the schema cache`

- `posts` 테이블이 미생성 상태
- 위 4번 SQL 실행 후 재시도

### `Supabase 환경변수가 누락되었습니다`

- 로컬: `.env.local` 확인 후 dev 서버 재시작
- Vercel: Environment Variables 등록 후 Redeploy

### `/posts` 직접 접속 시 404

- `vercel.json` 리라이트 설정 누락 여부 확인

