import Link from "next/link";
import { storeConfig } from "@/src/config/store";

export function StorefrontNavbar({ variant = "light" }: { variant?: "light" | "overlay" }) {
  const overlay = variant === "overlay";
  return (
    <header className={overlay ? "absolute inset-x-0 top-0 z-20 text-white" : "relative z-20 border-b border-black/10 bg-[#f8f7f3] text-black"}>
      <nav aria-label="Main navigation" className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link className="font-editorial text-xl tracking-[-.04em] sm:text-2xl" href="/">
          NOVAE STUDIO
        </Link>
        <div className="hidden items-center gap-8 text-[11px] uppercase tracking-[.16em] md:flex">
          <Link className="transition-opacity hover:opacity-55" href="/shop">Collection</Link>
          <Link className="transition-opacity hover:opacity-55" href="/shop/sofas">Sofas</Link>
          <Link className="transition-opacity hover:opacity-55" href="/shop/armchairs">Armchairs</Link>
        </div>
        <div className="flex items-center gap-5 text-[11px] uppercase tracking-[.16em]">
          <Link className="transition-opacity hover:opacity-55" href="/cart">Bag</Link>
          <Link className="md:hidden transition-opacity hover:opacity-55" href="/shop">Menu</Link>
        </div>
      </nav>
    </header>
  );
}

export function StorefrontFooter() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.7fr_1fr] lg:px-12 lg:py-24">
        <div>
          <Link className="font-editorial text-3xl tracking-[-.04em]" href="/">NOVAE STUDIO</Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">Italian furniture defined by material, proportion and enduring craft.</p>
        </div>
        <div>
          <h2 className="font-editorial text-lg">Collection</h2>
          <div className="mt-4 grid gap-3 text-xs uppercase tracking-[.14em] text-white/55"><Link href="/shop">All furniture</Link><Link href="/shop/sofas">Sofas</Link><Link href="/shop/armchairs">Armchairs</Link></div>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 border-t border-white/15 px-5 py-6 text-[10px] uppercase tracking-[.13em] text-white/45 sm:flex-row sm:justify-between sm:px-8 lg:px-12">
        <span>© {new Date().getFullYear()} {storeConfig.name}. All rights reserved.</span><span>{storeConfig.contact.email}</span>
      </div>
    </footer>
  );
}
