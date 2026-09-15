import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIND_DISCUSSION_QUERY = `
  query FindDiscussion($owner: String!, $name: String!, $categoryId: ID!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      discussions(first: 100, after: $cursor, categoryId: $categoryId) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
        }
      }
    }
  }
`;

const DELETE_DISCUSSION_MUTATION = `
  mutation DeleteDiscussion($discussionId: ID!) {
    deleteDiscussion(input: { discussionId: $discussionId }) {
      clientMutationId
    }
  }
`;

const GITHUB_TOKEN_SECRET = "my-blog-giscus-tokens";

async function githubGraphql(query: string, variables: Record<string, unknown>) {
  const token = Deno.env.get(GITHUB_TOKEN_SECRET);
  if (!token) {
    throw new Error(`${GITHUB_TOKEN_SECRET} is not configured on the Edge Function.`);
  }

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.[0]?.message ?? `GitHub API failed (${response.status})`;
    throw new Error(message);
  }

  return payload.data;
}

async function findDiscussionId(
  owner: string,
  name: string,
  categoryId: string,
  term: string,
): Promise<string | null> {
  let cursor: string | null = null;

  while (true) {
    const data = await githubGraphql(FIND_DISCUSSION_QUERY, {
      owner,
      name,
      categoryId,
      cursor,
    });

    const discussions = data?.repository?.discussions;
    if (!discussions) {
      return null;
    }

    const match = discussions.nodes.find((node: { title: string }) => node.title === term);
    if (match) {
      return match.id;
    }

    if (!discussions.pageInfo.hasNextPage) {
      return null;
    }

    cursor = discussions.pageInfo.endCursor;
  }
}

async function deleteDiscussion(discussionId: string) {
  await githubGraphql(DELETE_DISCUSSION_MUTATION, { discussionId });
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are missing.");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { postId } = await req.json();
    if (!postId || typeof postId !== "string") {
      return jsonResponse({ error: "postId is required" }, 400);
    }

    const repo = Deno.env.get("GISCUS_REPO") ?? "kang-beep/my-blog";
    const categoryId = Deno.env.get("GISCUS_CATEGORY_ID") ?? "DIC_kwDOSNYvx84DFpTp";
    const [owner, repoName] = repo.split("/");

    if (!owner || !repoName) {
      throw new Error("Invalid GISCUS_REPO format. Use owner/repo.");
    }

    const discussionId = await findDiscussionId(owner, repoName, categoryId, postId);
    if (!discussionId) {
      return jsonResponse({ deleted: false, reason: "not_found" });
    }

    await deleteDiscussion(discussionId);
    return jsonResponse({ deleted: true, discussionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
