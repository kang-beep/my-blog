import { useRef } from "react";
import {
  SHORT_POST_CONTENT_PADDING_CLASS,
} from "@/features/posts/constants/postDetail";
import { useIsShortPostContent } from "@/features/posts/hooks/useIsShortPostContent";
import { isHtmlContent, sanitizePostHtml } from "@/shared/lib/sanitizeHtml";

const BODY_TEXT_CLASS =
  "text-[0.95rem] leading-relaxed text-slate-800 lg:text-base";

export default function PostDetailBody({ content }) {
  const contentRef = useRef(null);
  const isShort = useIsShortPostContent(contentRef, content);
  const wrapperClassName = isShort ? SHORT_POST_CONTENT_PADDING_CLASS : "";

  return (
    <div className={wrapperClassName}>
      {isHtmlContent(content) ? (
        <div
          ref={contentRef}
          className={`post-content ${BODY_TEXT_CLASS}`}
          dangerouslySetInnerHTML={{ __html: sanitizePostHtml(content) }}
        />
      ) : (
        <div ref={contentRef} className={`whitespace-pre-wrap ${BODY_TEXT_CLASS}`}>
          {content}
        </div>
      )}
    </div>
  );
}
