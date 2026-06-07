# portfolio & tech Blog

---
## 프로젝트 개요

React 기반 포트폴리오 겸 기술 블로그 웹 사이트 구축

---
## 기술 스택
- **프론트 엔드** : React, React Router
- **스타일링** : Tailwind CSS
- **백엔드/DB** : Supabase (PostgreSQL, Auth, Storage)
- **배포** : Vercel
- **버전 관리** : GitHub

## 페이지 구성

### 1. 메인 페이지 `/`
- 히어로 섹션: 이름, 직무, 한 줄 소개
- 기술 스택 섹션: 사용 기술 아이콘 목록
- 연락처/링크 섹션: GitHub, 이메일, 블로그 링크

### 2. 블로그 목록 페이지 `/blog`
- 전체 글 목록 카드 형태로 표시
- 카드 구성: 썸네일 이미지, 제목, 날짜, 내용 미리보기
- 최신순 정렬
- 카테고리 필터 기능 (AI/ML, 수학, 개발 등)

### 3. 글 상세 페이지 `/blog/:id`
- 제목, 작성일, 본문 내용
- 이미지 표시
- 하단 댓글 섹션
  - 댓글 목록 (닉네임, 내용, 작성일)
  - 익명 댓글 작성 폼 (닉네임, 내용 입력)
- 이전글/다음글 네비게이션

### 4. 관리자 페이지 `/admin`
- 로그인하지 않은 경우 로그인 폼 표시
- 로그인한 경우 글 관리 대시보드 표시
  - 전체 글 목록
  - 글 작성 버튼
  - 글별 수정/삭제 버튼
  - 댓글 삭제 기능

### 5. 글 작성/수정 페이지 `/admin/write`, `/admin/edit/:id`
- 제목 입력
- 본문 입력 (마크다운 에디터)
- 카테고리 선택
- 이미지 업로드
- 임시저장 / 발행 버튼

---

## Supabase 테이블 구조

### posts
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | primary key |
| title | text | 글 제목 |
| content | text | 글 본문 (마크다운) |
| category | text | 카테고리 |
| image_url | text | 썸네일 이미지 URL |
| created_at | timestamp | 작성일 |
| updated_at | timestamp | 수정일 |

### comments
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | primary key |
| post_id | uuid | posts.id 참조 |
| nickname | text | 작성자 닉네임 |
| content | text | 댓글 내용 |
| created_at | timestamp | 작성일 |

---

## RLS 정책
- posts: 누구나 조회 가능, 로그인한 관리자만 작성/수정/삭제 가능
- comments: 누구나 조회 및 작성 가능, 삭제는 관리자만 가능

---

## 환경변수
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`

---

## 디렉토리 구조
```
src/
├── components/
│   ├── Header.jsx
│   ├── Footer.jsx
│   ├── PostCard.jsx
│   └── CommentSection.jsx
├── pages/
│   ├── Home.jsx
│   ├── Blog.jsx
│   ├── PostDetail.jsx
│   └── Admin.jsx
├── lib/
│   └── supabaseClient.js
└── App.jsx
```

---

## 기타 요구사항
- 반응형 레이아웃 (모바일/PC 대응)
- 마크다운 렌더링 지원 (react-markdown 라이브러리)
- 로그인 상태 Context API로 전역 관리
- 로그인하지 않은 상태에서 `/admin` 접근 시 로그인 폼으로 리다이렉트
