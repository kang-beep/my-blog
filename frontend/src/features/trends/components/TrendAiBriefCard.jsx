import GithubMarkIcon from "@/shared/ui/GithubMarkIcon";

function SourceIcon({ source }) {
  if (source === "github") {
    return <GithubMarkIcon size={18} className="shrink-0 text-white" />;
  }
  return (
    <span className="text-base leading-none" aria-hidden>
      🤗
    </span>
  );
}

function periodToLabel(period) {
  if (period === "weekly") {
    return "Weekly";
  }
  if (period === "daily") {
    return "Daily";
  }
  if (period === "monthly") {
    return "Monthly";
  }
  return "—";
}

export default function TrendAiBriefCard({
  source,
  period = null,
  digest = null,
  isLoading = false,
}) {
  const resolvedSource = digest?.source ?? source;
  const sourceLabel = resolvedSource === "github" ? "GitHub" : "Hugging Face";
  const periodLabel = periodToLabel(digest?.period ?? period);

  return (
    <article className="home-feed-card">
      <header className="home-feed-card-header">
        <div>
          <p className="home-feed-card-header-title">
            <SourceIcon source={resolvedSource} />
            <span>
              {sourceLabel} · {periodLabel}
            </span>
          </p>
          <p className="home-feed-card-header-description">
            {isLoading
              ? "Loading AI brief..."
              : digest?.updatedLabel
                ? `AI brief · updated ${digest.updatedLabel}`
                : "AI brief · not generated yet"}
          </p>
        </div>
      </header>

      <div className="home-feed-card-body space-y-3">
        {isLoading ? (
          <p className="trend-brief-card-summary">Loading...</p>
        ) : null}

        {!isLoading && !digest ? (
          <p className="trend-brief-card-summary">No AI brief yet for this period.</p>
        ) : null}

        {!isLoading && digest ? (
          <>
            <h3 className="trend-brief-card-headline">{digest.headline}</h3>
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
          </>
        ) : null}
      </div>
    </article>
  );
}
