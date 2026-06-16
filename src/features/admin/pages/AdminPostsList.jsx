// 관리자 포스트 목록 페이지
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import AdminPostsListItem from "@/features/admin/components/AdminPostsListItem";
import CategoryManager from "@/features/admin/components/CategoryManager";
import { fetchAdminPosts } from "@/features/admin/api/adminPostApi";
import PostsCategoryTabs from "@/features/posts/components/PostsCategoryTabs";
import { POSTS_CATEGORY_ALL, POSTS_PER_PAGE } from "@/features/posts/constants/postsList";
import { filterPostsByCategory, filterPostsBySearch } from "@/features/posts/utils/filterPosts";
import { mergeCategoryNames, paginatePosts, parsePostsPage } from "@/features/posts/utils/postsList";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "@/features/categories/api/categoryApi";
import { ROUTES } from "@/shared/constants/routes";
import Pagination from "@/shared/ui/Pagination";

export default function AdminPostsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || POSTS_CATEGORY_ALL;
  const page = parsePostsPage(searchParams.get("page"));

  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoryBusy, setIsCategoryBusy] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [items, categoryItems] = await Promise.all([fetchAdminPosts(), fetchCategories()]);
      setPosts(items);
      setCategories(categoryItems);
    } catch (requestError) {
      setError(requestError.message || "글 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const tabCategories = useMemo(
    () => mergeCategoryNames(
      categories.map((item) => item.name),
      posts,
    ),
    [categories, posts],
  );

  const filteredPosts = useMemo(() => {
    let result = posts;
    result = filterPostsBySearch(result, searchQuery);
    result = filterPostsByCategory(result, category);
    return result;
  }, [posts, searchQuery, category]);

  const { posts: paginatedPosts, totalPages, currentPage, totalCount } = useMemo(
    () => paginatePosts(filteredPosts, page, POSTS_PER_PAGE),
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

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (searchParams.get("page")) {
      const next = new URLSearchParams(searchParams);
      next.delete("page");
      setSearchParams(next, { replace: true });
    }
  };

  const reloadPosts = async () => {
    const items = await fetchAdminPosts();
    setPosts(items);
  };

  const handleAddCategory = async (name) => {
    setIsCategoryBusy(true);
    try {
      const added = await createCategory(name);
      setCategories((prev) => [...prev, added].sort((a, b) => a.sort_order - b.sort_order));
      return added;
    } finally {
      setIsCategoryBusy(false);
    }
  };

  const handleUpdateCategory = async (categoryId, name) => {
    setIsCategoryBusy(true);
    try {
      const updated = await updateCategory(categoryId, name);
      setCategories((prev) =>
        prev
          .map((item) => (item.id === categoryId ? updated : item))
          .sort((a, b) => a.sort_order - b.sort_order),
      );
      await reloadPosts();
      return updated;
    } finally {
      setIsCategoryBusy(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    setIsCategoryBusy(true);
    try {
      const deletedName = categories.find((item) => item.id === categoryId)?.name;
      await deleteCategory(categoryId);
      setCategories((prev) => prev.filter((item) => item.id !== categoryId));
      await reloadPosts();
      if (deletedName && category === deletedName) {
        selectCategory(POSTS_CATEGORY_ALL);
      }
    } finally {
      setIsCategoryBusy(false);
    }
  };

  const hasActiveFilter = Boolean(category || searchQuery.trim());

  return (
    <section className="space-y-4">
      <CategoryManager
        categories={categories}
        onAdd={handleAddCategory}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
        isBusy={isCategoryBusy}
      />

      <section className="border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
          <h1 className="text-xl font-semibold text-slate-900">포스트</h1>
          <Link className="btn btn-primary shrink-0" to={ROUTES.ADMIN_POSTS_NEW}>
            + 글 추가
          </Link>
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
              placeholder="제목, 카테고리, 태그 검색"
              aria-label="글 검색"
            />
          </label>

          {isLoading ? <p className="text-sm text-slate-500">글 목록을 불러오는 중입니다...</p> : null}
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}

          {!isLoading && !error && filteredPosts.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
              {hasActiveFilter ? "조건에 맞는 글이 없습니다." : "등록된 글이 없습니다."}
            </p>
          ) : null}

          {!isLoading && !error && paginatedPosts.length > 0 ? (
            <>
              <p className="text-xs text-slate-500 sm:text-sm">
                {totalCount}개
                {category ? (
                  <>
                    {" "}
                    · <span className="font-medium text-slate-700">{category}</span>
                  </>
                ) : null}
              </p>

              <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                {paginatedPosts.map((post) => (
                  <AdminPostsListItem key={post.id} post={post} />
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
    </section>
  );
}
