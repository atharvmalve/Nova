import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { StorefrontFooter, StorefrontNavbar, TextLink } from "@/components/storefront/storefront-shell";
import { getActiveCategories, getFeaturedProducts, type StorefrontProduct } from "@/services/products";
import { storeConfig } from "@/src/config/store";
import { formatCurrency } from "@/src/lib/currency";

export default async function StorefrontHomePage() {
  const [productsResult, categoriesResult] = await Promise.all([
    getFeaturedProducts(),
    getActiveCategories(),
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StorefrontNavbar />
      <main>
        <section className="relative overflow-hidden bg-[#f4f1ea]">
          <div className="absolute -right-32 top-8 size-96 rounded-full bg-[#dccfc0] blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 md:grid-cols-[1.05fr_.95fr] md:items-center md:py-28">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[.16em]"><Sparkles className="size-3" /> New season, quiet confidence</p>
              <h1 className="max-w-xl text-5xl font-semibold tracking-[-.055em] text-stone-900 sm:text-6xl lg:text-7xl">Objects for a life well lived.</h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-stone-600 sm:text-lg">{storeConfig.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="inline-flex h-11 items-center gap-2 rounded-md bg-stone-900 px-5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5" href="/shop">Shop the collection <ArrowRight className="size-4" /></Link>
                <Link className="inline-flex h-11 items-center rounded-md border border-stone-300 bg-white/50 px-5 text-sm font-semibold text-stone-900 hover:bg-white" href="#featured">Explore new arrivals</Link>
              </div>
            </div>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-t-[9rem] bg-[linear-gradient(145deg,#b89d80_0%,#ded5c9_48%,#887562_100%)] shadow-2xl shadow-stone-900/15">
              <div className="absolute inset-x-8 bottom-8 rounded-2xl border border-white/40 bg-white/75 p-5 backdrop-blur"><p className="text-xs font-semibold uppercase tracking-[.2em] text-stone-500">The edit</p><p className="mt-2 font-serif text-2xl italic text-stone-800">Less, but better.</p></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8" id="featured">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Handpicked for now</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Featured products</h2></div><div className="hidden sm:block"><TextLink href="/shop">View all products</TextLink></div></div>
          {productsResult.error ? <StorefrontError /> : productsResult.data.length === 0 ? <StorefrontEmpty label="Featured products are being selected. Check back soon." /> : <ProductGrid products={productsResult.data} />}
          <div className="mt-8 sm:hidden"><TextLink href="/shop">View all products</TextLink></div>
        </section>

        <section className="border-y bg-muted/30" id="categories"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Browse with intention</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Shop by category</h2>{categoriesResult.error ? <StorefrontError /> : categoriesResult.data.length === 0 ? <StorefrontEmpty label="Categories will appear here once they are available." /> : <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categoriesResult.data.map((category, index) => <Link className="group relative min-h-48 overflow-hidden rounded-xl bg-stone-900 p-6 text-white" href={`/shop?category=${encodeURIComponent(category.slug)}`} key={category.id}><div className="absolute inset-0 opacity-70 transition-transform duration-500 group-hover:scale-105" style={{ background: `linear-gradient(${125 + index * 19}deg, hsl(${25 + index * 28} 22% ${29 + index * 4}%), hsl(${35 + index * 14} 30% ${64 - index * 3}%))` }} /><div className="relative flex h-full flex-col justify-end"><p className="text-xl font-semibold">{category.name}</p><p className="mt-2 line-clamp-2 text-sm text-white/75">{category.description ?? "Explore the collection"}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Discover <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span></div></Link>)}</div>}</div></section>

        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8"><div className="grid overflow-hidden rounded-2xl bg-stone-900 text-white lg:grid-cols-2"><div className="p-8 sm:p-12 lg:p-16"><p className="text-xs font-semibold uppercase tracking-[.18em] text-stone-400">The {storeConfig.name} standard</p><h2 className="mt-4 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">A better way to build your everyday.</h2><ul className="mt-8 grid gap-4 text-sm text-stone-300">{["Thoughtful materials and considered details", "Pieces selected to wear, use and keep", "Straightforward delivery and easy returns"].map((benefit) => <li className="flex gap-3" key={benefit}><Check className="size-5 shrink-0 text-stone-100" />{benefit}</li>)}</ul><Link className="mt-10 inline-flex h-11 items-center rounded-md bg-white px-5 text-sm font-semibold text-stone-900 hover:bg-stone-100" href="/shop">Start exploring</Link></div><div className="min-h-64 bg-[radial-gradient(circle_at_30%_20%,#d4b995_0,transparent_34%),radial-gradient(circle_at_70%_70%,#756452_0,transparent_38%),linear-gradient(135deg,#b69b7e,#493d33)]" /></div></section>
      </main>
      <StorefrontFooter />
    </div>
  );
}

function ProductGrid({ products }: { products: StorefrontProduct[] }) {
  return <div className="mt-9 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">{products.map((product, index) => <Link className="group" href={`/products/${product.slug}`} key={product.id}><div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-100"><div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: `linear-gradient(${145 + index * 13}deg, hsl(${38 + index * 18} 28% ${84 - index * 4}%), hsl(${31 + index * 11} 22% ${61 - index * 3}%))` }} /><span className="absolute left-4 top-4 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-stone-700 backdrop-blur">{product.categoryName ?? "New"}</span><span aria-label={product.imageAlt ?? product.title} className="absolute inset-0" /></div><div className="mt-3"><div className="flex gap-2"><h3 className="truncate text-sm font-semibold">{product.title}</h3></div><p className="mt-1 text-sm text-muted-foreground">{formatPrice(product.pricePaise)}{product.compareAtPricePaise ? <span className="ml-2 text-xs line-through">{formatPrice(product.compareAtPricePaise)}</span> : null}</p></div></Link>)}</div>;
}

function StorefrontEmpty({ label }: { label: string }) { return <div className="mt-9 rounded-xl border border-dashed p-8 text-sm text-muted-foreground">{label}</div>; }
function StorefrontError() { return <div className="mt-9 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">We couldn’t load this section right now. Please refresh and try again.</div>; }
function formatPrice(paise: number) { return formatCurrency(paise); }
