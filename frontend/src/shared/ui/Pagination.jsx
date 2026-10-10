import { ChevronLeft, ChevronRight } from "lucide-react";

const MAX_VISIBLE_PAGES = 7;

function buildPageNumbers(currentPage, totalPages) {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

function PageButton({ page, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      aria-current={isActive ? "page" : undefined}
      className={isActive ? "btn btn-primary min-w-9 px-2" : "btn min-w-9 px-2"}
    >
      {page}
    </button>
  );
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        type="button"
        className="btn px-2.5"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} aria-hidden />
      </button>

      {pageNumbers.map((page, index) => {
        const previousPage = pageNumbers[index - 1];
        const showEllipsis = previousPage && page - previousPage > 1;

        return (
          <span key={page} className="inline-flex items-center gap-1.5">
            {showEllipsis ? <span className="px-1 text-sm text-slate-400">...</span> : null}
            <PageButton page={page} isActive={page === currentPage} onClick={onPageChange} />
          </span>
        );
      })}

      <button
        type="button"
        className="btn px-2.5"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} aria-hidden />
      </button>
    </nav>
  );
}
