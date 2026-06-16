import { POST_EXCERPT_ELLIPSIS, POST_EXCERPT_MAX_LENGTH } from "@/features/posts/constants/postDisplay";

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

export function stripHtml(html) {
  if (!html?.trim()) {
    return "";
  }

  if (typeof DOMParser === "undefined") {
    return normalizeWhitespace(html.replace(/<[^>]+>/g, " "));
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  return normalizeWhitespace(doc.body.textContent ?? "");
}

export function extractFirstImageSrc(html) {
  if (!html?.trim()) {
    return null;
  }

  if (typeof DOMParser === "undefined") {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match?.[1] ?? null;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const image = doc.querySelector("img[src]");
  return image?.getAttribute("src") || null;
}

export function truncateExcerpt(text, maxLength = POST_EXCERPT_MAX_LENGTH) {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return "";
  }

  if (normalized.length > maxLength) {
    return `${normalized.slice(0, maxLength).trimEnd()}${POST_EXCERPT_ELLIPSIS}`;
  }

  return normalized;
}

export function buildExcerptFromContent(content, maxLength = POST_EXCERPT_MAX_LENGTH) {
  return truncateExcerpt(stripHtml(content), maxLength);
}

export function resolvePostExcerpt(post) {
  const manual = post?.excerpt?.trim();
  if (manual) {
    return manual;
  }

  return buildExcerptFromContent(post?.content ?? "");
}

export function resolvePostThumbnailUrl(post) {
  const thumbnail = post?.image_url?.trim();
  if (thumbnail) {
    return thumbnail;
  }

  return extractFirstImageSrc(post?.content ?? "");
}
