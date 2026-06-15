import { supabase } from "@/shared/lib/supabaseClient";
import { getUtcDateString } from "@/shared/utils/utcDate";
import { HUGGINGFACE_DAILY_PAPERS_TABLE } from "@/features/huggingface/daily-papers/constants/huggingfaceDailyPapers";

export async function fetchHuggingFaceDailyPapers() {
  const fetchedDate = getUtcDateString();
  const { data, error } = await supabase
    .from(HUGGINGFACE_DAILY_PAPERS_TABLE)
    .select(
      "id, paper_id, title, ai_summary, ai_keywords, upvotes, github_repo, fetched_date",
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
