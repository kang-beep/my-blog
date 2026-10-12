import { supabase } from "@/shared/lib/supabaseClient";

const PERSIST_POST_IMAGES_FUNCTION = "persist-post-images";

async function readInvokeErrorDetails(error, data) {
  let details = error?.message || "Failed to persist external images.";

  try {
    const response = error?.context;
    if (response && typeof response.json === "function") {
      const payload = await response.json();
      if (typeof payload?.error === "string") {
        details = payload.error;
      }
      if (Array.isArray(payload?.warnings) && payload.warnings.length > 0) {
        details = `${details} (${payload.warnings[0]})`;
      }
    }
  } catch {
    // keep generic message
  }

  if (typeof data?.error === "string") {
    details = data.error;
    if (Array.isArray(data.warnings) && data.warnings.length > 0) {
      details = `${details} (${data.warnings[0]})`;
    }
  }

  return details;
}

export async function persistExternalPostImages({
  postId,
  contentHtml,
  imageUrl = null,
}) {
  const { data, error } = await supabase.functions.invoke(PERSIST_POST_IMAGES_FUNCTION, {
    body: {
      postId,
      contentHtml: contentHtml ?? "",
      imageUrl: imageUrl ?? "",
    },
  });

  if (error) {
    throw new Error(await readInvokeErrorDetails(error, data));
  }

  if (data?.error) {
    throw new Error(await readInvokeErrorDetails(null, data));
  }

  const warnings = Array.isArray(data?.warnings)
    ? data.warnings.filter((item) => typeof item === "string")
    : [];

  // Defense in depth: never save when any image failed to copy.
  if (warnings.length > 0) {
    throw new Error(
      `Could not copy ${warnings.length} image(s) to storage. Re-import from Notion and save again while links are fresh. (${warnings[0]})`,
    );
  }

  return {
    contentHtml: typeof data?.contentHtml === "string" ? data.contentHtml : contentHtml ?? "",
    imageUrl: typeof data?.imageUrl === "string" && data.imageUrl
      ? data.imageUrl
      : imageUrl,
    warnings: [],
    persistedCount: typeof data?.persistedCount === "number" ? data.persistedCount : 0,
  };
}
