# 01. Project Overview

> my-tech-blog (UI 표시명: kang-beep tech)

---

## 1. 프로젝트 목적

관리자(본인)가 직접 로그인하여 글과 이미지를 올리고, 방문자는 글을 읽고 **Giscus(GitHub Discussions)** 로 댓글을 남길 수 있는 **개인 포트폴리오 겸 미니 블로그 웹사이트**를 구축한다.

- 별도 백엔드 서버 없이 React ↔ Supabase 직접 연결 구조
- 댓글은 Supabase DB가 아닌 **별도 GitHub repo** + Giscus 위젯
- 글 삭제 시 Giscus Discussion 정리는 **Supabase Edge Function** (프로덕션 슬러그: `dynamic-handler`)
- Vercel에 배포하여 GitHub push 시 자동 재배포
- Supabase 무료 플랜으로 운용

---

## 2. 기술 스택

| 구분 | 기술 | 비고 |
|---|---|---|
| 프론트엔드 | React | Vite 기반 |
| 스타일링 | Tailwind CSS | |
| 배포 | Vercel | GitHub 연동, 자동 배포 |
| DB | Supabase (PostgreSQL) | 무료 플랜 |
| 인증 | Supabase Auth | 이메일 / 비밀번호 |
| 스토리지 | Supabase Storage | 이미지 업로드 |
| 댓글 | Giscus (@giscus/react) | GitHub Discussions |
| 서버리스 | Supabase Edge Functions | Giscus Discussion 삭제 등 |
| 외부 피드 캐시 | GitHub Actions → Supabase | HF Papers, GitHub Trending |
| 클라이언트 라이브러리 | @supabase/supabase-js | |

---

## 3. 전체 아키텍처

```
[로컬 개발]
    ↓ git push
[GitHub 레포지토리]
    ↓ 자동 감지
[Vercel] — React 빌드 & 배포
    ↕
[Supabase] — DB + Auth + Storage + Edge Functions
    ↕
[GitHub Discussions] — Giscus 댓글 (my-tech-blog-comments)

[GitHub Actions] — Supabase ping, HF/GitHub Trending 동기화
```

---

## 4. 프론트 코드 구조 원칙

프론트엔드 코드는 **공용 영역(`shared`) + 기능 영역(`features`)** 절충형 구조를 기준으로 구성한다.
공통 레이아웃/유틸/클라이언트는 `shared`에 배치하고, 화면/로직/API는 도메인별 `features`에 묶어 관리한다.
상세 구조·라우트·배포 설정은 `docs/02_frontend.md`를 따른다.

## 문서 목록

| 문서 | 내용 |
|------|------|
| `01_project_overview.md` | 목적, 스택, 아키텍처 |
| `02_frontend.md` | 라우트, 레이아웃, Vercel |
| `03_db.md` | DB·Storage·RLS 운영 |
| `04_ops.md` | 배포, Actions, Edge Functions |
| `05_home_external_feeds.md` | HF·GitHub Trending 캐시 |
| `06_post_delete_and_giscus.md` | 글 삭제, Giscus, Edge Function |
| `sql/schema.md` | 현재 스키마 상세 (canonical) |
| `memo.md` | 백로그·콘텐츠 메모 |

---


## 5. 환경변수

Vercel → Project Settings → Environment Variables에 아래 두 값을 등록한다.  
값은 Supabase 대시보드 → Settings → API에서 확인.

```
VITE_SUPABASE_URL=<Supabase 프로젝트 URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<Supabase Publishable API Key>
```
