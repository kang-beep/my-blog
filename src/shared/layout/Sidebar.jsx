// 공통 사이드바: 프로필/내비게이션/관리자 액션 표시
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import { useAuthStore } from "../../features/auth/store/authStore";
import { fetchProfile } from "../../features/settings/api/profileApi";

export default function Sidebar() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const item = await fetchProfile();
        setProfile(item);
      } catch (_error) {
        setProfile(null);
      }
    };
    void loadProfile();
  }, []);

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <img
          src={
            profile?.avatar_url ||
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80"
          }
          alt="profile"
          className="h-14 w-14 rounded-full object-cover"
        />
        <div>
          <h2 className="text-xl font-bold">kang-beep tech</h2>
          <p className="text-xs text-slate-500">{profile?.headline || "blog by kangsan"}</p>
        </div>
      </div>
      <nav className="space-y-2">
        <ul className="space-y-2">
          <li className="rounded-lg px-2 py-1 hover:bg-slate-100">
            <Link to={ROUTES.HOME}>홈</Link>
          </li>
          <li className="rounded-lg px-2 py-1 hover:bg-slate-100">
            <Link to={ROUTES.POSTS}>글 목록</Link>
          </li>
          <li className="rounded-lg px-2 py-1 hover:bg-slate-100">
            <Link to={ROUTES.PORTFOLIO}>포트폴리오</Link>
          </li>
          <li className="rounded-lg px-2 py-1 hover:bg-slate-100">
            <Link to={ROUTES.LOGIN}>{isAuthenticated ? "관리자 세션 유지 중" : "로그인"}</Link>
          </li>
        </ul>
      </nav>
      {isAuthenticated ? (
        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
          <Link className="btn w-full" to={ROUTES.WRITE}>
            + 새 글 작성
          </Link>
          <Link className="btn w-full" to={ROUTES.MANAGE}>
            프로필/설정 관리
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
