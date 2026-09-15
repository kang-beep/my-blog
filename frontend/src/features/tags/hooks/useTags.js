// tag_stats · tag_edges 기반 태그 네트워크 데이터 로드
import { useEffect, useState } from "react";
import { fetchTagNetwork } from "@/features/tags/api/tagApi";

export function useTags() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTagData = async () => {
      setIsLoading(true);
      setError("");
      try {
        const network = await fetchTagNetwork();
        setNodes(network.nodes);
        setEdges(network.edges);
      } catch (requestError) {
        setError(requestError.message || "Failed to load tags.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadTagData();
  }, []);

  return { nodes, edges, isLoading, error };
}
