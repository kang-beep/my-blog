import { mergeAttributes, Node, type NodeViewRendererProps } from "@tiptap/core";
import katex from "katex";
import "katex/dist/katex.min.css";

function readLatexFromElement(element: HTMLElement): string {
  return element.getAttribute("data-latex")?.trim() || element.textContent?.trim() || "";
}

function paintKatex(dom: HTMLElement, latex: string, displayMode: boolean): void {
  dom.setAttribute("data-latex", latex);
  try {
    katex.render(latex || "", dom, {
      throwOnError: false,
      displayMode,
      output: "html",
    });
  } catch {
    dom.textContent = latex || "";
  }
}

function bindDoubleClickEdit(
  dom: HTMLElement,
  { node, editor, getPos }: NodeViewRendererProps,
  displayMode: boolean,
): void {
  dom.addEventListener("dblclick", () => {
    const next = window.prompt("Edit LaTeX", node.attrs.latex ?? "");
    if (next === null || typeof getPos !== "function") {
      return;
    }

    const pos = getPos();
    if (typeof pos !== "number") {
      return;
    }

    const latex = next.trim();
    editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { latex }));
    paintKatex(dom, latex, displayMode);
  });
}

function createMathNodeView(displayMode: boolean) {
  const expectedName = displayMode ? "mathDisplay" : "mathInline";
  const dataType = displayMode ? "math-display" : "math-inline";

  return (props: NodeViewRendererProps) => {
    const dom = document.createElement(displayMode ? "div" : "span");
    dom.setAttribute("data-type", dataType);
    dom.className = displayMode ? "math-display" : "math-inline";
    paintKatex(dom, props.node.attrs.latex ?? "", displayMode);
    bindDoubleClickEdit(dom, props, displayMode);

    return {
      dom,
      // KaTeX rewrites children; TipTap must not treat that as document edits.
      ignoreMutation: () => true,
      update: (updated: NodeViewRendererProps["node"]) => {
        if (updated.type.name !== expectedName) {
          return false;
        }
        paintKatex(dom, updated.attrs.latex ?? "", displayMode);
        return true;
      },
    };
  };
}

function latexParseRule(tag: string) {
  return {
    tag,
    priority: 60,
    getAttrs: (element: HTMLElement) => ({
      latex: readLatexFromElement(element),
    }),
  };
}

export const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element: HTMLElement) => readLatexFromElement(element),
        renderHTML: (attributes: { latex?: string }) => ({
          "data-latex": attributes.latex ?? "",
        }),
      },
    };
  },
  parseHTML: () => [latexParseRule('span[data-type="math-inline"]')],
  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "math-inline" }),
      node.attrs.latex || "",
    ];
  },
  addNodeView: () => createMathNodeView(false),
});

export const MathDisplay = Node.create({
  name: "mathDisplay",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element: HTMLElement) => readLatexFromElement(element),
        renderHTML: (attributes: { latex?: string }) => ({
          "data-latex": attributes.latex ?? "",
        }),
      },
    };
  },
  parseHTML: () => [latexParseRule('div[data-type="math-display"]')],
  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "math-display" }),
      node.attrs.latex || "",
    ];
  },
  addNodeView: () => createMathNodeView(true),
});
