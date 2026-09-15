// Top header: brand, navigation, sign out
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { signOut } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/features/auth/store/authStore";
import { ADMIN_NAV, PUBLIC_NAV, SITE_NAME } from "@/shared/constants/navigation";
import { ROUTES } from "@/shared/constants/routes";
import HeaderNavLink from "@/shared/ui/HeaderNavLink";

export default function Header() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [signOutError, setSignOutError] = useState("");

  const handleSignOut = async () => {
    setSignOutError("");
    try {
      await signOut();
      clearSession();
    } catch (requestError) {
      setSignOutError(requestError.message || "Failed to sign out.");
    }
  };

  return (
    <header className="site-header shrink-0">
      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 lg:pl-4">
        <NavLink to={ROUTES.HOME} end className="header-brand-link shrink-0">
          {SITE_NAME}
        </NavLink>

        <nav className="flex flex-wrap items-center gap-1">
          {PUBLIC_NAV.map((item) => (
            <HeaderNavLink key={item.to} {...item} />
          ))}

          {isAuthenticated ? (
            <>
              <span className="mx-1 h-4 w-px bg-neutral-800" aria-hidden />
              <span className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Admin
              </span>
              {ADMIN_NAV.map((item) => (
                <HeaderNavLink key={item.to} {...item} />
              ))}
            </>
          ) : null}
        </nav>

        {isAuthenticated ? (
          <button className="btn-header-ghost ml-auto shrink-0" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        ) : null}
      </div>

      {signOutError ? <p className="px-4 pb-2 text-sm text-rose-400">{signOutError}</p> : null}
    </header>
  );
}
