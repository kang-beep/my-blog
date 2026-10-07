import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { resolvePostExcerpt } from "@/features/posts/utils/postDisplay";
import { getPostDetailPath } from "@/shared/constants/routes";
import { formatDate } from "@/shared/utils/date";

export default function PostsListItem({ post }) {
  const excerpt = resolvePostExcerpt(post);
  const category = post.category?.trim() ?? "";
  const linkTo = getPostDetailPath(post.id);

  return (
    <li>
      <Link to={linkTo} className="posts-list-row" aria-label={post.title ?? "Untitled"}>
        <div className="posts-list-row-body">
          <div className="posts-list-row-meta">
            <time className="tabular-nums">{formatDate(post.created_at)}</time>
            {category ? <span className="posts-list-row-category">{category}</span> : null}
          </div>

          <h3 className="posts-list-row-title">
            <span className="line-clamp-2">{post.title ?? "Untitled"}</span>
          </h3>

          {excerpt ? <p className="posts-list-row-excerpt line-clamp-2">{excerpt}</p> : null}
        </div>

        <ChevronRight className="posts-list-row-arrow" size={18} aria-hidden />
      </Link>
    </li>
  );
}
