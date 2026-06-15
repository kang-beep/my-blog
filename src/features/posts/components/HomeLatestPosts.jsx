import { Link } from "react-router-dom";
import { getPostDetailPath } from "@/shared/constants/routes";
import { formatDate } from "@/shared/utils/date";

export default function HomeLatestPosts({ posts = [], compact = false }) {
  if (posts.length === 0) {
    return (
      <p className={compact ? "py-8 text-center text-sm text-slate-500" : "px-4 py-8 text-center text-sm text-slate-500 sm:px-6"}>
        No published posts yet.
      </p>
    );
  }

  if (compact) {
    return (
      <ol className="divide-y divide-slate-100">
        {posts.map((post) => (
          <li key={post.id} className="py-5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <Link
                className="line-clamp-2 block text-lg font-bold leading-snug text-slate-900 no-underline hover:text-indigo-600"
                to={getPostDetailPath(post.id)}
              >
                {post.title}
              </Link>
              <p className="mt-2 truncate text-sm text-slate-500 sm:text-base">
                {formatDate(post.created_at)}
                {typeof post.like_count === "number" ? ` · ${post.like_count} likes` : null}
              </p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="divide-y divide-slate-100">
      {posts.map((post, index) => (
        <li key={post.id} className="flex items-start gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <span className="mt-0.5 w-5 shrink-0 text-center text-sm font-semibold text-indigo-600">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <Link
              className="block font-medium leading-snug text-slate-900 no-underline hover:text-indigo-600"
              to={getPostDetailPath(post.id)}
            >
              {post.title}
            </Link>
            <p className="mt-1 text-xs text-slate-500">
              {post.category ?? "Uncategorized"} · {formatDate(post.created_at)}
              {typeof post.like_count === "number" ? ` · ${post.like_count} likes` : null}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
