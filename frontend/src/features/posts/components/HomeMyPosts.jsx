import HomePostListItem from "@/features/posts/components/HomePostListItem";

export default function HomeMyPosts({ posts = [], isLoading = false, error = "" }) {
  if (isLoading) {
    return <p className="py-8 text-center text-sm text-slate-500">Loading posts...</p>;
  }

  if (error) {
    return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>;
  }

  if (posts.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No published posts yet.</p>;
  }

  return (
    <ul className="home-my-posts-list">
      {posts.map((post) => (
        <li key={post.id}>
          <HomePostListItem post={post} />
        </li>
      ))}
    </ul>
  );
}
