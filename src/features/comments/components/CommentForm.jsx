// 익명 댓글 입력 컴포넌트: 상위에서 전달한 제출 핸들러를 호출
import { useState } from "react";

export default function CommentForm({ onSubmit }) {
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedNickname = nickname.trim();
    const trimmedContent = content.trim();
    if (!trimmedNickname || !trimmedContent) {
      setError("닉네임과 댓글 내용을 모두 입력하세요.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit?.({ nickname: trimmedNickname, content: trimmedContent });
      setContent("");
    } catch (submitError) {
      setError(submitError.message || "댓글 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="닉네임"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        required
      />
      <textarea
        placeholder="댓글 내용"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        required
      />
      {error ? <p>{error}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "등록 중..." : "댓글 등록"}
      </button>
    </form>
  );
}
