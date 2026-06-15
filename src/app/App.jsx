// 앱 루트: 고정 헤더 + 접을 수 있는 프로필 레일(2) + 본문(8)
import AppRouter from "@/app/router";
import Header from "@/shared/layout/Header";
import ProfileSidebar from "@/shared/layout/ProfileSidebar";
import { useProfileSidebarOpen } from "@/shared/hooks/useProfileSidebarOpen";

export default function App() {
  const { isOpen: isProfileOpen, toggle: toggleProfileSidebar } = useProfileSidebarOpen();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
      <Header />
      <div
        className={`app-body flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:overflow-hidden ${
          isProfileOpen ? "app-body-sidebar-open" : "app-body-sidebar-closed"
        }`}
      >
        <ProfileSidebar isOpen={isProfileOpen} onToggle={toggleProfileSidebar} />
        <main className="min-h-0 min-w-0 bg-white px-4 py-5 lg:overflow-y-auto lg:px-8 lg:py-6">
          <AppRouter />
        </main>
      </div>
    </div>
  );
}
