# Schema

## Relations

```
categories (1) ──< posts (N)
posts (1) ──────< post_likes (N)
posts.tags ──────> tag_stats (derived)
posts.tags ──────> tag_edges (derived)
profiles
portfolio_projects
```

**Comments:** Supabase `comments` 테이블 없음 → [Giscus](https://giscus.app) (GitHub Discussions)

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
| category | text | NOT NULL |
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

## Storage

| Bucket | Path pattern |
|--------|----------------|
| `avatars` | `{uuid}.{ext}` |
| `posts-images` | `{postId}/{uuid}.{ext}` (thumbnail) |
| `posts-images` | `{postId}/content/{uuid}.webp` (body) |
| `portfolio-images` | TBD |
