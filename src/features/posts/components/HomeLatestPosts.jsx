import PostListRow from "@/features/posts/components/PostListRow";

export default function HomeLatestPosts({ posts = [], compact = false }) {
  if (posts.length === 0) {
    return (
      <p
        className={
          compact
            ? "py-8 text-center text-sm text-slate-500"
            : "px-4 py-8 text-center text-sm text-slate-500 sm:px-6"
        }
      >
        No published posts yet.
      </p>
    );
  }

  if (compact) {
    return (
      <ol className="divide-y divide-slate-200">
        {posts.map((post) => (
          <li key={post.id} className="py-4 first:pt-0 last:pb-0">
            <PostListRow post={post} />
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="divide-y divide-slate-200">
      {posts.map((post, index) => (
        <li key={post.id} className="flex items-start gap-3 px-4 py-3.5 sm:gap-4 sm:px-6 sm:py-4">
          <span className="mt-0.5 w-5 shrink-0 text-center text-sm font-semibold text-indigo-600">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <PostListRow post={post} titleClassName="font-medium text-slate-900" />
          </div>
        </li>
      ))}
    </ol>
  );
}
