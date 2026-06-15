-- Home external feeds: Hugging Face Daily Papers + GitHub Trending Repos
-- Run once in Supabase SQL Editor before enabling GitHub Actions sync.

CREATE TABLE IF NOT EXISTS huggingface_daily_papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paper_id TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  ai_summary TEXT,
  ai_keywords TEXT[],
  authors TEXT[],
  upvotes INTEGER DEFAULT 0,
  github_repo TEXT,
  published_at TIMESTAMPTZ,
  fetched_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hf_papers_fetched_date
  ON huggingface_daily_papers (fetched_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hf_papers_paper_id_fetched_date
  ON huggingface_daily_papers (paper_id, fetched_date);

ALTER TABLE huggingface_daily_papers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow public read" ON huggingface_daily_papers;
CREATE POLICY "allow public read"
  ON huggingface_daily_papers
  FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS github_trending_repos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  fetched_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gh_trending_fetched_date
  ON github_trending_repos (fetched_date DESC);

CREATE INDEX IF NOT EXISTS idx_gh_trending_period
  ON github_trending_repos (period);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gh_trending_url_period_fetched_date
  ON github_trending_repos (url, period, fetched_date);

ALTER TABLE github_trending_repos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow public read" ON github_trending_repos;
CREATE POLICY "allow public read"
  ON github_trending_repos
  FOR SELECT
  USING (true);

GRANT SELECT ON huggingface_daily_papers TO anon, authenticated;
GRANT SELECT ON github_trending_repos TO anon, authenticated;
GRANT ALL ON huggingface_daily_papers TO service_role;
GRANT ALL ON github_trending_repos TO service_role;
