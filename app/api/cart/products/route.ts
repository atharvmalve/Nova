import { z } from "zod";

import { getCartProducts } from "@/services/products";

const requestSchema = z.object({ productIds: z.array(z.uuid()).min(1).max(50) });

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid cart request." }, { status: 400 }); }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid cart request." }, { status: 400 });
  const result = await getCartProducts(parsed.data.productIds);
  if (result.error) return Response.json({ error: result.error }, { status: 503 });
  return Response.json({ products: result.data });
}
