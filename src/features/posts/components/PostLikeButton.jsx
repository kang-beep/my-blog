import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import {
  POST_ACTION_ICON_CLASS,
  POST_ACTION_ICON_SIZE,
  POST_ACTION_ICON_STROKE,
} from "@/shared/constants/postAction";
import { getOrCreateVisitorId } from "@/shared/lib/visitorId";
import {
  fetchHasLiked,
  fetchPostLikeCount,
  likePost,
  unlikePost,
} from "@/features/posts/api/postLikeApi";

export default function PostLikeButton({ postId, initialLikeCount = 0, variant = "default" }) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isCompact = variant === "compact";

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  useEffect(() => {
    if (!postId) {
      return;
    }

    const loadLikeState = async () => {
      setIsLoading(true);
      setError("");
      try {
        const visitorKey = getOrCreateVisitorId();
        const liked = await fetchHasLiked(postId, visitorKey);
        setHasLiked(liked);
      } catch (requestError) {
        setError(requestError.message || "좋아요 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadLikeState();
  }, [postId]);

  const syncLikeCount = async () => {
    const count = await fetchPostLikeCount(postId);
    setLikeCount(count);
  };

  const handleToggleLike = async () => {
    if (!postId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const visitorKey = getOrCreateVisitorId();

      if (hasLiked) {
        const result = await unlikePost(postId, visitorKey);
        setHasLiked(false);
        if (result.removed) {
          setLikeCount((prev) => Math.max(prev - 1, 0));
        } else {
          await syncLikeCount();
        }
        return;
      }

      const result = await likePost(postId, visitorKey);
      setHasLiked(true);
      if (result.alreadyLiked) {
        await syncLikeCount();
        return;
      }

      setLikeCount((prev) => prev + 1);
    } catch (requestError) {
      setError(requestError.message || "좋아요 처리에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonClass = isCompact
    ? `inline-flex flex-col items-center gap-0.5 p-1 transition-colors ${
        hasLiked ? "text-rose-600" : "text-slate-800 hover:text-rose-600"
      }`
    : `btn inline-flex w-fit gap-2 ${hasLiked ? "border-rose-200 bg-rose-50 text-rose-600" : ""}`;

  return (
    <div className={isCompact ? "inline-flex flex-col items-center" : "flex flex-col gap-1"}>
      <button
        type="button"
        className={buttonClass}
        onClick={() => void handleToggleLike()}
        disabled={isLoading || isSubmitting}
        aria-pressed={hasLiked}
        aria-label={hasLiked ? `좋아요 취소, ${likeCount}개` : `좋아요, ${likeCount}개`}
      >
        <Heart
          size={isCompact ? POST_ACTION_ICON_SIZE : 18}
          strokeWidth={isCompact ? POST_ACTION_ICON_STROKE : undefined}
          className={isCompact ? `${POST_ACTION_ICON_CLASS} ${hasLiked ? "fill-current" : ""}` : hasLiked ? "fill-current" : ""}
          aria-hidden
        />
        {isCompact ? (
          <span className="text-xs tabular-nums text-slate-500">{likeCount}</span>
        ) : isSubmitting ? (
          "처리 중..."
        ) : (
          `좋아요 ${likeCount}`
        )}
      </button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
