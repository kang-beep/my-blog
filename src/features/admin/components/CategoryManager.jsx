import { useState } from "react";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { CATEGORY_MANAGER_SCROLL_THRESHOLD } from "@/features/posts/constants/postsList";

function CategoryRow({ category, onUpdate, onDelete, isBusy }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [rowError, setRowError] = useState("");

  const startEdit = () => {
    setEditName(category.name);
    setRowError("");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setEditName(category.name);
    setRowError("");
    setIsEditing(false);
  };

  const saveEdit = async () => {
    const nextName = editName.trim();
    if (!nextName) {
      setRowError("이름을 입력해 주세요.");
      return;
    }
    if (nextName === category.name) {
      setIsEditing(false);
      return;
    }

    setRowError("");
    try {
      await onUpdate(category.id, nextName);
      setIsEditing(false);
    } catch (requestError) {
      setRowError(requestError.message || "수정에 실패했습니다.");
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`"${category.name}" 카테고리를 삭제할까요?\n연결된 글의 카테고리는 해제됩니다.`);
    if (!confirmed) {
      return;
    }

    setRowError("");
    try {
      await onDelete(category.id);
    } catch (requestError) {
      setRowError(requestError.message || "삭제에 실패했습니다.");
    }
  };

  if (isEditing) {
    return (
      <li className="flex flex-col gap-2 rounded-lg border border-indigo-200 bg-indigo-50/40 px-3 py-2.5 sm:flex-row sm:items-center">
        <input
          className="input min-w-0 flex-1"
          value={editName}
          onChange={(event) => setEditName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void saveEdit();
            }
            if (event.key === "Escape") {
              cancelEdit();
            }
          }}
          disabled={isBusy}
          autoFocus
          aria-label="카테고리 이름 수정"
        />
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            className="btn btn-primary px-2.5"
            onClick={() => void saveEdit()}
            disabled={isBusy}
            aria-label="저장"
          >
            <Check size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="btn px-2.5"
            onClick={cancelEdit}
            disabled={isBusy}
            aria-label="취소"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        {rowError ? <p className="text-sm text-rose-600 sm:basis-full">{rowError}</p> : null}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <span className="min-w-0 truncate font-medium text-slate-800">{category.name}</span>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          className="btn px-2.5"
          onClick={startEdit}
          disabled={isBusy}
          aria-label={`${category.name} 수정`}
        >
          <Pencil size={15} aria-hidden />
        </button>
        <button
          type="button"
          className="btn px-2.5 text-rose-600 hover:bg-rose-50"
          onClick={() => void handleDelete()}
          disabled={isBusy}
          aria-label={`${category.name} 삭제`}
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </div>
      {rowError ? <p className="basis-full text-sm text-rose-600">{rowError}</p> : null}
    </li>
  );
}

export default function CategoryManager({
  categories = [],
  onAdd,
  onUpdate,
  onDelete,
  isBusy = false,
}) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState("");

  const handleAdd = async (event) => {
    event.preventDefault();
    const nextName = newCategoryName.trim();
    if (!nextName) {
      setError("카테고리 이름을 입력해 주세요.");
      return;
    }

    setError("");
    try {
      await onAdd(nextName);
      setNewCategoryName("");
    } catch (requestError) {
      setError(requestError.message || "카테고리 추가에 실패했습니다.");
    }
  };

  return (
    <section className="card space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">카테고리 관리</h3>
        <p className="mt-1 text-sm text-slate-500">추가·수정·삭제한 내용은 글 작성 폼에 바로 반영됩니다.</p>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleAdd}>
        <input
          className="input min-w-0 flex-1"
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          placeholder="새 카테고리 이름"
          disabled={isBusy}
          aria-label="새 카테고리 이름"
        />
        <button className="btn btn-primary shrink-0" type="submit" disabled={isBusy}>
          추가
        </button>
      </form>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {categories.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
          등록된 카테고리가 없습니다.
        </p>
      ) : (
        <ul
          className={
            categories.length > CATEGORY_MANAGER_SCROLL_THRESHOLD
              ? "scrollbar-hide max-h-[17.5rem] space-y-2 overflow-y-auto pr-1"
              : "space-y-2"
          }
        >
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              onUpdate={onUpdate}
              onDelete={onDelete}
              isBusy={isBusy}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
