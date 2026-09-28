// App root: desktop left sidebar / mobile header dropdown
import { matchPath, useLocation } from "react-router-dom";
import AppRouter from "@/app/router";
import MobileSiteHeader from "@/shared/layout/MobileSiteHeader";
import SiteSidebar from "@/shared/layout/SiteSidebar";
import { ROUTES } from "@/shared/constants/routes";
import { useProfileSidebarOpen } from "@/shared/hooks/useProfileSidebarOpen";

export default function App() {
  const { isOpen, toggle, close, closeIfMobile } = useProfileSidebarOpen();
  const location = useLocation();
  const isPostDetailPage = Boolean(
    matchPath({ path: ROUTES.POST_DETAIL, end: true }, location.pathname),
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 lg:flex-row">
      <MobileSiteHeader isOpen={isOpen} onToggle={toggle} onNavigate={close} />

      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close menu"
          onClick={close}
        />
      ) : null}

      <aside
        id="site-sidebar"
        className={`site-sidebar-shell hidden lg:flex ${
          isOpen ? "site-sidebar-shell-open" : "site-sidebar-shell-closed"
        }`}
      >
        <SiteSidebar isOpen={isOpen} onToggle={toggle} onNavigate={closeIfMobile} />
      </aside>

      <main
        className={`min-h-0 min-w-0 flex-1 overflow-y-auto bg-white ${
          isPostDetailPage ? "px-1 py-4 lg:px-2 lg:py-5" : "px-4 py-5 lg:px-8 lg:py-6"
        }`}
      >
        <AppRouter />
      </main>
    </div>
  );
}
