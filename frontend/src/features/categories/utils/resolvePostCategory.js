import { DEFAULT_POST_CATEGORY_NAME } from "@/shared/constants/categories";

export function findCategoryByName(categories, name) {
  return categories.find((item) => item.name === name);
}

export function resolvePostCategoryFields(categories, categoryId) {
  if (categoryId) {
    const selected = categories.find((item) => item.id === categoryId);
    if (selected) {
      return { category_id: selected.id, category: selected.name };
    }
  }

  const fallback = findCategoryByName(categories, DEFAULT_POST_CATEGORY_NAME);
  if (!fallback) {
    throw new Error(`The "${DEFAULT_POST_CATEGORY_NAME}" category is missing. Please try again shortly.`);
  }

  return { category_id: fallback.id, category: fallback.name };
}
