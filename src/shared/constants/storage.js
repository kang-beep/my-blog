// Supabase Storage 버킷 이름 (대시보드에서 생성한 이름과 일치해야 함)
export const STORAGE_BUCKETS = {
  PROFILE: "avatars",
  POSTS: "posts-images",
  PORTFOLIO: "portfolio-images",
};

/** 글 이미지 경로: 썸네일 `{postId}/{uuid}.webp` · 본문 `{postId}/content/{uuid}.webp` */
