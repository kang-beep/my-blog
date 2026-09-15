// UTC date string (YYYY-MM-DD) for fetched_date alignment with GitHub Actions
export function getUtcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}
