import { formatDateTime, getMostRecentDate } from "@/shared/utils/date";

export default function PostMetaDates({ createdAt, updatedAt }) {
  const recentDate = getMostRecentDate(createdAt, updatedAt);
  const dateLabel = formatDateTime(recentDate);

  if (!dateLabel) {
    return null;
  }

  return <p className="text-xs text-slate-500">{dateLabel}</p>;
}
