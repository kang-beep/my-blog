// 관리자 프로필 수정 페이지
import { useEffect, useState } from "react";
import {
  uploadProfileImage,
  upsertProfile,
} from "@/features/settings/api/profileApi";
import { useProfileStore } from "@/features/settings/store/profileStore";

export default function AdminProfile() {
  const profile = useProfileStore((state) => state.profile);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const item = await loadProfile();
      setDisplayName(item?.display_name ?? "");
      setHeadline(item?.headline ?? "");
      setGithubUrl(item?.github_url ?? "");
      setEmail(item?.email ?? "");
    };
    void init();
  }, [loadProfile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      let avatarUrl = profile?.avatar_url ?? null;
      if (avatarFile) {
        avatarUrl = await uploadProfileImage(avatarFile);
      }
      await upsertProfile({
        id: profile?.id ?? crypto.randomUUID(),
        display_name: displayName,
        headline,
        github_url: githubUrl,
        email,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });
      await loadProfile();
      setAvatarFile(null);
      setSuccess("프로필이 저장되었습니다.");
    } catch (requestError) {
      setError(requestError.message || "프로필 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">프로필 수정</h2>
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

      <form onSubmit={handleSubmit} className="card space-y-3">
        <div>
          <label className="label" htmlFor="display-name">이름</label>
          <input
            id="display-name"
            className="input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="headline">한 줄 소개</label>
          <input
            id="headline"
            className="input"
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="avatar">프로필 이미지</label>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="현재 프로필"
              className="mb-2 h-20 w-20 rounded-full object-cover"
            />
          ) : null}
          <input
            id="avatar"
            className="input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className="label" htmlFor="github-url">GitHub URL</label>
          <input
            id="github-url"
            className="input"
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
            placeholder="https://github.com/username"
          />
        </div>
        <div>
          <label className="label" htmlFor="email">이메일</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={isSaving}>
          {isSaving ? "저장 중..." : "프로필 저장"}
        </button>
      </form>
    </section>
  );
}
