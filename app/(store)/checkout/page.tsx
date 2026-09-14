import { CheckoutPage } from "@/components/checkout/checkout-page";
import { StorefrontFooter, StorefrontNavbar } from "@/components/storefront/storefront-shell";

export default function CheckoutRoute() { return <div className="flex min-h-screen flex-col bg-[#f8f7f3] text-black"><StorefrontNavbar /><CheckoutPage /><StorefrontFooter /></div>; }
