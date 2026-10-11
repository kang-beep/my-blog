import { useState } from "react";
import { ChevronDown } from "lucide-react";
import PostOnThisPage from "@/features/posts/components/PostOnThisPage";

export default function PostTocMobileBar({
  headings = [],
  activeId = "",
  onSelectHeading,
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="post-toc-mobile">
      <button
        type="button"
        className="post-toc-mobile-toggle"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>On this page</span>
        <ChevronDown
          size={18}
          aria-hidden
          className={isOpen ? "post-toc-mobile-chevron is-open" : "post-toc-mobile-chevron"}
        />
      </button>
      {isOpen ? (
        <div className="post-toc-mobile-panel">
          <PostOnThisPage
            headings={headings}
            activeId={activeId}
            hideTitle
            onSelectHeading={(id) => {
              onSelectHeading?.(id);
              setIsOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
