import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const GITHUB_TRENDING_TABLE = "github_trending_repos";
export const TREND_AI_DIGESTS_TABLE = "trend_ai_digests";
export const PROMPT_VERSION = "github-v2";
export const PERIODS = ["daily", "weekly", "monthly"];

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
/** Local fingerprint/output cache (gitignored). Not for API keys. */
const DIGEST_CACHE_DIR = join(SCRIPT_DIR, "..", ".digest-cache");
const CACHE_DIR = join(DIGEST_CACHE_DIR, "cache");
const OUTPUT_DIR = join(DIGEST_CACHE_DIR, "output");

export function ensureTempDirs() {
  mkdirSync(CACHE_DIR, { recursive: true });
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

export function resolvePeriods() {
  const raw = (process.env.PERIOD || "all").trim().toLowerCase();
  if (!raw || raw === "all") {
    return [...PERIODS];
  }
  if (!PERIODS.includes(raw)) {
    throw new Error(`Invalid PERIOD="${raw}". Use daily|weekly|monthly|all`);
  }
  return [raw];
}

export function buildGithubDigestInput(rows) {
  return rows.map((row) => ({
    title: String(row.title ?? "").trim(),
    description: String(row.description ?? "").trim(),
  }));
}

/**
 * Fingerprint of digest inputs (repos + prompt version + output language).
 * Model is intentionally excluded so gemini-flash-latest / pinned flash
 * aliases do not force a Gemini re-call when trending data is unchanged.
 */
export function fingerprintGithubInput(inputRows, { promptVersion, language }) {
  const normalized = inputRows.map((row) => [row.title, row.description]);
  const payload = JSON.stringify({
    promptVersion,
    language: language || "en",
    rows: normalized,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/** Fingerprints before language was included in the hash. */
export function fingerprintGithubInputWithoutLanguage(inputRows, { promptVersion }) {
  const normalized = inputRows.map((row) => [row.title, row.description]);
  const payload = JSON.stringify({
    promptVersion,
    rows: normalized,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/** Pre-migration fingerprints that hashed `model` into the payload. */
export function fingerprintGithubInputLegacy(inputRows, { promptVersion, model }) {
  const normalized = inputRows.map((row) => [row.title, row.description]);
  const payload = JSON.stringify({
    promptVersion,
    model,
    rows: normalized,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export function cachePath({ source, period, fetchedDate }) {
  return join(CACHE_DIR, `${source}-${period}-${fetchedDate}.json`);
}

export function outputPath({ source, period, fetchedDate }) {
  return join(OUTPUT_DIR, `${source}-${period}-${fetchedDate}.json`);
}

export function readLocalDigestCache(meta) {
  const path = cachePath(meta);
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeLocalDigestCache(meta, digest) {
  ensureTempDirs();
  writeFileSync(cachePath(meta), `${JSON.stringify(digest, null, 2)}\n`, "utf8");
  writeFileSync(outputPath(meta), `${JSON.stringify(digest, null, 2)}\n`, "utf8");
}

function languageInstruction(language) {
  if (language === "ko") {
    return "Language: Korean only. Write headline, summary, and keywords in Korean.";
  }
  return "Language: English only. Write headline, summary, and keywords in English.";
}

/** Require period framing at the start of headline (and naturally in summary). */
export function periodLeadInstruction(period, language = "en") {
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

export function buildGithubPrompt({ period, fetchedDate, inputRows, language = "en" }) {
  const systemText = [
    "You are a tech trend editor for a developer blog.",
    languageInstruction(language),
    periodLeadInstruction(period, language),
    "Analyze the GitHub trending repositories for the given period.",
    "Do not invent repos that are not in the list.",
    "No hype or marketing tone.",
    "Return JSON only with keys: headline (one sentence, <=120 chars), summary (2-4 sentences), keywords (3-5 short noun phrases).",
  ].join(" ");

  const userText = [
    `Source: github`,
    `Period: ${period}`,
    `Fetched date (UTC): ${fetchedDate}`,
    `Output language: ${language}`,
    `Repo count: ${inputRows.length}`,
    `Repos JSON:`,
    JSON.stringify(inputRows, null, 2),
  ].join("\n");

  return { systemText, userText };
}

export function normalizeDigestResult(data) {
  const headline = String(data?.headline ?? "").trim();
  const summary = String(data?.summary ?? "").trim();
  const keywords = Array.isArray(data?.keywords)
    ? data.keywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
    : [];

  if (!headline || !summary || keywords.length < 3) {
    throw new Error(
      `Invalid digest shape: headline/summary/keywords(3+) required. Got ${JSON.stringify(data).slice(0, 300)}`,
    );
  }

  return { headline, summary, keywords };
}

/**
 * Existing digest row for fingerprint skip (exact fetched_date + source + period).
 */
export async function fetchExistingTrendAiDigest(supabase, { source, period, fetchedDate }) {
  const { data, error } = await supabase
    .from(TREND_AI_DIGESTS_TABLE)
    .select(
      "id, fetched_date, source, period, headline, summary, keywords, model, prompt_version, input_fingerprint, updated_at",
    )
    .eq("source", source)
    .eq("period", period)
    .eq("fetched_date", fetchedDate)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

/**
 * Upsert digest on unique (fetched_date, source, period).
 */
export async function upsertTrendAiDigest(supabase, digest) {
  const row = {
    fetched_date: digest.fetched_date,
    source: digest.source,
    period: digest.period,
    headline: digest.headline,
    summary: digest.summary,
    keywords: digest.keywords,
    model: digest.model,
    prompt_version: digest.prompt_version,
    input_fingerprint: digest.input_fingerprint,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TREND_AI_DIGESTS_TABLE)
    .upsert(row, { onConflict: "fetched_date,source,period" })
    .select("id, fetched_date, source, period, input_fingerprint, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Load latest github_trending_repos rows for a period from Supabase.
 */
export async function fetchGithubReposForPeriod(supabase, period) {
  const { data: latestRows, error: latestError } = await supabase
    .from(GITHUB_TRENDING_TABLE)
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
    .from(GITHUB_TRENDING_TABLE)
    .select("title, url, description, period, fetched_date")
    .eq("period", period)
    .eq("fetched_date", fetchedDate)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return { fetchedDate, rows: data ?? [] };
}
