import { supabase } from "@/shared/lib/supabaseClient";

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
