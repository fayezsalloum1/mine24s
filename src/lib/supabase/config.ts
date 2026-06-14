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

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}
