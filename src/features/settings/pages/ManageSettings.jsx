// 관리자 설정 페이지: 프로필/카테고리/포트폴리오 관리 진입
import { useEffect, useState } from "react";
import { signOut } from "../../auth/api/authApi";
import { useAuthStore } from "../../auth/store/authStore";
import {
  fetchProfile,
  upsertProfile,
  uploadProfileImage,
} from "../api/profileApi";
import {
  createCategory,
  fetchCategories,
} from "../../categories/api/categoryApi";

export default function ManageSettings() {
  const clearSession = useAuthStore((state) => state.clearSession);
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    try {
      const [profileItem, categoryItems] = await Promise.all([
        fetchProfile().catch(() => null),
        fetchCategories().catch(() => []),
      ]);
      setProfile(profileItem);
      setCategories(categoryItems);
      setDisplayName(profileItem?.display_name ?? "");
      setHeadline(profileItem?.headline ?? "");
      setBio(profileItem?.bio ?? "");
      setGithubUrl(profileItem?.github_url ?? "");
    } catch (requestError) {
      setError(requestError.message || "설정 정보를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      let avatarUrl = profile?.avatar_url ?? null;
      if (avatarFile) {
        avatarUrl = await uploadProfileImage(avatarFile);
      }
      await upsertProfile({
        id: profile?.id ?? crypto.randomUUID(),
        display_name: displayName,
        headline,
        bio,
        github_url: githubUrl,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });
      await load();
      setAvatarFile(null);
    } catch (requestError) {
      setError(requestError.message || "프로필 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = async (event) => {
    event.preventDefault();
    if (!newCategory.trim()) {
      return;
    }
    try {
      const created = await createCategory(newCategory.trim());
      setCategories((prev) => [...prev, created]);
      setNewCategory("");
    } catch (requestError) {
      setError(requestError.message || "카테고리 추가에 실패했습니다.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      clearSession();
    } catch (requestError) {
      setError(requestError.message || "로그아웃에 실패했습니다.");
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1>관리자 설정</h1>
        <button className="btn" type="button" onClick={handleSignOut}>
          로그아웃
        </button>
      </div>
      {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p> : null}

      <form onSubmit={handleSaveProfile} className="card space-y-3">
        <h2>프로필 관리</h2>
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
          <label className="label" htmlFor="bio">소개</label>
          <textarea
            id="bio"
            className="input min-h-24"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="github-url">GitHub URL</label>
          <input
            id="github-url"
            className="input"
            value={githubUrl}
            onChange={(event) => setGithubUrl(event.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="avatar">프로필 이미지</label>
          <input
            id="avatar"
            className="input"
            type="file"
            accept="image/*"
            onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={isSaving}>
          {isSaving ? "저장 중..." : "프로필 저장"}
        </button>
      </form>

      <section className="card space-y-3">
        <h2>카테고리 관리</h2>
        <form className="flex gap-2" onSubmit={handleAddCategory}>
          <input
            className="input"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="새 카테고리 이름"
          />
          <button className="btn btn-primary" type="submit">
            추가
          </button>
        </form>
        <ul className="space-y-2">
          {categories.map((item) => (
            <li key={item.id} className="rounded-lg bg-slate-100 px-3 py-2 text-sm">
              {item.name}
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
