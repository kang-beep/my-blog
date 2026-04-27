// 앱 루트 컴포넌트: 공통 레이아웃과 라우터를 조합
import AppRouter from "./router";
import Sidebar from "../shared/layout/Sidebar";

export default function App() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px" }}>
      <Sidebar />
      <main>
        <AppRouter />
      </main>
    </div>
  );
}
