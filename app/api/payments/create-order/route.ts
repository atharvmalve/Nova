import { createRazorpayCheckoutOrder, parseCheckoutRequest, PaymentServiceError } from "@/services/payments";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid checkout information." }, { status: 400 }); }
  try {
    const order = await createRazorpayCheckoutOrder(parseCheckoutRequest(body));
    return Response.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof PaymentServiceError) return Response.json({ error: error.message }, { status: error.statusCode });
    return Response.json({ error: "Unable to create the order. Please try again." }, { status: 500 });
  }
}
