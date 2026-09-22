import { supabase } from "@/shared/lib/supabaseClient";

const NOTION_IMPORT_FUNCTION = "notion-import";

async function invokeNotionImport(body) {
  const { data, error } = await supabase.functions.invoke(NOTION_IMPORT_FUNCTION, {
    body,
  });

  if (error) {
    const details = typeof data?.error === "string" ? data.error : error.message;
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
