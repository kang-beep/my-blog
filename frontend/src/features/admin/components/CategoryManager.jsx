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
      setRowError("Enter a name.");
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
      setRowError(requestError.message || "Update failed.");
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete category "${category.name}"?\nLinked posts will have their category cleared.`);
    if (!confirmed) {
      return;
    }

    setRowError("");
    try {
      await onDelete(category.id);
    } catch (requestError) {
      setRowError(requestError.message || "Delete failed.");
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
          aria-label="Edit category name"
        />
        <div className="flex shrink-0 gap-1.5">
          <button
            type="button"
            className="btn btn-primary px-2.5"
            onClick={() => void saveEdit()}
            disabled={isBusy}
            aria-label="Save"
          >
            <Check size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="btn px-2.5"
            onClick={cancelEdit}
            disabled={isBusy}
            aria-label="Cancel"
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
          aria-label={`Edit ${category.name}`}
        >
          <Pencil size={15} aria-hidden />
        </button>
        <button
          type="button"
          className="btn px-2.5 text-rose-600 hover:bg-rose-50"
          onClick={() => void handleDelete()}
          disabled={isBusy}
          aria-label={`Delete ${category.name}`}
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
      setError("Enter a category name.");
      return;
    }

    setError("");
    try {
      await onAdd(nextName);
      setNewCategoryName("");
    } catch (requestError) {
      setError(requestError.message || "Could not add category.");
    }
  };

  return (
    <section className="card space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Manage categories</h3>
        <p className="mt-1 text-sm text-slate-500">Changes apply immediately in the post editor.</p>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleAdd}>
        <input
          className="input min-w-0 flex-1"
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          placeholder="New category name"
          disabled={isBusy}
          aria-label="New category name"
        />
        <button className="btn btn-primary shrink-0" type="submit" disabled={isBusy}>
          Add
        </button>
      </form>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {categories.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
          No categories yet.
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
