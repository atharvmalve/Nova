import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

import { getRazorpayClient, getRazorpayKeyId, verifyCheckoutSignature, verifyWebhookSignature } from "@/lib/razorpay/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const checkoutSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.email().trim().toLowerCase(),
    phone: z.string().trim().min(7).max(24),
  }),
  shippingAddress: z.object({
    recipientName: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(7).max(24),
    addressLine1: z.string().trim().min(1).max(240),
    addressLine2: z.string().trim().max(240).optional(),
    city: z.string().trim().min(1).max(100),
    state: z.string().trim().min(1).max(100),
    postalCode: z.string().trim().min(3).max(20),
    country: z.string().trim().min(1).max(100).default("India"),
  }),
  items: z.array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(50),
});

const paymentVerificationSchema = z.object({
  razorpayOrderId: z.string().min(1).max(128),
  razorpayPaymentId: z.string().min(1).max(128),
  razorpaySignature: z.string().regex(/^[a-f0-9]{64}$/i),
});

export type CheckoutRequest = z.infer<typeof checkoutSchema>;
export type PaymentVerification = z.infer<typeof paymentVerificationSchema>;

type ProductForCheckout = { id: string; title: string; sku: string | null; price_paise: number; inventory_quantity: number; track_inventory: boolean };
type PaymentRecord = { id: string; order_id: string; razorpay_order_id: string | null; status: string };

export class PaymentServiceError extends Error {
  constructor(message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "PaymentServiceError";
  }
}

export function parseCheckoutRequest(input: unknown): CheckoutRequest {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) throw new PaymentServiceError("Invalid checkout information.");
  return parsed.data;
}

export function parsePaymentVerification(input: unknown): PaymentVerification {
  const parsed = paymentVerificationSchema.safeParse(input);
  if (!parsed.success) throw new PaymentServiceError("Invalid payment verification response.");
  return parsed.data;
}

export async function createRazorpayCheckoutOrder(input: CheckoutRequest) {
  const admin = createAdminSupabaseClient();
  const quantities = new Map<string, number>();
  input.items.forEach(({ productId, quantity }) => quantities.set(productId, (quantities.get(productId) ?? 0) + quantity));
  const productIds = [...quantities.keys()];
  const { data, error } = await admin
    .from("products")
    .select("id, title, sku, price_paise, inventory_quantity, track_inventory")
    .in("id", productIds)
    .eq("status", "active");

  if (error || !data || data.length !== productIds.length) throw new PaymentServiceError("One or more products are unavailable.");
  const products = data as unknown as ProductForCheckout[];
  const productsById = new Map(products.map((product) => [product.id, product]));
  let subtotalPaise = 0;

  for (const [productId, quantity] of quantities) {
    const product = productsById.get(productId);
    if (!product) throw new PaymentServiceError("One or more products are unavailable.");
    if (product.track_inventory && quantity > product.inventory_quantity) throw new PaymentServiceError(`${product.title} does not have enough stock.`);
    subtotalPaise += product.price_paise * quantity;
  }

  if (subtotalPaise <= 0) throw new PaymentServiceError("The order total must be greater than zero.");
  const { customer, shippingAddress } = input;
  const { data: customerRecord, error: customerError } = await admin
    .from("customers")
    .insert({ name: customer.name, email: customer.email, phone: customer.phone })
    .select("id")
    .single();
  if (customerError || !customerRecord) throw new PaymentServiceError("Unable to create the order.", 500);

  const orderNumber = `NVA-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_id: customerRecord.id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_address: shippingAddress,
      status: "created",
      payment_status: "pending",
      subtotal_paise: subtotalPaise,
      total_paise: subtotalPaise,
    })
    .select("id")
    .single();
  if (orderError || !order) throw new PaymentServiceError("Unable to create the order.", 500);

  const orderItems = [...quantities].map(([productId, quantity]) => {
    const product = productsById.get(productId)!;
    return { order_id: order.id, product_id: product.id, product_title: product.title, sku: product.sku, unit_price_paise: product.price_paise, quantity, total_paise: product.price_paise * quantity };
  });
  const { error: itemsError } = await admin.from("order_items").insert(orderItems);
  if (itemsError) throw new PaymentServiceError("Unable to create the order.", 500);

  try {
    const razorpayOrder = await getRazorpayClient().orders.create({ amount: subtotalPaise, currency: "INR", receipt: orderNumber, notes: { internal_order_id: order.id, order_number: orderNumber } });
    const { error: paymentError } = await admin.from("payments").insert({ order_id: order.id, provider: "razorpay", razorpay_order_id: razorpayOrder.id, amount_paise: subtotalPaise, status: "created" });
    if (paymentError) throw paymentError;
    const { error: linkError } = await admin.from("orders").update({ razorpay_order_id: razorpayOrder.id, status: "payment_pending", payment_status: "created" }).eq("id", order.id);
    if (linkError) throw linkError;
    return { internalOrderId: order.id, razorpayOrderId: razorpayOrder.id, keyId: getRazorpayKeyId(), amountPaise: subtotalPaise, currency: "INR" as const, customer };
  } catch {
    await admin.from("orders").update({ status: "cancelled", payment_status: "failed" }).eq("id", order.id).neq("payment_status", "captured");
    throw new PaymentServiceError("Unable to start payment. Please try again.", 502);
  }
}

async function findPayment(razorpayOrderId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("payments").select("id, order_id, razorpay_order_id, status").eq("razorpay_order_id", razorpayOrderId).maybeSingle();
  if (error || !data) throw new PaymentServiceError("Payment order was not found.", 404);
  return data as unknown as PaymentRecord;
}

async function markOrderPaid(payment: PaymentRecord, paymentId: string, signature?: string, metadata?: unknown) {
  const admin = createAdminSupabaseClient();
  const { data: changedPayment, error: paymentError } = await admin
    .from("payments")
    .update({ status: "captured", razorpay_payment_id: paymentId, razorpay_signature: signature ?? null, signature_verified: true, provider_metadata: metadata ?? null })
    .eq("id", payment.id)
    .in("status", ["pending", "created", "authorized", "failed"])
    .select("id")
    .maybeSingle();
  if (paymentError) throw new PaymentServiceError("Unable to record payment.", 500);

  const { error: orderError } = await admin
    .from("orders")
    .update({ status: "paid", payment_status: "captured" })
    .eq("id", payment.order_id)
    .in("status", ["created", "payment_pending"])
    .neq("payment_status", "captured");
  if (orderError) throw new PaymentServiceError("Unable to finalize order.", 500);
  return { alreadyPaid: !changedPayment };
}

export async function verifyRazorpayCheckoutPayment(input: PaymentVerification) {
  const payment = await findPayment(input.razorpayOrderId);
  if (!payment.razorpay_order_id || !verifyCheckoutSignature(payment.razorpay_order_id, input.razorpayPaymentId, input.razorpaySignature)) throw new PaymentServiceError("Payment signature verification failed.");
  return markOrderPaid(payment, input.razorpayPaymentId, input.razorpaySignature);
}

async function markPaymentFailed(razorpayOrderId: string, paymentId: string | null, metadata: unknown) {
  const payment = await findPayment(razorpayOrderId);
  if (payment.status === "captured") return { alreadyPaid: true };
  const admin = createAdminSupabaseClient();
  const { error: paymentError } = await admin.from("payments").update({ status: "failed", razorpay_payment_id: paymentId, provider_metadata: metadata }).eq("id", payment.id).in("status", ["pending", "created", "authorized"]);
  if (paymentError) throw new PaymentServiceError("Unable to record failed payment.", 500);
  const { error: orderError } = await admin.from("orders").update({ status: "payment_pending", payment_status: "failed" }).eq("id", payment.order_id).neq("payment_status", "captured").in("status", ["created", "payment_pending"]);
  if (orderError) throw new PaymentServiceError("Unable to update order payment status.", 500);
  return { alreadyPaid: false };
}

const webhookPayloadSchema = z.object({
  event: z.string(),
  payload: z.object({ payment: z.object({ entity: z.object({ id: z.string(), order_id: z.string() }).passthrough() }).optional() }).passthrough(),
}).passthrough();

export async function processRazorpayWebhook(rawBody: string, signature: string | null, eventId: string | null) {
  if (!signature || !verifyWebhookSignature(rawBody, signature)) throw new PaymentServiceError("Invalid webhook signature.", 400);
  let parsedBody: unknown;
  try { parsedBody = JSON.parse(rawBody); } catch { throw new PaymentServiceError("Invalid webhook payload."); }
  const parsedWebhook = webhookPayloadSchema.safeParse(parsedBody);
  if (!parsedWebhook.success) throw new PaymentServiceError("Invalid webhook payload.");
  const webhook = parsedWebhook.data;
  const providerEventId = eventId ?? createHash("sha256").update(rawBody).digest("hex");
  const admin = createAdminSupabaseClient();
  const { data: existing } = await admin.from("webhook_events").select("id, processing_status").eq("provider", "razorpay").eq("provider_event_id", providerEventId).maybeSingle();
  if (existing?.processing_status === "processed") return { duplicate: true };
  if (!existing) {
    const { error } = await admin.from("webhook_events").insert({ provider: "razorpay", provider_event_id: providerEventId, event_type: webhook.event, payload: parsedBody, processing_status: "pending" });
    if (error && error.code !== "23505") throw new PaymentServiceError("Unable to record webhook.", 500);
  }
  try {
    const paymentEntity = webhook.payload.payment?.entity;
    if (paymentEntity && (webhook.event === "payment.captured" || webhook.event === "order.paid")) {
      const payment = await findPayment(paymentEntity.order_id);
      await markOrderPaid(payment, paymentEntity.id, undefined, parsedBody);
    } else if (paymentEntity && webhook.event === "payment.failed") {
      await markPaymentFailed(paymentEntity.order_id, paymentEntity.id, parsedBody);
    }
    await admin.from("webhook_events").update({ processing_status: "processed", processed_at: new Date().toISOString(), processing_error: null }).eq("provider", "razorpay").eq("provider_event_id", providerEventId);
    return { duplicate: false };
  } catch (error) {
    await admin.from("webhook_events").update({ processing_status: "failed", processing_error: error instanceof Error ? error.message : "Unknown error" }).eq("provider", "razorpay").eq("provider_event_id", providerEventId);
    throw error;
  }
}
