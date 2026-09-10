import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();
  return children;
}
