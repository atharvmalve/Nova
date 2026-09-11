import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";

import { StorefrontFooter, StorefrontNavbar } from "@/components/storefront/storefront-shell";
import { formatCurrency } from "@/src/lib/currency";
import {
  getActiveCategories,
  getProductCatalog,
  parseCatalogQuery,
  type StorefrontProduct,
} from "@/services/products";

type ShopPageProps = {
  searchParams: Promise<{ category?: string | string[]; page?: string | string[]; q?: string | string[] }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const query = parseCatalogQuery(await searchParams);
  const [catalogResult, categoriesResult] = await Promise.all([
    getProductCatalog(query),
    getActiveCategories(24),
  ]);
  const catalog = catalogResult.data;

  return (
    <div className="min-h-screen bg-background">
      <StorefrontNavbar />
      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">The complete collection</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Shop all products</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Find considered pieces made for your everyday rituals.</p>
        </div>

        <form action="/shop" className="mt-8 flex flex-col gap-3 border-y py-5 sm:flex-row" role="search">
          {query.category ? <input name="category" type="hidden" value={query.category} /> : null}
          <label className="sr-only" htmlFor="product-search">Search products</label>
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="h-11 w-full rounded-md border bg-background pl-10 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring" defaultValue={query.q} id="product-search" name="q" placeholder="Search products" type="search" /></div>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90" type="submit"><Search className="size-4" />Search</button>
        </form>

        <section className="mt-7" id="categories">
          <div className="flex items-center gap-2 text-sm font-medium"><SlidersHorizontal className="size-4" />Browse by category</div>
          {categoriesResult.error ? <p className="mt-3 text-sm text-destructive">Categories are unavailable right now.</p> : <div className="mt-3 flex gap-2 overflow-x-auto pb-2">{categoryLink("All products", createShopHref({ q: query.q }), !query.category)}{categoriesResult.data.map((category) => categoryLink(category.name, createShopHref({ category: category.slug, q: query.q }), query.category === category.slug, category.id))}</div>}
        </section>

        <section className="mt-9" aria-live="polite">
          <div className="flex items-center justify-between gap-4"><p className="text-sm text-muted-foreground">{catalogResult.error ? "" : `${catalog.total} ${catalog.total === 1 ? "product" : "products"}${query.q ? ` for “${query.q}”` : ""}`}</p><p className="text-xs text-muted-foreground">Page {catalog.totalPages === 0 ? 0 : catalog.page} of {catalog.totalPages}</p></div>
          {catalogResult.error ? <ShopError /> : catalog.items.length === 0 ? <ShopEmpty hasFilters={Boolean(query.category || query.q)} /> : <ProductGrid products={catalog.items} />}
          {!catalogResult.error && catalog.totalPages > 1 ? <Pagination currentPage={catalog.page} totalPages={catalog.totalPages} query={query} /> : null}
        </section>
      </main>
      <StorefrontFooter />
    </div>
  );
}

function categoryLink(label: string, href: string, active: boolean, key = label) {
  return <Link className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`} href={href} key={key}>{label}</Link>;
}

function ProductGrid({ products }: { products: StorefrontProduct[] }) {
  return <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{products.map((product, index) => <Link className="group min-w-0" href={`/products/${product.slug}`} key={product.id}><div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-100"><div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: `linear-gradient(${145 + index * 13}deg, hsl(${38 + index * 18} 28% ${84 - index * 4}%), hsl(${31 + index * 11} 22% ${61 - index * 3}%))` }} /><span className="absolute left-3 top-3 rounded-full bg-white/85 px-2 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-stone-700">{product.categoryName ?? "New"}</span><span aria-label={product.imageAlt ?? product.title} className="absolute inset-0" /></div><div className="mt-3"><h2 className="truncate text-sm font-semibold">{product.title}</h2><p className="mt-1 text-sm text-muted-foreground">{formatPrice(product.pricePaise)}{product.compareAtPricePaise ? <span className="ml-2 text-xs line-through">{formatPrice(product.compareAtPricePaise)}</span> : null}</p></div></Link>)}</div>;
}

function Pagination({ currentPage, totalPages, query }: { currentPage: number; totalPages: number; query: { category?: string; q: string } }) {
  return <nav aria-label="Product pages" className="mt-10 flex items-center justify-center gap-3"><Link aria-disabled={currentPage <= 1} className={`rounded-md border px-4 py-2 text-sm font-medium ${currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={createShopHref({ ...query, page: currentPage - 1 })}>Previous</Link><span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span><Link aria-disabled={currentPage >= totalPages} className={`rounded-md border px-4 py-2 text-sm font-medium ${currentPage >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-muted"}`} href={createShopHref({ ...query, page: currentPage + 1 })}>Next</Link></nav>;
}

function ShopEmpty({ hasFilters }: { hasFilters: boolean }) { return <div className="mt-6 rounded-xl border border-dashed p-10 text-center"><h2 className="text-lg font-semibold">No products found</h2><p className="mt-2 text-sm text-muted-foreground">{hasFilters ? "Try a different search or clear your filters." : "Products will appear here once they are available."}</p>{hasFilters ? <Link className="mt-5 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" href="/shop">Clear filters</Link> : null}</div>; }
function ShopError() { return <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">We couldn’t load products right now. Please refresh and try again.</div>; }
function createShopHref(query: { category?: string; page?: number; q?: string }) { const params = new URLSearchParams(); if (query.category) params.set("category", query.category); if (query.q) params.set("q", query.q); if (query.page && query.page > 1) params.set("page", String(query.page)); const string = params.toString(); return string ? `/shop?${string}` : "/shop"; }
function formatPrice(paise: number) { return formatCurrency(paise); }
