const HEADING_SELECTOR = "h2, h3";

function slugifyHeading(text, index) {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 48);

  return slug ? `heading-${slug}-${index}` : `post-heading-${index}`;
}

function assignHeadingIds(root) {
  const nodes = [...root.querySelectorAll(HEADING_SELECTOR)];

  return nodes
    .map((element, index) => {
      const text = element.textContent?.trim() ?? "";
      if (!text) {
        return null;
      }

      if (!element.id) {
        element.id = slugifyHeading(text, index);
      }

      return {
        id: element.id,
        text,
        level: element.tagName === "H3" ? 3 : 2,
      };
    })
    .filter(Boolean);
}

/** Assign stable ids to h2/h3 and return TOC entries (DOM order). */
export function ensureAndCollectPostHeadings(root) {
  if (!root) {
    return [];
  }

  return assignHeadingIds(root);
}

/**
 * Put heading ids into HTML before React render so re-renders keep anchors
 * for On this page scroll targets.
 */
export function preparePostContentHeadingsHtml(html) {
  if (typeof DOMParser === "undefined" || !html.trim()) {
    return html;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<div id="post-root">${html}</div>`, "text/html");
  const root = document.getElementById("post-root");
  if (!root) {
    return html;
  }

  assignHeadingIds(root);
  return root.innerHTML;
}
