// 앱 전역에서 사용하는 라우트 경로 상수 모음
export const ROUTES = {
  HOME: "/",
  POSTS: "/posts",
  POST_DETAIL: "/posts/:id",
  WRITE: "/write",
  EDIT: "/edit/:id",
  PORTFOLIO: "/portfolio",
  LOGIN: "/login",
  MANAGE: "/manage-kang-beep",
};

export function getPostDetailPath(postId) {
  return `/posts/${postId}`;
}

export function getEditPostPath(postId) {
  return `/edit/${postId}`;
}
