// 글 목록: 검색 + 카테고리별 아코디언
import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import PostsCategorySection from "@/features/posts/components/PostsCategorySection";
import { fetchCategories, fetchPosts } from "@/features/posts/api/postApi";
import {
  filterPostsByCategory,
  filterPostsBySearch,
  filterPostsByTag,
  groupPostsByCategory,
} from "@/features/posts/utils/filterPosts";

export default function Posts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";

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
        setError(requestError.message || "글 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const filteredPosts = useMemo(() => {
    let result = posts;
    result = filterPostsBySearch(result, searchQuery);
    result = filterPostsByCategory(result, category);
    result = filterPostsByTag(result, tag);
    return result;
  }, [posts, searchQuery, category, tag]);

  const sections = useMemo(
    () => groupPostsByCategory(filteredPosts, categories),
    [filteredPosts, categories],
  );

  const clearUrlFilter = (key) => {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    setSearchParams(next);
  };

  const hasActiveFilter = Boolean(category || tag || searchQuery.trim());

  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold text-slate-900">글 목록</h1>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
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
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="제목, 카테고리, 태그 검색"
            aria-label="글 검색"
          />
        </label>

        {category ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <span>
              카테고리: <span className="font-medium text-slate-900">{category}</span>
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-500"
              onClick={() => clearUrlFilter("category")}
            >
              <X size={14} aria-hidden />
              해제
            </button>
          </p>
        ) : null}

        {tag ? (
          <p className="flex items-center gap-2 text-sm text-slate-600">
            <span>
              태그: <span className="font-medium text-slate-900">#{tag}</span>
            </span>
            <button
              type="button"
              className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-500"
              onClick={() => clearUrlFilter("tag")}
            >
              <X size={14} aria-hidden />
              해제
            </button>
          </p>
        ) : null}

        {isLoading ? <p className="text-sm text-slate-500">글 목록을 불러오는 중입니다...</p> : null}
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}

        {!isLoading && !error && sections.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            {hasActiveFilter ? "조건에 맞는 글이 없습니다." : "등록된 글이 없습니다."}
          </p>
        ) : null}

        {!isLoading && !error ? (
          <div className="space-y-3">
            {sections.map((section) => (
              <PostsCategorySection
                key={section.category}
                category={section.category}
                posts={section.posts}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
