// tag_stats 기반 태그 순위 로드
import { useEffect, useState } from "react";
import { fetchTagCounts } from "@/features/tags/api/tagApi";

export function useTagRanking() {
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTagRanking = async () => {
      setIsLoading(true);
      setError("");
      try {
        const ranks = await fetchTagCounts();
        setNodes(ranks);
      } catch (requestError) {
        setError(requestError.message || "Failed to load tags.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadTagRanking();
  }, []);

  return { nodes, isLoading, error };
}
