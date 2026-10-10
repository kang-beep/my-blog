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
    return new Date(value).toLocaleString("en-US");
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
      setError("Enter a value.");
      return;
    }
    setIsSaving(true);
    try {
      await upsertAdminSecret(field.key, draft.trim());
      setDraft("");
      setSuccess("Saved.");
      await onSaved?.();
    } catch (requestError) {
      setError(requestError.message || "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!meta?.is_set) {
      return;
    }
    const confirmed = window.confirm(`Delete "${field.label}"?`);
    if (!confirmed) {
      return;
    }
    setError("");
    setSuccess("");
    setIsDeleting(true);
    try {
      await deleteAdminSecret(field.key);
      setDraft("");
      setSuccess("Deleted.");
      await onDeleted?.();
    } catch (requestError) {
      setError(requestError.message || "Delete failed.");
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
          Set: <span className="font-mono">{meta.masked_value}</span>
          {meta.updated_at ? (
            <span className="ml-2 text-slate-400">
              · {formatUpdatedAt(meta.updated_at)}
            </span>
          ) : null}
        </p>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Not configured yet.
        </p>
      )}

      <div>
        <label className="label" htmlFor={`secret-${field.key}`}>
          {meta?.is_set ? "Replace with new value" : "Enter value"}
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
          {isSaving ? "Saving..." : "Save"}
        </button>
        {meta?.is_set ? (
          <button
            className="btn"
            type="button"
            onClick={handleDelete}
            disabled={isSaving || isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
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
      setLoadError(requestError.message || "Could not load secrets.");
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
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Admin-only secrets. Stored values are shown masked; you can overwrite or delete them.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{loadError}</p>
      ) : null}
      {isLoading ? <p className="text-sm text-slate-500">Loading...</p> : null}

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
