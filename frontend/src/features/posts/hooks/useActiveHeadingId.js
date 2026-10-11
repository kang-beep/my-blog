import { useCallback, useEffect, useRef, useState } from "react";

const ACTIVE_OFFSET_PX = 96;
const CLICK_SCROLL_LOCK_MS = 1000;

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

function resolveActiveHeadingId(ids) {
  const elements = ids
    .map((id) => document.getElementById(id))
    .filter((element) => element instanceof HTMLElement);
  if (elements.length === 0) {
    return "";
  }

  const scrollRoot = getScrollRoot(elements[0]);
  const rootTop = scrollRoot ? scrollRoot.getBoundingClientRect().top : 0;
  const marker = rootTop + ACTIVE_OFFSET_PX;

  let activeId = elements[0].id;
  for (const element of elements) {
    if (element.getBoundingClientRect().top <= marker) {
      activeId = element.id;
      continue;
    }
    break;
  }

  return activeId;
}

export function useActiveHeadingId(headings) {
  const [activeId, setActiveId] = useState("");
  const lockUntilRef = useRef(0);
  const headingKey = headings.map((item) => item.id).filter(Boolean).join("|");

  const selectHeading = useCallback((id) => {
    if (!id) {
      return;
    }
    lockUntilRef.current = Date.now() + CLICK_SCROLL_LOCK_MS;
    setActiveId(id);
  }, []);

  useEffect(() => {
    if (!headingKey) {
      setActiveId("");
      return undefined;
    }

    const ids = headingKey.split("|");
    const first = document.getElementById(ids[0]);
    if (!first) {
      setActiveId("");
      return undefined;
    }

    const scrollRoot = getScrollRoot(first);
    const scrollTarget = scrollRoot ?? window;

    const updateActive = () => {
      if (Date.now() < lockUntilRef.current) {
        return;
      }
      setActiveId(resolveActiveHeadingId(ids));
    };

    updateActive();
    scrollTarget.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);

    return () => {
      scrollTarget.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [headingKey]);

  return [activeId, selectHeading];
}
