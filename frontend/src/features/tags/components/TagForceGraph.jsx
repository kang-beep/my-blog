import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { ROUTES } from "@/shared/constants/routes";
import {
  TAG_GRAPH_ASPECT_RATIO,
  TAG_GRAPH_FULLSCREEN_ZOOM_PADDING,
  TAG_GRAPH_MAX_HEIGHT,
  TAG_GRAPH_MIN_HEIGHT,
  TAG_GRAPH_NODE_RADIUS_SCALE,
  TAG_GRAPH_ZOOM_PADDING,
} from "@/features/tags/constants/tagNetwork";
import { buildTagGraphData } from "@/features/tags/utils/buildTagGraphData";

function getGraphHeight(width) {
  const ratioHeight = Math.round(width * TAG_GRAPH_ASPECT_RATIO);
  return Math.min(TAG_GRAPH_MAX_HEIGHT, Math.max(TAG_GRAPH_MIN_HEIGHT, ratioHeight));
}

function getNodeRadius(nodeVal, scale = TAG_GRAPH_NODE_RADIUS_SCALE) {
  return Math.sqrt(nodeVal ?? 1) * scale;
}

function resolveGraphHeight(width, measuredHeight, fillContainer) {
  if (fillContainer && measuredHeight > 0) {
    return measuredHeight;
  }

  if (measuredHeight >= TAG_GRAPH_MIN_HEIGHT) {
    return measuredHeight;
  }

  return getGraphHeight(width);
}

export default function TagForceGraph({ nodes, edges, fillContainer = false }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: TAG_GRAPH_MIN_HEIGHT });

  const graphData = useMemo(() => buildTagGraphData(nodes, edges), [nodes, edges]);
  const zoomPadding = fillContainer ? TAG_GRAPH_FULLSCREEN_ZOOM_PADDING : TAG_GRAPH_ZOOM_PADDING;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const updateSize = () => {
      const width = element.clientWidth;
      const measuredHeight = element.clientHeight;
      setDimensions({
        width,
        height: resolveGraphHeight(width, measuredHeight, fillContainer),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fillContainer]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || graphData.nodes.length === 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      graph.zoomToFit(350, zoomPadding);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [graphData, dimensions.width, dimensions.height, zoomPadding]);

  const handleNodeClick = (node) => {
    navigate(`${ROUTES.POSTS}?tag=${encodeURIComponent(node.id)}`);
  };

  if (graphData.nodes.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
        No tags to display. Add tags to your posts to build the network.
      </p>
    );
  }

  const containerClassName = fillContainer
    ? "h-full min-h-0 w-full overflow-hidden bg-slate-50"
    : "h-full min-h-[240px] w-full overflow-hidden rounded-lg bg-slate-50";

  return (
    <div ref={containerRef} className={containerClassName}>
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel={(node) => `#${node.name} (${node.val})`}
        nodeVal="val"
        linkWidth={(link) => Math.max(0.5, Math.sqrt(link.value ?? 1) * 0.65)}
        linkColor={() => "rgba(148, 163, 184, 0.55)"}
        cooldownTicks={120}
        d3AlphaDecay={0.025}
        d3VelocityDecay={0.35}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const radius = getNodeRadius(node.val);
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = "#6366f1";
          ctx.fill();

          const fontSize = Math.max(9, 11 / globalScale);
          ctx.font = `600 ${fontSize}px Pretendard, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#1e293b";
          ctx.fillText(`#${node.name}`, node.x, node.y + radius + fontSize * 0.85);
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          const radius = getNodeRadius(node.val) + 6;
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
