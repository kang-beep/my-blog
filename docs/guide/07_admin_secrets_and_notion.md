# Admin secrets & Notion import

관리자 시크릿(Notion Integration token, Giscus GitHub PAT)은 Supabase Dashboard env가 아니라 **DB `admin_secrets`** 에 두고, Admin **Settings** UI에서 저장·덮어쓰기·삭제합니다.

## DB

- 마이그레이션: [`../sql/migrations/20260321_admin_secrets.sql`](../sql/migrations/20260321_admin_secrets.sql)
- RPC: `list_admin_secrets` (마스킹), `upsert_admin_secret`, `delete_admin_secret`
- 원문 SELECT는 service_role(Edge)만

## Keys

| key | 용도 |
|-----|------|
| `notion_token` | Notion Internal Integration Secret |
| `giscus_github_pat` | Giscus Discussion 삭제용 GitHub PAT |

## Edge Functions

| Function | 역할 |
|----------|------|
| `notion-import` | `action: search \| fetch` — Notion 목록/본문 HTML |
| `delete-giscus-discussion` / `dynamic-handler` | PAT를 DB(`giscus_github_pat`)에서 읽음. 없으면 env `my-blog-giscus-tokens` fallback |

배포 예:

```bash
supabase functions deploy notion-import --project-ref <ref>
supabase functions deploy delete-giscus-discussion --project-ref <ref>
```

`dynamic-handler`로 배포 중인 경우 동일 소스를 그 이름으로도 재배포하세요.

## Admin UI

1. SQL 마이그레이션 실행
2. `/admin/settings` 에서 토큰 저장 (마스킹만 표시)
3. Post edit → **Notion에서 가져오기** → 제목/본문 프리필 (draft)
