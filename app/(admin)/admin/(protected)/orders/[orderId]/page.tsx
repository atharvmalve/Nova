import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderDetail } from "@/components/admin/order-detail";
import { orderIdSchema } from "@/lib/validation/orders";
import { getAdminOrder } from "@/services/admin-orders";

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) { const { orderId } = await params; if (!orderIdSchema.safeParse(orderId).success) notFound(); const result = await getAdminOrder(orderId); if (!result.data && !result.error) notFound(); return <main className="mx-auto max-w-6xl p-5 sm:p-8"><Button render={<Link href="/admin/orders" />} variant="ghost"><ArrowLeft />Orders</Button>{result.error ? <div className="mt-6 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="size-5 shrink-0" />{result.error}</div> : result.data ? <OrderDetail order={result.data} /> : null}</main>; }
