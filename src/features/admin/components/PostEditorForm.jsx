// 관리자 글 작성/수정 폼: 태그 파싱과 이미지 업로드를 함께 처리
import { useEffect, useState } from "react";

function parseTags(tagsInput) {
  return tagsInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function PostEditorForm({ initialPost, onSubmit, isSubmitting }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    setTitle(initialPost?.title ?? "");
    setContent(initialPost?.content ?? "");
    setCategory(initialPost?.category ?? "");
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
      tags: parseTags(tagsInput),
      imageFile,
      image_url: initialPost?.image_url ?? null,
    });
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
        <input
          className="input"
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
        />
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
