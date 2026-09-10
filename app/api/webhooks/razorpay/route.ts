import { PaymentServiceError, processRazorpayWebhook } from "@/services/payments";

export async function POST(request: Request) {
  const rawBody = await request.text();
  try {
    await processRazorpayWebhook(rawBody, request.headers.get("x-razorpay-signature"), request.headers.get("x-razorpay-event-id"));
    return Response.json({ received: true });
  } catch (error) {
    if (error instanceof PaymentServiceError) return Response.json({ error: error.message }, { status: error.statusCode });
    return Response.json({ error: "Unable to process webhook." }, { status: 500 });
  }
}
