// 관리자 글 작성/수정 폼: 태그 파싱과 이미지 업로드를 함께 처리
import { useEffect, useState } from "react";
import RichTextEditor, { isEditorContentEmpty } from "@/features/admin/components/RichTextEditor/RichTextEditor";
import {
  POST_STATUS_DRAFT,
  POST_STATUS_PUBLISHED,
} from "@/shared/constants/postStatus";
import { DEFAULT_POST_CATEGORY_NAME } from "@/shared/constants/categories";

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
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState(POST_STATUS_PUBLISHED);
  const [imageFile, setImageFile] = useState(null);
  const [contentError, setContentError] = useState("");

  useEffect(() => {
    setTitle(initialPost?.title ?? "");
    setExcerpt(initialPost?.excerpt ?? "");
    setContent(initialPost?.content ?? "");
    setCategory(initialPost?.category ?? "");
    setTagsInput((initialPost?.tags ?? []).join(", "));
    setStatus(initialPost?.status === POST_STATUS_DRAFT ? POST_STATUS_DRAFT : POST_STATUS_PUBLISHED);
    setImageFile(null);

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
      image_url: initialPost?.image_url ?? null,
    });
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

    setThumbnailPreviewUrl(initialPost?.image_url ?? null);
    return undefined;
  }, [imageFile, initialPost?.image_url]);

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h2>{initialPost ? "글 수정" : "새 글 작성"}</h2>
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
        <label className="label" htmlFor="content">본문</label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          postId={uploadPostId}
          disabled={isSubmitting}
        />
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
        <label className="label" htmlFor="image">대표 이미지 (썸네일)</label>
        <p className="mb-2 text-xs text-slate-400">
          글 목록에 표시됩니다. 비우면 본문의 첫 이미지가 자동으로 사용됩니다.
        </p>
        {thumbnailPreviewUrl ? (
          <img
            src={thumbnailPreviewUrl}
            alt="썸네일 미리보기"
            className="mb-3 h-24 w-24 rounded-lg border border-slate-200 object-cover"
          />
        ) : null}
        <input
          className="input"
          id="image"
          type="file"
          accept="image/*"
          onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "저장 중..." : initialPost ? "수정 저장" : "글 등록"}
      </button>
    </form>
  );
}
