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

export default function TagRankingPanel({ nodes = [], isLoading, error }) {
  const hasRanks = !isLoading && !error && nodes.length > 0;

  return (
    <div className="home-tag-posts-panel border-t border-slate-100 lg:border-t-0">
      <div className="home-tag-posts-panel-header">
        <h3>Tag Ranking</h3>
        <div className="home-tag-posts-panel-header-action-slot" />
      </div>

      <div className="home-tag-posts-panel-body home-tag-posts-panel-body-scroll">
        <TagRankingStatus isLoading={isLoading} error={error} />

        {!isLoading && !error && nodes.length === 0 ? (
          <p className="text-sm text-slate-500">No tags yet.</p>
        ) : null}

        {hasRanks ? (
          <ol className="divide-y divide-slate-100">
            {nodes.map((node, index) => (
              <li key={node.tag}>
                <Link
                  to={getPostsTagPath(node.tag)}
                  className="flex items-center gap-3 py-2.5 text-sm text-slate-800 transition-colors hover:bg-slate-50"
                >
                  <span className="w-6 shrink-0 text-center text-xs font-semibold tabular-nums text-slate-500">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">#{node.tag}</span>
                  <span className="shrink-0 tabular-nums text-xs text-slate-500">
                    {node.count}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </div>
  );
}
