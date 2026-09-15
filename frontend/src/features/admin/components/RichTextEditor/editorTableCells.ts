import { TableCell, TableHeader } from "@tiptap/extension-table";

export type TableCellVerticalAlign = "top" | "middle" | "bottom";

const VERTICAL_ALIGN_VALUES: TableCellVerticalAlign[] = ["top", "middle", "bottom"];

function parseBackgroundColor(element: HTMLElement): string | null {
  const dataColor = element.getAttribute("data-background-color");
  if (dataColor?.trim()) {
    return dataColor.trim();
  }

  const styleColor = element.style.backgroundColor?.trim();
  return styleColor || null;
}

function parseVerticalAlign(element: HTMLElement): TableCellVerticalAlign | null {
  const dataAlign = element.getAttribute("data-vertical-align")?.trim().toLowerCase();
  if (dataAlign && VERTICAL_ALIGN_VALUES.includes(dataAlign as TableCellVerticalAlign)) {
    return dataAlign as TableCellVerticalAlign;
  }

  const styleAlign = element.style.verticalAlign?.trim().toLowerCase();
  if (styleAlign && VERTICAL_ALIGN_VALUES.includes(styleAlign as TableCellVerticalAlign)) {
    return styleAlign as TableCellVerticalAlign;
  }

  const attrAlign = element.getAttribute("valign")?.trim().toLowerCase();
  if (attrAlign && VERTICAL_ALIGN_VALUES.includes(attrAlign as TableCellVerticalAlign)) {
    return attrAlign as TableCellVerticalAlign;
  }

  return null;
}

const backgroundColorAttribute = {
  default: null as string | null,
  parseHTML: (element: HTMLElement) => parseBackgroundColor(element),
  // Prefer CSS variable over background-color style to avoid TipTap style thrash.
  renderHTML: (attributes: { backgroundColor?: string | null }) => {
    if (!attributes.backgroundColor) {
      return {};
    }
    return {
      "data-background-color": attributes.backgroundColor,
      style: `--cell-bg: ${attributes.backgroundColor}`,
    };
  },
};

// Use data attribute only — do NOT write `style` here.
// TipTap cell `align` / backgroundColor also emit `style`; merging them
// can thrash getHTML/setContent and freeze the editor on unmount.
const verticalAlignAttribute = {
  default: null as TableCellVerticalAlign | null,
  parseHTML: (element: HTMLElement) => parseVerticalAlign(element),
  renderHTML: (attributes: { verticalAlign?: TableCellVerticalAlign | null }) => {
    if (!attributes.verticalAlign) {
      return {};
    }
    return {
      "data-vertical-align": attributes.verticalAlign,
    };
  },
};

export const EditorTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: backgroundColorAttribute,
      verticalAlign: verticalAlignAttribute,
    };
  },
});

export const EditorTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: backgroundColorAttribute,
      verticalAlign: verticalAlignAttribute,
    };
  },
});
