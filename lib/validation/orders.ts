import { z } from "zod";

export const orderIdSchema = z.string().uuid();
export const fulfillmentStatusSchema = z.enum(["unfulfilled", "confirmed", "processing", "shipped", "delivered", "cancelled"]);
export type FulfillmentStatus = z.infer<typeof fulfillmentStatusSchema>;
