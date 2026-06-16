// 앱 루트: 고정 헤더 + 접을 수 있는 프로필 레일 + 본문
import { matchPath, useLocation } from "react-router-dom";
import AppRouter from "@/app/router";
import Header from "@/shared/layout/Header";
import ProfileSidebar from "@/shared/layout/ProfileSidebar";
import { ROUTES } from "@/shared/constants/routes";
import { useProfileSidebarOpen } from "@/shared/hooks/useProfileSidebarOpen";

export default function App() {
  const { isOpen: isProfileOpen, toggle: toggleProfileSidebar } = useProfileSidebarOpen();
  const location = useLocation();
  const isPostDetailPage = Boolean(
    matchPath({ path: ROUTES.POST_DETAIL, end: true }, location.pathname),
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
      <Header />
      <div
        className={`app-body flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:overflow-hidden ${
          isProfileOpen ? "app-body-sidebar-open" : "app-body-sidebar-closed"
        }`}
      >
        <ProfileSidebar isOpen={isProfileOpen} onToggle={toggleProfileSidebar} />
        <main
          className={`min-h-0 min-w-0 bg-white lg:overflow-y-auto ${
            isPostDetailPage ? "px-1 py-4 lg:px-2 lg:py-5" : "px-4 py-5 lg:px-8 lg:py-6"
          }`}
        >
          <AppRouter />
        </main>
      </div>
    </div>
  );
}
