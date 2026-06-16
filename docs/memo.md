# 프로젝트 메모

개발 백로그와 블로그·포트폴리오에 채울 콘텐츠 목록.

---

## 1. 기능 구현 · 수정

### 우선순위 (참고)

| 순서 | 항목 | 비고 |
|------|------|------|
| 1 | 태그 네트워크 그래프 | 데이터 집계는 `tag_stats` / `tag_edges` 테이블 + CRUD 시 갱신 |
| 2 | 작성일·시간 표시 | DB 변경 거의 없음 |
| 3 | 글 잠금 · 댓글 ON/OFF | 스키마 + RLS + 에디터 토글 |
| 4 | 익명 좋아요 | ✅ `post_likes` + `like_count` (구현됨) |
| 5 | 포트폴리오 CRUD | 범위 큼, 웹 카드형 우선 검토 |

---

### 1-1. 태그 네트워크 (홈)

- [x] 메인(홈)에 **force graph** 형태로 시각화
- [x] `posts.tags`는 원본 유지, 집계는 **`tag_stats` · `tag_edges`** 테이블
- [x] 관리자 글 **create / update / delete** 후 통계 테이블 **전체 재집계**
- [x] 노드 클릭 → `?tag=` 필터 (기존 동작 유지)

---

### 1-2. 포트폴리오

- [ ] 작성·관리·공개 페이지 구현
- [ ] 형식 검토: **웹 카드형(추천)** vs PPT/PDF embed
- [ ] `portfolio_projects` 테이블·관리 화면과 연동

---

### 1-3. 게시글 잠금 · 댓글 정책

관리자만 설정. **3 · 5 · 6 · 7**은 같이 설계.

| 기능 | 방향 |
|------|------|
| 글 잠금 | 비공개 글: 목록·상세에서 비로그인 차단 (의미 확정 필요) |
| 댓글 | 현재 **Giscus 항상 ON** (글별 토글 미구현) |
| 관리자 | 글마다 잠금·댓글 허용 토글 (미구현) |
| 스팸 방어 | Giscus + GitHub; 글별 OFF는 미구현 |

예상 컬럼: `posts.is_locked`, `posts.comments_enabled` (또는 `status`와 역할 분리)

**구현됨:** 글 삭제 시 Giscus Discussion 제거 — `docs/06_post_delete_and_giscus.md`

---

### 1-4. 좋아요 · 날짜 표시

**좋아요**

- [x] 익명, **1인 1회** (`visitor_key`, 완벽 방지는 불가)
- [x] `post_likes(post_id, visitor_key)` + `posts.like_count` 캐시
- [x] 글 CRUD와 무관 → **클릭 시** 갱신; 글 삭제 시 CASCADE

**날짜·시간**

- [ ] 상세·목록에 **날짜 + 시간** 표시 (`created_at` / `published_at`)

---

## 2. 블로그 콘텐츠 (작성 예정)

### 2-1. AI

#### LLM

- 텍스트 데이터 전처리
- 베이스 모델 논문 리뷰 · 학습 · 추론
- RAG 활용
- 멀티모달 (연구 주제)

#### Vision AI

- 이미지 데이터 전처리
- 베이스 모델 논문 리뷰 · 학습 · 추론
- 최신 모델 사용 · 논문 리뷰

#### Timeseries forecasting

- 시계열 데이터 전처리
- 베이스 모델 논문 리뷰 · 학습 · 추론
- 최신 모델 사용 · 논문 리뷰

---

### 2-2. 서비스 구축

#### Python 웹

- Django
- FastAPI
- Clean Architecture

#### 데이터베이스

- DB 개념
- DB 종류

#### React

- React 기본
- React + Electron 배포

---

### 2-3. 인프라

#### 컨테이너 · 오케스트레이션

- Docker
- Kubernetes

#### CI/CD

- GitHub Actions
- Jenkins

#### 클라우드

- Azure

#### MLOps

- ML 파이프라인 설계
- 시계열 모델 **실시간 추론** 이슈·해결
- MLflow · 실험 관리

---

## 3. 포트폴리오 콘텐츠 (작성 예정)

- [ ] 프로젝트 1
- [ ] 프로젝트 2
- [ ] 자기소개서
