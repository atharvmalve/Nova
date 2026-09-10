import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { z } from "zod";

const razorpayCheckoutConfigSchema = z.object({
  keyId: z.string().min(1, "RAZORPAY_KEY_ID is required."),
  keySecret: z.string().min(1, "RAZORPAY_KEY_SECRET is required."),
});

const razorpayWebhookConfigSchema = razorpayCheckoutConfigSchema.extend({
  webhookSecret: z.string().min(1, "RAZORPAY_WEBHOOK_SECRET is required."),
});

function getRazorpayCheckoutConfig() {
  return razorpayCheckoutConfigSchema.parse({
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function getRazorpayWebhookConfig() { return razorpayWebhookConfigSchema.parse({ ...getRazorpayCheckoutConfig(), webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET }); }

export function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayCheckoutConfig();
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export function getRazorpayKeyId() {
  return getRazorpayCheckoutConfig().keyId;
}

function hasMatchingSignature(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const { keySecret } = getRazorpayCheckoutConfig();
  const expected = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return hasMatchingSignature(expected, signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const { webhookSecret } = getRazorpayWebhookConfig();
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return hasMatchingSignature(expected, signature);
}
