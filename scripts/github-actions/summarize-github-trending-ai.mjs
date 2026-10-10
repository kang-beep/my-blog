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
 *   GEMINI_MODEL                      (optional; default gemini-flash-latest)
 *   FORCE_REFRESH=true                (optional; ignore fingerprint skip)
 */
import { createServiceSupabaseClient } from "./lib/supabase.mjs";
import { loadGeminiApiKey } from "./lib/geminiApiKey.mjs";
import { generateJsonWithGemini, getGeminiModelName } from "./lib/geminiClient.mjs";
import {
  PROMPT_VERSION,
  buildGithubDigestInput,
  buildGithubPrompt,
  ensureTempDirs,
  fetchExistingTrendAiDigest,
  fetchGithubReposForPeriod,
  fingerprintGithubInput,
  fingerprintGithubInputLegacy,
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
 * Match current fingerprint, or legacy fingerprints that included `model`.
 * Returns which fingerprint matched so callers can migrate DB rows without Gemini.
 */
function matchDigestFingerprint(existing, inputRows, inputFingerprint, model) {
  if (!hasUsableDigest(existing)) {
    return null;
  }
  if (existing.input_fingerprint === inputFingerprint) {
    return { kind: "current", fingerprint: inputFingerprint };
  }

  const legacyModels = [...new Set([existing.model, model, "gemini-3.8-flash"].filter(Boolean))];
  for (const legacyModel of legacyModels) {
    const legacyFingerprint = fingerprintGithubInputLegacy(inputRows, {
      promptVersion: existing.prompt_version || PROMPT_VERSION,
      model: legacyModel,
    });
    if (existing.input_fingerprint === legacyFingerprint) {
      return { kind: "legacy", fingerprint: inputFingerprint };
    }
  }

  return null;
}

async function summarizePeriod({ supabase, apiKey, model, period }) {
  const { fetchedDate, rows } = await fetchGithubReposForPeriod(supabase, period);
  if (!fetchedDate || rows.length === 0) {
    console.log(`[${period}] No rows in DB — skip`);
    return { period, status: "empty" };
  }

  const inputRows = buildGithubDigestInput(rows);
  const inputFingerprint = fingerprintGithubInput(inputRows, {
    promptVersion: PROMPT_VERSION,
  });

  const meta = { source: "github", period, fetchedDate };
  const existingDb = await fetchExistingTrendAiDigest(supabase, meta);
  const cachedLocal = readLocalDigestCache(meta);

  const dbMatch = shouldForceRefresh()
    ? null
    : matchDigestFingerprint(existingDb, inputRows, inputFingerprint, model);

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
    : matchDigestFingerprint(cachedLocal, inputRows, inputFingerprint, model);

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
    `[${period}] fingerprint changed — calling Gemini (${rows.length} repos, ${fetchedDate})`,
  );

  const { systemText, userText } = buildGithubPrompt({
    period,
    fetchedDate,
    inputRows,
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

  console.log(`GitHub AI digest — periods: ${periods.join(", ")}, model: ${model}`);

  const results = [];
  for (const period of periods) {
    try {
      results.push(await summarizePeriod({ supabase, apiKey, model, period }));
    } catch (error) {
      console.error(`[${period}] FAILED:`, error.message);
      results.push({ period, status: "error", error: error.message });
    }
  }

  const failed = results.filter((item) => item.status === "error");
  console.log("Done:", results.map((item) => `${item.period}=${item.status}`).join(", "));
  if (failed.length === results.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
