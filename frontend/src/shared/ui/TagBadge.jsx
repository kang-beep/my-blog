// 태그 표시와 클릭 이벤트 확장을 위한 공용 뱃지 컴포넌트
export default function TagBadge({ tag, onClick, tone = "light" }) {
  const toneClass =
    tone === "dark"
      ? "border-white/20 bg-white/10 text-neutral-100 hover:border-white/30 hover:bg-white/15 hover:text-white"
      : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100";

  return (
    <button type="button" onClick={() => onClick?.(tag)} className={`chip border ${toneClass}`}>
      #{tag}
    </button>
  );
}
