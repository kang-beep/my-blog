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

export default function TagNetworkPanel({ nodes, edges, isLoading, error, onTagSelect }) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const canExpand = !isLoading && !error && nodes.length > 0;

  const handleTagSelect = (tag) => {
    onTagSelect?.(tag);
    setIsFullscreenOpen(false);
  };

  return (
    <>
      <section className="posts-side-card">
        <div className="posts-side-card-header">
          <div className="min-w-0">
            <h3 className="posts-side-card-title">Tag Network</h3>
            <p className="posts-side-card-description">태그를 선택해 관련 글 보기.</p>
          </div>

          {canExpand ? (
            <button
              type="button"
              className="posts-side-card-action"
              aria-label="Expand tag network"
              onClick={() => setIsFullscreenOpen(true)}
            >
              <Maximize2 size={16} aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="posts-side-card-body posts-tag-network-body">
          <TagNetworkStatus isLoading={isLoading} error={error} />
          {canExpand ? (
            <TagForceGraph
              nodes={nodes}
              edges={edges}
              fillContainer
              onNodeClick={onTagSelect ? handleTagSelect : undefined}
            />
          ) : null}
        </div>
      </section>

      <TagNetworkFullscreenModal
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        nodes={nodes}
        edges={edges}
        onTagSelect={onTagSelect ? handleTagSelect : undefined}
      />
    </>
  );
}
