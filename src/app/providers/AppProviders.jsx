// 앱 시작 시 인증 세션 복원/구독을 처리하는 전역 Provider 래퍼
import { useEffect } from "react";
import {
  getSession,
  subscribeAuthState,
} from "../../features/auth/api/authApi";
import { useAuthStore } from "../../features/auth/store/authStore";

export default function AppProviders({ children }) {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const markAuthInitialized = useAuthStore((state) => state.markAuthInitialized);

  useEffect(() => {
    let isMounted = true;

    const initializeSession = async () => {
      try {
        const session = await getSession();
        if (!isMounted) {
          return;
        }
        if (session) {
          setSession(session);
        } else {
          clearSession();
        }
      } catch (_error) {
        if (isMounted) {
          clearSession();
          markAuthInitialized();
        }
      }
    };

    void initializeSession();

    const subscription = subscribeAuthState((session) => {
      if (session) {
        setSession(session);
      } else {
        clearSession();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, clearSession, markAuthInitialized]);

  return children;
}
