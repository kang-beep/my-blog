// 공통 사이드바: 주요 라우트 이동과 로그인 상태에 따른 링크 표시
import { Link } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useAuthStore } from "../../features/auth/store/authStore";

export default function Sidebar() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-2xl font-bold">Portfolio</h2>
      <p className="mb-4 text-sm text-slate-600">blog by kangsan</p>
      <nav className="space-y-2">
        <ul className="space-y-2">
          <li className="rounded-lg px-2 py-1 hover:bg-slate-100">
            <Link to={ROUTES.HOME}>홈</Link>
          </li>
          <li className="rounded-lg px-2 py-1 hover:bg-slate-100">
            <Link to={ROUTES.POSTS}>글 목록</Link>
          </li>
          <li className="rounded-lg px-2 py-1 hover:bg-slate-100">
            <Link to={isAuthenticated ? ROUTES.ADMIN : ROUTES.LOGIN}>
              {isAuthenticated ? "관리자" : "로그인"}
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
