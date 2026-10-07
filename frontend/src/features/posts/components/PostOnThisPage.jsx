export default function PostOnThisPage({ headings = [], activeId = "" }) {
  if (headings.length === 0) {
    return null;
  }

  const scrollToHeading = (id) => {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="post-toc" aria-label="On this page">
      <p className="post-toc-title">On this page</p>
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
                onClick={() => scrollToHeading(heading.id)}
              >
                {heading.text}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
