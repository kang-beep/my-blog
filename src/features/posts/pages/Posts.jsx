// 글 목록 페이지: 카테고리/태그 필터 기반 게시글 탐색
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PostList from "../components/PostList";
import { fetchCategories } from "../api/postApi";
import { usePosts } from "../hooks/usePosts";

export default function Posts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState("");
  const { posts, isLoading, error } = usePosts({ category, tag });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const items = await fetchCategories();
        setCategories(items);
      } catch (requestError) {
        setCategoryError(requestError.message || "카테고리를 불러오지 못했습니다.");
      }
    };
    void loadCategories();
  }, []);

  const uniqueTags = useMemo(() => {
    const tagSet = new Set();
    posts.forEach((post) => {
      (post.tags ?? []).forEach((item) => tagSet.add(item));
    });
    return [...tagSet];
  }, [posts]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  return (
    <section className="space-y-4">
      <h1>글 목록</h1>
      <div className="flex flex-wrap gap-2">
        <button className="btn" type="button" onClick={() => updateFilter("category", "")}>
          전체 카테고리
        </button>
        {categories.map((item) => (
          <button
            className="btn"
            type="button"
            key={item}
            onClick={() => updateFilter("category", item)}
            disabled={item === category}
          >
            {item}
          </button>
        ))}
      </div>
      {categoryError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{categoryError}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button className="btn" type="button" onClick={() => updateFilter("tag", "")}>
          전체 태그
        </button>
        {uniqueTags.map((item) => (
          <button
            className="btn"
            type="button"
            key={item}
            onClick={() => updateFilter("tag", item)}
            disabled={item === tag}
          >
            #{item}
          </button>
        ))}
      </div>
      {isLoading ? <p className="text-sm text-slate-500">글 목록을 불러오는 중입니다...</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {!isLoading && !error ? (
        <PostList posts={posts} onTagClick={(clickedTag) => updateFilter("tag", clickedTag)} />
      ) : null}
    </section>
  );
}
