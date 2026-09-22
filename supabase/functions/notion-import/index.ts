import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  corsHeaders,
  getNotionToken,
  jsonResponse,
  requireAuthedUser,
} from "../_shared/adminAuthSecrets.ts";
import { fetchNotionPage, searchNotionPages } from "../_shared/notionClient.ts";

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
    const action = body?.action;
    const token = await getNotionToken();

    if (action === "search") {
      const query = typeof body.query === "string" ? body.query : "";
      const pages = await searchNotionPages(token, query);
      return jsonResponse({ pages });
    }

    if (action === "fetch") {
      const pageId = body?.pageId;
      if (!pageId || typeof pageId !== "string") {
        return jsonResponse({ error: "pageId is required" }, 400);
      }
      const page = await fetchNotionPage(token, pageId);
      return jsonResponse({ page });
    }

    return jsonResponse({ error: "Unknown action. Use search or fetch." }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
