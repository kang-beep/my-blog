// 메인 페이지: 외부 피드 2열 + 태그 네트워크 + 최신 글
import { useEffect, useState } from "react";
import GithubTrendingReposList from "@/features/github/trending-repos/components/GithubTrendingReposList";
import HuggingFaceDailyPapersList from "@/features/huggingface/daily-papers/components/HuggingFaceDailyPapersList";
import { fetchLatestPosts } from "@/features/posts/api/postApi";
import { HOME_LATEST_POST_LIMIT } from "@/features/posts/constants/home";
import TagNetwork from "@/features/tags/components/TagNetwork";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLatestPosts = async () => {
      setIsLoading(true);
      setError("");
      try {
        const items = await fetchLatestPosts(HOME_LATEST_POST_LIMIT);
        setPosts(items);
      } catch (requestError) {
        setError(requestError.message || "최신 글을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadLatestPosts();
  }, []);

  return (
    <div className="space-y-6">
      <section className="home-cards-grid">
        <HuggingFaceDailyPapersList />
        <GithubTrendingReposList />
      </section>
      <TagNetwork
        latestPosts={posts}
        latestPostsLoading={isLoading}
        latestPostsError={error}
      />
    </div>
  );
}
