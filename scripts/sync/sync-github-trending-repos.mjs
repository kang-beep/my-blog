import { XMLParser } from "fast-xml-parser";
import {
  clearRowsForDate,
  createServiceSupabaseClient,
  deleteRowsBeforeDate,
  getUtcDateString,
  insertRows,
  shouldSkipDelete,
} from "./_supabase.mjs";

const TABLE_NAME = "github_trending_repos";
const RSS_FEEDS = {
  daily: "https://mshibanami.github.io/GitHubTrendingRSS/daily/all.xml",
  weekly: "https://mshibanami.github.io/GitHubTrendingRSS/weekly/all.xml",
  monthly: "https://mshibanami.github.io/GitHubTrendingRSS/monthly/all.xml",
};

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

function normalizeItems(items) {
  if (!items) {
    return [];
  }

  return Array.isArray(items) ? items : [items];
}

function mapTrendingRow(item, period, fetchedDate) {
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const url = typeof item.link === "string" ? item.link.trim() : "";
  const description =
    typeof item.description === "string" ? item.description.trim() : null;

  if (!title || !url) {
    return null;
  }

  return {
    title,
    url,
    description: description || null,
    period,
    fetched_date: fetchedDate,
  };
}

async function fetchRssItems(period) {
  const feedUrl = RSS_FEEDS[period];
  const response = await fetch(feedUrl);

  if (!response.ok) {
    throw new Error(`RSS fetch failed for ${period} (${response.status})`);
  }

  const xml = await response.text();
  const parsed = xmlParser.parse(xml);
  const items = normalizeItems(parsed?.rss?.channel?.item);

  return items;
}

async function syncPeriod(supabase, period, fetchedDate) {
  const items = await fetchRssItems(period);
  const rows = items
    .map((item) => mapTrendingRow(item, period, fetchedDate))
    .filter(Boolean);

  await clearRowsForDate(supabase, TABLE_NAME, {
    fetched_date: fetchedDate,
    period,
  });
  await insertRows(supabase, TABLE_NAME, rows);

  if (!shouldSkipDelete()) {
    await deleteRowsBeforeDate(supabase, TABLE_NAME, fetchedDate, { period });
  }

  console.log(`Synced ${rows.length} GitHub trending repos (${period}) for ${fetchedDate}.`);
}

function resolvePeriods() {
  const selectedPeriod = process.env.PERIOD ?? "all";

  if (selectedPeriod === "all") {
    return ["daily", "weekly", "monthly"];
  }

  if (!RSS_FEEDS[selectedPeriod]) {
    throw new Error(`Invalid PERIOD value: ${selectedPeriod}`);
  }

  return [selectedPeriod];
}

async function main() {
  const supabase = createServiceSupabaseClient();
  const fetchedDate = getUtcDateString();
  const periods = resolvePeriods();
  const failures = [];

  for (const period of periods) {
    try {
      await syncPeriod(supabase, period, fetchedDate);
    } catch (error) {
      failures.push(`${period}: ${error.message}`);
      console.error(`Skipped ${period}: ${error.message}`);
    }
  }

  if (failures.length === periods.length) {
    throw new Error(failures.join(" | "));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
