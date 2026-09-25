import { POSTS_CATEGORY_ALL } from "@/features/posts/constants/postsList";

const ALL_TAB_LABEL = "전체";

function CategoryTab({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={
        isActive
          ? "shrink-0 rounded-full bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white shadow-sm"
          : "shrink-0 rounded-full bg-slate-100 px-3.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
      }
    >
      {label}
    </button>
  );
}

export default function PostsCategoryTabs({ categories, selectedCategory, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Post categories">
      <CategoryTab
        label={ALL_TAB_LABEL}
        isActive={selectedCategory === POSTS_CATEGORY_ALL}
        onClick={() => onSelect(POSTS_CATEGORY_ALL)}
      />
      {categories.map((category) => (
        <CategoryTab
          key={category}
          label={category}
          isActive={selectedCategory === category}
          onClick={() => onSelect(category)}
        />
      ))}
    </div>
  );
}
