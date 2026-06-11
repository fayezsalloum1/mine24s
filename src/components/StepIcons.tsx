export function RegisterIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="16" r="8" stroke="currentColor" strokeWidth="2" className="text-yellow-500" />
      <path d="M8 40c0-8 7-12 16-12s16 4 16 12" stroke="currentColor" strokeWidth="2" className="text-yellow-500" />
      <path d="M32 8l4 4 8-8" stroke="currentColor" strokeWidth="2" className="text-green-400" />
    </svg>
  );
}

export function DepositIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" className="text-yellow-500" />
      <path d="M24 18v12M18 24h12" stroke="currentColor" strokeWidth="2" className="text-green-400" />
    </svg>
  );
}

export function EarnIcon({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M8 36L20 24l8 8 12-16" stroke="currentColor" strokeWidth="2" className="text-green-400" />
      <path d="M32 16h8v8" stroke="currentColor" strokeWidth="2" className="text-green-400" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" className="text-yellow-500" />
    </svg>
  );
}
