// 사이트 프로필 전역 상태 (사이드바·관리자 페이지 공유)
import { create } from "zustand";
import { fetchProfile } from "@/features/settings/api/profileApi";

export const useProfileStore = create((set) => ({
  profile: null,
  isLoading: false,
  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const item = await fetchProfile().catch(() => null);
      set({ profile: item, isLoading: false });
      return item;
    } catch (_error) {
      set({ profile: null, isLoading: false });
      return null;
    }
  },
}));
