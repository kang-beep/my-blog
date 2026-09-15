// posts 도메인 조회 상태를 관리하는 커스텀 훅
import { useEffect, useState } from "react";
import { fetchPosts } from "@/features/posts/api/postApi";

export function usePosts(filters = {}) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { category, tag } = filters;

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      setError("");
      try {
        const items = await fetchPosts({ category, tag });
        setPosts(items);
      } catch (requestError) {
        setError(requestError.message || "글 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadPosts();
  }, [category, tag]);

  return { posts, isLoading, error };
}
