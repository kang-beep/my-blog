import { createHash } from "node:crypto";

export const HUGGINGFACE_PAPERS_TABLE = "huggingface_daily_papers";
export const HF_PROMPT_VERSION = "huggingface-v2";
export const HF_TOP_LIMIT = 5;

/**
 * Latest HF papers for a period, ordered by upvotes, capped at Top N.
 */
export async function fetchHuggingfacePapersForPeriod(supabase, period, topLimit = HF_TOP_LIMIT) {
  const { data: latestRows, error: latestError } = await supabase
    .from(HUGGINGFACE_PAPERS_TABLE)
    .select("fetched_date")
    .eq("period", period)
    .order("fetched_date", { ascending: false })
    .limit(1);

  if (latestError) {
    throw new Error(latestError.message);
  }

  const fetchedDate = latestRows?.[0]?.fetched_date;
  if (!fetchedDate) {
    return { fetchedDate: null, rows: [] };
  }

  const { data, error } = await supabase
    .from(HUGGINGFACE_PAPERS_TABLE)
    .select("paper_id, title, summary, upvotes, period, fetched_date")
    .eq("period", period)
    .eq("fetched_date", fetchedDate)
    .order("upvotes", { ascending: false })
    .limit(topLimit);

  if (error) {
    throw new Error(error.message);
  }

  return { fetchedDate, rows: data ?? [] };
}

/** Gemini input: title + full summary (Top 5 by upvotes). */
export function buildHuggingfaceDigestInput(rows) {
  return rows.map((row) => ({
    title: String(row.title ?? "").trim(),
    description: String(row.summary ?? "").trim(),
    upvotes: typeof row.upvotes === "number" ? row.upvotes : 0,
  }));
}

export function fingerprintHuggingfaceInput(inputRows, { promptVersion, language }) {
  const normalized = inputRows.map((row) => [row.title, row.description, row.upvotes ?? 0]);
  const payload = JSON.stringify({
    promptVersion,
    language: language || "en",
    topLimit: HF_TOP_LIMIT,
    rows: normalized,
  });
  return createHash("sha256").update(payload).digest("hex");
}

function languageInstruction(language) {
  if (language === "ko") {
    return "Language: Korean only. Write headline, summary, and keywords in Korean.";
  }
  return "Language: English only. Write headline, summary, and keywords in English.";
}

function periodLeadInstruction(period, language = "en") {
  if (language === "ko") {
    if (period === "weekly") {
      return 'Headline MUST start with "이번 주" (e.g. "이번 주 …"). Summary should also read as this week.';
    }
    if (period === "monthly") {
      return 'Headline MUST start with "이번 달" (e.g. "이번 달 …"). Summary should also read as this month.';
    }
    return 'Headline MUST start with "오늘의" (e.g. "오늘의 …"). Summary should also read as today.';
  }

  if (period === "weekly") {
    return 'Headline MUST start with "This week" (e.g. "This week, …"). Summary should also read as this week.';
  }
  if (period === "monthly") {
    return 'Headline MUST start with "This month" (e.g. "This month, …"). Summary should also read as this month.';
  }
  return 'Headline MUST start with "Today\'s" (e.g. "Today\'s …"). Summary should also read as today.';
}

export function buildHuggingfacePrompt({ period, fetchedDate, inputRows, language = "en" }) {
  const systemText = [
    "You are a research trend editor for a developer blog.",
    languageInstruction(language),
    periodLeadInstruction(period, language),
    "Analyze the top Hugging Face papers for the given period (ranked by upvotes).",
    "Do not invent papers that are not in the list.",
    "No hype or marketing tone.",
    "Return JSON only with keys: headline (one sentence, <=120 chars), summary (2-4 sentences), keywords (3-5 short noun phrases).",
  ].join(" ");

  const userText = [
    `Source: huggingface`,
    `Period: ${period}`,
    `Fetched date (UTC): ${fetchedDate}`,
    `Output language: ${language}`,
    `Paper count (upvote top ${inputRows.length}): ${inputRows.length}`,
    `Papers JSON:`,
    JSON.stringify(inputRows, null, 2),
  ].join("\n");

  return { systemText, userText };
}
