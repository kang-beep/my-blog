// 관리자 전용 글 수정 페이지
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PostEditorForm from "../../admin/components/PostEditorForm";
import { updatePost, uploadPostImage } from "../../admin/api/adminPostApi";
import { fetchPostById } from "../api/postApi";
import { ROUTES, getPostDetailPath } from "../../../shared/constants/routes";
import {
  createCategory,
  fetchCategories as fetchManagedCategories,
} from "../../categories/api/categoryApi";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [postItem, categoryItems] = await Promise.all([
          fetchPostById(id),
          fetchManagedCategories().catch(() => []),
        ]);
        setPost(postItem);
        setCategories(categoryItems);
      } catch (requestError) {
        setError(requestError.message || "글을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      void load();
    }
  }, [id]);

  const handleAddCategory = async (name) => {
    const added = await createCategory(name);
    setCategories((prev) => [...prev, added]);
    return added;
  };

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setError("");
    try {
      let imageUrl = payload.image_url ?? null;
      if (payload.imageFile) {
        imageUrl = await uploadPostImage(payload.imageFile);
      }
      await updatePost(payload.id, {
        title: payload.title,
        content: payload.content,
        category: payload.category,
        category_id: payload.category_id ?? null,
        tags: payload.tags,
        image_url: imageUrl,
      });
      navigate(getPostDetailPath(payload.id));
    } catch (requestError) {
      setError(requestError.message || "글 수정에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>글 수정</h1>
        <button className="btn" type="button" onClick={() => navigate(ROUTES.POSTS)}>
          목록으로
        </button>
      </div>
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {isLoading ? <p className="text-sm text-slate-500">글을 불러오는 중입니다...</p> : null}
      {!isLoading && post ? (
        <PostEditorForm
          initialPost={post}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          categories={categories}
          onAddCategory={handleAddCategory}
        />
      ) : null}
    </section>
  );
}
