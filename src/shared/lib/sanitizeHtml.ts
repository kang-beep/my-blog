import DOMPurify from "dompurify";

const POST_CONTENT_ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "blockquote",
  "code",
  "pre",
];

const POST_CONTENT_ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "class", "width", "height"];

export function sanitizePostHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: POST_CONTENT_ALLOWED_TAGS,
    ALLOWED_ATTR: POST_CONTENT_ALLOWED_ATTR,
  });
}

export function isHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*>/i.test(content.trim());
}
