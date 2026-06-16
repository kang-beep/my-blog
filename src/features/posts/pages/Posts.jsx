// Posts list: category tabs, search, pagination
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import PostsCategoryTabs from "@/features/posts/components/PostsCategoryTabs";
import PostsListItem from "@/features/posts/components/PostsListItem";
import { POSTS_CATEGORY_ALL } from "@/features/posts/constants/postsList";
import { fetchCategories, fetchPosts } from "@/features/posts/api/postApi";
import {
  filterPostsByCategory,
  filterPostsBySearch,
  filterPostsByTag,
} from "@/features/posts/utils/filterPosts";
import { mergeCategoryNames, paginatePosts, parsePostsPage } from "@/features/posts/utils/postsList";
import Pagination from "@/shared/ui/Pagination";

export default function Posts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || POSTS_CATEGORY_ALL;
  const tag = searchParams.get("tag") || "";
  const page = parsePostsPage(searchParams.get("page"));

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [items, categoryItems] = await Promise.all([fetchPosts(), fetchCategories()]);
        setPosts(items);
        setCategories(categoryItems);
      } catch (requestError) {
        setError(requestError.message || "Failed to load posts.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const tabCategories = useMemo(
    () => mergeCategoryNames(categories, posts),
    [categories, posts],
  );

  const filteredPosts = useMemo(() => {
    let result = posts;
    result = filterPostsBySearch(result, searchQuery);
    result = filterPostsByCategory(result, category);
    result = filterPostsByTag(result, tag);
    return result;
  }, [posts, searchQuery, category, tag]);

  const { posts: paginatedPosts, totalPages, currentPage, totalCount } = useMemo(
    () => paginatePosts(filteredPosts, page),
    [filteredPosts, page],
  );

  const updateSearchParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    setSearchParams(next);
  };

  const selectCategory = (nextCategory) => {
    updateSearchParams({
      category: nextCategory === POSTS_CATEGORY_ALL ? "" : nextCategory,
      page: "",
    });
  };

  const selectPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) {
      return;
    }
    updateSearchParams({ page: nextPage === 1 ? "" : String(nextPage) });
  };

  const clearUrlFilter = (key) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    next.delete("page");
    setSearchParams(next);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (searchParams.get("page")) {
      const next = new URLSearchParams(searchParams);
      next.delete("page");
      setSearchParams(next, { replace: true });
    }
  };

  const hasActiveFilter = Boolean(category || tag || searchQuery.trim());

  return (
    <section className="border border-slate-400 bg-white shadow-sm">
      <div className="border-b border-neutral-500 bg-neutral-600 px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold text-white">Posts</h1>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
        <PostsCategoryTabs
          categories={tabCategories}
          selectedCategory={category}
          onSelect={selectCategory}
        />

        <label className="relative block">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            className="input pl-10"
            type="search"
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search by title, category, or tag"
            aria-label="Search posts"
          />
        </label>

        {tag ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <span>
              Tag: <span className="font-medium text-slate-900">#{tag}</span>
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-500"
              onClick={() => clearUrlFilter("tag")}
            >
              <X size={14} aria-hidden />
              Clear
            </button>
          </p>
        ) : null}

        {isLoading ? <p className="text-sm text-slate-500">Loading posts...</p> : null}
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}

        {!isLoading && !error && filteredPosts.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            {hasActiveFilter ? "No posts match your filters." : "No posts yet."}
          </p>
        ) : null}

        {!isLoading && !error && paginatedPosts.length > 0 ? (
          <>
            <p className="text-xs text-slate-500 sm:text-sm">
              {totalCount} post{totalCount === 1 ? "" : "s"}
              {category ? (
                <>
                  {" "}
                  in <span className="font-medium text-slate-700">{category}</span>
                </>
              ) : null}
            </p>

            <ul className="divide-y divide-slate-200 rounded-lg border border-slate-400">
              {paginatedPosts.map((post) => (
                <PostsListItem key={post.id} post={post} />
              ))}
            </ul>

            <div className="pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={selectPage}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
