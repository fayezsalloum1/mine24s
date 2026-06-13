export function getSupabaseConfig() {
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
