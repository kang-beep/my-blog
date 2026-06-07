// 카테고리 관리 API
import { supabase } from "@/shared/lib/supabaseClient";

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
