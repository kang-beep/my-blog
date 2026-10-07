import { useEffect, useState } from "react";

const TOC_ROOT_MARGIN = "-12% 0px -72% 0px";

function getScrollRoot(element) {
  let current = element?.parentElement ?? null;

  while (current) {
    const { overflowY } = window.getComputedStyle(current);
    if (overflowY === "auto" || overflowY === "scroll") {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

export function useActiveHeadingId(headings) {
  const [activeId, setActiveId] = useState("");
  const headingKey = headings.map((item) => item.id).join("|");

  useEffect(() => {
    if (!headingKey) {
      setActiveId("");
      return undefined;
    }

    const ids = headingKey.split("|");
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (elements.length === 0) {
      setActiveId("");
      return undefined;
    }

    const visibleIds = new Set();
    const root = getScrollRoot(elements[0]);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleIds.add(entry.target.id);
          } else {
            visibleIds.delete(entry.target.id);
          }
        }

        const nextActive = ids.find((id) => visibleIds.has(id));
        if (nextActive) {
          setActiveId(nextActive);
        }
      },
      { root, rootMargin: TOC_ROOT_MARGIN, threshold: [0, 0.25, 1] },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    setActiveId(elements[0].id);

    return () => observer.disconnect();
  }, [headingKey]);

  return activeId;
}
