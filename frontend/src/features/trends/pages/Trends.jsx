// Trends: GitHub and Hugging Face each own period tabs + AI brief + feed list in one card
import { useEffect, useState } from "react";
import { fetchTrendsPageAiDigests } from "@/features/trends/api/trendAiDigestApi";
import { TREND_AI_SOURCES } from "@/features/trends/constants/trendAiDigests";
import TrendSourcePanel from "@/features/trends/components/TrendSourcePanel";

export default function Trends() {
  const [githubByPeriod, setGithubByPeriod] = useState({});
  const [huggingfaceByPeriod, setHuggingfaceByPeriod] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDigests = async () => {
      setIsLoading(true);
      setError("");
      try {
        const digests = await fetchTrendsPageAiDigests();
        setGithubByPeriod(digests.github ?? {});
        setHuggingfaceByPeriod(digests.huggingface ?? {});
      } catch (requestError) {
        setError(requestError.message || "Failed to load AI briefs.");
        setGithubByPeriod({});
        setHuggingfaceByPeriod({});
      } finally {
        setIsLoading(false);
      }
    };

    void loadDigests();
  }, []);

  return (
    <div className="trends-page space-y-6">
      <div className="trends-section-heading">
        <div className="min-w-0 space-y-1">
          <h2 className="trends-section-title">Trends</h2>
          <p className="trends-section-note">
            Each source has its own period tabs. AI brief and list stay together.
          </p>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
      ) : null}

      <div className="trends-source-grid">
        <TrendSourcePanel
          source={TREND_AI_SOURCES.GITHUB}
          digestsByPeriod={githubByPeriod}
          isDigestLoading={isLoading}
        />
        <TrendSourcePanel
          source={TREND_AI_SOURCES.HUGGINGFACE}
          digestsByPeriod={huggingfaceByPeriod}
          isDigestLoading={isLoading}
        />
      </div>
    </div>
  );
}
