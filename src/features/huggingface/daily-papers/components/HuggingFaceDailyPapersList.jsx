import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { fetchHuggingFaceDailyPapers } from "@/features/huggingface/daily-papers/api/huggingfaceDailyPapersApi";
import HuggingFaceDailyPapersListItem from "@/features/huggingface/daily-papers/components/HuggingFaceDailyPapersListItem";
import HuggingFaceDailyPapersSkeleton from "@/features/huggingface/daily-papers/components/HuggingFaceDailyPapersSkeleton";
import {
  HUGGINGFACE_DAILY_PAPERS_PAGE_URL,
} from "@/features/huggingface/daily-papers/constants/huggingfaceDailyPapers";

export default function HuggingFaceDailyPapersList() {
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHuggingFaceDailyPapers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const items = await fetchHuggingFaceDailyPapers();
        setPapers(items);
      } catch (requestError) {
        setError(requestError.message || "Hugging Face 인기 논문을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadHuggingFaceDailyPapers();
  }, []);

  return (
    <section className="home-feed-card flex flex-col border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <span aria-hidden>🤗</span>
            <span>Hugging Face Daily Papers</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">오늘의 인기 논문 · 업보트 순</p>
        </div>
        <a
          className="btn inline-flex shrink-0 items-center gap-1.5 no-underline"
          href={HUGGINGFACE_DAILY_PAPERS_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Daily Papers
          <ExternalLink size={14} aria-hidden />
        </a>
      </div>

      <div className="home-feed-card-body" aria-busy={isLoading} aria-live="polite">
        {isLoading ? (
          <>
            <p className="sr-only">Hugging Face 인기 논문을 불러오는 중입니다.</p>
            <HuggingFaceDailyPapersSkeleton />
          </>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        ) : null}

        {!isLoading && !error && papers.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            표시할 논문이 없습니다. GitHub Actions 동기화 후 다시 확인하세요.
          </p>
        ) : null}

        {!isLoading && !error && papers.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {papers.map((paper) => (
              <HuggingFaceDailyPapersListItem key={paper.id ?? paper.paper_id} paper={paper} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
