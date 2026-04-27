// 로그인 세션 상태를 전역으로 관리하는 Zustand 스토어
import { create } from "zustand";

export const useAuthStore = create((set) => ({
  session: null,
  isAuthenticated: false,
  isAuthInitialized: false,
  setSession: (session) =>
    set({
      session,
      isAuthenticated: Boolean(session),
      isAuthInitialized: true,
    }),
  clearSession: () =>
    set({
      session: null,
      isAuthenticated: false,
      isAuthInitialized: true,
    }),
  markAuthInitialized: () =>
    set({
      isAuthInitialized: true,
    }),
}));
