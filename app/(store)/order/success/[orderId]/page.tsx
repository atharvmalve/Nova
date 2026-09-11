import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { verifyOrderSuccessToken } from "@/lib/razorpay/server";
import { getOrderSuccessSummary } from "@/services/orders";
import { formatCurrency } from "@/src/lib/currency";

type SuccessPageProps = { params: Promise<{ orderId: string }> };

export default async function OrderSuccessPage({ params }: SuccessPageProps) {
  const { orderId } = await params;
  const cookieStore = await cookies();
  if (!verifyOrderSuccessToken(cookieStore.get("nova-order-success")?.value, orderId)) notFound();
  const order = await getOrderSuccessSummary(orderId);
  if (!order || order.paymentStatus !== "captured") notFound();
  return <main className="mx-auto flex w-full max-w-2xl flex-1 items-center px-5 py-16 sm:px-8"><section className="w-full rounded-2xl border bg-muted/20 p-7 text-center sm:p-10"><CheckCircle2 className="mx-auto size-12 text-emerald-600" /><p className="mt-5 text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Payment received</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Thank you, {order.customerName.split(" ")[0]}.</h1><p className="mt-3 text-sm text-muted-foreground">Your order has been confirmed.</p><div className="mt-8 grid gap-3 border-y py-5 text-left text-sm sm:grid-cols-3"><p><span className="block text-xs text-muted-foreground">Order</span><span className="font-semibold">{order.orderNumber}</span></p><p><span className="block text-xs text-muted-foreground">Items</span><span className="font-semibold">{order.itemCount}</span></p><p><span className="block text-xs text-muted-foreground">Paid</span><span className="font-semibold">{formatPrice(order.totalPaise)}</span></p></div><Button className="mt-7" render={<Link href="/shop" />}>Continue shopping</Button></section></main>;
}

function formatPrice(paise: number) { return formatCurrency(paise); }
