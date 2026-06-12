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
      <label className="form-label">{label}</label>
      {children}
      {hint && !error && <p className="text-gray-500 text-xs mt-1">{hint}</p>}
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
    </div>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`form-input auth-input ${
        props["aria-invalid"] ? "border-red-500/60 ring-red-500/20" : ""
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
      className={`w-full py-3.5 btn-primary rounded-lg disabled:opacity-60 disabled:cursor-not-allowed ${props.className ?? ""}`}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

export function AuthPanel({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`auth-panel ${wide ? "max-w-lg" : "max-w-md"} mx-auto`}>
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
    info: "bg-blue-950/40 border-blue-500/30 text-blue-300",
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm mb-4 ${styles[type]}`}>{children}</div>
  );
}
