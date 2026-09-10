import { z } from "zod";

const money = z.string().trim().regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount.").transform((value) => Math.round(Number(value) * 100));

export const productInputSchema = z.object({
  title: z.string().trim().min(2, "Name must be at least 2 characters.").max(160),
  description: z.string().trim().max(10_000).transform((value) => value || null),
  price: money.refine((value) => value >= 0 && value <= 99_999_999, "Price is out of range."),
  compareAtPrice: z.string().trim().optional().transform((value) => value || null).pipe(z.string().regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount.").transform((value) => Math.round(Number(value) * 100)).nullable()),
  sku: z.string().trim().min(1, "SKU is required.").max(80).regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "SKU may only contain letters, numbers, dots, hyphens, and underscores.").transform((value) => value.toUpperCase()),
  inventoryQuantity: z.coerce.number().int("Stock must be a whole number.").min(0, "Stock cannot be negative.").max(10_000_000),
  categoryId: z.string().uuid().optional().or(z.literal("")).transform((value) => value || null),
  status: z.enum(["draft", "active", "archived"]),
}).superRefine((value, ctx) => {
  if (value.compareAtPrice !== null && value.compareAtPrice < value.price) {
    ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Compare-at price must be at least the selling price." });
  }
});

export const productIdSchema = z.string().uuid();
export const productImageSchema = z.custom<File>((value) => value instanceof File && value.size > 0, "Choose an image file.")
  .refine((file) => file.size <= 5 * 1024 * 1024, "Image must be 5 MB or smaller.")
  .refine((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type), "Use a JPEG, PNG, or WebP image.");

export type ProductInput = z.infer<typeof productInputSchema>;
