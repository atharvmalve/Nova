import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type OrderSuccessSummary = { orderNumber: string; customerName: string; totalPaise: number; paymentStatus: string; itemCount: number };

export async function getOrderSuccessSummary(orderId: string): Promise<OrderSuccessSummary | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("orders").select("order_number, customer_name, total_paise, payment_status, order_items(quantity)").eq("id", orderId).maybeSingle();
  if (error || !data) return null;
  const order = data as unknown as { order_number: string; customer_name: string; total_paise: number; payment_status: string; order_items: Array<{ quantity: number }> };
  return { orderNumber: order.order_number, customerName: order.customer_name, totalPaise: order.total_paise, paymentStatus: order.payment_status, itemCount: order.order_items.reduce((total, item) => total + item.quantity, 0) };
}
