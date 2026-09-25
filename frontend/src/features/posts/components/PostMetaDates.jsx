import { formatDateTime, getMostRecentDate } from "@/shared/utils/date";

export default function PostMetaDates({ createdAt, updatedAt }) {
  const recentDate = getMostRecentDate(createdAt, updatedAt);
  const dateLabel = formatDateTime(recentDate);

  if (!dateLabel) {
    return null;
  }

  return <time className="text-sm tabular-nums text-slate-400">{dateLabel}</time>;
}
