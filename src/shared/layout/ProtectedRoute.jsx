// 관리자 전용 페이지 접근을 인증 상태로 제어하는 라우트 가드
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useAuthStore } from "../../features/auth/store/authStore";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthInitialized = useAuthStore((state) => state.isAuthInitialized);

  if (!isAuthInitialized) {
    return <p>인증 상태를 확인하는 중입니다...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return children;
}
