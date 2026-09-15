import { useState } from "react";
import { Maximize2 } from "lucide-react";
import TagForceGraph from "@/features/tags/components/TagForceGraph";
import TagNetworkFullscreenModal from "@/features/tags/components/TagNetworkFullscreenModal";

function TagNetworkStatus({ isLoading, error }) {
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

export default function TagNetworkPanel({ nodes, edges, isLoading, error }) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const canExpand = !isLoading && !error && nodes.length > 0;

  return (
    <>
      <div className="home-tag-posts-panel border-t border-slate-100 lg:border-t-0">
        <div className="home-tag-posts-panel-header">
          <h3>Tag Network</h3>

          <div className="home-tag-posts-panel-header-action-slot">
            {canExpand ? (
              <button
                type="button"
                className="home-feed-card-header-action shrink-0"
                aria-label="Expand tag network"
                onClick={() => setIsFullscreenOpen(true)}
              >
                <Maximize2 size={16} aria-hidden />
              </button>
            ) : (
              <span className="home-feed-card-header-action pointer-events-none shrink-0 opacity-0" aria-hidden="true">
                <Maximize2 size={16} />
              </span>
            )}
          </div>
        </div>

        <div className="home-tag-posts-panel-body">
          <TagNetworkStatus isLoading={isLoading} error={error} />
          {canExpand ? <TagForceGraph nodes={nodes} edges={edges} /> : null}
        </div>
      </div>

      <TagNetworkFullscreenModal
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        nodes={nodes}
        edges={edges}
      />
    </>
  );
}
