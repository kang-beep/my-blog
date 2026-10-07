// Post detail: article + sticky On this page (h2/h3 TOC)
import { useCallback, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchAdjacentPosts, fetchPostById } from "@/features/posts/api/postApi";
import { getPostDetailPath, ROUTES } from "@/shared/constants/routes";
import PostCommentsSection from "@/features/comments/components/PostCommentsSection";
import PostDetailBody from "@/features/posts/components/PostDetailBody";
import PostLikeButton from "@/features/posts/components/PostLikeButton";
import PostMetaDates from "@/features/posts/components/PostMetaDates";
import PostOnThisPage from "@/features/posts/components/PostOnThisPage";
import { useActiveHeadingId } from "@/features/posts/hooks/useActiveHeadingId";
import TagBadge from "@/shared/ui/TagBadge";
import PageBackLink from "@/shared/ui/PageBackLink";

function AdjacentPostLink({ post, direction }) {
  const isPrevious = direction === "previous";
  const label = isPrevious ? "← Previous Post" : "Next Post →";

  if (!post) {
    return (
      <div className={`post-adjacent-slot ${isPrevious ? "post-adjacent-slot-prev" : "post-adjacent-slot-next"}`}>
        <span className="post-adjacent-label">{label}</span>
        <span className="post-adjacent-empty">No post</span>
      </div>
    );
  }

  return (
    <Link
      to={getPostDetailPath(post.id)}
      className={`post-adjacent-slot ${isPrevious ? "post-adjacent-slot-prev" : "post-adjacent-slot-next"} post-adjacent-link`}
    >
      <span className="post-adjacent-label">{label}</span>
      <span className="post-adjacent-title">{post.title}</span>
    </Link>
  );
}

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [adjacent, setAdjacent] = useState({ previousPost: null, nextPost: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [headings, setHeadings] = useState([]);
  const activeHeadingId = useActiveHeadingId(headings);

  const handleHeadingsChange = useCallback((nextHeadings) => {
    setHeadings(nextHeadings);
  }, []);

  useEffect(() => {
    setHeadings([]);
  }, [id]);

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
    <section className="post-detail-page">
      {isLoading ? (
        <p className="mx-auto max-w-3xl text-sm text-slate-500">글을 불러오는 중입니다...</p>
      ) : null}
      {error ? (
        <p className="mx-auto max-w-3xl rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
      ) : null}

      {!isLoading && post ? (
        <div
          className={
            headings.length > 0 ? "post-detail-layout" : "post-detail-layout post-detail-layout-no-toc"
          }
        >
          <div className="post-detail-main space-y-3">
            <PageBackLink to={ROUTES.POSTS} label="Posts" />

            <article className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
              <div className="min-w-0 px-3 py-0 sm:px-4 lg:px-5">
                <header className="post-detail-header">
                  <p className="page-card-label">Post</p>
                  <h1 className="post-detail-title">{post.title}</h1>
                  <div className="post-meta-inline">
                    {post.category?.trim() ? (
                      <p className="post-meta-inline-item">
                        <span className="post-meta-inline-label">Category:</span>{" "}
                        <button
                          type="button"
                          onClick={() => goToCategory(post.category.trim())}
                          className="post-meta-inline-value post-meta-inline-button"
                        >
                          {post.category.trim()}
                        </button>
                      </p>
                    ) : null}
                    <PostMetaDates
                      createdAt={post.created_at}
                      updatedAt={post.updated_at}
                      labeled
                    />
                  </div>
                  {(post.tags ?? []).length > 0 ? (
                    <div className="post-detail-tags">
                      {(post.tags ?? []).map((tag) => (
                        <TagBadge key={`${post.id}-${tag}`} tag={tag} onClick={goToTag} />
                      ))}
                    </div>
                  ) : null}
                </header>

                <div className="space-y-4 py-4">
                  <PostDetailBody content={post.content} onHeadingsChange={handleHeadingsChange} />

                  <nav className="post-adjacent-nav" aria-label="Adjacent posts">
                    <AdjacentPostLink post={adjacent.previousPost} direction="previous" />
                    <AdjacentPostLink post={adjacent.nextPost} direction="next" />
                  </nav>

                  <PostCommentsSection
                    postId={post.id}
                    trailing={
                      <PostLikeButton
                        postId={post.id}
                        initialLikeCount={post.like_count}
                        variant="compact"
                      />
                    }
                  />
                </div>
              </div>
            </article>
          </div>

          {headings.length > 0 ? (
            <aside className="post-detail-toc-aside">
              <PostOnThisPage headings={headings} activeId={activeHeadingId} />
            </aside>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !post && !error ? (
        <p className="mx-auto max-w-3xl text-sm text-slate-600">
          존재하지 않는 글입니다. <Link to={ROUTES.POSTS}>목록으로 이동</Link>
        </p>
      ) : null}
    </section>
  );
}
