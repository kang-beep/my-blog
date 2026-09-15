export function selectTopHuggingFaceDailyPapers(items, limit) {
  if (!Array.isArray(items)) {
    return [];
  }

  return [...items]
    .sort((left, right) => (right.upvotes ?? 0) - (left.upvotes ?? 0))
    .slice(0, limit);
}
