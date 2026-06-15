import {
  HUGGINGFACE_DAILY_PAPERS_KEYWORD_LIMIT,
  HUGGINGFACE_PAPER_BASE_URL,
} from "@/features/huggingface/daily-papers/constants/huggingfaceDailyPapers";

function formatKeywordTag(keyword) {
  const trimmed = String(keyword).trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function PaperKeywords({ keywords = [] }) {
  const visibleKeywords = keywords.slice(0, HUGGINGFACE_DAILY_PAPERS_KEYWORD_LIMIT);

  if (visibleKeywords.length === 0) {
    return null;
  }

  return (
    <p className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-indigo-600">
      {visibleKeywords.map((keyword) => (
        <span key={keyword}>{formatKeywordTag(keyword)}</span>
      ))}
    </p>
  );
}

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
        {paper.title ?? "제목 없음"}
      </h3>
      {paper.ai_summary ? (
        <p className="text-sm leading-relaxed text-slate-600">{paper.ai_summary}</p>
      ) : null}
      <PaperKeywords keywords={paper.ai_keywords} />
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-sm font-medium text-slate-700">▲ {upvotes}</span>
        <ExternalActionButton href={paperUrl}>논문 보기</ExternalActionButton>
        {paper.github_repo ? (
          <ExternalActionButton href={paper.github_repo}>GitHub</ExternalActionButton>
        ) : null}
      </div>
    </li>
  );
}
