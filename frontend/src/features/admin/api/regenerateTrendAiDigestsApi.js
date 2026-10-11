import { supabase } from "@/shared/lib/supabaseClient";

const REGENERATE_TREND_AI_DIGESTS_FUNCTION = "regenerate-trend-ai-digests";

async function readFunctionErrorBody(error) {
  if (!error?.context || typeof error.context.json !== "function") {
    return null;
  }

  try {
    return await error.context.json();
  } catch {
    return null;
  }
}

async function formatFunctionInvokeError(error) {
  if (!error) {
    return "Failed to regenerate AI digests.";
  }

  const body = await readFunctionErrorBody(error);
  if (body?.error) {
    return String(body.error);
  }

  const status = error.context?.status;
  if (status === 401) {
    return "Unauthorized. Sign in again as admin.";
  }
  if (status === 404) {
    return `Edge Function "${REGENERATE_TREND_AI_DIGESTS_FUNCTION}" not found. Deploy it on Supabase.`;
  }
  if (status) {
    return `${error.message || "Edge Function request failed."} (HTTP ${status})`;
  }

  return error.message || "Failed to regenerate AI digests.";
}

/**
 * Save language on the server and regenerate GitHub trend AI digests now.
 */
export async function regenerateTrendAiDigestsNow(language) {
  const { data, error } = await supabase.functions.invoke(
    REGENERATE_TREND_AI_DIGESTS_FUNCTION,
    {
      body: { language },
    },
  );

  if (error) {
    throw new Error(await formatFunctionInvokeError(error));
  }

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return data;
}
