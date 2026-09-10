"use client";

export type CartLine = {
  productId: string;
  slug: string;
  title: string;
  pricePaise: number;
  quantity: number;
};

const cartStorageKey = "nova-cart";

export function addCartLine(line: CartLine) {
  const stored = window.localStorage.getItem(cartStorageKey);
  const existing = stored ? (JSON.parse(stored) as CartLine[]) : [];
  const itemIndex = existing.findIndex((item) => item.productId === line.productId);

  if (itemIndex >= 0) {
    existing[itemIndex] = { ...existing[itemIndex], quantity: existing[itemIndex].quantity + line.quantity };
  } else {
    existing.push(line);
  }

  window.localStorage.setItem(cartStorageKey, JSON.stringify(existing));
  window.dispatchEvent(new Event("nova-cart-updated"));
}
