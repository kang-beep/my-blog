// Home: latest posts (max 3) + Today in Trend preview
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLatestPosts } from "@/features/posts/api/postApi";
import HomeMyPosts from "@/features/posts/components/HomeMyPosts";
import HomeSection from "@/features/posts/components/HomeSection";
import {
  HOME_LATEST_POST_LIMIT,
  HOME_SECTION_MINE,
  HOME_SECTION_TREND,
} from "@/features/posts/constants/home";
import HomeTodayInAi from "@/features/trends/components/HomeTodayInAi";
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
        setPosts(items.slice(0, HOME_LATEST_POST_LIMIT));
      } catch (requestError) {
        setError(requestError.message || "Failed to load latest posts.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadLatestPosts();
  }, []);

  return (
    <div className="home-page">
      <HomeSection
        title={HOME_SECTION_MINE.title}
        description={HOME_SECTION_MINE.description}
        action={
          <Link className="home-section-action" to={ROUTES.POSTS}>
            {HOME_SECTION_MINE.viewAllLabel}
          </Link>
        }
      >
        <div className="home-feed-card">
          <header className="home-feed-card-header">
            <h3 className="home-feed-card-header-title">Posts</h3>
          </header>
          <div className="home-feed-card-body">
            <HomeMyPosts posts={posts} isLoading={isLoading} error={error} />
          </div>
        </div>
      </HomeSection>

      <HomeSection
        className="home-section-ai"
        title={HOME_SECTION_TREND.title}
        description={HOME_SECTION_TREND.description}
        action={
          <Link className="home-section-action" to={ROUTES.TRENDS}>
            {HOME_SECTION_TREND.viewAllLabel}
          </Link>
        }
      >
        <HomeTodayInAi />
      </HomeSection>
    </div>
  );
}
