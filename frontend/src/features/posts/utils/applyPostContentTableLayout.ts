/**
 * Fit post-content tables to the article width:
 * - drop editor min-width / pixel width that force horizontal overflow
 * - keep column ratios via percentage col widths
 * - allow row height to grow when cell text wraps
 */
export function applyPostContentTableLayout(root: HTMLElement): void {
  root.querySelectorAll("table").forEach((element) => {
    if (!(element instanceof HTMLTableElement)) {
      return;
    }

    fitTableToViewport(element);
  });
}

/**
 * Sanitize-time transform so React's dangerouslySetInnerHTML already has
 * responsive table styles (post-effect DOM patches get wiped on re-render).
 */
export function preparePostContentTablesHtml(html: string): string {
  if (typeof DOMParser === "undefined" || !html.trim()) {
    return html;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<div id="post-root">${html}</div>`, "text/html");
  const root = document.getElementById("post-root");
  if (!root) {
    return html;
  }

  applyPostContentTableLayout(root);
  return root.innerHTML;
}

function fitTableToViewport(table: HTMLTableElement): void {
  table.style.width = "100%";
  table.style.maxWidth = "100%";
  table.style.minWidth = "0";
  table.style.height = "auto";
  table.style.removeProperty("--table-row-height");
  table.removeAttribute("data-height");

  const cols = [...table.querySelectorAll("colgroup > col")].filter(
    (col): col is HTMLElement => col instanceof HTMLElement,
  );
  if (cols.length === 0) {
    return;
  }

  const pixelWidths = cols.map((col) => readColPixelWidth(col));
  const totalWidth = pixelWidths.reduce((sum, width) => sum + width, 0);
  const useEqualColumns = totalWidth <= 0;

  cols.forEach((col, index) => {
    col.style.minWidth = "0";
    if (useEqualColumns) {
      col.style.width = `${(100 / cols.length).toFixed(4)}%`;
      return;
    }
    col.style.width = `${((pixelWidths[index] / totalWidth) * 100).toFixed(4)}%`;
  });
}

function readColPixelWidth(col: HTMLElement): number {
  const width = Number.parseInt(col.style.width, 10);
  if (Number.isFinite(width) && width > 0) {
    return width;
  }

  const minWidth = Number.parseInt(col.style.minWidth, 10);
  if (Number.isFinite(minWidth) && minWidth > 0) {
    return minWidth;
  }

  return 0;
}
