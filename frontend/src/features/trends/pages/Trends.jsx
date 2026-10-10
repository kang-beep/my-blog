// Trends: AI briefs from trend_ai_digests + browse original HF/GH feeds
import { useEffect, useState } from "react";
import GithubTrendingReposList from "@/features/github/trending-repos/components/GithubTrendingReposList";
import HuggingFaceDailyPapersList from "@/features/huggingface/daily-papers/components/HuggingFaceDailyPapersList";
import { fetchTrendsPageAiDigests } from "@/features/trends/api/trendAiDigestApi";
import { TREND_AI_SOURCES } from "@/features/trends/constants/trendAiDigests";
import TrendAiBriefCard from "@/features/trends/components/TrendAiBriefCard";

export default function Trends() {
  const [githubDigest, setGithubDigest] = useState(null);
  const [huggingfaceDigest, setHuggingfaceDigest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDigests = async () => {
      setIsLoading(true);
      setError("");
      try {
        const digests = await fetchTrendsPageAiDigests();
        setGithubDigest(digests.github);
        setHuggingfaceDigest(digests.huggingface);
      } catch (requestError) {
        setError(requestError.message || "Failed to load AI briefs.");
        setGithubDigest(null);
        setHuggingfaceDigest(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDigests();
  }, []);

  return (
    <div className="trends-page space-y-10">
      <section className="space-y-4">
        <div className="trends-section-heading">
          <div className="min-w-0 space-y-1">
            <h2 className="trends-section-title">Monthly AI Briefs</h2>
            <p className="trends-section-note">AI analysis from monthly trending data</p>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
        ) : null}

        <div className="trends-briefs-grid">
          <TrendAiBriefCard
            source={TREND_AI_SOURCES.GITHUB}
            digest={githubDigest}
            isLoading={isLoading}
          />
          <TrendAiBriefCard
            source={TREND_AI_SOURCES.HUGGINGFACE}
            digest={huggingfaceDigest}
            isLoading={isLoading}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="trends-section-heading">
          <div className="min-w-0 space-y-1">
            <h2 className="trends-section-title">Browse Trends</h2>
            <p className="trends-section-note">Raw data by period</p>
          </div>
        </div>
        <div className="trends-browse-grid">
          <GithubTrendingReposList />
          <HuggingFaceDailyPapersList />
        </div>
      </section>
    </div>
  );
}
