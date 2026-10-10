-- Run in Supabase SQL Editor (existing projects).
-- Gemini trend digests for GitHub / Hugging Face (per period).
-- Clients: SELECT only. Writes: service_role (Actions scripts).

create table if not exists public.trend_ai_digests (
  id uuid primary key default gen_random_uuid(),
  fetched_date date not null,
  source text not null check (source in ('github', 'huggingface')),
  period text not null check (period in ('daily', 'weekly', 'monthly')),
  headline text not null,
  summary text not null,
  keywords text[] not null default '{}',
  model text not null,
  prompt_version text not null,
  input_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fetched_date, source, period)
);

create index if not exists idx_trend_ai_digests_fetched_date
  on public.trend_ai_digests (fetched_date desc);

create index if not exists idx_trend_ai_digests_source_period
  on public.trend_ai_digests (source, period);

alter table public.trend_ai_digests enable row level security;

grant select on table public.trend_ai_digests to anon, authenticated;
grant all on table public.trend_ai_digests to service_role;

drop policy if exists "trend_ai_digests_select_public" on public.trend_ai_digests;
create policy "trend_ai_digests_select_public"
  on public.trend_ai_digests for select
  using (true);
