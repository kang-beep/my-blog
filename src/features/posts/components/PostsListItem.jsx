import { Link } from "react-router-dom";
import { getPostDetailPath } from "@/shared/constants/routes";
import { formatDate } from "@/shared/utils/date";

function PostMetaLine({ post }) {
  const tags = post.tags ?? [];
  const hasLikeCount = typeof post.like_count === "number";

  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
      <time className="tabular-nums">{formatDate(post.created_at)}</time>
      {hasLikeCount ? (
        <>
          <span aria-hidden>·</span>
          <span className="tabular-nums">좋아요 {post.like_count}</span>
        </>
      ) : null}
      {tags.map((tag) => (
        <span key={`${post.id}-${tag}`} className="text-indigo-600">
          #{tag}
        </span>
      ))}
    </p>
  );
}

export default function PostsListItem({ post }) {
  return (
    <li className="flex items-start gap-2.5 border-b border-slate-100 py-2.5 last:border-b-0">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
      <div className="min-w-0 flex-1">
        <h3 className="leading-snug">
          <Link
            className="font-medium text-slate-900 no-underline hover:text-indigo-600"
            to={getPostDetailPath(post.id)}
          >
            {post.title ?? "제목 없음"}
          </Link>
        </h3>
        <PostMetaLine post={post} />
      </div>
    </li>
  );
}
