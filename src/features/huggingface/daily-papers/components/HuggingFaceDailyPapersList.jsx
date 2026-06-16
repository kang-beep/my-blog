import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { fetchHuggingFaceDailyPapers } from "@/features/huggingface/daily-papers/api/huggingfaceDailyPapersApi";
import HuggingFaceDailyPapersListItem from "@/features/huggingface/daily-papers/components/HuggingFaceDailyPapersListItem";
import HuggingFaceDailyPapersSkeleton from "@/features/huggingface/daily-papers/components/HuggingFaceDailyPapersSkeleton";
import {
  HUGGINGFACE_DAILY_PAPERS_PAGE_URL,
} from "@/features/huggingface/daily-papers/constants/huggingfaceDailyPapers";
import { HOME_FEED_BADGE_EXTERNAL } from "@/features/posts/constants/home";
import HomeFeedBadge from "@/shared/ui/HomeFeedBadge";

export default function HuggingFaceDailyPapersList() {
  const [papers, setPapers] = useState([]);
  const [feedMeta, setFeedMeta] = useState({ fetchedDate: "", isStale: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHuggingFaceDailyPapers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const { papers: items, fetchedDate, isStale } = await fetchHuggingFaceDailyPapers();
        setPapers(items);
        setFeedMeta({ fetchedDate, isStale });
      } catch (requestError) {
        setError(requestError.message || "Failed to load Hugging Face daily papers.");
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
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <span aria-hidden>🤗</span>
              <span>Hugging Face Daily Papers</span>
            </h3>
            <HomeFeedBadge>{HOME_FEED_BADGE_EXTERNAL}</HomeFeedBadge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {feedMeta.isStale
              ? `Latest synced papers · ${feedMeta.fetchedDate}`
              : "Today's top papers · by upvotes"}
          </p>
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
            <p className="sr-only">Loading Hugging Face daily papers.</p>
            <HuggingFaceDailyPapersSkeleton />
          </>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        ) : null}

        {!isLoading && !error && papers.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            No papers to show. Run the GitHub Actions workflow &quot;Fetch HuggingFace Daily Papers&quot; or{' '}
            <code className="text-xs">npm run sync:hf-papers</code> locally.
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
