import { formatDateTime, isSameMinute } from "@/shared/utils/date";

export default function PostMetaDates({ createdAt, updatedAt }) {
  const createdLabel = formatDateTime(createdAt);
  const showUpdated = updatedAt && !isSameMinute(createdAt, updatedAt);
  const updatedLabel = showUpdated ? formatDateTime(updatedAt) : "";

  if (!createdLabel && !updatedLabel) {
    return null;
  }

  return (
    <div className="space-y-0.5 text-xs text-slate-500">
      {createdLabel ? <p>작성 {createdLabel}</p> : null}
      {updatedLabel ? <p>수정 {updatedLabel}</p> : null}
    </div>
  );
}
