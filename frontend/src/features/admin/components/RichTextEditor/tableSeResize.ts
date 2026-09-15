import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { TableMap } from "@tiptap/pm/tables";
import {
  TABLE_MIN_HEIGHT_PX,
  TABLE_MIN_WIDTH_PX,
  TABLE_SE_HANDLE_CLASS,
  TABLE_WRAPPER_CLASS,
} from "@/features/admin/components/RichTextEditor/tableConstants";
import {
  commitTableSize,
  findTableInfo,
  paintTableColumnWidths,
  paintTableHeight,
  readColumnWidths,
  scaleColumnWidths,
} from "@/features/admin/components/RichTextEditor/tableDom";

const tableSeResizePluginKey = new PluginKey("tableSeResize");

interface ResizeSession {
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startColWidths: number[];
  rowCount: number;
  tablePos: number;
  tableEl: HTMLTableElement;
  wrapper: HTMLElement;
  handleEl: Element;
  frameId: number | null;
  pendingWidth: number;
  pendingHeight: number;
}

let activeResizeCount = 0;

function clearLiveTransform(tableEl: HTMLTableElement, wrapper: HTMLElement): void {
  tableEl.style.transform = "";
  tableEl.style.transformOrigin = "";
  wrapper.style.width = "";
  wrapper.style.height = "";
}

function paintLiveScale(session: ResizeSession, width: number, height: number): void {
  const scaleX = width / session.startWidth;
  const scaleY = height / session.startHeight;
  session.tableEl.style.transformOrigin = "top left";
  session.tableEl.style.transform = `scale(${scaleX}, ${scaleY})`;
  session.wrapper.style.width = `${width}px`;
  session.wrapper.style.height = `${height}px`;
}

function startSeResize(view: EditorView, wrapper: HTMLElement, event: PointerEvent): void {
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
  activeResizeCount += 1;

  const map = TableMap.get(tableInfo.node);
  const bounds = tableEl.getBoundingClientRect();
  const storedHeight = tableInfo.node.attrs.height as number | null;
  const session: ResizeSession = {
    startX: event.clientX,
    startY: event.clientY,
    startWidth: Math.max(TABLE_MIN_WIDTH_PX, bounds.width),
    startHeight: Math.max(TABLE_MIN_HEIGHT_PX, storedHeight ?? bounds.height),
    startColWidths: readColumnWidths(tableEl, map.width),
    rowCount: map.height,
    tablePos: tableInfo.pos,
    tableEl,
    wrapper,
    handleEl,
    frameId: null,
    pendingWidth: Math.max(TABLE_MIN_WIDTH_PX, bounds.width),
    pendingHeight: Math.max(TABLE_MIN_HEIGHT_PX, storedHeight ?? bounds.height),
  };

  const onPointerMove = (moveEvent: PointerEvent) => {
    moveEvent.preventDefault();
    session.pendingWidth = Math.max(
      TABLE_MIN_WIDTH_PX,
      session.startWidth + (moveEvent.clientX - session.startX),
    );
    session.pendingHeight = Math.max(
      TABLE_MIN_HEIGHT_PX,
      session.startHeight + (moveEvent.clientY - session.startY),
    );

    if (session.frameId != null) {
      return;
    }

    session.frameId = window.requestAnimationFrame(() => {
      session.frameId = null;
      paintLiveScale(session, session.pendingWidth, session.pendingHeight);
    });
  };

  const finish = () => {
    activeResizeCount = Math.max(0, activeResizeCount - 1);

    try {
      handleEl.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerUp);

    if (session.frameId != null) {
      window.cancelAnimationFrame(session.frameId);
      session.frameId = null;
    }

    clearLiveTransform(session.tableEl, session.wrapper);

    const nextColWidths = scaleColumnWidths(
      session.startColWidths,
      session.pendingWidth / session.startWidth,
    );
    paintTableColumnWidths(session.tableEl, nextColWidths);
    paintTableHeight(session.tableEl, session.pendingHeight, session.rowCount);

    const tableNode = view.state.doc.nodeAt(session.tablePos);
    if (!tableNode || tableNode.type.name !== "table") {
      return;
    }

    commitTableSize(
      view,
      session.tablePos,
      tableNode,
      nextColWidths,
      session.pendingHeight,
    );
  };

  const onPointerUp = () => {
    finish();
  };

  handleEl.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  paintLiveScale(session, session.pendingWidth, session.pendingHeight);
}

/**
 * Only attach chrome handles. Never paint table/col styles here —
 * TableView already owns colgroup sizing, and DOM paint on every
 * plugin update can hang the main thread on destroy.
 */
function ensureSeHandle(wrapper: HTMLElement, view: EditorView): void {
  if (wrapper.dataset.seHandleReady === "1") {
    return;
  }

  if (!wrapper.querySelector(`.${TABLE_SE_HANDLE_CLASS}`)) {
    const handle = document.createElement("div");
    handle.className = TABLE_SE_HANDLE_CLASS;
    handle.contentEditable = "false";
    handle.setAttribute("aria-label", "Resize table");
    wrapper.appendChild(handle);
    handle.addEventListener("pointerdown", (event) => {
      startSeResize(view, wrapper, event);
    });
  }

  if (wrapper.style.position !== "relative") {
    wrapper.style.position = "relative";
  }
  wrapper.dataset.seHandleReady = "1";
}

function syncSeHandles(view: EditorView): void {
  if (activeResizeCount > 0) {
    return;
  }

  view.dom.querySelectorAll<HTMLElement>(`.${TABLE_WRAPPER_CLASS}`).forEach((wrapper) => {
    ensureSeHandle(wrapper, view);
  });
}

export const TableSeResize = Extension.create({
  name: "tableSeResize",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: tableSeResizePluginKey,
        view(editorView) {
          let destroyed = false;
          let pendingFrame: number | null = null;

          const sync = () => {
            if (destroyed) {
              return;
            }
            syncSeHandles(editorView);
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
              // Debounce to rAF — never run paint/sync synchronously on every transaction.
              scheduleSync();
            },
            destroy() {
              destroyed = true;
              if (pendingFrame != null) {
                window.cancelAnimationFrame(pendingFrame);
                pendingFrame = null;
              }
            },
          };
        },
      }),
    ];
  },
});
