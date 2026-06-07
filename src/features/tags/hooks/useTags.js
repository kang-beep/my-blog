// 태그 네트워크용 노드/엣지 데이터를 로드하는 커스텀 훅
import { useEffect, useState } from "react";
import { fetchTagCounts, fetchTagEdges } from "@/features/tags/api/tagApi";

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
        const [counts, relations] = await Promise.all([
          fetchTagCounts(),
          fetchTagEdges(),
        ]);
        setNodes(counts);
        setEdges(relations);
      } catch (requestError) {
        setError(requestError.message || "태그 데이터를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadTagData();
  }, []);

  return { nodes, edges, isLoading, error };
}
