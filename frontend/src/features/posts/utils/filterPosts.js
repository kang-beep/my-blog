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
