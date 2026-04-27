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
    <section>
      <h1>글 목록</h1>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        <button type="button" onClick={() => updateFilter("category", "")}>
          전체 카테고리
        </button>
        {categories.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => updateFilter("category", item)}
            disabled={item === category}
          >
            {item}
          </button>
        ))}
      </div>
      {categoryError ? <p>{categoryError}</p> : null}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        <button type="button" onClick={() => updateFilter("tag", "")}>
          전체 태그
        </button>
        {uniqueTags.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => updateFilter("tag", item)}
            disabled={item === tag}
          >
            #{item}
          </button>
        ))}
      </div>
      {isLoading ? <p>글 목록을 불러오는 중입니다...</p> : null}
      {error ? <p>{error}</p> : null}
      {!isLoading && !error ? (
        <PostList posts={posts} onTagClick={(clickedTag) => updateFilter("tag", clickedTag)} />
      ) : null}
    </section>
  );
}
