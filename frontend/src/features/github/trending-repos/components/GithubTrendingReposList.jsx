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
import HomeFeedBadge from "@/shared/ui/HomeFeedBadge";
import { formatDateTimeKst } from "@/shared/utils/date";

export default function GithubTrendingReposList() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [repos, setRepos] = useState([]);
  const [feedMeta, setFeedMeta] = useState({ syncedAt: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGithubTrendingRepos = async () => {
      setIsLoading(true);
      setError("");

      try {
        const { repos: items, syncedAt } = await fetchGithubTrendingRepos(selectedPeriod);
        setRepos(items);
        setFeedMeta({ syncedAt: syncedAt ?? "" });
      } catch (requestError) {
        setError(requestError.message || "Failed to load GitHub Trending.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadGithubTrendingRepos();
  }, [selectedPeriod]);

  const syncedLabel = feedMeta.syncedAt
    ? `Updated · ${formatDateTimeKst(feedMeta.syncedAt)}`
    : "Top repos · RSS order";

  return (
    <section className="home-feed-card flex flex-col border border-slate-400 bg-white shadow-sm">
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

      <div className="home-feed-card-toolbar">
        <div className="flex flex-wrap gap-2 py-3" role="tablist" aria-label="GitHub Trending period">
          {GITHUB_TRENDING_PERIODS.map((period) => {
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
                {GITHUB_TRENDING_PERIOD_LABELS[period]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="home-feed-card-body" aria-busy={isLoading} aria-live="polite">
        {isLoading ? (
          <>
            <p className="sr-only">Loading GitHub Trending.</p>
            <GithubTrendingReposSkeleton />
          </>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        ) : null}

        {!isLoading && !error && repos.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            No repos to show. Run the GitHub Actions workflow &quot;Fetch GitHub Trending Repos&quot; or{' '}
            <code className="text-xs">npm run sync:gh-trending</code> locally.
          </p>
        ) : null}

        {!isLoading && !error && repos.length > 0 ? (
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
