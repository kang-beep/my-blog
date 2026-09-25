import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { fetchNotionPage, searchNotionPages } from "@/features/admin/api/notionImportApi";
import { ICON_SIZE, ICON_STROKE } from "@/shared/constants/navigation";

function buildPageTree(pages) {
  const byId = new Map();
  for (const page of pages) {
    byId.set(page.id, {
      ...page,
      children: [],
    });
  }

  const roots = [];
  for (const node of byId.values()) {
    const parentKey = node.parentId;
    if (parentKey && byId.has(parentKey)) {
      byId.get(parentKey).children.push(node);
      continue;
    }
    roots.push(node);
  }

  const sortRecursive = (nodes) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    for (const node of nodes) {
      sortRecursive(node.children);
    }
  };
  sortRecursive(roots);
  return roots;
}

function filterTree(nodes, predicate) {
  const result = [];
  for (const node of nodes) {
    const filteredChildren = filterTree(node.children, predicate);
    if (predicate(node) || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren,
      });
    }
  }
  return result;
}

function PageTreeNode({
  node,
  depth,
  expandedIds,
  onToggle,
  onPick,
  importingId,
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isImporting = importingId === node.id;

  return (
    <li>
      <div
        className="flex items-center gap-1 rounded-lg border border-transparent px-1 py-1 hover:border-slate-200 hover:bg-slate-50"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 hover:bg-slate-200"
            onClick={() => onToggle(node.id)}
            aria-label={isExpanded ? "접기" : "펼치기"}
          >
            {isExpanded ? (
              <ChevronDown size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
            ) : (
              <ChevronRight size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
            )}
          </button>
        ) : (
          <span className="inline-block h-7 w-7 shrink-0" aria-hidden />
        )}
        <button
          type="button"
          className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-left hover:bg-indigo-50"
          onClick={() => onPick(node.id)}
          disabled={Boolean(importingId)}
        >
          <span className="block truncate font-medium text-slate-800">{node.title}</span>
          {node.lastEditedTime ? (
            <span className="mt-0.5 block text-xs text-slate-400">
              수정 {new Date(node.lastEditedTime).toLocaleString("ko-KR")}
            </span>
          ) : null}
          {isImporting ? (
            <span className="mt-1 block text-xs text-indigo-600">가져오는 중...</span>
          ) : null}
        </button>
      </div>
      {hasChildren && isExpanded ? (
        <ul>
          {node.children.map((child) => (
            <PageTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onPick={onPick}
              importingId={importingId}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function NotionImportModal({ open, onClose, onImport }) {
  const [filterText, setFilterText] = useState("");
  const [rootFilterId, setRootFilterId] = useState("");
  const [pages, setPages] = useState([]);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
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
      setFilterText("");
      setRootFilterId("");
      try {
        const result = await searchNotionPages("");
        if (!cancelled) {
          setPages(result);
          setExpandedIds(new Set());
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

  const fullTree = useMemo(() => buildPageTree(pages), [pages]);

  const rootOptions = useMemo(
    () => fullTree.map((node) => ({ id: node.id, title: node.title })),
    [fullTree],
  );

  const scopedTree = useMemo(() => {
    if (!rootFilterId) {
      return fullTree;
    }
    const selected = fullTree.find((node) => node.id === rootFilterId);
    return selected ? [selected] : fullTree;
  }, [fullTree, rootFilterId]);

  const visibleTree = useMemo(() => {
    const needle = filterText.trim().toLowerCase();
    if (!needle) {
      return scopedTree;
    }
    return filterTree(scopedTree, (node) =>
      String(node.title ?? "").toLowerCase().includes(needle),
    );
  }, [scopedTree, filterText]);

  useEffect(() => {
    if (!filterText.trim()) {
      return;
    }
    const next = new Set();
    const expandAll = (nodes) => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          next.add(node.id);
          expandAll(node.children);
        }
      }
    };
    expandAll(visibleTree);
    setExpandedIds(next);
  }, [filterText, visibleTree]);

  const visibleCount = useMemo(() => {
    let count = 0;
    const walk = (nodes) => {
      for (const node of nodes) {
        count += 1;
        walk(node.children);
      }
    };
    walk(visibleTree);
    return count;
  }, [visibleTree]);

  const handleToggle = (pageId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleExpandAllVisible = () => {
    const next = new Set();
    const walk = (nodes) => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          next.add(node.id);
          walk(node.children);
        }
      }
    };
    walk(visibleTree);
    setExpandedIds(next);
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
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

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notion-import-title"
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h3 id="notion-import-title" className="text-lg font-semibold">
              Notion에서 가져오기
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              접근 가능한 페이지를 트리로 표시합니다. 펼침은 추가 API 없이 로컬에서만 동작하고,
              본문은 페이지를 선택할 때만 가져옵니다.
            </p>
          </div>
          <button type="button" className="btn" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="space-y-2 border-b border-slate-100 px-4 py-3">
          <label className="block text-xs font-medium text-slate-600" htmlFor="notion-root-filter">
            루트 필터
          </label>
          <select
            id="notion-root-filter"
            className="input"
            value={rootFilterId}
            onChange={(event) => setRootFilterId(event.target.value)}
          >
            <option value="">전체 트리</option>
            {rootOptions.map((root) => (
              <option key={root.id} value={root.id}>
                {root.title}
              </option>
            ))}
          </select>

          <label className="block text-xs font-medium text-slate-600" htmlFor="notion-title-filter">
            제목 필터
          </label>
          <input
            id="notion-title-filter"
            className="input"
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
            placeholder="제목으로 걸러내기 (로컬 필터)"
          />

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={handleExpandAllVisible}>
              보이는 항목 모두 펼치기
            </button>
            <button type="button" className="btn" onClick={handleCollapseAll}>
              모두 접기
            </button>
            <span className="self-center text-xs text-slate-400">
              {isLoading ? "불러오는 중..." : `${visibleCount}개 표시 / 전체 ${pages.length}개`}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {error ? <p className="mb-2 px-1 text-sm text-rose-600">{error}</p> : null}
          {warningText ? <p className="mb-2 px-1 text-sm text-amber-700">{warningText}</p> : null}
          {!isLoading && visibleTree.length === 0 ? (
            <p className="px-1 text-sm text-slate-500">표시할 페이지가 없습니다.</p>
          ) : null}
          <ul>
            {visibleTree.map((node) => (
              <PageTreeNode
                key={node.id}
                node={node}
                depth={0}
                expandedIds={expandedIds}
                onToggle={handleToggle}
                onPick={handlePick}
                importingId={isImportingId}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
