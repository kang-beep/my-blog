import { Link } from "react-router-dom";
import { getPostDetailPath } from "@/shared/constants/routes";
import { formatDate } from "@/shared/utils/date";
import PostListThumbnail from "@/features/posts/components/PostListThumbnail";
import {
  resolvePostExcerpt,
  resolvePostThumbnailUrl,
} from "@/features/posts/utils/postDisplay";

function PostListMeta({ post, showTags = false, statusLabel, statusTone = "published" }) {
  const tags = post.tags ?? [];
  const hasLikeCount = typeof post.like_count === "number";
  const statusClassName =
    statusTone === "draft"
      ? "rounded-none bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700"
      : "rounded-none bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700";

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500 sm:text-sm">
      {statusLabel ? <span className={statusClassName}>{statusLabel}</span> : null}
      <time className="tabular-nums">{formatDate(post.created_at)}</time>
      {hasLikeCount ? (
        <>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{post.like_count} likes</span>
        </>
      ) : null}
      {showTags
        ? tags.map((tag) => (
            <span key={`${post.id}-${tag}`} className="text-indigo-600">
              #{tag}
            </span>
          ))
        : null}
    </p>
  );
}

export default function PostListRow({
  post,
  to,
  titleClassName = "text-base font-semibold leading-snug text-slate-900",
  showTags = false,
  statusLabel,
  statusTone = "published",
}) {
  const thumbnailUrl = resolvePostThumbnailUrl(post);
  const excerpt = resolvePostExcerpt(post);
  const linkTo = to ?? getPostDetailPath(post.id);

  return (
    <Link
      to={linkTo}
      className="post-list-row group block min-w-0 rounded-none text-inherit no-underline transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      aria-label={post.title ?? "Untitled"}
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
        <PostListThumbnail src={thumbnailUrl} />
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3
            className={`leading-snug transition-colors group-hover:text-indigo-600 ${titleClassName}`}
          >
            <span className="line-clamp-2">{post.title ?? "Untitled"}</span>
          </h3>

          {excerpt ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 sm:text-[0.8125rem]">
              {excerpt}
            </p>
          ) : null}

          <PostListMeta
            post={post}
            showTags={showTags}
            statusLabel={statusLabel}
            statusTone={statusTone}
          />
        </div>
      </div>
    </Link>
  );
}
