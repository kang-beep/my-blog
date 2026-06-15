// GitHubTrendingRSS XML feeds — description is RSS CDATA that embeds HTML (short summary + <hr> + README).
// We fetch .xml (not repo HTML pages), parse XML, then store plain text in Supabase.

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

export function stripHtml(html) {
  return html.replace(HTML_TAG_PATTERN, " ");
}

export function parseRepoTitleFromUrl(url) {
  if (typeof url !== "string") {
    return null;
  }

  const match = url.match(GITHUB_REPO_URL_PATTERN);
  if (!match) {
    return null;
  }

  return `${match[1]}/${match[2]}`;
}

export function normalizeRssRepoTitle(rssTitle) {
  if (typeof rssTitle !== "string") {
    return "";
  }

  return rssTitle.replace(/\s*\/\s*/g, "/").trim();
}

export function extractShortDescription(rawDescription) {
  if (typeof rawDescription !== "string") {
    return null;
  }

  const shortSegment = rawDescription.split(HR_SPLIT_PATTERN)[0] ?? rawDescription;
  const plainText = decodeHtmlEntities(stripHtml(shortSegment)).replace(/\s+/g, " ").trim();

  return plainText || null;
}

export function parseGithubTrendingRssItem(item) {
  const url = typeof item.link === "string" ? item.link.trim() : "";
  const rssTitle = typeof item.title === "string" ? item.title.trim() : "";
  const title = parseRepoTitleFromUrl(url) ?? normalizeRssRepoTitle(rssTitle);
  const description = extractShortDescription(item.description);

  if (!title || !url) {
    return null;
  }

  return { title, url, description };
}
