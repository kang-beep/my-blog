import { supabase } from "@/shared/lib/supabaseClient";

const NOTION_IMPORT_FUNCTION = "notion-import";

async function invokeNotionImport(body) {
  const { data, error } = await supabase.functions.invoke(NOTION_IMPORT_FUNCTION, {
    body,
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
    throw new Error(details || "Notion import request failed.");
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  return data;
}

export async function searchNotionPages(query = "") {
  const data = await invokeNotionImport({ action: "search", query });
  return data.pages ?? [];
}

export async function fetchNotionPage(pageId) {
  const data = await invokeNotionImport({ action: "fetch", pageId });
  if (!data?.page) {
    throw new Error("Notion page payload is missing.");
  }
  return data.page;
}
