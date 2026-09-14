import type { Metadata } from "next";
import "./globals.css";
import { storeConfig } from "@/src/config/store";

export const metadata: Metadata = {
  metadataBase: new URL(storeConfig.siteUrl),
  title: { default: "Novae Studio | Italian Furniture & Luxury Interiors", template: `%s | ${storeConfig.name}` },
  description: storeConfig.description,
  icons: { icon: storeConfig.branding.favicon },
  alternates: { canonical: "/" },
  openGraph: { title: "Novae Studio | Italian Furniture & Luxury Interiors", description: storeConfig.description, url: "/", siteName: storeConfig.name, type: "website" },
  twitter: { card: "summary", title: "Novae Studio | Italian Furniture & Luxury Interiors", description: storeConfig.description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col" style={{ "--primary": storeConfig.branding.primaryColor, "--accent": storeConfig.branding.accentColor } as React.CSSProperties}><script dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [{ "@type": "WebSite", name: storeConfig.name, url: storeConfig.siteUrl }, { "@type": "Organization", name: storeConfig.name, url: storeConfig.siteUrl, logo: new URL(storeConfig.branding.favicon, storeConfig.siteUrl).toString() }] }) }} type="application/ld+json" />{children}</body>
    </html>
  );
}
