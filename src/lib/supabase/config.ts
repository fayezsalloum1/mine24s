export function getSupabaseConfig() {
  const combined = process.env.SUPABASE_PUBLIC?.trim();
  if (combined) {
    const [url = "", anonKey = ""] = combined.split("|").map((part) => part.trim());
    if (url && anonKey) return { url, anonKey };
  }

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    "";

  return { url, anonKey };
}

/** Server routes only. Falls back to service role key for temporary testing. */
export function getServerSupabaseConfig() {
  const base = getSupabaseConfig();
  if (base.url && base.anonKey) return base;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && serviceKey) return { url, anonKey: serviceKey };

  return { url: "", anonKey: "" };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getServerSupabaseConfig();
  return Boolean(url && anonKey);
}
