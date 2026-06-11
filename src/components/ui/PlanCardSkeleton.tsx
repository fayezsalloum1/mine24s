export default function PlanCardSkeleton() {
  return (
    <div className="plan-card animate-pulse">
      <div className="h-40 sm:h-48 bg-slate-800/60" />
      <div className="p-5 sm:p-6 space-y-3">
        <div className="h-5 bg-slate-700/80 rounded-lg w-2/3" />
        <div className="h-4 bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-800 rounded w-4/5" />
        <div className="h-11 bg-slate-700/60 rounded-xl mt-4" />
      </div>
    </div>
  );
}
