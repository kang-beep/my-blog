// 태그 네트워크 1차 렌더: 태그 빈도와 관계 데이터를 클릭 가능한 목록으로 표시
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../shared/constants/routes";
import { useTags } from "../hooks/useTags";

export default function TagNetwork() {
  const navigate = useNavigate();
  const { nodes, edges, isLoading, error } = useTags();

  const goToTagFilter = (tag) => {
    navigate(`${ROUTES.POSTS}?tag=${encodeURIComponent(tag)}`);
  };

  return (
    <section>
      <h2>태그 네트워크</h2>
      {isLoading ? <p>태그 데이터를 불러오는 중입니다...</p> : null}
      {error ? <p>{error}</p> : null}
      {!isLoading && !error ? (
        <>
          <h3>태그 빈도</h3>
          <ul>
            {nodes.map((node) => (
              <li key={node.tag}>
                <button type="button" onClick={() => goToTagFilter(node.tag)}>
                  #{node.tag} ({node.count})
                </button>
              </li>
            ))}
          </ul>
          <h3>태그 관계(상위 10개)</h3>
          <ul>
            {edges.slice(0, 10).map((edge) => (
              <li key={`${edge.source}-${edge.target}`}>
                {edge.source} - {edge.target} ({edge.weight})
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
