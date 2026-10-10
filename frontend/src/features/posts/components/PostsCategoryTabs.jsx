import { POSTS_CATEGORY_ALL } from "@/features/posts/constants/postsList";

const ALL_TAB_LABEL = "All";

function CategoryTab({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={isActive ? "chip chip-active" : "chip"}
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
