import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import PostListThumbnail from "@/features/posts/components/PostListThumbnail";
import {
  resolvePostExcerpt,
  resolvePostThumbnailUrl,
} from "@/features/posts/utils/postDisplay";
import { getPostDetailPath } from "@/shared/constants/routes";
import { formatDate } from "@/shared/utils/date";

export default function HomePostListItem({ post }) {
  const thumbnailUrl = resolvePostThumbnailUrl(post);
  const excerpt = resolvePostExcerpt(post);
  const category = post.category?.trim() ?? "";
  const linkTo = getPostDetailPath(post.id);

  return (
    <Link to={linkTo} className="home-post-card" aria-label={post.title ?? "Untitled"}>
      <PostListThumbnail src={thumbnailUrl} />

      <div className="home-post-card-body">
        <div className="home-post-card-meta">
          <time className="tabular-nums">{formatDate(post.created_at)}</time>
          {category ? <span className="home-post-card-category">{category}</span> : null}
        </div>

        <h3 className="home-post-card-title">
          <span className="line-clamp-2">{post.title ?? "Untitled"}</span>
        </h3>

        {excerpt ? <p className="home-post-card-excerpt line-clamp-2">{excerpt}</p> : null}
      </div>

      <ChevronRight className="home-post-card-arrow" size={18} aria-hidden />
    </Link>
  );
}
