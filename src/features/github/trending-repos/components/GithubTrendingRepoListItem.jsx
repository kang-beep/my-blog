function ExternalActionButton({ href, children }) {
  return (
    <a
      className="btn shrink-0 no-underline"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export default function GithubTrendingRepoListItem({ repo }) {
  return (
    <li className="space-y-2 py-5 first:pt-0 last:pb-0">
      <h3 className="text-base font-semibold leading-snug text-slate-900">
        {repo.title ?? "제목 없음"}
      </h3>
      {repo.description ? (
        <p className="text-sm leading-relaxed text-slate-600">{repo.description}</p>
      ) : null}
      <div className="pt-1">
        <ExternalActionButton href={repo.url}>레포 보기</ExternalActionButton>
      </div>
    </li>
  );
}
