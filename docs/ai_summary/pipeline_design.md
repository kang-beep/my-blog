# Trend AI Digest — Actions / Prompt / DB 설계

관련: [`ai_func.md`](./ai_func.md), [`../sql/migrations/20261010_trend_ai_digests.sql`](../sql/migrations/20261010_trend_ai_digests.sql), 기존 feed sync workflow.

## 결정 사항

- digest는 **소스별만** (`github` / `huggingface`). **combined 없음**
- GitHub digest: **daily / weekly / monthly** 각각
- HF digest: 추후 — 상위 20~30 + `title` + `(ai_summary || truncated summary)` + `upvotes`
- Trends AI Briefs 카피: **Monthly** 쪽으로 정리 예정
- fingerprint 동일 → **Gemini API 호출 skip**
- GitHub 입력: period별 **전체** `title` + `description`
- 키: Admin Settings → `admin_secrets.gemini_api_key` (또는 env `GEMINI_API_KEY`)
- 로컬 캐시(개발용): `scripts/github-actions/.digest-cache/` (gitignore)

---

## 1. 컨텍스트 길이 전략

| 소스 | 규모 | 입력 규칙 |
|------|------|-----------|
| GitHub | period당 소수~수십, description ≤280자 | **전체** title + description |
| Hugging Face | daily ~50, abstract ~1.4k자 | **Top 20~30** by upvotes; `ai_summary` 우선(없으면 summary truncate). 최신 daily는 `ai_summary` 비는 경우 많음 |

GH Gemini 입력 JSON 원소:

```json
{ "title": "...", "description": "..." }
```

HF (예정):

```json
{ "title": "...", "summary": "...", "score": 123 }
```

---

## 2. 데이터베이스 — `trend_ai_digests` ✅ SQL 정의됨

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid PK | `gen_random_uuid()` |
| `fetched_date` | date NOT NULL | UTC, feed와 동일 |
| `source` | text NOT NULL | `github` \| `huggingface` |
| `period` | text NOT NULL | `daily` \| `weekly` \| `monthly` |
| `headline` | text NOT NULL | 한 줄 헤드라인 |
| `summary` | text NOT NULL | 2~4문장 |
| `keywords` | text[] NOT NULL DEFAULT `'{}'` | 3~5개 |
| `model` | text NOT NULL | 예: `gemini-2.0-flash` |
| `prompt_version` | text NOT NULL | 예: `github-v1` |
| `input_fingerprint` | text NOT NULL | 입력 해시 |
| `created_at` / `updated_at` | timestamptz | default `now()` |

Constraints:

- `UNIQUE (fetched_date, source, period)` — upsert 키

RLS:

- `anon` / `authenticated`: **SELECT only**
- INSERT/UPDATE: **service_role** only

적용 파일:

- 신규: `docs/sql/bootstrap.sql`
- 기존: `docs/sql/migrations/20261010_trend_ai_digests.sql` ← **Supabase SQL Editor에서 실행**
- 문서: `docs/sql/schema.md`

### fingerprint

`sha256(JSON.stringify({ promptVersion, model, rows: [[title, description], ...] }))`

- 기존 digest의 `input_fingerprint`와 같으면 Gemini 호출 없이 종료
- `prompt_version` / model / 입력 변경 시 재생성

현재 스크립트는 로컬 `.digest-cache`와 비교. 다음 단계: DB row와 비교 + upsert.

---

## 3. GitHub Actions / 스크립트

### 현재

| 항목 | 경로 |
|------|------|
| GH summarize | `scripts/github-actions/summarize-github-trending-ai.mjs` |
| npm | `npm run summarize:gh-trending` |
| PERIOD | `all` (기본) \| `daily` \| `weekly` \| `monthly` |
| FORCE_REFRESH | `true`면 fingerprint skip 무시 |

### Actions 연결

- Workflow: `.github/workflows/fetch_github_trending.yml`
- Job: `sync` 성공 후 `digest` (`needs: sync`)
- 키: service_role → `admin_secrets.gemini_api_key`
- 결과: `trend_ai_digests` upsert (fingerprint match 시 Gemini skip)

예정: HF용 `summarize-huggingface-*-ai.mjs` 추가

실패 시: digest job만 fail. feed sync 결과는 유지.

---

## 4. 프롬프트 (GitHub `github-v1`)

- Role: tech trend editor for a developer blog
- Language: **English**
- Output JSON only: `{ headline, summary, keywords[] }`
- No inventing repos; no hype
- Headline ≤ ~120 chars; keywords 3~5

구현: `scripts/github-actions/lib/trendAiGithub.mjs` (`buildGithubPrompt`)

모델 기본: `gemini-flash-latest` (`GEMINI_MODEL`로 오버라이드)

---

## 5. 프론트 연동 (예정)

| 화면 | 필드 |
|------|------|
| Home 카드 AI Brief | `headline` (+ feed picks) |
| Trends AI Brief | `headline`, `summary`, `keywords` — Monthly 강조 |

없으면 mock / empty state.

---

## 6. 구현 순서

| # | 작업 | 상태 |
|---|------|------|
| 1 | SQL `trend_ai_digests` + RLS | ✅ 레포 반영 / ⏳ Supabase 적용 |
| 2 | GH summarize 스크립트 + fingerprint | ✅ |
| 3 | 스크립트 → DB upsert + DB fingerprint | ✅ |
| 4 | GH Actions workflow 연결 | ✅ |
| 5 | HF digest | ❌ |
| 6 | FE mock → SELECT | ✅ (GH; HF empty until digest exists) |

---

## 7. Open

| 항목 | 기본안 |
|------|--------|
| HF `TOP_N` | 20~30 |
| HF summary fallback truncate | ~300자 |
| Trends Brief period UI | Monthly 우선 표시 |
| sync 실패 시 digest | 실행 안 함 |
