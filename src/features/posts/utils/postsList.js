import { POSTS_PER_PAGE } from "@/features/posts/constants/postsList";

export function parsePostsPage(value) {
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return parsed;
}

export function paginatePosts(posts, page, pageSize = POSTS_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(posts.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    posts: posts.slice(start, start + pageSize),
    totalPages,
    currentPage,
    totalCount: posts.length,
  };
}

export function mergeCategoryNames(orderedCategories, posts) {
  const names = [...orderedCategories];
  const known = new Set(names);

  for (const post of posts) {
    const name = post.category?.trim();
    if (name && !known.has(name)) {
      known.add(name);
      names.push(name);
    }
  }

  return names;
}
