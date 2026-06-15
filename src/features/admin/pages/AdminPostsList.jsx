// 관리자 포스트 목록 페이지
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminPosts } from "@/features/admin/api/adminPostApi";
import { ROUTES, getAdminPostEditPath } from "@/shared/constants/routes";
import { formatDate } from "@/shared/utils/date";
import { POST_STATUS_DRAFT, POST_STATUS_LABELS, POST_STATUS_PUBLISHED } from "@/shared/constants/postStatus";

export default function AdminPostsList() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPosts = async () => {
      setIsLoading(true);
      setError("");
      try {
        const items = await fetchAdminPosts();
        setPosts(items);
      } catch (requestError) {
        setError(requestError.message || "글 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadPosts();
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">포스트</h2>
        <Link className="btn btn-primary" to={ROUTES.ADMIN_POSTS_NEW}>
          + 글 추가
        </Link>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {isLoading ? <p className="text-sm text-slate-500">글 목록을 불러오는 중입니다...</p> : null}

      {!isLoading && !error && posts.length === 0 ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">등록된 글이 없습니다.</p>
      ) : null}

      {!isLoading && posts.length > 0 ? (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li key={post.id}>
              <Link
                to={getAdminPostEditPath(post.id)}
                className="card block transition hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <p className="font-semibold text-slate-900">{post.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      post.status === POST_STATUS_DRAFT
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {POST_STATUS_LABELS[post.status] ?? POST_STATUS_LABELS[POST_STATUS_PUBLISHED]}
                  </span>
                  <span>
                    {post.category} · {formatDate(post.created_at)}
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
