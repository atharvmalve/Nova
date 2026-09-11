"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { storeConfig } from "@/src/config/store";
import { formatCurrency } from "@/src/lib/currency";
import { getCartLines, setCartLines, subscribeToCart, type CartLine } from "@/lib/cart/browser";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/checkout/validation";
import type { CartProduct } from "@/services/products";

type CartResponse = { products: CartProduct[]; error?: string };
type CheckoutOrderResponse = { internalOrderId: string; razorpayOrderId: string; keyId: string; amountPaise: number; currency: "INR"; error?: string };
type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open(): void }; } }

export function CheckoutPage() {
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [products, setProducts] = useState<CartProduct[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [order, setOrder] = useState<CheckoutOrderResponse | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const router = useRouter();
  const form = useForm<CheckoutFormValues>({ resolver: zodResolver(checkoutFormSchema), defaultValues: { name: "", email: "", phone: "", addressLine1: "", city: "", state: "", postalCode: "" } });

  useEffect(() => {
    const update = () => setLines(getCartLines());
    update();
    return subscribeToCart(update);
  }, []);

  useEffect(() => {
    if (!lines || lines.length === 0) return;
    const cartLines = lines;
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const response = await fetch("/api/cart/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productIds: cartLines.map((line) => line.productId) }) });
        const payload = await response.json() as CartResponse;
        if (!response.ok || payload.products.length !== cartLines.length) throw new Error(payload.error ?? "Your cart has changed. Please review it before checkout.");
        if (!cancelled) { setProducts(payload.products); setStatus("ready"); }
      } catch (error) { if (!cancelled) { setStatus("error"); setRequestError(error instanceof Error ? error.message : "We couldn’t load your cart."); } }
    }
    void load();
    return () => { cancelled = true; };
  }, [lines]);

  const resolvedLines = lines ?? [];
  const productsById = new Map(products.map((product) => [product.id, product]));
  const items = resolvedLines.flatMap((line) => {
    const product = productsById.get(line.productId);
    if (!product) return [];
    return [{ product, quantity: line.quantity, available: !product.trackInventory || (product.inventoryQuantity > 0 && line.quantity <= product.inventoryQuantity) }];
  });
  const subtotal = items.reduce((total, item) => total + item.product.pricePaise * item.quantity, 0);
  const canSubmit = status === "ready" && items.length === resolvedLines.length && items.every((item) => item.available) && !order;

  async function submit(values: CheckoutFormValues) {
    setRequestError(null);
    if (order) { await launchRazorpay(order, values); return; }
    try {
      const response = await fetch("/api/payments/create-order", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ customer: { name: values.name, email: values.email, phone: values.phone }, shippingAddress: { recipientName: values.name, phone: values.phone, addressLine1: values.addressLine1, city: values.city, state: values.state, postalCode: values.postalCode, country: "India" }, items: resolvedLines }),
      });
      const payload = await response.json() as CheckoutOrderResponse;
      if (!response.ok) throw new Error(payload.error ?? "Unable to prepare your payment.");
      setOrder(payload);
      await launchRazorpay(payload, values);
    } catch (error) { setRequestError(error instanceof Error ? error.message : "Unable to prepare your payment."); }
  }

  async function launchRazorpay(paymentOrder: CheckoutOrderResponse, values: CheckoutFormValues) {
    setIsPaying(true);
    try {
      await loadRazorpayCheckout();
      const checkout = new window.Razorpay!({ key: paymentOrder.keyId, order_id: paymentOrder.razorpayOrderId, amount: paymentOrder.amountPaise, currency: paymentOrder.currency, name: storeConfig.name, description: `${storeConfig.name} order payment`, prefill: { name: values.name, email: values.email, contact: values.phone }, theme: { color: storeConfig.branding.primaryColor }, handler: async (response: RazorpayResponse) => {
        try {
          const verification = await fetch("/api/payments/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(response) });
          const verified = await verification.json() as { orderId?: string; error?: string };
          if (!verification.ok || !verified.orderId) throw new Error(verified.error ?? "Unable to verify payment.");
          setCartLines([]);
          router.replace(`/order/success/${verified.orderId}`);
        } catch (error) { setRequestError(error instanceof Error ? error.message : "We couldn’t verify your payment. Please contact support if you were charged."); setIsPaying(false); }
      }, modal: { ondismiss: () => { setRequestError("Payment was not completed. You can try again when ready."); setIsPaying(false); } } });
      checkout.open();
    } catch (error) { setRequestError(error instanceof Error ? error.message : "Unable to open secure payment."); setIsPaying(false); }
  }

  if (lines?.length === 0) return <EmptyCheckout />;
  return <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14"><p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Secure checkout</p><h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Complete your order</h1>{status === "loading" ? <LoadingCheckout /> : null}{status === "error" ? <CheckoutError message={requestError ?? "We couldn’t load your cart."} /> : null}{status === "ready" ? <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start"><form className="space-y-9" onSubmit={form.handleSubmit(submit)}><section><h2 className="text-xl font-semibold">Customer information</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field error={form.formState.errors.name?.message} label="Full name"><input autoComplete="name" {...form.register("name")} /></Field><Field error={form.formState.errors.email?.message} label="Email address"><input autoComplete="email" inputMode="email" {...form.register("email")} /></Field><Field error={form.formState.errors.phone?.message} label="Phone number"><input autoComplete="tel" inputMode="tel" placeholder="9876543210" {...form.register("phone")} /></Field></div></section><section className="border-t pt-8"><h2 className="text-xl font-semibold">Shipping information</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field className="sm:col-span-2" error={form.formState.errors.addressLine1?.message} label="Address"><input autoComplete="street-address" {...form.register("addressLine1")} /></Field><Field error={form.formState.errors.city?.message} label="City"><input autoComplete="address-level2" {...form.register("city")} /></Field><Field error={form.formState.errors.state?.message} label="State"><input autoComplete="address-level1" {...form.register("state")} /></Field><Field error={form.formState.errors.postalCode?.message} label="Pincode"><input autoComplete="postal-code" inputMode="numeric" maxLength={6} {...form.register("postalCode")} /></Field></div></section>{requestError ? <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">{requestError}</p> : null}<Button className="h-12 w-full sm:w-auto" disabled={!canSubmit || form.formState.isSubmitting || isPaying} type="submit">{isPaying ? "Verifying payment…" : order ? "Try payment again" : form.formState.isSubmitting ? "Preparing secure payment…" : "Continue to payment"}</Button></form><OrderSummary items={items} subtotal={subtotal} /></div> : null}</main>;
}

function loadRazorpayCheckout() { if (window.Razorpay) return Promise.resolve(); return new Promise<void>((resolve, reject) => { const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true; script.onload = () => resolve(); script.onerror = () => reject(new Error("Unable to load secure payment.")); document.body.appendChild(script); }); }
function Field({ children, className, error, label }: { children: React.ReactNode; className?: string; error?: string; label: string }) { return <label className={`grid gap-2 text-sm font-medium ${className ?? ""}`}><span>{label}</span><span className="[&_input]:h-11 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:bg-background [&_input]:px-3 [&_input]:text-sm [&_input]:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-ring">{children}</span>{error ? <span className="text-xs font-normal text-destructive">{error}</span> : null}</label>; }
function OrderSummary({ items, subtotal }: { items: Array<{ product: CartProduct; quantity: number; available: boolean }>; subtotal: number }) { return <aside className="rounded-xl border bg-muted/20 p-5 sm:p-6"><h2 className="text-lg font-semibold">Order summary</h2><div className="mt-5 divide-y border-y">{items.map(({ product, quantity, available }) => <div className="flex items-start justify-between gap-3 py-4 text-sm" key={product.id}><div className="min-w-0"><p className="truncate font-medium">{product.title}</p><p className={available ? "mt-1 text-muted-foreground" : "mt-1 text-destructive"}>Qty {quantity}{available ? "" : " · unavailable"}</p></div><span className="shrink-0 font-medium">{formatPrice(product.pricePaise * quantity)}</span></div>)}</div><div className="mt-5 flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{formatPrice(subtotal)}</span></div><div className="mt-3 flex justify-between border-t pt-3 text-sm"><span className="text-muted-foreground">Final total</span><span className="font-semibold">{formatPrice(subtotal)}</span></div><p className="mt-4 flex gap-2 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 size-3 shrink-0" />Final price and availability are verified again by the server before payment.</p></aside>; }
function EmptyCheckout() { return <main className="mx-auto w-full max-w-3xl px-5 py-16 text-center sm:px-8"><ShoppingBag className="mx-auto size-8 text-muted-foreground" /><h1 className="mt-4 text-2xl font-semibold">Your cart is empty</h1><p className="mt-2 text-sm text-muted-foreground">Add products before starting checkout.</p><Button className="mt-6" render={<Link href="/shop" />}>Shop products</Button></main>; }
function LoadingCheckout() { return <div className="mt-9 grid gap-5 animate-pulse"><div className="h-48 rounded-xl bg-muted" /><div className="h-56 rounded-xl bg-muted" /></div>; }
function CheckoutError({ message }: { message: string }) { return <div className="mt-9 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{message}<Link className="mt-4 block font-medium underline" href="/cart">Return to cart</Link></div>; }
function formatPrice(paise: number) { return formatCurrency(paise); }
