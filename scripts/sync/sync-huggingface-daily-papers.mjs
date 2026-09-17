import {
  createServiceSupabaseClient,
  getUtcDateString,
  replaceRowsForDate,
} from "./lib/supabase.mjs";

const HUGGINGFACE_DAILY_PAPERS_URL = "https://huggingface.co/api/daily_papers";
const TABLE_NAME = "huggingface_daily_papers";
const PERIODS = ["daily", "weekly", "monthly"];

function mapAuthors(authors) {
  if (!Array.isArray(authors)) {
    return [];
  }

  return authors
    .map((author) => author?.name)
    .filter((name) => typeof name === "string" && name.trim().length > 0);
}

function getIsoWeekParam(date = new Date()) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getMonthParam(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function buildPapersUrl(period, fetchedDate) {
  const url = new URL(HUGGINGFACE_DAILY_PAPERS_URL);

  if (period === "weekly") {
    url.searchParams.set("week", getIsoWeekParam());
    url.searchParams.set("sort", "trending");
    return url.toString();
  }

  if (period === "monthly") {
    url.searchParams.set("month", getMonthParam());
    url.searchParams.set("sort", "trending");
    return url.toString();
  }

  url.searchParams.set("date", fetchedDate);
  return url.toString();
}

function mapPaperRow(entry, period, fetchedDate) {
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
    period,
    fetched_date: fetchedDate,
  };
}

async function fetchPapers(period, fetchedDate) {
  const requestUrl = buildPapersUrl(period, fetchedDate);
  console.log(`Fetching HF papers (${period}): ${requestUrl}`);

  const response = await fetch(requestUrl, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Hugging Face API failed for ${period} (${response.status})`);
  }

  return response.json();
}

async function syncPeriod(supabase, period, fetchedDate) {
  const entries = await fetchPapers(period, fetchedDate);

  if (!Array.isArray(entries)) {
    throw new Error(`Hugging Face API returned unexpected payload for ${period}`);
  }

  const rows = entries
    .map((entry) => mapPaperRow(entry, period, fetchedDate))
    .filter((row) => row.paper_id);

  console.log(`HF ${period}: API ${entries.length} → insert ${rows.length}`);

  await replaceRowsForDate(
    supabase,
    TABLE_NAME,
    { fetched_date: fetchedDate, period },
    rows,
  );

  console.log(`Synced ${rows.length} HF papers (${period}) for ${fetchedDate}.`);
}

function resolvePeriods() {
  const selectedPeriod = process.env.PERIOD ?? "all";

  if (selectedPeriod === "all") {
    return PERIODS;
  }

  if (!PERIODS.includes(selectedPeriod)) {
    throw new Error(`Invalid PERIOD value: ${selectedPeriod}`);
  }

  return [selectedPeriod];
}

async function main() {
  const supabase = createServiceSupabaseClient();
  const fetchedDate = getUtcDateString();
  const periods = resolvePeriods();
  const failures = [];

  for (const period of periods) {
    try {
      await syncPeriod(supabase, period, fetchedDate);
    } catch (error) {
      failures.push(`${period}: ${error.message}`);
      console.error(`Skipped ${period}: ${error.message}`);
    }
  }

  if (failures.length === periods.length) {
    throw new Error(failures.join(" | "));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
