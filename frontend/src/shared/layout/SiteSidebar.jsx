// Desktop left rail only (open panel / collapsed toggle)
import { ChevronLeft, ChevronRight } from "lucide-react";
import SiteNavContent from "@/shared/layout/SiteNavContent";

function SidebarCollapsed({ onToggle }) {
  return (
    <div className="site-sidebar">
      <div className="site-sidebar-toolbar">
        <button
          type="button"
          className="site-sidebar-rail-toggle"
          aria-expanded={false}
          aria-controls="site-sidebar"
          aria-label="Open sidebar"
          onClick={onToggle}
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default function SiteSidebar({ isOpen, onToggle, onNavigate }) {
  if (!isOpen) {
    return <SidebarCollapsed onToggle={onToggle} />;
  }

  return (
    <div className="site-sidebar">
      <div className="site-sidebar-toolbar">
        <button
          type="button"
          className="site-sidebar-rail-toggle"
          aria-expanded
          aria-controls="site-sidebar"
          aria-label="Close sidebar"
          onClick={onToggle}
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
      </div>

      <SiteNavContent onNavigate={onNavigate} className="site-sidebar-body" />
    </div>
  );
}
