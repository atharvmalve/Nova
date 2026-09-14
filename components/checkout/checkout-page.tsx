"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
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
  return <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-16 sm:px-8 lg:px-12 lg:py-24"><p className="font-editorial text-xl">SECURE CHECKOUT</p><h1 className="mt-4 text-4xl tracking-[-.05em] sm:text-6xl">Complete your order.</h1>{status === "loading" ? <LoadingCheckout /> : null}{status === "error" ? <CheckoutError message={requestError ?? "We couldn’t load your cart."} /> : null}{status === "ready" ? <div className="mt-16 grid gap-16 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-24"><form className="space-y-12" onSubmit={form.handleSubmit(submit)}><section><p className="font-editorial text-lg">Customer information</p><div className="mt-7 grid gap-6 sm:grid-cols-2"><Field error={form.formState.errors.name?.message} label="Full name"><input autoComplete="name" {...form.register("name")} /></Field><Field error={form.formState.errors.email?.message} label="Email address"><input autoComplete="email" inputMode="email" {...form.register("email")} /></Field><Field error={form.formState.errors.phone?.message} label="Phone number"><input autoComplete="tel" inputMode="tel" placeholder="9876543210" {...form.register("phone")} /></Field></div></section><section className="border-t border-black/15 pt-10"><p className="font-editorial text-lg">Shipping information</p><div className="mt-7 grid gap-6 sm:grid-cols-2"><Field className="sm:col-span-2" error={form.formState.errors.addressLine1?.message} label="Address"><input autoComplete="street-address" {...form.register("addressLine1")} /></Field><Field error={form.formState.errors.city?.message} label="City"><input autoComplete="address-level2" {...form.register("city")} /></Field><Field error={form.formState.errors.state?.message} label="State"><input autoComplete="address-level1" {...form.register("state")} /></Field><Field error={form.formState.errors.postalCode?.message} label="Pincode"><input autoComplete="postal-code" inputMode="numeric" maxLength={6} {...form.register("postalCode")} /></Field></div></section>{requestError ? <p className="border-y border-black/15 py-4 text-sm" role="alert">{requestError}</p> : null}<Button className="h-auto rounded-none bg-black px-6 py-4 text-xs uppercase tracking-[.15em] hover:bg-black/80" disabled={!canSubmit || form.formState.isSubmitting || isPaying} type="submit">{isPaying ? "Verifying payment…" : order ? "Try payment again" : form.formState.isSubmitting ? "Preparing secure payment…" : "Continue to payment"}</Button></form><OrderSummary items={items} subtotal={subtotal} /></div> : null}</main>;
}

function loadRazorpayCheckout() { if (window.Razorpay) return Promise.resolve(); return new Promise<void>((resolve, reject) => { const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true; script.onload = () => resolve(); script.onerror = () => reject(new Error("Unable to load secure payment.")); document.body.appendChild(script); }); }
function Field({ children, className, error, label }: { children: React.ReactNode; className?: string; error?: string; label: string }) { return <label className={`grid gap-2 text-sm ${className ?? ""}`}><span>{label}</span><span className="[&_input]:h-12 [&_input]:w-full [&_input]:border [&_input]:border-black/20 [&_input]:bg-transparent [&_input]:px-3 [&_input]:text-sm [&_input]:outline-none [&_input]:focus:border-black">{children}</span>{error ? <span className="text-xs text-destructive">{error}</span> : null}</label>; }
function OrderSummary({ items, subtotal }: { items: Array<{ product: CartProduct; quantity: number; available: boolean }>; subtotal: number }) { return <aside className="border-t border-black/15 pt-5 lg:sticky lg:top-10 lg:self-start"><h2 className="font-editorial text-xl">ORDER SUMMARY</h2><div className="mt-6 divide-y divide-black/15 border-y border-black/15">{items.map(({ product, quantity, available }) => <div className="flex items-start justify-between gap-3 py-4 text-sm" key={product.id}><div className="min-w-0"><p className="truncate">{product.title}</p><p className={available ? "mt-1 text-black/50" : "mt-1 text-destructive"}>Qty {quantity}{available ? "" : " · unavailable"}</p></div><span className="shrink-0">{formatPrice(product.pricePaise * quantity)}</span></div>)}</div><div className="mt-6 flex justify-between text-sm"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><p className="mt-5 text-xs leading-5 text-black/50">Final price and availability are verified by the server before payment.</p></aside>; }
function EmptyCheckout() { return <main className="mx-auto w-full max-w-3xl px-5 py-16 text-center sm:px-8"><ShoppingBag className="mx-auto size-8 text-muted-foreground" /><h1 className="mt-4 text-2xl font-semibold">Your cart is empty</h1><p className="mt-2 text-sm text-muted-foreground">Add products before starting checkout.</p><Button className="mt-6" render={<Link href="/shop" />}>Shop products</Button></main>; }
function LoadingCheckout() { return <div className="mt-9 grid gap-5 animate-pulse"><div className="h-48 rounded-xl bg-muted" /><div className="h-56 rounded-xl bg-muted" /></div>; }
function CheckoutError({ message }: { message: string }) { return <div className="mt-9 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{message}<Link className="mt-4 block font-medium underline" href="/cart">Return to cart</Link></div>; }
function formatPrice(paise: number) { return formatCurrency(paise); }
