import { useEffect, useState } from "react";

const LG_MEDIA_QUERY = "(min-width: 1024px)";

function getDefaultOpen() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(LG_MEDIA_QUERY).matches;
}

function isDesktopViewport() {
  return window.matchMedia(LG_MEDIA_QUERY).matches;
}

// Desktop defaults open; mobile defaults closed. Desktop stays collapsible.
export function useProfileSidebarOpen() {
  const [isOpen, setIsOpen] = useState(getDefaultOpen);

  useEffect(() => {
    const mediaQuery = window.matchMedia(LG_MEDIA_QUERY);

    const handleChange = (event) => {
      setIsOpen(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggle = () => setIsOpen((previous) => !previous);
  const close = () => setIsOpen(false);
  const closeIfMobile = () => {
    if (!isDesktopViewport()) {
      setIsOpen(false);
    }
  };

  return { isOpen, toggle, close, closeIfMobile };
}
