"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { addCartLine } from "@/lib/cart/browser";

type ProductPurchasePanelProps = {
  product: {
    id: string;
    slug: string;
    title: string;
    pricePaise: number;
    inventoryQuantity: number;
    isInStock: boolean;
    trackInventory: boolean;
  };
};

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const maximum = product.trackInventory ? product.inventoryQuantity : 99;

  useEffect(() => {
    if (!isAdded) return;
    const timeout = window.setTimeout(() => setIsAdded(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [isAdded]);

  function updateQuantity(nextQuantity: number) {
    setQuantity(Math.min(Math.max(nextQuantity, 1), maximum));
    setIsAdded(false);
  }

  function addToCart() {
    addCartLine({ productId: product.id, quantity }, maximum);
    setIsAdded(true);
  }

  if (!product.isInStock) {
    return <div className="mt-8 border-y border-black/15 py-4 text-sm">Currently out of stock</div>;
  }

  return <div className="mt-8 space-y-5"><div className="flex w-32 items-center justify-between border-y border-black/15 py-3"><button aria-label="Decrease quantity" className="text-lg disabled:opacity-30" disabled={quantity <= 1} onClick={() => updateQuantity(quantity - 1)} type="button">−</button><span aria-live="polite" className="text-sm">{quantity}</span><button aria-label="Increase quantity" className="text-lg disabled:opacity-30" disabled={quantity >= maximum} onClick={() => updateQuantity(quantity + 1)} type="button">+</button></div><button className="border-b border-black pb-2 text-xs uppercase tracking-[.16em] transition-opacity hover:opacity-50" onClick={addToCart} type="button">{isAdded ? "Added to bag" : "Add to bag"}</button>{isAdded ? <div className="fixed bottom-5 right-5 z-40 bg-black px-5 py-4 text-sm text-white shadow-sm" role="status"><span>{product.title} added</span><span className="mx-2 text-white/45">·</span><Link className="underline underline-offset-4" href="/cart">View Bag</Link></div> : null}{product.trackInventory && product.inventoryQuantity <= 5 ? <p className="text-xs text-black/50">Only {product.inventoryQuantity} left in stock.</p> : null}</div>;
}
