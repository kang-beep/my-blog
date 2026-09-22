import { useEffect, useState } from "react";
import { fetchNotionPage, searchNotionPages } from "@/features/admin/api/notionImportApi";

export default function NotionImportModal({ open, onClose, onImport }) {
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState([]);
  const [error, setError] = useState("");
  const [warningText, setWarningText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImportingId, setIsImportingId] = useState(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError("");
      setWarningText("");
      try {
        const result = await searchNotionPages("");
        if (!cancelled) {
          setPages(result);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "Notion 목록을 불러오지 못했습니다.");
          setPages([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSearch = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const result = await searchNotionPages(query.trim());
      setPages(result);
    } catch (requestError) {
      setError(requestError.message || "검색에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePick = async (pageId) => {
    setIsImportingId(pageId);
    setError("");
    setWarningText("");
    try {
      const page = await fetchNotionPage(pageId);
      if (page.warnings?.length) {
        setWarningText(page.warnings.join(" · "));
      }
      onImport?.({
        title: page.title ?? "",
        content: page.contentHtml ?? "",
        warnings: page.warnings ?? [],
      });
      onClose?.();
    } catch (requestError) {
      setError(requestError.message || "페이지를 가져오지 못했습니다.");
    } finally {
      setIsImportingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notion-import-title"
    >
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h3 id="notion-import-title" className="text-lg font-semibold">
              Notion에서 가져오기
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              연결한 페이지만 표시됩니다. 가져오면 제목·본문이 에디터에 채워집니다(자동 저장 아님).
            </p>
          </div>
          <button type="button" className="btn" onClick={onClose}>
            닫기
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 border-b border-slate-100 px-4 py-3">
          <input
            className="input flex-1"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목 검색"
          />
          <button className="btn btn-primary" type="submit" disabled={isLoading}>
            검색
          </button>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {error ? <p className="mb-2 text-sm text-rose-600">{error}</p> : null}
          {warningText ? <p className="mb-2 text-sm text-amber-700">{warningText}</p> : null}
          {isLoading ? <p className="text-sm text-slate-500">불러오는 중...</p> : null}
          {!isLoading && pages.length === 0 ? (
            <p className="text-sm text-slate-500">표시할 페이지가 없습니다.</p>
          ) : null}
          <ul className="space-y-2">
            {pages.map((page) => (
              <li key={page.id}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-indigo-300 hover:bg-indigo-50"
                  onClick={() => handlePick(page.id)}
                  disabled={Boolean(isImportingId)}
                >
                  <span className="block font-medium text-slate-800">{page.title}</span>
                  {page.lastEditedTime ? (
                    <span className="mt-0.5 block text-xs text-slate-400">
                      수정 {new Date(page.lastEditedTime).toLocaleString("ko-KR")}
                    </span>
                  ) : null}
                  {isImportingId === page.id ? (
                    <span className="mt-1 block text-xs text-indigo-600">가져오는 중...</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
