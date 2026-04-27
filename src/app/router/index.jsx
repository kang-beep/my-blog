// 앱 전체 라우트 구성 모듈: 페이지 매핑을 한곳에서 관리
import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "../../shared/constants/routes";
import ProtectedRoute from "../../shared/layout/ProtectedRoute";
import Home from "../../features/posts/pages/Home";
import Posts from "../../features/posts/pages/Posts";
import PostDetail from "../../features/posts/pages/PostDetail";
import Login from "../../features/auth/pages/Login";
import Admin from "../../features/admin/pages/Admin";

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.POSTS} element={<Posts />} />
      <Route path={ROUTES.POST_DETAIL} element={<PostDetail />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
