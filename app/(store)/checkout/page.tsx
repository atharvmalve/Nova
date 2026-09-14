import { CheckoutPage } from "@/components/checkout/checkout-page";
import { StorefrontFooter, StorefrontNavbar } from "@/components/storefront/storefront-shell";
import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function CheckoutRoute() { return <div className="flex min-h-screen flex-col bg-[#f8f7f3] text-black"><StorefrontNavbar /><CheckoutPage /><StorefrontFooter /></div>; }
