import { AdminLoginForm } from "./admin-login-form";

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { next } = await searchParams;
  const destination = typeof next === "string" ? next : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted p-6">
      <section className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use an account assigned the admin or owner role.</p>
        <div className="mt-6"><AdminLoginForm next={destination} /></div>
      </section>
    </main>
  );
}
