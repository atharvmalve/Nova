import { CheckoutPage } from "@/components/checkout/checkout-page";
import { StorefrontFooter, StorefrontNavbar } from "@/components/storefront/storefront-shell";

export default function CheckoutRoute() { return <div className="flex min-h-screen flex-col bg-background"><StorefrontNavbar /><CheckoutPage /><StorefrontFooter /></div>; }
