export const ADMIN_SECRET_KEYS = {
  NOTION_TOKEN: "notion_token",
  GISCUS_GITHUB_PAT: "giscus_github_pat",
};

export const ADMIN_SECRET_FIELDS = [
  {
    key: ADMIN_SECRET_KEYS.NOTION_TOKEN,
    label: "Notion Integration Token",
    help: "Internal Integration Secret (공부 읽기). Settings → Connections에 페이지가 연결되어 있어야 합니다.",
    placeholder: "ntn_... 또는 secret_...",
  },
  {
    key: ADMIN_SECRET_KEYS.GISCUS_GITHUB_PAT,
    label: "Giscus GitHub PAT",
    help: "Discussions read/write용 fine-grained PAT. 글 삭제 시 Discussion 제거에 사용됩니다.",
    placeholder: "github_pat_... 또는 ghp_...",
  },
];
