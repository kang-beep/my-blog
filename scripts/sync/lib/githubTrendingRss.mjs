// GitHubTrendingRSS XML: description contains HTML (summary + <hr> + README).

const GITHUB_REPO_URL_PATTERN = /github\.com\/([^/?#]+)\/([^/?#]+)/i;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const HR_SPLIT_PATTERN = /<hr\b[^>]*>/i;

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

function extractShortDescription(rawDescription) {
  const rawText = coerceRssText(rawDescription).trim();
  if (!rawText) {
    return null;
  }

  const shortSegment = rawText.split(HR_SPLIT_PATTERN)[0] ?? rawText;
  const plainText = decodeHtmlEntities(stripHtml(shortSegment)).replace(/\s+/g, " ").trim();

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
    (row) =>
      typeof row.description === "string" &&
      (row.description.includes("<") || row.description.includes("</")),
  );

  if (invalidRows.length > 0) {
    throw new Error(
      `Parse validation failed for ${period}: ${invalidRows.length} descriptions still contain HTML`,
    );
  }
}
