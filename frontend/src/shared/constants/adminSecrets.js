export const ADMIN_SECRET_KEYS = {
  NOTION_TOKEN: "notion_token",
  GISCUS_GITHUB_PAT: "giscus_github_pat",
  GEMINI_API_KEY: "gemini_api_key",
  GEMINI_OUTPUT_LANGUAGE: "gemini_output_language",
};

export const GEMINI_OUTPUT_LANGUAGES = {
  EN: "en",
  KO: "ko",
};

export const DEFAULT_GEMINI_OUTPUT_LANGUAGE = GEMINI_OUTPUT_LANGUAGES.EN;

export const GEMINI_OUTPUT_LANGUAGE_OPTIONS = [
  { value: GEMINI_OUTPUT_LANGUAGES.EN, label: "en" },
  { value: GEMINI_OUTPUT_LANGUAGES.KO, label: "ko" },
];

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
];

export const GEMINI_API_KEY_FIELD = {
  key: ADMIN_SECRET_KEYS.GEMINI_API_KEY,
  label: "API Key",
  help: "Google AI Studio / Gemini API key. Used by GitHub Actions digest jobs (via service role).",
  placeholder: "AIza...",
};
