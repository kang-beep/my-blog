// 프로필 전용 사이드바: DB profiles 데이터 표시 (왼쪽 레일)
import { useEffect, useState } from "react";
import { ExternalLink, Mail } from "lucide-react";
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

export default function ProfileSidebar() {
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

  return (
    <aside className="flex shrink-0 flex-col border-b border-slate-200 bg-white lg:h-full lg:w-[280px] lg:min-h-0 lg:border-b-0 lg:border-r">
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-5 text-center">
        {showAvatar ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-slate-100"
            onError={() => setAvatarLoadFailed(true)}
          />
        ) : (
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-semibold text-indigo-700 ring-2 ring-indigo-50"
            aria-hidden
          >
            {getProfileInitials(profile)}
          </div>
        )}

        <h2 className="mt-4 text-xl font-bold text-slate-900">{displayName}</h2>

        {headline ? (
          <p className="mt-1 text-sm text-slate-500">{headline}</p>
        ) : null}

        {hasBio ? (
          <div className="mt-4 w-full border-t border-slate-100 pt-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {profile.bio.trim()}
            </p>
          </div>
        ) : null}
      </div>

      {hasFooter ? (
        <div className="mt-auto flex flex-col items-center gap-3 border-t border-slate-100 px-4 py-4">
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
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Mail size={ICON_SIZE} strokeWidth={ICON_STROKE} className="shrink-0" aria-hidden />
              <span className="break-all">{email}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
