import { supabase } from "@/shared/lib/supabaseClient";
import { fetchRowsForTodayOrLatest } from "@/shared/utils/externalFeedQuery";
import { GITHUB_TRENDING_REPOS_TABLE } from "@/features/github/trending-repos/constants/githubTrendingRepos";

async function fetchRowsForDate(fetchedDate, period) {
  const { data, error } = await supabase
    .from(GITHUB_TRENDING_REPOS_TABLE)
    .select("id, title, url, description, period, fetched_date, created_at")
    .eq("fetched_date", fetchedDate)
    .eq("period", period)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function fetchGithubTrendingRepos(period) {
  const result = await fetchRowsForTodayOrLatest(
    supabase,
    GITHUB_TRENDING_REPOS_TABLE,
    (fetchedDate) => fetchRowsForDate(fetchedDate, period),
    { period },
  );

  return {
    repos: result.rows,
    fetchedDate: result.fetchedDate,
    isStale: result.isStale,
  };
}
