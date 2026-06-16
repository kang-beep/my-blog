// 카테고리 관리 API
import { supabase } from "@/shared/lib/supabaseClient";
import { DEFAULT_POST_CATEGORY_NAME } from "@/shared/constants/categories";
import { findCategoryByName } from "@/features/categories/utils/resolvePostCategory";

function toSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_가-힣]/g, "");
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, sort_order, is_visible")
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function ensureDefaultCategory() {
  const categories = await fetchCategories();
  const existing = findCategoryByName(categories, DEFAULT_POST_CATEGORY_NAME);
  if (existing) {
    return existing;
  }

  return createCategory(DEFAULT_POST_CATEGORY_NAME);
}

export async function createCategory(name) {
  const payload = {
    name: name.trim(),
    slug: toSlug(name),
    is_visible: true,
  };
  const { data, error } = await supabase.from("categories").insert(payload).select("*").single();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function updateCategory(id, name) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("카테고리 이름을 입력해 주세요.");
  }

  const { data, error } = await supabase
    .from("categories")
    .update({
      name: trimmedName,
      slug: toSlug(trimmedName),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: postsError } = await supabase
    .from("posts")
    .update({ category: trimmedName })
    .eq("category_id", id);

  if (postsError) {
    throw new Error(postsError.message);
  }

  return data;
}

export async function deleteCategory(id) {
  const categories = await fetchCategories();
  const defaultCategory = findCategoryByName(categories, DEFAULT_POST_CATEGORY_NAME)
    ?? (await ensureDefaultCategory());

  if (id === defaultCategory.id) {
    throw new Error(`"${DEFAULT_POST_CATEGORY_NAME}" 카테고리는 삭제할 수 없습니다.`);
  }

  const { error: unlinkError } = await supabase
    .from("posts")
    .update({ category_id: defaultCategory.id, category: defaultCategory.name })
    .eq("category_id", id);

  if (unlinkError) {
    throw new Error(unlinkError.message);
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
}
