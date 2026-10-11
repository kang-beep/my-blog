const SCROLL_PADDING_PX = 12;

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

function getStickyOffsetPx() {
  const mobileBar = document.querySelector(".post-toc-mobile");
  if (!mobileBar) {
    return SCROLL_PADDING_PX;
  }

  const style = window.getComputedStyle(mobileBar);
  if (style.display === "none" || style.visibility === "hidden") {
    return SCROLL_PADDING_PX;
  }

  // Use toggle height only — open panel would over-offset the scroll target.
  const toggle = mobileBar.querySelector(".post-toc-mobile-toggle");
  const height = toggle?.getBoundingClientRect().height || mobileBar.getBoundingClientRect().height;
  return Math.ceil(height) + SCROLL_PADDING_PX;
}

/** Scroll post heading into view, clearing sticky On this page bar on small screens. */
export function scrollToPostHeading(id) {
  const target = document.getElementById(id);
  if (!target) {
    return;
  }

  const offset = getStickyOffsetPx();
  const scrollRoot = getScrollRoot(target);

  if (!scrollRoot) {
    const top = window.scrollY + target.getBoundingClientRect().top - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    return;
  }

  const rootRect = scrollRoot.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop = scrollRoot.scrollTop + (targetRect.top - rootRect.top) - offset;
  scrollRoot.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
}
