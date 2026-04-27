// comments 도메인 Supabase 접근 함수 모음
import { supabase } from "../../../shared/lib/supabaseClient";

export async function fetchCommentsByPostId(postId) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, nickname, content, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createComment(payload) {
  const { error } = await supabase.from("comments").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) {
    throw new Error(error.message);
  }
}
