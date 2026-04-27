// 태그 표시와 클릭 이벤트 확장을 위한 공용 뱃지 컴포넌트
export default function TagBadge({ tag, onClick }) {
  return (
    <button type="button" onClick={() => onClick?.(tag)}>
      #{tag}
    </button>
  );
}
