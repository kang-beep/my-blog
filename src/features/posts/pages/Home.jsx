// 메인 페이지: 카테고리별 최신 글과 태그 네트워크 표시
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostList from "../components/PostList";
import { fetchCategorySections } from "../api/postApi";
import { ROUTES } from "../../../shared/constants/routes";
import TagNetwork from "../../tags/components/TagNetwork";
import { useAuthStore } from "../../auth/store/authStore";

export default function Home() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSections = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await fetchCategorySections(3);
        setSections(data);
      } catch (requestError) {
        setError(requestError.message || "메인 글 섹션을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSections();
  }, []);

  const handleTagClick = (tag) => {
    navigate(`${ROUTES.POSTS}?tag=${encodeURIComponent(tag)}`);
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1>홈</h1>
        {isAuthenticated ? (
          <button className="btn btn-primary" type="button" onClick={() => navigate(ROUTES.WRITE)}>
            + 글 작성
          </button>
        ) : null}
      </div>
      {isLoading ? <p className="text-sm text-slate-500">글 섹션을 불러오는 중입니다...</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {!isLoading && !error && sections.length === 0 ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">아직 등록된 글이 없습니다.</p>
      ) : null}
      {sections.map((section) => (
        <section key={section.category} className="space-y-3">
          <h2 className="border-b border-slate-200 pb-2">{section.category}</h2>
          <PostList posts={section.posts} onTagClick={handleTagClick} />
        </section>
      ))}
      <TagNetwork />
    </section>
  );
}
