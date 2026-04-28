// 글 카드 컴포넌트: 목록/홈/관리자 화면에서 공통 재사용
import { Link } from "react-router-dom";
import { getPostDetailPath } from "../../../shared/constants/routes";
import TagBadge from "../../../shared/ui/TagBadge";
import { formatDate } from "../../../shared/utils/date";

export default function PostCard({ post, onTagClick }) {
  return (
    <article className="card space-y-2">
      <h3 className="leading-snug">
        <Link className="font-semibold" to={getPostDetailPath(post?.id)}>
          {post?.title ?? "제목 없음"}
        </Link>
      </h3>
      <p className="text-sm text-slate-600">{post?.category ?? "미분류"}</p>
      <p className="text-xs text-slate-500">{formatDate(post?.created_at)}</p>
      {post?.image_url ? (
        <img
          src={post.image_url}
          alt={post.title ?? "post"}
          className="max-h-64 w-full rounded-lg object-cover"
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        {(post?.tags ?? []).map((tag) => (
          <TagBadge key={`${post?.id}-${tag}`} tag={tag} onClick={onTagClick} />
        ))}
      </div>
    </article>
  );
}
