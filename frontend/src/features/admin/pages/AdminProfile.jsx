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
      setSuccess("Profile saved.");
    } catch (requestError) {
      setError(requestError.message || "Could not save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Edit profile</h2>
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

      <form onSubmit={handleSubmit} className="card space-y-3">
        <div>
          <label className="label" htmlFor="display-name">Name</label>
          <input
            id="display-name"
            className="input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="headline">Headline</label>
          <input
            id="headline"
            className="input"
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="avatar">Profile image</label>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Current profile"
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
          <label className="label" htmlFor="email">Email</label>
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
          {isSaving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}
