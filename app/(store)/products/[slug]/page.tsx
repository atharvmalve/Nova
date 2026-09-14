import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { StorefrontFooter, StorefrontNavbar } from "@/components/storefront/storefront-shell";
import { getProductBySlug, type ProductDetail } from "@/services/products";
import { formatCurrency } from "@/src/lib/currency";
import { storeConfig } from "@/src/config/store";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> { const { slug } = await params; const result = await getProductBySlug(slug); if (!result.data) return { title: `Product not found | ${storeConfig.name}`, robots: { index: false, follow: false } }; return { title: result.data.title, description: result.data.description?.slice(0, 160) ?? `Shop ${result.data.title} at ${storeConfig.name}.` }; }

export default async function ProductPage({ params }: ProductPageProps) { const { slug } = await params; const result = await getProductBySlug(slug); if (!result.data && !result.error) notFound(); if (!result.data) throw new Error("Unable to load product."); const product = result.data; return <div className="min-h-screen bg-[#f8f7f3] text-black"><StorefrontNavbar /><main className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12"><Link className="text-xs uppercase tracking-[.15em] text-black/55 transition-opacity hover:opacity-100" href="/shop">← Collection</Link><section className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)] lg:gap-20"><ProductGallery images={product.images} title={product.title} /><ProductInfo product={product} /></section></main><StorefrontFooter /></div>; }

function ProductInfo({ product }: { product: ProductDetail }) { return <div className="lg:pt-8"><p className="font-editorial text-lg text-black/60">{product.categoryName ?? "Novae Collection"}</p><h1 className="mt-3 text-4xl leading-none tracking-[-.055em] sm:text-6xl">{product.title}</h1><p className="mt-6 text-lg">{formatCurrency(product.pricePaise)}</p>{product.description ? <div className="mt-12 border-t border-black/15 pt-6"><p className="text-xs uppercase tracking-[.15em] text-black/50">Details</p><p className="mt-4 whitespace-pre-line text-sm leading-7 text-black/70">{product.description}</p></div> : null}<ProductPurchasePanel product={product} /></div>; }
