import type { EditorView } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { TableMap } from "@tiptap/pm/tables";
import {
  TABLE_CELL_MIN_WIDTH_PX,
  TABLE_MIN_HEIGHT_PX,
  TABLE_MIN_WIDTH_PX,
  TABLE_ROW_MIN_HEIGHT_PX,
} from "@/features/admin/components/RichTextEditor/tableConstants";

export function findTableInfo(
  view: EditorView,
  tableEl: HTMLTableElement,
): { pos: number; node: ProseMirrorNode } | null {
  const cellEl = tableEl.querySelector("td, th");
  if (!cellEl) {
    return null;
  }

  try {
    const pos = view.posAtDOM(cellEl, 0);
    const $pos = view.state.doc.resolve(pos);
    for (let depth = $pos.depth; depth > 0; depth -= 1) {
      const node = $pos.node(depth);
      if (node.type.name === "table") {
        return { pos: $pos.before(depth), node };
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function readColumnWidths(tableEl: HTMLTableElement, columnCount: number): number[] {
  const cols = tableEl.querySelectorAll("col");
  if (cols.length >= columnCount) {
    return Array.from(cols)
      .slice(0, columnCount)
      .map((col) => Math.max(TABLE_CELL_MIN_WIDTH_PX, Math.round(col.getBoundingClientRect().width)));
  }

  const firstRow = tableEl.rows.item(0);
  if (!firstRow) {
    return Array.from({ length: columnCount }, () => TABLE_CELL_MIN_WIDTH_PX * 2);
  }

  const widths: number[] = [];
  for (let index = 0; index < columnCount; index += 1) {
    const cell = firstRow.cells.item(index);
    const width = cell
      ? Math.max(TABLE_CELL_MIN_WIDTH_PX, Math.round(cell.getBoundingClientRect().width))
      : TABLE_CELL_MIN_WIDTH_PX * 2;
    widths.push(width);
  }
  return widths;
}

export function paintTableColumnWidths(tableEl: HTMLTableElement, colWidths: number[]): void {
  let colgroup = tableEl.querySelector("colgroup");
  if (!colgroup) {
    colgroup = document.createElement("colgroup");
    tableEl.insertBefore(colgroup, tableEl.firstChild);
  }

  while (colgroup.childElementCount < colWidths.length) {
    colgroup.appendChild(document.createElement("col"));
  }
  while (colgroup.childElementCount > colWidths.length) {
    colgroup.lastElementChild?.remove();
  }

  let totalWidth = 0;
  colWidths.forEach((width, index) => {
    const col = colgroup.children.item(index);
    if (!(col instanceof HTMLElement)) {
      return;
    }
    col.style.width = `${width}px`;
    col.style.minWidth = "";
    totalWidth += width;
  });

  tableEl.style.width = `${Math.max(TABLE_MIN_WIDTH_PX, totalWidth)}px`;
  tableEl.style.minWidth = "";
}

export function paintTableHeight(tableEl: HTMLTableElement, heightPx: number, rowCount: number): void {
  const safeHeight = Math.max(TABLE_MIN_HEIGHT_PX, heightPx);
  const safeRows = Math.max(1, rowCount);
  const rowHeight = Math.max(TABLE_ROW_MIN_HEIGHT_PX, Math.floor(safeHeight / safeRows));

  // Only mutate <table> (outside ProseMirror contentDOM). Never touch td/th —
  // that triggers an editor update loop and freezes the browser.
  tableEl.style.height = `${safeHeight}px`;
  tableEl.style.setProperty("--table-row-height", `${rowHeight}px`);
}

export function scaleColumnWidths(startColWidths: number[], scale: number): number[] {
  return startColWidths.map((width) =>
    Math.max(TABLE_CELL_MIN_WIDTH_PX, Math.round(width * scale)),
  );
}

export function commitColumnWidths(
  view: EditorView,
  tablePos: number,
  tableNode: ProseMirrorNode,
  colWidths: number[],
): void {
  const map = TableMap.get(tableNode);
  const tableStart = tablePos + 1;
  const tr = view.state.tr;

  for (let col = 0; col < map.width; col += 1) {
    const width = colWidths[col] ?? TABLE_CELL_MIN_WIDTH_PX;
    for (let row = 0; row < map.height; row += 1) {
      const mapIndex = row * map.width + col;
      if (row > 0 && map.map[mapIndex] === map.map[mapIndex - map.width]) {
        continue;
      }

      const cellOffset = map.map[mapIndex];
      const cell = tableNode.nodeAt(cellOffset);
      if (!cell) {
        continue;
      }

      const attrs = cell.attrs;
      const colspan = Number(attrs.colspan ?? 1);
      const index = colspan === 1 ? 0 : col - map.colCount(cellOffset);
      const nextColwidth = Array.isArray(attrs.colwidth)
        ? (attrs.colwidth as number[]).slice()
        : Array.from({ length: colspan }, () => 0);
      nextColwidth[index] = width;
      tr.setNodeMarkup(tableStart + cellOffset, undefined, {
        ...attrs,
        colwidth: nextColwidth,
      });
    }
  }

  if (tr.docChanged) {
    view.dispatch(tr);
  }
}

export function commitTableSize(
  view: EditorView,
  tablePos: number,
  tableNode: ProseMirrorNode,
  colWidths: number[],
  heightPx: number,
): void {
  const map = TableMap.get(tableNode);
  const tableStart = tablePos + 1;
  let tr = view.state.tr;
  const nextHeight = Math.max(TABLE_MIN_HEIGHT_PX, Math.round(heightPx));

  for (let col = 0; col < map.width; col += 1) {
    const width = colWidths[col] ?? TABLE_CELL_MIN_WIDTH_PX;
    for (let row = 0; row < map.height; row += 1) {
      const mapIndex = row * map.width + col;
      if (row > 0 && map.map[mapIndex] === map.map[mapIndex - map.width]) {
        continue;
      }

      const cellOffset = map.map[mapIndex];
      const cell = tableNode.nodeAt(cellOffset);
      if (!cell) {
        continue;
      }

      const attrs = cell.attrs;
      const colspan = Number(attrs.colspan ?? 1);
      const index = colspan === 1 ? 0 : col - map.colCount(cellOffset);
      const nextColwidth = Array.isArray(attrs.colwidth)
        ? (attrs.colwidth as number[]).slice()
        : Array.from({ length: colspan }, () => 0);
      nextColwidth[index] = width;
      tr = tr.setNodeMarkup(tableStart + cellOffset, undefined, {
        ...attrs,
        colwidth: nextColwidth,
      });
    }
  }

  const latestTable = tr.doc.nodeAt(tablePos);
  if (latestTable?.type.name === "table" && latestTable.attrs.height !== nextHeight) {
    tr = tr.setNodeMarkup(tablePos, undefined, {
      ...latestTable.attrs,
      height: nextHeight,
    });
  }

  if (tr.docChanged) {
    view.dispatch(tr);
  }
}
