import { z } from "zod";

const publicSupabaseConfigSchema = z.object({
  url: z.url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL."),
  key: z.string().min(1, "A Supabase publishable or anon key is required."),
});

export function getPublicSupabaseConfig() {
  return publicSupabaseConfigSchema.parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
