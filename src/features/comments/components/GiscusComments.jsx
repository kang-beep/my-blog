// 글별 GitHub Discussions 댓글 (Giscus)
import Giscus from "@giscus/react";
import { GISCUS_CONFIG } from "@/shared/constants/giscus";

export default function GiscusComments({ postId }) {
  if (!postId) {
    return null;
  }

  return (
    <Giscus
      key={postId}
      repo={GISCUS_CONFIG.repo}
      repoId={GISCUS_CONFIG.repoId}
      category={GISCUS_CONFIG.category}
      categoryId={GISCUS_CONFIG.categoryId}
      mapping={GISCUS_CONFIG.mapping}
      term={postId}
      strict={GISCUS_CONFIG.strict}
      reactionsEnabled={GISCUS_CONFIG.reactionsEnabled}
      emitMetadata={GISCUS_CONFIG.emitMetadata}
      inputPosition={GISCUS_CONFIG.inputPosition}
      theme={GISCUS_CONFIG.theme}
      lang={GISCUS_CONFIG.lang}
      loading="lazy"
    />
  );
}
