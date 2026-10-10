export const ADMIN_SECRET_KEYS = {
  NOTION_TOKEN: "notion_token",
  GISCUS_GITHUB_PAT: "giscus_github_pat",
  GEMINI_API_KEY: "gemini_api_key",
};

export const ADMIN_SECRET_FIELDS = [
  {
    key: ADMIN_SECRET_KEYS.NOTION_TOKEN,
    label: "Notion Integration Token",
    help: "Notion Internal Integration Secret. Connect the integration to each page you import via Connections.",
    placeholder: "ntn_... or secret_...",
  },
  {
    key: ADMIN_SECRET_KEYS.GISCUS_GITHUB_PAT,
    label: "Giscus GitHub PAT",
    help: "Fine-grained PAT with Discussions read/write. Used to remove discussions when deleting posts.",
    placeholder: "github_pat_... or ghp_...",
  },
  {
    key: ADMIN_SECRET_KEYS.GEMINI_API_KEY,
    label: "Gemini API Key",
    help: "Google AI Studio / Gemini API key. Used on the server (e.g. Edge Functions).",
    placeholder: "AIza...",
  },
];
