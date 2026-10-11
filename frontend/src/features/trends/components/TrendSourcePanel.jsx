import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { fetchGithubTrendingRepos } from "@/features/github/trending-repos/api/githubTrendingReposApi";
import GithubTrendingRepoListItem from "@/features/github/trending-repos/components/GithubTrendingRepoListItem";
import GithubTrendingReposSkeleton from "@/features/github/trending-repos/components/GithubTrendingReposSkeleton";
import {
  GITHUB_TRENDING_PAGE_URL,
  GITHUB_TRENDING_PERIOD_LABELS,
  GITHUB_TRENDING_PERIODS,
} from "@/features/github/trending-repos/constants/githubTrendingRepos";
import { fetchHuggingFaceDailyPapers } from "@/features/huggingface/daily-papers/api/huggingfaceDailyPapersApi";
import HuggingFaceDailyPapersListItem from "@/features/huggingface/daily-papers/components/HuggingFaceDailyPapersListItem";
import HuggingFaceDailyPapersSkeleton from "@/features/huggingface/daily-papers/components/HuggingFaceDailyPapersSkeleton";
import {
  HUGGINGFACE_DAILY_PAPERS_PAGE_URL,
  HUGGINGFACE_PAPER_PERIOD_LABELS,
  HUGGINGFACE_PAPER_PERIODS,
} from "@/features/huggingface/daily-papers/constants/huggingfaceDailyPapers";
import { HOME_FEED_BADGE_EXTERNAL } from "@/features/posts/constants/home";
import TrendAiBriefHelpTip from "@/features/trends/components/TrendAiBriefHelpTip";
import { TREND_AI_SOURCES } from "@/features/trends/constants/trendAiDigests";
import ExternalFeedUnavailable from "@/shared/ui/ExternalFeedUnavailable";
import GithubMarkIcon from "@/shared/ui/GithubMarkIcon";
import HomeFeedBadge from "@/shared/ui/HomeFeedBadge";
import { formatDateTimeKst } from "@/shared/utils/date";

function SourceTitle({ source }) {
  if (source === TREND_AI_SOURCES.GITHUB) {
    return (
      <>
        <GithubMarkIcon size={20} className="shrink-0 text-white" />
        <span>GitHub Trending</span>
      </>
    );
  }

  return (
    <>
      <span aria-hidden>🤗</span>
      <span>Hugging Face Papers</span>
    </>
  );
}

export default function TrendSourcePanel({
  source,
  digestsByPeriod = {},
  isDigestLoading = false,
}) {
  const isGithub = source === TREND_AI_SOURCES.GITHUB;
  const periods = isGithub ? GITHUB_TRENDING_PERIODS : HUGGINGFACE_PAPER_PERIODS;
  const periodLabels = isGithub ? GITHUB_TRENDING_PERIOD_LABELS : HUGGINGFACE_PAPER_PERIOD_LABELS;
  const externalUrl = isGithub ? GITHUB_TRENDING_PAGE_URL : HUGGINGFACE_DAILY_PAPERS_PAGE_URL;
  const externalLabel = isGithub ? "Trending" : "Papers";
  const emptyFeedLabel = isGithub ? "Top repos · RSS order" : "Top papers · by upvotes";

  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [items, setItems] = useState([]);
  const [syncedAt, setSyncedAt] = useState("");
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);

  const digest = digestsByPeriod[selectedPeriod] ?? null;

  useEffect(() => {
    const loadFeed = async () => {
      setIsFeedLoading(true);
      setIsUnavailable(false);

      try {
        if (isGithub) {
          const result = await fetchGithubTrendingRepos(selectedPeriod);
          if (!result.repos?.length) {
            setItems([]);
            setSyncedAt("");
            setIsUnavailable(true);
            return;
          }
          setItems(result.repos);
          setSyncedAt(result.syncedAt ?? "");
          return;
        }

        const result = await fetchHuggingFaceDailyPapers(selectedPeriod);
        if (!result.papers?.length) {
          setItems([]);
          setSyncedAt("");
          setIsUnavailable(true);
          return;
        }
        setItems(result.papers);
        setSyncedAt(result.syncedAt ?? "");
      } catch {
        setItems([]);
        setSyncedAt("");
        setIsUnavailable(true);
      } finally {
        setIsFeedLoading(false);
      }
    };

    void loadFeed();
  }, [isGithub, selectedPeriod]);

  const feedUpdatedLabel = syncedAt
    ? `Updated · ${formatDateTimeKst(syncedAt)} KST`
    : emptyFeedLabel;

  const aiUpdatedLabel = isDigestLoading
    ? "Loading AI brief..."
    : digest?.updatedLabel
      ? `AI brief · updated ${digest.updatedLabel}`
      : "AI brief · not generated yet";

  return (
    <section className="home-feed-card flex flex-col">
      <div className="home-feed-card-header">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="home-feed-card-header-title">
              <SourceTitle source={source} />
            </h3>
            <HomeFeedBadge>{HOME_FEED_BADGE_EXTERNAL}</HomeFeedBadge>
          </div>
          <p className="home-feed-card-header-description">{feedUpdatedLabel}</p>
        </div>
        <a
          className="home-feed-card-header-action"
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {externalLabel}
          <ExternalLink size={14} aria-hidden />
        </a>
      </div>

      <div className="home-feed-card-toolbar">
        <div
          className="flex flex-wrap gap-2 py-3"
          role="tablist"
          aria-label={`${isGithub ? "GitHub" : "Hugging Face"} period`}
        >
          {periods.map((period) => {
            const isActive = selectedPeriod === period;
            return (
              <button
                key={period}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={
                  isActive ? "home-feed-card-tab home-feed-card-tab-active" : "home-feed-card-tab"
                }
                onClick={() => setSelectedPeriod(period)}
              >
                {periodLabels[period]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="trend-source-ai-block">
        <div className="trend-source-ai-label-row">
          <p className="trend-source-ai-label">{aiUpdatedLabel}</p>
          <TrendAiBriefHelpTip source={source} model={digest?.model ?? ""} />
        </div>
        {isDigestLoading ? <p className="trend-brief-card-summary">Loading...</p> : null}
        {!isDigestLoading && !digest ? (
          <p className="trend-brief-card-summary">No AI brief yet for this period.</p>
        ) : null}
        {!isDigestLoading && digest ? (
          <div className="space-y-2">
            <h4 className="trend-brief-card-headline">{digest.headline}</h4>
            <p className="trend-brief-card-summary">{digest.summary}</p>
            {(digest.keywords ?? []).length > 0 ? (
              <ul className="trend-brief-keywords">
                {digest.keywords.map((keyword) => (
                  <li key={keyword}>
                    <span className="trend-brief-keyword">{keyword}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="home-feed-card-body" aria-busy={isFeedLoading} aria-live="polite">
        {isFeedLoading ? (
          <>
            <p className="sr-only">Loading feed.</p>
            {isGithub ? <GithubTrendingReposSkeleton /> : <HuggingFaceDailyPapersSkeleton />}
          </>
        ) : null}

        {!isFeedLoading && isUnavailable ? <ExternalFeedUnavailable /> : null}

        {!isFeedLoading && !isUnavailable && items.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {isGithub
              ? items.map((repo) => (
                  <GithubTrendingRepoListItem key={repo.id ?? repo.url} repo={repo} />
                ))
              : items.map((paper) => (
                  <HuggingFaceDailyPapersListItem
                    key={paper.id ?? paper.paper_id}
                    paper={paper}
                  />
                ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
