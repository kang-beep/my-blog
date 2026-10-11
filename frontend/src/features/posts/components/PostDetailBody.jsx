import { useEffect, useRef } from "react";
import { SHORT_POST_CONTENT_PADDING_CLASS } from "@/features/posts/constants/postDetail";
import { useIsShortPostContent } from "@/features/posts/hooks/useIsShortPostContent";
import { preparePostContentTablesHtml } from "@/features/posts/utils/applyPostContentTableLayout";
import {
  ensureAndCollectPostHeadings,
  preparePostContentHeadingsHtml,
} from "@/features/posts/utils/collectPostHeadings";
import { isHtmlContent, sanitizePostHtml } from "@/shared/lib/sanitizeHtml";
import "@/features/admin/components/RichTextEditor/editor.css";

const BODY_TEXT_CLASS = "text-[0.95rem] leading-relaxed text-slate-800 lg:text-base";

function buildPostContentHtml(content) {
  const sanitized = sanitizePostHtml(content);
  const withTables = preparePostContentTablesHtml(sanitized);
  return preparePostContentHeadingsHtml(withTables);
}

export default function PostDetailBody({ content, onHeadingsChange }) {
  const contentRef = useRef(null);
  const isShort = useIsShortPostContent(contentRef, content);
  const wrapperClassName = isShort ? SHORT_POST_CONTENT_PADDING_CLASS : "";
  const htmlContent = isHtmlContent(content) ? buildPostContentHtml(content) : "";

  useEffect(() => {
    const root = contentRef.current;
    if (!root) {
      onHeadingsChange?.([]);
      return;
    }

    onHeadingsChange?.(ensureAndCollectPostHeadings(root));
  }, [content, onHeadingsChange]);

  return (
    <div className={wrapperClassName}>
      {htmlContent ? (
        <div
          ref={contentRef}
          className={`post-content ${BODY_TEXT_CLASS}`}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        <div ref={contentRef} className={`whitespace-pre-wrap ${BODY_TEXT_CLASS}`}>
          {content}
        </div>
      )}
    </div>
  );
}
