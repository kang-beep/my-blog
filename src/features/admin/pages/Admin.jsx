// 관리자 대시보드: 글 CRUD와 로그아웃을 제공
import { useEffect, useState } from "react";
import { signOut } from "../../auth/api/authApi";
import { useAuthStore } from "../../auth/store/authStore";
import PostEditorForm from "../components/PostEditorForm";
import {
  createPost,
  deletePost,
  fetchAdminPosts,
  updatePost,
  uploadPostImage,
} from "../api/adminPostApi";
import { formatDate } from "../../../shared/utils/date";

export default function Admin() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = async () => {
    setIsLoading(true);
    setError("");
    try {
      const items = await fetchAdminPosts();
      setPosts(items);
    } catch (requestError) {
      setError(requestError.message || "관리자 글 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, []);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setError("");
    try {
      let imageUrl = payload.image_url ?? null;
      if (payload.imageFile) {
        imageUrl = await uploadPostImage(payload.imageFile);
      }

      const requestPayload = {
        title: payload.title,
        content: payload.content,
        category: payload.category,
        tags: payload.tags,
        image_url: imageUrl,
      };

      if (payload.id) {
        await updatePost(payload.id, requestPayload);
      } else {
        await createPost(requestPayload);
      }

      setEditingPost(null);
      await loadPosts();
    } catch (requestError) {
      setError(requestError.message || "글 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (postId) => {
    const shouldDelete = window.confirm("정말 이 글을 삭제하시겠습니까?");
    if (!shouldDelete) {
      return;
    }
    try {
      await deletePost(postId);
      await loadPosts();
    } catch (requestError) {
      setError(requestError.message || "글 삭제에 실패했습니다.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      clearSession();
    } catch (requestError) {
      setError(requestError.message || "로그아웃에 실패했습니다.");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1>관리자 대시보드</h1>
        <button className="btn" type="button" onClick={handleSignOut}>
          로그아웃
        </button>
      </div>
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}

      <PostEditorForm
        initialPost={editingPost}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      <h2>내 글 목록</h2>
      {isLoading ? <p className="text-sm text-slate-500">글 목록을 불러오는 중입니다...</p> : null}
      {!isLoading && posts.length === 0 ? (
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">등록된 글이 없습니다.</p>
      ) : null}
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.id} className="card">
            <strong>{post.title}</strong> ({post.category}) - {formatDate(post.created_at)}
            <div className="mt-2 flex gap-2">
              <button className="btn" type="button" onClick={() => setEditingPost(post)}>
                수정
              </button>
              <button className="btn" type="button" onClick={() => handleDelete(post.id)}>
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
