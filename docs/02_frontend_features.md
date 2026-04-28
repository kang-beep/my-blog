# 02. Frontend Features

> my-tech-blog (UI 표시명: kang-beep tech) — 페이지별 기능 명세서

---

## 0. 공통 레이아웃

전체 페이지는 **좌측 사이드바 + 본문** 구조로 구성된다. 별도 헤더바 없음.

### 사이드바 (좌측 고정)
- 프로필 이미지
- 이름 / 직무 / 한 줄 소개
- GitHub / 이메일 링크 버튼
- 기술 스택 뱃지 목록
  - `skillicons.dev` CDN URL로 불러옴 (하드코딩, DB 관리 불필요)
  - 예시: `https://skillicons.dev/icons?i=react,ts,tailwind`
- 구분선
- 카테고리 목록 (클릭 시 해당 카테고리 글 목록으로 이동)
  - Supabase posts 테이블의 category 컬럼에서 자동 추출 (하드코딩 없음)
- 로그인 상태일 경우 `관리자` 버튼 표시

### 공통 사항
- 반응형 레이아웃 (모바일 대응 — 사이드바는 햄버거 메뉴로 전환)
- 스크롤 애니메이션: Framer Motion 적용
- 스타일링: Tailwind CSS
- 라우팅: React Router v6
- 전역 상태관리: Zustand (로그인 세션 관리)

---

## 1. `/` 메인 페이지

**접근 권한:** 누구나

### 1-1. 카테고리별 글 목록 섹션 (상단)
- 카테고리별로 최신 글 3~5개를 카드 형태로 표시
- 카테고리 목록은 Supabase에서 자동으로 불러옴 (하드코딩 없음)
- 새 카테고리로 글을 올리면 자동으로 섹션 생성
- 카드 구성: 썸네일 이미지(있을 경우), 제목, 작성일, 태그
- 태그 클릭 시 해당 태그로 필터링된 `/posts` 페이지로 이동

### 1-2. 태그 네트워크 시각화 섹션 (하단)
- **라이브러리:** D3.js (force-directed graph)
- Supabase posts 테이블의 tags 컬럼에서 전체 태그 데이터를 불러와 시각화
- **노드:** 태그 하나 = 노드 하나. 글에서 등장한 횟수가 많을수록 노드 크기가 커짐
- **엣지(선):** 같은 글에 함께 등장한 태그끼리 선으로 연결
- 노드 클릭 시 해당 태그로 필터링된 `/posts` 페이지로 이동

---

## 2. `/posts` 글 목록 페이지

**접근 권한:** 누구나

글 목록 탐색에 집중하는 페이지. 메인 페이지의 카테고리별 분류와 달리 전체 글을 한곳에서 검색/필터링할 수 있다.

- 전체 글 목록을 최신순으로 표시
- 카테고리 필터 (버튼 탭 형태)
- 태그 필터 (태그 클릭 시 해당 태그 글만 표시)
- 카드 구성: 썸네일 이미지, 제목, 작성일, 카테고리, 태그
- 태그 클릭 시 해당 태그로 필터링된 글 목록으로 이동

---

## 3. `/posts/:id` 글 상세 페이지

**접근 권한:** 누구나

- 글 제목, 작성일, 카테고리, 태그 목록
- 본문 내용 (마크다운 렌더링: react-markdown)
- 이미지 (image_url 있을 경우 표시)
- 이전글 / 다음글 네비게이션
- 댓글 목록 (최신순)
  - 닉네임, 내용, 작성일 표시
  - 댓글 삭제 버튼: 관리자 로그인 상태에서만 표시
- 댓글 작성 폼
  - 닉네임 입력 (필수)
  - 내용 입력 (필수)
  - 제출 버튼

---

## 4. `/login` 관리자 로그인 페이지

**접근 권한:** 비로그인 상태에서만 접근 (로그인 상태면 `/admin` 으로 리다이렉트)

- 이메일 입력
- 비밀번호 입력
- 로그인 버튼 (Supabase Auth 이메일 로그인)
- 로그인 실패 시 에러 메시지 표시

---

## 5. `/admin` 관리자 페이지

**접근 권한:** 로그인한 관리자만 (비로그인 상태면 `/login` 으로 리다이렉트)

- 로그아웃 버튼
- 글 작성 폼
  - 제목 입력
  - 본문 입력: `@uiw/react-md-editor` (편집 / 미리보기 분할 화면 기본 제공)
  - 카테고리 입력
  - 태그 입력 (복수 입력 가능)
  - 이미지 업로드 (Supabase Storage → image_url DB 저장)
  - 제출 버튼
- 내 글 목록
  - 각 글마다 수정 / 삭제 버튼
  - 수정 클릭 시 해당 글 내용이 폼에 채워짐
  - 삭제 클릭 시 확인 후 삭제

---

## 6. 사용 라이브러리 요약

| 용도 | 라이브러리 |
|---|---|
| 라우팅 | react-router-dom v6 |
| 전역 상태관리 | zustand |
| 스타일링 | tailwindcss |
| 애니메이션 | framer-motion |
| Supabase 연동 | @supabase/supabase-js |
| 마크다운 렌더링 | react-markdown |
| 마크다운 에디터 | @uiw/react-md-editor |
| 태그 네트워크 시각화 | d3 |
| 기술 스택 뱃지 | skillicons.dev (CDN) |

---

## 7. 디렉토리 구조

프로젝트는 **공용 영역 + 기능(feature) 영역**을 혼합한 절충형 구조를 사용한다.
이 방식은 초기 구현 속도를 유지하면서도, 기능 확장 시 관련 파일을 한곳에서 관리하기 쉽다.
공통 요소(레이아웃/유틸/클라이언트)는 `shared`에 두고, 도메인별 화면/로직은 `features`로 묶는다.

```
src/
├── app/                                  # 앱 진입/라우터/전역 Provider
│   ├── App.jsx                           # 라우팅 설정
│   ├── providers/
│   │   └── AppProviders.jsx              # 전역 Provider 조합
│   └── main.jsx                          # 진입점
│
├── shared/                               # 여러 feature가 공통으로 쓰는 코드
│   ├── layout/
│   │   ├── Sidebar.jsx                   # 좌측 사이드바
│   │   └── ProtectedRoute.jsx            # 관리자 전용 라우트 가드
│   ├── ui/
│   │   └── TagBadge.jsx                  # 공용 태그 뱃지 UI
│   ├── lib/
│   │   └── supabaseClient.js             # Supabase 클라이언트 초기화
│   ├── utils/                            # 날짜/문자열 등 공통 유틸
│   └── constants/                        # 공통 상수
│
├── features/                             # 도메인(기능) 단위 코드
│   ├── posts/
│   │   ├── pages/
│   │   │   ├── Home.jsx                  # 메인 페이지(카테고리 섹션 포함)
│   │   │   ├── Posts.jsx                 # 글 목록 페이지
│   │   │   └── PostDetail.jsx            # 글 상세 페이지
│   │   ├── components/
│   │   │   ├── PostCard.jsx              # 글 카드
│   │   │   └── PostList.jsx              # 글 카드 목록
│   │   ├── api/
│   │   │   └── postApi.js                # posts 조회/수정 API
│   │   └── hooks/
│   │       └── usePosts.js               # 글 목록/상세 훅
│   │
│   ├── comments/
│   │   ├── components/
│   │   │   ├── CommentList.jsx           # 댓글 목록
│   │   │   └── CommentForm.jsx           # 댓글 작성 폼
│   │   ├── api/
│   │   │   └── commentApi.js             # comments 조회/작성/삭제 API
│   │   └── hooks/
│   │       └── useComments.js            # 댓글 관련 훅
│   │
│   ├── auth/
│   │   ├── pages/
│   │   │   └── Login.jsx                 # 관리자 로그인 페이지
│   │   ├── store/
│   │   │   └── authStore.js              # 로그인 세션 상태
│   │   └── api/
│   │       └── authApi.js                # 로그인/로그아웃 API
│   │
│   ├── tags/
│   │   ├── components/
│   │   │   └── TagNetwork.jsx            # D3 태그 네트워크
│   │   ├── api/
│   │   │   └── tagApi.js                 # 태그 집계/관계 데이터 조회 API
│   │   └── hooks/
│   │       └── useTags.js                # 태그 네트워크 훅
│   │
│   └── admin/
│       ├── pages/
│       │   └── Admin.jsx                 # 관리자 대시보드
│       ├── components/
│       │   └── PostEditorForm.jsx        # 글 작성/수정 폼
│       └── api/
│           └── adminPostApi.js           # 관리자 글 등록/수정/삭제 API
│
└── assets/                               # 정적 파일 (프로필 이미지 등)
```

### 구조 운영 규칙
- 새 기능 코드는 먼저 해당 `features/*` 내부에 작성하고, 공용화 필요가 확인되면 `shared/*`로 승격한다.
- `shared/*`는 2개 이상 feature에서 재사용되는 코드만 배치한다.
- Supabase 쿼리 로직은 가능한 `features/*/api`에 두고, UI 컴포넌트에서 직접 쿼리하지 않는다.