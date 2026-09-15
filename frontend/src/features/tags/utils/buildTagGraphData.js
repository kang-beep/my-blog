import { TAG_GRAPH_MAX_NODES } from "@/features/tags/constants/tagNetwork";

export function buildTagGraphData(nodes, edges, maxNodes = TAG_GRAPH_MAX_NODES) {
  const topNodes = nodes.slice(0, maxNodes);
  const nodeIds = new Set(topNodes.map((node) => node.tag));

  return {
    nodes: topNodes.map((node) => ({
      id: node.tag,
      name: node.tag,
      val: node.count,
    })),
    links: edges
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map((edge) => ({
        source: edge.source,
        target: edge.target,
        value: edge.weight,
      })),
  };
}
