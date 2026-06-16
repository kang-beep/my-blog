# 06. Post Delete & Giscus

글 삭제 시 DB·Storage·GitHub Discussion이 어떻게 정리되는지, Giscus 연동과 Edge Function 배포 방법을 정리한다.

---

## 1. 글 삭제 흐름

관리자가 글을 삭제하면 `deletePost` (`src/features/admin/api/adminPostApi.js`)가 아래 순서로 실행된다.

```
1. deletePostStorageFiles(postId)     → Storage posts-images/{postId}/ 전체
2. deleteGiscusDiscussion(postId)   → GitHub Discussions (Giscus)
3. posts 행 DELETE                  → post_likes CASCADE
4. (에디터) refreshTagStats()       → tag_stats / tag_edges 재집계
```

| 대상 | 저장 위치 | 삭제 방식 |
|------|-----------|-----------|
| 썸네일·본문 이미지 | Supabase Storage `posts-images` / `{postId}/` | `postStorageCleanup.js` — 폴더 내 파일 일괄 삭제 |
| 댓글 | GitHub `kang-beep/my-tech-blog-comments` (Giscus) | Edge Function **`dynamic-handler`** |
| 글 메타·본문 | `posts` | `DELETE` |
| 좋아요 | `post_likes` | `posts` 삭제 시 **ON DELETE CASCADE** |
| 태그 통계 | `tag_stats`, `tag_edges` | 삭제 후 `refreshTagStats()` (에디터·목록에서 호출) |

**주의:** Supabase에 `comments` 테이블은 없다. 댓글은 전부 Giscus(GitHub Discussions)이다.

Discussion이 아직 생성되지 않은 글(댓글 영역을 한 번도 연 적 없음)은 `{ deleted: false, reason: "not_found" }`로 넘어가고, **글 삭제는 계속 진행**된다.

Storage·Giscus·Edge Function 중 하나가 실패하면 **3번 `posts` DELETE까지 가지 않는다** (에러 throw).

---

## 2. Giscus 설정

프론트 설정: `src/shared/constants/giscus.js`

| 항목 | 값 |
|------|-----|
| repo | `kang-beep/my-tech-blog-comments` |
| categoryId | `DIC_kwDOS3olN84C-_3l` |
| mapping | `specific` |
| term | 글 UUID (`postId`) — Discussion 식별자 |

글 상세: `GiscusComments` → `term={postId}`로 Discussion을 찾거나 생성한다.

Edge Function도 동일한 `postId`로 Discussion **title**을 검색한다.

---

## 3. Edge Function

### 소스 (레포)

```
supabase/functions/delete-giscus-discussion/index.ts
```

### 프로덕션 배포 슬러그

| 항목 | 값 |
|------|-----|
| **배포 이름** | `dynamic-handler` |
| **URL** | `https://tznrmatarsyyptddnaee.supabase.co/functions/v1/dynamic-handler` |
| **프론트 invoke** | `dynamic-handler` (`deleteGiscusDiscussion.js`) |

레포 폴더명(`delete-giscus-discussion`)과 Supabase 배포 슬러그(`dynamic-handler`)가 다를 수 있다. **프론트 `invoke` 이름과 대시보드 함수 이름이 일치**하면 된다.

이름을 통일하려면 `delete-giscus-discussion`으로 새로 배포한 뒤 프론트 상수를 바꾸고 `dynamic-handler`는 삭제한다.

### 동작

1. 요청 `Authorization` JWT로 `supabase.auth.getUser()` — 로그인 사용자만 허용
2. body `{ postId }` 수신
3. GitHub GraphQL로 `GISCUS_REPO` / `GISCUS_CATEGORY_ID` 범위에서 `title === postId` Discussion 검색
4. 있으면 `deleteDiscussion` mutation 실행

환경 변수 (기본값은 코드 내 fallback):

| 변수 | 기본값 | 용도 |
|------|--------|------|
| `GISCUS_REPO` | `kang-beep/my-tech-blog-comments` | Discussion 저장소 |
| `GISCUS_CATEGORY_ID` | `DIC_kwDOS3olN84C-_3l` | 카테고리 ID |
| `my-tech-blog-comments-tokens` | (Secret) | GitHub fine-grained PAT |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`는 Edge Runtime에 자동 주입된다.

### Supabase Secrets

| Secret 이름 | 값 |
|-------------|-----|
| `my-tech-blog-comments-tokens` | GitHub PAT (Discussions read/write on `my-tech-blog-comments`) |

Secret 이름은 코드의 `GITHUB_TOKEN_SECRET` 상수와 **정확히 일치**해야 한다.

### 배포

대시보드: `dynamic-handler`에 `index.ts` 내용 붙여넣기 후 Deploy.

CLI (슬러그를 `dynamic-handler`로 맞출 때):

```bash
supabase functions deploy dynamic-handler --project-ref tznrmatarsyyptddnaee
```

소스 경로를 폴더명 그대로 쓰려면:

```bash
supabase functions deploy delete-giscus-discussion --project-ref tznrmatarsyyptddnaee
```

→ 이 경우 Supabase 함수 이름은 `delete-giscus-discussion`이 되므로 프론트 상수도 함께 변경한다.

### JWT 검증 (대시보드)

**Verify JWT: OFF 권장** — 게이트웨이 검증을 끄고 함수 코드의 `getUser()`로만 인증한다.  
ON + legacy secret / JWT signing keys 불일치 시 `Failed to send a request to the Edge Function`이 날 수 있다.

`supabase/config.toml`: `[functions.dynamic-handler] verify_jwt = false`

### 프론트 호출

`src/features/comments/api/deleteGiscusDiscussion.js`:

```js
const DELETE_GISCUS_DISCUSSION_FUNCTION = "dynamic-handler";

await supabase.functions.invoke(DELETE_GISCUS_DISCUSSION_FUNCTION, {
  body: { postId },
  headers: { Authorization: `Bearer ${session.access_token}` },
});
```

관리자 로그인 상태에서만 JWT가 붙는다.

---

## 4. Storage 경로

버킷: `posts-images` — **허용 MIME은 WebP 중심** (JPEG 직접 업로드 시 415 가능 → 앱에서 WebP 변환)

| 용도 | 경로 패턴 |
|------|-----------|
| 썸네일 | `{postId}/{uuid}.webp` |
| 본문 에디터 이미지 | `{postId}/content/{uuid}.webp` |

업로드: `prepareImageForUpload()` — 압축 후 WebP 변환 (`imageToWebp.ts`).

삭제 시 `{postId}/` 하위 전체를 재귀적으로 수집 후 `remove()` 한다.

---

## 5. 카테고리 (참고)

- 글 작성 시 카테고리 미선택 → **`기타`** 로 자동 저장 (`DEFAULT_POST_CATEGORY_NAME`)
- `ensureDefaultCategory()` — 에디터 진입 시 `기타` 없으면 생성
- `deleteCategory`: 연결 글은 **`기타`** 로 이동 (글 삭제 없음)
- **`기타` 카테고리는 삭제 불가**

마이그레이션: `docs/sql/migrate_ensure_gita_category.sql`

---

## 6. 트러블슈팅

| 증상 | 점검 |
|------|------|
| `Failed to send a request to the Edge Function` | 함수 `dynamic-handler` 배포, **JWT verify OFF**, 로그인, adblock |
| `Edge Function "…" not found (404)` | 프론트 invoke 이름 ↔ 대시보드 함수 슬러그 일치 |
| 글 삭제 시 401 | 관리자 로그인, Edge Function JWT verify |
| `my-tech-blog-comments-tokens is not configured` | Supabase Secret 이름·값 |
| GitHub API permission error | PAT Discussions 권한 |
| Discussion 안 지워짐 | Discussion 존재 여부, `term`/`title` = post UUID |
| `mime type image/jpeg is not supported` (415) | 버킷 WebP만 허용 — 앱이 WebP로 변환 업로드함 |
| 이미지만 남음 | Storage RLS, `posts-images` 버킷명 |

---

## 관련 문서

- 스키마: `docs/sql/schema.md`
- DB·Storage RLS: `docs/03_db.md`
- Ops·Actions: `docs/04_ops.md`
- 프론트 라우트: `docs/02_frontend.md`
