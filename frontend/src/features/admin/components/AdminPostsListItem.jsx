import PostListRow from "@/features/posts/components/PostListRow";
import { getAdminPostEditPath } from "@/shared/constants/routes";
import {
  POST_STATUS_DRAFT,
  POST_STATUS_LABELS,
  POST_STATUS_PUBLISHED,
} from "@/shared/constants/postStatus";

export default function AdminPostsListItem({ post }) {
  const isDraft = post.status === POST_STATUS_DRAFT;
  const statusLabel = POST_STATUS_LABELS[post.status] ?? POST_STATUS_LABELS[POST_STATUS_PUBLISHED];

  return (
    <li className="px-3 py-3.5 sm:px-4">
      <PostListRow
        post={post}
        to={getAdminPostEditPath(post.id)}
        titleClassName="font-bold text-slate-900"
        showTags
        statusLabel={statusLabel}
        statusTone={isDraft ? "draft" : "published"}
      />
    </li>
  );
}
