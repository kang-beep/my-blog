// GitHubTrendingRSS XML: description contains HTML (summary + <hr> + README).

const GITHUB_REPO_URL_PATTERN = /github\.com\/([^/?#]+)\/([^/?#]+)/i;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const HR_SPLIT_PATTERN = /<hr\b[^>]*>/i;
const LEFTOVER_HTML_TAG_PATTERN = /<\/?[a-zA-Z!][^>]{0,200}>/;
const MAX_DESCRIPTION_LENGTH = 280;

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripHtml(html) {
  return html.replace(HTML_TAG_PATTERN, " ");
}

function coerceRssText(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    if (typeof value["#text"] === "string") {
      return value["#text"];
    }

    if (typeof value.__cdata === "string") {
      return value.__cdata;
    }
  }

  return "";
}

function parseRepoTitleFromUrl(url) {
  const text = coerceRssText(url).trim();
  if (!text) {
    return null;
  }

  const match = text.match(GITHUB_REPO_URL_PATTERN);
  if (!match) {
    return null;
  }

  return `${match[1]}/${match[2]}`;
}

function normalizeRssRepoTitle(rssTitle) {
  return coerceRssText(rssTitle).replace(/\s*\/\s*/g, "/").trim();
}

function truncatePlainText(text, maxLength = MAX_DESCRIPTION_LENGTH) {
  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.slice(0, maxLength).replace(/\s+\S*$/, "").trim();
  return truncated || text.slice(0, maxLength).trim();
}

function extractShortDescription(rawDescription) {
  const rawText = coerceRssText(rawDescription).trim();
  if (!rawText) {
    return null;
  }

  const shortSegment = rawText.split(HR_SPLIT_PATTERN)[0] ?? rawText;
  // Decode first so entity-encoded tags become real markup, then strip.
  let plainText = stripHtml(decodeHtmlEntities(shortSegment));
  plainText = stripHtml(decodeHtmlEntities(plainText)).replace(/\s+/g, " ").trim();
  plainText = truncatePlainText(plainText);

  return plainText || null;
}

export function parseGithubTrendingRssItem(item) {
  const url = coerceRssText(item.link).trim();
  const rssTitle = coerceRssText(item.title).trim();
  const title = parseRepoTitleFromUrl(url) ?? normalizeRssRepoTitle(rssTitle);
  const description = extractShortDescription(item.description);

  if (!title || !url) {
    return null;
  }

  return { title, url, description };
}

export function assertPlainTextDescriptions(rows, period) {
  const invalidRows = rows.filter(
    (row) => typeof row.description === "string" && LEFTOVER_HTML_TAG_PATTERN.test(row.description),
  );

  if (invalidRows.length > 0) {
    throw new Error(
      `Parse validation failed for ${period}: ${invalidRows.length} descriptions still contain HTML`,
    );
  }
}
