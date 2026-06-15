// 글 상세 페이지: 인스타 스타일 카드 + Giscus 댓글
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchAdjacentPosts, fetchPostById } from "@/features/posts/api/postApi";
import { getPostDetailPath, ROUTES } from "@/shared/constants/routes";
import PostCommentsSection from "@/features/comments/components/PostCommentsSection";
import PostLikeButton from "@/features/posts/components/PostLikeButton";
import PostMetaDates from "@/features/posts/components/PostMetaDates";
import TagBadge from "@/shared/ui/TagBadge";
import { isHtmlContent, sanitizePostHtml } from "@/shared/lib/sanitizeHtml";

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

  const hasHeroImage = Boolean(post?.image_url);

  return (
    <section className="mx-auto w-full max-w-xl space-y-2 lg:max-w-5xl xl:max-w-6xl">
      {isLoading ? <p className="text-sm text-slate-500">글을 불러오는 중입니다...</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {!isLoading && post ? (
        <>
          <article className="overflow-hidden border border-slate-200 bg-white shadow-sm">
            <div className={hasHeroImage ? "lg:flex lg:items-stretch" : undefined}>
              {hasHeroImage ? (
                <div className="lg:w-[min(46%,32rem)] lg:shrink-0 lg:border-r lg:border-slate-100">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="aspect-[4/3] w-full object-cover lg:aspect-auto lg:h-full lg:min-h-[20rem] lg:max-h-[44rem]"
                  />
                </div>
              ) : null}

              <div className="min-w-0 flex-1 space-y-2 p-2 sm:p-2.5 lg:p-3">
                <header className="space-y-1 border-b border-slate-100 pb-2">
                  <h1 className="text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-[1.65rem] lg:text-3xl">
                    {post.title}
                  </h1>
                  <PostMetaDates createdAt={post.created_at} updatedAt={post.updated_at} />
                </header>

                {isHtmlContent(post.content) ? (
                  <div
                    className="post-content text-[0.95rem] leading-relaxed text-slate-800 lg:text-base"
                    dangerouslySetInnerHTML={{ __html: sanitizePostHtml(post.content) }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-slate-800 lg:text-base">
                    {post.content}
                  </div>
                )}

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
                  {post.category?.trim() ? (
                    <TagBadge tag={post.category.trim()} onClick={goToCategory} />
                  ) : null}
                  {(post.tags ?? []).map((tag) => (
                    <TagBadge key={`${post.id}-${tag}`} tag={tag} onClick={goToTag} />
                  ))}
                </PostCommentsSection>
              </div>
            </div>
          </article>

          <nav className="flex flex-col gap-1 border border-slate-200 bg-white px-2 py-2 text-sm shadow-sm sm:px-2.5">
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
