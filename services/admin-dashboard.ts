import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminDashboard = {
  revenuePaise: number;
  orderCount: number;
  customerCount: number;
  activeProductCount: number;
  recentOrders: Array<{ id: string; orderNumber: string; customerName: string; totalPaise: number; paymentStatus: string; orderStatus: string; createdAt: string }>;
  inventory: Array<{ id: string; title: string; inventoryQuantity: number; isOutOfStock: boolean }>;
  outOfStockCount: number;
};

export type AdminDashboardResult = { data: AdminDashboard; error: string | null };

const emptyDashboard: AdminDashboard = { revenuePaise: 0, orderCount: 0, customerCount: 0, activeProductCount: 0, recentOrders: [], inventory: [], outOfStockCount: 0 };

export async function getAdminDashboard(): Promise<AdminDashboardResult> {
  try {
    const supabase = await createServerSupabaseClient();
    const [paidOrders, orderCount, customerCount, productCount, recentOrders, inventory, outOfStock] = await Promise.all([
      supabase.from("orders").select("total_paise").eq("payment_status", "captured"),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("orders").select("id, order_number, customer_name, total_paise, payment_status, status, created_at").order("created_at", { ascending: false }).limit(8),
      supabase.from("products").select("id, title, inventory_quantity").eq("track_inventory", true).lte("inventory_quantity", 5).order("inventory_quantity", { ascending: true }).limit(8),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("track_inventory", true).eq("inventory_quantity", 0),
    ]);
    if (paidOrders.error || orderCount.error || customerCount.error || productCount.error || recentOrders.error || inventory.error || outOfStock.error) return { data: emptyDashboard, error: "Unable to load dashboard data." };
    return {
      data: {
        revenuePaise: (paidOrders.data ?? []).reduce((total, order) => total + Number(order.total_paise), 0),
        orderCount: orderCount.count ?? 0, customerCount: customerCount.count ?? 0, activeProductCount: productCount.count ?? 0,
        recentOrders: (recentOrders.data ?? []).map((order) => ({ id: order.id, orderNumber: order.order_number, customerName: order.customer_name, totalPaise: Number(order.total_paise), paymentStatus: order.payment_status, orderStatus: order.status, createdAt: order.created_at })),
        inventory: (inventory.data ?? []).map((product) => ({ id: product.id, title: product.title, inventoryQuantity: product.inventory_quantity, isOutOfStock: product.inventory_quantity === 0 })),
        outOfStockCount: outOfStock.count ?? 0,
      }, error: null,
    };
  } catch { return { data: emptyDashboard, error: "Unable to load dashboard data." }; }
}
