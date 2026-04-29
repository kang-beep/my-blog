// 글 목록 페이지: 카테고리/태그 필터 기반 게시글 탐색
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PostList from "../components/PostList";
import { fetchCategories } from "../api/postApi";
import { usePosts } from "../hooks/usePosts";
import { ROUTES, getEditPostPath } from "../../../shared/constants/routes";
import { useAuthStore } from "../../auth/store/authStore";

export default function Posts() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
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
      <div className="flex items-center justify-between gap-3">
        <h1>글 목록</h1>
        {isAuthenticated ? (
          <button className="btn btn-primary" type="button" onClick={() => navigate(ROUTES.WRITE)}>
            + 새 글 작성
          </button>
        ) : null}
      </div>
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
        <>
          <PostList posts={posts} onTagClick={(clickedTag) => updateFilter("tag", clickedTag)} />
          {isAuthenticated ? (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg">빠른 수정</h2>
              <div className="flex flex-wrap gap-2">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    className="btn"
                    type="button"
                    onClick={() => navigate(getEditPostPath(post.id))}
                  >
                    {post.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
