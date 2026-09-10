"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import { fulfillmentStatusSchema, orderIdSchema } from "@/lib/validation/orders";
import { updateAdminFulfillment } from "@/services/admin-orders";

export async function updateFulfillment(orderId: string, status: string) { try { await assertAdmin(); if (!orderIdSchema.safeParse(orderId).success) return { error: "Invalid order." }; const parsed = fulfillmentStatusSchema.safeParse(status); if (!parsed.success) return { error: "Invalid fulfillment status." }; await updateAdminFulfillment(orderId, parsed.data); revalidatePath(`/admin/orders/${orderId}`); revalidatePath("/admin/orders"); return { success: "Fulfillment status updated." }; } catch (error) { return { error: error instanceof Error ? error.message : "Unable to update fulfillment." }; } }
