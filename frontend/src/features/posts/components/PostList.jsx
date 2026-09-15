// 글 배열을 카드 목록으로 렌더링하는 컴포넌트
import PostCard from "./PostCard";

export default function PostList({ posts = [], onTagClick }) {
  if (posts.length === 0) {
    return <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">표시할 글이 없습니다.</p>;
  }

  return (
    <section className="grid gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onTagClick={onTagClick} />
      ))}
    </section>
  );
}
