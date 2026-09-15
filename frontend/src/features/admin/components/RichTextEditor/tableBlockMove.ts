import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import {
  TABLE_DRAGGING_CLASS,
  TABLE_MOVE_HANDLE_CLASS,
  TABLE_WRAPPER_CLASS,
} from "@/features/admin/components/RichTextEditor/tableConstants";
import { findTableInfo } from "@/features/admin/components/RichTextEditor/tableDom";

const tableBlockMovePluginKey = new PluginKey("tableBlockMove");
const DROP_CURSOR_CLASS = "table-drop-cursor";

function removeDropCursor(): void {
  document.querySelectorAll(`.${DROP_CURSOR_CLASS}`).forEach((node) => node.remove());
}

function showDropCursor(view: EditorView, dropPos: number): void {
  removeDropCursor();
  try {
    const bounds = view.coordsAtPos(dropPos);
    const cursor = document.createElement("div");
    cursor.className = DROP_CURSOR_CLASS;
    cursor.style.left = `${bounds.left}px`;
    cursor.style.top = `${bounds.top}px`;
    cursor.style.height = `${Math.max(20, bounds.bottom - bounds.top + 8)}px`;
    document.body.appendChild(cursor);
  } catch {
    // ignore invalid coords
  }
}

/**
 * Only allow drops between top-level blocks (never inside a text line).
 */
function resolveBlockGapDropPos(view: EditorView, clientY: number): number | null {
  const doc = view.state.doc;
  let bestPos: number | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  const consider = (pos: number) => {
    try {
      const bounds = view.coordsAtPos(pos);
      const distance = Math.abs(clientY - (bounds.top + bounds.bottom) / 2);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPos = pos;
      }
    } catch {
      // skip invalid positions
    }
  };

  consider(0);
  doc.forEach((node, offset) => {
    consider(offset);
    consider(offset + node.nodeSize);
  });

  return bestPos;
}

function isDropInsideMovedTable(tablePos: number, tableSize: number, dropPos: number): boolean {
  return dropPos > tablePos && dropPos < tablePos + tableSize;
}

function moveTableNode(
  view: EditorView,
  tablePos: number,
  tableNode: ProseMirrorNode,
  dropPos: number,
): boolean {
  if (isDropInsideMovedTable(tablePos, tableNode.nodeSize, dropPos)) {
    return false;
  }

  if (dropPos === tablePos || dropPos === tablePos + tableNode.nodeSize) {
    return false;
  }

  let insertPos = dropPos;
  if (dropPos > tablePos) {
    insertPos = dropPos - tableNode.nodeSize;
  }

  const tr = view.state.tr.delete(tablePos, tablePos + tableNode.nodeSize);
  const mappedInsert = Math.max(0, Math.min(insertPos, tr.doc.content.size));

  const $insert = tr.doc.resolve(mappedInsert);
  if (!$insert.parent.canReplaceWith($insert.index(), $insert.index(), tableNode.type)) {
    return false;
  }

  tr.insert(mappedInsert, tableNode);
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(mappedInsert + 1, tr.doc.content.size))));
  view.dispatch(tr.scrollIntoView());
  return true;
}

function startTableMove(view: EditorView, wrapper: HTMLElement, event: PointerEvent): void {
  const tableEl = wrapper.querySelector("table");
  if (!(tableEl instanceof HTMLTableElement)) {
    return;
  }

  const tableInfo = findTableInfo(view, tableEl);
  if (!tableInfo) {
    return;
  }

  const handleEl = event.currentTarget;
  if (!(handleEl instanceof Element)) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const bounds = wrapper.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.className = TABLE_DRAGGING_CLASS;
  ghost.style.position = "fixed";
  ghost.style.left = `${bounds.left}px`;
  ghost.style.top = `${bounds.top}px`;
  ghost.style.width = `${bounds.width}px`;
  ghost.style.height = `${bounds.height}px`;
  ghost.style.border = "2px dashed rgb(79 70 229)";
  ghost.style.background = "rgb(99 102 241 / 0.12)";
  ghost.style.pointerEvents = "none";
  ghost.style.zIndex = "60";
  document.body.appendChild(ghost);

  wrapper.classList.add(TABLE_DRAGGING_CLASS);
  const offsetX = event.clientX - bounds.left;
  const offsetY = event.clientY - bounds.top;
  let lastDropPos = resolveBlockGapDropPos(view, event.clientY);

  const onPointerMove = (moveEvent: PointerEvent) => {
    moveEvent.preventDefault();
    ghost.style.left = `${moveEvent.clientX - offsetX}px`;
    ghost.style.top = `${moveEvent.clientY - offsetY}px`;
    lastDropPos = resolveBlockGapDropPos(view, moveEvent.clientY);
    if (lastDropPos != null) {
      showDropCursor(view, lastDropPos);
    }
  };

  const finish = (clientY: number) => {
    try {
      handleEl.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);

    ghost.remove();
    removeDropCursor();
    wrapper.classList.remove(TABLE_DRAGGING_CLASS);

    const dropPos = lastDropPos ?? resolveBlockGapDropPos(view, clientY);
    if (dropPos == null) {
      return;
    }

    const latest = view.state.doc.nodeAt(tableInfo.pos);
    if (!latest || latest.type.name !== "table") {
      return;
    }
    moveTableNode(view, tableInfo.pos, latest, dropPos);
  };

  const onPointerUp = (upEvent: PointerEvent) => {
    finish(upEvent.clientY);
  };

  handleEl.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
}

function ensureMoveHandle(wrapper: HTMLElement, view: EditorView): void {
  if (wrapper.dataset.moveHandleReady === "1") {
    return;
  }

  let handle = wrapper.querySelector<HTMLElement>(`.${TABLE_MOVE_HANDLE_CLASS}`);
  if (!handle) {
    handle = document.createElement("div");
    handle.className = TABLE_MOVE_HANDLE_CLASS;
    handle.contentEditable = "false";
    handle.setAttribute("aria-label", "Move table");
    handle.title = "Drag to move table";
    wrapper.appendChild(handle);
    handle.addEventListener("pointerdown", (event) => {
      startTableMove(view, wrapper, event);
    });
  }

  if (wrapper.style.position !== "relative") {
    wrapper.style.position = "relative";
  }
  wrapper.dataset.moveHandleReady = "1";
}

function syncMoveHandles(view: EditorView): void {
  view.dom.querySelectorAll<HTMLElement>(`.${TABLE_WRAPPER_CLASS}`).forEach((wrapper) => {
    ensureMoveHandle(wrapper, view);
  });
}

export const TableBlockMove = Extension.create({
  name: "tableBlockMove",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: tableBlockMovePluginKey,
        view(editorView) {
          let destroyed = false;
          let pendingFrame: number | null = null;

          const sync = () => {
            if (destroyed) {
              return;
            }
            syncMoveHandles(editorView);
          };

          const scheduleSync = () => {
            if (destroyed || pendingFrame != null) {
              return;
            }
            pendingFrame = window.requestAnimationFrame(() => {
              pendingFrame = null;
              sync();
            });
          };

          sync();
          return {
            update() {
              scheduleSync();
            },
            destroy() {
              destroyed = true;
              if (pendingFrame != null) {
                window.cancelAnimationFrame(pendingFrame);
                pendingFrame = null;
              }
              removeDropCursor();
            },
          };
        },
      }),
    ];
  },
});
