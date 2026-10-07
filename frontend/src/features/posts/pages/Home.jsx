// Home: my posts + external trends
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GithubTrendingReposList from "@/features/github/trending-repos/components/GithubTrendingReposList";
import HuggingFaceDailyPapersList from "@/features/huggingface/daily-papers/components/HuggingFaceDailyPapersList";
import { fetchLatestPosts } from "@/features/posts/api/postApi";
import HomeMyPosts from "@/features/posts/components/HomeMyPosts";
import HomeSection from "@/features/posts/components/HomeSection";
import {
  HOME_LATEST_POST_LIMIT,
  HOME_SECTION_MINE,
  HOME_SECTION_TRENDS,
} from "@/features/posts/constants/home";
import { ROUTES } from "@/shared/constants/routes";

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
        setError(requestError.message || "Failed to load latest posts.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadLatestPosts();
  }, []);

  return (
    <div className="home-page space-y-10">
      <HomeSection
        title={HOME_SECTION_MINE.title}
        description={HOME_SECTION_MINE.description}
        action={
          <Link className="home-section-action" to={ROUTES.POSTS}>
            {HOME_SECTION_MINE.viewAllLabel}
            <span aria-hidden>→</span>
          </Link>
        }
      >
        <HomeMyPosts posts={posts} isLoading={isLoading} error={error} />
      </HomeSection>

      <HomeSection title={HOME_SECTION_TRENDS.title} description={HOME_SECTION_TRENDS.description}>
        <div className="home-cards-grid">
          <GithubTrendingReposList />
          <HuggingFaceDailyPapersList />
        </div>
      </HomeSection>
    </div>
  );
}
