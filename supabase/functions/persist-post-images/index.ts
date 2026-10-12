import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
} from "npm:@imagemagick/magick-wasm@0.0.30";
import {
  corsHeaders,
  jsonResponse,
  requireAuthedUser,
} from "../_shared/adminAuthSecrets.ts";

const POSTS_BUCKET = "posts-images";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
/** Match frontend prepareImageForUpload max dimension. */
const MAX_IMAGE_DIMENSION = 1920;
const WEBP_QUALITY = 85;
const IMG_SRC_PATTERN = /<img\b[^>]*?\bsrc\s*=\s*(["'])(.*?)\1/gi;

const magickWasmBytes = await Deno.readFile(
  new URL("magick.wasm", import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.30")),
);
await initializeImageMagick(magickWasmBytes);

/** Browser-like UA — Notion/S3 often reject custom bot UAs with 400. */
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

type HeaderAttempt = {
  label: string;
  headers: Record<string, string>;
};

const DOWNLOAD_HEADER_ATTEMPTS: HeaderAttempt[] = [
  {
    label: "browser+notion-referer",
    headers: {
      "User-Agent": BROWSER_USER_AGENT,
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: "https://www.notion.so/",
      "Accept-Language": "en-US,en;q=0.9",
    },
  },
  {
    label: "browser-minimal",
    headers: {
      "User-Agent": BROWSER_USER_AGENT,
      Accept: "*/*",
    },
  },
  {
    label: "default-fetch",
    headers: {},
  },
];

function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role environment is missing.");
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

/** Normalize img src for fetch without breaking AWS signature query params. */
function normalizeImageSrc(raw: string): string {
  const decoded = decodeHtmlEntities(raw.trim());
  // TipTap / serializers may leave a single layer of percent-encoding on &.
  if (decoded.includes("%3A") || decoded.includes("%2F")) {
    try {
      return decodeURI(decoded);
    } catch {
      return decoded;
    }
  }
  return decoded;
}

function isOwnedPostImageUrl(src: string, supabaseUrl: string): boolean {
  return src.startsWith(`${supabaseUrl}/storage/v1/object/public/${POSTS_BUCKET}/`);
}

function collectExternalImageSrcs(html: string, supabaseUrl: string): string[] {
  const srcs = new Set<string>();
  for (const match of html.matchAll(IMG_SRC_PATTERN)) {
    const raw = match[2]?.trim();
    if (!raw) {
      continue;
    }
    const src = normalizeImageSrc(raw);
    if (!/^https?:\/\//i.test(src)) {
      continue;
    }
    if (isOwnedPostImageUrl(src, supabaseUrl)) {
      continue;
    }
    srcs.add(src);
  }
  return [...srcs];
}

/** Convert downloaded image bytes to WebP (same policy as frontend upload). */
function convertImageBytesToWebp(bytes: Uint8Array): Uint8Array {
  try {
    return ImageMagick.read(bytes, (image) => {
      const width = image.width;
      const height = image.height;
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width >= height) {
          image.resize(MAX_IMAGE_DIMENSION, 0);
        } else {
          image.resize(0, MAX_IMAGE_DIMENSION);
        }
      }
      image.quality = WEBP_QUALITY;
      return image.write(MagickFormat.WebP, (data) => data);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    throw new Error(`WebP conversion failed: ${message}`);
  }
}

async function downloadImageBytes(
  src: string,
): Promise<{ bytes: Uint8Array; contentType: string }> {
  const errors: string[] = [];

  for (const attempt of DOWNLOAD_HEADER_ATTEMPTS) {
    try {
      const response = await fetch(src, {
        redirect: "follow",
        headers: attempt.headers,
      });
      if (!response.ok) {
        errors.push(`${attempt.label}:${response.status}`);
        continue;
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength === 0) {
        errors.push(`${attempt.label}:empty`);
        continue;
      }
      if (bytes.byteLength > MAX_IMAGE_BYTES) {
        throw new Error("Image exceeds the 12MB upload limit.");
      }

      const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ||
        "application/octet-stream";
      if (contentType.includes("text/html") || contentType.includes("application/xml")) {
        errors.push(`${attempt.label}:non-image(${contentType})`);
        continue;
      }

      return { bytes, contentType };
    } catch (error) {
      if (error instanceof Error && error.message.includes("12MB")) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "fetch error";
      errors.push(`${attempt.label}:${message}`);
    }
  }

  throw new Error(`Failed to download image (${errors.join("; ")})`);
}

async function uploadExternalImage(
  supabase: ReturnType<typeof createServiceClient>,
  postId: string,
  src: string,
  folder: "content" | "root",
): Promise<string> {
  const { bytes } = await downloadImageBytes(src);
  const webpBytes = convertImageBytesToWebp(bytes);
  const fileName = `${crypto.randomUUID()}.webp`;
  const filePath = folder === "content" ? `${postId}/content/${fileName}` : `${postId}/${fileName}`;

  const { error } = await supabase.storage.from(POSTS_BUCKET).upload(filePath, webpBytes, {
    upsert: false,
    contentType: "image/webp",
  });
  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(POSTS_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

function replaceAllSrcs(html: string, replacements: Map<string, string>): string {
  let next = html;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
    next = next.split(from.replaceAll("&", "&amp;")).join(to);
    // Also replace HTML-escaped forms that TipTap may emit.
    try {
      next = next.split(encodeURI(from)).join(to);
    } catch {
      // ignore invalid URI sequences
    }
  }
  return next;
}

function shortSrc(src: string): string {
  try {
    const url = new URL(src);
    return `${url.hostname}${url.pathname.slice(0, 48)}`;
  } catch {
    return src.slice(0, 64);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, error: authError } = await requireAuthedUser(req);
    if (!user) {
      return jsonResponse({ error: authError ?? "Unauthorized" }, 401);
    }
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    const postId = typeof body?.postId === "string" ? body.postId.trim() : "";
    const contentHtml = typeof body?.contentHtml === "string" ? body.contentHtml : "";
    const imageUrlRaw = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";
    const imageUrl = imageUrlRaw ? normalizeImageSrc(imageUrlRaw) : "";

    if (!postId) {
      return jsonResponse({ error: "postId is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is missing.");
    }

    const supabase = createServiceClient();
    const replacements = new Map<string, string>();
    const warnings: string[] = [];
    const externalSrcs = collectExternalImageSrcs(contentHtml, supabaseUrl);

    for (const src of externalSrcs) {
      try {
        const publicUrl = await uploadExternalImage(supabase, postId, src, "content");
        replacements.set(src, publicUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        warnings.push(`${shortSrc(src)}: ${message}`);
      }
    }

    let nextImageUrl = imageUrl || null;
    if (imageUrl) {
      if (replacements.has(imageUrl)) {
        nextImageUrl = replacements.get(imageUrl) ?? imageUrl;
      } else if (
        /^https?:\/\//i.test(imageUrl) &&
        !isOwnedPostImageUrl(imageUrl, supabaseUrl)
      ) {
        try {
          nextImageUrl = await uploadExternalImage(supabase, postId, imageUrl, "root");
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          warnings.push(`cover ${shortSrc(imageUrl)}: ${message}`);
        }
      }
    }

    if (warnings.length > 0) {
      // Hard fail so the admin client does not save Notion temp URLs.
      return jsonResponse(
        {
          error:
            `Could not copy ${warnings.length} image(s) to storage. Re-import from Notion and save again while links are fresh.`,
          warnings,
          contentHtml,
          imageUrl: imageUrl || null,
          persistedCount: replacements.size,
        },
        422,
      );
    }

    return jsonResponse({
      contentHtml: replaceAllSrcs(contentHtml, replacements),
      imageUrl: nextImageUrl,
      persistedCount: replacements.size,
      warnings: [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
