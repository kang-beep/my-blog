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
import ExternalFeedUnavailable from "@/shared/ui/ExternalFeedUnavailable";
import HomeFeedBadge from "@/shared/ui/HomeFeedBadge";
import { formatDateTimeKst } from "@/shared/utils/date";

export default function HuggingFaceDailyPapersList({
  period = null,
  showPeriodTabs = true,
}) {
  const [internalPeriod, setInternalPeriod] = useState("daily");
  const selectedPeriod = period ?? internalPeriod;
  const [papers, setPapers] = useState([]);
  const [feedMeta, setFeedMeta] = useState({ syncedAt: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    const loadHuggingFaceDailyPapers = async () => {
      setIsLoading(true);
      setIsUnavailable(false);

      try {
        const { papers: items, syncedAt } = await fetchHuggingFaceDailyPapers(selectedPeriod);
        if (items.length === 0) {
          setPapers([]);
          setFeedMeta({ syncedAt: "" });
          setIsUnavailable(true);
          return;
        }
        setPapers(items);
        setFeedMeta({ syncedAt: syncedAt ?? "" });
      } catch {
        setPapers([]);
        setFeedMeta({ syncedAt: "" });
        setIsUnavailable(true);
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
    <section className="home-feed-card flex flex-col">
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

      {showPeriodTabs ? (
        <div className="home-feed-card-toolbar">
          <div className="flex flex-wrap gap-2 py-3" role="tablist" aria-label="Hugging Face papers period">
            {HUGGINGFACE_PAPER_PERIODS.map((periodOption) => {
              const isActive = selectedPeriod === periodOption;

              return (
                <button
                  key={periodOption}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={
                    isActive ? "home-feed-card-tab home-feed-card-tab-active" : "home-feed-card-tab"
                  }
                  onClick={() => setInternalPeriod(periodOption)}
                >
                  {HUGGINGFACE_PAPER_PERIOD_LABELS[periodOption]}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="home-feed-card-body" aria-busy={isLoading} aria-live="polite">
        {isLoading ? (
          <>
            <p className="sr-only">Loading Hugging Face papers.</p>
            <HuggingFaceDailyPapersSkeleton />
          </>
        ) : null}

        {!isLoading && isUnavailable ? <ExternalFeedUnavailable /> : null}

        {!isLoading && !isUnavailable && papers.length > 0 ? (
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
