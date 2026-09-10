import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseConfig } from "@/lib/supabase/config";

export function createClient() {
  const { key, url } = getPublicSupabaseConfig();
  return createBrowserClient(url, key);
}
