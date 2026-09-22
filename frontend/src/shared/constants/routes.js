// 앱 전역에서 사용하는 라우트 경로 상수 모음
export const ROUTES = {
  HOME: "/",
  POSTS: "/posts",
  POST_DETAIL: "/posts/:id",
  PORTFOLIO: "/portfolio",
  ADMIN_LOGIN: "/admin-login",
  ADMIN: "/admin",
  ADMIN_PROFILE: "/admin/profile",
  ADMIN_POSTS: "/admin/posts",
  ADMIN_POSTS_NEW: "/admin/posts/new",
  ADMIN_POSTS_EDIT: "/admin/posts/:id/edit",
  ADMIN_PORTFOLIO: "/admin/portfolio",
  ADMIN_SETTINGS: "/admin/settings",
};

export function getPostDetailPath(postId) {
  return `/posts/${postId}`;
}

export function getAdminPostEditPath(postId) {
  return `/admin/posts/${postId}/edit`;
}
