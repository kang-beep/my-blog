import { ChevronRight } from "lucide-react";
import TrendAiBriefHelpTip from "@/features/trends/components/TrendAiBriefHelpTip";
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

      <div className="home-feed-card-body">
        <div
          className={
            source === "github" ? "home-ai-brief home-ai-brief-github" : "home-ai-brief home-ai-brief-huggingface"
          }
        >
          <div className="home-ai-brief-label-row">
            <p className="home-ai-brief-label">AI Brief</p>
            <TrendAiBriefHelpTip source={source} model={model} />
          </div>
          <p className="home-ai-card-headline">
            {isLoading
              ? "Loading..."
              : headline?.trim()
                ? headline
                : "No AI brief yet."}
          </p>
        </div>

        {isLoading ? <p className="home-ai-highlight-empty">Loading...</p> : null}
        {!isLoading && highlights.length === 0 ? (
          <p className="home-ai-highlight-empty">No items for today.</p>
        ) : null}
        {!isLoading && highlights.length > 0 ? (
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
        ) : null}
      </div>
    </article>
  );
}
