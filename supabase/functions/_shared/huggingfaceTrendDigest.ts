import { createClient } from "npm:@supabase/supabase-js@2";
import {
  DEFAULT_GEMINI_MODEL,
  PERIODS,
  generateJsonWithGemini,
  normalizeDigestResult,
  periodLeadInstruction,
  type OutputLanguage,
  type Period,
  upsertTrendAiDigest,
} from "./githubTrendDigest.ts";

export const HUGGINGFACE_PAPERS_TABLE = "huggingface_daily_papers";
export const HF_PROMPT_VERSION = "huggingface-v2";
export const HF_TOP_LIMIT = 5;

type ServiceClient = ReturnType<typeof createClient>;

type PaperRow = {
  title: string | null;
  summary: string | null;
  upvotes: number | null;
};

type DigestInputRow = {
  title: string;
  description: string;
  upvotes: number;
};

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function buildHuggingfaceDigestInput(rows: PaperRow[]): DigestInputRow[] {
  return rows.map((row) => ({
    title: String(row.title ?? "").trim(),
    description: String(row.summary ?? "").trim(),
    upvotes: typeof row.upvotes === "number" ? row.upvotes : 0,
  }));
}

export async function fingerprintHuggingfaceInput(
  inputRows: DigestInputRow[],
  { promptVersion, language }: { promptVersion: string; language: OutputLanguage },
): Promise<string> {
  const normalized = inputRows.map((row) => [row.title, row.description, row.upvotes ?? 0]);
  const payload = JSON.stringify({
    promptVersion,
    language: language || "en",
    topLimit: HF_TOP_LIMIT,
    rows: normalized,
  });
  return sha256Hex(payload);
}

function languageInstruction(language: OutputLanguage): string {
  if (language === "ko") {
    return "Language: Korean only. Write headline, summary, and keywords in Korean.";
  }
  return "Language: English only. Write headline, summary, and keywords in English.";
}

export function buildHuggingfacePrompt({
  period,
  fetchedDate,
  inputRows,
  language = "en",
}: {
  period: Period;
  fetchedDate: string;
  inputRows: DigestInputRow[];
  language?: OutputLanguage;
}) {
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

export async function fetchHuggingfacePapersForPeriod(
  supabase: ServiceClient,
  period: Period,
  topLimit = HF_TOP_LIMIT,
) {
  const { data: latestRows, error: latestError } = await supabase
    .from(HUGGINGFACE_PAPERS_TABLE)
    .select("fetched_date")
    .eq("period", period)
    .order("fetched_date", { ascending: false })
    .limit(1);

  if (latestError) {
    throw new Error(latestError.message);
  }

  const fetchedDate = latestRows?.[0]?.fetched_date as string | undefined;
  if (!fetchedDate) {
    return { fetchedDate: null as string | null, rows: [] as PaperRow[] };
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

  return { fetchedDate, rows: (data ?? []) as PaperRow[] };
}

export async function regenerateHuggingfaceDigestsForLanguage({
  supabase,
  apiKey,
  language,
}: {
  supabase: ServiceClient;
  apiKey: string;
  language: OutputLanguage;
}) {
  const results: Array<{ source: string; period: Period; status: string; detail?: string }> = [];

  for (const period of PERIODS) {
    try {
      const { fetchedDate, rows } = await fetchHuggingfacePapersForPeriod(
        supabase,
        period,
        HF_TOP_LIMIT,
      );
      if (!fetchedDate || rows.length === 0) {
        results.push({ source: "huggingface", period, status: "empty" });
        continue;
      }

      const inputRows = buildHuggingfaceDigestInput(rows);
      const inputFingerprint = await fingerprintHuggingfaceInput(inputRows, {
        promptVersion: HF_PROMPT_VERSION,
        language,
      });
      const { systemText, userText } = buildHuggingfacePrompt({
        period,
        fetchedDate,
        inputRows,
        language,
      });
      const { data, model } = await generateJsonWithGemini({
        apiKey,
        model: DEFAULT_GEMINI_MODEL,
        systemText,
        userText,
      });
      const normalized = normalizeDigestResult(data);
      await upsertTrendAiDigest(supabase, {
        source: "huggingface",
        period,
        fetched_date: fetchedDate,
        headline: normalized.headline,
        summary: normalized.summary,
        keywords: normalized.keywords,
        model,
        prompt_version: HF_PROMPT_VERSION,
        input_fingerprint: inputFingerprint,
      });
      results.push({ source: "huggingface", period, status: "generated" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ source: "huggingface", period, status: "error", detail: message });
    }
  }

  return results;
}
