export default function PlanCardSkeleton() {
  return (
    <div className="plan-card animate-pulse">
      <div className="h-48 bg-gray-700/80" />
      <div className="p-6 space-y-3">
        <div className="h-5 bg-gray-700 rounded w-2/3" />
        <div className="h-4 bg-gray-700/80 rounded w-full" />
        <div className="h-4 bg-gray-700/80 rounded w-4/5" />
        <div className="h-10 bg-gray-700 rounded mt-4" />
      </div>
    </div>
  );
}
