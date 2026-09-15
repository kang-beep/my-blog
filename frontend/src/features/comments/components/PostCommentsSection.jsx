import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import GiscusComments from "@/features/comments/components/GiscusComments";
import {
  POST_ACTION_ICON_CLASS,
  POST_ACTION_ICON_SIZE,
  POST_ACTION_ICON_STROKE,
} from "@/shared/constants/postAction";

export default function PostCommentsSection({ postId, trailing, children }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!postId) {
    return null;
  }

  return (
    <section>
      <div className="flex items-start justify-between gap-4 border-t border-slate-100 pt-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
        <div className="flex shrink-0 items-start gap-3">
          {trailing}
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
      </div>
      {isOpen ? (
        <div className="mt-2 border-t border-slate-100 pt-2">
          <p className="mb-2 text-xs text-slate-500">GitHub 계정으로 댓글을 남길 수 있습니다.</p>
          <GiscusComments postId={postId} />
        </div>
      ) : null}
    </section>
  );
}
