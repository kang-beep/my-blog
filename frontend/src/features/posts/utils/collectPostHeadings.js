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

/** Assign stable ids to h2/h3 and return TOC entries (DOM order). */
export function ensureAndCollectPostHeadings(root) {
  if (!root) {
    return [];
  }

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
