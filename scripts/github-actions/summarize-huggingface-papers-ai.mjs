/**
 * Hugging Face papers AI digest (daily / weekly / monthly).
 *
 * Input: upvote Top 5 papers (title + summary) from huggingface_daily_papers.
 * Fingerprint skip when inputs + language unchanged.
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SECRET_KEY  (required)
 *   PERIOD=all|daily|weekly|monthly   (default: all)
 *   GEMINI_API_KEY                    (optional; else admin_secrets.gemini_api_key)
 *   GEMINI_OUTPUT_LANGUAGE            (optional; else admin_secrets; default en)
 *   GEMINI_MODEL                      (optional; default gemini-flash-latest)
 *   FORCE_REFRESH=true                (optional)
 */
import { createServiceSupabaseClient } from "./lib/supabase.mjs";
import { loadGeminiApiKey, loadGeminiOutputLanguage } from "./lib/geminiApiKey.mjs";
import {
  generateJsonWithGemini,
  getGeminiModelName,
  isGeminiQuotaError,
} from "./lib/geminiClient.mjs";
import {
  ensureTempDirs,
  fetchExistingTrendAiDigest,
  normalizeDigestResult,
  outputPath,
  readLocalDigestCache,
  resolvePeriods,
  upsertTrendAiDigest,
  writeLocalDigestCache,
} from "./lib/trendAiGithub.mjs";
import {
  HF_PROMPT_VERSION,
  HF_TOP_LIMIT,
  buildHuggingfaceDigestInput,
  buildHuggingfacePrompt,
  fetchHuggingfacePapersForPeriod,
  fingerprintHuggingfaceInput,
} from "./lib/trendAiHuggingface.mjs";

function shouldForceRefresh() {
  return process.env.FORCE_REFRESH === "true";
}

function hasUsableDigest(existing) {
  return Boolean(existing?.headline) && Boolean(existing?.summary);
}

function matchDigestFingerprint(existing, inputFingerprint) {
  if (!hasUsableDigest(existing)) {
    return false;
  }
  return existing.input_fingerprint === inputFingerprint;
}

async function summarizePeriod({ supabase, apiKey, model, language, period }) {
  const { fetchedDate, rows } = await fetchHuggingfacePapersForPeriod(
    supabase,
    period,
    HF_TOP_LIMIT,
  );
  if (!fetchedDate || rows.length === 0) {
    console.log(`[${period}] No rows in DB — skip`);
    return { period, status: "empty" };
  }

  const inputRows = buildHuggingfaceDigestInput(rows);
  const inputFingerprint = fingerprintHuggingfaceInput(inputRows, {
    promptVersion: HF_PROMPT_VERSION,
    language,
  });

  const meta = { source: "huggingface", period, fetchedDate };
  const existingDb = await fetchExistingTrendAiDigest(supabase, meta);
  const cachedLocal = readLocalDigestCache(meta);

  if (!shouldForceRefresh() && matchDigestFingerprint(existingDb, inputFingerprint)) {
    console.log(
      `[${period}] DB fingerprint match (${inputFingerprint.slice(0, 12)}…) — skip Gemini (top ${rows.length}, ${fetchedDate})`,
    );
    return { period, status: "skipped", fetchedDate, fingerprint: inputFingerprint };
  }

  if (!shouldForceRefresh() && matchDigestFingerprint(cachedLocal, inputFingerprint)) {
    console.log(
      `[${period}] local cache match — upserting to DB without Gemini (top ${rows.length}, ${fetchedDate})`,
    );
    const upserted = await upsertTrendAiDigest(supabase, {
      source: "huggingface",
      period,
      fetched_date: fetchedDate,
      headline: cachedLocal.headline,
      summary: cachedLocal.summary,
      keywords: cachedLocal.keywords ?? [],
      model: cachedLocal.model || model,
      prompt_version: cachedLocal.prompt_version || HF_PROMPT_VERSION,
      input_fingerprint: inputFingerprint,
    });
    console.log(`[${period}] upserted id=${upserted.id}`);
    return { period, status: "upserted_from_cache", fetchedDate, fingerprint: inputFingerprint };
  }

  console.log(
    `[${period}] fingerprint changed — calling Gemini (upvote top ${rows.length}, ${fetchedDate}, lang=${language})`,
  );

  const { systemText, userText } = buildHuggingfacePrompt({
    period,
    fetchedDate,
    inputRows,
    language,
  });

  const { data, model: usedModel } = await generateJsonWithGemini({
    apiKey,
    model,
    systemText,
    userText,
  });
  const normalized = normalizeDigestResult(data);

  const digest = {
    source: "huggingface",
    period,
    fetched_date: fetchedDate,
    headline: normalized.headline,
    summary: normalized.summary,
    keywords: normalized.keywords,
    model: usedModel,
    prompt_version: HF_PROMPT_VERSION,
    input_fingerprint: inputFingerprint,
  };

  const upserted = await upsertTrendAiDigest(supabase, digest);
  writeLocalDigestCache(meta, { ...digest, id: upserted.id });

  console.log(`[${period}] upserted id=${upserted.id} → also ${outputPath(meta)}`);
  console.log(`[${period}] headline: ${digest.headline}`);

  return { period, status: "generated", fetchedDate, fingerprint: inputFingerprint };
}

async function main() {
  ensureTempDirs();
  const periods = resolvePeriods();
  const model = getGeminiModelName();
  const supabase = createServiceSupabaseClient();
  const apiKey = await loadGeminiApiKey(supabase);
  const language = await loadGeminiOutputLanguage(supabase);

  console.log(
    `Hugging Face AI digest — periods: ${periods.join(", ")}, top ${HF_TOP_LIMIT} by upvotes, model: ${model}, language: ${language}`,
  );

  const results = [];
  for (const period of periods) {
    try {
      results.push(await summarizePeriod({ supabase, apiKey, model, language, period }));
    } catch (error) {
      console.error(`[${period}] FAILED:`, error.message);
      results.push({
        period,
        status: isGeminiQuotaError(error) ? "quota" : "error",
        error: error.message,
      });
      if (isGeminiQuotaError(error)) {
        console.warn(`[${period}] Gemini quota hit — keeping previous digests and stopping further calls`);
        break;
      }
    }
  }

  const hardFailed = results.filter((item) => item.status === "error");
  const quotaFailed = results.filter((item) => item.status === "quota");
  console.log("Done:", results.map((item) => `${item.period}=${item.status}`).join(", "));
  // Quota exhaustion should not fail the workflow; feed sync already succeeded.
  if (hardFailed.length > 0 && hardFailed.length + quotaFailed.length === results.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
