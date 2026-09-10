import { z } from "zod";

const indianPhone = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;
const indianPincode = /^\d{6}$/;

export const checkoutCustomerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  phone: z.string().trim().regex(indianPhone, "Enter a valid 10-digit Indian phone number."),
});

export const checkoutShippingSchema = z.object({
  recipientName: z.string().trim().min(1).max(120),
  phone: z.string().trim().regex(indianPhone, "Enter a valid 10-digit Indian phone number."),
  addressLine1: z.string().trim().min(1, "Enter your address.").max(240),
  addressLine2: z.string().trim().max(240).optional(),
  city: z.string().trim().min(1, "Enter your city.").max(100),
  state: z.string().trim().min(1, "Enter your state.").max(100),
  postalCode: z.string().trim().regex(indianPincode, "Enter a valid 6-digit pincode."),
  country: z.literal("India").default("India"),
});

export const checkoutItemsSchema = z.array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(50);

export const checkoutRequestSchema = z.object({
  customer: checkoutCustomerSchema,
  shippingAddress: checkoutShippingSchema,
  items: checkoutItemsSchema,
});

export const checkoutFormSchema = checkoutCustomerSchema.pick({ name: true, email: true, phone: true }).extend({
  addressLine1: checkoutShippingSchema.shape.addressLine1,
  city: checkoutShippingSchema.shape.city,
  state: checkoutShippingSchema.shape.state,
  postalCode: checkoutShippingSchema.shape.postalCode,
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
