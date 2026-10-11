import { scrollToPostHeading } from "@/features/posts/utils/scrollToPostHeading";

export default function PostOnThisPage({
  headings = [],
  activeId = "",
  onSelectHeading,
  hideTitle = false,
}) {
  return (
    <nav className="post-toc" aria-label="On this page">
      {hideTitle ? null : <p className="post-toc-title">On this page</p>}
      {headings.length === 0 ? (
        <p className="post-toc-empty">No title</p>
      ) : (
        <ol className="post-toc-list">
          {headings.map((heading) => {
            const isActive = heading.id === activeId;

            return (
              <li key={heading.id}>
                <button
                  type="button"
                  className={
                    isActive
                      ? "post-toc-link post-toc-link-active"
                      : heading.level === 3
                        ? "post-toc-link post-toc-link-h3"
                        : "post-toc-link"
                  }
                  onClick={() => {
                    onSelectHeading?.(heading.id);
                    // Wait a frame so mobile TOC panel can collapse before measuring offset.
                    requestAnimationFrame(() => {
                      scrollToPostHeading(heading.id);
                    });
                  }}
                >
                  {heading.text}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}
