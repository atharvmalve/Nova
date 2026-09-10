import { NextResponse } from "next/server";

import { createOrderSuccessToken } from "@/lib/razorpay/server";
import { parsePaymentVerification, PaymentServiceError, verifyRazorpayCheckoutPayment } from "@/services/payments";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid payment response." }, { status: 400 }); }
  try {
    const result = await verifyRazorpayCheckoutPayment(parsePaymentVerification(body));
    const response = NextResponse.json({ orderId: result.orderId, alreadyPaid: result.alreadyPaid });
    response.cookies.set("nova-order-success", createOrderSuccessToken(result.orderId), { httpOnly: true, maxAge: 60 * 30, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/order/success" });
    return response;
  } catch (error) {
    if (error instanceof PaymentServiceError) return NextResponse.json({ error: error.message }, { status: error.statusCode });
    return NextResponse.json({ error: "Unable to verify payment. Please contact support if you were charged." }, { status: 502 });
  }
}
