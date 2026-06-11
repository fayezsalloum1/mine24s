"use client";

type AuthFieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

export function AuthField({ label, error, children }: AuthFieldProps) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 ${props.className ?? ""}`}
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
      className={`w-full p-3 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${props.className ?? ""}`}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}

export function AuthPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl w-full max-w-md shadow-xl">
      {children}
    </div>
  );
}
