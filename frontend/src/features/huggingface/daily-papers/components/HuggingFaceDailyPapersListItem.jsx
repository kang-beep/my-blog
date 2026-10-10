import { HUGGINGFACE_PAPER_BASE_URL } from "@/features/huggingface/daily-papers/constants/huggingfaceDailyPapers";

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

export default function HuggingFaceDailyPapersListItem({ paper }) {
  const paperUrl = `${HUGGINGFACE_PAPER_BASE_URL}/${paper.paper_id}`;
  const upvotes = paper.upvotes ?? 0;

  return (
    <li className="space-y-2 py-5 first:pt-0 last:pb-0">
      <h3 className="text-base font-semibold leading-snug text-slate-900">
        {paper.title ?? "Untitled"}
      </h3>
      {paper.summary ? (
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{paper.summary}</p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-sm font-medium text-slate-700">▲ {upvotes}</span>
        <ExternalActionButton href={paperUrl}>View paper</ExternalActionButton>
        {paper.github_repo ? (
          <ExternalActionButton href={paper.github_repo}>GitHub</ExternalActionButton>
        ) : null}
      </div>
    </li>
  );
}
