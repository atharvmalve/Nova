import { requireAdmin } from "@/lib/auth/admin";

export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <p className="mt-2 text-muted-foreground">Signed in as {admin.email ?? admin.id}.</p>
    </main>
  );
}
