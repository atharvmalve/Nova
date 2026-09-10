import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { StorefrontFooter, StorefrontNavbar } from "@/components/storefront/storefront-shell";
import { getProductBySlug, getRelatedProducts, type ProductDetail, type StorefrontProduct } from "@/services/products";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result.data) {
    return { title: "Product not found | NOVA", robots: { index: false, follow: false } };
  }

  const description = result.data.description?.slice(0, 160) ?? `Shop ${result.data.title} at NOVA.`;
  return {
    title: `${result.data.title} | NOVA`,
    description,
    alternates: { canonical: `/products/${result.data.slug}` },
    openGraph: { title: result.data.title, description, type: "website" },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const productResult = await getProductBySlug(slug);

  if (!productResult.data && !productResult.error) {
    notFound();
  }

  if (productResult.error || !productResult.data) {
    throw new Error("Unable to load product.");
  }

  const product = productResult.data;
  const relatedResult = await getRelatedProducts(product.id, product.categoryId);

  return <div className="min-h-screen bg-background"><StorefrontNavbar /><main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12"><Link className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground" href="/shop"><ArrowLeft className="size-4" />Back to shop</Link><section className="mt-6 grid gap-9 lg:grid-cols-[1.05fr_.95fr] lg:gap-16"><ProductGallery images={product.images} title={product.title} /><ProductInfo product={product} /></section>{relatedResult.error ? null : relatedResult.data.length > 0 ? <RelatedProducts products={relatedResult.data} /> : null}</main><StorefrontFooter /></div>;
}

function ProductInfo({ product }: { product: ProductDetail }) {
  return <div className="lg:pt-4"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">{product.categoryName ?? "NOVA collection"}</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{product.title}</h1><p className="mt-4 text-xl font-medium">{formatPrice(product.pricePaise)}{product.compareAtPricePaise ? <span className="ml-3 text-base font-normal text-muted-foreground line-through">{formatPrice(product.compareAtPricePaise)}</span> : null}</p><div className="mt-6 border-y py-5"><p className={`text-sm font-medium ${product.isInStock ? "text-foreground" : "text-destructive"}`}><span className={`mr-2 inline-block size-2 rounded-full ${product.isInStock ? "bg-emerald-500" : "bg-destructive"}`} />{product.isInStock ? "In stock and ready to ship" : "Out of stock"}</p></div>{product.description ? <p className="mt-6 whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.description}</p> : null}<ProductPurchasePanel product={product} /><div className="mt-8 grid gap-3 border-t pt-6 text-sm text-muted-foreground"><p className="flex items-center gap-2"><Check className="size-4 text-foreground" />Secure checkout</p><p className="flex items-center gap-2"><Check className="size-4 text-foreground" />Easy returns</p></div></div>;
}

function RelatedProducts({ products }: { products: StorefrontProduct[] }) { return <section className="mt-20 border-t pt-12"><p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">More to discover</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">You may also like</h2><div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{products.map((product, index) => <Link className="group min-w-0" href={`/products/${product.slug}`} key={product.id}><div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-stone-100"><div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: `linear-gradient(${145 + index * 13}deg, hsl(${38 + index * 18} 28% ${84 - index * 4}%), hsl(${31 + index * 11} 22% ${61 - index * 3}%))` }} /></div><h3 className="mt-3 truncate text-sm font-semibold">{product.title}</h3><p className="mt-1 text-sm text-muted-foreground">{formatPrice(product.pricePaise)}</p></Link>)}</div></section>; }
function formatPrice(paise: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100); }
