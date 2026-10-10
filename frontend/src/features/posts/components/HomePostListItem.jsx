import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { resolvePostExcerpt } from "@/features/posts/utils/postDisplay";
import { getPostDetailPath } from "@/shared/constants/routes";
import { formatDate } from "@/shared/utils/date";

export default function HomePostListItem({ post }) {
  const excerpt = resolvePostExcerpt(post);
  const category = post.category?.trim() ?? "";
  const linkTo = getPostDetailPath(post.id);

  return (
    <Link to={linkTo} className="home-post-card" aria-label={post.title ?? "Untitled"}>
      <div className="home-post-card-body">
        <div className="home-post-card-meta">
          {category ? <span className="home-post-card-category">{category}</span> : null}
          {category ? <span aria-hidden>·</span> : null}
          <time className="tabular-nums">{formatDate(post.created_at)}</time>
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
