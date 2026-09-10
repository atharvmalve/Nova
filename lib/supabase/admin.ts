import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { getPublicSupabaseConfig } from "@/lib/supabase/config";

const serviceRoleSchema = z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required.");

/** Server-only client for payment/webhook operations that cannot use browser RLS. */
export function createAdminSupabaseClient() {
  const { url } = getPublicSupabaseConfig();
  const serviceRoleKey = serviceRoleSchema.parse(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
