import { useEffect, useMemo, useState } from "react";
import {
  deleteAdminSecret,
  getGeminiOutputLanguage,
  listAdminSecrets,
  saveGeminiOutputLanguage,
  upsertAdminSecret,
} from "@/features/admin/api/adminSecretsApi";
import { regenerateTrendAiDigestsNow } from "@/features/admin/api/regenerateTrendAiDigestsApi";
import {
  ADMIN_SECRET_FIELDS,
  GEMINI_API_KEY_FIELD,
  GEMINI_OUTPUT_LANGUAGE_OPTIONS,
} from "@/shared/constants/adminSecrets";

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
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{field.label}</h3>
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

function LanguageReplaceModal({ language, isBusy, onYes, onNo, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        disabled={isBusy}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-replace-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-lg"
      >
        <h3 id="language-replace-title" className="text-lg font-semibold text-slate-900">
          Replace AI summaries now?
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          AI로 생성한 응답 정보를 지금 교체할까요? Yes면 현재 트렌드 목록으로 Gemini에 다시
          물어보고 <span className="font-mono">{language}</span> 로 덮어씁니다. No면 언어만
          저장하고, 다음 자동 작업 때 바뀝니다.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="btn" type="button" disabled={isBusy} onClick={onNo}>
            No
          </button>
          <button className="btn btn-primary" type="button" disabled={isBusy} onClick={onYes}>
            {isBusy ? "Working..." : "Yes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GeminiSettingsCard({ apiKeyMeta, onReload }) {
  const [language, setLanguage] = useState("en");
  const [savedLanguage, setSavedLanguage] = useState("en");
  const [languageError, setLanguageError] = useState("");
  const [languageSuccess, setLanguageSuccess] = useState("");
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(true);
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      setIsLoadingLanguage(true);
      setLanguageError("");
      try {
        const value = await getGeminiOutputLanguage();
        setLanguage(value);
        setSavedLanguage(value);
      } catch (requestError) {
        setLanguageError(requestError.message || "Could not load language setting.");
      } finally {
        setIsLoadingLanguage(false);
      }
    };

    void loadLanguage();
  }, []);

  const persistLanguageOnly = async () => {
    const saved = await saveGeminiOutputLanguage(language);
    setLanguage(saved);
    setSavedLanguage(saved);
    setLanguageSuccess("Language saved. AI text will update on the next automatic run.");
  };

  const persistLanguageAndRegenerate = async () => {
    const data = await regenerateTrendAiDigestsNow(language);
    const saved = data?.language || language;
    setLanguage(saved);
    setSavedLanguage(saved);
    const summary = Array.isArray(data?.results)
      ? data.results.map((item) => `${item.period}=${item.status}`).join(", ")
      : "done";
    setLanguageSuccess(`Language saved and AI text replaced (${summary}).`);
  };

  const handleSaveLanguageClick = () => {
    setLanguageError("");
    setLanguageSuccess("");
    if (language === savedLanguage) {
      setLanguageSuccess("Language is already saved.");
      return;
    }
    setIsModalOpen(true);
  };

  const handleModalNo = async () => {
    setIsSavingLanguage(true);
    setLanguageError("");
    try {
      await persistLanguageOnly();
      setIsModalOpen(false);
    } catch (requestError) {
      setLanguageError(requestError.message || "Could not save language.");
    } finally {
      setIsSavingLanguage(false);
    }
  };

  const handleModalYes = async () => {
    setIsSavingLanguage(true);
    setLanguageError("");
    try {
      await persistLanguageAndRegenerate();
      setIsModalOpen(false);
      await onReload?.();
    } catch (requestError) {
      setLanguageError(requestError.message || "Could not replace AI text now.");
    } finally {
      setIsSavingLanguage(false);
    }
  };

  return (
    <div className="card h-fit w-full max-w-3xl space-y-4 overflow-hidden">
      <div>
        <h3 className="text-lg font-semibold">Gemini</h3>
        <p className="mt-1 text-sm text-slate-500">
          API key and output language for trend AI digests (GitHub Actions).
        </p>
      </div>

      <SecretField
        field={GEMINI_API_KEY_FIELD}
        meta={apiKeyMeta}
        onSaved={onReload}
        onDeleted={onReload}
      />

      <div className="space-y-3 border-t border-slate-100 pt-4">
        <div>
          <h4 className="text-base font-semibold text-slate-900">Output language</h4>
          <p className="mt-1 text-sm text-slate-500">
            Language for AI digest headline, summary, and keywords. Default is en.
          </p>
        </div>

        {isLoadingLanguage ? (
          <p className="text-sm text-slate-500">Loading language...</p>
        ) : (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Gemini output language">
            {GEMINI_OUTPUT_LANGUAGE_OPTIONS.map((option) => {
              const isActive = language === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  className={
                    isActive
                      ? "btn border-slate-900 bg-slate-900 text-white hover:border-slate-800 hover:bg-slate-800 hover:text-white"
                      : "btn"
                  }
                  onClick={() => {
                    setLanguage(option.value);
                    setLanguageError("");
                    setLanguageSuccess("");
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}

        {languageError ? <p className="text-sm text-rose-600">{languageError}</p> : null}
        {languageSuccess ? <p className="text-sm text-emerald-700">{languageSuccess}</p> : null}

        <button
          className="btn btn-primary"
          type="button"
          disabled={isLoadingLanguage || isSavingLanguage}
          onClick={handleSaveLanguageClick}
        >
          {isSavingLanguage ? "Working..." : "Save language"}
        </button>
      </div>

      {isModalOpen ? (
        <LanguageReplaceModal
          language={language}
          isBusy={isSavingLanguage}
          onYes={() => {
            void handleModalYes();
          }}
          onNo={() => {
            void handleModalNo();
          }}
          onClose={() => {
            if (!isSavingLanguage) {
              setIsModalOpen(false);
            }
          }}
        />
      ) : null}
    </div>
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

      <div className="flex max-w-3xl flex-col gap-4">
        {ADMIN_SECRET_FIELDS.map((field) => (
          <div key={field.key} className="card h-fit overflow-hidden">
            <SecretField
              field={field}
              meta={metaByKey.get(field.key) ?? null}
              onSaved={reload}
              onDeleted={reload}
            />
          </div>
        ))}

        <GeminiSettingsCard
          apiKeyMeta={metaByKey.get(GEMINI_API_KEY_FIELD.key) ?? null}
          onReload={reload}
        />
      </div>
    </section>
  );
}
