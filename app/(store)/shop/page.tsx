import type { Metadata } from "next";
import Link from "next/link";

/* Signed Supabase image URLs can use deployment-specific hosts, so these remain native responsive images. */
/* eslint-disable @next/next/no-img-element */

import { StorefrontFooter, StorefrontNavbar } from "@/components/storefront/storefront-shell";
import { getActiveCategories, getProductCatalog, parseCatalogQuery, type StorefrontProduct } from "@/services/products";
import { formatCurrency } from "@/src/lib/currency";

type ShopPageProps = { searchParams: Promise<{ category?: string | string[]; page?: string | string[]; q?: string | string[] }> };
export const metadata: Metadata = { title: "Italian Furniture | Sofas & Armchairs", description: "Explore the Novae Studio collection of Italian furniture, including designer sofas and armchairs selected for sophisticated contemporary interiors.", alternates: { canonical: "/shop" }, openGraph: { url: "/shop", title: "Italian Furniture | Sofas & Armchairs | Novae Studio" } };

export default async function ShopPage({ searchParams }: ShopPageProps) { const query = parseCatalogQuery(await searchParams); return <ShopPageContent category={query.category} />; }

export async function ShopPageContent({ category }: { category?: string }) {
  const [catalogResult, categoriesResult] = await Promise.all([getProductCatalog({ category, page: 1, q: "" }, 48), getActiveCategories()]); const catalog = catalogResult.data; const selectedCategory = categoriesResult.data.find((item) => item.slug === category); const title = selectedCategory ? `${selectedCategory.name} Collection` : "Furniture Collection";
  return <div className="min-h-screen bg-[#f8f7f3] text-black"><StorefrontNavbar /><main className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24"><header><p className="font-editorial text-xl">COLLECTION</p><h1 className="mt-4 text-4xl tracking-[-.05em] sm:text-6xl">{title}</h1>{selectedCategory ? <p className="mt-5 max-w-xl text-sm leading-6 text-black/60">{selectedCategory.description}</p> : <p className="mt-5 max-w-xl text-sm leading-6 text-black/60">Italian furniture, designer sofas and sculptural armchairs for refined contemporary interiors.</p>}</header><nav aria-label="Product categories" className="mt-14 flex gap-7 text-sm"><FilterLink active={!category} href="/shop">ALL</FilterLink>{categoriesResult.data.map((item) => <FilterLink active={category === item.slug} href={`/shop/${item.slug}`} key={item.id}>{item.name.toUpperCase()}</FilterLink>)}</nav>{catalogResult.error ? <p className="mt-20 text-sm">The collection is temporarily unavailable.</p> : catalog.items.length === 0 ? <p className="mt-20 text-sm text-black/60">No pieces are available in this collection.</p> : <ProductGrid products={catalog.items} />}</main><StorefrontFooter /></div>;
}

function FilterLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) { return <Link className={`font-editorial border-b pb-1 text-base transition-opacity ${active ? "border-black" : "border-transparent opacity-45 hover:opacity-100"}`} href={href}>{children}</Link>; }
function ProductGrid({ products }: { products: StorefrontProduct[] }) { return <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">{products.map((product) => { const cover = product.images[0]; const hover = product.images[1] ?? cover; return <article className="min-w-0" key={product.id}><Link className="group block" href={`/products/${product.slug}`}><div className="relative aspect-square overflow-hidden bg-[#eeece6]">{cover?.url ? <img alt={cover.alt} className="absolute inset-0 size-full object-cover transition-opacity duration-500" src={cover.url} /> : <div aria-label={product.imageAlt ?? product.title} className="size-full bg-[#e6e2d9]" role="img" />}{hover?.url && hover.url !== cover?.url ? <img alt="" className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100" src={hover.url} /> : null}</div><div className="mt-4"><h2 className="text-sm leading-tight tracking-[-.015em]">{product.title}</h2><p className="font-editorial mt-1 text-sm text-black/55">{product.categoryName ?? "Collection"}</p><p className="mt-2 text-sm">{formatCurrency(product.pricePaise)}</p></div></Link></article>; })}</div>; }
