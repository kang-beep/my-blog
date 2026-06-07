// 관리자 글 작성/수정 폼: 태그 파싱과 이미지 업로드를 함께 처리
import { useEffect, useState } from "react";
import RichTextEditor, { isEditorContentEmpty } from "@/features/admin/components/RichTextEditor/RichTextEditor";

function parseTags(tagsInput) {
  return tagsInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function PostEditorForm({
  initialPost,
  uploadPostId,
  onSubmit,
  isSubmitting,
  categories = [],
  onAddCategory,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [contentError, setContentError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    setTitle(initialPost?.title ?? "");
    setContent(initialPost?.content ?? "");
    setCategory(initialPost?.category ?? "");
    setTagsInput((initialPost?.tags ?? []).join(", "));
    setImageFile(null);

    const initialCategoryId = initialPost?.category_id ?? "";
    if (initialCategoryId) {
      setCategoryId(initialCategoryId);
      return;
    }

    const matched = categories.find((item) => item.name === initialPost?.category);
    setCategoryId(matched?.id ?? "");
  }, [initialPost, categories]);

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
      content: content.trim(),
      category: category.trim(),
      category_id: categoryId || null,
      tags: parseTags(tagsInput),
      imageFile,
      image_url: initialPost?.image_url ?? null,
    });
  };

  const handleQuickAddCategory = async (event) => {
    event?.preventDefault?.();
    const nextName = newCategoryName.trim();
    if (!nextName || !onAddCategory) {
      return;
    }

    setCategoryError("");
    try {
      const added = await onAddCategory(nextName);
      setCategory(nextName);
      if (added?.id) {
        setCategoryId(added.id);
      }
      setNewCategoryName("");
    } catch (requestError) {
      setCategoryError(requestError.message || "카테고리 추가에 실패했습니다.");
    }
  };

  const selectedCategoryName =
    categories.find((item) => item.id === categoryId)?.name ?? category;

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
            if (selected?.name) {
              setCategory(selected.name);
            }
          }}
          required
        >
          <option value="">카테고리를 선택하세요</option>
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
            위 목록에서 카테고리를 선택하거나, 아래에서 새로 추가하세요.
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <input
            className="input"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleQuickAddCategory(event);
              }
            }}
            placeholder="새 카테고리 이름"
            aria-label="새 카테고리 이름"
          />
          <button className="btn shrink-0" type="button" onClick={handleQuickAddCategory}>
            추가
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          추가 버튼을 누르면 DB에 저장되고 목록에 바로 선택됩니다. (페이지 새로고침 없음)
        </p>
        {categoryError ? <p className="mt-1 text-sm text-rose-600">{categoryError}</p> : null}
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
          글 목록·상단에 보이는 대표 이미지 1장입니다. 본문 이미지는 에디터에서 별도로 삽입합니다.
        </p>
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
