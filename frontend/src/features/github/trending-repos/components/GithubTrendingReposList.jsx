import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import GithubMarkIcon from "@/shared/ui/GithubMarkIcon";
import { fetchGithubTrendingRepos } from "@/features/github/trending-repos/api/githubTrendingReposApi";
import GithubTrendingRepoListItem from "@/features/github/trending-repos/components/GithubTrendingRepoListItem";
import GithubTrendingReposSkeleton from "@/features/github/trending-repos/components/GithubTrendingReposSkeleton";
import {
  GITHUB_TRENDING_PAGE_URL,
  GITHUB_TRENDING_PERIOD_LABELS,
  GITHUB_TRENDING_PERIODS,
} from "@/features/github/trending-repos/constants/githubTrendingRepos";
import { HOME_FEED_BADGE_EXTERNAL } from "@/features/posts/constants/home";
import ExternalFeedUnavailable from "@/shared/ui/ExternalFeedUnavailable";
import HomeFeedBadge from "@/shared/ui/HomeFeedBadge";
import { formatDateTimeKst } from "@/shared/utils/date";

export default function GithubTrendingReposList({
  period = null,
  showPeriodTabs = true,
}) {
  const [internalPeriod, setInternalPeriod] = useState("daily");
  const selectedPeriod = period ?? internalPeriod;
  const [repos, setRepos] = useState([]);
  const [feedMeta, setFeedMeta] = useState({ syncedAt: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    const loadGithubTrendingRepos = async () => {
      setIsLoading(true);
      setIsUnavailable(false);

      try {
        const { repos: items, syncedAt } = await fetchGithubTrendingRepos(selectedPeriod);
        if (items.length === 0) {
          setRepos([]);
          setFeedMeta({ syncedAt: "" });
          setIsUnavailable(true);
          return;
        }
        setRepos(items);
        setFeedMeta({ syncedAt: syncedAt ?? "" });
      } catch {
        setRepos([]);
        setFeedMeta({ syncedAt: "" });
        setIsUnavailable(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadGithubTrendingRepos();
  }, [selectedPeriod]);

  const syncedLabel = feedMeta.syncedAt
    ? `Updated · ${formatDateTimeKst(feedMeta.syncedAt)} KST`
    : "Top repos · RSS order";
  return (
    <section className="home-feed-card flex flex-col">
      <div className="home-feed-card-header">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="home-feed-card-header-title">
              <GithubMarkIcon size={20} className="shrink-0 text-white" />
              <span>GitHub Trending</span>
            </h3>
            <HomeFeedBadge>{HOME_FEED_BADGE_EXTERNAL}</HomeFeedBadge>
          </div>
          <p className="home-feed-card-header-description">{syncedLabel}</p>
        </div>
        <a
          className="home-feed-card-header-action"
          href={GITHUB_TRENDING_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Trending
          <ExternalLink size={14} aria-hidden />
        </a>
      </div>

      {showPeriodTabs ? (
        <div className="home-feed-card-toolbar">
          <div className="flex flex-wrap gap-2 py-3" role="tablist" aria-label="GitHub Trending period">
            {GITHUB_TRENDING_PERIODS.map((periodOption) => {
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
                  {GITHUB_TRENDING_PERIOD_LABELS[periodOption]}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="home-feed-card-body" aria-busy={isLoading} aria-live="polite">
        {isLoading ? (
          <>
            <p className="sr-only">Loading GitHub Trending.</p>
            <GithubTrendingReposSkeleton />
          </>
        ) : null}

        {!isLoading && isUnavailable ? <ExternalFeedUnavailable /> : null}

        {!isLoading && !isUnavailable && repos.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {repos.map((repo) => (
              <GithubTrendingRepoListItem key={repo.id ?? repo.url} repo={repo} />
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
