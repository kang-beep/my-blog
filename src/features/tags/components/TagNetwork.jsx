// Home: latest posts (left 6) + tag network (right 4)
import { Link } from "react-router-dom";
import HomeLatestPosts from "@/features/posts/components/HomeLatestPosts";
import TagNetworkPanel from "@/features/tags/components/TagNetworkPanel";
import { ROUTES } from "@/shared/constants/routes";
import { useTags } from "@/features/tags/hooks/useTags";

export default function TagNetwork({ latestPosts = [], latestPostsLoading = false, latestPostsError = "" }) {
  const { nodes, edges, isLoading, error } = useTags();

  return (
    <section className="home-feed-card border border-slate-200 bg-white shadow-sm">
      <div className="home-tag-posts-grid">
        <div className="home-tag-posts-panel">
          <div className="home-tag-posts-panel-header flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-slate-900">Latest Posts</h3>
            <Link className="btn shrink-0 text-sm" to={ROUTES.POSTS}>
              View all
            </Link>
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

        <TagNetworkPanel nodes={nodes} edges={edges} isLoading={isLoading} error={error} />
      </div>
    </section>
  );
}
