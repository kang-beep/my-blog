// 포트폴리오 페이지: 프로젝트 목록 렌더링
import { useEffect, useMemo, useState } from "react";
import { fetchPortfolioProjects } from "../api/portfolioApi";

export default function Portfolio() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const items = await fetchPortfolioProjects();
        setProjects(items);
      } catch (requestError) {
        setError(requestError.message || "포트폴리오를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const tags = useMemo(() => {
    const tagSet = new Set();
    projects.forEach((item) => {
      (item.tech_stack ?? []).forEach((tech) => tagSet.add(tech));
    });
    return [...tagSet];
  }, [projects]);

  const filtered = useMemo(() => {
    if (!filter) {
      return projects;
    }
    return projects.filter((item) => (item.tech_stack ?? []).includes(filter));
  }, [projects, filter]);

  return (
    <section className="space-y-4">
      <h1>포트폴리오</h1>
      <div className="flex flex-wrap gap-2">
        <button className="btn" type="button" onClick={() => setFilter("")}>
          전체
        </button>
        {tags.map((tech) => (
          <button
            className="btn"
            type="button"
            key={tech}
            onClick={() => setFilter(tech)}
            disabled={filter === tech}
          >
            {tech}
          </button>
        ))}
      </div>
      {isLoading ? <p className="text-sm text-slate-500">프로젝트를 불러오는 중입니다...</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {!isLoading && !error && filtered.length === 0 ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">등록된 프로젝트가 없습니다.</p>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((project) => (
          <article key={project.id} className="card space-y-2">
            <h3>{project.title}</h3>
            <p className="text-sm text-slate-600">{project.summary}</p>
            {project.image_url ? (
              <img src={project.image_url} alt={project.title} className="h-44 w-full rounded-lg object-cover" />
            ) : null}
            <div className="flex flex-wrap gap-2 text-xs text-indigo-600">
              {(project.tech_stack ?? []).map((tech) => (
                <span key={`${project.id}-${tech}`} className="rounded-full bg-indigo-50 px-2 py-1">
                  {tech}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              {project.repo_url ? (
                <a className="btn" href={project.repo_url} target="_blank" rel="noreferrer">
                  Repository
                </a>
              ) : null}
              {project.demo_url ? (
                <a className="btn btn-primary" href={project.demo_url} target="_blank" rel="noreferrer">
                  Demo
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
