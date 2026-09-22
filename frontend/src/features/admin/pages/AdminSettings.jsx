import { useEffect, useMemo, useState } from "react";
import {
  deleteAdminSecret,
  listAdminSecrets,
  upsertAdminSecret,
} from "@/features/admin/api/adminSecretsApi";
import { ADMIN_SECRET_FIELDS } from "@/shared/constants/adminSecrets";

function formatUpdatedAt(value) {
  if (!value) {
    return null;
  }
  try {
    return new Date(value).toLocaleString("ko-KR");
  } catch {
    return value;
  }
}

function SecretField({ field, meta, onSaved, onDeleted }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!draft.trim()) {
      setError("값을 입력해 주세요.");
      return;
    }
    setIsSaving(true);
    try {
      await upsertAdminSecret(field.key, draft.trim());
      setDraft("");
      setSuccess("저장되었습니다.");
      await onSaved?.();
    } catch (requestError) {
      setError(requestError.message || "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!meta?.is_set) {
      return;
    }
    const confirmed = window.confirm(`「${field.label}」을(를) 삭제할까요?`);
    if (!confirmed) {
      return;
    }
    setError("");
    setSuccess("");
    setIsDeleting(true);
    try {
      await deleteAdminSecret(field.key);
      setDraft("");
      setSuccess("삭제되었습니다.");
      await onDeleted?.();
    } catch (requestError) {
      setError(requestError.message || "삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="card space-y-3">
      <div>
        <h3 className="text-lg font-semibold">{field.label}</h3>
        <p className="mt-1 text-sm text-slate-500">{field.help}</p>
      </div>

      {meta?.is_set ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          설정됨: <span className="font-mono">{meta.masked_value}</span>
          {meta.updated_at ? (
            <span className="ml-2 text-slate-400">
              · {formatUpdatedAt(meta.updated_at)}
            </span>
          ) : null}
        </p>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          아직 설정되지 않았습니다.
        </p>
      )}

      <div>
        <label className="label" htmlFor={`secret-${field.key}`}>
          {meta?.is_set ? "새 값으로 덮어쓰기" : "값 입력"}
        </label>
        <input
          id={`secret-${field.key}`}
          className="input font-mono"
          type="password"
          autoComplete="off"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={field.placeholder}
        />
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" type="submit" disabled={isSaving || isDeleting}>
          {isSaving ? "저장 중..." : "저장"}
        </button>
        {meta?.is_set ? (
          <button
            className="btn"
            type="button"
            onClick={handleDelete}
            disabled={isSaving || isDeleting}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </button>
        ) : null}
      </div>
    </form>
  );
}

export default function AdminSettings() {
  const [rows, setRows] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const metaByKey = useMemo(() => {
    const map = new Map();
    for (const row of rows) {
      map.set(row.key, row);
    }
    return map;
  }, [rows]);

  const reload = async () => {
    setLoadError("");
    setIsLoading(true);
    try {
      const data = await listAdminSecrets();
      setRows(data);
    } catch (requestError) {
      setLoadError(requestError.message || "시크릿 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">설정</h2>
        <p className="mt-1 text-sm text-slate-500">
          관리자 전용 시크릿입니다. 저장된 값은 마스킹만 표시되며, 새 값으로 덮어쓰거나 삭제할 수 있습니다.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{loadError}</p>
      ) : null}
      {isLoading ? <p className="text-sm text-slate-500">불러오는 중...</p> : null}

      <div className="space-y-4">
        {ADMIN_SECRET_FIELDS.map((field) => (
          <SecretField
            key={field.key}
            field={field}
            meta={metaByKey.get(field.key) ?? null}
            onSaved={reload}
            onDeleted={reload}
          />
        ))}
      </div>
    </section>
  );
}
