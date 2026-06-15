export function selectTopGithubTrendingRepos(items, limit) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.slice(0, limit);
}
