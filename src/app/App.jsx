// 앱 루트 컴포넌트: 공통 레이아웃과 라우터를 조합
import AppRouter from "./router";
import Sidebar from "../shared/layout/Sidebar";

export default function App() {
  return (
    <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <main className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <AppRouter />
      </main>
    </div>
  );
}
