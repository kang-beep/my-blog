import { getUtcDateString } from "@/shared/utils/utcDate";

export async function fetchRowsForTodayOrLatest(supabase, table, fetchRowsForDate, latestDateFilters = {}) {
  const today = getUtcDateString();
  const todayRows = await fetchRowsForDate(today);

  if (todayRows.length > 0) {
    return {
      rows: todayRows,
      fetchedDate: today,
      isStale: false,
    };
  }

  let latestQuery = supabase
    .from(table)
    .select("fetched_date")
    .order("fetched_date", { ascending: false })
    .limit(1);

  for (const [column, value] of Object.entries(latestDateFilters)) {
    latestQuery = latestQuery.eq(column, value);
  }

  const { data: latestRow, error: latestError } = await latestQuery.maybeSingle();
  if (latestError) {
    throw new Error(latestError.message);
  }

  const latestDate = latestRow?.fetched_date;
  if (!latestDate || latestDate === today) {
    return {
      rows: [],
      fetchedDate: today,
      isStale: false,
    };
  }

  const latestRows = await fetchRowsForDate(latestDate);
  return {
    rows: latestRows,
    fetchedDate: latestDate,
    isStale: true,
  };
}
