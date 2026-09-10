"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminLoginState = {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  next: z.string().optional(),
});

export async function signInAdmin(
  prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  let redirectUrl: string | null = null;

  try {
    const rawData = {
      email: formData.get("email"),
      password: formData.get("password"),
      next: formData.get("next"),
    };

    const validated = loginSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        fieldErrors: validated.error.flatten().fieldErrors,
      };
    }

    const { email, password, next } = validated.data;
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate credentials with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Keep credential failures generic, but surface the one actionable Auth
      // state that does not reveal whether a different account exists.
      if (authError.code === "email_not_confirmed") {
        return { error: "Confirm this account's email address before signing in." };
      }

      if (authError.code === "invalid_api_key") {
        return { error: "Admin sign-in is not configured correctly." };
      }

      return { error: "Invalid email or password." };
    }

   // 2. Verify admin/owner role in public.profiles
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", authData.user.id)
  .maybeSingle();

console.log("[DEBUG] Auth User ID:", authData.user?.id);
console.log("[DEBUG] Returned Profile:", profile);
console.log("[DEBUG] Supabase Query Error:", profileError);

if (profileError || !profile || !["admin", "owner"].includes(profile.role?.trim())) {
  console.log("[DEBUG] Access Denied Details:", {
    hasError: !!profileError,
    profileFound: !!profile,
    rawRole: profile?.role,
    roleMatched: profile ? ["admin", "owner"].includes(profile.role?.trim()) : false,
  });

  await supabase.auth.signOut();
  return { error: "You do not have administrative access." };
}

    // 3. Prepare redirect path (preventing external open redirects)
    redirectUrl = next && next.startsWith("/") ? next : "/admin";

  } catch {
    // If redirectUrl was already set, rethrow or allow execution to fall through
    return { error: "An unexpected error occurred. Please try again." };
  }

  // MUST be called outside the try...catch block
  if (redirectUrl) {
    redirect(redirectUrl);
  }

  return {};
}
