import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";

function TagRankingStatus({ isLoading, error }) {
  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading tags...</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
        {error}
        <span className="mt-1 block text-xs text-rose-500">
          Make sure docs/sql/bootstrap.sql has been applied in Supabase.
        </span>
      </p>
    );
  }

  return null;
}

function getPostsTagPath(tag) {
  return `${ROUTES.POSTS}?tag=${encodeURIComponent(tag)}`;
}

function getBarWidthPercent(count, maxCount) {
  if (!maxCount || maxCount <= 0) {
    return 0;
  }

  return Math.max(8, Math.round((count / maxCount) * 100));
}

export default function TagRankingPanel({ nodes = [], isLoading, error }) {
  const hasRanks = !isLoading && !error && nodes.length > 0;
  const maxCount = hasRanks ? Math.max(...nodes.map((node) => node.count ?? 0)) : 0;

  return (
    <section className="posts-side-card">
      <div className="posts-side-card-header">
        <h3 className="posts-side-card-title">Tag Ranking</h3>
      </div>

      <div className="posts-side-card-body">
        <TagRankingStatus isLoading={isLoading} error={error} />

        {!isLoading && !error && nodes.length === 0 ? (
          <p className="text-sm text-slate-500">No tags yet.</p>
        ) : null}

        {hasRanks ? (
          <ol className="posts-tag-ranking-list">
            {nodes.map((node, index) => {
              const rank = String(index + 1).padStart(2, "0");
              const barWidth = getBarWidthPercent(node.count ?? 0, maxCount);

              return (
                <li key={node.tag}>
                  <Link to={getPostsTagPath(node.tag)} className="posts-tag-ranking-row">
                    <span className="posts-tag-ranking-index">{rank}</span>
                    <span className="posts-tag-ranking-name">#{node.tag}</span>
                    <span className="posts-tag-ranking-bar-track" aria-hidden>
                      <span className="posts-tag-ranking-bar-fill" style={{ width: `${barWidth}%` }} />
                    </span>
                    <span className="posts-tag-ranking-count">{node.count}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
