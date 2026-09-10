"use client";

import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";

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

  function updateQuantity(nextQuantity: number) {
    setQuantity(Math.min(Math.max(nextQuantity, 1), maximum));
    setIsAdded(false);
  }

  function addToCart() {
    addCartLine({ productId: product.id, slug: product.slug, title: product.title, pricePaise: product.pricePaise, quantity });
    setIsAdded(true);
  }

  if (!product.isInStock) {
    return <div className="mt-6 rounded-md bg-muted px-4 py-3 text-sm font-medium">Currently out of stock</div>;
  }

  return <div className="mt-6 space-y-3"><div className="flex h-11 w-32 items-center justify-between rounded-md border"><button aria-label="Decrease quantity" className="grid size-10 place-items-center disabled:opacity-40" disabled={quantity <= 1} onClick={() => updateQuantity(quantity - 1)} type="button"><Minus className="size-4" /></button><span aria-live="polite" className="text-sm font-medium">{quantity}</span><button aria-label="Increase quantity" className="grid size-10 place-items-center disabled:opacity-40" disabled={quantity >= maximum} onClick={() => updateQuantity(quantity + 1)} type="button"><Plus className="size-4" /></button></div><button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90" onClick={addToCart} type="button"><ShoppingBag className="size-4" />{isAdded ? "Added to bag" : "Add to bag"}</button>{product.trackInventory && product.inventoryQuantity <= 5 ? <p className="text-xs text-muted-foreground">Only {product.inventoryQuantity} left in stock.</p> : null}</div>;
}
