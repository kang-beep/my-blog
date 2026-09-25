import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const NOTION_VERSION = "2022-06-28";
const MAX_BLOCK_DEPTH = 6;

type NotionRichText = {
  plain_text?: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
};

type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  [key: string]: unknown;
};

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function plainTextFromRichText(items: NotionRichText[] | undefined): string {
  if (!items?.length) {
    return "";
  }
  return items.map((item) => item.plain_text ?? "").join("");
}

function richTextToHtml(items: NotionRichText[] | undefined): string {
  if (!items?.length) {
    return "";
  }
  return items
    .map((item) => {
      let html = escapeHtml(item.plain_text ?? "");
      const a = item.annotations;
      if (a?.code) html = `<code>${html}</code>`;
      if (a?.bold) html = `<strong>${html}</strong>`;
      if (a?.italic) html = `<em>${html}</em>`;
      if (a?.strikethrough) html = `<s>${html}</s>`;
      if (a?.underline) html = `<u>${html}</u>`;
      if (item.href) {
        html = `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${html}</a>`;
      }
      return html;
    })
    .join("");
}

function blockRichText(block: NotionBlock): NotionRichText[] {
  const typed = block[block.type] as { rich_text?: NotionRichText[] } | undefined;
  return typed?.rich_text ?? [];
}

async function notionFetch(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    const message = (payload as { message?: string })?.message ?? response.statusText;
    throw new Error(`Notion API error: ${message}`);
  }
  return payload;
}

function resolveParentId(parent: {
  type?: string;
  page_id?: string;
  database_id?: string;
  block_id?: string;
} | undefined): string | null {
  if (!parent?.type) {
    return null;
  }
  if (parent.type === "page_id" && parent.page_id) {
    return parent.page_id;
  }
  if (parent.type === "database_id" && parent.database_id) {
    return parent.database_id;
  }
  if (parent.type === "block_id" && parent.block_id) {
    return parent.block_id;
  }
  return null;
}

export async function searchNotionPages(token: string, query = "") {
  const pages: Array<{
    id: string;
    title: string;
    url: string | null;
    lastEditedTime: string | null;
    parentId: string | null;
  }> = [];
  let cursor: string | null = null;

  for (;;) {
    const payload = await notionFetch(token, "/search", {
      method: "POST",
      body: JSON.stringify({
        query: query || undefined,
        filter: { property: "object", value: "page" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
        page_size: 100,
        start_cursor: cursor || undefined,
      }),
    }) as {
      results?: Array<{
        id: string;
        url?: string;
        last_edited_time?: string;
        parent?: {
          type?: string;
          page_id?: string;
          database_id?: string;
          block_id?: string;
        };
        properties?: Record<string, { type?: string; title?: NotionRichText[] }>;
      }>;
      has_more?: boolean;
      next_cursor?: string | null;
    };

    for (const page of payload.results ?? []) {
      const titleProp = Object.values(page.properties ?? {}).find(
        (prop) => prop?.type === "title",
      );
      const title = plainTextFromRichText(titleProp?.title) || "Untitled";
      pages.push({
        id: page.id,
        title,
        url: page.url ?? null,
        lastEditedTime: page.last_edited_time ?? null,
        parentId: resolveParentId(page.parent),
      });
    }

    if (!payload.has_more || !payload.next_cursor) {
      break;
    }
    cursor = payload.next_cursor;
  }

  return pages;
}

async function listBlockChildren(
  token: string,
  blockId: string,
): Promise<NotionBlock[]> {
  const blocks: NotionBlock[] = [];
  let cursor: string | null = null;
  for (;;) {
    const path = cursor
      ? `/blocks/${blockId}/children?page_size=100&start_cursor=${cursor}`
      : `/blocks/${blockId}/children?page_size=100`;
    const payload = await notionFetch(token, path) as {
      results?: NotionBlock[];
      has_more?: boolean;
      next_cursor?: string | null;
    };
    blocks.push(...(payload.results ?? []));
    if (!payload.has_more || !payload.next_cursor) {
      break;
    }
    cursor = payload.next_cursor;
  }
  return blocks;
}

const NO_NESTED_CONTENT_TYPES = new Set([
  "child_page",
  "child_database",
  "link_to_page",
]);

async function blockToHtml(
  token: string,
  block: NotionBlock,
  depth: number,
): Promise<string> {
  if (depth > MAX_BLOCK_DEPTH) {
    return "";
  }

  if (block.type === "child_page") {
    const title =
      (block.child_page as { title?: string } | undefined)?.title ||
      "Untitled page";
    return `<p><em>하위 페이지:</em> ${escapeHtml(title)}</p>`;
  }

  if (block.type === "child_database") {
    const title =
      (block.child_database as { title?: string } | undefined)?.title ||
      "Database";
    return `<p><em>하위 데이터베이스:</em> ${escapeHtml(title)}</p>`;
  }

  if (block.type === "link_to_page") {
    return `<p><em>[다른 페이지 링크]</em></p>`;
  }

  const inner = richTextToHtml(blockRichText(block));
  let childrenHtml = "";
  if (block.has_children && !NO_NESTED_CONTENT_TYPES.has(block.type)) {
    const children = await listBlockChildren(token, block.id);
    const parts: string[] = [];
    for (const child of children) {
      parts.push(await blockToHtml(token, child, depth + 1));
    }
    childrenHtml = parts.join("");
  }

  switch (block.type) {
    case "paragraph":
      return `<p>${inner}${childrenHtml}</p>`;
    case "heading_1":
      return `<h1>${inner}</h1>${childrenHtml}`;
    case "heading_2":
      return `<h2>${inner}</h2>${childrenHtml}`;
    case "heading_3":
      return `<h3>${inner}</h3>${childrenHtml}`;
    case "bulleted_list_item":
      return `<ul><li>${inner}${childrenHtml}</li></ul>`;
    case "numbered_list_item":
      return `<ol><li>${inner}${childrenHtml}</li></ol>`;
    case "to_do": {
      const checked = Boolean(
        (block.to_do as { checked?: boolean } | undefined)?.checked,
      );
      return `<p><input type="checkbox" disabled ${checked ? "checked" : ""}/> ${inner}</p>${childrenHtml}`;
    }
    case "quote":
    case "callout":
      return `<blockquote>${inner}${childrenHtml}</blockquote>`;
    case "code": {
      const code = richTextToHtml(
        (block.code as { rich_text?: NotionRichText[] } | undefined)?.rich_text,
      );
      return `<pre><code>${code}</code></pre>`;
    }
    case "divider":
      return "<hr />";
    case "image": {
      const image = block.image as {
        type?: string;
        file?: { url?: string };
        external?: { url?: string };
        caption?: NotionRichText[];
      };
      const src = image?.type === "external"
        ? image.external?.url
        : image?.file?.url;
      if (!src) {
        return childrenHtml;
      }
      const caption = richTextToHtml(image.caption);
      return `<figure><img src="${escapeHtml(src)}" alt="" />${
        caption ? `<figcaption>${caption}</figcaption>` : ""
      }</figure>${childrenHtml}`;
    }
    case "toggle":
      return `<details><summary>${inner}</summary>${childrenHtml}</details>`;
    default:
      if (inner) {
        return `<p>${inner}</p>${childrenHtml}`;
      }
      return childrenHtml;
  }
}

export async function fetchNotionPage(token: string, pageId: string) {
  const page = await notionFetch(token, `/pages/${pageId}`) as {
    id: string;
    url?: string;
    properties?: Record<string, { type?: string; title?: NotionRichText[] }>;
  };
  const titleProp = Object.values(page.properties ?? {}).find(
    (prop) => prop?.type === "title",
  );
  const title = plainTextFromRichText(titleProp?.title) || "Untitled";

  const blocks = await listBlockChildren(token, pageId);
  const htmlParts: string[] = [];
  const warnings: string[] = [];
  for (const block of blocks) {
    if (
      [
        "embed",
        "bookmark",
        "synced_block",
        "column_list",
        "column",
        "table",
        "table_row",
      ].includes(block.type)
    ) {
      warnings.push(`Unsupported block simplified/skipped: ${block.type}`);
    }
    htmlParts.push(await blockToHtml(token, block, 0));
  }

  return {
    id: page.id,
    title,
    url: page.url ?? null,
    contentHtml: htmlParts.join("\n"),
    warnings,
  };
}
