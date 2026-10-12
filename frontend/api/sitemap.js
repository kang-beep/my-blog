import { createClient } from "@supabase/supabase-js";

const SITE_ORIGIN = "https://kang-beep-blog.vercel.app";
const POST_STATUS_PUBLISHED = "published";

const STATIC_PATHS = ["/", "/posts", "/trends", "/portfolio"];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(value) {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString().slice(0, 10);
}

function urlEntry(loc, lastmod) {
  const lastmodLine = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : "";
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodLine}\n  </url>`;
}

async function fetchPublishedPosts(supabase) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, updated_at, published_at, created_at")
    .or(`status.eq.${POST_STATUS_PUBLISHED},status.is.null`)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data ?? [];
}

export default async function handler(_req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    res.status(500).setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Missing Supabase environment variables.");
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const posts = await fetchPublishedPosts(supabase);

    const entries = [
      ...STATIC_PATHS.map((path) => urlEntry(`${SITE_ORIGIN}${path}`)),
      ...posts.map((post) => {
        const lastmod =
          toIsoDate(post.updated_at) ??
          toIsoDate(post.published_at) ??
          toIsoDate(post.created_at);
        return urlEntry(`${SITE_ORIGIN}/posts/${post.id}`, lastmod);
      }),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

    res.status(200).setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.end(xml);
  } catch (err) {
    console.error("sitemap generation failed", err);
    res.status(500).setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Failed to generate sitemap.");
  }
}
