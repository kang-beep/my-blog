// Mobile top bar: brand + toggle; expands downward as header panel
import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { SITE_NAME } from "@/shared/constants/navigation";
import { ROUTES } from "@/shared/constants/routes";
import SiteNavContent from "@/shared/layout/SiteNavContent";

export default function MobileSiteHeader({ isOpen, onToggle, onNavigate }) {
  return (
    <header className="site-mobile-header lg:hidden">
      <div className="site-mobile-header-bar">
        <NavLink to={ROUTES.HOME} end className="header-brand-link shrink-0" onClick={onNavigate}>
          {SITE_NAME}
        </NavLink>
        <button
          type="button"
          className="btn-header-ghost shrink-0 rounded-none px-2.5 py-2"
          aria-expanded={isOpen}
          aria-controls="site-mobile-menu"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          onClick={onToggle}
        >
          {isOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
      </div>

      <div
        id="site-mobile-menu"
        className={`site-mobile-menu-panel ${isOpen ? "site-mobile-menu-panel-open" : ""}`}
        aria-hidden={!isOpen}
        inert={isOpen ? undefined : true}
      >
        <div className="site-mobile-menu-panel-inner">
          <SiteNavContent onNavigate={onNavigate} className="site-mobile-menu-content" />
        </div>
      </div>
    </header>
  );
}
