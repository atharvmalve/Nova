import { CartPage } from "@/components/cart/cart-page";
import { StorefrontFooter, StorefrontNavbar } from "@/components/storefront/storefront-shell";

export default function CartRoute() {
  return <div className="flex min-h-screen flex-col bg-[#f8f7f3] text-black"><StorefrontNavbar /><CartPage /><StorefrontFooter /></div>;
}
