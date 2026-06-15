// Profile rail: mobile edge bars, desktop top-right toggle inside panel
import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Mail,
} from "lucide-react";
import { ICON_SIZE, ICON_STROKE } from "@/shared/constants/navigation";
import { useProfileStore } from "@/features/settings/store/profileStore";

function getProfileInitials(profile) {
  const source = profile?.display_name?.trim() || profile?.headline?.trim() || "KB";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function MobileProfileToggle({ isOpen, onToggle }) {
  return (
    <button
      type="button"
      className={
        isOpen
          ? "profile-sidebar-toggle profile-sidebar-toggle-collapse lg:hidden"
          : "profile-sidebar-toggle profile-sidebar-toggle-expand lg:hidden"
      }
      aria-expanded={isOpen}
      aria-controls="profile-sidebar"
      aria-label={isOpen ? "Hide profile" : "Show profile"}
      onClick={onToggle}
    >
      {isOpen ? (
        <>
          <ChevronUp size={16} aria-hidden />
          <span className="text-xs font-medium text-slate-600">Hide profile</span>
        </>
      ) : (
        <>
          <ChevronDown size={16} aria-hidden />
          <span className="text-xs font-medium text-slate-600">Profile</span>
        </>
      )}
    </button>
  );
}

function DesktopProfileToggle({ isOpen, onToggle }) {
  return (
    <button
      type="button"
      className="btn hidden shrink-0 px-2 py-1.5 lg:inline-flex"
      aria-expanded={isOpen}
      aria-controls="profile-sidebar"
      aria-label={isOpen ? "Hide profile" : "Show profile"}
      onClick={onToggle}
    >
      {isOpen ? <ChevronLeft size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
    </button>
  );
}

export default function ProfileSidebar({ isOpen, onToggle }) {
  const profile = useProfileStore((state) => state.profile);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [profile?.avatar_url]);

  const displayName = profile?.display_name?.trim() || "kangsan";
  const headline = profile?.headline?.trim();
  const email = profile?.email?.trim();
  const hasBio = Boolean(profile?.bio?.trim());
  const showAvatar = profile?.avatar_url && !avatarLoadFailed;
  const hasFooter = Boolean(profile?.github_url?.trim() || email);

  if (!isOpen) {
    return (
      <div className="profile-sidebar-shell profile-sidebar-shell-closed min-w-0">
        <div className="profile-sidebar-closed-inner">
          <DesktopProfileToggle isOpen={false} onToggle={onToggle} />
        </div>
        <MobileProfileToggle isOpen={false} onToggle={onToggle} />
      </div>
    );
  }

  return (
    <div className="profile-sidebar-shell profile-sidebar-shell-open min-w-0">
      <aside
        id="profile-sidebar"
        className="profile-sidebar-panel flex min-h-0 min-w-0 flex-1 flex-col border-b border-slate-200 bg-white lg:border-b-0"
      >
        <div className="hidden shrink-0 justify-end px-2 pt-2 lg:flex">
          <DesktopProfileToggle isOpen onToggle={onToggle} />
        </div>

        <div className="flex flex-col items-center overflow-hidden px-4 py-4 text-center lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:px-3 lg:pt-0">
          {showAvatar ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100 lg:h-14 lg:w-14"
              onError={() => setAvatarLoadFailed(true)}
            />
          ) : (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-base font-semibold text-indigo-700 ring-2 ring-indigo-50 lg:h-14 lg:w-14 lg:text-sm"
              aria-hidden
            >
              {getProfileInitials(profile)}
            </div>
          )}

          <h2 className="mt-3 text-lg font-bold text-slate-900 lg:text-base">{displayName}</h2>

          {headline ? <p className="mt-1 text-sm text-slate-500">{headline}</p> : null}

          {hasBio ? (
            <div className="mt-3 w-full border-t border-slate-100 pt-3">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">
                {profile.bio.trim()}
              </p>
            </div>
          ) : null}
        </div>

        {hasFooter ? (
          <div className="mt-auto flex flex-col items-center gap-2 border-t border-slate-100 px-3 py-3">
            {profile?.github_url?.trim() ? (
              <a
                href={profile.github_url}
                target="_blank"
                rel="noreferrer"
                className="btn w-full gap-2"
              >
                <ExternalLink size={ICON_SIZE} strokeWidth={ICON_STROKE} aria-hidden />
                GitHub
              </a>
            ) : null}
            {email ? (
              <p className="flex items-center gap-2 text-xs text-slate-600">
                <Mail size={ICON_SIZE} strokeWidth={ICON_STROKE} className="shrink-0" aria-hidden />
                <span className="break-all">{email}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </aside>

      <MobileProfileToggle isOpen onToggle={onToggle} />
    </div>
  );
}
