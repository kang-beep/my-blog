# Schema

> Supabase 초기 설정 SQL: [`bootstrap.sql`](./bootstrap.sql) · 실행 방법: [`README.md`](./README.md)

## Relations

```
categories (1) ──< posts (N)
posts (1) ──────< post_likes (N)
posts.tags ──────> tag_stats (derived)
posts.tags ──────> tag_edges (derived)
profiles
portfolio_projects
admin_secrets
```

**Comments:** Supabase `comments` 테이블 없음 → [Giscus](https://giscus.app) (GitHub Discussions)

**Admin secrets:** Notion / Giscus PAT 등. 원문은 RPC로만 읽고, 목록은 마스킹. 마이그레이션: [`migrations/20260321_admin_secrets.sql`](./migrations/20260321_admin_secrets.sql)

## admin_secrets

| Column | Type | Constraints |
|--------|------|-------------|
| key | text | PK |
| value | text | NOT NULL |
| updated_at | timestamptz | NOT NULL, default `now()` |

**RPCs (authenticated):** `list_admin_secrets()`, `upsert_admin_secret(key, value)`, `delete_admin_secret(key)`  
**Known keys:** `notion_token`, `giscus_github_pat`

## categories

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default `gen_random_uuid()` |
| name | text | NOT NULL, UNIQUE |
| slug | text | NOT NULL, UNIQUE |
| sort_order | int | NOT NULL, default `0` |
| is_visible | boolean | NOT NULL, default `true` |
| created_at | timestamptz | NOT NULL, default `now()` |

**Indexes:** `idx_categories_sort (sort_order)`

## posts

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default `gen_random_uuid()` |
| title | text | NOT NULL |
| slug | text | UNIQUE, nullable |
| excerpt | text | |
| status | text | NOT NULL, default `'published'` |
| published_at | timestamptz | |
| content | text | NOT NULL |
| category | text | NOT NULL, 표시·검색 보조. 미선택 시 앱에서 「기타」로 저장 |
| category_id | uuid | FK → `categories.id`, nullable |
| tags | text[] | NOT NULL, default `'{}'` |
| image_url | text | |
| like_count | int | NOT NULL, default `0` |
| created_at | timestamptz | NOT NULL, default `now()` |
| updated_at | timestamptz | NOT NULL, default `now()` |

**Indexes:** `idx_posts_slug_unique (slug) WHERE slug IS NOT NULL`, `idx_posts_created_at (created_at DESC)`, `idx_posts_category (category)`, `idx_posts_tags_gin (tags GIN)`

## post_likes

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default `gen_random_uuid()` |
| post_id | uuid | NOT NULL, FK → `posts.id` ON DELETE CASCADE |
| visitor_key | text | NOT NULL |
| created_at | timestamptz | NOT NULL, default `now()` |
| | | UNIQUE `(post_id, visitor_key)` |

**Indexes:** `idx_post_likes_post_id (post_id)`

**Triggers:** `on_post_like_insert` → `like_count + 1` · `on_post_like_delete` → `like_count - 1` (min 0)

**Visitor key:** browser `localStorage` UUID (`portfolio_visitor_id`)

## profiles

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default `gen_random_uuid()` |
| display_name | text | |
| headline | text | |
| bio | text | |
| avatar_url | text | |
| github_url | text | |
| email | text | |
| updated_at | timestamptz | NOT NULL, default `now()` |

## portfolio_projects

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default `gen_random_uuid()` |
| title | text | NOT NULL |
| slug | text | NOT NULL, UNIQUE |
| summary | text | |
| content | text | |
| tech_stack | text[] | NOT NULL, default `'{}'` |
| repo_url | text | |
| demo_url | text | |
| image_url | text | |
| featured | boolean | NOT NULL, default `false` |
| sort_order | int | NOT NULL, default `0` |
| created_at | timestamptz | NOT NULL, default `now()` |
| updated_at | timestamptz | NOT NULL, default `now()` |

**Indexes:** `idx_portfolio_sort (sort_order DESC)`

## tag_stats

| Column | Type | Constraints |
|--------|------|-------------|
| tag | text | PK |
| post_count | int | NOT NULL, default `0` |
| updated_at | timestamptz | NOT NULL, default `now()` |

**Indexes:** `idx_tag_stats_count (post_count DESC)`

**Source:** `posts.tags` (aggregated on admin CRUD)

## tag_edges

| Column | Type | Constraints |
|--------|------|-------------|
| source_tag | text | PK (composite) |
| target_tag | text | PK (composite), `source_tag < target_tag` |
| weight | int | NOT NULL, default `0` |
| updated_at | timestamptz | NOT NULL, default `now()` |

**Indexes:** `idx_tag_edges_weight (weight DESC)`

**Source:** co-occurring tags in `posts.tags` (aggregated on admin CRUD)

## huggingface_daily_papers

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| paper_id | text | NOT NULL |
| title | text | NOT NULL |
| summary | text | |
| ai_summary | text | |
| ai_keywords | text[] | |
| authors | text[] | |
| upvotes | int | default `0` |
| github_repo | text | nullable |
| published_at | timestamptz | |
| period | text | `daily` \| `weekly` \| `monthly` |
| fetched_date | date | NOT NULL |
| created_at | timestamptz | default `now()` |

**Indexes:** `idx_hf_papers_fetched_date`, `idx_hf_papers_period`, unique `(paper_id, period, fetched_date)`

**Source:** GitHub Actions → HF API ([`../guide/05_home_external_feeds.md`](../guide/05_home_external_feeds.md))

## github_trending_repos

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| title | text | NOT NULL |
| url | text | NOT NULL |
| description | text | |
| period | text | `daily` \| `weekly` \| `monthly` |
| fetched_date | date | NOT NULL |
| created_at | timestamptz | default `now()` |

**Indexes:** `idx_gh_trending_fetched_date`, `idx_gh_trending_period`, unique `(url, period, fetched_date)`

**Source:** GitHub Actions → GitHubTrendingRSS

## Post delete (application)

글 삭제 시 앱 레이어에서 정리되는 범위 (`adminPostApi.deletePost`):

| Target | Mechanism |
|--------|-----------|
| `posts-images/{postId}/` | `deletePostStorageFiles` |
| Giscus Discussion (`title` = post UUID) | Edge Function **`dynamic-handler`** |
| `posts` row | `DELETE` |
| `post_likes` rows | FK **ON DELETE CASCADE** |
| `tag_stats` / `tag_edges` | `refreshTagStats()` after delete (editor) |

댓글은 DB가 아닌 GitHub Discussions. 상세: [`../guide/06_post_delete_and_giscus.md`](../guide/06_post_delete_and_giscus.md).

## Storage

| Bucket | Path pattern |
|--------|----------------|
| `avatars` | `{uuid}.{ext}` |
| `posts-images` | `{postId}/{uuid}.webp` (thumbnail) |
| `posts-images` | `{postId}/content/{uuid}.webp` (body) |
| `portfolio-images` | TBD |
