import { GITHUB_TRENDING_REPOS_TOP_LIMIT } from "@/features/github/trending-repos/constants/githubTrendingRepos";

function GithubTrendingRepoSkeletonItem() {
  return (
    <li className="animate-pulse space-y-3 py-5 first:pt-0 last:pb-0">
      <div className="h-5 w-2/3 rounded bg-slate-200" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="h-8 w-24 rounded bg-slate-100" />
    </li>
  );
}

export default function GithubTrendingReposSkeleton() {
  return (
    <ul className="divide-y divide-slate-100" aria-hidden>
      {Array.from({ length: GITHUB_TRENDING_REPOS_TOP_LIMIT }, (_, index) => (
        <GithubTrendingRepoSkeletonItem key={`github-trending-skeleton-${index}`} />
      ))}
    </ul>
  );
}
