// 프로필 및 사이트 설정 관리 API
import { supabase } from "../../../shared/lib/supabaseClient";

export async function fetchProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, headline, bio, avatar_url, github_url, email, updated_at")
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function upsertProfile(payload) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function uploadProfileImage(file) {
  const extension = file.name.includes(".")
    ? file.name.split(".").pop().toLowerCase()
    : "jpg";
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const path = `profile-images/${fileName}`;
  const { error } = await supabase.storage.from("profile-images").upload(path, file, {
    upsert: false,
  });
  if (error) {
    throw new Error(error.message);
  }
  const { data } = supabase.storage.from("profile-images").getPublicUrl(path);
  return data.publicUrl;
}
