import { supabase } from "@/shared/lib/supabaseClient";
import { formatDateTimeKst } from "@/shared/utils/date";
import {
  TREND_AI_DIGESTS_TABLE,
  TREND_AI_PERIODS,
  TREND_AI_SOURCES,
} from "@/features/trends/constants/trendAiDigests";

function mapDigest(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    source: row.source,
    period: row.period,
    fetchedDate: row.fetched_date,
    headline: row.headline ?? "",
    summary: row.summary ?? "",
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    model: row.model ?? "",
    promptVersion: row.prompt_version ?? "",
    updatedLabel: row.updated_at
      ? `${formatDateTimeKst(row.updated_at)} KST`
      : row.fetched_date ?? "",
  };
}

/**
 * Latest digest for one source + period (by fetched_date, then updated_at).
 */
export async function fetchLatestTrendAiDigest(
  source,
  period = TREND_AI_PERIODS.DAILY,
) {
  const { data, error } = await supabase
    .from(TREND_AI_DIGESTS_TABLE)
    .select(
      "id, fetched_date, source, period, headline, summary, keywords, model, prompt_version, updated_at, created_at",
    )
    .eq("source", source)
    .eq("period", period)
    .order("fetched_date", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return mapDigest(data);
}

export async function fetchHomeTrendAiDigests() {
  const [github, huggingface] = await Promise.all([
    fetchLatestTrendAiDigest(TREND_AI_SOURCES.GITHUB, TREND_AI_PERIODS.DAILY),
    fetchLatestTrendAiDigest(TREND_AI_SOURCES.HUGGINGFACE, TREND_AI_PERIODS.DAILY),
  ]);

  return { github, huggingface };
}

export async function fetchTrendsPageAiDigests() {
  const periods = [
    TREND_AI_PERIODS.DAILY,
    TREND_AI_PERIODS.WEEKLY,
    TREND_AI_PERIODS.MONTHLY,
  ];

  const pairs = await Promise.all(
    periods.flatMap((period) => [
      fetchLatestTrendAiDigest(TREND_AI_SOURCES.GITHUB, period).then((digest) => ({
        source: TREND_AI_SOURCES.GITHUB,
        period,
        digest,
      })),
      fetchLatestTrendAiDigest(TREND_AI_SOURCES.HUGGINGFACE, period).then((digest) => ({
        source: TREND_AI_SOURCES.HUGGINGFACE,
        period,
        digest,
      })),
    ]),
  );

  const github = {};
  const huggingface = {};
  for (const item of pairs) {
    if (item.source === TREND_AI_SOURCES.GITHUB) {
      github[item.period] = item.digest;
    } else {
      huggingface[item.period] = item.digest;
    }
  }

  return { github, huggingface };
}
