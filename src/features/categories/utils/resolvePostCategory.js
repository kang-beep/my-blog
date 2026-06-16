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
    throw new Error(`"${DEFAULT_POST_CATEGORY_NAME}" 카테고리가 없습니다. 잠시 후 다시 시도해 주세요.`);
  }

  return { category_id: fallback.id, category: fallback.name };
}
