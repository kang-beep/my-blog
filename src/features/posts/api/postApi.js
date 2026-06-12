// posts 도메인 Supabase 접근 함수 모음
import { supabase } from "@/shared/lib/supabaseClient";

const POST_LIST_FIELDS =
  "id, title, slug, excerpt, status, published_at, content, category, category_id, tags, image_url, like_count, created_at, updated_at";

const POST_CARD_FIELDS =
  "id, title, category, tags, image_url, like_count, created_at";

function mapPost(record) {
  return {
    ...record,
    tags: Array.isArray(record.tags) ? record.tags : [],
    like_count: record.like_count ?? 0,
  };
}

export async function fetchPosts({ category, tag } = {}) {
  let query = supabase
    .from("posts")
    .select(POST_LIST_FIELDS)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }
  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map(mapPost);
}

export async function fetchPostById(postId) {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_LIST_FIELDS)
    .eq("id", postId)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  return mapPost(data);
}

export async function fetchCategories() {
  const managed = await supabase
    .from("categories")
    .select("id, name")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });
  if (!managed.error && managed.data && managed.data.length > 0) {
    return managed.data.map((item) => item.name);
  }
  const fallback = await supabase.from("posts").select("category");
  if (fallback.error) {
    throw new Error(fallback.error.message);
  }
  const unique = new Set((fallback.data ?? []).map((item) => item.category).filter(Boolean));
  return [...unique];
}

export async function fetchCategorySections(limitPerCategory = 3) {
  const categories = await fetchCategories();
  const sections = await Promise.all(
    categories.map(async (category) => {
      const { data, error } = await supabase
        .from("posts")
        .select(POST_CARD_FIELDS)
        .eq("category", category)
        .order("created_at", { ascending: false })
        .limit(limitPerCategory);
      if (error) {
        throw new Error(error.message);
      }
      return { category, posts: (data ?? []).map(mapPost) };
    })
  );
  return sections;
}

export async function fetchAdjacentPosts(createdAt) {
  const [previousResult, nextResult] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, created_at")
      .lt("created_at", createdAt)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("id, title, created_at")
      .gt("created_at", createdAt)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (previousResult.error) {
    throw new Error(previousResult.error.message);
  }
  if (nextResult.error) {
    throw new Error(nextResult.error.message);
  }

  return {
    previousPost: previousResult.data,
    nextPost: nextResult.data,
  };
}
