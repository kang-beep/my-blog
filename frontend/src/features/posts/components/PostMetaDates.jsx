import { formatDateTime, getMostRecentDate } from "@/shared/utils/date";

export default function PostMetaDates({ createdAt, updatedAt, labeled = false }) {
  const recentDate = getMostRecentDate(createdAt, updatedAt);
  const dateLabel = formatDateTime(recentDate);

  if (!dateLabel) {
    return null;
  }

  if (!labeled) {
    return <time className="text-sm tabular-nums text-slate-400">{dateLabel}</time>;
  }

  return (
    <p className="post-meta-inline-item">
      <span className="post-meta-inline-label">Date:</span>{" "}
      <time className="post-meta-inline-value tabular-nums" dateTime={recentDate}>
        {dateLabel}
      </time>
    </p>
  );
}
