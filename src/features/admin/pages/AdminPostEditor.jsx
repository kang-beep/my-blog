// 관리자 포스트 작성/수정 페이지
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PostEditorForm from "@/features/admin/components/PostEditorForm";
import {
  createPost,
  deletePost,
  updatePost,
  uploadPostImage,
} from "@/features/admin/api/adminPostApi";
import { fetchPostById } from "@/features/posts/api/postApi";
import {
  createCategory,
  fetchCategories,
} from "@/features/categories/api/categoryApi";
import { ROUTES } from "@/shared/constants/routes";

function buildPostFields(payload, imageUrl) {
  return {
    title: payload.title,
    content: payload.content,
    category: payload.category,
    category_id: payload.category_id ?? null,
    tags: payload.tags,
    image_url: imageUrl,
  };
}

export default function AdminPostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [draftPostId] = useState(() => crypto.randomUUID());

  const [post, setPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const items = await fetchCategories();
        setCategories(items);
      } catch (_error) {
        setCategories([]);
      }
    };
    void loadCategories();
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const loadPost = async () => {
      setIsLoading(true);
      setError("");
      try {
        const item = await fetchPostById(id);
        setPost(item);
      } catch (requestError) {
        setError(requestError.message || "글을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadPost();
  }, [id, isEditMode]);

  const handleAddCategory = async (name) => {
    const added = await createCategory(name);
    setCategories((prev) => [...prev, added]);
    return added;
  };

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setError("");
    try {
      const publishMeta = {
        status: "published",
        published_at: new Date().toISOString(),
      };

      if (isEditMode) {
        let imageUrl = payload.image_url ?? null;
        if (payload.imageFile) {
          imageUrl = await uploadPostImage(payload.imageFile, payload.id);
        }
        await updatePost(payload.id, buildPostFields(payload, imageUrl));
      } else if (payload.imageFile) {
        const created = await createPost({
          id: payload.id,
          ...buildPostFields(payload, null),
          ...publishMeta,
        });
        const imageUrl = await uploadPostImage(payload.imageFile, created.id);
        await updatePost(created.id, buildPostFields(payload, imageUrl));
      } else {
        await createPost({
          id: payload.id,
          ...buildPostFields(payload, null),
          ...publishMeta,
        });
      }

      navigate(ROUTES.ADMIN_POSTS);
    } catch (requestError) {
      setError(requestError.message || "글 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const shouldDelete = window.confirm("정말 이 글을 삭제하시겠습니까?");
    if (!shouldDelete) {
      return;
    }
    setIsDeleting(true);
    setError("");
    try {
      await deletePost(id);
      navigate(ROUTES.ADMIN_POSTS);
    } catch (requestError) {
      setError(requestError.message || "글 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">{isEditMode ? "글 수정" : "글 추가"}</h2>
        <Link className="btn" to={ROUTES.ADMIN_POSTS}>
          목록으로
        </Link>
      </div>

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {isLoading ? <p className="text-sm text-slate-500">글을 불러오는 중입니다...</p> : null}

      {!isLoading && (isEditMode ? post : true) ? (
        <>
          <PostEditorForm
            initialPost={isEditMode ? post : null}
            uploadPostId={isEditMode ? id : draftPostId}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            categories={categories}
            onAddCategory={handleAddCategory}
          />
          {isEditMode ? (
            <button
              className="btn text-rose-600 hover:bg-rose-50"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
            >
              {isDeleting ? "삭제 중..." : "글 삭제"}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
