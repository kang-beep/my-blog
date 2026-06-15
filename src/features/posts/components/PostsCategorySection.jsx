import { useState } from "react";
import { ChevronDown, Folder } from "lucide-react";
import PostsListItem from "@/features/posts/components/PostsListItem";

export default function PostsCategorySection({ category, posts, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="border border-slate-200">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Folder size={16} className="shrink-0 text-slate-400" aria-hidden />
          <span className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
              카테고리
            </span>
            <span className="flex items-baseline gap-2">
              <span className="font-semibold text-slate-900">{category}</span>
              <span className="text-sm text-slate-400">{posts.length}</span>
            </span>
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {isOpen ? (
        <ul className="border-t border-slate-100 bg-white pl-6 pr-4">
          {posts.map((post) => (
            <PostsListItem key={post.id} post={post} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
