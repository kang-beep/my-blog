import { createClient } from "npm:@supabase/supabase-js@2";

export const GITHUB_TRENDING_TABLE = "github_trending_repos";
export const TREND_AI_DIGESTS_TABLE = "trend_ai_digests";
export const PROMPT_VERSION = "github-v1";
export const PERIODS = ["daily", "weekly", "monthly"] as const;
export const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export type Period = (typeof PERIODS)[number];
export type OutputLanguage = "en" | "ko";

type ServiceClient = ReturnType<typeof createClient>;

type RepoRow = {
  title: string | null;
  description: string | null;
};

type DigestInputRow = {
  title: string;
  description: string;
};

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function buildGithubDigestInput(rows: RepoRow[]): DigestInputRow[] {
  return rows.map((row) => ({
    title: String(row.title ?? "").trim(),
    description: String(row.description ?? "").trim(),
  }));
}

export async function fingerprintGithubInput(
  inputRows: DigestInputRow[],
  { promptVersion, language }: { promptVersion: string; language: OutputLanguage },
): Promise<string> {
  const normalized = inputRows.map((row) => [row.title, row.description]);
  const payload = JSON.stringify({
    promptVersion,
    language: language || "en",
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

export function buildGithubPrompt({
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
    "You are a tech trend editor for a developer blog.",
    languageInstruction(language),
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

export function normalizeDigestResult(data: unknown) {
  const record = (data ?? {}) as Record<string, unknown>;
  const headline = String(record.headline ?? "").trim();
  const summary = String(record.summary ?? "").trim();
  const keywords = Array.isArray(record.keywords)
    ? record.keywords.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
    : [];

  if (!headline || !summary || keywords.length < 3) {
    throw new Error(
      `Invalid digest shape: headline/summary/keywords(3+) required. Got ${JSON.stringify(data).slice(0, 300)}`,
    );
  }

  return { headline, summary, keywords };
}

function parseJsonObject(text: string) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error(`Could not parse Gemini JSON: ${trimmed.slice(0, 200)}`);
  }
}

export async function generateJsonWithGemini({
  apiKey,
  model = DEFAULT_GEMINI_MODEL,
  systemText,
  userText,
}: {
  apiKey: string;
  model?: string;
  systemText: string;
  userText: string;
}) {
  const modelId = model || DEFAULT_GEMINI_MODEL;
  const url =
    `${GEMINI_API_BASE}/models/${modelId}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemText }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userText }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || JSON.stringify(payload).slice(0, 400);
    throw new Error(`Gemini API failed (${response.status}): ${message}`);
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("") ?? "";
  if (!text.trim()) {
    throw new Error("Gemini returned empty content");
  }

  return {
    model: modelId,
    data: parseJsonObject(text),
  };
}

export async function fetchGithubReposForPeriod(supabase: ServiceClient, period: Period) {
  const { data: latestRows, error: latestError } = await supabase
    .from(GITHUB_TRENDING_TABLE)
    .select("fetched_date")
    .eq("period", period)
    .order("fetched_date", { ascending: false })
    .limit(1);

  if (latestError) {
    throw new Error(latestError.message);
  }

  const fetchedDate = latestRows?.[0]?.fetched_date as string | undefined;
  if (!fetchedDate) {
    return { fetchedDate: null as string | null, rows: [] as RepoRow[] };
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

  return { fetchedDate, rows: (data ?? []) as RepoRow[] };
}

export async function upsertTrendAiDigest(
  supabase: ServiceClient,
  digest: {
    fetched_date: string;
    source: string;
    period: Period;
    headline: string;
    summary: string;
    keywords: string[];
    model: string;
    prompt_version: string;
    input_fingerprint: string;
  },
) {
  const row = {
    ...digest,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(TREND_AI_DIGESTS_TABLE)
    .upsert(row, { onConflict: "fetched_date,source,period" })
    .select("id, fetched_date, source, period")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function regenerateGithubDigestsForLanguage({
  supabase,
  apiKey,
  language,
}: {
  supabase: ServiceClient;
  apiKey: string;
  language: OutputLanguage;
}) {
  const results: Array<{ period: Period; status: string; detail?: string }> = [];

  for (const period of PERIODS) {
    try {
      const { fetchedDate, rows } = await fetchGithubReposForPeriod(supabase, period);
      if (!fetchedDate || rows.length === 0) {
        results.push({ period, status: "empty" });
        continue;
      }

      const inputRows = buildGithubDigestInput(rows);
      const inputFingerprint = await fingerprintGithubInput(inputRows, {
        promptVersion: PROMPT_VERSION,
        language,
      });
      const { systemText, userText } = buildGithubPrompt({
        period,
        fetchedDate,
        inputRows,
        language,
      });
      const { data, model } = await generateJsonWithGemini({
        apiKey,
        systemText,
        userText,
      });
      const normalized = normalizeDigestResult(data);
      await upsertTrendAiDigest(supabase, {
        source: "github",
        period,
        fetched_date: fetchedDate,
        headline: normalized.headline,
        summary: normalized.summary,
        keywords: normalized.keywords,
        model,
        prompt_version: PROMPT_VERSION,
        input_fingerprint: inputFingerprint,
      });
      results.push({ period, status: "generated" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ period, status: "error", detail: message });
    }
  }

  return results;
}
