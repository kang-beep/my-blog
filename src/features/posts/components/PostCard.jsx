// 글 카드 컴포넌트: 목록/홈/관리자 화면에서 공통 재사용
import { Link } from "react-router-dom";
import { getPostDetailPath } from "../../../shared/constants/routes";
import TagBadge from "../../../shared/ui/TagBadge";
import { formatDate } from "../../../shared/utils/date";

export default function PostCard({ post, onTagClick }) {
  return (
    <article style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px" }}>
      <h3>
        <Link to={getPostDetailPath(post?.id)}>{post?.title ?? "제목 없음"}</Link>
      </h3>
      <p>{post?.category ?? "미분류"}</p>
      <p>{formatDate(post?.created_at)}</p>
      {post?.image_url ? (
        <img
          src={post.image_url}
          alt={post.title ?? "post"}
          style={{ maxWidth: "100%", borderRadius: "6px" }}
        />
      ) : null}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(post?.tags ?? []).map((tag) => (
          <TagBadge key={`${post?.id}-${tag}`} tag={tag} onClick={onTagClick} />
        ))}
      </div>
    </article>
  );
}
