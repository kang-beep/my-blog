import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { ROUTES } from "@/shared/constants/routes";
import {
  TAG_GRAPH_ASPECT_RATIO,
  TAG_GRAPH_FULLSCREEN_ZOOM_PADDING,
  TAG_GRAPH_MAX_HEIGHT,
  TAG_GRAPH_MAX_ZOOM,
  TAG_GRAPH_MIN_HEIGHT,
  TAG_GRAPH_NODE_RADIUS_MAX,
  TAG_GRAPH_NODE_RADIUS_MIN,
  TAG_GRAPH_NODE_RADIUS_SCALE,
  TAG_GRAPH_SPARSE_NODE_THRESHOLD,
  TAG_GRAPH_SPARSE_ZOOM_PADDING,
  TAG_GRAPH_ZOOM_PADDING,
} from "@/features/tags/constants/tagNetwork";
import { buildTagGraphData } from "@/features/tags/utils/buildTagGraphData";

function getGraphHeight(width) {
  const ratioHeight = Math.round(width * TAG_GRAPH_ASPECT_RATIO);
  return Math.min(TAG_GRAPH_MAX_HEIGHT, Math.max(TAG_GRAPH_MIN_HEIGHT, ratioHeight));
}

function getNodeRadius(nodeVal) {
  const raw = Math.sqrt(nodeVal ?? 1) * TAG_GRAPH_NODE_RADIUS_SCALE;
  return Math.min(TAG_GRAPH_NODE_RADIUS_MAX, Math.max(TAG_GRAPH_NODE_RADIUS_MIN, raw));
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

function resolveZoomPadding(nodeCount, fillContainer) {
  if (nodeCount <= TAG_GRAPH_SPARSE_NODE_THRESHOLD) {
    return TAG_GRAPH_SPARSE_ZOOM_PADDING;
  }
  return fillContainer ? TAG_GRAPH_FULLSCREEN_ZOOM_PADDING : TAG_GRAPH_ZOOM_PADDING;
}

export default function TagForceGraph({ nodes, edges, fillContainer = false, onNodeClick }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const graphRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: TAG_GRAPH_MIN_HEIGHT });

  const graphData = useMemo(() => buildTagGraphData(nodes, edges), [nodes, edges]);
  const zoomPadding = resolveZoomPadding(graphData.nodes.length, fillContainer);

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
      if (typeof graph.zoom === "function" && graph.zoom() > TAG_GRAPH_MAX_ZOOM) {
        graph.zoom(TAG_GRAPH_MAX_ZOOM, 200);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [graphData, dimensions.width, dimensions.height, zoomPadding]);

  const handleNodeClick = (node) => {
    if (onNodeClick) {
      onNodeClick(node.id);
      return;
    }
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
        maxZoom={TAG_GRAPH_MAX_ZOOM}
        linkWidth={(link) => Math.max(0.5, Math.sqrt(link.value ?? 1) * 0.65)}
        linkColor={() => "rgba(148, 163, 184, 0.55)"}
        cooldownTicks={120}
        d3AlphaDecay={0.025}
        d3VelocityDecay={0.35}
        nodeCanvasObject={(node, ctx) => {
          const radius = getNodeRadius(node.val);
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = "#6366f1";
          ctx.fill();

          const fontSize = Math.max(3.5, Math.min(5.5, radius * 0.85));
          ctx.font = `600 ${fontSize}px Pretendard, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#1e293b";
          ctx.fillText(`#${node.name}`, node.x, node.y + radius + fontSize * 0.95);
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          const radius = getNodeRadius(node.val) + 4;
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
