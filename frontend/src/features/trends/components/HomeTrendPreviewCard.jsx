import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import TrendAiBriefHelpTip from "@/features/trends/components/TrendAiBriefHelpTip";
import { ROUTES } from "@/shared/constants/routes";
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

export default function HomeTrendPreviewCard({
  source,
  title,
  headline,
  model = "",
  updatedLabel,
  highlights = [],
  isLoading = false,
}) {
  const sourceLabel = source === "github" ? "GitHub" : "Hugging Face";
  const feedListLabel = source === "github" ? "Trending repos" : "Top papers";
  const feedListHint = source === "github" ? "Top highlights today" : "Top by upvotes";

  return (
    <article className="home-feed-card">
      <header className="home-feed-card-header">
        <div>
          <h3 className="home-feed-card-header-title">
            <SourceIcon source={source} />
            <span>{title}</span>
          </h3>
          <p className="home-feed-card-header-description">
            {sourceLabel} · updated {updatedLabel}
          </p>
        </div>
      </header>

      <div className="trend-source-ai-block">
        <div className="trend-source-ai-label-row">
          <p className="trend-source-ai-label">AI Brief</p>
          <TrendAiBriefHelpTip source={source} model={model} />
        </div>
        <section className="trend-brief-section">
          <p className="trend-brief-section-label">Headline</p>
          <h4 className="trend-brief-card-headline">
            {isLoading ? "Loading..." : headline?.trim() ? headline : "No AI brief yet."}
          </h4>
        </section>
      </div>

      <div className="home-feed-card-body">
        <div className="trend-feed-list-header">
          <p className="trend-brief-section-label">{feedListLabel}</p>
          <p className="trend-feed-list-hint">{feedListHint}</p>
        </div>

        {isLoading ? <p className="home-ai-highlight-empty">Loading...</p> : null}
        {!isLoading && highlights.length === 0 ? (
          <p className="home-ai-highlight-empty">No items for today.</p>
        ) : null}
        {!isLoading && highlights.length > 0 ? (
          <>
            <ul className="home-ai-highlight-list">
              {highlights.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="home-ai-highlight-row"
                  >
                    <div className="home-ai-highlight-body">
                      <p className="home-ai-highlight-title">{item.title}</p>
                      {item.description ? (
                        <p className="home-ai-highlight-description line-clamp-1">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="home-ai-highlight-aside">
                      {item.metric ? (
                        <span className="home-ai-highlight-metric">{item.metric}</span>
                      ) : null}
                      <ChevronRight size={16} className="home-ai-highlight-arrow" aria-hidden />
                    </div>
                  </a>
                </li>
              ))}
            </ul>
            <Link to={ROUTES.TRENDS} className="home-ai-more-link">
              <span className="home-ai-more-dots" aria-hidden>
                <span />
                <span />
                <span />
              </span>
              <span className="home-ai-more-label">Trends all</span>
            </Link>
          </>
        ) : null}
      </div>
    </article>
  );
}
