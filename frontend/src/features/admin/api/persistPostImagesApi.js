import { supabase } from "@/shared/lib/supabaseClient";

const PERSIST_POST_IMAGES_FUNCTION = "persist-post-images";

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
    let details = error.message;
    try {
      const response = error.context;
      if (response && typeof response.json === "function") {
        const payload = await response.json();
        if (typeof payload?.error === "string") {
          details = payload.error;
        }
      }
    } catch {
      // keep generic message
    }
    if (typeof data?.error === "string") {
      details = data.error;
    }
    throw new Error(details || "Failed to persist external images.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    contentHtml: typeof data?.contentHtml === "string" ? data.contentHtml : contentHtml ?? "",
    imageUrl: typeof data?.imageUrl === "string" && data.imageUrl
      ? data.imageUrl
      : imageUrl,
  };
}
