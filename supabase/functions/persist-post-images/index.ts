import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  jsonResponse,
  requireAuthedUser,
} from "../_shared/adminAuthSecrets.ts";

const POSTS_BUCKET = "posts-images";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const IMG_SRC_PATTERN = /<img\b[^>]*?\bsrc\s*=\s*(["'])(.*?)\1/gi;

function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role environment is missing.");
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

function isOwnedPostImageUrl(src: string, supabaseUrl: string): boolean {
  return src.startsWith(`${supabaseUrl}/storage/v1/object/public/${POSTS_BUCKET}/`);
}

function collectExternalImageSrcs(html: string, supabaseUrl: string): string[] {
  const srcs = new Set<string>();
  for (const match of html.matchAll(IMG_SRC_PATTERN)) {
    const src = match[2]?.trim();
    if (!src || !/^https?:\/\//i.test(src)) {
      continue;
    }
    if (isOwnedPostImageUrl(src, supabaseUrl)) {
      continue;
    }
    srcs.add(src);
  }
  return [...srcs];
}

function extensionForContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  return "bin";
}

async function uploadExternalImage(
  supabase: ReturnType<typeof createServiceClient>,
  postId: string,
  src: string,
  folder: "content" | "root",
): Promise<string> {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Failed to download image (${response.status})`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength === 0) {
    throw new Error("Downloaded image was empty.");
  }
  if (bytes.byteLength > MAX_IMAGE_BYTES) {
    throw new Error("Image exceeds the 12MB upload limit.");
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ||
    "application/octet-stream";
  const extension = extensionForContentType(contentType);
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const filePath = folder === "content" ? `${postId}/content/${fileName}` : `${postId}/${fileName}`;

  const { error } = await supabase.storage.from(POSTS_BUCKET).upload(filePath, bytes, {
    upsert: false,
    contentType,
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
  }
  return next;
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
    const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim() : "";

    if (!postId) {
      return jsonResponse({ error: "postId is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is missing.");
    }

    const supabase = createServiceClient();
    const replacements = new Map<string, string>();
    const externalSrcs = collectExternalImageSrcs(contentHtml, supabaseUrl);

    for (const src of externalSrcs) {
      const publicUrl = await uploadExternalImage(supabase, postId, src, "content");
      replacements.set(src, publicUrl);
    }

    let nextImageUrl = imageUrl || null;
    if (imageUrl) {
      if (replacements.has(imageUrl)) {
        nextImageUrl = replacements.get(imageUrl) ?? imageUrl;
      } else if (
        /^https?:\/\//i.test(imageUrl) &&
        !isOwnedPostImageUrl(imageUrl, supabaseUrl)
      ) {
        nextImageUrl = await uploadExternalImage(supabase, postId, imageUrl, "root");
      }
    }

    return jsonResponse({
      contentHtml: replaceAllSrcs(contentHtml, replacements),
      imageUrl: nextImageUrl,
      persistedCount: replacements.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
