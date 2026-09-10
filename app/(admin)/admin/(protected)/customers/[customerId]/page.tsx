import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CustomerDetail } from "@/components/admin/customer-detail";
import { customerIdSchema } from "@/lib/validation/customers";
import { getAdminCustomer } from "@/services/admin-customers";
export default async function CustomerPage({ params }: { params: Promise<{ customerId: string }> }) { const { customerId } = await params; if (!customerIdSchema.safeParse(customerId).success) notFound(); const result = await getAdminCustomer(customerId); if (!result.data && !result.error) notFound(); return <main className="mx-auto max-w-6xl p-5 sm:p-8"><Button render={<Link href="/admin/customers" />} variant="ghost"><ArrowLeft />Customers</Button>{result.error ? <div className="mt-6 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="size-5 shrink-0" />{result.error}</div> : result.data ? <CustomerDetail customer={result.data} /> : null}</main>; }
