// 태그 표시와 클릭 이벤트 확장을 위한 공용 뱃지 컴포넌트
export default function TagBadge({ tag, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(tag)}
      className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
    >
      #{tag}
    </button>
  );
}
