// 앱 전역에서 사용하는 라우트 경로 상수 모음
export const ROUTES = {
  HOME: "/",
  POSTS: "/posts",
  POST_DETAIL: "/posts/:id",
  LOGIN: "/login",
  ADMIN: "/admin",
};

export function getPostDetailPath(postId) {
  return `/posts/${postId}`;
}
