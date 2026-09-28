// Shared nav body: profile + links + social (desktop rail / mobile header panel)
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { LogOut, Mail } from "lucide-react";
import { signOut } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useProfileStore } from "@/features/settings/store/profileStore";
import {
  ADMIN_NAV,
  ICON_SIZE,
  ICON_STROKE,
  PUBLIC_NAV,
} from "@/shared/constants/navigation";
import GithubMarkIcon from "@/shared/ui/GithubMarkIcon";

function getProfileInitials(profile) {
  const source = profile?.display_name?.trim() || profile?.headline?.trim() || "KB";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function SidebarNavLink({ to, end, label, icon: Icon, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        isActive ? "site-sidebar-nav-link site-sidebar-nav-link-active" : "site-sidebar-nav-link"
      }
    >
      <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
      <span>{label}</span>
    </NavLink>
  );
}

function SidebarProfile({ profile, avatarLoadFailed, onAvatarError }) {
  const displayName = profile?.display_name?.trim() || "kangsan";
  const headline = profile?.headline?.trim();
  const showAvatar = profile?.avatar_url && !avatarLoadFailed;

  return (
    <div className="site-sidebar-profile">
      {showAvatar ? (
        <img
          src={profile.avatar_url}
          alt={displayName}
          className="site-sidebar-avatar"
          onError={onAvatarError}
        />
      ) : (
        <div className="site-sidebar-avatar site-sidebar-avatar-fallback" aria-hidden>
          {getProfileInitials(profile)}
        </div>
      )}
      <div className="site-sidebar-profile-text">
        <h2 className="site-sidebar-name">{displayName}</h2>
        {headline ? <p className="site-sidebar-headline">{headline}</p> : null}
      </div>
    </div>
  );
}

function getGithubUsername(githubUrl) {
  if (!githubUrl) {
    return "";
  }

  try {
    const parsed = new URL(githubUrl.startsWith("http") ? githubUrl : `https://${githubUrl}`);
    const pathPart = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/")[0];
    if (pathPart) {
      return pathPart;
    }
  } catch {
    // Fall through to raw string handling.
  }

  const withoutHost = githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//i, "");
  return withoutHost.split(/[/?#]/)[0] || githubUrl;
}

function SidebarSocial({ githubUrl, email }) {
  if (!githubUrl && !email) {
    return null;
  }

  const githubId = getGithubUsername(githubUrl);

  return (
    <div className="site-sidebar-social">
      {githubUrl ? (
        <a
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
          className="site-sidebar-social-link"
        >
          <GithubMarkIcon size={18} aria-hidden />
          <span className="site-sidebar-social-label">{githubId || "GitHub"}</span>
        </a>
      ) : null}
      {email ? (
        <a href={`mailto:${email}`} className="site-sidebar-social-link">
          <Mail size={18} strokeWidth={ICON_STROKE} aria-hidden />
          <span className="site-sidebar-social-label">{email}</span>
        </a>
      ) : null}
    </div>
  );
}

export default function SiteNavContent({ onNavigate, className = "site-sidebar" }) {
  const profile = useProfileStore((state) => state.profile);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [profile?.avatar_url]);

  const handleSignOut = async () => {
    setSignOutError("");
    try {
      await signOut();
      clearSession();
      onNavigate?.();
    } catch (requestError) {
      setSignOutError(requestError.message || "Failed to sign out.");
    }
  };

  return (
    <div className={className}>
      <SidebarProfile
        profile={profile}
        avatarLoadFailed={avatarLoadFailed}
        onAvatarError={() => setAvatarLoadFailed(true)}
      />

      <nav className="site-sidebar-nav" aria-label="Site">
        {PUBLIC_NAV.map((item) => (
          <SidebarNavLink key={item.to} {...item} onNavigate={onNavigate} />
        ))}

        {isAuthenticated ? (
          <>
            <p className="site-sidebar-admin-label">Admin</p>
            {ADMIN_NAV.map((item) => (
              <SidebarNavLink key={item.to} {...item} onNavigate={onNavigate} />
            ))}
            <button type="button" className="site-sidebar-nav-link" onClick={handleSignOut}>
              <LogOut size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
              <span>Sign out</span>
            </button>
          </>
        ) : null}
      </nav>

      {signOutError ? <p className="site-sidebar-error">{signOutError}</p> : null}

      <SidebarSocial githubUrl={profile?.github_url?.trim()} email={profile?.email?.trim()} />
    </div>
  );
}
