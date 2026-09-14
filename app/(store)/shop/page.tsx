import Link from "next/link";

/* Signed Supabase image URLs can use deployment-specific hosts, so these remain native responsive images. */
/* eslint-disable @next/next/no-img-element */

import { StorefrontFooter, StorefrontNavbar } from "@/components/storefront/storefront-shell";
import { getActiveCategories, getProductCatalog, parseCatalogQuery, type StorefrontProduct } from "@/services/products";
import { formatCurrency } from "@/src/lib/currency";

type ShopPageProps = { searchParams: Promise<{ category?: string | string[]; page?: string | string[]; q?: string | string[] }> };

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const query = parseCatalogQuery(await searchParams);
  const [catalogResult, categoriesResult] = await Promise.all([getProductCatalog(query, 24), getActiveCategories()]);
  const catalog = catalogResult.data;
  return <div className="min-h-screen bg-[#f8f7f3] text-black"><StorefrontNavbar /><main className="mx-auto max-w-[1600px] px-5 py-16 sm:px-8 lg:px-12 lg:py-24"><header><p className="font-editorial text-xl">COLLECTION</p><h1 className="mt-4 text-4xl tracking-[-.05em] sm:text-6xl">Furniture for living well.</h1></header><nav aria-label="Product categories" className="mt-14 flex gap-7 text-sm"><FilterLink active={!query.category} href="/shop">ALL</FilterLink>{categoriesResult.data.map((category) => <FilterLink active={query.category === category.slug} href={`/shop?category=${category.slug}`} key={category.id}>{category.name.toUpperCase()}</FilterLink>)}</nav>{catalogResult.error ? <p className="mt-20 text-sm">The collection is temporarily unavailable.</p> : catalog.items.length === 0 ? <p className="mt-20 text-sm text-black/60">No pieces are available in this collection.</p> : <ProductGrid products={catalog.items} />}</main><StorefrontFooter /></div>;
}

function FilterLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) { return <Link className={`font-editorial border-b pb-1 text-base transition-opacity ${active ? "border-black" : "border-transparent opacity-45 hover:opacity-100"}`} href={href}>{children}</Link>; }
function ProductGrid({ products }: { products: StorefrontProduct[] }) { return <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">{products.map((product) => { const cover = product.images[0]; const hover = product.images[1] ?? cover; return <Link className="group min-w-0" href={`/products/${product.slug}`} key={product.id}><div className="relative aspect-square overflow-hidden bg-[#eeece6]">{cover?.url ? <img alt={cover.alt} className="absolute inset-0 size-full object-cover transition-opacity duration-500" src={cover.url} /> : <div aria-label={product.imageAlt ?? product.title} className="size-full bg-[#e6e2d9]" role="img" />}{hover?.url && hover.url !== cover?.url ? <img alt="" className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100" src={hover.url} /> : null}</div><div className="mt-4"><h2 className="text-sm leading-tight tracking-[-.015em]">{product.title}</h2><p className="font-editorial mt-1 text-sm text-black/55">{product.categoryName ?? "Collection"}</p><p className="mt-2 text-sm">{formatCurrency(product.pricePaise)}</p></div></Link>; })}</div>; }
