// 글 좋아요 API: post_likes + posts.like_count
import { supabase } from "@/shared/lib/supabaseClient";

const UNIQUE_VIOLATION_CODE = "23505";

export async function fetchHasLiked(postId, visitorKey) {
  const { data, error } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("visitor_key", visitorKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function likePost(postId, visitorKey) {
  const { error } = await supabase.from("post_likes").insert({
    post_id: postId,
    visitor_key: visitorKey,
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION_CODE) {
      return { alreadyLiked: true };
    }
    throw new Error(error.message);
  }

  return { alreadyLiked: false };
}

export async function unlikePost(postId, visitorKey) {
  const { error, count } = await supabase
    .from("post_likes")
    .delete({ count: "exact" })
    .eq("post_id", postId)
    .eq("visitor_key", visitorKey);

  if (error) {
    throw new Error(error.message);
  }

  return { removed: (count ?? 0) > 0 };
}

export async function fetchPostLikeCount(postId) {
  const { data, error } = await supabase
    .from("posts")
    .select("like_count")
    .eq("id", postId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data?.like_count ?? 0;
}
