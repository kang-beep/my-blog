// 글 상세 페이지: 본문, 인접 글 네비게이션, 댓글 영역 제공
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchAdjacentPosts, fetchPostById } from "../api/postApi";
import { getPostDetailPath, ROUTES } from "../../../shared/constants/routes";
import { formatDate } from "../../../shared/utils/date";
import CommentList from "../../comments/components/CommentList";
import CommentForm from "../../comments/components/CommentForm";
import { useComments } from "../../comments/hooks/useComments";
import { useAuthStore } from "../../auth/store/authStore";

export default function PostDetail() {
  const { id } = useParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [post, setPost] = useState(null);
  const [adjacent, setAdjacent] = useState({ previousPost: null, nextPost: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const {
    comments,
    isLoading: isCommentsLoading,
    error: commentsError,
    submitComment,
    removeComment,
  } = useComments(id);

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

  return (
    <section className="space-y-4">
      {isLoading ? <p className="text-sm text-slate-500">글을 불러오는 중입니다...</p> : null}
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {!isLoading && post ? (
        <>
          <h1>{post.title}</h1>
          <p className="text-sm text-slate-600">
            {post.category} | {formatDate(post.created_at)}
          </p>
          {post.image_url ? (
            <img src={post.image_url} alt={post.title} className="max-h-[28rem] w-full rounded-xl object-cover" />
          ) : null}
          <article className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4">
            {post.content}
          </article>

          <nav className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-3">
            {adjacent.previousPost ? (
              <Link className="font-medium" to={getPostDetailPath(adjacent.previousPost.id)}>
                이전글: {adjacent.previousPost.title}
              </Link>
            ) : (
              <span className="text-sm text-slate-500">이전글 없음</span>
            )}
            {adjacent.nextPost ? (
              <Link className="font-medium" to={getPostDetailPath(adjacent.nextPost.id)}>
                다음글: {adjacent.nextPost.title}
              </Link>
            ) : (
              <span className="text-sm text-slate-500">다음글 없음</span>
            )}
          </nav>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
            <h2>댓글</h2>
            {isCommentsLoading ? <p className="text-sm text-slate-500">댓글을 불러오는 중입니다...</p> : null}
            {commentsError ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{commentsError}</p> : null}
            <CommentList
              comments={comments}
              canDelete={isAuthenticated}
              onDelete={removeComment}
            />
            <CommentForm
              onSubmit={(payload) => submitComment({ ...payload, post_id: id })}
            />
          </section>
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
