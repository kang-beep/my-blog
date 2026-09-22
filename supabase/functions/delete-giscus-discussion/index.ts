import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {
  corsHeaders,
  getGiscusGithubPat,
  jsonResponse,
  requireAuthedUser,
} from "../_shared/adminAuthSecrets.ts";

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

async function githubGraphql(query: string, variables: Record<string, unknown>) {
  const token = await getGiscusGithubPat();
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();
  if (!response.ok || payload.errors) {
    const message = payload.errors?.[0]?.message ?? response.statusText;
    throw new Error(`GitHub GraphQL failed: ${message}`);
  }
  return payload.data;
}

async function findDiscussionId(
  owner: string,
  name: string,
  categoryId: string,
  postId: string,
) {
  let cursor: string | null = null;
  const needle = postId.toLowerCase();

  for (;;) {
    const data = await githubGraphql(FIND_DISCUSSION_QUERY, {
      owner,
      name,
      categoryId,
      cursor,
    });
    const discussions = data.repository?.discussions;
    const nodes = discussions?.nodes ?? [];
    for (const node of nodes) {
      const title = String(node?.title ?? "").toLowerCase();
      if (title.includes(needle)) {
        return node.id as string;
      }
    }
    if (!discussions?.pageInfo?.hasNextPage) {
      return null;
    }
    cursor = discussions.pageInfo.endCursor;
  }
}

async function deleteDiscussion(discussionId: string) {
  await githubGraphql(DELETE_DISCUSSION_MUTATION, { discussionId });
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

    const { postId } = await req.json();
    if (!postId || typeof postId !== "string") {
      return jsonResponse({ error: "postId is required" }, 400);
    }

    const repo = Deno.env.get("GISCUS_REPO") ?? "kang-beep/my-blog";
    const categoryId =
      Deno.env.get("GISCUS_CATEGORY_ID") ?? "DIC_kwDOSNYvx84DFpTp";
    const [owner, repoName] = repo.split("/");

    if (!owner || !repoName) {
      throw new Error("Invalid GISCUS_REPO format. Use owner/repo.");
    }

    const discussionId = await findDiscussionId(
      owner,
      repoName,
      categoryId,
      postId,
    );
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
