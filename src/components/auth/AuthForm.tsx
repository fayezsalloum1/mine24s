"use client";

type AuthFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

export function AuthField({ label, error, hint, children }: AuthFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-slate-500 text-xs mt-1">{hint}</p>}
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 rounded-xl bg-slate-950/70 border text-white placeholder-slate-500 transition-all focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 ${
        props["aria-invalid"] ? "border-red-500/60" : "border-slate-700/80 hover:border-slate-600"
      } ${props.className ?? ""}`}
    />
  );
}

export function AuthButton({
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`w-full py-3.5 btn-primary rounded-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none ${props.className ?? ""}`}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

export function AuthPanel({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`relative glass-panel p-6 sm:p-10 rounded-2xl w-full shadow-panel ${
        wide ? "max-w-lg" : "max-w-md"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />
      <div className="absolute -top-px left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
      {children}
    </div>
  );
}

export function AuthAlert({
  type,
  children,
}: {
  type: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error: "bg-red-950/40 border-red-500/30 text-red-300",
    success: "bg-emerald-950/40 border-emerald-500/30 text-emerald-300",
    info: "bg-cyan-950/40 border-cyan-500/30 text-cyan-300",
  };
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm mb-4 ${styles[type]}`}>{children}</div>
  );
}
