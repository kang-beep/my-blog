import { supabase } from "@/shared/lib/supabaseClient";

// Supabase에 배포된 Edge Function 슬러그 (URL: .../functions/v1/dynamic-handler)
const DELETE_GISCUS_DISCUSSION_FUNCTION = "dynamic-handler";

async function readFunctionErrorBody(error) {
  if (!error?.context || typeof error.context.json !== "function") {
    return null;
  }

  try {
    return await error.context.json();
  } catch {
    return null;
  }
}

async function formatFunctionInvokeError(error) {
  if (!error) {
    return "Giscus discussion delete failed.";
  }

  const body = await readFunctionErrorBody(error);
  if (body?.error) {
    return String(body.error);
  }

  const status = error.context?.status;
  if (status === 401) {
    return "Unauthorized (401). Check admin sign-in and Edge Function JWT verification settings.";
  }
  if (status === 404) {
    return `Edge Function "${DELETE_GISCUS_DISCUSSION_FUNCTION}" not found (404). Confirm it is deployed on Supabase.`;
  }
  if (status) {
    return `${error.message || "Edge Function request failed."} (HTTP ${status})`;
  }

  if (error.message?.includes("Failed to send a request")) {
    return [
      "Could not reach the Edge Function.",
      "Check: dynamic-handler deployed,",
      "Dashboard JWT verify OFF (or legacy secret match),",
      "project paused or network blocked.",
    ].join(" ");
  }

  return error.message || "Giscus discussion delete failed.";
}

export async function deleteGiscusDiscussion(postId) {
  if (!postId) {
    return { deleted: false, reason: "missing_post_id" };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Giscus discussion delete requires an authenticated session.");
  }

  const { data, error } = await supabase.functions.invoke(DELETE_GISCUS_DISCUSSION_FUNCTION, {
    body: { postId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(await formatFunctionInvokeError(error));
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data;
}
