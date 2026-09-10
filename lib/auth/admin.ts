import "server-only";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminIdentity = {
  id: string;
  email: string | undefined;
  role: "admin" | "owner";
};

export class AdminAuthorizationError extends Error {
  constructor() {
    super("Administrator access is required.");
    this.name = "AdminAuthorizationError";
  }
}

export async function getCurrentAdmin(): Promise<AdminIdentity | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || (profile?.role !== "admin" && profile?.role !== "owner")) {
    return null;
  }

  return { id: user.id, email: user.email, role: profile.role };
}

export async function requireAdmin(): Promise<AdminIdentity> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin" && profile?.role !== "owner") {
    redirect("/?error=admin-required");
  }

  return { id: user.id, email: user.email, role: profile.role };
}

/** Use at the start of every future admin Server Action or Route Handler. */
export async function assertAdmin(): Promise<AdminIdentity> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    throw new AdminAuthorizationError();
  }

  return admin;
}
