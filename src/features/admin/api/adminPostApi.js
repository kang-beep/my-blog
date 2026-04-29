// 관리자 글 등록/수정/삭제 전용 API 함수 모음
import { supabase } from "../../../shared/lib/supabaseClient";

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

export async function uploadPostImage(file) {
  const extension = file.name.includes(".")
    ? file.name.split(".").pop().toLowerCase()
    : "jpg";
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const filePath = `post-images/${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, file, {
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);
  return data.publicUrl;
}
