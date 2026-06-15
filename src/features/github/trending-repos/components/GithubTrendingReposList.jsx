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

export default function GithubTrendingReposList() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [repos, setRepos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGithubTrendingRepos = async () => {
      setIsLoading(true);
      setError("");

      try {
        const items = await fetchGithubTrendingRepos(selectedPeriod);
        setRepos(items);
      } catch (requestError) {
        setError(requestError.message || "Failed to load GitHub Trending.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadGithubTrendingRepos();
  }, [selectedPeriod]);

  return (
    <section className="home-feed-card flex flex-col border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <GithubMarkIcon size={20} className="shrink-0 text-slate-800" />
              <span>GitHub Trending</span>
            </h3>
            <HomeFeedBadge>{HOME_FEED_BADGE_EXTERNAL}</HomeFeedBadge>
          </div>
          <p className="mt-1 text-sm text-slate-500">Top repos · RSS order</p>
        </div>
        <a
          className="btn inline-flex shrink-0 items-center gap-1.5 no-underline"
          href={GITHUB_TRENDING_PAGE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Trending
          <ExternalLink size={14} aria-hidden />
        </a>
      </div>

      <div className="border-b border-slate-100 px-4 sm:px-6">
        <div className="flex flex-wrap gap-2 py-3" role="tablist" aria-label="GitHub Trending period">
          {GITHUB_TRENDING_PERIODS.map((period) => {
            const isActive = selectedPeriod === period;

            return (
              <button
                key={period}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
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
            No repos to show. Run the GitHub Actions sync and check again.
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
