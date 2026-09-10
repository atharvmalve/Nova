"use client";

export type CartLine = { productId: string; quantity: number };

const cartStorageKey = "nova-cart";
const cartUpdatedEvent = "nova-cart-updated";
const maxCartQuantity = 99;

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return typeof line.productId === "string" && line.productId.length > 0 && Number.isInteger(line.quantity) && Number(line.quantity) > 0;
}

function normalize(lines: unknown): CartLine[] {
  if (!Array.isArray(lines)) return [];
  const quantities = new Map<string, number>();
  for (const line of lines) {
    if (!isCartLine(line)) continue;
    quantities.set(line.productId, Math.min(maxCartQuantity, (quantities.get(line.productId) ?? 0) + line.quantity));
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

export function getCartLines(): CartLine[] {
  try { return normalize(JSON.parse(window.localStorage.getItem(cartStorageKey) ?? "[]")); } catch { return []; }
}

export function setCartLines(lines: CartLine[]) {
  const normalized = normalize(lines);
  window.localStorage.setItem(cartStorageKey, JSON.stringify(normalized));
  window.dispatchEvent(new Event(cartUpdatedEvent));
  return normalized;
}

export function addCartLine(line: CartLine, maximum = maxCartQuantity) {
  const max = Math.min(Math.max(maximum, 1), maxCartQuantity);
  const existing = getCartLines();
  const itemIndex = existing.findIndex((item) => item.productId === line.productId);
  if (itemIndex >= 0) existing[itemIndex] = { ...existing[itemIndex], quantity: Math.min(existing[itemIndex].quantity + line.quantity, max) };
  else existing.push({ productId: line.productId, quantity: Math.min(Math.max(line.quantity, 1), max) });
  return setCartLines(existing);
}

export function subscribeToCart(callback: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === cartStorageKey) callback(); };
  window.addEventListener(cartUpdatedEvent, callback);
  window.addEventListener("storage", onStorage);
  return () => { window.removeEventListener(cartUpdatedEvent, callback); window.removeEventListener("storage", onStorage); };
}
