const SKELETON_ITEM_COUNT = 5;

function HuggingFaceDailyPaperSkeletonItem() {
  return (
    <li className="animate-pulse space-y-3 py-5 first:pt-0 last:pb-0">
      <div className="h-5 w-3/4 rounded bg-slate-200" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-11/12 rounded bg-slate-100" />
        <div className="h-3 w-4/5 rounded bg-slate-100" />
      </div>
      <div className="flex gap-2">
        <div className="h-4 w-14 rounded bg-slate-100" />
        <div className="h-4 w-20 rounded bg-slate-100" />
        <div className="h-4 w-16 rounded bg-slate-100" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-24 rounded bg-slate-100" />
        <div className="h-8 w-20 rounded bg-slate-100" />
      </div>
    </li>
  );
}

export default function HuggingFaceDailyPapersSkeleton() {
  return (
    <ul className="divide-y divide-slate-100" aria-hidden>
      {Array.from({ length: SKELETON_ITEM_COUNT }, (_, index) => (
        <HuggingFaceDailyPaperSkeletonItem key={`huggingface-daily-paper-skeleton-${index}`} />
      ))}
    </ul>
  );
}
