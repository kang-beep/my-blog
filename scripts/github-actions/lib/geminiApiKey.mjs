const GEMINI_SECRET_KEY = "gemini_api_key";

/**
 * Load Gemini API key from (first match wins):
 * 1. process.env.GEMINI_API_KEY
 * 2. public.admin_secrets (Admin Settings UI) via service_role
 */
export async function loadGeminiApiKey(supabase) {
  const fromEnv = process.env.GEMINI_API_KEY?.trim();
  if (isUsableKey(fromEnv)) {
    return fromEnv;
  }

  if (!supabase) {
    throw new Error(
      "Gemini API key not found. Set GEMINI_API_KEY or pass a Supabase service client to read admin_secrets.",
    );
  }

  const { data, error } = await supabase
    .from("admin_secrets")
    .select("value")
    .eq("key", GEMINI_SECRET_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read admin_secrets.${GEMINI_SECRET_KEY}: ${error.message}`);
  }

  const key = String(data?.value ?? "").trim();
  if (!isUsableKey(key)) {
    throw new Error(
      `Gemini API key not set. Add "${GEMINI_SECRET_KEY}" in Admin → Settings, or set GEMINI_API_KEY.`,
    );
  }

  return key;
}

function isUsableKey(key) {
  return Boolean(key) && key.length >= 20;
}
