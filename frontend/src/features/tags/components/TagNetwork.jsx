// Home: latest posts (left 6) + tag ranking (right 4)
import { Link } from "react-router-dom";
import HomeLatestPosts from "@/features/posts/components/HomeLatestPosts";
import TagRankingPanel from "@/features/tags/components/TagRankingPanel";
import { ROUTES } from "@/shared/constants/routes";
import { useTagRanking } from "@/features/tags/hooks/useTagRanking";

export default function TagNetwork({ latestPosts = [], latestPostsLoading = false, latestPostsError = "" }) {
  const { nodes, isLoading, error } = useTagRanking();

  return (
    <section className="home-feed-card border border-slate-400 bg-white shadow-sm">
      <div className="home-tag-posts-grid">
        <div className="home-tag-posts-panel">
          <div className="home-tag-posts-panel-header">
            <h3>Latest Posts</h3>
            <div className="home-tag-posts-panel-header-action-slot">
              <Link className="home-feed-card-header-action shrink-0 text-sm" to={ROUTES.POSTS}>
                View all
              </Link>
            </div>
          </div>

          <div className="home-tag-posts-panel-body home-tag-posts-panel-body-scroll">
            {latestPostsLoading ? <p className="text-sm text-slate-500">Loading posts...</p> : null}
            {latestPostsError ? (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{latestPostsError}</p>
            ) : null}
            {!latestPostsLoading && !latestPostsError ? (
              <HomeLatestPosts posts={latestPosts} compact />
            ) : null}
          </div>
        </div>

        <TagRankingPanel nodes={nodes} isLoading={isLoading} error={error} />
      </div>
    </section>
  );
}
