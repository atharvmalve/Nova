"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getCartLines, setCartLines, subscribeToCart, type CartLine } from "@/lib/cart/browser";
import type { CartProduct } from "@/services/products";

type CartResponse = { products: CartProduct[]; error?: string };
type CartItem = CartProduct & { quantity: number; isAvailable: boolean };

export function CartPage() {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [items, setItems] = useState<CartItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const update = () => setLines(getCartLines());
    update();
    return subscribeToCart(update);
  }, []);

  useEffect(() => {
    if (lines.length === 0) return;
    let cancelled = false;
    async function load() {
      setStatus("loading");
      try {
        const response = await fetch("/api/cart/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productIds: lines.map((line) => line.productId) }) });
        const payload = await response.json() as CartResponse;
        if (!response.ok) throw new Error(payload.error ?? "We couldn’t refresh your cart.");
        if (cancelled) return;
        const productsById = new Map(payload.products.map((product) => [product.id, product]));
        const currentItems = lines.flatMap((line) => {
          const product = productsById.get(line.productId);
          if (!product) return [];
          const maximum = product.trackInventory ? product.inventoryQuantity : 99;
          return [{ ...product, quantity: Math.min(line.quantity, Math.max(maximum, 1)), isAvailable: !product.trackInventory || product.inventoryQuantity > 0 }];
        });
        const normalized = currentItems.map(({ id, quantity }) => ({ productId: id, quantity }));
        if (JSON.stringify(normalized) !== JSON.stringify(lines)) {
          setCartLines(normalized);
          const removed = lines.length - normalized.length;
          setNotice(removed > 0 ? `${removed} unavailable ${removed === 1 ? "product was" : "products were"} removed from your cart.` : "Your cart quantity was adjusted to match current stock.");
        }
        setItems(currentItems);
        setStatus("ready");
      } catch (error) {
        if (!cancelled) { setStatus("error"); setNotice(error instanceof Error ? error.message : "We couldn’t refresh your cart."); }
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [lines, reload]);

  function updateQuantity(productId: string, quantity: number) {
    setCartLines(lines.map((line) => line.productId === productId ? { ...line, quantity } : line).filter((line) => line.quantity > 0));
  }
  function remove(productId: string) { setCartLines(lines.filter((line) => line.productId !== productId)); }

  const subtotal = items.filter((item) => item.isAvailable).reduce((total, item) => total + item.pricePaise * item.quantity, 0);
  const hasUnavailableItems = items.some((item) => !item.isAvailable);

  return <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
    <p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Your selection</p>
    <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Shopping bag</h1>
    {notice ? <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground" role="status">{notice}</div> : null}
    {lines.length > 0 && status === "loading" ? <CartLoading /> : null}
    {lines.length > 0 && status === "error" ? <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive"><p>We couldn’t refresh your bag. Your saved items are still here.</p><Button className="mt-4" onClick={() => setReload((value) => value + 1)} variant="outline">Try again</Button></div> : null}
    {lines.length === 0 ? <EmptyCart /> : null}
    {status === "ready" && items.length > 0 ? <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"><section aria-label="Cart items" className="divide-y border-y">{items.map((item) => <CartLineItem item={item} key={item.id} onQuantityChange={updateQuantity} onRemove={remove} />)}</section><aside className="rounded-xl border bg-muted/20 p-5 sm:p-6"><h2 className="text-lg font-semibold">Order summary</h2><div className="mt-6 flex items-center justify-between border-t pt-4 text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{formatPrice(subtotal)}</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Shipping, taxes, and final availability will be confirmed at checkout.</p><Button className="mt-6 h-12 w-full" disabled={hasUnavailableItems} render={<Link href="/checkout" />}>Proceed to checkout</Button>{hasUnavailableItems ? <p className="mt-3 text-xs text-destructive">Remove out-of-stock items before checkout.</p> : null}<Link className="mt-5 block text-center text-sm font-medium underline-offset-4 hover:underline" href="/shop">Continue shopping</Link></aside></div> : null}
  </main>;
}

function CartLineItem({ item, onQuantityChange, onRemove }: { item: CartItem; onQuantityChange: (id: string, quantity: number) => void; onRemove: (id: string) => void }) {
  const maximum = item.trackInventory ? item.inventoryQuantity : 99;
  return <article className="flex gap-4 py-5 sm:gap-6"><div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted sm:size-28">{item.image?.url ? <img alt={item.image.alt} className="size-full object-cover" src={item.image.url} /* eslint-disable-line @next/next/no-img-element */ /> : <ShoppingBag className="size-6 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><div className="flex gap-3"><div className="min-w-0 flex-1"><Link className="block truncate font-semibold hover:underline" href={`/products/${item.slug}`}>{item.title}</Link><p className="mt-1 text-sm text-muted-foreground">{formatPrice(item.pricePaise)}</p>{!item.isAvailable ? <p className="mt-2 text-xs font-medium text-destructive">Currently out of stock</p> : item.trackInventory && item.inventoryQuantity <= 5 ? <p className="mt-2 text-xs text-muted-foreground">Only {item.inventoryQuantity} left</p> : null}</div><Button aria-label={`Remove ${item.title}`} onClick={() => onRemove(item.id)} size="icon-sm" variant="ghost"><Trash2 /></Button></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex h-9 items-center rounded-md border"><Button aria-label={`Decrease ${item.title} quantity`} disabled={item.quantity <= 1} onClick={() => onQuantityChange(item.id, item.quantity - 1)} size="icon-sm" variant="ghost"><Minus /></Button><span aria-live="polite" className="w-8 text-center text-sm font-medium">{item.quantity}</span><Button aria-label={`Increase ${item.title} quantity`} disabled={!item.isAvailable || item.quantity >= maximum} onClick={() => onQuantityChange(item.id, item.quantity + 1)} size="icon-sm" variant="ghost"><Plus /></Button></div><p className="text-sm font-semibold">{item.isAvailable ? formatPrice(item.pricePaise * item.quantity) : "Unavailable"}</p></div></div></article>;
}

function CartLoading() { return <div className="mt-9 space-y-4 animate-pulse"><div className="h-36 rounded-xl bg-muted" /><div className="h-36 rounded-xl bg-muted" /></div>; }
function EmptyCart() { return <div className="mt-9 rounded-xl border border-dashed px-6 py-14 text-center"><ShoppingBag className="mx-auto size-7 text-muted-foreground" /><h2 className="mt-4 text-lg font-semibold">Your bag is empty</h2><p className="mt-2 text-sm text-muted-foreground">Find something considered for your everyday.</p><Button className="mt-6" render={<Link href="/shop" />}>Explore products</Button></div>; }
function formatPrice(paise: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100); }
