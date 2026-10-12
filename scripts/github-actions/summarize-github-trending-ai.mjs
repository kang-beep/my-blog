/**
 * GitHub trending AI digest (daily / weekly / monthly).
 *
 * Flow per period:
 * 1. Load repos from Supabase github_trending_repos
 * 2. Build title+description input + fingerprint
 * 3. If fingerprint matches trend_ai_digests (or local cache) → skip Gemini
 * 4. Else call Gemini → upsert trend_ai_digests (+ local .digest-cache)
 *
 * Env:
 *   SUPABASE_URL, SUPABASE_SECRET_KEY  (required)
 *   PERIOD=all|daily|weekly|monthly   (default: all)
 *   GEMINI_API_KEY                    (optional; else admin_secrets.gemini_api_key)
 *   GEMINI_OUTPUT_LANGUAGE            (optional; else admin_secrets.gemini_output_language; default en)
 *   GEMINI_MODEL                      (optional; default gemini-flash-latest)
 *   FORCE_REFRESH=true                (optional; ignore fingerprint skip)
 */
import { createServiceSupabaseClient } from "./lib/supabase.mjs";
import {
  DEFAULT_GEMINI_OUTPUT_LANGUAGE,
  loadGeminiApiKey,
  loadGeminiOutputLanguage,
} from "./lib/geminiApiKey.mjs";
import {
  generateJsonWithGemini,
  getGeminiModelName,
  isGeminiSoftFailError,
} from "./lib/geminiClient.mjs";
import {
  PROMPT_VERSION,
  buildGithubDigestInput,
  buildGithubPrompt,
  ensureTempDirs,
  fetchExistingTrendAiDigest,
  fetchGithubReposForPeriod,
  fingerprintGithubInput,
  fingerprintGithubInputLegacy,
  fingerprintGithubInputWithoutLanguage,
  normalizeDigestResult,
  outputPath,
  readLocalDigestCache,
  resolvePeriods,
  upsertTrendAiDigest,
  writeLocalDigestCache,
} from "./lib/trendAiGithub.mjs";

function shouldForceRefresh() {
  return process.env.FORCE_REFRESH === "true";
}

function hasUsableDigest(existing) {
  return Boolean(existing?.headline) && Boolean(existing?.summary);
}

/**
 * Match current fingerprint, or legacy fingerprints (pre-language / model-in-hash).
 * Returns which fingerprint matched so callers can migrate DB rows without Gemini.
 */
function matchDigestFingerprint(existing, inputRows, inputFingerprint, model, language) {
  if (!hasUsableDigest(existing)) {
    return null;
  }
  if (existing.input_fingerprint === inputFingerprint) {
    return { kind: "current", fingerprint: inputFingerprint };
  }

  const promptVersion = existing.prompt_version || PROMPT_VERSION;

  if (language === DEFAULT_GEMINI_OUTPUT_LANGUAGE) {
    const withoutLanguage = fingerprintGithubInputWithoutLanguage(inputRows, {
      promptVersion,
    });
    if (existing.input_fingerprint === withoutLanguage) {
      return { kind: "legacy", fingerprint: inputFingerprint };
    }
  }

  const legacyModels = [...new Set([existing.model, model, "gemini-3.8-flash"].filter(Boolean))];
  for (const legacyModel of legacyModels) {
    const legacyFingerprint = fingerprintGithubInputLegacy(inputRows, {
      promptVersion,
      model: legacyModel,
    });
    if (existing.input_fingerprint === legacyFingerprint) {
      return { kind: "legacy", fingerprint: inputFingerprint };
    }
  }

  return null;
}

async function summarizePeriod({ supabase, apiKey, model, language, period }) {
  const { fetchedDate, rows } = await fetchGithubReposForPeriod(supabase, period);
  if (!fetchedDate || rows.length === 0) {
    console.log(`[${period}] No rows in DB — skip`);
    return { period, status: "empty" };
  }

  const inputRows = buildGithubDigestInput(rows);
  const inputFingerprint = fingerprintGithubInput(inputRows, {
    promptVersion: PROMPT_VERSION,
    language,
  });

  const meta = { source: "github", period, fetchedDate };
  const existingDb = await fetchExistingTrendAiDigest(supabase, meta);
  const cachedLocal = readLocalDigestCache(meta);

  const dbMatch = shouldForceRefresh()
    ? null
    : matchDigestFingerprint(existingDb, inputRows, inputFingerprint, model, language);

  if (dbMatch) {
    if (dbMatch.kind === "legacy") {
      await upsertTrendAiDigest(supabase, {
        source: "github",
        period,
        fetched_date: fetchedDate,
        headline: existingDb.headline,
        summary: existingDb.summary,
        keywords: existingDb.keywords ?? [],
        model: existingDb.model || model,
        prompt_version: existingDb.prompt_version || PROMPT_VERSION,
        input_fingerprint: inputFingerprint,
      });
      console.log(
        `[${period}] DB fingerprint match (legacy→migrated ${inputFingerprint.slice(0, 12)}…) — skip Gemini (${rows.length} repos, ${fetchedDate})`,
      );
    } else {
      console.log(
        `[${period}] DB fingerprint match (${inputFingerprint.slice(0, 12)}…) — skip Gemini (${rows.length} repos, ${fetchedDate})`,
      );
    }
    return { period, status: "skipped", fetchedDate, fingerprint: inputFingerprint };
  }

  const localMatch = shouldForceRefresh()
    ? null
    : matchDigestFingerprint(cachedLocal, inputRows, inputFingerprint, model, language);

  if (localMatch) {
    console.log(
      `[${period}] local cache match — upserting to DB without Gemini (${rows.length} repos, ${fetchedDate})`,
    );
    const upserted = await upsertTrendAiDigest(supabase, {
      source: "github",
      period,
      fetched_date: fetchedDate,
      headline: cachedLocal.headline,
      summary: cachedLocal.summary,
      keywords: cachedLocal.keywords ?? [],
      model: cachedLocal.model || model,
      prompt_version: cachedLocal.prompt_version || PROMPT_VERSION,
      input_fingerprint: inputFingerprint,
    });
    console.log(`[${period}] upserted id=${upserted.id}`);
    return { period, status: "upserted_from_cache", fetchedDate, fingerprint: inputFingerprint };
  }

  console.log(
    `[${period}] fingerprint changed — calling Gemini (${rows.length} repos, ${fetchedDate}, lang=${language})`,
  );

  const { systemText, userText } = buildGithubPrompt({
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
    source: "github",
    period,
    fetched_date: fetchedDate,
    headline: normalized.headline,
    summary: normalized.summary,
    keywords: normalized.keywords,
    model: usedModel,
    prompt_version: PROMPT_VERSION,
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
    `GitHub AI digest — periods: ${periods.join(", ")}, model: ${model}, language: ${language}`,
  );

  const results = [];
  for (const period of periods) {
    try {
      results.push(await summarizePeriod({ supabase, apiKey, model, language, period }));
    } catch (error) {
      console.error(`[${period}] FAILED:`, error.message);
      const soft = isGeminiSoftFailError(error);
      results.push({
        period,
        status: soft ? "soft_fail" : "error",
        error: error.message,
      });
      if (soft) {
        console.warn(`[${period}] Gemini soft-fail — keeping previous digests and stopping further calls`);
        break;
      }
    }
  }

  const hardFailed = results.filter((item) => item.status === "error");
  const softFailed = results.filter((item) => item.status === "soft_fail");
  console.log("Done:", results.map((item) => `${item.period}=${item.status}`).join(", "));
  // Quota/503 should not fail the workflow; feed sync already succeeded.
  if (hardFailed.length > 0 && hardFailed.length + softFailed.length === results.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
