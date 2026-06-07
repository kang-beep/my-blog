// 관리자 공통 레이아웃: 하위 페이지 Outlet
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <section className="space-y-4">
      <Outlet />
    </section>
  );
}
