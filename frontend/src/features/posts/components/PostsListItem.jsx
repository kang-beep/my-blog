import PostListRow from "@/features/posts/components/PostListRow";

export default function PostsListItem({ post }) {
  return (
    <li className="px-3 py-3.5 sm:px-4">
      <PostListRow post={post} titleClassName="text-base font-semibold text-slate-900" showTags />
    </li>
  );
}