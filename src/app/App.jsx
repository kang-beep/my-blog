// 앱 루트 컴포넌트: 고정 헤더·왼쪽 프로필 레일 + 스크롤 가능 본문
import AppRouter from "@/app/router";
import Header from "@/shared/layout/Header";
import ProfileSidebar from "@/shared/layout/ProfileSidebar";

export default function App() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ProfileSidebar />
        <main className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5 lg:px-8 lg:py-6">
          <AppRouter />
        </main>
      </div>
    </div>
  );
}
