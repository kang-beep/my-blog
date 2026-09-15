/**
 * Align post-content tables with editor layout:
 * - restore width from <colgroup> when missing (legacy height-only style)
 * - apply data-height → height + --table-row-height
 */
export function applyPostContentTableLayout(root: HTMLElement): void {
  root.querySelectorAll("table").forEach((element) => {
    if (!(element instanceof HTMLTableElement)) {
      return;
    }

    applyTableWidthFromColGroup(element);
    applyTableHeightFromData(element);
  });
}

function applyTableWidthFromColGroup(table: HTMLTableElement): void {
  const cols = table.querySelectorAll("colgroup > col");
  if (cols.length === 0) {
    return;
  }

  let totalWidth = 0;
  let allFixed = true;

  cols.forEach((col) => {
    if (!(col instanceof HTMLElement)) {
      allFixed = false;
      return;
    }
    const width = Number.parseInt(col.style.width, 10);
    if (!Number.isFinite(width) || width <= 0) {
      allFixed = false;
      return;
    }
    totalWidth += width;
  });

  if (!allFixed || totalWidth <= 0) {
    return;
  }

  if (!table.style.width) {
    table.style.width = `${totalWidth}px`;
  }
}

function applyTableHeightFromData(table: HTMLTableElement): void {
  const dataHeight = table.getAttribute("data-height");
  const heightPx = dataHeight
    ? Number.parseInt(dataHeight, 10)
    : Number.parseInt(table.style.height, 10);

  const rowCount = table.rows.length;
  if (!Number.isFinite(heightPx) || heightPx <= 0 || rowCount <= 0) {
    return;
  }

  table.style.height = `${heightPx}px`;
  table.style.setProperty("--table-row-height", `${Math.floor(heightPx / rowCount)}px`);

  if (!dataHeight) {
    table.setAttribute("data-height", String(heightPx));
  }
}
