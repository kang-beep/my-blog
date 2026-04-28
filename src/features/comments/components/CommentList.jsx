// 댓글 목록 표시 컴포넌트: 관리자 로그인 시 삭제 버튼 노출
import { formatDate } from "../../../shared/utils/date";

export default function CommentList({ comments = [], canDelete = false, onDelete }) {
  if (comments.length === 0) {
    return <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">첫 댓글을 남겨보세요.</p>;
  }

  return (
    <ul className="space-y-2">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="mb-1 text-sm">
            <strong>{comment.nickname}</strong>: {comment.content}
          </p>
          <p className="text-xs text-slate-500">{formatDate(comment.created_at)}</p>
          {canDelete ? (
            <button className="btn mt-2" type="button" onClick={() => onDelete?.(comment.id)}>
              삭제
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
