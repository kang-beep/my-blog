// 관리자 포스트 작성/수정 페이지
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PostEditorForm from "@/features/admin/components/PostEditorForm";
import {
  createPost,
  deletePost,
  fetchAdminPostById,
  updatePost,
  uploadPostImage,
} from "@/features/admin/api/adminPostApi";
import { persistExternalPostImages } from "@/features/admin/api/persistPostImagesApi";
import { refreshTagStats } from "@/features/tags/api/tagApi";
import { extractFirstImageSrc } from "@/features/posts/utils/postDisplay";
import {
  POST_STATUS_DRAFT,
  POST_STATUS_PUBLISHED,
} from "@/shared/constants/postStatus";
import { ensureDefaultCategory, fetchCategories } from "@/features/categories/api/categoryApi";
import { resolvePostCategoryFields } from "@/features/categories/utils/resolvePostCategory";
import { getAdminPostEditPath, ROUTES } from "@/shared/constants/routes";
import Toast from "@/shared/ui/Toast";

function buildPostFields(payload, imageUrl, categories) {
  const isPublished = payload.status === POST_STATUS_PUBLISHED;
  const excerpt = payload.excerpt?.trim() || null;
  const resolvedImageUrl =
    imageUrl?.trim() || payload.image_url?.trim() || extractFirstImageSrc(payload.content) || null;
  const { category_id, category } = resolvePostCategoryFields(categories, payload.category_id);

  const fields = {
    title: payload.title,
    content: payload.content,
    excerpt,
    category,
    category_id,
    tags: payload.tags,
    image_url: resolvedImageUrl,
    status: payload.status,
  };

  if (isPublished) {
    fields.published_at = payload.published_at ?? new Date().toISOString();
  }

  return fields;
}

export default function AdminPostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(id);
  const [draftPostId] = useState(() => crypto.randomUUID());

  const [post, setPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const clearToast = useCallback(() => {
    setToastMessage("");
  }, []);

  useEffect(() => {
    const messageFromNav = location.state?.toastMessage;
    if (!messageFromNav) {
      return;
    }
    setToastMessage(messageFromNav);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        await ensureDefaultCategory();
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
        const item = await fetchAdminPostById(id);
        setPost(item);
      } catch (requestError) {
        setError(requestError.message || "Could not load post.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadPost();
  }, [id, isEditMode]);

  const handleSubmit = async (payload) => {
    setIsSubmitting(true);
    setError("");
    try {
      const persisted = await persistExternalPostImages({
        postId: payload.id,
        contentHtml: payload.content ?? "",
        imageUrl: payload.image_url ?? null,
      });
      const nextPayload = {
        ...payload,
        content: persisted.contentHtml,
        image_url: persisted.imageUrl,
      };
      const persistWarning =
        persisted.warnings?.length > 0
          ? ` Some images could not be copied (${persisted.warnings.length}). Re-import from Notion while links are fresh.`
          : "";

      if (isEditMode) {
        let imageUrl = nextPayload.image_url ?? null;
        if (nextPayload.imageFile) {
          imageUrl = await uploadPostImage(nextPayload.imageFile, nextPayload.id);
        }
        await updatePost(
          nextPayload.id,
          buildPostFields(
            { ...nextPayload, published_at: post?.published_at ?? null },
            imageUrl,
            categories,
          ),
        );
        await refreshTagStats();
        setToastMessage(`Post saved.${persistWarning}`);
        return;
      }

      if (nextPayload.imageFile) {
        const created = await createPost({
          id: nextPayload.id,
          ...buildPostFields(nextPayload, null, categories),
        });
        const imageUrl = await uploadPostImage(nextPayload.imageFile, created.id);
        await updatePost(
          created.id,
          buildPostFields({ ...nextPayload, published_at: null }, imageUrl, categories),
        );
        await refreshTagStats();
        navigate(getAdminPostEditPath(created.id), {
          replace: true,
          state: { toastMessage: `Post published.${persistWarning}` },
        });
        return;
      }

      await createPost({
        id: nextPayload.id,
        ...buildPostFields(nextPayload, null, categories),
      });
      await refreshTagStats();
      navigate(getAdminPostEditPath(nextPayload.id), {
        replace: true,
        state: { toastMessage: `Post published.${persistWarning}` },
      });
    } catch (requestError) {
      setError(requestError.message || "Could not save post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const shouldDelete = window.confirm("Delete this post?");
    if (!shouldDelete) {
      return;
    }
    setIsDeleting(true);
    setError("");
    try {
      await deletePost(id);
      await refreshTagStats();
      navigate(ROUTES.ADMIN_POSTS);
    } catch (requestError) {
      setError(requestError.message || "Could not delete post.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="space-y-4">
      <Toast message={toastMessage} visible={Boolean(toastMessage)} onClose={clearToast} />

      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {isLoading ? <p className="text-sm text-slate-500">Loading post...</p> : null}

      {!isLoading && (isEditMode ? post : true) ? (
        <>
          <PostEditorForm
            initialPost={isEditMode ? post : null}
            uploadPostId={isEditMode ? id : draftPostId}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            categories={categories}
          />
          {isEditMode ? (
            <button
              className="btn text-rose-600 hover:bg-rose-50"
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isSubmitting}
            >
              {isDeleting ? "Deleting..." : "Delete post"}
            </button>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
