import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { ROUTES } from "@/shared/constants/routes";
import {
  TAG_GRAPH_ASPECT_RATIO,
  TAG_GRAPH_MIN_HEIGHT,
} from "@/features/tags/constants/tagNetwork";
import { buildTagGraphData } from "@/features/tags/utils/buildTagGraphData";

export default function TagForceGraph({ nodes, edges }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: TAG_GRAPH_MIN_HEIGHT });

  const graphData = useMemo(() => buildTagGraphData(nodes, edges), [nodes, edges]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const updateSize = () => {
      const width = element.clientWidth;
      setDimensions({
        width,
        height: Math.max(TAG_GRAPH_MIN_HEIGHT, Math.round(width * TAG_GRAPH_ASPECT_RATIO)),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleNodeClick = (node) => {
    navigate(`${ROUTES.POSTS}?tag=${encodeURIComponent(node.id)}`);
  };

  if (graphData.nodes.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
        표시할 태그가 없습니다. 글에 태그를 추가하면 네트워크가 표시됩니다.
      </p>
    );
  }

  return (
    <div ref={containerRef} className="w-full overflow-hidden border border-slate-200 bg-slate-50">
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel={(node) => `#${node.name} (${node.val})`}
        nodeVal="val"
        linkWidth={(link) => Math.max(0.5, Math.sqrt(link.value ?? 1) * 0.8)}
        linkColor={() => "rgba(148, 163, 184, 0.55)"}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const radius = Math.sqrt(node.val ?? 1) * 4;
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = "#6366f1";
          ctx.fill();

          const fontSize = Math.max(10, 13 / globalScale);
          ctx.font = `600 ${fontSize}px Pretendard, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#1e293b";
          ctx.fillText(`#${node.name}`, node.x, node.y + radius + fontSize * 0.9);
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          const radius = Math.sqrt(node.val ?? 1) * 4 + 8;
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        onNodeClick={handleNodeClick}
        onNodeHover={(node) => {
          if (containerRef.current) {
            containerRef.current.style.cursor = node ? "pointer" : "default";
          }
        }}
      />
    </div>
  );
}
