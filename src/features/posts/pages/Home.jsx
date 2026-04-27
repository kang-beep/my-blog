// 메인 페이지: 카테고리별 최신 글과 태그 네트워크 표시
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostList from "../components/PostList";
import { fetchCategorySections } from "../api/postApi";
import { ROUTES } from "../../../shared/constants/routes";
import TagNetwork from "../../tags/components/TagNetwork";

export default function Home() {
  const navigate = useNavigate();
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
    <section>
      <h1>홈</h1>
      {isLoading ? <p>글 섹션을 불러오는 중입니다...</p> : null}
      {error ? <p>{error}</p> : null}
      {!isLoading && !error && sections.length === 0 ? (
        <p>아직 등록된 글이 없습니다.</p>
      ) : null}
      {sections.map((section) => (
        <section key={section.category} style={{ marginBottom: "24px" }}>
          <h2>{section.category}</h2>
          <PostList posts={section.posts} onTagClick={handleTagClick} />
        </section>
      ))}
      <TagNetwork />
    </section>
  );
}
