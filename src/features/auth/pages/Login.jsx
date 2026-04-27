// 관리자 로그인 페이지: 이메일/비밀번호 인증 처리
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { signInWithEmail } from "../api/authApi";
import { useAuthStore } from "../store/authStore";
import { ROUTES } from "../../../shared/constants/routes";

export default function Login() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useAuthStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    const redirectPath = location.state?.from?.pathname ?? ROUTES.ADMIN;
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const session = await signInWithEmail({ email, password });
      setSession(session);
    } catch (requestError) {
      setError(requestError.message || "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <h1>관리자 로그인</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? <p>{error}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </section>
  );
}
