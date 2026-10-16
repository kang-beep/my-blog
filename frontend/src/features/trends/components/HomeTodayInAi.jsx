// Home Today in Trend: AI headline + daily feed highlights (full brief on /trends)
import { useEffect, useState } from "react";
import { fetchGithubTrendingRepos } from "@/features/github/trending-repos/api/githubTrendingReposApi";
import { fetchHuggingFaceDailyPapers } from "@/features/huggingface/daily-papers/api/huggingfaceDailyPapersApi";
import { HUGGINGFACE_PAPER_BASE_URL } from "@/features/huggingface/daily-papers/constants/huggingfaceDailyPapers";
import { HOME_TREND_HIGHLIGHT_LIMIT } from "@/features/posts/constants/home";
import { fetchHomeTrendAiDigests } from "@/features/trends/api/trendAiDigestApi";
import HomeTrendPreviewCard from "@/features/trends/components/HomeTrendPreviewCard";
import { formatDateTimeKst } from "@/shared/utils/date";

function mapGithubHighlights(repos) {
  return repos.slice(0, HOME_TREND_HIGHLIGHT_LIMIT).map((repo) => ({
    id: repo.id ?? repo.url,
    title: repo.title ?? "Untitled",
    description: repo.description?.trim() || "",
    href: repo.url,
  }));
}

function mapHuggingFaceHighlights(papers) {
  return papers.slice(0, HOME_TREND_HIGHLIGHT_LIMIT).map((paper) => ({
    id: paper.id ?? paper.paper_id,
    title: paper.title ?? "Untitled",
    description: paper.summary?.trim() || "",
    metric: typeof paper.upvotes === "number" ? `▲ ${paper.upvotes}` : "",
    href: `${HUGGINGFACE_PAPER_BASE_URL}/${paper.paper_id}`,
  }));
}

function resolveUpdatedLabel(syncedAt) {
  if (!syncedAt) {
    return "—";
  }
  return `${formatDateTimeKst(syncedAt)} KST`;
}

export default function HomeTodayInAi() {
  const [githubHighlights, setGithubHighlights] = useState([]);
  const [huggingfaceHighlights, setHuggingfaceHighlights] = useState([]);
  const [githubHeadline, setGithubHeadline] = useState("");
  const [huggingfaceHeadline, setHuggingfaceHeadline] = useState("");
  const [githubModel, setGithubModel] = useState("");
  const [huggingfaceModel, setHuggingfaceModel] = useState("");
  const [githubUpdatedLabel, setGithubUpdatedLabel] = useState("—");
  const [huggingfaceUpdatedLabel, setHuggingfaceUpdatedLabel] = useState("—");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHighlights = async () => {
      setIsLoading(true);
      try {
        const [githubResult, huggingfaceResult, digests] = await Promise.all([
          fetchGithubTrendingRepos("daily"),
          fetchHuggingFaceDailyPapers("daily"),
          fetchHomeTrendAiDigests(),
        ]);

        if (githubResult.repos.length > 0) {
          setGithubHighlights(mapGithubHighlights(githubResult.repos));
          setGithubUpdatedLabel(resolveUpdatedLabel(githubResult.syncedAt));
        } else {
          setGithubHighlights([]);
          setGithubUpdatedLabel("—");
        }

        if (huggingfaceResult.papers.length > 0) {
          setHuggingfaceHighlights(mapHuggingFaceHighlights(huggingfaceResult.papers));
          setHuggingfaceUpdatedLabel(resolveUpdatedLabel(huggingfaceResult.syncedAt));
        } else {
          setHuggingfaceHighlights([]);
          setHuggingfaceUpdatedLabel("—");
        }

        setGithubHeadline(digests.github?.headline ?? "");
        setHuggingfaceHeadline(digests.huggingface?.headline ?? "");
        setGithubModel(digests.github?.model ?? "");
        setHuggingfaceModel(digests.huggingface?.model ?? "");
      } catch {
        setGithubHighlights([]);
        setHuggingfaceHighlights([]);
        setGithubHeadline("");
        setHuggingfaceHeadline("");
        setGithubModel("");
        setHuggingfaceModel("");
      } finally {
        setIsLoading(false);
      }
    };

    void loadHighlights();
  }, []);

  return (
    <div className="home-ai-grid">
      <HomeTrendPreviewCard
        source="github"
        title="GitHub Trending Today"
        headline={githubHeadline}
        model={githubModel}
        updatedLabel={githubUpdatedLabel}
        highlights={githubHighlights}
        isLoading={isLoading}
      />
      <HomeTrendPreviewCard
        source="huggingface"
        title="Hugging Face Papers Today"
        headline={huggingfaceHeadline}
        model={huggingfaceModel}
        updatedLabel={huggingfaceUpdatedLabel}
        highlights={huggingfaceHighlights}
        isLoading={isLoading}
      />
    </div>
  );
}
