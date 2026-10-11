import { supabase } from "@/shared/lib/supabaseClient";
import {
  ADMIN_SECRET_KEYS,
  DEFAULT_GEMINI_OUTPUT_LANGUAGE,
  GEMINI_OUTPUT_LANGUAGES,
} from "@/shared/constants/adminSecrets";

export async function listAdminSecrets() {
  const { data, error } = await supabase.rpc("list_admin_secrets");
  if (error) {
    throw new Error(error.message || "Failed to list admin secrets.");
  }
  return data ?? [];
}

export async function upsertAdminSecret(key, value) {
  const { error } = await supabase.rpc("upsert_admin_secret", {
    p_key: key,
    p_value: value,
  });
  if (error) {
    throw new Error(error.message || "Failed to save secret.");
  }
}

export async function deleteAdminSecret(key) {
  const { error } = await supabase.rpc("delete_admin_secret", {
    p_key: key,
  });
  if (error) {
    throw new Error(error.message || "Failed to delete secret.");
  }
}

function normalizeGeminiOutputLanguage(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === GEMINI_OUTPUT_LANGUAGES.KO) {
    return GEMINI_OUTPUT_LANGUAGES.KO;
  }
  if (normalized === GEMINI_OUTPUT_LANGUAGES.EN) {
    return GEMINI_OUTPUT_LANGUAGES.EN;
  }
  return DEFAULT_GEMINI_OUTPUT_LANGUAGE;
}

/**
 * Read Gemini output language from list_admin_secrets.
 * That key is returned unmasked (not an API secret).
 */
export async function getGeminiOutputLanguage() {
  const rows = await listAdminSecrets();
  const row = rows.find((item) => item.key === ADMIN_SECRET_KEYS.GEMINI_OUTPUT_LANGUAGE);
  if (!row?.masked_value) {
    return DEFAULT_GEMINI_OUTPUT_LANGUAGE;
  }
  return normalizeGeminiOutputLanguage(row.masked_value);
}

export async function saveGeminiOutputLanguage(language) {
  const normalized = normalizeGeminiOutputLanguage(language);
  await upsertAdminSecret(ADMIN_SECRET_KEYS.GEMINI_OUTPUT_LANGUAGE, normalized);
  return normalized;
}
