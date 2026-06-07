// 관리자 글 등록/수정/삭제 전용 API 함수 모음
import { supabase } from "@/shared/lib/supabaseClient";
import { STORAGE_BUCKETS } from "@/shared/constants/storage";
import {
  formatStorageError,
  getImageExtension,
  resolveImageContentType,
} from "@/shared/lib/storageUpload";

export async function createPost(payload) {
  const { data, error } = await supabase
    .from("posts")
    .insert(payload)
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updatePost(postId, payload) {
  const { data, error } = await supabase
    .from("posts")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .select("id")
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function deletePost(postId) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchAdminPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, content, category, category_id, tags, image_url, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((item) => ({
    ...item,
    tags: Array.isArray(item.tags) ? item.tags : [],
  }));
}

export async function uploadPostImage(file, postId) {
  if (!postId) {
    throw new Error("이미지 업로드에는 글 ID가 필요합니다.");
  }

  const extension = getImageExtension(file.name);
  const contentType = resolveImageContentType(file, extension);
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const filePath = `${postId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKETS.POSTS)
    .upload(filePath, file, {
      upsert: false,
      contentType,
    });

  if (uploadError) {
    throw new Error(formatStorageError(uploadError));
  }

  const { data } = supabase.storage.from(STORAGE_BUCKETS.POSTS).getPublicUrl(filePath);
  return data.publicUrl;
}
