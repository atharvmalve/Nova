import { CartPage } from "@/components/cart/cart-page";
import { StorefrontFooter, StorefrontNavbar } from "@/components/storefront/storefront-shell";

export default function CartRoute() {
  return <div className="flex min-h-screen flex-col bg-background"><StorefrontNavbar /><CartPage /><StorefrontFooter /></div>;
}
