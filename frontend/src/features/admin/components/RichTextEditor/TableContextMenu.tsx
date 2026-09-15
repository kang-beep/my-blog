import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import { CellSelection } from "@tiptap/pm/tables";
import { canDeleteSelectedTableRange } from "@/features/admin/components/RichTextEditor/tableSelectionDelete";

interface MenuPosition {
  x: number;
  y: number;
}

interface TableContextMenuProps {
  editor: Editor;
}

interface MenuAction {
  label: string;
  run: () => void;
  danger?: boolean;
}

function isEventInsideCellSelection(editor: Editor, cell: Element): boolean {
  const selection = editor.state.selection;
  if (!(selection instanceof CellSelection)) {
    return false;
  }

  let isInside = false;
  selection.forEachCell((_node, pos) => {
    if (isInside) {
      return;
    }
    const dom = editor.view.nodeDOM(pos);
    if (dom instanceof Element && (dom === cell || dom.contains(cell) || cell.contains(dom))) {
      isInside = true;
    }
  });
  return isInside;
}

function buildActions(editor: Editor): MenuAction[] {
  const actions: MenuAction[] = [
    { label: "Insert row above", run: () => editor.chain().focus().addRowBefore().run() },
    { label: "Insert row below", run: () => editor.chain().focus().addRowAfter().run() },
    { label: "Insert column left", run: () => editor.chain().focus().addColumnBefore().run() },
    { label: "Insert column right", run: () => editor.chain().focus().addColumnAfter().run() },
    { label: "Delete row", run: () => editor.chain().focus().deleteRow().run() },
    { label: "Delete column", run: () => editor.chain().focus().deleteColumn().run() },
  ];

  if (editor.can().mergeCells()) {
    actions.push({
      label: "Merge selected cells",
      run: () => editor.chain().focus().mergeCells().run(),
    });
  }

  if (editor.can().splitCell()) {
    actions.push({
      label: "Split cell",
      run: () => editor.chain().focus().splitCell().run(),
    });
  }

  if (canDeleteSelectedTableRange(editor.state)) {
    actions.push({
      label: "Delete selected rows & columns",
      run: () => editor.chain().focus().deleteSelectedTableRange().run(),
      danger: true,
    });
  }

  actions.push({
    label: "Delete table",
    run: () => editor.chain().focus().deleteTable().run(),
    danger: true,
  });

  return actions;
}

export default function TableContextMenu({ editor }: TableContextMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null);

  useEffect(() => {
    const root = editor.view.dom;

    const closeMenu = () => setPosition(null);

    const onContextMenu = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const cell = target.closest("td, th");
      if (!cell || !root.contains(cell)) {
        return;
      }

      event.preventDefault();

      if (!isEventInsideCellSelection(editor, cell)) {
        const pos = editor.view.posAtDOM(cell, 0);
        editor.chain().focus().setTextSelection(pos).run();
      } else {
        editor.chain().focus().run();
      }

      setPosition({ x: event.clientX, y: event.clientY });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    root.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      root.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editor]);

  if (!position) {
    return null;
  }

  return (
    <div
      className="fixed z-50 min-w-44 overflow-hidden rounded-md border border-slate-200 bg-white py-1 shadow-lg"
      style={{ left: position.x, top: position.y }}
      role="menu"
    >
      {buildActions(editor).map((action) => (
        <button
          key={action.label}
          type="button"
          role="menuitem"
          className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50 ${
            action.danger ? "text-rose-600" : "text-slate-700"
          }`}
          onClick={(event) => {
            event.stopPropagation();
            action.run();
            setPosition(null);
          }}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
