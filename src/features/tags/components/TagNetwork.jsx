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
    <section className="card mt-6 space-y-3">
      <h2>태그 네트워크</h2>
      {isLoading ? <p className="text-sm text-slate-500">태그 데이터를 불러오는 중입니다...</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {!isLoading && !error ? (
        <>
          <h3 className="text-lg">태그 빈도</h3>
          <ul className="flex flex-wrap gap-2">
            {nodes.map((node) => (
              <li key={node.tag}>
                <button className="btn" type="button" onClick={() => goToTagFilter(node.tag)}>
                  #{node.tag} ({node.count})
                </button>
              </li>
            ))}
          </ul>
          <h3 className="text-lg">태그 관계(상위 10개)</h3>
          <ul className="space-y-1 text-sm text-slate-700">
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
