import { requireAdmin } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { signOutAdmin } from "./actions";

export default async function AdminProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();
  return <div className="min-h-screen bg-muted/20"><AdminSidebar email={admin.email ?? admin.id} role={admin.role} signOut={signOutAdmin} /><div className="lg:pl-64">{children}</div></div>;
}
