import { supabase } from "@/shared/lib/supabaseClient";
import { getLatestCreatedAt } from "@/shared/utils/date";
import { fetchRowsForTodayOrLatest } from "@/shared/utils/externalFeedQuery";
import { HUGGINGFACE_DAILY_PAPERS_TABLE } from "@/features/huggingface/daily-papers/constants/huggingfaceDailyPapers";

async function fetchRowsForDate(fetchedDate) {
  const { data, error } = await supabase
    .from(HUGGINGFACE_DAILY_PAPERS_TABLE)
    .select(
      "id, paper_id, title, ai_summary, ai_keywords, upvotes, github_repo, fetched_date, created_at",
    )
    .eq("fetched_date", fetchedDate)
    .order("upvotes", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    ...row,
    ai_keywords: Array.isArray(row.ai_keywords) ? row.ai_keywords : [],
  }));
}

export async function fetchHuggingFaceDailyPapers() {
  const result = await fetchRowsForTodayOrLatest(
    supabase,
    HUGGINGFACE_DAILY_PAPERS_TABLE,
    fetchRowsForDate,
  );

  return {
    papers: result.rows,
    fetchedDate: result.fetchedDate,
    isStale: result.isStale,
    syncedAt: getLatestCreatedAt(result.rows),
  };
}
