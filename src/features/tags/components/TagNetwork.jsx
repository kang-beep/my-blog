// 홈 태그 네트워크 + 바로 아래 최신 글
import { Link } from "react-router-dom";
import HomeLatestPosts from "@/features/posts/components/HomeLatestPosts";
import { ROUTES } from "@/shared/constants/routes";
import { useTags } from "@/features/tags/hooks/useTags";
import TagForceGraph from "@/features/tags/components/TagForceGraph";

export default function TagNetwork({ latestPosts = [], latestPostsLoading = false, latestPostsError = "" }) {
  const { nodes, edges, isLoading, error } = useTags();

  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold text-slate-900">태그 네트워크</h1>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5">
        {isLoading ? <p className="text-sm text-slate-500">태그 데이터를 불러오는 중입니다...</p> : null}
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
            <span className="mt-1 block text-xs text-rose-500">
              Supabase에 migrate_create_tag_network.sql을 실행했는지 확인하세요.
            </span>
          </p>
        ) : null}
        {!isLoading && !error ? <TagForceGraph nodes={nodes} edges={edges} /> : null}
      </div>

      <div className="border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-900">최신 글</h2>
          <Link className="btn shrink-0" to={ROUTES.POSTS}>
            전체 보기
          </Link>
        </div>
        {latestPostsLoading ? (
          <p className="px-4 pb-6 text-sm text-slate-500 sm:px-6">글을 불러오는 중입니다...</p>
        ) : null}
        {latestPostsError ? (
          <p className="mx-4 mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 sm:mx-6">
            {latestPostsError}
          </p>
        ) : null}
        {!latestPostsLoading && !latestPostsError ? <HomeLatestPosts posts={latestPosts} /> : null}
      </div>
    </section>
  );
}
