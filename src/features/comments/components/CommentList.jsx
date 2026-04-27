// 댓글 목록 표시 컴포넌트: 관리자 로그인 시 삭제 버튼 노출
import { formatDate } from "../../../shared/utils/date";

export default function CommentList({ comments = [], canDelete = false, onDelete }) {
  if (comments.length === 0) {
    return <p>첫 댓글을 남겨보세요.</p>;
  }

  return (
    <ul>
      {comments.map((comment) => (
        <li key={comment.id}>
          <strong>{comment.nickname}</strong>: {comment.content}
          <p>{formatDate(comment.created_at)}</p>
          {canDelete ? (
            <button type="button" onClick={() => onDelete?.(comment.id)}>
              삭제
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
