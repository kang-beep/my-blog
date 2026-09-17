import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { fetchHuggingFaceDailyPapers } from "@/features/huggingface/daily-papers/api/huggingfaceDailyPapersApi";
import HuggingFaceDailyPapersListItem from "@/features/huggingface/daily-papers/components/HuggingFaceDailyPapersListItem";
import HuggingFaceDailyPapersSkeleton from "@/features/huggingface/daily-papers/components/HuggingFaceDailyPapersSkeleton";
import {
  HUGGINGFACE_DAILY_PAPERS_PAGE_URL,
  HUGGINGFACE_PAPER_PERIOD_LABELS,
  HUGGINGFACE_PAPER_PERIODS,
} from "@/features/huggingface/daily-papers/constants/huggingfaceDailyPapers";
import { HOME_FEED_BADGE_EXTERNAL } from "@/features/posts/constants/home";
import HomeFeedBadge from "@/shared/ui/HomeFeedBadge";
import { formatDateTimeKst } from "@/shared/utils/date";

export default function HuggingFaceDailyPapersList() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [papers, setPapers] = useState([]);
  const [feedMeta, setFeedMeta] = useState({ syncedAt: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHuggingFaceDailyPapers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const { papers: items, syncedAt } = await fetchHuggingFaceDailyPapers(selectedPeriod);
        setPapers(items);
        setFeedMeta({ syncedAt: syncedAt ?? "" });
      } catch (requestError) {
        setError(requestError.message || "Failed to load Hugging Face daily papers.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadHuggingFaceDailyPapers();
  }, [selectedPeriod]);

  const syncedLabel = feedMeta.syncedAt
    ? `Updated · ${formatDateTimeKst(feedMeta.syncedAt)} KST`
    : "Top papers · by upvotes";

  return (
    <section className="home-feed-card flex flex-col border border-slate-400 bg-white shadow-sm">
      <div className="home-feed-card-header">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="home-feed-card-header-title">
              <span aria-hidden>🤗</span>
              <span>Hugging Face Papers</span>
            </h3>
            <HomeFeedBadge>{HOME_FEED_BADGE_EXTERNAL}</HomeFeedBadge>
          </div>
          <p className="home-feed-card-header-description">{syncedLabel}</p>
        </div>
        <a
          className="home-feed-card-header-action"
          href={HUGGINGFACE_DAILY_PAPERS_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Papers
          <ExternalLink size={14} aria-hidden />
        </a>
      </div>

      <div className="home-feed-card-toolbar">
        <div className="flex flex-wrap gap-2 py-3" role="tablist" aria-label="Hugging Face papers period">
          {HUGGINGFACE_PAPER_PERIODS.map((period) => {
            const isActive = selectedPeriod === period;

            return (
              <button
                key={period}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? "home-feed-card-tab home-feed-card-tab-active" : "home-feed-card-tab"}
                onClick={() => setSelectedPeriod(period)}
              >
                {HUGGINGFACE_PAPER_PERIOD_LABELS[period]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="home-feed-card-body" aria-busy={isLoading} aria-live="polite">
        {isLoading ? (
          <>
            <p className="sr-only">Loading Hugging Face papers.</p>
            <HuggingFaceDailyPapersSkeleton />
          </>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        ) : null}

        {!isLoading && !error && papers.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            No papers to show. Run the GitHub Actions workflow &quot;Fetch HuggingFace Daily Papers&quot; or{" "}
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
