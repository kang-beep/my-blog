import { mergeAttributes } from "@tiptap/core";
import { Table, TableView } from "@tiptap/extension-table";
import type { DOMOutputSpec, Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { NodeView, ViewMutationRecord } from "@tiptap/pm/view";
import {
  TABLE_CELL_MIN_WIDTH_PX,
  TABLE_COLUMN_HANDLE_WIDTH_PX,
  TABLE_ROW_MIN_HEIGHT_PX,
  TABLE_WRAPPER_CLASS,
} from "@/features/admin/components/RichTextEditor/tableConstants";

function parseHeightAttribute(element: HTMLElement): number | null {
  const dataHeight = element.getAttribute("data-height");
  if (dataHeight) {
    const parsed = Number.parseInt(dataHeight, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const styleHeight = element.style.height;
  if (!styleHeight) {
    return null;
  }

  const parsed = Number.parseInt(styleHeight, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildColGroup(node: ProseMirrorNode, cellMinWidth: number) {
  const cols: DOMOutputSpec[] = [];
  let totalWidth = 0;
  let fixedWidth = true;
  const row = node.firstChild;

  if (!row) {
    return { cols, totalWidth, fixedWidth: false };
  }

  for (let index = 0; index < row.childCount; index += 1) {
    const { colspan, colwidth } = row.child(index).attrs as {
      colspan: number;
      colwidth: number[] | null;
    };

    for (let span = 0; span < colspan; span += 1) {
      const hasWidth = colwidth?.[span];
      totalWidth += hasWidth || cellMinWidth;

      if (!hasWidth) {
        fixedWidth = false;
        cols.push(["col", { style: `min-width: ${cellMinWidth}px` }]);
        continue;
      }

      const widthPx = Math.max(hasWidth, cellMinWidth);
      cols.push(["col", { style: `width: ${widthPx}px` }]);
    }
  }

  return { cols, totalWidth, fixedWidth };
}

/**
 * Apply stored height on the <table> element (outside contentDOM / tbody).
 * TableView.ignoreMutation already ignores mutations outside tbody.
 */
class EditorTableView extends TableView implements NodeView {
  private appliedHeight: number | null = null;

  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    view?: Parameters<typeof TableView>[2],
    HTMLAttributes: Record<string, unknown> = {},
  ) {
    super(node, cellMinWidth, view, HTMLAttributes);
    this.applyStoredHeight(node);
  }

  update(node: ProseMirrorNode): boolean {
    const updated = super.update(node);
    if (updated) {
      this.applyStoredHeight(node);
    }
    return updated;
  }

  ignoreMutation(mutation: ViewMutationRecord): boolean {
    if (super.ignoreMutation(mutation)) {
      return true;
    }
    return false;
  }

  private applyStoredHeight(node: ProseMirrorNode): void {
    const height = (node.attrs.height as number | null) ?? null;
    if (height === this.appliedHeight) {
      return;
    }
    this.appliedHeight = height;

    if (!height) {
      this.table.style.height = "";
      this.table.style.removeProperty("--table-row-height");
      this.table.removeAttribute("data-height");
      return;
    }

    const rowCount = Math.max(1, node.childCount);
    this.table.style.height = `${height}px`;
    this.table.style.setProperty(
      "--table-row-height",
      `${Math.max(TABLE_ROW_MIN_HEIGHT_PX, Math.floor(height / rowCount))}px`,
    );
    this.table.setAttribute("data-height", String(height));
  }
}

export const EditorTable = Table.extend({
  draggable: false,

  addAttributes() {
    return {
      ...this.parent?.(),
      height: {
        default: null,
        parseHTML: (element) => parseHeightAttribute(element),
        // data-height only — do not set style here (would overwrite width from renderHTML)
        renderHTML: (attributes) => {
          if (!attributes.height) {
            return {};
          }
          return { "data-height": String(attributes.height) };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const { cols, totalWidth, fixedWidth } = buildColGroup(node, this.options.cellMinWidth);
    const height = node.attrs.height as number | null;
    const styleParts: string[] = [];

    if (typeof HTMLAttributes.style === "string" && HTMLAttributes.style.trim()) {
      styleParts.push(HTMLAttributes.style.trim());
    }
    if (fixedWidth && totalWidth > 0) {
      styleParts.push(`width: ${totalWidth}px`);
    } else if (totalWidth > 0) {
      styleParts.push(`min-width: ${totalWidth}px`);
    }
    if (height) {
      styleParts.push(`height: ${height}px`);
    }

    const tableAttributes = mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      style: styleParts.join("; "),
    });

    const colgroup: DOMOutputSpec = ["colgroup", {}, ...cols];
    const table: DOMOutputSpec = ["table", tableAttributes, colgroup, ["tbody", 0]];
    return ["div", { class: TABLE_WRAPPER_CLASS }, table];
  },
}).configure({
  resizable: false,
  View: EditorTableView,
  handleWidth: TABLE_COLUMN_HANDLE_WIDTH_PX,
  cellMinWidth: TABLE_CELL_MIN_WIDTH_PX,
  lastColumnResizable: false,
  allowTableNodeSelection: true,
  renderWrapper: true,
});
