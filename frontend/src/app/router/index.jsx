// 앱 전체 라우트 구성 모듈: 페이지 매핑을 한곳에서 관리
import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "@/shared/constants/routes";
import ProtectedRoute from "@/shared/layout/ProtectedRoute";
import Home from "@/features/posts/pages/Home";
import Posts from "@/features/posts/pages/Posts";
import PostDetail from "@/features/posts/pages/PostDetail";
import Login from "@/features/auth/pages/Login";
import AdminLayout from "@/features/admin/layout/AdminLayout";
import AdminProfile from "@/features/admin/pages/AdminProfile";
import AdminPostsList from "@/features/admin/pages/AdminPostsList";
import AdminPostEditor from "@/features/admin/pages/AdminPostEditor";
import AdminPortfolio from "@/features/admin/pages/AdminPortfolio";
import AdminSettings from "@/features/admin/pages/AdminSettings";
import Portfolio from "@/features/portfolio/pages/Portfolio";

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.POSTS} element={<Posts />} />
      <Route path={ROUTES.POST_DETAIL} element={<PostDetail />} />
      <Route path={ROUTES.PORTFOLIO} element={<Portfolio />} />
      <Route path={ROUTES.ADMIN_LOGIN} element={<Login />} />
      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="posts" element={<AdminPostsList />} />
        <Route path="posts/new" element={<AdminPostEditor />} />
        <Route path="posts/:id/edit" element={<AdminPostEditor />} />
        <Route path="portfolio" element={<AdminPortfolio />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}
