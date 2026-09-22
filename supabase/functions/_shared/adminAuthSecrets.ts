import { createClient } from "npm:@supabase/supabase-js@2";

const SECRET_KEY_NOTION = "notion_token";
const SECRET_KEY_GISCUS_PAT = "giscus_github_pat";
const ENV_FALLBACK_GISCUS = "my-blog-giscus-tokens";

function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase service role environment is missing.");
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

async function readSecretFromDb(key: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("admin_secrets")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read admin secret "${key}": ${error.message}`);
  }
  const value = data?.value;
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

export async function getNotionToken(): Promise<string> {
  const fromDb = await readSecretFromDb(SECRET_KEY_NOTION);
  if (fromDb) {
    return fromDb;
  }
  throw new Error(
    "notion_token is not set. Save it in Admin → Settings.",
  );
}

export async function getGiscusGithubPat(): Promise<string> {
  const fromDb = await readSecretFromDb(SECRET_KEY_GISCUS_PAT);
  if (fromDb) {
    return fromDb;
  }
  const fromEnv = Deno.env.get(ENV_FALLBACK_GISCUS)?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  throw new Error(
    "giscus_github_pat is not set (Admin Settings) and env fallback my-blog-giscus-tokens is missing.",
  );
}

export async function requireAuthedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { user: null, error: "Unauthorized" as const };
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
    return { user: null, error: "Unauthorized" as const };
  }
  return { user, error: null };
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
