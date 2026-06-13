import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

export { isSupabaseConfigured };

export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
