// 프로필 및 사이트 설정 관리 API
import { supabase } from "@/shared/lib/supabaseClient";
import { STORAGE_BUCKETS } from "@/shared/constants/storage";
import {
  formatStorageError,
  getImageExtension,
  resolveImageContentType,
} from "@/shared/lib/storageUpload";

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
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error("이미지 업로드는 로그인 후에 가능합니다.");
  }

  const extension = getImageExtension(file.name);
  const contentType = resolveImageContentType(file, extension);
  const fileName = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKETS.PROFILE).upload(fileName, file, {
    upsert: false,
    contentType,
  });
  if (error) {
    throw new Error(formatStorageError(error));
  }

  const { data } = supabase.storage.from(STORAGE_BUCKETS.PROFILE).getPublicUrl(fileName);
  return data.publicUrl;
}
