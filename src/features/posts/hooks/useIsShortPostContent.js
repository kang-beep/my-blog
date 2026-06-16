import { useEffect, useState } from "react";
import { SHORT_POST_CONTENT_HEIGHT_PX } from "@/features/posts/constants/postDetail";

function measureContentHeight(element) {
  return element.scrollHeight < SHORT_POST_CONTENT_HEIGHT_PX;
}

export function useIsShortPostContent(contentRef, contentKey) {
  const [isShort, setIsShort] = useState(false);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) {
      setIsShort(false);
      return undefined;
    }

    const update = () => {
      setIsShort(measureContentHeight(element));
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    const images = element.querySelectorAll("img");
    images.forEach((image) => {
      image.addEventListener("load", update);
    });

    return () => {
      observer.disconnect();
      images.forEach((image) => {
        image.removeEventListener("load", update);
      });
    };
  }, [contentRef, contentKey]);

  return isShort;
}
