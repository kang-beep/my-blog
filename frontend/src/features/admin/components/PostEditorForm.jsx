// 관리자 글 작성/수정 폼: 태그 파싱과 이미지 업로드를 함께 처리
import { useEffect, useRef, useState } from "react";
import { RefreshCw, Upload, X } from "lucide-react";
import RichTextEditor, { isEditorContentEmpty } from "@/features/admin/components/RichTextEditor/RichTextEditor";
import {
  POST_STATUS_DRAFT,
  POST_STATUS_PUBLISHED,
} from "@/shared/constants/postStatus";
import { DEFAULT_POST_CATEGORY_NAME } from "@/shared/constants/categories";
import { ICON_SIZE, ICON_STROKE } from "@/shared/constants/navigation";
import { ROUTES } from "@/shared/constants/routes";

function parseTags(tagsInput) {
  return tagsInput
    .split(",")
    .map((item) => item.trim().replace(/^#+/, "").trim())
    .filter(Boolean);
}

export default function PostEditorForm({
  initialPost,
  uploadPostId,
  onSubmit,
  isSubmitting,
  categories = [],
}) {
  const [title, setTitle] = useState(() => initialPost?.title ?? "");
  const [excerpt, setExcerpt] = useState(() => initialPost?.excerpt ?? "");
  const [content, setContent] = useState(() => initialPost?.content ?? "");
  const [category, setCategory] = useState(() => initialPost?.category ?? "");
  const [categoryId, setCategoryId] = useState(() => initialPost?.category_id ?? "");
  const [tagsInput, setTagsInput] = useState(() => (initialPost?.tags ?? []).join(", "));
  const [status, setStatus] = useState(() =>
    initialPost?.status === POST_STATUS_DRAFT ? POST_STATUS_DRAFT : POST_STATUS_PUBLISHED,
  );
  const [imageFile, setImageFile] = useState(null);
  const [thumbnailCleared, setThumbnailCleared] = useState(false);
  const [contentError, setContentError] = useState("");
  const formRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    setTitle(initialPost?.title ?? "");
    setExcerpt(initialPost?.excerpt ?? "");
    setContent(initialPost?.content ?? "");
    setCategory(initialPost?.category ?? "");
    setTagsInput((initialPost?.tags ?? []).join(", "));
    setStatus(initialPost?.status === POST_STATUS_DRAFT ? POST_STATUS_DRAFT : POST_STATUS_PUBLISHED);
    setImageFile(null);
    setThumbnailCleared(false);

    const initialCategoryId = initialPost?.category_id ?? "";
    if (initialCategoryId) {
      setCategoryId(initialCategoryId);
      return;
    }

    const matched = categories.find((item) => item.name === initialPost?.category);
    setCategoryId(matched?.id ?? "");
  }, [initialPost, categories]);

  useEffect(() => {
    if (categoryId && !categories.some((item) => item.id === categoryId)) {
      setCategoryId("");
      setCategory("");
      return;
    }

    const selected = categories.find((item) => item.id === categoryId);
    if (selected) {
      setCategory(selected.name);
    }
  }, [categories, categoryId]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const isSaveShortcut =
        (event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "s";
      if (!isSaveShortcut) {
        return;
      }

      event.preventDefault();
      if (isSubmitting) {
        return;
      }
      formRef.current?.requestSubmit();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting]);

  const handleGoToList = () => {
    // Full page navigation — bypasses React/TipTap destroy path that freezes the main thread.
    window.location.assign(ROUTES.ADMIN_POSTS);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isEditorContentEmpty(content)) {
      setContentError("본문을 입력해 주세요.");
      return;
    }
    setContentError("");
    await onSubmit?.({
      id: initialPost?.id ?? uploadPostId,
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      category_id: categoryId || null,
      tags: parseTags(tagsInput),
      status,
      imageFile,
      image_url: thumbnailCleared ? null : (initialPost?.image_url ?? null),
    });
  };

  const handlePickImage = (event) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) {
      return;
    }
    setImageFile(file);
    setThumbnailCleared(false);
  };

  const handleClearThumbnail = () => {
    setImageFile(null);
    setThumbnailCleared(true);
  };

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const selectedCategoryName =
    categories.find((item) => item.id === categoryId)?.name ?? category;

  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(null);

  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setThumbnailPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }

    if (thumbnailCleared) {
      setThumbnailPreviewUrl(null);
      return undefined;
    }

    setThumbnailPreviewUrl(initialPost?.image_url ?? null);
    return undefined;
  }, [imageFile, thumbnailCleared, initialPost?.image_url]);

  const hasThumbnail = Boolean(thumbnailPreviewUrl);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold">{initialPost ? "글 수정" : "새 글 작성"}</h2>
        <button
          type="button"
          className="btn shrink-0 gap-1.5"
          onClick={handleGoToList}
        >
          <span aria-hidden>📋</span>
          목록으로
        </button>
      </div>
      <div>
        <label className="label" htmlFor="title">제목</label>
        <input
          className="input"
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="excerpt">요약</label>
        <textarea
          className="input min-h-24 resize-y"
          id="excerpt"
          value={excerpt}
          onChange={(event) => setExcerpt(event.target.value)}
          placeholder="목록에 표시할 소개글 (비우면 본문 앞부분이 자동으로 사용됩니다)"
        />
      </div>
      <div>
        <p className="label" id="post-content-label">
          본문
        </p>
        <div aria-labelledby="post-content-label">
          <RichTextEditor
            value={content}
            onChange={setContent}
            postId={uploadPostId}
            disabled={isSubmitting}
          />
        </div>
        {contentError ? <p className="mt-1 text-sm text-rose-600">{contentError}</p> : null}
      </div>
      <div>
        <label className="label" htmlFor="category-select">카테고리</label>
        <select
          id="category-select"
          className="input"
          value={categoryId}
          onChange={(event) => {
            const nextId = event.target.value;
            setCategoryId(nextId);
            const selected = categories.find((item) => item.id === nextId);
            setCategory(selected?.name ?? "");
          }}
        >
          <option value="">선택 안 함 → {DEFAULT_POST_CATEGORY_NAME}</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {selectedCategoryName ? (
          <p className="mt-1 text-sm text-slate-500">
            선택됨: <span className="font-medium text-slate-700">{selectedCategoryName}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-500">
            선택하지 않으면 「{DEFAULT_POST_CATEGORY_NAME}」로 저장됩니다.
          </p>
        )}
      </div>
      <div>
        <p className="label">공개 상태</p>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-indigo-300 has-[:checked]:bg-indigo-50">
            <input
              type="radio"
              name="post-status"
              value={POST_STATUS_PUBLISHED}
              checked={status === POST_STATUS_PUBLISHED}
              onChange={() => setStatus(POST_STATUS_PUBLISHED)}
            />
            공개
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm has-[:checked]:border-indigo-300 has-[:checked]:bg-indigo-50">
            <input
              type="radio"
              name="post-status"
              value={POST_STATUS_DRAFT}
              checked={status === POST_STATUS_DRAFT}
              onChange={() => setStatus(POST_STATUS_DRAFT)}
            />
            비공개
          </label>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          비공개 글은 홈·목록·태그 네트워크에 표시되지 않습니다.
        </p>
      </div>
      <div>
        <label className="label" htmlFor="tags">태그(쉼표 구분)</label>
        <input
          className="input"
          id="tags"
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
          placeholder="react, supabase"
        />
      </div>
      <div>
        <p className="label" id="thumbnail-label">
          대표 이미지 (썸네일)
        </p>
        <p className="mb-2 text-xs text-slate-400">
          글 목록에 표시됩니다. 비우면 본문의 첫 이미지가 자동으로 사용됩니다.
        </p>
        <div
          className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
          aria-labelledby="thumbnail-label"
        >
          {hasThumbnail ? (
            <img
              src={thumbnailPreviewUrl}
              alt="썸네일 미리보기"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
              없음
            </div>
          )}

          {hasThumbnail ? (
            <button
              type="button"
              className="absolute left-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70"
              onClick={handleClearThumbnail}
              aria-label="썸네일 삭제"
              disabled={isSubmitting}
            >
              <X size={14} strokeWidth={ICON_STROKE} aria-hidden />
            </button>
          ) : null}

          <button
            type="button"
            className="absolute bottom-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70"
            onClick={openImagePicker}
            aria-label={hasThumbnail ? "썸네일 교체" : "썸네일 업로드"}
            disabled={isSubmitting}
          >
            {hasThumbnail ? (
              <RefreshCw size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
            ) : (
              <Upload size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
            )}
          </button>

          <input
            ref={imageInputRef}
            id="image"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handlePickImage}
            tabIndex={-1}
          />
        </div>
      </div>
      <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "저장 중..." : initialPost ? "수정 저장" : "글 등록"}
      </button>
    </form>
  );
}
