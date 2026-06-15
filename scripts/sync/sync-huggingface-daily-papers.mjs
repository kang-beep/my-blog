import {
  createServiceSupabaseClient,
  getUtcDateString,
  replaceRowsForDate,
} from "./lib/supabase.mjs";

const HUGGINGFACE_DAILY_PAPERS_URL = "https://huggingface.co/api/daily_papers";
const TABLE_NAME = "huggingface_daily_papers";

function mapAuthors(authors) {
  if (!Array.isArray(authors)) {
    return [];
  }

  return authors
    .map((author) => author?.name)
    .filter((name) => typeof name === "string" && name.trim().length > 0);
}

function mapPaperRow(entry, fetchedDate) {
  const paper = entry?.paper ?? {};

  return {
    paper_id: paper.id,
    title: paper.title ?? "Untitled",
    summary: paper.summary ?? null,
    ai_summary: paper.ai_summary ?? null,
    ai_keywords: Array.isArray(paper.ai_keywords) ? paper.ai_keywords : [],
    authors: mapAuthors(paper.authors),
    upvotes: paper.upvotes ?? 0,
    github_repo: paper.githubRepo ?? null,
    published_at: paper.publishedAt ?? null,
    fetched_date: fetchedDate,
  };
}

async function fetchDailyPapers() {
  const response = await fetch(HUGGINGFACE_DAILY_PAPERS_URL, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API failed (${response.status})`);
  }

  return response.json();
}

async function main() {
  const supabase = createServiceSupabaseClient();
  const fetchedDate = getUtcDateString();

  console.log(`Fetching all papers from ${HUGGINGFACE_DAILY_PAPERS_URL}`);

  const entries = await fetchDailyPapers();

  if (!Array.isArray(entries)) {
    throw new Error("Hugging Face API returned unexpected payload");
  }

  const rows = entries
    .map((entry) => mapPaperRow(entry, fetchedDate))
    .filter((row) => row.paper_id);

  console.log(`API returned ${entries.length} entries → inserting ${rows.length} rows (no limit).`);

  await replaceRowsForDate(supabase, TABLE_NAME, { fetched_date: fetchedDate }, rows);

  console.log(`Synced ${rows.length} Hugging Face papers for ${fetchedDate}.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
