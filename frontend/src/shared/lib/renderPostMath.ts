import katex from "katex";
import "katex/dist/katex.min.css";

const INLINE_SELECTOR = '[data-type="math-inline"]';
const DISPLAY_SELECTOR = '[data-type="math-display"]';

function readLatex(element: HTMLElement): string {
  return element.getAttribute("data-latex")?.trim() || element.textContent?.trim() || "";
}

function renderMathElement(element: Element, displayMode: boolean): void {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const latex = readLatex(element);
  if (!latex) {
    return;
  }

  // Already painted (e.g. HTML prep + later effect).
  if (element.querySelector(".katex")) {
    return;
  }

  element.setAttribute("data-latex", latex);

  try {
    katex.render(latex, element, {
      throwOnError: false,
      displayMode,
      output: "html",
    });
  } catch {
    element.textContent = latex;
  }
}

/** Render Notion/TipTap math nodes inside a live post DOM root. */
export function renderPostMath(root: HTMLElement): void {
  root.querySelectorAll(INLINE_SELECTOR).forEach((element) => {
    renderMathElement(element, false);
  });
  root.querySelectorAll(DISPLAY_SELECTOR).forEach((element) => {
    renderMathElement(element, true);
  });
}

/**
 * Bake KaTeX into HTML before React's dangerouslySetInnerHTML so re-renders
 * (e.g. short-content padding) cannot wipe client-only DOM mutations.
 */
export function preparePostContentMathHtml(html: string): string {
  if (typeof DOMParser === "undefined" || !html.trim()) {
    return html;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<div id="post-root">${html}</div>`, "text/html");
  const root = document.getElementById("post-root");
  if (!root) {
    return html;
  }

  renderPostMath(root);
  return root.innerHTML;
}
