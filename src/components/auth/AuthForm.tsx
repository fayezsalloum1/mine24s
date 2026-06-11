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
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
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
      className={`w-full px-4 py-3 rounded-lg bg-gray-950/80 border text-white placeholder-gray-500 transition-colors focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 ${
        props["aria-invalid"] ? "border-red-500/60" : "border-gray-700 hover:border-gray-600"
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
      className={`w-full py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 transition-all ${props.className ?? ""}`}
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
      className={`relative bg-gray-900/95 border border-gray-800 p-8 sm:p-10 rounded-2xl w-full shadow-2xl shadow-black/40 ${
        wide ? "max-w-lg" : "max-w-md"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600" />
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
    error: "bg-red-950/50 border-red-500/40 text-red-300",
    success: "bg-green-950/50 border-green-500/40 text-green-300",
    info: "bg-blue-950/50 border-blue-500/40 text-blue-300",
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm mb-4 ${styles[type]}`}>{children}</div>
  );
}
