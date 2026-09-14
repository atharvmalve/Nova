import type { MetadataRoute } from "next";
import { getProductCatalog } from "@/services/products";
import { storeConfig } from "@/src/config/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> { const catalog = await getProductCatalog({ page: 1, q: "" }, 48); const pages: MetadataRoute.Sitemap = ["/", "/shop", "/shop/sofas", "/shop/armchairs"].map((path) => ({ url: new URL(path, storeConfig.siteUrl).toString() })); return [...pages, ...catalog.data.items.map((product) => ({ url: `${storeConfig.siteUrl}/products/${product.slug}` }))]; }
