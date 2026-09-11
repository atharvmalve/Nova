import Link from "next/link";
import { ArrowRight, Menu, ShoppingBag } from "lucide-react";
import { storeConfig } from "@/src/config/store";

export function StorefrontNavbar() {
  return (
    <header className="border-b border-border/70 bg-background/90 backdrop-blur">
      <nav aria-label="Main navigation" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link className="flex items-center gap-2 text-lg font-bold tracking-tight" href="/">
          <BrandMark />
          {storeConfig.name}
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium md:flex">
          <Link className="transition-colors hover:text-muted-foreground" href="/shop">Shop</Link>
          <Link className="transition-colors hover:text-muted-foreground" href="/shop#categories">Collections</Link>
          <Link className="transition-colors hover:text-muted-foreground" href="/shop#new">New arrivals</Link>
        </div>
        <div className="flex items-center gap-2">
          <Link aria-label="Open shopping bag" className="grid size-10 place-items-center rounded-full border transition-colors hover:bg-muted" href="/cart">
            <ShoppingBag className="size-4" />
          </Link>
          <Link aria-label="Open navigation" className="grid size-10 place-items-center rounded-full border transition-colors hover:bg-muted md:hidden" href="/shop">
            <Menu className="size-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function StorefrontFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link className="text-lg font-bold tracking-tight" href="/">{storeConfig.name}</Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">{storeConfig.tagline}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Shop</h2>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground"><Link href="/shop">All products</Link><Link href="/shop#new">New arrivals</Link></div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Help</h2>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground"><Link href="/contact">Contact</Link><Link href="/shipping">Shipping & returns</Link></div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-8">
        <span>© {new Date().getFullYear()} {storeConfig.name}. All rights reserved.</span><span>{storeConfig.contact.email}</span>
      </div>
    </footer>
  );
}

function BrandMark() { return storeConfig.branding.logo ? <img alt={`${storeConfig.name} logo`} className="size-8 rounded-lg object-contain" src={storeConfig.branding.logo} /> : <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">{storeConfig.name.slice(0, 1).toUpperCase()}</span>; }

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link className="inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline" href={href}>{children}<ArrowRight className="size-4" /></Link>;
}
