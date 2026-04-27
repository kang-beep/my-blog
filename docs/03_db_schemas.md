# 03. DB Schema

## 1. 테이블 구조

### posts

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | 고유 식별자 |
| title | text | NOT NULL | 글 제목 |
| content | text | NOT NULL | 본문 내용 (마크다운) |
| category | text | NOT NULL | 카테고리 (자동 추출용) |
| tags | text[] | DEFAULT '{}' | 태그 배열 |
| image_url | text | nullable | Supabase Storage 이미지 URL |
| created_at | timestamptz | default now() | 작성일시 |
| updated_at | timestamptz | default now() | 수정일시 |

### comments

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | 고유 식별자 |
| post_id | uuid | NOT NULL, FK → posts.id | 연결된 글 |
| nickname | text | NOT NULL | 익명 닉네임 |
| content | text | NOT NULL | 댓글 내용 |
| created_at | timestamptz | default now() | 작성일시 |

---

## 2. 관계

```
posts (1) ──────< comments (N)
  id                post_id
```

- 글 하나에 댓글 여러 개
- 글 삭제 시 연결된 댓글도 함께 삭제 (CASCADE)

---

## 3. RLS (Row Level Security) 정책

### posts 테이블

| 작업 | 허용 대상 | 조건 |
|---|---|---|
| SELECT | 누구나 | 없음 |
| INSERT | 관리자만 | `auth.role() = 'authenticated'` |
| UPDATE | 관리자만 | `auth.role() = 'authenticated'` |
| DELETE | 관리자만 | `auth.role() = 'authenticated'` |

### comments 테이블

| 작업 | 허용 대상 | 조건 |
|---|---|---|
| SELECT | 누구나 | 없음 |
| INSERT | 누구나 | 없음 (익명 댓글 허용) |
| DELETE | 관리자만 | `auth.role() = 'authenticated'` |

---

## 4. 태그 관련 쿼리 패턴

tags 컬럼은 PostgreSQL 배열 타입(`text[]`)으로 저장된다.

**특정 태그가 포함된 글 조회**
```sql
SELECT * FROM posts
WHERE 'React' = ANY(tags)
ORDER BY created_at DESC;
```

**전체 태그 목록 및 등장 횟수 조회** (태그 네트워크 시각화용)
```sql
SELECT tag, COUNT(*) AS count
FROM posts, unnest(tags) AS tag
GROUP BY tag
ORDER BY count DESC;
```

**태그 동시 등장 관계 조회** (노드 간 엣지 계산용)
```sql
SELECT a.tag AS tag1, b.tag AS tag2, COUNT(*) AS weight
FROM posts,
     unnest(tags) AS a(tag),
     unnest(tags) AS b(tag)
WHERE a.tag < b.tag
GROUP BY a.tag, b.tag
ORDER BY weight DESC;
```

---

## 5. Storage 구조

**버킷명:** `post-images`

| 경로 패턴 | 설명 |
|---|---|
| `post-images/{uuid}.{ext}` | 글에 첨부된 이미지 |

- 업로드 후 public URL을 posts.image_url 에 저장
- 버킷 접근 권한: public read, 관리자만 업로드 가능

---

## 6. 인덱스

| 테이블 | 컬럼 | 이유 |
|---|---|---|
| posts | created_at | 최신순 정렬 |
| posts | category | 카테고리 필터링 |
| posts | tags | 태그 필터링 (GIN 인덱스) |
| comments | post_id | 글별 댓글 조회 |