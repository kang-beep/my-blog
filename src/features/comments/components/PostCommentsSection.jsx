import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import GiscusComments from "@/features/comments/components/GiscusComments";
import {
  POST_ACTION_ICON_CLASS,
  POST_ACTION_ICON_SIZE,
  POST_ACTION_ICON_STROKE,
} from "@/shared/constants/postAction";

export default function PostCommentsSection({ postId, leading, children }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!postId) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
        <div className="flex shrink-0 items-start gap-3">
          {leading}
          <button
            type="button"
            className="inline-flex flex-col items-center gap-0.5 p-1 text-slate-800 transition-colors hover:text-slate-900"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
          >
            <MessageCircle
              size={POST_ACTION_ICON_SIZE}
              strokeWidth={POST_ACTION_ICON_STROKE}
              className={POST_ACTION_ICON_CLASS}
              aria-hidden
            />
            <span className="inline-flex items-center gap-0.5 text-xs text-slate-500">
              {isOpen ? "숨기기" : "댓글"}
              <ChevronDown
                size={12}
                className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </span>
          </button>
        </div>
        {children ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">{children}</div>
        ) : null}
      </div>
      {isOpen ? (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-3 text-xs text-slate-500">GitHub 계정으로 댓글을 남길 수 있습니다.</p>
          <GiscusComments postId={postId} />
        </div>
      ) : null}
    </section>
  );
}
