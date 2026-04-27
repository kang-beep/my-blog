# 04. Ops Pipeline

## 1. 전체 파이프라인 흐름

```
[로컬 개발]
    ↓ git push (main 브랜치)
[GitHub 레포지토리]
    ↓ 자동 감지
[Vercel] — React 빌드 & 배포
    ↕
[Supabase] — DB + Auth + Storage
    ↑
[GitHub Actions] — 24시간마다 ping (Supabase 자동 정지 방어)
```

---

## 2. Vercel 배포

### 연동 방식
- GitHub 레포지토리와 Vercel 프로젝트 연결
- `main` 브랜치에 push 시 자동으로 빌드 및 배포

### 환경변수 등록
Vercel → Project Settings → Environment Variables에 아래 두 값 등록

| 키 | 값 출처 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 대시보드 → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase 대시보드 → Settings → API |

### 빌드 설정
| 항목 | 값 |
|---|---|
| Framework Preset | Vite |
| Build Command | `vite build` |
| Output Directory | `dist` |

---

## 3. GitHub Actions — Supabase 자동 정지 방어

### 배경
Supabase 무료 플랜은 **7일간 DB 접근이 없으면 프로젝트 자동 일시정지**된다.
GitHub Actions cron job으로 주기적으로 Supabase REST API에 요청을 보내 정지를 방어한다.

### 설정 파일 위치
```
.github/
└── workflows/
    └── supabase-ping.yml
```

### 동작 방식
- **주기:** 6시간마다 1회 실행
- **방법:** Supabase REST API로 posts 테이블 단순 조회 (1건)
- **월 사용량:** 약 120분 (GitHub Actions 무료 한도 2,000분의 6%)

### 필요한 GitHub Secrets 등록
GitHub 레포지토리 → Settings → Secrets and variables → Actions

| Secret 키 | 값 |
|---|---|
| `SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase Publishable API Key |

---

## 4. Supabase Storage 운용

| 항목 | 내용 |
|---|---|
| 버킷명 | `post-images` |
| 접근 권한 | Public read / 관리자만 업로드 |
| 무료 한도 | 1GB |
| 권장 포맷 | WebP 또는 압축 JPG (장당 200~500KB 목표) |

- 텍스트 데이터(글, 댓글)는 용량 부담 없음
- 이미지가 주요 용량 소비 요소이나 포트폴리오 규모에서 1GB 초과 가능성 낮음

---

## 5. 브랜치 전략

| 브랜치 | 용도 |
|---|---|
| `main` | 프로덕션 배포용. Vercel 자동 배포 트리거 |
| `dev` | 기능 개발 및 테스트용 |

- 기능 개발은 `dev` 브랜치에서 진행
- 검토 후 `main` 브랜치에 머지 → Vercel 자동 배포
- 프론트 코드 구조는 `shared + features` 기준으로 관리하며, 기능 단위(`features/*`)로 작업/리뷰한다.
- 코드 폴더 구조 변경은 빌드/배포 파이프라인 정의(Vercel, GitHub Actions)에는 영향을 주지 않는다.

---

## 6. 로컬 개발 환경 설정

### 필요 파일
프로젝트 루트에 `.env.local` 파일 생성

```
VITE_SUPABASE_URL=<Supabase 프로젝트 URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<Supabase Publishable API Key>
```

### 주의사항
- `.env.local` 은 `.gitignore` 에 반드시 포함 (Git에 커밋 금지)
- Vercel 환경변수와 키 이름 동일하게 유지

---

## 7. 장애 대응

| 상황 | 원인 | 대응 |
|---|---|---|
| 사이트 접속 불가 | Vercel 빌드 실패 | Vercel 대시보드 → Deployments에서 로그 확인 |
| DB 응답 없음 | Supabase 프로젝트 일시정지 | Supabase 대시보드에서 수동 재개 |
| 이미지 로딩 실패 | Storage 버킷 권한 문제 | Supabase Storage → 버킷 정책 확인 |
| GitHub Actions 실패 | Secret 값 오류 | GitHub → Settings → Secrets 값 재확인 |