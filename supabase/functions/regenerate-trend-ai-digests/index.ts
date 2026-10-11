import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  corsHeaders,
  createServiceClient,
  getGeminiApiKey,
  jsonResponse,
  normalizeGeminiOutputLanguage,
  requireAuthedUser,
  saveGeminiOutputLanguage,
} from "../_shared/adminAuthSecrets.ts";
import { regenerateGithubDigestsForLanguage } from "../_shared/githubTrendDigest.ts";
import { regenerateHuggingfaceDigestsForLanguage } from "../_shared/huggingfaceTrendDigest.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, error: authError } = await requireAuthedUser(req);
    if (!user) {
      return jsonResponse({ error: authError ?? "Unauthorized" }, 401);
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json().catch(() => ({}));
    const language = normalizeGeminiOutputLanguage(body?.language);
    await saveGeminiOutputLanguage(language);

    const apiKey = await getGeminiApiKey();
    const supabase = createServiceClient();

    const [githubResults, huggingfaceResults] = await Promise.all([
      regenerateGithubDigestsForLanguage({ supabase, apiKey, language }),
      regenerateHuggingfaceDigestsForLanguage({ supabase, apiKey, language }),
    ]);

    const results = [...githubResults, ...huggingfaceResults];
    const failed = results.filter((item) => item.status === "error");
    const actionable = results.filter((item) => item.status !== "empty");

    if (actionable.length > 0 && failed.length === actionable.length) {
      return jsonResponse(
        {
          error: "All digest regenerations failed.",
          language,
          results,
        },
        500,
      );
    }

    return jsonResponse({
      ok: true,
      language,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
