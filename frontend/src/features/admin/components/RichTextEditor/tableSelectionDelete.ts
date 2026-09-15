import { Extension } from "@tiptap/core";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import {
  CellSelection,
  TableMap,
  deleteTable,
  isInTable,
  removeColumn,
  removeRow,
  selectedRect,
} from "@tiptap/pm/tables";

type TableRect = ReturnType<typeof selectedRect>;

function refreshRectTable(tr: Transaction, rect: TableRect): boolean {
  const table = rect.tableStart ? tr.doc.nodeAt(rect.tableStart - 1) : tr.doc;
  if (!table) {
    return false;
  }
  rect.table = table;
  rect.map = TableMap.get(table);
  return true;
}

function removeColumnsInRange(tr: Transaction, rect: TableRect): boolean {
  if (rect.left === 0 && rect.right === rect.map.width) {
    return false;
  }

  for (let column = rect.right - 1; ; column -= 1) {
    removeColumn(tr, rect, column);
    if (column === rect.left) {
      break;
    }
    if (!refreshRectTable(tr, rect)) {
      return false;
    }
  }
  return true;
}

function removeRowsInRange(tr: Transaction, rect: TableRect): boolean {
  if (rect.top === 0 && rect.bottom === rect.map.height) {
    return false;
  }

  for (let row = rect.bottom - 1; ; row -= 1) {
    removeRow(tr, rect, row);
    if (row === rect.top) {
      break;
    }
    if (!refreshRectTable(tr, rect)) {
      return false;
    }
  }
  return true;
}

function isMultiCellSelection(selection: CellSelection): boolean {
  let cellCount = 0;
  selection.forEachCell(() => {
    cellCount += 1;
  });
  return cellCount > 1;
}

export function canDeleteSelectedTableRange(state: EditorState): boolean {
  if (!isInTable(state) || !(state.selection instanceof CellSelection)) {
    return false;
  }
  return isMultiCellSelection(state.selection);
}

export function deleteSelectedTableRange(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  if (!canDeleteSelectedTableRange(state)) {
    return false;
  }

  const rect = selectedRect(state);
  const coversAllRows = rect.top === 0 && rect.bottom === rect.map.height;
  const coversAllCols = rect.left === 0 && rect.right === rect.map.width;

  if (coversAllRows && coversAllCols) {
    return deleteTable(state, dispatch);
  }

  if (!dispatch) {
    return true;
  }

  const tr = state.tr;
  const shouldDeleteColumns = !coversAllCols;
  const shouldDeleteRows = !coversAllRows;

  if (shouldDeleteColumns && !removeColumnsInRange(tr, rect)) {
    return false;
  }

  if (shouldDeleteRows) {
    if (!refreshRectTable(tr, rect)) {
      return false;
    }
    if (!removeRowsInRange(tr, rect)) {
      return false;
    }
  }

  dispatch(tr);
  return true;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tableSelectionDelete: {
      deleteSelectedTableRange: () => ReturnType;
    };
  }
}

export const TableSelectionDelete = Extension.create({
  name: "tableSelectionDelete",

  addCommands() {
    return {
      deleteSelectedTableRange:
        () =>
        ({ state, dispatch }) =>
          deleteSelectedTableRange(state, dispatch),
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        if (!canDeleteSelectedTableRange(editor.state)) {
          return false;
        }
        return editor.commands.deleteSelectedTableRange();
      },
      Delete: ({ editor }) => {
        if (!canDeleteSelectedTableRange(editor.state)) {
          return false;
        }
        return editor.commands.deleteSelectedTableRange();
      },
    };
  },
});
