export default function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="plan-card p-8 sm:p-10 text-center">
      {icon && (
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-3xl mb-4">
          {icon}
        </div>
      )}
      <p className="text-slate-200 font-semibold">{title}</p>
      {description && <p className="text-slate-500 text-sm mt-2 leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
