import type { MetadataRoute } from "next";
import { storeConfig } from "@/src/config/store";

export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: ["/", "/shop", "/products/"], disallow: ["/admin/", "/cart", "/checkout", "/api/"] }, sitemap: `${storeConfig.siteUrl}/sitemap.xml` }; }
