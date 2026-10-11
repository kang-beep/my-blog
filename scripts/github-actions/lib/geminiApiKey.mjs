const GEMINI_SECRET_KEY = "gemini_api_key";
const GEMINI_OUTPUT_LANGUAGE_KEY = "gemini_output_language";
export const DEFAULT_GEMINI_OUTPUT_LANGUAGE = "en";

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

/**
 * Load digest output language (`en` | `ko`).
 * 1. process.env.GEMINI_OUTPUT_LANGUAGE
 * 2. admin_secrets.gemini_output_language
 * 3. default `en`
 */
export async function loadGeminiOutputLanguage(supabase) {
  const fromEnv = normalizeLanguage(process.env.GEMINI_OUTPUT_LANGUAGE);
  if (fromEnv) {
    return fromEnv;
  }

  if (!supabase) {
    return DEFAULT_GEMINI_OUTPUT_LANGUAGE;
  }

  const { data, error } = await supabase
    .from("admin_secrets")
    .select("value")
    .eq("key", GEMINI_OUTPUT_LANGUAGE_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to read admin_secrets.${GEMINI_OUTPUT_LANGUAGE_KEY}: ${error.message}`,
    );
  }

  return normalizeLanguage(data?.value) || DEFAULT_GEMINI_OUTPUT_LANGUAGE;
}

function normalizeLanguage(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "en" || normalized === "ko") {
    return normalized;
  }
  return null;
}

function isUsableKey(key) {
  return Boolean(key) && key.length >= 20;
}
