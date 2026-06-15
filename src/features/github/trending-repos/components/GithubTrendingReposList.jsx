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
        setError(requestError.message || "GitHub Trending을 불러오지 못했습니다.");
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
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <span aria-hidden>⭐</span>
            <span>GitHub Trending</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">인기 레포 · RSS 순서</p>
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
            <p className="sr-only">GitHub Trending을 불러오는 중입니다.</p>
            <GithubTrendingReposSkeleton />
          </>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        ) : null}

        {!isLoading && !error && repos.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
            표시할 레포가 없습니다. GitHub Actions 동기화 후 다시 확인하세요.
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
