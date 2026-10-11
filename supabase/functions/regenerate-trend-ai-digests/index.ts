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
    const results = await regenerateGithubDigestsForLanguage({
      supabase,
      apiKey,
      language,
    });

    const failed = results.filter((item) => item.status === "error");
    if (failed.length === results.length) {
      return jsonResponse(
        {
          error: "All periods failed to regenerate.",
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
