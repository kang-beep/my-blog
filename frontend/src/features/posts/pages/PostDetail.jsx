// 글 상세 페이지: 인스타 스타일 카드 + Giscus 댓글
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchAdjacentPosts, fetchPostById } from "@/features/posts/api/postApi";
import { getPostDetailPath, ROUTES } from "@/shared/constants/routes";
import PostCommentsSection from "@/features/comments/components/PostCommentsSection";
import PostDetailBody from "@/features/posts/components/PostDetailBody";
import PostLikeButton from "@/features/posts/components/PostLikeButton";
import PostMetaDates from "@/features/posts/components/PostMetaDates";
import TagBadge from "@/shared/ui/TagBadge";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [adjacent, setAdjacent] = useState({ previousPost: null, nextPost: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPostDetail = async () => {
      setIsLoading(true);
      setError("");
      try {
        const detail = await fetchPostById(id);
        setPost(detail);
        const adjacentPosts = await fetchAdjacentPosts(detail.created_at);
        setAdjacent(adjacentPosts);
      } catch (requestError) {
        setError(requestError.message || "상세 글을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      void loadPostDetail();
    }
  }, [id]);

  const goToCategory = (category) => {
    navigate(`${ROUTES.POSTS}?category=${encodeURIComponent(category)}`);
  };

  const goToTag = (tag) => {
    navigate(`${ROUTES.POSTS}?tag=${encodeURIComponent(tag)}`);
  };

  return (
    <section className="mx-auto w-full max-w-7xl space-y-3">
      {isLoading ? <p className="text-sm text-slate-500">글을 불러오는 중입니다...</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {!isLoading && post ? (
        <>
          <article className="w-full overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className="min-w-0 px-2 py-0 sm:px-2.5 lg:px-3">
              <header className="space-y-3 border-b border-slate-200 bg-slate-50 px-1 py-4 sm:px-1.5">
                <h1 className="text-xl font-bold leading-snug tracking-tight text-slate-900 sm:text-2xl lg:text-[1.65rem]">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1">
                  {post.category?.trim() ? (
                    <button
                      type="button"
                      onClick={() => goToCategory(post.category.trim())}
                      className="rounded border border-slate-300 bg-white px-2 py-0.5 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-100"
                    >
                      {post.category.trim()}
                    </button>
                  ) : null}
                  <PostMetaDates createdAt={post.created_at} updatedAt={post.updated_at} />
                </div>
              </header>

              <div className="space-y-4 py-4">
                <PostDetailBody content={post.content} />

                <PostCommentsSection
                  postId={post.id}
                  trailing={
                    <PostLikeButton
                      postId={post.id}
                      initialLikeCount={post.like_count}
                      variant="compact"
                    />
                  }
                >
                  {(post.tags ?? []).map((tag) => (
                    <TagBadge key={`${post.id}-${tag}`} tag={tag} onClick={goToTag} />
                  ))}
                </PostCommentsSection>
              </div>
            </div>
          </article>

          <nav className="flex flex-col gap-1 border border-slate-200 bg-white px-2 py-3 text-sm shadow-sm sm:px-2.5">
            {adjacent.previousPost ? (
              <Link className="truncate font-medium text-slate-700 hover:text-indigo-600" to={getPostDetailPath(adjacent.previousPost.id)}>
                ← 이전글 · {adjacent.previousPost.title}
              </Link>
            ) : (
              <span className="text-slate-400">이전글 없음</span>
            )}
            {adjacent.nextPost ? (
              <Link className="truncate font-medium text-slate-700 hover:text-indigo-600" to={getPostDetailPath(adjacent.nextPost.id)}>
                다음글 · {adjacent.nextPost.title} →
              </Link>
            ) : (
              <span className="text-slate-400">다음글 없음</span>
            )}
          </nav>
        </>
      ) : null}
      {!isLoading && !post && !error ? (
        <p className="text-sm text-slate-600">
          존재하지 않는 글입니다. <Link to={ROUTES.POSTS}>목록으로 이동</Link>
        </p>
      ) : null}
    </section>
  );
}
