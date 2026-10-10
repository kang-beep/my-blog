export function filterPostsBySearch(posts, query) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) {
    return posts;
  }

  return posts.filter((post) => {
    const title = post.title?.toLowerCase() ?? "";
    const category = post.category?.toLowerCase() ?? "";
    const tags = (post.tags ?? []).some((tag) => tag.toLowerCase().includes(keyword));
    return title.includes(keyword) || category.includes(keyword) || tags;
  });
}

export function filterPostsByCategory(posts, category) {
  if (!category) {
    return posts;
  }
  return posts.filter((post) => post.category === category);
}

export function filterPostsByTag(posts, tag) {
  const normalizedTag = tag?.trim().toLowerCase();
  if (!normalizedTag) {
    return posts;
  }
  return posts.filter((post) =>
    (post.tags ?? []).some((postTag) => postTag?.trim().toLowerCase() === normalizedTag),
  );
}

export function groupPostsByCategory(posts, categoryOrder = []) {
  const grouped = new Map();

  posts.forEach((post) => {
    const category = post.category?.trim() || "Uncategorized";
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category).push(post);
  });

  const orderedCategories = [
    ...categoryOrder.filter((name) => grouped.has(name)),
    ...[...grouped.keys()]
      .filter((name) => !categoryOrder.includes(name))
      .sort((a, b) => a.localeCompare(b, "ko")),
  ];

  return orderedCategories
    .map((category) => ({
      category,
      posts: grouped.get(category) ?? [],
    }))
    .filter((section) => section.posts.length > 0);
}
