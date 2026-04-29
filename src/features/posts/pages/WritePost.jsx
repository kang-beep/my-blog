// 관리자 전용 글 작성 페이지
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PostEditorForm from "../../admin/components/PostEditorForm";
import { createPost, uploadPostImage } from "../../admin/api/adminPostApi";
import { ROUTES, getPostDetailPath } from "../../../shared/constants/routes";
import {
  createCategory,
  fetchCategories as fetchManagedCategories,
} from "../../categories/api/categoryApi";

export default function WritePost() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

  const loadCategories = async () => {
    try {
      const items = await fetchManagedCategories();
      setCategories(items);
    } catch (_error) {
      setCategories([]);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const handleAddCategory = async (name) => {
    const added = await createCategory(name);
    setCategories((prev) => [...prev, added]);
    return added;
  };

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setError("");
    try {
      let imageUrl = null;
      if (payload.imageFile) {
        imageUrl = await uploadPostImage(payload.imageFile);
      }
      const created = await createPost({
        title: payload.title,
        content: payload.content,
        category: payload.category,
        category_id: payload.category_id ?? null,
        tags: payload.tags,
        image_url: imageUrl,
        status: "published",
        published_at: new Date().toISOString(),
      });
      navigate(getPostDetailPath(created.id));
    } catch (requestError) {
      setError(requestError.message || "글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1>새 글 작성</h1>
        <button className="btn" type="button" onClick={() => navigate(ROUTES.POSTS)}>
          목록으로
        </button>
      </div>
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      <PostEditorForm
        initialPost={null}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        categories={categories}
        onAddCategory={handleAddCategory}
      />
    </section>
  );
}
