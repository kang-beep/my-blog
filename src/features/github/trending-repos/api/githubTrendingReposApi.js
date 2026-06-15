import { supabase } from "@/shared/lib/supabaseClient";
import { getUtcDateString } from "@/shared/utils/utcDate";
import { GITHUB_TRENDING_REPOS_TABLE } from "@/features/github/trending-repos/constants/githubTrendingRepos";

export async function fetchGithubTrendingRepos(period) {
  const fetchedDate = getUtcDateString();
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
