// 관리자 글 작성/수정 폼: 태그 파싱과 이미지 업로드를 함께 처리
import { useEffect, useState } from "react";

function parseTags(tagsInput) {
  return tagsInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function PostEditorForm({
  initialPost,
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

  useEffect(() => {
    setTitle(initialPost?.title ?? "");
    setContent(initialPost?.content ?? "");
    setCategory(initialPost?.category ?? "");
    setCategoryId(initialPost?.category_id ?? "");
    setTagsInput((initialPost?.tags ?? []).join(", "));
    setImageFile(null);
  }, [initialPost]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit?.({
      id: initialPost?.id,
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      category_id: categoryId || null,
      tags: parseTags(tagsInput),
      imageFile,
      image_url: initialPost?.image_url ?? null,
    });
  };

  const handleQuickAddCategory = async () => {
    const nextName = newCategoryName.trim();
    if (!nextName || !onAddCategory) {
      return;
    }
    const added = await onAddCategory(nextName);
    setCategory(nextName);
    if (added?.id) {
      setCategoryId(added.id);
    }
    setNewCategoryName("");
  };

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
        <textarea
          className="input min-h-52"
          id="content"
          rows={10}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="category">카테고리</label>
        <select
          id="category-select"
          className="input mb-2"
          value={categoryId}
          onChange={(event) => {
            const nextId = event.target.value;
            setCategoryId(nextId);
            const selected = categories.find((item) => item.id === nextId);
            if (selected?.name) {
              setCategory(selected.name);
            }
          }}
        >
          <option value="">카테고리 선택</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
        />
        <div className="mt-2 flex gap-2">
          <input
            className="input"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="새 카테고리 빠른 추가"
          />
          <button className="btn" type="button" onClick={handleQuickAddCategory}>
            추가
          </button>
        </div>
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
        <label className="label" htmlFor="image">이미지</label>
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
