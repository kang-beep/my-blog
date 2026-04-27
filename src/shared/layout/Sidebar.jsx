// 공통 사이드바: 주요 라우트 이동과 로그인 상태에 따른 링크 표시
import { Link } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useAuthStore } from "../../features/auth/store/authStore";

export default function Sidebar() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <aside>
      <h2>Portfolio</h2>
      <p>개인 포트폴리오 미니 블로그</p>
      <nav>
        <ul>
          <li>
            <Link to={ROUTES.HOME}>홈</Link>
          </li>
          <li>
            <Link to={ROUTES.POSTS}>글 목록</Link>
          </li>
          <li>
            <Link to={isAuthenticated ? ROUTES.ADMIN : ROUTES.LOGIN}>
              {isAuthenticated ? "관리자" : "로그인"}
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
