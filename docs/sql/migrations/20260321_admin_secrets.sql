-- Run in Supabase SQL Editor (existing projects).
-- Admin-managed secrets: Notion token, Giscus GitHub PAT, etc.
-- Clients never SELECT raw values; use RPCs (list masked / upsert / delete).

create table if not exists public.admin_secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.admin_secrets enable row level security;

revoke all on table public.admin_secrets from anon, authenticated, public;
grant all on table public.admin_secrets to service_role;

drop policy if exists "admin_secrets_service_all" on public.admin_secrets;
create policy "admin_secrets_service_all"
  on public.admin_secrets for all to service_role
  using (true) with check (true);

create or replace function public.mask_admin_secret(raw text)
returns text
language sql
immutable
as $$
  select case
    when raw is null or length(raw) = 0 then null
    when length(raw) <= 8 then '********'
    else left(raw, 4) || '****' || right(raw, 4)
  end;
$$;

create or replace function public.list_admin_secrets()
returns table (
  key text,
  is_set boolean,
  masked_value text,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    s.key,
    true as is_set,
    public.mask_admin_secret(s.value) as masked_value,
    s.updated_at
  from public.admin_secrets s
  order by s.key;
$$;

create or replace function public.upsert_admin_secret(p_key text, p_value text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'key is required';
  end if;
  if p_value is null or length(trim(p_value)) = 0 then
    raise exception 'value is required';
  end if;

  insert into public.admin_secrets (key, value, updated_at)
  values (trim(p_key), trim(p_value), now())
  on conflict (key) do update
    set value = excluded.value,
        updated_at = now();
end;
$$;

create or replace function public.delete_admin_secret(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;
  delete from public.admin_secrets where key = trim(p_key);
end;
$$;

revoke all on function public.mask_admin_secret(text) from public, anon;
revoke all on function public.list_admin_secrets() from public, anon;
revoke all on function public.upsert_admin_secret(text, text) from public, anon;
revoke all on function public.delete_admin_secret(text) from public, anon;

grant execute on function public.mask_admin_secret(text) to authenticated, service_role;
grant execute on function public.list_admin_secrets() to authenticated;
grant execute on function public.upsert_admin_secret(text, text) to authenticated;
grant execute on function public.delete_admin_secret(text) to authenticated;
